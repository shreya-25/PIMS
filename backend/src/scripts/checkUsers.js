require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = await db.collection("users").find({
    username: { $regex: "khalil|pranshu", $options: "i" }
  }).project({ username: 1, role: 1, password: 1 }).toArray();

  for (const u of users) {
    console.log(`${u.username} | role: ${u.role} | _id: ${u._id} | hash starts: ${u.password ? u.password.substring(0, 10) : "NO PASSWORD"}`);
  }

  await mongoose.connection.close();
})();
