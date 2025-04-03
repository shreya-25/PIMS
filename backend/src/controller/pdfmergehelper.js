const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function mergeWithAnotherPDF(pdfKitBuffer, otherPdfPath) {
  // 1) Load the PDFKit doc in pdf-lib
  const mainDoc = await PDFDocument.load(pdfKitBuffer);

  // 2) Read the other PDF you want to merge pages from
  const otherBuffer = fs.readFileSync(otherPdfPath);
  const otherDoc = await PDFDocument.load(otherBuffer);

  // 3) Copy all pages from the other PDF
  const copiedPages = await mainDoc.copyPages(otherDoc, otherDoc.getPageIndices());
  copiedPages.forEach((page) => mainDoc.addPage(page));

  // 4) Save and return the merged PDF as a Buffer
  const mergedPdfBytes = await mainDoc.save();
  return Buffer.from(mergedPdfBytes);
}
