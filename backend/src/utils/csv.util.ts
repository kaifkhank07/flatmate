import { parse } from 'csv-parse/sync';

export interface RawCsvRow {
  [key: string]: string | undefined;
}

export interface ParsedCsvResult {
  headers: string[];
  rows: RawCsvRow[];
}

/**
 * Parses a CSV Buffer into headers array and key-value row objects.
 */
export const parseCsvBuffer = (buffer: Buffer): ParsedCsvResult => {
  let content = buffer.toString('utf-8');

  // Strip UTF-8 Byte Order Mark (BOM) if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  if (!content.trim()) {
    throw new Error('CSV file is empty');
  }

  const rows: RawCsvRow[] = parse(content, {
    columns: (headerRow: string[]) =>
      headerRow.map((col) => col.trim()),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });

  // Extract header column names
  let headers: string[] = [];
  if (rows.length > 0 && rows[0]) {
    headers = Object.keys(rows[0]);
  } else {
    // If there were only headers in the file, parse headers separately
    const headerOnlyRecords: string[][] = parse(content, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
    if (headerOnlyRecords.length > 0) {
      headers = headerOnlyRecords[0].map((h) => h.trim());
    }
  }

  return { headers, rows };
};
