/**
 * QUITAR LAS COMILLAS QUE DEJÓ LA v11.81.
 *
 * QUÉ PASÓ. Entre la v11.81 y la v11.86, al guardar un movimiento la app citaba
 * el texto DOS veces: una al armar la fila y otra al escribirla. Google Sheets
 * se come la primera comilla —es su marca de "esto es texto"— y guarda la
 * segunda DENTRO del valor. Por eso Jose vio en su historial:
 *
 *     'WINDOW     'JOSE JOSE     'UNIT     '16598     'B
 *
 * Y NO ERA SÓLO FEO. La identidad de un material se compone de su categoría y
 * su nombre, así que "'WINDOW|||'JOSE JOSE" no es el mismo material que
 * "WINDOW|||JOSE JOSE". Esas filas no suman con el stock anterior: el material
 * queda partido en dos.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CÓMO SE USA — PRIMERO MIRAR, LUEGO TOCAR
 *
 *   1. Abre tu hoja de cálculo → Extensiones → Apps Script.
 *   2. Archivo → Nuevo → Archivo de secuencia de comandos. Llámalo
 *      "quitar-comillas". Pega TODO este archivo dentro.
 *   3. Arriba, en el desplegable de funciones, elige  contarComillas  y dale
 *      a Ejecutar. NO CAMBIA NADA: sólo cuenta y te dice qué encontró.
 *   4. Lee el registro (Ver → Registros de ejecución). Si los números
 *      cuadran con lo que esperabas, entonces elige  quitarComillas  y
 *      ejecuta. ESE SÍ ESCRIBE.
 *   5. Borra este archivo de secuencia de comandos cuando termines. No es
 *      parte de la app y no tiene por qué quedarse.
 *
 * SE HACE EN DOS PASOS A PROPÓSITO. Una herramienta que borra en cuanto la
 * ejecutas no te deja mirar antes, y mirar antes es justo lo que hace falta
 * cuando el que escribió la herramienta ya se equivocó una vez en este mismo
 * sitio.
 *
 * LO QUE NO HACE, y conviene saberlo:
 *   · No toca las filas que ya estaban bien.
 *   · No toca números, fechas ni casillas — sólo texto que EMPIEZA por comilla.
 *   · Quita UNA comilla, no todas: si alguien escribió a mano un nombre que de
 *     verdad empieza por comilla, con dos comillas se queda con una.
 *   · Después de ejecutarlo, abre la app y pulsa "Check my data" o guarda
 *     cualquier movimiento, para que las hojas de stock se recalculen.
 * ────────────────────────────────────────────────────────────────────────────
 */

// Las hojas que el guardado escribe con filas enteras. LIVE_STOCK, SITE_STOCK y
// WASTED_STOCK NO están aquí a propósito: se reconstruyen solas desde el
// archivo, así que arreglarlas a mano sería arreglar una copia.
var HOJAS_A_LIMPIAR = [
  'MASTER_ARCHIVE_V3',
  'ARCHIVE_HISTORY',
  'MOVEMENT_TRASH',
  'INCOMING_V3'
];

/** PASO 1 — sólo mira. No escribe nada. */
function contarComillas() {
  _recorrer_(false);
}

/** PASO 2 — quita las comillas. Ejecútalo sólo después de mirar. */
function quitarComillas() {
  _recorrer_(true);
}

function _recorrer_(escribir) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var log = [];
  log.push(escribir ? '=== QUITANDO COMILLAS (esto SÍ escribe) ==='
                    : '=== SÓLO CONTANDO (no se escribe nada) ===');

  var totalCeldas = 0, totalFilas = 0;

  for (var h = 0; h < HOJAS_A_LIMPIAR.length; h++) {
    var nombre = HOJAS_A_LIMPIAR[h];
    var hoja   = ss.getSheetByName(nombre);
    if (!hoja) { log.push('  ' + nombre + ': no existe, se salta'); continue; }

    var ultimaFila = hoja.getLastRow();
    var ultimaCol  = hoja.getLastColumn();
    if (ultimaFila < 2 || ultimaCol < 1) { log.push('  ' + nombre + ': vacía'); continue; }

    // Una sola lectura y, si toca, una sola escritura. Celda a celda serían
    // miles de viajes a Google y la ejecución se quedaría sin tiempo.
    var rango  = hoja.getRange(2, 1, ultimaFila - 1, ultimaCol);
    var filas  = rango.getValues();
    var celdas = 0, filasTocadas = 0;
    var ejemplos = [];

    for (var i = 0; i < filas.length; i++) {
      var tocada = false;
      for (var j = 0; j < filas[i].length; j++) {
        var v = filas[i][j];
        if (typeof v === 'string' && v.charAt(0) === "'") {
          if (ejemplos.length < 5) ejemplos.push('fila ' + (i + 2) + ': ' + v);
          filas[i][j] = v.slice(1);
          celdas++; tocada = true;
        }
      }
      if (tocada) filasTocadas++;
    }

    log.push('  ' + nombre + ': ' + celdas + ' celda(s) con comilla, en ' +
             filasTocadas + ' fila(s) de ' + filas.length);
    for (var e = 0; e < ejemplos.length; e++) log.push('        ' + ejemplos[e]);

    if (celdas && escribir) {
      // Se vuelve a escribir con la comilla de Sheets delante —UNA— para que el
      // texto siga siendo texto. Sin ella, un PO como "07-6329" se convertiría
      // en fecha al volver a entrar, que es el fallo original de todo esto.
      for (var a = 0; a < filas.length; a++) {
        for (var b = 0; b < filas[a].length; b++) {
          var w = filas[a][b];
          if (typeof w === 'string' && w !== '') filas[a][b] = "'" + w;
        }
      }
      rango.setValues(filas);
      log.push('        → escrito.');
    }

    totalCeldas += celdas;
    totalFilas  += filasTocadas;
  }

  log.push('');
  log.push('TOTAL: ' + totalCeldas + ' celda(s) en ' + totalFilas + ' fila(s).');
  if (!escribir) {
    log.push('');
    log.push(totalCeldas
      ? 'No se ha escrito nada. Si estos números tienen sentido, ejecuta ahora quitarComillas.'
      : 'No hay nada que limpiar. Tus datos ya están bien.');
  } else {
    log.push('');
    log.push('Hecho. Abre la app y guarda cualquier movimiento (o pulsa');
    log.push('"Check my data") para que las hojas de stock se recalculen.');
  }

  Logger.log(log.join('\n'));
  try {
    SpreadsheetApp.getUi().alert(log.join('\n'));
  } catch (e) {
    // Sin interfaz (ejecutado desde el editor): el registro ya lo dice todo.
  }
}
