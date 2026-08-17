# SPEC — Acopio

> Las decisiones y **por qué** se tomaron. Se lee al empezar cada sesión.
> Cuando aparezca una decisión que no está aquí, se decide y **se escribe aquí**.
> El backlog guarda lo pendiente; esto guarda lo acordado.
>
> Escrito en retrospectiva, a partir de decisiones que ya se habían tomado a lo
> largo de la construcción. Casi todas están registradas en los mensajes de
> commit — este documento las reúne para no tener que reconstruirlas leyendo el
> historial.

**Última actualización:** 2026-08-13 · **Versión de la app:** 9.60

---

## Qué es

**Hace:** control de inventario de almacén sobre Google Sheets — entradas,
salidas, transferencias, devoluciones, mermas, ubicaciones, documentos
adjuntos, entregas esperadas.

**Resuelve:** un almacén que se lleva en hojas de cálculo sueltas, donde nadie
sabe con certeza qué hay, dónde está, ni quién se lo llevó.

**Lo usa:** gente de almacén con las manos ocupadas y prisa, muchas veces desde
el teléfono, de pie, con guantes. No es gente frente a una pantalla todo el día.
Esto decide casi todo lo visual: objetivos táctiles grandes, poco texto, nada
que dependa de pasar el mouse por encima como única vía.

**Listo cuando:** un cliente nuevo puede copiar la hoja, completar el asistente
y registrar su primer movimiento sin llamar a nadie.

## Cómo llega al usuario

**Modelo:** copia por cliente. Cada cliente hace "Make a copy" de una hoja
maestra; el código viaja con la copia y corre en **su** cuenta de Google.

**Por qué:** es el argumento comercial central — los datos del cliente nunca
pasan por servidores nuestros. No hay infraestructura que operar, no hay brecha
que sufrir, y una orden judicial contra nosotros no produce nada de su negocio.

**Lo que este modelo obliga:**
- El aviso **"Google hasn't verified this app"** es inevitable. La verificación
  es por proyecto de Cloud y cada copia tiene el suyo. Se explica en la guía de
  setup en vez de intentar evitarlo.
- Cada cliente **publica su propia web app** a mano. No hay forma de
  automatizarlo (ver Límites).
- Las Script Properties **no se copian**; los datos de las hojas **sí**. De ahí
  el asistente de configuración y la herramienta de limpieza de plantilla.
- Cualquier cliente OAuth para gente de fuera del dominio se registra **a mano**
  por copia.

## Plataforma y sus límites

**Plataforma:** Google Apps Script (web app) sobre una hoja de cálculo.

**No se puede:**
- `onOpen` es un trigger simple: no puede abrir diálogos ni leer la identidad
  del usuario. **El asistente no puede abrirse solo al copiar la hoja.** Se
  resuelve con un toast y una hoja "👉 START HERE".
- Desplegarse solo. Bloqueado por el proyecto de Cloud oculto de Google.
- `ScriptApp.getService().getUrl()` devuelve una URL que no funciona (Google
  issue 170799249). La URL real la pega el usuario y se guarda en `WEB_APP_URL`.
- Registrar redirect URIs de OAuth por API. Solo Cloud Console, a mano.
- Mostrar PDFs en línea: los plugins del navegador no cargan dentro del iframe
  sandbox de `googleusercontent.com`. Se muestra el render de la página 1 que
  hace Drive del lado servidor.

**Cuesta dinero:**
- Scopes restringidos (leer todo el correo) → auditoría de seguridad anual y
  pagada para distribuir. **Por eso el escáner de Gmail salió del producto.**
- La IA usa la clave Gemini del cliente; él le paga a Google directo.

**Requiere que un humano haga algo:**
- Publicar la web app y aceptar permisos.
- Pegar la URL `/exec` de vuelta en el asistente.
- Renombrar el proyecto de Apps Script (aparece en la pantalla de permisos).

## Reglas de la casa

| Regla | Decisión |
|---|---|
| Idioma de la interfaz | **Inglés, 100%.** Ni una palabra en español en la app. |
| Idioma en el que hablamos | Español. |
| Autoridad para decidir | **Cambiar cosas solo con 99% de certeza de lo que Jose quiere.** Si no, preguntar. |
| Cómo se entrega | Los dos archivos completos, para pegar en el editor de Apps Script. |
| Cómo se prueba | Jose pega, recarga, y prueba en su hoja real de producción. |
| Versión visible | Sí — `APP_VERSION` en los dos archivos, mostrada bajo el badge de Acopio. Si no coinciden, la app avisa. |

## Verificación — antes de cada entrega

1. `node --check` sobre el JavaScript extraído del HTML **y** sobre `Code.gs`
2. `python3 tools/check-refs.py Index_v3_fixed.html Code_v3_fixed.gs`
3. No hay tests automatizados. La verificación es manual y la hace Jose sobre
   datos reales.
