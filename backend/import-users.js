require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read the JSON file
const usersData = JSON.parse(
  fs.readFileSync('C:\\Users\\shrey\\Downloads\\users.users.json', 'utf-8')
);

// Define User Schema (same as your userModel)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  password: String,
  role: String,
  email: String,
  createdAt: Date,
  updatedAt: Date,
  __v: Number
});

const User = mongoose.model('User', userSchema, 'users');

async function importUsers() {
  try {
    // Connect to Cosmos DB
    console.log('Connecting to Azure Cosmos DB...');
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to Azure Cosmos DB');

    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Transform the data to match Mongoose format
    const transformedUsers = usersData.map(user => ({
      _id: user._id.$oid,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      password: user.password,
      role: user.role,
      email: user.email,
      createdAt: new Date(user.createdAt.$date),
      updatedAt: new Date(user.updatedAt.$date),
      __v: user.__v
    }));

    // Insert users
    console.log(`Importing ${transformedUsers.length} users...`);
    await User.insertMany(transformedUsers, { ordered: false });

    console.log(`✅ Successfully imported ${transformedUsers.length} users to Cosmos DB`);

    // Verify import
    const count = await User.countDocuments();
    console.log(`Total users in database: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing users:', error.message);
    if (error.writeErrors) {
      console.error(`${error.writeErrors.length} documents failed to import`);
    }
    process.exit(1);
  }
}

importUsers();
