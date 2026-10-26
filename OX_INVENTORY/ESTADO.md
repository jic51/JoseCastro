# ESTADO DE ACOPIO — dónde vamos

> Pedido por Jose el 21/10: *"actualiza el estado de Acopio para revisarlo cada
> vez que olvide cómo vamos, y señala las partes que estamos trabajando, las que
> recién hicimos y las no se han verificado, para enfocarme en ellas."*
>
> **Este documento se actualiza en cada versión** y va con cada entrega. Si la
> fecha de abajo tiene más de una semana, está viejo y hay que decirlo.
>
> **«El estado de Acopio» y `ESTADO.md` son lo mismo**: este fichero. Es el
> único sitio donde mirar cómo vamos.

**Última actualización:** 23/10/2026 · **versión v12.94** · build `b18721b3`

---

## 🔴 LO QUE TE TOCA A TI — nada de esto avanza sin Jose

Esta es la lista corta, y es la que importa. Todo lo demás de este documento es
contexto.

| # | Qué | Por qué está parado | Cuánto cuesta |
|---|---|---|---|
| 1 | **La lista de verificación de abajo** | Hay diez versiones de cambios y ninguno está confirmado por ti | 30 min, con la app abierta |
| 2 | ~~Que alguien de fuera instale la Básica~~ | ✅ **HECHO el 21/10** — alguien de fuera instaló con los dos enlaces y funcionaron. En computadora | — |
| 3 | **Grabar V1, el vídeo del cronómetro** | Es el hueco más caro de la landing | una mañana |
| 4 | **Decidir el precio de la Básica en la página** | El precio de Pro ya está decidido; la columna de la gratis no | 10 min de decisión |
| 5 | **Una forma de agendar una llamada** | Hoy el camino muere en un correo | 20 min de configuración |
| 6 | **¿Las filas importadas sin ubicación van a `RECEIVING`?** | Hoy caen en `UNASSIGNED`, que es una palabra del programa | 2 min de decisión |
| 7 | **La casilla «todos» de Movements** | Tres opciones, y la que tú propusiste no es la que yo construiría | 2 min de decisión |
| 8 | **¿Destildar filas al importar, en vez de «subir uno por uno»?** | Da el mismo control sin una pantalla nueva | 1 min de decisión |

---

## 📋 LA LISTA DE VERIFICACIÓN — depurada el 23/10

> **Lo que ya confirmaste está fuera de esta lista.** Sólo queda lo que falta
> mirar, separado por edición como pediste. Lo tachado se fue porque lo
> verificaste tú; lo que descubriste roto pasó a `docs/BACKLOG.md`.

### ✅ Lo que confirmaste el 23/10 — ya no hay que volver a mirarlo

La ✕ dentro de la caja (Dashboard, Movements, Warehouse Map) · los candados de
Pro, cada uno con su mensaje · cuatro clics en el mismo candado = un solo aviso ·
Documentos es una línea que se abre · Entry abre bien · la lista de «lo que está
fuera» sale al entrar en el nombre, sin teclear · un material en dos obras sale
en dos líneas · al elegir una se rellenan nombre, sitio, cantidad, unidad, obra
y PM, con el cursor en el estante · «Returned By» se queda vacío · las columnas
del Dashboard ya no se mueven al cambiar de filtro.

---

### 🟦 ACOPIO **BÁSICO** — lo que falta mirar

