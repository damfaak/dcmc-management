import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=await mkdtemp(join(tmpdir(),'dcmc-check-'));
const env={...process.env,TURSO_DATABASE_URL:'file:'+join(folder,'test.db'),TURSO_AUTH_TOKEN:'',SETUP_OWNER_PIN:'2846',SETUP_MEMBER_PIN:'7391',NEXT_TELEMETRY_DISABLED:'1'};
for(const key of Object.keys(env))if(key.startsWith('DISCORD_')||key==='VERCEL')delete env[key];
const origin='http://localhost:4389';
await test('Empty DCMC database and all core transactions on Next.js',async()=>{
 const migrate=spawnSync(process.execPath,['scripts/migrate.mjs'],{env,encoding:'utf8',timeout:20000});assert.equal(migrate.status,0,migrate.stderr);
 const twice=spawnSync(process.execPath,['scripts/migrate.mjs'],{env,encoding:'utf8',timeout:20000});assert.equal(twice.status,0,twice.stderr);
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','4389','--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',d=>process.stdout.write(d));server.stderr.on('data',d=>process.stderr.write(d));
 let cookie='';
 async function call(path,body,c=cookie){const r=await fetch(origin+path,{signal:AbortSignal.timeout(5000),method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:c},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();return {status:r.status,headers:r.headers,data:text.startsWith('{')?JSON.parse(text):text};}
 try{
  let ready=false;for(let i=0;i<40;i++){try{if((await fetch(origin,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}assert(ready,'Next.js did not start');
  const login=await call('/api/login',{pin:env.SETUP_OWNER_PIN});assert.equal(login.status,200,JSON.stringify(login.data));cookie=login.headers.get('set-cookie').split(';')[0];
  const initial=(await call('/api/state')).data;assert.equal(initial.summary.balance,0);for(const name of ['players','items','transactions','targets'])assert.equal(initial[name].length,0,name+' must start empty');
  const act=async body=>{const r=await call('/api/action',body);assert.equal(r.status,200,JSON.stringify(r.data));return r.data};
  await act({action:'player',id:'QA-1',name:'Test Player',rank:'Member',status:'Active',join_date:initial.today});
  await act({action:'item',id:'QA-item',name:'Test item',category:'General',unit:'pcs',minimum:5});
  const tx=x=>({action:'transaction',request_id:crypto.randomUUID(),operator:'Test',date:initial.today,...x});
  const dep=tx({type:'Deposit',player_id:'QA-1',amount:1000,category:'Weekly'});const saved=await act(dep);assert.equal((await act(dep)).id,saved.id);assert.equal((await call('/api/state')).data.summary.balance,1000);
  await act(tx({type:'Correction',original_id:saved.id,description:'Test correction'}));assert.equal((await call('/api/state')).data.summary.balance,0);
  assert.equal((await call('/api/action',tx({type:'Correction',original_id:saved.id,description:'Duplicate'}))).status,400);
  await act(tx({type:'Inventory In',item_id:'QA-item',quantity:10,description:'Test stock'}));
  const concurrent=await Promise.all([1,2].map(()=>call('/api/action',tx({type:'Inventory Out',item_id:'QA-item',quantity:10,description:'Concurrency test'}))));assert.equal(concurrent.filter(r=>r.status===200).length,1);assert.equal((await call('/api/state')).data.items[0].stock,0);
  const member=await call('/api/login',{pin:env.SETUP_MEMBER_PIN});const mc=member.headers.get('set-cookie').split(';')[0];assert.equal((await call('/api/action',{action:'player'},mc)).status,403);assert.equal((await call('/api/state',null,mc)).data.settings,null);
  const fd=new FormData();fd.append('file',new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:'image/png'}),'proof.png');const upload=await fetch(origin+'/api/proof',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:fd});assert.equal(upload.status,200);const proof=await upload.json();assert.equal((await call('/api/proof?key='+proof.key)).status,200);assert.equal((await call('/api/proof?key='+proof.key,null,mc)).status,404);
  assert.equal((await call('/api/report?from=2020-01-01&to=2100-01-01')).status,200);assert.equal((await call('/api/state',null,'')).status,401);
  for(let i=0;i<6;i++)var bad=await call('/api/login',{pin:'9999'});assert.equal(bad.status,429);
 }finally{server.kill('SIGTERM');await Promise.race([new Promise(resolve=>{if(server.exitCode!==null)resolve();else server.once('exit',resolve)}),new Promise(resolve=>setTimeout(()=>{server.kill('SIGKILL');resolve()},3000))]);await rm(folder,{recursive:true,force:true})}
});
