# Capturas para la landing — lista exacta

Pedido por Jose el 2026-09-22: *"dame la lista de las capturas que necesitas
para publicarlas en la landing: exactamente qué, qué nomás debe verse, y si
quieres gif, video o imagen; también especifica cuánto tiempo deben durar el
video y el gif y qué se debe ver."*

Esto es esa lista. Está ordenada por **lo que más falta hace primero**: si sólo
se hacen las dos primeras, la página ya funciona.

---

## ⛔ ANTES DE GRABAR NADA — LEE ESTO

**Ninguna captura puede salir del almacén real de OX con los datos reales.**

La regla que fijó Jose —*"hay que separarlos y no publicar nada que tenga
información importante de Acopio o mía"*— se aplica aquí de lleno, y no es
teórica. En las capturas que él mismo mandó esta semana se leen, sin esforzarse:

| Qué se ve | Ejemplos reales que aparecen en pantalla |
|---|---|
| **Clientes y obras de OX** | `KOTTER RESIDENCE`, `LIBERTY WELLS TOWNHOMES`, `MAPLETON HEIGHTS`, `HIGHLAND ROW TOWNHOMES` |
| **Proveedores de OX** | `AMSCO`, `ALSIDE`, `MILGARD`, `HARTUNG` |
| **Empleados por su nombre** | `ALVIN JENSON`, `ADAM ALLRED`, `TERRY THOR`, `EVELYN A QUINONEZ` |
| **Correo personal de Jose** | `joseisrael5101@gmail.com`, en cada fila de la columna User |
| **Números de PO** | `16598`, `07-6329`, `2444540` |

Una landing la lee la competencia. **Publicar esto es regalar la lista de
clientes y de proveedores de OX Glass**, y de paso poner los nombres de sus
empleados en internet sin que ellos lo hayan decidido.

**Cómo evitarlo, y es una vez sola:** hacer **una copia de la app para demos**,
vaciarla con *Advanced → Erase everything* (existe desde la v9.30) y cargarle
datos inventados pero verosímiles — nombres de obra tipo `MAPLE STREET REMODEL`,
proveedores tipo `NORTHGATE SUPPLY`, correos tipo `sam@northgate-glass.com`.

Cuesta una tarde y **sirve para siempre**: todas las capturas futuras,
las demos en vivo, y las respuestas en Reddit salen de ahí. Difuminar a mano
cada captura cuesta más y **siempre se escapa algo** — un tooltip, un nombre a
medio tapar, un reflejo en la barra del navegador.

> Esto **no** es inventar nada en el sentido prohibido. Lo que no se puede
> inventar son testimonios, números de clientes o funciones que no existen.
> Datos de ejemplo en una captura de producto son lo normal y son honestos,
> siempre que no se presenten como "nuestros clientes".

**Y tres cosas más antes de darle a grabar:**

1. **Ventana a 1600×900 o 1920×1080**, siempre la misma. Si cada captura tiene
   otra proporción, la página se ve desordenada por mucho que el contenido sea
   bueno.
2. **Navegador limpio**: sin barra de marcadores, sin pestañas de más, sin
   extensiones a la vista. En pantalla completa es lo más fácil.
3. **Modo claro.** La app tiene los dos, pero la landing es clara; mezclarlos
   hace que las capturas parezcan de dos productos.

---

## 1. EL VÍDEO PRINCIPAL — 60 a 90 segundos ⭐ lo más importante

**Formato:** MP4 (H.264), 1600×900 o 1920×1080, **sin sonido**.
**Dónde va:** ya tiene su hueco reservado en la landing (`acopio.html`, sección
*"Ninety seconds, no signup"*). Hay que entregar dos archivos:
`demo.mp4` y `demo-poster.jpg` (la imagen fija que se ve antes de darle al play
— que sea el Warehouse Map, que es lo que engancha).

**Sin narración.** Rótulos de texto cortos sobre el vídeo. La mitad de la gente
lo va a ver sin sonido, y los rótulos además evitan tener que grabar la voz
tres veces hasta que salga bien.