| ✓ | Qué | Dónde |
|---|---|---|
| ☐ | **Decir «sí» en un aviso guarda** (v12.94 — el fallo que encontraste) | Return → algo con 49 fuera → escribe 60 → Save anyway. Tiene que **guardar**, no dar error |
| ☐ | **Borrar muchos tarda segundos y se puede parar** (v12.92) | Marca unos cientos → Delete. Botón **Stop** a mitad: debe decir *«Stopped — X of Y deleted»* |
| ☐ | **Importar no pierde filas** (v12.91) | Un fichero de más de 500 filas: el botón y el final tienen que decir **el mismo número**, con *«matches the file»* |
| ☐ | **El mismo fichero dos veces avisa** (v12.91) | Súbelo otra vez: recuadro rojo arriba, y el botón **sigue ahí** |
| ☐ | **Deshacer una importación** (v12.91) | Ajustes → Import → **↩ Undo this import** |
| ☐ | **Unir nombres duplicados** (v12.93) | Ajustes → Projects → el grupo de catorce: **«listed 14 times»** y **Keep one** |
| ☐ | **El Error Log en vivo** (v12.93) | Provoca un error **sin cerrar Ajustes** → la fila nueva entra **arriba**, con destello, sin repintar |
| ☐ | **El candado del correo** (v12.91) | «Send notification email» → el mensaje habla de **avisar**, no de *leer* un correo |
| ☐ | **La ✕ dentro de la ventana de movimiento** | Abre Entry y escribe en un campo: la ✕ va **dentro** de la caja |
| ☐ | **Vaciar la búsqueda con la ✕ relanza la búsqueda** | Movements: escribe, filtra, pulsa ✕ → la tabla se repuebla |
| ☐ | **La papelera después de borrar** | Ajustes → Sistema → lo borrado está ahí para devolverlo |

**Y tres que YA SABEMOS que están mal en Básico** (anotadas, no hace falta que
las mires otra vez): 🏷 Labels sale a color en vez de gris · la pregunta de
«¿también llegó esto?» no debería salir · no aparece ni una tarjeta en el mazo.

---

### 🟪 ACOPIO **PRO** — lo que falta mirar

| ✓ | Qué | Dónde |
|---|---|---|
| ☐ | **Lo mismo de la lista de arriba** que no depende de la edición | importar, borrar en tanda, fusionar, Error Log, la ✕ |
| ☐ | **«+ N more fields»** | Entry: la línea existe y al pulsarla vuelven GC, PO#, Project y PM |
| ☐ | **Un campo con algo escrito no se esconde** | Escribe en PO#, cambia de pestaña y vuelve |
| ☐ | **Documentos no se cierra sola** | Abre Documentos, escribe un nombre |
| ☐ | **🏷 Print labels tras guardar** | Guarda una entrada → el aviso lo ofrece → se abre el cuadro con todo marcado |
| ☐ | **«¿También llegó esto?»** | Guarda una entrada y **no** pulses nada: la pregunta tiene que salir igual |
| ☐ | **El campo Truck** | Registra un camión en Ajustes → aparece en el formulario. Sin camiones, no está |
| ☐ | **⚙ Monitor** | Se abre (en Pro no lleva candado) |
| ☐ | **El mazo de tarjetas** | **Sí** debe haber tarjetas aquí. Y **ninguna** de «Backup created» ni «archive start» |
| ☐ | **Ajustes → Sistema** | Ahí **sí** siguen todos los respaldos y archivados |
| ☐ | **Los documentos en un movimiento** | Adjuntar, y que se guarden con él |

---

### ⏳ Esperando algo tuyo

| Qué | Qué hace falta |
|---|---|
| **Ajustes → Sistema en Básico** | Dijiste que mandabas un vídeo y no llegó |
| **«El menú se apaga»** | ¿Cuál menú? El de arriba, el de la cuenta, o el de la hoja |
| **La app tarda en abrir** | Un vídeo con la v12.94 ya pegada, para medir con lo de ahora y no con lo de antes |

---

## 🧭 LO QUE ESTAMOS MIRANDO AHORA — el plan del 22/10

El detalle completo, con números de línea, está en `docs/BACKLOG.md`, al
principio.

