/* Panel de la web · Alfa Agency
   Lee /api/panel/datos (Google Analytics 4 + Search Console) y pinta cada sección. */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var GRUPOS = [
    { t: 'Datos', vistas: [
      { id: 'resumen', t: 'Resumen', i: 'resumen', sub: 'Cuántas personas visitan la web y cuántas terminan escribiendo' },
      { id: 'origen', t: 'De dónde llegan', i: 'origen', sub: 'Redes, anuncios, Google y enlaces directos' },
      { id: 'publico', t: 'Público', i: 'publico', sub: 'Dónde están, con qué entran y a qué hora' },
      { id: 'interes', t: 'Qué les interesa', i: 'interes', sub: 'Secciones, servicios y botones que tocan' },
      { id: 'google', t: 'Búsquedas en Google', i: 'google', sub: 'Qué buscan las personas antes de llegar a la web' },
    ] },
    { t: 'Herramientas', vistas: [
      { id: 'enlaces', t: 'Enlaces para anuncios', i: 'enlace', sub: 'Crea enlaces que el panel reconoce por campaña' },
    ] },
    { t: 'Cuenta', vistas: [
      { id: 'ajustes', t: 'Configuración', i: 'ajustes', sub: 'Conexión con Google y Meta' },
    ] },
  ];
  var VISTAS = [].concat.apply([], GRUPOS.map(function (g) { return g.vistas; }));
  var SIN_PERIODO = { enlaces: 1, ajustes: 1 };
  var cerrados = [];
  try { cerrados = JSON.parse(localStorage.getItem('alfa-panel-grupos') || '[]'); } catch (e) {}
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
    return Math.floor(seg / 60) + ' min' + (seg % 60 ? ' ' + (seg % 60) + ' s' : '');
  }
  function cambio(a, b) {
    if (a == null || !b) return '<span class="cambio igual">nuevo</span>';
    var d = (a - b) / b;
    if (Math.abs(d) < 0.005) return '<span class="cambio igual">igual</span>';
    var s = d > 0 ? 'sube' : 'baja';
    return '<span class="cambio ' + s + '"><svg class="ic"><use href="#i-' + s + '"/></svg>' + pct(Math.abs(d), 0) + '</span>';
  }
  var ic = function (id) { return '<svg class="ic"><use href="#i-' + id + '"/></svg>'; };
  var saludo = function () { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches'; };

  var CANALES = {
    'Organic Social': 'Redes sociales (orgánico)', 'Paid Social': 'Anuncios en redes', 'Direct': 'Directo',
    'Organic Search': 'Google (orgánico)', 'Paid Search': 'Anuncios en Google', 'Referral': 'Otras webs', 'Email': 'Correo',
    'Organic Video': 'Video (orgánico)', 'Paid Video': 'Anuncios en video', 'Display': 'Anuncios gráficos', 'Unassigned': 'Sin clasificar',
    'Cross-network': 'Campañas mixtas', 'Organic Shopping': 'Compras (orgánico)', 'Paid Other': 'Otros anuncios', 'SMS': 'SMS',
  };
  var canal = function (c) { return CANALES[c] || c; };
  var PAISES = { 'United States': 'Estados Unidos', Spain: 'España', Panama: 'Panamá', Peru: 'Perú', Mexico: 'México', 'Dominican Republic': 'República Dominicana',
    Brazil: 'Brasil', Italy: 'Italia', Canada: 'Canadá', Germany: 'Alemania', France: 'Francia', 'United Kingdom': 'Reino Unido', Netherlands: 'Países Bajos', Ireland: 'Irlanda' };
  var pais = function (p) { return PAISES[p] || p; };
  var REGIONES = { 'Capital District': 'Distrito Capital', 'Federal Dependencies': 'Dependencias Federales' };
  var DISPOSITIVOS = { mobile: 'Teléfono', desktop: 'Computadora', tablet: 'Tableta', smart_tv: 'Televisor' };
  var RECURRENCIA = { new: 'Primera vez', returning: 'Volvieron' };
  var GENEROS = { female: 'Mujeres', male: 'Hombres' };
  var ZONAS = { inicio: 'Portada', servicios: 'Servicios', contacto: 'Contacto', nosotros: 'Nosotros', proceso: 'Proceso', casos: 'Casos', menu: 'Menú', 'menu movil': 'Menú del teléfono', pie: 'Pie de página' };
  var DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var COLORES = ['#209ff4', '#3fc77a', '#9aa6bd', '#f2a93b', '#9b8cff', '#ff8a63'];

  /* ── piezas ── */
  function tarjeta(titulo, cuerpo, nota, clase, accion) {
    return '<section class="tarjeta ' + (clase || '') + '"><div class="tarjeta__cab"><div><h2>' + esc(titulo) + '</h2>' +
      (nota ? '<p class="nota">' + nota + '</p>' : '') + '</div>' + (accion || '') + '</div><div class="cuerpo">' + cuerpo + '</div></section>';
  }
  var irBoton = function (vista, txt) { return '<a class="btn-ic" href="#' + vista + '" title="' + esc(txt || 'Ver más') + '" aria-label="' + esc(txt || 'Ver más') + '">' + ic('puntos') + '</a>'; };
  function kpi(titulo, icono, valor, pie, clase) {
    return '<div class="kpi ' + (clase || '') + '"><div class="kpi__cab">' + ic(icono) + esc(titulo) + '</div><div class="kpi__valor">' + valor + '</div><div class="kpi__pie">' + (pie || '') + '</div></div>';
  }
  function baldosa(titulo, icono, valor, pie, clase) {
    return '<div class="baldosa ' + (clase || '') + '"><div class="baldosa__cab">' + ic(icono) + esc(titulo) + '</div><b>' + valor + '</b>' + (pie || '') + '</div>';
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
  function reparto(lista, nombre, max) {
    if (!lista || !lista.length) return vacio();
    lista = lista.slice(0, max || 6);
    var total = lista.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    return '<div class="reparto-barra">' + lista.map(function (x, i) { return '<i style="flex:' + x.v + ';background:' + COLORES[i % COLORES.length] + ';animation-delay:' + (i * 50) + 'ms"></i>'; }).join('') + '</div>' +
      '<div class="reparto">' + lista.map(function (x, i) {
        return '<div class="reparto__fila"><i class="p" style="background:' + COLORES[i % COLORES.length] + '"></i><span>' + esc(nombre ? nombre(x.n) : x.n) + '</span><b>' + pct(x.v / total) + '</b><small>' + n(x.v) + '</small></div>';
      }).join('') + '</div>';
  }
  function partes(lista, nombre) {
    if (!lista || !lista.length) return vacio();
    var total = lista.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    lista = lista.slice().sort(function (a, b) { return b.v - a.v; });
    return '<div class="partes">' + lista.map(function (x, i) { return '<i style="flex:' + x.v + ';background:' + COLORES[i % COLORES.length] + '"></i>'; }).join('') + '</div>' +
      '<div class="partes-ley">' + lista.map(function (x, i) { return '<span><i style="background:' + COLORES[i % COLORES.length] + '"></i>' + esc(nombre ? nombre(x.n) : x.n) + ' <b>' + pct(x.v / total, 0) + '</b></span>'; }).join('') + '</div>';
  }
  function tabla(cabeza, filas) {
    if (!filas.length) return vacio();
    return '<div class="desliza"><table class="tabla"><thead><tr>' + cabeza.map(function (c) { return '<th class="' + (c[1] || '') + '">' + c[0] + '</th>'; }).join('') +
      '</tr></thead><tbody>' + filas.map(function (f) { return '<tr>' + f.map(function (v, i) { return '<td class="' + (cabeza[i][1] || '') + '">' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  /* curva suave (Catmull-Rom → Bézier) */
  function curva(p) {
    if (p.length < 2) return '';
    var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += 'C' + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + ' ' + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + ',' + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + ' ' + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + ',' + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
    }
    return d;
  }
  function lineaDias(dias) {
    if (!dias || !dias.length) return vacio();
    var W = 800, H = 230, iz = 44, de = 6, ar = 8, ab = 26, w = W - iz - de, h = H - ar - ab;
    var max = Math.max.apply(null, dias.map(function (d) { return d.personas; })) || 1;
    var paso = Math.pow(10, Math.floor(Math.log10(max)));
    if (max / paso <= 2) paso /= 2;
    var tope = Math.ceil(max * 1.1 / paso) * paso || 1;
    var x = function (i) { return iz + (dias.length === 1 ? w / 2 : i / (dias.length - 1) * w); };
    var y = function (v) { return ar + h - v / tope * h; };
    var pts = dias.map(function (d, i) { return [x(i), y(d.personas)]; });
    var s = '';
    for (var v = 0; v <= tope; v += paso) s += '<line class="reja" x1="' + iz + '" x2="' + (W - de) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="eje" x="0" y="' + (y(v) + 4) + '">' + n(v) + '</text>';
    var cada = Math.max(1, Math.ceil(dias.length / 7));
    dias.forEach(function (d, i) {
      if (i % cada === 0 || i === dias.length - 1) {
        var f = new Date(d.dia + 'T12:00:00');
        s += '<text class="eje" x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="middle">' + f.getDate() + ' ' + f.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '') + '</text>';
      }
    });
    var c = curva(pts);
    s += '<path d="' + c + 'L' + x(dias.length - 1) + ' ' + y(0) + 'L' + x(0) + ' ' + y(0) + 'Z" fill="url(#relleno)"/>';
    s += '<path d="' + c + '" fill="none" stroke="url(#trazo)" stroke-width="2.6" stroke-linecap="round" filter="url(#brillo)"/>';
    s += '<line id="guia" x1="0" x2="0" y1="' + ar + '" y2="' + (ar + h) + '" stroke="currentColor" style="color:var(--muted-2)" stroke-dasharray="3 4" opacity="0"/><circle id="marca" r="5" fill="#209ff4" stroke="#fff" stroke-width="2" opacity="0"/>';
    var bw = w / Math.max(1, dias.length - 1);
    dias.forEach(function (d, i) { s += '<rect data-i="' + i + '" x="' + (x(i) - bw / 2) + '" y="' + ar + '" width="' + bw + '" height="' + h + '" fill="transparent"/>'; });
    return '<div class="grafica" id="graf-dias"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Personas por día"><defs>' +
      '<linearGradient id="relleno" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#209ff4" stop-opacity=".32"/><stop offset="1" stop-color="#209ff4" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="trazo" x1="0" x2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#209ff4"/></linearGradient>' +
      '<filter id="brillo" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' + s + '</svg></div>';
  }
  function activarGrafica(dias) {
    var g = $('#graf-dias'); if (!g) return;
    var globo = $('#globo'), guia = $('#guia', g), marca = $('#marca', g);
    var max = Math.max.apply(null, dias.map(function (d) { return d.personas; })) || 1;
    var rect = g.querySelector('rect[data-i]');
    g.addEventListener('mousemove', function (e) {
      var r = e.target.closest('rect[data-i]'); if (!r) return;
      var i = +r.dataset.i, d = dias[i], f = new Date(d.dia + 'T12:00:00');
      var cx = +r.getAttribute('x') + +r.getAttribute('width') / 2;
      var svg = g.querySelector('svg'), ar = 8, h = 230 - 8 - 26;
      var paso = Math.pow(10, Math.floor(Math.log10(max))); if (max / paso <= 2) paso /= 2;
      var tope = Math.ceil(max * 1.1 / paso) * paso || 1;
      guia.setAttribute('x1', cx); guia.setAttribute('x2', cx); guia.setAttribute('opacity', 1);
      marca.setAttribute('cx', cx); marca.setAttribute('cy', ar + h - d.personas / tope * h); marca.setAttribute('opacity', 1);
      globo.innerHTML = '<b>' + f.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }) + '</b><br>' + n(d.personas) + ' personas · ' + n(d.sesiones) + ' visitas';
      globo.style.left = e.clientX + 'px'; globo.style.top = (e.clientY - 14) + 'px'; globo.classList.add('ver');
    });
    g.addEventListener('mouseleave', function () { globo.classList.remove('ver'); guia.setAttribute('opacity', 0); marca.setAttribute('opacity', 0); });
    void rect;
  }

  function calor(horario) {
    if (!horario || !horario.length) return vacio();
    var m = {}, max = 1;
    horario.forEach(function (x) { m[x.d + '-' + x.h] = x.v; if (x.v > max) max = x.v; });
    var s = '';
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      s += '<div class="calor__fila"><span>' + DIAS[d] + '</span>';
      for (var h = 0; h < 24; h++) {
        var v = m[d + '-' + h] || 0;
        s += '<i title="' + DIAS[d] + ' ' + h + ':00 · ' + n(v) + ' personas" style="' + (v ? 'background:rgba(32,159,244,' + (0.12 + v / max * 0.88).toFixed(2) + ')' : '') + '"></i>';
      }
      s += '</div>';
    });
    s += '<div class="calor__horas">' + Array.from({ length: 24 }, function (_, h) { return '<span>' + (h % 3 === 0 ? h : '') + '</span>'; }).join('') + '</div>';
    return '<div class="calor">' + s + '</div>';
  }
  function porDiaSemana(horario) {
    var t = [0, 0, 0, 0, 0, 0, 0];
    (horario || []).forEach(function (x) { t[x.d] += x.v; });
    return [1, 2, 3, 4, 5, 6, 0].map(function (d) { return { d: d, v: t[d] }; });
  }
  function columnas(lista) {
    var max = Math.max.apply(null, lista.map(function (x) { return x.v; })) || 1;
    var mejor = lista.reduce(function (a, b) { return b.v > a.v ? b : a; }, lista[0]);
    return '<div class="columnas">' + lista.map(function (x, i) {
      var alto = Math.max(x.v / max * 100, 4);
      return '<div class="' + (x === mejor ? 'mejor' : '') + '" title="' + DIAS_LARGO[x.d] + ': ' + n(x.v) + ' personas"><span class="col" style="height:' + alto + '%;animation-delay:' + (i * 50) + 'ms"><i style="height:' + (alto * 0.45) + '%"></i></span><small>' + DIAS[x.d] + '</small></div>';
    }).join('') + '</div>';
  }

  /* ── vistas ── */
  var A = function () { return (estado.datos && estado.datos.analytics) || null; };
  var sinGoogle = function () { return tarjeta('Todavía no hay datos', '<p class="nota">El panel lee Google Analytics, que aún no está conectado. Los pasos están en <a href="#ajustes">Configuración</a>.</p>'); };

  /* lo que conviene mirar, sacado de los propios datos */
  function pendientes(a) {
    var lista = [], t = a.totales.actual || {}, p = a.totales.anterior || {};
    var cc = (a.contactosCanal || [])[0];
    if (cc) lista.push({ tono: 'bien', i: 'chat', t: canal(cc.n) + ' trae más mensajes', s: n(cc.v) + ' de ' + n((a.contactosCanal || []).reduce(function (s, x) { return s + x.v; }, 0)) + ' contactos', b: 'Ver', h: 'origen' });
    if (t.activeUsers && p.activeUsers) {
      var d = (t.activeUsers - p.activeUsers) / p.activeUsers;
      lista.push({ tono: d >= 0 ? 'acento' : 'mal', i: d >= 0 ? 'sube' : 'baja', t: (d >= 0 ? 'Visitas arriba ' : 'Visitas abajo ') + pct(Math.abs(d), 0), s: n(t.activeUsers) + ' personas frente a ' + n(p.activeUsers) + ' antes', b: 'Ver', h: 'origen' });
    }
    var sv = (a.servicios || [])[0];
    if (sv) {
      var pidieron = ((a.waServicio || []).filter(function (x) { return x.n === sv.n; })[0] || {}).v || 0;
      lista.push({ tono: 'aviso', i: 'interes', t: sv.n + ': lo abren mucho', s: n(sv.personas) + ' lo abrieron · ' + n(pidieron) + ' escribieron', b: 'Revisar', h: 'interes' });
    }
    var hor = (a.horario || []).reduce(function (m, x) { return x.v > (m ? m.v : -1) ? x : m; }, null);
    if (hor && hor.v) lista.push({ tono: 'info', i: 'reloj', t: 'Más visitas el ' + DIAS_LARGO[hor.d] + ' a las ' + hor.h + ':00', s: 'Buena hora para publicar o pautar', b: 'Plan', h: 'publico', borde: true });
    var b = estado.datos.busquedas, q = b && (b.consultas || []).filter(function (c) { return c.posicion > 8 && c.impresiones > 50; })[0];
    if (q) lista.push({ tono: 'info', i: 'google', t: '«' + q.clave + '»', s: 'Posición ' + q.posicion.toLocaleString('es-VE', { maximumFractionDigits: 1 }) + ' en Google · ' + n(q.impresiones) + ' veces vista', b: 'Ver', h: 'google', borde: true });
    var camp = (a.campanas || []).length;
    if (!camp) lista.push({ tono: 'acento', i: 'enlace', t: 'Ningún anuncio con enlace medido', s: 'Crea uno para ver qué campaña trae clientes', b: 'Crear', h: 'enlaces', borde: true });
    return lista.slice(0, 6);
  }

  function vistaResumen() {
    var a = A(); if (!a || !a.totales) return sinGoogle();
    var t = a.totales.actual || {}, p = a.totales.anterior || {};
    var ev = a.eventos.actual || {}, evp = a.eventos.anterior || {};
    var wa = (ev.clic_whatsapp || {}).veces || 0, waAnt = (evp.clic_whatsapp || {}).veces || 0;
    var tasa = t.activeUsers ? a.contactaron.actual / t.activeUsers : null, tasaAnt = p.activeUsers ? a.contactaron.anterior / p.activeUsers : null;
    var abrieron = (ev.servicio_visto || {}).personas || 0;

    var principal = '<section class="tarjeta"><div class="tarjeta__cab"><div><h2>Personas en la web</h2><p class="nota">Cada persona cuenta una vez, aunque entre varias veces</p></div>' + irBoton('origen', 'Ver de dónde llegan') + '</div>' +
      '<div class="cifra"><b>' + n(t.activeUsers) + '</b>' + cambio(t.activeUsers, p.activeUsers) + '<small>frente a los ' + estado.dias + ' días anteriores</small></div>' +
      lineaDias(a.porDia) +
      '<div class="baldosas">' +
      baldosa('Visitas', 'sesiones', n(t.sessions), cambio(t.sessions, p.sessions)) +
      baldosa('WhatsApp', 'chat', n(wa), cambio(wa, waAnt), 'wa') +
      baldosa('Tasa de contacto', 'meta', pct(tasa), tasaAnt != null ? cambio(tasa, tasaAnt) : '') +
      baldosa('Tiempo por visita', 'reloj', duracion(t.averageSessionDuration), cambio(t.averageSessionDuration, p.averageSessionDuration)) +
      '</div></section>';

    var abajo = '<div class="fila">' +
      tarjeta('Visitas por día de la semana', columnas(porDiaSemana(a.horario)), 'El día en verde es el que más gente trae', '', irBoton('publico', 'Ver horario')) +
      tarjeta('Por dónde llegan', reparto((a.canales || []).map(function (c) { return { n: c.n, v: c.sesiones }; }), canal), 'Visitas por canal', '', irBoton('origen', 'Ver canales')) +
      '</div>';

    var lista = pendientes(a);
    var atencion = '<section class="tarjeta"><div class="tarjeta__cab"><div><h2>Necesita tu atención</h2><p class="nota">' + lista.length + ' cosas</p></div></div>' +
      '<div class="destacado"><small>Escribieron por WhatsApp</small><b>' + n(a.contactaron.actual) + '</b><span>de ' + n(abrieron || t.activeUsers) + ' que ' + (abrieron ? 'abrieron un servicio' : 'entraron') + '</span>' +
      '<div class="progreso"><i style="width:' + Math.min(100, (a.contactaron.actual / Math.max(1, abrieron || t.activeUsers)) * 100).toFixed(1) + '%"></i></div></div>' +
      '<div class="pendientes">' + lista.map(function (x) {
        return '<div class="pendiente"><span class="pendiente__ic tono-' + x.tono + '">' + ic(x.i) + '</span><div><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></div>' +
          '<a class="pill chica ' + (x.borde ? 'borde' : 'acento') + '" href="#' + x.h + '">' + esc(x.b) + '</a></div>';
      }).join('') + '</div></section>';

    var servicios = (a.servicios || []).slice(0, 5);
    var waPorServicio = {}; (a.waServicio || []).forEach(function (x) { waPorServicio[x.n] = x.v; });
    var tServicios = '<section class="tarjeta"><div class="tarjeta__cab"><div><h2>Servicios que más abren</h2></div><a class="pill chica acento" href="#interes">' + ic('mas') + 'Ver todo</a></div>' +
      (servicios.length ? '<div class="lista">' + servicios.map(function (s) {
        var ini = s.n.split(/\s+/).filter(function (w) { return w.length > 2; }).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
        var w = waPorServicio[s.n] || 0;
        return '<div class="lista__fila"><span class="lista__mini">' + esc(ini) + '</span><div><b>' + esc(s.n) + '</b></div><div class="der"><b>' + n(s.personas) + '</b><small>' + (w ? n(w) + ' por WhatsApp' : 'personas') + '</small></div></div>';
      }).join('') + '</div>' : vacio()) + '</section>';

    return '<div class="tablero"><div class="tablero__principal">' + principal + abajo + '</div><div class="tablero__lado">' + atencion + tServicios + '</div></div>';
  }

  function vistaOrigen() {
    var a = A(); if (!a || !a.canales) return sinGoogle();
    var html = '<div class="fila">' + tarjeta('Canales', tabla([['Canal'], ['Visitas', 'n'], ['Personas', 'n'], ['Se quedaron', 'n'], ['Antes', 'n']],
      a.canales.map(function (c) { return [esc(canal(c.n)), n(c.sesiones), n(c.personas), pct(c.interes, 0), n(c.antes) + ' ' + cambio(c.sesiones, c.antes)]; })),
      '«Se quedaron» = visitas de más de 10 segundos o que tocaron algo. «Antes» = mismo número de días justo antes.', 'ancho') +
      tarjeta('Reparto', reparto(a.canales.map(function (c) { return { n: c.n, v: c.sesiones }; }), canal), 'Visitas por canal') + '</div>';
    html += '<div class="fila">' +
      tarjeta('Fuente exacta', tabla([['Fuente / medio'], ['Visitas', 'n'], ['Personas', 'n']],
        (a.fuentes || []).map(function (f) { return [esc(f.fuente) + '<small>' + esc(f.medio) + '</small>', n(f.sesiones), n(f.personas)]; })),
        'Instagram aparece como <code>instagram.com</code> o <code>l.instagram.com</code>.') +
      tarjeta('Campañas', tabla([['Campaña'], ['Visitas', 'n'], ['Personas', 'n']],
        (a.campanas || []).map(function (c) { return [esc(c.n) + '<small>' + esc(c.fuente + ' / ' + c.medio) + '</small>', n(c.sesiones), n(c.personas)]; })),
        'Solo los anuncios con enlace medido. <a href="#enlaces">Crear uno</a>.') + '</div>';
    html += '<div class="fila">' + tarjeta('Quiénes escriben, según por dónde llegaron', barras(a.contactosCanal, { nombre: canal, clase: 'wa', vacio: 'Nadie ha tocado WhatsApp, teléfono o correo en este periodo.' }),
      'WhatsApp, llamadas y correo juntos. Muestra qué canal trae clientes y no solo visitas.') + '</div>';
    return html;
  }

  function vistaPublico() {
    var a = A(); if (!a || !a.paises) return sinGoogle();
    var vivo = (a.ahoraLugar || []).map(function (x) { return { n: pais(x.pais) + ' · ' + (DISPOSITIVOS[x.dispositivo] || x.dispositivo), v: x.v }; });
    var html = '<div class="fila">' +
      tarjeta('Países', reparto(a.paises, pais)) +
      tarjeta('Estados de Venezuela', barras(a.regiones, { nombre: function (r) { return REGIONES[r] || r; } })) +
      tarjeta('Ciudades', barras((a.ciudades || []).map(function (c) { return { n: c.n + (c.pais !== 'Venezuela' ? ' (' + pais(c.pais) + ')' : ''), v: c.v }; }))) + '</div>';
    html += '<div class="fila">' +
      tarjeta('Con qué entran', partes(a.dispositivos, function (d) { return DISPOSITIVOS[d] || d; }) + '<div style="margin-top:18px">' + barras(a.sistemas, { max: 5, clase: 'suave' }) + '</div>') +
      tarjeta('Primera vez o vuelven', partes(a.recurrencia, function (r) { return RECURRENCIA[r] || r; }) + '<div style="margin-top:22px">' + columnas(porDiaSemana(a.horario)) + '</div>', 'Abajo: personas por día de la semana') +
      tarjeta('Edad y género', (a.edades && a.edades.length ? barras(a.edades, { max: 7 }) + '<div style="margin-top:18px">' + partes(a.generos, function (g) { return GENEROS[g] || g; }) + '</div>'
        : vacio('Google solo muestra edad y género con suficientes visitas y con Google Signals activado.'))) + '</div>';
    html += '<div class="fila">' + tarjeta('A qué hora entran', calor(a.horario), 'Hora de Venezuela. Cuanto más intenso, más personas.', 'ancho') +
      tarjeta('En la web ahora', barras(vivo, { vacio: 'No hay nadie en este momento.' }), 'Últimos 30 minutos.') + '</div>';
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
      tarjeta('Hasta dónde bajan', barras(secciones, { total: (a.totales.actual || {}).activeUsers, max: 6 }), 'Personas que llegaron a ver cada sección, sobre el total de visitantes.') +
      tarjeta('Servicios que abren', tabla([['Servicio'], ['Personas', 'n'], ['Veces', 'n']], (a.servicios || []).map(function (s) { return [esc(s.n), n(s.personas), n(s.veces)]; })),
        'Cuando tocan una pestaña de la sección Servicios.') + '</div>';
    html += '<div class="fila">' +
      tarjeta('WhatsApp pedido desde un servicio', barras(a.waServicio, { clase: 'wa', vacio: 'Nadie tocó «Contratar servicio» en este periodo.' }), 'El botón «Contratar servicio» manda el nombre del servicio en el mensaje.') +
      tarjeta('Desde qué parte de la web escriben', barras(a.waZona, { clase: 'wa', nombre: function (z) { return ZONAS[z] || z; } })) + '</div>';
    return html;
  }

  function vistaGoogle() {
    var b = estado.datos && estado.datos.busquedas;
    if (!b || !b.totales) {
      return tarjeta('Búsquedas en Google', '<p class="nota">Search Console todavía no tiene datos de alfaagencyy.com. Tarda unos días después de verificar el sitio y agregar la cuenta del panel como usuario.</p>' +
        (b && b.problemas && b.problemas.length ? '<p class="nota" style="margin-top:8px">' + esc(b.problemas[0]) + '</p>' : ''));
    }
    var t = b.totales;
    var html = '<div class="kpis">' + kpi('Veces que aparecimos', 'google', n(t.impresiones), b.desde ? b.desde + ' → ' + b.hasta : '') +
      kpi('Clics desde Google', 'interes', n(t.clics), pct(t.impresiones ? t.clics / t.impresiones : 0) + ' de las veces') +
      kpi('Posición promedio', 'sube', t.posicion ? t.posicion.toLocaleString('es-VE', { maximumFractionDigits: 1 }) : '—', '1 = primer resultado') + '</div>';
    html += '<div class="fila">' + tarjeta('Qué buscaron', tabla([['Búsqueda'], ['Aparecimos', 'n'], ['Clics', 'n'], ['Posición', 'n']],
      (b.consultas || []).map(function (c) { return [esc(c.clave), n(c.impresiones), n(c.clics), c.posicion.toLocaleString('es-VE', { maximumFractionDigits: 1 })]; })),
      'Google publica los datos con 2 o 3 días de retraso. Una posición mayor que 10 significa que no salimos en la primera página.', 'ancho') + '</div>';
    return html;
  }

  function vistaEnlaces() {
    return '<div class="fila">' + tarjeta('Crear enlace para un anuncio o publicación',
      '<div class="campos">' +
      '<label>Dónde se publica<select id="u-fuente"><option value="ig">Instagram</option><option value="fb">Facebook</option><option value="whatsapp">WhatsApp (estados o difusión)</option><option value="google">Google</option><option value="tiktok">TikTok</option></select></label>' +
      '<label>Tipo<select id="u-medio"><option value="paid">Anuncio pagado</option><option value="social">Publicación normal</option><option value="bio">Enlace de la biografía</option><option value="story">Historia</option><option value="mensaje">Mensaje directo</option></select></label>' +
      '<label>Nombre de la campaña<input id="u-camp" placeholder="web-profesional-nov" autocomplete="off"></label>' +
      '<label>Versión del anuncio (opcional)<input id="u-cont" placeholder="video-1" autocomplete="off"></label>' +
      '</div><div class="resultado"><code id="u-res"></code><button class="pill chica acento" id="u-copiar">' + ic('copiar') + 'Copiar</button></div>',
      'Pega este enlace en el anuncio en lugar del enlace normal de la web. Así el panel sabe cuántas visitas y mensajes trajo cada campaña. Nombres cortos, en minúsculas y con guiones.', 'ancho') + '</div>' +
      '<div class="fila">' + tarjeta('Cómo leerlo después', '<ol class="pasos">' +
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

  function filaEstado(ok, txt, det) { return '<div class="estado"><svg class="ic ' + (ok ? 'bien' : 'falta') + '"><use href="#i-' + (ok ? 'bien' : 'aviso') + '"/></svg><span>' + txt + '</span>' + (det ? '<code>' + det + '</code>' : '') + '</div>'; }
  function vistaAjustes() {
    var c = (estado.datos && estado.datos.configuracion) || {};
    var html = '<div class="fila">' + tarjeta('Estado de la conexión',
      filaEstado(c.analytics, 'El panel lee Google Analytics', c.propiedad ? 'propiedad ' + esc(c.propiedad) : 'faltan GOOGLE_CUENTA y GA_PROPIEDAD') +
      '<div id="estado-web">' + filaEstado(false, 'Revisando la web…') + '</div>' +
      filaEstado(c.busquedas, 'Búsquedas en Google (Search Console)', esc(c.sitioBusquedas || '')) +
      '<div style="margin-top:16px"><button class="pill acento" id="preparar"' + (c.analytics ? '' : ' disabled') + '>' + ic('ajustes') + 'Preparar Analytics</button></div>' +
      '<p class="nota" id="preparar-res" style="margin-top:10px">«Preparar Analytics» le enseña a Google los datos extra que manda la web (servicio, sección, botón). Se toca una sola vez.</p>') +
      tarjeta('Pasos para conectarlo', '<ol class="pasos">' +
      '<li><b>Analytics:</b> en analytics.google.com, con la cuenta de Google de Alfa, crear la propiedad «alfaagencyy.com» (zona horaria de Venezuela, moneda USD) y un flujo web para <code>https://www.alfaagencyy.com</code>. Anotar el ID <code>G-…</code> y el número de la propiedad.</li>' +
      '<li><b>Píxel de Meta:</b> en el Administrador de eventos de Meta Business, crear un conjunto de datos web y anotar el ID del píxel.</li>' +
      '<li><b>Web:</b> poner los dos ID en <code>alfa-medicion.js</code> y publicar.</li>' +
      '<li><b>Google Cloud:</b> crear un proyecto, activar Google Analytics Data API, Analytics Admin API y Search Console API, y crear una cuenta de servicio con clave JSON.</li>' +
      '<li><b>Permisos:</b> agregar el correo de esa cuenta de servicio como <b>Editor</b> en GA4 y como usuario en Search Console.</li>' +
      '<li><b>Vercel:</b> cargar <code>PANEL_CLAVE</code>, <code>GOOGLE_CUENTA</code> y <code>GA_PROPIEDAD</code>, volver a publicar y tocar «Preparar Analytics».</li>' +
      '</ol>') + '</div>';
    html += '<div class="fila">' + tarjeta('Tus propias visitas', '<p class="nota">Para que tus visitas de prueba no ensucien los números, abre una vez <code>alfaagencyy.com/?nomedir</code> en cada teléfono y computadora del equipo. Ese navegador deja de contar. Para volver a contarlo: <code>?medir</code>. El botón de la web arriba a la derecha ya lo hace.</p>') + '</div>';
    return html;
  }
  function activarAjustes() {
    var caja = $('#estado-web');
    if (caja) {
      fetch('/alfa-medicion.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
        var ga = (t.match(/var GA = '([^']*)'/) || [])[1] || '', px = (t.match(/var PIXEL = '([^']*)'/) || [])[1] || '';
        caja.innerHTML = filaEstado(!!ga, 'La web manda datos a Google Analytics', ga || 'falta el ID G-… en alfa-medicion.js') +
          filaEstado(!!px, 'La web manda datos al píxel de Meta', px || 'falta el ID del píxel en alfa-medicion.js');
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

  /* ── exportar ── */
  function exportar() {
    var a = A(); if (!a || !a.porDia) return;
    var filas = [['Fecha', 'Personas', 'Visitas', 'Personas nuevas']].concat(a.porDia.map(function (d) { return [d.dia, d.personas, d.sesiones, d.nuevas]; }));
    var csv = '﻿' + filas.map(function (f) { return f.join(';'); }).join('\n');
    var enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    enlace.download = 'alfa-visitas-' + estado.dias + 'd-' + new Date().toISOString().slice(0, 10) + '.csv';
    enlace.click(); setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
  }

  /* ── marco ── */
  function pintarNav() {
    var a = A(), ahora = a && a.ahora != null ? a.ahora : null;
    var insignias = { resumen: ahora ? '<span class="insignia verde">' + n(ahora) + '</span>' : '', origen: a && a.campanas && a.campanas.length ? '<span class="insignia">' + a.campanas.length + '</span>' : '' };
    $('#nav').innerHTML = GRUPOS.map(function (g, gi) {
      var activo = g.vistas.some(function (v) { return v.id === estado.vista; });
      var abierto = activo || cerrados.indexOf(g.t) === -1;
      return '<div class="grupo' + (abierto ? ' abierto' : '') + '" data-grupo="' + esc(g.t) + '">' +
        '<button type="button" class="grupo__boton" aria-expanded="' + abierto + '" aria-controls="grupo-' + gi + '"><span>' + g.t + '</span><em class="grupo__cuenta">' + g.vistas.length + '</em>' + ic('chev') + '</button>' +
        '<div class="grupo__lista" id="grupo-' + gi + '"><div>' + g.vistas.map(function (v) {
          return '<a href="#' + v.id + '" class="' + (v.id === estado.vista ? 'on' : '') + '" title="' + esc(v.t) + '"' + (abierto ? '' : ' tabindex="-1"') + '>' + ic(v.i) + '<span>' + v.t + '</span>' + (insignias[v.id] || '') + '</a>';
        }).join('') + '</div></div></div>';
    }).join('');
    document.querySelectorAll('#periodo button').forEach(function (b) { b.classList.toggle('on', +b.dataset.dias === estado.dias); });
    var sin = SIN_PERIODO[estado.vista];
    $('#periodo').style.display = sin ? 'none' : '';
    $('#exportar').style.display = sin ? 'none' : '';
    $('#vivo-num').textContent = ahora != null ? n(ahora) + (ahora === 1 ? ' persona' : ' personas') : '—';
  }
  function pintar() {
    var v = VISTAS.filter(function (x) { return x.id === estado.vista; })[0] || VISTAS[0];
    $('#titulo').textContent = v.t;
    $('#miga-vista').textContent = v.t;
    var a = A(), sub = v.sub;
    if (v.id === 'resumen' && a && a.totales && a.totales.actual) {
      var t = a.totales.actual;
      sub = n(t.activeUsers) + ' personas en ' + estado.dias + ' días · ' + n(((a.eventos.actual || {}).clic_whatsapp || {}).veces || 0) + ' mensajes por WhatsApp · ' + pct(t.activeUsers ? a.contactaron.actual / t.activeUsers : 0) + ' escribe';
    }
    $('#subtitulo').textContent = sub;
    document.title = v.t + ' · Panel Alfa Agency';
    pintarNav();

    var c = (estado.datos && estado.datos.configuracion) || {}, aviso = '';
    if (c.demo) aviso += '<div class="aviso demo">' + ic('aviso') + '<div><b>Datos de ejemplo.</b> Son inventados para ver el diseño. Los reales aparecen al conectar Google Analytics.</div></div>';
    if (estado.error) aviso += '<div class="aviso error">' + ic('aviso') + '<div>' + esc(estado.error) + '</div></div>';
    var prob = a && a.problemas && a.problemas.length ? a.problemas : [];
    if (prob.length && v.id !== 'enlaces') aviso += '<div class="aviso info">' + ic('info') + '<div><b>Algunos datos no llegaron.</b> ' + esc(prob.slice(0, 2).join(' · ')) + (prob.length > 2 ? ' (y ' + (prob.length - 2) + ' más)' : '') + '</div></div>';
    $('#aviso').innerHTML = aviso;

    if (estado.cargando && !estado.datos) {
      $('#vista').innerHTML = '<div class="kpis">' + '<div class="kpi esqueleto"></div>'.repeat(4) + '</div><div class="esqueleto" style="height:320px"></div>';
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

  /* buscador: ir a una sección escribiendo su nombre (⌘K) */
  var buscar = $('#buscar');
  $('#secciones').innerHTML = VISTAS.map(function (v) { return '<option value="' + esc(v.t) + '">'; }).join('');
  function irPorNombre() {
    var q = buscar.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!q) return;
    var v = VISTAS.filter(function (x) { return x.t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) !== -1; })[0];
    if (v) { location.hash = v.id; buscar.value = ''; buscar.blur(); }
  }
  buscar.addEventListener('change', irPorNombre);
  buscar.addEventListener('keydown', function (e) { if (e.key === 'Enter') irPorNombre(); if (e.key === 'Escape') buscar.blur(); });
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); buscar.focus(); } });

  /* modo claro / oscuro y menú plegado */
  var raiz = document.documentElement;
  function ponerTema(t, guardar) {
    raiz.classList.toggle('claro', t === 'claro');
    document.querySelectorAll('#tema button').forEach(function (b) { b.classList.toggle('on', b.dataset.tema === t); b.setAttribute('aria-pressed', b.dataset.tema === t); });
    $('#color-tema').setAttribute('content', t === 'claro' ? '#eaf0f8' : '#070b16');
    if (guardar) try { localStorage.setItem('alfa-panel-tema', t); } catch (e) {}
    if (estado.datos) pintar();
  }
  document.querySelectorAll('#tema button').forEach(function (b) { b.onclick = function () { ponerTema(b.dataset.tema, true); }; });
  ponerTema(raiz.classList.contains('claro') ? 'claro' : 'oscuro', false);
  $('#plegar').onclick = function () {
    raiz.classList.toggle('plegado');
    try { localStorage.setItem('alfa-panel-plegado', raiz.classList.contains('plegado') ? '1' : '0'); } catch (e) {}
  };

  $('#nav').addEventListener('click', function (e) {
    var b = e.target.closest('.grupo__boton'); if (!b) return;
    var g = b.parentNode, abierto = !g.classList.contains('abierto');
    g.classList.toggle('abierto', abierto); b.setAttribute('aria-expanded', abierto);
    g.querySelectorAll('a').forEach(function (a) { if (abierto) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
    var nombre = g.dataset.grupo;
    cerrados = cerrados.filter(function (x) { return x !== nombre; });
    if (!abierto) cerrados.push(nombre);
    try { localStorage.setItem('alfa-panel-grupos', JSON.stringify(cerrados)); } catch (x) {}
  });

  /* fecha y hora del dispositivo, al minuto */
  function reloj() {
    var ahora = new Date(), corto = matchMedia('(max-width: 900px)').matches;
    $('#fecha').textContent = ahora.toLocaleDateString('es-VE', corto ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' }).replace('.', '').replace(/,/g, '');
    $('#hora').textContent = ahora.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });
    $('#miga-saludo').textContent = saludo() + ', equipo';
  }
  reloj();
  setTimeout(function () { reloj(); setInterval(reloj, 60000); }, (60 - new Date().getSeconds()) * 1000);
  addEventListener('resize', reloj);

  $('#abrir-menu').onclick = function () { $('#lateral').classList.add('abierto'); $('#velo').classList.add('ver'); };
  $('#velo').onclick = cerrarMenu;
  $('#refrescar').onclick = function () { cargar(true); };
  $('#exportar').onclick = exportar;
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
