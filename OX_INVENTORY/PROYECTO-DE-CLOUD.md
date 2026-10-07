# Qué es el "proyecto de Cloud" de un script, y qué pasa al cambiarlo

Jose, 2026-10-01, después de enlazar la copia DEMO al proyecto ACOPIO:

> *"¿Qué cambió cuando cambié el número del ID del proyecto? Entiendo que le
> asigné otro proyecto al script, pero igual puedo entrar con mis 2 correos.
> ¿Cuál es el beneficio o desventaja de hacerlo? Aparte de lo de los permisos,
> ¿en el proyecto que cambia, qué pasa?"*

## Lo primero: qué es ese proyecto y qué NO es

**Todo script de Apps Script tiene un proyecto de Google Cloud detrás, siempre.**
No es opcional y no es algo que añadimos nosotros: Google crea uno automático,
escondido, para cada script. Nunca lo ves y no puedes configurarlo.

Ese proyecto es **la identidad del script frente a Google**. No guarda datos, no
guarda código y no guarda movimientos. Sirve para tres cosas:

| El proyecto de Cloud decide… | Qué significa en la práctica |
|---|---|
| **Quién pide los permisos** | La pantalla de "esta aplicación quiere acceder a tu Drive": el nombre, el logo y el aviso de "Google no la ha verificado" salen de ahí |
| **Qué APIs puede usar el script** | La Apps Script API, que es la que usa *Push Update Live*, se activa en el proyecto. En el automático **no se puede activar** |
| **Dónde van los registros** | Los errores de Cloud Logging caen en ese proyecto |

**Y NO decide nada de esto** — por eso sigues entrando con tus dos correos:

- Quién puede abrir la hoja de cálculo → eso es **compartir en Drive**.
- Quién puede entrar en la app y con qué rol → eso es la pestaña **USERS_V3**.
- Dónde están los datos → en la hoja, y no se movió ni una celda.
- El código → en el script, intacto.

Cambiar el proyecto **no toca ningún dato y no cambia quién puede entrar.**

## Qué cambió exactamente en tu caso

Hasta ayer la DEMO usaba su proyecto automático (el número `1032307716186` del
mensaje de error). Ahora usa el mismo que la app de verdad: `722866839264`,
el proyecto **ACOPIO**.

### En el proyecto de Cloud

Se creó un cliente de OAuth nuevo. **Está en tu captura**: en
*Credenciales → OAuth 2.0 Client IDs*, la fila que dice **`Apps Script`, creada
el 1 de octubre de 2026**, con el triángulo de aviso y el texto *"This
automatically generated OAuth client ID is required for your project. It can't be
modified."*

Esa fila **es la DEMO**. Es su nueva identidad. Antes vivía en su propio
proyecto; ahora vive en el tuyo.

### En el script

1. **Las autorizaciones viejas dejaron de valer.** Es el único efecto molesto, y
   es el que te está dando *"Request had insufficient authentication scopes"*: tu
   permiso lo concediste al cliente antiguo, y el que manda ahora es otro. Se
   arregla volviendo a autorizar una vez — no es un fallo, es la consecuencia
   normal del cambio.
2. **Los registros de la DEMO caen ahora en el proyecto ACOPIO**, mezclados con
   los de la app de verdad.
3. **La pantalla de permisos de la DEMO es ahora la de Acopio** — la que
   configuraste, con su nombre y su correo de soporte. Antes era una genérica con
   el nombre del script.

## Beneficios de tener un proyecto estándar

Son reales y son la razón por la que la app de verdad lo tiene:

1. **Push Update Live funciona.** Necesita la Apps Script API activada, y eso
   sólo se puede hacer en un proyecto estándar. En el automático no hay dónde
   pulsar.
2. **La pantalla de permisos se puede configurar y verificar.** Es
   **imprescindible para vender**: sin un proyecto estándar verificado, todo el
   que instale la app ve una pantalla gris que dice que Google no ha verificado
   la aplicación. Eso espanta a un cliente que acaba de pagar.
3. **Los registros se pueden consultar de verdad**, con más historia que la
   pantalla de Ejecuciones.

## Desventajas, y son pequeñas

1. **Hay que volver a autorizar** después del cambio. Una vez, por persona.
2. **Compartir proyecto mezcla los registros** de la DEMO con los de la app de
   verdad. Molesto cuando investigas un fallo: tienes dos instalaciones
   escribiendo en el mismo sitio.
3. **Comparten los límites de uso** del proyecto. Para una demo que usas tú solo,
   da igual.
4. **No vi forma de volver atrás.** El botón de tu captura dice *Change project* y
   pide un número de proyecto; no ofrece "volver al automático". No lo doy por
   seguro al cien por cien —no he podido consultar la documentación de Google
   desde donde trabajo— pero sí: **doy por hecho que esto no se deshace**, y por
   eso conviene pensarlo antes, no después.

## Lo que SÍ importa decidir, y no es la DEMO

Para la DEMO da igual: es una copia de pruebas, el cambio no estorba, y el único
precio es volver a dar permiso una vez. **No lo deshagas, no merece la pena.**

**Donde esto sí importa es en la PLANTILLA MAESTRA.** Hay que decidir, antes de
publicarla, si la copia de cada cliente usa:

- **su propio proyecto automático** → cada cliente autoriza su copia, sus
  registros son suyos, no comparte nada contigo. Más simple, y es lo que espera
  alguien que copia una hoja de cálculo.
- **tu proyecto ACOPIO** → la pantalla de permisos es la tuya y verificada (sin
  avisos grises), pero todos los clientes cuelgan de un proyecto tuyo y sus
  registros y sus límites de uso se mezclan.

**Y antes de decidir hay que COMPROBAR una cosa que yo no sé**: si al hacer una
copia de la hoja, el script de la copia se queda enlazado a tu proyecto o si
Google le crea uno automático nuevo. Eso no lo voy a adivinar — se mira en dos
minutos: haces una copia de la DEMO, abres **Extensiones → Apps Script →
⚙️ Configuración del proyecto**, y lees qué pone en *Google Cloud Platform (GCP)
Project*. Lo que diga ahí decide el resto.

Hasta que eso esté comprobado, **la plantilla maestra no sale de una copia
enlazada a tu proyecto.**
