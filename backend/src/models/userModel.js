const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName:
    {
        type: String,
        // required: true,
    },
    username:
    {
        type: String,
        required: true,
        unique: true,
    },
    password:
    {
        type: String,
        required: true,
    },
    role:
    {
        type: String,
        required: true,
        enum : ["admin", "CaseManager", "Investigator"],
    },
    email:
    {
        type: String,
        required: true,
    }
}, 
{
    timestamps: true,
});

module.exports = mongoose.model("User", userSchema);