/* Todo lo que muestra el panel, leído en vivo de Google. ?dias=7|28|90|365 */
import { conectado, leerAnalytics, leerBusquedas, EVENTOS } from './_google.js';

const memoria = new Map();   // guarda 5 minutos cada consulta para no gastar cupo de Google
const VIGENCIA = 5 * 60 * 1000;

export async function GET(request) {
  const url = new URL(request.url);
  const dias = [7, 28, 90, 365].includes(+url.searchParams.get('dias')) ? +url.searchParams.get('dias') : 28;
  const fresco = url.searchParams.has('fresco');
  const configuracion = {
    analytics: conectado(),
    busquedas: conectado(),
    demo: !!process.env.PANEL_DEMO && !conectado(),   // solo en la Mac: datos de EJEMPLO
    propiedad: process.env.GA_PROPIEDAD || '',
    sitioBusquedas: process.env.GSC_SITIO || 'https://www.alfaagencyy.com/',
  };
  const responder = (cuerpo) => Response.json({ configuracion, eventos: EVENTOS, ...cuerpo }, { headers: { 'cache-control': 'no-store' } });

  if (configuracion.demo) {
    const { datosDemo } = await import('./_demo.js');
    return responder(datosDemo(dias));
  }
  if (!conectado()) return responder({ analytics: null, busquedas: null });

  const guardado = memoria.get(dias);
  if (!fresco && guardado && guardado.vence > Date.now()) return responder(guardado.datos);

  const [analytics, busquedas] = await Promise.all([
    leerAnalytics(dias).catch((e) => ({ problemas: [e.message] })),
    leerBusquedas(dias).catch((e) => ({ problemas: [e.message] })),
  ]);
  const datos = { analytics, busquedas };
  memoria.set(dias, { datos, vence: Date.now() + VIGENCIA });
  return responder(datos);
}
