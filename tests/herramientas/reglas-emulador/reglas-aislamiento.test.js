/* Aislamiento entre empresas (firestore.rules, 2026-10-26) con el EMULADOR de Firestore. No forma parte de `npm test` (necesita Java).
   Uso: ./run.sh ../../../firestore.rules reglas-aislamiento.test.js
   Idea: un administrador (roles/{uid}.rol == 'admin') solo ve las empresas donde es miembro (empresas/{eid}/miembros/{uid}); el maestro (UID fijo) ve todas. */
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs'); const test = require('node:test');
const M = 'o7bHndKtswSHreFnVwORqBSUKL43';
let env;
const lead = (ref) => ({ id: 'L1', name: 'Cliente', tel: '1', email: 'a@b.c', empresa: 'x', dir: 'd', ref, ts: 1, imp: false });
const pedido = (ref) => ({ id: 'P1', cid: 'c', lead: { name: 'n' }, items: [{ id: 1 }], total: 1, nota: '', ref, ts: 1, estado: 'nuevo' });
test.before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-tarjeteria',
    firestore: { rules: fs.readFileSync(process.env.RULES, 'utf8'), host: '127.0.0.1', port: 8080 } });
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await db.doc('roles/adminA').set({ rol: 'admin' }); await db.doc('roles/adminB').set({ rol: 'admin' });
    await db.doc('roles/adminNone').set({ rol: 'admin' });
    await db.doc('roles/vendA').set({ rol: 'vend' }); await db.doc('roles/vendB').set({ rol: 'vend' });
    await db.doc('roles/vendNone').set({ rol: 'vend' });
    for (const e of ['empA', 'empB']) {
      const v = e === 'empA' ? 'vendA' : 'vendB', a = e === 'empA' ? 'adminA' : 'adminB';
      await db.doc(`empresas/${e}`).set({ nombre: e, marca: {} });
      await db.doc(`empresas/${e}/miembros/${a}`).set({ uid: a }); await db.doc(`empresas/${e}/miembros/${v}`).set({ uid: v });
      await db.doc(`empresas/${e}/panel/data`).set({ fac: [] }); await db.doc(`empresas/${e}/panel/loginbg`).set({ x: 1 });
      await db.doc(`empresas/${e}/panel_public/general`).set({ n: 1 });
      await db.doc(`empresas/${e}/panel_public/contador`).set({ sig: 1 });
      await db.doc(`empresas/${e}/panel_public/clientes`).set({ cli: [{ id: 'c' }] });
      await db.doc(`empresas/${e}/catalogo/c1`).set({ id: 'c1' });
      await db.doc(`empresas/${e}/galeria/g1`).set({ id: 'g1', o: 'admin' });
      await db.doc(`empresas/${e}/vendedores/${v}/privado/data`).set({ fac: [] });
      await db.doc(`empresas/${e}/tienda_items/t1`).set({ id: 't1' });
      await db.doc(`empresas/${e}/tienda_leads/l0`).set({ id: 'l0', ref: 'admin', imp: false });
      await db.doc(`empresas/${e}/tienda_pedidos/p0`).set({ id: 'p0', ref: 'admin', estado: 'nuevo' });
      await db.doc(`empresas/${e}/chats/c1`).set({ id: 'c1', type: 'dm', members: ['admin', v], by: 'admin' });
      await db.doc(`empresas/${e}/chats/c1/msgs/m1`).set({ from: 'admin', t: 'hola', ts: 1 });
      await db.doc(`empresas/${e}/llamadas/ll1`).set({ id: 'll1', from: 'admin', to: v, state: 'ringing', ts: 1 });
      await db.doc(`empresas/${e}/llamadas/ll1/ice/i1`).set({ by: 'admin' });
      await db.doc(`empresas/${e}/marketing_projects/m1`).set({ id: 'm1' });
      await db.doc(`empresas/${e}/investigacion_items/i1`).set({ id: 'i1' });
      await db.doc(`empresas/${e}/wa_conversaciones/w1`).set({ id: 'w1' });
    }
    await db.doc('dominios/a.com').set({ host: 'a.com', empresaId: 'empA' });
    await db.doc('dominios/b.com').set({ host: 'b.com', empresaId: 'empB' });
    await db.doc('panel/data').set({ x: 1 }); await db.doc('panel_public/clientes').set({ cli: [] }); await db.doc('chats/c9').set({ members: ['admin'] });
  });
});
test.after(() => env.cleanup());
const as = (uid) => env.authenticatedContext(uid).firestore();
const master = () => env.authenticatedContext(M).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const LEE = (e) => [`empresas/${e}`, `empresas/${e}/panel/data`, `empresas/${e}/panel/loginbg`, `empresas/${e}/panel_public/general`,
  `empresas/${e}/panel_public/contador`, `empresas/${e}/panel_public/clientes`, `empresas/${e}/catalogo/c1`, `empresas/${e}/galeria/g1`,
  `empresas/${e}/tienda_leads/l0`, `empresas/${e}/tienda_pedidos/p0`, `empresas/${e}/chats/c1`, `empresas/${e}/chats/c1/msgs/m1`,
  `empresas/${e}/llamadas/ll1`, `empresas/${e}/llamadas/ll1/ice/i1`, `empresas/${e}/marketing_projects/m1`, `empresas/${e}/investigacion_items/i1`,
  `empresas/${e}/wa_conversaciones/w1`, `empresas/${e}/miembros/${e === 'empA' ? 'vendA' : 'vendB'}`];
