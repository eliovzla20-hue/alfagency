/* Entrada al panel: una sola clave para todo el equipo (variable PANEL_CLAVE en Vercel).
   Si se cambia la clave, todas las sesiones abiertas se cierran solas. */

export const config = { runtime: 'edge' };

const SAL = 'alfa-panel-web-2026';

async function sha(txt) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Método no permitido', { status: 405 });

  const clave = process.env.PANEL_CLAVE || '';
  if (!clave) return Response.json({ ok: false, error: 'El panel no tiene clave configurada.' }, { status: 503 });

  let cuerpo = {};
  try { cuerpo = await request.json(); } catch (e) {}
  const dada = String(cuerpo.clave || '');

  // se compara por hash para que el tiempo de respuesta no delate cuánto acertó
  if (await sha(dada) !== await sha(clave)) {
    await new Promise((r) => setTimeout(r, 1500));   // frena el probar clave tras clave
    return Response.json({ ok: false, error: 'Esa clave no es correcta.' }, { status: 401 });
  }

  const sesion = await sha('sesion|' + SAL + '|' + clave);
  const treintaDias = 60 * 60 * 24 * 30;
  const seguro = new URL(request.url).protocol === 'https:' ? ' Secure;' : '';
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'set-cookie': `panel_sesion=${sesion}; Path=/; Max-Age=${treintaDias}; HttpOnly;${seguro} SameSite=Lax`,
    },
  });
}
