const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        // leadNo: { type: Number, required: true, unique: true },
        leadNo: { type: Number, required: true },
        parentLeadNo: { type: Number }, // Reference to parent lead
        incidentNo: { type: Number, required: true },
        subNumber: { type: Number },
        // associatedSubNumbers: [{ type: Number }], // List of sub-numbers
        assignedDate: { type: Date, required: true },
        assignedTo: [{ type: String }], // Array of officer names
        assignedBy: { type: String, required: true },
        summary: { type: String, required: true },
        description: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
