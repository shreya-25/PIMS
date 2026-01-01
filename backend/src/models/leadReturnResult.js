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
        lastModifiedDate: { type: Date },
        lastModifiedBy: { type: String },
        caseName: { type: String, required: true},
        caseNo: { type: String , required: true},
        leadReturnId: { type: String , required: true},
        leadReturnResult: { type: String, required: true},
        accessLevel: {
            type: String,
            enum: ["Only Case Manager", "Everyone"],
            default: "Everyone"
          },
        // Soft delete fields
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
        deletedBy: { type: String },
        // Reference to complete lead return version
        completeLeadReturnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("LeadReturnResult", leadReturnResultsSchema, "LeadReturnResults");
