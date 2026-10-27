# Hallazgos — registro único, con gravedad y motivo

Pedido por Jose el 26/10: *"pon todo lo que encuentres en la lista, ponle nivel
de importancia, anota exactamente por qué debe ser cambiado/arreglado y
continúa con lo siguiente."*

**Cómo leer esto.** Una fila por hallazgo. La gravedad no es una opinión sobre
lo feo que es: es **qué pasa si no se arregla**, que es lo único que sirve para
decidir el orden. Nada de lo que hay aquí está arreglado todavía — esto es la
lista, no el parte de trabajo.

| | Significa |
|---|---|
| 🔴 **ALTA** | Alguien pierde datos, o no puede recuperarlos, o la app dice algo falso sobre su dinero o sus datos |
| 🟠 **MEDIA** | Se puede explotar o confundir en condiciones concretas; o la app promete algo que no cumple |
| 🟡 **BAJA** | Hoy no hace daño, pero depende de que nadie toque la línea de al lado |
| ⚪ **HIGIENE** | No hay daño posible; se arregla porque es gratis y quita la pregunta |

---

## 🔴 H-01 · La papelera sólo enseña 200, y Jose ya borró 490

**Dónde:** `Code_v3_fixed.gs` ~15264, en `listTrash`.

```js
var span = Math.min(200, tLast - 1);   // the tail: recent deletions
```

**Qué pasa.** La lista de la papelera lee **sólo las últimas 200 filas**. El
23/10 Jose borró **490 movimientos de una vez**. De ésos, **290 no aparecen en
la papelera y no se pueden devolver desde la app.**

**Por qué hay que arreglarlo, exactamente.** No es una pantalla incompleta: es
**la vía de recuperación**. Toda la promesa de «borrar se puede deshacer»
descansa en esta lista, y se rompe justo en el caso en que más falta hace — un
borrado masivo hecho por error. Y falla **en silencio**: no dice «hay 290 más»,
simplemente no están, así que alguien concluye que se perdieron.

Las filas **no están perdidas** —siguen en la hoja TRASH— pero sólo se llega a
ellas abriendo el Sheet a mano, y la regla de este producto es *el cliente no
debe ir al sheet nunca*.

**Lo que yo haría:** paginar o filtrar del lado del servidor (traer por
material, por fecha o por lote de borrado), no subir el 200 a 2000 — eso sólo
mueve el muro y además trae a la pantalla miles de filas que nadie va a leer.
Encaja con la idea de agrupar que propuso Jose el 26/10.

---

## 🟠 H-02 · Decimos que la papelera guarda 30 días. No guarda 30 días: guarda siempre

**Dónde:** la hoja TRASH está clasificada como *registro* (`~1008`), el grupo
cuyas filas «sólo se añaden». **No hay ninguna limpieza automática.** Lo único
que vacía la papelera es el botón «🗑 Empty the trash».

**Qué decimos, en cambio.** En la landing, `t47`: *«la papelera que guarda 30
días un movimiento borrado para que lo puedas devolver»*. Y la app repite la
idea.

**Por qué hay que arreglarlo.** Por dos motivos, y el segundo es el caro:

1. **El texto es falso**, y en un sentido que confunde al cliente justo cuando
   más nervioso está: alguien que borró algo hace cinco semanas lee «30 días» y
   concluye que ya no se puede recuperar, cuando sí se puede.
2. **La hoja crece sin tope.** Es la misma clase de problema que resolvió el
   archivado de movimientos viejos, sin resolver aquí. Un cliente con años de
   uso acumula una papelera que nadie vacía nunca.

**Decisión de Jose, y es de producto:** o se construye la limpieza a los 30
días —y entonces el texto es verdad— o se cambia el texto a lo que la app hace.
**Yo haría lo segundo primero** (es una frase, hoy) y lo primero después,
porque borrar automáticamente lo que alguien podría querer devolver no es un
cambio que se deba hacer con prisa.

---

## 🟠 H-03 · Pedimos un permiso sensible de Google que no usamos **nunca**

**Dónde:** `appsscript.json`, `https://www.googleapis.com/auth/userinfo.profile`.

**Medido.** Comparé los once permisos declarados contra las llamadas reales del
código:

| Permiso | Usos en el código |
|---|---|
| `userinfo.email` | 21 |
| **`userinfo.profile`** | **0** |
| `spreadsheets.currentonly` | 113 |
| `drive` | 30 |
| `documents` | 2 |
| `script.external_request` | 11 |
| `script.send_mail` | 16 |
| `script.scriptapp` | 18 |
| `script.deployments` | 9 |
| `script.projects` | 1 |
| `script.container.ui` | 18 |

Y comprobé que tampoco se usa indirectamente: no hay una sola llamada a
`getUsername()` ni a nada que lea el nombre o la foto del perfil.

**Por qué hay que quitarlo, exactamente.** `userinfo.profile` es un permiso
**sensible**. Cada permiso sensible es una línea más en la pantalla que el
cliente tiene que aceptar al instalar, y esa pantalla **es la objeción número
uno de este producto** — es la razón de que exista una edición Básica con un
solo permiso. Estamos pagando ese precio por algo que no usamos ni una vez.

