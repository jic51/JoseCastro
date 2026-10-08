# De cero a un cliente funcionando — el mapa completo

Jose, 2026-10-07: *"todo se me está complicando en la mente, dame un respiro y
luego empezamos paso a paso… exactamente de dónde salen y dónde van y en qué
orden."*

Este documento es **el mapa**, no los pasos. Los pasos del cliente ya están en
`INSTALL-GUIDE.md` (español) y `CUSTOMER-SETUP.md` (inglés) y no se repiten
aquí. Lo que faltaba era **esto**: cuántas piezas hay, cuáles son obligatorias,
y cuál es cuál.

---

# EL RESPIRO: SON CUATRO PIEZAS Y SÓLO UNA ES OBLIGATORIA

Esto es lo que se ha estado complicando, y la razón es que las cuatro se
mezclaron en una sola conversación:

| | Pieza | ¿Obligatoria? | Sin ella… |
|---|---|---|---|
| **A** | **La hoja + el script** | **SÍ** | no hay app |
| **B** | Un **proyecto de Cloud estándar** | **No** | todo funciona; falta el botón de publicar y sale la pantalla gris de permisos |
| **C** | Un **cliente de OAuth** | **No** | entra tu dominio; no entra alguien de fuera |
| **D** | Una **clave de Gemini** | **No** | se teclea a mano, como siempre |

> **Un cliente puede instalar Acopio y trabajar con él usando SÓLO la pieza A.**
> OX Glass lleva meses funcionando así. B, C y D son comodidades, cada una
> independiente, y **ninguna bloquea a las otras.**

Si algo de B, C o D se atasca: **déjalo y sigue.** No rompe nada.

---

# LAS CUATRO PIEZAS, UNA POR UNA

## A. La hoja y el script — OBLIGATORIA

**Qué es:** el archivo de Google Sheets con el código dentro. Es la app.

**De dónde sale:** de copiar la plantilla.
**Dónde va:** al Drive del cliente, en su cuenta.

**Qué pasa al copiar, y es lo que hay que recordar:**

- **Los datos SÍ se copian** (las pestañas, las filas).
- **Las Script Properties NO se copian.** Son los ajustes del script: el nombre
  de la empresa, el logo, la dirección de la app, la clave de Gemini, el cliente
  de OAuth. **Todo eso llega en blanco a la copia, y es correcto** — son del
  cliente, no nuestros. El asistente los vuelve a pedir.
- **Los archivos de Drive NO se copian.** Las fotos y documentos siguen en la
  carpeta del original. Por eso una copia con filas que llevan adjuntos apunta
  a archivos que están en otro sitio.

**Pasos:** `INSTALL-GUIDE.md`.

---

## B. El proyecto de Google Cloud — opcional, y es la que te tiene atascado

**Qué es:** la identidad del script frente a Google. No guarda datos ni código.

**Todo script tiene uno, siempre.** Si no eliges, Google crea uno **automático y
escondido** — es lo que dice `Predeterminada` en Configuración del proyecto, y
es donde está OX Glass hoy (`1038407497181`).

**Para qué sirve tener uno estándar — sólo dos cosas:**

1. El botón **Push Update Live** del menú funciona (necesita la Apps Script API,
   que en el automático **no se puede encender**).
2. La pantalla de permisos se puede **configurar y verificar**, así que el
   cliente no ve el aviso gris de *"Google no ha verificado esta aplicación"*.

**Para qué NO sirve** — y esto es lo que más confusión causó:

- ❌ No decide quién puede entrar en la app. Eso es `USERS_V3`.
- ❌ No decide quién abre la hoja. Eso es compartir en Drive.
- ❌ No guarda ningún dato.
- ❌ **No tiene nada que ver con la clave de Gemini.** Son dos proyectos
  distintos que no se hablan.

**De dónde sale:** `console.cloud.google.com` → *Nuevo proyecto*.
**Dónde va:** Apps Script → ⚙️ Configuración del proyecto → *Cambiar proyecto* →
se pega el **número** del proyecto.

