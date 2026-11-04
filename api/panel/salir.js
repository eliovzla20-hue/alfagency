export const config = { runtime: 'edge' };

export default function handler(request) {
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL('/panel/entrar/', request.url).toString(),
      'set-cookie': 'panel_sesion=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    },
  });
}
