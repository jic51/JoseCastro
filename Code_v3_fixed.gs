// ════════════════════════════════════════════════════════════════════════════════
//  OX GLASS CO. — WMS v3.0  |  Code.gs  (FIXED)
//  Fixes: ENTRY destLoc, calculateStock siteQty, EXIT/DISPATCH unified,
//         RETURN logic, custom on-demand notifications, WASTE-only auto-email
// ════════════════════════════════════════════════════════════════════════════════

var SHEETS = {
  ARCHIVE: 'MASTER_ARCHIVE_V3',
  LIVE: 'LIVE_STOCK',
  SITE: 'SITE_STOCK',
  RESERVATIONS: 'RESERVATIONS',
  CONFIG: 'CONFIG',
  AUDIT: 'AUDIT_LOG'
};

// Column map matches the ACTUAL sheet structure (19 columns, 0-indexed):
//  A=0:Timestamp  B=1:Type(Category)  C=2:Name  D=3:GC  E=4:PO#  F=5:Qty
//  G=6:Unit  H=7:DateRec  I=8:Loc(SrcLoc)  J=9:Supplier  K=10:Comments
//  L=11:Status  M=12:Responsible  N=13:Project  O=14:MatID  P=15:DocLinks
//  Q=16:UserEmail  R=17:Destination(DestLoc)  S=18:MoveType
var AC = {
  TIMESTAMP:0,  CATEGORY:1,  NAME:2,     GC:3,        PO:4,
  QTY:5,        UNIT:6,      DATE_REC:7, SRC_LOC:8,   SUPPLIER:9,
  COMMENTS:10,  STATUS:11,   RESPONSIBLE:12, PROJECT:13, MAT_ID:14,
  DOC_LINKS:15, USER_EMAIL:16, DEST_LOC:17,  MOVETYPE:18
};

// ─── ROUTING ─────────────────────────────────────────────────────────────────
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OX Glass Co. — WMS v3.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
// Deployment required: "Execute as: User accessing the web app" +
//                      "Anyone with a Google account"
//
// Lookup order:
//   1. USERS_V3 sheet  (managed via in-app admin panel)
//   2. CONFIG sheet    (legacy — existing rows still work)
// Unknown emails → DENIED (admin must register the user first).
function getUserRole() {
  var email = '';
  try { email = Session.getActiveUser().getEmail(); } catch(e) { email = ''; }
  if (!email) {
    try { email = Session.getEffectiveUser().getEmail(); } catch(e2) { email = ''; }
  }
  if (!email) return { role: 'NO_SESSION', email: '' };

  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var userEmail = email.toLowerCase().trim();

  // ── 1. Check USERS_V3 (new in-app user management) ─────────────────────
  var usersSheet = ss.getSheetByName('USERS_V3');
  if (usersSheet && usersSheet.getLastRow() > 1) {
    var uRows = usersSheet.getDataRange().getValues();
    for (var u = 1; u < uRows.length; u++) {
      var uEmail  = String(uRows[u][1] || '').toLowerCase().trim(); // col B
      var uActive = uRows[u][6];                                    // col G
      var isActive = (uActive === true || String(uActive).toUpperCase() === 'TRUE' || uActive === '');
      if (uEmail && uEmail === userEmail && isActive) {
        return {
          role:     String(uRows[u][3] || 'WAREHOUSE').toUpperCase().trim(), // col D
          email:    email,
          name:     String(uRows[u][2] || '').trim()                         // col C
        };
      }
    }
  }

  // ── 2. Fallback: CONFIG sheet (legacy rows) ──────────────────────────────
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (cfg) {
    var cRows = cfg.getDataRange().getValues();
    for (var c = 1; c < cRows.length; c++) {
      var cEmail = String(cRows[c][5] || '').toLowerCase().trim();
      if (cEmail && cEmail === userEmail) {
        return { role: String(cRows[c][6] || 'WAREHOUSE').toUpperCase().trim(), email: email, name: '' };
      }
    }
  }

  return { role: 'DENIED', email: email };
}

// ─── CONFIG LOADER ───────────────────────────────────────────────────────────
function loadConfig() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) return {};
  var data = cfg.getDataRange().getValues();
  var c = { projects: [], categories: [], suppliers: [], locations: [], users: [], trucks: [], minStock: {} };

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) c.projects.push(String(row[0]).trim());
    if (row[1]) c.categories.push(String(row[1]).trim());
    if (row[2]) c.suppliers.push(String(row[2]).trim());
    if (row[3]) {
      var loc  = String(row[3]).trim();
      var type = row[4] ? String(row[4]).trim().toUpperCase() : 'RACK';
      c.locations.push({ name: loc, type: type });
    }
    if (row[5]) c.users.push({ email: String(row[5]).trim(), role: String(row[6] || 'WAREHOUSE').toUpperCase() });
    if (row[7] && i === 1) c.adminEmail = String(row[7]).trim();
    if (row[8]) {
      c.trucks.push({
        name:   String(row[8]  || '').trim(),
        person: String(row[9]  || '').trim(),
        status: String(row[10] || 'ACTIVE').toUpperCase()
      });
    }
    if (row[11] && row[12]) {
      c.minStock[String(row[11]).toUpperCase().trim()] = Number(row[12]) || 0;
    }
  }
  if (!c.adminEmail) c.adminEmail = 'jose@ox-glass.com';
  return c;
}

