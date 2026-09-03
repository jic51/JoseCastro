// ════════════════════════════════════════════════════════════════════════════════
//  OX GLASS CO. — WMS v3.0  |  Code.gs  (FIXED)
//  Fixes: ENTRY destLoc, calculateStock siteQty, EXIT/DISPATCH unified,
//         RETURN logic, custom on-demand notifications, WASTE-only auto-email
// ════════════════════════════════════════════════════════════════════════════════

// ⚠️ NAMING RULE — THIS IS A SECURITY BOUNDARY, NOT A STYLE CHOICE ⚠️
//
// A helper that must NOT be callable from a browser has to END with an
// underscore:  doThing_()   — NOT  _doThing().
//
// Apps Script exposes every top-level function to google.script.run, and the
// ONLY name-based exception is a TRAILING underscore. A leading underscore
// looks private but is worth exactly nothing: any visitor who can open the web
// app URL can call it straight from the browser console.
//
// This codebase used `_name` for 66 helpers, and that was a real hole, not a
// theoretical one. makeSessionToken_(email) mints a signed 30-day session token
// for whatever address it is handed — so while it was named `_makeSessionToken`,
// one console call returned a valid ADMIN token for any email and walked past
// every requireAuth_() gate in this file. serverSecret_() handed out the HMAC
// signing key outright, and oauthCfg_() the OAuth client secret. All 66 were
// renamed in v8.21.
//
// When adding a helper: end it with `_`. Only these are meant to be reachable
// from the browser, and each authenticates for itself —
//   doGet, getInitialData, processMovement, getPrivateFileData,
//   getPrivateFileThumbnail, heartbeat, pollLogin, reportIssue,
//   extractDocumentInfo, getSetupState, saveSetupWizard, checkDeploymentReady,
//   saveWebAppUrl, getIncoming, addIncoming, updateIncoming, deleteIncoming,
//   getMonitoredMaterials
// — plus the menu/trigger entry points, gated by getUi() / requireOwnerContext_().
//
// v11.27: this paragraph was the whole of the rule, and a paragraph does not
// fail a build. The five Incoming/monitor names above were reachable and
// authenticating correctly for two versions before anyone noticed the list had
// never been updated to admit it — and in the same period `getSystemActivity`
// went out with no trailing `_` and no check at all, reading the audit sheet
// for anyone who typed its name into a browser console.
//
// tools/test-endpoint-auth.js now enumerates every public global in this file
// and fails unless each one either carries a recognised guard or is named in
// its allow-list with a written reason. The rule is still stated here for
// whoever is reading; what makes it hold is that the test counts the doors.

// Version handshake — bump this whenever Code.gs and Index.html change together.
// getInitialData() returns it; the frontend compares against its own APP_VERSION
// and warns if they differ (i.e. one file was deployed without the other).
var APP_VERSION = '11.39';
// Build fingerprint — a short hash of the two shipped files, written by
// tools/build-fingerprint.js and shown next to the version in the app.
//
// It DETECTS drift, it does not prevent it. Nothing inside a copy running in
// the customer's own account can stop them editing it. What this buys: it
// tells "they are behind" apart from "they changed it", it lets Jose ask
// "what does your footer say?" instead of asking for the file, and it makes
// concealing an edit a deliberate act rather than an accident — which is the
// part that matters in docs/LICENCIA-E-INTEGRIDAD.md.
//
// Never edit this by hand. Run: node tools/build-fingerprint.js --stamp
var APP_BUILD = 'ae5491e2';

// The browser-tab icon every installation gets unless it sets FAVICON_URL.
// See the note in doGet for why one shared mark rather than each customer's
// own logo.
//
// This is the SQUARE stacked-boxes mark, out of Jose's own Drive — no customer
// file is published, so nothing of theirs becomes public. It moves to
// acopio.net/favicon.png once the domain exists; this line is the only change.
//
// ─── THE `#.png` ON THE END IS LOAD-BEARING. DO NOT TIDY IT AWAY. ───────────
// The docs spell out the rule in one clause that is easy to read past:
//
//   iconUrl — "The URL of the favicon image, WITH THE IMAGE EXTENSION
//              indicating the image type."
//
// Google decides the image type from how the URL ENDS, not from what the
// server sends back. A Drive URL ends in a file id, so there is no extension
// to read and the icon is rejected — Apps Script issue 36756649 comment #22
// reports the exact message, "The favicon icon image type is not supported",
// for precisely this case, and comment #23 gives the fix used here: append a
// fragment so the URL ends in the extension.
//
// A fragment is the right tool because browsers never send it to the server.
// Google reads ".png" off the end; Drive receives the identical request it
// received before. Nothing about the image changes — only what Google can tell
// about it.
//
// Two versions of this were deployed with no extension and no icon appeared,
// which is consistent with the rule above and was the missing piece rather
// than proof that the whole approach was impossible. setTitle() working on the
// same object was always the sign that Apps Script CAN reach the outer page.
//
// lh3.googleusercontent.com/d/ID is kept over drive.google.com/uc?export=view
// because Jose confirmed this exact URL renders an image in an incognito
// window — so it is public and it serves image bytes to a browser. That is the
// half already proven; the extension is the half that was missing.
//
// VERIFIED WORKING. Jose deployed v10.9 and the Acopio mark appears in the
// browser tab. That settles the open question from three versions back:
// setFaviconUrl IS honoured on an /exec web app. Everything that looked like
// "Google may not support this" was the missing extension and nothing else.
//
// v11.0 swaps in the transparent-background mark. Transparent is the right
// choice for a tab icon: it sits cleanly on light and dark browser chrome
// alike, where a white square would show its edges on one of the two.
//
// Long term this moves to acopio.net/favicon.png: a plain file at a plain URL
// needs none of the above, and Drive is a poor host for something every
// customer fetches on every load.
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
  // Only ever created inside a BACKUP COPY, never in the live file — see
  // writeConfigSnapshot_.
  CONFIG_SNAPSHOT: 'ACOPIO_CONFIG_SNAPSHOT',
  // How many stocking units are in a box, a pallet, a sack. See
  // docs/UNIDADES-Y-CONVERSIONES.md.
  PACKS: 'MATERIAL_PACKS'
};

// Column map matches the ACTUAL sheet structure (19 columns, 0-indexed):
//  A=0:Timestamp  B=1:Type(Category)  C=2:Name  D=3:GC  E=4:PO#  F=5:Qty
//  G=6:Unit  H=7:DateRec  I=8:Loc(SrcLoc)  J=9:Supplier  K=10:Comments
//  L=11:Status  M=12:Received By  N=13:Project  O=14:MatID  P=15:DocLinks
//  Q=16:UserEmail  R=17:Destination(DestLoc)  S=18:MoveType
var AC = {
  TIMESTAMP:0,  CATEGORY:1,  NAME:2,     GC:3,        PO:4,
  QTY:5,        UNIT:6,      DATE_REC:7, SRC_LOC:8,   SUPPLIER:9,
  COMMENTS:10,  STATUS:11,   RESPONSIBLE:12, PROJECT:13, MAT_ID:14,
  DOC_LINKS:15, USER_EMAIL:16, DEST_LOC:17,  MOVETYPE:18, PM:19,
  // Added for pricing. Appended at the end, not inserted among the columns
  // above, on purpose: every other index in AC is a POSITION some existing
  // sheet already has data in, and inserting would shift every column after
  // it on every installation that has ever saved a movement. Appending is the
  // only change here that is safe on data that already exists.
  UNIT_COST:20, TOTAL_COST:21
};
// The archive row's true width. Every fixed-size read or write of the whole
// row uses this constant, not a literal — four different places in this file
// used to each spell out `20` by hand, which is exactly the kind of duplicated
// magic number that gets fixed in three places and shipped broken in the
// fourth. One constant, so adding a column here again means changing ONE line.
var AC_WIDTH = 22;

// ═══ COMPANY IDENTITY ════════════════════════════════════════════════════════
// Everything that used to say "OX Glass" reads from here instead, so one copy
// of this template can belong to any company. Values live in Script Properties
// rather than the CONFIG sheet: they are single values, not lists, and they must
// be readable before anyone has authenticated (the sign-in screen shows the
// company name, and getSetupState() runs on a copy with no users at all).
var PRODUCT_NAME = 'Acopio';

function companySettings_() {
  var p = PropertiesService.getScriptProperties();
  return {
    name:   p.getProperty('COMPANY_NAME')   || '',
    domain: p.getProperty('COMPANY_DOMAIN') || '',
    logoId: p.getProperty('COMPANY_LOGO_ID')|| '',
    // Default is the pre-wizard folder name ON PURPOSE. Installations that
    // existed before this feature already have OX_WMS_v3_Docs full of files;
    // changing the default would orphan every one of them. The wizard only sets
    // a prefix on copies that don't have one yet.
    folderPrefix:  p.getProperty('FOLDER_PREFIX') || 'OX_WMS_v3',
    setupComplete: p.getProperty('SETUP_COMPLETE') === 'true'
  };
}

// Branding safe to hand an unauthenticated visitor: what the sign-in screen
// needs to look like the customer's own system, and nothing more. The Drive
// folder prefix and setup flag stay server-side.
function publicCompany_() {
  var cs = companySettings_();
  return { name: cs.name, domain: cs.domain, logoId: cs.logoId, productName: PRODUCT_NAME };
}

// ─── UNA SOLA CARPETA MAESTRA ────────────────────────────────────────────────
// Las tres carpetas de la app nacían sueltas en la raíz del Drive del dueño, y
// la hoja quedaba en un cuarto sitio. Con dos o tres instalaciones de prueba
// eso ya es un Drive imposible de ordenar — y el día que un cliente pide
// soporte, hay que buscar en un Drive que no es el nuestro.
//
// Los NOMBRES no cambian, solo la ubicación. Es deliberado: el chequeo de
// seguridad de los adjuntos compara por nombre, y renombrar la carpeta de
// documentos es exactamente lo que dejó archivos huérfanos una vez. Mover es
// seguro — Drive identifica por ID, no por dónde está.
//
//   Acopio_<Empresa>/                       ← maestra
//   ├── <Empresa> — Acopio                  ← la hoja
//   ├── Acopio_<Empresa>_Docs/
//   ├── Acopio_<Empresa>_Backups/
//   └── Acopio_<Empresa>_Feedback/
function masterFolderName_() { return companySettings_().folderPrefix; }

function getMasterFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_MASTER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }   // borrada o movida a papelera
  var f = DriveApp.createFolder(masterFolderName_());
  try { props.setProperty('FOLDER_MASTER', f.getId()); } catch (e) {}
  return f;
}

// Ordenar es una comodidad, nunca una razón para que falle una subida: si Drive
// se niega a mover algo, el archivo ya está guardado y eso es lo que importa.
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

// Recoge lo que ya existe suelto y lo mete en la maestra. Para instalaciones
// anteriores a esto, y como reparación si alguien mueve algo de sitio.
function organizeDriveFolders_() {
  var moved = [];
  var master = getMasterFolder_();

  [docsFolderName_(), backupFolderName_(), feedbackFolderName_()].forEach(function (name) {
    var key = 'FOLDER_' + name.replace(/\W/g, '_');
    var id  = PropertiesService.getScriptProperties().getProperty(key);
    if (!id) return;                       // nunca se creó: nada que mover
    try {
      var f = DriveApp.getFolderById(id);
      var already = false;
      var ps = f.getParents();
      while (ps.hasNext()) if (ps.next().getId() === master.getId()) already = true;
      if (!already) { f.moveTo(master); moved.push(f.getName()); }
    } catch (e) { Logger.log('organizeDriveFolders_ ' + name + ': ' + e.message); }
  });

  // La hoja también. Es el archivo que el cliente abre a diario, así que vivir
  // fuera de su propia carpeta es justo lo que hace difícil encontrarla.
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

// Company name → a name that is safe as a Drive folder and readable in Drive.
function folderPrefixFor_(companyName) {
  var slug = String(companyName || '').trim()
    .replace(/[^\w\s-]/g, '')      // drop punctuation Drive dislikes
    .replace(/\s+/g, '_')
    .substring(0, 40);
  return slug ? (PRODUCT_NAME + '_' + slug) : (PRODUCT_NAME + '_WMS');
}

// Who receives admin notifications. Falls back to the owner of this copy —
// never to a hardcoded address, which on a customer's copy would silently mail
// their inventory alerts to us.
function adminNotifyEmail_() {
  try {
    var cfg = loadConfig();
    if (cfg.adminEmail) return cfg.adminEmail;
  } catch (e) {}
  try { return Session.getEffectiveUser().getEmail(); } catch (e) { return ''; }
}

// ═══ SETUP WIZARD ════════════════════════════════════════════════════════════
// Called by the frontend before anything else. On a fresh copy nobody is in
// USERS_V3 yet, so getUserRole() would answer DENIED and lock the owner out of
// their own system — this endpoint deliberately runs before that gate.
//
// Only the OWNER of the copy may complete setup. requireOwnerContext_() is what
// enforces it: under "Execute as: Me", getEffectiveUser() is always the owner
// while getActiveUser() is whoever is visiting, so the two match for the owner
// and nobody else. That matters because the web app is reachable by anyone with
// a Google account and the URL — without this check, whoever opened an
// unconfigured copy first could make themselves its administrator.
function getSetupState() {
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

// Creates every sheet the app needs, so setup can start from a BLANK Google
// Sheet the customer made themselves. Before this, the app assumed
// MASTER_ARCHIVE_V3, CONFIG and friends already existed — true only for a copy
// of an existing installation, which meant shipping the product as "here is my
// spreadsheet, copy it". Nobody wants to run their business on a duplicate of
// someone else's file, and it made the first-run experience "Archive sheet not
// found" instead of a working system.
//
// Existing sheets are never touched: this only fills in what is missing, so it
// is safe on an installation that already has data.
function ensureCoreSheets_(ss) {
  var SPEC = [
    { name: SHEETS.ARCHIVE, header: [
        'System Date','Type','Name','GC','PO#','Qty','Unit','Date Received','Source Location',
        'Supplier','Comments','Status','Received By','Project','Mat ID','Doc Links','User Email',
        'Destination Location','MoveType','PM','Unit Cost','Total Cost'] },
    { name: SHEETS.CONFIG, header: [
        'Projects','Categories','Suppliers','Locations','Location Type','User Email','User Role',
        'Admin Email','Truck','Truck Person','Truck Status','Min Stock Material','Min Stock Qty',
        'Archive Cutoff Months','Cost Category','Cost Material','Avg Cost'] },
    { name: SHEETS.RESERVATIONS, header: [
        'ID','Category','Name','Project','Qty','Reserved By','Date','Status','Release Date'] },
    { name: SHEETS.AUDIT, header: ['Timestamp','Action','User','Details','Old Value','New Value'] },
    // Rebuilt wholesale (headers included) by refreshDerivedSheets_ — they only
    // need to exist.
    { name: SHEETS.LIVE, header: null },
    { name: SHEETS.SITE, header: null }
  ];

  var created = [];
  SPEC.forEach(function(spec){
    if (ss.getSheetByName(spec.name)) return;
    var sheet;
    // A brand-new spreadsheet arrives with one empty default tab ("Sheet1" /
    // "Hoja 1"). Reuse it for the first sheet we need rather than leaving a
    // stray empty tab next to the real ones.
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

  // These already had their own ensure* helpers; call them so a fresh copy ends
  // up with the complete set in one pass.
  try { ensureUsersSheet_(ss);          } catch (e) {}
  try { ensureIncomingSheet_(ss);       } catch (e) {}
  try { ensureRackPhotosSheet_(ss);     } catch (e) {}
  try { ensureMaterialLocksSheet_(ss);  } catch (e) {}
  try { ensurePmDirectorySheet_(ss);    } catch (e) {}
  try { ensureErrorLogSheet_(ss);       } catch (e) {}
  try { ensureWasteSheet_(ss);          } catch (e) {}
  try { ensureArchiveHistorySheet_(ss); } catch (e) {}
  return created;
}

function saveSetupWizard(data) {
  data = data || {};
  var cs = companySettings_();
  var actor;
  if (cs.setupComplete) {
    // Re-run later from Settings — normal admin rules apply.
    actor = requireAuth_('ADMIN').email;
  } else {
    // First run: owner only, and nobody is registered yet, so establish the
    // identity ourselves rather than reading it from a user list that is empty.
    actor = requireOwnerContext_();
    setVerifiedAuth_({ role: 'ADMIN', email: actor, name: 'Setup wizard' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p  = PropertiesService.getScriptProperties();

  // Before anything else — a blank spreadsheet has none of the sheets the rest
  // of this function (and the whole app) writes to.
  ensureCoreSheets_(ss);

  var companyName = String(data.companyName || '').trim();
  if (!companyName) throw new Error('Company name is required.');
  p.setProperty('COMPANY_NAME', companyName);
  p.setProperty('COMPANY_DOMAIN', String(data.companyDomain || '').trim().replace(/^@/, ''));

  // The spreadsheet file itself still said "Untitled spreadsheet" or whatever
  // the customer typed before running setup — fix that too, not just the data
  // inside it. This does NOT change the Apps Script project's own name (the one
  // shown on Google's "trust this app" screen) — that lives on the hidden
  // per-copy Cloud project and can only be changed by hand in the Apps Script
  // editor, which is why the publish step also tells them to do it there.
  try {
    var wanted = companyName + ' — ' + PRODUCT_NAME;
    if (ss.getName() !== wanted) ss.rename(wanted);
  } catch (e) {}

  // Only ever set once. Re-running the wizard must not rename the folders that
  // already hold this company's documents.
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
    // Guarded on .length, not just truthiness — an empty array [] is truthy in
    // JS. Re-running the wizard (e.g. after a browser refresh mid-flow, or just
    // to reconfigure one thing) with a step the customer clicked through
    // without re-entering anything must NOT wipe out what they configured the
    // first time.
    if (data.categories && data.categories.length) writeConfigColumn_(cfg, 1, data.categories);
    if (data.suppliers  && data.suppliers.length)  writeConfigColumn_(cfg, 2, data.suppliers);
    if (data.projects   && data.projects.length)   writeConfigColumn_(cfg, 0, data.projects);
    if (data.locations && data.locations.length) {
      writeConfigColumn_(cfg, 3, data.locations.map(function(l){ return l.name; }));
      writeConfigColumn_(cfg, 4, data.locations.map(function(l){ return l.type || 'RACK'; }));
    }
    cfg.getRange(2, 8).setValue(sheetSafe_(String(data.adminEmail || actor).trim()));
  }

  // The owner becomes ADMIN. Written directly rather than through addUser(),
  // which requires an already-authenticated admin — the very thing that does
  // not exist yet on a fresh copy.
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
    if (['ADMIN','WAREHOUSE','VIEWER'].indexOf(role) === -1) role = 'WAREHOUSE';
    users.appendRow(['USR-' + (now.getTime() + i), sheetSafe_(email),
                     sheetSafe_(String(u.name || '').trim()), role, actor, now, true]);
    existing[email] = true;
  });

  // This is the ONLY line that schedules the nightly backup during setup, and it
  // used to swallow its error whole: `catch (e) {}`. A customer who ticked "back
  // my data up every night", and whose trigger then failed to install, was told
  // setup had finished — and would find out months later, on the one day it
  // matters, that no backup was ever made. Nothing else looked.
  //
  // Now it says so three ways, because a Logger.log in an installation nobody
  // reads is not telling anybody: the log, a stored flag, and Check installation
  // (which reinstalls it).
  if (data.enableBackup) {
    try {
      ensureBackupTrigger_();
      p.deleteProperty('BACKUP_TRIGGER_ERROR');
    } catch (e) {
      Logger.log('ensureBackupTrigger_ FAILED during setup: ' + e.message);
      try { p.setProperty('BACKUP_TRIGGER_ERROR', String(e.message || e).slice(0, 400)); } catch (e2) {}
    }
  }

  // Con el nombre de la empresa ya definido, la carpeta maestra puede nacer con
  // el nombre correcto y la hoja mudarse a ella de una vez.
  try { organizeDriveFolders_(); } catch (e) { Logger.log('organizeDriveFolders_: ' + e.message); }

  // Populates LIVE_STOCK / SITE_STOCK / WASTED_STOCK with their headers (and
  // any stock, on a copy that already has movements) so the first load reads a
  // valid, if empty, set of derived sheets instead of failing.
  try { refreshDerivedSheets_(ss); } catch (e) {}

  // Read the acceptance off the welcome sheet BEFORE deleting it. This is the
  // first moment the code runs WITH authorization, so it is the first moment we
  // can record who accepted rather than only that somebody did.
  recordTermsAcceptance_(actor);
  removeStartHereSheet_(ss);   // setup done — the welcome sheet has served its purpose

  // Stamped ONCE, not on every re-save. saveSetupWizard also runs whenever an
  // existing admin re-opens setup to tweak a company setting — if this were
  // overwritten each time, "days since setup" would reset on every unrelated
  // change and the check-in below would never reach its milestones.
  if (!p.getProperty('SETUP_COMPLETED_AT')) p.setProperty('SETUP_COMPLETED_AT', new Date().toISOString());
  try { ensureCheckinTrigger_(); } catch (e) { Logger.log('ensureCheckinTrigger_: ' + e.message); }

  p.setProperty('SETUP_COMPLETE', 'true');
  auditLog_(ss, 'SETUP_COMPLETED', actor, companyName, '', '');
  return { status: 'success', companyName: companyName };
}

// Replaces one CONFIG column wholesale, leaving every other column untouched
// (CONFIG packs unrelated lists side by side, so a whole-sheet write would
// destroy trucks, min-stock levels and the archive cutoff).
function writeConfigColumn_(cfg, colIdx, values) {
  values = (values || []).map(function(v){ return String(v || '').trim(); })
                         .filter(function(v){ return v; });
  var lastRow = cfg.getLastRow();
  if (lastRow > 1) cfg.getRange(2, colIdx + 1, lastRow - 1, 1).clearContent();
  if (!values.length) return;
  var needed = values.length + 1;
  if (cfg.getMaxRows() < needed) cfg.insertRowsAfter(cfg.getMaxRows(), needed - cfg.getMaxRows());
  cfg.getRange(2, colIdx + 1, values.length, 1)
     .setValues(values.map(function(v){ return [sheetSafe_(v)]; }));
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────
function doGet(e) {
  // OAuth popup callback: Google redirects here with ?code=...&state=... after a
  // non-org user signs in. Handle it as a tiny page instead of the full app.
  if (e && e.parameter && e.parameter.code && e.parameter.state) {
    return handleOAuthCallback_(e.parameter.code, e.parameter.state);
  }
  var out = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle((companySettings_().name || 'Warehouse') + ' — ' + PRODUCT_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  // THE TAB ICON HAS TO BE SET HERE, NOT IN THE PAGE.
  //
  // v9.84 shipped a `<link rel="icon">` swap inside Index (_setFavicon) and it
  // was wrong — Jose ran two installations for weeks and both kept Apps
  // Script's generic icon. The reason is the same sandbox that already
  // defeated inline PDFs and direct file requests: what Index renders is an
  // IFRAME on googleusercontent.com, and a browser tab takes its icon from
  // the TOP-LEVEL document, which belongs to Google. Nothing the page does to
  // its own <head> can reach it. setTitle works precisely because it is this
  // same server-side call, applied to the outer page — which is why the tab
  // says the company name while the icon never changed.
  //
  // setFaviconUrl needs a URL Google itself can fetch, so it cannot be a
  // data: URI and cannot be a private Drive file. It reads a Script Property
  // so an installation can be pointed at the Acopio mark, or at the
  // customer's own, without a code change. Unset simply leaves Google's
  // default — the behaviour everyone has today.
  // Decided with Jose (v10.3): the DEFAULT is Acopio's own mark, the same on
  // every installation, and no customer ever touches it. The earlier plan —
  // upload a square PNG, publish it, build a Drive URL, paste it into Script
  // Properties — was a to-do list, not a feature. No customer would do it, and
  // Jose did not want to ask them to.
  //
  // One mark for everyone is also the better product decision, not a
  // concession: every tab open in every warehouse showing the Acopio icon is
  // the difference between looking like a product and looking like a
  // spreadsheet.
  //
  // Per-customer icons are deliberately deferred (BACKLOG: "Level 2"). Doing
  // it properly means publishing a file out of the customer's own Drive, which
  // needs explicit consent AND fails silently on Workspace domains that forbid
  // link-sharing — a whole feature, not a line.
  //
  // FAVICON_URL still wins when set, so a customer who wants their own is one
  // property away and nothing here has to change.
  var favicon = String(PropertiesService.getScriptProperties().getProperty('FAVICON_URL') || '').trim();
  if (!favicon) favicon = ACOPIO_FAVICON_URL;
  if (/^https:\/\//i.test(favicon)) {
    try { out.setFaviconUrl(favicon); } catch (e) { Logger.log('setFaviconUrl: ' + e.message); }
  }
  return out;
}

// ─── PRIVATE DOCUMENT ACCESS ──────────────────────────────────────────────
// Replaces "anyone with the link can view" on uploaded photos/PDFs. Files are
// created with NO public sharing at all (Drive's default: visible only to the
// script's own identity, i.e. the app owner). The only way to see one is
// through this function, which verifies the caller before returning anything.
//
// An earlier version of this tried to serve files as a second HTTP GET request
// (?fileId=...) that the browser made directly — as an <img src> or <iframe
// src> pointing back at this same web app. That failed in real testing
// ("google.com refused to connect"): the app already runs inside a Google-
// managed sandboxed frame, and a raw sub-resource request to a SECOND Apps
// Script URL from inside that frame doesn't carry Google's session state the
// way a normal page load does — Google's own login gate kicked in and then
// refused to render inside the frame.
//
// This version sidesteps that entirely by going through google.script.run —
// the exact same RPC channel every other feature in this app already uses
// successfully (saving a movement, loading stock, etc.), so there's no new
// cross-origin or sandboxing behavior to fail. It returns the file as base64;
// the frontend turns that into a data: URL locally, no second network request
// to Apps Script at all.
function getPrivateFileData(fileId, token) {
  var file = resolveOwnFile_(fileId, token, 'getPrivateFileData');
  // Checked before getBlob(), which is what actually fails on a large file —
  // with an untranslated Apps Script message ("… supera el tamaño de archivo
  // máximo permitido") that says nothing about what to do next.
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

// Same file, DriveApp's small pre-rendered thumbnail instead of the full blob
// — for the many small (~30-50px) previews on screen at once (the Movements
// Doc column, the Dashboard's photo/document grid, rack photos): those never
// needed the full file, so fetching it was pure waste, and on a slow
// connection or an underpowered computer that waste is what "the app feels
// slow" actually was. A grid of 20 rows with a document each used to pull 20
// full files just to paint them at 34px.
//
// Bonus this makes possible almost for free: getThumbnail() works for PDFs
// too (Drive renders one from page 1), so a PDF's grid preview stops being a
// generic 📄 icon and becomes an actual look at the document — inline PDF
// preview is still blocked by Apps Script's sandbox (see the media-preview
// code), but the grid never hit that wall to begin with.
//
// Returns null (not an error) when Drive has no thumbnail for this file yet —
// happens on a very recently uploaded file, or a type Drive doesn't render.
// The frontend already has an icon fallback for exactly this case.
// size (optional): requested pixel size for the long edge. DriveApp's own
// getThumbnail() only ever returns Drive's small fixed-size render, which is
// right for a 34px grid cell but useless as an actual preview — so when a size
// is asked for we go through the Drive REST API's thumbnailLink instead, which
// accepts a size suffix. This is what makes a readable page-1 preview of a PDF
// possible inside the app, where Chrome's PDF plugin is blocked by Apps
// Script's sandbox. Falls back to the small thumbnail if the REST path fails.
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

// Drive hands back a thumbnailLink ending in a size suffix like "=s220"; swapping
// that for a bigger value is the documented way to get a larger render. Both
// calls carry the script's own OAuth token — thumbnailLink is NOT a public URL,
// and the caller has already passed resolveOwnFile_'s ownership check.
// Returns null on any failure so the caller can fall back rather than error out.
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

// Shared by getPrivateFileData/getPrivateFileThumbnail: authenticates the
// caller and confirms the requested file is actually one this app manages.
// Without the folder check, an authenticated WAREHOUSE user could pass ANY
// Drive file ID the owner's account can reach — not just this app's own
// uploads — turning either endpoint into a way to browse the owner's entire
// personal Drive.
function resolveOwnFile_(fileId, token, callerName) {
  var auth = setVerifiedAuth_(getUserRole(token));
  if (auth.role === 'NO_SESSION' || auth.role === 'DENIED') {
    throw new Error('Not authenticated.');
  }

  // Highest ceiling of the lot: one page of the Movements table can legitimately
  // ask for dozens of thumbnails, and expanding stock rows adds more. The
  // frontend already caps itself at 3 concurrent and caches per file — this is
  // the backstop for a client that ignores both.
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

// Every root folder name this installation is allowed to serve files from.
//
// It is a LIST, not just the current name, because the current name can change
// out from under files that were already uploaded. Concretely, the bug this
// fixes: Script Properties do NOT survive "Make a copy" of a Sheet, but the
// sheet DATA does. So on a copy, FOLDER_PREFIX comes back empty, the wizard
// sets it fresh from the company name (e.g. Acopio_OX_Glass_LLC), and
// docsFolderName_() starts returning Acopio_OX_Glass_LLC_Docs — while every
// DOC_LINKS value copied along with the rows still points at files sitting in
// the OLD folder (OX_WMS_v3_Docs). The boundary check then rejected literally
// every existing document and photo as "outside app folder", which is exactly
// what the logs showed. Keeping the previous names accepted is what makes an
// upgrade/copy stop orphaning its own history.
function acceptedDocFolderNames_() {
  var names = [docsFolderName_()];
  // The pre-wizard default, hardcoded for the same reason companySettings_()
  // defaults to it: installations older than the wizard have all their files
  // under this name and nothing recorded in history to find them by.
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

// The same list as acceptedDocFolderNames_(), but as folder IDs.
//
// An ID survives a rename; a name does not. That difference cost a full day of
// diagnosis once already: if the customer renames Acopio_X_Docs in their own
// Drive, the app keeps WRITING there (the ID is cached) but stops being able to
// OPEN anything — "Requested file outside app folder" on every attachment they
// ever uploaded. Nothing in the app warned them, and nothing they could see
// explained it.
//
// getOrCreateFolder_() caches one Script Property per path segment, and the
// first segment of every documents path IS the bare root, so the ID is already
// there under the same key the name produces.
function acceptedDocFolderIds_() {
  var props = PropertiesService.getScriptProperties();
  var ids = [];
  acceptedDocFolderNames_().forEach(function (name) {
    var id = String(props.getProperty('FOLDER_' + name.replace(/\W/g, '_')) || '').trim();
    if (id && ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}

// Walks up a file's parent folders looking for one of this app's own root
// folders.
//
// BY ID FIRST, because that is the check that is actually correct — it is the
// folder we created, whatever the customer has since called it. The name check
// stays as a second chance rather than being replaced: an installation from
// before the ID was cached, or one whose cache was cleared, has no ID to match
// and would otherwise lose access to its whole history. Accepting either is
// strictly more permissive than what shipped before, so nothing that opens
// today can stop opening.
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

// Folders the app created whose name in Drive is no longer the name the app
// expects — i.e. somebody renamed them. Nothing is broken by this any more
// (the ID check above handles it), but it is still worth SAYING, because the
// folder names are how a person finds their own files, and because a renamed
// folder is a sign the customer wanted to call it something else — which is a
// conversation to have, not a fault to hide.
function renamedAppFolders_() {
  var props = PropertiesService.getScriptProperties();
  var out = [];
  var expected = [masterFolderName_(), docsFolderName_(), backupFolderName_(), feedbackFolderName_()];
  expected.forEach(function (name, i) {
    var key = (i === 0) ? 'FOLDER_MASTER' : 'FOLDER_' + name.replace(/\W/g, '_');
    var id  = String(props.getProperty(key) || '').trim();
    if (!id) return;                                   // never created — nothing to compare
    try {
      var actual = DriveApp.getFolderById(id).getName();
      if (actual !== name) out.push({ expected: name, actual: actual });
    } catch (e) { /* trashed or gone; the create-on-demand path handles that */ }
  });
  return out;
}

// ─── GOOGLE SIGN-IN (hybrid, for users outside the company's Workspace) ──────
// Company users are identified automatically via Session.getActiveUser() (same
// Workspace domain). Everyone else signs in with Google once: the popup runs the
// OAuth code flow, we exchange the code server-side for a VERIFIED email, then
// issue our own signed session token. The token (not a raw email) is what the
// browser stores and sends back — so identity can't be spoofed.

function oauthCfg_() {
  var p = PropertiesService.getScriptProperties();
  return { clientId: p.getProperty('OAUTH_CLIENT_ID') || '', clientSecret: p.getProperty('OAUTH_CLIENT_SECRET') || '' };
}

// ─── PAID ADD-ON: GMAIL DELIVERY SCANNER ─────────────────────────────────────
// Off unless the installation explicitly turns it on. It is the ONLY feature
// that needs https://mail.google.com/ — a scope Google classifies as
// "restricted", which is what forces a paid third-party CASA security audit
// (~$500–$4,500/yr, renewed annually) on anything distributed through the
// Workspace Marketplace. Keeping it out of the base manifest is what lets the
// base product ship with no restricted scopes at all, and it also shrinks the
// permission screen a new customer sees from "read all your email" to nothing
// of the sort.
//
// To enable on an installation that paid for it:
//   1. Add "https://mail.google.com/" back to oauthScopes in appsscript.json
//      (see appsscript.gmail-addon.json for the ready-made variant).
//   2. GAS Editor → ⚙ Project Settings → Script Properties →
//      GMAIL_SCAN_ENABLED = true
//   3. Re-run any function once so Google re-prompts for the new permission.
// Google retires Gemini model names on its own schedule — gemini-2.0-flash
// stopped answering and every AI feature returned a 404 that said nothing
// useful to a warehouse manager. The name lives in one place now, and in a
// Script Property, so a retirement is a two-minute settings change instead of
// a code release for every customer.
var GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash';

function geminiModel_() {
  return String(PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || '').trim()
         || GEMINI_MODEL_DEFAULT;
}

// Ordered fallbacks, tried in turn. The configured model first, then names that
// have outlived several deprecations — so one retirement does not take the
// feature down with it.
function geminiModels_() {
  var out = [geminiModel_()];
  ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'].forEach(function (m) {
    if (out.indexOf(m) === -1) out.push(m);
  });
  return out;
}

function geminiUrl_(model, apiKey) {
  return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
}

// Google's own wording, turned into something a warehouse manager can act on.
//
// "Gemini API error 503: This model is currently experiencing high demand" is
// accurate and useless: it names a system the reader has never heard of, and
// says nothing about whether they did something wrong, whether it will fix
// itself, or what to do in the meantime. Jose hit exactly that and had to ask
// what it meant — which is the definition of a bad error message.
//
// Every case below answers the same three questions: is it me, will it pass,
// and what do I do now. And every one of them says the work can still be done
// by hand, because it can, and nobody should be left staring at a dead screen
// waiting for Google.
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

// ─── THE AI KEY, SET FROM INSIDE THE APP ────────────────────────────────────
// The document reader runs on the customer's own Gemini key, billed to them by
// Google. Until now the only way to supply one was: open the Apps Script
// editor, find Project Settings, add a Script Property with the exact right
// name. That is a developer's instruction printed inside a warehouse app, and
// it is why the feature was effectively off everywhere.
//
// The key NEVER travels back to the browser. getAiStatus returns whether one
// exists and its last four characters, which is enough for a person to
// recognise which key they pasted and useless to anyone else.
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
  // Cheap shape check before spending a network call. Google's keys start
  // AIza and are around 39 characters; a pasted URL or an email address is the
  // usual mistake and this catches it without pretending to validate.
  if (/\s/.test(key)) throw new Error('That has a space in it — paste just the key, nothing around it.');
  if (key.length < 20) throw new Error('That looks too short to be an API key.');

  // Actually USE it once before saving. A key that is wrong, expired, or has
  // the Generative Language API switched off fails identically to no key at
  // all — days later, in front of somebody trying to read an email. Better to
  // find out here, in the one place where the person can still fix it.
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
  if (code !== 200) {
    var why = 'Google rejected that key (HTTP ' + code + ').';
    if (code === 400 || code === 403) {
      why += '\n\nThe usual causes: the key was copied incompletely, or the ' +
             '"Generative Language API" is not enabled on the Google project ' +
             'the key belongs to.';
    }
    throw new Error(why);
  }

  p.setProperty('GEMINI_API_KEY', key);
  // Never the key itself, not even partially, into a sheet anyone can open.
  auditLog_(ss, 'AI_KEY', auth.email, 'GEMINI_API_KEY', 'set', 'verified against Google');
  return { status: 'success', configured: true, hint: '…' + key.slice(-4) };
}

// One call, trying each model until one answers. Returns the HTTPResponse of
// the first success, or of the last attempt so the caller can report something.
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
    // 404 means "that model is gone" — worth trying the next name. Anything
    // else (bad key, quota, malformed request) will fail the same way on every
    // model, so stop and report it.
    if (last.getResponseCode() !== 404) return last;
  }
  return last;
}

// The /exec address the customer actually opens. ScriptApp.getService().getUrl()
// reports a deployment that was never published (Google issue 170799249), so
// the one pasted in during setup wins.
function savedWebAppUrl_() {
  return String(PropertiesService.getScriptProperties().getProperty('WEB_APP_URL') || '').trim();
}

function isGmailScanEnabled() {
  return String(PropertiesService.getScriptProperties().getProperty('GMAIL_SCAN_ENABLED') || '')
           .toLowerCase() === 'true';
}

// Stable secret used to sign session tokens (auto-created once).
function serverSecret_() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('SESSION_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SESSION_SECRET', s); }
  return s;
}

// Must EXACTLY match the "Authorized redirect URI" registered in Google Cloud.
// We read it from a Script Property so it can't drift from what getUrl() guesses
// (the domain /a/macros/ form vs the /macros/s/ form). Falls back to getUrl().
function redirectUri_() {
  return PropertiesService.getScriptProperties().getProperty('OAUTH_REDIRECT_URI')
      || ScriptApp.getService().getUrl();
}

// Signed token = base64(email|expiry).base64(HMAC). Tamper-proof without the secret.
function makeSessionToken_(email) {
  var exp     = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
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

// Decode the verified email out of a Google id_token (obtained directly from
// Google's token endpoint over TLS, so the payload is trustworthy).
function emailFromIdToken_(idToken) {
  var parts = String(idToken || '').split('.');
  if (parts.length < 2) return '';
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    return payload.email || '';
  } catch (e) { return ''; }
}

// Popup callback: exchange the auth code for the user's email, stash it under the
// random state so the main window can pick it up via pollLogin().
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
      '<p style="color:#555">' + msg + '</p><p>Close this window and try again.</p></div>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
// The web app is published as "Anyone with a Google account", so the URL alone
// is enough to reach these endpoints — authentication decides what you get
// back, not whether the script runs. That means anyone with the link can make
// the owner's account burn Apps Script execution quota, and quota is per-owner
// and shared by every real user: exhausting it takes the warehouse offline for
// everybody. That is the failure this guards against, not data theft.
//
// CacheService, not Properties: these counters are throwaway, and Properties
// has a hard quota of its own that a flood would then consume too.
//
// Limits are deliberately generous — several times what heavy normal use
// looks like — because locking out a real warehouse mid-shift is far worse
// than letting an abuser through a little longer.
function throttle_(bucket, id, limit, windowSec) {
  var key = 'rl_' + bucket + '_' + Utilities.base64EncodeWebSafe(String(id || 'anon')).substring(0, 40);
  var cache = CacheService.getScriptCache();
  var raw = cache.get(key);
  var n = raw ? (parseInt(raw, 10) || 0) : 0;
  if (n >= limit) return false;
  // Not atomic — Apps Script has no atomic increment, and two calls landing in
  // the same instant can both read the same n. That undercounts slightly under
  // a burst, which is acceptable: this is a flood ceiling, not a precise meter.
  cache.put(key, String(n + 1), windowSec);
  return true;
}

function requireQuota_(bucket, id, limit, windowSec) {
  if (!throttle_(bucket, id, limit, windowSec)) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }
}

// Main window polls this until the popup callback has stored the verified email.
// Returns a signed session token the browser will send on every later call.
function pollLogin(state) {
  // Keyed by the state value the caller supplied: this runs BEFORE any identity
  // exists, so there is nothing else to key on. A tight limit here also blunts
  // guessing at other people's login states.
  requireQuota_('poll', state, 120, 300);
  var cache = CacheService.getScriptCache();
  var email = cache.get('login_' + state);
  if (!email) return { ready: false };
  cache.remove('login_' + state);
  return { ready: true, sessionToken: makeSessionToken_(email), email: email };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
// Deployment REQUIRED: "Execute as: Me (owner)" + "Who has access: Anyone with a
// Google account". This is essential for the hybrid login:
//   • Company users (same Workspace domain) are auto-detected via getActiveUser().
//   • Non-org users sign in with Google; the OAuth callback + sheet reads run as
//     the owner, so those users never need direct access to the spreadsheet.
//
// Lookup order:
//   1. USERS_V3 sheet  (managed via in-app admin panel)
//   2. CONFIG sheet    (legacy — existing rows still work)
// Unknown emails → DENIED (admin must register the user first).
// REMOVED: getPublicUsers().
// Every global function in an Apps Script web app is a callable RPC endpoint, so
// any signed-in Google account could invoke it straight from the browser console
// and read back the full staff roster (email, name, role) — it performed no auth
// check at all. It was dead code: the identity picker it fed was replaced by the
// login flow below, and nothing in Index_v3_fixed.html referenced it. Deleting
// the function removes the endpoint entirely, which is stronger than gating it.
// A roster is still available to admins through getUsers(), which is gated.

// ─── AUTHORIZATION GATE ──────────────────────────────────────────────────────
// The problem this solves: a privileged function that trusts an `auth` OBJECT
// handed to it by its caller is not actually protected. Because every global
// function is directly callable via google.script.run, anyone with a Google
// account could open the browser console and run
//
//     google.script.run.addUser({email:'x@evil.com', role:'ADMIN'}, {role:'ADMIN'})
//
// forging the second argument and skipping processMovement's real check
// entirely. The `_` name prefix does not help either — it is a convention, not
// an access modifier, so `_`-prefixed functions are equally callable.
//
// The fix: identity must come from something the caller cannot fabricate — the
// HMAC-signed session token (or the Workspace session), verified server-side.
// _verifiedAuth is set ONLY by the two entry points that actually perform that
// verification (processMovement and getInitialData). Apps Script starts every
// execution with a fresh global scope, so a direct call to a privileged
// function begins with _verifiedAuth === null and is refused before it reads or
// writes anything.
var _verifiedAuth = null;

function setVerifiedAuth_(auth) { _verifiedAuth = auth; return auth; }

// Returns the verified identity or throws. minRole:
//   'ADMIN' → ADMIN only
//   'WRITE' → ADMIN or WAREHOUSE (blocks VIEWER)
//   omitted → any registered, signed-in user
function requireAuth_(minRole) {
  var a = _verifiedAuth;
  if (!a || !a.email || a.role === 'NO_SESSION') {
    throw new Error('Not authenticated. Please sign in and use the app from its own page.');
  }
  if (a.role === 'DENIED') {
    throw new Error('Access denied. Your account (' + a.email + ') is not registered in this system.');
  }
  if (minRole === 'ADMIN' && a.role !== 'ADMIN') throw new Error('Admin only.');
  if (minRole === 'WRITE'  && a.role === 'VIEWER') {
    throw new Error('Read-only access — you can view data but cannot record movements.');
  }
  return a;
}

// ─── PER-INSTALLATION PERMISSIONS ────────────────────────────────────────────
// Everything used to be binary: ADMIN can do a thing, WAREHOUSE cannot, full
// stop, decided in the code rather than by the customer. That is correct for
// most of what the app does — but a warehouse of three people run by an owner
// who trusts their lead hand is a real, common shape, and for those customers
// "only the owner can add a supplier" is a wall with no door.
//
// Three roles stay exactly as they are (Jose: "los mismos 3 roles, con
// interruptores nuevos") — this does not add a fourth tier or per-person
// permissions. It adds toggles ADMIN can flip for the WAREHOUSE role only;
// VIEWER stays exactly what it always was, read-only, no exceptions, because
// nothing about "can view" needs a permission to widen.
//
// Each flag's DEFAULT matters as much as what it gates: it must reproduce
// TODAY's behaviour exactly on every installation that never touches this
// screen, so shipping this changes nothing until an admin deliberately opts
// in. canEditMovements/canManageCatalog default to false because WAREHOUSE
// could not do either of those before this existed — false is a no-op.
// canExportData is the opposite case: WAREHOUSE (and VIEWER) could ALREADY
// export, so its default is true — anything else would quietly take away
// something every existing customer already has the moment they update.
// canSeeCosts has no UI to gate yet (there is no cost data in the app yet) —
// it exists now so the pricing feature, when it ships, has a home to read
// from on day one instead of needing this exact same plumbing built twice.
var DEFAULT_ROLE_PERMS = {
  canSeeCosts:      false,
  canEditMovements: false,
  canManageCatalog: false,
  canExportData:    true
};

// The server's own answer to "may this person see money?", and the ONLY one
// that decides what leaves this file. _canSeeCosts() in Index_v3_fixed.html is
// the same rule spelt the same way, but it runs in the browser and therefore
// decides only what gets drawn — which is a different question, and until
// v11.27 it was the only question anybody was asking.
//
// The two must agree, and a test holds them to it (tools/test-cost-privacy.js).
// If they ever drift, the failure is silent in the worse direction: the server
// would send what the page then declines to show, which looks perfect from the
// outside and is exactly the bug this replaces.
//
//   ADMIN      always
//   WAREHOUSE  only when an admin has turned the See costs toggle on
//   VIEWER     never — read-only means read what you are shown, and costs are
//              not part of that. There is no toggle to widen it, by design.
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
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var next = {};
  Object.keys(DEFAULT_ROLE_PERMS).forEach(function (k) { next[k] = !!(data && data[k]); });
  PropertiesService.getScriptProperties().setProperty('ROLE_PERMS_WAREHOUSE', JSON.stringify(next));
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'UPDATE_ROLE_PERMS', auth.email,
    'Permissions changed for the WAREHOUSE role', '', JSON.stringify(next));
  return { status: 'success', perms: next };
}

// The WAREHOUSE role's internal value (USERS_V3, every role check) never
// changes — only what a customer sees on screen for it. A store or restaurant
// often already calls this person "Supervisor" or "Manager"; forcing "WAREHOUSE"
// on them is the kind of mismatch that makes customers distrust the whole app.
function warehouseRoleLabel_() {
  var v = String(PropertiesService.getScriptProperties().getProperty('WAREHOUSE_ROLE_LABEL') || '').trim();
  return v || 'Warehouse';
}

function setWarehouseRoleLabel(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var label = String((data && data.label) || '').trim().slice(0, 30);
  var p = PropertiesService.getScriptProperties();
  if (label) p.setProperty('WAREHOUSE_ROLE_LABEL', label);
  else p.deleteProperty('WAREHOUSE_ROLE_LABEL');
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), 'UPDATE_ROLE_LABEL', auth.email,
    'Display name for the WAREHOUSE role changed', '', label || '(default) Warehouse');
  return { status: 'success', label: warehouseRoleLabel_() };
}

// The check every gated action actually calls. ADMIN passes everything,
// unconditionally — permissions only ever widen WAREHOUSE, never narrow an
// admin. VIEWER never passes, regardless of what is turned on; the flags exist
// to let a trusted WAREHOUSE user do more, not to let a read-only visitor do
// anything at all.
function requirePerm_(auth, permKey) {
  if (auth.role === 'ADMIN') return auth;
  if (auth.role === 'WAREHOUSE' && rolePerms_()[permKey] === true) return auth;
  throw new Error('This requires a permission your admin has not turned on for your role. ' +
    'Ask them to check Settings → Permissions.');
}

// Gate for entry points that legitimately have no session token: the daily
// time-based trigger and the developer diagnostics run from the Apps Script
// editor. Both of those execute AS THE OWNER, so getEffectiveUser() and
// getActiveUser() are the same account. Under the web app's "Execute as: Me"
// deployment they never match for anyone else — getEffectiveUser() is always
// the owner while getActiveUser() is the caller (or '' for external accounts) —
// so this refuses every google.script.run call from another user.
function requireOwnerContext_() {
  var eff = '', act = '';
  try { eff = Session.getEffectiveUser().getEmail(); } catch (e) {}
  try { act = Session.getActiveUser().getEmail();    } catch (e) {}
  if (!eff || eff !== act) {
    throw new Error('This function can only be run by the project owner (scheduled trigger or Apps Script editor).');
  }
  return eff;
}

function getUserRole(sessionToken) {
  var email = '';
  // 1. Company users (same Workspace domain) → identified automatically.
  //    NOTE: do NOT fall back to getEffectiveUser() — under "Execute as: Me" that
  //    always returns the OWNER, so it would mis-identify every external user as
  //    the owner. getActiveUser() correctly returns '' for non-domain accounts.
  try { email = Session.getActiveUser().getEmail(); } catch(e) { email = ''; }
  // 2. Non-org users → email comes from a VERIFIED, signed session token (issued
  //    after Google sign-in). A raw client-provided email is NOT trusted anymore.
  if (!email && sessionToken) email = verifySessionToken_(sessionToken);
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
  // Returns the whole CONFIG sheet — including the legacy user list (emails +
  // roles) and the admin email — so it must never answer an unauthenticated
  // caller. Trigger and editor entry points establish a system identity via
  // setVerifiedAuth_ before reaching here.
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
    // Keyed by matId (category+name), not by name alone like Min Stock above —
    // deliberately more precise: two categories can legitimately share a
    // material name at different price points, and cost is exactly the field
    // where conflating them would produce a wrong number nobody would notice.
    if (row[14] && row[15] && row[16] !== '' && row[16] !== null) {
      var costCat = String(row[14]).trim(), costName = String(row[15]).trim();
      c.avgCost[getMaterialId(costCat, costName)] = { category: costCat, name: costName, avg: Number(row[16]) || 0 };
    }
  }
  
  if (!c.archiveCutoffMonths) c.archiveCutoffMonths = 12;
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

// Display/storage form for NAME and CATEGORY: uppercased, trimmed, single-spaced —
// but KEEPS punctuation like commas, hyphens and slashes (e.g. "A-680, 80 SERIES"
// or "FLASHING/CAULK" are stored exactly as typed).
// normalizeString() is still used SEPARATELY to build the matching key (getMaterialId),
// so "A-680" and "A 680" still merge into one material for stock totals.
function cleanDisplay_(str) {
  return String(str || '').toUpperCase().trim().replace(/\s+/g, ' ');
}

// Neutralize formula injection before ANY user-supplied text reaches a cell.
// Sheets evaluates a cell whose text starts with = or + as a live formula, so a
// value like "=IMPORTXML(...)" typed into a comment or material name would run
// inside the customer's spreadsheet and can exfiltrate data or poison totals.
// - and @ are included because the same strings get exported to CSV and Excel
// evaluates all four. This matters most on the Gmail-scan path, where the text
// originates in inbound mail from outside the company and is then written into
// the very same fields.
//
// A leading apostrophe is Sheets' "treat as literal text" marker: it is a cell
// format flag, NOT part of the stored value, so getValues() still returns the
// original string and existing comparisons — including addMovementsBatch_'s
// write-verify read — behave exactly as before.
function sheetSafe_(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date || typeof val === 'number' || typeof val === 'boolean') return val;
  var s = String(val);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

// Convert a spreadsheet cell value to a plain string.
// Sheets sometimes auto-converts PO# fields like "01-04-25" to a Date object.
// This function returns empty string for Date values (better than a timestamp dump).
function safeStr_(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) return '';  // don't show garbled dates where text is expected
  return String(val).trim();
}

