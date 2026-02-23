require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/userModel");

  // Simulate exact login flow from authController
  const username = "Khalil123";
  const password = "epd911";

  console.log("Looking for username:", JSON.stringify(username));
  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    console.log("User NOT FOUND");
    // Try raw query
    const raw = await mongoose.connection.db.collection("users").findOne({ username });
    console.log("Raw findOne result:", raw ? `Found: ${raw.username}` : "Also not found in raw");
  } else {
    console.log("Found user:", user.username, "| has password:", !!user.password);
    const match = await user.comparePassword(password);
    console.log("Password match:", match);
  }

  await mongoose.connection.close();
})();
