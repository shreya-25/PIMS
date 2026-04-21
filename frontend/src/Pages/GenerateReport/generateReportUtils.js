// ===== DATE / TIME HELPERS =====

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

export const convert12To24 = (time12h) => {
  if (!time12h) return time12h;
  const upper = String(time12h).toUpperCase();
  if (!upper.includes("AM") && !upper.includes("PM")) return time12h;
  const [time, modifier] = upper.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (modifier === "AM") { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

// ===== DATA UTILITIES =====

export const toArray = (val) => {
  if (Array.isArray(val)) return val.map(String);
  if (val == null) return [];
  if (typeof val === "number") return [String(val)];
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

export const toNum = (v) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s ? Number.parseInt(s, 10) : NaN;
};

// Extract the return/narrative ID from a lead-return object
export const lrKeyFor = (obj = {}) =>
  obj.narrativeId || obj.returnId || obj.lrId || obj.leadReturnId ||
  obj.lead_return_id || obj.lr_id || obj.leadReturnID || obj.lead_returnId || obj._id;

// Group section arrays into a Map keyed by return ID
export function groupSectionsByReturn({
  persons = [], vehicles = [], enclosures = [], evidence = [],
  pictures = [], audio = [], videos = [], scratchpad = [], timeline = [],
}) {
  const map = new Map();
  const touch = (k) => {
    if (!map.has(k)) map.set(k, {
      persons: [], vehicles: [], enclosures: [], evidence: [],
      pictures: [], audio: [], videos: [], scratchpad: [], timeline: [],
    });
    return map.get(k);
  };
  const add = (arr, field) => arr.forEach((x) => touch(lrKeyFor(x))[field].push(x));
  add(persons,    "persons");
  add(vehicles,   "vehicles");
  add(enclosures, "enclosures");
  add(evidence,   "evidence");
  add(pictures,   "pictures");
  add(audio,      "audio");
  add(videos,     "videos");
  add(scratchpad, "scratchpad");
  add(timeline,   "timeline");
  return map;
}

export const isDeletedStatus = (s) => String(s ?? "").trim().toLowerCase() === "deleted";
export const isClosedStatus  = (s) => String(s ?? "").trim().toLowerCase() === "closed";

// Build ordered list of unique leads from timeline entries (ascending)
export const buildTimelineOrderedLeads = (entries, allLeads) => {
  const out  = [];
  const seen = new Set();
  for (const e of entries) {
    const key = String(e.leadNo ?? "");
    if (!key || seen.has(key)) continue;
    const match = (allLeads || []).find((l) => String(l.leadNo) === key);
    if (match) { seen.add(key); out.push(match); }
  }
  return out;
};
