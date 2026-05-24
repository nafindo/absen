import re

with open(r"d:\absen\code.js", "r", encoding="utf-8") as f:
    content = f.read()

old_get_sheet_data = """function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}"""

new_get_sheet_data = """function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const defaultHeaders = getDefaultHeaders(sheetName) || headers;
  return data.slice(1).map(row => {
    const obj = {};
    const maxLen = Math.max(headers.length, defaultHeaders.length, row.length);
    for(let i=0; i<maxLen; i++) {
      let h = headers[i] || defaultHeaders[i] || ('Col' + i);
      obj[h] = row[i];
    }
    return obj;
  });
}"""

content = content.replace(old_get_sheet_data, new_get_sheet_data)

with open(r"d:\absen\code.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated getSheetData in code.js")
