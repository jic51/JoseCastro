# AUDITORÍA DE LAS PESTAÑAS Y DE CADA COLUMNA

Jose, 2026-10-06: *"QUIERO QUE AUDITES LAS PESTAÑAS DEL SHEET Y CADA COLUMNA DE
CADA UNA. ANALIZA SI EN REALIDAD NECESITAMOS TODAS ESAS COLUMNAS Y SI LOS DATOS
ESTÁN REPETIDOS. SI LO ESTÁN, ANALIZA SI NECESITAMOS QUE ESOS DATOS SE REPITAN
Y, SI NO, BUSCA LA MEJOR FORMA DE QUITARLOS SIN DAÑAR LA APP NI LOS DATOS.
LUEGO, DAME LA LISTA DE TODO, CON LOS PROS Y CONTRAS DE CADA SUGERENCIA, Y
DÉJAME DECIDIR."*

**Aquí no se cambia nada.** Este documento es la lista para que decidas.

---

## CÓMO SE HIZO, Y POR QUÉ ESO IMPORTA

No miré tu hoja. Leí el **código que la escribe y la lee**, que es una cosa
distinta y en este caso la correcta.

Si auditara tu hoja te diría qué columnas tienen datos hoy. Lo que hace falta
saber es otra cosa: **qué columnas lee la app, y de dónde sale cada valor.** Una
columna puede estar llena de datos y que nadie los lea nunca (eso es basura con
aspecto de información) y puede estar vacía y ser imprescindible (una columna
que se llena sólo cuando pasa algo).

Todo lo de abajo sale de cuatro sitios del fichero `Code_v3_fixed.gs`:

- `ensureCoreSheets_` — la especificación de las cabeceras de las hojas núcleo.
- `AC` — el mapa de columnas del archivo, con su anchura real (`AC_WIDTH = 23`).
- Las funciones `ensure*Sheet_` — una por cada hoja secundaria.
- Las funciones que **leen** cada hoja: ahí es donde se ve si una columna se
  usa o sólo se escribe.

**Una columna que se escribe y no se lee nunca no es un dato: es un gasto.**
Esa es la vara de medir de toda esta auditoría.

---

## LAS PESTAÑAS: 19 EN TOTAL, NO 16

Dijiste 16. El código crea 19, en cuatro familias. La diferencia son las tres
pestañas de documento (`👉 START HERE`, los Términos y la Privacidad), que
probablemente no contaste porque no son tablas. Lo digo porque si alguna vez
contamos pestañas para comprobar una instalación, el número tiene que ser el
mismo en los dos lados.

Las familias ya existen en el código (`gruposDeFormato_`), y no son un invento
de esta auditoría — son las que ya deciden el color de pestaña:

| Familia | Pestañas | ¿Se puede editar a mano? |
|---|---|---|
| **documento** | `👉 START HERE`, `📄 Terms`, `📄 Privacy Policy` | No hace falta |
| **datos** | `MASTER_ARCHIVE_V3`, `INCOMING_V3`, `USERS_V3`, `CONFIG`, `MATERIAL_PACKS`, `PM_DIRECTORY`, `RACK_PHOTOS` | **Sí** — son la verdad |
| **calculada** | `LIVE_STOCK`, `SITE_STOCK`, `WASTED_STOCK`, `RESERVATIONS`, `MATERIAL_LOCKS` | **No** — se reescriben |
| **registro** | `AUDIT_LOG`, `ERROR_LOG`, `ARCHIVE_HISTORY`, `MOVEMENT_TRASH` | **No** — sólo se añade |

Esa división es la que de verdad manda en esta auditoría, porque **quitar una
columna cuesta cosas completamente distintas según la familia**:

- En **calculada**, una columna se puede quitar casi gratis: la hoja se
  reconstruye desde cero en el siguiente guardado. No hay dato que perder,
  porque el dato no vive ahí.
- En **registro**, quitar una columna **reescribe el pasado**, y el pasado es
  justamente lo único que esas hojas sirven para guardar.
- En **datos**, quitar una columna es una migración de verdad.

---

## PESTAÑA POR PESTAÑA, COLUMNA POR COLUMNA

### 1. `MASTER_ARCHIVE_V3` — 23 columnas. LA VERDAD.

Todo lo demás en el archivo se deriva de aquí. Si esta hoja está bien, todo se
puede reconstruir; si está mal, nada se salva.

