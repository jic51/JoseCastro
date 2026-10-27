# Acopio — Backlog

Running list of agreed-upon work, roughly in priority order. Items move out of
here once they ship (the commit message is the record of what changed and why).

## Cómo leer esta lista

Barrido del **2026-10-05**, pedido por Jose: *"asegúrate de marcar sólo lo que
está hecho; si falta algo o una parte de algo no lo marques y ponlo en la
lista."* Cada sección lleva su estado **comprobado en el código**, no de memoria.
Donde no he podido comprobarlo, pone que no lo he comprobado — eso es más útil
que un ✅ optimista.

| | Significa |
|---|---|
| ✅ | hecho entero, con su versión |
| 🔶 | **a medias** — parte hecha, parte no. El texto dice cuál es cuál |
| 🔴 | abierto, sin empezar |
| 🔵 | decisión de Jose, no código |
| ⏸ | aplazado a propósito |
| 🔍 | **no revisado entera** — no se marca nada sin leerla |

---

## BARRIDO DEL 2026-10-22 — OCHO COSAS, POR ORDEN DE DAÑO

Jose, 22/10, con tres capturas y tres vídeos: *"TODO LO QUE HAY QUE ARREGLAR
CAMBIAR Y CORREGIR ANÓTALO, Y PONLE JERARQUÍA O PRIORIDAD, LUEGO DIME CON QUÉ
EMPEZAMOS. Y DEJA QUE YO DECIDA."*

Las ocho están **investigadas en el código**, no de oído. Donde la causa está
localizada va el número de línea; donde no, lo dice.

El orden no es el orden en que él las contó: es el orden del **daño**. Primero
lo que le dice al cliente algo falso o le deja datos sin dueño; después lo que
molesta; al final lo que a lo mejor ya está bien.

> **ESTADO AL 26/10, repasado por Jose una por una.** Lo tachado está hecho y
> confirmado por él en su propia copia; lo que queda lleva por qué.

| # | Qué | Estado |
|---|---|---|
| 1 | ~~Borrar un movimiento en la gratis manda a un sitio cerrado~~ | ✅ **hecho** (v12.98, la papelera se abrió) — *"ya está corregido"* |
| 2 | ~~Permissions, Directory e Import vuelven en la gratis~~ | ✅ **hecho** (v12.97) — *"corregido"*. Y después Import **volvió a propósito**, por decisión suya del 26/10 |
| 3 | Fusionar nombres falla en el caso más común | 🔶 **a medias.** Jose: *"esto funciona, pero cuando hay muchos en cola algo pasa y la app no los maneja muy bien aún; a veces sale el mensaje de busy"*. Ver **3-bis**, abajo |
| 4 | ~~El registro de errores es una foto, no una ventana~~ | ✅ **hecho** (v12.93) — *"recuerdo que los errores no se actualizaban con la ventana abierta; ahora ya lo hace"*. Era eso: la frase de la izquierda estaba mal escrita, ver abajo |
| 5 | Importar sin ubicación deja material en un cajón sin nombre | 🔶 **en marcha**, con el resto del rediseño de Import (§5-bis y §5-ter) |
| 6 | Materials (Ajustes) como las alertas de stock bajo | 🔴 **sin empezar.** Jose, 26/10: *"no recuerdo esta, ¿de qué se trataba?"* — contestado en la §6 |
| 7 | Directory (Ajustes) como la pantalla de usuarios | 🔴 **sin empezar** — *"esto aún no está hecho"* |
| 8 | ~~La casilla «todos» de Movements~~ | ✅ **cerrado sin tocar nada.** Jose, 26/10: *"eso ya no hay que moverlo, sácalo de la lista y anota que está bien todo pero que se analizará luego en siguientes versiones, después del lanzamiento"* |

> **«El registro de errores es una foto, no una ventana» — qué quería decir, en
> claro.** Jose: *"no entiendo lo que dices aquí"*. Con razón: era una metáfora
> que sólo se entiende si ya sabes la respuesta. Lo que pasaba, dicho normal:
> **la lista de errores se cargaba UNA vez al abrir Ajustes y no volvía a
> preguntar.** Si pasaba algo mientras tenías la ventana abierta, no aparecía
> hasta cerrar y volver a entrar — así que estabas diagnosticando con una lista
> vieja sin saberlo. Eso es lo que él recordaba, y es lo que se arregló.

---

> **DECISIONES DE JOSE, 22/10 — leídas después de este barrido:**
>
> | # | Qué decidió |
> |---|---|
> | 1 | ✅ **Sí: la papelera se abre en la gratis.** *"que sí se pueda devolver un borrado."* |
> | 2 | 🔵 Pregunta devuelta a mí: ¿abrimos Import en la gratis? **Mi respuesta: sí, CSV; .xlsx no puede** (ver abajo) |
> | 3 | ✅ Vídeo aportado — **causa confirmada y mayor de lo que creíamos** (ver abajo) |
> | 4 | ✅ **Arreglar, y sin repintar la ventana entera: sólo la fila que falta.** |
> | 5 | 🔵 Su rediseño mejora el mío — se adopta (ver abajo) |
> | 8 | 🔵 Quiere probar «sólo las que se ven». Mi respuesta abajo |
> | — | ✅ **La página recortada: aprobada y hecha el 22/10.** 527 KB → 225 KB por la red, cero cambios en el producto |

---

## 🔴 TERCERA RONDA DEL 22/10 — EL CANDADO QUE AUDITÉ Y SE ME ESCAPÓ

### 0-quinquies. **«SEND NOTIFICATION EMAIL» CONTESTA «READ IT FROM THE EMAIL»**

Jose, con dos capturas: *"otra vez, al tocar lo de enviar notificación sale un
mensaje sobre leer desde el email, lo cual no tiene nada que ver, porque leer
desde el email es sobre usar IA y enviar una notificación es usar el email."*

Tiene razón, y son **direcciones opuestas**: una lee lo que llega, la otra
manda lo que sale.

**La causa: una sola oferta haciendo dos trabajos.**

```js
correo: { titulo: '📧 Read it from the email',
          que: 'Paste a supplier email and the app fills in what is arriving…' }
```

y está enganchada a tres sitios (`:28335, :28336, :28203`):

| Qué se pulsa | Qué hace de verdad | ¿El mensaje habla de eso? |
|---|---|---|
| `btnFromEmail` «📧 From an email» | **leer** un correo | ✅ sí |
| `btnReadEmail` «Read it» | **leer** un correo | ✅ sí |
| `notifySection` «Send notification email» | **mandar** un correo | ❌ **no** |

**Y lo peor no es el fallo: es que esto es justo lo que audité el 21/10 y di
por cerrado.** Mi repaso recorrió `BASIC_PRO_BOTONES` —la lista de
botones— y **no tocó `BASIC_PRO_ZONAS`**, que es la lista de zonas. Hice que
una lista concordara y dejé la otra sin mirar.

**Y la prueba que existe para impedir exactamente esto tiene el mismo agujero.**
`test-candados-hablan-de-lo-mismo.js` carga las dos listas, pero sobre las
zonas sólo comprueba una cosa (`:133`):

```js
const zonasRotas = Object.keys(ZONAS).filter(z => !OFERTAS[ZONAS[z]]);
```

o sea: **que la zona apunte a una oferta que existe**. No comprueba que la
oferta *hable de lo mismo* — que es literalmente el nombre de la prueba. El
cotejo de palabras, que es lo que caza este fallo, sólo corre sobre los
botones.

Así que van **tres niveles del mismo descuido**: el mapa, mi auditoría del mapa,
y la prueba que vigila el mapa. Los tres miraban los botones y los tres
ignoraban las zonas.

**El arreglo son dos cosas y la segunda importa más:**

1. **Separar la oferta en dos.** `correo` deja de significar «correo» y pasa a
   ser **`leercorreo`** (leer un correo de proveedor) y **`avisarcorreo`**
   (avisar al guardar un movimiento). Dos cosas distintas, dos mensajes.
2. **Que la prueba mire las zonas con el mismo rasero que los botones**: sacar
   el texto que la persona LEE en esa zona (`Send notification email`) y exigir
   que comparta palabra con la oferta. Sin esto, el arreglo 1 dura hasta la
   próxima oferta que alguien reutilice.

Tamaño: pequeño. **Entra en la v12.91 con el 1 y el 2**, porque es del mismo
tipo —la app contesta algo que no es verdad— y porque dejarlo esperando a la
v12.93 significa que Jose lo seguirá viendo cada vez que abra la gratis.

### 0-sexies. 🔵 LA CASILLA «TODOS»: REVISADA POR JOSE, **NO ES UN PROBLEMA HOY**

Jose, 22/10, después de mirarlo en la app: *"estoy revisando lo que hace la app
al marcar todas en este momento y me parece que debemos dejarlo así… arriba
tiene en texto «x selected» y abajo dice «x of xx records», entonces creo que
por ahora no es un gran problema. Anota en la lista que vamos a revisarlo para
hacerlo mejor, pero que por ahora no es un problema."*

**Se queda como está. Sale de la lista de arreglos y pasa a «revisar más
adelante».** Y su razón es la correcta: los dos contadores que ya existen
—«x selected» arriba y «x of xx records» abajo— son justo la protección que yo
proponía añadir. Ya estaban puestos; lo que faltaba era mirarlos.

Lo que queda anotado para cuando se retome: el tope de 20 con «+20 more», y que
**el filtro es la vía precisa** para marcar «todas las de algo» — con un filtro
puesto, lo marcado es exactamente lo que se está mirando.

---

## 🚨 CUARTA RONDA DEL 22/10 — BORRAR 490 SON 490 PETICIONES, Y NO SE PUEDEN PARAR

### 0-pre. 🔴 **BORRAR EN TANDA ES UNA PETICIÓN POR FILA, SIN FRENO Y SIN FORMA DE PARARLO**

Dos vídeos de Jose, 22/10, después de importar 1.052 filas en una versión que
todavía no tenía el «Undo». Hizo lo único que había: marcar todo y Delete.

**LA CIFRA ES MEDIA HORA, Y LA PRIMERA VEZ LA ESCRIBÍ MAL.**

Jose, corrigiéndome: *"no, estás equivocado, muy equivocado. Envié 2 videos
(uno al principio y uno del final) porque si grababa todo el video iba a ser
muy largo y pesado. En total la app se demoró casi media hora en hacer todos
los borrados (con los 40 menos)."*

Yo había leído los dos vídeos como un solo tramo continuo y escrito «~6 min» al
llegar a `474 of 490`. **Son el principio y el final de media hora**, con el
medio sin grabar porque no cabía. El error es mío y del tipo que más importa
evitar aquí: **inventarme el tramo que no vi** en lugar de decir que no lo
tenía. La cifra real, de Jose, que estaba delante:

| Momento | Lo que dice la pantalla |
|---|---|
| al pulsar | `490 selected` → Delete |
| 3 min 37 s después *(final del vídeo 1)* | **`Deleting movements... 4 of 490`** |
| *(sin grabar: el grueso de la media hora)* | |
| *(vídeo 2, cerca del final)* | `474 of 490` |
| **≈ 30 minutos en total** | **`450 moved to the trash · 40 could not be deleted`** |
| y encima | **dos avisos apilados**: *«Too many requests — please wait a moment and try again. — the row is back where it was.»* |

**Media hora para borrar 490 filas, y 40 perdidas por el camino.**

Y el primer tramo sigue diciendo lo suyo: **4 filas en los primeros 3 min 37
s**. Si ese ritmo se hubiera mantenido serían siete horas; que acabara en media
hora quiere decir que el resto fue bastante más rápido — lo cual no mejora
nada, porque **media hora de pantalla bloqueada sin poder pararla sigue siendo
inaceptable**, y es la cifra que hay que poner al lado del arreglo.

Jose: *"no hay forma de pararlos ni borrar lo que la app ya está haciendo"*. Y
no la hay: **nada en toda la app vacía `_delQueue`**. Una vez pulsado, se mira
durante media hora.

(Él mismo apunta que tenía la red a 3G en el inspector. Eso explica parte de la
lentitud; **no explica las otras tres faltas**, que están ahí a cualquier
velocidad, ni que no se pueda parar.)

**LAS CUATRO FALTAS, CADA UNA CON SU LÍNEA:**

**1. Una petición por fila, y cada una reconstruye el almacén.**
`_delEnqueue` → `_delPump` (`Index:10149-10159`) procesa de una en una, y cada
`deleteRow` del servidor recalcula las hojas derivadas. 490 filas son 490
viajes. En la 3G del vídeo de Jose eso fueron **casi treinta minutos**, con los
primeros 3 min 37 s gastados en **cuatro filas**. La cifra que hay que tener en
la cabeza al arreglarlo es **media hora de pantalla ocupada, sin botón de
parar**.

Y la ironía: la cola de uno en uno se construyó **a propósito** en la v11.58,
porque pedir veinte reconstrucciones de golpe daba «System busy». Era la
respuesta correcta para veinte. **Para 490 es la respuesta equivocada**, y
nadie volvió a mirarla cuando apareció «marcar todas».

**2. La app se salta su propio límite de peticiones, y luego culpa al usuario.**
`processMovement` tiene `requireQuota_('pm', auth.email, 240, 60)`
(`Code:3751`) — **240 llamadas por minuto**. 490 borrados en ráfaga lo
atraviesan, y el servidor contesta *«Too many requests — please wait a moment
and try again»* (`Code:2184`).

Esa frase está escrita para una persona que insiste. **Aquí quien insistió fue
la app**, y le dice a Jose que espere un momento por algo que él no hizo y no
puede evitar. Un límite contra inundaciones disparado por nuestra propia
inundación.

**3. «Too many requests» NO se reintenta, y debería.**
`_isBusyError` (`Index:11585`) sólo reconoce `SYSTEM_BUSY|`. El mensaje de
cuota no lleva esa marca, así que cae por la rama de fallo definitivo: la fila
vuelve, sale un aviso y se cuenta como no hecha. Hay un reintento con espera
creciente —ocho intentos, hasta 8 s— **y este caso no lo usa**, cuando es el
que más lo merece: «demasiadas peticiones» se arregla solo esperando.

**4. Los avisos idénticos se apilan.**
En la captura hay **dos** iguales a la vez, encima de la barra superior. Si
hubieran fallado 40 filas de golpe serían 40 avisos. La v12.85 arregló esto
para el candado de Pro con `_proToast`; los avisos de error siguen sin
agruparse.

**Y el resultado que queda:** 450 fuera, 40 dentro, mezcladas entre las demás
y sin ninguna forma de saber cuáles son. El trabajo termina a medias y la
pantalla no dice cómo acabarlo.

---

### 0-pre-bis. ✅ LA MITAD DE ESTO SE ARREGLÓ AYER — Y LA OTRA MITAD NO

**Para su caso exacto —deshacer una importación— la v12.91 ya lo resuelve.**
`undoImport` hace **una** llamada: lee la hoja una vez, escribe las filas en la
papelera de una tacada y reescribe la hoja sin ellas. Lo que le costó seis
minutos y 40 fallos, ahora es un botón y una petición.

**Pero borrar 490 movimientos elegidos a mano sigue siendo 490 peticiones.** Y
ése es el agujero de verdad, porque no depende de que vengan de una
importación.

**EL ARREGLO, Y YA ESTÁ ESCRITO MEDIO:**

**(a) Borrar en tanda, de verdad.** Un `deleteMovements(movIds)` con la misma
forma que `undoImport`: una lectura, una escritura a la papelera, una
reescritura de la hoja. 490 filas pasan de 490 viajes a **uno**. Desaparecen
las cuatro faltas de arriba a la vez — la lentitud, la cuota, los avisos
apilados y el resultado a medias.

**(b) Por trozos, porque el techo de Apps Script es real.** Seis minutos por
ejecución. Una tanda de 200 filas va holgada; 5.000 de una no. Así que la
tanda se parte en trozos de 200 y la línea de progreso cuenta trozos en vez de
filas. Son 3 peticiones para 490, no 490.

**(c) Un botón de PARAR en la línea de progreso.** Vacía la cola y se detiene
al acabar el trozo que esté en el aire. Y dice la verdad al parar: *«Stopped —
200 of 490 deleted. The other 290 are untouched.»* Con trozos esto es honesto;
con 490 peticiones sueltas, «parar» siempre dejaba un número impredecible.

**(d) Que «Too many requests» cuente como ocupado.** Una línea en
`_isBusyError`. Con (a) deja de pasar casi siempre, pero sigue siendo la
respuesta correcta: lo que se arregla esperando, se espera.

**(e) Agrupar los avisos idénticos.** Mismo mecanismo que `_proToast`: uno
solo, con un contador, en vez de cuarenta.

**Y UNA COSA QUE ME TOCA DECIR DE LO QUE ENVIÉ AYER:** `undoImport` hace su
trabajo en una sola ejecución **sin partir en trozos**. Para las tandas que
tenemos delante (1.052 filas) va sobrado — es una lectura y dos escrituras—,
pero **no está medido para 10.000**. El trozo de (b) tiene que aplicarse
también ahí, y lo anoto como parte del mismo trabajo en vez de esperar a que
alguien se lo encuentre.

---

### 0-pre-ter. 🔵 QUÉ PASA SI TE VAS A OTRA PESTAÑA — medido, no supuesto

Jose: *"¿se pone offline la app y se para lo que está haciendo? ¿No se para
nunca hasta terminar? Si se para, ¿se reanuda cuando se regresa?"*

Las tres respuestas, leídas en el código:

**¿Lo paramos nosotros? No.** Lo único de la app que mira si la pestaña está
escondida es el latido (`_pulseOnce`, `Index:30312`: `if (document.hidden)
return;`), y eso sólo deja de preguntar si otra persona cambió algo. **La cola
de borrados no mira nada**: sigue igual.

**¿Lo para el navegador? A medias, y sin decirlo.** Chrome frena los
temporizadores de las pestañas de fondo —los `setTimeout` del reintento
(`_busyDelay`, hasta 8 s) se alargan— y una pestaña escondida el tiempo
suficiente puede **congelarse entera**. La petición que ya salió termina; la
siguiente puede tardar mucho más de lo que tardaría delante.

**¿Se reanuda al volver? Sí, pero por accidente.** Como nada se detuvo a
propósito, nada tiene que reanudarse: si Chrome congeló la pestaña, al volver
sigue por donde iba. **No hay ningún estado que diga «esto quedó a medias»**.

**Y la respuesta que importa, que Jose no preguntó pero es la peor: si cierras
la pestaña, la cola se muere con ella.** 200 borradas, 290 no, y **nada en
ningún sitio recuerda que había un trabajo sin terminar**. Al volver a abrir,
la app no sabe que pasó nada.

Con el arreglo (a)+(b) esto deja de ser un problema grande por construcción:
tres peticiones en vez de 490, cada una atómica en el servidor. Cerrar la
pestaña a mitad deja un trozo hecho y los demás sin tocar — y eso **sí** se
puede contar, porque son trozos y no 490 resultados sueltos.

---

## 🔐 26/10 — ANÁLISIS DE SEGURIDAD, PARTE 1 (lo accionable)

El informe entero está en `docs/ANALISIS-SEGURIDAD.md`. Aquí sólo lo que hay
que hacer, para que no se pierda entre la prosa.

| | Qué | Dónde | Tamaño |
|---|---|---|---|
| 🟡 | `addDocGroup` escapa sólo `"` a mano. **Hoy no es explotable** —los tres que la llaman pasan literales— pero el cuarto que pase el nombre de un material la convierte en un fallo, y con el importador de CSV abierto ese nombre lo escribe otra persona | `Index_v3_fixed.html` ~19973 | **una línea**: usar `_he()` |
| 🟡 | `handleOAuthCallback_` imprime `msg` sin escapar. Lo decide Google, no quien ataca, así que es higiene más que agujero — pero es gratis | `Code_v3_fixed.gs` ~2185 | una línea |
| 🟠 | **`XFrameOptionsMode.ALLOWALL` en la pantalla de inicio de sesión.** Cualquier web puede incrustarla en un marco invisible | `Code_v3_fixed.gs` ~2194 | **medir antes de tocar** |

**🔵 Decisión de Jose en la tercera**, y es la única de las tres que no es
obvia: puede que ese `ALLOWALL` haga falta para que la sesión funcione dentro
del marco de Google. **Quitarlo a ciegas podría dejar a un cliente sin poder
entrar, que es peor que el riesgo que quita.** Lo que haría: probarlo con el
modo por defecto en una copia de pruebas; si entra, cambiarlo; si no, dejarlo y
**escribir por qué**, para que dentro de un año nadie lo lea como un descuido.

Las dos primeras las haría sin preguntar, pero **no las he tocado**: no tiene
sentido meter mano al código el mismo día que empieza un análisis estructural
que puede mover esas mismas líneas de sitio.

---

## 🔶 26/10 — FUSIONAR MUCHOS A LA VEZ: EL «BUSY» VUELVE (punto 3-bis)

Jose, repasando: *"esto funciona, pero cuando hay muchos en cola algo pasa y la
app no los maneja muy bien aún; a veces sale el mensaje de busy. Hay que
analizar mejor esa parte."*

**Es la misma falta que ya pagamos dos veces**, y por eso va anotada aquí en vez
de arreglarse a ciegas: borrar 490 movimientos eran 490 peticiones (v12.92, se
arregló haciéndolas en tandas de 300), y el importador mandaba una por fila
(v12.91). Fusionar sigue yendo **de uno en uno**, y con veintiocho grupos en
cola la ráfaga choca contra el regulador del servidor.

**Lo que hay que mirar, en este orden, y NO antes del análisis estructural:**

1. ¿Es la app la que inunda —como en la v12.92— o es de verdad el candado del
   stock ocupado por otra persona? Son dos cosas distintas con el mismo
   mensaje, y ya nos confundió una vez.
2. Si es lo primero: una sola llamada que reciba **todas** las fusiones, como
   `borrarFilasEnTanda_`.
3. Y el regulador que Jose pidió el 23/10 —*"la app calcula cuántos puede
   enviar al servidor"*— que sigue sin existir y es el punto **C** del barrido.

---

## 🔴 26/10 — LA PAPELERA DEVUELVE EN UN ORDEN, Y NO LO DICE

**El mejor hallazgo de Jose hasta ahora sobre el diseño, y él mismo lo nombró:
*"es un punto débil de la app y sólo tiene que ver con el ORDEN en que hace las
cosas, no con lo que hace"*.**

Lo que le pasó: borró un ENTRY y dos EXIT del mismo material. Al intentar
devolver un EXIT desde la papelera, salió:

> *⚠ CANNOT PUT THIS BACK — the warehouse changed while it was in the trash.
> RAIN BUSTER 444 now has 0 in the warehouse, and this movement takes 300 out.
> Putting it back would leave you holding less than nothing. It is still in the
> trash: check whether the same material left again after this was deleted.*

Devolvió primero el ENTRY, luego los dos EXIT, y funcionó.

### El guardia está BIEN. El mensaje está MAL

Comprobado en `Code_v3_fixed.gs` (~15200): al devolver un `EXIT`, `DISPATCH` o
`WASTE`, se recalcula el stock del material y se niega si la salida dejaría el
almacén por debajo de cero. Eso hay que conservarlo tal cual — **es lo que
impide que la papelera invente existencias negativas.**

Lo que falla es lo que el mensaje DICE. Propone una causa —*"the warehouse
changed while it was in the trash"*— que en el caso de Jose **era falsa**: el
almacén no cambió, lo que pasa es que la entrada que sostenía esa salida está
**en la misma papelera, dos filas más abajo**. Y la pista que da *("check
whether the same material left again")* manda a mirar justo donde no está.

**Resultado: parece un fallo de la app y es un problema de orden con solución
de un clic.** Esa diferencia es toda la diferencia — un cliente que ve lo
primero desconfía de la papelera entera.

### Lo que propone Jose, y lo que yo añadiría

Él: *"la app debe mostrar un mensaje que diga «debes regresar este movimiento
primero»... si alguien regresa un exit y el entry también está en papelera,
debe ofrecer regresar el movimiento entry específico de ese material primero,
el usuario lo acepta y enseguida se hace el regreso"*.

Exacto, y la pieza clave es **«el entry ESPECÍFICO»**: no vale decir «mira la
papelera», hay que señalar la fila.

**Cómo lo haría, y es poco porque los datos ya están todos:**

1. Cuando el guardia salte, **antes de lanzar el error**, buscar en la papelera
   las entradas del **mismo material** que cubrirían el hueco (`haveBack` frente
   a `qtyBack`). Es la misma hoja que ya se está leyendo.
2. Si las hay, devolver un **rechazo con datos**, no un texto: el id del
   movimiento que falta, su nombre y su cantidad.
3. La pantalla lo convierte en **una pregunta con un botón**: *«Para devolver
   esta salida de 300 hace falta antes la entrada de 500 del 14/10. ¿La
   devuelvo también?»* → y al aceptar se devuelven **las dos, en orden**.
4. Si NO hay ninguna entrada en la papelera, entonces sí el mensaje de ahora —
   que en ese caso **sí es verdad**.

**Y una cosa que hay que decidir antes de construirlo**, porque es donde esto
se puede complicar: si hacen falta **dos o tres** entradas para cubrir el
hueco, ¿se ofrecen todas juntas? Yo diría que sí, en una sola pregunta y en
orden de fecha, pero que la app **nunca devuelva nada que el usuario no haya
visto en la lista** — ofrecer «y otras 4» sin nombrarlas es volver al mismo
problema por el otro lado.

**Esto es un caso particular de algo más grande**, y conviene verlo así: la
papelera guarda movimientos **sueltos** cuando lo que se borró fue una
**historia**. Lo mismo va a pasar con un traslado (dos filas) y con una
importación deshecha a medias. Ver el análisis estructural.

---

## 🖥 26/10 — CÓMO SE ENTRA AL ORDENADOR DE UN CLIENTE

Jose: *"también dame el nombre de la extensión que me permite manejar la
computadora de los clientes."*

**La que encaja con Acopio es Chrome Remote Desktop**, de Google
(`remotedesktop.google.com`). Por tres motivos que son del producto, no de la
herramienta:

- **Es gratis**, sin licencia por técnico ni por sesión.
- **El cliente ya tiene cuenta de Google** — es el requisito de Acopio. No hay
  cuenta nueva que crear ni programa que comprar.
- **Para pedir ayuda puntual sólo instala la extensión y te da un código de 12
  cifras** que caduca. No queda nada encendido en su máquina cuando termináis.

Las otras tres, por si alguna vez hace falta:

| | Cuándo | Pega |
|---|---|---|
| **AnyDesk** | Rápida y ligera; va bien con mala conexión | De pago para uso comercial |
| **TeamViewer** | La más conocida; el cliente probablemente la reconoce | **Corta las sesiones gratuitas acusando uso comercial**, y suele pasar en mitad de una instalación |
| **RustDesk** | Libre, se puede alojar uno mismo | Hay que montar el servidor; no es para empezar |

**Y la regla que yo pondría desde el primer día, antes de usar ninguna:**

1. **Nunca sin que el cliente esté delante y lo vea.** Es su inventario y sus
   precios. Entrar cuando no está, aunque sea más cómodo, es exactamente lo que
   esta arquitectura promete que no pasa.
2. **Pídele que cierre lo que no tenga que ver contigo** antes de empezar. Lo
   que no se ve no se puede filtrar sin querer.
3. **Que escriba él las contraseñas.** Nunca tú, ni aunque te las dicte.
4. **Grabar sólo si él lo pide**, y guardarlo donde guardas lo demás.

Vale la pena escribirlo porque el día que entres a la máquina de alguien estás
dentro de su empresa, y lo que te protege no es la herramienta: es haber dicho
antes cómo se usa.

---

## 🔵 26/10, NOCHE — LOS ID DEL FICHERO: HOY SE TIRAN, Y QUÉ YO HARÍA

Jose: *"la app le da un id a cada movimiento, pero no sabemos si al subir un
archivo con id's propios la app vaya a utilizar los mismos (si lo hace debe
verificar que no haya repetidos), o generar nuevos... pero sería bueno mantener
el id anterior para tener trazabilidad hacia atrás. ¿Qué piensas?"*

**Comprobado en el código, y la respuesta es la tercera opción que no estaba en
su lista: hoy el ID del fichero ni siquiera se lee.**

```
IMPORT_ALL_HEADERS = ['category','name','qty','unit','location',
                      'project','supplier','po','comments']
```

No hay `id`. Una columna que no está en esa lista **se ignora en silencio** —
lo confirmé subiendo un fichero de prueba con 800 filas y una columna `id`: el
lector devolvió las nueve columnas de siempre y ni mencionó la décima.

Y la otra mitad de su pregunta ya está resuelta: cada fila importada recibe un
ID nuevo de `uniqueMovId_`, que **sí** comprueba duplicados — lleva el mapa de
los que ya existen y añade `-1`, `-2`… si el base está cogido.

**Lo que yo NO haría: meter el ID del fichero en `MOV_ID`.** Esa columna es la
llave única de la app: es por donde se borra, se edita y se deshace una
importación. Aceptar llaves de fuera es aceptar que un fichero decida las
llaves de un sistema que ya tiene las suyas, y el primer fichero con un ID
repetido —o con el mismo ID que un movimiento viejo— rompe el borrado.

**Lo que SÍ haría, y es la idea de Jose bien puesta:** una **décima columna
opcional**, `id`, que no se usa como llave sino que se **conserva como dato**.
La app sigue poniendo el suyo; el del fichero viaja al lado. Entonces
«¿de dónde salió este movimiento?» tiene respuesta hacia atrás, que es
exactamente lo que él busca.

Dos formas, y la decisión es suya:

| | Cómo | Coste | Pega |
|---|---|---|---|
| **A · En el comentario** | Se añade `· src:LEG-0001-2606` al texto que ya se escribe (`Imported from file IMP-XXXX`) | **Casi nada** | No se puede buscar por columna; es texto |
| **B · Columna propia** | Una columna nueva en ARCHIVE, `SOURCE_ID` | Mediano: toca el ancho de la hoja, la migración de las instalaciones que ya existen y las pruebas de columnas | Es lo correcto a largo plazo |

**Yo empezaría por A** — resuelve la trazabilidad hoy, no migra nada, y se ve
en la propia tarjeta del movimiento. **B** cuando haya un segundo motivo para
tocar el ancho de la hoja, porque ese cambio no se hace dos veces.

---

## ✅ 26/10, NOCHE — TRES FICHEROS DE PRUEBA, Y UNO ENCONTRÓ UN FALLO REAL

Jose: *"tú puedes inventar un archivo Excel y uno CSV con 1000 u 800 datos
inventados (diferentes fechas, diferentes nombres, diferentes id's, todo
diferente) para ver cómo se comporta la app al subirlos"*.

Hechos, en `pruebas/`, con semilla fija —el mismo fichero cada vez, para que un
fallo se pueda repetir—:

| Fichero | Qué prueba |
|---|---|
| `inventario-1000.csv` | el caso normal, 1.000 filas, cabecera exacta |
| `inventario-800-con-id.csv` | lleva una columna `id` propia — es la pregunta de arriba |
| `inventario-600-sucio.csv` | **lo que llega de verdad**: cantidades vacías, en letra, negativas, a cero; nombres con espacios de más; comillas y punto y coma dentro del texto; una OBRA metida en la columna de ubicación |
| `inventario-800.xlsx` | un `.xlsx` legítimo de **dos pestañas**, para probar que Pro elige la correcta y que la gratis lo rechaza con su oferta |

**Pasados por el lector de verdad** (`leerFilasDelFichero_`, no por una
imitación): 1.000 de 1.000 y 800 de 800 válidas, y el sucio marcó correctamente
cada fila mala con su motivo.

**Y encontró uno que no buscaba.** Una fila con la cantidad escrita `1,250` se
descartaba en silencio: `Number('1,250')` es `NaN`, y el motivo que salía era
«Qty must be a number greater than 0» — **que además es mentira, el número
estaba y era el más grande del fichero**. Exportar con separador de millares es
lo normal en Excel, así que no era un caso raro; y caía del lado más caro,
porque la fila perdida era siempre la de más cantidad. Arreglado en la v12.99
con la regla que no inventa nada: los separadores se quitan **sólo si lo que
queda a los lados son grupos de tres**, así que `1,25` se sigue rechazando a
propósito. *Una fila rechazada se ve en la pantalla y se arregla; una inventada
no se ve nunca.*

---

## ✅ 26/10, TARDE — IMPORT EN LA GRATIS Y LA PAPELERA, CON SU DECISIÓN DETRÁS

Jose: *"la papelera no se puede probar aún en básico, por lo menos regresar
movimientos borrados no"* — y tenía razón; yo le había dicho lo contrario esa
misma mañana. Y: *"también quiero que se pueda importar documentos, así que eso
sí lo vamos a hacer en básico... si sólo dejamos que se suban archivos CSV
estamos dándole al cliente una buena forma de utilizar la app"*.

**Lo que enseña el fallo de la papelera es el GRANO.** No estaba sin construir:
estaba **dentro de la pestaña de Sistema, que se apagaba entera**. Ahí viven
ocho cosas, y sólo cuatro son de Pro. Apagar la pestaña era apagar lo que
quieres por culpa de lo que falta — y de paso ningún candado podía contestar de
lo suyo, porque el de la pestaña sólo sabía decir «Respaldo automático».

Ahora `BASIC_PRO_SISTEMA` apaga **sección a sección**, y salieron dos ofertas
nuevas (`archivado`, `reportediario`) porque tres secciones distintas
compartían el mismo permiso que falta pero **no son la misma función**.

`BASIC_PRO_AJUSTES` se queda vacío **a propósito**, escrito y no borrado: la
próxima pestaña que haya que cerrar a medias va a querer ese sitio.

**Import** sale de `BASIC_FUERA.ajustes`. `.xlsx` no puede —`excelToSheets_`
usa la API de Drive por `UrlFetchApp`, dos permisos que esta edición no pide—
y eso se dice en **tres sitios**, de menos a más tarde: el selector sólo acepta
`.csv`, el texto de debajo explica la salida («Archivo → Descargar → .csv»), y
si alguien arrastra un `.xlsx` igualmente **sale la oferta de Pro antes de leer
un byte**, no un error después. El servidor se niega también, por si llega por
otro camino, con el mismo texto y la misma salida.

**Y una lección de método:** el guardia que encontró mi error no fue una prueba,
fue `build-paste.js`. Dejé un paréntesis sin cerrar en el ternario del texto de
Import; el intérprete del navegador habría muerto al cargar. Como ese comando
**parsea el JavaScript** antes de escribir nada, se negó a escribir. *Más vale
ningún archivo que uno roto* — esa línea es suya y hoy valió la versión entera.

---

## 💼 26/10 — QUÉ HACER SI LLAMA UNA EMPRESA GRANDE

Pedido por Jose. Está escrito en `docs/PRECIOS-Y-COMPETENCIA.md`, sección «Una
empresa mediana-grande llama», con el número delante: **$49/mes a $75/hora son
40 minutos de soporte**, así que la suscripción paga menos de una hora al mes y
un cliente que consume dos **cuesta dinero**. De ahí sale lo que él intuía y es
correcto: diez clientes de $49 valen más que uno de $490, porque el grande no
consume diez veces menos soporte, consume más.

Lo que hay escrito: **1 hora al mes incluida, $75 la hora extra**, avisando
antes de empezar y nunca por factura sorpresa; las **tres condiciones** para
venderle; los **cuatro motivos** para no hacerlo y el guion para decirlo sin
perder la relación; y la salida que evita el «no» seco — que instalen la
**gratis** en una bodega.

**🔵 Decisión de Jose, y bloquea dos documentos:** los Términos (sección 5) y
`SOPORTE-Y-PAGOS.md` dicen hoy que hay soporte **sin número de horas**. Si
adopta la política, el número tiene que estar ahí, porque es lo que el cliente
acepta — y entonces se mueve la fecha de los Términos, que ya lo vigila
`sync-legal.js`. **No lo he escrito en ninguno de los dos**: es su precio y es
un documento que se firma.

---

## 🔴 26/10 — LO QUE SALIÓ DEL VÍDEO Y LAS CUATRO CAPTURAS DE JOSE

### ✅ ARREGLADO EN LA v12.97 — los dos bloqueadores de Ajustes

Están contados en el commit y en el changelog. Lo que hay que recordar de
ellos es la forma, porque las dos la repiten:

- **El gris que no se iba.** Había una función para APAGAR una zona y ninguna
  para ENCENDERLA. *Una pareja a la que le falta una mitad se acaba usando a
  medias.* Y el oyente del clic llevaba la clave dentro de un `function`
  anónimo, así que no se podía quitar ni queriendo: lo que se enciende y se
  apaga ahora es el atributo, y el oyente la lee al pulsar.
- **Las pestañas que reaparecían.** Dos reglas escribiendo el mismo
  `style.display` — el rol y la edición — y ganaba la que corriera la última.
  No tenían que coincidir: tenían que **combinarse**, y nadie las combinaba.
  `_settingsTabVisible` es el único sitio donde se juntan. **Esto es lo que yo
  llamaba «un solo dueño de la visibilidad de pestañas», que Jose pidió que le
  explicara el 22/10.** Ya no es una idea: es una función.

### 🔴 1. LOS TÉRMINOS DE LA HOJA NO SE ACTUALIZAN NUNCA

Jose, con dos capturas: la ventana de Términos **dentro de la app** ya trae el
apartado de las dos ediciones, y la pestaña **de la hoja** sigue como estaba.

Y es verdad, y es estructural:

| Copia | Quién la escribe | ¿Se actualiza al pegar código? |
|---|---|---|
| La ventana de la app | `LEGAL_DOCS`, se lee del archivo en cada carga | ✅ sí |
| **La pestaña de la hoja** | `createLegalSheets_`, llamada **sólo** desde `createStartHereSheet_` | ❌ **no** |

`createStartHereSheet_` corre en tres sitios y los tres son de instalación: si
no existe la hoja de bienvenida, al fabricar la plantilla, y al diagnosticar un
permiso que falta. **En una instalación que ya existe, esa pestaña se escribió
una vez y se queda congelada para siempre.**

Y es la copia que importa: es la que el cliente tenía delante **cuando marcó la
casilla**. El comentario del código dice *"rebuilt from scratch each time rather
than patched... so the file's copy should always be the current one"* — es
verdad de la función y falso del producto, porque nadie la vuelve a llamar.

**LA TRAMPA, y por eso no lo arreglé al vuelo.** `createLegalSheets_` hace
`deleteSheet` + `insertSheet`. Eso le da un **gid nuevo** a la pestaña, y los
dos enlaces de la casilla de consentimiento en START HERE apuntan al gid viejo
(`#gid=101`, `#gid=102` en la captura de Jose). Reconstruir a lo bruto deja la
frase del consentimiento enlazando a dos pestañas que ya no existen —
exactamente la pantalla que no se puede romper.

**Lo que haría:** reescribir el CONTENIDO de la pestaña en su sitio, sin
borrarla ni insertarla, y dispararlo solo cuando la fecha de la pestaña no
coincida con la del código. Tamaño: pequeño; el cuidado está en no tocar el
gid. **Decisión de Jose**, porque toca la app.

### 🔴 2. QUIEN NO ES ADMIN PUEDE SUBIR UN DOCUMENTO Y NO PUEDE ABRIRLO

Jose: *"¿cómo manejamos que un usuario no admin (warehouse/supervisor) ingrese
documentos en los movimientos, en los incomings o en las entries, si todos los
documentos y los backups se guardan en el Drive del admin que empezó la app?"*

**Subir funciona, y la razón es buena.** El manifiesto despliega la app con
`executeAs: USER_DEPLOYING`: TODO el código de servidor corre con la cuenta del
administrador que la desplegó. El navegador del bodeguero manda los bytes, y
quien escribe en Drive es el admin. El bodeguero **no concede ningún permiso de
Drive y no necesita ninguno** — por eso entrar a la app es sólo iniciar sesión.

**Abrirlo no funciona, y eso no lo habíamos hablado.** Desde la v8.10 los
documentos se guardan **privados** (antes eran «cualquiera con el enlace», y esa
fue una exposición que se cerró). Pero la app enseña el documento como un enlace
normal de Drive:

```
https://drive.google.com/file/d/<id>/view
```

- El **admin** lo abre.
- Un **bodeguero o supervisor** recibe de Google «necesitas acceso».

Así que hoy un operario puede adjuntar la foto del albarán y **no puede volver a
verla**. Nadie lo ha reportado porque sólo lo nota quien no es admin, y la app
todavía no ha tenido equipos de verdad. No lo toqué: es un arreglo con tres
caminos y una decisión de privacidad dentro.

**Las tres salidas, de menos a más expuestas:**

1. **Que el servidor sirva el archivo.** El código ya corre como el admin: puede
   leer los bytes y devolverlos a quien tenga permiso en la app. El fichero
   sigue privado en Drive y el control de quién lo ve vuelve a ser nuestro, que
   es donde debe estar. Más trabajo, y es lo que yo haría.
2. **Dar acceso de lector a cada usuario de la app** cuando se sube. Es exacto,
   pero mete a Google en medio de cada alta y baja de personal, y un usuario
   borrado de la app conserva el acceso en Drive.
3. **Volver a «cualquiera con el enlace»**. Es lo más fácil y es **deshacer la
   corrección de la v8.10**. No lo recomiendo.

**Y dos consecuencias del modelo que conviene tener escritas**, porque no son un
fallo pero sí una promesa que estamos haciendo sin decirla: el **espacio de
Drive del admin es el de toda la empresa**, y si esa cuenta desaparece, los
documentos y los respaldos se van con ella.

### 🔴 2-bis. «CHOOSE IMAGE» EN BÁSICO GUARDA A MEDIAS Y REVIENTA CON UN ERROR AJENO

Salió del vídeo del 26/10 en el que Jose repasa Ajustes: en **Name & Logo** —la
primera pestaña de Ajustes y la primera pantalla que toca alguien que acaba de
instalar la gratis— hay un botón **«Choose image»** a todo color, sin candado.

**No puede funcionar**, y es de manual: guardar un logo hace
`getOrCreateFolder_(...).createFile(blob)`, o sea **Drive**, y
`appsscript.basic.json` pide un solo permiso, `spreadsheets.currentonly`.

**Y falla de la peor forma posible.** Mirando el orden de `saveCompanyProfile`:

```js
p.setProperty('COMPANY_NAME', name);          // ← se guarda PRIMERO
p.setProperty('COMPANY_DOMAIN', ...);         // ← y esto también
...
} else if (data.logo && data.logo.fileData) {
  var file = getOrCreateFolder_(...).createFile(blob);   // ← aquí revienta
```

El nombre y el dominio **ya se guardaron**, y encima sale un error de Google —
no un mensaje nuestro, porque `saveCompanyProfile` no tiene `basicNiega_`.
Media operación hecha y el mensaje de otro. Es exactamente la trampa que Jose
nombró el 19/10: *"se le dice al cliente lo que no se puede hacer ANTES de que
lo termine de hacer, justo al momento de empezar"*.

**Y es el cuarto control de Pro sin candado**, junto a los tres 🏷 de la nota
del 25/10. Cuatro no son cuatro descuidos: son el mismo agujero —
`BASIC_PRO_BOTONES` es una lista de `id` recorrida UNA vez al arrancar, y no
alcanza ni a los botones que se crean después ni a los que nadie añadió.

**Lo que haría, y ya son dos sitios que lo piden:** el arreglo de la nota del
25/10 (poner el candado AL CREAR el botón, más una prueba que lo obligue),
y de paso una oferta nueva en `BASIC_PRO` para el logo — porque esto **vende**:
«pon el logo de tu empresa arriba» es justo la clase de cosa por la que alguien
sube a Pro. Esconderlo sería perder la venta; dejarlo así es romper la app.

### 🟡 3. EL TOAST DE PRO ESTÁ MAL ALINEADO — Y HAY QUE MIRARLOS TODOS

Jose, con una captura: *"el candado está a mitad del toast (está correcto) pero
el texto y la 'x' están más arriba de la mitad y se ven mal colocados. Anótalo
para corregirlo luego y también revisar todos los demás toasts, de Pro y no de
Pro."*

Anotado tal cual, sin tocar nada. Lo que hay que hacer **no** es empujar ese
texto: es mirar la fila entera y decidir **una** regla de alineación vertical
para todos los avisos, los de Pro y los normales. Arreglar sólo el que se ve mal
es cómo se acaba con cinco avisos alineados de cinco maneras.

### 🟡 4. EL NOMBRE SALTA CUANDO APARECE EL LOGO

Jose: *"siempre que se abre la app aparece el nombre solamente y luego de unos
segundos aparece el logo y hace mover al nombre hacia abajo. Debemos
estandarizar también eso, para que no se muevan al aparecer o desaparecer algo
(como lo hicimos con las columnas)."*

Tiene razón y la comparación es la correcta: es **el mismo fallo que las
columnas del Dashboard**, que se movían al cambiar de filtro y se arregló
reservando el ancho. Aquí falta reservar el **alto** del logo antes de que
llegue: el hueco existe desde el primer pintado, vacío, y la imagen aparece
dentro sin empujar nada.

Y conviene hacerlo como regla, no como parche: *nada que llegue tarde puede
mover lo que ya está colocado*. Es lo mismo que la fila nueva del registro de
errores, y lo mismo que las columnas.

**MEDIDO EL 26/10, en el navegador, con la barra de verdad.** Cuando llega el
logo, las pestañas, el menú de la cuenta, el punto verde **y todo el cuerpo de
la página bajan 37 px de golpe**:

| Ancho | Pestañas antes → después | Salto |
|---|---|---|
| 1280 px | 78 → 115 | **37 px** |
| 820 px | 78 → 115 | **37 px** |
| 390 px | 78 → 115 | **37 px** |

**Los 37 px son los mismos en los tres anchos, y eso es la buena noticia**:
significa que es UNA regla, no tres. La causa es literal —
`<img id="appLogo" style="display:none">`: lo que está en `display:none` no
ocupa sitio, así que al encenderlo empuja todo lo que tiene debajo.

**El arreglo es el mismo que el de las columnas:** reservar el hueco desde el
primer pintado. `visibility:hidden` en vez de `display:none`, o un alto fijo en
`.app-logo` con el `<img>` dentro. Cuando no hay logo, el hueco se quita **una
sola vez**, al saberlo, y no después.

**Y hay dos cosas más que cambian tarde en esa misma barra**, y conviene
arreglarlas en el mismo viaje o volverá a moverse por otro lado:

- `<h1 id="appTitle">Warehouse</h1>` nace diciendo «Warehouse» y luego se
  reemplaza por el nombre de la empresa — cambia de ancho.
- `#jsVersionTag` nace como **«JS NOT LOADED»** en rojo y se reestiliza a la
  versión callada. Eso es a propósito y es correcto (si el script no corre, es
  lo único que lo dice), pero su tamaño tiene que estar reservado igual.

---

## 🔴 25/10 — POR QUÉ «🏷 LABELS SALE A COLOR», Y HAY DOS, NO UNA

En la lista de verificación había tres cosas apuntadas como «ya sabemos que
están mal en Básico» sin causa. Ésta ya tiene causa, medida.

### Lo primero: el CSS está bien

Medido en el navegador con el `<style>` de verdad y el botón de verdad. Con
`.pro-lock` puesto, un botón acaba en `opacity:.4`, `filter:grayscale(1)` y su
🔒 detrás. **Se ve gris.** (Ojo al medirlo: si se lee el estilo calculado
inmediatamente después de poner la clase sale `grayscale(0)` y `opacity:1` —
está a mitad de la transición. Hay que esperar, o se diagnostica al revés.)

### Entonces lo que pasa es que la clase NO ESTÁ

`_basicCandado` recorre `BASIC_PRO_BOTONES`, que es **una lista de `id`
escrita a mano**, y busca cada uno con `getElementById` **una vez**. Sólo
alcanza a los botones que existen en ese instante y que están en la lista.

Hay **tres** controles de etiquetas en la app y sólo uno está en la lista:

| Dónde | Qué es | ¿Candado? |
|---|---|---|
| `btnMovLabels` (Movements) | estático, en la lista | ✅ sí |
| **El aviso de «Saved ✓» al guardar una entrada** (~14780) | botón **`🏷 Print labels`** creado por `showToast` al vuelo | ❌ **no**, y va a todo color |
| **`locPrintBtn`** (Ajustes → Locations) (~17537) | `btn-primary` creado al marcar ubicaciones | ❌ **no**, y es de color primario |

Los dos que fallan **se crean después**, así que una lista de `id` recorrida
una vez no puede alcanzarlos ni aunque alguien los añadiera. Es la forma de
siempre: dos cosas que tienen que coincidir sin que nada lo obligue, el
inventario de controles de Pro y la pantalla que los va creando.

### Y explica la segunda de las tres

La pregunta de **«¿también llegó esto?»** que Jose dice que no debería salir en
Básico está en **ese mismo camino**: `luego = _offerAlsoArrived(...)`, que corre
cuando el aviso caduca o al cerrar el cuadro de etiquetas. No son dos fallos
sueltos: son el mismo trozo de código sin enterarse de la edición.

### Lo que yo haría

**No** añadir dos `id` más a la lista — eso deja el siguiente botón fuera igual.
Las opciones, en orden:

1. **Que el candado se ponga al crear**, no al arrancar: una función
   `_proBoton(el, clave)` que llamen los sitios que fabrican botones, y que
   `showToast` acepte una `clave` en su botón de acción. Es el cambio honesto y
   es pequeño.
2. **Y que una prueba lo obligue**: recorrer el archivo buscando los textos que
   sólo tienen sentido en Pro (`Print labels`, `Scan`, `Backup`…) y exigir que
   cada uno esté en `BASIC_PRO_BOTONES`, dentro de una zona de
   `BASIC_PRO_ZONAS`, escondido por `BASIC_FUERA`, o marcado con `_proBoton`.
   Heurística, sí; pero es justo el agujero por el que se colaron estos dos.

**Decisión de Jose**, porque toca la app y obliga a pegarla: se hace con la
tercera de las tres (las tarjetas del mazo) en una sola versión, o se deja.

---

## 🟡 25/10 — UN COMENTARIO QUE PROMETE MÁS DE LO QUE SE PUEDE SOSTENER

Escribiendo la prueba que ejecuta de verdad lo de «sólo la fila que falta»
(`test-errorlog-fila-nueva.js`), la primera comprobación que puse salió **roja
con el producto sano**: afirmaba que la fila que estabas leyendo no se mueve ni
un píxel al entrar una nueva arriba. Medido: la fila vieja pasa de `y=31` a
`y=65` mientras `scrollTop` va de 20 a 30. El anclaje de scroll de Chrome
compensa **en parte**, no del todo, y eso no lo decide la app.

El comentario de `_errorLogMeterArriba` dice hoy:

> *"El scroll no se mueve, el buscador conserva lo escrito, y lo que estabas
> mirando sigue donde estaba."*

Las dos últimas son ciertas y están comprobadas. **La primera no**: al meter una
fila encima, lo de abajo baja un poco. No es un fallo —insertar es ya la
operación mínima, y redibujar sería peor: te devuelve arriba del todo— pero el
comentario afirma algo que no se sostiene, y un comentario que promete de más es
el que hace que alguien no busque un problema real.

**Qué hay que hacer:** cambiar esa frase por lo que sí es verdad —*"no te
devuelve al principio de la tabla, que es lo que hace un redibujado"*—. Es un
comentario, así que **no se tocó ahora**: cambiar el archivo cambia la huella y
obligaría a Jose a pegar la app otra vez por una frase. **Viaja con la próxima
versión que tenga algo más dentro**, junto a lo que quede de la lista de abajo.

---

## ✅ 24/10 — LAS DOS EDICIONES, EN LA PÁGINA Y EN LOS DOCUMENTOS

Jose: *"me puse a ver que en la landing y en todos los documentos sólo se habla
de Acopio, no hay Acopio Básico ni Pro, así que hay que buscar, analizar, añadir
o cambiar todo lo que habla de Acopio."*

**Tenía razón, y lo que encontré era peor que una omisión: la página prometía a
la edición gratis cuatro funciones que están cerradas en ella** — las fotos, el
equipo con sus permisos, las etiquetas impresas y el respaldo de cada noche. No
era un hueco de catálogo: era una promesa que no se cumple en el primer minuto.

Hecho y publicado:

| Dónde | Qué decía | Qué dice |
|---|---|---|
| `landing/acopio.html`, precio | $500 y $49, sin más | Abre con **Acopio Basic — free / $0**, y las dos de pago dicen **Pro** en su título |
| `landing/acopio.html`, funciones | UNA lista de quince | Partida en dos, con un encabezado por edición. Entran las tres ofertas que faltaban: escanear, apartar material, avisar por correo |
| `landing/acopio.html`, hero y «por qué Acopio» | *"lo instalamos y configuramos contigo"*, *"cada quien con su propio acceso"* | Dicen cuál de las dos hace cada cosa |
| `landing/acopio-overview.html` | Un precio solo y siete grupos de funciones sin distinguir | Sección propia de las dos ediciones, el precio con el $0, y distintivo **Sólo Pro** en los dos grupos que lo son |
| `docs/INSTALL-GUIDE.md` · `docs/CUSTOMER-SETUP.md` | Mandaban a **🏭 Acopio → …**, un menú que en Básico **no puede existir** | Dicen de qué edición son, y terminan con los tres pasos de Básico |
| `docs/RESTAURAR-UNA-COPIA.md` | *"tu sistema se copia solo todas las noches"* | Dice que eso es de Pro, y cómo se hace la copia a mano en Básico |
| `docs/SOPORTE-Y-PAGOS.md` | Un precio y un soporte | El $0 arriba, y **lo que no se promete** en una edición que no se paga |
| `legal/TERMS-OF-SERVICE.md` | *"what you are buying"*, y el respaldo *"enabled during setup"* | Sección 0 que acota qué cláusula es de cuál, y la 8 dice que en Básico no hay respaldo automático |

### Y UN ERROR MÍO, DOS VECES EN EL MISMO DÍA, QUE DEJA LA LECCIÓN

**Primero**: puse las claves de traducción `t82`–`t85` en el precio y **ya
estaban en uso** («Palabras del fundador» y sus tres párrafos). En español la
tarjeta de Acopio Básico mostraba el texto del fundador. Las claves son `t` + un
número puesto a mano y el diccionario es un objeto literal: reusar un número no
da ningún error, la entrada repetida la gana la última. Lo vigila ahora
`test-landing-i18n`, **contando en el HTML y no en el DOM** — `acopioApplyLang`
memoriza el inglés por CLAVE y no por elemento, así que el primer elemento se lo
escribe encima al segundo y, para cuando el DOM se puede leer, los dos dicen lo
mismo. Mirando el DOM la colisión daba verde; lo comprobé.

**Y después, arreglando esto mismo**: metí en la lista de Básico dos cosas que
esa edición **no puede hacer** — «un reporte cada tarde, que llega solo por
correo» y «el cambio sale por correo». Leí el mapa de candados y no leí el
manifiesto. `appsscript.basic.json` pide **un** permiso,
`spreadsheets.currentonly`: sin `script.send_mail` no hay ningún correo, y sin
`script.scriptapp` no hay disparadores, así que un reporte nocturno es imposible
dos veces.

**El candado es la mitad de la verdad; el permiso es la otra.** Una función
puede faltar en Básico por dos motivos distintos —porque está cerrada con una
oferta detrás, o porque el permiso que necesita no se pide— y yo sólo había
mirado la primera. `test-ediciones-coinciden.js` (19) mira las dos:

- toda clave que la página nombre existe en `BASIC_PRO` o en `BASIC_FUERA`;
- **toda oferta de `BASIC_PRO` sale en la página** — son la superficie de venta
  de la gratis, y la que no se nombra no se puede comprar;
- la lista está partida en dos y ninguna función cae del lado que no le toca;
- y **nada de lo prometido en Básico necesita un permiso que su manifiesto no
  pide** (correo, disparadores, Drive), con una regla más que se pone roja si el
  manifiesto deja de tener un solo permiso, porque entonces las tres anteriores
  hay que volver a mirarlas.

### 🔴 LO QUE QUEDA DE ESTO

1. **La papelera en Básico.** Jose ya lo decidió —*"abro la papelera en la
   gratis, si hazlo así"*— y **no está construido**: `BASIC_PRO_AJUSTES =
   { system: 'respaldo' }` apaga la pestaña de Sistema entera y la papelera vive
   dentro. Mientras tanto la página lo dice como es hoy (*"devolver uno está en
   Ajustes → Sistema"*, del lado de Pro). **Cuando se construya, esa línea vuelve
   a la lista de Básico** — y la prueba de arriba no lo detecta sola, porque un
   candado que se abre no deja rastro en la página.
2. ~~**El ancla `#pro` del candado**~~ ✅ **v12.96** — `_proUrl` ya termina en
   `#pro`. Un `#` que no exista no es un 404, es la misma página sin desplazar,
   y por eso esto se podía cambiar sin miedo; `/pro` no.
3. **Unos Términos propios para Básico**, si Jose los quiere. El preámbulo de
   hoy acota qué cláusula es de cuál y quita lo falso, pero un documento legal
   separado es decisión suya, no mía.

**Y una consecuencia que no vi venir y conviene dejar escrita:** los Términos
que el cliente acepta **no están sólo en la web** — viven dentro de la hoja,
generados desde `legal/*.md` por `tools/sync-legal.js`, y `test-legal-sync` los
compara sección por sección. Arreglar lo que dicen de las dos ediciones obligó a
tocar la app, así que lo que empezó como «cambiar unas páginas» acabó siendo la
**v12.96** y hay que pegarla. Dos lecciones:

- **Un texto legal nuevo se escribe como preámbulo sin número.** Lo numeré «0» y
  corrió las trece secciones de siempre: catorce comparaciones en rojo a la vez,
  y todas las referencias cruzadas («ver sección 9») apuntando una sección más
  abajo. Sin número, nada se mueve — y además es la forma correcta de escribir
  una cláusula de alcance.
- **Las viñetas del Markdown legal van en UNA línea.** El generador convierte la
  primera línea de una viñeta en un `li` para la pestaña de la hoja y deja la
  continuación como un párrafo suelto con sangría, así que una viñeta de cinco
  líneas sale partida en dos cosas que no parecen la misma. El detalle va en
  párrafos normales debajo.

---

## 🔴 23/10, NOCHE — LA APP TIENE DOS REGLAS CONTRARIAS SOBRE CUÁNDO SE VA UNA FILA

Jose, con un vídeo borrando usuarios de uno en uno:

> *"en TODA LA APP la app no maneja bien el feedback visual. Cuando algo se
> elimina (cambia, modifica, mueve) debe desaparecer en el momento en que se da
> clic en 'delete', así el usuario puede continuar haciendo otras cosas. Y si
> hay algún problema y la acción no se completa, se devuelve la fila a donde
> estaba y se dice qué falló y cómo proceder… No puedo eliminar al siguiente
> rápido porque debo esperar a que la app reaccione y elimine la fila."*

**Tiene razón, y lo que encontré al verificarlo es peor que «falta hacerlo»:
la regla que él pide YA EXISTE, escrita y argumentada, y se aplica en UNA sola
pantalla.**

### Las dos reglas, las dos escritas como si fueran «la regla»

`Index_v3_fixed.html:10341`, borrar un movimiento:

> *LA FILA SE VA AL PULSAR, NO CUANDO EL SERVIDOR CONTESTA.*
> Jose: «cuando elimino lo que sea que elimine, debe moverse y desaparecer con
> la animación en el mismo segundo que el toast». Y medido el 2026-09-11 en su
> hoja, ese segundo son CUATRO… **eso no se arregla animando — se arregla no
> haciendo esperar mirando.**

`Index_v3_fixed.html:26974`, borrar un usuario:

> *La lista se arregla aquí mismo, sin volver a preguntar: es la misma regla que
> el resto de la app desde la v12.49 — **lo que el servidor confirma se ve en el
> acto**.*

**Las dos dicen «ésta es la regla» y dicen cosas contrarias.** Una es «se va al
pulsar»; la otra es «se va cuando el servidor dice que sí». Y la segunda está
escrita dentro de un `withSuccessHandler`, así que en una conexión lenta la fila
se queda ahí mientras el botón dice «Deleting…».

### El recuento, verificado uno por uno

| Qué se borra | ¿Cuándo se va de la pantalla? | ¿Te deja seguir? |
|---|---|---|
| **Un movimiento** | **al pulsar** ✅ | sí |
| Un usuario | cuando contesta el servidor | el botón queda `Deleting…` |
| Una categoría / obra / proveedor | cuando contesta | **`_cfgBusy` apaga la pestaña ENTERA** |
| Una entrega esperada | cuando contesta | `btn.disabled` |
| Restaurar de la papelera | cuando contesta | botón `Restoring…` |
| Deshacer una importación | cuando contesta | botón ocupado |
| Fusionar nombres | cuando contesta | botón ocupado |

**Una de siete.**

### Y el matiz que hay que acertar — porque esos frenos se pusieron a propósito

Los guardianes no son descuidos: están argumentados en el código (`_cfgBusy`
existe para que no se encolen dos cambios de catálogo; el `btn.disabled` de las
entregas existe porque *«el reintento envía DE NUEVO, no vuelve a entrar por
aquí»*, y sin él un borrado se perdía en silencio).

**Lo que Jose pide no es quitarlos. Es cambiar de qué protegen:**

- **Un freno por FILA** — no puedes borrar dos veces el mismo usuario. **Se
  queda.** Es lo que impide el doble clic.
- **Un freno por PANTALLA** — no puedes borrar nada mientras hay algo en el
  aire. **Ése es el que está mal**, y es exactamente lo que él tenía delante.

Hoy `_cfgBusy` es por pantalla, y apaga todos los botones de la pestaña
(`_cfgSetBusy`, `:18491`). Los otros son por botón, que con un botón único de
«Delete» acaba siendo lo mismo.

### Lo que haría, y por qué es una sola pieza y no siete parches

La parte difícil de «la fila se va al pulsar» **no es quitarla**: es
**devolverla bien si el servidor dice que no**. El borrado de movimientos ya lo
resolvió entero y está medido:

- guarda **dónde** estaba, no sólo que estaba (*«volver al final sería decirle a
  alguien que su movimiento es el más reciente cuando es de hace un mes»*)
- distingue «el servidor dijo que no» de «ya no existe» — en el segundo caso la
  fila **no** vuelve
- y la devuelve con su animación, no de golpe

Repetir eso siete veces es garantizar que seis se queden a medias. Lo correcto
es **un solo ayudante** —«quita esto ya, y devuélvemelo a su sitio si falla»—
que las siete usen, con la cola de peticiones del punto C por debajo.

**Va junto con el punto C (las tandas):** son la misma idea por los dos lados.
C es *no hagas esperar al servidor*; esto es *no hagas esperar al ojo*. Hacer
una sin la otra deja la mitad del problema.

---

### 🔵 LA PAPELERA PARA MÁS COSAS — idea de Jose

> *"¿qué tal si en la papelera mandamos no sólo los movimientos borrados, sino
> también otras cosas borradas, usuarios?"*

**Sí, y hay una frase en la app que lo pide a gritos.** El aviso de borrar un
usuario dice hoy, textualmente:

> *«Deleting is for a row that should never have existed — a typo, a duplicate —
> and **it cannot be undone from the app**.»*

Esa última parte existe **sólo porque no hay papelera para usuarios**. Con ella,
la frase cambia y el borrado deja de dar miedo.

**Lo que hay que resolver antes, y es de verdad:** la papelera de hoy guarda
**filas de movimiento**. Su ancho es `AC_WIDTH + 3` y sus columnas son las del
archivo. Una fila de usuario no tiene esa forma. Así que o la papelera se
vuelve **genérica** —una columna que diga de qué es, y la fila guardada tal
cual— o cada cosa tiene su propia papelera.

**Genérica**, sin dudarlo: una papelera por tipo son cinco pantallas que
mantener de acuerdo, y ya sabemos cómo acaba eso en este proyecto.

**Qué metería, y en qué orden:**

1. **Usuarios** — es el que tiene la frase que se puede borrar del aviso
2. **Ubicaciones** — Jose ya pidió el 22/10 mejorar cómo se borran
3. **Categorías, obras, proveedores** — borrar una obra por error hoy no se
   deshace
4. **Entregas esperadas** y **materiales**

**Y lo que NO metería:** nada que ya sea reversible por otro camino.
**Desactivar** un usuario ya es la respuesta correcta para «esta persona se
fue»; la papelera es para «esta fila no debió existir nunca», que es justo lo
que el aviso dice. Meter las dos cosas en el mismo sitio volvería a mezclar dos
conceptos, que es el error que acabamos de arreglar con dentro/fuera.

---

## 📝 PEDIDO EL 23/10 — PARA DESPUÉS DE LO IMPORTANTE

Jose: *"anota esto para hacerlo luego de corregir las cosas más importantes de
la app"*. Las dos van aquí, fuera de la lista de arreglos, porque **ninguna es
un fallo**: son mejoras.

### P1. 🔵 LA CANTIDAD AL LADO DE CADA PROVEEDOR, Y EL PROVEEDOR QUE SE OLVIDA

> *"ya tenemos los suppliers por material, pero quiero que pongamos la cantidad
> por supplier justo al lado de cada uno. También debemos dejar el supplier aun
> cuando ya no tenemos nada en la bodega, y eso se reinicia si no tenemos nada y
> llega más — entonces sólo se muestra el supplier del que SÍ tenemos."*

Son dos cosas y la segunda es la interesante:

**(a) La cantidad por proveedor.** Hoy la lista dice de quién vino el material;
no dice cuánto queda de cada uno. Con la cantidad al lado, «me quedan 40, 30 de
Acme y 10 de Redrock» se lee de un vistazo, y eso es lo que decide a quién
llamar.

**(b) La regla del reinicio, que es la que hay que entender bien.** Lo que Jose
describe no es «guardar el histórico de proveedores»: es que **la lista diga de
quién es lo que TIENES**, no de quién fue todo lo que pasó por ahí.

- Llegan 100 de Acme → la lista dice **Acme 100**
- Salen 100 → no queda nada. El proveedor **no se borra del historial**, pero
  deja de contar: ese material está a cero
- Llegan 50 de Redrock → la lista dice **Redrock 50**, y **no** «Acme 0 ·
  Redrock 50»

Es FIFO aplicado a la pregunta «¿de quién es esto?». Y tiene una consecuencia
que conviene ver antes de construirlo: **con dos proveedores a la vez hay que
decidir cuál sale primero.** Si hay 30 de Acme y 20 de Redrock y salen 40,
¿quedan 10 de Redrock, o 10 repartidos? Lo normal en una bodega es lo primero
—lo que llegó antes sale antes— y eso es exactamente lo que los **lotes** del
backlog resuelven. **Esta entrada y la de lotes son la misma cosa vista desde
dos sitios**, y conviene hacerlas juntas o la primera se queda a medias.

Tamaño: mediano, y depende de los lotes. Decisión de Jose si se hace la versión
simple (último proveedor que trajo algo, mientras quede stock) o la de verdad
(por lotes).

### P2. 🔵 EL PARPADEO DEL DASHBOARD AL PASAR POR ENCIMA DE LA TARTA

> *"también hay que corregir el parpadeo del dashboard al hacer hover sobre el
> piechart."*

Anotado, sin tocar nada. Lo que sospecho sin haberlo medido: la gráfica de
Google redibuja en cada `mouseover` y arrastra consigo un recálculo de la
tarjeta que la contiene, así que el bloque entero parpadea en vez de sólo el
trozo resaltado. Hay que medirlo antes de arreglarlo.

### P3. 🔵 CÓMO TE CONTACTAN SIN PUBLICAR TU NÚMERO — Y HAY QUE DECIRLO CLARO

Jose, 24/10: *"no quiero publicar mi número de WhatsApp, quiero sólo un link que
le permita a los usuarios contactarme."*

**Lo primero, porque cambia la respuesta: `wa.me` ES tu número.** Un enlace de
WhatsApp se escribe `https://wa.me/1801XXXXXXX` — el número va dentro de la
dirección, en claro, y cualquiera que pase el ratón por encima lo lee en la
barra de estado del navegador sin pulsar nada. Un buscador también lo indexa. No
existe un enlace de WhatsApp que no lleve el número; eso no es una limitación que
se pueda rodear con un acortador, porque el acortador redirige a la dirección con
el número dentro. **Así que «un enlace de WhatsApp sin publicar el número» no se
puede hacer, y prefiero decirlo que entregarle algo que cree que esconde su
número y no lo esconde.**

Lo que sí se puede, en orden de lo que yo recomendaría:

1. **El enlace de Google Calendar, y que sea el camino principal.** Es lo que ya
   decidimos. El visitante elige un hueco, pone su correo, y a ti te llega la
   cita con su nombre y su teléfono — **el contacto va en la dirección contraria
   a la que te preocupa**: te lo dan ellos a ti. No publica nada tuyo. Hace falta
   el enlace: Google Calendar → **Horario de citas** → crear uno → **Compartir**
   → copiar el enlace público.
2. **El formulario de contacto que la página ya tiene.** Funciona hoy y no
   publica ningún dato tuyo. Su pega es real y es la que te hizo pedir esto: el
   camino muere en un correo y el visitante no sabe cuándo le van a contestar.
   Con el 1 puesto, esto pasa a ser la segunda opción para quien no quiere
   agendar, que también existe.
3. **Un número sólo para esto, si quieres WhatsApp de verdad.** Un segundo
   número —una eSIM de prepago, o Google Voice si está disponible— puesto como
   WhatsApp Business. Entonces el `wa.me` publica **ese** número y el tuyo sigue
   sin salir. Cuesta dinero y un trámite, y es la única forma honesta de tener
   «WhatsApp en la página» sin publicar tu número personal.

**Lo que NO haría:** un `wa.me` con tu número detrás de un botón que diga
«escríbenos». Oculta el número de la vista y no del navegador, y el día que
alguien lo copie de ahí la decisión ya no se puede deshacer.

**Hace falta de Jose:** el enlace del punto 1 (5 minutos), y decidir si además
quiere el 3. El 2 ya está puesto.

---

## 🎥 LO QUE SE VE EN LOS VÍDEOS DEL 23/10

**Vídeo del formulario** — confirma el punto I: la ventana de movimiento cambia
de alto al pasar de Entry a Transfer, y los botones de abajo saltan.

**Vídeo con DevTools (el de la última versión)** — tres datos medidos, no
supuestos:

| Dónde | Qué dice |
|---|---|
| Dashboard | **23 peticiones · 697 kB · DOMContentLoaded 9,2 s · Load 17 s** (con 3G puesto). Google Charts se descarga **aquí**, que es lo correcto desde la v12.89: es la única pantalla que lo necesita |
| Ajustes → Materials | **34 peticiones · 998 kB · finish 1,8 min** |
| Ajustes → System | **58 peticiones · 1,1 MB · finish 2,9 min** |
| Error Log | **70 peticiones** |

**Las peticiones crecen al andar por la app**, y casi todas son
`callback?nocache_id=…`, o sea `google.script.run`. Eso es exactamente lo que
alimenta el punto C: no es que cada pantalla sea cara, es que **nadie lleva la
cuenta de cuántas llamadas se hacen en total**.

**Y el Error Log del propio vídeo** fue la mejor fuente de la sesión. En él se
leen, con fecha:

- ✅ `WARN writeConfigColumns_: 257 duplicate name(s) were dropped from CONFIG
  column 1` y otro de 13 en la columna 3 — **la limpieza de la v12.93
  funcionando**, y sobre datos reales: 257 duplicados en proyectos.
- 🔴 **Seis** `SYSTEM_BUSY` seguidos como ERROR → **arreglado en la v12.95**.
- 🔴 Dos `Cannot set properties of undefined (setting 'forceSubmit')` →
  **arreglado en la v12.94**.

**Lo de Ajustes → Sistema en la gratis**, que Jose dijo que mandaría en vídeo:
**se ve en este**. La pestaña entera está en gris con la etiqueta «Acopio Pro»
— y ahí dentro está **la papelera**, que es donde el aviso de borrado te manda.
Es el punto 1 del barrido del 22/10, decidido y todavía sin hacer: **abrir la
papelera en la gratis, dejar el respaldo con candado**. Deja de estar pendiente
de un vídeo.

---

## 🔴 RONDA DEL 23/10 — LO QUE SALIÓ AL PROBAR LA v12.93

### A. ✅ **ARREGLADO EN LA v12.94** — decir «sí» en un aviso reventaba, y eran cinco

Jose devolvió 60 de algo que salió 49, pulsó «Save anyway» y la app reventó con
`Cannot set properties of undefined (setting 'forceSubmit')`. Las **cinco**
preguntas de «¿seguro?» de `submitMovement` llamaban a `_doSubmit` antes de que
`payload` existiera. Detalle en el commit de la v12.94 y en
`tools/test-seguro-que-si.js`.

---

### B. 🔴 **LA DEVOLUCIÓN MEZCLA DOS CLASES DE SITIO, Y ESO NO LO HABÍAMOS TRATADO**

Jose, 23/10, con una captura del formulario de RETURN, y es el hallazgo
conceptual más importante de la sesión:

> *"está mezclando dos categorías de locación distintas, y eso es un problema
> que no habíamos tratado: locaciones DENTRO de la bodega y FUERA. Cuando los
> materiales están en job-site están fuera de la bodega, no dentro. No debe
> sugerir ingresar ese nombre como una locación dentro de la bodega."*

En su pantalla, el campo **FROM (SITE OR ADDRESS)** lleva
`GHH SCENIC MOUNTAIN 4PLEX PHASE2` — una obra — y debajo sale:

> 📍 *GHH SCENIC MOUNTAIN 4PLEX PHASE2 is not a location in your warehouse yet.*
> **[+ Create GHH SCENIC MOUNTAIN 4PLEX PHASE2]**

**Y eso es ofrecerle crear una obra como si fuera una estantería.** Si lo pulsa,
su mapa de almacén gana un estante que no existe.

**La app tiene UN solo concepto de «sitio» y necesita DOS:**

| | Dónde vive | Ejemplos | Quién lo crea |
|---|---|---|---|
| **Dentro de la bodega** | Settings → Locations, sale en el mapa | `A1A`, `RACK 3`, `YARD` | el almacenero, a propósito |
| **Fuera de la bodega** | es una obra o una dirección | `GHH SCENIC MOUNTAIN 4PLEX PHASE2` | **nace sola** cuando sale material hacia allí |

Hoy el aviso de «esta ubicación no existe» no distingue, así que salta en un
campo donde **nunca** debería saltar.

### B-bis. 🔴 **«FROM» Y «CAME BACK FROM» SON LA MISMA PREGUNTA, DOS VECES**

Jose, y ya lo había dicho el 22/10:

> *"¿por qué hay un FROM y un CAME BACK FROM? Esas son la misma pregunta que
> espera dos datos diferentes, ya que la una muestra una lista diferente a la
> otra… Sólo debe haber UNA lista de lugares fuera de la bodega donde se envió
> ese material."*

Tiene razón entera. En su captura los dos campos llevan **el mismo texto**
escrito, y cada uno ofrece una cosa distinta:

- **FROM (SITE OR ADDRESS)** → ofrece crearlo como **ubicación de bodega**
- **CAME BACK FROM (PROJECT)** → *«New project — not on your list yet. + Add it»*

Y lo segundo también está mal por otro motivo que él señala: **si el material
salió hacia esa obra, la obra ya existe.** Ofrecer darla de alta es la prueba de
que la salida no la registró — o de que la lista de obras y el historial no se
hablan.

**Lo que yo haría, y es un rediseño pequeño de un campo:**

1. **Un solo campo**, el de dónde vuelve, con **una sola lista**: los sitios
   FUERA de la bodega donde ese material tiene cantidad pendiente — que es
   exactamente lo que `getOutstandingBySite` ya devuelve y lo que la lista
   flotante de la v12.82 ya enseña.
2. **Ningún «créalo como ubicación»** en ese campo. Nunca.
3. **La obra se da de alta sola al salir**, no al volver. Si al devolver sale
   «+ Add it», es un síntoma: hay que arreglar la salida, no ofrecer el parche
   en la devolución.
4. **RETURN TO RACK** se queda como está: ése sí es un sitio de dentro, y ahí el
   aviso de «no existe» es correcto y útil.

Tamaño: mediano. Toca el formulario de RETURN, el aviso de ubicación
desconocida, y la lista de obras. **No es sólo mover un campo**: es separar dos
conceptos que la app nunca separó, y por eso va con su propia entrada.

### B-ter. 🔵 «NAME / DESCRIPTION» debería decir sólo «Name»

Jose: *"primero debe decir sólo nombre, no nombre / descripción"*. De acuerdo:
lo que va ahí es el nombre del material; la descripción tiene su campo
(Comments). Cambio de una palabra, va con el B.

---

### C. 🔵 **«SYSTEM BUSY» NO DEBERÍA EXISTIR — la idea de Jose**

> *"¿hay forma de manejar mejor el System Busy? Mi idea es que la app nunca
> muestre ese mensaje, y para eso la app debe dividir el trabajo y hacer que
> cada cosa tenga un turno (ya la app lo hace en muchos lugares), pero no debe
> esperar a que el servidor le dé ese turno: la app calcula cuántos puede
> enviar al servidor para que no pase lo de System Busy y los envía en tandas.
> ¿No debe ser difícil, o sí?"*

**Es la dirección correcta, y la mitad ya está hecha.** La v12.92 hizo
exactamente eso para borrar: 490 peticiones pasaron a dos tandas, y el «Too many
requests» desapareció porque dejó de provocarse. Lo que pide ahora es
**generalizarlo**.

**Lo que es más fácil de lo que parece:**

- La app ya tiene las piezas: `_wq` (la cola de escrituras), `_delQueue`, el
  reintento con espera creciente, y ahora el troceado de `borrarFilasEnTanda_`.
- El límite del servidor **lo conocemos**: 240 llamadas por minuto
  (`requireQuota_`). No hay que adivinarlo.

**Lo que NO es tan fácil, y hay que decirlo:**

- `SYSTEM_BUSY` **no es lo mismo** que «demasiadas peticiones». Sale cuando
  **otra persona** tiene el candado del almacén. Ninguna cuenta que haga este
  navegador puede evitar eso: no sabe cuántas pestañas hay abiertas ni qué está
  guardando el de al lado. **Esa mitad no se puede eliminar, sólo esconder
  bien** — esperando turno y reintentando sin decir nada, que es lo que ya hace
  en los caminos que lo tienen cableado.
- Lo que **sí** se puede eliminar del todo es la parte que nos provocamos
  nosotros: las ráfagas. Y eso es contar antes de enviar.

**Así que el trabajo son tres piezas, y la tercera es la que pide Jose:**

1. **Un solo regulador para TODAS las escrituras**, no una cola por operación.
   Hoy hay `_wq` por un lado y `_delQueue` por otro, y el borrado en tanda por
   un tercero. Tres cosas que cuentan por separado no pueden respetar un límite
   común.
2. **Que ese regulador conozca el límite** y nunca lo pase: como mucho N
   llamadas por minuto, con la cuenta en el navegador. Si se llena, espera —
   **sin decir nada**, porque esperar no es fallar.
3. **Y que todo lo masivo vaya en tandas**, como ya va el borrado. Fusionar
   veinte nombres debería ser una llamada o dos, no veinte.

### C-bis. 🔵 **QUE NO SE NOTE LA DEMORA DEL SERVIDOR**

> *"visualmente el sistema debe ser más rápido y que no se note la demora del
> servidor. Si el servidor no hace algo, se le informa con una notificación.
> Pero primero debemos manejar las tandas."*

De acuerdo, y con su orden: primero las tandas, después lo visual. La app ya
hace esto en algunos sitios (la fila se va al pulsar, no al contestar el
servidor) y en otros no. **Lo que falta es hacerlo la regla y no la excepción**,
y eso es un repaso pantalla por pantalla, no un cambio.

---

### D. 🔴 **LO QUE FALLA EN LA GRATIS, DE SU REPASO**

1. **🏷 Labels sale a todo color después de una entrada.** Debe salir **gris** y,
   al pulsarlo, el mismo aviso de Pro que los demás. El candado está en
   `btnMovLabels`, pero el botón del aviso de guardado (**Print labels**) es
   otro y se quedó sin candado — **la misma falta de las zonas contra los
   botones**, una vez más.
2. **La pregunta de «¿también llegó esto?»** (entregas esperadas) **no debe
   salir en la gratis**: esa edición no tiene entregas esperadas.
3. **No sale ni una tarjeta en el mazo.** Jose: *"en la versión básica no
   aparece ninguna y eso me preocupa"*. Hay que mirar si es correcto (las de
   respaldo y archivado se filtraron a propósito en la v12.85) o si se cayó
   algo más con ellas.
4. **Ajustes → Sistema tiene un problema** — Jose dice que manda un vídeo.
   **Pendiente de ese vídeo**, anotado para no perderlo.

---

### E. 🔵 **LOS CAMPOS PLEGADOS, AL REVÉS**

> *"no puedo ver esa línea porque uso esos campos muy seguido. Debemos hacer que
> al comenzar esos campos estén detrás de ese botón y, si se los utiliza, se
> queden afuera; si no, se esconden otra vez."*

Hoy es al revés: nacen fuera y se pliegan cuando la bodega demuestra que no los
usa. Su versión es mejor para **una instalación nueva** —empieza con el
formulario corto— pero hay que tener cuidado con una cosa: con poca historia la
app no sabe nada, y esconder por defecto significa que alguien que SÍ los
necesita tiene que descubrir el botón el primer día.

**Propuesta:** plegados de entrada, y **basta con usar un campo UNA vez** para
que se quede fuera (hoy hace falta que aparezca en la historia reciente). Así la
primera entrada lo saca y ya no vuelve a esconderse. Decisión suya.

---

### F. 🔵 **UNA CAJA DE BÚSQUEDA EN EL MENÚ PRINCIPAL**

> *"había pensado que debemos poner una caja de búsqueda en el menú principal
> también, así si alguien quiere buscar algo puede escribir y aparece la opción
> rápido."*

Anotado. Es una búsqueda global: material, obra, proveedor, PO, movimiento,
ubicación — y al elegir, te lleva a la pantalla que lo enseña. Buena idea y
**grande**: no es una caja, es decidir qué se puede encontrar y a dónde lleva
cada cosa.

---

### G. 🔵 **EL TEXTO DE LOS TÉRMINOS, QUE DEBE CAMBIAR ENTRE EDICIONES**

> *"aún habla sobre las personas que trabajan aquí. Si es Acopio Básico, sólo
> una persona trabaja aquí y no se puede hacer nada con eso. Pero recuerda que
> entre Básico y Pro ese texto debe cambiar, no quedarse igual. El texto que
> teníamos antes me gustaba para Acopio Pro."*

Confirmado: queda una frase de la gratis que habla de «la gente que trabaja
aquí», que en una edición de una sola persona no significa nada. Y la regla
general que él pone es la importante: **ese texto es DOS textos**, no uno con
una rama olvidada. Va con el repaso de «ninguna frase nombra algo que su edición
no tiene».

---

### H. 🔵 **LAS TARJETAS DEL MAZO, CON SU ANIMACIÓN — diseño de Jose**

> *"si la que desaparece está arriba, desaparece, deja un hueco y la otra entra
> sin mover todas las tarjetas de abajo; si está en medio, deja un espacio, las
> de arriba bajan y la que entra entra arriba en el espacio; si está abajo,
> todas bajan y la que entra entra en el espacio. Las animaciones deben ser
> sutiles y pausadas (pero no lentas) para que el usuario las aprecie."*

Su diseño, anotado tal cual. La regla que lo resume: **el hueco que deja la que
se va es el hueco por el que entra la siguiente**, y nada que no tenga que
moverse se mueve.

---

### I. 🔵 **ESTANDARIZAR LAS VENTANAS DE MOVIMIENTO** (vídeo 2)

> *"vamos a estandarizar todas las ventanas de movimiento para que no salten o
> se muevan al cambiar entre ellas."*

Anotado. Hoy cada tipo (Entry, Exit, Transfer, Return, Waste, Adjust) enseña y
esconde campos distintos, así que la ventana cambia de alto al cambiar de
pestaña y los botones saltan. Es el mismo problema que ya arreglamos en las
columnas de las tablas, en otra pantalla.

---

### J. 🔴 **LA APP SIGUE TARDANDO EN ABRIR, Y EL MENÚ SE APAGA** (vídeo 3)

Jose: *"al iniciar se tarda mucho, casi igual que antes de que quitaras los
comentarios, y también el menú se apaga a los pocos minutos o luego de tocar
algo que es de la versión Pro."*

**Dos cosas distintas y las dos hay que mirarlas:**

- **La tardanza.** Ya medimos que la mayor parte del arranque es el sandbox de
  Apps Script, no nuestro archivo — pero «casi igual que antes» merece una
  medición nueva con la v12.94 pegada, no una explicación vieja.
- **«El menú se apaga».** Eso suena a algo nuestro y no lo tenemos
  identificado. *«Luego de tocar algo que es de la versión Pro»* es la pista
  fuerte: apunta a que algo de `_basicPintar` / `_proPitch` deja la barra en un
  estado del que no vuelve. **Hace falta saber qué menú** — el de arriba, el de
  la cuenta, o el de la hoja.

---

## 🥇 EL ORDEN EN QUE YO LO HARÍA — todo lo de la sesión del 22/10

Pedido por Jose: *"dame la lista de lo que arreglarías en el orden que lo
harías, desde el 1 hasta el último que hemos hablado en esta sesión."*

El criterio no es el tamaño ni el orden en que se contaron: es **qué pasa si no
se arregla**. Primero lo que pierde datos, luego lo que impide limpiar los
datos, luego el instrumento con el que se comprueba todo lo demás, luego lo que
le miente al cliente, y al final lo que molesta.

| Orden | Qué | Por qué ahí | Versión |
|---|---|---|---|
| **1** | **Importar pierde las filas pasada la 500** y el botón promete todas | Pérdida de datos silenciosa, hoy, en la captura de Jose. Nada más de esta lista destruye información | v12.91 |
| **2** | **El mismo fichero dos veces duplica el almacén**: avisar antes (huella) + **poder deshacer una importación** | Pregunta de Jose, y el agujero es real. El «Undo» es además lo que vuelve segura toda la función | v12.91 |
| **3** | **La pantalla de importar dice la verdad**: un solo número, todas las columnas que el fichero traía, qué va a crear ANTES de confirmar, y la suma antes/después | Es la otra mitad del 1: sin esto, el 1 se arregla y nadie puede comprobarlo | v12.91 |
| **4** | **«Send notification email» contesta sobre LEER el correo** — partir la oferta en dos, **y que la prueba mire las zonas igual que los botones** | Jose lo ve cada vez que abre la gratis, y es lo que yo di por auditado el 21/10 | v12.91 |
| **4-bis** | **Borrar en tanda: una petición, no 490** · por trozos · con **botón de parar** · «too many requests» como ocupado · avisos agrupados | Vídeos del 22/10: 490 borrados son 490 peticiones, **casi media hora**, 40 perdidas por nuestra propia cuota, y **no hay forma de pararlo**. Se cuela por delante de la fusión | **v12.92** |
| **5** | **Fusionar nombres, las dos mitades**: que acepte el cambio de grafía, y que la lista no pueda tener dos veces lo mismo | Los 28 grupos de Jose fallan **todos**, y la causa de fondo sigue rellenando la lista mientras no se tape | v12.93 |
| **6** | **El Error Log, en vivo y sin repintar** | Es el instrumento con el que se diagnostica lo demás. Va aquí y no antes porque el 1 y el 5 ya tienen su causa encontrada | v12.92 |
| **7** | **Un solo dueño de la visibilidad de las pestañas de ajustes** + **papelera abierta en la gratis** + **Import abierto (CSV)** | Las tres son el mismo mecanismo. Hacerlas por separado es garantizar que el duelo por `display` vuelva una cuarta vez | v12.93 |
| **8** | **Importar, de verdad**: ventana propia, ubicación por fila y por grupos, destildar filas, tarjeta de ubicaciones nuevas, «importa 20 de prueba» | Es la grande. Va después del 1-3 porque sobre una pantalla que miente no se construye nada | v12.94+ |
| **9** | **Materials (Ajustes)**, como las alertas de stock bajo | Trabajo de pantalla, sin nada roto debajo | — |
| **10** | **Directory (Ajustes)**, como la pantalla de usuarios | Igual, y además un nombre mal escrito aquí rompe un envío en silencio | — |
| — | ~~La página recortada~~ | ✅ **HECHA el 22/10** · 527 KB → 225 KB por la red | v12.90 |
| — | ~~El tope de 20 en «todos»~~ | 🔵 **Jose lo revisó el 22/10 y lo deja como está.** Pasa a «revisar más adelante»: los contadores que ya hay («x selected», «x of xx records») son la protección que yo iba a añadir | — |
| — | **Importar el HISTORIAL** (fechas, tipos de movimiento, quién) | 🔵 **Decisión de Jose.** No es una columna más, es otra función. Mi voto: sólo con un cliente real delante | — |
| — | **¿Se bloquea importar en el teléfono?** | 🔵 **Decisión de Jose.** Mi voto: no bloquear, avisar fuerte — y si se bloquea, que sea **después** del «Undo», no en lugar de él | — |

**Dos cosas que NO están en esta lista, y conviene decir por qué:** la tarjeta
de ajuste que no se puede borrar y los incomings por separado siguen anotados
más abajo — no se han caído, pero las nueve de arriba son todas de «la app
pierde algo o dice algo que no es verdad», y eso va antes que una función
nueva.

---

## 🚨 SEGUNDA RONDA DEL 22/10 — Y SALE UNA PÉRDIDA DE DATOS REAL

### 0. 🔴 **IMPORTAR PIERDE LAS FILAS A PARTIR DE LA 500, Y EL BOTÓN PROMETE TODAS**

**Esto no es un diseño que discutir. Es una pérdida de datos, hoy, y está en la
captura que Jose mandó esta tarde.** Pasa a ser lo primero de toda la lista.

En su pantalla se leen, a la vez, **cuatro números y ninguno es el mismo**:

> The file itself has **1053** non-empty line(s) · **1052 row(s) found** ·
> **1052 ready to import** · *Showing the first 100 of **500** rows.* ·
> **✓ Import 1052 Valid Row(s)**

Y el que manda es el que no se ve. El servidor
(`Code_v3_fixed.gs:9662`):

```js
rows: parsed.slice(0, 500)   // a preview, not a data dump
```

El navegador (`Index_v3_fixed.html:16347`):

```js
.withSuccessHandler(function(res){ _importParsedRows = res.rows || []; … })
```

Y al confirmar (`:16429`):

```js
var validRows = _importParsedRows.filter(function(r){ return r.valid; });
```

**El servidor creyó que mandaba una muestra. El navegador creyó que recibía los
datos.** Así que el botón que dice «Import 1052 Valid Rows» importa **500**, y
**552 filas de Jose se quedan fuera sin que nada lo diga**. El aviso final
dirá «Imported 500 rows» — contradiciendo al botón que se acaba de pulsar, un
segundo después, y para entonces el fichero ya se limpió de la pantalla.

**Vigésimo caso del patrón**, y el más caro de todos: dos cosas que tenían que
coincidir —cuántas filas se mandan y cuántas se van a guardar— sin que nada lo
obligara. El comentario del servidor **dice la verdad** («a preview, not a data
dump»); lo que falta es que el navegador lo supiera.

Y es justo lo que la nota de Jose sobre ETL llama *la prueba del ácido*:
**suma antes = suma después**. Hoy no hay ninguna comprobación de esas, y por
eso esto lleva ahí sin que nadie lo viera.

**El arreglo, en tres piezas y ninguna grande:**

1. **La previsualización deja de ser la carga.** Confirmar vuelve a mandar al
   servidor **el fichero**, no las filas; el servidor ya lo tiene parseado y
   sabe cuántas son. La muestra de 500 sigue siendo una muestra y nadie la
   confunde con los datos.
2. **Un número, no cuatro.** Si la muestra enseña 100 de 1052, que lo diga así:
   *«Showing the first 100 of 1052 rows»*. Hoy dice 500 porque cuenta lo que
   recibió, no lo que hay.
3. **La prueba del ácido, automática.** Después de importar, el servidor suma
   las cantidades que escribió y las compara con las del fichero. Si no cuadra,
   lo dice con los dos números — *«1052 rows, 48.310 units expected · 1052 rows,
   48.310 units written»*. Es una línea de cuenta y es lo único que convierte
   «confío en que fue bien» en «lo comprobé».

### 0-ante. 🔴 **EL MISMO FICHERO SUBIDO DOS VECES DUPLICA EL ALMACÉN, EN SILENCIO**

Jose, 22/10, antes de dejarme empezar: *"¿cómo maneja la app que alguien suba el
mismo archivo de inventario 2 veces? ¿Y si alguien se olvida y lo hace 2 veces?
No podemos dejar que eso pase, porque si bien eso es culpa del usuario, lo más
fácil para él será culpar a la app y hablar mal de ella y dejar de usarla."*

**Pregunta certera, y la respuesta es la mala.** Hoy no pasa nada: se importa
otra vez, entero. 1.052 filas más, existencias dobladas, y **ni un aviso**.

La causa está escrita y además está argumentada — `commitImport`, `:9695-9698`:

```js
// A bulk import legitimately contains similar-looking rows (same
// category, same rack, different SKUs entered close together); the
// duplicate guard exists to catch an accidental double-click, not this.
forceSubmit: true
```

Ese razonamiento es **correcto dentro de un fichero** y hay que conservarlo: en
un Excel real hay filas que se parecen y son distintas. Pero **apaga la guardia
para todo**, así que tampoco queda nada mirando *entre* importaciones. La
protección contra el doble clic se quitó, con motivo, y no se puso ninguna en
su lugar.

Y Jose pone el dedo en lo que de verdad cuesta: **da igual de quién sea la
culpa.** Quien ve su almacén con el doble de todo no piensa «subí el fichero
dos veces», piensa «esta app cuenta mal». Y de ahí no se vuelve.

**El arreglo son DOS mitades, y hacen falta las dos.**

**(a) Avisar antes — reconocer el fichero.**
Al importar se guarda una **huella** del fichero: número de filas, suma total
de cantidades y un resumen del contenido. Va donde ya se escribe el hecho,
en la entrada `BULK_IMPORT` del registro de auditoría — no hace falta almacén
nuevo. Al previsualizar, si esa huella ya está, la pantalla lo dice antes de
cualquier botón:

> ⚠ **You already imported this exact file 12 minutes ago** — 1.052 rows,
> 48.310 units, by jose@ox-glass.com.
> Importing it again **adds all of it a second time**; it does not replace
> anything.
> *[Cancel] [Import it again anyway]*

Y es la misma regla que Jose eligió para la devolución con sobrante el 21/10:
**avisar, dejar pasar y anotarlo.** No se bloquea, porque hay un caso legítimo
—importé, borré todo, lo quiero rehacer— y bloquearlo sería decirle a alguien
que no puede hacer con sus datos lo que quiere.

**(b) Poder deshacerlo después — y ésta es la que de verdad cierra el agujero.**
Un aviso sólo protege a quien lo lee. Quien pulse «anyway» sin pensar, o quien
lo haga desde otra cuenta, se queda hoy con **1.052 movimientos que habría que
borrar uno a uno**.

Cada fila importada ya lleva *"Imported from file"* en comentarios, pero eso no
distingue una importación de otra. Con **la huella escrita también en cada fila
de esa tanda**, aparece la operación que falta:

> Settings → System → **Last imports**
> · 22 Oct, 14:03 — 1.052 rows, 48.310 units — jose@ox-glass.com — **[Undo]**

«Undo» borra esa tanda, y **va a la papelera como cualquier otro borrado**, así
que ni siquiera deshacer es definitivo.

**Y (b) hace algo más, que es por qué la pongo en la misma versión que (a):**
es lo que vuelve **segura toda la función de importar**, en cualquier aparato y
con cualquier descuido. Con deshacer, una importación mal hecha desde el móvil
se arregla en un botón. Sin deshacer, ni una importación cuidadosa desde el
ordenador está a salvo — y ésa es también la respuesta a si bloqueamos el móvil
(ver 0-ter-bis).

### 0-bis. 🔴 LA PANTALLA ENSEÑA MENOS DE LA MITAD DE LO QUE IMPORTA

Jose: *"la información actual que me deja ver el visor de datos no es ni la
cuarta parte de los datos que ya maneja la app… faltan id, PM/encargado, PO,
supplier, etc."*

Tiene razón, y la parte que importa no es que falten: es que **se importan sin
verse**.

| | |
|---|---|
| El fichero **puede traer** (`IMPORT_ALL_HEADERS`, `:9546`) | category, name, qty, **unit**, location, **project**, **supplier**, **po**, **comments** — 9 |
| La previsualización **enseña** (`:16414`) | Row, Category, Name, Qty, Location, Issue — **5** |

Así que **unidad, obra, proveedor, PO y comentarios entran a la hoja sin que
nadie los haya mirado nunca**. Si la columna «Supplier» del fichero estaba mal
asignada, se descubre con 1.052 filas dentro.

Arreglo: la tabla enseña **todas las columnas que el fichero traía**, y sólo
ésas. Las que el fichero no tiene, no se dibujan — la tabla dice qué entendió.

### 0-ter. 🔵 ¿ESTÁ ACOPIO PREPARADO PARA MIGRAR UNA BODEGA ENTERA?

Jose, y es la pregunta correcta: *"¿qué pasa si el cliente quiere mover todos
los movimientos, materiales y demás información que ya tiene en su computadora
a Acopio? ¿Qué respondemos si nos pide eso, sin decirle que no sabemos nada?"*

**La respuesta honesta, medida en el código y no supuesta:**

| Lo que el cliente trae | ¿Entra hoy? |
|---|---|
| Qué hay, cuánto y dónde (**una foto del inventario**) | ✅ Sí |
| Categoría, unidad, obra, proveedor, PO, comentarios | ✅ Sí (pero no se ven — 0-bis) |
| **La fecha de cada movimiento** | ❌ No. `commitImport` pone **la de hoy** en todas (`:9675, 9686`) |
| **Qué fue cada movimiento** (entrada, salida, traslado, merma) | ❌ No. **Todo se guarda como ENTRY** (`:9679`) |
| **Quién lo recibió / el PM** | ❌ No. Se guarda **vacío**, a propósito (`:9694`) |
| **GC, estado, coste, documentos, fotos** | ❌ No se leen |
| **El historial** (lo que pasó, en orden) | ❌ **No.** Y es la consecuencia de las tres de arriba |

O sea: **Acopio sabe recibir una FOTO del almacén. No sabe recibir su
HISTORIA.** Y esas son dos cosas distintas, no una a medias.

**Lo que yo le contestaría a un cliente, sin mentir y sin decir «no sabemos»:**

> *"Acopio importa tu inventario actual: qué tienes, cuánto, de qué tipo, en qué
> estante, de qué obra y de qué proveedor. Eso queda cargado y listo para
> trabajar el mismo día. Lo que no traemos es el historial de los años
> anteriores — las entradas y salidas viejas se quedan en tu Excel, que sigue
> siendo tuyo. Acopio empieza a construir el historial desde el día que
> arrancas. Si necesitas que el histórico también entre, eso es un trabajo
> aparte y lo hablamos."*

Eso es verdad, se puede decir con la cara alta, y **convierte una carencia en
una línea de corte clara** — que es justo lo que un cliente necesita oír.

**Y lo que hay que decidir, Jose, porque es un producto distinto:**

- **(A) Importar una foto, bien hecho.** Es lo de los puntos 0, 0-bis y 5. Es
  lo que el 95% de los clientes necesita de verdad, y es lo que cierra una
  venta: trabajas desde el primer día.
- **(B) Importar el historial.** Significa leer `date`, `movetype`,
  `responsible`, `src`/`dest` y los movimientos de salida, y entonces aparecen
  preguntas que hoy no existen: ¿qué pasa si el historial deja un material en
  negativo? ¿Se recalculan las existencias desde los movimientos o se respeta
  la foto? ¿Se reconstruye en orden o de golpe? **Eso no es una columna más, es
  otra función.**

**Mi recomendación: (A) ahora, (B) sólo cuando un cliente lo pida y pague por
ello.** Porque (B) sin un cliente real delante es construir a ciegas sobre un
formato que nos inventaríamos nosotros — y la nota de Jose sobre ETL dice
exactamente eso en su punto 2: el mapeo se hace **contra el fichero del
cliente**, no contra uno imaginario.

### 0-ter-bis. ✅ IMPORTAR EN SU PROPIA VENTANA — idea de Jose, aceptada

Jose: *"tal vez sea mejor abrir una nueva ventana sobre la de Settings cuando
se lea el inventario del usuario, para poder manejar todo mejor y con más
espacio… así podemos darle más libertad en computadora para hacer el arreglo.
En teléfono no creo que sea bueno dejar esa opción, porque tal vez se cree
algún inconveniente al no ver bien y no arreglar todo bien."*

**La ventana: sí, y es necesaria, no cómoda.** Haz la cuenta de lo que esa
pantalla tiene que tener después del punto 7: una fila por material, **un
desplegable de ubicación en cada fila**, una casilla en cada fila, la barra de
«pon estas N en…», las nueve columnas del fichero, y el resumen de lo que va a
crear. Eso no cabe en el panel de Ajustes, que tiene la barra lateral comiéndose
la izquierda y deja unos 600 px. La app ya tiene ventanas a pantalla completa
—la de movimiento— y ése es el sitio.

**Lo del teléfono: su preocupación es correcta, pero yo no lo bloquearía.** Y
tengo un motivo concreto, no una preferencia:

- Bloquear deja un **callejón sin salida en el primer minuto**, en el aparato
  que la mayoría tiene en la mano. Es exactamente el argumento con el que
  decidimos abrir Import en la gratis: nadie compra un sistema que no pudo
  cargar. Cerrarlo en el teléfono se contradice con eso.
- Un fichero de 20 filas se importa perfectamente desde un teléfono. La regla
  «en teléfono no» castigaría ese caso por culpa del de 1.052.
- **Y sobre todo: lo que hace peligroso el teléfono no es la pantalla, es que
  no se pueda deshacer.** Con el «Undo» del punto 0-ante, una importación mal
  hecha desde el móvil se arregla en un botón. **La red de seguridad resuelve
  el miedo mejor que la prohibición**, y además resuelve el caso que la
  prohibición no toca: la importación mal hecha desde el ordenador.

**Lo que sí haría en pantalla estrecha**, que es su idea bien dirigida:

1. Una línea honesta arriba: *"Checking 1.052 rows is much easier on a computer
   — open Acopio there and come back to this screen."* Informa sin cerrar la
   puerta.
2. **La herramienta principal en el teléfono es el grupo, no la fila.** Con el
   pulgar no se eligen 1.052 ubicaciones una a una, pero sí se dice «todas las
   WINDOW a A1». La barra de grupos arriba, la tabla debajo para revisar.
3. Y si el fichero pasa de un tamaño razonable (pongamos 200 filas) en pantalla
   estrecha, el aviso sube de tono: deja de ser una línea gris y pasa a ser un
   cartel que hay que aceptar. **Avisar fuerte ≠ prohibir** — y es la misma
   regla que ya usamos en todo lo demás.

**Decisión pendiente de Jose:** si aun así prefiere bloquearlo en el teléfono.
Es su producto. Lo que pido es que, si se bloquea, sea **después** de que exista
el «Undo», no en lugar de él.

### 0-quater. ✅ LO QUE ME LLEVO DE LA NOTA DE ETL DE JOSE

La guía que mandó es correcta en general, pero **tres de sus cinco pasos ya no
nos tocan**, y conviene decir cuáles para no construir algo que ya existe:

- **«Nunca trabajes sobre la base original; guarda un ORIGINAL_NO_TOCAR»** → ya
  pasa solo. Acopio **no toca el fichero del cliente**: lo lee del navegador,
  lo parsea y escribe en la hoja. El Excel del cliente sigue intacto en su
  disco. Y los datos de Acopio viven en **la hoja de Google del propio
  cliente**, que ya tiene el historial de versiones de Google detrás.
- **«Asigna un ID temporal para rastrear»** → ya existe y es mejor: cada
  movimiento nace con su **`MOV_ID`** propio (`AC.MOV_ID`), y la importación
  además escribe *"Imported from file"* en comentarios. Se puede rastrear
  cualquier fila hasta su origen.
- **«Carga de prueba con 20 productos antes de la masiva»** → **esto SÍ nos
  falta y es barato**: un botón *«Import the first 20 as a test»* junto al
  grande. El cliente ve 20 filas en su app de verdad, comprueba que se ven como
  espera, y entonces pulsa el de 1.052. Lo anoto.
- **«La prueba del ácido: suma antes = suma después»** → **ésta es la que
  importa y es la que ya está en el punto 0.3.** Es la que habría cazado el
  fallo de las 500 el primer día.
- **«Estandarizar texto, quitar espacios, unificar mayúsculas»** → es
  **exactamente el punto 3** de este barrido, llegando por el otro lado: la
  lista de CONFIG con catorce copias del mismo nombre. Confirma que ese arreglo
  no es un parche, es la pieza de limpieza que falta.

---

### 1. 🔴 LA GRATIS DEJA BORRAR MOVIMIENTOS Y MANDA A UN SITIO QUE NO PUEDE ABRIR

Jose, vídeo 3: *"la app básica me permite borrar movimientos pero no me permite
devolverlos."*

Y tiene razón entera. El aviso de borrado dice, palabra por palabra
(`Index_v3_fixed.html:10043`):

> *They go to the trash, so you can put them back from Settings → System.*

La papelera **está** en Settings → System. Y en la gratis esa pestaña entera
está detrás del candado de Pro: `BASIC_PRO_AJUSTES = { system: 'respaldo' }`
(`Index_v3_fixed.html:28209`). Así que la frase manda a un sitio al que esa
edición no puede entrar.

**Es exactamente el fallo del menú Acopio, otra vez.** Dos cosas que tenían que
coincidir sin que nada lo obligara: el texto de un aviso y la lista de lo que
una edición lleva. La diferencia es que esta vez lo que se pierde no es un paso
de instalación — es **deshacer un borrado**, que es la red de seguridad entera.

Y hay que decidir cuál de las dos mitades se arregla, porque son productos
distintos:

- **(a) abrir la papelera en la gratis.** Es lo que yo haría. Deshacer un
  borrado no es una función de pago, es lo que hace que borrar no dé miedo. El
  candado de `system` se puso por el respaldo nocturno, que sí es de Pro; la
  papelera está en la misma pestaña por casualidad de maquetación, no por
  diseño. Se separa: papelera abierta, respaldo con candado.
- **(b) dejarlo cerrado y que el aviso diga la verdad** — *"this cannot be
  undone in this edition"*. Honesto, y convierte un borrado en algo definitivo
  en la edición que más se usa para probar. No me gusta.

Mi recomendación: **(a)**. Lo pequeño es (a); lo que vende es (a); y (b) hace la
gratis más peligrosa que la de pago para la operación más frecuente.

> ✅ **JOSE, 22/10: *"sí hazlo así, que sí se pueda devolver un borrado."*** →
> Se separa la pestaña `system`: la **papelera** se abre en la gratis, el
> **respaldo** sigue con candado. Y el candado de `system` deja de ser de la
> pestaña entera para ser de la sección que de verdad es de pago.

Hay una **tercera mitad del mismo asunto, y es nueva**: en la gratis la pestaña
`system` está con candado, y la papelera, el reconstructor y el registro de
errores **se dibujan igual por debajo**. Lo que falta no es sólo el candado:
hace falta una prueba que recorra **cada frase de la app que nombra un sitio**
(«Settings → X», «the Acopio menu», «Set Up») y compruebe que ese sitio existe
en la edición que va a leer la frase. Es la única forma de que esto no vuelva
una cuarta vez.

---

### 2. 🔴 PERMISSIONS VUELVE EN LA GRATIS — Y LA CAUSA ES UN DUELO POR `display`

Jose, imagen 1: *"creo que ya te hice esta pregunta y no recuerdo tu respuesta,
¿por qué aún hay Permissions en la copia básica?"*

Me la hizo el 19/10, la arreglé, y **volvió**. Esta vez con la causa en la mano:

- `BASIC_FUERA.ajustes = ['permissions', 'pmdirectory', 'import']`
  (`Index_v3_fixed.html:28181`) — la lista es correcta.
- `_basicPintar()` (`:28655`) pone `display='none'` a esas tres. Correcto.
- **Pero `_basicPintar()` corre UNA vez**, al aplicar el rol (`:28773`).
- Y `openSettingsModal()` llama a `_filterSettingsSidebar()` **en cada apertura**
  (`:14532`), que hace esto (`:14574`):

```js
btn.style.display = (isAdmin || SETTINGS_CATALOG_TABS[tab]) ? '' : 'none';
```

Para un ADMIN eso escribe `''` en **todas** las pestañas. Incluidas las tres que
la gratis había escondido. La primera vez que Jose abre Ajustes, vuelven las
tres — no sólo Permissions: **también Directory e Import**, que él no ha
mencionado porque seguramente no llegó a mirarlas.

**Décimo-octavo caso del patrón.** Y la tercera vez que aparece como «dos
funciones mandan sobre el mismo `display` y gana la última»: `_escPintarBoton`
contra `_basicPintar` el 19/10, la ✕ contra el ancho del campo el 21/10, y ésta.

#### 2-bis. 🔵 ¿Y CUÁL DE LAS TRES SE ABRE? — pregunta de Jose, contestada

Jose, 22/10: *"¿dejamos Import abierto para la básica y lo demás cerrado sólo
para Pro, o lo dejamos todo sólo para Pro? Pienso que poder usar tus propios
datos de tu bodega es una cosa muy buena y no sé si es demasiado buena como
para cobrar por ella, o buena como para que el usuario la pueda usar desde el
principio. Analiza los pros y contras."*

**Primero, el hecho técnico, porque cambia la pregunta:**

| | CSV | Excel (.xlsx) |
|---|---|---|
| Lo que usa | `Utilities.parseCsv` — **núcleo de Apps Script, cero permisos** | `UrlFetchApp` → Drive v3 + `DriveApp` |
| Permisos que pide | ninguno | `drive` + `script.external_request` |
| ¿Funciona en la gratis? | **Sí, hoy, tal cual** | **No, y no puede** |

El manifiesto de la gratis pide **un solo permiso**:
`spreadsheets.currentonly`. Añadir `drive` para que entre el Excel traería
exactamente la pantalla de aviso de Google que la edición gratis existe para
evitar. Así que «Excel sólo en Pro» no es una decisión de precio que nos
inventemos: **es una consecuencia del modelo de permisos de Google**. Eso lo
convierte en la mejor clase de límite que existe — uno que es verdad.

**A favor de abrir el CSV en la gratis:**

1. **Es el momento en que alguien adopta el producto.** Una app vacía es una
   demostración; una app con SUS 600 materiales dentro es SU bodega. El salto
   de «estoy probando esto» a «éste es mi sistema» ocurre en la importación, no
   antes.
2. **El coste de irse que crea juega a nuestro favor.** Una vez dentro sus
   datos, marcharse es volver a teclear. Es la retención más fuerte que puede
   comprar una edición gratis, y no nos cuesta nada por cliente.
3. **Nadie compra un sistema de bodega que no pudo cargar.** Pedirle que teclee
   600 filas a mano antes de poder juzgarlo es pedirle el trabajo más duro a
   cambio de nada.
4. **No nos cuesta dinero.** Y ésa es la línea que separa lo de pago de lo
   gratis mejor que ninguna otra: respaldo (Drive), correo (cuota), lectura de
   facturas (nuestra clave de IA) y usuarios **nos cuestan**. El CSV corre en
   la cuota de Apps Script del propio cliente, en su propia hoja. **Coste
   marginal cero.**
5. **Desbloquea lo que llevamos un año sin hacer: migrar un Excel de verdad.**
   Si importar es de pago, toda prueba de la gratis empieza vacía y nunca
   aprendemos qué le hace un fichero real a la app.

**En contra, y es real:**

1. Alguien podría importar, usar la gratis para siempre y no pagar nunca. Pero
   ¿qué NO tiene? Usuarios, permisos, respaldo, etiquetas, fotos, correo, IA,
   llegadas, mínimos, escáner. **Una bodega de una persona que sólo necesita
   una lista no era un cliente que fuéramos a tener**: habría usado una hoja de
   cálculo.
2. **El riesgo de soporte es el argumento serio.** Importar es lo que más
   fácilmente sale mal con los datos desordenados de otro, y la gratis no tiene
   correo para avisarnos. Pero eso no dice «ciérralo»: dice **«arregla el punto
   5 antes de abrirlo»**.
3. **Media importación es peor que ninguna.** Si la pantalla se abre y el
   selector acepta un `.xlsx` que después revienta con un error de permisos,
   eso es peor que un candado.

**Mi recomendación, en tres líneas:**

- **`import` → abierto en la gratis, sólo CSV.** El selector acepta `.csv` y
  dice en una línea por qué el Excel no: *"Excel files need the Pro edition —
  save your file as CSV and this works."* Verdad, corta, y vende sola.
- **`permissions` y `pmdirectory` → siguen fuera, pero NO como candado de Pro.**
  Y esto es lo que me parece que faltaba en la pregunta de Jose: **esas dos no
  están escondidas por precio, están escondidas porque en una edición de una
  sola persona no significan nada**. No hay usuarios a quien repartir permisos
  ni jefes de obra a quien avisar. Ponerles un candado anunciaría algo que, aun
  desbloqueado, no haría nada — y eso enseña a desconfiar de todos los demás
  candados.
- O sea: **las tres pestañas están fuera por dos motivos distintos, y sólo uno
  de los dos es un precio.**

---

> **Jose, 22/10: *"no entiendo esto, explícame."*** (sobre por qué el dueño
> único, la papelera y el Import van juntos y no por separado)
>
> **No son tres cosas: son una regla y tres decisiones que dependen de ella.**
>
> El fallo de este punto es que **dos funciones escriben `display` sobre los
> mismos botones** y gana la que corra última. `_basicPintar` esconde tres
> pestañas; `_filterSettingsSidebar` las vuelve a enseñar todas para un ADMIN.
> Ninguna de las dos sabe que la otra existe.
>
> Ahora mira lo que decidimos hoy: **abrir la papelera en la gratis** es cambiar
> esa misma regla. **Abrir Import en la gratis** es cambiar esa misma regla
> otra vez. Son tres cambios a lo mismo.
>
> Si los hago por separado, cada uno añade **otro sitio que escribe `display`**
> sobre esos botones: pasaría de dos dueños a cuatro. Y con cuatro, quién gana
> depende del orden en que se llamen — que es exactamente cómo esto ya volvió
> dos veces.
>
> Si primero hago **el dueño único** —una función que conteste «¿se ve esta
> pestaña?» mirando las tres reglas a la vez: rol, permiso y edición— entonces
> abrir la papelera es **una línea** en esa función, y abrir Import es **otra
> línea**. Las dos decisiones quedan escritas en un sitio donde nadie puede
> contradecirlas por accidente.
>
> Dicho en corto: **hacer primero la regla cuesta lo mismo y hace imposible la
> cuarta vez.** Hacer las tres sueltas es barato hoy y garantiza volver aquí.

---

El arreglo barato es llamar a `_basicPintar()` al final de
`_filterSettingsSidebar()`. **No lo haría así**, porque deja el duelo en pie y
el que gane dependerá del orden de las llamadas para siempre. Lo correcto es que
haya **un solo dueño** de la visibilidad de una pestaña de ajustes: una función
que conteste `¿se ve esta pestaña?` mirando las tres reglas a la vez (rol,
permiso, edición), y que las dos de ahora la llamen en vez de decidir por su
cuenta. Es la misma forma que arregló `tipoDeMovimiento_` cuando había cuatro
copias que se habían ido separando.

---

### 3. 🔴 FUSIONAR NOMBRES FALLA EN EL CASO MÁS COMÚN DE TODOS

Jose, vídeo 2 e imagen: *"error al intentar hacer merge de proyectos y
suppliers: Pick at least one other name to merge in."*

**Causa localizada.** El servidor, `Code_v3_fixed.gs:13705`:

```js
var from = (data.from || []).map(function (v) { return String(v || '').trim(); })
                            .filter(function (v) { return v && v.toUpperCase() !== into.toUpperCase(); });
if (!from.length) throw new Error('Pick at least one other name to merge in.');
```

Y el detector de parecidos, `Index_v3_fixed.html:17243`:

```js
function _cfgSimilar(a, b){
  var na = _cfgNorm(a), nb = _cfgNorm(b);   // _cfgNorm pone MAYÚSCULAS y quita puntuación
  if (na === nb) return true;
```

Los dos están bien por separado y **se contradicen**: el navegador propone como
duplicados dos nombres que se diferencian **sólo en mayúsculas o en espacios de
los extremos** — `"Acme Glass"` y `"ACME GLASS"`, `"PAT BME2 "` y `"PAT BME2"` —
y el servidor, al compararlos en mayúsculas y recortados, los ve iguales, vacía
`from` y se niega.

**Y ésas son las dos formas más comunes que tiene un duplicado.** La función que
existe para unir nombres mal escritos se niega justo en el error de escritura
más frecuente. Pasa en los dos caminos: en la lista de sugerencias
(`:17345`) y en la selección a mano (`:17186`).

**Diecinueve. Y es la peor forma del patrón**, porque las dos definiciones de
«el mismo nombre» están escritas en archivos distintos y ninguna sabe de la
otra.

El arreglo es cambiar qué significa esa negativa. Hoy el servidor dice *«no me
has dado otro nombre»*; la verdad es *«los nombres que me diste son el mismo
texto con otras mayúsculas»*, y ante eso lo correcto **no es negarse: es hacer
el cambio de grafía**, que es literalmente el trabajo de esta función. La lista
de CONFIG tiene dos filas, se quedan en una, y el historial se reescribe con la
grafía que Jose eligió. Sólo cuando `from` llega vacío **de verdad** (una sola
cosa seleccionada) tiene sentido el aviso — y entonces el botón no debería estar
pulsable, que es donde se avisa de verdad.

#### 3-bis. ✅ EL VÍDEO DEL 22/10 CONFIRMA LA CAUSA — Y ENSEÑA UNA SEGUNDA, PEOR

Jose mandó el vídeo. Lo que se ve, fotograma a fotograma:

- Ajustes → **Projects**: *«20 possible duplicate projects found»*. El primer
  grupo es **«ASPEN HOLLOW LOT 14» catorce veces**. El segundo, «BIRCH POINT
  DUPLEX» trece veces.
- Ajustes → **Suppliers**: *«8 possible duplicate suppliers found»*. «BLUE MESA
  DISTRIBUTION» ×3, «CASCADE GLASSWORKS» ×3, «IRONWOOD WINDOWS» ×3, «NORTHGATE
  SUPPLY» ×3, «FOUR PEAKS MILLWORK» ×2, «REDROCK BUILDING PRODUCTS» ×2…
- Pulsa Merge en uno. Sale: **«Merge failed: Pick at least one other name to
  merge in.»** Pulsa en otro. Lo mismo.

**Los nombres de cada grupo se ven IDÉNTICOS en pantalla.** No hay
`text-transform` en `.sim-opt`, así que se muestran tal como están guardados. Y
`loadConfig` los recorta al leerlos (`Code_v3_fixed.gs:2802`), así que para
cuando llegan al navegador son **la misma cadena, carácter por carácter**.

Eso confirma la causa y la agranda: no es que fallen *algunas* fusiones. Son
**las 28, todas**, porque los 28 grupos son duplicados exactos. La única
herramienta que hay para limpiar esto se niega en el 100% de los casos que
tiene delante.

**Y aparece la segunda causa, que es la de verdad:** ¿quién metió catorce filas
idénticas en CONFIG? **Nada en el camino de escritura comprueba duplicados**:

- `loadConfig` (`:2802`) empuja cada fila sin mirar si ya está.
- `writeConfigColumns_` (`:1432`) escribe lo que le den, tal cual.
- El asistente de instalación (`:1297-1299`) vuelca los arrays del navegador
  sin filtrar.
- El **único** sitio que sí lo comprueba es el botón «añadir» de Ajustes
  (`updateConfig`, `:13924`), que rechaza duplicados sin distinguir mayúsculas.

O sea: la puerta de delante está cerrada con llave y las tres de atrás están
abiertas. Es el mismo patrón otra vez — una protección escrita una vez y no
aplicada en los demás caminos. Van **cinco** casos de esta forma concreta.

**Así que el punto 3 son dos arreglos, no uno:**

1. **Que la fusión acepte el caso.** Cuando `from` se queda vacío porque los
   nombres son el mismo texto con otras mayúsculas o espacios, lo correcto no
   es negarse: es **hacer el cambio de grafía**, que es literalmente el trabajo
   de esta función. Sólo cuando se eligió una sola cosa tiene sentido avisar —
   y entonces el botón no debería estar pulsable.
2. **Que la lista no pueda tener dos veces lo mismo.** Un solo sitio por el que
   pase toda escritura a CONFIG y que quite los repetidos sin distinguir
   mayúsculas. Con eso, los 28 grupos de Jose desaparecen solos y no vuelven.

Y una tercera, pequeña, que el vídeo deja ver: **un grupo de catorce nombres
idénticos pide elegir «cuál conservar» entre catorce opciones que se ven
iguales.** Es una pregunta imposible de contestar. Si son el mismo texto, no
hay nada que elegir: el botón debería decir *«Son el mismo nombre escrito 14
veces — dejar uno»* y ya está.

---

### 4. 🔴 EL REGISTRO DE ERRORES ES UNA FOTO, NO UNA VENTANA

Jose, vídeo 2: *"al intentar hacer merge de suppliers y de proyectos y salir el
error, esos errores no se guardan en Error Log, no sé por qué."*

**Se guardan.** Sus propias líneas pegadas lo demuestran: hay filas
`backend/mergeConfigValues` con sus identificadores. `processMovement` registra
**todo** lo que falla, en el único sitio por el que pasan todas las acciones
(`Code_v3_fixed.gs:3766-3772`), y el mensaje de la fusión no coincide con
ninguno de los patrones de «esto es la app negándose bien»
(`VALIDATION_MESSAGE_PATTERNS`, `:10161`), así que se archiva como ERROR.

Lo que no funciona es **la pantalla**. `_renderErrorLogTab()`
(`Index_v3_fixed.html:17428`):

```js
if (_errorLogData) { _drawErrorLog(); return; }
```

`_errorLogData` se trae **una sola vez**, cuando se abre Ajustes
(`:14680`). Después, entrar en la pestaña nunca vuelve a preguntar. Y es
justo la secuencia de Jose: abre Ajustes → fusiona → falla → se va a Error Log
**sin cerrar Ajustes** → ve la lista de antes del error.

Y hay una segunda mitad: `var _errorLogData = [];` nace **lista vacía, que es
verdadera**, así que ese `if` nunca pide nada por sí mismo. Lo único que lo
pone a `null` es el `if (!quiet)` del precargado. Un registro de errores que
sólo se refresca cerrando y abriendo la ventana es un registro en el que no se
puede confiar — y es la herramienta con la que se diagnostica todo lo demás, así
que su fallo multiplica el de los otros siete puntos.

Arreglo: la pestaña pide la lista **cada vez que se entra**, enseñando lo que ya
tiene mientras llega lo nuevo (igual que el refresco silencioso de Ajustes, para
que no parpadee). Y un botón de recargar visible, porque ésta es la pantalla en
la que alguien está esperando a que aparezca una fila.

> ✅ **JOSE, 22/10: *"tienes razón, debemos arreglar eso. Los errores deben
> actualizarse de inmediato sin repintar toda la pantalla o ventana, sólo la
> fila que falta."*** → Y añade una condición que yo no había puesto: **no se
> repinta la tabla**. Se compara lo que llega con lo que hay —el `requestId` es
> único por fila, así que sirve de identidad— y se **inserta arriba sólo lo
> nuevo**, con la misma animación de entrada que usan la papelera y la baraja.
> Es el mismo mecanismo que ya arregló «Restoring…» en la papelera: la pantalla
> se dibuja desde una lista, no desde cero, así que un cambio no borra lo que
> estabas mirando.
>
> Y hay un motivo técnico que lo hace aún más necesario de lo que parece: el
> error **sale en la misma ventana de Ajustes en la que estás trabajando**. Un
> repintado te sacaría de la pestaña, te movería el scroll, y perderías de vista
> justo el grupo de duplicados que acabas de intentar fusionar.

---

### 5. 🔴 IMPORTAR SIN UBICACIÓN DEJA EL MATERIAL EN UN CAJÓN QUE NADIE PUSO

Jose, vídeo 1: *"al importar un archivo a la app, no se le da una ubicación, y
no hay una forma de manejar la falta de ubicaciones para todos los datos sin
ubicación. ¿Cómo lo hacemos fácil pero efectivo y controlado para nosotros y
para el usuario?"*

**Lo que pasa hoy, comprobado:**

1. `location` es una columna **opcional** del fichero
   (`Code_v3_fixed.gs:9546`); sólo `category`, `name` y `qty` son obligatorias.
2. `commitImport` escribe `destLoc: r.location || ''` (`:9688`).
3. El motor de existencias archiva lo que llega sin sitio bajo la clave
   `'UNASSIGNED'` — en seis puntos distintos del código
   (`:3481`, `:5234`, `:5686`, `:8013`…).
4. `UNASSIGNED` **no aparece ni una vez en el navegador**. No es una ubicación
   configurada: es una palabra del motor.
5. Y el mapa dibuja «cualquier sitio visto en el stock», así que aparece una
   tarjeta llamada **UNASSIGNED** que no está en Settings → Locations, no se
   puede renombrar, no se puede agrupar, y nada en la app dice qué es.
6. La pantalla de importar **no pregunta nada** sobre esto: ni al previsualizar,
   ni al confirmar. El resumen final cuenta las ubicaciones que creó
   (`newLocations`) y **no cuenta las filas que se quedaron sin ninguna**.

Así que el primer minuto de un cliente que importa su Excel —que es el minuto
que decide si compra— puede acabar con la mitad de su almacén en un cajón con
nombre de variable interna.

**Lo que yo haría, y es tres cosas pequeñas en vez de una grande:**

- **(a) Contarlo antes, no después.** La previsualización ya dice cuántas filas
  son válidas; que diga también **«N filas no traen ubicación»**, con el mismo
  rango que los demás avisos. Nada que decidir: es información que ya tenemos y
  no estamos dando.
- **(b) Una sola pregunta al confirmar, con tres respuestas.** *«¿Dónde van las
  N filas sin ubicación?»* → **elegir un sitio para todas** (desplegable de las
  ubicaciones que ya existen, más «crear una nueva»), **repartirlas después**, o
  **dejarlas sin sitio**. Una pregunta, tres botones, y la respuesta se aplica a
  todas: eso es lo «fácil» que pide Jose, y el control está en que la pregunta
  existe en vez de decidirse en silencio.
- **(c) Si elige «repartir después», que el sitio donde esperan tenga nombre y
  salida.** No `UNASSIGNED`: una ubicación de verdad, creada por la app, con un
  nombre que se entiende —**`RECEIVING`** es mi propuesta, porque es lo que de
  verdad es: material recibido y todavía sin colocar— y desde la que se puede
  mover con el traslado que ya existe. Y una tarjeta en la baraja que diga
  cuántas filas están ahí esperando, que es el mecanismo que ya usamos para «la
  app tiene algo pendiente contigo».

Lo que **no** haría: obligar a poner ubicación en el fichero. Un cliente que
está migrando su Excel a menudo **no la tiene**, y rechazarle la importación por
eso es perderlo en el primer minuto. Recibir sin saber todavía el estante es un
caso real y el motor lleva soportándolo desde siempre (`:4472`) — el fallo no es
que se permita, es que después no hay salida.

**Decisión de Jose:** si (c) va con `RECEIVING` como ubicación de verdad o si
`UNASSIGNED` se queda y lo que cambia es sólo que la app lo explique. Yo voto
`RECEIVING`: una palabra que el almacenero reconoce, contra una que es del
programa.

#### 5-ter. 🔵 LA PREGUNTA DEL 24/10, Y LA RESPUESTA — ES UNA SOLA PANTALLA

Jose, 24/10:

> *"Sobre esto no tengo respuesta, ya que no entiendo cómo podemos después
> arreglar todo eso de una sola vez. Recuerdo que habíamos quedado en que desde
> el 'import' íbamos a arreglar todo lo que necesitamos, ¿o no? La nueva ventana
> y la opción de elegir locaciones internas en los registros antes de importarlos
> realmente, también poder hacerlo por tandas o grupos. No quiero decidir algo
> sin que me des ideas sobre esto o me digas qué es lo que mejor va a
> funcionar."*

**No puede contestar porque la pregunta está mal hecha, y la hice yo.** Le pedí
que decidiera entre `RECEIVING` y `UNASSIGNED` como si fuera una decisión suelta.
No lo es: **es la última línea de una pantalla que todavía no existe**, y
decidirla antes de construir la pantalla es decidir el color de una puerta antes
de saber si va a haber pared.

`RECEIVING` lo propuse para el diseño VIEJO —una pregunta al final, «¿dónde van
las N huérfanas?»— donde el usuario llega al final con filas sin sitio porque
nunca se le preguntó. En el diseño de Jose, el de 5-bis, **no se llega ahí**: la
ubicación se elige ANTES de escribir nada, fila por fila o por grupos. Las dos
propuestas se solapan y la suya gana.

**Lo que yo haría, en una frase:** construir la pantalla de 5-bis, y que
`RECEIVING` sea **la única salida de emergencia**, imposible de pisar por
accidente.

Una pantalla, cuatro cosas, en este orden, y **cada una se puede publicar sola**:

| | Qué | Por qué en ese orden | Tamaño |
|---|---|---|---|
| 1 | **Ventana propia** para importar, en vez de dentro de Ajustes | Todo lo demás necesita sitio en pantalla. Hoy la previsualización vive dentro de una pestaña de Ajustes y no cabe una tabla editable. **En el teléfono no se abre**: migrar un Excel no es trabajo de teléfono, y fingir que sí es prometer una pantalla que no funciona | mediano |
| 2 | **Columna Location editable**, y marcar y actuar por grupos | Es el corazón. *"Es su bodega, lo único nuevo es el programa, no las ubicaciones"* | mediano |
| 3 | **Casillas por fila**, todas marcadas de entrada, con el botón contando lo marcado | Es lo que convierte «todo o nada» en «esto sí y esto no». Sin esto, una errata obliga a volver al Excel | pequeño |
| 4 | **`RECEIVING` como salida, y sólo como salida** | Lo último porque sólo tiene sentido cuando ya hay dónde elegir | pequeño |

**Y la cuarta, en detalle, porque es la que él no podía decidir:**

- Si al confirmar **queda alguna fila sin ubicación**, la app lo dice con el
  número y **no deja seguir** sin tocar un botón: *«12 rows have no location.»* →
  **[ Put them all in… ]** (desplegable) · **[ Leave them in RECEIVING ]** ·
  **[ Go back ]**.
- `RECEIVING` se crea como **ubicación de verdad** —existe en Settings →
  Locations, sale en el mapa, se puede trasladar desde ella con el traslado que
  ya existe— y **nace sólo si alguien la pide**. Una instalación donde todo el
  mundo pone sus ubicaciones nunca la ve.
- Y **una tarjeta en la baraja** mientras quede algo ahí: *«14 items received
  and not yet put away»*. Es el mecanismo que ya usamos para «la app tiene algo
  pendiente contigo», y es lo que impide que se convierta en un cajón de olvidos
  como lo era `UNASSIGNED`.
- `UNASSIGNED` **desaparece del código**. Está escrito a mano en seis puntos
  (ver arriba), que es exactamente la forma que ya nos ha costado veinte veces:
  pasa a ser **una constante**, y la prueba cuenta que no haya ninguna copia
  suelta.

**Por qué esto no es «arreglarlo todo de una sola vez»** —que es lo que le
preocupaba—: las cuatro se publican por separado y en ese orden, y **ninguna
deja la app peor que ahora** si las siguientes tardan. Con la 1 sola, importar
ya tiene sitio. Con la 2, la ubicación se elige. Con la 3, se puede dejar algo
fuera. La 4 sólo recoge lo que quede.

**Lo que hace falta de Jose:** nada todavía. Esto se construye y se le enseña.
La única decisión que queda de verdad es el **nombre** —`RECEIVING` o lo que en
su bodega se llame el sitio donde se deja lo que llegó y no se ha colocado—, y
ésa se contesta mejor viendo la pantalla que leyendo esto.

#### 5-bis. ✅ EL REDISEÑO DE JOSE, 22/10 — ES MEJOR QUE EL MÍO, SE ADOPTA

Jose: *"¿qué tal si al seleccionar un documento y subirlo para leerlo, la app
hace lo mismo pero le da la opción al usuario de elegir la ubicación nueva o
actual de cada uno de los materiales que está por subir? Al fin y al cabo es su
bodega, y lo único nuevo es el programa, no las ubicaciones. Entonces elige las
ubicaciones una por una o por grupos, y también le permitimos subir los datos
uno por uno. ¿Y qué pasa si los datos del usuario ya vienen con ubicaciones
establecidas pero no están en la lista de ubicaciones de la app?"*

**Tiene razón y mi versión era peor.** Yo proponía UNA pregunta al final
(«¿dónde van las N huérfanas?»). Él convierte la previsualización en **el sitio
donde colocas tu bodega**, que es lo que esa pantalla tenía que haber sido
siempre. La tabla ya existe, ya enseña todas las filas, ya tiene columna de
validez: añadirle **una columna de Ubicación con desplegable** es el cambio más
pequeño posible sobre el problema más grande.

Y la frase que lo decide es suya: **«es su bodega, lo único nuevo es el
programa, no las ubicaciones»**. Yo había escrito que crear ubicaciones desde
el fichero era peligroso. Al revés: si el fichero dice `A1`, `RACK 3`, **ésas
son sus estanterías**. Crearlas es lo correcto. Lo que faltaba es que las
**vea antes** de que pase, para poder corregir una errata — porque una errata
en el fichero se convierte en un estante fantasma permanente.

**Lo que se adopta tal cual:**

- Columna **Location** editable en la previsualización.
- **Por grupos, y eso no es un extra: es lo que lo hace usable.** 600 filas de
  una en una no es migrar, es teclear — exactamente de lo que les estamos
  salvando. Y los grupos no hay que inventarlos: son **los que el fichero ya
  trae** — por categoría («todas las WINDOW a A1»), por obra, por proveedor, o
  por la ubicación que el fichero ya lleva. Seleccionar filas → *«Put these
  in…»* → un desplegable. Es **la misma barra de marcar‑y‑actuar que
  Movements ya tiene**; no hay nada nuevo que inventar.
- Las ubicaciones del fichero **que no existen se crean**, con los nombres del
  fichero.

**Donde discrepo, y es poco:**

1. **«Subir los datos uno por uno»** — eso ya existe y se llama **Entry**, y es
   mejor que un importador fila a fila. Lo que sí hace falta, y da el mismo
   control sin una pantalla nueva: **poder destildar filas** en la
   previsualización para dejarlas fuera de esta importación.

   > **Jose, 22/10: *"explícame más sobre esto, no entiendo bien."***
   >
   > La previsualización de hoy es **todo o nada**: enseña las 1.052 filas y el
   > único botón es «importar las 1.052». Si tres de ellas están mal —un
   > material que ya no existe, una obra terminada, una cantidad que sabes que
   > está mal contada— **no hay forma de dejarlas fuera** salvo abrir el Excel,
   > borrarlas allí, guardarlo y volver a subirlo.
   >
   > «Destildar» es poner **una casilla al principio de cada fila**, marcadas
   > todas de entrada. Quitas la marca de esas tres, y el botón pasa a decir
   > **«Import 1.049 rows»**. Las tres se quedan en el fichero, intactas, para
   > otro día.
   >
   > Por qué lo propongo en lugar de «subir uno por uno»: **es la misma idea
   > tuya —decidir fila a fila qué entra— pero al revés**, y al revés es mucho
   > menos trabajo. «Uno por uno» son 1.052 decisiones; destildar son 3. Y es
   > la misma casilla que Movements ya tiene, así que no hay nada nuevo que
   > aprender ni que construir.
   >
   > Decisión tuya: esto, o un importador fila a fila de verdad.
2. **«Las que no existen se ponen en una lista para agregarlas luego»** —
   cuidado: eso sería una segunda lista de pendientes, y la app ya tiene una (la
   baraja de tarjetas). Pero sobre todo, **una fila cuya ubicación no existe no
   puede esperar**: tiene que ir a algún sitio en el momento en que se importa,
   o la cantidad queda mal. Así que el «luego» no puede ser sobre *si* existen.
   Lo que sí puede ser —y es lo que construiría— es **«luego» sobre su nombre y
   su grupo**: se crean con el nombre del fichero, y una tarjeta dice *«esta
   importación creó 7 ubicaciones nuevas — revisa los nombres y ponlas en un
   grupo»*. Es su idea, en la forma que la app ya usa, y sin dejar nada sin
   sitio.
3. **Y lo que no dijo ninguno de los dos:** la previsualización tiene que decir
   **qué va a crear ANTES de confirmar**, no después. Una línea encima del
   botón: *«This will also create: 7 locations, 3 categories»*. Hoy eso se
   cuenta al terminar, que es cuando ya no se puede hacer nada.

---

### 6. 🔴 MATERIALS (AJUSTES) COMO LAS ALERTAS DE STOCK BAJO

Jose, imagen 3: *"hay que mejorar esta parte también, debemos hacerla como lo
hicimos en las alertas de stock bajo."*

Anotado tal cual. Lo que hicimos en las alertas de stock bajo y hay que repetir
aquí: una tabla que se puede ordenar y filtrar de verdad, selección múltiple con
una barra de acciones que dice cuántos hay marcados, y los cambios en tanda en
vez de uno por uno con una recarga en medio.

**Sin empezar, y a propósito:** es la pantalla que puede renombrar un material
en **todo** el historial, así que antes de tocarla hay que decidir qué acciones
van en la tanda. No es una tarde.

---

### 7. 🔴 DIRECTORY (AJUSTES) COMO LA PANTALLA DE USUARIOS

Jose, imagen 2: *"hay que mejorar esta parte, así como mejoramos la de ingresar
nuevos usuarios, anótalo."*

Anotado. Lo que ganó la pantalla de usuarios y le falta al directorio: el
formulario de alta a la vista en vez de escondido, validación mientras se
escribe, la lista y el formulario en la misma pantalla sin saltos, y el aviso de
qué va a pasar antes de guardar.

Y una cosa que es de esta pantalla y no de aquélla: el directorio de jefes de
obra es **lo que hace que el correo agrupado llegue a quien tiene que llegar**,
así que un nombre mal escrito aquí rompe un envío en silencio. El parecido con
los nombres que ya hay —lo mismo que hace `_cfgSimilar` con proyectos— vale aquí
más que en ningún otro sitio.

---

### 8. 🔵 LA CASILLA «TODOS» DE MOVEMENTS — PROBABLEMENTE YA ESTÁ BIEN

Jose, vídeo 3: *"también muestra un error al seleccionar movimientos con el
checkbox, selecciona todos los movimientos que hay en la lista. ¿Eso está bien?
¿No debería seleccionar sólo los que se ven? ¿O así habíamos establecido eso? No
lo recuerdo."*

**Así lo establecimos, sí, y está escrito en el código**
(`Index_v3_fixed.html:9911`):

> *"Todo" es LO QUE SE ESTÁ VIENDO, no las 604 filas del archivo. Marcar en un
> filtro y borrar sin él sería exactamente el accidente que esta pantalla tiene
> que hacer imposible.*

`toggleMovSelectAll` (`:9914`) recorre sólo las casillas **pintadas**, y después
de cada repintado se tira la marca de las filas que dejaron de estar en pantalla
(`:9723-9730`). Así que no marca las 604: marca las que la tabla tiene cargadas.

**Dónde puede estar lo que él vio:** la tabla trae los movimientos **por
tandas** («load more»). Después de pulsar «cargar más» dos veces, la tabla tiene
cargadas más filas de las que caben en el alto de la pantalla — y «todas las
cargadas» no es lo mismo que «todas las que estoy mirando ahora». Las dos
lecturas de *«los que se ven»* son razonables y dan comportamientos distintos.

**Esto es tuyo, Jose, no mío.** Lo que hay hoy es *«todas las cargadas»*. La
alternativa es *«sólo las que caben en la pantalla ahora mismo»*, que yo **no**
recomiendo: depende del tamaño de la ventana, cambia al girar el teléfono, y
convierte una casilla en algo que no se puede predecir.

Y lo del **«error»**: ✅ **resuelto — no había ninguno.** Jose, 22/10: *"no me
dio ningún error al hacerlo, sólo me pareció riesgoso poder elegir todas las
que están en la lista."* Era preocupación, no fallo.

#### 8-bis. 🔵 «SÓLO LAS QUE SE VEN» — ¿ES UN CAMBIO MALO O ABSURDO?

Jose: *"¿qué tal si sólo se eligen las que están a la vista, y no todas? ¿Crees
que es un cambio malo o un cambio absurdo?"*

**Ni malo ni absurdo. El miedo es correcto; el remedio es el que yo cambiaría.**

El problema es qué quiere decir *«a la vista»*, porque hay dos y sólo una se
puede construir:

- **«Las filas que la tabla tiene cargadas»** = lo que hace hoy. Es estable: no
  cambia si giras el teléfono ni si haces zoom.
- **«Las filas cuyos píxeles están dentro de la ventana ahora mismo»** = depende
  del tamaño de la ventana, cambia al rodar la rueda, cambia al girar el
  teléfono, cambia si el navegador tiene el zoom al 110%. **Una casilla cuyo
  significado cambia al hacer scroll es una casilla que nadie puede predecir** —
  y lo impredecible es más peligroso que lo excesivo, porque con lo excesivo al
  menos ves el número.

Así que la pregunta no es «¿menos filas?» sino **«¿cómo hago imposible marcar
sin darme cuenta de cuántas?»**. Tres cosas pequeñas, las tres baratas:

1. El botón dice **«Delete 47 movements»**, no «Delete». El número en el botón
   que lo hace, no en una esquina.
2. El aviso de confirmación nombra también lo que **no se ve**: *«47 movements —
   everything loaded right now, including 20 you would have to scroll to see»*.
3. Y la protección que ya existe y nadie sabe que existe: **borrar va a la
   papelera**. Con el punto 1 de este barrido hecho, eso es verdad también en
   la gratis.

**Y si aun así quiere una red más estrecha**, hay una versión que sí es estable
y que yo sí construiría: que «todos» tome **sólo la primera tanda** (las 56 que
salen antes de «cargar más»), no todo lo cargado. Predecible, explicable en una
frase, y genuinamente más estrecho. Ésa es la alternativa de verdad; la de los
píxeles es la que desaconsejo.

> ✅ **JOSE, 22/10: *"para mí 56 sigue siendo un número muy grande, pongámosle
> un número fijo nosotros mismos, 20… y si el usuario quiere seleccionar más,
> luego baja, carga más y selecciona más."***
>
> **Mejor que lo mío, y se adopta — con una precisión.** Tal como está escrito
> hay una contradicción pequeña: si «todos» toma *todo lo cargado*, con la
> primera tanda tomaría 56, no 20. Lo que su idea pide de verdad **no es una
> tanda: es un TOPE**.
>
> Así que: **«todos» marca como mucho 20, siempre**, y la barra dice lo que
> hizo y ofrece seguir:
>
> > *20 of 1052 selected · **+ 20 more***
>
> Una sola regla que no cambia nunca: no depende del tamaño de la ventana, ni
> del scroll, ni de cuántas tandas se hayan cargado. Y marcar más es un acto
> deliberado cada vez, que es justo lo que él quiere.
>
> Y la pieza que lo hace cómodo en vez de pesado: **la forma correcta de marcar
> «todas las de algo» no es la casilla, es el FILTRO**. Con el filtro puesto en
> una obra quedan 15 filas en la tabla, el tope de 20 ni se nota, y lo marcado
> es exactamente lo que se está mirando. La casilla es la herramienta tosca; el
> filtro es la precisa. El aviso de confirmación debería decirlo cuando hay
> filtro puesto: *«20 movements of project BIRCH POINT»*.

---

### Con qué empezar — mi recomendación, una sola

**Del 1 al 4, en ese orden, en una sola versión.** Las cuatro son pequeñas, las
cuatro son «la app dice o enseña algo que no es verdad», y la 4 va dentro porque
es la herramienta con la que se comprueban las otras tres.

Y **antes de las cuatro, la 2 bien hecha**: un solo dueño de la visibilidad de
las pestañas de ajustes. Si la hago barata (una llamada más al final), el punto 2
volverá por tercera vez.

La 5 es la siguiente, sola, porque tiene una decisión de producto dentro
(`RECEIVING` o no). La 6 y la 7 son trabajo de pantalla y van después. La 8 no
se toca hasta que Jose diga cuál de las dos lecturas quiere.

---

## LO VIVO, POR ORDEN

### 🔶 Lo empezado y sin terminar

1. **Estandarizar las columnas** — faltan **Incoming** y **Project View**.
2. **Que el archivado no se note** — ✅ **la búsqueda ya alcanza el archivo
   (v12.59)**: cuando hay texto buscado, el archivo sin mirar y filas
   archivadas, la tabla lo DICE —*"Nothing here matches — but the archive has
   not been searched"*, con la cuenta de cuántas hay— y ofrece el botón que las
   trae y las busca. Jose eligió esta salida de las dos: avisar y ofrecer, en
   vez de buscar siempre en los dos, porque el archivo se consulta pocas veces
   y una llamada por búsqueda sería cuota gastada casi siempre en nada.
   **Falta `archivar por tandas`**, que es lo que protege contra el techo de
   seis minutos de Apps Script cuando el archivo es grande.
3. **Movimientos sin ID** — falta el aviso en la app, y la causa sigue sin
   saberse (depende de que Jose mire un backup del 25/09).

### 🔴 Lo siguiente, y es de datos

3-bis. ✅ **HECHO (v12.44) — el correo diario informaba de un día que no había
   pasado.** La causa no era la zona horaria (mi primera hipótesis, falsa): era
   una nota sobre el disparador que nada podía verificar.
3-ter. ✅ **HECHO (v12.44) — dos pestañas sin nombres en las columnas** (RESERVATIONS, AUDIT_LOG).
   Los nombres existen en el código y la reparación también — pero **a esa
   función no la llama nadie salvo el asistente de instalación**, así que una
   instalación que ya existía no los recibe nunca. Cuarto caso del mismo patrón:
   una protección escrita y nunca ejecutada. Una línea en Check installation.

4. ✅ **HECHO — los campos libres que deberían ser listas.** Ubicaciones en la
   v12.43, **categoría en la v12.45**. Y al mirarlo resultó más pequeño de lo
   que decía esta nota: **proyecto y proveedor NO son el mismo caso** y no se
   cierran. Son libres a propósito —una obra nueva aparece cada semana— y ya
   tienen su mecanismo, la baraja de valores sin registrar. Lo que faltaba de
   verdad era la categoría, que es la mitad del nombre interno del material.
5. ✅ **HECHO (v12.45) — la guardia de escritura ya es una lista de quién SÍ.**
   Con una prueba que inventa un rol que no existe y comprueba que no escribe.
6. ✅ **HECHO (v12.59) — el cartel de reservas ya no culpa a nadie por
   eliminación.** Lo que decía aquí: se suelta una reserva, el cartel no se
   entera, se vuelve a pulsar y contesta *"someone else got there first"*
   cuando no había nadie más. La causa era que el código sólo sabía que la
   reserva ya no estaba activa; **quién** la soltó era una suposición. Ahora lee
   la columna `UnlockedBy` que llevaba ahí todo el tiempo y dice **"you already
   released this one"**, o nombra a la persona, o dice que ya estaba suelta. Y
   el navegador obedece el estado del servidor (`locksAfter` en los tres
   caminos) en vez de filtrar su copia local.
   **Falta la segunda mitad de la entrada:** repasar **todos** los botones que
   llaman al servidor —feedback y mensajes que no supongan la causa—. Se arregló
   el que Jose grabó, no la clase entera.

### 🔴 Abierto, pequeño

7. ✅ **HECHO (v12.60) — mayúsculas al guardar.** Categoría, nombre y proyecto
   ya se guardaban de una sola forma; PO, GC, proveedor y recibido-por no. Ahora
   sí (`cleanDisplay_` en los cuatro). Los guiones sobreviven: un PO como
   `07-6329` sigue siendo `07-6329`. **No** se toca Comments y **no** se toca
   nada de lo ya guardado. Era lo que dejaba dos proveedores donde hay uno
   —"Amsco" un día y "AMSCO" al siguiente—.
8. Las columnas escondidas, en gris opaco y no transparentes.
9. Raw Loc y las columnas de diagnóstico, al soporte y fuera de la vista.
10. El logo de Acopio en los dos sitios de marca, con el bloque entero como
    enlace.
11. El aviso de offline debajo de las pestañas (donde salen los ✓) + su línea
    en Settings → System.
11-bis. **El changelog no se enseña en la app.** Escribimos dos en cada versión
    —inglés y español—, los publicamos, y dentro de la app hay **cero** enlaces
    que lleven ahí: un cliente nunca se entera de lo que mejora. *What's new* en
    el menú de la cuenta, con punto de novedad cuando `APP_VERSION` cambia.
    **Antes hay que decidir** si abre la web o si el texto viaja en el archivo
    (lo segundo funciona sin internet y no manda a nadie fuera, pero hay que
    llevarlo dentro). Encontrado el 05/10 comprobando un vídeo contra el código.
12. La categoría empieza vacía.
13. Los dos botones de Incoming, pegados arriba.
14. Sugerencias de PM en Edit Movement y Edit Receiving.
15. Los dos indicadores de espera de la papelera (una línea).
16. Rótulo de `ARCHIVE_START` (una línea).
17. El salto pequeño que queda al cargar más — **esperando el vídeo de Jose**.
18. La columna DOC: dos al lado y una flecha, en vez de apilarse.
19. Las etiquetas no se pueden apagar.
20. **El espaciado mezcla `px` y `rem` para la misma distancia, y eso se
    descuadra con el texto grande del teléfono.** Medido el 12/10/2026 en la
    v12.62: hay 17 longitudes en `px` dentro de `padding`/`margin`/`gap`, y casi
    todas tienen gemela en `rem` —`8px` y `.5rem` miden lo mismo, `12px` y
    `.75rem` también—. Sólo miden lo mismo **si el navegador está en su tamaño
    de letra por defecto**: si el lector lo sube (la opción de texto grande de
    Android o de iOS), el `rem` crece y el `px` no. El resultado es que un
    relleno crece y el de al lado no, y el ritmo se descuadra de forma
    desigual. Por eso la tanda de espaciado **no** cambió ningún `px` por su
    gemelo en `rem`: no es limpieza, es decidir si el espaciado debe crecer con
    la letra. Lo primero es **mirarlo**: cargar la app con el root a 20 px y ver
    qué se rompe. Después se decide.

21. **La tarjeta naranja «ARRIVED · ENTRY NOT MADE» tapa la tabla de
    movimientos.** Visto en los vídeos de Jose del 05/10 y otra vez en el del
    13/10: la tarjeta del mazo de la esquina inferior derecha se superpone a
    las últimas filas de Movements & History, que quedan debajo y no se pueden
    leer ni pulsar. No es el mazo de valores sin registrar —ése está arriba—:
    es el aviso de entregas llegadas sin entrada hecha. Jose lo señaló primero
    con una imagen sin texto y lo volvió a nombrar el 13/10. **Anotado, sin
    arreglar.** Lo que hay que decidir antes de tocarlo es si la tabla debe
    reservar sitio abajo (y entonces pierde filas siempre, haya tarjeta o no) o
    si la tarjeta debe apartarse al llegar al final del desplazamiento.

22. **Imprimir en la térmica desde el teléfono.** Jose, 13/10: *"tengo una
    impresora de calor JADEN JD-268BT e intenté imprimir desde la app pero
    parece que Chrome no me deja."* Investigado el 13/10 y **Chrome no está
    bloqueando nada**: en Android, el cuadro de impresión sólo ofrece las
    impresoras que estén dadas de alta en el servicio de impresión del sistema,
    y una térmica Bluetooth barata no se da de alta ahí — el fabricante la
    maneja con su propia app. Así que no hay impresora que ofrecer, y eso no es
    un fallo de Acopio.

    Lo que SÍ funciona hoy, sin tocar código: desde un **ordenador** con la
    impresora instalada, el botón 🖨 Print de la app imprime bien (es
    `window.print()` con la hoja a 101,6 × 152,4 mm). Y desde el teléfono,
    *Guardar como PDF* y abrirlo con la app del fabricante.

    Lo que habría que construir, por orden de coste:
    1. **Compartir la etiqueta como imagen** (`navigator.share` con un PNG), para
       que la app de JADENS salga en el menú de compartir del teléfono. Es el
       salto grande por poco trabajo. **Hay que probarlo en el teléfono de
       Jose**: Acopio corre dentro de un iframe de Apps Script y no está
       verificado que `navigator.share` con ficheros funcione ahí.
    2. **Web Bluetooth directo a la impresora.** Casi seguro imposible dentro
       del iframe de Apps Script —la política de permisos bloquea `bluetooth` en
       un iframe de otro origen salvo que el que embebe ponga
       `allow="bluetooth"`, y eso lo controla Google, no nosotros— y además
       haría falta el lenguaje de comandos de la impresora, que el fabricante no
       publica. **No antes de agotar el punto 1.**

23. **La franja de conexión: que no empuje la app.** Jose, 14/10, con vídeo:
    *"funciona bien, pero me gustaría cambiarlo y hacerlo menos invasivo y más
    profesional"*.

    **Lo que molesta no es el color, es que OCUPA SITIO.** `_barraArriba` se
    inserta como primer hijo de `<body>`, en flujo normal, así que al aparecer
    empuja la app entera hacia abajo y al irse la sube. El aviso de «Back
    online» dura 5 segundos: el contenido salta dos veces por un mensaje que no
    pide nada. Eso es lo que se ve casero.

    **Lo que pidió Jose, con sus palabras:** *"que el mensaje aparezca como los
    toast que aparecen frente a la pantalla en la parte de arriba, la de
    'offline' roja y la de 'back online' verde, pero deben permanecer varios
    segundos, para que se noten."*

    Es decir: **arriba y flotando por encima** —sin empujar nada—, rojo para sin
    conexión y verde para la vuelta, y **varios segundos**, no un parpadeo. Lo
    que cambia respecto a hoy es sólo que deja de ocupar sitio en el flujo; el
    sitio (arriba) y los colores se quedan.

    Yo había propuesto mandar «Back online» a los avisos de abajo a la
    izquierda y Jose dijo que no. Queda escrito para no volver a proponerlo.

### 🔴 Abierto, mediano

20. La lista de avisos agrupada, como la de Google — **sin el offline dentro**
    (decidido por Jose).
21. Pausar el mantenimiento nocturno.
22. La versión en los otros tres trabajos automáticos.
23. ✅ **HECHO (v12.59) — dependencias de las UBICACIONES al fusionar.**
    Fusionar dos ubicaciones reescribía el archivo y el stock y dejaba atrás las
    reservas y las fotos: `MATERIAL_LOCKS` seguía apuntando al nombre viejo y
    `RACK_PHOTOS` también. Ahora `mergeLocationsLocked_` reapunta las dos
    —columna 4 y columna 0—, cada una en su propio `try` para que un fallo en
    las fotos no tumbe la fusión, invalida la caché `materialLocksV1` y audita
    cuántas movió cada una.
24. Archivar por tamaño y no por calendario.
25. Repasar el menú 🏭 Acopio: qué de eso le sirve al cliente.
26. Abrir un movimiento nuevo con los datos de otro.
27. Incoming agrupado por fecha.
28. Una prueba de navegador a un zoom que no sea el 100 % — Jose trabaja al
    157 % y ahí hay una clase de fallos que desde aquí no vemos.
28-bis. ✅ **HECHO (06/10) — las 20 comprobaciones de SEO del sitio.** 18 de 20
    cumplidas y vigiladas por `tools/test-site-seo.js`. Las dos que faltan son
    de Jose (nº 37 y 38). Lo construido, en `SEO-DEL-SITIO.md`.

### 🔵 Esperando a Jose

29. Panel de clientes: ¿camino A o B?
30. ¿De qué proyecto de Cloud cuelga la copia del cliente? (**con la comprobación
    previa**: copiar una hoja y leer qué dice en ⚙️ Configuración del proyecto).
31. Stripe.
32. La plantilla maestra y el ensayo de restauración.
33. **Otro tipo de usuario** — ya no hace falta: lo cierra el nº 35.
34. Los vídeos de UX/UI — **van llegando** (27, faltan más). El
    registro de lo que enseña cada uno está en `VIDEOS-DE-UX.md`.
35. **Permisos por persona** — ✅ decidido por Jose el 05/10; va después de la
    guardia de escritura (nº 5).
35-bis. 🔵 **El correo diario con secciones elegibles** — idea de Jose del 06/10
    (stock bajo, incomings sin registrar, quién se conectó…), con interruptor por
    sección. **A favor**, con dos reglas: una sección sin nada que decir no se
    imprime, y un solo cálculo para el correo, la pantalla y la descarga. Va
    DESPUÉS de arreglar la hora y la ventana — añadir secciones a un informe que
    informa del día equivocado es multiplicar el error por seis.
35-ter. 🔵 **Un chat dentro de la app** — Jose preguntó por Google Chat con Apps
    Script. Sí se puede, pero **Chat es de Workspace**: no funcionaría para los
    clientes con Gmail personal, y sería otra app aparte. Yo lo haría dentro de
    Acopio, con el latido que ya existe. Para la v2 y detrás de los informes.
36. **Informes** — ✅ decidido el 06/10: **los tres sitios** (pantalla, correo y
    descarga), un solo cálculo. Qué informes y en qué orden, en
    `LO-QUE-FALTA-EN-LA-APP.md`; confirmado desde fuera en `COMPETIDOR-EXCEL.md`.
    Lo primero: la actividad de las personas dentro de la app (hoy AUDIT_LOG es
    el único dato que obliga a abrir la hoja).
37. ✅ **HECHO (06/10) — Search Console.** Jose dio de alta la propiedad y trajo
    la etiqueta; está en la portada y `test-site-seo.js` la vigila (Google
    reverifica y, si no la encuentra, quita el acceso en silencio). **Falta que
    Jose pulse Verificar** ahora que está publicada.
38. ✅ **HECHO (06/10) — Enforce HTTPS**, según Jose. No lo he podido comprobar
    yo: el proxy de esta máquina da 403 contra acopio.net.
39. ✅ **HECHO — y la lista estaba equivocada, no el sitio.** Lo comprobé el
    07/10 contra lo PUBLICADO: las cinco direcciones de la raíz
    (`setup.html`, `instalacion.html`, `restaurar.html`, `soporte.html`,
    `vista-por-pasillo.html`) **ya son redirecciones** a su copia de `docs/` —
    entre 819 y 867 bytes cada una— y el fichero `download` de 0 bytes ya no
    está. Lo arregló el mecanismo `REDIRECTS` de `build-site.js` cuando se
    añadió, y **esta entrada nunca se actualizó**. Queda escrito porque una
    lista que dice que algo está roto cuando ya está arreglado es una lista que
    se deja de creer, y eso cuesta más que el fallo. El texto original decía:
    *Los cinco documentos de cliente están DOS VECES en el sitio* — en
    `docs/` (los de hoy) y sueltos en la raíz, de una organización anterior y
    **con el texto viejo**. Para un buscador son páginas duplicadas con el mismo
    título; para una persona, instrucciones de instalación desatendidas, que es
    peor que un 404. `publish-site.js` no los borra a propósito y deja la
    decisión a Jose. **Propuesta: convertirlas en redirecciones a su copia de
    `docs/`** — no se rompe ningún enlace viejo y deja de haber dos copias.
    Media hora con su prueba. Y quitar el fichero `download` de 0 bytes.
    Encontrado el 06/10 al comprobar lo PUBLICADO; la auditoría no lo vio porque
    miró `_site/` —lo que construimos— y no lo que está servido.
40. **Medir Core Web Vitals** en `pagespeed.web.dev` — ahora sí tiene sentido,
    con el viewport arreglado. Antes habría dado un número malo del que no se
    sabría qué parte era el viewport.

### 🔵 La v2

Vive en **`docs/LISTA-DE-LA-V2.md`**, no aquí — para que no haya dos listas de
lo mismo, que es justo lo que acabamos de arreglar en los usuarios.

### 🔍 Sin revisar

41. El estándar de las ventanas (lista de revisión del 2026-09-17).
42. La sección histórica del 2026-09-09 — casi toda ✅ v11.x, con dos ⛔ dentro
    que no se han vuelto a mirar.

---

## Next up

# ══ 🔶 A MEDIAS — ESTANDARIZAR LA PANTALLA. Anotado 2026-09-28 ══

> **Repaso 2026-10-05, comprobado en el código.** `COL_TABLES` sólo tiene dos
> miembros, `stock` y `mov`: **Movements y Dashboard están hechos** —con
> `test-columnas.js` midiendo la x de cada columna con siete filtros— y
> **Incoming y Project View no están**. No se marca hecho: falta la mitad de
> las tablas. Lo que sigue vivo de esta entrada es exactamente eso.

Jose, con tres capturas del Dashboard filtrando por estado: *"muestran cómo se
mueven las columnas con diferentes anchos según filtramos por estado del
material. Recuerda que ya habíamos hablado de estandarizar todo: eso incluye
tamaños de filas y columnas, letras, números, ventanas, colores, gráficos, etc.
Anótalo para hacerlo luego y ponle la prioridad que se merece."*

## La prioridad que se merece: **la siguiente**

Y hay una razón concreta, no una opinión: **el filtro de estado que acabamos de
arreglar convirtió esto en algo que se ve todos los días**. Antes había dos
opciones y casi nadie cambiaba de filtro; ahora hay cuatro y Jose ya las está
usando — y cada cambio mueve la tabla entera. Arreglar el filtro destapó esto.

En sus tres capturas, la MISMA tabla con tres filtros:

| Filtro | Dónde empieza `NAME` | Dónde empieza `STOCK` |
|---|---|---|
| Zero Stock only | 383 | 729 |
| Reserved only | 504 | 748 |
| All at Site only | 508 | 846 |

**Más de 120px de diferencia en la misma columna**, sólo por cambiar el filtro.
Es exactamente la queja que tenía sobre Movements, en la pantalla que más mira.

### 2026-09-29 — Jose lo vuelve a pedir, ahora con el filtro de CATEGORÍA

*"Debemos estandarizar las columnas del Dashboard así como lo hicimos con
Movements. Todos los filtros hacen que las filas se muevan y cambien de ancho,
no debe pasar eso."*

Cinco capturas más, una por categoría, misma ventana y misma tabla. Medido
sobre ellas (aproximado, son capturas de pantalla, no el DOM):

| Filtro | `STOCK` | `LOCATION` | `STATUS` | `DOCS` |
|---|---|---|---|---|
| SHOWER | 541 | 763 | 1076 | 1787 |
| MIRROR | 541 | 763 | 1076 | 1787 |
| IGU | 611 | 823 | 1118 | 1790 |
| SCREEN | 625 | 838 | 1131 | 1801 |
| WINDOW | 655 | 860 | 1147 | 1806 |

**`STOCK` se mueve 114px y `LOCATION` 97px** según la categoría elegida.

**Y esto confirma que no es el filtro de estado: es el contenido.** El navegador
reparte el ancho por lo que hay dentro, y lo que hay dentro cambia por completo
entre categorías — los nombres de WINDOW son largos
(`GHH-SCENICMTN-P2,5P-TT`) y los de MIRROR cortos (`KUNA`); las ubicaciones de
SHOWER son `MIRRORS/SHOWERS WAREHOU…` y las de WINDOW son `A3A (54)`. Cualquier
filtro que cambie la mezcla mueve la tabla entera, así que la lista de filtros
que hay que probar es *todos*, no sólo el de estado.

**Se suma una causa propia del Dashboard que Movements no tiene:** al filtrar
por una categoría, la columna `CATEGORY` se esconde (es correcto — ya lo dice el
título), así que la tabla pasa a tener una columna MENOS. El reparto no sólo
cambia de proporciones: cambia de número de partes. `_fijarMinTabla` ya sabe
sumar sólo las columnas visibles, que es exactamente lo que hace falta aquí.

## Lo bueno: el arreglo ya está inventado

La v12.11–v12.14 lo resolvió para Movements y dejó la maquinaria hecha:

- El ancho de cada columna vive **en su definición** (`w:` en `MOV_COLS`), no en
  un bloque de CSS aparte.
- `_fijarMinTabla` recalcula el mínimo de la tabla **en cada dibujado**, sumando
  los anchos que SE VEN más un suelo para la columna elástica.
- `tools/test-columnas.js` mide que ninguna columna se mueva entre filtros.

Aplicarlo al Dashboard es **reusar**, no inventar: poner `w:` en `STOCK_COLS`,
declarar su `minWhat`, y extender la prueba a esa tabla. Después, Incoming y
Project View.

**Y hay que medir los anchos, no elegirlos**, como se hizo en Movements: dibujar
la tabla con datos reales bajo varios filtros y tomar el máximo real de cada
columna. Dos de las de Movements se quedaron cortas a la primera y sólo se supo
midiendo.

## Lo demás de "estandarizar", que es más grande y hay que trocearlo

Jose nombró seis cosas. No son un solo trabajo y no tienen la misma urgencia:

| Qué | Urgencia | Por qué |
|---|---|---|
| **Anchos de columna** (las 3 tablas que faltan) | **Ya** | Se ve cada vez que filtra |
| **Alto de fila** | Alta | Va con lo anterior: una fila que crece porque un texto se parte es el mismo problema |
| **Escala de texto** | Media | Hay **18 tamaños** distintos en el archivo. Deberían ser cinco o seis |
| **Anchos de ventana** | Media | **20 anchos** distintos hoy; tres niveles bastan. Ya está analizado en la lista de la ventana |
| **Colores** | Baja | Ya salen de variables; el desorden es menor |
| **Gráficos** | Baja | Son de Google Charts y se configuran aparte |

**El orden que propongo:** columnas y filas primero, porque son lo que él ve;
después texto y ventanas, que es donde hay más desorden medido; colores y
gráficos al final.

**Aviso honesto sobre el tamaño:** lo de la escala de texto y los anchos de
ventana toca CIENTOS de líneas de CSS y no se puede hacer a ojo sin romper algo.
Hay que hacerlo tabla por tabla y ventana por ventana, con la prueba delante en
cada paso. Es de las cosas que conviene hacer en la rama `siguiente` y entregar
en una tanda, no gotear.

---


# ══ ✅ HECHO EN LA v12.24 — EL NÚMERO CAMBIA SEGUNDOS DESPUÉS DEL "LISTO" ══
#    Anotado 2026-09-28, arreglado 2026-09-29.
#
# LA SALIDA NO FUE LA QUE ESTA ENTRADA PROPONÍA, y conviene que quede escrito.
# Aquí abajo se diseñaba `_aplicarMovimientoLocal`: rehacer en el navegador la
# aritmética del almacén. Este mismo texto ya avisaba del riesgo —"si la
# aritmética del navegador no da lo mismo que el motor del servidor, el número
# parpadea a un valor equivocado"— y proponía una prueba que comparase las dos.
#
# Al construirlo apareció la tercera salida, que no estaba en la lista: EL
# SERVIDOR YA TENÍA LAS CIFRAS DE DESPUÉS y las tiraba. Muta su `snapshot` fila
# a fila para validar el guardado, así que cuando contesta sabe exactamente qué
# hay. Ahora lo manda en `res.stockAfter`.
#
# Así que no hay dos aritméticas que puedan discrepar, y la prueba que comparaba
# las dos deja de hacer falta: no hay una segunda que comparar. Es mejor que lo
# que estaba diseñado aquí, y más barato.
#
# QUEDA PENDIENTE EL BORRADO. La fila se va al pulsar desde la v11.66, pero las
# cifras del Dashboard siguen esperando la recarga. `deleteRow` no tiene un
# snapshot a mano como el guardado —tendría que leerse el archivo entero— y
# hacerlo en cada borrado devolvería la ráfaga lenta que la v11.96 arregló. La
# forma que encaja: calcularlo SÓLO cuando el refresco no se aplaza, que es
# justo el final de la tanda y justo cuando alguien mira. Sin construir.
#
# El texto original, por lo que enseña sobre cómo se eligió mal al principio:

Jose: *"cuánto se demora la app en el feedback visual al hacer Exit desde el
Dashboard, restaurar las cantidades al eliminar un movimiento. Si te das cuenta,
aun cuando la app dice 'done' o 'listo', igual luego de eso se toma unos
segundos más para cambiar la cantidad, restaurar las cantidades y cambiar el
estado de In Stock a At Site. Analiza y busca la mejor solución para esto (ya lo
hemos arreglado en otros lados)."*

**Tiene razón en las dos mitades, y sobre todo en "ya lo hemos arreglado en
otros lados": es el MISMO fallo que `test-pintar-al-confirmar.js` describe para
"Mark arrived", arreglado ahí en la v11.71 y nunca aplicado a guardar ni a
borrar.** Encontrado en el código, no deducido del vídeo:

## Lo que está mal, con los números de línea

### 1. Guardar (EXIT, ENTRY, TRANSFER/RETURN/WASTE/ADJUST)

Los tres caminos de guardado terminan igual:

```
Index_v3_fixed.html:10050   loadDataFromGoogle(false);
Index_v3_fixed.html:11333   loadDataFromGoogle(false); // cached numbers show instantly…
Index_v3_fixed.html:11519   loadDataFromGoogle(false); // cached numbers show instantly…
```

Ese comentario es la trampa, y lo escribí yo. **`false` significa USA EL CACHÉ, y
el caché es la foto de ANTES del movimiento que se acaba de guardar.** Lo que
"sale al instante" es la cantidad vieja. Y es peor que un esqueleto de carga,
porque un esqueleto se ve como algo que está cargando y un número viejo se ve
como un número: no hay nada en la pantalla que diga "esto todavía no es verdad".
Luego termina el viaje entero al servidor y el número salta. Esos son los
segundos que Jose cronometró.

`test-pintar-al-confirmar.js` ya nombra a ese `false` como la mitad gruesa de los
once segundos de "Mark arrived". La misma línea, en tres sitios más.

### 2. Ninguno de los caminos toca la copia local del stock

Al borrar, la FILA sí se va al pulsar — eso está arreglado desde la v11.66
(`_rowLeave` en `_doDeleteMovementRow`, línea 8245). Pero **el stock no se
retoca en el navegador en ningún sitio**: las cantidades y el badge sólo cambian
cuando `_reloadWhenIdle()` termina un `getInitialData` completo, y ese viaje
incluye que el servidor reconstruya los totales del almacén desde el archivo
entero — cuatro segundos medidos en la hoja de Jose el 2026-09-11, y crece con
el archivo.

Así que la secuencia que él ve es exactamente ésta: la fila se va al instante ✓,
el toast sale al instante ✓, y la cantidad y el estado `In Stock → At Site` se
quedan mintiendo hasta que llega la foto nueva.

## La solución, y es reusar lo que ya existe

**Una función, `_aplicarMovimientoLocal(mov, signo)`**, que hace en el navegador
la aritmética que el navegador ya tiene delante: el tipo de movimiento, la
cantidad y el material están todos en el objeto que se acaba de guardar o
borrar. Ajusta la entrada de `stock[]` que corresponde (`warehouseQty`,
`siteQty`, `availableQty`) y llama a `renderAll()`.

Es la misma forma que `_applyMergeLocally` (línea 14152) para el catálogo y que
`movements.splice` para la fila: **parchear lo local, y pedir la foto buena
después sin que nadie la espere mirando.**

**Y el badge sale gratis.** Desde la v12.17 el estado lo decide `_stockState(item)`
a partir de los números — una sola fuente. Si los números se parchean, el badge
pasa de `In Stock` a `At Site` solo, sin una línea más. Ése era justamente el
sentido de la v12.17, y éste es el primer sitio donde se cobra.

**Y se quita el `loadDataFromGoogle(false)` de los tres sitios**, sustituido por
el parche local + `_reloadWhenIdle()`. Un refresco cacheado tras un guardado no
es un adelanto: es un número viejo vestido de número nuevo.

## El riesgo, dicho antes de construirlo

**Que la aritmética del navegador no dé lo mismo que el motor del servidor.**
Entonces el número parpadearía a un valor equivocado y se corregiría después, y
eso es peor que esperar: rompe la regla de siempre —*los datos como el usuario
los ingresó*— aunque sea sólo en pantalla y sólo un segundo.

Por eso la prueba no es opcional y no puede ser de las que buscan texto:
**ejecutar `_aplicarMovimientoLocal` y `calculateStock` sobre el MISMO movimiento
y exigir el mismo resultado**, para los seis tipos (ENTRY, EXIT, TRANSFER,
RETURN, WASTE, ADJUST) y para el borrado de cada uno. Mismo molde que
`test-pintar-al-confirmar.js`, y por la misma razón escrita ahí: *una
comprobación que mira si una llamada ESTÁ en el código pasa en verde sobre código
que nunca la corre.*

Si algún tipo no se puede reproducir en el navegador con seguridad, ese tipo NO
se parchea: se deja el esqueleto de carga honesto sobre las cantidades. Un hueco
que dice "estoy calculando" es correcto; un número que miente no.

## Tamaño y orden

Mediano, y va después de estandarizar la pantalla porque toca los mismos
repintados. Cuatro cosas: la función, los tres `loadDataFromGoogle(false)`
fuera, el parche en el éxito del borrado, y la prueba que compara con el
servidor. La prueba es la mitad del trabajo y es la mitad que importa.

---


# ══ 🔴 ABIERTO — NO HAY FORMA DE PAUSAR EL MANTENIMIENTO NOCTURNO ══

> **Repaso 2026-10-05:** cero apariciones de `MAINTENANCE_PAUSED` o
> equivalente en el código. Sin empezar.

Salió al escribir el manual de restauración (`RESTAURAR-UN-BACKUP.md`). El Paso
0 de las tres rutas dice "apaga los disparadores nocturnos antes de tocar los
datos", y **no hay ningún botón en la app que haga eso**. Hay que ir al editor
de Apps Script → ⏰ Disparadores y borrar a mano `dailyBackupTrigger` (2 AM) y
`archiveOldMovementsTrigger` (3 AM).

**Por qué importa, y no es teórico.** Restaurar lleva de minutos a dos horas. Si
la medianoche te pilla a medias:

- `archiveOldMovementsTrigger` corre sobre un archivo a medio restaurar y mueve
  filas entre hojas basándose en un estado que no es el final.
- `dailyBackupTrigger` te **guarda el estado roto encima del bueno** en la
  carpeta de backups. Si el cliente tiene poca retención, el ejemplar bueno se
  va y no hay segunda oportunidad. Este es el que de verdad quema.

Y el remedio actual es peor que el problema: para pausarlos hay que abrir el
editor de Apps Script, que es exactamente donde no queremos meter a un cliente
en medio de una emergencia — es la pantalla desde la que se puede romper todo lo
demás.

**Lo que hay que construir:** un interruptor en **Settings → System**, al lado
del estado del backup, que diga algo como *"Pause nightly maintenance"* — y con
dos condiciones que no son opcionales:

1. **Que se apague solo.** Guardar `MAINTENANCE_PAUSED_UNTIL` con una marca de
   tiempo, no un booleano. Un booleano se queda encendido para siempre el día
   que a alguien se le olvide, y el síntoma es que el sistema deja de
   respaldarse en silencio — el mismo fallo que ya tuvimos con el trigger de
   backup que no se instalaba y nadie se enteraba. 24 horas.
2. **Que se vea que está pausado**, y no en letra pequeña: la tarjeta de backup
   de Settings → System en naranja diciendo hasta cuándo, y `🩺 Check this
   installation` contándolo como algo que hay que mirar, no como algo normal.

Los dos triggers no se borran: cada handler comprueba la marca al empezar y
sale sin hacer nada, dejando una línea en el audit log. Así no hay que
reinstalarlos después, que es el otro sitio donde esto se puede quedar a medias.

**Tamaño:** pequeño. Dos handlers con una comprobación al principio, una
propiedad, un botón, y la línea en `checkInstallation`. La prueba es directa:
pausar, llamar a los dos handlers, comprobar que no escribieron nada; adelantar
la marca 25 horas, llamarlos otra vez, comprobar que sí.

---


# ══ 🔴 ABIERTO (una línea) — DOS INDICADORES DE ESPERA PARA EL MISMO ESTADO ══

> **Repaso 2026-10-05:** el `'⏳ Restoring…'` del repintado sigue ahí. Sin
> tocar.

Jose, con dos capturas de la papelera: *"al hacer el return de un movimiento
borrado, primero aparece el anillo rotando y luego el reloj de arena. Si los 2
significan lo mismo, ¿por qué?"*

**Tiene razón y son dos sitios distintos dibujando el mismo estado.** No es una
transición pensada: es que el botón se dibuja de dos formas según quién lo pinte.

| Quién pinta | Qué dibuja | Cuándo |
|---|---|---|
| `_btnBusy(btn, 'Restoring…')` (~22019) | `<span class="btn-spin">` — **el anillo** | al pulsar, sobre el botón pulsado |
| El repintado de la lista (~12270) | `'⏳ Restoring…'` — **el reloj** | cada vez que el panel se redibuja |

O sea: pulsas y sale el anillo; el panel se repinta —y se repinta solo, porque
`_trashPending` existe justamente para que un repintado no olvide lo que está en
camino— y el mismo botón pasa a reloj. **El icono cambia debajo de la mano sin
que haya pasado nada nuevo.**

Y en la captura de Jose se ven **los dos a la vez** en filas distintas de la
misma lista: las que él acababa de pulsar con anillo, las repintadas con reloj.
Eso es peor que cualquiera de los dos por separado, porque sugiere que son dos
estados diferentes.

**El arreglo es una línea:** que el repintado use el mismo `btn-spin` que
`_btnBusy`, en vez de su propio `⏳`. Una sola forma de decir "este botón está
trabajando".

**Y una decisión pequeña que hay que tomar al hacerlo:** hoy hay `⏳` en otros
cinco sitios (`progIcon` y los cuatro cuadros de Settings → System). Ésos son
*esperas de pantalla*, no de botón, y ahí el reloj está bien. La regla que
propongo: **anillo = un botón que pulsaste; reloj = algo que la pantalla está
consultando sola.** Con esa regla los cinco se quedan y sólo cambia el de la
papelera.

Tamaño: minúsculo. Se hace con la primera cosa que toque esa zona.

---


# ══ 🔶 A MEDIAS — LOS MOVIMIENTOS DE josephl SIN ID ══

> **Repaso 2026-10-05.** Hecho: la herramienta que rellena los huecos
> (Settings → System → Movement IDs) y el `dedupeMovementIds_` del archivado.
> **Sin hacer, y son dos cosas distintas:** (1) la app no avisa de que hay
> movimientos sin ID —no existe ningún canario, comprobado—, así que sólo se
> ve abriendo el sheet; (2) **la causa sigue sin saberse**, y eso depende de un
> dato que sólo Jose puede mirar: si en el backup del 25/09 a las 2:36 esas
> once filas ya estaban sin ID.

Jose, con captura del sheet: once filas seguidas (1235-1245), todas de
`josephl@ox-glass.com`, todas EXIT a JOBSITE, **con la columna Movement ID
vacía**. Las de antes y las de después sí la tienen.

## Lo que SÍ está comprobado en el código

**No es una cuestión de rol.** Lo revisé entero:

- Los **cuatro** caminos que guardan movimientos —`addMovement`, `addMultiEntry`,
  `addMultiExit` y el de transferencias— desembocan todos en
  **`addMovementsBatch_`**.
- `addMovementsBatch_` asigna el ID **en la misma línea en que construye la
  fila** (`row[AC.MOV_ID] = uniqueMovId_(...)`), sin mirar el rol, el permiso ni
  quién guarda.
- `addMultiExit` —el camino que usa josephl, según su propio ERROR_LOG— no tiene
  ni una condición que dependa de la persona.

**Con el código de hoy, josephl recibe ID igual que Jose.** Eso lo puedo afirmar.

## Lo que NO puedo afirmar, y por qué

**No sé por qué esas once filas no lo tienen, y no voy a inventar una causa.**
Lo que descarté, para que no se vuelva a mirar:

| Hipótesis | Descartada porque |
|---|---|
| Es por el rol | Ningún camino mira el rol al asignar el ID |
| Son filas viejas, anteriores al ID | El AUDIT_LOG las sitúa el **24/09 a las 6:57**, muy posterior |
| Las borró el arreglo del 26 | El desastre vació las hojas **enteras**; esto es un bloque con filas sanas a los lados |
| La restauración desde la papelera las perdió | Ese camino conserva el ID (se ve en las filas `RESTORE_ROW` del AUDIT_LOG) |

**La sospecha que queda, y es sólo una sospecha:** el ancho de la hoja. Sabemos
por el incidente del 26 que había hojas con **20 columnas** cuando el modelo
necesita 23 — y `Movement ID` es justo la 23. Una escritura de ese momento pudo
quedarse corta. Encaja con que sea un bloque contiguo, pero **no lo he
reproducido**, y sin reproducirlo no es una causa: es una corazonada.

## Qué hacer AHORA (resuelve el síntoma, pase lo que pase)

**Settings → System → Movement IDs.** Rellena los huecos y ya está. Tres cosas
que lo hacen seguro, y están así a propósito:

1. **Sólo rellena lo que está en blanco.** Una fila que ya tiene ID no se toca,
   así que correrlo dos veces no hace nada la segunda.
2. **Escribe UNA columna y nada más.** No puede estropear una cantidad, un
   estante ni un precio: lo peor que puede hacer es poner un nombre.
3. **Toma el mismo candado que toma un guardado.**

## Lo que hace falta para saber la causa

**Un dato que sólo Jose tiene:** si en el **backup del 25/09 a las 2:36** —el de
la noche anterior al desastre— esas mismas once filas **ya estaban sin ID**.

- **Sin ID también** → nacieron así el 24/09, y la causa está en el guardado de
  ese día. Hay que mirar el ancho de la hoja en ese momento.
- **Con ID** → algo se los quitó entre el 25 y hoy, y entonces el sospechoso es
  el barrido del 26 o la restauración. Eso sería **más grave** y hay que mirarlo
  ya.

Son dos minutos: abrir ese backup, ir a `MASTER_ARCHIVE_V3`, buscar las filas de
`josephl` del 24/09 y mirar la columna W.

## Y una mejora que hace falta de todas formas

Hoy, un movimiento sin ID sólo se nota si alguien abre el sheet y mira la
columna. **Debería avisar la app**, como el canario del archivo vacío: al cargar,
si hay movimientos sin ID, decirlo con el botón para arreglarlo al lado. El dato
ya viaja —la tabla desactiva la casilla de selección con el texto *"This movement
has no ID yet"*— pero eso sólo se ve si te pones a marcar filas.

---


# ══ ✅ HECHO (v12.35) — EL MISMO PATRÓN QUE BORRÓ EL ARCHIVO, EN `writeConfigColumn_` ══

> **Hecho entero el 2026-10-05**, y con un segundo fallo que salió al mirar
> quién la llamaba: las ubicaciones se escribían en DOS llamadas —nombre y
> tipo—, dos columnas que sólo significan algo emparejadas. Si la primera salía
> y la segunda no, A1A se quedaba con el tipo de A1B y nada avisaba.
>
> Ahora escribe primero y limpia después; las columnas que van juntas se
> escriben en un solo rango; al emparejar manda la primera columna, así que una
> fila sin nombre se cae entera en vez de dejar subir un puesto a la de abajo; y
> vaciar una lista que tenía cosas deja un WARN con cuántas había.
>
> `tools/test-config-escritura.js` (17 comprobaciones) rompe la escritura a
> mitad y mira qué queda en la hoja. Mutación comprobada: devuelto el
> borrar-antes-de-escribir, las cuatro categorías desaparecen.

El trabajo nocturno borró el archivo de movimientos entero la noche del 26 de
septiembre. Historia completa, causa y arreglo en
**`docs/INCIDENTE-2026-09-26-ARCHIVO.md`**. Arreglado en la v12.14.

Al barrer el resto del archivo buscando el mismo patrón —borrar y luego
escribir— apareció **un sitio más**, y hay que arreglarlo:

**`writeConfigColumn_`, línea ~655.**

```javascript
if (lastRow > 1) cfg.getRange(2, colIdx + 1, lastRow - 1, 1).clearContent();  // BORRAR
...
cfg.getRange(2, colIdx + 1, values.length, 1).setValues(...)                  // ESCRIBIR
```

Es lo que guarda **categorías, proyectos, proveedores y locaciones**. Si la
escritura falla entre las dos líneas, esa lista se queda vacía.

**Por qué no entró en la v12.14:** ese cambio ya era un arreglo crítico sobre
datos, y meterle un segundo cambio a otro camino multiplica lo que puede salir
mal justo cuando menos conviene. El alcance tampoco se parece — perder el
catálogo se vuelve a escribir a mano en diez minutos; perder el archivo de
movimientos es perder el trabajo de un año.

**El arreglo es el mismo:** escribir primero, limpiar la cola después. Con su
prueba, como la de `test-archivo-nocturno.js`: romper la escritura a propósito y
comprobar que el catálogo sigue ahí.

**Y una decisión que hay que tomar, no técnica:** ¿debería existir una regla
escrita —y una prueba que la vigile— de que en este archivo **ningún**
`clearContent()` puede ir antes de su `setValues()`, salvo donde borrar es el
objetivo (`menuEraseEverything`)? Mi opinión: **sí**. Es una prueba de texto
barata y cierra la clase entera de fallo en vez de ir sitio por sitio.

---


# ══ 🔶 A MEDIAS — TRES COSAS + LA PREGUNTA DEL LANZAMIENTO (2026-09-22) ══

> **Repaso 2026-10-05.** Hechos y comprobados: **A** (✅ v12.12), **A-bis**
> unir Qty con Unit (✅ v12.19–12.20, `.qpair`), **B** el filtro de estado
> (✅ — los cuatro estados están en el código). **Abiertos:** **A-ter**, las
> etiquetas no tienen interruptor (ni `LABELS_ENABLED` ni equivalente);
> **D-ter**, Stripe, que es decisión de Jose.

> Jose, con dos vídeos y una imagen: *"anota todo, no hagas nada hasta que me
> respondas las preguntas."* Esto es eso. Lo de aquí está **medido**, no
> supuesto; lo que es opinión mía va dicho como opinión.

## A. ✅ ARREGLADO EN LA v12.12 — y era MÁS GRANDE de lo que dice esta entrada

> **Lo de abajo se quedó corto, y lo encontró Jose en producción el 2026-09-25**
> con dos ventanas lado a lado: la copia de OX y la de desarrollo, **misma
> versión y misma huella**, una bien y la otra con el nombre en vertical.
>
> Yo escribí que el fallo aparecía **al abrir el editor**. **Falso: aparece en
> uso normal**, en cuanto alguien enseña columnas con el ojo de "⚙ Columns".
> Jose tenía **Supplier** enseñada en su copia de OX y no en la de desarrollo —
> las preferencias de columnas viven en el navegador, y eran dos perfiles de
> Chrome distintos. Ésa era toda la diferencia.
>
> Medido: los anchos declarados con Supplier suman **1296px** contra un mínimo
> de tabla de **1300**. Al material le quedaban **4px**. Exactamente lo de su
> captura.
>
> | Ventana | Columnas | Material | Alto de fila |
> |---|---|---|---|
> | 960 | de fábrica | 124px | 83px |
> | 960 | **+ Supplier** | **4px** | **428px** |
> | 1600 | + Supplier + Raw Loc | **0px** | **428px** |
>
> **El arreglo (v12.12)** no es ninguna de las cuatro salidas de abajo, porque
> ninguna atacaba la causa: los anchos vivían en el CSS y la lista de columnas
> en el JavaScript, dos listas que tenían que decir lo mismo sin nada que lo
> obligara, y encima el mínimo era un número escrito a mano. Ahora el ancho vive
> en `MOV_COLS`, al lado de su columna, y el mínimo se recalcula en cada
> dibujado: `suma de los anchos que SE VEN + _MOV_MIN_WHAT`.
>
> **`_MOV_MIN_WHAT = 192` también está medido**, y de paso destapó otra cosa: a
> 184px —lo que le tocaba al material en la v12.11 con las columnas de fábrica
> en una pantalla de 1600— había **15 celdas desbordadas**, la insignia
> `IGU (ISOLATED GLASS UNIT)` saliéndose 3px de su celda. `test-columnas.js` no
> lo veía porque medía los desbordes **después** de esconder una columna, o sea
> en el estado más cómodo. Corregido: ahora mide en el más apretado.
>
> **Dependencia que queda anotada:** ese 192 lo fija el nombre de categoría más
> largo, que es dato del cliente. Un cliente con una categoría más larga volvería
> a desbordar. Lo arregla de verdad el nombre corto de categoría del punto C;
> cuando exista, hay que volver a **medir** este suelo, no adivinarlo.
>
> **LO QUE SIGUE ABIERTO de esta entrada:** el trato de las columnas
> **bloqueadas** en el editor (el asa `⋮⋮` que ofrece mover lo que no se mueve,
> el fondo, el candado con su explicación). Eso no se ha tocado.

### Diagnóstico original (2026-09-22) — incompleto, se conserva por lo que enseña

**Es un fallo nuevo, y lo introduje yo ayer.** Jose lo grabó (vídeo
`Recording_2026-09-22_141433.mov`): al pulsar **⚙ Columns**, la columna
`CATEGORY / NAME` se aplasta y el nombre se dibuja **una letra por renglón**
(`0 / 7 / - / 6 / 3 / 2 / 9`), y las filas pasan de 68px a 428px de alto.

**Medido** (`scratchpad/medir.js`, Chromium, datos como los suyos):

| | ventana 1198px | ventana 1600px |
|---|---|---|
| `mc-what` en modo normal | 124px | 184px |
| `mc-what` en modo edición | **0px** | **0px** |
| fila más alta, normal | 83px | 68px |
| fila más alta, edición | **428px** | **428px** |

**Por qué.** La v12.11 puso `table-layout:fixed` y un ancho en píxeles a cada
columna menos una, `mc-what`, que es la elástica a propósito. La suma de los
anchos declarados de **todas** las columnas es **1748px**:

```
32(casillas) + 112 + 58 + 58 + 86 + 150 + 120 + 110 + 140 + 120
+ 110 + 150 + 110 + 112 + 160 + 76 + 44(acciones) = 1748
```

En uso normal cinco columnas están escondidas de fábrica (`rawLoc`, `gc`,
`supplier`, `pm`, `sysDate` = 572px), así que la suma baja a 1176px y sobra
hueco para el material. Pero `_visibleColCount` dice, literalmente,
*"edit mode shows every column"*: al abrir el editor **aparecen las dieciséis**,
la suma sube a 1748 y lo que le queda a la elástica es
`max(0, disponible − 1748)` = **0 en cualquier pantalla**. No es que la ventana
de Jose sea estrecha: a 1600px pasa exactamente igual.

**Y no es sólo estético.** Con 0px de ancho el nombre no se puede leer *mientras
decides qué columnas quieres*, que es justo el momento en que hay que verlo.

**LO IMPORTANTE: esto bloquea lo siguiente de la lista.** El plan era llevar los
anchos fijos a Dashboard, Incoming y Project View. Hoy sólo Movements tiene
`table-layout:fixed` (una sola línea en todo el archivo, la 1330), así que las
otras tres no tienen el fallo — **pero lo heredarán en cuanto se les aplique**.
Hay que resolver la regla antes de extenderla, no después.

### Cuatro salidas, con su consecuencia

1. **Que el modo edición no obligue a la tabla a caber.** Quitar el
   `width:100%` mientras el editor está abierto y dejar que la tabla mida sus
   1748px con barra horizontal. Cada columna conserva su ancho real y el
   material recupera los suyos. *Consecuencia:* aparece barra horizontal al
   abrir el editor — pero el editor ya es un modo aparte, con sus botones Save y
   Reset, así que que se ensanche no sorprende. **Es la que yo haría.**
2. **Dar ancho declarado también a `what`** (p.ej. 216px) y que la elástica
   pase a ser `comment`, que es la que puede recortarse sin perder nada (ya se
   recorta con puntos suspensivos y guarda el texto entero en la ayuda).
   *Consecuencia:* el nombre deja de crecer en pantallas grandes — hoy gana
   hueco al ensanchar la ventana, y dejaría de hacerlo.
3. **En modo edición, no dibujar el cuerpo de la tabla**: sólo la cabecera, con
   las dieciséis columnas y sus nombres. *Consecuencia:* se pierde la vista
   previa; hoy se ve cómo queda la tabla mientras se arrastra, y eso es útil.
4. **Las escondidas, en una lista aparte** debajo de la tabla, en vez de
   metidas en la cabecera. *Consecuencia:* es el cambio más grande de los
   cuatro y cambia una interfaz que ya funciona.

### Y la pregunta que hizo Jose, que es otra

*"Qué pasa con las columnas que NO se pueden editar y cómo mantenerlas o
mostrarlas al activar la edición."* Hoy las bloqueadas son tres —`when`
(Type/Date), `what` (Category/Name) y `qty`— y en modo edición se dibujan
**igual que las demás**: con el asa de arrastre `⋮⋮`, el nombre editable y, en
lugar del ojo, un 🔒. O sea que **parecen arrastrables y no lo son**, y el
candado se lee sólo si te fijas.

Mi propuesta, independiente de cuál de las cuatro salidas se elija:

- **Quitarles el asa `⋮⋮`** — no se pueden mover, no deben ofrecer que se muevan.
- **Fondo distinto** (un gris un punto más oscuro), para que se vean como un
  bloque fijo y no como parte de lo que se está reordenando.
- **Dejar el candado**, con su ayuda al pasar el ratón explicando *por qué*:
  «Type, Name and Qty are what a movement IS — a row without them says nothing».
- **Seguir permitiendo renombrarlas** (eso sí se puede, y es útil).

### A-bis. UNIR QTY CON UNIT — idea de Jose (2026-09-22). **A FAVOR.**

Jose: *"también podemos unir qty con unit, ya que van de la mano; tampoco se
debería poder cambiar o mover, la cantidad debe tener una unidad para ser
entendible… pero estas 2 columnas deben tener un lugar específico al ser
mostradas, una al lado de la otra, y toda la columna debe verse igual, ejemplo:
`14 | units`, `150 | box`, `243 | bags`, todas alineadas por la barra del medio
(aunque no tenemos que poner la barra, sólo es para entender la idea)."*

**Sí, y encima tapa un agujero que nadie había visto.** Hoy `qty` está
bloqueada (`lock:true`) y `unit` **no** (`lock:false`, línea 4951). O sea que
**hoy se puede esconder Unit y dejar Qty**, y la tabla queda mostrando `+25` sin
decir veinticinco de qué. Por la regla que el propio Jose fijó —el dato tiene
que seguir significando lo que él escribió— eso es un defecto, no un gusto.

**La maquinaria ya existe y ya está probada.** `COL_MERGES` se construyó para
esto: ya fusionó `type`+`date` → `when` y `category`+`name` → `what` en
Movements, y las **cinco** columnas de stock en la barra de niveles (idea de
Jose, v9.x). Añadir `{ unit: null }` al mapa de `mov` es el mismo patrón de una
línea, y traduce solo el orden que cada persona ya tiene guardado en su
navegador, sin que nadie tenga que tocar nada.

**La alineación que pide sale de una regla, no del contenido.** Para que la
costura quede en el mismo sitio en TODAS las filas, el reparto dentro de la
celda tiene que ser **fijo**, no automático:

```
td.mc-qty { display:grid; grid-template-columns:<N>px 1fr; gap:6px; }
  › el número:  text-align:right   (columna 1)
  › la unidad:  text-align:left    (columna 2)
```

Con `1fr` para el número en vez de `<N>px` la costura bailaría de fila en fila,
que es justo lo que él no quiere.

**Lo que hay que MEDIR antes de escribir el CSS** (no elegirlo a ojo — dos veces
esta semana un número elegido a ojo se quedó corto):

1. El `qty` más largo que puede salir, con su signo: `−9999` son 5 caracteres.
2. La unidad más larga del catálogo real (ver `UNIDADES-Y-CONVERSIONES.md`).

Ahorro estimado: hoy `58 + 58 = 116px`; unidas, alrededor de **96px**. Son ~20px
— poco por sí solo, pero va en la misma dirección que el punto C y **quita una
columna de la lista de reordenar**, que vale más que los píxeles.

**Consecuencias, dichas antes de hacerlo:**

- **Un solo nombre editable en vez de dos.** Hoy un admin puede renombrar `Qty`
  y `Unit` por separado; después será un nombre para las dos.
- **A quien hoy tenga Unit escondida, la unidad le vuelve a aparecer.** Es
  intencionado —es el agujero que se está tapando— pero es un cambio visible sin
  que él lo haya pedido.
- **El color y el signo siguen siendo del número, no de la unidad.** Hoy el qty
  va en verde con `+` o en rojo con `−`; la unidad seguirá en gris pequeño. Eso
  mejora, porque hoy el `+`/`−` y la unidad compiten por la misma mirada.

**Y responde lo del "lugar específico":** con la unión, el bloque bloqueado de
Movements queda en **tres columnas, siempre las primeras y siempre en este
orden** — `Type/Date` · `Category/Name` · `Qty+Unit`. Eso es exactamente lo que
pidió, y encaja con el trato distinto para las bloqueadas del punto A.

---

## A-ter. LAS ETIQUETAS SALEN SIEMPRE, Y NO HAY FORMA DE APAGARLAS

Jose, 2026-09-25: *"aunque desactivo el checkbox de los labels, estos siempre
aparecen al final después del ingreso de un material."*

**Comprobado, y no es un fallo: es algo que nunca se construyó.** En
`_doMultiSubmit` (línea ~11341) la llamada es incondicional:

```javascript
_openLabels(_labelsFromEntry(materials, payload), function(){ … });
```

No hay ni una preferencia ni un interruptor en todo el archivo — busqué
`acopio_labels`, `labelsPref`, `skipLabels`: **nada**. Las casillas que Jose
desmarca están **dentro** de la ventana de etiquetas y sirven para elegir
*cuáles* imprimir; no impiden que la ventana se abra, y **no se recuerdan**:
`_openLabels` se redibuja desde cero, con todo marcado, en cada entrada.

O sea que las dos lecturas de su queja llevan al mismo sitio: **ni hay memoria
ni hay forma de decir que no.**

**Propuesta (chica, una sesión):**

1. Un ajuste en App Settings — *"Ask about labels after an entry"*, **encendido
   de fábrica**, para no cambiarle el flujo a nadie sin avisar. Apagado, la
   ventana no se abre y se pasa directo a lo de las entregas.
2. Un botón **"Don't ask again"** dentro de la propia ventana, que apaga ese
   mismo ajuste. Es donde la persona está cuando se le ocurre pedirlo.

**Lo que NO haría:** recordar qué casillas quedaron marcadas la última vez. Las
etiquetas son del camión de hoy, no del de la semana pasada, y una casilla que
viene marcada por algo que pasó hace tres días es de las que hacen imprimir de
más sin que nadie entienda por qué.

---

## B. EL FILTRO DE ESTADO SÓLO CONOCE DOS DE LOS CUATRO ESTADOS

Vídeo `Recording_2026-09-22_150944.mp4`. Jose: *"en la app solo se puede filtrar
por 2 estados (zero stock e in stock) y por todo, pero en la app existen también
los estados at site y reserved, así que hay un fallo ahí."*

**Comprobado, y es peor que eso: además uno de los dos que hay está mal
definido.** La insignia sale de `stockBadge` (línea ~6325) y tiene **cuatro**
estados, en cascada:

| Insignia | Condición |
|---|---|
| `In Stock` | `availableQty > 0` |
| `Reserved` | `availableQty = 0` y `warehouseQty > 0` |
| `All at Site` | lo anterior no, y `siteQty > 0` |
| `Zero Stock` | nada de lo anterior |

El filtro (líneas 3160-3162 y 6948-6949) ofrece tres opciones y filtra así:

| Opción | Filtra por | ¿Coincide con la insignia? |
|---|---|---|
| `All Status` | nada | sí |
| `In Stock only` | `warehouseQty > 0` | **NO** — deja pasar las `Reserved`, que tienen `warehouseQty > 0` y `availableQty = 0` |
| `Zero Stock only` | `warehouseQty<=0 && siteQty<=0` | sí |
| — | — | **falta `Reserved`** |
| — | — | **falta `All at Site`** |

Son **tres arreglos, no dos**: añadir las dos opciones que faltan y **corregir
`in` para que signifique lo mismo que la insignia verde** (`availableQty > 0`).
Hoy alguien que filtra "In Stock only" para saber qué puede sacar del almacén
ve material que **no puede sacar**, y eso es un error de los que hacen perder un
viaje al estante.

Lo correcto es que las opciones del desplegable **salgan de la misma fuente que
la insignia**, para que no puedan volver a separarse — igual que se hizo con la
tabla de capas en la v12.08. Y una prueba que recorra los cuatro estados y
compruebe que cada filtro deja exactamente las filas cuya insignia coincide.

Tamaño: chico (una sesión corta). **Es un fallo de verdad, no un pulido.**

---

## C. LOS NOMBRES Y LAS CATEGORÍAS DEL DASHBOARD, A UN ALTO FIJO

Jose, sobre la imagen del dashboard: *"podemos mejorar o ajustar cómo se manejan
los nombres y así reducir el espacio que tienen; también podemos hacer lo mismo
con el espacio que utilizan las categorías con más palabras, pero esto tiene
sentido sólo si se mantiene el mismo alto de las celdas, o sea los nombres deben
ajustarse al mismo tamaño, y los nombres de los proyectos deben ajustarse
también según el número de palabras."*

**La condición que puso es la correcta y es la parte difícil.** Estrechar una
columna sin más no ahorra nada: el texto se parte en dos renglones y la fila
crece, así que se gana a lo ancho lo que se pierde a lo alto. Lo que pide —
misma altura siempre — es lo que hace que el ahorro sea real.

**Ya existe la herramienta y ya está probada en producción:** la escalera
`_resvFit` de la v12.05, que mide `nº de letras × 8.5px` contra el ancho
disponible y baja un punto el tamaño (`fit-sm`) o dos (`fit-xs`) sólo cuando
hace falta. Ahí se hizo para seis filas; esto es lo mismo para tres sitios:

1. **El nombre** (`NAME / DESCRIPTION`, renglón de arriba, en negrita).
2. **El proyecto** (el renglón gris de abajo) — y aquí Jose pide algo más fino:
   ajustar **según el número de palabras**, no sólo según el largo. Tiene
   sentido: `LIBERTY WELLS TOWNHOMES` (3 palabras) puede partirse por un espacio
   y `PREMIUMSHOWERDOORHEADER` no, así que el mismo largo necesita tratos
   distintos.
3. **La insignia de categoría** — la que marcó en rojo es
   `IGU (ISOLATED GLASS UNIT)`, con diferencia la más larga, y detrás
   `SHOWER_HARDWARE` y `WINDOW_PARTS`.

**Una pregunta que hay que resolver antes de construir, no después:** si la
insignia encoge la letra, dos categorías distintas se ven con dos tamaños
distintos en la misma columna, y eso se lee como si una importara más que la
otra. **Mi opinión:** para la categoría no encoger la letra sino **acortar el
texto** (un nombre corto por categoría, decidido una vez, con el nombre largo en
la ayuda al pasar el ratón: `IGU` en la insignia, `IGU (ISOLATED GLASS UNIT)` al
pasar por encima). Para el nombre y el proyecto sí la escalera, porque ahí el
texto es del usuario y no se puede acortar por él.

> **Jose, 2026-09-22: *"podemos intentarlo, anótalo."* APROBADO.** Queda una
> decisión para cuando se construya, y es suya porque es del negocio: el nombre
> corto de cada categoría **lo tiene que poder editar un admin**, igual que el
> largo, o sería Acopio quien decide cómo se llaman las cosas en la empresa del
> cliente. Propuesta: un campo más en la pantalla de categorías; si se deja
> vacío, que el corto se calcule solo con la regla "lo que haya antes del primer
> paréntesis o del primer `_`" — `IGU (ISOLATED GLASS UNIT)` → `IGU` y
> `SHOWER_HARDWARE` → `SHOWER` salen bien de ahí, sin que nadie escriba nada.

Va junto con el punto 1 de la lista anterior (anchos fijos en las otras tres
tablas) — es la misma tabla.

---

## D. ¿QUÉ FALTA PARA LANZAR? — respuesta en `ANTES-DE-VENDER.md`

Jose: *"¿Qué nos hace falta para lanzar el producto? Dime lo mínimo que
necesitamos. Si lo que falta no es tan importante ni restrictivo, podemos
empezar a trabajar en la v2, o sea lanzar el producto como está ahora y lo que
mejoremos de aquí en adelante será la siguiente versión que les demos a los
clientes que pagan."*

La respuesta larga vive en `docs/ANTES-DE-VENDER.md`, que ya estaba escrita y
ordenada por riesgo. Resumen del estado real al 2026-09-22:

| # | Bloqueante | Estado | ¿Quién? |
|---|---|---|---|
| 1 | Política de Privacidad | ✅ hecho (v9.96, revisada v12.07) | — |
| 2 | Plantilla maestra limpia | ⬜ **falta** — sólo Jose puede | Jose, ~1 h |
| 3 | Restaurar un backup de principio a fin | 🟡 pasos 0-2 sí, del 3 en adelante **no** | Jose, ~1 h |
| 4 | acopio.net y novedades | ✅ hecho | — |
| 5 | Consent screen "In production" | ⬜ **falta** — es un interruptor | Jose, ~5 min |
| 6 | Cómo se cobra | ⬜ **falta decidir** | Jose |

**O sea: de los seis bloqueantes, cuatro siguen abiertos y los cuatro son de
Jose, no míos.** Ninguno es construir código. Eso responde su pregunta: **no
hay nada del producto que impida lanzar.** Lo que impide lanzar es media tarde
de trámites.

**Mi recomendación, y va como opinión:** sí, lanzar con lo de arriba resuelto y
tratar todo lo demás como v2. Con dos condiciones:

- **El filtro de estado (punto B) entra en la v1**, porque es un dato
  equivocado en pantalla, no una mejora.
- **La regresión del modo edición (punto A) entra en la v1**, porque la
  introduje ayer y hoy el editor de columnas está roto a la vista.

Lo demás de este documento —los anchos de las otras tablas, los grupos de
Incoming, la ventana de Edit, los nombres del dashboard, el conteo cíclico, los
códigos de barras— es v2 legítima: mejora lo que ya sirve, no arregla nada roto.

### D-bis. EL CONSENT SCREEN — nuestra propia nota estaba MAL, y la creímos once meses

Jose, 2026-09-22: *"creo que ya está activo, porque llevamos meses usando la app
para OX y la de testing y no ha pasado nada; igual dime cómo revisamos eso."*

**Su duda estaba justificada y su razonamiento tiene un agujero — pero el error
grande era nuestro, no suyo.**

**Lo que decía la nota:** que en modo Testing *"las autorizaciones caducan a los
7 días"*. **Es falso para Acopio.** Esa regla de Google es sobre el **refresh
token**, y Acopio **nunca pide uno**: `access_type` no aparece **ni una vez** en
los dos archivos del proyecto (comprobado con `grep`). El flujo real es:

1. Se abre el popup de Google pidiendo sólo `openid email profile`
   (`Index_v3_fixed.html:20904`).
2. El código se canjea **una sola vez** por un `id_token`
   (`handleOAuthCallback_`), del que se lee el correo.
3. A partir de ahí **la sesión es nuestra**: `makeSessionToken_` firma un token
   con HMAC y le pone **30 días** (`Code_v3_fixed.gs:1171`).

No hay refresh token que caducar. La duración de la sesión no depende del estado
de publicación de Google. **Corregido en `PLAN-5-ANIOS.md` y `ANTES-DE-VENDER.md`.**

**El agujero del razonamiento de Jose**, que es una lección aparte: que OX lleve
meses sin problemas **no prueba que esté en producción**. La gente de
`@ox-glass.com` entra por la **puerta automática** (`Session.getActiveUser()`),
que **no toca el cliente OAuth** — ver `ACCESO-Y-LOGIN.md`, "son DOS puertas".
El camino OAuth puede llevar meses sin ejercitarse de verdad.

**El límite real del modo Testing es otro, y para vender es peor:** sólo pueden
entrar los correos que estén en la **lista de usuarios de prueba**, con tope de
100. Quien no esté no recibe un aviso: recibe un **bloqueo**. El día de la
primera instalación, la gente del cliente con Gmail personal **no podría entrar
en absoluto** hasta que Jose añadiera uno por uno sus correos en su consola.

**Cómo revisarlo, dos formas:**

- **En la consola:** Cloud Console → *Google Auth Platform → Audience* (el
  nombre viejo de esa pantalla era *APIs & Services → OAuth consent screen*).
  Dice "Testing" o "In production", con un botón para publicar.
- **Sin la consola, y esto prueba lo que de verdad importa:** que alguien con un
  **Gmail personal que NO esté en la lista de prueba y NO sea del dominio**
  intente entrar. Si entra → producción. Si ve *"Access blocked… is currently
  being tested"* → Testing.

Publicar no es un trámite: con scopes básicos no hay verificación de Google.

---

## D-ter. STRIPE — lo que hay que decidir antes de tocar nada

Jose, 2026-09-22: *"usaremos Stripe desde el día 1, hay que configurarlo."*
**Decisión tomada.** Esto es el desglose, no una propuesta alternativa.

> **Nota de honestidad:** aquí NO van comisiones ni descripciones de pantallas
> de Stripe. Cambian por país y por producto, y una cifra inventada en un
> documento de negocio es de las mentiras que más caro salen. Las comisiones se
> leen en la página de precios de Stripe el día que se configure.

### Lo que NO hace falta para la primera venta

**Acopio no necesita enterarse de si alguien pagó.** Hoy cada cliente tiene su
propia copia del Sheet en su propio Drive; no hay servidor de Acopio que
consultar. Conectar Stripe con la app —que deje de funcionar si dejan de
pagar— es **un proyecto aparte**, con webhooks y un sitio donde guardar el
estado, y **no bloquea nada**. Para los primeros clientes, que el cobro y la app
vivan separados está bien y es lo normal.

(Cuando llegue el momento, engancha con la **tarjeta de reenganche** que ya
está diseñada más abajo en este mismo documento.)

### Lo mínimo para cobrar

1. **Cuenta de Stripe a nombre del negocio**, no personal. Pide datos fiscales
   y una cuenta de banco. Es el paso más lento y **sólo lo puede hacer Jose**.
2. **Un producto con precio recurrente mensual**, en el precio que ya está
   publicado en la landing. Que coincidan, porque alguien va a comparar.
3. **Un Payment Link.** Es una URL que cobra, sin escribir una línea de código y
   sin servidor. Se le manda al cliente después de la llamada de instalación.
4. **Decidir qué pasa si una tarjeta falla.** Stripe reintenta y avisa solo; hay
   que elegir cuántas veces y qué pasa al final. Es un ajuste, no código.

### Lo que hay que decidir, y es de Jose

- **¿Prueba gratis o no?** Si hay prueba, cuántos días, y si se pide la tarjeta
  al principio o al final. Cambia el texto de la landing, así que decidirlo
  antes de anunciar nada.
- **¿Mensual, anual, o los dos?** El anual cobra por adelantado y reduce las
  bajas, pero complica devolver dinero — y la política de devoluciones ya está
  escrita en `SOPORTE-Y-DEVOLUCIONES.md`; **hay que releerla contra lo que se
  configure en Stripe para que no se contradigan.**
- **¿Se cobra aparte la instalación?** Hoy la landing promete "la configuramos
  contigo", que son horas de Jose. Si eso es un pago único, va en Stripe también.
- **Impuestos.** Si Utah grava el software como servicio es una pregunta para un
  contador, no para mí ni para Stripe. Stripe puede calcularlo, pero alguien
  tiene que decirle qué cobrar.

### Lo que sí toca el producto (pequeño, y para después)

La landing tendrá que llevar el botón a la URL de Stripe, y la página de precios
tiene que decir **exactamente** lo que se configure. `test-landing-verdad.js` ya
impide que la landing prometa lo que el producto no hace; cuando exista el
precio real en Stripe, **esa prueba debería comprobar también que el precio de
la página y el del enlace de pago son el mismo**. Es la clase de cosa que se
desincroniza sola.

---

# ══ 🔶 A MEDIAS — CINCO COSAS (2026-09-22 noche) ══

> **Repaso 2026-10-05.** **1** a medias (Movements y Dashboard sí, Incoming y
> Project View no). **2** sigue aparcado por Jose, a propósito. **3** sin
> hacer: no existe abrir un movimiento nuevo con los datos de otro. **4** sin
> hacer: el Incoming no agrupa por fecha (el panel de "This week's arrivals"
> es otra cosa). **5** sin revisar en detalle.

> Jose: *"NO QUIERO QUE CAMBIES NADA POR AHORA, SOLO ANALIZA, ANOTA, COMENTA Y
> SUGIERE."* Esto es eso. Todo lo de aquí está comprobado en el código o medido
> en los vídeos; lo que es opinión mía va dicho como opinión.

## 1. LAS COLUMNAS SALTAN AL CAMBIAR DE FILTRO — y es el mismo fallo de la tira

Jose, con dos vídeos (Movements y Dashboard): *"quiero quitar todos los saltos
que da la pantalla y dejar cada cosa en su propio lugar sin que tengan que
moverse todas. Cuando cambio de categoría, todas las columnas se mueven
horizontalmente, porque no tienen su espacio fijo sino que están condicionadas a
la cantidad de caracteres y tamaño de letra."*

**Diagnóstico suyo, y es exacto.** Medido sobre los fotogramas del vídeo de
Movements, la columna `PROJECT` empieza en:

| Filtro | x de `PROJECT` |
|---|---|
| Return (2 filas) | ≈ 476 |
| SCREEN | ≈ 1318 |
| MIRROR | ≈ 415 |

O sea que **la misma columna cambia de sitio casi 900px** según qué filas haya
debajo. Una `<table>` normal reparte el ancho por el contenido; eso está bien
para un documento y mal para algo que se lee todos los días, porque no se puede
aprender dónde mirar. Aparece y desaparece además la barra horizontal.

**ES EXACTAMENTE EL MISMO FALLO QUE JOSE ENCONTRÓ EN LA TIRA DE RESERVAS** y que
se arregló en la v12.05 con `grid-template-columns` en píxeles y la escalera de
`_resvFit`. Lo que allí se hizo para seis filas hay que hacerlo aquí para las
cuatro tablas grandes: Movements, Dashboard, Incoming y Project View.

**Lo que hay que resolver antes de escribirlo, y no es poco:**

- `table-layout:fixed` + un ancho por columna es el mecanismo, pero **las
  columnas son configurables** (`⚙ Columns`, `_colHidden`, `COL_MERGES`), así
  que el ancho no puede vivir en el CSS por posición: tiene que ir con la
  definición de cada columna, junto a su `key` y su `def`.
- Con una columna escondida, su ancho tiene que repartirse — o la tabla deja un
  hueco. Decidir cuál es la columna elástica de cada tabla (sospecha: `NAME`).
- La escalera de tamaño (`_resvFit`) ya existe y está medida. **Reutilizarla,
  no escribir otra**: ahí hay una constante de ancho de letra medida en el
  navegador que no debe duplicarse.
- Y la prueba tiene que ser la de la v12.05: **medir la x de cada columna con un
  filtro y con otro, y exigir que no se mueva**. Comparar CSS no vale.

## 2. ⏸ APARCADO POR JOSE — MOVEMENTS: LA CATEGORÍA ARRIBA

> **Jose, 2026-09-22, dos veces en el mismo mensaje:** *"olvida eso, o mejor
> déjalo anotado para revisarlo bien cuando ya tengamos la app bien creada"* y
> *"recuerda, ya no haremos esto ahora, lo revisaremos después para ver si es
> buena idea o no, déjalo afuera por ahora."*
>
> **No se hace.** No es que se posponga por falta de tiempo: él quiere volver a
> decidir SI es buena idea, con la app más asentada. El análisis se queda entero
> porque servirá ese día, pero nadie lo empieza sin que él lo reabra.
>
> Y hay una razón técnica que lo apoya: esto depende del punto 1. Con las
> columnas todavía bailando, esconder una no se puede medir.

Jose: *"quiero hacer en Movements lo mismo que hicimos en Dashboard: seleccionar
una categoría y que la columna de categoría desaparezca y la categoría aparezca
arriba, eso da espacio a lo demás."*

**Ya está construido, sólo que sólo para el Dashboard.** `_colSuppressed(t)`
empieza literalmente con `if (t !== 'stock' || _colEdit[t]) return {};`, y el
badge se pinta en `#stockCatBadge`. Son dos piezas:

1. Quitar ese `t !== 'stock'` y que también mire el filtro de Movements
   (`movCatFilter`), que es otro `<select>`.
2. Un `#movCatBadge` junto al título "Movement History", igual que el del
   Dashboard.

Ojo con un detalle del vídeo: en Movements la columna se llama
`CATEGORY / NAME` y lleva **las dos cosas juntas**, no sólo la categoría. Así
que no es "esconder una columna", es **dejar de pintar el badge dentro de la
celda** y sacarlo al título. Es un poco más que en el Dashboard, donde la
categoría sí tiene columna propia.

Y va DESPUÉS del punto 1, o al revés: si primero se fijan los anchos, esconder
una columna es sólo repartir su ancho.

## 3. MOVEMENTS: SELECCIONAR UNA FILA Y ABRIR UN MOVIMIENTO NUEVO CON SUS DATOS

Jose: *"quiero poder seleccionar un movimiento con el checkbox, dar clic en Exit
y que la información aparezca en la ventana, poder cambiar a Transfer o Return o
Waste o Adjust y que la información siga en la ventana para poder
manipularla."*

Entendido como lo que es: **no es editar**, es **partir de uno que ya existe**
para crear otro. El material, la categoría, el proyecto, el proveedor y la
locación ya están escritos; volver a teclearlos es el trabajo que esto quita.

Lo que hay que decidir al escribirlo:

- **Qué se copia y qué no.** La cantidad seguro que NO (sacar 5 de un ingreso de
  40 es lo normal). La fecha, la de hoy, no la del movimiento original. Los
  documentos adjuntos, no.
- **Qué sobrevive al cambiar de tipo.** Es el corazón de lo que pide: cambiar
  ENTRY→EXIT→TRANSFER sin perder lo tecleado. Hoy el formulario se reconstruye
  al cambiar de tipo; hay que ver qué campos son comunes y conservarlos.
- **Ya existe medio camino**: `_entryFromIncoming` rellena el formulario de
  entrada desde una entrega. El molde de "abrir el formulario con datos puestos"
  está hecho.

## 4. INCOMING: AGRUPAR POR FECHA — MI OPINIÓN, QUE JOSE PIDIÓ

Jose: *"creo que si agrupamos por fecha y le ponemos una sola fecha a cada grupo
en los incomings en el pop-up y en la pestaña se vería mucho mejor, y en esta
última podríamos eliminar una columna, así podemos poner una columna de PO, PM,
etc., que nos daría más información al buscar. ¿Qué piensas?"*

**De acuerdo, y el argumento del buscador es el mejor de los dos.** Desde la
v12.06 el buscador mira en PO y PM, pero esas dos columnas **no se ven**: buscas
"7788", sale una fila, y no hay nada en pantalla que diga por qué salió. Poner
PO y PM es cerrar ese hueco, no sólo aprovechar el sitio.

**✅ LAS DOS, DECIDIDAS POR JOSE EL 2026-09-22:**

| Se propuso | Decidió |
|---|---|
| Dejar el ESTADO como grupo grande y la fecha como subtítulo dentro | **"Listo, me gusta la idea."** Se hace así. |
| Las de fecha no fija, al grupo de su fecha de inicio | **No: van ARRIBA.** *"Los que no tienen fecha fija deben aparecer arriba, justo donde está ésta."* |

**La segunda corrige mi propuesta, y tiene razón.** Yo iba a meter la entrega
con ventana `2026-09-11 → 2026-10-09` entre las del 11 de septiembre, ordenada
como si fuera de ese día. Lo que él pide es mejor para lo que se hace con esta
pantalla: **lo que no tiene día fijo va primero, dentro de su grupo de estado.**
Una entrega sin fecha cerrada es la que hay que llamar para confirmar, así que
es la que tiene que verse sin buscarla — y enterrada entre las de fecha exacta
se pierde. En su propia captura sale así, la primera de "Expected".

Aplica a las tres formas de fecha blanda que ya distingue el código
(`dateMode`): `window` (una ventana), `about` (aproximada) y `unknown` (sin
fecha). Las tres arriba, y las de fecha exacta debajo, en orden de día.

**Lo que queda por resolver:**

- **Ya hay grupos, y son por ESTADO** (Overdue / Expected / No date yet /
  Arrived / Cancelled), ordenados por lo que hay que hacer con cada uno. Si la
  fecha pasa a ser el grupo, ¿desaparece el estado? **Mi opinión: no.** El
  estado contesta *"¿qué va tarde?"*, que es la pregunta urgente; la fecha
  contesta *"¿qué llega el viernes?"*. Yo dejaría el estado como grupo grande y
  la fecha como subtítulo dentro de él. Con dos niveles el ahorro de columna se
  mantiene igual.
- **Las entregas con VENTANA de fechas no tienen una fecha.** En su captura:
  `2026-09-11 → 2026-10-09`. ¿A qué grupo va? Propuesta: al de su fecha de
  inicio, con la ventana escrita en la fila. Y las de "sin fecha" ya tienen su
  grupo, que sigue valiendo.

En el popup de la mañana el cambio es más simple y se gana más: hoy cada tarjeta
repite `2026-09-21` debajo del nombre (tres veces seguidas en su imagen 1).

## 5. LA VENTANA DE EDIT — DOS CAUSAS MEDIDAS Y UNA OPINIÓN

Jose: *"la ventana de Edit es muy pequeña incluso cuando la pantalla es grande,
lo que hace que siempre haya una scroll bar vertical a un lado."*

**Las dos causas están en el CSS y son de una línea cada una:**

1. **Edit es más estrecha que la ventana donde se creó el movimiento.**
   `#editMovOverlay` usa `.modal-md` (640px) y `#moveOverlay` —Entry/Exit— usa
   `.modal-lg` (760px). Los mismos campos en 120px menos se apilan más alto, y
   por eso hay que hacer scroll.
2. **`.modal{height:min(82vh,700px)}` es `height`, no `max-height`.** Toda
   ventana de la app mide el 82% de la pantalla **aunque su contenido ocupe la
   cuarta parte**. Y con `scrollbar-gutter:stable`, el carril de la barra se
   reserva siempre — por eso *"siempre"* hay barra, incluso cuando no hace falta
   desplazar nada. Esto no es sólo de Edit: es **las veinte ventanas**, y es el
   punto 2 de la sección A del estándar, con su causa por fin localizada.

**Y su propuesta de fondo: que Edit reabra la ventana donde se creó el
movimiento. Estoy de acuerdo, y con ganas.** Hoy hay dos formularios para el
mismo objeto, y ya han divergido: distinto ancho, distinto orden de campos y
distinto aspecto. Eso es exactamente lo que él dice — *"puede causar
confusión"*— y además es el patrón de fallo que más veces ha mordido este
archivo: **dos caminos para lo mismo, y sólo uno recibe los arreglos.**

**Sobre si el Edit debe dejar cambiar el TIPO de movimiento: estoy con él, no
debe.** Tres razones, en orden de peso:

1. **Cambiar ENTRY por EXIT no es editar, es borrar y crear otro.** Un ENTRY
   tiene estante de destino y costo; un EXIT tiene estante de origen y obra de
   destino. Reinterpretar los campos de uno como los del otro es la vía directa
   a un número de stock equivocado, que es lo único que esta app no se puede
   permitir.
2. **La auditoría deja de decir la verdad.** Un cambio de tipo escondido
   detrás de "editar" y su motivo se lee, seis meses después, como si aquel
   movimiento siempre hubiera sido así.
3. **El camino honesto ya existe y es reversible:** borrar (la papelera guarda
   30 días) y crear el correcto. Un cambio de tipo, en cambio, no se deshace.

**✅ Y JOSE RESOLVIÓ EL PROBLEMA QUE YO SEÑALÉ, 2026-09-22:** *"había olvidado
ese detalle. Entonces, así como sólo le dejamos al usuario reabrir el mismo tipo
de movimiento que hizo, también le restringimos la cantidad de materiales que
puede ingresar: como editará sólo un movimiento, entonces sólo será la
información de ese material y movimiento. Si necesita cambiar algo más, que lo
borre y lo haga de nuevo."*

Es la misma regla aplicada dos veces, y por eso encaja: **un movimiento guardado
es una fila, así que editarlo abre el formulario en modo de una fila.** Sin
cambiar el tipo y sin poder añadir un segundo material ni una segunda locación.
Lo que no cabe en esa fila no es una edición — es otro movimiento, y el camino
para eso es borrar y rehacer, que la papelera guarda 30 días.

**Lo que queda por resolver al escribirlo:** el
formulario de Entry admite **varios materiales y varias locaciones a la vez**, y
un movimiento guardado es **una sola fila**. Así que reabrirlo significa abrirlo
en un modo restringido —un material, una locación, sin el botón de añadir otro—
y ahí es donde esto se puede torcer. No es "llamar a la otra función": es darle
al formulario un modo que hoy no tiene.


# ══ DECISIONES DE JOSE — 2026-09-22 ══

Contestadas de una vez, todas. **Cerradas: no se vuelven a proponer.** Si alguna
se reabre tiene que ser porque Jose la reabra, no porque a alguien le parezca
mejor idea.

| Se le preguntó | Decidió |
|---|---|
| ¿Borro las páginas viejas de acopio.net? | **Dejarlas.** |
| El enlace a la app en el correo de aviso | **Quitarlo.** Hecho en v12.07. |
| ¿Mayúsculas a los comentarios al guardar? | **No. Dejar todo como está** — ni al guardar ni al pintar. |
| El nombre repetido debajo del material | **Dejarlo. "Eso no es un problema."** |
| Los nombres viejos del Incoming en minúsculas | **Dejarlos.** *"Yo los corrijo."* |
| El simulacro de restauración | **Esta semana, si se puede.** Él avisa. |

Dos de ésas —el nombre repetido y el formato de los comentarios— tenían arreglo
escrito y medido abajo. **Se quedan escritas a propósito**, marcadas como
descartadas: el análisis sirve si algún día cambia de opinión, y borrarlo
significaría volver a hacerlo. Lo que NO puede pasar es que alguien lea el
"arreglo propuesto" y lo aplique.

# ══ 🔶 A MEDIAS — LA COLUMNA LAST NOTE Y EL NOMBRE (2026-09-22 tarde) ══

> **Repaso 2026-10-05.** **1 y 2** descartados por Jose en su día. **3**
> (el mismo nombre en dos categorías) sigue abierto: hay que comprobar si el
> barrido de calidad compara **entre** categorías o sólo dentro de una. **4**
> (las tarjetas naranjas tapan la tabla) sin verificar: existe `test-capas.js`
> y el menú del avatar se arregló (v12.08), pero **no he comprobado esta
> tarjeta en concreto**, así que no se marca.

Jose, con tres capturas del Stock Dashboard: *"muestran la diferencia y la
repetición de comentarios en el mismo material, comentarios con formatos
diferentes, comentarios repetidos en 2 lugares y comentarios extra que aparecen
de 2 en 2."*

Son **cuatro cosas distintas** y hay que separarlas porque se arreglan en sitios
distintos. Las cuatro están confirmadas en el código, no supuestas.

### 1. ~~EL NOMBRE SE ESCRIBE DOS VECES~~ — ❌ DESCARTADO POR JOSE (2026-09-22)

> **"Deja el nombre repetido, eso no es un problema."** No se toca. Lo de abajo
> queda como el análisis de por qué pasa, por si algún día se reabre.

`Index_v3_fixed.html:6903`

```js
name: '<td class="sc-name"><strong>'+_he(s.name)+'</strong>'+
      (s.project && s.project!=='GENERIC'
        ? '<br><span …>'+_he(s.project)+'</span>' : '')+'</td>',
```

Debajo del nombre se imprime **la obra**. Cuando el material se llama igual que
su obra —y en el almacén de Jose pasa mucho, porque los materiales de una obra
se nombran por la obra— sale el mismo texto dos veces:

| Se ve | Es |
|---|---|
| `44 NORTH` / `44 NORTH` | nombre = obra |
| `ALTA VISTA` / `ALTA VISTA` | nombre = obra |
| `2PER SAGE@COMPASS` / `2PER SAGE@COMPASS` | nombre = obra |
| `HIGHLAND ROW TOWNHOMES` / `HIGHLAND ROW` | **distintas — ésta SÍ aporta** |
| `HF 156` / `GOO HF 156` | **distintas — ésta SÍ aporta** |

**Arreglo:** no imprimir la obra cuando, normalizada, es igual al nombre —
`nt(s.project) !== nt(s.name)`. Es una condición, no un rediseño. Ojo con
comparar en crudo: `"44 NORTH"` contra `"44 north"` tiene que contar como igual,
y es el mismo tropiezo del aviso de duplicado del Incoming.

### 2. ~~LOS COMENTARIOS SALEN CON EL FORMATO QUE SE TECLEÓ~~ — ❌ DESCARTADO POR JOSE (2026-09-22)

> Preguntado entre mayúsculas al guardar y pintar la columna pareja, contestó
> **"déjalos así como está"**: ninguna de las dos. Ni se normaliza al guardar ni
> se repinta la columna. El análisis se queda por si cambia de opinión.

`LAST NOTE` es el campo `comments` del último movimiento que tuvo comentario
(`Index_v3_fixed.html:6773`, "last wins"). Y `comments` se guarda con
`String(d.comments || '').trim()` — **sin normalizar**. Resultado en la misma
columna, en la captura:

```
WINDOW AND DOOR SEALANT     ← mayúsculas
white SEALANT               ← minúsculas
WINDOW SCREENS
CLAY WINDOWS IN FRONT O…
```

Es la misma familia que los nombres del Incoming de la v12.06, pero **la
decisión NO es la misma**, y conviene que quede escrito por qué:

- Un NOMBRE de material es una etiqueta, casi una clave. Ponerlo en mayúsculas
  no le quita nada: por eso la v12.06 lo hace en el servidor.
- Un COMENTARIO es una frase que escribió una persona. La regla de Jose —*"mantener
  los datos como el usuario los ingresó siempre"*— pega más fuerte aquí que en
  ningún otro campo de la app.

**Arreglo propuesto (decisión de Jose, ver la lista de decisiones):** guardar el
comentario **tal cual se escribió**, y pintar **la columna** con una sola
convención (mayúsculas, como el resto de esa tabla) para que la lista se lea
pareja. El texto completo y original sigue en la ayuda al pasar el ratón y en la
ventana del movimiento. Lo único que se normaliza al guardar es lo inofensivo:
espacios de sobra.

La alternativa —mayúsculas al guardar, como los nombres— es más simple y deja el
dato y la pantalla diciendo lo mismo, pero reescribe lo que Jose tecleó. Por eso
se pregunta en vez de decidirse.

### 3. EL MISMO NOMBRE EN DOS CATEGORÍAS, CON DOS COMENTARIOS DISTINTOS

En la captura, `RAIN BUSTER 450` sale dos veces:

| Categoría | Stock | Comentario |
|---|---|---|
| SEALANT/CAULK | 90 de 90 @ O4A | WINDOW AND DOOR SEALANT |
| FLASHING PAPER | 88 de 90 @ O1B | white SEALANT |

**Esto NO es un fallo de la app.** El identificador de un material es
categoría + nombre, así que son dos materiales distintos y la app los cuenta
bien. Lo que casi seguro pasa es que **uno de los dos está mal categorizado** —
un sellante en FLASHING PAPER—, y entonces el stock de ese producto está
partido en dos filas que nunca se suman.

**Arreglo:** no tocar el código. Esto es exactamente para lo que existe el
barrido de **Data Quality** (familia `similar`), que ya sabe encontrar nombres
parecidos y no aplica nada por su cuenta. Hay que comprobar si hoy compara
**entre categorías distintas** o sólo dentro de una; si es lo segundo, ése es el
cambio, y es en la prueba antes que en el barrido. Y la unión la hace Jose desde
Data Quality (`manageMaterial` op `merge`), que ya mueve las filas del archivo.

### 4. LAS TARJETAS NARANJAS TAPAN LA TABLA, Y DE DOS EN DOS

La tarjeta `ARRIVED · ENTRY NOT MADE` (la que recuerda que una entrega llegó y
le falta su entrada — `_todoAdd`) sale abajo a la derecha **encima de la tabla**,
y con el contador en 7 se ven dos apiladas con el texto de las filas
transparentándose por detrás: se lee `ginseng 456` mezclado con
`WHITE WHINDOW SCREENS` y `…DE ST DE FRONT` de las celdas.

**Es el mismo problema que el menú del avatar** anotado ayer, en otra capa: una
cosa flotante que no se apila bien sobre lo de abajo. Va con el **estándar de
las ventanas** y se arregla en el mismo barrido, no antes: tocar un `z-index`
suelto es como se llegó aquí. Lo que el barrido tiene que producir es **una
tabla de capas** —quién va encima de quién y por qué— y una prueba que la
recorra entera, no una regla nueva por cada cosa que aparezca tapada.

Y una cosa que NO es nuestra y conviene no "arreglar": `WHITE WHINDOW SCREENS`
está mal escrito en el dato. Es de Data Quality (familia `spelling`), no del
render.

# ══ ANOTADO EL 2026-09-22 ══

## SI ALGÚN DÍA SE ENCIENDE EL ESCÁNER DE GMAIL, HAY QUE REESCRIBIR LA POLÍTICA

Salió revisando las salidas de datos para contestarle a Jose *"¿hay algo más que
tenga que ver con seguridad, datos o manipulación de la información del
cliente?"*. **No es un problema hoy** y por eso está anotado y no arreglado:

- `scanGmailForDeliveries` **no está enrutado** en `processMovement` (el
  despachador lo dice en un comentario: "se queda para el día que salga como
  add-on de verdad").
- Está detrás de `GMAIL_SCAN_ENABLED`, que por defecto es `false`.
- No tiene interfaz: `getInitialData` manda `gmailScanEnabled: false` fijo.

O sea que hoy nadie puede ejecutarlo. Lo que hay que recordar es **qué cambia el
día que se encienda**: la sección 4 de la Política de Privacidad dice que lo que
se manda a Gemini son *"los documentos que tú eliges escanear"*, y ese escáner
no es eso — **busca en el buzón** (`GmailApp.search`) y manda los cuerpos de los
correos que encuentre. Un barrido del buzón no es una elección por documento.

Las dos rutas de IA que SÍ corren hoy sí encajan con el texto: un correo que la
persona **pega** a mano (`parseIncomingEmail`) y un archivo que **adjunta**
(`extractDocumentInfo`).

**Lo que hay que hacer si se enciende, antes de encenderlo:** reescribir la
sección 4 en `legal/PRIVACY-POLICY.md` (que `sync-legal.js` propaga a las dos
copias) para describir el barrido del buzón por lo que es, y decir con qué
consulta busca y qué manda. Y añadir al guardia de `test-checkin` —el que desde
la v12.07 lee el correo de instalación campo por campo— el mismo trato para esta
ruta. El escáner también pide el scope de Gmail y una auditoría anual pagada
para poder distribuirse, que es la razón original de que esté apagado.

# ══ ANOTADO EL 2026-09-21 (tarde) ══

## ✅ HECHO (v12.08) — EL MENÚ DEL USUARIO SE ABRE DETRÁS DE LAS TARJETAS

> **Las tres cosas, hechas.** El menú se pinta delante, el fondo no se mueve y
> las tarjetas de atrás no responden al ratón. Y la causa NO era la que parecía:
> `.acct-menu` declaraba `z-index:600` contra el `399` del mazo y aun así
> perdía, porque vive dentro de `.topbar`, que es `position:sticky` con
> `z-index:100` y abre su propio contexto de apilado — hacia fuera el menú valía
> 100. Subir el 600, que es lo primero que uno intenta, no habría hecho nada.
> Lo que sube es la barra, y sólo mientras el menú está abierto.
>
> De paso salió la **tabla de capas** que este mismo documento pedía: los
> veinticuatro `z-index` sueltos se cambiaron por una lista ordenada en el
> `:root`, y `tools/test-capas.js` mide con `elementFromPoint` cuál está delante
> de verdad en vez de comparar números. Quedan de este barrido los puntos 1 a 8
> de la sección A (la escala de texto, los anchos de ventana, los puntos de
> quiebre y las parejas descuadradas).

### El análisis, tal como se anotó

Jose, con dos capturas de una pantalla ancha y baja (tipo iPad apaisado):

> *"al abrir el menú del usuario éste se abre DETRÁS de las tarjetas. Creo yo
> que este menú debe tener prioridad y posicionarse sobre todo lo demás, ya que
> sólo se abre si damos clic en el avatar y eso significa que queremos hacer
> algo ahí. Entonces al abrir el menú del usuario y hacer hover y tenerlo
> abierto, las tarjetas de atrás no deben abrirse y tampoco la app de atrás debe
> moverse o hacer scroll (actualmente lo hace)."*

Son **tres cosas distintas**, y conviene separarlas porque se arreglan en
sitios distintos:

1. **La pila (`z-index`).** El mazo de tarjetas está por encima del panel del
   avatar. Su razonamiento es correcto y va más allá de este caso: un menú que
   se abre por un clic deliberado gana a cualquier cosa que se abra sola.
2. **El hover de las tarjetas de detrás.** Con el panel abierto, pasar el ratón
   por encima sigue abriendo el mazo. Es el mismo problema que ya resuelve
   `_modalShield` para las ventanas — el escudo existe y este panel no lo usa.
3. **El scroll del fondo.** Igual: el bloqueo de scroll ya está escrito para las
   ventanas y el mazo; el panel del avatar quedó fuera.

O sea que lo más probable es que **no haya que inventar nada**: hay que meter el
panel del avatar en el mecanismo que ya tienen las demás ventanas. Es el mismo
patrón de fallo de siempre (una conducta escrita para un camino y no cableada en
los otros), así que el arreglo debe ir con una prueba que recorra **todas** las
capas flotantes y no sólo ésta.

Va con el **estándar de las ventanas** (sección A de abajo): es el mismo trabajo.

# ══ ANOTADO EL 2026-09-21 ══

## A. EL CORREO DIARIO — TRES PREGUNTAS DE JOSE, CONTESTADAS

### 1. Qué es el (1)

`lista.length` — **cuántos movimientos hay en esa tabla**. "Llegó a la bodega (1)"
es una entrada en todo el día. Jose lo leyó bien pero tuvo que preguntar, y eso
ya dice que está mal puesto: es un número desnudo pegado a un título, sin nada
que diga qué cuenta. Debería decirlo, o no estar.

### 2. Qué es "Quién" — y por qué confunde

Es `m.responsible || m.userEmail`. O sea **DOS COSAS DISTINTAS en una columna**:

- lo normal, el campo *Received By* del movimiento — quien recibió o se llevó el
  material, que es como Jose lo leyó;
- y si ese campo está vacío, **el correo de quien registró el movimiento**, que
  es otra persona y otra pregunta.

Por eso en su captura una fila dice `JOSE` y la otra `James Williams`: son el
mismo campo, pero nada garantiza que las dos filas estén contestando lo mismo.

Lo que pidió Jose, y arregla las dos mitades:
- la columna pasa a llamarse **Received by / Taken by** (según el tipo: quien
  recibe en las entradas, quien se lo lleva en las salidas), y deja de caer al
  correo — si está vacío, se dice vacío;
- se añade **una columna nueva, `User`**, con **nombre Y correo** de quien
  registró el movimiento. La app ya tiene los dos: `userNames` mapea correo →
  nombre, y es lo mismo que hace la columna User de Movements desde la v11.73.
  Hay que reusarlo, no escribir otra forma de resolverlo.

### 3. Por qué está en español — y NO es tu Gmail

**Lo manda así la app.** Está escrito en duro en `Code_v3_fixed.gs`: el asunto,
los tres títulos de tabla, las cinco cabeceras, el mensaje del día sin
movimientos y el pie.

**BARRIDO HECHO, para saber cuánto más hay.** Se extrajeron las cadenas y el
texto entre etiquetas de los dos archivos (sin comentarios — los comentarios en
español están bien) y se buscaron palabras inequívocamente españolas:

| | |
|---|---|
| `Code_v3_fixed.gs` | **16 frases**, y las 16 son el correo diario |
| `Index_v3_fixed.html` | **1**: `<th>In Bodega</th>`, una cabecera de tabla |

O sea: **las pantallas ya están en inglés**; el español está concentrado en un
solo sitio y es fácil de cerrar. Lo que hay que hacer es traducir el correo
entero y cambiar esa cabecera por `In Warehouse`.

**Y que no vuelva.** Esto se coló porque nada lo miraba: una prueba que extraiga
las frases visibles y falle si alguna lleva palabras españolas cierra la clase
entera, igual que la de "ninguna frase dice lock" de test-reservas. Sin eso, el
siguiente correo nuevo vuelve a nacer en español.

## B. LAS ETIQUETAS — CUATRO COSAS

Jose: *"esta parte de los labels no se ve profesional, si ingreso 10 materiales
me van a salir las 10 previsualizaciones."*

### 1. Elegir CUÁLES llevan etiqueta, y poder imprimirlas después

Hoy el cuadro se abre con TODO lo que se acaba de guardar y una previsualización
por cada bulto. Con diez materiales son diez.

Lo que pidió:
- **una casilla en el formulario de entrada**, por material, para decir cuál
  quiere etiquetar — así la app ya sabe cuáles sin preguntar al final;
- **y poder imprimir después**: seleccionar un material o un movimiento y sacarle
  la etiqueta cuando haga falta. Hoy la única puerta es el momento de guardar; si
  la cierras, no hay segunda oportunidad sin repetir el movimiento.

La segunda parte es la que más vale: la barra de selección de Movements ya
existe (v11.59) y ya sabe actuar sobre varias filas. Imprimir etiquetas es una
acción más de esa barra, no una pantalla nueva.

### 2. Cinco puertas, cinco etiquetas de 1 — no una de 5

*"Hay 5 door screens que voy a poner en un mismo lugar, pero quiero imprimir un
label para cada una, entonces debe tener 1 en la cantidad."*

Hoy el `× N` del cuadro imprime **N copias de la misma etiqueta**, y todas dicen
la cantidad del bulto. Lo que hace falta es lo otro: **partir el bulto en N
etiquetas de 1**.

**Y hay que decirle a Jose lo que eso cambia**, porque no es sólo un número: hoy
la cantidad de la etiqueta significa *"cuánto hay de esto en este estante"*, y
partida significa *"cuánto hay en este bulto"*. Las dos son útiles y no son la
misma; si conviven, la etiqueta tiene que dejar claro cuál está diciendo, o un
día alguien sumará cinco etiquetas de 1 y creerá que hay 5 donde hay 5 bultos de
1. Probablemente la respuesta es un texto distinto en la etiqueta partida
("1 of 5"), no el mismo formato con otro número.

### 3. El recuadro de la locación — MI OPINIÓN, que Jose pidió

*"Podemos poner el cuadro de la locación sobre el cuadro de la cantidad y hacer
el cuadrado un rectángulo… ¿qué piensas tú?"*

**Tiene razón, y el motivo es medible.** Hoy los dos recuadros son `flex:1`, o
sea media etiqueta cada uno, y su contenido no se parece en nada:

- una cantidad son **1 a 4 caracteres** (`54`, `5`, `142`);
- una locación son **2 a 16** (`B1B`, `P4C`, `WINDOW WAREHOUSE`).

Repartir el ancho a partes iguales garantiza que uno desperdicie el 80% de su
caja mientras al otro no le cabe. Es exactamente lo de la captura.

**Y hay un fallo concreto detrás:** la clase que encoge la letra (`.sm`) se pone
**sólo cuando la locación está VACÍA**, nunca por longitud. Así que
`WINDOW WAREHOUSE` se dibuja a 10mm, el tamaño pensado para `B1B`, y parte en
tres líneas. Eso es un fallo, no una decisión.

Lo que yo haría, que es su idea afinada:
- **Locación arriba, ancho completo.** Con el bulto en la mano la pregunta es
  "¿a dónde va esto?"; la cantidad es la comprobación, no la búsqueda.
- **Cada recuadro, una sola línea**: la etiqueta pequeña a la izquierda y el
  valor a la derecha, en vez de etiqueta encima y valor debajo. Dos filas de una
  línea ocupan casi lo mismo que la pareja de dos líneas de hoy, así que **no se
  pierde sitio vertical** — que es lo que hay que cuidar, porque el nombre ya se
  lleva 29mm y el hueco del código 34.
- **La letra se encoge por LONGITUD**, con dos o tres escalones, no por "está
  vacío". Es el arreglo del fallo de arriba y es lo que hace que
  `WINDOW WAREHOUSE` quepa en una línea legible.

Lo que NO haría: bajar el tamaño de todas las locaciones para que quepa la más
larga. `B1B` se lee desde tres metros y así dejaría de leerse, para que se vea
bien un caso de cada diez.

### 4. Y de paso

El nombre del material se recorta a tres líneas (`max-height:29mm`). Con
`GHH-SCENICMTN-P2,5P-TT` entra justo. Merece una mirada cuando se toque esto,
porque si la locación gana altura, el nombre la pierde.


# ══ 🔶 A MEDIAS — DE LA PRUEBA DE LA v12.00 (2026-09-19) ══

> **Repaso 2026-10-05.** El buscador y el aviso de duplicado del Incoming
> están hechos (v12.06). **La columna DOC sigue abierta y comprobada:**
> `renderDocLinks` todavía termina en `flex-wrap:wrap`, que es exactamente lo
> que apila los documentos en columna y estira la fila.

Jose probó los cuatro cambios de la v12.00 y **los cuatro pasan**: "mark arrived
completado y trabajando bien", "adjuntar un documento esto funciona muy bien…
cuando se cierra la ventana ya el icono del documento ya está en la fila del
movimiento, también al borrar los documentos se hace instantáneo", el edit de un
movimiento "sí funciona", y "el mazo, sí funciona todo".

De esa misma sesión salieron cuatro cosas a anotar. Tres son del estándar de las
ventanas (sección A, más abajo) y una es de datos.

## ✅ HECHO (v12.06) — LOS NOMBRES DEL INCOMING SE NORMALIZAN

`addIncoming` y `updateIncoming` guardan ahora `cleanDisplay_(name)` y
`cleanDisplay_(category)`, exactamente igual que un movimiento, y el navegador
tiene el gemelo `_limpiarNombre` para que lo que pinta al instante sea ya lo que
se va a guardar. Una prueba ejecuta las dos y compara sus salidas letra por
letra sobre las mismas siete entradas, así que no pueden separarse en silencio.

**Lo que NO se hizo, y es decisión de Jose:** las entregas que YA están
guardadas en minúsculas se quedan como están hasta que alguien las edite.
Reescribir de una pasada lo que ya hay cambia datos que él tecleó, y su regla es
que los datos se mantienen como el usuario los ingresó. No hace falta para nada:
el aviso de duplicado y el buscador comparan normalizando al vuelo, así que las
viejas funcionan igual. Si quiere la pasada, es una línea.

## 2. LA COLUMNA DOC: DOS AL LADO, Y UNA FLECHA PARA EL RESTO

Jose, con la imagen: *"no quiero que los documentos se pongan en columna, porque
si en algún momento un movimiento llega a tener 10 documentos eso ocupará toda
la pantalla… como quiero que se vean: los documentos uno al lado del otro,
máximo 2, y cuando haya más de 2 aparece una flecha o un símbolo '>' que indica
que hay más y al tocar se mueve para mostrar los documentos."*

Hoy `renderDocLinks` devuelve un contenedor con `flex-wrap:wrap`. En una celda
estrecha de la tabla eso no pone los recortes al lado: los **envuelve**, o sea
los apila en columna y la fila crece tanto como documentos haya. Con diez
documentos la fila ocupa la pantalla, que es justo lo que él describe.

Lo que hay que decidir al construirlo:
- El carrusel va dentro de una celda de tabla, que es lo más estrecho de la app.
  `overflow-x` con desplazamiento por pasos, no un `wrap`.
- La flecha tiene que decir CUÁNTOS faltan, no sólo que faltan. "2 de 10" se lee;
  una flecha sola no.
- Y en el teléfono la tabla ya se comporta distinto — hay que mirar si ahí el
  carrusel estorba o ayuda.

## 3. TRES COSAS QUE SON DEL ESTÁNDAR DE LAS VENTANAS

Van a la sección A de abajo, pero con la causa ya encontrada:

**a) LAS VENTANAS SON DEMASIADO GRANDES — y es UNA LÍNEA, para las 20.**

Jose, sobre Manage Documents: *"la ventana pop-up del ingreso de documentos es
muy grande para la información que lleva."* Y el 17, sobre Add/Edit User, lo
mismo.

**No es el ancho. Es esto:**

```css
.modal{ … height:min(82vh,700px); … }
```

**`height`, no `max-height`.** Toda ventana de la app mide el 82% del alto de la
pantalla aunque tenga cuatro campos dentro. Por eso Manage Documents, que lleva
unos 350px de contenido, se dibuja como una caja de 700px con el hueco debajo de
los botones.

Cambiar `height` por `max-height` arregla las 20 de golpe. **Pero hay que
comprobar antes qué se apoyaba en esa altura fija** — Settings y el formulario de
movimiento son largos y pueden estar contando con un alto estable para su propio
scroll. No es "cambiar una palabra y ya": es cambiar una palabra y volver a mirar
las veinte.

**b) EL BOTÓN CAMBIA DE TAMAÑO AL GUARDAR.**

Jose, con dos capturas del Edit de un movimiento: *"al momento de guardar, el
botón cambia no sólo lo que dice sino de tamaño, eso no debe pasar."*

**Medido en sus capturas, y el ancho NO es el problema:** el borde derecho no se
mueve, porque `_btnBusy` ya fija `minWidth` antes de cambiar la etiqueta —
alguien ya se topó con esta mitad. Lo que cambia es **el alto**: unos 4px menos.

**La causa es el emoji.** La etiqueta original es `💾 Save Changes` y la de
ocupado es una rueda dibujada con CSS más `Saving…`. La caja de línea de un emoji
es más alta que la de texto normal, así que al quitarlo la línea encoge y el
botón con ella. `.is-busy` no toca el alto — sólo cambia el cursor.

El arreglo es del estándar, no del parche: los botones necesitan un alto que no
dependa de lo que lleven dentro. Y sirve para todos los botones con emoji de la
app, que son muchos.

**c) Y las dos que ya estaban anotadas** — el tamaño de Add/Edit User y el
`ADDED BY` con el nombre — se resuelven con (a) y con el punto 7 de la sección A.

# ══ 🔍 SIN REVISAR ENTERA — PARA REVISAR AL FINAL (2026-09-17) ══

> **Repaso 2026-10-05:** el estándar de las ventanas tiene parte hecha —el
> alto de las ventanas, con `test-ventanas.js`— pero **no he repasado la lista
> de revisión entera**, así que no se marca nada. Queda como trabajo de
> revisión, no como pendiente nuevo.

Jose: *"HAY QUE MEJORAR LAS VENTANAS (TODAS) QUE SE ABREN DENTRO DE LA APP. HAY
QUE DARLES UN ESTÁNDAR A CADA UNA Y REVISAR QUÉ DEBE Y NO DEBE SER DIFERENTE EN
CADA TAMAÑO DE PANTALLA, POR QUÉ, QUÉ DEBE Y NO DEBE SER DIFERENTE POR CADA TIPO
DE MOVIMIENTO Y POR TIPO DE MATERIAL, PORQUE VEO COSAS DE ESCALAS DISTINTAS Y
TAMAÑOS DISTINTOS EN ALGUNOS LUGARES DONDE DEBERÍAN SER LO MISMO. HAZ UNA LISTA
DE TODO LO QUE DEBEMOS REVISAR Y ANÓTALO PARA REVISARLO AL FINAL."*

**Él dijo "al final". Esto no se empieza hasta que lo diga.**

## A. EL ESTÁNDAR DE LAS VENTANAS

### De dónde salió — y la parte que hay que decirle

Jose, con la captura del popup de la mañana: *"las palabras 'PENDING' y
'ARRIVED' son distintas, cantidad de letras igual, color distinto y eso está
bien, pero tienen tamaño de letra distinto, ocupan espacios distintos y ARRIVED
parece más grande, no sé si yo te pedí que fuera así."*

**SÍ LO PIDIÓ ÉL**, y su frase está en el comentario del código
(`Index_v3_fixed.html`, junto a la regla): *"no quiero más grande el arrived aquí
en incomings, sino más grande el arrived en el popup"*. La regla es una sola
línea:

```css
#morningPopupBody .inc-status-arrived{font-size:.82rem;padding:.18rem .7rem}
```

**Lo que nunca se decidió es si `Pending` debía seguirla.** El override se
escribió para `arrived` solo, `pending` se quedó en la base (`.68rem`,
`padding:.1rem .5rem`), y en ese popup las dos etiquetas se ven juntas
contradiciéndose. O sea: no es un despiste suelto, es **una decisión tomada para
la mitad de un par**. Es exactamente la forma del problema que él describe, y por
eso el arreglo no es "igualar esas dos" sino tener una regla.

**✅ CONTESTADA POR JOSE — 2026-09-22.** Se le hizo en dos preguntas separadas,
porque la primera vez estaban mezcladas y no se entendió:

| Pregunta | Respuesta |
|---|---|
| ¿El popup debe tener letra más grande que el resto de la app? | **No. Igual que las tablas.** |
| ¿`PENDING` y `ARRIVED` deben medir lo mismo entre ellas? | **Sí, las dos iguales.** |

**Qué significa eso para el código, exactamente:**

1. Se BORRA el override `#morningPopupBody .inc-status-arrived{font-size:.82rem;
   padding:.18rem .7rem}`. No se le añade el gemelo para `pending` — que era la
   otra salida— porque la primera respuesta dice que el popup no tiene escala
   propia.
2. La etiqueta de estado pasa a ser **un solo objeto**, del mismo tamaño en el
   popup y en la tabla, cambiando sólo el color.
3. Y hay que revisar si algo MÁS del popup lleva un tamaño propio. Si aparece,
   se quita por la misma razón, no se discute otra vez.

**Ojo al borrarlo:** ese override nació de una petición suya de hace meses —*"no
quiero más grande el arrived aquí en incomings, sino más grande el arrived en el
popup"*—, y su frase está en el comentario junto a la regla. La decisión de hoy
la sustituye, pero el comentario hay que reescribirlo diciendo eso, no borrarlo
a secas: dentro de seis meses, "por qué desapareció esto" tiene que tener
respuesta.

### Lo medido, para que la revisión no empiece a ciegas

| | |
|---|---|
| ventanas con su propio `id="…Overlay"` | **20** |
| anchos `max-width` distintos en el archivo | **20+** (420, 430, 460, 480, 520, 560, 600, 640, 720, 768, 900…) |
| puntos de quiebre `@media` distintos | **11** (520, 560, 600, 640, 720, 768, 900, 1000, 1100 px, + `min-width:769`) |
| tamaños de letra distintos | **18**, entre `.58rem` y `.9rem` |

Los tamaños de letra son el dato que más habla: hay `.72`, `.74`, `.75`, `.76`,
`.78`, `.8`, `.82`, `.84`, `.85`, `.86`, `.88`. **Nadie ve una diferencia de
`.01rem`.** No son once decisiones: son once veces que alguien escribió "pequeño"
sin mirar lo que ya había. Lo mismo con los once puntos de quiebre — cada uno se
eligió donde se rompió una cosa concreta, no como sistema.

### La lista de revisión

**1. Una escala de texto, y que sea corta.** Cuatro o cinco tamaños con nombre
(`--t-dato`, `--t-etiqueta`, `--t-titulo`…) en vez de dieciocho números sueltos.
La prueba que lo sostiene no es "existen las variables": es **contar los
`font-size:` literales que quedan fuera de la escala** y que ese número no pueda
subir. Un comentario no aguanta esta invariante; un número contado sí.

**2. Un juego de anchos de ventana, no veinte.** Probablemente tres: la de
confirmar (estrecha), la de un formulario (media), la de una tabla o Settings
(ancha). Y escrito POR QUÉ cada ventana es de su clase, porque eso es lo que
evita que la siguiente ventana traiga su propio número.

**3. Los puntos de quiebre, reducidos a los de verdad.** Hay que mirar los once y
decidir cuáles son el mismo umbral con dos números distintos. Sospecha a
comprobar, no conclusión: 600/640, 720/768 y 900/1000/1100 huelen a tres
umbrales, no a nueve.

**4. Qué cambia por tamaño de pantalla — y qué NO debe cambiar.** Esta es la
mitad que él pide explícitamente y que no está escrita en ningún sitio. Lo que
seguro cambia: los anchos, si una tabla se vuelve tarjetas, si el mazo de la
esquina desaparece a favor de la campana (ya pasa por debajo de 900px). Lo que
seguro NO debería: el significado de un color, el tamaño RELATIVO de dos cosas
que están juntas (el caso de `Pending`/`Arrived`), y el orden de los botones.

**5. Qué cambia por tipo de movimiento — comprobado: hoy NADA.** Ningún ancho ni
ninguna escala depende de `moveType`; se midió y no hay una sola regla que lo
haga. Así que la tarea aquí no es arreglar, es **decidir si eso está bien** y
escribirlo. Lo que sí cambia hoy por tipo son los CAMPOS que pide el formulario
(un TRANSFER pide dos estantes, una ENTRY pide costo), y eso es contenido, no
escala. Merece quedar dicho para que nadie lo "unifique" por error.

**6. Qué cambia por tipo de material.** Hay que mirarlo: el factor de unidades
por caja, la etiqueta de costo y el selector de unidad se comportan distinto
según la unidad del material. Averiguar si alguna de esas diferencias se filtró
al TAMAÑO de algo en vez de quedarse en el contenido.

**7. El barrido de las parejas.** El caso del popup no va a ser el único: hay que
buscar sitios donde dos cosas que se leen JUNTAS tengan escalas distintas.
Candidatos a mirar uno por uno, no a suponer: las píldoras de categoría contra
las de estado, los seis colores de tipo de movimiento, el nombre sobre el correo
en Movements contra el de Manage Users contra el de la tarjeta de la persona, y
los tres tamaños de botón (`btn-sm`, normal, `btn-primary`).

**8. Lo que ya está en la lista y es parte de esto** — no se arregla aparte:
- el tamaño de la ventana de Add User / Edit User, que Jose pidió el 2026-09-17:
  *"la ventana del Add User es muy grande, no debe ser tan grande si lo que tiene
  dentro no es tanto, y lo mismo cuando se edita un usuario, debemos estandarizar
  eso."* Es el punto 2 visto desde una ventana concreta.
- `ADDED BY` con el nombre de la persona, apilado *"exactamente igual"* que en
  Movements. Es el punto 7 visto desde una columna concreta.

**Y una advertencia para cuando se haga:** esto toca CSS que sostiene cosas que
Jose pidió una por una y que están defendidas en sus comentarios (el gris del
popup en vez del verde, el `--card-h` de `.todo-card` que tiene que venir después
de `.deck-card`, el ancho fijo de la tarjeta de la persona). Un barrido que
"limpie" sin leer esos comentarios va a deshacer decisiones suyas. Cada regla que
se toque hay que leerla antes.

## ✅ HECHO (v12.06) — INCOMING: BUSCADOR Y AVISO DE DUPLICADO

**El buscador** es el mismo molde de Movements: `#incSearch`, escribe y filtra,
sin botón. Busca en nombre, PO, proveedor, PM, notas y categoría — y el marcador
de posición nombra los cinco primeros, con una prueba que comprueba que lo que
se busca y lo que se anuncia son lo mismo. No toca la vista de semana, que es un
calendario y no una lista. El vacío dice por qué está vacío y cuántas hay en
total.

**El aviso de duplicado**, con la regla que dio Jose el 2026-09-21:

| Señal | Trato |
|---|---|
| Mismo PO + mismo material | Aviso fuerte. El PO es la identidad. |
| Dos PO y distintos | No se avisa: son dos pedidos. |
| Sin PO: nombre + proveedor + fecha a ±7 días | Aviso suave, "posible duplicado". |
| Mismo nombre, otro proveedor | No se avisa. Lo pidió él expresamente. |
| Una cancelada | No cuenta: volver a anotarla es lo correcto. |

El cuadro enseña las dos entregas en columnas, campo a campo, con lo que difiere
marcado — la comparación ES la revisión, en vez de un botón que lleva a otra
pantalla. Tres salidas: editar la que ya existe (y no crear una segunda), crear
igual, o cancelar. Salta al guardar, nunca mientras se teclea.

**Lo que queda de esta sección, y sigue abierto:** la sugerencia que acompaña
mientras se escribe el nombre en el formulario de Incoming —enseñar debajo las
últimas entregas de ese material— que es la forma de PREVENIR el duplicado en
vez de avisarlo. Se cruza con el punto 1 de la lista del 2026-09-09 (por qué las
sugerencias del Incoming no siempre salen).


# ══ 🔍 HISTÓRICA (casi toda ✅ v11.x) — LA LISTA ORDENADA, 2026-09-09 ══

> **Repaso 2026-10-05:** esta sección es sobre todo historia de la v11, con
> sus ✅ ya puestos uno por uno. **Dos cosas quedan marcadas ⛔ dentro y no se
> han vuelto a mirar**: las cabeceras viejas que faltan en una instalación
> existente (que el 🩺 parece resolver hoy — dice "15 header row(s)
> restored"— pero **no lo he comprobado contra esa entrada**) y las preguntas
> abiertas de permisos. No se marca nada de aquí sin leerlo entero.

De más urgente a menos. Lo de arriba estorba para publicar; lo de abajo puede
esperar meses sin que pase nada.

**1. LAS SUGERENCIAS DEL INCOMING — VERIFICAR POR QUÉ NO SIEMPRE SALEN.**
**Jose lo aplazó el 2026-09-10:** *"no, déjalo así pero anótalo para estudiarlo
más tarde, luego de terminar lo importante."* Sigue siendo una INVESTIGACIÓN, no
una tarea.
Jose, 2026-09-10: *"la app no siempre muestra como sugerencia lo que tenemos en
el incoming, ¿por qué? También debería mostrar si ya llegó o no el material de
incoming."*

Dos cosas, y la primera es una investigación, no una tarea:

- **POR QUÉ NO SIEMPRE.** Hay que medirlo antes de tocar nada. Las sospechas a
  descartar una por una: que la sugerencia compare por nombre exacto y no
  normalizado (la misma familia que el `nt()` de todo lo demás), que sólo mire
  las entregas de cierta ventana de fechas, que se salte las que ya están
  marcadas como llegadas, o que la lista del navegador esté vieja. Ninguna de
  esas es una respuesta hasta que se compruebe cuál es.
- **SI YA LLEGÓ O NO.** Esto sí es claro: la sugerencia tiene que decir el
  estado de la entrega, porque no es lo mismo "viene el jueves" que "llegó ayer
  y está sin registrar".

**2. LA RESPUESTA VISUAL: QUE LA PANTALLA CAMBIE AL PULSAR, NO AL CONTESTAR EL
SERVIDOR.** Jose, 2026-09-10, y es la pregunta buena:

> *"siempre veo que al guardar, borrar, o hacer otras cosas la app primero
>  piensa y luego manda el toast verde y luego le toma otro tiempo y momento
>  cambiar lo que sea que se hizo… cuando elimino lo que sea que elimine, debe
>  moverse y desaparecer con la animación en el mismo segundo que el toast."*

**LO QUE SE COMPROBÓ EN EL CÓDIGO, porque una parte de su descripción no es lo
que pasa:** en `_doDeleteMovementRow`, quitar la fila, repintar y sacar el aviso
están en el MISMO bloque síncrono. La fila y el toast salen juntos, no uno
después del otro.

**Así que lo que él ve son los otros dos tiempos, y los dos son reales:**

**(a) LA ESPERA ANTES DEL TOAST.** Borrar UN movimiento hace que el servidor
reconstruya `LIVE_STOCK`, `SITE_STOCK` y `WASTED_STOCK` **desde el archivo
entero** (`refreshDerivedSheets_`). Eso es el "primero piensa", y no es un
adorno: es el precio real de la operación.

**MEDIDO, en la hoja de Jose, el 2026-09-10 y el 2026-09-11.** 1060 movimientos
en `MASTER_ARCHIVE_V3`, `ARCHIVE_HISTORY` vacía, 475 + 178 + 2 filas en las
derivadas. `tools/medir-refresco.gs`, doce corridas:

| | |
|---|---|
| refresco completo | **3,1 – 5,1 s** (un mal momento de Google lo subió a 12,1) |
| leer el archivo entero (1061 × 23) | 643 – 983 ms |
| leer `ARCHIVE_HISTORY`, **0 filas** | 422 – 1043 ms |
| escribir las tres derivadas | 684 – 1093 ms |
| `getLastRow()` sobre una hoja | 225 – 435 ms |

**LA CONCLUSIÓN QUE CAMBIA TODO EL PLANTEAMIENTO: leer veinticuatro mil celdas
cuesta lo mismo que leer NADA.** Sheets no cobra los datos, cobra el VIAJE — unos
300–400 ms lleve lo que lleve. `refreshDerivedSheets_` hace unos nueve viajes, y
nueve por 400 ms es clavado lo que se mide.

**Eso descarta el cambio grande.** Que borrar AJUSTE los totales en vez de
recalcularlos quitaría **una lectura de nueve llamadas**, y es el cambio con más
riesgo de todos: un error ahí no se ve hasta que los números no cuadran. No vale
la pena.

**Y descarta también el mediano, medido el 2026-09-11.** La idea era un
`setValues` por hoja en lugar de `clearContents` + `setValues`. Se pusieron las
dos formas a competir de verdad, por turnos, tres vueltas en cada una de tres
corridas — **la propuesta perdió las nueve veces**:

| | A (lo de hoy) | B (la propuesta) |
|---|---|---|
| corrida 1 | 1093 ms | 3282 ms |
| corrida 2 | 684 ms | 1478 ms |
| corrida 3 | 799 ms | 2064 ms |

Y la razón es exacta: B tiene que preguntar `getLastRow()` en cada hoja para
saber hasta dónde rellenar con vacíos. Tres viajes extra de ~265 ms ≈ los 794 ms
de diferencia de la corrida 2. **`clearContents()` sale más barato que
`getLastRow()`**: la propuesta cambiaba una llamada barata por una cara y encima
no quitaba la otra.

**Lo único que sí se hizo (v11.74):** no leer `ARCHIVE_HISTORY` cuando está
vacía. Ahorra ~300 ms de los ~4 s — modesto, pero es un viaje menos en cada
guardado y cada borrado, y no tiene contrapartida.

**LO QUE QUEDA, Y ES EL ÚNICO LEVER GRANDE QUE SIGUE EN PIE: refrescar UNA VEZ
al final de la ráfaga, no en cada operación.** Borrar diez movimientos son hoy
diez reconstrucciones completas del almacén: ~40 segundos de servidor para un
trabajo que, hecho una sola vez al final, cuesta 4.

**(b) EL CAMBIO DE DESPUÉS.** Al terminar la ráfaga se pide
`loadDataFromGoogle`, y cuando llega repinta los totales. Si estás mirando el
Dashboard, ESE es el momento en que ves cambiar los números — no el toast.

**LO QUE PIDE ES LO CORRECTO Y TIENE NOMBRE: quitar la fila AL PULSAR, no al
recibir la respuesta.** Y devolverla si el servidor dice que no. Hoy al pulsar la
fila sólo se atenúa; irse, se va cuando el servidor contesta.

**Y UNA COSA QUE APARECIÓ AL LEER `refreshDerivedSheets_` (2026-09-10).** El
comentario de las reparaciones de MatID dice:

> *"One setValues call per affected sheet (archive/history), not per row — same
>  batching discipline as everything else in this function."*

Y la línea de debajo hace **una escritura por fila**:

```javascript
archiveFixes.forEach(function(f){ archive.getRange(f.rowNum, AC.MAT_ID + 1).setValue(f.correctMatId); });
```

Cada `setValue` es un viaje a Sheets. Cien filas con el MatID desincronizado son
cien viajes en un solo refresco. **Se cura solo** —al refresco siguiente ya no
hay nada que reparar— así que no se paga en cada borrado, pero el PRIMER
refresco después de una deriva puede ser durísimo, y es justo la clase de
lentitud que aparece sin motivo aparente y se va sola antes de que nadie la
mire. Es además el mismo patrón que ya mordió a este código dos veces: **el
comentario dice una cosa y el código hace otra.**

**MEDIDO, y NO es de aquí de donde sale el tiempo.** `tools/medir-refresco.gs`
corría el refresco tres veces seguidas a propósito: como se cura solo, sólo la
primera vuelta puede llevar reparaciones. En nueve vueltas la primera NO fue
sistemáticamente más lenta —en una corrida la segunda fue la más lenta de las
tres—, así que las reparaciones no explican los ~4 s. **Sigue siendo un fallo
real que hay que arreglar** (el comentario promete un `setValues` y el código
hace `setValue` por fila), pero es un arreglo de corrección, no de velocidad.

**LAS TRES PIEZAS, y conviene no confundirlas:**

1. **Quitarla al pulsar** (con vuelta atrás si falla). Es lo que hace que se
   sienta instantáneo, y es independiente de lo que tarde el servidor.
2. **La animación de salida**, que es la parte fácil — pero ver el punto de
   abajo, porque hoy no se vería.
3. **(a), que NO se arregla con nada de lo anterior.** Si reconstruir los
   totales tarda tres segundos, tarda tres segundos. Lo que cambia es que la
   persona ya no espera mirando: la fila se fue y el resto se pone al día solo.
   Si hace falta atacarlo, la vía es que borrar ajuste los totales en vez de
   recalcularlos desde cero — y eso es un cambio grande, con su propio riesgo.

---

**LA ANIMACIÓN AL QUITAR UNA FILA — ESTÁNDAR DE LA APP, NO DE UNA PANTALLA.**

Jose lo dejó claro el 2026-09-09, y cambia el alcance: *"quiero esta animación
en cada lugar donde se borre algo, ya sea que se corrija, restaure, elimine,
haga merge, etc. Debe ser estándar en la app."*

O sea que no es "animar el borrado de movimientos": es **una sola forma de que
una fila se vaya**, escrita una vez y usada en todas partes. Los sitios donde
hoy una fila desaparece de golpe:

- borrar un movimiento (Movements)
- restaurar uno desde la papelera (la fila se va de la papelera)
- vaciar la papelera entera
- fusionar materiales, proyectos, proveedores o locaciones — la que se absorbe
- borrar una locación vacía (v11.62)
- quitar un valor del catálogo, un contacto del directorio, una entrega esperada
- aplicar un arreglo de "Check my data"

**La lección de la v11.66 aplica aquí antes de empezar:** varias de esas
pantallas se repintan enteras al terminar. Una animación de salida sobre un
repintado completo no se ve — la fila no se encoge, la lista entera parpadea.
Así que esto obliga a que cada una de esas listas sepa quitar UNA fila en vez de
redibujarse, que es exactamente el cambio que ya se hizo en la papelera y en los
movimientos. **Ése es el trabajo de verdad; la animación es la parte fácil.**

Y la otra mitad, que no se resuelve animando:

Jose: *"está bien como lo hace pero aún no lo veo con la velocidad que quisiera,
no sé por qué"*. Dos cosas distintas y conviene no confundirlas:
- **Lo que se siente.** Una fila que se encoge y deja subir a las de abajo
  despacio se lee como "esto está pasando", mientras que una que desaparece de
  golpe se lee como un parpadeo. Es lo que él describe y es barato.
- **Lo que tarda de verdad.** Cada borrado sigue reconstruyendo los totales de
  todo el almacén en el servidor. La cola lo ordenó; no lo hizo más rápido. Si
  al medirlo resulta que son segundos, la animación tapa el síntoma y hay que
  mirar si el refresco puede esperar al final de la ráfaga.

**3. LAS TARJETAS NARANJAS SE SALEN POR ARRIBA DE LA PANTALLA.**
Jose, 2026-09-10, con captura: *"quisiera que al pasar el mouse por las
tarjetas hubiera un lugar donde se ocultaran, como una pared invisible que las
oculta cuando se abren todas, pero también quiero que se pueda hacer scroll
vertical para ver todas las tarjetas cuando quiera, no quiero la barra de
scroll, sólo hacer scroll... la pared puede dejar que las tarjetas se abran
hasta unos 3/4 del alto o 2/3, no sé, ¿qué piensas tú?"*

Con muchas tarjetas abiertas, la pila crece hacia arriba hasta salirse de la
ventana: **las de arriba dejan de existir para quien mira**. No es incomodidad,
es trabajo pendiente que no se puede ni ver ni pulsar.

**Tres piezas:**

- **El techo.** Un alto máximo para la pila, y lo que sobra se desplaza en vez
  de salirse.
- **Sin barra de scroll**, pero con scroll de rueda y de dedo. Es exactamente lo
  que hace `scrollbar-width: none` + `overflow-y: auto`: la barra no se dibuja,
  el gesto sigue funcionando.
- **Qué altura.** ÉL PREGUNTA Y YO CONTESTO: **2/3, no 3/4.** Razón: la pila
  crece desde abajo, y por encima de ella está la barra superior con el avatar,
  la campana y las pestañas. Con 3/4 la tarjeta más alta queda pegada a esos
  controles y el ojo no sabe dónde acaba una cosa y empieza la otra. Con 2/3
  queda un tercio de ventana limpio arriba, que se lee como el borde de la pila
  sin tener que dibujar ninguna línea. Si con 2/3 se ve corto en un portátil
  bajo, el arreglo es un mínimo en píxeles (`max(66vh, 420px)`), no subir la
  fracción.

**4. EL ESTADO DE UN MATERIAL SÓLO SE VE EN EL MAPA** (candados, reservas,
mínimos). Detalle completo más abajo. Es el que cuesta material cargado en una
camioneta que hay que volver a bajar.

**5. MANAGE USERS — EL REDISEÑO.** La recarga ya está arreglada (v11.58);
queda cómo se editan los usuarios, la ventana más grande, el correo en una
línea, y quitar el scroll lateral.

**6. EL TÍTULO DEL PANEL = NOMBRE DEL MATERIAL**, para teléfonos.

**7. EL MODO RÁPIDO DEL LATIDO** (5 s justo después de un cambio).

**8. LA CALCULADORA DE CUOTA de Apps Script** + intervalo configurable.

**9. LA CALCULADORA DE UNIDADES POR CAJA / PALLET.**

**10. AL FINAL, decidido por Jose:** el logo al arrancar, las imágenes del
sitio, la política de cobro y el rediseño del modelo de movimientos.

---

### PREGUNTA ABIERTA DE JOSE (2026-09-08) — ¿PERMISOS POR TIPO DE MOVIMIENTO?

*"¿es posible desglosar más los permisos? por ejemplo que el admin seleccione si
quiere que alguien haga sólo entrys o sólo exits, sólo waste, o sólo returns?"*

**Técnicamente, sí, y es barato.** `requirePerm_` ya existe y todos los tipos
entran por la misma puerta (`processMovement` → `addMovement`/`addMultiEntry`/
`addMultiExit`), así que sería un interruptor por tipo y una comprobación en un
sitio. La parte visible es más trabajo que la de permisos: esconder las pestañas
que alguien no puede usar, porque un botón que siempre dice que no es peor que
un botón que no está.

**Lo que hay que decidir ANTES de construirlo, y no es técnico:**

- **WASTE y ADJUST no son como los otros cuatro.** Los dos dicen "el número
  estaba mal" y los dos cambian el stock sin que entre ni salga material. Ésos
  son los que un dueño querría restringir de verdad. Es posible que la respuesta
  correcta no sea "seis interruptores" sino **dos**: *puede registrar
  movimientos* (los cuatro normales) y *puede corregir el conteo* (waste/adjust).
- **Cada interruptor nuevo es una combinación más que puede estar mal.** Seis
  interruptores son 64 combinaciones; la mitad no tienen sentido (poder hacer
  EXIT y no ENTRY) y alguien las va a configurar igual.
- **Y hay que preguntarse por el problema de verdad:** ¿es que alguien registra
  el tipo equivocado, o que alguien registra algo que no debería? Si es lo
  primero, esto no lo arregla — lo arregla que el formulario sea más claro.

**Mi recomendación:** anotarlo y esperar a que aparezca el caso real. Ahora
mismo no hay ningún cliente que lo haya pedido, y el diseño correcto depende de
por qué lo pide.

---

### ⚠ ANTES DE PUBLICAR EN REDDIT — para que nadie diga "esto está roto"

**Estorba de verdad:**
- **Capturas.** No hay ninguna en la landing (`landing/assets/` sólo tiene el
  logo). Jose ya está haciendo una copia con otro nombre —"MY WAREHOUSE"— para
  no arrastrar la marca de OX. Faltan los formularios de ENTRY y EXIT abiertos,
  y una de móvil.
- **Nada que hacer al llegar.** El único botón es un `mailto:`. O el paquete
  gratis para instalar, o una demo con datos falsos y sólo lectura.

**Importante:**
- **Las guías están en español** (`instalacion.html`, `restaurar.html`,
  `soporte.html` son `lang="es"`). Un post en inglés las lleva a un muro.
- **La página pública de instalación tiene una nota interna pegada dentro**:
  *"Actualizar un cliente ya instalado — SON TRES ARCHIVOS, NO DOS"*.

**No estorba:** los cobros. Facturar a mano por correo es lo correcto para los
primeros clientes; montar cobros para un tráfico que todavía no existe es
trabajo antes de tiempo. Lo que sí conviene es que el precio no quede colgado
sin ninguna acción al lado.

---


## Decisión abierta — 2026-09-09

**¿LA COLA MUERE CON LA PESTAÑA, O VIVE EN EL SERVIDOR?** La v11.64 la puso en
el navegador: resuelve el caso de todos los días y no gasta cuota. Pero si la
persona cierra la ventana con algo esperando, eso se pierde.

Una cola que sobreviva a cerrar la ventana necesita una hoja de pendientes y un
disparador que los vaya sacando. Funciona — y **gasta cuota de Apps Script, que
es del DUEÑO de la copia, no de cada usuario**. Es una decisión de negocio.

**DECIDIDO por Jose el 2026-09-09: esperar.** Que la del navegador esté en
producción y ver si alguien pierde algo de verdad. Construir la del servidor
por si acaso es pagar cuota todos los días por un problema que quizá no
existe.

**¿EL CORREO DE UNA MODIFICACIÓN A CUÁNTOS ADMINS?** Hoy va a UNO: el campo
Admin Email de CONFIG (columna H, fila 2). En la instalación de Jose está
VACÍO, así que cae al dueño de la copia — él. Nadie más se entera.

Su razonamiento para ampliarlo, que es bueno: *"aunque una persona sea admin, no
tiene acceso a los documentos del Drive si no lo tiene en su Drive… entonces que
le llegue un correo sería darle un poquito más de información pero no la
suficiente para ser un admin completo."* Confirmado en el código: los archivos
los crea la identidad del script (el dueño) y **no se comparten con nadie** —
sólo se ven A TRAVÉS de la app, que los abre como dueño y entrega los bytes.
Así que un ADMIN de la app no tiene esos documentos en su Drive.

**DECIDIDO por Jose el 2026-09-09:** *"podemos poner una lista para elegir con
un check mark de todos los que hay en la lista que son admins."* Mejor que las
tres opciones que le di. Queda como trabajo pendiente, no como pregunta.

Y confirmado en el código lo que él sospechaba: los archivos los crea la
identidad del script (el dueño de la copia) y **no se comparten con nadie** —
sólo se ven A TRAVÉS de la app, que los abre como dueño y entrega los bytes. Un
ADMIN de la app no los tiene en su Drive. Su razonamiento se sostiene entero:
el correo le da *"un poquito más de información pero no la suficiente para ser
un admin completo"*.

### ✅ HECHO (v11.69) — CINCO NÚMEROS EN UNA BARRA QUE CIERRA

Idea de Jose. **Lo primero fue comprobar que las partes suman, y no sumaban como
él las describió.** Las dos cosas que salieron son la diferencia entre una barra
verdadera y una que lo parece:

**1. RESERVED ESTÁ DENTRO DE IN WAREHOUSE.** El motor de stock hace
`availableQty = warehouseQty − reservedQty`. Dibujar
`[In Warehouse][Used][Reserved]` —que es lo que él pidió, literalmente— contaría
lo reservado DOS VECES y la barra saldría más larga que la realidad. El reparto
que no se pisa es **`[Available │ Reserved │ Used │ Wasted]`**, donde Available +
Reserved **es** In Warehouse.

**2. EL TOTAL NO PUEDE LLAMARSE "lo que el almacén recibió".** ADJUST sube o baja
`warehouseQty` **sin contrapartida** — a propósito, porque un recuento corregido
no es material recibido ni desperdiciado. Eso rompe la identidad:
`Warehouse + Used + Wasted` sólo es igual a lo recibido si nunca hubo un ajuste,
y en un almacén de verdad siempre lo hay.

Lo que SÍ cierra siempre es la suma de los cuatro trozos, porque cada unidad está
hoy en exactamente uno de esos sitios. Por eso el total se llama **"accounted
for"** y no "received": es una promesa que la app puede cumplir.

Jose eligió las dos: total = lo que hoy tenemos contado, y Waste dentro.

**EL NÚMERO SIGUE ESTANDO.** Una barra sin cifras es más bonita y menos útil: en
un almacén la pregunta es *"¿me alcanza para 40?"*, y eso no se contesta mirando
una proporción. Va delante, y es el DISPONIBLE — el único de los cinco sobre el
que se puede actuar ahora mismo.

**EL HOVER DICE EL PORQUÉ.** Los datos de las reservas —obra, cantidad, quién—
ya viajaban al navegador; sólo había que enseñarlos. Una reserva liberada no
sale: ya no retiene nada.

**EL "ESCONDIDO" SÓLO SE HEREDA SI ERAN LAS CINCO.** Quien escondió las cinco no
quería ver cantidades, y la barra tampoco. Pero quien escondió cuatro y dejó
"Available" SÍ quería ver una cantidad — heredar el escondido de las otras cuatro
le quitaría justo la que le importaba, y ésa es la peor de las dos
equivocaciones posibles.

`tools/test-stock-levels-bar.js` — 23 comprobaciones en un navegador de verdad,
midiendo los trozos EN PÍXELES contra sus proporciones. Comprobado que sirve:
poniendo `warehouseQty` donde va `availableQty` —el error que Jose describió sin
querer— el total sale **190 en vez de 160** y fallan 6.

### ✅ HECHO (v11.68) — LA COLUMNA CATEGORY SE APARTA CUANDO SOBRA

Idea de Jose, y correcta: con el filtro del Dashboard en una categoría concreta,
la columna Category repite el mismo texto en TODAS las filas. **Una columna donde
todas las filas dicen lo mismo no es información, es espacio desperdiciado.**

Mismo razonamiento que la v11.61 aplicó a Movements.

**ESCONDIDA NO ES LO MISMO QUE OCULTA**, y la diferencia es la que hace que esto
sea seguro:

- No se toca el orden guardado de nadie. Si esto marcara la columna como oculta,
  volver a "All Categories" NO la traería de vuelta — sería una pérdida
  silenciosa de la configuración de esa persona.
- Vuelve sola en cuanto se quita el filtro.
- En **modo edición se ve siempre**: no se puede reordenar lo que no está, y
  quien abra el editor con un filtro puesto tiene que ver su tabla entera, no la
  de ese instante.

La categoría se dice una vez en el título, con el nombre **tal como se escribió**
— el valor del filtro viene normalizado por `nt()` y enseñar eso sería enseñar la
forma interna de un dato en lugar del dato.

**Y DE PASO, UN DESPERDICIO QUE SE VIO AL PASAR:** el mapa de columnas ocultas se
construía leyendo `localStorage` **una vez por FILA** de la tabla. Ahora una vez
por tabla.

`tools/test-stock-cat-column.js` — 23 comprobaciones en un navegador de verdad.

**LA PRIMERA VERSIÓN DE ESA PRUEBA MEDÍA NADA**, y la guarda lo cazó: con la
ventana ancha la tabla CABE, así que quitar una columna no la encoge — las demás
se reparten el hueco y el ancho total no se mueve. Decía "no se estrecha" sobre
código correcto.

Lo que Jose pidió es *"que la pantalla no se haga muy larga horizontalmente"*, o
sea **menos scroll lateral**, y eso sólo se puede medir donde HAY scroll lateral.
Con la ventana estrecha y midiendo `scrollWidth` en vez del ancho visible: **de
1179 px a 1050 px.**

**Y el guardián del sitio me atrapó a mí:** escribí "eso no es información, es
margen" en el changelog, y `test-site-privacy.js` prohíbe la palabra *margen*
porque existe para que nunca se publique nada sobre márgenes de precio. Falso
positivo, pero el guardián vale más que mi frase — cambiada a "espacio
desperdiciado", que además se lee mejor.

---

**LA BARRA DE CANTIDADES SIGUE ABIERTA, con dos preguntas para Jose.** Lo
prometido era comprobar que las partes suman ANTES de dibujar nada, y no suman
como él las describió:

**1. `reservedQty` ESTÁ DENTRO de `warehouseQty`.** El código:
`availableQty = warehouseQty − reservedQty`. Así que una barra
`[In Warehouse][Used][Reserved]` contaría lo reservado DOS VECES. La forma que no
se pisa es `[Available │ Reserved │ Used]`, donde Available + Reserved **es** In
Warehouse.

**2. EL TOTAL NO PUEDE LLAMARSE "lo que el almacén recibió".** ADJUST sube o baja
`warehouseQty` **sin contrapartida** — a propósito, y está bien: un recuento
corregido no es material recibido ni desperdiciado. Pero eso rompe la identidad.
`Warehouse + Used + Wasted` sólo es igual a lo recibido si nunca hubo un ajuste.

Lo que SÍ cierra siempre, porque cada unidad está hoy en exactamente uno de esos
sitios: **Available + Reserved + Used + Wasted**.

Recomendación dada a Jose: total = "lo que hoy tenemos contado", y Waste dentro
de la barra (cuatro trozos, uno normalmente invisible). Es la única versión que
cierra sola, sin trozos grises ni notas al pie. "Lo recibido" puede ir como un
número al lado, que es donde un dato que no encaja en el reparto hace menos daño.

### ✅ HECHO (v11.67) — LA CESTA DEL DASHBOARD ENSEÑA LOS NÚMEROS DE HOY

**LA PREGUNTA DE JOSE:** *"pusiste el candado de que los checkboxes de Movements
no se mantenían activos al cambiar de página, pero no lo hiciste con los del
Dashboard, ¿por qué? ¿crees que hay alguna razón para no hacerlo?"*

**SÍ LA HAY, y no son la misma cosa.**

Las casillas de Movements arman **Edit y Delete**. Una marca que sobrevive es un
botón de borrar apuntando a filas en las que ya nadie está pensando.

Las del Dashboard son una **CESTA** que se llena para "Exit Selected". Vaciarla
al salir de la pantalla haría perder el trabajo de alguien que fue a mirar el
mapa antes de sacar el material. Y ya hubo un fallo por limpiarla de más: al
cambiar EXIT → TRANSFER se perdían los otros cuatro materiales, de un formulario
sin guardar — está escrito como advertencia en `exitSelectedStock`.

**PERO AL MIRARLO APARECIÓ ALGO PEOR QUE LA PREGUNTA.**

`_stockSelection` guardaba `{ matId: stockData[matId] }` — una **copia de la
fila** del momento en que se marcó la casilla. Y `stockData` se reemplaza ENTERO
en cada carga (`stockData = data.stock || {}`), así que la cesta se quedaba con
objetos huérfanos de una foto vieja.

    Se marcan cinco materiales.
    Otra persona guarda una salida.
    "Exit Selected" abre el formulario CON LAS CANTIDADES DE ANTES.

La cesta se veía igual de bien y ya no era verdad. Misma familia que el PO#
convertido en fecha de la v11.63: **parece exacto y no lo es**, que es peor que
estar visiblemente roto.

**EL ARREGLO:** la cesta guarda sólo NOMBRES. `_selectedStockRows()` los cruza
con `stockData` en cada uso, así que las filas son siempre las de ahora — y un
material que dejó de existir (fusionado, renombrado, agotado) se cae de la cesta
solo en vez de viajar con datos de un pasado. El contador de la barra cuenta lo
que de verdad queda.

`tools/test-stock-basket.js` — 16 comprobaciones. Comprobado que sirve:
guardando otra vez la fila entera, la cesta dice **100 cuando ya quedan 42**.

Y deja escrito, en una prueba y no en un comentario suelto, **por qué las dos
pantallas se comportan distinto a propósito**: `showTab` limpia una y no la
otra, y eso tiene que seguir siendo cierto.

### ✅ HECHO (v11.66) — DEVOLVER VARIOS, Y LAS COLUMNAS SIN NOMBRE

**EL BOTÓN QUE SE REARMABA SOLO.** Jose lo grabó: pulsó "Put back" en varios
movimientos borrados seguidos, y **al llegar el primer "Done" en verde todos los
demás botones volvieron a su estado inicial**, como si nadie los hubiera tocado.

La causa: cada restauración que funcionaba pedía la lista otra vez al servidor y
repintaba el cuadro ENTERO. Los botones que seguían esperando su turno en la
cola se rehacían desde cero. **El trabajo seguía en marcha; la pantalla decía
que no.**

Es el mismo fallo que ya tuvo borrar en la v11.58, y se arregla igual:
`_trashPending` guarda qué está en camino, y la pantalla se dibuja desde ahí. Un
repintado los sigue enseñando esperando en vez de olvidarlos.

**Y eso dejó ver el otro, que él no llegó a ver:** cada restauración pedía además
una recarga COMPLETA del almacén. Cinco movimientos devueltos eran cinco
barridos del archivo. Misma respuesta que en "Check my data" — `_reloadWhenIdle`,
una sola al final de la ráfaga. Y la fila desaparece AL INSTANTE y en local: el
servidor ya lo hizo, así que volver a preguntarle era justo lo que rompía todo.

---

**UNA COLUMNA SIN NOMBRE ES UNA COLUMNA QUE ALGUIEN VA A BORRAR.** Punto 6 de la
lista, y Jose casi lo demuestra en carne propia: estuvo a punto de borrar las
columnas U y V de su archivo —**Unit Cost y Total Cost**— porque sus cabeceras
estaban en blanco y no había forma de saber qué eran.

`ensureCoreSheets_` empezaba con `if (ss.getSheetByName(spec.name)) return;`: si
la hoja YA EXISTÍA se saltaba entera. Todo lo que se añadió después de instalar
—las dos de costo, el Movement ID— se escribía por su índice y su cabecera no la
ponía nadie nunca.

**Y el comentario de esa misma función ya prometía lo contrario:** *"this only
fills in what is missing, so it is safe on an installation that already has
data"*. El código no lo hacía. Esto lo pone de acuerdo con lo que dice.

`fillMissingHeaders_` rellena **sólo las vacías**. Una cabecera con texto no se
toca jamás, diga lo que diga: la hoja de Jose llama "Racks" a lo que la
especificación llama "Locations" y "email" a "User Email", y da igual — todo el
código va por POSICIÓN. Renombrarlas sería un cambio que él no pidió y podría
romper un filtro o una fórmula suyos.

Y no escribe cuando no falta nada: una escritura por arranque que no cambia nada
es cuota gastada en no hacer nada.

**Se aplica al volver a pasar por Setup**, que es donde vive `ensureCoreSheets_`.

`tools/test-restore-batch.js` (23 comprobaciones) y
`tools/test-headers-repair.js` (20). El primero, comprobado que sirve: volviendo
a recargar la lista tras cada restauración, fallan 4 — entre ellas las dos que
reproducen el vídeo.

La segunda prueba tiene una hoja falsa que **sabe cuántas columnas tiene**: una
infinitamente ancha no podría enseñar nunca el fallo de escribir más allá del
último borde, que es justo lo que revienta en una instalación vieja de 20
columnas.

### ✅ HECHO (v11.65) — LA AYUDA SALE DONDE SE ESTÁ MIRANDO

**LA CAUSA, MEDIDA EN UN NAVEGADOR DE VERDAD Y NO DEDUCIDA.** Jose fotografió
todos los iconos de información de Ajustes sacando su burbuja un par de
centímetros por debajo y dibujándola detrás de los recuadros. Abrí la app en
Chromium y le pregunté al icono quién manda sobre él:

    LABEL  →  transform: matrix(1, 0, 0, 1, 0, -7.5)

`#settingsTabContent > .field > label:first-child` lleva
`transform: translateY(-50%)` — es lo que sube el título encima de la línea del
recuadro. Y en CSS, un elemento con `transform` **pasa a ser el marco de
referencia de todo `position:fixed` que tenga dentro**, además de crear su
propia capa de apilado. La burbuja calculaba sus coordenadas contra la VENTANA
y las aplicaba contra ese label.

**Las dos cosas que Jose ve —desplazada y detrás— son una sola.**

**POR QUÉ NO SE ARREGLÓ QUITANDO ESE transform**, que era lo obvio y lo barato:
porque deja la trampa puesta. `transform`, `filter`, `will-change`, `contain` y
`perspective` hacen todos lo mismo, y el día que alguien anime cualquier otro
recuadro vuelve el fallo, en otro sitio y sin relación aparente. Jose eligió
"la de verdad" y tenía razón.

Ahora la burbuja es **un solo div colgado del `<body>`**: no tiene encima más
que el body, así que ningún overflow la recorta y ningún transform la mueve. Es
literalmente lo que pidió — *"debe aparecer sobre todo y donde se lo pueda leer
completo"*.

**DOS COSAS QUE SALIERON GRATIS AL HACERLO BIEN:**
- Se mide la burbuja DE VERDAD en vez de dar por hecho un ancho de 240. Un
  texto corto ocupa 120 y se le empujaba como si ocupara el doble.
- Aparece el tercer caso que el código viejo no tenía: si no cabe ni debajo ni
  encima (ventana baja), se pone donde más sitio hay en vez de salirse.

**Y UNA QUE ENSEÑÓ LA PROPIA PRUEBA.** Puse "al hacer scroll, esconderla" —
parecía correcto. La prueba lo tumbó: al llegar a un icono CON EL TECLADO, el
navegador desplaza la página para enseñarlo, y la ayuda se iba en el mismo
instante en que se acababa de pedir. Ahora **sigue a su icono**, y sólo se va
cuando el icono sale de la ventana.

**POR QUÉ NO LO VIO NINGUNA PRUEBA, que es la parte que más importa:**
`tools/test-tooltip-edge.js` **se fabrica sus propios iconos** en un div suelto
y los mide ahí. Nunca abrió el panel de Ajustes. Es el error de siempre — *una
prueba que se construye su propio entorno mide ESE ENTORNO, no el producto.*

`tools/test-tip-in-settings.js` existe para no repetirlo: carga el
Index_v3_fixed.html de verdad, abre el panel de verdad, y mide los cinco iconos
que Jose fotografió. Comprobado que sirve: devolviendo la burbuja dentro del
label, falla reproduciendo la foto — **136 px abajo, 306 px a la derecha, y
detrás**.

**Y OBLIGÓ A REESCRIBIR `test-account-tooltip-delay.js`**, que leía la propiedad
`transition-delay` del `::after`. Ya no hay `::after`. Ahora mide LA CONDUCTA:
al segundo de pasar el ratón no está, a los cuatro y medio sí. Es lo que la
persona ve, no un sustituto de ello.

---

**CHECK MY DATA RECUERDA LO QUE ENCONTRÓ.** Jose aplicó unos veinte arreglos,
cerró la ventana y al volver *"ya no hay ningún dato en la ventana en la parte
de data"*. `_dqFindings` **nunca se perdió** — sigue en memoria toda la sesión.
El render reconstruía el recuadro con sólo el botón y no volvía a dibujar lo
que ya tenía. Volver a escanear habría sido la respuesta fácil y la equivocada:
un barrido entero del archivo para enseñar algo que ya se sabe.

**UNA RECARGA AL FINAL, NO UNA POR ARREGLO.** Cada "Apply" pedía por su cuenta
una recarga COMPLETA del almacén: veinte arreglos, veinte barridos. Eso es
cuota del DUEÑO tirada, y es lo que le hizo pensar que el caché de la v11.58
había dejado de funcionar — cada recarga cambia el sello de los datos, y el
sello es justo lo que invalida el caché. **El caché estaba bien**; lo que
estaba mal es que veinte arreglos fueran veinte recargas.

### ✅ HECHO (v11.64) — "OCUPADO" DEJA DE PARECER UN FALLO DE LA PERSONA

**LO QUE VIO JOSE**, dos veces seguidas al pulsar "Check my data → Apply":

    Could not apply: Error: SYSTEM_BUSY|System busy — someone else is saving
    right now. Please try again in a moment. [ID: 3da14230]

Y lo que dijo: *"estos mensajes no le ayudan al usuario. A mí me dicen algo,
pero al usuario no."*

**LO QUE SE MIDIÓ ANTES DE TOCAR NADA.** Ocho funciones del servidor toman
`withStockLock_` y pueden contestar "ocupado". Sólo DOS estaban protegidas en
el navegador, y cada una a su manera: guardar tenía reintento sin cola, borrar
tenía cola con reintento, y las otras SEIS no tenían nada. `_dqApply` era una
de esas seis.

**SU PREMISA HABÍA QUE CORREGIRLA EN UN PUNTO:** la cola que existía no tenía
límite de tamaño — es un arreglo en memoria. Lo que estaba limitado a 4 era el
REINTENTO, y con esperas de 0.9s, 1.8s, 3.6s y 7.2s eso son unos TRECE
SEGUNDOS. Su instinto apuntaba a lo correcto aunque el número fuera de otra
cosa: trece segundos es poco.

**LO QUE SE HIZO:**

1. **`_humanErr`** — lo que se le enseña a una persona. Quita `SYSTEM_BUSY|`,
   `SHORT_STOCK|`, el `Error:` que añade Apps Script, y **el `[ID: 3da14230]`**,
   que es la referencia del registro del servidor. El ID no se pierde: va a la
   consola, que es donde el soporte lo busca. Quitarlo del todo habría sido
   cambiar un problema por otro.
2. **Ocho reintentos con tope de 8s** en vez de cuatro sin tope: ~45 segundos
   en vez de ~13. **El tope importa tanto como el número** — sin él, el octavo
   intento esperaría dos minutos él solo y la app parecería colgada justo
   cuando ya iba a funcionar.
3. **`_acWrite` — una sola cola para toda escritura.** Y es una cola, no sólo
   un reintento: el reintento resuelve el choque con OTRA persona; la cola quita
   el que uno se hace a sí mismo pulsando dos botones seguidos, que es el más
   frecuente y el más tonto.
4. **"Ocupado" y "no se puede" dicen cosas distintas.** Confundirlas deja a la
   persona sin saber si volver a intentarlo sirve de algo.

**LAS TRES FUSIONES NO VAN POR LA COLA, Y ES A PROPÓSITO.** Una fusión es una
decisión que la persona acaba de confirmar mirando la pantalla; encolarla la
dejaría ejecutándose minutos después sobre unos datos que ya no son los que
vio. Ahí lo que faltaba era decir la verdad, no reintentar a ciegas —
`_mergeFailed`, escrito una vez para las tres.

**EL LÍMITE, DICHO Y NO ESCONDIDO:** esta cola vive en el navegador y **muere
con la pestaña**. "Mantenerlos hasta que se puedan realizar" llega hasta ahí.
Una cola que sobreviva a cerrar la ventana tiene que vivir en el servidor con
un disparador, y eso gasta cuota de Apps Script — que es del DUEÑO de la copia,
no de cada usuario. **Es una decisión de negocio, no técnica, y sigue abierta.**

**Y EL CHECK QUE NO SE IBA**, que iba en la misma versión. Jose: *"el check
debe mantenerse solo si estoy en la misma página"*. `showTab` ya limpiaba los
modos de fila con este mismo argumento escrito al lado — pero en la v11.59 las
casillas SUSTITUYERON a los modos en Movements y ese limpiado se quedó hablando
sólo de los modos. La selección era lo único de la pantalla que sobrevivía a
irse de ella. También se limpia al guardar una edición.

Y vaciar el mapa no bastaba: `_clearMovSelection` ahora **desmarca las casillas
dibujadas** y repinta la barra. Si no, quedaba una selección que se VE pero no
EXISTE — Edit y Delete apagados encima de tres filas con el check puesto, que
es peor que cualquiera de las dos cosas por separado.

`tools/test-write-queue.js` — 54 comprobaciones, con un navegador falso que
**tiene el reloj en la mano**: los setTimeout se guardan en vez de dispararse,
así se puede medir cuánto habría esperado de verdad en vez de creérselo.

Comprobado que sirve: volviendo a 4 reintentos, enseñando el error crudo y
quitando el limpiado del check, fallan 10 comprobaciones — entre ellas la que
reproduce el mensaje exacto de la foto de Jose.

**Y OBLIGÓ A ARREGLAR `test-busy-retry.js`**, que llevaba el 4 escrito a mano y
exigía que cada espera fuera MAYOR que la anterior. Con el tope eso deja de ser
cierto y deja de ser deseable. Ahora lee los números del código y exige lo que
de verdad importa: que la base nunca BAJE, y que el total pase de 40 segundos.

### ✅ HECHO (v11.63) — UN PO ESCRITO "07-6329" SE QUEDA "07-6329"

**EL FALLO ERA MÍO Y LO ENCONTRÓ JOSE**, borrando tres movimientos y
devolviéndolos desde la papelera el 2026-09-09.

Google Sheets INTERPRETA lo que se le da. `setValues("07-6329")` no guarda esos
ocho caracteres: lee "mes 07, año 6329", guarda el número 1617842 y le cuelga un
formato de fecha. El PO ya no está en la celda.

    "07-6329"  →  copiado a MOVEMENT_TRASH  →  1617842  (una fecha, en silencio)
    1617842    →  devuelto al archivo       →  un PO que nunca existió

Palabras suyas: *"está dando un dato que no existe y borrando uno que sí"*. Las
dos mitades son ciertas y la segunda es la peor.

**ÉL HIZO EL DIAGNÓSTICO, NO YO.** Vio que `7/1/6329` y `1617842` eran el mismo
valor con dos formatos, y que `07-6593` de JJF 109 estaba bien en tres filas y
roto en una. Yo había propuesto antes conectar `safeStr_` en el lector, y era
**peor que no hacer nada**: esa función devuelve VACÍO ante una fecha, o sea que
la app habría tapado el problema borrando el dato — justo la mitad de su queja.
Lo retiré.

**EL ALCANCE REAL ERA MAYOR QUE LA PAPELERA.** El mismo `setValues` estaba en
seis sitios: guardar, editar, copiar a la papelera, restaurar y las dos mitades
de la rotación de las 3am. Más las tres hojas derivadas y las cuatro columnas
del catálogo. La papelera fue sólo la primera en dispararse porque las otras
hojas de Jose son viejas y llevan formato de texto puesto a mano. **UNA
INSTALACIÓN NUEVA no lo lleva** — ahí el archivo lo crea `insertSheet`, con
formato automático, y el PO se habría roto en el primer guardado.

**EL ARREGLO:** `textCell_` pone una comilla delante de CADA cadena, y
`textSafeRow_` la aplica a la fila entera. Los números, las fechas y los
booleanos pasan intactos.

- La comilla **no forma parte del valor**: `getValue()` devuelve `"07-6329"`.
- Por eso se pone a todas las cadenas y no sólo a las que "parecen fecha":
  decidir cuáles significa reimplementar el parser de Sheets y equivocarse la
  primera vez que los dos no coincidan.
- **Ninguna lista de "qué columnas son texto" aparece en el arreglo.** Una lista
  así envejece — igual que `colCount = 20` en `archiveOldMovements` envejeció
  cuando llegaron las dos columnas de costo. La fila ya trae sus propios tipos.

**LO QUE CAMBIA A LA VISTA:** un PO escrito sólo con dígitos se guarda ahora
como texto, así que queda a la izquierda de la celda en vez de a la derecha. Un
PO es una etiqueta, no una cantidad.

**LO QUE NO REPARA:** las filas ya rotas. Un valor ya convertido perdió el
original dentro de la celda, y la única fuente honesta es el resto de filas que
todavía lo tienen. Jose decidió corregirlas a mano: *"yo voy a modificar
manualmente los PO's, tu preocupate por que el error no vuelva a pasar."*

`tools/test-text-stays-text.js` — 33 comprobaciones. **La hoja falsa PARSEA como
Sheets**, que es la única parte que importa: una hoja de mentira que guardara
las cadenas tal cual no podría enseñar este fallo jamás. Comprueba la ida Y la
vuelta, y dos ciclos completos, porque uno solo no distingue "no se rompe" de
"se rompe una vez y ya está roto".

**Y OBLIGÓ A ARREGLAR CUATRO PRUEBAS VIEJAS**, que es la parte que más dice: sus
hojas falsas no sabían que Sheets se come la comilla al guardar. Una hoja falsa
que no se porta como la de verdad es exactamente lo que dejó pasar este fallo.

### ✅ HECHO (v11.62) — VARIAS LOCACIONES DE UNA VEZ, Y BORRAR UNA VACÍA

**CREAR VARIAS.** El cuadro parte por comas: `A1A, A1B, A1C` crea tres. Las que
ya existan se saltan y se nombran, en vez de cancelar el lote entero.

**POR QUÉ NO PARTE POR ESPACIOS**, aunque "A1A A1B A1C" es lo que una mano
escribe: el espacio es un carácter legal en un nombre de locación — "BACK ROOM"
es un sitio que un negocio puede tener — y un separador que vuelve IMPOSIBLE
escribir un nombre es peor que uno que a veces pide una coma. Escribir espacios
ahora crea una locación con ese nombre literal, que se ve en la lista al
instante y que, desde esta versión, se puede borrar.

**BORRAR UNA VACÍA.** Palabras de Jose: *"si la locación no tiene nada dentro se
la debe poder borrar, eso no cambia el historial pero ya no aparece en la
lista"*. Tres cosas la retienen, y ninguna es la historia:

- material guardado dentro,
- un candado puesto sobre ella,
- un candado que la nombra como destino permitido.

**La historia NO retiene, y es la decisión que hace que esto sirva de algo.**
Cada movimiento guarda su locación como TEXTO, así que un nombre borrado se
sigue leyendo bien en cada fila del pasado — la misma regla que ya sigue el
renombrar, y que la pantalla ya explicaba.

**LO QUE APARECIÓ AL ABRIR ESA PUERTA, Y ERA LO SERIO.** `saveLocationLayout`
recibe la lista ENTERA desde el navegador y la escribe tal cual. O sea que dejar
un nombre fuera del arreglo **siempre ha bastado para borrar una locación** —
incluida una con material adentro, que habría dejado ese stock existiendo,
contado y mostrado bajo un nombre que ya no está en ninguna lista. Nadie lo
había hecho porque la pantalla no ofrecía el botón; el agujero estaba abierto
igual. Ahora la regla vive en el servidor, y el botón sólo decide qué OFRECER.

**LA FOTO SE VA CON ELLA.** Si no, queda un archivo en Drive que nadie abrirá
jamás y una fila que nadie leerá. Se tira DESPUÉS de que el guardado funcione:
una foto borrada por un guardado que falló sería una pérdida por algo que no
llegó a pasar.

`tools/test-locations.js` — 60 comprobaciones, ejecutando las funciones de
verdad de los dos archivos. Incluye que el navegador y el servidor coincidan en
qué es "vacía": dos definiciones distintas serían un botón que aparece y luego
falla.

### ✅ HECHO (v11.61) — CUATRO COLUMNAS EN DOS

**Idea de Jose, y mejor que la mía.** Yo iba a pelearme con el alto del
encabezado al abrir el editor de columnas; eso arregla el síntoma. Lo suyo quita
dos columnas de verdad:

> *"decidimos que las columnas type, date, category y name no se van a cambiar
>  nunca, entonces si no se van a cambiar podemos unir type sobre date, y
>  category sobre name, reducimos 2 columnas y la pantalla no debe hacerse muy
>  larga horizontalmente."*

`type` + `date` → **Type / Date**. `category` + `name` → **Category / Name**. La
insignia arriba, el dato debajo; la segunda línea en gris y más pequeña porque
se lee DESPUÉS de haber encontrado la fila — salvo el nombre del material, que
va en negrita porque es lo que la gente busca, y puede partirse en varias líneas
(hay materiales llamados "SCENIC MOUNTAIN 4PLEX PHASE2").

De 18 columnas a 16, y las dos nuevas siguen sin poder esconderse.

**EL PRECIO, QUE ÉL YA NOMBRÓ:** esas cuatro dejan de poder reordenarse por
separado, porque ya no son cuatro. Es una decisión, no un efecto secundario.

**LA PARTE QUE PODÍA SALIR MAL EN SILENCIO, Y NO ES LA FUSIÓN:** el orden de
columnas que cada persona tiene guardado en su navegador sigue hablando de las
viejas. `_colOrder` descarta lo que no reconoce y añade lo que falta AL FINAL —
así que sin traducirlo, a Jose la tabla se le habría abierto empezando por Qty,
con el tipo y el nombre al otro extremo, **sin que él hubiera tocado nada**.
`COL_MERGES` traduce: la de arriba se queda con el sitio de la vieja, la de
abajo desaparece. Es lo que significa "type SOBRE date", también para decidir
cuál de las dos manda.

### ✅ HECHO (v11.60) — EL CANDADO DICE QUIÉN Y POR QUÉ, Y DOS MENSAJES QUE MENTÍAN

**1. AL DESBLOQUEAR, QUIÉN LO CERRÓ, CUÁNDO Y POR QUÉ.** Jose: *"ya tenemos la
información, sólo hay que mostrarla"*. Literal: el motivo, quién y cuándo viajan
en cada candado desde que existen, y **sólo se veían pasando el ratón por un
icono diminuto**.

Ése es el sitio equivocado. Un candado lo pone alguien PARA QUE NADIE TOQUE ese
material — casi siempre porque está apartado para una obra, o porque hay algo
mal con él. Quien va a quitarlo es justo quien necesita leer el motivo, y es
justo el momento en que todavía puede parar. Un tooltip se lo enseña a quien
pasa por al lado, no a quien va a decidir.

El aviso dice ahora quién, cuándo, su razón **entre comillas y tal cual la
escribió** —es lo que dijo una persona, no un estado que la app calculó— y a
dónde se permitía moverlo. Y si no dio ninguna, lo dice: un hueco en blanco
parece que la app perdió el dato. No hace falta pedirle nada al servidor.

**2. EL "NO" DEL PERMISO SIRVE PARA ALGO.** Decía *"esto requiere un permiso que
tu admin no ha activado"* — sin decir cuál, ni qué se intentaba hacer, ni a
quién pedírselo. Ahora dice las tres: **qué** (en palabras de la persona, no el
nombre interno del permiso), **a quién** (por su correo, de la configuración) y
**dónde** se enciende.

**3. "GOOD MORNING" A LAS OCHO DE LA TARDE.** Estaba escrito a mano en el HTML,
así que saludaba igual a cualquier hora. Ahora se pregunta al reloj **cada vez
que la ventana se abre**, no al cargar la página: quien deja la app abierta toda
la tarde tiene que ver cambiar el saludo con ella.

### ✅ HECHO (v11.59) — LAS CASILLAS Y LA BARRA DE ACCIONES

Paso 4 del plan de la ID, con las correcciones de diseño de Jose. **Las suyas
eran mejores que las mías y así se hizo.**

**LAS CASILLAS SE GUARDAN POR ID, NO POR NÚMERO DE FILA.** Es lo que hace que la
selección sobreviva a un cambio de página y a una recarga silenciosa: los
números de fila cambian, los nombres no. **Antes de la v11.53 esto no se podía
escribir** — es la primera cosa que la columna de ID paga de vuelta.

**LA FILA DE HERRAMIENTAS NO SE MUEVE NUNCA.** Jose: *"podemos modificar la app
para que nada se mueva al dar clic en el botón"*. Tres cosas la movían y las
tres están quitadas, no escondidas:

- **Edit y Delete están siempre**, apagados cuando no hay nada marcado. Un botón
  que aparece es un botón que mueve la página.
- **El texto largo vive en el ⓘ** — corrección de Jose, y mejor que mi panel
  flotante: la mía escondía el problema debajo de un panel, la suya lo quita.
- **La columna de acciones ya no va y viene con el modo.** Los modos de fila
  desaparecieron de Movements: eran justo lo que hacía crecer y encoger la tabla.

Y dos cosas que salieron al medir, no al leer, porque la prueba mide píxeles:

- **"⚙ Columns" se escondía mientras su propio panel estaba abierto**, y como es
  el primer botón de la fila, esconderlo corría a los de su derecha. Ahora se
  queda, se enciende de color, y sigue siendo el botón que cierra el panel.
- **Save y Reset se fueron al extremo derecho**, empujados por el hueco. Al
  aparecer empujan espacio vacío en vez de los botones de la izquierda.

**"Save" en vez de "Done"**, en las dos tablas.

**Las reglas de la selección, y por qué:**
- **La casilla general marca LO QUE SE VE**, no las 604 filas. Con estado
  intermedio, porque "algunas" es una respuesta distinta de "ninguna" y de
  "todas", y una casilla que sólo sabe decir dos de las tres miente en la que
  falta.
- **Cambiar el filtro suelta la selección.** Sin eso, alguien puede marcar tres
  filas, filtrar hasta que dejen de verse, y pulsar Delete sobre movimientos que
  ya no tiene delante. Pasar de página **no** la suelta: la página cambia lo que
  se ve, no lo que se buscó.
- **Edit sólo con una.** Con dos no hay un formulario que pueda decir la verdad
  sobre las dos a la vez, y el tooltip lo explica.
- **Borrar varias pasa por la cola de la v11.58**, de una en una. Pedirle al
  servidor veinte reconstrucciones del almacén de golpe es exactamente lo que
  daba "System busy".
- **Un movimiento archivado o sin ID no se puede marcar.** El servidor se
  negaría, así que dejar marcarlo sería prometer algo que no se va a cumplir.

**Y la regla del permiso, escrita UNA vez.** `_movCanAct()` decide quién ve las
casillas, la columna de acciones y la barra. El fallo de la v11.56 fue
precisamente que las dos mitades de la app no decían lo mismo; dos copias de una
regla son dos sitios donde puede dejar de coincidir, y hay una prueba que se
queja si alguien vuelve a escribirla a mano.

### ✅ HECHO (v11.58) — LA COLA DE BORRADO, Y DEJAR DE PREGUNTAR LO QUE YA SE SABE

**1. BORRAR VARIOS A LA VEZ YA NO DA "BUSY".** Jose tenía razón dos veces: la
cola con reintentos **ya existía** (`_busyRetry`, v11.47), enganchada a los tres
caminos de guardado y a **ninguno** de borrado. Hueco mío.

**Pero la cola del servidor era la SEGUNDA respuesta, no la primera.** La razón
de que saltara tan fácil es que cada borrado reconstruye los totales de TODO el
almacén con el candado en la mano; cuatro borrados a la vez son cuatro
reconstrucciones enteras peleándose por el mismo candado — y el navegador se las
pedía todas de golpe. Contra eso, reintentar más rápido no arregla nada.

Ahora hay dos cosas: **una cola en el navegador** (los borrados salen de uno en
uno, en el orden en que se pulsaron, lo que quita la causa) y **el reintento con
espera creciente detrás**, para cuando quien tiene el candado es otra persona —
eso el navegador no lo puede evitar. Ocupado no dice nada: la fila se ve
esperando y se reintenta sola. Sólo habla si se agotan los cinco intentos.

Y la recarga silenciosa **ya no corre entre un borrado y el siguiente**:
traerse el almacén entero cuatro veces en mitad de una ráfaga era justo lo que
la hacía lenta. Corre una vez, al final.

**2. LOS PANELES DEJAN DE RECARGARSE EN CADA APERTURA.** Jose: *"nada debe
recargarse a cada rato en la app, sólo cosas puntuales y específicas"*. Cada
apertura de Ajustes disparaba tres llamadas para pintar datos que no habían
cambiado.

**El sello ya existía y no se usaba.** Desde la v11.48 el servidor devuelve
`dataStamp`, que cambia cuando cambian los datos y no cambia cuando no — o sea,
la respuesta exacta a "¿hace falta volver a preguntar?". Ahora los IDs de
movimiento y la papelera se pintan al instante de lo guardado y sólo se
preguntan si el almacén se movió. **Manage Users** va aparte, con su propia
regla: la lista de usuarios cambia cuando alguien cambia un usuario, no porque
se haya guardado una entrada — atarla al sello la haría recargarse después de
cada movimiento, que es lo contrario de lo que se pidió.

**3. VACIAR LA PAPELERA**, con el botón dentro del cuadro que vacía. Es **la
única acción definitiva de la app**, y por eso es la única que sigue siendo de
admin aunque borrar ya no lo sea: vaciar no es borrar un movimiento, es
renunciar a poder deshacer todos los que se borraron.

**4. EL FILO DE ABAJO DE LA VENTANA DE AJUSTES.** La cabecera cerraba la ventana
por arriba con su propio fondo; abajo el contenido llegaba al borde y la ventana
parecía cortada en vez de terminada.

### ✅ HECHO (v11.57) — EL FORMULARIO YA NO PIERDE LA MITAD DE LOS DATOS

El vídeo de las pestañas, arreglado. Tres cosas, y la primera es la que importa:

**1. EL ESTANTE Y LA CANTIDAD VIAJAN JUNTOS O NO VIAJA NINGUNO.** Antes se metía
la cantidad en la primera fila y se dejaba el estante vacío, lo que producía una
fila que decía `? unknown rack` con 142 dentro — **una fila que parece rellena y
no lo está.** Media información arrastrada es peor que ninguna: ninguna se ve
vacía, media se ve mal en silencio.

Cuando el material está en **un** estante, ése no es una suposición y van los
dos. Cuando está repartido, la app no sabe a cuál fue la persona, así que no
lleva ninguno — y los chips de arriba ofrecen la elección. **Poner el estante
más lleno sería decidir por ella a qué balda caminó.**

WASTE sigue la misma regla (su origen también es un estante). RETURN **no**: su
origen es una obra, que la app no puede saber, y su cantidad va en un campo
suelto, así que no produce ninguna fila huérfana.

**2. UNA FILA SIN ESTANTE NO SUMA AL TOTAL.** El marcador decía **284** de un
material del que hay 142 en todo el almacén. Un número que nadie escribió a
propósito sigue siendo un número sobre el que alguien decide.

**3. LA LISTA DE ESTANTES DE ORIGEN ES LA DE ESE MATERIAL.** Era `rackList` —
todo el edificio, proyectos y direcciones incluidos. Ahora es una lista propia
por material, con la cantidad al lado (`C3B — 142 in stock`), y vuelve a la
completa cuando la app no reconoce el material, porque un desplegable vacío se
lee como una casilla rota.

**Lo que lo hacía absurdo, y quedó escrito en la prueba:** el dato correcto ya
estaba en la pantalla. Los chips lo enseñaban tres líneas más arriba —
`CLICK A RACK TO ADD IT AS A TRANSFER ROW: C3B 142` — y la pestaña ADJUST abría
con C3B ya puesto. No era falta de información: era una pestaña que no usaba la
que la de al lado ya tenía.

### ✅ HECHO (v11.56) — EL PERMISO DE BORRAR NUNCA FUNCIONÓ, Y LOS BOTONES QUE DESAPARECÍAN

**1. EL SUPERVISOR NO PODÍA BORRAR, Y EL INTERRUPTOR DECÍA QUE SÍ.** Jose, con
el rol SUPERVISOR y "Edit movements" encendido: pulsa la papelera y sale
**"Admin only."**. Su pregunta —"¿se dañó o nunca se pudo?"— tiene respuesta:
**nunca se pudo.**

El texto del propio interruptor promete las dos mitades desde el día que se
hizo: *"Warehouse staff can fix **or delete** a movement someone already saved"*.
`modifyMovement` (arreglar) sí se conectó al permiso; `deleteRow` (borrar) se
quedó dentro de `manageMaterial`, que pedía ADMIN para **todo**.

**Y no se notó porque el NAVEGADOR sí honraba el permiso** — `renderMovements`
enseña Edit y Delete a un WAREHOUSE con el interruptor puesto. Así que el
interruptor se veía encendido, los botones aparecían, y sólo al pulsarlos el
servidor decía que no. Las dos mitades de la app discrepaban y la que mentía
era la que no se ve.

Arreglado partiendo la puerta por operación (`MOVEMENT_OPS`): borrar, restaurar
y ver la papelera tocan **un** movimiento y van por el permiso; `rename`,
`changeCategory` y `merge` reescriben la historia entera de un material —miles
de filas de un clic y sin deshacer— y siguen siendo de admin.

`tools/test-role-permissions.js` vigila la forma del fallo, que no es "¿está
cerrada la puerta?" (de eso ya se ocupa `test-endpoint-auth.js`) sino **"¿la
puerta hace lo que promete su cartel?"**. Un permiso que se enciende y no hace
nada es peor que no tenerlo: el admin cree que ya lo concedió.

**2. LOS BOTONES QUE DESAPARECÍAN.** Arreglado de raíz, no en el sitio del
vídeo: se añade `_btnLabel(btn, etiqueta)` = `_btnReset` + etiqueta nueva, y se
convirtieron **25 sitios** que se restauraban a mano. Sólo se notaba en éste
porque el botón tiene dos vecinos; en los demás era el mismo fallo esperando a
que alguien pusiera un segundo botón al lado.

`test-button-states.js` gana una comprobación que **lee el archivo entero** y
falla si vuelve a aparecer un `btn.disabled = false` suelto después de un
`_btnBusy`. Los comentarios se quitan antes: el comentario que EXPLICA la línea
prohibida la contiene, y un guardia que salta con su propia explicación acaba
borrado (ya me pasó en la v11.55).

**3.** De paso: el aviso decía *"delete that record permanently"*, y desde la
v11.55 va a la papelera. Un aviso que exagera lo que hace un botón cuesta lo
mismo que uno que lo minimiza — se deja de creer a los dos.

### ✅ HECHO (v11.56) — EL PERMISO DE BORRAR NUNCA FUNCIONÓ, Y LOS BOTONES QUE DESAPARECÍAN

**1. EL SUPERVISOR NO PODÍA BORRAR, Y EL INTERRUPTOR DECÍA QUE SÍ.** Jose, con
el rol SUPERVISOR y "Edit movements" encendido: pulsa la papelera y sale
**"Admin only."**. Su pregunta —"¿se dañó o nunca se pudo?"— tiene respuesta:
**nunca se pudo.**

El texto del propio interruptor promete las dos mitades desde el día que se
hizo: *"Warehouse staff can fix **or delete** a movement someone already saved"*.
`modifyMovement` (arreglar) sí se conectó al permiso; `deleteRow` (borrar) se
quedó dentro de `manageMaterial`, que pedía ADMIN para **todo**.

**Y no se notó porque el NAVEGADOR sí honraba el permiso** — `renderMovements`
enseña Edit y Delete a un WAREHOUSE con el interruptor puesto. Así que el
interruptor se veía encendido, los botones aparecían, y sólo al pulsarlos el
servidor decía que no. Las dos mitades de la app discrepaban y la que mentía
era la que no se ve.

Arreglado partiendo la puerta por operación (`MOVEMENT_OPS`): borrar, restaurar
y ver la papelera tocan **un** movimiento y van por el permiso; `rename`,
`changeCategory` y `merge` reescriben la historia entera de un material —miles
de filas de un clic y sin deshacer— y siguen siendo de admin.

`tools/test-role-permissions.js` vigila la forma del fallo, que no es "¿está
cerrada la puerta?" (de eso ya se ocupa `test-endpoint-auth.js`) sino **"¿la
puerta hace lo que promete su cartel?"**. Un permiso que se enciende y no hace
nada es peor que no tenerlo: el admin cree que ya lo concedió.

**2. LOS BOTONES QUE DESAPARECÍAN.** Arreglado de raíz, no en el sitio del
vídeo: se añade `_btnLabel(btn, etiqueta)` = `_btnReset` + etiqueta nueva, y se
convirtieron **25 sitios** que se restauraban a mano. Sólo se notaba en éste
porque el botón tiene dos vecinos; en los demás era el mismo fallo esperando a
que alguien pusiera un segundo botón al lado.

`test-button-states.js` gana una comprobación que **lee el archivo entero** y
falla si vuelve a aparecer un `btn.disabled = false` suelto después de un
`_btnBusy`. Los comentarios se quitan antes: el comentario que EXPLICA la línea
prohibida la contiene, y un guardia que salta con su propia explicación acaba
borrado (ya me pasó en la v11.55).

**3.** De paso: el aviso decía *"delete that record permanently"*, y desde la
v11.55 va a la papelera. Un aviso que exagera lo que hace un botón cuesta lo
mismo que uno que lo minimiza — se deja de creer a los dos.

### ⛔ EL FORMULARIO PIERDE LA MITAD DE LOS DATOS AL CAMBIAR DE PESTAÑA — vídeo por fin visto

**Jose lo mandó el 2026-09-08 y lo he mirado entero.** Es peor y más concreto de
lo que yo había supuesto. Material SCREEN / "44 NORTH", 142 unidades, todas en
el estante C3B.

**1. LA CANTIDAD VIAJA ENTRE PESTAÑAS Y EL ESTANTE NO.** En EXIT queda relleno
C3B / 142. Al pasar a TRANSFER, la fila conserva **142** y pierde **C3B**, así
que queda una fila que dice `? unknown rack` con una cantidad real dentro.
Media información arrastrada es **peor que ninguna**: produce una fila que
parece rellena y no lo está. Igual en RETURN, donde además la cantidad no
significa nada (no se devuelven 142 unidades de algo que está en el almacén).

**2. EL TOTAL CUENTA LA FILA INVÁLIDA.** Con la fila mala (142, sin estante) más
la buena que él añade luego pulsando el chip C3B (142), el marcador de arriba
dice **284** — de un material del que hay 142 en total. Es un número sobre el
que alguien va a tomar una decisión.

**3. LA LISTA DE ESTANTES DE ORIGEN OFRECE TODO EL SISTEMA.** Al abrir "Source
rack" salen `2PER SAGE@COMPASS`, `565 REDWOOD`, `A`, `A1A`, `A1B`… — todos los
sitios que existen, proyectos y direcciones incluidos, cuando este material sólo
está en **C3B**.

**Y LA APP YA SABE CUÁL ES.** Justo encima, en el mismo formulario, dice
`CLICK A RACK TO ADD IT AS A TRANSFER ROW: C3B 142`. Y la pestaña **ADJUST**,
en el mismo vídeo, abre con `RACK YOU COUNTED: C3B` y `THE APP SAYS 142`. O sea
que el dato correcto está ahí y se usa en una pestaña y no en la otra. No hace
falta nada del servidor.

**El arreglo, en orden:**
1. Al cambiar de tipo, **limpiar las filas de ubicación enteras** en vez de
   dejar la cantidad huérfana. O arrastrar las dos cosas, o ninguna.
2. La lista de estantes de origen, **filtrada a donde el material está de
   verdad** — el mismo cálculo que ya alimenta los chips y el ADJUST.
3. Una fila `? unknown rack` **no puede sumar al total**, y debería poder
   quitarse de un vistazo.

### ✅ HECHO (v11.55) — PASO 2 Y 3: LA PAPELERA, Y LA FILA SE VA AL INSTANTE

**Cierra el fallo urgente de arriba.** Borrar ya no señala una POSICIÓN:

    var movId = String(data.movId || '').trim();
    var found = findMovementById_(ss, movId);

Con eso, borrar el movimiento equivocado deja de ser improbable y pasa a ser
**imposible**. Un nombre señala un movimiento y ningún otro, esté donde esté
sentado. Y una fila sin ID **se niega** a borrarse por posición: volver al
número de fila "sólo por esta vez" es exactamente cómo vuelve el fallo.

**LA PAPELERA ES UNA HOJA, NO UNA MARCA EN LA FILA.** Con una marca, cada lector
de este archivo —el motor de stock, las hojas derivadas, el barrido de calidad,
el trabajo nocturno— tendría que aprender a saltarse esas filas, y el primero
que se olvidara enseñaría un almacén que todavía contiene material que alguien
tiró. Sacando la fila, todos siguen funcionando sin cambiar nada, porque la fila
de verdad ya no está. Es la misma forma que ARCHIVE_HISTORY, que ya mueve filas
entre hojas sin romper el stock.

**El orden importa en las dos direcciones, y está protegido por prueba:**
- Al borrar: **a la papelera ANTES de quitarla**. Al revés, un fallo entre las
  dos destruye el movimiento sin dejar de dónde sacarlo.
- Al restaurar: **puesta en su sitio ANTES de salir de la papelera**. El otro
  orden lo pierde del todo si falla en medio.

**Se guarda la FILA ENTERA, tal cual.** Una reconstrucción a partir de sus
campos devolvería algo parecido, no lo mismo. Y vuelve a **la hoja de donde
salió**, así que un movimiento de hace un año no reaparece en la lista reciente.

**EL DOBLE BORRADO YA NO MIENTE.** Era la misma mentira del desbloqueo doble: a
los dos se les decía que lo habían hecho ellos. Ahora el segundo recibe *"Already
deleted by jose@ox-glass.com on Sep 8, 10:45 AM. It is in the trash — you can
put it back from there."* Y "ya lo borró otro" se distingue de "esto no existe":
son dos situaciones distintas, y confundirlas manda a la persona a buscar al
sitio equivocado. El doble restaurar también, y ahí el daño era peor —
dos filas iguales suman dos veces al stock.

**Y LA FILA SE VA DE LA PANTALLA AL INSTANTE**, que es el punto 3 y el primer
sitio donde se aplica la regla general de Jose. Se quita en el manejador de
ÉXITO —el servidor YA lo hizo— y no en el de fallo: primero el servidor, luego
la pantalla. Al revés, un "ya lo borró otro" dejaría la fila desaparecida en una
cuenta y presente en la otra. La recarga silenciosa sigue, pero ya sólo para
reconciliar los totales de stock, que los calcula el servidor.

**Y el aviso ya no dice "no se puede deshacer"**, porque ahora sí se puede.
Decir lo contrario hacía que la gente parase a preguntar antes de tocar un botón
que ya es reversible.

**LO QUE FALTA DE ESTE BLOQUE:** vaciar la papelera (hoy crece sin límite), y
las casillas de selección con la barra de acciones (punto 4, con las
correcciones de diseño de Jose ya anotadas más abajo).

### ✅ HECHO (v11.54) — QUE NUNCA HAYA DOS NOMBRES IGUALES, Y GENERIC FUERA

**Jose, 2026-09-08, sobre los ID repetidos — y su corrección es la buena:**

> "la cosa no es solo contar repetidos, es cambiar los repetidos para que nunca
>  haya ninguno repetido, debe hacerse automatico, el cliente o usuario no debe
>  ni saber que la app hace eso, es solo algo que hace y ya, no se confirma ni
>  se da la noticia de lo que hizo."

Yo había propuesto CONTARLOS y enseñarlo en Ajustes. Contar un fallo y
enseñárselo al usuario es pasarle a él un trabajo que la app puede hacer sola.

**DE DÓNDE SALEN DE VERDAD.** El generador no puede chocar en la práctica: los
guardados van en fila por el candado, cada uno tarda cientos de milisegundos, el
reloj avanza entre uno y otro, las filas de un lote van numeradas, y debajo de
todo eso hay tres caracteres al azar. **Los repetidos vienen de FUERA**: alguien
copia una fila a mano en la hoja, o pega filas de un respaldo. Jose trabaja en
la hoja directamente, así que no es hipotético — y una fila copiada es invisible
para cualquier cuidado que se ponga en el generador.

**LA REGLA: GANA LA PRIMERA.** Es la que lleva más tiempo con ese nombre, así
que lo que ya apuntaba a ella sigue valiendo; la copia es la que se mueve.
Renombrar la primera rompería en silencio justo lo que el ID existe para
proteger.

**TRES SITIOS, LOS TRES GRATIS:**

1. **En cada guardado.** El archivo entero ya está en memoria y ya estamos
   dentro del candado: no cuesta ni una lectura ni un viaje más. Hace dos cosas
   — que una fila nueva no reciba un nombre que ya existe, y reparar un choque.
   La reparación va DESPUÉS de la escritura verificada del movimiento y
   envuelta, porque arreglar la casa de otro no puede costarle a nadie el
   movimiento que acaba de guardar.
2. **En el trabajo de las 3 de la mañana.** Es el único sitio donde las DOS
   hojas están en memoria a la vez, o sea el único que puede ver un repetido que
   cruza de una a la otra. Se escribe antes del "no hay nada que archivar",
   porque si esperara al reescribido, no correría ninguna de las noches en que
   nada cruza la fecha de corte — que son casi todas.
3. **En el relleno**, con una sola lista de nombres para las dos hojas.

**Y NO SE ANUNCIA.** Queda en la auditoría —una reparación sin registrar no se
distingue de un fallo— pero bajo el actor `auto`, que **no** está en
`SYSTEM_ACTORS`, así que no puede salir en "lo que el sistema hizo por su
cuenta". Registrado, no reportado.

---

**GENERIC FUERA.** Jose: *"ningún proyecto se llama GENERIC, así que es un
error, no debe llenar el proyecto si no se le escribe nada"*. Tiene razón, y lo
revisé entero antes de tocarlo: **todos** los lectores, servidor y navegador,
escriben la prueba `proj && proj !== 'GENERIC'`, o sea que un vacío siempre
significó lo mismo. Era un marcador que no necesitaba nadie, puesto en la hoja
con pinta de nombre de cliente.

- Una ENTRY sin proyecto ya no escribe nada.
- **Leerlo se sigue tolerando**, a propósito: las 1047 filas que ya existen lo
  dicen, y quitar la tolerancia las convertiría a todas en un cliente llamado
  GENERIC. Eso está protegido por prueba.
- El formulario de edición ya enseñaba GENERIC como casilla vacía, y eso creaba
  una trampa: guardar cualquier otro cambio habría borrado el proyecto y lo
  habría anotado como una edición que nadie hizo. Antes se resolvía volviendo a
  escribir GENERIC; ahora vacío y GENERIC se tratan como **la misma respuesta**:
  ni se escribe, ni se anota, ni se devuelve el marcador.
- **Jose limpia él las filas viejas.**

**Las cabeceras que faltaban (U1 "Unit Cost", V1 "Total Cost") las puso él.**
Casi borra las dos columnas porque no tenían título — el código nunca toca las
cabeceras de una hoja que ya existe, así que "Movement ID" sí apareció y esas
dos no. Anotado abajo como lo que hay que arreglar para el próximo cliente.

### ⛔ PENDIENTE — las cabeceras viejas que faltan en una instalación existente

`ensureCoreSheets_` sólo crea hojas que no existen; **nunca completa la cabecera
de una que ya existe**. Resultado: cualquier columna añadida después de la
instalación queda sin título para siempre. A Jose le pasó con Unit Cost y Total
Cost, y estuvo a punto de borrar las dos columnas por eso.

La migración de los ID escribe su propio título; hay que hacerlo **general** —
que rellene cualquier título que falte, comparando contra la cabecera del SPEC.
No urgente para Jose (ya lo arregló a mano), sí para el siguiente cliente.

### ✅ HECHO (v11.53) — PASO 1: CADA MOVIMIENTO YA TIENE NOMBRE PROPIO

`AC.MOV_ID` (columna 23), `AC_WIDTH` 22 → 23, añadida AL FINAL. Todo movimiento
guardado desde la v11.53 nace con su id. Los que ya estaban se rellenan con un
botón en Ajustes → System ("Movement IDs"), que:

- sólo rellena huecos, así que **correrlo dos veces no hace nada la segunda**;
- **escribe UNA sola columna** — ninguna cantidad, estante, fecha ni precio
  puede resultar dañado, porque nunca se reescribe la fila;
- no le pone nombre a una fila vacía;
- toma el mismo candado que un guardado, porque escribe en el archivo;
- queda en la auditoría.

**Nada se ha cambiado todavía a USAR el id** — borrar y editar siguen mandando
el número de fila. Ése es el paso 2, y no puede hacerse hasta que las filas
viejas tengan id (o sea, hasta que Jose pulse el botón).

**Y salió un fallo de camino, que llevaba ahí desde antes:** el trabajo de las
3 de la mañana (`archiveOldMovements`) escribía **20 columnas** puestas a mano.
20 dejó de ser verdad el día que se añadieron Unit Cost y Total Cost. O sea que
cada noche que ese trabajo movía una fila, o fallaba en seco, o dejaba caer los
dos precios. Ahora usa `AC_WIDTH` y rellena las filas cortas antes de escribir.

---

### JOSE (2026-09-08) — CORRECCIONES Y ACLARACIONES

**1. LA REGLA DE LA RESPUESTA INMEDIATA, COMO ÉL LA DIJO — NO COMO YO LA
ESCRIBÍ.** Yo lo anoté como "quitar la fila al instante, y revisar los sitios
donde se quitan filas". No es eso:

> "hay muchos otros lugares en la app donde se borra, se cambia o se añade algo
>  y la app debe actuar y mostrar/cambiar/borrar ese algo inmediatamente, si el
>  servidor y el backend ya hicieron su trabajo, no hay porque hacer esperar al
>  usuario... el feedback visual no debe demorar nunca."

O sea: **barrer TODOS los sitios que confirman algo y luego se quedan esperando
una recarga entera para reflejarlo.** El aviso de éxito sale en el manejador de
éxito — el trabajo YA está hecho — y aun así la pantalla espera. No es una
mejora del borrado: es una regla de la app.

**2. "La calculadora de cuota" — malentendido, corregido.** Jose preguntó si
era el cálculo de unidades por caja/pallet. No lo es: es el **medidor de la
cuota de ejecución de Apps Script** (el tiempo de servidor que consume la app
al día). Importa porque **la cuota es del DUEÑO, no de cada usuario** — la app
corre "como yo", así que las llamadas de todos salen del mismo presupuesto:
~90 min/día en cuenta normal, ~6 h/día en Workspace, medible en la pestaña
Executions. Va al final, como pidió. Lo de cajas/pallets es otra cosa y sigue
en su sitio en esta lista.

**3. El candado — lo que quería decir:** al DESBLOQUEAR hay que enseñar **quién
lo hizo y la razón que dio esa persona**. El dueño ya se guarda (`auth.email`);
la razón es lo que no se enseña.

**4. El título del panel = nombre del material: SÍ, y es para teléfonos.**

**5. Manage Users — el alcance crece.** Además de que no se recargue entera:
- rediseñar **cómo se editan** los usuarios;
- la ventana se ve **pequeña**;
- el correo se parte en **varias líneas** en vez de una;
- hay una **barra de scroll lateral** que se puede evitar;
- los nombres pueden ir en más de una línea, para aprovechar el ancho.

**6. Las tres que no recordaba, explicadas (y siguen pendientes):**
- **"El borrado por Supervisor"**: quien no es admin y trata de borrar un
  movimiento recibe un error pelado, en vez de "esto necesita permiso de
  administrador" y a quién pedírselo. Es el mensaje, no el permiso.
- **"El video de las pestañas"**: la grabación que Jose quedó en mandar del
  formulario de movimiento perdiendo datos al cambiar entre EXIT y TRANSFER —
  locations mal, estante de origen borrado, TRANSFER sugiriendo estantes de
  otros proyectos, y una línea `? UNKNOWN RACK` sin cantidad que aparece antes
  de la correcta y se queda. Lo leo como DOS fallos: el formulario no se limpia
  al cambiar de tipo, y la lista de sugerencias no filtra por dónde está el
  material. **Sigue sin llegar el video, y no lo toco hasta verlo.**
- **"La ficha de usuario"**: petición suya. En cada movimiento, el **nombre
  encima del correo** (nombre en negrita y más grande, correo debajo en gris), y
  al pasar el ratón una ventanita con **enviar correo / videollamada de Meet /
  chat**. Correo y Meet son enlaces baratos; el chat es decisión aparte.

**7. Al final, confirmado por él:** el logo al arrancar, las imágenes del sitio,
la política de cobro y el rediseño de movimientos.

---

### LA RAÍZ DE TODO ESTO: UN MOVIMIENTO NO TIENE NOMBRE PROPIO

Verificado el 2026-09-07. `var AC = { TIMESTAMP:0, CATEGORY:1, ... UNIT_COST:20,
TOTAL_COST:21 }` — **no hay columna de ID.** Un movimiento se identifica
únicamente por SU POSICIÓN en la hoja.

De ahí salen, todas por el mismo sitio:

- **Borrar puede borrar el equivocado** (ver arriba). Confirmado por Jose en
  vivo: dos personas borran el mismo movimiento y a las dos les dice que se
  borró. No es teórico.
- **Editar tiene el mismo problema.** `openEditMovModal(rowIdx)` y
  `modifyMovement` usan el mismo número de fila.
- **No se puede quitar la fila de la pantalla al instante**, porque los números
  de las demás quedan mal.
- **La papelera y el deshacer** necesitan poder señalar un movimiento concreto
  dentro de un mes, y una posición no vale para eso.

**LA DECISIÓN: añadir una columna de ID antes que nada.** `AC_WIDTH` pasa de 22
a 23, **añadida al final**, que es la única forma segura sobre datos que ya
existen — el propio archivo lo dice al lado de UNIT_COST/TOTAL_COST:

    // Appended at the end, not inserted among the columns above, on purpose:
    // every other index in AC is a POSITION some existing sheet already has
    // data in, and inserting would shift every column after it.

**Con eso, todo lo demás se vuelve fácil y seguro:**
- Borrar, editar, restaurar y deshacer señalan un ID, no una posición.
- La posición puede cambiar todo lo que quiera (borrados de otros, el archivado
  de las 3 de la mañana) sin romper nada.
- Quitar la fila al instante deja de ser peligroso.

**Lo que hay que cuidar:** las filas que YA existen no tienen ID, así que hace
falta rellenarlas una vez. Es una escritura sobre los datos reales de Jose —
**hacer copia de seguridad antes** (el respaldo nocturno ya existe) y que la
migración sea repetible sin estropear nada si se corre dos veces.

**Orden decidido, y por qué NO es ninguna de las dos opciones que le ofrecí:**

    1. La columna de ID + el relleno de las filas viejas.
    2. La papelera (borrado suave) sobre esa ID → deshacer, y nada se mueve.
    3. Quitar la fila al instante, que ya es seguro.
    4. Las casillas de selección y la barra de acciones.

La "comprobación por identidad" que propuse ayer era un parche para no tener
ID. Con la ID no hace falta: no hay que verificar una posición si no se usan
posiciones.

---

**JOSE (2026-09-07), correcciones a lo que propuse — TODAS MEJORES QUE LO MÍO:**

- **La barra de acciones no debe crecer al aparecer.** Su idea, y es la buena:
  Edit y Delete van **en la línea que YA EXISTE**, la de Columns, apagados
  cuando no hay selección. No se reserva una fila nueva: se usa una que ya
  ocupa su alto. Nada crece porque no hay nada nuevo.
- **El panel de Columns NO debe ser flotante.** Jose: "podemos modificar la app
  para que nada se mueva al dar clic en el botón... hacer que al dar clic en un
  botón la app cambie sólo lo necesario". Concretamente: que el encabezado mida
  **lo mismo antes y después**, el texto explicativo se va al icono ⓘ (que ya
  existe y sale al pasar el ratón), y los dos botones quedan iguales — con
  **"Save" en vez de "Done"**. Es mejor que mi propuesta: la mía escondía el
  problema debajo de un panel flotante; la suya lo quita.
- Casilla general = lo filtrado y visible, con estado intermedio. **Aprobado.**
- Edit sólo con una fila. **Aprobado.**
- Sin desactivación mutua de botones. **Aprobado.**

**Y una petición nueva:** el mensaje "Nothing left. Someone else took the last
of…" debe ser una **ventana con un botón**, no un aviso que se va solo. Motivo
suyo, y es correcto: mientras tanto, la ventana de salida se actualiza con el
número nuevo lo más rápido posible. Un aviso que se desvanece se pierde
justamente cuando la persona está mirando el formulario y no la esquina.

**Nota:** el aviso EN LA VENTANA (v11.51, `#exitLiveWarn`) se queda — ése es el
que avisa mientras trabajas. La ventana con botón es sólo para el caso de
"ya no queda nada", que es el que obliga a parar.

### ⛔ URGENTE — BORRAR UN MOVIMIENTO PUEDE BORRAR EL EQUIVOCADO

Encontrado el 2026-09-07 verificando una pregunta de Jose sobre por qué el
borrado tarda en verse. **No es lo que él preguntó; salió de mirarlo.**

`manageMaterial / deleteRow` borra **por número de fila de la hoja** y no
comprueba nada:

    var rowIdx = parseInt(data.rowIdx || 0);
    if (rowIdx < 2) throw new Error('Invalid row index.');
    var rowData = archive.getRange(rowIdx, 1, 1, AC_WIDTH).getValues()[0];
    auditLog_(ss, 'DELETE_ROW', ..., 'row ' + rowIdx + ' — ' + JSON.stringify(...));
    archive.deleteRow(rowIdx);

**Al borrar una fila, TODAS las de abajo suben un número.** O sea que cualquier
`rowIdx` que el navegador tuviera de antes queda desplazado. Dos escenarios
reales, los dos posibles hoy:

1. **Dos personas borrando a la vez.** A borra la fila 1051. La lista de B se
   dibujó antes, así que su "1052" ahora es lo que era 1053. **B borra un
   movimiento que no eligió.**
2. **Una sola persona borrando varios seguidos**, si los índices no se
   recalculan entre uno y otro.

**POR QUÉ NO HA EXPLOTADO TODAVÍA, y por qué eso no tranquiliza:** la tabla se
enseña del más nuevo al más viejo, y los más nuevos están al final de la hoja
(número de fila más alto). Así que borrar de arriba abajo en la pantalla da un
orden DESCENDENTE de índices — que es justo el orden seguro. Se ve en el registro
de Jose del 2026-09-06: 1054, 1053, 1052, 1051. **Sale bien por casualidad, no
por diseño.** Con un filtro puesto, con la tabla ordenada de otra forma, o con
dos personas a la vez, deja de salir bien.

**Y no avisa de nada.** El movimiento equivocado desaparece y el que se quería
borrar se queda. Lo único que lo delataría es el registro de auditoría, que sí
guarda el contenido de la fila borrada — o sea que es detectable después, nunca
antes.

**EL ARREGLO: que el servidor compruebe antes de borrar.** El navegador manda,
además del índice, la identidad de la fila (fecha, categoría, nombre y
cantidad). El servidor lee la fila, compara, y:
- si coincide, la borra;
- si no, la busca por identidad en las filas cercanas y borra la correcta;
- si no la encuentra, se niega y lo dice ("this movement was already deleted or
  changed — refresh and try again").

**Esto además DESBLOQUEA el borrado instantáneo que pide Jose** (ver abajo): hoy
hay que recargar todo después de borrar precisamente porque los índices quedan
mal. Con la comprobación por identidad, los índices dejan de ser críticos.

---

**JOSE (2026-09-07): CUATRO COSAS DE INTERFAZ Y COMPORTAMIENTO.**

**1. Selección con casillas en Movements, como en el Dashboard.** Casilla por
fila, casilla general para seleccionar y quitar todo, y los botones Edit y
Delete en la MISMA línea que Columns. "Hay que planear, definir y hacerlo bien
para que nada salte o se mueva al tocar cada botón."

Puntos de diseño a fijar antes de escribir (ver la respuesta larga para el
razonamiento):
- La barra de acciones **ocupa su sitio siempre**, con los botones apagados
  cuando no hay nada seleccionado. Aparecer y desaparecer es lo que hace saltar
  la página.
- El panel de Columns debe dejar de **empujar** la tabla: hoy se despliega en
  línea con un texto largo y dos botones más. Debe ser un panel flotante.
- La casilla general selecciona **lo que se está viendo** (filtrado y página
  actual), no las 604 filas. Y necesita el estado intermedio "algunas".
- **Edit sólo tiene sentido con UNA fila.** Con dos o más se apaga, y el
  tooltip dice por qué. Delete sí funciona con varias.
- Lo de "al seleccionar un botón se desactiva el otro" **no hace falta**: la
  ventana emergente ya bloquea el resto. Menos estado que mantener.

**2. Un botón de deshacer.** "hay algunas cosas que hice que quisiera eliminar
pero no se puede". Propuesta en tres niveles, en la respuesta larga:
- **Nivel 1 (barato, ya):** Undo dentro del propio aviso de confirmación, unos
  15 segundos. Cubre el 90% de los casos reales, que son "me acabo de
  equivocar".
- **Nivel 2 (el arreglo de verdad):** papelera. Borrar deja de quitar la fila y
  la marca como anulada; una vista de "borrados hace poco" permite restaurar.
  Borrar deja de dar miedo y la historia se conserva.
- **Nivel 3:** deshacer genérico desde la auditoría. **No vale la pena todavía**
  y queda escrito para no volver a considerarlo antes de tiempo.

**3. El borrado tarda en verse aunque el servidor ya confirmó.** Jose tiene
razón: el aviso sale en el manejador de ÉXITO, o sea que el servidor ya lo hizo.
Después se llama a `loadDataFromGoogle`, que se trae el almacén entero, y la
fila no desaparece hasta que eso llega — varios segundos para enterarse de algo
que ya se sabía.

**No es "optimista"** (actuar antes de que el servidor confirme, con su riesgo).
Es lo contrario: **el servidor YA confirmó y estamos esperando a que nos lo
repita.** La fila se quita del array y se repinta al instante, y el refresco de
fondo sólo reconcilia.

**Bloqueado por el fallo de arriba:** hoy no se puede quitar la fila sin
recargar, porque los `rowIdx` de las demás quedan mal. Primero la comprobación
por identidad, después el borrado instantáneo.

**4. La regla general que Jose señala, y que vale más que el caso concreto:**
"este es solo una cosa de las tantas que la app debe hacer enseguida luego de
que se verificó algo en el backend". Hay que revisar TODOS los sitios que
confirman algo y luego esperan una recarga entera para reflejarlo.

**EL ESTADO DE UN MATERIAL SÓLO SE VE EN EL MAPA — Jose, 2026-09-07.**

Un material bloqueado enseña su candado en el Warehouse Map y **en ningún otro
sitio**. En el Stock Dashboard —que es la pantalla donde la gente BUSCA— no hay
nada. Sus palabras:

> "nadie más sabe hasta que va a tratar de sacarlo del sistema, cosa que sucede
>  luego de mover y cargar las ventanas o el material para llevárselo... cuando
>  alguien busca un material hay que mostrar los permisos o cosas que pasan con
>  ese material."

**El coste de este fallo no es una pantalla fea: es material cargado en una
camioneta que hay que volver a bajar.** El aviso llega en el peor momento
posible — después del trabajo físico, no antes.

**Y ES EL QUINTO CASO DEL MISMO PATRÓN.** Después de SYSTEM_BUSY|, SHORT_STOCK|,
el desbloqueo doble y la carrera de cargas: **la app ya lo sabe y no lo enseña.**
`materialLocks` llega en cada carga, `_rebuildLocksIndex` ya construye el índice
y `_findLock(matId, rack)` ya existe y se usa en tres sitios (el cajón del
estante, el aviso de la salida y el del movimiento suelto). **No hace falta ni
un dato nuevo del servidor: es puramente lo que se dibuja.**

**Dónde ponerlo, en orden de lo que más rinde:**

1. **La tabla del Stock Dashboard**, que es donde se busca. Ya tiene una columna
   STATUS ("In Stock", "All at Site") y una LOCATION que dice "B2A (51)". Un
   candado junto al estante afectado —`B2A 🔒 (51)`— cuesta poco y sale
   exactamente donde el ojo ya está.
2. **El buscador**: si lo que se escribe encuentra un material con candado, que
   se note en la fila, no sólo al abrirla.
3. **La vista de proyecto y el resto de listados**, por el mismo motivo.

**El diseño a decidir antes de escribir código:** un material puede estar
bloqueado EN UN ESTANTE Y NO EN OTRO —los candados son por material Y estante—
así que "MH 145 está bloqueado" sería mentira si tiene 51 en B2A bloqueadas y 30
libres en otro sitio. La marca tiene que decir DÓNDE, o no decir nada.

**Lo que hay que enseñar, más allá del candado**, que es la parte general de lo
que pide Jose: el estado de un material es más que su número. Candado y su
motivo, reservas, mínimo de stock, y (cuando exista) el faltante. Hoy cada una
de esas cosas se enseña en un sitio distinto o en ninguno. Vale la pena
resolverlo de una vez con **una sola marca de estado por material**, calculada
en un lugar y pintada igual en todas las pantallas, en vez de añadir el candado
a la tabla y repetir el problema con la siguiente.

**CUARTA RONDA — Jose, 2026-09-06, con la v11.50 en producción.**

"En general la app se actualiza bien... pero no siempre, y es a eso a lo que
quiero llegar: la app a veces deja de actualizarse aun cuando estamos trabajando
en ella."

### A. ¿Puede el servidor AVISAR en vez de que el navegador pregunte?

Pregunta de Jose, y la respuesta corta es **NO, no con Apps Script.** No hay
WebSockets ni Server-Sent Events; `google.script.run` es pregunta-respuesta y
nada más. Tres caminos reales, con su precio:

1. **Long-polling** — el servidor retiene la llamada ~25 s mirando el sello.
   Técnicamente se puede con `Utilities.sleep`. **Es la peor opción de largo:**
   gasta 25 s de cuota por llamada en vez de ~0,5 s. Cincuenta veces más caro
   para el mismo resultado. Descartada, y escrito aquí para no volver a
   considerarla.
2. **Sondeo más listo ("modo caliente")** — 5 s durante el minuto siguiente a
   cualquier cambio, 20 s con actividad, 150 s en reposo. Barato, incremental,
   y no cambia la arquitectura. **Es lo que recomiendo hacer ya.**
3. **Firebase Realtime Database** — el único camino que da AVISO DE VERDAD. La
   app escribe el sello en Firebase al guardar un movimiento (un `UrlFetchApp`,
   y el límite son 20.000 al día) y cada navegador se suscribe por WebSocket.
   Los cambios llegan en milisegundos y el sondeo desaparece entero. Gratis a
   esta escala. **El coste real no es técnico: es un producto de Google más que
   configurar en cada instalación que se venda.** Decisión de negocio, no de
   código.

**Y falta un dato antes de elegir: "a veces deja de actualizarse".** Eso no lo
explica ninguna de las tres. Hay que averiguar POR QUÉ se para — la v11.49 ya
puso el bucle dentro de un `finally` y registra el error en la consola, así que
la próxima vez que pase, mirar la consola del navegador (F12) es lo que lo
resuelve. Sin ese dato, cambiar de arquitectura sería tapar un fallo sin verlo.

### B. Cuotas de Google: cuánto hay, y cómo saber si un cliente va a sufrir

**LA CORRECCIÓN MÁS IMPORTANTE, Y ES A ALGO QUE YO DIJE MAL:** la cuota NO es
por persona. La app se despliega "ejecutar como yo", así que **TODAS las
llamadas de TODOS los usuarios gastan la cuota del DUEÑO de la instalación**.
Tres personas a 20 s no son tres presupuestos: son uno solo, gastado tres veces
más rápido.

Los topes de Apps Script (verificar en la página oficial de cuotas antes de
prometer nada a un cliente — cambian):

- Tiempo total de ejecución al día: **~90 minutos con cuenta gratuita
  (@gmail.com)**, **~6 horas con Google Workspace**.
- Ejecuciones simultáneas: 30.
- `UrlFetch`: 20.000 al día.

**CÓMO MEDIRLO DE VERDAD, sin adivinar:** el proyecto de Apps Script tiene una
pestaña **Executions** que lista cada ejecución con su duración real. Ahí se ve
cuánto cuesta de verdad un `pulse`, un `getInitialData` y un guardado en LA
INSTALACIÓN DE ESE CLIENTE, con SUS datos. Un almacén con 300 movimientos y otro
con 30.000 no tardan lo mismo en `getInitialData`.

**La fórmula para el estimado**, con los tres números sacados de ahí:

    minutos/día ≈ ( P × Tp  +  C × Tc  +  M × Tm ) / 60

    P = pulsos/día   = personas × horas activas × 3600 / intervalo
    C = cargas/día   = arranques + refrescos silenciosos por cambio
    M = movimientos/día
    Tp, Tc, Tm = segundos reales de cada uno, leídos de Executions

Ejemplo con números plausibles (Tp=0,6 s · Tc=4 s · Tm=5 s), 3 personas, 8 h,
pulso a 20 s, 60 movimientos al día:

    P = 3 × 8 × 180 = 4320 pulsos  → 43 min
    C = 3 × 60 recargas           → 12 min
    M = 60 movimientos            →  5 min
    TOTAL ≈ 60 min/día

**Con cuenta gratuita eso ya roza el tope de 90 minutos con TRES personas.** Con
Workspace sobra sitio. Esto hay que saberlo ANTES de vender, no después: es la
diferencia entre "esta app funciona" y "esta app se apaga a las tres de la
tarde".

**Qué hacer con eso, propuesto:**
- **Que el intervalo sea configurable por instalación**, y que el asistente de
  instalación pregunte cuántas personas la van a usar y si la cuenta es de
  Workspace o gratuita. Con eso se elige el ritmo solo.
- **Una pantalla en Settings → System que enseñe el gasto estimado del mes** con
  los números reales de esa instalación, en vez de que el cliente se entere
  cuando la app deje de responder.

### C. Cosas que fallan, encontradas esta ronda

**C1. El toast sale medio fuera de la pantalla en el teléfono (imagen 2), y la
causa ya está localizada.** Es del mismo tipo que el header de la v11.44 — una
regla que pone unas propiedades y no quita las que sustituye:

    #toastContainer{position:fixed;top:1.25rem;left:50%;transform:translateX(-50%);…}
    @media (max-width:768px){ #toastContainer{bottom:.75rem;right:.75rem;left:.75rem} }

La regla del móvil **no anula `top` ni `transform`**. El `top` sigue mandando,
así que el aviso se queda ARRIBA en vez de abajo; y el `translateX(-50%)` sigue
corriendo el bloque media pantalla a la izquierda, ahora que ocupa todo el
ancho. Por eso sale cortado por el borde izquierdo y arriba. **Arreglo:
`top:auto` y `transform:none` en esa media query.** Dos declaraciones.

Y sí lo habíamos hablado antes: se arregló el ancho (`max-width:100%`) y no la
posición, así que el síntoma cambió de forma y siguió ahí.

**C2. Los botones se solapan al cambiar "Saving…" por "Waiting its turn…"
(imagen 1).** `_btnBusy` fija `min-width` al ancho medido ANTES de cambiar la
etiqueta —puesto ahí para que el botón no diera un salto— y la etiqueta nueva es
más larga. En `.modal-actions{display:flex}` los hermanos se encogen, el botón
ocupado no puede bajar de su `min-width`, y el texto se desborda por encima del
de al lado. Tres arreglos posibles: acortar la etiqueta a "Waiting…";
`flex-wrap:wrap` en `.modal-actions` para que nunca se solapen; o sacar el
estado del botón a una línea propia. **Mi voto: las dos primeras juntas.**

**C3. Desbloquear un material que otro ya desbloqueó.** Sale
`Error: error: lock not found or already removed` **y el candado sigue en
pantalla con la palabra "Unlock"**. Jose: "no debería decirle error al usuario,
debe darle la explicación sin hacerlo sentir como que hizo algo malo o que la
app está fallando".

Tiene razón dos veces. **Y hay algo más de fondo: eso NO ES UN ERROR.** La
persona quería que el material quedara desbloqueado, y está desbloqueado. El
objetivo se cumplió; sólo lo cumplió otro. Es el mismo caso que SYSTEM_BUSY| y
SHORT_STOCK|: el servidor sabe la verdad y el navegador la tira.

Arreglo: marcar ese rechazo como lo que es, tratarlo como éxito, **refrescar la
lista de candados** —que es lo que falta y por lo que el candado se queda
pintado— y decir "someone else already unlocked this" en vez de "Error".

**C4. El número del EXIT tarda demasiado en corregirse.** La v11.50 lo corrige
al RECHAZAR el guardado, o sea después de pulsar Save. Jose lo quiere antes:
"apenas la app detecta que no se puede hacer exit de esa cantidad, se le avise
al usuario el porqué (no con el toast actual) y se actualice la cantidad en la
ventana del exit".

O sea: **la ventana abierta tiene que enterarse sola**, sin esperar a que la
persona pulse Save. Con el latido ya funcionando, la pieza es pequeña: cuando
llega un sello nuevo y hay un formulario de salida abierto, repintar sus
disponibles y, si alguna cantidad ya no cabe, marcarla en la propia fila.
**Y el aviso NO debe ser un toast**, sino algo dentro de la ventana, junto al
número que cambió — que es donde está mirando quien lo va a corregir.

**MEDIDO POR JOSE EN LA v11.49 (2026-09-06) — FUNCIONA, Y HAY DOS NÚMEROS QUE
MEJORAR.** Sus palabras: "cada vez que muevo algo, cambio, borro, hago un entry,
en una cuenta, la otra lo cambia entre los 17-25+ segundos". Y: "el boton verde
se pone rojo al quitar el wifi y al regresarlo tarda casi 15-20 segundos en
volver a ponerse verde".

**Los 17-25 s son exactamente el diseño**: `PULSE_FAST_MS` está en 20 000. No es
un fallo, es el número que elegimos. Para bajarlo hay tres caminos, y ninguno es
gratis:

- **Bajar el intervalo** (10 s → 2800 llamadas por persona y día). Es el más
  simple y el que más cuota gasta. Recordar el cálculo: tres personas a 20 s ya
  son ~30 min diarios de ejecución.
- **Latir más rápido sólo durante un rato después de guardar** ("modo caliente":
  5 s durante el minuto siguiente a cualquier cambio, propio o ajeno). Casi todo
  el trabajo de un almacén pasa en ráfagas, así que esto da la sensación de
  instantáneo por una fracción del coste. **Es mi recomendación.**
- **Actualización optimista** (ver la opción C de la respuesta del 2026-09-05):
  no acelera lo que ven los DEMÁS, sólo lo que ve quien guarda. Resuelve otro
  problema, no éste.

**Los 15-20 s del punto rojo SÍ merecen mirarse**, porque deberían ser cero: la
v11.49 escucha el evento `online` del navegador, que llega en el momento en que
vuelve la red. Si tardó 15-20 s es que ese evento **no se disparó** y el que
funcionó fue el latido de 20 s. Dos causas probables, y hay que distinguirlas
antes de tocar nada:

1. `navigator.onLine` dentro del iframe de Apps Script puede no recibir el
   evento — el documento que lo escucha es el de dentro, no el de fuera.
2. Chrome tarda en decidir que la red volvió cuando el wifi se enciende a mano.

Se distingue mirando la consola del navegador con la red cayendo y volviendo.
Hasta saber cuál es, cualquier arreglo sería adivinar.

**TERCERA RONDA — Jose, 2026-09-05, con la cola ya funcionando.**

**LA COLA FUNCIONA.** Palabras suyas: "cada movimiento toma un turno y se hace
en orden". El video de 63 s lo confirma: una salida de 42 unidades de C3B se
guarda y el tablero queda en 92. Eso ya no hay que tocarlo.

### 1. Que cada quien vea los cambios de los demás — CON SUS REGLAS

Reglas de Jose, textuales: no se actualiza si está off-line; si está on-line se
actualiza cuando cambian LOS DATOS; y hay que verificar que NO se actualice por
copias de seguridad, cambios de permisos ni tarjetas nuevas.

**Y no hace falta inventar un mecanismo: ya existe.** El `heartbeat` corre cada
150 s cuando la pestaña está visible, y además dispara uno al volver a la
pestaña (`visibilitychange`). Lo que falta es que devuelva un SELLO de la última
escritura de datos, y que el cliente compare.

- El sello lo bombea SÓLO lo que escribe movimientos. Un respaldo nocturno, un
  permiso o una tarjeta no lo tocan — que es exactamente la regla de Jose, y
  sale gratis porque el sello se pone a mano donde toca.
- Si el sello cambió → `loadDataFromGoogle(true, true)`, el modo silencioso que
  ya existe desde la v11.47.
- Si el heartbeat falla → no hay refresco. La regla de "no se actualiza
  off-line" se cumple sola.
- **Cero llamadas nuevas al servidor si se deja en 150 s.** Para la prueba de
  concurrencia eso es demasiado lento; ver la nota de coste abajo.

**El coste que hay que decidir:** bajar el intervalo a ~20 s hace que tres
personas se vean casi al instante, y cuesta cuota. Una llamada de heartbeat es
del orden de medio segundo de ejecución; a 20 s durante 8 horas son ~1440
llamadas por persona y día. Con tres personas eso es media hora diaria de la
cuota de Apps Script. **Recomendación: adaptativo.** 20 s mientras haya
actividad reciente en esta pestaña o el sello se esté moviendo; 90–150 s cuando
lleva rato quieto. Así la prueba de concurrencia va fluida y un almacén tranquilo
no quema cuota.

### 2. Una vez off-line, NUNCA vuelve solo — CAUSA ENCONTRADA

Confirmado leyendo el código, no deducido:

- `setConnStatus('offline')` se pone SÓLO desde el manejador de fallo de
  `loadDataFromGoogle`.
- El `heartbeat` tiene el manejador de fallo **vacío**:
  `.withFailureHandler(function(){})`. Ni marca off-line ni marca on-line.
- El temporizador de 60 s sólo marca `stale` a los 5 minutos. **No reintenta
  nada.**

O sea: nada en la app vuelve a intentar por su cuenta. El punto se queda naranja
hasta que alguien lo toca o recarga la página, exactamente como Jose describe.

**Arreglo, y es pequeño:** el heartbeat ya corre y ya se dispara al volver a la
pestaña. Que su éxito ponga el punto en verde y su fallo lo ponga en naranja. Y
que al pasar de naranja a verde dispare un refresco silencioso, porque volver de
off-line es justo cuando hay más probabilidad de haberse perdido algo.

### 3. Los 5-6 segundos de pantalla congelada

Jose: "lo que me preocupa es el tiempo que toma y el usuario que solo ve una
pantalla congelada por casi 5 o 6 segundos antes de ver un toast". Ver la
respuesta larga con las tres opciones y la recomendación.

### 4. El conflicto de EXIT sigue sin explicarse — Y EL ARREGLO ES BARATO

Dos personas sacan todo lo que hay: la segunda ve un error, la cantidad no se
actualiza, la ventana no se cierra y nadie explica qué pasó.

**El dato que falta YA VIAJA en el error.** El servidor lanza:

    'INSUFFICIENT at ' + src + ' for ' + name + '. Available there: ' + ...

O sea que el número verdadero está en el mensaje y el navegador lo tira. Falta:
ponerle una marca legible por máquina (como SYSTEM_BUSY| y DUPLICATE_MOVEMENT|),
escribir ese número en el campo AVAILABLE de la fila que falló, bajar la
cantidad a lo que de verdad queda, y decirlo con palabras. Si ya no queda nada,
la fila no puede seguir en pantalla con su número viejo.

### 5. El formulario pierde datos al cambiar de pestaña — PENDIENTE DE VER

Jose describe: al pasar de EXIT a TRANSFER se pierden datos, las listas de
ubicaciones no son las correctas, se borra la ubicación de donde está el
material, TRANSFER sugiere ubicaciones de TODOS los proyectos aunque el material
esté en uno, y al elegir cualquiera se añade una línea de Source Rack con
`? UNKNOWN RACK` y sin cantidad; sólo DESPUÉS aparecen las ubicaciones buenas, y
al pulsarlas se crea una SEGUNDA línea correcta mientras la mala se queda.

**El video que llegó es el de la salida, no éste.** Falta recibirlo antes de
tocar nada: lo que describe suena a dos fallos distintos (el prellenado que no
se limpia al cambiar de tipo, y la lista de sugerencias que no filtra por dónde
está el material de verdad) y confundirlos costaría un arreglo a medias.

**SEGUNDA RONDA DE CONCURRENCIA — Jose, 2026-09-04, tres cuentas. ONCE COSAS.**

Todo lo de abajo salió de una sesión real con tres personas. Es el reporte más
útil que ha dado esta app, y casi todo cae en **tres causas, no once**.

### CAUSA A — el navegador no se entera de lo que hacen los demás

Ya estaba anotado como el punto 1 de la primera ronda. Esta ronda enseña que no
es una comodidad: es la raíz de la mitad de los fallos.

- **La ventana de EXIT sigue diciendo 142 disponibles cuando ya hay 92.** El
  servidor rechaza bien el movimiento —eso funciona— pero la pantalla sigue
  mintiendo después del rechazo. Jose: "aunque la app le dijo que no se podía
  hacer el movimiento porque solo había 92 available, la ventana seguia
  mostrando 142."
- **El candado no cambia de icono** cuando otro lo puso o lo quitó. Se intenta
  desbloquear algo ya desbloqueado y sale `Lock not found or already removed`.
- **Corolario importante, y es una corrección a lo que yo dije:** el "stock
  negativo aplastado a 0" (hallazgo 4) **no se manifiesta como Jose temía**. La
  app SÍ impide sacar de más. Lo que falla es la pantalla que no se refresca.
  El hallazgo 4 sigue vivo como defensa en profundidad, pero baja de prioridad.

**Lo mínimo que arregla casi todo esto:** después de CUALQUIER rechazo del
servidor por conflicto, refrescar el dato que se acaba de rechazar y volver a
pintar la ventana abierta con el número verdadero. No hace falta el refresco
incremental completo para esto — sólo para el caso de "ver los movimientos de
otros sin recargar".

### CAUSA B — los candados no tienen ni candado ni dueño visible

- **Dos personas bloquean el mismo material y la app deja a las dos.** Mirado
  en el código: `lockMaterial` encuentra el candado activo existente y lo
  ACTUALIZA, sobrescribiendo motivo y dueño. Está escrito a propósito como
  "editar el candado", pero visto desde fuera es pisarle el candado a otro sin
  decir una palabra.
- **`lockMaterial` no usa `withStockLock_`**, igual que `addReservation_`. Dos
  llamadas simultáneas pueden añadir dos filas.
- **CORRECCIÓN A LO QUE LE DIJE A JOSE: quién hizo el candado YA SE GUARDA.**
  `lockMaterial` escribe `auth.email` en la columna 8 y `unlockMaterial` escribe
  quién lo quitó en la 11. El dato existe desde siempre; lo que falta es
  **enseñarlo en la pantalla**. No es trabajo de servidor, es de interfaz.
- **Al tocar un candado que no se puede tocar no se dice por qué.** Hoy sólo se
  ve el botón deshabilitado o un error crudo.

### CAUSA C — un conflicto se cuenta como un error del usuario

- **Tres personas hacen salidas que suman exactamente lo que hay** (142 = 42 +
  50 + 50): una lo consigue y dos ven un error. Jose: "no debemos dejar que la
  app muestre un error cuando los movimientos sí están hechos correctamente,
  pero es el sistema el que no lo está haciendo bien. debemos poner en cola los
  movimientos o reintentar hacerlos otra vez, si todo está correcto."
  **Tiene razón y es la petición más importante de la lista.** Los tres
  movimientos son legítimos; el sistema es el que no supo ponerlos en fila.
- **Borrar un movimiento siendo Warehouse/Supervisor da un error a secas**, sin
  decir que hace falta permiso de admin ni a quién pedírselo.

### LO QUE NO ENTRA EN LAS TRES CAUSAS

- **La ventana de Manage Users se recarga entera cada vez.** Mismo trato que
  App Settings en la v11.37: enseñar lo que ya se sabe y reemplazar sólo lo que
  cambió.
- **En el panel del estante, el título debe ser el NOMBRE DEL MATERIAL, no la
  locación.** Motivo de Jose, y es el bueno: en el teléfono el nombre del
  material no se ve completo. La locación ya se sabe — se acaba de tocar.
- **Roles distintos para la misma persona en dos sitios de la misma ventana.**
  Imagen 1: la cabecera dice SUPERVISOR y la lista de usuarios activos dice
  ADMIN, para la misma cuenta. Los dos pasan por `_displayRole`, así que no es
  el mapeo: es que **la cabecera se pinta desde la CACHÉ** (`_setAccountIdentity`
  con `stale=true` en `loadDataFromGoogle`) y la lista viene del servidor. Un
  rol cambiado hace poco se ve viejo arriba y nuevo abajo.
  Y hay un segundo efecto que NO es un fallo pero se lee como tal: dos cuentas
  distintas con el mismo nombre ("Jose Castro" dos veces) salen como dos
  renglones idénticos porque la lista enseña el nombre y no el correo. Se
  arregla solo con el cambio de "nombre sobre correo" ya anotado.
- **Firmas de Gmail en los correos que manda la app.** Ver la respuesta larga:
  `MailApp`/`GmailApp` NO añaden la firma. Hay que leerla con el servicio
  avanzado de Gmail (`Gmail.Users.Settings.SendAs.list`) y pegarla al pie del
  HTML. Es posible, pide activar el servicio avanzado y un permiso más.

### LO QUE JOSE PROBÓ Y NO ERA LO QUE YO LE PEDÍ — culpa mía

Le pedí probar **reservas** y probó **candados**. Son cosas distintas, y el
error es mío por no decirlo con claridad:

- Los candados usan `LOCK-` + milisegundos → **no chocan**. Por eso cancelar uno
  nunca canceló otro, como él comprobó varias veces. Su prueba fue correcta y
  el resultado es bueno.
- Las reservas usan `RES-` + **segundos**, que es donde está el hallazgo 5.
- **Y no se pueden probar desde la app: `addReservation` no tiene ningún botón
  en la interfaz.** Sólo se llega por `processMovement`. Así que el hallazgo 5
  es hoy teórico, y no hay forma de que Jose lo verifique. Queda pendiente
  DECIDIR si las reservas van a existir de cara al usuario; si no, el arreglo
  correcto puede ser quitar el endpoint en vez de blindarlo.

**PRUEBA DE CONCURRENCIA HECHA — Jose, 2026-09-04, tres cuentas.** El resultado
de fondo es bueno: **la app no se corrompió**. Cuando dos personas escribían a
la vez, la segunda recibió "el sistema está ocupado, vuelve a intentar" en vez
de pisar el dato. Ese era el riesgo grande y no se materializó.

Lo que Jose encontró, en sus palabras:

1. **No se ven los movimientos de otros sin recargar.** "Si no cambio o
   actualizo la página, nunca se ven los movimientos de otros usuarios, pero no
   quiero que la app se actualice ni haga refresh, solo que muestre lo que es
   nuevo o ha cambiado, nada más." Es la pieza que falta para que tres personas
   trabajen a la vez sin pisarse: hoy cada quien ve su propia foto del almacén
   hasta que recarga.
2. **El aviso de "sistema ocupado" sale donde no se está mirando.** Hoy es un
   toast arriba de la pantalla mientras la persona tiene los ojos en el botón
   de Guardar. Debe decirlo **el botón mismo**, no volver a su estado normal
   como si no hubiera pasado nada.
3. **La velocidad de respuesta de la app hacia el usuario.** Anotado por él
   mismo como "para la lista", no urgente.

**LAS TARJETAS DEL DASHBOARD SE RECARGAN EN CADA CAMBIO — Jose (2026-09-04).**
Su imagen 1: las tarjetas en esqueleto y "Connecting to Google Sheets... this
may take 10-20 seconds" después de un cambio.

**Ya está diagnosticado y NO hace falta inventar nada:** `loadDataFromGoogle`
tiene tres modos, y los tres existen ya en el código. `(false)` enseña lo
cacheado al instante y no parpadea; `(true, true)` recarga en silencio;
`(true)` —sin el segundo argumento— pinta los esqueletos y el mensaje de los
20 segundos. **Hay nueve llamadas del tercer tipo** (líneas aprox. 4519, 5843,
8536, 9295, 9798, 14487, 15397, 16985 y la de arranque). El arreglo es
revisarlas una a una y decidir cuáles merecen de verdad la pantalla de carga —
la de arranque sí, casi ninguna otra— y pasar el resto al modo silencioso. No
es un rediseño, es una auditoría de nueve sitios.

**LOGO COMPLETO DE ACOPIO — Jose (2026-09-04).** Dos sitios distintos:
- **Al abrir la app la primera vez** (el cliente que la acaba de instalar).
- **Un segundo al abrir la página web**, antes de cargar el resto.

**EL SITIO NO ENSEÑA NI UNA IMAGEN DE LA APP — Jose (2026-09-04).** "Dice mucho
pero no muestra ninguna foto o imagen de la app." Quiere un GIF o video corto en
bucle en la landing, e imágenes de la app en la guía de instalación
(`docs/instalacion.html`). **Esto necesita capturas reales de la instalación de
Jose**, y hay que decidir antes qué se puede enseñar: una captura del dashboard
lleva nombres de obra, de proveedor y cantidades reales de OX Glass. O se usan
datos de ejemplo o se difuminan.

**LA PERSONA EN CADA MOVIMIENTO — Jose (2026-09-04).** Nombre encima del correo,
el nombre en negrita y más grande, el correo debajo en gris (casi el color
actual). Y al pasar el ratón, un globo con botones: **mandar correo**,
**videollamada por Google Meet**, y **chat**.

**Sobre el chat, que es la parte que hay que decidir antes de prometerla:** un
chat dentro de la app es posible pero NO es una función pequeña. Necesita hoja
propia, sondeo constante contra Apps Script (que tiene cuota diaria de tiempo de
ejecución) y avisos. Correo y Meet, en cambio, son **enlaces** —`mailto:` y
`meet.google.com/new`— o sea prácticamente gratis y funcionan hoy. Recomendación:
hacer los dos enlaces ya, y tratar el chat como una decisión aparte.

**LA VELOCIDAD DE RESPUESTA — Jose (2026-09-04).** Anotada por él mismo como no
urgente. Va con el punto 3 de la concurrencia.

**JOSE (2026-09-04): LA POLÍTICA DE COBRO NO ES URGENTE.** Palabras suyas: "PON
EN LA LISTA LO QUE NO ES IMPORTANTE AHORA." Baja de "lo que bloquea vender" a
esta lista, y todo lo que sigue se queda escrito tal cual para cuando se
retome.

Lo que hay que saber al volver, para no tener que decidir nada otra vez: **las
tres decisiones difíciles ya están tomadas y aprobadas** (2026-09-01, "HAZ COMO
ME DICES EN LA RECOMENDACION") — se queda la escalera de 30 días por impago, se
adopta la escalera de reactivación de Jose, y las devoluciones se unifican en
"5 a 10 días hábiles". Los Términos ya se sincronizaron con esas tres. Lo único
que falta es **redactar el documento de cobro** y comprobar que no contradice
lo ya publicado. Es trabajo de escribir, no de decidir.

---

**POLÍTICA DE COBRO — respuestas de Jose (2026-08-31). Falta redactarla y
publicarla junto a la de soporte.**

Textual, para que la redacción no se invente nada:

- **Cómo se paga:** mensual, o un año completo por adelantado. Los precios ya
  están en la landing y hay que citarlos desde ahí, no volver a escribirlos —
  un número en dos sitios es un número que se desincroniza (ya pasó una vez con
  el documento de detalle, que estuvo semanas en $400 + $39).
- **Si dejan de pagar:** no se da soporte. Y al querer volver, pagan **el
  mensual más un adicional** por el trabajo extra de poner la app al día —
  Jose propone "tal vez la mitad de la instalación". **Ese número falta
  decidirlo**, y hasta que exista no se puede publicar la política: una
  política que dice "un adicional" sin decir cuánto no es una política.
- **Gracia:** 3 días al mes, contados desde el día en que se genera el primer
  pago en Stripe (o sea, la fecha de cobro es la del primer pago, no el día 1).
- **Devoluciones:** solo del pago mensual. **El pago de instalación no se
  devuelve una vez hecha la instalación.** Se procesan en 5 a 10 días hábiles.

**Lo que NO cambia y hay que decir explícitamente en el texto:** los datos son
del cliente y viven en su propia hoja de Google. Dejar de pagar no le quita el
acceso a su información ni a la app instalada — se pierde el soporte y las
actualizaciones, nada más. Esto no es generosidad, es un hecho de la
arquitectura, y decirlo en voz alta quita el miedo que frena una venta.

**Riesgo a revisar antes de publicar:** el documento de soporte y devoluciones
ya está publicado y promete cosas. La política de cobro tiene que decir lo
mismo palabra por palabra o quedan dos promesas distintas por escrito, las dos
firmadas. Comparar contra `docs/SOPORTE-Y-DEVOLUCIONES.md` antes de dar por
buena la redacción.

---

### ⛔ REVISADO (2026-09-01) — y el riesgo era real. TRES CHOQUES. Decidir antes de redactar.

Las respuestas de Jose contradicen `legal/TERMS-OF-SERVICE.md`, que **ya está
publicado en acopio.net Y va dentro de la app de cada cliente** (LEGAL_DOCS).
Escribir la política encima de esto produciría dos promesas firmadas distintas,
que es peor que no tener ninguna.

| | Términos (§9, publicado) | Jose (31/08) |
|---|---|---|
| Impago | Stripe reintenta → día 10 correo personal → **día 30 se pausa** el soporte | **3 días de gracia** |
| Reactivación | "**with no reconnection fee**" | **+$150** pasados 2 meses |
| Volver tras irse | "treated as a **new customer**… **includes the setup fee**" | ≤2 meses sin cargo · >2 meses +$150 · >12 meses instalación nueva |
| Plazo de devolución | "within **10 business days**" | **5 a 10** días hábiles |

**Mi lectura, punto por punto:**

1. **Los 3 días son un error y hay que decírselo.** Los reintentos de Stripe se
   reparten a lo largo de ~2 semanas. Una tarjeta que falla el día 1 y entra el
   día 5 es completamente normal — banco, tarjeta renovada, límite temporal. Con
   3 días ese cliente queda cortado por un cobro que iba a entrar solo. Se
   castiga al que se porta bien por lo que hizo su banco. La escalera que ya
   está escrita (reintentos → día 10 correo personal → día 30 pausa) es mejor y
   ya está firmada.

2. **La escalera de reactivación de Jose es MEJOR que lo publicado, y conviene
   adoptarla.** Hoy los Términos dicen que quien vuelve paga la instalación otra
   vez: **$500**. Lo de Jose es más barato para el cliente y más defendible.
   Cambiarlo es mejorar la promesa, no recortarla.

3. **Los 5–10 días** son compatibles: 10 sigue siendo el techo. Se unifica
   diciendo "entre 5 y 10 días hábiles".

**Y el detalle que hace urgente decidirlo:** los propios Términos dicen que un
cambio se avisa **con 30 días de antelación** a los clientes existentes. Jose no
tiene clientes todavía, así que cambiarlos hoy es gratis. Dentro de tres meses,
con clientes firmados, no lo será.

**Cambiar los Términos no es editar un archivo.** `legal/TERMS-OF-SERVICE.md` es
la fuente, pero el texto está DUPLICADO dentro de `Code_v3_fixed.gs`
(LEGAL_DOCS) porque cada cliente corre su copia y no tiene a dónde enlazar. Hay
que correr `node tools/sync-legal.js` y volver a desplegar, o `--check` falla.

**Para arrancar sin construir nada:** enlace de pago de Stripe mandado por
correo. Sin integración, sin webhooks, sin código. Cuando haya diez clientes y
renovaciones que perseguir, ahí se automatiza — y para entonces se sabrá qué
automatizar. Falta también la pregunta del impuesto sobre ventas de software en
Utah, que es para un contador y no para esta lista.

**REDISEÑO DEL MODELO DE MOVIMIENTOS — Jose (2026-08-31). El más grande de la
lista, y el más correcto. Decidir antes de empezar cualquier etapa.**

Empezó como un bug chico: seleccionar varios materiales en el tablero, dar
"Exit Selected", y al cambiar el tipo a TRANSFER solo sobrevive el primero.

Eso NO es un descuido — está escrito y razonado en `Index_v3_fixed.html`
(`_readMoveMaterial`): *"Only the FIRST material carries... there is no honest
way to carry three materials into a form with room for one."* La decisión era
correcta cuando se tomó. Dejó de serlo cuando Jose necesitó registrar en el
sistema una tarima que ya había movido físicamente, con prisa.

Yo propuse multi-material con **un destino compartido**. Jose lo rechazó, con
razón: *"cualquier bodega debe ser libre de mover todo como quiera pero nosotros
debemos darles eso en orden y con advertencias"*. Sus casos: 2 materiales a 2
lugares distintos de una vez; 1 material a 2 destinos en un solo movimiento
(guardado como 2 filas); 2 retornos desde 2 obras distintas a 2 estantes
distintos. Mi diseño resolvía su prisa y le quitaba la bodega.

**El modelo correcto, que es el que él describió:**

> Un movimiento es una lista de renglones: material + de dónde + a dónde + cuánto.

Y cada tipo es ese renglón con los extremos restringidos:

| Tipo | De | A |
|---|---|---|
| ENTRY | proveedor (fuera) | estante (dentro) |
| EXIT | estante (dentro) | obra (fuera) |
| TRANSFER | estante u obra | estante u obra |
| RETURN | obra (fuera) | estante (dentro) |
| WASTE | estante u obra | nada |
| ADJUST | no es un movimiento: es un conteo |

TRANSFER es el caso general y los demás son TRANSFER con los extremos amarrados.
Los tres casos de Jose caben sin excepciones — ese es el argumento de que el
modelo es el bueno: dejan de existir los casos especiales.

**LO QUE SE VERIFICÓ EN EL CÓDIGO, y que es lo que hace esto grande:**

1. `calculateStock` (Code_v3_fixed.gs ~1750) tiene el modelo escrito a mano por
   tipo, y dice literalmente `TRANSFER → rack-to-rack. no warehouseQty change`.
   Mover algo de una obra a un estante y guardarlo como TRANSFER **no sube el
   número de bodega**. No es un límite de pantalla: el modelo no lo representa.

2. Hay **una sola** lista de ubicaciones, `rackList`, compartida por todos los
   campos (origen, destino, filas de exit, filas de transfer, el candado de
   destinos permitidos). Dentro/fuera no existe en ninguna parte de la UI.

3. **La app no sabe en qué obra está el material que salió.** `warehouseLocs` es
   un mapa por estante; `siteQty` es UN número. Sabe cuánto salió, no a dónde.
   "¿Cuánto tengo en el proyecto Jordan River?" hoy no se le puede preguntar a
   los datos, y sin eso "retornar desde 2 obras distintas" no tiene con qué
   cuadrar.

**Las etapas, en orden obligatorio:**

- **1. Las ubicaciones tienen tipo.** Registro con dos clases: *dentro*
  (estantes) y *fuera* (obras, proyectos, otra bodega). Las existentes se
  clasifican solas — lo que está en `warehouseLocs` es dentro, lo que aparece
  como destino de EXIT es fuera. Nada que teclear. Con esto solo ya se cumple la
  segunda idea de Jose: EXIT sugiere solo lugares de fuera **pero deja escribir
  uno nuevo**, ENTRY solo de dentro. Y es la puerta a varias bodegas: una segunda
  bodega es un grupo de ubicaciones "dentro" con otro nombre.
- **2. `siteLocs`, igual que `warehouseLocs`.** Saldo por obra. **Aquí está el
  riesgo real**: `calculateStock` es donde viven los números y no es la única
  función que convierte movimientos en existencias. Si una no entiende la forma
  nueva, el inventario se va en silencio.
- **3. El movimiento pasa a ser N renglones libres**, con el tipo que
  **advierte, no prohíbe** — palabras de Jose. Si un TRANSFER tiene los dos
  extremos fuera de la bodega, la app avisa "esto no toca tu inventario de
  bodega, ¿seguro?" y deja seguir.
- **4. El texto de guía en pantalla**, con las definiciones de Jose tal cual:
  *WASTE es solo para inventario perdido que no se puede recuperar; TRANSFER es
  para inventario que se mueve entre proyectos 'on site' y locaciones dentro de
  la bodega, o solo entre locaciones dentro de la bodega; EXIT y ENTRY para
  material que sale o llega; ADJUST es solo para ajustar lo que alguien hizo mal,
  sea dentro de la bodega o el proveedor.*

**Retrocompatibilidad, en todas las etapas.** Hay meses de movimientos guardados
con el modelo viejo. Cada etapa tiene que leer los dos, y hay que probarlo con
datos reales, no inventados.

**Los dos parches chicos, que sirven aunque el rediseño se posponga:**
- `exitSelectedStock()` llama a `clearStockSelection()` al abrir la ventana, así
  que la selección se destruye antes de que se pueda cambiar de tipo. Mantenerla
  viva hasta guardar o cerrar.
- Cuando el cambio de tipo tire materiales, **decirlo**: "4 materiales no se
  pudieron pasar a Transfer". Hoy se pierden en silencio y Jose lo descubrió
  solo porque se puso a pensarlo.

---

**JOSE (2026-08-31) — Reporte diario de entradas y salidas.** Un resumen
nocturno de qué se recibió y qué salió de la bodega ese día. **La hora la
configura un admin**, no es fija.

Notas para cuando se haga: ya existe `dailyCheckinTrigger` (9:00) y
`dailyBackupTrigger` (2:00), así que el patrón de tarea programada está hecho y
`ensureCheckinTrigger_` es el molde. Lo que NO existe es una hora configurable —
los tres disparadores actuales tienen la hora escrita en el código
(`.atHour(9)`), así que hace falta guardar la hora elegida y reinstalar el
disparador cuando cambie. Ojo con eso: cambiar la hora significa borrar y
recrear el trigger, no editarlo.

Decidir también a quién le llega (¿solo admins? ¿lista de correos?) y qué pasa
un día sin movimientos — mandar "hoy no hubo movimientos" es información;
mandar un correo vacío es ruido que la gente aprende a ignorar.

---

~~**BUG REPORTADO POR JOSE — la ventana de edición sale DETRÁS del popup de la
mañana.**~~ ✅ **Hecho (v11.29).** `.morning-overlay` bajó de 2000 a 540. No era
el escudo de ventanas: el escudo leía la pila correctamente, la pila estaba mal.
El popup solo ABRE modales, ningún modal lo abre a él, así que va debajo.
`tools/test-window-stack.js` fija el orden de las cinco capas y también falla si
dos empatan — el empate con `.wiz-overlay` en 2000 fue justo como pasó.

~~**SUPERVISOR / WAREHOUSE en el mismo panel.**~~ ✅ **Hecho (v11.29).**
`renderActiveUsers` imprimía el rol crudo mientras la tarjeta de perfil dos
líneas arriba usaba la etiqueta. Sobrevivió cuatro versiones porque el
comentario sobre `_applyWarehouseRoleLabel` afirmaba que todo lo demás ya pasaba
por `_displayRole()` — y una frase no hace fallar un build. `test-role-label.js`
ahora cuenta los caminos de render, no solo la función.

~~**Las tarjetas del sistema no aparecen (ni en el deck ni en Settings).**~~
✅ **RESUELTO (v11.30) — era UNA LÍNEA, y Jose tenía razón desde el principio en
que los dos síntomas eran el mismo problema.**

`getInitialData` armaba el payload así:

    systemActivity: (function(){ try { return getSystemActivity_(30, _auth.email); }
                                 catch (e) { return []; } })(),

La variable en ese ámbito es **`auth`**, no `_auth`. Y sí existe un `_auth` en
esa función — declarado **al final**, dentro del manejador de errores
(`var _auth = getUserRole(sessionToken)`). Como `var` se iza al inicio de la
función, `_auth` existía en esa línea **valiendo `undefined`**, así que
`_auth.email` lanzaba un TypeError en cada llamada y el `catch` en línea lo
convertía en un array vacío.

**`systemActivity` salía `[]` en TODAS las cargas, para TODOS los usuarios,
desde el día que se escribió esa línea.** Las dos pantallas que la leen se
apagaron juntas: el deck de la esquina (`_sysCards`) y Settings → System
(`sysActs`). Los respaldos nunca estuvieron rotos — corrían cada noche,
escribían su fila en AUDIT_LOG con actor `system`, y hay 27 en Drive. Las filas
simplemente nunca salían del servidor.

**Mis dos hipótesis anteriores eran falsas** y Jose las descartó con capturas:
no era el trigger sin instalar (existe, 0% error, corrió el 28-ago 2:36) ni el
apilamiento del deck (abrió la pila y salieron 4 tarjetas, todas de sugerencias
y ninguna de sistema — o sea que la lista venía vacía, no enterrada).

**Por qué nada lo detectó:** no es error de sintaxis, así que `node --check`
pasa; el `catch` devolvía un valor plausible; y `test-sysactivity-dismiss.js`
pasa porque llama a `getSystemActivity_` directamente en un vm con sus propios
argumentos — probaba la FUNCIÓN, nunca la línea que la usa. Mismo patrón que la
etiqueta de rol en la v11.29.

`tools/test-use-before-var.js` ahora comprueba la regla general en las 248
funciones del archivo: ninguna puede LEER un `var` por encima de la línea que lo
declara. Y el `catch` que lo escondió ahora deja rastro en el log; el array
vacío se queda, porque un fallo al leer la auditoría no debe tumbar la carga
entera.

**Queda para Jose:** desplegar la v11.30 y confirmar que aparecen las dos cosas
— la tarjeta en la esquina y la lista en Settings → System. Leen la misma lista,
así que o cambian las dos o no cambia ninguna.

**SITIO PÚBLICO (v11.32) — lo que falta antes de publicar.**

1. **DECISIÓN DE JOSE, y bloquea la primera publicación: ¿qué correo de contacto
   va en el sitio?** Hoy `landing/acopio.html`, los Términos y la Privacidad
   llevan `joseisrael5101@gmail.com`. `tools/test-site-privacy.js` **falla a
   propósito** por eso y no se publica nada hasta que se decida. No es un
   defecto: es que poner el Gmail personal en un sitio comercial es distinto de
   poner `hola@acopio.net`, y ahora que Jose tiene el dominio, la segunda opción
   existe. Cuando lo decida: cambiar los tres archivos y quitar el patrón del
   guardián, o dejarlo y quitarlo del guardián a conciencia — pero decidido, no
   por descuido.

2. **`RESTAURAR-UN-BACKUP.md` — hay que escribir la mitad del cliente.** Estaba
   en la lista pública y el guardián lo sacó en su primera corrida, con razón:
   mezcla el procedimiento del cliente con notas de Jose. Nombra
   `SESSION_SECRET` y `OAUTH_CLIENT_SECRET`, explica las Script Properties, y
   trae un párrafo sobre guardar copia de las propiedades de cada cliente —
   incluida la observación de que el secreto OAuth **es de Jose y es compartido
   entre todos los clientes**. Publicar eso le dice a cualquiera que un solo
   secreto abarca todas las instalaciones.
   Hace falta un documento nuevo, solo para el cliente: aquí está tu respaldo,
   así se restaura, esto es lo que una copia restaurada NO trae. Es trabajo de
   redacción, no de filtrado — borrar párrafos del archivo actual dejaría un
   texto con agujeros.

3. **El repo `acopio-site` lo tiene que crear Jose.** Lo intenté y GitHub
   respondió `403 Resource not accessible by integration`: la app de GitHub de
   esta sesión no puede crear repositorios. Pasos en el chat.

4. **Quitado de la página pública de producto (hecho):**
   `landing/acopio-overview.html` decía *"El margen de un cliente adicional es
   prácticamente el precio completo."* — el margen de Jose, en la página que lee
   el cliente. Lo encontró el guardián, no una lectura. **Ojo: el artefacto
   publicado "Acopio en Detalle" todavía tiene esa frase** y hay que
   republicarlo.

**JOSE (v11.32) — TODOS los botones de acción, no sólo el que se tocó.** Amplía
el punto del merge de abajo a una regla general, y es la correcta: hoy, cuando
hay dos o más botones y se hace clic en uno que tarda, **sólo se desactiva el
que tocaste**. Los demás quedan perfectos y clicables. Aplica a *accept*, *add*,
*mark*, *merge*, y a todo lo que dispare una acción con viaje al servidor.

Jose además pide dos cosas distintas y las dos son correctas:
1. **El botón tocado se desactiva** para no poder pulsarlo dos veces. Eso ya lo
   hace `_btnBusy`.
2. **Los demás también** — desactivarse o, mejor según él, **desaparecer**.

La segunda es la que falta y es la que importa: mientras una operación corre, la
tarjeta tiene un solo estado válido, y ofrecer otras salidas es ofrecer un error.

**Cómo hacerlo bien (a decidir):** en vez de tocar botón por botón —que es
exactamente cómo nace este descuido— que `_btnBusy` desactive **todos los
botones del contenedor** del que salió, y `_btnReset` los devuelva. Así un botón
nuevo lo hereda gratis y nadie tiene que acordarse. Falta decidir si los otros
se **atenúan** o **desaparecen**: desaparecer evita el clic pero mueve la
maqueta y sobresalta; atenuar mantiene el sitio. Recomendación a discutir:
atenuar + `pointer-events:none`, que es invisible al dedo y estable a la vista.

**DECIDIDO — Jose (2026-08-31): desaparecer.** "desaparecer me parece mejor."
Se implementa así, no como yo había recomendado.

Queda un detalle de ejecución que la decisión no resuelve, y es la parte que
puede molestar: si el botón se quita del flujo, la tarjeta se encoge mientras la
acción corre, vuelve a crecer al terminar, y la lista de abajo salta dos veces.
La forma de obedecer la decisión sin ese salto es `visibility:hidden` en lugar de
sacar el nodo — el botón desaparece de la vista y del dedo, y el hueco que
ocupaba se queda quieto. Si al verlo Jose prefiere que el espacio también se
cierre, es cambiar una línea.

**Corrección mía, anotada para que no se repita:** en la lista de prioridades
del 31/08 resumí esto como "el par de botones de Merge". Está mal, y Jose lo
corrigió: el merge fue *dónde* lo vio, no *qué* es. La regla es general —dos o
más botones juntos, se toca uno, los demás siguen clicables— y aplica a accept,
add, mark y a todo lo que viaje al servidor. Este archivo ya lo decía bien
arriba; fue el resumen el que encogió el problema.

Prueba pendiente: mientras una acción corre, **ningún** botón de esa tarjeta
acepta clics. `tools/test-button-states.js` ya prueba el botón tocado; le falta
la pareja.

---

**JOSE (v11.32) — encerrar cada área de Settings en un recuadro.** Cada bloque
de App Settings en su propia caja, con **borde azul y sólo el borde** (sin
relleno). Hoy los bloques se separan sólo por espacio, y en las pantallas largas
—System, Permissions— no se ve dónde acaba uno y empieza el siguiente.

Al hacerlo hay que decidir el token de color: usar `var(--accent)` para el borde
en vez de un azul suelto, o el azul quedará mal en modo oscuro.

---

**JOSE (v11.32) — App Settings recarga entero cada vez que se abre.**
`openSettingsModal()` llama a `_loadSettings()` siempre, que es un viaje al
servidor, así que abrir Ajustes es esperar aunque no haya cambiado nada. Jose:
*"debemos mostrar lo que el navegador ya sabe que hay… y sólo cambiar lo que se
modificó, como ya hacemos en otras partes de la app."*

Tiene razón, y **el patrón ya existe en la app** (`_saveCache` / la carga
silenciosa del dashboard). Lo que falta es aplicarlo aquí: pintar de inmediato
con `_settingsData` si ya está en memoria, disparar la lectura en segundo plano,
y repintar **sólo si volvió algo distinto**.

**El cuidado que hay que tener:** Ajustes es donde se cambian cosas, así que una
caché mal invalidada mostraría una lista de usuarios o de proyectos vieja
después de editarla — peor que la espera actual. Cualquier acción que escriba
tiene que marcar la caché como sucia. Ese es el trabajo real; el pintado
inmediato es la parte fácil.

**BUG REPORTADO POR JOSE (v11.31) — al hacer merge de proyectos, sólo se
desactiva UNO de los dos botones.** En App Settings → Projects, durante el
merge, el botón *"Merge into selected"* se desactiva mientras corre (correcto),
pero el otro sigue activo y **se puede hacer clic en él**. Jose: *"¿no debería
también desactivarse o desaparecer para no causar error si se da clic?"*

Sí. Y no es cosmético: durante un merge el servidor está reescribiendo ambos
archivos dentro del candado, así que un segundo clic o bien queda encolado
detrás del candado (y el usuario ve la app congelada sin explicación) o bien
llega con el estado ya cambiado y falla con un error que no dice nada útil. El
`_btnBusy` que ya existe hace justo esto — el problema es que se aplicó a un
botón y no a su pareja.

Hay que revisar **los dos botones a la vez**, y de paso mirar si el mismo
descuido está en las otras pantallas de merge (proveedores, ubicaciones,
materiales) — es el patrón de siempre: la defensa está puesta en un sitio y no
en el de al lado. Falta también una prueba que exija que, mientras una
operación destructiva corre, **ningún** botón de esa tarjeta acepte clics.

⚠️ **DEFECTO SEPARADO, sigue en pie — `Code_v3_fixed.gs:473` tiene un `catch`
vacío.** Encontrado buscando lo de arriba; no era la causa en la instalación de
Jose, pero es real para cualquier copia nueva:

    if (data.enableBackup) { try { ensureBackupTrigger_(); } catch (e) {} }

Es la única línea que programa el respaldo nocturno durante la instalación.
Crear un trigger exige una autorización que puede no estar concedida todavía en
ese punto del asistente. Si falla, **falla en silencio y para siempre**. La
línea de al lado (`organizeDriveFolders_`) al menos hace `Logger.log`; ésta no
hace nada.

Y **`menuCheckInstallation` (🩺) no mira los triggers** — verificado: no
menciona `getProjectTriggers`, ni `Trigger`, ni `backup`. Sólo lee Script
Properties. El diagnóstico que existe para contestar "¿está sana esta
instalación?" no puede detectar un respaldo nocturno que nunca se programó.
Mismo patrón que la Prioridad 1 de la auditoría: la defensa está bien escrita y
nada verifica que exista.

**Arreglo:** (a) que el `catch` registre y avise; (b) que el 🩺 enumere los tres
triggers esperados —`dailyBackupTrigger`, `archiveOldMovementsTrigger`,
`dailyCheckinTrigger`— y ofrezca recrearlos, como ya hace con `SESSION_SECRET`;
(c) una prueba que exija que ninguna llamada a `ensureBackupTrigger_` quede sin
cubrir.

---

**PENDIENTE — el faltante (inventario negativo). DECIDIDO POSPONER (Jose,
v11.29).** Todo el diseño está acordado y verificado; sólo falta construirlo.
Lo confirmado corriendo el código real, no leyéndolo:

- **El escenario que preocupaba a Jose NO pasa.** Entrada editada a 10 con 50 ya
  salidos, luego llegan 30 → `warehouseQty: 30`. No 29. El aplastado a cero se
  aplica **movimiento por movimiento** dentro del bucle, así que lo nuevo suma
  sobre cero y el faltante no se come nada.
- **El rastro de auditoría ya existe entero**: `modifyMovementLocked_` exige
  motivo, escribe `auditLog_('MODIFY_MOVEMENT', …)` con Old Value / New Value, y
  manda correo al admin con el antes, el después y el motivo.
- **Editar movimientos ya es sólo de ADMIN** por defecto (`canEditMovements:
  false`).

**Lo único que falta: que el faltante se VEA.** Hoy se calcula
(`s._errors.push('NEG@A1 had=10 tried=50')`) y en la línea 1861 se tira a
`Logger.log`, que nadie abre. La persona ve 0, que es mentira.

Diseño acordado, para cuando se retome:
- Dos números, no uno: **On hand** (nunca negativo, lo que se puede tomar) y
  **Shortfall** (el faltante, aparte, que no se resta de nada).
- Marca en la fila del material, estilo las de stock bajo, que lleva a **Adjust**.
- **Se limpia sola**: el faltante se muestra sólo si ocurrió DESPUÉS del último
  Adjust de ese material en ese rack. Un conteo físico manda sobre lo anterior —
  así la marca desaparece cuando alguien hace lo que la resuelve, sin un botón
  de "ya lo vi" que se aprieta sin leer.
- El admin **puede** dejarlo en negativo, pero avisado antes de guardar: *"This
  will leave GLASS 6MM short by 40 at A1. Save anyway?"*
- **Pregunta abierta:** ¿la marca la ven todos o sólo los admins? Recomendación:
  todos — el de bodega es quien puede ir al rack a contarlo.

---

~~**IDEA DE JOSE (v11.29) — de "Mark arrived" a Entry sin volver a escribir
nada.**~~ ✅ **Hecho (v11.42).** La pregunta va DENTRO de la ventana de la
entrega, no en un popup después de guardar — la recomendación de abajo era la
correcta. Aparece sólo con estado Arrived y viene marcada.

**Lo que queda vivo de esto, y hay que arreglarlo cuando se pueda:** la lista de
"llegó y falta su entrada" vive en `localStorage`, o sea **por navegador**.
Quien marque la llegada en el teléfono no verá la tarjeta en el escritorio.

Se eligió a sabiendas frente a las dos alternativas. Guardarlo en la hoja pide
columna nueva, endpoint nuevo y un viaje al servidor por cada "más tarde", para
un recordatorio que casi siempre se atiende en dos minutos. Y **deducirlo** —
"toda entrega Arrived sin su Entry"— sería lo correcto y hoy no se puede:
emparejar una entrega con un movimiento es adivinar por nombre y cantidad, y
adivinar mal ahí significa decirle a alguien que le falta una entrada que ya
hizo.

**Cuando el rediseño del modelo de movimientos ate las dos cosas, esto se
vuelve derivable y localStorage sobra.** Es una razón más para hacer ese
rediseño, y va anotada aquí para que no se pierda.

Y una decisión que NO hay que deshacer: **el estante no se rellena.** La app
sabe cuánto llegó; no sabe dónde lo pusieron. Un estante de relleno —el último
usado, el primero de la lista— produce inventario que dice estar en un sitio
donde nadie miró. `tools/test-arrived-to-entry.js` lo fija.

---

**El texto original de la idea, para referencia:**

**IDEA DE JOSE (v11.29) — de "Mark arrived" a Entry sin volver a escribir nada.**
Al guardar un material como *arrived*, la app debe preguntar si se quiere crear
el **Entry** de ese material. Al aceptar se abre la ventana de movimiento **sólo
en Entry** (no las seis opciones), con los datos del Incoming ya puestos en los
campos que corresponden: categoría, nombre, cantidad, unidad, proveedor, PO,
proyecto. El usuario revisa, corrige lo que haga falta y guarda. Entry creado
sin volver a teclear lo que la app ya sabía.

Si el cliente no quiere hacerlo en ese momento, se crea una **tarjeta del tamaño
de las del sistema** (las grandes) que diga:
`'XXX' MATERIAL ARRIVED 'DATE' — MAKE THE ENTRY / LATER`

**Decisión de diseño pendiente:** ¿la pregunta va como popup aparte o como una
opción dentro de la misma ventana del Incoming? Hay que elegir cuál se ve más
profesional. Recomendación a discutir: dentro de la misma ventana — un popup
encima de otro popup es justo el apilamiento que acaba de costarnos la v11.29.

**Ojo con el orden:** esta tarjeta va al mismo `cornerDeck` que las del sistema,
así que conviene resolver primero el hallazgo del respaldo de arriba — si el
deck está vacío por una razón que no entendemos, meterle un tipo de tarjeta
nuevo encima sólo enturbia el diagnóstico.

---

**AUDITORÍA v11.26 — lo que queda.** El informe completo está publicado en
https://claude.ai/code/artifact/1f253dd3-1dc7-4e3a-97e5-2468daa4b9bd
(11 hallazgos + Prioridad 1, en dos registros: "en una frase" y "detalle
técnico"). La v11.27 cerró la Prioridad 1 y los hallazgos 1, 3 y 7; la v11.28
cerró los hallazgos 2, 6, 10 y 11 y puso los changelogs al día. Lo que sigue,
en el mismo orden del informe:

- ~~**A. Hallazgo 2 — los costos viajan a todos los roles.**~~ ✅ **Hecho
  (v11.28).** Se filtran en el servidor, en las DOS puertas (`getInitialData` y
  `loadOlderHistory`). `canSeeCosts_()` en el servidor y `_canSeeCosts()` en el
  navegador se comparan rol por rol en `tools/test-cost-privacy.js`, porque si
  se separan el fallo es silencioso en la dirección peor. **De paso**:
  `loadConfig()` devolvía la lista vieja de correos de compañeros con su rol, y
  `adminEmail`, a todos los roles en cada carga — sin que ninguna pantalla la
  leyera. Ahora solo va para ADMIN.
- ~~**D. Hallazgos 6, 10 y 11 — texto sin escapar.**~~ ✅ **Hecho (v11.28).**
  `catBadge()` escapa la categoría: una corrección, **siete** pantallas (la
  auditoría dijo ocho, había contado la definición). Más `file.name`,
  `item.unit` y —encontrado al hacerlo— `item.estDate`.
  `tools/test-html-escaping.js`.
- **B. Hallazgo 5 — `addReservation_` sin candado.** Lee y escribe sin
  `withStockLock_`, los ids `RES-` se generan por segundo (dos reservas en el
  mismo segundo comparten id), y `cancelReservation_` sale al primer match. El
  resultado posible es una reserva que no se puede cancelar reteniendo stock
  para siempre. **Necesita la prueba de concurrencia en vivo** con 3–4 cuentas
  antes de darlo por confirmado — desde el código solo no se puede probar.
- **C. Hallazgo 8 — `test-concurrency.js` no ve la hoja RESERVATIONS.** Su
  detector `mutatesStock` solo reconoce handles atados a ARCHIVE / LIVE / SITE
  / WASTE, así que la prueba que debía atrapar B está ciega justo ahí. Va con
  B, no antes: arreglar el detector sin arreglar B solo hace que la suite falle.
- **E. Hallazgo 4 — el stock negativo se aplasta a 0** en los cuatro lectores,
  y los `_errors` se tiran a `Logger.log`. El síntoma que avisaría del problema
  es exactamente lo que se borra. Decidir con Jose qué debe VER la gente: un
  negativo es siempre un dato que falta, no un stock real.
- **F. Hallazgo 9 — `getSetupState` expone `ownerEmail`.** **Degradado a
  decisión documentada, no defecto** (v11.27): antes de terminar el setup no
  hay lista de usuarios contra la cual autenticar, y la pantalla existe para
  decirle a un compañero a quién pedirle que termine. Está escrito con ese
  razonamiento en la lista blanca de `tools/test-endpoint-auth.js`. Si Jose
  prefiere ocultarlo igual, es una línea — pero rompe ese mensaje.
- **G. Confirmar que `migrateToV3_Corrected.gs` NO está en el proyecto
  desplegado.** Lleva su propia advertencia y una URL real de hoja de cálculo
  dentro. Es tarea de Jose, en su panel.
- ~~**H. Changelogs.**~~ ✅ **Hecho (v11.28).** Publicadas v11.23 → v11.28 en
  inglés y español, a la par. `check-changelog.js` dice "current" en los dos.

0. ~~**Quitar el `1` prellenado de Quantity en Incoming**~~ ✅ **Hecho
   (v11.24).** La caja abre vacía, como las cinco ventanas de movimientos desde
   la v11.7. **La decisión que faltaba —si una entrega sin cantidad se permite—
   es que SÍ:** una entrega registrada desde una hoja de carga adjunta muchas
   veces no tiene número hasta que llega el camión, y ese es justo el flujo que
   la app ofrece ("adjunta el PDF en vez de escribir cada material"). Se guarda
   como 0, y **0 nunca se imprime como número**: los cuatro lugares que decían
   "0 UNIT" dicen ahora "qty not stated", y la columna que muestra solo la cifra
   muestra "—". Un 0 es una cifra alrededor de la cual la gente planifica.

1. ~~**Clean master template Sheet**~~ ✅ **Hecho — Jose (v11.23):** "la
   plantilla ya está lista y la actualizo con cada nuevo código que me das."
   Queda por confirmar una sola cosa cuando tenga tiempo: **copiarla él mismo
   una vez** para ver lo que ve un cliente en su primer minuto. Es la única
   parte que no se puede verificar desde adentro. Ver docs/MASTER-TEMPLATE.md.
2. **Polish the wizard's Copy button animation** — the checkmark transition works
   now, but the in/out timing still feels abrupt. Jose (v9.89): leave it for
   later, not urgent.

2b. **Splash screen phrase rotation — explicitly for the NEXT version (Jose,
    v9.90), not this one.** Two changes to the rotating phrases under the
    logo on the loading screen: (1) add half a second to how long each
    phrase stays up before rotating to the next; (2) change the transition
    itself — not a plain fade, the current phrase should slide up and fade
    out while the next one slides up into place from below, instead of
    just disappearing/appearing in place. tools/test-splash-notes.js covers
    the rotation today and will need updating for both once this is picked
    up.
2c. **Botón de correo en la alerta de stock bajo** — idea de Jose (v10.6).
    En la barra de alertas del dashboard (`⚠ Below Minimum (N)` / `Zero
    Stock`), un botón que mande un correo ya redactado con **la lista de
    materiales por debajo del mínimo o en cero**: nombre, categoría, cuánto
    queda, cuál es el mínimo y —si está en Incoming— cuánto viene y para
    cuándo.

    El caso de uso es diario: el jefe de bodega ve la alerta y tiene que
    avisarle a compras o al PM. Hoy eso es mirar la pantalla y escribir el
    correo a mano, que es donde se pierde o se escribe mal.

    Los datos ya están calculados en `renderStats` (`belowMin`, `zeroItems`),
    así que el trabajo real es el formato del mensaje y dos decisiones que hay
    que hablar antes de construir:
    - **¿A quién va?** Un destinatario fijo en Settings, el Directory, o
      elegirlo en el momento.
    - **¿Lo envía la app o el usuario?** `MailApp` (como ya hacen los avisos de
      movimientos) deja registro y no depende del correo del empleado;
      `mailto:` abre su cliente con todo prellenado y le deja revisar y editar
      antes de mandar. No es lo mismo y conviene decidirlo, no elegirlo por
      descuido.

2d. **Grupos en Directory, como en Locations** — idea de Jose (v10.9).
    Hoy el Directory es una lista plana de nombres y correos. Jose quiere lo
    mismo que se hizo con las ubicaciones: **crear grupos y arrastrar los
    contactos a cada uno** (Compras, PMs, Choferes, Proveedores…).

    El para qué no es organizar la libreta — es el paso siguiente: **al
    guardar un movimiento, elegir destinatarios POR GRUPO** en vez de tildar
    seis nombres uno por uno. "Avísale a Compras" es una acción; "avísale a
    Kim, Madeline, Joe, Joe, Adam y Terry" es una lista que alguien va a
    teclear mal.

    Lo bueno: la mitad ya existe. `_renderLocationsTab` tiene el arrastrar,
    los grupos, el orden guardado y el archivar-en-vez-de-borrar, y ese
    patrón se traslada. Lo que hay que decidir antes de construir:
    - ¿Un contacto puede estar en varios grupos? (Yo diría **sí** — un PM
      también es alguien a quien se le avisa de una salida.)
    - ¿El grupo se guarda como una columna más en el Directory, igual que
      `locationTypes` en CONFIG?
    - Al elegir un grupo en el correo de notificación, ¿se congela la lista de
      correos en ese momento o se resuelve el grupo cada vez? (Yo: **resolver
      cada vez**, para que agregar a alguien a Compras lo incluya sin tocar
      nada más.)

2e. **Costo por caja / por pallet — que la app haga la cuenta** — idea de Jose
    (v10.9). Hoy el campo dice `Unit Cost` y espera el costo de UNA unidad de
    stock. El problema real: **el cliente casi nunca sabe ese número.** Sabe
    lo que le facturaron — $120 la caja, $600 el pallet — y la división la
    hace de cabeza, mal, o no la hace.

    Diseño propuesto, en dos piezas separadas a propósito:

    **(a) La etiqueta sigue a la unidad.** Si la unidad es Box, el campo dice
    `Cost per Box`, no `Unit Cost`. Cero matemática nueva, y quita la
    ambigüedad de raíz: hoy nadie sabe si "unit cost" significa la unidad de
    stock o la unidad de compra.

    **(b) Una calculadora opcional al lado.** Un enlace del tipo *"solo sé el
    precio por caja/pallet"* que pide dos números —precio del paquete, y
    cuántas unidades de stock trae— y **llena el campo de costo con el
    resultado, mostrando la cuenta**. `$120 ÷ 24 = $5.00 por unidad`.

    **La regla que no se negocia:** lo que se GUARDA sigue siendo el costo por
    unidad de stock. Todo el motor de costos —promedio ponderado, costo por
    proyecto, costo del desperdicio— depende de eso. La calculadora es una
    calculadora, no un modelo de datos nuevo. Así el riesgo es casi cero.

    **→ ESTO CRECIÓ. Ver `docs/UNIDADES-Y-CONVERSIONES.md`.**

    Las respuestas de Jose (v11.0) convirtieron una calculadora en la función
    más grande del backlog, y el diseño se movió a su propio documento. Lo
    esencial:

    - **La conversión SÍ se recuerda por material** — pero no porque la app la
      suponga: *"el usuario la escribe una vez y se autocompleta siempre, con
      la opción de cambiarla cuando quiera"*. El sistema no adivina, y tampoco
      hace teclear lo mismo veinte veces.
    - **Sí se guarda lo que pagó por el paquete.**
    - **Sí se agregan PALLET, CASE y BAG**, y cada plantilla de industria trae
      su propia lista de unidades.
    - **Y el caso que yo había puesto fuera de alcance resultó ser el
      corazón del asunto:** llega un pallet con 30 cajas de sellador, cada
      caja con 12 tubos, y una persona saca 3 cajas mientras otra saca 5
      tubos. Una panadería recibe sacos de 50 kg y usa 15 kg al día. Eso no es
      un caso raro: es cómo funcionan las bodegas.

    El diseño se parte en dos fases —paquetes y costo primero (riesgo bajo),
    sacar en cualquier unidad después (riesgo alto)— y quedan cuatro
    decisiones abiertas. Todo en el documento.

2f. ~~**La esquina de la marca**~~ ✅ HECHO (v11.2). Lo pedido y lo entregado:

    - **La insignia "Acopio" se sale de la franja azul** y toca el borde
      blanco. Tiene que quedar **dentro**, sin rozar el filo. Si hay que
      achicarla, se achica.
    - **El logo de la empresa está pegado a la barra del navegador.** Necesita
      aire arriba. Hoy se ve improvisado y debería verse profesional.
    - **El logo hay que tratarlo según su forma.** Un logo cuadrado, uno
      horizontal y uno vertical no se pueden meter en la misma caja: el que se
      escale por ancho aplasta a los otros dos. Hay que medir la proporción al
      cargarlo y encajarlo con la regla que le toque.
    - **Una tipografía distinta para el nombre de la empresa**, para que se
      note que es el nombre del cliente y no una etiqueta más de la interfaz.
      Nada llamativo — que se note diferente y se vea serio.

2h. **Enlaces a los Términos y a la Privacidad en la hoja de bienvenida** —
    pedido de Jose (v11.3). Hoy la casilla dice *"I accept the Terms of Service
    and Privacy Policy"* y **no hay forma de leerlos antes de aceptar**. Pedir
    consentimiento sobre un texto que no se puede abrir no es aceptable en la
    única pantalla del producto cuyo trabajo es registrar un acuerdo.

    **El problema no es poner el hipervínculo, es a dónde apunta.** Antes de la
    instalación el cliente no tiene la app desplegada, así que el enlace a
    Settings → Legal no le sirve. Y acopio.net todavía no existe: **inventar
    una URL ya me costó una vez y no se repite**. Dos opciones reales:

    - **(a) El texto viaja en el archivo.** Una pestaña más en la plantilla
      (`📄 TERMS & PRIVACY`) con los dos documentos, y los dos nombres de C14
      enlazados a ella con un `#gid`. **Es la única que es cierta antes de que
      exista el dominio**, funciona sin conexión a nada nuestro, y encaja con
      la promesa del producto: todo vive en su archivo. El costo: una TERCERA
      copia del texto legal, que habría que sumar a `tools/test-legal-sync.js`
      para que no derive de las otras dos.
    - **(b) Esperar a acopio.net** y enlazar a las páginas públicas. Más
      limpio, sin copias, y **bloqueado** hasta que exista el dominio.

    Mi recomendación: **(a)**, porque el bloqueo de (b) no tiene fecha y esto
    es consentimiento. Falta el visto bueno de Jose por la copia extra.

2i. **Los Incoming SIN FECHA deben salir TODOS los días** — pedido de Jose
    (v11.5), y subrayado: *"todos los días todos los días"*.

    Hoy el aviso de la mañana muestra lo que llega **hoy**. Un pedido sin fecha
    no llega ningún día en particular, así que **no aparece nunca** — y es
    justamente el que más fácil se olvida, porque no hay nada en el calendario
    que lo recuerde. El sistema ya distingue cuatro clases de fecha (exacta,
    ventana, aproximada, desconocida) precisamente porque forzar una fecha
    inventada es peor que no tener fecha; lo que falta es que `unknown` tenga
    su propio lugar en la pantalla de la mañana.

    Es chico y de valor diario. Regla: mientras un Incoming siga sin fecha y
    sin recibirse, sale en el aviso de la mañana **cada día**, en su propio
    grupo ("No date — chase these") y no mezclado con los de hoy.

2g. **"Report a problem" tarda 4–5 segundos en dejar escribir** — reportado por
    Jose (v11.1). **Causa NO encontrada todavía.** Lo que sí se hizo y lo que
    se descartó, para que la próxima vuelta empiece con evidencia:

    - **Medido en aislamiento: 17 ms** desde el clic hasta que el textarea es
      interactivo. La ventana en sí no carga nada, y no hace ninguna llamada
      al servidor al abrirse. El problema no está en el código del modal.
    - **Hipótesis probada y DESCARTADA:** que `html.modal-open{overflow:hidden}`
      quitara la barra de scroll y forzara un reflow de la página entera con
      sus 579 filas. Medido en una página de 600 filas: **0.4 ms**, y con
      `scrollbar-gutter:stable` 0.3 ms. No es eso. (Vale anotarlo: iba a
      "arreglarlo" y habría sido un cambio inútil sobre una causa inventada.)
    - **Hecho en v11.1:** el cursor entra solo en el campo de texto al abrir.
      Es una mejora por sí sola, y además sirve de sonda — si con eso todavía
      hay que esperar, entonces el hilo principal está ocupado y no es un
      problema de foco.

    **Lo que falta es una medición en la instalación real de Jose**, porque el
    entorno de producción tiene lo que la prueba no: el iframe de Apps Script,
    3.300 movimientos y dos gráficos de Google. Receta, 30 segundos: F12 →
    pestaña **Performance** → grabar → clic en "Report a problem" → parar. La
    barra larga del flame chart trae el nombre de la función que bloquea.

3. **Polish the company logo placement** in the topbar — it renders, but the
   sizing/position isn't what Jose wants yet. Jose says it is fine for now —
   waiting on him to say what he actually wants there.

4. **Group the Incoming list by kind of date as well as by state.** v9.55
   grouped it by what you need to do (Overdue / Expected / No date / Arrived /
   Cancelled). Jose also wants the option of grouping by how the date is known
   — exact, a window, approximate, unknown — which is a different question:
   the first asks "what do I chase today", the second asks "how solid is my
   plan". Same mechanism, so it is a small piece of work; worth doing once the
   flexible dates have been used for a while and it is clear which grouping
   people actually reach for. Jose (v9.89): maybe version 2, not this one.

4b. **Incoming — this week's orders on the visible calendar, editable from
    there (v9.90).** Right now the calendar just shows dots/markers; Jose
    wants the week's actual orders to appear ON it, and be editable,
    modifiable, and markable as received directly from that view instead of
    only from the list.

4c. **Incoming — receive a material and create the ENTRY from that same
    window, in one motion (v9.90). Needs real discussion before building.**
    Jose's own flag: OX Glass itself is an example of a business that often
    doesn't know exactly WHAT is arriving or WHEN — so an Entry built
    straight from an Incoming record risks getting made with wrong or
    incomplete information (category, quantity, unit cost) if the order
    itself was vague. Questions to settle first: does this only activate
    for orders with solid data already, and fall back to the normal
    open-ended Entry form otherwise? Does receiving partially (less than
    ordered) need its own path? Is the Incoming record's data ever
    authoritative over what's actually counted in at the dock, or always
    just a starting point the person receiving can freely change?


5. **Iconos profesionales y logo de Acopio — EN PAUSA, a la espera de Jose.**
   El ZIP de Streamline ya está (45 iconos, PNG 48×48 + 4 SVG) y las tres
   propuestas de marca están dibujadas. Jose decide cuándo se hace y cuál se
   usa; las dos van en la misma pasada porque comparten el mismo trabajo.

6. **Copiar un sistema VIVO arrastra la lista de usuarios — Jose (v9.90) no
   cree que haga falta resolver esto; en discusión.** Su argumento: los
   clientes van a descargar la plantilla limpia y usarla, no van a copiar el
   código de un cliente existente para usarlo por su cuenta — y si alguien
   lo hace de todos modos, eso es un problema legal de ellos, no nuestro.
   Mi lectura, para que decidamos con el caso real en mente en vez del
   caso que suena a robo: el escenario que originó este punto NO fue nadie
   copiando el sistema de un tercero — fue Jose copiando SU PROPIO archivo
   ya en uso (a su Drive personal), algo que cualquier dueño de un Sheet
   puede hacer con "Hacer una copia" de Google en dos clics, sin pasar por
   nosotros ni por el wizard. Un cliente real puede hacer exactamente lo
   mismo por razones legítimas — abrir una segunda bodega, sacar un
   respaldo antes de un cambio grande, armar una copia de prueba — y esa
   copia hereda TODOS los usuarios y roles del archivo original. El riesgo
   no es robo de propiedad intelectual; es que un empleado que ya no
   debería tener acceso (o que nunca debió tenerlo en esa bodega nueva)
   termine con acceso real a datos que no le corresponden, sin que nadie lo
   note. Es un riesgo real pero pequeño y poco frecuente. Recomendación: no
   vale la pena construir UI para esto ahora — una línea en la guía de
   configuración ("si copias tu propio archivo, revisa la lista de
   usuarios") cubre el caso a costo cero. Se puede revisar si empieza a
   pasar de verdad con clientes reales.

7. **Tracking de dispositivo/ubicación en movimientos y errores — alcance
   decidido (v9.90).** No es ubicación geográfica — es saber DE QUÉ
   DISPOSITIVO y CON QUÉ CUENTA ocurrió un error o un problema, para poder
   dar soporte. Jose confirmó el caso de uso exacto: poder decirle a un
   cliente "el dispositivo #### con la cuenta de JOSE CASTRO causó este
   error varias veces, en estas ocasiones" — para que el cliente decida qué
   hacer. La cuenta ya se guarda hoy (`userEmail` en ARCHIVE y en
   ERROR_LOG); falta el dispositivo/navegador, capturable vía
   `navigator.userAgent` en JS sin pedir permiso (nada que ver con
   geolocalización real). Acotado a `ERROR_LOG` — no a cada movimiento
   normal, que no necesita este dato y solo agranda ARCHIVE sin beneficio.
   Sin construir todavía.

8. **Notificaciones en vivo para el admin — Jose confirmó (v9.90): son
   AMBAS ideas, no una sola.**
   - **Idea A — tarjeta al momento.** "Jose movió 4 WINDOW de GLASS a B2B"
     aparece del lado izquierdo si el admin está en Dashboard o Warehouse
     Map (no hace falta si ya está viendo Movements); clic en la
     notificación lleva a esa fila en Movements & History y la resalta —
     mismo mecanismo que `_showMovementRows`/`.row-spotlight` que ya usan
     las tarjetas de "el sistema hizo esto solo" en Settings → System, así
     que la parte de "llevar y resaltar" ya existe y solo hay que
     reutilizarla. Preguntas reales antes de construir: ¿en tiempo real de
     verdad (empuje desde el servidor) o solo cuando el navegador ya está
     haciendo un refresh de todos modos (mismo patrón que
     `_refreshOpenRackDrawer`, v9.83 — sin trigger nuevo, sin polling
     nuevo)? Apps Script no tiene push real hacia el navegador sin algo
     como Firebase detrás, así que la opción honesta y gratis es la
     segunda: la próxima vez que `_applyData` corra con movimientos nuevos
     desde la última carga, comparar y armar las tarjetas de ahí. ¿Solo
     para movimientos de WAREHOUSE, o de cualquiera que no sea el propio
     admin? ¿Se pueden descartar como las tarjetas de "el sistema hizo esto
     solo"?
   - **Idea B — resumen de fin de día.** Cuando alguien de Warehouse deja
     un Entry o movimiento sin supplier/proyecto/etc., aparece la tarjeta
     de la idea A al lado. Si esa persona NO la corrige (o le pone "Not
     now"), al final del día se le avisa al admin con TODO lo que quedó
     sin corregir esa jornada, en un solo resumen. Jose no está seguro de
     si originalmente esto se había decidido como correo o como
     notificación dentro de la app — **falta confirmar el canal** antes de
     diseñar. Se parece en mecánica a "Sugerencias proactivas de calidad de
     datos" (más abajo, la deck de sugerencias ya construida) pero con un
     timing distinto (fin de día, no al momento) y un destinatario distinto
     (el admin sobre el trabajo de otros, no la persona que hizo el
     movimiento). Sin diseñar todavía — ni el canal, ni el disparador exacto
     de "fin de día" (¿hora fija? ¿cierre de turno?), ni si se agrupa por
     persona o por tipo de dato faltante.

9. **Menú de hamburguesa en pantallas pequeñas.** Idea de Jose (v9.88): en vez
   de las pestañas de navegación normales, un ícono de hamburguesa en móvil que
   abre el menú; una vez elegida una pestaña, se muestra la hamburguesa junto
   al nombre de la pestaña activa en vez de la fila completa de pestañas.
   Explícitamente para una versión futura, no esta — sin diseñar todavía.

10. **Nombre "Acopio" con hipervínculo (v9.89, pedido nuevo de Jose).** Debe
    apuntar a la página de Acopio, y al hacer clic mostrar una confirmación
    ("estás saliendo de Acopio, ¿deseas continuar?") antes de navegar.
    Bloqueado en un solo dato: **falta la URL real de destino** — nunca se
    debe inventar una URL, así que esto espera a que Jose la mande.

## Open decision — access when the customer has no Workspace domain

The identification rule, verified in `getUserRole()`:

1. `Session.getActiveUser().getEmail()` returns an email ONLY when the visitor
   is in the same Google Workspace domain as the **owner of the copy** (or is
   the owner). Personal Gmail visitors get an empty string.
2. Otherwise the email has to come from a signed session token, issued by the
   "Sign in with Google" flow — which needs an OAuth client and its redirect URI
   registered by hand in Cloud Console.

`COMPANY_DOMAIN` plays no part in this. It is only used for wording on the
sign-in screen. Recognition comes from the real Workspace relationship between
visitor and owner, not from that property.

**So a company with no domain, where several people use personal Gmail, needs
the OAuth path for everyone except the person who made the copy.** That is the
scenario to solve, and there are three candidates:

1. **Register each customer's /exec URL on Jose's OAuth client.** Works today,
   ~5 minutes per customer, done once. Priced as a setup step.
2. **Broker redirect** — one fixed URL Jose owns that forwards back via the
   `state` parameter. One registration ever. Costs a permanent dependency on
   that broker and strict `state` validation.
3. **Deploy with `executeAs: USER_ACCESSING` instead of `USER_DEPLOYING`.**
   Then `getActiveUser()` returns everyone's real email with no OAuth client at
   all. NOT free: the script would run with each user's own permissions, so the
   owner has to share the spreadsheet and the Drive folders with them, every
   user sees the "unverified app" screen, and the whole "the server holds the
   owner's access, not yours" design changes. **Worth actually testing on a
   throwaway copy before deciding** — it is the only option that removes the
   manual step entirely, and its cost has not been measured.

Also worth writing into the setup guide either way: **if the company has a
Workspace domain, the copy must be made by a company account.** If someone
copies it with a personal Gmail, nobody in the domain is recognised
automatically any more — including the people who do have company accounts.

## Operación del negocio — riesgos anotados

**El cliente OAuth es un punto único de falla.** El ID y el secreto son de
Jose y quedan guardados en las Script Properties de CADA copia vendida.

- **Si se rompe algo con el acceso externo, revisar esto PRIMERO.** Es la pieza
  compartida entre todos los clientes: si falla, falla para todos a la vez, y
  eso se distingue de un problema de un solo cliente en treinta segundos.
- Un admin del cliente puede leer el secreto en sus propiedades. El daño posible
  es bajo (los permisos son solo nombre y correo) pero es real.
- **Si el proyecto de Cloud se pierde o se borra, las credenciales NO se
  recuperan.** Un cliente nuevo tiene un ID y un secreto nuevos, y hay que
  actualizarlos en la copia de cada cliente uno por uno, además de volver a
  registrar todas las URLs. Guardar el ID y el secreto fuera de Google, y no
  borrar ese proyecto nunca.

**Actualizaciones — decidido:** los bugs son prioridad y se empujan a todos los
clientes; las mejoras grandes se agrupan y se sueltan por tandas. La
actualización se cobra como parte del soporte mensual (opción 2 de las tres que
se discutieron). El Marketplace queda como la inversión que resolvería esto de
raíz, para cuando haya volumen que lo justifique.

## Resuelta en v11.11 — el factor que se escribe y no se guarda

Jose: *"debemos definir qué pasa si el cliente no da clic en 'ADD' el número de
unidades por box"*, y propuso una tarjeta recordatoria.

Se hizo algo más simple que resuelve el problema en vez de recordarlo: **salir
del campo guarda un factor NUEVO**. Escribir 12 en una casilla que pregunta
"how many units?" ES la respuesta; pedir además un clic solo creaba una forma
de contestar y ser ignorado. La línea cambia enseguida a "12 units per box
[edit]", así que se ve que quedó.

**Cambiar** un factor que ya existe queda excluido a propósito: eso altera
costos que ya se están calculando, así que conserva la advertencia de dos
pulsaciones y nunca se guarda por irse del campo.

Si aun así Jose quiere la tarjeta, el mecanismo (`_typedCfgAdds` /
`_recomputeCfgDeck`) ya existe y es media hora — pero con esto ya no hay nada
que recordar.

## Resueltas en v11.10 — y lo que Jose decidió

- **Nombre del grupo de documentos:** "Invoice" → **"Document"**. Jose: el grupo
  guarda lo que sea que se adjunte, y bautizarlo con el nombre de un solo tipo
  de papel hace que los demás parezcan fuera de lugar.

- **Costo de 0 — cómo se maneja.** Jose: *"hay cosas que no sabemos cuánto
  cuestan (la mayoría de las cosas en OX), así que no le vamos a poner costos
  si no sabemos el valor real"*. O sea: el caso común no es un 0, es **dejarlo
  en blanco**, y eso ya funcionaba bien (no se registra costo, el promedio no
  se toca, el reporte lo muestra sin precio en vez de gratis).
  Lo que se agregó es que un **0 escrito** deje de ser silencioso: avisa que se
  va a registrar como GRATIS y que arrastra el promedio hacia abajo, y señala
  la casilla vacía como la forma de decir "no lo sabemos". No se bloquea: una
  muestra gratis es algo real que registrar.
  **Sigue abierto, chico:** `packMath_` (precio del paquete) toma la decisión
  contraria — 0 no da costo. Las dos mitades aún no coinciden, pero ahora la
  que puede hacer daño avisa.

## ✅ HECHO (v11.19) — política de soporte y de devoluciones

Escrita donde obliga: **secciones 5 y 9 de los Términos**, que es lo que el
cliente acepta. `docs/SOPORTE-Y-DEVOLUCIONES.md` es la versión de trabajo para
Jose, con los casos que van a aparecer y qué contestar.

Decisiones de Jose: la instalación **no se devuelve una vez hecha** (sí antes
de hacerla); el mensual **sí se devuelve**, según caso y fecha.

Propuesta mía, convertida en números aplicables porque "depende" no se puede
poner en un contrato: 14 días para el mensual, meses enteros no usados en el
anual, y devolución del período si un defecto nuestro no se arregla en 30 días.

**Tiempo de respuesta: un día hábil**, y Jose había propuesto 2–3 horas. Le
dije que no por tres razones, y la tercera es la que decide: el complemento de
soporte prioritario ya vende **4 horas hábiles** por +$20/mes. Un soporte base
de 2 horas deja ese complemento sin nada que vender.

**Falta todavía:** el proceso de facturación (con qué se cobra, qué pasa si un
pago falla), mencionar soporte y devoluciones en `WELCOME-EMAIL.md`, y decidir
si un cliente fundador que cancela recupera su precio al volver (yo diría que
no).

## ✅ HECHO (v11.21) — los dos defectos de Incoming que Jose fotografió

**El Status se tiraba a la basura al crear.** `addIncoming` escribía
`'Pending'` fijo y nunca leía `data.status`, mientras que `updateIncoming` sí
lo respetaba. Una entrega registrada como Arrived —o anulada en el momento—
se guardaba Pending y había que editarla otra vez. Las dos mitades pasan ahora
por `incomingStatus_`, que es lo que impide que vuelvan a separarse.

**Borrar no decía nada y no se bloqueaba.** La ventana se queda abierta hasta
que el servidor contesta, así que el botón seguía bajo el dedo y sin ningún
cambio en pantalla. El segundo clic llegaba a una fila ya borrada:
`Incoming item not found`, en rojo, por un borrado que había funcionado.
Ahora el botón se deshabilita con spinner, el segundo clic no sale del
navegador, "no encontrado" termina en verde, y un error de verdad sigue
dejando la ventana abierta para reintentar.

`tools/test-incoming.js` y `tools/test-incoming-delete.js`.

**Visto de paso, no tocado:** la caja Quantity de Incoming abre con un `1`
escrito (`<input id="incQty" … value="1">`). Es exactamente lo que Jose mandó
quitar de las ventanas de movimientos en v11.7 ("al abrir la ventana no debe
haber ningún dato escrito, ni siquiera '0' en qty"). No lo cambié porque no lo
pidió para esta ventana y un cambio no pedido en un formulario es cómo se
rompe algo que funcionaba; dice él y se quita en dos líneas.

## ✅ HECHO (v11.22) — los documentos publicados, al día

Jose decidió: **el changelog se mantiene.** Así que se puso al día y se
republicó todo.

- **Acopio en Detalle** — precios corregidos ($500 + $49/mes, y el anual de
  $490). De paso: decía "cinco tipos de movimiento" cuando ya son seis, y el
  hueco de "conteo cíclico" decía "diseñado, sin construir" cuando ya existe la
  mitad que corrige. Un documento cuya promesa es "esto está construido y en
  producción" no puede republicarse con datos viejos.
- **Acopio Changelog** y **Novedades de Acopio** — de v10.6 a v11.22, en los
  dos idiomas. **No una entrada por versión**: doce entradas agrupadas por lo
  que un cliente nota. Incluye el error de la etiqueta de costo por caja
  (v11.5–v11.8) con la recomendación de revisar el costo de cualquier material
  que se haya precificado por caja en ese rango — un changelog que solo cuenta
  las cosas buenas no lo lee nadie dos veces.

**Y para que no se vuelva a atrasar: `tools/check-changelog.js`.** Falla el
release si el changelog público va más de 5 versiones detrás de `APP_VERSION`,
o si los dos idiomas no están parejos. No exige una entrada por versión —
la mayoría no la merece— pero sí que el hueco se quede chico. La página estuvo
15 versiones atrás sin que nada avisara; se encontró porque Jose la abrió.

## Documentos publicados — qué es cada uno y cuál está desactualizado (v11.21)

Jose preguntó por la lista de artifacts. Auditada contra las fuentes del repo:

| Publicado | Fuente en el repo | Estado |
|---|---|---|
| **Acopio** (×2, 22 ago) | `landing/index.html`, `landing/es.html` | Precios al día ($500 / $49 / $490). Se van a rehacer igual con el botón ES/EN |
| **Acopio en Detalle** (24 ago) | `landing/acopio-overview.html` | **Desactualizado: dice $400 y $39/mes.** El archivo del repo también — la fuente nunca se actualizó cuando subimos el precio |
| **Acopio Changelog** (23 ago) | `landing/changelog.html` | Se detiene en **v10.6**. Faltan ~15 versiones |
| **Novedades de Acopio** (23 ago) | `landing/novedades.html` | Igual: se detiene en v10.6 |
| **Acopio Marks** (17 ago) | — (sin fuente en el repo) | Documento de trabajo (las marcas/logos que se compararon), no es para clientes |

**Por qué pasó:** los artifacts son copias publicadas, no ventanas al repo. Se
actualizan cuando alguien los vuelve a publicar, y nada avisa cuando el
contenido que reflejan cambió. El precio subió en `landing/*.html` pero
`acopio-overview.html` quedó fuera de ese cambio, y el changelog dejó de
alimentarse en v10.6.

**Qué falta decidir (de Jose):** el changelog público, ¿se mantiene? Ponerlo al
día son ~15 versiones de trabajo y después hay que alimentarlo en cada
release. Si no se va a alimentar, es mejor despublicarlo que dejarlo mintiendo.
El precio de "Acopio en Detalle" hay que arreglarlo pase lo que pase.

## ✅ HECHO (v11.22) — el botón "Adjust"

Jose: "DEBEMOS PONER EL BOTÓN DE ADJUST… NO RECUERDO QUÉ EXACTAMENTE HARÁ
DIFERENTE A WASTE". Propuesto en v11.21, aprobado ("ASI ESTA BIEN"), construido
en v11.22.

**La línea, que es lo único que importa de este tipo de movimiento:**

- **WASTE = material que existió y se perdió.** Tiene costo, se le carga al
  proyecto, y "cuánto desperdiciamos" es una pregunta real sobre él.
- **ADJUST = el conteo no cuadra.** El sistema dice 40, el rack tiene 38. Eso
  **no** significa que se rompieron dos: significa que **el registro está mal**.
  Costo cero, sin proyecto, motivo obligatorio, y **puede subir el stock**,
  cosa que Waste nunca hace.

Si un error de conteo se registra como Waste, la cifra de desperdicio de la
empresa pasa a ser "desperdicio + errores de anotación", y son dos problemas
distintos con dos soluciones distintas.

**Cómo se pide:** no se escribe la diferencia, se escribe **lo que contaste**.
La app ya sabe lo que ella creía y saca la resta. Quien está parado frente al
rack tiene "38" en la cabeza, no "menos 2", y pedir la resta es pedir una
operación que se puede invertir sin darse cuenta.

**Dónde vive la dirección:** en **cuál de las dos columnas de rack** se llena
— Source si el conteo salió corto, Destination si salió largo. Es la misma
gramática que ya usan los otros tipos (ENTRY escribe DEST, EXIT y WASTE
escriben SRC, TRANSFER escribe las dos). La alternativa era una cantidad
negativa, y habría metido un número negativo en cada suma, badge, gráfico y
exportación de la app.

**El riesgo real de este cambio no era la feature, era el ACUERDO:** hay
**cuatro** funciones que convierten movimientos en stock. Si una no conoce
ADJUST, sus números se separan de las otras tres y el síntoma aparece semanas
después como un rack que lee mal sin apuntar a nada. `tools/test-adjust.js`
vigila que las cuatro sepan, y que las cuatro manejen **las dos direcciones**.

`tools/test-adjust.js` y `tools/test-adjust-form.js`.

## ✅ HECHO (v11.25) — las entregas esperadas, cuatro cosas que Jose fotografió

**1. La categoría desaparecía al abrir una entrega.** Abrió una entrega de IGU
desde el aviso de la mañana y la casilla Category estaba VACÍA, en un registro
cuya etiqueta decía IGU una línea más arriba.

La causa raíz no estaba en la ventana: **renombrar una categoría reescribía el
archivo y dejaba `INCOMING_V3` intacto.** Jose había renombrado la categoría a
"IGU (ISOLATED GLASS UNIT)"; la fila de la entrega seguía diciendo "IGU",
ninguna opción del desplegable decía "IGU", y **un `<select>` al que se le da un
valor que no tiene no selecciona nada, en silencio** — y Guardar habría escrito
esa nada de vuelta. Ahora el renombrado alcanza también las entregas
(`renameIncomingCategory_`), y como red de seguridad para todas las otras formas
de perder una categoría (borrada, importada, editada a mano en la hoja) la
ventana compara sin distinguir mayúsculas y, si de verdad no está en la lista,
**la agrega en vez de tirarla**, marcada como "(not on your list)".

**2. El aviso ya no se cierra al marcar el primer material.** Jose: "luego de
seleccionar el primer material y dar clic en recibido, la ventana se cierra y no
hay otra forma de reabrirla más que actualizar la página completa." Es una lista
que se recorre —tres entregas en la mañana son tres viajes— y cerrarla tras la
primera obligaba a recargar la app. La ventana de edición se abre encima, y el
aviso **se redibuja solo** cuando el guardado aterriza.

**3. Y hay forma de volver a abrirlo:** botón **"☀️ This week's schedule"** en
la cabecera de Incoming. Antes solo aparecía una vez por carga de página.

**4. El botón "Mark arrived" está en cada material** de las tarjetas de la
semana, no solo dentro del aviso — el aviso sale una vez al día y las tarjetas
están siempre en pantalla.

**Y la presentación, en el orden que Jose dibujó:** categoría en su propia línea
arriba; luego **cuántos** y **qué** en una línea; luego lo que se anotó; abajo el
estado y la única acción. **Un solo renderizador (`_incItemHtml`) para las
tarjetas y el aviso** — tener dos es como se separaron.

*Decisión que tomé:* la categoría conserva su pastilla de color en vez del texto
plano del boceto, porque ese color es el mismo que la categoría tiene en todas
las demás pantallas y está haciendo trabajo — uno encuentra MIRROR en una
tarjeta por el color antes de leer una palabra.

## ✅ HECHO (v11.26) — el merge que se negaba a sí mismo, y dos ajustes de Jose

**1. "Nothing to merge — that is already the only spelling", sobre dos
ortografías que el barrido acababa de encontrar él mismo.** Jose lo vio en
`SWEETWATER - SPRING CANYON 2 · Sweetwater - SPRING CANYON 2`.

El filtro que quita al superviviente de la lista a fusionar comparaba en
mayúsculas — copiado del merge de Settings, donde tiene sentido (no puedes
fusionar un valor consigo mismo). Aquí borraba **el hallazgo más común que
existe**: las mismas letras con distinta caja. Una diferencia de mayúsculas es
una diferencia real en lo que está guardado, y normalizarla es un merge como
cualquier otro. Ahora solo se descarta una repetición byte por byte.

Y en el camino de ubicaciones, un merge que solo cambia la caja borra también la
fila del superviviente (su versión en mayúsculas está en `wanted`) y la vuelve a
agregar — como `RACK` pelado, sacando la ubicación del grupo en el que alguien
la había archivado. Ahora **recuerda su grupo**.

**2. La presentación, segundo boceto:** el nombre a la izquierda y **la cantidad
enfrente, a la derecha**, con el estado debajo de la cantidad. Dos columnas en
vez de cuatro líneas apiladas, y el punto es el borde derecho: **cada cantidad
debajo de la anterior, cada estado debajo del anterior.** Se ve lo que falta por
recibir sin leer un solo nombre de material.

**3. "This week's arrivals" se movió al menú del avatar**, sin filtro de rol.
Jose: "el botón debería estar en un lugar donde todos tengan acceso sin tener
que ir a la pantalla de incoming." Los botones **"Mark arrived" dentro del aviso
siguen siendo solo de ADMIN**, así que quien es de bodega lee la lista y no la
puede cambiar.

## Comentarios sobre un material, sin editar el movimiento — idea de Jose (v11.23)

Jose, textual: *"sé que tenemos comentarios en cada movimiento pero para añadir
un comentario se debe editar todo el movimiento… solo la persona editando puede
hacerlo. Debemos dejar que cualquier persona en bodega agregue comentarios sin
necesidad de editar el movimiento."*

**El problema es real y es de permisos, no de pantallas.** El campo Comments
vive en la fila del movimiento. Escribir ahí significa `updateMovementRow`, que
pide permiso de edición, exige un motivo del cambio, manda correo al
administrador y queda en la bitácora de auditoría — todo correcto para
*corregir un registro*, y todo desproporcionado para *dejar una nota*. El
resultado es que nadie deja notas.

**Lo que Jose describió, en su orden:**

- En el tablero, al hacer clic en un material (la fila que se expande,
  `toggleStockDetail`), **una sección nueva al lado** que muestra el **último
  comentario**.
- Al hacer clic en esa sección se abre una **ventana emergente** con scroll:
  nombre y correo de quien escribió, el comentario y la fecha.
- **Botón para añadir** en el encabezado de esa ventana.
- **La ventana se cierra al tocar afuera solo si no hay nada escrito.** (Buen
  detalle, y ya hay precedente en la app: `closeMoveModalGuarded`.)

### Lo que hay que decidir antes de construir

- **El hilo es del MATERIAL, no del movimiento.** Eso es lo que dice el diseño
  de Jose: la sección vive donde se hace clic a un material. Es una decisión
  importante y buena, porque significa **no tocar el archivo de movimientos**:
  un almacén nuevo (`COMMENTS_V3`: id, matId, texto, autor, correo, fecha,
  borrado) en vez de escribir en una columna que ya tiene dueño. El campo
  Comments del movimiento se queda como está, para lo que siempre fue: lo que
  se dijo de **ese** movimiento.
- **Quién puede escribir:** cualquiera que pueda registrar movimientos
  (WAREHOUSE y ADMIN). Ese es el punto entero.
- **Quién puede borrar:** el autor y el ADMIN. Nadie edita el comentario de
  otro; un hilo que se puede reescribir no sirve como registro.
- **¿Se editan los propios?** Yo diría que no, o solo por unos minutos. Un
  comentario es lo que alguien dijo ese día.
- **Techo:** el último comentario en la fila, y la ventana con scroll y
  paginado si el hilo es largo — la misma disciplina que el historial.
- **¿Notifica a alguien?** Empezar sin notificación. Añadir correos a algo que
  todavía nadie usa es cómo se construye una función que la gente apaga.

## Lo que está en manos de Jose — estado al v11.23

- ✅ **Plantilla maestra** — lista, y la actualiza con cada versión. Falta solo
  copiarla él una vez para ver lo que ve un cliente.
- ✅ **Con qué se cobra** — **Stripe**, desde el primer cliente. Escrito en los
  Términos §9, en la Privacidad §5 y en `SOPORTE-Y-DEVOLUCIONES.md` §6, con la
  lista de lo que hay que montar en el panel antes del primer cobro.
- 🔄 **Ensayo de restauración** — en curso. Deploy → New deployment, 🩺 Check, y
  la prueba de adjuntos que demuestra que `FOLDER_PREFIX` volvió. Ver
  `RESTAURAR-UN-BACKUP.md`.
- ⏳ **Prueba de concurrencia en vivo** — aplazada: Jose (v11.23) necesita
  encontrar 3 o 4 personas que le ayuden. **No sirve la misma cuenta en varios
  navegadores** — Apps Script serializa por usuario, así que esa prueba pasa
  siempre y no prueba nada. Lo que hay que ver es a cuatro personas distintas
  guardando movimientos del mismo material al mismo tiempo. `test-concurrency.js`
  cubre la lógica; esto cubre la plataforma.
- ⏳ **Pantalla de consentimiento "In production"** en Google Cloud Console.
- ⏳ **A nombre de quién se factura**, e impuesto sobre las ventas en Utah y en
  el estado del cliente.

## ✅ HECHO (v11.24) — la landing en un solo archivo con botón ES/EN

`landing/acopio.html` reemplaza a `landing/index.html` y `landing/es.html`, que
eran **las mismas 582 líneas dos veces**. El inglés vive en el marcado (la
página se lee y se indexa con JavaScript apagado) y el español es un
diccionario de 109 claves al final, enganchado por `data-i18n` en cada elemento
—`data-i18n-attr` para un atributo como un placeholder—.

**Generado una sola vez a partir de los dos archivos, no retecleado.** Los dos
estaban alineados línea por línea, así que la fusión fue mecánica; retipear 100
líneas de texto de venta a mano es exactamente cómo un precio termina bien en
un idioma y mal en el otro — que es lo que ya pasó con "Acopio en Detalle".

**Decisiones:**
- **El botón vive FUERA de `<nav>`.** El nav es `display:none` bajo 640px, y un
  botón de idioma que un teléfono no puede ver no es un botón de idioma. Con
  `min-height:38px`, porque a `.4rem` de padding salía de 28px — un control al
  que se apunta, no uno que se golpea.
- **El idioma inicial:** una elección explícita manda para siempre; si no la
  hay, decide `navigator.language`. Si `localStorage` lanza (ventana privada,
  navegador que bloquea datos de sitio) la página abre en inglés en vez de no
  abrir.
- **Una clave que falte deja el inglés en pie.** Una página a medio traducir es
  fea; una en blanco está rota.
- **El correo que arma el formulario también cambia de idioma.** Quien llena un
  formulario en español no debería mandar un correo en inglés.

`tools/test-landing-i18n.js` — y lo que vigila de verdad no es el botón, es que
**los dos idiomas no se puedan separar**: cada elemento marcado tiene su
cadena, cada cadena sigue enganchada a algo, ir y volver devuelve el inglés
exacto, y **los precios se leen igual en los dos**, porque un número no es una
traducción.

**Pendiente de Jose:** los dos artifacts publicados de la landing (dos
"Acopio") ahora son uno solo. Hay que republicar uno con el archivo nuevo y
retirar el otro — no lo hago yo a ciegas porque publicar sobre el equivocado
dejaría viva la página vieja en español.

## Cómo distinguir dos camiones el mismo día — problema abierto

Jose (v11.11), y es un problema real, no un detalle: si un Incoming es
**una fila por material** y el camión es **un grupo de filas del mismo día**,
entonces dos entregas del MISMO proveedor el MISMO día se mezclan y no hay
forma de saber qué vino en cuál.

Jose ya escribió la respuesta sin darse cuenta: el campo **"What were you
told?"** en el que él pone *"Window Truck 8/24/26"*. Eso ES el nombre de la
entrega. La propuesta:

- Ese texto se convierte en el **identificador del grupo**. Dos camiones el
  mismo día del mismo proveedor se distinguen porque uno dice "Window Truck" y
  el otro "Glass Truck" — y si alguien no escribe nada, el grupo se llama por
  proveedor y fecha, como hoy.
- En Incoming las filas se **agrupan bajo ese título**, con un botón de
  "llegó todo" para el grupo entero y la casilla por material para cuando
  falta una caja.
- Nadie tiene que aprender un concepto nuevo: ya lo estaba escribiendo.

No construido todavía — va junto con los varios materiales por Incoming.

## Pendiente grande — varios materiales en "Add Expected Material"

Pedido de Jose (v11.10). Hoy el modal de Incoming recibe **un solo material**:
una categoría, un nombre, una cantidad, una unidad, un supplier, un PO, un PM.
Jose quiere lo mismo que tiene ENTRY: **varias líneas de material, con la
casilla de "todos comparten el mismo supplier / proyecto / categoría…"** para
poder separarlos cuando no lo comparten.

Por qué no se hizo junto con lo demás: no es diseño, es la **forma de los
datos**. Un Incoming hoy es una fila con un material; esto lo convierte en una
fila con N materiales, y hay que decidir antes de escribir código:

- ¿Cada material es **su propia fila** de Incoming (y entonces "el camión del
  8/24" es un grupo de filas que hay que poder marcar como llegado junto), o
  **una fila con varios materiales dentro**?
  Yo diría **filas separadas con un id de grupo**: marcar llegada por material
  es lo que pasa de verdad (llega el camión y falta una caja), y el dashboard y
  el popup de la mañana ya cuentan filas.
- Al convertir un Incoming en ENTRY, ¿se abre el formulario con **todas** las
  líneas cargadas?
- El extractor de IA (AI Extract) ya lee una hoja de carga con varios
  materiales — hoy tiene que aplanarlos a uno. Esto es justamente lo que le
  faltaba.

## Polish pass (do at the end, after the functional work)

- **2j — TRANSFER / RETURN / WASTE now follow the ENTRY/EXIT layout. DONE in
  v11.7.** Jose spotted two differences: the date was buried third instead of
  first (an accident — all five screens share one grid, and ENTRY/EXIT only
  looked right because they hide the fields before the date), and the three
  had no coloured material box while ENTRY and EXIT each had one.
  Fixed by lifting the date into its own row above the grid and wrapping the
  core fields plus each type's location fields in `.move-mat-box`, tinted
  blue / purple / amber to match the tab, with a "Material" header and a
  quantity badge — Jose's answer to the open question was "sí lleva
  encabezado". The badge reads what will actually be saved, which is the
  transfer rows' sum on TRANSFER and the Quantity box on RETURN/WASTE.
  Guarded by tools/test-form-symmetry.js.

  **Still open, deliberately NOT done:** TRANSFER, RETURN and WASTE are still
  *single-material* forms. Making them multi-material like ENTRY/EXIT is the
  bigger asymmetry underneath this one and touches the save path, not just
  layout. Worth deciding separately.

- **Scrollbars look bad.** Jose dislikes the default side scrollbar. Do NOT
  hide it outright: the bar is the only cue that a long Movements table or
  Settings list continues below, and removing it hides that from warehouse
  staff. Style it instead — thin (~6px), themed, low contrast, on the scrolling
  containers rather than the whole page.
- **Card removal animation.** When a card leaves either corner deck, the ones
  below should tilt slightly — less than the full pile angle — and slide up into
  the freed space, unhurried. Today it just disappears. Same treatment for the
  merge-suggestion boxes.
- **Audit every animation in the app.** Some look bad as they are, and several
  places that should have motion have none. Example raised: a merge-suggestion
  box currently just vanishes — it should collapse quickly and let the boxes
  below slide up into the freed space. Same question for toasts, modal
  open/close, row insertion in Movements, the deck fan, and tab switches. One
  pass, one consistent set of durations/easings, rather than tuning them one at
  a time.
- **Toast delay feels laggy — replace with inline spin → check at the point of
  action (v9.80 feedback).** Jose's complaint: a toast showing up ~3 seconds
  after an action (not staying 3 seconds — SHOWING UP 3 seconds late) reads as
  the app being slow, even though it isn't broken. Root cause confirmed: that
  gap is real `google.script.run` round-trip time to Apps Script (serialize →
  dispatch to the sandboxed execution → run → serialize back), which routinely
  runs 1-4s even for a trivial call — nothing in our code controls that, so it
  cannot be "sped up" as asked.
  What CAN change: give feedback the INSTANT the user acts, not after the
  round trip. **Corrected after checking the actual code (Jose caught my
  first description being wrong):** the busy/done infrastructure
  (`_btnBusy`/`_btnDone`, v9.66, tools/test-button-states.js) does NOT
  uniformly show a tick on the button today. `submitMovement`'s single-material
  path (`_doSubmit`, ~line 5644) does it right — `_btnDone(btn, true, function(){
  closeModal(...) })` holds a ✓ on the button for 700ms before the window
  closes, exactly the "don't vanish the instant you click Save" behavior this
  item wants everywhere. But the multi-material ENTRY path (`_doMultiSubmit`,
  ~line 6580 — Materials to Receive, the more commonly used flow) never got
  the same treatment: it calls `_setModalBusy(...,false)` and `closeModal(...)`
  immediately after the spinner, with no `_btnDone` in between, so the button
  never shows a check at all — the ✅ the user sees is purely the toast's icon,
  arriving 400ms later, off in a different part of the screen, after the
  window is already gone. Fixing this item means: (1) wire `_doMultiSubmit` up
  to `_btnDone` the same way `_doSubmit` already is, and (2) THEN decide
  whether that's enough (submitMovement's pattern extended everywhere a
  `<button>` exists) or whether non-button controls (the Permissions
  switches — `_savePermSwitch` just disables the checkbox today, no spinner
  at all — catalog rename/merge, etc.) also need a lighter inline spin→check
  variant. Two different sizes of fix bundled under one complaint; scope
  precisely once this is picked up.
- **Info icon leading vs. trailing — refined rule (corrected same feedback
  round).** NOT "always move it before the label" — Jose's actual rule:
  where the underlying text is KEPT (an icon added alongside text that still
  shows), the icon leads (`ⓘ` before the label), so it reads as "there's more
  here" before the reader gets to the text. Where the text was REMOVED and
  the icon is now the only way to see it (every `_infoIc()` use shipped in
  v9.80 — Permissions' 4 switches + the role-label field, Company's 3 fields,
  System's 2 fields), it stays exactly where it already is, trailing — no
  code change needed there, all nine are correct as shipped. This rule only
  bites the next time an icon is added next to text that stays visible, not
  the ones already built. Applies everywhere `_infoIc` is used (NOT the Setup
  Wizard, which keeps its always-visible hints per the same conversation).

## Proteger el código — pregunta de Jose (v9.95), respuesta honesta

**Realidad de partida:** el código se entrega como fuente dentro del proyecto
de Apps Script del cliente. Puede leerlo, copiarlo y modificarlo. **No existe
ninguna forma de impedirlo** — no hay DRM en Apps Script. Cualquier propuesta
que empiece por "que no lo puedan copiar" es falsa.

Lo que sí es posible, de más a menos recomendable:

1. **Marca de origen (watermark) — RECOMENDADO, barato.** Un identificador
   único por instalación, generado en el primer arranque y guardado en Script
   Properties, más una constante de producto/versión ya presente. No impide
   copiar; sirve para **demostrar** de dónde salió una copia si algún día hace
   falta. Costo: casi cero. Ya existe media pieza (`APP_VERSION`, `PRODUCT`).
2. **Aviso de copyright + Términos de servicio — RECOMENDADO.** Ya hay
   `legal/TERMS-OF-SERVICE.md`. Para este modelo de negocio, esta es la
   protección real: no es técnica, es legal.
3. **Verificación de licencia contra un servidor de Jose ("llamar a casa") —
   NO recomendado.** Técnicamente se puede (`UrlFetchApp`). Tres problemas
   serios: (a) el cliente puede simplemente borrar esas líneas, es fuente
   abierta ante sus ojos; (b) crea un punto único de falla — si el servidor de
   Jose se cae, **todos los clientes que pagan** se quedan sin app; (c) un
   interruptor remoto que puede apagar la bodega de alguien es exactamente el
   tipo de cosa que destruye la confianza del cliente. El daño esperado supera
   al beneficio.
4. **Mover la lógica valiosa a un servidor propio — efectivo pero cambia el
   producto.** Es lo único que de verdad protege: si el cálculo vive en un
   servidor de Jose, copiar el script no copia la lógica. Pero destruye el
   argumento de venta actual (tus datos en TU Drive, sin depender de nadie),
   agrega hosting, y convierte esto en otro producto.

**Sobre "el código usa nuestras claves":** cierto que `OAUTH_CLIENT_ID` y
`OAUTH_CLIENT_SECRET` son de Jose, pero no sirven como palanca — solo
habilitan el login de gente fuera del dominio, y quien copiara el sistema
puede crear su propio cliente OAuth en 20 minutos. No es protección.

**El punto que importa más que todo lo anterior:** lo que se vende no es el
código, es el servicio — actualizaciones, soporte, instalación. Quien copie
el archivo se queda con una foto congelada, sin arreglos ni mejoras. Eso ya
es la protección más fuerte que tiene este modelo, y no hay que construir
nada para tenerla.

## Tarjeta de reenganche para clientes que dejaron de pagar — idea de Jose (v9.95)

**La idea:** cada ~6 meses, una sola vez, mostrar una tarjeta tipo "no te
pierdas las mejoras — acopio.net / service@acopio.net" con link al listado de
novedades y correcciones. Descartable, visualmente distinta de las tarjetas
normales, y en otro lugar, para no ser molesta.

**Lo que está bien:** la restricción que Jose se puso solo — poco frecuente,
descartable, sin bloquear nada — es exactamente lo que separa un recordatorio
útil de spam dentro de una herramienta que el cliente pagó.

**El problema de diseño, y cómo evitarlo:** la app **no sabe quién paga**. No
hay estado de licencia ni suscripción en ningún lado, y tampoco sabe si
existe una versión más nueva — el banner de "version mismatch" solo compara
Code.gs contra Index.html DENTRO de una instalación, no contra la última
versión publicada. Averiguar cualquiera de las dos cosas exige llamar a un
servidor de Jose, con todos los problemas del punto 3 de la sección de
arriba.

**Propuesta: hacerlo por tiempo, no por licencia.** Guardar en Script
Properties la fecha de instalación (ya existe `SETUP_COMPLETED_AT`, usado por
el check-in) y mostrar la tarjeta cuando hayan pasado 6 meses desde la última
vez que se mostró. Sin red, sin estado de pago, sin poder equivocarse. El
texto no afirma que haya algo nuevo — invita a ir a ver, que es justo lo que
Jose describió.

**Decisiones antes de construir:**
- **Solo ADMIN.** Un trabajador de bodega no puede comprar nada; para él es
  publicidad pura.
- **Dónde.** Jose pidió que no sea el deck normal. Settings → System es el
  lugar más honesto (donde ya se habla del estado del sistema), pero se ve
  poco. Alternativa: una franja discreta bajo el header, solo para admin.
- **"Descartar" tiene que durar.** En Script Properties, no en localStorage —
  descartarla en la computadora y que reaparezca en el teléfono la convierte
  en lo que se quería evitar.
- **BLOQUEADO:** acopio.net no existe todavía, y el listado de novedades
  tampoco. Sin esos dos, no hay a dónde mandar a nadie. Va después de la
  landing.

## Cycle count / conteo físico — idea de Jose (v9.91), diseño propuesto

**El problema real:** un cliente quiere revisar si lo que está físicamente en
la bodega coincide con lo que dice la app, y corregir las diferencias. Hoy no
hay ninguna forma de hacerlo.

**La idea original de Jose:** recorrer ubicación por ubicación dando check a
lo que encuentra; al final se compara lo marcado contra lo no marcado y se
muestra la lista de lo NO encontrado, con todos los datos del material
(cantidad, ubicación, fecha de recepción, movimientos desde el ENTRY) para
buscarlo bien; si de verdad no está, se elimina o se corrige.

**Lo que está bien de esa idea y hay que conservar:**
- **Recorrer por UBICACIÓN, no por lista de materiales.** Es exactamente como
  se cuenta en la vida real (uno se para frente a un rack, no busca un
  material por toda la bodega). Buen instinto.
- **"Búscalo bien antes de darlo por perdido"** con el historial completo del
  material a la vista. Esto es genuinamente valioso y ningún sistema barato lo
  hace. Los movimientos ya existen en ARCHIVE, así que sale casi gratis.

**Lo que yo cambiaría, en orden de importancia:**

1. **El check binario es el hueco más grande.** La diferencia más común NO es
   "desapareció" — es "debería haber 40 y hay 37". Un checkbox no puede
   expresar eso. Cada línea necesita un campo de cantidad contada.
   **Recomendación: conteo a ciegas (blind count) por defecto** — que la
   persona escriba lo que ve SIN ver primero lo que la app esperaba. Mostrar
   el número esperado sesga fuertemente hacia confirmarlo ("sí, se ve más o
   menos igual") y es la razón número uno por la que los conteos salen
   limpios y el inventario sigue mal. Es barato de construir y es lo que más
   mejora la exactitud. Con un interruptor para apagarlo.

2. **NUNCA borrar ni editar el historial. Escribir un ajuste.** Esto no es
   preferencia, es forzado por la arquitectura: el stock NO se guarda en
   ningún lado, se recalcula reproduciendo cada movimiento
   (`calculateStock()`), y los costos van estampados por fila. Borrar un
   ENTRY reescribe el pasado y cambia retroactivamente el promedio ponderado
   y todo lo que dependa de él. El resultado correcto de un conteo es un
   movimiento NUEVO que dice "el día D contamos y ajustamos de 40 a 37,
   motivo X".
   **Recomendación: un 6º tipo de movimiento, `ADJUST`/`COUNT`.** Hoy solo
   existen ENTRY, EXIT, TRANSFER, RETURN, WASTE. Se podría reusar WASTE para
   los faltantes, pero WASTE significa "dañado/consumido", que es mentira si
   fue un error de captura — y sobre todo **WASTE no puede expresar un
   SOBRANTE** (encontrar más de lo esperado, que pasa seguido cuando algo se
   guardó en el rack equivocado). Registrar un sobrante como ENTRY inventa
   una compra que nunca ocurrió y corrompe el costo promedio, justo contra la
   regla de "nunca inventar un costo" que ya está en este documento. Costo del
   6º tipo: tocar `calculateStock`, la validación de `addMovementsBatch_`, los
   badges/filtros del frontend y el motor de costos.

3. **Un conteo es una SESIÓN, no un momento.** Contar una bodega toma horas o
   días y suele hacerlo más de una persona. Necesita guardarse y poder
   retomarse: quién lo empezó, qué fecha, qué racks cubre, cuánto lleva
   avanzado. Sin esto, un refresh del navegador borra todo el trabajo y nadie
   va a terminar un conteo nunca.

4. **Hace falta un botón de "encontré algo que no está en esta lista".**
   Sutileza que la versión original se pierde: si solo muestras "lo que la app
   cree que hay en A1A" para palomear, **es imposible descubrir un material
   que físicamente está en A1A pero la app cree que está en otro lado**. Y
   encontrar stock mal ubicado es una de las cosas para las que existe un
   conteo físico.

5. **El entregable es el reporte de variaciones.** Al terminar: lista de
   diferencias con esperado / contado / delta, **el valor en dólares del
   delta** (los costos ya existen desde v9.78), y un clic para aceptar y
   escribir el ajuste. Guardar el registro del conteo permite después ver "en
   este material siempre salimos cortos" — que es como se detecta un robo o
   un proceso roto.

6. **Control de alcance.** Todos piden "contar toda la bodega" y nadie lo
   termina. La práctica real es conteo cíclico ABC: lo caro y lo que más se
   mueve se cuenta seguido, el resto rara vez. La app ya tiene costos e
   historial de movimientos, así que podría SUGERIR qué contar. Pero para una
   v1, basta con "elige unos racks y cuéntalos".

**Propuesta de alcance para una v1 realmente construible:** sesión de conteo
guardada → elegir racks → recorrer rack por rack escribiendo cantidades a
ciegas → botón de "encontré algo más" → reporte de variaciones con valor en
dólares → aceptar y escribir movimientos `ADJUST`. El panel de detalle con el
historial del material (la mejor parte de la idea de Jose) va en el reporte de
variaciones, que es donde de verdad se usa: cuando ya sabes que hay una
diferencia y necesitas entender por qué.

**Sin decidir todavía:** ¿quién puede hacer un conteo (WAREHOUSE, o solo
ADMIN)? ¿aceptar los ajustes necesita permiso aparte, dado que mueven dinero?
¿se congela el rack mientras se cuenta, o se permite que alguien haga un
movimiento a media sesión (y entonces la variación se calcula contra qué)?

## ✅ HECHO (v11.23) — el barrido de calidad de datos

Construido en Settings → System → **"Check my data"**. Las decisiones que
estaban abiertas, resueltas y por qué:

- **¿Cuándo aparece?** Solo cuando se presiona. Un barrido que interrumpe al
  guardar es lo que la gente apaga, y un resumen diario se vuelve algo que
  ignorar. Y de paso elimina un subsistema entero: **sin fastidio no
  solicitado no hay nada que descartar**, así que no hay estado de "recuérdame
  después" que guardar, que equivocar, ni que perder en una restauración.
- **¿Quién lo ve?** ADMIN, las dos puntas (escanear y aplicar).
- **¿Qué revisa?** Tres familias, y **no tienen la misma confianza** — eso es
  lo que hace peligrosa esta función si se finge lo contrario:
  1. **"Escrito de dos formas"** (casi certeza). Dos textos distintos cuya
     clave *aplastada* —sin espacios ni puntuación— es la misma. `BS10` y
     `BS 10` colapsan; `JJF 109` y `JJF 110` **no**, porque sus dígitos
     difieren. Materiales, proyectos, proveedores y racks.
  2. **"Le falta lo que sus hermanos tienen"** (alta). Agrupado por MatID, que
     es la regla de Jose. **Solo proveedor y el proyecto de los TRANSFER**
     viejos. GC, PO y PM tienen el mismo hueco y **quedan fuera a propósito**:
     una orden de compra es de una entrega y un contratista es de una obra;
     copiarlos en masa haría que la app afirme algo que nadie le dijo.
  3. **"Échale un ojo"** (adivinanza, **sin botón**). Errores de tecleo —
     distancia de edición de uno o dos caracteres, con los dígitos iguales.
     `CLIFTON BUILDING` vs `CLIFTON BULIDING` sí; `GE SILPRUF SEALANT` vs
     `GE SILPRUF SEALER` no, porque compartir palabras es lo que hace una
     familia de productos.
- **UN TECHO.** 150 hallazgos, los más grandes primero, y la pantalla **dice
  cuántos quedaron fuera**. Un primer barrido sobre un año importado produce
  miles.
- **Nada se aplica solo**, y cada fusión pasa por la función que ya existía
  para ese tipo de valor — la misma que llaman las pantallas de Settings, ya
  con candado, ya reescribiendo los dos archivos. Dos caminos para fusionar un
  material significaría que el menos usado es el roto.

`tools/test-data-quality.js` (60 comprobaciones).

**Lo que NO se construyó, y por qué:** un diccionario del rubro para "palabras
mal escritas" de verdad. Sin él, "mal escrito" y "así se llama" son
indistinguibles, y la familia 3 es lo más lejos que se puede llegar
honestamente.

## Diseño original (superado por lo de arriba) — LA LIMPIEZA DE DATOS

Jose preguntó: *"¿la app no ha encontrado nada últimamente que corregir?
¿construimos la parte donde está constantemente buscando cosas que corregir?"*

**Respuesta honesta: no, nunca se construyó.** Lo único que existe es
`_findSimilarMaterial`, y solo se dispara **mientras se escribe** un nombre en
el formulario. Nada revisa los datos que ya están guardados. Por eso no
encuentra nada: no está mirando.

Lo que Jose pidió, en sus palabras: *"revisar todos los nombres parecidos, los
nombres de proyectos parecidos, las destinations y sugerir que se las corrija,
también buscar palabras mal escritas, y arreglar movimientos según el id,
porque si tienen el mismo id es porque son el mismo material."*

**Ya hay media pieza construida (v11.17):** al editar un movimiento, los campos
vacíos se llenan desde el historial del mismo material y se marcan como
sugerencia. Eso es la versión MANUAL de "arreglar movimientos según el id" —
un movimiento a la vez, con la persona decidiendo. El barrido automático es la
misma idea aplicada a todo el archivo de una vez.

### Lo que hay que decidir ANTES de construir
Equivocarse aquí hace la app fastidiosa, y una app fastidiosa se apaga y no se
vuelve a encender.

- **¿Qué se revisa?** Cuatro familias, y no son igual de seguras:
  1. **Huecos** (mismo MatID, unos con supplier y otros sin) — la más segura,
     porque la respuesta ya está en los datos del propio cliente.
  2. **Nombres de material parecidos** — ya hay matcher. Riesgo: `JJF 109` y
     `JJF 110` son cosas distintas y se parecen muchísimo.
  3. **Proyectos y destinos parecidos** (`BS10` vs `PAT BS 10`) — el caso que
     Jose vio. Aquí NO se puede fusionar solo: puede que sean dos trabajos.
  4. **Palabras mal escritas** — la más difícil de todas. Sin un diccionario
     del rubro, "mal escrito" y "así se llama" son indistinguibles.
- **¿Cuándo aparece?** Al guardar es lo más útil y lo más molesto. Un barrido
  diario con un resumen es lo más llevadero.
- **¿Quién lo ve?** Solo ADMIN, probablemente: fusionar materiales cambia el
  stock.
- **¿Qué hace "Después"?** Nunca más para esa fila entierra problemas reales;
  volver en una semana fastidia.
- **UN TECHO.** Una instalación que importa un año de historia generaría miles
  de tarjetas de golpe. Hace falta un límite y una pantalla de "revisar todo",
  no un mazo de tarjetas.
- **Nada se aplica solo.** Fusionar dos materiales mueve stock. Toda sugerencia
  se propone; nadie la ejecuta sin que una persona la acepte.

## Idea original (superada por lo de arriba) — proactive data-quality suggestions

Jose's idea: the app notices gaps and inconsistencies and offers to fix them,
each as a card with two choices — "no supplier on the entry for X — add it?",
"no PM on the entry for X", "X and Y look like the same material — merge?".
Behind a Settings toggle, off by default.

The mechanics already exist (the suggestion deck, the similarity matcher, the
merge endpoints), so this is mostly rules plus judgement. What has to be
decided BEFORE building, because getting it wrong makes the app naggy and it
gets switched off for good:

- **Which gaps are worth raising at all?** A missing supplier on an internal
  transfer is not a problem; a missing supplier on a purchase probably is. The
  rules have to know the difference or every second movement raises a card.
- **When does it appear** — right after saving, batched daily, or only when
  someone opens the app? Immediately after saving is the most useful and the
  most annoying.
- **Who sees it?** Admin only, or the person who recorded the movement?
- **How does "Later" behave?** Never again for that row, or come back in a
  week? Never-again risks burying real gaps; recurring risks nagging.
- **A ceiling.** An installation importing a year of history would generate
  thousands at once. Needs a cap and a "review all" screen rather than a deck.

## Open decision — external sign-in for customers

Staff on the customer's own Google domain are identified automatically and need
no OAuth client. Only people OUTSIDE that domain (personal Gmail, contractors)
need the "Sign in with Google" button, which needs an OAuth client.

Google has **no public API** to add authorized redirect URIs to an OAuth client
— it is Cloud Console only, and there is an open feature request for it
(googleapis/google-cloud-go#10768). Every Apps Script copy has its own /exec
URL, so a shared client means registering each customer's URL by hand.

Three ways out, in preference order:

1. **Per-customer setup, as a paid step** (current behaviour). Ship with no
   OAuth client; enable it only for customers who ask, by adding their /exec URL
   to Jose's client. No work for the customers that don't need it.
2. **Broker redirect** — point the OAuth client at ONE fixed URL Jose owns,
   which forwards the code back to the customer's app via the `state`
   parameter. One redirect URI registered, ever, no per-customer work. Costs a
   permanent dependency on that broker staying up, and it must validate `state`
   strictly or it becomes an open redirect.
3. **Customer creates their own client** — full independence, but it is an hour
   of Cloud Console work no warehouse owner will do. Realistically dead.

Revisit when the first customer actually needs external access.

## Known limits (investigated, not fixable from code)

- **Self-deploy automation** — blocked by Google's hidden default Cloud project
  behind every Apps Script project. Can't enable APIs on it; switching to a
  standard project is irreversible and unavailable to personal accounts.
- **"Google hasn't verified this app" / missing Privacy Policy warnings** —
  permanently unavoidable per-customer under the copy-per-customer model, same
  root cause as above.
- **Inline PDF rendering** — Chrome's PDF viewer is a plugin, and plugins don't
  instantiate inside Apps Script's sandboxed googleusercontent.com frame. Worked
  around in v9.11 by showing Drive's server-side render of page 1; a true
  scrollable viewer would need PDF.js bundled in (~100 lines + testing).
- ~~Google's own Drive Picker~~ — NOT actually blocked. The first read of this
  was wrong: the Picker does need an API key from a standard Cloud project, but
  that project is Jose's and is configured once for all customers, not one per
  customer copy. Moved to Features as real work.

## Roles — 3 fijos + permisos desde v9.76, nombre del WAREHOUSE editable desde v9.79

Siguen siendo 3 roles fijos internamente (ADMIN/WAREHOUSE/VIEWER — USERS_V3 y
cada `role ===` en el código nunca cambian). Lo que SÍ es ajustable ahora:

- **v9.76** — 4 interruptores (`canSeeCosts`, `canEditMovements`,
  `canManageCatalog`, `canExportData`) que ensanchan lo que WAREHOUSE puede
  hacer, uno por uno. Settings → Permissions.
- **v9.79** — el ADMIN puede renombrar cómo se MUESTRA el rol WAREHOUSE en
  toda la app (badges, menú de cuenta, formulario de usuarios) — "Supervisor",
  "Manager", lo que ya use el cliente. Solo texto: no toca el valor guardado
  ni ningún chequeo de permisos. Verificado en tools/test-role-label.js.

**Un 4to tipo de rol de verdad (no solo un WAREHOUSE con más permisos) sigue
sin construirse.** Exigiría rediseñar `requireAuth_`, cada chequeo de rol, los
valores posibles en USERS_V3, el `<select>` de rol y la aplicación de permisos
en todo el código — un rediseño real, no una extensión. El sistema de
permisos ya construido cubre buena parte de lo que un 4to rol daría en la
práctica (un WAREHOUSE con ciertos interruptores prendidos y otros no ya se
comporta como un nivel distinto). Roles verdaderamente personalizados es
trabajo legítimo para una versión futura, no para ahora.

## Precios y costos — CORE en v9.78, costo por proyecto y desperdicio en v9.79/v9.80, alerta de precio en v9.87

**Lo de abajo es el diseño original; lo que sigue ya está construido y
verificado (20 aserciones en tools/test-pricing.js sobre el motor real).**

Lo que YA existe: costo opcional en cada línea de ENTRY (visible solo con
`canSeeCosts`), promedio ponderado recalculado y estampado por fila, EXIT/
WASTE/TRANSFER siempre valorados desde el promedio del servidor — nunca de lo
que mande el cliente —, "Inventory Value" en el dashboard con el conteo
honesto de "X de Y SKUs con precio", (v9.79) el tile "Project Cost" en
Project View — suma de `EXIT.totalCost` para ese proyecto, verificado en
tools/test-project-cost.js (RETURN/WASTE no cuentan, un EXIT sin costo no
rompe la suma, sin ningún EXIT con precio el tile simplemente no aparece),
(v9.80) el tile "Waste Cost" en el dashboard — suma de `WASTE.totalCost`
estampado (nunca recalculado del promedio de hoy), verificado en
tools/test-waste-cost.js con el mismo patrón honesto: sin ningún WASTE con
precio, el tile no aparece en vez de mostrar $0 — y (v9.87) la alerta de
cambio de precio en ENTRY: al escribir un Unit Cost que difiere ≥15% del
promedio en `config.avgCost` para ese material, aparece un aviso inline
justo debajo del campo ("20% higher/lower than the average on record —
$20.00 → $24.00"). Avisa en ambas direcciones, no solo subidas (una bajada
también es información útil). 15% es el umbral elegido — el ejemplo de Jose
fue 18%, ajustable si en la práctica suena demasiado o muy poco sensible.
Verificado en tools/test-price-alert.js (21 aserciones): no avisa dentro del
umbral, no avisa sin promedio previo que comparar, no avisa con costo o
nombre vacíos, y el aviso se limpia solo si el número se corrige.

**Deliberadamente NO en esta pasada** — cada uno es su propio trabajo:
- **Columna de costo en el CSV de Movements** y en el import masivo.
- **Editar el costo de un movimiento ya guardado** — `modifyMovement` no toca
  las columnas de costo todavía; corregir una entrada con precio mal tecleado
  hoy no recalcula el promedio.

## Diseño pendiente — precios y costos en el flujo de datos

**Decidido en principio: costo promedio ponderado, calculado en la ENTRADA,
estampado en cada movimiento.**

Lo que hace un software de inventario normal: cada material tiene un costo, y
ese costo cambia con cada compra. Tres métodos estándar:

- **FIFO** — las unidades más viejas conservan su costo; se consumen en orden.
  Exige llevar *capas* (lotes) por material, y que alguien en bodega elija de
  qué lote sale cada salida. Es una segunda estructura de datos completa.
- **Promedio ponderado (WAC)** — un solo número por material, recalculado en
  cada entrada: `nuevo = (qty_ant*prom_ant + qty_ent*costo_ent)/(qty_ant+qty_ent)`.
- **Costo estándar** — un número fijo puesto a mano, con la diferencia contra
  lo real reportada aparte.

Se elige el promedio ponderado porque es un número por material y una fórmula
en la entrada, y porque es defendible ante un contador. FIFO es correcto pero
cuesta un modelo de lotes que ni la hoja ni el usuario de bodega aguantan.

**La pieza que casi todos hacen mal y hay que hacer bien: el costo se ESTAMPA
en la fila del movimiento.** Valorar una salida de hace un año con el promedio
de hoy da un número falso. Estampado, la historia es inmutable y auditable sin
recalcular nada.

Cambios concretos:
1. `MATERIALS`: `avg_cost` (calculado, no editable) y `last_cost` (referencia).
2. `MOVEMENTS`: `unit_cost` y `total_cost`. En ENTRY lo escribe el usuario (o
   total de factura ÷ cantidad); en EXIT/WASTE/TRANSFER lo rellena la app desde
   `avg_cost` y queda bloqueado.
3. Recalcular `avg_cost` en cada ENTRY.

Números que se desbloquean de inmediato:
- **Valor del inventario** en el dashboard — el único número que un dueño mira.
- **Costo por proyecto** — suma de EXIT por proyecto. Para OX Glass esto es lo
  más valioso: qué consumió realmente un trabajo.
- **Desperdicio en dólares** — WASTE × costo. Es el número que VENDE la app.
- **Gasto por proveedor y por periodo.**

Dónde podemos ser mejores que el software normal:
- **El costo es opcional por material.** Casi todos obligan a poner costo a
  todo. Aquí un material sin costo simplemente no entra en la valoración, y el
  dashboard dice honestamente "82% de tu stock está valorado". Es lo que hace
  que se pueda adoptar sin capturar 400 costos el primer día.
- **La app sugiere el costo de la última compra** en gris; escribir encima es
  una sola acción.
- **Alerta de cambio de precio** — "este proveedor cobró 18% más que la vez
  pasada". Barato de calcular, y es justo lo que un manager nota tarde.
- **Nunca inventar un costo.** Misma regla que las fechas en el importador de
  correo.

**Prerrequisito duro: permisos.** En una bodega la mayoría NO debe ver dinero.
Los permisos granulares dejan de ser opcionales y se vuelven el paso previo —
como mínimo una bandera `canSeeCosts` por rol antes de escribir la primera
columna de costo.

## Diseño pendiente — plantillas por industria (Store, Workshop…)

Investigado. Lo que un negocio tipo panadería/tienda necesita y una bodega no:

| Necesidad | ¿Lo tenemos? |
|---|---|
| Par levels / mínimos que disparan el pedido diario | **Sí** — es el Low-Stock Monitor |
| Desperdicio como métrica de primera clase | **Sí** — el tipo WASTE ya existe |
| Proveedores, entradas, historial | **Sí** |
| Categorías y unidades propias del rubro | **Sí**, solo hay que precargarlas |
| Caducidad por lote (FEFO: sale primero lo que vence primero) | **No** — feature real |
| Recetas (1 batch de pan consume 2kg de harina…) | **No** — feature real |
| Variantes (talla/color) y POS | **No**, y no es nuestro terreno |

**Conclusión honesta: una plantilla es un punto de partida, no otro producto.**
Podemos entregar un arranque "Store / Shop" que ayude de verdad, pero no
podemos llamarle sistema para panadería hasta que exista la caducidad.

Lo que una plantilla SÍ define (elegida en el wizard):
- Categorías y unidades de medida precargadas.
- Nombres de ubicación del rubro (Shelf / Cooler / Freezer / Dry storage en vez
  de Rack / Bay).
- **El vocabulario de la interfaz** — "Project" pasa a "Order" o "Job". Esta es
  la parte de mayor valor: es lo que hace que el cliente sienta que la app se
  hizo para él.
- Qué columnas se ven por defecto y reglas de mínimo de ejemplo.

Lo que NO cambia: el motor.

Tres arranques para empezar: **Warehouse** (lo que hay), **Store / Shop**,
**Workshop / Contractor**. Una panadería usa Store, más caducidad cuando exista.

Es además la forma más barata de ampliar el mercado: ~un día de trabajo por
plantilla, cero cambios de motor.

## Features — agrupados por dificultad

### Fáciles (una sesión cada uno)
- **Iconos profesionales** en vez de emojis. Bloqueado solo en que Jose baje
  los archivos. Qué pedir en Flaticon: **SVG** (no PNG), **una sola familia /
  estilo** para las ~50 que usa la app, trazo (outline) y no relleno de color,
  y en un solo ZIP. Estáticos primero; los animados solo para el splash y los
  estados vacíos, nunca en botones.
- **Icono de la app** (el que se ve al agregarla a la pantalla del teléfono).
  Trivial una vez haya diseño.
- **Auditoría responsive** — revisar y ajustar pantalla por pantalla. Sin
  lógica nueva, pero son varias pantallas.

### Medianos (dos a cuatro sesiones)
- **Rediseñar el Low-Stock Monitor** — HECHO en v9.74.
- **Sincronización entre ventanas abiertas — Jose quiere hacerlo (v9.90).
  Decidido en la conversación, sin construir todavía:**
  - Sondeo (polling), no push real — Apps Script no lo tiene. Cada N
    segundos, una llamada barata (`getVersionStamp` o similar — NO recarga
    todos los datos, solo un número/hash) pregunta "¿cambió algo desde la
    última vez?"; solo si la respuesta es sí se dispara una actualización.
  - **Se apaga con la pestaña en segundo plano** (`document.visibilityState`)
    — decidido, para no gastar cuota de ejecución en pestañas olvidadas
    abiertas. Intervalo exacto (¿15s? ¿30s?) por definir al construirlo.
  - **Enfocado en stock y movimientos únicamente** — decidido. Usuarios,
    config y permisos NO se sincronizan en vivo; se actualizan solos la
    próxima vez que esa pestaña recargue la página normalmente.
  - **La actualización NO puede ser una recarga completa de la página, ni de
    todas las pestañas.** Decidido, y es la parte que más cambia el diseño
    original: cuando algo cambia, solo se actualiza el dato puntual que
    cambió (el número, el nombre, el material específico) en la pestaña
    donde el usuario está activo ahora mismo — nunca todas las pestañas
    abiertas, y nunca la página completa. Esto es bastante más trabajo que
    un simple "recargar stock de fondo": hace falta que el servidor pueda
    decir QUÉ cambió puntualmente (no solo "algo cambió"), y que el
    frontend sepa parchar solo esa celda/número en el DOM sin re-renderizar
    toda la tabla — evita perder lo que alguien esté escribiendo a medio
    llenar en un formulario de Entry, que era la preocupación original.
- **Limpieza del error log** — HECHO en v9.64.

### Grandes (una semana o más)
- **Precios y costos** (ver arriba). Ya no está bloqueado — el prerrequisito
  (permisos granulares) se resolvió en v9.76.
- **Plantillas por industria** (ver arriba).
- **QR / códigos de barras + impresión de etiquetas.**
- **Sugerencias proactivas de calidad de datos** (ver más abajo).
- **Drive Picker real** — bloqueado en que Jose cree el proyecto de Cloud.
- **Caducidad por lote (FEFO)** — prerrequisito de cualquier cliente de comida.

### Bloqueado por la plataforma — NO prometer
- **PWA instalable con modo offline.** Verificado: Apps Script sirve el HTML
  dentro de un iframe sandbox en googleusercontent.com, y un service worker no
  se puede registrar desde ahí — es el componente que hace que un PWA funcione
  sin conexión. Google lo documenta como restricción del HTML Service y nadie
  en la comunidad ha logrado desplegar un web app de GAS como PWA.
  Lo que SÍ se puede: "Agregar a pantalla de inicio" en Android y iOS crea un
  acceso directo con nuestro icono. Da el icono en el teléfono, no el offline.
  El offline de verdad exigiría sacar el frontend de Apps Script a un hosting
  propio, que es otro producto.

## Operational

- **PENDIENTE — actualizar la Política de Privacidad.** v9.77 agregó el
  check-in automático (día 3 / día 7 sin movimientos → un correo privado a
  `SUPPORT_EMAIL`, nunca al cliente). No manda contenido del inventario, pero
  sí manda nombre de empresa, correo del admin y un conteo — y eso sale del
  Drive del cliente, lo cual la política actual dice que nunca pasa. Falta una
  línea honesta en `docs/legal/PRIVACY-POLICY.md` antes de que esto llegue a
  un cliente real. No es urgente hoy (cero clientes, `SUPPORT_EMAIL` vacío en
  todo lado), pero si se activa antes de arreglar el texto, queda una promesa
  rota por escrito.


## Icono de pestaña por cliente ("Nivel 2") — aplazado a propósito en v10.3

**Lo que SÍ quedó (v10.3):** un solo icono de Acopio para todas las
instalaciones, en `ACOPIO_FAVICON_URL`. Cero acción del cliente. La constante
está **vacía todavía** porque `setFaviconUrl` necesita una URL pública que los
servidores de Google puedan pedir sin credenciales, y Acopio aún no tiene casa
pública. Vacío = el comportamiento de hoy, sin estados a medias. Encenderlo es
cambiar **una línea**: `acopio.net/favicon.png`, o un PNG cuadrado en el Drive
**de Jose** compartido "cualquiera con el enlace"
(`https://drive.google.com/uc?export=view&id=ID`) — el Drive del cliente no se
toca, así que no se publica nada de él.

Decisión de Jose: *"hagamos así por ahora, si sale otra mejor opción en el
futuro lo cambiamos, sino lo dejamos así para siempre."* Y es la decisión
comercialmente correcta además de la barata: cada pestaña abierta en cada
bodega mostrando el icono de Acopio es la diferencia entre parecer un producto
y parecer una hoja de cálculo.

**Lo aplazado — el icono propio de cada cliente.** No es una línea, es una
feature:

1. **Hay que publicar un archivo del Drive del cliente.** El logo ya vive ahí
   (`COMPANY_LOGO_ID`), pero dentro de la app se muestra porque **el servidor
   lee el archivo privado y manda los bytes**. Un favicon no puede: lo pide el
   navegador desde la página de Google, sin permisos. Hace falta
   `setSharing(ANYONE_WITH_LINK, VIEW)` sobre un archivo del cliente — con
   consentimiento explícito, nunca en silencio.
2. **Falla sola en empresas grandes.** Muchos Google Workspace prohíben
   compartir fuera de la organización. El `setSharing` falla justo con los
   clientes que más pagan. Hay que detectarlo, caer al icono de Acopio y
   **decírselo**, no dejarlo mudo.
3. **Un logo ancho en 16 píxeles es una mancha.** Por eso va junto con pedir
   **dos** logos, no tres, explicando para qué sirve cada uno:

   | Logo | Dónde se usa | Obligatorio |
   |---|---|---|
   | Horizontal (el que ya se pide) | Barra superior, PDFs, correos | Sí |
   | Cuadrado | Pestaña del navegador, y mañana icono de app móvil | No — si falta, se usa el de Acopio |

   El tercero (monocromo) solo importa para impresión, y ahí no estamos.

`FAVICON_URL` sigue existiendo y gana sobre todo lo demás, así que un cliente
que insista hoy se resuelve con una Script Property mientras tanto.

---

# ══ 🔴 ABIERTO · V1 — LAS UBICACIONES TIENEN EL MISMO PROBLEMA QUE LOS MATERIALES ══

> **Repaso 2026-10-05:** `moverDependencias_` existe y cubre MATERIALES.
> La gemela para ubicaciones no existe. Sin empezar.
#    Anotado 2026-09-29, al arreglar el de materiales (v12.22)

La v12.22 arregló que renombrar un MATERIAL se lleve consigo sus cinco
dependencias. La auditoría que hizo falta para escribirlo destapó **dos más, del
mismo tipo, en las UBICACIONES**, y no se tocaron para no dejar dos arreglos a
medias:

`mergeLocationsLocked_` reescribe las columnas de origen y destino del archivo y
la lista de CONFIG. **No toca:**

| Qué queda huérfano | Qué se rompe |
|---|---|
| `RACK_PHOTOS` (clave: Location) | la foto del estante fusionado deja de salir en el Warehouse Map |
| `MATERIAL_LOCKS` col. E (Rack) | **una reserva deja de proteger el estante**, porque apunta a un nombre que ya no existe |

El segundo es el que importa: una reserva que no protege nada es peor que no
tener reserva, porque alguien cuenta con ella.

**El arreglo es el mismo molde**, y ya está escrito: `moverDependencias_` hace
exactamente esto para materiales. Hace falta su gemela para ubicaciones, llamada
desde `mergeLocationsLocked_` y desde cualquier renombrado de ubicación, con su
prueba del mismo tipo que `test-dependencias-material.js` — la que EJECUTA y
mira qué quedó en cada hoja, no la que comprueba que la llamada está escrita.

**Y la comprobación que evita la próxima:** una prueba que liste todos los
almacenes con clave derivada (material o ubicación) y falle si alguno no está
cubierto por su función de mudanza. Es la lección de `check-suite.js` aplicada a
los datos en vez de a las pruebas: el fallo no va a ser la función, va a ser el
sexto almacén que alguien añada y no meta en ella.

---

# ══ 🔴 ABIERTO (una línea) — PONERLE NOMBRE A `ARCHIVE_START` ══

La v12.29 hace que el trabajo nocturno firme con su versión ANTES de tocar nada
(`ARCHIVE_START` → `nightly archive starting · v12.29`), y esa línea es ahora la
única forma que tiene Jose de saber, desde la app, qué código corrió esa noche —
el `docs/VERIFICAR-QUE-TODO-CUADRA.md` entero depende de ella.

Sale ya en **App Settings → System**, porque el actor es `system` y las acciones
desconocidas caen en un rótulo automático. Pero ese rótulo automático es
`archive start` en minúsculas, al lado de hermanos que dicen *"Backup created"* y
*"Old movements archived"*. Falta una línea en `SYSTEM_EVENT_LABELS`:

```javascript
ARCHIVE_START: 'Nightly archive started',
```

**NO se shipeó al descubrirlo, a propósito.** Jose acababa de pegar la v12.29 y
de restaurar MASTER a mano; hacerle pegar el archivo otra vez esa misma noche
por un rótulo cosmético habría sido cambiar algo que funciona por algo más
bonito, justo cuando lo que hacía falta era no mover nada. Va con el próximo
cambio de verdad que toque ese archivo.

# ══ 🔶 A MEDIAS · PRIORIDAD ALTA — QUE EL ARCHIVADO NO SE NOTE ══

> **Repaso 2026-10-05.** Hecho: **el suelo de 30 días** (✅ v12.30, con su
> prueba). Abierto y es lo importante: **que buscar alcance el archivo**, y
> **archivar por tandas con su propia fecha**.

Jose, después de dos semanas de incidentes con el trabajo nocturno:

> *"Pensándolo bien, el archivado no debe ser un problema para el usuario, es un
> problema para nosotros y para que la app sea más rápida, así que la app debe
> seguir mostrando los movimientos aunque estén archivados, o por lo menos
> mostrar los del último mes sin que el usuario deba pedirlo."*
>
> *"Eso de archivar movimientos cada día será un problema para todos los
> usuarios… debería hacerlo por tandas: tiene una fecha para mover todos los
> movimientos que el usuario no quiere y dejar sólo los que sí."*

**Tiene razón en el principio y hay que escribirlo antes de tocar nada: el
archivado existe por el techo de 10 millones de celdas de Google y por el tiempo
de carga. Son dos problemas NUESTROS. Que el usuario tenga que saber qué es un
"archivado", pulsar "Load Older History" o enterarse de que hay un corte en
meses es el síntoma de que le hemos pasado un problema nuestro.**

## Lo que ya se hizo (v12.30)

**El suelo de 30 días.** Pase lo que pase con el ajuste, lo del último mes se
queda en la lista reciente. Era lo que él pedía como mínimo, y ahora es una
regla y no una consecuencia aritmética de que el corte sea grande.

## Lo que falta, por orden

### 1. BUSCAR TIENE QUE ALCANZAR EL ARCHIVO — esto es lo que de verdad convierte el archivado en un problema del usuario

Hoy la caja de búsqueda filtra **lo que ya está cargado en pantalla**. Un PO de
hace ocho meses no aparece buscándolo: hay que adivinar que existe un botón
llamado "Load Older History", pulsarlo las veces que haga falta, y entonces
buscar.

Eso es exactamente la queja de Jose en su forma más concreta. **Y no se arregla
cargándolo todo** —que es lo que mataría la velocidad que el archivado compra—
sino buscando en el servidor: cuando la búsqueda no encuentra nada (o encuentra
poco) en lo cargado, preguntar a las dos hojas y traer sólo lo que coincide, con
un rótulo honesto del tipo *"3 more from the archived history"*.

Es el mismo patrón que `loadOlderHistory` de la v12.26: una ventana, no la hoja
entera.

### 2. ARCHIVAR POR TANDAS, NO POR GOTEO

Lo que Jose describe —*"una fecha para mover todos los movimientos que el
usuario no quiere"*— es archivar **a propósito y de una vez**, no un poco cada
noche. Y tiene una ventaja real sobre el goteo: una tanda se puede mirar antes
de hacerla, se puede hacer cuando a uno le conviene, y deja un antes y un
después claros. El goteo nocturno, en cambio, cambia la pantalla mientras nadie
mira — que es precisamente cómo se perdieron los datos tres veces sin que nadie
se enterara hasta el día siguiente.

El botón **▶️ Archive old movements NOW** de la v12.30 ya es media tanda: corre
el trabajo cuando se le pide y enseña los números antes. **Lo que falta para que
sea la idea entera es que la tanda acepte SU PROPIA FECHA**, en vez de usar
siempre el corte de los ajustes: *"archiva todo lo anterior al 1 de enero"*,
una vez, y se acabó.

Y entonces la pregunta de verdad: **¿sigue haciendo falta el trabajo nocturno?**
Mi opinión, para discutirla con él: sí, pero como RED, no como motor —
que corra sólo cuando la hoja se acerca al techo de celdas o cuando la lista
pasa de un tamaño que haga lenta la carga, y que no toque nada el resto de las
noches. Un trabajo que casi nunca hace nada es mucho más fácil de vigilar que
uno que reescribe dos hojas cada madrugada.

### 3. EL AVISO CUANDO EL ARCHIVADO SE LLEVA ALGO

Si una tanda saca 400 movimientos de la lista, la app debería decirlo donde se
ve —no en ERROR_LOG— y ofrecer deshacerlo. Hoy el único rastro es la línea de
*Old movements archived* en Settings → System, que hay que ir a buscar.

## La pregunta que hizo y que conviene no perder

> *"¿Qué pasa si el usuario que tiene 6 en el tiempo del archivado lo cambia a
> 12? ¿Los movimientos salen del archivado y regresan al master, o se quedan ahí
> pero los muestra otra vez?"*

**Regresan físicamente al master.** `archiveOldMovements` no sólo mira el
archivo activo: también recorre `ARCHIVE_HISTORY` y devuelve a la lista reciente
todo lo que vuelva a caer dentro del corte (`toRestore`). Es simétrico en los
dos sentidos, y por eso el informe del ensayo tiene una línea *"Would come back
IN"* desde la v12.26.

Dos consecuencias que hay que tener presentes y que hoy no están dichas en
ninguna parte de la app:

1. **El cambio no es inmediato.** Se aplica la próxima vez que corra el trabajo
   — esta noche, o al pulsar ▶️. Subir el corte de 6 a 12 y no ver nada nuevo
   es lo que va a pasar, y nadie lo ha avisado. **Debería archivarse/devolverse
   al guardar el ajuste**, o al menos decir "se aplicará esta noche".
2. **Bajar el corte MUEVE DATOS.** De 12 a 6 saca movimientos de la pantalla.
   Hoy se guarda como cualquier otra preferencia, sin avisar de que esa noche se
   van a mover filas. Debería decir cuántas antes de guardar.

# ══ 🔵 CRITERIO (no es una tarea) — EL USUARIO NO ADMINISTRA LA APP ══

Jose, pensándolo después de dos semanas de incidentes con el archivado:

> *"El archivado no debe manejarlo el usuario, o por lo menos no lo necesita
> manejar, sino que nosotros debemos usarlo cuando le demos soporte. Le vamos a
> enseñar al usuario que la app es todo lo que necesita y no debe ni necesita
> mover nada en el sheet. Entonces debemos mover a una nueva pestaña, tal vez con
> el nombre 'Avanzados', todo lo que el usuario no necesita manejar por sí mismo,
> lo dividimos por categoría y le ponemos la 'i' con la información necesaria.*
>
> *Lo que el usuario sí necesita es que la app maneje todo de forma ordenada,
> correcta, sin perder nada y de forma rápida, y le dé la información que él
> necesita cuando la necesite. Nosotros debemos trabajar y mejorar y añadir cosas
> a la app para darle soporte y saber cómo arreglar todo lo que se dañe, pero el
> usuario debe ver sólo lo esencial y necesario para hacer su vida simple."*

**Esto no es una tarea, es un criterio**, y ordena muchas de las que ya hay
apuntadas. Lo que dice, dicho de otra forma: *cada ajuste que le enseñamos al
usuario es una decisión que le estamos pasando a él, y una decisión que puede
tomar mal.* El corte de archivado en meses es el ejemplo perfecto: nadie que
gestione un almacén quiere decidir cuántos meses de histórico caben en una
pestaña de Google. Eso es nuestro.

## La prueba de fuego para cualquier ajuste

**¿Qué pasa si lo pone mal?** Si la respuesta es "la app va lenta", "se pierden
datos", "no ve sus movimientos" o "hay que restaurar un backup" → no es suyo.

El corte de archivado falla esa prueba por los cuatro lados: ponerlo corto saca
movimientos de la pantalla, ponerlo mal (una celda con un número raro) puede
dejar la lista vacía. Es exactamente lo que pasó.

## Qué hay que hacer, cuando toque

1. **Una pestaña `Advanced` en App Settings**, por categorías, cada bloque con su
   ⓘ. Ahí se van: el corte de archivado, el archivado manual, la comprobación de
   instalación, la calidad de datos, el reconstruir totales, y lo que vaya
   saliendo del repaso.
2. **Lo que queda fuera de Advanced es lo que el usuario toca a diario**:
   categorías, proyectos, proveedores, ubicaciones, usuarios, packs, mínimos.
3. **Repasar ajuste por ajuste con la prueba de fuego** y anotar en cada uno a
   qué lado cae y por qué. Ese repaso es el trabajo de verdad; mover cajas de
   sitio es media hora.
4. **Y lo que no está y hace falta: herramientas NUESTRAS de soporte.** Hoy, para
   arreglar la instalación de alguien, hay que abrir su hoja y mirar pestañas a
   mano. Si la app es lo único que el usuario abre, nosotros necesitamos ver
   desde dentro qué le pasa a su instalación — y eso hay que construirlo.

# ══ 🔴 ABIERTO — ARCHIVAR POR TAMAÑO, NO POR CALENDARIO ══

> *"De fábrica o por defecto la app debe archivar lo que no necesita y la hace
> lenta, pero debemos dejar el acceso a esa información sólo si el usuario la
> necesita. ¿Cómo y con qué frecuencia podemos hacer el archivado para mantener
> la app siempre rápida pero manteniendo la información necesaria siempre a la
> mano?"*

## El error de diseño de hoy: el calendario no sabe nada de la velocidad

El corte está en meses, y los meses no tienen nada que ver con lo que hace lenta
la app. **Seis meses pueden ser 300 movimientos en una instalación y 60.000 en
otra.** El ajuste que supuestamente controla la velocidad no la controla: lo que
la hace lenta son FILAS, y las filas no se cuentan en meses.

De ahí sale todo lo demás. Un trabajo que reescribe dos hojas enteras cada
madrugada "por si acaso" es, además, el que nos borró el archivo tres veces.

## La propuesta

**Que el trabajo nocturno sea un vigilante y no un motor:**

1. Mira una sola cosa: cuántos movimientos tiene la lista reciente.
2. **Si está por debajo del umbral, NO HACE NADA y no escribe nada.** Ni una
   celda. La inmensa mayoría de las noches, en la inmensa mayoría de las
   instalaciones, el trabajo nocturno no tocaría el archivo jamás.
3. Si lo pasa, saca la tanda más vieja hasta bajar al objetivo, de una vez, y lo
   deja escrito donde se vea.
4. **Suelo de 30 días, siempre** (ya está, v12.30): lo de este mes no se archiva
   aunque haya cien mil filas.

Con los números de Jose —1.279 movimientos en algo más de un año— un umbral de
5.000 significa que su app no archivaría nada **en años**. Y eso es exactamente
lo que queremos: un trabajo que casi nunca escribe es un trabajo que casi nunca
puede romper nada, y cuando escribe es porque de verdad hacía falta.

## El número hay que MEDIRLO, no inventarlo

5.000 es mi punto de partida, no un dato. Lo honesto es medir el tiempo de
carga de la app con 1.000, 3.000, 5.000, 10.000 y 20.000 movimientos en la copia
DEMO, y poner el umbral donde la carga empiece a notarse — con la medición
apuntada al lado, para que el día que alguien lo quiera cambiar sepa qué está
cambiando.

Eso es, además, el primer trabajo de verdad para el robot de pruebas que Jose
pidió: generar movimientos falsos a miles y cronometrar.

## Y entonces el corte en meses deja de ser un ajuste del usuario

Pasa a `Advanced`, para soporte. El usuario no elige cuántos meses: la app
mantiene la lista por debajo del umbral, nunca archiva lo del último mes, y todo
lo demás se alcanza buscando (que es la tarea nº 1 de la sección anterior).

# ══ 🔴 ABIERTO — LA VERSIÓN, EN TODOS LOS TRABAJOS AUTOMÁTICOS ══

> **Repaso 2026-10-05:** sólo el archivado sella su versión (v12.29). Backup,
> check-in e informe diario siguen sin sellar.

**Confirmado en la propia instalación de Jose, en la pantalla de ⏰ Activadores:**

| Función | Implementación |
|---|---|
| `dailyBackupTrigger` | Encabezado |
| `dailyCheckinTrigger` | Encabezado |
| **`dailyReportTrigger`** | **Versión 273** |
| `archiveOldMovementsTrigger` | Encabezado |

**Un disparador de este proyecto está clavado a una versión congelada.** No es
una teoría: está en su pantalla. `dailyReportTrigger` va a ejecutar para siempre
el código de la versión 273, pase lo que pase con lo que pegamos en el editor —
y eso es, exactamente, el mecanismo que explica las dos semanas de archivados
fallando con las guardas puestas.

La v12.29 puso el sello de versión en el archivado y por eso mañana sabremos qué
versión corrió. **Los otros tres trabajos automáticos no lo llevan**, así que si
uno de ellos se queda congelado no hay forma de saberlo salvo mirando esta
pantalla y acordándose de mirarla.

Hace falta la misma línea en `dailyBackupTrigger`, `dailyCheckinTrigger` y
`dailyReportTrigger`: la versión dentro de su entrada de AUDIT_LOG. Entonces
Settings → System enseña la versión de cada trabajo automático, y un trabajo
congelado se delata solo — dice una versión distinta de la que dice el pie de la
app.

**Y la comprobación que lo caza antes:** 🩺 Check this installation no puede leer
a qué implementación está atado un disparador (la API de Apps Script no lo
expone), pero sí puede decir, con todas las letras, que hay que mirarlo: *"Open
⏰ Triggers and check every row says Head."* Un paso manual escrito es
infinitamente mejor que una comprobación que no existe.

# ══ 🔵 DECISIÓN DE JOSE — ¿DE QUÉ PROYECTO DE CLOUD CUELGA LA COPIA DEL CLIENTE? ══

Sale de enlazar la copia DEMO al proyecto ACOPIO. Para la DEMO da igual; para la
plantilla maestra es una decisión que hay que tomar antes de publicarla, y que no
parece deshacerse después. Lo escrito está en `docs/PROYECTO-DE-CLOUD.md`.

**Las dos opciones:**

| | Proyecto automático de cada cliente | El proyecto ACOPIO |
|---|---|---|
| Pantalla de permisos | genérica, con el aviso gris de "Google no ha verificado" | la nuestra, verificable, sin avisos |
| Registros | suyos | todos los clientes mezclados en el nuestro |
| Límites de uso | suyos | compartidos entre todos |
| Push Update Live | no funciona (hay que usar el camino manual) | funciona |

**Y el paso previo, que es una comprobación y no una opinión:** hacer una copia
de la hoja y leer, en Apps Script → ⚙️ Configuración del proyecto, qué dice
*Google Cloud Platform (GCP) Project*. Si una copia hereda el enlace, la decisión
ya está medio tomada por Google y hay que saberlo antes y no después.

**Mi recomendación, para discutirla:** proyecto propio del cliente para la
plantilla que se copia, y el aviso gris se resuelve explicándolo en la guía de
instalación con una captura. Atar a cientos de clientes a un proyecto nuestro
mete sus registros y sus límites de uso en nuestra casa, y el día que haya que
mover a uno no hay forma de separarlo.

# ══ 🔴 ABIERTAS (5) — COSAS ANOTADAS EL 2026-10-02 ══

> **Repaso 2026-10-05:** ninguna de las cinco tocada.

## 1. ¿Le sirve al cliente todo lo que hay en el menú 🏭 Acopio?

Jose, sobre la captura del menú entero desplegado: *"anota que debemos hablar de
si todo eso en el menú Acopio sirve o le sirve al cliente."*

Es el mismo criterio de *"el usuario no administra la app"*, aplicado al menú de
la hoja de cálculo en vez de a Settings. Y aquí es más urgente, porque **el menú
de la hoja es lo único que el cliente ve si abre el Sheet** — y lo va a abrir,
aunque le digamos que no hace falta.

Hoy ese menú ofrece, entre otras cosas: *Revoke Public Sharing*, *Normalize
Status Column*, *Push Update Live*, *Erase everything — make this a blank
template* y *Check if this copy is a clean template*. **Las dos últimas son
nuestras, no suyas**, y una de ellas borra toda su información. Que un cliente
tenga a dos clics un botón llamado "borra todo" es un accidente esperando.

Repaso pendiente, entrada por entrada, con la misma prueba de fuego: *¿qué pasa
si la pulsa sin entender qué hace?* Lo que no sobreviva a esa pregunta se va
detrás de una contraseña de soporte, o directamente no se le enseña.

## 2. Las sugerencias de PM no salen en Edit Movement ni en Edit Receiving

Jose: *"en Edit Movement y en Edit Receiving no se muestran las sugerencias de
PM's."*

Es el patrón que ya nos mordió tres veces y que está escrito en el archivo:
**comportamiento cableado en un camino y no en los otros**. El campo de PM
sugiere al crear y no sugiere al editar, así que editar un movimiento es
exactamente donde es más fácil escribir el nombre de otra forma — y entonces el
mismo PM queda escrito de dos maneras, que es justo lo que *Check my data* se
pasa el día proponiendo arreglar.

## 3. La categoría tiene que empezar VACÍA

Jose: *"cuando se abre una ventana para crear algún movimiento quiero que la
categoría aparezca vacía y sin nada. Me ha pasado que no recuerdo seleccionar
qué tipo de material es y, como BONEYARD aparece primero en la lista, se queda
así y al guardar me doy cuenta. Entonces no debemos dejar que el cliente se
equivoque."*

**Un desplegable que ya trae una respuesta puesta no está preguntando, está
respondiendo por ti.** Y la respuesta que da es la primera por orden alfabético,
que no tiene ninguna relación con lo que el usuario quería — BONEYARD empieza por
B y por eso gana. Guardar un movimiento en la categoría equivocada ensucia el
stock de dos materiales a la vez: el que no era suma, y el que era no.

El arreglo es una opción vacía al principio y que el guardar se niegue sin
elección — lo segundo ya existe, así que es poco trabajo. **Y hay que buscar el
mismo patrón en los demás desplegables** (unidad, proyecto, proveedor,
ubicación): el que pueda quedarse con un valor que nadie eligió tiene el mismo
problema.

## 4. Incoming: los dos botones de arriba, fijos al bajar

Jose, con la captura: *"quiero que los 2 botones de Incoming se queden pegados en
la parte de arriba cuando baje, porque no puedo hacerlo sin subir otra vez."*

*From an email* y *+ Add Expected*. Con una semana de llegadas en pantalla hay que
subir hasta arriba para añadir una — y lo normal es darse cuenta de que falta una
llegada mientras se mira el jueves.

## 5. El pie de las ventanas, siempre visible

Jose, con la captura de *Receive Material (ENTRY)*: *"quiero que en el Incoming,
Entry, Exit, Transfer y otras ventanas, la parte de abajo con el botón de guardar
o el que sea se vea siempre. Si la pantalla es muy pequeña entonces hay que hacer
scroll, pero si la pantalla es grande no se necesita hacer scroll."*

Y hay una razón de más peso que la comodidad, visible en su propia captura: **el
aviso de error vive en ese pie**. En la imagen dice *"Material 1 needs a name"*
justo al lado de *Save to System*. Si el pie está fuera de la pantalla, el
usuario pulsa guardar, no pasa nada, y el motivo está en un sitio que no ve. Un
mensaje de error que hay que ir a buscar es un mensaje de error que no existe.

Pie pegado abajo en la ventana, con el cuerpo haciendo scroll por dentro. Vale
para todas las ventanas de movimiento, no sólo para ENTRY — y conviene hacerlo
de una vez y en un solo sitio, no ventana por ventana.

# ══ 🔵 DECISIÓN + 🔴 ABIERTO — PANEL DE CLIENTES ══

Jose: *"quiero tener una forma de ver automáticamente y me diga cuándo empezó un
cliente a pagar, el nombre y el correo, y todo lo demás de la app."*

El diseño entero está en **`docs/PANEL-DE-CLIENTES.md`**. Lo que hay que retener
desde aquí:

- **El dinero ya lo contesta Stripe** (cuándo empezó a pagar, nombre, correo,
  plan, tarjeta fallida). No se duplica: se traen sus *webhooks* a una hoja en el
  Drive de Jose y ya está.
- **Lo que de verdad falta es saber si una instalación está viva.** Hoy, de la
  copia de un cliente sólo llega un correo a los 3 y a los 7 días, y **sólo si no
  ha registrado ni un movimiento**. Un cliente sano no manda nada nunca. Un
  cliente roto tampoco. Se ven igual: silencio.
- **Y tenemos la prueba en casa:** tres veces el archivado destrozó datos en OX
  Glass y nos enteramos entre catorce horas y dos días después, por casualidad.
  En la copia de un cliente no nos enteraríamos jamás — nos enteraríamos el día
  de la devolución.
- **El obstáculo es una promesa escrita**, no una dificultad técnica: la política
  de privacidad dice *"exactly four things… nothing else"*. Hay que elegir entre
  no tocarla (y seguir ciegos) o reescribirla ANTES de recoger nada, con la lista
  cerrada, el interruptor y la frontera que lo sostiene todo: **cuánto, nunca
  qué.** Ni un nombre de material, ni una cantidad, ni un documento.

**Primer paso, y no depende de ninguna decisión:** los webhooks de Stripe el día
que se active. Eso solo ya contesta la pregunta literal que hizo.

# ══ ⏸ APLAZADO A PROPÓSITO — PARTIR LA APP EN VARIOS ARCHIVOS ══

> **Hecho de aquí:** el índice del archivo, generado y con prueba (✅ v12.31).

Jose: *"una app profesional no es un solo bloque… ¿no es mejor dividir la app en
bloques y que cada uno tenga su propio archivo?"*

Razonado entero en **`docs/UN-ARCHIVO-O-MUCHOS.md`**. Lo que hay que retener:

- **Apps Script no tiene módulos**: todos los `.gs` comparten un ámbito global.
  Partir da orden, no aislamiento — y añade un problema que hoy no existe, el
  orden de carga de las variables de nivel superior (ya nos mordió:
  `test-use-before-var.js`).
- **El coste se paga en cada actualización de cada cliente.** Hoy son 3 archivos
  pegados a mano; con veinte son veinte. Acabamos de perder un día por olvidar
  UNO de tres.
- **La salida buena es separar cómo se escribe de cómo se entrega:** muchos
  archivos en `src/`, un paso de construcción que los junta en el
  `Code_v3_fixed.gs` de siempre. Se gana el orden, no se paga la entrega, y las
  125 pruebas siguen leyendo el archivo generado sin enterarse.
- **Cuándo**: cuando toque el código alguien más, cuando haya un paso de
  construcción por otro motivo, o cuando el editor empiece a sufrir. **Y por el
  HTML primero** (24.132 líneas contra 13.279, `include()` de serie, y sin el
  problema del orden de carga).
- **Mientras tanto, una hora de trabajo**: un índice al principio de cada
  archivo. Las 68 secciones ya están; falta la lista que diga qué hay y dónde.

# ══ ✅ HECHO (v12.34) — "LOAD MORE" TE MANDABA AL FINAL DE LA LISTA ══

> Hecho entero, y con la segunda mitad que salió al revisarlo: *Load Older
> History* devolvía la tabla a la página 1. Prueba de navegador que mide
> píxeles (`test-no-saltar-al-cargar.js`), comprobada con las dos mutaciones.
> **Queda vivo el resto pequeño**, en la entrada del 2026-10-05.

Jose, probando el archivado en la copia DEMO:

> *"Cada vez que se pulsa el botón Load more se cargan los movimientos, pero la
> vista siempre se va al final, al último movimiento de esos 75 recién añadidos.
> La vista del usuario debe quedarse viendo los movimientos que ya se veían y
> añadir los demás debajo, no debemos irnos hasta el último."*

**La causa está escrita y es deliberada** — `_loadMoreMovements`, tres líneas:

```javascript
_movPage++;
renderMovements();
// Scroll to keep position near the new rows
var tc = document.getElementById('tableContainer');
if (tc) tc.scrollTop = tc.scrollHeight;
```

El comentario dice *"para quedarse cerca de las filas nuevas"* y la línea hace lo
contrario: `scrollHeight` es **el fondo del todo**, así que aterriza más allá de
las 75 recién traídas, en la última de todas. La intención era buena y la línea
hace otra cosa.

## El arreglo

Guardar `scrollTop` **antes** de repintar y devolverlo después. Las filas nuevas
se añaden por abajo, así que todo lo que estaba encima conserva su posición y la
vista se queda clavada donde estaba:

```javascript
var tc  = document.getElementById('tableContainer');
var pos = tc ? tc.scrollTop : 0;
_movPage++;
renderMovements();
if (tc) tc.scrollTop = pos;
```

**Y la comprobación que hay que escribir con él**, porque es lo único que impide
que vuelva: pintar, bajar a una fila concreta, pulsar el botón y comprobar que
esa fila sigue a la misma altura. Medir la posición, no que la línea esté
escrita — la línea ESTÁ escrita ahora mismo, y hace lo contrario de lo que su
comentario promete.

## Y de paso, mirar los otros dos

El mismo patrón puede estar en **"Load Older History"** y en cualquier lista que
crezca por abajo. Si se arregla uno solo, el siguiente que alguien pruebe vuelve
a sorprender.

# ══ 🔴 ABIERTO — TODAVÍA SALTA AL CARGAR MÁS. Medido en el vídeo 2026-10-05 ══

> **El vídeo está analizado. Esto es lo que mide, no lo que parece.**
>
> Fotograma a fotograma, siguiendo el contenido de la tabla por correlación
> vertical:
>
> | Momento | Qué pasa |
> |---|---|
> | **47.03 → 47.05 s** | el contenido se desplaza **−108 px** de golpe, en un solo fotograma. Es el clic en *Load 75 more* |
> | **49.13 → 49.43 s** | **+1 px**. Es el "movimiento muy leve entre las filas" que Jose notó, y es real |
>
> O sea: lo gordo está arreglado —ya no son cinco mil píxeles— pero quedan
> **108 px**, que son como vez y media una fila.
>
> **Y LO QUE NO CONSIGO ES REPRODUCIRLO.** Con la prueba de navegador, poniendo
> la lista AL FONDO DEL TODO —que es la única posición desde la que se puede
> pulsar ese botón, y por tanto la que había que medir— el desplazamiento es
> **0,0 px**. Con filas de altura variable, textos largos y varias líneas,
> también 0,0 px.
>
> **Así que falta algo de su pantalla que mi página falsa no tiene**, y no voy a
> inventarme cuál. Lo que lo resuelve en dos minutos, desde su app, con F12 →
> Console, pegando esto ANTES de pulsar el botón:
>
> ```javascript
> (function(){ var tc=document.getElementById('tableContainer');
>   window._v = function(){ return [tc.scrollTop, tc.scrollHeight, tc.clientHeight,
>     window.scrollY, document.documentElement.scrollHeight, window.devicePixelRatio,
>     Math.round(window.outerWidth/window.innerWidth*100)+'% zoom'].join(' | '); };
>   console.log('ANTES  ', _v());
>   var o=_loadMoreMovements; _loadMoreMovements=function(){ var a=_v(); o();
>     console.log('ANTES  ', a); console.log('JUSTO DESPUÉS', _v());
>     setTimeout(function(){ console.log('MEDIO SEGUNDO DESPUÉS', _v()); }, 500); };
> })();
> ```
>
> Las tres líneas que saldrán dicen cuál de las tres hipótesis es:
>
> 1. **`scrollTop` distinto justo después y luego igual** → el navegador recorta
>    al restaurar porque la altura todavía no está recalculada. Arreglo: repetir
>    la restauración en el siguiente fotograma (`requestAnimationFrame`).
> 2. **`scrollTop` igual pero `scrollHeight` cambia medio segundo después** →
>    algo se carga tarde (miniaturas, tipografía) y empuja el contenido. Arreglo:
>    anclar en una FILA y no en un número de píxeles.
> 3. **El zoom no es 100 %** → alturas fraccionarias, y ahí el +1 px se explica
>    solo. Arreglo: anclar en la fila, igual que el 2.
>
> **Y lo del +1 px se arregla con el mismo ancla**: guardar en qué fila estaba y
> dejarla donde estaba, en vez de guardar un número de píxeles que depende de que
> todo lo de arriba mida exactamente lo mismo que antes.

## Lo anotado el 2026-10-05, antes de ver el vídeo

Jose, después de la v12.34: *"hice la prueba y grabé un vídeo. Aún hay un salto
en la lista al aplastar el botón: al dar clic, la lista se mueve hacia arriba o
hacia abajo un poco, y los demás datos aparecen abajo (eso ya se arregló, ya no
nos vamos al final de la fila)."*

Lo gordo está resuelto —ya no te manda cinco mil píxeles abajo— pero queda un
desplazamiento pequeño, y no vale darlo por bueno: un salto pequeño en cada clic
es la diferencia entre una lista que se lee y una que hay que volver a buscar.

## La hipótesis que hay que descartar PRIMERO, y explica el síntoma entero

**Que quien está haciendo scroll no sea `#tableContainer` sino la ventana.**

`_repintarSinSaltar` guarda y devuelve el `scrollTop` del contenedor de la
tabla. Si en la pantalla de Jose —ancha— la tabla no desborda por dentro y lo
que se mueve es **la página**, entonces el arreglo está devolviendo una posición
que no era la que se movía, y el salto que queda es el de la ventana: repintar
cambia el alto del documento y el navegador reajusta.

Encaja con lo que describe: "se mueve un poco hacia arriba **o hacia abajo**".
Un salto al fondo es un error de lógica; un empujón pequeño en cualquiera de los
dos sentidos es un reajuste de altura.

**Comprobación, dos líneas en la consola del navegador de Jose:**

```javascript
var tc = document.getElementById('tableContainer');
console.log('contenedor desborda:', tc.scrollHeight > tc.clientHeight,
            '· ventana desborda:', document.body.scrollHeight > window.innerHeight);
```

Si el que desborda es la ventana, el arreglo es guardar y devolver **los dos**
(`window.scrollY` además del `scrollTop`), y la prueba tiene que medir también
en una pantalla donde el que se mueva sea el documento. **La prueba actual sólo
mueve el contenedor interior** — por eso está en verde y Jose sigue viendo el
salto. Es, otra vez, medir el caso cómodo.

## Las otras dos, si la primera no era

1. **El alto del contenido cambia por encima de donde estás.** El contador
   ("75 of 1065 records") o el botón del pie cambian de texto, y si alguno pasa
   de una línea a dos, todo lo de abajo baja.
2. **La barra de scroll horizontal.** Si al repintar aparece o desaparece, el
   alto útil cambia unos píxeles y el contenido se recoloca.

**No tocar nada hasta ver el vídeo y el resultado de las dos líneas de arriba.**
Arreglar a ciegas un salto de pocos píxeles es la forma más rápida de añadir un
segundo salto.


# ══ ✅ HECHO (v12.36) — CADA PUBLICACIÓN SE LLAMABA IGUAL ══

Jose, con la captura de *Manage deployments*: *"la app funciona al hacer el
deploy, pero le pone el mismo nombre a cada deploy, debemos hacer que se
diferencie: el número de la versión o el código."*

**Tenía razón en lo que veía y el nombre que había que cambiar no era el que
señalaba** — y la diferencia no es un detalle:

`_findWebAppDeploymentId_` encuentra nuestra implementación **comparando su
descripción letra por letra** con la constante `Acopio Web App`. Es la única
forma que tiene de saber cuál actualizar. Si esa descripción llevara la versión,
a la siguiente publicación no coincidiría, no la encontraría, **crearía una
implementación nueva — y una implementación nueva es una DIRECCIÓN NUEVA**. Todos
los marcadores del almacén apuntando a la vieja, y el aviso diciendo todavía
"esta dirección no cambia nunca".

Así que el nombre va donde se puede: **en la VERSIÓN**, que es la foto congelada
y la que se lee en el desplegable *"Versión 117 del 4 oct 2026"*. Ahora dice
`Acopio v12.36 · build xxxxxxxx · 2026-10-05 14:20`.

Con su comprobación en `test-url-de-la-app.js`, que exige las dos mitades: que la
versión lleve nombre **y que la implementación no lo lleve**. Está escrita para
que nadie "mejore" esto dentro de un año leyendo la petición y no el motivo.


# ══ ✅ HECHO (v12.37) — EL PIE DE LAS VENTANAS, SIEMPRE VISIBLE ══

Jose, 2026-10-04, con un vídeo de *Add Expected Material*: *"si la pantalla tiene
espacio para poner toda la ventana, se lo hace; si no tiene espacio, entonces
vamos a poner los botones en el marco, fijos, para que el usuario no tenga que
hacer scroll para poder dar clic."* Y: *"debemos estandarizar los botones para
que no se hagan más grandes o más pequeños, en especial si hay más botones al
lado, porque se mueven o empujan y se ve poco profesional."*

**Lo que encontró la revisión, y es el patrón de siempre:** la clase
`.modal-actions` existía desde hacía meses y **la ventana que él grabó no la
usaba**. Tenía su propia fila de botones escrita a mano, así que ningún arreglo
que se hiciera sobre la clase le iba a llegar. **Cinco ventanas estaban igual**:
Incoming, Monitor, Edit Movement, Reservar material y Reportar un problema.

Hecho:
1. `.modal-actions` va pegada abajo (`position:sticky`), como `.mhdr` lleva
   pegada arriba desde hace meses. Con `bottom` **negativo**, no 0: lo pegajoso
   se ancla al borde del área de desplazamiento, que incluye el relleno de abajo
   — con `bottom:0` el pie quedaba flotando 28px por encima del borde. Medido.
2. Las cinco filas hechas a mano pasan a usar la clase.
3. El tope de alto sube de 82vh a 90vh: con 82 quedaba hueco de sobra debajo y
   aun así salía barra.
4. **En el pie manda el pie**: todos los botones miden igual —mismo ancho mínimo,
   mismo relleno, misma letra— venga cada uno con la clase que venga. Había un
   `Cancel` de 88px al lado de un `Save` de 120.

`tools/test-pie-de-ventana.js` (17 comprobaciones, de navegador) mide la posición
del pie con el cuerpo arriba del todo y abajo del todo, en una pantalla corta;
comprueba que en la pantalla de Jose la ventana entra entera sin barra; mide que
los botones tengan el mismo alto y ninguno se quede enano; y **cuenta las
puertas**: falla si vuelve a aparecer un pie escrito a mano. Mutación comprobada:
quitado el `sticky`, fallan tres.

**Lo que NO se tocó, y se deja dicho:** con los botones alineados a la derecha,
alargar un rótulo corre al vecino hacia la izquierda. Es inevitable sin anchos
fijos y no es lo que Jose ve — lo que él veía es la fila moviéndose al ponerse a
girar un botón, y eso ya lo resolvía `_btnBusy`, que fija el ancho ANTES de
cambiar el texto. La prueba lo mide y lo imprime como dato, no como fallo.

# ══ ANÁLISIS DE LOS DOS VÍDEOS Y DEL REGISTRO DE CONSOLA. 2026-10-05 ══

> **Jose pidió expresamente NO TOCAR NADA, sólo analizar.** Aquí no hay ningún
> cambio de producto: son hallazgos, con sus medidas y, donde la causa está en
> el código, con la línea.

## 1. EL SALTO AL CARGAR MÁS — y una corrección de lo que yo dije

El registro que mandó Jose es concluyente, y **desmiente mi propia medición del
vídeo anterior**. En las trece pulsaciones, sin una sola excepción:

```
ANTES   4427 | 4980 | 552        DESPUÉS 4427 | 9940 | 552
ANTES   9320 | 9930 | 610        DESPUÉS 9320 | 14850 | 610
ANTES  14230 | 14840 | 610       DESPUÉS 14230 | 19696 | 610
```

**`scrollTop` no cambia. Nunca.** La restauración de la v12.34 funciona.

**Lo que sí se mueve está medio segundo después**, en tres de las trece:

| Justo después | Medio segundo después | Diferencia |
|---|---|---|
| 19017 \| 24440 | 19007 \| 24430 | **−10 px** |
| 33589 \| 39192 | 33579 \| 39182 | **−10 px** |
| 43431 \| 49096 | 43398 \| 49060 | **−33 px** |

**El contenido ENCOGE después de pintarse**, y `scrollTop` baja con él. No es que
la app lo mueva: es que Jose está clavado al fondo —`scrollTop` 4427 de un máximo
de 4428, a un píxel del final— y **cuando la altura total se encoge, el navegador
lo arrastra**. Ésa es la sacudida pequeña, y es la misma causa del "+1 px entre
las filas" que él notó.

**Y corrijo lo mío:** los −108 px que medí en el vídeo anterior **eran un
artefacto de mi medición**. Al fondo del todo, lo que se ve es el contador y el
botón; al cargar, eso se sustituye por filas, y mi correlación emparejó cosas
distintas. El registro manda sobre mi vídeo.

**Y el dato que lo explica todo: `157% zoom`.** A ese zoom las alturas de fila
son fraccionarias; el navegador redondea al pintar y vuelve a redondear cuando
algo se recalcula. Por eso no lo reproduzco al 100 %, y por eso los números son
10 y 33 px y no 0.

**Lo que haría, cuando toque:** anclar en una FILA y no en un número de píxeles
—así da igual que el total encoja—, y además averiguar **qué** encoge medio
segundo después, porque eso mueve la pantalla en cualquier sitio donde alguien
esté mirando el final de una lista.

**Y una consecuencia que va más allá de esto:** todas nuestras pruebas de
navegador corren al **100 % de zoom y dpr 1**. Jose trabaja al **157 %**. Hay una
familia entera de defectos —redondeos, medio píxel, alturas fraccionarias— que
nuestras pruebas no pueden ver. Al menos una prueba debería correr a un zoom
distinto de 100.

## 2. LO QUE JOSE VE, UNO POR UNO

### «los tiempos de aparecer y desaparecer son diferentes» — CIERTO Y MEDIDO

Los avisos de la esquina se piden con **ocho duraciones distintas**: 2000
(`TOAST_QUICK`), 3000, 3500 (el valor por defecto), 4000, 5000, **6000 (28
llamadas)**, 8000 y 12000 ms. Medido en su vídeo: cuatro avisos, **6,1 s cada
uno**, que es el 6000 más el desvanecido.

No es un fallo de ninguno en particular: es que **nadie decidió nunca una regla**.
Debería haber tres: *leído de pasada*, *hay que leerlo*, *hay que decidir algo*.

### «el label del check aparece segundos antes que el movimiento» — CIERTO, Y ES EL DISEÑO

La marca se pinta en el navegador al instante; la fila espera al servidor y al
repintado. Está hecho a propósito —es lo que hace que la app no parezca
congelada— pero **la distancia entre las dos cosas no está acotada**: si el
servidor tarda cuatro segundos, la marca lleva cuatro segundos diciendo "hecho"
sobre una lista que todavía no lo refleja.

### «la selección desaparece cuando aparece un movimiento nuevo» — CIERTO, Y LA LÍNEA ESTÁ LOCALIZADA

`renderMovements` poda `_movSelection`: borra de la selección **todo lo que no se
haya pintado**. Con la página llena, un movimiento nuevo entra por arriba y el
último se cae de la página — y si el marcado era ése, su marca desaparece sin
avisar. La poda es correcta en intención (no dejar seleccionado lo que ya no
existe) pero no distingue *"ya no existe"* de *"se fue a la página siguiente"*.

### «las tarjetas se hacen sólidas sólo en ciertas ocasiones» — CIERTO, Y ES A PROPÓSITO

`_CFG_SOLID_MS = 3500`: una tarjeta **nueva de verdad** sale sólida y a los 3,5
segundos se atenúa. Jose ha leído el diseño exactamente: sólido = acaba de pasar
algo. **Lo que falta no es el comportamiento, es que nada lo diga.**

### «el botón de guardar en el entry salta de tamaño» — HIPÓTESIS CON LA CAUSA A LA VISTA

En su captura del formulario ENTRY, bajo PROJECT / CLIENT aparece *"New project —
not on your list yet · + Add it"*. Ese aviso **aparece y desaparece mientras se
escribe**, cambia el alto del formulario, y en la v12.36 el pie **iba al final
del contenido**: cada vez que el aviso entraba o salía, la fila de botones se
movía. Encaja con "un cambio o salto por un segundo o menos".

**La v12.37 debería haberlo quitado** —el pie ya va pegado abajo— pero eso hay que
comprobarlo en su pantalla, no darlo por hecho.

## 3. LO QUE VEO YO Y NO ESTÁ EN SU LISTA

1. **La tarjeta atenuada se lee ENCIMA de la tabla.** En su vídeo, la tarjeta de
   *NEW PROJECT / STOCK* está translúcida sobre las filas, y se leen las dos a la
   vez: ni se lee la tarjeta ni se lee la fila. Atenuar funciona sobre un fondo
   liso; sobre texto, no. **O va sólida, o se aparta.**
2. **Una extensión del navegador (Grammarly) está metiendo iconos dentro del
   campo de comentarios.** No es nuestro y no se puede evitar, pero conviene
   saberlo: cambia el alto del campo y puede explicar movimientos raros que
   buscaríamos en nuestro código.
3. **El aviso de "New project" empuja el formulario hacia abajo mientras se
   escribe** — el campo que estabas mirando se mueve mientras tecleas. Debería
   reservar su sitio, como se hizo con la barra de herramientas de Movements.
4. **Los avisos se apilan**, y con ocho duraciones distintas dos avisos seguidos
   se van en desorden: el segundo puede irse antes que el primero.

## 4. LO QUE SÍ ESTÁ BIEN, Y CONVIENE DEJARLO ESCRITO

- **El archivado nocturno corrió la v12.33** — la tarjeta lo dice con fecha y
  hora: *"archive start · today at 3:47 AM · nightly archive starting · v12.33"*.
  El sello de la v12.29 hace exactamente su trabajo.
- **El almacenamiento se explica solo y bien**: *"433.620 de 10.000.000 celdas ·
  1.065 movimientos · 15 pestañas. A unos 3 movimientos al día, sitio para más de
  50 años — o menos de un año si tu ritmo sigue creciendo como el año pasado."*
  Dice el número Y lo que significa.
- **La cabecera pegajosa de la tabla aguanta el desplazamiento lateral**: en el
  vídeo la tabla está corrida a la derecha y la cabecera acompaña a sus columnas.
- **Los avisos duran lo que dicen durar**: 6,1 s medidos, cuatro de cuatro.


# ══ ✅ HECHO (v12.38) — "YOU ARE OFFLINE", A LA VISTA ══

Jose, 2026-10-05: *"poner un label (este sí que se vea como los demás arriba en
la pantalla) que diga 'you are off-line' y 'back on-line' o algo así."*

**Lo que había: un punto de color y un `title`.** Nadie pasa el ratón por encima
de un punto. Se sigue trabajando, se sigue escribiendo, y lo que se escriba no se
guarda. Un estado que te puede costar el trabajo no se cuenta en un texto
escondido — y en el backlog hay un incidente de agosto, *"una vez off-line, NUNCA
vuelve solo"*, que se diagnosticó tarde precisamente por eso.

Ahora: barra roja arriba del todo mientras esté caída, que **no se puede cerrar**
—mientras siga siendo verdad, el aviso sigue siendo verdad— diciendo además lo
único que de verdad importa: *que lo que escribas no se guarda* y *que la app lo
sigue intentando sola*. Al volver, verde, "Back online", y **se va sola a los
cinco segundos**: lo contrario que la roja, porque dejó de ser noticia.

Y una pila (`#topBanners`) para las barras de arriba, porque ya había otra —la
del desajuste de versiones— con su propio `position:fixed; top:0`: **con las dos
a la vez una tapaba a la otra, y la que tapaba era justo la de la conexión.**

`tools/test-barra-conexion.js` (19 comprobaciones). Mide las TRANSICIONES, no el
texto: que no salude al arrancar, que salga al caer, que no se tape con la otra,
que se vaya sola al volver, y que `stale`/`loading` no pongan nada. Mutación
comprobada: apagada la rama, fallan siete.

# ══ 🔴 ABIERTO — AGRUPAR LOS AVISOS EN UNA LISTA, COMO GOOGLE ══

Jose, 2026-10-05: *"agrupar todos los loading que aparecen en la esquina inferior
izquierda (si es que hay más de uno) como lo hace Google: pone todos en una
lista, los que se están haciendo tienen un aro girando y los que ya se hicieron
les pone un check verde, y los deja ahí hasta que tú hagas clic en la 'x'."*

**Y resuelve de paso el problema que medí en su vídeo:** los avisos se piden hoy
con **ocho duraciones distintas** —2000, 3000, 3500, 4000, 5000, 6000 (28
llamadas), 8000 y 12000 ms—, así que dos seguidos se van en desorden y nadie
sabe cuánto dura nada. Con una lista que se queda hasta que la cierras, **la
duración deja de ser una decisión**: ésa es la mitad buena de la idea.

Lo que hay que resolver al construirlo:
- **Qué entra y qué no.** Un error que exige decidir algo no puede irse a una
  lista que quizá nadie abra. Propuesta: la lista para el progreso y los hechos;
  los errores siguen pidiendo atención.
- **Hay ya media pieza hecha**: `_prog`, la línea de progreso de las tandas
  ("voy por 4 de 13"), que ya sabe contar y terminar en un check. La lista es su
  hermana mayor, y hay que reusarla, no escribir otra.
- **Y el tope.** Una lista que nunca se vacía sola acaba con cuarenta líneas de
  ayer. Quedarse hasta la 'x' sí, pero con un máximo y con las de hoy primero.

# ══ ANOTADO EL 2026-10-05 (tarde) — MAYÚSCULAS, COLUMNAS Y EL AVISO DE OFFLINE ══

## 1. 🔴 MAYÚSCULAS — y hay que separar dos cosas antes de tocarlo

Jose: *"hay que hacer que PO, Received By, Comments se hagan en mayúsculas
siempre, así como el proyecto, nombre y demás."*

**Hoy, comprobado en `addMovementsBatch_`:**

| Campo | Cómo se guarda |
|---|---|
| Unit | **mayúsculas** (`.toUpperCase()`) |
| Category, Name | como se teclean (`cleanDisplay_`) — pero el **MatId** se calcula con la forma normalizada, que SÍ es mayúsculas |
| GC, PO, Supplier, Received By, Comments | **sólo `.trim()`** — tal cual se teclearon |

**Dos cosas distintas que conviene no mezclar:**

1. **Normalizar para COMPARAR** — ya está hecho donde importa: el identificador
   del material es mayúsculas, así que `Window` y `WINDOW` son el mismo material.
2. **Uniformar para MIRAR** — es lo que Jose está pidiendo, y es lo que no está.

**Mi recomendación, campo por campo:**

- **PO, GC, Received By, Project, Supplier, Category, Name → mayúsculas al
  guardar.** Son etiquetas y claves: nadie quiere dos proveedores por una
  mayúscula, y verlos desparejos en la tabla se ve mal.
- **Comments → NO.** Un comentario es una frase, no una clave. *"2 broken windows
  on arrival"* en mayúsculas se lee peor, y **al guardar en mayúsculas el
  original se pierde para siempre**. Si lo que molesta es que la columna se vea
  despareja, eso se arregla en la pantalla (`text-transform`) sin tocar el dato.

Y lo que hay que hacer sí o sí al implementarlo: **decidir qué pasa con lo ya
guardado.** Mayúsculas sólo en lo nuevo deja la tabla mitad y mitad durante
meses; convertir lo viejo es reescribir el archivo entero, que es justo la
operación que más respeto da en este producto.

## 2. 🟡 ¿QUÉ ES "RAW LOC"? — contestado, y sobra

`{ key:'rawLoc', def:'Raw Loc', w:120 }`, con la ayuda *"The source and
destination fields exactly as recorded"*. Es **origen y destino en crudo**, tal
como están en la hoja, frente a `Src→Dest` que los pinta ya formateados. Viene
**oculta de fábrica**.

**Opinión:** es una columna de diagnóstico con nombre de programador. O se
renombra a algo que signifique algo para un almacén (*"Locations as recorded"*),
o se quita de la lista del usuario y se deja para soporte — que encaja con el
criterio de *"el usuario no administra la app"*.

## 3. 🟡 ¿POR QUÉ LAS OCULTAS SE VEN TRANSPARENTES?

Porque es el **editor de columnas**: con `⚙ Columns` abierto se enseñan TODAS,
y las apagadas van al 45 % (`th.col-edit.col-off{opacity:.45}`) con su 🚫, para
poder volver a encenderlas. Fuera del editor no se ven en absoluto.

**Es correcto, y aun así confunde** — en la captura de Jose parecen columnas a
medio cargar. Un rótulo encima (*"the faded ones are hidden — click to turn them
back on"*) lo resolvería.

## 4. 🟠 LA COLUMNA VACÍA DEL FINAL — Jose tenía razón a medias

`COL_TABLES.mov.tail` añade `<th style="width:44px"></th>`, y las filas ponen
ahí el ✏️ y el 🗑 de cada movimiento. **No es un resto: es la columna de las
acciones de fila.** Pero:

- **La cabecera se dibuja si `_movCanAct()` y la celda sólo si `isAdmin`.** No es
  la misma condición: un usuario que puede editar pero no es ADMIN ve **una
  columna con cabecera y sin nada debajo**. Eso sí es un fallo.
- **La cabecera no tiene rótulo**, así que en el editor de columnas queda un
  bloque oscuro mudo — que es exactamente lo que Jose fotografió.

Arreglo: una sola condición para las dos, y un rótulo (aunque sea una ⚙ o un
`aria-label`) para que no parezca una columna rota.

## 5. 🔴 EL AVISO DE OFFLINE — Jose quiere tarjeta, no barra

Jose, sobre la v12.38: *"quisiera que sea menos invasiva, que sea un toast rojo
que se queda flotando justo donde aparecen los otros; es mejor que una barra que
mueve toda la app para abajo. De esa forma cuando cambia a online se pone verde y
se nota también el cambio."*

**Lleva razón en lo que molesta** —empujar la app entera hacia abajo es mucho
precio— y la idea encaja además con su propuesta de la lista de avisos: **el
estado de la conexión sería la primera línea de esa lista, fija, y las demás
pasan por debajo.** Eso es mejor que las dos cosas por separado.

**Mi única reserva, y es la que hay que resolver al hacerlo:** una tarjeta en la
esquina es más fácil de ignorar que una barra, y lo que no puede pasar es que
alguien escriba diez minutos sin enterarse. Así que la tarjeta, sí, **pero con la
protección de verdad en el sitio donde importa: que al pulsar Guardar estando
sin conexión, el botón lo diga.** Un aviso que se puede no mirar necesita un
segundo aviso donde la persona sí está mirando.

Va junto con la lista de avisos, no antes: hacer la tarjeta ahora y la lista
después sería escribir dos veces lo mismo.


# ══ ANOTADO EL 2026-10-05 (noche) — CUATRO COSAS Y TRES DECISIONES DE JOSE ══

## 1. 🔴 EL BOTÓN "RELEASE" DE LOS MATERIALES RESERVADOS NO DICE NADA

Jose, con vídeo: *"el botón de release de los lock materials no tiene feedback.
No sabemos si está funcionando o no. No se desactiva, nada. El usuario puede dar
doble clic si quiere y no sabemos qué va a pasar."*

**Y lo del doble clic no es una molestia, es la parte seria:** sin apagar el
botón, dos pulsaciones mandan dos liberaciones de la misma reserva. Lo que pase
entonces depende de si el servidor aguanta la segunda, y eso **no lo sabemos
porque nadie lo ha probado**.

El molde ya existe y se usa en media app: `_btnBusy` (que además fija el ancho
antes de cambiar el texto) y `_btnDone` con su ✓. Esto es conectarlo — y de paso
**revisar todos los botones que llaman al servidor**, porque si éste se quedó
fuera, habrá más.

## 2. 🟡 EL LOGO DE ACOPIO EN LOS DOS SITIOS, Y QUE TODO SEA ENLACE

Jose, con dos capturas: la marca de la esquina superior izquierda y la del menú
de la cuenta. Quiere **el logo** junto al nombre, y que **el enlace sea todo el
bloque** —logo y nombre— no sólo las palabras.

Nota al hacerlo: hoy el texto de las dos lo escribe `_syncProductLinks` de una
sola vez, a propósito, *"para que los dos no puedan decir cosas distintas"*. El
logo tiene que entrar por ahí, no pegado a mano en cada sitio.

## 3. ✅ DECIDIDO — "RAW LOC" Y LAS COLUMNAS DE DIAGNÓSTICO SE VAN A SOPORTE

Jose: *"me parece buena idea dejarlas sólo para el soporte, porque el cliente no
las necesita. Además, si tienen la misma información que la otra columna, ¿por
qué está ahí?"*

**Contestando sus preguntas, que son las correctas:**

- **¿Da más información que `Src→Dest`?** Casi nunca. `Src→Dest` pinta
  `origen → destino`; `Raw Loc` enseña los dos campos tal como están guardados.
  Coinciden **salvo** cuando el dato está raro — un espacio de más, una
  ubicación que ya no existe, un movimiento viejo con el formato antiguo.
- **¿Es necesaria para el cliente?** No.
- **¿Es necesaria para nosotros?** **Sí, y justo para eso**: es la única columna
  que enseña el dato sin maquillar, que es lo que hace falta cuando alguien dice
  "este movimiento sale raro".
- **¿Hace algo importante?** No hace nada: sólo muestra.

**Decisión: fuera de la lista del cliente, disponible para soporte.** Va con la
pestaña `Advanced` del criterio *"el usuario no administra la app"*.

## 4. 🟡 LAS COLUMNAS APAGADAS: OPACAS Y EN GRIS, NO TRANSPARENTES

Jose: *"no quiero decirle al cliente por qué están así; quiero cambiarlas. Quiero
que las columnas se pongan opacas, pero no transparentes; tal vez si las pasamos
a tonos de gris queden mejor."*

Tiene razón y es mejor que mi idea de explicarlo con un rótulo: **si hay que
explicar lo que se ve, lo que se ve está mal.** Hoy es `opacity:.45`, que deja
transparentarse lo de detrás y por eso parece a medio cargar. Gris sólido —
fondo apagado, letra gris, el 🚫 en su sitio— se lee como "apagado" sin
explicación.

Y revisar los otros `opacity` del mismo tipo: `.user-inactive`, `.dq-card.dq-done`,
`.ei-card.skipped`, `.rack-card.rack-empty-card`. Son el mismo gesto en cuatro
sitios, y conviene que signifique lo mismo en todos.

## 5. ✅ DECIDIDO — DÓNDE VA EL AVISO DE CONEXIÓN

Jose: *"el toast debe ir como los toast de check verde que aparecen justo debajo
de las pestañas, debe ir ahí, no importa si ocupa más espacio que los toasts
normales y tapa las pestañas, ahí es el lugar correcto."*

Decidido: **debajo de las pestañas**, donde ya salen los avisos de ✓, y se
permite que ocupe más y tape. Va con la lista de avisos, no antes.

## 6. ✅ DECIDIDO — MAYÚSCULAS SÓLO DE AHORA EN ADELANTE

Jose: *"hagámoslo como tú dices, y deja lo que ya está hecho así, no nos
preocupemos por eso; desde ahora debemos mejorar los datos, los de antes ya
pasaron."*

Entonces: **PO, GC, Received By, Project, Supplier, Category, Name → mayúsculas
al guardar. Comments NO** (es una frase, no una clave, y al guardarla en
mayúsculas el original se pierde). **Lo ya guardado se queda como está** y no se
reescribe nada — que además evita tocar el archivo entero, que es la operación
que más respeto da en este producto.

# ══ ✅ HECHO (v12.41) — DOS LISTAS DE USUARIOS, Y LA VIEJA DEJA ENTRAR ══
#    El diagnóstico se conserva aquí; lo que se construyó y por qué no se borró
#    la lista vieja está al final del documento, en la entrada de la v12.41.

Jose, 2026-10-05, con dos capturas de su hoja: *"actualmente tenemos CONFIG con
correos, roles y USERS. ¿Por qué tenemos 2 listas de lo mismo? ¿No sería mejor
hacer una sola? ¿Por qué si desactivo un usuario en USERS no se borra o desactiva
en CONFIG también? Mejor hagámoslo profesional, arreglémoslo para que no haya
errores ni goteos de seguridad."*

**Tiene toda la razón, y es más grave de lo que arreglé en la v12.39.**

## La lista vieja es CONFIG, columnas F y G

En su captura se ve: **columna F = correo, columna G = rol**, diecinueve
personas. Es de donde se migró cuando se creó `USERS_V3`, y **sigue concediendo
acceso**.

La v12.39 arregló *"desactivado en USERS_V3 ya no se cae a CONFIG"*. **Lo que NO
arregla, y sigue abierto: alguien que está SÓLO en CONFIG entra igual** — aunque
no aparezca en Manage Users, aunque nadie recuerde haberle dado acceso, aunque
no se le pueda quitar desde la app porque la app no le enseña.

En la copia DEMO de Jose eso son **diecinueve correos** que entran y que la
pantalla de usuarios no lista.

## Qué hacer, y en este orden

1. **Mirar qué hay.** Un informe —no un borrado— que cruce las dos listas y diga:
   quién está sólo en CONFIG, quién en las dos y con qué roles distintos, y qué
   filas no son correos siquiera (ver abajo).
2. **Migrar de verdad**: cada correo de CONFIG que no esté en USERS_V3 entra como
   fila nueva, con su rol, `Added By = migration` y la fecha. **Sin perder a
   nadie**, que es lo que convierte esto en un cambio seguro.
3. **Dejar de leer CONFIG para decidir acceso.** Ése es el momento en que hay una
   sola lista y el interruptor de Manage Users significa lo que dice.
4. **Y vaciar las dos columnas de CONFIG después**, no antes, para que la
   migración se pueda repetir si algo sale mal.

Con un aviso que hay que decirle a Jose antes de tocarlo: **si alguien entra hoy
sólo gracias a CONFIG y la migración se hace mal, mañana no puede trabajar.** Por
eso el paso 1 es mirar, y por eso el 4 va al final.

## Y de paso, filas corruptas en USERS_V3

En su captura hay filas donde **la columna Email lleva un nombre de persona**
(*"AVERY NDIAYE"*, *"CASEY LINDQVIST"*) y la columna Name lleva un proyecto
(*"GRANITE PARK OFFICES"*). No dan acceso —un nombre nunca va a coincidir con un
correo— pero **salen en la pantalla de usuarios** y ensucian la lista. Hay que
averiguar qué las escribió (sospecha: el generador de datos de demostración) y
limpiarlas.

# ══ ✅ HECHO (v12.43) — SE PODÍA ESCRIBIR UNA UBICACIÓN QUE NO EXISTE ══
#
#    LA DECISIÓN QUE IMPORTA, y no estaba en esta entrada: se comprueba el lado
#    por el que el material LLEGA, nunca por el que se va. Meter material en un
#    sitio que no existe es el fallo; sacarlo de ahí es LIMPIARLO. Si también se
#    hubiera rechazado la salida, las unidades que la app ya metió en `A1P`
#    estarían encerradas ahí para siempre y el arreglo sería peor que el
#    problema. El diagnóstico original se conserva debajo.
#
#    Y el desplegable se partió en dos por el mismo motivo: el de ORIGEN sigue
#    ofreciendo todo donde hay stock —aunque no debiera existir—, el de DESTINO
#    sólo lo real. Una lista que propone lo que el servidor va a rechazar es
#    peor que una lista corta.
#
#    La importación sí crea las que falten —importar es decir "esto es mi
#    almacén tal como está"— pero las escribe en la lista y las cuenta, en vez
#    de crearlas en silencio.
#
#    tools/test-ubicacion-que-no-existe.js — 41 comprobaciones, 3 mutaciones.
#    SIGUE ABIERTO lo de los otros campos libres: proyecto, proveedor,
#    categoría. Mismo agujero, mismas consecuencias, y ahora con el patrón ya
#    resuelto para copiarlo.

Jose, con dos capturas: escribió `A1p` en el rack de un ENTRY —una ubicación que
no existe— y **la app la guardó tal cual**. En el Warehouse Map aparece ahora
`A1P` como una ubicación más, con 3 unidades dentro.

**Es el agujero por donde entra la mitad de la suciedad que luego persigue "Check
my data".** Un campo libre donde debería haber una lista cerrada produce
`A1P`/`A1 P`/`A-1-P`, y a partir de ahí el stock de un estante está repartido en
tres sitios que nadie suma.

Y es peor que un nombre mal escrito: **una ubicación inventada no está en ninguna
estantería**. El material consta en un sitio que no existe.

**Lo que hay que decidir al arreglarlo**, y enlaza con la idea de Jose de abajo:

- **Lo mínimo y seguro:** si lo tecleado no está en la lista, **no se guarda** y
  se dice; con un botón de *"crear esta ubicación"* para quien tenga permiso.
- **Lo que no vale:** crear en silencio, que es lo de hoy.
- Y hay que mirar **los otros campos libres que deberían ser listas**: proyecto,
  proveedor, categoría. El mismo agujero, las mismas consecuencias.

# ══ 🔵 IDEA DE JOSE (V2) — PERMISOS PARA CREAR CADA COSA ══

Jose: *"quiero que la posibilidad de crear nuevos suppliers, locations, projects,
categories se pueda delegar, o sea decidir si alguien puede o no hacer cada uno
de esos, así podemos poner un toggle para cada uno, y luego podemos trabajar para
empezar a crear diferentes tipos de usuarios. Eso sería versión 2."*

**Me parece bien, y encaja con lo que ya existe:** los interruptores por rol
(`rolePerms`) ya funcionan así —`canManageCatalog` es exactamente este permiso,
sólo que en bloque— y la regla ya vive en el servidor, que es lo que lo hace
real. Partir `canManageCatalog` en cuatro es un cambio pequeño sobre algo
probado.

**Dos cosas que yo añadiría cuando se discuta:**

1. **El permiso de crear y el de escribir mal son el mismo problema.** Mientras
   el campo sea libre, quitar el permiso de "crear ubicaciones" no impide
   escribir `A1p`: lo impide **cerrar la lista**. Así que el arreglo de arriba va
   primero, y los permisos encima.
2. **Cuidado con partirlo demasiado.** Cuatro interruptores por rol son cuatro
   decisiones que alguien tiene que entender. Yo empezaría por dos —*catálogo*
   (proyectos, proveedores, categorías) y *almacén* (ubicaciones)— y sólo partiría
   más si alguien lo pide.

# ══ 🔵 DECIDIDO POR JOSE — EL AVISO DE OFFLINE NO VA EN LA LISTA ══

Jose: *"¿qué es la lista de avisos con el offline dentro? Si hablas de la lista
que dije que tiene Google, no quiero el offline ahí; tal vez podemos poner el
offline en Error Log o en System."*

Entendido y corregido: **la lista de Google es para lo que la app está haciendo**
(aros girando, checks verdes), y el estado de la conexión no es una tarea. Van
por separado:

- **El aviso en pantalla**: debajo de las pestañas, donde salen los ✓ (decidido
  el 2026-10-05).
- **El registro**: una línea cuando se cae y otra cuando vuelve, con la hora.
  **En Settings → System**, no en ERROR_LOG — quedarse sin internet no es un
  error de la app, y meterlo en el registro de errores haría que el registro de
  errores dejara de significar "algo va mal".

# ══ ✅ HECHO EN LA v12.41 — UNA SOLA LISTA DE USUARIOS ══

Jose, 2026-10-05, con dos capturas de su hoja: *"actualmente tenemos config con
correos, roles y users… ¿por qué tenemos 2 listas de lo mismo? ¿No sería mejor
hacer una sola? Mejor hagámoslo profesional, arreglémoslo para que no haya
errores ni goteos de seguridad."*

**Tenía razón y el goteo era real.** CONFIG guarda correos y roles en las
columnas F y G —de ahí se migró cuando nació USERS_V3— y `getUserRole` **seguía
dando acceso por esa lista**. En la copia de Jose son **diecinueve correos** que
entran, que Manage Users **no lista**, y a los que por tanto **no se les podía
quitar el acceso desde la app**. Un permiso que no se puede retirar no es un
permiso: es una llave perdida.

Es la hermana del fallo de la v12.39. Ese era "la fila dice desactivado y se
entra igual"; éste es "no hay fila y se entra igual". El mismo trozo de código y
la misma causa: **dos listas que tienen que coincidir sin que nada lo obligue.**

## Lo que se hizo, y por qué no se borró la lista vieja

**No se borra porque esa gente trabaja.** Quitar CONFIG de un día para otro deja
mañana sin app a quien sólo estaba ahí, y en una instalación a medio migrar ésos
son usuarios legítimos. Romperle el martes a alguien es un daño más real que un
correo de más en una hoja que sólo ve el dueño.

En su lugar, **la puerta se cierra sola**: quien llega por la lista vieja entra
—como siempre— y **queda escrito en USERS_V3 en ese mismo momento**
(`adoptarUsuarioDeConfig_`). A partir de ahí es un usuario de verdad: sale en
Manage Users, tiene su interruptor, y el dueño puede apagarlo. La lista vieja
deja de ser una puerta trasera permanente y pasa a ser **un camino de ida que se
recorre una vez por persona**.

Tres cuidados, cada uno por un fallo que ya hemos cometido antes:

- **Se escribe dentro de un `try`.** Corre en el camino por el que entra todo el
  mundo: si apuntar fallara, no puede impedir el acceso de quien tiene derecho.
- **Entra con el rol que tenía y como activo.** No se aprovecha una migración
  para cambiarle nada a nadie.
- **No borra nada.** Ni la lista vieja, ni las filas corruptas.

Y además `revisarUsuarios_`, que mira las dos listas enteras de golpe sin
esperar a que nadie entre, y que **`menuCheckInstallation` ejecuta**: dice cuánta
gente se migró, qué correos tienen un rol distinto en cada lista (manda
USERS_V3) y qué filas de USERS_V3 llevan algo que no es un correo en la columna
del correo —en la copia de Jose hay varias con nombres de persona dentro, que no
dan acceso pero salen en la pantalla.

**El día en que una instalación no tenga correos sueltos en CONFIG, esa rama no
se ejecuta nunca.** Ése es el día en que se puede borrar — con datos, no con fe.

`tools/test-revocar-acceso.js` lo ejecuta (23 comprobaciones).

# ══ ✅ HECHO (v12.45) — LA GUARDIA DE ESCRITURA ERA UNA LISTA DE QUIÉN NO ══

Encontrado el 2026-10-05 al mirar qué costaría el *"otro tipo de usuario"* que
pidió Jose para la v2. **No es un fallo hoy. Es un fallo el día que haya un rol
más**, y por eso se arregla antes y no después.

`requireAuth_` decide si puedes escribir así:

```javascript
if (minRole === 'WRITE' && a.role === 'VIEWER') throw ...
```

Eso no pregunta *"¿puede éste escribir?"*. Pregunta *"¿es VIEWER?"*. Con tres
roles da el mismo resultado, así que nunca se ha notado. Pero **cualquier rol
nuevo pasaría la guardia de escritura sin que nadie lo hubiera decidido**, sólo
por no llamarse VIEWER — y en una app de almacén eso es permiso para mover
material.

Es el tercer caso este mes del mismo patrón: **una guardia que dice que sí.**

**El arreglo:** darle la vuelta. `['ADMIN','WAREHOUSE'].indexOf(a.role) === -1`
→ negado. Una línea, y una prueba que invente un rol que no existe y compruebe
que **no** puede escribir — que es la parte que de verdad cierra esto, porque sin
ella volvemos a tener una regla escrita y no ejecutada.

Y de paso: las dos listas `['ADMIN','WAREHOUSE','VIEWER']` escritas a mano
(`addUser` y el asistente) deberían ser **una constante**, por el mismo motivo
por el que las dos listas de usuarios eran un problema.

# ══ 🔵 LA LISTA DE LA V2 — ahora vive en su propio documento ══

Jose, 2026-10-05: *"estaba pensando que también podemos empezar a trabajar en la
v2, o por lo menos empezar con una lista para la v2."*

Hecha: **`docs/LISTA-DE-LA-V2.md`**. Lleva dentro los números mirados en el
código de lo que costaría *"otro tipo de usuario"* —que Jose pidió hablar antes
de hacer— y recoge las ideas de v2 que estaban sueltas por este backlog para que
no haya dos listas de lo mismo, que es justo el fallo que acabamos de arreglar.

**Pendiente de Jose:** los vídeos de UX/UI que anunció (*"te voy a pasar unos
vídeos para que veas cómo quiero cambiar la app, en especial la UX/UI, pero eso
más tarde o en los próximos días"*). No se apunta nada de eso hasta verlos.

# ══ 🔴 ABIERTO — EL CARTEL DE RESERVAS SE QUEDA VIEJO, Y LA APP CULPA A UN TERCERO ══
#    Jose, 2026-10-06: "anótalo para arreglarlo bien más adelante."
#    CONFIRMADO COMO TAREA PROPIA, no como parche. Cuando se haga va el arreglo
#    de los tres puntos de abajo —el refresco, el mensaje y el repaso del resto
#    de mensajes que suponen la causa— y una prueba, no sólo el primero.

Medido en el vídeo de Jose del 2026-10-05 (`2053-37`), fotograma a fotograma.

## Lo que se ve

1. **8s** — suelta una reserva. Sale el aviso *"Released — KOTTER RESIDENCE at
   B."* y el cartel pasa de 5 reservas a 4. Bien.
2. **18s** — vuelve a pulsar Release. La app contesta: **"Already released —
   someone else got there first. Nothing left to do."**
3. **26s** — pulsa el botón de arriba, *"Release the 2 holding nothing"*.
4. **42s** — sale **"Released 0 reservations — 2 had already been released by
   someone else"**… y el cartel pasa de 3 reservas a 1.

## Lo que pasa de verdad

**No había nadie más.** Jose estaba solo. Las reservas que la app dice que
"alguien se adelantó a soltar" **las soltó él mismo, segundos antes, en esa misma
pantalla**. El cartel de arriba no se refresca con lo que ya ha ocurrido, así que
sigue ofreciendo soltar cosas que ya están sueltas; se pulsa sobre ellas, y el
servidor —que sí está al día— contesta con la única explicación que conoce.

Son dos fallos, no uno, y el segundo es el feo:

- **El cartel se queda viejo.** Ofrece acciones sobre algo que ya no existe. Eso
  es lo que hay que arreglar.
- **El mensaje acusa a alguien que no existe.** *"Someone else got there first"*
  es una conclusión, no un hecho: lo que el servidor sabe es que **ya estaba
  suelta**, no quién la soltó. Y en el caso normal —una sola persona trabajando—
  la conclusión es **falsa**, y manda a buscar un compañero que no ha tocado
  nada.

Y **"Released 0 reservations"** mientras la lista baja de 3 a 1 es lo mismo visto
desde el otro lado: lo que la app cuenta y lo que la app hace no coinciden en la
misma frase. Aunque las dos cosas sean técnicamente ciertas por separado, juntas
sólo se pueden leer como un fallo.

## El arreglo

1. **Refrescar el cartel con lo que acaba de pasar**, igual que la tabla de
   movimientos ya hace al guardar: el servidor sabe cómo queda la cosa y puede
   decirlo en la misma respuesta.
2. **Decir lo que se sabe y no lo que se deduce.** *"That reservation was already
   released"* y, si de verdad consta quién la soltó, decir quién. Nunca *"someone
   else"* por descarte. El registro de reservas guarda quién suelta: si el que
   suelta es el mismo que pregunta, la frase correcta es **"you already released
   this one"**.
3. **Y revisar el resto de mensajes del archivo buscando el mismo patrón**:
   afirmar la causa cuando sólo se conoce el efecto. Es hermano de *"una guardia
   que dice que sí"* — aquí es *"un mensaje que supone"*.

**Tamaño:** pequeño. **Es el ejemplo más limpio que tenemos de por qué los
vídeos de Jose valen más que nuestras pruebas**: un fallo de refresco más un
mensaje engañoso, en una pantalla que todas nuestras pruebas dan por buena
porque, por separado, cada pieza funciona.

# ══ 🔵 DECIDIDO POR JOSE (2026-10-05) — PERMISOS POR PERSONA, NO POR ROL ══

Jose, sobre la nota de la `LISTA-DE-LA-V2.md`: *"«los interruptores por persona
en vez de por rol» OK entonces creo que esto está mejor, permisos por usuario."*

**Decidido, y cierra tres cosas de golpe:**

- Lo que pedía como *"otro tipo de usuario"* — ya no hace falta un cuarto rol
  para que dos personas de bodega puedan cosas distintas.
- Su idea de *"delegar crear suppliers, locations, projects, categories"* — pasa
  a ser una fila de interruptores en la ficha de cada persona.
- Y la pantalla ya la enseñó él mismo en uno de los vídeos de referencia
  (*Collaboration access*): la lista de gente con su permiso al lado.

**Lo que hay hoy, para no partir de cero:** `DEFAULT_ROLE_PERMS` ya tiene cuatro
interruptores (`canSeeCosts`, `canEditMovements`, `canManageCatalog`,
`canExportData`) y la regla **ya vive en el servidor**, que es lo que la hace
real. Lo único que cambia es **dónde se guardan**: hoy en una propiedad del
script (`ROLE_PERMS_WAREHOUSE`), y pasarían a columnas de USERS_V3.

**Tres cuidados cuando se construya, cada uno por algo que ya nos ha pasado:**

1. **Los roles NO desaparecen.** Siguen siendo el valor por defecto de una
   persona nueva; los interruptores sólo se apartan de ese valor. Quitar los
   roles obligaría a decidir diez cosas para dar de alta a alguien.
2. **Migrar sin cambiarle nada a nadie.** El día del cambio, cada persona tiene
   que quedarse exactamente con lo que podía hacer el día antes. Es la misma
   regla que en la adopción de usuarios de la v12.41, y por el mismo motivo.
3. **Una prueba que invente un permiso que no existe** y compruebe que **no**
   concede nada. Sin eso volvemos a *una guardia que dice que sí*, que es el
   fallo que llevamos todo el mes encontrando.

**Y va DESPUÉS de dar la vuelta a la guardia de escritura**, que es de una línea
y está más arriba en esta lista.

# ══ 🔵 DECIDIDO POR JOSE (2026-10-06) — LOS INFORMES, EN LOS TRES SITIOS ══

Pregunté: *"¿quien lleva las cuentas en OX Glass va a entrar a la app, o
preferiría el informe por correo el día 1?"* Jose: **"prefiero que se pueda ver
en los 2 lados, enviado por correo si se requiere o descargar en la
computadora."**

Decidido, y **es la respuesta correcta**: son tres salidas del MISMO informe, no
tres informes.

**La consecuencia de diseño, que es lo que hay que escribir antes de construir
nada:** el informe se calcula **una vez, en el servidor**, y devuelve datos. Las
tres salidas son tres formas de pintar esos datos:

- **En pantalla** — una pestaña Reports con la lista dentro y su rango de fechas.
- **Por correo** — el mismo cálculo, pintado en HTML, cuando alguien lo pide.
  (Y el día que se quiera automático el día 1, ya está hecho: es el mismo
  cálculo con un disparador delante.)
- **Descargado** — el mismo cálculo, en CSV o PDF.

**Lo que NO se hace:** tres funciones que calculen lo mismo por separado. Es el
patrón que ya nos ha mordido cuatro veces este mes —*dos cosas que tienen que
coincidir sin que nada lo obligue*— y aquí el fallo sería el peor de todos: **el
informe de la pantalla y el del correo diciendo cifras distintas del mismo mes**,
delante de quien lleva las cuentas.

**Una prueba desde el primer informe**: que las tres salidas vengan de la misma
llamada y den los mismos totales. Si eso no se puede comprobar, están separadas.

Qué informes y en qué orden: `LO-QUE-FALTA-EN-LA-APP.md`, confirmado desde fuera
por el competidor en `COMPETIDOR-EXCEL.md`.

# ══ 🔴 ABIERTO — LAS 20 COMPROBACIONES DE SEO DEL SITIO ══

Jose, 2026-10-06, con una imagen de 20 comprobaciones: *"verifica si las
necesitamos y si ya las tenemos… luego haz un plan."*

**Hecho y comprobado contra el sitio publicado, fichero por fichero:
`docs/SEO-DEL-SITIO.md`.** Aquí sólo el resumen y lo que hay que hacer.

## El hallazgo gordo, y es más que SEO

**Las cuatro páginas principales —incluida la portada— no tienen
`<meta viewport>`, ni `<!DOCTYPE html>`, ni `<html lang>`, ni `<meta charset>`.**
Empiezan directamente en `<title>`. Las cinco de `docs/` sí lo tienen, porque las
construye `build-site.js` con un molde; **las cuatro escritas a mano son las que
no**.

Sin `viewport`, un teléfono dibuja la página a ancho de escritorio y la encoge.
**Jose manda el enlace por WhatsApp: el comprador lo abre en el móvil y lo
primero que ve es una página de escritorio reducida.**

## Cómo está la lista

- **Ya se cumplen (9):** sin `noindex`, orden de encabezados, texto alternativo
  (sólo hay una imagen en todo el sitio y lo tiene), enlaces internos, enlaces
  rotos (con prueba automática), URLs limpias, HTTPS en el contenido, y los
  títulos y el H1 único **con dos peros**: el `<title>` de la portada es
  *"Acopio"* a secas, y `docs/instalacion.html` tiene **dos H1**.
- **Faltan y hacen falta (6):** viewport/móvil, `og:image`, descripciones,
  canonical, sitemap + robots, y datos estructurados.
- **Faltan y NO corren prisa (3):** `llms.txt` —y conviene decirlo: **es una
  convención propuesta, no un estándar; ningún buscador la exige**—, Core Web
  Vitals (no se mide hasta arreglar el viewport, o se mide el sitio roto) y
  comprimir imágenes (hay dos ficheros; el favicon pesa 24 KB y se carga en las
  11 páginas).
- **Sólo puede hacerlas Jose (2):** Enforce HTTPS y Search Console. **Lo intenté
  y no pude**: desde esta máquina el sitio no responde y la ruta de la API de
  GitHub está bloqueada. Las instrucciones click a click están en el documento.

## El plan, en orden

1. **La cabecera de los cuatro ficheros de `landing/` + el molde de
   `build-site.js`.** Una sola tarea que cubre **6 de las 20** y el fallo de
   fondo. Una tarde.
2. **La imagen de compartir** (1200×630). Sin ella, el paso 1 apunta a nada.
3. **`sitemap.xml`, `robots.txt` y `llms.txt` GENERADOS POR `build-site.js`** a
   partir de la lista que ya tiene. A mano no: sería otra lista que tiene que
   coincidir con la de al lado sin que nada lo obligue.
   **Y con `tools/test-site-seo.js`**, que compruebe que cada página publicada
   lleva su título, descripción, canonical, viewport y doctype, y que el sitemap
   tiene exactamente las páginas que hay. Sin esa prueba, esto se cumple hoy y se
   incumple en la tercera página nueva.
4. **El `ld+json`** de la portada.
5. **Los pequeños**: el segundo H1, los dos enlaces relativos de los changelogs,
   y adelgazar el favicon.

**Y lo que la lista no cubre, dicho para que el plan no se lea mejor de lo que
es:** las 20 son fontanería. Ninguna hace que alguien busque Acopio. Hacen que,
cuando alguien busque, el sitio no se descalifique solo, y que cuando Jose mande
el enlace, se vea serio.

# ══ ✅ HECHO (v12.44) — EL CORREO DIARIO INFORMABA DE UN DÍA QUE NO HA PASADO ══
#
#    Y MI PRIMERA HIPÓTESIS ERA FALSA. Dije que sería la zona horaria del
#    proyecto; Jose la miró y es GMT-06:00 Denver, la correcta. El fallo era
#    otro y peor: la hora del disparador se guardaba en una PROPIEDAD, y
#    `ensureDailyReportTrigger_` comparaba la propiedad con los ajustes en vez
#    del disparador — que es imposible de consultar, porque un Trigger de Apps
#    Script no sabe decir a qué hora corre. Las dos se separaron, la nota decía
#    16, el disparador salía a las 2, y la función miraba la nota.
#
#    Arreglado quitando el sitio donde se podían separar: el disparador corre
#    CADA HORA y el código decide. Más la regla del día (mañana → el día que
#    acabó; tarde → el día que está acabando) y la fecha en formato de EE. UU.
#
#    tools/test-informe-diario-hora.js — 32 comprobaciones, 4 mutaciones.
#    El diagnóstico original se conserva debajo, con la hipótesis equivocada
#    incluida, porque equivocarse en la zona horaria fue lo que llevó a mirar
#    la propiedad.

Jose, 2026-10-06, con tres capturas: *"4pm y 2:53 am no son la misma hora;
también está enviando los movimientos del día 6 de octubre a las 2 am, cuando el
trabajo de ese día aún no ha empezado. Y el del día anterior, a la misma hora,
dice que no hay movimientos — pero ayer sí hubo, sólo que entre las 7 am y las
4 pm."*

**Tiene razón en las tres, y juntas significan algo peor que lo que parecen:
los movimientos de un día de trabajo NO SE INFORMAN NUNCA.** El correo sale, se
ve bien, y siempre dice que no pasó nada. Un informe que miente en silencio es
peor que un informe que falta: éste lleva meses llegando y nadie sospecha.

## Son dos fallos distintos, y el segundo es el de fondo

### A. La hora a la que de verdad se dispara

Settings dice **4:00 PM**. El correo llegó a las **2:53 AM** — en los dos días
de las capturas, a la misma hora.

`ensureDailyReportTrigger_` crea el disparador con
`.atHour(cfg.hour)`, y **Apps Script interpreta esa hora en la zona horaria DEL
PROYECTO DE SCRIPT**, no en la de la persona ni en la de la hoja. El minuto 53
encaja con cómo funcionan estos disparadores: se dispara en un momento
cualquiera dentro de la hora elegida.

**Lo que hay que comprobar antes de tocar nada** —y no lo puedo ver desde aquí—
es qué zona horaria tiene el proyecto de Jose: Extensiones → Apps Script →
⚙️ Configuración del proyecto → *Zona horaria*. Si no es la de Utah, ahí está la
diferencia entera, y la misma diferencia afecta a **los otros tres trabajos
automáticos** (copia de seguridad, archivado nocturno, informe de la mañana),
que nadie ha mirado con esta lupa.

### B. El informe siempre cuenta "hoy", corra cuando corra

Y éste no depende de ninguna zona horaria: es un fallo de diseño.

`dailyReportMovements_` filtra por `Utilities.formatDate(new Date(), tz,
'yyyy-MM-dd')` — **el día en que el correo se está enviando**. Eso sólo es
correcto si el correo sale por la tarde. A las 2 de la mañana del día 6, "hoy"
es el día 6, que lleva tres horas empezado y no tiene nada dentro. **Y el día 5,
con sus movimientos de 7 am a 4 pm, no lo cuenta ningún correo: ni el del 5 —que
salió antes de que ocurrieran— ni el del 6, que sólo mira el 6.**

**El arreglo no es mover la hora.** Es que el informe cubra **una ventana
explícita** y diga de qué día habla, en vez de dar por hecho que "hoy" y "el día
del que informo" son lo mismo. Si sale de madrugada, informa del día anterior
completo; si sale por la tarde, del día en curso.

Y mientras no esté arreglado, **el `(no movements)` del asunto es una
afirmación falsa**, no un dato que falta.

### C. La fecha, en formato de Estados Unidos

Jose: *"la fecha debe estar siempre en formato de EE. UU., la del título y la
del mensaje."*

`runDailyReport_` usa `'dd/MM/yyyy'`, así que el 6 de octubre sale `06/10/2026`
y se lee como 10 de junio. Tiene que ser **`MM/dd/yyyy`**.

Una línea — **pero hay que repasar todas las fechas que salen de la app hacia
fuera** (correos, informes, lo que se imprima) con el mismo criterio, no sólo
ésta. Una app que escribe la fecha de dos maneras es peor que una que la escribe
mal siempre.

## Tamaño

La fecha, cinco minutos. La ventana explícita, medio día **con su prueba** —y la
prueba es la mitad que importa: tiene que correr el informe a las 2 de la mañana
y a las 4 de la tarde y comprobar que los dos cuentan el día que les toca. La
zona horaria, una comprobación de Jose y luego lo que diga.

# ══ 🔵 IDEA DE JOSE — EL CORREO DIARIO, CON LO QUE DE VERDAD HACE FALTA ══

Jose, 2026-10-06: *"no solo quiero que envíe los movimientos del día, también
quiero que envíe más información que el usuario puede necesitar: quiénes
estuvieron conectados, el stock bajo, los incomings (si los recibieron y no
hicieron el entry, y también si lo hicieron)… cada una de esas cosas debe ser
seleccionada desde Settings para que el admin decida si quiere todos esos datos
o sólo los más importantes. ¿Qué piensas de la idea?"*

**Me parece buena, y el acierto es el interruptor por sección.** Un correo que lo
lleva todo deja de leerse a la tercera semana, y entonces no sirve ni para lo que
servía. Que lo decida cada instalación es lo correcto.

## Las secciones, y mi opinión de cada una

| Sección | ¿Vale la pena? | Por qué |
|---|---|---|
| **Movimientos del día** | ✅ es lo que ya hay | — |
| **Stock bajo** | ✅ **la más valiosa de todas** | El mínimo ya existe y hoy sólo se ve si alguien abre el Dashboard. En un correo, llega a quien compra |
| **Incoming esperado que llegó y NO se registró** | ✅ **la segunda** | Es la única que señala **trabajo sin hacer**. Las demás cuentan lo que pasó; ésta dice lo que falta |
| **Incoming que sí se registró** | 🟡 a medias | Ya aparece en los movimientos del día. Sólo tiene sentido si se enseña **junto a lo que faltaba**, como "3 de 5 entregas registradas" |
| **Quién estuvo conectado** | 🟡 con cuidado | Ver abajo |
| **Cuánto tiempo estuvo cada uno** | ❌ **no** | Jose ya dudaba, y tiene razón: eso no es un dato de almacén, es un control horario. Convierte el correo en otra cosa, y es la clase de dato que incomoda a quien aparece en él. Si hace falta, que viva en la app y que no lo mande nadie por correo |

## Lo que yo añadiría, que Jose no nombró

- **Ajustes (ADJUST) del día, con su motivo.** Son las correcciones de conteo:
  cada uno dice que una cifra estaba mal. Es lo primero que mira alguien que
  desconfía de los números.
- **Desperdicio (WASTE) del día.** Es dinero, y hoy no se ve en ninguna parte
  salvo un total que nunca se reinicia.
- **Lo que no se movió en N meses**, una vez por semana y no a diario.

## Las dos reglas de diseño, antes de construir nada

1. **Una sección que no tiene nada que decir NO SE IMPRIME.** El interruptor
   decide si la sección puede salir; los datos deciden si sale. Un correo con
   seis títulos y cinco "nada que informar" enseña a no leerlo.
2. **Un solo cálculo, tres salidas.** Ya está decidido el 06/10 para los
   informes: lo que va en el correo tiene que salir del mismo cálculo que lo que
   se ve en pantalla y lo que se descarga. Si no, el correo y la pantalla dirán
   cifras distintas del mismo día.

**Y una advertencia sobre "quién estuvo conectado":** hoy el correo le llega al
admin **y a la lista que él escriba**, que puede incluir gente de bodega. Una
lista de quién entró y quién no, repartida por correo todos los días, es
vigilancia, no un informe de almacén — y encima sale de la empresa en cuanto
alguien reenvía el correo. Si se hace, que sea **sólo al admin**, y que el
interruptor lo diga con esas palabras.

**Esto va DESPUÉS de arreglar la hora y la ventana.** Añadirle secciones a un
informe que informa del día equivocado es multiplicar el error por seis.

# ══ ✅ HECHO (v12.44) — DOS PESTAÑAS SIN NOMBRES EN LAS COLUMNAS ══
#    "Check installation" llama ahora a ensureCoreSheets_ y dice lo que reparó.
#    Jose: córrelo una vez y RESERVATIONS y AUDIT_LOG recuperan sus nombres.

Jose, 2026-10-06, con dos capturas: `RESERVATIONS` está vacía del todo y
`AUDIT_LOG` tiene datos, **y ninguna de las dos tiene nombres en las columnas**:
sólo la fila azul del encabezado, en blanco.

## La causa, encontrada — y es la de siempre

`ensureCoreSheets_` **sí** tiene los nombres de esas columnas escritos
(`'Timestamp','Action','User','Details','Old Value','New Value'` para AUDIT_LOG,
y nueve para RESERVATIONS), y `fillMissingHeaders_` **sí** sabe rellenar los
huecos de una hoja que ya existe sin tocar lo que tenga texto.

**El problema es que a esa función no la llama nadie salvo el asistente de
instalación.** Buscado en el archivo: `ensureCoreSheets_(ss)` aparece **una sola
vez**, dentro de `saveSetupWizard`. Así que una instalación que ya existía —la de
Jose— no va a recibir esos nombres nunca, por mucho que el código los tenga.

**Es el cuarto caso este mes del mismo patrón: una protección escrita y nunca
ejecutada.** Y es más irónico de lo normal, porque el comentario que hay encima
de `fillMissingHeaders_` cuenta exactamente este daño:

> *"Jose estuvo a punto de borrar las columnas U y V de su archivo —Unit Cost y
> Total Cost— precisamente porque sus cabeceras estaban en blanco y no había
> forma de saber qué eran. Una columna sin nombre en una hoja de cálculo parece
> basura, y alguien acaba limpiándola."*

El arreglo escrito para ese daño **no puede llegar a la hoja donde ese daño
ocurrió**.

## El arreglo

**Una línea:** que `menuCheckInstallation` llame a `ensureCoreSheets_(ss)` y
cuente lo que reparó, como ya hace con todo lo demás. Es la función que la gente
ejecuta cuando quiere saber si su instalación está sana, y "a dos de tus
pestañas les faltan los nombres de las columnas" es exactamente eso.

**Y la prueba que falta, que es la que impide que vuelva a pasar:** que ninguna
reparación quede sin alguien que la ejecute. Hoy no hay nada que lo compruebe, y
por eso ésta llevaba aquí desde que se escribió.

# ══ 🔵 PREGUNTA DE JOSE — UN CHAT DENTRO DE LA APP, ¿CON GOOGLE CHAT? ══

Jose, 2026-10-06: *"¿recuerdas cuando te dije que creáramos un chat dentro de la
app? Google tiene una página en Workspace que dice «Build a Google Chat app with
Google Apps Script». ¿Será que se puede? Podemos intentarlo para alguna versión
futura, ¿qué piensas?"*

**Lo que sé, y lo digo separado de lo que habría que comprobar.**

## Sí se puede, y no es lo que buscamos

Sí: se pueden construir aplicaciones de Google Chat con Apps Script. Hace falta
un proyecto de Google Cloud con la API de Chat configurada — el mismo trámite que
ya nos cerró la puerta de la activación automática de la app web, y que está
contado en `selfActivateWebApp_`.

**Pero hay una pega que decide el asunto, y no es técnica: Google Chat es un
producto de Workspace.** Un cliente con dominio propio lo tiene. Un cliente con
Gmail personal, no — y ésos son los escenarios C y D de `VENTAS.md`, que no son
el caso raro.

O sea que sería **un chat que sólo funciona para algunos clientes, instalado
aparte, en otra aplicación distinta de Acopio**. Eso no es "un chat dentro de la
app": es mandar a la gente a otro sitio.

> **Lo que habría que comprobar antes de decidir nada**, y yo no puedo desde
> aquí: si hoy se puede publicar una app de Chat para un dominio concreto sin
> pasar por la revisión de Google, y qué pide exactamente. Eso cambia cada año y
> no me lo voy a inventar.

## Lo que yo haría en su lugar, y es más barato

**Un chat dentro de Acopio.** Una pestaña, una hoja `MESSAGES` y el latido que ya
existe —la app ya sabe quién está conectado ahora mismo, eso está construido—.

Ventajas que no son pequeñas:

- **Funciona para todos los clientes**, con dominio o sin él.
- **No hay nada que instalar aparte.**
- **Los mensajes viven en la hoja del cliente**, que es exactamente lo que
  promete la política de privacidad. Un chat en Google Chat guarda las
  conversaciones en Google, no en su Drive.
- Y puede estar **pegado al trabajo**: un mensaje colgado de un movimiento o de
  un estante vale más que un chat suelto.

**Lo que no hay que fingir:** un chat hecho así no va a ser instantáneo. Apps
Script consulta cada pocos segundos, así que un mensaje tarda. Para "¿queda
sellador en B2A?" sirve de sobra; para una conversación seguida, no — y hay que
decirlo antes de construirlo, no después.

**Para la v2, y detrás de los informes.** Un almacén sin informes y con chat es
un almacén que sigue sin saber qué tiene.

---

# DOCUMENTOS ADJUNTOS — DOS COSAS QUE JOSE YA HABÍA DICHO (2026-10-12)

Jose: *"ya habíamos hablado de eso antes"* — de las dos. **Tenía razón, y no
estaban anotadas.** Por eso se perdieron. Aquí quedan, con la causa medida.

## 1 · La vista previa recorta el documento por ARRIBA y no deja llegar

Jose, con captura: la cabecera de la vista previa *"no deja ver todo el
documento"*. En su captura falta la parte de arriba del Bill of Lading —el
logo de ANDERSEN y la cabecera— y **hay barra de scroll, pero no sube**.

**CAUSA, y no es la cabecera.** La cabecera está en una columna flex y no
monta sobre nada. El fallo está en el contenedor de la imagen del PDF
(`holder`, dentro de `openMediaPreview`):

    display:flex; align-items:center; overflow:auto

Centrar con `align-items:center` un hijo MÁS ALTO que su caja empuja su
principio fuera del área visible **y el scroll no lo alcanza**. Es un
comportamiento conocido de flexbox: el desbordamiento por el lado del inicio
no es alcanzable. La barra aparece, mueve lo de abajo, y lo de arriba se
queda inaccesible para siempre.

**Arreglo:** centrar con `margin:auto` en el hijo en vez de `align-items` en
el padre, o usar `justify-content:safe center`. Las dos conservan el centrado
cuando la imagen CABE, y dejan de recortar cuando no.

**Comprobado de paso:** la rama de imagen suelta (sin PDF) **no** tiene este
problema — medido, 720px de imagen en 720px de caja, sin recorte. Es sólo el
camino del PDF, que mete una barra de aviso de más y deja al `holder` sin
altura definida contra la que resolver el `max-height:100%` de la imagen.

## 2 · Las fotos pasadas a PDF salen con media hoja en blanco, y giradas

Jose: *"todas las fotos que se hacen pdf salen mal, no ocupan toda la hoja,
siempre hay una parte en blanco… y además la última imagen que subí se movió
y sale en landscape"*.

**LAS DOS SON LA MISMA CAUSA, y conviene verlo junto.**

`photosToDocPdf_` mete las fotos en un Google Doc y exporta ese Doc. Escala
con:

    scale = Math.min(PAGE_W / origW, PAGE_H / origH)

Eso es "contener": la imagen entra entera y toca UN borde, nunca los dos. Si
la foto es más ancha que alta, llena el ancho y deja blanco abajo.

**Y por qué es más ancha que alta aunque la tomaras de pie:** un teléfono
guarda la foto como un mapa de bits APAISADO más una marca EXIF que dice
"gírala 90°". Quien respeta el EXIF la enseña derecha; **`appendImage` de
Google Docs no lo respeta** y usa el mapa de bits crudo. De ahí salen las dos
quejas a la vez:

  · entra apaisada  → *"sale en landscape"*
  · apaisada en una hoja vertical → limita por el ancho → *"parte en blanco"*

**Y queda un resto aunque se arregle el EXIF:** una foto 4:3 de pie tiene
proporción 1,333 y la hoja Carta 1,294. Siguen sobrando dos tiras finas a los
lados. Un Google Doc tiene UN tamaño de hoja para todo el documento, así que
con fotos de orientaciones distintas no hay tamaño que sirva para todas.

**Los dos arreglos, en orden de valor:**

1. **Enderezar la foto en el NAVEGADOR antes de subirla**: dibujarla en un
   canvas aplicando su orientación EXIF y volver a codificarla. Arregla el
   giro en TODAS partes —la vista previa, la miniatura, el PDF— no sólo aquí,
   y de paso la foto pesa menos. Es el que vale la pena.
2. **Dejar de pasar por Google Docs.** Construir el PDF desde HTML
   (`Utilities.newBlob(html,'text/html').getAs('application/pdf')`) permite
   una hoja por imagen CON EL TAMAÑO DE ESA IMAGEN, y entonces no sobra
   blanco en ninguna. Es más trabajo y toca un camino que hoy funciona.

**Nota sobre la vista previa de varias páginas:** Jose ya sabe y acepta que
sólo se vea la página 1 (Drive la renderiza del lado del servidor; el visor
de PDF de Chrome es un plugin y no arranca dentro del marco aislado en el que
Apps Script sirve la app). Eso NO es lo que pide arreglar.

---

# AUDITORÍA DE COLUMNAS — LO QUE QUEDÓ ABIERTO (2026-10-06)

La auditoría entera está en `docs/AUDITORIA-DE-COLUMNAS.md`. Aquí sólo lo que
hay que hacer y en qué orden, para que no se pierda.

## ✅ Sin riesgo — LAS CINCO, HECHAS EN LA v12.54 (2026-10-09)

Jose: *"Primero las 5 sin riesgo"*. Las cinco están en la v12.54, con
`tools/test-cinco-sin-riesgo.js` (68 comprobaciones) detrás. Lo que salió
distinto de como estaba escrito abajo, y por qué:

- **La nota de `RESERVATIONS` no se añadió: se CORRIGIÓ.** La hoja está en el
  grupo "calculada" de `gruposDeFormato_`, así que ya tenía nota — y decía
  *"Rebuilt by Acopio from MASTER_ARCHIVE_V3. Edits here are overwritten."*
  **Ninguna de las dos frases es verdad.** Quien abriera esa pestaña vacía con
  esa nota encima sólo podía concluir que la app le había borrado sus reservas.
  Hizo falta `notasPorHoja_()`, una excepción por hoja sobre la nota del grupo.
  Una nota falsa es peor que ninguna, porque se lee como información.
- **Renombrar `AUDIT_LOG` E/F hizo falta código nuevo.** `fillMissingHeaders_`
  rellena HUECOS y nunca pisa texto, a propósito —una cabecera escrita es de
  quien la escribió— así que un nombre que estaba mal desde el principio no se
  arreglaba nunca por esa vía. `renombrarCabeceras_` toca la celda **sólo si
  dice exactamente el nombre viejo**: si el cliente la renombró a mano, es suya.
- **El arreglo del total trajo dos cosas que no estaban en el plan.** Una,
  `AUTO_REPAIR_TOTAL_COST` en `SYSTEM_EVENT_LABELS`: sin eso la fila se escribe
  en `AUDIT_LOG` y la app no la enseña nunca — dinero corregido en silencio, que
  es justo lo que no se puede hacer con dinero. Dos, las filas del histórico se
  anotan aparte (`archive-history rows 2`) porque el botón *Show the movement*
  abre filas **del archivo**: un `2` suelto llevaría a un movimiento que nadie
  tocó.
- **Se fue también `var now = new Date()`** de `refreshDerivedSheets_`: lo único
  que lo usaba eran las tres columnas `Last_Updated`.
- **El aviso de `CONFIG` NO repara.** Leer varios `Admin Email` significa decidir
  qué pasa con dos admins distintos, y eso cambia a quién obedece la app. El
  aviso dice la columna, los números de fila y cuál está en uso; mover el valor
  lo decide una persona.
- **Lo que sigue abierto de este punto:** leer H y N de más de una fila (las dos
  decisiones de arriba), que es lo que haría el aviso innecesario.

<details>
<summary>El plan original, tal como estaba escrito el 06/10</summary>

1. **`Total Cost` en la pasada de auto-reparación.** Es `Qty × Unit Cost` y es
   la única de las tres columnas derivadas del archivo que **nadie vigila**:
   `Status` y `Mat ID` tienen reparación, ésta no. Corregir a mano un `Unit Cost`
   en el Sheet deja `Total Cost` mintiendo para siempre. Unas líneas en la misma
   pasada que ya arregla las otras dos. **Esto arregla un fallo, no limpia.**
2. **Las 5 columnas muertas de las hojas calculadas** — `LIVE_STOCK` G
   (`Location_Type`, siempre el texto `RACK`) y H (`Last_Updated`),
   `SITE_STOCK` F (`Status`, siempre `At Site`) y G, `WASTED_STOCK` E. Se
   escriben en cada reconstrucción y **no las lee nadie**. Coste cero: esas
   hojas se reescriben enteras. **Antes hay que preguntar si algo externo
   (fórmula, Looker Studio, Excel) las lee por letra de columna.**
   · `SITE_STOCK` C (`Project`) **NO se quita**: la app no la lee hoy, pero es lo
   único que dice de qué obra es el material en obra, y la pantalla que la va a
   necesitar ya está en esta lista.
3. **`CONFIG` H y N avisan si están en la fila equivocada.** `Admin Email` y
   `Archive Cutoff Months` sólo se leen de la primera fila de datos
   (`if (row[7] && i === 1)`). Escribirlos más abajo no da error: la app no los
   ve y nada lo dice. Que *Check installation* lo diga con el número de fila.
   Mismo patrón que el informe diario: dos cosas que deben coincidir sin que
   nada lo obligue.
4. **Nota en A1 de `RESERVATIONS`.** La app no escribe ni lee esa hoja desde el
   2026-09-20; lo que se llama "reservar" vive en `MATERIAL_LOCKS`. Es la
   pestaña vacía de la imagen 4 de Jose. Una línea: *"Reservations are kept in
   MATERIAL_LOCKS. This sheet is from an earlier version and is not used."*
   **No borrar la pestaña**: en la copia de un cliente puede haber filas
   escritas a mano y eso no tiene vuelta atrás.
5. **`AUDIT_LOG` E y F → `Detail 2` y `Detail 3`.** De 56 escrituras, 19 dejan
   las dos vacías y 17 llenan una sola: el nombre "Old Value / New Value"
   describe bien una minoría de las filas. Dos celdas, con la tanda de formato.

</details>

## Con riesgo — orden y motivo

6. **`MATERIAL_LOCKS`: quitar `MatId`** (es `Category` + `Name`, y los tres
   están). **Primero** que `getActiveLocksMap_` la componga al leer, como hace
   `packKey_` en `MATERIAL_PACKS` — que es la hoja que lo hace bien. Cuando la
   columna ya no decida nada, quitarla. **Nunca al revés:** esta hoja no se
   reconstruye, y una migración cortada a medias deja candados que no se
   cumplen, o sea **material apartado que se puede sacar**. Necesita una prueba
   que ponga tres candados, migre y compruebe que los tres siguen cumpliéndose.
7. **`CONFIG` F/G (lista vieja de usuarios): esperar a que se vacíe sola.** Ya
   es una puerta de un solo sentido desde la v12.45 y la app migra a quien llega
   por ahí. Lo que falta para poder decidir: **que *Check installation* diga
   cuántos correos quedan ahí sin migrar.** Hoy no lo dice, así que quitarlas
   sería a ciegas y podría costarle el acceso a alguien que aún no ha entrado.
8. **`INCOMING_V3` no tiene `Mat ID`.** Un material renombrado deja las entradas
   futuras apuntando al nombre viejo. Va con *"Incoming y Project View:
   estandarizar columnas"*, que ya estaba en esta lista — ahora sé qué columna
   falta.

## Decididas: se quedan como están

- **`Status` del archivo** (col L). Derivada de `MoveType`, **pero** es lo único
  que dice el tipo de movimiento en las filas anteriores a que existiera
  `MoveType`, y hay una reparación escrita *y llamada* que las mantiene de
  acuerdo. Una repetición vigilada no es el fallo que estamos cazando.
- **`Mat ID` del archivo** (col O). El código ya dice *"never trust the stored
  MatID column"* y la repara sola en cada reconstrucción. Inofensiva, y es lo
  único que, abriendo el Sheet, dice que dos filas son el mismo material.
- **`Total Cost`** se queda como columna (contabilidad la suma); lo que cambia
  es el punto 1.
- **`System Date` vs `Date Received`** y **`Received By` vs `User Email`**: dos
  parejas que parecen repetidas y no lo son. Ver la auditoría.

## Preguntas abiertas para Jose

- ¿Algo fuera de la app lee `LIVE_STOCK` o `SITE_STOCK`? (decide el punto 2)
- ¿Usa el desplegable de camiones al despachar, o apunta el camión en los
  comentarios? (decide si `CONFIG` I/J/K se quedan)

## Y una cosa que la auditoría encontró del formato

`aplicarFormatoEstandar_` **ya existe** y ya pone color de pestaña por familia,
cabecera, nota en A1, protección en aviso y anchos. Lo que **no** hace es lo que
pidió Jose: la cabecera es del mismo azul en todas, el color de pestaña es por
familia (cuatro, no uno por pestaña) y **no hay filas intercaladas**. El mockup
`landing/mockup-formato-hojas.html` es sobre esa diferencia, no sobre empezar de
cero.

---

# DECIDIDO EL 07/10/2026

## ✅ LOTES — NIVEL 1 (trazabilidad), aprobado por Jose

*"ME GUSTA, EMPEZAMOS POR LA 1 ENTONCES."*

**Qué es:** una columna `Lote` que se escribe en la ENTRADA, viaja con el
movimiento, se ve en las tablas y **se busca**. Contesta *"¿a qué obras fue el
lote 2451?"* — la pregunta real cuando el fabricante avisa de un defecto o entra
una reclamación de garantía.

**Qué NO es:** no cuenta existencias por lote y no elige lote al sacar. Eso es el
nivel 2 y sólo se construye si un cliente lo pide de verdad.

**Cómo, sin romper nada:** la columna se **añade al final** del archivo
(`AC_WIDTH` pasa de 23 a 24), exactamente como se añadieron `UNIT_COST`,
`TOTAL_COST` y `MOV_ID`. Insertarla entre las que ya hay desplazaría cada
columna posterior en toda instalación que haya guardado un movimiento. Ese
camino ya está probado tres veces.

**Lo que hay que tocar:** `AC` + `AC_WIDTH`, la cabecera de `ensureCoreSheets_`,
el formulario de entrada, `parseArchiveRow`, la búsqueda, y las tablas que lo
muestren. **No se toca el motor de existencias**, que es justamente lo que lo
hace barato.

**Por qué el nivel 1 y no el 2:** cubre el 80% de la necesidad real del vidrio
(trazabilidad hacia atrás) por una fracción del trabajo. El nivel 2 añade una
tercera dimensión a la clave de existencias (`material ||| estante ||| lote`) y
arrastra las hojas calculadas, la validación de salida y los apartados.

## 🔴 LA CLAVE DE GEMINI — documentado, y una cosa que arreglar

Todo en `docs/CLAVE-DE-GEMINI.md`. Lo que queda por hacer:

1. **La comprobación de la clave prueba CUATRO modelos, y debería probar uno.**
   `geminiFetch_` recorre la lista de respaldo hasta que uno conteste. Esa lista
   existe para el uso real —si Google retira un modelo, la app sigue— pero
   **para validar una clave no aporta nada**: si la clave está mal, está mal
   para los cuatro. El resultado es que la rueda de "verificando" da vueltas
   cuatro veces más tiempo del necesario, que es exactamente lo que Jose vio.
   **Pequeño.**
2. **La nota dentro de la app**, en ⚙️ Settings → System → AI, con las tres
   cosas que de verdad deciden: la clave, la *Generative Language API*, y —la
   que nadie espera— **el permiso de Workspace**. Una cuenta de empresa con AI
   Studio apagado en el panel de administración no puede usar ninguna clave, y
   hoy la app no lo dice en ningún sitio. Texto propuesto al final del
   documento. **Pequeño, va en la próxima versión de la app.**

---

# ANOTADO EL 07/10/2026

## 🔴 EL ERROR 503 DE LA CLAVE DE GEMINI MIENTE — y es nuestro

Jose, con la captura: `Error: Google rejected that key (HTTP 503)`.

**Google NO rechazó la clave.** Un 503 es *"estoy saturado, vuelve luego"*. La
clave podía estar perfecta. Y Jose, creyéndose el mensaje, **borró claves que
funcionaban y se pasó un día creando otras nuevas** — un rato entero perdido
por una frase equivocada.

**Y la respuesta correcta YA ESTÁ ESCRITA EN EL ARCHIVO.** `geminiErrorText_`
(línea 1420) traduce el 503 exactamente bien: *"The AI reader is busy right now
— this is on Google's side, not yours, and nothing was lost."* Tiene un
comentario encima que dice por qué se escribió, y nombra a Jose topándose con
ese mismo 503 en otra pantalla.

**Pero `setAiKey` no la llama.** Arma su propio texto a mano y dice "rejected"
para cualquier código que no sea 200. `geminiErrorText_` tiene **un solo
llamador** en todo el archivo (línea 14405).

Quinto caso del mismo patrón: **la protección escrita y nunca llamada.** Los
anteriores: `ensureCoreSheets_`, la reparación de cabeceras, el canario del
archivado, la validación de llegada.

**El arreglo es de una línea**, y va con esto:

1. `setAiKey` usa `geminiErrorText_` para todo lo que no sea 200.
2. **Y no borra la clave ni se niega a guardarla en un 503 o un 429**, porque un
   fallo pasajero de Google no es una prueba de nada sobre la clave. Que diga
   "Google está ocupado, inténtalo en un minuto" y deje lo que había.
3. **La comprobación prueba UN modelo, no cuatro** (ver la entrada de la clave
   de Gemini): la lista de respaldo sirve para el uso real, no para validar.

## 🔵 VISTA POR PASILLO COMO MODO DEL MAPA — idea de Jose, y es mejor que la mía

*"¿no sería mejor en el mapa poner un botón que diga 'vista por pasillo' y que
cambie la forma de ver todo y ahí trabajar de esa forma? también el cíclico se
puede poner dentro de esa vista por pasillo, así la opción del cíclico sólo
aparece al cambiar la forma de la vista."*

**Sí, y resuelve tres problemas que yo no había juntado:**

1. **No añade una pestaña.** Yo la tenía apuntada como pantalla nueva; la barra
   ya tiene cinco y cada una cuesta sitio y atención. Un interruptor dentro del
   mapa no cuesta ninguna.
2. **Pone el conteo donde se usa.** El conteo cíclico se recorre andando el
   pasillo. Si el botón de contar sólo existe en la vista que se usa andando,
   la herramienta aparece en el momento y el sitio en que hace falta — y **no
   estorba** al 95% de los días en que nadie cuenta.
3. **Mismo dato, dos formas de leerlo.** El mapa y el pasillo salen los dos de
   `LIVE_STOCK`. Un interruptor sobre el mismo dato, no una pantalla nueva con
   su propia carga.

**Lo que hay que cuidar, y lo digo antes de construirlo:** un modo que cambia
la pantalla entera es un sitio clásico para perderse. El modo tiene que
**decir en voz alta que está activo** y tener una salida visible; y tiene que
**recordarse** entre visitas, porque quien trabaja por pasillo trabaja por
pasillo siempre.

**Orden:** la vista primero (es leer, no se puede romper nada), el conteo
después (escribe ajustes de verdad). La vista sola ya vale por sí misma.

## 🔵 CÓDIGOS DE BARRAS Y QR — el plan, que es más grande que "leer un código"

*"debemos trabajar en los códigos de barras o en los QR… que la app permita
escanear locaciones, y códigos de barras para hacer todo tipo de movimientos.
entonces también debe crear códigos para las locaciones."*

Jose tiene razón en la parte que casi siempre se olvida: **antes de leer un
código hay que tenerlo pegado en el estante.** Son cuatro trabajos, no uno, y
el orden importa porque cada uno sirve de algo aunque el siguiente no llegue.

| # | Qué | Tamaño | Sirve solo? |
|---|---|---|---|
| 1 | **Generar e imprimir el código de cada ubicación** | pequeño | **Sí** — un estante etiquetado ya se lee a ojo |
| 2 | **Leer un código con la cámara del móvil** | mediano | Sí — buscar un estante al instante |
| 3 | **Escanear dentro de un movimiento** (origen, destino, material) | mediano | Sí |
| 4 | **Modo escaneo continuo** (pistola, sin tocar la pantalla) | grande | Es el que convierte la bodega |

**Decisiones que hay que tomar antes de teclear nada:**

- **QR, no código de barras**, para las ubicaciones. Un QR se lee torcido, roto
  y desde más lejos, y cabe en una etiqueta pequeña. El código de barras lineal
  tiene sentido si el cliente ya tiene lector de barras o si los materiales
  vienen con código del fabricante.
- **¿Qué lleva dentro el código?** Hay dos caminos y es irreversible una vez
  impresas las etiquetas:
  - **El nombre tal cual** (`A1A`) → simple, legible por humanos, y **se rompe
    el día que se renombra un estante.**
  - **Un identificador propio** que no cambia nunca → sobrevive a los
    renombrados, pero hace falta una tabla que lo traduzca y una etiqueta que
    muestre las dos cosas.
  **Yo iría por el identificador propio**, por lo mismo que `MOV_ID`: ya nos
  mordió una vez apuntar a algo por su nombre (ver la fusión de ubicaciones).
- **El material es más difícil que la ubicación.** Una ubicación es única; un
  material puede traer el código del fabricante, no traer ninguno, o traer uno
  distinto por proveedor. **Empezar por ubicaciones** es lo correcto: son pocas,
  son nuestras, y ya tienen pantalla (el mapa).
- **La cámara del móvil ya se puede usar** sin librería externa en navegadores
  modernos. Hay que comprobar que funciona dentro del iframe de Apps Script
  **antes** de prometerlo — es la misma clase de muro que nos paró con la vista
  previa de los PDF.
- **La impresión ya existe** (las etiquetas de 4×6 de la v11.79). El punto 1 es
  en buena parte reusar eso.

**Encaja con lo de arriba:** el escaneo de ubicaciones y la vista por pasillo son
la misma persona andando con el teléfono en la mano. Conviene pensarlas juntas,
aunque se construyan por separado.

## 🎬 VÍDEO DE UX (07/10) — la subida de archivos

Referencia de diseño, no un fallo: *Profile Upload UI — Basic vs Premium*.
Compara un botón de subir pelado con uno que trae **vista previa antes de
subir**, **el nombre del archivo elegido** (o "No File Chosen"), **un anillo de
progreso con porcentaje**, y **los formatos y el tamaño máximo escritos
debajo**.

Aplica a nuestros tres sitios de subida: fotos de estante, documentos de un
movimiento, y el logo de la empresa. Lo más barato y lo que más se nota: **decir
qué formatos y qué tamaño se aceptan**, que hoy no se dice en ninguno.
Registrado también en `VIDEOS-DE-UX.md`.

## 🔴 DOCUMENTACIÓN DE SOPORTE CON IMÁGENES — pedido por Jose el 07/10

*"todo esto lo debemos tener bien documentado y hasta con imágenes por si
alguien lo quiere leer, pero nosotros somos los que les daremos soporte a los
usuarios, así que debemos saberlo de memoria nosotros primero, y también el
cliente no debe ir al sheet nunca."*

Lo escrito hasta hoy —`DE-CERO-A-CLIENTE.md`, `CLAVE-DE-GEMINI.md`,
`PROYECTO-DE-CLOUD.md`, `INSTALL-GUIDE.md`, `CUSTOMER-SETUP.md`— **es para
nosotros**: son mapas y razonamientos, no una guía con capturas que alguien
siga sin saber nada. Falta eso, y falta en los dos sentidos:

1. **La chuleta de soporte** (nuestra): el síntoma a la izquierda, la causa y la
   frase exacta que se le dice al cliente a la derecha. La de la clave de
   Gemini ya está en `ADD-ONS.md` y sirve de molde. **Un 503 no es una clave
   mala** — esa confusión ya costó un día.
2. **La guía con capturas** (del cliente): las cuatro piezas, con imagen de cada
   pantalla. **Las capturas sólo las puede hacer Jose**, y el bloqueo es el
   mismo de siempre: la copia demo con datos inventados.

**Y una regla que Jose dejó dicha y conviene que esté escrita donde se lea:**
**el cliente no debe ir al Sheet nunca.** Ya es la dirección del producto —
está en `LO-QUE-FALTA-EN-LA-APP.md`— pero ahora también manda sobre la
documentación: una guía que en algún paso diga "abre la hoja y busca la pestaña
tal" es una guía que admite una derrota del producto. Si un paso necesita el
Sheet, lo que falta es una pantalla, no un párrafo.

## 🔵 DECIDIDO (07/10) — EL PROYECTO DE CLOUD VA SIEMPRE, Y EN LA CUENTA DEL CLIENTE

Jose: *"si crear un proyecto en el workspace de cloud es lo mejor entonces
debemos hacerlos siempre… eso se ve profesional y, si es para vernos más
profesionales, quiero hacerlo."*

**Sí, y buscándolo apareció una razón más fuerte que la estética.** Hay dos
pantallas de permisos y no tienen el mismo coste (todo en
`DE-CERO-A-CLIENTE.md`):

- Un proyecto **Interno**, en el Workspace del cliente, **no necesita revisión
  de Google ni para los permisos restringidos**: no hay pantalla gris, no hay
  tope de 100 usuarios, y **no cuesta nada**.
- Si todos los clientes colgaran de NUESTRO proyecto, sería **Externo** con
  permiso restringido (`drive`) → **evaluación de seguridad anual de pago**
  (CASA), para siempre.

O sea: el camino que ya recomendábamos por limpieza **es además el único
gratis**. Y hay que empezar en Interno, porque de Interno se puede pasar a
Externo pero **no se vuelve** una vez que alguien autorizó.

**Pendiente de comprobar antes de darlo por cerrado:** un cliente SIN Workspace
(Gmail personal) no puede tener proyecto Interno. Hay que medir qué ve
exactamente ése y si el tope de 100 usuarios le afecta. Para un almacén
pequeño, 100 sobra — pero eso hay que verlo, no suponerlo.

## 🔵 DECIDIDO (07/10) — EL CLIENTE DE OAuth TAMBIÉN VA, Y ES BARATO

Jose quiere ofrecerlo para que un cliente sin dominio propio pueda trabajar con
su correo personal y con su gente.

**Y leyendo el código resulta que es mucho menos arriesgado de lo que parecía:**
`_startGoogleLogin` pide **sólo `openid email profile`** — los tres permisos más
básicos que existen. **No son sensibles ni restringidos.** El permiso temido
(`drive`) está en la OTRA pantalla, la que firma el dueño de la copia una sola
vez.

El cliente de OAuth se crea **en el proyecto del cliente**, no en el nuestro, y
sus credenciales van a las Script Properties **de la copia del cliente**. Nada
nuestro se consume, y por eso esto escala: cien clientes no son más lentos que
uno porque no hay nada compartido en medio.

**La regla que sale de aquí y no hay que romper nunca:** *nunca poner una
credencial nuestra en la instalación de un cliente* — ni Gemini, ni OAuth, ni
nada. Su consumo sería nuestro consumo y su tope nuestro tope.

## ⚠️ CORREGIDO EL 07/10 (mismo día) — ME EQUIVOQUÉ CON LO DE `/a/macros/`

**Lo que escribí abajo es falso en su parte principal y lo dejo escrito entero
para que se vea el error, no para esconderlo.**

Dije que la forma buena de la dirección era `/a/macros/…` y que `/macros/…` no
sirve. **Jose lo probó y falla igual.** Y su captura de *Manage deployments*
remata el asunto: **la dirección que da Google es exactamente la que yo di por
mala**, `https://script.google.com/macros/s/AKfy…/exec`, sin `/a/`.

**De dónde salió el error:** del vídeo, donde la forma `/a/macros/ox-glass.com/…`
pintó la app y la forma `/macros/…` no. De ahí deduje una regla —"los scripts de
Workspace se sirven bajo /a/macros/"— que explica lo que vi y **no es verdad**.
El prefijo `/a/macros/<dominio>/` lo pone Google según **con qué cuenta está
mirando el navegador**, no según de quién es el script. No es una dirección
distinta: es la misma vestida para una sesión.

Clasifiqué dos cosas juntas porque aparecían juntas, que es el mismo error de
medir que llevo semanas cazando en el código.

**Lo único de abajo que sigue en pie, y sigue valiendo:** una dirección con
`/u/<número>/` dentro **nunca es compartible** — ese `u/0` significa "la cuenta
número 0 DE ESTE NAVEGADOR", así que funciona en la máquina donde se copió y
falla en las demás. Que el asistente la rechace sigue siendo correcto.

**La causa de verdad, que es otra y encaja con todo:** ver la entrada de abajo
sobre la autorización rota. Un script cuya autorización dejó de valer no puede
ejecutarse, y Google sirve exactamente ese error genérico de Drive. **Mismo día
—el 1 de octubre— en que pararon los respaldos de la DEMO.** Una sola causa,
dos síntomas.

---

## ~~🔴 LA DIRECCIÓN DE LA APP TIENE TRES FORMAS Y SÓLO UNA SIRVE~~ — 07/10 (EQUIVOCADO, ver arriba)

Jose no podía entrar en la DEMO. **No era un permiso, ni el cliente de OAuth, ni
el cambio de proyecto. Era la dirección.** Medido en su vídeo, mismo
identificador de implementación, dos prefijos:

| Dirección | Qué pasa |
|---|---|
| `script.google.com/**a/macros**/s/AKfy…/exec` | **entra** |
| `script.google.com/**macros**/s/AKfy…/exec` | *"Sorry, unable to open the file at this time."* |
| `script.google.com/macros/**u/0**/s/AKfy…/exec` | igual de muerta, y además depende del navegador |

Un script que vive en un dominio de Workspace se sirve bajo `/a/macros/…`. La
forma `/macros/…` —la de las cuentas personales— **no resuelve**, y el error que
da es de Drive y no dice nada: parece que la app no existe.

**Y la tercera forma es la peor de todas.** `/macros/u/0/s/…` es la que copia
cualquiera de la barra del navegador, y ese `u/0` significa *"la cuenta número 0
DE ESTE NAVEGADOR"*. Funciona en la máquina donde se copió y falla en todas las
demás. Es un enlace que parece bueno porque a quien lo copia le funciona.

**Lo que hay que hacer, y son dos cosas distintas:**

1. **Que la app no acepte una dirección que no puede funcionar.** `WEB_APP_URL`
   se pega a mano en el asistente. Hoy se guarda lo que sea. Debe rechazar
   cualquier dirección con `/u/<número>/` dentro —nunca es compartible— y, si
   el script vive en un dominio, avisar cuando le den la forma `/macros/` en vez
   de `/a/macros/`.
2. **Que *Open WMS App* y el correo de invitación manden la buena.** Hoy salen
   de `savedWebAppUrl_()`, o sea de lo que se pegó. Si lo pegado está mal, está
   mal en todos los sitios a la vez — y es justo lo que pasó.

**Esto ya había mordido antes y se le echó la culpa a otra cosa.** En
`selfActivateWebApp_` está escrito que una copia hereda la dirección del script
original y enseña *"Sorry, unable to open the file at this time"*. **Mismo
mensaje.** Aquel diagnóstico puede haber sido correcto a medias: el síntoma
también lo produce esto, y nadie comprobó cuál de los dos era.

## 🔵 EL INFORME DEL ARCHIVADO IMPRIME NÚMEROS Y NO DICE SI ESTÁN BIEN — 07/10

Jose, al pulsar *Test nightly archive*: *"¿qué significa esto?"*

```
SHEET WIDTHS — this is what the "23 vs 20" error is about
  The row model needs   : 23 columns
  MASTER_ARCHIVE_V3 has : 25   (last column in use: 23)
  ARCHIVE_HISTORY has   : 26   (last column in use: 23)
```

**Esos números son el caso sano** —las dos hojas son más anchas que el modelo, y
sobrar está bien; lo que rompe es faltar— **y aun así preguntó**, porque el
bloque dice la palabra "error" en el encabezado y después deja tres cifras para
que uno las compare a mano.

Un informe de diagnóstico que obliga a interpretar no es un diagnóstico. Debe
decir **"✓ las anchuras están bien"** o **"✗ MASTER_ARCHIVE_V3 tiene 20 y el
modelo necesita 23"**, y dejar las cifras debajo para quien quiera mirarlas.
Pequeño, y vale para todo el informe, no sólo para este bloque.


## 🔴 CAMBIAR EL PROYECTO DE CLOUD MATA LOS TRABAJOS NOCTURNOS, EN SILENCIO — 07/10

**El hallazgo, y es el que de verdad explica la DEMO.**

Jose: *"en la DEMO el backup se paró desde el día 1 de octubre."* Su lista lo
confirma: respaldos automáticos todas las noches a las 2:19 hasta el **1 de
octubre**, y después nada hasta el que hizo a mano el 7.

**El 1 de octubre es el día que enlazó la DEMO al proyecto ACOPIO.** Está
escrito en `PROYECTO-DE-CLOUD.md`, con sus propias palabras y la captura.

Cambiar el proyecto de Cloud **invalida la autorización anterior** — eso ya lo
teníamos escrito como "el único efecto molesto". Lo que NO habíamos atado es lo
que arrastra:

- Los **disparadores por tiempo** corren con la autorización del dueño. Sin
  ella fallan, y Google acaba desactivándolos.
- **La app web también.** Un despliegue cuyo dueño no tiene autorización válida
  no puede ejecutarse, y Google sirve *"Sorry, unable to open the file at this
  time"* — el mensaje genérico de Drive, que no dice nada de autorizaciones.

**Una causa, dos síntomas, la misma fecha.** Y ninguno de los dos se anuncia.

**Y esto es un problema del PRODUCTO, no de la DEMO**, porque acabamos de
decidir que cada cliente tenga su propio proyecto de Cloud. Tal y como está
hoy, ese paso **apaga los respaldos del cliente sin avisar a nadie** hasta que
el dueño vuelve a autorizar.

**Lo que hay que construir, y por orden:**

1. **Que la app note que el respaldo nocturno dejó de correr.** Hoy
   `getBackupStatus` enseña el último respaldo y la lista, y **nada compara esa
   fecha con hoy**. Si el último automático tiene más de ~36 horas, debe decirlo
   en voz alta en Settings → System y en el correo diario. Vale contra esta
   causa y contra todas las demás, que es lo que lo hace la pieza correcta.
2. **Lo mismo para los otros tres trabajos** (archivado 3am, informe diario,
   revisión 9am). El patrón es idéntico y ya está en la lista como *"la versión
   en los otros tres trabajos automáticos"*.
3. **Documentar el paso que falta** en `DE-CERO-A-CLIENTE.md`: después de
   cambiar el proyecto hay que **volver a autorizar Y volver a desplegar**. Hoy
   el documento dice "hay que volver a autorizar una vez" y se queda corto.

**Predicción comprobable, y conviene comprobarla antes de dar esto por cerrado:**
si la causa es ésta, en la DEMO habrán parado **los cuatro** trabajos el 1 de
octubre, no sólo el respaldo. Se mira en Apps Script → Ejecuciones.

## 🔴 CAMBIAR EL NOMBRE DE LA EMPRESA DEJA LAS CARPETAS VIEJAS A SU SUERTE — 07/10

Jose: *"al cambiar el nombre de la empresa en la app, el nombre de las carpetas
no cambia, y tampoco el de los archivos de backup, y eso hace que se cree una
nueva carpeta… mejor debemos arreglarlos, ¿no crees?"*

Sí. Su DEMO ha cambiado de nombre **dos veces** (PRODUCTION → MY WAREHOUSE →
MY WAREHOUSE DEMO) y el resultado está en sus capturas: **dos carpetas maestras
distintas** en el Drive, `Acopio_MY_WAREHOUSE` y `Acopio_PRODUCTION_OX_GLASS`,
una dentro de la otra por accidente, y los respaldos repartidos entre nombres
que ya no significan nada.

**Lo que sí funciona hoy, y conviene decirlo antes de alarmar:** la app **no
pierde** los respaldos. `getOrCreateFolder_` guarda el **ID** de la carpeta en
Script Properties y busca por ID, no por nombre — por eso la lista de la app los
enseña todos aunque la carpeta se llame como se llame. Renombrar la empresa
**no rompe nada**.

**Lo que está mal es lo que una persona ve:** carpetas y archivos con el nombre
de una empresa que ya no existe, y la sospecha razonable de que algo se perdió.

**Las tres piezas, y la primera es la que importa:**

1. **Renombrar al cambiar el nombre de la empresa.** La carpeta maestra, las
   tres hijas. Por ID, que es seguro. El ID no cambia, así que no se rompe
   ningún enlace ni ningún documento ya subido.
2. **Los respaldos ya creados NO se renombran.** Deliberado: el nombre de un
   respaldo dice qué empresa era **el día que se hizo**, y reescribir eso es
   falsificar el pasado. Es la misma regla que ya rige los movimientos
   (*"existing movements keep the name they were recorded with"*).
3. **Recoger lo que quedó suelto de renombrados anteriores.** `organizeDriveFolders_`
   ya hace justo esto para las carpetas que conoce por ID; le falta encontrar
   las de nombres **anteriores**. `FOLDER_PREFIX_HISTORY` ya existe y guarda los
   nombres viejos — para los documentos. Reusarlo aquí.

**Y lo que no se toca:** nada se borra ni se fusiona por decisión nuestra. Si
una carpeta vieja tiene archivos, se mueve bajo la maestra actual y se dice qué
se movió, como ya hace *Tidy up my Drive*.

---

# ANOTADO EL 08/10/2026

## ⚠️ OTRA CORRECCIÓN MÍA — la re-autorización tampoco era la causa

Dije que había que volver a autorizar el script y que eso arreglaría la DEMO.
Jose: *"no me pidió nada."* O sea que **la autorización estaba bien**, y mi
segunda hipótesis también estaba equivocada.

Llevo dos diagnósticos fallados seguidos sobre lo mismo, y los dos por el mismo
vicio: **explicar lo que vi en vez de medir lo que pasa.** Lo escribo porque la
tercera explicación de abajo la encontró él, no yo.

**Lo que sigue SIN explicación, y no lo voy a rellenar con una tercera
hipótesis:** por qué los respaldos automáticos de la DEMO pararon el 1 de
octubre. La correlación con el cambio de proyecto de Cloud sigue ahí y sigue
siendo sospechosa, pero **la autorización no era el mecanismo.** Se mira en
Apps Script → Ejecuciones, filtrando por `dailyBackupTrigger`: ahí está el
error de verdad, con fecha. Hasta entonces, abierto.

**Y lo que esto cambia del plan:** el aviso de "el respaldo lleva X días sin
correr" (hecho en la v12.48) era la pieza correcta **precisamente porque no
depende de conocer la causa.** Protege igual contra ésta y contra las que no
hemos visto.

## ✅ HECHO (v12.48) — EL CORREO MAL ESCRITO, Y LA SALIDA QUE NO HABÍA

Jose encontró la causa real de no poder entrar en la DEMO: `jose@ox-glasss.com`,
con tres eses, en `USERS_V3`.

**Es un correo válido**, así que ninguna comprobación de forma lo cazaba ni debe
cazarlo: el dominio existe o no existe y eso no se sabe desde el código. La app
lo guardó, lo pintó Activo, y la pantalla de acceso le dijo —con razón— que esa
cuenta no estaba registrada. **Dos pantallas que se contradicen y ninguna
miente.**

**Lo grave era la salida: el correo no se podía editar.** Campo `disabled`. Para
corregir una letra había que abrir el Sheet — justo lo que Jose acaba de dejar
escrito que un cliente no debe hacer nunca.

Arreglado en la v12.48: se edita desde la app, con tres guardas en el servidor
(no al correo de otra fila, no al propio, y queda escrito de dónde a dónde), y
un aviso ANTES de guardar cuando el dominio está a una o dos letras de uno que
ya usan los demás. 21 comprobaciones, dos mutaciones verificadas.

## 🔵 LO QUE QUEDÓ ABIERTO DE ESTO

1. **`addUser` no tiene el aviso del dominio parecido en el servidor.** El aviso
   vive en el navegador, que es donde se puede preguntar. Un alta hecha por otra
   vía —si algún día existe— no lo tendría. Pequeño, y de momento no hay otra
   vía.
2. **La misma errata puede estar en `PM_DIRECTORY` y en `CONFIG`** (correo del
   administrador, proveedores). Ninguna tiene aviso. El patrón ya está escrito y
   es reusable.
3. **Los 16,6 segundos de tabla mentirosa.** Medido en el vídeo del 07/10: al
   guardar 10 movimientos, la ventana se cierra a los 14,3 s y **la tabla tarda
   16,6 s MÁS** en enseñar lo guardado. Durante esos 16 segundos la pantalla
   muestra una tabla sin lo que acabas de meter, que es exactamente cuando uno
   piensa que falló y vuelve a darle. **Lo que hay que arreglar primero no son
   los 31 segundos: es que la tabla no mienta mientras llegan.**

## ✅ HECHO (v12.49) — LOS 16,6 SEGUNDOS, Y LO QUE APARECIÓ DEBAJO

Jose: *"lo que quiero es que la app muestre lo que guardó, modificó, cambió,
borró, etc. exactamente en el mismo segundo que termina de hablar con el
servidor. Y eso va para todo lo que hace la app."*

La tabla no tardaba por lenta: **pedía la foto entera otra vez para enterarse
de unas filas que el servidor acababa de escribir.** Ahora vienen en
`res.movimientos` y se meten directas.

**Y al abrirlo apareció algo más gordo:** `stockAfter` —el arreglo de la
v12.24, *"el servidor ya tenía las cifras de después y las tiraba"*— lo producía
`addMovementsBatch_` y **ninguna de las envolturas lo reenviaba**. Las tres
pantallas llamaban a `_aplicarStockDelServidor(res)` y recibían `undefined`. Un
arreglo escrito, probado y **muerto en el camino de vuelta** durante versiones,
sin síntoma porque la recarga de detrás acababa cuadrándolo — tarde.

Sexto caso del patrón: dos cosas que tienen que coincidir sin que nada lo
obligue, esta vez entre dos funciones del mismo archivo.

### Lo que Jose pidió y NO se hizo, con su motivo

*"cada uno debe ir apareciendo en la lista uno por uno"*. **Las diez se guardan
en UNA operación con un solo candado: o entran todas o no entra ninguna.**
Pintarlas goteando fingiría un progreso que no existe —ya están las diez
cuando el servidor contesta— y sería adorno. Aparecen juntas, en el segundo en
que el servidor dice que están.

Si de verdad hiciera falta una barra por fila, habría que partir el guardado en
diez llamadas: diez veces más lento, y con la posibilidad de quedarse a medias.
**La atomicidad vale más que la animación**, y conviene que quede escrito antes
de que a alguien le tiente deshacerlo.

### Lo que queda de esto, y es lo que conecta con su lista estilo Google

El principio de Jose —**que la pantalla enseñe lo confirmado en el mismo
segundo**— está cumplido para GUARDAR. Falta para el resto:

1. **Borrar.** La fila se va al pulsar desde la v11.66, pero las cifras del
   Dashboard esperan la recarga. Ya estaba anotado: `deleteRow` no tiene
   snapshot a mano y calcularlo en cada borrado devolvería la ráfaga lenta que
   arregló la v11.96. La forma que encaja: calcularlo **sólo cuando el refresco
   no se aplaza**, que es el final de la tanda y justo cuando alguien mira.
2. **Editar un movimiento.** Mismo caso que guardar y la misma solución:
   `modifyMovement` sabe cómo queda la fila y puede devolverla.
3. **Ajustes** (categorías, ubicaciones, usuarios): ya se parchean en sitio.
4. **La lista de operaciones tipo Google.** Cuando exista, la regla ya está
   puesta: el check verde se pinta con lo que el servidor confirmó, y la fila
   aparece en Movements en ese mismo instante porque sale de la misma
   respuesta. **No hay dos caminos que puedan desincronizarse** — que es
   justamente lo que Jose quería asegurar al preguntarlo.

## ✅ HECHO (v12.50) — BORRAR Y EDITAR TAMBIÉN SE VEN EN EL ACTO

Cerrado lo que quedaba del principio de Jose (*"eso va para TODO lo que hace la
app"*). Las cinco operaciones que mueven existencias —entrada, salida,
movimiento suelto, borrado y edición— aplican ya las cifras que el servidor
devuelve.

**Borrar:** la objeción que lo tenía parado desde la v12.24 era buena pero sólo
cubría la mitad. Calcular las cifras en CADA borrado devolvería la ráfaga lenta
de la v11.96; pero el último borrado de la tanda refresca de verdad, y ahí las
hojas calculadas acaban de reescribirse. Leerlas son tres viajes cortos, una
vez por tanda, y justo cuando alguien mira. Aplazado manda `null`.

**Editar:** quitada una SEGUNDA ARITMÉTICA del navegador. Rehacía la
normalización del servidor para pintar la fila, y su propio comentario avisaba
del parpadeo si las dos no coincidían. Ahora el servidor manda la fila como
quedó en la hoja, y los totales de los DOS materiales — editar la categoría o
el nombre mueve existencias de uno a otro, y mandar sólo uno dejaría al otro
con la cifra vieja.

`stockAfterParaIds_` lee por `buildStockFromDerivedSheets_` +
`applyReservationsAndFinalize_`, que es el MISMO camino que dibuja el Dashboard
al entrar. No hay cuenta nueva que pueda discrepar.

### Lo que queda del principio, y ya es pequeño

- **Restaurar de la papelera** usa el mismo `refreshOrDefer_` y podría devolver
  las cifras igual. No lo toqué en esta tanda para no mezclar; es media hora.
- **Importar** (`commitImport`) mueve existencias en masa y recarga entero. Ahí
  la recarga sí está justificada —cambia medio almacén— pero conviene mirarlo.
- **Fusionar y renombrar** materiales o ubicaciones: mismo caso que importar.

### Y una nota para quien venga después

Las cinco llamadas a `_aplicarStockDelServidor(res)` son el contrato. Si se
añade una sexta operación que mueva existencias y no la llama, **no habrá
síntoma**: la recarga silenciosa acabará cuadrándolo, tarde, y nadie sabrá por
qué esa pantalla va más lenta que las otras. `test-borrar-y-editar-se-ven.js`
las cuenta por eso.

## 🔴 `OAUTH_REDIRECT_URI` PUEDE APUNTAR A UN DESPLIEGUE MUERTO, Y NADIE LO MIRA — 08/10

**ÉSTA ES LA CAUSA de que Jose no pudiera entrar en la DEMO con su cuenta de
empresa**, y no las dos que supuse antes. Su captura lo enseña sin lugar a
dudas: la página está en

    .../s/AKfycbzxKF659yaTtULpAYx4HngN_DoEF0VrdH4CwHhMbGKCAlEKvGYKEjAGfCuJxSP1XKcw/exec

y la ventanita de *Sign in with Google* que se abre encima muere en

    .../s/AKfycbzxQ1YeehasKAj2o1…

**Dos identificadores de despliegue distintos.** El inicio de sesión vuelve a
`redirectUri_()`, que lee `OAUTH_REDIRECT_URI` de Script Properties — y esa
propiedad apunta a un despliegue viejo. La ventana muere con el error genérico
de Drive, y la página se queda en *"Waiting for sign-in…"* para siempre, sin
decir por qué.

**Es el patrón de siempre:** dos cosas que tienen que coincidir —la dirección
guardada y el despliegue vivo— sin que nada lo obligue. Y se desalinean solas en
tres casos normales: al copiar la hoja, al crear un despliegue nuevo en vez de
actualizar el que había, y al cambiar el proyecto de Cloud.

**El arreglo inmediato (de configuración, sin código):** borrar
`OAUTH_REDIRECT_URI`, o ponerle la dirección `/exec` actual, y comprobar que el
cliente de OAuth la tenga en *Authorized redirect URIs*.

**Lo que hay que construir, y es la guarda que falta:**

1. **Que la app lo compare.** `savedWebAppUrl_()` y `OAUTH_REDIRECT_URI` deben
   tener el mismo identificador de despliegue. Si no, decirlo en
   *Check installation* y en Ajustes → Sistema, con las dos direcciones
   delante. Es una comparación de cadenas.
2. **Que el inicio de sesión no se cuelgue en silencio.** Hoy la ventanita
   muere y la página espera indefinidamente. Si a los ~30 segundos no llegó
   nada, debe decir *"la ventana de Google no volvió; puede que la dirección de
   retorno esté mal configurada"* y ofrecer reintentar. Una espera sin final es
   lo que convirtió esto en un día perdido.
3. **Que `selfActivateWebApp_` lo actualice.** Es la única función que conoce la
   dirección buena de primera mano —acaba de crearla— y ya aprendió esta
   lección una vez: la v12.42 le añadió `saveWebAppUrl(url)` por el mismo
   motivo. Le falta hacer lo mismo con la de retorno.

**Y dos diagnósticos míos equivocados antes de éste, que quedan escritos arriba:
la forma `/a/macros/` y la autorización caducada.** Los dos explicaban lo que
veía y ninguno era la causa. El dato que lo resolvió —las dos direcciones
distintas en la misma captura— lo trajo Jose.

## ⚠️ TERCERA CORRECCIÓN MÍA SOBRE LO MISMO — era `redirect_uri_mismatch`

Jose mandó sus Script Properties y la pantalla del cliente de OAuth, y zanjan
el asunto:

    OAUTH_REDIRECT_URI = …/s/AKfycbzxKF659yaTtULpAYx4HngN…/exec
    WEB_APP_URL        = …/s/AKfycbzxKF659yaTtULpAYx4HngN…/exec   ← IGUALES

**Y la ventana decía, en letras grandes: `Error 400: redirect_uri_mismatch`.**

La causa real: el cliente de OAuth `Acopio - Production` tiene **Authorized
redirect URIs VACÍO**. Ninguna dirección. Google rechaza la petición antes de
mirar nada más.

**Tres diagnósticos míos y tres equivocados**, en orden: la forma `/a/macros/`,
la autorización caducada, y los dos despliegues distintos. Los tres explicaban
lo que veía. Ninguno era la causa.

**Y hay que decir una cosa incómoda sobre el arreglo de la v12.52: NO HABRÍA
SERVIDO AQUÍ.** Compara `OAUTH_REDIRECT_URI` con `WEB_APP_URL`, y en su
instalación coinciden. Es una guarda buena para un fallo real que existe —se
desalinean solas al copiar la hoja, al desplegar de nuevo y al cambiar de
proyecto— pero no es la que le hacía falta a él.

Lo que sí sirve de la v12.52 es la otra mitad: la espera dejó de ser muda, y el
mensaje ahora **nombra `redirect_uri_mismatch` y dice exactamente dónde se
arregla**. Esa parte sí habría ahorrado el día.

### Lo que falta, y no se puede hacer desde el navegador

La ventana de Google es de otro dominio: **no se puede leer su contenido**. Así
que la app nunca va a ver el `redirect_uri_mismatch` por sí misma. Lo único
posible es lo que ya se hizo: nombrarlo como causa probable y decir dónde
mirar.

**Pero sí hay algo comprobable desde el servidor y no está hecho:** el
instalador puede intentar una petición de prueba al endpoint de OAuth con esa
`redirect_uri` y ver si Google la rechaza. Si contesta `redirect_uri_mismatch`,
*Check installation* puede decirlo con certeza en vez de nombrarlo como
sospecha. **Pendiente, y es la pieza que de verdad cierra esto.**

### Y dos cosas sueltas de sus propiedades

1. **`GEMINI_API_KEY` empieza por `AQ.`, no por `AIza`.** Las claves de la
   Gemini API que hemos visto empiezan por `AIza`. No afirmo que la suya esté
   mal —Google ha cambiado formatos— pero es lo primero que miraría si el
   lector de documentos sigue fallando. Nuestra comprobación sólo mira que
   tenga 20 caracteres y no lleve espacios, así que una clave de otro tipo
   entra sin protestar.
2. **`FOLDER_PREFIX` sigue siendo `Acopio_PRODUCTION_OX_GLASS`** aunque la
   empresa se llame `MY WAREHOUSE`. Es exactamente lo que él describió de las
   carpetas, y confirma que el renombrado pendiente es real y no cosmético.

## ✅ ESCRITO (08/10) — `docs/LAS-TRES-DIRECCIONES.md`

Jose lo encontró él, y su frase es la que había que escribir en algún sitio:
*"eran las URL… el problema es que llevamos algunas sesiones con el mismo
problema pero no sabíamos qué detalle faltaba revisar."*

La dirección `/exec` tiene que estar en **tres sitios y ser la misma en los
tres**: el despliegue, las Script Properties (`WEB_APP_URL` y
`OAUTH_REDIRECT_URI`) y los *Authorized redirect URIs* del cliente de OAuth.
**Ninguno de los tres avisa**, y se desalinean solas al copiar la hoja, al
crear un despliegue nuevo y al cambiar el proyecto de Cloud.

El documento lleva: de dónde se copia la buena (y de dónde NO — la barra del
navegador miente), los dos síntomas con su significado, qué comprueba la app
sola y qué no puede comprobar, y una lista de un minuto para el final de cada
instalación.

Enlazado **arriba y abajo** en `INSTALL-GUIDE`, `CUSTOMER-SETUP`,
`DE-CERO-A-CLIENTE`, `PROYECTO-DE-CLOUD` y `CLAVE-DE-GEMINI`, y con el detalle
de "de dónde se copia" metido en el Paso 3 de la guía, que es donde se pega.

### Lo que sigue pendiente de esto

**Que el servidor PRUEBE la petición de OAuth** y vea si Google contesta
`redirect_uri_mismatch`. Hoy *Check installation* sólo puede comparar las dos
direcciones que están de nuestro lado; el tercer sitio está en Cloud Console y
desde el navegador no se puede leer. Con esa prueba, *Check installation*
podría **afirmarlo** en vez de nombrarlo como sospecha, y esto dejaría de
necesitar un documento.

## 🔵 LAS CINCO REGLAS DE DISEÑO DE LOS VÍDEOS DEL 09/10

Todas en `VIDEOS-DE-UX.md`. Lo que importa para la lista: **dan un criterio
escrito** a la tanda de "estandarizar la pantalla", que hasta ahora era "que se
vea bien".

| Regla | ¿Se puede atar a una prueba? |
|---|---|
| **Interlineado contra tamaño** (32 → 1.10, 16 → 1.50) | **Sí**, es aritmética sobre el CSS. Y empalma con los **18 tamaños de texto** que ya están anotados |
| **Un solo botón primario por ventana** | **Sí** — contar `btn-primary` por diálogo |
| Fondo blanco → borde; teñido → sombra; panel → plano | A medias: sí se puede comprobar que no haya borde **y** sombra a la vez. **Hoy lo rompemos** |
| Un color de marca, estados por color semántico | **Sí**, y ya lo cumplimos |
| Listar la diferencia, no el conjunto | No. Es criterio, y es de la landing |

**La excepción que hay que escribir antes de aplicar "un solo primario":** en
un aviso destructivo la salida segura NO puede ser un enlace de texto al lado
de un botón rojo. Esa asimetría es la protección. Aplicar la regla a ciegas ahí
sería hacer la app más bonita y más peligrosa.

## ⚠️ EL GUARDIÁN DE PRIVACIDAD CAZÓ MI PROPIO DOCUMENTO — 09/10

Al escribir el aviso de las tres direcciones lo metí también en
`INSTALL-GUIDE.md` y `CUSTOMER-SETUP.md`, que **se publican** como
`docs/instalacion.html` y `docs/setup.html`. `test-site-privacy` se puso roja:
*"no published page contains instructions about Script Properties"*.

**Tenía razón, y el arreglo es mejor que el texto que escribí.** Un cliente no
debe abrir Apps Script nunca —es la regla que Jose dejó escrita— así que
decirle "ve a Script Properties" era malo por dos motivos a la vez, y la regla
de privacidad cazó el segundo.

Las páginas públicas dicen ahora lo que el cliente **sí** puede hacer: usar
**Check this installation**, y los tres mensajes de error con lo que significa
cada uno — incluido el que NO es de direcciones (*Access not granted*, que es
`USERS_V3`) y que se confunde con ellos todo el tiempo.

El detalle técnico se queda en `LAS-TRES-DIRECCIONES.md`, que es nuestro y no
se publica.


## 🔴 ESTANDARIZAR LA PANTALLA — AHORA CON LAS CIFRAS CONTADAS, NO A OJO

Jose preguntó si estaba analizando los vídeos de verdad —colores, formas,
tamaños— y la respuesta honesta era **no a ese nivel**. Medido ya, sobre
nuestra propia hoja de estilos:

| Qué | Distintos hoy | Debería ser |
|---|---|---|
| Tamaños de texto | **41** (338 usos) | 5 o 6 |
| Radios de esquina | **15** | 3 o 4 |
| Interlineados | **13** (de 1 a 1.9) | 2, en función del tamaño |
| Sombras | **45** | 2 o 3 |
| Reglas con borde **Y** sombra | **9** | 0 |

**La entrada vieja de esta lista decía 18 tamaños de texto. SON 41.** Lo conté
a ojo entonces y me quedé a menos de la mitad. Ésta es la cifra contada.

La escala propuesta y el razonamiento completo, en `VIDEOS-DE-UX.md`. Lo que
importa aquí: **esta tanda ya no es "que se vea bien", tiene criterio escrito**,
y cuatro de las reglas se pueden atar a una prueba:

1. No más de 6 tamaños de texto distintos.
2. No más de 4 radios.
3. No más de 3 sombras.
4. **Cero reglas con borde y sombra a la vez** (hoy 9).

Sigue valiendo el aviso de tamaño: toca cientos de reglas de CSS, va pantalla
por pantalla con la prueba delante, en `siguiente` y en una sola entrega.

## ✅ Y EL COLOR YA LO CUMPLIMOS

Medido con la misma vara que los cinco reels: ellos gastan **menos del 2 % de
los píxeles** en color de marca; nosotros **1,0 % – 1,7 %**. La regla "un color,
lo demás gris" está cumplida. **Conviene saberlo para no "arreglar" lo que está
bien.**

## 🔵 LAS CUATRO DE JOSE DEL 15/10, CON SU ORDEN Y SU MOTIVO

El día que la app volvió. Jose mandó cuatro cosas en el mismo mensaje y pidió
opinión antes de que se tocara nada. Queda escrito aquí lo que son y por qué
van en este orden, que no es el orden en que las dijo.

### 1 · El toast verde que promete lo que todavía no ha pasado — EL ÚNICO URGENTE

Jose: *«es necesario que la app se haya actualizado y esté con los datos
correctos en el momento de que el toast verde haya desaparecido»*.

**Tiene razón y no es un capricho de forma: hoy el aviso miente.** `_pulseOk`
llama a `setConnStatus('online')` y DESPUÉS pide los datos con
`loadDataFromGoogle(true, true)`. El aviso verde dura 6 segundos y una carga
de Apps Script tarda 10-20. O sea que el verde se va, en el caso normal, antes
de que lleguen los datos — y si encima le ponemos «data has been updated»,
estamos firmando un papel que la app no cumple. Alguien que acaba de recuperar
la conexión lee «ya está al día», mira una cifra vieja y actúa sobre ella.

Lo que hay que hacer: que el verde salga diciendo que está actualizando, y que
el texto cambie a «actualizado» CUANDO la carga se haya aplicado de verdad —
y que la cuenta atrás para irse empiece ahí, no antes.

**Y una cosa que no se puede prometer:** «se actualiza sólo lo que cambió
mientras estaba offline». La app no tiene sincronización por diferencias;
`getInitialData` trae la foto entera. El resultado para quien mira la pantalla
es el mismo —los datos quedan correctos— pero no es un delta, y el texto no
debe sugerir que lo sea.

### 2 · El botón «Scan label» junto a Entry y Exit

Jose: *«sería mucho más útil, práctico y fácil para el usuario que utiliza
celular»*.

**De acuerdo, y por un motivo concreto:** escanear SIEMPRE acaba en un Entry o
en un Exit. Hoy vive en el menú de la cuenta, que son dos toques y un objetivo
pequeño para un dedo con guante; los dos botones a los que lleva están en otra
pantalla. Ponerlo donde ya se trabaja quita el rodeo entero.

Se queda TAMBIÉN en el menú: no cuesta nada y es donde se busca lo que no se
usa a diario.

Lo único a cuidar: en un escritorio sin cámara el botón no puede quedarse
muerto. `_escSePuede()` ya sabe decidirlo; el botón se esconde o se explica,
no se queda ahí sin hacer nada.

### 3 · El toast de offline, más alto y en dos líneas

Forma, y la forma aquí sí comunica: un título que se lee de un vistazo y
debajo la instrucción. Va después de la 1 porque comparten el mismo trozo de
código y hacer las dos a la vez es una entrega, no dos.

**El texto que pidió Jose dice lo contrario de lo que quiere decir:** *«your
data can be updated»* — lo que pasa sin conexión es que NO se puede guardar
nada. Propuesto en su lugar, y pendiente de que él lo apruebe:

> **You're offline**
> Nothing you save will be recorded. Check your connection before making any
> movement.

### 4 · La tarjeta naranja que tapa la tabla — SIGUE AHÍ

«ARRIVED · ENTRY NOT MADE», encima de las primeras filas del inventario. Está
en esta lista desde la entrada 21 y vuelve a salir en TRES capturas del 15/10.
No rompe nada y por eso lleva semanas sin tocarse; aparece en todas las
capturas que Jose manda, y eso ya es una respuesta sobre cuánto estorba.

### Apunte del 15/10 sobre el punto 1, de Jose

Jose: *«pero la app ya lo hace, en lugar de actualizar toda la app sólo cambia
lo que se cambió o movió»*.

**Tiene razón en lo que se ve y yo la tenía en lo que pasa por el cable, y lo
que importa es lo primero.** `loadDataFromGoogle(true, true)` —el modo
silencioso de la v11.47— trae la foto entera pero NO desarma la pantalla:
repinta, y en pantalla sólo cambia lo que de verdad es distinto. Para quien
mira, es un delta. Por el cable no lo es.

Lo que esto cambia en la práctica: el texto «Data has been updated in the app»
es honesto y se puede usar, porque el estado final es correcto. Lo que sigue
sin poderse prometer es *rapidez* de delta — la carga tarda lo que tarda una
`getInitialData` entera, diez a veinte segundos, y por eso el aviso verde tiene
que esperarla en vez de contar seis segundos.

Y lo que Jose recuerda del vídeo: **los movimientos que vuelven de la papelera
NO se actualizan de esa forma.** Está anotado en esta lista (punto 15 y la
sección de los dos indicadores de espera) pero sólo por los INDICADORES. Queda
añadido aquí lo otro: el repintado tras restaurar no se comporta como el resto
de la app. Pendiente, con el vídeo del 14/10 como referencia.

## 🔵 EL QR QUE ABRE LA APP — IDEA DE JOSE DEL 15/10, Y LO QUE LE FALTA

Jose: *«una persona entra a la bodega de OX, ve un label con un QR, saca su
teléfono y lo escanea, este lo lleva al link de la app de OX, si está entre los
usuarios se le da acceso y puede ver la información de ese material»*.

**La idea es buena y el control de acceso ya existe** —`getUserRole` contesta
DENIED a quien no está en la lista—, así que la mitad difícil está hecha. Lo
que falta es el enlace, y ahí hay un problema que hay que resolver ANTES de
imprimir una sola etiqueta.

### Lo que impide hacerlo hoy

**La URL de un despliegue de Apps Script se muere.** Cambia cada vez que se
crea un despliegue nuevo, y Jose ya archivó todos los enlaces viejos en
octubre por ese mismo motivo. Una etiqueta de estante vive AÑOS pegada a un
rack. Imprimir hoy una URL que caduca el mes que viene es fabricar basura con
cara de inventario: el QR seguiría escaneando y llevaría a una página muerta,
que es peor que no llevar a ninguna parte.

**Y el código crece.** Hoy una etiqueta de ubicación lleva `ACPL1\nA1A`: once
caracteres. Una URL de despliegue son ~120. Eso sube los módulos del QR y, con
el mismo tamaño impreso, baja la distancia de lectura — justo lo que Jose pidió
cuidar («estos se deben leer de lejos»).

### Lo que lo haría posible, y es trabajo de la web, no de la app

Un redirector corto y permanente en `acopio.net` —`acopio.net/r/<código>`— que
reenvíe al despliegue actual de cada cliente. Entonces:

- La etiqueta lleva una URL **corta y que no caduca**; el despliegue puede
  cambiar cien veces y el papel pegado al estante sigue valiendo.
- El código sigue cabiendo: `acopio.net/r/A1A` son 18 caracteres, no 120.
- El lector de dentro de la app aprende a leer los dos formatos, que es un
  `if` — pero cuidado, son **dos formatos que tienen que coincidir** y en este
  proyecto eso ya ha salido caro once veces. Una sola función que decida.

### Lo que hay que pensar antes, y no es técnico

Una etiqueta pegada a un estante la ve cualquiera que entre a la bodega: un
transportista, un visitante, alguien que viene a vender algo. Poner la
dirección del sistema en la pared es publicarla. El control de acceso aguanta
—quien no está en la lista no entra— pero conviene decidirlo a propósito y no
descubrirlo después.

**Va después de lo de ahora.** Necesita el redirector, y el redirector es una
pieza nueva de `acopio-site` con su propio mantenimiento.

## 🔴 LA CÁMARA NO PUEDE FUNCIONAR DENTRO DE APPS SCRIPT — 15/10

Jose, con vídeo desde su teléfono: el botón salía, la ventana se abría con su
mira dibujada, decía «Point the camera at a label», y **el recuadro estaba
negro**. Chrome no llegó a pedir permiso de cámara en ningún momento.

### No es un fallo del código. Es dónde vive la app.

Apps Script sirve esta página dentro de un **iframe de otro origen**
(`googleusercontent.com`, incrustado en `script.google.com`). Desde Chrome 64,
un iframe de otro origen **no tiene cámara** salvo que la página que lo
incrusta se la conceda con `allow="camera"`. Quien incrusta este iframe es
Google. No lo controlamos y no hay forma de cambiarlo desde dentro.

`getUserMedia` falla con `NotAllowedError` — el mismo error que si el usuario
hubiera dicho que no— y por eso parecía un problema de permisos del teléfono.
No lo era.

Confirmado con tres fuentes independientes el 15/10. No hay documentación
oficial de Google sobre esto; hay un proyecto público que lo resuelve alojando
el escáner FUERA de Apps Script y devolviendo el dato por `doPost`.

### Lo que esto significa para la v12.70

**El lector de códigos que se construyó no puede funcionar donde está.** Toda
la lógica —leer el texto, decidir el movimiento, rellenar el formulario sin
guardar— está hecha y probada, y sirve. Lo que no sirve es la fuente de
imágenes.

Lo que se hizo hoy es que deje de mentir: `_escSePuede` pregunta ahora
`allowsFeature('camera')` ANTES de encender nada, así que el botón se esconde y
el mensaje explica que lo bloquea Google y que no es algo que el usuario pueda
arreglar. Un rectángulo negro que pide apuntar la cámara es peor que no tener
el botón.

### Las salidas, y la buena ya la propuso Jose

1. **EL QR QUE ABRE LA APP** (idea de Jose del 15/10, ya en esta lista). La
   cámara que lee es **la del propio teléfono**, no una página nuestra, así
   que el iframe no pinta nada. Es la única de las tres que no pelea contra la
   plataforma. Necesita el redirector corto y permanente en `acopio.net/r/<código>`
   que ya está anotado, y ahora ese redirector deja de ser «una mejora» para
   ser **la forma de escanear**.

2. **Alojar el escáner fuera** (en `acopio.net`, que ya es nuestro y ya está en
   GitHub Pages) y devolver el código leído. Funciona, y el coste está en la
   vuelta: o se recarga la app entera con el código en la URL —diez a veinte
   segundos por lectura, inviable para treinta lecturas seguidas— o se manda a
   un `doPost` y el latido lo recoge, con veinte segundos de retraso. Las dos
   son peores que la 1 para el trabajo diario.

3. **Sacar la app de Apps Script.** No hoy.

**Recomendación: la 1.** Y conviene decirlo entero: eso convierte el
redirector de `acopio.net` en trabajo necesario, no opcional.

## 🔵 LA CABECERA SE COME EL NOMBRE DE LA EMPRESA AL HACER SCROLL — 15/10

Jose, con el mismo vídeo: *"al hacer scroll el nombre de la empresa desaparece,
no debería ser así, hay que poner en la lista que debemos trabajar mejor en
eso"*.

Es la cabecera que se encoge en el teléfono —existe a propósito, y
`test-telefono` la defiende: *"que la cabecera se encoja al bajar en el
teléfono y NO en el escritorio"*—. Lo que no se pensó es **qué se sacrifica al
encogerla**, y resulta que lo primero que se va es el nombre del cliente.

Y ahí está lo que hace que importe más de lo que parece: **ese nombre es suyo,
no nuestro.** La app es blanca y el nombre de la empresa es media marca
blanca. Que lo primero en desaparecer sea precisamente eso es lo contrario de
lo que la cabecera debería proteger.

Lo que hay que decidir cuando toque: qué se encoge primero. Las pestañas
ocupan dos filas y podrían pasar a una; los botones de la derecha podrían
juntarse. El nombre debería ser lo ÚLTIMO en irse, no lo primero.

## 🔵 Y UNA PREGUNTA DE JOSE QUE MERECE QUEDAR ESCRITA

*"¿La app actualmente puede diferenciar entre un teléfono y una
computadora?"*

**No, y es a propósito: detecta CAPACIDADES, no aparatos.** Conviene que esté
escrito porque explica cosas que de otro modo parecen fallos:

- El CSS responde al **ancho de la ventana**. Una computadora con la ventana
  estrecha se ve como un teléfono, y debe verse así: lo que importa es cuánto
  sitio hay, no qué aparato es.
- El botón de escanear responde a **si hay lector y cámara**. Por eso Jose lo
  ve en el teléfono y no en su computadora con la ventana estrecha, aunque las
  dos se vean igual de estrechas. Las dos cosas son correctas.

Detectar el aparato sería peor: una tableta con teclado, un portátil con
pantalla táctil y un teléfono grande no caen en ninguna casilla, y la lista de
excepciones no se acaba nunca. Las capacidades se preguntan y se contestan.

**Lo que sí reveló esta pregunta** es que esconder algo en silencio genera la
pregunta «¿está roto?». Jose tuvo que preguntarlo. Eso vale para el botón de
escanear y para cualquier otra cosa que desaparezca sin decir por qué.

## 🔴 UN RETURN DE MATERIAL QUE NUNCA SALIÓ CREA STOCK DE LA NADA — 15/10

Encontrado al analizar el vídeo de Jose del 15/10. **No lo provocó él** —usó un
traslado entre estantes, que es seguro— pero el agujero está abierto y cualquiera
puede caerse dentro.

`RETURN` hace tres cosas: `siteQty -= qty` (con suelo en cero), `warehouseLocs
[rack] += qty` y `warehouseQty += qty`. Si el material NUNCA salió a esa obra,
`siteQty` ya era cero y la resta se la traga en silencio — pero la suma a bodega
se hace igual. **Cuatro ventanas devueltas de una obra a la que nunca fueron son
cuatro ventanas nuevas.** Las 51 de Jose habrían pasado a 55.

Es exactamente la clase de fallo que este proyecto ya conoce: el suelo en cero
oculta la mitad de la operación y la otra mitad sigue adelante.

**El arreglo:** una devolución no puede devolver más de lo que esa obra tiene en
sitio. Avisar —no bloquear— cuando se pasa, por lo mismo que el aviso de «te
pasaste del estante»: puede haber historia legítima que la app no contó. Pero
avisar siempre, porque aquí la consecuencia no es un número raro en una pantalla:
es inventario inventado.

Se hace igual, haya o no decisión sobre el `Reassign` de abajo.

## 🟠 FALTA «REASSIGN»: EL MATERIAL QUE NUNCA SALIÓ — 15/10

Jose, con vídeo: *"retorno de un material que no ha salido a la bodega, que no se
va a usar y que quiero usar en otro proyecto... no sé si lo hice bien, pero yo
creo que no, y no se puede"*.

Tiene razón: no se puede. Lo que hizo fue un **Transfer Between Racks** —4
ventanas de B2A a A3A— y escribió el cambio de obra en los comentarios, porque no
hay otro sitio donde ponerlo. El stock quedó bien; el dato no sabe nada.

### Hay DOS formas de que el material quede libre, y la app entiende una

| | ¿Salió a la obra? | ¿La app lo sabe? |
|---|---|---|
| Vuelve de la obra | sí, y volvió | ✅ `Return` + proyecto de origen (v12.72) |
| **Nunca salió** — se compró para A, no se usa, va a B | no | ❌ **no existe** |

Y el segundo es **el más común en construcción**: se pide material para una obra,
la obra cambia, y el material nunca se movió del estante. Lo que falta no es un
caso raro; es el caso normal.

### Lo que se propone

Un movimiento `REASSIGN`. Es el boneyard sin el viaje:

- NO mueve ni una unidad. El stock no cambia. A diferencia del traslado, tampoco
  cambia de estante.
- Guarda material, cantidad, **de qué obra**, y por qué.
- Entra al boneyard igual que una devolución: «4 left over from BLACK HOUSE 2».

**La mitad de consumir ya está hecha.** El `Exit` que se lleva esas unidades a
otra obra las ofrece y registra el origen desde la v12.72, y no hay que tocarlo.
Lo único que falta es la segunda puerta de entrada.

### Y conviene guardar CUÁL de las dos fue

Las dos cifras de Jose no son iguales: material que nunca salió es un error de
estimación puro; material que fue y volvió costó además un viaje de camión. Son
dos números distintos sobre el mismo material y separarlos cuesta una columna.

## ✅ DECIDIDO (15/10) — SALIR DE APPS SCRIPT QUEDA DESCARTADO PARA SIEMPRE

Jose: *"la 3 no es posible y creo que nunca lo será, porque lo que queremos es que
el usuario use solo lo de Google y por eso usamos el Sheet como base de datos"*.

Queda como DECISIÓN y no como pendiente, porque cambia lo que se puede prometer:

- El vídeo en vivo de la cámara **no va a funcionar nunca** dentro de la app. No
  es un «todavía no»: es el precio de que los datos vivan en el Drive del cliente,
  y ese precio se paga a propósito.
- Cualquier idea futura que empiece por «si la app estuviera en otro sitio…»
  está muerta antes de escribirse. Ahorra discusiones.

Lo que queda para escanear: la foto (hecho, v12.74), el QR que abre la app con la
cámara nativa, y la página de escáner alojada fuera.

### Y el ORDEN de esas dos, que lo puso Jose

*"La 2 podemos probarla, pero no quiero hacer la 1 y que la 2 sí funcione."*

Primero **probar** si `postMessage` entre la pestaña del escáner y la app aguanta
dentro del marco de Apps Script. Si aguanta, es mejor que el redirector —visor en
vivo y sin recargar la app— y el redirector sobra. Si no aguanta, se hace el
redirector sabiendo que era la única. Probar antes de construir, no al revés.

### Una aclaración que costó un malentendido

Describí la lectura por foto como «haz una foto de la etiqueta» y Jose entendió
«hazla, guárdala, búscala y súbela». No es eso: se pulsa, **se abre la cámara del
teléfono a pantalla completa con su visor en vivo**, se apunta, se dispara, y la
app lee. Dos o tres toques, y la foto nunca existe como archivo que nadie vea.

Queda escrito porque el error fue mío al contarlo, y porque la diferencia entre
esas dos descripciones es la diferencia entre «sirve» y «no pienso usar eso».

## 🔵 UNA VERSIÓN GRATIS PARA LA LANDING — IDEA DE JOSE DEL 15/10

Jose: *"quiero crear una versión básica y gratuita de la app para regalar en la
landing, tan básica que no tenga detección de usuarios ni códigos QR ni reservas...
sólo entry, exit, transfer, return y waste... que les dé la oportunidad de
contactarme para pagar por el servicio pro... a las personas les gustan las cosas
gratis, así podemos subir vídeos a redes"*.

Anotado entero aquí porque la decisión está sin tomar y las razones importan más
que la lista de funciones. El análisis completo, en la respuesta del 15/10; lo que
queda escrito para no perderlo:

- **Lo decisivo NO es qué se quita, es cuánto cuesta empezar.** Hoy instalar son
  diez minutos pegando dos archivos y desplegando. Para algo que se regala, ése es
  el embudo entero y gotea por todas partes.
- **Dos códigos no, y no hace falta.** Un solo archivo con una constante de
  edición, y lo gratis es el mismo archivo con otra constante. Así un fallo de
  stock se arregla UNA vez. Congelar funciones sí; congelar correcciones no — el
  agujero del `RETURN` de arriba estaría en la versión que usan quinientos
  desconocidos.
- **El muro natural es UNA persona.** Gratis para quien trabaja solo; Pro cuando
  hay equipo. Se explica en una frase y nadie se siente engañado.
- **Cada quien instala su propia copia** en su Drive. Sin eso, «sin detección de
  usuarios» significa que todos escriben en la misma hoja.

## 🔴 VERIFICAR LA APP ANTE GOOGLE — ANTES DE REGALAR NADA · 17/10

Medido en `docs/prueba-un-clic/PASOS.md`, segunda ronda. Resumen de lo accionable:

`script.container.ui` es un permiso **SENSIBLE** (lo dice la consola de Cloud, no
una fuente de terceros). Mientras no esté verificado, el proyecto de Cloud tiene
un **tope de usuarios de por vida que no se puede reiniciar ni cambiar** — el
número que Google documenta es 100. Cien instalaciones y el proyecto queda
inservible para siempre.

**La verificación de un permiso sensible es GRATIS** (la que cuesta 500–4.500 $/año
es la auditoría CASA, y ésa sólo aplica a permisos *restringidos*, que la versión
gratis no pide). Lo que pide:

| | Estado |
|---|---|
| Dominio verificado (`acopio.net`) | ✅ es nuestro |
| Página de inicio en ese dominio | ✅ la landing |
| **Política de privacidad** publicada ahí | ❌ **falta** |
| **Condiciones del servicio** publicadas ahí | ❌ **falta** |
| **Vídeo de YouTube** con el flujo de permisos | ❌ **falta** |
| Nombre y logo | ✅ |

> **CORREGIDO EL MISMO DÍA — esto NO es urgente, y por una buena razón.**
> Jose comprobó que **la copia NO hereda el proyecto de Cloud**: se fabrica el
> suyo («GCP: Predeterminada»). Luego el tope de 100 **no se consume nunca** por
> el camino de copiar — cada quien es el usuario 1 de su propio proyecto.
>
> El precio de eso es el otro lado de la misma moneda: un proyecto automático
> está siempre en Testing, así que **la pantalla fea sale para todo el que
> instale**, y verificar ACOPIO FREE no la quita porque las copias no usan ese
> proyecto.
>
> La verificación sigue haciendo falta, pero para **otra cosa**: para convertir
> esto en un add-on de Marketplace, que es el único camino donde todos los
> usuarios comparten un proyecto. Ver `docs/prueba-un-clic/PASOS.md`, sección 6.

### Y un detalle del primer minuto que puede costar la mitad del embudo

La pantalla de permisos trae las casillas **desmarcadas**. Quien pulse
*Continuar* sin marcar, instala una app sin permisos y ve un error de Google.

Dos cosas: el vídeo de instalación tiene que enseñar la pulsación de
**«Seleccionar todos»**, y la app tiene que detectar que llegó sin permisos y
decirlo con sus propias palabras.

### El techo de la ventana, para cuando se diseñe

Tres medidas en tres pantallas distintas: **el ancho sigue a la ventana del
navegador; el alto se queda entre 755 y 767 px y no sube** ni con una pantalla de
1440. Se diseña contra **~750 px de alto fijo**.


## 🔴 LA PANTALLA FEA EN LA VERSIÓN GRATIS — DECISIÓN PENDIENTE · 17/10

Medido, no supuesto: **las copias no heredan el proyecto de Cloud.** Cada copia
usa un proyecto automático, los automáticos están siempre en modo Testing, y en
Testing Google enseña «esta app no está verificada» a todo el mundo.

**No es un fallo de montaje y no se arregla configurando mejor.** Son dos
caminos, y hay que elegir uno:

| | Pantalla fea | Tope de 100 | Coste |
|---|---|---|---|
| **Copiar la hoja** (lo de hoy) | sale siempre | nunca aplica | 0 |
| **Add-on de Marketplace** | se va al verificar | aplica hasta verificar | verificación (gratis) + rehacer la distribución |

**Desplegar como app web NO es una salida**: la copia desplegada sigue usando su
proyecto automático.

Lo que inclina la balanza no es técnico: es cuánta gente abandona al ver el
aviso. Si se elige el camino 1, el vídeo y la landing tienen que **adelantarlo**
en vez de dejar que sorprenda.

### Pendiente inmediato, con reloj

El branding de ACOPIO FREE está **verificado pero sin publicar**. Google da
**7 días** desde el 17/10 antes de que caduque y haya que repetir el trámite.
Botón **Publish branding** en la pantalla de Branding. Es lo que hace que los
enlaces de política y condiciones salgan en la pantalla de permisos.

## 🟡 LO QUE JOSE VIO EL 19/10 Y **NO** ES DE LA VERSIÓN BÁSICA

Repasando Acopio Basic entera encontró tres cosas que pasan **igual en la
versión de pago**. Se apuntan aparte para no mezclarlas con el trabajo de la
edición gratis:

1. **Las filas del Dashboard saltan.** *"En 'Movements' no se mueven, pero en el
   'Dashboard' sí se mueven y saltan algunas según cambio de categorías y
   estado."* Quiere que sean estándar: que no se muevan aunque cambien
   categorías o estados. Mismo trabajo que ya se hizo en Movements.

2. **Las tarjetas llevan un movimiento de más.** Al borrar una, todas suben, y
   menos de un segundo después todas bajan para dejar entrar a la que estaba
   fuera. *"El primer movimiento se ve bien pero luego parece un error."*

3. **La ventana de stock bajo se abre** aunque no deje editar. En la básica no
   se puede cambiar desde la app, pero si alguien lo modifica en la hoja sí se
   mostraría.

## 🟡 MEDIR EL VAIVÉN DEL MAZO DE TARJETAS · 19/10

La v12.79 arregló lo que Jose describió —*"al eliminar una se borra, todas se
ruedan para arriba y en menos de 1 segundo después todas se bajan para dejar
entrar a la que estaba afuera"*— con `.conserva-hueco`: no se devuelve la altura
cuando hay un relevo esperando.

**El arreglo es por razonamiento y está sin medir.** Se intentó en
`tools/test-topbar-deck.js` y no se pudo: ese banco monta tres tarjetas
estáticas, y en él la tarjeta de abajo no se mueve ni con el arreglo ni sin él.
La comprobación habría pasado sin comprobar nada.

**Lo que haría falta:** el mazo real con más de `_DECK_VISIBLE` tarjetas,
llamando a `_dismissSysCard`, midiendo **a mitad de la animación** — al final
las dos versiones acaban igual, así que el resultado no distingue. Lo que se ve
es el camino, no el destino.

## 🟡 LAS FILAS DEL DASHBOARD: NO REPRODUCIDO · 19/10

Jose: *"en el 'Dashboard' sí se mueven y saltan algunas según cambio de
categorías y estado"*.

`tools/test-columnas.js` mide ahora **las dos tablas** —antes sólo Movements— con
siete filtros de categoría y cinco de estado, y con contenido que NO CABE en los
anchos declarados. **Ninguna columna se mueve, ni con reparto fijo ni sin él.**
Tampoco se mueve verticalmente: la tabla, la cabecera y las filas miden lo mismo
bajo todos los filtros.

Lo único que sí cambia la forma es que **al elegir una categoría desaparece la
columna Category** — y eso es una mejora del propio Jose del 9 de septiembre,
protegida por `test-stock-cat-column.js`. Puede ser lo que está viendo.

**Falta de él:** qué par de filtros exactos lo enseña, o un clip corto. Sin eso
no hay nada que arreglar que no sea deshacer una mejora.

## 🟡 MEDIR EL SALTO DE COLUMNAS EN EL ANCHO JUSTO · 20/10

**Mecanismo identificado, arreglo puesto, y sin medir.** Queda dicho.

Jose, con vídeo de Movements: *"el ligero movimiento en las columnas al cambiar
de categoría y estado"*. Lo que lo mueve **no es el reparto de la tabla**: es que
la **barra vertical** aparezca o desaparezca. Se lleva o devuelve sus ~15 px de
ancho disponible, y filtrar cambia cuántas filas hay.

**La huella está en su propio vídeo:** con el filtro `SCREENS` no hay barra
horizontal abajo; con `WINDOW`, con las mismas columnas, sí la hay. Lo único que
cambió entre los dos es el número de filas.

El arreglo es `scrollbar-gutter:stable` en `.table-wrapper`: reserva ese carril
siempre, haya barra o no.

**Por qué `tools/test-columnas.js` no lo discrimina:** ahí la tabla tiene
dieciséis columnas y es mucho más ancha que su caja, así que vive siempre en su
`min-width` y los 15 px no le cambian nada. Se quitó el arreglo a propósito y la
prueba siguió en verde.

**Lo que haría falta:** un ancho de ventana en el que la tabla quepa **por
poco** — el caso de Jose. Con las columnas por defecto de Movements y una
ventana alrededor de 1280 px debería caer en esa banda.

## 🔵 LAS LOCACIONES VAN POR DETRÁS DEL RESTO DE LA APP · 22/10

Jose, 22/10, con un vídeo de dos minutos en Ajustes → Locations:

> *"Debemos mejorar la forma de eliminar locaciones. Ya lo hemos mejorado en
> otros lados, como los movimientos y otros lugares. También, cuando se mueve
> una locación, aun si se la deja en el mismo lugar y se da clic en discard,
> toda la ventana se rehace de nuevo. Eso no es lo que hemos estado corrigiendo
> en el resto de la app."*

### Las dos cosas, y son distintas

**1 · Borrar pide confirmación con una ventana encima.** En Movements eso ya no
pasa: la fila se va al pulsar, con su animación, y el trabajo ocurre detrás. En
Locations sigue saliendo un cuadro de *«¿Borrar la locación X?»* que hay que
leer y contestar — y en el vídeo se ve borrando **doce locaciones de una
vez**, o sea doce cuadros.

> **OJO, Y ES LA PARTE QUE NO SE PUEDE COPIAR TAL CUAL:** borrar un movimiento
> es reversible —hay papelera y restaurar— y borrar una locación no lo es
> hoy. Quitar el cuadro sin dar marcha atrás cambiaría una molestia por una
> pérdida. Lo que hay que copiar de Movements **no es quitar la pregunta: es
> poder deshacer**. Primero el deshacer, después se quita el cuadro.

**2 · `Discard` repinta la ventana entera.** La barra de *«Layout changed — not
saved yet»* trae `Save layout` y `Discard`, y `Discard` reconstruye todo el
panel: se ve el parpadeo, se pierde el sitio donde estabas y el desplazamiento
vuelve arriba. Y pasa **aunque la locación se haya dejado donde estaba**, que es
el caso más común de todos — agarras una, lo piensas, la sueltas en el mismo
sitio.

**Dos arreglos, y el primero es casi gratis:**

- **Si nada se movió de verdad, `Discard` no tiene nada que descartar.** Hoy la
  barra aparece por el gesto, no por el cambio. Comparar el orden de antes con
  el de ahora y no enseñar la barra cuando son iguales quita el caso más común
  sin tocar nada más.
- **Y cuando sí cambió**, `Discard` tiene que devolver las fichas a su sitio,
  no reconstruir el panel. Es el mismo principio que ya se aplicó al mazo de
  tarjetas y a la tabla: **mover lo que cambió, no repintarlo todo**.

### Por qué va aparte y no se hizo ya

Porque el deshacer de una locación borrada es una pieza de servidor —dónde se
guarda, cuánto dura, qué pasa si entretanto alguien la usó— y meterla a
última hora junto a seis correcciones de pantalla es cómo se rompen las cosas.
Queda con su plan escrito y con el orden claro: **deshacer primero, cuadro
después**.

## 🔵 LA VENTANA DE MOVIMIENTO, LIMPIA — Y LAS TRES COSAS QUE SON LA MISMA · 21/10

Jose, 21/10, con tres capturas marcando el checkbox de Label, COST PER UNIT,
DOCUMENTS y *Send notification email*:

> *"Quiero que todas las cosas que no se usen no molesten en la pantalla o
> ventana... analiza qué cosas puedes esconder detrás de un checkbox y deja la
> ventana mucho más limpia. Haz una lista y dime qué harías tú."*

### Primero: cuánto hay que atravesar hoy

Para registrar *"llegaron 20 ventanas, están en A1A"* —el caso corriente— hay
**dieciséis controles** en pantalla:

| Dónde | Qué |
|---|---|
| Arriba | Fecha, «todos comparten proveedor/GC/proyecto/PM/recibido por/comentarios» |
| Por material | Categoría, Nombre, Unidad, **Costo por unidad**, **🏷 Label**, y N× (Estante, Cantidad) |
| Compartidos | Proveedor, GC, PO#, Proyecto/Cliente, Recibido por, PM, Comentarios |
| Secciones | **📎 Documentos** (Cámara/Archivos/Drive + AI Extract), **✉ Enviar correo** |

Dos de ellos —nombre y cantidad— son el movimiento. Los otros catorce son
contexto que **algunas bodegas llenan siempre y otras nunca**.

### Mi propuesta: no es un checkbox, son CUATRO tratos distintos

El mecanismo que propone Jose —esconder detrás de un checkbox— es correcto para
una parte y es el equivocado para otra. Lo que hay en esa ventana no es una sola
clase de cosa:

#### A · Lo que ESTA bodega nunca usa → **que la app lo aprenda, sin preguntar**

`GC`, `PO#`, `PM`, `Costo por unidad`, `Camión`. Hay bodegas que llenan los cinco
y bodegas que no llenan ninguno. **Y la app ya sabe cuáles**: tiene todos los
movimientos que esa instalación ha guardado.

> **Un campo que lleva 30 movimientos vacío es ruido PARA ESA BODEGA.**

Se pliegan solos en una línea «**+ 4 campos más**». Un clic los trae todos, y en
cuanto se usa uno, ese se queda a la vista para siempre.

**Por qué esto es mejor que un checkbox**, y es la parte que añado a la idea de
Jose: un checkbox es **una decisión más** que tomar — la ley de Hick de su propia
lámina— y además hay que acordarse de ir a marcarlo. Esto acierta de entrada,
sin configurar nada, y se adapta solo el día que la bodega empiece a usar PO.

**El riesgo, dicho antes de construirlo:** alguien nuevo no encuentra un campo
que sí necesita. Por eso la línea «+ N campos más» **está siempre**, nunca
desaparece del todo, y dice cuántos esconde. Esconder sin dejar la puerta a la
vista sería cambiar un problema por otro peor.

#### B · Lo que es de OTRO momento → **una línea que se despliega** (aquí sí)

`📎 Documentos` y `✉ Enviar correo` no son datos del movimiento: son **cosas que
se hacen después**. Hoy ocupan dos bloques enteros debajo de los campos, con
botones de Cámara, Archivos y Drive siempre desplegados.

Se colapsan a una línea cada uno: `📎 Añadir documentos` y `✉ Avisar a alguien`.
**Aquí el checkbox de Jose es exactamente lo correcto**, porque son acciones
opcionales y no información que falte.

#### C · Lo que depende de quién mira → **ya funciona, y conviene saberlo**

`Costo por unidad` **ya está cerrado** para quien no tiene permiso de ver costos
(`_canSeeCosts()`). A un bodeguero no se le enseña. Jose lo ve porque es ADMIN,
y eso es correcto. **No hay nada que arreglar aquí** — queda en el grupo A: si
esta bodega nunca pone precios en la entrada, se pliega como los demás.

#### D · Lo que no debería estar en ese sitio → **🏷 Label**

Imprimir una etiqueta **no es un dato de la recepción**, es algo que se hace con
el material una vez guardado. Está en la línea de cada material, arriba a la
derecha, compitiendo por el sitio con el nombre — y en la edición gratis además
lleva candado, o sea que es **una puerta cerrada en el formulario más usado de
la app**.

Se va de ahí. Después de guardar, el aviso de «guardado» puede ofrecer
«imprimir etiquetas» — que es cuando de verdad se quiere.

### El orden, y cuánto pesa cada uno

| | Qué | Quita de la ventana | Dificultad |
|---|---|---|---|
| 1º | **B** — plegar Documentos y Correo | dos bloques enteros | fácil, y es casi todo el efecto visual |
| 2º | **D** — sacar 🏷 Label de la línea | un control por material | fácil |
| 3º | **A** — que la app aprenda qué no se usa | hasta cinco campos | medio; pide una pasada sobre el historial |

**Si sólo se hace el 1º y el 2º, la ventana ya cabe sin desplazarse.**

---

## 🔵 CAMIONES — YA ESTÁN CONSTRUIDOS Y NADIE PUEDE VERLOS · 21/10

Jose, 21/10: *"si alguna bodega maneja camiones, ¿deberíamos poner una forma de
que el usuario ingrese su número o nombre, o le diga cuáles desde una lista,
pero que no moleste si no los tiene?"*.

**Ya está hecho. Todo.** Y está invisible:

| Pieza | Estado |
|---|---|
| Campo en el formulario | `#mTruckField` existe — **`display:none` en el HTML y NADIE lo enciende nunca** |
| Desplegable | se llena solo desde `config.trucks`, saltando los inactivos |
| Guardado | `truck:` viaja en el movimiento y se escribe |
| Búsqueda | la tabla ya busca por camión (`m.truck` está en los campos buscados) |
| Gestión | `updateTruck_` en el servidor, con nombre, persona asignada y estado |
| Columnas | `Truck`, `Truck Person`, `Truck Status` ya existen en CONFIG |

O sea que la respuesta a su pregunta es **sí, y la forma que propone es
exactamente la que está construida**: una lista, no texto libre.

**Lo que falta es una línea**, y además resuelve sola el «que no moleste si no
los tiene»: enseñar `#mTruckField` **sólo si `config.trucks` tiene algo**. Sin
camiones registrados, el campo no existe para esa bodega; con uno registrado,
aparece. Es el mismo trato del grupo A de arriba, pero sin necesidad de aprender
nada del historial: la lista de camiones ya ES la respuesta.

> **Y es una señal de algo más grande:** una función entera —servidor, hoja,
> búsqueda, exportación, ajustes— construida y que **nunca se puede alcanzar**.
> Vale la pena un repaso buscando otras: es el mismo patrón de «una protección
> escrita y nunca ejecutada» que este archivo ya tiene contado cinco veces, en
> su versión de producto.

---

## 🔵 LA RESPUESTA DE JOSE SOBRE ENTREGAS PARCIALES — ES MEJOR QUE MI PREGUNTA · 21/10

Yo había escrito que juntar «marcar llegada» y «hacer la entrada» obligaba a
inventar un estado de «parcialmente recibida». Jose:

> *"Lo que yo propongo es que, al crear incomings, se creen POR SEPARADO. El
> crearlos unidos no significa que vinieron juntos. Entonces sólo se hace un
> check-in de los materiales o proyectos que llegan y no de una lista
> específica. No necesitamos hacer grupo; por separado, todo queda igual."*

**Tiene razón, y mi pregunta era mala porque daba por supuesto el grupo.** Si
cada cosa esperada es su propia fila, «parcialmente recibida» **deja de existir
como estado**: tres filas de cinco se reciben, dos siguen pendientes. El estado
ya existía — sólo que por fila y no por grupo.

Y eso convierte «crear varios a la vez» en lo que debería ser: **comodidad de
formulario**, N filas independientes de una sola pasada, sin estructura nueva
detrás. Mucho más barato y más robusto.

> **Es la misma decisión que ya tomó con el RETURN** —*"por material y por
> lugar, no por movimiento"*— aplicada a las entregas. No se modela el camión ni
> el pedido: se modela **la cosa**. Dos veces seguidas acertando por el mismo
> motivo no es casualidad, es un principio.

**Lo que sí hay que resolver**, y son sus palabras: *"necesitamos una forma de
notar que se planificó una cantidad y llegó otra"*.

### Y aquí está lo importante: son TRES cosas y son LA MISMA

| Caso | Lo que dice el registro | Lo que pasó |
|---|---|---|
| Devolver más de lo que salió (v12.84) | salieron 7 | vuelven 10 |
| Recibir menos de lo esperado | se esperaban 20 | llegaron 18 |
| La tarjeta de ajuste que diseñó Jose | nunca salió | volvieron 5 |

Las tres son **«un saldo por fila, y sigue abierto mientras no llegue a cero»**.
Es exactamente lo que ya hace `getOutstandingBySite` para el RETURN.

**No se construyen tres mecanismos.** Una entrega esperada lleva una cantidad;
recibir la descuenta; pendiente es «queda más de cero»; y la diferencia entre lo
planificado y lo llegado se escribe en la fila cuando se cierra. La misma forma
tres veces, y si se construyen por separado serán tres cosas que hay que
acordarse de mantener iguales — que es la falta que este archivo lleva
dieciséis veces contando.

## 🔵 INCOMING: CREAR VARIOS A LA VEZ, Y QUE ACEPTAR UNO **SEA** LA ENTRADA · 21/10

Jose, 21/10, dos ideas en el mismo mensaje y la segunda es estructural:

> *"Debemos dar la opción al usuario de hacer nuevos incomings (crear nuevos
> eventos futuros) y hacer varios a la vez, así como hacemos los entry. Y
> también se vino a mi mente que aceptar un incoming que ya llegó y hacer un
> entry son la misma cosa aplicada de 2 formas diferentes... si lo ves de cierto
> modo, a un incoming recibido sólo le falta el proyecto, el PO y la locación
> para ser un entry básico."*

### La primera, y es la fácil: varios a la vez

Hoy `openIncomingModal()` crea UNA entrega esperada. La ENTRADA ya sabe hacer
varios materiales en una pasada (`multiMatSection`, `addMatLine`), y una entrega
de un proveedor casi nunca trae un solo material — trae la lista del albarán.

**No hay que inventar nada:** es el mismo armazón de líneas que ya usa ENTRY,
apuntado a la hoja de entregas esperadas. Lo que hay que cuidar es que la
cabecera compartida (proveedor, PO, fecha estimada) se escriba UNA vez y las
líneas sólo lleven material y cantidad, igual que en ENTRY.

### La segunda, y tiene razón: son el mismo movimiento

**Y es más cierto de lo que la frase sugiere.** Hoy la app ya tiene las dos
mitades y las trata como dos cosas:

| | Qué sabe | Qué le falta |
|---|---|---|
| Entrega esperada | proveedor, material, cantidad, PO, fecha, PM | dónde se guardó, qué obra, quién la recibió |
| ENTRY | todo eso — y hay que volver a escribirlo | — |

Y lo que hace hoy `_entryFromIncoming` es exactamente eso: abre el formulario de
ENTRY **rellenado desde la tarjeta**. O sea que el camino ya existe; lo que no
existe es que sea **el mismo acto**. Hoy son dos: «marcar llegada» y «registrar
entrada», y de ahí sale la tarjeta naranja de *ARRIVED · ENTRY NOT MADE* que
también está en esta lista — **una tarjeta que sólo existe porque el acto está
partido en dos**.

> **La prueba de que Jose tiene razón está en el backlog:** si hubiera que
> inventar una señal para avisar de que alguien hizo la mitad de un acto, la
> respuesta correcta casi nunca es la señal — es juntar las dos mitades.

### Cómo lo haría

Pulsar **«Llegó»** en una entrega abre el formulario de ENTRADA con todo lo que
la entrega ya sabe puesto y **en gris**, pidiendo sólo las tres cosas que
faltan: **estante, obra y PO** (el PO suele venir ya). Al guardar:

1. se escribe la ENTRADA, con `FROM_MOV` apuntando a la entrega;
2. la entrega se marca recibida **en el mismo guardado**, no en otro;
3. no queda ningún estado intermedio donde una exista sin la otra.

**Lo delicado, y es lo que hay que decidir antes de construir:** qué pasa cuando
llega **menos** de lo esperado, o llega en dos camiones. Hoy eso se resuelve
marcando la llegada y haciendo una entrada distinta. Si se juntan los dos actos,
la entrega tiene que poder quedarse **parcialmente recibida** — y eso es un
estado nuevo que hoy no existe.

**Mi recomendación:** construir primero lo de «varios a la vez», que no tiene
decisiones pendientes, y juntar los dos actos después — porque juntarlos obliga
a contestar lo de las llegadas parciales, y esa respuesta la tiene que dar Jose
con un caso real delante.

## ✅ EL RETURN DEBE PARTIR DE LO QUE SALIÓ, NO DE UN NOMBRE · 20/10 — HECHO EN LA v12.82

Jose, con cuatro capturas: *"al seleccionar RETURN es lógico que voy a devolver
algo que ya estaba fuera de la bodega, pero la app sólo sugiere 1 material...
debería dar la lista de TODOS los materiales parecidos y sólo como lista
flotante, no como tarjetas abajo del nombre"*.

### Lo que hace hoy

Escribes el nombre y sale **una** tarjeta amarilla —*«Similar material exists:
ALDER GROVE REMODEL A · Use this name»*— debajo del campo. Eliges ésa y entonces
te sugiere **otra**. Es una lista de uno, servida de a uno, y ocupa sitio en el
formulario.

Y sugiere por **parecido de nombre**, no por si el material está fuera.

### Lo que pide

1. **Lista flotante** con **todos** los parecidos, no tarjetas debajo del campo.
2. Sólo los que **están fuera de la bodega** — ya eligió la categoría, así que
   el filtro es gratis.
3. Cada uno **con la cantidad que tenía fuera**.
4. Al elegir uno, **autorrellenar del registro**: lo que ya se sabe de ese
   material y de su salida.
5. **Sugerir la cantidad**, como ya hace EXIT.
6. Él escribe sólo lo que no se puede saber: **a qué estante lo pone ahora**, la
   cantidad real y el motivo.

### Y esto cierra un agujero que ya estaba en esta lista

Más arriba está apuntado que **devolver material que nunca salió crea
existencias de la nada** (`siteQty` tiene suelo en 0 mientras `warehouseQty`
suma igual).

Si el formulario sólo ofrece **lo que de verdad está fuera, con su cantidad
pendiente**, el agujero no se puede alcanzar desde la pantalla: no hay forma de
devolver cinco de algo de lo que salieron dos. **La idea de interfaz de Jose es
también la corrección del dato.**

> **Dónde vive el dato, y ya existe:** `AC.ORIGIN_PROJECT` y `AC.FROM_MOV` se
> añadieron el 15/10 con el boneyard. Lo que falta es la consulta —qué salió y
> cuánto queda sin volver— y la lista flotante.

### DECIDIDO EL 20/10: por MATERIAL **y por LUGAR**, no por movimiento

Jose: *"para RETURN debe ser por material, porque no importa si se hicieron 4
EXITs de un material a un mismo lugar; importa **cuánto material hay en ese
lugar** para devolver la cantidad que necesitamos de ese lugar a la bodega"*.

Tiene razón, y el matiz es el que yo no había visto: no es «por material» a
secas, es **por material Y por sitio donde está**. Lo que se devuelve no es un
movimiento, es material que está en una obra.

| Lista correcta | Lista equivocada |
|---|---|
| `ALDER GROVE REMODEL C — 2 en ORCHARD GATE PHASE 3` | cuatro líneas, una por cada salida |
| una línea por **material × lugar** | una línea por **movimiento** |

Si el mismo material está en dos obras, son dos líneas — porque son dos
devoluciones distintas y la cantidad disponible es distinta en cada una.

**Lo que esto implica:** la consulta no es «qué movimientos salieron» sino **el
saldo por material y lugar**: salidas menos devoluciones, agrupadas. Es la misma
cuenta que ya hace el motor para `siteQty`, partida por destino.

> El boneyard no se pierde: `ORIGIN_PROJECT` se sigue escribiendo en la
> devolución, y sale del lugar que se eligió en la lista. Lo que se deja de
> rastrear es de cuál de las cuatro salidas vino cada unidad — y eso, como dice
> Jose, no le importa a nadie.

### CONSTRUIDO EN LA v12.82 — las dos mitades, y qué se decidió en cada una

**El servidor:** `getOutstandingBySite(sessionToken, categoria)`. Lee el archivo
UNA vez —como `getCurrentStockForItem`— y devuelve el saldo agrupado por
`material × sitio`: las salidas suman, las devoluciones restan, y lo que llega a
cero o a negativo **no se devuelve**. No lee las hojas derivadas a propósito:
ahí `siteQty` está guardado como UN total sin separar por sitio, que es justo el
dato que hacía falta, y añadirlo obligaría a reconstruir las derivadas en cada
instalación que ya existe.

El sitio **se lee de una columna distinta según la dirección**: una salida apunta
al sitio en `DEST_LOC`, una devolución en `SRC_LOC`. Es la misma columna leída al
revés, y es el detalle que haría que el saldo no cerrara nunca si se leyera la
misma en los dos casos.

Los datos que se autorrellenan salen de la **última** salida, no de la primera
—si cambió el jefe de obra por el camino, vale lo último que se supo— y un campo
vacío de una salida reciente **no borra** lo que dijo la anterior.

**El navegador:** la lista cuelga del mismo cuadro que la de bodega. Dos cuadros
habría sido la decimoséptima vez de *dos cosas que tienen que coincidir sin que
nada lo obligue*: cada uno con su mostrar y su esconder, y el día que uno se
abriera sin que el otro se cerrara se verían las dos listas a la vez. Es **un
cuadro y una función**, que decide la lista por el tipo de movimiento; la
diferencia de ancho es una clase que esa misma función pone y quita.

Y **sale al ENTRAR en el campo**, no tras teclear dos letras como la de bodega.
Es la diferencia entre el rasgo que pidió Jose y un rasgo escondido: al sacar
material se sabe el nombre, al devolverlo no — por eso pidió la lista.

**Dos campos que a propósito NO se rellenan**, y las dos decisiones son del mismo
tipo que la de no reusar `mProj` para el proyecto de origen:

- **«Returned By»** se queda vacío. Esa columna cambia de significado con la
  dirección: en la salida es quien lo entregó, en la devolución quien lo trae.
  Suele ser el mismo, pero «suele» escrito en una casilla que nadie revisa es un
  nombre inventado en el registro de otra persona.
- **La unidad**, si lo que dice el registro no está entre las opciones del
  desplegable. Asignar a un `<select>` un valor que no tiene lo deja en blanco, y
  un blanco ahí es el dato perdido sin que nadie se entere.

**Lo que encontró la prueba del navegador**, y es el motivo de abrir un navegador
en vez de leer el archivo:

1. Cambiar de pestaña dejaba la lista **flotando encima del formulario nuevo**
   hasta que alguien escribiera algo. Ahora `setModalType` la cierra en el acto.
2. `mPM` estaba **escondido en RETURN mientras `_doSubmit` lo lee SIEMPRE**, sin
   mirar el tipo. Así que quien escribía un jefe de obra en una entrada y cambiaba
   a RETURN sin cerrar la ventana guardaba ese nombre sin verlo nunca — el reset
   sólo corre al ABRIR, no al cambiar de pestaña. Ahora el campo se ve en RETURN,
   que además le da sitio visible a lo que la lista rellena: un dato que la app
   escribe sola tiene que poder verse y corregirse.
3. `filas || []` donde hacía falta `Array.isArray(filas)`. Lo cazó
   `test-form-symmetry`, cuyo doble del servidor contesta `{}` a todo lo que no
   conoce: un `{}` pasa el `||` tan contento y revienta tres líneas después en el
   `.filter`.

**Lo que NO cierra**, y hay que decirlo: el agujero de *devolver material que
nunca salió* sigue ahí **en el motor**. La lista lo hace inalcanzable desde la
pantalla —no se ofrece devolver algo que no está fuera— pero el campo del nombre
sigue siendo texto libre, y tiene que seguir siéndolo: la historia de cualquier
bodega empieza a mitad, y un material que salió antes de instalar Acopio es una
devolución legítima que ninguna lista puede conocer. La guardia del motor es un
trabajo aparte y sigue abierta más arriba en esta lista.

### Y una falta hermana — ✅ arreglada también en la v12.82

`_pmDirectoryData = list || []` seguido de un `.map`, exactamente la falta del
punto 3 de arriba en otro sitio. Se veía en la misma prueba: con un doble que
contesta `{}`, `setModalType('ENTRY')` reventaba con *«\_pmDirectoryData.map is
not a function»*.

Y era peor de lo que parecía: **tres sitios** asignaban la respuesta del servidor
a esa variable, cada uno con su `|| []`, y los dos que la leen (`.map` en
`_refreshPmDatalist` y en `_drawPmDirectory`) confiaban en que los tres hubieran
acertado. Ahora toda respuesta pasa por `_pmDirPoner`, que es el único sitio que
decide la forma. `null` sigue significando «sin cargar», que no es lo mismo que
«cargado y vacío».


## 🔵 UNA ✕ EN CADA CAMPO — HECHO EL 20/10, Y LO QUE QUEDA

Jose: *"es molesto tener que darle clic a los lugares donde se escribe y tener
que borrar letra por letra"*. Puesta en la v12.81.

**Lo que queda, y es del mismo tipo:** los campos que se pintan dentro de un
modal que se abre por primera vez después de la pasada inicial no la tienen
hasta el siguiente repintado. Hoy se cubre llamando al barrido tras cada pintada
de ajustes; si aparece un modal nuevo que genere sus propios campos, habrá que
acordarse — o poner un `MutationObserver` y dejar de acordarse.

**El coste del observador:** corre en cada cambio del DOM, y esta app repinta
tablas de cientos de filas. Habría que medirlo antes, no suponerlo.

# ══ LA SIGUIENTE VERSIÓN: FORMA Y PANTALLA · 20/10 ══

Jose mandó cinco capturas marcadas en rojo y pidió que quedara anotado sin tocar
nada todavía. Son tres cosas distintas y conviene no mezclarlas.

## 🔵 1 · EL BLOQUE DE LA MARCA

Hoy: un logo cuadrado, debajo `MY WAREHOUSE`, y debajo una pastilla con
`Acopio`. Tres cosas apiladas en la esquina, y la de abajo es la nuestra.

Lo que pide:

| | |
|---|---|
| **El logo de Acopio** —la imagen con el nombre, no el cuadrado— va **en la parte blanca** | y es **un enlace** |
| **El nombre del almacén** va **a la derecha del logo**, no debajo | |
| **Debajo queda un sitio** para cuando alguien tenga más de un almacén | nombre o número, misma fuente, **más pequeña y gris** |

**Lo que esto cambia de verdad, y es más que estético:** hoy la pastilla
`Acopio` es la marca, puesta debajo del cliente. Con el cambio, **la marca es lo
primero y es la puerta a nuestro sitio** — en una app que se va a regalar, el
logo que lleva al sitio es el embudo.

> **Y abre una puerta al multi-almacén.** Ese hueco de abajo no es decoración:
> es dónde iría el selector el día que alguien tenga dos. Reservarlo ahora
> cuesta nada; reservarlo después cuesta rehacer la cabecera.

## 🔵 2 · LAS PESTAÑAS: CENTRADAS ARRIBA, Y EN EL TELÉFONO NO

**Pantalla grande:** le gustan como están, pero **el menú debe ir centrado** en
el ancho de la pantalla, no desplazado por el bloque de la marca.

**Pantalla pequeña:** hoy bajan debajo del nombre y el logo (imagen 4) y **no le
gusta**. Es un apilado, no un diseño: la cabecera ocupa un tercio de la pantalla
antes de enseñar nada.

## 🔵 3 · EL TELÉFONO EMPIEZA EN UN MENÚ, NO EN UN TABLERO — ídea de Jose

La propuesta, y es la más grande de las tres:

> *"En teléfono usaremos **sólo iconos** en lugar de las pestañas, y **no
> mostraremos nada más** en la primera pantalla. Así el usuario selecciona qué
> quiere hacer o ver desde el principio y disminuimos la cantidad de cosas que
> se muestran en el teléfono."*

Y el motivo concreto: **las gráficas no se ven bien en el teléfono**. El pie
chart y las barras entran apretados y no se leen. Propone moverlas al menú del
usuario como una opción aparte.

### Qué pienso

**Estoy de acuerdo, y el argumento es más fuerte de lo que él lo puso.** En el
escritorio el tablero contesta *«¿cómo va el almacén?»* de un vistazo, y eso
vale. En el teléfono **nadie llega con esa pregunta**: llega con las manos
ocupadas a registrar una entrada o a mirar si queda algo. Enseñarle primero una
gráfica es ponerle un cartel delante de la puerta.

Y encaja con lo que ya sabemos del aparato: la app web en el teléfono da
**411 × 658**. Un tablero completo ahí es media pantalla de gráficas que no se
leen y media de tarjetas de resumen.

### Lo que hay que decidir antes de construirlo

1. **Qué iconos, y cuántos.** Cinco pestañas caben; con seis empieza a ser una
   rejilla. Y un icono sin palabra se adivina mal: hay que decidir si llevan
   texto debajo o no.
2. **Cómo se vuelve al menú.** Si la primera pantalla es un menú, hace falta una
   forma obvia de regresar, o se convierte en un callejón.
3. **Dónde vive el tablero entonces.** Él dice que en el menú del usuario. Otra
   opción: como un icono más del menú principal, que es donde la gente lo
   buscaría.
4. **Si el escritorio cambia o no.** Él dice que ahí está bien como está. Dos
   formas distintas para dos tamaños es más trabajo, pero es lo honesto: un
   teléfono no es una pantalla pequeña, es otra situación.

> **Y una advertencia que vale por las tres cosas:** esto es la cabecera y la
> navegación, o sea **lo que toca todas las pantallas**. Tiene su propia versión
> y sus propias medidas antes y después, no se mete de regalo en una versión que
> vaya de otra cosa.

## 🔵 LAS CINCO LEYES, APLICADAS A LO QUE YA DECIDIMOS · 20/10

Jose mandó una lámina de *5 UX Laws*. No se copian: se usan para decidir las
cuatro cosas que arriba quedaron abiertas.

| Ley | Lo que dice | Lo que decide AQUÍ |
|---|---|---|
| **Fitts** | lo importante, fácil de alcanzar | **el menú de iconos del teléfono va ABAJO**, no arriba. Arriba es donde no llega el pulgar. Hoy la navegación está arriba porque viene del escritorio |
| **Hick** | más opciones, más tiempo de decidir | **es el argumento de Jose, con nombre.** Y pone número a la pregunta «¿cuántos iconos?»: **cinco, y seis ya es una rejilla** |
| **Jakob** | esperan que funcione como lo que ya usan | la propia lámina lo enseña: Instagram y YouTube ponen la barra **abajo, con iconos**. No hay que inventar nada — hay que parecerse |
| **Proximidad** | lo que está junto parece relacionado | el bloque de la marca: **logo y nombre del almacén pegados**, y la línea del segundo almacén más cerca del nombre que de las pestañas |
| **Von Restorff** | lo distinto se nota primero | ya lo usamos sin llamarlo así: **un solo botón azul** en la oferta de Pro y lo demás en texto, y el gris de lo apagado que hace resaltar lo disponible |

**Lo que más cambia:** Fitts y Jakob dicen lo mismo y dicen que **la navegación
del teléfono va abajo**. Eso no estaba en la propuesta de Jose —él habló de
iconos, no de dónde— y es la diferencia entre un menú que se usa con el pulgar y
uno que obliga a cambiar la mano de sitio.

## ✅ LAS LISTAS DE DEPENDENCIAS A MANO — CERRADO EN LA v12.83 · 21/10

Seis pruebas mantienen a mano la lista de funciones que levantan en su caja de
pruebas, porque son **anteriores a `tools/andamio.js`**, que existe justamente
para que no haga falta.

**Lleva seis veces mordiendo este mes**, y el fallo siempre tiene la misma
forma: se añade una función al producto, seis pruebas se caen con un *«no está
definida»* que **no tiene nada que ver con lo que esa prueba mide**, y hay que
ir una por una.

| Fecha | Función nueva | Pruebas caídas |
|---|---|---|
| v12.75 | `autorDeLaFila_` | `test-pricing`, `test-text-stays-text` |
| v12.78 | `basicApagado_` | `test-checkin`, `test-pricing` |
| v12.82 | `tipoDeMovimiento_` | **cinco**, más `test-pricing` otra vez |

`test-pricing` ya lo avisa en un comentario propio: *«cada función nueva que
`addMovementsBatch_` llame hay que apuntarla aquí… esta prueba está pendiente de
migrar»*. Escrito hace semanas, y sigue pendiente.

**Las seis:** `test-pricing`, `test-text-stays-text`, `test-checkin`,
`test-cinco-sin-riesgo`, `test-derived-refresh`, `test-transfer-project`,
`test-adjust`, `test-data-quality`.

**Qué haría falta:** migrarlas a `andamio.levantar()`, que recorre las llamadas
y arrastra lo que hace falta. No es difícil — es que cada una tiene su propia
caja con sus propios dobles, y hay que mirarlas una a una para no convertir un
doble en la función de verdad por accidente. Medio día, y deja de pasar.

**El coste de no hacerlo** no es el rato de arreglarlas: es que un rojo que no
habla de lo que la prueba mide **enseña a ignorar los rojos**.

### HECHO EN LA v12.83 — y no eran seis, eran quince

Esta nota decía «seis» porque seis fueron las que se cayeron con
`tipoDeMovimiento_`. Al ir a migrarlas aparecieron **nueve más**, y tres de ellas
escondidas en una forma que no se parecía a una lista:

| Forma | Pruebas | Cómo se veía |
|---|---|---|
| `['a','b'].forEach(n => runInContext(fnSrc(n)))` | 12 | una lista, se busca sola |
| `${fnSrc('a')}` dentro de una plantilla | 3 | **ninguna lista que mirar** |

La segunda forma es la que importa, porque es la que se colaba: `test-settings-reopen`
metía cuatro `${fnSrc('…')}` en la plantilla con la que arma su página, y se cayó
en esta misma versión con un *«\_pmDirPoner is not defined»* por una función nueva
de **tres líneas** que no tiene nada que ver con reabrir Ajustes. Octava mordida.

**Las quince, migradas:** `test-pricing`, `test-cinco-sin-riesgo` (dos listas),
`test-derived-refresh`, `test-transfer-project`, `test-adjust`,
`test-data-quality`, `test-locations` (dos listas), `test-also-arrived`,
`test-bell-count`, `test-lock-visible`, `test-morning-arrivals`,
`test-user-column`, `test-fractional-qty`, `test-local-dates`,
`test-settings-reopen`, `test-arrived-to-entry`, `test-settings-system-tab`.

### Lo que hizo falta añadirle al andamio

**`levantarPara(src, fragmento)`**, porque quedaba un agujero de fondo:
`levantar` arranca de nombres de función, y hay pruebas que sacan del archivo un
**fragmento** con una expresión regular —la plantilla de la celda de Location de
dentro de `renderStock`— y lo evalúan. Esa costumbre es buena y hay que
defenderla: copiar la plantilla a la prueba la dejaría en verde con la plantilla
del producto rota, que es justo el fallo que esa prueba persigue. Pero el
fragmento llama a `_he` y a `_escAttr`, y eso no sale de ningún nombre de función
porque el fragmento **no es** una función. Estaban en una lista a mano, o sea el
problema entrando por la puerta de al lado. Ahora se lee el texto y se levanta lo
que nombre.

### Y el guardia, que es la mitad que faltaba

`test-andamio` comprobaba que el andamio **funciona**. Ahora comprueba que **se
usa**: recorre las pruebas y falla si alguna vuelve a escribir una de las dos
formas, con el nombre del archivo y qué poner en su lugar. Sin él la
decimosexta se escribe la semana que viene, porque la forma a mano es la que uno
teclea sin pensar.

El guardia encontró cuatro pruebas que yo había pasado por alto buscando a ojo —
dos con `grep` y dos más tras cerrarle el hueco de la plantilla. Vale la pena
decirlo: **buscar a ojo falló otra vez**, y lo que lo arregló no fue buscar mejor
sino escribir la regla.

### Dos cosas más que salieron al tirar del hilo

1. **`test-no-caduca` acusaba a `test-derived-refresh` de leer el reloj** — por un
   COMENTARIO del producto que dice «aquí vivía `var now = new Date()`»,
   explicando que se lo quitaron. Ese guardia quitaba los comentarios de las
   PRUEBAS y no del producto, y la mitad que faltaba es la que muerde. Tercera vez
   en este proyecto que una búsqueda encuentra la prosa que explica lo que se
   quitó y la toma por el código.
2. **`test-local-dates` tiene ahora su excepción escrita** en ese mismo guardia:
   levanta `_todayIso` pero no la llama —sólo busca en el archivo dónde la usa la
   app—, así que el reloj está en la caja y nunca se lee. Se volvió visible al
   migrarla, porque el detector sólo entiende nombres literales y antes los pedía
   con una variable.
