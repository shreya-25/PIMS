require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Case = require("../models/case");
  const Lead = require("../models/lead");
  const User = require("../models/userModel");

  // Show ALL users with similar names
  const users = await User.find({
    username: { $in: [/khalil/i, /pranshu/i] }
  }).select("username role _id createdAt").lean();

  console.log("Users matching khalil/pranshu:");
  for (const u of users) {
    console.log(`  ${u.username} | _id: ${u._id} | role: ${u.role} | created: ${u.createdAt}`);

    const cases = await Case.find({
      $or: [
        { caseManagerUserId: u._id },
        { detectiveSupervisorUserId: u._id },
        { investigatorUserIds: u._id },
      ]
    }).select("caseNo caseName status").lean();

    if (cases.length === 0) {
      console.log("    → NOT in any cases");
    }
    for (const c of cases) {
      const totalLeads = await Lead.countDocuments({ caseNo: c.caseNo, caseName: c.caseName });
      console.log(`    → Case: ${c.caseNo} "${c.caseName}" (${c.status}) — ${totalLeads} leads total`);
    }
  }

  await mongoose.connection.close();
})();
