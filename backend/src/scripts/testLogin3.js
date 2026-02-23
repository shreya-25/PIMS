require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/userModel");
  const db = mongoose.connection.db;

  // Check what collection Mongoose uses
  console.log("Mongoose collection name:", User.collection.collectionName);

  // List all collections
  const collections = await db.listCollections().toArray();
  const userColls = collections.filter(c => c.name.toLowerCase().includes("user"));
  console.log("User-related collections:", userColls.map(c => c.name));

  // Count docs in each
  for (const c of userColls) {
    const count = await db.collection(c.name).countDocuments();
    const sample = await db.collection(c.name).findOne({}, { projection: { username: 1 } });
    console.log(`  ${c.name}: ${count} docs, sample: ${sample ? sample.username : "N/A"}`);
  }

  // Try Mongoose find
  const allUsers = await User.find({}).select("username").lean();
  console.log("\nMongoose User.find() count:", allUsers.length);
  allUsers.forEach(u => console.log(`  ${u.username}`));

  await mongoose.connection.close();
})();
