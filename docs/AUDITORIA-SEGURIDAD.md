# Auditoría de seguridad — TARJETERIA-JHON (Fase 5)

Fecha: 2026-10-24 · Alcance: `firestore.rules`, CSP de `index.html`, `js/app.js` (XSS), `migraciones/`, `sw.js`,
`package.json`, workflow de GitHub Actions, enlaces externos y scripts de terceros.

> **Actualización 2026-10-24:** las reglas endurecidas (propuestas A–D) se probaron con el emulador y en `tarjeteria-jhon-prueba` y están **publicadas en producción**; `firestore.rules` del repo es el texto publicado y las reglas anteriores están en `docs/respaldo-reglas-anteriores-2026-10-24.rules`. El texto de abajo es el informe original y describe el estado previo (hallazgos 1–4 y 8 ya mitigados en reglas).
>
> **Qué es este documento:** un informe de lectura del código del repositorio. **No** tuve acceso a la consola de
> Firebase ni a Google Cloud, así que todo lo que depende de cómo está configurado el proyecto allí (reglas
> publicadas, App Check en modo "Enforce", restricciones de la apiKey, registro abierto de usuarios, datos reales)
> está marcado como **«por verificar»**. No cambié `firestore.rules`: las reglas se publican desde la consola o el CLI de
> Firebase, no desde git, y un error podría dejar sin acceso al panel. Las propuestas están en
> [`PROPUESTA-SEGURIDAD-REGLAS.md`](PROPUESTA-SEGURIDAD-REGLAS.md).

## Resumen

| # | Hallazgo | Gravedad | ¿Cambiado en este PR? |
|---|----------|----------|------------------------|
| 1 | Árbol `empresas/{eid}/…`: la regla comodín da lectura/escritura a todo miembro (incluye `panel/data`, otros vendedores, `miembros`) | **Alta** | No (propuesta) |
| 2 | Varias reglas usan solo `logged()` («tener sesión»), sin comprobar que la cuenta tenga rol | **Alta** | No (propuesta) |
| 3 | En el árbol por empresa, lecturas/escrituras con `logged()` sin pertenecer a esa empresa | **Alta/Media** | No (propuesta) |
| 4 | Pedidos y registros públicos de la tienda: creación sin sesión, sin límite de tamaño en varios campos | Media | No (propuesta + App Check) |
| 5 | Datos de vendedor renderizados al administrador sin escapar (n.º de factura, fecha, pago, cantidad, hora) | Media | **Sí** (`esc()`) |
| 6 | CSP con `style-src 'unsafe-inline'` y `script-src` con CDNs amplios | Media/Baja | **Sí, en parte (Fase 13, PR de la rama `csp-fase-13`)**: `script-src` por ruta exacta; `<style>` sin `unsafe-inline` (`style-src-elem`). Queda `style-src-attr 'unsafe-inline'` (≈1000 `style="…"` en plantillas JS) |
| 7 | App Check: el código ya lo activa, pero falta confirmar proveedor/clave y modo «Enforce» | Media | No (acción manual) |
| 8 | `window.open(…,'_blank')` sin `noopener,noreferrer` | Baja | **Sí** |
| 9 | Workflow: acciones fijadas solo por etiqueta mayor (`@v4`) | Baja | No (propuesta con SHA verificado; ver §4.6) |
| 10 | UID de administrador fijo en reglas y en el cliente | Baja (informativa) | No (a propósito) |

---

## 1. Reglas de Firestore (`firestore.rules`, 377 líneas)

### 1.1 Mapa de colecciones y roles

* **Roles:** el administrador es el UID fijo (línea 15) **o** quien tenga `roles/{uid}.rol == 'admin'` (línea 16).
  El resto son vendedores (`rol: 'vend'`). Los roles solo los escribe el admin (línea 40).
* **Raíz (rutas antiguas):** `roles`, `panel/*` (solo admin), `panel_public/{general,contador,clientes}`,
  `vendedores/{uid}/privado/*`, `catalogo`, `galeria`, `chats` (+`msgs`), `llamadas` (+`ice`), `perfiles`,
  `presencia`, `tienda_items`, `tienda_leads`, `tienda_pedidos`, `investigacion_items`, `wa_conversaciones`,
  `empresas`, `dominios`. Todo lo demás se deniega (líneas 373-375).
