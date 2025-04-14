const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommentSchema = new mongoose.Schema(
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
        caseNo: { type: Number, required: true },
        enteredDate: { type: Date, required: true },
        tag: { type: String, required: true },
        comment: { type: String, required: true },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Comment", CommentSchema, "Comments");
