export const CREATE_META = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);`;

export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('IOU','UOM')),
  personId TEXT NOT NULL REFERENCES people(id),
  description TEXT,
  amountOriginal TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  dueAt TEXT,
  status TEXT NOT NULL CHECK(status IN ('open','settled'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY NOT NULL,
  debtId TEXT NOT NULL REFERENCES debts(id),
  amount TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT
);
`;

export const SCHEMA_VERSION = 1;