function normalizeString(str) {
  return String(str || '')
    .toUpperCase()
    .trim()
    // Collapse any whitespace sequence (tabs, multiple spaces) to one space
    .replace(/\s+/g, ' ')
    // Remove or neutralize characters that create false variants:
    //   commas/periods/apostrophes that people sometimes add/omit
    .replace(/[,.'`]/g, '')
    // Collapse again after removals (e.g. "4-IN" → "4 IN" not "4  IN")
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Finally sanitize filesystem-unsafe chars
    .replace(/[\/\\?%*:|"<>]/g, '_');
}

// Convert a spreadsheet cell value to a plain string.
// Sheets sometimes auto-converts PO# fields like "01-04-25" to a Date object.
// This function returns empty string for Date values (better than a timestamp dump).
function _safeStr(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) return '';  // don't show garbled dates where text is expected
  return String(val).trim();
}

function getMaterialId(cat, name) {
  return normalizeString(cat) + '|||' + normalizeString(name);
}

function getLegacyMaterialId(cat, name, proj) {
  return normalizeString(cat) + '|||' + normalizeString(name) + '|||' + normalizeString(proj);
}

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
function getInitialData() {
  try {
    var auth = getUserRole();

    // Not authenticated with Google at all (wrong deployment mode)
    if (auth.role === 'NO_SESSION') {
      return { accessStatus: 'NO_SESSION', userEmail: '', userRole: 'NO_SESSION' };
    }
    // Authenticated but not registered in CONFIG
    if (auth.role === 'DENIED') {
      return { accessStatus: 'DENIED', userEmail: auth.email, userRole: 'DENIED' };
    }

    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var archive  = ss.getSheetByName(SHEETS.ARCHIVE);
    var resSheet = ss.getSheetByName(SHEETS.RESERVATIONS);
    var config   = loadConfig();

    var movements = [];
    if (archive) {
      var data = archive.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        var row = data[j];
        if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
        movements.push(parseArchiveRow(row, j + 1));
      }
    }

    var reservations = [];
    if (resSheet) {
      var rData = resSheet.getDataRange().getValues();
      for (var k = 1; k < rData.length; k++) {
        var r = rData[k];
        if (!r[0]) continue;
        reservations.push({
          id: String(r[0]), category: String(r[1]||''), name: String(r[2]||''),
          project: String(r[3]||''), qty: Number(r[4]||0), by: String(r[5]||''),
          date: String(r[6]||''), status: String(r[7]||'Active'), release: String(r[8]||'')
        });
      }
    }

    var stock = calculateStock(movements, reservations);

    // Register this user's presence and return active users list
    var activeUsers = [];
    try { activeUsers = heartbeat(); } catch(e) {}

    // Incoming materials + monitored-materials filter
    var incoming = [];
    try { incoming = getIncoming(); } catch(e) { Logger.log('getIncoming: ' + e.message); }
    var monitoredMaterials = null;
    try { monitoredMaterials = getMonitoredMaterials(); } catch(e) {}

    // User list — only sent to ADMINs
    var users = [];
    if (auth.role === 'ADMIN') {
      try { users = getUsers(auth); } catch(e) {}
    }

    return {
      movements:          movements,
      stock:              stock,
      config:             config,
      reservations:       reservations,
      userRole:           auth.role,
      userName:           auth.name || '',
      userEmail:          auth.email,
      activeUsers:        activeUsers,
      incoming:           incoming,
      monitoredMaterials: monitoredMaterials,
      users:              users
    };
  } catch (err) {
    throw new Error('getInitialData: ' + err.message);
  }
}

function parseArchiveRow(row, rowIdx) {
  var ts = '';
  if (row[AC.TIMESTAMP] instanceof Date) {
    ts = Utilities.formatDate(row[AC.TIMESTAMP], Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');
  }
  var dt = '';
  if (row[AC.DATE_REC] instanceof Date) {
    dt = Utilities.formatDate(row[AC.DATE_REC], Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } else if (row[AC.DATE_REC]) {
    dt = String(row[AC.DATE_REC]);
  }
  // Normalize MoveType — legacy data uses "DISPATCHED", negative QTY, or empty col S
  var rawMT     = String(row[AC.MOVETYPE] || '').toUpperCase().trim();
  var rawQty    = Number(row[AC.QTY] || 0);
  var rawStatus = String(row[AC.STATUS]   || '').toUpperCase().trim();
  var mt;
  if (!rawMT || rawMT === 'IN STOCK') {
    // No MoveType stored — derive from QTY sign or Status
    mt = (rawQty < 0 || rawStatus === 'DISPATCHED' || rawStatus === 'DISPATCH') ? 'EXIT' : 'ENTRY';
  } else if (rawMT === 'DISPATCHED' || rawMT === 'DISPATCH' || rawMT === 'DEL') {
    mt = 'EXIT';
  } else {
    mt = rawMT; // ENTRY, EXIT, TRANSFER, RETURN, WASTE — already correct
  }

  return {
    rowIdx:      rowIdx,
    timestamp:   ts,
    moveType:    mt,
    category:    String(row[AC.CATEGORY]    || '').toUpperCase().trim(),
    name:        String(row[AC.NAME]        || '').trim(),
    project:     String(row[AC.PROJECT]     || '').trim(),
    gc:          String(row[AC.GC]          || ''),
    po:          String(row[AC.PO]          || ''),
    qty:         Math.abs(rawQty),
    unit:        String(row[AC.UNIT]        || ''),
    dateRec:     dt,
    sourceLoc:   String(row[AC.SRC_LOC]    || '').trim(),
    destLoc:     String(row[AC.DEST_LOC]   || '').trim(),
    supplier:    String(row[AC.SUPPLIER]    || ''),
    comments:    String(row[AC.COMMENTS]   || ''),
    status:      String(row[AC.STATUS]     || ''),
    responsible: String(row[AC.RESPONSIBLE]|| ''),
    matId:       String(row[AC.MAT_ID]     || ''),
    docLinks:    String(row[AC.DOC_LINKS]  || ''),
    userEmail:   String(row[AC.USER_EMAIL] || '')
  };
}

// ─── STOCK CALCULATION ───────────────────────────────────────────────────────
//
//  Movement model (FIXED):
//    ENTRY    → arrives at DEST_LOC (rack).  warehouseQty++, warehouseLocs[dest]++
//    EXIT     → leaves from SRC_LOC (rack).  warehouseQty--, siteQty++
//    DISPATCH → legacy alias for EXIT.        same as EXIT
//    TRANSFER → rack-to-rack.                 no warehouseQty change
//    RETURN   → comes back from site.         siteQty--, warehouseQty++, added to DEST_LOC
//    WASTE    → consumed/damaged.             warehouseQty--, wastedQty++
//
function calculateStock(movements, reservations) {
  var stock = {};

  for (var i = 0; i < movements.length; i++) {
    var m   = movements[i];
    var key = getMaterialId(m.category, m.name);

    if (!stock[key]) {
      stock[key] = {
        matId:        key,
        category:     m.category,
        name:         m.name,
        project:      m.project,
        warehouseLocs:{},
        warehouseQty: 0,
        siteQty:      0,
        wastedQty:    0,
        totalQty:     0,
        reservedQty:  0,
        availableQty: 0,
        unit:         m.unit || 'UNIT',
        _errors:      []
      };
    }
    var s   = stock[key];
    var qty = m.qty;
    var mt  = m.moveType;

    if (m.project && m.project !== 'GENERIC') s.project = m.project;
    if (m.unit) s.unit = m.unit;

    if (mt === 'ENTRY') {
      // FIX #2: ENTRY rack is stored in DEST_LOC.
      // Fall back to SRC_LOC for legacy rows saved before this fix.
      var rack = m.destLoc || m.sourceLoc || 'UNASSIGNED';
      s.warehouseLocs[rack] = (s.warehouseLocs[rack] || 0) + qty;
      s.warehouseQty += qty;

    } else if (mt === 'EXIT' || mt === 'DISPATCH') {
      // FIX #4: Both EXIT and DISPATCH mean "material left the warehouse".
      // FIX #5: siteQty always increments; warehouseQty only decrements once.
      var exSrc = m.sourceLoc || findFirstWarehouseLoc(s.warehouseLocs, qty);
      if (exSrc) {
        var before = s.warehouseLocs[exSrc] || 0;
        s.warehouseLocs[exSrc] = before - qty;
        if (s.warehouseLocs[exSrc] < 0) {
          s._errors.push('NEG@' + exSrc + ' had=' + before + ' tried=' + qty);
          s.warehouseLocs[exSrc] = 0;
        }
      }
      s.warehouseQty = Math.max(0, s.warehouseQty - qty);
      s.siteQty     += qty;   // FIX #3: goes to siteQty, not a separate withInstallerQty

    } else if (mt === 'TRANSFER') {
      if (m.sourceLoc) {
        s.warehouseLocs[m.sourceLoc] = (s.warehouseLocs[m.sourceLoc] || 0) - qty;
        if (s.warehouseLocs[m.sourceLoc] < 0) {
          s._errors.push('TRANSFER NEG@' + m.sourceLoc);
          s.warehouseLocs[m.sourceLoc] = 0;
        }
      }
      if (m.destLoc) {
        s.warehouseLocs[m.destLoc] = (s.warehouseLocs[m.destLoc] || 0) + qty;
      }

    } else if (mt === 'RETURN') {
      // FIX #7: subtract from siteQty, add back to warehouse at destLoc
      s.siteQty = Math.max(0, s.siteQty - qty);
      var retRack = m.destLoc || 'UNASSIGNED';
      s.warehouseLocs[retRack] = (s.warehouseLocs[retRack] || 0) + qty;
      s.warehouseQty += qty;

    } else if (mt === 'WASTE') {
      var wSrc = m.sourceLoc || findFirstWarehouseLoc(s.warehouseLocs, qty);
      if (wSrc) {
        s.warehouseLocs[wSrc] = (s.warehouseLocs[wSrc] || 0) - qty;
        if (s.warehouseLocs[wSrc] < 0) {
          s._errors.push('WASTE NEG@' + wSrc);
          s.warehouseLocs[wSrc] = 0;
        }
      }
      s.warehouseQty = Math.max(0, s.warehouseQty - qty);
      s.wastedQty   += qty;
    }
  }

  // Apply active reservations
  if (reservations) {
    for (var r = 0; r < reservations.length; r++) {
      var res  = reservations[r];
      if (res.status !== 'Active') continue;
      var rKey = getMaterialId(res.category, res.name);
      if (stock[rKey]) stock[rKey].reservedQty += res.qty;
    }
  }

  // Finalize every SKU
  for (var k in stock) {
    if (!stock.hasOwnProperty(k)) continue;
    var item = stock[k];

    // Remove zero / negative rack entries
    for (var loc in item.warehouseLocs) {
      if (item.warehouseLocs.hasOwnProperty(loc) && item.warehouseLocs[loc] <= 0) {
        delete item.warehouseLocs[loc];
      }
    }
    item.warehouseQty = Math.max(0, item.warehouseQty);
    item.siteQty      = Math.max(0, item.siteQty);
    item.availableQty = Math.max(0, item.warehouseQty - item.reservedQty);
    item.totalQty     = item.warehouseQty + item.siteQty;

    if (item._errors.length) {
      Logger.log('STOCK_ERR [' + k + ']: ' + item._errors.join(' | '));
    }
  }

  return stock;
}

function findFirstWarehouseLoc(locs, needed) {
  for (var loc in locs) {
    if (locs.hasOwnProperty(loc) && locs[loc] >= needed) return loc;
  }
  for (var loc2 in locs) {
    if (locs.hasOwnProperty(loc2) && locs[loc2] > 0) return loc2;
  }
  return null;
}

// ─── PROCESS MOVEMENT ────────────────────────────────────────────────────────
function processMovement(action, data) {
  var auth = getUserRole();
  if (auth.role === 'NO_SESSION') throw new Error('Not authenticated. Please sign in with your Google account.');
  if (auth.role === 'DENIED')     throw new Error('Access denied. Your account (' + auth.email + ') is not registered in this system. Contact your administrator to request access.');
  if (auth.role === 'VIEWER')     throw new Error('Read-only access — you can view data but cannot record movements. Contact an admin.');

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) throw new Error('Archive sheet not found.');

  if (action === 'addMovement') {
    // Multi-location ENTRY: one archive row per destination location
    if (data.moveType === 'ENTRY' && Array.isArray(data.locations) && data.locations.length > 0) {
      var lastResult;
      for (var li = 0; li < data.locations.length; li++) {
        var locEntry = data.locations[li];
        if (!locEntry.qty || locEntry.qty <= 0) continue;
        var singleData = {
          moveType:         data.moveType,
          category:         data.category,
          name:             data.name,
          project:          data.project,
          isGeneric:        data.isGeneric,
          gc:               data.gc,
          po:               data.po,
          qty:              locEntry.qty,
          unit:             data.unit,
          dateRec:          data.dateRec,
          sourceLoc:        '',
          destLoc:          locEntry.loc || '',
          supplier:         data.supplier,
          comments:         data.comments,
          responsible:      data.responsible,
          files:            li === 0 ? (data.files     || []) : [],
          docGroups:        li === 0 ? (data.docGroups || []) : [],
          notifyRecipients: li === 0 ? data.notifyRecipients : null,
          // Only check for duplicates on the FIRST location row.
          // Subsequent rows in the same multi-loc submission are intentionally
          // similar (same material, close timestamps) — not real duplicates.
          forceSubmit:      li === 0 ? !!data.forceSubmit : true
        };
        lastResult = _addMovement(ss, archive, singleData, auth);
      }
      return lastResult || { status: 'success', message: 'ENTRY recorded.' };
    }

    // Multi-source EXIT: one archive row per source location
    if (data.moveType === 'EXIT' && Array.isArray(data.exitLocations) && data.exitLocations.length > 0) {
      var exitResult;
      for (var xi = 0; xi < data.exitLocations.length; xi++) {
        var exitEntry = data.exitLocations[xi];
        if (!exitEntry.qty || exitEntry.qty <= 0) continue;
        var exitData = {
          moveType:         'EXIT',
          category:         data.category,
          name:             data.name,
          project:          data.project,
          isGeneric:        data.isGeneric,
          gc:               data.gc,
          po:               data.po,
          qty:              exitEntry.qty,
          unit:             data.unit,
          dateRec:          data.dateRec,
          sourceLoc:        exitEntry.loc || '',
          destLoc:          data.destLoc  || '',   // destination project/site
          supplier:         data.supplier,
          comments:         data.comments,
          responsible:      data.responsible,
          files:            xi === 0 ? (data.files || []) : [],
          notifyRecipients: null,                  // no email for EXIT
          // Same reasoning: only check first EXIT location for duplicates
          forceSubmit:      xi === 0 ? !!data.forceSubmit : true
        };
        exitResult = _addMovement(ss, archive, exitData, auth);
      }
      return exitResult || { status: 'success', message: 'EXIT recorded.' };
    }

    return _addMovement(ss, archive, data, auth);
  }
  if (action === 'updateDocument')        return _updateDocument(ss, archive, data, auth);
  if (action === 'addReservation')        return _addReservation(ss, data, auth);
  if (action === 'cancelReservation')     return _cancelReservation(ss, data, auth);
  if (action === 'addIncoming')           return addIncoming(data);
  if (action === 'updateIncoming')        return updateIncoming(data);
  if (action === 'deleteIncoming')        return deleteIncoming(data.id);
  if (action === 'setMonitoredMaterials') return setMonitoredMaterials(data.names);
  // ── User management (ADMIN only) ─────────────────────────────────────────
  if (action === 'getUsers')       return getUsers(auth);
  if (action === 'addUser')        return addUser(data, auth);
  if (action === 'updateUser')     return updateUser(data, auth);
  if (action === 'removeUser')     return removeUser(data.email, auth);
  // ── Settings / Config management (ADMIN only) ─────────────────────────────
  if (action === 'getSettings')    return getSettings(auth);
  if (action === 'updateConfig')   return updateConfig(data, auth);
  // ── Material management (ADMIN only) ──────────────────────────────────────
  if (action === 'listMaterials')  return listMaterials(auth);
  if (action === 'manageMaterial') return manageMaterial(data, auth);
  if (action === 'adminAction') {
    if (auth.role !== 'ADMIN') throw new Error('Admin only.');
    return _adminAction(ss, data);
  }
  throw new Error('Unknown action: ' + action);
}

// ─── ADD MOVEMENT ─────────────────────────────────────────────────────────────
function _addMovement(ss, archive, data, auth) {
  var mt = String(data.moveType || '').toUpperCase().trim();

  // Normalize legacy DISPATCH → EXIT for all new records
  if (mt === 'DISPATCH') mt = 'EXIT';

  var validTypes = ['ENTRY','EXIT','TRANSFER','RETURN','WASTE'];
  if (validTypes.indexOf(mt) === -1) throw new Error('Invalid move type: ' + mt);

  var qty = Math.abs(Number(data.qty || 0));
  if (qty <= 0) throw new Error('Quantity must be greater than 0.');

  var cat  = normalizeString(data.category);
  var name = normalizeString(data.name);
  if (!cat || !name) throw new Error('Category and Name are required.');

  var proj  = data.isGeneric ? 'GENERIC' : normalizeString(data.project || '');
  if (!proj && mt === 'ENTRY') proj = 'GENERIC';
  var matId = getMaterialId(cat, name);

  // Use GAS built-in LockService (never blocks the 30-second execution limit)
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(8000); // wait up to 8 s for the lock
  } catch(lockErr) {
    throw new Error('System busy — another save is in progress. Please retry in a moment.');
  }

  try {
    // ── Duplicate-movement guard ──────────────────────────────────────────────
    // Check if an identical movement (same type+category+name+qty+user) was already
    // saved within the last 3 minutes. This catches double-clicks and double-tabs.
    // Pass forceSubmit:true from the frontend to bypass if the user confirms.
    if (!data.forceSubmit) {
      var dupResult = _checkDuplicateMovement(archive, mt, cat, name, qty, auth.email);
      if (dupResult) {
        throw new Error('DUPLICATE_MOVEMENT|' + dupResult.rowIdx + '|' + dupResult.minutesAgo);
      }
    }

    var freshStock = getCurrentStockForItem(ss, matId);
    var src  = normalizeString(data.sourceLoc || '');
    var dest = normalizeString(data.destLoc   || '');

    // Stock validation for outgoing moves
    if (['EXIT','TRANSFER','WASTE'].indexOf(mt) !== -1) {
      var reserved = freshStock.reservedQty || 0;
      var avail    = Math.max(0, freshStock.warehouseQty - reserved);
      var locAvail = src ? (freshStock.warehouseLocs[src] || 0) : avail;

      if (avail < qty) {
        throw new Error('INSUFFICIENT STOCK. Available: ' + avail +
          ' (Warehouse: ' + freshStock.warehouseQty + ', Reserved: ' + reserved +
          '). Cannot remove ' + qty + '.');
      }
      if (src && locAvail < qty) {
        throw new Error('INSUFFICIENT at ' + src + '. Available there: ' + locAvail +
          '. Total available: ' + avail);
      }
    }

    if (mt === 'WASTE' && !String(data.comments || '').trim()) {
      throw new Error('WASTE movements require a reason in comments.');
    }

    // Build and save archive row
    var now   = new Date();
    var tDate = data.dateRec || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // Row matches the 19-column sheet structure exactly (AC map above)
    var statusVal = (mt === 'ENTRY' || mt === 'RETURN' || mt === 'TRANSFER')
                    ? 'In Stock'
                    : (mt === 'EXIT' || mt === 'DISPATCH')
                    ? 'Dispatched'
                    : 'Damaged';  // WASTE

    var row = new Array(19);
    row[AC.TIMESTAMP]  = now;
    row[AC.CATEGORY]   = cat;                                        // B: material type
    row[AC.NAME]       = name;
    row[AC.GC]         = String(data.gc  || '').trim();   // keep as-is (contract numbers have special chars)
    row[AC.PO]         = String(data.po  || '').trim();   // keep as-is (PO# uses hyphens, asterisks, etc.)
    row[AC.QTY]        = qty;
    row[AC.UNIT]       = String(data.unit || 'UNIT').toUpperCase();
    row[AC.DATE_REC]   = tDate;
    row[AC.SRC_LOC]    = src;
    row[AC.SUPPLIER]   = String(data.supplier || '').trim(); // keep as-is
    row[AC.COMMENTS]   = String(data.comments  || '').trim();
    row[AC.STATUS]     = statusVal;                                   // L: In Stock / Dispatched / Damaged
    row[AC.RESPONSIBLE]= String(data.responsible || auth.email).trim();
    row[AC.PROJECT]    = proj;
    row[AC.MAT_ID]     = matId;
    row[AC.DOC_LINKS]  = '';
    row[AC.USER_EMAIL] = auth.email;
    row[AC.DEST_LOC]   = dest;
    row[AC.MOVETYPE]   = mt;                                          // S: transaction type

    archive.appendRow(row);
    var newRowIdx = archive.getLastRow();
    archive.getRange(newRowIdx, AC.TIMESTAMP + 1).setNumberFormat('mm/dd/yyyy hh:mm');

    // ── File / Document uploads ───────────────────────────────────────────────
    var fileLinks = '';
    var fileError = '';
    var hasDocGroups = data.docGroups && data.docGroups.length > 0;
    var hasFiles     = data.files     && data.files.length     > 0;
    if (hasDocGroups || hasFiles) {
      try {
        var links = hasDocGroups
          ? _uploadDocGroups(data.docGroups, name)  // new multi-photo named groups
          : _uploadFiles(data.files, name, data.po || 'DOC'); // legacy
        if (links) {
          archive.getRange(newRowIdx, AC.DOC_LINKS + 1).setValue(links);
          fileLinks = links;
        }
      } catch (fileErr) {
        fileError = fileErr.message;
        Logger.log('File upload error: ' + fileErr.message);
      }
    }

    // ── Refresh derived sheets (best-effort, non-blocking) ───────────────────
    try { _refreshDerivedSheets(ss); } catch (refreshErr) {
      Logger.log('Refresh warning: ' + refreshErr.message);
    }

    _auditLog(ss, 'ADD_MOVEMENT', auth.email, mt + ' | ' + name + ' x' + qty, '', '');

    // ── On-demand notification email (ENTRY checkbox only) ───────────────────
    var emailError = '';
    if (data.notifyRecipients && data.notifyRecipients.emails) {
      try {
        var subject = 'Material Received: ' + name +
          (proj && proj !== 'GENERIC' ? ' — ' + proj : '');
        var msgBody = data.notifyRecipients.message;
        if (!msgBody) {
          msgBody = 'Hi,\n\nThe ' + qty + ' ' + String(data.unit || 'UNIT').toUpperCase() +
            '(s) of ' + name + ' for ' + (proj || 'OX Glass Co.') +
            ' were received today and are now stored in ' +
            (dest || src || 'the warehouse') +
            '.\n\nLet us know if you need anything.\n\nOX Glass Co. — Warehouse Team';
        }
        var emailList = data.notifyRecipients.emails.split(',');
        var sent = 0;
        for (var em = 0; em < emailList.length; em++) {
          var addr = emailList[em].trim();
          if (addr && addr.indexOf('@') !== -1) {
            MailApp.sendEmail(addr, subject, msgBody);
            sent++;
          }
        }
        if (sent === 0) emailError = 'No valid email addresses provided.';
      } catch (notifErr) {
        emailError = notifErr.message;
        Logger.log('Email error: ' + notifErr.message);
      }
    }

    if (mt === 'WASTE') {
      try { _checkNotifications(ss, data, mt, qty, auth.email); } catch(e) {}
    }

    return {
      status:         'success',
      rowIdx:         newRowIdx,
      message:        mt + ' recorded successfully.' + (fileLinks ? ' Files attached.' : ''),
      availableAfter: Math.max(0, (freshStock.availableQty || 0) - qty),
      fileError:      fileError  || null,
      emailError:     emailError || null
    };

  } finally {
    lock.releaseLock();
  }
}

// ─── FRESH STOCK QUERY (reads Archive directly, no cache) ─────────────────────
function getCurrentStockForItem(ss, matId) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) return { warehouseQty: 0, siteQty: 0, warehouseLocs: {}, reservedQty: 0, availableQty: 0 };

  var data = archive.getDataRange().getValues();
  var locs = {}, wh = 0, site = 0;

  for (var i = 1; i < data.length; i++) {
    var row   = data[i];
    var rowId = getMaterialId(
      normalizeString(row[AC.CATEGORY] || ''),
      normalizeString(row[AC.NAME]     || '')
    );
    if (rowId !== matId) continue;

    var rawQty2    = Number(row[AC.QTY] || 0);
    var rawMT2     = String(row[AC.MOVETYPE] || '').toUpperCase().trim();
    var rawStatus2 = String(row[AC.STATUS]   || '').toUpperCase().trim();
    var qty = Math.abs(rawQty2);
    var mt;
    if (!rawMT2 || rawMT2 === 'IN STOCK') {
      mt = (rawQty2 < 0 || rawStatus2 === 'DISPATCHED' || rawStatus2 === 'DISPATCH') ? 'EXIT' : 'ENTRY';
    } else if (rawMT2 === 'DISPATCHED' || rawMT2 === 'DISPATCH' || rawMT2 === 'DEL') {
      mt = 'EXIT';
    } else {
      mt = rawMT2;
    }
    var src = normalizeString(row[AC.SRC_LOC]  || '');
    var dst = normalizeString(row[AC.DEST_LOC] || '');

    if (mt === 'ENTRY') {
      var rack = dst || src || 'UNASSIGNED';
      locs[rack] = (locs[rack] || 0) + qty;
      wh += qty;

    } else if (mt === 'EXIT' || mt === 'DISPATCH') {
      var exSrc = src || findFirstWarehouseLoc(locs, qty);
      if (exSrc && locs[exSrc]) locs[exSrc] -= qty;
      wh   = Math.max(0, wh - qty);
      site += qty;

    } else if (mt === 'TRANSFER') {
      if (src && locs[src]) locs[src] -= qty;
      if (dst) locs[dst] = (locs[dst] || 0) + qty;

    } else if (mt === 'RETURN') {
      site = Math.max(0, site - qty);
      var retRack = dst || 'UNASSIGNED';
      locs[retRack] = (locs[retRack] || 0) + qty;
      wh += qty;

    } else if (mt === 'WASTE') {
      var wSrc = src || findFirstWarehouseLoc(locs, qty);
      if (wSrc && locs[wSrc]) locs[wSrc] -= qty;
      wh = Math.max(0, wh - qty);
    }
  }

  for (var k in locs) { if (locs.hasOwnProperty(k) && locs[k] < 0) locs[k] = 0; }

  // Count active reservations
  var reserved = 0;
  var resSheet = ss.getSheetByName(SHEETS.RESERVATIONS);
  if (resSheet) {
    var rData = resSheet.getDataRange().getValues();
    for (var j = 1; j < rData.length; j++) {
      var rKey = getMaterialId(
        normalizeString(rData[j][1] || ''),
        normalizeString(rData[j][2] || '')
      );
      if (rKey === matId && String(rData[j][7] || '').toUpperCase() === 'ACTIVE') {
        reserved += Number(rData[j][4] || 0);
      }
    }
  }

  return {
    warehouseQty:  Math.max(0, wh),
    siteQty:       Math.max(0, site),
    warehouseLocs: locs,
    reservedQty:   reserved,
    availableQty:  Math.max(0, wh - reserved)
  };
}

