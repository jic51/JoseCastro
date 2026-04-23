// ════════════════════════════════════════════════════════════════════════════════
//  OX GLASS CO. — WMS v2  |  Code.gs
//  Improved backend: dual-tracking, Transfer/Return types, corrected stock logic
//  Author: Jose Castro  |  © 2026 OX Glass Co.
// ════════════════════════════════════════════════════════════════════════════════

// ─── ROUTING ─────────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OX Glass WMS v2')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ─── SHEET NAMES (change here only if you rename sheets) ─────────────────────
var SHEETS = {
  ARCHIVE:     'Master Archive',   // all movements ever
  LIVE_STOCK:  'LIVE_STOCK',       // maintained live view (warehouse only)
  SITE_STOCK:  'SITE_STOCK',       // NEW: per-project on-site quantities
  CONFIG:      'CONFIG.'
};

// ─── COLUMN MAP — Master Archive (0-indexed) ─────────────────────────────────
// A  B     C     D   E    F    G     H             I    J         K        L       M            N        O            P         Q     R       S
// 0  1     2     3   4    5    6     7             8    9         10       11      12           13       14           15        16    17      18
// SysDate Type  Name GC  PO#  Qty  Unit  DateReceived  Loc  Supplier  Comments  Status  Responsible  Project  MaterialID  DocLink  User  Source  Destination
// NEW columns added:
// 19 = MoveType   (ENTRY / EXIT / TRANSFER / RETURN)
// 20 = LocFrom    (explicit source rack/site)
// 21 = LocTo      (explicit destination rack/site)
// 22 = ProductDetail (for FLASHING/CAULK: specific product name)
var COL = {
  SYS_DATE:   0,  TYPE:       1,  NAME:       2,  GC:        3,
  PO:         4,  QTY:        5,  UNIT:       6,  DATE_REC:  7,
  LOC:        8,  SUPPLIER:   9,  COMMENT:   10,  STATUS:   11,
  RESP:      12,  PROJECT:   13,  MAT_ID:    14,  DOC_LINK: 15,
  USER:      16,  SOURCE:    17,  DEST:      18,
  MOVE_TYPE: 19,  LOC_FROM:  20,  LOC_TO:   21,  PRODUCT:  22
};

// ─── TYPES WITH SPECIFIC PRODUCT NAMES ───────────────────────────────────────
// For these categories, the Name field IS the product (not a job reference).
var PRODUCT_NAMED_TYPES = ['FLASHING', 'CAULK', 'SCREWS', 'TOOLS'];

