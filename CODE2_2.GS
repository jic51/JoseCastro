// ─── ROUTING ─────────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OX Glass WMS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ─── SHEET HELPERS ────────────────────────────────────────────────────────────
function _getArchiveSheet(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName().toLowerCase().trim();
    if (name === 'master archive' || name === 'movements' || name.indexOf('archive') !== -1) {
      return sheets[i];
    }
  }
  return null;
}

function _getLiveStockSheet(ss) {
  return ss.getSheetByName('LIVE_STOCK');
}

// ─── INITIAL DATA LOAD ────────────────────────────────────────────────────────
function getInitialData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var archiveSheet = _getArchiveSheet(ss);
    if (!archiveSheet) throw new Error('Master Archive sheet not found.');

    var movements = [];
    var mData = archiveSheet.getDataRange().getValues();

    for (var j = 1; j < mData.length; j++) {
      var row = mData[j];
      if (!row[1] && !row[2]) continue;

      var dateRec = '';
      if (row[7] instanceof Date) {
        dateRec = Utilities.formatDate(row[7], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (row[7]) {
        dateRec = String(row[7]);
      }

      var sysDate = '';
      if (row[0] instanceof Date) {
        sysDate = Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');
      }

      movements.push({
        rowIdx:     j + 1,
        sysDate:    sysDate,
        type:       String(row[1]  || '').toUpperCase().trim(),
        name:       String(row[2]  || '').trim(),
        gc:         String(row[3]  || ''),
        po:         String(row[4]  || ''),
        qty:        Number(row[5]  || 0),
        unit:       String(row[6]  || ''),
        dateRec:    dateRec,
        loc:        String(row[8]  || ''),
        supplier:   String(row[9]  || '').trim(),
        comment:    String(row[10] || ''),
        status:     String(row[11] || ''),
        resp:       String(row[12] || ''),
        project:    String(row[13] || ''),
        docLink:    String(row[15] || ''),
        auditUser:  String(row[16] || 'System'),
        source:     String(row[17] || ''),
        destination: String(row[18] || '')
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
  var sheet = ss.getSheetByName('CONFIG.');
  if (!sheet) sheet = ss.getSheetByName('CONFIG');
  if (!sheet) return { projects: [], racks: [], suppliers: [], categories: [], locations: [] };

  var data = sheet.getDataRange().getValues();
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

// ─── STOCK BALANCE ────────────────────────────────────────────────────────────
function _getCurrentStock(archiveSheet) {
  var stock = {};
  var data = archiveSheet.getDataRange().getValues();
  for (var j = 1; j < data.length; j++) {
    var row = data[j];
    if (!row[1] && !row[2]) continue;
    var type = String(row[1] || '').toUpperCase().trim();
    var name = String(row[2] || '').trim();
    var qty  = Number(row[5] || 0);
    var loc  = String(row[8] || '').trim();
    var key  = name + '___' + type + '___' + loc;
    stock[key] = (stock[key] || 0) + qty;
    if (stock[key] < 0) stock[key] = 0; 
  }
  return stock;
}

function _getTotalStockForItem(archiveSheet, name, type) {
  var stock = _getCurrentStock(archiveSheet);
  var total = 0;
  var prefix = name + '___' + type + '___';
  Object.keys(stock).forEach(function(k) {
    if (k.indexOf(prefix) === 0) total += stock[k];
  });
  return total;
}

// ─── PROCESS MOVEMENT ────────────────────────────────────────────────────────
function processMovement(action, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = _getArchiveSheet(ss);
  if (!archiveSheet) throw new Error('Master Archive not found.');

  var userEmail = '';
  try { userEmail = Session.getActiveUser().getEmail() || 'Unknown'; } catch(e) { userEmail = 'System'; }

  if (action === 'addMovement') {
    return _addMovement(ss, archiveSheet, data, userEmail);
  }

  if (action === 'updateDocument') {
    return _updateDocument(ss, archiveSheet, data, userEmail);
  }

  throw new Error('Unknown action: ' + action);
}

function _addMovement(ss, archiveSheet, data, userEmail) {
  var qty = Number(data.qty || 0);

  if (qty < 0) {
    var type = String(data.type || '').toUpperCase().trim();
    var name = String(data.name || '').trim();
    var totalAvail = _getTotalStockForItem(archiveSheet, name, type);
    if (totalAvail + qty < 0) {
      data.comment = (data.comment || '') + ' [⚠️ DISPATCHED OVER STOCK: had ' + totalAvail + ']';
    }
  }

  var locType = 'RACK';
  if (data.project && data.loc === data.project) locType = 'PROJECT';
  if (data.locType) locType = data.locType;

  var newRow = [
    new Date(),         
    data.type,          
    data.name,          
    data.gc || '',      
    data.po || '',      
    qty,                
    data.unit || '',    
    data.dateRec || '', 
    data.loc || '',     
    data.supplier || '',
    data.comment || '', 
    data.status || '',  
    data.resp || '',    
    data.project || '', 
    '',                 
    '',                 
    userEmail,          
    data.source || data.loc || '',        
    data.destination || data.loc || ''    
  ];

  archiveSheet.appendRow(newRow);
  var newRowIdx = archiveSheet.getLastRow();

  if (data.files && data.files.length > 0) {
    var docLink = _uploadFiles(data.files, data.name, data.po);
    if (docLink) archiveSheet.getRange(newRowIdx, 16).setValue(docLink);
  }

  // AQUÍ ESTÁ LA CORRECCIÓN DEL BUG MATEMÁTICO: AHORA LE PASA "data.type" a LIVE_STOCK
  _updateLiveStock(ss, data.type, data.name, data.loc, qty, locType);
  _checkNotifications(data);

  return { status: 'success', rowIdx: newRowIdx };
}

function _updateDocument(ss, archiveSheet, data, userEmail) {
  if (!data.files || !data.files.length) throw new Error('No file provided.');
  var docLink = _uploadFiles(data.files, 'attachment', 'row-' + data.rowIdx);
  if (docLink && data.rowIdx) {
    var existing = archiveSheet.getRange(data.rowIdx, 16).getValue();
    var newLink = existing ? existing + '\n' + docLink : docLink;
    archiveSheet.getRange(data.rowIdx, 16).setValue(newLink);
  }
  return { status: 'success' };
}

// ─── FILE UPLOAD MULTIPLE ──────────────────────────────────────────────────
function _uploadFiles(files, materialName, po) {
  try {
    var folder = _getOrCreateFolder('OX Glass WMS Docs/' + (materialName || 'General'));
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

function _getOrCreateFolder(path) {
  var parts = path.split('/');
  var current = DriveApp.getRootFolder();
  parts.forEach(function(part) {
    var folders = current.getFoldersByName(part);
    current = folders.hasNext() ? folders.next() : current.createFolder(part);
  });
  return current;
}

// ─── LIVE STOCK UPDATE ────────────────────────────────────────────────────────
function _updateLiveStock(ss, type, name, loc, qty, locType) {
  var liveSheet = _getLiveStockSheet(ss);
  if (!liveSheet) return;
  locType = locType || 'RACK';

  var vals = liveSheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    // CORRECCIÓN MAGISTRAL: Ahora compara también el TIPO (categoría), y ya no mezcla Windows con Screens
    if (String(vals[i][0]).toUpperCase().trim() === type.toUpperCase().trim() && 
        String(vals[i][1]).trim() === name && 
        String(vals[i][2]).trim() === loc) {
      var newQty = Math.max(0, (Number(vals[i][3]) || 0) + qty); 
      liveSheet.getRange(i + 1, 4).setValue(newQty);
      liveSheet.getRange(i + 1, 5).setValue(locType);
      liveSheet.getRange(i + 1, 6).setValue(new Date());
      return;
    }
  }
  if (qty > 0) {
    liveSheet.appendRow([type, name, loc, qty, locType, new Date()]);
  }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function _checkNotifications(data) {
  try {
    var recipient = 'jose@ox-glass.com';
    var qty = Number(data.qty || 0);

    if (qty > 0 && ['SHOWER', 'MIRROR', 'IGU'].indexOf((data.type || '').toUpperCase()) !== -1) {
      MailApp.sendEmail(recipient,
        '📦 High-Value Item Received: ' + data.type,
        'Item: ' + data.name + '\nQty: ' + qty + '\nLocation: ' + (data.loc || 'N/A') +
        '\nProject: ' + (data.project || 'N/A') + '\nSupplier: ' + (data.supplier || 'N/A') +
        '\nComments: ' + (data.comment || '')
      );
    }

    if (qty < 0 && Math.abs(qty) > 20) {
      MailApp.sendEmail(recipient,
        '🚚 Large Dispatch: ' + data.name + ' (' + Math.abs(qty) + ' units)',
        'Dispatched: ' + Math.abs(qty) + ' units of ' + data.name +
        '\nTo: ' + (data.loc || data.destination || 'N/A') +
        '\nProject: ' + (data.project || 'N/A') + '\nBy: ' + (data.resp || 'N/A')
      );
    }
  } catch (e) {
    Logger.log('Notification error: ' + e.message);
  }
}