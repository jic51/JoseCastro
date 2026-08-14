# Guía de ventas e instalación — Acopio

Para tener a la mano frente a un cliente. Escrito en español a propósito: esto
es para Jose, no para la app.

---

# 1. Las dos ideas que hay que entender

## Google es el portero

Tu app es una oficina. Google está en la puerta y decide si le dice a la app
quién entró:

- **Si el visitante trabaja en la misma empresa que el dueño de la copia** →
  Google dice *"es María, de OX Glass"* y entra directo.
- **Si no** → Google dice *"no sé quién es"*, y esa persona tiene que **mostrar
  su credencial** (el botón "Sign in with Google").

Esa credencial la emites tú, y hay que anotar a mano la dirección de cada
oficina donde va a servir. Ese es el trabajo manual de 5 minutos.

## El dueño de la copia es quien le da "Make a copy"

En **su** Google Drive quedan la hoja, el programa, las carpetas con fotos y
documentos, y los respaldos. Todos los demás son visitantes de su oficina.

**Consecuencia:** si la copia la hace la cuenta equivocada, todo el negocio del
cliente queda en la cuenta personal de alguien. Ver escenario E.

---

# 2. Las carpetas de Drive

## Cómo se crean

**Solas.** La app las crea la primera vez que necesita guardar algo: un
documento adjunto, una foto de rack, un respaldo. No hay que crearlas a mano.

Quedan en la raíz del **My Drive del dueño de la copia**, con estos nombres:

```
Acopio_Vidrios_del_Norte_Docs       ← documentos y fotos de movimientos
Acopio_Vidrios_del_Norte_Backups    ← respaldos diarios (se borran a los 30 días)
Acopio_Vidrios_del_Norte_Feedback   ← capturas de los reportes de problemas
```

El nombre sale del nombre de la empresa que se escribió en el asistente, y se
calcula **una sola vez**. Cambiar el nombre de la empresa después **no** cambia
las carpetas, a propósito: si cambiaran, todos los documentos anteriores
quedarían huérfanos.

## ¿Se pueden modificar?

| Acción | ¿Se puede? | Qué pasa |
|---|---|---|
| **Moverlas** a otra carpeta de Drive | ✅ Sí, sin problema | La app las encuentra por su identificador interno, no por dónde están. |
| **Renombrarlas** en Drive | ❌ **NO** | Los documentos dejan de abrirse. La app verifica que el archivo esté dentro de una carpeta con el nombre esperado; si no coincide, lo rechaza por seguridad. |
| **Borrarlas** | ⚠️ Muy malo | Se pierden los documentos y fotos. La app crea unas nuevas vacías y los enlaces viejos quedan rotos. |
| **Compartirlas** con el equipo | ✅ Sí | No hace falta — la app sirve los archivos ella misma — pero no rompe nada. |
| **Cambiar el nombre de la empresa** en Settings | ✅ Sí | Las carpetas conservan el nombre viejo, a propósito. |

**Qué decirle al cliente, textual:**

> *"En tu Drive van a aparecer tres carpetas que empiezan con Acopio_. Son de la
> app. Muévelas donde quieras, pero **no les cambies el nombre y no las borres**
> — ahí viven todas tus fotos y documentos."*

---

# 3. El proceso menos molesto para el cliente

## Lo que NO se puede evitar (ya investigado, no insistir)

- La copia la hace el cliente. No hay forma de crearla en su Drive por él.
- El despliegue lo autoriza el cliente. Google no permite automatizarlo.
- La pantalla de "Google no ha verificado esta app" siempre sale.

## Lo que SÍ se puede hacer, y es mucho

### La instalación asistida por videollamada — el cliente no toca nada

**Google Meet permite que el cliente te dé control de su pantalla.** Con eso,
tú haces la instalación completa mientras él te ve. Su participación se reduce
a: entrar a la llamada, iniciar sesión en su cuenta, y darte control.

Es lo más automático que existe hoy sin cambiar el modelo de distribución.

### La receta de 20 minutos

**Antes de la llamada — mándale un solo mensaje pidiendo tres cosas:**

1. El nombre exacto de la empresa como quiere que aparezca
2. Su logo (cualquier imagen sirve, la app la ajusta)
3. La lista de quién va a usarla: nombre, correo, y si administra o solo registra

**Y una pregunta que evita el desastre del escenario E:**