* **Árbol por empresa:** `empresas/{eid}/…` (líneas 210-371). **Desde `js/empresa-contexto.js:11`
  (`MULTIEMP=true`) el panel usa estas rutas**, no las de la raíz (`EMP_NEGOCIO`, líneas 59-62).
  Por eso las reglas que realmente protegen el panel hoy son las de este árbol.

### 1.2 ¿Puede un usuario editarse su propio rol? — **No, tal como están escritas**

`roles/{uid}`: `create, update, delete` solo `isAdmin()` (línea 40). `get` del rol propio está permitido pero es de
solo lectura. `perfiles/{uid}` sí es escribible por su dueño (línea 137), pero el panel **no** lee el rol de ahí:
lo lee de `roles` (`js/app.js:4086-4088`). El único camino a la escalada es el **hallazgo 1** (más abajo): un miembro
de empresa puede escribir `miembros/…` y datos del administrador de esa empresa.

### 1.3 Hallazgos

#### H1 — ALTA — Regla comodín del árbol por empresa (`firestore.rules:236-238`)

```
match /empresas/{eid}/{document=**} {
  allow read, write: if esEmpresa(eid);      // admin global O miembro declarado
}
```

En Firestore, si **cualquier** regla que coincide permite la operación, se permite. Esta regla comodín coincide con
**todos** los documentos bajo `empresas/{eid}/`, así que anula las reglas más estrictas escritas debajo (por ejemplo
`panel_public/general` «solo admin escribe», `catalogo`, `tienda_items`, `tienda_leads`, `tienda_pedidos`: líneas
240-312). Consecuencias para un **miembro** (`empresas/{eid}/miembros/{uid}` existe):

* Lee y **escribe** `empresas/{eid}/panel/data` (la base completa del admin: clientes, facturas, ubicaciones,
  agenda y `cfg.users`). En la raíz esto era solo-admin (línea 45).
* Lee y escribe `panel/loginbg`, `wa_conversaciones`, `investigacion_items` (solo-admin en la raíz).
* Lee y escribe `vendedores/{otroUid}/privado/data` de **otros vendedores**.
* Escribe `miembros/…`: puede añadir a cualquiera como miembro (escalada dentro de la empresa).
* Edita el catálogo público de la tienda, y lee/cambia/borra pedidos y registros de clientes de la tienda.

¿Quién es miembro? `js/marketing.js:37-48` (se llama en `marketing.js:63`) hace que **el admin** registre como miembro
a **cada usuario de `cfg.users`** (todos los vendedores) al abrir Marketing Studio. **Por verificar:** si ya se ejecutó
en producción (mirar la colección `empresas/{eid}/miembros` en la consola). Si hay documentos ahí, el riesgo es real hoy.
Para explotarlo hace falta una cuenta de vendedor válida (o comprometida) y el SDK/REST de Firestore, no la interfaz
del panel.

**Recomendación:** cambiar el comodín a `if isAdmin()` (las colecciones que los vendedores necesitan ya tienen su
regla específica debajo). Ver propuesta A. Requiere probar con el emulador y con una cuenta de vendedor de prueba.

#### H2 — ALTA — `logged()` equivale a «cualquier cuenta de Firebase Auth» (varias líneas)

`logged()` solo comprueba `request.auth != null` (línea 10). Se usa como único control en:
`panel_public/general` leer (66), `contador` leer/actualizar (199, 201), `clientes` leer/actualizar (205, 207),
`catalogo` leer (83), `galeria` leer/crear (88-89), `perfiles` leer (136), `chats` crear (98), `llamadas` crear (120) y los
espejos del árbol por empresa (241-270, 336, 315-316).

* `panel_public/clientes` es la **lista compartida de clientes** (`js/app.js:225-260`: nombres, RUC, teléfono…)
  y `panel_public/general` lleva banco, cuenta y Yappy (`PUBLIC_CFG`, `js/app.js:126`). Cualquiera con sesión, aunque no
  tenga rol, podría leerlos y ampliar la lista de clientes.
* Un vendedor **eliminado** (`vendDel`, `js/app.js:4123`) solo pierde su documento `roles/{uid}`; **su cuenta de
  Firebase Auth sigue existiendo** y sigue cumpliendo `logged()`.
* El panel crea cuentas desde el navegador con `createUserWithEmailAndPassword` (`js/app.js:4116`). Eso solo funciona si
  el registro está abierto en Authentication, lo que sugiere que **cualquier persona con la `apiKey` (pública) podría
  crear una cuenta y pasar `logged()`**. **Por verificar** en la consola (Authentication → Configuración → Acciones de
  usuario).
