const PDFDocument = require("pdfkit");
const { PDFDocument: PDFLibDocument } = require("pdf-lib");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const heicConvert = require("heic-convert");
const { getObjectBuffer } = require("../s3");
const User = require("../models/userModel");

async function toPdfSafeBuffer(buf) {
  if (!buf || buf.length < 12) return buf;
  if (buf[0] === 0xFF && buf[1] === 0xD8) return buf;
  if (buf[0] === 0x89 && buf.slice(1, 4).toString() === "PNG") return buf;
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (["heic", "heix", "hevc", "mif1"].includes(brand)) {
      const jpegBuf = await heicConvert({ buffer: buf, format: "JPEG", quality: 0.8 });
      return Buffer.from(jpegBuf);
    }
  }
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
    return sharp(buf).png().toBuffer();
  }
  try {
    return await sharp(buf).png().toBuffer();
  } catch {
    return buf;
  }
}

// Helper: merges your PDFKit doc with an external PDF
// async function mergeWithAnotherPDF(pdfKitBuffer, otherPdfPath) {
//   const mainDoc = await PDFLibDocument.load(pdfKitBuffer);
//   const otherBuffer = fs.readFileSync(otherPdfPath);
//   const otherDoc = await PDFLibDocument.load(otherBuffer);

//   // Copy every page from otherDoc, append to mainDoc
//   const copiedPages = await mainDoc.copyPages(otherDoc, otherDoc.getPageIndices());
//   copiedPages.forEach((page) => mainDoc.addPage(page));

//   // Return the final merged PDF as a buffer
//   const mergedPdfBytes = await mainDoc.save();
//   return Buffer.from(mergedPdfBytes);
// }

function drawMetaBar(doc, x, y, width, entry, userMap = {}) {
  const padding = 5;
  const bg = "#ffffff";
  const border = "#ccc";
  const fontSize = 10;

  // Narrow ID column; give Date enough room for label+value; By gets the rest
  const colW1 = 105;                     // Narrative ID
  const colW3 = 125;                     // Entered Date — label + MM/DD/YY on one line
  const colW2 = width - colW1 - colW3;  // Entered By — gets ~282px

  const idVal = `${entry.leadReturnId ?? "N/A"}`;
  const rawBy = entry.enteredBy;
  const byVal = rawBy && userMap[rawBy] ? formatFromUser(userMap[rawBy]) : (rawBy ?? "N/A");
  const dtVal = `${formatDate(entry.enteredDate) || "N/A"}`;

  const cols = [
    { w: colW1, label: "Narrative ID:", value: idVal },
    { w: colW2, label: "Entered By:", value: byVal },
    { w: colW3, label: "Entered Date:", value: dtVal },
  ];

  const rowH = 22;

  const bottom = doc.page.height - doc.page.margins.bottom;
  if (y + rowH > bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }

  // Draw cell backgrounds and borders
  let cx = x;
  cols.forEach(({ w }) => {
    doc.rect(cx, y, w, rowH).fillAndStroke(bg, border);
    cx += w;
  });

  // Draw label bold + value normal on one line per cell
  cx = x;
  const textY = y + (rowH - fontSize * 1.2) / 2; // vertically centre the text
  cols.forEach(({ w, label, value }) => {
    const textX = cx + padding;
    const maxW  = w - 2 * padding;
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(fontSize)
      .text(label, textX, textY, { continued: true });
    doc.font("Helvetica").fontSize(fontSize)
      .text(` ${value}`, { width: maxW, lineBreak: false, ellipsis: true });
    cx += w;
  });

  doc.fillColor("black");
  return y + rowH + 10;
}

async function mergeWithAnotherPDF(pdfKitBuffer, otherPdfBuffer) {
  const mainDoc = await PDFLibDocument.load(pdfKitBuffer);
  const otherDoc = await PDFLibDocument.load(otherPdfBuffer);
  const copied = await mainDoc.copyPages(otherDoc, otherDoc.getPageIndices());
  copied.forEach(p => mainDoc.addPage(p));
  const merged = await mainDoc.save();
  return Buffer.from(merged);
}

/**
 * Scale every page of a PDF so its content fits within a Letter page.
 * Pages that already fit are never upscaled.
 *
 * isPicture = true  → smaller box (420×315) so images don't overwhelm the report
 * isPicture = false → near-full page (512×692) so documents remain readable
 */
async function scalePdfPagesToFit(pdfBuffer, { isPicture = false } = {}) {
  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 50;

  const maxContentW = isPicture ? 420 : PAGE_W - 2 * MARGIN;
  const maxContentH = isPicture ? 315 : PAGE_H - 2 * MARGIN;

  const srcDoc = await PDFLibDocument.load(pdfBuffer);
  const dstDoc = await PDFLibDocument.create();

  for (let i = 0; i < srcDoc.getPageCount(); i++) {
    const [embedded] = await dstDoc.embedPages([srcDoc.getPage(i)]);
    const srcW = embedded.width;
    const srcH = embedded.height;

    const scale = Math.min(maxContentW / srcW, maxContentH / srcH, 1);
    const dW    = srcW * scale;
    const dH    = srcH * scale;

    const page = dstDoc.addPage([PAGE_W, PAGE_H]);
    page.drawPage(embedded, {
      x:      (PAGE_W - dW) / 2,
      y:      PAGE_H - MARGIN - dH,
      width:  dW,
      height: dH,
    });
  }

  return Buffer.from(await dstDoc.save());
}

function startSection(doc, title, currentY) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  const minNeeded = 60; // need room for header + at least one row of content
  if (currentY + minNeeded > bottom) {
    doc.addPage();
    currentY = doc.page.margins.top;
  }
  doc.font("Helvetica-Bold").fontSize(11).text(title, 50, currentY);
  return currentY + 18;
}


// helper to format just the time portion
function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", {
    hour:   "2-digit",
    minute: "2-digit"
  });
}

function formatFromUser(u) {
  if (u.lastName || u.firstName) {
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    if (last && first) return `${last}, ${first}`;
    return last || first;
  }
  return u.username || "";
}

function formatOfficer(off, userMap = {}) {
  if (!off) return "";
  const uname = typeof off === "string" ? off : off.username;
  if (uname && userMap[uname]) return formatFromUser(userMap[uname]);
  if (typeof off === "string") return off;
  if (off.fullName) return off.fullName;
  if (off.displayName) return off.displayName;
  if (off.name) return off.name;
  if (off.firstName || off.lastName) {
    const last  = (off.lastName  || "").trim();
    const first = (off.firstName || "").trim();
    if (last && first) return `${last}, ${first}`;
    return last || first;
  }
  if (off.user) return formatOfficer(off.user, userMap);
  if (off.email) return off.email;
  if (off.username) return off.username;
  return "";
}

function formatOfficerList(arr, userMap = {}) {
  if (!Array.isArray(arr) || arr.length === 0) return "N/A";
  const names = arr
    .map(off => formatOfficer(off, userMap))
    .filter(Boolean);

  if (names.length === 0) return "N/A";
  // de-dupe while preserving order
  const seen = new Set();
  const deduped = names.filter(n => (seen.has(n) ? false : (seen.add(n), true)));
  return deduped.join("; ");
}

