/* Comprueba que catalogo_default.zip (catálogo de fábrica que carga js/app.js con JSZip) es legible,
   no está corrupto y que todo lo que el manifest referencia existe dentro del zip. Sin dependencias. */
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const buf=fs.readFileSync(path.join(__dirname,'..','catalogo_default.zip'));
const T=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0});
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function leer(){
 let e=buf.length-22;while(e>=0&&buf.readUInt32LE(e)!==0x06054b50)e--;
 assert.ok(e>=0,'sin directorio central');
 const n=buf.readUInt16LE(e+10);let p=buf.readUInt32LE(e+16);const m={};
 for(let i=0;i<n;i++){
  assert.strictEqual(buf.readUInt32LE(p),0x02014b50);
  const met=buf.readUInt16LE(p+10),crc=buf.readUInt32LE(p+16),cs=buf.readUInt32LE(p+20),us=buf.readUInt32LE(p+24),
   nl=buf.readUInt16LE(p+28),xl=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),off=buf.readUInt32LE(p+42),name=buf.toString('utf8',p+46,p+46+nl);
  const ld=off+30+buf.readUInt16LE(off+26)+buf.readUInt16LE(off+28),raw=buf.subarray(ld,ld+cs);
  const data=met===0?raw:met===8?zlib.inflateRawSync(raw):null;assert.ok(data,'método no soportado '+met+' en '+name);
  assert.strictEqual(data.length,us,'tamaño '+name);
  if(!name.endsWith('/'))assert.strictEqual(crc32(data),crc,'CRC '+name);
  m[name]=data;p+=46+nl+xl+cl;
 }
 return m;
}
test('catalogo_default.zip: todos los archivos se descomprimen y su CRC coincide',()=>{const m=leer();assert.ok(Object.keys(m).length>2)});
test('catalogo_default.zip: el manifest es válido y cada blobFile existe con el tamaño declarado',()=>{
 const m=leer(),mf=JSON.parse(m['manifest.json'].toString('utf8'));
 assert.strictEqual(mf.app,'tj_cat_backup');assert.ok(Array.isArray(mf.items)&&mf.items.length>0);
 for(const it of mf.items){assert.ok(m[it.blobFile],'falta '+it.blobFile);assert.strictEqual(String(m[it.blobFile].length),String(it.size),'size '+it.id);assert.strictEqual(it.blobType,'application/pdf')}
});