// ─── REFRESH DERIVED SHEETS ──────────────────────────────────────────────────
function _refreshDerivedSheets(ss) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var live    = ss.getSheetByName(SHEETS.LIVE);
  var site    = ss.getSheetByName(SHEETS.SITE);
  if (!archive || !live || !site) return;

  var data  = archive.getDataRange().getValues();
  var stock = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[AC.CATEGORY]) continue;
    var m   = parseArchiveRow(row, i + 1);
    var key = m.matId || getMaterialId(m.category, m.name);

    if (!stock[key]) stock[key] = { cat: m.category, name: m.name, project: m.project, unit: m.unit || 'UNIT', locs: {}, siteProjs: {} };
    var s   = stock[key];
    var qty = m.qty;

    if (m.moveType === 'ENTRY') {
      var rack = m.destLoc || m.sourceLoc || 'UNASSIGNED';
      s.locs[rack] = (s.locs[rack] || 0) + qty;

    } else if (m.moveType === 'EXIT' || m.moveType === 'DISPATCH') {
      var sr = m.sourceLoc || 'UNASSIGNED';
      s.locs[sr] = (s.locs[sr] || 0) - qty;
      var p = m.project || 'UNASSIGNED';
      s.siteProjs[p] = (s.siteProjs[p] || 0) + qty;

    } else if (m.moveType === 'TRANSFER') {
      if (m.sourceLoc) s.locs[m.sourceLoc] = (s.locs[m.sourceLoc] || 0) - qty;
      if (m.destLoc)   s.locs[m.destLoc]   = (s.locs[m.destLoc]   || 0) + qty;

    } else if (m.moveType === 'RETURN') {
      var retRack = m.destLoc || 'UNASSIGNED';
      s.locs[retRack] = (s.locs[retRack] || 0) + qty;
      var p2 = m.project || 'UNKNOWN';
      if (s.siteProjs[p2]) s.siteProjs[p2] = Math.max(0, s.siteProjs[p2] - qty);

    } else if (m.moveType === 'WASTE') {
      var s2 = m.sourceLoc || 'UNASSIGNED';
      s.locs[s2] = (s.locs[s2] || 0) - qty;
    }
  }

  var now = new Date();

  // Batch-build arrays then write in ONE setValues call (much faster than appendRow loop)
  var liveRows = [['Category','Name','Project','Location','Qty','Unit','Location_Type','Last_Updated']];
  for (var k in stock) {
    if (!stock.hasOwnProperty(k)) continue;
    var item = stock[k];
    for (var loc in item.locs) {
      if (!item.locs.hasOwnProperty(loc)) continue;
      var q = item.locs[loc];
      if (q > 0) liveRows.push([item.cat, item.name, item.project, loc, q, item.unit, 'RACK', now]);
    }
  }
  live.clearContents();
  if (liveRows.length > 0) live.getRange(1, 1, liveRows.length, 8).setValues(liveRows);

  var siteRows = [['Category','Name','Project','Qty','Unit','Status','Last_Updated']];
  for (var k2 in stock) {
    if (!stock.hasOwnProperty(k2)) continue;
    var item2 = stock[k2];
    for (var sp in item2.siteProjs) {
      if (!item2.siteProjs.hasOwnProperty(sp)) continue;
      var sq = item2.siteProjs[sp];
      if (sq > 0) siteRows.push([item2.cat, item2.name, sp, sq, item2.unit, 'At Site', now]);
    }
  }
  site.clearContents();
  if (siteRows.length > 0) site.getRange(1, 1, siteRows.length, 7).setValues(siteRows);
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────────
function _addReservation(ss, data, auth) {
  var sheet = ss.getSheetByName(SHEETS.RESERVATIONS);
  if (!sheet) throw new Error('Reservations sheet not found.');

  var cat   = String(data.category || '').toUpperCase().trim();
  var name  = String(data.name     || '').trim();
  var proj  = String(data.project  || '').trim();
  var qty   = Number(data.qty      || 0);
  if (!cat || !name || qty <= 0) throw new Error('Invalid reservation data.');

  var matId   = getMaterialId(cat, name);
  var current = getCurrentStockForItem(ss, matId);
  if (current.availableQty < qty) throw new Error('Cannot reserve. Available: ' + current.availableQty);

  var id = 'RES-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  sheet.appendRow([id, cat, name, proj, qty, auth.email, new Date(), 'Active', '']);

  _auditLog(ss, 'ADD_RESERVATION', auth.email, id + ' | ' + name + ' x' + qty, '', '');
  return { status: 'success', reservationId: id };
}

