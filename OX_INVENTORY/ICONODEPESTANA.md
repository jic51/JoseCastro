# El ícono de la pestaña — qué pasó, y cómo se arregla

## Lo que pasó

En v9.84 se envió un cambio que decía poner el ícono de Acopio en la pestaña,
y el logo del cliente en cuanto subiera uno. **No funcionaba.** Jose usó dos
instalaciones reales durante semanas y las dos siguieron mostrando el ícono
genérico de Apps Script.

Peor: había un test (`tools/test-favicon.js`) que pasaba. Eso fue lo que lo
mantuvo escondido.

## Por qué no funcionaba

Lo mismo que ya nos había mordido con los PDFs y con las peticiones directas
de archivos: **el sandbox**.

Lo que `Index_v3_fixed.html` dibuja no es la página del navegador. Es un
**iframe** servido desde `googleusercontent.com`, metido dentro de una página
de Google. Y **la pestaña toma su ícono del documento de arriba** — el de
Google, no el nuestro. Cambiar el `<link rel="icon">` dentro del iframe no
llega a la pestaña, y nunca iba a llegar.

La prueba de que es exactamente eso: **el título de la pestaña SÍ funciona.**
Dice "OX Glass LLC. — Acopio". Y funciona porque se pone del lado del
servidor, con `.setTitle()` sobre el `HtmlOutput`, que sí toca la página de
afuera. El ícono nunca tuvo su equivalente.

## Por qué el test no lo detectó

`test-favicon.js` cargaba `Index` como documento de nivel superior
(`file://`), donde un `<link rel="icon">` sí manda sobre la pestaña —
condición que **nunca** se da en producción.

Y las etiquetas del test decían *"favicon becomes the company logo"* cuando
lo que en realidad había comprobado era *"el atributo href cambió"*.

**La lección, anotada en el encabezado del propio test para que no se repita:
un test que verifica el mecanismo demuestra el mecanismo, no el resultado.**

## Cómo se arregla (v9.98)

`doGet` ahora llama a `setFaviconUrl()` sobre el `HtmlOutput` — del lado del
servidor, sobre la página de afuera, igual que `setTitle`. Lee la URL de una
Script Property nueva, **`FAVICON_URL`**.

### La restricción que decide todo

**Google va a buscar esa imagen él mismo.** Por lo tanto la URL tiene que ser:

- `https://` — no vale `data:`
- **pública** — no vale un archivo privado del Drive del cliente

Eso es lo que hace que "el logo del cliente se vuelve su ícono
automáticamente" no sea gratis: el logo vive privado en su Drive, y para
usarlo de ícono habría que exponerlo públicamente.

### Qué se puede hacer hoy, y qué falta decidir

**Ya funciona, en cuanto exista una URL:** poner `FAVICON_URL` en las Script
Properties de una instalación y volver a desplegar. Sin URL, se queda como
está hoy — el ícono de Google — que es exactamente lo que todos ven ahora, así
que no empeora nada.

**Falta:** un lugar público donde vivir el ícono de Acopio. Lo natural es
`acopio.com/favicon.png` cuando exista la landing. Mientras tanto, un archivo
de Drive marcado como público también sirve.

**Decisión pendiente de Jose — el ícono por cliente.** Para que cada cliente
vea SU logo en la pestaña, ese logo tiene que ser públicamente accesible. Un
logo de empresa no es información sensible (normalmente está en su propia
página web), pero es una excepción a la regla de "todo archivo nace privado"
y no la voy a tomar solo. Tres caminos:

1. **Solo el ícono de Acopio, igual para todos.** Cero decisiones, cero
   exposición. Resuelve el problema real que reportó Jose (no ver el ícono de
   Apps Script) y se ve consistente para todos los clientes.
2. **Ícono por cliente, con permiso explícito.** En el asistente, junto a la
   subida del logo: *"¿Usar tu logo también como ícono de la pestaña? Para
   eso el archivo del logo queda accesible por enlace público."* El cliente
   decide, informado.
3. **Ícono por cliente pedido aparte.** Que suba a `FAVICON_URL` una URL que
   él ya tenga pública (casi todas las empresas tienen su logo en su web).
   Nada nuevo se hace público por nuestra cuenta.

Mi recomendación: **(1) ahora, (3) como opción para quien lo pida.** La (2)
convierte una configuración cosmética en una pregunta sobre privacidad en
medio del asistente, que es un mal lugar para hacerla.

## Cómo verificar que quedó — esto NO lo puede probar ningún test de aquí

Necesita un despliegue real. El procedimiento es mirar:

1. Poner `FAVICON_URL` en las Script Properties con una URL pública `https://`.
2. **Volver a desplegar** (Manage deployments → ✏️ → New version).
3. Abrir la app y mirar la pestaña.

Si no cambia, el sospechoso es la URL: Google tiene que poder descargarla sin
sesión. Pruébala pegándola en una ventana de incógnito — si ahí no carga la
imagen, tampoco va a cargar para Google.