### Guion, con tiempos

| Tiempo | Qué se ve | Rótulo en pantalla |
|---|---|---|
| **0:00–0:08** | Llega el Stock Dashboard ya cargado. Nada de clics todavía — que se vean las tarjetas de arriba y la tabla llena. | *"Everything in the warehouse, on one screen."* |
| **0:08–0:28** | **Una entrada.** Clic en `+ Entry (IN)`, se rellena material, cantidad, estante, **y se adjunta una foto**. Guardar. Que se vea el aviso de guardado. | *"Record a delivery — with the photo."* |
| **0:28–0:48** | **Una salida.** Clic en `− Exit (OUT)`, elegir material, cantidad, **y asignarla a una obra**. Guardar. Que se vea la fila nueva aparecer arriba en Movements. | *"Send material to a job. It stops being available the moment you save."* |
| **0:48–1:10** | **Warehouse Map.** Abrir la pestaña, **abrir un estante**, que se vea lo que tiene dentro. Si el estante tiene foto, que se vea. | *"Every rack, and what is in it."* |
| **1:10–1:25** | **El historial de un material.** Abrirlo y que se vea la lista de entradas y salidas con fecha y con quién. | *"Every movement, with who and when. Nothing is overwritten."* |
| **1:25–1:30** | Vuelta al dashboard. Quieto 2 segundos. | *"Acopio — acopio.net"* |

**Las cuatro reglas que hacen que un vídeo así se vea profesional:**

- **El ratón se mueve despacio y recto.** Los saltos y los círculos con el
  cursor son lo que más delata un vídeo casero.
- **Pausa de un segundo después de cada clic**, antes del siguiente. Da tiempo
  a leer.
- **No enseñar nada que tarde.** Si algo carga tres segundos, se corta ese
  trozo. Nadie está midiendo la velocidad, pero todo el mundo la siente.
- **Ni un error, ni un aviso rojo, ni un campo mal escrito.** Grabarlo las veces
  que haga falta.

---

## 2. ✅ HECHA (2026-10-06) — LA IMAGEN PARA COMPARTIR (Open Graph)

**Ya no hace falta que la hagas tú.** La dibuja `tools/build-og-image.js` con el
navegador y las fuentes de la marca, en los 1200×630 exactos, y hay **dos**: una
en inglés (`/og.jpg`, para `acopio.net`) y otra en español (`/og-es.jpg`, para
`acopio.net/es/`). La tarjeta la lee WhatsApp del HTML sin ejecutar nada, así que
una dirección sólo puede tener una tarjeta — de ahí las dos direcciones.

**Salió distinta de lo que decía esta entrada, y conviene decir por qué.** Aquí
se pedía *"el Warehouse Map con varios estantes, un poco reducido"*. No se hizo:
en el móvil esa tarjeta se ve del tamaño de un sello, y un mapa de estantes
reducido a ese tamaño es una mancha. Lo que se lee a ese tamaño es **una frase
grande**, así que la tarjeta lleva la frase de la portada, el logo y la
dirección. La captura del mapa sigue haciendo falta — pero para la landing (3.1),
donde se ve grande.

**Lo único que haría falta rehacer** es si cambia el titular de la portada: las
palabras de la tarjeta son las de la página, letra por letra, y hay una prueba
que lo vigila.

---

## 3. CAPTURAS FIJAS — cinco, en PNG

Estas **todavía no tienen hueco en la landing**; hay que añadírselo (trabajo
mío, unas horas). Las pongo en orden de lo que más vende.

**Formato de todas:** PNG, ancho 1600px, a pantalla completa del navegador salvo
donde se diga otra cosa.

### 3.1 — Warehouse Map, con un estante abierto
**Lo que tiene que verse:** la cuadrícula de estantes completa, **con uno
abierto** mostrando lo que tiene dentro. Si ese estante tiene foto, mejor: la
foto del estante es de las cosas que nadie más tiene.
**Por qué ésta primero:** es lo único de Acopio que se entiende en un segundo y
sin saber nada de inventarios.

