# Marca VEN CRM (panel) — qué cambia y cómo conectar el dominio

> Estado (2026-10-25): **marca aplicada al panel (PR 36 y 37, en `main`). El dominio `vencrm.com` YA ESTÁ COMPRADO en Namecheap** (RDAP: registrado el 2026-10-26 00:30 UTC = 2026-10-25 7:30 p. m. Panamá; nameservers `dns1/dns2.registrar-servers.com`, o sea el DNS se administra en Namecheap; estado `client transfer prohibited`). **Todavía NO está conectado a nada**: no hay sitio de Hosting `ven-crm`, ni registros DNS, ni dominio autorizado en Auth, ni cambio en la API key. La preparación de Hosting está en `firebase.json`, `.firebaserc` y `docs/HOSTING-VEN-CRM.md` (los pasos de consola y DNS, adaptados a Namecheap, están ahí). Ningún paso de la sección «Conectar el dominio» se ejecutó: se hacen uno por uno, con aprobación de John.

## 1. La marca

- Nombre: **VEN CRM** (de «venta»). Estilo minimalista tipo Uber/SpaceX: negro `#000000` y blanco `#FFFFFF`, sin colores de acento; textos con Inter.
- Símbolo: una **V geométrica** simétrica (rejilla de 100×100: `18,18 · 34,18 · 50,53.3 · 66,18 · 82,18 · 53,82 · 47,82`; flancos paralelos, base plana de 6 unidades).
- Logo horizontal: «VEN» (letras dibujadas como trazados, **sin depender de ninguna fuente**) + etiqueta «CRM» recortada en una caja. Versión clara (negro sobre blanco) y oscura (blanco sobre negro).
- Archivos en `assets/ven-crm/`: `favicon.svg`, `icono-app.svg`, `ven-crm-horizontal-claro.svg`, `ven-crm-horizontal-oscuro.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (V dentro de la zona segura: círculo del 40 %), `apple-touch-icon-180.png`, `favicon-32.png`, `og-image.png` (1200×630).
- El kit completo (fuentes, PNG 48/96/192/512, favicon.ico, hoja `marca.png`) vive fuera del repo en `/workspace/marca-ven-crm/` de la caja del asistente; el repo solo lleva lo que usa el panel.

## 2. Qué cambia en el repo (solo el PANEL)

| Pieza | Cambio |
|---|---|
| `manifest-ven-crm.json` | Manifest propio: `name`/`short_name` «VEN CRM», `id: "ven-crm"`, fondo y tema negros, 3 íconos (192, 512, maskable 512). |
| `js/marca-crm.js` (nuevo, en `<head>`) | Si la URL **no** lleva `?tienda=…`: cambia el `<link rel=manifest>`, favicon, apple-touch-icon, `apple-mobile-web-app-title`, `theme-color`, `og:site_name/title`, `twitter:title` y `document.title` («VEN CRM · Panel»), y pone `html.ven-crm`. Si lleva `?tienda=…`: **no hace nada**. Expone `window.TJMarca`. |
| `css/marca-ven-crm.css` (nuevo) | Fondo negro y auroras grises en el acceso + estilo del logo. Todos los selectores van acotados a `html.ven-crm` / `.vlogo`. |
| `js/app.js` → `authUI` | En el panel el acceso muestra el logo VEN CRM (arriba), luego el logo propio de la empresa si lo tiene configurado, y el pie «Acceso restringido · VEN CRM». En la tienda queda como antes. `?v=` de `app.js`: `modulos-fase-24d`. |
| `index.html` | Dos líneas nuevas (script y CSS, `?v=marca-ven-crm-1`) y el `?v=` de `app.js`. El HTML estático **sigue siendo el de Tarjetería Jhon** (por eso la vista previa de WhatsApp/Google de la tienda no cambia). |
| `sw.js` | Caché `tj-net-first-24`; precachea manifest, logo, ícono, script y CSS nuevos. |
| `tests/marca-ven-crm.test.js`, `tests/navegador/marca-ven-crm.js` | Pruebas (ver §4). |

**No cambia:** `manifest.json` (tienda y copia instalada anterior), íconos de Tarjetería, la CSP, las reglas de Firestore, ni el logo, nombre y lema de cada empresa (el CRM es multiempresa: su logo sigue siendo el primer `.logo img`, del que leen facturas, informes y PDF), ni la tienda, ni las facturas e impresiones.

## 3. Pendientes de marca que NO hace esta rama
- Re-teñir el interior del panel (acentos rosados `#E0457B`, temas) con la paleta VEN. Hoy solo el acceso, el manifest y los íconos son VEN.
- `canonical`, `og:url`, `robots.txt` y `sitemap.xml` siguen apuntando a `jhon01guevara.github.io`: se cambian el día que exista el dominio.
- Textos internos que dicen «Panel de Facturación» (encabezado `.rt`, sidebar).
- Registro de marca: antes de comprar el dominio, buscar «VEN» / «VEN CRM» en la clase 9/35/42 (SIC Panamá, WIPO Global Brand Database, USPTO/EUIPO). Es un nombre corto y muy genérico.

