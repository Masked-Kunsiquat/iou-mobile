import { upsertPerson, createDebt, addPayment } from './repo';

export async function seedIfEmpty() {
  const alexId = await upsertPerson({ name: 'Alex' });
  const jordanId = await upsertPerson({ name: 'Jordan' });
  const samId = await upsertPerson({ name: 'Sam' });

  const d1 = await createDebt({ type: 'IOU', personId: alexId, description: 'Groceries', amountOriginal: '120.00' });
  await addPayment({ debtId: d1, amount: '40.00', date: new Date().toISOString() });

  await createDebt({ type: 'UOM', personId: jordanId, description: 'Rideshare', amountOriginal: '60.00' });

  const d3 = await createDebt({ type: 'IOU', personId: samId, description: 'Concert tickets', amountOriginal: '200.00' });
  await addPayment({ debtId: d3, amount: '50.00', date: new Date().toISOString() });
  await addPayment({ debtId: d3, amount: '50.00', date: new Date().toISOString() });

  await createDebt({ type: 'UOM', personId: samId, description: 'Snacks', amountOriginal: '25.00', status: 'settled' });
}
