import Database from "better-sqlite3";
import fs from "node:fs";
import { DATA_DIR, DB_PATH } from "./paths";

// The database only holds the project index (names, engine, timestamps). The
// actual document sources and PDFs live on the filesystem, so this stays tiny
// and fast. We cache the connection on globalThis so Next's dev hot reload
// doesn't open a new handle on every edit.
declare global {
  var __texsetDb: Database.Database | undefined;
}

function init(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      engine TEXT NOT NULL DEFAULT 'latex',
      template TEXT,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_opened_at INTEGER
    );
  `);

  migrate(db);
  return db;
}

// small forward-only migrations for databases created by earlier versions
function migrate(db: Database.Database): void {
  const columns = db.prepare(`PRAGMA table_info(projects)`).all() as {
    name: string;
  }[];
  if (!columns.some((column) => column.name === "pinned")) {
    db.exec(`ALTER TABLE projects ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`);
  }
}

export function getDb(): Database.Database {
  if (!globalThis.__texsetDb) {
    globalThis.__texsetDb = init();
  }
  return globalThis.__texsetDb;
}