| # | Qué | Estado |
|---|---|---|
| 1 | **Importar perdía las filas pasada la 500** | ✅ **HECHO — v12.91** |
| 1-bis | **Borrar 490 tardaba media hora y no se podía parar** | ✅ **HECHO — v12.92** |
| 2 | **El mismo fichero dos veces**: aviso + **deshacer** | ✅ **HECHO — v12.91** |
| 3 | **La pantalla de importar dice la verdad** (un número, todas las columnas, qué va a crear antes) | ✅ **HECHO — v12.91** |
| 4 | **«Send notification email» contestaba sobre LEER el correo** | ✅ **HECHO — v12.91** |
| 5 | **Fusionar nombres**, las dos mitades | ✅ **HECHO — v12.93** · causa confirmada con tu vídeo: fallan **las 28** |
| 6 | **El Error Log en vivo**, sin repintar | ✅ **HECHO — v12.93** |
| 7 | **Dueño único de las pestañas** + papelera abierta + Import abierto (CSV) | 🔜 **v12.94** |
| 8 | **Importar de verdad**: ventana propia, ubicación por fila y por grupos, destildar, prueba de 20 | 🔜 **v12.94+** |
| 9 | Materials (Ajustes), como las alertas de stock bajo | anotado |
| 10 | Directory (Ajustes), como la pantalla de usuarios | anotado |
| — | La casilla «todos» de Movements | 🔵 **la revisaste y se queda como está** |
| — | Importar el **historial** (fechas, tipos, quién) | 🔵 **tu decisión** · es otra función, no una columna más |

**Los cuatro primeros ya están en la v12.91.** Lo siguiente es la fusión de
nombres y el Error Log en vivo, que van juntos en la v12.92.

### ✅ La página recortada — HECHO el 22/10

Aprobado por ti y ya está. **No cambia ni una línea del producto**: misma
versión, mismo sello, mismo código. Lo único que cambia es que lo que se pega
en Apps Script ya no lleva los comentarios.

| | Antes | Ahora |
|---|---|---|
| `Index_v3_fixed.html` | 1.590 KB | **897 KB** |
| `Code_v3_fixed.gs` | 813 KB | **400 KB** |
| **Por la red (lo que esperas en 3G)** | **527 KB** | **225 KB** |

Y lo que hacía falta arreglar antes de recomendártelo: la herramienta borraba
también las líneas vacías, y el archivo pasaba de 30.246 líneas a 17.858. Eso
rompe lo único que usamos para encontrar un fallo — tú mandas la captura de tu
consola, yo leo «línea 19174» y voy ahí. **Ahora las líneas son las mismas**, y
hay una prueba que comprueba que **cada una de las 1.181 funciones cae en la
misma línea** que en el repositorio.

**Lo que cambia para ti:** a partir de ahora pegas los archivos de la carpeta
`pegar/` (te los mando aparte), no los del repositorio. Son el mismo producto.

---

## ✅ LO QUE ACABAMOS DE HACER — y qué hay que mirar de cada cosa

### v12.93 · Unir nombres funciona, y el Error Log se entera · **SIN VERIFICAR**

**Qué probar:**

1. **Ajustes → Projects.** El grupo de «ASPEN HOLLOW LOT 14» ya no te pide
   elegir entre catorce botones iguales: dice **«listed 14 times»** y ofrece
   **Keep one**. Púlsalo — tiene que quedar **una** fila.
2. **Lo mismo en Suppliers**, con los ocho grupos.
3. **Un grupo de verdad parecido** (dos grafías distintas) sigue pidiendo cuál
   conservar, que es lo correcto. Elige una: el historial se reescribe con ella.
4. **El Error Log en vivo.** Abre Ajustes, provoca un error, y **sin cerrar
   Ajustes** ve a Error Log: la fila nueva tiene que estar **arriba**, con un
   destello azul, y **sin que se repinte la tabla**. Arriba sale
   *«• 1 new since you opened this»*.
5. **Escribe algo en el buscador del Error Log** y deja que llegue otro error:
   el texto que escribiste **no se borra**, y la fila nueva sólo entra si
   coincide con lo buscado.
6. Y hay un botón **↻ Refresh** por si quieres pedirlo tú.

