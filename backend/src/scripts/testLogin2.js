require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/userModel");

  const user = await User.findOne({ username: "Khalil123" }).select("+password");
  if (!user) { console.log("NOT FOUND via Mongoose"); process.exit(1); }

  console.log("Found:", user.username, "| password present:", !!user.password);
  const match = await user.comparePassword("epd911");
  console.log("comparePassword result:", match);

  await mongoose.connection.close();
})();
