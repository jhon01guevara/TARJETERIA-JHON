# Etapa 4 — Preparación para cobrar (solo documento)

> Estado: **borrador de diseño. No hay código de cobro, ni claves, ni cuentas creadas, ni reglas publicadas.** Todo lo marcado como **HIPÓTESIS** se valida con clientes piloto antes de fijarlo. Redactado el 2026-10-26.
> Objetivo de negocio: suscripción de **VEN CRM**, meta de 50 empresas pagando entre 10 y 30 USD al mes.

## 0. Hallazgo previo que condiciona todo (decisión de John)
Las reglas de Firestore **publicadas** definen `isAdmin()` como «el UID de John **o cualquier usuario con `roles/{uid}.rol == 'admin'`**», y esa función da lectura y escritura a **todo** `empresas/{eid}/**` de **todas** las empresas. Hoy eso es correcto porque el único administrador es John. **En cuanto un cliente tenga un usuario administrador propio, ese usuario podría leer y escribir los datos de las demás empresas** (y también cambiarse su propio estado de suscripción). Antes de dar acceso de administrador a un cliente de pago hay que cambiar el modelo de roles a **administrador por empresa** (p. ej. `empresas/{eid}/miembros/{uid}.rol == 'admin'`) y reservar para John (o una función de servidor) lo que es de plataforma. Eso exige **publicar reglas nuevas**, que **solo se hace con aprobación de John** (ver `docs/DESPLIEGUE-REGLAS.md`) y con pruebas en el proyecto de PRUEBA. Es el primer bloqueo técnico de la Etapa 4.

## (a) Planes y límites — HIPÓTESIS
Precios en USD por empresa y mes, **dentro del rango 10-30 definido por John**; se ajustan con los pilotos. Los límites se miden sobre lo que ya existe en la app.

| | **Básico** | **Pro** | **Negocio** |
|---|---|---|---|
| Precio (hipótesis) | **10 USD/mes** | **20 USD/mes** | **30 USD/mes** |
| Descuento anual (hipótesis) | 2 meses gratis (100 USD/año) | 200 USD/año | 300 USD/año |
| Usuarios (administrador + vendedores) | 1 admin + 2 vendedores | 1 admin + 5 vendedores | 1 admin + 15 vendedores |
| Productos publicados en la tienda | 100 | 500 | 2 000 |
| Modelos en el catálogo (fotos/archivos) | 100 | 500 | 2 000 |
| Pedidos de la tienda al mes | 100 | 500 | 2 500 |
| Facturas al mes | 300 | 1 500 | 7 500 |
| Almacenamiento de imágenes (en Firestore/Storage) | 150 MB | 600 MB | 2 GB |
| Tienda pública con su logo, nombre y manifest instalable | Sí | Sí | Sí |
| Marketing Studio / Mapa de clientes / Chat y llamadas | Chat | Chat + Marketing | Todo |
| Dominio propio de la tienda | — | 1 | 3 |
| Integraciones (Etapa 8, cuando existan) | — | WhatsApp (avisos) | WhatsApp + envíos con rastreo + pagos |
| Soporte | Correo | Correo + WhatsApp | Prioritario |
| Prueba gratis | 14 días, sin tarjeta | 14 días | 14 días |

Notas:
- Los números de usuarios/productos/pedidos son **estimaciones de capacidad**, no medidas de costo; hay que contrastarlos con el uso real de Tarjetería y Genuine antes de publicarlos.
- **Cuotas de la plataforma (verificadas en firebase.google.com/pricing y /docs/firestore/quotas, 2026-10-26):** el plan gratuito (Spark) de Firestore incluye **1 GiB almacenado, 50 000 lecturas/día, 20 000 escrituras/día, 20 000 borrados/día y 10 GiB/mes de salida**, y es **por proyecto, no por empresa**. Con varias empresas compartiendo el mismo proyecto, esas cuotas se agotarán mucho antes de llegar a 50 clientes; pasar al plan de pago **Blaze** (cobra por uso) será necesario, y también lo será para cualquier servidor (Cloud Functions) que cobre o conecte integraciones. **Pasar a Blaze es una decisión de gasto de John** y no se hace sin su aprobación.
- Los límites se aplican con «bloqueo suave» (ver c) y avisos, no con corte inmediato.

## (b) Opciones de cobro recurrente desde Panamá/Latinoamérica
Lo siguiente se verificó en fuentes oficiales o se marca como **no verificado**. Las comisiones cambian: confirmar en el sitio oficial el día que se decida.

