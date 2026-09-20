import {createClient} from '@libsql/client';
import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(!process.env.TURSO_DATABASE_URL)throw new Error('Set TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN sebelum menjalankan migrasi.');
const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 await client.execute('CREATE TABLE IF NOT EXISTS dcmc_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)');
 const files=(await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
 for(const file of files){
  const sql=await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
  const done=await client.execute({sql:'SELECT checksum FROM dcmc_migrations WHERE name=?',args:[file]});
  if(done.rows.length){if(done.rows[0].checksum!==checksum)throw Error('Migrasi yang sudah diterapkan berubah: '+file);continue;}
  const statements=sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
  await client.batch([...statements,{sql:'INSERT INTO dcmc_migrations(name,checksum,applied_at) VALUES(?,?,?)',args:[file,checksum,new Date().toISOString()]}],'write');
  console.log('Applied '+file);
 }
 console.log('Schema ready. No players, inventory, deposits, or transactions were seeded.');
}finally{client.close();}