// front table 
function drawLeadWorksheetTwoColTable(doc, x, y, leadInstruction) {
  const padX = 8;
  const padY = 3;
  const headerBg = "#f5f5f5";
  const borderColor = "#CCCCCC";

  const headerFont = "Helvetica-Bold";
  const bodyFont = "Helvetica";
  const headerFS = 11;
  const bodyFS = 11;

  doc.lineGap(0);

  const tableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const col1W = Math.round(tableW * 0.58);
  const col2W = tableW - col1W;

  const rows = [
    { left: "Lead Worksheet", right: `Lead #: ${leadInstruction?.leadNo || "N/A"}`, isHeader: true },
    { left: "Character of Case: Missing Person/Homicide", right: `Case Number: ${leadInstruction?.caseNo || "N/A"}` },
    { left: `Lead Received by: ${leadInstruction?.receivedBy || ""}`, right: `Date Assigned: ${formatDate(leadInstruction?.assignedDate) || ""}` },
    { left: `Lead Assigned to: ${formatOfficerList(leadInstruction?.assignedTo) || ""}`, right: `Date Submitted: ${formatDate(leadInstruction?.submittedDate) || ""}` },
    { left: `Lead Assigned by: ${formatOfficer(leadInstruction?.assignedBy) || leadInstruction?.assignedBy || ""}`, right: `Source: ${leadInstruction?.parentLeadNo ? leadInstruction.parentLeadNo.join(", ") : ""}` },
  ];

  const minRowH = 20; // ✅ key fix (use 28–32)
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  const pageTop = doc.page.margins.top;

  function measure(text, width, font, size) {
    doc.font(font).fontSize(size);
    return doc.heightOfString(text || "", {
      width,
      align: "left",
      lineBreak: true,
    });
  }

  function centerY(currY, rowH, textH) {
    // true centering, then clamp so it never touches borders
    const ideal = currY + (rowH - textH) / 2;
    const minY = currY + padY;
    const maxY = currY + rowH - padY - textH;
    // tiny visual nudge down (baseline compensation)
    const nudged = ideal + 0.5;
    return Math.max(minY, Math.min(nudged, maxY));
  }

  // whole-table fit check (rough)
  if (y + rows.length * minRowH > pageBottom) {
    doc.addPage();
    y = pageTop;
  }

  let currY = y;

  for (const r of rows) {
    const font = r.isHeader ? headerFont : bodyFont;
    const fs = r.isHeader ? headerFS : bodyFS;

    const leftBoxW = col1W - 2 * padX;
    const rightBoxW = col2W - 2 * padX;

    const leftH = measure(r.left, leftBoxW, font, fs);
    const rightH = measure(r.right, rightBoxW, font, fs);

    const rowH = Math.max(minRowH, leftH + 2 * padY, rightH + 2 * padY);

    if (currY + rowH > pageBottom) {
      doc.addPage();
      currY = pageTop;
    }

    if (r.isHeader) {
      doc.save();
      doc.fillColor(headerBg).rect(x, currY, col1W + col2W, rowH).fill();
      doc.restore();
    }

    doc.save();
    doc.lineWidth(0.8).strokeColor(borderColor);
    doc.rect(x, currY, col1W, rowH).stroke();
    doc.rect(x + col1W, currY, col2W, rowH).stroke();
    doc.restore();

    doc.font(font).fontSize(fs).fillColor("black");
    const leftY = centerY(currY, rowH, leftH);
    doc.text(r.left || "", x + padX, leftY, { width: leftBoxW, align: "left", lineBreak: true });

    doc.font(font).fontSize(fs).fillColor("black");
    const rightY = centerY(currY, rowH, rightH);
    doc.text(r.right || "", x + col1W + padX, rightY, { width: rightBoxW, align: "left", lineBreak: true });

    currY += rowH;
  }

  return currY + 8;
}

//Photo Attachment
async function addPersonPhotoPage(doc, person, personIndex) {
  if (!person?.photoS3Key) return;

  try {
    const rawBuf = await getObjectBuffer(person.photoS3Key);
    const imgBuf = await toPdfSafeBuffer(rawBuf);

    // Get image size (sharp supports jpeg/png/webp)
    const meta = await sharp(imgBuf).metadata();
    const imgW = meta.width || 600;
    const imgH = meta.height || 800;

    // Page settings
    const margin = 36; // 0.5 inch
    const maxPageW = 612; // LETTER width in points
    const maxPageH = 792; // LETTER height in points

    // Option A (Recommended): Keep LETTER page, scale image to fit
    doc.addPage({ size: "LETTER", margin });

    // Title
    doc.font("Helvetica-Bold").fontSize(14).text(`Person ${personIndex + 1} Photo`, { align: "center" });
    doc.moveDown(0.5);

    const availableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const availableH = doc.page.height - doc.y - doc.page.margins.bottom;

    // Fit image to available area
    doc.image(imgBuf, doc.page.margins.left, doc.y, {
      fit: [availableW, availableH],
      align: "center",
      valign: "center",
    });

    // Optional caption
    doc.moveDown(0.5);
    if (person.firstName || person.lastName) {
      const name = `${person.firstName || ""} ${person.lastName || ""}`.trim();
      doc.font("Helvetica").fontSize(10).fillColor("#555").text(name, { align: "center" });
      doc.fillColor("black");
    }

    // Option B (If you truly want page size = image size):
    // Uncomment this if you want the page to match the image dimensions.
    // Note: Very large images can produce huge pages.
    /*
    const pageW = Math.min(imgW + margin * 2, 2000); // hard cap to avoid gigantic pages
    const pageH = Math.min(imgH + margin * 2, 2000);
    doc.addPage({ size: [pageW, pageH], margin });

    doc.font("Helvetica-Bold").fontSize(14).text(`Person ${personIndex + 1} Photo`, { align: "center" });
    doc.moveDown(0.5);

    const aw = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const ah = doc.page.height - doc.y - doc.page.margins.bottom;

    doc.image(imgBuf, doc.page.margins.left, doc.y, {
      fit: [aw, ah],
      align: "center",
      valign: "center",
    });
    */
  } catch (e) {
    console.warn(`Failed to add person photo page for person ${personIndex + 1}:`, e?.message);
  }
}

async function appendPersonPhotoPagesAtEnd(doc, persons = []) {
  if (!Array.isArray(persons) || persons.length === 0) return;

  for (let i = 0; i < persons.length; i++) {
    const p = persons[i];
    if (!p?.photoS3Key) continue;

    try {
      const rawBuf = await getObjectBuffer(p.photoS3Key);
      const imgBuf = await toPdfSafeBuffer(rawBuf);

      // New page per photo (clean)
      doc.addPage({ size: "LETTER", margin: 50 });

      const name =
        `${p.lastName || ""}, ${p.firstName || ""}`.replace(/^,\s*$/, "").trim() ||
        p.name ||
        `Person ${i + 1}`;

      doc.font("Helvetica-Bold").fontSize(12).text(`Person ${i + 1}: ${name}`, { align: "left" });
      doc.moveDown(0.5);

      const x = doc.page.margins.left;
      const y = doc.y;
      const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const h = doc.page.height - y - doc.page.margins.bottom;

      // Fit image nicely within page
      doc.image(imgBuf, x, y, {
        fit: [w, h],
        align: "center",
        valign: "center",
      });

    } catch (e) {
      console.warn(`Photo append failed for person ${i + 1}:`, e?.message);
    }
  }
}

// function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
//   const minRowHeight = 20;
//   doc.font("Helvetica-Bold").fontSize(10);
//   let currentY = startY;

//   let headerHeight = 20;
//   let currentX = startX;
//   headers.forEach((header, i) => {
//     doc.strokeColor("#999999");
//     doc.rect(currentX, currentY, colWidths[i], headerHeight).stroke();
//     doc.text(header, currentX + padding, currentY + padding, {
//       width: colWidths[i] - 2 * padding,
//       align: "left"
//     });
//     currentX += colWidths[i];
//   });

//   currentY += headerHeight;
//   doc.font("Helvetica").fontSize(10);

//   rows.forEach((row) => {
//     let maxHeight = 0;
//     currentX = startX;

//     headers.forEach((header, i) => {
//       const cellText = row[header] || "";
//       const cellHeight = doc.heightOfString(cellText, {
//         width: colWidths[i] - 2 * padding,
//         align: "left"
//       });
//       maxHeight = Math.max(maxHeight, cellHeight + 2 * padding);
//     });

//     maxHeight = Math.max(maxHeight, minRowHeight);

//     headers.forEach((header, i) => {
//       const cellText = row[header] || "";
//       doc.rect(currentX, currentY, colWidths[i], maxHeight).stroke();
//       doc.text(cellText, currentX + padding, currentY + padding, {
//         width: colWidths[i] - 2 * padding,
//         align: "left"
//       });
//       currentX += colWidths[i];
//     });

