// azure-storage.js
// const { BlobServiceClient } = require("@azure/storage-blob");
// const { v4: uuid } = require("uuid");
// const fs = require("fs");

// const accountName = process.env.STORAGE_ACCOUNT_NAME;
// const sasToken = process.env.SAS_TOKEN;
// const containerName = process.env.CONTAINER_NAME;

// const blobServiceClient = new BlobServiceClient(
//   `https://${accountName}.blob.core.windows.net?${sasToken}`
// );

// const containerClient = blobServiceClient.getContainerClient(containerName);

// const uploadToS3 = async ({ filePath, userId, mimetype }) => {
//   const key = `${userId}/${uuid()}`;
//   const blockBlobClient = containerClient.getBlockBlobClient(key);

//   const fileStream = fs.createReadStream(filePath);

//   await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
//     blobHTTPHeaders: { blobContentType: mimetype }
//   });

//   return { key };
// };

// const deleteFromS3 = async (key) => {
//   const blockBlobClient = containerClient.getBlockBlobClient(key);
//   await blockBlobClient.delete();
//   return true;
// };

// const getFileFromS3 = async (key) => {
//   const blockBlobClient = containerClient.getBlockBlobClient(key);

//   // Return the blob URL (already has SAS token from container client)
//   return blockBlobClient.url;
// };

// const getObjectBuffer = async (key) => {
//   const blockBlobClient = containerClient.getBlockBlobClient(key);

//   const downloadResponse = await blockBlobClient.download(0);

//   return await new Promise((resolve, reject) => {
//     const chunks = [];
//     downloadResponse.readableStreamBody.on("data", (chunk) => chunks.push(chunk));
//     downloadResponse.readableStreamBody.on("end", () => resolve(Buffer.concat(chunks)));
//     downloadResponse.readableStreamBody.on("error", reject);
//   });
// };

// module.exports = {
//   blobServiceClient,
//   uploadToS3,
//   deleteFromS3,
//   getFileFromS3,  
//   getObjectBuffer, 
// };

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

const getObjectBuffer = async (key) => {
  const cmd = new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key });
  const resp = await s3.send(cmd);

  if (resp.Body?.transformToByteArray) {
    const bytes = await resp.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

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
  getFileFromS3,  
  getObjectBuffer, 
};
