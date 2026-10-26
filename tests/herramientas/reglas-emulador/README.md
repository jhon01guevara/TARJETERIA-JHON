# Pruebas de reglas de Firestore con el emulador

No forman parte de `npm test` (necesitan Java y el emulador). Sirven para probar `firestore.rules` **antes** de publicarlas.

Requisitos fuera del repo: Java (JRE 21+) y, en una carpeta aparte (`PRUEBAS`, por omisión `/workspace/pruebas-reglas`):
`npm i @firebase/rules-unit-testing firebase firebase-tools`. El emulador se descarga la primera vez (usar el mismo `HOME` después: `EMU_HOME`).

| Archivo | Qué prueba |
|---|---|
| `reglas-generales.test.js` | 27 pruebas de las reglas publicadas el 2026-10-24 (vendedores, chats, tienda pública, administración…) |
| `reglas-pedido-envio.test.js` | Fase 24: `tienda_pedidos` con `envio` (raíz y `empresas/{eid}`): válido pasa, sin `envio` pasa, tipos/tamaños/claves inválidos fallan, lo demás del pedido no cambia, invitados no leen, vendedor solo cambia `estado`, admin sí actualiza la guía |

```bash
./run.sh ../../../firestore.rules                                   # reglas nuevas: 32/32
EXPECT_ENVIO=0 ./run.sh ../../../docs/respaldo-reglas-anteriores-2026-10-25.rules   # reglas anteriores: rechazan envio (32/32 con esa expectativa)
./run.sh ../../../firestore.rules reglas-generales.test.js          # 27/27 con las reglas nuevas
```

**Aislamiento entre empresas (2026-10-26):** `reglas-aislamiento.test.js` (19 pruebas): un administrador solo ve las empresas donde es miembro; el maestro (UID fijo) ve todas; vendedores, roles, dominios y tienda pública. Ver `docs/AISLAMIENTO-EMPRESAS.md`.
`./run.sh ../../../firestore.rules reglas-aislamiento.test.js`