// Money, rounded to the cent. Plain floating-point division (unit_cost * qty,
// the weighted-average blend) drifts past two decimals almost immediately —
// this is the one place that matters, since every cost figure downstream
// (inventory value, cost per project) is a sum of numbers that came from here.
function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function getMaterialId(cat, name) {
  return normalizeString(cat) + '|||' + normalizeString(name);
}

function getLegacyMaterialId(cat, name, proj) {
  return normalizeString(cat) + '|||' + normalizeString(name) + '|||' + normalizeString(proj);
}

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
function getInitialData(sessionToken) {
  try {
    var auth = setVerifiedAuth_(getUserRole(sessionToken));

    // Applied only to identified callers: an anonymous visitor gets the small
    // public sign-in payload below, and throttling by a key everyone shares
    // ('anon') would let one abuser lock the sign-in screen for all of them.
    if (auth.email) requireQuota_('init', auth.email, 180, 300);

    // Not authenticated — return public user list so frontend can show identity picker
    if (auth.role === 'NO_SESSION') {
      var oc = oauthCfg_();
      return { accessStatus: 'NO_SESSION', userEmail: '', userRole: 'NO_SESSION',
               serverVersion: APP_VERSION, company: publicCompany_(),
               oauthClientId: oc.clientId, oauthRedirectUri: redirectUri_() };
    }
    // Authenticated but not registered in CONFIG
    if (auth.role === 'DENIED') {
      return { accessStatus: 'DENIED', userEmail: auth.email, userRole: 'DENIED',
               serverVersion: APP_VERSION, company: publicCompany_() };
    }

    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var archive  = ss.getSheetByName(SHEETS.ARCHIVE);
    var resSheet = ss.getSheetByName(SHEETS.RESERVATIONS);
    var config   = loadConfig();
    // The CONFIG sheet also holds the legacy user list and the admin email. The
    // frontend never reads either one, so strip them instead of shipping the
    // whole staff roster to every browser that logs in. (Admins still get the
    // real roster through getUsers(), which is role-gated.)
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

    // Fast path: read pre-aggregated LIVE_STOCK/SITE_STOCK/WASTED_STOCK instead of
    // re-scanning every movement in JS on every login. Falls back to the full scan
    // if the derived sheets haven't been populated yet (e.g. brand-new spreadsheet).
    var stock = buildStockFromDerivedSheets_(ss);
    if (stock) {
      applyReservationsAndFinalize_(stock, reservations);
    } else {
      stock = calculateStock(movements, reservations);
    }

    // Register this user's presence and return active users list
    var activeUsers = [];
    try { activeUsers = heartbeat(sessionToken); } catch(e) {}

    // Incoming materials + monitored-materials filter
    var incoming = [];
    try { incoming = getIncoming(sessionToken); } catch(e) { Logger.log('getIncoming: ' + e.message); }
    var monitoredMaterials = null;
    try { monitoredMaterials = getMonitoredMaterials(sessionToken); } catch(e) {}

    // User list — only sent to ADMINs
    var users = [];
    if (auth.role === 'ADMIN') {
      try { users = getUsers(auth); } catch(e) {}
    }

    var rackPhotos = {};
    try { rackPhotos = getRackPhotos(); } catch(e) { Logger.log('getRackPhotos: ' + e.message); }

    var materialLocks = [];
    try { materialLocks = getMaterialLocks(); } catch(e) { Logger.log('getMaterialLocks: ' + e.message); }

    // ── WHAT A ROLE MAY NOT SEE IS NOT SENT ─────────────────────────────────
    // Finding 2 of the v11.26 audit. Costs were computed for everyone and put
    // on the wire for everyone: parseArchiveRow always fills unitCost and
    // totalCost, and config.avgCost carries the running average for every
    // material. _canSeeCosts() then hid them — IN THE BROWSER. Which is to
    // say it hid them from the screen, not from the person: the numbers had
    // already arrived, and one console line printed the lot.
    //
    // A permission enforced only by the page drawing it is not a permission.
    // It is a preference. And this one is sold: the published feature page
    // promises that a warehouse role does not see what things cost unless an
    // admin turns it on. So this is not only a leak, it is a leak of the
    // thing the customer was told they were buying.
    //
    // Stripped here, at the one place everything leaves the server, rather
    // than at each of the five screens that draw a dollar sign — the same
    // reason the user list two blocks up is built only for ADMIN. Every
    // consumer in the front end is already behind _canSeeCosts(), so a role
    // that could not see these numbers sees exactly what it saw before; the
    // difference is that now it was never handed them.
    if (!canSeeCosts_(auth)) {
      for (var ci = 0; ci < movements.length; ci++) {
        movements[ci].unitCost  = null;
        movements[ci].totalCost = null;
      }
      if (config) config.avgCost = {};
    }

    // Found while doing the above, in the same shape and worse: loadConfig()
    // returns the CONFIG sheet whole, and that includes `users` — every
    // colleague's email address with their role beside it — and `adminEmail`.
    // Both were sent to every role on every load, VIEWER included. Not hidden
    // by a check that could be argued about: NOTHING in Index_v3_fixed.html
    // reads either one. The real user list arrives separately, two blocks up,
    // and only for ADMIN, which is where the app has actually read it from
    // since USERS_V3 replaced the CONFIG column.
    //
    // So this is a roster of who works here, mailed out to everyone who opens
    // the page, in service of no feature at all. It is left in place for an
    // ADMIN, who is the one role that already receives the same list by name.
    if (config && auth.role !== 'ADMIN') {
      config.users = [];
      delete config.adminEmail;
    }

    return {
      serverVersion:      APP_VERSION,
      serverBuild:        APP_BUILD,
      // Sent with the first load so the ENTRY form can offer a material's packs
      // the moment its name is filled in, without a round trip per line.
      materialPacks:      (function(){ try { return readPacks_(ss); } catch (e) { return {}; } })(),
      company:            publicCompany_(),
      // ONE UNDERSCORE. THAT IS THE WHOLE BUG, AND IT COST MONTHS.
      //
      // This read `_auth.email`. The variable in this scope is `auth`. There
      // IS a `_auth` in this function — but it is declared at the bottom, in
      // the error handler (`var _auth = getUserRole(sessionToken)`), and `var`
      // hoists to the top of the function. So `_auth` existed here and held
      // `undefined`, `_auth.email` threw a TypeError every single time, and
      // the inline catch below turned that into an empty array.
      //
      // systemActivity was therefore [] on EVERY load, for EVERY user, since
      // the day this line was written. Both things that read it went dark
      // together, which is exactly what Jose reported and why he was right
      // that they were one problem and not two:
      //
      //   • the corner deck never showed a card — _sysCards is built from it
      //   • Settings → System said nothing automatic had ever run — the same
      //     list feeds _renderSystemTab
      //
      // The backups were never broken. They ran nightly, wrote their row to
      // AUDIT_LOG with actor 'system', and 27 of them are sitting in Drive.
      // The rows simply never left the server.
      //
      // Nothing could have caught this from the outside. It is not a syntax
      // error, `node --check` is happy, and tools/test-sysactivity-dismiss.js
      // passes — because it calls getSystemActivity_ directly in a vm with its
      // own arguments. The function was always correct. The CALL was wrong.
      // Same lesson as the role label in v11.29: testing a function is not
      // testing the line that uses it.
      systemActivity:     (function(){
        try { return getSystemActivity_(30, auth.email); }
        catch (e) {
          // NOT silent any more. The empty array stays — a failure to read the
          // audit sheet must not take down the whole app load — but a failure
          // that leaves no trace is how this one lasted. If this line is ever
          // reached again, the reason is in the execution log.
          Logger.log('getInitialData: systemActivity failed — ' + e.message);
          return [];
        }
      })(),
      columnPrefs:        columnPrefs_(),
      movements:          movements,
      stock:              stock,
      config:             config,
      reservations:       reservations,
      userRole:           auth.role,
      rolePerms:          rolePerms_(),
      warehouseRoleLabel: warehouseRoleLabel_(),
      userName:           auth.name || '',
      userEmail:          auth.email,
      activeUsers:        activeUsers,
      incoming:           incoming,
      monitoredMaterials: monitoredMaterials,
      users:              users,
      rackPhotos:         rackPhotos,
      materialLocks:      materialLocks,
      gmailScanEnabled:   false   // the scanner has no UI; see isGmailScanEnabled()
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
    mt = rawMT; // ENTRY, EXIT, TRANSFER, RETURN, WASTE, ADJUST — already correct
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
    userEmail:   String(row[AC.USER_EMAIL] || ''),
    pm:          String(row[AC.PM]         || ''),
    unitCost:    (row[AC.UNIT_COST]  === '' || row[AC.UNIT_COST]  === null || row[AC.UNIT_COST]  === undefined) ? null : Number(row[AC.UNIT_COST]),
    totalCost:   (row[AC.TOTAL_COST] === '' || row[AC.TOTAL_COST] === null || row[AC.TOTAL_COST] === undefined) ? null : Number(row[AC.TOTAL_COST])
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

    } else if (mt === 'ADJUST') {
      // A correction to the count at ONE rack. Direction is which column the
      // rack sits in — see adjustDirection_. Nothing moves to a site and
      // nothing is wasted, so siteQty and wastedQty are untouched on purpose:
      // an adjust that fed either of them would put "we counted wrong" into
      // the waste figure, which is the exact confusion this type exists to
      // prevent.
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

  applyReservationsAndFinalize_(stock, reservations);
  return stock;
}

// Shared by calculateStock() (full-scan path) and buildStockFromDerivedSheets_()
// (fast path, reads LIVE_STOCK/SITE_STOCK/WASTED_STOCK instead of re-scanning
// every movement ever made) — both produce the same stock shape up to this point,
// so reservations + clamping + availableQty only need to be written once.
function applyReservationsAndFinalize_(stock, reservations) {
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
    item.wastedQty     = Math.max(0, item.wastedQty || 0);
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

// Fast path for getInitialData(): builds the same stock shape as calculateStock()
// but from the small pre-aggregated LIVE_STOCK/SITE_STOCK/WASTED_STOCK sheets
// (already kept current by refreshDerivedSheets_ on every save) instead of
// re-scanning every movement ever recorded on every single login.
// Returns null if the derived sheets don't exist yet or are empty — the caller
// falls back to the full calculateStock() scan in that case (e.g. very first run,
// before any save has ever populated the derived sheets).
function buildStockFromDerivedSheets_(ss) {
  var live  = ss.getSheetByName(SHEETS.LIVE);
  var site  = ss.getSheetByName(SHEETS.SITE);
  var waste = ss.getSheetByName(SHEETS.WASTE);
  if (!live || live.getLastRow() < 2) return null; // never refreshed yet — signal fallback

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
    if (proj && proj !== 'GENERIC') s.project = proj; // last row wins, same as calculateStock()
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

// ─── PROCESS MOVEMENT ────────────────────────────────────────────────────────
function processMovement(action, data) {
  // The ONLY place (besides getInitialData) where an identity becomes trusted:
  // the token is verified here, then published to requireAuth_ via
  // setVerifiedAuth_ so the action handlers below can assert against it.
  var auth = setVerifiedAuth_(getUserRole(data && data._sessionToken));
  if (auth.role === 'NO_SESSION') throw new Error('Not authenticated. Please sign in with your Google account.');
  if (auth.role === 'DENIED')     throw new Error('Access denied. Your account (' + auth.email + ') is not registered in this system. Contact your administrator to request access.');
  if (auth.role === 'VIEWER')     throw new Error('Read-only access — you can view data but cannot record movements. Contact an admin.');

  // 240/minute per user. A busy operator saving movements, editing config and
  // running searches lands nowhere near this; a runaway loop or a script does.
  requireQuota_('pm', auth.email, 240, 60);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    return processMovementInner_(ss, action, data, auth);
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
    // Multi-location ENTRY: one archive row per destination location.
    // Built as a batch so the whole submission is one atomic read/write.
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
          // Shared docs + notify go only on the first location row.
          files:            entryRows.length === 0 ? (data.files     || []) : [],
          docGroups:        entryRows.length === 0 ? (data.docGroups || []) : [],
          notifyRecipients: entryRows.length === 0 ? data.notifyRecipients : null,
          // Only dup-check the first row; later rows are intentionally similar.
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
        message:    'ENTRY recorded' + (entryRes.rowCount > 1 ? ' (' + entryRes.rowCount + ' locations).' : '.')
      };
    }

    // Multi-source EXIT: one archive row per source location (atomic batch).
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
          destLoc:          data.destLoc  || '',   // destination project/site
          supplier:         data.supplier,
          comments:         data.comments,
          responsible:      data.responsible,
          files:            exitRows.length === 0 ? (data.files || []) : [],
          notifyRecipients: null,                  // no email for EXIT
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
        message:    'EXIT recorded' + (exitRes.rowCount > 1 ? ' (' + exitRes.rowCount + ' locations).' : '.')
      };
    }

    // Multi-pair TRANSFER: one archive row per (source→destination) pair, each with
    // its own quantity (partial transfers allowed) — atomic batch.
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
        message:    'TRANSFER recorded' + (transferRes.rowCount > 1 ? ' (' + transferRes.rowCount + ' pairs).' : '.')
      };
    }

    // WASTE / RETURN (and anything else without its own multi-row array) — wrap
    // as a single-row batch so it goes through the SAME atomic, lock-enforced,
    // validated engine as ENTRY/EXIT/TRANSFER instead of the old separate
    // _addMovement() implementation. Two parallel paths for "save a movement"
    // is exactly what let the rack-name-with-slash bug slip past WASTE/RETURN
    // after it had already been fixed everywhere else — one engine, one fix site.
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
      refreshError:   singleRes.refreshError
    };
  }
  if (action === 'addMultiEntry')         return addMultiEntry(ss, archive, data, auth);
  if (action === 'addMultiExit')          return addMultiExit(ss, archive, data, auth);
  if (action === 'updateDocument')        return updateDocument_(ss, archive, data, auth);
  if (action === 'addReservation')        return addReservation_(ss, data, auth);
  if (action === 'cancelReservation')     return cancelReservation_(ss, data, auth);
  if (action === 'addIncoming')           return addIncoming(data);
  if (action === 'updateIncoming')        return updateIncoming(data);
  if (action === 'deleteIncoming')        return deleteIncoming(data.id, data._sessionToken);
  // 'scanGmail' is deliberately NOT dispatched. The scanner needs Google's
  // restricted mail scope, which is not in the manifest, so the call could only
  // ever fail — and an action that cannot succeed should not be reachable.
  // scanGmailForDeliveries() is kept for the day it ships as a real add-on.
  if (action === 'modifyMovement')        return modifyMovement(data, auth);
  if (action === 'setMonitoredMaterials') return setMonitoredMaterials(data.names, auth);
  if (action === 'getPmDirectory')        return getPmDirectory();
  if (action === 'managePmDirectory')     return managePmDirectory(data, auth);
  if (action === 'uploadRackPhoto')       return uploadRackPhoto(data, auth);
  if (action === 'lockMaterial')          return lockMaterial(data, auth);
  if (action === 'unlockMaterial')        return unlockMaterial(data, auth);
  if (action === 'updateMinStockBulk')    return updateMinStockBulk(data, auth);
  if (action === 'parseImportFile')       return parseImportFile(data);
  if (action === 'commitImport')          return commitImport(data, auth);
  // ── User management (ADMIN only) ─────────────────────────────────────────
  if (action === 'getUsers')       return getUsers(auth);
  if (action === 'addUser')        return addUser(data, auth);
  if (action === 'updateUser')     return updateUser(data, auth);
  if (action === 'removeUser')     return removeUser(data.email, auth);
  // ── Settings / Config management (ADMIN only) ─────────────────────────────
  if (action === 'getSettings')    return getSettings(auth);
  if (action === 'updateConfig')   return updateConfig(data, auth);
  if (action === 'mergeConfigValues') return mergeConfigValues(data, auth);
  if (action === 'saveLocationLayout') return saveLocationLayout(data, auth);
  if (action === 'mergeLocations')     return mergeLocations(data, auth);
  if (action === 'saveColumnPrefs')    return saveColumnPrefs(data, auth);
  if (action === 'saveCompanyProfile') return saveCompanyProfile(data, auth);
  if (action === 'parseIncomingEmail') return parseIncomingEmail(data, auth);
  // ── Material management (ADMIN only) ──────────────────────────────────────
  if (action === 'listMaterials')  return listMaterials(auth);
  if (action === 'manageMaterial') return manageMaterial(data, auth);
  // ── Data quality sweep (ADMIN only) ───────────────────────────────────────
  if (action === 'runDataQualityScan')  return runDataQualityScan(data);
  if (action === 'applyDataQualityFix') return applyDataQualityFix(data);
  if (action === 'adminAction') {
    requireAuth_('ADMIN');
    return adminAction_(ss, data);
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
  if (action === 'loadOlderHistory') return loadOlderHistory(auth);
  if (action === 'getSpaceUsage')   return getSpaceUsage(auth);
  if (action === 'getAiStatus')     return getAiStatus(auth);
  if (action === 'setAiKey')        return setAiKey(data, auth);
  // El reporte diario. Estas tres llegaban por google.script.run directo, sin
  // pasar por aquí — y processMovement es donde el token de sesión se convierte
  // en _verifiedAuth. Sin eso, requireAuth_ contestaba "Not authenticated.
  // Please sign in and use the app from its own page." en rojo, dentro de un
  // panel al que sólo se llega estando autenticado. Jose lo fotografió.
  if (action === 'getDailyReportSettings')  return getDailyReportSettings(auth);
  if (action === 'saveDailyReportSettings') return saveDailyReportSettings(data, auth);
  if (action === 'sendDailyReportNow')      return sendDailyReportNow(auth);
  if (action === 'getMaterialPacks')   return getMaterialPacks(auth);
  if (action === 'saveMaterialPack')   return saveMaterialPack(data, auth);
  if (action === 'deleteMaterialPack') return deleteMaterialPack(data, auth);
  throw new Error('Unknown action: ' + action);
}

