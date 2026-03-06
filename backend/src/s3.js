// azure-storage.js
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob");
const { v4: uuid } = require("uuid");
const fs = require("fs");

// ✅ Use connection string + container name (recommended for backend)
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

if (!connectionString) {
  throw new Error("Missing env: AZURE_STORAGE_CONNECTION_STRING");
}
if (!containerName) {
  throw new Error("Missing env: AZURE_STORAGE_CONTAINER_NAME");
}

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

if (!accountName) throw new Error("Missing env: AZURE_STORAGE_ACCOUNT_NAME");
if (!accountKey) throw new Error("Missing env: AZURE_STORAGE_ACCOUNT_KEY");

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Optional: ensure container exists (safe in dev; in prod you can remove if you want)
async function ensureContainer() {
  try {
    await containerClient.createIfNotExists();
  } catch (e) {
    // Don’t crash server for this; but log it
    console.error("Azure container check failed:", e?.message || e);
  }
}
ensureContainer();

const uploadToS3 = async ({ filePath, userId, mimetype }) => {
  const key = `${userId}/${uuid()}`;
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  const fileStream = fs.createReadStream(filePath);

  await blockBlobClient.uploadStream(
    fileStream,
    4 * 1024 * 1024, // bufferSize (4MB)
    5,              // maxConcurrency
    {
      blobHTTPHeaders: { blobContentType: mimetype || "application/octet-stream" },
    }
  );

  return { key };
};

const deleteFromS3 = async (key) => {
  const blockBlobClient = containerClient.getBlockBlobClient(key);
  // avoid throwing if blob doesn't exist
  await blockBlobClient.deleteIfExists();
  return true;
};

// const getFileFromS3 = async (key) => {
//   const blockBlobClient = containerClient.getBlockBlobClient(key);
//   // NOTE: This returns a URL WITHOUT a SAS token.
//   // If you need public access, you must generate SAS per-blob (recommended) or proxy via backend.
//   return blockBlobClient.url;
// };

const getFileFromS3 = async (key) => {
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  const expiresOn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerClient.containerName,
      blobName: key,
      permissions: BlobSASPermissions.parse("r"), // read-only
      expiresOn,
    },
    sharedKeyCredential
  ).toString();

  return `${blockBlobClient.url}?${sasToken}`;
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
  getFileFromS3,
  getObjectBuffer,
};

// s3.js
// const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
// const { v4: uuid } = require("uuid");
// const fs = require("fs");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const uploadToS3 = async ({ filePath, userId, mimetype }) => {
//   if (!fs.existsSync(filePath)) {
//     throw new Error(`File not found for upload: ${filePath}`);
//   }
//   const key = `${userId}/${uuid()}`;
//   const fileBuffer = fs.readFileSync(filePath);

//   await s3.send(new PutObjectCommand({
//     Bucket: process.env.BUCKET,
//     Key: key,
//     Body: fileBuffer,
//     ContentType: mimetype,
//   }));
//   return { key };
// };

// const deleteFromS3 = async (key) => {
//   await s3.send(new DeleteObjectCommand({
//     Bucket: process.env.BUCKET,
//     Key: key,
//   }));
//   return true;
// };

// const getFileFromS3 = async (key) => {
//   const cmd = new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key });
//   return await getSignedUrl(s3, cmd, { expiresIn: 3600 });
// };

// const getObjectBuffer = async (key) => {
//   const cmd = new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key });
//   const resp = await s3.send(cmd);

//   if (resp.Body?.transformToByteArray) {
//     const bytes = await resp.Body.transformToByteArray();
//     return Buffer.from(bytes);
//   }

//   return await new Promise((resolve, reject) => {
//     const chunks = [];
//     resp.Body.on("data", (c) => chunks.push(c));
//     resp.Body.on("end", () => resolve(Buffer.concat(chunks)));
//     resp.Body.on("error", reject);
//   });
// };

// module.exports = {
//   s3,
//   uploadToS3,
//   deleteFromS3,
//   getFileFromS3,  
//   getObjectBuffer, 
// };