* El comentario de las líneas 5-8 explica que se evitó `exists()` por el rendimiento de las consultas; el compromiso
  es válido, pero hoy deja este hueco.

**Recomendación:** definir `isStaff()` (admin o con documento en `roles`) y usarlo en lugar de `logged()` en los lecturas
de datos de negocio. Ver propuesta C (probar el costo/consultas con el emulador).

#### H3 — ALTA/MEDIA — Multiempresa: lecturas y escrituras entre empresas (`firestore.rules:240-270`)

Los espejos `empresas/{eid}/panel_public/*`, `catalogo`, `galeria` exigen solo `logged()`: una cuenta de la empresa A
puede leer (y en `contador`/`clientes`, actualizar) los de la empresa B si conoce su `eid` (el id es un slug, por
ejemplo `genuine`, ver `docs/ESQUEMA-MULTIEMPRESA.md`). El resto del árbol sí exige miembro, pero con el defecto H1.
La identidad (`roles`) es global: un `admin` por rol es administrador de **todas** las empresas (no hay admin por
empresa). **Recomendación:** exigir `esMiembroEmpresa(eid)` en lecturas/escrituras del árbol (propuesta B), **después**
de comprobar que todos los vendedores existen en `miembros`; si no, perderían acceso.

#### H4 — MEDIA — Creación pública de `tienda_leads` y `tienda_pedidos` (líneas 152-188 y 278-312)

Son públicas por diseño (la tienda no tiene login). Ya validan esquema (`hasOnly`), tipos y varios tamaños, y que
`ref` sea un vendedor real (`validRef`). Pendientes:

* Sin límite para `dir` y `empresa` (leads), ni para el contenido de `lead` (mapa) e `items` (elementos) en pedidos.
  Cada documento puede llegar a ~1 MiB.
* `total` lo envía el cliente y no se compara con los `items` (el precio viaja en el navegador): hay que revisar el
  pedido antes de facturar. El panel ya normaliza lo que lee con `sanLead`/`sanPed` (`js/app.js:856-860`).
* Sin autenticación ni límite de frecuencia: se pueden crear miles de documentos (spam/costo). La mitigación real es
  **App Check en modo Enforce** (hallazgo 7).
* `validRef` usa `exists()` sobre `roles`, lo que permite comprobar qué UIDs son vendedores (bajo; esos UID ya salen en
  los enlaces `?v=` de la tienda).

#### H5 — BAJA/MEDIA — Otras observaciones de las reglas

| Línea | Observación | Gravedad |
|---|---|---|
| 89-90 y 267-269 | `galeria`: al actualizar no se impide cambiar el campo `o` (dueño) | Baja |
| 98 / 315 | `chats`: cualquier cuenta con sesión puede crear un chat e incluir a quien quiera (admin incluido) en `members` | Baja |
| 123 / 339 | `llamadas`: los participantes pueden actualizar cualquier campo (incl. `from`/`to`) | Baja |
| 136 | `perfiles`: toda cuenta con sesión lee todos los perfiles (nombre/foto/emoji) | Baja |
| 201 / 248 | `contador`: cualquiera con sesión puede subir el contador (+1) | Baja |
| 207 / 254 | `clientes`: con sesión se puede reemplazar entradas mientras la lista no se acorte | Media (ver H2) |
| 79 / 258 | Los permisos por «paneles» (`roles.panels`) solo se aplican en el navegador; las reglas no los distinguen | Baja |
| 219-221 | `dominios` y `tienda_items` de lectura pública: es intencional | Informativa |
| 198 | Sangría incorrecta (solo estética) | — |

#### H10 — BAJA (informativa) — UID del administrador escrito en las reglas (`firestore.rules:15`) y en el cliente (`js/app.js:107`)

Un UID **no es un secreto** y por sí solo no da acceso. El riesgo real es de dependencia: si esa cuenta de Google/
Firebase se compromete, el atacante es admin. **No se toca** (los tests `tests/estructura-panel.test.js:72,93` lo exigen
y quitarlo podría dejarlo sin acceso). Recomendación: activar verificación en dos pasos en esa cuenta y en la cuenta de
Google dueña del proyecto de Firebase/Google Cloud.

---

## 2. Content-Security-Policy (`index.html`, vía `<meta>`) — actualizada en la Fase 13

### Valor final (Fase 13)

