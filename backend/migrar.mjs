import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

const configuracionBase = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.BD_HOST ?? 'localhost',
      port: Number(process.env.BD_PUERTO ?? 5432),
      database: process.env.BD_NOMBRE ?? 'db_citas',
      user: process.env.BD_USUARIO ?? 'postgres',
      password: process.env.BD_CONTRASENA,
    };
const bd = new Pool(configuracionBase);
try {
  const existe = await bd.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='empresas'");
  if (!existe.rowCount) {
    const sqlInicial = await readFile(new URL('../base_de_datos/0000_esquema_postgresql.sql', import.meta.url), 'utf8');
    await bd.query(sqlInicial);
  }
  await bd.query(`CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
    nombre TEXT PRIMARY KEY,
    aplicado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  for (const nombre of ['0004_sesion_empresa_activa.sql', '0005_agregar_url_mapa.sql']) {
    const aplicada = await bd.query('SELECT 1 FROM migraciones_aplicadas WHERE nombre=$1', [nombre]);
    if (aplicada.rowCount) continue;
    const sql = await readFile(new URL(`../base_de_datos/${nombre}`, import.meta.url), 'utf8');
    const cliente = await bd.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [nombre]);
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }
  console.log('Esquema db_citas actualizado.');
} finally { await bd.end(); }
