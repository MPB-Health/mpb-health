import ExcelJS from 'exceljs';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'number' | 'currency' | 'percent' | 'date';
}

function cellValue(
  row: Record<string, unknown>,
  col: ExportColumn,
): string | number | Date {
  const val = row[col.key];
  if (val === null || val === undefined) return '';
  if (col.format === 'percent' && typeof val === 'number') {
    return `${val.toFixed(1)}%`;
  }
  if (val instanceof Date) return val;
  if (typeof val === 'number' || typeof val === 'string') return val;
  return String(val);
}

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): void {
  const ws = wb.addWorksheet(name.slice(0, 31));
  ws.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || Math.max(col.header.length + 2, 12),
  }));
  for (const row of rows) {
    const mapped: Record<string, string | number | Date> = {};
    for (const col of columns) {
      mapped[col.key] = cellValue(row, col);
    }
    ws.addRow(mapped);
  }
}

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToXLSX(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  sheetName: string,
  filename: string
): void {
  const wb = new ExcelJS.Workbook();
  addSheet(wb, sheetName, columns, rows);
  void saveWorkbook(wb, filename);
}

export function exportMultiSheetXLSX(
  sheets: Array<{
    name: string;
    columns: ExportColumn[];
    rows: Record<string, unknown>[];
  }>,
  filename: string
): void {
  const wb = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    addSheet(wb, sheet.name, sheet.columns, sheet.rows);
  }
  void saveWorkbook(wb, filename);
}
