// s3.js
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async ({ filePath, userId, mimetype }) => {
  const key = `${userId}/${uuid()}`;
  const fileStream = fs.createReadStream(filePath);

  await s3.send(new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
    Body: fileStream,
    ContentType: mimetype,
  }));
  return { key };
};

const deleteFromS3 = async (key) => {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
  }));
  return true;
};

const getFileFromS3 = async (key) => {
  const cmd = new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key });
  return await getSignedUrl(s3, cmd, { expiresIn: 3600 });
};

// ✅ NEW: fetch object bytes as a Node Buffer (what pdfkit needs)
const getObjectBuffer = async (key) => {
  const cmd = new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key });
  const resp = await s3.send(cmd);

  // Node 18+/AWS SDK v3 provides transformToByteArray on the stream
  if (resp.Body?.transformToByteArray) {
    const bytes = await resp.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  // Fallback: stream -> buffer (if transformToByteArray not available)
  return await new Promise((resolve, reject) => {
    const chunks = [];
    resp.Body.on("data", (c) => chunks.push(c));
    resp.Body.on("end", () => resolve(Buffer.concat(chunks)));
    resp.Body.on("error", reject);
  });
};

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
  getFileFromS3,   // presigned URL (for downloads in UI)
  getObjectBuffer, // raw bytes (for server-side embedding)
};
