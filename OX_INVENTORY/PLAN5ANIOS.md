# Plan a 5 años — Acopio

> **Esto es un MODELO, no un pronóstico.** Los supuestos están todos
> escritos; cambia uno y cambian todos los números. Sirve para tomar
> decisiones (cuándo contratar, cuándo subir precios, cuándo se topa Google),
> no para creerle a los decimales. Se actualiza con datos de clientes reales
> en cuanto existan.

---

## El hecho económico que define todo el negocio

**Acopio no tiene costo marginal por cliente.** No hay servidores, ni base de
datos, ni almacenamiento: cada cliente corre en su propia cuenta de Google y
paga su propio Google. Un cliente más cuesta ~$0 al mes.

Consecuencias, y son grandes:

- **El margen bruto es de ~95%+.** Prácticamente todo lo que entra es tuyo.
- **No hay que levantar inversión.** Los costos fijos del año 1 caben en menos
  de $2,000.
- **El cuello de botella no es el dinero. Es tu tiempo.** Todo este plan gira
  alrededor de eso, no del efectivo.

Esa es la diferencia estructural con cualquier SaaS: ellos escalan comprando
servidores, tú escalas comprando horas.

---

## Supuestos (cámbialos y recalcula)

| Concepto | Valor | De dónde sale |
|---|---|---|
| Instalación | $400, una vez | `PRECIOS-Y-COMPETENCIA.md` |
| Suscripción | $39/mes = $468/año | Ídem |
| Bajas (churn) | 15%/año | Rango típico de software para PyMEs |
| Tiempo por instalación | 3 h | Llamada previa, instalar, configurar, capacitar, verificar |
| Soporte por cliente | 0.5 h/mes estable (1 h/mes los 3 primeros meses) | Estimado; hay que medirlo con clientes reales |
| Desarrollo | ~20 h/mes constante | Ritmo actual |
| Tu disponibilidad | ~10 h/semana con el empleo actual | Punto de partida |

---

## Escenario B — BASE (el que yo usaría para decidir)

Landing publicada, esfuerzo comercial deliberado, boca a boca funcionando.

| | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|---|---|---|---|---|---|
| Clientes nuevos | 10 | 30 | 65 | 110 | 160 |
| Activos al cierre | 10 | 39 | 98 | 193 | 324 |
| **Ingresos** | **$6,300** | **$23,200** | **$57,800** | **$111,900** | **$185,200** |
| Gastos | $1,650 | $3,750 | $27,750 | $61,750 | $116,750 |
| **Ganancia** | **$4,650** | **$19,500** | **$30,100** | **$50,100** | **$68,500** |
| Tu carga (h/sem) | 6 | 9 | **16** | 28 | 44 |
| Equipo | solo tú | solo tú | +1 medio tiempo | +1 tiempo completo | +2 |

**Lee la fila de horas, no la de ingresos.** Es la que decide.

## Escenario A — CONSERVADOR

Sigues en tu empleo, vendes solo por recomendación, sin marketing.

| | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|---|---|---|---|---|---|
| Clientes nuevos | 5 | 12 | 22 | 32 | 40 |
| Activos al cierre | 5 | 16 | 36 | 63 | 94 |
| **Ingresos** | **$3,200** | **$9,500** | **$21,000** | **$36,200** | **$53,000** |
| Ganancia | $1,500 | $6,700 | $16,800 | $31,000 | $26,800 |
| Tu carga (h/sem) | 3 | 5 | 9 | 13 | 16 |

**Es un escenario perfectamente válido.** ~$50k/año de ingreso secundario sin
dejar tu trabajo, con 16 h/semana. No es fracaso: es una decisión de vida
distinta. Que quede escrito para que sea una elección y no un accidente.

## Escenario C — AGRESIVO

Funciona, las recomendaciones se multiplican, encuentras un nicho (talleres
de vidrio, contratistas).

| | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|---|---|---|---|---|---|
| Clientes nuevos | 15 | 55 | 140 | 280 | 450 |
| Activos al cierre | 15 | 68 | 198 | 448 | 831 |
| **Ingresos** | **$9,500** | **$41,200** | **$118,200** | **$263,200** | **$479,500** |
| Ganancia | $7,400 | $33,200 | $58,200 | $83,200 | $179,500 |
| Tu carga (h/sem) | 9 | **25** | inviable solo | — | — |

**Cuidado con este escenario: se rompe en el año 2, no en el 5.** A 25
h/semana con un empleo de tiempo completo, o dejas el empleo o contratas —
y hay que decidirlo *antes* de firmar el cliente número 40, no después.

---

## Cuándo contratar, y a quién

La carga de soporte crece **lineal con los clientes**; el desarrollo no. Por
eso el primer contratado **no es un programador**.

| Momento | Señal | A quién |
|---|---|---|
| ~15 h/sem sostenidas | Escenario B año 3 · C año 2 | **Medio tiempo: instalaciones y primer nivel de soporte.** ~$20k/año |
| ~30 h/sem | B año 4 | Ese mismo pasa a tiempo completo. ~$45k/año |
| ~50 clientes nuevos/año | B año 5 · C año 3 | Segunda persona, o ventas |
| Nunca temprano | — | Programador. Es lo que TÚ tienes que seguir controlando |

**La decisión más importante del plan cae en el año 3 del escenario B:** a 16
h/semana con un empleo de tiempo completo, algo tiene que ceder. Las opciones
son contratar medio tiempo (~$20k, que a esa altura son ~$30k de ganancia),
dejar el empleo, o frenar las ventas a propósito. Las tres son legítimas; lo
que no es legítimo es llegar ahí sin haberlo pensado.

---

## Los límites de Google — con números, no con miedo

Aquí hay una buena noticia y dos paredes concretas.

**La buena noticia: las cuotas de Apps Script son POR CLIENTE, no compartidas.**
Cada instalación corre en la cuenta del cliente y consume su propia cuota
(correos, ejecuciones, tiempo). Mil clientes no se estorban entre sí. Esto
elimina de un plumazo el problema de escala que tendría cualquier SaaS
normal.

### Pared 1 — 100 redirect URIs por cliente OAuth ⚠️

Verificado: **el límite son 100 URIs de redirección por cliente OAuth.** Solo
las consumen los clientes que necesitan login externo (gente fuera del
dominio de la empresa). Si asumimos que la mitad lo necesita:

| Escenario | Se llena el primer cliente OAuth |
|---|---|
| A (conservador) | No se llega en 5 años |
| B (base) | **Año 4** (~97 URIs) |
| C (agresivo) | **Año 3**, y el segundo en el año 4 |

**No es una pared real, es administrativa:** se crean más clientes OAuth. Tu
instinto de separar uno para OX, uno para pruebas y uno para clientes era
correcto, y ahora tiene un número detrás. Lo único que hay que hacer bien es
**llevar registro de qué cliente OAuth usa cada instalación** — si no, un día
no sabrás dónde registrar la URL de alguien.

### Pared 2 — el modo "Testing" del consentimiento ⚠️ REVISAR YA

Un cliente OAuth en modo **Testing** tiene dos límites brutales: **máximo 100
usuarios** y, mucho peor, **las autorizaciones caducan a los 7 días**. Eso
significaría que cada usuario externo tiene que volver a autorizar cada
semana.

Acopio solo pide scopes básicos (`email`, `profile`), y esos **se pueden
publicar en Producción sin verificación de Google**.

**Acción inmediata, antes de cualquier cliente externo:** en Cloud Console,
OAuth consent screen, confirmar que el estado es **"In production"** y no
"Testing". Si está en Testing, el login externo está con reloj de 7 días
ahora mismo.

---

## Cuándo mover el precio