## 3b. Interior del panel (PR «marca-ven-crm-panel»)

Todo bajo `html.ven-crm` (solo el panel; la tienda `?tienda=` nunca tiene esa clase). El HTML estático de `index.html` NO cambia (por eso la vista previa y la tienda siguen siendo Tarjetería Jhon): `js/marca-crm.js` aplica `TJMarca.interior()` al cargar el DOM, solo en el panel y de forma idempotente.

| Pieza | Cambio en el panel |
|---|---|
| Barra lateral | Logo horizontal VEN CRM arriba (dentro del `<h1>` de la marca; en nocturno se invierte). Debajo, la tarjeta de la empresa **tal cual** (logo, nombre, lema). |
| Cabecera | Símbolo V (30 px) a la izquierda del título; el rótulo pasa de «Tarjetería Jhon · Panel de Facturación» a «Tarjetería Jhon · VEN CRM»; el `<h1>` oculto, a «VEN CRM · Tarjetería Jhon». En móvil (sin barra lateral) el símbolo es la marca. |
| Pie | «VEN CRM» bajo los botones de respaldo (solo admin, como el resto del pie). |
| Menú | Iconos monocromos (blanco sobre `#1f1f1f`; ítem activo: píldora negra con ícono blanco; en nocturno, píldora blanca). Sin degradados de color por módulo. |
| Acento | Anillo de foco azul `#1A56DB` (7,0:1 sobre blanco; `#7FA8FF` en nocturno). El resto: negro/blanco/grises de `uber-skin.css`. |
| Gráficos | `app.js`: la dona de categorías usa `TJMarca.paleta` (negro, azul, grises) solo en el panel; el respaldo conserva la paleta anterior. `?v=modulos-fase-24e`. |
| Service worker | `tj-net-first-25`; precachea el logo claro y el símbolo. |

**No cambia:** logo/nombre/lema de la empresa (se mide su alto, ancho y `src` antes/después), `#prt` (facturas e impresiones), informes, catálogo en PDF, tienda, CSP, reglas de Firestore, `manifest.json`.

Prueba en Chrome real: `tests/navegador/marca-ven-crm-interior.js` (ver comentario de cabecera; `ANTES=` compara contra una copia de `main`).

## 4. Cómo probar
```
npm test                                   # 11 pruebas de marca + 9 del interior
node tests/navegador/copia-prueba.js /tmp/copia-ven        # copia apuntando al proyecto de PRUEBA
(cd /tmp/copia-ven && python3 -m http.server 8961 --bind 127.0.0.1) &
BASE=http://127.0.0.1:8961/ PW=<ruta>/playwright-core SHOTS=/tmp/capturas node tests/navegador/marca-ven-crm.js
```
La prueba de Chrome abre el acceso (escritorio y móvil) y la tienda (`?tienda=1`), pide a Chrome el manifest real (`Page.getAppManifest`), verifica título, íconos, logo cargado, pie, ausencia de desbordes, de errores y de violaciones de CSP. No inicia sesión ni escribe datos.