| # | Col | Cabecera | ¿De dónde sale? | Veredicto |
|---|---|---|---|---|
| 0 | A | System Date | reloj, al guardar | **Necesaria** |
| 1 | B | Type (categoría) | lo teclea la persona | **Necesaria** — mitad de la identidad del material |
| 2 | C | Name | lo teclea la persona | **Necesaria** — la otra mitad |
| 3 | D | GC | lo teclea la persona | **Necesaria** — contratista general; la interfaz la lee en varios sitios |
| 4 | E | PO# | lo teclea la persona | **Necesaria** |
| 5 | F | Qty | lo teclea la persona | **Necesaria** |
| 6 | G | Unit | lo teclea la persona | **Necesaria** |
| 7 | H | Date Received | lo teclea la persona | **Necesaria** — no es lo mismo que A |
| 8 | I | Source Location | lo teclea la persona | **Necesaria** |
| 9 | J | Supplier | lo teclea la persona | **Necesaria** |
| 10 | K | Comments | lo teclea la persona | **Necesaria** |
| 11 | L | Status | **calculada de MoveType** | ⚠️ **Repetida — propuesta 1** |
| 12 | M | Received By | lo teclea la persona | **Necesaria** — y distinta de Q, a propósito |
| 13 | N | Project | lo teclea la persona | **Necesaria** |
| 14 | O | Mat ID | **calculada de B + C** | ⚠️ **Repetida — propuesta 2** |
| 15 | P | Doc Links | adjuntos | **Necesaria** |
| 16 | Q | User Email | quién lo escribió | **Necesaria** |
| 17 | R | Destination Location | lo teclea la persona | **Necesaria** |
| 18 | S | MoveType | lo elige la persona | **Necesaria** — el verbo del movimiento |
| 19 | T | PM | lo teclea la persona | **Necesaria** |
| 20 | U | Unit Cost | lo teclea la persona, o el promedio | **Necesaria** |
| 21 | V | Total Cost | **= Qty × Unit Cost, siempre** | ⚠️ **Repetida — propuesta 3** |
| 22 | W | Movement ID | se da al nacer la fila | **Necesaria** — y es la que arregló una familia entera de fallos |

Sobre M y Q, que parecen lo mismo y no lo son: **"Received By" es quien recibió
la mercancía y "User Email" es quien la apuntó.** El código se niega
explícitamente a rellenar M con el usuario conectado, y tiene razón: alguien
apunta una entrega por otro todo el tiempo, y una vez escrito no habría forma
de saber que es mentira. **No tocar.**

Y sobre A y H, que también parecen lo mismo: A es cuándo se escribió la fila, H
es cuándo llegó el material. Apuntar el lunes una entrega del viernes es normal.
**No tocar.**

---

### 2. `ARCHIVE_HISTORY` — las mismas 23 columnas

Es el archivo viejo: las filas más antiguas que el corte se mudan aquí. Copia la
cabecera del archivo al nacer, así que **cualquier cosa que se decida sobre el
archivo le pasa igual a esta hoja**, y hay que hacerlo en las dos a la vez o
quedan desalineadas — y entonces `findMovementById_`, que busca en las dos,
leería dos columnas distintas creyendo que son la misma.

---

### 3. `MOVEMENT_TRASH` — 26 columnas (las 23 + 3)

Las 23 del archivo, tal cual, más `Deleted At`, `Deleted By`, `Came From`. La
fila se copia **literalmente** para que al restaurarla vuelva lo que había y no
una reconstrucción de lo que había. **Las tres columnas del final son todas
necesarias** y ninguna se repite: cuándo, quién, y de qué hoja salió (porque se
puede borrar algo del archivo o del histórico, y restaurar tiene que devolverlo
a su sitio).

---

### 4. `LIVE_STOCK` — 8 columnas, de las que **se leen 6**

| # | Cabecera | ¿Se lee? |
|---|---|---|
| A | Category | sí |
| B | Name | sí |
| C | Project | sí (en `buildStockFromDerivedSheets_`) |
| D | Location | sí (y también en `locationUsage_`) |
| E | Qty | sí |
| F | Unit | sí |
| G | Location_Type | **nunca** — y siempre vale el texto `'RACK'` |
| H | Last_Updated | **nunca** — y es la misma hora en todas las filas |

⚠️ **Propuesta 4.**

---

### 5. `SITE_STOCK` — 7 columnas, de las que **se leen 4**

| # | Cabecera | ¿Se lee? |
|---|---|---|
| A | Category | sí |
| B | Name | sí |
| C | Project | **nunca** por la app (pero es lo único que dice *de qué obra* es ese material) |
| D | Qty | sí |
| E | Unit | sí |
| F | Status | **nunca** — y siempre vale `'At Site'` |
| G | Last_Updated | **nunca** |

⚠️ **Propuesta 4.** El caso de C es distinto y lo separo abajo.

