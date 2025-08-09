import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function openDB() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('iou.db');
  return _db;
}