| Opción | Disponible para un negocio en Panamá | Suscripciones | Comisión | Observaciones |
|---|---|---|---|---|
| **Stripe** | **No** como país de la cuenta (según una guía sobre vender desde Panamá; la lista oficial es de 46 países, stripe.com/global — **confirmar ahí que Panamá no figura**). Panamá sí figura como país de **destino de pagos (transferencia SWIFT)** en la documentación de Stripe, pero eso no permite abrir cuenta. | Sí (Billing) | No aplica | Solo viable con una sociedad en un país soportado (p. ej. Stripe Atlas = LLC en EE. UU., con costos y trámites). |
| **Paddle** (comerciante de registro) | **Sí**: Panamá figura en su lista de países (developer.paddle.com/concepts/sell/supported-countries-locales). Cobro por transferencia o Payoneer (centro de ayuda de Paddle); un mínimo de pago de 100 USD y la fecha de pago (día 1, envío antes del 15) salen de un resumen de búsqueda y **no se verificaron** en la página. | Sí | **5 % + 0,50 USD por transacción** (paddle.com/pricing, verificado). Paddle gestiona impuestos y contracargos. | Pensado para SaaS. Mínimo 10 USD por venta con precio estándar (para menos piden tarifa especial). Su aprobación de la cuenta/negocio **no verificada**. |
| **Lemon Squeezy** (comerciante de registro, de Stripe) | **Sí**: Panamá aparece entre los países con pago bancario (docs.lemonsqueezy.com/help/getting-started/supported-countries); también pago por PayPal. | Sí | **5 % + 0,50 USD**, **+1,5 %** si el pago es internacional, **+0,5 %** en pagos de suscripción, **+1,5 %** si es por PayPal; pago por banco fuera de EE. UU. con **1 %** por retiro (docs.lemonsqueezy.com/help/getting-started/fees, verificado). Con 10 USD al mes la comisión efectiva sería de ~**13 %**. | Alternativa más sencilla que Atlas para empezar, pero cara en ticket bajo. |
| **PayPal Suscripciones** | **Sí**: empresas en Panamá abren cuenta de negocio y retiran por MetroBank/Kipo (newsroom.latam.paypal-corp.com). La página de ayuda de PayPal Panamá indica que las suscripciones se activan desde el panel «Suscripciones» y un botón. | Sí (planes, prueba gratis, reintentos) | La página de EE. UU. publica 3,49 % + 0,49 USD; **la de Panamá no se verificó**. | La API de suscripciones, según su documentación, está «solo para socios seleccionados»; el botón desde el panel no lo exige. |
| **Tilopay** (Costa Rica, con operación en Panamá) | Probable (su guía de Yappy dice «Yappy solo disponible en Panamá» y es un método de pago de Tilopay) — **cobertura legal y requisitos de alta para un comercio panameño: no verificados**. | **Sí**: planes, frecuencias, reintentos diarios (hasta 30 días), cupones, días de prueba, actualización automática de tarjeta (CAU), API y webhooks (tilopay.com/producto/suscripciones). | **No verificada** (hay que pedir tarifa). El modo prueba de Yappy no sirve para cobros recurrentes. | Candidato local fuerte para tarjetas y Yappy. |
| **PagueloFacil** (Panamá) | **Sí**, es panameña. | Ofrece «pagos recurrentes» (paguelofacil.com/business/cobrar-y-pagar); detalle de planes/API **no verificado**. | Con Yappy: **2 %** total (1 % PagueloFacil + 1 % Yappy + ITBMS sobre la parte de Yappy) (soporte.paguelofacil.com). Tarjetas: **no verificada**. | Yappy requiere Yappy Comercial (Banco General); la venta con Yappy **no es reembolsable desde PagueloFacil**. |
| **Yappy / ACH / transferencia manual** | Sí | Yappy App permite pagos programados del lado del cliente; **no es cobro recurrente automático de la empresa** (no verificado para comercios). | Variable | Válido para los **primeros pilotos**: el cliente paga y John activa el plan a mano. |
| **dLocal / PayU / otros** | No verificado | No verificado | No verificado | Para evaluar si se necesita cobertura regional (Colombia, México, etc.). |

**Recomendación (sujeta a la decisión de John):**
1. **Pilotos (3-5 clientes):** cobro **manual** (Yappy/transferencia/PayPal) + un interruptor de plan en la ficha de la empresa que solo John pueda cambiar. Sin código de cobro y sin gasto en comisiones.
2. **Escala:** elegir entre **Tilopay/PagueloFacil** (local, cobran tarjeta y Yappy; falta verificar tarifas y requisitos de alta) y **Paddle** (internacional, impuestos incluidos, 5 % + 0,50 USD). A 10-30 USD/mes la parte fija de 0,50 USD pesa entre 1,7 % y 5 %.
3. La pasarela **avisa por webhook**; el cambio de estado lo hace un servidor (ver c), nunca el navegador del cliente.

