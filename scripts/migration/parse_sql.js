// CLI di debug: node parse_sql.js <path/database.sql> <nomeTabella> [output.json]
import fs from 'node:fs';
import { extractTable } from './lib/mysqldump.js';

const [sqlPath, tableName, outPath] = process.argv.slice(2);
if (!sqlPath || !tableName) {
  console.error('Uso: node parse_sql.js <database.sql> <nomeTabella> [output.json]');
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
const rows = extractTable(sql, tableName);
console.error(`Tuple trovate per ${tableName}:`, rows.length);
fs.writeFileSync(outPath || 'out.json', JSON.stringify(rows));
