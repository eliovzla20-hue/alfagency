/* Configuración: crea en GA4 las dimensiones que usan los eventos de la web. Se corre una vez. */
import { conectado, prepararPropiedad } from './_google.js';

export async function POST() {
  if (!conectado()) return Response.json({ ok: false, error: 'Google todavía no está conectado.' }, { status: 400 });
  try { return Response.json({ ok: true, ...(await prepararPropiedad()) }); }
  catch (e) { return Response.json({ ok: false, error: e.message }, { status: 500 }); }
}
