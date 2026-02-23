require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const fixes = {
  "khalil123": "Khalil123",
  "officer001": "Officer001",
  "officer002": "Officer002",
  "officer018": "Officer018",
  "trevor089": "Trevor089",
  "pranshu123": "Pranshu123",
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  for (const [from, to] of Object.entries(fixes)) {
    const result = await db.collection("users").updateOne(
      { username: from },
      { $set: { username: to } }
    );
    console.log(`${from} → ${to}: ${result.modifiedCount ? "OK" : "not found"}`);
  }

  await mongoose.connection.close();
})();
