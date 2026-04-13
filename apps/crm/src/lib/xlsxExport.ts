import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'number' | 'currency' | 'percent' | 'date';
}

export function exportToXLSX(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  sheetName: string,
  filename: string
): void {
  const headers = columns.map((c) => c.header);
  const data = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (val === null || val === undefined) return '';
      if (col.format === 'percent' && typeof val === 'number') {
        return `${val.toFixed(1)}%`;
      }
      if (col.format === 'currency' && typeof val === 'number') {
        return val;
      }
      return val;
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  const colWidths = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length + 2, 12),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportMultiSheetXLSX(
  sheets: Array<{
    name: string;
    columns: ExportColumn[];
    rows: Record<string, unknown>[];
  }>,
  filename: string
): void {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const headers = sheet.columns.map((c) => c.header);
    const data = sheet.rows.map((row) =>
      sheet.columns.map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '';
        if (col.format === 'percent' && typeof val === 'number') {
          return `${val.toFixed(1)}%`;
        }
        return val;
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = sheet.columns.map((col) => ({
      wch: col.width || Math.max(col.header.length + 2, 12),
    }));

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
