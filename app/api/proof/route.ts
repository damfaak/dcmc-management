import {auth,origin,permit,db,uid,now,json,fail,APIError} from '@/db/store';
export const runtime='nodejs';
export async function POST(req:Request){try{
 origin(req);const u=await auth(req);permit(u,'deposit.write');
 if(Number(req.headers.get('content-length'))>3500000)throw new APIError('Bukti maksimal 3 MB.');
 const f=(await req.formData()).get('file');
 if(!(f instanceof File)||f.size>3000000||!['image/png','image/jpeg','image/webp'].includes(f.type))throw new APIError('Pilih PNG, JPEG, atau WEBP maksimal 3 MB.');
 const key=uid();const data=await f.arrayBuffer();const head=new Uint8Array(data).slice(0,12);
 const valid=(f.type==='image/png'&&head[0]===137&&head[1]===80&&head[2]===78)||(f.type==='image/jpeg'&&head[0]===255&&head[1]===216)||(f.type==='image/webp'&&String.fromCharCode(...head.slice(0,4))==='RIFF'&&String.fromCharCode(...head.slice(8,12))==='WEBP');
 if(!valid)throw new APIError('Format gambar tidak valid.');
 await db().batch([
 db().prepare('INSERT INTO proofs(key,created_by,created_at) VALUES(?,?,?)').bind(key,u.id,now()),
 db().prepare('INSERT INTO proof_files(key,content_type,data) VALUES(?,?,?)').bind(key,f.type,data)]);
 return json({key});
}catch(e){return fail(e)}}
export async function GET(req:Request){try{
 const u=await auth(req),key=new URL(req.url).searchParams.get('key');
 const p=await db().prepare('SELECT created_by FROM proofs WHERE key=?').bind(key).first<any>();
 if(!p||(u.role_id!=='owner'&&!u.permissions.includes('history.all')&&p.created_by!==u.id))throw new APIError('Bukti tidak ditemukan.',404);
 const f=await db().prepare('SELECT content_type,data FROM proof_files WHERE key=?').bind(key).first<any>();
 if(!f)throw new APIError('Bukti tidak ditemukan.',404);
 return new Response(f.data,{headers:{'Content-Type':f.content_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return fail(e)}}