```
default-src 'self';
script-src 'self' https://www.gstatic.com/firebasejs/10.12.2/ https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/ https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.2/ https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/ https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/ https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/ https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/ https://cdn.jsdelivr.net/npm/jspdf@4.2.1/ https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.recaptcha.net/recaptcha/;
style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
style-src-elem 'self' https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/ https://fonts.googleapis.com/css2 'sha256-Gu7H6yQeElEGEhtaJWUnU8wJfuZQiNi6YYLWWZK0PUM=' 'sha256-rnpydsDSHKnLmE/7pGFQ2D+2Wl3CndNa0hJCgaH8M+0=' 'sha256-UP0QZg7irvSMvOBz9mH2PIIE28+57UiavRfeVea0l3g=';
style-src-attr 'unsafe-inline';
font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com;
img-src 'self' data: blob: https:;
media-src 'self' data: blob: https:;
connect-src 'self' data: blob: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://api.emailjs.com https://www.google.com https://www.recaptcha.net https://www.gstatic.com;
frame-src 'self' blob: data: https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net https://recaptcha.google.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self'
```

| Directiva | Valor (Fase 13) | Evaluación |
|---|---|---|
| `default-src` | `'self'` | Bien |
| `script-src` | `'self'` + **rutas exactas** de cada biblioteca: `gstatic.com/firebasejs/10.12.2/`, cdnjs (`Chart.js/4.4.1/`, `jszip/3.10.2/`, `leaflet/1.9.4/`, `pdf.js/3.11.174/`, `html2canvas/1.4.1/`), jsdelivr (`npm/jspdf@4.2.1/`, `npm/@emailjs/browser@4.4.1/`), `google.com/recaptcha/`, `gstatic.com/recaptcha/`, `recaptcha.net/recaptcha/` | **Sin `unsafe-inline` ni `unsafe-eval`, y ya no se permiten dominios enteros.** Se quitó `apis.google.com` (el panel solo usa correo+contraseña; no hay login con Google/teléfono) |
| `style-src-elem` | `'self'`, `cdnjs…/leaflet/1.9.4/`, `fonts.googleapis.com/css2` y **3 hashes SHA-256** | **Sin `unsafe-inline`.** Aplica a `<style>` y `<link rel=stylesheet>` |
| `style-src-attr` | `'unsafe-inline'` | Necesario: ≈1000 `style="…"` dentro de plantillas JS (ver más abajo) |
| `style-src` | `'self' 'unsafe-inline'` + cdnjs, fonts.googleapis | **Solo respaldo** para navegadores viejos que no conocen `style-src-elem/-attr` (los modernos —Chrome 75+, Firefox 105+, Safari 15.4+— lo ignoran) |
| `connect-src` | self, data:, blob:, `*.googleapis.com`, `*.firebaseio.com`, wss, `*.firebaseapp.com`, emailjs, google/recaptcha, gstatic | Razonable (sin cambios) |
| `img-src` | `'self' data: blob: https:` | Permisivo (cualquier imagen https). Necesario para fotos del catálogo (sin cambios) |
| `object-src`, `base-uri`, `form-action` | `'none'`, `'self'`, `'self'` | Bien |
| `frame-ancestors` | — | No se puede definir con `<meta>`; GitHub Pages no permite cabeceras (clickjacking no mitigable aquí; hay defensa con `js/inicio.js`) |

### Qué se hizo en la Fase 13 (estilos)

* Los **5 bloques `<style>`** de `index.html` (`_akOff`, el principal, `#promoCss`, `#shopStyle`, `#kwaGlow`): 4 pasaron
  **tal cual y en el mismo orden** a `css/panel.css`, enlazado antes de `uber-skin.css` y `accesibilidad.css`, así la cascada no cambia. El quinto, `#_akOff`
  (`html{display:none!important}`, antichequeo de iframe/clickjacking), **se queda en línea** porque tiene que actuar antes de
  cargar nada; se autoriza con su **hash SHA-256**. (`js/inicio.js` lo quita con `getElementById('_akOff')`, igual que antes.)
* `js/app.js` **inyectaba 3 `<style>`** con `createElement('style')` (`#redCss`, `#destCss`, `#mcCss`) → ahora son
  `css/inyectados.css`, enlazado al final del `<head>` (misma posición que tenían al añadirse al final).
* `apps/modelos.html` y `apps/investigacion.html` se cargan en un **`<iframe srcdoc>`, que HEREDA la CSP del panel** (la
  frase antigua «las apps no tienen CSP» no era cierta al abrirse desde el panel). Sus `<style>` pasaron a
  `apps/modelos.css` y `apps/investigacion.css`, y el estilo «cristal» del módulo Check (`CHK_SKIN`, inyectado con `<style>`)
  a `css/chkskin.css`. Se enlazan como `apps/…css` (ruta desde la raíz, porque el `srcdoc` resuelve rutas contra el panel).