### 3.2 — Stock Dashboard completo
**Lo que tiene que verse:** las tarjetas de arriba con números **que no sean
todos ceros ni todos redondos** (un almacén de verdad tiene 5.288, no 5.000), y
por debajo doce o quince filas con **categorías variadas** y **las cuatro
insignias de estado a la vista** (`In Stock`, `Reserved`, `All at Site`,
`Zero Stock`). Que se vean las cuatro es lo que demuestra que el sistema sabe
más que "hay o no hay".
**Nota:** esta captura **hay que rehacerla después** de arreglar el filtro de
estado y los nombres del dashboard (puntos B y C del backlog). No la des por
buena hoy.

### 3.3 — El historial de un material
**Lo que tiene que verse:** un material con **al menos seis movimientos**
mezclados: entradas, salidas, un traslado y una devolución, cada uno con su
fecha y su responsable. Es la captura que contesta *"¿y si alguien se equivoca?"*
sin decir una palabra.

### 3.4 — En el teléfono ⭐ la que casi nadie piensa en hacer
**Formato:** captura de un móvil de verdad, vertical, tal cual sale del
teléfono. **Sin marco de iPhone dibujado por encima** — se nota y resta.
**Lo que tiene que verse:** la pantalla de **entrada de material**, con el
teclado abierto o recién cerrado, tal como la usaría alguien de pie junto al
camión.
**Por qué importa:** todo jefe de bodega se pregunta lo mismo y casi nadie lo
enseña. Una sola foto contesta *"¿esto sirve en el almacén o sólo en la
oficina?"*.

### 3.5 — Incoming, con entregas esperadas
**Lo que tiene que verse:** varias entregas con **estados distintos** —algo que
ya llegó, algo pendiente, algo con fecha aproximada— y sus proveedores y PO
(inventados). Enseña la parte que la competencia barata no tiene.

---

## 4. EL BUCLE DE LA CABECERA — 6 a 10 segundos (opcional, para después)

**Formato:** MP4, **sin sonido, sin controles, que arranque solo y se repita**.
**Peso máximo: 2 MB.** Si pesa más, la página tarda y se pierde más gente de la
que se gana.

**Qué se ve:** una sola acción, corta y bonita. Mi recomendación: **abrir un
estante en el Warehouse Map** y que se despliegue lo que tiene dentro. Nada más.
Sin rótulos, sin cursor si se puede.

---

## Sobre los GIF: mi recomendación es **no**

Jose preguntó si GIF. **Mejor no, y la razón es de peso, no de gusto.**

Un GIF de 10 segundos a 1600px de ancho pesa **entre 15 y 40 MB** — el formato
es de 1987 y no comprime vídeo. El mismo clip en MP4 pesa **menos de 2 MB**, se
ve mejor y **se repite igual**. Un vídeo mudo con `autoplay loop muted` hace
exactamente lo que la gente quiere de un GIF, sin el peso.

**La única excepción real:** si alguna vez hace falta ponerlo donde no se admite
vídeo — el cuerpo de un correo, o algunos foros. Ahí sí, GIF de **5 segundos
como mucho**, a **800px de ancho**, y aun así va a pesar más que el vídeo.

---

## Resumen — qué entregar y en qué orden

| # | Qué | Formato | Duración / tamaño | ¿Bloquea? |
|---|---|---|---|---|
| 0 | **Copia de demo con datos inventados** | — | una tarde | **Sí — todo lo demás depende de esto** |
| 1 | Vídeo principal | MP4 mudo + poster JPG | 60–90 s | Sí, es el hueco que ya existe |
| 2 | ✅ Imagen para compartir | JPG ×2 (en/es) | 1200×630 | **Hecha el 06/10 — la genera un comando** |
| 3.1 | Warehouse Map con estante abierto | PNG | 1600px | No |
| 3.2 | Stock Dashboard | PNG | 1600px | No — y **rehacer tras los puntos B y C** |
| 3.3 | Historial de un material | PNG | 1600px | No |
| 3.4 | En el teléfono | PNG vertical | tal cual del móvil | No |
| 3.5 | Incoming | PNG | 1600px | No |
| 4 | Bucle de cabecera | MP4 mudo | 6–10 s, ≤2 MB | No |

