import type { BackupSnapshot } from "./types";

/**
 * Parses a GameFlex SQL dump (a series of INSERT INTO "table" (cols) VALUES (...);)
 * back into per-table row arrays. Only INSERT statements are read — DDL,
 * TRUNCATE, DELETE and DROP statements in the file are deliberately ignored so
 * that importing a dump can never destroy data.
 */
export function parseSqlDump(sql: string): {
  tables: Record<string, Record<string, unknown>[]>;
  ignoredStatements: number;
} {
  const tables: Record<string, Record<string, unknown>[]> = {};
  let ignoredStatements = 0;

  const statements = splitStatements(sql);

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed || trimmed.startsWith("--")) continue;

    const match =
      /^insert\s+into\s+(?:"?[\w]+"?\.)?"?([\w]+)"?\s*\(([^)]*)\)\s*values\s*(.+)$/is.exec(
        trimmed,
      );

    if (!match) {
      if (/^(drop|truncate|delete|alter|update)\b/i.test(trimmed)) ignoredStatements++;
      continue;
    }

    const [, table, columnList, valuesPart] = match;
    const columns = columnList
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);

    for (const tuple of extractTuples(valuesPart)) {
      const values = splitTuple(tuple);
      if (values.length !== columns.length) continue;
      const row: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        row[col] = parseSqlValue(values[i]!);
      });
      (tables[table] ??= []).push(row);
    }
  }

  return { tables, ignoredStatements };
}

/** Splits on semicolons that are not inside a quoted string. */
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]!;
    if (ch === "'") {
      if (inString && sql[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
      current += ch;
      continue;
    }
    if (ch === ";" && !inString) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

/** Pulls each top-level (...) group out of a VALUES clause. */
function extractTuples(valuesPart: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;

  for (let i = 0; i < valuesPart.length; i++) {
    const ch = valuesPart[i]!;
    if (ch === "'") {
      if (inString && valuesPart[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
      current += ch;
      continue;
    }
    if (!inString && ch === "(") {
      depth++;
      if (depth === 1) {
        current = "";
        continue;
      }
    }
    if (!inString && ch === ")") {
      depth--;
      if (depth === 0) {
        tuples.push(current);
        current = "";
        continue;
      }
    }
    if (depth > 0) current += ch;
  }
  return tuples;
}

/** Splits a single tuple body on top-level commas. */
function splitTuple(tuple: string): string[] {
  const out: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i]!;
    if (ch === "'") {
      if (inString && tuple[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
      current += ch;
      continue;
    }
    if (!inString && (ch === "(" || ch === "[")) depth++;
    if (!inString && (ch === ")" || ch === "]")) depth--;
    if (!inString && ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function parseSqlValue(raw: string): unknown {
  const value = raw.trim();
  if (/^null$/i.test(value)) return null;
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  if (value.startsWith("'") && value.endsWith("'")) {
    const unquoted = value.slice(1, -1).replace(/''/g, "'");
    // JSON/JSONB columns are dumped as quoted JSON text — revive them.
    if (/^[[{]/.test(unquoted)) {
      try {
        return JSON.parse(unquoted);
      } catch {
        return unquoted;
      }
    }
    return unquoted;
  }
  return value;
}

/** Wraps a parsed SQL dump into the same shape the JSON restore path uses. */
export function sqlDumpToPayload(sql: string): BackupSnapshot["payload"] {
  const { tables } = parseSqlDump(sql);
  return {
    format: "gameflex-backup",
    version: 2,
    exported_at: new Date().toISOString(),
    tables,
  };
}
