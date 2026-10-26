# Firebase Hosting para `vencrm.com` — preparación (NADA de esto está ejecutado)

> Estado (2026-10-25): este documento y los archivos `firebase.json` y `.firebaserc` solo **preparan** el paso de GitHub Pages a Firebase Hosting. No se creó ningún sitio, no se desplegó nada, no se tocó DNS, Auth ni la API key. Cada acción de la §3 necesita la aprobación expresa de John. `github.io` sigue sirviendo el panel y la tienda hasta que todo funcione.

## 1. Qué se agrega al repo

| Archivo | Para qué |
|---|---|
| `.firebaserc` | Proyecto `default` = `tarjeteria-jhon` (producción); alias `prueba` = `tarjeteria-jhon-prueba`. Target de hosting `ven-crm` → sitio `ven-crm` (**el sitio aún no existe**). |
| `firebase.json` | Un solo sitio de Hosting (target `ven-crm`), `public: "."` (raíz del repo), sin `rewrites` (no hay SPA con rutas: `index.html` + `?tienda=…`; un rewrite a `index.html` taparía los 404 de los `.js`/`.css`), `cleanUrls` y `trailingSlash` apagados. |

**Qué NO se publica (`ignore`)**: `docs/`, `tests/`, `.git/`, `.github/`, `**/*.md`, `firestore.rules`, `package.json`, `firebase.json`, archivos ocultos y `node_modules`, y las herramientas de migración que el panel no carga (`migraciones/migrar-pruebas.html`, `migraciones/migracion-ejecutor.js`). **Sí se publica `migraciones/migracion-multiempresa.js`**: `index.html` lo carga. (Una primera versión ignoraba toda la carpeta `migraciones/` y habría roto esa carga; la prueba en Chrome contra el emulador lo detectó.) Resultado: 123 archivos (frente a todo el repo en GitHub Pages). Comprobado con la misma función de listado que usa `firebase deploy` (`listFiles`): ningún archivo referenciado por `index.html`, `sw.js` ni los manifests queda fuera.

