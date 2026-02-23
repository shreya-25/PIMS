require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const { getObjectBuffer } = require("../s3");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const LRPerson = require("../models/LRPerson");
  const persons = await LRPerson.find({
    photoS3Key: { $exists: true, $ne: null, $ne: "" }
  }).select("photoS3Key firstName leadNo").lean();

  console.log(`Found ${persons.length} persons with photos\n`);

  for (const p of persons) {
    try {
      const buf = await getObjectBuffer(p.photoS3Key);
      const hex = buf.slice(0, 16).toString("hex");
      let format = "UNKNOWN";
      if (buf[0] === 0xFF && buf[1] === 0xD8) format = "JPEG";
      else if (buf[0] === 0x89 && buf.slice(1, 4).toString() === "PNG") format = "PNG";
      else if (buf.toString("ascii", 4, 8) === "ftyp") {
        format = "HEIC/HEIF (brand=" + buf.toString("ascii", 8, 12) + ")";
      } else if (buf.slice(0, 4).toString() === "RIFF") format = "WEBP";
      console.log(`Lead ${p.leadNo} ${p.firstName} | format: ${format} | size: ${buf.length} | hex: ${hex}`);
    } catch (e) {
      console.log(`Lead ${p.leadNo} ${p.firstName} | S3 ERROR: ${e.message}`);
    }
  }
  await mongoose.connection.close();
})();