---

### 6. `WASTED_STOCK` — 5 columnas, de las que **se leen 4**

`Category`, `Name`, `Qty`, `Unit` se leen. `Last_Updated` no. ⚠️ **Propuesta 4.**

---

### 7. `CONFIG` — 17 columnas, y es la pestaña más rara del archivo

No es una tabla. Son **varias listas independientes puestas una al lado de
otra**, más tres ajustes de un solo valor metidos de contrabando entre las
listas. Una fila de CONFIG no significa nada; cada columna se lee por su cuenta.

| # | Col | Cabecera | Qué es | Veredicto |
|---|---|---|---|---|
| 0 | A | Projects | lista | Necesaria |
| 1 | B | Categories | lista | Necesaria |
| 2 | C | Suppliers | lista | Necesaria |
| 3 | D | Locations | lista | Necesaria |
| 4 | E | Location Type | pareja de D | Necesaria |
| 5 | F | User Email | **lista vieja de usuarios** | ⚠️ **Propuesta 5** |
| 6 | G | User Role | **lista vieja de usuarios** | ⚠️ **Propuesta 5** |
| 7 | H | Admin Email | **un solo valor** | ⚠️ **Propuesta 6** |
| 8 | I | Truck | lista | ⚠️ **Propuesta 7** |
| 9 | J | Truck Person | pareja de I | ⚠️ **Propuesta 7** |
| 10 | K | Truck Status | pareja de I | ⚠️ **Propuesta 7** |
| 11 | L | Min Stock Material | pareja con M | Necesaria |
| 12 | M | Min Stock Qty | pareja con L | Necesaria |
| 13 | N | Archive Cutoff Months | **un solo valor** | ⚠️ **Propuesta 6** |
| 14 | O | Cost Category | trío con P y Q | Necesaria |
| 15 | P | Cost Material | trío con O y Q | Necesaria |
| 16 | Q | Avg Cost | el promedio en curso | Necesaria |

**Lo que encontré aquí y no esperaba encontrar**, y es un fallo real aunque
pequeño: `Admin Email` (H) y `Archive Cutoff Months` (N) **sólo se leen de la
primera fila de datos**. El código dice literalmente `if (row[7] && i === 1)`.
Si alguien escribe el correo del administrador en la fila 5 de CONFIG porque las
de arriba estaban ocupadas, **la app lo ignora en silencio y no hay nada en
pantalla que lo diga.** Es exactamente el patrón que llevamos toda la semana
cazando: dos cosas que tienen que coincidir —el valor y *en qué fila está*— sin
que nada lo obligue.

---

### 8. `RESERVATIONS` — 9 columnas, y **la app no escribe ni una**

| # | Cabecera |
|---|---|
| A | ID |
| B | Category |
| C | Name |
| D | Project |
| E | Qty |
| F | Reserved By |
| G | Date |
| H | Status |
| I | Release Date |

Esta es la pestaña de tus imágenes 4 y 5 —la que está vacía y sin nombres de
columna. **Ahora sé por qué, y no es un fallo de pintado: es que la app no usa
esta hoja.**

Los endpoints que escribían aquí (`addReservation`, `cancelReservation`) se
borraron el 2026-09-20 porque **no tenían un solo llamador en la interfaz**: la
única forma de crear una reserva era escribir a mano en la hoja. Lo que la app
llama hoy "reservar" vive en `MATERIAL_LOCKS`, y la cantidad apartada **se
deriva** del stock de los estantes apartados en vez de guardarse —
`reservedQtyFromRacks_` — precisamente para que no pueda desincronizarse.

La hoja se dejó porque *si algún cliente escribió filas a mano ahí, siguen
siendo suyas*. En tu instalación está vacía. ⚠️ **Propuesta 8.**

---

### 9. `AUDIT_LOG` — 6 columnas

`Timestamp`, `Action`, `User`, `Details`, `Old Value`, `New Value`. Es la
pestaña de tu imagen 5.

Hay 56 sitios en el código que escriben aquí. Contados uno a uno:

- **19 dejan las dos últimas columnas vacías.**
- **17 llenan una sola** — así que no hay "antes y después", hay un dato.
- **20 llenan las dos**, y de ésas varias no son un antes y un después sino dos
  datos cualesquiera (`'set'` / `'verified against Google'`, por ejemplo).

O sea: las columnas valen y se usan, pero **su nombre sólo describe bien una
minoría de las filas.** ⚠️ **Propuesta 9**, y es de nombre, no de datos.

---

### 10. `ERROR_LOG` — 8 columnas