**Cabeceras** (todas reales, no `<meta>`):
- Todos los archivos: `Strict-Transport-Security` (1 año), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy: frame-ancestors 'self'` y `Permissions-Policy` (geolocalización, micrófono y cámara solo del propio sitio —el panel usa GPS y grabación de audio—; pagos, USB y FLoC desactivados).
- **La CSP completa sigue en el `<meta>` de `index.html`.** La cabecera solo añade `frame-ancestors` (que un `<meta>` no puede expresar), así que no se combina con nada ni puede romper la CSP actual. Más adelante se puede mover toda la CSP a cabecera, pero requiere repetir la prueba de CSP (`tests/csp-fase13.test.js` y Chrome) y los hashes de estilo; no se hace ahora.
- `sw.js`: `Cache-Control: no-cache, no-store, must-revalidate` y `Service-Worker-Allowed: /` (el navegador siempre revisa si hay un service worker nuevo).
- `index.html`, `/` y `*.html`: `no-cache`. `manifest*.json`: `Content-Type: application/manifest+json` y `no-cache`.
- `*.js`, `*.css`, `*.json`: `max-age=600` (igual que GitHub Pages, 10 min; las URLs con `?v=` siguen rompiendo la caché). Imágenes: `max-age=3600`.
- Las reglas van de la más general a la más específica: en Firebase la última coincidencia gana (verificado en el emulador: `sw.js` y los manifests salen con su cabecera propia, no con la de `*.js`/`*.json`).

## 2. Verificación local (hecha, sin tocar producción)

Emulador de Hosting (`firebase emulators:start --only hosting`, corre solo en `127.0.0.1`) sobre una copia del repo apuntando al proyecto de **prueba** (`node tests/navegador/copia-prueba.js`), más `migraciones/migracion-multiempresa.js`. Nota: el emulador **no aplica** `ignore`; por eso la lista de archivos desplegables se verificó aparte con `listFiles`.

- Cabeceras de la §1 correctas en `/`, `/sw.js`, `/manifest.json`, `/manifest-ven-crm.json`, íconos, `*.js`, `*.css`.
- `index.html`, `sw.js`, `manifest.json` y `js/app.js` se sirven byte a byte iguales a los del repo.
- Chrome real: `tests/navegador/marca-ven-crm.js`, `marca-ven-crm-interior.js`, `tienda-fase23.js` (140 comprobaciones) y `panel-fase23.js` (33): sin fallos, sin violaciones de CSP, sin errores de consola. Panel (sin `?tienda`) = «VEN CRM · Panel» con `manifest-ven-crm.json`; tienda (`?tienda=1`) = «Tarjetería Jhon» con `manifest.json`.
- Service worker en Chrome (con SW activo): se registra con alcance `/`, queda `activated`, precachea 42 recursos, y con el navegador sin conexión el panel sigue abriendo. El iframe del mismo origen (`apps/modelos.html`) carga con `X-Frame-Options: SAMEORIGIN`.
- `npm test`: 292/292.

## 3. Lo que NO se hizo y requiere aprobación de John (en este orden)

1. **Crear el sitio de Hosting** `ven-crm` en `tarjeteria-jhon`: `npx -y firebase-tools@latest hosting:sites:create ven-crm --project tarjeteria-jhon`. Hoy el proyecto solo tiene el sitio por defecto `tarjeteria-jhon` (`https://tarjeteria-jhon.web.app`), que **no tiene ningún despliegue** (responde «Site Not Found»). Si `ven-crm` ya estuviera tomado en todo Firebase, el comando falla; alternativas: `ven-crm-app` o `vencrm`, o usar el sitio por defecto (sin crear sitio) cambiando el target en `.firebaserc`.
2. **Desplegar a un canal de vista previa** (no toca el dominio): `npx -y firebase-tools@latest hosting:channel:deploy vista --only ven-crm --project tarjeteria-jhon --expires 7d`. Probar la URL temporal (`ven-crm--vista-XXXX.web.app`): panel, tienda, instalación de la PWA. Ojo: un canal de vista previa es otro origen; el login **no funcionará ahí** hasta autorizar ese dominio en Auth (sirve para probar carga, no sesión).
3. **Desplegar a producción del sitio** (`firebase deploy --only hosting:ven-crm --project tarjeteria-jhon`). Todavía no tiene dominio, solo `ven-crm.web.app`.
4. **Agregar el dominio personalizado** `vencrm.com` (y `www.vencrm.com` redirigiendo al raíz) en la consola de Hosting (la CLI no lo hace) y **poner los registros DNS en Namecheap** (§4).
5. **Auth → Dominios autorizados**: agregar `vencrm.com`, `www.vencrm.com` y `ven-crm.web.app` (y `ven-crm.firebaseapp.com`). No quitar los actuales.
6. **API key (Google Cloud → Credenciales)**: **añadir** `https://vencrm.com/*`, `https://www.vencrm.com/*`, `https://ven-crm.web.app/*`, `https://ven-crm.firebaseapp.com/*`; conservar `https://jhon01guevara.github.io/*`, `https://tarjeteria-jhon.firebaseapp.com/*` y `https://tarjeteria-jhon.web.app/*`.
7. **reCAPTCHA / App Check y EmailJS**: agregar `vencrm.com` y `www.vencrm.com` a los dominios de la clave reCAPTCHA v3 y a los orígenes permitidos de EmailJS. No activar la imposición de App Check antes de la revisión del 30-oct-2026.
8. Probar en `https://vencrm.com`: login, lectura/escritura, subida de fotos, pedido de prueba, GPS. Solo entonces anunciar.

## 4. Registros DNS en Namecheap (Advanced DNS)

Los valores definitivos los muestra el asistente «Agregar dominio personalizado» de Firebase; el TXT es **único por dominio** y no se puede adivinar. Los valores de Firebase Hosting documentados hoy (2026-03) son:

| Tipo | Host (Namecheap) | Valor | TTL |
|---|---|---|---|
| TXT | `@` | `<valor de verificación que da la consola de Firebase>` (forma `hosting-site=ven-crm` o `firebase=…`) | Automatic |
| A | `@` | `199.36.158.100` | Automatic |
| A | `www` | `199.36.158.100` | Automatic |

