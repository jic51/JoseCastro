# Runbook de instalación — para quien instala, no para el cliente

`INSTALL-GUIDE.md` es la guía que se le da AL CLIENTE. Este documento es para
Jose, en campo, instalando. Una sola forma de hacerlo, sin variantes.

**Regla de oro: no improvises frente al cliente.** Si algo no está en este
documento, no lo inventes ahí mismo — anótalo, termina lo que sí puedes, y
resuélvelo después. Un paso improvisado es lo que después nadie puede
diagnosticar.

---

## ANTES de ir — la única decisión que importa

Todo el resto de la instalación es mecánico. Esto no. Pregúntale al cliente,
**por teléfono, antes de ir**:

> "¿Los correos de tu equipo son todos `@laempresa.com`, o hay gente que usa
> su Gmail personal?"

De la respuesta salen tres caminos:

| Respuesta | Qué significa | ¿Necesitas Cloud Console? |
|---|---|---|
| Todos `@laempresa.com` | Tienen Workspace. Todos se identifican solos. | **No** |
| Todos Gmail personal | No hay dominio. Solo el dueño se identifica solo. | **Sí, obligatorio** |
| Mezcla | Los del dominio entran solos; los de afuera no. | **Sí** |

**Si necesitas Cloud Console, ten el cliente OAuth abierto en una pestaña
antes de empezar.** No lo dejes para el final con el cliente mirándote.

El detalle de por qué funciona así está en `ACCESO-Y-LOGIN.md`. Este runbook
solo te dice qué hacer.

---

## Lista de verificación previa (5 minutos, en tu casa)

- [ ] Tengo el link de la plantilla maestra a la mano
- [ ] Sé el nombre exacto de la empresa (como quieren que aparezca)
- [ ] Sé **quién va a ser el dueño/admin** y su correo
- [ ] Si hay dominio: **confirmé que la copia la va a hacer una cuenta
      `@laempresa.com`**, no un Gmail personal ← esto no se puede corregir
      después sin volver a copiar
- [ ] Si hay gente de afuera: tengo acceso a Cloud Console y sé dónde está el
      cliente OAuth
- [ ] Tengo la lista del equipo con sus correos y qué rol va cada uno
- [ ] Voy a usar una computadora (no teléfono) con **una sola cuenta de
      Google abierta**, o ventana de incógnito

---

## La instalación — un solo camino

### Paso 1 — La copia (2 min)

Que **el cliente** abra el link con **la cuenta que va a ser dueña** y acepte
"Hacer una copia".

> **Cuidado:** quien haga la copia y complete la configuración queda como
> administrador. Y si hay dominio, esa cuenta **define quién se identifica
> automáticamente para siempre**. No lo hagas tú con tu cuenta "para
> agilizar" — quedaría mal para siempre.

### Paso 2 — El asistente (5 min)

Se abre solo al abrir la copia. Si no: menú **🏭 Acopio → 🚀 Set Up Acopio**.

Pide, en orden: empresa → categorías → ubicaciones → equipo → proveedores y
proyectos (estos dos se pueden saltar).

> **Da de alta a TODO el equipo aquí**, incluyendo a los que tienen correo
> del dominio. Estar en el dominio te *identifica*, no te *autoriza*. Si no
> están en la lista, no entran.

### Paso 3 — Publicar (3 min) — el único paso técnico

En el editor de Apps Script (Extensiones → Apps Script):

1. Ponle el nombre de la empresa al proyecto (arriba a la izquierda, donde
   dice "Proyecto sin título"). Es lo que el equipo verá en la pantalla de
   permisos.
2. **Deploy → New deployment**
3. ⚙️ → **Web app**
4. **Execute as: Me** · **Who has access: Anyone with a Google account**
5. **Deploy** → **Authorize access**
6. Sale "Google hasn't verified this app" → **Advanced → Go to [proyecto]
   (unsafe)**. Es normal, dilo antes de que salga para que el cliente no se
   asuste.
7. Copia la URL `/exec` y regresa al asistente → "Ya lo hice, muéstrame mi
   link".

> ⚠️ **"New deployment" solo se usa ESTA VEZ.** Para toda actualización
> futura es **Manage deployments → ✏️ → New version**. "New deployment"
> genera una URL distinta y rompe el login externo. Ver `ACCESO-Y-LOGIN.md`.

### Paso 4 — OAuth (5 min) — SOLO si hay gente fuera del dominio

Sáltate esto entero si todo el equipo está en el dominio de la empresa.

