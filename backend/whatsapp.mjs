import crypto from 'node:crypto';

export function normalizarTelefono(valor) {
  const texto = String(valor ?? '').trim();
  if (!/^[+\d\s()-]+$/.test(texto)) throw new Error('Indica un teléfono válido con código de país.');
  let numero = texto.replace(/\D/g, '');
  if (numero.length === 8 && !texto.startsWith('+')) numero = `506${numero}`;
  if (!/^[1-9]\d{7,14}$/.test(numero)) throw new Error('Indica un teléfono válido con código de país.');
  return numero;
}

export function configuracion(env = process.env) {
  const horas = Number(env.WHATSAPP_RECORDATORIO_HORAS ?? 3);
  if (!Number.isFinite(horas) || horas <= 0 || horas > 168) throw new Error('WHATSAPP_RECORDATORIO_HORAS debe estar entre 0 y 168.');
  const activa = env.WHATSAPP_ACTIVO === 'true';
  if (activa) for (const clave of ['WHATSAPP_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_API_VERSION','WHATSAPP_PLANTILLA_CONFIRMACION','WHATSAPP_PLANTILLA_RECORDATORIO','WHATSAPP_APP_SECRET','WHATSAPP_VERIFY_TOKEN']) {
    if (!env[clave]) throw new Error(`Falta configurar ${clave}.`);
  }
  if (activa && (!/^v\d+\.\d+$/.test(env.WHATSAPP_API_VERSION) || !/^\d+$/.test(env.WHATSAPP_PHONE_NUMBER_ID))) throw new Error('Versión de API o identificador de WhatsApp inválido.');
  return { activa, horas, env };
}

export function mensajesPendientes(inicio, horas, ahora = new Date()) {
  const fecha = new Date(inicio), avisos = [{ tipo: 'confirmacion', fecha: ahora }];
  const recordatorio = new Date(fecha.getTime() - horas * 3600000);
  if (recordatorio > ahora) avisos.push({ tipo: 'recordatorio', fecha: recordatorio });
  return avisos;
}

export async function programarWhatsApp(cliente, cita, empresa, config) {
  if (!config.activa) return;
  for (const aviso of mensajesPendientes(cita.fecha_hora_inicio, config.horas)) {
    await cliente.query(`INSERT INTO notificaciones_whatsapp
      (id_notificacion,id_empresa,id_cita,tipo,inicio_cita,programado_en)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id_cita,tipo,inicio_cita) DO NOTHING`,
    [crypto.randomUUID(), empresa, cita.id_cita, aviso.tipo, cita.fecha_hora_inicio, aviso.fecha]);
  }
}

export function cuerpoPlantilla(fila, env) {
  const fecha = new Date(fila.fecha_hora_inicio), zona = fila.zona_horaria;
  const valores = [fila.cliente, fila.empresa, fila.servicio,
    new Intl.DateTimeFormat('es-CR', { timeZone: zona, dateStyle: 'long' }).format(fecha),
    new Intl.DateTimeFormat('es-CR', { timeZone: zona, hour: 'numeric', minute: '2-digit', hour12: true }).format(fecha),
    fila.ubicacion || 'Consulta la ubicación con el local'];
  return { messaging_product: 'whatsapp', to: normalizarTelefono(fila.telefono), type: 'template',
    biz_opaque_callback_data: fila.id_notificacion,
    template: { name: fila.tipo === 'confirmacion' ? env.WHATSAPP_PLANTILLA_CONFIRMACION : env.WHATSAPP_PLANTILLA_RECORDATORIO,
      language: { code: env.WHATSAPP_IDIOMA || 'es' },
      components: [{ type: 'body', parameters: valores.map(text => ({ type: 'text', text })) }] } };
}