* **Ventanas `about:blank` abiertas con `window.open('')` también heredan la CSP.** Hay una que escribe un `<style>` fijo
  (constancia legal, `js/politicas.js`): se autoriza con su hash. `shopPdfPrint` usa solo `style=""` (atributo, permitido).
* **html2canvas 1.4.1** inyecta un `<style>` fijo en el iframe con que clona la página para capturarla (lo usan el PDF de
  facturas, reportes y catálogos): se autoriza con su hash. Si se cambia de versión de la biblioteca hay que recalcularlo.
* `chkLock()` (código sin usar) creaba un `<style>`; ahora usa CSSOM (`style.setProperty`), equivalente y permitido.
* `tests/csp-fase13.test.js` vigila todo esto (hashes, rutas permitidas, que nadie vuelva a crear `<style>`).

### ¿Se puede quitar también `style-src-attr 'unsafe-inline'`? **No, sin romper la interfaz.**

* `style="` escritos dentro de plantillas JS: **854** en `js/app.js`, 67 en `js/marketing.js`, 23 en `js/empresas.js`,
  33 en `apps/investigacion.js` (+20 en su HTML), más 3 en `index.html`.
* Los `style.cssText` / `.style.x=` (CSSOM) no los bloquea la CSP; los atributos `style="…"` insertados con `innerHTML`/HTML sí.
* Riesgo residual: un atacante que lograra inyectar HTML podría usar `style="…"` (p. ej. superponer elementos); no puede
  ejecutar scripts. Camino a largo plazo: pasar esos estilos a clases CSS y entonces retirar `'unsafe-inline'` de `style-src-attr`.
* Los 3 `style="` de `index.html` no se movieron: no aportan nada mientras `style-src-attr` siga permitiéndolos.

### CDNs en `script-src` (Media/Baja → mitigado)