// ─── INITIAL DATA LOAD ───────────────────────────────────────────────────────
function getInitialData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var archiveSheet = _getSheet(ss, SHEETS.ARCHIVE);
    if (!archiveSheet) throw new Error('Sheet "' + SHEETS.ARCHIVE + '" not found.');

    var mData    = archiveSheet.getDataRange().getValues();
    var movements = [];

    for (var j = 1; j < mData.length; j++) {
      var row = mData[j];
      if (!row[COL.TYPE] && !row[COL.NAME]) continue; // skip blank rows

      var dateRec = _formatDate(row[COL.DATE_REC]);
      var sysDate = _formatDateTime(row[COL.SYS_DATE]);

      // moveType: read from new column if present, else infer from qty sign
      var moveType = String(row[COL.MOVE_TYPE] || '').toUpperCase().trim();
      if (!moveType) {
        var qty = Number(row[COL.QTY] || 0);
        moveType = qty >= 0 ? 'ENTRY' : 'EXIT';
      }

      // locFrom / locTo: read from new cols if present, else infer from legacy Loc col
      var locFrom = String(row[COL.LOC_FROM] || '').trim();
      var locTo   = String(row[COL.LOC_TO]   || '').trim();
      var legacyLoc = String(row[COL.LOC] || '').trim();
      if (!locFrom && !locTo) {
        // Legacy migration: for ENTRY/RETURN → locTo; for EXIT/TRANSFER → locFrom+locTo
        if (moveType === 'ENTRY') {
          locTo = legacyLoc;
        } else if (moveType === 'EXIT') {
          // Legacy rows: loc is sometimes the destination address, sometimes a rack.
          // We leave locFrom blank so the frontend knows to infer it.
          locTo = legacyLoc;
        } else {
          locFrom = legacyLoc;
          locTo   = String(row[COL.DEST] || '').trim();
        }
      }

      movements.push({
        rowIdx:      j + 1,
        sysDate:     sysDate,
        moveType:    moveType,
        type:        String(row[COL.TYPE]     || '').toUpperCase().trim(),
        name:        String(row[COL.NAME]     || '').trim(),
        product:     String(row[COL.PRODUCT]  || '').trim(),
        gc:          String(row[COL.GC]       || ''),
        po:          String(row[COL.PO]       || ''),
        qty:         Number(row[COL.QTY]      || 0),
        unit:        String(row[COL.UNIT]     || ''),
        dateRec:     dateRec,
        loc:         legacyLoc,          // kept for backward compat
        locFrom:     locFrom,
        locTo:       locTo,
        supplier:    String(row[COL.SUPPLIER] || '').trim(),
        comment:     String(row[COL.COMMENT]  || ''),
        status:      String(row[COL.STATUS]   || ''),
        resp:        String(row[COL.RESP]     || ''),
        project:     String(row[COL.PROJECT]  || ''),
        docLink:     String(row[COL.DOC_LINK] || ''),
        auditUser:   String(row[COL.USER]     || 'System'),
        source:      String(row[COL.SOURCE]   || ''),
        destination: String(row[COL.DEST]     || '')
      });
    }

    return {
      movements: movements,
      config:    _getConfigLists(ss)
    };
  } catch (err) {
    throw new Error('getInitialData: ' + err.message);
  }
}

// ─── CONFIG LISTS ─────────────────────────────────────────────────────────────
function _getConfigLists(ss) {
  var sheet = _getSheet(ss, SHEETS.CONFIG) || _getSheet(ss, 'CONFIG');
  if (!sheet) return { projects: [], racks: [], suppliers: [], categories: [], locations: [] };

  var data = sheet.getDataRange().getValues();
  var config = { projects: [], racks: [], suppliers: [], categories: [], locations: [] };

  // CONFIG columns: 0=Projects, 1=Categories, 2=Suppliers, 3=Racks, 4=Location Type
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) config.projects.push(String(data[i][0]).trim());
    if (data[i][1]) config.categories.push(String(data[i][1]).trim());
    if (data[i][2]) config.suppliers.push(String(data[i][2]).trim());
    if (data[i][3]) {
      var rackName = String(data[i][3]).trim();
      // FIX: ensure every rack has a location type (default RACK, never blank)
      var locType  = data[i][4] ? String(data[i][4]).trim().toUpperCase() : 'RACK';
      config.racks.push(rackName);
      config.locations.push({ name: rackName, type: locType });
    }
  }

  // Projects are also valid locations of type PROJECT
  config.projects.forEach(function(p) {
    config.locations.push({ name: p, type: 'PROJECT' });
  });

  return config;
}

// ─── PROCESS MOVEMENT ────────────────────────────────────────────────────────
function processMovement(action, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = _getSheet(ss, SHEETS.ARCHIVE);
  if (!archiveSheet) throw new Error('"' + SHEETS.ARCHIVE + '" sheet not found.');

  var userEmail = '';
  try { userEmail = Session.getActiveUser().getEmail() || 'Unknown'; } catch(e) { userEmail = 'System'; }

  if (action === 'addMovement') return _addMovement(ss, archiveSheet, data, userEmail);
  if (action === 'updateDocument') return _updateDocument(ss, archiveSheet, data, userEmail);
  throw new Error('Unknown action: ' + action);
}

