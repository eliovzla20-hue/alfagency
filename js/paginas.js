/* Páginas internas — menú móvil (misma cortina que la portada) */
(function () {
  "use strict";
  var nav = document.getElementById("nav");
  var burger = document.querySelector(".burger");
  var fondo = document.getElementById("menuFondo");
  if (!nav || !burger) return;
  function cerrar() { nav.classList.remove("abierta"); burger.setAttribute("aria-expanded", "false"); }
  burger.addEventListener("click", function () {
    var abierto = nav.classList.toggle("abierta");
    burger.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
  if (fondo) fondo.addEventListener("click", cerrar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
})();
