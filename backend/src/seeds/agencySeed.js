const Agency = require("../models/Agency");

const DEFAULT_AGENCIES = [
  { name: "Endicott Police Department",              ori: "NY0070600" },
  { name: "Union Police Department",                 ori: "NY0070601" },
  { name: "Binghamton Police Department",            ori: "NY0070200" },
  { name: "Federal Bureau of Investigation",         ori: "NY0010000" },
  { name: "Broome County Sheriff's Office",          ori: "NY0070000" },
  { name: "Binghamton University Police Department", ori: "NY0070800" },
  { name: "Johnson City Police Department",          ori: "NY0070300" },
];

const seedAgencies = async () => {
  try {
    const count = await Agency.countDocuments();
    if (count > 0) return; // already seeded

    await Agency.insertMany(DEFAULT_AGENCIES);
    console.log("✅ Default agencies seeded.");
  } catch (err) {
    console.error("Agency seed error:", err.message);
  }
};

module.exports = { seedAgencies };
