require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Lead = require("../models/lead");
  const Case = require("../models/case");

  const cases = await Case.find({}).select("caseNo caseName").lean();
  console.log("Case records:");
  for (const c of cases) {
    const leadCount = await Lead.countDocuments({ caseNo: c.caseNo, caseName: c.caseName });
    console.log(`  ${c.caseNo} | "${c.caseName}" | ${leadCount} leads`);
  }

  console.log("\nLead caseNo/caseName combos (from leads collection):");
  const leadCombos = await Lead.aggregate([
    { $group: { _id: { caseNo: "$caseNo", caseName: "$caseName" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  for (const c of leadCombos) {
    // Check if this combo exists in cases
    const caseExists = cases.some(cs => cs.caseNo === c._id.caseNo && cs.caseName === c._id.caseName);
    console.log(`  ${c._id.caseNo} | "${c._id.caseName}" | ${c.count} leads | case exists: ${caseExists}`);
  }

  await mongoose.connection.close();
})();
