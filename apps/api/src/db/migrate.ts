import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('Running database migrations...');

  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await db.query(schema);
    console.log('Schema applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();
