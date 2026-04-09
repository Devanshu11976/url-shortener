const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  url_id: { type: mongoose.Schema.Types.ObjectId, ref: "Url" },
  referrer: String,
  user_agent: String,
  clicked_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Click", clickSchema);