// ─── ADD MOVEMENT ─────────────────────────────────────────────────────────────
function _addMovement(ss, archiveSheet, data, userEmail) {
  var moveType = String(data.moveType || 'ENTRY').toUpperCase();
  var qty      = Number(data.qty || 0);
  var type     = String(data.type || '').toUpperCase().trim();
  var name     = String(data.name || '').trim();
  var locFrom  = String(data.locFrom || '').trim();
  var locTo    = String(data.locTo  || '').trim();

  // ── Stock validation for EXIT ─────────────────────────────────────────────
  if (moveType === 'EXIT') {
    var warehouseQty = _getWarehouseStock(archiveSheet, type, name, locFrom);
    var absQty = Math.abs(qty);
    if (warehouseQty < absQty) {
      data.comment = (data.comment || '') +
        ' [⚠️ OVER-DISPATCH: warehouse had ' + warehouseQty + ', dispatched ' + absQty + ']';
    }
  }

  // ── Build archive row ─────────────────────────────────────────────────────
  // Negative qty stored only for EXIT (legacy behaviour for backward compat)
  var storedQty = (moveType === 'EXIT') ? -Math.abs(qty) : Math.abs(qty);

  // Legacy Loc column: use locTo for ENTRY, locFrom for EXIT/TRANSFER
  var legacyLoc = (moveType === 'EXIT' || moveType === 'TRANSFER') ? locFrom : locTo;

  var newRow = new Array(23);
  newRow[COL.SYS_DATE]  = new Date();
  newRow[COL.TYPE]      = data.type;
  newRow[COL.NAME]      = name;
  newRow[COL.GC]        = data.gc        || '';
  newRow[COL.PO]        = data.po        || '';
  newRow[COL.QTY]       = storedQty;
  newRow[COL.UNIT]      = data.unit      || '';
  newRow[COL.DATE_REC]  = data.dateRec   || '';
  newRow[COL.LOC]       = legacyLoc;
  newRow[COL.SUPPLIER]  = data.supplier  || '';
  newRow[COL.COMMENT]   = data.comment   || '';
  newRow[COL.STATUS]    = data.status    || '';
  newRow[COL.RESP]      = data.resp      || '';
  newRow[COL.PROJECT]   = data.project   || '';
  newRow[COL.MAT_ID]    = '';
  newRow[COL.DOC_LINK]  = '';            // filled after file upload
  newRow[COL.USER]      = userEmail;
  newRow[COL.SOURCE]    = locFrom;
  newRow[COL.DEST]      = locTo;
  newRow[COL.MOVE_TYPE] = moveType;
  newRow[COL.LOC_FROM]  = locFrom;
  newRow[COL.LOC_TO]    = locTo;
  newRow[COL.PRODUCT]   = data.product   || '';

  archiveSheet.appendRow(newRow);
  var newRowIdx = archiveSheet.getLastRow();

  // ── Format date cell properly ─────────────────────────────────────────────
  archiveSheet.getRange(newRowIdx, COL.SYS_DATE + 1).setNumberFormat('mm/dd/yyyy hh:mm');

  // ── File uploads ──────────────────────────────────────────────────────────
  if (data.files && data.files.length > 0) {
    var docLink = _uploadFiles(data.files, name, data.po);
    if (docLink) archiveSheet.getRange(newRowIdx, COL.DOC_LINK + 1).setValue(docLink);
  }

  // ── Update LIVE_STOCK and SITE_STOCK ──────────────────────────────────────
  _updateDualStock(ss, moveType, type, name, locFrom, locTo, Math.abs(qty), data.project);

  // ── Notifications ─────────────────────────────────────────────────────────
  _checkNotifications(data, moveType, Math.abs(qty), userEmail);

  return { status: 'success', rowIdx: newRowIdx };
}

// ─── ATTACH DOCUMENT ─────────────────────────────────────────────────────────
function _updateDocument(ss, archiveSheet, data, userEmail) {
  if (!data.files || !data.files.length) throw new Error('No file provided.');
  var docLink = _uploadFiles(data.files, 'attachment', 'row-' + data.rowIdx);
  if (docLink && data.rowIdx) {
    var existing = archiveSheet.getRange(data.rowIdx, COL.DOC_LINK + 1).getValue();
    archiveSheet.getRange(data.rowIdx, COL.DOC_LINK + 1).setValue(
      existing ? existing + '\n' + docLink : docLink
    );
  }
  return { status: 'success' };
}

