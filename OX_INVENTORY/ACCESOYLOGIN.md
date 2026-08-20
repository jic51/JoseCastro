# Acceso y login — cómo entra la gente a Acopio

Guía de referencia para instalar y para diagnosticar cuando alguien no puede
entrar. Todo lo de aquí está verificado contra el código real
(`getUserRole()`, `oauthCfg_()`, `redirectUri_()`, `handleOAuthCallback_()`),
no es de memoria.

---

## Lo único que hay que entender: son DOS puertas, no una

Cuando alguien abre la app, pasa por dos revisiones distintas. Casi todos los
problemas de "no puedo entrar" se resuelven rápido si primero identificas
**cuál de las dos** falló.

### Puerta 1 — ¿Quién eres? (identificación)

Acopio necesita saber, con certeza, cuál es tu correo. Hay exactamente dos
formas de averiguarlo:

| Forma | Para quién funciona | Necesita configuración |
|---|---|---|
| **Automática** (`Session.getActiveUser()`) | Gente del **mismo dominio de Workspace que el dueño de la copia**, y el dueño mismo | Ninguna |
| **Sign in with Google** (OAuth) | Todos los demás: Gmail personal, contratistas, otro dominio | **Sí** — cliente OAuth en Cloud Console |

Si ninguna de las dos da un correo → el usuario ve la pantalla de
**"Sign in with your Google account"**.

> **La regla que casi nadie espera:** la forma automática funciona por la
> relación real de Workspace entre el visitante y el **dueño del archivo
> copiado**. No tiene nada que ver con la propiedad `COMPANY_DOMAIN` — esa
> solo se usa para el texto de la pantalla de login.

### Puerta 2 — ¿Estás en la lista? (autorización)

Ya con el correo confirmado, se busca en la hoja `USERS_V3` (columna B), y
la fila tiene que estar **activa** (columna G). Si el correo no está ahí, o
está inactivo → el usuario ve **"DENIED"**, no la pantalla de login.

**Esta distinción es el diagnóstico más rápido que existe:**

- Ve la pantalla de **"Sign in with Google"** → falló la Puerta 1
- Ve **"acceso denegado"** con su correo en pantalla → pasó la Puerta 1,
  falló la Puerta 2 (o sea: el login funciona bien, solo falta darlo de alta)

---

## Escenario A — Empresa CON su propio dominio de Workspace

Ejemplo: OX Glass (`@ox-glass.com`), donde además hay gente de afuera con
Gmail personal.

### Al instalar

1. **La copia la tiene que hacer una cuenta del dominio de la empresa.**
   Esto es lo más importante de todo y no se puede corregir después sin
   volver a copiar. Si alguien hace la copia con un Gmail personal, **nadie
   del dominio queda reconocido automáticamente** — ni siquiera los que sí
   tienen cuenta de empresa. Todos tendrían que pasar por OAuth.
2. Sigue la instalación normal (ver `INSTALL-GUIDE.md`).
3. Da de alta a **todo el mundo** en `USERS_V3`, con su rol — tanto la gente
   del dominio como los de afuera. Estar en el dominio te identifica; **no**
   te autoriza. Son las dos puertas.
4. **Solo si hay gente de afuera:** configura el cliente OAuth (ver abajo).
   Si toda la empresa está en el dominio, este paso no existe y no hace falta
   tocar Cloud Console nunca.

### Cómo entra cada quien, ya instalado

- **Personal del dominio** (`@ox-glass.com`): abre el link y entra. Sin
  botones, sin pantalla de login. Si ve la pantalla de login, casi siempre es
  que el navegador está en **otra** cuenta de Google (ver "Problema 3").
- **Gente de afuera** (Gmail personal, contratistas): ve la pantalla de
  login, da clic en **"Sign in with Google"**, se abre un popup, autoriza, el
  popup se cierra solo y entra. Solo la primera vez; después queda un token
  guardado en su navegador.

---

## Escenario B — Empresa SIN dominio (todos con Gmail personal)

### Al instalar

1. La copia la hace quien vaya a ser el administrador. **Esa persona queda
   identificada automáticamente por ser la dueña del archivo** — es la única.
2. **El cliente OAuth NO es opcional aquí, es obligatorio.** Todos los demás
   —absolutamente todos— dependen de él para poder identificarse. Sin OAuth
   configurado, el sistema queda usable por una sola persona.
3. Da de alta a todos en `USERS_V3` igual que en el escenario A.