export function firmaValida(cuerpo, firma, secreto) {
  if (!secreto || !/^sha256=[a-f0-9]{64}$/.test(firma || '')) return false;
  const esperada = `sha256=${crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada));
}

export async function recibirEstados(bd, datos, env) {
  if (datos.object !== 'whatsapp_business_account') return;
  const rango = { aceptado: 0, enviado: 1, entregado: 2, leido: 3 };
  for (const entrada of datos.entry || []) for (const cambio of entrada.changes || []) {
    const valor = cambio.value;
    if (valor?.metadata?.phone_number_id !== env.WHATSAPP_PHONE_NUMBER_ID) continue;
    for (const aviso of valor.statuses || []) {
      const estado = { sent: 'enviado', delivered: 'entregado', read: 'leido', failed: 'fallido' }[aviso.status];
      if (!estado || !aviso.id) continue;
      await bd.query(`UPDATE notificaciones_whatsapp SET estado=$1,id_meta=$2,error_codigo=$3,actualizado_en=CURRENT_TIMESTAMP
        WHERE (id_meta=$2 OR (id_notificacion=$4 AND id_meta IS NULL AND estado IN ('enviando','incierto')))
        AND estado NOT IN ('cancelado','leido')
        AND (CASE estado WHEN 'entregado' THEN 2 WHEN 'enviado' THEN 1 WHEN 'leido' THEN 3 ELSE 0 END) <= $5`,
      [estado, aviso.id, String(aviso.errors?.[0]?.code || '') || null, aviso.biz_opaque_callback_data || '', estado === 'fallido' ? 0 : rango[estado]]);
    }
  }
}

// Un único procesador por base de datos. Los envíos ambiguos no se reintentan
// automáticamente: Meta puede haber aceptado el mensaje antes de un corte de red.
export async function procesarPendientes(bd, config, solicitar = fetch) {
  if (!config.activa) return;
  const c = await bd.connect();
  let bloqueo = false;
  try {
    bloqueo = (await c.query('SELECT pg_try_advisory_lock(729341) AS ok')).rows[0].ok;
    if (!bloqueo) return;
    await c.query("UPDATE notificaciones_whatsapp SET estado='incierto',actualizado_en=CURRENT_TIMESTAMP WHERE estado='enviando'");
    for (let i = 0; i < 20; i++) {
      await c.query('BEGIN');
      let fila;
      try {
        const resultado = await c.query(`SELECT n.*,c.fecha_hora_inicio,c.estado AS estado_cita,c.whatsapp_autorizado_en,
          cl.nombre AS cliente,cl.telefono,e.nombre AS empresa,e.ubicacion,e.zona_horaria,e.activo,sv.nombre AS servicio
          FROM notificaciones_whatsapp n JOIN citas c ON c.id_cita=n.id_cita AND c.id_empresa=n.id_empresa
          JOIN clientes cl ON cl.id_cliente=c.id_cliente AND cl.id_empresa=c.id_empresa
          JOIN empresas e ON e.id_empresa=c.id_empresa JOIN servicios sv ON sv.id_servicio=c.id_servicio AND sv.id_empresa=c.id_empresa
          WHERE n.estado='pendiente' AND n.programado_en<=CURRENT_TIMESTAMP ORDER BY n.programado_en LIMIT 1 FOR UPDATE OF n,c`);
        fila = resultado.rows[0];
        if (!fila) { await c.query('COMMIT'); break; }
        const vigente = fila.activo && fila.whatsapp_autorizado_en && ['pendiente','confirmada'].includes(fila.estado_cita)
          && new Date(fila.fecha_hora_inicio) > new Date() && +new Date(fila.inicio_cita) === +new Date(fila.fecha_hora_inicio);
        await c.query('UPDATE notificaciones_whatsapp SET estado=$1,intentos=intentos+$2,actualizado_en=CURRENT_TIMESTAMP WHERE id_notificacion=$3', [vigente ? 'enviando' : 'cancelado', vigente ? 1 : 0, fila.id_notificacion]);
        await c.query('COMMIT');
        if (!vigente) continue;
      } catch (error) { await c.query('ROLLBACK'); throw error; }
      let cuerpo;
      try { cuerpo = cuerpoPlantilla(fila, config.env); }
      catch { await c.query("UPDATE notificaciones_whatsapp SET estado='fallido',error_codigo='DATOS_INVALIDOS' WHERE id_notificacion=$1", [fila.id_notificacion]); continue; }
      try {
        const respuesta = await solicitar(`https://graph.facebook.com/${config.env.WHATSAPP_API_VERSION}/${config.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST', headers: { authorization: `Bearer ${config.env.WHATSAPP_TOKEN}`, 'content-type': 'application/json' },
          body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(15000)
        });
        const datos = await respuesta.json();
        const meta = datos.messages?.[0]?.id;
        const estado = respuesta.ok && meta ? 'aceptado' : respuesta.status >= 500 || respuesta.ok ? 'incierto' : 'fallido';
        await c.query(`UPDATE notificaciones_whatsapp SET estado=$1,id_meta=COALESCE(id_meta,$2),error_codigo=$3,actualizado_en=CURRENT_TIMESTAMP
          WHERE id_notificacion=$4 AND estado IN ('enviando','incierto')`, [estado, meta || null, String(datos.error?.code || '') || null, fila.id_notificacion]);
      } catch {
        await c.query("UPDATE notificaciones_whatsapp SET estado='incierto',error_codigo='RESPUESTA_NO_CONFIRMADA',actualizado_en=CURRENT_TIMESTAMP WHERE id_notificacion=$1 AND estado='enviando'", [fila.id_notificacion]);
      }
    }
  } finally {
    if (bloqueo) await c.query('SELECT pg_advisory_unlock(729341)');
    c.release();
  }
}
