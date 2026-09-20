import {database} from './adapter';
export const db=()=>database;
export const runtime=()=>process.env;
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const today=()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10);
export const permissionsList=['inventory.write','deposit.write','history.all'];
export const channels:Record<string,string>={setoran:'DISCORD_SETORAN_WEBHOOK',inventory:'DISCORD_INVENTORY_WEBHOOK',finance:'DISCORD_FINANCE_WEBHOOK',transactions:'DISCORD_TRANSACTION_WEBHOOK',alerts:'DISCORD_ALERTS_WEBHOOK'};
export async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function hashPin(pin:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function eq(a:string,b:string){let v=a.length^b.length;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;}
export class APIError extends Error{constructor(message:string,public status=400){super(message)}}
export function text(v:unknown,label:string,max=500){if(typeof v!=='string'||!v.trim()||v.length>max)throw new APIError(`${label} tidak valid.`);return v.trim();}
export function integer(v:unknown,label:string,zero=false){const n=Number(v);if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1000000000)throw new APIError(`${label} tidak valid.`);return n;}
export function date(v:unknown){const d=text(v,'Tanggal',10);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||new Date(d).toISOString().slice(0,10)!==d)throw new APIError('Tanggal tidak valid.');return d;}
export function option(v:unknown,choices:string[]){if(typeof v!=='string'||!choices.includes(v))throw new APIError('Pilihan tidak valid.');return v;}
export function origin(req:Request){const o=req.headers.get('origin');if(!o||o!==new URL(req.url).origin)throw new APIError('Permintaan lintas situs ditolak.',403);}
export function json(v:unknown,status=200,headers:Record<string,string>={}){return Response.json(v,{status,headers:{'Cache-Control':'no-store',...headers}})}
export function fail(e:unknown){if(e instanceof APIError)return json({error:e.message},e.status);console.error('DCMC request failed',e instanceof Error?e.message:'unknown');return json({error:'Data belum berhasil diproses. Periksa input atau coba kembali.'},503)}
export async function auth(req:Request){const token=req.headers.get('cookie')?.match(/(?:^|;\s*)dcmc_session=([^;]+)/)?.[1];if(!token)throw new APIError('Silakan login kembali.',401);const u=await db().prepare('SELECT u.id,u.name,u.role_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires>? AND u.active=1').bind(await digest(token),Date.now()).first<any>();if(!u)throw new APIError('Sesi berakhir. Silakan login kembali.',401);const p=await db().prepare('SELECT key FROM permissions WHERE role_id=? AND enabled=1').bind(u.role_id).all<any>();return {...u,permissions:p.results.map(x=>x.key)};}
export function permit(u:any,key:string){if(u.role_id!=='owner'&&!u.permissions.includes(key))throw new APIError('Akses tidak diizinkan.',403)}
export function owner(u:any){if(u.role_id!=='owner')throw new APIError('Hanya Owner yang dapat melakukan ini.',403)}
export function auditStmt(u:any,action:string,detail:string){return db().prepare('INSERT INTO audit_logs(id,action,detail,created_by,created_at) VALUES(?,?,?,?,?)').bind(uid(),action,detail,u.id,now())}
export async function seed(){
  if(await db().prepare('SELECT id FROM users LIMIT 1').first())return;
  const ownerPin=process.env.SETUP_OWNER_PIN;
  const memberPin=process.env.SETUP_MEMBER_PIN;
  if(!ownerPin||!/^\d{4}$/.test(ownerPin))throw new APIError('PIN Owner awal belum dikonfigurasi oleh pengelola.',503);
  if(memberPin&&(!/^\d{4}$/.test(memberPin)||memberPin===ownerPin))throw new APIError('Konfigurasi PIN awal tidak valid.',503);
  const ts=now(),salt=uid(),hash=await hashPin(ownerPin,salt);
  const statements=[db().prepare("INSERT OR IGNORE INTO roles(id,name) VALUES('owner','Owner'),('member','Member')"),db().prepare('INSERT OR IGNORE INTO users(id,name,role_id,pin_hash,salt,created_at) VALUES(?,?,?,?,?,?)').bind('initial-owner','Owner Access','owner',hash,salt,ts)];
  if(memberPin){const ms=uid();statements.push(db().prepare('INSERT OR IGNORE INTO users(id,name,role_id,pin_hash,salt,created_at) VALUES(?,?,?,?,?,?)').bind('initial-member','Member Access','member',await hashPin(memberPin,ms),ms,ts));}
  for(const key of permissionsList)statements.push(db().prepare('INSERT OR IGNORE INTO permissions(id,role_id,key,enabled) VALUES(?,?,?,?)').bind('member-'+key,'member',key,key==='history.all'?0:1));
  for(const [channel,key]of Object.entries(channels))statements.push(db().prepare('INSERT OR IGNORE INTO discord_settings(channel,env_key) VALUES(?,?)').bind(channel,key));
  await db().batch(statements);
}
