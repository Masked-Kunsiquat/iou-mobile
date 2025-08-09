import * as FileSystem from 'expo-file-system';
import { openDB } from './db';

export async function exportJson(): Promise<string> {
  const db = await openDB();
  const [people, debts, payments] = await Promise.all([
    db.getAllAsync('SELECT * FROM people'),
    db.getAllAsync('SELECT * FROM debts'),
    db.getAllAsync('SELECT * FROM payments'),
  ]);
  const payload = JSON.stringify({ people, debts, payments }, null, 2);
  const path = FileSystem.documentDirectory + 'iou-backup.json';
  await FileSystem.writeAsStringAsync(path, payload);
  return path; // you can share this with expo-sharing if you like
}