`Timestamp`, `Severity`, `User`, `Source`, `Action`, `Message`, `Context`,
`RequestId`. Las ocho se usan y ninguna se repite. `RequestId` es la que permite
atar varias líneas de error a una sola cosa que alguien intentó hacer.
**No tocar.**

---

### 11. `USERS_V3` — 7 columnas

`ID`, `Email`, `Name`, `Role`, `Added By`, `Added At`, `Active`.

Las siete se usan. `Active` es un `false` en vez de borrar la fila, a propósito:
borrarla perdería quién lo dio de alta y cuándo. **No tocar.** (La lista vieja
de CONFIG F/G es otra cosa — propuesta 5.)

---

### 12. `INCOMING_V3` — 17 columnas

`ID`, `Est. Date`, `Category`, `Name`, `Qty`, `Unit`, `Supplier`, `PO`, `Notes`,
`Status`, `Added By`, `Added At`, `PM`, `Doc Link`, `Date Mode`, `Est. Date End`,
`Date Note`.

Las 17 se leen en `getIncoming`. Las tres últimas son el trío de "fecha que no
sabemos todavía" (modo, fecha final del rango, nota) y no se repiten entre sí.
**No tocar.**

Lo que sí le falta, y lo apunto para la lista de pendientes y no para esta
auditoría: **esta hoja no tiene `Mat ID`**, así que un material renombrado deja
las entradas futuras apuntando al nombre viejo. Ya está anotado como
*"Incoming y Project View: estandarizar columnas"*.

---

### 13. `MATERIAL_LOCKS` — 12 columnas, con una repetición que ya cuesta código

`ID`, `MatId`, `Category`, `Name`, `Rack`, `AllowedDestinations`, `Reason`,
`LockedBy`, `LockedAt`, `Status`, `UnlockedBy`, `UnlockedAt`.

**`MatId` ES `Category` + `Name`.** Están los tres. Y esa repetición no es
teórica: cuando se renombra un material hay un bloque de código cuyo único
trabajo es **reescribir las tres columnas a la vez** en esta hoja. ⚠️
**Propuesta 10.**

El resto está bien. `UnlockedBy` / `UnlockedAt` en blanco mientras el candado
está activo es correcto: la columna existe para cuando deje de estarlo.

---

### 14. `MATERIAL_PACKS` — 7 columnas

`Category`, `Name`, `Pack`, `Units_Per_Pack`, `Last_Pack_Price`, `Updated_At`,
`Updated_By`. Las siete se usan. Aquí **no** hay `MatId` — se compone al leer,
con `packKey_`. Es lo contrario de `MATERIAL_LOCKS` y es la forma correcta.
**No tocar** (pero ver propuesta 10: lo coherente es que las dos hojas lo hagan
igual, y la que está bien es ésta).

---

### 15. `RACK_PHOTOS` — 4 columnas

`Location`, `PhotoURL`, `UploadedBy`, `UploadedAt`. Las cuatro se usan.
**No tocar.**

---

### 16. `PM_DIRECTORY` — 2 columnas

`Name`, `Email`. Las dos se usan. **No tocar.**

---

### 17-19. `👉 START HERE`, `📄 Terms`, `📄 Privacy Policy`

No son tablas y no tienen columnas que auditar. **No tocar.**

---

# LAS PROPUESTAS

Van ordenadas **de la más barata y segura a la más cara**. Cada una es
independiente: puedes decir sí a unas y no a otras.

---

## PROPUESTA 1 — `Status` (columna L del archivo): dejarla, sabiendo lo que es

**El hallazgo.** `Status` se calcula entera desde `MoveType`:

```
EXIT   → "Dispatched"      WASTE  → "Damaged"
ADJUST → "Adjusted"        resto  → "In Stock"
```

Es una función pura de una línea. Nada que la persona teclee entra en esa
columna nunca.

**Pero no es el caso de libro que parece.** `parseArchiveRow` lee `Status`
**para recuperar el tipo de movimiento en las filas viejas** que se guardaron
antes de que existiera la columna `MoveType`. En esas filas, `Status` es lo
único que dice si aquello fue una entrada o una salida. Y hay además una
reparación (`statusCol`) cuyo trabajo es volver a poner `Status` de acuerdo con
`MoveType` si alguien las desalineó a mano.

| A favor de quitarla | En contra |
|---|---|
| Una columna menos que explicar | **En tus filas más antiguas es el único registro del tipo de movimiento** |
| Un dato menos que pueda contradecir a otro | Hay código que ya la mantiene de acuerdo: la repetición está vigilada, no suelta |
| | Es la columna que la gente lee en el Sheet; "Dispatched" se entiende, "EXIT" menos |