//     currentY += maxHeight;
//   });

//   return currentY;
// }

// function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
//   const minRowHeight = 20;
//   const headerHeight = 20;
//   let currentY = startY;

//   // 1) Draw header row
//   doc.font("Helvetica-Bold").fontSize(10).fillColor("black");
//   let currentX = startX;
//   headers.forEach((header, i) => {
//     const w = colWidths[i];
//     doc.strokeColor("#999999")
//        .rect(currentX, currentY, w, headerHeight)
//        .stroke();
//     doc.text(header, currentX + padding, currentY + padding, {
//       width:  w - 2*padding,
//       align:  "left"
//     });
//     currentX += w;
//   });
//   currentY += headerHeight;

//   // 2) Draw body rows
//   doc.font("Helvetica").fontSize(10).fillColor("black");
//   rows.forEach(row => {
//     // 2a) Measure the max height needed by any cell in this row
//     let maxHeight = minRowHeight;
//     headers.forEach((h, i) => {
//       const text = row[h] || "";
//       const textHeight = doc.heightOfString(text, {
//         width: colWidths[i] - 2*padding,
//         align: "left"
//       });
//       maxHeight = Math.max(maxHeight, textHeight + 2*padding);
//     });

//     // 2b) Page-break if it won't fit
//     if (currentY + maxHeight > doc.page.height - doc.page.margins.bottom) {
//       doc.addPage();
//       currentY = doc.page.margins.top;
//     }

//     // 2c) Draw each cell
//     currentX = startX;
//     headers.forEach((h, i) => {
//       const w = colWidths[i];
//       const text = row[h] || "";

//       // border
//       doc.strokeColor("#999999")
//          .rect(currentX, currentY, w, maxHeight)
//          .stroke();

//       // text (full; row is tall enough)
//       doc.text(text, currentX + padding, currentY + padding, {
//         width:  w - 2*padding,
//         align:  "left"
//       });

//       currentX += w;
//     });

//     // advance to next row
//     currentY += maxHeight;
//   });

//   return currentY;
// }

function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
  const headerHeight = 20;
  const minRowHeight = 20;
  const bleed = 2; // tiny cushion to avoid border clipping

  const pageBottom = () => doc.page.height - doc.page.margins.bottom;
  const pageTop    = () => doc.page.margins.top;

  let y = startY;

  const drawHeader = () => {
    let x = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(x, y, colWidths[i], headerHeight).fillAndStroke("#e0e0e0", "#bbb");
      doc.fillColor("#000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(headers[i], x + padding, y + 5, { width: colWidths[i] - 2 * padding, align: "left" });
      x += colWidths[i];
    }
    y += headerHeight;
    doc.font("Helvetica").fontSize(10).fillColor("black");
  };

  // Ensure header + at least one row fits; otherwise start on a new page
  if (y + headerHeight + minRowHeight > pageBottom()) {
    doc.addPage();
    y = pageTop();
  }
  drawHeader();

  rows.forEach((row) => {
    // measure row height
    let rowH = minRowHeight;
    headers.forEach((h, i) => {
      const text = row[h] || "";
      const hgt = doc.heightOfString(text, { width: colWidths[i] - 2 * padding, align: "left" });
      rowH = Math.max(rowH, hgt + 2 * padding);
    });
    rowH += bleed;

    // page break: new page + repeat header
    if (y + rowH > pageBottom()) {
      doc.addPage();
      y = pageTop();
      drawHeader();
    }

    // draw the row
    let x = startX;
    headers.forEach((h, i) => {
      const w = colWidths[i];
      const text = row[h] || "";
      doc.strokeColor("#999999").rect(x, y, w, rowH).stroke();
      doc.text(text, x + padding, y + padding, { width: w - 2 * padding, align: "left" });
      x += w;
    });

    y += rowH;
  });

  return y;
}


function drawHardcodedContent(doc, currentY) {
  // Possibly force a new page if not enough space
  if (currentY + 300 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    currentY = doc.page.margins.top;
  }

  const imagePath = path.join(__dirname, "road.jpg");
  if (fs.existsSync(imagePath)) {
    // Draw an image 300px tall
    doc.image(imagePath, { width: 300, height: 300 });
    // Move your "cursor" down
    currentY += 300; 
    // Also consider doc.moveDown() which moves the text cursor, 
    // but not necessarily your manual currentY variable.
    currentY += doc.currentLineHeight();
  }

  // Return it
  return currentY;
}


const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

function drawStructuredLeadDetails(doc, x, y, lead, userMap = {}) {
  const colWidths = [130, 130, 130, 122];
  const rowHeight = 20;
  const padding = 5;

  // Header Row
  const headers = ["Lead Origin:", "Assigned By","Assigned Date:", "Submitted Date:"];
  const values = [
    lead.parentLeadNo ? lead.parentLeadNo.join(", ") : "N/A",
    lead.assignedBy ? formatOfficer(lead.assignedBy, userMap) : "N/A",
    lead.assignedDate ? formatDate(lead.assignedDate) : "N/A",
    lead.submittedDate ? formatDate(lead.submittedDate) : "N/A",
  ];

  let currX = x;

  // Grey background cells
  for (let i = 0; i < headers.length; i++) {
    doc.rect(currX, y, colWidths[i], rowHeight).fillAndStroke("#e0e0e0", "#bbb");
    doc.fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(headers[i], currX + padding, y + 5);
    currX += colWidths[i];
  }

  y += rowHeight;
  currX = x;

  // Measure tallest cell to set dynamic row height
  doc.font("Helvetica").fontSize(10);
  const valRowH = Math.max(
    20,
    ...values.map((v, i) =>
      doc.heightOfString(v, { width: colWidths[i] - 2 * padding }) + 2 * padding
    )
  );

  // Values row
  for (let i = 0; i < values.length; i++) {
    doc.rect(currX, y, colWidths[i], valRowH).stroke();
    doc.font("Helvetica").fontSize(10).text(values[i], currX + padding, y + padding, {
      width: colWidths[i] - 2 * padding,
      lineBreak: true,
    });
    currX += colWidths[i];
  }

  // Second Row - Assigned Officers
  y += valRowH;

const tableWidth   = colWidths.reduce((a, b) => a + b, 0);
const labelWidth   = 130; // keep same visual as your header row
const valueWidth   = tableWidth - labelWidth;
const labelHeight  = 20;  // min box height

// Build the officers text from objects/strings
const officersText = formatOfficerList(lead.assignedTo, userMap);

// Measure the wrapped text height for the value cell
doc.font("Helvetica").fontSize(10); // slightly smaller to fit better
const paddingX     = 5;
const paddingY     = 5;
const textHeight   = doc.heightOfString(officersText, {
  width: valueWidth - 2 * paddingX,
  align: "left",
});
const rowH         = Math.max(labelHeight, textHeight + 2 * paddingY);

// If it won’t fit this page, break before drawing
if (y + rowH > doc.page.height - doc.page.margins.bottom) {
  doc.addPage();
  y = doc.page.margins.top;
}

// Draw label cell (gray)
doc.rect(x, y, labelWidth, rowH).fillAndStroke("#f5f5f5", "#ccc");
doc
  .font("Helvetica-Bold")
  .fontSize(11)
  .fillColor("#000")
  .text("Assigned Officers:", x + paddingX, y + paddingY, {
    width: labelWidth - 2 * paddingX,
    align: "left",
  });

// Draw value cell (bordered) with wrapped names
doc.strokeColor("#999999");
doc.rect(x + labelWidth, y, valueWidth, rowH).stroke();
doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor("#000")
  .text(officersText, x + labelWidth + paddingX, y + paddingY, {
    width: valueWidth - 2 * paddingX,
    align: "left",
  });

return y + rowH + 10;



   const subnumbers = lead.subNumber?.join(", ") || "N/A";
   doc.font("Helvetica").fontSize(12).text(subnumbers, x + 150 + padding, y + 5);
     // Second Row - Assigned Officers
     y += rowHeight;
     doc
       .rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
       .fillAndStroke("#f5f5f5", "#ccc");
     doc
       .font("Helvetica-Bold")
       .fontSize(11)
       .fillColor("#000")
       .text("Associated Subnumbers:", x + padding, y + 5);
   
     const Assosubnumbers = lead.associatedSubNumbers?.join(", ") || "N/A";
     doc.font("Helvetica").fontSize(12).text(Assosubnumbers, x + 150 + padding, y + 5);

  return y + rowHeight + 10;
}