### Cómo entra cada quien

- **El dueño de la copia**: automático, como el personal del dominio en A.
- **Todos los demás**: pantalla de login → "Sign in with Google" → popup →
  entra. Cada uno una sola vez.

---

## Configurar el cliente OAuth (el único paso en Cloud Console)

Solo hace falta cuando hay gente que NO está en el dominio del dueño. Se hace
una vez por cliente.

1. En **Google Cloud Console** → APIs & Services → **Credentials** →
   *Create credentials* → **OAuth client ID** → tipo **Web application**.
2. En **Authorized redirect URIs**, agrega la URL `/exec` de la app,
   **exacta, completa, terminando en `/exec`**.
3. Copia el **Client ID** y el **Client Secret**.
4. En el editor de Apps Script del cliente → ⚙️ **Project Settings** →
   **Script Properties**, pon los tres valores:

| Propiedad | Qué es |
|---|---|
| `OAUTH_CLIENT_ID` | El Client ID de Cloud Console |
| `OAUTH_CLIENT_SECRET` | El Client Secret de Cloud Console |
| `OAUTH_REDIRECT_URI` | La URL `/exec` — **idéntica, carácter por carácter**, a la registrada en el paso 2 |

5. Espera unos minutos. Cloud Console lo advierte él mismo: *"It may take 5
   minutes to a few hours for settings to take effect."* Si el primer intento
   falla, **espera antes de cambiar nada más**.

> **Por qué `OAUTH_REDIRECT_URI` es una propiedad y no se calcula sola:** la
> app se sirve en dos formas de URL distintas (`/macros/s/...` para cuentas
> normales, `/a/macros/dominio.com/s/...` para cuentas de Workspace).
> Adivinarla daría una u otra según quién abra la app, y Google exige que
> coincida **exactamente** con la registrada. Guardarla fija es lo que evita
> ese problema (ver el comentario en `redirectUri_()`, `Code_v3_fixed.gs`).

---

## ⚠️ La trampa número uno: republicar cambia la URL

**Cada vez que haces *Deploy → New deployment*, Google genera un ID de
despliegue nuevo (`AKfycb...`) y por lo tanto una URL `/exec` nueva.** Esa
URL nueva no está registrada en Cloud Console, así que el login externo se
rompe al instante — con el error `redirect_uri_mismatch`.

**Para publicar una versión nueva SIN romper nada:**

> Deploy → **Manage deployments** → **✏️ (lápiz)** en el despliegue que ya
> existe → *Version: **New version*** → Deploy

Eso mantiene la misma URL. **"New deployment" es el que rompe.**

Si ya se rompió y necesitas la URL nueva, no la adivines: el propio mensaje
de error de Google la trae. Dice `redirect_uri=https://...` — esa es
exactamente la que hay que registrar en Cloud Console (y que debe estar en
`OAUTH_REDIRECT_URI`).

---

## Diagnóstico — "no pueden entrar"

Antes que nada: **¿le pasa a todos, solo a los de afuera, o a una persona?**
Eso solo ya te dice dónde buscar.

### Problema 1 — Solo la gente de AFUERA no puede entrar (los del dominio sí)

Es OAuth. Siempre. Revisa en este orden:

1. **¿Qué dice el error exacto?** Si es `Error 400: redirect_uri_mismatch`,
   compara la URL que aparece en `redirect_uri=...` contra las registradas en
   Cloud Console → Credentials → tu cliente → Authorized redirect URIs. Fíjate
   en el ID `AKfycb...`: si no coincide con ninguna, es la trampa de arriba —
   se republicó con "New deployment". Registra la del error.
2. **¿Rotaste el Client Secret?** El Client ID no cambia al rotarlo, pero el
   secreto sí — hay que pegarlo en `OAUTH_CLIENT_SECRET`. Si quedó el viejo,
   Google rechaza el intercambio.
3. **¿Creaste un cliente OAuth nuevo?** Un cliente nuevo nace **sin ninguna
   redirect URI registrada**. Hay que agregarlas otra vez.
4. **¿`OAUTH_REDIRECT_URI` coincide exacto** con una de las registradas?
   Espacios de más, `http` vs `https`, o que falte `/exec`, todo eso lo
   rompe.
5. **¿Pasaron 5 minutos?** Los cambios en Cloud Console tardan.

### Problema 2 — NADIE puede entrar (ni los del dominio)

No es OAuth — OAuth solo afecta a los de afuera. Busca aquí:

1. **¿La URL sigue viva?** Si se republicó con "New deployment", el link que
   tiene el equipo apunta a un despliegue viejo. Menú **🏭 Acopio → Open WMS
   App** desde la hoja siempre abre el correcto.
2. **¿El script tiene un error que rompe el arranque?** Si la app muestra
   "Something went wrong" antes de cualquier pantalla, revisa el log de
   errores en el editor de Apps Script.
3. **¿Se corrió una autorización pendiente?** Si se agregó una función que
   pide un permiso nuevo, el script se queda esperando autorización. En el
   editor: elige cualquier función y presiona ▶ **Ejecutar** para que salga
   la ventana de permisos.
4. **Corre el auto-diagnóstico:** menú **🏭 Acopio → 🔧 Advanced → 🩺 Check
   this installation**. Revisa todas las propiedades críticas, repara sola
   las que puede (`SESSION_SECRET`, y `OAUTH_REDIRECT_URI` si hay un
   `WEB_APP_URL` guardado) y te lista lo que falta.

### Problema 3 — Una sola persona no puede entrar

1. **¿Qué ve exactamente?**
   - Pantalla de **"Sign in with Google"** siendo del dominio → su navegador
     está en **otra cuenta de Google**. Es la causa más común con diferencia,
     sobre todo en teléfonos, donde la cuenta de empresa rara vez es la
     primera. La misma pantalla trae abajo un selector de cuentas ("Signed in
     with the wrong account?"). Alternativa: ventana de incógnito.
   - Mensaje de **acceso denegado con su correo visible** → pasó la Puerta 1
     bien. Solo falta darlo de alta en `USERS_V3`, o su fila está inactiva.
     Se arregla desde la app: menú de cuenta → **Manage Users**.
2. **¿El correo está escrito idéntico?** Se compara en minúsculas y sin
   espacios, pero un `.` de más o un alias distinto sí lo rompe.

---

## Propiedades relacionadas con el acceso

Todas en: editor de Apps Script → ⚙️ Project Settings → Script Properties.

| Propiedad | Para qué | Si se pierde |
|---|---|---|
| `OAUTH_CLIENT_ID` | Deja entrar a gente de FUERA del dominio | Solo entra el propio dominio |
| `OAUTH_CLIENT_SECRET` | Va en pareja con el Client ID | Igual |
| `OAUTH_REDIRECT_URI` | A dónde regresa Google tras el login externo | Se rellena solo la próxima vez que se guarda el link en el asistente |
| `SESSION_SECRET` | **No tiene que ver con OAuth.** Firma los tokens de sesión que guarda el navegador, para que nadie pueda editar el suyo y hacerse pasar por otro | Se recrea solo; todos vuelven a iniciar sesión una vez |
| `WEB_APP_URL` | El link `/exec` guardado | Se vuelve a guardar desde el asistente |

---

## Seguridad — cuándo rotar secretos

`OAUTH_CLIENT_SECRET` y `SESSION_SECRET` son secretos reales. Si alguno se
expone (una captura de pantalla, un chat, un correo), hay que rotarlo:

- **`OAUTH_CLIENT_SECRET`**: genera uno nuevo en Cloud Console, en el mismo
  cliente, y pégalo en Script Properties. El Client ID y las redirect URIs
  **no cambian**, así que no rompe el login.
- **`SESSION_SECRET`**: bórralo de Script Properties; se crea uno nuevo solo.
  El único efecto es que todos vuelven a iniciar sesión una vez.

---

## Nota sobre el modelo actual (una copia por cliente)

Cada copia vendida tiene su propia URL `/exec`, y Google **no tiene API
pública** para registrar redirect URIs — es Cloud Console a mano. Así que hoy,
cada cliente que necesite acceso externo requiere ~5 minutos de trabajo
manual, una sola vez, en el cliente OAuth de Jose.

Las alternativas (un broker de redirección, o que cada cliente cree su propio
cliente OAuth) están evaluadas en `BACKLOG.md`, sección *"Open decision —
external sign-in for customers"*. Vale la pena releerla cuando el primer
cliente real necesite acceso externo.

**Riesgo anotado:** ese cliente OAuth es de Jose y queda guardado en las
Script Properties de **cada copia vendida**. Si se rompe, se rompe para todos
los clientes a la vez — lo cual, visto de otra forma, es un diagnóstico
rapidísimo: si falla el acceso externo en varios clientes el mismo día,
revisa el cliente OAuth **primero**.