// ─── BATCH MOVEMENT ENGINE ────────────────────────────────────────────────────
// Validates and writes N movements as ONE atomic operation:
//   1 lock · 1 archive read · 1 in-memory stock snapshot · 1 setValues write ·
//   1 write-verify read · 1 derived-sheet refresh.
//
// Replaces the old per-row loop that re-read the ENTIRE archive AND rebuilt the
// derived sheets for every sub-movement (a 5-material × 3-rack entry did 15 full
// reads + 15 refreshes — tens of seconds). Now it does each exactly once.
//
// Validation is ALL-OR-NOTHING: every row is validated against a live, mutating
// snapshot before anything is written. If any row fails, NOTHING is saved — so a
// 15-row entry can never leave 8 rows half-committed.
//
// `movements` = array of normalized movement objects (same shape _addMovement
// accepts). Each row may carry its own docGroups/files/notifyRecipients/forceSubmit.
// ─── THE STOCK LOCK ──────────────────────────────────────────────────────────
// One door, one person at a time.
//
// Stock is not a stored number — it is replayed from the movement archive. So
// anything that reads the archive, works out a new value and writes it back is
// a read-modify-write, and two of those overlapping silently lose one of the
// two changes: both executions read "100", both write "90", and 20 units left
// the building while the system says 10 did. Nobody sees an error. That is the
// whole danger — not the collision, the silence.
//
// Deliberately NOT re-entrant, because it does not need to be. Every risky
// path calls refreshDerivedSheets_ from INSIDE itself, so locking the outer
// call covers the inner one for free. Re-entrancy machinery guarding a case
// that does not arise would be more moving parts, not fewer.
//
// Two rules for using it: never call it from something that already holds the
// lock, and never wrap a block that calls archiveOldMovements — that takes
// this same lock and would find it held.
//
// Apps Script releases a script lock when the execution ends, so even a bug
// that skipped releaseLock could only hold others up until this request
// finishes, never permanently.
function withStockLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    throw new Error('System busy — someone else is saving right now. Please try again in a moment.');
  }
  try { return fn(); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function addMovementsBatch_(ss, archive, movements, auth) {
  var EMPTY = { status: 'success', firstRowIdx: null, rowCount: 0, fileError: null, emailError: null, availableByMat: {} };
  if (!movements || !movements.length) return EMPTY;

  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); }
  catch (e) { throw new Error('System busy — another save is in progress. Please retry in a moment.'); }

  try {
    // ── ONE read of the whole archive ────────────────────────────────────────
    var archiveValues = archive.getDataRange().getValues();

    // ── ONE read of reservations → reserved qty per matId ────────────────────
    var reservedByMat = {};
    var resSheet = ss.getSheetByName(SHEETS.RESERVATIONS);
    if (resSheet) {
      var rData = resSheet.getDataRange().getValues();
      for (var r = 1; r < rData.length; r++) {
        if (String(rData[r][7] || '').toUpperCase() !== 'ACTIVE') continue;
        var rKey = getMaterialId(normalizeString(rData[r][1] || ''), normalizeString(rData[r][2] || ''));
        reservedByMat[rKey] = (reservedByMat[rKey] || 0) + Number(rData[r][4] || 0);
      }
    }

    // ── In-memory stock snapshot for ALL materials (mutated as we validate) ───
    var snapshot = buildStockSnapshot_(archiveValues);

    // ── ONE read of active material locks (authoritative — checked per row below) ──
    var locksMap = getActiveLocksMap_(ss);

    var now     = new Date();
    var tzDate  = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var newRows = [];   // arrays for setValues
    var rowMeta = [];   // parallel metadata for post-write steps

    // ── Cost bookkeeping (weighted-average) for this batch ────────────────────
    // Loaded once, mutated in memory as ENTRY rows are processed below, and
    // written back to CONFIG only after the archive write is VERIFIED further
    // down — never before, so a cost blend can never be recorded for a
    // movement that did not actually save.
    var avgCostMap  = loadConfig().avgCost || {};
    var costTouched = {};   // matId -> true, for the ones this batch actually changes

    // ── Validate every movement against the live snapshot, build its row ─────
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

      var proj = d.isGeneric ? 'GENERIC' : normalizeString(d.project || '');
      if (!proj && mt === 'ENTRY') proj = 'GENERIC';

      // A TRANSFER moves material from one rack to another INSIDE the same
      // warehouse. Nothing about that changes which job it belongs to, so a
      // transfer keeps the project the material already had.
      //
      // It used to be stamped 'GENERIC', and Jose found the result in his own
      // history: BS10 received for "PAT BS 10", then transferred C2A → A5A,
      // and the two rows stopped looking like the same material's story.
      //
      // The form never asked — the project field is HIDDEN for TRANSFER — so
      // 'GENERIC' was not something anybody typed. It was the app inventing an
      // assertion about work it had never been told, which is the one thing a
      // movement log must not do.
      //
      // Only TRANSFER changes here. EXIT, RETURN and WASTE keep exactly the
      // behaviour they had: they are movements OUT of, or back into, stock,
      // where "which project" is a different question with a different answer,
      // and quietly changing them was not what was asked for. Noted in
      // docs/BACKLOG.md instead.
      if (mt === 'TRANSFER' && (!proj || proj === 'GENERIC')) {
        var carried = snapshot[matId];
        proj = (carried && carried.project && carried.project !== 'GENERIC') ? carried.project : '';
      }

      // An ADJUST carries NO project, and does not inherit one either.
      //
      // It is not a statement about work — it is a statement about the record:
      // the count in the rack disagreed with the count in the app. Which job
      // the two missing units would have belonged to is precisely what nobody
      // knows, which is why the number was wrong in the first place.
      //
      // Stamping a job on it would push a correction into that job's Total
      // Received / Total Dispatched, where it reads as material that moved for
      // that customer. Blank is not a gap here; it is the honest answer.
      if (mt === 'ADJUST') proj = '';

      // Locations: uppercase+trim for storage (special chars preserved), but use
      // normalizeString as the in-memory key so lookups match the snapshot.
      var src     = String(d.sourceLoc || '').toUpperCase().trim();
      var dest    = String(d.destLoc   || '').toUpperCase().trim();
      var srcKey  = normalizeString(src);
      var destKey = normalizeString(dest);

      // Duplicate guard — only when not forced. Scans recent rows of the
      // archive snapshot we already read (no extra read).
      if (!d.forceSubmit) {
        var dup = checkDuplicateInValues_(archiveValues, mt, cat, name, qty, auth.email);
        if (dup) throw new Error('DUPLICATE_MOVEMENT|' + dup.rowIdx + '|' + dup.minutesAgo);
      }

      var snap     = snapshot[matId] || (snapshot[matId] = { wh: 0, site: 0, locs: {} });
      var reserved = reservedByMat[matId] || 0;

      // Material lock check — authoritative, cannot be bypassed from the frontend.
      enforceMaterialLock_(locksMap, mt, matId, srcKey, destKey);

      // ── ADJUST: a COUNT, not a move between two places ────────────────────
      // Exactly one rack column is filled, and which one it is IS the
      // direction — see adjustDirection_ for why the direction is stored that
      // way instead of as a negative quantity.
      var adjDir = 0;
      if (mt === 'ADJUST') {
        adjDir = adjustDirection_(srcKey, destKey);
        if (!adjDir) throw new Error('An adjustment needs exactly one rack — the one you counted.');
        if (!String(d.comments || '').trim()) {
          throw new Error('ADJUST movements require a reason — say why the count was off.');
        }
        // Only downward adjustments can fail this way, and the failure is
        // worth its own message: "insufficient stock" would be nonsense for a
        // correction whose entire premise is that the stock figure is wrong.
        // What it really means is that the figure MOVED between the count and
        // the save — somebody exited the material while it was being counted —
        // so the difference on screen is stale and the count has to be redone.
        if (adjDir < 0) {
          var adjHave = snap.locs[srcKey] || 0;
          if (adjHave < qty) {
            throw new Error('COUNT CHANGED for ' + name + ' at ' + src + '. The app now shows ' +
              adjHave + ' there, so it cannot come down by ' + qty + '. Somebody moved this ' +
              'material while you were counting — open the rack and count it again.');
          }
        }
      }

      // Stock validation for outgoing moves against the LIVE (mutated) snapshot,
      // so two EXITs from the same rack in one batch are checked cumulatively.
      if (mt === 'EXIT' || mt === 'TRANSFER' || mt === 'WASTE') {
        var avail    = Math.max(0, snap.wh - reserved);
        var locAvail = srcKey ? (snap.locs[srcKey] || 0) : avail;
        if (avail < qty) {
          throw new Error('INSUFFICIENT STOCK for ' + name + '. Available: ' + avail +
            ' (Warehouse: ' + snap.wh + ', Reserved: ' + reserved + '). Cannot remove ' + qty + '.');
        }
        if (srcKey && locAvail < qty) {
          throw new Error('INSUFFICIENT at ' + src + ' for ' + name + '. Available there: ' +
            locAvail + '. Total available: ' + avail);
        }
      }
      if (mt === 'WASTE' && !String(d.comments || '').trim()) {
        throw new Error('WASTE movements require a reason in comments.');
      }

      // Captured before the snapshot mutates below — the weighted-average
      // formula blends the incoming quantity into what was ALREADY on hand,
      // not into what will be on hand once this row is applied.
      var whBeforeThisRow = snap.wh;

      // Mutate snapshot so subsequent rows in this batch see the effect.
      applyMovementToSnapshot_(snap, mt, qty, srcKey, destKey);

      var statusVal = statusForMoveType_(mt);

      // ── Cost: optional on ENTRY, always server-computed otherwise ──────────
      // ENTRY: a cost typed by the user blends into the material's running
      // average — bootstrapping it if this is the first cost that material has
      // ever had. Leaving it blank changes nothing: cost is opt-in on purpose,
      // so adopting the app never requires pricing 400 materials on day one.
      // Everything else NEVER trusts a client-supplied cost — it reads
      // whatever average is on record right now and stamps that, blank if the
      // material has never been priced. A WASTE of an unpriced item has no
      // honest dollar figure to give it, so it gets none, not a zero that
      // would misread as "this cost nothing."
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
        // Deliberately nothing. An adjustment costs zero — not "zero dollars
        // of material", but no dollar figure at all, which is why both columns
        // stay blank rather than being written as 0.
        //
        // Two units that were never really there did not cost anything when
        // they vanished; they cost something when they were bought, and that
        // is already recorded on the ENTRY. Pricing an adjust would double it,
        // and pricing a downward one would report a loss the company never
        // took. It also must not disturb the running average: the average is
        // about what material COSTS, and this row says nothing about that.
      } else if (avgCostMap[matId]) {
        unitCost  = avgCostMap[matId].avg;
        totalCost = round2_(unitCost * qty);
      }

      var row = new Array(AC_WIDTH);
      row[AC.TIMESTAMP]   = now;
      row[AC.CATEGORY]    = sheetSafe_(cleanDisplay_(d.category));  // stored as typed (keeps , - /)
      row[AC.NAME]        = sheetSafe_(cleanDisplay_(d.name));      // matId above still uses normalized form
      row[AC.GC]          = sheetSafe_(String(d.gc || '').trim());
      row[AC.PO]          = sheetSafe_(String(d.po || '').trim());
      row[AC.QTY]         = qty;
      row[AC.UNIT]        = sheetSafe_(String(d.unit || 'UNIT').toUpperCase());
      row[AC.DATE_REC]    = d.dateRec || tzDate;
      row[AC.SRC_LOC]     = sheetSafe_(src);
      row[AC.SUPPLIER]    = sheetSafe_(String(d.supplier || '').trim());
      row[AC.COMMENTS]    = sheetSafe_(String(d.comments || '').trim());
      row[AC.STATUS]      = statusVal;
      // "Received By" — who physically took delivery. Left blank when unknown,
      // NEVER defaulted to the signed-in user: that silently asserted the person
      // typing the record received the goods, which is false whenever someone
      // enters a delivery on another person's behalf, and it is unfalsifiable
      // after the fact. Who entered it is already captured, separately and
      // truthfully, in USER_EMAIL below.
      row[AC.RESPONSIBLE] = sheetSafe_(String(d.responsible || '').trim());
      row[AC.PROJECT]     = sheetSafe_(proj);
      row[AC.MAT_ID]      = sheetSafe_(matId);
      row[AC.DOC_LINKS]   = '';
      row[AC.USER_EMAIL]  = auth.email;
      row[AC.DEST_LOC]    = sheetSafe_(dest);
      row[AC.MOVETYPE]    = mt;
      row[AC.PM]          = sheetSafe_(String(d.pm || '').trim());
      row[AC.UNIT_COST]   = (unitCost  === null) ? '' : unitCost;
      row[AC.TOTAL_COST]  = (totalCost === null) ? '' : totalCost;

      newRows.push(row);
      rowMeta.push({
        mt: mt, name: name, matId: matId, proj: proj, qty: qty, unit: row[AC.UNIT],
        src: src, dest: dest,
        rawName: String(d.name || '').trim(),                       // original casing for the email
        rawProj: (d.isGeneric ? '' : String(d.project || '').trim()),
        docGroups: d.docGroups || [], files: d.files || [],
        notify: d.notifyRecipients || null
      });
    }

    if (!newRows.length) return EMPTY;

    // ── ONE write of all rows ────────────────────────────────────────────────
    var startRow = archive.getLastRow() + 1;
    archive.getRange(startRow, 1, newRows.length, AC_WIDTH).setValues(newRows);
    archive.getRange(startRow, AC.TIMESTAMP + 1, newRows.length, 1).setNumberFormat('mm/dd/yyyy hh:mm');

    // ── ONE write-verify read of the whole block ─────────────────────────────
    var verifyVals = archive.getRange(startRow, AC.NAME + 1, newRows.length, 1).getValues();
    for (var v = 0; v < verifyVals.length; v++) {
      if (normalizeString(String(verifyVals[v][0] || '').trim()) !== normalizeString(rowMeta[v].name)) {
        throw new Error('WRITE_VERIFY_FAIL: row ' + (startRow + v) +
          ' could not be confirmed in the archive. Please reload and check before retrying.');
      }
    }

    // ── Persist the cost blend — only now, with the archive write verified ───
    // Best-effort, same philosophy as the derived-sheet refresh below: a
    // failure here must never undo or block a movement that has already,
    // successfully, saved.
    if (Object.keys(costTouched).length) {
      try { saveAvgCostUpdates_(ss, costTouched, avgCostMap); }
      catch (ce) { Logger.log('saveAvgCostUpdates_: ' + ce.message); }
    }

    // ── File / document uploads (per row carrying docs) ──────────────────────
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

    // ── ONE derived-sheet refresh for the whole batch ────────────────────────
    // CRITICAL: if this throws and we only Logger.log it, the movement itself
    // still saves fine (so it looks correct in Movement History) but
    // LIVE_STOCK/SITE_STOCK/WASTED_STOCK silently keep the PRE-save numbers —
    // e.g. an EXIT that fully empties a rack, with the rack drawer still
    // showing the old quantity forever, and nobody finds out until they notice
    // by eye. Must land in the real ERROR_LOG (visible in Settings), not just
    // Apps Script's own execution log that nobody checks day to day.
    var refreshError = null;
    try {
      refreshDerivedSheets_(ss);
    } catch (re) {
      refreshError = 'Stock totals may be out of date — run Settings → System → "Rebuild Stock Totals Now". (' + re.message + ')';
      logError_(ss, 'ERROR', 'backend', 'addMovementsBatch_/refreshDerivedSheets_', auth.email, re.message, { rowCount: newRows.length }, newRequestId_());
    }

    // ── ONE audit-log entry summarizing the batch ───────────────────────────
    var auditDetail = rowMeta.map(function (m) { return m.mt + ' ' + m.name + ' x' + m.qty; }).join('; ');
    auditLog_(ss, 'ADD_MOVEMENT', auth.email, auditDetail, '', '');

    // ── On-demand notification (ONE email covering the whole batch) ──────────
    var emailError = null;
    var notifyCfg = null;
    for (var n = 0; n < rowMeta.length; n++) {
      if (rowMeta[n].notify && rowMeta[n].notify.emails) { notifyCfg = rowMeta[n].notify; break; }
    }
    if (notifyCfg) {
      try { emailError = sendBatchNotifyEmail_(notifyCfg, rowMeta, auth); }
      catch (ne) { emailError = ne.message; Logger.log('Email error: ' + ne.message); }
    }

    // ── WASTE alerts (per row) ───────────────────────────────────────────────
    for (var w = 0; w < rowMeta.length; w++) {
      if (rowMeta[w].mt === 'WASTE') {
        try { checkNotifications_(ss, { name: rowMeta[w].name, comments: '' }, 'WASTE', rowMeta[w].qty, auth.email); } catch (we) {}
      }
    }

    // ── available-after per material from the final snapshot ─────────────────
    var availableByMat = {};
    for (var m2 in snapshot) {
      if (snapshot.hasOwnProperty(m2)) {
        availableByMat[m2] = Math.max(0, snapshot[m2].wh - (reservedByMat[m2] || 0));
      }
    }

    return {
      status:         'success',
      firstRowIdx:    startRow,
      rowCount:       newRows.length,
      fileError:      fileError,
      emailError:     emailError,
      refreshError:   refreshError,
      availableByMat: availableByMat
    };

  } finally {
    lock.releaseLock();
  }
}

// Build a stock snapshot for every material from raw archive values (read once).
// Returns { matId: { wh, site, locs } } with location keys normalized.
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
    var mt;
    if (!rawMT || rawMT === 'IN STOCK') {
      mt = (rawQty < 0 || rawSt === 'DISPATCHED' || rawSt === 'DISPATCH') ? 'EXIT' : 'ENTRY';
    } else if (rawMT === 'DISPATCHED' || rawMT === 'DISPATCH' || rawMT === 'DEL') {
      mt = 'EXIT';
    } else { mt = rawMT; }

    var s = snap[matId] || (snap[matId] = { wh: 0, site: 0, locs: {}, project: '' });
    // The job this material is currently associated with — last real one wins,
    // the same rule calculateStock() uses. GENERIC is not a project; it is the
    // word for "in stock, unassigned", so it never overwrites a real one.
    //
    // Added for TRANSFER, which needs to CARRY the project rather than invent
    // one (see addMovementsBatch_). The snapshot tracked quantities and racks
    // and nothing else, so the first version of that fix would have quietly
    // found undefined here and written a blank — better than a lie, but not
    // the fix, and it would have looked like it worked.
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

// Apply one movement's effect to a single material's snapshot entry in place.
// Mirrors the math in calculateStock / getCurrentStockForItem.
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
    // Direction lives in which rack column is filled — see adjustDirection_.
    // Never touches site stock or wasted: nothing physically went anywhere.
    if (srcKey && !destKey) {
      if (s.locs[srcKey]) s.locs[srcKey] -= qty;
      s.wh = Math.max(0, s.wh - qty);
    } else if (destKey && !srcKey) {
      s.locs[destKey] = (s.locs[destKey] || 0) + qty;
      s.wh += qty;
    }
  }
}

// In-memory duplicate check over the last rows of already-read archive values.
// Same 3-minute window / last-40-rows logic as checkDuplicateMovement_, no read.
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
    if (ageMs > WINDOW_MS) break; // chronological — once outside the window, stop

    // cat/name passed in are already normalized → normalize the stored row too,
    // so punctuation differences ("A-680" vs "A 680") still count as the same.
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

// Send ONE on-demand "material received" email covering the whole batch.
//   • Subject summarizes ALL materials + real projects, and differs for 1 vs many.
//   • Recipients: first = TO, rest = CC (all visible, same thread).
//   • Recipient parsing accepts commas, semicolons, spaces and newlines, so a list
//     typed as "a@x b@y; c@z" still reaches everyone (the old comma-only split was
//     why only the first person got it and nobody appeared in CC).
// Returns an error string if no valid recipient, else null.
function sendBatchNotifyEmail_(notify, rowMeta, auth) {
  // ── Robust recipient parse ───────────────────────────────────────────────
  var valid = [];
  var raw = String(notify.emails || '').split(/[\s,;]+/);
  for (var i = 0; i < raw.length; i++) {
    var addr = raw[i].trim();
    if (addr && addr.indexOf('@') !== -1 && valid.indexOf(addr) === -1) valid.push(addr);
  }
  if (valid.length === 0) return 'No valid email addresses provided.';

  // ── Subject from ALL rows: distinct materials + distinct real projects ───
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

  // ── Body: use the frontend-built message (already lists every material),
  //         else build a fallback summary of all rows. ──────────────────────
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

  // ── Send: first = TO, rest = CC ──────────────────────────────────────────
  var to  = valid[0];
  var cc  = valid.slice(1).join(',');   // '' if only one recipient
  var opts = { name: (companySettings_().name || 'Warehouse') + ' — Warehouse', replyTo: auth.email };
  if (cc) opts.cc = cc;
  MailApp.sendEmail(to, subject, msgBody, opts);
  return null;
}

// ─── ADD MULTI-ENTRY ──────────────────────────────────────────────────────────
// Receives multiple materials in one submission. Each material may have multiple
// destination locations. Saves one archive row per (material × location) pair.
// Shared fields: dateRec, supplier, gc, po, project, responsible, comments, truck.
// docs/notify: shared docs go on first row of first material; per-material docs
//              not yet supported (all get shared docGroups for now).
function addMultiEntry(ss, archive, data, auth) {
  auth = requireAuth_('WRITE');   // ignores any caller-supplied `auth` — see requireAuth_
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
      // Per-material values win when "same info for all" is off (mSameEntryInfoChk
      // unchecked client-side) — mat.xxx is only sent then. Falls back to the
      // shared data.xxx fields otherwise, same override pattern already used for
      // EXIT's per-material destLoc.
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
        // Per-material always, unlike the fields above — cost belongs to the
        // material being purchased, not to the "same info for all" grouping,
        // so it never falls back to a shared data.unitCost.
        unitCost:         mat.unitCost,
        files:            [],
        // Shared docs + notify go only on the very first archive row.
        docGroups:        isFirstRow ? (data.docGroups       || []) : [],
        notifyRecipients: isFirstRow ? data.notifyRecipients : null,
        // Only dup-check the first row of the whole submission.
        forceSubmit:      !isFirstRow || !!data.forceSubmit
      });
    }
  }

  var res = addMovementsBatch_(ss, archive, rows, auth);

  // One email per PM, grouped — never one email per material, never a PM
  // seeing another PM's materials. Independent of the manual "notify" checkbox
  // (notifyRecipients above), which is for ad-hoc recipients typed by hand.
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
    message:    totalMats + ' material(s), ' + res.rowCount + ' row(s) recorded.'
  };
}

// ─── MULTI-MATERIAL EXIT ─────────────────────────────────────────────────────
// data.materials: [{category, name, locations:[{loc, qty}]}]
// data.destLoc, data.dateRec, data.responsible, data.comments, data.status
function addMultiExit(ss, archive, data, auth) {
  auth = requireAuth_('WRITE');   // ignores any caller-supplied `auth` — see requireAuth_
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
        // Only dup-check the first row of the whole submission.
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
    message:  totalMats + ' material(s), ' + res.rowCount + ' row(s) recorded.'
  };
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

    } else if (mt === 'ADJUST') {
      // Same rule as the other three stock readers — see adjustDirection_.
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

function ensureWasteSheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.WASTE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.WASTE);
    sheet.appendRow(['Category','Name','Qty','Unit','Last_Updated']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  return sheet;
}

// ─── PACKS: HOW MANY UNITS COME IN A BOX ────────────────────────────────────
// Phase 1 of docs/UNIDADES-Y-CONVERSIONES.md. The whole feature, in one line:
// the customer almost never knows the cost of ONE unit. They know the invoice —
// $120 a box, $600 a pallet — and the division gets done in someone's head,
// wrong, or not at all.
//
// A pack is one sentence a person teaches the system once: "a box of GE SILPRUF
// holds 12 tubes". Acopio never assumes it (Jose, v11.0: "no podemos dar por
// sentado algo que no depende de nosotros") and never makes them retype it
// either — it is remembered until they change it.
//
// ⚠ WHAT THIS PHASE DELIBERATELY DOES NOT DO: nothing here changes how stock is
// stored, added up or taken out. Quantities stay in the stocking unit exactly as
// they are today. Packs are an entry convenience and a calculator, which is what
// keeps the risk near zero — issuing in a different unit is Phase 2 and is where
// a misapplied factor turns 319 tubes into 3,828.
//
// Its own sheet rather than more CONFIG columns: CONFIG is a catalog of single
// values per column, and this is a LIST per material. Two different shapes.
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

// Quantities carry decimals — a bakery's sack is 110.23 lb, not a round number —
// and the danger there is not the decimals, it is floating point: 0.1 + 0.2 is
// 0.30000000000000004 on every computer ever built, and summed five hundred
// times the stock drifts. Rounding on every write is what stops the error
// accumulating. Four places is grams inside a kilo, which is more precision than
// any warehouse needs.
var PACK_DECIMALS = 4;
function roundQty_(n) {
  var v = Number(n);
  if (!isFinite(v)) return 0;
  return Math.round(v * Math.pow(10, PACK_DECIMALS)) / Math.pow(10, PACK_DECIMALS);
}

// Keyed the same way stock is — category + name — so a pack follows the material
// it belongs to and two materials with the same name in different categories
// keep their own.
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
    // A pack with no size is not a pack. Skipping rather than defaulting to 1:
    // a silent 1 would quietly make "12 boxes" mean 12 units.
    if (!cat || !nm || !pk || !isFinite(per) || per <= 0) continue;
    var k = packKey_(cat, nm);
    if (!out[k]) out[k] = { category: cat, name: nm, packs: [] };
    out[k].packs.push({
      pack: pk,
      perPack: roundQty_(per),
      lastPrice: Number(r[PACK_COLS.LAST_PRICE]) || 0
    });
  }
  // Smallest first, so "Box (12)" is offered before "Pallet (360)" — the order
  // somebody thinks in when they are looking at what arrived.
  Object.keys(out).forEach(function (k) {
    out[k].packs.sort(function (a, b) { return a.perPack - b.perPack; });
  });
  return out;
}

function getMaterialPacks(auth) {
  auth = requireAuth_('READ');
  return readPacks_(SpreadsheetApp.getActiveSpreadsheet());
}

// One pack, saved or replaced. Not batched on purpose: this is typed by a person
// one line at a time, and a whole-sheet rewrite would put a catalog-sized risk
// behind a single field.
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
  // A pack that holds one unit is the unit. Allowing it would put a row in the
  // sheet that changes nothing and an option in the form that means nothing.
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
      sheet.getRange(i + 2, 1, 1, 7).setValues([row]);
      auditLog_(ss, 'PACK_SAVE', auth.email, cat + ' / ' + name, pack, String(per));
      return { status: 'success', updated: true };
    }
  }
  sheet.appendRow(row);
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

  // Backwards: deleting a row shifts everything under it, and going forwards
  // would make every index after the first deletion point at the wrong row.
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

// The arithmetic, in one place so the browser and the server cannot disagree
// about it. Returns null rather than a guess when it has not been given enough
// to work with — a cost of 0 would be indistinguishable from "free".
function packMath_(packCount, perPack, pricePerPack) {
  var n     = Number(packCount);
  var per   = Number(perPack);
  var price = Number(pricePerPack);
  if (!isFinite(n) || !isFinite(per) || n <= 0 || per <= 0) return null;
  var qty = roundQty_(n * per);
  var out = { qty: qty, unitCost: null, totalPrice: null };
  if (isFinite(price) && price > 0) {
    out.totalPrice = Math.round(price * n * 100) / 100;
    // Cost per STOCKING unit, which is the only thing the costing engine
    // understands — see the note at the top of this section.
    out.unitCost = Math.round((price / per) * 10000) / 10000;
  }
  return out;
}

// ─── ARCHIVING OLD MOVEMENTS ─────────────────────────────────────────────────
// Keeps MASTER_ARCHIVE_V3 (what getInitialData sends to every browser on every
// login) bounded to "recent" movements, moving anything older than the
// configured cutoff into ARCHIVE_HISTORY — same columns, viewed on demand via
// loadOlderHistory(). This is what actually shrinks the payload the client has
// to download/parse; the movements table already paginates in the DOM, so the
// remaining weight problem was purely "we ship the whole history every time."
//
// Bidirectional: if the admin RAISES the cutoff (e.g. 6mo → 18mo), rows that
// are now "recent enough" move back from ARCHIVE_HISTORY into MASTER_ARCHIVE_V3
// so they reappear in the normal view — the cutoff is always the single source
// of truth for where a row lives, not a one-way ratchet.
//
// Stock totals are unaffected either way: refreshDerivedSheets_() below scans
// BOTH sheets, so LIVE_STOCK/SITE_STOCK/WASTED_STOCK stay correct regardless of
// which sheet a given row currently sits in.
function ensureArchiveHistorySheet_(ss) {
  var sheet = ss.getSheetByName(SHEETS.ARCHIVE_HISTORY);
  if (!sheet) {
    var archive = ss.getSheetByName(SHEETS.ARCHIVE);
    var headers = archive.getRange(1, 1, 1, AC_WIDTH).getValues()[0];
    sheet = ss.insertSheet(SHEETS.ARCHIVE_HISTORY);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

// Rewrites MASTER_ARCHIVE_V3 and ARCHIVE_HISTORY so every row lands in the
// sheet matching the CURRENT cutoff. Locked against concurrent movement saves
// (same script lock addMovementsBatch_ uses) since row positions shift.
function archiveOldMovements(ss) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { status: 'busy' };
  try {
    var archive = ss.getSheetByName(SHEETS.ARCHIVE);
    if (!archive) return { status: 'no-archive' };
    var history = ensureArchiveHistorySheet_(ss);

    var cfg          = loadConfig();
    var cutoffMonths = cfg.archiveCutoffMonths || 12;
    var cutoffDate   = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - cutoffMonths);

    var colCount = 20;
    var aData    = archive.getDataRange().getValues();
    var keep = [], toArchive = [];
    for (var i = 1; i < aData.length; i++) {
      var row = aData[i];
      if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
      var ts = row[AC.TIMESTAMP] instanceof Date ? row[AC.TIMESTAMP] : null;
      (ts && ts < cutoffDate ? toArchive : keep).push(row);
    }

    var hData = history.getDataRange().getValues();
    var stillOld = [], toRestore = [];
    for (var j = 1; j < hData.length; j++) {
      var hrow = hData[j];
      if (!hrow[AC.CATEGORY] && !hrow[AC.NAME]) continue;
      var hts = hrow[AC.TIMESTAMP] instanceof Date ? hrow[AC.TIMESTAMP] : null;
      (hts && hts >= cutoffDate ? toRestore : stillOld).push(hrow);
    }

    if (!toArchive.length && !toRestore.length) return { status: 'noop' };

    var byTs = function(a, b) {
      var ta = a[AC.TIMESTAMP] instanceof Date ? a[AC.TIMESTAMP].getTime() : 0;
      var tb = b[AC.TIMESTAMP] instanceof Date ? b[AC.TIMESTAMP].getTime() : 0;
      return ta - tb;
    };
    var newActive  = toRestore.concat(keep).sort(byTs);
    var newHistory = stillOld.concat(toArchive).sort(byTs);

    archive.getRange(2, 1, Math.max(archive.getMaxRows() - 1, 1), colCount).clearContent();
    if (newActive.length) archive.getRange(2, 1, newActive.length, colCount).setValues(newActive);

    history.getRange(2, 1, Math.max(history.getMaxRows() - 1, 1), colCount).clearContent();
    if (newHistory.length) history.getRange(2, 1, newHistory.length, colCount).setValues(newHistory);

    auditLog_(ss, 'ARCHIVE_RECONCILE', 'system', 'cutoff=' + cutoffMonths + 'mo',
      toArchive.length + ' archived', toRestore.length + ' restored');
    return { status: 'success', archived: toArchive.length, restored: toRestore.length };
  } catch (e) {
    logError_(ss, 'ERROR', 'backend', 'archiveOldMovements', 'system', e.message, null, newRequestId_());
    throw e;
  } finally {
    lock.releaseLock();
  }
}

function archiveOldMovementsTrigger() {
  // Time-based triggers run as the owner, so this passes; a google.script.run
  // call from any other account does not. Without it, anyone could force a full
  // archive rewrite on demand and burn the project's execution quota.
  requireOwnerContext_();
  setVerifiedAuth_({ role: 'ADMIN', email: 'system@scheduled-trigger', name: 'Scheduled trigger' });
  archiveOldMovements(SpreadsheetApp.getActiveSpreadsheet());
}

// Idempotent — installs the daily trigger once. Called the first time an admin
// saves an archive cutoff so it's self-serve (no manual Apps Script setup step).
function ensureArchiveTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'archiveOldMovementsTrigger') return;
  }
  ScriptApp.newTrigger('archiveOldMovementsTrigger').timeBased().everyDays(1).atHour(3).create();
}

// ─── AUTOMATIC BACKUP ─────────────────────────────────────────────────────────
// Answers the objection every prospective customer has about "the spreadsheet
// IS the database": a full point-in-time copy of the entire spreadsheet — every
// sheet, not just the archive — made daily and kept for a rolling window. This
// covers failure modes the app's own write-verify/lock logic can't: someone
// deletes the live spreadsheet, a manual edit wipes a sheet, Drive corrupts a
// file. Runs at 2am, one hour before the archive job at 3am, so a backup always
// reflects pre-archive state — an extra safety margin if the archive job itself
// ever had a bug.
//
// Restoring is intentionally NOT automated. An automated "restore" that can
// overwrite the live spreadsheet is itself a way to destroy real data with one
// wrong click. To recover: open the dated copy in the backups Drive
// folder, and either copy the needed rows back by hand, or promote that whole
// file to be the new live spreadsheet (Extensions → Apps Script in the copy is
// already bound and ready — just needs deploying).

var BACKUP_RETENTION_DAYS = 30;   // tune down if Drive storage becomes a concern

function dailyBackupTrigger() {
  requireOwnerContext_();   // time-based triggers run as the owner; a google.script.run call from anyone else does not
  setVerifiedAuth_({ role: 'ADMIN', email: 'system@scheduled-trigger', name: 'Scheduled trigger' });
  runBackupNow_();
}

// Shared by the daily trigger and the "Run Backup Now" menu item, so a manual
// test run behaves identically to the automated one.
function runBackupNow_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var folder   = getOrCreateFolder_(backupFolderName_());
    var stamp    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    var copyName = ss.getName() + ' — Backup ' + stamp;

    // ── The configuration goes in BEFORE the copy is taken ──
    //
    // Script Properties belong to the Apps Script project, not to the
    // spreadsheet, so a copy is born with them empty: a restore brings back
    // every movement and NONE of the settings. The one that hurts most is
    // FOLDER_PREFIX — without it every photo and document ever attached
    // silently stops opening, because the app looks in a folder that is not
    // where they are.
    //
    // Writing it into the live file and letting the copy inherit it is not a
    // workaround, it is the only thing the app's scopes permit: the manifest
    // declares `spreadsheets.currentonly`, so the finished copy is a
    // spreadsheet this script may never open. See writeConfigSnapshot_.
    //
    // A backup without the snapshot still beats no backup, so a failure here
    // must not abort the backup — but it must not be silent either, which is
    // exactly how this went unnoticed from v9.97 to v11.13.
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
    // Everything written above has to be on disk before Drive is asked for a
    // copy, or the copy races the write and comes back with an empty tab.
    SpreadsheetApp.flush();

    // The container spreadsheet is the one file the app did NOT create, so
    // under drive.file DriveApp can't touch it. Copy through the Spreadsheet
    // service instead — that goes via the spreadsheets scope, and the copy it
    // returns IS app-created, so DriveApp may then file it away.
    // DriveApp.makeCopy stays as the first choice for installations still on
    // the broad drive scope: it drops the copy straight into the folder in one
    // call, with no intermediate file briefly sitting in My Drive.
    var copyFile;
    try {
      try {
        copyFile = DriveApp.getFileById(ss.getId()).makeCopy(copyName, folder);
      } catch (eDrive) {
        var copied = ss.copy(copyName);            // lands in My Drive root
        copyFile   = DriveApp.getFileById(copied.getId());
        copyFile.moveTo(folder);                   // ours now, so this is allowed
      }
    } finally {
      // The snapshot belongs in the BACKUP, not in the working file, where it
      // would be one more tab among eighteen and would show the installation's
      // settings to anyone with the sheet open. In a finally so that a failed
      // copy cannot leave it behind either.
      try {
        var live = ss.getSheetByName(SHEETS.CONFIG_SNAPSHOT);
        if (live) ss.deleteSheet(live);
      } catch (eDel) { Logger.log('snapshot cleanup: ' + eDel.message); }
    }
    PropertiesService.getScriptProperties()
      .setProperty('LAST_BACKUP_SNAPSHOT', snapErr ? ('FAILED: ' + snapErr) : String(snapProps));

    pruneOldBackups_(folder);

    auditLog_(ss, 'BACKUP_CREATED', 'system', copyName, '', copyFile.getId());
    // Remembered directly, not just logged: AUDIT_LOG only keeps its last ~1500
    // rows readable from the app (getSystemActivity), and on a busy install
    // ADD_MOVEMENT alone can push yesterday's BACKUP_CREATED out of that window
    // in well under a day — the backup itself is still safe in Drive, but the
    // System tab would show "nothing has run" for a backup that plainly did.
    // A Script Property can't be scrolled past.
    var p = PropertiesService.getScriptProperties();
    p.setProperty('LAST_BACKUP_AT', new Date().toISOString());
    p.setProperty('LAST_BACKUP_NAME', copyName);
    p.setProperty('LAST_BACKUP_FILE_ID', copyFile.getId());
    return { status: 'success', name: copyName, id: copyFile.getId() };
  } catch (e) {
    logError_(ss, 'ERROR', 'backend', 'runBackupNow', 'system', e.message, null, newRequestId_());
    // Only email on FAILURE, never on success — a daily "it worked" email would
    // just be more noise against the same recipient quota already flagged as a
    // thing to watch for the PM/admin notification emails elsewhere.
    try {
      var cfg = loadConfig();
      MailApp.sendEmail(adminNotifyEmail_(),
        '⚠ ' + PRODUCT_NAME + ' — Daily backup failed',
        'The automatic daily backup did not complete: ' + e.message +
        '\n\nCheck Settings → Error Log in the app, or the Executions log in the Apps Script editor.');
    } catch (e2) { /* don't let a failed alert mask the original failure */ }
    throw e;
  }
}

// Deletes backups older than the retention window. Runs every time a new
// backup is made, so retention stays enforced without a separate trigger.
// Four properties are deliberately left OUT of the snapshot, each for its
// own reason. Keeping this as a named list rather than a comment means the
// next person to add a property has to decide which side it falls on.
var SNAPSHOT_EXCLUDE = {
  // Not the customer's secret — it is ours, and it is the SAME one across
  // every installation. Copying it into a file in each customer's Drive
  // spreads it to far more people than can read the live script's settings.
  OAUTH_CLIENT_SECRET: 'Ours, not yours, and shared across installations — re-enter it by hand.',
  // The customer's own paid key. Let them paste it back deliberately.
  GEMINI_API_KEY: 'A paid key of yours — paste it back yourself.',
  // Regenerates itself on first use. Copying it only extends its life.
  SESSION_SECRET: 'Recreated automatically. Everyone signs in once more.',
  // Meaningless by tomorrow.
  WMS_SESSIONS: 'Who was signed in at the time. Not worth restoring.',
  // ── The backup's own bookkeeping ──
  // Jose spotted these on the first snapshot he read: LAST_BACKUP_SNAPSHOT
  // said "FAILED", in a tab that had plainly just been written, because the
  // snapshot is taken BEFORE the current run records its own outcome — so it
  // always carried the PREVIOUS run's result. Confusing in the calmest
  // circumstances, and this document exists to be read during an emergency.
  //
  // They are excluded rather than made accurate, because putting them back
  // would be wrong even if they were: they describe the OLD installation's
  // backup history. A restored copy that claims a backup ran last Tuesday is
  // asserting something about itself that never happened, and the System tab
  // would show a green last-backup line for a file that has never been backed
  // up at all.
  LAST_BACKUP_AT:       'The old file\'s backup history — not this copy\'s. Press Backup Now once restored.',
  LAST_BACKUP_NAME:     'Same.',
  LAST_BACKUP_FILE_ID:  'Same — and the link would point at the old file.',
  LAST_BACKUP_SNAPSHOT: 'Same.'
};