// function drawTextBox(doc, x, y, width, title, content) {
//   const pad = 6, fs = 10, bleed = 2;      // <- small extra to avoid clipping
//   const bodyFont = "Helvetica", titleFont = "Helvetica-Bold";
//   const innerW = width - 2 * pad;

//   const topY    = doc.page.margins.top;
//   const bottomY = doc.page.height - doc.page.margins.bottom;

//   const text = ((content ?? "") + "").replace(/\s+/g, " ").trim();

//   // Pre-wrap to lines so we can page-split cleanly
//   doc.font(bodyFont).fontSize(fs);
//   const lineH = doc.currentLineHeight();
//   const words = text ? text.split(" ") : [];
//   const lines = [];
//   let line = "";
//   for (const w of words) {
//     const cand = line ? line + " " + w : w;
//     if (doc.widthOfString(cand) <= innerW) line = cand;
//     else { if (line) lines.push(line); line = w; }
//   }
//   if (line) lines.push(line);

//   // Title height (measured once)
//   const titleH = title
//     ? (doc.font(titleFont).fontSize(fs), doc.heightOfString(title, { width: innerW }))
//     : 0;
//   doc.font(bodyFont).fontSize(fs);

//   let i = 0, currY = y, first = true;

//   while (i < lines.length || (first && title && !lines.length)) {
//     const minBoxH = (first ? titleH : 0) + lineH + 2 * pad;
//     if (currY + minBoxH > bottomY) { doc.addPage(); currY = topY; }

//     const available = bottomY - currY - 2 * pad - (first ? titleH : 0);
//     const canLines  = Math.max(1, Math.floor(available / lineH));
//     const end       = Math.min(lines.length, i + canLines);

//     // --- draw text first ---
//     const boxTop = currY;
//     let textY = currY + pad;

//     if (first && title) {
//       doc.font(titleFont).fontSize(fs).text(title, x + pad, textY, { width: innerW });
//       textY = doc.y;                 // after title
//       doc.font(bodyFont).fontSize(fs);
//     }

//     const block = lines.slice(i, end).join("\n");
//     doc.text(block, x + pad, textY, { width: innerW, align: "justify" });

//     // measure exact used height and then stroke the box
//     const usedTextH = doc.y - textY;
//     const boxH = (first ? titleH : 0) + usedTextH + 2 * pad + bleed;

//     doc.save().lineWidth(1).strokeColor("#999999")
//        .rect(x, boxTop, width, boxH).stroke().restore();

//     currY = boxTop + boxH;
//     i = end;
//     first = false;
//   }

//   return currY + 6;
// }

function drawTextBox(doc, x, y, width, title, content) {
  const pad = 0, fs = 10; // border/bleed not needed now
  const bodyFont = "Helvetica", titleFont = "Helvetica-Bold";
  const innerW = width - 2 * pad;

  const topY    = doc.page.margins.top;
  const bottomY = doc.page.height - doc.page.margins.bottom;

  const text = ((content ?? "") + "").replace(/\s+/g, " ").trim();

  // Pre-wrap to lines so we can page-split cleanly
  doc.font(bodyFont).fontSize(fs);
  const lineH = doc.currentLineHeight();
  const words = text ? text.split(" ") : [];
  const lines = [];
  let line = "";
  for (const w of words) {
    const cand = line ? line + " " + w : w;
    if (doc.widthOfString(cand) <= innerW) line = cand;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);

  // Title height (measured once)
  const titleH = title
    ? (doc.font(titleFont).fontSize(fs), doc.heightOfString(title, { width: innerW }))
    : 0;
  doc.font(bodyFont).fontSize(fs);

  let i = 0, currY = y, first = true;

  while (i < lines.length || (first && title && !lines.length)) {
    // we still need a minimum space check so text doesn't clip at bottom
    const minNeededH = (first ? titleH : 0) + lineH + 2 * pad;
    if (currY + minNeededH > bottomY) { doc.addPage(); currY = topY; }

    const available = bottomY - currY - 2 * pad - (first ? titleH : 0);
    const canLines  = Math.max(1, Math.floor(available / lineH));
    const end       = Math.min(lines.length, i + canLines);

    // --- draw text only (no border) ---
    let textY = currY + pad;

    if (first && title) {
      doc.font(titleFont).fontSize(fs).text(title, x + pad, textY, { width: innerW });
      textY = doc.y; // after title
      doc.font(bodyFont).fontSize(fs);
    }

    const block = lines.slice(i, end).join("\n");
    doc.text(block, x + pad, textY, { width: innerW, align: "justify" });

    // advance currY based on how much text was actually written
    const usedTextH = doc.y - textY;
    const sectionH = (first ? titleH : 0) + usedTextH + 2 * pad;

    currY = currY + sectionH;
    i = end;
    first = false;
  }

  return currY + 6;
}


function drawHeader(doc, leadInstruction) {
  const pageW = doc.page.width;
  const padX = 16;
  const padY = 10;

  // Logo box
  const logoW = 70, logoH = 70;
  const logoX = padX;

  const logoPath = path.join(__dirname, "../assets/newpolicelogo.png");

  // Text box (everything to the right of the logo)
  const textX = logoX + logoW + 16;                // start AFTER logo
  const textW = pageW - textX - padX;              // right padding

  const caseLine = `Case: ${leadInstruction?.caseNo || 'N/A'} | ${leadInstruction?.caseName || 'N/A'}`;
  const leadLine = `Lead: ${leadInstruction?.leadNo || 'N/A'} | ${leadInstruction?.description || 'N/A'}`;

  // Measure to compute needed header height
  doc.font("Helvetica-Bold").fontSize(11);
  const caseH = doc.heightOfString(caseLine, { width: textW });
  doc.fontSize(10);
  const leadH = doc.heightOfString(leadLine, { width: textW });
  const textBlockH = caseH + 5 + leadH;

  const headerH = Math.max(logoH, textBlockH) + 2 * padY;

  // Background
  doc.rect(0, 0, pageW, headerH).fill("#003366");

  // Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, logoX, padY, { width: logoW, height: logoH });
  }

  // Titles (never overlap the logo because they live in [textX, textX + textW])
  let y = padY + (headerH - 2 * padY - textBlockH) / 2; // vertical centering within header
  doc.fillColor("white").font("Helvetica-Bold").fontSize(11)
     .text(caseLine, textX, y, { width: textW, align: "center" });
  y = doc.y + 5;
  doc.fontSize(10)
     .text(leadLine, textX, y, { width: textW, align: "center" });

  doc.fillColor("black");
  return headerH;
}





