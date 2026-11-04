/* Datos INVENTADOS para ver el diseño del panel en la Mac (PANEL_DEMO=1).
   Nunca se usan en Vercel si Google está conectado, y el panel los marca como «Datos de ejemplo». */
let semilla = 7;
const azar = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
const entre = (a, b) => Math.round(a + azar() * (b - a));

export function datosDemo(dias) {
  semilla = 7 + dias;
  const porDia = [];
  for (let i = dias - 1; i >= 0; i--) {
    const f = new Date(Date.now() - i * 864e5), finde = [0, 6].includes(f.getDay());
    const p = entre(finde ? 14 : 22, finde ? 30 : 48) + (i < 10 ? 12 : 0);
    porDia.push({ dia: f.toISOString().slice(0, 10), personas: p, sesiones: Math.round(p * 1.25), nuevas: Math.round(p * 0.8) });
  }
  const suma = (k) => porDia.reduce((s, x) => s + x[k], 0);
  const P = suma('personas'), S = suma('sesiones');
  const k = (x) => Math.max(1, Math.round(x * P / 1000));
  return {
    analytics: {
      fecha: new Date().toISOString(), dias, ahora: 3,
      ahoraLugar: [{ pais: 'Venezuela', dispositivo: 'mobile', v: 2 }, { pais: 'Colombia', dispositivo: 'desktop', v: 1 }],
      totales: {
        actual: { activeUsers: P, newUsers: suma('nuevas'), sessions: S, screenPageViews: Math.round(S * 1.1), engagementRate: 0.58, averageSessionDuration: 74, engagedSessions: Math.round(S * 0.58) },
        anterior: { activeUsers: Math.round(P * 0.78), newUsers: Math.round(P * 0.62), sessions: Math.round(S * 0.8), screenPageViews: Math.round(S * 0.86), engagementRate: 0.51, averageSessionDuration: 63, engagedSessions: Math.round(S * 0.41) },
      },
      porDia,
      canales: [
        { n: 'Organic Social', sesiones: k(520), personas: k(430), interes: 0.55, antes: k(400) },
        { n: 'Paid Social', sesiones: k(260), personas: k(230), interes: 0.48, antes: k(90) },
        { n: 'Direct', sesiones: k(190), personas: k(150), interes: 0.66, antes: k(210) },
        { n: 'Organic Search', sesiones: k(110), personas: k(95), interes: 0.71, antes: k(80) },
        { n: 'Referral', sesiones: k(40), personas: k(32), interes: 0.6, antes: k(35) },
      ],
      fuentes: [
        { fuente: 'instagram.com', medio: 'referral', sesiones: k(380), personas: k(320) },
        { fuente: 'ig', medio: 'paid', sesiones: k(260), personas: k(230) },
        { fuente: '(direct)', medio: '(none)', sesiones: k(190), personas: k(150) },
        { fuente: 'google', medio: 'organic', sesiones: k(105), personas: k(90) },
        { fuente: 'l.instagram.com', medio: 'referral', sesiones: k(90), personas: k(70) },
        { fuente: 'wa.me', medio: 'referral', sesiones: k(30), personas: k(25) },
      ],
      campanas: [
        { n: 'web-profesional-nov', fuente: 'ig', medio: 'paid', sesiones: k(170), personas: k(150) },
        { n: 'gestion-redes-nov', fuente: 'ig', medio: 'paid', sesiones: k(90), personas: k(80) },
        { n: 'bio-instagram', fuente: 'instagram', medio: 'social', sesiones: k(60), personas: k(52) },
      ],
      dispositivos: [{ n: 'mobile', v: k(780) }, { n: 'desktop', v: k(200) }, { n: 'tablet', v: k(20) }],
      sistemas: [{ n: 'Android', v: k(520) }, { n: 'iOS', v: k(270) }, { n: 'Windows', v: k(140) }, { n: 'Macintosh', v: k(60) }],
      paises: [{ n: 'Venezuela', v: k(860) }, { n: 'Colombia', v: k(45) }, { n: 'United States', v: k(40) }, { n: 'Spain', v: k(25) }, { n: 'Panama', v: k(12) }],
      regiones: [{ n: 'Lara', v: k(480) }, { n: 'Capital District', v: k(140) }, { n: 'Carabobo', v: k(80) }, { n: 'Zulia', v: k(55) }, { n: 'Portuguesa', v: k(40) }, { n: 'Miranda', v: k(35) }],
      ciudades: [{ n: 'Barquisimeto', pais: 'Venezuela', v: k(430) }, { n: 'Caracas', pais: 'Venezuela', v: k(140) }, { n: 'Valencia', pais: 'Venezuela', v: k(75) }, { n: 'Cabudare', pais: 'Venezuela', v: k(48) }, { n: 'Maracaibo', pais: 'Venezuela', v: k(45) }, { n: 'Bogotá', pais: 'Colombia', v: k(20) }],
      recurrencia: [{ n: 'new', v: k(800) }, { n: 'returning', v: k(200) }],
      edades: [{ n: '18-24', v: k(120) }, { n: '25-34', v: k(380) }, { n: '35-44', v: k(290) }, { n: '45-54', v: k(140) }, { n: '55-64', v: k(50) }],
      generos: [{ n: 'female', v: k(540) }, { n: 'male', v: k(460) }],
      horario: Array.from({ length: 7 * 24 }, (_, i) => { const h = i % 24, d = Math.floor(i / 24); const base = h < 7 ? 0.1 : h < 11 ? 0.6 : h < 14 ? 0.9 : h < 18 ? 0.7 : h < 22 ? 1 : 0.4; return { d, h, v: Math.round(base * entre(2, 9) * (d === 0 ? 0.6 : 1) * P / 900) }; }),
      eventos: {
        actual: { clic_whatsapp: { veces: k(62), personas: k(48) }, clic_instagram: { veces: k(40), personas: k(36) }, clic_telefono: { veces: k(6), personas: k(6) }, clic_correo: { veces: k(4), personas: k(4) }, clic_caso: { veces: k(22), personas: k(19) }, servicio_visto: { veces: k(410), personas: k(250) } },
        anterior: { clic_whatsapp: { veces: k(41), personas: k(32) }, clic_instagram: { veces: k(31), personas: k(28) }, clic_telefono: { veces: k(5), personas: k(5) }, clic_correo: { veces: k(3), personas: k(3) }, clic_caso: { veces: k(15), personas: k(13) }, servicio_visto: { veces: k(300), personas: k(190) } },
      },
      servicios: [
        { n: 'Páginas Web', veces: k(95), personas: k(70) }, { n: 'Gestión de Redes Sociales', veces: k(88), personas: k(64) }, { n: 'Publicidad Meta Ads', veces: k(70), personas: k(55) },
        { n: 'Identidad Visual', veces: k(45), personas: k(38) }, { n: 'Software para Negocios', veces: k(38), personas: k(30) }, { n: 'Branding Estratégico', veces: k(30), personas: k(25) },
        { n: 'Diseño Gráfico', veces: k(26), personas: k(22) }, { n: 'Asesoría de Mercadeo', veces: k(18), personas: k(15) },
      ],
      waServicio: [{ n: 'Páginas Web', v: k(14) }, { n: 'Gestión de Redes Sociales', v: k(11) }, { n: 'Publicidad Meta Ads', v: k(7) }, { n: 'Identidad Visual', v: k(3) }],
      waZona: [{ n: 'inicio', v: k(24) }, { n: 'servicios', v: k(35) }, { n: 'contacto', v: k(14) }, { n: 'menu movil', v: k(6) }],
      secciones: [{ n: 'Inicio', v: k(990) }, { n: 'Nosotros', v: k(640) }, { n: 'Servicios', v: k(520) }, { n: 'Proceso', v: k(330) }, { n: 'Casos', v: k(260) }, { n: 'Contacto', v: k(190) }],
      contactaron: { actual: k(52), anterior: k(36) },
      contactosCanal: [{ n: 'Paid Social', v: k(26) }, { n: 'Organic Social', v: k(22) }, { n: 'Direct', v: k(14) }, { n: 'Organic Search', v: k(8) }],
      problemas: [],
    },
    busquedas: {
      desde: '', hasta: '',
      totales: { clics: k(95), impresiones: k(2100), posicion: 14.2 },
      porDia: [],
      consultas: [
        { clave: 'alfa agency', clics: k(48), impresiones: k(120), ctr: 0.4, posicion: 1.3 },
        { clave: 'agencia de marketing barquisimeto', clics: k(14), impresiones: k(520), ctr: 0.027, posicion: 9.8 },
        { clave: 'diseño de paginas web venezuela', clics: k(6), impresiones: k(610), ctr: 0.01, posicion: 21.4 },
        { clave: 'community manager barquisimeto', clics: k(5), impresiones: k(240), ctr: 0.021, posicion: 12.6 },
      ],
      problemas: [],
    },
  };
}
