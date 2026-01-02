const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrPictureSchema = new mongoose.Schema(
    {
        leadNo: { type: Number, required: true },
        description: { type: String },
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
        datePictureTaken: { type: Date },
        pictureDescription: { type: String, required: true }, 
        // fileId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads" },
        // For disk storage, store file details instead of fileId
          // File-based (all optional now)
    s3Key: { type: String, default: null },
    originalName: { type: String, default: null },
    filename: { type: String, default: null },

    // Link-based (all optional now)
    isLink: { type: Boolean, default: false },
    link: { type: String, default: null },

    // Kept optional
    filePath: { type: String, default: null },
        accessLevel: {
            type: String,
            enum: ["Everyone", "Case Manager", "Case Manager and Assignees"],
            default: "Everyone"
        },
        isLink: { type: Boolean, default: false },
        link: { type: String },
        // Reference to complete lead return version
        completeLeadReturnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
            index: true
        }

    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LRPicture", lrPictureSchema, "LRPictures");