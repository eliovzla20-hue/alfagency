/* Datos de Google Analytics 4 y Search Console, leídos con una cuenta de servicio.
   Variables en Vercel:
     GOOGLE_CUENTA  el JSON completo de la cuenta de servicio (Google Cloud → IAM → Cuentas de servicio → Claves)
     GA_PROPIEDAD   el número de la propiedad de GA4 (Administrar → Detalles de la propiedad), solo dígitos
     GSC_SITIO      opcional; por defecto https://www.alfaagencyy.com/ */
import crypto from 'node:crypto';

// eventos que manda /alfa-medicion.js
export const EVENTOS = {
  clic_whatsapp: 'WhatsApp',
  clic_instagram: 'Instagram de Alfa',
  clic_telefono: 'Llamadas',
  clic_correo: 'Correo',
  clic_caso: 'Enlaces de casos',
  servicio_visto: 'Servicios abiertos',
};
export const CONTACTOS = ['clic_whatsapp', 'clic_telefono', 'clic_correo'];

// parámetros de los eventos que GA4 tiene que conocer para poder reportarlos
export const DIMENSIONES = [
  { parametro: 'boton', nombre: 'Botón', descripcion: 'Texto del botón o enlace tocado' },
  { parametro: 'zona', nombre: 'Zona', descripcion: 'Sección de la página donde estaba el botón' },
  { parametro: 'servicio', nombre: 'Servicio', descripcion: 'Servicio que la persona abrió o pidió por WhatsApp' },
  { parametro: 'seccion', nombre: 'Sección vista', descripcion: 'Sección de la web que llegó a verse' },
];

export const conectado = () => !!(process.env.GOOGLE_CUENTA && process.env.GA_PROPIEDAD);
const cuenta = () => JSON.parse(process.env.GOOGLE_CUENTA);
const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');

const fichas = {};
async function ficha(alcance) {
  const f = fichas[alcance];
  if (f && f.vence > Date.now() + 60000) return f.token;
  const c = cuenta(), ahora = Math.floor(Date.now() / 1000);
  const sinFirma = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: c.client_email, scope: alcance, aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 });
  const firma = crypto.createSign('RSA-SHA256').update(sinFirma).sign(c.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: sinFirma + '.' + firma }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('Google no aceptó la cuenta de servicio: ' + (d.error_description || d.error));
  fichas[alcance] = { token: d.access_token, vence: Date.now() + d.expires_in * 1000 };
  return d.access_token;
}

