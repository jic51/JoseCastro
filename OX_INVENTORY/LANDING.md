# Landing de Acopio — plan

---

## La decisión de fondo, antes del diseño

**¿La landing vende sola (auto-servicio) o genera contactos?**

**Recomendación: generar contactos.** Razones concretas, no de estilo:

- El paso de OAuth en Cloud Console es **manual** (~5 min por cliente) cuando
  hay gente fuera del dominio. Un auto-servicio dejaría a esos clientes con
  medio sistema y sin saber por qué.
- La regla de **quién hace la copia** es fácil de arruinar y no se puede
  deshacer: si en una empresa con dominio la copia la hace un Gmail personal,
  nadie del dominio se reconoce automáticamente, para siempre.
- Algunos dominios de Workspace **bloquean apps de Apps Script** por política.
  Eso hay que detectarlo antes, hablando con la persona.

Traducido: cada instalación necesita 10 minutos de conversación previa. La
landing tiene que conseguir esa conversación, no reemplazarla.

Se puede migrar a auto-servicio más adelante, cuando exista una solución al
registro manual de redirect URIs (ver `BACKLOG.md`).

---

## Qué tiene que lograr, en orden

1. Que alguien entienda en 10 segundos qué es y si es para él.
2. Que confíe (el miedo real es "¿y si pierdo mis datos con un desconocido?").
3. Que vea el precio sin tener que pedirlo.
4. Que deje su contacto.

---

## Estructura propuesta

### 1. Encabezado

Una frase concreta, sin lenguaje de software. Algo del estilo:

> **Tu inventario, en orden — sin cambiar de herramientas.**
> Acopio convierte tu Google Sheets en un sistema de bodega de verdad:
> entradas, salidas, ubicaciones, costos y alertas de stock. Instalado y
> configurado por nosotros.

Debajo, un botón: **"Agenda una demo"** (no "Comprar").

### 2. El problema, en sus palabras

Tres o cuatro líneas que el cliente reconozca como suyas:
- "No sé qué tengo realmente hasta que voy a contar."
- "El material sale y nadie anota para qué proyecto."
- "Cada semana pierdo horas cuadrando la hoja."

El dato del sector respalda esto: **3 a 5 horas semanales** de reconciliación
manual. Es el número contra el que se vende.

### 3. Capturas reales

Ya existe un sistema funcionando en producción. Cuatro capturas, sin
maquillar: Dashboard, Movements & History, Warehouse Map, y el popup de la
mañana con lo que llega hoy.

### 4. Los tres diferenciadores — la parte más importante

Estos tres son los que ningún competidor puede copiar sin cambiar su negocio:

- **Tus datos viven en TU Google Drive.** No en nuestro servidor. Si dejas de
  pagar, tu sistema sigue funcionando. No hay migración que hacer, ni de
  entrada ni de salida.
- **Sin cobro por usuario.** Diez personas en la bodega cuestan lo mismo que
  una. Los competidores cobran por asiento.
- **Nosotros lo instalamos y configuramos.** No es "aquí tienes un enlace,
  suerte".

### 5. Qué hace (lista honesta)

Lo que hay, en lenguaje de bodega y no de software. **Y una línea honesta de
lo que todavía no hay** (códigos de barras, conteo cíclico) — porque si lo
descubren en la demo, se pierde la venta *y* la confianza; si lo leen antes,
solo llega gente a la que no le importa.

### 6. Precio, visible

- **Instalación $400**, una sola vez
- **$39/mes** o **$390/año**, soporte y actualizaciones incluidos
- Sin cobro por usuario

Detalle de credibilidad: decir claramente **qué incluye el soporte** — cuánto
tarda una respuesta y qué pasa si algo se rompe.

### 7. Formulario de contacto

Corto. Nombre, empresa, correo, y una pregunta: *"¿Cómo llevan el inventario
hoy?"* — esa respuesta califica al cliente mejor que cualquier otro campo.

### 8. Pie

Política de Privacidad, Términos de Servicio (los dos ya existen en
`legal/`, falta publicarlos) y el enlace a **novedades**.

---

## Página de novedades (changelog) — segunda página, no opcional

Hace falta para tres cosas distintas:
1. El hipervínculo del nombre "Acopio" dentro de la app (pedido de Jose).
2. La tarjeta de reenganche cada 6 meses (ver `BACKLOG.md`).
3. Demostrarle a un cliente que el producto está vivo — que es la mitad del
   argumento del soporte mensual.

Formato: una entrada por versión, con fecha, en lenguaje de cliente y no de
programador. "Ahora puedes marcar un pedido como recibido desde la pantalla de
la mañana" — no "v9.94: mark-arrived shortcut, admin-gated".

El historial ya está escrito: los mensajes de commit de cada versión tienen el
qué y el porqué.

---

## Qué NO poner

- Testimonios inventados. Sin clientes todavía, mejor no tener sección.
- "Prueba gratis" — no hay auto-servicio, sería una promesa falsa.
- Comparativas de tabla contra competidores por nombre. Invita a que comparen
  funciones donde vamos perdiendo (códigos de barras) en vez de donde ganamos
  (propiedad de los datos, sin cobro por usuario).
- Chat en vivo. Nadie va a estar del otro lado.

---

## Orden de construcción

1. Reservar el dominio y publicar Privacidad + Términos (los textos ya
   existen; es solo hosting).
2. Una sola página con las secciones 1–8 y el formulario.
3. La página de novedades, poblada desde el historial de versiones.
4. Recién después: SEO, blog, cualquier otra cosa.
