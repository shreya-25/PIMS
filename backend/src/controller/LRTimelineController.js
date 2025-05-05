const LRTimeline = require("../models/LRTimeline");
const fs = require("fs");
const path = require("path");

// **Create a new LRTimeline entry**
const createLRTimeline = async (req, res) => {
    try {
        // Optionally parse JSON strings for complex fields if necessary
        // const assignedTo = req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {};
        // const assignedBy = req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {};
        // const timelineFlag = req.body.timelineFlag ? JSON.parse(req.body.timelineFlag) : [];

        const {
            leadNo,
            description, // Lead Name
            assignedTo,
            assignedBy,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            enteredDate,
            eventDate,
            eventStartDate,
            eventEndDate,
            eventStartTime,
            eventEndTime,
            eventLocation,
            eventDescription,
            timelineFlag,
            accessLevel,
           
        } = req.body;


        // Build a new LRTimeline document from the request body
        const newLRTimeline = new LRTimeline({
            leadNo: req.body.leadNo,
            description: req.body.description,
            assignedTo: assignedTo,
            assignedBy: assignedBy,
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
            timelineFlag: timelineFlag,
            accessLevel: accessLevel
        });

        // Save the document in MongoDB
        await newLRTimeline.save();

        // Send a successful response with the created timeline entry
        res.status(201).json({
            message: "Timeline entry created successfully",
            timeline: newLRTimeline
        });
    } catch (err) {
        console.error("Error creating LRTimeline entry:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// **Get all timeline entries for a given case (using caseNo and caseName)**
const getTimelinesByCase = async (req, res) => {
    try {
        // Extract caseNo and caseName from the URL parameters.
        const { caseNo, caseName } = req.params;

        if (!caseNo || !caseName) {
            return res.status(400).json({ message: "Both case number and case name are required." });
        }

        // Find timeline entries that match the provided case number and case name.
        const timelines = await LRTimeline.find({ caseNo, caseName });

        if (!timelines || timelines.length === 0) {
            return res.status(404).json({ message: "No timeline entries found for the provided case." });
        }

        res.status(200).json(timelines);
    } catch (err) {
        console.error("Error fetching timeline entries:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRTimelineByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo,
            caseName
        };

        const timeline = await LRTimeline.find(query);

        if (timeline.length === 0) {
            return res.status(404).json({ message: "No timeline entries found." });
        }

        res.status(200).json(timeline);
    } catch (err) {
        console.error("Error fetching LRTimeline records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLRTimeline = async (req, res) => {
    try {
      const { id } = req.params;
      // build updates only from allowed fields
      const updates = {
        leadReturnId: req.body.leadReturnId,
        eventDate: req.body.eventDate,
        eventStartDate: req.body.eventStartDate,
        eventEndDate: req.body.eventEndDate,
        eventStartTime: req.body.eventStartTime,
        eventEndTime: req.body.eventEndTime,
        eventLocation: req.body.eventLocation,
        eventDescription: req.body.eventDescription,
        timelineFlag: req.body.timelineFlag,
      };
  
      const updated = await LRTimeline.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ message: "Timeline entry not found." });
      res.json({ message: "Timeline entry updated", timeline: updated });
    } catch (err) {
      console.error("Error updating timeline:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // ★ DELETE a timeline entry by its Mongo ID
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


module.exports = { createLRTimeline, getTimelinesByCase, getLRTimelineByDetails ,  updateLRTimeline, deleteLRTimeline};