**Subir a $49–$59/mes** cuando existan **códigos de barras** y **conteo
cíclico**. Ahí el producto compite de frente con Sortly Advanced y el precio
es defendible sin discurso. Momento probable: escenario B año 3.

**Subir solo para clientes nuevos.** Los existentes conservan su precio para
siempre. Cuesta poco y compra lealtad y recomendaciones — que en este negocio
son el canal principal.

**Segunda subida** cuando haya 100 clientes activos y las recomendaciones
lleguen solas: ya no vendes software, vendes algo probado.

**No bajarlo.** En este rango, una venta que no cierra casi nunca es por
precio: o falta una función del cuadro de "dónde perdemos", o el cliente no
tenía el problema. La única excepción sana: descuento a los primeros 2–3 a
cambio de permiso para usar su nombre y sus números. Eso no es rebajar, es
comprar material de venta.

---

## Cuándo lanzar actualizaciones

**Bugs: de inmediato y a todos.** Ya está decidido en `BACKLOG.md`.

**Mejoras: por tandas, cada 6–8 semanas.** Tres razones:
1. Cada actualización cuesta tiempo tuyo **por cliente** (hay que pegar tres
   archivos y volver a publicar). Con 50 clientes eso es un día de trabajo.
2. Una tanda con cinco mejoras se comunica; cinco actualizaciones sueltas
   solo molestan.
3. Le da a la página de novedades algo que contar — que es la mitad del
   argumento del soporte mensual.

**Aquí hay un problema que va a doler y conviene ver venir:** actualizar es
manual, cliente por cliente. A 20 clientes es una tarde. A 100 es insostenible
y va a ser el verdadero freno del crecimiento, antes que las ventas. Vale la
pena pensar la solución (¿librería de Apps Script? ¿el Marketplace?) **en el
año 2, no en el 4**.

---

## Los tres riesgos reales

1. **Tu tiempo, no el dinero.** Todos los escenarios son rentables desde el
   año 1. Ninguno es sostenible si no decides a tiempo qué hacer con las
   horas. La fila de h/semana es la que hay que mirar cada trimestre.
2. **La actualización manual por cliente.** El freno de crecimiento más
   probable, y no aparece en ninguna proyección de ingresos.
3. **Que Google cambie algo.** Todo el producto vive sobre Apps Script. No
   hay plan B, y no lo va a haber sin reescribir el producto. Es el riesgo que
   se acepta a cambio de tener margen del 95% y cero infraestructura — pero
   hay que aceptarlo con los ojos abiertos, no por olvido.

---

## Los primeros 90 días

| Semanas | Qué |
|---|---|
| 1–2 | Verificar "In production" en el consent screen · restaurar un backup de prueba · plantilla maestra limpia |
| 3–4 | Dominio + landing con las secciones de `LANDING.md` · publicar Privacidad y Términos |
| 5–8 | **Tres clientes piloto con descuento a cambio de caso de estudio.** Instalarlos tú, cronometrar cuánto tarda de verdad, anotar cada pregunta |
| 9–12 | Corregir lo que los pilotos revelen · página de novedades · precio completo al cuarto cliente |

**Lo más valioso de los primeros 90 días no son los ingresos: son los números
reales** — cuánto tarda una instalación de verdad, cuánto soporte pide un
cliente de verdad, y qué es lo primero que preguntan. Los tres supuestos que
sostienen todo este modelo, medidos en vez de estimados.

---

## Fuentes

- [Google Cloud — límite de redirect URIs por cliente OAuth](https://support.google.com/cloud/answer/15549257?hl=en)
- [Google Cloud — administrar la audiencia de la app (cap de 100 usuarios en Testing)](https://support.google.com/cloud/answer/15549945?hl=en)
- [Google Cloud — cuándo NO hace falta verificación](https://support.google.com/cloud/answer/13464323?hl=en)
- Precios de mercado: ver `PRECIOS-Y-COMPETENCIA.md`
