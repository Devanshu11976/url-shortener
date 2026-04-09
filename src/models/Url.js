const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  long_url: String,
  created_at: { type: Date, default: Date.now },
  expires_at: Date
});

module.exports = mongoose.model("Url", urlSchema);