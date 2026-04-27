// ════════════════════════════════════════════════════════════════════════════════
//  OX GLASS CO. — WMS v2  |  Code.gs
//  Author: Jose Castro  |  © 2026 OX Glass Co.
// ════════════════════════════════════════════════════════════════════════════════

// ─── ROUTING ─────────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OX Glass WMS v2')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ─── SHEET NAMES ─────────────────────────────────────────────────────────────
var SHEETS = {
  ARCHIVE:    'Master Archive',
  LIVE_STOCK: 'LIVE_STOCK',
  SITE_STOCK: 'SITE_STOCK',  // created automatically on first use
  CONFIG:     'CONFIG.'
};

// ─── COLUMN MAP — Master Archive (0-indexed) ─────────────────────────────────
//
//  A         B      C     D   E    F    G     H             I         J         K         L       M             N         O           P         Q     R              S
//  0         1      2     3   4    5    6     7             8         9         10        11      12            13        14          15        16    17             18
//  SysDate  Type   Name  GC  PO#  Qty  Unit  DateReceived  Location  Supplier  Comments  Status  Responsible   Project   MaterialID  DocLink   User  Destination    MoveType
//
//  Column R (Source) has been removed — it was never consistently used
//  and was redundant with Location (I).
//
//  Location (I): the physical rack.
//    ENTRY / RETURN  → rack where material ARRIVES
//    EXIT / TRANSFER → rack where material LEAVES FROM
//
//  Destination (R, now index 17): only populated when material moves OUT.
//    EXIT     → project name or delivery address
//    TRANSFER → destination rack
//    ENTRY/RETURN → left blank
//
//  MoveType (S, index 18): ENTRY | EXIT | TRANSFER | RETURN  ← only new column

var COL = {
  SYS_DATE:  0,  TYPE:      1,  NAME:      2,  GC:       3,
  PO:        4,  QTY:       5,  UNIT:      6,  DATE_REC: 7,
  LOC:       8,  SUPPLIER:  9,  COMMENT:  10,  STATUS:  11,
  RESP:     12,  PROJECT:  13,  MAT_ID:   14,  DOC_LINK:15,
  USER:     16,  DEST:     17,  MOVE_TYPE:18
};

// ─── INITIAL DATA LOAD ───────────────────────────────────────────────────────
function getInitialData() {
  try {
    var ss           = SpreadsheetApp.getActiveSpreadsheet();
    var archiveSheet = _getSheet(ss, SHEETS.ARCHIVE);
    if (!archiveSheet) throw new Error('Sheet "' + SHEETS.ARCHIVE + '" not found.');

    var mData     = archiveSheet.getDataRange().getValues();
    var movements = [];

    for (var j = 1; j < mData.length; j++) {
      var row = mData[j];
      if (!row[COL.TYPE] && !row[COL.NAME]) continue;

      var qty  = Number(row[COL.QTY]  || 0);
      var loc  = String(row[COL.LOC]  || '').trim();
      var dest = String(row[COL.DEST] || '').trim();

      // MoveType: read col S if present, infer from qty sign for legacy rows
      var moveType = String(row[COL.MOVE_TYPE] || '').toUpperCase().trim();
      if (!moveType) moveType = qty >= 0 ? 'ENTRY' : 'EXIT';

      movements.push({
        rowIdx:      j + 1,
        sysDate:     _formatDateTime(row[COL.SYS_DATE]),
        moveType:    moveType,
        type:        String(row[COL.TYPE]     || '').toUpperCase().trim(),
        name:        String(row[COL.NAME]     || '').trim(),
        gc:          String(row[COL.GC]       || ''),
        po:          String(row[COL.PO]       || ''),
        qty:         qty,
        unit:        String(row[COL.UNIT]     || ''),
        dateRec:     _formatDate(row[COL.DATE_REC]),
        loc:         loc,
        destination: dest,
        supplier:    String(row[COL.SUPPLIER] || '').trim(),
        comment:     String(row[COL.COMMENT]  || ''),
        status:      String(row[COL.STATUS]   || ''),
        resp:        String(row[COL.RESP]     || ''),
        project:     String(row[COL.PROJECT]  || ''),
        docLink:     String(row[COL.DOC_LINK] || ''),
        auditUser:   String(row[COL.USER]     || 'System')
      });
    }

    return { movements: movements, config: _getConfigLists(ss) };

  } catch (err) {
    throw new Error('getInitialData: ' + err.message);
  }
}

