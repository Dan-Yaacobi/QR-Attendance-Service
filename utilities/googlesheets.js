import { google } from 'googleapis'

//initialize
console.log('raw env:', JSON.stringify(process.env.SHEETS_SERVICE_ACCOUNT_JSON));
console.log('cwd:', process.cwd());
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.SHEETS_SERVICE_ACCOUNT_JSON,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheets() {
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
};

//Takes the spreadsheet tab like: "דירקטורים נובמבר 501232" and extracts the 501232
function extractCourseIdFromTitle(title) {
  const parts = title.trim().split(/\s+/);

  for (const part of parts){
    if(/^\d+$/.test(part)){
        return part
    }
  }
  return null
}

async function findSheetNameByCourseId(courseId) {
  const sheets = await getSheets();

  const { data } = await sheets.spreadsheets.get({
    spreadsheetId : process.env.MASTER_SHEET_ID,
  });

  const sheet = data.sheets.find(s => {
    const id = extractCourseIdFromTitle(s.properties.title);
    return id === String(courseId);
  });

  if (!sheet) {
    throw new Error(`No sheet found for course_id ${courseId}`);
  }

  return sheet.properties.title;
}

export async function findParticipant(course_id = 501232, phone) {
  let course_today = false
  const sheetName = await findSheetNameByCourseId(course_id);
  const sheets = await getSheets();

  // Preserve leading zeros from the sheet by using FORMATTED_VALUE.
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.MASTER_SHEET_ID,
    range: `${sheetName}!D4:D`,
    valueRenderOption: 'FORMATTED_VALUE',
    majorDimension: 'ROWS',
  });

  const values = data.values || [];
  const startRow = 4;

  const normalize = (s) => String(s ?? '').replace(/\D+/g, ''); // keep digits only
  const target = normalize(phone);

  for (let i = 0; i < values.length; i++){
    const cell = values[i]?.[0] ?? '';
    if (normalize(cell) === target) {
      return startRow + i; // 1-based row index in the sheet
    }
  }
  return null;
}

function todayDdMmYy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

// helper: 1-based column number -> A1 letters (e.g., 5 -> "E")
function toA1(col1) {
  let s = '';
  while (col1 > 0) {
    const m = (col1 - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    col1 = Math.floor((col1 - 1) / 26);
  }
  return s;
}
export async function markParticipant(row,courseId) {
  //set up
  const sheetName = await findSheetNameByCourseId(courseId);
  const sheets = await getSheets();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.MASTER_SHEET_ID,
    range: `${sheetName}!E3:3`,
    valueRenderOption: 'FORMATTED_VALUE',
    majorDimension: 'COLUMNS',
  });

  const cols = data.values ?? [];
  const today = todayDdMmYy();
  //tries to find if there's a course today
  const idx = cols.findIndex(col => (col?.[0] ?? '') === today);
  if (idx === -1) return false;

  const col1 = 5 + idx;
  const targetRange = `${sheetName}!${toA1(col1)}${row}`;

  const { data: existing } = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.MASTER_SHEET_ID,
  range: targetRange,
  valueRenderOption: 'FORMATTED_VALUE',
  majorDimension: 'ROWS',
  });
  const cell_value = existing.values?.[0]?.[0] ?? '';
  if(cell_value == '1'){
    return 1
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.MASTER_SHEET_ID,
    range: targetRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['1']] },
  });

  return 0;
}