### v12.92 · Borrar muchos tarda segundos, y se puede parar · **SIN VERIFICAR**

De tus dos vídeos del 22/10: 490 movimientos, **casi media hora**, 40 perdidas,
y sin forma de pararlo.

**Qué probar:**

1. **La prueba grande.** Marca unos cuantos cientos de movimientos y pulsa
   Delete. Tiene que tardar **segundos**, no minutos. Y ya no debe salir ningún
   *«Too many requests»*.
2. **El botón de Parar.** Mientras trabaja, la línea de abajo a la izquierda
   tiene un botón **Stop**. Púlsalo a mitad: tiene que decir algo como
   *«Stopped — 300 of 490 deleted. The other 190 are untouched»*, y esos 190
   tienen que seguir en la lista.
3. **Borrar UNO solo** sigue igual que siempre: la fila se va al pulsar y las
   cifras del almacén se actualizan con la respuesta. Eso no cambió.
4. **Los avisos repetidos.** Si algo falla varias veces, **no se apilan**: al
   que está en pantalla le sale un **× 4** pequeño.
5. **Deshacer una importación grande** (más de 300 filas) tiene que terminar
   del todo, no pararse a medias diciendo que ya está.
6. Y lo borrado sigue en **Ajustes → Sistema → papelera**, para devolverlo.

### v12.91 · Importar deja de perder filas · **SIN VERIFICAR — Y ES LA MÁS IMPORTANTE**

Los cuatro puntos que aprobaste. **Esto arregla una pérdida de datos**, así que
si sólo compruebas una versión este mes, que sea ésta.

**Qué probar, en orden:**

1. **La prueba grande.** Coge tu fichero de 1.052 filas e impórtalo en una copia
   **vacía**. Mira que el botón diga **1.052**, y que al terminar la línea diga
   **1.052 filas** y las unidades, con **«matches the file»**. Antes entraban
   500.
2. **Las columnas.** Al cargar el fichero, la tabla tiene que enseñar
   **Unit, Project, Supplier, PO# y Comments** además de las cinco de siempre.
   Si tu fichero no trae alguna, esa columna no sale — eso también está bien.
3. **Lo que va a crear.** Encima del botón, un recuadro azul: *«This import will
   also create: 7 locations…»*. Antes eso se contaba **al terminar**.
4. **Sube el MISMO fichero otra vez.** Tiene que salir un recuadro rojo arriba
   del todo: *«You already imported this exact file»*, con cuándo y quién. **Y
   el botón sigue ahí** — avisa y deja pasar, como en las devoluciones.
5. **Deshacer.** Abajo de esa pantalla está **«Imports you have already done»**.
   Pulsa **↩ Undo this import** en una: tiene que decir cuántos movimientos
   quitó, y el almacén volver a lo de antes. Luego mira **Ajustes → Sistema →
   papelera**: ahí están, para devolverlos.
6. **[B] El candado del correo.** En la gratis, pulsa **«Send notification
   email»**: el mensaje tiene que hablar de **avisar por correo**, no de *leer*
   un correo.

### v12.90 · La devolución no pregunta lo que ya sabe, y el aviso dura 7s · **SIN VERIFICAR**

De tu vídeo del 22/10.

**Qué probar:**
1. Return → elige un material que salió **a un solo sitio**: el sitio, la obra,
   el PM, la unidad y la cantidad se rellenan **solos**. Ya no te pregunta de
   dónde vino.
2. Elige uno que salió **a dos sitios distintos**: ahí **sí** sale la lista de
   los dos para que elijas.
3. Elige uno que **nunca salió**: el cajón se queda vacío, para contestarlo.
4. Escribe algo a mano en el sitio y luego cambia el material: **no te lo pisa**.
5. [B] Pulsa un candado de Pro: el aviso se va a los **7 segundos**, no a los 14.
   Pasa el ratón por encima: se queda. Quítalo: se va en **2 ó 3**.
6. Pulsa cuatro candados seguidos: sigue habiendo **un solo aviso**.

