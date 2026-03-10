const LRTimeline = require("../models/LRTimeline");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

const createLRTimeline = async (req, res) => {
    try {
        // Resolve ObjectId refs
        const refs = await resolveLeadReturnRefs({
            caseNo: req.body.caseNo,
            caseName: req.body.caseName,
            leadNo: req.body.leadNo,
            enteredBy: req.body.enteredBy,
        });

        const newLRTimeline = new LRTimeline({
            leadNo: req.body.leadNo,
            description: req.body.description,
            enteredBy: req.body.enteredBy,
            caseName: req.body.caseName,
            caseNo: req.body.caseNo,
            leadReturnId: req.body.leadReturnId,
            enteredDate: req.body.enteredDate,
            eventDate: req.body.eventDate,
            eventStartDate: req.body.eventStartDate,
            eventEndDate: req.body.eventEndDate,
            eventStartTime: req.body.eventStartTime,
            eventEndTime: req.body.eventEndTime,
            eventLocation: req.body.eventLocation,
            eventDescription: req.body.eventDescription,
            timelineFlag: req.body.timelineFlag,
            accessLevel: req.body.accessLevel,
            // ObjectId refs
            caseId: refs.caseId,
            leadId: refs.leadId,
            leadReturnObjectId: refs.leadReturnObjectId,
            enteredByUserId: refs.enteredByUserId,
        });

        await newLRTimeline.save();
        res.status(201).json({ message: "Timeline entry created successfully", timeline: newLRTimeline });
    } catch (err) {
        console.error("Error creating LRTimeline entry:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getTimelinesByCase = async (req, res) => {
    try {
        const { caseNo, caseName } = req.params;
        if (!caseNo || !caseName) return res.status(400).json({ message: "Both case number and case name are required." });

        const timelines = await LRTimeline.find({ caseNo, caseName, isDeleted: { $ne: true } });
        if (!timelines || timelines.length === 0) return res.status(404).json({ message: "No timeline entries found for the provided case." });

        res.status(200).json(timelines);
    } catch (err) {
        console.error("Error fetching timeline entries:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRTimelineByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, isDeleted: { $ne: true } };
        const timeline = await LRTimeline.find(query);

        if (timeline.length === 0) return res.status(404).json({ message: "No timeline entries found." });
        res.status(200).json(timeline);
    } catch (err) {
        console.error("Error fetching LRTimeline records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLRTimeline = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {};

      if (req.body.leadReturnId !== undefined) updates.leadReturnId = req.body.leadReturnId;
      if (req.body.eventDate !== undefined) updates.eventDate = req.body.eventDate;
      if (req.body.eventStartDate !== undefined) updates.eventStartDate = req.body.eventStartDate;
      if (req.body.eventEndDate !== undefined) updates.eventEndDate = req.body.eventEndDate;
      if (req.body.eventStartTime !== undefined) updates.eventStartTime = req.body.eventStartTime;
      if (req.body.eventEndTime !== undefined) updates.eventEndTime = req.body.eventEndTime;
      if (req.body.eventLocation !== undefined) updates.eventLocation = req.body.eventLocation;
      if (req.body.eventDescription !== undefined) updates.eventDescription = req.body.eventDescription;
      if (req.body.timelineFlag !== undefined) updates.timelineFlag = req.body.timelineFlag;
      if (req.body.accessLevel !== undefined) updates.accessLevel = req.body.accessLevel;

      const updated = await LRTimeline.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ message: "Timeline entry not found." });
      res.json({ message: "Timeline entry updated", timeline: updated });
    } catch (err) {
      console.error("Error updating timeline:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
};

const deleteLRTimeline = async (req, res) => {
    try {
      const { id } = req.params;
      const removed = await LRTimeline.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Timeline entry not found." });
      res.json({ message: "Timeline entry deleted" });
    } catch (err) {
      console.error("Error deleting timeline:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLRTimeline, getTimelinesByCase, getLRTimelineByDetails, updateLRTimeline, deleteLRTimeline };