**Mi recomendación: DEJARLA.** Y es el único sitio de toda esta auditoría donde
recomiendo quedarse con una repetición. La razón es la de siempre en este
archivo: una repetición **con alguien que la vigila** no es el fallo que
llevamos cazando; el fallo es la repetición que nadie obliga a coincidir. Aquí
hay una reparación escrita *y llamada*. Quitarla me haría escribir una migración
que toca cada fila de tu historial a cambio de una columna.

---

## PROPUESTA 2 — `Mat ID` (columna O del archivo): dejarla, por una razón distinta

**El hallazgo.** El código dice, literalmente, *"ALWAYS recompute the grouping
key from category+name — never trust the stored MatID column"*, y cada
reconstrucción de existencias **corrige en la hoja** las que no cuadran. O sea:
es una columna guardada que la app no se cree y repara sola.

| A favor de quitarla | En contra |
|---|---|
| La app ya no la usa para calcular nada | Es lo único que, abriendo el Sheet, dice *"estas dos filas son el mismo material"* a pesar de las mayúsculas y los espacios |
| Un dato menos que pueda estar mal | La auto-reparación hace que estar mal ya no tenga consecuencias |
| | Migración sobre todo el historial a cambio de una columna |

**Mi recomendación: DEJARLA.** Fue una fuente de fallos de verdad mientras se
creía; ahora que no se cree es inofensiva y sigue sirviéndole a una persona que
mire la hoja.

---

## PROPUESTA 3 — `Total Cost` (columna V del archivo): dejarla, y es la que menos me gusta dejar

**El hallazgo.** `totalCost = round2_(unitCost * qty)`, siempre, sin excepción.
Dos columnas de la misma fila multiplicadas. Es la repetición más pura de todo
el archivo.

| A favor de quitarla | En contra |
|---|---|
| Es aritmética guardada: no puede aportar nada que no esté en U y F | **Es la columna que alguien de contabilidad suma.** Quitarla convierte "selecciona la columna V" en "escribe una fórmula" |
| Si U o F se corrigen a mano, V se queda mintiendo y nada la repara (a diferencia de L y O) | La exportación y el informe por correo la usan |

**Mi recomendación: DEJARLA, pero arreglarle lo de arriba.** El problema de
verdad no es que esté repetida: es que **es la única de las tres repeticiones
que nadie vigila.** `Status` tiene su reparación y `Mat ID` tiene la suya; si tú
corriges a mano un `Unit Cost` en el Sheet, `Total Cost` se queda con el número
viejo para siempre y ningún sitio de la app lo nota.

Lo que propongo no es quitar la columna, es **meter `Total Cost` en la pasada de
auto-reparación que ya existe**: la misma que arregla `Mat ID` y `Status` en cada
reconstrucción. Son unas pocas líneas, no es migración, no toca los datos
buenos, y cierra el agujero sin pedirte renunciar a la columna que suma
contabilidad.

**Esto sí te lo recomiendo hacer.** Es la única parte de esta auditoría que
arregla un fallo en vez de limpiar.

---

## PROPUESTA 4 — Las columnas muertas de las tres hojas calculadas

**El hallazgo.** Cuatro columnas se escriben en cada reconstrucción y **no las
lee nadie, nunca**:

| Hoja | Columna | Qué contiene |
|---|---|---|
| `LIVE_STOCK` | G `Location_Type` | el texto `RACK`, idéntico en todas las filas |
| `LIVE_STOCK` | H `Last_Updated` | la misma hora repetida en todas las filas |
| `SITE_STOCK` | F `Status` | el texto `At Site`, idéntico en todas las filas |
| `SITE_STOCK` | G `Last_Updated` | la misma hora repetida |
| `WASTED_STOCK` | E `Last_Updated` | la misma hora repetida |

Las dos primeras no son ni siquiera datos: son constantes escritas una vez por
fila. Y `Last_Updated` es un valor **de la hoja** escrito en cada **fila** de la
hoja: si tienes 400 materiales, es la misma hora 400 veces.

**Y esto es lo más barato de todo el documento**, porque estas tres hojas son de
la familia *calculada*: se borran y se reescriben enteras en cada guardado. **No
hay ningún dato que migrar ni que perder.** Se cambia el código que las escribe
y en el siguiente movimiento las hojas ya salen con la forma nueva.

| A favor | En contra |
|---|---|
| Cinco columnas menos en las tres hojas que más se leen | Si algún día quisiéramos tipos de ubicación distintos de `RACK`, habría que volver a añadir `Location_Type` |
| Menos celdas que escribir en cada guardado — estas hojas se reescriben enteras cada vez | Si tienes una fórmula, un filtro o un Looker Studio apuntando a `LIVE_STOCK` **por letra de columna**, se desplaza |
| `Last_Updated` puede ir **una vez**, en la nota de A1, donde además se lee mejor | |

