import { v4 as uuid } from 'uuid';
import { openDB } from './db';
import { add, sub, lte } from '../utils/money';
import { Debt, Payment, Person } from '../models/types';

export async function upsertPerson(p: Omit<Person,'id'> & Partial<Pick<Person,'id'>>) {
  const db = await openDB();
  const id = p.id ?? uuid();
  await db.runAsync(
    'INSERT OR REPLACE INTO people(id,name,contact,notes) VALUES(?,?,?,?)',
    [id, p.name, p.contact ?? null, p.notes ?? null]
  );
  return id;
}

export async function listPeopleWithTotals() {
  const db = await openDB();
  // totals per person
  const rows = await db.getAllAsync<any>(`
    SELECT p.id, p.name,
      IFNULL((
        SELECT SUM(CAST(d.amountOriginal AS REAL))
        FROM debts d WHERE d.personId=p.id AND d.type='IOU' AND d.status='open'
      ),0) AS iouTotal,
      IFNULL((
        SELECT SUM(CAST(d.amountOriginal AS REAL))
        FROM debts d WHERE d.personId=p.id AND d.type='UOM' AND d.status='open'
      ),0) AS uomTotal
    FROM people p
    ORDER BY p.name COLLATE NOCASE;
  `);
  return rows.map(r => ({
    ...r,
    net: (Number(r.uomTotal) - Number(r.iouTotal)).toFixed(2),
    iouTotal: Number(r.iouTotal).toFixed(2),
    uomTotal: Number(r.uomTotal).toFixed(2),
  }));
}

export async function createDebt(dbt: Omit<Debt,'id'|'status'|'createdAt'> & Partial<Pick<Debt,'id'|'status'|'createdAt'>>) {
  const db = await openDB();
  const id = dbt.id ?? uuid();
  const status = dbt.status ?? 'open';
  const createdAt = dbt.createdAt ?? new Date().toISOString();
  await db.runAsync(
    `INSERT INTO debts(id,type,personId,description,amountOriginal,createdAt,dueAt,status)
     VALUES(?,?,?,?,?,?,?,?)`,
    [id, dbt.type, dbt.personId, dbt.description ?? null, dbt.amountOriginal, createdAt, dbt.dueAt ?? null, status]
  );
  return id;
}

export async function addPayment(p: Omit<Payment,'id'>) {
  const db = await openDB();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO payments(id,debtId,amount,date,note) VALUES(?,?,?,?,?)`,
    [id, p.debtId, p.amount, p.date, p.note ?? null]
  );
  // auto-settle if <= 0.01 balance
  const bal = await getDebtBalance(p.debtId);
  if (lte(bal, '0.01')) {
    await db.runAsync(`UPDATE debts SET status='settled' WHERE id=?`, [p.debtId]);
  }
  return id;
}

export async function getDebtBalance(debtId: string) {
  const db = await openDB();
  const base = await db.getFirstAsync<{amountOriginal: string}>('SELECT amountOriginal FROM debts WHERE id=?', [debtId]);
  const paid = await db.getFirstAsync<{sum: string}>('SELECT IFNULL(SUM(CAST(amount AS REAL)),0) as sum FROM payments WHERE debtId=?', [debtId]);
  const balance = sub(base?.amountOriginal ?? '0', (paid?.sum ?? '0').toString());
  return balance;
}

export async function dashboardTotals() {
  const db = await openDB();
  const iou = await db.getFirstAsync<{sum: string}>(`SELECT IFNULL(SUM(CAST(amountOriginal AS REAL)),0) sum FROM debts WHERE type='IOU' AND status='open'`);
  const uom = await db.getFirstAsync<{sum: string}>(`SELECT IFNULL(SUM(CAST(amountOriginal AS REAL)),0) sum FROM debts WHERE type='UOM' AND status='open'`);
  const totalIOU = (Number(iou?.sum ?? 0)).toFixed(2);
  const totalUOM = (Number(uom?.sum ?? 0)).toFixed(2);
  const net = (Number(totalUOM) - Number(totalIOU)).toFixed(2);
  return { totalIOU, totalUOM, net };
}