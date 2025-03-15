const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

let gfs; // Global GridFS instance

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        // Use the correct way to log the connected database
        console.log(`✅ MongoDB Connected: ${conn.connection.name}`); // Correct way to log the DB name

        // Initialize GridFS Stream when connection is established
        conn.connection.once("open", () => {
            gfs = Grid(conn.connection.db, mongoose.mongo);
            gfs.collection("uploads"); // Collection for file storage
            console.log("✅ GridFS Initialized for File Storage");
        });

        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

// **Export both dbConnect function and gfs**
module.exports = { dbConnect, gfs };
