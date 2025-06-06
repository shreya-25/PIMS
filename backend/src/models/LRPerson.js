const mongoose = require("mongoose");

const { Schema } = mongoose;    

const lrPersonSchema = new mongoose.Schema(
    {
        leadNo: { type: Number, required: true },
        description: { type: String, required: true },
        assignedTo: {
            assignees: [{ type: String}],
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
        enteredBy: { type: String, required: true},
        caseName: { type: String, required: true},
        caseNo: { type: String , required: true},
        leadReturnId: { type: String , required: true},
        enteredDate: { type: Date, required: true },  // Date field
        lastName: { type: String},
        firstName: { type: String, required: true },
        middleInitial: { type: String },
        suffix: { type: String },
        cellNumber: { type: String },
        alias: { type: String },
        businessName: { type: String },
        address: {
            street1: { type: String },
            street2: { type: String },
            building: { type: String },
            apartment: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
        },
        ssn: { type: String },
        age: { type: Number },
        email: { type: String },
        occupation: { type: String },
        personType: { type: String },
        condition: { type: String },
        cautionType: { type: String },
        sex: { type: String, enum: ["Male", "Female", "Other", ""] },
        race: { type: String },
        ethnicity: { type: String },
        skinTone: { type: String },
        eyeColor: { type: String },
        hairColor: { type: String },
        glasses: { type: String, enum: ["Yes", "No", ""] },
        height: {
            feet: { type: Number },
            inches: { type: Number },
        },
        weight: { type: Number },
        scar:{ type: String },
        tattoo: { type: String },
        mark: { type: String },
        additionalData: { type: Schema.Types.Mixed }, 
        accessLevel: {
            type: String,
            enum: ["Only Case Manager", "Everyone"],
            default: "Everyone"
          }
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LRPerson", lrPersonSchema, "LRPersons");
