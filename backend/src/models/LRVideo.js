const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrVideoSchema = new mongoose.Schema(
    {
        leadNo: { type: Number, required: true },
        description: { type: String, required: true },
        assignedTo: {
            assignees: [{ type: String }],
            lRStatus: { 
                type: String, 
                enum: ["Assigned", "Pending", "Approved", "Returned", "Completed", "Submitted"], 
                default: "Assigned"
            }
        },
        assignedBy: {
            assignee: { type: String },
            lRStatus: { 
                type: String, 
                enum: ["Assigned", "Pending"], 
                default: "Assigned" 
            }
        },
        enteredBy: { type: String, required: true },
        caseName: { type: String, required: true },
        caseNo: { type: String, required: true },
        leadReturnId: { type: Number, required: true },
        enteredDate: { type: Date, required: true },
        dateVideoRecorded: { type: Date, required: true },
        videoDescription: { type: String }, 
        // fileId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads" },
        // For disk storage, store file details instead of fileId
        filePath: { type: String, required: true },
        originalName: { type: String },
        filename: { type: String },
       
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LRVideo", lrVideoSchema, "LRVideos");
