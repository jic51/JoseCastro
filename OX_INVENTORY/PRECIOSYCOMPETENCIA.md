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

## Precio recomendado

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

## Fuentes

- [inFlow — costo de software de inventario 2026](https://www.inflowinventory.com/blog/inventory-management-software-cost/)
- [Brahmin Solutions — $50–$500/mes](https://www.brahmin-solutions.com/blog/what-is-the-average-cost-of-an-inventory-management-system)
- [Unleashed — costo promedio](https://www.unleashedsoftware.com/product/inventory-management-software/average-cost-inventory-management-software/)
- [Zoho Inventory — comparación de precios](https://www.zoho.com/us/inventory/pricing-comparison/)
- [Capterra — Zoho Inventory vs Sortly](https://www.capterra.com/compare/146241-169199/Zoho-Inventory-vs-Sortly-Pro)
- [FounderJar — precios de Sortly](https://www.founderjar.com/sortly-pricing/)
- [Inventory Planner — límites de las hojas de inventario](https://www.inventory-planner.com/inventory-sheets/)
- [Inventory System Solutions — retos de Google Sheets para inventario](https://inventorysystemsolutions.com/challenges-and-best-practices-for-google-sheets-inventory-management-system/)
