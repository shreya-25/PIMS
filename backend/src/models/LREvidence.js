const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrEvidenceSchema = new mongoose.Schema(
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
        collectionDate: { type: Date, required: true },
        disposedDate: { type: Date, required: true },
        disposition: { type: String, required: true },
        type: { type: String },
        evidenceDescription: { type: String }, 
        fileId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads" },
       
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LREvidence", lrEnclosureSchema, "LREvidences");
