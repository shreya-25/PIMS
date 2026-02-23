require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/userModel");

  // Delete the new duplicate accounts (lowercase)
  const r1 = await User.deleteOne({ _id: "699c78a6a0b302e64872a72d" }); // khalil123
  console.log("Deleted khalil123:", r1.deletedCount);

  const r2 = await User.deleteOne({ _id: "699c78bfa0b302e64872a72f" }); // pranshu123
  console.log("Deleted pranshu123:", r2.deletedCount);

  // Verify remaining
  const remaining = await User.find({
    username: { $in: ["Khalil123", "Pranshu123"] }
  }).select("username role _id").lean();
  console.log("\nRemaining accounts:");
  remaining.forEach(u => console.log(`  ${u.username} | ${u.role} | ${u._id}`));

  await mongoose.connection.close();
})();
