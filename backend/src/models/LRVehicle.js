const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrVehicleSchema = new mongoose.Schema(
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
        caseNo: { type: Number, required: true },
        leadReturnId: { type: String, required: true },
        enteredDate: { type: Date, required: true },

        // Vehicle Information
        year: { type: String },
        make: { type: String },
        model: { type: String },
        plate: { type: String },
        vin: { type: String },
        state: { type: String },
        category: { type: String },
        type: { type: String },
        primaryColor: { type: String },
        secondaryColor: { type: String },
        information: { type: String },

        additionalData: { type: Schema.Types.Mixed } // Flexible structure for extra fields
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LRVehicle", lrVehicleSchema, "LRVehicles");