4. Subir `APP_VERSION` en **los dos** archivos
5. Commit con la razón del cambio, push, y enviar los archivos

*Nunca se salta, ni para cambios de una línea.* El punto 2 existe porque una
función borrada pasó el punto 1 y tumbó la app entera.

## Cómo se comporta

### Listas y tablas
- **Orden por defecto:** lo accionable primero, nunca lo más viejo — *porque:*
  "All Incoming" abría con entregas de tres meses atrás y había que recorrer el
  año para ver lo que viene.
- **Agrupación:** por lo que hay que hacer con cada fila (Vencido / Esperado /
  Sin fecha / Llegado / Cancelado) — *porque:* contesta "qué persigo hoy", que
  es la pregunta con la que alguien abre esa pantalla.
- **Dentro de cada grupo:** lo que aún viene, ascendente; lo ya resuelto,
  descendente — *porque:* nadie recorre un historial para llegar a su fila más
  vieja.
- **Estado vacío:** una fila dentro de la tabla, nunca reemplazando la tabla —
  *porque:* al reemplazarla desaparecían también los encabezados y el editor de
  columnas, o sea el control para arreglar el filtro.
- **Columnas:** los **nombres** los pone un admin para toda la empresa; el
  **orden y qué se ve** es de cada usuario, en su navegador — *porque:* un
  reporte tiene que significar lo mismo para dos personas, pero uno mira
  reservas y otro mermas.
- **Columnas que nunca se ocultan:** Category y Name en Stock; Type, Date,
  Category, Name y Qty en Movements — *porque:* sin ellas la fila no dice nada.

### Formularios
- **Guardar deshabilitado hasta que esté completo**, con un texto que diga qué
  falta — *porque:* es menos frustrante que intentar y ser rechazado.
- **La validación tiene que decir exactamente lo mismo que el guardado** —
  *porque:* cuando se separaron, el botón quedó muerto con el formulario lleno
  y no había salida. Se revisa contra `submitMultiEntry` / `submitMultiExit`
  línea por línea.
- **Campos obligatorios: los mínimos** — *porque:* obligar de más hace que la
  gente invente datos, y un dato inventado es peor que un campo vacío. Por eso
  una entrega esperada puede tener fecha exacta, rango, aproximada o ninguna.

### Editar y borrar
- **Un modo por pantalla, no controles por fila** — *porque:* cuarenta filas
  con lápiz y bote son ochenta botones compitiendo con los datos, y el bote
  queda a un resbalón del dedo de la fila de arriba.
- **El modo no sobrevive al cambiar de pantalla** — *porque:* dejar "Borrar"
  armado en cuatro pestañas es el accidente que el modo venía a evitar.
- **En modo Borrar la lista se bordea en rojo** — *porque:* el estado peligroso
  tiene que notarse desde lejos.
- **Las locaciones no se borran: se archivan o se fusionan** — *porque:* cada
  movimiento que pasó por ahí la nombra, y borrarla los deja apuntando a nada.
- **Las fusiones reescriben historial y no se pueden deshacer.** Siempre se
  advierte antes.

### Avisos
- **Se quedan hasta que alguien aprieta la ✕** — *porque:* con una marca de "ya
  visto" que avanzaba sola, "se mostró" se confundía con "alguien lo atendió", y
  cada aviso se veía una vez y nunca más.
- **Techo real:** el servidor devuelve los últimos 30 eventos del sistema. Uno
  sin cerrar acaba cayéndose — con un backup diario eso es un mes. *Se dice en
  voz alta en vez de fingir que es para siempre.*
- **Un solo mazo para avisos y sugerencias** — *porque:* son cosas distintas,
  pero esa diferencia va **en la tarjeta** (✕ para lo que informa, Add/Not now
  para lo que pregunta), no en el layout.
- **En reposo: la de enfrente translúcida, las de atrás escondidas** — *porque:*
  la opacidad por tarjeta se apila y se vuelve un borrón; opacar los colores tapa
  la página. Y tiene que ser **fondo** translúcido, no elemento desvanecido, o se
  apagan también la ✕ y el contador.
- **Cuando la app hace algo sola: qué hizo, sobre qué y POR QUÉ, y un clic para
  ir a verlo** — *porque:* "1 fila corregida automáticamente" obligó a Jose a
  abrir la hoja de auditoría a mano para entender qué había pasado.

### Configuración
- **Guardado silencioso:** al guardar solo cambia lo que cambió; nada de
  "Guardando… / Guardado ✓ / Cargando…" — *porque:* el navegador ya sabe qué
  cambió y volver a preguntarle al servidor es trabajo de más que además se ve
  mal.
