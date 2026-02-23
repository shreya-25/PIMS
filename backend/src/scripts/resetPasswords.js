require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
mongoose.set("strictQuery", false);

const NEW_PASSWORD = "epd911";

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  const result = await db.collection("users").updateMany(
    {},
    { $set: { password: hash } }
  );
  console.log(`Updated ${result.modifiedCount} users with new password: ${NEW_PASSWORD}`);

  await mongoose.connection.close();
})();
