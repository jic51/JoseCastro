/**
 * MEDIR EL REFRESCO — v3: DOS FORMAS DE ESCRIBIR, CRONOMETRADAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ─── LO QUE YA SABEMOS, medido en la hoja de Jose el 2026-09-10 ────────────
 *
 * El refresco completo cuesta ~3,7 s (una mala racha de Google lo subió a 7,8).
 * Y los números crudos dijeron algo que ninguno de los dos esperaba:
 *
 *     leer ARCHIVE_HISTORY (0 filas):      1043 / 426 / 422 ms
 *     leer MASTER_ARCHIVE_V3 (1061 × 23):   964 / 983 / 643 ms
 *     escribir WASTED_STOCK (3 filas):      240 / 517 / 346 ms
 *     escribir LIVE_STOCK (476 filas):      393 / 428 / 507 ms
 *
 * LEER VEINTICUATRO MIL CELDAS CUESTA LO MISMO QUE LEER NADA. El precio no son
 * los datos: es el viaje a Sheets, unos 400 ms lleve lo que lleve.
 *
 * (La línea de "veredicto" de la v2 no sirve: dio tres respuestas distintas en
 * tres corridas seguidas. El ruido era más grande que la diferencia. Por eso
 * esta versión no opina — pone los dos candidatos a competir y enseña quién
 * gana.)
 *
 * ─── LO QUE ESTA VERSIÓN CONTESTA ──────────────────────────────────────────
 *
 * De ahí salió la idea de escribir cada hoja derivada de una vez en lugar de
 * `clearContents()` + `setValues()`. PERO esa idea da por hecho que cada
 * llamada es un viaje, y APPS SCRIPT AGRUPA LAS ESCRITURAS SEGUIDAS. En
 * refreshDerivedSheets_ las seis van seguidas, sin ninguna lectura en medio, así
 * que puede que ya cuesten un viaje y el cambio no ahorre NADA.
 *
 * Y la medición de la v2 tenía ese mismo error: forzaba un flush() después de
 * cada hoja, o sea que midió tres viajes donde la app real quizá paga uno.
 *
 * Así que aquí las dos formas corren de verdad, con UN SOLO flush al final —
 * como en la app — y por turnos, para que una mala racha de Google no le toque
 * siempre a la misma:
 *
 *     FORMA A (la de hoy):   clearContents() + setValues(), por cada hoja.
 *     FORMA B (la propuesta): un setValues() por hoja, rellenando con vacíos
 *                             las filas que sobran.
 *
 * Si A y B tardan lo mismo, el cambio no vale la pena y no se hace.
 *
 * También mide lo que cuesta un getLastRow(), porque el otro cambio —no leer
 * ARCHIVE_HISTORY cuando está vacía— cambia una lectura grande por uno de
 * ésos, y sólo es un ahorro si sale más barato.
 *
 * ─── CÓMO SE USA ───────────────────────────────────────────────────────────
 *
 *  1. Abre el archivo "medir" en Apps Script, borra lo que tenga y pega esto.
 *  2. Guarda 💾 → elige  medirRefresco  → Ejecutar.
 *  3. Mándame el registro entero. Si puedes, córrelo DOS O TRES VECES: Google
 *     tiene rachas y una sola corrida ya nos engañó una vez.
 *
 * ─── QUÉ ESCRIBE ───────────────────────────────────────────────────────────
 *
 * Sólo las tres hojas derivadas, y les escribe LO MISMO QUE ACABA DE LEER. Son
 * una copia calculada del archivo: aunque algo saliera mal, se rehacen enteras
 * en el siguiente guardado.
 */

function _nombresHoja_() {
  try {
    if (typeof SHEETS === 'object' && SHEETS && SHEETS.ARCHIVE) {
      return { archivo: SHEETS.ARCHIVE, historia: SHEETS.ARCHIVE_HISTORY,
               live: SHEETS.LIVE, site: SHEETS.SITE, waste: SHEETS.WASTE, deLaApp: true };
    }
  } catch (e) {}
  return { archivo: 'MASTER_ARCHIVE_V3', historia: 'ARCHIVE_HISTORY',
           live: 'LIVE_STOCK', site: 'SITE_STOCK', waste: 'WASTED_STOCK', deLaApp: false };
}