// Properties whose old value is actively WRONG in a restored copy, because
// restoring creates a new Apps Script project with a new deployment.
//
// Copying these across is worse than leaving them blank: the app would hold a
// URL that opens the file you are replacing.
var SNAPSHOT_REPLACE_AFTER_DEPLOY = {
  WEB_APP_URL:        'REPLACE after Deploy → New deployment: paste the NEW /exec address, not this one.',
  OAUTH_REDIRECT_URI: 'REPLACE with the new /exec address, and register it in the OAuth client too.'
};

// Writes every Script Property worth restoring into the LIVE spreadsheet, so
// that the copy taken immediately afterwards carries it. See
// RESTAURAR-UN-BACKUP.md for the procedure that reads it.
//
// It used to take a file id and call SpreadsheetApp.openById on the finished
// copy. That could never work, and never did: the manifest declares
// `spreadsheets.currentonly`, which grants access to the CONTAINER spreadsheet
// and nothing else. Every backup since the feature shipped in v9.97 contained
// the data and none of the settings, and said nothing about it — Jose found it
// on the first real restore drill, with nine backups already in Drive.
//
// The obvious fix — adding the full `spreadsheets` scope — is the wrong one.
// That scope reads "see, edit, create and delete all your spreadsheets", it
// would face every customer with a much larger consent screen, and it buys one
// feature that can be had for nothing by simply writing BEFORE the copy
// instead of after. The narrow scope is a promise; a backup is not worth
// breaking it.
//
// The tab is removed from the live file once the copy exists (see
// runBackupNow_) — it belongs in the backup, not in the customer's working
// file, where it would be one more tab among eighteen.
function writeConfigSnapshot_(ss) {
  var props = PropertiesService.getScriptProperties().getProperties();

  // What each property IS, in a third column. A bare name-and-value list means
  // reading it correctly depends on already knowing what the names mean, and
  // this document is read exactly once — during an emergency, possibly by
  // somebody who has never seen it. Jose's own first read is the evidence: he
  // saw WAREHOUSE_ROLE_LABEL = SUPERVISOR and reasonably concluded his account
  // had the wrong role, when it is the display NAME chosen for the warehouse
  // role and has nothing to do with who he is.
  var guide = {};
  try {
    for (var g = 0; g < PROPERTY_GUIDE.length; g++) guide[PROPERTY_GUIDE[g].key] = PROPERTY_GUIDE[g];
  } catch (eG) { /* the list is optional context, never a reason to lose the snapshot */ }

  function noteFor(key) {
    if (SNAPSHOT_REPLACE_AFTER_DEPLOY[key]) return '⚠ ' + SNAPSHOT_REPLACE_AFTER_DEPLOY[key];
    // FOLDER_* is one entry per company name the installation has had, so the
    // keys are generated and cannot be listed one by one.
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
  sheet.getRange(1, 1, all.length, 3).setValues(all);
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

// Idempotent — installs the daily trigger once. Bound to the "Enable Daily
// Backup" menu item rather than onOpen(): onOpen is a SIMPLE trigger under
// Apps Script's security model and can't call authorized services like
// ScriptApp.newTrigger() or DriveApp — it would throw on every single open.
// The nightly backup, controllable from inside the app.
//
// It could only ever be switched on from the spreadsheet menu, which means the
// people most likely to care — an admin who lives in the app and may never open
// the Sheet — had no way to see whether it was on, let alone turn it on. Worse,
// the System tab said "once it is switched on from the Acopio menu" and then
// offered no way to do it.
//
// Read on demand rather than in getInitialData: getProjectTriggers() is a real
// call and every app load would pay for it, to answer a question nobody asks
// except when they open this tab.
function backupEnabled_() {
  try {
    var t = ScriptApp.getProjectTriggers();
    for (var i = 0; i < t.length; i++) {
      if (t[i].getHandlerFunction() === 'dailyBackupTrigger') return true;
    }
  } catch (e) { Logger.log('backupEnabled_: ' + e.message); }
  return false;
}

// ─── HOW FULL IS THE SPREADSHEET ────────────────────────────────────────────
// Google caps a spreadsheet at 10 million cells ACROSS ALL TABS. Acopio uses
// 22 columns per movement, so the practical ceiling is roughly 250,000–300,000
// movements once CONFIG, USERS, AUDIT_LOG, the derived sheets and
// ARCHIVE_HISTORY have taken their share — and things get slow well before
// that, around 100,000 rows.
//
// Most customers will never come close. A busy warehouse at 300 movements a
// day gets there in about three and a half years, and that customer is the one
// paying the most and shouting the loudest. This turns an invisible ceiling
// into a visible one with years of warning, which is the cheap half of the
// answer; the expensive half (closing a period into a separate file) is
// designed in docs/CUANDO-SE-LLENE-EL-SHEET.md and not built.
//
// NOTE ON WHAT GOOGLE COUNTS: the limit is on GRID cells, not filled ones. A
// tab with 1,000 blank rows still spends 1,000 × its column count. So this
// multiplies getMaxRows by getMaxColumns rather than counting data — reporting
// only filled cells would tell the customer they have room they do not have.
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

// The estimate, with the two guards that keep it from lying.
//
// 1. THE FIRST MONTHS LIE. Loading the opening inventory puts hundreds of
//    movements in a few days. Projecting from that tells a workshop with
//    fifteen years of room that it fills in eight months. So the rate is
//    measured over the LAST 90 DAYS, which drops the initial load on its own
//    without a special case, and nothing is shown at all before 60 days of
//    use.
// 2. EXTRAPOLATING GROWTH COMPOUNDS. A 12% rise in one quarter projected
//    forward five years produces an absurd number; a real warehouse's curve
//    flattens and the formula does not know that. So growth is used only to
//    BRACKET a second scenario — "~7 years, or ~5 if the pace keeps
//    growing" — never to draw a curve.
//
// Returns null when there is not enough history to say anything honest, and
// the caller says so rather than filling the space with a guess.
function spaceEstimate_(archive, history, cellsUsed) {
  var DAY = 86400000, now = Date.now();

  // Oldest movement anywhere: history first, since that is where old rows go.
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

  // One column read, not the whole sheet. Only the live archive is needed:
  // the cutoff is at least 6 months, so the last 180 days are all in here.
  if (!archive || archive.getLastRow() < 2) return null;
  var stamps = archive.getRange(2, AC.TIMESTAMP + 1, archive.getLastRow() - 1, 1).getValues();
  var recent = 0, previous = 0;
  for (var i = 0; i < stamps.length; i++) {
    var v = stamps[i][0];
    var ms = v instanceof Date ? v.getTime() : Date.parse(v);
    if (isNaN(ms)) continue;
    // Strictly less-than on both, so the two windows are exactly 90 days each.
    // With <= the recent window quietly covered 91 days and every steady
    // installation looked like it was growing 1% — which is how the "growing"
    // sentence would have shown up on screens that had no business seeing it.
    var age = (now - ms) / DAY;
    if (age < 90) recent++;
    else if (age < 180) previous++;
  }

  // Divide by the days actually available, so an installation at 70 days is
  // not made to look half as busy as it is by a fixed 90-day denominator.
  var window1 = Math.min(90, daysOfUse);
  var perDay  = recent / window1;
  if (perDay <= 0) return { idle: true, daysOfUse: Math.floor(daysOfUse) };

  var remaining = Math.max(0, SHEET_CELL_LIMIT - cellsUsed);
  var years = remaining / (perDay * AC_WIDTH * 365);

  // The faster scenario, only when there is a real second window to compare
  // against and the pace rose by enough to mean something.
  //
  // GROWTH_FLOOR exists because a warehouse's month-to-month volume is noisy:
  // a couple of percent either way is weather, not a trend, and offering "or
  // ~7 years if your pace keeps growing" against "~7 years" is a sentence that
  // says nothing while sounding like a warning. Below the floor there is one
  // number, which is the honest answer.
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
  // Nothing recorded yet doesn't mean nothing ever ran — an install that was
  // backing up before this feature shipped has real files sitting in Drive
  // with no property pointing at them. One folder scan finds the newest one
  // and remembers it, so this only ever happens once per install rather than
  // on every Settings → System load.
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
  return {
    enabled:          backupEnabled_(),
    retentionDays:    BACKUP_RETENTION_DAYS,
    folder:           backupFolderName_(),
    lastBackupAt:     lastAt || '',
    lastBackupName:   lastName || '',
    lastBackupFileId: lastId || '',
    // How the configuration snapshot went on the last run: a number of
    // properties saved, or "FAILED: …". Surfaced because a backup that quietly
    // stopped carrying the configuration looks exactly like a healthy one
    // until somebody actually needs it.
    lastBackupSnapshot: p.getProperty('LAST_BACKUP_SNAPSHOT') || '',
    // The whole list, straight from Drive — see listBackups_ for why it is
    // not read from AUDIT_LOG like the rest of the System tab.
    backups:          (function(){ try { return listBackups_(); } catch (e) { Logger.log('listBackups_: ' + e.message); return []; } })()
  };
}

// EVERY backup currently sitting in the folder, newest first.
//
// Read from Drive, NOT from AUDIT_LOG, and that difference is the whole
// point. AUDIT_LOG answers "what happened", and it fails this job twice
// over: only its last ~1500 rows are readable from the app, which ordinary
// ADD_MOVEMENT traffic can scroll a backup past in under a day; and it keeps
// reporting a backup the customer has since deleted or moved, so the link
// leads to Drive's "Sorry, unable to open the file at this time".
//
// The folder answers "what still exists", which is the question actually
// being asked when someone opens this list to go and restore something. A
// deleted backup simply stops being listed, which is the honest outcome.
//
// Costs one folder scan, paid only when Settings → System is opened (that
// tab already calls getBackupStatus), never on an ordinary app load.
function listBackups_() {
  var folder = getOrCreateFolder_(backupFolderName_());
  var files  = folder.getFiles();
  var out    = [];
  // Bounded: retention prunes at 30 days so this is normally ~30 files, but
  // an install whose schedule was off and on, or one restored by hand, can
  // hold more, and this runs while someone waits on a settings tab.
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
  // Turning the nightly backup OFF is exactly the kind of thing somebody should
  // be able to point at afterwards.
  auditLog_(SpreadsheetApp.getActiveSpreadsheet(), on ? 'BACKUP_SCHEDULE_ON' : 'BACKUP_SCHEDULE_OFF',
    auth.email, 'Daily backup ' + (on ? 'enabled' : 'disabled'), '', '');
  return { status: 'success', enabled: backupEnabled_() };
}

// Deliberately does NOT switch the schedule on as a side effect. "Back this up
// before I do something risky" and "back it up every night from now on" are two
// different decisions, and the menu version conflating them is why an admin
// could have the schedule running without ever having chosen it.
function runBackupOnDemand(data, auth) {
  auth = requireAuth_('ADMIN');
  var res = runBackupNow_();
  return { status: 'success', name: res && res.name ? res.name : '' };
}

function ensureBackupTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyBackupTrigger') return;
  }
  ScriptApp.newTrigger('dailyBackupTrigger').timeBased().everyDays(1).atHour(2).create();
}

// ─── CHECK-IN — CATCH A STUCK CUSTOMER BEFORE THEY QUIETLY LEAVE ─────────────
// Jose's own problem statement: a customer pays, doesn't understand it, and
// cancels without ever saying why — which costs the sale AND the feedback that
// would have prevented the next one. The fix isn't more software for the
// customer; it's Jose finding out FAST that someone is stuck, instead of
// finding out when they don't renew.
//
// This is a private signal to JOSE, not a nudge to the customer. It reads two
// counts (movements, users), sends a plain email describing what it found, and
// touches nothing else in this file. It cannot ever crash a customer's app: it
// runs from its own daily trigger, wrapped in try/catch, same as the backup.
//
// WHAT IT SENDS AND WHY IT MATTERS: an email carrying the company name, the
// admin's address and a movement count leaves this installation and reaches
// Jose. That is real — no inventory contents, no costs, no names of materials,
// just "0 movements in 3 days" — but it is still data leaving the customer's
// Drive, and the Privacy Policy currently promises data never does. That
// promise needs one honest line added for this before it ships to a real
// customer; flagged to Jose rather than quietly worded around.
//
// OFF unless two things are both true: SUPPORT_EMAIL is set (Jose's own
// address — nothing to send it to otherwise) and CHECKIN_ALERTS_ENABLED has
// not been explicitly turned off. Auto-armed at the end of setup because it
// benefits Jose, not the customer, and costs the customer nothing to have
// running — but it never actually mails anyone until SUPPORT_EMAIL exists,
// which today is true for zero installations.
var CHECKIN_MILESTONE_DAYS = [3, 7];

function ensureCheckinTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyCheckinTrigger') return;
  }
  // A different hour than the 2am backup, on purpose — this one is meant to
  // land in Jose's inbox at a time he might actually be reading it.
  ScriptApp.newTrigger('dailyCheckinTrigger').timeBased().everyDays(1).atHour(9).create();
}

function dailyCheckinTrigger() {
  // v11.27 — the trigger name is a public global, so it was also a door: any
  // signed-in account with the app's URL could call it and make the install
  // send its check-in mail on demand, as many times as they cared to click.
  // Nothing was corrupted by that, but the owner's inbox is not a free
  // service to strangers, and "runs as the owner" is exactly the condition
  // requireOwnerContext_ was written to prove.
  //
  // The time-based trigger executes as the owner, so effective and active
  // user are the same account and this passes. Under the web app's
  // "Execute as: Me" deployment they never match for anyone else, so every
  // google.script.run call from another user is refused here.
  //
  // The refusal is swallowed with everything else: a trigger that throws
  // would mail the owner a failure notice every morning, which is a worse
  // outcome than the call it just blocked.
  try {
    requireOwnerContext_();
    runCheckin_();
  } catch (e) { Logger.log('dailyCheckinTrigger: ' + e.message); }
}

function runCheckin_() {
  var p = PropertiesService.getScriptProperties();
  if (!companySettings_().setupComplete) return;      // nothing to check in on yet
  if (p.getProperty('CHECKIN_ALERTS_ENABLED') === 'false') return;

  // Backfill rather than assume day zero: an installation that finished setup
  // before this feature existed (OX Glass's own copy, first) must not fire an
  // alarm the instant this ships, computed against a start date it never had.
  var startedIso = p.getProperty('SETUP_COMPLETED_AT');
  if (!startedIso) {
    startedIso = new Date().toISOString();
    p.setProperty('SETUP_COMPLETED_AT', startedIso);
  }
  var daysSince = Math.floor((Date.now() - new Date(startedIso).getTime()) / 86400000);

  var sentRaw = p.getProperty('CHECKIN_MILESTONES_SENT') || '';
  var sent    = sentRaw.split(',').filter(function (s) { return s; });

  // Only the milestones actually reached AND not yet handled — one run can
  // catch up on several at once (the trigger was paused, say), but only ever
  // emails about the ONE that matters most: the latest. Every reached
  // milestone is marked handled in the same pass either way, so a gap in the
  // trigger's own uptime can never queue up a backlog of alerts.
  var due = CHECKIN_MILESTONE_DAYS.filter(function (d) {
    return daysSince >= d && sent.indexOf(String(d)) === -1;
  });
  if (!due.length) return;

  due.forEach(function (d) { sent.push(String(d)); });
  p.setProperty('CHECKIN_MILESTONES_SENT', sent.join(','));

  var support = String(p.getProperty('SUPPORT_EMAIL') || '').trim();
  if (!support) return;   // nowhere to send it — the feature is effectively off

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var movementCount = archive ? Math.max(0, archive.getLastRow() - 1) : 0;
  if (movementCount > 0) return;   // the good outcome — nothing to say

  var milestone = due[due.length - 1];
  var cs      = companySettings_();
  var cfg     = loadConfig();
  var users   = ss.getSheetByName('USERS_V3');
  var userCount = users && users.getLastRow() > 1 ? users.getLastRow() - 1 : 0;
  var url = String(savedWebAppUrl_() || '');

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
        (url ? '<tr><td style="color:#666">Their app</td><td><a href="' + escHtml_(url) + '">' + escHtml_(url) + '</a></td></tr>' : '') +
      '</table>' +
      '<p style="font-size:13px">This is the moment to reach out — a short call in the first two weeks is ' +
        'the biggest thing that predicts whether an install turns into a renewal.</p>' +
      '<p style="font-size:12px;color:#666">This is a private check-in, sent only to you — the customer never ' +
        'sees it. To turn it off for this installation: Apps Script → Project Settings → Script Properties → ' +
        'CHECKIN_ALERTS_ENABLED = false</p></div>'
  });
}

/* ═══ EL REPORTE DIARIO ══════════════════════════════════════════════════════
 *
 * Pedido de Jose (2026-08-31): "reporte diario de qué se recibió y qué salió de
 * la bodega, en la noche, hora modificable por un admin."
 *
 * No confundir con dailyCheckinTrigger, que es otra cosa entera: aquel es una
 * alarma de ventas para Jose, se dispara solo los días 3 y 7 y solo si el
 * cliente no ha registrado NADA, y el cliente nunca lo ve. Este es para el
 * cliente, todas las noches, y trata de su bodega.
 *
 * Tres decisiones de Jose, y las tres cambian el código:
 *
 *   LA HORA LA PONE UN ADMIN. Los otros tres disparadores tienen la hora
 *   escrita a mano (.atHour(9)). Un disparador de Apps Script no se puede
 *   editar: para cambiarle la hora hay que BORRARLO y crear otro. Por eso
 *   ensureDailyReportTrigger_ compara la hora guardada con la instalada y
 *   rehace el disparador cuando no coinciden, en vez de salir temprano al ver
 *   que "ya existe uno" — que es lo que hacen los otros tres y sería el error
 *   exacto aquí: la hora cambiaría en los ajustes y no en la realidad.
 *
 *   LLEGA AL ADMIN QUE LO CONFIGURÓ, MÁS SU LISTA. El que lo enciende queda
 *   guardado y siempre recibe; los demás se agregan. Así nadie lo enciende y
 *   se olvida de ponerse a sí mismo.
 *
 *   UN DÍA SIN MOVIMIENTOS SÍ SE MANDA. Jose: "mandar 'hoy no hubo
 *   movimientos' es información; esto es más profesional." Y tiene razón por
 *   una segunda razón que no dijo: el silencio de un día tranquilo y el
 *   silencio de un disparador caído se ven exactamente igual.
 */

var DAILY_REPORT_DEFAULT_HOUR = 20;   // 8pm — "en la noche", y antes de que la gente se acueste

function dailyReportSettings_() {
  var p = PropertiesService.getScriptProperties();
  var h = parseInt(p.getProperty('DAILY_REPORT_HOUR'), 10);
  return {
    enabled: p.getProperty('DAILY_REPORT_ENABLED') === 'true',
    // Una hora fuera de 0–23 no es una hora. Se cae al valor por omisión en vez
    // de pasársela a .atHour(), que la rechazaría y dejaría la instalación sin
    // disparador y sin nadie enterado.
    hour:    (isFinite(h) && h >= 0 && h <= 23) ? h : DAILY_REPORT_DEFAULT_HOUR,
    owner:   String(p.getProperty('DAILY_REPORT_OWNER') || '').trim(),
    extra:   String(p.getProperty('DAILY_REPORT_TO')    || '').trim()
  };
}

/** Todos los destinatarios, sin repetir y sin vacíos. El dueño primero. */
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

/**
 * Instala, reinstala o quita el disparador según los ajustes.
 *
 * A diferencia de ensureBackupTrigger_ y compañía, este NO sale temprano al
 * encontrar uno instalado: comprueba también la HORA. Un disparador con la
 * hora vieja es peor que ninguno, porque los ajustes dicen una cosa y la
 * bandeja de entrada hace otra, y nadie sospecha de los ajustes.
 */
function ensureDailyReportTrigger_() {
  var cfg = dailyReportSettings_();
  var triggers = ScriptApp.getProjectTriggers();
  var found = null;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyReportTrigger') { found = triggers[i]; break; }
  }

  if (!cfg.enabled) {
    if (found) ScriptApp.deleteTrigger(found);
    PropertiesService.getScriptProperties().deleteProperty('DAILY_REPORT_TRIGGER_HOUR');
    return 'off';
  }

  // La hora a la que el disparador vivo fue creado. El objeto Trigger no la
  // sabe decir, así que se guarda al crearlo — sin eso no hay forma de
  // distinguir "instalado a las 20" de "instalado a las 9".
  var p = PropertiesService.getScriptProperties();
  var installedHour = parseInt(p.getProperty('DAILY_REPORT_TRIGGER_HOUR'), 10);

  if (found && installedHour === cfg.hour) return 'unchanged';

  if (found) ScriptApp.deleteTrigger(found);
  ScriptApp.newTrigger('dailyReportTrigger').timeBased().everyDays(1).atHour(cfg.hour).create();
  p.setProperty('DAILY_REPORT_TRIGGER_HOUR', String(cfg.hour));
  return found ? 'rescheduled' : 'installed';
}

/**
 * El manejador. Público porque un disparador tiene que poder llamarlo, y por
 * eso mismo es una puerta: cualquier cuenta con la URL de la app podría
 * invocarlo y hacer que la instalación mande su reporte cuando quiera.
 * requireOwnerContext_ es lo que lo impide — un disparador programado corre
 * como el dueño, así que pasa; una llamada de otra persona, no.
 */
function dailyReportTrigger() {
  try {
    requireOwnerContext_();
    setVerifiedAuth_({ role: 'ADMIN', email: 'system@scheduled-trigger', name: 'Scheduled trigger' });
    runDailyReport_();
  } catch (e) {
    // Un disparador que lanza le manda al dueño un aviso de fallo cada noche,
    // que es peor resultado que la llamada que acaba de bloquear.
    Logger.log('dailyReportTrigger: ' + e.message);
  }
}

/** Los movimientos de HOY, en la zona horaria de la instalación. */
function dailyReportMovements_(ss) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive || archive.getLastRow() < 2) return [];
  var tz    = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var rows  = archive.getDataRange().getValues();
  var out   = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][AC.CATEGORY] && !rows[i][AC.NAME]) continue;
    var ts = rows[i][AC.TIMESTAMP];
    if (!(ts instanceof Date)) ts = new Date(ts);
    if (isNaN(ts.getTime())) continue;
    // Se compara la fecha LOCAL formateada, no la UTC. Comparar en UTC parte el
    // día por la mitad en Utah: todo lo registrado después de las 5 o 6 de la
    // tarde cae ya en el día siguiente, y el reporte de la noche se manda
    // justo a esa hora. Habría llegado sistemáticamente incompleto.
    if (Utilities.formatDate(ts, tz, 'yyyy-MM-dd') !== today) continue;
    var m = parseArchiveRow(rows[i], i + 1);
    // Los costos se quitan aquí, aunque el correo de hoy no los imprima.
    //
    // test-cost-privacy lo señaló y tenía razón: no es que hubiera una fuga, es
    // que no había nada que la impidiera. Este reporte le llega al admin Y a la
    // lista que él escriba, que puede incluir gente de bodega que por
    // configuración no ve precios. El día que alguien agregue una columna de
    // valor al correo —una petición perfectamente razonable— la fuga sería
    // silenciosa y viajaría por correo, que es de donde no se puede recoger.
    //
    // Quitarlos donde se leen cuesta dos líneas y vuelve el error imposible.
    // Apuntar esta función en la lista de excepciones del guardián habría
    // costado una, y lo habría dejado esperando.
    m.unitCost  = null;
    m.totalCost = null;
    out.push(m);
  }
  return out;
}

function runDailyReport_() {
  var cfg = dailyReportSettings_();
  if (!cfg.enabled) return 'disabled';

  var to = dailyReportRecipients_();
  if (!to.length) return 'no-recipients';   // encendido sin nadie a quien mandarlo

  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var movs = dailyReportMovements_(ss);
  var cs   = companySettings_();
  var tz   = Session.getScriptTimeZone();
  var hoy  = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');

  var IN  = { ENTRY: 1, RETURN: 1 };
  var OUT = { EXIT: 1, WASTE: 1 };
  var llegaron = movs.filter(function (m) { return IN[m.moveType]; });
  var salieron = movs.filter(function (m) { return OUT[m.moveType]; });
  var internos = movs.filter(function (m) { return !IN[m.moveType] && !OUT[m.moveType]; });

  var subject = cs.name
    ? (cs.name + ' — movimientos del ' + hoy)
    : ('Movimientos del ' + hoy);
  if (!movs.length) subject += ' (sin movimientos)';

  MailApp.sendEmail({
    to: to.join(','),
    subject: subject,
    htmlBody: dailyReportHtml_(hoy, cs, llegaron, salieron, internos, cfg)
  });
  return 'sent';
}

function dailyReportHtml_(hoy, cs, llegaron, salieron, internos, cfg) {
  function tabla(titulo, lista, color) {
    if (!lista.length) return '';
    var total = 0;
    var filas = lista.map(function (m) {
      total += Number(m.qty) || 0;
      var donde = m.moveType === 'ENTRY' || m.moveType === 'RETURN'
        ? (m.destLoc || '—') : (m.sourceLoc || '—');
      return '<tr>' +
        '<td>' + escHtml_(m.name || '—') + '</td>' +
        '<td style="color:#666">' + escHtml_(m.category || '') + '</td>' +
        '<td align="right"><b>' + (Number(m.qty) || 0) + '</b> ' +
          escHtml_(m.unit || '') + '</td>' +
        '<td>' + escHtml_(donde) + '</td>' +
        '<td style="color:#666">' + escHtml_(m.responsible || m.userEmail || '') + '</td>' +
      '</tr>';
    }).join('');
    return '<h3 style="margin:1.4rem 0 .4rem;color:' + color + '">' + titulo +
             ' <span style="color:#666;font-weight:400">(' + lista.length + ')</span></h3>' +
           '<table cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%">' +
             '<tr style="background:#f5f5f5;text-align:left">' +
               '<th>Material</th><th>Categoría</th><th align="right">Cantidad</th>' +
               '<th>Ubicación</th><th>Quién</th></tr>' + filas +
           '</table>';
  }

  var cuerpo;
  if (!llegaron.length && !salieron.length && !internos.length) {
    // El día tranquilo. Se manda igual, y se dice POR QUÉ se manda — si no, el
    // primer correo vacío parece un error del sistema y el segundo se archiva
    // sin leer.
    cuerpo =
      '<p style="font-size:15px">Hoy no se registró ningún movimiento en la bodega.</p>' +
      '<p style="color:#666;font-size:13px">Este aviso se manda también los días ' +
        'sin movimiento, a propósito: así un día tranquilo no se confunde con un ' +
        'reporte que no llegó.</p>';
  } else {
    cuerpo = tabla('Llegó a la bodega', llegaron, '#046C4E') +
             tabla('Salió de la bodega', salieron, '#B42318') +
             tabla('Se movió dentro de la bodega', internos, '#1E52A0');
  }

  return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;max-width:720px">' +
    '<h2 style="margin:0 0 .2rem">' + escHtml_(cs.name || 'Bodega') + '</h2>' +
    '<p style="margin:0 0 1rem;color:#666">Movimientos del ' + escHtml_(hoy) + '</p>' +
    cuerpo +
    '<p style="margin-top:1.6rem;font-size:12px;color:#666;border-top:1px solid #e5e7eb;' +
      'padding-top:.8rem">Reporte automático de ' + escHtml_(PRODUCT_NAME) + '. ' +
      'Un administrador puede cambiar la hora o apagarlo desde Ajustes.</p></div>';
}

/** Lo que la pantalla de Ajustes lee. */
function getDailyReportSettings(auth) {
  auth = requireAuth_('ADMIN');
  var cfg = dailyReportSettings_();
  return { enabled: cfg.enabled, hour: cfg.hour, owner: cfg.owner, extra: cfg.extra,
           recipients: dailyReportRecipients_() };
}

/** Lo que la pantalla de Ajustes guarda. Reinstala el disparador de una vez. */
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
  // Quien lo enciende queda registrado y siempre recibe. Sin esto, un admin lo
  // activa, escribe la lista de otra gente, y es el único que no se entera.
  if (enabled && !String(p.getProperty('DAILY_REPORT_OWNER') || '').trim()) {
    p.setProperty('DAILY_REPORT_OWNER', auth.email);
  }

  var estado = ensureDailyReportTrigger_();
  auditLog_(ss, 'DAILY_REPORT', auth.email, 'settings',
    enabled ? ('on @' + hour + ':00') : 'off', estado);

  return { ok: true, state: estado, settings: getDailyReportSettings() };
}

/** Mandarlo ahora, para que un admin no tenga que esperar a la noche para ver
 *  si quedó bien configurado. */
function sendDailyReportNow(auth) {
  auth = requireAuth_('ADMIN');
  var cfg = dailyReportSettings_();
  if (!cfg.enabled) return { ok: false, message: 'The daily report is off. Turn it on first.' };
  var to = dailyReportRecipients_();
  if (!to.length) return { ok: false, message: 'Nobody would receive it — add at least one address.' };
  runDailyReport_();
  return { ok: true, message: 'Sent to ' + to.join(', ') };
}

// ADMIN only. Returns movements older than the cutoff, for on-demand viewing/
// export ("Load older history"). Read-only in the UI — rowIdx here refers to
// ARCHIVE_HISTORY's row, not MASTER_ARCHIVE_V3's, so it's tagged `archived: true`
// and must never be sent to modifyMovement/updateDocument_.
function loadOlderHistory(auth) {
  auth = requireAuth_();   // any registered user; unauthenticated callers are refused
  var seeCosts = canSeeCosts_(auth);
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var history = ensureArchiveHistorySheet_(ss);
  var data    = history.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[AC.CATEGORY] && !row[AC.NAME]) continue;
    var m = parseArchiveRow(row, i + 1);
    m.archived = true;
    // The second door for costs, and it would have been easy to miss: this
    // returns exactly the same movement objects getInitialData does, from the
    // other sheet, and requireAuth_() with no minimum role lets a VIEWER
    // through. Stripping only the first load would have moved the leak to
    // "Load older history" rather than closing it — which is why finding 2 is
    // fixed at every place these objects leave the server, not at the first
    // one found.
    if (!seeCosts) { m.unitCost = null; m.totalCost = null; }
    out.push(m);
  }
  return out;
}

// ─── REFRESH DERIVED SHEETS ──────────────────────────────────────────────────
// Scans MASTER_ARCHIVE_V3 AND ARCHIVE_HISTORY together — stock totals must stay
// correct regardless of which sheet a movement currently lives in.
function refreshDerivedSheets_(ss) {
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  var live    = ss.getSheetByName(SHEETS.LIVE);
  var site    = ss.getSheetByName(SHEETS.SITE);
  if (!archive || !live || !site) return;
  var waste   = ensureWasteSheet_(ss);
  var history = ensureArchiveHistorySheet_(ss);

  var archiveData = archive.getDataRange().getValues();
  var historyData = history.getDataRange().getValues();
  var data  = archiveData.concat(historyData.slice(1));
  var stock = {};
  // Self-healing MatID: any row whose stored MatID doesn't match what it should
  // be gets corrected in the sheet as part of this same pass — so a mismatch
  // introduced once (bad save, manual edit, old code path) doesn't keep causing
  // this bug forever; every rebuild repairs it going forward automatically.
  var matIdFixes = []; // { sheet: archive|history, rowNum, correctMatId }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[AC.CATEGORY]) continue;
    var m   = parseArchiveRow(row, i + 1);
    // ALWAYS recompute the grouping key from category+name — never trust the
    // stored MatID column. This was the actual root cause of stock "still in
    // the warehouse" after a real EXIT: two rows for the literal same material
    // (same category, same name, confirmed identical) can have DIFFERENT
    // stored MatIDs if they were saved via different code paths/times before
    // every write went through the same computation — the old retired
    // _addMovement() vs the current addMovementsBatch_(), or any future drift.
    // getMaterialId() is a pure function of category+name, so recomputing here
    // guarantees two rows that are obviously "the same material" always land
    // in the same bucket, regardless of what got persisted at save time.
    var key = getMaterialId(m.category, m.name);

    if (row[AC.MAT_ID] !== key) {
      var isHistoryRow = i >= archiveData.length;
      // Sheet row number (1-indexed, header = row 1): for archive rows it's just
      // i+1; for history rows, i has to be re-based off where the history
      // segment starts in the concatenated `data` array, then +2 to account for
      // history's own header row (which was sliced out of `data` above).
      // What was repaired is recorded alongside the repair. "1 row had a
      // stale MatID" tells an owner nothing they can act on or verify; the
      // material, the amount, the rack and the two IDs let them go and look.
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

    if (!stock[key]) stock[key] = { cat: m.category, name: m.name, project: m.project, unit: m.unit || 'UNIT', locs: {}, siteProjs: {}, wasted: 0 };
    var s   = stock[key];
    var qty = m.qty;

    // CRITICAL: rack names must be compared normalized (uppercase+trim), not as
    // whatever literal text happens to be stored. addMovementsBatch_ forces
    // upper+trim on every new save, but modifyMovement's manual-edit path did
    // NOT (fixed separately below) — so any row ever touched by a manual edit,
    // or any older/legacy row, could have "B1A" vs "b1a" vs " B1A" sitting in
    // the sheet. Those would never net against each other as the same rack —
    // an ENTRY's +21 stays parked under one key forever while a later EXIT's
    // -21 lands under a slightly different key, and even a full rebuild from
    // scratch reproduces the same stale "still in stock" result, because the
    // matching itself — not just when it runs — was the bug.
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
      // The fourth and last place that turns movements into stock. All four
      // have to agree or LIVE_STOCK drifts away from what the full scan says,
      // and the drift only shows up as a rack drawer quietly reading wrong.
      // `wasted` is deliberately not touched — see calculateStock.
      if (m.sourceLoc && !m.destLoc) {
        var aSrc = rackKey(m.sourceLoc);
        s.locs[aSrc] = (s.locs[aSrc] || 0) - qty;
      } else if (m.destLoc && !m.sourceLoc) {
        var aDst = rackKey(m.destLoc);
        s.locs[aDst] = (s.locs[aDst] || 0) + qty;
      }
    }
  }

  // Apply the self-healing MatID corrections found above. One setValues call
  // per affected sheet (archive/history), not per row — same batching
  // discipline as everything else in this function.
  if (matIdFixes.length) {
    var archiveFixes = matIdFixes.filter(function(f){ return !f.isHistory; });
    var historyFixes = matIdFixes.filter(function(f){ return f.isHistory; });
    archiveFixes.forEach(function(f){ archive.getRange(f.rowNum, AC.MAT_ID + 1).setValue(f.correctMatId); });
    historyFixes.forEach(function(f){ history.getRange(f.rowNum, AC.MAT_ID + 1).setValue(f.correctMatId); });
    // The row numbers go in a shape the app can parse back out, so the
    // notification can offer to show you the actual rows rather than leaving
    // you to search the sheet for them.
    auditLog_(ss, 'AUTO_REPAIR_MATID', 'system',
      describeMatIdFixes_(matIdFixes),
      'rows ' + matIdFixes.map(function (f) { return f.rowNum; }).join(','),
      'was ' + matIdFixes[0].wasMatId + ' → now ' + matIdFixes[0].correctMatId);
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

  // Cumulative wasted qty per material — the only stock figure that had NO derived
  // sheet before, forcing getInitialData() to fall back to a full movement scan
  // just to know how much of something was wasted. Now precomputed here (once per
  // save) instead of recomputed on every login.
  var wasteRows = [['Category','Name','Qty','Unit','Last_Updated']];
  for (var k3 in stock) {
    if (!stock.hasOwnProperty(k3)) continue;
    var item3 = stock[k3];
    if (item3.wasted > 0) wasteRows.push([item3.cat, item3.name, item3.wasted, item3.unit, now]);
  }
  waste.clearContents();
  if (wasteRows.length > 0) waste.getRange(1, 1, wasteRows.length, 5).setValues(wasteRows);
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────────
function addReservation_(ss, data, auth) {
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
  sheet.appendRow([id, sheetSafe_(cat), sheetSafe_(name), sheetSafe_(proj), qty, auth.email, new Date(), 'Active', '']);

  auditLog_(ss, 'ADD_RESERVATION', auth.email, id + ' | ' + name + ' x' + qty, '', '');
  return { status: 'success', reservationId: id };
}

function cancelReservation_(ss, data, auth) {
  var sheet = ss.getSheetByName(SHEETS.RESERVATIONS);
  if (!sheet) throw new Error('Reservations sheet not found.');
  var id     = data.reservationId;
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.getRange(i + 1, 8).setValue('Cancelled');
      sheet.getRange(i + 1, 9).setValue(new Date());
      auditLog_(ss, 'CANCEL_RESERVATION', auth.email, id, '', '');
      return { status: 'success' };
    }
  }
  throw new Error('Reservation not found.');
}

