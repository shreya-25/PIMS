const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        // leadNo: { type: Number, required: true, unique: true },
        leadNo: { type: Number, required: true },
        parentLeadNo:{
            type: [Number], // an array of Numbers
            default: [],    // (optional) defaults to an empty array
          },
        incidentNo: { type: String },
        subNumber: { type: String },
        associatedSubNumbers: [{ type: String}],
        assignedDate: { type: Date, required: true },
        assignedTo: [{ type: String }], // Array of officer names
        assignedBy: { type: String, required: true },
        summary: { type: String, required: true },
        description: { type: String, required: true },
        leadStatus: { type: String, required: true },
        dueDate: { type: Date },
        priority:  { type: String },
        caseName: { type: String, required: true },
        caseNo: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema, "leads");
