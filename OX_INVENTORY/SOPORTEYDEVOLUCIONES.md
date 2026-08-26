# Soporte y devoluciones — cómo aplicarlo

> **El texto que obliga son los Términos** (`legal/TERMS-OF-SERVICE.md`,
> secciones 5 y 9), que es lo que el cliente acepta al marcar la casilla. Este
> documento es para Jose: la misma política en lenguaje de trabajo, con los
> casos que van a aparecer y qué contestar.
>
> Si los dos alguna vez dicen cosas distintas, **manda el de los Términos**, y
> hay que arreglar este. `tools/test-legal-sync.js` vigila que las tres copias
> del contrato (el `.md`, la app y la pestaña del Sheet) digan lo mismo; no
> puede vigilar este archivo.

---

## Por qué esto existe

Nada de esto se discute cuando el cliente está contento. Se discute cuando
está molesto, y para entonces ya es tarde para definirlo. Escrito de antemano,
la conversación es "esto es lo que acordamos"; sin escribir, es la palabra de
uno contra la del otro y siempre pierde el que vende.

---

## 1. El tiempo de respuesta: **un día hábil**

Jose preguntó si 2 o 3 horas era realista y profesional. **La respuesta es
no**, por tres razones concretas:

1. **Tienes un trabajo de tiempo completo.** Un correo que entra a las 10 de
   la mañana mientras descargas un camión no se contesta a las 12. Prometer 2
   horas es prometer algo que vas a incumplir en la primera semana.
2. **Prometer 2 horas y contestar en 9 es peor que prometer un día hábil y
   contestar en 3.** El mismo correo, la misma hora, y en un caso quedaste mal
   y en el otro quedaste bien. Lo único que cambió fue la promesa.
3. **Rompe el complemento que ya vendes.** El soporte prioritario cuesta
   +$20/mes y promete **4 horas hábiles**. Si el soporte base contesta en 2 o
   3, el complemento no vende nada — y un cliente que lo note tiene razón en
   sentirse vendido algo que ya tenía.

**Lo comprometido:** contestar en **un día hábil**, lunes a viernes, sin
feriados de EE. UU., hora de Montaña.

En la práctica vas a contestar mucho antes casi siempre. Eso es exactamente lo
que se busca: la promesa es el piso, no la expectativa.

**Y es responder, no resolver.** Los Términos lo dicen con esas palabras.
Nunca prometas cuánto tarda un arreglo; sí prometes que en un día hábil la
persona sabe qué está pasando y qué sigue.

---

## 2. Qué incluye el mensual

- **Todas las versiones nuevas**, mientras la licencia esté activa. No hay una
  versión superior que comprar después: las mejoras SON la suscripción.
- **Arreglos de errores y actualizaciones de seguridad.**
- **Preguntas de uso**, por correo.
- **Ayuda para leer sus propios datos** cuando algo no cuadra.

---

## 3. Qué NO incluye — y se cotiza aparte

Todo esto se cotiza **antes** de empezar. Nunca se cobra nada sin acuerdo
escrito previo.

| Trabajo | Por qué se cobra |
|---|---|
| Importar su histórico | Es trabajo de horas, distinto en cada cliente |
| Capacitación extra | La instalación incluye una sesión; las demás no |
| Cambios hechos a su medida | Un reporte o campo que solo esa empresa necesita |
| Recuperar datos que ellos borraron | Cuando se pueda |
| **Reparar una copia modificada** | El código es licenciado, no vendido — ver `LICENCIA-E-INTEGRIDAD.md`. Puedes **negarte** |
| Bodega adicional | Tiene su propio precio |

---

## 4. Devoluciones

### La instalación ($500) — decisión de Jose

- **Antes de hacerla: se devuelve completa.** Si se arrepienten antes de que
  instales, no hiciste nada y no cobras nada.
- **Una vez hecha: no se devuelve.** Es trabajo entregado — instalaste,
  configuraste sus categorías y racks, cargaste su equipo y capacitaste. Sigue
  siendo así aunque después cancelen la suscripción.

### El mensual ($49)

- **Cancelan dentro de 14 días de un cobro** → ese mes se devuelve completo.
- **Después de 14 días** → ese mes no se devuelve, y conservan soporte y
  versiones hasta que termine.
- **Anual ($490)** → se devuelven los **meses enteros que no han usado**. Los
  ya empezados no.
- **Si la culpa es nuestra** → si un defecto lo deja inservible y no lo
  arreglas en 30 días desde que lo reportaron, se devuelve el período completo
  sin importar las fechas. Nadie debe pagar un mes en el que no funcionó.

Las devoluciones se hacen por el mismo medio de pago, dentro de **10 días
hábiles** de acordadas.

> **Los 14 días, los meses enteros y los 30 días son propuesta mía**, no
> decisión de Jose. Él dijo "depende del caso y la fecha"; eso no se puede
> poner en un contrato, porque "depende" es lo que produce discusiones. Son
> números defendibles y aplicables igual con todos. Si quiere otros, se
> cambian en `legal/TERMS-OF-SERVICE.md` y se corre `node tools/sync-legal.js`.

---

## 5. Cuando dejan de pagar

**No se apaga nada.** Está en su cuenta de Google, no hay forma de apagarlo, y
no la usaríamos si la hubiera. Lo que se acaba es el soporte y las versiones
nuevas — no el software, y no el acceso a sus propios datos.