function _cancelReservation(ss, data, auth) {
  var sheet = ss.getSheetByName(SHEETS.RESERVATIONS);
  if (!sheet) throw new Error('Reservations sheet not found.');
  var id     = data.reservationId;
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.getRange(i + 1, 8).setValue('Cancelled');
      sheet.getRange(i + 1, 9).setValue(new Date());
      _auditLog(ss, 'CANCEL_RESERVATION', auth.email, id, '', '');
      return { status: 'success' };
    }
  }
  throw new Error('Reservation not found.');
}

// ─── DOCUMENT UPLOAD ─────────────────────────────────────────────────────────
function _updateDocument(ss, archive, data, auth) {
  var hasDocGroups = data.docGroups && data.docGroups.length > 0;
  var hasFiles     = data.files     && data.files.length     > 0;
  if (!hasDocGroups && !hasFiles) throw new Error('No documents provided.');

  // Get material name from the row for folder naming
  var matName = 'attachment';
  if (data.rowIdx) {
    try {
      var rv = archive.getRange(data.rowIdx, AC.NAME + 1, 1, 1).getValues();
      matName = String((rv[0] || [])[0] || 'attachment').trim() || 'attachment';
    } catch(e) {}
  }

  var links = hasDocGroups
    ? _uploadDocGroups(data.docGroups, matName)          // named, multi-photo groups → PDF
    : _uploadFiles(data.files, matName, 'row-' + data.rowIdx); // legacy single-file

  if (links && data.rowIdx) {
    var existing = archive.getRange(data.rowIdx, AC.DOC_LINKS + 1).getValue();
    archive.getRange(data.rowIdx, AC.DOC_LINKS + 1)
      .setValue(existing ? existing + '\n' + links : links);
  }
  return { status: 'success' };
}

