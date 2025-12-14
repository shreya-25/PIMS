// azure-storage.js
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuid } = require("uuid");
const fs = require("fs");

const accountName = process.env.STORAGE_ACCOUNT_NAME;
const sasToken = process.env.SAS_TOKEN;
const containerName = process.env.CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net?${sasToken}`
);

const containerClient = blobServiceClient.getContainerClient(containerName);

const uploadToS3 = async ({ filePath, userId, mimetype }) => {
  const key = `${userId}/${uuid()}`;
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  const fileStream = fs.createReadStream(filePath);

  await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
    blobHTTPHeaders: { blobContentType: mimetype }
  });

  return { key };
};

const deleteFromS3 = async (key) => {
  const blockBlobClient = containerClient.getBlockBlobClient(key);
  await blockBlobClient.delete();
  return true;
};

const getFileFromS3 = async (key) => {
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  // Return the blob URL (already has SAS token from container client)
  return blockBlobClient.url;
};

const getObjectBuffer = async (key) => {
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  const downloadResponse = await blockBlobClient.download(0);

  return await new Promise((resolve, reject) => {
    const chunks = [];
    downloadResponse.readableStreamBody.on("data", (chunk) => chunks.push(chunk));
    downloadResponse.readableStreamBody.on("end", () => resolve(Buffer.concat(chunks)));
    downloadResponse.readableStreamBody.on("error", reject);
  });
};

module.exports = {
  blobServiceClient,
  uploadToS3,
  deleteFromS3,
  getFileFromS3,   // presigned URL (for downloads in UI)
  getObjectBuffer, // raw bytes (for server-side embedding)
};