> *"¿Con qué correo vas a entrar? Si tu empresa tiene correos propios
> (@tuempresa.com), tiene que ser ese, no el de Gmail personal."*

**Durante la llamada:**

| Minuto | Quién | Qué |
|---|---|---|
| 0–2 | Cliente | Entra a Meet, verifica que está en la cuenta correcta, te da control |
| 2–5 | Tú | Abres el link /copy, haces la copia |
| 5–12 | Tú | Corres el asistente con los datos que ya te mandó |
| 12–16 | Tú | Publicas la app, pasas la pantalla de permisos, copias la URL |
| **12–16** | **Tú, en otra pestaña** | **Si necesita acceso externo, registras la URL en tu cliente OAuth AHÍ MISMO** ← esto no cuesta tiempo extra |
| 16–20 | Los dos | Abres la app, registras un movimiento de prueba juntos, le mandas el link |

**El truco importante:** el registro de la credencial OAuth se hace **en
paralelo**, mientras el asistente termina de guardar. No es un paso más en la
llamada, es un minuto tuyo en otra pestaña.

### Las tres reglas que hacen que esto no se vuelva un dolor de cabeza

1. **Haz tú las primeras 3–5 instalaciones completas.** No vendas
   autoservicio hasta que hayas visto dónde se atora la gente de verdad. Lo que
   crees que es difícil casi nunca es lo que los detiene.
2. **Nunca dejes al cliente a medias.** O terminas la instalación completa en
   la llamada, o no la empiezas. Una app publicada sin usuarios configurados es
   peor que ninguna: parece rota.
3. **Termina siempre con un movimiento de prueba real**, hecho por él, no por
   ti. Si él no registró nada con sus manos antes de colgar, no vas a saber si
   entendió.

### Lo que se puede mejorar más adelante

- **Un video de 2 minutos** mostrando la instalación → la llamada baja a 15 min
  porque ya sabe qué va a pasar.
- **Marketplace** (a futuro) → el cliente instala con un clic y no hay llamada.
  Es otro modelo de negocio, no un ajuste. Ver `docs/BACKLOG.md`.

---

# 4. Los escenarios, uno por uno

## A. Empresa con dominio, todos con correo de la empresa ✅

> **Vidrios del Norte.** Tienen `@vidriosdelnorte.com`. Don Carlos y sus 6
> empleados, todos con correo de la empresa.

**Qué pasa:** Don Carlos copia con su correo de la empresa. Los 6 abren el link
y entran directo. Google los reconoce solo.

**Qué preguntar antes de vender:**
- *"¿Los correos de tu equipo terminan todos en @tuempresa.com?"*
- *"¿Va a entrar alguien de fuera? ¿Un contador, un contratista?"* (si sí → es B)

**Instalación:** la receta de 20 minutos. Sin pasos extra.

**Problemas que van a aparecer, y la respuesta:**

| Síntoma | Causa | Solución |
|---|---|---|
| "Access denied" a un empleado | No está en la lista de usuarios | Settings → Directory → agregarlo. 30 segundos. |
| Un empleado nuevo no entra | Igual | Enséñale al admin a agregarlo él. Es la capacitación. |
| "No carga, se queda en la pantalla azul" | Casi siempre es que pegó mal el código o falta una propiedad | Menú 🏭 Acopio → 🔧 Advanced → 🩺 Check this installation |

---

## B. Empresa con dominio, algunos con Gmail personal ⚠️

> **Vidrios del Norte** contrata a Pedro, instalador por temporada, que solo
> tiene `pedro.instalador@gmail.com`.

**Qué pasa:** los 6 de la empresa entran directo. **Pedro no** — a Pedro le sale
el botón "Sign in with Google" y necesita tu credencial.

**Qué preguntar antes de vender:**
- *"¿Cuánta gente de fuera de la empresa va a necesitar entrar?"*
- *"¿Es permanente o de temporada?"* (si rotan mucho, el admin va a agregar y
  quitar gente seguido → vale la pena enseñarle bien esa pantalla)

**Instalación:** la receta de 20 minutos + registrar su URL en tu cliente OAuth
(en paralelo, minuto 12–16).

**Problemas que van a aparecer:**

| Síntoma | Causa | Solución |
|---|---|---|
| Pedro ve "Sign in with Google" y al darle sale un error de redirect | No registraste la URL de ESTE cliente | Regístrala. Es el error más común de este escenario. |
| Pedro entra pero dice "Access denied" | Está registrado en tu credencial pero no en la lista de usuarios | Settings → Directory |
| Pedro entra con el correo equivocado | Tiene dos Gmail | Que revise arriba a la derecha en Chrome antes de darle sign-in |

