# La clave de Gemini — qué hace falta para que funcione

Jose, 2026-10-07: *"en OX la API de Gemini ha estado fallando, así que la
eliminé y estoy tratando de ingresar otra pero lleva mucho tiempo verificando
con Google… ¿hay algún dato importante que debe ponerle al crear la key, algún
nombre específico o algo que necesite?"*

**Respuesta corta: el nombre da igual. Lo que decide son tres cosas, y dos de
ellas no están en la pantalla donde se crea la clave.**

---

## Para qué la usa Acopio

Sólo para **leer**. Nada más:

- Pegar el correo de un proveedor y que salga la entrega esperada rellenada.
- Subir la foto de una factura o un PO y que salga lo mismo.

**Si no hay clave, la app funciona entera.** Se teclea a mano, como siempre.
La clave es comodidad, no capacidad — y por eso **nunca** debe bloquear una
instalación.

---

## Las tres cosas que la hacen funcionar

### 1. La clave en sí

Se saca en **Google AI Studio** (`aistudio.google.com`), en *Get API key*.

Hay dos opciones y **las dos valen**:

| Opción | Cuándo |
|---|---|
| **Crear clave en proyecto nuevo** | Lo más rápido. AI Studio crea el proyecto de Cloud él solo |
| **Crear clave en un proyecto existente** | Si quieres que viva en un proyecto tuyo que ya controlas |

**No hay ningún nombre ni campo que haya que escribir de una forma concreta.**
El nombre de la clave es para que tú la reconozcas y no afecta a nada.

> **Lo que cambió en mayo de 2026 y conviene saber:** las claves nuevas de AI
> Studio nacen como **auth keys**, restringidas de fábrica a la *Generative
> Language API*, y Google aplica **detección rápida de claves filtradas** — si
> una clave aparece en un sitio público (un repositorio, una captura, un
> mensaje), **Google la mata en poco tiempo**. Si una clave dejó de funcionar
> sola, ése es el primer sospechoso.

### 2. La *Generative Language API*, encendida en ese proyecto

Si creas la clave **en un proyecto nuevo** desde AI Studio, se enciende sola.

Si la creas **en un proyecto que ya existía**, puede no estarlo. Es la causa
número uno de un `403` y Acopio ya lo dice en su mensaje de error.

Para encenderla: Cloud Console → *APIs y servicios* → *Habilitar APIs* →
buscar **Generative Language API** → Habilitar. **Tarda unos minutos en
propagarse.**

### 3. ⚠️ Y ésta es la tuya, Jose: el permiso de Workspace

**`jose@ox-glass.com` no es una cuenta de Gmail: es una cuenta de Google
Workspace.** Y en Workspace, **el administrador del dominio puede tener AI
Studio apagado** — en ese caso no importa cuántas claves crees: ninguna va a
funcionar, y la pantalla se queda dando vueltas.

Dos interruptores, los dos en `admin.google.com`:

| Dónde | Qué comprobar |
|---|---|
| **Apps → Servicios adicionales de Google** | Que **Google AI Studio** esté **ACTIVADO** para tu unidad organizativa |
| **Seguridad → Controles de API → Control de acceso de apps** | Que **no haya un bloqueo** sobre `aistudio.google.com` |

**Tú eres el administrador de `ox-glass.com`**, así que esto lo puedes mirar y
cambiar tú mismo. **Empieza por aquí**, porque si está apagado, todo lo demás
es tiempo perdido.

---

## Por qué "lleva mucho tiempo verificando" — y una parte es nuestra

Al guardar la clave, Acopio **la usa una vez de verdad** antes de aceptarla. Eso
es deliberado y es lo correcto: una clave mala guardada en silencio falla días
después, delante de alguien que está intentando trabajar.

**Pero lo hace mal.** `geminiFetch_` prueba **hasta cuatro modelos seguidos**
hasta que uno conteste. Esa lista existe para el uso de verdad —si un modelo se
retira, la app sigue funcionando— pero **para comprobar una clave no sirve de
nada**: si la clave está mal, está mal para los cuatro.

Resultado: una clave que no funciona hace **cuatro viajes a Google** en vez de
uno, y la rueda da vueltas cuatro veces más tiempo del necesario.

> **Pendiente (pequeño):** que la comprobación pruebe **un** modelo, no cuatro.
> La lista de respaldo se queda donde sirve, que es en el uso real.

---

## Qué hacer, en orden

1. **`admin.google.com` → Apps → Servicios adicionales → Google AI Studio: ¿ON?**
   Si está apagado, enciéndelo y espera unos minutos. **Esto primero.**
2. **Seguridad → Controles de API:** que `aistudio.google.com` no esté bloqueado.
3. **`aistudio.google.com` → Get API key → Crear clave en proyecto nuevo.**
   Es la opción corta y enciende la API ella sola.
4. **Pégala en Acopio** (⚙️ Settings → System → AI). Si tarda, dale un minuto:
   una clave recién creada puede tardar en estar activa.
5. **Si da `403`:** la *Generative Language API* no está encendida en ese
   proyecto. El mensaje de Acopio ya te lo dice.
6. **Si da `429` o `503`:** no es tuyo. Es Google saturado. Se pasa solo.

---

## Lo que NUNCA hay que hacer

❌ **Pegar la clave en un sitio público.** Ni en un repositorio, ni en una
captura, ni en un chat. Google las caza y las desactiva, y entonces parece que
"la API falla" cuando lo que pasó es que la clave está muerta.

❌ **Meterla en el código.** En Acopio la clave vive en Script Properties, de la
instalación de cada cliente, y **nunca** se escribe en la hoja ni se envía a
ningún sitio nuestro. El registro de auditoría apunta que se puso una clave,
jamás la clave.

---

## Para el cliente que instala

La versión de una línea, que es la que va a ir dentro de la app:

> *"Optional. Without a key everything still works — you just type deliveries in
> by hand. Get one free at aistudio.google.com → Get API key. If your email is a
> company Google account, your admin may need to turn on 'Google AI Studio'
> first."*

---

**Fuentes:**
- [Using Gemini API keys — ai.google.dev](https://ai.google.dev/gemini-api/docs/api-key)
- [Manage access to Gemini features in Workspace services](https://knowledge.workspace.google.com/admin/gemini/manage-access-to-gemini-features-in-workspace-services)
- [Configuration requirements for using Google AI Studio with Workspace and GCP](https://discuss.ai.google.dev/t/configuration-requirements-for-using-google-ai-studio-with-google-workspace-and-gcp/94050)