A mano: abrir el panel (sin `?tienda`) → pestaña del navegador «VEN CRM · Panel» con la V; DevTools → Application → Manifest → «VEN CRM» con 3 íconos; abrir `?tienda=1` → sigue «Tarjetería Jhon».

## 5. Conectar el dominio `vencrm.com` (NO ejecutado)

> Hacer en este orden (la versión detallada, con comandos y registros DNS exactos para Namecheap, es `docs/HOSTING-VEN-CRM.md`). Cada paso es reversible hasta el 7. Mantener `github.io` funcionando todo el tiempo.

**0. Antes de comprar.** Repetir la comprobación de disponibilidad (RDAP de Verisign: `https://rdap.verisign.com/com/v1/domain/vencrm.com`; 404 = libre) y la búsqueda de marcas (§3). Al 2026-10-25 figuraba libre.

**1. Comprar el dominio** — ✅ **HECHO en Namecheap** (2026-10-25). Pendiente de verificar en la cuenta de Namecheap: 2FA activo, renovación automática, bloqueo de transferencia (ya figura `client transfer prohibited`) y privacidad WHOIS. El DNS queda en Namecheap («Advanced DNS»); **no se usa Cloudflare**.

**2. Decidir dónde se sirve el panel.** Hoy el panel se sirve desde GitHub Pages (`https://jhon01guevara.github.io/TARJETERIA-JHON/`) y el repo **no tiene `firebase.json`**. Dos caminos:
- **A. Firebase Hosting (recomendado, ya usamos Firebase):** en el proyecto `tarjeteria-jhon`, `firebase init hosting` (carpeta pública = raíz del repo, sin reescribir a `index.html`, ignorar `docs/`, `tests/`, `.git`, `*.md`, `firestore.rules`), cabeceras reales de seguridad (`X-Frame-Options`, `Strict-Transport-Security`, etc.). Primero desplegar a un **canal de vista previa** (`firebase hosting:channel:deploy vista --only ven-crm --project tarjeteria-jhon`) y probar ahí. Sitio nuevo, p. ej. `ven-crm`, para no tocar `tarjeteria-jhon.web.app`.
- **B. Seguir en GitHub Pages con dominio propio:** archivo `CNAME` con `vencrm.com` + DNS (4 registros A de GitHub y `www` CNAME a `jhon01guevara.github.io`). Pero un sitio de Pages tiene un solo dominio: la **tienda pública dejaría de servirse en `github.io/TARJETERIA-JHON`** (redirige). No recomendado mientras la tienda viva en el mismo repo.

**3. Dominio personalizado en Firebase Hosting (camino A).** Consola → Hosting → «Agregar dominio personalizado» → `vencrm.com` (y `www.vencrm.com` redirigiendo al raíz). Firebase da un registro TXT de verificación y registros A/AAAA. En Namecheap (Domain List → Manage → **Advanced DNS**) agregarlos tal cual se listan en `docs/HOSTING-VEN-CRM.md` §4 (A `@` y A `www` a `199.36.158.100`, TXT `@` de verificación) y **borrar** los registros de parking que Namecheap crea por defecto (CNAME `www` → `parkingpage.namecheap.com` y «URL Redirect Record» `@`). No hay proxy: el certificado SSL lo emite Firebase y puede tardar hasta unas horas.

**4. Firebase Auth → dominios autorizados.** Consola → Authentication → Configuración → Dominios autorizados → agregar `vencrm.com` y `www.vencrm.com` (y el dominio de Hosting nuevo). **Sin esto el inicio de sesión falla en el dominio nuevo.** No quitar `jhon01guevara.github.io` ni `tarjeteria-jhon.firebaseapp.com`. El código usa correo/contraseña, así que `authDomain` en `firebaseConfig` no necesita cambiar.

