# Análisis de seguridad de Acopio Pro — Parte 1

Pedido por Jose el 26/10: *"¿puedes correr un análisis completo de seguridad de
Acopio Pro...? Hazlo en partes."*

**Qué es esto y qué no.** Es una revisión del código que se entrega, hecha
leyendo y midiendo sobre el archivo, no una prueba de penetración contra una
instalación viva. Donde no he podido comprobar algo, lo dice. **No he atacado
ninguna instalación de nadie**, ni la de Jose: lo que hay aquí sale de leer los
dos archivos del producto y de ejecutar trozos en una caja aislada.

**Parte 1 cubre:** la superficie expuesta a internet, quién decide que alguien
es quien dice ser, la inyección de HTML, y los secretos. Las partes siguientes
están al final.

---

## RESUMEN, Y LA NOTICIA BUENA PRIMERO

La pieza que más suele estar mal en una app como ésta —**quién puede llamar a
qué**— aquí está bien, y además está vigilada por una prueba. Eso no es poco:
es la clase de fallo que se descubre cuando ya pasó algo.

| | Qué | Gravedad |
|---|---|---|
| ✅ | La autorización de los 107 endpoints está completa y argumentada | — |
| ✅ | El rol **nunca** llega desde el navegador | — |
| ✅ | No hay un solo secreto en los archivos que se entregan | — |
| 🟡 | Un sitio escapa comillas a mano, y está **a una llamada** de ser explotable | baja hoy |
| 🟡 | La pantalla de inicio de sesión imprime sin escapar un texto que no controlamos | baja |
| 🟠 | Esa misma pantalla se puede **incrustar en cualquier web** | media, y pide una decisión |

---

## 1 · LA SUPERFICIE: 107 PUERTAS A INTERNET

El manifiesto despliega la app con `executeAs: USER_DEPLOYING` y
`access: ANYONE`. Eso significa algo que conviene decir sin rodeos:

> **Toda función global sin guión bajo es una dirección de internet que
> cualquiera con la URL puede llamar, y que corre con los permisos del
> administrador.** No sólo las que el navegador usa: *todas*.

Son **107**. Medido, no estimado.

**Y están cubiertas.** `tools/test-endpoint-auth.js` las recorre en cada pase:
92 llevan un guardia reconocido, 15 están en una lista de excepciones **con su
motivo escrito**, y **0 quedan sin explicar**. Lo comprobé corriéndolo.

Mi propio barrido independiente sacó 20 sin guardia visible en vez de 15; la
diferencia son funciones de cálculo puro (`normalizeString`, `getMaterialId`,
`parseArchiveRow`) que no tocan la hoja. Dos barridos distintos, ninguna
sorpresa.

**Lo que sí quiero dejar anotado, porque es una propiedad del diseño y no un
fallo:** esa lista de 15 excepciones es lo único que separa «argumentado» de
«olvidado». Mientras la prueba exija un motivo escrito para cada una, está
sostenido. El día que alguien añada una excepción con el motivo «temporal», se
rompe la cadena.

---

## 2 · LA IDENTIDAD: EL NAVEGADOR NO DECIDE QUIÉN ERES

Ésta es la que de verdad importa en una instalación con equipo, y es la que
suele estar mal. Aquí no lo está.

Todo pasa por `_verifiedAuth`, que nace en `null` y **sólo** lo escribe
`setVerifiedAuth_`. Revisé sus once llamadas, una por una:

| De dónde sale la identidad | Veces | ¿Se puede falsificar desde el navegador? |
|---|---|---|
| `getUserRole(token)` — búsqueda en el servidor a partir del token de sesión | 6 | **No.** El navegador manda un token, no un rol |
| Disparador programado | 3 | No: no hay petición |
| `requireOwnerContext_()` — menú de la hoja | 1 | No: revienta fuera del Sheets |
| Asistente de instalación | 1 | No: antes de que exista la app |

**En ningún sitio el rol llega dentro de los datos de la petición.** Eso es
exactamente lo que impide que un bodeguero se declare administrador cambiando
un campo, y es el ataque obvio contra este tipo de app.

`requireAuth_` además distingue tres negativas distintas —sin sesión, no
registrado, rol insuficiente— y **registra el intento** antes de rechazarlo.

---

## 3 · 🟡 UNA COMILLA ESCAPADA A MANO — a una llamada de ser un problema

`Index_v3_fixed.html`, en `addDocGroup` (~19973):

```js
'<input class="doc-group-name" type="text" value="' +
  name.replace(/"/g,'&quot;') + '" ...>'
```

Escapa `"` y **nada más**. En concreto, **no escapa `&`**, y ahí está el
agujero: un nombre que contenga literalmente el texto `&quot;` lo decodifica el
navegador a una comilla, se sale del atributo, y lo que venga detrás se ejecuta.

