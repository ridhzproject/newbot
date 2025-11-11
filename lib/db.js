import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, process.env.DATABASE_PATH || 'database.db');

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reminder_subs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS sholat_subs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS sleep_subs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS sholat_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    city_id TEXT NOT NULL,
    auto_enabled INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO sholat_settings (id, city_id, auto_enabled) VALUES (1, '1609', 0);
`);

export default db;