> ⚠️ **Dos avisos antes de tocar esto:**
> 1. **Al cambiarlo, las autorizaciones viejas dejan de valer.** Hay que volver
>    a autorizar **una vez**, y sólo el **dueño** de la copia — bajo *Ejecutar
>    como: Yo*, nadie más autoriza nada nunca. El resto de la gente abre una
>    dirección y entra.
> 2. **Probablemente no se deshace.** El botón pide un número y no ofrece
>    "volver al automático".

### ¿De quién debe ser ese proyecto?

| Opción | Consecuencia |
|---|---|
| **Del cliente** | Su identidad es suya, sus registros son suyos. Lo limpio |
| **Tuyo (ACOPIO)** | Ven tu pantalla verificada, pero todos los clientes cuelgan de un proyecto tuyo y mezclan registros y límites |

**Para OX Glass recomiendo el de OX Glass.** OX Glass es un cliente de Acopio,
aunque seas tú quien lo opera, y el día que alguien pregunte "¿esto de quién
depende?" la respuesta debe ser "de OX Glass".

---

## C. El cliente de OAuth — opcional, y casi nunca hace falta

**Qué es:** lo que permite entrar a alguien **de fuera del dominio del cliente**.

- Cliente con dominio `@empresa.com` y toda su gente en ese dominio → **no hace
  falta nada.**
- Alguien de fuera (un contratista con Gmail personal) → **entonces sí.**

**De dónde sale:** Cloud Console → *Credenciales* → *Crear credenciales* → *ID de
cliente de OAuth* → **Aplicación web**.
**Dónde va:** Script Properties → `OAUTH_CLIENT_ID` y `OAUTH_CLIENT_SECRET`.

En el proyecto ACOPIO hay tres creados por ti: `Acopio — OX GLASS`,
`Acopio - Production` y `ACOPIO -CLIENTE`. Ésos son de esta pieza.

### El cuarto, el que tiene ⚠️ y no se puede abrir

El que dice **`Apps Script`, creado el 1 de octubre de 2026**, con triángulo de
aviso y **sin lápiz para editar**, es otra cosa completamente distinta:

> **Lo creó Google solo**, el día que enlazaste la DEMO a este proyecto. **Es la
> identidad de la DEMO.** Google dice de él: *"This automatically generated OAuth
> client ID is required for your project. It can't be modified."*

- **¿Funciona?** Sí. Es el que la DEMO está usando ahora mismo.
- **¿Se puede borrar?** **NO.** Borrarlo rompe la autorización de la DEMO.
- **¿Por qué no se puede abrir?** Porque no es tuyo para editarlo. Es de Google.

**Déjalo en paz.** Es señal de que el enlace del 1 de octubre funcionó.

---

## D. La clave de Gemini — opcional, y la más independiente de todas

**Qué es:** la que deja leer un correo o una foto de factura y rellenar la
entrega esperada. **Nada más.** Sin ella la app funciona entera.

**De dónde sale:** `aistudio.google.com` → *Get API key*.
**Dónde va:** dentro de la app, ⚙️ Settings → System → AI. **Nunca** en el
código, **nunca** en la hoja.

**Vive en un proyecto de Cloud propio, que NO es el del script.** Por eso en la
captura del proyecto ACOPIO dice *"No API keys to display"*: la clave de Gemini
no está ahí y **no tiene por qué estarlo**.

Lo que la hace funcionar, en `CLAVE-DE-GEMINI.md`. Resumen: la clave, la
*Generative Language API* encendida, y —si la cuenta es de empresa— **el permiso
de Workspace**.

---

# LO QUE NO HACE FALTA NUNCA

Para quitarlo de la cabeza:

| | Por qué no |
|---|---|
| ❌ **Cuentas de servicio** (*Service Accounts*) | Son un "usuario robot" para programas que corren sin persona detrás. **Acopio no usa ninguna**: corre con el permiso del dueño de la copia. Por eso tu lista está vacía, y está bien así |
| ❌ **Claves de API en el proyecto del script** | La única clave de Acopio es la de Gemini, y vive en otro sitio |
| ❌ **Facturación en el proyecto del script** | Nada de lo que Acopio usa la necesita |
| ❌ **Verificar la pantalla de permisos** para empezar | Sólo hace falta para que un cliente no vea el aviso gris. No bloquea nada |

