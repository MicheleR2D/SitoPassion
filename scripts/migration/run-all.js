// Orchestratore: esegue in sequenza tutta la pipeline di migrazione one-shot.
// Richiede WP_EXPORT_DIR (cartella con database.sql[.gz] e files.tar.gz, MAI dentro il repo).
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const STEPS = [
  '01-extract-posts.js',
  '02-extract-pages.js',
  '04-map-media.js',
  '03-html-to-markdown.js',
  '05-generate-redirects.js',
  'verify.js',
];

if (!process.env.WP_EXPORT_DIR) {
  console.error(
    'WP_EXPORT_DIR non impostata. Esempio:\n' +
      '  WP_EXPORT_DIR=/percorso/alla/cartella/con/database.sql.gz-e-files.tar.gz npm run migrate'
  );
  process.exit(1);
}

for (const step of STEPS) {
  console.log(`\n=== ${step} ===`);
  execFileSync('node', [path.join(import.meta.dirname, step)], {
    stdio: 'inherit',
    env: process.env,
  });
}
