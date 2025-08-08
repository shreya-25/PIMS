const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

let gfs; // Global GridFS instance

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.name}`); 

   
        conn.connection.once("open", () => {
            gfs = Grid(conn.connection.db, mongoose.mongo);
            gfs.collection("uploads"); 
            console.log("✅ GridFS Initialized for File Storage");
        });

        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};


module.exports = { dbConnect, gfs };

// const mongoose = require("mongoose");
// const Grid = require("gridfs-stream");

// let gfs; // Global GridFS instance

// const dbConnect = async () => {
//     try {
//         // Connect using DocumentDB URI (TLS required)
//         const conn = await mongoose.connect(process.env.DOCDB_URI, {
//             tls: true, // Required for DocumentDB
//             tlsCAFile: "./rds-combined-ca-bundle.pem", // Path to AWS-provided CA cert file
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });

//         console.log(`✅ Connected to DocumentDB: ${conn.connection.name}`);

//         // Initialize GridFS Stream (NOTE: DocumentDB does NOT support GridFS natively)
//         conn.connection.once("open", () => {
//             console.log("⚠️ GridFS is NOT supported in DocumentDB. Use S3 for file storage instead.");
//         });

//         return conn;
//     } catch (error) {
//         console.error(`❌ DocumentDB Connection Error: ${error.message}`);
//         process.exit(1);
//     }
// };

// module.exports = { dbConnect, gfs };