async function generateReport(req, res) {
  const {
    leadInstruction, leadReturn, leadPersons, leadVehicles,
    leadEnclosures, leadEvidence, leadPictures, leadAudio,
    leadVideos, leadScratchpad, leadTimeline, selectedReports
  } = req.body;

  console.log('📦  req.body =', JSON.stringify(req.body, null, 2));

  const includeAll = selectedReports && selectedReports.FullReport;
  //  const pdfUploads   = req.files.pdfFiles   || [];
  // const imageUploads = req.files.imageFiles || [];

  

  try {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    // doc.pipe(res);

    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));

    doc.on("end", async () => {
    try {
      let pdfBuffer = Buffer.concat(chunks);

      // find all on-disk PDFs in the enclosures
      // const pdfFiles = Array.isArray(leadEnclosures)
      //   ? leadEnclosures
      //       .filter(e => !e.isLink && e.filename.toLowerCase().endsWith(".pdf"))
      //       .map(e => path.normalize(e.filePath))
      //   : [];
      
         const enclosurePdfKeys = Array.isArray(leadEnclosures)
      ? leadEnclosures.filter(e =>
          e?.s3Key &&
          typeof e?.filename === "string" &&
          e.filename.toLowerCase().endsWith(".pdf")
        ).map(e => e.s3Key)
      : [];

        // collect evidence PDFs
       const evidencePdfKeys = Array.isArray(leadEvidence)
      ? leadEvidence.filter(e =>
          e?.s3Key &&
          typeof e?.filename === "string" &&
          e.filename.toLowerCase().endsWith(".pdf")
        ).map(e => e.s3Key)
      : [];

        // collect picture PDFs
       const picturePdfKeys = Array.isArray(leadPictures)
      ? leadPictures.filter(e =>
          e?.s3Key &&
          typeof e?.filename === "string" &&
          e.filename.toLowerCase().endsWith(".pdf")
        ).map(e => e.s3Key)
      : [];

       for (const key of [...enclosurePdfKeys, ...evidencePdfKeys]) {
      try {
        const rawBuf    = await getObjectBuffer(key);
        const scaledBuf = await scalePdfPagesToFit(rawBuf, { isPicture: false });
        pdfBuffer = await mergeWithAnotherPDF(pdfBuffer, scaledBuf);
      } catch (e) {
        console.warn("Skipping merge for key:", key, e.message);
      }
    }

       for (const key of picturePdfKeys) {
      try {
        const rawBuf    = await getObjectBuffer(key);
        const scaledBuf = await scalePdfPagesToFit(rawBuf, { isPicture: true });
        pdfBuffer = await mergeWithAnotherPDF(pdfBuffer, scaledBuf);
      } catch (e) {
        console.warn("Skipping merge for key:", key, e.message);
      }
    }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=report.pdf");
      res.send(pdfBuffer);

    } catch (err) {
      console.error("Merge error:", err);
      res.status(500).json({ error: "Failed to merge external PDFs" });
    }
  });

//     const chunks = [];
//   doc.on("data", (chunk) => chunks.push(chunk));
//   doc.on("end", async () => {
//   const pdfKitBuffer = Buffer.concat(chunks);

//   try {
//     const mergedBuffer = await mergeWithAnotherPDF(pdfKitBuffer, "report_Officer 916_20250321T144351339Z.pdf");
   
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "inline; filename=merged.pdf");
//     res.send(mergedBuffer);
//   } catch (err) {
//     console.error("Merge error:", err);
//     res.status(500).json({ error: "Failed to merge PDF" });
//   }
// });

    // Build userMap for officer name formatting
    const allUsernames = [
      ...new Set([
        ...(leadInstruction?.assignedTo || [])
          .map(a => (typeof a === "string" ? a : a?.username))
          .filter(Boolean),
        ...(leadInstruction?.assignedBy ? [leadInstruction.assignedBy] : []),
        ...(Array.isArray(leadReturn) ? leadReturn.map(e => e?.enteredBy).filter(Boolean) : []),
      ]),
    ];
    const usersFound = await User.find({ username: { $in: allUsernames } })
      .select("username firstName lastName title")
      .lean();
    const userMap = Object.fromEntries(usersFound.map(u => [u.username, u]));

    const headerHeight = drawHeader(doc, leadInstruction);

