const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "urls.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE,
          long_url TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT
        )
        `,
        (err) => {
          if (err) {
            reject(err);
            return;
          }
        }
      );

      db.run(
        `
        CREATE TABLE IF NOT EXISTS clicks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url_id INTEGER NOT NULL,
          clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
          referrer TEXT,
          user_agent TEXT,
          FOREIGN KEY(url_id) REFERENCES urls(id)
        )
        `,
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  });
}

module.exports = { db, initializeDatabase };
