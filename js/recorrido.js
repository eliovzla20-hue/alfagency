/* =============================================================
   Recorrido horizontal — Alfa Agency
   El scroll vertical desplaza las secciones hacia la derecha.
   La última (Contacto) vuelve al comportamiento normal.
   Bajo 981px no se activa: en móvil todo baja como siempre.

   Cómo se mueve la pista:
   · Si el navegador admite animaciones ligadas al scroll, el
     desplazamiento lo hace el CSS en el compositor y aquí no se
     toca ningún transform. Es lo que evita el tirón al ir rápido.
   · Si no, se recurre al cálculo por JavaScript (una vez por cuadro).

   El indicador y la activación de textos van por IntersectionObserver:
   no cuestan nada durante el scroll.
   ============================================================= */
(function () {
  "use strict";

  var riel = document.getElementById("riel");
  var pista = document.getElementById("pista");
  var brujula = document.getElementById("brujula");
  if (!riel || !pista) return;

  var porCompositor = CSS.supports("animation-timeline: scroll()");
  var activo = false, paneles = [], recorrido = 0;
  var inicioRiel = 0, altoUtil = 1, pendiente = false;

  function esEscritorio() {
    return matchMedia("(min-width: 981px)").matches;
  }

  function medir() {
    paneles = [].slice.call(pista.children).filter(function (el) {
      return el.classList.contains("hero") || el.classList.contains("seccion");
    });

    if (!esEscritorio()) {
      activo = false;
      riel.style.height = "";
      if (!porCompositor) pista.style.transform = "";
      document.documentElement.classList.remove("modo-horizontal");
      return;
    }

    activo = true;
    document.documentElement.classList.add("modo-horizontal");
    // si manda el compositor, no debe quedar ningún transform escrito a mano
    if (porCompositor) pista.style.removeProperty("transform");
    recorrido = Math.max(pista.scrollWidth - innerWidth, 0);
    // el alto del riel define cuánto scroll hace falta para recorrerlo
    riel.style.height = (innerHeight + recorrido) + "px";
    inicioRiel = riel.offsetTop;
    altoUtil = (riel.offsetHeight - innerHeight) || 1;
    if (!porCompositor) { pista.style.transform = ""; pintar(); }
  }

  /* Solo se usa cuando el navegador no admite animaciones por scroll */
  function pintar() {
    if (!activo || porCompositor) return;
    var avance = (scrollY - inicioRiel) / altoUtil;
    avance = Math.min(Math.max(avance, 0), 1);
    pista.style.transform = "translate3d(" + (-avance * recorrido) + "px,0,0)";
  }

  function alScroll() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; pintar(); });
  }

  /* ---- indicador de recorrido y arranque de animaciones ----
     Se resuelve observando qué panel está en pantalla: así no hay
     ningún cálculo colgado del evento de scroll. */
  function construirBrujula() {
    if (!brujula || brujula.children.length) return;
    var n = pista.querySelectorAll(":scope > .hero, :scope > .seccion").length;
    for (var i = 0; i < n; i++) brujula.appendChild(document.createElement("i"));
  }

  function vigilarPaneles() {
    if (!("IntersectionObserver" in window)) return;
    var ojo = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) {
        if (!f.isIntersecting) return;
        var p = f.target;
        var i = paneles.indexOf(p);
        if (i < 0) return;
        if (brujula) {
          for (var k = 0; k < brujula.children.length; k++) {
            brujula.children[k].classList.toggle("on", k === i);
          }
        }
        document.documentElement.classList.toggle("clara-visible", p.classList.contains("clara"));
        p.classList.add("visible");
        if (window.activarTextos) window.activarTextos(p);
      });
    }, { threshold: 0.55 });
    paneles.forEach(function (p) { ojo.observe(p); });
  }

  construirBrujula();
  medir();
  vigilarPaneles();

  if (!porCompositor) addEventListener("scroll", alScroll, { passive: true });

  var t;
  addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(medir, 150);
  }, { passive: true });
  addEventListener("load", function () { setTimeout(medir, 200); });

  /* los enlaces del menú llevan al punto correcto del recorrido */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      var destino = document.getElementById(id);
      if (!destino) return;
      if (!activo || !pista.contains(destino)) return;   // Contacto: comportamiento normal
      e.preventDefault();
      var i = paneles.indexOf(destino);
      if (i < 0) return;
      var porPanel = (riel.offsetHeight - innerHeight) / (paneles.length - 1 || 1);
      scrollTo({ top: riel.offsetTop + porPanel * i, behavior: "smooth" });
    });
  });
})();
