require("dotenv").config();

const express = require("express");
const { nanoid } = require("nanoid");
const path = require("path");
const fs = require("fs");

const connectDB = require("./db");
const Url = require("./models/Url");
const Click = require("./models/Click");

const app = express();
app.use(express.json());

// DEBUG (optional)
console.log("MONGO_URI:", process.env.MONGO_URI);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CODE_LENGTH = 6;

// Serve frontend
const distDir = path.join(__dirname, "..", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// URL validation
function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// 🔗 SHORTEN
app.post("/shorten", async (req, res) => {
  try {
    const { url, customAlias, expiresAt, deleteAfterMinutes } = req.body;

    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    let parsedExpiry = null;

    if (deleteAfterMinutes) {
      parsedExpiry = new Date(Date.now() + deleteAfterMinutes * 60000);
    }

    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
    }

    let code = customAlias || nanoid(CODE_LENGTH);

    const existing = await Url.findOne({ code });
    if (existing && customAlias) {
      return res.status(409).json({ error: "Alias already exists" });
    }

    const newUrl = await Url.create({
      code,
      long_url: url,
      expires_at: parsedExpiry
    });

    res.status(201).json({
      code,
      shortUrl: `${BASE_URL}/${code}`,
      longUrl: url,
      expiresAt: parsedExpiry
    });

  } catch (err) {
    console.error("Shorten error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📊 STATS
app.get("/stats/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ code: req.params.code });

    if (!url) return res.status(404).json({ error: "Not found" });

    if (url.expires_at && url.expires_at < new Date()) {
      await Url.deleteOne({ _id: url._id });
      return res.status(404).json({ error: "Expired" });
    }

    const clicks = await Click.countDocuments({ url_id: url._id });

    const lastClick = await Click.findOne({ url_id: url._id })
      .sort({ clicked_at: -1 });

    res.json({
      code: url.code,
      longUrl: url.long_url,
      createdAt: url.created_at,
      expiresAt: url.expires_at,
      clickCount: clicks,
      lastClickedAt: lastClick?.clicked_at || null
    });

  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔁 REDIRECT
app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ code: req.params.code });

    if (!url) return res.status(404).json({ error: "Not found" });

    if (url.expires_at && url.expires_at < new Date()) {
      await Url.deleteOne({ _id: url._id });
      return res.status(404).json({ error: "Expired" });
    }

    await Click.create({
      url_id: url._id,
      referrer: req.get("referer"),
      user_agent: req.get("user-agent")
    });

    res.redirect(url.long_url);

  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// HEALTH CHECK
app.get("/health", (_, res) => {
  res.json({ ok: true });
});

// FRONTEND FALLBACK (FIXED for Express v5)
app.use((req, res, next) => {
  if (fs.existsSync(distDir) && req.method === "GET") {
    return res.sendFile(path.join(distDir, "index.html"));
  }
  next();
});


// 🚀 START SERVER
connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(process.env.PORT || PORT, () => {
      console.log(`🚀 Server running on ${BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
  });