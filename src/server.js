require("dotenv").config();
const express = require("express");
const { nanoid } = require("nanoid");
const path = require("path");
const fs = require("fs");
const { db, initializeDatabase } = require("./db");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CODE_LENGTH = Number(process.env.CODE_LENGTH || 6);
const CLEANUP_INTERVAL_MS = Number(process.env.CLEANUP_INTERVAL_MS || 5_000);

const distDir = path.join(__dirname, "..", "dist");
const hasDist = fs.existsSync(distDir);
if (hasDist) {
  app.use(express.static(distDir));
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows || []);
    });
  });
}

function sqliteUtcToIso(value) {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return normalized.endsWith("Z") ? normalized : `${normalized}Z`;
}

async function deleteExpiredUrls() {
  const rows = await all("SELECT id, expires_at FROM urls WHERE expires_at IS NOT NULL");
  const nowMs = Date.now();
  const expiredRows = rows.filter((row) => {
    const t = new Date(row.expires_at).getTime();
    return Number.isFinite(t) && t <= nowMs;
  });

  if (expiredRows.length === 0) {
    return 0;
  }

  const ids = expiredRows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  await run(`DELETE FROM clicks WHERE url_id IN (${placeholders})`, ids);
  await run(`DELETE FROM urls WHERE id IN (${placeholders})`, ids);
  return ids.length;
}

async function purgeUrlById(urlId) {
  await run("DELETE FROM clicks WHERE url_id = ?", [urlId]);
  await run("DELETE FROM urls WHERE id = ?", [urlId]);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Chrome DevTools may probe this endpoint locally; return no content instead of 404 noise.
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
  res.status(204).end();
});

app.post("/shorten", async (req, res) => {
  try {
    const { url, customAlias, expiresAt, deleteAfterMinutes } = req.body || {};

    if (!url || !isValidHttpUrl(url)) {
      res.status(400).json({ error: "Please provide a valid http/https URL." });
      return;
    }

    let alias = null;
    if (customAlias !== undefined) {
      if (typeof customAlias !== "string" || customAlias.trim().length < 3) {
        res.status(400).json({ error: "customAlias must be at least 3 characters." });
        return;
      }

      if (!/^[A-Za-z0-9_-]+$/.test(customAlias.trim())) {
        res.status(400).json({ error: "customAlias can only contain letters, numbers, _ and -." });
        return;
      }
      alias = customAlias.trim();
    }

    let parsedExpiry = null;
    if (deleteAfterMinutes !== undefined) {
      const minutes = Number(deleteAfterMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        res.status(400).json({ error: "deleteAfterMinutes must be a positive number." });
        return;
      }
      parsedExpiry = new Date(Date.now() + minutes * 60_000).toISOString();
    }

    if (expiresAt !== undefined) {
      const d = new Date(expiresAt);
      if (Number.isNaN(d.getTime())) {
        res.status(400).json({ error: "expiresAt must be a valid date/time." });
        return;
      }
      parsedExpiry = d.toISOString();
    }

    let code = alias || nanoid(CODE_LENGTH);
    let attempts = 0;

    while (attempts < 5) {
      try {
        await run(
          "INSERT INTO urls (code, long_url, expires_at) VALUES (?, ?, ?)",
          [code, url, parsedExpiry]
        );
        break;
      } catch (err) {
        if (err.code !== "SQLITE_CONSTRAINT") {
          throw err;
        }

        if (alias) {
          res.status(409).json({ error: "That custom alias is already taken." });
          return;
        }

        code = nanoid(CODE_LENGTH);
        attempts += 1;
      }
    }

    if (attempts >= 5 && !alias) {
      res.status(500).json({ error: "Failed to generate unique short code. Try again." });
      return;
    }

    const shortUrl = `${BASE_URL}/${code}`;
    res.status(201).json({ code, shortUrl, longUrl: url, expiresAt: parsedExpiry });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong creating short URL." });
  }
});

app.get("/stats/:code", async (req, res) => {
  try {
    const row = await get(
      `
      SELECT
        u.id,
        u.code,
        u.long_url,
        u.created_at,
        u.expires_at,
        COUNT(c.id) AS click_count,
        MAX(c.clicked_at) AS last_clicked_at
      FROM urls u
      LEFT JOIN clicks c ON c.url_id = u.id
      WHERE u.code = ?
      GROUP BY u.id
      `,
      [req.params.code]
    );

    if (!row) {
      res.status(404).json({ error: "Short URL not found." });
      return;
    }

    if (row.expires_at) {
      const expiryMs = new Date(row.expires_at).getTime();
      if (Number.isFinite(expiryMs) && expiryMs <= Date.now()) {
        await purgeUrlById(row.id);
        res.status(404).json({ error: "Short URL not found." });
        return;
      }
    }

    res.json({
      code: row.code,
      longUrl: row.long_url,
      createdAt: sqliteUtcToIso(row.created_at),
      expiresAt: sqliteUtcToIso(row.expires_at),
      clickCount: Number(row.click_count || 0),
      lastClickedAt: sqliteUtcToIso(row.last_clicked_at),
    });
  } catch (error) {
    res.status(500).json({ error: "Could not load stats." });
  }
});

app.get("/:code", async (req, res) => {
  try {
    const row = await get("SELECT id, long_url, expires_at FROM urls WHERE code = ?", [req.params.code]);

    if (!row) {
      res.status(404).json({ error: "Short URL not found." });
      return;
    }

    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      await purgeUrlById(row.id);
      res.status(404).json({ error: "Short URL not found." });
      return;
    }

    await run("INSERT INTO clicks (url_id, referrer, user_agent) VALUES (?, ?, ?)", [
      row.id,
      req.get("referer") || null,
      req.get("user-agent") || null,
    ]);

    res.redirect(302, row.long_url);
  } catch (error) {
    res.status(500).json({ error: "Failed to redirect." });
  }
});

if (hasDist) {
  app.get("/", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

initializeDatabase()
  .then(() => {
    deleteExpiredUrls().catch(() => {
      // Ignore startup cleanup errors; periodic cleanup will retry.
    });

    setInterval(() => {
      deleteExpiredUrls().catch(() => {
        // Ignore periodic cleanup errors; next interval will retry.
      });
    }, CLEANUP_INTERVAL_MS);

    app.listen(PORT, () => {
      // Keep this log simple so users can copy the URL.
      console.log(`URL shortener running on ${BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
