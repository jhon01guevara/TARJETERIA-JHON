const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs'); const test = require('node:test');
const ADM = 'o7bHndKtswSHreFnVwORqBSUKL43';
let env;
test.before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-tarjeteria',
    firestore: { rules: fs.readFileSync(process.env.RULES, 'utf8'), host: '127.0.0.1', port: 8080 } });
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await db.doc('roles/vend1').set({ rol: 'vend' });
    await db.doc('roles/vend2').set({ rol: 'vend' });
    await db.doc('roles/adm2').set({ rol: 'admin' });
    await db.doc('empresas/emp1').set({ marca: { c1: '#fff' } });
    await db.doc('empresas/emp1/miembros/vend1').set({ uid: 'vend1' });
    await db.doc('empresas/emp1/miembros/vend2').set({ uid: 'vend2' });
    await db.doc('empresas/emp1/miembros/exvend').set({ uid: 'exvend' }); // miembro sin rol
    await db.doc('empresas/emp1/panel/data').set({ cli: [] });
    await db.doc('empresas/emp1/panel_public/general').set({ n: 1 });
    await db.doc('empresas/emp1/panel_public/contador').set({ sig: 1 });
    await db.doc('empresas/emp1/panel_public/clientes').set({ cli: [{ id: 'x' }] });
    await db.doc('empresas/emp1/catalogo/c1').set({ id: 'c1' });
    await db.doc('empresas/emp1/galeria/g1').set({ id: 'g1', o: 'vend1' });
    await db.doc('empresas/emp1/vendedores/vend2/privado/data').set({ fac: [] });
    await db.doc('empresas/emp1/vendedores/vend1/privado/data').set({ fac: [] });
    await db.doc('empresas/emp1/marketing_projects/m1').set({ id: 'm1' });
    await db.doc('empresas/emp1/tienda_items/t1').set({ id: 't1' });
    await db.doc('empresas/emp1/tienda_pedidos/p0').set({ id: 'p0', ref: 'vend1', estado: 'nuevo' });
    await db.doc('empresas/emp1/chats/cA').set({ id: 'cA', type: 'dm', members: ['vend1', 'admin'] });
    await db.doc('empresas/emp1/chats/cA/msgs/m0').set({ from: 'admin', t: 'hi', ts: 1 });
    await db.doc('empresas/emp1/chats/cB').set({ id: 'cB', type: 'dm', members: ['vend2', 'admin'] });
    await db.doc('empresas/emp1/llamadas/lA').set({ id: 'lA', from: 'admin', to: 'vend1', state: 'ringing', ts: 1 });
    await db.doc('empresas/emp1/llamadas/lA/ice/i1').set({ by: 'admin', c: {}, ts: 1 });
    await db.doc('empresas/emp1/tienda_leads/lead0').set({ id: 'lead0', ref: 'vend1', imp: false });
    await db.doc('empresas/emp2/panel_public/clientes').set({ cli: [{ id: 'y' }] });
    await db.doc('panel_public/clientes').set({ cli: [{ id: 'y' }] });
    await db.doc('panel_public/general').set({ n: 1 });
    await db.doc('perfiles/vend1').set({ n: 1 });
    await db.doc('panel/data').set({ x: 1 });
    await db.doc('galeria/g1').set({ id: 'g1', o: 'vend1' });
  });
});
test.after(() => env.cleanup());
const as = (uid) => env.authenticatedContext(uid).firestore();
const admin = () => env.authenticatedContext(ADM).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// ---- Lo que NO debe poder hacerse (hallazgos H1-H3)
test('H1 vendedor NO lee/escribe empresas/emp1/panel/data (base admin)', async () => {
  await assertFails(as('vend1').doc('empresas/emp1/panel/data').get());
  await assertFails(as('vend1').doc('empresas/emp1/panel/data').set({ cli: [] }));
});
test('H1 vendedor NO lee datos privados de otro vendedor (empresa)', async () => {
  await assertFails(as('vend1').doc('empresas/emp1/vendedores/vend2/privado/data').get());
});
test('H1 vendedor NO escribe su propio documento miembros ni el de otro', async () => {
  await assertFails(as('vend1').doc('empresas/emp1/miembros/vend1').set({ uid: 'x' }));
  await assertFails(as('vend1').doc('empresas/emp1/miembros/hack').set({ uid: 'hack' }));
});
test('H1 vendedor NO modifica roles', async () => {
  await assertFails(as('vend1').doc('roles/vend1').set({ rol: 'admin' }));
});
test('H3 vendedor de emp1 NO lee clientes de emp2', async () => {
  await assertFails(as('vend1').doc('empresas/emp2/panel_public/clientes').get());
});
test('H2 cuenta SIN rol NO lee clientes/general/perfiles (raíz)', async () => {
  await assertFails(as('intruso').doc('panel_public/clientes').get());
  await assertFails(as('intruso').doc('panel_public/general').get());
  await assertFails(as('intruso').doc('perfiles/vend1').get());
  await assertFails(as('intruso').doc('galeria/g1').get());
});
test('H2/H3 cuenta sin ser miembro NO lee clientes de emp1', async () => {
  await assertFails(as('intruso').doc('empresas/emp1/panel_public/clientes').get());
  await assertFails(as('intruso').doc('empresas/emp1/catalogo/c1').get());
});
test('intruso NO crea galería ni chats ni llamadas', async () => {
  await assertFails(as('intruso').doc('galeria/gx').set({ id: 'gx', o: 'intruso' }));
  await assertFails(as('intruso').doc('chats/cx').set({ id: 'cx', members: ['intruso', 'admin'] }));
  await assertFails(as('intruso').doc('llamadas/lx').set({ from: 'intruso', to: 'admin' }));
});
test('no cambiar dueño de una foto de galería', async () => {
  await assertFails(as('vend1').doc('empresas/emp1/galeria/g1').update({ o: 'vend2' }));
});