// ─── CONFIG LISTS ─────────────────────────────────────────────────────────────
function _getConfigLists(ss) {
  var sheet = _getSheet(ss, SHEETS.CONFIG) || _getSheet(ss, 'CONFIG');
  if (!sheet) return { projects: [], racks: [], suppliers: [], categories: [], locations: [] };

  var data   = sheet.getDataRange().getValues();
  var config = { projects: [], racks: [], suppliers: [], categories: [], locations: [] };

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) config.projects.push(String(data[i][0]).trim());
    if (data[i][1]) config.categories.push(String(data[i][1]).trim());
    if (data[i][2]) config.suppliers.push(String(data[i][2]).trim());
    if (data[i][3]) {
      var rackName = String(data[i][3]).trim();
      var locType  = data[i][4] ? String(data[i][4]).trim().toUpperCase() : 'RACK';
      config.racks.push(rackName);
      config.locations.push({ name: rackName, type: locType });
    }
  }

  config.projects.forEach(function(p) {
    config.locations.push({ name: p, type: 'PROJECT' });
  });

  return config;
}

// ─── PROCESS MOVEMENT ────────────────────────────────────────────────────────
function processMovement(action, data) {
  var ss           = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = _getSheet(ss, SHEETS.ARCHIVE);
  if (!archiveSheet) throw new Error('"' + SHEETS.ARCHIVE + '" not found.');

  var userEmail = 'System';
  try { userEmail = Session.getActiveUser().getEmail() || 'System'; } catch(e) {}

  if (action === 'addMovement')    return _addMovement(ss, archiveSheet, data, userEmail);
  if (action === 'updateDocument') return _updateDocument(archiveSheet, data);
  throw new Error('Unknown action: ' + action);
}

// ─── ADD MOVEMENT ─────────────────────────────────────────────────────────────
//
//  Fields collected per MoveType (frontend enforces this, backend stores what it receives):
//
//  ENTRY    → Type, Name, Qty, Unit, Date, Location(rack), Supplier, PO, GC, Project, Responsible, Comments, Files
//  EXIT     → Type, Name, Qty, Unit, Date, Location(rack), Destination(project/address), Responsible, Comments
//  TRANSFER → Type, Name, Qty, Unit, Date, Location(source rack), Destination(dest rack), Responsible, Comments
//  RETURN   → Type, Name, Qty, Unit, Date, Location(site/project), Destination(return rack), Responsible, Comments
//
function _addMovement(ss, archiveSheet, data, userEmail) {
  var moveType = String(data.moveType || 'ENTRY').toUpperCase();
  var absQty   = Math.abs(Number(data.qty || 0));
  var type     = String(data.type || '').toUpperCase().trim();
  var name     = String(data.name || '').trim();
  var loc      = String(data.loc  || '').trim();
  var dest     = String(data.dest || '').trim();

  // Over-dispatch guard — only for EXIT
  if (moveType === 'EXIT') {
    var available = _getWarehouseStock(archiveSheet, type, name, loc);
    if (available < absQty) {
      data.comment = (data.comment || '') +
        ' [⚠️ OVER-DISPATCH: only ' + available + ' in warehouse at ' + loc + ', dispatched ' + absQty + ']';
    }
  }

  // Qty sign: negative for EXIT only (backward compat with legacy rows)
  var storedQty = (moveType === 'EXIT') ? -absQty : absQty;

  // ── Write row (19 columns: A through S) ──────────────────────────────────
  var newRow = [
    new Date(),           // A  SysDate
    data.type,            // B  Type
    name,                 // C  Name
    data.gc        || '', // D  GC          — populated on ENTRY only
    data.po        || '', // E  PO#         — populated on ENTRY only
    storedQty,            // F  Qty
    data.unit      || '', // G  Unit
    data.dateRec   || '', // H  Date
    loc,                  // I  Location    — source rack (EXIT/TRANSFER) or dest rack (ENTRY/RETURN)
    data.supplier  || '', // J  Supplier    — populated on ENTRY only
    data.comment   || '', // K  Comments
    data.status    || '', // L  Status
    data.resp      || '', // M  Responsible
    data.project   || '', // N  Project     — populated on ENTRY only
    '',                   // O  MaterialID  (reserved)
    '',                   // P  DocLink     (filled after upload)
    userEmail,            // Q  User
    dest,                 // R  Destination — EXIT: project/address · TRANSFER: dest rack · blank otherwise
    moveType              // S  MoveType    ← only new column
  ];

  archiveSheet.appendRow(newRow);
  var newRowIdx = archiveSheet.getLastRow();

  // Fix date format (prevents serial-number display bug)
  archiveSheet.getRange(newRowIdx, COL.SYS_DATE + 1).setNumberFormat('mm/dd/yyyy hh:mm');

  // File uploads
  if (data.files && data.files.length > 0) {
    var docLink = _uploadFiles(data.files, name, data.po);
    if (docLink) archiveSheet.getRange(newRowIdx, COL.DOC_LINK + 1).setValue(docLink);
  }

  // Update LIVE_STOCK + SITE_STOCK
  _updateDualStock(ss, moveType, type, name, loc, dest, absQty, data.project);

  // Notifications
  _checkNotifications(data, moveType, absQty, userEmail);

  return { status: 'success', rowIdx: newRowIdx };
}