**Lo que sigue sin existir y NO se inventa:** los testimonios. Ese hueco de la
landing se queda vacío y con su cartel hasta que haya clientes de verdad que
hayan dicho algo de verdad. Está decidido así desde que se escribió la página y
no cambia.

---

# LOS CUATRO VÍDEOS QUE PIDIÓ JOSE — 21/10

Jose, 21/10, sobre cuatro ideas que quedaron apuntadas en la lista: *"dame una
guía sencilla para esto"*, *"¿cómo se graba esto?"*, *"también dame una
descripción"*, *"¿cómo harías tú esto?"*.

**Los cuatro valen más que el vídeo principal de arriba**, y conviene decir por
qué antes de las guías: el vídeo principal enseña **qué hace** la app, y eso lo
enseña cualquier competidor. Éstos cuatro enseñan **lo que nadie más puede
enseñar** — que se instala sola, que funciona con una mano, que los datos son
del cliente, y que el Excel de verdad de una bodega de verdad se puede dejar
atrás. Son los cuatro argumentos que no se pueden copiar.

> **Regla 0, otra vez:** nada de esto sale del almacén real de OX. Ver el aviso
> del principio de este documento. Los cuatro se graban contra la copia de demo.

---

## V1 · «Instalado desde cero» — el cronómetro

**Duración:** 3–4 minutos sin cortes. **Sin música, sin voz, sin edición.**

### Por qué sin cortes y por qué con cronómetro

Porque la objeción que mata esta venta no es el precio: es *"¿cuánto me va a
costar tener esto funcionando?"*. Todo el mundo ha sufrido una instalación de
software que iba a tomar una tarde y tomó tres semanas.

Un vídeo editado no contesta esa pregunta — contesta la pregunta de si sabes
editar vídeo. **Un plano único con el reloj a la vista es la única forma de
probar una duración.** El corte es justo lo que haría sospechar.

### Antes de empezar

| | |
|---|---|
| Navegador | Ventana de **incógnito**, pantalla completa |
| Cuenta | Una cuenta de Google **nueva**, que no haya visto Acopio nunca |
| Cronómetro | `clock.zone/stopwatch` o el del teléfono apoyado al lado, **arriba a la izquierda, visible todo el rato** |
| Qué NO debe verse | Marcadores, otras pestañas, el nombre de la cuenta real, notificaciones |
| Grabación | OBS o la grabadora de pantalla, 1080p, **sin recortar después** |

### El guion, que es simplemente hacerlo

1. **Arrancas el cronómetro** y lo primero que se ve es `www.acopio.net`.
2. Clic en el botón de la versión gratis.
3. Se abre la copia de la hoja → **Hacer una copia**.
4. Extensiones → Apps Script → pegar los dos archivos → Guardar.
5. Desplegar → Nueva implementación → Aplicación web → Autorizar.
6. La pantalla de Google que da miedo → **Configuración avanzada → Ir a (no seguro)**.
7. Se abre la app vacía → el asistente de instalación.
8. **Se registra un movimiento de verdad**, y se ve aparecer en la tabla.
9. **Paras el cronómetro.**

### Las tres reglas que lo hacen creíble

1. **La pantalla de aviso de Google NO se corta.** Es la parte fea y es la parte
   que más confianza da: si la escondes y luego le sale al cliente, piensa que
   algo se le ocultó. Si la enseñas y le dices «esto va a salir y esto es lo que
   se pulsa», ya no asusta.
2. **Si te equivocas, no repitas la toma.** Un error pequeño y su arreglo dentro
   del mismo plano valen más que una toma perfecta: prueban que es un vídeo real.
3. **El último paso es un movimiento guardado**, no la pantalla de bienvenida.
   «Instalado» no es que abra; «instalado» es que ya sirve.