// Legacy single-file upload (kept for backward compatibility with older clients / attach modal)
function _uploadFiles(files, materialName, po) {
  // NOTE: no try/catch — errors propagate to caller (_addMovement / _updateDocument)
  var safe   = (materialName || 'General').replace(/[\/\\?%*:|"<>]/g, '_');
  var folder = _getOrCreateFolder('OX_WMS_v3_Docs/' + safe);
  var links  = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (!f || !f.fileData) continue;
    var mimeType = f.fileMimeType || 'application/octet-stream';
    var fileName = f.fileName     || ('attachment_' + (i + 1));
    var bytes = Utilities.base64Decode(f.fileData);
    var blob  = Utilities.newBlob(bytes, mimeType, fileName);
    var file  = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    links.push(file.getUrl());
  }
  return links.join('\n');
}

// ─── DUPLICATE MOVEMENT DETECTION ────────────────────────────────────────────
// Scans the last MAX_ROWS rows of the archive for an identical movement saved
// within WINDOW_MS milliseconds by the same user.
// Returns { rowIdx, minutesAgo } if a duplicate is found, or null if clean.
function _checkDuplicateMovement(archive, mt, cat, name, qty, userEmail) {
  var WINDOW_MS = 3 * 60 * 1000; // 3-minute window
  var MAX_ROWS  = 40;             // only look at the last 40 rows (fast)

  var lastRow = archive.getLastRow();
  if (lastRow < 2) return null;   // empty archive

  var startRow = Math.max(2, lastRow - MAX_ROWS + 1);
  var numRows  = lastRow - startRow + 1;

  // Read only the columns we need: TIMESTAMP(A), CATEGORY(B), NAME(C), QTY(F), USER_EMAIL(Q), MOVETYPE(S)
  // Column indices (1-based): 1,2,3,6,17,19
  var tsCol    = AC.TIMESTAMP   + 1;  // 1
  var catCol   = AC.CATEGORY    + 1;  // 2
  var nameCol  = AC.NAME        + 1;  // 3
  var qtyCol   = AC.QTY         + 1;  // 6
  var emailCol = AC.USER_EMAIL  + 1;  // 17
  var mtCol    = AC.MOVETYPE    + 1;  // 19

  // Fetch only needed columns to minimize quota usage
  var allCols = archive.getRange(startRow, 1, numRows, 19).getValues();
  var now = new Date().getTime();

  for (var i = allCols.length - 1; i >= 0; i--) {
    var row = allCols[i];
    var rowTs = row[AC.TIMESTAMP];
    if (!(rowTs instanceof Date)) continue;

    var ageMs = now - rowTs.getTime();
    if (ageMs > WINDOW_MS) break; // rows are chronological; once outside window, stop

    var rowMt    = String(row[AC.MOVETYPE]   || '').toUpperCase().trim();
    var rowCat   = String(row[AC.CATEGORY]   || '').toUpperCase().trim();
    var rowName  = String(row[AC.NAME]       || '').toUpperCase().trim();
    var rowQty   = Number(row[AC.QTY]        || 0);
    var rowEmail = String(row[AC.USER_EMAIL] || '').toLowerCase().trim();

    if (rowMt    === mt.toUpperCase()        &&
        rowCat   === cat.toUpperCase()       &&
        rowName  === name.toUpperCase()      &&
        rowQty   === qty                     &&
        rowEmail === (userEmail || '').toLowerCase()) {
      return {
        rowIdx:     startRow + i,
        minutesAgo: Math.round(ageMs / 60000 * 10) / 10  // one decimal
      };
    }
  }
  return null;
}

// ─── MULTI-PHOTO NAMED DOCUMENT GROUPS ───────────────────────────────────────
// docGroups = [ { name: "Invoice", photos: [ {fileData, fileMimeType} ] }, … ]
// Returns newline-separated "DocName||DriveURL" strings for storage in DOC_LINKS.
//
// Single-photo groups → uploaded as JPEG (fast, no PDF overhead).
// Multi-photo groups  → stitched into a Google Doc → exported as PDF → temp Doc trashed.
//
function _uploadDocGroups(docGroups, materialName) {
  var safe   = (materialName || 'General').replace(/[\/\\?%*:|"<>]/g, '_');
  var folder = _getOrCreateFolder('OX_WMS_v3_Docs/' + safe);
  var links  = [];

  for (var i = 0; i < docGroups.length; i++) {
    var group  = docGroups[i];
    var photos = group.photos || [];
    if (!photos.length) continue;

    var rawName  = (group.name || ('Document ' + (i + 1))).trim();
    var safeName = rawName.replace(/[\/\\?%*:|"<>]/g, '_');
    var url;

    if (photos.length === 1) {
      // Single photo → store as image directly (faster)
      var p    = photos[0];
      var bytes = Utilities.base64Decode(p.fileData);
      var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg', safeName);
      var imgFile = folder.createFile(blob);
      imgFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      url = imgFile.getUrl();
    } else {
      // Multiple photos → create Google Doc with one image per page → export PDF
      url = _photosToDocPdf(photos, safeName, folder);
    }

    if (url) links.push(rawName + '||' + url);
  }
  return links.join('\n');
}

// Creates a Google Doc with one photo per page, exports it as PDF, trashes the Doc.
// Returns the Drive URL of the saved PDF.
function _photosToDocPdf(photos, docName, targetFolder) {
  // Create a temporary Google Doc
  var tempTitle = 'WMS_TMP_' + new Date().getTime();
  var doc  = DocumentApp.create(tempTitle);
  var body = doc.getBody();

  // Remove default blank paragraph so images start cleanly
  body.clear();

  for (var i = 0; i < photos.length; i++) {
    if (i > 0) body.appendPageBreak();
    var p     = photos[i];
    var bytes = Utilities.base64Decode(p.fileData);
    var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg');
    var img   = body.appendImage(blob);
    // Scale to fit within a standard letter-width (~6 inches at 72dpi ≈ 432 pts)
    var originalWidth  = img.getWidth();
    var originalHeight = img.getHeight();
    var maxW = 432;
    if (originalWidth > maxW) {
      img.setWidth(maxW);
      img.setHeight(Math.round(originalHeight * maxW / originalWidth));
    }
  }

  doc.saveAndClose();

  // Export as PDF blob
  var docFile = DriveApp.getFileById(doc.getId());
  var pdfBlob = docFile.getAs('application/pdf');
  pdfBlob.setName(docName + '.pdf');

  // Save PDF to target folder
  var pdfFile = targetFolder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Trash the temporary Doc
  docFile.setTrashed(true);

  return pdfFile.getUrl();
}

function _getOrCreateFolder(path) {
  var parts   = path.split('/');
  var current = DriveApp.getRootFolder();
  for (var i = 0; i < parts.length; i++) {
    var folders = current.getFoldersByName(parts[i]);
    current = folders.hasNext() ? folders.next() : current.createFolder(parts[i]);
  }
  return current;
}

// ─── ADMIN ACTIONS ───────────────────────────────────────────────────────────
function _adminAction(ss, data) {
  var action = data.action;
  if (action === 'updateTruck')   return _updateTruck(ss, data);
  if (action === 'addUser')       return _addUser(ss, data);
  if (action === 'removeUser')    return _removeUser(ss, data);
  if (action === 'reconcile')     return _runReconciliation(ss);
  if (action === 'updateMinStock')return _updateMinStock(ss, data);
  throw new Error('Unknown admin action.');
}

function _updateTruck(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][8] || '') === data.truckName) {
      cfg.getRange(i + 1, 10).setValue(data.assignedPerson || '');
      cfg.getRange(i + 1, 11).setValue(data.status || 'ACTIVE');
      return { status: 'success' };
    }
  }
  cfg.appendRow(['','','','','','','','',data.truckName, data.assignedPerson || '', data.status || 'ACTIVE','','']);
  return { status: 'success', message: 'Truck added.' };
}

function _addUser(ss, data) {
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  cfg.appendRow(['','','','','',data.email, data.role,'','','','','','']);
  return { status: 'success' };
}

function _removeUser(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][5] || '').toLowerCase() === data.email.toLowerCase()) {
      cfg.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  throw new Error('User not found.');
}

