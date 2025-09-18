// models/presence.js
const mongoose = require("mongoose");

const PresenceSchema = new mongoose.Schema(
  {
    roomKey:  { type: String, required: true, index: true },
    username: { type: String, required: true },
    role:     { type: String, default: "User" },
    // keep this fresh on every heartbeat; TTL index cleans up eventually
    lastSeen: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

// One presence row per (roomKey, username)
PresenceSchema.index({ roomKey: 1, username: 1 }, { unique: true });

// TTL: Mongo will delete docs whose lastSeen is older than this
// (TTL monitor runs about once a minute; our queries also filter by lastSeen)
PresenceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 120 });

module.exports = mongoose.model("Presence", PresenceSchema);