Pasos en Namecheap:
1. namecheap.com → **Domain List** → `vencrm.com` → **Manage** → pestaña **Advanced DNS** (el dominio usa «Namecheap BasicDNS»: `dns1/dns2.registrar-servers.com`; no cambiar los nameservers).
2. **Borrar** los registros de aparcamiento que Namecheap crea por defecto: `CNAME` host `www` → `parkingpage.namecheap.com.` y `URL Redirect Record` host `@`. Un `A`/`CNAME` previo en el mismo host choca con el nuevo (Firebase pide quitar cualquier A/AAAA/CNAME conflictivo). No tocar los registros `MX` si se activó «Email Forwarding».
3. **Add New Record** → TXT `@` con el valor de verificación → guardar → en Firebase pulsar **Verificar** (hasta 24 h, normalmente minutos u horas). **No quitar nunca ese TXT**: Firebase lo usa para renovar el certificado.
4. Cuando Firebase lo pida, **Add New Record** → A `@` → `199.36.158.100`, y A `www` → `199.36.158.100` (si se marcó redirigir `www` al raíz, Firebase mostrará el mismo valor). **No agregar AAAA ni CNAME en `@`**.
5. Esperar el estado «Conectado» y el certificado SSL (hasta unas horas). Comprobar con `curl -I https://vencrm.com/` y con el verificador de Google Admin Toolbox (Dig).
6. Namecheap no hace proxy: no hay «nube naranja» que apagar (eso era de Cloudflare). Comprobar que **«Domain Lock»/`client transfer prohibited`** y «Auto-Renew» sigan activos.

Reversión: borrar los registros A y TXT en Advanced DNS (y quitar el dominio en Hosting). `github.io` nunca se toca.

## 5. Lo que NO se cambia todavía (porque la tienda sigue en `github.io`)

- `index.html`: `canonical` y `og:url` apuntan a `https://jhon01guevara.github.io/TARJETERIA-JHON/`. Si no se cambian, `vencrm.com` declarará que su contenido canónico es el de `github.io` (bien mientras haya dos copias idénticas; evita contenido duplicado).
- `robots.txt` y `sitemap.xml`: referencian `github.io`. En `vencrm.com` se servirán tal cual (el `Sitemap:` de `robots.txt` apunta a otro host: Google lo ignora para este dominio). `Disallow: /docs/` sigue siendo válido aunque `docs/` ya no se publique.
- **Misma app, mismo `index.html`**: `https://vencrm.com/?tienda=1` mostrará la tienda de Tarjetería Jhon (con el `<title>` del HTML estático). A largo plazo, separar tienda y CRM en dominios/sitios distintos (otro target de Hosting) y recién entonces cambiar canonical/og/robots/sitemap y `TD.base`.
- Origen nuevo = almacenamiento nuevo (sesión, IndexedDB, service worker, app instalada): ver `docs/MARCA-VEN-CRM.md` §5.7.

## 6. Riesgos

- **Dos fuentes de verdad**: GitHub Pages se publica solo al unir a `main`; Firebase Hosting solo cuando alguien ejecute el deploy. Si no se automatiza, `vencrm.com` puede quedar desactualizado respecto de `github.io`. Opción futura: GitHub Action con cuenta de servicio (requiere crear un secreto: aprobación aparte).
- **Login inutilizable hasta autorizar el dominio en Auth y la API key**: hacerlo (pasos 5 y 6) *antes* de anunciar; probar con una cuenta de prueba.
- **Cabeceras nuevas**: `X-Frame-Options: SAMEORIGIN` bloquea que otro sitio incruste el panel (deseado). Si en el futuro se incrusta desde otro dominio, hay que cambiarlo.
- **`Permissions-Policy`**: si se agrega una función que use otra API (p. ej. Bluetooth/WebUSB) habrá que permitirla.
- **Nombre del sitio** `ven-crm` no verificable hasta crearlo (la URL `ven-crm.web.app` responde 404, lo que sugiere —pero no garantiza— que está libre).
- **Registro de marca «VEN»** pendiente (ver `docs/MARCA-VEN-CRM.md` §3).
- **Costo**: Hosting en plan Spark: 10 GB de almacenamiento y 360 MB/día de transferencia. `catalogo_default.zip` pesa 12 MB y `apps/modelos.js` 1,6 MB: con mucho tráfico a la tienda se pasa del límite diario; en ese caso se necesita el plan Blaze (de pago). Confirmar con John antes de desplegar.