**Lo que hay que decirle al cliente por adelantado:**
> *"La gente de fuera de tu empresa entra con un paso extra: un botón de 'Iniciar
> sesión con Google'. Es una sola vez por persona por dispositivo."*

---

## C. Sin dominio, una sola persona ✅

> **Marta**, taller chico, solo ella maneja el inventario, usa
> `marta.talleres@gmail.com`.

**Qué pasa:** Marta copia, Marta es dueña, Marta entra sola. Funciona perfecto.

**Qué preguntar antes de vender:**
- *"¿Vas a ser la única, o en algún momento va a entrar alguien más?"*
- **Importante:** si dice "por ahora sí", véndele como C pero **avísale que
  agregar gente después es un paso de configuración tuyo**, no un botón. Que no
  sea sorpresa.

**Instalación:** la más simple. 15 minutos.

**Problemas que van a aparecer:**

| Síntoma | Causa | Solución |
|---|---|---|
| "No carga en mi otro dispositivo" | Está en otra cuenta de Google | Que revise con qué cuenta abrió el navegador |
| "Quiero que mi hermano también entre" | Ahora es escenario D | Registra la URL en tu credencial + agrégalo a la lista |

---

## D. Sin dominio, varias personas con Gmail personal ⚠️

> **Cristales Hermanos.** Cuatro hermanos, cada uno con su Gmail. Sin dominio.

**Qué pasa:** Luis copia → **solo Luis entra solo**. Ana, José y Rosa necesitan
la credencial, los tres.

Es el escenario B, pero en vez de un contratista suelto, **son todos**. Sin
resolverlo, la app la usa una persona.

**Qué preguntar antes de vender:**
- *"¿Cuántas personas van a registrar movimientos?"*
- *"¿Cada quien usa su Gmail personal, o hay correos de la empresa?"*

**La conversación de negocio que te posiciona como asesor:**

> *"Se los configuro sin problema, funciona igual de bien. Pero les quiero
> comentar dos cosas que no son de mi app: si Ana se va de la empresa, se lleva
> su cuenta y ustedes no recuperan lo que estaba a su nombre. Y si quieren
> quitarle el acceso a alguien rápido, depende de que yo lo haga."*
>
> *"Un dominio propio les cuesta unos dólares al mes por persona y el correo
> pasa a ser de la empresa, no de la persona. No es urgente, pero cuando crezcan
> lo van a necesitar."*

Si lo toman, tu instalación se vuelve escenario A — el más barato para ti.

**Instalación:** receta de 20 min + registro OAuth. Igual que B.

**Problemas que van a aparecer:**

| Síntoma | Causa | Solución |
|---|---|---|
| Todos menos uno ven "Sign in with Google" | Normal. Solo el dueño de la copia entra directo | Explícalo desde el principio o te van a llamar |
| Uno no puede pasar del sign-in | URL no registrada, o entró con otro Gmail | Revisa los dos |
| "¿Por qué Luis sí y nosotros no?" | Luis es el dueño de la copia | *"Porque la app vive en el Drive de Luis. Ustedes son invitados a su oficina."* |

---

## E. Empresa CON dominio, pero copió con Gmail personal 🔴

> Don Carlos estaba en su casa, entró con su Gmail personal sin fijarse, e hizo
> la copia con ese.

**Qué pasa:** **NADIE de la empresa entra automáticamente**, ni siquiera los que
sí tienen correo corporativo. El dueño ya no vive en esa empresa. Y todos los
documentos y respaldos quedan en el Drive personal de Don Carlos.

**Este es el error más caro, y es facilísimo de cometer.**

**Cómo prevenirlo — es lo único que importa:**

Antes de que copie, dile textual:

> *"Antes de darle a copiar: fíjate arriba a la derecha en Chrome que estés en
> tu correo de la empresa, no en el personal. Si te equivocas, todo tu
> inventario y tus fotos quedan en tu cuenta personal y hay que empezar de
> cero."*

Ponlo también en la guía de instalación, con letras grandes.

**Cómo arreglarlo si ya pasó:**

Depende de qué tan avanzado esté:

- **Si acaba de copiar y no ha metido datos** → borra esa copia y empieza de
  nuevo con la cuenta correcta. 10 minutos.
