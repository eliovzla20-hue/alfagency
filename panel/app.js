/* Panel de la web · Alfa Agency
   Lee /api/panel/datos (Google Analytics 4 + Search Console) y pinta cada sección. */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var VISTAS = [
    { id: 'resumen', t: 'Resumen', i: 'resumen', sub: 'Cuántas personas visitan la web y cuántas terminan escribiendo' },
    { id: 'origen', t: 'De dónde llegan', i: 'origen', sub: 'Redes, anuncios, Google y enlaces directos' },
    { id: 'publico', t: 'Público', i: 'publico', sub: 'Dónde están, con qué entran y a qué hora' },
    { id: 'interes', t: 'Qué les interesa', i: 'interes', sub: 'Secciones, servicios y botones que tocan' },
    { id: 'google', t: 'Búsquedas en Google', i: 'google', sub: 'Qué buscan las personas antes de llegar a la web' },
    { id: 'enlaces', t: 'Enlaces para anuncios', i: 'enlace', sub: 'Crea enlaces que el panel reconoce por campaña' },
    { id: 'ajustes', t: 'Configuración', i: 'ajustes', sub: 'Conexión con Google y Meta' },
  ];
  var estado = { dias: 28, vista: 'resumen', datos: null, cargando: false, error: '' };
  try { estado.dias = +localStorage.getItem('alfa-panel-dias') || 28; } catch (e) {}

  /* ── formato ── */
  var NUM = new Intl.NumberFormat('es-VE');
  var n = function (x) { return x == null ? '—' : NUM.format(Math.round(x)); };
  var pct = function (x, dec) { return x == null || isNaN(x) ? '—' : (x * 100).toLocaleString('es-VE', { maximumFractionDigits: dec == null ? 1 : dec }) + ' %'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function duracion(seg) {
    if (seg == null) return '—';
    seg = Math.round(seg);
    if (seg < 60) return seg + ' s';
    return Math.floor(seg / 60) + ' min ' + (seg % 60 ? (seg % 60) + ' s' : '');
  }
  function cambio(a, b) {
    if (a == null || !b) return '<span class="cambio igual">sin datos previos</span>';
    var d = (a - b) / b;
    if (Math.abs(d) < 0.005) return '<span class="cambio igual">igual</span>';
    var s = d > 0 ? 'sube' : 'baja';
    return '<span class="cambio ' + s + '"><svg class="ic"><use href="#i-' + s + '"/></svg>' + pct(Math.abs(d), 0) + '</span>';
  }
  var ic = function (id) { return '<svg class="ic"><use href="#i-' + id + '"/></svg>'; };

  var CANALES = {
    'Organic Social': 'Redes sociales (orgánico)', 'Paid Social': 'Anuncios en redes', 'Direct': 'Directo',
    'Organic Search': 'Google (búsqueda orgánica)', 'Paid Search': 'Anuncios en Google', 'Referral': 'Otras webs', 'Email': 'Correo',
    'Organic Video': 'Video (orgánico)', 'Paid Video': 'Anuncios en video', 'Display': 'Anuncios gráficos', 'Unassigned': 'Sin clasificar',
    'Cross-network': 'Campañas mixtas', 'Organic Shopping': 'Compras (orgánico)', 'Paid Other': 'Otros anuncios', 'SMS': 'SMS',
  };
  var canal = function (c) { return CANALES[c] || c; };
  var PAISES = { 'United States': 'Estados Unidos', Spain: 'España', Panama: 'Panamá', Peru: 'Perú', Mexico: 'México', 'Dominican Republic': 'República Dominicana',
    Brazil: 'Brasil', Italy: 'Italia', Canada: 'Canadá', Germany: 'Alemania', France: 'Francia', 'United Kingdom': 'Reino Unido', Netherlands: 'Países Bajos', Ireland: 'Irlanda' };
  var pais = function (p) { return PAISES[p] || p; };
  var REGIONES = { 'Capital District': 'Distrito Capital', 'Federal Dependencies': 'Dependencias Federales', 'Nueva Esparta': 'Nueva Esparta' };
  var DISPOSITIVOS = { mobile: 'Teléfono', desktop: 'Computadora', tablet: 'Tableta', smart_tv: 'Televisor' };
  var RECURRENCIA = { new: 'Primera vez', returning: 'Volvieron' };
  var GENEROS = { female: 'Mujeres', male: 'Hombres' };
  var ZONAS = { inicio: 'Portada', servicios: 'Servicios', contacto: 'Contacto', nosotros: 'Nosotros', proceso: 'Proceso', casos: 'Casos', menu: 'Menú', 'menu movil': 'Menú del teléfono', pie: 'Pie de página' };
  var DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  /* ── piezas ── */
  function tarjeta(titulo, icono, cuerpo, nota, clase) {
    return '<section class="tarjeta ' + (clase || '') + '"><h2>' + (icono ? ic(icono) : '') + esc(titulo) + '</h2>' +
      (nota ? '<p class="nota">' + nota + '</p>' : '') + '<div class="cuerpo">' + cuerpo + '</div></section>';
  }
  function kpi(titulo, icono, valor, pie, clase) {
    return '<div class="kpi ' + (clase || '') + '"><div class="kpi__cab">' + ic(icono) + esc(titulo) + '</div><div class="kpi__valor">' + valor + '</div><div class="kpi__pie">' + (pie || '') + '</div></div>';
  }
  var vacio = function (txt) { return '<p class="vacio">' + (txt || 'Todavía no hay datos en este periodo.') + '</p>'; };
  function barras(lista, op) {
    op = op || {};
    if (!lista || !lista.length) return vacio(op.vacio);
    var max = Math.max.apply(null, lista.map(function (x) { return x.v; })) || 1;
    var total = op.total || lista.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    return '<div class="barras">' + lista.slice(0, op.max || 10).map(function (x, i) {
      return '<div class="barra-h ' + (op.clase || '') + '"><div class="barra-h__fila"><span title="' + esc(x.n) + '">' + esc(op.nombre ? op.nombre(x.n, x) : x.n) + '</span>' +
        '<span><b>' + n(x.v) + '</b> · ' + pct(x.v / total, 0) + '</span></div>' +
        '<div class="barra-h__pista"><i style="width:' + (x.v / max * 100).toFixed(1) + '%;animation-delay:' + (i * 40) + 'ms"></i></div></div>';
    }).join('') + '</div>';
  }
  var COLORES = ['#002063', '#209ff4', '#003d91', '#8fb8e8', '#c9d5ea'];
  function partes(lista, nombre) {
    if (!lista || !lista.length) return vacio();
    var total = lista.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    lista = lista.slice().sort(function (a, b) { return b.v - a.v; });
    return '<div class="partes">' + lista.map(function (x, i) { return '<i style="width:' + (x.v / total * 100) + '%;background:' + COLORES[i % COLORES.length] + '"></i>'; }).join('') + '</div>' +
      '<div class="partes-ley">' + lista.map(function (x, i) { return '<span><i style="background:' + COLORES[i % COLORES.length] + '"></i>' + esc(nombre ? nombre(x.n) : x.n) + ' <b>' + pct(x.v / total, 0) + '</b></span>'; }).join('') + '</div>';
  }
  function tabla(cabeza, filas) {
    if (!filas.length) return vacio();
    return '<div class="desliza"><table class="tabla"><thead><tr>' + cabeza.map(function (c) { return '<th class="' + (c[1] || '') + '">' + c[0] + '</th>'; }).join('') +
      '</tr></thead><tbody>' + filas.map(function (f) { return '<tr>' + f.map(function (v, i) { return '<td class="' + (cabeza[i][1] || '') + '">' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  /* gráfica de personas y sesiones por día */
  function lineaDias(dias) {
    if (!dias || !dias.length) return vacio();
    var W = 800, H = 230, iz = 34, de = 8, ar = 10, ab = 26, w = W - iz - de, h = H - ar - ab;
    var max = Math.max.apply(null, dias.map(function (d) { return Math.max(d.personas, d.sesiones); })) || 1;
    var paso = Math.pow(10, Math.floor(Math.log10(max))), tope = Math.ceil(max / paso) * paso;
    if (tope / paso <= 2) { paso /= 2; } tope = Math.ceil(max / paso) * paso || 1;
    var x = function (i) { return iz + (dias.length === 1 ? w / 2 : i / (dias.length - 1) * w); };
    var y = function (v) { return ar + h - v / tope * h; };
    var linea = function (k) { return dias.map(function (d, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d[k]).toFixed(1); }).join(''); };
    var s = '';
    for (var v = 0; v <= tope; v += paso) s += '<line class="reja" x1="' + iz + '" x2="' + (W - de) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="eje" x="' + (iz - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + n(v) + '</text>';
    var cada = Math.max(1, Math.ceil(dias.length / 7));
    dias.forEach(function (d, i) {
      if (i % cada === 0 || i === dias.length - 1) {
        var f = new Date(d.dia + 'T12:00:00');
        s += '<text class="eje" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + f.getDate() + ' ' + f.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '') + '</text>';
      }
    });
    s += '<path d="' + linea('personas') + 'L' + x(dias.length - 1) + ' ' + y(0) + 'L' + x(0) + ' ' + y(0) + 'Z" fill="url(#relleno)"/>';
    s += '<path d="' + linea('sesiones') + '" fill="none" stroke="#209ff4" stroke-width="2" stroke-dasharray="4 4" stroke-linejoin="round"/>';
    s += '<path d="' + linea('personas') + '" fill="none" stroke="#002063" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    s += '<line id="guia" x1="0" x2="0" y1="' + ar + '" y2="' + (ar + h) + '" stroke="#8a99b5" stroke-dasharray="3 3" opacity="0"/>';
    var bw = w / Math.max(1, dias.length - 1);
    dias.forEach(function (d, i) { s += '<rect data-i="' + i + '" x="' + (x(i) - bw / 2) + '" y="' + ar + '" width="' + bw + '" height="' + h + '" fill="transparent"/>'; });
    return '<div class="grafica" id="graf-dias"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Personas y sesiones por día"><defs><linearGradient id="relleno" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#003d91" stop-opacity=".18"/><stop offset="1" stop-color="#003d91" stop-opacity="0"/></linearGradient></defs>' + s + '</svg></div>' +
      '<div class="leyenda"><span><i style="background:#002063"></i>Personas</span><span><i style="background:#209ff4"></i>Visitas (sesiones)</span></div>';
  }
  function activarGrafica(dias) {
    var g = $('#graf-dias'); if (!g) return;
    var globo = $('#globo'), guia = $('#guia', g);
    g.addEventListener('mousemove', function (e) {
      var r = e.target.closest('rect[data-i]'); if (!r) return;
      var d = dias[+r.dataset.i], f = new Date(d.dia + 'T12:00:00');
      var cx = +r.getAttribute('x') + +r.getAttribute('width') / 2;
      guia.setAttribute('x1', cx); guia.setAttribute('x2', cx); guia.setAttribute('opacity', 1);
      globo.innerHTML = '<b>' + f.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }) + '</b><br>' + n(d.personas) + ' personas · ' + n(d.sesiones) + ' visitas';
      globo.style.left = e.clientX + 'px'; globo.style.top = (e.clientY - 14) + 'px'; globo.classList.add('ver');
    });
    g.addEventListener('mouseleave', function () { globo.classList.remove('ver'); guia.setAttribute('opacity', 0); });
  }

  function embudo(pasos) {
    var max = pasos[0].v || 1;
    return '<div class="embudo">' + pasos.map(function (p, i) {
      var anterior = i ? pasos[i - 1].v : 0;
      return '<div class="embudo__paso"><div class="embudo__cab"><span>' + esc(p.t) + '</span><span><b>' + n(p.v) + '</b>' +
        (i ? ' · ' + pct(anterior ? p.v / anterior : 0, 0) + ' del paso anterior' : '') + '</span></div>' +
        '<div class="embudo__barra"><i style="width:' + Math.max(p.v / max * 100, 1.5) + '%;animation-delay:' + (i * 80) + 'ms"></i></div></div>';
    }).join('') + '</div>';
  }

  function calor(horario) {
    if (!horario || !horario.length) return vacio();
    var m = {}, max = 1;
    horario.forEach(function (x) { m[x.d + '-' + x.h] = x.v; if (x.v > max) max = x.v; });
    var orden = [1, 2, 3, 4, 5, 6, 0], s = '';
    orden.forEach(function (d) {
      s += '<div class="calor__fila"><span>' + DIAS[d] + '</span>';
      for (var h = 0; h < 24; h++) {
        var v = m[d + '-' + h] || 0;
        s += '<i title="' + DIAS[d] + ' ' + h + ':00 · ' + n(v) + ' personas" style="' + (v ? 'background:rgba(0,61,145,' + (0.12 + v / max * 0.88).toFixed(2) + ')' : '') + '"></i>';
      }
      s += '</div>';
    });
    s += '<div class="calor__horas">' + Array.from({ length: 24 }, function (_, h) { return '<span>' + (h % 3 === 0 ? h : '') + '</span>'; }).join('') + '</div>';
    return '<div class="calor">' + s + '</div>';
  }

  /* ── vistas ── */
  var A = function () { return (estado.datos && estado.datos.analytics) || null; };
  var sinGoogle = function () { return tarjeta('Todavía no hay datos', 'info', '<p class="nota">El panel lee Google Analytics, que aún no está conectado. Los pasos están en <a href="#ajustes">Configuración</a>.</p>'); };

  function vistaResumen() {
    var a = A(); if (!a || !a.totales) return sinGoogle();
    var t = a.totales.actual || {}, p = a.totales.anterior || {};
    var ev = a.eventos.actual || {}, evp = a.eventos.anterior || {};
    var wa = (ev.clic_whatsapp || {}).veces || 0, waAnt = (evp.clic_whatsapp || {}).veces || 0;
    var tasa = t.activeUsers ? a.contactaron.actual / t.activeUsers : null, tasaAnt = p.activeUsers ? a.contactaron.anterior / p.activeUsers : null;
    var sec = {}; (a.secciones || []).forEach(function (x) { sec[x.n] = x.v; });
    var html = '<div class="kpis">' +
      kpi('Personas', 'usuarios', n(t.activeUsers), cambio(t.activeUsers, p.activeUsers) + ' · ' + n(t.newUsers) + ' por primera vez') +
      kpi('Visitas', 'sesiones', n(t.sessions), cambio(t.sessions, p.sessions)) +
      kpi('WhatsApp', 'chat', n(wa), cambio(wa, waAnt) + ' · ' + n(a.contactaron.actual) + ' personas', 'wa') +
      kpi('Tasa de contacto', 'meta', pct(tasa), (tasaAnt != null ? 'antes ' + pct(tasaAnt) + ' · ' : '') + 'visitantes que escriben') +
      kpi('Tiempo por visita', 'reloj', duracion(t.averageSessionDuration), cambio(t.averageSessionDuration, p.averageSessionDuration)) +
      kpi('En la web ahora', 'pulso', (a.ahora != null ? '<span class="punto-vivo"></span> ' + n(a.ahora) : '—'), 'últimos 30 minutos', 'vivo') +
      '</div>';
    html += '<div class="fila">' + tarjeta('Personas por día', 'resumen', lineaDias(a.porDia), null, 'ancho') +
      tarjeta('Del primer vistazo al mensaje', 'meta', embudo([
        { t: 'Entraron a la web', v: t.activeUsers || 0 },
        { t: 'Llegaron a Servicios', v: sec.Servicios || 0 },
        { t: 'Abrieron un servicio', v: (ev.servicio_visto || {}).personas || 0 },
        { t: 'Escribieron', v: a.contactaron.actual || 0 },
      ]), 'Cada paso cuenta personas, no clics.') + '</div>';
    html += '<div class="fila">' +
      tarjeta('Por dónde llegan', 'origen', barras((a.canales || []).map(function (c) { return { n: c.n, v: c.sesiones }; }), { nombre: canal, max: 6 })) +
      tarjeta('Quiénes escriben, según por dónde llegaron', 'chat', barras(a.contactosCanal, { nombre: canal, clase: 'wa', max: 6, vacio: 'Nadie ha tocado WhatsApp, teléfono o correo en este periodo.' })) +
      tarjeta('Servicios que más abren', 'interes', barras((a.servicios || []).map(function (s) { return { n: s.n, v: s.personas }; }), { max: 6, clase: 'celeste' })) +
      '</div>';
    return html;
  }

  function vistaOrigen() {
    var a = A(); if (!a || !a.canales) return sinGoogle();
    var html = '<div class="fila">' + tarjeta('Canales', 'origen', tabla([['Canal'], ['Visitas', 'n'], ['Personas', 'n'], ['Se quedaron', 'n'], ['Antes', 'n']],
      a.canales.map(function (c) { return [esc(canal(c.n)), n(c.sesiones), n(c.personas), pct(c.interes, 0), n(c.antes) + ' ' + cambio(c.sesiones, c.antes)]; })),
      '«Se quedaron» = visitas de más de 10 segundos o que tocaron algo. «Antes» = mismo número de días justo antes.', 'ancho') + '</div>';
    html += '<div class="fila">' +
      tarjeta('Fuente exacta', 'enlace', tabla([['Fuente / medio'], ['Visitas', 'n'], ['Personas', 'n']],
        (a.fuentes || []).map(function (f) { return [esc(f.fuente) + '<small>' + esc(f.medio) + '</small>', n(f.sesiones), n(f.personas)]; })),
        'Instagram aparece como <code>instagram.com</code> o <code>l.instagram.com</code>; los anuncios, con el enlace de la sección «Enlaces para anuncios».') +
      tarjeta('Campañas', 'meta', tabla([['Campaña'], ['Visitas', 'n'], ['Personas', 'n']],
        (a.campanas || []).map(function (c) { return [esc(c.n) + '<small>' + esc(c.fuente + ' / ' + c.medio) + '</small>', n(c.sesiones), n(c.personas)]; })),
        'Solo aparecen los anuncios y publicaciones que usan un enlace con campaña. <a href="#enlaces">Crear uno</a>.') + '</div>';
    html += '<div class="fila">' + tarjeta('Quiénes escriben, según por dónde llegaron', 'chat', barras(a.contactosCanal, { nombre: canal, clase: 'wa', vacio: 'Nadie ha tocado WhatsApp, teléfono o correo en este periodo.' }),
      'WhatsApp, llamadas y correo juntos. Sirve para ver qué canal trae clientes y no solo visitas.') + '</div>';
    return html;
  }

  function vistaPublico() {
    var a = A(); if (!a || !a.paises) return sinGoogle();
    var vivo = (a.ahoraLugar || []).map(function (x) { return { n: pais(x.pais) + ' · ' + (DISPOSITIVOS[x.dispositivo] || x.dispositivo), v: x.v }; });
    var html = '<div class="fila">' +
      tarjeta('Países', 'origen', barras(a.paises, { nombre: pais })) +
      tarjeta('Estados de Venezuela', 'origen', barras(a.regiones, { nombre: function (r) { return REGIONES[r] || r; } })) +
      tarjeta('Ciudades', 'origen', barras((a.ciudades || []).map(function (c) { return { n: c.n + (c.pais !== 'Venezuela' ? ' (' + pais(c.pais) + ')' : ''), v: c.v }; }))) + '</div>';
    html += '<div class="fila">' +
      tarjeta('Con qué entran', 'publico', partes(a.dispositivos, function (d) { return DISPOSITIVOS[d] || d; }) + '<div style="margin-top:18px">' + barras(a.sistemas, { max: 5, clase: 'celeste' }) + '</div>') +
      tarjeta('Primera vez o vuelven', 'usuarios', partes(a.recurrencia, function (r) { return RECURRENCIA[r] || r; })) +
      tarjeta('Edad y género', 'usuarios', (a.edades && a.edades.length ? barras(a.edades, { max: 7 }) + '<div style="margin-top:18px">' + partes(a.generos, function (g) { return GENEROS[g] || g; }) + '</div>'
        : vacio('Google solo muestra edad y género con suficientes visitas y con Google Signals activado.'))) + '</div>';
    html += '<div class="fila">' + tarjeta('A qué hora entran', 'reloj', calor(a.horario), 'Hora de Venezuela. Cuanto más oscuro, más personas. Sirve para elegir a qué hora publicar o pautar.', 'ancho') +
      tarjeta('En la web ahora', 'pulso', barras(vivo, { vacio: 'No hay nadie en este momento.' }), 'Últimos 30 minutos.') + '</div>';
    return html;
  }

  function vistaInteres() {
    var a = A(); if (!a || !a.eventos) return sinGoogle();
    var ev = a.eventos.actual || {}, evp = a.eventos.anterior || {}, E = estado.datos.eventos || {};
    var orden = ['Inicio', 'Nosotros', 'Servicios', 'Proceso', 'Casos', 'Contacto'];
    var secciones = (a.secciones || []).slice().sort(function (x, y) { return orden.indexOf(x.n) - orden.indexOf(y.n); });
    var html = '<div class="kpis">' + Object.keys(E).map(function (k) {
      var x = ev[k] || {}, y = evp[k] || {};
      return kpi(E[k], k === 'clic_whatsapp' ? 'chat' : k === 'servicio_visto' ? 'interes' : 'enlace', n(x.veces || 0), cambio(x.veces || 0, y.veces || 0) + ' · ' + n(x.personas || 0) + ' personas', k === 'clic_whatsapp' ? 'wa' : '');
    }).join('') + '</div>';
    html += '<div class="fila">' +
      tarjeta('Hasta dónde bajan', 'resumen', barras(secciones, { total: (a.totales.actual || {}).activeUsers, max: 6 }), 'Personas que llegaron a ver cada sección. El porcentaje es sobre el total de visitantes.') +
      tarjeta('Servicios que abren', 'interes', tabla([['Servicio'], ['Personas', 'n'], ['Veces', 'n']], (a.servicios || []).map(function (s) { return [esc(s.n), n(s.personas), n(s.veces)]; })),
        'Cuando tocan una pestaña de la sección Servicios.') + '</div>';
    html += '<div class="fila">' +
      tarjeta('WhatsApp pedido desde un servicio', 'chat', barras(a.waServicio, { clase: 'wa', vacio: 'Nadie tocó «Contratar servicio» en este periodo.' }), 'El botón «Contratar servicio» manda el nombre del servicio en el mensaje.') +
      tarjeta('Desde qué parte de la web escriben', 'chat', barras(a.waZona, { clase: 'wa', nombre: function (z) { return ZONAS[z] || z; } })) + '</div>';
    return html;
  }

  function vistaGoogle() {
    var b = estado.datos && estado.datos.busquedas;
    if (!b || !b.totales) {
      return tarjeta('Búsquedas en Google', 'google', '<p class="nota">Search Console todavía no tiene datos de alfaagencyy.com. Tarda unos días después de verificar el sitio y agregar la cuenta del panel como usuario.</p>' +
        (b && b.problemas && b.problemas.length ? '<p class="nota" style="margin-top:8px">' + esc(b.problemas[0]) + '</p>' : ''));
    }
    var t = b.totales;
    var html = '<div class="kpis">' + kpi('Veces que aparecimos en Google', 'google', n(t.impresiones), b.desde ? b.desde + ' → ' + b.hasta : '') +
      kpi('Clics desde Google', 'interes', n(t.clics), pct(t.impresiones ? t.clics / t.impresiones : 0) + ' de las veces') +
      kpi('Posición promedio', 'sube', t.posicion ? t.posicion.toLocaleString('es-VE', { maximumFractionDigits: 1 }) : '—', '1 = primer resultado') + '</div>';
    html += '<div class="fila">' + tarjeta('Qué buscaron', 'google', tabla([['Búsqueda'], ['Aparecimos', 'n'], ['Clics', 'n'], ['Posición', 'n']],
      (b.consultas || []).map(function (c) { return [esc(c.clave), n(c.impresiones), n(c.clics), c.posicion.toLocaleString('es-VE', { maximumFractionDigits: 1 })]; })),
      'Google publica los datos con 2 o 3 días de retraso. Una posición mayor que 10 significa que no salimos en la primera página.', 'ancho') + '</div>';
    return html;
  }

  function vistaEnlaces() {
    return '<div class="fila">' + tarjeta('Crear enlace para un anuncio o publicación', 'enlace',
      '<div class="campos">' +
      '<label>Dónde se publica<select id="u-fuente"><option value="ig">Instagram</option><option value="fb">Facebook</option><option value="whatsapp">WhatsApp (estados o difusión)</option><option value="google">Google</option><option value="tiktok">TikTok</option></select></label>' +
      '<label>Tipo<select id="u-medio"><option value="paid">Anuncio pagado</option><option value="social">Publicación normal</option><option value="bio">Enlace de la biografía</option><option value="story">Historia</option><option value="mensaje">Mensaje directo</option></select></label>' +
      '<label>Nombre de la campaña<input id="u-camp" placeholder="web-profesional-nov" autocomplete="off"></label>' +
      '<label>Versión del anuncio (opcional)<input id="u-cont" placeholder="video-1" autocomplete="off"></label>' +
      '</div><div class="resultado"><code id="u-res"></code><button class="btn" id="u-copiar">' + ic('copiar') + 'Copiar</button></div>',
      'Pega este enlace en el anuncio en lugar del enlace normal de la web. Así el panel sabe cuántas visitas y cuántos mensajes trajo cada campaña. Usa nombres cortos, en minúsculas y con guiones.', 'ancho') + '</div>' +
      '<div class="fila">' + tarjeta('Cómo leerlo después', 'info', '<ol class="pasos">' +
      '<li>En <a href="#origen">De dónde llegan → Campañas</a> sale cada campaña con sus visitas.</li>' +
      '<li>Si el anuncio manda directo a WhatsApp (sin pasar por la web), esos mensajes no los ve el panel: se miden en el Administrador de anuncios de Meta.</li>' +
      '<li>Con el píxel de Meta instalado, los clics en WhatsApp de la web también cuentan como «Contacto» en el Administrador de anuncios.</li></ol>') + '</div>';
  }
  function activarEnlaces() {
    var f = $('#u-fuente'), m = $('#u-medio'), c = $('#u-camp'), v = $('#u-cont'), r = $('#u-res');
    if (!f) return;
    var limpio = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    var armar = function () {
      var p = new URLSearchParams({ utm_source: f.value, utm_medium: m.value, utm_campaign: limpio(c.value) || 'sin-nombre' });
      if (v.value.trim()) p.set('utm_content', limpio(v.value));
      r.textContent = 'https://www.alfaagencyy.com/?' + p.toString();
    };
    [f, m, c, v].forEach(function (el) { el.addEventListener('input', armar); });
    armar();
    $('#u-copiar').onclick = function () {
      var b = this;
      navigator.clipboard.writeText(r.textContent).then(function () { b.innerHTML = ic('bien') + 'Copiado'; setTimeout(function () { b.innerHTML = ic('copiar') + 'Copiar'; }, 1600); });
    };
  }

  function vistaAjustes() {
    var c = (estado.datos && estado.datos.configuracion) || {};
    var fila = function (ok, txt, det) { return '<div class="estado">' + '<svg class="ic ' + (ok ? 'bien' : 'falta') + '"><use href="#i-' + (ok ? 'bien' : 'aviso') + '"/></svg><span>' + txt + '</span>' + (det ? '<code>' + det + '</code>' : '') + '</div>'; };
    var html = '<div class="fila">' + tarjeta('Estado de la conexión', 'ajustes',
      fila(c.analytics, 'El panel lee Google Analytics', c.propiedad ? 'propiedad ' + esc(c.propiedad) : 'faltan GOOGLE_CUENTA y GA_PROPIEDAD') +
      '<div id="estado-web">' + fila(false, 'Revisando la web…') + '</div>' +
      fila(c.busquedas, 'Búsquedas en Google (Search Console)', esc(c.sitioBusquedas || '')) +
      '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn primario" id="preparar"' + (c.analytics ? '' : ' disabled') + '>' + ic('ajustes') + 'Preparar Analytics</button></div>' +
      '<p class="nota" id="preparar-res" style="margin-top:8px">«Preparar Analytics» le enseña a Google los datos extra que manda la web (servicio, sección, botón). Se toca una sola vez.</p>') +
      tarjeta('Pasos para conectarlo', 'info', '<ol class="pasos">' +
      '<li><b>Analytics:</b> en analytics.google.com, con la cuenta de Google de Alfa, crear la propiedad «alfaagencyy.com» (zona horaria de Venezuela, moneda USD) y un flujo web para <code>https://www.alfaagencyy.com</code>. Anotar el ID <code>G-…</code> y el número de la propiedad.</li>' +
      '<li><b>Píxel de Meta:</b> en el Administrador de eventos de Meta Business, crear un conjunto de datos web y anotar el ID del píxel.</li>' +
      '<li><b>Web:</b> poner los dos ID en <code>alfa-medicion.js</code> y publicar.</li>' +
      '<li><b>Google Cloud:</b> crear un proyecto, activar Google Analytics Data API, Analytics Admin API y Search Console API, y crear una cuenta de servicio con clave JSON.</li>' +
      '<li><b>Permisos:</b> agregar el correo de esa cuenta de servicio como <b>Editor</b> en GA4 y como usuario en Search Console.</li>' +
      '<li><b>Vercel:</b> cargar <code>PANEL_CLAVE</code>, <code>GOOGLE_CUENTA</code> y <code>GA_PROPIEDAD</code>, volver a publicar y tocar «Preparar Analytics».</li>' +
      '</ol>') + '</div>';
    html += '<div class="fila">' + tarjeta('Tus propias visitas', 'usuarios', '<p class="nota">Para que tus visitas de prueba no ensucien los números, abre una vez <code>alfaagencyy.com/?nomedir</code> en cada teléfono y computadora del equipo. Ese navegador deja de contar. Para volver a contarlo: <code>?medir</code>. El enlace «Abrir la web» del menú ya lo hace.</p>') + '</div>';
    return html;
  }
  function activarAjustes() {
    var caja = $('#estado-web');
    if (caja) {
      fetch('/alfa-medicion.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
        var ga = (t.match(/var GA = '([^']*)'/) || [])[1] || '', px = (t.match(/var PIXEL = '([^']*)'/) || [])[1] || '';
        var fila = function (ok, txt, det) { return '<div class="estado"><svg class="ic ' + (ok ? 'bien' : 'falta') + '"><use href="#i-' + (ok ? 'bien' : 'aviso') + '"/></svg><span>' + txt + '</span><code>' + det + '</code></div>'; };
        caja.innerHTML = fila(!!ga, 'La web manda datos a Google Analytics', ga || 'falta el ID G-… en alfa-medicion.js') +
          fila(!!px, 'La web manda datos al píxel de Meta', px || 'falta el ID del píxel en alfa-medicion.js');
      }).catch(function () { caja.innerHTML = ''; });
    }
    var b = $('#preparar');
    if (b) b.onclick = function () {
      b.disabled = true;
      fetch('/api/panel/preparar', { method: 'POST' }).then(function (r) { return r.json(); }).then(function (d) {
        $('#preparar-res').textContent = d.ok ? (d.creadas.length ? 'Listo. Se crearon: ' + d.creadas.join(', ') + '. Los datos nuevos aparecen en 24-48 horas.' : 'Ya estaba preparado.') : 'No se pudo: ' + d.error;
        b.disabled = false;
      });
    };
  }

  var PINTAR = { resumen: vistaResumen, origen: vistaOrigen, publico: vistaPublico, interes: vistaInteres, google: vistaGoogle, enlaces: vistaEnlaces, ajustes: vistaAjustes };

  /* ── marco ── */
  function pintarNav() {
    $('#nav').innerHTML = VISTAS.map(function (v) { return '<a href="#' + v.id + '" class="' + (v.id === estado.vista ? 'on' : '') + '">' + ic(v.i) + v.t + '</a>'; }).join('');
    document.querySelectorAll('#periodo button').forEach(function (b) { b.classList.toggle('on', +b.dataset.dias === estado.dias); });
    var sinPeriodo = estado.vista === 'enlaces' || estado.vista === 'ajustes';
    $('#periodo').style.visibility = sinPeriodo ? 'hidden' : '';
  }
  function pintar() {
    var v = VISTAS.filter(function (x) { return x.id === estado.vista; })[0] || VISTAS[0];
    $('#titulo').textContent = v.t;
    var a = A();
    $('#subtitulo').textContent = v.sub + (a && a.fecha && v.id !== 'enlaces' && v.id !== 'ajustes' ? ' · actualizado ' + new Date(a.fecha).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' }) : '');
    document.title = v.t + ' · Panel Alfa Agency';
    pintarNav();

    var c = (estado.datos && estado.datos.configuracion) || {}, aviso = '';
    if (c.demo) aviso += '<div class="aviso demo">' + ic('aviso') + '<div><b>Datos de ejemplo.</b> Son inventados para ver el diseño. Los reales aparecen al conectar Google Analytics.</div></div>';
    if (estado.error) aviso += '<div class="aviso error">' + ic('aviso') + '<div>' + esc(estado.error) + '</div></div>';
    var prob = a && a.problemas && a.problemas.length ? a.problemas : [];
    if (prob.length && v.id !== 'enlaces') aviso += '<div class="aviso info">' + ic('info') + '<div><b>Algunos datos no llegaron.</b> ' + esc(prob.slice(0, 2).join(' · ')) + (prob.length > 2 ? ' (y ' + (prob.length - 2) + ' más)' : '') + '</div></div>';
    $('#aviso').innerHTML = aviso;

    if (estado.cargando && !estado.datos) {
      $('#vista').innerHTML = '<div class="kpis">' + '<div class="kpi esqueleto"></div>'.repeat(4) + '</div><div class="esqueleto" style="height:300px"></div>';
      return;
    }
    $('#vista').innerHTML = PINTAR[v.id]();
    if (v.id === 'resumen' && a) activarGrafica(a.porDia || []);
    if (v.id === 'enlaces') activarEnlaces();
    if (v.id === 'ajustes') activarAjustes();
  }

  function cargar(fresco) {
    estado.cargando = true; estado.error = '';
    var boton = $('#refrescar'); boton.classList.add('gira'); boton.disabled = true;
    pintar();
    fetch('/api/panel/datos?dias=' + estado.dias + (fresco ? '&fresco=1' : ''), { cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401) { location.href = '/panel/entrar/'; throw new Error('La sesión venció.'); }
        if (!r.ok) throw new Error('El panel no pudo leer los datos (' + r.status + ').');
        return r.json();
      })
      .then(function (d) { estado.datos = d; })
      .catch(function (e) { estado.error = e.message; })
      .then(function () { estado.cargando = false; boton.classList.remove('gira'); boton.disabled = false; pintar(); });
  }

  function irA() {
    var h = location.hash.slice(1);
    estado.vista = PINTAR[h] ? h : 'resumen';
    cerrarMenu(); pintar(); window.scrollTo(0, 0);
  }
  function cerrarMenu() { $('#lateral').classList.remove('abierto'); $('#velo').classList.remove('ver'); }

  $('#abrir-menu').onclick = function () { $('#lateral').classList.add('abierto'); $('#velo').classList.add('ver'); };
  $('#velo').onclick = cerrarMenu;
  $('#refrescar').onclick = function () { cargar(true); };
  document.querySelectorAll('#periodo button').forEach(function (b) {
    b.onclick = function () {
      estado.dias = +b.dataset.dias;
      try { localStorage.setItem('alfa-panel-dias', estado.dias); } catch (e) {}
      cargar(false);
    };
  });
  window.addEventListener('hashchange', irA);
  irA();
  cargar(false);
})();