// ─── MATERIAL LOCKS ──────────────────────────────────────────────────────────
// Locks a specific (material, rack) pair — NOT the whole rack, NOT the whole
// material. While active: EXIT and WASTE of that material FROM that rack are
// always blocked. TRANSFER is allowed, but if the lock specifies an
// AllowedDestinations list, the destination rack must be in that list (an empty
// list means "transfer anywhere is fine, just don't take it out of the warehouse").
// ADMIN only — see processMovement's routing.
// Sheet: MATERIAL_LOCKS  Columns (0-based):
//  A=0:ID B=1:MatId C=2:Category D=3:Name E=4:Rack F=5:AllowedDestinations(CSV)
//  G=6:Reason H=7:LockedBy I=8:LockedAt J=9:Status K=10:UnlockedBy L=11:UnlockedAt

// ─── PM DIRECTORY ─────────────────────────────────────────────────────────────
// Maps a PM's display name (typed into the PM field on ENTRY) to their email, so
// batch ENTRY saves can auto-group materials by PM and send each PM one email
// with just their own materials — instead of the old flow where a human had to
// type recipient emails by hand every time. Admin-managed from Settings.
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
  requireAuth_();   // this is an address book of real people — not public data
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

// data.op: 'add' | 'rename' | 'delete'. Matches by name, case-insensitive.
function managePmDirectory(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
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
    sheet.appendRow([sheetSafe_(name), sheetSafe_(email)]);
  } else if (data.op === 'rename') {
    var oldName = String(data.oldName || '').trim();
    if (!oldName) throw new Error('Current PM name is required.');
    var found = false;
    for (var j = 1; j < rows.length; j++) {
      if (String(rows[j][0] || '').trim().toUpperCase() === oldName.toUpperCase()) {
        sheet.getRange(j + 1, 1, 1, 2).setValues([[sheetSafe_(name || oldName), sheetSafe_(email || rows[j][1])]]);
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

// Groups the just-saved ENTRY rows by PM name and sends each PM ONE email
// listing only their own materials — never a combined email with other PMs'
// materials, and never more than one email per PM per batch. PMs without a
// matching entry in PM_DIRECTORY are silently skipped (no email address to
// send to) and reported back so the admin knows to add them.
function sendPmGroupedEmails_(rows, auth) {
  var byPm = {}; // upper(pmName) -> { displayName, items: [{name, qty, unit}] }
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

// Returns all ACTIVE locks as a flat array — sent to the frontend so it can show
// advisory 🔒 badges before the user even attempts the movement.
// Reads/writes go through CacheService (shared across all users, 5 min TTL) —
// this is read on every single getInitialData() call (every login/refresh) but
// only changes when an admin locks/unlocks something, so recomputing it from
// the sheet every time was pure wasted backend execution time.
function cacheGet_(key, ttlSec, builderFn) {
  var cache  = CacheService.getScriptCache();
  var cached = cache.get(key);
  if (cached !== null) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  var value = builderFn();
  try { cache.put(key, JSON.stringify(value), ttlSec); } catch (e) {} // e.g. >100KB — just skip caching
  return value;
}

function getMaterialLocks() {
  requireAuth_();   // lock reasons name materials, racks and staff — not public
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
      // normalizeString-form, matching getActiveLocksMap_'s enforcement key exactly —
      // the frontend compares against this with _normKey(), so they must agree.
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

// { 'MATID|||RACK': {allowedDest:[...], reason, lockedBy} } — used by the
// authoritative enforcement check in _addMovement / addMovementsBatch_.
function getActiveLocksMap_(ss) {
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

// Throws if this movement is blocked by an active material lock.
// srcKey/destKey must already be normalizeString()-form rack keys.
function enforceMaterialLock_(locksMap, mt, matId, srcKey, destKey) {
  if (!srcKey) return;
  var lock = locksMap[matId + '|||' + srcKey];
  if (!lock) return;
  // ADJUST is here for the same reason EXIT and WASTE are: a downward
  // adjustment takes units off a locked rack, and to whoever is counting on
  // that lock the effect is identical to an EXIT. An UPWARD adjust never
  // reaches this branch — it writes DEST_LOC and leaves SRC_LOC empty, and
  // this function returns early when there is no source — which is right:
  // finding MORE than the record said takes nothing away from anybody.
  if (mt === 'EXIT' || mt === 'WASTE' || mt === 'ADJUST') {
    throw new Error('LOCKED: This material is locked at ' + srcKey + ' — ' + lock.reason +
      ' (by ' + lock.lockedBy + '). Cannot ' + mt + '. Ask an admin to unlock it first.');
  }
  if (mt === 'TRANSFER' && lock.allowedDest.length) {
    if (!destKey || lock.allowedDest.indexOf(destKey) === -1) {
      throw new Error('LOCKED: Material at ' + srcKey + ' can only be transferred to: ' +
        lock.allowedDest.join(', ') + ' — ' + lock.reason);
    }
  }
}

// Create or update a lock for one (material, rack) pair. Upsert — locking an
// already-locked pair just updates the reason/destinations. ADMIN only.
function lockMaterial(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var cat  = normalizeString(data.category);
  var name = normalizeString(data.name);
  var rack = String(data.rack || '').trim().toUpperCase();
  var reason = String(data.reason || '').trim();
  if (!cat || !name) throw new Error('Category and name are required.');
  if (!rack) throw new Error('Rack is required.');
  if (!reason) throw new Error('A reason is required to lock a material.');

  var matId = getMaterialId(cat, name);
  // normalizeString-form throughout — must match getActiveLocksMap_'s enforcement
  // key and getMaterialLocks' frontend-facing form exactly, or a rack name with a
  // hyphen/comma would silently fail to match (the same bug class fixed earlier
  // for material names).
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
      sheet.getRange(i + 1, 6, 1, 4).setValues([[sheetSafe_(allowedDest.join(', ')), sheetSafe_(reason), auth.email, now]]);
      auditLog_(ss, 'UPDATE_LOCK', auth.email, data.name + ' @ ' + rack, '', reason);
      CacheService.getScriptCache().remove('materialLocksV1');
      return { status: 'success', lock: { id: String(rows[i][0]), matId: matId, category: data.category, name: data.name, rack: rack, allowedDest: allowedDest, reason: reason, lockedBy: auth.email, lockedAt: nowStr } };
    }
  }

  var id = 'LOCK-' + new Date().getTime();
  sheet.appendRow([id, sheetSafe_(matId), sheetSafe_(data.category), sheetSafe_(data.name), sheetSafe_(rack), sheetSafe_(allowedDest.join(', ')), sheetSafe_(reason), auth.email, now, 'Active', '', '']);
  auditLog_(ss, 'LOCK_MATERIAL', auth.email, data.name + ' @ ' + rack, '', reason);
  CacheService.getScriptCache().remove('materialLocksV1');
  return { status: 'success', lock: { id: id, matId: matId, category: data.category, name: data.name, rack: rack, allowedDest: allowedDest, reason: reason, lockedBy: auth.email, lockedAt: nowStr } };
}

function unlockMaterial(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MATERIAL_LOCKS');
  if (!sheet) throw new Error('No locks exist.');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id) && String(rows[i][9] || '').toUpperCase() === 'ACTIVE') {
      sheet.getRange(i + 1, 10, 1, 3).setValues([['Removed', auth.email, new Date()]]);
      auditLog_(ss, 'UNLOCK_MATERIAL', auth.email, String(rows[i][3]) + ' @ ' + String(rows[i][4]), '', '');
      CacheService.getScriptCache().remove('materialLocksV1');
      return { status: 'success' };
    }
  }
  throw new Error('Lock not found or already removed.');
}

// ─── DOCUMENT UPLOAD ─────────────────────────────────────────────────────────
function updateDocument_(ss, archive, data, auth) {
  var hasDocGroups = data.docGroups && data.docGroups.length > 0;
  var hasFiles     = data.files     && data.files.length     > 0;
  // keepLinks: the surviving subset of DOC_LINKS lines after the user removed
  // some in the "Manage Documents" UI. When the caller sends it (even an empty
  // array, i.e. "remove everything"), DOC_LINKS is REPLACED with keepLinks
  // plus any new uploads, instead of appended to whatever's currently in the
  // sheet. Legacy callers that never send it keep the old append-only behavior.
  var hasKeepLinks = Array.isArray(data.keepLinks);
  if (!hasDocGroups && !hasFiles && !hasKeepLinks) throw new Error('No documents provided.');

  // Get material name from the row for folder naming
  var matName = 'attachment';
  if (data.rowIdx) {
    try {
      var rv = archive.getRange(data.rowIdx, AC.CATEGORY + 1, 1, 2).getValues()[0];
      matName = String(rv[1] || 'attachment').trim() || 'attachment';
      // Same stale-row guard as modifyMovement — row numbers shift when
      // archiveOldMovements() reconciles the sheet.
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
  if (hasDocGroups) links = uploadDocGroups_(data.docGroups, matName);          // named, multi-photo groups → PDF
  else if (hasFiles) links = uploadFiles_(data.files, matName, 'row-' + data.rowIdx); // legacy single-file

  if (data.rowIdx && (links || hasKeepLinks)) {
    var finalText;
    if (hasKeepLinks) {
      finalText = data.keepLinks.concat(links ? [links] : []).join('\n');
    } else {
      var existing = archive.getRange(data.rowIdx, AC.DOC_LINKS + 1).getValue();
      finalText = existing ? existing + '\n' + links : links;
    }
    var docLinksCell = archive.getRange(data.rowIdx, AC.DOC_LINKS + 1);
    if (finalText) docLinksCell.setRichTextValue(richTextForDocLinks_(finalText));
    else docLinksCell.setValue(''); // all documents removed, nothing to replace with
  }
  return { status: 'success' };
}

// Legacy single-file upload (kept for backward compatibility with older clients / attach modal)
// ─── RACK PHOTOS ──────────────────────────────────────────────────────────────
// One reference photo per physical location (rack/bay/cart), independent of any
// specific material or movement — "this is what A1A looks like". Uploading a new
// photo for a rack replaces the previous one (single active photo, no history).
// Sheet: RACK_PHOTOS  Columns (0-based): A=Location(upper) B=PhotoURL C=UploadedBy D=UploadedAt
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

// Returns { LOCATION_UPPER: { url, uploadedBy, uploadedAt } } for every rack with a photo.
function getRackPhotos() {
  requireAuth_();   // maps every rack name to a photo of its contents
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

// Uploads/replaces the reference photo for one rack. WAREHOUSE + ADMIN only
// (VIEWER is already blocked before reaching here — see processMovement's role gate).
function uploadRackPhoto(data, auth) {
  // Writes a file into the owner's Drive — must never be reachable without a
  // verified, write-capable identity.
  auth = requireAuth_('WRITE');
  var loc = String((data && data.location) || '').trim().toUpperCase();
  if (!loc) throw new Error('Location is required.');
  if (!data.fileData) throw new Error('No photo provided.');

  var safe   = loc.replace(/[\/\\?%*:|"<>]/g, '_');
  var folder = getOrCreateFolder_(docsFolderName_() + '/RackPhotos/' + safe);
  var bytes  = Utilities.base64Decode(data.fileData);
  var blob   = Utilities.newBlob(bytes, data.fileMimeType || 'image/jpeg', safe + '.jpg');
  var file   = folder.createFile(blob);
  // No public sharing — served only through the private doGet proxy (see
  // _servePrivateFile). getId(), not getUrl(): the frontend now builds the
  // proxy link itself from the ID, and a getUrl() to a private file is a
  // dead link nobody but the owner can open anyway.
  var url = file.getId();

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureRackPhotosSheet_(ss);
  var rows  = sheet.getDataRange().getValues();
  var now   = new Date();
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toUpperCase() === loc) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[sheetSafe_(loc), url, auth.email, now]]);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([sheetSafe_(loc), url, auth.email, now]);

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

// Turns a DOC_LINKS string ("Name||https://...\nName2||https://...") into a
// RichTextValue where each URL substring is a REAL hyperlink, so the cell shows
// blue/clickable immediately — no need to double-click in and press Enter.
//
// Why that happened before: Sheets' automatic "turn this into a link" behavior
// only runs on the manual keyboard-input pipeline (a human types text and hits
// Enter). A script writing via setValue() bypasses that pipeline entirely and
// the cell stays plain text forever, no matter what it contains.
//
// getValues() still returns the exact same plain string afterward (rich text is
// a formatting layer on top of the value, not a different value) — so nothing
// that parses "Name||URL" elsewhere (buildDocMap, etc.) is affected.
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
    offset += line.length + 1; // +1 for the '\n' the split() consumed
  }
  return builder.build();
}

function uploadFiles_(files, materialName, po) {
  // NOTE: no try/catch — errors propagate to caller (_addMovement / updateDocument_)
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
    // No public sharing — see _servePrivateFile(). Store the file ID; the
    // frontend resolves it through the private proxy, not a raw Drive URL.
    links.push(file.getId());
  }
  return links.join('\n');
}

// ─── DUPLICATE MOVEMENT DETECTION ────────────────────────────────────────────
// Scans the last MAX_ROWS rows of the archive for an identical movement saved
// within WINDOW_MS milliseconds by the same user.
// Returns { rowIdx, minutesAgo } if a duplicate is found, or null if clean.
function checkDuplicateMovement_(archive, mt, cat, name, qty, userEmail) {
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
    var rowCat   = normalizeString(row[AC.CATEGORY]);   // normalize stored value to match
    var rowName  = normalizeString(row[AC.NAME]);       // (cat/name args are already normalized)
    var rowQty   = Number(row[AC.QTY]        || 0);
    var rowEmail = String(row[AC.USER_EMAIL] || '').toLowerCase().trim();

    if (rowMt    === mt.toUpperCase()        &&
        rowCat   === cat                     &&
        rowName  === name                    &&
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

// ─── ATTACH AN EXISTING DRIVE FILE ───────────────────────────────────────────
// Copies a file the user already has in Drive into the app's docs folder, so it
// can be attached without downloading and re-uploading it.
//
// SECURITY — the reason this is not a two-line DriveApp.getFileById().makeCopy():
// the web app runs as USER_DEPLOYING, so the server's Drive access is the
// OWNER'S Drive, not the caller's. Without a check, any signed-in warehouse user
// could paste any file ID the owner's account happens to be able to read and
// have the server copy it somewhere they can then read it back through
// getPrivateFileData — turning "attach from Drive" into a way to pull private
// files out of the owner's Drive. So we verify the CALLER can genuinely reach
// the file before copying it, and refuse otherwise.
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

  // Refused here rather than after copying: a file this big can be stored but
  // never opened from inside the app, so attaching it would hand the user
  // something unreadable and only reveal that when they clicked it.
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

// True when `email` can read the file in their own right — as its owner, via a
// permission granted to them, to their whole domain, or because it is shared
// with anyone who has the link. Read through the Drive REST API because
// DriveApp exposes no "can this OTHER person read it" question; permissions
// are readable here because the script runs as the file's owner/editor.
// Fails CLOSED: any error means "not verified", so a copy never happens on a
// permissions call we could not complete.
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

// ─── MULTI-PHOTO NAMED DOCUMENT GROUPS ───────────────────────────────────────
// docGroups = [ { name: "Invoice", photos: [ {fileData, fileMimeType} ] }, … ]
// Returns newline-separated "DocName||DriveURL" strings for storage in DOC_LINKS.
//
// Single-photo groups → uploaded as JPEG (fast, no PDF overhead).
// Multi-photo groups  → stitched into a Google Doc → exported as PDF → temp Doc trashed.
//
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

    // Files the user picked out of Drive instead of uploading. Copied into the
    // app's own folder rather than linked in place: a link would break the
    // moment the original is moved, renamed or unshared, and the whole
    // private-file pipeline (getPrivateFileData / the folder boundary check)
    // only serves what lives under the app's folder.
    for (var d = 0; d < driveIds.length; d++) {
      var copiedId = importDriveFileIntoFolder_(
        driveIds[d], safeName + (driveIds.length > 1 ? ' ' + (d + 1) : ''), folder);
      if (copiedId) links.push(rawName + '||' + copiedId);
    }
    if (!photos.length) continue;

    // Only real images can be stitched into the multi-page PDF — that path
    // inserts each one into a Google Doc as an image. A PDF or a video in the
    // same group used to be handed to it too, which threw "Invalid image data"
    // and lost the WHOLE group, documents and photos alike, leaving the
    // movement saved with no attachments and only a warning in the toast.
    // Non-images are stored as their own files instead of poisoning the batch.
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
      // Single photo → store as image directly (faster)
      var p    = images[0];
      var bytes = Utilities.base64Decode(p.fileData);
      var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg', safeName);
      var imgFile = folder.createFile(blob);
      // No public sharing — see _servePrivateFile().
      url = imgFile.getId();
    } else {
      // Multiple photos → create Google Doc with one image per page → export PDF
      url = photosToDocPdf_(images, safeName, folder);
    }

    if (url) links.push(rawName + '||' + url);
  }
  return links.join('\n');
}

// Creates a Google Doc with one photo per page, exports it as PDF, trashes the Doc.
// Returns the Drive URL of the saved PDF.
function photosToDocPdf_(photos, docName, targetFolder) {
  // Create a temporary Google Doc
  var tempTitle = 'WMS_TMP_' + new Date().getTime();
  var doc  = DocumentApp.create(tempTitle);
  var body = doc.getBody();

  // Set margins to 0 so the image can fill the full physical page.
  // Google Docs may enforce a small minimum (~1pt) but the PDF export
  // honours these near-zero values — unlike the old 9pt setting which
  // was silently overridden by the Docs renderer, causing images to be
  // clipped to the default 1-inch text area and appear at only ~75-80 %.
  body.setMarginTop(0);
  body.setMarginBottom(0);
  body.setMarginLeft(0);
  body.setMarginRight(0);

  // Full US Letter page in points (72 pt = 1 inch).
  // We scale against the whole page, not a text-area sub-region.
  var PAGE_W = 612;
  var PAGE_H = 792;

  // Remove the default blank paragraph so images start at the very top.
  body.clear();

  for (var i = 0; i < photos.length; i++) {
    if (i > 0) body.appendPageBreak();

    var p     = photos[i];
    var bytes = Utilities.base64Decode(p.fileData);
    var blob  = Utilities.newBlob(bytes, p.fileMimeType || 'image/jpeg');
    var img   = body.appendImage(blob);

    // getWidth/getHeight return the auto-scaled display dimensions (in points).
    var origW = img.getWidth();
    var origH = img.getHeight();

    // Scale image to fill the full page while preserving aspect ratio.
    var scale = Math.min(PAGE_W / origW, PAGE_H / origH);
    img.setWidth(Math.round(origW * scale));
    img.setHeight(Math.round(origH * scale));

    // Remove paragraph spacing so the image sits flush with the page edge.
    // (Default Google Docs paragraph has 10-12 pt spacing before/after which
    //  creates a white gap at the top and bottom of each page.)
    try {
      var para = img.getParent().asParagraph();
      para.setSpacingBefore(0);
      para.setSpacingAfter(0);
      para.setLineSpacing(1);
      para.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    } catch(e) { /* no-op if paragraph cast fails */ }
  }

  doc.saveAndClose();

  // Export as PDF blob
  var docFile = DriveApp.getFileById(doc.getId());
  var pdfBlob = docFile.getAs('application/pdf');
  pdfBlob.setName(docName + '.pdf');

  // Save PDF to target folder
  var pdfFile = targetFolder.createFile(pdfBlob);
  // No public sharing — see _servePrivateFile().

  // Trash the temporary Doc
  docFile.setTrashed(true);

  return pdfFile.getId();
}

// Resolves "A/B/C" to a Drive folder, creating any missing level.
//
// Written for the drive.file scope, which grants access ONLY to files and
// folders this app itself created. Two consequences drive the shape of this:
//
//   • DriveApp.getRootFolder() is forbidden — My Drive as a whole is not ours
//     to read. (This is exactly what broke uploads on the first drive.file
//     test run: every upload path lands here, and the pre-cache branch called
//     it.) The top level is created with DriveApp.createFolder(), which lands
//     in My Drive and is app-owned, so we may keep using it afterwards.
//   • Below the top level we can browse normally, because every one of those
//     folders was created by us, so getFoldersByName() on a parent we already
//     hold is allowed.
//
// Each level's ID is cached in Script Properties, so steady-state operation is
// getFolderById() only — no traversal at all.
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
      try { next = DriveApp.getFolderById(cachedId); } catch (e) { next = null; /* stale/deleted */ }
    }

    if (!next) {
      if (current) {
        // Inside our own tree: safe to look before creating, so a folder that
        // exists but wasn't cached (e.g. cache cleared) is reused, not duplicated.
        var found = current.getFoldersByName(parts[i]);
        next = found.hasNext() ? found.next() : current.createFolder(parts[i]);
      } else {
        // Top level. Under drive.file we cannot search My Drive to find an
        // existing folder of this name, so a cleared cache means a second
        // folder gets created rather than the original being found. Caching
        // every level (above) is what keeps that from happening in practice.
        next = DriveApp.createFolder(parts[i]);
        // Nace ya dentro de la carpeta maestra, así que una instalación nueva
        // nunca deja nada suelto en la raíz.
        ensureUnderMaster_(next);
      }
      try { props.setProperty(cacheKey, next.getId()); } catch (e) {}
    }
    current = next;
  }
  return current;
}

// ─── ADMIN ACTIONS ───────────────────────────────────────────────────────────
function adminAction_(ss, data) {
  var action = data.action;
  if (action === 'updateTruck')   return updateTruck_(ss, data);
  if (action === 'addUser')       return addUser_(ss, data);
  if (action === 'removeUser')    return removeUser_(ss, data);
  if (action === 'reconcile')     return runReconciliation_(ss);
  if (action === 'updateMinStock')return updateMinStock_(ss, data);
  throw new Error('Unknown admin action.');
}

function updateTruck_(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][8] || '') === data.truckName) {
      cfg.getRange(i + 1, 10).setValue(sheetSafe_(data.assignedPerson || ''));
      cfg.getRange(i + 1, 11).setValue(sheetSafe_(data.status || 'ACTIVE'));
      return { status: 'success' };
    }
  }
  cfg.appendRow(['','','','','','','','',sheetSafe_(data.truckName), sheetSafe_(data.assignedPerson || ''), sheetSafe_(data.status || 'ACTIVE'),'','']);
  return { status: 'success', message: 'Truck added.' };
}

function addUser_(ss, data) {
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  cfg.appendRow(['','','','','',sheetSafe_(data.email), sheetSafe_(data.role),'','','','','','']);
  return { status: 'success' };
}

function removeUser_(ss, data) {
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

function updateMinStock_(ss, data) {
  var cfg    = ss.getSheetByName(SHEETS.CONFIG);
  var values = cfg.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][11] || '').toUpperCase() === data.category.toUpperCase()) {
      cfg.getRange(i + 1, 13).setValue(Number(data.qty) || 0);
      return { status: 'success' };
    }
  }
  cfg.appendRow(['','','','','','','','','','','',sheetSafe_(data.category), Number(data.qty) || 0]);
  return { status: 'success' };
}

// Bulk version of updateMinStock_ — writes every changed min-stock threshold in
// ONE round trip (Monitor modal saves all edited rows at once, not one call per row).
// data.updates = [{ name, qty }, ...] — "name" matches CONFIG col L exactly like
// the legacy per-row updateMinStock_ (that column stores material NAMEs, despite
// the older function's parameter being called "category").
function updateMinStockBulk(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('Config sheet not found.');
  var updates = Array.isArray(data.updates) ? data.updates : [];
  if (!updates.length) return { status: 'success', updated: 0 };

  var rows = cfg.getDataRange().getValues();
  var rowByName = {};
  for (var i = 1; i < rows.length; i++) {
    var nm = String(rows[i][11] || '').toUpperCase().trim();
    if (nm) rowByName[nm] = i + 1; // 1-based sheet row
  }

  var appended = [];
  updates.forEach(function(u){
    var nm  = String(u.name || '').toUpperCase().trim();
    var qty = Number(u.qty) || 0;
    if (!nm) return;
    if (rowByName[nm] !== undefined) {
      cfg.getRange(rowByName[nm], 13).setValue(qty);
    } else {
      appended.push(['','','','','','','','','','','', sheetSafe_(nm), qty]);
    }
  });
  if (appended.length) {
    cfg.getRange(cfg.getLastRow() + 1, 1, appended.length, 13).setValues(appended);
  }
  auditLog_(ss, 'UPDATE_MIN_STOCK_BULK', auth.email, updates.length + ' material(s)', '', '');
  return { status: 'success', updated: updates.length };
}

// Same find-or-append shape as updateMinStockBulk just above, for the cost
// columns (O/P/Q — Cost Category, Cost Material, Avg Cost). Deliberately its
// own function rather than a shared one: the KEY is different. Min Stock is
// keyed by material name alone; this is keyed by category+name (matId),
// because two categories can legitimately share a name at different price
// points, and conflating them is exactly the kind of thing nobody would
// notice until the dollar figures were already wrong.
//
// Called from inside addMovementsBatch_, after the archive write is verified —
// never before — so a cost blend can never be recorded for a movement that
// did not actually save. `touched` names which matIds this batch changed;
// `avgCostMap` (already mutated in memory by the caller) holds the values.
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
    if (rCat || rNm) rowByMatId[getMaterialId(rCat, rNm)] = i + 1;   // 1-based sheet row
  }

  var appended = [];
  matIds.forEach(function (mid) {
    var c = avgCostMap[mid];
    if (!c) return;
    if (rowByMatId[mid] !== undefined) {
      cfg.getRange(rowByMatId[mid], 17).setValue(c.avg);   // column Q — Avg Cost only; category/name already match
    } else {
      // 14 blank cells (columns A–N) then Cost Category / Cost Material / Avg
      // Cost — built with Array(14), not typed out by hand, because a
      // hand-counted run of empty strings is exactly the kind of thing that
      // is off by one and silent about it.
      appended.push(new Array(14).fill('').concat([sheetSafe_(c.category), sheetSafe_(c.name), c.avg]));
    }
  });
  if (appended.length) {
    cfg.getRange(cfg.getLastRow() + 1, 1, appended.length, 17).setValues(appended);
  }
}

// ─── BULK IMPORT (CSV) ────────────────────────────────────────────────────────
// Lets an admin migrate an existing inventory (from Excel, a competitor's
// export, a paper count) into the app in one shot instead of typing every line
// by hand — the single biggest thing that was blocking a new customer from
// actually starting to use this on day one.
//
// Deliberately CSV-only for now, not .xlsx. Reading a real Excel file needs
// Apps Script's Advanced Drive Service, which has to be turned on by hand in
// the editor (Services → + → Google Drive API) and can't be verified from
// here. CSV needs nothing beyond Utilities.parseCsv(), which is built in and
// always available — every spreadsheet tool (Excel, Sheets, Numbers) exports
// to CSV in two clicks, so this isn't a real limitation for getting started.
//
// Two-step flow, never a blind commit: parseImportFile() only reads and
// validates, returning a preview for the admin to review row by row.
// commitImport() is a SEPARATE call that only runs after the frontend re-sends
// the rows the admin actually saw — and it writes through addMovementsBatch_,
// the exact same locked, stock-validated, write-verified engine a normal ENTRY
// goes through, so an imported row can never be less trustworthy than one
// typed in by hand.
// Excel → CSV, via Drive's own converter.
//
// Apps Script cannot read .xlsx bytes directly — there is no XLSX parser in the
// runtime, and hand-rolling one (it's a ZIP of XML parts) is a lot of code to
// maintain for something Drive already does correctly. So: upload the file
// asking Drive to convert it to a Google Sheet, export that Sheet as CSV, and
// bin the temporary file.
//
// Deliberately NOT SpreadsheetApp.openById() on the converted file, which would
// be the obvious way to read it: this app declares spreadsheets.currentonly,
// which grants access to its OWN spreadsheet and nothing else, so opening the
// temp file would fail on scope. Exporting through the Drive API needs only the
// drive scope the app already has — no new permission on the consent screen.
//
// Returns EVERY tab: [{name, text}]. The first version of this exported
// text/csv, which silently gives back only the first sheet — so a workbook
// with the inventory on tab 3 imported as whatever happened to be on tab 1,
// with nothing to tell the user why. Exporting format=zip yields one CSV per
// tab, which Utilities.unzip can open, so the caller can pick the right one.
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

    // One CSV per tab, zipped. Each entry is named "<workbook> - <tab>.csv".
    var zip = UrlFetchApp.fetch(
      'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(tempId) + '/export?format=zip', auth);
    if (zip.getResponseCode() === 200) {
      try {
        var parts = Utilities.unzip(zip.getBlob().setContentType('application/zip'));
        var sheets = parts.filter(function (b) { return /\.csv$/i.test(b.getName() || ''); })
          .map(function (b) {
            var n = String(b.getName() || '').replace(/\.csv$/i, '');
            var dash = n.indexOf(' - ');            // strip the workbook-name prefix
            return { name: dash !== -1 ? n.substring(dash + 3) : n, text: b.getDataAsString() };
          });
        if (sheets.length) return sheets;
      } catch (e) {
        // Not a zip after all (a single-tab workbook can come back as plain
        // CSV) — fall through to the single-sheet path rather than failing.
      }
    }

    var exp = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(tempId) + '/export?mimeType=text/csv', auth);
    if (exp.getResponseCode() !== 200) {
      throw new Error('Could not read the contents of that Excel file.');
    }
    return [{ name: 'Sheet1', text: exp.getContentText() }];
  } finally {
    // Always cleaned up, including when the export above threw — otherwise a
    // failed import would quietly litter the owner's Drive with temp copies.
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e) {}
  }
}

// Picks which tab to import from a multi-tab workbook: the one the caller asked
// for, else the first whose header row actually carries the required columns.
// Without that second rule a workbook whose first tab is a cover sheet or a
// summary would import as "0 valid rows" and look broken.
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

// Ceiling for anything the app has to serve back to a browser. Everything the
// preview shows travels base64-encoded inside one google.script.run reply, and
// Apps Script will not build a blob past its own limit — so a file bigger than
// this can be stored, but never opened from inside the app. Attaching one would
// be handing the user something they cannot read, so the attach paths refuse it
// up front instead. Kept in step with MAX_ATTACH_BYTES in Index.html.
var MAX_ATTACH_BYTES = 25 * 1024 * 1024;   // 25 MB

var IMPORT_REQUIRED_HEADERS = ['category', 'name', 'qty'];
var IMPORT_ALL_HEADERS      = ['category', 'name', 'qty', 'unit', 'location', 'project', 'supplier', 'po', 'comments'];

function parseImportFile(data) {
  requireAuth_('ADMIN');
  var fileName = String(data.fileName || '');
  var isExcel  = /\.xlsx?$/i.test(fileName);
  if (!isExcel && !/\.csv$/i.test(fileName)) {
    throw new Error('Please upload a .csv or .xlsx file.');
  }

  var text;
  var sheetNames = [];   // tabs found in an Excel workbook (empty for a .csv)
  var usedSheet  = '';
  if (isExcel) {
    // Excel files are converted to CSV by Drive and then run through the exact
    // same parser below — one code path for reading rows, so an .xlsx import
    // can't drift away from the .csv one that is already well tested.
    var sheets = excelToSheets_(data.fileData, fileName);
    sheetNames = sheets.map(function (s) { return s.name; });
    var chosen = chooseImportSheet_(sheets, String(data.sheetName || '').trim());
    usedSheet  = chosen.name;
    text       = chosen.text;
  } else {
    var bytes = Utilities.base64Decode(data.fileData);
    text = Utilities.newBlob(bytes, 'text/csv').getDataAsString();
  }

  // Strip a UTF-8 byte-order-mark. Excel's "CSV UTF-8 (Comma delimited)" export
  // adds one at the very start of the file; left in place it silently glues
  // itself onto the first header cell ("Category" becomes "﻿Category"),
  // which then fails to match anything below — a classic, hard-to-spot Apps
  // Script CSV gotcha.
  text = text.replace(/^﻿/, '');

  // Raw line count, independent of how parseCsv interprets the content —
  // shown in the preview so "why did only 1 row show up" is answerable at a
  // glance: either the file itself only has 2 lines (nothing to fix here,
  // the edited version wasn't actually the one uploaded), or it has more and
  // something below failed to recognize them.
  var rawLineCount = text.split(/\r\n|\r|\n/).filter(function (l) { return l.trim() !== ''; }).length;

  var rows;
  try {
    rows = Utilities.parseCsv(text);
  } catch (e) {
    throw new Error('Could not read this as a CSV file: ' + e.message);
  }

  // Excel's "CSV (Comma delimited)" export actually follows the OS/Excel
  // locale's list separator — which for Spanish and several other locales is a
  // SEMICOLON, not a comma, even though the menu item is labeled "comma
  // delimited". When that happens, no line has a real comma in it, so the
  // comma-based parse above collapses every row into a single cell. A
  // one-column header containing semicolons is the unambiguous signature of
  // that — re-parse with a semicolon delimiter instead.
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
      // Naming the other tabs matters: otherwise a workbook whose data sits on
      // a later tab just reads as "your file is wrong", with no hint that the
      // right data is in the same file one tab over.
      (sheetNames.length > 1
        ? ' This workbook also has: ' + sheetNames.filter(function (n) { return n !== usedSheet; }).join(', ') +
          ' — pick the right one from the Sheet list on this screen.'
        : ' Download the template from this screen to see the exact format expected.'));
  }

  var parsed = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r || r.every(function (c) { return String(c || '').trim() === ''; })) continue;  // skip blank rows

    var item = {
      rowNum:   i + 1,
      category: String(r[col.category] || '').trim(),
      name:     String(r[col.name]     || '').trim(),
      qty:      Number(r[col.qty]),
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

  var validCount = parsed.filter(function (p) { return p.valid; }).length;
  return {
    status:       'success',
    totalRows:    parsed.length,
    validRows:    validCount,
    invalidRows:  parsed.length - validCount,
    rawLineCount: rawLineCount,
    sheetNames:   sheetNames,            // tabs found (Excel only) — lets the UI offer a picker
    usedSheet:    usedSheet,
    rows:         parsed.slice(0, 500)   // a preview, not a data dump
  };
}

// Commits a previously-previewed set of rows as real ENTRY movements. Only
// ever called with rows the admin has already seen in the preview table.
function commitImport(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var rows = Array.isArray(data.rows) ? data.rows : [];
  if (!rows.length) throw new Error('No rows to import.');

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
      comments:    ('Imported from file' + (r.comments ? ' — ' + r.comments : '')).trim(),
      // Blank, not auth.email — a bulk import says nothing about who received
      // the goods. The importing user is recorded in USER_EMAIL.
      responsible: '',
      // A bulk import legitimately contains similar-looking rows (same
      // category, same rack, different SKUs entered close together); the
      // duplicate guard exists to catch an accidental double-click, not this.
      forceSubmit: true
    };
  });

  var res = addMovementsBatch_(ss, archive, movements, auth);
  auditLog_(ss, 'BULK_IMPORT', auth.email, rows.length + ' row(s) imported', '', '');
  return { status: 'success', rowCount: res.rowCount };
}

function runReconciliation_(ss) {
  refreshDerivedSheets_(ss);
  return { status: 'success', message: 'Reconciliation complete. LIVE_STOCK and SITE_STOCK refreshed.' };
}

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
function auditLog_(ss, action, user, details, oldVal, newVal) {
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return;
  sheet.appendRow([new Date(), action, user, sheetSafe_(details), sheetSafe_(oldVal), sheetSafe_(newVal)]);
}

