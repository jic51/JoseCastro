# Proteger el código — las tres opciones, verificadas

Jose recibió de otra fuente tres estrategias (Marketplace, "lógica separada"
con una Librería, y ofuscación) y pidió investigarlas. Este documento las
revisa contra la documentación real de Google y contra cómo está construida
Acopio.

**Resumen: una de las tres funciona, una está descrita con un error de hecho
importante, y la tercera cuesta más de lo que parece.**

---

## Opción 1 — Publicar como Add-on en Google Workspace Marketplace

**Veredicto: es la única que de verdad esconde el código. Y es cara.**

Es correcto lo que dice la fuente: el código vive en el proyecto del
desarrollador, el cliente instala desde la tienda, y **nunca ve el fuente**.
También es correcto que los datos siguen en el Sheet del cliente.

Lo que la fuente no menciona y sí importa:

- **Proceso de verificación de Google.** Publicar en el Marketplace exige
  revisión. Los scopes que usa Acopio incluyen `drive` (amplio), y eso
  clasifica como *sensitive* o *restricted* — lo que dispara verificación, y
  en el caso de *restricted* una **auditoría de seguridad CASA pagada
  (~$500–$4,500 al año, renovable)**. Esto ya está anotado en `BACKLOG.md`
  como la razón por la que el add-on de Gmail se dejó fuera del producto base.
- **Cambia el modelo de distribución.** Se acaba el "te mando el link de la
  plantilla". Cada actualización pasa por revisión de Google.
- **Resuelve de paso otro problema grande:** el registro manual de redirect
  URIs (~5 min por cliente) desaparecería. Esa es una razón fuerte y separada
  para hacerlo.

**Cuándo tiene sentido: con volumen.** Es la inversión correcta cuando el
onboarding manual sea el freno del negocio — según el plan a 5 años, entre el
año 2 y el 3 del escenario base. Hoy no.

---

## Opción 2 — "Lógica separada" con una Librería de Apps Script

**Veredicto: NO recomendada. La descripción que te dieron tiene un error de
hecho que invalida el argumento principal.**

### ❌ El error: la Librería NO esconde tu código

La fuente afirma: *"El cliente solo puede ver la línea de conexión, pero el
código fuente real está bloqueado en tu cuenta"*.

**Eso es falso.** La documentación de Google es explícita: **para incluir una
Librería en tu proyecto necesitas al menos acceso de LECTURA (view) sobre
ella.** Es decir: para que el sistema del cliente pueda usar tu librería,
tienes que darle acceso de lectura — y con acceso de lectura **puede abrir tu
proyecto y leer todo el código fuente**.

No es un descuido de configuración que se pueda evitar: es un requisito para
que la librería funcione. La única forma de esconder algo dentro de una
librería es terminar el nombre de una función en `_` (privadas por
convención), y eso solo la hace no invocable desde fuera — **no la oculta a
la vista**.

O sea: el beneficio central que promete esta opción, no existe.

### ⚠️ Y el costo sí es real: latencia en CADA llamada

Google lo documenta en sus propias buenas prácticas: **las librerías
aumentan el tiempo de arranque del script**, y el efecto es peor
justamente en *"interfaces de HTML Service que hacen llamadas repetidas y
cortas con `google.script.run`"*.

Eso **es exactamente Acopio**. Cada movimiento guardado, cada carga de stock,
cada búsqueda es un `google.script.run`. Poner la lógica en una librería
metería un peaje de arranque en cada una de esas llamadas — y el problema
número uno que Jose ya reportó del producto es que las cosas se sienten
lentas por el viaje de ida y vuelta a Apps Script. Esto lo empeoraría de
forma medible.

### ⚠️ El "interruptor de apagado" es un arma que apunta a los dos lados

La fuente lo vende como ventaja: *"si el cliente deja de pagar, le quitas el
acceso y su sistema deja de funcionar"*. Cuidado:

- **Si tu cuenta de Google tiene un problema, se caen TODOS los clientes a la
  vez.** Hoy, si tu cuenta desaparece, los clientes siguen operando con lo que
  tienen. Con librería, no.
