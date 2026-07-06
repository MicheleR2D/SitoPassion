// Parser minimale per dump mysqldump: estrae le tuple di INSERT INTO per una tabella,
// gestendo correttamente quoting/escaping SQL (necessario perche' i campi contengono
// testo libero con virgole, apostrofi e newline letterali "\n").
export function parseTuple(str) {
  const vals = [];
  let i = 0;
  const n = str.length;
  while (i < n) {
    while (i < n && (str[i] === ',' || str[i] === ' ')) i++;
    if (i >= n) break;
    if (str[i] === "'") {
      i++;
      let out = '';
      while (i < n) {
        if (str[i] === '\\') {
          const next = str[i + 1];
          const map = { n: '\n', r: '\r', t: '\t', '0': '\0', '\\': '\\', "'": "'", '"': '"' };
          out += map[next] !== undefined ? map[next] : next;
          i += 2;
          continue;
        }
        if (str[i] === "'") {
          if (str[i + 1] === "'") {
            out += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        }
        out += str[i];
        i++;
      }
      vals.push(out);
    } else if (str.slice(i, i + 4) === 'NULL') {
      vals.push(null);
      i += 4;
    } else {
      const start = i;
      while (i < n && str[i] !== ',') i++;
      vals.push(str.slice(start, i).trim());
    }
  }
  return vals;
}

export function splitTuples(valuesStr) {
  const tuples = [];
  let depth = 0;
  let inStr = false;
  let start = -1;
  for (let i = 0; i < valuesStr.length; i++) {
    const c = valuesStr[i];
    if (inStr) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === "'") inStr = false;
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === '(') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) tuples.push(valuesStr.slice(start, i));
    }
  }
  return tuples;
}

/** Estrae tutte le righe (come array di valori) inserite in `tableName` dal testo di un dump mysqldump. */
export function extractTable(sqlText, tableName) {
  const re = new RegExp('INSERT INTO `' + tableName + '`[^V]*VALUES\\s*([\\s\\S]*?);\\n', 'g');
  const rows = [];
  let match;
  while ((match = re.exec(sqlText)) !== null) {
    for (const tuple of splitTuples(match[1])) {
      rows.push(parseTuple(tuple));
    }
  }
  return rows;
}
