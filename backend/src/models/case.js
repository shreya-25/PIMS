const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
    {
        caseNo: { type: Number, required: true, unique: true },
        caseName: { type: String, required: true },
        assignedOfficers: [
            {
                name: { type: String, required: true },
                // badgeNumber: { type: String, required: true },
                role: { type: String, enum: ['CaseManager', 'Investigator'], required: true }
            }
        ],
        // allLeads: [{
        //     name: { type: String, required: true },
        //     number: { type: Number, required: true },
        //     status: { type: String, enum: ['Assigned', 'Pending', 'Completed'], required: true }
        // }

        // ], 
        // allLeadReturns: [
        //     {
        //         name: { type: String, required: true },
        //         number: { type: Number, required: true },
        //         status: { type: String, enum: ['Assigned', 'Pending', 'Completed'], required: true }
        //     }
        // ],
        // scratchpadEntry: { type: String }, 
    },
    { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);
