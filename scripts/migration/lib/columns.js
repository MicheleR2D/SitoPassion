// Ordine colonne delle tabelle wp_* usate dalla pipeline, letto dai rispettivi CREATE TABLE
// nel dump (database.sql). Serve a trasformare le righe posizionali di mysqldump.js in oggetti.
export const COLUMNS = {
  posts: [
    'ID', 'post_author', 'post_date', 'post_date_gmt', 'post_content', 'post_title',
    'post_excerpt', 'post_status', 'comment_status', 'ping_status', 'post_password',
    'post_name', 'to_ping', 'pinged', 'post_modified', 'post_modified_gmt',
    'post_content_filtered', 'post_parent', 'guid', 'menu_order', 'post_type',
    'post_mime_type', 'comment_count',
  ],
  postmeta: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
  yoast_indexable: [
    'id', 'permalink', 'permalink_hash', 'object_id', 'object_type', 'object_sub_type',
    'author_id', 'post_parent', 'title', 'description', 'breadcrumb_title', 'post_status',
    'is_public', 'is_protected', 'has_public_posts', 'number_of_pages', 'canonical',
  ],
  term_relationships: ['object_id', 'term_taxonomy_id', 'term_order'],
  term_taxonomy: ['term_taxonomy_id', 'term_id', 'taxonomy', 'description', 'parent', 'count'],
  terms: ['term_id', 'name', 'slug', 'term_group'],
  redirection_items: [
    'id', 'url', 'match_url', 'match_data', 'regex', 'position', 'last_count', 'last_access',
    'group_id', 'status', 'action_type', 'action_code', 'action_data', 'match_type', 'title',
  ],
};

export function rowToObject(row, tableKey) {
  const cols = COLUMNS[tableKey];
  if (!cols) throw new Error(`Colonne non definite per la tabella "${tableKey}"`);
  const obj = {};
  cols.forEach((name, i) => (obj[name] = row[i]));
  return obj;
}

export function rowsToObjects(rows, tableKey) {
  return rows.map((row) => rowToObject(row, tableKey));
}