// ─── DUAL STOCK UPDATE ───────────────────────────────────────────────────────
// LIVE_STOCK  = warehouse quantities per rack
// SITE_STOCK  = on-site quantities per project
//
// LIVE_STOCK cols:  Category | Name | Location | Qty | Location Type | Last Updated
// SITE_STOCK cols:  Category | Name | Project  | Qty | Last Updated
function _updateDualStock(ss, moveType, type, name, locFrom, locTo, absQty, project) {
  var liveSheet = _getOrCreateSheet(ss, SHEETS.LIVE_STOCK,
    ['Category','Name','Location','Qty','Location Type','Last Updated']);
  var siteSheet = _getOrCreateSheet(ss, SHEETS.SITE_STOCK,
    ['Category','Name','Project','Qty','Last Updated']);

  var now = new Date();

  if (moveType === 'ENTRY') {
    // Add to LIVE_STOCK at locTo
    _liveStockAdjust(liveSheet, type, name, locTo, +absQty, now);

  } else if (moveType === 'EXIT') {
    // Remove from LIVE_STOCK at locFrom (or best-guess rack if locFrom is a project/address)
    _liveStockAdjust(liveSheet, type, name, locFrom, -absQty, now);
    // Add to SITE_STOCK for the project
    var proj = project || locTo || 'Unknown';
    _siteStockAdjust(siteSheet, type, name, proj, +absQty, now);

  } else if (moveType === 'TRANSFER') {
    // Move within warehouse: deduct from locFrom, add to locTo
    _liveStockAdjust(liveSheet, type, name, locFrom, -absQty, now);
    _liveStockAdjust(liveSheet, type, name, locTo,   +absQty, now);

  } else if (moveType === 'RETURN') {
    // Material coming back from site to warehouse
    var proj2 = project || locFrom || 'Unknown';
    _siteStockAdjust(siteSheet, type, name, proj2,  -absQty, now);
    _liveStockAdjust(liveSheet, type, name, locTo,  +absQty, now);
  }
}

function _liveStockAdjust(sheet, type, name, loc, delta, now) {
  if (!loc) return;
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][1]).trim() === name && String(vals[i][2]).trim() === loc) {
      var newQty = Math.max(0, (Number(vals[i][3]) || 0) + delta);
      sheet.getRange(i + 1, 4).setValue(newQty);
      sheet.getRange(i + 1, 6).setValue(now);
      sheet.getRange(i + 1, 6).setNumberFormat('mm/dd/yyyy hh:mm'); // FIX: format date properly
      return;
    }
  }
  // New row — only create if we're adding (not removing from a non-existent slot)
  if (delta > 0) {
    sheet.appendRow([type, name, loc, delta, 'RACK', now]);
    sheet.getRange(sheet.getLastRow(), 6).setNumberFormat('mm/dd/yyyy hh:mm');
  }
}