// ─── WHAT THE SYSTEM DID ON ITS OWN ──────────────────────────────────────────
// The backup at 2am and the archive job at 3am already ran and already wrote to
// AUDIT_LOG — but nothing ever showed it, so from the app they were invisible.
// Silent background work is indistinguishable from background work that stopped
// happening, and "is this thing actually backing up?" is the first question
// anyone asks about a spreadsheet holding their inventory.
//
// Read off AUDIT_LOG rather than a new log of its own: those rows are already
// written, already trimmed with the rest of the sheet, and already carry the
// timestamp. Only the automatic actors count — anything a person did is their
// own action and belongs in the audit trail, not in a "the system is working"
// notice.
var SYSTEM_ACTORS = { 'system': 1, 'system@scheduled-trigger': 1 };

var SYSTEM_EVENT_LABELS = {
  BACKUP_CREATED:    'Backup created',
  ARCHIVE_RECONCILE: 'Old movements archived',
  STOCK_REBUILD:     'Stock totals rebuilt',
  AUTO_REPAIR_MATID: 'Movements re-linked to the right material'
};

// Plain English for the notification card and the System tab.
//
// "1 row(s) had a stale MatID, corrected automatically" told an owner nothing:
// not which row, not what it means, and — the part that actually confused
// Jose — not WHY it happened. It is almost always a consequence of somebody
// editing a movement: the material's ID is computed from its category and
// name, so renaming either one leaves the stored ID pointing at the old
// identity, and the next stock recalculation quietly re-links it. Nothing is
// wrong; the app is finishing a job the editor started. Saying so is the
// difference between a reassuring note and an alarming one.
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

// limit is how many undismissed notices the app can hold at once. Anything
// older than that genuinely does fall away — see the note in
// _announceSystemActivity on the client. Kept generous rather than tight: a
// notice that disappears before it is read is the bug this whole feature was
// meant to fix.
// WHICH CARDS THIS PERSON HAS ALREADY DISMISSED — SERVER-SIDE, ON PURPOSE.
//
// It used to live in the browser's localStorage, and every backup notice since
// August came back on every load however many times the ✕ had been pressed.
// The app is served inside Apps Script's sandboxed googleusercontent.com frame,
// and storage there is not something to build on: it is partitioned, and the
// frame's origin is not the customer's to rely on. A dismissal is a fact about
// a PERSON, not about a browser — press ✕ at the desk and it should also be
// gone on the phone — so it belongs on the server, where the rest of what the
// app knows about that person already lives.
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

// Capped so one property can never outgrow the 9KB a Script Property holds.
// The oldest dismissals are the ones to drop: their events have long since
// fallen off the end of the 30 the server returns, so they can never come back
// anyway.
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

// Renamed in v11.27 — it used to be `getSystemActivity`, with no trailing
// underscore, which made it an internet-reachable endpoint: any signed-in
// Google account holding the app's URL could call it and read the audit sheet
// — who saved what, and when — with no session token and no role check. It has
// exactly one caller, getInitialData, which has already authenticated by the
// time it gets here. So the fix is not to add a check: it is to stop being a
// door at all. The trailing `_` is the part Apps Script itself enforces, and
// it is the rule the header comment at the top of this file already states.
//
// This one stood open for months because nothing counted the doors.
// tools/test-endpoint-auth.js counts them now.
function getSystemActivity_(limit, forEmail) {
  var dismissed = sysDismissedSet_(forEmail);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];

  // Only the tail is read. The audit sheet grows without bound and a full
  // getDataRange() here would be paid on every single app load. The tail has to
  // be long enough that ordinary traffic — every movement saved, every config
  // change — cannot push the system's own entries out of range before anyone
  // has seen them.
  var span  = Math.min(1500, last - 1);
  var rows  = sheet.getRange(last - span + 1, 1, span, 6).getValues();
  var out   = [];
  // Dismissed events are RETURNED, flagged — not dropped. They used to be
  // filtered out right here, which quietly conflated two different things:
  // the corner deck (a notice you dismiss once you have read it) and
  // Settings → System's "what the system did on its own" (a maintenance
  // record that has to keep saying a backup ran). Both read this one list,
  // so pressing ✕ on a backup notice also erased it from the history —
  // which is why Jose's install showed "Nothing automatic has run yet"
  // above a "Last backup: today at 2:13 AM" line that was perfectly true.
  // It started when dismissals moved from localStorage (where they never
  // stuck) to the server (where they do), which is exactly the v9.65→v9.70
  // window he remembers the list disappearing in.
  //
  // The limit still counts only UNDISMISSED events, so the deck gets its
  // full budget of live cards rather than spending it on ones dismissed
  // months ago — that part of the original reasoning was right. A separate
  // hard cap bounds the history that rides along with them.
  var live = 0;
  var maxLive = limit || 8;
  var MAX_TOTAL = 60;
  for (var i = rows.length - 1; i >= 0 && live < maxLive && out.length < MAX_TOTAL; i--) {
    var actor = String(rows[i][2] || '').toLowerCase().trim();
    if (!SYSTEM_ACTORS[actor]) continue;
    var action = String(rows[i][1] || '');
    var atIso  = rows[i][0] ? new Date(rows[i][0]).toISOString() : '';
    // Same id the browser builds: timestamp + action.
    var isDismissed = !!dismissed[atIso + '|' + action];
    if (!isDismissed) live++;
    // Anything the app can take you to, it should. A backup is a file in
    // Drive; a re-link happened on numbered rows of the archive. Both are
    // reachable, and "corrected automatically" is only reassuring if you can
    // go and look.
    var ref = null;
    if (action === 'BACKUP_CREATED' && String(rows[i][5] || '').trim()) {
      ref = { kind: 'drive', id: String(rows[i][5]).trim(), label: 'Open the backup in Drive' };
    } else if (action === 'AUTO_REPAIR_MATID') {
      var m = String(rows[i][4] || '').match(/rows ([\d,]+)/);
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

// ─── ERROR LOG ────────────────────────────────────────────────────────────────
// Structured error log: one row per error, backend or frontend, with a stable
// severity, the action being attempted, and a correlation ID so a user can
// report "error XXXXXX" and an admin can find that exact row instantly.
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

// Known, user-facing validation messages are expected business-rule rejections,
// not bugs — classified WARN so they don't drown out real ERROR entries in the
// admin viewer, while still being captured for pattern-spotting (e.g. one rack
// repeatedly hitting INSUFFICIENT stock might mean a data problem, not user error).
var _KNOWN_VALIDATION_PREFIXES = [
  'INSUFFICIENT', 'LOCKED', 'DUPLICATE_MOVEMENT', 'Not authenticated',
  'Access denied', 'Read-only access', 'Admin only', 'Archive sheet not found',
  'Unknown action', 'Category and Name are required', 'Quantity must be',
  'A reason is required', 'Rack is required', 'Cannot reserve',
  'Reservation not found', 'Lock not found', 'WASTE movements require'
];
// Messages that are the app CORRECTLY refusing something, rather than the app
// breaking. Matched anywhere in the text, not just as a prefix, because many of
// them lead with the offending value — 'projects "KUNA 104/106" already
// exists.' is the clearest case, and it was being filed as a system ERROR.
//
// That mattered a lot more once ERROR started emailing the admin: registering a
// batch of already-known projects filed ~60 ERROR rows and set off the alert
// mail, for an app doing exactly what it should. Alerts that cry wolf get
// ignored, which costs the real ones their value.
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

// Strips session tokens / anything sensitive before a payload gets written to the log.
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

// Never throws — logging failures must not mask the original error.
function logError_(ss, severity, source, action, userEmail, message, context, requestId) {
  try {
    var sheet = ensureErrorLogSheet_(ss);
    sheet.appendRow([
      new Date(), severity, sheetSafe_(userEmail || ''), source, sheetSafe_(action || ''),
      sheetSafe_(String(message || '').substring(0, 500)), sheetSafe_(sanitizeErrorContext_(context)), requestId || ''
    ]);
  } catch (e) {
    Logger.log('logError_ failed: ' + e.message);
  }
  // Separate try: a failure to notify must never swallow the log write above,
  // and vice versa.
  try {
    if (String(severity || '').toUpperCase() === 'ERROR') {
      notifyAdminOfError_(action, userEmail, message, requestId);
    }
  } catch (e2) {
    Logger.log('notifyAdminOfError_ failed: ' + e2.message);
  }
}

// Emails the admin when something breaks badly enough to be logged as ERROR.
//
// ERROR_LOG has always recorded these, but it is a sheet nobody opens until
// they already suspect a problem — so a nightly backup that silently stopped
// working, or stock totals that quietly failed to rebuild, could go unnoticed
// for weeks. The whole point of this product is that the numbers can be
// trusted, so the admin has to be told when they might not be.
//
// Throttled hard, by design: an error that fires on every save would otherwise
// mail the admin hundreds of times in an afternoon and get the alerts filtered
// out as noise — which is worse than not sending them. One message per distinct
// action per hour, and a daily ceiling so a storm can never turn into a mailbox
// full of near-identical warnings.
var ERROR_MAIL_PER_ACTION_SEC = 3600;
var ERROR_MAIL_DAILY_CAP      = 12;

function notifyAdminOfError_(action, userEmail, message, requestId) {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('ERROR_ALERTS_ENABLED') === 'false') return;   // opt-out

  var to = adminNotifyEmail_();
  if (!to) return;

  var cache = CacheService.getScriptCache();
  var actKey = 'errmail_' + Utilities.base64EncodeWebSafe(String(action || 'general')).substring(0, 60);
  if (cache.get(actKey)) return;                       // already mailed for this action recently

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

// ADMIN only. Returns the most recent error log entries, newest first.
// How long an entry is worth keeping. A log that never forgets stops answering
// the only question anyone asks of it — "what is wrong NOW" — because the
// answer is buried under everything that was ever wrong and has since been
// fixed. Thirty days is long enough to cover "it did this last month too" and
// short enough that the list stays readable.
var ERROR_LOG_KEEP_DAYS = 30;

// Pruning happens when an admin OPENS the log, not on every write. The write
// path runs inside real work (a save, a backup) and must stay cheap; the read
// path runs once, by hand, when somebody is already waiting for a table to
// appear. Same result, none of the cost where it would be felt.
function pruneErrorLog_(sheet, days) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var keepDays = days || ERROR_LOG_KEEP_DAYS;
  var cutoff = new Date().getTime() - keepDays * 86400000;
  var stamps = sheet.getRange(2, 1, last - 1, 1).getValues();

  // Rows are appended in time order, so everything to prune is at the TOP and
  // one deleteRows() call removes it. Counting instead of filtering is what
  // keeps this from being 300 separate deletes on a big log.
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

// ADMIN only. Empties the log — either the whole thing, or just the WARN rows.
//
// Clearing WARN alone is the one that gets used: a WARN is the app correctly
// refusing something (a quantity that would go negative, a duplicate name), so
// after a busy week the real ERRORs are a handful of rows hidden among hundreds
// of those. Removing the noise is how the signal becomes readable again.
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
    // Bottom-up: deleting a row shifts everything below it, so walking
    // downwards would make every index after the first deletion wrong.
    for (var i = sev.length - 1; i >= 0; i--) {
      if (String(sev[i][0] || '').toUpperCase() === 'WARN') { sheet.deleteRows(i + 2, 1); removed++; }
    }
  } else {
    removed = last - 1;
    sheet.deleteRows(2, removed);
  }

  // Recorded, because emptying the record of what went wrong is something a
  // second admin may need to know happened — but in the AUDIT_LOG, which is
  // where administrative actions belong. v9.64 wrote it into the ERROR_LOG
  // itself, so clearing the log left a fresh row in the log saying the log had
  // been cleared. Nothing broke, but it read like a new problem appearing at
  // the exact moment you were tidying up, which is the opposite of the point.
  auditLog_(ss, 'CLEAR_ERROR_LOG', auth.email,
    'Error log cleared (' + mode + ')', String(removed) + ' entries', '');

  return { status: 'success', removed: removed };
}

function getErrorLog(auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
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

// Frontend uncaught-error reporter. Any signed-in user (not just ADMIN) can log
// a client-side crash so admins see it — routed through the same auth gate as
// every other action, so NO_SESSION/DENIED/VIEWER users are still blocked upstream.
function logClientError(data, auth) {
  auth = requireAuth_();   // otherwise anyone could flood ERROR_LOG with junk rows
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var requestId = newRequestId_();
  logError_(ss, 'ERROR', 'frontend', data.action || '', auth.email,
    data.message, { stack: data.stack, url: data.url }, requestId);
  return { status: 'success', requestId: requestId };
}

// Floating "Report a Problem" button. Standalone entry point (not routed
// through processMovement) so a VIEWER can use it too — processMovement()
// hard-blocks VIEWER before dispatch, but a read-only user is exactly the
// kind of person who'd spot a display bug worth reporting.
function reportIssue(data) {
  var auth = setVerifiedAuth_(getUserRole(data && data._sessionToken));
  if (auth.role === 'NO_SESSION' || auth.role === 'DENIED') {
    throw new Error('Not authenticated. Please sign in and use the app from its own page.');
  }
  // Tighter than the rest: every report writes to Drive and sends mail, so a
  // flood here costs far more per call than a normal RPC.
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
      var file  = folder.createFile(blob); // private by default — no public sharing
      driveLinks.push(file.getId());
      attachments.push(blob);
    }
  }

  var cfg     = loadConfig();
  var cs      = companySettings_();
  // The installation's admin gets it, and so does whoever supports the product
  // — set SUPPORT_EMAIL to route reports somewhere other than the admin's inbox.
  var toEmail = cfg.adminEmail || Session.getEffectiveUser().getEmail();
  var support = String(PropertiesService.getScriptProperties().getProperty('SUPPORT_EMAIL') || '').trim();
  if (support && support.toLowerCase() !== String(toEmail).toLowerCase()) toEmail += ',' + support;

  // What a person actually needs to reproduce a problem. The old body carried
  // a link to the sandboxed frame's own address
  // (…googleusercontent.com/userCodeAppPanel), which opens a blank page for
  // everybody including the developer — it is the inside of the iframe, not
  // the app. The app's real address, which screen they were on, and what they
  // were running it in are the things that answer "where do I look?".
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

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
// Only called automatically for WASTE. ENTRY notifications are user-triggered
// via the modal checkbox and handled directly in addMovementsBatch_() /
// sendBatchNotifyEmail_().
function checkNotifications_(ss, data, moveType, qty, userEmail) {
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

// ─── EXPORT ──────────────────────────────────────────────────────────────────
// REMOVED: the server-side exportMovementsCSV(filters).
// It took no session token and checked no role, so as a global function it was a
// callable RPC endpoint that dumped the ENTIRE movement archive to any signed-in
// Google account. It was also dead code — the client exports from data it has
// already been authorized to see (exportMovementsCSV() in Index_v3_fixed.html),
// which is the only export path the UI ever calls.

// ─── CUSTOM MENU ─────────────────────────────────────────────────────────────
function onOpen() {
  var cs = companySettings_();

  // "Advanced" groups tools a brand-new customer never needs: two are one-time
  // migration cleanups for data that only exists on installations that predate
  // the fix each one addresses (a fresh copy has nothing for either to do —
  // see their own "nothing to clean up" messages), and the third only works at
  // all on a standard Google Cloud project, which is us, not a typical
  // customer. Kept reachable rather than deleted, since OX Glass's own
  // installation still needs them.
  var advanced = SpreadsheetApp.getUi().createMenu('🔧 Advanced')
    .addItem('🔒 Revoke Public Sharing on Existing Files (run once)', 'menuRevokePublicSharing')
    .addItem('🧹 Normalize Status Column (run once)', 'menuNormalizeStatus')
    .addItem('Push Update Live (owner, standard Cloud project only)', 'menuActivateWebApp')
    .addSeparator()
    .addItem('📁 Tidy up my Drive (one folder for everything)', 'menuOrganizeDrive')
    .addItem('🩺 Check this installation', 'menuCheckInstallation')
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

  // A fresh copy cannot be made to open the wizard by itself, and it took a lot
  // of "it never opens" to work out why: onOpen is a SIMPLE trigger. Simple
  // triggers run without authorization and are barred from any service that
  // needs it — which covers both Session.getActiveUser() (used here to check
  // the opener was the owner) and showModalDialog. On a copy nobody has
  // authorized yet, every one of those throws, and the try/catch that kept
  // onOpen from breaking also made the failure invisible.
  //
  // So: no Session call, no silent dependency on a dialog. A toast needs no
  // authorization and always shows. The real signal is the START HERE sheet the
  // template ships with, which is simply visible the moment the file opens.
  if (!cs.setupComplete) {
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Go to the "👉 START HERE" tab at the bottom of this window.',
        '👋 Welcome to ' + PRODUCT_NAME, 30);
    } catch (e) {}
    // NOT attempted any more: showSetupWizardDialog() from here. The old
    // comment said trying it "costs nothing when it does not work". That was
    // wrong, and a customer's screenshot proved it — Sheets pops up a grey
    // "Message details / Exception: Specified permissions are not sufficient to
    // call Ui.showModalDialog" box, and it does that even though the call sits
    // inside a try/catch, because the permission failure is reported by Sheets
    // itself and not only raised into the script.
    //
    // It could never have worked either way: a simple trigger has neither the
    // script.container.ui scope the dialog needs nor the Session call
    // requireOwnerContext_() makes first, and authorizing the copy does not
    // change that — simple triggers always run restricted. So the first thing
    // a brand-new customer saw was an exception. The welcome SHEET is the whole
    // mechanism now, and it needs no permission at all.

    // Build the welcome sheet if it is not there. It used to be created only by
    // the template tool, which means it reached exactly the customers who got a
    // file made from the clean template — and nobody who was handed a copy of a
    // working system, which is how the first real copies were made. A sheet
    // that only appears in the ideal case is not a welcome, so it is created
    // here too, on any copy that has not finished setup.
    try {
      if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(START_HERE_SHEET)) {
        createStartHereSheet_(SpreadsheetApp.getActiveSpreadsheet());
      }
    } catch (e) {}
  }
}

// Google's toast fades after a few seconds and there is no way to make one
// stay. So on a copy that is not set up yet, it is re-shown when the person
// clicks around a sheet that is not the welcome page — throttled to once every
// five minutes, because the alternative is a toast on every single click, which
// is worse than no toast at all.
//
// Best-effort by design: if PropertiesService is not reachable from a simple
// trigger on an unauthorized copy, the throttle read throws, the catch swallows
// it, and nothing is shown. The welcome SHEET is the notice that always works;
// this is only a second chance for someone who has already wandered off it.
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

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Setup has not been done yet. Open the "👉 START HERE" tab at the bottom.',
      '👋 Welcome to ' + PRODUCT_NAME, 15);
  } catch (err) { /* simple trigger — never surface anything */ }
}

// ─── THE ACCEPT BUTTON ───────────────────────────────────────────────────────
// Sheets has no way to place a real button from code — a drawing with a script
// attached has to be drawn by hand, and Apps Script cannot create one. A
// CHECKBOX is the closest thing that exists: it is one click, it looks like a
// control, and ticking it fires onEdit.
//
// onEdit is a simple trigger, with the same handcuffs as onOpen: no
// authorization, so no dialog and no Session call — ever, on any copy,
// authorized or not. It does NOT try to open the wizard: that attempt is what
// produced the grey "permissions are not sufficient to call Ui.showModalDialog"
// box a customer hit the first time they ticked the box, and a try/catch does
// not suppress it because Sheets reports the permission failure itself.
//
// So ticking the box does the two things a simple trigger CAN do, and both of
// them last: it stamps the acceptance, and it writes the next step onto the
// sheet, right under the box, where it stays put instead of fading like a
// toast.
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== START_HERE_SHEET) return;
    if (e.range.getA1Notation() !== TERMS_CHECKBOX_CELL) return;

    // Un-ticking has to undo what ticking wrote. It used to only handle the
    // TRUE case, so clearing the box left "Accepted 8/24/2026, 2:30:03 PM" and
    // the next-step line sitting there — a sheet claiming someone accepted
    // terms they had just visibly declined. On a page whose entire job is
    // recording consent, that is the one thing it must not get wrong.
    if (e.range.getValue() !== true) {
      sh.getRange(TERMS_STAMP_CELL).clearContent();
      // Back to the grey prompt rather than an empty panel — the line explains
      // what the box is for, and someone who unticked it is exactly the person
      // who needs that sentence again.
      sh.getRange(TERMS_NEXT_CELL)
        .setValue(TERMS_PROMPT)
        .setFontWeight('normal').setFontColor(SH_MUTED);
      return;
    }

    sh.getRange(TERMS_STAMP_CELL).setValue('Accepted ' + new Date().toLocaleString());
    sh.getRange(TERMS_NEXT_CELL)
      .setValue('→ Now open the  🏭 ' + PRODUCT_NAME + '  menu at the top of this window ' +
                'and choose  "🚀 Set Up ' + PRODUCT_NAME + '".')
      .setFontWeight('bold').setFontColor('#B45309');
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Now use the "🏭 ' + PRODUCT_NAME + '" menu at the top and choose "Set Up ' + PRODUCT_NAME + '".',
      '✓ Terms accepted', 20);
  } catch (err) { /* a simple trigger must never surface an error to the user */ }
}

// The one instruction that reaches a customer with no authorization, no menu
// knowledge and no email from us: a sheet, in front of them, when the file
// opens. Created by the template tool and removed by the wizard once setup is
// done, so a working system is not left carrying a welcome mat.
var START_HERE_SHEET = '👉 START HERE';
var TERMS_SHEET   = '📄 Terms of Service';
var PRIVACY_SHEET = '📄 Privacy Policy';

// ─── BEGIN GENERATED LEGAL TEXT — node tools/sync-legal.js ───
// Source of truth: legal/TERMS-OF-SERVICE.md and legal/PRIVACY-POLICY.md.
// DO NOT EDIT THIS BLOCK BY HAND — edit the .md and re-run the generator.
// Each line is [kind, text]; kind is "title", "head", "sub", "li" or "p".
var LEGAL_SHEET_TEXT = {
  terms: [
    ["title","Terms of Service — Acopio"],
    ["p",""],
    ["p","Last updated: 27 August 2026"],
    ["p",""],
    ["p","These terms govern your use of Acopio, warehouse-management software provided by Jose Castro (\"we\", \"us\"). By installing or using it, you agree to them. If you are agreeing on behalf of a company, you confirm you are authorised to do so."],
    ["p",""],
    ["head","1. What you are buying"],
    ["p",""],
    ["p","A licence to install and run one copy of Acopio inside your own Google account, for your own business, plus updates and support for as long as your licence is active."],
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
    ["p","Acopio can make a copy of your spreadsheet nightly into your own Drive, kept 30 days. It is enabled during setup and we strongly recommend leaving it on."],
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
    ["p","Refunds are issued by the method you paid with, within 10 business days of being agreed."],
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
    ["p","Settle the account and support and updates resume immediately, with no reconnection fee."],
    ["p",""],
    ["sub","Coming back after leaving"],
    ["p",""],
    ["p","If you cancel and later want to return, you are treated as a new customer: current prices, and any promotional or founding rate you previously had does not come back. That includes the setup fee if the installation has to be done again."],
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
// ─── END GENERATED LEGAL TEXT ───

// The two documents the consent checkbox refers to, written into the customer's
// own file so they can be READ before the box is ticked.
//
// Why they live in the spreadsheet and not behind a link: the box is ticked
// before setup runs, which is before the web app is deployed and before there
// is any URL to link to. Asking somebody to accept a document that cannot be
// opened is not consent, and this is the one screen in the product whose only
// job is recording an agreement.
//
// Rebuilt from scratch each time rather than patched: these are generated from
// legal/*.md, so the file's copy should always be the current one, and a
// half-updated policy is worse than an old one.
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

      // A reader should never have to find their way back by hand.
      sh.getRange('B1').setValue('← Back to 👉 START HERE')
        .setFontSize(10).setFontColor(SH_MUTED);
      sh.setFrozenRows(1);
      sh.protect().setWarningOnly(true);   // it is a document, not a worksheet
    });
}

// A link to another TAB of the same spreadsheet. Sheets addresses those by the
// tab's gid, which only exists once the tab does — so this is called after
// createLegalSheets_, never before.
function sheetLink_(ss, name) {
  var sh = ss.getSheetByName(name);
  return sh ? ('#gid=' + sh.getSheetId()) : '';
}

// Fixed addresses, because onEdit has to recognise the checkbox by position —
// it gets a cell, not a name. Change the layout below and these move with it.
var TERMS_CHECKBOX_CELL = 'B14';
var TERMS_LABEL_CELL    = 'C14';
var TERMS_STAMP_CELL    = 'C15';
var TERMS_NEXT_CELL     = 'C16';
// One constant for the grey prompt, because it is written in two places now —
// when the panel is first drawn, and again when somebody unticks the box. Two
// copies of the same sentence is how they drift apart.
var TERMS_PROMPT = 'Tick the box above to continue.';

// Google's own colours are the only ones a spreadsheet can be styled with, so
// this borrows the app's palette rather than inventing a second one.
var SH_NAVY = '#1B2A4A', SH_ACCENT = '#3B7DD8', SH_MUTED = '#6B7280', SH_PAPER = '#FFFFFF';

function createStartHereSheet_(ss) {
  var sh = ss.getSheetByName(START_HERE_SHEET);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(START_HERE_SHEET, 0);

  // A page, not a grid. Column A is the left margin, B holds the checkbox, C
  // holds every line of text, D is the right margin — which is what lets the
  // checkbox sit BESIDE its label the way a form does, instead of above it.
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

  // ── Masthead ──
  sh.getRange('A1:D3').setBackground(SH_NAVY);
  sh.setRowHeight(1, 14); sh.setRowHeight(2, 42); sh.setRowHeight(3, 26);
  put('C2', PRODUCT_NAME, { size: 26, bold: true, color: '#FFFFFF', bg: SH_NAVY });
  put('C3', 'Warehouse management, in your own Google Drive.',
      { size: 11, color: '#C7D2E4', bg: SH_NAVY });

  // ── Welcome ──
  sh.setRowHeight(4, 26);
  // 17pt in a 21px default row is clipped — the row has to be told.
  sh.setRowHeight(5, 30);
  put('C5', 'Welcome. This copy is yours.', { size: 17, bold: true, color: SH_NAVY });
  sh.setRowHeight(6, 8);
  put('C7',
    'Everything lives in this file, in your own Google Drive. Nobody else can see it, ' +
    'and it does not stop working if you stop paying anyone. Setting it up takes about ' +
    'ten minutes and you only do it once.',
    { size: 11, color: '#374151', wrap: true });
  sh.setRowHeight(7, 56);

  // ── Terms ──
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

  // The nearest thing to a button that Apps Script can put on a sheet. It is
  // one click, it looks like a control, and ticking it fires onEdit().
  var chk = sh.getRange(TERMS_CHECKBOX_CELL);
  chk.insertCheckboxes();
  chk.setValue(false);
  chk.setHorizontalAlignment('center');
  // The same sentence as before, with the two document names turned into
  // links to the tabs that hold them. Rich text rather than two separate
  // HYPERLINK cells: breaking the sentence apart to make it clickable would
  // have made the one line that records consent harder to read, and the words
  // being underlined is what tells somebody they can be opened.
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
  // The instruction lives INSIDE the same panel as the checkbox, one line
  // below it — the eye is already there when the box is ticked, and it is the
  // one sentence that decides whether the customer gets any further. It starts
  // as a grey prompt so somebody who never ticks the box still sees what the
  // box is for.
  sh.setRowHeight(16, 32);
  put(TERMS_NEXT_CELL, TERMS_PROMPT,
      { size: 11, color: SH_MUTED, bg: '#EFF4FB', wrap: true });
  sh.setRowHeight(17, 8);

  // ── What happens next ──
  sh.setRowHeight(18, 22);
  put('C19', 'WHAT HAPPENS NEXT', { size: 9, bold: true, color: SH_MUTED });
  put('C20', '1.   Setup asks for your company name and logo.', { size: 11, color: '#374151' });
  put('C21', '2.   You tell it what you store and where you store it.', { size: 11, color: '#374151' });
  put('C22', '3.   You add the people who work here. That is all.', { size: 11, color: '#374151' });

  // ── The warning screen, explained before they meet it ──
  sh.setRowHeight(23, 16);
  put('C24',
    'Google will ask you to authorize this the first time, and will warn that the app is ' +
    '"not verified". That is expected and it is not a problem: this copy belongs to YOU, and ' +
    'the developer it names is your own account. Click Advanced, then "Go to…" to continue.',
    { size: 10, color: SH_MUTED, wrap: true });
  sh.setRowHeight(24, 56);

  put('C26', 'Leave the other tabs at the bottom alone — the system fills those in for you. ' +
             'This page disappears by itself once setup is finished.',
      { size: 10, color: SH_MUTED, wrap: true });
  sh.setRowHeight(26, 34);

  // No frozen rows, and the cursor parks at A1. Both are the same mistake seen
  // from two sides: freezing the masthead and then selecting the checkbox cell
  // fourteen rows down made Sheets scroll to it, so the file opened with the
  // welcome paragraph already hidden behind the frozen band. A page is read
  // from the top.
  ss.setActiveSheet(sh);
  try { sh.setActiveSelection('A1'); } catch (e) {}
  return sh;
}

// Reads the acceptance off the welcome sheet into Script Properties. Called
// from the wizard, which is the first moment we are running WITH authorization
// and can therefore record WHO accepted — onEdit cannot: no Session call is
// allowed in a simple trigger, so the tick alone proves when, not who.
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

// Opens the setup wizard as a dialog OVER the spreadsheet — no web app
// deployment required, so this works the very first time the owner opens their
// brand-new copy, before anything has been published. Owner-only, same
// reasoning as every other setup-time gate: the sheet could be shared with
// someone else before setup finishes, and only the actual owner should be able
// to claim admin on a fresh copy.
function showSetupWizardDialog() {
  requireOwnerContext_();
  var html = HtmlService.createHtmlOutputFromFile('SetupWizard')
    .setWidth(720).setHeight(680);
  try {
    SpreadsheetApp.getUi().showModalDialog(html, PRODUCT_NAME + ' Setup');
  } catch (err) {
    // "Specified permissions are not sufficient to call Ui.showModalDialog"
    // means this copy's appsscript.json is missing script.container.ui — the
    // permission to open a window over the sheet. The manifest that ships with
    // Acopio has it, but the Apps Script editor HIDES appsscript.json by
    // default, so a copy updated by pasting Code and Index keeps whatever
    // manifest it already had, and this is the first thing that breaks.
    //
    // Sheets prints the raw exception no matter what we do here, so this cannot
    // hide it. What it can do is leave the explanation and the fix somewhere
    // the person will actually find them, instead of a stack trace and nothing.
    explainDialogPermission_(String(err && err.message || err));
    throw err;
  }
}

// Writes the diagnosis onto the welcome sheet, creating it if it is not there.
// A sheet is the only surface available: every other way of talking to the user
// from here — alert, prompt, sidebar, dialog — needs the very permission that
// has just been reported missing.
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

// Called by the wizard's last step once the owner says they've published the
// web app by hand. Returns the live URL if a deployment exists, or '' if not —
// the dialog uses that to tell them plainly whether it worked instead of
// guessing.
//
// A URL the owner saved by hand WINS over ScriptApp.getService().getUrl().
// That ordering is deliberate, not a preference: on a Sheet copied from an
// already-deployed one, getUrl() has been observed returning a URL carrying the
// ORIGINAL script's deployment ID — a link that 404s, on a copy whose own Apps
// Script project has no deployment at all. There is no API to ask "is this URL
// actually live", so the owner (who can see the real one in the Deploy dialog)
// is the more reliable source, and 'saved' tells the wizard to say so.
function checkDeploymentReady() {
  requireOwnerContext_();
  var p = PropertiesService.getScriptProperties();
  var saved = String(p.getProperty('WEB_APP_URL') || '').trim();
  if (saved) return { url: saved, saved: true };
  try { return { url: ScriptApp.getService().getUrl() || '', saved: false }; }
  catch (e) { return { url: '', saved: false }; }
}

// Persists the URL the owner pasted from Google's Deploy dialog, so it survives
// closing and reopening the wizard. Previously the override lived only in the
// dialog's DOM, which meant reopening setup showed the same dead link again —
// the correction was thrown away the moment the window closed.
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
  // The external sign-in flow has to hand Google back the exact same address,
  // and it lived in a second property that somebody had to type in by hand —
  // which is how it ends up missing, or subtly different, on a fresh copy.
  // Setting it here means pasting the link once does both. It is not
  // overwritten if it was set deliberately: a broker or a proxy redirect is a
  // legitimate reason for the two to differ.
  if (!String(p2.getProperty('OAUTH_REDIRECT_URI') || '').trim()) {
    p2.setProperty('OAUTH_REDIRECT_URI', u);
  }
  return { url: u, saved: true };
}

// ─── PROGRAMMATIC DEPLOYMENT — ADVANCED / OWNER-ONLY ─────────────────────────
// Publishes a new version of this script as its web app via the Apps Script API
// (script.googleapis.com), authenticating with ScriptApp.getOAuthToken() — the
// copy's own owner token, no external OAuth client or service account.
//
// Pattern adapted from
// https://github.com/RomainVialard/programmatically-deploy-a-web-app (Apache 2.0).
// Requires the script.deployments + script.projects scopes in appsscript.json.
//
// ⚠️ NOT A CUSTOMER-FACING ONBOARDING STEP — tested and ruled out for that.
// This was originally built as a one-click "activate my WMS" button so a
// non-technical customer would never have to open Extensions → Apps Script →
// Deploy. Live testing killed that idea: script.googleapis.com must be enabled
// in the script's Google Cloud project first, and the project auto-created
// behind every copy is HIDDEN — per Google's own docs, "most users aren't able
// to directly locate, view, or update the project in the Google Cloud Platform
// Console" (developers.google.com/apps-script/guides/cloud-platform-projects).
// A personal Google account hits "you don't have permission, contact your
// administrator" and cannot proceed at all. Making it work requires linking a
// standard Cloud project — an irreversible, multi-step technical task that is
// strictly HARDER than the single Deploy click it was meant to replace.
//
// It is kept because it still works, and is genuinely useful, on a copy whose
// owner does control a standard Cloud project (i.e. ours): re-running it
// UPDATES the same deployment rather than creating a duplicate, so the web app
// URL never changes — making it a "push this update live" button that skips the
// Deploy dialog. Customer onboarding uses the manual Deploy walkthrough in
// docs/INSTALL-GUIDE.md instead.
var _WEBAPP_DEPLOYMENT_MARKER = PRODUCT_NAME + ' Web App';

function menuActivateWebApp() {
  var ui = SpreadsheetApp.getUi();   // throws outside the Sheets UI — the real gate
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  try {
    var url = selfActivateWebApp_();
    ui.alert('✅ Update published!\n\n' + url +
      '\n\nThis URL never changes — running this again republishes to the same address.');
  } catch (e) {
    ui.alert('Could not publish automatically: ' + e.message +
      '\n\nThis is expected unless this copy is linked to a standard Google Cloud project.' +
      '\nUse the normal path instead: Extensions → Apps Script → Deploy → Manage deployments → ✏️ → Version: New version → Deploy.');
    throw e;
  }
}

// Creates (or, on a repeat run, updates) the web app deployment for THIS
// script project entirely by API. Returns the permanent web app URL.
function selfActivateWebApp_() {
  var projectId = ScriptApp.getScriptId();

  var versionNumber = _scriptApiRequest_(projectId, 'versions', 'post',
    { description: _WEBAPP_DEPLOYMENT_MARKER }).versionNumber;

  var deploymentId = _findWebAppDeploymentId_(projectId);
  var configBody = { versionNumber: versionNumber, description: _WEBAPP_DEPLOYMENT_MARKER };

  // create takes the config fields directly; update wraps them in
  // {deploymentConfig: ...} — that asymmetry is the real Apps Script API
  // shape, not a bug — see the reference implementation linked above.
  var output = deploymentId
    ? _scriptApiRequest_(projectId, 'deployments/' + deploymentId, 'put', { deploymentConfig: configBody })
    : _scriptApiRequest_(projectId, 'deployments', 'post', configBody);

  var entryPoints = output.entryPoints || [];
  for (var i = 0; i < entryPoints.length; i++) {
    if (entryPoints[i].webApp) {
      var url = entryPoints[i].webApp.url;
      try {
        MailApp.sendEmail(Session.getActiveUser().getEmail(), '✅ Your ' + PRODUCT_NAME + ' system is ready',
          'Your warehouse system is live at:\n\n' + url +
          '\n\nBookmark it — it is also always available from the Google Sheet menu: 🏭 ' + PRODUCT_NAME + ' → Open WMS App.');
      } catch (e2) { /* email is a nicety — never block activation on it failing */ }
      return url;
    }
  }
  throw new Error('Deployment created but no web app URL was returned — check Extensions → Apps Script → Deploy for details.');
}