### Lo que se publica

El vídeo entero en la página (nadie lo verá completo, y da igual: existe), y un
recorte de **20 segundos** —del minuto 0 al 0:20— como bucle en la cabecera, con
el reloj corriendo. El número final va escrito en texto al lado:
**«De cero a funcionando: 3 min 41 s. Vídeo completo, sin cortes.»**

---

## V2 · «El teléfono en la bodega» — una salida con una mano

**Duración:** 20–30 segundos. **Vertical.** Sin voz.

### Cómo se graba, que era la pregunta

**No se graba la pantalla sola, y no se graba a una persona sola. Se graban las
dos cosas a la vez**, y por eso hace falta una segunda persona:

| | |
|---|---|
| Teléfono A | **En la mano de quien trabaja.** Grabando SU PROPIA pantalla (Android: Grabar pantalla; iPhone: Grabación de pantalla desde el Centro de control) |
| Teléfono B | **En la mano de otra persona**, grabando al primero: la mano, el teléfono y el estante detrás |
| Montaje | Los dos vídeos uno encima del otro, o el de la pantalla en una esquina del otro |

Eso es todo el truco. Sin trípode, sin luz, sin micro.

### Qué tiene que verse, en este orden

1. **Primer segundo: el almacén de verdad.** Un estante con material, en foco.
   No la app. El que mira tiene que ubicarse antes de que empiece nada.
2. La mano saca el teléfono del bolsillo. **Una sola mano, todo el vídeo.** Si
   en algún momento aparece la segunda mano, se repite la toma — ése es el
   argumento entero.
3. En la pantalla: Exit → el material → la cantidad → guardar.
4. **El número de la bodega cambia en la pantalla**, a la vista.
5. El teléfono vuelve al bolsillo.

### Las tres reglas

1. **Una mano. Siempre.** Es lo único que este vídeo demuestra.
2. **Con guantes de trabajo puestos**, si en esa bodega se usan. Es el detalle
   que le dice a un jefe de almacén que esto lo hizo alguien que ha estado ahí,
   y no se puede fingir.
3. **El cronómetro va en texto encima, no en pantalla.** Aquí sí se puede
   sobreimprimir «18 segundos» porque el vídeo dura lo que dura y se ve.

### El texto que lo acompaña en la página

> **Una salida, con una mano, sin quitarse los guantes.**
> No hay que volver a la oficina. No hay que apuntarlo en un papel para pasarlo
> luego. Se registra donde pasa, cuando pasa.

---

## V3 · «Tus datos son tuyos» — la hoja al lado de la app

**Duración:** 25–40 segundos. **Horizontal, pantalla partida.** Sin voz.

### La descripción, que era lo que pedías

Este vídeo tiene **un solo plano** y es el plano entero: la pantalla dividida en
dos. **A la izquierda, Acopio. A la derecha, la hoja de cálculo de Google con
las mismas filas.** Se registra un movimiento en la app, y la fila **aparece
sola en la hoja**, a la derecha, sin tocar nada.

Y después se hace lo contrario, que es la mitad que de verdad convence:
**se cierra Acopio** y la hoja se queda ahí, con todo dentro, legible, ordenada,
descargable.

### Por qué esto no lo puede enseñar ningún competidor

Porque no es una función: es **dónde vive el dato**. En Sortly, en inFlow, en
Zoho, el inventario está en la base de datos de ellos y se ve a través de su
aplicación. Si dejas de pagar, se acabó. **Aquí el dato está en el Drive del
cliente desde el primer día**, y la app es una ventana a algo que ya era suyo.

Ningún SaaS puede grabar este vídeo. No es que no quieran: es que su arquitectura
no se lo permite.

### El guion

1. Pantalla partida. Acopio a la izquierda, la hoja a la derecha, ya abiertas.
2. En Acopio: una salida de 4 unidades de un material. Guardar.
3. **La fila aparece en la hoja de la derecha.** Un segundo de pausa ahí.
4. Se cierra la pestaña de Acopio. Queda sólo la hoja.
5. Archivo → Descargar → Excel. Se ve el archivo bajando.
6. Fin.

