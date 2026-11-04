# Panel de la web · Alfa Agency

Panel con clave en **https://www.alfaagencyy.com/panel/**. Lee en vivo Google Analytics 4 y Search Console.
HTML plano + funciones de Vercel. No usa framework ni base de datos.

## Dónde está cada cosa

- `alfa-medicion.js` (raíz de la web): manda visitas y clics a GA4 y al píxel de Meta. Los ID van arriba (`GA`, `PIXEL`).
  Mientras estén vacíos no hace nada.
  Eventos: `clic_whatsapp`, `clic_instagram`, `clic_telefono`, `clic_correo`, `clic_caso`, `servicio_visto` y `seccion_vista`.
  Parámetros: `boton`, `zona`, `servicio` y `seccion`.
  En Meta: WhatsApp, teléfono y correo cuentan como `Contact`, y abrir un servicio como `ViewContent`.
- `panel/`: las pantallas. `api/panel/`: las funciones (los archivos que empiezan con `_` son módulos internos).
- `middleware.js`: la puerta con clave. Solo corre en `/panel` y `/api/panel`.

## Variables en Vercel (proyecto alfagency, Production)

- `PANEL_CLAVE`: la clave del equipo. Si se cambia, se cierran todas las sesiones.
- `GOOGLE_CUENTA`: el JSON completo de la cuenta de servicio de Google Cloud.
- `GA_PROPIEDAD`: el número de la propiedad de GA4 (solo dígitos).
- `GSC_SITIO` (opcional): por defecto `https://www.alfaagencyy.com/`.

Los pasos completos para conectar Google y Meta están en el propio panel, en **Configuración**.

## Probar en la Mac

```
echo "PANEL_CLAVE=prueba-local" > .env.local
node panel-dev.mjs                 # http://localhost:3300/panel/
PANEL_DEMO=1 node panel-dev.mjs    # con datos de EJEMPLO (inventados) para ver el diseño
```