**Hoy NO es explotable, y lo comprobé:** los tres sitios que llaman a
`addDocGroup` pasan `null` o la cadena literal `'Document'`, y
`_suggestedDocName` sólo devuelve nombres de una lista fija o `Document N`.

**Entonces, ¿por qué lo pongo?** Porque la seguridad de esa línea no está en la
línea: está en que **los tres que la llaman pasen literales**. Es la misma forma
que este proyecto ya conoce con otro nombre —*dos cosas que tienen que coincidir
sin que nada lo obligue*— y el cuarto que llame pasando el nombre del material
o del proveedor la convierte en un fallo de verdad. Y con el importador de CSV
recién abierto, ese nombre puede venir de un fichero que escribió otra persona.

**Arreglo:** usar `_he()`, que ya existe y escapa las cinco. Una línea.

---

## 4 · 🟡 LA PANTALLA DE «SIGNED IN» IMPRIME UN TEXTO QUE NO CONTROLAMOS

`handleOAuthCallback_` (~2185) construye su página así:

```js
'<p style="color:#555">' + msg + '</p>'
```

Sin escapar. `msg` sale de `data.error_description || data.error` —la respuesta
del servidor de tokens de Google— o de `err.message`.

**Gravedad: baja, y conviene decir por qué** en vez de pintarlo peor de lo que
es. Quien ataca no controla ese texto: controla el `code` de la URL, y ese code
va a Google, que contesta con sus propios mensajes. Para explotarlo haría falta
que Google devolviera un `error_description` con HTML dentro.

**Pero el principio sigue valiendo:** estamos metiendo en nuestra página, sin
escapar, una cadena que decide un tercero. Es gratis arreglarlo y quita la
pregunta.

---

## 5 · 🟠 ESA MISMA PANTALLA SE PUEDE INCRUSTAR EN CUALQUIER WEB

```js
return HtmlService.createHtmlOutput(html)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
```

`ALLOWALL` significa que **cualquier sitio puede meter esta página en un marco
invisible dentro del suyo**. En una página cualquiera daría igual. Aquí no: es
la página por la que alguien **inicia sesión**, y una página de inicio de sesión
dentro del marco de otro es el montaje clásico para que alguien pulse donde no
cree estar.

**Y aquí tengo que parar y ser honesto: no sé si ese `ALLOWALL` es necesario.**
La app de Acopio corre dentro de un marco de Google, y es muy posible que el
flujo de sesión no funcione sin él. Cambiarlo a ciegas podría dejar a la gente
sin poder entrar, que es peor que el riesgo que quita.

**Lo que haría, en este orden:** primero medir —abrir el flujo con el modo por
defecto en una copia de prueba y ver si entra—; si funciona, cambiarlo; si no,
dejarlo y escribir **aquí** por qué, para que dentro de un año nadie lo mire y
piense que fue un descuido. **Esto es una decisión de Jose**, porque el riesgo
de tocarlo lo paga un cliente que no puede entrar.

---

## 6 · ✅ SECRETOS: NINGUNO EN LO QUE SE ENTREGA

Busqué en los dos archivos del producto las formas que tienen las claves de
Google y las de OAuth (`AIza…`, `GOCSPX-…`, `AQ.…`, bloques `BEGIN`).
**Cero resultados.**

Es lo correcto y además es coherente con lo que ya estaba decidido: las claves
viven en las Script Properties de la copia **del cliente**, no en el código. Un
cliente que lea su propio archivo —y puede, es suyo— no encuentra nada de otro
cliente ni nuestro.

---

## LO QUE FALTA, Y EN QUÉ ORDEN

**Parte 2 — los datos y los permisos de Google.** Qué puede leer cada permiso
del manifiesto frente a lo que la app usa de verdad; si el alcance de Drive es
más ancho de lo necesario; qué pasa con los documentos adjuntos y quién puede
abrirlos (ya hay un hallazgo abierto del 26/10); y el camino de los respaldos.

**Parte 3 — el perímetro de la instalación.** El flujo de OAuth entero, el
token de sesión y su caducidad, qué pasa cuando se le quita el acceso a alguien
que tiene la pestaña abierta, y los registros: qué se guarda de cada persona y
durante cuánto.

**Parte 4 — lo que Google puede cambiar debajo.** Cuotas, el límite de seis
minutos, y qué se rompe si cambian las reglas de las apps no verificadas. Esto
es menos «seguridad» y más «riesgo», pero es el que puede apagar el producto de
un día para otro.

**Y aparte, el análisis estructural**, que es la otra mitad de lo que pidió
Jose.
