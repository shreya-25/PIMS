require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Case = require("../models/case");
  const Lead = require("../models/lead");
  const User = require("../models/userModel");

  // Check new users
  const newUsernames = ["khalil123", "pranshu123"];
  for (const uname of newUsernames) {
    const user = await User.findOne({ username: new RegExp(`^${uname}$`, "i") });
    if (!user) { console.log(`${uname}: NOT FOUND`); continue; }
    console.log(`\n=== ${user.username} (${user._id}) role: ${user.role} ===`);

    const cases = await Case.find({
      $or: [
        { caseManagerUserId: user._id },
        { detectiveSupervisorUserId: user._id },
        { investigatorUserIds: user._id },
      ]
    }).select("caseNo caseName").lean();

    for (const c of cases) {
      const leadCount = await Lead.countDocuments({ caseNo: c.caseNo, caseName: c.caseName });
      console.log(`  Case: ${c.caseNo} "${c.caseName}" — ${leadCount} leads`);

      // Check if any leads are assigned TO this user
      const assignedToCount = await Lead.countDocuments({
        caseNo: c.caseNo,
        "assignedTo.username": user.username
      });
      const assignedByCount = await Lead.countDocuments({
        caseNo: c.caseNo,
        assignedBy: user.username
      });
      console.log(`    → assignedTo ${user.username}: ${assignedToCount}, assignedBy: ${assignedByCount}`);
    }
  }

  await mongoose.connection.close();
})();
