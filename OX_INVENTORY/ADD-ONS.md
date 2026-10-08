# Lo que se puede cobrar aparte

Jose, 2026-10-07: *"dame una lista de todos los add-ons que tenemos y que
podemos cobrar como extra."*

Separado en **lo que existe hoy** y **lo que habría que construir**, porque
vender lo segundo como si fuera lo primero es la forma más rápida de perder un
cliente.

---

# 1. LA CLAVE DE GEMINI — el único add-on "de verdad" que ya existe

## Qué consume, de verdad

Acopio llama a Gemini en **tres sitios**, y en ninguno es por movimiento:

| Cuándo | Cuántas llamadas |
|---|---|
| Pegar el correo de un proveedor | **1** |
| Subir la foto/PDF de una factura | **1** |
| Comprobar la clave al guardarla | 1 (hoy 4 — eso es un fallo nuestro, anotado) |

**Una llamada por documento leído.** Un almacén que registre 20 entradas al día
y use el lector en todas hace **20 llamadas al día.**

**Eso cabe de sobra en la capa gratuita de Google**, incluso en la estimación
más baja que encontré. Dicho con honestidad: **el número exacto de la capa
gratuita no se puede dar como un hecho** — las fuentes dan 250, 500 y 1.500 al
día según la fecha, y Google ya no publica una tabla universal: **el límite es
por proyecto y se ve en AI Studio**. Lo que sí se puede afirmar es la forma del
consumo: **una llamada por documento, no por movimiento.**

## ¿La clave la pone el cliente o nosotros?

**El cliente. Siempre.** Ver la regla del final de `DE-CERO-A-CLIENTE.md`: en el
momento en que una clave nuestra vive en la copia de un cliente, su consumo es
nuestro, su tope es nuestro, y el día que uno abusa **se cae para todos**.

## Entonces, ¿qué se cobra?

No se cobra la clave: se cobra **que funcione sin que él tenga que entender
nada.** Eso es un servicio y es el que de verdad vale:

- Crearla con él o por él.
- Dejarla probada.
- Encender lo que haga falta en su Workspace.
- Y, el día que falle, saber **por qué** falla (un 503 no es una clave mala, y
  ahora lo sabemos).

## Qué decir si no funciona — y esto hay que saberlo de memoria

| Lo que ve | Qué es | Qué se le dice |
|---|---|---|
| **503 / 429** | Google saturado. **No es la clave** | *"Es de Google, no tuyo, y no se perdió nada. Se arregla solo en unos minutos — mientras tanto se teclea a mano."* |
| **403** | La *Generative Language API* está apagada en ese proyecto | *"Falta encender una cosa en tu proyecto. Lo hago yo en dos minutos."* |
| **400** | La clave está incompleta o mal pegada | *"Se cortó al copiar. Vamos a sacar otra."* |
| **Se queda cargando** | Cuenta de empresa con AI Studio apagado | *"Tu administrador tiene que activar Google AI Studio. Te digo dónde."* |

**Y la frase que nunca debe faltar, en los cuatro casos:**
> *"La app funciona igual. Esto sólo quita el teclear."*

---

# 2. LO QUE YA EXISTE Y SE PUEDE COBRAR COMO SERVICIO

No es software nuevo: es **trabajo nuestro**, y es lo que un cliente pequeño no
puede hacer solo.

| | Qué | Por qué lo pagan |
|---|---|---|
| **Instalación llave en mano** | La copia, el asistente, el deploy, el proyecto de Cloud, las APIs, los usuarios | Son los únicos pasos técnicos que hay, y dan miedo |
| **Migrar su Excel** | Su inventario actual dentro, limpio y cuadrado | Es el trabajo que decide si adoptan la app o la abandonan la primera semana |
| **Montar su bodega** | Ubicaciones, categorías, mínimos, el mapa dibujado como está su nave | Un almacén sin ubicaciones registradas no puede recibir nada |
| **Formación** | Una sesión con su gente | — |
| **Soporte con compromiso** | Responder en X horas, no "cuando pueda" | Es lo que convierte una herramienta en un proveedor |
| **Quitar la pantalla gris** | Su proyecto en modo Interno | **Gratis para nosotros** si tiene Workspace (ver `DE-CERO-A-CLIENTE.md`), y se ve profesional |
| **Entrar con correo personal** | El cliente de OAuth, para quien no tiene dominio propio | Le ahorra comprar un dominio |
| **Respaldo y ensayo de restauración** | Comprobar delante de él que su copia se puede recuperar | Nadie lo hace, y es lo que se agradece el día malo |
| **Ajustes a su medida** | Lo que la landing ahora promete: *"cuéntanos qué necesita tu bodega"* | — |

---

# 3. LO QUE TODAVÍA NO EXISTE — no se vende hasta que esté

Ordenado por lo que más se puede cobrar:

| Qué | Estado |
|---|---|
| **Conteo cíclico** | planeado, grande |
| **Códigos QR + escaneo** | planeado, 4 trabajos |
| **Informes de verdad** (valor del inventario, reposición, consumo por obra) | decidido, sin empezar |
| **Recibo de entrega firmable** | planeado |
| **Trazabilidad por lote** | decidido (nivel 1) |
| **Varias bodegas** | ni siquiera planeado |
| **Panel de clientes** | decisión pendiente |

---

# 4. MI OPINIÓN SOBRE CÓMO COBRARLO

**No cobres el lector de IA por uso.** Tres razones:

1. **No lo podemos medir bien.** La cuota es del proyecto del cliente y la ve
   él, no nosotros. Cobrar por algo que no medimos es cómo se pierde confianza.
2. **El consumo real es ridículo.** 20 llamadas al día no justifican una
   factura, y poner un contador delante hace que la gente **deje de usarlo**
   por miedo a gastar — matando justo la función que lo diferencia.
3. **Lo caro no es la llamada, es el soporte.** El valor está en que funcione
   sin que entienda nada.

**Lo que yo cobraría:**

- **Una cuota de instalación**, que incluye las cuatro piezas montadas y
  probadas. Es el trabajo real y es donde el cliente nota la diferencia entre
  una hoja de cálculo y un proveedor.
- **La migración de su Excel aparte**, según lo que traiga. Es imposible de
  estimar a ciegas y es honesto decirlo.
- **La suscripción llana**, con todo lo que la app hace incluido — **la IA
  también.**
- **Ajustes a medida por horas**, que es lo que la landing ya promete.

**Lo que NO cobraría nunca aparte:** los respaldos. Un sistema de inventario sin
respaldo no es un sistema de inventario, y cobrarlo como extra dice de nosotros
algo que no queremos que diga.