1. Cloud Console → APIs & Services → Credentials → tu cliente OAuth
2. **Authorized redirect URIs → + Add URI** → pega la URL `/exec` del paso 3,
   **completa y exacta, terminando en `/exec`**
3. **Save**
4. En el editor de Apps Script del cliente → ⚙️ Project Settings → Script
   Properties, agrega:
   - `OAUTH_CLIENT_ID`
   - `OAUTH_CLIENT_SECRET`
   - `OAUTH_REDIRECT_URI` ← la misma URL del punto 2, **idéntica**
5. **Espera 5 minutos antes de probar.** Cloud Console lo advierte él mismo.
   Si pruebas de inmediato y falla, no cambies nada — solo espera.

### Paso 5 — Verificar ANTES de irte

No te vayas sin esto. Es lo que separa una instalación terminada de una
llamada de soporte el lunes.

- [ ] Menú **🏭 Acopio → 🔧 Advanced → 🩺 Check this installation** — sin
      faltantes
- [ ] El **cliente** abre el link con **su** cuenta y entra
- [ ] **Si hay gente de afuera:** que alguien de afuera lo pruebe **delante
      de ti**. No asumas que funciona porque las propiedades están puestas.
      Si no hay nadie disponible, pruébalo tú con un Gmail personal dado de
      alta temporalmente
- [ ] Un movimiento de prueba (Entry) se guarda y aparece en Movements
- [ ] Backup diario encendido: **🏭 Acopio → 🗄 Backup Now / Enable Daily
      Backup**
- [ ] El cliente tiene el link guardado (bookmark), y sabe que también está
      en **🏭 Acopio → Open WMS App**
- [ ] Le enseñaste el botón 🐞 de reportar problemas

---

## Si algo falla EN CAMPO

Diagnóstico rápido. El detalle completo está en `ACCESO-Y-LOGIN.md`.

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| El asistente no abre | No corrió el trigger de la copia | Menú 🏭 Acopio → Set Up |
| "Google hasn't verified this app" | Normal, siempre pasa | Advanced → Go to (unsafe) |
| Error de permisos al usar una función | Falta autorizar | Editor → elige cualquier función → ▶ Ejecutar |
| El link del asistente no abre | Google reportó mal la URL | Deploy → Manage deployments → copia la URL de ahí |
| Una persona ve "Sign in with Google" siendo del dominio | Su navegador está en otra cuenta | Selector de cuentas en esa misma pantalla, o incógnito |
| Una persona ve "acceso denegado" con su correo | Login OK, falta darla de alta | Menú de cuenta → Manage Users |
| **Los de afuera** no entran, los del dominio sí | OAuth | Ver tabla de abajo |
| **Nadie** entra | No es OAuth | 🩺 Check this installation, y revisa que la URL sea la del despliegue vivo |

### Si es OAuth, en este orden

1. **Lee el error exacto.** Si dice `redirect_uri_mismatch`, trae la URL en
   `redirect_uri=...` — compárala contra las registradas en Cloud Console.
   Fíjate en el ID `AKfycb...`: si no coincide con ninguna, se republicó con
   "New deployment". **Registra la URL del error.**
2. ¿Se rotó el Client Secret? El ID no cambia, el secreto sí → pégalo en
   `OAUTH_CLIENT_SECRET`.
3. ¿Es un cliente OAuth nuevo? Nace **sin ninguna redirect URI**.
4. ¿`OAUTH_REDIRECT_URI` coincide **exacto**? Espacios, `http` vs `https`,
   que falte `/exec`.
5. ¿Pasaron 5 minutos?

---

## Los tres errores que cuestan más caro

Puestos aparte porque son los que no se pueden deshacer fácil:

1. **Que la copia la haga un Gmail personal en una empresa CON dominio.**
   Rompe la identificación automática para toda la empresa, para siempre. No
   se arregla — hay que volver a copiar desde cero. **Verifícalo antes del
   paso 1.**
2. **Usar "New deployment" para actualizar.** Cambia la URL, el equipo sigue
   entrando a la versión vieja, y el login externo se rompe. Siempre
   **Manage deployments → ✏️ → New version**.
3. **Irte sin probar el acceso externo con una cuenta real de afuera.** Es el
   único paso que depende de configuración fuera del Sheet, y el único que
   falla en silencio hasta que un empleado real lo intenta.

---

## Actualizar un cliente ya instalado

Son **tres archivos**, no dos: `Code.gs`, `Index.html` **y** `SetupWizard.html`.
El detalle está al final de `INSTALL-GUIDE.md`, sección "Actualizar un cliente
ya instalado".

Y después de pegarlos: **Manage deployments → ✏️ → New version.** Nunca "New
deployment".