---

# EL ORDEN, PARA UN CLIENTE NUEVO

**Lo imprescindible (pieza A) — 20 minutos, y aquí ya trabaja:**

1. El cliente copia la plantilla a su Drive.
2. Abre la hoja → menú 🏭 Acopio → **Set Up Acopio**. Nombre, logo, carpetas.
3. `Extensiones → Apps Script → Deploy → New deployment → Web app`
   (*Ejecutar como: Yo* · *Acceso: cualquiera con cuenta de Google*).
4. Autoriza. **Aquí sale la pantalla gris** si no hay proyecto verificado —
   `CUSTOMER-SETUP.md` explica cómo pasarla.
5. Pega la dirección `/exec` en el asistente.
6. Da de alta a su gente en ⚙️ Settings → Permissions.

**→ A partir de aquí el almacén funciona. Todo lo de abajo es opcional y se
puede dejar para otro día.**

**Después, sólo si hace falta:**

7. **(D)** Clave de Gemini, si quiere el lector de documentos.
8. **(C)** Cliente de OAuth, **sólo si** entra gente de fuera de su dominio.
9. **(B)** Proyecto de Cloud estándar, si quieres el botón de publicar o quitar
   la pantalla gris.

---

# DÓNDE ESTÁ OX GLASS HOY

| Pieza | Estado |
|---|---|
| **A** La hoja y el script | ✅ funcionando desde hace meses |
| **B** Proyecto de Cloud | ❌ **`Predeterminada`** (`1038407497181`). Por eso el botón de publicar da error — y por eso **no es un fallo** |
| **C** Cliente de OAuth | ✅ hay tres creados en el proyecto ACOPIO |
| **D** Clave de Gemini | ⚠️ atascada — ver `CLAVE-DE-GEMINI.md` |

**El siguiente paso que recomiendo, y sólo uno:** crear **un** proyecto de Cloud
dentro de la cuenta de OX Glass. Sirve para B, y es donde debe vivir la clave de
Gemini de OX Glass. **Un proyecto resuelve las dos cosas.**

Pero **no hay prisa**: mientras tanto se publica con `Extensiones → Apps Script →
Deploy → Manage deployments → ✏️ → New version → Deploy`, que es el mismo camino
que va a usar cada cliente.

---

# LAS APIS QUE HAY QUE ENCENDER EN UN PROYECTO NUEVO

Jose, 07/10: *"al pasar el script del proyecto demo al proyecto ACOPIO ya no
sirve el .json porque me dice que hay cosas que no están permitidas… dame el
nombre de las APIs para buscarlas."*

**Por qué pasa:** con el proyecto **automático**, Apps Script enciende solo lo
que el script pide. Con un proyecto **estándar**, no: hay que encenderlo a mano,
porque el proyecto es tuyo y Google no toca lo que es tuyo.

**Dónde:** Cloud Console → **APIs y servicios** → **Biblioteca** → buscar →
*Habilitar*. O directo:
`console.cloud.google.com/apis/library?project=NÚMERO`

**Los nombres exactos, que es lo que faltaba.** Hay que buscarlos **en inglés**
aunque la consola esté en español — la Biblioteca no traduce los nombres:

| Buscar EXACTAMENTE | Para qué, en Acopio |
|---|---|
| **Google Drive API** | fotos, documentos, respaldos, carpetas |
| **Google Sheets API** | la hoja entera |
| **Google Docs API** | los documentos que genera |
| **Apps Script API** | **sólo** para el botón *Push Update Live* |
| **Generative Language API** | **sólo** si la clave de Gemini vive en este proyecto |

**Cuidado con los parecidos, que es donde se pierde la gente:** buscando "drive"
salen también *Drive Activity API*, *Drive Labels API* y *Google Drive Lite* —
**ninguna** de ésas sirve. La buena se llama exactamente **Google Drive API**.

Lo que **NO** hay que encender (son servicios internos de Apps Script y no tienen
API que habilitar): enviar correo, `UrlFetchApp`, los disparadores, y los
diálogos dentro de la hoja.

