require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const users = await db.collection("users").find({}).project({ username: 1 }).toArray();
  let fixed = 0;

  for (const u of users) {
    const lower = u.username.toLowerCase();
    if (lower !== u.username) {
      await db.collection("users").updateOne(
        { _id: u._id },
        { $set: { username: lower } }
      );
      console.log(`  ${u.username} → ${lower}`);
      fixed++;
    }
  }

  console.log(`\nFixed ${fixed} usernames (lowercased)`);
  await mongoose.connection.close();
})();
