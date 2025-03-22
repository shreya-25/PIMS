const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        // leadNo: { type: Number, required: true, unique: true },
        leadNo: { type: Number, required: true },
        parentLeadNo:{
            type: [Number], 
            default: [],    
          },
        incidentNo: { type: String },
        subNumber: { type: String },
        associatedSubNumbers: [{ type: String}],
        assignedDate: { type: Date, required: true },
        assignedTo: [{ type: String }], 
        assignedBy: { type: String, required: true },
        summary: { type: String, required: true },
        description: { type: String, required: true },
        leadStatus: { type: String, required: true, enum: ["Assigned", "Pending", "Approved","Returned", "Completed"], default: "Assigned"},
        dueDate: { type: Date },
        priority:  { type: String },
        caseName: { type: String, required: true},
        caseNo: { type: String, required: true},
        associatedFlags:  [{ type: String}]
    },
    { timestamps: true }
);
leadSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });
module.exports = mongoose.model("Lead", leadSchema, "leads");
