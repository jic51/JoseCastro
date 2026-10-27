# Precios y competencia — investigación de mercado (agosto 2026)

Datos verificados contra fuentes públicas, listadas al final. Se actualiza
cuando cambien los precios de los competidores o cuando tengamos clientes
reales de los que aprender.

---

## Qué cobra el mercado

| Producto | Precio | Modelo |
|---|---|---|
| **Sortly** Advanced | $29/mes anual · $49/mes mensual | Plano |
| **Sortly** Ultra | $89/mes | Plano |
| **Zoho Inventory** | Gratis · $29–$99/mes por organización | Plano |
| **inFlow** | ~$110/mes por 2 usuarios | **Por usuario** |
| Promedio del sector | **~$150/usuario/mes** (~$1,530/usuario/año) | Por usuario |
| Rango típico PyME | $50–$300/mes | Varios |
| Gama básica | $20–$50/mes | Plano |
| Enterprise | $5,000+/mes | Cotización |

Dos datos del mercado que importan más que la tabla:

1. **El primer año siempre cuesta más.** Onboarding, hardware e integraciones
   a menudo **igualan** el costo de la suscripción. Cobrar instalación aparte
   es la norma de la industria, no algo que haya que justificar.
2. **El costo oculto del cliente que NO compra nada** son 3–5 horas por semana
   de reconciliación manual. Ese es el número contra el que se vende, no
   contra el precio de Sortly.

---

## Contra quién competimos de verdad

**No es Sortly. Es "una hoja de cálculo desordenada" o papel.**

Es la decisión más importante de este documento, porque cambia todo el
encuadre: no estamos peleando por ser más baratos que Sortly, estamos
peleando contra la inercia de seguir haciéndolo a mano. El cliente objetivo
no está comparando software — está aguantando un problema.

### Dónde ganamos

- **Sin cobro por usuario.** Es el argumento más fuerte y no nos cuesta nada:
  Google Sheets no cobra por usuario. Una bodega de 8 personas paga lo mismo
  que una de 1. En inFlow serían $440+/mes.
- **Los datos viven en el Drive del cliente.** Sin migración, sin miedo a
  quedarse encerrado, y si deja de pagar su sistema sigue funcionando. Ningún
  SaaS puede decir eso.
- **Trabaja con lo que ya tienen.** Google Sheets, Drive, Gmail. Nada nuevo
  que aprender ni que administrar.
- **Instalación hecha por nosotros.** El competidor barato te manda un enlace
  y suerte.

### Dónde perdemos, y hay que decirlo

- **Sin códigos de barras ni escáner.** Todo competidor serio lo tiene, y un
  comprador de bodega lo pregunta.
- **Sin conteo cíclico.** Diseñado (ver `BACKLOG.md`), sin construir.
- **Sin app móvil nativa.** Es web; funciona en el teléfono, pero no está en
  las tiendas.
- **Sin integraciones** con contabilidad ni e-commerce.
- **Techo de escala heredado de Google Sheets** (ver abajo).
- **Instalación manual por cliente** (~5 min de Cloud Console cuando hay gente
  fuera del dominio). No escala a decenas de clientes por mes sin cambiar algo.

---

## ✅ PRECIO DECIDIDO (v10.8) — un producto, con complementos

Jose revisó una propuesta de tres planes (Esencial / Profesional / Avanzado) y
la descartamos por una razón estructural, no de gusto:

**El tiering por FUNCIONES no se puede hacer cumplir en esta arquitectura.** El
código corre dentro de la cuenta de Google del cliente; puede abrir el editor
de Apps Script. Un "plan sin módulo de costos" es un interruptor que él mismo
puede voltear. Y construir ese bloqueo cuesta ingeniería real, triplica lo que
hay que probar en cada versión, y hace que cada reporte de bug empiece con
"¿en qué plan estás?".

Se cobra, entonces, por lo que **sí** es exigible: lo que consume tiempo de
Jose o tiene un costo real detrás.

### Base
| | |
|---|---|
| Instalación | **$500**, una sola vez |
| Suscripción | **$49/mes** o **$490/año** (2 meses gratis) |

### Complementos
| | Instalación | Mensual |
|---|---|---|
| Bodega adicional | +$250 | +$25 |
| Soporte prioritario (4 h hábiles, WhatsApp) | — | +$20 |
| Lector de correos gestionado (llave nuestra) | — | +$15 |
| Migración de su histórico | $300–$800 | — |
| Capacitación extra, por sesión | $150 | — |

