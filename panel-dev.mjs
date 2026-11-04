/* Servidor de prueba del panel en la Mac: imita a Vercel (middleware, api/panel y archivos de la web).
   Uso: node panel-dev.mjs → http://localhost:3300/panel/  (PANEL_DEMO=1 muestra datos de EJEMPLO) */
import http from 'node:http';
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

if (existsSync('.env.local')) {
  readFileSync('.env.local', 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const PUERTO = +process.env.PUERTO || 3300;

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PUERTO);
  const trozos = []; for await (const t of req) trozos.push(t);
  const peticion = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(trozos) });

  const enviar = async (r) => {
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
    res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
  };
  try {
    const mw = await import('./middleware.js');
    const vigila = /^\/(panel|api\/panel)(\/|$)/.test(url.pathname);
    // PANEL_SIN_CLAVE=1 solo existe aquí (servidor de la Mac) para revisar pantallas con Chrome headless
    const corte = vigila && !process.env.PANEL_SIN_CLAVE ? await mw.default(peticion) : null;
    if (corte) return enviar(corte);

    if (url.pathname.startsWith('/api/')) {
      const archivo = path.join(process.cwd(), url.pathname.replace(/\/$/, '') + '.js');
      if (!existsSync(archivo) || path.basename(archivo).startsWith('_')) return enviar(new Response('No existe', { status: 404 }));
      const m = await import(archivo + '?t=' + Date.now());
      const fn = m[req.method] || m.default;
      if (!fn) return enviar(new Response('Método no permitido', { status: 405 }));
      return enviar(await fn(peticion));
    }
    let ruta = decodeURIComponent(url.pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    else if (!path.extname(ruta)) ruta += existsSync(path.join(process.cwd(), ruta, 'index.html')) ? '/index.html' : '.html';
    const archivo = path.join(process.cwd(), ruta);
    const cuerpo = await fs.readFile(archivo);
    res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo)] || 'application/octet-stream' }); res.end(cuerpo);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' }); res.end(String(e.stack || e));
  }
}).listen(PUERTO, () => console.log('Panel en http://localhost:' + PUERTO + '/panel/'));
