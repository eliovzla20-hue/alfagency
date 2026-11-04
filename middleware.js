/* Puerta del panel de la web (alfaagencyy.com/panel). Solo corre en /panel y /api/panel:
   el resto de la web no pasa por aquí. Sin sesión válida no sale ni un archivo del panel. */

export const config = { matcher: ['/panel', '/panel/:path*', '/api/panel/:path*'] };

const SAL = 'alfa-panel-web-2026';

async function sha(txt) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const ABIERTO = ['/panel/entrar', '/api/panel/entrar', '/api/panel/salir', 
  '/panel/estilos.css', '/panel/logo-a.png', '/panel/logo-alfa-blanco.png'];

export default async function middleware(request) {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/\/(index\.html)?$/, '') || '/';
  if (ABIERTO.includes(ruta)) return;

  const clave = process.env.PANEL_CLAVE || '';
  if (!clave) {
    return new Response('Falta configurar PANEL_CLAVE en Vercel. Sin eso el panel no abre.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)panel_sesion=([a-f0-9]{64})/);
  if (m && m[1] === await sha('sesion|' + SAL + '|' + clave)) return;

  if (ruta.startsWith('/api/')) {
    return Response.json({ ok: false, error: 'La sesión venció. Vuelve a entrar.' }, { status: 401 });
  }
  return Response.redirect(new URL('/panel/entrar/', url.origin), 302);
}
