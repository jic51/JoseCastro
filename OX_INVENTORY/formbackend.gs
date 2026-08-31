/**
 * ACOPIO — RECEPTOR DEL FORMULARIO DE CONTACTO
 * ============================================
 *
 * El sitio vive en GitHub Pages, que sirve archivos y nada más: no puede
 * mandar un correo. Hasta ahora el formulario abría el programa de correo del
 * visitante, que es honesto pero no es lo que la gente espera — y algunos ni
 * tienen programa de correo configurado, así que el botón no hacía nada.
 *
 * Esto es lo que recibe. Es un proyecto de Apps Script APARTE de la app: no
 * comparte hoja, ni propiedades, ni permisos con ninguna instalación de un
 * cliente. Si alguien lo ataca, lo peor que consigue es basura en una hoja de
 * prospectos.
 *
 * QUÉ HACE CON CADA ENVÍO
 *   1. Descarta los robots (campo trampa).
 *   2. Escribe la fila en una hoja.
 *   3. Te manda el correo.
 *
 * Los tres pasos en ese orden, y el correo AL FINAL a propósito: si el correo
 * falla —cuota diaria agotada, por ejemplo— el prospecto ya está guardado. Al
 * revés, un fallo al escribir se habría llevado el prospecto con él.
 *
 * Y por eso se guarda en una hoja además de mandarlo por correo: un prospecto
 * en la bandeja de entrada se pierde entre lo demás. En una hoja, no.
 *
 * ── CÓMO INSTALARLO ────────────────────────────────────────────────────────
 *
 *  1. script.google.com → Nuevo proyecto. Ponle "Acopio — Formulario".
 *  2. Borra lo que trae y pega TODO este archivo.
 *  3. Cambia NOTIFICAR_A abajo si algún día tienes correo de acopio.net.
 *  4. Implementar → Nueva implementación → tipo "Aplicación web".
 *       Ejecutar como:        Yo
 *       Quién tiene acceso:   Cualquier usuario     ← tiene que ser este
 *  5. Implementar. Google te pide permisos la primera vez: acéptalos.
 *  6. Copia la URL que termina en /exec y pásamela.
 *
 * "Cualquier usuario" suena mal y no lo es: es la única forma de que el
 * formulario de un visitante que no tiene cuenta de Google llegue a algún
 * lado. Lo único que este script sabe hacer es guardar cuatro campos y
 * mandarte un correo — no lee nada, no borra nada, y no toca la app.
 *
 * ── SI ALGO NO FUNCIONA ────────────────────────────────────────────────────
 * Abre la URL /exec en el navegador. Debe responder "Acopio form endpoint —
 * ok". Si pide iniciar sesión, el paso 4 quedó en "Solo yo": vuelve a
 * implementar con "Cualquier usuario".
 */

/** A dónde llegan los avisos. Una sola línea que cambiar el día que exista
 *  un buzón de la marca. */
var NOTIFICAR_A = 'joseisrael5101@gmail.com';

/** Nombre de la hoja donde se guardan. Se crea sola la primera vez. */
var HOJA = 'Prospectos';

/** Tope por campo. Nadie escribe su empresa en 5.000 letras; quien lo intenta
 *  no es un cliente. Cortar es más seguro que rechazar: un mensaje largo de
 *  una persona real se guarda recortado en vez de perderse. */