**Mi recomendación: HACERLO, con una pregunta antes.** La pregunta es la del
"en contra" de la derecha: **¿tienes algo fuera de la app leyendo `LIVE_STOCK` o
`SITE_STOCK`?** Una fórmula en otra pestaña, un Looker Studio, un Excel que
importe. Si la respuesta es no, esto es gratis. Si es sí, dime qué es y lo hago
dejando las columnas en su sitio y vaciándolas, que desplaza nada.

**`SITE_STOCK` columna C (`Project`) es un caso aparte y NO la quitaría.** La
app no la lee hoy, es verdad. Pero es lo único que dice **de qué obra** es el
material que está en obra, y una hoja que diga "hay 40 ventanas en obras" sin
decir en cuál es peor que inútil. Esa columna no está muerta: está **esperando
una pantalla que todavía no hicimos** — y eso ya está en la lista como *"Project
View: estandarizar columnas"*. Quitarla sería tirar el dato justo antes de
necesitarlo.

---

## PROPUESTA 5 — `CONFIG` F y G: la lista vieja de usuarios

**El hallazgo.** `User Email` y `User Role` son la lista de usuarios **anterior**
a que existiera `USERS_V3`. En la v12.45 se convirtió en una **puerta de un solo
sentido**: se lee para que nadie que llegó por ahí se quede fuera, pero la app ya
no escribe nunca, y quien aparece ahí se migra a `USERS_V3` en cuanto entra.

| A favor de quitarlas | En contra |
|---|---|
| Dos columnas que ya no son la verdad de nada | **Si queda alguien que sólo está ahí y aún no ha entrado, le quitas el acceso sin avisar** |
| Un sitio menos desde el que se puede dar acceso | Es el camino de vuelta si `USERS_V3` se corrompe |

**Mi recomendación: NO quitarlas todavía — y hay una forma de que se quiten
solas, que es mejor.** La app ya migra a quien llega por ahí. Cuando CONFIG F
esté vacía de correos que no estén ya en `USERS_V3`, las columnas se habrán
quedado sin trabajo por sí mismas, y entonces quitarlas no le puede costar el
acceso a nadie.

Lo que sí puedo hacer ya, y es la mitad útil: **que *Check installation* te diga
cuántos correos quedan ahí sin migrar.** Hoy no lo dice, así que no hay forma de
saber si esas dos columnas siguen haciendo algo o ya no. Sin ese número, la
decisión de quitarlas es a ciegas.

---

## PROPUESTA 6 — `CONFIG` H y N: dos ajustes que sólo se leen de la fila 2

**El hallazgo, y es un fallo.** `Admin Email` y `Archive Cutoff Months` son
valores únicos, no listas. El código los lee **sólo de la primera fila de
datos** (`i === 1`). Escribir el correo del administrador en la fila 5 de CONFIG
no da ningún error: **la app simplemente no lo ve, y nada en pantalla lo dice.**

Es el mismo patrón del fallo del informe diario y del de las dos listas de
usuarios: **dos cosas que tienen que coincidir —el valor y en qué fila está— sin
que nada lo obligue.**

Tres caminos:

**(a) Dejarlo como está.** Nadie se ha quemado todavía.

**(b) Que la app avise.** Si hay algo escrito en H o N **por debajo** de la
fila 2, *Check installation* lo dice con el número de fila. Barato, no toca
datos, y convierte un silencio en una frase.

**(c) Sacarlos de CONFIG a Script Properties**, donde ya viven los otros ajustes
de un solo valor (el nombre de la empresa, el logo, la carpeta). Es donde
deberían haber estado.

| | A favor | En contra |
|---|---|---|
| **(a)** | nada que hacer | el silencio sigue ahí |
| **(b)** | barato, seguro, sin migración | la rareza se queda, sólo que ya no es invisible |
| **(c)** | el ajuste deja de poder estar en el sitio equivocado | migración; y un ajuste en Script Properties **tú no lo puedes ver ni cambiar desde el Sheet**, sólo desde la app |

**Mi recomendación: (b) ahora, y (c) sólo si algún día movemos todos los ajustes
a la vez.** El motivo del "en contra" de (c) pesa mucho más de lo que parece:
toda la dirección de la app es *reducir al máximo la necesidad de ir al Sheet*,
pero **el día que la app no arranque, el Sheet es lo único que queda**, y un
`Admin Email` que sólo se puede leer desde la app no sirve de nada ese día.
Mientras sea un valor que puede salvarte, que viva donde puedas verlo — con un
aviso si está en la fila equivocada.

