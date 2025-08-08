// const dotenv = require("dotenv");
// const mongoose = require("mongoose");
// const User = require("./models/userModel"); // Adjust path if needed

// dotenv.config(); // Load .env variables

// async function createUser() {
//     console.log("Loaded MONGO_URI:", process.env.DOCDB_URI);

//   const uri = process.env.DOCDB_URI;
//   console.log("Loaded URI:", uri); // For debugging

//   await mongoose.connect(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

//   const newUser = new User({
//     firstName: "Officer",
//     lastName: "17",
//     username: "Officer017",
//     password: "epd911",
//     email: "Officer001@binghamton.edu",
//     role: "CaseManager",
//   });

//   await newUser.save();
//   console.log("✅ User created!");
//   mongoose.disconnect();
// }

// createUser().catch(console.error);

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/userModel");

dotenv.config(); // Load .env variables

async function createUser() {
  const uri = process.env.DOCDB_URI;
  console.log("Loaded URI:", uri);

  try {
    await mongoose.connect(process.env.DOCDB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsCAFile: './global-bundle.pem'
});
    console.log("✅ Connected to DocumentDB!");

    const newUser = new User({
      firstName: "Officer",
      lastName: "18",
      username: "Officer018",
      password: "epd911",
      email: "Officer001@binghamton.edu",
      role: "CaseManager",
    });

    await newUser.save();
    console.log("✅ User created!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
  }
}

createUser();
