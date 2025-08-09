import * as Crypto from 'expo-crypto';
import { openDB } from './db';
import { add, sub, lte, toCentsStr, d } from '../utils/money';
import { Debt, Payment, Person } from '../models/types';

export async function upsertPerson(p: Omit<Person,'id'> & Partial<Pick<Person,'id'>>) {
  const db = await openDB();
  const id = p.id ?? Crypto.randomUUID();
  await db.runAsync(
    'INSERT OR REPLACE INTO people(id,name,contact,notes) VALUES(?,?,?,?)',
    [id, p.name, p.contact ?? null, p.notes ?? null]
  );
  return id;
}

export async function getDebtsByPersonAndType(personId: string, type: 'IOU' | 'UOM') {
  const db = await openDB();
  return await db.getAllAsync<Debt>(`
    SELECT * FROM debts 
    WHERE personId = ? AND type = ? 
    ORDER BY createdAt DESC
  `, [personId, type]);
}

export async function getPaymentsByDebt(debtId: string) {
  const db = await openDB();
  return await db.getAllAsync<Payment>(`
    SELECT * FROM payments 
    WHERE debtId = ? 
    ORDER BY date DESC
  `, [debtId]);
}

export async function getDebtWithBalance(debtId: string) {
  const db = await openDB();
  const debt = await db.getFirstAsync<Debt>('SELECT * FROM debts WHERE id=?', [debtId]);
  if (!debt) return null;
  
  const balance = await getDebtBalance(debtId);
  return { ...debt, balance };
}

export async function deletePerson(id: string) {
  const db = await openDB();
  // Check if person has any debts
  const debts = await db.getAllAsync('SELECT id FROM debts WHERE personId=?', [id]);
  if (debts.length > 0) {
    throw new Error('Cannot delete person with existing debts');
  }
  await db.runAsync('DELETE FROM people WHERE id=?', [id]);
}

export async function listAllPeople() {
  const db = await openDB();
  return await db.getAllAsync<Person>(`
    SELECT id, name, contact, notes
    FROM people 
    ORDER BY name COLLATE NOCASE
  `);
}

export async function getPersonById(id: string) {
  const db = await openDB();
  return await db.getFirstAsync<Person>('SELECT * FROM people WHERE id=?', [id]);
}

export async function listPeopleWithTotals() {
  const db = await openDB();
  // Get people and their debt totals as strings to avoid float precision
  const rows = await db.getAllAsync<any>(`
    SELECT p.id, p.name,
      IFNULL((
        SELECT GROUP_CONCAT(d.amountOriginal)
        FROM debts d WHERE d.personId=p.id AND d.type='IOU' AND d.status='open'
      ),'') AS iouAmounts,
      IFNULL((
        SELECT GROUP_CONCAT(d.amountOriginal)
        FROM debts d WHERE d.personId=p.id AND d.type='UOM' AND d.status='open'
      ),'') AS uomAmounts
    FROM people p
    ORDER BY p.name COLLATE NOCASE;
  `);
  
  return rows.map(r => {
    const iouTotal = r.iouAmounts ? 
      r.iouAmounts.split(',').reduce((sum: string, amt: string) => add(sum, amt), '0') : '0.00';
    const uomTotal = r.uomAmounts ? 
      r.uomAmounts.split(',').reduce((sum: string, amt: string) => add(sum, amt), '0') : '0.00';
    const net = sub(uomTotal, iouTotal);
    
    return {
      id: r.id,
      name: r.name,
      iouTotal: toCentsStr(iouTotal),
      uomTotal: toCentsStr(uomTotal),
      net: toCentsStr(net),
    };
  });
}

export async function createDebt(dbt: Omit<Debt,'id'|'status'|'createdAt'> & Partial<Pick<Debt,'id'|'status'|'createdAt'>>) {
  const db = await openDB();
  const id = dbt.id ?? Crypto.randomUUID();
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
  const id = Crypto.randomUUID();
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
  const payments = await db.getAllAsync<{amount: string}>('SELECT amount FROM payments WHERE debtId=?', [debtId]);
  const totalPaid = payments.reduce((sum, p) => add(sum, p.amount), '0');
  const balance = sub(base?.amountOriginal ?? '0', totalPaid);
  return balance;
}

export async function dashboardTotals() {
  const db = await openDB();
  // Get all amounts as strings to use decimal math
  const iouRows = await db.getAllAsync<{amountOriginal: string}>(`SELECT amountOriginal FROM debts WHERE type='IOU' AND status='open'`);
  const uomRows = await db.getAllAsync<{amountOriginal: string}>(`SELECT amountOriginal FROM debts WHERE type='UOM' AND status='open'`);
  
  const totalIOU = iouRows.reduce((sum, row) => add(sum, row.amountOriginal), '0');
  const totalUOM = uomRows.reduce((sum, row) => add(sum, row.amountOriginal), '0');
  const net = sub(totalUOM, totalIOU);
  
  return { 
    totalIOU: toCentsStr(totalIOU), 
    totalUOM: toCentsStr(totalUOM), 
    net: toCentsStr(net) 
  };
}

export async function updateDebt(
  id: string, 
  updates: Partial<Pick<Debt, 'description' | 'amountOriginal' | 'dueAt'>>
) {
  const db = await openDB();
  const setClause = [];
  const values = [];
  
  if (updates.description !== undefined) {
    setClause.push('description = ?');
    values.push(updates.description);
  }
  if (updates.amountOriginal !== undefined) {
    setClause.push('amountOriginal = ?');
    values.push(updates.amountOriginal);
  }
  if (updates.dueAt !== undefined) {
    setClause.push('dueAt = ?');
    values.push(updates.dueAt);
  }
  
  if (setClause.length === 0) return;
  
  values.push(id);
  await db.runAsync(
    `UPDATE debts SET ${setClause.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteDebt(id: string) {
  const db = await openDB();
  // Delete payments first due to foreign key constraint
  await db.runAsync('DELETE FROM payments WHERE debtId = ?', [id]);
  await db.runAsync('DELETE FROM debts WHERE id = ?', [id]);
}

export async function markDebtSettled(id: string) {
  const db = await openDB();
  await db.runAsync('UPDATE debts SET status = ? WHERE id = ?', ['settled', id]);
}

export async function getDebtById(id: string): Promise<Debt | null> {
  const db = await openDB();
  return await db.getFirstAsync<Debt>('SELECT * FROM debts WHERE id = ?', [id]);
}