---

## PROPUESTA 7 — `CONFIG` I, J, K: los camiones

**El hallazgo.** `Truck`, `Truck Person`, `Truck Status` se leen (`loadConfig` los
carga), hay un `updateTruck_` que los escribe, y la interfaz pinta un desplegable
con los camiones activos. **Funciona.** Lo que no sé es si **lo usas**.

| A favor de quitarlas | En contra |
|---|---|
| Tres columnas y una pantalla menos que mantener | Si lo usas, le quitas una función a alguien |
| Si no se usa, es una pantalla que puede fallar y nadie lo notaría | El camión se puede apuntar en Comments, pero entonces no se puede filtrar por él |

**Mi recomendación: me lo dices tú.** Esto no lo puedo decidir leyendo código:
el código sólo me dice que la función existe, no si alguien la toca. **¿Usas el
desplegable de camiones al despachar, o apuntas el camión en los comentarios?**
Si no lo usas, quitarlo es de la familia barata (CONFIG no se migra: se dejan las
columnas y se deja de leerlas). Si lo usas, no se toca.

---

## PROPUESTA 8 — La pestaña `RESERVATIONS`: vacía y sin trabajo

**El hallazgo.** 9 columnas, y **la app no escribe ni lee ninguna.** Lo que hoy
se llama "reservar" vive en `MATERIAL_LOCKS`, y la cantidad apartada se deriva
del stock en vez de guardarse. En tu instalación la hoja está vacía: es la de tu
imagen 4.

Tres caminos:

**(a) Borrar la pestaña.** Una pestaña menos.

**(b) Dejarla y ponerle los nombres de columna** (hoy están en blanco, que es lo
que viste). Se queda vacía pero deja de parecer rota.

**(c) Dejarla y ponerle una nota en A1** que diga qué es: *"Reservations are kept
in MATERIAL_LOCKS. This sheet is from an earlier version and is not used."*

| | A favor | En contra |
|---|---|---|
| **(a)** | se acaba la duda | **borra datos de quien sí escribió a mano ahí** — en tu copia no hay, en la de un cliente no lo sé; y una pestaña borrada no vuelve |
| **(b)** | deja de parecer rota | sigue siendo una pestaña vacía que invita a escribir en ella, y lo que se escriba no lo lee nadie |
| **(c)** | nadie escribe ahí por error, nadie pierde nada | la pestaña sigue en la lista |

**Mi recomendación: (c).** Y la razón de descartar (a) no es tu copia, es la de
los demás: borrar una pestaña por nombre en cada instalación es exactamente la
clase de operación que, el día que un cliente sí tenía filas ahí, no tiene
vuelta atrás. (b) es lo peor de los dos mundos: una hoja con aspecto de que
funciona que no funciona — justo el tipo de cosa que llevamos toda la semana
arreglando. (c) cuesta una línea, no destruye nada y contesta la pregunta en el
sitio donde se hace.

Esto además explica tu imagen 4 y cierra la pregunta: **no hay nada que
arreglar en esa ventana, hay algo que explicar en esa pestaña.**

---

## PROPUESTA 9 — `AUDIT_LOG` E y F: el nombre miente la mitad de las veces

**El hallazgo.** `Old Value` y `New Value`: de 56 sitios que escriben en
`AUDIT_LOG`, 31 ponen algo ahí y 25 ponen vacío — y de los 31, varios no escriben
un "antes y un después" sino dos datos cualesquiera.

| A favor de renombrarlas | En contra |
|---|---|
| El nombre deja de mentir en la mitad de las filas | Es una cabecera que alguien puede tener en un filtro |
| | Renombrar no arregla ningún dato |

**Mi recomendación: renombrarlas a `Detail 2` y `Detail 3`**, que es lo que son.
Es un cambio de dos celdas, no toca ninguna fila, y no se repite ningún dato —
el problema aquí nunca fue repetición, era el nombre. Lo meto con la tanda de
formato, que es cuando se van a tocar las cabeceras de todas formas.

---

## PROPUESTA 10 — `MATERIAL_LOCKS`: `MatId` + `Category` + `Name`, los tres

**El hallazgo.** `MatId` **es** `Category` + `Name`. Están los tres en la hoja. Y
ya cuesta código: al renombrar un material, hay un bloque cuyo único trabajo es
reescribir **las tres columnas a la vez** en esta hoja. Si alguna vez una se
reescribe y otra no, el candado queda apuntando a dos materiales distintos a la
vez.