**Tamaño:** una línea. **Riesgo de quitarlo:** hay que comprobar que ninguna
instalación viva dependa del consentimiento ya dado; quitar un permiso del
manifiesto obliga a volver a autorizar. Hay que mirarlo antes, no después.

---

## 🟡 H-04 · Un escape de comillas a mano, a una llamada de ser explotable

**Dónde:** `Index_v3_fixed.html` ~19973, en `addDocGroup`.

```js
value="' + name.replace(/"/g,'&quot;') + '"
```

Escapa `"` y **no escapa `&`**. Un nombre que contenga el texto `&quot;` lo
decodifica el navegador a una comilla de verdad, se sale del atributo, y lo que
venga detrás se ejecuta.

**Hoy NO es explotable, y lo comprobé:** los tres sitios que llaman a esa
función pasan `null` o la cadena literal `'Document'`.

**Por qué hay que arreglarlo igual.** Porque la seguridad de esa línea no está
en la línea: está en que **los tres que la llaman sigan pasando literales**. Es
*dos cosas que tienen que coincidir sin que nada lo obligue*, otra vez. Y el
contexto acaba de cambiar: con el importador de CSV abierto en la edición
gratis, el nombre de un material **lo escribe otra persona, en un fichero**.

**Tamaño:** una línea — usar `_he()`, que ya existe.

---

## 🟡 H-05 · La pantalla de «Signed in» imprime sin escapar un texto de terceros

**Dónde:** `Code_v3_fixed.gs` ~2192, en `handleOAuthCallback_`.

```js
'<p style="color:#555">' + msg + '</p>'
```

`msg` sale de la respuesta del servidor de tokens de Google o de `err.message`.

**Gravedad baja, y conviene decir por qué** en vez de pintarlo peor: quien
ataca **no controla ese texto**. Controla el `code` de la URL, y ese code va a
Google, que contesta con sus propios mensajes.

**Por qué arreglarlo igual:** estamos metiendo en nuestra página, sin escapar,
una cadena que decide un tercero. Es una línea y quita la pregunta para
siempre.

---

## 🟠 H-06 · La pantalla de inicio de sesión se puede incrustar en cualquier web

**Dónde:** `Code_v3_fixed.gs` ~2194.

```js
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```

Cualquier sitio puede meter esta página en un marco invisible dentro del suyo.
En una página cualquiera daría igual; en la de **iniciar sesión**, es el montaje
clásico para que alguien pulse donde no cree estar.

**Y aquí hay que parar: no sé si ese `ALLOWALL` hace falta.** La app corre
dentro de un marco de Google y es posible que el flujo de sesión no funcione sin
él. **Cambiarlo a ciegas podría dejar a un cliente sin poder entrar, que es
peor que el riesgo que quita.**

**Lo que haría:** medirlo en una copia de pruebas con el modo por defecto. Si
entra, cambiarlo. Si no, dejarlo y **escribir aquí por qué**, para que dentro de
un año nadie lo lea como un descuido. **Decisión de Jose.**

---

## 🟡 H-07 · El mensaje de la papelera propone una causa falsa

**Dónde:** `Code_v3_fixed.gs` ~15225.

Lo encontró Jose el 26/10. Al devolver una salida cuya entrada también está en
la papelera, el guardia la rechaza —**y hace bien**— pero el mensaje dice *«el
almacén cambió mientras estaba en la papelera»*, que en su caso **era falso**, y
la pista que da manda a mirar donde no está.

**Por qué hay que arreglarlo.** Porque convierte un problema de orden con
solución de un clic en lo que parece un fallo de la app. Un cliente que ve eso
**desconfía de la papelera entera**, que es justo la función que existe para
dar confianza.

El detalle de cómo, y la decisión que hace falta antes, está en
`docs/BACKLOG.md`.

---

## ⚪ H-08 · `documents` se pide por una función que la gratis ni tiene

**Dónde:** `appsscript.json`; `DocumentApp` se usa **2 veces**, las dos para
crear un Google Doc temporal al subir un documento (`~9155`).

No es un fallo: el permiso se usa. Lo anoto porque **es un permiso sensible
sostenido por una sola función**, y si algún día esa función cambia de forma
—por ejemplo, si el lector de facturas deja de pasar por un Doc temporal— el
permiso debería irse con ella. Hoy no hay nada que lo vigile.

---

## Lo que falta por mirar

Parte 2 sigue abierta: el camino de los documentos adjuntos y quién puede
abrirlos (ya hay un hallazgo del 26/10 en `BACKLOG.md`), el alcance de `drive`
frente a `drive.file`, y el camino de los respaldos. Después, Parte 3 —el
perímetro: OAuth, el token de sesión, qué pasa al quitarle el acceso a alguien
con la pestaña abierta— y Parte 4, lo que Google puede cambiar debajo.

Y el análisis estructural, que es la otra mitad del encargo.
