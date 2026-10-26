# Lista antes de unir y desplegar VEN CRM

> Prioridad número uno: **que no se rompa nada**. Esta lista es corta a propósito. Si un punto falla, **no se une ni se despliega** hasta arreglarlo.
> Hay dos "publicaciones" distintas: **GitHub Pages** (se actualiza sola al unir a `main`) y **vencrm.com** (Firebase Hosting, sitio `vencrm-app`, se despliega **a mano**).

## 1. Antes de unir un PR a `main`

Marque cada punto. Todo en la carpeta del repo.

- [ ] **Pruebas automáticas en verde:** `npm test` (todas pasan; hoy son más de 355).
- [ ] **Comprobaciones estáticas en verde:** `npm run comprobar` (sintaxis de todos los `.js`, que cada archivo que carga `index.html` exista, que el service worker liste archivos que existen y que Firebase Hosting no deje fuera nada necesario). El CI también las corre.
- [ ] **Suite de humo en Chrome real en verde:** `PRUEBA_PASSWORD=… npm run humo` (ver sección 5). Si falla, mire la captura que indica y arregle antes de seguir. Solo usa el proyecto de **prueba**.
- [ ] **Versión del service worker:** si cambió cualquier archivo que guarda `sw.js` (casi todo `js/`, `css/`, `index.html`, manifests, iconos), suba el número de `const V='tj-net-first-NN'` en `sw.js`. Así los usuarios reciben los archivos nuevos y no los viejos guardados.
- [ ] **Versión `?v=` en `index.html`:** si cambió un `.js` o `.css`, cambie su `?v=…` en `index.html` (y, si hace falta, en `sw.js`). Los tests (por ejemplo `tests/marketing.test.js`) vigilan el formato; si uno falla por el `?v=`, use un nombre con el mismo patrón de los que ya hay.
- [ ] **CSP (política de seguridad):** si agregó un `<style>` en línea, un `<script src>` de otro sitio o un `createElement('style')`, hay que actualizar la CSP del `<meta>` de `index.html` (hashes o rutas). `tests/csp-fase13.test.js` lo avisa. En Chrome (F12 → Consola) no debe salir ningún «Refused to … Content Security Policy».
- [ ] **Chrome real contra la copia de PRUEBA** (`tarjeteria-jhon-prueba`, nunca producción): abra el panel con el administrador de prueba y haga el recorrido corto de la sección 5. Sin errores rojos en la consola.
- [ ] **No tocó** reglas de Firestore, Auth, clave de API, App Check, reCAPTCHA ni EmailJS sin aprobación de John.
- [ ] **CI verde** en el PR (GitHub → pestaña *Checks*).
- [ ] **Unir con el commit exacto que se probó:** `gh pr merge NÚMERO --squash --match-head-commit SHA_COMPLETO` (si alguien empujó otro cambio, el comando se niega y evita unir algo que no se probó).
- [ ] **Después de unir:** `git checkout main && git pull` y confirmar que el CI de `main` también quedó verde.

## 2. Qué se actualiza solo y qué no

| Lugar | Cuándo se actualiza | Cómo se vuelve atrás |
|---|---|---|
| GitHub Pages (`jhon01guevara.github.io/TARJETERIA-JHON`) | solo al unir a `main` | `git revert` (sección 4B) |
| vencrm.com (Firebase Hosting `vencrm-app`) | **solo cuando alguien despliega** | consola de Firebase o `git revert` + nuevo despliegue (sección 4) |
| Datos de las empresas (Firestore) | nunca por un despliegue de la página | un despliegue no cambia datos |
| Reglas de Firestore | solo con aprobación de John (`docs/DESPLIEGUE-REGLAS.md`) | archivos de respaldo en `docs/respaldo-reglas-…` |

## 3. Desplegar a vencrm.com (Firebase Hosting `vencrm-app`)

Solo con el visto bueno de John y con la sección 1 completa.

1. **Código al día y probado:** `git checkout main && git pull`. Sin cambios sin guardar (`git status` limpio). `npm test` y `npm run comprobar` en verde.
2. **Sesión de Firebase:** `npx -y firebase-tools@latest login` (una vez) y comprobar con `npx -y firebase-tools@latest hosting:sites:list --project tarjeteria-jhon` que aparece `vencrm-app`.
3. **Desplegar solo Hosting, solo ese sitio:**
   ```
   npx -y firebase-tools@latest deploy --only hosting:ven-crm --project tarjeteria-jhon
   ```
   (`ven-crm` es el nombre interno que `.firebaserc` apunta al sitio `vencrm-app`. No usar `deploy` sin `--only`: tocaría otras cosas.)
