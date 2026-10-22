import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { normalizarTelefono, configuracion, mensajesPendientes, cuerpoPlantilla, firmaValida, recibirEstados, procesarPendientes } from './whatsapp.mjs';

test('normaliza números de Costa Rica e internacionales y rechaza entradas inválidas', () => {
  assert.equal(normalizarTelefono('8888 8888'), '50688888888');
  assert.equal(normalizarTelefono('+52 (555) 123-4567'), '525551234567');
  for (const valor of ['abc88888888', '123', '+000000000', '+8888888']) assert.throws(() => normalizarTelefono(valor));
});
test('no programa recordatorio ya vencido y permite cambiar la anticipación', () => {
  const ahora = new Date('2026-10-22T15:00:00Z');
  assert.equal(mensajesPendientes('2026-10-22T17:00:00Z', 3, ahora).length, 1);
  const avisos = mensajesPendientes('2026-10-22T20:00:00Z', 3, ahora);
  assert.equal(avisos[1].fecha.toISOString(), '2026-10-22T17:00:00.000Z');
});
test('permanece desactivado por defecto y falla si se activa sin credenciales', () => {
  assert.equal(configuracion({}).activa, false);
  assert.throws(() => configuracion({ WHATSAPP_ACTIVO: 'true' }), /WHATSAPP_TOKEN/);
  assert.throws(() => configuracion({ WHATSAPP_RECORDATORIO_HORAS: 'abc' }));
});
test('plantilla identifica local y usa la zona horaria y referencia de la notificación', () => {
  const cuerpo = cuerpoPlantilla({ cliente: 'Ana', empresa: 'Local Norte', servicio: 'Corte', telefono: '88888888',
    fecha_hora_inicio: '2026-10-23T00:00:00Z', zona_horaria: 'America/Costa_Rica', tipo: 'recordatorio', id_notificacion: 'aviso-1' },
  { WHATSAPP_PLANTILLA_RECORDATORIO: 'recordatorio_cita' });
  assert.equal(cuerpo.template.name, 'recordatorio_cita');
  const parametros = cuerpo.template.components[0].parameters;
  assert.equal(parametros[1].text, 'Local Norte');
  assert.match(parametros[3].text, /22/);
  assert.equal(cuerpo.biz_opaque_callback_data, 'aviso-1');
});
test('firma válida depende de los bytes originales y del secreto', () => {
  const cuerpo = Buffer.from('{"entry":[]}'), secreto = 'prueba';
  const firma = 'sha256=' + crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex');
  assert.equal(firmaValida(cuerpo, firma, secreto), true);
  assert.equal(firmaValida(Buffer.from('{}'), firma, secreto), false);
  assert.equal(firmaValida(cuerpo, firma, ''), false);
});
test('ignora estados de otros números del webhook', async () => {
  let consultas = 0;
  await recibirEstados({ query() { consultas++; } }, { object: 'whatsapp_business_account', entry: [{ changes: [{ value: {
    metadata: { phone_number_id: 'otro' }, statuses: [{ status: 'delivered', id: 'wamid' }] } }] }] }, { WHATSAPP_PHONE_NUMBER_ID: 'central' });
  assert.equal(consultas, 0);
});
test('desactivado nunca conecta ni envía', async () => {
  await procesarPendientes({ connect() { assert.fail('No debe conectar'); } }, { activa: false }, () => assert.fail('No debe enviar'));
});

function baseSimulada(fila) {
  const consultas = []; let leida = false;
  const c = { async query(sql, valores) {
    consultas.push({ sql, valores });
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{ ok: true }] };
    if (sql.includes('SELECT n.*')) { const rows = leida ? [] : [fila]; leida = true; return { rows }; }
    return { rows: [] };
  }, release() {} };
  return { consultas, connect: async () => c };
}
const filaVigente = () => ({ id_notificacion: 'n1', fecha_hora_inicio: new Date('2099-10-22T18:00:00Z'), inicio_cita: new Date('2099-10-22T18:00:00Z'),
  whatsapp_autorizado_en: new Date(), estado_cita: 'confirmada', activo: true, cliente: 'Ana', empresa: 'Local', servicio: 'Corte',
  telefono: '88888888', zona_horaria: 'America/Costa_Rica', tipo: 'confirmacion' });
const configPrueba = { activa: true, env: { WHATSAPP_TOKEN: 'token-prueba', WHATSAPP_API_VERSION: 'v99.0', WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_PLANTILLA_CONFIRMACION: 'confirmacion_cita' } };
test('no envía citas canceladas, vencidas, cambiadas o sin consentimiento', async () => {
  for (const cambio of [{ estado_cita: 'cancelada' }, { fecha_hora_inicio: new Date(0) }, { inicio_cita: new Date(0) }, { whatsapp_autorizado_en: null }]) {
    const bd = baseSimulada({ ...filaVigente(), ...cambio });
    await procesarPendientes(bd, configPrueba, () => assert.fail('No debe enviar'));
    assert.ok(bd.consultas.some(x => x.valores?.[0] === 'cancelado'));
  }
});
test('registra aceptación de Meta sin declararla entrega', async () => {
  const fila = filaVigente(); fila.inicio_cita = fila.fecha_hora_inicio;
  const bd = baseSimulada(fila);
  await procesarPendientes(bd, configPrueba, async (url, opciones) => {
    assert.equal(url, 'https://graph.facebook.com/v99.0/123/messages');
    assert.equal(JSON.parse(opciones.body).to, '50688888888');
    return { ok: true, status: 200, json: async () => ({ messages: [{ id: 'wamid-prueba' }] }) };
  });
  assert.ok(bd.consultas.some(x => x.valores?.[0] === 'aceptado' && x.valores[1] === 'wamid-prueba'));
});
test('una conexión cortada queda incierta y no se reintenta', async () => {
  const fila = filaVigente(); fila.inicio_cita = fila.fecha_hora_inicio;
  const bd = baseSimulada(fila); let envios = 0;
  await procesarPendientes(bd, configPrueba, async () => { envios++; throw new Error('Corte de red'); });
  assert.equal(envios, 1);
  assert.ok(bd.consultas.some(x => x.sql.includes("estado='incierto',error_codigo='RESPUESTA_NO_CONFIRMADA'")));
});