// Finds the deploymentId of our managed web-app deployment, if one already
// exists (so re-running Activate UPDATES it instead of creating a duplicate
// with a different URL).
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

// Thin wrapper around the Apps Script API — authenticates as the script's own
// owner via ScriptApp.getOAuthToken(), no external credentials involved.
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
  var ui = SpreadsheetApp.getUi();   // throws outside the Sheets UI — the real gate
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

// ONE-TIME CLEANUP. Every photo/document uploaded before this version was
// marked "anyone with the link can view" (see the removed setSharing calls
// this same release deletes). The code fix only changes what happens to files
// uploaded FROM NOW ON — it does nothing to the ones already sitting in Drive.
// This menu item is what actually closes the exposure on those existing files.
//
// Safe to run more than once: an already-private file is left alone (a cheap
// check, not a rewrite), so if a large documents folder makes one run hit
// Apps Script's 6-minute execution cap, just run it again from the menu — it
// picks up wherever Drive's folder iterator continues, at negligible extra cost
// for files already fixed.
function menuRevokePublicSharing() {
  var ui = SpreadsheetApp.getUi();   // throws outside the Sheets UI — the real gate
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });

  // Drive-wide name search needs the broad drive scope. On a drive.file
  // installation this throws — which is the correct outcome, because such an
  // installation never had public files to begin with: the setSharing calls
  // were removed in v8.10, so only spreadsheets that pre-date it have anything
  // to clean, and those are all on the broad scope.
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
  var TIME_BUDGET_MS  = 4.5 * 60 * 1000;  // headroom under the 6-minute execution cap
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

// ═══ MASTER TEMPLATE ═════════════════════════════════════════════════════════
// Customers get their copy by copying one master spreadsheet, and a copy brings
// the SHEET DATA with it — movements, the user list, everything. (Script
// Properties do not copy, which is why company identity resets but the rows do
// not.) So a master built from a working installation would hand every customer
// OX Glass's own inventory, and put OX Glass's email in their USERS_V3 as an
// admin of THEIR system. This wipes it properly instead of leaving that to a
// checklist and a good memory.
//
// Every sheet the app ever writes to is listed here explicitly rather than
// "clear everything that isn't CONFIG": a sheet added later and forgotten would
// otherwise ship full of real data, and silence is exactly the wrong failure
// for this.
var TEMPLATE_DATA_SHEETS = [
  'MASTER_ARCHIVE_V3', 'LIVE_STOCK', 'SITE_STOCK', 'WASTED_STOCK', 'RESERVATIONS',
  'AUDIT_LOG', 'ERROR_LOG', 'ARCHIVE_HISTORY', 'USERS_V3', 'INCOMING_V3',
  'RACK_PHOTOS', 'PM_DIRECTORY', 'MATERIAL_LOCKS'
];

// Properties that carry one installation's identity or secrets. SESSION_SECRET
// is included deliberately: sharing it across copies would mean a session token
// minted on one customer's system verifies on another's.
var TEMPLATE_WIPE_PROPS = [
  'COMPANY_NAME', 'COMPANY_DOMAIN', 'COMPANY_LOGO_ID', 'FOLDER_PREFIX',
  'FOLDER_PREFIX_HISTORY', 'SETUP_COMPLETE', 'WEB_APP_URL', 'SESSION_SECRET',
  'WMS_SESSIONS', 'WMS_MONITORED_MATERIALS', 'GMAIL_SCAN_ENABLED',
  'ERROR_ALERTS_ENABLED', 'GEMINI_API_KEY',
  'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_URI',
  'COLUMN_PREFS'
];

// ─── INSTALLATION CHECK ──────────────────────────────────────────────────────
// Script Properties are the one part of an installation that is invisible,
// unlabelled and one click from gone. Google's editor shows a bare list of
// names with no hint that FOLDER_PREFIX is holding every document link in the
// system together, so deleting "the ones that don't look necessary" is a
// reasonable thing for an owner to do and a very bad thing for the app.
//
// This says what each one is for, what happens without it, and repairs the ones
// that can be repaired — including working FOLDER_PREFIX back out of the Drive
// folders that already exist, which is the only one whose loss actually
// destroys something.
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

// Reads the Drive folders this account owns and works out what FOLDER_PREFIX
// must have been — the folders are named "<prefix>_Docs", so they still know.
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

function menuCheckInstallation() {
  var ui = SpreadsheetApp.getUi();
  var p  = PropertiesService.getScriptProperties();
  var missing = [], ok = [], repaired = [];

  PROPERTY_GUIDE.forEach(function (g) {
    var v = String(p.getProperty(g.key) || '').trim();
    if (v) { ok.push(g.key); return; }
    missing.push(g);
  });

  // Repair what can be repaired without asking, and only that.
  if (!String(p.getProperty('SESSION_SECRET') || '').trim()) {
    serverSecret_();                      // creates it
    repaired.push('SESSION_SECRET — recreated');
  }
  var url = String(p.getProperty('WEB_APP_URL') || '').trim();
  if (url && !String(p.getProperty('OAUTH_REDIRECT_URI') || '').trim()) {
    p.setProperty('OAUTH_REDIRECT_URI', url);
    repaired.push('OAUTH_REDIRECT_URI — set from your saved app link');
  }
  // Setup is complete if there is an admin on the user list, whatever the flag says.
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

  // ── The scheduled jobs ────────────────────────────────────────────────────
  // This whole check did not exist. It looked at Script Properties and folders
  // and never once asked whether the app's three scheduled jobs were installed
  // — including the nightly backup, whose only installer swallowed its own
  // error during setup. A customer could have "back up every night" ticked, no
  // trigger, and nothing anywhere would say so until the day they needed it.
  //
  // Same shape as the property repairs above: report what is there, reinstall
  // what is missing, say what was reinstalled.
  var wantTriggers = [
    { fn: 'dailyBackupTrigger',        install: ensureBackupTrigger_,
      what: 'Nightly backup of your data (2 AM)' },
    { fn: 'archiveOldMovementsTrigger', install: ensureArchiveTrigger_,
      what: 'Moves old movements to the archive (3 AM)' },
    { fn: 'dailyCheckinTrigger',       install: ensureCheckinTrigger_,
      what: 'Private check-in to your support address' }
  ];
  // El reporte diario va aparte de la lista: los otros tres o están o no están,
  // y este además puede estar APAGADO a propósito, que no es una falla. Y su
  // hora la elige un admin, así que "existe" no basta — un disparador con la
  // hora vieja hace que los ajustes digan una cosa y la bandeja de entrada
  // otra. ensureDailyReportTrigger_ compara las dos y rehace el disparador si
  // no coinciden; aquí sólo se cuenta lo que hizo.
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
    // Reading the trigger list needs an authorization the menu normally has. If
    // it is refused, say so rather than reporting all three as fine.
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
  // A failure recorded during setup outlives the run that caused it, so it is
  // reported here even when the trigger is present today.
  var backupErr = String(p.getProperty('BACKUP_TRIGGER_ERROR') || '').trim();
  if (backupErr) {
    triggerNotes.push('  • The nightly backup failed to schedule during setup:\n      ' + backupErr);
  }

  var lines = [];
  if (repaired.length) lines.push('REPAIRED AUTOMATICALLY\n  • ' + repaired.join('\n  • ') + '\n');
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

  // FOLDER_PREFIX is the one worth spelling out, because the folders themselves
  // still hold the answer and guessing wrong orphans every attachment.
  if (!String(p.getProperty('FOLDER_PREFIX') || '').trim()) {
    var guesses = detectFolderPrefixes_();
    lines.push('FOLDER_PREFIX is missing. Your Drive has these document folders:');
    lines.push(guesses.length ? '  • ' + guesses.join('\n  • ') : '  (none found)');
    lines.push('Set FOLDER_PREFIX to the one your attachments are in — without the "_Docs".');
    lines.push('Project Settings › Script Properties › Add.');
  }

  // Renamed folders. Not a fault — the app follows them by ID — but the person
  // reading this is the one who has to find their own files in Drive, and being
  // told the app knows about the rename is the difference between "it's fine"
  // and a support call.
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
  var ui = SpreadsheetApp.getUi();   // throws outside the Sheets UI — the real gate
  requireOwnerContext_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // The file NAME is in the prompt on purpose. The one catastrophic mistake
  // here is running this on the live system instead of the copy, and the only
  // thing that reliably prevents it is showing which file is about to be wiped.
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
    // Row 1 is the header and stays — the app expects the columns to exist.
    if (last > 1) sh.getRange(2, 1, last - 1, sh.getMaxColumns()).clearContent();
    cleared.push(name + (last > 1 ? ' (' + (last - 1) + ')' : ' (0)'));
  });

  // CONFIG holds the catalogs AND the legacy user list — wiped column by column
  // so the header row and the sheet's shape survive.
  var cfg = ss.getSheetByName('CONFIG');
  if (cfg && cfg.getLastRow() > 1) {
    cfg.getRange(2, 1, cfg.getLastRow() - 1, cfg.getMaxColumns()).clearContent();
  }

  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var wiped = 0;
  Object.keys(all).forEach(function (k) {
    // Named properties, plus every cached Drive folder ID — those point at
    // folders in the OWNER's Drive that a customer cannot reach, and a stale
    // one would send their uploads at a folder that isn't theirs.
    if (TEMPLATE_WIPE_PROPS.indexOf(k) !== -1 || k.indexOf('FOLDER_') === 0) {
      props.deleteProperty(k); wiped++;
    }
  });

  // Triggers belong to whoever installed them; a template must not ship with
  // the previous owner's backup schedule attached.
  var triggersRemoved = 0;
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); triggersRemoved++; });
  } catch (e) {}

  try { ss.rename(PRODUCT_NAME + ' — Warehouse Template'); } catch (e) {}
  try { createStartHereSheet_(ss); } catch (e) {}

  ui.alert('✓ Template prepared',
    'Cleared: ' + cleared.join(', ') + '\n' +
    (missing.length ? 'Not present (fine): ' + missing.join(', ') + '\n' : '') +
    'CONFIG catalogs cleared.\n' +
    wiped + ' script propert(ies) removed.\n' +
    triggersRemoved + ' trigger(s) removed.\n\n' +
    'Now run "Check if this copy is a clean template" to confirm, then share the\n' +
    'file with a /copy link.',
    ui.ButtonSet.OK);
}

// Reads the file back and reports anything a customer must not receive. Written
// as a separate check on purpose: "the wipe said it worked" and "the file is
// actually clean" are different claims, and only the second one matters.
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

// STATUS is fully derived from MoveType — it holds no information of its own.
// Only five pairings are valid:
//     ENTRY / RETURN / TRANSFER  →  In Stock
//     EXIT                       →  Dispatched
//     WASTE                      →  Damaged
// Anything else in the sheet ("In Stock" on an EXIT, "Dispatched" on a
// TRANSFER, …) is legacy data from before the v2→v3 migration, when Status was
// hand-entered and MoveType did not exist.
function statusForMoveType_(mt) {
  if (mt === 'EXIT')   return 'Dispatched';
  if (mt === 'WASTE')  return 'Damaged';
  if (mt === 'ADJUST') return 'Adjusted';
  return 'In Stock';   // ENTRY, RETURN, TRANSFER
}

// ─── WHICH WAY AN ADJUSTMENT WENT ────────────────────────────────────────────
// An ADJUST records a COUNT that disagreed with the record. It is not a move
// between two places, so it has no second rack to travel to — and that free
// column is where the direction is kept:
//
//     counted FEWER than the app said  →  rack in SRC_LOC   →  stock goes down
//     counted MORE  than the app said  →  rack in DEST_LOC  →  stock goes up
//
// Nothing new is stored and no column was added. It is the same grammar every
// other type already uses: ENTRY writes DEST, EXIT and WASTE write SRC,
// TRANSFER writes both. "Where did it come from, where did it go" reads the
// same on an adjust as on everything else in the archive.
//
// The alternative was a signed quantity, and it would have leaked a negative
// number into every sum, badge, chart and CSV export in the app — each of
// which would then need to know that this one type counts differently.
//
// Returns -1 (down), +1 (up), or 0 for a row that is neither, which is not a
// direction but a malformed row and is refused on write.
function adjustDirection_(srcKey, destKey) {
  if (srcKey  && !destKey) return -1;
  if (destKey && !srcKey)  return 1;
  return 0;
}

// One-time cleanup for those legacy rows. Rewrites nothing but the Status cell,
// and only where it disagrees with the row's MoveType.
//
// Stock figures are NOT affected by this and never were: every calculation
// reads the normalized moveType from parseArchiveRow(), not Status. The one
// case where Status does influence a reading is a row whose MoveType column is
// empty or literally "IN STOCK" (true v2 rows) — parseArchiveRow() then infers
// the type from Status and the qty sign. Those rows are left exactly as they
// are, because their Status is the only evidence of intent that exists and
// overwriting it would destroy information rather than tidy it.
function menuNormalizeStatus() {
  var ui = SpreadsheetApp.getUi();   // throws outside the Sheets UI — the real gate
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

    // Ambiguous row: no MoveType of its own, so Status is load-bearing. Leave it.
    if (!rawMT || rawMT === 'IN STOCK') { skippedAmbiguous++; continue; }

    var mt = (rawMT === 'DISPATCHED' || rawMT === 'DISPATCH' || rawMT === 'DEL') ? 'EXIT' : rawMT;
    var want = statusForMoveType_(mt);
    if (String(statusVals[i][0] || '').trim() !== want) {
      statusVals[i][0] = want;
      fixed++;
    }
  }

  if (fixed) archive.getRange(2, statusCol, lastRow - 1, 1).setValues(statusVals);
  auditLog_(ss, 'STATUS_NORMALIZED', 'Spreadsheet menu', fixed + ' row(s)', '', '');

  ui.alert('✓ Done.\n\n' + fixed + ' Status cell(s) corrected.' +
    (skippedAmbiguous
      ? '\n\n' + skippedAmbiguous + ' older row(s) left untouched: they have no MoveType of ' +
        'their own, so their Status is the only record of what the movement was. ' +
        'Changing it would lose information.'
      : ''));
}

function menuReconcile() {
  // getUi() FIRST, deliberately: it throws outside the Sheets UI, which makes it
  // the gate. Called the other way round, a google.script.run invocation would
  // finish the expensive full rebuild and only then hit the error.
  var ui = SpreadsheetApp.getUi();
  setVerifiedAuth_({ role: 'ADMIN', email: requireOwnerContext_(), name: 'Spreadsheet menu' });
  runReconciliation_(SpreadsheetApp.getActiveSpreadsheet());
  ui.alert('Reconciliation complete.');
}

function menuOpenApp() {
  var url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert('Open this URL in your browser:\n\n' + url);
}

// ─── PRESENCE / HEARTBEAT ────────────────────────────────────────────────────
// Called on page load and every 90 s from the frontend.
// Stores a timestamp per user in ScriptProperties and returns the active list.
function heartbeat(sessionToken) {
  // Must receive the token so non-org users are identified correctly. Without it,
  // getUserRole() returns NO_SESSION and would register a ghost empty user.
  var auth = getUserRole(sessionToken);
  if (!auth || auth.role === 'DENIED' || auth.role === 'NO_SESSION' || !auth.email) return [];

  // Returns empty instead of throwing: presence is decoration, and a thrown
  // error here would pop a failure toast in a perfectly healthy session. Each
  // call rewrites the sessions property, so it is worth capping — the client
  // polls about once a minute, making 60/5min ~12x normal.
  if (!throttle_('hb', auth.email, 60, 300)) return [];

  var props    = PropertiesService.getScriptProperties();
  var raw      = props.getProperty('WMS_SESSIONS');
  var sessions = {};
  try { if (raw) sessions = JSON.parse(raw); } catch(e) {}

  var now    = new Date().getTime();
  var cutoff = now - 10 * 60 * 1000;  // prune sessions older than 10 min

  // Update this user
  sessions[auth.email] = { email: auth.email, name: auth.name || '', role: auth.role, time: now };

  // Prune stale entries AND any malformed/unauthenticated ghosts from old builds
  Object.keys(sessions).forEach(function(k) {
    var s = sessions[k];
    if (!k || !s || !s.email || s.role === 'NO_SESSION' || s.time < cutoff) delete sessions[k];
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

function ensureUsersSheet_(ss) {
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
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
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
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var email = String(data.email || '').toLowerCase().trim();
  var name  = String(data.name  || '').trim();
  var role  = String(data.role  || 'WAREHOUSE').toUpperCase().trim();
  if (!email || email.indexOf('@') === -1) throw new Error('Valid email required.');
  if (['ADMIN','WAREHOUSE','VIEWER'].indexOf(role) === -1) throw new Error('Invalid role.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureUsersSheet_(ss);

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
  sheet.appendRow([id, sheetSafe_(email), sheetSafe_(name), sheetSafe_(role), auth.email, now, true]);
  auditLog_(ss, 'ADD_USER', auth.email, email + ' as ' + role, '', '');
  return { status: 'success', id: id };
}

function updateUser(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  var email = String(data.email || '').toLowerCase().trim();
  if (!email) throw new Error('Email required.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS_V3');
  if (!sheet) throw new Error('Users sheet not found.');

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1] || '').toLowerCase().trim() === email) {
      var rowNum = i + 1;
      if (data.name !== undefined)   sheet.getRange(rowNum, 3).setValue(sheetSafe_(String(data.name).trim()));
      if (data.role !== undefined)   sheet.getRange(rowNum, 4).setValue(sheetSafe_(String(data.role).toUpperCase().trim()));
      if (data.active !== undefined) sheet.getRange(rowNum, 7).setValue(!!data.active);
      auditLog_(ss, 'UPDATE_USER', auth.email, email + ' → ' + (data.role || 'no role change'), '', '');
      return { status: 'success' };
    }
  }
  throw new Error('User not found: ' + email);
}

function removeUser(email, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
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
      auditLog_(ss, 'REMOVE_USER', auth.email, email, '', '');
      return { status: 'success' };
    }
  }
  throw new Error('User not found: ' + email);
}

// ─── SETTINGS / CONFIG MANAGEMENT ────────────────────────────────────────────
// Admin-only. Reads/writes CONFIG sheet columns for categories, projects,
// suppliers, and locations. Renaming a category also updates MASTER_ARCHIVE_V3.

function getSettings(auth) {
  // A READ, not a write — the actual writes (updateConfig) still decide who
  // may CHANGE a category, project, supplier or location, via requirePerm_.
  // This only has to answer "what are they right now", which is exactly what
  // a WAREHOUSE user needs before they can manage the catalog at all — the
  // Categories/Projects/Suppliers/Locations tabs cannot show a current list
  // without it. Was ADMIN-only, which meant a WAREHOUSE user granted
  // canManageCatalog could open Settings (the UI now lets them in) and get an
  // error on the very first thing it tried to load.
  auth = requireAuth_('WRITE');
  var c = loadConfig();
  return {
    categories: c.categories,
    projects:   c.projects,
    suppliers:  c.suppliers,
    locations:  c.locations.map(function(l){ return l.name; }),
    // Kept alongside the flat name list rather than replacing it: rename and
    // delete address locations by name, and the Locations tab needs the type to
    // group them. Order of `locations` is the order stored in CONFIG, which is
    // what the drag-to-reorder screen writes back.
    locationTypes: (function(){
      var m = {};
      c.locations.forEach(function(l){ m[l.name] = l.type || 'RACK'; });
      return m;
    })(),
    archiveCutoffMonths: c.archiveCutoffMonths,
    company: publicCompany_()      // the Company tab edits these
  };
}

// Folds one or more locations into another, everywhere they appear.
//
// A location cannot simply be deleted: every movement that ever went into or
// out of it names it, so removing the row would leave that history pointing at
// something that no longer exists. Two safe outcomes exist instead — archive
// (stop offering it, keep the history readable) and merge, which is this. Use
// it when a place was renamed or two spellings turned out to be one shelf.
//
// Rewrites BOTH location columns: a movement records where stock came FROM and
// where it went TO, and a location can appear in either.
//
// data = { from: ['A1A','A1 A'], into: 'A1A' }
// Merging locations moves stock between them, so it takes the stock lock —
// step 2 of the concurrency fix.
//
// Unlike manageMaterial this one was already in good shape: it writes each
// column in a single setValues and it already rebuilds the derived sheets. The
// only gap besides the lock was ARCHIVE_HISTORY, closed below.
//
// Validation stays outside the lock so a bad request is refused without
// queueing behind whoever is saving.
function mergeLocations(data, auth) {
  auth = requireAuth_('ADMIN');
  var into = String(data.into || '').trim();
  if (!into) throw new Error('Pick the location to keep.');
  var from = (data.from || []).map(function (v) { return String(v || '').trim(); })
                              .filter(function (v) { return v && v.toUpperCase() !== into.toUpperCase(); });
  if (!from.length) throw new Error('Pick at least one other location to merge in.');
  return withStockLock_(function () { return mergeLocationsLocked_(data, auth, into, from); });
}

function mergeLocationsLocked_(data, auth, into, from) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var wanted = {};
  from.forEach(function (v) { wanted[v.toUpperCase()] = true; });

  // Source AND destination columns, on BOTH sheets. ARCHIVE_HISTORY was
  // missing: once a customer's archive fills and old rows move out, a merged
  // location would go on living in the history under its old name, and
  // refreshDerivedSheets_ reads the two concatenated — so the location would
  // reappear as a place stock still sits.
  var storedInto = sheetSafe_(into);
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

  // Drop the merged-away names from CONFIG, keeping each surviving location
  // with the group it was already filed under.
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (cfg) {
    var rows = cfg.getDataRange().getValues();
    var names = [], types = [], sawInto = false;
    // The survivor's own group, remembered before its row can be dropped.
    //
    // Merging two spellings that differ only in case puts the SURVIVOR's
    // uppercase form in `wanted` too, so its row is removed with the others and
    // re-added below — and re-adding it as a bare 'RACK' would quietly move a
    // location out of the group somebody had filed it under. Now it keeps it.
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
    writeConfigColumn_(cfg, 3, names);
    writeConfigColumn_(cfg, 4, types);
  }

  refreshDerivedSheets_(ss);
  auditLog_(ss, 'MERGE_LOCATIONS', auth.email, from.join(' + ') + ' → ' + into, String(rowsChanged) + ' cells', '');
  return { status: 'success', rowsChanged: rowsChanged, into: into };
}

// ─── COLUMN LABELS AND VISIBILITY ────────────────────────────────────────────
// Every business names these things differently — one calls a shelf a rack, the
// next calls it a bay; "At Site" means delivered to one customer and used on a
// job to another. Hardcoding our words into their screen makes the product feel
// like it was built for somebody else.
//
// Stored as one JSON blob in Script Properties rather than as CONFIG columns:
// it is a handful of settings, not a catalog, and CONFIG's columns are already
// crowded. Being a Script Property also means it does not survive into a
// customer's copy of the template, which is right — these are one
// installation's words.
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

  // Only trimmed, non-empty overrides are kept. A blank box means "use the
  // default name", which must not be stored as an empty header.
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

// ─── COMPANY NAME, DOMAIN AND LOGO ───────────────────────────────────────────
// These were only ever settable in the setup wizard, which meant a company that
// got its logo made a month after going live had no way to add it short of
// walking back through the whole wizard. They are settings, not a one-time
// ceremony, so they are editable like any other.
//
// data = { name, domain, logo:{fileData, fileMimeType}|null, removeLogo:bool }
function saveCompanyProfile(data, auth) {
  auth = requireAuth_('ADMIN');
  data = data || {};
  var p = PropertiesService.getScriptProperties();

  var name = String(data.name || '').trim();
  if (!name) throw new Error('Company name is required.');
  var before = companySettings_();
  p.setProperty('COMPANY_NAME', name);

  // Leading @ is what people type; the rest of the app compares bare domains.
  p.setProperty('COMPANY_DOMAIN', String(data.domain || '').trim().replace(/^@/, '').toLowerCase());

  // FOLDER_PREFIX is deliberately NOT recomputed from the new name. Every
  // document and photo ever attached lives in a folder named after the prefix,
  // and DOC_LINKS rows point into it — renaming the company must not orphan
  // them. Same rule the wizard follows on a re-run.

  if (data.removeLogo) {
    trashFileQuietly_(before.logoId);
    p.deleteProperty('COMPANY_LOGO_ID');
  } else if (data.logo && data.logo.fileData) {
    var bytes = Utilities.base64Decode(data.logo.fileData);
    var blob  = Utilities.newBlob(bytes, data.logo.fileMimeType || 'image/png', 'logo');
    var file  = getOrCreateFolder_(docsFolderName_()).createFile(blob);
    p.setProperty('COMPANY_LOGO_ID', file.getId());
    trashFileQuietly_(before.logoId);   // only after the new one is safely stored
  }

  // The spreadsheet file's own name follows the company, the same way the
  // wizard sets it — otherwise Drive keeps showing the old company forever.
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var wanted = name + ' — ' + PRODUCT_NAME;
    if (ss.getName() !== wanted) ss.rename(wanted);
    auditLog_(ss, 'UPDATE_CONFIG', auth.email, 'company', before.name || '(none)', name);
  } catch (e) {}

  return { status: 'success', company: publicCompany_() };
}

// An old logo that cannot be trashed (already deleted by hand, or owned by
// somebody else after a transfer) is not a reason to fail the save — the new
// one is already in place by then.
function trashFileQuietly_(fileId) {
  if (!fileId) return;
  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
}

// Writes the Locations column and its Type column back in one go, in the exact
// order given. Order carries meaning here — it is what the drag-to-reorder
// screen produces — so both columns are rewritten together rather than patched
// cell by cell, which is also what compacts the gaps that `delete` leaves
// behind (it blanks a cell in place rather than closing the row up).
//
// Types are free text: a business with carts, offices and a showroom should be
// able to name those groups itself instead of picking from a list we guessed.
// Nothing downstream branches on the value — grouping is presentation only, and
// every location still counts toward stock exactly as before.
function saveLocationLayout(data, auth) {
  auth = requireAuth_('ADMIN');
  var list = data && data.locations;
  if (!Array.isArray(list)) throw new Error('No locations provided.');

  var names = [], types = [], seen = {};
  for (var i = 0; i < list.length; i++) {
    var n = String((list[i] && list[i].name) || '').trim();
    if (!n) continue;
    var key = n.toUpperCase();
    if (seen[key]) continue;                       // never write the same location twice
    seen[key] = 1;
    names.push(n);
    types.push(String((list[i] && list[i].type) || 'RACK').trim().toUpperCase() || 'RACK');
  }
  if (!names.length) throw new Error('At least one location is required.');

  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('CONFIG sheet not found.');

  writeConfigColumn_(cfg, 3, names);
  writeConfigColumn_(cfg, 4, types);

  auditLog_(ss, 'UPDATE_CONFIG', auth.email, 'locations', 'reorder', names.length + ' location(s)');
  return { status: 'success', count: names.length };
}

// data.type  : 'categories' | 'projects' | 'suppliers' | 'locations'
// data.op    : 'add' | 'rename' | 'delete'
// data.value : current value (required for rename/delete)
// data.newValue : replacement value (required for rename)
// Folds several spellings of the same project (or supplier) into one.
//
// The same job gets typed a dozen ways over months — "PAT BME2", "PAT BME 2",
// "BME2 TRACIE DOOR_MAIN" — and each variant then counts as its own project in
// every report, so a job's real totals are split across entries nobody realises
// are the same thing. Renaming in CONFIG alone would not fix that: the archive
// rows keep the old text, so this rewrites the movement rows too.
//
// data = { type: 'projects'|'suppliers', from: ['A','B'], into: 'C' }
// Merging two spellings of a project or supplier rewrites archive rows, so it
// takes the stock lock — step 2 of the concurrency fix. Like mergeLocations and
// unlike manageMaterial, this one already wrote in bulk and already rebuilt the
// derived sheets; the lock and ARCHIVE_HISTORY were the gaps.
//
// Note this is a MERGE, not a rename, and that is why it is allowed to rewrite
// history where renaming a supplier is not (see the note above updateConfig).
// A merge says "these two spellings were always the same company" — it corrects
// a record that was wrong, rather than restating a true one under a new name.
function mergeConfigValues(data, auth) {
  auth = requireAuth_('ADMIN');
  var type = String(data.type || '');
  if (type !== 'projects' && type !== 'suppliers') throw new Error('Unknown merge type: ' + type);

  var into = String(data.into || '').trim();
  if (!into) throw new Error('Pick the name to keep.');
  var from = (data.from || []).map(function (v) { return String(v || '').trim(); })
                              .filter(function (v) { return v && v.toUpperCase() !== into.toUpperCase(); });
  if (!from.length) throw new Error('Pick at least one other name to merge in.');
  return withStockLock_(function () { return mergeConfigValuesLocked_(data, auth, type, into, from); });
}

function mergeConfigValuesLocked_(data, auth, type, into, from) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var col = (type === 'projects') ? AC.PROJECT : AC.SUPPLIER;

  var wanted = {};
  from.forEach(function (v) { wanted[v.toUpperCase()] = true; });

  // 1. Rewrite both archives so history reads as one project.
  var storedInto = sheetSafe_(into);
  var rowsChanged = 0;
  [ss.getSheetByName(SHEETS.ARCHIVE), ensureArchiveHistorySheet_(ss)].forEach(function (sheet) {
    rowsChanged += rewriteArchiveColumn_(sheet, col, function (row) {
      var cur = String(row[col] || '').trim();
      return (cur && wanted[cur.toUpperCase()]) ? storedInto : null;
    });
  });

  // 2. Drop the merged-away spellings from CONFIG, and make sure the survivor
  //    is actually on the list — it may only ever have existed as free text.
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  var removed = 0;
  if (cfg) {
    var cfgCol  = (type === 'projects') ? 0 : 2;
    var cfgVals = cfg.getDataRange().getValues();
    var keep = [], sawInto = false;
    for (var r = 1; r < cfgVals.length; r++) {
      var v = String(cfgVals[r][cfgCol] || '').trim();
      if (!v) continue;
      if (wanted[v.toUpperCase()]) { removed++; continue; }
      if (v.toUpperCase() === into.toUpperCase()) sawInto = true;
      keep.push(v);
    }
    if (!sawInto) keep.push(into);
    keep.sort();
    writeConfigColumn_(cfg, cfgCol, keep);
  }

  refreshDerivedSheets_(ss);
  auditLog_(ss, 'MERGE_CONFIG', auth.email,
    type + ': ' + from.join(' + ') + ' → ' + into, String(rowsChanged) + ' rows', '');

  return { status: 'success', rowsChanged: rowsChanged, removed: removed, into: into };
}

// Rewrites the Category column of one archive-shaped sheet in ONE round trip.
//
// It used to be a setValue() per matching row — one network call to Google per
// row. On a real archive that is minutes, and it showed: the button gave no
// feedback, so it got clicked again, and the second click reported
// '"IGU" not found in categories' for a rename that had in fact worked.
//
// Worse, minutes of work meant a real chance of hitting the 6-minute execution
// ceiling PART WAY THROUGH, leaving half the archive renamed and half not —
// one category silently split in two. Read once, change in memory, write once
// removes that failure mode entirely: either the whole column lands or none
// of it does.
//
// The cost of the bulk write is that untouched cells get their own value
// written back. That is safe here and only here: this app never writes a
// formula (there is no setFormula anywhere in this file), the column holds
// plain text, and setValues does not disturb formatting. It also writes
// nothing at all when nothing matched.
//
// Guarded by tools/test-category-rename.js, which runs this exact function
// over a fake sheet and asserts that every non-matching cell comes out
// byte-identical — because the flip side of one big write is that a mistake
// lands everywhere at once instead of slowly.
//
// `decide(row)` receives the WHOLE row and returns the new value for `col`, or
// null to leave that cell exactly as it is. The whole row, because the callers
// that matter do not match on the column they write: renaming a material
// matches on category AND name and writes the name; moving one to another
// category matches on the same pair and writes the category. Matching only on
// the target column would rename every "GE SILPRUF" in the building instead of
// the one in the category the admin was looking at.
function rewriteArchiveColumn_(sheet, col, decide) {
  if (!sheet) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var width = Math.max(sheet.getLastColumn(), col + 1);
  var rows  = sheet.getRange(2, 1, last - 1, width).getValues();
  var out = [], changed = 0;
  for (var i = 0; i < rows.length; i++) {
    var nv = decide(rows[i]);
    if (nv === null || nv === undefined) out.push([rows[i][col]]);
    else { out.push([nv]); changed++; }
  }
  if (changed) sheet.getRange(2, col + 1, last - 1, 1).setValues(out);
  return changed;
}

// The same rename, on the expected-deliveries sheet. Column C (index 2) — see
// the column map above ensureIncomingSheet_.
//
// Its own function rather than a third call to renameCategoryColumn_ because
// that one is written against the ARCHIVE's column map (AC.CATEGORY), and
// pointing it at a sheet with a different shape is how the wrong column gets
// rewritten one day.
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
  if (changed) sheet.getRange(2, 3, last - 1, 1).setValues(vals);
  return changed;
}

function renameCategoryColumn_(sheet, oldVal, newValStored) {
  var want = String(oldVal || '').trim().toUpperCase();
  return rewriteArchiveColumn_(sheet, AC.CATEGORY, function (row) {
    return String(row[AC.CATEGORY] || '').trim().toUpperCase() === want ? newValStored : null;
  });
}

