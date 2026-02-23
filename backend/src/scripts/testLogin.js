require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const user = await db.collection("users").findOne({ username: "Khalil123" });
  if (!user) { console.log("NOT FOUND"); process.exit(1); }

  console.log("Username:", user.username);
  console.log("Hash:", user.password);

  const match = await bcrypt.compare("epd911", user.password);
  console.log("Password 'epd911' matches:", match);

  await mongoose.connection.close();
})();
