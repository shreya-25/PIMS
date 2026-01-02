const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrScratchpadSchema = new mongoose.Schema(
    {
        leadNo: { type: Number },
        description: { type: String},
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
        leadReturnId: { type: String },
        enteredDate: { type: Date, required: true },
        text: { type: String, required: true},
        type: { type: String, required: true, enum: ["Case", "Lead"]},
        accessLevel: {
            type: String,
            enum: ["Everyone", "Case Manager", "Case Manager and Assignees"],
            default: "Everyone"
        },
        // Reference to complete lead return version
        completeLeadReturnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
            index: true
        }

    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LRScratchpad", lrScratchpadSchema, "LRScratchpads");
