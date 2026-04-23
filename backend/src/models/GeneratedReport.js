const { Schema, model } = require("mongoose");

const generatedReportSchema = new Schema(
  {
    caseId:      { type: String, required: true, index: true },
    caseNo:      { type: String, default: "" },
    caseName:    { type: String, default: "" },
    reportType:  { type: String, enum: ["full", "timeline"], default: "full" },
    s3Key:       { type: String, default: null },
    status:      { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    summaryMode: { type: String, enum: ["none", "web", "file"], default: "none" },
    generatedBy: { type: String, default: "" },
    generatedAt: { type: Date, default: null },
    error:       { type: String, default: null },
    // which lead numbers were included (for cache-key matching)
    leadNos:     [{ type: Number }],
  },
  { timestamps: true }
);

module.exports = model("GeneratedReport", generatedReportSchema);
