const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner"); // ✅ Required for signed URLs

// ✅ Initialize S3 client using .env credentials
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,       
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Upload file to S3
const uploadToS3 = async ({ filePath, userId, mimetype }) => {
  const key = `${userId}/${uuid()}`;
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
    Body: fileStream,
    ContentType: mimetype,
  });

  try {
    await s3.send(command);
    return { key };
  } catch (error) {
    console.error("S3 upload error:", error);
    return { error };
  }
};

// ✅ Delete file from S3
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
  });

  try {
    await s3.send(command);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    return false;
  }
};

// ✅ Get file URL from S3 (Pre-signed URL)
const getFileFromS3 = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
  });

  try {
    // Generate pre-signed URL valid for 1 hour (3600 seconds)
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error("S3 fetch error:", error);
    return null;
  }
};

module.exports = { uploadToS3, deleteFromS3, getFileFromS3, s3 };