`MATERIAL_PACKS` tiene el mismo problema y lo resolvió al contrario: guarda sólo
`Category` y `Name`, y compone la clave al leer (`packKey_`). **Esa es la forma
correcta**, y está en el mismo archivo.

| A favor de quitar `MatId` de esta hoja | En contra |
|---|---|
| Una columna que no puede contradecir a las otras dos, porque ya no existe | `MATERIAL_LOCKS` es de la familia *calculada* en el color de pestaña, **pero no se reconstruye**: estos datos son únicos y hay que migrarlos de verdad |
| El bloque de renombrado pasa de tocar tres columnas a tocar dos | Si la migración se interrumpe a medias, **quedan candados que no se pueden hacer cumplir** — y un candado que no se cumple deja salir material apartado |
| Las dos hojas de materiales funcionarían igual | |

**Mi recomendación: HACERLO, pero no ahora y no solo.** El "en contra" de la
derecha es serio: un candado a medio migrar no da un error, **deja salir material
que alguien apartó**, y eso no se nota hasta que falta. Esto tiene que ir con una
prueba que ponga tres candados, migre, y compruebe que los tres siguen
cumpliéndose — y con la migración envuelta de forma que, si se corta, se queda
como estaba y no a medias.

Y hay algo más barato que hace la mitad del trabajo y lo haría primero: **que
`getActiveLocksMap_` deje de leer la columna `MatId` y la componga de `Category`
y `Name`**, como hace `packKey_`. A partir de ese momento la columna existe pero
**ya no decide nada**, así que el día que haya que quitarla ya no puede romper un
candado. Es el mismo camino que siguió `Mat ID` en el archivo, y funcionó.

---

# RESUMEN PARA DECIDIR

| # | Qué | Coste | Riesgo | Mi recomendación |
|---|---|---|---|---|
| 1 | `Status` del archivo | migración grande | alto | **Dejar** |
| 2 | `Mat ID` del archivo | migración grande | medio | **Dejar** |
| 3 | `Total Cost` → meterla en la auto-reparación | pequeño | ninguno | **✅ HACER** |
| 4 | 5 columnas muertas de las hojas calculadas | pequeño | ninguno* | **✅ HACER** (*salvo que algo externo las lea) |
| 5 | `CONFIG` F/G lista vieja de usuarios | — | alto si se quita ya | **Esperar**; y mostrar cuántos quedan |
| 6 | `CONFIG` H/N sólo se leen de la fila 2 | pequeño | ninguno | **✅ HACER (b): que avise** |
| 7 | `CONFIG` I/J/K camiones | pequeño | — | **Decides tú: ¿los usas?** |
| 8 | pestaña `RESERVATIONS` | una línea | ninguno | **✅ HACER (c): nota en A1** |
| 9 | `AUDIT_LOG` E/F renombrar | dos celdas | ninguno | **✅ HACER** con la tanda de formato |
| 10 | `MATERIAL_LOCKS` sobra `MatId` | migración | **alto** | **Primero dejar de leerla**, quitarla después |

**Lo que necesito de ti, y es todo:**

1. **¿Algo fuera de la app lee `LIVE_STOCK` o `SITE_STOCK`?** (una fórmula en
   otra pestaña, un Looker Studio, un Excel) — decide la propuesta 4.
2. **¿Usas el desplegable de camiones al despachar?** — decide la propuesta 7.

Con eso puedo hacer la 3, la 4, la 6, la 8 y la 9 de una vez, que son las cinco
que no tienen riesgo. Las otras cinco quedan apuntadas con su orden y su motivo.

---

## LO QUE ESTA AUDITORÍA ENCONTRÓ Y NO ERA UNA COLUMNA

Dos cosas que salieron de mirar las columnas y no son columnas, para que no se
pierdan:

1. **`INCOMING_V3` no tiene `Mat ID`.** Un material renombrado deja las entradas
   futuras apuntando al nombre viejo. Ya estaba en la lista como *"Incoming y
   Project View: estandarizar columnas"*; ahora sé exactamente qué columna
   falta.

2. **El formato de las pestañas ya existe a medias.** `aplicarFormatoEstandar_`
   ya pone color de pestaña, cabecera, nota en A1, protección en modo aviso y
   anchos de columna. Lo que **no** hace es lo que pediste en tu mensaje: la
   cabecera es del mismo azul oscuro en todas las pestañas, el color de pestaña
   es **por familia** (cuatro colores, no uno por pestaña), y **no hay filas
   intercaladas en absoluto**. El mockup que te mandé aparte (`landing/
   mockup-formato-hojas.html`) es sobre esa diferencia, no sobre empezar de cero.
