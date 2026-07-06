// Risoluzione percorsi ed estrazione on-demand dell'export WordPress (database.sql.gz + files.tar.gz).
// L'export grezzo resta sempre FUORI dal repo (puo' contenere email/contatti): questo modulo legge da
// WP_EXPORT_DIR e scrive gli intermedi di cache in WP_EXPORT_DIR/.cache, mai dentro il repo.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { extractTable } from './mysqldump.js';

export const TABLE_PREFIX = process.env.WP_TABLE_PREFIX || 'eTGmm_';

function requireExportDir() {
  const dir = process.env.WP_EXPORT_DIR;
  if (!dir) {
    throw new Error(
      'WP_EXPORT_DIR non impostata. Deve puntare a una cartella con database.sql(.gz) e files.tar.gz ' +
        '(gli archivi originali scaricati da Elementor/WordPress).'
    );
  }
  return dir;
}

/** Ritorna il path al database.sql decompresso, decomprimendolo da .gz se serve. */
export function ensureDatabaseSql() {
  const dir = requireExportDir();
  const sqlPath = path.join(dir, 'database.sql');
  if (fs.existsSync(sqlPath)) return sqlPath;
  const gzPath = path.join(dir, 'database.sql.gz');
  if (!fs.existsSync(gzPath)) {
    throw new Error(`Non trovo ${sqlPath} ne' ${gzPath} in WP_EXPORT_DIR=${dir}`);
  }
  const buf = zlib.gunzipSync(fs.readFileSync(gzPath));
  fs.writeFileSync(sqlPath, buf);
  return sqlPath;
}

/** Ritorna la cartella con wp-content estratto, estraendola da files.tar.gz se serve (solo uploads). */
export function ensureUploadsExtracted() {
  const dir = requireExportDir();
  const uploadsDir = path.join(dir, 'files', 'wp-content', 'uploads');
  if (fs.existsSync(uploadsDir)) return uploadsDir;
  const tarPath = path.join(dir, 'files.tar.gz');
  if (!fs.existsSync(tarPath)) {
    throw new Error(`Non trovo ${uploadsDir} ne' ${tarPath} in WP_EXPORT_DIR=${dir}`);
  }
  // Estrae solo wp-content/uploads: evita di scompattare temi/plugin (centinaia di MB inutili).
  // --force-local: senza questo flag, il tar di Git-for-Windows/MSYS interpreta un path
  // "C:\..." come "host:path" remoto (errore "Cannot connect to C:") invece che come path locale.
  execFileSync(
    'tar',
    ['--force-local', '-xzf', tarPath, '-C', dir, 'files/wp-content/uploads'],
    { stdio: 'inherit' }
  );
  return uploadsDir;
}

function cacheDir() {
  const dir = path.join(requireExportDir(), '.cache');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Path di un file di cache/intermedio (es. normalized-pages.json), sempre fuori dal repo. */
export function cachePath(fileName) {
  return path.join(cacheDir(), fileName);
}

/** Carica (con cache su disco) tutte le righe di una tabella wp_* come array di array di valori. */
export function loadTable(tableNameWithoutPrefix) {
  const table = TABLE_PREFIX + tableNameWithoutPrefix;
  const cachePath = path.join(cacheDir(), `${table}.json`);
  const sqlPath = ensureDatabaseSql();
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).mtimeMs >= fs.statSync(sqlPath).mtimeMs) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const rows = extractTable(sql, table);
  fs.writeFileSync(cachePath, JSON.stringify(rows));
  return rows;
}
