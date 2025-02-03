const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
    {
        caseNo: { type: Number, required: true, unique: true },
        caseName: { type: String, required: true },
        // assignedOfficers: [{ type: String }], // Array of strings for officer names
        // caseManager: { type: String, required: true },
        assignedOfficers: [
            {
                officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
                role: { type: String, enum: ['CaseManager', 'Investigator'], required: true }
            }
        ],
        allLeads: [{ name: String, number: Number }], // Array of objects with lead name and number
        allLeadReturns: [{ name: String, number: Number }], // Array of objects with return details
        leadStatus: { type: String, required: true },
        statusLeadReturn: { type: String },
        scratchpadEntry: { type: String }, // Optional notes or scratchpad entries
    },
    { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);
