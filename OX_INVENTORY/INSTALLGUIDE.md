# Guía de instalación — OX Glass WMS

**Tiempo estimado: 5–10 minutos.** No necesitas saber programación. Solo
necesitas una cuenta de Google (Gmail normal o de empresa, cualquiera sirve).

Al terminar vas a tener tu propio sistema de inventario, corriendo en tu propia
cuenta de Google, con tus datos guardados en tu propio Google Drive. Nadie más
—ni siquiera nosotros— tiene acceso a tu información.

---

## Antes de empezar

Vas a recibir de nosotros **un enlace** a la plantilla del sistema. Ten ese
enlace a la mano.

> **Importante:** haz todo este proceso desde una computadora (no desde el
> teléfono), y con **una sola cuenta de Google abierta en el navegador**. Si
> tienes varias cuentas de Google abiertas al mismo tiempo, Google se confunde
> sobre cuál usar y la instalación puede fallar de formas raras.
>
> La forma más segura: abre una **ventana de incógnito** y entra ahí solamente
> con la cuenta que va a ser la dueña del sistema.

**¿Cuál cuenta debe ser la dueña?** La persona que abra esta plantilla se
convierte automáticamente en el **administrador** del sistema: es quien podrá
dar de alta a los demás usuarios y cambiar configuraciones. Elige bien desde el
principio — normalmente el dueño del negocio o el encargado de bodega.

---

## Paso 1 — Haz tu propia copia

1. Abre el enlace que te enviamos. Se va a abrir una hoja de Google Sheets.
2. En el menú de arriba: **Archivo → Hacer una copia**.
3. Ponle el nombre que quieras (ejemplo: *Inventario — Mi Empresa*).
4. Haz clic en **Hacer una copia**.

Se va a abrir **tu copia**. De aquí en adelante trabajas siempre en TU copia,
nunca en la original.

> ✅ **Cómo saber que estás en tu copia:** el nombre que le pusiste aparece
> arriba a la izquierda.

---

## Paso 2 — Abre el editor de código

No te asustes por el nombre — no vas a escribir nada de código, solo vas a
hacer clic en unos botones.

1. En tu copia, menú de arriba: **Extensiones → Apps Script**.
2. Se abre una pestaña nueva con el editor. Déjala abierta.

---

## Paso 3 — Publica tu sistema (una sola vez)

1. Arriba a la derecha, haz clic en el botón azul **Implementar** (*Deploy*).
2. Elige **Nueva implementación** (*New deployment*).
3. Haz clic en el ícono de engranaje ⚙️ junto a "Seleccionar tipo" y elige
   **Aplicación web** (*Web app*).
4. Llena así:
   - **Descripción:** cualquier cosa (ejemplo: `Versión 1`)
   - **Ejecutar como** (*Execute as*): **Yo** (*Me* — tu correo)
   - **Quién tiene acceso** (*Who has access*): **Cualquier usuario con una
     cuenta de Google** (*Anyone with a Google account*)

   > ⚠️ Estas dos últimas opciones son importantes. "Ejecutar como: Yo" es lo
   > que permite que el sistema guarde archivos y mande correos por ti. "Quién
   > tiene acceso" define quién puede abrir la página — pero **no** quién puede
   > usar el sistema: eso lo controlas tú después, dando de alta a cada persona
   > desde adentro de la app. Alguien que no esté dado de alta verá una pantalla
   > de "acceso denegado" aunque tenga el enlace.

5. Haz clic en **Implementar** (*Deploy*).

---

## Paso 4 — Autoriza los permisos

Esto pasa una sola vez, y solo lo hace el administrador.

1. Google te va a mostrar una ventana pidiendo autorización. Haz clic en
   **Autorizar acceso**.
2. Elige tu cuenta de Google (la que va a ser la dueña).
3. **Probablemente veas una pantalla que dice "Google no ha verificado esta
   aplicación".** Esto es normal y esperado: le estás dando permiso a un
   programa que ahora te pertenece a ti, no a una app pública de la tienda de
   Google. Para continuar:
   - Haz clic en **Configuración avanzada** (*Advanced*), abajo a la izquierda.
   - Haz clic en **Ir a [nombre del proyecto] (no seguro)**.
4. Revisa los permisos y haz clic en **Permitir**.

> **¿Qué permisos estoy dando y por qué?**
> - **Google Drive** — para guardar las fotos de racks y los documentos
>   (facturas, remisiones) que subas al sistema.
> - **Enviar correo como tú** — para las notificaciones a los Project Managers.
>   *Solo puede enviar, nunca leer tu correo.*
> - **Google Docs** — para armar los PDFs de documentos.
> - **Tu hoja de cálculo** — es la base de datos del sistema.
>
> El sistema **no** pide acceso a leer tu Gmail. (Existe un módulo opcional de
> pago que escanea correos de proveedores; si lo contratas, ese sí pide ese
> permiso, y se instala aparte.)

---

## Paso 5 — Guarda tu enlace

Al terminar, Google te muestra una **URL de aplicación web**
(empieza con `https://script.google.com/macros/s/...`).

**Esa URL es tu sistema. Guárdala:**
- Cópiala y ponla en marcadores/favoritos de tu navegador.
- Compártela con tu equipo (recuerda: solo entrarán quienes tú des de alta).

> ¿Se te perdió el enlace? Ábrelo desde tu hoja de cálculo:
> menú **🏭 OX WMS v3 → Open WMS App**.

---

## Paso 6 — Primer ingreso

1. Abre la URL. Deberías entrar directo como **ADMIN**.
2. Ve a **Configuración** (⚙️) y carga los datos de tu empresa:
   - Categorías de material
   - Ubicaciones / racks de tu bodega
   - Proveedores
   - Proyectos
   - Usuarios de tu equipo (con su rol: Admin, Bodega, o Solo lectura)
3. Activa el respaldo automático: en tu hoja de cálculo, menú
   **🏭 OX WMS v3 → 🗄 Enable Daily Backup**. Se hace una copia de seguridad
   diaria a las 2am, guardada 30 días. **Hazlo el primer día.**

Si ya tienes tu inventario en Excel, no lo captures a mano: usa
**Configuración → Importar** para subirlo desde un archivo CSV.

---

## Problemas comunes

**"Sign-in is not configured" / no me deja entrar**
Casi siempre es tener varias cuentas de Google abiertas en el navegador. Abre
una ventana de incógnito, entra solo con la cuenta dueña, y prueba de nuevo.

**Actualicé el código pero no veo los cambios**
Publicar una versión nueva no es lo mismo que guardar. En el editor:
**Implementar → Administrar implementaciones → ✏️ (editar) → Versión: Nueva
versión → Implementar**. Ojo: usa **Administrar implementaciones**, no "Nueva
implementación" — esta última crea una URL distinta y tu equipo seguiría
entrando a la vieja.

**Agregamos una función nueva y da error de permisos**
Cuando el sistema estrena un permiso, Google necesita que lo autorices otra vez,
y a veces no lo pide solo. Fuérzalo así: en el editor de Apps Script, elige
cualquier función en el menú de arriba y presiona ▶ **Ejecutar**. Ahí sí
aparece la ventana de autorización.

**No me llegan los correos de notificación**
Las cuentas de Gmail normales tienen un límite de 100 correos por día; las
cuentas de Google Workspace (empresariales), 1,500. Si mandas muchas
notificaciones al día, es probable que estés topando ese límite.

---

## ¿Necesitas ayuda?

Dentro de la app, abajo a la derecha, hay un botón 🐞 (**Reportar un
problema**). Escribe qué pasó y adjunta una foto de la pantalla — nos llega
directo.