function _updateMinStock(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][11] || '').toUpperCase() === data.category.toUpperCase()) {
      cfg.getRange(i + 1, 13).setValue(Number(data.qty) || 0);
      return { status: 'success' };
    }
  }
  cfg.appendRow(['','','','','','','','','','','',data.category, Number(data.qty) || 0]);
  return { status: 'success' };
}

function _runReconciliation(ss) {
  _refreshDerivedSheets(ss);
  return { status: 'success', message: 'Reconciliation complete. LIVE_STOCK and SITE_STOCK refreshed.' };
}

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
function _auditLog(ss, action, user, details, oldVal, newVal) {
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return;
  sheet.appendRow([new Date(), action, user, details, oldVal, newVal]);
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
// Only called automatically for WASTE. ENTRY notifications are user-triggered
// via the modal checkbox and handled directly in _addMovement().
function _checkNotifications(ss, data, moveType, qty, userEmail) {
  try {
    var cfg       = loadConfig();
    var recipient = cfg.adminEmail || 'jose@ox-glass.com';
    var name      = String(data.name || '');

    if (moveType === 'WASTE') {
      MailApp.sendEmail(
        recipient,
        '🗑️ Waste Recorded: ' + name,
        'Item: '     + name +
        '\nQty: '    + qty +
        '\nReason: ' + (data.comments  || 'No reason provided') +
        '\nFrom: '   + (data.sourceLoc || 'N/A') +
        '\nBy: '     + userEmail
      );
    }
  } catch (e) {
    Logger.log('Notification error: ' + e.message);
  }
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
function exportMovementsCSV(filters) {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) return '';

  var data = archive.getDataRange().getValues();
  var rows = [['MoveType','Date','Category','Name','Project','Qty','Unit','Source','Destination','Truck','Responsible','Status','Comments'].join(',')];

  for (var i = 1; i < data.length; i++) {
    var m = parseArchiveRow(data[i], i + 1);
    if (filters) {
      if (filters.moveType  && m.moveType !== filters.moveType)                        continue;
      if (filters.category  && m.category !== filters.category)                        continue;
      if (filters.project   && m.project.toLowerCase() !== filters.project.toLowerCase()) continue;
      if (filters.dateFrom  && m.dateRec < filters.dateFrom)                           continue;
      if (filters.dateTo    && m.dateRec > filters.dateTo)                             continue;
    }
    rows.push([
      m.moveType, m.dateRec, m.category, m.name, m.project, m.qty, m.unit,
      m.sourceLoc, m.destLoc, m.truck, m.responsible, m.status,
      '"' + (m.comments || '').replace(/"/g,'""') + '"'
    ].join(','));
  }
  return rows.join('\n');
}

// ─── CUSTOM MENU ─────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏭 OX WMS v3')
    .addItem('Run Reconciliation', 'menuReconcile')
    .addItem('Open WMS App',       'menuOpenApp')
    .addToUi();
}

function menuReconcile() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  _runReconciliation(ss);
  SpreadsheetApp.getUi().alert('Reconciliation complete.');
}

function menuOpenApp() {
  var url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert('Open this URL in your browser:\n\n' + url);
}

// ─── PRESENCE / HEARTBEAT ────────────────────────────────────────────────────
// Called on page load and every 90 s from the frontend.
// Stores a timestamp per user in ScriptProperties and returns the active list.
function heartbeat() {
  var auth = getUserRole();
  if (!auth || auth.role === 'DENIED') return [];

  var props    = PropertiesService.getScriptProperties();
  var raw      = props.getProperty('WMS_SESSIONS');
  var sessions = {};
  try { if (raw) sessions = JSON.parse(raw); } catch(e) {}

  var now    = new Date().getTime();
  var cutoff = now - 10 * 60 * 1000;  // prune sessions older than 10 min

  // Update this user
  sessions[auth.email] = { email: auth.email, role: auth.role, time: now };

  // Prune stale entries
  Object.keys(sessions).forEach(function(k) {
    if (sessions[k].time < cutoff) delete sessions[k];
  });

  props.setProperty('WMS_SESSIONS', JSON.stringify(sessions));

  // Return sorted list: most-recent first
  return Object.values(sessions).sort(function(a, b) { return b.time - a.time; });
}

// ─── LOCKING ─────────────────────────────────────────────────────────────────
// Using GAS built-in LockService.getScriptLock() directly in _addMovement.
// The old custom spin-lock (PropertiesService busy-wait) was removed because
// it could consume the full 30-second GAS execution budget and silently timeout.

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
// Sheet: USERS_V3  Columns (0-based):
//   A=0:ID  B=1:Email  C=2:Name  D=3:Role  E=4:AddedBy  F=5:AddedAt  G=6:Active
//
// Role values: ADMIN | WAREHOUSE | VIEWER
// Active: TRUE (can log in) | FALSE (deactivated, cannot log in)

function _ensureUsersSheet(ss) {
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) {
    sheet = ss.insertSheet('USERS_V3');
    sheet.appendRow(['ID','Email','Name','Role','Added By','Added At','Active']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    sheet.setColumnWidth(2, 220); // Email column wider
  }
  return sheet;
}

function getUsers(auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var rows = sheet.getDataRange().getValues();
  var out  = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    out.push({
      id:      String(r[0]),
      email:   String(r[1] || '').trim(),
      name:    String(r[2] || '').trim(),
      role:    String(r[3] || 'WAREHOUSE').toUpperCase().trim(),
      addedBy: String(r[4] || ''),
      addedAt: r[5] instanceof Date
               ? Utilities.formatDate(r[5], Session.getScriptTimeZone(), 'yyyy-MM-dd')
               : String(r[5] || ''),
      active:  (r[6] === true || String(r[6]).toUpperCase() === 'TRUE' || r[6] === '')
    });
  }
  return out;
}

