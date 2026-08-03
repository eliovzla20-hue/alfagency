/* =============================================================
   Efectos de texto — Alfa Agency
   · decodificado (caracteres que se resuelven)
   · entrada letra por letra con desenfoque y giro
   · contadores numéricos
   Sin librerías. Respeta "reducir movimiento".
   ============================================================= */
(function () {
  "use strict";

  var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GLIFOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&/*+<>[]{}";

  /* ---------- 1. texto que se decodifica ---------- */
  function decodificar(el, dur) {
    var fin = el.getAttribute("data-txt") || el.textContent;
    el.setAttribute("data-txt", fin);
    if (quieto) { el.textContent = fin; return; }

    var largo = fin.length, t0 = performance.now();
    function paso(ahora) {
      var p = Math.min((ahora - t0) / dur, 1);
      // la revelación avanza con desaceleración
      var listos = Math.floor(largo * (1 - Math.pow(1 - p, 2.2)));
      var salida = "";
      for (var i = 0; i < largo; i++) {
        var c = fin.charAt(i);
        if (i < listos || c === " ") salida += c;
        else salida += GLIFOS.charAt((Math.random() * GLIFOS.length) | 0);
      }
      el.textContent = salida;
      if (p < 1) requestAnimationFrame(paso);
      else el.textContent = fin;
    }
    requestAnimationFrame(paso);
  }

  /* ---------- 2. dividir en letras ----------
     Con degradado, el recorte de fondo se rompe al partir el texto:
     por eso cada letra recibe su color ya interpolado. */
  // dos rampas: sobre fondo oscuro va de blanco a azul; sobre fondo claro,
  // de azul profundo a azul luminoso (si no, las primeras letras desaparecen)
  var RAMPA_OSCURA = [
    { t: 0.00, c: [255, 255, 255] },
    { t: 0.42, c: [255, 255, 255] },
    { t: 0.72, c: [159, 212, 251] },
    { t: 1.00, c: [32, 159, 244] }
  ];
  var RAMPA_CLARA = [
    { t: 0.00, c: [0, 32, 99] },
    { t: 0.38, c: [0, 32, 99] },
    { t: 0.72, c: [0, 61, 145] },
    { t: 1.00, c: [32, 159, 244] }
  ];
  function colorEn(t, claro) {
    var PARADAS = claro ? RAMPA_CLARA : RAMPA_OSCURA;
    for (var i = 1; i < PARADAS.length; i++) {
      if (t <= PARADAS[i].t) {
        var a = PARADAS[i - 1], b = PARADAS[i];
        var k = (t - a.t) / ((b.t - a.t) || 1);
        return "rgb(" +
          Math.round(a.c[0] + (b.c[0] - a.c[0]) * k) + "," +
          Math.round(a.c[1] + (b.c[1] - a.c[1]) * k) + "," +
          Math.round(a.c[2] + (b.c[2] - a.c[2]) * k) + ")";
      }
    }
    return "rgb(32,159,244)";
  }

  function porLetras(el, retraso, paso) {
    if (el.getAttribute("data-partido")) return;
    el.setAttribute("data-partido", "1");

    var degradado = el.classList.contains("destello") || el.getAttribute("data-grad") !== null;
    var enClaro = !!el.closest(".clara");
    var texto = el.textContent;
    var total = texto.replace(/\s/g, "").length || 1;
    var frag = document.createDocumentFragment();
    var n = 0;

    // las letras van agrupadas por palabra (.pal): la l\u00EDnea solo puede
    // cortarse en los espacios, nunca a mitad de una palabra
    var pal = null;
    for (var i = 0; i < texto.length; i++) {
      var c = texto.charAt(i);
      if (c === " ") {
        pal = null;
        frag.appendChild(document.createTextNode(" "));
        continue;
      }
      if (!pal) {
        pal = document.createElement("span");
        pal.className = "pal";
        frag.appendChild(pal);
      }
      var s = document.createElement("span");
      s.className = "ltr";
      s.textContent = c;
      s.setAttribute("data-c", c);
      s.style.transitionDelay = (retraso + n * paso) + "ms";
      s.style.setProperty("--i", n);
      if (degradado) s.style.color = colorEn(n / ((total - 1) || 1), enClaro);
      n++;
      pal.appendChild(s);
    }
    el.textContent = "";
    el.appendChild(frag);
    if (degradado) el.classList.add("grad-listo");
  }

  /* ---------- 3. contador ---------- */
  function contar(el, dur) {
    var fin = el.getAttribute("data-num");
    if (fin === null) return;
    var objetivo = parseInt(fin, 10);
    var prefijo = el.getAttribute("data-pre") || "";
    var relleno = el.getAttribute("data-pad") ? objetivo.toString().length : 0;
    if (quieto) { el.textContent = prefijo + fin; return; }

    var t0 = performance.now();
    function paso(ahora) {
      var p = Math.min((ahora - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var v = Math.round(objetivo * e).toString();
      while (v.length < relleno) v = "0" + v;
      el.textContent = prefijo + v;
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  /* ---------- preparar el documento ---------- */
  function preparar(raiz) {
    raiz.querySelectorAll("[data-letras]").forEach(function (el) {
      porLetras(el, (parseInt(el.getAttribute("data-letras"), 10) || 0) * 0.55, 14);
    });
  }
  preparar(document);

  /* ---------- disparar cuando entra en pantalla ---------- */
  function activar(cont) {
    cont.querySelectorAll("[data-decodificar]").forEach(function (el, i) {
      setTimeout(function () { decodificar(el, 520); }, i * 70);
    });
    cont.querySelectorAll("[data-num]").forEach(function (el, i) {
      setTimeout(function () { contar(el, 950); }, 160 + i * 80);
    });
  }
  window.activarTextos = activar;

  if ("IntersectionObserver" in window) {
    var ojo = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) {
        if (!f.isIntersecting) return;
        activar(f.target);
        ojo.unobserve(f.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    document.querySelectorAll(".seccion").forEach(function (s) { ojo.observe(s); });

    /* ---------- destello activo solo en el panel realmente visible ----------
       Sin esto, las ~200 letras de todos los títulos animan para siempre,
       aunque estén fuera de pantalla en el recorrido horizontal.
       IntersectionObserver respeta los transforms, así que también funciona
       dentro de la pista: solo el panel que se ve de verdad recibe .destella. */
    var vigia = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) {
        f.target.classList.toggle("destella", f.isIntersecting);
      });
    }, { threshold: 0.05 });
    document.querySelectorAll(".hero, .seccion").forEach(function (s) { vigia.observe(s); });
  }
})();
