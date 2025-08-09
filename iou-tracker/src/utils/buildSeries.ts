// utils/buildSeries.ts
import { SeriesPoint } from '../components/ChartCard';

type Event =
  | { kind: 'create'; side: 'IOU'|'UOM'; amount: number; date: string }   // debt created
  | { kind: 'payment'; side: 'IOU'|'UOM'; amount: number; date: string }
  | { kind: 'settle'; side: 'IOU'|'UOM'; amountLeft: number; date: string }; // zero-out

export function buildDailySeries(events: Event[], startISO: string, endISO: string): SeriesPoint[] {
  const start = new Date(startISO), end = new Date(endISO);
  // bucket daily deltas
  const key = (d: Date) => d.toISOString().slice(0,10);
  const days: Record<string, { iouDelta: number; uomDelta: number }> = {};

  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    days[key(d)] = { iouDelta: 0, uomDelta: 0 };
  }

  for (const e of events) {
    const k = (e.date || '').slice(0,10);
    if (!days[k]) continue;
    if (e.kind === 'create') {
      if (e.side === 'IOU') days[k].iouDelta += e.amount;
      else days[k].uomDelta += e.amount;
    } else if (e.kind === 'payment') {
      if (e.side === 'IOU') days[k].iouDelta -= e.amount;
      else days[k].uomDelta -= e.amount;
    } else if (e.kind === 'settle') {
      if (e.side === 'IOU') days[k].iouDelta -= e.amountLeft;
      else days[k].uomDelta -= e.amountLeft;
    }
  }

  // cumulative
  let iou = 0, uom = 0;
  const out: SeriesPoint[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const k = key(d);
    iou += days[k].iouDelta;
    uom += days[k].uomDelta;
    out.push({ x: new Date(k), iou, uom, net: uom - iou });
  }
  return out;
}