// ─── ATTACH DOCUMENT ─────────────────────────────────────────────────────────
function _updateDocument(archiveSheet, data) {
  if (!data.files || !data.files.length) throw new Error('No file provided.');
  var docLink = _uploadFiles(data.files, 'attachment', 'row-' + data.rowIdx);
  if (docLink && data.rowIdx) {
    var existing = archiveSheet.getRange(data.rowIdx, COL.DOC_LINK + 1).getValue();
    archiveSheet.getRange(data.rowIdx, COL.DOC_LINK + 1)
      .setValue(existing ? existing + '\n' + docLink : docLink);
  }
  return { status: 'success' };
}

// ─── DUAL STOCK UPDATE ───────────────────────────────────────────────────────
//
//  LIVE_STOCK  cols: Category | Name | Location | Qty | Location Type | Last Updated
//  SITE_STOCK  cols: Category | Name | Project  | Qty | Last Updated
//
function _updateDualStock(ss, moveType, type, name, loc, dest, absQty, project) {
  var liveSheet = _getOrCreateSheet(ss, SHEETS.LIVE_STOCK,
    ['Category','Name','Location','Qty','Location Type','Last Updated']);
  var siteSheet = _getOrCreateSheet(ss, SHEETS.SITE_STOCK,
    ['Category','Name','Project','Qty','Last Updated']);
  var now = new Date();

  if (moveType === 'ENTRY') {
    // loc = destination rack
    _liveAdjust(liveSheet, type, name, loc, +absQty, now);

  } else if (moveType === 'EXIT') {
    // loc = source rack · project/dest gets the qty on-site
    _liveAdjust(liveSheet, type, name, loc,             -absQty, now);
    _siteAdjust(siteSheet, type, name, project || dest, +absQty, now);

  } else if (moveType === 'TRANSFER') {
    // loc = source rack · dest = destination rack
    _liveAdjust(liveSheet, type, name, loc,  -absQty, now);
    _liveAdjust(liveSheet, type, name, dest, +absQty, now);

  } else if (moveType === 'RETURN') {
    // loc = site/project returning from · dest = rack receiving it
    _siteAdjust(siteSheet, type, name, project || loc, -absQty, now);
    _liveAdjust(liveSheet, type, name, dest,           +absQty, now);
  }
}

function _liveAdjust(sheet, type, name, loc, delta, now) {
  if (!loc) return;
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][1]).trim() === name && String(vals[i][2]).trim() === loc) {
      var newQty = Math.max(0, (Number(vals[i][3]) || 0) + delta);
      sheet.getRange(i + 1, 4).setValue(newQty);
      sheet.getRange(i + 1, 6).setValue(now);
      sheet.getRange(i + 1, 6).setNumberFormat('mm/dd/yyyy hh:mm');
      return;
    }
  }
  if (delta > 0) {
    sheet.appendRow([type, name, loc, delta, 'RACK', now]);
    sheet.getRange(sheet.getLastRow(), 6).setNumberFormat('mm/dd/yyyy hh:mm');
  }
}

function _siteAdjust(sheet, type, name, project, delta, now) {
  if (!project) return;
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][1]).trim() === name && String(vals[i][2]).trim() === project) {
      var newQty = Math.max(0, (Number(vals[i][3]) || 0) + delta);
      sheet.getRange(i + 1, 4).setValue(newQty);
      sheet.getRange(i + 1, 5).setValue(now);
      sheet.getRange(i + 1, 5).setNumberFormat('mm/dd/yyyy hh:mm');
      return;
    }
  }
  if (delta > 0) {
    sheet.appendRow([type, name, project, delta, now]);
    sheet.getRange(sheet.getLastRow(), 5).setNumberFormat('mm/dd/yyyy hh:mm');
  }
}