- **Apagarle la bodega a alguien es un evento de reputación**, no una gestión
  de cobranza. Un cliente que se queda sin poder registrar salidas un martes a
  las 10am cuenta esa historia a todo el gremio.
- Contradice el argumento de venta más fuerte que tienes, que está escrito en
  tu propia Política de Privacidad: *"si dejas de pagarnos, tu sistema sigue
  funcionando"*. No puedes vender eso y construir lo contrario.

### Conclusión

Da un beneficio que **no existe** (ocultar el código), a cambio de un costo
**real y medible** (latencia en cada llamada) y un riesgo estructural nuevo
(punto único de falla). No.

---

## Opción 3 — Ofuscación

**Veredicto: técnicamente posible, con un costo que cae justo donde más
duele. No ahora.**

La idea es correcta: pasar el código por un ofuscador antes de entregarlo
convierte el fuente legible en un laberinto. Funcionaría igual.

Los problemas, en orden de gravedad para ESTE producto:

1. **Mata el soporte, que es lo que estás vendiendo.** Hoy, cuando algo
   falla, `ERROR_LOG` guarda el nombre de la función y la línea, y Jose abre
   el archivo y lo lee. Con el código ofuscado, el log dice `_0x4a2b`, y el
   diagnóstico pasa de minutos a horas. **Eres una operación de soporte de una
   persona** — es exactamente el recurso que no puedes gastar.
2. **Hay nombres que NO se pueden ofuscar**, y son muchos. Apps Script exige
   nombres globales exactos: `doGet`, `onOpen`, `dailyBackupTrigger`, y
   **cada función que el frontend llama por nombre** vía
   `google.script.run.processMovement(...)`, `.getInitialData(...)`, etc. Todas
   tendrían que quedar en una lista de exclusión, mantenida a mano, que se
   rompe en silencio cada vez que se agrega un endpoint.
3. **Se revierte.** Un ofuscador no encripta: reorganiza. Cualquiera con
   ganas lo pasa por un deobfuscator y un formateador. Sube el esfuerzo del
   copión de "copiar y pegar" a "una tarde de trabajo". No lo detiene.
4. **Agrega un paso frágil al despliegue.** Hoy actualizar es pegar tres
   archivos. Con ofuscación es compilar, ofuscar, verificar que nada se rompió,
   y recién entonces pegar — en cada cliente, cada vez.

**Cuándo reconsiderarla:** si aparece evidencia real de que alguien está
copiando y revendiendo el producto. Antes de eso, se paga un costo cierto por
un riesgo hipotético.

---

## Lo que sí recomiendo hacer

1. **Marca de origen (watermark) — barato y útil.** Un identificador único por
   instalación, generado en el primer arranque y guardado en Script
   Properties. No impide copiar; **permite demostrar** de dónde salió una
   copia. Media pieza ya existe (`APP_VERSION`, `PRODUCT_NAME`).
2. **Aviso de copyright y Términos de Servicio.** Ya existen en `legal/`. Para
   este modelo de negocio, esta es la protección real: no es técnica, es
   legal.
3. **Marketplace, cuando haya volumen.** Es la única solución técnica de
   verdad, y además resuelve el onboarding manual. Es una decisión del año
   2–3, no de hoy.

Y el punto que sigue siendo más importante que los tres: **lo que vendes no es
el código, es el servicio.** Quien copie el archivo se queda con una foto
congelada — sin arreglos, sin mejoras, sin nadie que le conteste. Esa es hoy
tu mejor protección y no cuesta construirla.

---

## Fuentes

- [Apps Script — Best Practices (penalización de las librerías)](https://developers.google.com/apps-script/guides/support/best-practices)
- [Apps Script — Managing libraries (se requiere acceso de lectura)](https://developers.google.com/apps-script/managing_libraries)
- [Google Workspace Add-ons — buenas prácticas](https://developers.google.com/apps-script/add-ons/guides/editor-best-practices)
- [Google Workspace Marketplace](https://workspace.google.com/marketplace)
- Costo de la auditoría CASA y el motivo de dejar Gmail fuera: ver
  `Code_v3_fixed.gs`, sección "PAID ADD-ON: GMAIL DELIVERY SCANNER"
