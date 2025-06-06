const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrTimelineSchema = new mongoose.Schema(
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
        caseNo: { type: String, required: true },
        leadReturnId: { type: String, required: true },
        enteredDate: { type: Date, required: true },
        eventDate: { type: Date, required: true },
        eventStartDate: { type: Date},
        eventEndDate: { type: Date },
        eventStartTime: { type: Date},
        eventEndTime: { type: Date },
        eventLocation: { type: String, required: true },
        eventDescription: { type: String, required: true },
        timelineFlag: {
            type: [String], 
            default: []
          },
          accessLevel: {
            type: String,
            enum: ["Only Case Manager", "Everyone"],
            default: "Everyone"
          }
       
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LRTimeline", lrTimelineSchema, "LRTimelines");
