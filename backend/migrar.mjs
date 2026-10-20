import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatoria para aplicar migraciones.');
const sql = await readFile(new URL('../base_de_datos/0000_esquema_postgresql.sql', import.meta.url), 'utf8');
const bd = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const existe = await bd.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='empresas'");
  if (!existe.rowCount) await bd.query(sql);
  console.log('Esquema db_citas verificado.');
} finally { await bd.end(); }