**Precio fundador — los primeros 3 clientes:** $39/mes congelado para siempre,
a cambio de permiso para usar su nombre y sus números. No es bajar el precio,
es comprar material de venta.

**Congelado mientras NO se vayan.** Jose (v11.20): quien cancela y regresa
vuelve como cliente nuevo — precios vigentes, sin precio fundador y sin los
beneficios que tenía, incluida la instalación si hay que rehacerla. Está en la
sección 9 de los Términos, no solo aquí, porque es de las cosas que se
discuten y hay que poder señalarlas.

**El lector de correos** es el único complemento que corresponde a una función,
y solo porque tiene un costo real detrás: necesita una llave de API de Gemini.
Si la pone el cliente (v10.8 lo permite desde Settings → System), es gratis. Si
la ponemos y administramos nosotros, se cobra.

**Cuándo subir a $59–$69:** cuando existan códigos de barras y conteo cíclico.

### Errores corregidos de la propuesta de tres planes

1. Trataba como "por crear" el lector de correos, el costo promedio ponderado y
   el archivado automático. **Los tres están en producción** (v9.61, v9.78, y
   el archivado desde antes). Eso invalidaba su consejo de "vender el mapa de
   ruta" con esas funciones.
2. La suma estaba mal: 60/20/20 sobre 100 clientes da **$5,300/mes**, no
   $4,900.
3. "Margen operativo del 95%" es cierto solo si el tiempo de Jose vale $0. Con
   las horas de `PLAN-5-ANIOS.md`, el margen real del Año 3 ronda el **52%**.

### La conclusión que vale más que el precio

El cuello de botella son horas, no dinero. Y eso invierte la intuición:

| | Ingreso/mes | Carga |
|---|---|---|
| 100 clientes a $39 | $3,900 | ~16 h/semana |
| 50 clientes a $79 | $3,950 | **~8 h/semana** |

**Cuando el límite son horas, el precio es la palanca, no el volumen.** Y
"plantillas por industria" deja de ser una función bonita: es la que baja la
instalación de 3 h a 1 h y por lo tanto la que multiplica cuántos clientes
caben antes de contratar. Vale más, en dinero, que cualquier ajuste de precio.

Ver `LICENCIA-E-INTEGRIDAD.md` para qué pasa cuando dejan de pagar.

---

## Precio anterior (v9.96) — se conserva por el razonamiento

- **Instalación: $400, una sola vez.** Es trabajo real — instalar, configurar,
  capacitar, y OAuth si hace falta. Coincide con lo que la industria ya cobra
  como onboarding.
- **Soporte + actualizaciones: $39/mes**, o **$390/año** (dos meses gratis).

Por qué $39, y no más ni menos:

- **Debajo del mensual de Sortly ($49)** y a la par de su precio anual.
  Comparable de frente sin ser el más barato.
- **Encima de la línea de "demasiado barato para ser serio" (~$20).** Es un
  sistema donde una empresa confía su inventario; un precio de juguete espanta
  al comprador que más nos conviene.
- **Sin cobro por usuario**, que es donde el número se vuelve imbatible en
  cuanto la bodega tiene más de dos personas.
- Encaja con lo ya decidido: las actualizaciones se cobran dentro del soporte
  mensual, no como upgrade suelto.

### Cuándo subir el precio

- Cuando **códigos de barras** y **conteo cíclico** existan: ahí el producto
  compite de frente con Sortly Advanced y $49–$59 es defendible.
- Cuando haya **10 clientes pagando sin quejarse del precio** — señal clara de
  que está por debajo del valor.
- Subir **solo para clientes nuevos**. Los existentes conservan su precio: es
  barato de conceder y compra lealtad y recomendaciones.

### Cuándo NO bajarlo

Casi nunca. Si no cierran ventas, el problema rara vez es el precio en este
rango — es que falta algo del cuadro de "dónde perdemos", o que el cliente no
tenía el problema. Bajar el precio a un cliente que no tiene el problema solo
consigue un cliente que paga poco y pide mucho.

La excepción legítima: **descuento por caso de estudio** para los 2–3
primeros, a cambio de permiso para usar su nombre y sus números. Eso no es
bajar el precio, es comprar material de venta.

---

## Techo de escala — lo que sabemos y lo que no

**Medido** (`tools/test-scale.js`): el motor de stock (`calculateStock`) es
**lineal**. 100,000 movimientos se recalculan en ~0.4 s de cómputo puro, sin
degradación. El algoritmo no es el problema.