// start content after header
let currentY = headerHeight + 20;

    // currentY = startSection(doc, "Lead Details:", currentY);

    // currentY = drawLeadWorksheetTwoColTable(doc, 50, currentY, leadInstruction);
    // currentY = drawTable(doc, 50, currentY, ["Lead No.", "Origin", "Assigned Date", "Due Date", "Completed Date"], [{ "Lead No.": leadInstructions?.leadNo || 'N/A', "Origin": leadInstructions?.parentLeadNo || 'N/A', "Assigned Date": formatDate(leadInstructions?.assignedDate) || 'N/A', "Due Date": formatDate(leadInstructions?.dueDate) || 'N/A', "Completed Date": "Still to add in db" }], [90, 90, 120, 120, 92]) + 20;
    // currentY = drawTable(doc, 50, currentY, ["Sub No.", "Associated Sub Nos.", "Assigned Officers", "Assigned By"], [{ "Sub No.": leadInstructions?.subNumber || 'N/A', "Associated Sub Nos.": leadInstructions?.associatedSubNumbers || 'N/A', "Assigned Officers": leadInstructions?.assignedTo|| 'N/A', "Assigned By": leadInstructions?.assignedBy || 'N/A' }], [90, 170, 170, 82]) + 20;

    currentY = drawStructuredLeadDetails(doc, 50, currentY, leadInstruction, userMap);

    if (includeAll || leadInstruction) {
      // if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
      //   doc.addPage();
      //   currentY = doc.page.margins.top;
      // }
      currentY = startSection(doc, "Lead Log Summary", currentY);
      currentY = drawTextBox(doc, 50, currentY, 512, "", leadInstruction?.description || 'N/A');

      currentY = startSection(doc, "Lead Instruction", currentY);
      currentY = drawTextBox(doc, 50, currentY, 512, "", leadInstruction?.summary || 'N/A');

    }

    if (includeAll || leadReturn) {
      // if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
      //   doc.addPage();
      //   currentY = doc.page.margins.top;
      // }
      // doc.font("Helvetica-Bold").fontSize(12).text("Lead Return ID: 1", 50, currentY);
      // currentY += 20;
      // currentY = drawTextBox(doc, 50, currentY, 512, "", "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.");
      currentY = startSection(doc, "Lead Results", currentY);

  if (leadReturn?.length > 0) {
    leadReturn.forEach((entry, idx) => {
      // Ensure narrative header + table fit on same page
      if (currentY + 80 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      // doc.font("Helvetica-Bold").fontSize(11).text(`Narrative ID: ${entry.leadReturnId}`, 50, currentY);
      // currentY += 18;

      const dateEntered = formatDate(entry.enteredDate);
      const enteredBy = entry.enteredBy || "N/A";
      const leadText = entry.leadReturnResult || "N/A";

      // currentY = drawTable(
      //   doc,
      //   50,
      //   currentY,
      //   ["Date Entered", "Entered By"],
      //   [{ "Date Entered": dateEntered, "Entered By": enteredBy }],
      //   [180, 332]
      // ) + 6;
      
      // doc.font("Helvetica-Bold").fontSize(11)
      // .text(
      //   `Narrative ID: ${entry.leadReturnId} | Officer: ${enteredBy} | Date: ${dateEntered}`,
      //   50,
      //   currentY,
      //   { width: 512 }
      // );
      currentY = drawMetaBar(doc, 50, currentY, 512, entry, userMap);

      currentY = drawTextBox(doc, 50, currentY, 512,"", leadText);

      // if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
      //   doc.addPage();
      //   currentY = doc.page.margins.top;
      // }
    });
  } else {
    doc.font("Helvetica").fontSize(11).text("No lead return data available.", 50, currentY);
    currentY += 20;
  }
    }

    // if (includeAll || leadPersons) {
    //   if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
    //     doc.addPage();
    //     currentY = doc.page.margins.top;
    //   }
    //   doc.font("Helvetica-Bold").fontSize(12).text("Person Details", 50, currentY);
    //   currentY += 20;

    //   const personTables = [
    //     ["Date Entered", "Name", "Phone #", "Address"],
    //     ["Last Name", "First Name", "Middle Initial", "Cell Number"],
    //     ["Business Name", "Street 1", "Street 2", "Building"],
    //     ["Apartment", "City", "State", "Zip Code"],
    //     ["SSN", "Age", "Email", "Occupation"],
    //     ["Person Type", "Condition", "Caution Type", "Sex"],
    //     ["Race", "Ethnicity", "Skin Tone", "Eye Color"],
    //     ["Glasses", "Hair Color", "Height", "Weight"]
    //   ];
    //   const personWidths = {
    //             "Date Entered": 90,
    //             "Name": 100,
    //             "Phone #": 100,
    //             "Address": 222,
              
    //             "Last Name": 90,
    //             "First Name": 100,
    //             "Middle Initial": 100,
    //             "Cell Number": 222,
              
    //             "Business Name": 90,
    //             "Street 1": 100,
    //             "Street 2": 100,
    //             "Building": 222,
              
    //             "Apartment": 90,
    //             "City": 100,
    //             "State": 100,
    //             "Zip Code": 222,
              
    //             "SSN": 90,
    //             "Age": 100,
    //             "Email": 100,
    //             "Occupation": 222,
              
    //             "Person Type": 90,
    //             "Condition": 100,
    //             "Caution Type": 100,
    //             "Sex": 222,
              
    //             "Race": 90,
    //             "Ethnicity": 100,
    //             "Skin Tone": 100,
    //             "Eye Color": 222,
              
    //             "Glasses": 90,
    //             "Hair Color": 100,
    //             "Height": 100,
    //             "Weight": 222,
    //           };
              

    //   const personData = [
    //     ["03/14/24", "Dan, Hill", "1234567890", "120 3rd St, New York, NY"],
    //     ["Hill", "Dan", "S.", "1234567890"],
    //     ["", "", "", ""],
    //     ["", "", "", ""],
    //     ["", "20", "", ""],
    //     ["", "", "", ""],
    //     ["", "", "", ""],
    //     ["", "", "", ""]
    //   ];

    //   personTables.forEach((headers, i) => {
    //     if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
    //       doc.addPage();
    //       currentY = doc.page.margins.top;
    //     }
    //     const row = {};
    //     const colWidths = headers.map(header => personWidths[header] || 100);
    //     headers.forEach((h, j) => row[h] = personData[i][j]);
    //     currentY = drawTable(doc, 50, currentY, headers, [row], colWidths) + 20;
    //   });
    // }

    if (includeAll || leadPersons) {
      if (!Array.isArray(leadPersons) || leadPersons.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No person data available.", 50, currentY);
        // currentY += 20;
      } else {
        // Section header
        // doc.font("Helvetica-Bold").fontSize(12)
        //    .text("Person Details", 50, currentY);
        // currentY += 20;
        currentY = startSection(doc, "Person Details", currentY);
    
        // How we’ll group fields into small tables
        const personTables = [
          ["Last Name", "First Name", "Middle Initial", "Suffix", "Alias"],
          ["Sex", "Date of Birth", "Address", "Phone No", "Email"],
          ["Race", "Ethnicity", "Person Type", "Condition", "Caution Type"],
          ["Skin Tone", "Eye Color", "Glasses", "Hair Color", "Height"],
          ["Weight", "Scars", "Marks", "Tattoo"],
          ["SSN", "Driver License ID", "Occupation", "Business Name"],
          ["Street 1", "Street 2", "Building"],
          ["Apartment", "City", "State", "Zip Code"],
        ];


        // Helper to pull the right field off your model
        function getPersonValue(person, header) {
          switch (header) {
            case "Last Name":      return person.lastName || "";
            case "First Name":     return person.firstName || "";
            case "Middle Initial": return person.middleInitial || "";
            case "Suffix":         return person.suffix || "";
            case "Alias":          return person.alias || "";
            case "Date of Birth":  return formatDate(person.dateOfBirth);
            case "Sex":            return person.sex || "";
            case "Address":        return [
              person.address?.building,
              person.address?.apartment && `Apt ${person.address.apartment}`,
              person.address?.street1,
              person.address?.street2,
              person.address?.city,
              person.address?.state,
              person.address?.zipCode
            ].filter(Boolean).join(", ");
            case "Phone No":       return person.cellNumber || "";
            case "Date Entered":   return formatDate(person.enteredDate);
            case "Cell Number":    return person.cellNumber || "";
            case "Business Name":  return person.businessName || "";
            case "SSN":                return person.ssn || "";
            case "Driver License ID":  return person.driverLicenseId || "";
            case "Email":          return person.email || "";
            case "Occupation":     return person.occupation || "";
            case "Person Type":    return person.personType || "";
            case "Condition":      return person.condition || "";
            case "Caution Type":   return person.cautionType || "";
            case "Race":           return person.race || "";
            case "Ethnicity":      return person.ethnicity || "";
            case "Skin Tone":      return person.skinTone || "";
            case "Eye Color":      return person.eyeColor || "";
            case "Glasses":        return person.glasses || "";
            case "Hair Color":     return person.hairColor || "";
            case "Height":         return person.height && (person.height.feet != null || person.height.inches != null) ? `${person.height.feet ?? 0}ft ${person.height.inches ?? 0}in` : (person.height || "");
            case "Weight":         return person.weight != null && person.weight !== "" ? `${person.weight} lbs` : "";
            case "Scars":          return person.scar || "";
            case "Marks":          return person.mark || "";
            case "Tattoo":         return person.tattoo || "";
            case "Scars, Marks, Tattoos": return [person.scar, person.tattoo, person.mark]
              .filter(Boolean).join("; ");
            case "Street 1":       return person.address?.street1 || "";
            case "Street 2":       return person.address?.street2 || "";
            case "Building":       return person.address?.building || "";
            case "Apartment":      return person.address?.apartment || "";
            case "City":           return person.address?.city || "";
            case "State":          return person.address?.state || "";
            case "Zip Code":       return person.address?.zipCode || "";
            default:               return "";
          }
        }
    
        // Loop through each person object
        for (let pIdx = 0; pIdx < leadPersons.length; pIdx++) {
          const person = leadPersons[pIdx];
              // Ensure person label + first table fit on same page
          // if (currentY + 60 > doc.page.height - doc.page.margins.bottom) {
          //   doc.addPage();
          //   currentY = doc.page.margins.top;
          // }

          // Add PERSON PHOTO ON ITS OWN PAGE
          // await addPersonPhotoPage(doc, person, pIdx);

          // Then continue the normal tables on the next page/flow:
          if (currentY + 60 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            currentY = doc.page.margins.top;
          }

          const personLabel = [`Person ${pIdx + 1}`, [person.firstName, person.lastName].filter(Boolean).join(" ")].filter(Boolean).join(" – ");
          doc.font("Helvetica-Bold").fontSize(11).text(personLabel, 50, currentY);
          currentY += 20;

          // Person photo + label side by side

          // const photoSize = 60;
          // let photoDrawn = false;
          // if (person.photoS3Key) {
          //   try {
          //     const rawBuf = await getObjectBuffer(person.photoS3Key);
          //     const imgBuf = await toPdfSafeBuffer(rawBuf);
          //     // page-break check for photo + label
          //     if (currentY + photoSize + 10 > doc.page.height - doc.page.margins.bottom) {
          //       doc.addPage();
          //       currentY = doc.page.margins.top;
          //     }
          //     doc.image(imgBuf, 50, currentY, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
          //     doc.font("Helvetica-Bold").fontSize(11)
          //        .text(`Person ${pIdx + 1}`, 50 + photoSize + 10, currentY + 20);
          //     currentY += photoSize + 8;
          //     photoDrawn = true;
          //   } catch (e) {
          //     console.warn(`Failed to embed photo for person ${pIdx + 1}:`, e?.message);
          //   }
          // }
          // if (!photoDrawn) {
          //   doc.font("Helvetica-Bold").fontSize(11)
          //      .text(`Person ${pIdx + 1}`, 50, currentY);
          //   currentY += 20;
          // }

          // Collect all fields across all personTables, keep only filled ones
          const allPersonFields = personTables.flat();
          const addressIsFilled = getPersonValue(person, "Address") !== "";
          const addressSubFields = new Set(["Street 1", "Street 2", "Building", "Apartment", "City", "State", "Zip Code"]);
          const filledFields = allPersonFields.filter(h => {
            if (addressIsFilled && addressSubFields.has(h)) return false;
            const val = getPersonValue(person, h);
            return val !== "" && val !== null && val !== undefined;
          });

          // Build combined entry list: standard filled fields + valid additionalData entries
          const allEntries = filledFields.map(h => ({ header: h, value: getPersonValue(person, h) }));
          if (Array.isArray(person.additionalData)) {
            person.additionalData.forEach(d => {
              const cat = d.category || d.description || "";
              const val = d.value || d.details || "";
              if (cat && val) allEntries.push({ header: cat, value: val });
            });
          }

          // Render in rows of 4 (128px each = 512px total)
          const COLS_PER_ROW = 4;
          const COL_WIDTH = 128;
          for (let i = 0; i < allEntries.length; i += COLS_PER_ROW) {
            const chunk = allEntries.slice(i, i + COLS_PER_ROW);
            const remainingCols = COLS_PER_ROW - chunk.length;

            const headers = chunk.map(e => e.header);
            const row = {};
            chunk.forEach(e => { row[e.header] = e.value; });
            const colWidths = chunk.map(() => COL_WIDTH);

            if (remainingCols > 0) {
              headers.push("");
              row[""] = "";
              colWidths.push(remainingCols * COL_WIDTH);
            }

            if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              currentY = doc.page.margins.top;
            }
            currentY = drawTable(doc, 50, currentY, headers, [row], colWidths);
          }
          currentY += 20;
        }
      }
    }
    

    // if (includeAll || leadVehicles) {
    //   if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
    //     doc.addPage();
    //     currentY = doc.page.margins.top;
    //   }
    //   doc.font("Helvetica-Bold").fontSize(12).text("Vehicle Details", 50, currentY);
    //   currentY += 20;
    //   currentY = drawTable(doc, 50, currentY, ["Date Entered", "Year", "Make", "Model", "Plate", "Category", "VIN"], [{ "Date Entered": "03/14/24","Year": "2019", "Make": "Toyota", "Model": "Corolla", "Plate": "XYZ1234", "Category": "Bike", "VIN": "" }], [90, 70, 70, 70, 70, 70, 72]) + 20;
    //   currentY = drawTable(doc, 50, currentY, ["Type", "State", "Primary Color", "Secondary Color","Additional Information"], [{ "Type": "", "State": "NY", "Primary Color": "Blue", "Secondary Color": "Yellow", "Additional Information": "" }], [90, 90, 80, 120, 132]) + 20;

    //   // currentY = drawHardcodedContent(doc, currentY);
    // }

 if (includeAll || leadVehicles) {
  // Page-break check
  //  currentY = startSection(doc, "Vehicle Details", currentY);

  if (!Array.isArray(leadVehicles) || leadVehicles.length === 0) {
    // doc.font("Helvetica").fontSize(11)
    //    .text("No vehicle data available.", 50, currentY);
    // currentY += 20;

  } else {

      currentY = startSection(doc, "Vehicle Details", currentY);
    // Define how to chunk vehicle fields into small tables
    const vehicleTables = [
      ["Date Entered", "Year", "Make", "Model"],
      ["Plate", "Category", "VIN", "Color"],
      ["State", "Owner", "Additional Info"]
    ];
    // Column widths for each header
    const vehicleWidths = {
      "Date Entered":   90,
      "Year":           100,
      "Make":           100,
      "Model":          222,
      "Plate":          90,
      "Category":       100,
      "VIN":            100,
      "Color":          222,
      "State":          90,
      "Owner":          100,
      "Additional Info": 322
    };

    // Helper to pull the right vehicle field
    function getVehicleValue(v, header) {
      switch (header) {
        case "Date Entered":   return formatDate(v.enteredDate);
        case "Year":           return v.year?.toString() || "";
        case "Make":           return v.make || "";
        case "Model":          return v.model || "";
        case "Plate":          return v.plate || "";
        case "Category":       return v.category || "";
        case "VIN":            return v.vin || "";
        case "Color":          return v.color || "";
        case "State":          return v.state || "";
        case "Owner":          return v.owner || "";
        case "Additional Info":return v.additionalInfo || "";
        default:               return "";
      }
    }

    // Draw each vehicle
    leadVehicles.forEach((veh, idx) => {
      // Ensure vehicle label + first table fit on same page
      if (currentY + 60 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(11)
         .text(`Vehicle ${idx + 1}`, 50, currentY);
      currentY += 20;

      // For each chunk of headers, draw a mini-table
      vehicleTables.forEach(headers => {
        // Page-break if needed
        if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }

        // Build one row of data
        const row = {};
        headers.forEach(h => {
          row[h] = getVehicleValue(veh, h);
        });

        // Compute column widths
        const colWidths = headers.map(h => vehicleWidths[h] || 100);

        // Draw the table
        currentY = drawTable(doc, 50, currentY, headers, [row], colWidths);
      });
      
          currentY = currentY +5;
    });
  }
}


     if (includeAll || leadEnclosures) {
      // currentY = startSection(doc, "Enclosure Details", currentY);

      if (!Array.isArray(leadEnclosures) || leadEnclosures.length === 0) {
        // doc
        //   .font("Helvetica")
        //   .fontSize(11)
        //   .text("No enclosure data available.", 50, currentY);
        // currentY += 20;
      } else {
        // Draw the “table of summary rows” for each enclosure first:
        currentY = startSection(doc, "Enclosure Details", currentY);

        const headers = ["Date Entered", "Type", "Description"];
        const widths = [90, 100, 322];
        const rows = leadEnclosures.map((e) => ({
          "Date Entered": formatDate(e.enteredDate),
          "Type": e.type || "",
          "Description": e.enclosureDescription || "",
        }));

        const minRowHeight = 20;
        const padding      = 5;
        const headerH      = 20;
        const estimatedH   = headerH 
                          + rows.reduce((sum, row) => {
                              // rough row-height: either measured or minRowHeight+2*padding
                              return sum + (minRowHeight + 2*padding);
                            }, 0);

        // 3) page-break if it doesn't fit
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;

        // Now loop through each enclosure and embed any image files from S3
for (const enc of leadEnclosures) {
  const fnameLower = (enc.filename || "").toLowerCase();
  const isImage = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/.test(fnameLower);
  if (!isImage) continue;

  if (!enc.s3Key) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
       .text(`(No S3 key for: ${enc.filename})`, 50, currentY);
    doc.fillColor("black");
    currentY += 20;
    continue;
  }

  try {
    const rawEncBuf = await getObjectBuffer(enc.s3Key);
    const imgBuf = await toPdfSafeBuffer(rawEncBuf);

    const availW = doc.page.width - 100; // 612 - 2×50 margin
    let renderedH = 300;
    try {
      const meta = await sharp(imgBuf).metadata();
      const srcW = meta.width || 300;
      const srcH = meta.height || 300;
      const scale = Math.min(availW / srcW, 300 / srcH, 1);
      renderedH = Math.round(srcH * scale);
    } catch (_) { /* use default */ }

    if (currentY + renderedH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    doc.image(imgBuf, 50, currentY, { fit: [availW, 300], align: "center", valign: "top" });
    currentY += renderedH + 10;

    doc.font("Helvetica").fontSize(9).fillColor("#555")
       .text(enc.filename, 50, currentY, { width: availW, align: "center" });
    currentY += 20;
    doc.fillColor("black");
  } catch (e) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
       .text(`(S3 fetch failed: ${enc.filename})`, 50, currentY);
    doc.fillColor("black");
    currentY += 20;
  }
}

      }
    }

    // ── Evidence Details ─────────────────────────────────────────
    if (includeAll || leadEvidence) {
      // currentY = startSection(doc, "Evidence Details", currentY);
    
      if (!Array.isArray(leadEvidence) || leadEvidence.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No evidence data available.", 50, currentY);
        // currentY += 20;
      } else {
           currentY = startSection(doc, "Evidence Details", currentY);

        const headers = ["Date Entered","Type","Collection Date","Disposed Date","Description"];
        const widths  = [80,80,90,90,172];
        const rows    = leadEvidence.map(ev => ({
          "Date Entered":     formatDate(ev.enteredDate),
          "Type":             ev.type || "",
          "Collection Date":  formatDate(ev.collectionDate),
          "Disposed Date":    formatDate(ev.disposedDate),
          "Description":      ev.evidenceDescription || ""
        }));

        // 2) estimate table height
        const minRowHeight = 20, padding = 5, headerH = 20;
        const estimatedH = headerH + rows.length * (minRowHeight + 2*padding);

        // 3) page‐break if needed
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;

        // Embed evidence images from S3
for (const enc of leadEvidence) {
  const fnameLower = (enc.filename || "").toLowerCase();
  const isImage = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/.test(fnameLower);
  if (!isImage) continue;

  if (!enc.s3Key) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
       .text(`(No S3 key for: ${enc.filename})`, 50, currentY);
    doc.fillColor("black");
    currentY += 20;
    continue;
  }

  try {
    const rawEncBuf = await getObjectBuffer(enc.s3Key);
    const imgBuf = await toPdfSafeBuffer(rawEncBuf);

    const availW = doc.page.width - 100; // 612 - 2×50 margin
    let renderedH = 300;
    try {
      const meta = await sharp(imgBuf).metadata();
      const srcW = meta.width || 300;
      const srcH = meta.height || 300;
      const scale = Math.min(availW / srcW, 300 / srcH, 1);
      renderedH = Math.round(srcH * scale);
    } catch (_) { /* use default */ }

    if (currentY + renderedH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    doc.image(imgBuf, 50, currentY, { fit: [availW, 300], align: "center", valign: "top" });
    currentY += renderedH + 10;

    doc.font("Helvetica").fontSize(9).fillColor("#555")
       .text(enc.filename, 50, currentY, { width: availW, align: "center" });
    currentY += 20;
    doc.fillColor("black");
  } catch (e) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
       .text(`(S3 fetch failed: ${enc.filename})`, 50, currentY);
    doc.fillColor("black");
    currentY += 20;
  }
}


      }
    }
    // ── Picture Details ─────────────────────────────────────────
    if (includeAll || leadPictures) {
      // currentY = startSection(doc, "Picture Details", currentY);
    
      if (!Array.isArray(leadPictures) || leadPictures.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No picture data available.", 50, currentY);
        // currentY += 20;
      } else {

        currentY = startSection(doc, "Picture Details", currentY);
        const headers = ["Date Entered","Date Picture Taken","Description"];
        const widths  = [90,127, 295];
        const rows    = leadPictures.map(p => ({
          "Date Entered":        formatDate(p.enteredDate),
          "Date Picture Taken":  formatDate(p.datePictureTaken),
          "Description":         p.pictureDescription || ""
        }));
        // 2) estimate table height
        const minRowHeight = 20, padding = 5, headerH = 20;
        const estimatedH = headerH + rows.length * (minRowHeight + 2*padding);

        // 3) page‐break if needed
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;

        // Embed picture images from S3
for (const enc of leadPictures) {
  const fnameLower = (enc.filename || "").toLowerCase();
  const isImage = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/.test(fnameLower);
  if (!isImage) continue;

  if (!enc.s3Key) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
       .text(`(No S3 key for: ${enc.filename})`, 50, currentY);
    doc.fillColor("black");
    currentY += 20;
    continue;
  }

  try {
    const rawEncBuf = await getObjectBuffer(enc.s3Key);
    const imgBuf = await toPdfSafeBuffer(rawEncBuf);

    const availW = doc.page.width - 100; // 612 - 2×50 margin
    let renderedH = 300;
    try {
      const meta = await sharp(imgBuf).metadata();
      const srcW = meta.width || 300;
      const srcH = meta.height || 300;
      const scale = Math.min(availW / srcW, 300 / srcH, 1);
      renderedH = Math.round(srcH * scale);
    } catch (_) { /* use default */ }

    if (currentY + renderedH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    doc.image(imgBuf, 50, currentY, { fit: [availW, 300], align: "center", valign: "top" });
    currentY += renderedH + 10;

    doc.font("Helvetica").fontSize(9).fillColor("#555")
       .text(enc.filename, 50, currentY, { width: availW, align: "center" });
    currentY += 20;
    doc.fillColor("black");
  } catch (e) {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
       .text(`(S3 fetch failed: ${enc.filename})`, 50, currentY);
    doc.fillColor("black");
    currentY += 20;
  }
}


      }
    }

    // ── Audio Details ────────────────────────────────────────────
    if (includeAll || leadAudio) {
      // currentY = startSection(doc, "Audio Details", currentY);
    
      if (!Array.isArray(leadAudio) || leadAudio.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No audio data available.", 50, currentY);
        // currentY += 20;
      } else {
        currentY = startSection(doc, "Audio Details", currentY);
        const headers = ["Date Entered","Date Audio Recorded","Description"];
        const widths  = [90,127, 295];
        const rows    = leadAudio.map(a => ({
          "Date Entered":         formatDate(a.enteredDate),
          "Date Audio Recorded":  formatDate(a.dateAudioRecorded),
          "Description":          a.audioDescription || ""
        }));
        // 2) estimate table height
        const minRowHeight = 20, padding = 5, headerH = 20;
        const estimatedH = headerH + rows.length * (minRowHeight + 2*padding);

        // 3) page‐break if needed
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;
      }
    }

    // ── Video Details ────────────────────────────────────────────
    if (includeAll || leadVideos) {
      // currentY = startSection(doc, "Video Details", currentY);
    
      if (!Array.isArray(leadVideos) || leadVideos.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No video data available.", 50, currentY);
        // currentY += 20;
      } else {

        currentY = startSection(doc, "Video Details", currentY);
        const headers = ["Date Entered","Date Video Recorded","Description"];
        const widths  = [90,127, 295];
        const rows    = leadVideos.map(v => ({
          "Date Entered":         formatDate(v.enteredDate),
          "Date Video Recorded":  formatDate(v.dateVideoRecorded),
          "Description":          v.videoDescription || ""
        }));
        // 2) estimate table height
        const minRowHeight = 20, padding = 5, headerH = 20;
        const estimatedH = headerH + rows.length * (minRowHeight + 2*padding);

        // 3) page‐break if needed
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;
      }
    }

    // ── Lead Notes (Scratchpad) ─────────────────────────────────
    if (includeAll || leadScratchpad) {
      // currentY = startSection(doc, "Lead Notes", currentY);
    
      if (!Array.isArray(leadScratchpad) || leadScratchpad.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No notes available.", 50, currentY);
        // currentY += 20;
      } else {

         currentY = startSection(doc, "Lead Notes", currentY);
        const headers = ["Date Entered","Return Id","Description"];
        const widths  = [90,120, 302];
        const rows    = leadScratchpad.map(n => ({
          "Date Entered": formatDate(n.enteredDate),
          "Return Id": n.leadReturnId  || "",
          "Description":  n.text || ""
        }));
        // 2) estimate table height
        const minRowHeight = 20, padding = 5, headerH = 20;
        const estimatedH = headerH + rows.length * (minRowHeight + 2*padding);

        // 3) page‐break if needed
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;
      }
    }

    // ── Timeline Details ─────────────────────────────────────────
    if (includeAll || leadTimeline) {
      // currentY = startSection(doc, "Timeline Details", currentY);
    
      if (!Array.isArray(leadTimeline) || leadTimeline.length === 0) {
        // doc.font("Helvetica").fontSize(11)
        //    .text("No timeline data available.", 50, currentY);
        // currentY += 20;
      } else {
        currentY = startSection(doc, "Timeline Details", currentY);
        const headers = ["Event Date","Time Range","Location","Flags","Description"];
        const widths  = [80,100,100, 80, 152];
        const rows    = leadTimeline.map(t => ({
          "Event Date":   formatDate(t.eventDate),
         "Time Range":  `${formatTime(t.eventStartTime)} – ${formatTime(t.eventEndTime)}`,

          "Location":     t.eventLocation || "",
          "Flags":        Array.isArray(t.timelineFlag) ? t.timelineFlag.join(", ") : "",
          "Description":  t.eventDescription || ""
        }));
        // 2) estimate table height
        const minRowHeight = 20, padding = 5, headerH = 20;
        const estimatedH = headerH + rows.length * (minRowHeight + 2*padding);

        // 3) page‐break if needed
        if (currentY + estimatedH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 10;
      }
    }
    await appendPersonPhotoPagesAtEnd(doc, leadPersons);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

module.exports = { generateReport };

