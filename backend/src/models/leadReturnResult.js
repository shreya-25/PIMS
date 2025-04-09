const mongoose = require("mongoose");

const leadReturnResultsSchema = new mongoose.Schema(
    {
        leadNo: { type: Number, required: true },
        description: { type: String, required: true },
        assignedTo: {
            assignees: [{ type: String, required: true }],
            lRStatus: { 
                type: String, 
                enum: ["Assigned", "Pending", "Approved", "Returned", "Completed", "Submitted"], 
                default: "Assigned"
            }
        },
        assignedBy: {
            assignee: { type: String, required: true },
            lRStatus: { 
                type: String, 
                enum: ["Assigned", "Pending"], 
                default: "Assigned" 
            }
        },
        enteredDate:  { type: Date },
        enteredBy: { type: String, required: true},
        caseName: { type: String, required: true},
        caseNo: { type: String , required: true},
        leadReturnId: { type: String , required: true},
        leadReturnResult: { type: String, required: true},
    },
    { timestamps: true }
);

module.exports = mongoose.model("LeadReturnResult", leadReturnResultsSchema, "LeadReturnResults");