**No medido, y es donde está el riesgo real:**
- Tiempo de lectura/escritura de Google Sheets (el costo verdadero).
- El **límite de 6 minutos por ejecución** de Apps Script.
- **Edición concurrente.** La literatura sobre hojas de cálculo como sistema
  de inventario dice que los conflictos de edición simultánea rompen la
  integridad **antes** que el rendimiento. Acopio escribe desde el servidor,
  no desde la hoja, lo que ayuda — pero no está probado con 3–4 personas
  guardando a la vez.
- Cuotas de Apps Script: 100 correos/día en cuentas normales, 1,500/día en
  Workspace.

**Mitigaciones que ya existen:** hojas derivadas de stock
(`buildStockFromDerivedSheets_`), archivado de movimientos viejos, y lectura
solo de la cola del log de auditoría.

**Qué decirle a un cliente hoy, con honestidad:** el sistema está probado
cómodamente en el rango de una bodega pequeña o mediana. Para una operación
con decenas de miles de movimientos al año hay que medirlo antes de prometer
nada.

---

## 🏢 UNA EMPRESA MEDIANA-GRANDE LLAMA: VENDER O NO, Y CON QUÉ ARGUMENTO

Jose, 26/10:

> *"Si en algún momento una empresa mediana-grande nos habla y pide utilizar
> nuestro sistema debemos tener un argumento para venderle o no. Si le vendemos
> el servicio debemos definir cuánto tiempo de soporte se da a la semana y si se
> excede de eso se carga X cantidad por cada hora extra, ya que si le damos más
> tiempo a una empresa grande no tenemos tiempo para las empresas pequeñas, y
> eso nos haría perder dinero. Según yo lo veo, es mejor más empresas pequeñas
> que pocas empresas grandes. Y si no le vendemos debemos tener el argumento
> para que entiendan por qué no podemos."*

### Por qué tiene razón, con el número delante

No es una intuición, es aritmética, y conviene verla escrita porque es lo que
sostiene todo lo demás de esta página.

Un cliente paga **$49/mes**. Si una hora de soporte vale **$75**, entonces:

| | Lo que paga al mes | Horas de soporte que lo dejan a cero |
|---|---|---|
| Un cliente | $49 | **0,65 h** |
| Diez clientes pequeños | $490 | 6,5 h |

**Cuarenta minutos al mes.** Ése es todo el soporte que una suscripción paga.
Un cliente que consume dos horas al mes no deja un margen pequeño: **cuesta
dinero**, y además se come el tiempo de los diez que no llaman.

Y lo que lo hace peor con una empresa grande no es que llame más veces: es que
**cada vez que llama cuesta más** — más gente que formar, más casos raros, más
«¿pueden añadir un campo?». El trabajo no crece con la factura; crece con el
tamaño de la empresa, y la factura es la misma.

De ahí sale la conclusión de Jose, y es correcta: **diez clientes de $49 valen
más que uno de $490**, porque el de $490 no consume diez veces menos soporte,
consume más.

### El único soporte que la suscripción paga

Para que esto se pueda decir en una llamada sin inventar nada en el momento,
tiene que estar escrito antes de la llamada:

| | Incluido en los $49/mes |
|---|---|
| **Tiempo de soporte** | **1 hora al mes** |
| Forma | Correo, y una llamada si hace falta |
| Respuesta | Un día hábil, de lunes a viernes |
| Qué entra | Que la app funcione: fallos, dudas de uso, recuperar un respaldo |
| Qué NO entra | Formar gente nueva, limpiar datos, cambios a medida, integrar otra cosa |
| **Hora extra** | **$75/h**, en bloques de media hora, avisando antes de empezar |

**Una hora, no cuarenta minutos**, a propósito: el número tiene que ser fácil de
decir y de recordar, y el margen de los que no llaman paga esa diferencia. Lo
que no puede pasar es que no haya número.

**La regla que hace que esto no se vuelva una pelea:** se avisa ANTES. *"Esto
que me pides son como dos horas; llevas 40 minutos del mes. ¿Lo hago y te paso
$75 de la segunda hora, o lo dejamos para cuando puedas hacerlo tú?"* Un cliente
al que se le avisa antes acepta o dice que no; un cliente al que le llega una
factura sorpresa se va, y encima hablando mal.

Y la instalación de **$500 ya incluye la formación inicial**. Eso no es soporte:
es el trabajo que se paga aparte y por eso existe ese precio.

### Cuándo SÍ venderle a una empresa grande

Si cumple las tres, se le vende sin descuentos:

1. **Una bodega, un encargado.** El tamaño que importa no es cuánta gente tiene
   la empresa: es cuántas bodegas y cuántas personas tocan el inventario. Una
   constructora de 200 empleados con **una** bodega y dos bodegueros es un
   cliente perfecto; una de 30 con cinco almacenes no lo es.
