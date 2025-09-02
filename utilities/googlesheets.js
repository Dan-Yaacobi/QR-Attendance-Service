import { google } from 'googleapis'

//initialize
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

export async function findParticipant(course_id, phone) {
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

  for (let i = 0; i < values.length; i++) {
    const cell = values[i]?.[0] ?? '';
    if (normalize(cell) === target) {
      return startRow + i; // 1-based row index in the sheet
    }
  }

  return null;
}