- **Si ya tiene datos** → hay dos caminos, ninguno indoloro:
  1. **Transferir la propiedad** de la hoja a la cuenta correcta desde Drive.
     Los documentos siguen en el Drive personal hasta que se muevan a mano, y
     hay que volver a publicar la app. **Pruébalo tú primero en una copia de
     mentira antes de hacerlo con un cliente.**
  2. **Empezar de nuevo** e importar los movimientos con la función de Import.
     Los documentos adjuntos se pierden.

**Cóbralo.** No es tu error, y arreglarlo es trabajo real.

---

## F. Cada quien hizo su propia copia ❌

> Luis copió. Ana vio el link, le dio copiar también "para tenerlo yo también".

**Qué pasa:** dos almacenes distintos que no se hablan. Lo que Luis registra Ana
no lo ve. **Nadie se da cuenta hasta que los números no cuadran**, semanas
después.

**Cómo prevenirlo — dilo en la llamada, con estas palabras:**

> *"Una sola persona hace la copia. Los demás usan el LINK que les voy a dar, no
> copian la hoja. Si copian, cada quien acaba con su propio inventario y no se
> enteran hasta que las cuentas no cierran."*

Es una confusión natural — copiar suena a "tener acceso". Hay que decirlo de
frente y anticiparse.

**Cómo arreglarlo:**
- Decidir cuál copia es la buena (la que tenga más movimientos reales)
- Exportar los movimientos de la otra a CSV
- Importarlos a la buena con Settings → Import
- **Borrar la copia mala.** Si se queda ahí, alguien la va a volver a usar.

---

## G. Varias bodegas 🔵

> Vidrios del Norte tiene bodega en Salt Lake y en Provo.

**No es un problema técnico, es una decisión de negocio del cliente.** Pregunta:

> *"¿El gerente de Salt Lake necesita ver lo que hay en Provo?"*

| Respuesta | Solución | Qué cobras |
|---|---|---|
| **Sí, quiero ver todo junto** | Una sola copia, usando Locations para separar bodegas | Una instalación |
| **No, son negocios separados** | Una copia por bodega, independientes | Dos instalaciones (la segunda a 50–70%) |

**Lo que hay que advertir si eligen "todo junto":** cualquiera que entre ve el
inventario de las dos bodegas. Hoy no hay forma de decir "este usuario solo ve
Provo" — eso son permisos granulares y están en el backlog.

**Lo que hay que advertir si eligen "separadas":** los reportes también son
separados. No hay una vista que sume las dos.

---

# 5. Qué puedes vender y qué no

> **Sobre los precios:** salen de **tu tiempo y del valor para el cliente**, no
> de un estudio de mercado — no está investigado qué cobra la competencia en
> Utah. Son un punto de partida para tu decisión, no una recomendación con datos
> detrás.

## ✅ Lo que SÍ puedes vender

| Qué | Precio sugerido | Por qué ese precio | Ventajas | Desventajas y riesgos |
|---|---|---|---|---|
| **Instalación básica** (A, C) | $300–500 una vez | ~1 hora tuya, pero el valor es que dejen de perder material. Cobra el valor, no la hora. | No tocas nada después. Cero costo recurrente para ti. | Si se equivocan al copiar (E), la rehaces gratis o quedas mal. **Blíndate con la guía previa.** |
| **Acceso para gente fuera del dominio** (B, D) | $150–250 una vez | Son 5 min tuyos, pero es **lo único que hace la app usable** para ese cliente. Sin esto no te compran. | Se hace una vez y sirve para siempre. | Quedan ligados a tu credencial. **Si tú desapareces, pierden el acceso externo.** Díselo antes. |
| **Carga de su inventario actual** | $200–600 según el desorden | Es el trabajo más aburrido y el que más les ahorra. Cobra el caos, no la hora. | Alto valor percibido. Te deja ver su operación real. | Pozo sin fondo si los datos están sucios. **Cotiza después de ver el archivo, nunca antes.** |
| **Capacitación al equipo** | $150–300 por sesión | Una app que nadie sabe usar se abandona en tres semanas. Protege tu venta. | Baja el soporte que te van a pedir. | Ninguna. Es la mejor inversión de los dos lados. |
| **Soporte mensual** | $50–150/mes | Preguntas, cambios chicos, y actualizaciones cuando saques versiones. | **Ingreso recurrente.** Es lo que convierte esto en negocio y no en trabajos sueltos. | Tienes que contestar de verdad. Un soporte que no responde te destruye más rápido que no tenerlo. |
| **Segunda bodega** (G) | 50–70% de la instalación | Ya conoces su operación, el trabajo es menor. | Fácil de vender a quien ya compró. | Una instalación más que mantener. |
| **Rescate del escenario E** | $200–400 | No es tu error y es trabajo real. | — | Cobra por adelantado. Es un trabajo ingrato. |
| **Personalización** | Por cotización | Depende del cambio. | Te diferencia de cualquier software genérico. | **Peligro real:** cada personalización es una versión distinta que mantener. Cóbrala cara o di que no. |

