# Prueba de la instalación de un clic — pasos

**20 minutos.** Contesta las cuatro cosas de las que depende la versión gratis.

> **LO MÁS IMPORTANTE DE ESTA PÁGINA:** la parte que de verdad importa se prueba
> **DESDE UNA SEGUNDA CUENTA DE GOOGLE**, no desde la tuya. Tú eres el dueño del
> original: Google ya te conoce y te enseña una pantalla distinta —o ninguna— de
> la que ve un desconocido. Probarlo con tu cuenta y dar el resultado por bueno
> es el error que haría inútil toda la prueba.
>
> Sirve cualquier segunda cuenta: una personal, la de tu mujer, una nueva de
> gmail hecha para esto.

---

## PARTE A — montar el original (con tu cuenta)

### A1. Hoja nueva

Entra a [sheets.new](https://sheets.new). Llámala **PRUEBA 1 CLIC**.

Escribe en la fila 1, para que la fila que escriba la prueba tenga encabezados:

| A1 | B1 | C1 |
|---|---|---|
| `Cuándo` | `Versión` | `Texto` |

### A2. Abrir el editor de scripts

**Extensiones → Apps Script.** Se abre en otra pestaña.

### A3. El código

Borra todo lo que haya en `Código.gs` y pega **`Codigo.gs`** de esta carpeta.

### A4. El panel

Botón **+** junto a *Archivos* → **HTML**. Llámalo exactamente **`Panel`**
(Google le pone `.html` solo). Borra lo que trae y pega **`Panel.html`**.

> El nombre tiene que ser `Panel` porque el código pide
> `createHtmlOutputFromFile('Panel')`. Si no coincide, da error al abrir.

### A5. Los permisos — este paso es el que mide todo

⚙️ **Configuración del proyecto** (izquierda) → marca
**«Mostrar el archivo de manifiesto appsscript.json en el editor»**.

Vuelve al editor. Ahora aparece `appsscript.json`. Ábrelo, **borra todo** y pega
**`appsscript.json`** de esta carpeta.

> Declara dos permisos y nada más. **Si algún día añades a este archivo de
> prueba una línea que use `DriveApp`, `Session.getActiveUser`, `MailApp` o
> `UrlFetchApp`, Google añade su permiso solo y la prueba deja de medir lo que
> dice medir.**

Guarda (💾).

### A6. Comprobación rápida, todavía con tu cuenta

Vuelve a la hoja y **recárgala**. Arriba tiene que salir el menú **🧪 Prueba**.

- ✅ Sale → el menú funciona sin autorizar. **Ésa es la pregunta 3.**
- ❌ No sale → para aquí y dímelo. Sin menú no hay por dónde entrar.

---

## PARTE B — la prueba de verdad (con la SEGUNDA cuenta)

### B1. Preparar el enlace de copia

En la hoja: **Compartir** → **Acceso general** → *Cualquier persona con el
enlace* → **Lector** → **Copiar enlace**.

Pega el enlace en algún sitio y **cambia el final**:

```
.../edit?usp=sharing     ← lo que te da Google
.../copy                 ← cámbialo a esto
```

O sea, borra desde `/edit` hasta el final y escribe `/copy`.

### B2. Cerrar sesión de verdad

Abre una **ventana de incógnito** y entra con la **segunda cuenta**. No basta
con cambiar de cuenta en la misma ventana: Google arrastra sesiones y acabarías
probando con la tuya sin darte cuenta.

### B3. El momento de la verdad

Pega el enlace `/copy` en la ventana de incógnito.

**📸 FOTO 1** — la pantalla que pide hacer la copia.

Pulsa **Hacer una copia**.

**📸 FOTO 2** — lo que salga inmediatamente después. Aquí es donde Google avisa
de que «también se copiarán las funciones y el archivo de Apps Script».

### B4. Entrar

En la copia recién hecha:

**📸 FOTO 3** — ¿sale el menú **🧪 Prueba** sin hacer nada?

Pulsa **🧪 Prueba → Abrir la ventana**.

**📸 FOTO 4 — LA FOTO QUE IMPORTA.** Lo que Google enseñe ahora para pedir
permisos. Fotografía **todas** las pantallas que salgan, una por una, hasta que
se abra la ventana. Busca especialmente si en alguna aparece:

> ⚠️ **Google hasn't verified this app**

- **Si NO aparece** → la versión gratis se instala en un clic de verdad. Vía
  libre.
- **Si SÍ aparece** → sigue funcionando, pero hay un susto en medio y hay que
  decidir si se asume o se escribe un aviso en la landing que lo adelante.

Lee también **qué permisos pide**. Si dice algo de «ver y administrar tus
archivos de Drive», algo se coló: vuelve al paso A5.

### B5. El tamaño

Cuando se abra la ventana:

**📸 FOTO 5** — la ventana entera, con las tres cifras grandes visibles.

Se pidieron 2000×2000. Lo que diga **Ancho real** y **Alto real** es lo que
Sheets da de verdad. **Ésa es la pregunta 2.**

### B6. Escribir

Pulsa **Escribir una fila en la hoja**.

**📸 FOTO 6** — el mensaje que salga debajo del botón.

- Verde → el permiso pequeño alcanza para trabajar. **Pregunta 4 contestada.**
- Rojo → **copia el mensaje entero tal cual**, sin acortar. Google nombra el
  permiso exacto que falta y ése es el dato.

---

## Lo que hay que mandarme

Las seis fotos, y estas cuatro respuestas:

| | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Salió «Google hasn't verified this app»? | sí / no |
| 2 | Ancho × alto reales de la ventana | `____ × ____` |
| 3 | ¿El menú 🧪 salió solo en la copia? | sí / no |
| 4 | ¿Escribió la fila? | sí / no — y el mensaje si fue rojo |

Con eso se decide si la versión gratis se instala en un clic limpio o en un clic
con susto, y de qué tamaño puede ser su pantalla. Son las dos cosas que no se
pueden dar por supuestas.

---

## Si algo sale mal por el camino

| Lo que ves | Qué es |
|---|---|
| **«No se encontró el archivo Panel»** | El archivo HTML no se llama exactamente `Panel` |
| **El menú 🧪 no aparece** | No se guardó el código, o la hoja no se recargó tras guardar |
| **Cuadro gris de excepción al abrir la hoja** | Algo intenta abrir la ventana solo. En esta prueba no debería pasar: la ventana sólo se abre al pulsar el menú |
| **Pide permisos de Drive** | Se coló algo en el código. Revisa el paso A5 |

## Lo que esta prueba NO contesta

Para que nadie saque conclusiones de más:

- **No prueba Acopio**, prueba el camino de instalación. La app real tiene más
  código, pero no más permisos de los que declare.
- **No dice cuánta gente lo instalará.** Dice cuántos clics y cuántos sustos hay.
- **No vale para la versión de pago.** Ésa sube documentos a Drive, y ese permiso
  es restringido — eso ya está medido y revertido en
  `docs/FINDING-drive-file-scope.md`.
