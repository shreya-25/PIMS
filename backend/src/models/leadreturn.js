const mongoose = require("mongoose");

const leadReturnSchema = new mongoose.Schema(
    {
        // leadNo: { type: Number, required: true, unique: true },
        leadNo: { type: Number, required: true },
        // assignedDate: { type: Date, required: true },
        assignedTo: {
            assignees: [{ type: String, required: true }], // List of officers
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
        // summary: { type: String, required: true },
        description: { type: String, required: true },
        // leadStatus: { type: String, required: true, enum: ["Assigned", "Pending", "Approved","Returned", "Completed"], default: "Assigned"},
        // dueDate: { type: Date },
        submittedDate:  { type: Date },
        approvedDate:   { type: Date },
        returnedDate: { type: Date },
        caseName: { type: String, required: true},
        caseNo: { type: String , required: true},
        accessLevel: {
            type: String,
            enum: ["Only Case Manager", "Everyone"],
            default: "Everyone"
          }
    },
    { timestamps: true }
);

module.exports = mongoose.model("LeadReturn", leadReturnSchema , "LeadReturns");
