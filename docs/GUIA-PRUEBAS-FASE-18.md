# Guía de pruebas — Fase 18 (accesibilidad restante)

## Qué cambió, en simple
Nada de esto debe notarse a simple vista: son mejoras para lectores de pantalla y para tocar con el dedo.
1. **Landmarks:** el panel y la tienda tienen zonas con nombre (barra lateral, menús, avisos, filtros, catálogo) y un título principal para lectores en móvil.
2. **Tablas:** cada tabla de datos tiene nombre y las columnas sin título ahora tienen texto solo-lector («Acciones», «Seleccionar», «Imagen»).
3. **Campos:** las líneas de la factura (producto, descripción, cantidad, precio), el descuento, el filtro del mapa y las casillas de etiquetas tienen nombre.
4. **Móvil (≤820 px):** zonas táctiles de al menos 24 px (títulos plegables, «Ver datos», enlaces, casillas). Los botones de la barra inferior del teléfono tienen nombre aunque solo se vea el icono.
5. **Colores:** los textos de color de las tarjetas de Inicio («En línea», «facturas este mes»…) son un poco más oscuros en tema claro (y más claros en nocturno).
6. Caché del service worker `tj-net-first-14`, `?v=a11y-restante-fase-18`, `css/accesibilidad.css?v=3`.

## Dónde probar
Panel de prueba: https://tarjeteria-jhon-prueba.web.app/ (usuarios en `GUIA-PRUEBA.md`). Ventana de incógnito + Ctrl+Shift+R.

## Pasos (10 minutos)
1. **Escritorio, administrador:** recorre el menú. Todo debe verse **igual** que antes (mismas posiciones y tamaños). Lo único nuevo: «En línea» y algunos números de color de Inicio se ven algo más oscuros.
2. **Móvil (o F12 → modo dispositivo, 390×844):** Inicio, Nueva factura, Clientes, Configuración (Expandir todo) y Mapa. Debe verse igual; las filas de «Ver datos» y de los títulos plegables pueden tener unos píxeles más de alto. **No** debe aparecer scroll horizontal en toda la página (solo dentro de las tablas, como antes).
3. **Barra inferior en el teléfono:** los iconos se ven igual; con un lector de pantalla (TalkBack/VoiceOver) cada botón se anuncia con su nombre («Inicio», «Facturas»…).
4. **Tienda pública** (`?tienda`) en móvil y escritorio: igual que antes. Los filtros, el catálogo y los menús siguen funcionando.
5. **Teclado:** Esc cierra un modal, Tab queda dentro, el foco vuelve al botón (como en la fase 15).
6. **Consola (F12):** sin «Content Security Policy» nuevos ni errores rojos nuevos.
7. Opcional, extensión **axe DevTools** en Inicio y en la tienda: sin problemas críticos ni serios.

## Si algo falla
Revierte el PR de la fase 18. Para desactivar solo lo de JavaScript: quita `js/a11y.js?v=…` (se pierden también las mejoras de fases 9 y 15).
