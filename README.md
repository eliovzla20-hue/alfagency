# Alfa Agency — Sitio web

Sitio de **Alfa Agency**, agencia creativa venezolana.

Página única, sin frameworks ni compilación: HTML, CSS y JavaScript plano.
Se abre con doble clic y se publica subiendo la carpeta tal cual.

---

## Cómo verlo

**Rápido:** doble clic en `index.html`.

**Con servidor local** (recomendado, se comporta igual que en producción):

```bash
cd "ruta/a/WEB ALFA AGENCY"
python3 -m http.server 8791
# abrir http://localhost:8791
```

Añadiendo `?fps` a la dirección aparece un contador de cuadros por segundo:
`http://localhost:8791/index.html?fps`

---

## Estructura

```
WEB ALFA AGENCY/
├── index.html          ← toda la web (estructura y estilos)
├── js/
│   ├── texto.js        ← animación de textos: letra a letra, decodificado, contadores
│   ├── ui.js           ← índice de servicios y acordeón del proceso
│   └── recorrido.js    ← desplazamiento horizontal de las secciones
├── img/
│   ├── servicio-*.webp ← piezas de cada servicio (8)
│   ├── caso-*          ← portadas de los casos (Fresco, La Pizarra, Checkad)
│   ├── proceso-*.webp  ← fotos de los cinco pasos
│   └── logo-*          ← logotipos e icono
├── README.md
└── .gitignore
```

Nada más: 724 KB en total, 25 archivos.

---

## Cómo funciona

**El scroll es horizontal.** Al bajar, las cinco primeras secciones se desplazan hacia la
derecha: Inicio → Nosotros → Servicios → Casos → Proceso. La última, Contacto, vuelve al
desplazamiento vertical normal.

Por debajo de 981 px de ancho el recorrido se desactiva solo y todo baja en vertical: el
scroll horizontal en teléfono resulta incómodo.

**Ritmo claro / oscuro.** Inicio, Servicios, Proceso y Contacto sobre fondo oscuro;
Nosotros y Casos en claro.

**Animaciones.** Entradas letra a letra, texto que se decodifica, contadores, cortinas que
descubren las imágenes, barra de avance de lectura y destello sobre los titulares.

---

## Marca

Según el brandbook:

| Color | Código |
|---|---|
| Dark Blue | `#002063` |
| King Blue | `#003d91` |
| Light Blue | `#209ff4` |
| Blanco | `#ffffff` |

**Tipografía:** Poppins (Google Fonts). Black para titulares, Light para texto.
**Acción principal:** WhatsApp, en verde `#25d366`.

---

## Rendimiento

El recorrido horizontal obliga a cuidar el coste de dibujado. Lo que se hizo y por qué:

- **El desplazamiento lo lleva el compositor**, no JavaScript (`animation-timeline`). Así el
  recorrido no se retrasa aunque el hilo principal esté ocupado. Queda un respaldo por
  JavaScript para navegadores que no lo admitan.
- **Sin `backdrop-filter`**: se recalculaba en cada cuadro sobre contenido en movimiento.
- **Sombras con desenfoque moderado**: su coste crece con el cuadrado del radio.
- **Sin `filter` ni `text-shadow` animados**: el destello de los titulares es una capa que
  solo cambia de opacidad.
- **Sin transformaciones largas sobre imágenes de fondo**: obligaban a redibujarlas durante
  segundos.
- **`contain: layout paint`** en cada panel, para que un cambio no recalcule la fila entera.
- El destello solo corre en el panel visible, no en las ~220 letras del sitio.
- Los scripts van versionados (`?v=`) para que el navegador no sirva copias antiguas.

---

## Créditos de imágenes

- Piezas de servicios, casos y logotipos: **Alfa Agency**.
- Fotos de apoyo (los cinco pasos del proceso y dos servicios): **Unsplash**, licencia libre
  para uso comercial.

---

## Pendientes

- [ ] Piezas propias para *Publicidad Meta Ads* y *Asesoría de Mercadeo* (hoy con foto de archivo).
- [ ] Confirmar el dato del caso Checkad: "+1.400 seguidores" es la cifra actual de Instagram,
      no un crecimiento atribuible al trabajo de la agencia.
- [ ] Revisar el sitio completo en tablet y teléfono.