Eso ya estaba decidido (v10.8) y ahora está escrito en la sección 9 y en la 10.

---

## 6. Facturación — lo que dice el contrato

Ya está en los Términos, sección 9:

- Se factura **por correo**, a la dirección que ellos den, en cada fecha de
  renovación. **Pagadero en 10 días.**
- Precios en dólares, sin impuestos incluidos; si aplican, se suman a la
  factura.
- **Si un pago no entra:**
  - **Día 10** → correo de aviso. Los pagos fallan por razones aburridas y
    ahí termina casi siempre.
  - **Día 30** → **se pausan** el soporte y las versiones nuevas hasta que se
    ponga al día. **La app sigue funcionando** y conservan todos sus datos.
  - **Nunca se retienen sus datos para cobrar.** No son nuestros para
    retenerlos, y la exportación queda disponible pase lo que pase.
- Al pagar, soporte y versiones vuelven de inmediato, **sin cargo de
  reconexión**.

### Volver después de irse

**Quien se va y regresa, vuelve como cliente nuevo.** Precios vigentes, y
ningún precio promocional o fundador que hubiera tenido regresa con él —
incluida la instalación, si hay que hacerla otra vez. Decisión de Jose.

---

## 7. Casos que van a aparecer, y qué contestar

**"Instalaste ayer y ya no lo quiero. Devuélvanme todo."**
El mensual sí (está dentro de 14 días). La instalación no: ese trabajo se hizo
y se entregó. Dilo así, sin rodeos, y ofrece ayudarles a exportar sus datos.

**"Llevo tres meses pagando y casi no lo uso."**
No hay devolución — el servicio estuvo disponible. Pero esto es un aviso de
que se van: es exactamente para lo que existe la alerta de check-in. Vale más
una llamada que los $49.

**"Se cayó una semana y no me contestaste."**
Si es un defecto nuestro y pasaron más de 30 días desde el reporte, se
devuelve el período. Si fue menos, no aplica, pero conviene preguntarse por
qué tardó tanto.

**"¿Me pueden importar mis 3 años de Excel?"**
Sí, y se cotiza aparte. Nunca lo incluyas "de cortesía" en la primera venta:
crea el precedente de que lo que cuesta horas es gratis.

**"Cambié una fórmula y ahora no abre."**
Reparar una copia modificada es trabajo cobrable, y puedes negarte. Ver
`LICENCIA-E-INTEGRIDAD.md`. La huella de integridad
(`node tools/build-fingerprint.js --check`) te dice si el archivo es el que
entregaste o no.

---

## 8. Lo que falta decidir — y es tuyo, no mío

### **CON QUÉ cobras.** Esto es lo único que sigue sin resolver.

El contrato ya funciona con cualquier método; lo que falta es elegirlo. **No
voy a inventar un proveedor**, así que aquí están las opciones reales con lo
que de verdad cuestan y lo que de verdad implican. Averigua las comisiones
vigentes antes de decidir — cambian, y lo que yo recuerde no sirve.

| Opción | A favor | En contra |
|---|---|---|
| **Factura manual + transferencia / cheque** | Comisión cero. Empiezas hoy. | Tú persigues cada pago. Se vuelve insostenible pasando ~10 clientes |
| **Zelle / transferencia bancaria** | Sin comisión, inmediato, normal entre empresas en EE. UU. | Sin cobro recurrente: alguien tiene que acordarse **cada mes** |
| **Stripe (u otro procesador)** | Cobro **recurrente automático**, reintentos, recibos, cancelación limpia | Comisión por transacción; hay que dar de alta la empresa |
| **PayPal / Wise** | Fácil de abrir, sirve fuera de EE. UU. | Comisión mayor; peor imagen para B2B |

**Mi recomendación, y por qué:** con los primeros 2 o 3 clientes, **factura
manual**. Con tan pocos, automatizar cuesta más tiempo del que ahorra, y vas a
querer hablar con cada uno igual. **En cuanto llegues a 5, mueve el mensual a
cobro recurrente automático** — no por la comisión, sino porque el modo de
fallar de la facturación manual es que TÚ te olvidas, y un cliente al que no
le cobraste tres meses es una conversación mucho peor que un 3% de comisión.

**Lo que hay que verificar antes de cobrarle a nadie**, y no lo puedo hacer
yo:

1. **A nombre de quién factura** — ¿persona natural o una LLC? Cambia los
   impuestos y cambia quién responde si algo sale mal.
2. **Si hay que cobrar impuesto sobre las ventas** de software en Utah, y en
   el estado del cliente. Los Términos ya dicen que los precios no lo
   incluyen, así que el contrato está cubierto; lo que falta es saber si
   aplica.
3. **Qué lleva una factura** para que el cliente pueda deducirla: tu nombre o
   el de la empresa, dirección, número de factura, fecha, concepto, período.

### Lo demás ya está resuelto

- ~~Correo de bienvenida~~ ✅ reescrito (v11.20): entusiasmo primero, qué
  compraron, qué viene, y los tres enlaces que van a necesitar otra vez.
- ~~Precio fundador al volver~~ ✅ decidido por Jose y escrito en la sección 9
  de los Términos: nadie recupera precio ni beneficios.
