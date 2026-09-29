import { WorksheetData } from '../services/manualTestingApi';

/**
 * Robust RFC 4180 CSV parser handling quotes, escaped quotes, commas, and newlines.
 */
export function parseCSVText(csvText: string): { columns: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return {
      columns: ['Test Case ID', 'Test Scenario', 'Test Steps', 'Expected Result', 'Status'],
      rows: []
    };
  }

  const rawColumns = rows[0];
  const columns = rawColumns.map((col, idx) => col.trim() || `Column ${idx + 1}`);
  const dataRows = rows.slice(1);

  // Normalize row length to match columns
  const normalizedRows = dataRows.map(row => {
    const padded = [...row];
    while (padded.length < columns.length) {
      padded.push('');
    }
    return padded.slice(0, columns.length);
  });

  return { columns, rows: normalizedRows };
}

/**
 * Dynamically ensures SheetJS / XLSX library is loaded into the browser runtime.
 */
export async function ensureXLSXLoaded(): Promise<any> {
  const win = window as any;
  if (win.XLSX) {
    return win.XLSX;
  }

  return new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.getElementById('sheetjs-cdn-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(win.XLSX));
      existingScript.addEventListener('error', (err) => reject(err));
      if (win.XLSX) return resolve(win.XLSX);
    }

    const script = document.createElement('script');
    script.id = 'sheetjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.async = true;
    script.onload = () => {
      if (win.XLSX) {
        resolve(win.XLSX);
      } else {
        reject(new Error('SheetJS script loaded but XLSX object not found'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load XLSX parser from CDN'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV File into WorksheetData[] preserving arbitrary columns and all worksheets.
 */
export async function parseSpreadsheetFile(file: File): Promise<WorksheetData[]> {
  const fileName = file.name.toLowerCase();

  // CSV parsing
  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    const sheetName = file.name.replace(/\.[^/.]+$/, '') || 'Sheet1';
    const parsed = parseCSVText(text);
    return [
      {
        sheetName,
        columns: parsed.columns,
        columnWidths: parsed.columns.map(() => 180),
        rows: parsed.rows,
      },
    ];
  }

  // Excel parsing (.xlsx, .xls)
  const XLSX = await ensureXLSXLoaded();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const resultSheets: WorksheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // sheet_to_json with header: 1 returns 2D array of rows
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      resultSheets.push({
        sheetName,
        columns: ['Test Case ID', 'Test Scenario', 'Steps', 'Expected Result', 'Status'],
        rows: [],
      });
      continue;
    }

    // Find the first row that has at least one non-empty value to treat as header
    let headerRowIndex = 0;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i] && rawData[i].some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '')) {
        headerRowIndex = i;
        break;
      }
    }

    const rawHeader = rawData[headerRowIndex] || [];
    let maxCols = rawHeader.length;
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      if (rawData[i] && rawData[i].length > maxCols) {
        maxCols = rawData[i].length;
      }
    }
    if (maxCols === 0) maxCols = 5;

    const columns: string[] = [];
    for (let c = 0; c < maxCols; c++) {
      const cellVal = rawHeader[c];
      const colName = cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== ''
        ? String(cellVal).trim()
        : `Column ${c + 1}`;
      columns.push(colName);
    }

    const rows: string[][] = [];
    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r] || [];
      const rowCells: string[] = [];
      let hasContent = false;
      for (let c = 0; c < maxCols; c++) {
        const val = row[c];
        const strVal = val !== undefined && val !== null ? String(val).trim() : '';
        if (strVal !== '') hasContent = true;
        rowCells.push(strVal);
      }
      if (hasContent) {
        rows.push(rowCells);
      }
    }

    resultSheets.push({
      sheetName,
      columns,
      columnWidths: columns.map(() => 180),
      rows,
    });
  }

  if (resultSheets.length === 0) {
    const defaultCols = ['Test Case ID', 'Test Scenario', 'Steps', 'Expected Result', 'Status'];
    resultSheets.push({
      sheetName: 'Sheet1',
      columns: defaultCols,
      columnWidths: defaultCols.map(() => 180),
      rows: [],
    });
  }

  return resultSheets;
}