### v12.89 · Una lista, búsqueda que no se queda atrás, y 2 MB menos · **SIN VERIFICAR**

De tu repaso del 22/10.

**Qué probar:**
1. Return → entra en el nombre: **una sola lista**, la nuestra. La del navegador
   ya no sale encima.
2. Cambia a Waste y escribe: ahí **sí** vuelve la lista del navegador, porque en
   esa pantalla es la única ayuda.
3. Escribe **seguido y rápido** en cualquier búsqueda: el texto de abajo tiene
   que seguirte, no esperar a que pares.
4. Abre la app con la red lenta (DevTools → Network → 3G, como en tu vídeo):
   tiene que entrar **mucho antes**. Las gráficas llegan después, solas.
5. [B] Pulsa los ajustes de **stock mínimo**: ahora **no** se abre, y el mensaje
   habla de alertas de stock bajo — no de entregas esperadas.
6. [B] En una copia nueva de la hoja, mira «WHAT HAPPENS NEXT»: ya no habla del
   asistente ni de materiales y locaciones.

### v12.88 · La ✕ dentro de la caja, y la gratis sin menú fantasma · **SIN VERIFICAR**

Tus dos capturas del 21/10. En Movements la ✕ se dibujaba al final de la fila, a
cientos de píxeles de la caja — y por eso la caja se quedaba sola arriba. Y en
la versión gratis la hoja mandaba a un menú «Acopio» que **no puede existir
ahí**: necesita un permiso sensible que esa edición no pide a propósito.

**Qué probar:**
1. Movements → escribe algo en la búsqueda: la ✕ tiene que salir **dentro** de
   la caja, y la caja ya no debe ocupar la fila entera.
2. Lo mismo en cualquier otra caja de escritura de la app.
3. En la copia gratis, destilda y vuelve a tildar la casilla de términos: el
   texto ya no debe hablar de ningún menú, y tiene que decirte que el nombre de
   la empresa se pone en **Settings → Name & Logo**.

### v12.87 · La ventana de entrada, limpia · **SIN VERIFICAR**

Eran **dieciséis controles** para registrar «llegaron 20 ventanas, están en
A1A». Ahora el formulario **aprende** qué campos usa tu bodega y pliega el resto
detrás de «+ N more fields»; Documentos es una línea; la casilla 🏷 Label se fue
de cada material y la pregunta sale al guardar. Y si tienes camiones
registrados aparece el campo de camión — ya estaba construido entero y nadie
podía verlo.

**Qué probar:**
1. Abre Entry → ¿ves «+ 4 more fields»? Púlsala: tienen que volver GC, PO#,
   Project y PM.
2. Escribe algo en PO#, cambia de pestaña y vuelve: **un campo con algo escrito
   no se puede esconder**.
3. Abre la línea de Documentos, escribe un nombre: **ya no se cierra sola**.
4. Guarda una entrada → el aviso ofrece **🏷 Print labels**; si NO lo pulsas, la
   pregunta de «¿también llegó esto?» tiene que salir igual.

### v12.86 · Cada candado contesta de lo que pulsaste · **SIN VERIFICAR**

Tres apuntaban al mensaje equivocado. Y el ⚙ Monitor **ya no lleva candado en
la Básica**: la franja de «⚠ Below Minimum» se ve ahí, así que cerrar el botón
que define qué es «mínimo» era enseñar un problema y esconder su control.

**Qué probar:** en la Básica, pulsa los ajustes de stock mínimo — tiene que
abrirse, no dar un mensaje de Pro.

### v12.85 · Dos avisos que se apilaban · **SIN VERIFICAR**

De tus dos videos. El aviso de Pro ya no se multiplica al insistir, y las
tarjetas de la esquina dejaron de llenarse de respaldos y archivados.

**Qué probar:** pulsa cuatro veces un candado de Pro → un solo aviso. Y mira el
mazo de tarjetas: no debería haber ni un «Backup created».