function medirRefresco() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var N  = _nombresHoja_();
  var L  = [];
  function di(t){ L.push(t); Logger.log(t); }
  function ahora(){ return new Date().getTime(); }

  di('═══ ACOPIO — las dos formas de escribir, cronometradas (v3) ═══');
  di('Hoja: ' + ss.getName() + '   ·   nombres: ' + (N.deLaApp ? 'de la app ✓' : '⚠ de respaldo'));
  di('');

  var live  = ss.getSheetByName(N.live);
  var site  = ss.getSheetByName(N.site);
  var waste = ss.getSheetByName(N.waste);
  var hist  = ss.getSheetByName(N.historia);
  if (!live || !site || !waste) {
    di('⚠ Falta alguna hoja derivada. Mándame igual este registro.');
    return L.join('\n');
  }

  // ── 1. ¿Cuánto cuesta preguntar cuántas filas hay? ───────────────────────
  //
  // El otro cambio cambia una lectura grande por uno de éstos. Si getLastRow
  // cuesta lo mismo que leer la hoja entera, no hay ahorro y no se hace.
  //
  // Con un flush() delante de cada uno: Apps Script recuerda lo que ya
  // preguntó dentro de una misma ejecución, y sin invalidar mediría cero a
  // partir del segundo.
  di('── Cuánto cuesta preguntar "¿cuántas filas tienes?" ──');
  var tsLast = [];
  for (var q = 0; q < 3; q++) {
    SpreadsheetApp.flush();
    var tq = ahora();
    var n = hist ? hist.getLastRow() : 0;
    tsLast.push(ahora() - tq);
  }
  di('  getLastRow() sobre ' + N.historia + ': ' + tsLast.join(' / ') + ' ms');
  SpreadsheetApp.flush();
  var tr = ahora();
  var filasHist = hist ? hist.getDataRange().getValues().length : 0;
  var tLeerHist = ahora() - tr;
  di('  leerla entera: ' + tLeerHist + ' ms  (' + filasHist + ' filas)');
  di('  → ahorro por no leerla cuando está vacía: ' +
     (tLeerHist - Math.min.apply(null, tsLast)) + ' ms aprox.');
  di('');

  // ── 2. Las dos formas de escribir ────────────────────────────────────────
  //
  // Los valores se leen UNA vez y se vuelven a escribir tal cual, las dos
  // formas. Ninguna cambia un dato.
  var copia = [
    { h: live,  v: live.getDataRange().getValues() },
    { h: site,  v: site.getDataRange().getValues() },
    { h: waste, v: waste.getDataRange().getValues() }
  ];

  function formaA(){                      // lo que hace la app hoy
    for (var i = 0; i < copia.length; i++) {
      var c = copia[i];
      c.h.clearContents();
      if (c.v.length && (c.v[0] || []).length) {
        c.h.getRange(1, 1, c.v.length, c.v[0].length).setValues(c.v);
      }
    }
  }

  function formaB(){                      // un setValues por hoja
    for (var i = 0; i < copia.length; i++) {
      var c = copia[i];
      if (!c.v.length || !(c.v[0] || []).length) continue;
      var ancho = c.v[0].length;
      var filas = c.v.slice();
      // Rellenar hasta donde llegaba antes, para borrar lo que sobre. Aquí las
      // filas son las mismas, así que no rellena nada — pero el código es el
      // que se usaría de verdad, no una versión simplificada que mediría otra
      // cosa.
      var hasta = c.h.getLastRow();
      while (filas.length < hasta) {
        var vacia = [];
        for (var w = 0; w < ancho; w++) vacia.push('');
        filas.push(vacia);
      }
      c.h.getRange(1, 1, filas.length, ancho).setValues(filas);
    }
  }

  di('── Las dos formas de escribir las tres hojas ──');
  di('  A = clearContents + setValues (lo de hoy)   ·   B = un setValues por hoja');
  di('  Un solo flush() al final de cada una, como en la app. Por turnos, para');
  di('  que una mala racha de Google no le toque siempre a la misma.');
  var sumaA = 0, sumaB = 0, detalle = [];
  for (var v2 = 1; v2 <= 3; v2++) {
    // A primero en las impares, B primero en las pares.
    var primero = (v2 % 2 === 1) ? 'A' : 'B';
    var ms = {};
    var orden = (primero === 'A') ? ['A', 'B'] : ['B', 'A'];
    orden.forEach(function(cual){
      SpreadsheetApp.flush();
      var t3 = ahora();
      if (cual === 'A') formaA(); else formaB();
      SpreadsheetApp.flush();
      ms[cual] = ahora() - t3;
    });
    sumaA += ms.A; sumaB += ms.B;
    detalle.push('  vuelta ' + v2 + ' (empezó ' + primero + '):  A=' + ms.A + ' ms   B=' + ms.B + ' ms');
  }
  detalle.forEach(di);
  var medA = Math.round(sumaA / 3), medB = Math.round(sumaB / 3);
  di('  media:  A=' + medA + ' ms   B=' + medB + ' ms');
  di('');

  // ── 3. El refresco completo, para tener la referencia ────────────────────
  di('── El refresco completo, como referencia ──');
  var vs = [];
  for (var v3 = 1; v3 <= 2; v3++) {
    var t4 = ahora(), err = '';
    try { refreshDerivedSheets_(ss); SpreadsheetApp.flush(); }
    catch (e) { err = ' ← FALLÓ: ' + e.message; }
    vs.push(ahora() - t4);
    di('  vuelta ' + v3 + ': ' + vs[vs.length - 1] + ' ms' + err);
  }
  di('');

  // ── 4. La lectura, sin opinar de más ─────────────────────────────────────
  di('── Qué dice esto ──');
  di('  escribir, forma de hoy (A): ' + medA + ' ms');
  di('  escribir, propuesta   (B): ' + medB + ' ms');
  var dif = medA - medB;
  var refresco = Math.round((vs[0] + vs[1]) / 2);
  if (Math.abs(dif) < Math.max(150, medA * 0.15)) {
    di('  → EMPATE. Apps Script ya agrupa las escrituras seguidas, así que el');
    di('    cambio no ahorraría nada y NO SE HACE.');
  } else if (dif > 0) {
    di('  → B gana por ' + dif + ' ms, un ' + Math.round(dif / refresco * 100) +
       '% del refresco completo (' + refresco + ' ms).');
  } else {
    di('  → A gana por ' + (-dif) + ' ms. La propuesta es PEOR y no se hace.');
  }
  di('');
  di('── Mándame este texto entero. Y si puedes, córrelo 2 o 3 veces ──');

  return L.join('\n');
}
