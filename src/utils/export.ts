// @ts-nocheck
export function toCSV(data: any[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? '"' + str.replace(/"/g, '""') + '"'
          : str;
      })
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function toSQL(tableName: string, data: any[]): string {
  if (!data || !data.length) return `-- Table ${tableName} is empty\n`;
  const headers = Object.keys(data[0]);
  const headerStr = headers.map((h) => `"${h}"`).join(", ");
  
  const valuesLines = data.map((row) => {
    const vals = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "NULL";
      if (typeof val === "number" || typeof val === "boolean") return String(val);
      if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    return `INSERT INTO "${tableName}" (${headerStr}) VALUES (${vals.join(", ")}) ON CONFLICT DO NOTHING;`;
  });

  return `-- Data dump for table ${tableName} (${data.length} rows)\n` + valuesLines.join("\n") + "\n";
}

export function downloadFile(content: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJSON(data: any, filename: string) {
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");
}

export function exportAsCSV(data: any[], filename: string) {
  downloadFile(toCSV(data), filename, "text/csv");
}

export function exportAsSQL(tableName: string, data: any[], filename: string) {
  downloadFile(toSQL(tableName, data), filename, "text/plain");
}

export function getExportFilename(table: string, format: "json" | "csv" | "sql"): string {
  const date = new Date().toISOString().split("T")[0];
  return "gameflex_" + table + "_" + date + "." + format;
}