### v12.84 · Devolver más de lo que salió, avisado · **SIN VERIFICAR**

Si devuelves más de lo que consta fuera en ese sitio, la app pregunta antes de
guardar. Si el material **no tiene ninguna salida registrada**, se guarda sin
decir nada — porque la historia de una bodega empieza a mitad.

**Qué probar:** abre un RETURN, elige de la lista un material con 7 fuera,
escribe 10, guarda. Tiene que preguntar. Después escribe un material inventado
con cantidad 99: **no tiene que decir nada**.

### v12.83 · Las listas de dependencias a mano, cerradas · **interno, nada que ver**

Quince de nuestras pruebas dejaron de mantener a mano la lista de lo que
necesitan de la app. No se ve desde fuera. Vino con un arreglo que sí: la lista
de jefes de obra ya no puede romper la pantalla de entrada.

### v12.82 · El RETURN parte de lo que está fuera · **SIN VERIFICAR**

Lo que pediste con las cuatro capturas. Al entrar en el nombre en una
devolución sale la lista de lo que está fuera de bodega, por **material y
lugar**, y al elegir una fila se rellena el formulario.

**Qué probar:**
1. Abrir Return → entrar en el nombre **sin escribir nada** → tiene que salir la
   lista sola.
2. Que un material en dos obras salga en **dos líneas**, no sumado.
3. Elegir una → nombre, sitio, cantidad, unidad, obra y PM puestos; el estante y
   el motivo vacíos, con el cursor ya en el estante.
4. Que **«Returned By» se quede vacío** — es a propósito.

### v12.81 · La ✕ en cada campo · **SIN VERIFICAR del todo**

Falta mirar una cosa concreta: **la ✕ dentro de una ventana modal**. En la tabla
y en los filtros está comprobada; dentro del formulario de movimientos, no.

### v12.80 · Las columnas dejan de moverse · **SIN VERIFICAR**

Era la barra de desplazamiento, no la tabla. **Qué probar:** cambiar de
categoría y de estado en el Dashboard varias veces y mirar si las columnas se
quedan quietas. Es lo que enseñaste en el vídeo del 20/10.

### v12.79 · El mazo de tarjetas · **verificado por Jose, con reserva**

Dijiste que *"ahora se ve mejor, pero eso no quiere decir que se vea
profesional"*. Queda tu idea: que la tarjeta que entra se vea **entrando en el
hueco**, y que la que se borra **tarde un poco más**.

---

## 🔶 LO QUE ESTAMOS TRABAJANDO AHORA

### 1. La tarjeta de ajuste por material que volvió sin haber salido

**Decidido por ti el 21/10, a medio construir.**

Hecho: el aviso antes de guardar (v12.84).

Falta, y es tu diseño: que el excedente quede **escrito en la fila**, que se cree
una **tarjeta que no se puede eliminar** pidiendo el ajuste, y que al hacer otra
salida de ese material se avise del excedente.

Mis añadidos a tu idea están en `BACKLOG.md`. El que más importa: **la tarjeta
tiene que calcularse, no guardarse** — si se guarda, el día que alguien arregle
el dato por otro camino la tarjeta se queda ahí señalando algo que ya no pasa.

### 2. La versión Básica — construida, **sin estrenar fuera**

Funciona y la has revisado tú. Lo que no ha pasado nunca: que **alguien que no
seas tú la instale de principio a fin**. El único intento falló al hacer la
copia de la hoja.

**Lo primero que hay que mirar:** que la hoja esté compartida como *Cualquiera
con el enlace → Lector*.

### 3. La landing — lo que falta para que venda

| | Estado |
|---|---|
| Página y textos | ✅ publicada, en dos idiomas |
| Imagen para compartir | ✅ se genera con un comando |
| **Vídeos e imágenes** | ❌ **ninguno existe** — las cuatro guías están en `CAPTURAS-PARA-LA-LANDING.md` |
| **Precios a la vista** | ❌ decididos en `PRECIOS-Y-COMPETENCIA.md`, no publicados |
| **Sección de Pro** | ❌ el candado de la app apunta a la raíz porque no hay dónde apuntar |
| **Agendar una llamada** | ❌ hoy muere en un correo |
| Testimonios | ⏸ **a propósito vacío** hasta que haya clientes de verdad |

