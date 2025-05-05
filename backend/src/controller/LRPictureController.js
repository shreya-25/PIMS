const LRPicture = require("../models/LRPicture");

// **Create a new LREnclosure entry with file upload support**
const createLRPicture = async (req, res) => {
    try {
      const isLink = req.body.isLink === "true";

      let filePath = null;
      let originalName = null;
      let filename = null;
  
      if (!isLink) {
        if (!req.file) return res.status(400).json({ error: 'No file received' });
        filePath = req.file.path;
        originalName = req.file.originalname;
        filename = req.file.filename;
      }
        // Create a new LREnclosure document with the file reference
        const newLRPicture = new LRPicture({
            leadNo: req.body.leadNo,
            description: req.body.description,
            assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
            assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
            enteredBy: req.body.enteredBy,
            caseName: req.body.caseName,
            caseNo: req.body.caseNo,
            leadReturnId: req.body.leadReturnId,
            enteredDate: req.body.enteredDate,
            datePictureTaken: req.body.datePictureTaken,
            pictureDescription:req.body.pictureDescription,
            accessLevel,
            // fileId, // Store the GridFS file reference here
            isLink,
            link: isLink ? req.body.link : null,
            filePath,
            originalName,
            filename
        });

        // Save the document in MongoDB
        await newLRPicture.save();

        // Send one final response after successful save
        res.status(201).json({
            message: "Picture created successfully",
            picture: newLRPicture
        });
    } catch (err) {
        console.error("Error creating LRPicture:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLRPictureByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        // const lrEnclosures = await LREnclosure.find(query).populate("fileId");
        const lrPictures = await LRPicture.find(query);

        if (lrPictures.length === 0) {
            return res.status(404).json({ message: "No Pictures found." });
        }

        res.status(200).json(lrPictures);
    } catch (err) {
        console.error("Error fetching lrPictures records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Update existing picture
const updateLRPicture = async (req, res) => {
    try {
      const { leadNo, leadName, caseNo, caseName, leadReturnId, pictureDescription: oldDesc } = req.params;
      const pic = await LRPicture.findOne({ leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId, pictureDescription: oldDesc });
      if (!pic) return res.status(404).json({ message: "Picture not found" });
  
      if (req.file && pic.filePath) {
        try { if (fs.existsSync(pic.filePath)) fs.unlinkSync(pic.filePath); } catch (fsErr) { console.warn(fsErr); }
        pic.filePath = req.file.path;
        pic.originalName = req.file.originalname;
        pic.filename = req.file.filename;
      }
  
      pic.leadReturnId = req.body.leadReturnId;
      pic.datePictureTaken = req.body.datePictureTaken;
      pic.pictureDescription = req.body.pictureDescription;
      pic.enteredBy = req.body.enteredBy;
      await pic.save();
      return res.json(pic);
    } catch (err) {
      console.error("Error updating LRPicture:", err);
      return res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // Delete a picture
  const deleteLRPicture = async (req, res) => {
    try {
      const { leadNo, leadName, caseNo, caseName, leadReturnId, pictureDescription } = req.params;
      const pic = await LRPicture.findOneAndDelete({ leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId, pictureDescription });
      if (!pic) return res.status(404).json({ message: "Picture not found" });
  
      if (pic.filePath) {
        try { if (fs.existsSync(pic.filePath)) fs.unlinkSync(pic.filePath); } catch (fsErr) { console.warn(fsErr); }
      }
      return res.json({ message: "Picture deleted" });
    } catch (err) {
      console.error("Error deleting LRPicture:", err);
      if (!res.headersSent) return res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLRPicture, getLRPictureByDetails, updateLRPicture, deleteLRPicture  };
