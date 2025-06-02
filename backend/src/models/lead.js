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
        subNumber: [{ type: String}],
        associatedSubNumbers: [{ type: String}],
        assignedDate: { type: Date, required: true },
        completedDate: { type: Date },
         assignedTo: [{
    username: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    }
  }],
        assignedBy: { type: String, required: true },
        summary: { type: String, required: true },
        description: { type: String, required: true },
        leadStatus: { type: String, required: true, enum: ["Assigned", "Accepted", "In Review", "Approved","Returned", "Completed"], default: "Assigned"},
        dueDate: { type: Date },
        priority:  { type: String },
        caseName: { type: String, required: true},
        caseNo: { type: String, required: true},
        associatedFlags:  [{ type: String}],
        submittedDate:  { type: Date },
        approvedDate:   { type: Date },
        returnedDate: { type: Date },
        accessLevel: {
            type: String,
            enum: ["Only Case Manager and Assignees", "Everyone"],
            default: "Everyone"
          }
    },
    { timestamps: true }
);
leadSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });
module.exports = mongoose.model("Lead", leadSchema, "leads");