---

## ❌ LO QUE NO SE HA VERIFICADO NUNCA — ordenado por riesgo

Esta es la sección que pediste, y está ordenada por **lo que más daño haría si
está mal**.

| | Qué no se ha probado | Qué pasaría si falla |
|---|---|---|
| 🔴 | **Migrar un Excel real** | Es el primer paso de todo cliente nuevo. Nunca se ha hecho ni una vez |
| 🔴 | **Una instalación completa por otra persona** | Si no se puede instalar sin ti, no hay producto que vender |
| 🔴 | **Tres o cuatro personas guardando a la vez** | Es donde las hojas de cálculo rompen datos, antes que por lentitud |
| 🟠 | **El techo de los 6 minutos con un archivo grande** | La prueba dice el techo en llamadas, pero **sin calibrar**: falta medirlo una vez en la instalación real |
| 🟠 | **Restaurar un backup de verdad** | Se crean todas las noches. Nunca se ha restaurado uno |
| 🟠 | **La app en un teléfono, trabajando de verdad** | Se ha mirado, no se ha usado un día entero en la bodega |
| 🟡 | **El lector de correos con facturas reales** | Funciona con las de prueba |
| 🟡 | **Qué pasa al llegar al límite de la hoja** | Está escrito en `CUANDO-SE-LLENE-EL-SHEET.md`, no probado |

---

## 🧱 LO QUE EXISTE Y FUNCIONA

Para no perder de vista el tamaño de lo que ya hay.

- Entradas, salidas, traslados, devoluciones, mermas y ajustes
- Mapa de la bodega por estantes, con fotos
- Panel con gráficas, mínimos y avisos de stock
- Vista por proyecto, con costos
- Entregas esperadas, y la entrada que se rellena sola desde una entrega
- Reservas de material
- Usuarios, roles y permisos
- Etiquetas con código, y lectura por foto
- Lector de correos con IA para facturas
- Backup automático cada noche, y archivado de lo viejo
- Informe diario por correo
- Informe de calidad de datos, con reparaciones
- **171 comprobaciones automáticas**, todas en verde

---

## 📋 LO SIGUIENTE, EN ORDEN

1. **La lista de verificación** (30 min, tú) — diez versiones de cambios sin confirmar
2. **Terminar la tarjeta de ajuste** (yo, ~1 versión)
3. **Precios y sección de Pro en la página** (medio día, yo; la decisión, tú)
4. **Agendar llamadas** (20 min, tú)
5. **Grabar V1, el cronómetro** (una mañana, tú)
6. **Que alguien de fuera instale la Básica** (20 min, tú y otra persona)
7. **Incoming: crear varios a la vez**, y que aceptar uno SEA la entrada (yo;
   lo segundo necesita que decidas lo de las llegadas parciales)
8. Las mejoras visuales de la siguiente versión: bloque de marca, pestañas
   centradas, **menú de iconos abajo en el teléfono**
9. Migrar un Excel real — el primero

---

## Dónde está cada cosa

| Pregunta | Documento |
|---|---|
| Qué falta y por qué | `BACKLOG.md` |
| Cuánto cobrar | `PRECIOS-Y-COMPETENCIA.md` |
| Qué grabar y cómo | `CAPTURAS-PARA-LA-LANDING.md` |
| Cómo instalar a un cliente | `RUNBOOK-INSTALACION.md` |
| Qué es la versión Básica | `VERSION-BASICA.md` |
| Cómo comprobar que funciona | `COMO-COMPROBAR-QUE-FUNCIONA.md` |
| Qué hacer antes de vender | `ANTES-DE-VENDER.md` |