// ─── WAREHOUSE STOCK QUERY ────────────────────────────────────────────────────
function _getWarehouseStock(archiveSheet, type, name, rack) {
  var data       = archiveSheet.getDataRange().getValues();
  var rackTotals = {};

  for (var j = 1; j < data.length; j++) {
    var row = data[j];
    if (String(row[COL.TYPE] || '').toUpperCase().trim() !== type) continue;
    if (String(row[COL.NAME] || '').trim()               !== name) continue;

    var qty  = Number(row[COL.QTY]       || 0);
    var mt   = String(row[COL.MOVE_TYPE] || '').toUpperCase().trim();
    var loc  = String(row[COL.LOC]       || '').trim();
    var dest = String(row[COL.DEST]      || '').trim();
    if (!mt) mt = qty >= 0 ? 'ENTRY' : 'EXIT';

    if (mt === 'ENTRY') {
      rackTotals[loc]  = (rackTotals[loc]  || 0) + Math.abs(qty);
    } else if (mt === 'EXIT') {
      rackTotals[loc]  = (rackTotals[loc]  || 0) - Math.abs(qty);
      if (rackTotals[loc] < 0) rackTotals[loc] = 0;
    } else if (mt === 'TRANSFER') {
      rackTotals[loc]  = (rackTotals[loc]  || 0) - Math.abs(qty);
      if (rackTotals[loc] < 0) rackTotals[loc] = 0;
      rackTotals[dest] = (rackTotals[dest] || 0) + Math.abs(qty);
    } else if (mt === 'RETURN') {
      rackTotals[dest] = (rackTotals[dest] || 0) + Math.abs(qty);
    }
  }

  if (rack) return rackTotals[rack] || 0;
  return Object.values(rackTotals).reduce(function(a, v) { return a + Math.max(0, v); }, 0);
}

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
function _uploadFiles(files, materialName, po) {
  try {
    var safeName = (materialName || 'General').replace(/[\/\\?%*:|"<>]/g, '_');
    var folder   = _getOrCreateFolder('OX Glass WMS Docs/' + safeName);
    var links    = [];
    files.forEach(function(f) {
      if (!f.fileData) return;
      var blob = Utilities.newBlob(Utilities.base64Decode(f.fileData), f.fileMimeType, f.fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links.push(file.getUrl());
    });
    return links.join('\n');
  } catch (e) {
    Logger.log('File upload error: ' + e.message);
    return '';
  }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function _checkNotifications(data, moveType, absQty, userEmail) {
  try {
    var recipient = 'jose@ox-glass.com';
    var type      = String(data.type || '').toUpperCase();

    if (moveType === 'ENTRY' && ['SHOWER','MIRROR','IGU'].indexOf(type) !== -1) {
      MailApp.sendEmail(recipient,
        '📦 High-Value Received: ' + type + ' — ' + data.name,
        'Type: '     + type +
        '\nItem: '   + data.name +
        '\nQty: '    + absQty + ' ' + (data.unit || '') +
        '\nRack: '   + (data.loc     || 'N/A') +
        '\nProject: '+ (data.project || 'N/A') +
        '\nSupplier: '+(data.supplier|| 'N/A') +
        '\nBy: '     + userEmail
      );
    }

    if (moveType === 'EXIT' && absQty > 20) {
      MailApp.sendEmail(recipient,
        '🚚 Large Dispatch: ' + data.name + ' (' + absQty + ' units)',
        'Item: '      + data.name +
        '\nQty: '     + absQty +
        '\nFrom: '    + (data.loc  || 'N/A') +
        '\nTo: '      + (data.dest || 'N/A') +
        '\nBy: '      + (data.resp || userEmail)
      );
    }

    if (moveType === 'RETURN') {
      MailApp.sendEmail(recipient,
        '↩ Return to Warehouse: ' + data.name,
        'Item: '       + data.name +
        '\nQty: '      + absQty +
        '\nFrom site: '+ (data.loc  || 'N/A') +
        '\nTo rack: '  + (data.dest || 'N/A') +
        '\nBy: '       + (data.resp || userEmail) +
        '\nComments: ' + (data.comment || '')
      );
    }
  } catch (e) {
    Logger.log('Notification error: ' + e.message);
  }
}

// ─── RECONCILIATION ───────────────────────────────────────────────────────────
function runReconciliation() {
  var ss           = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = _getSheet(ss, SHEETS.ARCHIVE);
  var liveSheet    = _getSheet(ss, SHEETS.LIVE_STOCK);
  if (!archiveSheet || !liveSheet) {
    SpreadsheetApp.getUi().alert('Missing required sheets.'); return;
  }

  var expected = {};
  var data     = archiveSheet.getDataRange().getValues();

  for (var j = 1; j < data.length; j++) {
    var row  = data[j];
    if (!row[COL.TYPE] && !row[COL.NAME]) continue;
    var name = String(row[COL.NAME] || '').trim();
    var qty  = Number(row[COL.QTY]  || 0);
    var mt   = String(row[COL.MOVE_TYPE] || '').toUpperCase().trim();
    var loc  = String(row[COL.LOC]  || '').trim();
    var dest = String(row[COL.DEST] || '').trim();
    if (!mt) mt = qty >= 0 ? 'ENTRY' : 'EXIT';

    if (mt === 'ENTRY') {
      expected[name+'___'+loc]  = (expected[name+'___'+loc]  || 0) + Math.abs(qty);
    } else if (mt === 'EXIT') {
      expected[name+'___'+loc]  = (expected[name+'___'+loc]  || 0) - Math.abs(qty);
      if (expected[name+'___'+loc] < 0) expected[name+'___'+loc] = 0;
    } else if (mt === 'TRANSFER') {
      expected[name+'___'+loc]  = (expected[name+'___'+loc]  || 0) - Math.abs(qty);
      if (expected[name+'___'+loc] < 0) expected[name+'___'+loc] = 0;
      expected[name+'___'+dest] = (expected[name+'___'+dest] || 0) + Math.abs(qty);
    } else if (mt === 'RETURN') {
      expected[name+'___'+dest] = (expected[name+'___'+dest] || 0) + Math.abs(qty);
    }
  }

  var liveData = liveSheet.getDataRange().getValues();
  var actual   = {};
  for (var i = 1; i < liveData.length; i++) {
    var k = String(liveData[i][1]||'').trim() + '___' + String(liveData[i][2]||'').trim();
    actual[k] = Number(liveData[i][3] || 0);
  }

  var allKeys       = Object.keys(expected).concat(Object.keys(actual))
                        .filter(function(v,i,a){ return a.indexOf(v) === i; });
  var discrepancies = [];
  allKeys.forEach(function(k) {
    var e = expected[k] || 0;
    var a = actual[k]   || 0;
    if (Math.abs(e - a) > 0) {
      var parts = k.split('___');
      discrepancies.push([parts[0], parts[1], e, a, e - a]);
    }
  });

  var recSheet = _getOrCreateSheet(ss, 'Reconciliation',
    ['Name','Location','Archive (Expected)','LIVE_STOCK (Actual)','Difference']);
  recSheet.clearContents();
  recSheet.appendRow(['Name','Location','Archive (Expected)','LIVE_STOCK (Actual)','Difference']);
  if (discrepancies.length) {
    recSheet.getRange(2, 1, discrepancies.length, 5).setValues(discrepancies);
    SpreadsheetApp.getUi().alert(discrepancies.length + ' discrepancies found. See "Reconciliation" sheet.');
  } else {
    SpreadsheetApp.getUi().alert('✅ LIVE_STOCK is fully in sync with Master Archive.');
  }
}

// ─── CUSTOM MENU ─────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏭 OX WMS')
    .addItem('Run Reconciliation',     'runReconciliation')
    .addItem('Add MoveType column (S)','addMoveTypeHeader')
    .addToUi();
}

// Adds only the MoveType header to col S (index 18) if not already present.
// This is the ONLY new column — Source(R) removed, Destination(R) already existed.
function addMoveTypeHeader() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getSheet(ss, SHEETS.ARCHIVE);
  if (!sheet) { SpreadsheetApp.getUi().alert('Master Archive sheet not found.'); return; }

  var headers = sheet.getRange(1, 1, 1, 19).getValues()[0];
  if (!headers[COL.MOVE_TYPE]) {
    sheet.getRange(1, COL.MOVE_TYPE + 1).setValue('MoveType');
    SpreadsheetApp.getUi().alert(
      'Done. Column S now has the header "MoveType".\n' +
      'Existing rows without this value will be read as ENTRY or EXIT based on their Qty sign (positive = ENTRY, negative = EXIT).'
    );
  } else {
    SpreadsheetApp.getUi().alert('MoveType header already exists — nothing changed.');
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function _getSheet(ss, name) {
  return ss.getSheetByName(name);
}

function _getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

function _getOrCreateFolder(path) {
  var parts   = path.split('/');
  var current = DriveApp.getRootFolder();
  parts.forEach(function(part) {
    var folders = current.getFoldersByName(part);
    current = folders.hasNext() ? folders.next() : current.createFolder(part);
  });
  return current;
}

function _formatDate(val) {
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return val ? String(val) : '';
}

function _formatDateTime(val) {
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');
  return '';
}