function _siteStockAdjust(sheet, type, name, project, delta, now) {
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
// Returns current warehouse qty for a specific item [+ optional rack].
// Uses Master Archive replay (not LIVE_STOCK) so it's always accurate.
function _getWarehouseStock(archiveSheet, type, name, rack) {
  var data = archiveSheet.getDataRange().getValues();
  var rackTotals = {};

  for (var j = 1; j < data.length; j++) {
    var row = data[j];
    if (!row[COL.TYPE] && !row[COL.NAME]) continue;
    if (String(row[COL.TYPE]).toUpperCase().trim() !== type) continue;
    if (String(row[COL.NAME]).trim() !== name) continue;

    var mt  = String(row[COL.MOVE_TYPE] || '').toUpperCase().trim();
    var qty = Number(row[COL.QTY] || 0);
    var lf  = String(row[COL.LOC_FROM] || row[COL.LOC] || '').trim();
    var lt  = String(row[COL.LOC_TO]   || '').trim();

    // Infer move type from qty sign for legacy rows
    if (!mt) mt = qty >= 0 ? 'ENTRY' : 'EXIT';

    if (mt === 'ENTRY') {
      var dest = lt || lf;
      rackTotals[dest] = (rackTotals[dest] || 0) + Math.abs(qty);
    } else if (mt === 'EXIT') {
      var src = lf || lt;
      rackTotals[src] = (rackTotals[src] || 0) - Math.abs(qty);
      if (rackTotals[src] < 0) rackTotals[src] = 0;
    } else if (mt === 'TRANSFER') {
      rackTotals[lf] = (rackTotals[lf] || 0) - Math.abs(qty);
      if (rackTotals[lf] < 0) rackTotals[lf] = 0;
      rackTotals[lt] = (rackTotals[lt] || 0) + Math.abs(qty);
    } else if (mt === 'RETURN') {
      rackTotals[lt] = (rackTotals[lt] || 0) + Math.abs(qty);
    }
  }

  if (rack) {
    return rackTotals[rack] || 0;
  }
  // No specific rack: total across all
  return Object.values(rackTotals).reduce(function(a, v) { return a + Math.max(0, v); }, 0);
}

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
function _uploadFiles(files, materialName, po) {
  try {
    var folderName = (materialName || 'General').replace(/[\/\\?%*:|"<>]/g, '_');
    var folder = _getOrCreateFolder('OX Glass WMS Docs/' + folderName);
    var links = [];
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
    var type = String(data.type || '').toUpperCase();

    // High-value material received
    if (moveType === 'ENTRY' && ['SHOWER', 'MIRROR', 'IGU'].indexOf(type) !== -1) {
      MailApp.sendEmail(recipient,
        '📦 High-Value Received: ' + type + ' — ' + data.name,
        'Type: ' + type + '\nItem: ' + data.name +
        '\nQty: ' + absQty + ' ' + (data.unit||'') +
        '\nLocation: ' + (data.locTo || 'N/A') +
        '\nProject: ' + (data.project || 'N/A') +
        '\nSupplier: ' + (data.supplier || 'N/A') +
        '\nLogged by: ' + userEmail
      );
    }

    // Large dispatch
    if (moveType === 'EXIT' && absQty > 20) {
      MailApp.sendEmail(recipient,
        '🚚 Large Dispatch: ' + data.name + ' (' + absQty + ' units)',
        'Dispatched: ' + absQty + ' × ' + data.name +
        '\nFrom: ' + (data.locFrom || 'N/A') +
        '\nTo: ' + (data.locTo || 'N/A') +
        '\nProject: ' + (data.project || 'N/A') +
        '\nBy: ' + (data.resp || userEmail)
      );
    }

    // Return from site (always notify so team knows)
    if (moveType === 'RETURN') {
      MailApp.sendEmail(recipient,
        '↩ Return to Warehouse: ' + data.name,
        'Returned: ' + absQty + ' × ' + data.name +
        '\nFrom site: ' + (data.locFrom || 'N/A') +
        '\nTo rack: ' + (data.locTo || 'N/A') +
        '\nProject: ' + (data.project || 'N/A') +
        '\nBy: ' + (data.resp || userEmail) +
        '\nComments: ' + (data.comment || '')
      );
    }
  } catch (e) {
    Logger.log('Notification error: ' + e.message);
  }
}

// ─── RECONCILIATION REPORT ───────────────────────────────────────────────────
// Call manually or from a menu item to compare Archive-computed stock vs LIVE_STOCK.
// Discrepancies are written to a "Reconciliation" sheet.
function runReconciliation() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = _getSheet(ss, SHEETS.ARCHIVE);
  var liveSheet    = _getSheet(ss, SHEETS.LIVE_STOCK);
  if (!archiveSheet || !liveSheet) {
    SpreadsheetApp.getUi().alert('Missing required sheets.');
    return;
  }

  // Compute expected stock from Archive
  var expected = {};     // key = "name___loc" → qty
  var archData = archiveSheet.getDataRange().getValues();

  for (var j = 1; j < archData.length; j++) {
    var row = archData[j];
    if (!row[COL.TYPE] && !row[COL.NAME]) continue;
    var name = String(row[COL.NAME] || '').trim();
    var mt   = String(row[COL.MOVE_TYPE] || '').toUpperCase().trim();
    var qty  = Number(row[COL.QTY] || 0);
    var lf   = String(row[COL.LOC_FROM] || row[COL.LOC] || '').trim();
    var lt   = String(row[COL.LOC_TO]   || '').trim();

    if (!mt) mt = qty >= 0 ? 'ENTRY' : 'EXIT';

    if (mt === 'ENTRY') {
      var k = name + '___' + (lt || lf);
      expected[k] = (expected[k] || 0) + Math.abs(qty);
    } else if (mt === 'EXIT') {
      var k2 = name + '___' + (lf || lt);
      expected[k2] = (expected[k2] || 0) - Math.abs(qty);
      if (expected[k2] < 0) expected[k2] = 0;
    } else if (mt === 'TRANSFER') {
      var k3 = name + '___' + lf;
      var k4 = name + '___' + lt;
      expected[k3] = (expected[k3] || 0) - Math.abs(qty);
      if (expected[k3] < 0) expected[k3] = 0;
      expected[k4] = (expected[k4] || 0) + Math.abs(qty);
    } else if (mt === 'RETURN') {
      var k5 = name + '___' + lt;
      expected[k5] = (expected[k5] || 0) + Math.abs(qty);
    }
  }

  // Read LIVE_STOCK actual
  var liveData = liveSheet.getDataRange().getValues();
  var actual = {};
  for (var i = 1; i < liveData.length; i++) {
    var ln   = String(liveData[i][1] || '').trim();
    var lloc = String(liveData[i][2] || '').trim();
    var lqty = Number(liveData[i][3] || 0);
    actual[ln + '___' + lloc] = lqty;
  }

  // Find discrepancies
  var discrepancies = [];
  var allKeys = new Set(Object.keys(expected).concat(Object.keys(actual)));
  allKeys.forEach(function(k) {
    var e = expected[k] || 0;
    var a = actual[k]   || 0;
    if (Math.abs(e - a) > 0) {
      var parts = k.split('___');
      discrepancies.push([parts[0], parts[1], e, a, e - a]);
    }
  });

  // Write to Reconciliation sheet
  var recSheet = _getOrCreateSheet(ss, 'Reconciliation',
    ['Name', 'Location', 'Archive (Expected)', 'LIVE_STOCK (Actual)', 'Difference']);
  recSheet.clearContents();
  recSheet.appendRow(['Name', 'Location', 'Archive (Expected)', 'LIVE_STOCK (Actual)', 'Difference']);
  if (discrepancies.length) {
    recSheet.getRange(2, 1, discrepancies.length, 5).setValues(discrepancies);
    SpreadsheetApp.getUi().alert(
      'Reconciliation complete: ' + discrepancies.length + ' discrepancies found. See "Reconciliation" sheet.'
    );
  } else {
    SpreadsheetApp.getUi().alert('✅ LIVE_STOCK is fully in sync with Master Archive. No discrepancies.');
  }
}

// ─── CUSTOM MENU ─────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏭 OX WMS')
    .addItem('Run Reconciliation', 'runReconciliation')
    .addItem('Add MoveType column headers', 'addNewColumnHeaders')
    .addToUi();
}

// Adds headers for new columns to Master Archive if not already present.
function addNewColumnHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getSheet(ss, SHEETS.ARCHIVE);
  if (!sheet) { SpreadsheetApp.getUi().alert('Archive sheet not found.'); return; }
  var headers = sheet.getRange(1, 1, 1, 23).getValues()[0];
  if (!headers[COL.MOVE_TYPE]) sheet.getRange(1, COL.MOVE_TYPE + 1).setValue('MoveType');
  if (!headers[COL.LOC_FROM])  sheet.getRange(1, COL.LOC_FROM  + 1).setValue('LocFrom');
  if (!headers[COL.LOC_TO])    sheet.getRange(1, COL.LOC_TO    + 1).setValue('LocTo');
  if (!headers[COL.PRODUCT])   sheet.getRange(1, COL.PRODUCT   + 1).setValue('ProductDetail');
  SpreadsheetApp.getUi().alert('Column headers updated.');
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
  var parts = path.split('/');
  var current = DriveApp.getRootFolder();
  parts.forEach(function(part) {
    var folders = current.getFoldersByName(part);
    current = folders.hasNext() ? folders.next() : current.createFolder(part);
  });
  return current;
}

function _formatDate(val) {
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (val) return String(val);
  return '';
}

function _formatDateTime(val) {
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');
  return '';
}
