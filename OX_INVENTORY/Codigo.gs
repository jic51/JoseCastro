/**
 * PRUEBA DE LA INSTALACIÓN DE UN CLIC — 16/10/2026
 *
 * Esto NO es Acopio. Es lo más pequeño que contesta las dos preguntas de las
 * que depende la versión gratis:
 *
 *   1. ¿Qué pantalla de permisos ve un DESCONOCIDO al abrir una copia que sólo
 *      pide `spreadsheets.currentonly` y `script.container.ui`? ¿La suave, o la
 *      fea de «Google hasn't verified this app»?
 *   2. ¿De qué tamaño deja Sheets la ventana? Una barra lateral son ~300 px y
 *      eso sería demasiado estrecho para la app.
 *
 * Y de paso comprueba dos cosas más que damos por hechas y conviene no dar:
 *
 *   3. Que el MENÚ aparezca solo en una copia recién hecha, sin autorizar. Si
 *      no aparece, no hay por dónde entrar y el plan entero se cae.
 *   4. Que con sólo `spreadsheets.currentonly` se pueda ESCRIBIR en la hoja —
 *      que es, al fin y al cabo, lo único que la versión gratis hace.
 *
 * ── LO QUE NO PUEDE TOCAR ESTE ARCHIVO ───────────────────────────────────────
 *
 * Nada que pida un permiso más. Ni `Session.getActiveUser()`, ni `DriveApp`, ni
 * `UrlFetchApp`, ni `MailApp`, ni `ScriptApp`. Una sola llamada de ésas añade su
 * permiso a la lista y la prueba deja de medir lo que dice medir: saldría la
 * pantalla fea y creeríamos que es culpa de los dos permisos buenos.
 *
 * El comentario `@OnlyCurrentDoc` de abajo es la forma documentada de decirle a
 * Google que este script no sale de su propia hoja. Va además de la lista de
 * `appsscript.json`, no en su lugar.
 *
 * @OnlyCurrentDoc
 */

var VERSION_PRUEBA = 'prueba-1clic-1';

/**
 * PREGUNTA 3 — el menú.
 *
 * `onOpen` es un disparador SIMPLE: corre sin autorización y tiene prohibido
 * todo lo que la necesite. `createMenu` sí está permitido; `showModalDialog` NO
 * — eso ya nos costó un cuadro gris de excepción en la cara de un cliente, y
 * está escrito en el `onOpen` de Acopio.
 *
 * Por eso aquí el menú se pone solo y la ventana espera a que la pulsen. Si al
 * abrir una copia recién hecha el menú 🧪 no aparece, hay que parar: sin menú
 * no hay forma de entrar.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧪 Prueba')
    .addItem('Abrir la ventana', 'abrirVentana')
    .addToUi();
}

/**
 * PREGUNTAS 1 y 2 — los permisos y el tamaño.
 *
 * Esto NO es un disparador: lo dispara un clic del usuario, así que corre
 * autorizado. Es exactamente aquí donde Google enseña la pantalla de permisos
 * la primera vez, y es la pantalla que hay que fotografiar.
 *
 * Se pide una ventana deliberadamente ENORME (2000×2000). Sheets va a dar lo
 * que pueda, y lo que dé es la respuesta a la pregunta 2. Pedir 800 y que
 * quepan 800 no diría nada.
 */
function abrirVentana() {
  var html = HtmlService.createHtmlOutputFromFile('Panel')
    .setWidth(2000)
    .setHeight(2000);
  SpreadsheetApp.getUi().showModalDialog(html, 'Prueba de un clic');
}

/**
 * PREGUNTA 4 — escribir con el permiso pequeño.
 *
 * La llama la ventana. Escribe una fila en la propia hoja, que es todo lo que
 * la versión gratis necesita saber hacer: registrar un movimiento.
 *
 * `getActiveSpreadsheet()` entra dentro de `spreadsheets.currentonly`.
 * `openById()` NO — ése necesita el permiso grande, y por eso no aparece aquí.
 */
function escribirFilaDePrueba(texto) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  hoja.appendRow([new Date(), VERSION_PRUEBA, String(texto || '')]);
  return 'Escrita la fila ' + hoja.getLastRow() + ' en «' + hoja.getName() + '»';
}