function addUser(data, auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var email = String(data.email || '').toLowerCase().trim();
  var name  = String(data.name  || '').trim();
  var role  = String(data.role  || 'WAREHOUSE').toUpperCase().trim();
  if (!email || email.indexOf('@') === -1) throw new Error('Valid email required.');
  if (['ADMIN','WAREHOUSE','VIEWER'].indexOf(role) === -1) throw new Error('Invalid role.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _ensureUsersSheet(ss);

  // Check for duplicates
  if (sheet.getLastRow() > 1) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1] || '').toLowerCase().trim() === email) {
        throw new Error('Email already registered: ' + email);
      }
    }
  }

  var now = new Date();
  var id  = 'USR-' + now.getTime();
  sheet.appendRow([id, email, name, role, auth.email, now, true]);
  _auditLog(ss, 'ADD_USER', auth.email, email + ' as ' + role, '', '');
  return { status: 'success', id: id };
}

function updateUser(data, auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var email = String(data.email || '').toLowerCase().trim();
  if (!email) throw new Error('Email required.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) throw new Error('Users sheet not found.');

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1] || '').toLowerCase().trim() === email) {
      var rowNum = i + 1;
      if (data.name !== undefined)   sheet.getRange(rowNum, 3).setValue(String(data.name).trim());
      if (data.role !== undefined)   sheet.getRange(rowNum, 4).setValue(String(data.role).toUpperCase().trim());
      if (data.active !== undefined) sheet.getRange(rowNum, 7).setValue(!!data.active);
      _auditLog(ss, 'UPDATE_USER', auth.email, email + ' → ' + (data.role || 'no role change'), '', '');
      return { status: 'success' };
    }
  }
  throw new Error('User not found: ' + email);
}

function removeUser(email, auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  email = String(email || '').toLowerCase().trim();
  if (!email) throw new Error('Email required.');
  // Prevent self-removal
  if (email === auth.email.toLowerCase()) throw new Error('You cannot remove your own account.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) throw new Error('Users sheet not found.');

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1] || '').toLowerCase().trim() === email) {
      // Deactivate instead of delete (preserves audit trail)
      sheet.getRange(i + 1, 7).setValue(false);
      _auditLog(ss, 'REMOVE_USER', auth.email, email, '', '');
      return { status: 'success' };
    }
  }
  throw new Error('User not found: ' + email);
}

// ─── SETTINGS / CONFIG MANAGEMENT ────────────────────────────────────────────
// Admin-only. Reads/writes CONFIG sheet columns for categories, projects,
// suppliers, and locations. Renaming a category also updates MASTER_ARCHIVE_V3.

function getSettings(auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var c = loadConfig();
  return {
    categories: c.categories,
    projects:   c.projects,
    suppliers:  c.suppliers,
    locations:  c.locations.map(function(l){ return l.name; })
  };
}

// data.type  : 'categories' | 'projects' | 'suppliers' | 'locations'
// data.op    : 'add' | 'rename' | 'delete'
// data.value : current value (required for rename/delete)
// data.newValue : replacement value (required for rename)
function updateConfig(data, auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('CONFIG sheet not found.');

  // Column index in CONFIG sheet (0-based array index = col number - 1)
  var colMap = { categories: 1, projects: 0, suppliers: 2, locations: 3 };
  var col    = colMap[data.type];
  if (col === undefined) throw new Error('Unknown config type: ' + data.type);

  var rows = cfg.getDataRange().getValues();
  var val  = String(data.value    || '').trim();
  var nv   = String(data.newValue || '').trim();

  if (data.op === 'add') {
    if (!nv) throw new Error('Value required for add.');
    // Check for duplicate (case-insensitive)
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][col] || '').trim().toUpperCase() === nv.toUpperCase())
        throw new Error(data.type + ' "' + nv + '" already exists.');
    }
    // Find next available row for this column (or append)
    var targetRow = rows.length + 1; // default: new row
    for (var i = 1; i < rows.length; i++) {
      if (!rows[i][col]) { targetRow = i + 1; break; }
    }
    cfg.getRange(targetRow, col + 1).setValue(nv);

  } else if (data.op === 'rename') {
    if (!val) throw new Error('Current value required for rename.');
    if (!nv)  throw new Error('New value required for rename.');
    var renamed = 0;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][col] || '').trim().toUpperCase() === val.toUpperCase()) {
        cfg.getRange(i + 1, col + 1).setValue(nv);
        renamed++;
      }
    }
    if (!renamed) throw new Error('"' + val + '" not found in ' + data.type + '.');
    // Also rename in MASTER_ARCHIVE_V3 when renaming a category
    if (data.type === 'categories') {
      var archive = ss.getSheetByName(SHEETS.ARCHIVE);
      if (archive) {
        var aData = archive.getDataRange().getValues();
        for (var j = 1; j < aData.length; j++) {
          if (String(aData[j][AC.CATEGORY] || '').trim().toUpperCase() === val.toUpperCase()) {
            archive.getRange(j + 1, AC.CATEGORY + 1).setValue(nv.toUpperCase());
          }
        }
      }
    }

  } else if (data.op === 'delete') {
    if (!val) throw new Error('Value required for delete.');
    var deleted = 0;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][col] || '').trim().toUpperCase() === val.toUpperCase()) {
        cfg.getRange(i + 1, col + 1).setValue('');
        deleted++;
      }
    }
    if (!deleted) throw new Error('"' + val + '" not found in ' + data.type + '.');
  }

  _auditLog(ss, 'UPDATE_CONFIG', auth.email, data.type, data.op, val + (nv ? ' → ' + nv : ''));
  return { status: 'success' };
}

// ─── MATERIAL MANAGEMENT ──────────────────────────────────────────────────────
// Admin-only. Rename, merge, change category, or delete individual rows.

function listMaterials(auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var archive = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ARCHIVE);
  if (!archive) return [];
  var rows = archive.getDataRange().getValues();
  var seen = {};
  for (var i = 1; i < rows.length; i++) {
    var n = String(rows[i][AC.NAME]     || '').trim();
    var c = String(rows[i][AC.CATEGORY] || '').trim().toUpperCase();
    if (!n) continue;
    var k = c + '|||' + n.toUpperCase();
    if (!seen[k]) seen[k] = { name: n, category: c, count: 0 };
    seen[k].count++;
  }
  return Object.values(seen).sort(function(a, b){ return a.name.localeCompare(b.name); });
}

// data.op values: 'rename' | 'changeCategory' | 'merge' | 'deleteRow'
function manageMaterial(data, auth) {
  if (!auth || auth.role !== 'ADMIN') throw new Error('Admin only.');
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) throw new Error('Archive sheet not found.');

  var op  = data.op;
  var cat = String(data.category || '').trim().toUpperCase();
  var nm  = String(data.name     || '').trim().toUpperCase();

  if (op === 'rename') {
    // Change NAME across all rows matching category + oldName
    var oldNm = nm;
    var newNm = String(data.newName || '').trim();
    if (!newNm) throw new Error('New name required.');
    var rows = archive.getDataRange().getValues();
    var count = 0;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][AC.CATEGORY]||'').trim().toUpperCase() === cat &&
          String(rows[i][AC.NAME]    ||'').trim().toUpperCase() === oldNm) {
        archive.getRange(i + 1, AC.NAME + 1).setValue(newNm);
        count++;
      }
    }
    _auditLog(ss, 'RENAME_MATERIAL', auth.email, cat, oldNm, newNm + ' (' + count + ' rows)');
    return { status: 'success', updated: count };

  } else if (op === 'changeCategory') {
    var newCat = String(data.newCategory || '').trim().toUpperCase();
    if (!newCat) throw new Error('New category required.');
    var rows = archive.getDataRange().getValues();
    var count = 0;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][AC.CATEGORY]||'').trim().toUpperCase() === cat &&
          String(rows[i][AC.NAME]    ||'').trim().toUpperCase() === nm) {
        archive.getRange(i + 1, AC.CATEGORY + 1).setValue(newCat);
        count++;
      }
    }
    _auditLog(ss, 'CHANGE_CAT', auth.email, nm, cat, newCat + ' (' + count + ' rows)');
    return { status: 'success', updated: count };

  } else if (op === 'merge') {
    // Rename all rows of sourceName → targetName (same category)
    var srcNm  = nm;
    var tgtNm  = String(data.targetName || '').trim();
    if (!tgtNm) throw new Error('Target name required.');
    var rows = archive.getDataRange().getValues();
    var count = 0;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][AC.CATEGORY]||'').trim().toUpperCase() === cat &&
          String(rows[i][AC.NAME]    ||'').trim().toUpperCase() === srcNm) {
        archive.getRange(i + 1, AC.NAME + 1).setValue(tgtNm);
        count++;
      }
    }
    _auditLog(ss, 'MERGE_MATERIAL', auth.email, cat, srcNm, tgtNm + ' (' + count + ' rows)');
    return { status: 'success', merged: count };

  } else if (op === 'deleteRow') {
    var rowIdx = parseInt(data.rowIdx || 0);
    if (rowIdx < 2) throw new Error('Invalid row index.');
    // Log the row content before deleting
    var rowData = archive.getRange(rowIdx, 1, 1, 19).getValues()[0];
    _auditLog(ss, 'DELETE_ROW', auth.email, String(rowData[AC.CATEGORY]), String(rowData[AC.NAME]),
              'row ' + rowIdx + ' — ' + JSON.stringify(rowData.slice(0, 8)));
    archive.deleteRow(rowIdx);
    return { status: 'success' };
  }

  throw new Error('Unknown manageMaterial op: ' + op);
}

