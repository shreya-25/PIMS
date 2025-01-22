// import mongoose from 'mongoose';
const mongoose = require ("mongoose");

const dbConnect = async () =>{
    try{
        const conn1 = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn1.connection.host}`)

    } catch (error){
        console.error(`Error: ${error.message}`);
        process.exit(1);

    }
}

module.exports = dbConnect;