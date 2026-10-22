# Fase 6 · Migración de prueba en proyecto Firebase de pruebas

Fecha: 2026-10-21 · Herramienta: **`migraciones/migrar-pruebas.html`** (subida a GitHub se abre en
`https://jhon01guevara.github.io/TARJETERIA-JHON/migraciones/migrar-pruebas.html`)

**Objetivo:** ensayar, sin tocar producción, la copia completa de la estructura actual a
`empresas/tarjeteria-jhon/…` dentro de un proyecto Firebase **de pruebas** (gratis), verificarla
colección por colección y repetirla/borrarla cuantas veces haga falta. Es el requisito que el plan
exige antes de activar la separación real (Fase 7).

> 🔒 **Seguridad:** la herramienta ESCRIBE únicamente en el proyecto de pruebas que usted conecta.
> El proyecto real (tarjeteria-jhon) solo se LEE. El ejecutor (`migracion-ejecutor.js`) no contiene
> ni una referencia a la base de producción (garantía verificada por tests).

---

## Los 3 requisitos del plan (criterio de arranque de la Fase 7)

- **(a)** Proyecto Firebase de pruebas creado → pasos 1-3 abajo.
- **(b)** Informe de simulación revisado y aprobado → la herramienta muestra el mismo informe antes
  de copiar (paso 6). También puede verlo en el panel: Empresas → pestaña Migración.
- **(c)** Restauración/iteración probada sobre el proyecto de pruebas → borrar la copia y repetir
  el ensayo completo al menos una vez (paso 9).

## Paso 1 · Crear el proyecto de pruebas (~5 min, gratis)

1. Entre a [console.firebase.google.com](https://console.firebase.google.com) con la misma cuenta
   de siempre.
2. **Crear un proyecto** → nombre sugerido: `tarjeteria-jhon-pruebas` → (Google Analytics: puede
   desactivarlo) → Crear proyecto.
3. Este proyecto NUEVO aparece junto al real en la lista. **Fíjese en el nombre antes de hacer
   cualquier cosa: las pruebas SIEMPRE en "-pruebas".**

## Paso 2 · Crear su base de datos Firestore

1. Menú lateral: **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: la que ofrezca por defecto (p. ej. `nam5` / us-central) → Siguiente.
3. **Modo de prueba** (permite lectura/escritura durante 30 días — suficiente para los ensayos).
   Si pidiera reglas manuales, use exactamente estas SOLO en el proyecto de pruebas:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} { allow read, write: if true; }
     }
   }
   ```

## Paso 3 · Registrar una app web y copiar su configuración

1. ⚙️ **Configuración del proyecto → Tus apps** → icono web `</>` → apodo: `migrador` →
   **Registrar app** (NO marque Firebase Hosting).
2. Copie el bloque `firebaseConfig` que aparece (apiKey, authDomain, projectId…). Guárdelo: lo
   pegará en la herramienta.

## Paso 4 · Abrir la herramienta con sesión de administrador

1. Abra el panel normal e **inicie sesión como administración** (mismo navegador).
2. En esa misma pestaña (o una nueva del mismo navegador), abra:
   `https://jhon01guevara.github.io/TARJETERIA-JHON/migraciones/migrar-pruebas.html`
3. La casilla 0 debe decir **"✔ Sesión de administrador"**. Si dice lo contrario, entre primero al
   panel como administración y recargue la herramienta.

## Paso 5 · Conectar el proyecto de pruebas

Pegue el bloque `firebaseConfig` del paso 3 → **Conectar proyecto de pruebas**. Debe aparecer
"✔ Conectado al proyecto de pruebas: tarjeteria-jhon-pruebas". (La configuración queda guardada en
el navegador; al recargar solo pulse Conectar de nuevo.)

## Paso 6 · Leer producción y revisar el informe (requisito b)

**📖 Leer colecciones (solo lectura)** → verá conteos y la lista de riesgos:

- **Se corrigen solos al copiar:** el contador de facturas (la copia arranca en mayor número +1).
- **Para revisar antes de aprobar:** documento panel/data cerca de 1 MB, pedidos/leads con `ref`
  desconocida, vendedores no declarados en cfg.users, ids repetidos.
- Descargue el informe final (botón ⬇ al final) y guárdelo: es el registro del requisito (b).

## Paso 7 · Ejecutar la copia

**📦 Preparar plan y copiar** → confirma → barra de progreso. Al final:
"✔ Copia terminada: N de N documentos escritos".

## Paso 8 · Verificar

**✅ Verificar colección por colección** → tabla con esperado/hallado. Todo en ✔ verde =
copia correcta. Cualquier ✖: revise conexión, reglas permisivas del proyecto de pruebas, y
repita desde el paso 7 (primero borre, paso 9).

## Paso 9 · Repetir el ensayo (requisito c)

**🗑 Borrar copia en el proyecto de pruebas** → confirma → y vuelva a ejecutar los pasos 6-8.
Hacerlo al menos una vez demuestra que el ensayo es repetible y reversible (lo que pide el plan).

## Paso 10 · Guardar el informe

**⬇ Descargar informe completo (JSON)** — contiene análisis + plan + verificación. Guárdelo junto
al informe de simulación de la Fase 5.

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "Su sesión NO es el administrador maestro" | Entró como vendedor o sin sesión | Panel → cerrar sesión → entrar como administración |
| "Configuración inválida" | Pegó incompleto el firebaseConfig | Copie de nuevo el bloque completo con `{ }` |
| "permiso denegado" al copiar/verificar | Reglas del proyecto de pruebas no permisivas | Paso 2: modo de prueba o reglas manuales de arriba |
| "permiso denegado" al leer | Sesión de admin caducada | Vuelva a entrar al panel y recargue la herramienta |
| Error `resource-exhausted` / cuota | Catálogo muy grande o muchos reintentos | Espere unos minutos y repita; no pasa nada por reintentar |
| Ya pasaron 30 días del modo de prueba | Reglas expiradas | Vuelva a publicar las reglas permisivas del paso 2 |

## ⚠️ Al terminar la Fase 6 (importante)

El proyecto de pruebas contiene una **copia de datos reales** (clientes, facturas, teléfonos).
Cuando la Fase 7 esté activada y estable: Firebase → Configuración del proyecto → **Eliminar
proyecto** (el de pruebas). El informe JSON descargado también contiene datos: guárdelo solo en su
computadora, no lo comparta.
