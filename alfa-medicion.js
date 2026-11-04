/* ── MEDICIÓN · Google Analytics 4 + Píxel de Meta → Panel de la web ──
   Cuenta visitas, de dónde llegan, qué secciones y servicios ven y
   cuántos tocan WhatsApp, Instagram, teléfono o correo.

   Mientras un ID esté vacío, esa parte no hace nada.
     GA4:   analytics.google.com → Administrar → Flujos de datos → ID «G-…»
     Meta:  business.facebook.com → Administrador de eventos → ID del píxel (solo números)
   ────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var GA = 'G-1X8JQ1JE2K';      // p. ej. 'G-XXXXXXXXXX'
  var PIXEL = '';   // p. ej. '123456789012345'

  if (window.__alfaMedicion) return;
  window.__alfaMedicion = true;
  // el panel y las visitas de prueba con ?nomedir no cuentan
  if (/^\/panel/.test(location.pathname)) return;
  try {
    if (/[?&]nomedir\b/.test(location.search)) localStorage.setItem('alfa_nomedir', '1');
    if (/[?&]medir\b/.test(location.search)) localStorage.removeItem('alfa_nomedir');
    if (localStorage.getItem('alfa_nomedir')) return;
  } catch (e) {}

  function cargar(src) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  if (GA) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA);
    cargar('https://www.googletagmanager.com/gtag/js?id=' + GA);
  }

  if (PIXEL) {
    var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    if (!window._fbq) window._fbq = f;
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    cargar('https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL);
    fbq('track', 'PageView');
  }

  // nombre del evento en GA4 → evento estándar de Meta (para optimizar anuncios)
  var META = { clic_whatsapp: 'Contact', clic_telefono: 'Contact', clic_correo: 'Contact', servicio_visto: 'ViewContent' };

  function evento(nombre, datos) {
    datos = datos || {};
    try { if (GA) gtag('event', nombre, datos); } catch (e) {}
    try {
      if (PIXEL) {
        if (META[nombre]) fbq('track', META[nombre], { content_name: datos.servicio || datos.boton || '' });
        else fbq('trackCustom', nombre, datos);
      }
    } catch (e) {}
  }
  window.alfaEvento = evento;

  function texto(el) { return (el.getAttribute('aria-label') || el.textContent || el.title || '').replace(/\s+/g, ' ').trim().slice(0, 90); }
  function zona(el) {
    if (el.closest('#menuPanel')) return 'menu movil';
    if (el.closest('#nav, nav')) return 'menu';
    if (el.closest('footer')) return 'pie';
    var sec = el.closest('section[id], header[id]');
    return sec ? sec.id : 'pagina';
  }
  function servicioActual() {
    var t = document.getElementById('svcTitle');
    return t ? t.textContent.trim() : '';
  }

  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.svc-tab');
    if (tab) { evento('servicio_visto', { servicio: texto(tab) }); return; }

    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '', url = null;
    try { url = new URL(a.href, location.href); } catch (x) {}
    var datos = { boton: texto(a), zona: zona(a) };
    if (a.id === 'svcCta') datos.servicio = servicioActual();

    if (/^tel:/i.test(href)) return evento('clic_telefono', datos);
    if (/^mailto:/i.test(href)) return evento('clic_correo', datos);
    if (!url) return;
    if (/(^|\.)(wa\.me|whatsapp\.com)$/i.test(url.hostname)) return evento('clic_whatsapp', datos);
    if (/instagram\.com$/i.test(url.hostname) && /alfaagencyy/i.test(url.pathname)) return evento('clic_instagram', datos);
    if (url.hostname !== location.hostname) { datos.boton = url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, ''); return evento('clic_caso', datos); }
  }, true);

  // cada sección cuenta una vez por visita, cuando se ve al menos un 40 %
  var NOMBRES = { inicio: 'Inicio', nosotros: 'Nosotros', servicios: 'Servicios', proceso: 'Proceso', casos: 'Casos', contacto: 'Contacto' };
  function observar() {
    if (!('IntersectionObserver' in window)) return;
    var vistas = {};
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var id = en.target.id;
        var r = en.intersectionRect, pantalla = innerWidth * innerHeight;
        var suficiente = en.intersectionRatio >= 0.4 || (r.width * r.height) >= pantalla * 0.4;
        if (en.isIntersecting && suficiente && !vistas[id]) { vistas[id] = 1; evento('seccion_vista', { seccion: NOMBRES[id] || id }); io.unobserve(en.target); }
      });
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    Object.keys(NOMBRES).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observar);
  else observar();
})();
