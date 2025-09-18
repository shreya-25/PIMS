const mongoose = require("mongoose");

const leadEventSchema = new mongoose.Schema({
  type: { type: String, enum: ["assigned","accepted","declined","reassigned-added","reassigned-removed"], required: true },
  by: String,                    // actor username (CM/officer)
  to: [String],                  // affected usernames
  primaryInvestigator: String,
  reason: String,                // for declines (optional)
  statusAfter: String,           // leadStatus after this event
  at: { type: Date, default: Date.now }
}, { _id: false });

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
   primaryInvestigator: {
      type: String, // store username
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // allow null/unset
          return this.assignedTo?.some(a => a.username === v);
        },
        message: "Primary investigator must be one of the assigned investigators."
      }
    },
        assignedBy: { type: String, required: true },
        summary: { type: String, required: true },
        description: { type: String, required: true },
        leadStatus: { type: String, required: true, enum: ["Created", "Assigned", "Accepted","To Reassign","Rejected", "In Review", "Approved","Returned", "Completed", "Closed"], default: "Assigned"},
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
          },
        comment: { type: String },
        events: { type: [leadEventSchema], default: [] },
    },
    { timestamps: true }
);
leadSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });

module.exports = mongoose.model("Lead", leadSchema, "leads");