const ESCRIBE = (e) => [[`empresas/${e}/panel/data`, { fac: [1] }], [`empresas/${e}/panel_public/general`, { n: 2 }], [`empresas/${e}/catalogo/c2`, { id: 'c2' }],
  [`empresas/${e}/tienda_items/t9`, { id: 't9' }], [`empresas/${e}/tienda_items/__cfg`, { x: 1 }], [`empresas/${e}/marketing_projects/m2`, { id: 'm2' }],
  [`empresas/${e}/investigacion_items/i2`, { id: 'i2' }], [`empresas/${e}/wa_conversaciones/w2`, { id: 'w2' }]];

// ---------- el administrador de A: A sí, B no
test('adminA (miembro de empA) lee TODO lo de empA', async () => {
  for (const p of LEE('empA')) await assertSucceeds(as('adminA').doc(p).get());
});
test('adminA escribe en empA (panel, catálogo, tienda, marketing…)', async () => {
  for (const [p, d] of ESCRIBE('empA')) await assertSucceeds(as('adminA').doc(p).set(d));
  await assertSucceeds(as('adminA').doc('empresas/empA').set({ nombre: 'A2' }, { merge: true }));
  await assertSucceeds(as('adminA').doc('empresas/empA/miembros/vendNuevo').set({ uid: 'vendNuevo', ts: 1 }));
});
test('adminA NO lee NADA de empB (ni el documento de la empresa)', async () => {
  for (const p of LEE('empB')) await assertFails(as('adminA').doc(p).get());
});
test('adminA NO escribe en empB', async () => {
  for (const [p, d] of ESCRIBE('empB')) await assertFails(as('adminA').doc(p).set(d));
  await assertFails(as('adminA').doc('empresas/empB').set({ nombre: 'hack' }, { merge: true }));
  await assertFails(as('adminA').doc('empresas/empB/panel/data').delete());
});
test('adminA NO puede añadirse como miembro de empB ni cambiar a otros', async () => {
  await assertFails(as('adminA').doc('empresas/empB/miembros/adminA').set({ uid: 'adminA' }));
  await assertFails(as('adminA').doc('empresas/empB/miembros/vendB').delete());
});
test('adminA NO usa la identidad «admin» en empB (chats, mensajes, llamadas, galería, pedidos)', async () => {
  await assertFails(as('adminA').collection('empresas/empB/chats').where('members', 'array-contains', 'admin').get());
  await assertFails(as('adminA').doc('empresas/empB/chats/c1/msgs/m2').set({ from: 'admin', t: 'x', ts: 2 }));
  await assertFails(as('adminA').doc('empresas/empB/llamadas/l2').set({ from: 'admin', to: 'vendB' }));
  await assertFails(as('adminA').doc('empresas/empB/galeria/g1').delete());
  await assertFails(as('adminA').collection('empresas/empB/tienda_pedidos').where('ref', '==', 'admin').get());
  await assertFails(as('adminA').doc('empresas/empB/tienda_pedidos/p0').update({ estado: 'atendido' }));
});
test('adminA SÍ usa su identidad «admin» en empA (consultas del panel)', async () => {
  await assertSucceeds(as('adminA').collection('empresas/empA/chats').where('members', 'array-contains', 'admin').get());
  await assertSucceeds(as('adminA').collection('empresas/empA/tienda_pedidos').get());
  await assertSucceeds(as('adminA').collection('empresas/empA/tienda_leads').get());
  await assertSucceeds(as('adminA').doc('empresas/empA/chats/c1/msgs/m2').set({ from: 'admin', t: 'x', ts: 2 }));
  await assertSucceeds(as('adminA').doc('empresas/empA/llamadas/l2').set({ from: 'admin', to: 'vendA' }));
  await assertSucceeds(as('adminA').doc('empresas/empA/tienda_pedidos/p0').update({ estado: 'atendido' }));
});
test('adminA NO crea empresas ni borra la de otro; NO lista la colección empresas', async () => {
  await assertFails(as('adminA').doc('empresas/empNueva').set({ nombre: 'n' }));
  await assertFails(as('adminA').doc('empresas/empB').delete());
  // Nota: en rules_version 2 el comodín empresas/{eid}/{document=**} también cubre el documento empresas/{eid}, así que el
  // administrador DE ESA empresa podría borrar su propio documento de metadatos (no sus subcolecciones). Aceptado: no cruza empresas.
  await assertFails(as('adminA').collection('empresas').get()); // limitación conocida: el panel de un admin no-maestro no puede listar todas (ver informe)
});
test('adminA NO toca la raíz heredada (panel, clientes, chats) ni lista roles', async () => {
  await assertFails(as('adminA').doc('panel/data').get());
  await assertFails(as('adminA').doc('panel_public/clientes').get());
  await assertFails(as('adminA').doc('chats/c9').get());
  await assertFails(as('adminA').collection('roles').get());
  await assertSucceeds(as('adminA').doc('roles/adminA').get());
});
// ---------- administrador sin ninguna empresa
test('un administrador SIN pertenencia no ve ninguna empresa', async () => {
  for (const e of ['empA', 'empB']) for (const p of LEE(e)) await assertFails(as('adminNone').doc(p).get());
  await assertFails(as('adminNone').doc('empresas/empA/panel/data').set({ x: 1 }));
});
// ---------- maestro
test('el MAESTRO conserva acceso total a todas las empresas y a la raíz', async () => {
  for (const e of ['empA', 'empB']) { for (const p of LEE(e)) await assertSucceeds(master().doc(p).get()); for (const [p, d] of ESCRIBE(e)) await assertSucceeds(master().doc(p).set(d)); }
  await assertSucceeds(master().collection('empresas').get());
  await assertSucceeds(master().collection('roles').get());
  await assertSucceeds(master().doc('empresas/empNueva').set({ nombre: 'n' }));
  await assertSucceeds(master().doc('empresas/empNueva/miembros/adminC').set({ uid: 'adminC' }));
  await assertSucceeds(master().doc('panel/data').get());
  await assertSucceeds(master().collection('empresas/empB/chats').where('members', 'array-contains', 'admin').get());
  await assertSucceeds(master().doc('empresas/empB/chats/c1/msgs/m3').set({ from: 'admin', t: 'x', ts: 3 }));
  await assertSucceeds(master().doc('roles/adminZ').set({ rol: 'admin' }));
});
// ---------- vendedores
test('vendedor de A: ve lo común de A, nada de B; no escribe en la administración', async () => {
  const v = as('vendA');
  for (const p of ['panel_public/general', 'panel_public/clientes', 'panel_public/contador', 'catalogo/c1', 'galeria/g1', 'marketing_projects/m1']) await assertSucceeds(v.doc('empresas/empA/' + p).get());
  for (const p of ['panel_public/general', 'panel_public/clientes', 'catalogo/c1', 'marketing_projects/m1', 'panel/data']) await assertFails(v.doc('empresas/empB/' + p).get());
  await assertFails(v.doc('empresas/empA/panel/data').get());
  await assertFails(v.doc('empresas/empA/tienda_items/t9').set({ id: 't9' }));
  await assertFails(v.doc('empresas/empA/miembros/vendA2').set({ uid: 'x' }));
  await assertSucceeds(v.doc('empresas/empA/vendedores/vendA/privado/data').set({ fac: [1] }));
  await assertFails(v.doc('empresas/empB/vendedores/vendA/privado/data').set({ fac: [1] })); // no escribe su espacio dentro de otra empresa
  await assertSucceeds(v.collection('empresas/empA/chats').where('members', 'array-contains', 'vendA').get());
  await assertSucceeds(v.doc('empresas/empA/chats/c1/msgs/m4').set({ from: 'vendA', t: 'x', ts: 4 }));
  await assertFails(v.doc('empresas/empB/chats/c1/msgs/m4').set({ from: 'vendA', t: 'x', ts: 4 }));
  await assertSucceeds(v.doc('empresas/empA').get()); // marca de su empresa
});
test('vendedor sin pertenencia no ve ninguna empresa', async () => {
  for (const p of ['panel_public/general', 'catalogo/c1']) { await assertFails(as('vendNone').doc('empresas/empA/' + p).get()); await assertFails(as('vendNone').doc('empresas/empB/' + p).get()); }
});
// ---------- roles
test('roles: adminA solo gestiona VENDEDORES; no crea ni degrada administradores', async () => {
  await assertSucceeds(as('adminA').doc('roles/vendNuevo').set({ rol: 'vend', n: 'N', panels: ['home'] }));
  await assertFails(as('adminA').doc('roles/adminNuevo').set({ rol: 'admin' }));
  await assertFails(as('adminA').doc('roles/vendA').set({ rol: 'admin' }));
  await assertFails(as('adminA').doc('roles/adminB').set({ rol: 'vend' }));
  await assertFails(as('adminA').doc('roles/adminB').delete());
  await assertFails(as('adminA').doc('roles/adminA').set({ rol: 'vend' })); // no se auto-degrada por error ni se re-escribe como otro tipo
  await assertSucceeds(as('adminA').doc('roles/vendNuevo').delete());
});
test('roles: un vendedor no cambia roles', async () => {
  await assertFails(as('vendA').doc('roles/vendA').set({ rol: 'admin' }));
  await assertFails(as('vendA').doc('roles/vendB').delete());
});
test('LIMITACIÓN CONOCIDA: roles/{vendedor} es identidad global; un administrador de empresa puede editar/borrar el rol de un vendedor de otra empresa (documentada en el informe)', async () => {
  await assertSucceeds(as('adminA').doc('roles/vendB').set({ rol: 'vend', n: 'B', panels: [] }));
});
// ---------- dominios
test('dominios: lectura pública; cada administrador solo asocia dominios a SU empresa', async () => {
  await assertSucceeds(anon().doc('dominios/b.com').get());
  await assertSucceeds(as('adminA').doc('dominios/nuevo-a.com').set({ host: 'nuevo-a.com', empresaId: 'empA' }));
  await assertFails(as('adminA').doc('dominios/nuevo-b.com').set({ host: 'nuevo-b.com', empresaId: 'empB' }));
  await assertFails(as('adminA').doc('dominios/b.com').set({ host: 'b.com', empresaId: 'empA' }));   // secuestro de dominio
  await assertFails(as('adminA').doc('dominios/b.com').delete());
  await assertFails(as('adminA').doc('dominios/a.com').set({ host: 'a.com', empresaId: 'empB' }));   // no regalar el suyo a B
  await assertSucceeds(as('adminA').doc('dominios/a.com').delete());
  await assertFails(as('vendA').doc('dominios/x.com').set({ host: 'x.com', empresaId: 'empA' }));
  await assertSucceeds(master().doc('dominios/b.com').set({ host: 'b.com', empresaId: 'empB' }));
});
// ---------- tienda pública y presencia
test('tienda pública: sigue sin sesión en TODAS las empresas (lectura de productos, alta de lead y pedido)', async () => {
  for (const e of ['empA', 'empB']) {
    await assertSucceeds(anon().doc(`empresas/${e}/tienda_items/t1`).get());
    await assertSucceeds(anon().doc(`empresas/${e}/tienda_leads/L1`).set(lead('admin')));
    await assertSucceeds(anon().doc(`empresas/${e}/tienda_pedidos/P1`).set(pedido('admin')));
    await assertFails(anon().doc(`empresas/${e}/tienda_pedidos/p0`).get());
    await assertFails(anon().doc(`empresas/${e}/panel/data`).get());
  }
  await assertSucceeds(anon().doc('empresas/empA/tienda_items/t1').get());
});
test('identidad global: perfiles/presencia siguen igual', async () => {
  await assertSucceeds(as('vendA').doc('perfiles/vendA').set({ n: 1 }));
  await assertSucceeds(as('vendA').doc('presencia/vendA').set({ ts: 1 }));
  await assertFails(as('vendA').doc('presencia/vendB').set({ ts: 1 }));
  await assertSucceeds(as('adminA').doc('presencia/vendA').get());
  await assertFails(as('vendA').doc('presencia/vendB').get());
});
