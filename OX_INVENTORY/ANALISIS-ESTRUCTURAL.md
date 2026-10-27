# Análisis estructural de Acopio — la otra mitad del encargo

Pedido por Jose el 26/10, junto con el de seguridad: *"¿puedes correr un
análisis completo de seguridad de Acopio Pro y también un análisis
estructural?"*

**Qué es esto y qué no.** El de seguridad preguntaba *¿por dónde entra alguien?*
Éste pregunta otra cosa: **¿por dónde se rompe esto solo, con el tiempo, sin que
nadie ataque nada?** Es la salud del edificio, no la cerradura.

Todo lo que hay aquí está **medido sobre los archivos de hoy**, no estimado.

---

## LAS MEDIDAS, PRIMERO

| | Líneas | Funciones |
|---|---|---|
| `Code_v3_fixed.gs` | 17.004 | 339 |
| `Index_v3_fixed.html` | 31.488 | 873 |
| `SetupWizard.html` | 612 | — |
| **Total** | **49.104** | **1.212** |

El `Index` pesa **1,6 MB**: **77 % JavaScript**, 18 % CSS, 6 % marcado. O sea,
no es una página con código: **es un programa que vive dentro de una página**.

**Y una cosa que conviene decir antes de las pegas**, porque es rara y es buena:
el `.gs` lleva **un índice de 60 entradas** al principio, y **hay una prueba que
comprueba que el índice y las secciones no se separen** (`test-indice`). Un
archivo de 17.000 líneas con un índice que no puede mentir no es lo normal.

---

## RESUMEN

| | Qué | Gravedad |
|---|---|---|
| ✅ | **La columna vertebral es correcta**: una sola dirección de la verdad | — |
| ✅ | Ningún nombre de función se repite entre los dos archivos, ni se pisa dentro de uno | — |
| 🟠 | **El número de versión está escrito dos veces y nada ata los dos** | media |
| 🟠 | Seis funciones pasan de 300 líneas, y la mayor tiene **655** | media |
| 🟡 | 873 funciones en **un solo ámbito global**. Hoy está limpio; nada lo obliga | baja |
| 🟡 | Las pruebas tienen forma de **historia**, no de sistema | baja |

---

## 1 · ✅ LA COLUMNA VERTEBRAL ES CORRECTA, Y ES LO QUE HAY QUE DEFENDER

Antes de las pegas, lo que está bien, porque es lo que hace barato todo lo demás:

> **El stock no se escribe nunca. Se deriva.**

Cada entrada, salida, traspaso, merma y ajuste es **una fila que sólo se añade**.
Las pantallas de existencias se **reconstruyen** de ahí (`refreshDerivedSheets_`),
y **no hay una sola fórmula en el archivo** — lo comprobé: cero `setFormula`.

**Por qué esto es la propiedad más valiosa del sistema, dicho sin adornos:**

- **Una pregunta nueva no necesita datos nuevos.** «¿Cuánto consumió este
  proyecto?» ya está en el registro; sólo falta leerlo de otra manera.
- **Un error se arregla reconstruyendo**, no persiguiendo celdas. Es por lo que
  el incidente del archivado de septiembre se pudo deshacer.
- **Y es la respuesta honesta a «¿y si hay que salir de Sheets?»**: lo que se
  migra es el registro, y lo de arriba se vuelve a construir. **Es un cambio de
  almacenamiento, no un rediseño.**

**Esto no es un hallazgo: es lo que no hay que perder.** Y se pierde de una
forma concreta y tentadora: el día que alguien guarde un total en una celda
«para que vaya más rápido». Ahí se acaba, y no se nota hasta meses después.

---

## 2 · 🟠 E-01 · El número de versión está escrito dos veces y **nada ata los dos**

**Medido:**

```
Code_v3_fixed.gs:131     var APP_VERSION = '13.0';
Index_v3_fixed.html:5856 var APP_VERSION = '13.0';
```

**Y busqué quién los compara. Nadie lo hace:**

- `check-publicado.js` lee **sólo** el del `.gs` (línea 61-62).
- `test-pegar.js` compara **cada archivo con su propia salida** de compilación
  —`src` contra `out`, archivo por archivo— **no un archivo contra el otro**.
- Los otros veinte sitios que mencionan `APP_VERSION` lo usan, no lo cotejan.