// ---- Lo que SÍ debe funcionar (panel)
test('admin conserva acceso total', async () => {
  const a = admin();
  await assertSucceeds(a.doc('empresas/emp1/panel/data').get());
  await assertSucceeds(a.doc('empresas/emp1/panel/data').set({ cli: [] }));
  await assertSucceeds(a.doc('empresas/emp1/miembros/vend9').set({ uid: 'vend9' }));
  await assertSucceeds(a.doc('empresas/emp1/vendedores/vend2/privado/data').get());
  await assertSucceeds(a.doc('roles/vend1').set({ rol: 'vend' }));
  await assertSucceeds(a.collection('roles').get());
  await assertSucceeds(a.collection('empresas').get());
  await assertSucceeds(a.doc('empresas/emp1').set({ marca: { c1: '#000' } }, { merge: true }));
  await assertSucceeds(a.doc('empresas/emp1/tienda_items/__cfg').set({ __cfg: true }));
  await assertSucceeds(a.doc('empresas/emp1/panel/loginbg').set({ x: 1 }));
  await assertSucceeds(a.doc('empresas/emp1/wa_conversaciones/5071').set({ estado: 'humano' }));
  await assertSucceeds(a.doc('empresas/emp1/marketing_projects/m2').set({ id: 'm2' }));
  await assertSucceeds(a.doc('empresas/emp1/panel_public/clientes').set({ cli: [] }));
});
test('admin por documento roles (rol=admin, uid distinto al fijo)', async () => {
  await assertSucceeds(as('adm2').doc('empresas/emp1/panel/data').get());
});
test('vendedor miembro: lee lo común de su empresa', async () => {
  const v = as('vend1');
  await assertSucceeds(v.doc('empresas/emp1/panel_public/general').get());
  await assertSucceeds(v.doc('empresas/emp1/panel_public/clientes').get());
  await assertSucceeds(v.doc('empresas/emp1/panel_public/contador').get());
  await assertSucceeds(v.doc('empresas/emp1/catalogo/c1').get());
  await assertSucceeds(v.collection('empresas/emp1/catalogo').get());
  await assertSucceeds(v.collection('empresas/emp1/galeria').get());
  await assertSucceeds(v.doc('empresas/emp1/tienda_items/t1').get());
});
test('vendedor miembro: lee el documento de su empresa (marca)', async () => {
  await assertSucceeds(as('vend1').doc('empresas/emp1').get());
});
test('vendedor miembro: escribe lo suyo', async () => {
  const v = as('vend1');
  await assertSucceeds(v.doc('empresas/emp1/vendedores/vend1/privado/data').set({ fac: [1] }));
  await assertSucceeds(v.doc('empresas/emp1/vendedores/vend1/privado/data').get());
  await assertSucceeds(v.doc('empresas/emp1/panel_public/contador').update({ sig: 2 }));
  await assertSucceeds(v.doc('empresas/emp1/panel_public/clientes').update({ cli: [{ id: 'x' }, { id: 'z' }] }));
  await assertSucceeds(v.doc('empresas/emp1/galeria/g2').set({ id: 'g2', o: 'vend1' }));
  await assertSucceeds(v.doc('empresas/emp1/galeria/g2').update({ t: 'nuevo' }));
  await assertSucceeds(v.doc('empresas/emp1/galeria/g2').delete());
  await assertSucceeds(v.doc('empresas/emp1/marketing_projects/m1').get());
  await assertSucceeds(v.doc('empresas/emp1/marketing_projects/m3').set({ id: 'm3' }));
  await assertSucceeds(v.doc('roles/vend1').get());
  await assertSucceeds(v.doc('perfiles/vend1').set({ n: 2 }));
  await assertSucceeds(v.doc('presencia/vend1').set({ t: 1 }));
  await assertSucceeds(v.doc('empresas/emp1/miembros/vend1').get());
});
test('vendedor: chats y llamadas en empresa', async () => {
  const v = as('vend1');
  await assertSucceeds(v.doc('empresas/emp1/chats/c1').set({ id: 'c1', type: 'dm', members: ['vend1', 'admin'] }));
  await assertSucceeds(v.doc('empresas/emp1/chats/c1/msgs/m1').set({ from: 'vend1', t: 'hola', ts: 1 }));
  await assertSucceeds(v.collection('empresas/emp1/chats').where('members', 'array-contains', 'vend1').get());
  await assertSucceeds(v.doc('empresas/emp1/llamadas/l1').set({ id: 'l1', from: 'vend1', to: 'admin' }));
});
test('vendedor: tienda (leads/pedidos propios)', async () => {
  const v = as('vend1');
  await assertSucceeds(v.collection('empresas/emp1/tienda_pedidos').where('ref', '==', 'vend1').get());
  await assertSucceeds(v.doc('empresas/emp1/tienda_pedidos/p0').update({ estado: 'atendido' }));
});
test('vendedor (raíz, MULTIEMP=false): sigue funcionando', async () => {
  const v = as('vend1');
  await assertSucceeds(v.doc('panel_public/clientes').get());
  await assertSucceeds(v.doc('panel_public/general').get());
  await assertSucceeds(v.doc('perfiles/vend1').get());
  await assertSucceeds(v.doc('galeria/g1').get());
  await assertSucceeds(v.doc('chats/c9').set({ id: 'c9', type: 'dm', members: ['vend1', 'admin'] }));
  await assertSucceeds(v.doc('llamadas/l9').set({ from: 'vend1', to: 'admin' }));
  await assertSucceeds(v.doc('galeria/g9').set({ id: 'g9', o: 'vend1' }));
});
test('tienda pública (sin sesión)', async () => {
  const a = anon();
  await assertSucceeds(a.doc('empresas/emp1/tienda_items/t1').get());
  await assertSucceeds(a.doc('tienda_items/abc').get());
  await assertSucceeds(a.doc('dominios/x').get());
});
const lead = (o = {}) => Object.assign({ id: 'l1', name: 'Ana', tel: '5071234567', email: 'a@b.co', empresa: 'ACME', dir: 'Calle 1', ref: 'admin', ts: Date.now(), imp: false }, o);
const ped = (o = {}) => Object.assign({ id: 'p1', cid: 'l1', lead: { name: 'Ana', tel: '5071234567', email: 'a@b.co', empresa: 'ACME', dir: 'Calle 1', terminos: { ok: true, fecha: 'x', fmt: 'x', ver: '1', ua: 'x' } },
  items: [{ id: 'i', n: 'Tarjeta', p: 1, q: 2 }], total: 2, nota: 'n', ref: 'admin', ts: Date.now(), estado: 'nuevo' }, o);
