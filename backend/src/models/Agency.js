const mongoose = require("mongoose");

const agencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    ori:  { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agency", agencySchema);
