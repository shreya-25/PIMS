const mongoose = require("mongoose");

const leadAssignmentSchema = new mongoose.Schema(
    {
        leadNo: { type: Number, required: true },
        assignedOfficer: { type: String, required: true },
        assignedDate: { type: Date, required: true },
        leadStatus: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("LeadAssignment", leadAssignmentSchema);