test('tienda pública: lead y pedido VÁLIDOS (formato real del cliente) se crean sin sesión', async () => {
  const a = anon();
  await assertSucceeds(a.doc('empresas/emp1/tienda_leads/l1').set(lead()));
  await assertSucceeds(a.doc('tienda_leads/l1').set(lead()));
  await assertSucceeds(a.doc('empresas/emp1/tienda_pedidos/p1').set(ped()));
  await assertSucceeds(a.doc('tienda_pedidos/p1').set(ped()));
  // lead con empresa/dir vacíos (como envía el cliente si no los llenó)
  await assertSucceeds(a.doc('empresas/emp1/tienda_leads/l2').set(lead({ id: 'l2', empresa: '', dir: '' })));
  await assertSucceeds(a.doc('empresas/emp1/tienda_pedidos/p2').set(ped({ id: 'p2', lead: { name: 'Ana', tel: '5071234567', email: 'a@b.co', empresa: '', dir: '', terminos: { ok: true } } })));
});
test('D tienda pública: lead/pedido con campos extra o gigantes se rechazan', async () => {
  const a = anon();
  await assertFails(a.doc('empresas/emp1/tienda_leads/l3').set(lead({ id: 'l3', empresa: 'x'.repeat(500) })));
  await assertFails(a.doc('empresas/emp1/tienda_leads/l4').set(lead({ id: 'l4', dir: 'x'.repeat(500) })));
  const p = ped({ id: 'p3' }); p.lead.basura = 'x';
  await assertFails(a.doc('empresas/emp1/tienda_pedidos/p3').set(p));
});
test('registro/borrado: un anónimo no lee pedidos ni leads', async () => {
  await assertFails(anon().doc('empresas/emp1/tienda_pedidos/p1').get());
  await assertFails(anon().doc('empresas/emp1/tienda_leads/l1').get());
});

