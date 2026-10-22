# Marketing Studio · v1 (22 de octubre de 2026)

Módulo del panel para crear imágenes publicitarias de los productos: editor de diseños por capas,
4 formatos por plataforma, plantillas, colecciones, marca por empresa y exportación con control de
peso. Basado en `Plan_Maestro_Marketing_Studio_Tarjeteria_Jhon.pdf`, **adaptado a la arquitectura
real** del panel (GitHub Pages + Firebase, sin servidor propio).

## Mapa plan maestro → lo construido

| Plan maestro | v1 real |
|---|---|
| F1 Auditoría | Ya existía (arquitectura conocida del panel multiempresa) |
| F3 Navegación y editor | Menú «🎨 Marketing» + editor de capas (imagen/texto/logo/fondo) con arrastrar, redimensionar, orden, duplicar, deshacer/rehacer |
| F4 Motor de formatos | Cuadrado 1080×1080, Vertical 1080×1350, Story/Reel/TikTok 1080×1920 (zona segura), Banner 1200×628 — adaptación proporcional inteligente (`mktAdaptarDoc`), edición independiente por formato |
| F6 Biblioteca | Proyectos guardados con versiones (últimas 8), colecciones, exportaciones guardadas — TODO por empresa (`empresas/{eid}/marketing_…`) |
| Configuración de marca | Pestaña 🎨 Marca: logo, 2 colores y tipografía por empresa (en `empresas/{eid}.marca`), aplicados a plantillas nuevas |
| F2/F5/F7 (backend, vídeo, IA, OAuth) | **Fuera de v1** — ver «Ruta futura» |

Publicación: v1 entrega **descarga + guardar exportación** (PNG/JPG/WebP ≤700 KB). El plan §9 exige
poder degradar a descarga cuando el destino no permite publicación automatizada; los conectores
OAuth (Facebook/Instagram/TikTok) exigen un backend con secretos que este proyecto no tiene.

## Archivos

- `js/mkt-editor.js` — motor puro (formatos, capas, render canvas, adaptación, exportación con
  búsqueda binaria de calidad, 6 plantillas). Autónomo, testeable en Node.
- `js/marketing.js` — vista: Diseños (lista/editor/exportar), Colecciones, Marca; imágenes desde
  catálogo (IndexedDB), tienda o subida (comprimidas ≤500 KB por documento, patrón catálogo).
- `js/app.js` — 3 líneas de integración (menú + `R.marketing`, patrón `empresas`).
- `js/empresa-contexto.js` — `EMP_NEGOCIO` + las 4 colecciones `marketing_*` (ruteo por empresa).
- `firestore.rules` — función `esMiembroEmpresa(eid)` + 4 bloques `empresas/{eid}/marketing_*/…`.
- `tests/marketing.test.js` — 12 pruebas (dimensiones del plan, zona segura story, aislamiento de
  formatos, hit-testing, marca, colecciones permitidas, reglas, integración).

## Permisos y aislamiento

- **Administración**: siempre puede usar todo (incluida la pestaña Marca).
- **Vendedores**: ven «Marketing» solo si la administración les activa ese panel
  (Vendedores → editar → paneles), igual que Tienda o Chat.
- **Aislamiento real por empresa**: las reglas permiten `marketing_*` solo a administración o a
  `empresas/{eid}/miembros/{uid}`. El panel sincroniza los miembros desde los vendedores declarados
  en la empresa (idempotente). Un vendedor de Tarjetería Jhon NO puede leer el marketing de
  GENUINE (prueba de acceso cruzado del plan §13, cubierta por reglas, no por botones ocultos).
- Las imágenes grandes viven en `marketing_assets` (una por documento) y los diseños son JSON
  chico (`marketing_projects.doc`) — el documento editable que pide el plan §4.

## Guía rápida

1. **Marketing → + Nuevo diseño** → plantilla (o en blanco) → imagen del producto (catálogo/tienda/subir).
2. Editor: arrastrar para mover, esquinas para tamaño; panel derecho para textos, colores, fondo,
   tipografía y opacidad; pestañas de formato arriba; «🔄 Adaptar todos» regenera los otros formatos
   desde el maestro Vertical.
3. **💾 Guardar** (versiones automáticas) y **⬇ Exportar** (JPG/PNG/WebP por formato: se guarda en
   la empresa y se descarga).

## Ruta futura (fases 2+)

- **Vídeo** (F5): plantillas de montaje con `MediaRecorder` del navegador (calidad limitada) o un
  servicio externo cuando el volumen lo justifique.
- **IA** (F5): adaptador de proveedor con la clave del usuario (nunca del panel).
- **Conectores OAuth** (F7): requieren un pequeño backend (Cloud Functions) para guardar tokens;
  hasta entonces, descarga + WhatsApp cubren el flujo.
- **Calendario/programación** (§1): con conectores.

## Seguridad operativa

- Las reglas nuevas SOLO añaden los bloques marketing; todo lo demás queda igual.
- Desplegar `firestore.rules` en la consola (Firebase → Firestore → Reglas → pegar → Publicar)
  después de subir los archivos a GitHub.
- Sin reglas desplegadas, el módulo muestra lista vacía y los guardados fallan con permiso
  insuficiente (esperado y sin riesgo para lo existente).