**Después de encender una API, espera unos minutos** y vuelve a autorizar el
script una vez.

---

# LAS DOS PANTALLAS DE PERMISOS — y por qué esto decide el negocio

Esto es lo que faltaba en la primera versión de este documento, y cambia la
recomendación. **Hay DOS consentimientos distintos y no tienen el mismo riesgo
ni el mismo coste:**

## Pantalla 1 — la autorización del script

La que pide Drive, Sheets, Docs. **Drive es un permiso RESTRINGIDO** por
Google, de los que más vigila.

**Pero la ve UNA sola persona: el dueño de la copia, una vez.** Bajo *Ejecutar
como: Yo*, **nadie más autoriza nada nunca** — el resto de la gente abre una
dirección y entra.

## Pantalla 2 — la de iniciar sesión (el cliente de OAuth, pieza C)

Ésa pide **sólo `openid email profile`**: quién eres, tu correo y tu nombre.
**No son permisos sensibles ni restringidos.** Son los tres más básicos que
existen. Comprobado en el código (`_startGoogleLogin`).

**Esa es la que ve cada trabajador que no está en el dominio.**

## Y aquí está lo que vale dinero

| El proyecto del cliente está en… | Qué pasa con la pantalla 1 |
|---|---|
| **Interno** (*Internal*) — el cliente tiene Workspace y su gente está en su dominio | **Sin pantalla gris. Sin revisión de Google. Sin tope de usuarios. Gratis.** Los permisos restringidos **no necesitan revisión** en una app interna |
| **Externo** (*External*) — hace falta meter a gente de fuera, o el cliente no tiene Workspace | Pantalla gris de "Google no ha verificado". Y si alguna vez se quisiera quitar, Google exige una **evaluación de seguridad anual de pago** (CASA), porque Drive es permiso restringido |

> ## ⚠️ La consecuencia, y es la decisión más cara del producto
>
> **Si todos los clientes colgaran de NUESTRO proyecto ACOPIO**, sería un
> proyecto **Externo** con permiso restringido → **evaluación de seguridad
> anual de pago, para siempre.**
>
> **Si cada cliente tiene SU proyecto en SU Workspace, en modo Interno** → la
> pantalla gris desaparece, **sin revisión y sin pagar nada.**
>
> **Es el mismo camino que ya recomendábamos por limpieza, y ahora resulta que
> además es el único gratis.**

**Un aviso de ida y vuelta:** se puede pasar de Interno a Externo, pero **no se
vuelve** una vez que alguien ha autorizado. Así que si el cliente tiene
Workspace, **se empieza en Interno.**

---

# ¿QUÉ NOS CUESTA A NOSOTROS? — nada, y por eso escala

La pregunta de Jose: *"¿esto gasta algo nuestro? ¿al tener más clientes se hace
más pesado o lento o caro para nosotros? ¿se puede escalar?"*

**No gasta nada nuestro, y la razón es que no compartimos nada:**

| Pieza | De quién es | Quién paga |
|---|---|---|
| La hoja y el script | del cliente, en su Drive | su cuota de Google, que ya tiene |
| El proyecto de Cloud | **del cliente** | gratis (nada de lo que usamos se cobra) |
| El cliente de OAuth | **del cliente**, en su proyecto | gratis |
| La clave de Gemini | **del cliente** | su cuota gratuita, o su tarjeta si se pasa |

**Cien clientes no son más lentos que uno**, porque no hay nada en medio: cada
instalación corre en la cuenta de su dueño, con sus propios límites. No hay
servidor nuestro, no hay base de datos nuestra, no hay factura que crezca.

**Lo único que NO escala es nuestro tiempo**, y es exactamente por eso que estos
documentos valen lo que valen.

**Y la regla que se deriva de todo esto, que conviene no romper nunca:**

> **Nunca poner una clave nuestra en la instalación de un cliente.**
> Ni la de Gemini, ni un cliente de OAuth, ni nada. En el momento en que una
> credencial nuestra vive en la copia de un cliente, su consumo es nuestro
> consumo, su tope es nuestro tope, y el día que uno abusa se cae para todos.