## ❌ Lo que NO puedes vender

| Qué | Por qué no | Qué decirle al cliente |
|---|---|---|
| **Almacenamiento extra** | Los datos viven en **el Drive de ellos**, no en un servidor tuyo. El espacio se lo compran a Google. | *"El espacio es de tu cuenta de Google. Si se llena, le compras más a Google directo — yo no te lo vendo ni te lo cobro."* **Y eso es bueno: significa que tus datos son tuyos.** |
| **Quitar el aviso de "app no verificada"** | Imposible bajo este modelo. La verificación es por proyecto y cada copia tiene el suyo. | *"Ese aviso sale porque el programa corre en TU cuenta, autorizado por TI. El 'desarrollador' que muestra ahí eres tú mismo. Es el precio de que tus datos nunca pasen por mis servidores."* |
| **Lectura automática del Gmail** | Permiso restringido de Google, con auditoría anual pagada. | *"Puedo leer un correo si lo pegas en la app — eso funciona hoy. Buscarlos solo en tu buzón requiere una certificación que cuesta miles al año. Todavía no."* |
| **La IA incluida sin costo** | El consumo lo cobra Google contra la clave del cliente. | *"La IA usa tu propia clave de Google. Le pagas a Google directo lo que consumas, normalmente centavos. Yo no te cobro por eso ni veo lo que procesas."* |
| **Garantizar que nada se rompa si editan la hoja a mano** | Pueden borrar una columna. | *"Puedes ver la hoja, pero no la edites a mano. La app la mantiene ordenada; si le mueves, se descuadra."* |
| **Permisos por bodega o por rol fino** | Hoy hay 3 roles fijos. Está en el backlog. | *"Hoy hay tres niveles: administra, registra, o solo mira. Permisos más finos vienen después."* |

## Cómo empaquetarlo

| | **Básico** | **Completo** | **Con soporte** |
|---|---|---|---|
| | ~$400 | ~$900 | ~$900 + $100/mes |
| Instalación | ✅ | ✅ | ✅ |
| Acceso para Gmail personal | — | ✅ | ✅ |
| Carga de su inventario | — | ✅ | ✅ |
| Capacitación | — | ✅ | ✅ |
| Soporte y actualizaciones | — | 30 días | Continuo |

**Por qué así:** el de en medio es el que quieres vender, y existe para que el
Básico se vea incompleto. El de soporte es el único con ingreso recurrente —
**empuja ese**, aunque cobres menos por la instalación.

---

# 6. Resumen de una página

| Escenario | ¿Funciona hoy? | Trabajo extra tuyo | Qué preguntar antes |
|---|---|---|---|
| **A** — Dominio, todos con correo de empresa | ✅ Directo | Ninguno | *"¿Todos los correos terminan en @tuempresa.com?"* |
| **B** — Dominio + algunos Gmail personal | ✅ Con configuración | 5 min de OAuth | *"¿Va a entrar gente de fuera?"* |
| **C** — Sin dominio, una persona | ✅ Directo | Ninguno | *"¿Vas a ser la única?"* |
| **D** — Sin dominio, varias personas | ✅ Con configuración | 5 min de OAuth | *"¿Cuántos van a registrar movimientos?"* |
| **E** — Copió con la cuenta equivocada | 🔴 Roto | Rescate (cóbralo) | *"¿Con qué correo vas a entrar?"* ← **la pregunta más importante** |
| **F** — Cada quien copió | ❌ Dos inventarios | Consolidación | *"Una sola persona copia. Los demás usan el link."* |
| **G** — Varias bodegas | ✅ Las dos formas | Depende | *"¿El gerente de una necesita ver la otra?"* |

**La pregunta que más problemas evita, y hay que hacerla siempre:**

> *"¿Con qué cuenta de Google vas a hacer la copia?"*
