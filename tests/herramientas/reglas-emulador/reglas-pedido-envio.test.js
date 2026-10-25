/* Fase 24 · reglas de Firestore para tienda_pedidos con el campo `envio` (transportista elegido en la tienda).
   Se ejecuta contra el EMULADOR de Firestore (no forma parte de `npm test`). Ver README.md.
   RULES=/ruta/firestore.rules  EXPECT_ENVIO=1 (por omisión) · EXPECT_ENVIO=0 para ver que las reglas ANTERIORES rechazan `envio`. */
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs'); const test = require('node:test');
const ADM = 'o7bHndKtswSHreFnVwORqBSUKL43';
const ENVIO = process.env.EXPECT_ENVIO !== '0';
let env;
test.before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-tarjeteria-envio',
    firestore: { rules: fs.readFileSync(process.env.RULES, 'utf8'), host: '127.0.0.1', port: 8080 } });
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await db.doc('roles/vend1').set({ rol: 'vend' });
    await db.doc('roles/vend2').set({ rol: 'vend' });
    for (const base of ['', 'empresas/emp1/']) {
      await db.doc(base + 'tienda_pedidos/p0').set({ id: 'p0', ref: 'vend1', estado: 'nuevo', total: 1, envio: { agencia: 'X', tipo: 'nacional' } });
    }
    await db.doc('empresas/emp1/miembros/vend1').set({ uid: 'vend1' });
  });
});
test.after(() => env.cleanup());
const as = (uid) => env.authenticatedContext(uid).firestore();
const admin = () => env.authenticatedContext(ADM).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const RUTAS = ['tienda_pedidos', 'empresas/emp1/tienda_pedidos'];
let n = 0;
const nuevoId = () => 'p' + (++n) + '_' + Date.now();
const ped = (o = {}) => { const id = nuevoId(); return Object.assign({ id, cid: 'l1', lead: { name: 'Ana', tel: '5071234567', email: 'a@b.co', empresa: 'ACME', dir: 'Calle 1', terminos: { ok: true, fecha: 'x', fmt: 'x', ver: '1', ua: 'x' } },
  items: [{ id: 'i', n: 'Tarjeta', p: 1, q: 2 }], total: 2, nota: 'n', ref: 'admin', ts: Date.now(), estado: 'nuevo' }, o); };
/* tal como lo escribe la tienda: shopEnvDatos + sanEnv (los vacíos se omiten) */
const envNac = (o = {}) => Object.assign({ agencia: 'Transporte Tal', fid: 'f123', tipo: 'nacional', rec: 'Juan Pérez', rtel: '6123-4567', pais: 'Panamá', prov: 'Panamá', ciudad: 'Ciudad de Panamá', suc: 'Sucursal Centro', dir: 'Calle 50, edificio 3', ref: 'Cerca del banco' }, o);
const envInt = (o = {}) => Object.assign({ agencia: 'DHL', fid: 'f9', tipo: 'internacional', rec: 'John Smith', rtel: '+1 305 555 0100', rced: 'E-8-1234', pais: 'Estados Unidos', ciudad: 'Miami', dir: '123 Ocean Dr' }, o);
const set = (ruta, p) => anon().doc(ruta + '/' + p.id).set(p);
const ok = ENVIO ? assertSucceeds : assertFails;   // con las reglas anteriores, `envio` se rechaza