**5. Restricción de la API key (Google Cloud → APIs y servicios → Credenciales).** La clave del navegador de `firebaseConfig`: restricción «Sitios web (referentes HTTP)». **Añadir** `https://vencrm.com/*`, `https://www.vencrm.com/*` y el dominio de Hosting nuevo, y **conservar** `https://jhon01guevara.github.io/*`, `https://tarjeteria-jhon.firebaseapp.com/*`, `https://tarjeteria-jhon.web.app/*` hasta que todo funcione en el dominio nuevo. Dejar las restricciones de API actuales. Probar login + lectura/escritura + subida de fotos desde `vencrm.com` **antes** de quitar nada. Solo al final (y con aprobación) retirar los orígenes que ya no se usen.

**6. Revisión de CSP y App Check.**
- CSP (`<meta>` de `index.html`): usa `'self'`, así que el propio dominio nuevo ya está cubierto; no hay que ampliarla. Revisar solo si se añade `authDomain` propio (entonces `frame-src`/`connect-src` necesitan ese host) o un dominio de EmailJS distinto. Pasar `tests/csp-fase13.test.js` y la prueba de Chrome sin violaciones. Con Firebase Hosting, además fijar la CSP como **cabecera** y no solo `<meta>`.
- App Check (reCAPTCHA v3): agregar `vencrm.com` y `www.vencrm.com` a los dominios de la clave reCAPTCHA y, si se usa el proveedor de depuración para pruebas, registrar los tokens. Mientras App Check esté en modo «sin imponer» no rompe nada; **no activar la imposición (enforce) hasta que la revisión del 30-oct-2026 (9:00 a. m. Panamá) confirme < 1 % de clientes antiguos y ningún origen desconocido**, y hacerlo solo en Firestore al principio.
- EmailJS: si la cuenta limita orígenes, permitir el dominio nuevo. Plantillas de correo de Auth (restablecer contraseña) apuntan al dominio de Firebase: opcionalmente configurar el dominio personalizado para esos correos.

**7. Migración de usuarios (importante).** Un origen nuevo = almacenamiento nuevo. En `vencrm.com` **no existen** la sesión, el `localStorage`/IndexedDB (respaldo local, fondo de acceso, borradores, claves por empresa) ni el service worker ni la app instalada del dominio viejo. Antes de anunciar el dominio: «⬇ Respaldo» en cada empresa, avisar a los usuarios que volverán a iniciar sesión y reinstalar la PWA («VEN CRM»). Dejar en `github.io` un aviso con el enlace nuevo durante unas semanas.

**8. SEO y enlaces.** Ya con el dominio funcionando: actualizar `canonical`, `og:url`, `robots.txt`, `sitemap.xml`, la base del enlace de tienda (`TD.base` en la configuración de la tienda) y el `start_url`/`id` del manifest si hace falta. **Los enlaces de la tienda que ya se compartieron (`github.io/...?tienda=1`) deben seguir funcionando**; si en `vencrm.com` se sirve el mismo `index.html`, la tienda también responderá allí con marca Tarjetería (no es lo deseado a largo plazo: separar tienda y CRM en dominios distintos).

**9. Correo del dominio (opcional).** «Email Forwarding» de Namecheap (gratis) para `soporte@vencrm.com` (añade registros MX en Advanced DNS; no borrarlos al limpiar el parking); SPF/DKIM/DMARC si se enviará correo desde el dominio.

**Plan de vuelta atrás.** Quitar el dominio en Firebase Hosting / borrar los registros DNS; `github.io` nunca se tocó. Revertir esta rama = `git revert` del PR (no reescribir historial).

## 6. Riesgos conocidos
- `tests` pinean `?v=`/caché: se respetaron (`marca-ven-crm-N`, `modulos-fase-24d`, `tj-net-first-24`).
- La app instalada anterior («Tarjetería Jhon · Panel de Facturación») y la nueva («VEN CRM») tendrán `id` distinto: pueden verse dos instalaciones hasta desinstalar la vieja.
- `manifest.json` de la tienda sigue diciendo «Panel de Facturación» en su nombre (heredado, fuera del alcance de esta marca).
- Chrome puede tardar en refrescar el nombre/ícono de una PWA ya instalada.