**Qué pasa si se separan.** El cliente ve en pantalla el número del `Index`; el
registro de cambios, el sello de compilación y la comprobación de publicación
usan el del `.gs`. Así que una instalación puede decir **13.0** mientras nosotros
creemos que tiene **13.1**, y la conversación de soporte empieza con los dos
mirando números distintos.

**Por qué es MEDIA y no baja:** es *dos cosas que tienen que coincidir sin que
nada lo obligue*, en **el dato con el que se diagnostica todo lo demás**. El día
que un cliente diga «tengo la 13.0» y no sea verdad, cada conclusión que saquemos
después parte de un dato falso.

**Tamaño del arreglo: tres líneas en una prueba que ya existe.** Leer los dos y
exigir que sean iguales.

---

## 3 · 🟠 E-02 · Seis funciones pasan de 300 líneas. La mayor tiene 655

| Función | Líneas |
|---|---|
| `addMovementsBatch_` | **655** |
| `archiveOldMovements` | 465 |
| `onEdit` | 424 |
| `processMovementInner_` | 341 |
| `refreshDerivedSheets_` | 340 |
| `getInitialData` | 339 |

**Y conviene decir por qué esto importa aquí, porque «funciones largas» suena a
manía de programador.** Mira la lista de incidentes de este proyecto: el
archivado que perdió filas, el guardia de la papelera que culpaba al almacén, el
`Number('1,250')` que tiraba la fila más grande de cada Excel, la fusión que
vuelve sola. **Casi todos vivían dentro de una de estas seis.**

La razón es mecánica, no estética: **una función de 655 líneas no se puede leer
entera antes de tocarla.** Así que se cambia mirando las veinte líneas de
alrededor — y en una función así, **el contexto local miente**: la variable que
parece local se puso 300 líneas antes, el `return` temprano que parece imposible
ocurre en una rama que no estás viendo.

**Lo que NO haría: partirlas.** Un refactor de `addMovementsBatch_` es tocar el
camino por el que entra cada movimiento del sistema, para ganar elegancia. **El
riesgo es real y el beneficio es estético.**

**Lo que sí haría, y es una regla, no una tarea:** *nada nuevo entra dentro de
esas seis*. Lo que haga falta se escribe en una función con nombre y se la llama
desde ahí. Así no crecen, y cada cosa nueva nace comprobable por separado —
exactamente lo que se hizo con `numeroDeFichero_` y con `adjustDirection_`, que
son dos aciertos recientes de esta misma forma.

---

## 4 · 🟡 E-03 · 873 funciones en un solo ámbito global. Hoy está limpio, y nada lo obliga

El `Index` es un archivo con todo dentro, a propósito —*un archivo, sin
librerías*, que es una decisión tomada y buena—. El efecto secundario es que
**las 873 funciones comparten un único espacio de nombres**, y en JavaScript la
segunda declaración de un nombre **gana en silencio**.

**Lo comprobé, y la noticia es buena:**

- **Ningún nombre de función se repite entre los dos archivos.**
- Dentro del `Index`, los únicos nombres repetidos (`draw`, `attempt`) están
  **anidados dentro de otras funciones**, cada uno en su ámbito. No se pisan.

**Entonces, ¿por qué lo anoto?** Porque esa limpieza **no la sostiene nada**. Es
el mismo patrón que la app ya sufrió en el `data-i18n` de la landing, donde dos
elementos con la misma clave hicieron que el primero borrara al segundo **y la
colisión no se veía en ninguna parte**. Aquí sería peor: dos `function
_guardarAjustes()` a 9.000 líneas de distancia no dan error, no dan aviso, y la
app simplemente hace lo que dice la segunda.

**El arreglo es una prueba de diez líneas** —contar nombres de función de primer
nivel y exigir que no se repita ninguno—, y vale para siempre.

---

## 5 · 🟡 E-04 · Las pruebas tienen forma de historia, no de sistema

**180 archivos de prueba.** Mirando sus nombres se lee la biografía del
proyecto: `fusionar-y-ver-errores`, `mes-del-changelog`, `revocar-acceso`,
`papelera-ciclo`, `ubicacion-que-no-existe`.

**Eso es una virtud y hay que decirlo primero:** cada una nació de algo que pasó
de verdad, y **ninguno de esos fallos puede volver**. Es lo contrario de la
cobertura de adorno.

