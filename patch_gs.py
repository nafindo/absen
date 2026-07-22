def patch():
    with open("d:/absen/code.gs", "r", encoding="utf-8") as f:
        content = f.read()
    
    if "function updateRow(" not in content:
        func = """
function updateRow(sheetName, idColName, idValue, updates, options) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return false;
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    const idColIdx = headers.indexOf(idColName);
    if (idColIdx === -1) return false;
    
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColIdx]) === String(idValue)) {
        if (options && options.checkOwnership) {
          const ownerIdx = headers.indexOf(options.ownerCol);
          if (ownerIdx > -1 && String(values[i][ownerIdx]) !== String(options.ownerId)) {
            return false; // Not the owner
          }
        }
        
        for (const key in updates) {
          const updateIdx = headers.indexOf(key);
          if (updateIdx > -1) {
            sheet.getRange(i + 1, updateIdx + 1).setValue(updates[key]);
          }
        }
        return true;
      }
    }
    return false;
  } catch(e) {
    Logger.log("Error in updateRow: " + e.toString());
    return false;
  }
}
"""
        content += func
        with open("d:/absen/code.gs", "w", encoding="utf-8") as f:
            f.write(content)
        print("updateRow added.")
    else:
        print("updateRow already exists.")

patch()