Antes se permitían **dominios enteros** (`cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `www.gstatic.com`, `www.google.com`,
`www.recaptcha.net`, `apis.google.com`). Ahora solo las rutas de la tabla (en CSP una ruta que termina en `/` vale por
prefijo; se comprobó con `curl -I` que ninguna URL de `index.html`/`apps/` redirige a otra ruta). Además todos los scripts
de CDN tienen **SRI** (ver §7).

Lo que se comprobó en un Chrome real (ver `docs/GUIA-PRUEBAS-CSP.md`): carga de todas las bibliotecas, reCAPTCHA Enterprise
(`www.google.com/recaptcha/enterprise.js` + `www.gstatic.com/recaptcha/releases/…` + iframe `…/recaptcha/enterprise/anchor`),
pdf.js con su worker local (`js/pdf.worker.min.js`, `'self'`), Firebase Auth/Firestore, jsPDF + html2canvas generando PDF,
Leaflet, Chart.js, y los iframes de Check e Investigación: **0 violaciones nuevas**.

**No verificado (no hay navegador real con los datos/permisos para ello):** envío real de EmailJS (la copia de prueba lo
tiene desactivado; EmailJS usa `connect-src`, que no cambió); el token real de App Check con la clave de producción (la clave
solo vale en `jhon01guevara.github.io`); Safari/Firefox/iOS (solo se probó Chrome 156); ni una descarga real del catálogo ZIP
(`catalogo_default.zip` no está en la copia de prueba).

### Problema previo que se encontró (no causado por la Fase 13)

En la consola aparece «Executing inline event handler violates the following Content Security Policy directive» (una vez al
abrir ciertas pantallas). Viene de `onclick="shopBrandSave()"`, `onchange="shopLogoUpload(event)"`, etc. escritos a mano en
`js/app.js` (≈ líneas 2829–2933, ajustes de la tienda): esos botones llevan **además** `data-h-click`, que es lo que sí funciona,
así que solo es ruido de consola (el `onclick` sobrante se puede borrar). **Sí está realmente bloqueado** el
`onclick="window.print()"` del botón «Imprimir» de la constancia legal (`js/politicas.js`): ahí se imprime con Ctrl+P.
Pasa igual en `main` (comprobado con el mismo recorrido). Queda en la lista de pendientes.

---

## 3. XSS: usos de `innerHTML` en `js/app.js`

`js/app.js` tiene 146 líneas con `innerHTML` (154 apariciones), 3 `insertAdjacentHTML` y ningún `eval`/`new Function`; el
`document.write` de `app.js:662` escapa con `esc()` y el de `app.js:3742` solo escribe HTML estático.

**Método:** recorrí las 1 275 interpolaciones `${…}` de `app.js`. Las que están dentro de `esc()`, `_ha()`, `$$()` o son
cálculos numéricos no necesitan acción; revisé a mano las ~290 que son variables o propiedades sueltas.

**Defensas que ya existen (bien hechas):**

* `esc()` (`app.js:397`) escapa `& < > " '` y se usa 236 líneas / 431 veces para nombres, descripciones, notas, direcciones,
  etc. de clientes, productos, agenda, chat y pedidos.
* No hay manejadores `onclick=` en línea: se usa `data-h-click` + `_ha()` (`app.js:3`), compatible con la CSP.
* Lo que llega de la tienda pública se normaliza con `sanLead`/`sanPed`/`sanGal` (`app.js:856-864`: id seguro, longitudes
  máximas, números forzados). `_okImg` (`app.js:2211`) solo acepta `data:image/png|jpeg|gif|webp;base64`.

**Casos encontrados sin escapar y arreglados (equivalentes para datos normales):**
datos que **un vendedor puede escribir** en su documento `vendedores/{uid}/privado/data` y que el **administrador**
renderiza al revisar facturas (`app.js:140-165`, `escucharVendedores`):

| Campo | Líneas (aprox.) |
|---|---|
| `f.n` (n.º de factura) | listados, vista de factura, vista previa, «Cobros pendientes», informe |
| `fdate(f.fecha)`, `fdate(f.credito.vence)`, `venc` | idem |
| `f.pago`, texto de crédito en `facL()` | tabla de facturas, factura |
| `i.q` (cantidad) | tablas de factura (dos plantillas) |
| `f.itbmsp` / `pc` | factura (dos plantillas) |
| `e.h`, `e.h2` (hora de agenda) | agenda, tarjetas, aviso |

Ahora van con `esc()`. Para números y textos normales el resultado es idéntico (los 98 tests pasan).
**Impacto real antes del arreglo:** acotado, porque la CSP bloquea scripts y manejadores en línea; aun así permitía
inyectar HTML/estilos (por ejemplo, un falso formulario) en la pantalla del administrador.

**Casos que detecté y NO cambié** (hay que comprobar equivalencia o son datos que solo escribe el admin):

| Línea | Qué | Por qué se deja |
|---|---|---|
| 464 | `https://wa.me/${c.wa}` (configuración del admin) | Solo la edita el admin |
| 1352, 1426, 4549 | `u.lat,u.lng` / `c.lat,c.lng` en `href` de Google Maps | Los pueden escribir vendedores (ubicaciones/clientes). `esc()` o `Number()` los dejaría igual si son números; falta confirmar el tipo guardado |
| 1008, 1243, 1156 | `src="${DB.cfg.logoFac}"` / `c.logoFac` | Configuración del admin |
| 1102-1103, 1574, 3378, 3666, 3702, 3726 | `src="${f.thumb}"`, `i.img` | Catálogo y tienda: escritos por el admin |
| 4500 | colores `cfg.*` en SVG | Configuración del admin |

No analicé `apps/investigacion.js` (20 `innerHTML`), `apps/modelos.js` (4), `js/marketing.js` (5, 1 `insertAdjacentHTML`),
`js/empresas.js` (4) ni `js/tema.js` (1) línea por línea: **por revisar**.

---

## 4. Otras revisiones

### 4.1 `migraciones/` — Baja
Tres archivos (`migracion-ejecutor.js`, `migracion-multiempresa.js`, `migrar-pruebas.html`). **No hay claves privadas,
contraseñas ni tokens.** Sí contienen el UID del admin (`migrar-pruebas.html:113`) y la `apiKey` pública
(`migrar-pruebas.html:114`), igual que `app.js`. `index.html:1791` carga `migracion-multiempresa.js` en el panel
real. Recomendación: sacar `migraciones/` del sitio publicado cuando termine la migración (el historial lo conserva).
No hallé secretos en el resto del repo (búsqueda de `PRIVATE KEY`, `secret`, `token`, `password`, `AIza…`, `sk_live`).

### 4.2 `apiKey` de Firebase (`js/app.js:90`) — Informativa
La `apiKey` de un proyecto web de Firebase **es pública por diseño**: identifica el proyecto, no autoriza nada. La
seguridad depende de las reglas, de Authentication y de App Check. **Aun así conviene restringirla por dominio** (pasos en
§6). EmailJS (`app.js:104`): la clave pública y los ids también son públicos por diseño; configure en su cuenta de
EmailJS los dominios permitidos.

### 4.3 App Check — Media (**por verificar**)
`js/app.js:98-119`: el código **sí activa** App Check (`RECAPTCHA_V3_SITE_KEY` ya no es el texto de ejemplo) y
`index.html:24` carga `firebase-app-check-compat.js` con SRI. Dos dudas que no puedo resolver sin la consola:

1. El comentario habla de **reCAPTCHA v3**, pero el código usa `ReCaptchaEnterpriseProvider` (línea 118). Si la clave es de
   v3 clásico, debería ser `ReCaptchaV3Provider`; si es Enterprise, está bien. Si no coinciden, los tokens fallan en
   silencio (el `try/catch` lo oculta) y App Check no protege.
2. Aunque el cliente lo active, **no protege nada hasta que se pulse «Enforce»** en Firestore/Authentication/Storage.

### 4.4 Service worker (`sw.js`) — Baja
* Estrategia «red primero»; solo intercepta `GET` del **mismo origen** (línea 10). Las llamadas a Firestore/Auth/Storage
  (otros dominios) no pasan por la caché, por lo que **no se cachean datos privados de Firestore**.
* Precarga solo archivos estáticos (`index.html`, `app.js`, `apps/*`, logos).
* Observaciones: cualquier respuesta `ok` del mismo origen se guarda sin límite de tamaño; el panel (HTML/JS) queda
  disponible sin conexión a quien tenga el navegador. Sin riesgo de privacidad de datos.

### 4.5 Dependencias (`package.json`) — Sin hallazgos
No hay `dependencies` ni `devDependencies` (solo el script `node --test`). `npm audit` no se puede ejecutar sin
lockfile y no habría nada que auditar. Las librerías reales son las de CDN (todas con SRI y versión fija).

### 4.6 Workflow (`.github/workflows/facturacion.yml`) — Baja
* `permissions: contents: read` (mínimo): **bien**.
* Acciones fijadas por etiqueta móvil (`@v4`). **Propuesta (no incluida en este PR):** fijarlas por SHA de commit completo,
  verificado con la API de GitHub el 2026-10-24:
  `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2` y
  `uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0`.
  No se pudo subir: la autorización de GitHub del equipo de trabajo no tiene el permiso `workflow`, y GitHub rechaza cambios en
  `.github/workflows/` sin él. Puede aplicarlo usted editando el archivo en GitHub (lápiz → pegar las dos líneas → *Commit*).
* Corre en `push` y `pull_request` sin secretos: sin riesgo para PR de forks.
* Observación: `node-version: 20` — Node 20 llegó a fin de vida en abril de 2026; conviene subir a 22 LTS cuando se
  verifique que `npm test` pasa (no cambiado).

### 4.7 Enlaces externos / `window.open` — Baja
* No hay `<a target="_blank">` sin `rel` (los de `app.js:437` y `464` ya llevan `noopener noreferrer`).
* `window.open(url,'_blank')` **sin** `noopener` en 13 lugares (WhatsApp, Google Maps y enlaces pegados por el usuario,
  p. ej. `app.js:1378`, `1452`): la pestaña abierta podía acceder a `window.opener` (*reverse tabnabbing*). **Cambiado**
  a `window.open(url,'_blank','noopener,noreferrer')` en todos los que abren sitios externos; ningún código usa el valor
  devuelto. No se tocaron los que abren `about:blank` para imprimir (`app.js:661`, `3742`), que necesitan el handle, ni los
  que abren la propia tienda (`4755`, `4770`).

### 4.8 Scripts de terceros / SRI — Bien
Todos los `<script>` y la hoja de Leaflet de `index.html` y de `apps/modelos.html` llevan `integrity` (sha384) y
`crossorigin`. Excepción inevitable: Google Fonts (`index.html:17`, `apps/investigacion.html:7`) no admite SRI.

---

## 5. Cambios de código incluidos en este PR

1. `js/app.js`: `esc()` en campos de factura y agenda renderizados al admin (ver §3).
2. `js/app.js`: `window.open(…,'noopener,noreferrer')` en 13 llamadas externas (§4.7).
3. Documentación: este archivo y `PROPUESTA-SEGURIDAD-REGLAS.md`.

**No se tocó (en ese PR de la fase de auditoría):** `.github/workflows/` (solo propuesta, §4.6), `firestore.rules`, la CSP, `index.html`, `sw.js`, `package.json`, `migraciones/`, la lógica de ninguna regla ni el UID.

---

## 6. Pasos manuales para el dueño (en español, en la consola)

> Haga **una cosa a la vez**, pruebe el panel y la tienda después de cada paso, y anote el valor anterior por si necesita
> deshacerlo. Nunca comparta capturas con claves o tokens.

### 6.1 Ver cuántos miembros hay y quién tiene sesión (solo lectura, sin riesgo)
1. Firebase Console → proyecto **tarjeteria-jhon** → **Firestore Database → Datos**.
2. Abra `empresas` → cada empresa → `miembros`. Anote cuántos usuarios hay (esto confirma o descarta H1).
3. **Authentication → Usuarios**: compare con la lista de vendedores del panel; elimine cuentas que ya no usa.
4. **Authentication → Configuración → Acciones de usuario**: revise si el **registro de usuarios** está abierto (relacionado
   con H2). No lo desactive todavía: el panel crea vendedores desde el navegador y dejaría de funcionar.

### 6.2 App Check (recomendado, pero con modo de prueba primero)
1. **Build → App Check → Apps →** su app web. Confirme el proveedor: **reCAPTCHA Enterprise** (el código usa
   `ReCaptchaEnterpriseProvider`) y que la clave de sitio coincide con `app.js:98`.
2. Abra el panel y la tienda normalmente y espere unas horas/días. En **App Check → Solicitudes** (métricas por
   producto) mire el porcentaje de solicitudes **verificadas**.
3. Solo cuando casi el 100 % esté verificado, pulse **Aplicar (Enforce)** en **Cloud Firestore** (después, en
   Authentication y Storage si los usa). Si algo falla, vuelva a «Sin aplicar» y se corrige al instante.

### 6.3 Restringir la apiKey por dominio (Google Cloud)
1. [console.cloud.google.com](https://console.cloud.google.com) → proyecto **tarjeteria-jhon** → **APIs y servicios → Credenciales**.
2. Abra la clave de navegador (**«Browser key»** / la que termina en `…Ty1Msrs`).
3. **Restricciones de la aplicación → Sitios web (referentes HTTP)** y añada, uno por línea:
   `https://jhon01guevara.github.io/*`, `https://tarjeteria-jhon.firebaseapp.com/*`,
   `https://tarjeteria-jhon.web.app/*` (y su dominio propio si lo tiene).
4. **Restricciones de API → Restringir clave** y deje solo las que usa: *Identity Toolkit API*, *Token Service API*,
   *Cloud Firestore API*, *Firebase Installations API*, *Firebase App Check API*, *reCAPTCHA Enterprise API*,
   *Cloud Storage for Firebase*/*Firebase Storage API* (si usa Storage). Si algo del panel falla, el mensaje de error de la consola del navegador indica
   qué API falta.
5. Guarde (tarda unos minutos), pruebe inicio de sesión, facturas y tienda. Para deshacer: quite las restricciones.

### 6.4 Probar y publicar reglas (hecho el 2026-10-24; procedimiento en `docs/DESPLIEGUE-REGLAS.md`)
Siga `docs/PROPUESTA-SEGURIDAD-REGLAS.md`: primero el emulador con las pruebas, luego una cuenta de vendedor de prueba,
y **antes de publicar copie el texto de reglas actual** (Firestore → Reglas) en un archivo. Publique en horario de poco uso.

### 6.5 Cuentas
Active la **verificación en dos pasos** en la cuenta de Google del administrador y en la que es dueña del proyecto Firebase/Google Cloud.

---

## 7. Qué no pude comprobar
* Reglas realmente publicadas en Firebase (puede diferir del archivo del repo).
* Estado de App Check (Enforce o no), restricciones de la apiKey, registro abierto en Authentication.
* Si `empresas/{eid}/miembros` ya contiene a los vendedores (determina el alcance real de H1).
* Datos reales de Firestore (formato de `lat/lng`, `n`, `fecha`, etc.).
* Comportamiento en navegador/móvil: el cambio de `window.open` y de `esc()` se verificó por código y tests, **no** en un navegador.
* (Informe original) Las reglas propuestas no se ejecutaron entonces en el emulador. Después sí: 27 pruebas con emulador y prueba manual en `tarjeteria-jhon-prueba` antes de publicar.