2. **Acepta por escrito la hora al mes y los $75.** Sin regatearla. Si regatea
   el soporte antes de firmar, va a consumirlo todo después.
3. **Su volumen cabe.** Ver «Techo de escala», arriba: el motor es lineal y está
   medido, pero decenas de miles de movimientos al año **hay que medirlos antes
   de prometer nada**. Si no se ha medido, se dice que no se ha medido.

Y hay un precio para bodegas adicionales que ya está en la página — ésa es la
palanca correcta, porque cobra por lo que de verdad hace crecer el trabajo.

### Cuándo NO, y cómo decirlo sin perder la relación

Lo que **no** hay que decir nunca es «somos muy pequeños para ti». Eso suena a
disculpa y además no es el motivo. El motivo es de diseño, y dicho así se
entiende y deja la puerta abierta:

> *"Acopio está construido sobre vuestra propia cuenta de Google: eso es lo que
> hace que vuestros datos no pasen por ningún servidor nuestro y que el sistema
> siga siendo vuestro aunque dejéis de pagarnos. Esa misma decisión pone un
> techo, y es honesto decirlo antes y no después: [lo que no encaja]. Con lo que
> me cuentas, en seis meses estaríais peleando contra el sistema en vez de
> usarlo, y eso no le sirve a nadie. Si lo que queréis es [X], os va a servir
> mejor [Y]. Y si en algún momento separáis una bodega o una filial, eso sí lo
> hacemos muy bien."*

Los cuatro motivos reales para decir que no, por orden de frecuencia esperada:

1. **Varias bodegas con traslados entre ellas a diario.** Hay precio por bodega,
   pero el modelo supone que una persona sabe qué hay en la suya.
2. **Integración con su ERP o su contabilidad.** No existe y no está planeado.
   Está escrito en la propia página, en «lo que todavía no hace».
3. **Quieren que lo hospedemos nosotros.** La respuesta es que **ésa es la
   decisión que hace que el producto sea lo que es**, no una limitación — y que
   si necesitan un proveedor que custodie sus datos, no somos nosotros.
4. **Conteo cíclico, trazabilidad por lote o series.** Lo primero no existe; lo
   de lotes está en el backlog sin fecha.

**Y una cosa que SÍ se puede ofrecer en vez del «no»:** que instalen **Acopio
Básico, gratis**, en una sola bodega o en un almacén de obra. No cuesta nada,
no compromete a nadie, y resuelve la conversación: si les sirve, vuelven; si no,
lo sabrán en una semana en vez de en seis meses y sin haber pagado.

### Lo que esto obliga a cambiar fuera de este documento

- **Los Términos** (`legal/TERMS-OF-SERVICE.md`, sección 5) dicen que el soporte
  es «questions about how to use it, by email» **sin número de horas**. Si esta
  política se adopta, el número tiene que estar ahí, porque es lo que el cliente
  acepta. Y entonces hay que mover la fecha del documento, que ya lo vigila
  `sync-legal.js`.
- **La página de soporte** (`docs/SOPORTE-Y-PAGOS.md`) dice lo mismo en lenguaje
  llano y tendría que decirlo también.

**Las dos son decisión de Jose**, porque es su precio y es un documento que el
cliente firma. Aquí está el razonamiento y el número que yo pondría; no lo he
escrito en ninguno de los dos sitios.

---

## Fuentes

- [inFlow — costo de software de inventario 2026](https://www.inflowinventory.com/blog/inventory-management-software-cost/)
- [Brahmin Solutions — $50–$500/mes](https://www.brahmin-solutions.com/blog/what-is-the-average-cost-of-an-inventory-management-system)
- [Unleashed — costo promedio](https://www.unleashedsoftware.com/product/inventory-management-software/average-cost-inventory-management-software/)
- [Zoho Inventory — comparación de precios](https://www.zoho.com/us/inventory/pricing-comparison/)
- [Capterra — Zoho Inventory vs Sortly](https://www.capterra.com/compare/146241-169199/Zoho-Inventory-vs-Sortly-Pro)
- [FounderJar — precios de Sortly](https://www.founderjar.com/sortly-pricing/)
- [Inventory Planner — límites de las hojas de inventario](https://www.inventory-planner.com/inventory-sheets/)
- [Inventory System Solutions — retos de Google Sheets para inventario](https://inventorysystemsolutions.com/challenges-and-best-practices-for-google-sheets-inventory-management-system/)