async function llamar(url, cuerpo, alcance, metodo = 'POST') {
  const r = await fetch(url, {
    method: metodo,
    headers: { authorization: 'Bearer ' + await ficha(alcance), 'content-type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d;
}

const LECTURA_GA = 'https://www.googleapis.com/auth/analytics.readonly';
const ga = (metodo, cuerpo) => llamar(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA_PROPIEDAD}:${metodo}`, cuerpo, LECTURA_GA);

// convierte la respuesta de GA4 en filas { dimension: valor, metrica: número }
function filas(d) {
  const dims = (d.dimensionHeaders || []).map((h) => h.name.replace('customEvent:', ''));
  const mets = (d.metricHeaders || []).map((h) => h.name);
  return (d.rows || []).map((r) => {
    const o = {};
    dims.forEach((n, i) => { o[n] = r.dimensionValues[i].value; });
    mets.forEach((n, i) => { o[n] = +r.metricValues[i].value; });
    return o;
  });
}

// cada informe va por separado: si uno falla (p. ej. falta una dimensión), los demás siguen
async function informe(nombre, fn, errores) {
  try { return await fn(); } catch (e) { errores.push(nombre + ': ' + e.message); return null; }
}
const enLista = (campo, valores) => ({ filter: { fieldName: campo, inListFilter: { values: valores } } });
const igual = (campo, valor) => ({ filter: { fieldName: campo, stringFilter: { value: valor } } });
const met = (...n) => n.map((name) => ({ name }));
const dim = (...n) => n.map((name) => ({ name }));
const porMetrica = (m) => [{ metric: { metricName: m }, desc: true }];
const sinNada = (v) => v && v !== '(not set)' && v !== '(none)' && v !== '(direct)' && v !== '(organic)' && v !== '(referral)';

export async function leerAnalytics(dias = 28) {
  const errores = [];
  const d = Math.max(1, Math.min(365, +dias || 28));
  const actual = { startDate: (d - 1) + 'daysAgo', endDate: 'today', name: 'actual' };
  const anterior = { startDate: (2 * d - 1) + 'daysAgo', endDate: d + 'daysAgo', name: 'anterior' };
  const rango = [actual, anterior], solo = [{ startDate: actual.startDate, endDate: 'today' }];
  const run = (cuerpo) => ga('runReport', { dateRanges: solo, ...cuerpo }).then(filas);
  const run2 = (cuerpo) => ga('runReport', { dateRanges: rango, ...cuerpo }).then(filas);

  const [totales, porDia, canales, fuentes, campanas, dispositivos, sistemas, paises, regiones, ciudades, recurrencia, edades, generos,
    horario, eventos, servicios, waServicio, waZona, secciones, contactaron, contactosCanal, ahora, ahoraLugar] = await Promise.all([
    informe('Totales', () => run2({ metrics: met('activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagementRate', 'averageSessionDuration', 'engagedSessions') }), errores),
    informe('Por día', () => run({ dimensions: dim('date'), metrics: met('activeUsers', 'sessions', 'newUsers'), orderBys: [{ dimension: { dimensionName: 'date' } }] }), errores),
    informe('Canales', () => run2({ dimensions: dim('sessionDefaultChannelGroup'), metrics: met('sessions', 'activeUsers', 'engagementRate'), orderBys: porMetrica('sessions') }), errores),
    informe('Fuentes', () => run({ dimensions: dim('sessionSource', 'sessionMedium'), metrics: met('sessions', 'activeUsers'), limit: 15, orderBys: porMetrica('sessions') }), errores),
    informe('Campañas', () => run({ dimensions: dim('sessionCampaignName', 'sessionSource', 'sessionMedium'), metrics: met('sessions', 'activeUsers'), limit: 20, orderBys: porMetrica('sessions') }), errores),
    informe('Dispositivos', () => run({ dimensions: dim('deviceCategory'), metrics: met('activeUsers') }), errores),
    informe('Sistemas', () => run({ dimensions: dim('operatingSystem'), metrics: met('activeUsers'), limit: 6, orderBys: porMetrica('activeUsers') }), errores),
    informe('Países', () => run({ dimensions: dim('country'), metrics: met('activeUsers'), limit: 10, orderBys: porMetrica('activeUsers') }), errores),
    informe('Estados', () => run({ dimensions: dim('region'), metrics: met('activeUsers'), dimensionFilter: igual('country', 'Venezuela'), limit: 12, orderBys: porMetrica('activeUsers') }), errores),
    informe('Ciudades', () => run({ dimensions: dim('city', 'country'), metrics: met('activeUsers'), limit: 12, orderBys: porMetrica('activeUsers') }), errores),
    informe('Nuevos y recurrentes', () => run({ dimensions: dim('newVsReturning'), metrics: met('activeUsers') }), errores),
    informe('Edad', () => run({ dimensions: dim('userAgeBracket'), metrics: met('activeUsers') }), errores),
    informe('Género', () => run({ dimensions: dim('userGender'), metrics: met('activeUsers') }), errores),
    informe('Horario', () => run({ dimensions: dim('dayOfWeek', 'hour'), metrics: met('activeUsers'), limit: 200 }), errores),
    informe('Eventos', () => run2({ dimensions: dim('eventName'), metrics: met('eventCount', 'totalUsers'), dimensionFilter: enLista('eventName', Object.keys(EVENTOS)) }), errores),
    informe('Servicios', () => run({ dimensions: dim('customEvent:servicio'), metrics: met('eventCount', 'totalUsers'), dimensionFilter: igual('eventName', 'servicio_visto'), orderBys: porMetrica('eventCount') }), errores),
    informe('WhatsApp por servicio', () => run({ dimensions: dim('customEvent:servicio'), metrics: met('eventCount'), dimensionFilter: igual('eventName', 'clic_whatsapp'), orderBys: porMetrica('eventCount') }), errores),
    informe('WhatsApp por zona', () => run({ dimensions: dim('customEvent:zona'), metrics: met('eventCount'), dimensionFilter: igual('eventName', 'clic_whatsapp'), orderBys: porMetrica('eventCount') }), errores),
    informe('Secciones', () => run({ dimensions: dim('customEvent:seccion'), metrics: met('totalUsers'), dimensionFilter: igual('eventName', 'seccion_vista') }), errores),
    informe('Personas que escribieron', () => run2({ metrics: met('totalUsers'), dimensionFilter: enLista('eventName', CONTACTOS) }), errores),
    informe('Contactos por canal', () => run({ dimensions: dim('sessionDefaultChannelGroup'), metrics: met('eventCount'), dimensionFilter: enLista('eventName', CONTACTOS), orderBys: porMetrica('eventCount') }), errores),
    informe('Tiempo real', () => ga('runRealtimeReport', { metrics: met('activeUsers') }).then(filas), errores),
    informe('Tiempo real por país', () => ga('runRealtimeReport', { dimensions: dim('country', 'deviceCategory'), metrics: met('activeUsers'), limit: 10 }).then(filas), errores),
  ]);

  const deRango = (lista, n) => (lista || []).filter((f) => !f.dateRange || f.dateRange === n);
  const tot = (n) => deRango(totales, n)[0] || null;
  const ev = (n) => Object.fromEntries(deRango(eventos, n).map((f) => [f.eventName, { veces: f.eventCount, personas: f.totalUsers }]));
  const par = (lista, a, b = 'activeUsers') => (lista || []).filter((f) => f[a] && f[a] !== '(not set)' && f[a] !== 'unknown').map((f) => ({ n: f[a], v: f[b] }));
  const canalesAnt = new Map(deRango(canales, 'anterior').map((f) => [f.sessionDefaultChannelGroup, f.sessions]));

  return {
    fecha: new Date().toISOString(), dias: d,
    ahora: ahora ? (ahora[0]?.activeUsers || 0) : null,
    ahoraLugar: (ahoraLugar || []).map((f) => ({ pais: f.country, dispositivo: f.deviceCategory, v: f.activeUsers })),
    totales: { actual: tot('actual'), anterior: tot('anterior') },
    porDia: (porDia || []).map((f) => ({ dia: f.date.replace(/(\d{4})(\d\d)(\d\d)/, '$1-$2-$3'), personas: f.activeUsers, sesiones: f.sessions, nuevas: f.newUsers })),
    canales: deRango(canales, 'actual').map((f) => ({ n: f.sessionDefaultChannelGroup, sesiones: f.sessions, personas: f.activeUsers, interes: f.engagementRate, antes: canalesAnt.get(f.sessionDefaultChannelGroup) || 0 })),
    fuentes: (fuentes || []).map((f) => ({ fuente: f.sessionSource, medio: f.sessionMedium, sesiones: f.sessions, personas: f.activeUsers })),
    campanas: (campanas || []).filter((f) => sinNada(f.sessionCampaignName)).map((f) => ({ n: f.sessionCampaignName, fuente: f.sessionSource, medio: f.sessionMedium, sesiones: f.sessions, personas: f.activeUsers })),
    dispositivos: par(dispositivos, 'deviceCategory'), sistemas: par(sistemas, 'operatingSystem'),
    paises: par(paises, 'country'), regiones: par(regiones, 'region'),
    ciudades: (ciudades || []).filter((f) => f.city !== '(not set)').map((f) => ({ n: f.city, pais: f.country, v: f.activeUsers })),
    recurrencia: par(recurrencia, 'newVsReturning').filter((f) => f.n === 'new' || f.n === 'returning'),
    edades: par(edades, 'userAgeBracket').sort((a, b) => a.n.localeCompare(b.n)), generos: par(generos, 'userGender'),
    horario: (horario || []).map((f) => ({ d: +f.dayOfWeek, h: +f.hour, v: f.activeUsers })),
    eventos: { actual: ev('actual'), anterior: ev('anterior') },
    servicios: (servicios || []).filter((f) => f.servicio && f.servicio !== '(not set)').map((f) => ({ n: f.servicio, veces: f.eventCount, personas: f.totalUsers })),
    waServicio: par(waServicio, 'servicio', 'eventCount'),
    waZona: par(waZona, 'zona', 'eventCount'),
    secciones: par(secciones, 'seccion', 'totalUsers'),
    contactaron: { actual: (deRango(contactaron, 'actual')[0] || {}).totalUsers || 0, anterior: (deRango(contactaron, 'anterior')[0] || {}).totalUsers || 0 },
    contactosCanal: par(contactosCanal, 'sessionDefaultChannelGroup', 'eventCount'),
    problemas: errores,
  };
}

const LECTURA_GSC = 'https://www.googleapis.com/auth/webmasters.readonly';
export async function leerBusquedas(dias = 28) {
  const sitio = process.env.GSC_SITIO || 'https://www.alfaagencyy.com/';
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(sitio)}/searchAnalytics/query`;
  const dia = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  // Search Console llega con 2-3 días de atraso
  const base = { startDate: dia(Math.max(7, +dias || 28) + 2), endDate: dia(2) };
  const errores = [];
  const [porDia, consultas] = await Promise.all([
    informe('Búsquedas por día', () => llamar(url, { ...base, dimensions: ['date'] }, LECTURA_GSC), errores),
    informe('Consultas', () => llamar(url, { ...base, dimensions: ['query'], rowLimit: 25 }, LECTURA_GSC), errores),
  ]);
  const f = (x) => (x?.rows || []).map((r) => ({ clave: r.keys[0], clics: r.clicks, impresiones: r.impressions, ctr: r.ctr, posicion: r.position }));
  const filasDia = f(porDia), suma = (k) => filasDia.reduce((s, x) => s + x[k], 0);
  return {
    desde: base.startDate, hasta: base.endDate,
    totales: filasDia.length ? { clics: suma('clics'), impresiones: suma('impresiones'),
      posicion: filasDia.reduce((s, x) => s + x.posicion * x.impresiones, 0) / Math.max(1, suma('impresiones')) } : null,
    porDia: filasDia, consultas: f(consultas), problemas: errores,
  };
}

/* Crea en GA4 las dimensiones de los eventos (boton, zona, servicio, seccion). Se corre una vez;
   la cuenta de servicio tiene que ser Editor de la propiedad. */
export async function prepararPropiedad() {
  const alcance = 'https://www.googleapis.com/auth/analytics.edit';
  const base = `https://analyticsadmin.googleapis.com/v1beta/properties/${process.env.GA_PROPIEDAD}/customDimensions`;
  const hay = await llamar(base, null, alcance, 'GET');
  const existentes = new Set((hay.customDimensions || []).map((x) => x.parameterName));
  const creadas = [];
  for (const x of DIMENSIONES) {
    if (existentes.has(x.parametro)) continue;
    await llamar(base, { parameterName: x.parametro, displayName: x.nombre, description: x.descripcion, scope: 'EVENT' }, alcance);
    creadas.push(x.parametro);
  }
  return { creadas, yaEstaban: [...existentes] };
}