## (c) Diseño técnico del estado de suscripción por empresa
Principios: **no publicar reglas sin aprobación**, **no romper lo que funciona**, **degradar con suavidad** (nunca borrar datos ni cortar de golpe), lo de plataforma solo lo escribe John o un servidor.

### Dónde vive
Documento `empresas/{eid}/suscripcion/estado` (subcolección propia, no el documento `empresas/{eid}`, que hoy puede escribir cualquier administrador). Campos:

| Campo | Tipo | Significado |
|---|---|---|
| `plan` | `'prueba' \| 'basico' \| 'pro' \| 'negocio'` | Plan actual |
| `estado` | `'prueba' \| 'activa' \| 'vencida' \| 'suspendida' \| 'cancelada'` | Estado de cobro |
| `pruebaHasta` | número (ms) | Fin de la prueba de 14 días (se fija al crear la empresa: `creada + 14 d`) |
| `periodoHasta` | número (ms) | Fin del período pagado |
| `graciaHasta` | número (ms) | Fin de la gracia (por defecto `periodoHasta + 7 d`) |
| `limites` | mapa | `usuarios`, `productos`, `pedidosMes`, `facturasMes`, `almacenMB`, `dominios` (copia del plan para poder personalizar) |
| `proveedor` | texto | `manual`, `tilopay`, `paddle`… |
| `ref` | texto | id de cliente/suscripción del proveedor (sin datos de tarjeta; nunca se guardan tarjetas) |
| `ultimoPago`, `actualizado` | números | Trazabilidad |

### Quién lo escribe y lee
- **Escribe:** solo la plataforma. Fase manual: John (UID fijo) desde una pantalla de «Plataforma». Fase automática: una **Cloud Function** con el SDK de administrador (no pasa por las reglas), que recibe el webhook de la pasarela, valida su firma y actualiza el documento. Requiere **Blaze** (decisión de gasto).
- **Lee:** los miembros de la empresa (para mostrar avisos y límites). La tienda pública **no** lee este documento.
- **Regla propuesta (NO publicada):** `match /empresas/{eid}/suscripcion/{doc} { allow read: if esMiembroEmpresa(eid); allow write: if request.auth.uid == '<UID de John>'; }` y colocarla **antes** de cualquier comodín que dé escritura a administradores de empresa. Se prueba con el emulador/proyecto de PRUEBA y se publica solo con aprobación de John, junto con el cambio de roles por empresa (sección 0).

### Máquina de estados
```
alta → prueba (14 d) ──pago──▶ activa ──fin de período──▶ vencida (gracia 7 d) ──pago──▶ activa
          │                                      │
          └─sin pago─▶ vencida                   └─sin pago─▶ suspendida ──30 d──▶ cancelada (datos se conservan 90 d)
```
- **`prueba`:** funciona todo el plan Pro. Avisos a los días 7, 12 y 14.
- **`vencida` (gracia):** todo funciona; banner fijo «Su suscripción venció el … pague antes del …».
- **`suspendida` (bloqueo suave):** el administrador entra y **ve y exporta** todo; se bloquean **solo las acciones que crean valor nuevo**: nuevas facturas, nuevos productos publicados y nuevos usuarios. La **tienda pública sigue visible** con el catálogo pero **sin recibir pedidos nuevos** (mensaje neutro: «Esta tienda no está recibiendo pedidos por ahora»). Nunca se borra nada.
- **`cancelada`:** solo lectura/exportar; borrado a petición o a los 90 días, con aviso.

### Cómo se hace cumplir (sin publicar reglas nuevas en la primera fase)
1. **Cliente (UX, no seguridad):** al abrir el panel, un módulo `js/suscripcion.js` lee `suscripcion/estado`, calcula el estado efectivo según la hora actual (nunca confía en el campo `estado` si `periodoHasta`/`graciaHasta` ya pasaron) y muestra banner, medidor de límites y desactiva botones. Es fácil de saltar para quien manipule su navegador; sirve para la experiencia y para clientes de buena fe.
2. **Servidor (seguridad real, fase 2):** las reglas de Firestore (cuando John apruebe) comprueban `get(.../suscripcion/estado).data.estado in ['prueba','activa','vencida']` en la **creación** de facturas, productos y pedidos de tienda. Cuidado con el costo: cada `get()` en una regla cuenta como lectura y puede romper consultas amplias (ver el comentario de `isAdmin()` en `firestore.rules`); se prueba en PRUEBA antes de proponerlo.
3. **Límites duros** (p. ej. máximo de productos): se miden en el cliente al crear (conteo local) y, en la fase 2, con un contador mantenido por la Cloud Function.