var MAX = 4000;

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // ── 1. El campo trampa ───────────────────────────────────────────────
    // Se llama "website" y está escondido con CSS. Una persona nunca lo ve,
    // así que nunca lo llena. Un robot rellena todo lo que encuentra.
    //
    // Se responde OK igual. Decirle a un robot que fue detectado es decirle
    // qué cambiar para el siguiente intento.
    if (String(p.website || '').trim() !== '') return _ok();

    var nombre  = _corta(p.name);
    var empresa = _corta(p.company);
    var correo  = _corta(p.email);
    var como    = _corta(p.how);

    // Sin correo no hay a quién contestarle, y sin nombre no hay a quién
    // saludar. Lo demás puede venir vacío.
    if (!correo || correo.indexOf('@') === -1) return _ok();
    if (!nombre) return _ok();

    var cuando = new Date();

    // ── 2. La hoja, antes del correo ─────────────────────────────────────
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      // Un proyecto de Apps Script suelto no tiene hoja. La primera vez se
      // crea una y su id queda guardado, así que las siguientes escriben en
      // la misma en vez de sembrar el Drive de hojas de un renglón.
      if (!ss) {
        var props = PropertiesService.getScriptProperties();
        var id = props.getProperty('LEADS_SHEET_ID');
        if (id) {
          ss = SpreadsheetApp.openById(id);
        } else {
          ss = SpreadsheetApp.create('Acopio — Prospectos');
          props.setProperty('LEADS_SHEET_ID', ss.getId());
        }
      }
      var sh = ss.getSheetByName(HOJA);
      if (!sh) {
        sh = ss.insertSheet(HOJA);
        sh.appendRow(['Fecha', 'Nombre', 'Empresa', 'Correo',
                      'Cómo llevan el inventario hoy', 'Contactado']);
        sh.setFrozenRows(1);
      }
      // La última columna se deja vacía a propósito: es tuya, para marcar a
      // quién ya llamaste. Una lista de prospectos sin eso se vuelve una
      // lista que nadie mira.
      sh.appendRow([cuando, nombre, empresa, correo, como, '']);
    } catch (errHoja) {
      // Que no se guarde no debe impedir que te enteres.
      Logger.log('No se pudo escribir en la hoja: ' + errHoja.message);
    }

    // ── 3. El correo ─────────────────────────────────────────────────────
    try {
      MailApp.sendEmail({
        to: NOTIFICAR_A,
        subject: 'Acopio — ' + (empresa || nombre) + ' pide una demostración',
        replyTo: correo,          // Responder va directo a la persona.
        htmlBody:
          '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' +
          '<p><b>' + _esc(nombre) + '</b>' +
            (empresa ? ' — ' + _esc(empresa) : '') + '</p>' +
          '<table cellpadding="6" style="border-collapse:collapse;font-size:13px">' +
            '<tr><td style="color:#666">Correo</td><td><a href="mailto:' +
              _esc(correo) + '">' + _esc(correo) + '</a></td></tr>' +
            '<tr><td style="color:#666">Empresa</td><td>' +
              _esc(empresa || '(no la puso)') + '</td></tr>' +
            '<tr><td style="color:#666">Cuándo</td><td>' +
              Utilities.formatDate(cuando, Session.getScriptTimeZone(),
                                   'dd/MM/yyyy HH:mm') + '</td></tr>' +
          '</table>' +
          '<p style="color:#666;margin-top:1rem">Cómo llevan el inventario hoy:</p>' +
          '<p style="white-space:pre-wrap;background:#f5f5f5;padding:.8rem;' +
            'border-radius:6px">' + _esc(como || '(no contestó)') + '</p>' +
          '<p style="font-size:12px;color:#666">Prometiste responder en un día ' +
            'hábil. Está escrito en tu propia página.</p></div>'
      });
    } catch (errMail) {
      Logger.log('No se pudo mandar el correo: ' + errMail.message);
    }

    return _ok();

  } catch (err) {
    // Nunca devolver un error al visitante. No hay nada que pueda hacer con
    // él, y el prospecto ya está perdido: lo único que consigue una pantalla
    // de error es que además se lleve una mala impresión.
    Logger.log('doPost: ' + err.message);
    return _ok();
  }
}

/** Para comprobar desde el navegador que la implementación quedó pública. */
function doGet() {
  return HtmlService.createHtmlOutput('Acopio form endpoint — ok');
}

/** La respuesta va a un iframe oculto: el visitante no la ve nunca. Se
 *  devuelve algo válido igual, porque una respuesta vacía se ve como un
 *  fallo en la consola del navegador de quien vaya a mirar. */
function _ok() {
  return HtmlService.createHtmlOutput('ok');
}

function _corta(v) {
  return String(v == null ? '' : v).trim().slice(0, MAX);
}

function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
