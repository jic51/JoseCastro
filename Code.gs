function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OX Glass ERP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function _getArchiveSheet(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName().toLowerCase().trim();
    if (name === "master archive" || name === "movements" || name.indexOf("archive") !== -1) {
      return sheets[i];
    }
  }
  return null;
}

function getInitialData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var archiveSheet = _getArchiveSheet(ss);
    if(!archiveSheet) throw new Error("Base de datos no encontrada.");

    var movements = [];
    var mData = archiveSheet.getDataRange().getValues();
    
    for(var j=1; j<mData.length; j++) {
      var row = mData[j];
      if (!row[1] && !row[2]) continue; 

      movements.push({
        rowIdx: j + 1,
        sysDate: row[0] instanceof Date ? row[0].toLocaleString() : String(row[0] || ""),
        type: String(row[1] || "N/A"),
        name: String(row[2] || "Unnamed"),
        gc: String(row[3] || ""),
        po: String(row[4] || ""),
        qty: Number(row[5] || 0),
        unit: String(row[6] || ""),
        dateRec: row[7] instanceof Date ? row[7].toISOString().split('T')[0] : String(row[7] || ""),
        loc: String(row[8] || ""),
        supplier: String(row[9] || ""),
        comment: String(row[10] || ""),
        status: String(row[11] || ""),
        resp: String(row[12] || ""),
        project: String(row[13] || ""),
        docLink: String(row[15] || ""),
        auditUser: String(row[16] || "System") // Columna Q (17)
      });
    }
    return {movements: movements};
  } catch (err) { throw new Error(err.message); }
}

function processMovement(action, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var archiveSheet = _getArchiveSheet(ss);
    var rootFolderId = "1EPUtu-VY9HaTFexcTg2ab7UtEPhOzzpz"; 
    var userEmail = Session.getActiveUser().getEmail() || "Unknown User";
    
    var allLinks = [];
    if (data && data.files && data.files.length > 0) {
      var rootFolder = DriveApp.getFolderById(rootFolderId);
      var folderName = (data.project || data.po || "General").toString().replace(/[/\\?%*:|"<>]/g, '-');
      var folders = rootFolder.getFoldersByName(folderName);
      var targetFolder = folders.hasNext() ? folders.next() : rootFolder.createFolder(folderName);
      
      data.files.forEach(function(f) {
        var blob = Utilities.newBlob(Utilities.base64Decode(f.fileData), f.fileMimeType, f.fileName);
        var file = targetFolder.createFile(blob);
        // Dentro de processMovement...
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(e) {
          // El archivo se sube, pero queda privado si la empresa restringe el sharing
          console.log("No se pudo cambiar el permiso de compartir: " + e.message);
        }
        allLinks.push(file.getUrl());
      });
    }
    var linksString = allLinks.join("\n");

    if(action === "addMovement") {
      var row = [
        new Date(), data.type, data.name, data.gc, data.po, data.qty, data.unit, data.dateRec,
        data.loc, data.supplier, data.comment, data.status, data.resp, data.project, data.matId, linksString, userEmail
      ];
      archiveSheet.appendRow(row);
      return {status: "success"};
    }
    
    if(action === "updateDocument") {
      if (linksString !== "" && data.rowIdx) {
        var currentComments = archiveSheet.getRange(data.rowIdx, 11).getValue();
        archiveSheet.getRange(data.rowIdx, 11).setValue(currentComments + "\n[Extra Doc]: " + linksString);
        archiveSheet.getRange(data.rowIdx, 17).setValue(userEmail); // Actualiza quién adjuntó
      }
      return {status: "success"};
    }
  } catch (err) { throw new Error(err.message); }
}