### El texto que lo acompaña

> **Tus datos no están en nuestro servidor. Están en tu Google Drive.**
> Acopio escribe en una hoja de cálculo tuya, en tu cuenta. Puedes abrirla,
> leerla, descargarla o llevártela cuando quieras — y si un día dejas de pagar,
> **tu inventario sigue ahí**. Eso no es una promesa: es dónde está el archivo.

### La regla

**No se dice «nunca te quedas encerrado» — se enseña.** La frase la escribe
cualquiera; el vídeo no.

---

## V4 · El antes/después del Excel

**Duración:** 40–60 segundos. **Es el más difícil de los cuatro y el que más vale.**

### Cómo lo haría yo, que era la pregunta

Con **el Excel de verdad de OX, y con una condición**: antes de grabar, se abre
una copia y se **reemplazan los nombres** de clientes, obras, proveedores y
empleados por los inventados de la copia de demo. **La estructura se deja
exactamente como está** — las columnas de más, las filas en blanco, las celdas
de colores, las pestañas por mes, las fórmulas rotas, todo.

Y eso es justo lo que lo hace funcionar. La estructura ES el argumento; los
nombres no aportan nada y sólo pueden hacer daño.

> **No se inventa un Excel feo.** Un Excel desordenado de mentira se nota a la
> primera —está desordenado de una manera demasiado ordenada— y si se nota,
> quema la credibilidad de toda la página. O es el real con los nombres
> cambiados, o no se hace este vídeo.

### El guion

**Primera mitad — el antes (25 s).** Sin voz, sin texto, sin música.

Sólo el ratón recorriendo el Excel. Y hay que resistir la tentación de
exagerar: no hace falta. Se baja por la hoja despacio, se abren dos o tres
pestañas de meses distintos, se enseña una columna que alguien añadió a mano y
que no está en las otras pestañas, se hace clic en una celda y se ve la fórmula
en la barra. **Veinticinco segundos de silencio recorriendo eso dicen más que
cualquier frase.**

Un solo texto al final de esta mitad, sobre fondo negro:

> **¿Cuánto es lo que hay en el estante A1A ahora mismo?**

Y se deja tres segundos. El que mira va a intentar contestarlo con lo que acaba
de ver, y no va a poder. **Ésa es toda la venta.**

**Segunda mitad — el después (20 s).**

La misma pregunta, en Acopio: se escribe `A1A` en la búsqueda y sale. Un
segundo. Después, tres cosas que el Excel no puede hacer, rápidas:

1. El mismo material, su historia completa.
2. El mapa de la bodega, con el estante señalado.
3. El teléfono, enseñando lo mismo.

### El texto final

> **No tiramos tu Excel. Lo dejamos de usar para contar.**
> Todo lo que está en esa hoja se puede traer. Lo que cambia es que la pregunta
> *«¿cuánto hay?»* deja de tomar diez minutos y una llamada.

### La regla que importa

**Es el caso de OX, y se dice que lo es.** «Así tenía su inventario el almacén
donde nació Acopio» es una frase que sólo Jose puede escribir, y vale diez veces
más que cualquier ejemplo genérico. La credibilidad de este vídeo viene de que
es verdad, no de que sea bonito.

---

## El orden en que yo los grabaría

| Orden | Cuál | Por qué ése |
|---|---|---|
| 1º | **V1, el cronómetro** | Contesta la objeción que mata la venta, y se graba en una mañana con una cuenta nueva |
| 2º | **V3, los datos tuyos** | Es el más fácil de todos —dos ventanas y un movimiento— y es el argumento que nadie puede copiar |
| 3º | **V2, el teléfono** | Necesita una segunda persona y estar en la bodega, así que se agenda |
| 4º | **V4, el Excel** | El más valioso y el que más preparación necesita. No se apura |

**Si sólo se graba uno este mes, que sea V1.**
