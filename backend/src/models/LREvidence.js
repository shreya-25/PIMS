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
        leadReturnId: { type: String, required: true },
        enteredDate: { type: Date, required: true },
        collectionDate: { type: Date, required: true },
        disposedDate: { type: Date},
        type: { type: String },
        evidenceDescription: { type: String, required: true  }, 
        // fileId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads" },
        s3Key:        { type: String, trim: true },     // <- no required()
  originalName: { type: String },
  filename:     { type: String },

  // (Legacy) local path, keep optional or remove if unused
  filePath:     { type: String },

  // Link
  isLink: { type: Boolean, default: false },      // informational flag
  link: {
    type: String,
    trim: true,
    validate: {
      validator: v => !v || /^https?:\/\/.+/i.test(v),
      message: 'link must be a valid URL'
    }
  },

        accessLevel: {
            type: String,
            enum: ["Only Case Manager", "Everyone"],
            default: "Everyone"
          },
       
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LREvidence", lrEvidenceSchema, "LREvidences");