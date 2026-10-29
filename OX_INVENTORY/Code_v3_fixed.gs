

































































































































var APP_VERSION = '13.3';











var APP_BUILD = '908d5ed4';






























































var ACOPIO_BASIC = false;







































function basicApagado_() { return ACOPIO_BASIC === true; }







































function basicIdentidad_() {
  var p = PropertiesService.getScriptProperties();
  return {
    name:  String(p.getProperty('BASIC_USER_NAME')  || '').trim(),
    email: String(p.getProperty('BASIC_USER_EMAIL') || '').trim()
  };
}







function saveBasicIdentity(d) {
  if (!basicApagado_()) throw new Error('Not available in Acopio Pro.');
  







  var auth = setVerifiedAuth_(getUserRole(d && d._sessionToken));
  requireAuth_('WRITE');
  var p     = PropertiesService.getScriptProperties();
  var nom   = String((d && d.name)  || '').trim().slice(0, 60);
  var email = String((d && d.email) || '').trim().slice(0, 120);
  

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('That does not look like an email address.');
  }
  p.setProperty('BASIC_USER_NAME',  nom);
  p.setProperty('BASIC_USER_EMAIL', email);
  return { name: nom, email: email };
}

function basicNiega_(queEs) {
  if (!ACOPIO_BASIC) return;
  throw new Error(queEs + ' is not part of Acopio Basic. ' +
                  'The free edition only asks for permission to use this one ' +
                  'spreadsheet, and this feature needs more. It is included in ' +
                  'Acopio Pro.');
}

















































var ACOPIO_FAVICON_URL = 'https://lh3.googleusercontent.com/d/1taYWwdJzwbArrSVjtTideDrJyNOyenOq#.png';

var SHEETS = {
  ARCHIVE: 'MASTER_ARCHIVE_V3',
  LIVE: 'LIVE_STOCK',
  SITE: 'SITE_STOCK',
  WASTE: 'WASTED_STOCK',
  RESERVATIONS: 'RESERVATIONS',
  CONFIG: 'CONFIG',
  AUDIT: 'AUDIT_LOG',
  ERRORS: 'ERROR_LOG',
  ARCHIVE_HISTORY: 'ARCHIVE_HISTORY',
  
  
  
  
  
  
  
  
  TRASH: 'MOVEMENT_TRASH',
  
  
  CONFIG_SNAPSHOT: 'ACOPIO_CONFIG_SNAPSHOT',
  
  
  PACKS: 'MATERIAL_PACKS'
};






var AC = {
  TIMESTAMP:0,  CATEGORY:1,  NAME:2,     GC:3,        PO:4,
  QTY:5,        UNIT:6,      DATE_REC:7, SRC_LOC:8,   SUPPLIER:9,
  COMMENTS:10,  STATUS:11,   RESPONSIBLE:12, PROJECT:13, MAT_ID:14,
  DOC_LINKS:15, USER_EMAIL:16, DEST_LOC:17,  MOVETYPE:18, PM:19,
  
  
  
  
  
  UNIT_COST:20, TOTAL_COST:21,
  
  
  
  
  
  
  
  
  
  
  
  
  
  MOV_ID:22,

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ORIGIN_PROJECT:23, FROM_MOV:24,

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  IMPORT_ID:25
};





var AC_WIDTH = 26;




var TR = { DELETED_AT: AC_WIDTH, DELETED_BY: AC_WIDTH + 1, FROM_SHEET: AC_WIDTH + 2 };
var TRASH_WIDTH = AC_WIDTH + 3;










function newMovId_(seq, when) {
  var t = (when instanceof Date ? when.getTime() : new Date().getTime()).toString(36).toUpperCase();
  var r = ('00' + Math.floor(Math.random() * 46656).toString(36).toUpperCase()).slice(-3);
  return 'M' + t + '-' + r + '-' + (seq || 0);
}



































function autorDeLaFila_(email) {
  return String(email || '').trim() || 'BASIC';
}

function padRow_(row, width) {
  var out = (row || []).slice(0, width);
  while (out.length < width) out.push('');
  return out;
}






function ensureArchiveWidth_(sheet) {
  if (!sheet) return;
  var have = sheet.getMaxColumns();
  if (have < AC_WIDTH) sheet.insertColumnsAfter(have, AC_WIDTH - have);
}






function readWidth_(sheet) {
  return Math.min(AC_WIDTH, sheet.getMaxColumns());
}







var PRODUCT_NAME = 'Acopio';

function companySettings_() {
  var p = PropertiesService.getScriptProperties();
  return {
    name:   p.getProperty('COMPANY_NAME')   || '',
    domain: p.getProperty('COMPANY_DOMAIN') || '',
    logoId: p.getProperty('COMPANY_LOGO_ID')|| '',
    
    
    
    
    folderPrefix:  p.getProperty('FOLDER_PREFIX') || 'OX_WMS_v3',
    setupComplete: p.getProperty('SETUP_COMPLETE') === 'true'
  };
}




function publicCompany_() {
  var cs = companySettings_();
  return { name: cs.name, domain: cs.domain, logoId: cs.logoId, productName: PRODUCT_NAME };
}

















function masterFolderName_() { return companySettings_().folderPrefix; }

function getMasterFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_MASTER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }    
  var f = DriveApp.createFolder(masterFolderName_());
  try { props.setProperty('FOLDER_MASTER', f.getId()); } catch (e) {}
  return f;
}



function ensureUnderMaster_(item) {
  try {
    var master = getMasterFolder_();
    if (item.getId() === master.getId()) return;
    var parents = item.getParents();
    while (parents.hasNext()) if (parents.next().getId() === master.getId()) return;
    item.moveTo(master);
  } catch (e) {
    Logger.log('ensureUnderMaster_: ' + e.message);
  }
}



function organizeDriveFolders_() {
  var moved = [];
  var master = getMasterFolder_();

  [docsFolderName_(), backupFolderName_(), feedbackFolderName_()].forEach(function (name) {
    var key = 'FOLDER_' + name.replace(/\W/g, '_');
    var id  = PropertiesService.getScriptProperties().getProperty(key);
    if (!id) return;                        
    try {
      var f = DriveApp.getFolderById(id);
      var already = false;
      var ps = f.getParents();
      while (ps.hasNext()) if (ps.next().getId() === master.getId()) already = true;
      if (!already) { f.moveTo(master); moved.push(f.getName()); }
    } catch (e) { Logger.log('organizeDriveFolders_ ' + name + ': ' + e.message); }
  });

  
  
  try {
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var file = DriveApp.getFileById(ss.getId());
    var inMaster = false;
    var fps = file.getParents();
    while (fps.hasNext()) if (fps.next().getId() === master.getId()) inMaster = true;
    if (!inMaster) { file.moveTo(master); moved.push(file.getName()); }
  } catch (e) { Logger.log('organizeDriveFolders_ sheet: ' + e.message); }

  PropertiesService.getScriptProperties().setProperty('DRIVE_ORGANIZED', 'true');
  return { master: master.getName(), moved: moved };
}

function menuOrganizeDrive() {
  var ui = SpreadsheetApp.getUi();
  var r = organizeDriveFolders_();
  ui.alert('📁 ' + PRODUCT_NAME + ' — Drive',
    r.moved.length
      ? 'Everything now lives in one folder:\n\n' + r.master + '\n\nMoved:\n  • ' + r.moved.join('\n  • ') +
        '\n\nNothing was renamed and nothing was lost — only the location changed.'
      : 'Already tidy. Everything is in ' + r.master + '.',
    ui.ButtonSet.OK);
}

function docsFolderName_()     { return companySettings_().folderPrefix + '_Docs'; }
function backupFolderName_()   { return companySettings_().folderPrefix + '_Backups'; }
function feedbackFolderName_() { return companySettings_().folderPrefix + '_Feedback'; }


function folderPrefixFor_(companyName) {
  var slug = String(companyName || '').trim()
    .replace(/[^\w\s-]/g, '')       
    .replace(/\s+/g, '_')
    .substring(0, 40);
  return slug ? (PRODUCT_NAME + '_' + slug) : (PRODUCT_NAME + '_WMS');
}




function adminNotifyEmail_() {
  try {
    var cfg = loadConfig();
    if (cfg.adminEmail) return cfg.adminEmail;
  } catch (e) {}
  try { return Session.getEffectiveUser().getEmail(); } catch (e) { return ''; }
}












































function getSetupState() {
  












  if (basicApagado_()) return { productName: PRODUCT_NAME, needsSetup: false };
  var quien = '';
  try { quien = Session.getActiveUser().getEmail(); } catch (e) {}
  requireQuota_('setup', quien, 120, 300);
  var cs = companySettings_();
  var out = { productName: PRODUCT_NAME, needsSetup: !cs.setupComplete };
  if (!out.needsSetup) return out;

  var owner = '', visitor = '';
  try { owner   = Session.getEffectiveUser().getEmail(); } catch (e) {}
  try { visitor = Session.getActiveUser().getEmail();    } catch (e) {}
  out.ownerEmail = owner;
  out.isOwner    = !!owner && owner === visitor;
  return out;
}




























function ensureCoreSheets_(ss) {
  var SPEC = [
    { name: SHEETS.ARCHIVE, header: [
        'System Date','Type','Name','GC','PO#','Qty','Unit','Date Received','Source Location',
        'Supplier','Comments','Status','Received By','Project','Mat ID','Doc Links','User Email',
        'Destination Location','MoveType','PM','Unit Cost','Total Cost','Movement ID',
        'Left Over From','From Movement','Import ID'] },
    { name: SHEETS.CONFIG, header: [
        'Projects','Categories','Suppliers','Locations','Location Type','User Email','User Role',
        'Admin Email','Truck','Truck Person','Truck Status','Min Stock Material','Min Stock Qty',
        'Archive Cutoff Months','Cost Category','Cost Material','Avg Cost'] },
    { name: SHEETS.RESERVATIONS, header: [
        'ID','Category','Name','Project','Qty','Reserved By','Date','Status','Release Date'] },
    




















    { name: SHEETS.AUDIT, header: ['Timestamp','Action','User','Details','Detail 2','Detail 3'],
      renombrar: [ { col: 5, de: 'Old Value', a: 'Detail 2' },
                   { col: 6, de: 'New Value', a: 'Detail 3' } ] },
    
    
    { name: SHEETS.LIVE, header: null },
    { name: SHEETS.SITE, header: null }
  ];

  var created = [], repaired = [];
  SPEC.forEach(function(spec){
    var yaEsta = ss.getSheetByName(spec.name);
    if (yaEsta) {
      
      
      
      
      
      
      
      
      
      
      var n = fillMissingHeaders_(yaEsta, spec.header);
      if (n) repaired.push(spec.name + ' (' + n + ')');
      
      
      
      
      var renom = renombrarCabeceras_(yaEsta, spec.renombrar);
      if (renom.length) repaired.push(spec.name + ' (renamed: ' + renom.join(', ') + ')');
      return;
    }
    var sheet;
    
    
    
    var sheets = ss.getSheets();
    if (sheets.length === 1 && sheets[0].getLastRow() === 0 && sheets[0].getLastColumn() === 0) {
      sheet = sheets[0].setName(spec.name);
    } else {
      sheet = ss.insertSheet(spec.name);
    }
    if (spec.header) {
      sheet.getRange(1, 1, 1, spec.header.length).setValues([spec.header]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, spec.header.length).setFontWeight('bold');
    }
    created.push(spec.name);
  });

  
  
  try { ensureUsersSheet_(ss);          } catch (e) {}
  try { ensureIncomingSheet_(ss);       } catch (e) {}
  try { ensureRackPhotosSheet_(ss);     } catch (e) {}
  try { ensureMaterialLocksSheet_(ss);  } catch (e) {}
  try { ensurePmDirectorySheet_(ss);    } catch (e) {}
  try { ensureErrorLogSheet_(ss);       } catch (e) {}
  try { ensureWasteSheet_(ss);          } catch (e) {}
  try { ensureArchiveHistorySheet_(ss); } catch (e) {}

  










  try { aplicarFormatoEstandar_(ss, { completo: true }); } catch (e) {
    try { Logger.log('aplicarFormatoEstandar_: ' + e.message); } catch (e2) {}
  }

  if (repaired.length) {
    try { auditLog_(ss, 'REPAIR_HEADERS', 'system', repaired.join(', '), '', ''); } catch (e) {}
  }
  







  return { created: created, repaired: repaired };
}






















































var FORMATO_CABECERA_ALTO = 28;




function gruposDeFormato_() {
  return [
    { grupo: 'documento', color: SH_NAVY, proteger: true, nota: '',
      hojas: [START_HERE_SHEET, TERMS_SHEET, PRIVACY_SHEET] },
    { grupo: 'datos', color: SH_ACCENT, proteger: false, nota: '',
      hojas: [SHEETS.ARCHIVE, 'INCOMING_V3', 'USERS_V3', SHEETS.CONFIG,
              SHEETS.PACKS, 'PM_DIRECTORY', 'RACK_PHOTOS'] },
    { grupo: 'calculada', color: SH_MUTED, proteger: true,
      nota: 'Rebuilt by ' + PRODUCT_NAME + ' from ' + SHEETS.ARCHIVE + '.\n' +
            'Edits here are overwritten — change the movement instead.',
      hojas: [SHEETS.LIVE, SHEETS.SITE, SHEETS.WASTE, SHEETS.RESERVATIONS, 'MATERIAL_LOCKS'] },
    { grupo: 'registro', color: '#9CA3AF', proteger: true,
      nota: 'A record of what happened. Rows are only ever added.\n' +
            'Correcting one here does not correct anything else.',
      hojas: [SHEETS.AUDIT, SHEETS.ERRORS, SHEETS.ARCHIVE_HISTORY, SHEETS.TRASH] }
  ];
}






















function notasPorHoja_() {
  var n = {};
  n[SHEETS.RESERVATIONS] =
    'NOT USED. Reservations are kept in MATERIAL_LOCKS.\n' +
    'This tab is from an earlier version of ' + PRODUCT_NAME + '. Nothing reads it,\n' +
    'nothing writes to it, and it is kept empty on purpose — not deleted, in case\n' +
    'an older installation left data here. Safe to ignore.';
  return n;
}




function anchosDelArchivo_() {
  var a = {};
  a[AC.TIMESTAMP] = 140;  a[AC.DATE_REC]  = 100;
  a[AC.CATEGORY]  = 170;  a[AC.NAME]      = 260;
  a[AC.QTY]       = 80;   a[AC.UNIT]      = 90;
  a[AC.SRC_LOC]   = 120;  a[AC.DEST_LOC]  = 120;
  a[AC.SUPPLIER]  = 170;  a[AC.PROJECT]   = 170;
  a[AC.PO]        = 110;  a[AC.STATUS]    = 110;
  a[AC.COMMENTS]  = 260;  a[AC.MAT_ID]    = 220;
  a[AC.MOV_ID]    = 180;  a[AC.USER_EMAIL]= 200;
  a[AC.UNIT_COST] = 90;   a[AC.TOTAL_COST]= 90;
  return a;
}



function hojaVacia_(sheet) {
  try { return sheet.getLastRow() <= 1; } catch (e) { return false; }
}






function protegerConAviso_(sheet) {
  try {
    var ya = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (ya && ya.length) return false;
    sheet.protect().setWarningOnly(true);
    return true;
  } catch (e) { return false; }
}

function aplicarFormatoEstandar_(ss, opciones) {
  opciones = opciones || {};
  var completo = !!opciones.completo;
  var rep = { pestanas: 0, cabeceras: 0, notas: 0, protegidas: 0,
              texto: [], anchos: 0, saltadas: [], fallos: [] };
  var orden = [];

  gruposDeFormato_().forEach(function (g) {
    g.hojas.forEach(function (nombre) {
      var sh = ss.getSheetByName(nombre);
      if (!sh) return;                        
      orden.push(sh);
      try {
        if (sh.getTabColor() !== g.color) { sh.setTabColor(g.color); rep.pestanas++; }

        
        
        if (g.grupo !== 'documento') {
          var ancho = Math.max(1, sh.getLastColumn());
          var cab = sh.getRange(1, 1, 1, ancho);
          if (cab.getBackground() !== SH_NAVY) {
            cab.setBackground(SH_NAVY).setFontColor('#FFFFFF').setFontWeight('bold')
               .setFontSize(9.5).setVerticalAlignment('bottom');
            sh.setRowHeight(1, FORMATO_CABECERA_ALTO);
            rep.cabeceras++;
          }
          try { sh.setFrozenRows(1); } catch (e) {}
        }

        
        
        
        
        
        
        var nota = notasPorHoja_()[nombre] || g.nota;
        if (nota) {
          var a1 = sh.getRange(1, 1);
          if (String(a1.getNote() || '') !== nota) { a1.setNote(nota); rep.notas++; }
        }

        if (g.proteger && protegerConAviso_(sh)) rep.protegidas++;

        if (completo) {
          if (g.grupo === 'documento') return;
          if (!hojaVacia_(sh)) { rep.saltadas.push(nombre); return; }

          
          
          var filas = Math.max(1, sh.getMaxRows() - 1);
          var cols  = Math.max(1, sh.getMaxColumns());
          sh.getRange(2, 1, filas, cols).setNumberFormat('@');
          rep.texto.push(nombre);

          if (nombre === SHEETS.ARCHIVE || nombre === SHEETS.ARCHIVE_HISTORY ||
              nombre === SHEETS.TRASH) {
            var anchos = anchosDelArchivo_();
            Object.keys(anchos).forEach(function (idx) {
              var col = Number(idx) + 1;
              if (col > sh.getMaxColumns()) return;
              sh.setColumnWidth(col, anchos[idx]);
              rep.anchos++;
            });
            
            
            
            [AC.QTY, AC.UNIT_COST, AC.TOTAL_COST].forEach(function (c) {
              if (c + 1 <= sh.getMaxColumns()) {
                sh.getRange(2, c + 1, filas, 1).setHorizontalAlignment('right');
              }
            });
          }
        }
      } catch (e) { rep.fallos.push(nombre + ': ' + e.message); }
    });
  });

  
  
  if (completo) {
    try {
      for (var i = 0; i < orden.length; i++) {
        ss.setActiveSheet(orden[i]);
        ss.moveActiveSheet(i + 1);
      }
    } catch (e) { rep.fallos.push('orden: ' + e.message); }
  }
  return rep;
}















function fillMissingHeaders_(sheet, header) {
  if (!sheet || !header || !header.length) return 0;

  
  
  var have = sheet.getMaxColumns();
  if (have < header.length) sheet.insertColumnsAfter(have, header.length - have);

  var fila = sheet.getRange(1, 1, 1, header.length).getValues()[0];
  var faltan = 0;
  for (var i = 0; i < header.length; i++) {
    if (String(fila[i] || '').trim() !== '') continue;    
    fila[i] = header[i];
    faltan++;
  }
  if (!faltan) return 0;

  sheet.getRange(1, 1, 1, header.length).setValues([fila]).setFontWeight('bold');
  try { sheet.setFrozenRows(1); } catch (e) {}
  return faltan;
}




















function renombrarCabeceras_(sheet, renombres) {
  var hechos = [];
  if (!sheet || !renombres || !renombres.length) return hechos;
  renombres.forEach(function (r) {
    try {
      if (r.col > sheet.getMaxColumns()) return;
      var celda = sheet.getRange(1, r.col);
      if (String(celda.getValue() || '').trim() !== r.de) return;
      celda.setValue(r.a).setFontWeight('bold');
      hechos.push(r.de + ' → ' + r.a);
    } catch (e) {}
  });
  return hechos;
}

function saveSetupWizard(data) {
  data = data || {};
  var cs = companySettings_();
  var actor;
  if (cs.setupComplete) {
    
    actor = requireAuth_('ADMIN').email;
  } else {
    
    
    actor = requireOwnerContext_();
    setVerifiedAuth_({ role: 'ADMIN', email: actor, name: 'Setup wizard' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p  = PropertiesService.getScriptProperties();

  
  
  ensureCoreSheets_(ss);

  var companyName = String(data.companyName || '').trim();
  if (!companyName) throw new Error('Company name is required.');
  p.setProperty('COMPANY_NAME', companyName);
  p.setProperty('COMPANY_DOMAIN', String(data.companyDomain || '').trim().replace(/^@/, ''));

  
  
  
  
  
  
  try {
    var wanted = companyName + ' — ' + PRODUCT_NAME;
    if (ss.getName() !== wanted) ss.rename(wanted);
  } catch (e) {}

  
  
  if (!p.getProperty('FOLDER_PREFIX')) {
    p.setProperty('FOLDER_PREFIX', folderPrefixFor_(companyName));
  }

  if (data.logo && data.logo.fileData) {
    var bytes = Utilities.base64Decode(data.logo.fileData);
    var blob  = Utilities.newBlob(bytes, data.logo.fileMimeType || 'image/png', 'logo');
    var file  = getOrCreateFolder_(docsFolderName_()).createFile(blob);
    p.setProperty('COMPANY_LOGO_ID', file.getId());
  }

  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (cfg) {
    
    
    
    
    
    if (data.categories && data.categories.length) writeConfigColumn_(cfg, 1, data.categories);
    if (data.suppliers  && data.suppliers.length)  writeConfigColumn_(cfg, 2, data.suppliers);
    if (data.projects   && data.projects.length)   writeConfigColumn_(cfg, 0, data.projects);
    if (data.locations && data.locations.length) {
      
      writeConfigColumns_(cfg, 3, [
        data.locations.map(function(l){ return l.name; }),
        data.locations.map(function(l){ return l.type || 'RACK'; })
      ]);
    }
    cfg.getRange(2, 8).setValue(textCell_(String(data.adminEmail || actor).trim()));
  }

  
  
  
  var users = ensureUsersSheet_(ss);
  var existing = {};
  if (users.getLastRow() > 1) {
    users.getDataRange().getValues().slice(1).forEach(function(r){
      existing[String(r[1] || '').toLowerCase().trim()] = true;
    });
  }
  var toAdd = [{ email: actor, name: String(data.adminName || '').trim(), role: 'ADMIN' }]
    .concat(data.users || []);
  var now = new Date();
  toAdd.forEach(function(u, i){
    var email = String(u.email || '').toLowerCase().trim();
    if (!email || email.indexOf('@') === -1 || existing[email]) return;
    var role = String(u.role || 'WAREHOUSE').toUpperCase().trim();
    if (ROLES.indexOf(role) === -1) role = 'WAREHOUSE';
    users.appendRow(['USR-' + (now.getTime() + i), textCell_(email),
                     textCell_(String(u.name || '').trim()), role, actor, now, true]);
    existing[email] = true;
  });

  
  
  
  
  
  
  
  
  
  if (data.enableBackup) {
    try {
      ensureBackupTrigger_();
      p.deleteProperty('BACKUP_TRIGGER_ERROR');
    } catch (e) {
      Logger.log('ensureBackupTrigger_ FAILED during setup: ' + e.message);
      try { p.setProperty('BACKUP_TRIGGER_ERROR', String(e.message || e).slice(0, 400)); } catch (e2) {}
    }
  }

  
  
  try { organizeDriveFolders_(); } catch (e) { Logger.log('organizeDriveFolders_: ' + e.message); }

  
  
  
  try { refreshDerivedSheets_(ss); } catch (e) {}

  
  
  
  recordTermsAcceptance_(actor);
  removeStartHereSheet_(ss);    

  
  
  
  
  if (!p.getProperty('SETUP_COMPLETED_AT')) p.setProperty('SETUP_COMPLETED_AT', new Date().toISOString());
  try { ensureCheckinTrigger_(); } catch (e) { Logger.log('ensureCheckinTrigger_: ' + e.message); }

  p.setProperty('SETUP_COMPLETE', 'true');
  auditLog_(ss, 'SETUP_COMPLETED', actor, companyName, '', '');
  return { status: 'success', companyName: companyName };
}




function writeConfigColumn_(cfg, colIdx, values) {
  return writeConfigColumns_(cfg, colIdx, [values]);
}















































function writeConfigColumns_(cfg, colIdx, columnas) {
  columnas = columnas || [];
  var ancho = columnas.length;
  if (!ancho) return;

  




















  var vistos = {};
  var repetidas = 0;

  
  var filas = [];
  var alto  = 0;
  for (var c = 0; c < ancho; c++) alto = Math.max(alto, (columnas[c] || []).length);
  for (var r = 0; r < alto; r++) {
    var primera = String(((columnas[0] || [])[r]) || '').trim();
    if (!primera) continue;             
    var clave = primera.toUpperCase();
    if (vistos[clave]) { repetidas++; continue; }
    vistos[clave] = 1;
    var fila = [];
    for (var c2 = 0; c2 < ancho; c2++) {
      
      
      
      
      fila.push(textCell_(String(((columnas[c2] || [])[r]) || '').trim()));
    }
    filas.push(fila);
  }

  




  if (!filas.length) {
    try {
      var habia = 0, ultimaPrevia = cfg.getLastRow();
      if (ultimaPrevia > 1) {
        cfg.getRange(2, colIdx + 1, ultimaPrevia - 1, 1).getValues().forEach(function (f) {
          if (String(f[0] || '').trim()) habia++;
        });
      }
      if (habia) {
        logError_(cfg.getParent(), 'WARN', 'backend', 'writeConfigColumns_', 'system',
          'A CONFIG list was emptied: column ' + (colIdx + 1) + ' had ' + habia +
          ' value(s) and now has none. If nobody deleted them on purpose, restore ' +
          'them from the 2am backup.', { column: colIdx + 1, had: habia }, newRequestId_());
      }
    } catch (e) { Logger.log('writeConfigColumns_ warn: ' + e.message); }
  }

  




  if (repetidas) {
    try {
      logError_(cfg.getParent(), 'WARN', 'backend', 'writeConfigColumns_', 'system',
        repetidas + ' duplicate name(s) were dropped from CONFIG column ' + (colIdx + 1) +
        '. Only the first spelling of each is kept.', { column: colIdx + 1, dropped: repetidas },
        newRequestId_());
    } catch (e) { Logger.log('writeConfigColumns_ dup: ' + e.message); }
  }

  var needed = filas.length + 1;
  if (cfg.getMaxRows() < needed) cfg.insertRowsAfter(cfg.getMaxRows(), needed - cfg.getMaxRows());

  
  if (filas.length) cfg.getRange(2, colIdx + 1, filas.length, ancho).setValues(filas);

  
  var primeraSobrante = filas.length + 2;
  var sobrantes = cfg.getMaxRows() - primeraSobrante + 1;
  if (sobrantes > 0) {
    cfg.getRange(primeraSobrante, colIdx + 1, sobrantes, ancho).clearContent();
  }
}


function doGet(e) {
  
  
  if (e && e.parameter && e.parameter.code && e.parameter.state) {
    return handleOAuthCallback_(e.parameter.code, e.parameter.state);
  }
  var out = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle((companySettings_().name || 'Warehouse') + ' — ' + PRODUCT_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var favicon = String(PropertiesService.getScriptProperties().getProperty('FAVICON_URL') || '').trim();
  if (!favicon) favicon = ACOPIO_FAVICON_URL;
  if (/^https:\/\//i.test(favicon)) {
    try { out.setFaviconUrl(favicon); } catch (e) { Logger.log('setFaviconUrl: ' + e.message); }
  }
  return out;
}






















function getPrivateFileData(fileId, token) {
  var file = resolveOwnFile_(fileId, token, 'getPrivateFileData');
  
  
  
  var size = 0;
  try { size = file.getSize(); } catch (e) {}
  if (size > MAX_ATTACH_BYTES) {
    throw new Error('This file is ' + (size / 1048576).toFixed(1) + ' MB. Files over ' +
      (MAX_ATTACH_BYTES / 1048576) + ' MB cannot be opened inside the app — open it from Drive instead.');
  }
  var blob = file.getBlob();
  return {
    mimeType: blob.getContentType(),
    base64:   Utilities.base64Encode(blob.getBytes())
  };
}

























function getPrivateFileThumbnail(fileId, token, size) {
  var file = resolveOwnFile_(fileId, token, 'getPrivateFileThumbnail');
  var px = parseInt(size, 10);
  if (px > 0) {
    var big = driveThumbnailAtSize_(fileId, px);
    if (big) return big;
  }
  var blob = file.getThumbnail();
  if (!blob) return null;
  return {
    mimeType: blob.getContentType(),
    base64:   Utilities.base64Encode(blob.getBytes())
  };
}






function driveThumbnailAtSize_(fileId, px) {
  try {
    var auth = { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
    var meta = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) + '?fields=thumbnailLink', auth);
    if (meta.getResponseCode() !== 200) return null;
    var link = JSON.parse(meta.getContentText()).thumbnailLink;
    if (!link) return null;
    link = link.replace(/=s\d+(-[a-z]+)?$/, '=s' + px);
    var img = UrlFetchApp.fetch(link, auth);
    if (img.getResponseCode() !== 200) return null;
    var b = img.getBlob();
    return { mimeType: b.getContentType(), base64: Utilities.base64Encode(b.getBytes()) };
  } catch (e) {
    return null;
  }
}







function resolveOwnFile_(fileId, token, callerName) {
  var auth = setVerifiedAuth_(getUserRole(token));
  if (auth.role === 'NO_SESSION' || auth.role === 'DENIED') {
    throw new Error('Not authenticated.');
  }

  
  
  
  
  requireQuota_('file', auth.email, 600, 300);

  var file;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (e) {
    throw new Error('File not found.');
  }

  if (!isFileWithinAppFolder_(file)) {
    logError_(SpreadsheetApp.getActiveSpreadsheet(), 'WARN', 'backend', callerName,
      auth.email, 'Requested file outside app folder: ' + fileId, null, newRequestId_());
    throw new Error('File not found.');
  }
  return file;
}














function acceptedDocFolderNames_() {
  var names = [docsFolderName_()];
  
  
  
  if (names.indexOf('OX_WMS_v3_Docs') === -1) names.push('OX_WMS_v3_Docs');
  var hist = PropertiesService.getScriptProperties().getProperty('FOLDER_PREFIX_HISTORY') || '';
  hist.split(',').forEach(function(p){
    p = String(p || '').trim();
    if (!p) return;
    var n = p + '_Docs';
    if (names.indexOf(n) === -1) names.push(n);
  });
  return names;
}













function acceptedDocFolderIds_() {
  var props = PropertiesService.getScriptProperties();
  var ids = [];
  acceptedDocFolderNames_().forEach(function (name) {
    var id = String(props.getProperty('FOLDER_' + name.replace(/\W/g, '_')) || '').trim();
    if (id && ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}











function isFileWithinAppFolder_(file) {
  var acceptedNames = acceptedDocFolderNames_();
  var acceptedIds   = acceptedDocFolderIds_();
  var folders = file.getParents();
  var depth = 0;
  while (folders.hasNext() && depth < 8) {
    var folder = folders.next();
    if (acceptedIds.indexOf(folder.getId()) !== -1) return true;
    if (acceptedNames.indexOf(folder.getName()) !== -1) return true;
    folders = folder.getParents();
    depth++;
  }
  return false;
}







function renamedAppFolders_() {
  var props = PropertiesService.getScriptProperties();
  var out = [];
  var expected = [masterFolderName_(), docsFolderName_(), backupFolderName_(), feedbackFolderName_()];
  expected.forEach(function (name, i) {
    var key = (i === 0) ? 'FOLDER_MASTER' : 'FOLDER_' + name.replace(/\W/g, '_');
    var id  = String(props.getProperty(key) || '').trim();
    if (!id) return;                                    
    try {
      var actual = DriveApp.getFolderById(id).getName();
      if (actual !== name) out.push({ expected: name, actual: actual });
    } catch (e) {   }
  });
  return out;
}








function oauthCfg_() {
  var p = PropertiesService.getScriptProperties();
  return { clientId: p.getProperty('OAUTH_CLIENT_ID') || '', clientSecret: p.getProperty('OAUTH_CLIENT_SECRET') || '' };
}











































var GEMINI_MODEL_DEFAULT = 'gemini-3.8-flash';

function geminiModel_() {
  return String(PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || '').trim()
         || GEMINI_MODEL_DEFAULT;
}




function geminiModels_() {
  var out = [geminiModel_()];
  [
    
    'gemini-3.8-flash', 'gemini-flash-latest',
    
    
    
    'gemini-2.5-flash', 'gemini-2.5-flash-lite'
  ].forEach(function (m) {
    if (out.indexOf(m) === -1) out.push(m);
  });
  return out;
}

function geminiUrl_(model, apiKey) {
  return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
}













function geminiErrorText_(code, googleMessage) {
  if (code === 503 || code === 429) {
    return 'The AI reader is busy right now — this is on Google\'s side, not yours, ' +
           'and nothing was lost.\n\n' +
           'It usually clears in a few minutes. Try again shortly, or just type the ' +
           'details in by hand.\n\n' +
           (code === 429
             ? 'If it keeps happening, you are hitting the limits of a free Google AI key. ' +
               'Adding billing to that key in Google AI Studio raises them.'
             : 'Free Google AI keys are served after paying ones, so this happens more ' +
               'often on a free key. Adding billing to it in Google AI Studio makes it rarer.') +
           '\n\n(Google said: ' + googleMessage + ')';
  }
  if (code === 400 || code === 403) {
    return 'Google would not accept the AI key on this system.\n\n' +
           'Usually the key was copied incompletely, or the "Generative Language API" ' +
           'is not switched on for the Google project it belongs to. An admin can ' +
           'replace it in Settings → System → Document reader.\n\n' +
           '(Google said: ' + googleMessage + ')';
  }
  if (code >= 500) {
    return 'Google\'s AI service had a problem. Nothing was lost and nothing is wrong ' +
           'with your data — try again in a few minutes, or enter the details by hand.\n\n' +
           '(Google said: ' + googleMessage + ')';
  }
  return 'The AI reader could not finish (error ' + code + '). You can still enter the ' +
         'details by hand.\n\n(Google said: ' + googleMessage + ')';
}











function getAiStatus(auth) {
  auth = requireAuth_('ADMIN');
  var k = String(PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '').trim();
  return {
    configured: !!k,
    hint: k ? ('…' + k.slice(-4)) : '',
    model: geminiModel_()
  };
}

function setAiKey(data, auth) {
  
  basicNiega_('The AI assistant');
  auth = requireAuth_('ADMIN');
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var key = String((data && data.key) || '').trim();
  var p   = PropertiesService.getScriptProperties();

  if (data && data.remove) {
    p.deleteProperty('GEMINI_API_KEY');
    auditLog_(ss, 'AI_KEY', auth.email, 'GEMINI_API_KEY', 'remove', '');
    return { status: 'success', configured: false };
  }

  if (!key) throw new Error('Paste your key first.');
  
  
  
  if (/\s/.test(key)) throw new Error('That has a space in it — paste just the key, nothing around it.');
  if (key.length < 20) throw new Error('That looks too short to be an API key.');

  
  
  
  
  
  




















  var probe;
  try {
    probe = geminiFetch_({
      contents: [{ parts: [{ text: 'Reply with the single word: ok' }] }],
      generationConfig: { maxOutputTokens: 5 }
    }, key);
  } catch (e) {
    throw new Error('Could not reach Google to check the key: ' + e.message);
  }

  var code = probe.getResponseCode();

  






















  if (code === 429 || code >= 500) {
    p.setProperty('GEMINI_API_KEY', key);
    auditLog_(ss, 'AI_KEY', auth.email, 'GEMINI_API_KEY', 'set', 'saved, not verified (Google busy)');
    return {
      status: 'success', configured: true, hint: '…' + key.slice(-4), verified: false,
      message: 'Key saved — but Google was too busy to check it just now, so we could ' +
               'not confirm it works.\n\nThis is on Google\'s side, not yours. Try the ' +
               'document reader in a few minutes; if it still fails, come back and paste ' +
               'the key again.'
    };
  }

  
  
  if (code !== 200) {
    var errTxt = '';
    try {
      var eo = JSON.parse(probe.getContentText() || '{}');
      errTxt = (eo.error && eo.error.message) ? eo.error.message : '';
    } catch (e2) {}
    throw new Error(geminiErrorText_(code, errTxt || ('HTTP ' + code)));
  }

  p.setProperty('GEMINI_API_KEY', key);
  
  auditLog_(ss, 'AI_KEY', auth.email, 'GEMINI_API_KEY', 'set', 'verified against Google');
  return { status: 'success', configured: true, hint: '…' + key.slice(-4), verified: true };
}












function geminiFetch_(requestBody, apiKey) {
  var models = geminiModels_();
  var last = null;
  for (var i = 0; i < models.length; i++) {
    last = UrlFetchApp.fetch(geminiUrl_(models[i], apiKey), {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    });
    if (last.getResponseCode() === 200) return last;
    
    
    
    if (last.getResponseCode() !== 404) return last;
  }
  return last;
}




function savedWebAppUrl_() {
  return String(PropertiesService.getScriptProperties().getProperty('WEB_APP_URL') || '').trim();
}

function isGmailScanEnabled() {
  return String(PropertiesService.getScriptProperties().getProperty('GMAIL_SCAN_ENABLED') || '')
           .toLowerCase() === 'true';
}


function serverSecret_() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('SESSION_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SESSION_SECRET', s); }
  return s;
}



















function redirectUri_() {
  return PropertiesService.getScriptProperties().getProperty('OAUTH_REDIRECT_URI')
      || savedWebAppUrl_()
      || ScriptApp.getService().getUrl();
}
























function idDeDespliegue_(url) {
  var m = String(url || '').match(/\/s\/([A-Za-z0-9_-]{20,})(?:\/|$)/);
  return m ? m[1] : '';
}


function makeSessionToken_(email) {
  var exp     = Date.now() + 30 * 24 * 60 * 60 * 1000;  
  var payload = Utilities.base64EncodeWebSafe(String(email).toLowerCase().trim() + '|' + exp);
  var sig     = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, serverSecret_()));
  return payload + '.' + sig;
}

function verifySessionToken_(token) {
  if (!token || String(token).indexOf('.') === -1) return '';
  var parts   = String(token).split('.');
  var payload = parts[0], sig = parts[1];
  var expect  = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, serverSecret_()));
  if (sig !== expect) return '';
  var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(payload)).getDataAsString();
  var bits    = decoded.split('|');
  var email   = bits[0], exp = Number(bits[1] || 0);
  if (!email || Date.now() > exp) return '';
  return email;
}



function emailFromIdToken_(idToken) {
  var parts = String(idToken || '').split('.');
  if (parts.length < 2) return '';
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    return payload.email || '';
  } catch (e) { return ''; }
}






function escapeHtmlSrv_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function handleOAuthCallback_(code, state) {
  var ok = false, msg = '';
  try {
    var cfg  = oauthCfg_();
    var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'post', muteHttpExceptions: true,
      payload: {
        code: code, client_id: cfg.clientId, client_secret: cfg.clientSecret,
        redirect_uri: redirectUri_(), grant_type: 'authorization_code'
      }
    });
    var data  = JSON.parse(resp.getContentText());
    var email = data.id_token ? emailFromIdToken_(data.id_token) : '';
    if (email) {
      CacheService.getScriptCache().put('login_' + state, email.toLowerCase().trim(), 300);
      ok = true;
    } else {
      msg = (data.error_description || data.error || 'Could not verify the email address.') + '';
    }
  } catch (err) { msg = 'Error: ' + err.message; }

  var html = ok
    ? '<div style="font-family:system-ui,sans-serif;text-align:center;padding:2.5rem 1rem;color:#15803d">' +
      '<div style="font-size:3rem">✓</div><h2 style="margin:.5rem 0">Signed in</h2>' +
      '<p style="color:#555">You can go back to the app. This window will close itself.</p></div>' +
      '<script>setTimeout(function(){try{window.close();}catch(e){}},800);<\/script>'
    : '<div style="font-family:system-ui,sans-serif;text-align:center;padding:2.5rem 1rem;color:#b91c1c">' +
      '<div style="font-size:3rem">⚠</div><h2 style="margin:.5rem 0">Could not sign in</h2>' +
      




      '<p style="color:#555">' + escapeHtmlSrv_(msg) + '</p><p>Close this window and try again.</p></div>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}















function throttle_(bucket, id, limit, windowSec) {
  var key = 'rl_' + bucket + '_' + Utilities.base64EncodeWebSafe(String(id || 'anon')).substring(0, 40);
  var cache = CacheService.getScriptCache();
  var raw = cache.get(key);
  var n = raw ? (parseInt(raw, 10) || 0) : 0;
  if (n >= limit) return false;
  
  
  
  cache.put(key, String(n + 1), windowSec);
  return true;
}

function requireQuota_(bucket, id, limit, windowSec) {
  if (!throttle_(bucket, id, limit, windowSec)) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }
}



function pollLogin(state) {
  
  
  
  requireQuota_('poll', state, 120, 300);
  var cache = CacheService.getScriptCache();
  var email = cache.get('login_' + state);
  if (!email) return { ready: false };
  cache.remove('login_' + state);
  return { ready: true, sessionToken: makeSessionToken_(email), email: email };
}








































var _verifiedAuth = null;

function setVerifiedAuth_(auth) { _verifiedAuth = auth; return auth; }








var ACCESO_RECHAZOS_AVISO = 10;





























function registrarAccesoDenegado_(auth, motivo) {
  try {
    var quien = (auth && auth.email) ? String(auth.email) : '(no session)';

    



    var cruzoElUmbral = !throttle_('denegadocuenta', quien, ACCESO_RECHAZOS_AVISO, 600);

    
    
    if (throttle_('denegado', quien, 1, 60)) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      try { auditLog_(ss, 'ACCESS_DENIED', quien, motivo, '', ''); } catch (e1) {}
    }

    if (!cruzoElUmbral) return;
    if (!throttle_('denegadocorreo', quien, 1, 3600)) return;    

    var dueno = '';
    try { dueno = Session.getEffectiveUser().getEmail(); } catch (e2) {}
    if (!dueno) return;
    MailApp.sendEmail(dueno,
      '⚠ ' + PRODUCT_NAME + ' — repeated sign-in attempts were refused',
      'Someone has been refused access to your warehouse app ' +
      ACCESO_RECHAZOS_AVISO + ' or more times in the last ten minutes.\n\n' +
      'Account: ' + quien + '\n' +
      'Reason:  ' + motivo + '\n\n' +
      'If that is one of your people, add them in the app: ⚙️ App Settings → ' +
      'Manage Users. If it is not, there is nothing to do — they were refused ' +
      'every time, and this message is only so you know it happened.\n\n' +
      'Every refusal is written down in the AUDIT_LOG tab of your spreadsheet, ' +
      'under ACCESS_DENIED.');
  } catch (e) {   }
}





























var ROLES = ['ADMIN', 'WAREHOUSE', 'VIEWER'];





var ROLES_QUE_ESCRIBEN = ['ADMIN', 'WAREHOUSE'];

function requireAuth_(minRole) {
  var a = _verifiedAuth;

  




























  var sinSesion = !a || a.role === 'NO_SESSION' ||
                  (!a.email && !basicApagado_());
  if (sinSesion) {
    registrarAccesoDenegado_(a, 'No signed-in session');
    throw new Error('Not authenticated. Please sign in and use the app from its own page.');
  }
  if (a.role === 'DENIED') {
    registrarAccesoDenegado_(a, 'Not registered in this installation');
    throw new Error('Access denied. Your account (' + a.email + ') is not registered in this system.');
  }
  if (minRole === 'ADMIN' && a.role !== 'ADMIN') throw new Error('Admin only.');
  if (minRole === 'WRITE' && ROLES_QUE_ESCRIBEN.indexOf(a.role) === -1) {
    throw new Error('Read-only access — you can view data but cannot record movements.');
  }
  return a;
}

























var DEFAULT_ROLE_PERMS = {
  canSeeCosts:      false,
  canEditMovements: false,
  canManageCatalog: false,
  canExportData:    true
};
















function canSeeCosts_(auth) {
  if (!auth || !auth.role) return false;
  if (auth.role === 'ADMIN') return true;
  if (auth.role === 'WAREHOUSE') return rolePerms_().canSeeCosts === true;
  return false;
}

function rolePerms_() {
  var raw = PropertiesService.getScriptProperties().getProperty('ROLE_PERMS_WAREHOUSE');
  var stored = {};
  try { stored = JSON.parse(raw || '{}') || {}; } catch (e) { stored = {}; }
  var out = {};
  Object.keys(DEFAULT_ROLE_PERMS).forEach(function (k) {
    out[k] = (stored[k] === true || stored[k] === false) ? stored[k] : DEFAULT_ROLE_PERMS[k];
  });
  return out;
}

function setRolePerms(data, auth) {
  
  basicNiega_('Users and roles');
  auth = requireAuth_('ADMIN');    
  var next = {};
  Object.keys(DEFAULT_ROLE_PERMS).forEach(function (k) { next[k] = !!(data && data[k]); });
  PropertiesService.getScriptProperties().setProperty('ROLE_PERMS_WAREHOUSE', JSON.stringify(next));
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'UPDATE_ROLE_PERMS', auth.email,
    'Permissions changed for the WAREHOUSE role', '', JSON.stringify(next));
  return { status: 'success', perms: next };
}





function warehouseRoleLabel_() {
  var v = String(PropertiesService.getScriptProperties().getProperty('WAREHOUSE_ROLE_LABEL') || '').trim();
  return v || 'Warehouse';
}

function setWarehouseRoleLabel(data, auth) {
  auth = requireAuth_('ADMIN');    
  var label = String((data && data.label) || '').trim().slice(0, 30);
  var p = PropertiesService.getScriptProperties();
  if (label) p.setProperty('WAREHOUSE_ROLE_LABEL', label);
  else p.deleteProperty('WAREHOUSE_ROLE_LABEL');
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'UPDATE_ROLE_LABEL', auth.email,
    'Display name for the WAREHOUSE role changed', '', label || '(default) Warehouse');
  return { status: 'success', label: warehouseRoleLabel_() };
}



















var PERM_LABELS = {
  canEditMovements: 'edit or delete a movement someone already saved',
  canManageCatalog: 'change the catalog',
  canExportData:    'export data',
  canSeeCosts:      'see costs'
};

function requirePerm_(auth, permKey) {
  if (auth.role === 'ADMIN') return auth;
  if (auth.role === 'WAREHOUSE' && rolePerms_()[permKey] === true) return auth;

  var what  = PERM_LABELS[permKey] || 'do that';
  var quien = '';
  try { quien = adminNotifyEmail_(); } catch (e) {}

  throw new Error(
    "You don't have permission to " + what + '. ' +
    (quien ? 'Ask ' + quien + ' to turn it on' : 'Ask an administrator to turn it on') +
    ' in Settings → Permissions.');
}








function requireOwnerContext_() {
  










  if (basicApagado_()) return 'basic';
  var eff = '', act = '';
  try { eff = Session.getEffectiveUser().getEmail(); } catch (e) {}
  try { act = Session.getActiveUser().getEmail();    } catch (e) {}
  if (!eff || eff !== act) {
    throw new Error('This function can only be run by the project owner (scheduled trigger or Apps Script editor).');
  }
  return eff;
}

function getUserRole(sessionToken) {
  














  if (basicApagado_()) {
    var yo = basicIdentidad_();
    return { role: 'ADMIN', email: yo.email, name: yo.name };
  }
  var email = '';
  
  
  
  
  try { email = Session.getActiveUser().getEmail(); } catch(e) { email = ''; }
  
  
  if (!email && sessionToken) email = verifySessionToken_(sessionToken);
  if (!email) return { role: 'NO_SESSION', email: '' };

  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var userEmail = email.toLowerCase().trim();

  

















  var usersSheet = ss.getSheetByName('USERS_V3');
  if (usersSheet && usersSheet.getLastRow() > 1) {
    var uRows = usersSheet.getDataRange().getValues();
    for (var u = 1; u < uRows.length; u++) {
      var uEmail  = String(uRows[u][1] || '').toLowerCase().trim();  
      var uActive = uRows[u][6];                                     
      var isActive = (uActive === true || String(uActive).toUpperCase() === 'TRUE' || uActive === '');
      if (uEmail && uEmail === userEmail) {
        if (isActive) {
          return {
            role:     String(uRows[u][3] || 'WAREHOUSE').toUpperCase().trim(),  
            email:    email,
            name:     String(uRows[u][2] || '').trim()                          
          };
        }
        
        return { role: 'DENIED', email: email };
      }
    }
  }

  









































  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (cfg) {
    var cRows = cfg.getDataRange().getValues();
    for (var c = 1; c < cRows.length; c++) {
      var cEmail = String(cRows[c][5] || '').toLowerCase().trim();
      if (cEmail && cEmail === userEmail) {
        var rolViejo = String(cRows[c][6] || 'WAREHOUSE').toUpperCase().trim();
        try { adoptarUsuarioDeConfig_(ss, email, rolViejo); } catch (eMig) {
          Logger.log('adoptarUsuarioDeConfig_: ' + eMig.message);
        }
        return { role: rolViejo, email: email, name: '' };
      }
    }
  }

  return { role: 'DENIED', email: email };
}





















function revisarUsuarios_(ss, migrar) {
  var out = { migrados: [], rolesDistintos: [], corruptas: [], soloEnConfig: [] };
  var sheet = ensureUsersSheet_(ss);

  var enUsers = {};
  if (sheet.getLastRow() > 1) {
    var uRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
    for (var i = 0; i < uRows.length; i++) {
      var val = String(uRows[i][1] || '').trim();
      if (!val) continue;
      if (val.indexOf('@') === -1) {
        out.corruptas.push({ fila: i + 2, valor: val.substring(0, 40) });
        continue;
      }
      enUsers[val.toLowerCase()] = String(uRows[i][3] || '').toUpperCase().trim();
    }
  }

  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) return out;
  var cRows = cfg.getDataRange().getValues();
  for (var c = 1; c < cRows.length; c++) {
    var correo = String(cRows[c][5] || '').trim();
    if (!correo || correo.indexOf('@') === -1) continue;
    var rol = String(cRows[c][6] || 'WAREHOUSE').toUpperCase().trim();
    var clave = correo.toLowerCase();
    if (enUsers[clave] === undefined) {
      out.soloEnConfig.push(correo);
      if (migrar && adoptarUsuarioDeConfig_(ss, correo, rol)) {
        out.migrados.push(correo);
        enUsers[clave] = rol;             
      }
    } else if (enUsers[clave] !== rol) {
      out.rolesDistintos.push({ email: correo, users: enUsers[clave], config: rol });
    }
  }
  return out;
}





function adoptarUsuarioDeConfig_(ss, email, rol) {
  var sheet = ensureUsersSheet_(ss);
  var buscado = String(email || '').toLowerCase().trim();
  if (!buscado) return false;
  if (sheet.getLastRow() > 1) {
    var filas = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < filas.length; i++) {
      if (String(filas[i][0] || '').toLowerCase().trim() === buscado) return false;
    }
  }
  sheet.appendRow([
    'USR-' + Date.now(), email, '', rol || 'WAREHOUSE',
    'migrated from CONFIG', new Date(), true
  ]);
  try {
    auditLog_(ss, 'USER_MIGRATED', 'system',
      email + ' was signing in through the old CONFIG list and is now a real ' +
      'user row — switch them off in Manage Users if they should not have access',
      rol || 'WAREHOUSE', '');
  } catch (e) {}
  return true;
}


function loadConfig() {
  
  
  
  
  requireAuth_();
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) return {};
  var data = cfg.getDataRange().getValues();
  var c = { projects: [], categories: [], suppliers: [], locations: [], users: [], trucks: [], minStock: {}, avgCost: {} };

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
    if (row[13] && i === 1) c.archiveCutoffMonths = Number(row[13]) || 12;
    
    
    
    
    if (row[14] && row[15] && row[16] !== '' && row[16] !== null) {
      var costCat = String(row[14]).trim(), costName = String(row[15]).trim();
      c.avgCost[getMaterialId(costCat, costName)] = { category: costCat, name: costName, avg: Number(row[16]) || 0 };
    }
  }
  
  if (!c.archiveCutoffMonths) c.archiveCutoffMonths = 12;

  





















  return c;
}


































var CONFIG_SOLO_FILA_2 = [
  { idx: 7,  col: 'H', nombre: 'Admin Email',
    para: 'the address the app treats as the owner' },
  { idx: 13, col: 'N', nombre: 'Archive Cutoff Months',
    para: 'how old a movement must be before it moves to the archive' }
];

function revisarConfigFila2_(ss) {
  var fuera = [];
  var cfg = ss && ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg || cfg.getLastRow() < 3) return fuera;    
  var data = cfg.getDataRange().getValues();

  CONFIG_SOLO_FILA_2.forEach(function (c) {
    var filas = [];
    
    for (var i = 2; i < data.length; i++) {
      var v = data[i][c.idx];
      if (v !== '' && v !== null && v !== undefined) filas.push(i + 1);
    }
    if (filas.length) {
      fuera.push({
        col: c.col, nombre: c.nombre, para: c.para,
        filas: filas,
        enUso: (function () {
          var v2 = data[1] ? data[1][c.idx] : '';
          return (v2 === '' || v2 === null || v2 === undefined) ? '' : String(v2).trim();
        })()
      });
    }
  });
  return fuera;
}

function normalizeString(str) {
  return String(str || '')
    .toUpperCase()
    .trim()
    
    .replace(/\s+/g, ' ')
    
    
    .replace(/[,.'`]/g, '')
    
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    
    .replace(/[\/\\?%*:|"<>]/g, '_');
}






function cleanDisplay_(str) {
  return String(str || '').toUpperCase().trim().replace(/\s+/g, ' ');
}
























































function textCell_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') return v;           
  return v === '' ? '' : "'" + v;
}











function textSafeRow_(row) {
  return (row || []).map(textCell_);
}




function safeStr_(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) return '';   
  return String(val).trim();
}





function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function getMaterialId(cat, name) {
  return normalizeString(cat) + '|||' + normalizeString(name);
}

function getLegacyMaterialId(cat, name, proj) {
  return normalizeString(cat) + '|||' + normalizeString(name) + '|||' + normalizeString(proj);
}


function getInitialData(sessionToken) {
  try {
    var auth = setVerifiedAuth_(getUserRole(sessionToken));

    
    
    
    if (auth.email) requireQuota_('init', auth.email, 180, 300);

    
    if (auth.role === 'NO_SESSION') {
      var oc = oauthCfg_();
      return { accessStatus: 'NO_SESSION', userEmail: '', userRole: 'NO_SESSION',
               serverVersion: APP_VERSION, basic: ACOPIO_BASIC,
               company: publicCompany_(),
               oauthClientId: oc.clientId, oauthRedirectUri: redirectUri_() };
    }
    
    if (auth.role === 'DENIED') {
      return { accessStatus: 'DENIED', userEmail: auth.email, userRole: 'DENIED',
               serverVersion: APP_VERSION, basic: ACOPIO_BASIC,
               company: publicCompany_() };
    }

    































    var selloAlEmpezar = dataStamp_();

    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var archive  = ss.getSheetByName(SHEETS.ARCHIVE);
    var config   = loadConfig();
    
    
    
    
    delete config.users;
    delete config.adminEmail;

    var movements = [];
    if (archive) {
      var data = archive.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        var row = data[j];
        if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
        movements.push(parseArchiveRow(row, j + 1));
      }
    }

    
    
    
    
    
    
    var locksMap = getActiveLocksMap_(ss);

    
    
    
    
    
    
    
    
    
    
    
    var derivadasAlDia = true;
    if (refreshPending_()) derivadasAlDia = refreshDerivedSheetsSafely_(ss);

    var stock = derivadasAlDia ? buildStockFromDerivedSheets_(ss) : null;
    if (stock) {
      applyReservationsAndFinalize_(stock, locksMap);
    } else {
      stock = calculateStock(movements, locksMap);
    }

    
    var activeUsers = [];
    try { activeUsers = heartbeat(sessionToken); } catch(e) {}

    
    var incoming = [];
    

    try { incoming = getIncoming(sessionToken, true); } catch(e) { Logger.log('getIncoming: ' + e.message); }
    var monitoredMaterials = null;
    try { monitoredMaterials = getMonitoredMaterials(sessionToken, true); } catch(e) {}

    
    var users = [];
    if (auth.role === 'ADMIN') {
      try { users = getUsers(auth); } catch(e) {}
    }
    
    var userNames = userDirectory_(ss);

    var rackPhotos = {};
    try { rackPhotos = getRackPhotos(); } catch(e) { Logger.log('getRackPhotos: ' + e.message); }

    var materialLocks = [];
    try { materialLocks = getMaterialLocks(); } catch(e) { Logger.log('getMaterialLocks: ' + e.message); }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (!canSeeCosts_(auth)) {
      for (var ci = 0; ci < movements.length; ci++) {
        movements[ci].unitCost  = null;
        movements[ci].totalCost = null;
      }
      if (config) config.avgCost = {};
    }

    
    
    
    
    
    
    
    
    
    
    
    
    if (config && auth.role !== 'ADMIN') {
      config.users = [];
      delete config.adminEmail;
    }

    return {
      serverVersion:      APP_VERSION,
      serverBuild:        APP_BUILD,
      
      
      
      
      
      
      
      
      basic:              ACOPIO_BASIC,
      

      basicPreguntarQuien: ACOPIO_BASIC && !basicIdentidad_().email,
      
      
      materialPacks:      (function(){ try { return readPacks_(ss); } catch (e) { return {}; } })(),
      company:            publicCompany_(),
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      systemActivity:     (function(){
        try { return getSystemActivity_(30, auth.email); }
        catch (e) {
          
          
          
          
          Logger.log('getInitialData: systemActivity failed — ' + e.message);
          return [];
        }
      })(),
      columnPrefs:        columnPrefs_(),
      movements:          movements,
      













      


























      archiveVacioConStock: (movements.length === 0 && (function(){
        for (var av in stock) {
          if (!stock.hasOwnProperty(av)) continue;
          var s = stock[av];
          if ((s.warehouseQty || 0) > 0 || (s.siteQty || 0) > 0) return true;
        }
        return false;
      })()),
      


      historicoFilas: (function(){
        try {
          var h = ss.getSheetByName(SHEETS.ARCHIVE_HISTORY);
          return h ? Math.max(0, h.getLastRow() - 1) : 0;
        } catch (e) {
          





          Logger.log('historicoFilas: ' + e.message);
          return 0;
        }
      })(),
      stock:              stock,
      config:             config,
      userRole:           auth.role,
      
      
      
      
      
      
      
      dataStamp:          selloAlEmpezar,
      rolePerms:          rolePerms_(),
      warehouseRoleLabel: warehouseRoleLabel_(),
      userName:           auth.name || '',
      userEmail:          auth.email,
      userNames:          userNames,
      activeUsers:        activeUsers,
      incoming:           incoming,
      monitoredMaterials: monitoredMaterials,
      users:              users,
      rackPhotos:         rackPhotos,
      materialLocks:      materialLocks,
      gmailScanEnabled:   false    
    };
  } catch (err) {
    try {
      var _ss = SpreadsheetApp.getActiveSpreadsheet();
      var _auth = getUserRole(sessionToken);
      logError_(_ss, 'ERROR', 'backend', 'getInitialData', _auth.email, err.message, null, newRequestId_());
    } catch (e2) {}
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
  
  var rawMT     = String(row[AC.MOVETYPE] || '').toUpperCase().trim();
  var rawQty    = Number(row[AC.QTY] || 0);
  var rawStatus = String(row[AC.STATUS]   || '').toUpperCase().trim();
  var mt = tipoDeMovimiento_(rawMT, rawQty, rawStatus);

  return {
    rowIdx:      rowIdx,
    
    
    
    movId:       String(row[AC.MOV_ID] || '').trim(),
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
    userEmail:   String(row[AC.USER_EMAIL] || ''),
    pm:          String(row[AC.PM]         || ''),
    unitCost:    (row[AC.UNIT_COST]  === '' || row[AC.UNIT_COST]  === null || row[AC.UNIT_COST]  === undefined) ? null : Number(row[AC.UNIT_COST]),
    totalCost:   (row[AC.TOTAL_COST] === '' || row[AC.TOTAL_COST] === null || row[AC.TOTAL_COST] === undefined) ? null : Number(row[AC.TOTAL_COST]),
    

    originProject: String(row[AC.ORIGIN_PROJECT] || '').trim(),
    fromMov:       String(row[AC.FROM_MOV]       || '').trim()
  };
}











function calculateStock(movements, locksMap) {
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
        













        boneyard:     {},
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
      
      
      var rack = m.destLoc || m.sourceLoc || 'UNASSIGNED';
      s.warehouseLocs[rack] = (s.warehouseLocs[rack] || 0) + qty;
      s.warehouseQty += qty;

    } else if (mt === 'EXIT' || mt === 'DISPATCH') {
      
      
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
      s.siteQty     += qty;    
      










      if (m.originProject && s.boneyard[m.originProject]) {
        s.boneyard[m.originProject] = Math.max(0, s.boneyard[m.originProject] - qty);
        if (!s.boneyard[m.originProject]) delete s.boneyard[m.originProject];
      }

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
      
      s.siteQty = Math.max(0, s.siteQty - qty);
      var retRack = m.destLoc || 'UNASSIGNED';
      s.warehouseLocs[retRack] = (s.warehouseLocs[retRack] || 0) + qty;
      s.warehouseQty += qty;
      




      if (m.originProject) {
        s.boneyard[m.originProject] = (s.boneyard[m.originProject] || 0) + qty;
      }

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

    } else if (mt === 'ADJUST') {
      
      
      
      
      
      
      if (m.sourceLoc && !m.destLoc) {
        s.warehouseLocs[m.sourceLoc] = (s.warehouseLocs[m.sourceLoc] || 0) - qty;
        if (s.warehouseLocs[m.sourceLoc] < 0) {
          s._errors.push('ADJUST NEG@' + m.sourceLoc);
          s.warehouseLocs[m.sourceLoc] = 0;
        }
        s.warehouseQty = Math.max(0, s.warehouseQty - qty);
      } else if (m.destLoc && !m.sourceLoc) {
        s.warehouseLocs[m.destLoc] = (s.warehouseLocs[m.destLoc] || 0) + qty;
        s.warehouseQty += qty;
      }
    }
  }

  applyReservationsAndFinalize_(stock, locksMap);
  return stock;
}









































function reservedQtyFromRacks_(locksMap, matId, locs) {
  if (!locksMap || !locs) return 0;
  var total = 0;
  for (var rack in locs) {
    if (!locs.hasOwnProperty(rack)) continue;
    if (locksMap[matId + '|||' + normalizeString(rack)]) {
      total += Math.max(0, Number(locs[rack]) || 0);
    }
  }
  return total;
}







function applyReservationsAndFinalize_(stock, locksMap) {

  
  for (var k in stock) {
    if (!stock.hasOwnProperty(k)) continue;
    var item = stock[k];

    
    for (var loc in item.warehouseLocs) {
      if (item.warehouseLocs.hasOwnProperty(loc) && item.warehouseLocs[loc] <= 0) {
        delete item.warehouseLocs[loc];
      }
    }
    item.warehouseQty = Math.max(0, item.warehouseQty);
    item.siteQty      = Math.max(0, item.siteQty);
    item.wastedQty     = Math.max(0, item.wastedQty || 0);
    
    
    
    
    item.reservedQty  = reservedQtyFromRacks_(locksMap, k, item.warehouseLocs);
    item.availableQty = Math.max(0, item.warehouseQty - item.reservedQty);
    item.totalQty      = item.warehouseQty + item.siteQty;

    if (item._errors && item._errors.length) {
      Logger.log('STOCK_ERR [' + k + ']: ' + item._errors.join(' | '));
    }
  }
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








function buildStockFromDerivedSheets_(ss) {
  var live  = ss.getSheetByName(SHEETS.LIVE);
  var site  = ss.getSheetByName(SHEETS.SITE);
  var waste = ss.getSheetByName(SHEETS.WASTE);
  if (!live || live.getLastRow() < 2) return null;  

  var stock = {};
  function ensure(cat, name, unit) {
    var matId = getMaterialId(cat, name);
    if (!stock[matId]) {
      stock[matId] = {
        matId: matId, category: cat, name: name, project: '',
        warehouseLocs: {}, warehouseQty: 0, siteQty: 0, wastedQty: 0,
        totalQty: 0, reservedQty: 0, availableQty: 0, unit: unit || 'UNIT', _errors: []
      };
    }
    return stock[matId];
  }

  var liveRows = live.getDataRange().getValues();
  for (var i = 1; i < liveRows.length; i++) {
    var r = liveRows[i];
    var cat = String(r[0] || ''), name = String(r[1] || '');
    if (!cat && !name) continue;
    var proj = String(r[2] || ''), loc = String(r[3] || ''), qty = Number(r[4] || 0), unit = String(r[5] || 'UNIT');
    var s = ensure(cat, name, unit);
    if (proj && proj !== 'GENERIC') s.project = proj;  
    if (qty > 0) { s.warehouseLocs[loc] = (s.warehouseLocs[loc] || 0) + qty; s.warehouseQty += qty; }
  }

  if (site) {
    var siteRows = site.getDataRange().getValues();
    for (var j = 1; j < siteRows.length; j++) {
      var r2 = siteRows[j];
      var cat2 = String(r2[0] || ''), name2 = String(r2[1] || '');
      if (!cat2 && !name2) continue;
      var s2 = ensure(cat2, name2, String(r2[4] || 'UNIT'));
      s2.siteQty += Number(r2[3] || 0);
    }
  }

  if (waste) {
    var wasteRows = waste.getDataRange().getValues();
    for (var k = 1; k < wasteRows.length; k++) {
      var r3 = wasteRows[k];
      var cat3 = String(r3[0] || ''), name3 = String(r3[1] || '');
      if (!cat3 && !name3) continue;
      var s3 = ensure(cat3, name3, String(r3[3] || 'UNIT'));
      s3.wastedQty += Number(r3[2] || 0);
    }
  }

  return stock;
}


function processMovement(action, data) {
  
  
  
  var auth = setVerifiedAuth_(getUserRole(data && data._sessionToken));
  if (auth.role === 'NO_SESSION') throw new Error('Not authenticated. Please sign in with your Google account.');
  if (auth.role === 'DENIED')     throw new Error('Access denied. Your account (' + auth.email + ') is not registered in this system. Contact your administrator to request access.');
  if (auth.role === 'VIEWER')     throw new Error('Read-only access — you can view data but cannot record movements. Contact an admin.');

  
  
  requireQuota_('pm', auth.email, 240, 60);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var out = processMovementInner_(ss, action, data, auth);
    
    
    
    
    
    
    
    
    if (DATA_STAMP_ACTIONS[action]) bumpDataStamp_();
    return out;
  } catch (err) {
    var reqId = newRequestId_();
    var severity = classifyErrorSeverity_(err.message);
    logError_(ss, severity, 'backend', action, auth.email, err.message, data, reqId);
    if (severity === 'ERROR') throw new Error(err.message + ' [ID: ' + reqId + ']');
    throw err;
  }
}

function processMovementInner_(ss, action, data, auth) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) throw new Error('Archive sheet not found.');

  if (action === 'addMovement') {
    
    
    if (data.moveType === 'ENTRY' && Array.isArray(data.locations) && data.locations.length > 0) {
      var entryRows = [];
      for (var li = 0; li < data.locations.length; li++) {
        var locEntry = data.locations[li];
        if (!locEntry.qty || locEntry.qty <= 0) continue;
        entryRows.push({
          moveType:         'ENTRY',
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
          pm:               data.pm,
          unitCost:         data.unitCost,
          
          files:            entryRows.length === 0 ? (data.files     || []) : [],
          docGroups:        entryRows.length === 0 ? (data.docGroups || []) : [],
          notifyRecipients: entryRows.length === 0 ? data.notifyRecipients : null,
          
          forceSubmit:      entryRows.length === 0 ? !!data.forceSubmit : true
        });
      }
      var entryRes = addMovementsBatch_(ss, archive, entryRows, auth);
      return {
        status:     'success',
        rowIdx:     entryRes.firstRowIdx,
        rowCount:   entryRes.rowCount,
        fileError:  entryRes.fileError,
        emailError: entryRes.emailError,
        refreshError: entryRes.refreshError,
        stockAfter:     entryRes.stockAfter     || null,
        availableByMat: entryRes.availableByMat || null,
        movimientos:    entryRes.movimientos    || [],
        message:    'ENTRY recorded' + (entryRes.rowCount > 1 ? ' (' + entryRes.rowCount + ' locations).' : '.')
      };
    }

    
    if (data.moveType === 'EXIT' && Array.isArray(data.exitLocations) && data.exitLocations.length > 0) {
      var exitRows = [];
      for (var xi = 0; xi < data.exitLocations.length; xi++) {
        var exitEntry = data.exitLocations[xi];
        if (!exitEntry.qty || exitEntry.qty <= 0) continue;
        exitRows.push({
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
          destLoc:          data.destLoc  || '',    
          supplier:         data.supplier,
          comments:         data.comments,
          responsible:      data.responsible,
          files:            exitRows.length === 0 ? (data.files || []) : [],
          notifyRecipients: null,                   
          forceSubmit:      exitRows.length === 0 ? !!data.forceSubmit : true
        });
      }
      var exitRes = addMovementsBatch_(ss, archive, exitRows, auth);
      return {
        status:     'success',
        rowIdx:     exitRes.firstRowIdx,
        rowCount:   exitRes.rowCount,
        fileError:  exitRes.fileError,
        emailError: exitRes.emailError,
        refreshError: exitRes.refreshError,
        stockAfter:     exitRes.stockAfter     || null,
        availableByMat: exitRes.availableByMat || null,
        movimientos:    exitRes.movimientos    || [],
        message:    'EXIT recorded' + (exitRes.rowCount > 1 ? ' (' + exitRes.rowCount + ' locations).' : '.')
      };
    }

    
    
    if (data.moveType === 'TRANSFER' && Array.isArray(data.transferLocations) && data.transferLocations.length > 0) {
      var transferRows = [];
      for (var ti = 0; ti < data.transferLocations.length; ti++) {
        var pair = data.transferLocations[ti];
        if (!pair.qty || pair.qty <= 0) continue;
        transferRows.push({
          moveType:    'TRANSFER',
          category:    data.category,
          name:        data.name,
          project:     data.project,
          isGeneric:   data.isGeneric,
          qty:         pair.qty,
          unit:        data.unit,
          dateRec:     data.dateRec,
          sourceLoc:   pair.sourceLoc || '',
          destLoc:     pair.destLoc   || '',
          comments:    data.comments,
          responsible: data.responsible,
          forceSubmit: ti === 0 ? !!data.forceSubmit : true
        });
      }
      var transferRes = addMovementsBatch_(ss, archive, transferRows, auth);
      return {
        status:     'success',
        rowIdx:     transferRes.firstRowIdx,
        rowCount:   transferRes.rowCount,
        fileError:  transferRes.fileError,
        emailError: transferRes.emailError,
        refreshError: transferRes.refreshError,
        stockAfter:     transferRes.stockAfter     || null,
        availableByMat: transferRes.availableByMat || null,
        movimientos:    transferRes.movimientos    || [],
        message:    'TRANSFER recorded' + (transferRes.rowCount > 1 ? ' (' + transferRes.rowCount + ' pairs).' : '.')
      };
    }

    
    
    
    
    
    
    var singleRes = addMovementsBatch_(ss, archive, [{
      moveType:         data.moveType,
      category:         data.category,
      name:             data.name,
      project:          data.project,
      isGeneric:        data.isGeneric,
      gc:               data.gc,
      po:               data.po,
      qty:              data.qty,
      unit:             data.unit,
      dateRec:          data.dateRec,
      sourceLoc:        data.sourceLoc,
      destLoc:          data.destLoc,
      supplier:         data.supplier,
      comments:         data.comments,
      responsible:      data.responsible,
      pm:               data.pm,
      files:            data.files     || [],
      docGroups:        data.docGroups || [],
      notifyRecipients: data.notifyRecipients || null,
      forceSubmit:      !!data.forceSubmit
    }], auth);

    var singleMatId = getMaterialId(normalizeString(data.category), normalizeString(data.name));
    var availAfter  = singleRes.availableByMat && singleRes.availableByMat[singleMatId];
    return {
      status:         'success',
      rowIdx:         singleRes.firstRowIdx,
      message:        String(data.moveType || '').toUpperCase() + ' recorded successfully.',
      availableAfter: availAfter != null ? availAfter : null,
      fileError:      singleRes.fileError,
      emailError:     singleRes.emailError,
      refreshError:   singleRes.refreshError,
      stockAfter:     singleRes.stockAfter     || null,
      availableByMat: singleRes.availableByMat || null,
      movimientos:    singleRes.movimientos    || []
    };
  }
  if (action === 'addMultiEntry')         return addMultiEntry(ss, archive, data, auth);
  if (action === 'addMultiExit')          return addMultiExit(ss, archive, data, auth);
  if (action === 'updateDocument')        return updateDocument_(ss, archive, data, auth);
  
  
  
  
  if (action === 'refreshNow') {
    
    
    
    return { status: 'success', refreshed: refreshDerivedSheetsSafely_(ss) };
  }
  if (action === 'addIncoming')           return addIncoming(data);
  if (action === 'updateIncoming')        return updateIncoming(data);
  if (action === 'deleteIncoming')        return deleteIncoming(data.id, data._sessionToken);
  
  
  
  
  if (action === 'modifyMovement')        return modifyMovement(data, auth);
  if (action === 'setMonitoredMaterials') return setMonitoredMaterials(data.names, auth);
  if (action === 'getPmDirectory')        return getPmDirectory();
  if (action === 'managePmDirectory')     return managePmDirectory(data, auth);
  if (action === 'uploadRackPhoto')       return uploadRackPhoto(data, auth);
  if (action === 'lockMaterial')          return lockMaterial(data, auth);
  if (action === 'unlockMaterial')        return unlockMaterial(data, auth);
  if (action === 'unlockMaterials')       return unlockMaterials(data, auth);
  if (action === 'updateMinStockBulk')    return updateMinStockBulk(data, auth);
  if (action === 'parseImportFile')       return parseImportFile(data);
  if (action === 'commitImport')          return commitImport(data, auth);
  if (action === 'listImports')           return listImports(auth);
  if (action === 'undoImport')            return undoImport(data, auth);
  if (action === 'deleteMovements')       return deleteMovements(data, auth);
  
  if (action === 'getUsers')       return getUsers(auth);
  if (action === 'addUser')        return addUser(data, auth);
  if (action === 'updateUser')     return updateUser(data, auth);
  if (action === 'removeUser')     return removeUser(data.email, auth);
  if (action === 'deleteUserRow')  return deleteUserRow(data, auth);
  
  if (action === 'getSettings')    return getSettings(auth);
  if (action === 'updateConfig')   return updateConfig(data, auth);
  if (action === 'mergeConfigValues') return mergeConfigValues(data, auth);
  if (action === 'saveLocationLayout') return saveLocationLayout(data, auth);
  if (action === 'mergeLocations')     return mergeLocations(data, auth);
  if (action === 'saveColumnPrefs')    return saveColumnPrefs(data, auth);
  if (action === 'saveCompanyProfile') return saveCompanyProfile(data, auth);
  if (action === 'parseIncomingEmail') return parseIncomingEmail(data, auth);
  
  if (action === 'listMaterials')  return listMaterials(auth);
  if (action === 'manageMaterial') return manageMaterial(data, auth);
  
  if (action === 'runDataQualityScan')  return runDataQualityScan(data);
  if (action === 'applyDataQualityFix') return applyDataQualityFix(data);
  if (action === 'adminAction') {
    return adminAction_(ss, data, requireAuth_('ADMIN'));
  }
  if (action === 'getErrorLog')     return getErrorLog(auth);
  if (action === 'clearErrorLog')   return clearErrorLog(data, auth);
  if (action === 'dismissSystemCard') return dismissSystemCard(data, auth);
  if (action === 'setRolePerms')     return setRolePerms(data, auth);
  if (action === 'setWarehouseRoleLabel') return setWarehouseRoleLabel(data, auth);
  if (action === 'getBackupStatus')  return getBackupStatus(auth);
  if (action === 'setBackupEnabled') return setBackupEnabled(data, auth);
  if (action === 'runBackupOnDemand') return runBackupOnDemand(data, auth);
  if (action === 'logClientError')  return logClientError(data, auth);
  if (action === 'loadOlderHistory') return loadOlderHistory(auth, data);
  if (action === 'getSpaceUsage')   return getSpaceUsage(auth);
  if (action === 'getAiStatus')     return getAiStatus(auth);
  if (action === 'setAiKey')        return setAiKey(data, auth);
  
  
  
  
  
  if (action === 'getDailyReportSettings')  return getDailyReportSettings(auth);
  if (action === 'saveDailyReportSettings') return saveDailyReportSettings(data, auth);
  if (action === 'sendDailyReportNow')      return sendDailyReportNow(auth);
  if (action === 'getMaterialPacks')   return getMaterialPacks(auth);
  if (action === 'saveMaterialPack')   return saveMaterialPack(data, auth);
  if (action === 'deleteMaterialPack') return deleteMaterialPack(data, auth);
  throw new Error('Unknown action: ' + action);
}



























































var BUSY_PREFIX = 'SYSTEM_BUSY|';


















var GONE_PREFIX = 'GONE|';

function withStockLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    throw new Error(BUSY_PREFIX + 'System busy — someone else is saving right now. Please try again in a moment.');
  }
  try { return fn(); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}
























































var SHORT_PREFIX = 'SHORT_STOCK|';

function shortStockTag_(cat, name, rack, there, total, asked) {
  try {
    return ' ' + SHORT_PREFIX + JSON.stringify({
      cat: cat, name: name, rack: rack || '',
      there: there, total: total, asked: asked
    });
  } catch (e) { return ''; }    
}

var DATA_STAMP_KEY = 'WMS_DATA_STAMP';
























var REFRESH_PENDING_KEY = 'WMS_REFRESH_PENDING';








function refreshOrDefer_(ss, data) {
  if (data && data._skipRefresh) {
    try {
      PropertiesService.getScriptProperties().setProperty(REFRESH_PENDING_KEY, '1');
      return false;
    } catch (e) {
      
      
      Logger.log('refreshOrDefer_: no se pudo marcar, refrescando ahora: ' + e.message);
      refreshDerivedSheets_(ss);
      return true;
    }
  }
  refreshDerivedSheets_(ss);
  _clearRefreshPending_();
  return true;
}























function stockAfterParaIds_(ss, ids) {
  var out = {};
  try {
    var quiero = {};
    (ids || []).forEach(function (id) { if (id) quiero[id] = true; });
    if (!Object.keys(quiero).length) return out;

    var stock = buildStockFromDerivedSheets_(ss);
    if (!stock) return out;                        
    applyReservationsAndFinalize_(stock, getActiveLocksMap_(ss));

    for (var k in quiero) {
      if (!quiero.hasOwnProperty(k)) continue;
      var s = stock[k];
      



      out[k] = s ? {
        warehouseQty:  s.warehouseQty,
        siteQty:       s.siteQty,
        reservedQty:   s.reservedQty,
        availableQty:  s.availableQty,
        totalQty:      s.totalQty,
        warehouseLocs: s.warehouseLocs
      } : {
        warehouseQty: 0, siteQty: 0, reservedQty: 0,
        availableQty: 0, totalQty: 0, warehouseLocs: {}
      };
    }
  } catch (e) {
    
    
    Logger.log('stockAfterParaIds_: ' + e.message);
    return {};
  }
  return out;
}

function _clearRefreshPending_() {
  try { PropertiesService.getScriptProperties().deleteProperty(REFRESH_PENDING_KEY); }
  catch (e) {}
}


















function refreshDerivedSheetsSafely_(ss) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return false;
  try {
    refreshDerivedSheets_(ss);
    _clearRefreshPending_();
    return true;
  } catch (e) {
    Logger.log('refreshDerivedSheetsSafely_: ' + e.message);
    return false;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}


function refreshPending_() {
  try {
    return PropertiesService.getScriptProperties().getProperty(REFRESH_PENDING_KEY) === '1';
  } catch (e) { return false; }
}











































var DATA_STAMP_ACTIONS = {
  addMovement:         true,
  addMultiEntry:       true,
  addMultiExit:        true,
  modifyMovement:      true,
  manageMaterial:      true,
  applyDataQualityFix: true,
  commitImport:        true,
  
  
  
  
  undoImport:          true,
  
  
  deleteMovements:     true,
  
  
  
  
  addIncoming:         true,
  updateIncoming:      true,
  deleteIncoming:      true,
  
  
  
  
  
  
  
  lockMaterial:        true,
  unlockMaterial:      true,
  
  
  
  unlockMaterials:     true
};

function bumpDataStamp_() {
  
  
  
  try {
    PropertiesService.getScriptProperties()
      .setProperty(DATA_STAMP_KEY, String(new Date().getTime()));
  } catch (e) {
    Logger.log('bumpDataStamp_ failed: ' + e.message);
  }
}

function dataStamp_() {
  try {
    return String(PropertiesService.getScriptProperties().getProperty(DATA_STAMP_KEY) || '');
  } catch (e) { return ''; }
}












































function mapaDeUbicaciones_(cfg) {
  var mapa = {};
  var lista = (cfg && cfg.locations) || [];
  for (var i = 0; i < lista.length; i++) {
    var nombre = String((lista[i] && lista[i].name) || '').trim();
    if (nombre) mapa[normalizeString(nombre)] = nombre;
  }
  return mapa;
}


function ubicacionDeLlegada_(mt, src, dest) {
  if (mt === 'ENTRY')    return dest || src;
  if (mt === 'RETURN')   return dest;
  if (mt === 'TRANSFER') return dest;
  if (mt === 'ADJUST')   return (dest && !src) ? dest : '';
  return '';
}










function sugerirUbicacion_(buscada, mapa) {
  var objetivo = normalizeString(buscada);
  var mejor = '', mejorD = 3;
  Object.keys(mapa).forEach(function (clave) {
    var d = distanciaEdicion_(objetivo, clave, mejorD);
    if (d < mejorD) { mejorD = d; mejor = mapa[clave]; }
  });
  return mejor;
}


function distanciaEdicion_(a, b, tope) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) >= tope) return tope;
  var fila = [], i, j;
  for (j = 0; j <= b.length; j++) fila[j] = j;
  for (i = 1; i <= a.length; i++) {
    var anterior = fila[0];
    fila[0] = i;
    var minFila = i;
    for (j = 1; j <= b.length; j++) {
      var tmp = fila[j];
      fila[j] = Math.min(
        fila[j] + 1,
        fila[j - 1] + 1,
        anterior + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      anterior = tmp;
      if (fila[j] < minFila) minFila = fila[j];
    }
    if (minFila >= tope) return tope;
  }
  return fila[b.length];
}

function addMovementsBatch_(ss, archive, movements, auth, opciones) {
  var EMPTY = { status: 'success', firstRowIdx: null, rowCount: 0, fileError: null, emailError: null, availableByMat: {} };
  if (!movements || !movements.length) return EMPTY;

  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); }
  catch (e) { throw new Error(BUSY_PREFIX + 'System busy — another save is in progress. Please retry in a moment.'); }

  try {
    
    
    
    ensureArchiveWidth_(archive);

    
    var archiveValues = archive.getDataRange().getValues();

    
    
    
    
    
    
    
    
    
    
    
    var takenIds = {};
    var idFixes  = dedupeMovementIds_(archiveValues, takenIds);


    
    var snapshot = buildStockSnapshot_(archiveValues);

    
    var locksMap = getActiveLocksMap_(ss);

    var now     = new Date();
    var tzDate  = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var newRows = [];    
    var rowMeta = [];    

    
    
    
    
    
    var cfgAhora    = loadConfig();
    var avgCostMap  = cfgAhora.avgCost || {};
    var costTouched = {};    

    








    var ubicaciones = mapaDeUbicaciones_(cfgAhora);
    var crearUbic   = !!(opciones && opciones.crearUbicaciones);
    var ubicNuevas  = [];
    
    
    
    var categorias  = {};
    (cfgAhora.categories || []).forEach(function (c) {
      var n = String(c || '').trim();
      if (n) categorias[normalizeString(n)] = n;
    });
    var catNuevas   = [];

    
    for (var i = 0; i < movements.length; i++) {
      var d  = movements[i];
      var mt = String(d.moveType || '').toUpperCase().trim();
      if (mt === 'DISPATCH') mt = 'EXIT';
      if (['ENTRY','EXIT','TRANSFER','RETURN','WASTE','ADJUST'].indexOf(mt) === -1) {
        throw new Error('Invalid move type: ' + mt);
      }

      var qty = Math.abs(Number(d.qty || 0));
      if (qty <= 0) throw new Error('Quantity must be greater than 0.');

      var cat  = normalizeString(d.category);
      var name = normalizeString(d.name);
      if (!cat || !name) throw new Error('Category and Name are required.');

      var matId = getMaterialId(cat, name);

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      var proj = normalizeString(d.project || '');

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (mt === 'TRANSFER' && (!proj || proj === 'GENERIC')) {
        var carried = snapshot[matId];
        proj = (carried && carried.project && carried.project !== 'GENERIC') ? carried.project : '';
      }

      
      
      
      
      
      
      
      
      
      
      if (mt === 'ADJUST') proj = '';

      
      
      var src     = String(d.sourceLoc || '').toUpperCase().trim();
      var dest    = String(d.destLoc   || '').toUpperCase().trim();
      var srcKey  = normalizeString(src);
      var destKey = normalizeString(dest);

      


































      if (mt === 'ENTRY' && cat) {
        var catKey = normalizeString(cat);
        if (!categorias[catKey]) {
          if (crearUbic) {
            categorias[catKey] = cat;
            catNuevas.push(cat);
          } else {
            throw new Error('UNKNOWN_CATEGORY|' + cat + '|' +
                            sugerirUbicacion_(cat, categorias));
          }
        }
      }

      
      var llega = ubicacionDeLlegada_(mt, src, dest);
      if (llega) {
        var llegaKey = normalizeString(llega);
        if (!ubicaciones[llegaKey]) {
          if (crearUbic) {
            ubicaciones[llegaKey] = llega;
            ubicNuevas.push(llega);
          } else {
            



            throw new Error('UNKNOWN_LOCATION|' + llega + '|' +
                            sugerirUbicacion_(llega, ubicaciones));
          }
        }
      }

      
      
      if (!d.forceSubmit) {
        var dup = checkDuplicateInValues_(archiveValues, mt, cat, name, qty, auth.email);
        if (dup) throw new Error('DUPLICATE_MOVEMENT|' + dup.rowIdx + '|' + dup.minutesAgo);
      }

      var snap     = snapshot[matId] || (snapshot[matId] = { wh: 0, site: 0, locs: {} });
      
      
      
      
      var reserved = reservedQtyFromRacks_(locksMap, matId, snap.locs);

      
      enforceMaterialLock_(locksMap, mt, matId, srcKey, destKey);

      
      
      
      
      var adjDir = 0;
      if (mt === 'ADJUST') {
        adjDir = adjustDirection_(srcKey, destKey);
        if (!adjDir) throw new Error('An adjustment needs exactly one rack — the one you counted.');
        if (!String(d.comments || '').trim()) {
          throw new Error('ADJUST movements require a reason — say why the count was off.');
        }
        
        
        
        
        
        
        if (adjDir < 0) {
          var adjHave = snap.locs[srcKey] || 0;
          if (adjHave < qty) {
            throw new Error('COUNT CHANGED for ' + name + ' at ' + src + '. The app now shows ' +
              adjHave + ' there, so it cannot come down by ' + qty + '. Somebody moved this ' +
              'material while you were counting — open the rack and count it again.');
          }
        }
      }

      
      
      if (mt === 'EXIT' || mt === 'TRANSFER' || mt === 'WASTE') {
        var avail    = Math.max(0, snap.wh - reserved);
        var locAvail = srcKey ? (snap.locs[srcKey] || 0) : avail;
        if (avail < qty) {
          throw new Error('INSUFFICIENT STOCK for ' + name + '. Available: ' + avail +
            ' (Warehouse: ' + snap.wh + ', Reserved: ' + reserved + '). Cannot remove ' + qty + '.' +
            shortStockTag_(cat, name, '', avail, avail, qty));
        }
        if (srcKey && locAvail < qty) {
          throw new Error('INSUFFICIENT at ' + src + ' for ' + name + '. Available there: ' +
            locAvail + '. Total available: ' + avail +
            shortStockTag_(cat, name, src, locAvail, avail, qty));
        }
      }
      if (mt === 'WASTE' && !String(d.comments || '').trim()) {
        throw new Error('WASTE movements require a reason in comments.');
      }

      
      
      
      var whBeforeThisRow = snap.wh;

      
      applyMovementToSnapshot_(snap, mt, qty, srcKey, destKey);

      var statusVal = statusForMoveType_(mt);

      
      
      
      
      
      
      
      
      
      
      var unitCost = null, totalCost = null;
      if (mt === 'ENTRY') {
        var enteredCost = (d.unitCost !== undefined && d.unitCost !== null && String(d.unitCost).trim() !== '')
          ? Number(d.unitCost) : NaN;
        if (!isNaN(enteredCost) && enteredCost >= 0) {
          unitCost  = round2_(enteredCost);
          totalCost = round2_(unitCost * qty);
          var priorCost = avgCostMap[matId];
          var newAvg = (!priorCost || whBeforeThisRow <= 0)
            ? unitCost
            : round2_((whBeforeThisRow * priorCost.avg + qty * unitCost) / (whBeforeThisRow + qty));
          avgCostMap[matId] = { category: cleanDisplay_(d.category), name: cleanDisplay_(d.name), avg: newAvg };
          costTouched[matId] = true;
        }
      } else if (mt === 'ADJUST') {
        
        
        
        
        
        
        
        
        
        
      } else if (avgCostMap[matId]) {
        unitCost  = avgCostMap[matId].avg;
        totalCost = round2_(unitCost * qty);
      }

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      var row = new Array(AC_WIDTH);
      row[AC.TIMESTAMP]   = now;
      row[AC.CATEGORY]    = cleanDisplay_(d.category);   
      row[AC.NAME]        = cleanDisplay_(d.name);       
      
























      row[AC.GC]          = cleanDisplay_(d.gc);
      row[AC.PO]          = cleanDisplay_(d.po);
      row[AC.QTY]         = qty;
      row[AC.UNIT]        = String(d.unit || 'UNIT').toUpperCase();
      row[AC.DATE_REC]    = d.dateRec || tzDate;
      row[AC.SRC_LOC]     = src;
      row[AC.SUPPLIER]    = cleanDisplay_(d.supplier);
      row[AC.COMMENTS]    = String(d.comments || '').trim();
      row[AC.STATUS]      = statusVal;
      
      
      
      
      
      
      row[AC.RESPONSIBLE] = cleanDisplay_(d.responsible);
      row[AC.PROJECT]     = proj;
      row[AC.MAT_ID]      = matId;
      row[AC.DOC_LINKS]   = '';
      row[AC.USER_EMAIL]  = autorDeLaFila_(auth.email);
      row[AC.DEST_LOC]    = dest;
      row[AC.MOVETYPE]    = mt;
      row[AC.PM]          = String(d.pm || '').trim();
      row[AC.UNIT_COST]   = (unitCost  === null) ? '' : unitCost;
      row[AC.TOTAL_COST]  = (totalCost === null) ? '' : totalCost;
      
      
      
      
      
      
      
      row[AC.MOV_ID]      = uniqueMovId_(takenIds, newRows.length, now);

      












      if (mt === 'RETURN' || mt === 'EXIT') {
        row[AC.ORIGIN_PROJECT] = d.originProject ? normalizeString(d.originProject) : '';
        row[AC.FROM_MOV]       = String(d.fromMov || '').trim();
      } else {
        row[AC.ORIGIN_PROJECT] = '';
        row[AC.FROM_MOV]       = '';
      }

      








      row[AC.IMPORT_ID] = String(d.importId || '').trim();

      newRows.push(row);
      rowMeta.push({
        mt: mt, name: name, matId: matId, proj: proj, qty: qty, unit: row[AC.UNIT],
        src: src, dest: dest,
        rawName: String(d.name || '').trim(),                        
        rawProj: (d.isGeneric ? '' : String(d.project || '').trim()),
        docGroups: d.docGroups || [], files: d.files || [],
        notify: d.notifyRecipients || null
      });
    }

    if (!newRows.length) return EMPTY;

    
    var startRow = archive.getLastRow() + 1;
    archive.getRange(startRow, 1, newRows.length, AC_WIDTH).setValues(newRows.map(textSafeRow_));
    archive.getRange(startRow, AC.TIMESTAMP + 1, newRows.length, 1).setNumberFormat('mm/dd/yyyy hh:mm');

    
    var verifyVals = archive.getRange(startRow, AC.NAME + 1, newRows.length, 1).getValues();
    for (var v = 0; v < verifyVals.length; v++) {
      if (normalizeString(String(verifyVals[v][0] || '').trim()) !== normalizeString(rowMeta[v].name)) {
        throw new Error('WRITE_VERIFY_FAIL: row ' + (startRow + v) +
          ' could not be confirmed in the archive. Please reload and check before retrying.');
      }
    }

    
    
    
    
    
    
    
    
    if (idFixes.length) {
      try {
        writeMovIdColumn_(archive, archiveValues);
        
        
        
        auditLog_(ss, 'MOVEMENT_ID_DEDUPE', 'auto',
          idFixes.length + ' duplicated movement ID(s) renamed',
          'sheet rows ' + idFixes.map(function (i) { return i + 1; }).join(','), '');
      } catch (de) { Logger.log('dedupe movement ids: ' + de.message); }
    }

    
    
    
    
    if (Object.keys(costTouched).length) {
      try { saveAvgCostUpdates_(ss, costTouched, avgCostMap); }
      catch (ce) { Logger.log('saveAvgCostUpdates_: ' + ce.message); }
    }

    
    var fileError = null;
    for (var u = 0; u < rowMeta.length; u++) {
      var meta = rowMeta[u];
      var hasDocGroups = meta.docGroups && meta.docGroups.length > 0;
      var hasFiles     = meta.files     && meta.files.length     > 0;
      if (!hasDocGroups && !hasFiles) continue;
      try {
        var links = hasDocGroups
          ? uploadDocGroups_(meta.docGroups, meta.name)
          : uploadFiles_(meta.files, meta.name, 'DOC');
        if (links) archive.getRange(startRow + u, AC.DOC_LINKS + 1).setRichTextValue(richTextForDocLinks_(links));
      } catch (fe) {
        if (!fileError) fileError = fe.message;
        Logger.log('File upload error: ' + fe.message);
      }
    }

    
    
    
    
    
    
    
    
    var refreshError = null;
    try {
      refreshDerivedSheets_(ss);
    } catch (re) {
      refreshError = 'Stock totals may be out of date — run Settings → System → "Rebuild Stock Totals Now". (' + re.message + ')';
      logError_(ss, 'ERROR', 'backend', 'addMovementsBatch_/refreshDerivedSheets_', auth.email, re.message, { rowCount: newRows.length }, newRequestId_());
    }

    
    var auditDetail = rowMeta.map(function (m) { return m.mt + ' ' + m.name + ' x' + m.qty; }).join('; ');
    auditLog_(ss, 'ADD_MOVEMENT', auth.email, auditDetail, '', '');

    
    var emailError = null;
    var notifyCfg = null;
    for (var n = 0; n < rowMeta.length; n++) {
      if (rowMeta[n].notify && rowMeta[n].notify.emails) { notifyCfg = rowMeta[n].notify; break; }
    }
    if (notifyCfg) {
      try { emailError = sendBatchNotifyEmail_(notifyCfg, rowMeta, auth); }
      catch (ne) { emailError = ne.message; Logger.log('Email error: ' + ne.message); }
    }

    
    for (var w = 0; w < rowMeta.length; w++) {
      if (rowMeta[w].mt === 'WASTE') {
        try { checkNotifications_(ss, { name: rowMeta[w].name, comments: '' }, 'WASTE', rowMeta[w].qty, auth.email); } catch (we) {}
      }
    }

    























    var tocados = {};
    for (var t2 = 0; t2 < rowMeta.length; t2++) tocados[rowMeta[t2].matId] = true;

    var availableByMat = {}, stockAfter = {};
    for (var m2 in tocados) {
      if (!tocados.hasOwnProperty(m2) || !snapshot[m2]) continue;
      var reservado = reservedQtyFromRacks_(locksMap, m2, snapshot[m2].locs);
      var disp      = Math.max(0, snapshot[m2].wh - reservado);
      availableByMat[m2] = disp;
      stockAfter[m2] = {
        warehouseQty:  snapshot[m2].wh,
        siteQty:       snapshot[m2].site,
        reservedQty:   reservado,
        availableQty:  disp,
        totalQty:      snapshot[m2].wh + snapshot[m2].site,
        warehouseLocs: snapshot[m2].locs
      };
    }

    






























    var guardados = [];
    try {
      var verCostes = canSeeCosts_(auth);
      for (var g = 0; g < newRows.length; g++) {
        var mg = parseArchiveRow(newRows[g], startRow + g);
        if (!verCostes) { mg.unitCost = null; mg.totalCost = null; }
        guardados.push(mg);
      }
    } catch (eGuardados) {
      Logger.log('returning saved movements: ' + eGuardados.message);
      guardados = [];
    }

    return {
      status:         'success',
      firstRowIdx:    startRow,
      rowCount:       newRows.length,
      fileError:      fileError,
      emailError:     emailError,
      refreshError:   refreshError,
      availableByMat: availableByMat,
      stockAfter:     stockAfter,
      
      movimientos:    guardados,
      
      
      ubicacionesCreadas: ubicNuevas,
      categoriasCreadas:  catNuevas
    };

  } finally {
    lock.releaseLock();
  }
}



function buildStockSnapshot_(archiveValues) {
  var snap = {};
  for (var i = 1; i < archiveValues.length; i++) {
    var row = archiveValues[i];
    if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;

    var matId  = getMaterialId(normalizeString(row[AC.CATEGORY] || ''), normalizeString(row[AC.NAME] || ''));
    var rawQty = Number(row[AC.QTY] || 0);
    var rawMT  = String(row[AC.MOVETYPE] || '').toUpperCase().trim();
    var rawSt  = String(row[AC.STATUS]   || '').toUpperCase().trim();
    var qty    = Math.abs(rawQty);
    var mt = tipoDeMovimiento_(rawMT, rawQty, rawSt);

    var s = snap[matId] || (snap[matId] = { wh: 0, site: 0, locs: {}, project: '' });
    
    
    
    
    
    
    
    
    
    var rowProj = normalizeString(row[AC.PROJECT] || '');
    if (rowProj && rowProj !== 'GENERIC') s.project = rowProj;
    applyMovementToSnapshot_(s, mt, qty, normalizeString(row[AC.SRC_LOC] || ''), normalizeString(row[AC.DEST_LOC] || ''));
  }
  for (var k in snap) {
    if (!snap.hasOwnProperty(k)) continue;
    var locs = snap[k].locs;
    for (var l in locs) { if (locs.hasOwnProperty(l) && locs[l] < 0) locs[l] = 0; }
  }
  return snap;
}



function applyMovementToSnapshot_(s, mt, qty, srcKey, destKey) {
  if (mt === 'ENTRY') {
    var rack = destKey || srcKey || 'UNASSIGNED';
    s.locs[rack] = (s.locs[rack] || 0) + qty;
    s.wh += qty;
  } else if (mt === 'EXIT' || mt === 'DISPATCH') {
    var exSrc = srcKey || findFirstWarehouseLoc(s.locs, qty);
    if (exSrc && s.locs[exSrc]) s.locs[exSrc] -= qty;
    s.wh = Math.max(0, s.wh - qty);
    s.site += qty;
  } else if (mt === 'TRANSFER') {
    if (srcKey && s.locs[srcKey] != null) s.locs[srcKey] -= qty;
    if (destKey) s.locs[destKey] = (s.locs[destKey] || 0) + qty;
  } else if (mt === 'RETURN') {
    s.site = Math.max(0, s.site - qty);
    var retRack = destKey || 'UNASSIGNED';
    s.locs[retRack] = (s.locs[retRack] || 0) + qty;
    s.wh += qty;
  } else if (mt === 'WASTE') {
    var wSrc = srcKey || findFirstWarehouseLoc(s.locs, qty);
    if (wSrc && s.locs[wSrc]) s.locs[wSrc] -= qty;
    s.wh = Math.max(0, s.wh - qty);
  } else if (mt === 'ADJUST') {
    
    
    if (srcKey && !destKey) {
      if (s.locs[srcKey]) s.locs[srcKey] -= qty;
      s.wh = Math.max(0, s.wh - qty);
    } else if (destKey && !srcKey) {
      s.locs[destKey] = (s.locs[destKey] || 0) + qty;
      s.wh += qty;
    }
  }
}



function checkDuplicateInValues_(archiveValues, mt, cat, name, qty, userEmail) {
  var WINDOW_MS = 3 * 60 * 1000;
  var MAX_ROWS  = 40;
  var lastIdx   = archiveValues.length - 1;
  if (lastIdx < 1) return null;

  var startIdx = Math.max(1, lastIdx - MAX_ROWS + 1);
  var now      = new Date().getTime();

  for (var i = lastIdx; i >= startIdx; i--) {
    var row   = archiveValues[i];
    var rowTs = row[AC.TIMESTAMP];
    if (!(rowTs instanceof Date)) continue;

    var ageMs = now - rowTs.getTime();
    if (ageMs > WINDOW_MS) break;  

    
    
    if (String(row[AC.MOVETYPE]   || '').toUpperCase().trim() === mt.toUpperCase()  &&
        normalizeString(row[AC.CATEGORY])                     === cat               &&
        normalizeString(row[AC.NAME])                         === name              &&
        Number(row[AC.QTY]        || 0)                       === qty               &&
        String(row[AC.USER_EMAIL] || '').toLowerCase().trim() === (userEmail || '').toLowerCase()) {
      return { rowIdx: i + 1, minutesAgo: Math.round(ageMs / 60000 * 10) / 10 };
    }
  }
  return null;
}








function sendBatchNotifyEmail_(notify, rowMeta, auth) {
  
  if (basicApagado_()) return 'Acopio Basic does not send email.';
  
  var valid = [];
  var raw = String(notify.emails || '').split(/[\s,;]+/);
  for (var i = 0; i < raw.length; i++) {
    var addr = raw[i].trim();
    if (addr && addr.indexOf('@') !== -1 && valid.indexOf(addr) === -1) valid.push(addr);
  }
  if (valid.length === 0) return 'No valid email addresses provided.';

  
  var matNames = [], projects = [];
  for (var r = 0; r < rowMeta.length; r++) {
    var dn = rowMeta[r].rawName || rowMeta[r].name;
    if (dn && matNames.indexOf(dn) === -1) matNames.push(dn);
    var pj = rowMeta[r].rawProj;
    if (pj && pj.toUpperCase() !== 'GENERIC' && projects.indexOf(pj) === -1) projects.push(pj);
  }
  var projSuffix = projects.length ? ' — ' + projects.join(', ') : '';
  var subject;
  if (matNames.length <= 1) {
    subject = 'Material Received: ' + (matNames[0] || 'Material') + projSuffix;
  } else {
    subject = 'Materials Received: ' + matNames.length + ' items (' +
              matNames.slice(0, 3).join(', ') + (matNames.length > 3 ? ', …' : '') + ')' + projSuffix;
  }

  
  
  var msgBody = notify.message;
  if (!msgBody) {
    var lines = rowMeta.map(function (m) {
      var dn = m.rawName || m.name;
      return '  • ' + m.qty + ' ' + (m.unit || 'UNIT') + '(s) of ' + dn +
             (m.dest || m.src ? ' → ' + (m.dest || m.src) : '');
    }).join('\n');
    msgBody = 'Hi,\n\nThe following materials were received today and are now in our warehouse:\n' +
              lines + '\n\nLet us know if you need anything.\n\n' + (companySettings_().name || 'Warehouse') + ' — Warehouse Team';
  }

  
  var to  = valid[0];
  var cc  = valid.slice(1).join(',');    
  var opts = { name: (companySettings_().name || 'Warehouse') + ' — Warehouse', replyTo: auth.email };
  if (cc) opts.cc = cc;
  MailApp.sendEmail(to, subject, msgBody, opts);
  return null;
}







function addMultiEntry(ss, archive, data, auth) {
  auth = requireAuth_('WRITE');    
  if (!Array.isArray(data.materials) || data.materials.length === 0) {
    throw new Error('No materials provided.');
  }

  var totalMats = 0;
  var rows      = [];

  for (var mi = 0; mi < data.materials.length; mi++) {
    var mat = data.materials[mi];
    if (!mat.name || !Array.isArray(mat.locations) || mat.locations.length === 0) continue;

    totalMats++;
    for (var li = 0; li < mat.locations.length; li++) {
      var locEntry = mat.locations[li];
      if (!locEntry.qty || locEntry.qty <= 0) continue;

      var isFirstRow = (rows.length === 0);
      
      
      
      
      var matProject = mat.project || data.project || '';
      rows.push({
        moveType:         'ENTRY',
        category:         mat.category || data.category || '',
        name:             mat.name,
        project:          matProject,
        isGeneric:        mat.project !== undefined ? !matProject : data.isGeneric,
        gc:               mat.gc       || data.gc       || '',
        po:               mat.po       || data.po       || '',
        qty:              locEntry.qty,
        unit:             mat.unit      || 'UNIT',
        dateRec:          data.dateRec  || '',
        sourceLoc:        '',
        destLoc:          locEntry.loc  || '',
        supplier:         mat.supplier    || data.supplier    || '',
        comments:         mat.comments    || data.comments    || '',
        responsible:      mat.responsible || data.responsible || '',
        pm:               mat.pm          || data.pm          || '',
        
        
        
        unitCost:         mat.unitCost,
        files:            [],
        
        docGroups:        isFirstRow ? (data.docGroups       || []) : [],
        notifyRecipients: isFirstRow ? data.notifyRecipients : null,
        
        forceSubmit:      !isFirstRow || !!data.forceSubmit
      });
    }
  }

  var res = addMovementsBatch_(ss, archive, rows, auth);

  
  
  
  var pmError = null;
  try { pmError = sendPmGroupedEmails_(rows, auth); } catch (e) { pmError = 'PM notification error: ' + e.message; }

  return {
    status:     'success',
    count:      totalMats,
    rowCount:   res.rowCount,
    fileError:  res.fileError  || null,
    emailError: res.emailError || null,
    refreshError: res.refreshError || null,
    pmError:    pmError,
      













    stockAfter:     res.stockAfter     || null,
    availableByMat: res.availableByMat || null,
    movimientos:    res.movimientos    || [],
    message:    totalMats + ' material(s), ' + res.rowCount + ' row(s) recorded.'
  };
}




function addMultiExit(ss, archive, data, auth) {
  auth = requireAuth_('WRITE');    
  if (!Array.isArray(data.materials) || data.materials.length === 0) {
    throw new Error('No materials provided.');
  }

  var totalMats = 0;
  var rows      = [];

  for (var mi = 0; mi < data.materials.length; mi++) {
    var mat = data.materials[mi];
    if (!mat.name || !Array.isArray(mat.locations) || mat.locations.length === 0) continue;

    totalMats++;
    for (var li = 0; li < mat.locations.length; li++) {
      var loc = mat.locations[li];
      if (!loc.qty || loc.qty <= 0) continue;

      rows.push({
        moveType:    'EXIT',
        category:    mat.category || '',
        name:        mat.name,
        qty:         loc.qty,
        unit:        mat.unit || 'UNIT',
        dateRec:     data.dateRec     || '',
        sourceLoc:   loc.loc                    || '',
        destLoc:     mat.destLoc || data.destLoc || '',
        responsible: data.responsible || '',
        comments:    data.comments    || '',
        
        forceSubmit: rows.length === 0 ? !!data.forceSubmit : true
      });
    }
  }

  var res = addMovementsBatch_(ss, archive, rows, auth);
  return {
    status:   'success',
    count:    totalMats,
    rowCount: res.rowCount,
    refreshError: res.refreshError || null,
      













    stockAfter:     res.stockAfter     || null,
    availableByMat: res.availableByMat || null,
    movimientos:    res.movimientos    || [],
    message:  totalMats + ' material(s), ' + res.rowCount + ' row(s) recorded.'
  };
}



























function tipoDeMovimiento_(rawMT, qty, estado) {
  var mt = String(rawMT  || '').toUpperCase().trim();
  var st = String(estado || '').toUpperCase().trim();
  if (!mt || mt === 'IN STOCK') {
    return (Number(qty) < 0 || st === 'DISPATCHED' || st === 'DISPATCH') ? 'EXIT' : 'ENTRY';
  }
  if (mt === 'DISPATCHED' || mt === 'DISPATCH' || mt === 'DEL') return 'EXIT';
  return mt;    
}



































function getOutstandingBySite(sessionToken, categoria) {
  var auth = setVerifiedAuth_(getUserRole(sessionToken));
  requireAuth_();
  requireQuota_('fuera', auth.email || 'basic', 60, 300);

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) return [];

  var cat  = normalizeString(categoria || '');
  var data = archive.getDataRange().getValues();
  var fila = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
    var rowCat = normalizeString(row[AC.CATEGORY] || '');
    if (cat && rowCat !== cat) continue;

    var mt  = tipoDeMovimiento_(row[AC.MOVETYPE], row[AC.QTY], row[AC.STATUS]);
    if (mt !== 'EXIT' && mt !== 'RETURN') continue;

    var qty = Math.abs(Number(row[AC.QTY] || 0));
    if (!qty) continue;

    

    var sitio = normalizeString(
      (mt === 'EXIT' ? row[AC.DEST_LOC] : row[AC.SRC_LOC]) || '');
    if (!sitio) continue;           

    var nombre = normalizeString(row[AC.NAME] || '');
    var clave  = getMaterialId(rowCat, nombre) + '|' + sitio;
    var f = fila[clave] || (fila[clave] = {
      category: String(row[AC.CATEGORY] || '').trim(),
      name:     String(row[AC.NAME]     || '').trim(),
      site:     String(mt === 'EXIT' ? row[AC.DEST_LOC] : row[AC.SRC_LOC] || '').trim(),
      qty: 0, unit: '', project: '', pm: '', responsible: '', supplier: '', gc: ''
    });

    if (mt === 'EXIT') {
      f.qty += qty;
      




      if (row[AC.UNIT])        f.unit        = String(row[AC.UNIT]).trim();
      if (row[AC.PROJECT])     f.project     = String(row[AC.PROJECT]).trim();
      if (row[AC.PM])          f.pm          = String(row[AC.PM]).trim();
      if (row[AC.RESPONSIBLE]) f.responsible = String(row[AC.RESPONSIBLE]).trim();
      if (row[AC.SUPPLIER])    f.supplier    = String(row[AC.SUPPLIER]).trim();
      if (row[AC.GC])          f.gc          = String(row[AC.GC]).trim();
    } else {
      f.qty -= qty;
    }
  }

  var fuera = [];
  Object.keys(fila).forEach(function (k) {
    



    if (fila[k].qty > 0) fuera.push(fila[k]);
  });

  
  fuera.sort(function (a, b) { return b.qty - a.qty; });
  return fuera.slice(0, 200);
}

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
    var mt = tipoDeMovimiento_(rawMT2, rawQty2, rawStatus2);
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

    } else if (mt === 'ADJUST') {
      
      if (src && !dst) {
        if (locs[src]) locs[src] -= qty;
        wh = Math.max(0, wh - qty);
      } else if (dst && !src) {
        locs[dst] = (locs[dst] || 0) + qty;
        wh += qty;
      }
    }
  }

  for (var k in locs) { if (locs.hasOwnProperty(k) && locs[k] < 0) locs[k] = 0; }

  
  
  
  
  var reserved = reservedQtyFromRacks_(getActiveLocksMap_(ss), matId, locs);

  return {
    warehouseQty:  Math.max(0, wh),
    siteQty:       Math.max(0, site),
    warehouseLocs: locs,
    reservedQty:   reserved,
    availableQty:  Math.max(0, wh - reserved)
  };
}

function ensureWasteSheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.WASTE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.WASTE);
    sheet.appendRow(['Category','Name','Qty','Unit']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  return sheet;
}




















var PACK_COLS = { CATEGORY:0, NAME:1, PACK:2, PER_PACK:3, LAST_PRICE:4, UPDATED_AT:5, UPDATED_BY:6 };

function ensurePacksSheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.PACKS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.PACKS);
    sheet.appendRow(['Category','Name','Pack','Units_Per_Pack','Last_Pack_Price','Updated_At','Updated_By']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  return sheet;
}







var PACK_DECIMALS = 4;
function roundQty_(n) {
  var v = Number(n);
  if (!isFinite(v)) return 0;
  return Math.round(v * Math.pow(10, PACK_DECIMALS)) / Math.pow(10, PACK_DECIMALS);
}




function packKey_(category, name) {
  return String(category || '').trim().toUpperCase() + '||' + String(name || '').trim().toUpperCase();
}

function readPacks_(ss) {
  var sheet = ss.getSheetByName(SHEETS.PACKS);
  if (!sheet || sheet.getLastRow() < 2) return {};
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  var out = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var cat = String(r[PACK_COLS.CATEGORY] || '').trim();
    var nm  = String(r[PACK_COLS.NAME] || '').trim();
    var pk  = String(r[PACK_COLS.PACK] || '').trim();
    var per = Number(r[PACK_COLS.PER_PACK]);
    
    
    if (!cat || !nm || !pk || !isFinite(per) || per <= 0) continue;
    var k = packKey_(cat, nm);
    if (!out[k]) out[k] = { category: cat, name: nm, packs: [] };
    out[k].packs.push({
      pack: pk,
      perPack: roundQty_(per),
      lastPrice: Number(r[PACK_COLS.LAST_PRICE]) || 0
    });
  }
  
  
  Object.keys(out).forEach(function (k) {
    out[k].packs.sort(function (a, b) { return a.perPack - b.perPack; });
  });
  return out;
}

function getMaterialPacks(auth) {
  auth = requireAuth_('READ');
  return readPacks_(SpreadsheetApp.getActiveSpreadsheet());
}




function saveMaterialPack(data, auth) {
  auth = requireAuth_('WRITE');
  requirePerm_(auth, 'canManageCatalog');
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cat  = String((data && data.category) || '').trim().toUpperCase();
  var name = String((data && data.name) || '').trim().toUpperCase();
  var pack = String((data && data.pack) || '').trim();
  var per  = Number(data && data.perPack);

  if (!cat || !name) throw new Error('Pick the material first.');
  if (!pack)         throw new Error('Give the pack a name — Box, Pallet, Sack…');
  if (!isFinite(per) || per <= 0) throw new Error('How many units are in one ' + pack + '? It has to be more than zero.');
  
  
  if (per === 1) throw new Error('A ' + pack + ' of 1 is the same as the unit itself — no pack needed.');

  var sheet = ensurePacksSheet_(ss);
  var rows  = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues() : [];
  var stamp = new Date();
  var row = [cat, name, pack.toUpperCase(), roundQty_(per),
             Number(data.lastPrice) || 0, stamp, auth.email];

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][PACK_COLS.CATEGORY] || '').trim().toUpperCase() === cat &&
        String(rows[i][PACK_COLS.NAME] || '').trim().toUpperCase() === name &&
        String(rows[i][PACK_COLS.PACK] || '').trim().toUpperCase() === pack.toUpperCase()) {
      
      
      sheet.getRange(i + 2, 1, 1, 7).setValues([textSafeRow_(row)]);
      auditLog_(ss, 'PACK_SAVE', auth.email, cat + ' / ' + name, pack, String(per));
      return { status: 'success', updated: true };
    }
  }
  sheet.appendRow(textSafeRow_(row));
  auditLog_(ss, 'PACK_SAVE', auth.email, cat + ' / ' + name, pack, String(per));
  return { status: 'success', updated: false };
}

function deleteMaterialPack(data, auth) {
  auth = requireAuth_('WRITE');
  requirePerm_(auth, 'canManageCatalog');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PACKS);
  if (!sheet || sheet.getLastRow() < 2) return { status: 'success', deleted: 0 };

  var cat  = String((data && data.category) || '').trim().toUpperCase();
  var name = String((data && data.name) || '').trim().toUpperCase();
  var pack = String((data && data.pack) || '').trim().toUpperCase();
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();

  
  
  var gone = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][PACK_COLS.CATEGORY] || '').trim().toUpperCase() === cat &&
        String(rows[i][PACK_COLS.NAME] || '').trim().toUpperCase() === name &&
        String(rows[i][PACK_COLS.PACK] || '').trim().toUpperCase() === pack) {
      sheet.deleteRow(i + 2);
      gone++;
    }
  }
  if (gone) auditLog_(ss, 'PACK_DELETE', auth.email, cat + ' / ' + name, pack, '');
  return { status: 'success', deleted: gone };
}




function packMath_(packCount, perPack, pricePerPack) {
  var n     = Number(packCount);
  var per   = Number(perPack);
  var price = Number(pricePerPack);
  if (!isFinite(n) || !isFinite(per) || n <= 0 || per <= 0) return null;
  var qty = roundQty_(n * per);
  var out = { qty: qty, unitCost: null, totalPrice: null };
  if (isFinite(price) && price > 0) {
    out.totalPrice = Math.round(price * n * 100) / 100;
    
    
    out.unitCost = Math.round((price / per) * 10000) / 10000;
  }
  return out;
}










































































function alinearPapelera_(sheet) {
  if (!sheet) return sheet;
  try {
    var ancho = sheet.getMaxColumns();
    if (ancho < 1) return sheet;
    var cab = sheet.getRange(1, 1, 1, ancho).getValues()[0];
    var pos = -1;
    for (var i = 0; i < cab.length; i++) {
      if (String(cab[i] || '').trim() === 'Deleted At') { pos = i; break; }
    }
    if (pos === -1) return sheet;         
    if (pos === TR.DELETED_AT) return sheet;    

    if (pos > TR.DELETED_AT) {
      
      
      Logger.log('alinearPapelera_: "Deleted At" en ' + pos + ', el modelo espera ' +
                 TR.DELETED_AT + '. No se toca.');
      return sheet;
    }

    
    
    sheet.insertColumnsBefore(pos + 1, TR.DELETED_AT - pos);
  } catch (e) {
    
    
    Logger.log('alinearPapelera_: ' + (e && e.message));
  }
  return sheet;
}

function ensureTrashSheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.TRASH);
  if (!sheet) {
    var archive = ss.getSheetByName(SHEETS.ARCHIVE);
    var headers = archive
      ? padRow_(archive.getRange(1, 1, 1, readWidth_(archive)).getValues()[0], AC_WIDTH)
      : new Array(AC_WIDTH).fill('');
    headers = headers.concat(['Deleted At', 'Deleted By', 'Came From']);
    sheet = ss.insertSheet(SHEETS.TRASH);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  
  
  alinearPapelera_(sheet);
  ensureArchiveWidth_(sheet);
  if (sheet.getMaxColumns() < TRASH_WIDTH) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), TRASH_WIDTH - sheet.getMaxColumns());
  }
  return sheet;
}




function findMovementById_(ss, movId) {
  var want = String(movId || '').trim();
  if (!want) return null;
  var names = [SHEETS.ARCHIVE, SHEETS.ARCHIVE_HISTORY];
  for (var s = 0; s < names.length; s++) {
    var sheet = ss.getSheetByName(names[s]);
    if (!sheet) continue;
    var last = sheet.getLastRow();
    if (last < 2 || sheet.getMaxColumns() < AC_WIDTH) continue;
    
    
    var ids = sheet.getRange(2, AC.MOV_ID + 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0] || '').trim() === want) {
        return {
          sheet:     sheet,
          sheetName: names[s],
          rowIdx:    i + 2,
          row:       padRow_(sheet.getRange(i + 2, 1, 1, readWidth_(sheet)).getValues()[0], AC_WIDTH)
        };
      }
    }
  }
  return null;
}



function findTrashedById_(ss, movId) {
  var want = String(movId || '').trim();
  if (!want) return null;
  
  
  
  var sheet = alinearPapelera_(ss.getSheetByName(SHEETS.TRASH));
  if (!sheet) return null;
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var rows = sheet.getRange(2, 1, last - 1, Math.min(TRASH_WIDTH, sheet.getMaxColumns())).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][AC.MOV_ID] || '').trim() === want) {
      return { sheet: sheet, rowIdx: i + 2, row: rows[i] };
    }
  }
  return null;
}

function ensureArchiveHistorySheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.ARCHIVE_HISTORY);
  if (!sheet) {
    var archive = ss.getSheetByName(SHEETS.ARCHIVE);
    var headers = archive.getRange(1, 1, 1, readWidth_(archive)).getValues()[0];
    sheet = ss.insertSheet(SHEETS.ARCHIVE_HISTORY);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

























function archiveOldMovements(ss, opciones) {
  var ensayo = !!(opciones && opciones.ensayo);
  var informe = { ensayo: ensayo, pasos: [] };
  function anotar(t) { informe.pasos.push(t); }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { status: 'busy', informe: informe };
  try {
    var archive = ss.getSheetByName(SHEETS.ARCHIVE);
    if (!archive) return { status: 'no-archive' };
    var history = ensureArchiveHistorySheet_(ss);

    var cfg          = loadConfig();
    var cutoffMonths = cfg.archiveCutoffMonths || 12;
    var cutoffDate   = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - cutoffMonths);

    




















    var SUELO_DIAS = 30;
    var suelo = new Date();
    suelo.setDate(suelo.getDate() - SUELO_DIAS);
    informe.sueloDias = SUELO_DIAS;
    informe.sueloAplicado = (cutoffDate > suelo);
    if (informe.sueloAplicado) {
      anotar('Cutoff of ' + cutoffMonths + ' month(s) would archive movements from the ' +
             'last ' + SUELO_DIAS + ' days. It will not: the last ' + SUELO_DIAS +
             ' days always stay in the recent list.');
      cutoffDate = suelo;
    }

    
    
    
    
    
    
    
    
    var colCount = AC_WIDTH;
    var aData    = archive.getDataRange().getValues();
    var hData    = history.getDataRange().getValues();

    




    informe.modeloAncho   = colCount;
    informe.archivoAncho  = archive.getMaxColumns();
    informe.archivoUltima = archive.getLastColumn();
    informe.histAncho     = history.getMaxColumns();
    informe.histUltima    = history.getLastColumn();
    informe.archivoFilas  = contarConDatos_(aData.slice(1));
    informe.histFilas     = contarConDatos_(hData.slice(1));
    anotar('Model needs ' + colCount + ' columns. Archive is ' + informe.archivoAncho +
           ' wide (last used ' + informe.archivoUltima + ') with ' + informe.archivoFilas +
           ' movement(s). History is ' + informe.histAncho + ' wide (last used ' +
           informe.histUltima + ') with ' + informe.histFilas + '.');

    
    
    
    
    
    
    var takenIds = {};
    var aIdFix   = dedupeMovementIds_(aData, takenIds);
    var hIdFix   = dedupeMovementIds_(hData, takenIds);
    if (aIdFix.length || hIdFix.length) {
      informe.idsDuplicados = aIdFix.length + hIdFix.length;
      
      
      
      if (ensayo) anotar(informe.idsDuplicados + ' duplicated movement ID(s) would be renamed.');
      try {
        if (ensayo) throw { _saltar: true };
        
        
        
        if (aIdFix.length) writeMovIdColumn_(archive, aData);
        if (hIdFix.length) writeMovIdColumn_(history, hData);
        auditLog_(ss, 'MOVEMENT_ID_DEDUPE', 'auto',
          (aIdFix.length + hIdFix.length) + ' duplicated movement ID(s) renamed',
          'archive rows ' + (aIdFix.join(',') || '—'),
          'history rows ' + (hIdFix.join(',') || '—'));
      } catch (de) { if (!de || !de._saltar) Logger.log('nightly dedupe movement ids: ' + de.message); }
    }

    var keep = [], toArchive = [];
    for (var i = 1; i < aData.length; i++) {
      var row = aData[i];
      if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
      var ts = row[AC.TIMESTAMP] instanceof Date ? row[AC.TIMESTAMP] : null;
      
      
      
      (ts && ts < cutoffDate ? toArchive : keep).push(padRow_(row, colCount));
    }

    var stillOld = [], toRestore = [];
    for (var j = 1; j < hData.length; j++) {
      var hrow = hData[j];
      if (!hrow[AC.CATEGORY] && !hrow[AC.NAME]) continue;
      var hts = hrow[AC.TIMESTAMP] instanceof Date ? hrow[AC.TIMESTAMP] : null;
      (hts && hts >= cutoffDate ? toRestore : stillOld).push(padRow_(hrow, colCount));
    }

    informe.corteMeses = cutoffMonths;
    informe.corteFecha = Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    informe.seArchivan = toArchive.length;
    informe.seDevuelven = toRestore.length;
    informe.seQuedan   = keep.length;
    anotar('Cutoff is ' + cutoffMonths + ' month(s) — anything before ' + informe.corteFecha +
           ' is old. ' + toArchive.length + ' would move OUT of the recent list, ' +
           toRestore.length + ' would come back IN, ' + keep.length + ' would stay.');

    if (!toArchive.length && !toRestore.length) {
      anotar('Nothing crosses the cutoff tonight — the job would do nothing at all.');
      return { status: 'noop', informe: informe };
    }

    var byTs = function(a, b) {
      var ta = a[AC.TIMESTAMP] instanceof Date ? a[AC.TIMESTAMP].getTime() : 0;
      var tb = b[AC.TIMESTAMP] instanceof Date ? b[AC.TIMESTAMP].getTime() : 0;
      return ta - tb;
    };
    var newActive  = toRestore.concat(keep).sort(byTs);
    var newHistory = stillOld.concat(toArchive).sort(byTs);

    














































    
    




    if (!ensayo) {
      ensureArchiveWidth_(archive);
      ensureArchiveWidth_(history);
    }
    informe.archivoAnchoTras = ensayo ? Math.max(informe.archivoAncho, colCount) : archive.getMaxColumns();
    informe.histAnchoTras    = ensayo ? Math.max(informe.histAncho,    colCount) : history.getMaxColumns();
    if (informe.archivoAnchoTras !== informe.archivoAncho || informe.histAnchoTras !== informe.histAncho) {
      anotar((ensayo ? 'Would widen' : 'Widened') + ' the sheets to fit: archive ' +
             informe.archivoAncho + ' → ' + informe.archivoAnchoTras + ', history ' +
             informe.histAncho + ' → ' + informe.histAnchoTras + '.');
    }
    if (informe.archivoAnchoTras < colCount || informe.histAnchoTras < colCount) {
      var anchoMsg = 'ABORTED WITHOUT TOUCHING ANYTHING: the sheets cannot hold ' +
        colCount + ' columns (archive ' + informe.archivoAnchoTras +
        ', history ' + informe.histAnchoTras + ').';
      anotar('GUARD 1 (width) FAILS: ' + anchoMsg);
      informe.error = anchoMsg;
      if (ensayo) return { status: 'aborted', reason: 'width', informe: informe };
      logError_(ss, 'ERROR', 'backend', 'archiveOldMovements', 'system', anchoMsg, null, newRequestId_());
      avisarFalloDeArchivo_(ss, anchoMsg);
      return { status: 'aborted', reason: 'width', informe: informe };
    }

    












    var antes   = contarConDatos_(aData.slice(1)) + contarConDatos_(hData.slice(1));
    var despues = contarConDatos_(newActive) + contarConDatos_(newHistory);
    if (antes !== despues) {
      var cuadreMsg = 'ABORTED WITHOUT TOUCHING ANYTHING: the split does not add up. ' +
        antes + ' movements before, ' + despues + ' would come out.';
      anotar('GUARD 2 (count) FAILS: ' + cuadreMsg);
      informe.error = cuadreMsg;
      if (ensayo) return { status: 'aborted', reason: 'count', informe: informe };
      logError_(ss, 'ERROR', 'backend', 'archiveOldMovements', 'system', cuadreMsg, null, newRequestId_());
      avisarFalloDeArchivo_(ss, cuadreMsg);
      return { status: 'aborted', reason: 'count', informe: informe };
    }

    anotar('GUARD 1 (width) passes. GUARD 2 (count) passes: ' + antes +
           ' movement(s) in, ' + despues + ' out.');

    












    informe.quedariaEnArchivo  = contarConDatos_(newActive);
    informe.quedariaEnHistoria = contarConDatos_(newHistory);

    
    if (ensayo) {
      anotar('DRY RUN — stopping here. Nothing was written. The real job would ' +
             'now leave ' + informe.quedariaEnArchivo + ' movement(s) in the recent ' +
             'list and ' + informe.quedariaEnHistoria + ' in the archived history.');
      return { status: 'dry-run', informe: informe };
    }
    













    anotar('WRITE 1/2 → ' + history.getName() + ': ' + newHistory.length + ' row(s) × ' +
           colCount + ' col(s) into a sheet that is ' + history.getMaxColumns() + ' wide.');
    escribirHojaCompleta_(history, newHistory, colCount);
    anotar('WRITE 1/2 done.');
    anotar('WRITE 2/2 → ' + archive.getName() + ': ' + newActive.length + ' row(s) × ' +
           colCount + ' col(s) into a sheet that is ' + archive.getMaxColumns() + ' wide.');
    escribirHojaCompleta_(archive, newActive,  colCount);
    anotar('WRITE 2/2 done.');

    



    var quedanA = contarConDatos_(archive.getDataRange().getValues().slice(1));
    var quedanH = contarConDatos_(history.getDataRange().getValues().slice(1));

    



    informe.quedariaEnArchivo  = quedanA;
    informe.quedariaEnHistoria = quedanH;

    if (quedanA + quedanH !== antes) {
      

























      var perdidaMsg = 'The archive write lost rows. There were ' + antes +
        ' movements, only ' + (quedanA + quedanH) + ' could be read afterwards ' +
        '(recent ' + quedanA + ', archived ' + quedanH + ').';
      var reparado = false;
      try {
        escribirHojaCompleta_(archive, aData.slice(1), colCount);
        escribirHojaCompleta_(history, hData.slice(1), colCount);
        var trasA = contarConDatos_(archive.getDataRange().getValues().slice(1));
        var trasH = contarConDatos_(history.getDataRange().getValues().slice(1));
        reparado = (trasA + trasH === antes);
        perdidaMsg += reparado
          ? ' PUT BACK AUTOMATICALLY from memory — all ' + antes + ' are there again ' +
            '(recent ' + trasA + ', archived ' + trasH + '). Nothing was archived ' +
            'tonight; the job will try again. Nothing for you to do, but tell ' +
            'support so the cause gets found.'
          : ' COULD NOT BE PUT BACK — only ' + (trasA + trasH) + ' are readable now. ' +
            'STOP: do not add movements and do not rebuild anything. Restore ' +
            'MASTER_ARCHIVE_V3 and ARCHIVE_HISTORY from the 2am backup.';
      } catch (re) {
        perdidaMsg += ' PUTTING THEM BACK ALSO FAILED (' + re.message + '). STOP: ' +
          'do not add movements and do not rebuild anything. Restore ' +
          'MASTER_ARCHIVE_V3 and ARCHIVE_HISTORY from the 2am backup.';
      }
      logError_(ss, 'ERROR', 'backend', 'archiveOldMovements', 'system', perdidaMsg, null, newRequestId_());
      avisarFalloDeArchivo_(ss, perdidaMsg);
      
      return { status: reparado ? 'rolled-back' : 'lost', total: antes, informe: informe };
    }

    













    if (quedanA === 0 && antes > 0) {
      var vacioMsg = 'The recent movement list is now EMPTY — all ' + antes +
        ' movement(s) crossed the ' + cutoffMonths + '-month cutoff and moved to ' +
        'ARCHIVE_HISTORY. Nothing was lost: press "Load Older History" in the app ' +
        'to see them. If that is not what you expected, your archive cutoff in ' +
        'Settings is shorter than you think.';
      logError_(ss, 'WARN', 'backend', 'archiveOldMovements', 'system', vacioMsg, null, newRequestId_());
      avisarFalloDeArchivo_(ss, vacioMsg);
    }

    











    auditLog_(ss, 'ARCHIVE_RECONCILE', 'system',
      'v' + APP_VERSION + ' · cutoff=' + cutoffMonths + 'mo',
      toArchive.length + ' archived', toRestore.length + ' restored');
    return { status: 'success', archived: toArchive.length, restored: toRestore.length,
             total: antes, informe: informe };
  } catch (e) {
    


    informe.error = e.message;
    informe.stack = String(e.stack || '').split('\n').slice(0, 6).join(' | ');
    anotar('THREW: ' + e.message);
    if (ensayo) return { status: 'error', informe: informe };

    














    




    logError_(ss, 'ERROR', 'backend', 'archiveOldMovements', 'system', e.message, {
      version: APP_VERSION,      
      steps: informe.pasos.join('  →  ') || '(none)',
      stack: informe.stack,
      archiveWidth: informe.archivoAncho, historyWidth: informe.histAncho,
      modelWidth:   informe.modeloAncho
    }, newRequestId_());
    
    
    
    
    try { avisarFalloDeArchivo_(ss, 'The nightly archive job failed: ' + e.message); } catch (e2) {}
    throw e;
  } finally {
    lock.releaseLock();
  }
}








function contarConDatos_(filas) {
  var n = 0;
  for (var i = 0; i < (filas || []).length; i++) {
    var r = filas[i];
    if (r && (r[AC.CATEGORY] || r[AC.NAME])) n++;
  }
  return n;
}











function escribirHojaCompleta_(sheet, filas, colCount) {
  if (filas.length) {
    sheet.getRange(2, 1, filas.length, colCount).setValues(filas.map(textSafeRow_));
  }
  var primeraSobrante = filas.length + 2;
  var sobrantes = sheet.getMaxRows() - primeraSobrante + 1;
  if (sobrantes > 0) {
    sheet.getRange(primeraSobrante, 1, sobrantes, colCount).clearContent();
  }
}






function avisarFalloDeArchivo_(ss, mensaje) {
  
  if (basicApagado_()) return;
  try {
    auditLog_(ss, 'ARCHIVE_ALERT', 'system', mensaje, '', '');
  } catch (e) {}
  try {
    var cfg  = loadConfig();
    var para = (cfg && cfg.adminEmail) || Session.getEffectiveUser().getEmail();
    if (!para) return;
    MailApp.sendEmail(para,
      '⚠ ' + PRODUCT_NAME + ' — the nightly archive job needs attention',
      'The nightly archive job did not finish cleanly.\n\n' +
      mensaje + '\n\n' +
      'What to do:\n' +
      '1. Open your spreadsheet and check the MASTER_ARCHIVE_V3 tab.\n' +
      '2. If it is empty, the backup made at 2am has everything — it runs an ' +
      'hour before this job for exactly this reason.\n' +
      '3. Copy that tab back over, then rebuild the stock sheets.\n\n' +
      'Nothing else was changed.');
  } catch (e) {}
}

function archiveOldMovementsTrigger() {
  
  
  
  requireOwnerContext_();
  setVerifiedAuth_({ role: 'ADMIN', email: 'system@scheduled-trigger', name: 'Scheduled trigger' });
  


  try {
    auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'ARCHIVE_START', 'system',
              'nightly archive starting · v' + APP_VERSION, '', '');
  } catch (e) {}
  archiveOldMovements(SpreadsheetApp.getActiveSpreadsheet());
}



function ensureArchiveTrigger_() {
  
  if (basicApagado_()) return;
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'archiveOldMovementsTrigger') return;
  }
  ScriptApp.newTrigger('archiveOldMovementsTrigger').timeBased().everyDays(1).atHour(3).create();
}


















var BACKUP_RETENTION_DAYS = 30;    

function dailyBackupTrigger() {
  requireOwnerContext_();    
  setVerifiedAuth_({ role: 'ADMIN', email: 'system@scheduled-trigger', name: 'Scheduled trigger' });
  runBackupNow_();
}



function runBackupNow_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var folder   = getOrCreateFolder_(backupFolderName_());
    var stamp    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    var copyName = ss.getName() + ' — Backup ' + stamp;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    var snapProps = -1, snapErr = '';
    try {
      snapProps = writeConfigSnapshot_(ss);
    } catch (eSnap) {
      snapErr = eSnap.message || String(eSnap);
      Logger.log('config snapshot: ' + snapErr);
      logError_(ss, 'WARN', 'backend', 'writeConfigSnapshot', 'system',
        'Backup was created but its configuration snapshot was not: ' + snapErr +
        ' — restoring from this copy means re-entering the Script Properties by hand.',
        null, newRequestId_());
    }
    
    
    SpreadsheetApp.flush();

    
    
    
    
    
    
    
    var copyFile;
    try {
      try {
        copyFile = DriveApp.getFileById(ss.getId()).makeCopy(copyName, folder);
      } catch (eDrive) {
        var copied = ss.copy(copyName);             
        copyFile   = DriveApp.getFileById(copied.getId());
        copyFile.moveTo(folder);                    
      }
    } finally {
      
      
      
      
      try {
        var live = ss.getSheetByName(SHEETS.CONFIG_SNAPSHOT);
        if (live) ss.deleteSheet(live);
      } catch (eDel) { Logger.log('snapshot cleanup: ' + eDel.message); }
    }
    PropertiesService.getScriptProperties()
      .setProperty('LAST_BACKUP_SNAPSHOT', snapErr ? ('FAILED: ' + snapErr) : String(snapProps));

    pruneOldBackups_(folder);

    auditLog_(ss, 'BACKUP_CREATED', 'system', copyName, '', copyFile.getId());
    
    
    
    
    
    
    var p = PropertiesService.getScriptProperties();
    p.setProperty('LAST_BACKUP_AT', new Date().toISOString());
    p.setProperty('LAST_BACKUP_NAME', copyName);
    p.setProperty('LAST_BACKUP_FILE_ID', copyFile.getId());
    return { status: 'success', name: copyName, id: copyFile.getId() };
  } catch (e) {
    logError_(ss, 'ERROR', 'backend', 'runBackupNow', 'system', e.message, null, newRequestId_());
    
    
    
    try {
      var cfg = loadConfig();
      MailApp.sendEmail(adminNotifyEmail_(),
        '⚠ ' + PRODUCT_NAME + ' — Daily backup failed',
        'The automatic daily backup did not complete: ' + e.message +
        '\n\nCheck Settings → Error Log in the app, or the Executions log in the Apps Script editor.');
    } catch (e2) {   }
    throw e;
  }
}






var SNAPSHOT_EXCLUDE = {
  
  
  
  OAUTH_CLIENT_SECRET: 'Ours, not yours, and shared across installations — re-enter it by hand.',
  
  GEMINI_API_KEY: 'A paid key of yours — paste it back yourself.',
  
  SESSION_SECRET: 'Recreated automatically. Everyone signs in once more.',
  
  WMS_SESSIONS: 'Who was signed in at the time. Not worth restoring.',
  
  
  
  
  
  
  
  
  
  
  
  
  
  LAST_BACKUP_AT:       'The old file\'s backup history — not this copy\'s. Press Backup Now once restored.',
  LAST_BACKUP_NAME:     'Same.',
  LAST_BACKUP_FILE_ID:  'Same — and the link would point at the old file.',
  LAST_BACKUP_SNAPSHOT: 'Same.'
};






var SNAPSHOT_REPLACE_AFTER_DEPLOY = {
  WEB_APP_URL:        'REPLACE after Deploy → New deployment: paste the NEW /exec address, not this one.',
  OAUTH_REDIRECT_URI: 'REPLACE with the new /exec address, and register it in the OAuth client too.'
};






















function writeConfigSnapshot_(ss) {
  var props = PropertiesService.getScriptProperties().getProperties();

  
  
  
  
  
  
  
  var guide = {};
  try {
    for (var g = 0; g < PROPERTY_GUIDE.length; g++) guide[PROPERTY_GUIDE[g].key] = PROPERTY_GUIDE[g];
  } catch (eG) {   }

  function noteFor(key) {
    if (SNAPSHOT_REPLACE_AFTER_DEPLOY[key]) return '⚠ ' + SNAPSHOT_REPLACE_AFTER_DEPLOY[key];
    
    
    if (/^FOLDER_/.test(key) && !guide[key]) {
      return 'Drive folder id for attachments under that company name. Restore as-is.';
    }
    var g = guide[key];
    return g ? g.what : '';
  }

  var rows = [];
  Object.keys(props).sort().forEach(function (k) {
    if (SNAPSHOT_EXCLUDE[k]) return;
    rows.push([k, String(props[k]), noteFor(k)]);
  });

  var sheet = ss.getSheetByName(SHEETS.CONFIG_SNAPSHOT) || ss.insertSheet(SHEETS.CONFIG_SNAPSHOT);
  sheet.clear();

  var header = [
    ['ACOPIO — CONFIGURATION SNAPSHOT', 'Taken ' + new Date().toISOString(), ''],
    ['Restoring? Copy these into the new copy\'s Script Properties BEFORE anything else.', '', ''],
    ['FOLDER_PREFIX goes first — without it, attachments do not open.', '', ''],
    ['Anything marked ⚠ must NOT be copied as-is — read the note beside it.', '', ''],
    ['', '', ''],
    ['NOT included, on purpose — put these back by hand:', '', ''],
  ];
  Object.keys(SNAPSHOT_EXCLUDE).forEach(function (k) {
    header.push(['  ' + k, SNAPSHOT_EXCLUDE[k], '']);
  });
  header.push(['', '', '']);
  header.push(['PROPERTY', 'VALUE', 'WHAT IT IS']);

  var all = header.concat(rows.length ? rows : [['(nothing stored yet)', '', '']]);
  
  
  
  sheet.getRange(1, 1, all.length, 3).setValues(all.map(textSafeRow_));
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  sheet.getRange(header.length, 1, 1, 3).setFontWeight('bold');
  sheet.getRange(1, 3, all.length, 1).setWrap(true).setFontColor('#6B7280');
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 480);
  sheet.setColumnWidth(3, 520);
  return rows.length;
}

function pruneOldBackups_(folder) {
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BACKUP_RETENTION_DAYS);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    if (f.getDateCreated() < cutoff) f.setTrashed(true);
  }
}
















function backupEnabled_() {
  try {
    var t = ScriptApp.getProjectTriggers();
    for (var i = 0; i < t.length; i++) {
      if (t[i].getHandlerFunction() === 'dailyBackupTrigger') return true;
    }
  } catch (e) { Logger.log('backupEnabled_: ' + e.message); }
  return false;
}



















var SHEET_CELL_LIMIT = 10000000;

function getSpaceUsage(auth) {
  auth = requireAuth_('ADMIN');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var cellsUsed = 0, biggest = null;
  for (var i = 0; i < sheets.length; i++) {
    var c = sheets[i].getMaxRows() * sheets[i].getMaxColumns();
    cellsUsed += c;
    if (!biggest || c > biggest.cells) biggest = { name: sheets[i].getName(), cells: c };
  }

  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var history = ss.getSheetByName(SHEETS.ARCHIVE_HISTORY);
  var liveRows = archive ? Math.max(0, archive.getLastRow() - 1) : 0;
  var histRows = history ? Math.max(0, history.getLastRow() - 1) : 0;

  return {
    cellsUsed:  cellsUsed,
    cellLimit:  SHEET_CELL_LIMIT,
    pct:        Math.min(100, (cellsUsed / SHEET_CELL_LIMIT) * 100),
    tabs:       sheets.length,
    biggestTab: biggest,
    movements:  liveRows + histRows,
    estimate:   spaceEstimate_(archive, history, cellsUsed)
  };
}

















function spaceEstimate_(archive, history, cellsUsed) {
  var DAY = 86400000, now = Date.now();

  
  var oldest = null;
  [history, archive].forEach(function (sh) {
    if (oldest !== null || !sh || sh.getLastRow() < 2) return;
    var t = sh.getRange(2, AC.TIMESTAMP + 1).getValue();
    var d = t instanceof Date ? t.getTime() : Date.parse(t);
    if (!isNaN(d)) oldest = d;
  });
  if (oldest === null) return null;

  var daysOfUse = (now - oldest) / DAY;
  if (daysOfUse < 60) return { tooEarly: true, daysOfUse: Math.floor(daysOfUse) };

  
  
  if (!archive || archive.getLastRow() < 2) return null;
  var stamps = archive.getRange(2, AC.TIMESTAMP + 1, archive.getLastRow() - 1, 1).getValues();
  var recent = 0, previous = 0;
  for (var i = 0; i < stamps.length; i++) {
    var v = stamps[i][0];
    var ms = v instanceof Date ? v.getTime() : Date.parse(v);
    if (isNaN(ms)) continue;
    
    
    
    
    var age = (now - ms) / DAY;
    if (age < 90) recent++;
    else if (age < 180) previous++;
  }

  
  
  var window1 = Math.min(90, daysOfUse);
  var perDay  = recent / window1;
  if (perDay <= 0) return { idle: true, daysOfUse: Math.floor(daysOfUse) };

  var remaining = Math.max(0, SHEET_CELL_LIMIT - cellsUsed);
  var years = remaining / (perDay * AC_WIDTH * 365);

  
  
  
  
  
  
  
  
  var GROWTH_FLOOR = 15;
  var yearsIfGrowing = null, growthPct = null;
  if (daysOfUse >= 180 && previous > 0) {
    var prevPerDay = previous / 90;
    var rise = (perDay - prevPerDay) / prevPerDay;
    if (rise * 100 >= GROWTH_FLOOR) {
      growthPct = rise * 100;
      yearsIfGrowing = remaining / (perDay * (1 + rise) * AC_WIDTH * 365);
    }
  }

  return {
    perDay: perDay,
    years: years,
    yearsIfGrowing: yearsIfGrowing,
    growthPct: growthPct,
    daysOfUse: Math.floor(daysOfUse)
  };
}

function getBackupStatus(auth) {
  auth = requireAuth_('ADMIN');
  var p = PropertiesService.getScriptProperties();
  var lastAt   = p.getProperty('LAST_BACKUP_AT');
  var lastName = p.getProperty('LAST_BACKUP_NAME');
  var lastId   = p.getProperty('LAST_BACKUP_FILE_ID');
  
  
  
  
  
  if (!lastAt) {
    try {
      var found = _findMostRecentBackup_();
      if (found) {
        lastAt = found.date.toISOString();
        lastName = found.name;
        lastId = found.id;
        p.setProperty('LAST_BACKUP_AT', lastAt);
        p.setProperty('LAST_BACKUP_NAME', lastName);
        p.setProperty('LAST_BACKUP_FILE_ID', lastId);
      }
    } catch (e) { Logger.log('getBackupStatus backfill: ' + e.message); }
  }
  

























  var horasDesde = null;
  if (lastAt) {
    var t = new Date(lastAt).getTime();
    if (isFinite(t)) horasDesde = Math.floor((Date.now() - t) / 3600000);
  }

  return {
    enabled:          backupEnabled_(),
    retentionDays:    BACKUP_RETENTION_DAYS,
    folder:           backupFolderName_(),
    lastBackupAt:     lastAt || '',
    lastBackupName:   lastName || '',
    lastBackupFileId: lastId || '',
    hoursSinceBackup: horasDesde,
    
    
    
    backupStalled:    !!(backupEnabled_() && horasDesde !== null && horasDesde >= 36),
    
    
    backupNeverRan:   !!(backupEnabled_() && !lastAt),
    
    
    
    
    lastBackupSnapshot: p.getProperty('LAST_BACKUP_SNAPSHOT') || '',
    
    
    backups:          (function(){ try { return listBackups_(); } catch (e) { Logger.log('listBackups_: ' + e.message); return []; } })()
  };
}
















function listBackups_() {
  var folder = getOrCreateFolder_(backupFolderName_());
  var files  = folder.getFiles();
  var out    = [];
  
  
  
  while (files.hasNext() && out.length < 120) {
    var f = files.next();
    out.push({ id: f.getId(), name: f.getName(), at: f.getDateCreated().toISOString() });
  }
  out.sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
  return out;
}

function _findMostRecentBackup_() {
  var folder = getOrCreateFolder_(backupFolderName_());
  var files = folder.getFiles();
  var best = null;
  while (files.hasNext()) {
    var f = files.next();
    var created = f.getDateCreated();
    if (!best || created > best.date) best = { date: created, name: f.getName(), id: f.getId() };
  }
  return best;
}

function setBackupEnabled(data, auth) {
  
  basicNiega_('Automatic backup');
  auth = requireAuth_('ADMIN');
  var on = !!(data && data.enabled);
  if (on) {
    ensureBackupTrigger_();
  } else {
    try {
      ScriptApp.getProjectTriggers().forEach(function (t) {
        if (t.getHandlerFunction() === 'dailyBackupTrigger') ScriptApp.deleteTrigger(t);
      });
    } catch (e) { throw new Error('Could not change the schedule: ' + e.message); }
  }
  
  
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), on ? 'BACKUP_SCHEDULE_ON' : 'BACKUP_SCHEDULE_OFF',
    auth.email, 'Daily backup ' + (on ? 'enabled' : 'disabled'), '', '');
  return { status: 'success', enabled: backupEnabled_() };
}





function runBackupOnDemand(data, auth) {
  
  basicNiega_('Automatic backup');
  auth = requireAuth_('ADMIN');
  var res = runBackupNow_();
  return { status: 'success', name: res && res.name ? res.name : '' };
}

function ensureBackupTrigger_() {
  
  if (basicApagado_()) return;
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyBackupTrigger') return;
  }
  ScriptApp.newTrigger('dailyBackupTrigger').timeBased().everyDays(1).atHour(2).create();
}



























var CHECKIN_MILESTONE_DAYS = [3, 7];

function ensureCheckinTrigger_() {
  
  if (basicApagado_()) return;
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyCheckinTrigger') return;
  }
  
  
  ScriptApp.newTrigger('dailyCheckinTrigger').timeBased().everyDays(1).atHour(9).create();
}

function dailyCheckinTrigger() {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  try {
    requireOwnerContext_();
    runCheckin_();
  } catch (e) { Logger.log('dailyCheckinTrigger: ' + e.message); }
}

function runCheckin_() {
  
  if (basicApagado_()) return null;
  var p = PropertiesService.getScriptProperties();
  if (!companySettings_().setupComplete) return;       
  if (p.getProperty('CHECKIN_ALERTS_ENABLED') === 'false') return;

  
  
  
  var startedIso = p.getProperty('SETUP_COMPLETED_AT');
  if (!startedIso) {
    startedIso = new Date().toISOString();
    p.setProperty('SETUP_COMPLETED_AT', startedIso);
  }
  var daysSince = Math.floor((Date.now() - new Date(startedIso).getTime()) / 86400000);

  var sentRaw = p.getProperty('CHECKIN_MILESTONES_SENT') || '';
  var sent    = sentRaw.split(',').filter(function (s) { return s; });

  
  
  
  
  
  var due = CHECKIN_MILESTONE_DAYS.filter(function (d) {
    return daysSince >= d && sent.indexOf(String(d)) === -1;
  });
  if (!due.length) return;

  due.forEach(function (d) { sent.push(String(d)); });
  p.setProperty('CHECKIN_MILESTONES_SENT', sent.join(','));

  var support = String(p.getProperty('SUPPORT_EMAIL') || '').trim();
  if (!support) return;    

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var movementCount = archive ? Math.max(0, archive.getLastRow() - 1) : 0;
  if (movementCount > 0) return;    

  var milestone = due[due.length - 1];
  var cs      = companySettings_();
  var cfg     = loadConfig();
  var users   = ss.getSheetByName('USERS_V3');
  var userCount = users && users.getLastRow() > 1 ? users.getLastRow() - 1 : 0;
  

























  MailApp.sendEmail({
    to: support,
    subject: '👀 ' + (cs.name || 'A new install') + ' — nothing recorded ' + milestone + ' days in',
    htmlBody:
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' +
      '<p><b>' + escHtml_(cs.name || '(no company name set)') + '</b> finished setup ' + daysSince +
        ' days ago and has not recorded a single movement yet.</p>' +
      '<table cellpadding="6" style="border-collapse:collapse;font-size:13px">' +
        '<tr><td style="color:#666">Admin</td><td>' + escHtml_(cfg.adminEmail || '(not set)') + '</td></tr>' +
        '<tr><td style="color:#666">Users registered</td><td>' + userCount + '</td></tr>' +
        '<tr><td style="color:#666">Movements recorded</td><td>0</td></tr>' +
        '<tr><td style="color:#666">Days since setup</td><td>' + daysSince + '</td></tr>' +
      '</table>' +
      '<p style="font-size:13px">This is the moment to reach out — a short call in the first two weeks is ' +
        'the biggest thing that predicts whether an install turns into a renewal.</p>' +
      '<p style="font-size:12px;color:#666">This is a private check-in, sent only to you — the customer never ' +
        'sees it. To turn it off for this installation: Apps Script → Project Settings → Script Properties → ' +
        'CHECKIN_ALERTS_ENABLED = false</p></div>'
  });
}































var DAILY_REPORT_DEFAULT_HOUR = 20;    

function dailyReportSettings_() {
  var p = PropertiesService.getScriptProperties();
  var h = parseInt(p.getProperty('DAILY_REPORT_HOUR'), 10);
  return {
    enabled: p.getProperty('DAILY_REPORT_ENABLED') === 'true',
    
    
    
    hour:    (isFinite(h) && h >= 0 && h <= 23) ? h : DAILY_REPORT_DEFAULT_HOUR,
    owner:   String(p.getProperty('DAILY_REPORT_OWNER') || '').trim(),
    extra:   String(p.getProperty('DAILY_REPORT_TO')    || '').trim()
  };
}


function dailyReportRecipients_() {
  var s = dailyReportSettings_();
  var seen = {}, out = [];
  [s.owner].concat(s.extra.split(/[,;\s]+/)).forEach(function (e) {
    e = String(e || '').trim().toLowerCase();
    if (!e || e.indexOf('@') === -1 || seen[e]) return;
    seen[e] = true;
    out.push(e);
  });
  return out;
}









function ensureDailyReportTrigger_() {
  var cfg = dailyReportSettings_();
  var triggers = ScriptApp.getProjectTriggers();
  var found = null;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyReportTrigger') { found = triggers[i]; break; }
  }

  var p = PropertiesService.getScriptProperties();
  if (!cfg.enabled) {
    if (found) ScriptApp.deleteTrigger(found);
    p.deleteProperty('DAILY_REPORT_TRIGGER_HOUR');
    p.deleteProperty('DAILY_REPORT_MODE');
    return 'off';
  }

  









































  var MODO = 'cadahora/v1';
  if (found && p.getProperty('DAILY_REPORT_MODE') === MODO) return 'unchanged';

  if (found) ScriptApp.deleteTrigger(found);
  ScriptApp.newTrigger('dailyReportTrigger').timeBased().everyHours(1).create();
  p.setProperty('DAILY_REPORT_MODE', MODO);
  
  
  p.deleteProperty('DAILY_REPORT_TRIGGER_HOUR');
  return found ? 'rescheduled' : 'installed';
}



















function diaDelInforme_(hora, ahora, tz) {
  var d = new Date(ahora.getTime());
  if (hora < 12) d.setDate(d.getDate() - 1);
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}




function fechaUS_(ymd) {
  var p = String(ymd || '').split('-');
  return (p.length === 3) ? (p[1] + '/' + p[2] + '/' + p[0]) : String(ymd || '');
}








function dailyReportTrigger() {
  try {
    requireOwnerContext_();
    setVerifiedAuth_({ role: 'ADMIN', email: 'system@scheduled-trigger', name: 'Scheduled trigger' });
    
    
    runDailyReport_(true);
  } catch (e) {
    
    
    Logger.log('dailyReportTrigger: ' + e.message);
  }
}







function dailyReportMovements_(ss, dia) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive || archive.getLastRow() < 2) return [];
  var tz    = Session.getScriptTimeZone();
  var today = dia || Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var rows  = archive.getDataRange().getValues();
  var out   = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][AC.CATEGORY] && !rows[i][AC.NAME]) continue;
    var ts = rows[i][AC.TIMESTAMP];
    if (!(ts instanceof Date)) ts = new Date(ts);
    if (isNaN(ts.getTime())) continue;
    
    
    
    
    if (Utilities.formatDate(ts, tz, 'yyyy-MM-dd') !== today) continue;
    var m = parseArchiveRow(rows[i], i + 1);
    
    
    
    
    
    
    
    
    
    
    
    
    m.unitCost  = null;
    m.totalCost = null;
    out.push(m);
  }
  return out;
}




function runDailyReport_(programado) {
  
  if (basicApagado_()) return 'disabled';
  var cfg = dailyReportSettings_();
  if (!cfg.enabled) return 'disabled';

  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var tz  = Session.getScriptTimeZone();
  var p   = PropertiesService.getScriptProperties();
  var now = new Date();

  if (programado) {
    var horaAhora = parseInt(Utilities.formatDate(now, tz, 'H'), 10);
    if (horaAhora !== cfg.hour) return 'not-yet';

    



    var marca = Utilities.formatDate(now, tz, 'yyyy-MM-dd') + '@' + cfg.hour;
    if (p.getProperty('DAILY_REPORT_LAST') === marca) return 'already-sent';
    p.setProperty('DAILY_REPORT_LAST', marca);
  }

  var to = dailyReportRecipients_();
  if (!to.length) return 'no-recipients';    

  var dia  = diaDelInforme_(cfg.hour, now, tz);
  var movs = dailyReportMovements_(ss, dia);
  var cs   = companySettings_();
  var hoy  = fechaUS_(dia);

  var IN  = { ENTRY: 1, RETURN: 1 };
  var OUT = { EXIT: 1, WASTE: 1 };
  var llegaron = movs.filter(function (m) { return IN[m.moveType]; });
  var salieron = movs.filter(function (m) { return OUT[m.moveType]; });
  var internos = movs.filter(function (m) { return !IN[m.moveType] && !OUT[m.moveType]; });

  
  
  
  var nombres = userDirectory_(ss);

  var subject = cs.name
    ? (cs.name + ' — movements for ' + hoy)
    : ('Movements for ' + hoy);
  if (!movs.length) subject += ' (no movements)';

  MailApp.sendEmail({
    to: to.join(','),
    subject: subject,
    htmlBody: dailyReportHtml_(hoy, cs, llegaron, salieron, internos, cfg, nombres)
  });
  return 'sent';
}










































function dailyReportHtml_(hoy, cs, llegaron, salieron, internos, cfg, nombres) {
  nombres = nombres || {};

  


  function quienRegistro(m) {
    var mail = String(m.userEmail || '').trim();
    if (!mail) return '—';
    var nom = nombres[mail.toLowerCase()] || '';
    return nom
      ? '<b>' + escHtml_(nom) + '</b><br><span style="color:#888;font-size:11px">' +
        escHtml_(mail) + '</span>'
      : escHtml_(mail);
  }

  function tabla(titulo, etiquetaPersona, lista, color) {
    if (!lista.length) return '';
    var filas = lista.map(function (m) {
      var donde = m.moveType === 'ENTRY' || m.moveType === 'RETURN'
        ? (m.destLoc || '—') : (m.sourceLoc || '—');
      
      
      var quien = String(m.responsible || '').trim();
      return '<tr>' +
        '<td>' + escHtml_(m.name || '—') + '</td>' +
        '<td style="color:#666">' + escHtml_(m.category || '') + '</td>' +
        '<td align="right"><b>' + (Number(m.qty) || 0) + '</b> ' +
          escHtml_(m.unit || '') + '</td>' +
        '<td>' + escHtml_(donde) + '</td>' +
        '<td style="color:#666">' + (quien ? escHtml_(quien) : '—') + '</td>' +
        '<td style="color:#666">' + quienRegistro(m) + '</td>' +
      '</tr>';
    }).join('');
    return '<h3 style="margin:1.4rem 0 .4rem;color:' + color + '">' + titulo +
             ' <span style="color:#666;font-weight:400;font-size:13px">(' +
             lista.length + ' movement' + (lista.length === 1 ? '' : 's') +
             ')</span></h3>' +
           '<table cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%">' +
             '<tr style="background:#f5f5f5;text-align:left">' +
               '<th>Material</th><th>Category</th><th align="right">Qty</th>' +
               '<th>Location</th><th>' + etiquetaPersona + '</th><th>User</th></tr>' + filas +
           '</table>';
  }

  var cuerpo;
  if (!llegaron.length && !salieron.length && !internos.length) {
    
    
    
    cuerpo =
      '<p style="font-size:15px">No movements were recorded in the warehouse today.</p>' +
      '<p style="color:#666;font-size:13px">This report is sent on quiet days too, ' +
        'on purpose: that way a day with nothing in it cannot be mistaken for a ' +
        'report that never arrived.</p>';
  } else {
    cuerpo = tabla('Arrived at the warehouse', 'Received by', llegaron, '#046C4E') +
             tabla('Left the warehouse',       'Taken by',    salieron, '#B42318') +
             tabla('Moved inside the warehouse', 'Handled by', internos, '#1E52A0');
  }

  return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;max-width:720px">' +
    '<h2 style="margin:0 0 .2rem">' + escHtml_(cs.name || 'Warehouse') + '</h2>' +
    '<p style="margin:0 0 1rem;color:#666">Movements for ' + escHtml_(hoy) + '</p>' +
    cuerpo +
    '<p style="margin-top:1.6rem;font-size:12px;color:#666;border-top:1px solid #e5e7eb;' +
      'padding-top:.8rem">Automatic report from ' + escHtml_(PRODUCT_NAME) + '. ' +
      'An admin can change the time or turn it off in Settings.</p></div>';
}


function getDailyReportSettings(auth) {
  auth = requireAuth_('ADMIN');
  var cfg = dailyReportSettings_();
  return { enabled: cfg.enabled, hour: cfg.hour, owner: cfg.owner, extra: cfg.extra,
           recipients: dailyReportRecipients_() };
}


function saveDailyReportSettings(data, auth) {
  auth = requireAuth_('ADMIN');
  var p  = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var enabled = !!(data && data.enabled);
  var hour    = parseInt(data && data.hour, 10);
  if (!isFinite(hour) || hour < 0 || hour > 23) hour = DAILY_REPORT_DEFAULT_HOUR;

  p.setProperty('DAILY_REPORT_ENABLED', enabled ? 'true' : 'false');
  p.setProperty('DAILY_REPORT_HOUR', String(hour));
  p.setProperty('DAILY_REPORT_TO', String((data && data.extra) || '').trim());
  
  
  if (enabled && !String(p.getProperty('DAILY_REPORT_OWNER') || '').trim()) {
    p.setProperty('DAILY_REPORT_OWNER', auth.email);
  }

  var estado = ensureDailyReportTrigger_();
  auditLog_(ss, 'DAILY_REPORT', auth.email, 'settings',
    enabled ? ('on @' + hour + ':00') : 'off', estado);

  return { ok: true, state: estado, settings: getDailyReportSettings() };
}



function sendDailyReportNow(auth) {
  auth = requireAuth_('ADMIN');
  var cfg = dailyReportSettings_();
  if (!cfg.enabled) return { ok: false, message: 'The daily report is off. Turn it on first.' };
  var to = dailyReportRecipients_();
  if (!to.length) return { ok: false, message: 'Nobody would receive it — add at least one address.' };
  
  
  runDailyReport_();
  return { ok: true, message: 'Sent to ' + to.join(', ') };
}



























var OLDER_HISTORY_PAGE = 300;

function loadOlderHistory(auth, data) {
  auth = requireAuth_();    
  var seeCosts = canSeeCosts_(auth);
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var history = ensureArchiveHistorySheet_(ss);

  var ultima = history.getLastRow();
  var hay    = Math.max(0, ultima - 1);               
  var desde  = Math.max(0, Number(data && data.desde) || 0);
  if (desde >= hay) return { items: [], total: hay, quedan: 0 };

  var cuantas  = Math.min(OLDER_HISTORY_PAGE, hay - desde);
  
  var primera  = ultima - desde - cuantas + 1;
  var ancho    = Math.min(Math.max(history.getLastColumn(), AC_WIDTH), history.getMaxColumns());
  var filas    = history.getRange(primera, 1, cuantas, ancho).getValues();

  var out = [];
  for (var i = 0; i < filas.length; i++) {
    var row = filas[i];
    if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
    var m = parseArchiveRow(row, primera + i);
    m.archived = true;
    
    
    
    
    
    
    
    if (!seeCosts) { m.unitCost = null; m.totalCost = null; }
    out.push(m);
  }
  



  return { items: out, total: hay, quedan: Math.max(0, hay - desde - cuantas) };
}




function refreshDerivedSheets_(ss) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var live    = ss.getSheetByName(SHEETS.LIVE);
  var site    = ss.getSheetByName(SHEETS.SITE);
  if (!archive || !live || !site) return;
  var waste   = ensureWasteSheet_(ss);
  var history = ensureArchiveHistorySheet_(ss);

  var archiveData = archive.getDataRange().getValues();

  















  var historyData = (history && history.getLastRow() > 1)
    ? history.getDataRange().getValues()
    : [[]];
  var data  = archiveData.concat(historyData.slice(1));
  var stock = {};
  
  
  
  
  var matIdFixes = [];  

  























  var costFixes = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[AC.CATEGORY]) continue;
    var m   = parseArchiveRow(row, i + 1);
    
    
    
    
    
    
    
    
    
    
    var key = getMaterialId(m.category, m.name);

    if (row[AC.MAT_ID] !== key) {
      var isHistoryRow = i >= archiveData.length;
      
      
      
      
      
      
      
      matIdFixes.push({
        rowNum: isHistoryRow ? (i - archiveData.length + 2) : (i + 1),
        isHistory: isHistoryRow,
        correctMatId: key,
        wasMatId: String(row[AC.MAT_ID] || '(blank)'),
        what:  (m.category ? m.category + ' — ' : '') + (m.name || '(no name)'),
        qty:   m.qty,
        unit:  m.unit || '',
        where: m.destLoc || m.sourceLoc || '',
        when:  m.dateRec || '',
        kind:  m.moveType || ''
      });
    }

    
    var uc = row[AC.UNIT_COST], tc = row[AC.TOTAL_COST];
    var hayCoste = (uc !== '' && uc !== null && uc !== undefined && isFinite(Number(uc)));
    if (hayCoste) {
      var debeSer = round2_(Number(uc) * m.qty);
      var ahora   = (tc === '' || tc === null || tc === undefined) ? null : Number(tc);
      if (ahora === null || !isFinite(ahora) || Math.abs(ahora - debeSer) > 0.005) {
        var esHist = i >= archiveData.length;
        costFixes.push({
          rowNum: esHist ? (i - archiveData.length + 2) : (i + 1),
          isHistory: esHist,
          debeSer: debeSer,
          antes: (ahora === null ? '(blank)' : String(ahora)),
          what: (m.category ? m.category + ' — ' : '') + (m.name || '(no name)')
        });
      }
    }

    if (!stock[key]) stock[key] = { cat: m.category, name: m.name, project: m.project, unit: m.unit || 'UNIT', locs: {}, siteProjs: {}, wasted: 0 };
    var s   = stock[key];
    var qty = m.qty;

    
    
    
    
    
    
    
    
    
    
    var rackKey = function(r){ return String(r || '').toUpperCase().trim(); };

    if (m.moveType === 'ENTRY') {
      var rack = rackKey(m.destLoc || m.sourceLoc || 'UNASSIGNED');
      s.locs[rack] = (s.locs[rack] || 0) + qty;

    } else if (m.moveType === 'EXIT' || m.moveType === 'DISPATCH') {
      var sr = rackKey(m.sourceLoc || 'UNASSIGNED');
      s.locs[sr] = (s.locs[sr] || 0) - qty;
      var p = m.project || 'UNASSIGNED';
      s.siteProjs[p] = (s.siteProjs[p] || 0) + qty;

    } else if (m.moveType === 'TRANSFER') {
      if (m.sourceLoc) { var trSrc = rackKey(m.sourceLoc); s.locs[trSrc] = (s.locs[trSrc] || 0) - qty; }
      if (m.destLoc)   { var trDest = rackKey(m.destLoc);  s.locs[trDest] = (s.locs[trDest] || 0) + qty; }

    } else if (m.moveType === 'RETURN') {
      var retRack = rackKey(m.destLoc || 'UNASSIGNED');
      s.locs[retRack] = (s.locs[retRack] || 0) + qty;
      var p2 = m.project || 'UNKNOWN';
      if (s.siteProjs[p2]) s.siteProjs[p2] = Math.max(0, s.siteProjs[p2] - qty);

    } else if (m.moveType === 'WASTE') {
      var s2 = rackKey(m.sourceLoc || 'UNASSIGNED');
      s.locs[s2] = (s.locs[s2] || 0) - qty;
      s.wasted  += qty;

    } else if (m.moveType === 'ADJUST') {
      
      
      
      
      if (m.sourceLoc && !m.destLoc) {
        var aSrc = rackKey(m.sourceLoc);
        s.locs[aSrc] = (s.locs[aSrc] || 0) - qty;
      } else if (m.destLoc && !m.sourceLoc) {
        var aDst = rackKey(m.destLoc);
        s.locs[aDst] = (s.locs[aDst] || 0) + qty;
      }
    }
  }

  
  
  
  if (matIdFixes.length) {
    var archiveFixes = matIdFixes.filter(function(f){ return !f.isHistory; });
    var historyFixes = matIdFixes.filter(function(f){ return f.isHistory; });
    archiveFixes.forEach(function(f){ archive.getRange(f.rowNum, AC.MAT_ID + 1).setValue(textCell_(f.correctMatId)); });
    historyFixes.forEach(function(f){ history.getRange(f.rowNum, AC.MAT_ID + 1).setValue(textCell_(f.correctMatId)); });
    
    
    
    auditLog_(ss, 'AUTO_REPAIR_MATID', 'system',
      describeMatIdFixes_(matIdFixes),
      'rows ' + matIdFixes.map(function (f) { return f.rowNum; }).join(','),
      'was ' + matIdFixes[0].wasMatId + ' → now ' + matIdFixes[0].correctMatId);
  }

  


  if (costFixes.length) {
    costFixes.forEach(function (f) {
      var hoja = f.isHistory ? history : archive;
      hoja.getRange(f.rowNum, AC.TOTAL_COST + 1).setValue(f.debeSer);
    });
    var ej = costFixes[0];
    





    var enArchivo = costFixes.filter(function (f) { return !f.isHistory; })
                             .map(function (f) { return f.rowNum; });
    var enHist    = costFixes.filter(function (f) { return f.isHistory; })
                             .map(function (f) { return f.rowNum; });
    var donde = [];
    if (enArchivo.length) donde.push('rows ' + enArchivo.join(','));
    if (enHist.length)    donde.push('archive-history rows ' + enHist.join(','));
    auditLog_(ss, 'AUTO_REPAIR_TOTAL_COST', 'system',
      costFixes.length + ' row' + (costFixes.length === 1 ? '' : 's') +
      ' had a Total Cost that was not Qty × Unit Cost — recalculated. First: ' + ej.what,
      donde.join(' · '),
      'was ' + ej.antes + ' → now ' + ej.debeSer);
  }

  




  
  





























  var liveRows = [['Category','Name','Project','Location','Qty','Unit']];
  for (var k in stock) {
    if (!stock.hasOwnProperty(k)) continue;
    var item = stock[k];
    for (var loc in item.locs) {
      if (!item.locs.hasOwnProperty(loc)) continue;
      var q = item.locs[loc];
      if (q > 0) liveRows.push([item.cat, item.name, item.project, loc, q, item.unit]);
    }
  }
  live.clearContents();
  
  
  
  
  
  if (liveRows.length > 0) live.getRange(1, 1, liveRows.length, 6).setValues(liveRows.map(textSafeRow_));

  var siteRows = [['Category','Name','Project','Qty','Unit']];
  for (var k2 in stock) {
    if (!stock.hasOwnProperty(k2)) continue;
    var item2 = stock[k2];
    for (var sp in item2.siteProjs) {
      if (!item2.siteProjs.hasOwnProperty(sp)) continue;
      var sq = item2.siteProjs[sp];
      if (sq > 0) siteRows.push([item2.cat, item2.name, sp, sq, item2.unit]);
    }
  }
  site.clearContents();
  if (siteRows.length > 0) site.getRange(1, 1, siteRows.length, 5).setValues(siteRows.map(textSafeRow_));

  
  
  
  
  var wasteRows = [['Category','Name','Qty','Unit']];
  for (var k3 in stock) {
    if (!stock.hasOwnProperty(k3)) continue;
    var item3 = stock[k3];
    if (item3.wasted > 0) wasteRows.push([item3.cat, item3.name, item3.wasted, item3.unit]);
  }
  waste.clearContents();
  if (wasteRows.length > 0) waste.getRange(1, 1, wasteRows.length, 4).setValues(wasteRows.map(textSafeRow_));
}






































function ensurePmDirectorySheet_(ss) {
  var sheet = ss.getSheetByName('PM_DIRECTORY');
  if (!sheet) {
    sheet = ss.insertSheet('PM_DIRECTORY');
    sheet.appendRow(['Name', 'Email']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  return sheet;
}

function getPmDirectory() {
  requireAuth_();    
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensurePmDirectorySheet_(ss);
  var rows  = sheet.getDataRange().getValues();
  var out   = [];
  for (var i = 1; i < rows.length; i++) {
    var name = String(rows[i][0] || '').trim();
    var email = String(rows[i][1] || '').trim();
    if (name && email) out.push({ name: name, email: email });
  }
  return out;
}


function managePmDirectory(data, auth) {
  auth = requireAuth_('ADMIN');    
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensurePmDirectorySheet_(ss);
  var rows  = sheet.getDataRange().getValues();
  var name  = String(data.name  || '').trim();
  var email = String(data.email || '').trim();

  if (data.op === 'add') {
    if (!name)  throw new Error('PM name is required.');
    if (!email || email.indexOf('@') === -1) throw new Error('A valid email is required.');
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim().toUpperCase() === name.toUpperCase()) {
        throw new Error('"' + name + '" is already in the PM directory.');
      }
    }
    sheet.appendRow([textCell_(name), textCell_(email)]);
  } else if (data.op === 'rename') {
    var oldName = String(data.oldName || '').trim();
    if (!oldName) throw new Error('Current PM name is required.');
    var found = false;
    for (var j = 1; j < rows.length; j++) {
      if (String(rows[j][0] || '').trim().toUpperCase() === oldName.toUpperCase()) {
        sheet.getRange(j + 1, 1, 1, 2).setValues([[textCell_(name || oldName), textCell_(email || rows[j][1])]]);
        found = true;
        break;
      }
    }
    if (!found) throw new Error('"' + oldName + '" not found in PM directory.');
  } else if (data.op === 'delete') {
    if (!name) throw new Error('PM name is required.');
    var delFound = false;
    for (var k = 1; k < rows.length; k++) {
      if (String(rows[k][0] || '').trim().toUpperCase() === name.toUpperCase()) {
        sheet.deleteRow(k + 1);
        delFound = true;
        break;
      }
    }
    if (!delFound) throw new Error('"' + name + '" not found in PM directory.');
  } else {
    throw new Error('Unknown managePmDirectory op: ' + data.op);
  }

  auditLog_(ss, 'MANAGE_PM_DIRECTORY', auth.email, data.op, name, email);
  return { status: 'success' };
}






function sendPmGroupedEmails_(rows, auth) {
  
  if (basicApagado_()) return null;
  var byPm = {};  
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var pm = String(r.pm || '').trim();
    if (!pm) continue;
    var key = pm.toUpperCase();
    if (!byPm[key]) byPm[key] = { displayName: pm, items: [] };
    byPm[key].items.push({ name: r.name, qty: r.qty, unit: r.unit || 'UNIT' });
  }
  var pmNames = Object.keys(byPm);
  if (!pmNames.length) return null;

  var directory = getPmDirectory();
  var emailByName = {};
  directory.forEach(function(d) { emailByName[d.name.toUpperCase()] = d.email; });

  var unmatched = [];
  var sent = 0;
  pmNames.forEach(function(key) {
    var group = byPm[key];
    var email = emailByName[key];
    if (!email) { unmatched.push(group.displayName); return; }
    var lines = group.items.map(function(it){ return '  • ' + it.qty + ' ' + it.unit + '(s) of ' + it.name; }).join('\n');
    var body = 'Hi ' + group.displayName + ',\n\nThe following materials were received today for your project(s):\n\n' +
      lines + '\n\nLet us know if you need anything.\n\n' + (companySettings_().name || 'Warehouse') + ' — Warehouse Team';
    try {
      MailApp.sendEmail(email,
        'Materials Received' + (group.items.length > 1 ? ' (' + group.items.length + ' items)' : ''),
        body, { name: (companySettings_().name || 'Warehouse') + ' — ' + PRODUCT_NAME, replyTo: auth.email });
      sent++;
    } catch (e) {
      unmatched.push(group.displayName + ' (send failed: ' + e.message + ')');
    }
  });

  if (!unmatched.length) return null;
  return 'No PM Directory match for: ' + unmatched.join(', ') + '. Add them in Settings → PM Directory.';
}

function ensureMaterialLocksSheet_(ss) {
  var sheet = ss.getSheetByName('MATERIAL_LOCKS');
  if (!sheet) {
    sheet = ss.insertSheet('MATERIAL_LOCKS');
    sheet.appendRow(['ID','MatId','Category','Name','Rack','AllowedDestinations','Reason','LockedBy','LockedAt','Status','UnlockedBy','UnlockedAt']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  return sheet;
}







function cacheGet_(key, ttlSec, builderFn) {
  var cache  = CacheService.getScriptCache();
  var cached = cache.get(key);
  if (cached !== null) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  var value = builderFn();
  try { cache.put(key, JSON.stringify(value), ttlSec); } catch (e) {}  
  return value;
}

function getMaterialLocks() {
  requireAuth_();    
  return cacheGet_('materialLocksV1', 300, getMaterialLocksUncached_);
}

function getMaterialLocksUncached_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MATERIAL_LOCKS');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var out  = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][9] || '').toUpperCase() !== 'ACTIVE') continue;
    var destRaw = String(rows[i][5] || '').trim();
    out.push({
      id:           String(rows[i][0] || ''),
      matId:        String(rows[i][1] || ''),
      category:     String(rows[i][2] || ''),
      name:         String(rows[i][3] || ''),
      rack:         String(rows[i][4] || ''),
      
      
      allowedDest:  destRaw ? destRaw.split(',').map(function(s){ return normalizeString(s); }).filter(Boolean) : [],
      reason:       String(rows[i][6] || ''),
      lockedBy:     String(rows[i][7] || ''),
      lockedAt:     rows[i][8] instanceof Date
        ? Utilities.formatDate(rows[i][8], Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm')
        : String(rows[i][8] || '')
    });
  }
  return out;
}



function getActiveLocksMap_(ss) {
  














  if (basicApagado_()) return {};
  var sheet = ss.getSheetByName('MATERIAL_LOCKS');
  var map = {};
  if (!sheet) return map;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][9] || '').toUpperCase() !== 'ACTIVE') continue;
    var matId = String(rows[i][1] || '').trim();
    var rack  = normalizeString(rows[i][4] || '');
    if (!matId || !rack) continue;
    var destRaw = String(rows[i][5] || '').trim();
    map[matId + '|||' + rack] = {
      allowedDest: destRaw ? destRaw.split(',').map(function(s){ return normalizeString(s); }).filter(Boolean) : [],
      reason:      String(rows[i][6] || ''),
      lockedBy:    String(rows[i][7] || '')
    };
  }
  return map;
}



function enforceMaterialLock_(locksMap, mt, matId, srcKey, destKey) {
  if (!srcKey) return;
  var lock = locksMap[matId + '|||' + srcKey];
  if (!lock) return;
  
  
  
  
  
  
  if (mt === 'EXIT' || mt === 'WASTE' || mt === 'ADJUST') {
    throw new Error('RESERVED: This material is reserved at ' + srcKey + ' — ' + lock.reason +
      ' (by ' + lock.lockedBy + '). Cannot ' + mt + '. Ask an admin to release it first.');
  }
  if (mt === 'TRANSFER' && lock.allowedDest.length) {
    if (!destKey || lock.allowedDest.indexOf(destKey) === -1) {
      throw new Error('RESERVED: Material at ' + srcKey + ' can only be transferred to: ' +
        lock.allowedDest.join(', ') + ' — ' + lock.reason);
    }
  }
}



function lockMaterial(data, auth) {
  auth = requireAuth_('ADMIN');    
  var cat  = normalizeString(data.category);
  var name = normalizeString(data.name);
  var rack = String(data.rack || '').trim().toUpperCase();
  var reason = String(data.reason || '').trim();
  if (!cat || !name) throw new Error('Category and name are required.');
  if (!rack) throw new Error('Rack is required.');
  if (!reason) throw new Error('A reason is required to reserve a material.');

  var matId = getMaterialId(cat, name);
  
  
  
  
  var allowedDest = Array.isArray(data.allowedDestinations)
    ? data.allowedDestinations.map(function(s){ return normalizeString(s); }).filter(Boolean)
    : String(data.allowedDestinations || '').split(',').map(function(s){ return normalizeString(s); }).filter(Boolean);

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureMaterialLocksSheet_(ss);
  var rows  = sheet.getDataRange().getValues();
  var now   = new Date();
  var rackKey = normalizeString(rack);

  var nowStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][9] || '').toUpperCase() !== 'ACTIVE') continue;
    if (String(rows[i][1] || '') === matId && normalizeString(rows[i][4] || '') === rackKey) {
      sheet.getRange(i + 1, 6, 1, 4).setValues([[textCell_(allowedDest.join(', ')), textCell_(reason), auth.email, now]]);
      auditLog_(ss, 'UPDATE_LOCK', auth.email, data.name + ' @ ' + rack, '', reason);
      CacheService.getScriptCache().remove('materialLocksV1');
      return { status: 'success', lock: { id: String(rows[i][0]), matId: matId, category: data.category, name: data.name, rack: rack, allowedDest: allowedDest, reason: reason, lockedBy: auth.email, lockedAt: nowStr } };
    }
  }

  var id = 'LOCK-' + new Date().getTime();
  sheet.appendRow([id, textCell_(matId), textCell_(data.category), textCell_(data.name), textCell_(rack), textCell_(allowedDest.join(', ')), textCell_(reason), auth.email, now, 'Active', '', '']);
  auditLog_(ss, 'LOCK_MATERIAL', auth.email, data.name + ' @ ' + rack, '', reason);
  CacheService.getScriptCache().remove('materialLocksV1');
  return { status: 'success', lock: { id: id, matId: matId, category: data.category, name: data.name, rack: rack, allowedDest: allowedDest, reason: reason, lockedBy: auth.email, lockedAt: nowStr } };
}


















function candadosDespues_() {
  try { return getMaterialLocks(); } catch (e) { Logger.log('candadosDespues_: ' + e.message); return null; }
}

function unlockMaterial(data, auth) {
  auth = requireAuth_('ADMIN');    
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MATERIAL_LOCKS');
  if (!sheet) throw new Error('No reservations exist.');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id) && String(rows[i][9] || '').toUpperCase() === 'ACTIVE') {
      sheet.getRange(i + 1, 10, 1, 3).setValues([['Removed', auth.email, new Date()]]);
      auditLog_(ss, 'UNLOCK_MATERIAL', auth.email, String(rows[i][3]) + ' @ ' + String(rows[i][4]), '', '');
      CacheService.getScriptCache().remove('materialLocksV1');
      return { status: 'success', locksAfter: candadosDespues_() };
    }
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var quien = '', cuando = '';
  for (var j = 1; j < rows.length; j++) {
    if (String(rows[j][0]) === String(data.id)) {
      quien  = String(rows[j][10] || '').trim();
      cuando = rows[j][11] ? new Date(rows[j][11]).toISOString() : '';
      break;
    }
  }
  return { status: 'success', alreadyGone: true, locksAfter: candadosDespues_(),
           unlockedBy: quien, unlockedAt: cuando,
           
           unlockedByYou: !!quien && quien.toLowerCase() === String(auth.email || '').toLowerCase() };
}

















function unlockMaterials(data, auth) {
  auth = requireAuth_('ADMIN');    
  var ids = Array.isArray(data.ids) ? data.ids.map(String).filter(Boolean) : [];
  if (!ids.length) throw new Error('No reservations were selected.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MATERIAL_LOCKS');
  if (!sheet) return { status: 'success', released: 0, alreadyGone: ids.length, locksAfter: [] };

  var pedidas = {};
  ids.forEach(function(id){ pedidas[id] = true; });

  var rows = sheet.getDataRange().getValues();
  var ahora = new Date(), soltadas = 0;
  for (var i = 1; i < rows.length; i++) {
    if (!pedidas[String(rows[i][0])]) continue;
    if (String(rows[i][9] || '').toUpperCase() !== 'ACTIVE') continue;
    sheet.getRange(i + 1, 10, 1, 3).setValues([['Removed', auth.email, ahora]]);
    auditLog_(ss, 'UNLOCK_MATERIAL', auth.email,
              String(rows[i][3]) + ' @ ' + String(rows[i][4]), '', '');
    soltadas++;
  }
  if (soltadas) CacheService.getScriptCache().remove('materialLocksV1');

  




  var porTi = 0, porOtros = 0;
  if (ids.length - soltadas > 0) {
    var yo = String(auth.email || '').toLowerCase();
    for (var k = 1; k < rows.length; k++) {
      if (!pedidas[String(rows[k][0])]) continue;
      if (String(rows[k][9] || '').toUpperCase() === 'ACTIVE') continue;   
      var q = String(rows[k][10] || '').trim().toLowerCase();
      if (q && q === yo) porTi++; else porOtros++;
    }
  }
  return { status: 'success', released: soltadas,
           alreadyGone: ids.length - soltadas, locksAfter: candadosDespues_(),
           yaSoltadasPorTi: porTi, yaSoltadasPorOtros: porOtros };
}


function updateDocument_(ss, archive, data, auth) {
  var hasDocGroups = data.docGroups && data.docGroups.length > 0;
  var hasFiles     = data.files     && data.files.length     > 0;
  
  
  
  
  
  var hasKeepLinks = Array.isArray(data.keepLinks);
  if (!hasDocGroups && !hasFiles && !hasKeepLinks) throw new Error('No documents provided.');

  
  var matName = 'attachment';
  if (data.rowIdx) {
    try {
      var rv = archive.getRange(data.rowIdx, AC.CATEGORY + 1, 1, 2).getValues()[0];
      matName = String(rv[1] || 'attachment').trim() || 'attachment';
      
      
      if (data.expectedCategory !== undefined || data.expectedName !== undefined) {
        var curCat2  = String(rv[0] || '').trim().toUpperCase();
        var curName2 = String(rv[1] || '').trim().toUpperCase();
        var expCat2  = String(data.expectedCategory || '').trim().toUpperCase();
        var expName2 = String(data.expectedName     || '').trim().toUpperCase();
        if (curCat2 !== expCat2 || curName2 !== expName2) {
          throw new Error('This row has changed (data was reorganized). Please refresh and try again.');
        }
      }
    } catch(e) { if (/reorganized/.test(e.message)) throw e; }
  }

  var links = '';
  if (hasDocGroups) links = uploadDocGroups_(data.docGroups, matName);           
  else if (hasFiles) links = uploadFiles_(data.files, matName, 'row-' + data.rowIdx);  

  
  
  
  
  
  
  
  
  
  
  
  var finalText = null;
  if (data.rowIdx && (links || hasKeepLinks)) {
    if (hasKeepLinks) {
      finalText = data.keepLinks.concat(links ? [links] : []).join('\n');
    } else {
      var existing = archive.getRange(data.rowIdx, AC.DOC_LINKS + 1).getValue();
      finalText = existing ? existing + '\n' + links : links;
    }
    var docLinksCell = archive.getRange(data.rowIdx, AC.DOC_LINKS + 1);
    if (finalText) docLinksCell.setRichTextValue(richTextForDocLinks_(finalText));
    else docLinksCell.setValue('');  
  }
  
  
  
  return { status: 'success', docLinks: finalText };
}







function ensureRackPhotosSheet_(ss) {
  var sheet = ss.getSheetByName('RACK_PHOTOS');
  if (!sheet) {
    sheet = ss.insertSheet('RACK_PHOTOS');
    sheet.appendRow(['Location', 'PhotoURL', 'UploadedBy', 'UploadedAt']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  return sheet;
}


function getRackPhotos() {
  requireAuth_();    
  return cacheGet_('rackPhotosV1', 300, getRackPhotosUncached_);
}

function getRackPhotosUncached_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('RACK_PHOTOS');
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var out  = {};
  for (var i = 1; i < rows.length; i++) {
    var loc = String(rows[i][0] || '').trim().toUpperCase();
    var url = String(rows[i][1] || '').trim();
    if (!loc || !url) continue;
    out[loc] = {
      url:        url,
      uploadedBy: String(rows[i][2] || ''),
      uploadedAt: rows[i][3] instanceof Date
        ? Utilities.formatDate(rows[i][3], Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm')
        : String(rows[i][3] || '')
    };
  }
  return out;
}



function uploadRackPhoto(data, auth) {
  
  basicNiega_('Rack photos');
  
  
  auth = requireAuth_('WRITE');
  var loc = String((data && data.location) || '').trim().toUpperCase();
  if (!loc) throw new Error('Location is required.');
  if (!data.fileData) throw new Error('No photo provided.');

  var safe   = loc.replace(/[\/\\?%*:|"<>]/g, '_');
  var folder = getOrCreateFolder_(docsFolderName_() + '/RackPhotos/' + safe);
  var bytes  = Utilities.base64Decode(data.fileData);
  var blob   = Utilities.newBlob(bytes, data.fileMimeType || 'image/jpeg', safe + '.jpg');
  var file   = folder.createFile(blob);
  
  
  
  
  var url = file.getId();

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureRackPhotosSheet_(ss);
  var rows  = sheet.getDataRange().getValues();
  var now   = new Date();
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toUpperCase() === loc) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[textCell_(loc), url, auth.email, now]]);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([textCell_(loc), url, auth.email, now]);

  auditLog_(ss, 'UPLOAD_RACK_PHOTO', auth.email, loc, '', url);
  CacheService.getScriptCache().remove('rackPhotosV1');

  return {
    status:  'success',
    location: loc,
    photo: {
      url:        url,
      uploadedBy: auth.email,
      uploadedAt: Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm')
    }
  };
}













function richTextForDocLinks_(text) {
  var builder = SpreadsheetApp.newRichTextValue().setText(text);
  var lines   = text.split('\n');
  var offset  = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var sepIdx = line.indexOf('||');
    var url = sepIdx !== -1 ? line.substring(sepIdx + 2) : line;
    var urlStart = sepIdx !== -1 ? offset + sepIdx + 2 : offset;
    if (url.indexOf('http') === 0 && url.length > 0) {
      builder.setLinkUrl(urlStart, urlStart + url.length, url);
    }
    offset += line.length + 1;  
  }
  return builder.build();
}

function uploadFiles_(files, materialName, po) {
  
  var safe   = (materialName || 'General').replace(/[\/\\?%*:|"<>]/g, '_');
  var folder = getOrCreateFolder_(docsFolderName_() + '/' + safe);
  var links  = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (!f || !f.fileData) continue;
    var mimeType = f.fileMimeType || 'application/octet-stream';
    var fileName = f.fileName     || ('attachment_' + (i + 1));
    var bytes = Utilities.base64Decode(f.fileData);
    var blob  = Utilities.newBlob(bytes, mimeType, fileName);
    var file  = folder.createFile(blob);
    
    
    links.push(file.getId());
  }
  return links.join('\n');
}





function checkDuplicateMovement_(archive, mt, cat, name, qty, userEmail) {
  var WINDOW_MS = 3 * 60 * 1000;  
  var MAX_ROWS  = 40;              

  var lastRow = archive.getLastRow();
  if (lastRow < 2) return null;    

  var startRow = Math.max(2, lastRow - MAX_ROWS + 1);
  var numRows  = lastRow - startRow + 1;

  
  
  var tsCol    = AC.TIMESTAMP   + 1;   
  var catCol   = AC.CATEGORY    + 1;   
  var nameCol  = AC.NAME        + 1;   
  var qtyCol   = AC.QTY         + 1;   
  var emailCol = AC.USER_EMAIL  + 1;   
  var mtCol    = AC.MOVETYPE    + 1;   

  
  var allCols = archive.getRange(startRow, 1, numRows, 19).getValues();
  var now = new Date().getTime();

  for (var i = allCols.length - 1; i >= 0; i--) {
    var row = allCols[i];
    var rowTs = row[AC.TIMESTAMP];
    if (!(rowTs instanceof Date)) continue;

    var ageMs = now - rowTs.getTime();
    if (ageMs > WINDOW_MS) break;  

    var rowMt    = String(row[AC.MOVETYPE]   || '').toUpperCase().trim();
    var rowCat   = normalizeString(row[AC.CATEGORY]);    
    var rowName  = normalizeString(row[AC.NAME]);        
    var rowQty   = Number(row[AC.QTY]        || 0);
    var rowEmail = String(row[AC.USER_EMAIL] || '').toLowerCase().trim();

    if (rowMt    === mt.toUpperCase()        &&
        rowCat   === cat                     &&
        rowName  === name                    &&
        rowQty   === qty                     &&
        rowEmail === (userEmail || '').toLowerCase()) {
      return {
        rowIdx:     startRow + i,
        minutesAgo: Math.round(ageMs / 60000 * 10) / 10   
      };
    }
  }
  return null;
}













function importDriveFileIntoFolder_(fileId, docName, folder) {
  var auth = requireAuth_('WRITE');
  var id = String(fileId || '').trim();
  if (!id) return null;

  var file;
  try {
    file = DriveApp.getFileById(id);
  } catch (e) {
    throw new Error('That Drive file could not be opened. Check the link, or that it is shared with ' +
      (Session.getEffectiveUser().getEmail() || 'this system') + '.');
  }

  
  
  
  var dsize = 0;
  try { dsize = file.getSize(); } catch (e) {}
  if (dsize > MAX_ATTACH_BYTES) {
    throw new Error('“' + file.getName() + '” is ' + (dsize / 1048576).toFixed(1) + ' MB. Files over ' +
      (MAX_ATTACH_BYTES / 1048576) + ' MB cannot be opened inside the app, so they cannot be attached. ' +
      'Link to it from the comments instead, or attach a smaller version.');
  }

  if (!callerCanReadDriveFile_(file, id, auth.email)) {
    logError_(SpreadsheetApp.getActiveSpreadsheet(), 'WARN', 'backend', 'importDriveFileIntoFolder_',
      auth.email, 'Attempted to attach a Drive file they cannot access: ' + id, null, newRequestId_());
    throw new Error('You do not have access to that file in Drive, so it cannot be attached. ' +
      'Ask whoever owns it to share it with you, or upload the file directly.');
  }

  var copy = file.makeCopy(docName || file.getName(), folder);
  return copy.getId();
}








function callerCanReadDriveFile_(file, fileId, email) {
  var who = String(email || '').toLowerCase().trim();
  if (!who) return false;

  try {
    var owner = file.getOwner();
    if (owner && String(owner.getEmail() || '').toLowerCase() === who) return true;
  } catch (e) {}

  try {
    var res = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) +
        '/permissions?fields=permissions(type,role,emailAddress,domain)&supportsAllDrives=true',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return false;

    var perms = (JSON.parse(res.getContentText()).permissions) || [];
    var callerDomain = who.split('@')[1] || '';
    for (var i = 0; i < perms.length; i++) {
      var p = perms[i];
      if (p.type === 'anyone') return true;
      if (p.type === 'domain' && callerDomain && String(p.domain || '').toLowerCase() === callerDomain) return true;
      if (String(p.emailAddress || '').toLowerCase() === who) return true;
    }
  } catch (e) {}
  return false;
}








function uploadDocGroups_(docGroups, materialName) {
  var safe   = (materialName || 'General').replace(/[\/\\?%*:|"<>]/g, '_');
  var folder = getOrCreateFolder_(docsFolderName_() + '/' + safe);
  var links  = [];

  for (var i = 0; i < docGroups.length; i++) {
    var group  = docGroups[i];
    var photos = group.photos || [];
    var driveIds = group.driveIds || [];
    if (!photos.length && !driveIds.length) continue;

    var rawName  = (group.name || ('Document ' + (i + 1))).trim();
    var safeName = rawName.replace(/[\/\\?%*:|"<>]/g, '_');
    var url;

    
    
    
    
    
    for (var d = 0; d < driveIds.length; d++) {
      var copiedId = importDriveFileIntoFolder_(
        driveIds[d], safeName + (driveIds.length > 1 ? ' ' + (d + 1) : ''), folder);
      if (copiedId) links.push(rawName + '||' + copiedId);
    }
    if (!photos.length) continue;

    
    
    
    
    
    
    var images = [], others = [];
    photos.forEach(function (p) {
      var mt = String(p.fileMimeType || '');
      (mt.indexOf('image/') === 0 ? images : others).push(p);
    });

    others.forEach(function (p, k) {
      var oname = safeName + (others.length > 1 ? ' ' + (k + 1) : '');
      var ofile = folder.createFile(
        Utilities.newBlob(Utilities.base64Decode(p.fileData),
          p.fileMimeType || 'application/octet-stream', oname));
      links.push(rawName + '||' + ofile.getId());
    });

    if (!images.length) continue;

    if (images.length === 1) {
      
      var p    = images[0];
      var bytes = Utilities.base64Decode(p.fileData);
      var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg', safeName);
      var imgFile = folder.createFile(blob);
      
      url = imgFile.getId();
    } else {
      
      url = photosToDocPdf_(images, safeName, folder);
    }

    if (url) links.push(rawName + '||' + url);
  }
  return links.join('\n');
}



function photosToDocPdf_(photos, docName, targetFolder) {
  
  basicNiega_('Document upload');
  
  var tempTitle = 'WMS_TMP_' + new Date().getTime();
  var doc  = DocumentApp.create(tempTitle);
  var body = doc.getBody();

  
  
  
  
  
  body.setMarginTop(0);
  body.setMarginBottom(0);
  body.setMarginLeft(0);
  body.setMarginRight(0);

  
  
  var PAGE_W = 612;
  var PAGE_H = 792;

  
  body.clear();

  for (var i = 0; i < photos.length; i++) {
    if (i > 0) body.appendPageBreak();

    var p     = photos[i];
    var bytes = Utilities.base64Decode(p.fileData);
    var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg');
    var img   = body.appendImage(blob);

    
    var origW = img.getWidth();
    var origH = img.getHeight();

    
    var scale = Math.min(PAGE_W / origW, PAGE_H / origH);
    img.setWidth(Math.round(origW * scale));
    img.setHeight(Math.round(origH * scale));

    
    
    
    try {
      var para = img.getParent().asParagraph();
      para.setSpacingBefore(0);
      para.setSpacingAfter(0);
      para.setLineSpacing(1);
      para.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    } catch(e) {   }
  }

  doc.saveAndClose();

  
  var docFile = DriveApp.getFileById(doc.getId());
  var pdfBlob = docFile.getAs('application/pdf');
  pdfBlob.setName(docName + '.pdf');

  
  var pdfFile = targetFolder.createFile(pdfBlob);
  

  
  docFile.setTrashed(true);

  return pdfFile.getId();
}

















function getOrCreateFolder_(path) {
  var props = PropertiesService.getScriptProperties();
  var parts = path.split('/');
  var current = null;
  var walked = [];

  for (var i = 0; i < parts.length; i++) {
    walked.push(parts[i]);
    var cacheKey = 'FOLDER_' + walked.join('/').replace(/\W/g, '_');
    var cachedId = props.getProperty(cacheKey);

    var next = null;
    if (cachedId) {
      try { next = DriveApp.getFolderById(cachedId); } catch (e) { next = null;   }
    }

    if (!next) {
      if (current) {
        
        
        var found = current.getFoldersByName(parts[i]);
        next = found.hasNext() ? found.next() : current.createFolder(parts[i]);
      } else {
        
        
        
        
        next = DriveApp.createFolder(parts[i]);
        
        
        ensureUnderMaster_(next);
      }
      try { props.setProperty(cacheKey, next.getId()); } catch (e) {}
    }
    current = next;
  }
  return current;
}


function adminAction_(ss, data, auth) {
  var action = data.action;
  if (action === 'updateTruck')   return updateTruck_(ss, data);
  if (action === 'addUser')       return addUser_(ss, data);
  if (action === 'removeUser')    return removeUser_(ss, data);
  if (action === 'reconcile')     return runReconciliation_(ss);
  if (action === 'updateMinStock')return updateMinStock_(ss, data);
  if (action === 'movementIdStatus')   return movementIdStatus_(ss);
  if (action === 'backfillMovementIds')return backfillMovementIds_(ss, auth);
  throw new Error('Unknown admin action.');
}




function movementIdStatus_(ss) {
  var withId = 0, without = 0;
  [SHEETS.ARCHIVE, SHEETS.ARCHIVE_HISTORY].forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var last = sheet.getLastRow();
    if (last < 2) return;
    var count = last - 1;
    
    
    
    var narrow = sheet.getMaxColumns() < AC_WIDTH;
    var ids    = narrow ? null : sheet.getRange(2, AC.MOV_ID + 1, count, 1).getValues();
    var cats   = sheet.getRange(2, AC.CATEGORY + 1, count, 1).getValues();
    var names  = sheet.getRange(2, AC.NAME + 1,     count, 1).getValues();
    for (var i = 0; i < count; i++) {
      if (!String(cats[i][0] || '').trim() && !String(names[i][0] || '').trim()) continue;
      if (ids && String(ids[i][0] || '').trim()) withId++; else without++;
    }
  });
  return { status: 'success', withId: withId, without: without, total: withId + without };
}

function updateTruck_(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][8] || '') === data.truckName) {
      cfg.getRange(i + 1, 10).setValue(textCell_(data.assignedPerson || ''));
      cfg.getRange(i + 1, 11).setValue(textCell_(data.status || 'ACTIVE'));
      return { status: 'success' };
    }
  }
  cfg.appendRow(['','','','','','','','',textCell_(data.truckName), textCell_(data.assignedPerson || ''), textCell_(data.status || 'ACTIVE'),'','']);
  return { status: 'success', message: 'Truck added.' };
}

function addUser_(ss, data) {
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  cfg.appendRow(['','','','','',textCell_(data.email), textCell_(data.role),'','','','','','']);
  return { status: 'success' };
}




































function limpiarUsuarioDeConfig_(ss, email) {
  var buscado = String(email || '').toLowerCase().trim();
  if (!buscado) return false;
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) return false;
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][5] || '').toLowerCase().trim() === buscado) {
      
      cfg.getRange(i + 1, 6, 1, 2).setValues([['', '']]);
      return true;
    }
  }
  return false;
}

function removeUser_(ss, data) {
  if (limpiarUsuarioDeConfig_(ss, data.email)) return { status: 'success' };
  throw new Error('User not found.');
}

function updateMinStock_(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][11] || '').toUpperCase() === data.category.toUpperCase()) {
      cfg.getRange(i + 1, 13).setValue(Number(data.qty) || 0);
      return { status: 'success' };
    }
  }
  cfg.appendRow(['','','','','','','','','','','',textCell_(data.category), Number(data.qty) || 0]);
  return { status: 'success' };
}






function updateMinStockBulk(data, auth) {
  auth = requireAuth_('ADMIN');    
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('Config sheet not found.');
  var updates = Array.isArray(data.updates) ? data.updates : [];
  if (!updates.length) return { status: 'success', updated: 0 };

  var rows = cfg.getDataRange().getValues();
  var rowByName = {};
  for (var i = 1; i < rows.length; i++) {
    var nm = String(rows[i][11] || '').toUpperCase().trim();
    if (nm) rowByName[nm] = i + 1;  
  }

  var appended = [];
  updates.forEach(function(u){
    var nm  = String(u.name || '').toUpperCase().trim();
    var qty = Number(u.qty) || 0;
    if (!nm) return;
    if (rowByName[nm] !== undefined) {
      cfg.getRange(rowByName[nm], 13).setValue(qty);
    } else {
      appended.push(['','','','','','','','','','','', textCell_(nm), qty]);
    }
  });
  if (appended.length) {
    cfg.getRange(cfg.getLastRow() + 1, 1, appended.length, 13).setValues(appended);
  }
  auditLog_(ss, 'UPDATE_MIN_STOCK_BULK', auth.email, updates.length + ' material(s)', '', '');
  return { status: 'success', updated: updates.length };
}













function saveAvgCostUpdates_(ss, touched, avgCostMap) {
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) return;
  var matIds = Object.keys(touched);
  if (!matIds.length) return;

  var rows = cfg.getDataRange().getValues();
  var rowByMatId = {};
  for (var i = 1; i < rows.length; i++) {
    var rCat = String(rows[i][14] || '').trim();
    var rNm  = String(rows[i][15] || '').trim();
    if (rCat || rNm) rowByMatId[getMaterialId(rCat, rNm)] = i + 1;    
  }

  var appended = [];
  matIds.forEach(function (mid) {
    var c = avgCostMap[mid];
    if (!c) return;
    if (rowByMatId[mid] !== undefined) {
      cfg.getRange(rowByMatId[mid], 17).setValue(c.avg);    
    } else {
      
      
      
      
      appended.push(new Array(14).fill('').concat([textCell_(c.category), textCell_(c.name), c.avg]));
    }
  });
  if (appended.length) {
    cfg.getRange(cfg.getLastRow() + 1, 1, appended.length, 17).setValues(appended);
  }
}








































function excelToSheets_(base64Data, fileName) {
  var token    = ScriptApp.getOAuthToken();
  var bytes    = Utilities.base64Decode(base64Data);
  var boundary = '----acopioImport' + Date.now();
  var metadata = { name: 'Acopio import (temporary) — ' + fileName,
                   mimeType: 'application/vnd.google-apps.spreadsheet' };

  var head = '--' + boundary + '\r\n' +
             'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
             JSON.stringify(metadata) + '\r\n' +
             '--' + boundary + '\r\n' +
             'Content-Type: application/octet-stream\r\n\r\n';
  var tail = '\r\n--' + boundary + '--';
  var payload = Utilities.newBlob(head).getBytes()
                  .concat(bytes)
                  .concat(Utilities.newBlob(tail).getBytes());

  var up = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
      method: 'post',
      contentType: 'multipart/related; boundary=' + boundary,
      payload: payload,
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
  if (up.getResponseCode() !== 200) {
    throw new Error('Could not read that Excel file. If it is password-protected or an old .xls, ' +
      'open it in Excel and use File → Save As → CSV, then upload that instead.');
  }

  var tempId = JSON.parse(up.getContentText()).id;
  try {
    var auth = { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true };

    
    var zip = UrlFetchApp.fetch(
      'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(tempId) + '/export?format=zip', auth);
    if (zip.getResponseCode() === 200) {
      try {
        var parts = Utilities.unzip(zip.getBlob().setContentType('application/zip'));
        var sheets = parts.filter(function (b) { return /\.csv$/i.test(b.getName() || ''); })
          .map(function (b) {
            var n = String(b.getName() || '').replace(/\.csv$/i, '');
            var dash = n.indexOf(' - ');             
            return { name: dash !== -1 ? n.substring(dash + 3) : n, text: b.getDataAsString() };
          });
        if (sheets.length) return sheets;
      } catch (e) {
        
        
      }
    }

    var exp = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(tempId) + '/export?mimeType=text/csv', auth);
    if (exp.getResponseCode() !== 200) {
      throw new Error('Could not read the contents of that Excel file.');
    }
    return [{ name: 'Sheet1', text: exp.getContentText() }];
  } finally {
    
    
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e) {}
  }
}





function chooseImportSheet_(sheets, wanted) {
  if (wanted) {
    for (var i = 0; i < sheets.length; i++) if (sheets[i].name === wanted) return sheets[i];
  }
  for (var j = 0; j < sheets.length; j++) {
    var head;
    try { head = Utilities.parseCsv(String(sheets[j].text || '').replace(/^﻿/, ''))[0] || []; }
    catch (e) { continue; }
    var lower = head.map(function (h) { return String(h || '').trim().toLowerCase(); });
    var hasAll = IMPORT_REQUIRED_HEADERS.every(function (h) { return lower.indexOf(h) !== -1; });
    if (hasAll) return sheets[j];
  }
  return sheets[0];
}







var MAX_ATTACH_BYTES = 25 * 1024 * 1024;    





















function numeroDeFichero_(v) {
  var t = String(v == null ? '' : v).trim();
  if (!t) return NaN;
  



  if (/^-?\d{1,3}([,\u00A0\u202F\u2009' ]\d{3})+(\.\d+)?$/.test(t)) {
    t = t.replace(/[,\u00A0\u202F\u2009' ]/g, '');
  }
  return Number(t);
}

var IMPORT_REQUIRED_HEADERS = ['category', 'name', 'qty'];
var IMPORT_ALL_HEADERS      = ['category', 'name', 'qty', 'unit', 'location', 'project', 'supplier', 'po', 'comments'];










function leerFilasDelFichero_(data) {
  var fileName = String(data.fileName || '');
  var isExcel  = /\.xlsx?$/i.test(fileName);
  if (!isExcel && !/\.csv$/i.test(fileName)) {
    throw new Error('Please upload a .csv or .xlsx file.');
  }
  









  if (isExcel && basicApagado_()) {
    throw new Error(
      'Acopio Basic reads .csv files. Open your Excel file and use ' +
      'File \u2192 Download \u2192 Comma-separated values (.csv) \u2014 in Excel, ' +
      'Save As \u2192 CSV \u2014 and bring that one; everything else works the same. ' +
      'Reading .xlsx directly needs a Google permission this edition does not ask ' +
      'for, which is what lets it install without the warning screen. ' +
      'Acopio Pro reads .xlsx straight.');
  }

  var text;
  var sheetNames = [];    
  var usedSheet  = '';
  if (isExcel) {
    
    
    
    var sheets = excelToSheets_(data.fileData, fileName);
    sheetNames = sheets.map(function (s) { return s.name; });
    var chosen = chooseImportSheet_(sheets, String(data.sheetName || '').trim());
    usedSheet  = chosen.name;
    text       = chosen.text;
  } else {
    var bytes = Utilities.base64Decode(data.fileData);
    text = Utilities.newBlob(bytes, 'text/csv').getDataAsString();
  }

  
  
  
  
  
  text = text.replace(/^﻿/, '');

  
  
  
  
  
  var rawLineCount = text.split(/\r\n|\r|\n/).filter(function (l) { return l.trim() !== ''; }).length;

  var rows;
  try {
    rows = Utilities.parseCsv(text);
  } catch (e) {
    throw new Error('Could not read this as a CSV file: ' + e.message);
  }

  
  
  
  
  
  
  
  if (rows.length && rows[0].length === 1 && String(rows[0][0]).indexOf(';') !== -1) {
    rows = Utilities.parseCsv(text, ';');
  }

  if (!rows.length) throw new Error('The file appears to be empty.');

  var header = rows[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var col    = {};
  IMPORT_ALL_HEADERS.forEach(function (h) { col[h] = header.indexOf(h); });

  var missing = IMPORT_REQUIRED_HEADERS.filter(function (h) { return col[h] === -1; });
  if (missing.length) {
    throw new Error('Missing required column header(s) on ' +
      (usedSheet ? 'sheet "' + usedSheet + '"' : 'this file') + ': ' + missing.join(', ') + '.' +
      
      
      
      (sheetNames.length > 1
        ? ' This workbook also has: ' + sheetNames.filter(function (n) { return n !== usedSheet; }).join(', ') +
          ' — pick the right one from the Sheet list on this screen.'
        : ' Download the template from this screen to see the exact format expected.'));
  }

  var parsed = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r || r.every(function (c) { return String(c || '').trim() === ''; })) continue;   

    var item = {
      rowNum:   i + 1,
      category: String(r[col.category] || '').trim(),
      name:     String(r[col.name]     || '').trim(),
      qty:      numeroDeFichero_(r[col.qty]),
      unit:     col.unit     !== -1 ? (String(r[col.unit]     || '').trim() || 'UNIT') : 'UNIT',
      location: col.location !== -1 ?  String(r[col.location] || '').trim() : '',
      project:  col.project  !== -1 ?  String(r[col.project]  || '').trim() : '',
      supplier: col.supplier !== -1 ?  String(r[col.supplier] || '').trim() : '',
      po:       col.po       !== -1 ?  String(r[col.po]       || '').trim() : '',
      comments: col.comments !== -1 ?  String(r[col.comments] || '').trim() : ''
    };

    var errors = [];
    if (!item.category) errors.push('Missing Category');
    if (!item.name)     errors.push('Missing Name');
    if (!item.qty || item.qty <= 0 || isNaN(item.qty)) errors.push('Qty must be a number greater than 0');
    item.valid  = errors.length === 0;
    item.errors = errors;
    parsed.push(item);
  }

  if (!parsed.length) throw new Error('No data rows found below the header row.');

  return { parsed: parsed, col: col, rawLineCount: rawLineCount,
           sheetNames: sheetNames, usedSheet: usedSheet };
}

function parseImportFile(data) {
  requireAuth_('ADMIN');
  var leido      = leerFilasDelFichero_(data);
  var parsed     = leido.parsed;
  var col        = leido.col;
  var sheetNames = leido.sheetNames;
  var usedSheet  = leido.usedSheet;
  var rawLineCount = leido.rawLineCount;

  var validCount = parsed.filter(function (p) { return p.valid; }).length;
  var resumen    = resumenDeImportacion_(parsed);
  return {
    status:       'success',
    totalRows:    parsed.length,
    validRows:    validCount,
    invalidRows:  parsed.length - validCount,
    rawLineCount: rawLineCount,
    sheetNames:   sheetNames,             
    usedSheet:    usedSheet,

    














    rows:         parsed.slice(0, IMPORT_PREVIEW_ROWS),
    previewRows:  IMPORT_PREVIEW_ROWS,

    
    
    
    columns:      IMPORT_ALL_HEADERS.filter(function (h) { return col[h] !== -1; }),

    
    
    
    fingerprint:  resumen.huella,
    unitsTotal:   resumen.unidades,

    
    
    willCreate:   loQueCrearia_(parsed),

    
    alreadyImported: importacionConHuella_(resumen.huella)
  };
}



var IMPORT_PREVIEW_ROWS = 200;




























function resumenDeImportacion_(parsed) {
  var unidades = 0;
  var trozos = [];
  for (var i = 0; i < parsed.length; i++) {
    var p = parsed[i];
    if (!p.valid) continue;
    unidades += Number(p.qty) || 0;
    trozos.push(normalizeString(p.category) + '|' + normalizeString(p.name) + '|' +
                p.qty + '|' + normalizeString(p.location || ''));
  }
  

  trozos.sort();
  return {
    unidades: unidades,
    huella: parsed.length + '-' + Math.round(unidades * 100) + '-' +
            hash32_(trozos.join('\n'))
  };
}






function hash32_(texto) {
  var h = 5381;
  for (var i = 0; i < texto.length; i++) {
    h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}





function loQueCrearia_(parsed) {
  var cfg      = loadConfig();
  var ubicYa   = {}; (cfg.locations   || []).forEach(function (l) { ubicYa[normalizeString(l.name)] = 1; });
  var catYa    = {}; (cfg.categories  || []).forEach(function (c) { catYa[normalizeString(c)]       = 1; });
  var projYa   = {}; (cfg.projects    || []).forEach(function (p) { projYa[normalizeString(p)]      = 1; });
  var supYa    = {}; (cfg.suppliers   || []).forEach(function (s) { supYa[normalizeString(s)]       = 1; });

  var ubic = {}, cat = {}, proj = {}, sup = {};
  parsed.forEach(function (p) {
    if (!p.valid) return;
    var u = String(p.location || '').trim();
    if (u && !ubicYa[normalizeString(u)]) ubic[u] = 1;
    var c = String(p.category || '').trim();
    if (c && !catYa[normalizeString(c)]) cat[c] = 1;
    var j = String(p.project || '').trim();
    if (j && !projYa[normalizeString(j)]) proj[j] = 1;
    var s = String(p.supplier || '').trim();
    if (s && !supYa[normalizeString(s)]) sup[s] = 1;
  });
  
  
  function lista(o) { return Object.keys(o).sort().slice(0, 40); }
  return {
    locations:  lista(ubic),  locationsTotal:  Object.keys(ubic).length,
    categories: lista(cat),   categoriesTotal: Object.keys(cat).length,
    projects:   lista(proj),  projectsTotal:   Object.keys(proj).length,
    suppliers:  lista(sup),   suppliersTotal:  Object.keys(sup).length
  };
}






















function commitImport(data, auth) {
  auth = requireAuth_('ADMIN');    

  if (!data || !data.fileData) {
    throw new Error('No file to import. Pick the file again on this screen.');
  }

  var saltar = {};
  (Array.isArray(data.skipRowNums) ? data.skipRowNums : []).forEach(function (n) {
    saltar[Number(n)] = 1;
  });

  var todas = leerFilasDelFichero_(data).parsed;
  var rows  = todas.filter(function (r) { return r.valid && !saltar[r.rowNum]; });
  if (!rows.length) throw new Error('No rows to import.');

  
  
  
  
  var unidadesEsperadas = rows.reduce(function (a, r) { return a + (Number(r.qty) || 0); }, 0);

  
















  var importId = 'IMP-' + Utilities.getUuid().substring(0, 8).toUpperCase();

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var tzDate  = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var movements = rows.map(function (r) {
    return {
      moveType:    'ENTRY',
      category:    r.category,
      name:        r.name,
      project:     r.project || '',
      isGeneric:   !r.project,
      qty:         r.qty,
      unit:        r.unit || 'UNIT',
      dateRec:     tzDate,
      sourceLoc:   '',
      destLoc:     r.location || '',
      supplier:    r.supplier || '',
      po:          r.po || '',
      comments:    ('Imported from file ' + importId +
                    (r.comments ? ' — ' + r.comments : '')).trim(),
      





      importId:    importId,
      
      
      responsible: '',
      
      
      
      
      
      
      
      
      forceSubmit: true
    };
  });

  var res = addMovementsBatch_(ss, archive, movements, auth, { crearUbicaciones: true });
  



  





  var catCreadas = res.categoriasCreadas || [];
  if (catCreadas.length) {
    try {
      var cfgSheet2 = ss.getSheetByName(SHEETS.CONFIG);
      var catYa = (loadConfig().categories || []);
      writeConfigColumn_(cfgSheet2, 1, catYa.concat(catCreadas));
      auditLog_(ss, 'CATEGORIES_CREATED', auth.email,
        catCreadas.length + ' category(ies) came in with an import: ' +
        catCreadas.join(', '), '', '');
    } catch (eCat) {
      logError_(ss, 'WARN', 'backend', 'commitImport/categories', auth.email,
        'Could not record the imported categories: ' + (eCat && eCat.message), null, '');
    }
  }

  var creadas = res.ubicacionesCreadas || [];
  if (creadas.length) {
    try {
      var cfgSheet = ss.getSheetByName(SHEETS.CONFIG);
      var yaHay = (loadConfig().locations || []).map(function (l) { return l.name; });
      writeConfigColumns_(cfgSheet, 3, [yaHay.concat(creadas),
        (loadConfig().locations || []).map(function (l) { return l.type || 'RACK'; })
          .concat(creadas.map(function () { return 'RACK'; }))]);
      auditLog_(ss, 'LOCATIONS_CREATED', auth.email,
        creadas.length + ' location(s) came in with an import: ' + creadas.join(', '), '', '');
    } catch (eLoc) {
      logError_(ss, 'WARN', 'backend', 'commitImport/locations', auth.email,
        'Could not record the imported locations: ' + (eLoc && eLoc.message), null, '');
    }
  }
  













  var unidadesEscritas = 0;
  movements.forEach(function (m) { unidadesEscritas += Number(m.qty) || 0; });
  var cuadra = (res.rowCount === rows.length) &&
               (Math.abs(unidadesEscritas - unidadesEsperadas) < 0.005);

  if (!cuadra) {
    logError_(ss, 'ERROR', 'backend', 'commitImport', auth.email,
      'An import did not balance: expected ' + rows.length + ' row(s) / ' +
      unidadesEsperadas + ' unit(s), wrote ' + res.rowCount + ' row(s) / ' +
      unidadesEscritas + ' unit(s). Import ' + importId + '.',
      { importId: importId }, newRequestId_());
  }

  




  auditLog_(ss, 'BULK_IMPORT', auth.email,
    res.rowCount + ' row(s) imported · ' + unidadesEscritas + ' unit(s)' +
    (data.fileName ? ' · ' + String(data.fileName) : ''),
    importId, String(data.fingerprint || resumenDeImportacion_(todas).huella));

  return { status: 'success', rowCount: res.rowCount, newLocations: creadas,
           newCategories: catCreadas,
           importId: importId,
           balanced: cuadra,
           rowsExpected: rows.length, unitsExpected: unidadesEsperadas,
           unitsWritten: unidadesEscritas };
}









var IMPORTS_A_MIRAR = 400;    

function importacionesRecientes_(ss, cuantas) {
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var n     = Math.min(last - 1, IMPORTS_A_MIRAR);
  var desde = last - n + 1;
  var filas = sheet.getRange(desde, 1, n, 6).getValues();
  var out = [];
  for (var i = filas.length - 1; i >= 0; i--) {
    if (String(filas[i][1] || '') !== 'BULK_IMPORT') continue;
    out.push({
      when:        filas[i][0] instanceof Date ? filas[i][0].toISOString() : String(filas[i][0]),
      who:         String(filas[i][2] || ''),
      details:     String(filas[i][3] || ''),
      importId:    String(filas[i][4] || ''),
      fingerprint: String(filas[i][5] || '')
    });
    if (cuantas && out.length >= cuantas) break;
  }
  return out;
}







function importacionConHuella_(huella) {
  if (!huella) return null;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ya = importacionesRecientes_(ss, 0);
    for (var i = 0; i < ya.length; i++) {
      if (ya[i].fingerprint && ya[i].fingerprint === huella) return ya[i];
    }
  } catch (e) {
    
    
    Logger.log('importacionConHuella_: ' + e.message);
  }
  return null;
}

function listImports(auth) {
  requireAuth_('ADMIN');
  return importacionesRecientes_(SpreadsheetApp.getActiveSpreadsheet(), 12);
}

































































function borrarFilasEnTanda_(ss, auth, seLleva, tope, vaALaPapelera) {
  var trash = ensureTrashSheet_(ss);
  var ahora = new Date();
  var movidas = 0, quedanPor = 0, descartadas = 0;
  











  var idsMovidos = [];

  [{ sh: ss.getSheetByName(SHEETS.ARCHIVE),  nombre: SHEETS.ARCHIVE },
   { sh: ensureArchiveHistorySheet_(ss),     nombre: SHEETS.ARCHIVE_HISTORY }]
  .forEach(function (par) {
    var sheet = par.sh;
    if (!sheet || sheet.getLastRow() < 2) return;

    



















    ensureArchiveWidth_(sheet);

    var filas = sheet.getRange(2, 1, sheet.getLastRow() - 1, AC_WIDTH).getValues();
    var quedan = [], aPapelera = [], enEstaHoja = 0;
    filas.forEach(function (f) {
      
      if (!f[AC.CATEGORY] && !f[AC.NAME]) return;
      if (!seLleva(f)) { quedan.push(f); return; }
      



      if (tope && movidas + enEstaHoja >= tope) { quedan.push(f); quedanPor++; return; }
      enEstaHoja++;
      var idf = String(f[AC.MOV_ID] || '').trim();
      if (idf) idsMovidos.push(idf);

      














      if (typeof vaALaPapelera === 'function' && !vaALaPapelera(f)) {
        descartadas++;
        return;                        
      }
      var guardada = f.slice();
      guardada[TR.DELETED_AT] = ahora;
      guardada[TR.DELETED_BY] = auth.email;
      guardada[TR.FROM_SHEET] = par.nombre;
      aPapelera.push(guardada);
    });

    if (!enEstaHoja) return;

    



    if (aPapelera.length) {
      trash.getRange(trash.getLastRow() + 1, 1, aPapelera.length, TRASH_WIDTH)
           .setValues(aPapelera.map(textSafeRow_));
    }
    escribirHojaCompleta_(sheet, quedan, AC_WIDTH);
    movidas += enEstaHoja;
  });

  return { movidas: movidas, quedanPor: quedanPor, ids: idsMovidos,
           
           
           descartadas: descartadas };
}

















var MAX_BORRADO_POR_TANDA = 300;

















function esDeLaImportacion_(fila, importId) {
  var id = String(importId || '').trim();
  if (!id || !fila) return false;
  if (String(fila[AC.IMPORT_ID] || '').trim() === id) return true;
  
  return String(fila[AC.COMMENTS] || '').indexOf('Imported from file ' + id) === 0;
}




















function movimientosEditados_(ss) {
  var out = {};
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return out;
  var last = sheet.getLastRow();
  if (last < 2) return out;

  
  
  var filas = sheet.getRange(2, 2, last - 1, 3).getValues();
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i][0] || '').trim() !== 'MODIFY_MOVEMENT') continue;
    var det = String(filas[i][2] || '').trim();
    
    
    if (!det || det.indexOf('Row ') === 0) continue;
    var id = det.split(/[\s|]/)[0].trim();
    if (id) out[id] = true;
  }
  return out;
}

function undoImport(data, auth) {
  auth = requireAuth_('ADMIN');
  var importId = String((data && data.importId) || '').trim();
  if (!importId) throw new Error('Which import?');

  return withStockLock_(function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    












    var editados = movimientosEditados_(ss);

    var res = borrarFilasEnTanda_(ss, auth, function (f) {
      return esDeLaImportacion_(f, importId);
    }, MAX_BORRADO_POR_TANDA, function (f) {
      return !!editados[String(f[AC.MOV_ID] || '').trim()];
    });

    if (!res.movidas) {
      throw new Error('Nothing left from that import — it may have been undone already.');
    }

    var aLaPapelera = res.movidas - res.descartadas;

    
    
    
    
    refreshDerivedSheets_(ss);
    


    auditLog_(ss, 'IMPORT_UNDONE', auth.email,
      res.movidas + ' row(s) from import ' + importId + ' removed — ' +
      res.descartadas + ' discarded (the file is the copy), ' +
      aLaPapelera + ' kept in the trash (edited since importing)',
      importId, '');

    return { status: 'success', removed: res.movidas, importId: importId,
             
             
             discarded: res.descartadas,
             trashed:   aLaPapelera,
             
             
             
             more: res.quedanPor > 0 };
  });
}
















function deleteMovements(data, auth) {
  auth = requireAuth_('WRITE');
  requirePerm_(auth, 'canEditMovements');

  var ids = (Array.isArray(data && data.movIds) ? data.movIds : [])
              .map(function (v) { return String(v || '').trim(); })
              .filter(function (v) { return v; });
  if (!ids.length) throw new Error('No movements to delete.');

  var quiero = {};
  ids.forEach(function (id) { quiero[id] = 1; });

  return withStockLock_(function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var res = borrarFilasEnTanda_(ss, auth, function (f) {
      var id = String(f[AC.MOV_ID] || '').trim();
      return !!id && !!quiero[id];
    }, MAX_BORRADO_POR_TANDA);

    






    if (res.movidas) {
      refreshDerivedSheets_(ss);
      auditLog_(ss, 'DELETE_BATCH', auth.email,
        res.movidas + ' movement(s) moved to the trash', String(ids.length) + ' asked', '');
    }

    return { status: 'success', removed: res.movidas, removedIds: res.ids,
             asked: ids.length, more: res.quedanPor > 0 };
  });
}

function runReconciliation_(ss) {
  refreshDerivedSheets_(ss);
  return { status: 'success', message: 'Reconciliation complete. LIVE_STOCK and SITE_STOCK refreshed.' };
}




























function dedupeMovementIds_(rows, taken) {
  var fixes = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row) continue;
    
    
    if (!String(row[AC.CATEGORY] || '').trim() && !String(row[AC.NAME] || '').trim()) continue;
    var id = String(row[AC.MOV_ID] || '').trim();
    
    
    if (!id) continue;
    if (!taken[id]) { taken[id] = true; continue; }
    var when = row[AC.TIMESTAMP] instanceof Date ? row[AC.TIMESTAMP] : null;
    
    
    
    while (row.length < AC.MOV_ID) row.push('');
    row[AC.MOV_ID] = uniqueMovId_(taken, i, when);
    fixes.push(i);
  }
  return fixes;
}



function uniqueMovId_(taken, seq, when) {
  var base = newMovId_(seq, when);
  if (!taken[base]) { taken[base] = true; return base; }
  for (var n = 1; ; n++) {
    var id = base + '-' + n;
    if (!taken[id]) { taken[id] = true; return id; }
  }
}




function writeMovIdColumn_(sheet, rows) {
  if (!sheet || rows.length < 2) return;
  ensureArchiveWidth_(sheet);
  var col = [];
  
  
  
  
  
  for (var i = 1; i < rows.length; i++) col.push([textCell_(rows[i] ? (rows[i][AC.MOV_ID] || '') : '')]);
  sheet.getRange(2, AC.MOV_ID + 1, col.length, 1).setValues(col);
}























function backfillMovementIds_(ss, auth) {
  return withStockLock_(function () {
    var out = { status: 'success', filled: 0, alreadyHad: 0, renamed: 0, sheets: [] };

    
    
    
    
    var taken = {};

    [SHEETS.ARCHIVE, SHEETS.ARCHIVE_HISTORY].forEach(function (sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;
      ensureArchiveWidth_(sheet);

      
      
      var head = sheet.getRange(1, AC.MOV_ID + 1);
      if (!String(head.getValue() || '').trim()) {
        head.setValue('Movement ID').setFontWeight('bold');
      }

      var last = sheet.getLastRow();
      if (last < 2) { out.sheets.push({ sheet: sheetName, filled: 0, rows: 0 }); return; }

      var count = last - 1;
      var ids   = sheet.getRange(2, AC.MOV_ID + 1,    count, 1).getValues();
      var stamp = sheet.getRange(2, AC.TIMESTAMP + 1, count, 1).getValues();
      var cats  = sheet.getRange(2, AC.CATEGORY + 1,  count, 1).getValues();
      var names = sheet.getRange(2, AC.NAME + 1,      count, 1).getValues();

      var filled = 0, renamed = 0;
      for (var i = 0; i < count; i++) {
        
        
        
        if (!String(cats[i][0] || '').trim() && !String(names[i][0] || '').trim()) continue;
        var when = stamp[i][0] instanceof Date ? stamp[i][0] : null;
        var id   = String(ids[i][0] || '').trim();
        if (!id) {
          ids[i][0] = uniqueMovId_(taken, i, when);
          filled++;
          continue;
        }
        out.alreadyHad++;
        if (!taken[id]) { taken[id] = true; continue; }
        
        
        ids[i][0] = uniqueMovId_(taken, i, when);
        renamed++;
      }

      
      
      if (filled || renamed) sheet.getRange(2, AC.MOV_ID + 1, count, 1).setValues(ids.map(function(r){ return [textCell_(r[0])]; }));
      out.filled  += filled;
      out.renamed += renamed;
      out.sheets.push({ sheet: sheetName, filled: filled, renamed: renamed, rows: count });
    });

    auditLog_(ss, 'MOVEMENT_ID_BACKFILL', (auth && auth.email) || 'system',
      out.filled + ' movement(s) named', out.alreadyHad + ' already had one',
      JSON.stringify(out.sheets));

    
    
    
    
    out.message = out.filled
      ? (out.filled + ' movement' + (out.filled === 1 ? '' : 's') + ' named. ' +
         (out.alreadyHad - out.renamed) + ' already had an ID.')
      : ('Nothing to do — all ' + out.alreadyHad + ' movements already have an ID.');
    return out;
  });
}


function auditLog_(ss, action, user, details, oldVal, newVal) {
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return;
  sheet.appendRow([new Date(), action, user, textCell_(details), textCell_(oldVal), textCell_(newVal)]);
}













var SYSTEM_ACTORS = { 'system': 1, 'system@scheduled-trigger': 1 };

var SYSTEM_EVENT_LABELS = {
  BACKUP_CREATED:    'Backup created',
  ARCHIVE_RECONCILE: 'Old movements archived',
  STOCK_REBUILD:     'Stock totals rebuilt',
  AUTO_REPAIR_MATID: 'Movements re-linked to the right material',
  
  
  
  
  
  
  AUTO_REPAIR_TOTAL_COST: 'Totals recalculated (Qty × Unit Cost)'
};











function describeMatIdFixes_(fixes) {
  var named = fixes.slice(0, 3).map(function (f) {
    return 'row ' + f.rowNum + ' — ' + (f.kind ? f.kind + ' ' : '') + f.what +
           (f.qty ? ' ×' + f.qty + (f.unit ? ' ' + f.unit : '') : '') +
           (f.where ? ' @ ' + f.where : '') +
           (f.when ? ' (' + f.when + ')' : '');
  }).join(' · ');
  var more = fixes.length > 3 ? ' …and ' + (fixes.length - 3) + ' more' : '';
  return fixes.length + ' movement' + (fixes.length === 1 ? '' : 's') +
         ' still pointed at an old material identity — usually because someone ' +
         'edited the category or name on that movement — and ' +
         (fixes.length === 1 ? 'has' : 'have') + ' been re-linked so the stock ' +
         'counts against the right material. Nothing was lost: ' + named + more;
}
















function sysDismissKey_(email) {
  return 'SYSDISM_' + String(email || '').toLowerCase().replace(/\W/g, '_').substring(0, 80);
}

function sysDismissedSet_(email) {
  var out = {};
  if (!email) return out;
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(sysDismissKey_(email));
    (JSON.parse(raw || '[]') || []).forEach(function (id) { out[id] = 1; });
  } catch (e) {}
  return out;
}





var SYS_DISMISS_MAX = 150;

function dismissSystemCard(data, auth) {
  auth = requireAuth_();
  var id = String((data && data.id) || '').trim();
  if (!id) return { status: 'success' };
  var p    = PropertiesService.getScriptProperties();
  var key  = sysDismissKey_(auth.email);
  var list = [];
  try { list = JSON.parse(p.getProperty(key) || '[]') || []; } catch (e) { list = []; }
  if (list.indexOf(id) === -1) list.push(id);
  if (list.length > SYS_DISMISS_MAX) list = list.slice(list.length - SYS_DISMISS_MAX);
  p.setProperty(key, JSON.stringify(list));
  return { status: 'success', dismissed: list.length };
}












function getSystemActivity_(limit, forEmail) {
  var dismissed = sysDismissedSet_(forEmail);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];

  
  
  
  
  
  var span  = Math.min(1500, last - 1);
  var rows  = sheet.getRange(last - span + 1, 1, span, 6).getValues();
  var out   = [];
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var live = 0;
  var maxLive = limit || 8;
  var MAX_TOTAL = 60;
  for (var i = rows.length - 1; i >= 0 && live < maxLive && out.length < MAX_TOTAL; i--) {
    var actor = String(rows[i][2] || '').toLowerCase().trim();
    if (!SYSTEM_ACTORS[actor]) continue;
    var action = String(rows[i][1] || '');
    var atIso  = rows[i][0] ? new Date(rows[i][0]).toISOString() : '';
    
    var isDismissed = !!dismissed[atIso + '|' + action];
    if (!isDismissed) live++;
    
    
    
    
    var ref = null;
    if (action === 'BACKUP_CREATED' && String(rows[i][5] || '').trim()) {
      ref = { kind: 'drive', id: String(rows[i][5]).trim(), label: 'Open the backup in Drive' };
    } else if (action === 'AUTO_REPAIR_MATID' || action === 'AUTO_REPAIR_TOTAL_COST') {
      
      
      
      var m = String(rows[i][4] || '').match(/^rows ([\d,]+)/);
      if (m) ref = { kind: 'rows', rows: m[1].split(','), label: 'Show the movement' + (m[1].indexOf(',') === -1 ? '' : 's') };
    }
    out.push({
      at:        atIso,
      action:    action,
      label:     SYSTEM_EVENT_LABELS[action] || action.replace(/_/g, ' ').toLowerCase(),
      detail:    String(rows[i][3] || ''),
      extra:     [rows[i][4], rows[i][5]].filter(function (v) { return String(v || '').trim(); }).join(' · '),
      ref:       ref,
      dismissed: isDismissed
    });
  }
  return out;
}





function ensureErrorLogSheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.ERRORS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.ERRORS);
    sheet.appendRow(['Timestamp', 'Severity', 'User', 'Source', 'Action', 'Message', 'Context', 'RequestId']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }
  return sheet;
}





var _KNOWN_VALIDATION_PREFIXES = [
  'INSUFFICIENT', 'DUPLICATE_MOVEMENT', 'Not authenticated',
  'Access denied', 'Read-only access', 'Admin only', 'Archive sheet not found',
  'Unknown action', 'Category and Name are required', 'Quantity must be',
  'A reason is required', 'Rack is required',
  
  
  
  
  
  
  'RESERVED', 'No reservations exist',
  'WASTE movements require',
  



















  'SYSTEM_BUSY'
];









var VALIDATION_MESSAGE_PATTERNS = [
  /already exists/i,
  /too many requests/i,
  /reorganized/i,
  /does not look like/i,
  /cannot be attached/i,
  /too large|maximum file size|supera el tama/i,
  /value required/i,
  /missing required column/i,
  /no data rows found/i,
  /appears to be empty/i,
  /please upload/i,
  /do not have access/i,
  /not found in/i,
  /no documents provided/i,
  /required\.?$/i
];

function classifyErrorSeverity_(msg) {
  msg = String(msg || '');
  for (var i = 0; i < _KNOWN_VALIDATION_PREFIXES.length; i++) {
    if (msg.indexOf(_KNOWN_VALIDATION_PREFIXES[i]) === 0) return 'WARN';
  }
  for (var j = 0; j < VALIDATION_MESSAGE_PATTERNS.length; j++) {
    if (VALIDATION_MESSAGE_PATTERNS[j].test(msg)) return 'WARN';
  }
  return 'ERROR';
}


function sanitizeErrorContext_(obj) {
  if (!obj || typeof obj !== 'object') return '';
  var clean = {};
  for (var k in obj) {
    if (!obj.hasOwnProperty(k)) continue;
    if (/session|token|password/i.test(k)) continue;
    clean[k] = obj[k];
  }
  try { return JSON.stringify(clean).substring(0, 1000); } catch (e) { return ''; }
}

function newRequestId_() {
  return Utilities.getUuid().substring(0, 8);
}


function logError_(ss, severity, source, action, userEmail, message, context, requestId) {
  try {
    var sheet = ensureErrorLogSheet_(ss);
    sheet.appendRow([
      new Date(), severity, textCell_(userEmail || ''), source, textCell_(action || ''),
      textCell_(String(message || '').substring(0, 500)), textCell_(sanitizeErrorContext_(context)), requestId || ''
    ]);
  } catch (e) {
    Logger.log('logError_ failed: ' + e.message);
  }
  
  
  try {
    if (String(severity || '').toUpperCase() === 'ERROR') {
      notifyAdminOfError_(action, userEmail, message, requestId);
    }
  } catch (e2) {
    Logger.log('notifyAdminOfError_ failed: ' + e2.message);
  }
}














var ERROR_MAIL_PER_ACTION_SEC = 3600;
var ERROR_MAIL_DAILY_CAP      = 12;

function notifyAdminOfError_(action, userEmail, message, requestId) {
  
  if (basicApagado_()) return;
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('ERROR_ALERTS_ENABLED') === 'false') return;    

  var to = adminNotifyEmail_();
  if (!to) return;

  var cache = CacheService.getScriptCache();
  var actKey = 'errmail_' + Utilities.base64EncodeWebSafe(String(action || 'general')).substring(0, 60);
  if (cache.get(actKey)) return;                        

  var today   = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd');
  var capKey  = 'errmailcount_' + today;
  var sentRaw = cache.get(capKey);
  var sent    = sentRaw ? (parseInt(sentRaw, 10) || 0) : 0;
  if (sent >= ERROR_MAIL_DAILY_CAP) return;

  cache.put(actKey, '1', ERROR_MAIL_PER_ACTION_SEC);
  cache.put(capKey, String(sent + 1), 86400);

  var cs = companySettings_();
  var who = cs.name || PRODUCT_NAME;
  var url = '';
  try { url = String(p.getProperty('WEB_APP_URL') || ScriptApp.getService().getUrl() || ''); } catch (e) {}

  MailApp.sendEmail({
    to: to,
    subject: '⚠️ ' + who + ' — system error in ' + (action || 'the app'),
    htmlBody:
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' +
      '<p>An error was recorded in <b>' + escHtml_(who) + '</b>.</p>' +
      '<table cellpadding="6" style="border-collapse:collapse;font-size:13px">' +
        '<tr><td style="color:#666">Where</td><td><b>' + escHtml_(action || '—') + '</b></td></tr>' +
        '<tr><td style="color:#666">Message</td><td>' + escHtml_(String(message || '').substring(0, 400)) + '</td></tr>' +
        '<tr><td style="color:#666">User</td><td>' + escHtml_(userEmail || '—') + '</td></tr>' +
        '<tr><td style="color:#666">When</td><td>' + new Date().toLocaleString() + '</td></tr>' +
        '<tr><td style="color:#666">Ref</td><td>' + escHtml_(requestId || '—') + '</td></tr>' +
      '</table>' +
      '<p style="font-size:12px;color:#666">Full history: <b>Settings → System → Error Log</b>' +
        (url ? ' — <a href="' + escHtml_(url) + '">open ' + escHtml_(who) + '</a>' : '') + '</p>' +
      '<p style="font-size:12px;color:#666">Repeats of this same error are suppressed for an hour so this ' +
        'stays useful. To turn these off: Apps Script → Project Settings → Script Properties → ' +
        'ERROR_ALERTS_ENABLED = false</p></div>'
  });
}

function escHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}







var ERROR_LOG_KEEP_DAYS = 30;





function pruneErrorLog_(sheet, days) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var keepDays = days || ERROR_LOG_KEEP_DAYS;
  var cutoff = new Date().getTime() - keepDays * 86400000;
  var stamps = sheet.getRange(2, 1, last - 1, 1).getValues();

  
  
  
  var oldCount = 0;
  for (var i = 0; i < stamps.length; i++) {
    var d = stamps[i][0];
    var t = (d instanceof Date) ? d.getTime() : Date.parse(String(d));
    if (isNaN(t) || t >= cutoff) break;
    oldCount++;
  }
  if (oldCount > 0) sheet.deleteRows(2, oldCount);
  return oldCount;
}







function clearErrorLog(data, auth) {
  auth = requireAuth_('ADMIN');
  var mode  = String((data && data.mode) || 'all').toLowerCase();
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureErrorLogSheet_(ss);
  var last  = sheet.getLastRow();
  if (last < 2) return { status: 'success', removed: 0 };

  var removed = 0;
  if (mode === 'warnings') {
    var sev = sheet.getRange(2, 2, last - 1, 1).getValues();
    
    
    for (var i = sev.length - 1; i >= 0; i--) {
      if (String(sev[i][0] || '').toUpperCase() === 'WARN') { sheet.deleteRows(i + 2, 1); removed++; }
    }
  } else {
    removed = last - 1;
    sheet.deleteRows(2, removed);
  }

  
  
  
  
  
  
  auditLog_(ss, 'CLEAR_ERROR_LOG', auth.email,
    'Error log cleared (' + mode + ')', String(removed) + ' entries', '');

  return { status: 'success', removed: removed };
}

function getErrorLog(auth) {
  auth = requireAuth_('ADMIN');    
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureErrorLogSheet_(ss);
  try { pruneErrorLog_(sheet); } catch (e) { Logger.log('pruneErrorLog_: ' + e.message); }
  var last  = sheet.getLastRow();
  if (last < 2) return [];
  var rowCount = Math.min(last - 1, 300);
  var startRow = last - rowCount + 1;
  var rows = sheet.getRange(startRow, 1, rowCount, 8).getValues();
  var out = [];
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    out.push({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      severity: r[1], user: r[2], source: r[3], action: r[4],
      message: r[5], context: r[6], requestId: r[7]
    });
  }
  return out;
}




function logClientError(data, auth) {
  auth = requireAuth_();    
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var requestId = newRequestId_();
  logError_(ss, 'ERROR', 'frontend', data.action || '', auth.email,
    data.message, { stack: data.stack, url: data.url }, requestId);
  return { status: 'success', requestId: requestId };
}





function reportIssue(data) {
  var auth = setVerifiedAuth_(getUserRole(data && data._sessionToken));
  if (auth.role === 'NO_SESSION' || auth.role === 'DENIED') {
    throw new Error('Not authenticated. Please sign in and use the app from its own page.');
  }
  
  
  requireQuota_('issue', auth.email, 10, 600);

  var message = String((data && data.message) || '').trim();
  if (!message) throw new Error('Please describe what happened.');
  if (message.length > 4000) message = message.substring(0, 4000);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var photos = (data && data.photos) || [];
  var attachments = [];
  var driveLinks = [];

  if (photos.length) {
    var stamp  = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    var safeBy = auth.email.replace(/[^a-zA-Z0-9]/g, '_');
    var folder = getOrCreateFolder_(feedbackFolderName_() + '/' + stamp + '_' + safeBy);
    for (var i = 0; i < photos.length; i++) {
      var p = photos[i];
      if (!p || !p.fileData) continue;
      var bytes = Utilities.base64Decode(p.fileData);
      var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg', p.fileName || ('photo_' + (i + 1) + '.jpg'));
      var file  = folder.createFile(blob);  
      driveLinks.push(file.getId());
      attachments.push(blob);
    }
  }

  var cfg     = loadConfig();
  var cs      = companySettings_();
  
  
  var toEmail = cfg.adminEmail || Session.getEffectiveUser().getEmail();
  var support = String(PropertiesService.getScriptProperties().getProperty('SUPPORT_EMAIL') || '').trim();
  if (support && support.toLowerCase() !== String(toEmail).toLowerCase()) toEmail += ',' + support;

  
  
  
  
  
  
  var body = 'Company: ' + (cs.name || '(not set)') + '\n' +
    'Reported by: ' + auth.email + ' (' + auth.role + ')\n' +
    'App version: ' + APP_VERSION + '\n' +
    'When: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') + '\n' +
    (data && data.screen  ? 'Screen: ' + String(data.screen).substring(0, 60) + '\n' : '') +
    (data && data.viewport ? 'Window: ' + String(data.viewport).substring(0, 40) + '\n' : '') +
    (data && data.browser ? 'Browser: ' + String(data.browser).substring(0, 200) + '\n' : '') +
    'App URL: ' + (savedWebAppUrl_() || '(not saved — Settings › publish step)') + '\n' +
    'Spreadsheet: ' + ss.getUrl() + '\n' +
    '\n' + message +
    (driveLinks.length
      ? '\n\nPhoto(s) also saved to Drive:\n' + driveLinks.map(function(id){ return 'https://drive.google.com/file/d/' + id + '/view'; }).join('\n')
      : '');

  MailApp.sendEmail({
    to: toEmail,
    subject: '🐞 ' + PRODUCT_NAME + ' — problem reported by ' + auth.email,
    body: body,
    attachments: attachments
  });

  auditLog_(ss, 'ISSUE_REPORTED', auth.email, message.substring(0, 200), '', driveLinks.join(','));
  return { status: 'success' };
}





function checkNotifications_(ss, data, moveType, qty, userEmail) {
  
  if (basicApagado_()) return;
  try {
    var cfg       = loadConfig();
    var recipient = adminNotifyEmail_();
    var name      = String(data.name || '');

    if (moveType === 'WASTE') {
      MailApp.sendEmail(
        recipient,
        '🗑️ Waste Recorded: ' + name,
        'Item: '     + name +
        '\nQty: '    + qty +
        '\nReason: ' + (data.comments  || 'No reason provided') +
        '\nFrom: '   + (data.sourceLoc || 'N/A') +
        '\nBy: '     + userEmail,
        { name: (companySettings_().name || 'Warehouse') + ' — ' + PRODUCT_NAME, replyTo: userEmail }
      );
    }
  } catch (e) {
    Logger.log('Notification error: ' + e.message);
  }
}










function onOpen() {
  
  
  
  if (basicApagado_()) return;
  var cs = companySettings_();

  
  
  
  
  
  
  
  var advanced = SpreadsheetApp.getUi().createMenu('🔧 Advanced')
    .addItem('🔒 Revoke Public Sharing on Existing Files (run once)', 'menuRevokePublicSharing')
    .addItem('🧹 Normalize Status Column (run once)', 'menuNormalizeStatus')
    .addItem('Push Update Live (owner, standard Cloud project only)', 'menuActivateWebApp')
    .addSeparator()
    .addItem('📁 Tidy up my Drive (one folder for everything)', 'menuOrganizeDrive')
    .addItem('🩺 Check this installation', 'menuCheckInstallation')
    .addItem('🌙 Test the nightly archive (changes nothing)', 'menuProbarArchivado')
    .addItem('▶️ Archive old movements NOW (asks first)', 'menuArchivarAhora')
    .addItem('🔎 Check if this copy is a clean template', 'menuVerifyMasterTemplate')
    .addItem('💣 Erase everything — make this a blank template', 'menuPrepareMasterTemplate');

  SpreadsheetApp.getUi()
    .createMenu('🏭 ' + PRODUCT_NAME)
    .addItem(cs.setupComplete ? '⚙️ Company Settings' : '🚀 Set Up ' + PRODUCT_NAME + ' (start here)', 'showSetupWizardDialog')
    .addSeparator()
    .addItem('Open WMS App',       'menuOpenApp')
    .addItem('🗄 Backup Now / Enable Daily Backup', 'menuRunBackupNow')
    .addItem('Run Reconciliation', 'menuReconcile')
    .addSeparator()
    .addSubMenu(advanced)
    .addToUi();

  
  
  
  
  
  
  
  
  
  
  
  if (!cs.setupComplete) {
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Go to the "👉 START HERE" tab at the bottom of this window.',
        '👋 Welcome to ' + PRODUCT_NAME, 30);
    } catch (e) {}
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    try {
      if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(START_HERE_SHEET)) {
        createStartHereSheet_(SpreadsheetApp.getActiveSpreadsheet());
      }
    } catch (e) {}
  }
}











var NUDGE_EVERY_MS = 5 * 60 * 1000;

function onSelectionChange(e) {
  try {
    if (!e || !e.range) return;
    if (e.range.getSheet().getName() === START_HERE_SHEET) return;
    if (companySettings_().setupComplete) return;

    var p = PropertiesService.getDocumentProperties();
    var last = parseInt(p.getProperty('NUDGE_AT') || '0', 10) || 0;
    if (Date.now() - last < NUDGE_EVERY_MS) return;
    p.setProperty('NUDGE_AT', String(Date.now()));

    




    if (basicApagado_()) return;

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Setup has not been done yet. Open the "👉 START HERE" tab at the bottom.',
      '👋 Welcome to ' + PRODUCT_NAME, 15);
  } catch (err) {   }
}


















function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== START_HERE_SHEET) return;
    if (e.range.getA1Notation() !== TERMS_CHECKBOX_CELL) return;

    
    
    
    
    
    if (e.range.getValue() !== true) {
      sh.getRange(TERMS_STAMP_CELL).clearContent();
      
      
      
      sh.getRange(TERMS_NEXT_CELL)
        .setValue(TERMS_PROMPT)
        .setFontWeight('normal').setFontColor(SH_MUTED);
      return;
    }

    sh.getRange(TERMS_STAMP_CELL).setValue('Accepted ' + new Date().toLocaleString());

    





















    if (basicApagado_()) {
      sh.getRange(TERMS_NEXT_CELL)
        .setValue('→ Next: deploy the app — Extensions → Apps Script → Deploy. ' +
                  'The steps are at www.acopio.net. This edition has NO menu in ' +
                  'this window: everything happens inside the app, and you set ' +
                  'your company name there in Settings → Name & Logo.')
        .setFontWeight('bold').setFontColor('#B45309');
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'This edition has no menu here. Deploy the app (Extensions → Apps Script) ' +
        'and everything else happens inside it.',
        '✓ Terms accepted', 20);
      return;
    }

    sh.getRange(TERMS_NEXT_CELL)
      .setValue('→ Now open the  🏭 ' + PRODUCT_NAME + '  menu at the top of this window ' +
                'and choose  "🚀 Set Up ' + PRODUCT_NAME + '".')
      .setFontWeight('bold').setFontColor('#B45309');
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Now use the "🏭 ' + PRODUCT_NAME + '" menu at the top and choose "Set Up ' + PRODUCT_NAME + '".',
      '✓ Terms accepted', 20);
  } catch (err) {   }
}





var START_HERE_SHEET = '👉 START HERE';
var TERMS_SHEET   = '📄 Terms of Service';
var PRIVACY_SHEET = '📄 Privacy Policy';





var LEGAL_SHEET_TEXT = {
  terms: [
    ["title","Terms of Service — Acopio"],
    ["p",""],
    ["p","Last updated: 24 October 2026"],
    ["p",""],
    ["p","These terms govern your use of Acopio, warehouse-management software provided by Jose Castro (\"we\", \"us\"). By installing or using it, you agree to them. If you are agreeing on behalf of a company, you confirm you are authorised to do so."],
    ["p",""],
    ["head","The two editions, and which parts of this apply to you"],
    ["p",""],
    ["p","Acopio comes in two editions, and several clauses below only make sense for one of them."],
    ["p",""],
    ["li","•   Acopio Basic is free: no fee, no subscription, no expiry, not a trial."],
    ["li","•   Acopio Pro is the paid edition: a one-off setup fee and a subscription."],
    ["p",""],
    ["p","Acopio Basic you install yourself. Because nothing is paid, nothing in section 9 (payment, cancellation and refunds) applies to it, and the response time in section 5 is not promised for it — write to us and we will look, but a free edition carries no support commitment."],
    ["p",""],
    ["p","Acopio Pro is covered by everything in this document."],
    ["p",""],
    ["p","Two things are identical in both, and they are the ones that matter most: your data is yours and stays in your own Google account (section 3), and we are not a hosted service you depend on (section 1). Stopping paying, or never paying at all, does not take your system away from you."],
    ["p",""],
    ["p","Features that are only in Pro are visible in the free edition and say so when you touch them; they are not a defect of your installation. Which features belong to which edition is listed at www.acopio.net (https://www.acopio.net/#pro) and may change as the software changes; what you have already been given in your edition is not taken away."],
    ["p",""],
    ["head","1. What you are buying"],
    ["p",""],
    ["p","A licence to install and run one copy of Acopio inside your own Google account, for your own business, plus — in Pro — updates and support for as long as your licence is active."],
    ["p",""],
    ["p","You are not buying a hosted service. Acopio runs in your Google account, on your data, under your control. We do not operate a server your business depends on — which is why there is no uptime commitment below, and why there also is no one who can take your data away from you."],
    ["p",""],
    ["head","2. What you need to provide"],
    ["p",""],
    ["li","•   A Google account (personal Gmail or Google Workspace)."],
    ["li","•   Sufficient Google Drive storage for your documents and backups."],
    ["li","•   Compliance with Google's own terms for that account."],
    ["p",""],
    ["p","Google may change its products, quotas or pricing at any time. Those changes are between you and Google, and are outside our control. See §7."],
    ["p",""],
    ["head","3. Your data"],
    ["p",""],
    ["p","Your data is yours. We do not host it, receive it or claim any rights over it. See the Privacy Policy for detail."],
    ["p",""],
    ["p","If you stop paying, your data keeps working. The spreadsheet is yours, the records are yours, the documents in your Drive are yours. What lapses is your right to updates and support, not your access to your own information. We cannot and will not disable your installation remotely."],
    ["p",""],
    ["head","4. What you may not do"],
    ["p",""],
    ["li","•   Resell, sublicense, or distribute the software to third parties."],
    ["li","•   Remove or obscure the \"Powered by Acopio\" attribution."],
    ["li","•   Install one licence across multiple unrelated companies."],
    ["li","•   Reverse engineer the software to build a competing product."],
    ["p",""],
    ["p","Reading, understanding and modifying the code for your own internal use is permitted — it runs in your account and you can see all of it. Modified copies are unsupported, and §6 applies with particular force to them."],
    ["p",""],
    ["head","5. Support and updates"],
    ["p",""],
    ["sub","What your subscription includes"],
    ["p",""],
    ["li","•   Every new version, for as long as your licence is active. There is no"],
    ["p","  higher tier to buy later: improvements and fixes are the subscription."],
    ["li","•   Bug fixes and security updates, delivered as files for you to install."],
    ["li","•   Questions about how to use it, by email."],
    ["li","•   Help reading your own data when something does not add up — for example"],
    ["p","  working out why a stock figure looks wrong."],
    ["p",""],
    ["sub","How fast we answer"],
    ["p",""],
    ["p","We answer support email within one business day, Monday to Friday, excluding United States public holidays, on Mountain Time."],
    ["p",""],
    ["p","That is when we will have replied to you, not when the problem will be solved. How long a fix takes depends on what it is, and we will not pretend otherwise: you will get a real answer about what is happening and what happens next."],
    ["p",""],
    ["p","In practice most email is answered much sooner. One business day is what we are willing to be held to."],
    ["p",""],
    ["p","If you need a faster commitment, priority support is available as a paid add-on: four business hours, with a direct channel."],
    ["p",""],
    ["sub","What is NOT included, and is charged separately"],
    ["p",""],
    ["p","These are quoted before any work starts. Nothing is ever charged without your written agreement first."],
    ["p",""],
    ["li","•   Importing your existing history from spreadsheets or another system."],
    ["li","•   Training beyond the session included with installation, whether for new"],
    ["p","  staff or a refresher."],
    ["li","•   Changes built specifically for you — a report, a field, a screen that"],
    ["p","  only your company needs."],
    ["li","•   Recovering data you deleted, where recovery is possible at all."],
    ["li","•   Repairing an installation whose code was modified. The software is"],
    ["p","  licensed, not sold, and only we may modify it (see section 4). If a copy has been changed, putting it right is billable work, and we may decline it."],
    ["li","•   A second or subsequent warehouse."],
    ["p",""],
    ["sub","What you have to do"],
    ["p",""],
    ["p","Installing updates is your responsibility. Because the software lives in your account, we cannot push a fix to you — including a security fix. We will tell you an update matters; applying it is your call and your action."],
    ["p",""],
    ["p","Support depends on your file being reachable. We cannot help with a problem we cannot see. If diagnosing something requires looking at your spreadsheet, we will ask, and you decide."],
    ["p",""],
    ["p","We do not commit to any specific new feature, or to any timeline for one, unless we have agreed it with you in writing."],
    ["p",""],
    ["head","6. Warranty disclaimer and limitation of liability"],
    ["p",""],
    ["p","Read this section. It is the one that matters most if something goes wrong."],
    ["p",""],
    ["p","The software is provided \"as is\", without warranty of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement."],
    ["p",""],
    ["p","We are not responsible for the accuracy of your inventory. Acopio records what your staff enter. It cannot know whether the count was right, whether a delivery was miscounted, or whether someone recorded a movement that never happened. Inventory accuracy is an operational responsibility, not a software guarantee."],
    ["p",""],
    ["p","To the maximum extent permitted by law, we are not liable for:"],
    ["p",""],
    ["li","•   lost profits, lost revenue, lost business or lost data;"],
    ["li","•   decisions made on the basis of information shown by the software;"],
    ["li","•   stock discrepancies, shortages, overstock or mis-shipments;"],
    ["li","•   any failure, change, quota, outage or discontinuation of Google's services;"],
    ["li","•   data loss caused by deletion, misconfiguration or account compromise on your"],
    ["p","  side."],
    ["p",""],
    ["p","Our total liability, for any and all claims, is capped at **the amount you paid us in the twelve months preceding the claim**."],
    ["p",""],
    ["p","Some jurisdictions do not allow certain exclusions; in those places these limits apply to the fullest extent the law allows."],
    ["p",""],
    ["head","7. Dependence on Google"],
    ["p",""],
    ["p","Acopio is built on Google Workspace and Google Apps Script. Google's platform carries limits that are theirs, not ours — including a daily cap on outgoing email (100/day on personal accounts, 1,500/day on Workspace), execution time limits, and a maximum spreadsheet size."],
    ["p",""],
    ["p","We will tell you about the limits we know of and design around them where we can. We cannot remove them, and we are not liable if Google changes them, enforces them, or discontinues a service we rely on."],
    ["p",""],
    ["head","8. Backups"],
    ["p",""],
    ["p","In Pro, Acopio can make a copy of your spreadsheet nightly into your own Drive, kept 30 days. It is enabled during setup and we strongly recommend leaving it on."],
    ["p",""],
    ["p","In Basic there is no automatic backup at all. The free edition is installed with a single, non-sensitive Google permission, and scheduling a nightly task needs another one. Copies in Basic are made by you, by hand, with File → Make a copy. Everything in the paragraph below applies to those with at least as much force."],
    ["p",""],
    ["p","It is a convenience, not a guarantee. It protects against ordinary mistakes — a bad edit, a deleted row. It does not protect against your Google account being deleted, suspended or compromised, because the backups live in that same account. If your data is critical, keep an independent copy outside Google. Verifying that your backups exist and work is your responsibility."],
    ["p",""],
    ["head","9. Payment, cancellation and refunds"],
    ["p",""],
    ["p","Fees, billing period and any add-on pricing are as agreed in writing when you purchase."],
    ["p",""],
    ["sub","Cancelling"],
    ["p",""],
    ["p","Cancel any time. Cancellation ends future billing, and support and updates end when the period you have already paid for runs out."],
    ["p",""],
    ["p","Your installation keeps working. It is in your Google account and we have no way to switch it off, and would not use one if we had it. What stops is support and new versions — not the software, and not your access to your own data. See section 10."],
    ["p",""],
    ["sub","The setup fee"],
    ["p",""],
    ["p","The one-time setup fee covers work we perform: installing, configuring the system to your categories and racks, loading your team, and training you."],
    ["p",""],
    ["li","•   Before that work has been done, it is fully refundable. If you change"],
    ["p","  your mind before we install, you get all of it back."],
    ["li","•   Once the work has been performed, it is not refundable, because it has"],
    ["p","  been delivered. That holds even if you then cancel the subscription."],
    ["p",""],
    ["sub","The subscription"],
    ["p",""],
    ["li","•   Monthly: if you cancel within 14 days of a charge, that month is"],
    ["p","  refunded in full. After 14 days the month is not refunded, and you keep support and updates until it ends."],
    ["li","•   Annual: whole months you have not yet used are refunded. Months already"],
    ["p","  begun are not."],
    ["li","•   If the fault is ours: if a defect makes the software unusable for its"],
    ["p","  purpose and we have not fixed it within 30 days of you reporting it, the current period is refunded in full whatever the dates say. You should not pay for a month in which it did not work."],
    ["p",""],
    ["p","Refunds are issued by the method you paid with, **within 5 to 10 business days** of being agreed."],
    ["p",""],
    ["sub","Add-ons"],
    ["p",""],
    ["p","Add-ons follow the subscription: cancel one and it stops at the end of the current period, under the same rules as above."],
    ["p",""],
    ["sub","How you are billed"],
    ["p",""],
    ["p","Payment is taken by card through Stripe, our payment processor."],
    ["p",""],
    ["li","•   Your card details go to Stripe, not to us. They are stored by Stripe"],
    ["p","  under Stripe's own terms and security. We never see, hold or store your card number."],
    ["li","•   The setup fee is charged once, when the installation is booked."],
    ["li","•   The subscription is then charged automatically on each renewal date —"],
    ["p","  monthly or annually, whichever you chose — until you cancel. Stripe emails you a receipt for every charge."],
    ["li","•   Prices are in US dollars and do not include any tax that may apply where"],
    ["p","  you are; if tax applies, it is added to the charge."],
    ["li","•   If your company cannot pay by card, tell us before the installation and"],
    ["p","  we will agree an alternative in writing."],
    ["p",""],
    ["sub","If a payment does not go through"],
    ["p",""],
    ["p","Nothing is switched off, at any point. We could not do it if we wanted to — the software is in your Google account."],
    ["p",""],
    ["p","Card payments fail for boring reasons — an expired card, a bank declining a recurring charge. What actually happens:"],
    ["p",""],
    ["p","1. Stripe retries the charge automatically over the following days and emails you each time. This is usually the end of it. 2. Day 10 after the first failed charge — if it is still unpaid, we email you personally, so it does not come down to you noticing a receipt that never arrived. 3. Day 30 — if it is still unpaid, support and new versions pause until the account is settled. You keep using the software and you keep every bit of your data. 4. We never withhold your data to get paid. It is not ours to withhold, and export stays available whatever the state of your account."],
    ["p",""],
    ["p","Settle the account and support and updates resume immediately. What that costs depends only on how long the account was unpaid — see the next section."],
    ["p",""],
    ["sub","Coming back after a pause, or after leaving"],
    ["p",""],
    ["p","Support and updates can be paused for two reasons: an unpaid account, or you cancelling. What it takes to start again is the same either way, and it depends on one thing only — how long you were away:"],
    ["p",""],
    ["li","•   Up to 2 months away — you pay the months you owe. Nothing extra."],
    ["li","•   More than 2 months away — the months you owe, plus $150 to bring the installation up to date."],
    ["li","•   More than 12 months away — treated as a new installation, at current prices."],
    ["p",""],
    ["p","The $150 is not a penalty for leaving. While an account is paused you stop receiving the fixes and new versions everyone else gets, so an installation that has been paused for months has to be brought forward before it is supportable again — and that is real work. Under two months there is normally none of it, which is why there is no charge."],
    ["p",""],
    ["p","No promotional or founding rate comes back with you, in any of the three cases."],
    ["p",""],
    ["p","Nothing about your data changes while an account is paused. The software keeps running in your own Google account, your records stay yours, and export stays available. See section 5."],
    ["p",""],
    ["head","10. Termination"],
    ["p",""],
    ["p","We may terminate your licence if you materially breach these terms and do not fix it within 30 days of written notice. On termination your right to support and updates ends. Your installation and your data are unaffected — we have no mechanism to remove them, and would not use one if we had it."],
    ["p",""],
    ["head","11. Changes to these terms"],
    ["p",""],
    ["p","We may update these terms. Material changes will be emailed to active customers at least 30 days before they take effect. Continuing to use the software after that means you accept them."],
    ["p",""],
    ["head","12. Governing law"],
    ["p",""],
    ["p","The laws of the State of Utah, United States, without regard to conflict-of-law rules. Disputes go to the state or federal courts located in Utah."],
    ["p",""],
    ["head","13. Contact"],
    ["p",""],
    ["p","Jose Castro — joseisrael5101@gmail.com"]
  ],
  privacy: [
    ["title","Privacy Policy — Acopio"],
    ["p",""],
    ["p","Last updated: 27 August 2026"],
    ["p",""],
    ["p","Acopio is warehouse-management software provided by Jose Castro (\"we\", \"us\"). This policy explains what happens to data when you use it."],
    ["p",""],
    ["p","Read the first section before anything else — it is the part that makes the rest of this document short."],
    ["p",""],
    ["head","1. Where your data lives — and who holds it"],
    ["p",""],
    ["p","Acopio does not host your business data. We never receive a copy of it."],
    ["p",""],
    ["p","Acopio runs entirely inside your own Google account. When you install it, a Google Sheet and a Google Apps Script project are created **in your Google Drive**, owned by you. Every inventory record, photo, document and user list the software creates is written to that spreadsheet and that Drive folder — both yours."],
    ["p",""],
    ["p","There is no Acopio server. There is no Acopio database. We operate no infrastructure that your business data passes through or is stored on."],
    ["p",""],
    ["p","Practically, this means:"],
    ["p",""],
    ["li","•   We cannot read your inventory, your suppliers, your prices or your documents."],
    ["li","•   We cannot lose your data in a breach of our systems, because it is not on our"],
    ["p","  systems."],
    ["li","•   If you stop paying us, your data does not go anywhere. It stays in your Drive"],
    ["p","  and your spreadsheet keeps working."],
    ["li","•   A subpoena served on us produces nothing about your inventory, because we hold"],
    ["p","  none of it. The only business information we may hold is your company name and your administrator's email address, and only in the one case described in section 3 — the setup check-in."],
    ["p",""],
    ["p","Your data is governed by your agreement with Google (Google Workspace Terms or the Google Terms of Service, as applicable to your account)."],
    ["p",""],
    ["head","2. What the software accesses, and why"],
    ["p",""],
    ["p","When you first install Acopio, Google asks you to authorise it. Each permission exists for a specific feature:"],
    ["p",""],
    ["p","| Permission | Why it is needed | |---|---| | See, edit and delete your Google Drive files | Store the photos and documents you attach to movements, and create nightly backup copies of your spreadsheet. | | View and manage the spreadsheet this app is installed in | The spreadsheet is the application's database. | | Send email as you | Delivery notifications to your project managers, and system alerts to your administrator. It cannot read your email. | | Create and edit Google Docs | Assemble multiple photos into a single PDF document. | | Connect to an external service | Version checks and, if you enable it, the optional AI document-reading add-on. | | Run when you are not present | The nightly automatic backup. | | See your primary email address and basic profile | Identify who is signed in, so the app knows which permissions to apply. |"],
    ["p",""],
    ["p","Two notes on scope:"],
    ["p",""],
    ["li","•   Full Gmail access is NOT part of the base product. It is required only by"],
    ["p","  the optional paid Gmail delivery-scanner add-on. If you have not bought that add-on, Acopio never requests it and cannot read your mail."],
    ["li","•   Every permission above is granted by you, to software running in your own"],
    ["p","  account. None of it grants us access."],
    ["p",""],
    ["head","3. What we collect"],
    ["p",""],
    ["p","We never receive your inventory data. Four things can send us something else, and they are listed here in full."],
    ["p",""],
    ["p","1. \"Report a problem\" (the 🐞 button). When you submit a report, the message you typed, any screenshots you attach, your email address and your app version are emailed to your own administrator. If you send it on to us for support, we receive whatever you chose to include. Do not attach screenshots containing information you would rather we did not see. 2. Support you initiate. If you email us for help and include a file, a screenshot or spreadsheet access, we see what you send us. We use it to resolve your issue and nothing else, and we do not retain copies afterwards. 3. The setup check-in — the one thing that sends without you asking. If, and only if, your installation was configured with a support address, the software emails us once at 3 days and once at 7 days after setup **when no inventory movement has been recorded at all**. It is there so a customer who got stuck during setup hears from us instead of quietly giving up."],
    ["p",""],
    ["p","   That email contains exactly four things: **your company name, your administrator's email address, how many users are registered, and how many days it has been since setup.** Nothing else — no inventory, no materials, no suppliers, no prices, no documents."],
    ["p",""],
    ["p","   It stops permanently as soon as a single movement is recorded, and it never sends more than those two messages. If your installation has no support address configured, it never sends at all."],
    ["p",""],
    ["p","4. Paying us. Your billing details — name, email, company, billing address — reach us through Stripe so we know who paid for what. **Your card number does not**: it goes to Stripe and stays there. See section 5."],
    ["p",""],
    ["p","We do not use analytics, tracking pixels, advertising identifiers or session recording. We do not sell, rent or share data — we have none to sell."],
    ["p",""],
    ["head","4. The optional AI add-on"],
    ["p",""],
    ["p","If you enable the document-reading feature, the contents of the documents you choose to scan are sent to Google's Gemini API for processing, using an API key that you supply from your own Google account. The request goes from your Google account to Google. It does not pass through us."],
    ["p",""],
    ["p","This feature is off unless you turn it on."],
    ["p",""],
    ["head","5. Sub-processors"],
    ["p",""],
    ["p","For your business data: none, because we do not process it."],
    ["p",""],
    ["p","Google is not our sub-processor — Google is your provider, under your own agreement with them."],
    ["p",""],
    ["p","For billing: Stripe. Paying us means Stripe processes your billing details — the name and email on the account, your company name and billing address, and your card. **Your card number goes to Stripe and is held by Stripe; it never reaches us.** Stripe is a payment processor under its own privacy policy at stripe.com/privacy (https://stripe.com/privacy)."],
    ["p",""],
    ["p","This is the one place a third party sees anything of yours because of us, and it sees only what is needed to take a payment. **It has nothing to do with your inventory**, which stays in your Google account and is never sent anywhere."],
    ["p",""],
    ["head","6. Retention and deletion"],
    ["p",""],
    ["p","You control retention entirely:"],
    ["p",""],
    ["li","•   Inventory records live in your spreadsheet until you delete them."],
    ["li","•   Attached photos and documents live in your Drive until you delete them."],
    ["li","•   Nightly backups are deleted automatically after 30 days."],
    ["p",""],
    ["p","To delete everything: delete the spreadsheet and the app's Drive folder. That is complete deletion — there is no second copy anywhere for us to purge, and no request to us is required."],
    ["p",""],
    ["p","To revoke the software's access at any time, without deleting anything, go to myaccount.google.com/permissions (https://myaccount.google.com/permissions)."],
    ["p",""],
    ["head","7. Your rights (GDPR, CCPA and similar)"],
    ["p",""],
    ["p","Because your data never leaves your Google account, **you are the data controller** for it and we are not a processor of it. Access, correction, export and deletion are all things you perform directly, in your own spreadsheet, without asking us."],
    ["p",""],
    ["p","For the limited personal data we hold as a business — your name, billing email and support correspondence — write to the address below and we will act on your request within 30 days."],
    ["p",""],
    ["head","8. Children"],
    ["p",""],
    ["p","Acopio is business software and is not directed at anyone under 16."],
    ["p",""],
    ["head","9. Security"],
    ["p",""],
    ["p","The software is built to keep your data inside your account: uploaded files are private to your Drive by default and are never shared publicly; access is restricted to the user list you configure; and the code is written to resist common web vulnerabilities. Security fixes are shipped as software updates for you to install."],
    ["p",""],
    ["p","That said, the security of your Google account — passwords, two-factor authentication, who you grant access to — is yours to manage, and no software we write can compensate for a compromised account."],
    ["p",""],
    ["head","10. Changes"],
    ["p",""],
    ["p","Material changes to this policy will be communicated to active customers by email before they take effect. The date at the top always reflects the current version."],
    ["p",""],
    ["head","11. Contact"],
    ["p",""],
    ["p","Jose Castro — joseisrael5101@gmail.com"]
  ]
};














function createLegalSheets_(ss) {
  [[TERMS_SHEET, LEGAL_SHEET_TEXT.terms], [PRIVACY_SHEET, LEGAL_SHEET_TEXT.privacy]]
    .forEach(function(pair){
      var name = pair[0], lines = pair[1];
      var old = ss.getSheetByName(name);
      if (old) ss.deleteSheet(old);
      var sh = ss.insertSheet(name);
      sh.setHiddenGridlines(true);
      sh.setColumnWidth(1, 40);
      sh.setColumnWidth(2, 860);
      sh.getRange('A:B').setBackground(SH_PAPER);

      var values = lines.map(function(l){ return [l[1]]; });
      if (values.length) {
        sh.getRange(2, 2, values.length, 1).setValues(values)
          .setWrap(true).setVerticalAlignment('top');
      }
      lines.forEach(function(l, idx){
        var cell = sh.getRange(idx + 2, 2);
        if (l[0] === 'title')      cell.setFontSize(18).setFontWeight('bold').setFontColor(SH_NAVY);
        else if (l[0] === 'head')  cell.setFontSize(13).setFontWeight('bold').setFontColor(SH_ACCENT);
        else if (l[0] === 'sub')   cell.setFontSize(11).setFontWeight('bold').setFontColor(SH_NAVY);
        else                       cell.setFontSize(11).setFontColor('#374151');
      });

      
      sh.getRange('B1').setValue('← Back to 👉 START HERE')
        .setFontSize(10).setFontColor(SH_MUTED);
      sh.setFrozenRows(1);
      sh.protect().setWarningOnly(true);    
    });
}




function sheetLink_(ss, name) {
  var sh = ss.getSheetByName(name);
  return sh ? ('#gid=' + sh.getSheetId()) : '';
}



var TERMS_CHECKBOX_CELL = 'B14';
var TERMS_LABEL_CELL    = 'C14';
var TERMS_STAMP_CELL    = 'C15';
var TERMS_NEXT_CELL     = 'C16';



var TERMS_PROMPT = 'Tick the box above to continue.';



var SH_NAVY = '#1B2A4A', SH_ACCENT = '#3B7DD8', SH_MUTED = '#6B7280', SH_PAPER = '#FFFFFF';

function createStartHereSheet_(ss) {
  var sh = ss.getSheetByName(START_HERE_SHEET);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(START_HERE_SHEET, 0);

  
  
  
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 40); sh.setColumnWidth(2, 40);
  sh.setColumnWidth(3, 620); sh.setColumnWidth(4, 40);
  sh.getRange('A1:Z60').setBackground(SH_PAPER).setFontFamily('Arial');

  function put(cell, text, opts) {
    opts = opts || {};
    var r = sh.getRange(cell);
    r.setValue(text);
    if (opts.size)   r.setFontSize(opts.size);
    if (opts.bold)   r.setFontWeight('bold');
    if (opts.color)  r.setFontColor(opts.color);
    if (opts.bg)     r.setBackground(opts.bg);
    if (opts.wrap)   r.setWrap(true);
    return r;
  }

  
  sh.getRange('A1:D3').setBackground(SH_NAVY);
  sh.setRowHeight(1, 14); sh.setRowHeight(2, 42); sh.setRowHeight(3, 26);
  put('C2', PRODUCT_NAME, { size: 26, bold: true, color: '#FFFFFF', bg: SH_NAVY });
  put('C3', 'Warehouse management, in your own Google Drive.',
      { size: 11, color: '#C7D2E4', bg: SH_NAVY });

  
  sh.setRowHeight(4, 26);
  
  sh.setRowHeight(5, 30);
  put('C5', 'Welcome. This copy is yours.', { size: 17, bold: true, color: SH_NAVY });
  sh.setRowHeight(6, 8);
  put('C7',
    'Everything lives in this file, in your own Google Drive. Nobody else can see it, ' +
    'and it does not stop working if you stop paying anyone. Setting it up takes about ' +
    'ten minutes and you only do it once.',
    { size: 11, color: '#374151', wrap: true });
  sh.setRowHeight(7, 56);

  
  sh.setRowHeight(8, 18);
  put('C9', 'BEFORE YOU START', { size: 9, bold: true, color: SH_MUTED });
  put('C10',
    'By using ' + PRODUCT_NAME + ' you accept the Terms of Service and the Privacy Policy. ' +
    'In short: your data stays in your Drive and is never sent anywhere else; the system is ' +
    'provided as it is, and you are responsible for keeping your own backups (it can take one ' +
    'for you every night). The full text is in the app under Settings → Legal.',
    { size: 11, color: '#374151', wrap: true });
  sh.setRowHeight(10, 74);

  sh.setRowHeight(11, 10);
  sh.getRange('B12:C12').setBackground('#EFF4FB');
  sh.setRowHeight(12, 6);
  sh.getRange('B13:C13').setBackground('#EFF4FB'); sh.setRowHeight(13, 6);
  sh.getRange('B14:C17').setBackground('#EFF4FB');
  sh.setRowHeight(14, 30);

  
  
  var chk = sh.getRange(TERMS_CHECKBOX_CELL);
  chk.insertCheckboxes();
  chk.setValue(false);
  chk.setHorizontalAlignment('center');
  
  
  
  
  
  var termsLabel = 'I accept the Terms of Service and Privacy Policy — tick this box to begin.';
  createLegalSheets_(ss);
  var tUrl = sheetLink_(ss, TERMS_SHEET), pUrl = sheetLink_(ss, PRIVACY_SHEET);
  var tAt = termsLabel.indexOf('Terms of Service');
  var pAt = termsLabel.indexOf('Privacy Policy');
  var rt = SpreadsheetApp.newRichTextValue().setText(termsLabel)
    .setTextStyle(SpreadsheetApp.newTextStyle()
      .setFontSize(12).setBold(true).setForegroundColor(SH_NAVY).build());
  if (tUrl) rt.setLinkUrl(tAt, tAt + 'Terms of Service'.length, tUrl);
  if (pUrl) rt.setLinkUrl(pAt, pAt + 'Privacy Policy'.length, pUrl);
  sh.getRange(TERMS_LABEL_CELL).setRichTextValue(rt.build()).setBackground('#EFF4FB');
  sh.setRowHeight(15, 20);
  put(TERMS_STAMP_CELL, '', { size: 10, color: SH_MUTED, bg: '#EFF4FB' });
  
  
  
  
  
  sh.setRowHeight(16, 32);
  put(TERMS_NEXT_CELL, TERMS_PROMPT,
      { size: 11, color: SH_MUTED, bg: '#EFF4FB', wrap: true });
  sh.setRowHeight(17, 8);

  
  sh.setRowHeight(18, 22);
  put('C19', 'WHAT HAPPENS NEXT', { size: 9, bold: true, color: SH_MUTED });
  















  if (basicApagado_()) {
    put('C20', '1.   You deploy the app once — the steps are at www.acopio.net.', { size: 11, color: '#374151' });
    put('C21', '2.   You open it and start recording movements straight away.', { size: 11, color: '#374151' });
    put('C22', '3.   Your company name goes in Settings \u2192 Name & Logo, whenever you like.', { size: 11, color: '#374151' });
  } else {
    put('C20', '1.   Setup asks for your company name and logo.', { size: 11, color: '#374151' });
    put('C21', '2.   You tell it what you store and where you store it.', { size: 11, color: '#374151' });
    put('C22', '3.   You add the people who work here. That is all.', { size: 11, color: '#374151' });
  }

  
  sh.setRowHeight(23, 16);
  put('C24',
    'Google will ask you to authorize this the first time, and will warn that the app is ' +
    '"not verified". That is expected and it is not a problem: this copy belongs to YOU, and ' +
    'the developer it names is your own account. Click Advanced, then "Go to…" to continue.',
    { size: 10, color: SH_MUTED, wrap: true });
  sh.setRowHeight(24, 56);

  



  put('C26', 'Leave the other tabs at the bottom alone — the system fills those in for you. ' +
             (basicApagado_()
               ? 'You can hide this tab once you are up and running.'
               : 'This page disappears by itself once setup is finished.'),
      { size: 10, color: SH_MUTED, wrap: true });
  sh.setRowHeight(26, 34);

  
  
  
  
  
  ss.setActiveSheet(sh);
  try { sh.setActiveSelection('A1'); } catch (e) {}
  return sh;
}





function recordTermsAcceptance_(email) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(START_HERE_SHEET);
    var ticked = sh ? sh.getRange(TERMS_CHECKBOX_CELL).getValue() === true : false;
    var p = PropertiesService.getScriptProperties();
    if (!p.getProperty('TERMS_ACCEPTED_AT')) {
      p.setProperty('TERMS_ACCEPTED_AT', new Date().toISOString());
      p.setProperty('TERMS_ACCEPTED_BY', String(email || ''));
      p.setProperty('TERMS_ACCEPTED_HOW', ticked ? 'start-here-checkbox' : 'setup-wizard');
    }
  } catch (e) { Logger.log('recordTermsAcceptance_: ' + e.message); }
}

function removeStartHereSheet_(ss) {
  try {
    var sh = ss.getSheetByName(START_HERE_SHEET);
    if (sh && ss.getSheets().length > 1) ss.deleteSheet(sh);
  } catch (e) {}
}







function showSetupWizardDialog() {
  requireOwnerContext_();
  var html = HtmlService.createHtmlOutputFromFile('SetupWizard')
    .setWidth(720).setHeight(680);
  try {
    SpreadsheetApp.getUi().showModalDialog(html, PRODUCT_NAME + ' Setup');
  } catch (err) {
    
    
    
    
    
    
    
    
    
    
    explainDialogPermission_(String(err && err.message || err));
    throw err;
  }
}





function explainDialogPermission_(msg) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(START_HERE_SHEET) || createStartHereSheet_(ss);
    var row = 30;
    sh.getRange(row, 3).setValue('⚠  SETUP CANNOT OPEN — ONE SETTING IS MISSING')
      .setFontWeight('bold').setFontSize(12).setFontColor('#B91C1C');
    sh.setRowHeight(row, 28);
    var steps = [
      'Google says: ' + msg,
      '',
      'This copy is missing permission to open a window over the sheet. Fix it once:',
      '1.  Extensions → Apps Script.',
      '2.  ⚙ Project Settings → tick "Show appsscript.json manifest file in editor".',
      '3.  Open appsscript.json in the file list on the left.',
      '4.  Inside "oauthScopes", add this line:',
      '        "https://www.googleapis.com/auth/script.container.ui",',
      '5.  Save, come back here, reload the page, and use the 🏭 ' + PRODUCT_NAME + ' menu again.',
      '     Google will ask you to authorize once more — that is expected.'
    ];
    for (var i = 0; i < steps.length; i++) {
      sh.getRange(row + 1 + i, 3).setValue(steps[i]).setFontSize(10).setFontColor('#374151');
    }
    ss.setActiveSheet(sh);
    try { sh.setActiveSelection('C' + row); } catch (e) {}
  } catch (e) { Logger.log('explainDialogPermission_: ' + e.message); }
}













function checkDeploymentReady() {
  requireOwnerContext_();
  var p = PropertiesService.getScriptProperties();
  var saved = String(p.getProperty('WEB_APP_URL') || '').trim();
  if (saved) return { url: saved, saved: true };
  try { return { url: ScriptApp.getService().getUrl() || '', saved: false }; }
  catch (e) { return { url: '', saved: false }; }
}





function saveWebAppUrl(url) {
  requireOwnerContext_();
  var u = String(url || '').trim();
  if (!u) {
    PropertiesService.getScriptProperties().deleteProperty('WEB_APP_URL');
    return { url: '', saved: false };
  }
  if (!/^https:\/\/script\.google\.com\/.*\/exec(\?.*)?$/.test(u)) {
    throw new Error('That does not look like a web app link. It should start with https://script.google.com/ and end in /exec');
  }
  var p2 = PropertiesService.getScriptProperties();
  p2.setProperty('WEB_APP_URL', u);
  
  
  
  
  
  
  if (!String(p2.getProperty('OAUTH_REDIRECT_URI') || '').trim()) {
    p2.setProperty('OAUTH_REDIRECT_URI', u);
  }
  return { url: u, saved: true };
}





























var _WEBAPP_DEPLOYMENT_MARKER = PRODUCT_NAME + ' Web App';





































function pintarEnlaceEnVentana_(titulo, url, intro, aviso) {
  var ui = SpreadsheetApp.getUi();
  var u  = escHtml_(url);
  var html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank">' +
    '<style>' +
      'body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'color:#1F2937;margin:0;padding:18px 20px 16px}' +
      'p{margin:0 0 12px}' +
      '.go{display:block;text-align:center;background:#2563EB;color:#fff;text-decoration:none;' +
        'font-weight:600;font-size:15px;padding:12px 16px;border-radius:8px;margin:0 0 14px}' +
      '.go:hover{background:#1D4ED8}' +
      '.row{display:flex;gap:8px;align-items:center}' +
      'input{flex:1;min-width:0;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' +
        'padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;background:#F9FAFB;color:#374151}' +
      'button{border:1px solid #D1D5DB;background:#fff;color:#374151;font-size:13px;font-weight:600;' +
        'padding:8px 14px;border-radius:6px;cursor:pointer;white-space:nowrap}' +
      'button:hover{background:#F3F4F6}' +
      '.note{font-size:12px;color:#6B7280;margin:12px 0 0}' +
      '.warn{font-size:12px;color:#92400E;background:#FEF3C7;border:1px solid #FDE68A;' +
        'border-radius:6px;padding:9px 11px;margin:12px 0 0}' +
    '</style></head><body>' +
    (intro ? '<p>' + escHtml_(intro) + '</p>' : '') +
    '<a class="go" href="' + u + '" target="_blank" rel="noopener">Open ' + escHtml_(PRODUCT_NAME) + ' →</a>' +
    '<div class="row"><input id="u" type="text" readonly value="' + u + '">' +
    '<button id="c" onclick="copiar()">Copy link</button></div>' +
    '<p class="note">Opens in a new tab. Bookmark it once and you will not need ' +
      'this spreadsheet again.</p>' +
    (aviso ? '<p class="warn">' + escHtml_(aviso) + '</p>' : '') +
    '<script>' +
      'function copiar(){' +
        'var i=document.getElementById("u"),b=document.getElementById("c"),ok=false;' +
        'i.focus();i.select();i.setSelectionRange(0,i.value.length);' +
        'try{ok=document.execCommand("copy");}catch(e){ok=false;}' +
        'if(ok){hecho(b);return;}' +
        'try{navigator.clipboard.writeText(i.value).then(function(){hecho(b);},' +
          'function(){fallo(b);});}catch(e){fallo(b);}' +
      '}' +
      'function hecho(b){b.textContent="Copied";setTimeout(function(){b.textContent="Copy link";},2000);}' +
      

      'function fallo(b){b.textContent="Press Ctrl+C";' +
        'setTimeout(function(){b.textContent="Copy link";},3000);}' +
    '<\/script></body></html>';
  ui.showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(480).setHeight(aviso ? 330 : 250),
    titulo);
}



function avisoDeEnlaceEnTexto_(titulo, url, intro, aviso) {
  SpreadsheetApp.getUi().alert(titulo,
    (intro ? intro + '\n\n' : '') + url + (aviso ? '\n\n' + aviso : ''),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function mostrarEnlaceDeLaApp_(titulo, url, intro, aviso) {
  try { pintarEnlaceEnVentana_(titulo, url, intro, aviso); }
  catch (e) {
    Logger.log('pintarEnlaceEnVentana_: ' + (e && e.message));
    avisoDeEnlaceEnTexto_(titulo, url, intro, aviso);
  }
}

function menuActivateWebApp() {
  var ui = SpreadsheetApp.getUi();    
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  try {
    var url = selfActivateWebApp_();
    mostrarEnlaceDeLaApp_('✅ Update published!', url,
      'This address never changes — publishing again updates the same one.', '');
  } catch (e) {
    ui.alert('Could not publish automatically: ' + e.message +
      '\n\nThis is expected unless this copy is linked to a standard Google Cloud project.' +
      '\nUse the normal path instead: Extensions → Apps Script → Deploy → Manage deployments → ✏️ → Version: New version → Deploy.');
    throw e;
  }
}



function selfActivateWebApp_() {
  var projectId = ScriptApp.getScriptId();

  





















  var versionNumber = _scriptApiRequest_(projectId, 'versions', 'post',
    { description: PRODUCT_NAME + ' v' + APP_VERSION +
                   (typeof APP_BUILD === 'string' && APP_BUILD ? ' · build ' + APP_BUILD : '') +
                   ' · ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
    }).versionNumber;

  var deploymentId = _findWebAppDeploymentId_(projectId);
  
  
  var configBody = { versionNumber: versionNumber, description: _WEBAPP_DEPLOYMENT_MARKER };

  
  
  
  var output = deploymentId
    ? _scriptApiRequest_(projectId, 'deployments/' + deploymentId, 'put', { deploymentConfig: configBody })
    : _scriptApiRequest_(projectId, 'deployments', 'post', configBody);

  var entryPoints = output.entryPoints || [];
  for (var i = 0; i < entryPoints.length; i++) {
    if (entryPoints[i].webApp) {
      var url = entryPoints[i].webApp.url;
      



















      try { saveWebAppUrl(url); } catch (e3) { Logger.log('saveWebAppUrl: ' + e3.message); }
      







      try {
        var pr = PropertiesService.getScriptProperties();
        var vueltaVieja = String(pr.getProperty('OAUTH_REDIRECT_URI') || '').trim();
        if (vueltaVieja && idDeDespliegue_(vueltaVieja) &&
            idDeDespliegue_(vueltaVieja) !== idDeDespliegue_(url)) {
          pr.setProperty('OAUTH_REDIRECT_URI', url);
          auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'OAUTH_REDIRECT_FIXED', 'system',
            'Sign-in return address pointed at an older deployment', vueltaVieja, url);
        }
      } catch (e4) { Logger.log('OAUTH_REDIRECT_URI: ' + e4.message); }
      try {
        MailApp.sendEmail(Session.getActiveUser().getEmail(), '✅ Your ' + PRODUCT_NAME + ' system is ready',
          'Your warehouse system is live at:\n\n' + url +
          '\n\nBookmark it — it is also always available from the Google Sheet menu: 🏭 ' + PRODUCT_NAME + ' → Open WMS App.');
      } catch (e2) {   }
      return url;
    }
  }
  throw new Error('Deployment created but no web app URL was returned — check Extensions → Apps Script → Deploy for details.');
}




function _findWebAppDeploymentId_(projectId) {
  var output = _scriptApiRequest_(projectId, 'deployments', 'get');
  var deployments = output.deployments || [];
  for (var i = 0; i < deployments.length; i++) {
    if (deployments[i].deploymentConfig && deployments[i].deploymentConfig.description === _WEBAPP_DEPLOYMENT_MARKER) {
      return deployments[i].deploymentId;
    }
  }
  return null;
}



function _scriptApiRequest_(projectId, resourcePath, method, payload) {
  var url = 'https://script.googleapis.com/v1/projects/' + projectId + '/' + resourcePath;
  var options = {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  if (method && method !== 'get') {
    options.method = method;
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload || {});
  }
  var resp = UrlFetchApp.fetch(url, options);
  var code = resp.getResponseCode();
  var body = JSON.parse(resp.getContentText() || '{}');
  if (code >= 300) {
    throw new Error((body.error && body.error.message) || ('Apps Script API error ' + code));
  }
  return body;
}

function menuRunBackupNow() {
  var ui = SpreadsheetApp.getUi();    
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  ensureBackupTrigger_();
  var res = runBackupNow_();
  ui.alert('✓ Backup created right now: ' + res.name +
    '\n\nEach click of this menu item makes one extra copy immediately, on top of ' +
    'the automatic one — so click it before anything risky (a bulk import, a big edit).' +
    '\n\nSeparately, an automatic backup runs every night at 2am. Copies are kept for ' +
    BACKUP_RETENTION_DAYS + ' days, then deleted, in a Drive folder called "' +
    backupFolderName_() + '". The nightly schedule is already set — you never need to ' +
    'come back here just to keep it running.');
}












function menuRevokePublicSharing() {
  var ui = SpreadsheetApp.getUi();    
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });

  
  
  
  
  
  var roots;
  try {
    roots = DriveApp.getFoldersByName(docsFolderName_());
  } catch (e) {
    ui.alert('Nothing to do.\n\nThis installation uses the restricted Drive permission ' +
             '(drive.file), which means its files were never publicly shared — there is ' +
             'no legacy sharing to revoke.');
    return;
  }
  if (!roots.hasNext()) {
    ui.alert('No ' + docsFolderName_() + ' folder found in Drive — nothing to clean up.');
    return;
  }

  var startTime       = Date.now();
  var TIME_BUDGET_MS  = 4.5 * 60 * 1000;   
  var checked = 0, revoked = 0, failed = 0, timedOut = false;

  function walk(folder) {
    var files = folder.getFiles();
    while (files.hasNext()) {
      if (Date.now() - startTime > TIME_BUDGET_MS) { timedOut = true; return; }
      var file = files.next();
      checked++;
      try {
        var access = file.getSharingAccess();
        if (access === DriveApp.Access.ANYONE_WITH_LINK || access === DriveApp.Access.ANYONE) {
          file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
          revoked++;
        }
      } catch (e) {
        failed++;
        Logger.log('menuRevokePublicSharing: could not update ' + file.getId() + ': ' + e.message);
      }
    }
    var subfolders = folder.getFolders();
    while (subfolders.hasNext() && !timedOut) walk(subfolders.next());
  }

  walk(roots.next());

  var msg = 'Checked ' + checked + ' file(s). Made ' + revoked + ' private.' +
            (failed ? ' ' + failed + ' could not be changed — see Executions log.' : '');
  msg += timedOut
    ? '\n\n⏱ Stopped early to stay under the 6-minute limit. Run this menu item again to continue — files already made private are skipped quickly.'
    : '\n\n✓ Done. Nothing under ' + docsFolderName_() + ' is publicly shared anymore.';
  ui.alert(msg);
}














var TEMPLATE_DATA_SHEETS = [
  'MASTER_ARCHIVE_V3', 'LIVE_STOCK', 'SITE_STOCK', 'WASTED_STOCK', 'RESERVATIONS',
  'AUDIT_LOG', 'ERROR_LOG', 'ARCHIVE_HISTORY', 'USERS_V3', 'INCOMING_V3',
  'RACK_PHOTOS', 'PM_DIRECTORY', 'MATERIAL_LOCKS'
];




var TEMPLATE_WIPE_PROPS = [
  'COMPANY_NAME', 'COMPANY_DOMAIN', 'COMPANY_LOGO_ID', 'FOLDER_PREFIX',
  'FOLDER_PREFIX_HISTORY', 'SETUP_COMPLETE', 'WEB_APP_URL', 'SESSION_SECRET',
  'WMS_SESSIONS', 'WMS_MONITORED_MATERIALS', 'GMAIL_SCAN_ENABLED',
  'ERROR_ALERTS_ENABLED', 'GEMINI_API_KEY',
  'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_URI',
  'COLUMN_PREFS'
];












var PROPERTY_GUIDE = [
  { key:'FOLDER_PREFIX', sev:'CRITICAL',
    what:'Names the Drive folders holding every document and photo ever attached.',
    lost:'Attachments stop opening — the app looks in a folder that is not the one they are in.' },
  { key:'SETUP_COMPLETE', sev:'IMPORTANT',
    what:'Marks setup as finished.',
    lost:'The menu offers to run setup again and treats this as a fresh copy.' },
  { key:'COMPANY_NAME', sev:'COSMETIC',
    what:'Your company name in the header, the browser tab and outgoing email.',
    lost:'The app says "Warehouse". Re-enter it in Settings › Company.' },
  { key:'COMPANY_DOMAIN', sev:'IMPORTANT',
    what:'Recognises your own staff by their email domain.',
    lost:'Staff are asked to sign in with Google instead of being recognised.' },
  { key:'COMPANY_LOGO_ID', sev:'COSMETIC',
    what:'Your logo.', lost:'No logo. Upload it again in Settings › Company.' },
  { key:'FAVICON_URL', sev:'COSMETIC',
    what:'The browser-tab icon. Must be a PUBLIC https:// image — Google fetches it itself, so a private Drive file or a data: URI will not work. Unset means Google\'s own default icon.',
    lost:'The tab shows the generic Apps Script icon again. Nothing else changes.' },
  { key:'ROLE_PERMS_WAREHOUSE', sev:'OPTIONAL',
    what:'Extra permissions an admin turned on for the WAREHOUSE role (Settings → Permissions).',
    lost:'Nothing missing — absent just means every toggle is at its default.' },
  { key:'WAREHOUSE_ROLE_LABEL', sev:'OPTIONAL',
    what:'The display name an admin chose for the WAREHOUSE role (e.g. "Supervisor"), Settings → Permissions.',
    lost:'Nothing missing — absent just means the role shows as "Warehouse", the default.' },
  { key:'SUPPORT_EMAIL', sev:'OPTIONAL',
    what:'Where bug reports and check-in alerts go, in addition to this installation\'s own admin.',
    lost:'Nothing breaks — reports go to the admin only, and check-in alerts have nowhere to go so they never send.' },
  { key:'SETUP_COMPLETED_AT', sev:'AUTO',
    what:'When setup finished — used only to time the check-in alerts above.',
    lost:'Recreated automatically as "now" the next time the check-in runs.' },
  { key:'CHECKIN_MILESTONES_SENT', sev:'OPTIONAL',
    what:'Which check-in alerts have already been sent, so none repeats.',
    lost:'Nothing lost by its absence; if cleared, past milestones could re-fire once.' },
  { key:'LAST_BACKUP_AT', sev:'AUTO',
    what:'When the most recent backup ran — shown in Settings → System so "is this actually backing up?" doesn\'t depend on scrolling far enough back in the audit log.',
    lost:'The System tab just stops showing a last-backup time until the next one runs. The backups themselves live in Drive and are untouched.' },
  { key:'LAST_BACKUP_NAME', sev:'AUTO',
    what:'The file name of the most recent backup, shown next to LAST_BACKUP_AT.',
    lost:'Same as LAST_BACKUP_AT — cosmetic only, recreated on the next backup.' },
  { key:'LAST_BACKUP_FILE_ID', sev:'AUTO',
    what:'Drive file ID of the most recent backup, used for the "Open in Drive" link in Settings → System.',
    lost:'That one link stops working until the next backup; every backup file in Drive is still there and still openable by hand.' },
  { key:'WEB_APP_URL', sev:'IMPORTANT',
    what:'The /exec address your team opens.',
    lost:'Setup shows the wrong link again, and bug reports cannot say where the app lives.' },
  { key:'SESSION_SECRET', sev:'AUTO',
    what:'Signs sign-in tokens. Recreated automatically.',
    lost:'Everyone who signed in with Google has to sign in once more. Nothing else.' },
  { key:'WMS_SESSIONS', sev:'AUTO',
    what:'Who is currently signed in.', lost:'Same — one extra sign-in.' },
  { key:'WMS_MONITORED_MATERIALS', sev:'RECOVERABLE',
    what:'Which materials have a minimum-stock alert, and at what level.',
    lost:'Low-stock alerts stop. Set them again from ⚙ Stock Alerts.' },
  { key:'COLUMN_PREFS', sev:'RECOVERABLE',
    what:'Your renamed column headings.', lost:'Headings go back to their default names.' },
  { key:'GEMINI_API_KEY', sev:'RECOVERABLE',
    what:'Key for the AI document reader.', lost:'AI Extract stops working. Paste the key back.' },
  { key:'OAUTH_CLIENT_ID', sev:'RECOVERABLE',
    what:'Lets people OUTSIDE your domain sign in.', lost:'Only your own domain can get in.' },
  { key:'OAUTH_CLIENT_SECRET', sev:'RECOVERABLE', what:'Pairs with the client ID.', lost:'Same.' },
  { key:'OAUTH_REDIRECT_URI', sev:'AUTO',
    what:'Where Google returns after an external sign-in.',
    lost:'Refilled automatically the next time the /exec link is saved in setup.' },
  { key:'ERROR_ALERTS_ENABLED', sev:'OPTIONAL',
    what:'Set to false to stop error emails.', lost:'Alerts are on, which is the default.' },
  { key:'GMAIL_SCAN_ENABLED', sev:'OPTIONAL',
    what:'Legacy flag. The scanner has no UI.', lost:'Nothing.' },
  { key:'FOLDER_PREFIX_HISTORY', sev:'IMPORTANT',
    what:'Older folder names, so documents filed under a previous company name still open.',
    lost:'Attachments from before a rename stop opening.' }
];



function detectFolderPrefixes_() {
  var found = {};
  try {
    var it = DriveApp.searchFolders('title contains "_Docs"');
    while (it.hasNext()) {
      var name = it.next().getName();
      var m = name.match(/^(.+)_Docs$/);
      if (m) found[m[1]] = true;
    }
  } catch (e) {}
  return Object.keys(found);
}
















function menuProbarArchivado() {
  var ui = SpreadsheetApp.getUi();
  









  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r;
  try {
    r = archiveOldMovements(ss, { ensayo: true });
  } catch (e) {
    ui.alert('The test itself could not run', String(e && e.message || e), ui.ButtonSet.OK);
    return;
  }

  ui.alert('🌙 Nightly archive — rehearsal',
           informeDeArchivado_(r, true).join('\n'), ui.ButtonSet.OK);
}














function informeDeArchivado_(r, ensayo) {
  var inf = (r && r.informe) || { pasos: [] };
  var L = [];

  L.push('RESULT: ' + String(r && r.status || '?').toUpperCase());
  L.push('');
  L.push(ensayo
    ? 'NOTHING WAS WRITTEN. This is a rehearsal of tonight\'s job.'
    : 'THIS WAS THE REAL RUN. Both sheets have been rewritten.');
  L.push('');

  if (inf.modeloAncho) {
    L.push('SHEET WIDTHS — this is what the "23 vs 20" error is about');
    L.push('  The row model needs   : ' + inf.modeloAncho + ' columns');
    L.push('  MASTER_ARCHIVE_V3 has : ' + inf.archivoAncho +
           (inf.archivoAnchoTras && inf.archivoAnchoTras !== inf.archivoAncho
             ? ' → widened to ' + inf.archivoAnchoTras : '') +
           '   (last column in use: ' + inf.archivoUltima + ')');
    L.push('  ARCHIVE_HISTORY has   : ' + inf.histAncho +
           (inf.histAnchoTras && inf.histAnchoTras !== inf.histAncho
             ? ' → widened to ' + inf.histAnchoTras : '') +
           '   (last column in use: ' + inf.histUltima + ')');
    L.push('');
    L.push(ensayo ? 'MOVEMENTS RIGHT NOW' : 'MOVEMENTS BEFORE THIS RUN');
    L.push('  Recent list      : ' + inf.archivoFilas);
    L.push('  Archived history : ' + inf.histFilas);
    L.push('');
  }

  if (inf.corteMeses !== undefined) {
    L.push('CUTOFF');
    L.push('  ' + inf.corteMeses + ' month(s) — anything before ' + inf.corteFecha +
           ' counts as old.');
    


    if (inf.sueloDias && inf.sueloAplicado) {
      L.push('  ⓘ The last ' + inf.sueloDias + ' days are never archived, whatever the ' +
             'cutoff says, so');
      L.push('    the cutoff used here is ' + inf.corteFecha + ' and not the date your ' +
             'setting asks for.');
    }
    L.push((ensayo ? '  Would move OUT of the recent list : '
                   : '  Moved OUT of the recent list : ') + inf.seArchivan);
    L.push((ensayo ? '  Would come back IN                : '
                   : '  Came back IN                 : ') + inf.seDevuelven);
    L.push((ensayo ? '  Would stay                        : '
                   : '  Stayed                       : ') + inf.seQuedan);
    L.push('');
  }

  if (inf.quedariaEnArchivo !== undefined) {
    L.push(ensayo ? 'AFTER TONIGHT IT WOULD LEAVE' : 'IT NOW LEAVES');
    L.push('  Recent list      : ' + inf.quedariaEnArchivo);
    L.push('  Archived history : ' + inf.quedariaEnHistoria);
    if (inf.quedariaEnArchivo === 0 && inf.quedariaEnHistoria > 0) {
      L.push('');
      L.push('  ⚠ The recent list ' + (ensayo ? 'would end up' : 'is now') + ' EMPTY. ' +
             'Nothing ' + (ensayo ? 'would be' : 'was') + ' lost —');
      L.push('    it all moves to the archived history — but the app will look');
      L.push('    blank until you press "Load Older History". If that is not');
      L.push('    what you want, raise the cutoff in Settings.');
    }
    L.push('');
  }

  if (inf.error) {
    L.push('✗ WHAT FAILED');
    L.push('  ' + inf.error);
    if (inf.stack) { L.push(''); L.push('  ' + inf.stack); }
    L.push('');
  }

  if (inf.pasos && inf.pasos.length) {
    L.push('STEP BY STEP');
    inf.pasos.forEach(function (t) { L.push('  · ' + t); });
  }

  return L;
}



















function menuArchivarAhora() {
  var ui = SpreadsheetApp.getUi();
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var previo;
  try {
    previo = archiveOldMovements(ss, { ensayo: true });
  } catch (e) {
    ui.alert('It could not even be rehearsed',
             String(e && e.message || e) +
             '\n\nNothing was written. Nothing to undo.', ui.ButtonSet.OK);
    return;
  }

  var inf = (previo && previo.informe) || {};

  


  if (previo && previo.status === 'noop') {
    ui.alert('Nothing to archive right now',
      'No movement crosses the ' + inf.corteMeses + '-month cutoff, so the job ' +
      'would move nothing in either direction.\n\n' +
      'Recent list      : ' + inf.archivoFilas + '\n' +
      'Archived history : ' + inf.histFilas, ui.ButtonSet.OK);
    return;
  }

  var resp = ui.alert('Run the archive NOW?',
    'This runs tonight\'s job right now and rewrites both movement sheets.\n\n' +
    '  Would move OUT of the recent list : ' + inf.seArchivan + '\n' +
    '  Would come back IN                : ' + inf.seDevuelven + '\n' +
    '  Would stay                        : ' + inf.seQuedan + '\n\n' +
    'Afterwards: ' + inf.quedariaEnArchivo + ' in the recent list, ' +
    inf.quedariaEnHistoria + ' in the archived history.\n\n' +
    'NOTHING LEAVES THE SPREADSHEET. Archived movements move to ARCHIVE_HISTORY, ' +
    'where the app can still read them with "Load Older History". There is also ' +
    'the 2am backup.\n\nRun it?', ui.ButtonSet.YES_NO);

  if (resp !== ui.Button.YES) {
    ui.alert('Nothing was done.', 'The archive was not run. Both sheets are ' +
             'exactly as they were.', ui.ButtonSet.OK);
    return;
  }

  var r;
  try {
    r = archiveOldMovements(ss);
  } catch (e) {
    




    ui.alert('▶️ The archive FAILED',
      String(e && e.message || e) + '\n\n' +
      'The rows are written BEFORE anything is cleared, so a failed write does ' +
      'not empty the sheet. Open ERROR_LOG: the newest row carries the version, ' +
      'the sheet widths and the step-by-step trail up to the exact write that ' +
      'failed.\n\nSend me that row.', ui.ButtonSet.OK);
    return;
  }

  ui.alert('▶️ Archive — real run',
           informeDeArchivado_(r, false).join('\n'), ui.ButtonSet.OK);
}

function menuCheckInstallation() {
  var ui = SpreadsheetApp.getUi();
  var p  = PropertiesService.getScriptProperties();
  var missing = [], ok = [], repaired = [];

  PROPERTY_GUIDE.forEach(function (g) {
    var v = String(p.getProperty(g.key) || '').trim();
    if (v) { ok.push(g.key); return; }
    missing.push(g);
  });

  
























  try {
    var hojas = ensureCoreSheets_(SpreadsheetApp.getActiveSpreadsheet());
    if (hojas && hojas.created && hojas.created.length) {
      repaired.push('Missing tabs created: ' + hojas.created.join(', '));
    }
    if (hojas && hojas.repaired && hojas.repaired.length) {
      repaired.push('Column names filled in: ' + hojas.repaired.join(', ') +
        ' — a column with no name looks like junk, and sooner or later somebody ' +
        'deletes it.');
    }
  } catch (eHojas) {
    repaired.push('Could not check the tabs: ' + (eHojas && eHojas.message));
  }

  
  if (!String(p.getProperty('SESSION_SECRET') || '').trim()) {
    serverSecret_();                       
    repaired.push('SESSION_SECRET — recreated');
  }
  var url = String(p.getProperty('WEB_APP_URL') || '').trim();
  if (url && !String(p.getProperty('OAUTH_REDIRECT_URI') || '').trim()) {
    p.setProperty('OAUTH_REDIRECT_URI', url);
    repaired.push('OAUTH_REDIRECT_URI — set from your saved app link');
  }

  

















  var vuelta = String(p.getProperty('OAUTH_REDIRECT_URI') || '').trim();
  var idApp = idDeDespliegue_(url), idVuelta = idDeDespliegue_(vuelta);
  if (idApp && idVuelta && idApp !== idVuelta) {
    p.setProperty('OAUTH_REDIRECT_URI', url);
    repaired.push('OAUTH_REDIRECT_URI pointed at a DIFFERENT deployment (' +
      idVuelta.substring(0, 12) + '… instead of ' + idApp.substring(0, 12) + '…), so ' +
      'signing in opened a window that could never come back. Reset to your live app ' +
      'link.\n      One thing left to check outside: in Google Cloud Console → ' +
      'Credentials → your OAuth client, that same link must be listed under ' +
      '"Authorized redirect URIs".');
  }
  
  if (String(p.getProperty('SETUP_COMPLETE') || '') !== 'true') {
    var users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS_V3');
    var hasAdmin = false;
    if (users && users.getLastRow() > 1) {
      users.getDataRange().getValues().slice(1).forEach(function (r) {
        if (String(r[3] || '').toUpperCase().trim() === 'ADMIN') hasAdmin = true;
      });
    }
    if (hasAdmin) { p.setProperty('SETUP_COMPLETE', 'true'); repaired.push('SETUP_COMPLETE — you already have an admin, so setup is done'); }
  }

  
  
  
  
  
  
  
  
  
  var wantTriggers = [
    { fn: 'dailyBackupTrigger',        install: ensureBackupTrigger_,
      what: 'Nightly backup of your data (2 AM)' },
    { fn: 'archiveOldMovementsTrigger', install: ensureArchiveTrigger_,
      what: 'Moves old movements to the archive (3 AM)' },
    { fn: 'dailyCheckinTrigger',       install: ensureCheckinTrigger_,
      what: 'Private check-in to your support address' }
  ];
  
  
  
  
  
  
  var triggerNotes = [];
  try {
    var installed = {};
    ScriptApp.getProjectTriggers().forEach(function (t) { installed[t.getHandlerFunction()] = true; });
    wantTriggers.forEach(function (w) {
      if (installed[w.fn]) return;
      try {
        w.install();
        repaired.push(w.what + ' — was not scheduled, reinstalled now');
        if (w.fn === 'dailyBackupTrigger') p.deleteProperty('BACKUP_TRIGGER_ERROR');
      } catch (e) {
        triggerNotes.push('  • ' + w.what + '\n      Could not be scheduled: ' + e.message);
      }
    });
  } catch (e) {
    
    
    triggerNotes.push('  • Could not read the scheduled jobs: ' + e.message);
  }

  try {
    var drCfg   = dailyReportSettings_();
    var drState = ensureDailyReportTrigger_();
    if (drState === 'installed' || drState === 'rescheduled') {
      repaired.push('Daily movement report — ' +
        (drState === 'rescheduled'
          ? 'was scheduled for the wrong time, moved to '
          : 'was not scheduled, set for ') + drCfg.hour + ':00');
    }
    if (drCfg.enabled && !dailyReportRecipients_().length) {
      triggerNotes.push('  • The daily movement report is ON but has nobody to send to.\n' +
                        '      Settings → Daily report → add at least one address.');
    }
  } catch (e) {
    triggerNotes.push('  • Could not check the daily movement report: ' + e.message);
  }
  
  
  var backupErr = String(p.getProperty('BACKUP_TRIGGER_ERROR') || '').trim();
  if (backupErr) {
    triggerNotes.push('  • The nightly backup failed to schedule during setup:\n      ' + backupErr);
  }

  









  var fmtChk = null;
  try {
    fmtChk = aplicarFormatoEstandar_(SpreadsheetApp.getActiveSpreadsheet(), { completo: false });
  } catch (e) {}
  if (fmtChk && (fmtChk.pestanas || fmtChk.cabeceras || fmtChk.notas || fmtChk.protegidas)) {
    var puestas = [];
    if (fmtChk.pestanas)   puestas.push(fmtChk.pestanas + ' tab colour(s)');
    if (fmtChk.cabeceras)  puestas.push(fmtChk.cabeceras + ' header row(s)');
    if (fmtChk.notas)      puestas.push(fmtChk.notas + ' "rebuilt by the app" note(s)');
    if (fmtChk.protegidas) puestas.push(fmtChk.protegidas + ' warning-only protection(s)');
    repaired.push('Sheet formatting — ' + puestas.join(', ') +
                  ' restored. Column widths and tab order left as you have them.');
  }

  



  var usrChk = null;
  try { usrChk = revisarUsuarios_(SpreadsheetApp.getActiveSpreadsheet(), true); } catch (e) {}
  if (usrChk && usrChk.migrados.length) {
    repaired.push('User list — ' + usrChk.migrados.length + ' person(s) were signing in ' +
      'through the OLD list in CONFIG, where you could not see or stop them. They are ' +
      'now real users: ' + usrChk.migrados.slice(0, 6).join(', ') +
      (usrChk.migrados.length > 6 ? ' …and ' + (usrChk.migrados.length - 6) + ' more' : '') +
      '. Open ⚙️ App Settings → Manage Users and switch off anyone who should not be there.');
  }

  


  var cfgFila2 = [];
  try { cfgFila2 = revisarConfigFila2_(SpreadsheetApp.getActiveSpreadsheet()); } catch (e) {}

  var lines = [];
  if (repaired.length) lines.push('REPAIRED AUTOMATICALLY\n  • ' + repaired.join('\n  • ') + '\n');
  if (cfgFila2.length) {
    lines.push('VALUES IN CONFIG THAT THE APP IS NOT READING');
    cfgFila2.forEach(function (c) {
      lines.push('  • CONFIG column ' + c.col + ' ("' + c.nombre + '") has something in row' +
        (c.filas.length === 1 ? ' ' : 's ') + c.filas.slice(0, 8).join(', ') +
        (c.filas.length > 8 ? ' …and ' + (c.filas.length - 8) + ' more' : '') + '.\n' +
        '      Unlike the other columns, this one is read from ROW 2 ONLY — it is a single ' +
        'setting, not a list.\n' +
        '      In use right now: ' + (c.enUso ? '"' + c.enUso + '" (row 2)' : 'NOTHING — row 2 is empty') +
        '.\n' +
        '      Everything below row 2 is ignored, so it is ' + c.para + ' for nobody. ' +
        'Move the value you want up to row 2 and clear the rest.');
    });
    lines.push('');
  }
  if (usrChk && (usrChk.rolesDistintos.length || usrChk.corruptas.length)) {
    lines.push('THE USER LIST NEEDS A LOOK');
    usrChk.rolesDistintos.forEach(function (d) {
      lines.push('  • ' + d.email + ' is ' + d.users + ' in Manage Users but ' + d.config +
                 ' in the old CONFIG list.\n      Manage Users is the one that counts. ' +
                 'The old row is ignored now, but tidy it up so it cannot confuse anyone.');
    });
    usrChk.corruptas.forEach(function (c) {
      lines.push('  • Row ' + c.fila + ' of USERS_V3 has "' + c.valor + '" where an email ' +
                 'should be.\n      It can never match anybody, so it grants nothing — but it ' +
                 'shows up in Manage Users. Fix or delete that row.');
    });
    lines.push('');
  }
  if (triggerNotes.length) {
    lines.push('SCHEDULED JOBS THAT NEED ATTENTION');
    triggerNotes.forEach(function (n) { lines.push(n); });
    lines.push('');
  }

  var stillMissing = missing.filter(function (g) {
    return !(repaired.join(' ').indexOf(g.key) !== -1);
  });

  if (!stillMissing.length) {
    lines.push('Everything the app needs is present.');
  } else {
    var bySev = { CRITICAL:[], IMPORTANT:[], RECOVERABLE:[], COSMETIC:[], OPTIONAL:[], AUTO:[] };
    stillMissing.forEach(function (g) { (bySev[g.sev] || bySev.OPTIONAL).push(g); });
    ['CRITICAL','IMPORTANT','RECOVERABLE','COSMETIC','OPTIONAL','AUTO'].forEach(function (sev) {
      if (!bySev[sev].length) return;
      lines.push(sev);
      bySev[sev].forEach(function (g) {
        lines.push('  • ' + g.key + '\n      ' + g.what + '\n      Without it: ' + g.lost);
      });
      lines.push('');
    });
  }

  
  
  if (!String(p.getProperty('FOLDER_PREFIX') || '').trim()) {
    var guesses = detectFolderPrefixes_();
    lines.push('FOLDER_PREFIX is missing. Your Drive has these document folders:');
    lines.push(guesses.length ? '  • ' + guesses.join('\n  • ') : '  (none found)');
    lines.push('Set FOLDER_PREFIX to the one your attachments are in — without the "_Docs".');
    lines.push('Project Settings › Script Properties › Add.');
  }

  
  
  
  
  var renamed = renamedAppFolders_();
  if (renamed.length) {
    lines.push('');
    lines.push('RENAMED FOLDERS (the app is still using them — nothing is lost)');
    renamed.forEach(function (r) {
      lines.push('  • "' + r.actual + '"\n      The app created this as "' + r.expected + '".');
    });
    lines.push('  Documents and photos keep opening: the app follows the folder');
    lines.push('  itself, not its name. Rename it back only if you want the four');
    lines.push('  folders to match each other again.');
  }

  ui.alert('🩺 ' + PRODUCT_NAME + ' — installation check', lines.join('\n'), ui.ButtonSet.OK);
}

function menuPrepareMasterTemplate() {
  var ui = SpreadsheetApp.getUi();    
  requireOwnerContext_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  
  
  
  var resp = ui.prompt(
    '💣 Erase everything in this file?',
    'This will PERMANENTLY delete all data in:\n\n' +
    '   ' + ss.getName() + '\n\n' +
    'Movements, stock, users, suppliers, projects, locations, photos, logs and\n' +
    'company settings — all of it. It cannot be undone.\n\n' +
    'Only do this on a COPY you are turning into the blank template customers\n' +
    'will copy. Never on the system you actually use.\n\n' +
    'Type  ERASE  to confirm:',
    ui.ButtonSet.OK_CANCEL);

  if (resp.getSelectedButton() !== ui.Button.OK) return;
  if (String(resp.getResponseText() || '').trim().toUpperCase() !== 'ERASE') {
    ui.alert('Cancelled — nothing was changed.');
    return;
  }

  var cleared = [], missing = [];
  TEMPLATE_DATA_SHEETS.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { missing.push(name); return; }
    var last = sh.getLastRow();
    
    if (last > 1) sh.getRange(2, 1, last - 1, sh.getMaxColumns()).clearContent();
    cleared.push(name + (last > 1 ? ' (' + (last - 1) + ')' : ' (0)'));
  });

  
  
  var cfg = ss.getSheetByName('CONFIG');
  if (cfg && cfg.getLastRow() > 1) {
    cfg.getRange(2, 1, cfg.getLastRow() - 1, cfg.getMaxColumns()).clearContent();
  }

  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var wiped = 0;
  Object.keys(all).forEach(function (k) {
    
    
    
    if (TEMPLATE_WIPE_PROPS.indexOf(k) !== -1 || k.indexOf('FOLDER_') === 0) {
      props.deleteProperty(k); wiped++;
    }
  });

  
  
  var triggersRemoved = 0;
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); triggersRemoved++; });
  } catch (e) {}

  try { ss.rename(PRODUCT_NAME + ' — Warehouse Template'); } catch (e) {}
  try { createStartHereSheet_(ss); } catch (e) {}

  



  var fmt = { pestanas:0, cabeceras:0, texto:[], anchos:0, saltadas:[], fallos:[] };
  try { fmt = aplicarFormatoEstandar_(ss, { completo: true }); } catch (e) {
    fmt.fallos.push(e.message);
  }

  ui.alert('✓ Template prepared',
    'Cleared: ' + cleared.join(', ') + '\n' +
    (missing.length ? 'Not present (fine): ' + missing.join(', ') + '\n' : '') +
    'CONFIG catalogs cleared.\n' +
    wiped + ' script propert(ies) removed.\n' +
    triggersRemoved + ' trigger(s) removed.\n\n' +
    'FORMATTING\n' +
    '· ' + fmt.pestanas + ' tab colour(s) set — navy reads, blue data, grey rebuilt, pale grey logs\n' +
    '· ' + fmt.cabeceras + ' header row(s) styled\n' +
    '· ' + fmt.texto.length + ' sheet(s) set to plain text, ' + fmt.anchos + ' column width(s)\n' +
    (fmt.saltadas.length ? '· Left alone (still had rows): ' + fmt.saltadas.join(', ') + '\n' : '') +
    (fmt.fallos.length ? '· NOT done: ' + fmt.fallos.join(' | ') + '\n' : '') +
    '\nNow run "Check if this copy is a clean template" to confirm, then share the\n' +
    'file with a /copy link.',
    ui.ButtonSet.OK);
}




function menuVerifyMasterTemplate() {
  var ui = SpreadsheetApp.getUi();
  requireOwnerContext_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var problems = [];

  TEMPLATE_DATA_SHEETS.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    var rows = sh.getLastRow() - 1;
    if (rows > 0) problems.push(name + ' still has ' + rows + ' row(s)');
  });

  var cfg = ss.getSheetByName('CONFIG');
  if (cfg && cfg.getLastRow() > 1) {
    var vals = cfg.getRange(2, 1, cfg.getLastRow() - 1, cfg.getMaxColumns()).getValues();
    var filled = 0;
    vals.forEach(function (r) { r.forEach(function (c) { if (String(c || '').trim()) filled++; }); });
    if (filled) problems.push('CONFIG still has ' + filled + ' filled cell(s)');
  }

  var props = PropertiesService.getScriptProperties().getProperties();
  Object.keys(props).forEach(function (k) {
    if (TEMPLATE_WIPE_PROPS.indexOf(k) !== -1 || k.indexOf('FOLDER_') === 0) {
      problems.push('Script property still set: ' + k);
    }
  });

  try {
    var t = ScriptApp.getProjectTriggers();
    if (t.length) problems.push(t.length + ' trigger(s) still installed');
  } catch (e) {}

  ui.alert(problems.length ? '⚠️ Not clean yet' : '✓ Clean template',
    problems.length
      ? 'A customer copying this file would receive:\n\n• ' + problems.join('\n• ') +
        '\n\nRun "Erase everything" first.'
      : 'Nothing personal left in this file.\n\n' +
        'Remaining steps, which code cannot do:\n' +
        '1. Apps Script editor → rename the project (top-left) to your product name.\n' +
        '2. Share the file as "Anyone with the link — Viewer".\n' +
        '3. Give customers the URL with /edit replaced by /copy.\n' +
        '4. Copy it yourself once and run the wizard, to see exactly what they see.',
    ui.ButtonSet.OK);
}









function statusForMoveType_(mt) {
  if (mt === 'EXIT')   return 'Dispatched';
  if (mt === 'WASTE')  return 'Damaged';
  if (mt === 'ADJUST') return 'Adjusted';
  return 'In Stock';    
}




















function adjustDirection_(srcKey, destKey) {
  if (srcKey  && !destKey) return -1;
  if (destKey && !srcKey)  return 1;
  return 0;
}











function menuNormalizeStatus() {
  var ui = SpreadsheetApp.getUi();    
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });

  var resp = ui.alert('Normalize the Status column?',
    'This rewrites Status so it always matches MoveType:\n\n' +
    '   ENTRY / RETURN / TRANSFER  →  In Stock\n' +
    '   EXIT                       →  Dispatched\n' +
    '   WASTE                      →  Damaged\n\n' +
    'Only mismatched cells are touched. Stock quantities are not affected — ' +
    'they are calculated from MoveType, not Status.\n\n' +
    'Run 🗄 Enable Daily Backup first if you want a restore point.\n\nContinue?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) { ui.alert('Archive sheet not found.'); return; }

  var lastRow = archive.getLastRow();
  if (lastRow < 2) { ui.alert('No movements to check.'); return; }

  var mtCol     = AC.MOVETYPE + 1;
  var statusCol = AC.STATUS   + 1;
  var mtVals     = archive.getRange(2, mtCol,     lastRow - 1, 1).getValues();
  var statusVals = archive.getRange(2, statusCol, lastRow - 1, 1).getValues();

  var fixed = 0, skippedAmbiguous = 0;
  for (var i = 0; i < mtVals.length; i++) {
    var rawMT = String(mtVals[i][0] || '').toUpperCase().trim();

    
    if (!rawMT || rawMT === 'IN STOCK') { skippedAmbiguous++; continue; }

    var mt = (rawMT === 'DISPATCHED' || rawMT === 'DISPATCH' || rawMT === 'DEL') ? 'EXIT' : rawMT;
    var want = statusForMoveType_(mt);
    if (String(statusVals[i][0] || '').trim() !== want) {
      statusVals[i][0] = want;
      fixed++;
    }
  }

  
  if (fixed) archive.getRange(2, statusCol, lastRow - 1, 1).setValues(statusVals.map(function(r){ return [textCell_(r[0])]; }));
  auditLog_(ss, 'STATUS_NORMALIZED', 'Spreadsheet menu', fixed + ' row(s)', '', '');

  ui.alert('✓ Done.\n\n' + fixed + ' Status cell(s) corrected.' +
    (skippedAmbiguous
      ? '\n\n' + skippedAmbiguous + ' older row(s) left untouched: they have no MoveType of ' +
        'their own, so their Status is the only record of what the movement was. ' +
        'Changing it would lose information.'
      : ''));
}

function menuReconcile() {
  
  
  
  var ui = SpreadsheetApp.getUi();
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  runReconciliation_(SpreadsheetApp.getActiveSpreadsheet());
  ui.alert('Reconciliation complete.');
}



















function menuOpenApp() {
  var ui = SpreadsheetApp.getUi();
  var p  = PropertiesService.getScriptProperties();
  var guardada = String(p.getProperty('WEB_APP_URL') || '').trim();
  var url = guardada, aviso = '';

  if (!url) {
    try { url = String(ScriptApp.getService().getUrl() || ''); } catch (e) { url = ''; }
    aviso = '\n\n⚠ THIS ADDRESS IS A GUESS, not a recorded one. On a spreadsheet ' +
            'copied from another one that was already published, Google hands back ' +
            'the ORIGINAL file\'s address here — which opens "Sorry, unable to open ' +
            'the file at this time".\n\n' +
            'To record the right one: 🔧 Advanced → Push Update Live, which writes ' +
            'it down for you. Or copy it from Extensions → Apps Script → Deploy → ' +
            'Manage deployments and paste it into the setup wizard.';
  }

  if (!url) {
    ui.alert('No web app address yet',
      'This copy has not been published. Extensions → Apps Script → Deploy → ' +
      'New deployment → Web app.', ui.ButtonSet.OK);
    return;
  }
  



  mostrarEnlaceDeLaApp_('🚀 Open ' + PRODUCT_NAME, url, '', aviso.replace(/^\n+/, ''));
}




function heartbeat(sessionToken) {
  
  
  var auth = getUserRole(sessionToken);
  if (!auth || auth.role === 'DENIED' || auth.role === 'NO_SESSION' || !auth.email) return [];

  
  
  
  
  if (!throttle_('hb', auth.email, 60, 300)) return [];

  var props    = PropertiesService.getScriptProperties();
  var raw      = props.getProperty('WMS_SESSIONS');
  var sessions = {};
  try { if (raw) sessions = JSON.parse(raw); } catch(e) {}

  var now    = new Date().getTime();
  var cutoff = now - 10 * 60 * 1000;   

  
  sessions[auth.email] = { email: auth.email, name: auth.name || '', role: auth.role, time: now };

  
  Object.keys(sessions).forEach(function(k) {
    var s = sessions[k];
    if (!k || !s || !s.email || s.role === 'NO_SESSION' || s.time < cutoff) delete sessions[k];
  });

  props.setProperty('WMS_SESSIONS', JSON.stringify(sessions));

  
  return Object.values(sessions).sort(function(a, b) { return b.time - a.time; });
}
























function pulse(sessionToken) {
  
  
  
  
  
  
  
  
  
  
  
  
  var auth = getUserRole(sessionToken);
  if (!auth || auth.role === 'DENIED' || auth.role === 'NO_SESSION' || !auth.email) {
    return { users: null, stamp: '' };
  }
  var users = [];
  try { users = heartbeat(sessionToken) || []; } catch (e) { users = []; }
  return {
    users: users.length ? users : null,
    stamp: dataStamp_()
  };
}













function ensureUsersSheet_(ss) {
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) {
    sheet = ss.insertSheet('USERS_V3');
    sheet.appendRow(['ID','Email','Name','Role','Added By','Added At','Active']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    sheet.setColumnWidth(2, 220);  
  }
  return sheet;
}
































function userDirectory_(ss) {
  var out = {};
  try {
    var sheet = (ss || SpreadsheetApp.getActiveSpreadsheet()).getSheetByName('USERS_V3');
    if (!sheet || sheet.getLastRow() < 2) return out;
    
    var rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      var mail = String(rows[i][0] || '').toLowerCase().trim();
      var name = String(rows[i][1] || '').trim();
      if (mail && name) out[mail] = name;
    }
  } catch (e) {
    
    
    Logger.log('userDirectory_: ' + e.message);
  }
  return out;
}

function getUsers(auth) {
  auth = requireAuth_('ADMIN');    
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
  
  basicNiega_('Users and roles');
  auth = requireAuth_('ADMIN');    
  var email = String(data.email || '').toLowerCase().trim();
  var name  = String(data.name  || '').trim();
  var role  = String(data.role  || 'WAREHOUSE').toUpperCase().trim();
  if (!email || email.indexOf('@') === -1) throw new Error('Valid email required.');
  if (ROLES.indexOf(role) === -1) throw new Error('Invalid role.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureUsersSheet_(ss);

  
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
  sheet.appendRow([id, textCell_(email), textCell_(name), textCell_(role), auth.email, now, true]);
  auditLog_(ss, 'ADD_USER', auth.email, email + ' as ' + role, '', '');

  var inv = (data.invite === false) ? { enviado: false, motivo: '' }
                                    : invitarUsuario_(ss, email, name, role, auth);
  return { status: 'success', id: id, invited: inv.enviado, inviteNote: inv.motivo };
}



















function invitarUsuario_(ss, email, name, role, auth) {
  
  if (basicApagado_()) return false;
  var url = savedWebAppUrl_();
  if (!url) {
    return { enviado: false, motivo: 'No invitation was sent: this installation has ' +
      'no saved app address yet. Open 🏭 ' + PRODUCT_NAME + ' → 🔧 Advanced → Push ' +
      'Update Live in the spreadsheet, which records it.' };
  }
  var empresa = '';
  try { empresa = String((companySettings_() || {}).name || '').trim(); } catch (e) {}
  var deQuien = String((auth && auth.name) || '').trim() || String((auth && auth.email) || '');
  var queHace = (role === 'VIEWER')    ? 'You can see everything in the warehouse, and you cannot change it.'
              : (role === 'ADMIN')     ? 'You have full access, including settings and users.'
              :                          'You can record movements in and out of the warehouse.';
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'You have been added to ' + (empresa ? empresa + ' — ' : '') + PRODUCT_NAME,
      name: (empresa || PRODUCT_NAME) + ' — ' + PRODUCT_NAME,
      replyTo: String((auth && auth.email) || ''),
      body:
        (name ? 'Hi ' + name + ',\n\n' : 'Hi,\n\n') +
        deQuien + ' has given you access to ' + (empresa ? empresa + "'s " : 'the ') +
        'warehouse system.\n\n' +
        'Open it here:\n' + url + '\n\n' +
        'Sign in with this Google account: ' + email + '\n' +
        queHace + '\n\n' +
        'Bookmark that address — it is the only thing you need. You do not need ' +
        'the spreadsheet.\n',
      htmlBody:
        '<div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:#1F2937">' +
        '<p>' + (name ? 'Hi ' + escHtml_(name) + ',' : 'Hi,') + '</p>' +
        '<p>' + escHtml_(deQuien) + ' has given you access to ' +
          (empresa ? escHtml_(empresa) + "'s" : 'the') + ' warehouse system.</p>' +
        '<p><a href="' + escHtml_(url) + '" style="display:inline-block;background:#2563EB;' +
          'color:#fff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:8px">' +
          'Open ' + escHtml_(PRODUCT_NAME) + '</a></p>' +
        '<p style="font-size:13px;color:#374151">Sign in with this Google account: <b>' +
          escHtml_(email) + '</b><br>' + escHtml_(queHace) + '</p>' +
        '<p style="font-size:13px;color:#6B7280">Bookmark that address — it is the only ' +
          'thing you need. You do not need the spreadsheet.</p>' +
        '<p style="font-size:12px;color:#9CA3AF;word-break:break-all">' + escHtml_(url) + '</p>' +
        '</div>'
    });
    try { auditLog_(ss, 'USER_INVITED', String((auth && auth.email) || ''), email, role, ''); } catch (e) {}
    return { enviado: true, motivo: '' };
  } catch (e) {
    try {
      logError_(ss, 'WARN', 'backend', 'invitarUsuario_', String((auth && auth.email) || ''),
        'Could not email the invitation to ' + email + ': ' + (e && e.message), null, '');
    } catch (e2) {}
    return { enviado: false, motivo: 'The user was added, but the invitation email could ' +
      'not be sent (' + (e && e.message ? e.message : 'unknown reason') + '). Send them ' +
      'the app address yourself.' };
  }
}
































function updateUser(data, auth) {
  
  basicNiega_('Users and roles');
  auth = requireAuth_('ADMIN');    
  var email = String(data.email || '').toLowerCase().trim();
  if (!email) throw new Error('Email required.');

  
  var nuevo = String((data.newEmail === undefined ? '' : data.newEmail) || '').toLowerCase().trim();
  if (nuevo === email) nuevo = '';

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) throw new Error('Users sheet not found.');

  if (nuevo) {
    
    
    if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(nuevo)) {
      throw new Error('That does not look like an email address: ' + nuevo);
    }
    if (email === String(auth.email || '').toLowerCase().trim()) {
      throw new Error('You cannot change your own email address — you would lose access ' +
                      'the moment it saved, and nobody could undo it from inside the app. ' +
                      'Ask another administrator, or add the new address as a second user.');
    }
  }

  var rows = sheet.getDataRange().getValues();

  
  
  if (nuevo) {
    for (var d = 1; d < rows.length; d++) {
      if (String(rows[d][1] || '').toLowerCase().trim() === nuevo) {
        


        throw new Error('That email is already registered on another row: ' + nuevo +
          '\n\nIf this row is a duplicate or a typo that should never have existed, ' +
          'open it and use "Delete permanently" instead of renaming it.');
      }
    }
  }

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1] || '').toLowerCase().trim() === email) {
      var rowNum = i + 1;
      if (nuevo)                     sheet.getRange(rowNum, 2).setValue(textCell_(nuevo));
      if (data.name !== undefined)   sheet.getRange(rowNum, 3).setValue(textCell_(String(data.name).trim()));
      if (data.role !== undefined)   sheet.getRange(rowNum, 4).setValue(textCell_(String(data.role).toUpperCase().trim()));
      if (data.active !== undefined) sheet.getRange(rowNum, 7).setValue(!!data.active);
      if (nuevo) {
        auditLog_(ss, 'CHANGE_USER_EMAIL', auth.email,
                  'Corrected a registered email address', email, nuevo);
      }
      auditLog_(ss, 'UPDATE_USER', auth.email,
                (nuevo || email) + ' → ' + (data.role || 'no role change'), '', '');
      return { status: 'success', email: nuevo || email };
    }
  }
  throw new Error('User not found: ' + email);
}

function removeUser(email, auth) {
  
  basicNiega_('Users and roles');
  auth = requireAuth_('ADMIN');    
  email = String(email || '').toLowerCase().trim();
  if (!email) throw new Error('Email required.');
  
  if (email === auth.email.toLowerCase()) throw new Error('You cannot remove your own account.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) throw new Error('Users sheet not found.');

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1] || '').toLowerCase().trim() === email) {
      
      sheet.getRange(i + 1, 7).setValue(false);
      auditLog_(ss, 'REMOVE_USER', auth.email, email, '', '');
      return { status: 'success' };
    }
  }
  throw new Error('User not found: ' + email);
}







































function deleteUserRow(data, auth) {
  auth = requireAuth_('ADMIN');
  var email = String((data && data.email) || '').toLowerCase().trim();
  if (!email) throw new Error('Email required.');
  if (email === String(auth.email || '').toLowerCase().trim()) {
    throw new Error('You cannot delete your own account. Ask another administrator.');
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) throw new Error('Users sheet not found.');

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1] || '').toLowerCase().trim() !== email) continue;

    



    auditLog_(ss, 'DELETE_USER_ROW', auth.email,
      'Permanently removed a user row', JSON.stringify(rows[i].slice(0, 7)), '');

    sheet.deleteRow(i + 1);

    var tambienEnConfig = false;
    try { tambienEnConfig = limpiarUsuarioDeConfig_(ss, email); }
    catch (e) { Logger.log('deleteUserRow, legacy list: ' + e.message); }

    return { status: 'success', email: email, removedFromLegacyList: tambienEnConfig };
  }
  throw new Error('User not found: ' + email);
}





function getSettings(auth) {
  
  
  
  
  
  
  
  
  auth = requireAuth_('WRITE');
  var c = loadConfig();
  return {
    categories: c.categories,
    projects:   c.projects,
    suppliers:  c.suppliers,
    locations:  c.locations.map(function(l){ return l.name; }),
    
    
    
    
    locationTypes: (function(){
      var m = {};
      c.locations.forEach(function(l){ m[l.name] = l.type || 'RACK'; });
      return m;
    })(),
    archiveCutoffMonths: c.archiveCutoffMonths,
    company: publicCompany_()       
  };
}






















function mergeLocations(data, auth) {
  auth = requireAuth_('ADMIN');
  var into = String(data.into || '').trim();
  if (!into) throw new Error('Pick the location to keep.');
  var from = (data.from || []).map(function (v) { return String(v || '').trim(); })
                              .filter(function (v) { return v && v.toUpperCase() !== into.toUpperCase(); });
  if (!from.length) throw new Error('Pick at least one other location to merge in.');
  return withStockLock_(function () { return mergeLocationsLocked_(data, auth, into, from); });
}
















function reapuntarColumna_(sheet, col, wanted, into) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var rango = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1);
  var vals  = rango.getValues();
  var n = 0;
  for (var i = 0; i < vals.length; i++) {
    var cur = String(vals[i][0] || '').trim();
    if (cur && wanted[cur.toUpperCase()]) { vals[i][0] = into; n++; }
  }
  if (n) rango.setValues(vals);
  return n;
}

function mergeLocationsLocked_(data, auth, into, from) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var wanted = {};
  from.forEach(function (v) { wanted[v.toUpperCase()] = true; });

  
  
  
  
  
  
  
  
  
  var storedInto = into;
  function keep(row, col) {
    var cur = String(row[col] || '').trim();
    return (cur && wanted[cur.toUpperCase()]) ? storedInto : null;
  }
  var rowsChanged = 0;
  [ss.getSheetByName(SHEETS.ARCHIVE), ensureArchiveHistorySheet_(ss)].forEach(function (sheet) {
    [AC.SRC_LOC, AC.DEST_LOC].forEach(function (col) {
      rowsChanged += rewriteArchiveColumn_(sheet, col, function (row) { return keep(row, col); });
    });
  });

  
  
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (cfg) {
    var rows = cfg.getDataRange().getValues();
    var names = [], types = [], sawInto = false;
    
    
    
    
    
    
    var intoType = '';
    for (var r0 = 1; r0 < rows.length; r0++) {
      if (String(rows[r0][3] || '').trim().toUpperCase() === into.toUpperCase()) {
        intoType = String(rows[r0][4] || '').trim().toUpperCase();
        break;
      }
    }
    for (var r = 1; r < rows.length; r++) {
      var nm = String(rows[r][3] || '').trim();
      if (!nm) continue;
      if (wanted[nm.toUpperCase()]) continue;
      if (nm.toUpperCase() === into.toUpperCase()) sawInto = true;
      names.push(nm);
      types.push(String(rows[r][4] || 'RACK').trim().toUpperCase() || 'RACK');
    }
    if (!sawInto) { names.push(into); types.push(intoType || 'RACK'); }
    writeConfigColumns_(cfg, 3, [names, types]);    
  }

  


























  var candadosMovidos = 0, fotosMovidas = 0;
  try { candadosMovidos = reapuntarColumna_(ss.getSheetByName('MATERIAL_LOCKS'), 4, wanted, storedInto); }
  catch (eL) { Logger.log('merge · MATERIAL_LOCKS: ' + eL.message); }
  try { fotosMovidas    = reapuntarColumna_(ss.getSheetByName('RACK_PHOTOS'),    0, wanted, storedInto); }
  catch (eF) { Logger.log('merge · RACK_PHOTOS: ' + eF.message); }
  if (candadosMovidos) { try { CacheService.getScriptCache().remove('materialLocksV1'); } catch (eC) {} }

  refreshOrDefer_(ss, data);
  auditLog_(ss, 'MERGE_LOCATIONS', auth.email, from.join(' + ') + ' → ' + into,
            String(rowsChanged) + ' cells',
            candadosMovidos || fotosMovidas
              ? (candadosMovidos + ' reservation(s), ' + fotosMovidas + ' photo(s) moved too')
              : '');
  return { status: 'success', rowsChanged: rowsChanged, into: into,
           locksMoved: candadosMovidos, photosMoved: fotosMovidas };
}












function columnPrefs_() {
  var raw = PropertiesService.getScriptProperties().getProperty('COLUMN_PREFS');
  if (!raw) return { labels: {}, hidden: [] };
  try {
    var o = JSON.parse(raw);
    return { labels: o.labels || {}, hidden: o.hidden || [] };
  } catch (e) {
    return { labels: {}, hidden: [] };
  }
}

function saveColumnPrefs(data, auth) {
  auth = requireAuth_('ADMIN');
  var labels = {}, hidden = [];

  
  
  var inLabels = (data && data.labels) || {};
  Object.keys(inLabels).forEach(function (k) {
    var v = String(inLabels[k] || '').trim();
    if (v) labels[String(k).substring(0, 40)] = v.substring(0, 40);
  });

  ((data && data.hidden) || []).forEach(function (k) {
    k = String(k || '').trim();
    if (k) hidden.push(k.substring(0, 40));
  });

  PropertiesService.getScriptProperties()
    .setProperty('COLUMN_PREFS', JSON.stringify({ labels: labels, hidden: hidden }));
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'UPDATE_CONFIG', auth.email,
    'columns', Object.keys(labels).length + ' renamed', hidden.length + ' hidden');
  return { status: 'success' };
}








function saveCompanyProfile(data, auth) {
  auth = requireAuth_('ADMIN');
  data = data || {};
  var p = PropertiesService.getScriptProperties();

  var name = String(data.name || '').trim();
  if (!name) throw new Error('Company name is required.');
  var before = companySettings_();
  p.setProperty('COMPANY_NAME', name);

  
  p.setProperty('COMPANY_DOMAIN', String(data.domain || '').trim().replace(/^@/, '').toLowerCase());

  
  
  
  

  if (data.removeLogo) {
    trashFileQuietly_(before.logoId);
    p.deleteProperty('COMPANY_LOGO_ID');
  } else if (data.logo && data.logo.fileData) {
    var bytes = Utilities.base64Decode(data.logo.fileData);
    var blob  = Utilities.newBlob(bytes, data.logo.fileMimeType || 'image/png', 'logo');
    var file  = getOrCreateFolder_(docsFolderName_()).createFile(blob);
    p.setProperty('COMPANY_LOGO_ID', file.getId());
    trashFileQuietly_(before.logoId);    
  }

  
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var wanted = name + ' — ' + PRODUCT_NAME;
    if (ss.getName() !== wanted) ss.rename(wanted);
    auditLog_(ss, 'UPDATE_CONFIG', auth.email, 'company', before.name || '(none)', name);
  } catch (e) {}

  return { status: 'success', company: publicCompany_() };
}




function trashFileQuietly_(fileId) {
  if (!fileId) return;
  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
}











function saveLocationLayout(data, auth) {
  auth = requireAuth_('ADMIN');
  var list = data && data.locations;
  if (!Array.isArray(list)) throw new Error('No locations provided.');

  var names = [], types = [], seen = {};
  for (var i = 0; i < list.length; i++) {
    var n = String((list[i] && list[i].name) || '').trim();
    if (!n) continue;
    var key = n.toUpperCase();
    if (seen[key]) continue;                        
    seen[key] = 1;
    names.push(n);
    types.push(String((list[i] && list[i].type) || 'RACK').trim().toUpperCase() || 'RACK');
  }
  if (!names.length) throw new Error('At least one location is required.');

  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('CONFIG sheet not found.');

  
  
  
  
  
  
  
  
  
  
  var removed = removedLocations_(cfg, seen);
  if (removed.length) {
    var use = locationUsage_(ss);
    for (var d = 0; d < removed.length; d++) {
      var why = locationBlockReason_(use, removed[d]);
      if (why) throw new Error('"' + removed[d] + '" cannot be deleted — ' + why +
                               '. Archive it instead.');
    }
  }

  writeConfigColumns_(cfg, 3, [names, types]);    

  
  
  if (removed.length) forgetRackPhotos_(ss, removed);

  auditLog_(ss, 'UPDATE_CONFIG', auth.email, 'locations',
            removed.length ? 'reorder + delete' : 'reorder',
            names.length + ' location(s)' +
            (removed.length ? ' — deleted ' + removed.join(', ') : ''));
  return { status: 'success', count: names.length, deleted: removed };
}




function removedLocations_(cfg, keep) {
  var lastRow = cfg.getLastRow();
  if (lastRow < 2) return [];
  var col = cfg.getRange(2, 4, lastRow - 1, 1).getValues();
  var out = [], seenGone = {};
  for (var i = 0; i < col.length; i++) {
    var n = String(col[i][0] || '').trim();
    if (!n) continue;
    var k = n.toUpperCase();
    if (keep[k] || seenGone[k]) continue;
    seenGone[k] = 1;
    out.push(n);
  }
  return out;
}






















function locationUsage_(ss) {
  var use = {};
  function slot(name) {
    var k = String(name || '').trim().toUpperCase();
    if (!k) return null;
    if (!use[k]) use[k] = { qty: 0, locked: 0, allowed: 0 };
    return use[k];
  }

  
  var live = ss.getSheetByName(SHEETS.LIVE);
  if (live && live.getLastRow() > 1) {
    var rows = live.getRange(2, 4, live.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      var q = Number(rows[i][1]) || 0;
      if (q <= 0) continue;
      var s = slot(rows[i][0]);
      if (s) s.qty += q;
    }
  }

  
  var locks = ss.getSheetByName('MATERIAL_LOCKS');
  if (locks && locks.getLastRow() > 1) {
    var lr = locks.getRange(2, 5, locks.getLastRow() - 1, 6).getValues();
    for (var j = 0; j < lr.length; j++) {
      if (String(lr[j][5] || '').toUpperCase() !== 'ACTIVE') continue;
      var sr = slot(lr[j][0]);
      if (sr) sr.locked++;
      String(lr[j][1] || '').split(',').forEach(function (dest) {
        var sd = slot(dest);
        if (sd) sd.allowed++;
      });
    }
  }
  return use;
}




function locationBlockReason_(use, name) {
  var u = use[String(name || '').trim().toUpperCase()];
  if (!u) return '';
  if (u.qty > 0) return 'it still holds ' + u.qty + ' unit(s)';
  if (u.locked)  return 'a material is reserved there';
  if (u.allowed) return 'a reservation names it as an allowed destination';
  return '';
}



function forgetRackPhotos_(ss, names) {
  var sheet = ss.getSheetByName('RACK_PHOTOS');
  if (!sheet || sheet.getLastRow() < 2) return 0;

  var gone = {};
  for (var g = 0; g < names.length; g++) gone[String(names[g]).trim().toUpperCase()] = 1;

  var rows = sheet.getDataRange().getValues();
  var dropped = 0;
  
  for (var i = rows.length - 1; i >= 1; i--) {
    if (!gone[String(rows[i][0] || '').trim().toUpperCase()]) continue;
    trashFileQuietly_(String(rows[i][1] || '').trim());
    sheet.deleteRow(i + 1);
    dropped++;
  }
  if (dropped) CacheService.getScriptCache().remove('rackPhotosV1');
  return dropped;
}























function mergeConfigValues(data, auth) {
  auth = requireAuth_('ADMIN');
  var type = String(data.type || '');
  if (type !== 'projects' && type !== 'suppliers') throw new Error('Unknown merge type: ' + type);

  var into = String(data.into || '').trim();
  if (!into) throw new Error('Pick the name to keep.');

  






















  var from = (data.from || []).map(function (v) { return String(v || '').trim(); })
                              .filter(function (v) { return !!v; });
  if (!from.length) throw new Error('Pick at least one other name to merge in.');
  return withStockLock_(function () { return mergeConfigValuesLocked_(data, auth, type, into, from); });
}

function mergeConfigValuesLocked_(data, auth, type, into, from) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var col = (type === 'projects') ? AC.PROJECT : AC.SUPPLIER;

  




  var wanted = {};
  from.forEach(function (v) { wanted[v.toUpperCase()] = true; });
  wanted[into.toUpperCase()] = true;

  
  
  var storedInto = into;
  var rowsChanged = 0;
  [ss.getSheetByName(SHEETS.ARCHIVE), ensureArchiveHistorySheet_(ss)].forEach(function (sheet) {
    rowsChanged += rewriteArchiveColumn_(sheet, col, function (row) {
      var cur = String(row[col] || '').trim();
      if (!cur || !wanted[cur.toUpperCase()]) return null;
      
      
      
      return (cur === storedInto) ? null : storedInto;
    });
  });

  
  
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  var removed = 0;
  if (cfg) {
    var cfgCol  = (type === 'projects') ? 0 : 2;
    var cfgVals = cfg.getDataRange().getValues();
    var keep = [];
    for (var r = 1; r < cfgVals.length; r++) {
      var v = String(cfgVals[r][cfgCol] || '').trim();
      if (!v) continue;
      


      if (wanted[v.toUpperCase()]) { removed++; continue; }
      keep.push(v);
    }
    
    keep.push(into);
    keep.sort();
    writeConfigColumn_(cfg, cfgCol, keep);
  }

  refreshOrDefer_(ss, data);
  auditLog_(ss, 'MERGE_CONFIG', auth.email,
    type + ': ' + from.join(' + ') + ' → ' + into, String(rowsChanged) + ' rows', '');

  
  
  
  return { status: 'success', rowsChanged: rowsChanged,
           removed: Math.max(0, removed - 1), into: into };
}
































function rewriteArchiveColumn_(sheet, col, decide) {
  if (!sheet) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var width = Math.max(sheet.getLastColumn(), col + 1);
  var rows  = sheet.getRange(2, 1, last - 1, width).getValues();
  var out = [], changed = 0;
  for (var i = 0; i < rows.length; i++) {
    var nv = decide(rows[i]);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (nv === null || nv === undefined) out.push([textCell_(rows[i][col])]);
    else { out.push([textCell_(nv)]); changed++; }
  }
  if (changed) sheet.getRange(2, col + 1, last - 1, 1).setValues(out);
  return changed;
}








function renameIncomingCategory_(ss, oldVal, newValStored) {
  var sheet = ss.getSheetByName('INCOMING_V3');
  if (!sheet) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var want = String(oldVal || '').trim().toUpperCase();
  var vals = sheet.getRange(2, 3, last - 1, 1).getValues();
  var changed = 0;
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0] || '').trim().toUpperCase() === want) { vals[i][0] = newValStored; changed++; }
  }
  
  
  
  
  if (changed) sheet.getRange(2, 3, last - 1, 1).setValues(vals.map(function(v){ return [textCell_(v[0])]; }));
  return changed;
}

function renameCategoryColumn_(sheet, oldVal, newValStored) {
  var want = String(oldVal || '').trim().toUpperCase();
  return rewriteArchiveColumn_(sheet, AC.CATEGORY, function (row) {
    return String(row[AC.CATEGORY] || '').trim().toUpperCase() === want ? newValStored : null;
  });
}































function updateConfig(data, auth) {
  
  
  
  
  
  
  
  auth = requireAuth_('WRITE');
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('CONFIG sheet not found.');

  if (data.type === 'archiveCutoffMonths') {
    requireAuth_('ADMIN');    
    var months = Number(data.value);
    if ([6, 12, 18].indexOf(months) === -1) throw new Error('Cutoff must be 6, 12, or 18 months.');
    cfg.getRange(2, 14).setValue(months);
    ensureArchiveTrigger_();
    var res = archiveOldMovements(ss);
    auditLog_(ss, 'UPDATE_CONFIG', auth.email, 'archiveCutoffMonths', 'set', String(months) + 'mo');
    return { status: 'success', reconcile: res };
  }

  requirePerm_(auth, 'canManageCatalog');

  
  var colMap = { categories: 1, projects: 0, suppliers: 2, locations: 3 };
  var col    = colMap[data.type];
  if (col === undefined) throw new Error('Unknown config type: ' + data.type);

  var rows = cfg.getDataRange().getValues();
  var val  = String(data.value    || '').trim();
  var nv   = String(data.newValue || '').trim();

  if (data.op === 'add') {
    if (!nv) throw new Error('Value required for add.');
    
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][col] || '').trim().toUpperCase() === nv.toUpperCase())
        throw new Error(data.type + ' "' + nv + '" already exists.');
    }
    
    var targetRow = rows.length + 1;  
    for (var i = 1; i < rows.length; i++) {
      if (!rows[i][col]) { targetRow = i + 1; break; }
    }
    cfg.getRange(targetRow, col + 1).setValue(textCell_(nv));

  } else if (data.op === 'rename') {
    if (!val) throw new Error('Current value required for rename.');
    if (!nv)  throw new Error('New value required for rename.');
    var renamed = 0;
    
    
    
    
    
    
    
    
    
    var nvStored = textCell_(nv.toUpperCase());
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][col] || '').trim().toUpperCase() === val.toUpperCase()) {
        cfg.getRange(i + 1, col + 1).setValue(nvStored);
        renamed++;
      }
    }
    if (!renamed) throw new Error('"' + val + '" not found in ' + data.type + '.');
    
    
    
    
    
    
    
    
    
    
    
    
    if (data.type === 'categories') {
      withStockLock_(function () {
        
        
        
        
        
        
        
        
        
        var nvCrudo = nv.toUpperCase();
        var n  = renameCategoryColumn_(ss.getSheetByName(SHEETS.ARCHIVE), val, nvCrudo);
        n     += renameCategoryColumn_(ensureArchiveHistorySheet_(ss), val, nvCrudo);

        
        
        
        
        
        
        
        
        
        
        
        
        renameIncomingCategory_(ss, val, nv.toUpperCase());

        
        
        
        
        
        
        
        
        
        
        
        
        
        if (n) refreshOrDefer_(ss, data);
      });
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

  auditLog_(ss, 'UPDATE_CONFIG', auth.email, data.type, data.op, val + (nv ? ' → ' + nv : ''));
  return { status: 'success' };
}




function listMaterials(auth) {
  auth = requireAuth_('ADMIN');    
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













































var MOVEMENT_OPS = { deleteRow: true, restoreMovement: true, listTrash: true };





















































function moverDependencias_(ss, catViejo, nomViejo, catNuevo, nomNuevo, fusionando) {
  var res = { packs: 0, avgCost: 0, locks: 0, minStock: 0, monitored: 0,
              descartados: 0, fallos: 0, resumen: '' };
  var vc = String(catViejo || '').trim().toUpperCase();
  var vn = String(nomViejo || '').trim().toUpperCase();
  var nc = String(catNuevo || '').trim().toUpperCase();
  var nn = String(nomNuevo || '').trim().toUpperCase();
  if (vc === nc && vn === nn) return res;    

  
  try {
    var pk = ss.getSheetByName(SHEETS.PACKS);
    if (pk && pk.getLastRow() > 1) {
      var pr = pk.getRange(2, 1, pk.getLastRow() - 1, 7).getValues();
      
      var enDestino = {};
      for (var d = 0; d < pr.length; d++) {
        if (String(pr[d][PACK_COLS.CATEGORY] || '').trim().toUpperCase() === nc &&
            String(pr[d][PACK_COLS.NAME]     || '').trim().toUpperCase() === nn) {
          enDestino[String(pr[d][PACK_COLS.PACK] || '').trim().toUpperCase()] = true;
        }
      }
      
      for (var p = pr.length - 1; p >= 0; p--) {
        if (String(pr[p][PACK_COLS.CATEGORY] || '').trim().toUpperCase() !== vc ||
            String(pr[p][PACK_COLS.NAME]     || '').trim().toUpperCase() !== vn) continue;
        var envase = String(pr[p][PACK_COLS.PACK] || '').trim().toUpperCase();
        if (fusionando && enDestino[envase]) {
          pk.deleteRow(p + 2);           
          res.descartados++;
        } else {
          pk.getRange(p + 2, 1, 1, 2).setValues([textSafeRow_([nc, nn])]);
          res.packs++;
        }
      }
    }
  } catch (e) { res.fallos++; }

  
  try {
    var lk = ss.getSheetByName('MATERIAL_LOCKS');
    if (lk && lk.getLastRow() > 1) {
      var lr = lk.getRange(2, 1, lk.getLastRow() - 1, 4).getValues();
      var idNuevo = getMaterialId(normalizeString(nc), normalizeString(nn));
      for (var l = 0; l < lr.length; l++) {
        if (String(lr[l][2] || '').trim().toUpperCase() !== vc ||
            String(lr[l][3] || '').trim().toUpperCase() !== vn) continue;
        lk.getRange(l + 2, 2, 1, 3).setValues([textSafeRow_([idNuevo, nc, nn])]);
        res.locks++;
      }
    }
  } catch (e) { res.fallos++; }

  
  try {
    var cfg = ss.getSheetByName(SHEETS.CONFIG);
    if (cfg && cfg.getLastRow() > 1) {
      var cr = cfg.getRange(2, 1, cfg.getLastRow() - 1, 17).getValues();
      
      var costeEnDestino = false;
      for (var q = 0; q < cr.length; q++) {
        if (String(cr[q][14] || '').trim().toUpperCase() === nc &&
            String(cr[q][15] || '').trim().toUpperCase() === nn) { costeEnDestino = true; break; }
      }
      for (var c2 = 0; c2 < cr.length; c2++) {
        if (String(cr[c2][14] || '').trim().toUpperCase() !== vc ||
            String(cr[c2][15] || '').trim().toUpperCase() !== vn) continue;
        if (fusionando && costeEnDestino) {
          
          
          
          cfg.getRange(c2 + 2, 15, 1, 3).setValues([['', '', '']]);
          res.descartados++;
        } else {
          cfg.getRange(c2 + 2, 15, 1, 2).setValues([textSafeRow_([nc, nn])]);
          res.avgCost++;
        }
      }
      
      if (vn !== nn) {
        for (var m = 0; m < cr.length; m++) {
          if (String(cr[m][11] || '').trim().toUpperCase() !== vn) continue;
          cfg.getRange(m + 2, 12, 1, 1).setValues([textSafeRow_([nn])]);
          res.minStock++;
        }
      }
    }
  } catch (e) { res.fallos++; }

  
  if (vn !== nn) {
    try {
      var props = PropertiesService.getScriptProperties();
      var crudo = props.getProperty('WMS_MONITORED_MATERIALS');
      if (crudo) {
        var lista = JSON.parse(crudo);
        if (Object.prototype.toString.call(lista) === '[object Array]') {
          var cambio = false, vistos = {}, salida = [];
          for (var mo = 0; mo < lista.length; mo++) {
            var v = String(lista[mo] || '').trim();
            if (v.toUpperCase() === vn) { v = nomNuevo; cambio = true; }
            
            var clave = v.toUpperCase();
            if (clave && !vistos[clave]) { vistos[clave] = true; salida.push(v); }
          }
          if (cambio) {
            props.setProperty('WMS_MONITORED_MATERIALS', JSON.stringify(salida));
            res.monitored++;
          }
        }
      }
    } catch (e) { res.fallos++; }
  }

  var partes = [];
  if (res.packs)       partes.push(res.packs + ' pack');
  if (res.avgCost)     partes.push(res.avgCost + ' avg cost');
  if (res.locks)       partes.push(res.locks + ' reservation');
  if (res.minStock)    partes.push(res.minStock + ' min stock');
  if (res.monitored)   partes.push('stock alerts');
  if (res.descartados) partes.push(res.descartados + ' dropped (target kept its own)');
  if (res.fallos)      partes.push(res.fallos + ' NOT moved');
  res.resumen = partes.length ? ', ' + partes.join(', ') : '';
  return res;
}

function manageMaterial(data, auth) {
  
  if (MOVEMENT_OPS[data && data.op]) {
    
    
    auth = requireAuth_('WRITE');
    requirePerm_(auth, 'canEditMovements');
  } else {
    auth = requireAuth_('ADMIN');
  }
  return withStockLock_(function () { return manageMaterialLocked_(data, auth); });
}

function manageMaterialLocked_(data, auth) {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) throw new Error('Archive sheet not found.');

  var op  = data.op;
  var cat = String(data.category || '').trim().toUpperCase();
  var nm  = String(data.name     || '').trim().toUpperCase();

  
  
  function rewriteBoth(col, decide) {
    return rewriteArchiveColumn_(archive, col, decide) +
           rewriteArchiveColumn_(ensureArchiveHistorySheet_(ss), col, decide);
  }
  function matches(wantCat, wantName) {
    return function (row) {
      return String(row[AC.CATEGORY] || '').trim().toUpperCase() === wantCat &&
             String(row[AC.NAME]     || '').trim().toUpperCase() === wantName;
    };
  }

  if (op === 'rename') {
    
    var oldNm = nm;
    var newNm = String(data.newName || '').trim();
    if (!newNm) throw new Error('New name required.');
    var hit = matches(cat, oldNm), storedNm = newNm;    
    var count = rewriteBoth(AC.NAME, function (row) { return hit(row) ? storedNm : null; });
    var depR  = moverDependencias_(ss, cat, oldNm, cat, newNm);
    if (count) refreshOrDefer_(ss, data);
    auditLog_(ss, 'RENAME_MATERIAL', auth.email, cat, oldNm,
              newNm + ' (' + count + ' rows' + depR.resumen + ')');
    return { status: 'success', updated: count, dependencias: depR };

  } else if (op === 'changeCategory') {
    var newCat = String(data.newCategory || '').trim().toUpperCase();
    if (!newCat) throw new Error('New category required.');
    var hitC = matches(cat, nm), storedCat = newCat;    
    var countC = rewriteBoth(AC.CATEGORY, function (row) { return hitC(row) ? storedCat : null; });
    var depC   = moverDependencias_(ss, cat, nm, newCat, nm);
    if (countC) refreshOrDefer_(ss, data);
    auditLog_(ss, 'CHANGE_CAT', auth.email, nm, cat,
              newCat + ' (' + countC + ' rows' + depC.resumen + ')');
    return { status: 'success', updated: countC, dependencias: depC };

  } else if (op === 'merge') {
    
    var srcNm  = nm;
    var tgtNm  = String(data.targetName || '').trim();
    if (!tgtNm) throw new Error('Target name required.');
    var hitM = matches(cat, srcNm), storedTgt = tgtNm;  
    var countM = rewriteBoth(AC.NAME, function (row) { return hitM(row) ? storedTgt : null; });
    
    
    var depM   = moverDependencias_(ss, cat, srcNm, cat, tgtNm, true);
    if (countM) refreshOrDefer_(ss, data);
    auditLog_(ss, 'MERGE_MATERIAL', auth.email, cat, srcNm,
              tgtNm + ' (' + countM + ' rows' + depM.resumen + ')');
    return { status: 'success', merged: countM, dependencias: depM };

  } else if (op === 'deleteRow') {
    
    
    
    
    var movId = String(data.movId || '').trim();
    if (!movId) {
      throw new Error('This movement has no ID yet, so it cannot be deleted safely. ' +
        'Open Settings → System → Movement IDs and press the button there first.');
    }

    var found = findMovementById_(ss, movId);

    if (!found) {
      
      
      
      var gone = findTrashedById_(ss, movId);
      if (gone) {
        var who  = String(gone.row[TR.DELETED_BY] || 'someone else');
        var when = gone.row[TR.DELETED_AT] instanceof Date
          ? Utilities.formatDate(gone.row[TR.DELETED_AT], Session.getScriptTimeZone(), 'MMM d, h:mm a')
          : String(gone.row[TR.DELETED_AT] || '');
        throw new Error(GONE_PREFIX + 'Already deleted by ' + who + (when ? ' on ' + when : '') +
          '. It is in the trash — you can put it back from there.');
      }
      throw new Error(GONE_PREFIX + 'This movement is no longer there. Refresh and take another look.');
    }

    
    
    var trash = ensureTrashSheet_(ss);
    var saved = found.row.slice();
    saved[TR.DELETED_AT] = new Date();
    saved[TR.DELETED_BY] = auth.email;
    saved[TR.FROM_SHEET] = found.sheetName;
    trash.getRange(trash.getLastRow() + 1, 1, 1, TRASH_WIDTH).setValues([textSafeRow_(saved)]);

    
    
    
    
    auditLog_(ss, 'DELETE_ROW', auth.email, String(found.row[AC.CATEGORY]), String(found.row[AC.NAME]),
              movId + ' — ' + JSON.stringify(found.row.slice(0, 8)));

    

    var matBorrado = getMaterialId(
      normalizeString(found.row[AC.CATEGORY] || ''),
      normalizeString(found.row[AC.NAME]     || ''));

    found.sheet.deleteRow(found.rowIdx);
    
    
    
    var refrescado = refreshOrDefer_(ss, data);

    















    return {
      status: 'success', movId: movId, trashed: true,
      stockAfter: refrescado ? stockAfterParaIds_(ss, [matBorrado]) : null
    };

  } else if (op === 'restoreMovement') {
    
    
    
    
    var rid = String(data.movId || '').trim();
    if (!rid) throw new Error('Which movement?');

    if (findMovementById_(ss, rid)) {
      throw new Error('That movement is already back — somebody restored it first.');
    }
    var entry = findTrashedById_(ss, rid);
    if (!entry) throw new Error('That movement is not in the trash.');

    var backTo = String(entry.row[TR.FROM_SHEET] || SHEETS.ARCHIVE);
    var target = backTo === SHEETS.ARCHIVE_HISTORY
      ? ensureArchiveHistorySheet_(ss) : archive;
    ensureArchiveWidth_(target);

    var restored = padRow_(entry.row, AC_WIDTH);    

    
































    var mtBack = String(restored[AC.MOVETYPE] || '').toUpperCase().trim();
    if (mtBack === 'EXIT' || mtBack === 'DISPATCH' || mtBack === 'WASTE') {
      var qtyBack = Math.abs(Number(restored[AC.QTY] || 0));
      var matBack = getMaterialId(normalizeString(restored[AC.CATEGORY] || ''),
                                  normalizeString(restored[AC.NAME]     || ''));
      
      
      
      var snapBack = buildStockSnapshot_(archive.getDataRange().getValues());
      var haveBack = (snapBack[matBack] && snapBack[matBack].wh) || 0;
      if (haveBack < qtyBack) {
        throw new Error('CANNOT PUT THIS BACK — the warehouse changed while it was in the trash. ' +
          String(restored[AC.NAME] || 'This material') + ' now has ' + haveBack +
          ' in the warehouse, and this movement takes ' + qtyBack + ' out. ' +
          'Putting it back would leave you holding less than nothing. ' +
          'It is still in the trash: check whether the same material left again after this was deleted.');
      }
    }

    target.getRange(target.getLastRow() + 1, 1, 1, AC_WIDTH).setValues([textSafeRow_(restored)]);
    target.getRange(target.getLastRow(), AC.TIMESTAMP + 1, 1, 1).setNumberFormat('mm/dd/yyyy hh:mm');

    
    
    entry.sheet.deleteRow(entry.rowIdx);

    auditLog_(ss, 'RESTORE_ROW', auth.email, String(restored[AC.CATEGORY]), String(restored[AC.NAME]),
              rid + ' → ' + backTo);
    refreshOrDefer_(ss, data);
    return { status: 'success', movId: rid };

  } else if (op === 'emptyTrash') {
    
    
    
    
    requireAuth_('ADMIN');
    var tSh = ss.getSheetByName(SHEETS.TRASH);
    if (!tSh || tSh.getLastRow() < 2) return { status: 'success', removed: 0 };
    var n = tSh.getLastRow() - 1;
    
    
    tSh.deleteRows(2, n);
    auditLog_(ss, 'TRASH_EMPTIED', auth.email, n + ' deleted movement(s) discarded for good', '', '');
    return { status: 'success', removed: n };

  } else if (op === 'listTrash') {
    
    var tSheet = alinearPapelera_(ss.getSheetByName(SHEETS.TRASH));
    if (!tSheet || tSheet.getLastRow() < 2) return { status: 'success', items: [] };
    var tLast  = tSheet.getLastRow();
    var span   = Math.min(200, tLast - 1);           
    var tRows  = tSheet.getRange(tLast - span + 1, 1, span,
                   Math.min(TRASH_WIDTH, tSheet.getMaxColumns())).getValues();
    var items  = [];
    for (var t = tRows.length - 1; t >= 0; t--) {    
      var tr = tRows[t];
      if (!String(tr[AC.CATEGORY] || '').trim() && !String(tr[AC.NAME] || '').trim()) continue;
      items.push({
        movId:     String(tr[AC.MOV_ID] || ''),
        category:  String(tr[AC.CATEGORY] || ''),
        name:      String(tr[AC.NAME] || ''),
        qty:       Number(tr[AC.QTY] || 0),
        unit:      String(tr[AC.UNIT] || ''),
        moveType:  String(tr[AC.MOVETYPE] || ''),
        project:   String(tr[AC.PROJECT] || ''),
        srcLoc:    String(tr[AC.SRC_LOC] || ''),
        destLoc:   String(tr[AC.DEST_LOC] || ''),
        
        
        
        
        
        
        
        when:      tr[AC.TIMESTAMP] instanceof Date ? tr[AC.TIMESTAMP].toISOString()
                                                    : String(tr[AC.TIMESTAMP] || ''),
        po:        String(tr[AC.PO] || ''),
        deletedBy: String(tr[TR.DELETED_BY] || ''),
        deletedAt: tr[TR.DELETED_AT] instanceof Date ? tr[TR.DELETED_AT].toISOString() : ''
      });
    }
    return { status: 'success', items: items };
  }

  throw new Error('Unknown manageMaterial op: ' + op);
}





















var INCOMING_DATE_MODES = { exact:1, window:1, about:1, unknown:1 };

function incomingDateMode_(v) {
  v = String(v || '').toLowerCase().trim();
  return INCOMING_DATE_MODES[v] ? v : 'exact';
}

function ensureIncomingSheet_(ss) {
  var sheet = ss.getSheetByName('INCOMING_V3');
  if (!sheet) {
    sheet = ss.insertSheet('INCOMING_V3');
    sheet.appendRow(['ID','Est. Date','Category','Name','Qty','Unit','Supplier','PO','Notes','Status','Added By','Added At','PM','Doc Link','Date Mode','Est. Date End','Date Note']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 17).setFontWeight('bold');
  } else {
    
    
    var lastCol = sheet.getLastColumn();
    var headers = ['PM','Doc Link','Date Mode','Est. Date End','Date Note'];
    for (var c = 13; c <= 17; c++) {
      if (lastCol < c) sheet.getRange(1, c).setValue(headers[c - 13]).setFontWeight('bold');
    }
  }
  return sheet;
}































function getIncoming(sessionToken, interno) {
  
  
  
  
  
  
  var auth = getUserRole(sessionToken);
  if (auth.role === 'DENIED' || auth.role === 'NO_SESSION') throw new Error('Not authenticated.');
  

















  if (!interno) requireQuota_('inc_read', auth.email || sessionToken, 180, 300);
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('INCOMING_V3');
  if (!sheet) return [];

  var data    = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var estDate = incomingCellDate_(row[1]);
    results.push({
      id:       String(row[0]),
      estDate:  estDate,
      category: String(row[2]  || '').toUpperCase().trim(),
      name:     String(row[3]  || '').trim(),
      qty:      Number(row[4]  || 0),
      unit:     String(row[5]  || 'UNIT'),
      supplier: safeStr_(row[6]),
      po:       safeStr_(row[7]),    
      notes:    safeStr_(row[8]),
      status:   String(row[9]  || 'Pending'),
      addedBy:  String(row[10] || ''),
      addedAt:  String(row[11] || ''),
      pm:       String(row[12] || ''),
      docLink:  String(row[13] || ''),
      dateMode:   incomingDateMode_(row[14]),
      estDateEnd: incomingCellDate_(row[15]),
      dateNote:   String(row[16] || '')
    });
  }
  
  
  
  return results.sort(function(a, b) {
    var ka = a.estDate || '9999-12-31';
    var kb = b.estDate || '9999-12-31';
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}



function incomingCellDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v ? String(v).substring(0, 10) : '';
}



function incomingDateCell_(ymd) {
  return ymd ? new Date(String(ymd) + 'T12:00:00') : '';
}







var INCOMING_STATUSES = ['Pending', 'Arrived', 'Cancelled'];
function incomingStatus_(v) {
  var s = String(v || '').trim().toLowerCase();
  for (var i = 0; i < INCOMING_STATUSES.length; i++) {
    if (INCOMING_STATUSES[i].toLowerCase() === s) return INCOMING_STATUSES[i];
  }
  return 'Pending';
}






























function addIncoming(data) {
  var auth = getUserRole(data && data._sessionToken);
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  
  
  requireQuota_('inc_write', auth.email, 120, 300);
  
  
  return withStockLock_(function(){
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ensureIncomingSheet_(ss);
    var id    = 'INC-' + new Date().getTime();
    var mode    = incomingDateMode_(data.dateMode);
    var estDate = incomingDateCell_(mode === 'unknown' ? '' : data.estDate);
    var estEnd  = incomingDateCell_(mode === 'window'  ? data.estDateEnd : '');
    var docLink = uploadIncomingDoc_(data.docFile, data.name, data.po);
    


















    











    sheet.appendRow(textSafeRow_([
      id,
      estDate,
      cleanDisplay_(data.category),
      cleanDisplay_(data.name),
      Number(data.qty      || 0),
      String(data.unit     || 'UNIT'),
      String(data.supplier || ''),
      String(data.po       || ''),
      String(data.notes    || ''),
      incomingStatus_(data.status),
      auth.email,
      new Date(),
      String(data.pm       || ''),
      docLink,
      mode,
      estEnd,
      String(data.dateNote || '')
    ]));
    return { status: 'success', id: id, docLink: docLink };
  });
}


function uploadIncomingDoc_(docFile, name, po) {
  if (!docFile || !docFile.fileData) return '';
  try {
    return uploadFiles_([docFile], String(name || 'Incoming'), String(po || 'INC'));
  } catch (e) {
    Logger.log('Incoming doc upload failed: ' + e.message);
    return '';
  }
}

function updateIncoming(data) {
  var auth = getUserRole(data && data._sessionToken);
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  requireQuota_('inc_write', auth.email, 120, 300);
  
  
  return withStockLock_(function(){
    var ss     = SpreadsheetApp.getActiveSpreadsheet();
    var sheet  = ensureIncomingSheet_(ss);    
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(data.id)) {
        var mode    = incomingDateMode_(data.dateMode);
        var estDate = mode === 'unknown' ? ''
                    : (data.estDate ? incomingDateCell_(data.estDate) : values[i][1]);
        var estEnd  = incomingDateCell_(mode === 'window' ? data.estDateEnd : '');
        
        var docLink = data.docFile && data.docFile.fileData
          ? uploadIncomingDoc_(data.docFile, data.name, data.po)
          : (values[i][13] || '');
        
        
        
        
        
        
        sheet.getRange(i + 1, 1, 1, 17).setValues([textSafeRow_([
          data.id,
          estDate,
          cleanDisplay_(data.category),
          cleanDisplay_(data.name),
          Number(data.qty      || 0),
          String(data.unit     || 'UNIT'),
          String(data.supplier || ''),
          String(data.po       || ''),
          String(data.notes    || ''),
          incomingStatus_(data.status),
          values[i][10],           
          values[i][11],           
          String(data.pm || ''),   
          docLink,
          mode,
          estEnd,
          String(data.dateNote || '')
        ])]);
        return { status: 'success', docLink: docLink };
      }
    }
    throw new Error('Incoming item not found: ' + data.id);
  });
}

function deleteIncoming(id, sessionToken) {
  var auth = getUserRole(sessionToken);
  if (auth.role !== 'ADMIN') throw new Error('Admin only.');
  requireQuota_('inc_write', auth.email, 120, 300);
  
  
  return withStockLock_(function(){
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
  });
}
































var DQ_MAX_FINDINGS = 150;     
var DQ_SIMILAR_CAP  = 300;     













function squashKey_(v) {
  return normalizeString(v).replace(/[^A-Z0-9]/g, '');
}




function dqReadRows_(ss) {
  var out = [];
  [ss.getSheetByName(SHEETS.ARCHIVE), ss.getSheetByName(SHEETS.ARCHIVE_HISTORY)].forEach(function (sheet) {
    if (!sheet) return;
    var last = sheet.getLastRow();
    if (last < 2) return;
    var width = Math.min(Math.max(sheet.getLastColumn(), AC_WIDTH), sheet.getMaxColumns());
    var vals  = sheet.getRange(2, 1, last - 1, width).getValues();
    for (var i = 0; i < vals.length; i++) out.push(vals[i]);
  });
  return out;
}



function dqId_(parts) {
  return parts.map(function (p) { return String(p == null ? '' : p); }).join('~');
}

function runDataQualityScan(data) {
  var auth = requireAuth_('ADMIN');
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var rows = dqReadRows_(ss);

  var findings = [];

  
  
  
  
  var SPELL = [
    { field: 'material', label: 'material' },
    { field: 'project',  label: 'project',  col: AC.PROJECT },
    { field: 'supplier', label: 'supplier', col: AC.SUPPLIER },
    { field: 'rack',     label: 'rack',     cols: [AC.SRC_LOC, AC.DEST_LOC] }
  ];

  SPELL.forEach(function (spec) {
    var groups = {};    
    rows.forEach(function (row) {
      function add(rawVal, cat) {
        var val = String(rawVal || '').trim();
        if (!val) return;
        
        
        
        if (spec.field === 'project' && normalizeString(val) === 'GENERIC') return;
        var sq = squashKey_(val);
        if (!sq) return;
        var gk = (cat ? normalizeString(cat) + '|||' : '') + sq;
        var g  = groups[gk] || (groups[gk] = { cat: cat || '', spellings: {} });
        g.spellings[val] = (g.spellings[val] || 0) + 1;
      }
      if (spec.field === 'material')      add(row[AC.NAME], row[AC.CATEGORY]);
      else if (spec.cols)                 spec.cols.forEach(function (c) { add(row[c], ''); });
      else                                add(row[spec.col], '');
    });

    Object.keys(groups).forEach(function (gk) {
      var g     = groups[gk];
      var texts = Object.keys(g.spellings);
      if (texts.length < 2) return;
      
      
      
      texts.sort(function (a, b) { return g.spellings[b] - g.spellings[a] || (a < b ? -1 : 1); });
      findings.push({
        id:        dqId_(['spelling', spec.field, gk]),
        kind:      'spelling',
        field:     spec.field,
        label:     spec.label,
        category:  g.cat,
        keep:      texts[0],
        spellings: texts.map(function (t) { return { text: t, rows: g.spellings[t] }; }),
        rows:      texts.reduce(function (a, t) { return a + g.spellings[t]; }, 0)
      });
    });
  });

  
  
  
  
  
  
  
  
  
  
  
  
  var byMat = {};
  rows.forEach(function (row) {
    var cat  = String(row[AC.CATEGORY] || '').trim();
    var name = String(row[AC.NAME]     || '').trim();
    if (!cat || !name) return;
    var matId = getMaterialId(normalizeString(cat), normalizeString(name));
    var m = byMat[matId] || (byMat[matId] = {
      category: cat, name: name,
      suppliers: {}, blankSupplier: 0,
      projects: {}, staleTransfer: 0
    });
    var sup = String(row[AC.SUPPLIER] || '').trim();
    if (sup) m.suppliers[sup] = (m.suppliers[sup] || 0) + 1;
    else m.blankSupplier++;

    var proj = String(row[AC.PROJECT] || '').trim();
    var mt   = String(row[AC.MOVETYPE] || '').toUpperCase().trim();
    if (proj && normalizeString(proj) !== 'GENERIC') m.projects[proj] = (m.projects[proj] || 0) + 1;
    
    
    
    if (mt === 'TRANSFER' && (!proj || normalizeString(proj) === 'GENERIC')) m.staleTransfer++;
  });

  Object.keys(byMat).forEach(function (matId) {
    var m = byMat[matId];
    var sups = Object.keys(m.suppliers);
    if (sups.length === 1 && m.blankSupplier > 0) {
      findings.push({
        id: dqId_(['gap', 'supplier', matId]), kind: 'gap', field: 'supplier',
        matId: matId, category: m.category, name: m.name,
        value: sups[0], rows: m.blankSupplier
      });
    }
    var projs = Object.keys(m.projects);
    if (projs.length === 1 && m.staleTransfer > 0) {
      findings.push({
        id: dqId_(['gap', 'project', matId]), kind: 'gap', field: 'project',
        matId: matId, category: m.category, name: m.name,
        value: projs[0], rows: m.staleTransfer
      });
    }
  });

  























  var netos = {};
  rows.forEach(function (row) {
    var cat  = String(row[AC.CATEGORY] || '').trim();
    var name = String(row[AC.NAME]     || '').trim();
    if (!cat && !name) return;
    var matId = getMaterialId(normalizeString(cat), normalizeString(name));
    var n = netos[matId] || (netos[matId] = { category: cat, name: name, neto: 0, dentro: 0, fuera: 0 });
    var qty = Math.abs(Number(row[AC.QTY] || 0));
    


    var mt = tipoDeMovimiento_(row[AC.MOVETYPE], row[AC.QTY], row[AC.STATUS]);
    
    
    
    if (mt === 'ENTRY' || mt === 'RETURN')                       { n.neto += qty; n.dentro += qty; }
    else if (mt === 'EXIT' || mt === 'DISPATCH' || mt === 'WASTE'){ n.neto -= qty; n.fuera  += qty; }
  });

  Object.keys(netos).forEach(function (matId) {
    var n = netos[matId];
    if (n.neto >= 0) return;
    findings.push({
      id: dqId_(['negative', matId]), kind: 'negative',
      matId: matId, category: n.category, name: n.name,
      value: n.neto, rows: 0, inQty: n.dentro, outQty: n.fuera
    });
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var SIMILAR_IN = [
    { field: 'material', byCategory: true },
    { field: 'project',  byCategory: false },
    { field: 'supplier', byCategory: false }
  ];
  
  
  
  var pools = { material: {}, project: {}, supplier: {} };
  rows.forEach(function (row) {
    var cat = normalizeString(row[AC.CATEGORY] || '');
    var nm  = String(row[AC.NAME] || '').trim();
    if (cat && nm) (pools.material[cat] || (pools.material[cat] = {}))[nm] = true;
    var pj = String(row[AC.PROJECT] || '').trim();
    if (pj && normalizeString(pj) !== 'GENERIC') (pools.project[''] || (pools.project[''] = {}))[pj] = true;
    var sp = String(row[AC.SUPPLIER] || '').trim();
    if (sp) (pools.supplier[''] || (pools.supplier[''] = {}))[sp] = true;
  });

  SIMILAR_IN.forEach(function (spec) {
    var pool = pools[spec.field];
    Object.keys(pool).forEach(function (bucket) {
      var names = Object.keys(pool[bucket]);
      
      
      
      if (names.length > DQ_SIMILAR_CAP) return;
      for (var i = 0; i < names.length; i++) {
        for (var j = i + 1; j < names.length; j++) {
          var a = names[i], b = names[j];
          var ka = squashKey_(a), kb = squashKey_(b);
          if (ka === kb) continue;                           
          if (dqDigitsOf_(a) !== dqDigitsOf_(b)) continue;   
          var shortest = Math.min(ka.length, kb.length);
          if (shortest < 4) continue;                        
          var allowed = shortest >= 8 ? 2 : 1;
          if (Math.abs(ka.length - kb.length) > allowed) continue;
          if (dqEditDistance_(ka, kb, allowed) > allowed) continue;
          findings.push({
            id: dqId_(['similar', spec.field, bucket, ka, kb]),
            kind: 'similar', field: spec.field,
            category: spec.byCategory ? bucket : '', a: a, b: b
          });
        }
      }
    });
  });

  
  
  findings.sort(function (x, y) {
    var order = { spelling: 0, gap: 1, similar: 2 };
    return (order[x.kind] - order[y.kind]) || ((y.rows || 0) - (x.rows || 0));
  });

  var total = findings.length;
  auditLog_(ss, 'DATA_SCAN', auth.email, total + ' finding(s) over ' + rows.length + ' rows', '', '');

  return {
    status: 'success',
    scannedRows: rows.length,
    total: total,
    findings: findings.slice(0, DQ_MAX_FINDINGS)
  };
}




function dqDigitsOf_(v) {
  return (String(v || '').match(/\d+/g) || []).join('.');
}











function dqEditDistance_(a, b, max) {
  var la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  var prev = new Array(lb + 1), cur = new Array(lb + 1), i, j;
  for (j = 0; j <= lb; j++) prev[j] = j;
  for (i = 1; i <= la; i++) {
    cur[0] = i;
    var best = cur[0];
    for (j = 1; j <= lb; j++) {
      var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (cur[j] < best) best = cur[j];
    }
    
    
    if (best > max) return max + 1;
    for (j = 0; j <= lb; j++) prev[j] = cur[j];
  }
  return prev[lb];
}







function applyDataQualityFix(data) {
  var auth = requireAuth_('ADMIN');
  return withStockLock_(function () { return applyDataQualityFixLocked_(data, auth); });
}

function applyDataQualityFixLocked_(data, auth) {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var kind = String(data.kind || '');

  if (kind === 'spelling') {
    var keep = String(data.keep || '').trim();
    if (!keep) throw new Error('Pick which spelling to keep.');
    
    
    
    
    
    
    
    
    
    
    
    
    
    var from = (data.from || []).map(function (v) { return String(v || '').trim(); })
                 .filter(function (v) { return v && v !== keep; });
    if (!from.length) throw new Error('Nothing to merge — that is already the only spelling.');

    if (data.field === 'material') {
      var cat = String(data.category || '').trim();
      if (!cat) throw new Error('Category is required to merge a material.');
      var merged = 0;
      from.forEach(function (spelling) {
        var r = manageMaterialLocked_({ op: 'merge', category: cat, name: spelling, targetName: keep }, auth);
        merged += (r && r.merged) || 0;
      });
      return { status: 'success', rows: merged };
    }
    if (data.field === 'project' || data.field === 'supplier') {
      var type = data.field === 'project' ? 'projects' : 'suppliers';
      var r2 = mergeConfigValuesLocked_({}, auth, type, keep, from);
      return { status: 'success', rows: (r2 && r2.rowsChanged) || 0 };
    }
    if (data.field === 'rack') {
      var r3 = mergeLocationsLocked_({}, auth, keep, from);
      return { status: 'success', rows: (r3 && r3.rowsChanged) || 0 };
    }
    throw new Error('Unknown spelling field: ' + data.field);
  }

  if (kind === 'gap') {
    return dqFillGapLocked_(ss, auth, data);
  }

  
  throw new Error('This finding is a suggestion to look at, not something the app can apply.');
}









function dqFillGapLocked_(ss, auth, data) {
  var field = String(data.field || '');
  var matId = String(data.matId || '').trim();
  var value = String(data.value || '').trim();
  if (!matId || !value) throw new Error('Nothing to fill in.');

  var col, onlyTransfers = false;
  if (field === 'supplier')     col = AC.SUPPLIER;
  else if (field === 'project') { col = AC.PROJECT; onlyTransfers = true; }
  else throw new Error('Unknown gap field: ' + field);

  var parts = matId.split('|||');
  var wantCat  = normalizeString(parts[0] || '');
  var wantName = normalizeString(parts[1] || '');
  if (!wantCat || !wantName) throw new Error('That material id is not readable.');

  
  
  
  var seen = {};
  dqReadRows_(ss).forEach(function (row) {
    if (normalizeString(row[AC.CATEGORY]) !== wantCat) return;
    if (normalizeString(row[AC.NAME])     !== wantName) return;
    var v = String(row[col] || '').trim();
    if (field === 'project' && normalizeString(v) === 'GENERIC') return;
    if (v) seen[v] = true;
  });
  var distinct = Object.keys(seen);
  if (distinct.length !== 1 || distinct[0] !== value) {
    throw new Error('The data changed since this was found — ' +
      (distinct.length ? 'the history now says ' + distinct.join(' / ') : 'there is no value to copy') +
      '. Run the check again.');
  }

  var stored = value;    
  var filled = 0;
  [ss.getSheetByName(SHEETS.ARCHIVE), ss.getSheetByName(SHEETS.ARCHIVE_HISTORY)].forEach(function (sheet) {
    if (!sheet) return;
    filled += rewriteArchiveColumn_(sheet, col, function (row) {
      if (normalizeString(row[AC.CATEGORY]) !== wantCat) return null;
      if (normalizeString(row[AC.NAME])     !== wantName) return null;
      var cur = String(row[col] || '').trim();
      if (onlyTransfers) {
        if (String(row[AC.MOVETYPE] || '').toUpperCase().trim() !== 'TRANSFER') return null;
        
        
        if (cur && normalizeString(cur) !== 'GENERIC') return null;
      } else if (cur) {
        return null;
      }
      return stored;
    });
  });

  
  
  if (filled) refreshOrDefer_(ss, data);
  auditLog_(ss, 'DATA_FIX', auth.email,
    field + ' → "' + value + '" on ' + parts[0] + ' / ' + parts[1],
    String(filled) + ' rows', '');
  return { status: 'success', rows: filled };
}














function parseIncomingEmail(data, auth) {
  auth = requireAuth_('ADMIN');
  
  requireQuota_('emailparse', auth.email, 20, 600);

  var text = String((data && data.text) || '').trim();
  if (!text) throw new Error('Paste the email first.');
  if (text.length < 25) throw new Error('That is too short to read anything out of.');
  if (text.length > 12000) text = text.substring(0, 12000);

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  
  
  
  
  if (!apiKey) throw new Error('NO_AI_KEY');

  
  
  var cfg   = loadConfig();
  var cats  = (cfg.categories || []).slice(0, 40);
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var prompt =
    'You are reading an email for a warehouse, to record what is ARRIVING and when.\n' +
    'Today is ' + today + '. Resolve any relative date against that.\n\n' +
    'Return ONLY a JSON array — no markdown, no explanation. One object per distinct\n' +
    'material being delivered. If the email is not about a delivery at all, return [].\n\n' +
    '{\n' +
    '  "name":     "what is arriving, as specific as the email allows",\n' +
    '  "category": ' + (cats.length ? 'one of: ' + cats.join(' | ') + ' (or null if none fit)' : 'null') + ',\n' +
    '  "qty":      number or null,\n' +
    '  "unit":     "UNIT | SQ FT | LN FT | PIECE | BOX | PALLET",\n' +
    '  "supplier": "who is sending it",\n' +
    '  "po":       "PO or order number",\n' +
    '  "pm":       "project manager or contact named, if any",\n' +
    '  "dateMode": "exact | window | about | unknown",\n' +
    '  "estDate":  "YYYY-MM-DD or null",\n' +
    '  "estDateEnd":"YYYY-MM-DD or null, only when dateMode is window",\n' +
    '  "dateNote": "the words the email used about timing, verbatim and short",\n' +
    '  "notes":    "tracking number, delivery instructions, anything else useful"\n' +
    '}\n\n' +
    'RULES ABOUT THE DATE — these matter more than anything else here:\n' +
    '- A named day ("arriving Sept 3", "ships Monday") → "exact".\n' +
    '- A range ("between the 5th and the 10th") → "window", with both dates.\n' +
    '- Vague but bounded ("next week", "in about 2 weeks", "end of the month")\n' +
    '  → "about", estDate = your best single date, dateNote = their words.\n' +
    '- Nothing about timing, or explicitly unknown ("we will confirm", "waiting\n' +
    '  on the factory") → "unknown", estDate = null, dateNote = why if it says.\n' +
    '- NEVER invent a date to fill the field. "unknown" is a correct answer and\n' +
    '  a wrong date is worse than no date — nobody can tell them apart later.\n\n' +
    'Use null for anything the email does not say. Do not guess quantities.\n\n' +
    'EMAIL:\n' + text;

  var response = geminiFetch_({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.05, maxOutputTokens: 2048 }
  }, apiKey);

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code === 429) throw new Error('The AI is over its quota for now. Try again in a few minutes.');
  if (code !== 200) {
    Logger.log('parseIncomingEmail HTTP ' + code + ': ' + body.substring(0, 400));
    throw new Error('The AI could not be reached (HTTP ' + code + '). Check the Gemini key in Script Properties.');
  }

  var items = [];
  try {
    var raw = JSON.parse(body).candidates[0].content.parts[0].text;
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    var start = raw.indexOf('['), end = raw.lastIndexOf(']');
    if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);
    items = JSON.parse(raw) || [];
  } catch (e) {
    Logger.log('parseIncomingEmail parse error: ' + e.message + ' | ' + body.substring(0, 400));
    throw new Error('The AI answered in a shape this could not read. Try pasting a bit less of the email.');
  }
  if (!Array.isArray(items)) items = [];

  
  
  
  var out = items.slice(0, 20).map(function (it) {
    it = it || {};
    var mode = incomingDateMode_(it.dateMode);
    if (!it.estDate) mode = (mode === 'window' || mode === 'about') ? 'unknown' : mode;
    if (mode === 'unknown') it.estDate = '';
    if (mode !== 'window') it.estDateEnd = '';
    return {
      name:       String(it.name || '').trim().substring(0, 120),
      category:   String(it.category || '').toUpperCase().trim().substring(0, 40),
      qty:        Number(it.qty) > 0 ? Number(it.qty) : 0,
      unit:       String(it.unit || 'UNIT').toUpperCase().trim().substring(0, 20),
      supplier:   String(it.supplier || '').trim().substring(0, 80),
      po:         String(it.po || '').trim().substring(0, 40),
      pm:         String(it.pm || '').trim().substring(0, 80),
      dateMode:   mode,
      estDate:    String(it.estDate || '').substring(0, 10),
      estDateEnd: String(it.estDateEnd || '').substring(0, 10),
      dateNote:   String(it.dateNote || '').trim().substring(0, 60),
      notes:      String(it.notes || '').trim().substring(0, 300)
    };
  }).filter(function (it) { return it.name; });

  return { status: 'success', items: out };
}




















function modifyMovement(data, auth) {
  
  
  
  
  auth = requireAuth_('WRITE');
  requirePerm_(auth, 'canEditMovements');
  return withStockLock_(function () { return modifyMovementLocked_(data, auth); });
}

function modifyMovementLocked_(data, auth) {
  var rowIdx = parseInt(data.rowIdx || 0);
  if (rowIdx < 2) throw new Error('Invalid row index.');

  var reason = String(data.reason || '').trim();
  if (!reason) throw new Error('A reason for the modification is required.');

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) throw new Error('MASTER_ARCHIVE_V3 sheet not found.');

  var lastRow = archive.getLastRow();
  if (rowIdx > lastRow) throw new Error('Row #' + rowIdx + ' does not exist (last row: ' + lastRow + ').');

  
  var range   = archive.getRange(rowIdx, 1, 1, readWidth_(archive));
  var rowVals = range.getValues()[0];

  






  var matAntes = getMaterialId(
    normalizeString(rowVals[AC.CATEGORY] || ''),
    normalizeString(rowVals[AC.NAME]     || ''));

  
  
  
  
  
  if (data.expectedCategory !== undefined || data.expectedName !== undefined) {
    var curCat  = String(rowVals[AC.CATEGORY] || '').trim().toUpperCase();
    var curName = String(rowVals[AC.NAME]     || '').trim().toUpperCase();
    var expCat  = String(data.expectedCategory || '').trim().toUpperCase();
    var expName = String(data.expectedName     || '').trim().toUpperCase();
    if (curCat !== expCat || curName !== expName) {
      throw new Error('This row has changed (data was reorganized). Please refresh and try again.');
    }
  }

  
  var FIELDS = {
    category:    { col: AC.CATEGORY,    label: 'Category' },
    name:        { col: AC.NAME,        label: 'Name' },
    gc:          { col: AC.GC,          label: 'GC' },
    po:          { col: AC.PO,          label: 'PO #' },
    qty:         { col: AC.QTY,        label: 'Qty' },
    unit:        { col: AC.UNIT,       label: 'Unit' },
    dateRec:     { col: AC.DATE_REC,   label: 'Date' },
    sourceLoc:   { col: AC.SRC_LOC,    label: 'Source Loc' },
    supplier:    { col: AC.SUPPLIER,   label: 'Supplier' },
    comments:    { col: AC.COMMENTS,   label: 'Comments' },
    responsible: { col: AC.RESPONSIBLE,label: 'Received By' },
    project:     { col: AC.PROJECT,    label: 'Project' },
    destLoc:     { col: AC.DEST_LOC,   label: 'Dest Loc' },
    pm:          { col: AC.PM,         label: 'PM' }
  };

  var changes    = [];
  var origVals   = {};

  
  
  
  
  
  
  
  var NORMALIZE_ON_WRITE = {
    category:  function(v){ return v.toUpperCase(); },
    name:      cleanDisplay_,
    sourceLoc: function(v){ return v.toUpperCase(); },
    destLoc:   function(v){ return v.toUpperCase(); }
  };

  Object.keys(FIELDS).forEach(function(key) {
    if (data[key] === undefined || data[key] === null) return;
    var f      = FIELDS[key];
    var oldStr = String(rowVals[f.col] || '').trim();
    var newStr = key === 'qty'
      ? String(parseFloat(data[key]) || 0)
      : String(data[key] || '').trim();
    if (NORMALIZE_ON_WRITE[key]) newStr = NORMALIZE_ON_WRITE[key](newStr);
    
    
    
    
    
    
    
    
    if (key === 'project' && !newStr && oldStr.toUpperCase() === 'GENERIC') return;
    if (oldStr !== newStr) {
      origVals[f.label] = oldStr;
      changes.push(f.label + ': "' + oldStr + '" → "' + newStr + '"');
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      rowVals[f.col] = (key === 'qty') ? (parseFloat(newStr) || 0) : newStr;
    }
  });

  if (!changes.length) throw new Error('No changes detected — nothing to save.');

  
  
  
  
  
  
  if (String(rowVals[AC.MOVETYPE] || '').toUpperCase() === 'ADJUST') {
    var eSrc = normalizeString(String(rowVals[AC.SRC_LOC]  || ''));
    var eDst = normalizeString(String(rowVals[AC.DEST_LOC] || ''));
    if (!adjustDirection_(eSrc, eDst)) {
      throw new Error('An adjustment needs exactly ONE rack: Source Loc if the count came up ' +
        'short, Dest Loc if it came up long. Leave the other one empty.');
    }
  }

  
  
  
  if (origVals['Category'] !== undefined || origVals['Name'] !== undefined) {
    rowVals[AC.MAT_ID] = getMaterialId(rowVals[AC.CATEGORY], rowVals[AC.NAME]);
  }

  
  range.setValues([textSafeRow_(rowVals)]);
  
  
  
  var refrescado = refreshOrDefer_(ss, data);

  var matDespues = getMaterialId(
    normalizeString(rowVals[AC.CATEGORY] || ''),
    normalizeString(rowVals[AC.NAME]     || ''));

  

















  var idEditado = String(rowVals[AC.MOV_ID] || '').trim();
  auditLog_(ss, 'MODIFY_MOVEMENT', auth.email,
    (idEditado ? idEditado + ' (row ' + rowIdx + ')' : 'Row ' + rowIdx) + ' | Reason: ' + reason,
    changes.join(' | '), '');

  
















  if (!basicApagado_()) {
  var cfg       = loadConfig();
  var recipient = adminNotifyEmail_();
  var matLabel  = String(rowVals[AC.CATEGORY] || '') + ' — ' + String(rowVals[AC.NAME] || '');
  var moveType  = String(rowVals[AC.MOVETYPE] || '');
  var now       = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  var body =
    'A movement record was modified in ' + (companySettings_().name || 'the warehouse system') + '.\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'WHO:   ' + auth.email + '\n' +
    'WHEN:  ' + now + '\n' +
    'WHERE: Row #' + rowIdx + ' — MASTER_ARCHIVE_V3\n' +
    'WHAT:  ' + matLabel + ' (' + moveType + ')\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    'FIELDS CHANGED:\n' +
    changes.map(function(c){ return '  • ' + c; }).join('\n') +
    '\n\nWHY (reason given by user):\n  ' + reason + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'This change is logged in AUDIT_LOG and cannot be auto-reverted from the app.\n' +
    'To revert, go to MASTER_ARCHIVE_V3 row ' + rowIdx + ' and restore the previous values.';

  MailApp.sendEmail(
    recipient,
    '✏️ WMS — Movement Modified: Row #' + rowIdx + ' by ' + auth.email,
    body,
    { name: (companySettings_().name || 'Warehouse') + ' — ' + PRODUCT_NAME }
  );
  }

  












  var filaEditada = null;
  try {
    filaEditada = parseArchiveRow(padRow_(rowVals, AC_WIDTH), rowIdx);
    if (!canSeeCosts_(auth)) { filaEditada.unitCost = null; filaEditada.totalCost = null; }
  } catch (eFila) {
    Logger.log('modifyMovement, returning the edited row: ' + eFila.message);
    filaEditada = null;
  }

  return {
    status: 'success',
    changes: changes.length,
    movimiento: filaEditada,
    
    
    
    stockAfter: refrescado ? stockAfterParaIds_(ss, [matAntes, matDespues]) : null
  };
}



function diagnoseApp_() {
  
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Diagnostics' });
  Logger.log('=== ' + PRODUCT_NAME + ' Diagnostic ===');
  try {
    Logger.log('1. getUserRole...');
    var auth = getUserRole();
    Logger.log('   role=' + auth.role + ' email=' + auth.email);
  } catch(e) { Logger.log('   FAIL: ' + e.message); }

  try {
    Logger.log('2. loadConfig...');
    var cfg = loadConfig();
    Logger.log('   categories=' + (cfg.categories||[]).length + ' adminEmail=' + cfg.adminEmail);
  } catch(e) { Logger.log('   FAIL: ' + e.message); }

  try {
    Logger.log('3. SpreadsheetApp.getActiveSpreadsheet...');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('   name=' + ss.getName());
    var archive = ss.getSheetByName('MASTER_ARCHIVE_V3');
    Logger.log('   MASTER_ARCHIVE_V3 rows=' + (archive ? archive.getLastRow() : 'NOT FOUND'));
  } catch(e) { Logger.log('   FAIL: ' + e.message); }

  try {
    Logger.log('4. getInitialData (full)...');
    var data = getInitialData();
    Logger.log('   movements=' + data.movements.length +
               ' stock keys=' + Object.keys(data.stock).length +
               ' incoming=' + data.incoming.length);
    Logger.log('   SUCCESS');
  } catch(e) { Logger.log('   FAIL: ' + e.message); }

  Logger.log('=== Diagnostic complete ===');
}


function testGemini_() {
  
  requireOwnerContext_();
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) { Logger.log('ERROR: GEMINI_API_KEY not set'); return; }
  var url = geminiUrl_(geminiModel_(), apiKey);
  var resp = UrlFetchApp.fetch(url, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with: {"ok":true}' }] }] }),
    muteHttpExceptions: true
  });
  Logger.log('HTTP ' + resp.getResponseCode());
  Logger.log(resp.getContentText().substring(0, 500));
}

function scanGmailForDeliveries(data, auth) {
  
  basicNiega_('The inbox scanner');
  auth = requireAuth_('ADMIN');    

  if (!isGmailScanEnabled()) throw new Error(
    'The Gmail delivery scanner is a paid add-on and is not enabled on this installation.\n\n' +
    'It needs full Gmail read access — the one permission Google classifies as "restricted", ' +
    'which is why it ships separately from the base product.\n\n' +
    'Contact your provider to enable it.'
  );

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error(
    'GEMINI_API_KEY not configured.\n' +
    'GAS Editor → ⚙ Project Settings → Script Properties\n' +
    'Add: GEMINI_API_KEY = your key from aistudio.google.com'
  );

  
  var daysBack   = Math.min(Math.max(Number(data.daysBack || 14), 1), 60);
  var customQuery = String(data.query || '').trim();
  var query = customQuery ||
    ('newer_than:' + daysBack + 'd ' +
     '(delivery OR shipment OR "purchase order" OR "order confirmation" ' +
     'OR "tracking" OR "will ship" OR "arriving" OR "scheduled delivery") ' +
     '-in:sent -in:drafts');
  var maxEmails = Math.min(Number(data.maxResults || 10), 20);

  var threads;
  try {
    threads = GmailApp.search(query, 0, maxEmails);
  } catch (e) {
    throw new Error('Gmail search failed: ' + e.message +
      '\nMake sure you authorized the Gmail permission when prompted.');
  }

  
  var emailMetas = [];
  for (var i = 0; i < threads.length; i++) {
    try {
      var thread   = threads[i];
      var messages = thread.getMessages();
      var msg      = messages[messages.length - 1];
      var bodyRaw  = msg.getPlainBody() || msg.getBody().replace(/<[^>]+>/g, ' ');
      emailMetas.push({
        emailId:  thread.getId(),
        subject:  String(msg.getSubject() || '(no subject)'),
        from:     String(msg.getFrom()    || ''),
        date:     Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        bodyText: bodyRaw.replace(/\s+/g, ' ').trim().substring(0, 1500)
      });
    } catch (eThread) {
      Logger.log('scanGmail thread ' + i + ' read error: ' + eThread.message);
    }
  }

  if (!emailMetas.length) return { status: 'success', emails: [], query: query };

  
  var parsedArray = parseEmailsBatch_(emailMetas, apiKey);

  
  var results = emailMetas.map(function(em, idx) {
    return {
      emailId: em.emailId,
      subject: em.subject,
      from:    em.from,
      date:    em.date,
      parsed:  (parsedArray && parsedArray[idx]) ? parsedArray[idx] : null
    };
  });

  return { status: 'success', emails: results, query: query };
}



function parseEmailsBatch_(emailMetas, apiKey) {
  var n = emailMetas.length;

  var prompt =
    'You are a warehouse assistant for a glass and window installation company.\n' +
    'Analyze the following ' + n + ' emails and extract delivery/shipment information from each.\n\n' +
    'Return ONLY a valid JSON array with exactly ' + n + ' objects, one per email, in the same order.\n' +
    'Each object must have these exact fields:\n' +
    '{\n' +
    '  "isDelivery": true/false,\n' +
    '  "name":     "material or product name (empty string if unclear)",\n' +
    '  "category": "one of: WINDOW|SCREEN|WINDOW_PARTS|SHOWER|MIRROR|STOREFRONT|TOOLS|BONEYARD|FLASHING|SCREWS|IGU — or empty string",\n' +
    '  "qty":      number or null,\n' +
    '  "unit":     "UNIT|SQ FT|LN FT|PIECE|BOX|PALLET",\n' +
    '  "supplier": "vendor name (use sender company if not in body)",\n' +
    '  "po":       "PO number or null",\n' +
    '  "estDate":  "YYYY-MM-DD or null",\n' +
    '  "project":  "project name or null",\n' +
    '  "pm":       "project manager name or null",\n' +
    '  "notes":    "tracking number, delivery window, or brief note"\n' +
    '}\n\n' +
    'Return ONLY the JSON array — no markdown, no explanation.\n\n';

  emailMetas.forEach(function(em, idx) {
    prompt +=
      '=== EMAIL ' + (idx + 1) + ' ===\n' +
      'Subject: ' + em.subject + '\n' +
      'From: '    + em.from    + '\n' +
      'Body: '    + em.bodyText + '\n\n';
  });

  var requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.05, maxOutputTokens: 4096 }
  };

  try {
    var response = geminiFetch_(requestBody, apiKey);
    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code === 429) {
      Logger.log('Gemini batch: 429 quota exceeded. Free tier limit reached.');
      return null;
    }
    if (code !== 200) {
      Logger.log('Gemini batch HTTP ' + code + ': ' + body.substring(0, 400));
      return null;
    }

    var result = JSON.parse(body);
    var cand   = result.candidates && result.candidates[0];
    var parts  = cand && cand.content && cand.content.parts;
    var text   = (parts && parts[0] && parts[0].text) ? String(parts[0].text).trim() : '';

    if (!text) {
      Logger.log('Gemini batch: empty response. finishReason=' + (cand && cand.finishReason));
      return null;
    }

    
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    
    try {
      var arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('Not an array');
      
      while (arr.length < emailMetas.length) arr.push(null);
      return arr;
    } catch (eJson) {
      
      var match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          var arr2 = JSON.parse(match[0]);
          if (Array.isArray(arr2)) {
            while (arr2.length < emailMetas.length) arr2.push(null);
            return arr2;
          }
        } catch(e2) {}
      }
      Logger.log('Gemini batch JSON parse failed. Text: ' + text.substring(0, 500));
      return null;
    }
  } catch (eFetch) {
    Logger.log('Gemini batch fetch error: ' + eFetch.message);
    return null;
  }
}




function parseEmailTextAsIncoming_(bodyText, subject, from, apiKey) {
  var prompt =
    'You are analyzing an email received by a glass and window installation warehouse.\n\n' +
    'Email subject: ' + subject + '\n' +
    'From: ' + from + '\n\n' +
    'Email body:\n' + bodyText + '\n\n' +
    'Extract incoming delivery information and return ONLY a valid JSON object — no markdown, no extra text:\n' +
    '{\n' +
    '  "isDelivery": true or false,\n' +
    '  "name":     "material or product name",\n' +
    '  "category": "WINDOW|SCREEN|WINDOW_PARTS|SHOWER|MIRROR|STOREFRONT|TOOLS|BONEYARD|FLASHING|SCREWS|IGU or empty string",\n' +
    '  "qty":      number or null,\n' +
    '  "unit":     "UNIT|SQ FT|LN FT|PIECE|BOX|PALLET",\n' +
    '  "supplier": "vendor name",\n' +
    '  "po":       "PO number or null",\n' +
    '  "estDate":  "YYYY-MM-DD or null",\n' +
    '  "project":  "project name or null",\n' +
    '  "pm":       "project manager name or null",\n' +
    '  "notes":    "tracking number or useful note"\n' +
    '}\n' +
    'Return ONLY the JSON object, no other text.';

  var models = geminiModels_();
  var baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
  var requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.05, maxOutputTokens: 512 }
  };

  for (var m = 0; m < models.length; m++) {
    try {
      var url = baseUrl + models[m] + ':generateContent?key=' + apiKey;
      var response = UrlFetchApp.fetch(url, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });

      var code = response.getResponseCode();
      var body = response.getContentText();

      if (code !== 200) {
        Logger.log('Gemini ' + models[m] + ' HTTP ' + code + ': ' + body.substring(0, 300));
        if (code === 429) {
          
          Logger.log('Gemini quota exceeded. Upgrade at aistudio.google.com or use a paid API key.');
          break;
        }
        continue;
      }

      var result = JSON.parse(body);
      if (!result.candidates || !result.candidates.length) {
        Logger.log('Gemini ' + models[m] + ': no candidates. Body: ' + body.substring(0, 300));
        continue;
      }

      
      var cand    = result.candidates[0];
      var content = cand && cand.content;
      var parts   = content && content.parts;
      var text    = (parts && parts[0] && parts[0].text) ? String(parts[0].text) : '';

      if (!text) {
        Logger.log('Gemini ' + models[m] + ': empty text. finishReason=' + (cand && cand.finishReason || '?'));
        continue;
      }

      
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      try {
        return JSON.parse(text);
      } catch (eJson) {
        var match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { return JSON.parse(match[0]); } catch(e2) {}
        }
        Logger.log('Gemini ' + models[m] + ' JSON parse failed. Text: ' + text.substring(0, 300));
        continue;
      }

    } catch (eFetch) {
      Logger.log('Gemini ' + models[m] + ' fetch error: ' + eFetch.message);
      continue;
    }
  }

  
  return {
    isDelivery: true,
    name: '',
    category: '',
    qty: 1,
    unit: 'UNIT',
    supplier: (from || '').replace(/<[^>]+>/g, '').trim(),
    po: null,
    estDate: null,
    project: null,
    pm: null,
    notes: '⚠ AI parsing failed — check GAS Logs for details. Fill fields manually.'
  };
}





function getMonitoredMaterials(sessionToken, interno) {
  var auth = getUserRole(sessionToken);
  if (auth.role === 'DENIED' || auth.role === 'NO_SESSION') throw new Error('Not authenticated.');
  
  
  if (!interno) requireQuota_('mon_read', auth.email || sessionToken, 180, 300);
  var props = PropertiesService.getScriptProperties();
  var raw   = props.getProperty('WMS_MONITORED_MATERIALS');
  if (!raw) return null;
  try   { return JSON.parse(raw); }
  catch (e) { return null; }
}








function extractDocumentInfo(fileData, mimeType, sessionToken) {
  
  
  
  
  
  
  
  
  var auth = getUserRole(sessionToken);
  if (auth.role === 'DENIED' || auth.role === 'NO_SESSION') throw new Error('Not authenticated. Please sign in with your Google account.');

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

  var requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: fileData } }
      ]
    }],
    generationConfig: { temperature: 0.05 }
  };

  var response = geminiFetch_(requestBody, apiKey);

  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    var errObj = {};
    try { errObj = JSON.parse(body); } catch(e) {}
    throw new Error(geminiErrorText_(code, errObj.error ? errObj.error.message : body.substring(0, 200)));
  }

  var result = JSON.parse(body);
  if (!result.candidates || !result.candidates.length) {
    throw new Error('Gemini returned no candidates. The document may be unclear or blocked.');
  }

  var text = (result.candidates[0].content.parts[0].text || '').trim();

  
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return { status: 'success', data: JSON.parse(text) };
  } catch(e) {
    
    var match = text.match(/\{[\s\S]*\}/);
    if (match) return { status: 'success', data: JSON.parse(match[0]) };
    throw new Error('Could not parse AI response. Raw: ' + text.substring(0, 300));
  }
}

function setMonitoredMaterials(names, auth) {
  auth = requireAuth_('ADMIN');    
  var props = PropertiesService.getScriptProperties();
  if (!names || names.length === 0) {
    props.deleteProperty('WMS_MONITORED_MATERIALS');
    return { status: 'success', message: 'Monitoring all materials (no filter applied).' };
  }
  
  var normalized = names.map(function(n){ return String(n).toUpperCase().trim(); });
  props.setProperty('WMS_MONITORED_MATERIALS', JSON.stringify(normalized));
  return { status: 'success' };
}
