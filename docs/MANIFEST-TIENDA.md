# Manifest propio de la tienda de otra empresa (Etapa 3)

**Qué resuelve:** la tienda pública de una empresa que no es Tarjetería Jhon (`?tienda=1&emp=<empresa>`) se puede **instalar como app** con **su nombre y su logo**. Antes se le quitaba el manifest (para que no se instalara como «Tarjetería Jhon») y quedaba sin instalar.

## Cómo funciona
1. `shopMetaEmpresa()` (js/app.js) quita el `manifest.json` de Tarjetería y, cuando ya llegó la plantilla de la empresa (`SH.cfgOk`), llama a `TJManifestTienda.aplicar({emp, nombre, logo})` (js/manifest-tienda.js).
2. El módulo dibuja con `canvas` tres íconos PNG (192, 512 y 512 «maskable»): el **logo de la empresa** centrado sobre blanco; si no tiene logo o no se puede leer, la **inicial** en blanco sobre negro.
3. Arma el manifest (`id: tienda-<empresa>`, `name`, `short_name`, `start_url: …/index.html?tienda=1&emp=<empresa>`, `scope` = carpeta del sitio, `display: standalone`) y lo enlaza como URL `data:application/manifest+json` en `<link rel="manifest">`.
4. Es idempotente (firma empresa+nombre+logo): no repite el trabajo si nada cambió. Si cambia el nombre o el logo, se rehace en la siguiente carga.

La empresa inicial (Tarjetería) **no cambia**: conserva `manifest.json`. El panel conserva `manifest-ven-crm.json`.

## Cambio de CSP (el único)
Se añadió **una directiva**: `manifest-src 'self' data:` (antes el manifest caía en `default-src 'self'`). Justificación y límites:
- El manifest es **metadato inerte**: no ejecuta código ni abre conexiones. No se tocan `script-src`, `connect-src`, `img-src`, `object-src` ni los hashes de `style-src-elem`.
- `data:` solo en `manifest-src` (no `blob:`, no comodines, no `unsafe-*`).
- Prueba negativa en Chrome real (`tests/navegador/manifest-tienda.js`, caso 2): quitando la directiva, Chrome bloquea el manifest data: con «Loading a manifest … violates the following Content Security Policy directive». Con ella, 0 violaciones.
- **Para revertir:** quitar `manifest-src 'self' data:; ` de la meta CSP de `index.html`. La tienda sigue funcionando; solo deja de poder instalarse.

## Alternativas descartadas
| Opción | Por qué no |
|---|---|
| Un `manifest-<empresa>.json` estático por empresa en el repo | Cada empresa nueva exigiría un PR y un despliegue manual: no es autoservicio. |
| Manifest generado por un servidor (Cloud Function) | Requiere el plan Blaze (de pago); decisión de dinero de John. |
| `blob:` en la CSP + `URL.createObjectURL` | Abre `blob:` a todo `manifest-src` y los íconos tendrían que ser blob también; `data:` es equivalente y sin estado. |
| Servir el manifest desde el service worker | La tienda pública **no registra** service worker a propósito (`shopPurge` incluso desregistra los antiguos); cambiar eso es un riesgo mayor que la directiva de CSP. |

## Límites conocidos
- Si el logo está en una dirección `https:` de otro sitio que no da permiso CORS, el ícono usa la **inicial** (el lienzo no se puede leer). Los logos subidos desde Configuración son `data:` y siempre funcionan.
- El nombre y el logo del manifest se toman de lo que la empresa **ya publicó**: si los cambia, el navegador actualiza la app instalada según su propio calendario (Chrome revisa el manifest cada ~1 día).
- iOS (Safari) usa `apple-touch-icon` y el título de la página, que `shopMetaEmpresa()` ya ajusta; el manifest es para Chrome/Edge/Android.
- Depende de Chrome ≥ 108 para ser instalable **sin** service worker (probado en Chrome 156).

## Pruebas
- `tests/manifest-tienda.test.js` (npm test): CSP, carga del script, comportamiento con DOM simulado.
- `tests/navegador/manifest-tienda.js` (Chrome real, copia de PRUEBA): `BASE=http://127.0.0.1:PUERTO/ PW=…/playwright-core node tests/navegador/manifest-tienda.js`. Verifica nombre, íconos reales, instalable según Chrome (`Page.getInstallabilityErrors`), 0 violaciones CSP, prueba negativa, empresa sin logo y empresa inicial intacta.