### Si la prueba de 14 días es sin tarjeta
Es lo más simple y encaja con pilotos manuales: `pruebaHasta = alta + 14 d`; al vencer pasa a `vencida` y la gracia da 7 días extra. Para cobrar automáticamente después, el cliente elige plan y paga en un enlace de la pasarela; el webhook pasa el estado a `activa`.

### Migración de las empresas existentes
Tarjetería Jhon y Genuine **no se tocan**: se crea su documento con `plan:'negocio'`, `estado:'activa'`, `proveedor:'manual'`, `periodoHasta` muy lejano (interno). Ninguna empresa sin documento se bloquea (**ausencia = sin límites**), para que un fallo de lectura nunca deje a nadie sin servicio.

### Pruebas necesarias antes de activar
- Pruebas automáticas de la función que calcula el estado efectivo con fechas simuladas (prueba, gracia, vencida, suspendida).
- Chrome real contra el proyecto de PRUEBA: cada estado muestra el banner correcto y bloquea solo lo previsto; la tienda pública no se rompe.
- Si hay reglas: pruebas en emulador/PRUEBA con un usuario administrador de empresa que **intenta** cambiar su estado (debe fallar).

## (d) Borrador de aviso para usuarios de github.io
> **Asunto:** VEN CRM tiene dirección nueva: vencrm.com
>
> Hola [nombre]:
>
> Nuestro panel ahora vive en **https://vencrm.com** (antes https://jhon01guevara.github.io/TARJETERIA-JHON/). Sus datos están a salvo: viven en la nube y no cambian. Para que la app instalada en su teléfono o computadora use la dirección nueva y el nombre **VEN CRM**, solo hay que volver a instalarla (2 minutos):
>
> **En el teléfono (Android, Chrome)**
> 1. Mantenga pulsado el ícono viejo de la app → **Desinstalar** (o «Quitar»).
> 2. Abra **https://vencrm.com** en Chrome.
> 3. Menú ⋮ → **Instalar aplicación** (o «Añadir a pantalla de inicio»).
> 4. Abra la app e inicie sesión con su correo y contraseña de siempre.
>
> **En iPhone (Safari)**
> 1. Mantenga pulsado el ícono viejo → **Eliminar app**.
> 2. Abra **https://vencrm.com** en Safari.
> 3. Botón Compartir → **Añadir a pantalla de inicio**.
> 4. Abra la app e inicie sesión.
>
> **En computadora (Chrome o Edge)**
> 1. Abra la app instalada, menú ⋮ → **Desinstalar**.
> 2. Abra **https://vencrm.com** y pulse el ícono de **instalar** en la barra de direcciones.
>
> **Antes de desinstalar:** termine y guarde lo que tenga pendiente. Lo que solo estaba escrito en el aparato y no se había guardado en la nube (por ejemplo, un borrador sin guardar) no pasa a la app nueva.
> Si algo no funciona, escríbanos y le ayudamos: [WhatsApp/correo de soporte].
>
> Gracias,
> [Firma]

Notas para quien lo envíe: **este texto no se ha enviado a nadie**; el envío lo decide y lo hace John. Si se distribuye a varias empresas, mencionar el enlace de su tienda (`?tienda=1&emp=…`) con el nuevo dominio. `github.io` sigue funcionando, así que no hay urgencia ni corte.

## Orden sugerido de la Etapa 4
1. Decidir el modelo de roles por empresa y aprobar su publicación de reglas (sección 0) — **bloquea** invitar clientes con administrador propio.
2. Fase manual: documento `suscripcion/estado` + módulo `js/suscripcion.js` (avisos y límites en el cliente) + pantalla de «Plataforma» para John. Sin pasarela.
3. 3-5 pilotos de pago manual; medir uso real para ajustar planes y límites.
4. Elegir pasarela (Tilopay/PagueloFacil vs Paddle) con tarifas confirmadas; decidir Blaze; Cloud Function + webhook.
5. Reglas de aplicación en servidor (fase 2) tras pruebas en PRUEBA.
6. Términos de servicio y política de privacidad de VEN CRM revisados por abogado antes de cobrar.

## Pendiente de decisión de John
- Aprobar el cambio a administrador **por empresa** y su publicación de reglas.
- Pasar a **Blaze** (gasto por uso) cuando haya servidor y más de unas pocas empresas.
- Precios y límites definitivos tras los pilotos.
- Pasarela de cobro y apertura de la cuenta (a nombre de quién, con qué datos fiscales).
- Envío del aviso a los usuarios de github.io.
