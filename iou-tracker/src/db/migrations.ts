import { openDB } from './db';
import { CREATE_META, SCHEMA_V1, SCHEMA_VERSION } from './schema';

export async function migrate() {
  const db = await openDB();
  await db.execAsync(CREATE_META);
  const row = await db.getFirstAsync<{value: string}>('SELECT value FROM meta WHERE key = ?', ['schema_version']);
  const current = row ? Number(row.value) : 0;
  if (current < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.runAsync('INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?)', ['schema_version', String(SCHEMA_VERSION)]);
  }
}