// ─── INCOMING MATERIALS ───────────────────────────────────────────────────────
// Sheet: INCOMING_V3  Columns (1-indexed, 0-based in array):
//  A=0:ID  B=1:EstDate  C=2:Category  D=3:Name  E=4:Qty  F=5:Unit
//  G=6:Supplier  H=7:PO  I=8:Notes  J=9:Status  K=10:AddedBy  L=11:AddedAt

function _ensureIncomingSheet(ss) {
  var sheet = ss.getSheetByName('INCOMING_V3');
  if (!sheet) {
    sheet = ss.insertSheet('INCOMING_V3');
    sheet.appendRow(['ID','Est. Date','Category','Name','Qty','Unit','Supplier','PO','Notes','Status','Added By','Added At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  return sheet;
}

function getIncoming() {
  var auth = getUserRole();
  if (auth.role === 'DENIED') throw new Error('Access denied.');
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('INCOMING_V3');
  if (!sheet) return [];

  var data    = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var estDate = '';
    if (row[1] instanceof Date) {
      estDate = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else if (row[1]) {
      estDate = String(row[1]).substring(0, 10);
    }
    results.push({
      id:       String(row[0]),
      estDate:  estDate,
      category: String(row[2]  || '').toUpperCase().trim(),
      name:     String(row[3]  || '').trim(),
      qty:      Number(row[4]  || 0),
      unit:     String(row[5]  || 'UNIT'),
      supplier: _safeStr(row[6]),
      po:       _safeStr(row[7]),   // Sheets may return a Date if cell was auto-formatted
      notes:    _safeStr(row[8]),
      status:   String(row[9]  || 'Pending'),
      addedBy:  String(row[10] || ''),
      addedAt:  String(row[11] || '')
    });
  }
  // Return sorted nearest-first
  return results.sort(function(a, b) {
    return (a.estDate || '') < (b.estDate || '') ? -1 : 1;
  });
}

function addIncoming(data) {
  var auth = getUserRole();
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _ensureIncomingSheet(ss);
  var id    = 'INC-' + new Date().getTime();
  // Add noon UTC to avoid timezone shift when GAS converts string→Date
  var estDate = data.estDate ? new Date(data.estDate + 'T12:00:00') : '';
  sheet.appendRow([
    id,
    estDate,
    String(data.category || '').toUpperCase().trim(),
    String(data.name     || '').trim(),
    Number(data.qty      || 0),
    String(data.unit     || 'UNIT'),
    String(data.supplier || ''),
    String(data.po       || ''),
    String(data.notes    || ''),
    'Pending',
    auth.email,
    new Date()
  ]);
  return { status: 'success', id: id };
}

function updateIncoming(data) {
  var auth = getUserRole();
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet  = ss.getSheetByName('INCOMING_V3');
  if (!sheet) throw new Error('INCOMING_V3 sheet not found.');
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id)) {
      var estDate = data.estDate ? new Date(data.estDate + 'T12:00:00') : values[i][1];
      sheet.getRange(i + 1, 1, 1, 12).setValues([[
        data.id,
        estDate,
        String(data.category || '').toUpperCase().trim(),
        String(data.name     || '').trim(),
        Number(data.qty      || 0),
        String(data.unit     || 'UNIT'),
        String(data.supplier || ''),
        String(data.po       || ''),
        String(data.notes    || ''),
        String(data.status   || 'Pending'),
        values[i][10],  // preserve addedBy
        values[i][11]   // preserve addedAt
      ]]);
      return { status: 'success' };
    }
  }
  throw new Error('Incoming item not found: ' + data.id);
}

function deleteIncoming(id) {
  var auth = getUserRole();
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet  = ss.getSheetByName('INCOMING_V3');
  if (!sheet) throw new Error('INCOMING_V3 sheet not found.');
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  throw new Error('Incoming item not found: ' + id);
}

// ─── MONITORED MATERIALS ──────────────────────────────────────────────────────
// null  = monitor ALL materials (default — no filter)
// array = monitor only these material names in the low-stock alert banner

function getMonitoredMaterials() {
  var auth = getUserRole();
  if (auth.role === 'DENIED') throw new Error('Access denied.');
  var props = PropertiesService.getScriptProperties();
  var raw   = props.getProperty('WMS_MONITORED_MATERIALS');
  if (!raw) return null;
  try   { return JSON.parse(raw); }
  catch (e) { return null; }
}

// ─── AI DOCUMENT EXTRACTION ──────────────────────────────────────────────────
// Calls Gemini 1.5 Flash to extract structured data from an invoice / delivery note.
// Requires GEMINI_API_KEY in Script Properties (Project Settings → Script Properties).
//
// To add the key:  GAS Editor → ⚙ Project Settings → Script Properties → Add:
//   Property: GEMINI_API_KEY   Value: your_key_from_aistudio.google.com
//
function extractDocumentInfo(fileData, mimeType) {
  var auth = getUserRole();
  if (auth.role === 'DENIED') throw new Error('Access denied.');

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error(
    'GEMINI_API_KEY not configured.\n' +
    'Ask your admin to add it:\n' +
    'GAS Editor → ⚙ Project Settings → Script Properties\n' +
    'Property: GEMINI_API_KEY  |  Value: your key from aistudio.google.com'
  );

  var prompt =
    'You are analyzing a delivery receipt, invoice, or purchase order for a glass and window ' +
    'installation warehouse.\n\n' +
    'Extract all relevant fields and return ONLY a valid JSON object — no markdown, no explanation:\n' +
    '{\n' +
    '  "name":         "material or product name / description",\n' +
    '  "category":     "one of: WINDOW | SCREEN | WINDOW_PARTS | SHOWER | MIRROR | STOREFRONT | TOOLS | BONEYARD | FLASHING | SCREWS | IGU",\n' +
    '  "qty":          number_or_null,\n' +
    '  "unit":         "UNIT | SQ FT | LN FT | PIECE | BOX | PALLET",\n' +
    '  "supplier":     "vendor / supplier name",\n' +
    '  "po":           "PO number or order number",\n' +
    '  "dateReceived": "YYYY-MM-DD or null",\n' +
    '  "gc":           "general contractor name if present",\n' +
    '  "project":      "project name or delivery address if mentioned",\n' +
    '  "comments":     "any other relevant notes (truck, time, special instructions)"\n' +
    '}\n\n' +
    'If a field is not clearly present, use null. ' +
    'For category, infer from the product description. ' +
    'For qty, extract the total quantity being delivered.';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

  var requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: fileData } }
      ]
    }],
    generationConfig: { temperature: 0.05 }
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    var errObj = {};
    try { errObj = JSON.parse(body); } catch(e) {}
    throw new Error('Gemini API error ' + code + ': ' + (errObj.error ? errObj.error.message : body.substring(0, 200)));
  }

  var result = JSON.parse(body);
  if (!result.candidates || !result.candidates.length) {
    throw new Error('Gemini returned no candidates. The document may be unclear or blocked.');
  }

  var text = (result.candidates[0].content.parts[0].text || '').trim();

  // Strip optional markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return { status: 'success', data: JSON.parse(text) };
  } catch(e) {
    // Last-resort: pull the first {...} block
    var match = text.match(/\{[\s\S]*\}/);
    if (match) return { status: 'success', data: JSON.parse(match[0]) };
    throw new Error('Could not parse AI response. Raw: ' + text.substring(0, 300));
  }
}

function setMonitoredMaterials(names) {
  var auth = getUserRole();
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  var props = PropertiesService.getScriptProperties();
  if (!names || names.length === 0) {
    props.deleteProperty('WMS_MONITORED_MATERIALS');
    return { status: 'success', message: 'Monitoring all materials (no filter applied).' };
  }
  // Normalize to uppercase for reliable comparison
  var normalized = names.map(function(n){ return String(n).toUpperCase().trim(); });
  props.setProperty('WMS_MONITORED_MATERIALS', JSON.stringify(normalized));
  return { status: 'success' };
}
