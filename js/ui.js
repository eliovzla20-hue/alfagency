/* =============================================================
   Interfaz — Alfa Agency
   Índice de servicios y brillo que sigue al cursor en las piezas.
   ============================================================= */
(function () {
  "use strict";
  var WA = "https://wa.me/584245040868?text=";

  var ICONOS = {
    share:'<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.4 10.8l7.2-4.2M8.4 13.2l7.2 4.2"/></svg>',
    mega:'<svg viewBox="0 0 24 24"><path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8.5a4.5 4.5 0 010 7"/></svg>',
    palette:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18c1.4 0 2-1 2-1.8s-.7-1.2-.7-2 .6-1.2 1.4-1.2H17a4.5 4.5 0 004.5-4.5C21.5 6.6 17.2 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8.5" r="1"/></svg>',
    wand:'<svg viewBox="0 0 24 24"><path d="M4 20L17 7M15 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19.5 11l.7 1.4 1.4.7-1.4.7-.7 1.4-.7-1.4-1.4-.7 1.4-.7z"/></svg>',
    compass:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    brush:'<svg viewBox="0 0 24 24"><path d="M9.5 14.5l7-7a2.1 2.1 0 013 3l-7 7"/><path d="M9.5 14.5c-1.6-1.6-4 0-4 2 0 1.2-.6 2-1.5 2.5 1.4 1.3 3 1.6 4.4 1 1.6-.7 2.6-2.5 1.1-5.5z"/></svg>',
    code:'<svg viewBox="0 0 24 24"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/></svg>',
    chart:'<svg viewBox="0 0 24 24"><path d="M4 20h16"/><path d="M7 20v-6M12 20V6M17 20v-9"/></svg>'
  };

  var SERVICIOS = [
    { t:"Gestión de Redes Sociales", i:"share",   img:"servicio-1-redes-sociales.webp", pos:"center 45%",
      d:"Construimos comunidades con una voz humana, cercana y coherente para transformar seguidores en aliados de tu proyecto. Planificamos contenido, gestionamos la interacción y medimos resultados para que tu presencia digital crezca con propósito." },
    { t:"Publicidad Meta Ads", i:"mega", img:"servicio-2-meta-ads.webp", pos:"center 50%",
      d:"Diseñamos campañas para Facebook e Instagram enfocadas en resultados reales, alcance de calidad e inversión optimizada. Segmentamos tu audiencia ideal y creamos creatividades que convierten atención en clientes." },
    { t:"Identidad Visual", i:"palette", img:"servicio-3-identidad-visual-la-pizarra.webp", pos:"center 42%",
      d:"Creamos el rostro gráfico de tu marca: logotipo, paleta, estilo visual y piezas que comuniquen tu esencia con claridad. Un sistema visual coherente que te diferencia y genera confianza en cada punto de contacto." },
    { t:"Branding Estratégico", i:"wand", img:"servicio-4-branding-cafe-de-la-casa.webp", pos:"center 30%",
      d:"Definimos el ADN de tu marca para que puedas posicionarte con propósito, coherencia y una personalidad reconocible. Desde el nombre hasta el tono de voz, construimos marcas que conectan emocionalmente." },
    { t:"Asesoría de Mercadeo", i:"compass", img:"servicio-5-asesoria-mercadeo.webp", pos:"center 50%",
      d:"Te orientamos con criterio profesional para tomar decisiones de crecimiento más organizadas, sensibles y estratégicas. Analizamos tu mercado, competencia y oportunidades para trazar un camino claro." },
    { t:"Diseño Gráfico", i:"brush", img:"servicio-6-diseno-grafico-vamos.webp", pos:"center 38%",
      d:"Desarrollamos piezas para redes, vallas, ropa, accesorios y soportes que necesitan impacto visual y ejecución profesional. Cada pieza comunica, atrae y refuerza tu identidad de marca." },
    { t:"Páginas Web", i:"code", img:"servicio-7-paginas-web-uny.webp", pos:"center 48%",
      d:"Diseñamos tu casa digital con estructura, funcionalidad y una experiencia que proyecte solidez ante tus clientes. Sitios rápidos, modernos y optimizados para convertir visitas en oportunidades de negocio." },
    { t:"Software para Negocios", i:"chart", img:"servicio-8-software-sistemas.webp", pos:"center 45%",
      d:"Creamos soluciones tecnológicas para organizar procesos, medir datos y mejorar la gestión diaria de tu empresa. Sistemas a medida que automatizan tareas y te dan visibilidad total de tu negocio." }
  ];

  var tabs = document.getElementById("svcTabs");
  if (tabs) {
    var elPic = document.getElementById("svcPic"),
        elTit = document.getElementById("svcTitle"),
        elDes = document.getElementById("svcDesc"),
        elCta = document.getElementById("svcCta");

    SERVICIOS.forEach(function (s, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "svc-tab" + (idx === 0 ? " on" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", idx === 0 ? "true" : "false");
      b.innerHTML = '<span class="ic">' + ICONOS[s.i] + '</span><span>' + s.t + '</span>';
      b.addEventListener("click", function () { elegir(idx); });
      tabs.appendChild(b);
    });

    function elegir(idx) {
      var s = SERVICIOS[idx];
      var items = tabs.querySelectorAll(".svc-tab");
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle("on", i === idx);
        items[i].setAttribute("aria-selected", i === idx ? "true" : "false");
      }
      // la imagen se cambia con un fundido
      var nueva = elPic.cloneNode(false);
      nueva.src = "img/" + s.img;
      nueva.alt = "Trabajo de " + s.t + " realizado por Alfa Agency";
      nueva.style.objectPosition = s.pos || "center";
      elPic.parentNode.replaceChild(nueva, elPic);
      elPic = nueva;

      elTit.textContent = s.t;
      elDes.textContent = s.d;
      elCta.href = WA + encodeURIComponent("Hola Alfa Agency, me interesa el servicio de " + s.t + ".");
    }
    elegir(0);
  }

  /* brillo que sigue al cursor, también en casos y pasos */
  if (!matchMedia("(hover: none)").matches) {
    document.querySelectorAll(".caso").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
    });
  }

  /* ---------- acordeón del proceso ---------- */
  var pasos = [].slice.call(document.querySelectorAll("#pasos .paso"));
  if (pasos.length) {
    var puntos = document.getElementById("pPuntos");
    var prev = document.getElementById("pPrev"), sig = document.getElementById("pNext");
    var actual = 0;

    pasos.forEach(function (el, i) {
      el.addEventListener("click", function () { verPaso(i); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); verPaso(i); }
      });
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Paso " + (i + 1));
      d.addEventListener("click", function () { verPaso(i); });
      puntos.appendChild(d);
    });
    var bolas = [].slice.call(puntos.children);

    function verPaso(i) {
      actual = i;
      pasos.forEach(function (el, n) { el.classList.toggle("on", n === i); });
      bolas.forEach(function (b, n) { b.classList.toggle("on", n === i); });
      if (prev) prev.disabled = i === 0;
      if (sig)  sig.disabled  = i === pasos.length - 1;
    }
    if (prev) prev.addEventListener("click", function(){ if (actual > 0) verPaso(actual - 1); });
    if (sig)  sig.addEventListener("click", function(){ if (actual < pasos.length - 1) verPaso(actual + 1); });
    verPaso(0);
  }

  /* ---------- menú móvil ---------- */
  var nav = document.getElementById("nav");
  var burger = document.querySelector(".burger");
  if (nav && burger) {
    burger.addEventListener("click", function () {
      var abierto = nav.classList.toggle("abierta");
      burger.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    // al elegir un destino, el panel se recoge solo
    document.querySelectorAll("#menuPanel a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("abierta");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