// ---- Consultas (list) como las hace la app
test('LIST vendedor: chats propios (where members array-contains)', async () => {
  const v = as('vend1');
  const r = await assertSucceeds(v.collection('empresas/emp1/chats').where('members', 'array-contains', 'vend1').get());
  if (r.size < 1 || r.docs.some(d => !d.data().members.includes('vend1'))) throw new Error('chats vistos incorrectos');
  await assertSucceeds(v.collection('empresas/emp1/chats/cA/msgs').orderBy('ts').limitToLast(300).get());
});
test('vendedor NO lee chat ajeno ni por consulta ni directo', async () => {
  const v = as('vend1');
  await assertFails(v.doc('empresas/emp1/chats/cB').get());
  await assertFails(v.collection('empresas/emp1/chats').get());
  await assertFails(v.collection('empresas/emp1/chats/cB/msgs').get());
});
test('LIST vendedor: llamadas entrantes (where to == me and state == ringing)', async () => {
  const v = as('vend1');
  await assertSucceeds(v.collection('empresas/emp1/llamadas').where('to', '==', 'vend1').where('state', '==', 'ringing').get());
  await assertSucceeds(v.collection('empresas/emp1/llamadas/lA/ice').get());
});
test('LIST vendedor: leads/pedidos propios y galería', async () => {
  const v = as('vend1');
  await assertSucceeds(v.collection('empresas/emp1/tienda_leads').where('ref', '==', 'vend1').get());
  await assertSucceeds(v.collection('empresas/emp1/galeria').get());
});
test('LIST admin: chats, llamadas, leads, vendedores', async () => {
  const a = admin();
  await assertSucceeds(a.collection('empresas/emp1/chats').get());
  await assertSucceeds(a.collection('empresas/emp1/llamadas').get());
  await assertSucceeds(a.collection('empresas/emp1/tienda_leads').get());
  await assertSucceeds(a.collection('empresas/emp1/tienda_pedidos').get());
  await assertSucceeds(a.collection('empresas/emp1/vendedores').get());
});

// ---- Alta de vendedor: mktMiembroSet (get + set {uid,ts}) como admin
test('alta de vendedor: admin hace get + set {uid,ts} en miembros y el vendedor lee el suyo', async () => {
  const a = admin();
  const ref = a.doc('empresas/emp1/miembros/vendNuevo');
  const ex = await assertSucceeds(ref.get());
  if (!ex.exists) await assertSucceeds(ref.set({ uid: 'vendNuevo', ts: Date.now() }));
  await assertSucceeds(as('vendNuevo').doc('empresas/emp1/miembros/vendNuevo').get());
  await assertFails(as('vendNuevo').doc('empresas/emp1/miembros/vendNuevo').set({ uid: 'vendNuevo', ts: 1 }));
});