4. **Anotar la hora y la versión anterior** (la consola muestra el historial; ver sección 4A) por si hay que volver atrás.
5. **Comprobar en vivo (2 minutos):**
   - `curl -I https://vencrm.com/` → `200`.
   - Abrir `https://vencrm.com` en una ventana de incógnito: sale la marca **VEN CRM**, el login y no hay errores rojos en la consola (F12).
   - Iniciar sesión, abrir Inicio, Clientes y Nueva factura; abrir una tienda (`https://vencrm.com/?tienda=1&emp=…`).
   - En F12 → *Application* → *Service Workers*: la versión nueva queda `activated`.
6. **Avisar a John** con la hora del despliegue y la versión.

## 4. Volver atrás (rollback)

Elija la más rápida. **Ninguna toca los datos de las empresas.**

### A. Consola de Firebase (la más rápida: 1 minuto, sin código)
1. Entrar a https://console.firebase.google.com → proyecto **tarjeteria-jhon** → **Hosting**.
2. En el sitio **vencrm-app** buscar **Historial de versiones** (*Release history*).
3. Ubicar la versión anterior que funcionaba (por fecha y hora).
4. En el menú de esa fila (⋮) pulsar **Revertir** (*Rollback*) y confirmar.
5. Esperar 1-2 minutos y repetir la comprobación en vivo de la sección 3 (paso 5).

### B. Por git (cuando el error está en `main` y también afecta a GitHub Pages)
1. Ver qué PR se unió: `git log --oneline -10`.
2. Crear una rama: `git checkout -b revertir-PR-NN` y `git revert COMMIT` (los PR se unen con *squash*, así que es un solo commit).
3. `npm test` y `npm run comprobar`; subir la rama, abrir PR y unirlo con la sección 1. GitHub Pages queda arreglado al unir.
4. Si vencrm.com también tenía la versión mala, desplegar de nuevo (sección 3).

### C. Emergencia (el sitio entero falla y no se sabe por qué)
`npx -y firebase-tools@latest hosting:disable --site vencrm-app --project tarjeteria-jhon` apaga vencrm.com (los usuarios pueden seguir en `github.io`). Se vuelve a encender desplegando de nuevo (sección 3). Úsela solo con aprobación de John.

### Después de volver atrás
- Los usuarios reciben la versión buena sola: el service worker pide siempre primero a internet. Si alguien sigue viendo lo viejo, que cierre y abra la app o recargue con Ctrl+Shift+R.
- Anotar qué falló y agregar una comprobación a la suite de humo (`tests/navegador/humo.js`) para que no vuelva a pasar.

## 5. La suite de humo (`npm run humo`)

**Qué es:** un robot que abre Chrome real y hace lo mismo que un cliente: entra al panel, crea un cliente y un producto, emite una factura, abre Catálogo, mira la tienda vacía y con productos, hace un pedido desde la tienda, cambia nombre y logo, y recarga comprobando que no aparece la marca de otra empresa. Dura 2-3 minutos.

**Cómo correrla:**
```
export PRUEBA_PASSWORD=…           # contraseña de admin.prueba@example.com (proyecto de PRUEBA)
npm run humo
```
Necesita Google Chrome y `playwright-core` instalado **fuera** del repo (`npm i playwright-core` en otra carpeta y `export PW=/esa/carpeta/node_modules/playwright-core`). Arma sola una copia del repo apuntando al proyecto de prueba, la sirve en local y crea/borra una empresa propia (`humo-prueba`).

**Cómo leerla:** cada paso sale como `ok` o `FALLA en el paso N`, con el motivo y la ruta de una **captura** en `humo-capturas/` (también `resultado.json`). Termina con `TODO BIEN` o `NO UNIR NI DESPLEGAR`.

**Seguridad:** nunca toca producción. Cualquier petición al proyecto `tarjeteria-jhon`, a `vencrm.com` o a `github.io` se bloquea en el navegador y hace fallar la suite. Escribe solo en `tarjeteria-jhon-prueba`, en la empresa `humo-prueba`, y la deja vacía al terminar.

**Si la suite falla pero parece un error de la prueba** (no de la app): repita una vez. Si el aviso es *Quota exceeded* / *resource-exhausted*, el proyecto de prueba agotó su cuota diaria gratuita de Firebase (se renueva a medianoche, hora del Pacífico = 2:00 a. m. en Panamá): espere y repita. No se salta la suite por eso.

## 6. Recorrido corto a mano (lo que la suite no ve: ojo humano)
1. Iniciar sesión → Inicio carga y muestra la marca de la empresa.
2. Nueva factura → emitir → aparece en Facturas e imprime/PDF.
3. Tienda pública del cliente → se ve el logo y el nombre de **esa** empresa (nunca el de otra).
4. En el teléfono (app instalada): abre, se ve completa y se puede usar con el dedo.