**La pega es la otra cara de lo mismo:** la cobertura sigue **lo que se rompió**,
no **lo que importa**. Consecuencia concreta y comprobable: **lo más nuevo es lo
menos cubierto**, y lo más nuevo es justo lo que acepta ficheros de fuera. El
importador de CSV, abierto en la edición gratis hace tres días, tiene **dos**
pruebas que lo mencionan de 180.

**Lo que yo haría, y no es escribir cien pruebas:** cuando algo **nuevo** toca
datos que vienen de fuera —un fichero, un correo, una pegada—, que nazca con su
prueba el mismo día, aunque no se haya roto nunca. Para lo viejo y estable, la
cobertura por incidentes es la correcta y es más barata.

---

## 6 · EL CENSO QUE DE VERDAD IMPORTA: QUÉ TIENE QUE COINCIDIR, Y QUÉ LO VIGILA

Éste es el corazón del análisis estructural, porque **es el fallo que este
proyecto repite**: dos sitios que tienen que decir lo mismo, sin que nada los
obligue.

| Lo que tiene que coincidir | ¿Quién lo vigila? |
|---|---|
| Claves `data-i18n` de la landing, sin repetirse | ✅ `test-landing-i18n` |
| Ediciones de la landing ↔ candados de la app | ✅ `test-ediciones-coinciden` |
| Las dos copias del texto legal | ✅ `test-legal-sync` |
| Mes del registro de cambios ↔ lo publicado | ✅ `test-mes-del-changelog` |
| Índice del `.gs` ↔ sus secciones | ✅ `test-indice` |
| Los 107 endpoints ↔ sus guardias | ✅ `test-endpoint-auth` |
| Lo que promete la privacidad ↔ lo que manda el correo de aviso | ✅ `test-checkin` |
| Columnas del archivo ↔ lo que lee el código | ✅ `test-columnas`, `test-mov-columns` |
| **`APP_VERSION` del `.gs` ↔ la del `Index`** | ❌ **nadie** (E-01) |
| **Secretos nuevos ↔ `SNAPSHOT_EXCLUDE`** | ❌ **nadie** (H-10) |
| **Nombres de función de primer nivel, sin repetirse** | ❌ **nadie** (E-03) |

**Ocho vigilados, tres sin vigilar.** Y los tres sin vigilar comparten una cosa:
**ninguno falla haciendo ruido.** El número de versión se separa en silencio, el
secreto se copia en silencio, la función se pisa en silencio. **Esa es la forma
exacta del problema que persigue este proyecto desde hace un año**, y la lista de
arriba es, por fin, la lista entera.

---

## 7 · LO QUE NO ES UN PROBLEMA, Y CONVIENE DEJAR ESCRITO

Para que nadie «arregle» dentro de un año algo que está bien así:

- **Un archivo por lado, sin librerías.** Es la decisión que hace que el
  producto se instale pegando dos cosas, y que no dependa de que un CDN siga
  vivo. El coste —archivos grandes— está pagado a propósito.
- **Algo de código repetido entre servidor y cliente** (`_he` y
  `escapeHtmlSrv_` hacen lo mismo en sitios distintos). **No se puede compartir**:
  son dos entornos que no se ven. Repetirlo es lo correcto; lo que haría falta
  es que una prueba exija que los dos escapen lo mismo.
- **Comentarios largos en castellano dentro del código.** Son el único sitio
  donde está escrito *por qué* algo es como es, y **el compilador los quita
  antes de entregar** (`build-paste.js` recorta un 35 % o más). No cuestan nada
  al cliente y valen mucho dentro de un año.

---

## LO QUE PROPONGO HACER, Y EN QUÉ ORDEN

Las tres primeras son pruebas, no cambios de comportamiento: **no pueden romper
nada**, y cierran las tres filas rojas del censo.

| | Qué | Tamaño |
|---|---|---|
| **1** | Prueba: las dos `APP_VERSION` son iguales | 3 líneas |
| **2** | Prueba: ningún nombre de función de primer nivel se repite | 10 líneas |
| **3** | Prueba: `_he` y `escapeHtmlSrv_` escapan exactamente lo mismo | 10 líneas |
| **4** | Patrón de nombres en `SNAPSHOT_EXCLUDE` (H-10) | 2 líneas |
| **5** | La regla de las seis funciones largas — **no es código, es una línea en `CLAUDE.md`** | — |

**Nada de esto está hecho.** Esto es el análisis; la decisión es de Jose.