// ─── WHY ONLY CATEGORIES ARE REWRITTEN INTO THE ARCHIVE ─────────────────────
// Renaming a category rewrites every matching movement. Renaming a supplier, a
// project or a location does not. That asymmetry looks like an oversight and
// is not — it is the design, and it is written down here because the next
// person to notice it (this file's own author included) will otherwise
// "fix" it.
//
// A CATEGORY is a CLASSIFICATION. "WINDOW" describes what the thing IS, and
// that did not stop being true because the spelling was corrected. Renaming
// IGU to "IGU (ISOLATED GLASS UNIT)" says nothing new about the glass; it
// tidies up how it is written. Carrying it into the archive is right.
//
// There is also no choice about it: stock is grouped by category+name, so a
// category renamed in the catalog but not in the archive splits one material
// into two and THE NUMBERS COME OUT WRONG. Categories must carry.
//
// A SUPPLIER, a PROJECT and a LOCATION are HISTORICAL FACTS. Who we bought it
// from, which job it left for, which rack it sat in — each was true under the
// name in use on that day. Rack A3B was called A3B until yesterday; saying
// January's material sat in "B7C" is not a correction, it is false.
//
// The practical half of the argument, which is the half that settles it:
// supplier and project names are printed on PDFs and emails that have already
// been sent. A customer comparing an old PDF against the screen and finding
// they disagree does not conclude "somebody renamed something" — they conclude
// the system cannot be trusted. An inventory system sells traceability;
// rewriting the past is the one thing it must not do.
//
// The Settings screen now says which is which, per tab, so a customer meets
// this rule before renaming rather than after — see _renderSettingsTab.
function updateConfig(data, auth) {
  // Split gate, not a single ADMIN wall any more. archiveCutoffMonths is a
  // system-wide retention setting — stays ADMIN-only, unconditionally, same as
  // System tab always has been. The catalog ops below it (categories, projects,
  // suppliers, locations — the four tabs literally labelled "Catalog" in
  // Settings) are what "Manage catalog" in Settings → Permissions actually
  // grants; requireAuth_('WRITE') here only establishes "authenticated, not a
  // VIEWER" — requirePerm_ below is what actually decides.
  auth = requireAuth_('WRITE');
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName(SHEETS.CONFIG);
  if (!cfg) throw new Error('CONFIG sheet not found.');

  if (data.type === 'archiveCutoffMonths') {
    requireAuth_('ADMIN');   // re-checked deliberately: this branch is admin-only regardless of any catalog permission
    var months = Number(data.value);
    if ([6, 12, 18].indexOf(months) === -1) throw new Error('Cutoff must be 6, 12, or 18 months.');
    cfg.getRange(2, 14).setValue(months);
    ensureArchiveTrigger_();
    var res = archiveOldMovements(ss);
    auditLog_(ss, 'UPDATE_CONFIG', auth.email, 'archiveCutoffMonths', 'set', String(months) + 'mo');
    return { status: 'success', reconcile: res };
  }

  requirePerm_(auth, 'canManageCatalog');

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
    cfg.getRange(targetRow, col + 1).setValue(sheetSafe_(nv));

  } else if (data.op === 'rename') {
    if (!val) throw new Error('Current value required for rename.');
    if (!nv)  throw new Error('New value required for rename.');
    var renamed = 0;
    // Uppercased, like every other write to this list. It was the one path
    // that stored the value exactly as typed: _cfgAdd uppercases in the
    // browser, the wizard uppercases, the chip inputs uppercase, and the
    // archive rewrite below uppercases — so renaming a category to
    // "IGU (isolated glass unit)" put THAT in CONFIG and
    // "IGU (ISOLATED GLASS UNIT)" in the archive, and the two stopped
    // matching each other. Found by renaming a real category for the first
    // time, in production, which is exactly where a mismatch like this
    // finally shows up.
    var nvStored = sheetSafe_(nv.toUpperCase());
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][col] || '').trim().toUpperCase() === val.toUpperCase()) {
        cfg.getRange(i + 1, col + 1).setValue(nvStored);
        renamed++;
      }
    }
    if (!renamed) throw new Error('"' + val + '" not found in ' + data.type + '.');
    // Also rename in MASTER_ARCHIVE_V3 when renaming a category.
    //
    // This reads as a settings change and is anything but: it walks the WHOLE
    // archive rewriting the Category cell of every matching row — thousands of
    // writes on a real installation, with the floor still saving movements
    // throughout. It was the last unlocked stock-writer found, and it was
    // found by tools/test-concurrency.js rather than by reading the code,
    // precisely because it does not look like one.
    //
    // Only THIS block takes the lock, not the whole of updateConfig: the
    // archiveCutoffMonths branch above calls archiveOldMovements, which takes
    // the same lock and would find it already held.
    if (data.type === 'categories') {
      withStockLock_(function () {
        // BOTH sheets. The rename used to touch MASTER_ARCHIVE_V3 only, and
        // refreshDerivedSheets_ reads the archive and ARCHIVE_HISTORY
        // concatenated — so the first time archiveOldMovements moved rows out,
        // one category would have silently split into two materials: the
        // recent rows under the new name, the old ones under the old. Nobody
        // had hit it yet only because no installation has filled up.
        var n  = renameCategoryColumn_(ss.getSheetByName(SHEETS.ARCHIVE), val, nvStored);
        n     += renameCategoryColumn_(ensureArchiveHistorySheet_(ss), val, nvStored);

        // And the expected deliveries, which were being left behind.
        //
        // Jose renamed a category to "IGU (ISOLATED GLASS UNIT)". The archive
        // followed; INCOMING_V3 did not. Weeks later he opened one of those
        // deliveries and the Category box was EMPTY — the row still said "IGU",
        // no option on the dropdown said "IGU" any more, and a <select> given a
        // value it does not have selects nothing, in silence. Saving would then
        // have written that nothing back.
        //
        // Deliveries are not stock, so this changes no number. It is here
        // because a rename has to reach every place the old word is stored, and
        // this was the one place it did not.
        renameIncomingCategory_(ss, val, nvStored);

        // LIVE_STOCK / SITE_STOCK / WASTED_STOCK are a cache of the archive,
        // and every screen in the app reads the cache, not the archive. Without
        // this the rename was invisible until somebody happened to save a
        // movement — the category list showed the new name while the whole
        // inventory still showed the old one.
        //
        // It also repairs the MatIDs. A material's id is built from its
        // category, so renaming the category makes every stored MatID stale;
        // refreshDerivedSheets_ recomputes and rewrites them as it goes.
        //
        // Inside the lock on purpose: the rewrite above and the rebuild are one
        // operation, and a save landing between them would be replayed against
        // a half-renamed archive.
        if (n) refreshDerivedSheets_(ss);
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

// ─── MATERIAL MANAGEMENT ──────────────────────────────────────────────────────
// Admin-only. Rename, merge, change category, or delete individual rows.

function listMaterials(auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
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
// Every op here changes what the stock numbers come out as, so the whole thing
// runs behind the stock lock (step 2 of the concurrency fix).
//
// Reviewing it to add that lock turned up four more problems, all older than
// the lock and all the same ones renaming a category had — this is the same
// family of code and it had drifted the same way. Locking a slow, half-correct
// function would only have held everyone else out for longer, so they are
// fixed together rather than in sequence:
//
//   • setValue PER ROW on rename / changeCategory / merge. Minutes on a real
//     archive, and a live chance of hitting the 6-minute ceiling part way
//     through — leaving a material half-renamed, which is to say split in two.
//   • refreshDerivedSheets_ was NEVER called by those three. Only deleteRow
//     did. Every screen reads LIVE_STOCK, so renaming a material appeared to
//     do nothing at all until somebody happened to save a movement. Exactly
//     what Jose hit renaming a category, still waiting to be hit here.
//   • ARCHIVE_HISTORY was untouched. Once a customer's archive fills and old
//     rows move out, a renamed material would split into two: recent rows
//     under the new name, old rows under the old.
//   • changeCategory changes what a material's MatID IS, since the id is built
//     from category+name. Without the rebuild, every stored MatID for it went
//     stale; refreshDerivedSheets_ repairs them as it goes.
function manageMaterial(data, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
  return withStockLock_(function () { return manageMaterialLocked_(data, auth); });
}

function manageMaterialLocked_(data, auth) {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var archive = ss.getSheetByName(SHEETS.ARCHIVE);
  if (!archive) throw new Error('Archive sheet not found.');

  var op  = data.op;
  var cat = String(data.category || '').trim().toUpperCase();
  var nm  = String(data.name     || '').trim().toUpperCase();

  // Both sheets, every time. Returns the total so the count reported to the
  // admin covers the rows that were archived out as well as the live ones.
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
    // Change NAME across all rows matching category + oldName
    var oldNm = nm;
    var newNm = String(data.newName || '').trim();
    if (!newNm) throw new Error('New name required.');
    var hit = matches(cat, oldNm), storedNm = sheetSafe_(newNm);
    var count = rewriteBoth(AC.NAME, function (row) { return hit(row) ? storedNm : null; });
    if (count) refreshDerivedSheets_(ss);
    auditLog_(ss, 'RENAME_MATERIAL', auth.email, cat, oldNm, newNm + ' (' + count + ' rows)');
    return { status: 'success', updated: count };

  } else if (op === 'changeCategory') {
    var newCat = String(data.newCategory || '').trim().toUpperCase();
    if (!newCat) throw new Error('New category required.');
    var hitC = matches(cat, nm), storedCat = sheetSafe_(newCat);
    var countC = rewriteBoth(AC.CATEGORY, function (row) { return hitC(row) ? storedCat : null; });
    if (countC) refreshDerivedSheets_(ss);
    auditLog_(ss, 'CHANGE_CAT', auth.email, nm, cat, newCat + ' (' + countC + ' rows)');
    return { status: 'success', updated: countC };

  } else if (op === 'merge') {
    // Rename all rows of sourceName → targetName (same category)
    var srcNm  = nm;
    var tgtNm  = String(data.targetName || '').trim();
    if (!tgtNm) throw new Error('Target name required.');
    var hitM = matches(cat, srcNm), storedTgt = sheetSafe_(tgtNm);
    var countM = rewriteBoth(AC.NAME, function (row) { return hitM(row) ? storedTgt : null; });
    if (countM) refreshDerivedSheets_(ss);
    auditLog_(ss, 'MERGE_MATERIAL', auth.email, cat, srcNm, tgtNm + ' (' + countM + ' rows)');
    return { status: 'success', merged: countM };

  } else if (op === 'deleteRow') {
    var rowIdx = parseInt(data.rowIdx || 0);
    if (rowIdx < 2) throw new Error('Invalid row index.');
    // Log the row content before deleting. AC_WIDTH, not the 19 that used to be
    // hardcoded here: the row grew to 22 columns when pricing was added, so the
    // audit record of a deleted movement had been quietly dropping the PM and
    // both cost columns — the record of a deletion is the one place that must
    // be complete.
    var rowData = archive.getRange(rowIdx, 1, 1, AC_WIDTH).getValues()[0];
    auditLog_(ss, 'DELETE_ROW', auth.email, String(rowData[AC.CATEGORY]), String(rowData[AC.NAME]),
              'row ' + rowIdx + ' — ' + JSON.stringify(rowData.slice(0, 8)));
    archive.deleteRow(rowIdx);
    // LIVE_STOCK/SITE_STOCK/WASTED_STOCK are aggregates built from the archive —
    // deleting a row without recomputing them leaves stale totals behind forever
    // (the deleted movement's effect stays baked in even though the row is gone).
    refreshDerivedSheets_(ss);
    return { status: 'success' };
  }

  throw new Error('Unknown manageMaterial op: ' + op);
}

// ─── INCOMING MATERIALS ───────────────────────────────────────────────────────
// Sheet: INCOMING_V3  Columns (1-indexed, 0-based in array):
//  A=0:ID  B=1:EstDate  C=2:Category  D=3:Name  E=4:Qty  F=5:Unit
//  G=6:Supplier  H=7:PO  I=8:Notes  J=9:Status  K=10:AddedBy  L=11:AddedAt
//  M=12:PM (Project Manager)  N=13:Doc Link (attached PDF/photo URL)
//  O=14:Date Mode  P=15:Est. Date End  Q=16:Date Note
//
// Not every delivery has a date. A supplier says "next week", or "between the
// 5th and the 10th", or nothing at all, and forcing that into a single date
// column means somebody invents one — and an invented date is worse than no
// date, because a week later nobody can tell which is which.
//
// Date Mode is one of:
//   exact   — Est. Date is the day it arrives (the original behaviour)
//   window  — it arrives somewhere between Est. Date and Est. Date End
//   about   — around Est. Date, give or take; Date Note holds what was said
//   unknown — no date at all; Date Note may say why
// Est. Date still carries the anchor for every mode except unknown, so sorting,
// the weekly view and the overdue check keep working without knowing about any
// of this.
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
    // Migrate older sheets one column at a time. Existing rows have a blank
    // Date Mode, which reads as 'exact' — which is what they were.
    var lastCol = sheet.getLastColumn();
    var headers = ['PM','Doc Link','Date Mode','Est. Date End','Date Note'];
    for (var c = 13; c <= 17; c++) {
      if (lastCol < c) sheet.getRange(1, c).setValue(headers[c - 13]).setFontWeight('bold');
    }
  }
  return sheet;
}

function getIncoming(sessionToken) {
  // Apps Script exposes every top-level function to any web app visitor via
  // google.script.run, regardless of whether the app's own frontend calls it
  // directly — this used to check getUserRole() with no token (always
  // NO_SESSION for non-org users) and only blocked DENIED, so an anonymous
  // visitor could call this and read supplier/PO/quantity data with zero
  // authentication. Now requires a real session.
  var auth = getUserRole(sessionToken);
  if (auth.role === 'DENIED' || auth.role === 'NO_SESSION') throw new Error('Not authenticated.');
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
      po:       safeStr_(row[7]),   // Sheets may return a Date if cell was auto-formatted
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
  // Nearest first, and anything with no date at all last rather than first —
  // an empty string sorts before every real date, so "we don't know yet" used
  // to jump the queue ahead of tomorrow's delivery.
  return results.sort(function(a, b) {
    var ka = a.estDate || '9999-12-31';
    var kb = b.estDate || '9999-12-31';
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

// Sheets hands back a Date for a date-formatted cell and a string for anything
// else; both have to come out as YYYY-MM-DD.
function incomingCellDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v ? String(v).substring(0, 10) : '';
}

// Noon rather than midnight, so converting the string to a Date cannot land on
// the previous day in a timezone west of the script's.
function incomingDateCell_(ymd) {
  return ymd ? new Date(String(ymd) + 'T12:00:00') : '';
}

// The three states the Status dropdown offers. add and update used to disagree:
// addIncoming hard-coded 'Pending' and threw the form's value away, so a
// delivery entered as already Arrived (or cancelled on the spot) came back
// Pending and had to be edited a second time to stick. One function answers for
// both now, and anything unrecognised falls back to Pending rather than writing
// a status that no filter in the app matches.
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
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureIncomingSheet_(ss);
  var id    = 'INC-' + new Date().getTime();
  var mode    = incomingDateMode_(data.dateMode);
  var estDate = incomingDateCell_(mode === 'unknown' ? '' : data.estDate);
  var estEnd  = incomingDateCell_(mode === 'window'  ? data.estDateEnd : '');
  var docLink = uploadIncomingDoc_(data.docFile, data.name, data.po);
  sheet.appendRow([
    id,
    estDate,
    sheetSafe_(String(data.category || '').toUpperCase().trim()),
    sheetSafe_(String(data.name     || '').trim()),
    Number(data.qty      || 0),
    sheetSafe_(String(data.unit     || 'UNIT')),
    sheetSafe_(String(data.supplier || '')),
    sheetSafe_(String(data.po       || '')),
    sheetSafe_(String(data.notes    || '')),
    incomingStatus_(data.status),
    auth.email,
    new Date(),
    sheetSafe_(String(data.pm       || '')),
    docLink,
    mode,
    estEnd,
    sheetSafe_(String(data.dateNote || ''))
  ]);
  return { status: 'success', id: id, docLink: docLink };
}

// Uploads an attached PDF/photo for an incoming item; returns the Drive URL ('' if none).
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
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet  = ensureIncomingSheet_(ss);   // guarantees the Doc Link column exists
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id)) {
      var mode    = incomingDateMode_(data.dateMode);
      var estDate = mode === 'unknown' ? ''
                  : (data.estDate ? incomingDateCell_(data.estDate) : values[i][1]);
      var estEnd  = incomingDateCell_(mode === 'window' ? data.estDateEnd : '');
      // New file replaces the old link; otherwise keep whatever was there (col N, idx 13)
      var docLink = data.docFile && data.docFile.fileData
        ? uploadIncomingDoc_(data.docFile, data.name, data.po)
        : (values[i][13] || '');
      sheet.getRange(i + 1, 1, 1, 17).setValues([[
        data.id,
        estDate,
        sheetSafe_(String(data.category || '').toUpperCase().trim()),
        sheetSafe_(String(data.name     || '').trim()),
        Number(data.qty      || 0),
        sheetSafe_(String(data.unit     || 'UNIT')),
        sheetSafe_(String(data.supplier || '')),
        sheetSafe_(String(data.po       || '')),
        sheetSafe_(String(data.notes    || '')),
        incomingStatus_(data.status),
        values[i][10],          // preserve addedBy
        values[i][11],          // preserve addedAt
        sheetSafe_(String(data.pm || '')),  // PM — Project Manager
        docLink,
        mode,
        estEnd,
        sheetSafe_(String(data.dateNote || ''))
      ]]);
      return { status: 'success', docLink: docLink };
    }
  }
  throw new Error('Incoming item not found: ' + data.id);
}

function deleteIncoming(id, sessionToken) {
  var auth = getUserRole(sessionToken);
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

// ═══ DATA QUALITY SWEEP ══════════════════════════════════════════════════════
//
// Jose asked why the app had stopped finding things to correct. The honest
// answer was that it never started: the only checker that existed ran WHILE
// SOMEBODY TYPED a material name, and nothing had ever looked at the rows
// already saved.
//
// What he asked for: "revisar todos los nombres parecidos, los nombres de
// proyectos parecidos, las destinations y sugerir que se las corrija, también
// buscar palabras mal escritas, y arreglar movimientos según el id, porque si
// tienen el mismo id es porque son el mismo material."
//
// Three decisions shape everything below.
//
// 1. **It runs when asked, and never on its own.** A sweep that interrupts a
//    save is the kind of feature people turn off, and one that emails a daily
//    digest becomes a daily thing to ignore. On demand also removes a whole
//    subsystem: with no unsolicited nagging there is nothing to dismiss, so
//    there is no "remind me later" state to store, get wrong, or lose in a
//    restore.
//
// 2. **Nothing is ever applied on its own.** Merging two materials moves
//    stock. Every finding is a proposal with the evidence attached — how many
//    rows use each spelling, what the app is going on — and a person presses
//    the button.
//
// 3. **Confidence is not uniform, and pretending otherwise is the trap.**
//    "Written two ways" is nearly certain. "Looks similar" is a guess that gets
//    JJF 109 and JJF 110 wrong. They are separate families here, and only the
//    certain ones get an Apply button at all.

var DQ_MAX_FINDINGS = 150;    // a first scan of an imported year would produce thousands
var DQ_SIMILAR_CAP  = 300;    // pairwise comparison is O(n²); above this, skip that family

// The key that decides whether two written forms are THE SAME THING.
//
// normalizeString() — the one MatID is built from — keeps spaces, so to the app
// "BS10" and "BS 10" are two different materials. That is exactly what Jose
// found in his own history: the same window received under one spelling and
// transferred under the other, reading as two unrelated things.
//
// This key throws away everything that is not a letter or a digit. "BS10" and
// "BS 10" collapse together. "JJF 109" and "JJF 110" do NOT, because their
// digits differ — which is the trap that makes a naive similarity matcher
// dangerous on real material names, and the reason this is a separate, safer
// test than the one further down.
function squashKey_(v) {
  return normalizeString(v).replace(/[^A-Z0-9]/g, '');
}

// Read-only, and deliberately NOT ensureArchiveHistorySheet_: a scan that
// creates a sheet as a side effect is a scan that changed the thing it was
// asked to inspect.
function dqReadRows_(ss) {
  var out = [];
  [ss.getSheetByName(SHEETS.ARCHIVE), ss.getSheetByName(SHEETS.ARCHIVE_HISTORY)].forEach(function (sheet) {
    if (!sheet) return;
    var last = sheet.getLastRow();
    if (last < 2) return;
    var width = Math.max(sheet.getLastColumn(), AC_WIDTH);
    var vals  = sheet.getRange(2, 1, last - 1, width).getValues();
    for (var i = 0; i < vals.length; i++) out.push(vals[i]);
  });
  return out;
}

// A stable id for a finding, so the client can send one back to be applied
// without the server having to remember what it just said.
function dqId_(parts) {
  return parts.map(function (p) { return String(p == null ? '' : p); }).join('~');
}

function runDataQualityScan(data) {
  var auth = requireAuth_('ADMIN');
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var rows = dqReadRows_(ss);

  var findings = [];

  // ── Family 1: the same thing, written two ways ────────────────────────────
  // Highest confidence in the whole sweep, and the one that fixes what Jose
  // actually saw. Four columns get the same treatment, because the mistake is
  // the same mistake in all four: somebody typed it slightly differently.
  var SPELL = [
    { field: 'material', label: 'material' },
    { field: 'project',  label: 'project',  col: AC.PROJECT },
    { field: 'supplier', label: 'supplier', col: AC.SUPPLIER },
    { field: 'rack',     label: 'rack',     cols: [AC.SRC_LOC, AC.DEST_LOC] }
  ];

  SPELL.forEach(function (spec) {
    var groups = {};   // squashKey → { cat, spellings: { storedText: count } }
    rows.forEach(function (row) {
      function add(rawVal, cat) {
        var val = String(rawVal || '').trim();
        if (!val) return;
        // GENERIC is the app's own word for "unassigned", not a customer's
        // project. Offering to merge real job names into it would be the
        // GENERIC bug all over again, in bulk.
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
      // Most-used spelling wins by default. The panel still lets the admin
      // pick a different survivor — the app knows which is commonest, not
      // which is right.
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

  // ── Family 2: a movement is missing what its siblings have ────────────────
  // Grouped by MatID, which is Jose's own rule: "si tienen el mismo id es
  // porque son el mismo material."
  //
  // ONLY supplier, and only when the material's whole history agrees on one.
  // GC, PO and PM are deliberately excluded even though the same gap exists in
  // them: a purchase order is a document for one specific delivery, and a
  // general contractor and a project manager belong to a JOB. Copying any of
  // them onto a transfer in bulk would have the app assert something nobody
  // told it — the exact failure that produced GENERIC on Jose's transfers.
  // They stay where they already are: offered one row at a time in the edit
  // form (v11.17), where a person is looking at them.
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
    // Only TRANSFER, matching what v11.16 fixed going forward. An EXIT with no
    // project is a job nobody recorded, and no amount of history can recover
    // which one it was.
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

  // ── Family 3: one of these two is probably a typo ─────────────────────────
  // Jose also asked for "palabras mal escritas". This is that, and it is a
  // GUESS — labelled as one, with no Apply button anywhere on the family.
  //
  // What it looks for is a MISSPELLING, not a different name: two values whose
  // squashed keys are within a character or two of each other. CLIFTONBUILDING
  // and CLIFTONBULIDING are the same job typed twice. GE SILPRUF SEALANT and
  // GE SILPRUF SEALER share most of their words and are three characters
  // apart, and this deliberately does NOT raise them — sharing words is what
  // product families do, and a checker that flags every one of them is a
  // checker that gets scrolled past.
  //
  // Two guards do the real work:
  //   * DIGITS MUST MATCH. JJF 109 and JJF 110 are one character apart and are
  //     two different products. Nothing with differing digits is ever raised.
  //   * SHORT KEYS ARE SKIPPED. Rack codes and three-letter names are legitimately
  //     one character apart, all day long.
  var SIMILAR_IN = [
    { field: 'material', byCategory: true },
    { field: 'project',  byCategory: false },
    { field: 'supplier', byCategory: false }
  ];
  // Racks are deliberately absent: A1A and A1B are one character apart and are
  // two different shelves. Family 1 still catches "A1A" vs "A 1 A", which is
  // the rack mistake that actually happens.
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
      // Pairwise is O(n²). Above the cap the sweep says nothing about this
      // family rather than spending a customer's six-minute execution budget
      // on it.
      if (names.length > DQ_SIMILAR_CAP) return;
      for (var i = 0; i < names.length; i++) {
        for (var j = i + 1; j < names.length; j++) {
          var a = names[i], b = names[j];
          var ka = squashKey_(a), kb = squashKey_(b);
          if (ka === kb) continue;                          // family 1 already has it
          if (dqDigitsOf_(a) !== dqDigitsOf_(b)) continue;  // different part numbers
          var shortest = Math.min(ka.length, kb.length);
          if (shortest < 4) continue;                       // too short to judge
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

  // Biggest first: a spelling used across 40 rows matters more than one used
  // twice, and an admin who only has ten minutes should spend them at the top.
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

// The digits in a name, in order, as one string. "JJF 109" → "109".
// Two names with different digits are different products, whatever else they
// share.
function dqDigitsOf_(v) {
  return (String(v || '').match(/\d+/g) || []).join('.');
}

// Levenshtein distance, abandoned as soon as it is known to exceed `max`.
//
// The bail-out is not an optimisation detail: this runs over every pair of
// names in a category, and Apps Script gives a script six minutes for the
// whole request. Most pairs are wildly different and can be dismissed after a
// couple of rows of the matrix.
//
// Two rows of the matrix rather than the whole thing, for the same reason —
// nothing here needs to know HOW the two words differ, only whether it is by
// more than a typo's worth.
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
    // Every remaining path goes through this row, so nothing below it can end
    // up smaller than the row's smallest value.
    if (best > max) return max + 1;
    for (j = 0; j <= lb; j++) prev[j] = cur[j];
  }
  return prev[lb];
}

// ─── APPLYING ONE FINDING ────────────────────────────────────────────────────
// Every spelling fix goes through the merge function that already exists for
// that kind of value — the same code the Settings screens call, already
// locked, already rewriting BOTH archives, already refreshing the derived
// sheets. Writing a second path would mean two ways to merge a material, and
// the one used less often would be the one that was wrong.
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
    // EXACT match, not case-insensitive — and that is the whole point.
    //
    // This filter used to uppercase both sides, copied from the Settings merge
    // where it makes sense (you cannot merge a value into itself). Here it
    // threw away the commonest finding of all: "SWEETWATER - SPRING CANYON 2"
    // and "Sweetwater - SPRING CANYON 2" are the SAME letters in different
    // case, so uppercasing made them equal, the list came out empty, and the
    // sweep answered "nothing to merge — that is already the only spelling"
    // about two spellings it had just found itself.
    //
    // A difference of case is a real difference in what is stored, and
    // normalising it is a merge like any other. Only a byte-for-byte repeat of
    // the survivor is dropped.
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

  // 'similar' has no apply on purpose — see the comment on family 3.
  throw new Error('This finding is a suggestion to look at, not something the app can apply.');
}

// Fills ONE blank column, on the rows of ONE material, with ONE value the
// material's own history already agrees on.
//
// The narrowness is the safety. It never overwrites a cell that has something
// in it, it never touches a material other than the one named, and it refuses
// outright if the caller's value is not the value the archive actually says —
// so a stale panel left open while somebody else edits cannot write yesterday's
// answer into today's rows.
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

  // Re-derive the agreed value from the archive rather than trusting the one
  // the panel is holding. If the answer changed since the scan, this stops
  // instead of writing something nobody proposed.
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

  var stored = sheetSafe_(value);
  var filled = 0;
  [ss.getSheetByName(SHEETS.ARCHIVE), ss.getSheetByName(SHEETS.ARCHIVE_HISTORY)].forEach(function (sheet) {
    if (!sheet) return;
    filled += rewriteArchiveColumn_(sheet, col, function (row) {
      if (normalizeString(row[AC.CATEGORY]) !== wantCat) return null;
      if (normalizeString(row[AC.NAME])     !== wantName) return null;
      var cur = String(row[col] || '').trim();
      if (onlyTransfers) {
        if (String(row[AC.MOVETYPE] || '').toUpperCase().trim() !== 'TRANSFER') return null;
        // Blank OR the placeholder — GENERIC on a transfer is the thing being
        // corrected, not a value to preserve.
        if (cur && normalizeString(cur) !== 'GENERIC') return null;
      } else if (cur) {
        return null;
      }
      return stored;
    });
  });

  // Only the project column feeds anything the stock engine reads, but a
  // refresh after either is cheap next to being wrong.
  if (filled) refreshDerivedSheets_(ss);
  auditLog_(ss, 'DATA_FIX', auth.email,
    field + ' → "' + value + '" on ' + parts[0] + ' / ' + parts[1],
    String(filled) + ' rows', '');
  return { status: 'success', rows: filled };
}

// ─── READ AN EMAIL INTO EXPECTED DELIVERIES ──────────────────────────────────
// The supplier's confirmation email already contains everything an "expected
// delivery" record needs. Retyping it is the boring, error-prone part of the
// job, and it is the reason the Incoming tab sits empty in most installations.
//
// This takes the text of the email — pasted in, no Gmail permission of any
// kind — and returns DRAFTS for a person to check before anything is saved. It
// never writes: extraction from prose is a guess, and a guess that saves itself
// is how a warehouse ends up with deliveries nobody ordered.
//
// Reading the message the user pastes needs no scope at all. That is the whole
// point: the alternative, searching their mailbox, needs Google's restricted
// mail scope and an annual paid audit to distribute (see isGmailScanEnabled).
function parseIncomingEmail(data, auth) {
  auth = requireAuth_('ADMIN');
  // One email is one Gemini call against the owner's paid quota.
  requireQuota_('emailparse', auth.email, 20, 600);

  var text = String((data && data.text) || '').trim();
  if (!text) throw new Error('Paste the email first.');
  if (text.length < 25) throw new Error('That is too short to read anything out of.');
  if (text.length > 12000) text = text.substring(0, 12000);

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  // NO_AI_KEY is a marker, not a sentence. This is not a failure — the feature
  // is simply switched off — so the browser catches this exact string and
  // shows an explanation with a button that turns it on, instead of the red
  // error a broken thing gets. What used to be here was four lines of Apps
  // Script editor instructions, printed inside a warehouse app.
  if (!apiKey) throw new Error('NO_AI_KEY');

  // The customer's own categories and units, so the answer lands on the lists
  // this installation actually uses instead of inventing new ones.
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

  // Everything the model returns is normalised here rather than trusted. A
  // date mode outside the four we support, or an end date on something that is
  // not a window, would be written straight into the sheet otherwise.
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

// ─── GMAIL SCANNER ───────────────────────────────────────────────────────────
// Searches Gmail for delivery/shipment emails, parses each with Gemini,
// and returns draft Incoming items for the user to review before saving.
//
// Requires: GEMINI_API_KEY in Script Properties
//           Gmail OAuth scope (auto-granted when GmailApp is used)
//
// ─── MODIFY MOVEMENT ────────────────────────────────────────────────────────
// Admin only. Updates a row in MASTER_ARCHIVE_V3, logs to AUDIT_LOG, emails admin.
// Editing a saved movement changes stock — quantity, category and name all
// feed the totals — so it is a read-modify-write on the archive and belongs
// behind the same door as saving one. It went years without it: an admin
// correcting yesterday's exit while the floor recorded a new one could lose
// one of the two changes, with both people seeing "saved ✓".
//
// Split in two so the lock wraps the work without re-indenting 140 lines of
// audited logic: the auth checks stay out here (they should refuse a VIEWER
// without ever queueing for the lock), everything that touches the sheet goes
// inside.
function modifyMovement(data, auth) {
  // Was flatly ADMIN-only. Now: ADMIN always, or WAREHOUSE if the admin has
  // switched on "Edit movements" for their role in Settings → Permissions —
  // see requirePerm_. VIEWER never reaches here: requireAuth_('WRITE')
  // refuses it before the permission is even checked.
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

  // Read current row (20 cols)
  var range   = archive.getRange(rowIdx, 1, 1, AC_WIDTH);
  var rowVals = range.getValues()[0];

  // Row numbers shift whenever archiveOldMovements() reconciles the sheet —
  // guard against silently editing the wrong movement if the client's cached
  // rowIdx is now stale (e.g. an archiving pass ran between page load and this
  // edit). The client sends what it expects to find there; if it doesn't match,
  // the row moved — fail loudly instead of overwriting a different movement.
  if (data.expectedCategory !== undefined || data.expectedName !== undefined) {
    var curCat  = String(rowVals[AC.CATEGORY] || '').trim().toUpperCase();
    var curName = String(rowVals[AC.NAME]     || '').trim().toUpperCase();
    var expCat  = String(data.expectedCategory || '').trim().toUpperCase();
    var expName = String(data.expectedName     || '').trim().toUpperCase();
    if (curCat !== expCat || curName !== expName) {
      throw new Error('This row has changed (data was reorganized). Please refresh and try again.');
    }
  }

  // Map of field key → { col (0-indexed), label }
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

  // Fields whose stored casing/whitespace MUST match how addMovementsBatch_
  // writes them, or stock aggregation silently stops recognizing this row as
  // "the same material/rack" as every other row — even a full stock rebuild
  // can't fix it then, because the rebuild trusts whatever's actually stored.
  // This is exactly the bug class that caused stock to look "still in the
  // warehouse" after a real EXIT: an edited row's rack name (or category)
  // ended up with different case/whitespace than the row it should net against.
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
    // The edit form deliberately shows GENERIC as an EMPTY project box, since
    // GENERIC is the app's word for "in stock, unassigned" and not the name of
    // anybody's job. Re-derive it here, or simply opening an ENTRY and saving
    // an unrelated change would blank the project and log it as an edit the
    // person never made.
    if (key === 'project' && !newStr &&
        String(rowVals[AC.MOVETYPE] || '').toUpperCase() === 'ENTRY') {
      newStr = 'GENERIC';
    }
    if (oldStr !== newStr) {
      origVals[f.label] = oldStr;
      changes.push(f.label + ': "' + oldStr + '" → "' + newStr + '"');
      rowVals[f.col] = (key === 'qty') ? (parseFloat(newStr) || 0) : sheetSafe_(newStr);
    }
  });

  if (!changes.length) throw new Error('No changes detected — nothing to save.');

  // An ADJUST keeps its direction in WHICH rack column is filled — see
  // adjustDirection_. An edit that fills both, or empties both, leaves a row
  // that no stock reader has a branch for: it would quietly stop counting
  // toward stock, and no rebuild could recover what was meant, because the
  // intent was only ever in the shape of the row. Refuse it here, while the
  // person is still looking at the form and can say which way it went.
  if (String(rowVals[AC.MOVETYPE] || '').toUpperCase() === 'ADJUST') {
    var eSrc = normalizeString(String(rowVals[AC.SRC_LOC]  || ''));
    var eDst = normalizeString(String(rowVals[AC.DEST_LOC] || ''));
    if (!adjustDirection_(eSrc, eDst)) {
      throw new Error('An adjustment needs exactly ONE rack: Source Loc if the count came up ' +
        'short, Dest Loc if it came up long. Leave the other one empty.');
    }
  }

  // If category or name changed, the stored MatID must be recomputed too —
  // otherwise this row keeps pointing at the OLD material forever, silently
  // mismatching every other row for what's now supposed to be the same item.
  if (origVals['Category'] !== undefined || origVals['Name'] !== undefined) {
    rowVals[AC.MAT_ID] = getMaterialId(rowVals[AC.CATEGORY], rowVals[AC.NAME]);
  }

  // Write updated row back
  range.setValues([rowVals]);
  // Same class of bug as manageMaterial's deleteRow: qty/category/location edits
  // change what LIVE_STOCK/SITE_STOCK/WASTED_STOCK should total to — without this,
  // the derived sheets keep reflecting the pre-edit numbers indefinitely.
  refreshDerivedSheets_(ss);

  // Audit log
  auditLog_(ss, 'MODIFY_MOVEMENT', auth.email,
    'Row ' + rowIdx + ' | Reason: ' + reason,
    changes.join(' | '), '');

  // Email admin
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

  return { status: 'success', changes: changes.length };
}

// ── Diagnostic — run this in GAS Editor to identify load issues ───────────────
// Run this function directly from the GAS editor. Check Execution Log for results.
function diagnoseApp_() {
  // Editor-only: it dumps config and row counts to the log.
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

// ── Quick test — run this directly in GAS Editor to debug Gemini ──────────────
function testGemini_() {
  // Editor-only: every call spends the owner's Gemini quota.
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
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_

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

  // Build Gmail search query
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

  // ── Step 1: collect all email summaries (no Gemini calls yet) ──
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

  // ── Step 2: ONE batch Gemini call for all emails ──
  var parsedArray = parseEmailsBatch_(emailMetas, apiKey);

  // ── Step 3: merge parsed results back with metadata ──
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

// ── Batch Gemini parser — ONE API call for all emails ────────────────────────
// Returns an array of parsed objects, one per email, in the same order.
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

    // Strip markdown fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Parse the array
    try {
      var arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('Not an array');
      // Pad with nulls if Gemini returned fewer items
      while (arr.length < emailMetas.length) arr.push(null);
      return arr;
    } catch (eJson) {
      // Try extracting a JSON array with regex
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

// Calls Gemini 1.5 Flash with plain-text email content.
// Returns a parsed object {name, category, qty, unit, supplier, po, estDate, project, pm, notes, isDelivery}
// or null on failure.
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
          // Quota exceeded — no point trying other models with same key
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

      // Safe access — content may be missing if Gemini applied safety filters
      var cand    = result.candidates[0];
      var content = cand && cand.content;
      var parts   = content && content.parts;
      var text    = (parts && parts[0] && parts[0].text) ? String(parts[0].text) : '';

      if (!text) {
        Logger.log('Gemini ' + models[m] + ': empty text. finishReason=' + (cand && cand.finishReason || '?'));
        continue;
      }

      // Strip markdown fences
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

  // All models failed — return a minimal object so the card still renders
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

// ─── MONITORED MATERIALS ──────────────────────────────────────────────────────
// null  = monitor ALL materials (default — no filter)
// array = monitor only these material names in the low-stock alert banner

function getMonitoredMaterials(sessionToken) {
  var auth = getUserRole(sessionToken);
  if (auth.role === 'DENIED' || auth.role === 'NO_SESSION') throw new Error('Not authenticated.');
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
function extractDocumentInfo(fileData, mimeType, sessionToken) {
  // Called directly via google.script.run (not through processMovement), and
  // Apps Script exposes every top-level function to any web app visitor — so
  // this function's own check is the ONLY thing standing between an anonymous
  // visitor and burning the owner's paid Gemini quota. It used to call
  // getUserRole() with no token (always NO_SESSION for non-org users) and only
  // blocked DENIED — NO_SESSION sailed straight through, meaning anyone who
  // opened the web app URL, logged in or not, could call this and rack up API
  // costs. Now requires real authentication, same as everything else.
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

function setMonitoredMaterials(names, auth) {
  auth = requireAuth_('ADMIN');   // ignores any caller-supplied `auth` — see requireAuth_
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