for (const ruta of RUTAS) {
  test(`[${ruta}] pedido SIN envio sigue pasando (como antes)`, async () => { await assertSucceeds(set(ruta, ped())); });
  test(`[${ruta}] pedido con envio nacional completo (formato real de la app)`, async () => { await ok(set(ruta, ped({ envio: envNac() }))); });
  test(`[${ruta}] pedido con envio internacional`, async () => { await ok(set(ruta, ped({ envio: envInt() }))); });
  test(`[${ruta}] envio mínimo (solo agencia y tipo)`, async () => { await ok(set(ruta, ped({ envio: { agencia: 'A', tipo: 'nacional' } }))); });
  test(`[${ruta}] envio en el límite exacto de cada campo pasa`, async () => {
    await ok(set(ruta, ped({ envio: { agencia: 'a'.repeat(80), tipo: 'nacional', fid: 'f'.repeat(30), rec: 'r'.repeat(120), rtel: '1'.repeat(40), rced: 'c'.repeat(30), pais: 'p'.repeat(60), prov: 'v'.repeat(80), ciudad: 'c'.repeat(80), suc: 's'.repeat(100), dir: 'd'.repeat(200), ref: 'r'.repeat(200) } })));
  });
  test(`[${ruta}] pedido con envio y nota larga con la constancia sigue limitado a 500`, async () => {
    await assertFails(set(ruta, ped({ envio: envNac(), nota: 'x'.repeat(501) })));
    await ok(set(ruta, ped({ envio: envNac(), nota: 'x'.repeat(500) })));
  });
  test(`[${ruta}] envio inválido se rechaza: tipo`, async () => {
    await assertFails(set(ruta, ped({ envio: envNac({ tipo: 'aereo' }) })));
    await assertFails(set(ruta, ped({ envio: envNac({ tipo: 1 }) })));
    await assertFails(set(ruta, ped({ envio: envNac({ tipo: '' }) })));
    const e = envNac(); delete e.tipo; await assertFails(set(ruta, ped({ envio: e })));
  });
  test(`[${ruta}] envio inválido se rechaza: agencia obligatoria, no vacía`, async () => {
    const e = envNac(); delete e.agencia; await assertFails(set(ruta, ped({ envio: e })));
    await assertFails(set(ruta, ped({ envio: envNac({ agencia: '' }) })));
    await assertFails(set(ruta, ped({ envio: envNac({ agencia: 5 }) })));
  });
  test(`[${ruta}] envio inválido se rechaza: tamaño excedido en cada campo`, async () => {
    const lim = { agencia: 80, fid: 30, rec: 120, rtel: 40, rced: 30, pais: 60, prov: 80, ciudad: 80, suc: 100, dir: 200, ref: 200 };
    for (const [k, m] of Object.entries(lim)) await assertFails(set(ruta, ped({ envio: envNac({ [k]: 'x'.repeat(m + 1) }) })));
  });
  test(`[${ruta}] envio inválido se rechaza: tipos de dato`, async () => {
    for (const k of ['fid', 'rec', 'rtel', 'rced', 'pais', 'prov', 'ciudad', 'suc', 'dir', 'ref']) {
      await assertFails(set(ruta, ped({ envio: envNac({ [k]: 123 }) })));
      await assertFails(set(ruta, ped({ envio: envNac({ [k]: ['x'] }) })));
      await assertFails(set(ruta, ped({ envio: envNac({ [k]: null }) })));
    }
  });
  test(`[${ruta}] envio inválido se rechaza: no es un mapa`, async () => {
    for (const v of ['texto', 5, true, null, ['a'], []]) await assertFails(set(ruta, ped({ envio: v })));
  });
  test(`[${ruta}] envio inválido se rechaza: claves extra (incluidas las que solo escribe el panel)`, async () => {
    for (const x of [{ guia: 'G1' }, { cont: 'c' }, { obs: 'o' }, { bultos: 1 }, { peso: 1.5 }, { etq: 1 }, { basura: 'x' }, { admin: true }])
      await assertFails(set(ruta, ped({ envio: envNac(x) })));
  });
  test(`[${ruta}] lo demás del pedido NO cambia: sigue fallando lo que fallaba`, async () => {
    const e = ENVIO ? { envio: envNac() } : {};
    await assertFails(set(ruta, ped({ estado: 'atendido', ...e })));
    await assertFails(set(ruta, ped({ total: -1, ...e })));
    await assertFails(set(ruta, ped({ items: [], ...e })));
    await assertFails(set(ruta, ped({ items: Array.from({ length: 101 }, () => ({ id: 'i', n: 'x', p: 1, q: 1 })), ...e })));
    await assertFails(set(ruta, ped({ ref: 'no-existe', ...e })));
    await assertFails(set(ruta, ped({ cid: 5, ...e })));
    await assertFails(set(ruta, ped({ ts: 'hoy', ...e })));
    await assertFails(set(ruta, Object.assign(ped(e), { extra: 'x' })));
    const p = ped(e); p.lead.basura = 'x'; await assertFails(set(ruta, p));
    const q = ped(e); await assertFails(anon().doc(ruta + '/otro_id').set(q));            // el id del documento debe coincidir
  });
  test(`[${ruta}] invitados NO leen, actualizan ni borran pedidos; ni cuentas ajenas`, async () => {
    await assertFails(anon().doc(ruta + '/p0').get());
    await assertFails(anon().collection(ruta).get());
    await assertFails(anon().doc(ruta + '/p0').update({ estado: 'atendido' }));
    await assertFails(anon().doc(ruta + '/p0').delete());
    await assertFails(anon().doc(ruta + '/p0').update({ envio: { agencia: 'Y', tipo: 'nacional' } }));
    await assertFails(as('intruso').doc(ruta + '/p0').get());
    await assertFails(as('vend2').doc(ruta + '/p0').get());     // pedido de otro vendedor
    await assertFails(as('vend2').doc(ruta + '/p0').update({ estado: 'atendido' }));
  });
  test(`[${ruta}] vendedor responsable: lee y solo cambia estado; no toca envio ni total`, async () => {
    await assertSucceeds(as('vend1').doc(ruta + '/p0').get());
    await assertSucceeds(as('vend1').doc(ruta + '/p0').update({ estado: 'atendido' }));
    await assertFails(as('vend1').doc(ruta + '/p0').update({ envio: { agencia: 'Y', tipo: 'nacional' } }));
    await assertFails(as('vend1').doc(ruta + '/p0').update({ total: 0 }));
    await assertFails(as('vend1').doc(ruta + '/p0').delete());
  });
  test(`[${ruta}] administración: lee, actualiza (incluye guía de envío) y borra`, async () => {
    await assertSucceeds(admin().doc(ruta + '/p0').get());
    await assertSucceeds(admin().doc(ruta + '/p0').update({ 'envio.guia': 'G123', 'envio.peso': 2.5, 'envio.bultos': 2 }));
    await assertSucceeds(admin().doc(ruta + '/p0').update({ 'envio.etq': Date.now() }));
    await assertSucceeds(admin().doc(ruta + '/p0').delete());
    await env.withSecurityRulesDisabled(c => c.firestore().doc(ruta + '/p0').set({ id: 'p0', ref: 'vend1', estado: 'nuevo', total: 1, envio: { agencia: 'X', tipo: 'nacional' } }));
  });
}
