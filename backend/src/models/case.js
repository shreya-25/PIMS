const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
    {
        caseNo: { type: String, required: true, unique: true },
        caseName: { type: String, required: true },
        assignedOfficers: [
            {
                name: { type: String, required: true },
                // badgeNumber: { type: String, required: true },
                role: { type: String, enum: ['Case Manager', 'Investigator'], required: true }
            }
        ],
        caseStatus: { type: String, enum: ['Ongoing', 'Completed'], required: true },
        caseSummary: {type: String},
        scratchpadEntry: { type: String }, 
    },
    { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);

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