- **Todo lo que pregunta el asistente es editable después** (Settings →
  Company) — *porque:* el logo solo se podía cambiar rehaciendo el asistente
  completo.
- **Lo que se puede romper se avisa en la pantalla**, no en un manual — de ahí
  el chequeo 🩺 Check this installation.
- **Los diálogos son de la app, nunca `prompt()` del navegador** — *porque:* el
  del navegador anuncia la dirección `googleusercontent.com` y se lee como una
  advertencia de seguridad.

### Datos adjuntos
- **Viven en Drive del cliente**, en carpetas con el prefijo `FOLDER_PREFIX`.
- **`FOLDER_PREFIX` jamás se recalcula** al renombrar la empresa — *porque:* al
  cambiarlo, todos los adjuntos previos quedaron huérfanos. Los nombres viejos
  se guardan en `FOLDER_PREFIX_HISTORY` y se siguen aceptando.
- **Nada se comparte públicamente.** Se guarda el ID y se sirve por el mismo
  canal RPC que todo lo demás.
- **El límite de tamaño se avisa al elegir el archivo**, no al guardar.

### Pantallas chicas
- **Nunca se esconden:** las pestañas y la tabla. Los controles se apilan.
- **Debajo de 720px** el círculo de cuenta se pone sobre la campana.
- **Debajo de 520px** el aviso de setup y el panel de notificaciones son la
  mitad de ancho — *porque:* a ancho completo tapaban la app. Se hacen más
  angostos, no más chicos: los tamaños de letra no cambian.
- **El mazo depende de hover, así que debajo de 900px se oculta** y la campana
  ocupa su lugar con el mismo contenido — *porque:* en táctil no hay hover.

## Datos

**Dónde viven:** la hoja del cliente, en su Drive. No hay servidor nuestro.
**Quién los ve:** solo quien esté en la lista de usuarios de esa copia.
**Respaldo:** copia diaria a las 2am, se conservan 30 días.

**Lo que jamás debe recalcularse:**
- `FOLDER_PREFIX` (ver arriba).
- El **MatID** sí se recalcula siempre desde categoría+nombre, y **nunca se
  confía en el guardado** — *porque:* dos filas del mismo material con IDs
  distintos hacían que una ENTRY de +21 y una EXIT de −21 cayeran en cubetas
  distintas, y el material aparecía "todavía en bodega" después de haber salido.

## Roles

| Rol | Puede |
|---|---|
| ADMIN | Todo: Settings, usuarios, editar y borrar movimientos, fusiones |
| WAREHOUSE | Registrar movimientos, ver todo. No entra a Settings |
| VIEWER | Solo lectura |

Tres roles fijos. Permisos granulares están en el backlog y son prerequisito de
cualquier módulo de costos — no se puede mostrar cuánto costó algo hasta poder
decidir quién lo ve.

## Reglas de construcción

- **Todo identificador de servicio externo va en configuración**, no en el
  código: el nombre del modelo de Gemini vive en `GEMINI_MODEL` con
  alternativas — *porque:* Google retiró `gemini-2.0-flash` y tumbó todas las
  features de IA con un 404 que no le decía nada a nadie.
- **Un error nunca se esconde detrás de la pantalla de carga.** Cualquier fallo
  no capturado baja el splash y dice qué pasó.
- **Nada de categorías, proyectos ni proveedores de ejemplo en el código** —
  *porque:* se filtraron a copias en blanco y un cliente nuevo guardó un
  movimiento con la categoría "WINDOW" de OX Glass.

## Fuera de alcance (v1)

- Costos y precios (necesita permisos granulares primero)
- Escáner de Gmail (scope restringido, auditoría anual)
- Códigos de barras / QR
- PWA instalable y cola offline
- Sincronización en vivo entre ventanas abiertas

## Decisiones tomadas durante la construcción

| Fecha | Decisión | Por qué |
|---|---|---|
| v9.30 | Herramientas de plantilla limpia en el menú | Las Script Properties no se copian pero los datos sí; sin esto, cada cliente recibiría el inventario de OX Glass |
| v9.41 | El editor de columnas se generaliza a un registro de tablas | Movements y Stock tenían gestos distintos para lo mismo |
| v9.45 | Un modo de edición por pantalla en seis pantallas | Ver "Editar y borrar" |
| v9.52 | Textos legales dentro de la app, no enlazados | Cada cliente corre su propia copia; no hay dirección común a donde mandarlos |
| v9.54 | Cuatro tipos de fecha en entregas esperadas | Forzar fecha exacta hacía que la gente inventara datos |
| v9.57 | El escáner de Gmail sale del producto | Mostrar una función que solo puede fallar es peor que no tenerla |
| v9.59 | `tools/check-refs.py` | Una función borrada pasó `node --check` y tumbó la app |
