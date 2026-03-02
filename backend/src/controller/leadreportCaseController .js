const PDFDocument = require("pdfkit");
const { PDFDocument: PDFLibDocument } = require("pdf-lib");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const heicConvert = require("heic-convert");
const { getObjectBuffer } = require("../s3");
const { fetchCaseLeadsData } = require("../utils/caseDataFetcher");
const Case = require("../models/case");

async function mergeWithAnotherPDF(mainBuffer, otherPdfBuffer) {
  const mainDoc  = await PDFLibDocument.load(mainBuffer);
  const otherDoc = await PDFLibDocument.load(otherPdfBuffer);
  const copied   = await mainDoc.copyPages(otherDoc, otherDoc.getPageIndices());
  copied.forEach(p => mainDoc.addPage(p));
  return Buffer.from(await mainDoc.save());
}

// Convert image buffer to a format PDFKit understands (PNG or JPEG).
// Handles HEIC (iPhone), WebP, and other formats; passes PNG/JPEG as-is.
async function toPdfSafeBuffer(buf) {
  if (!buf || buf.length < 12) return buf;
  // JPEG — pass through
  if (buf[0] === 0xFF && buf[1] === 0xD8) return buf;
  // PNG — pass through
  if (buf[0] === 0x89 && buf.slice(1, 4).toString() === "PNG") return buf;
  // HEIC/HEIF — use heic-convert (sharp lacks HEIC support on Windows)
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (["heic", "heix", "hevc", "mif1"].includes(brand)) {
      const jpegBuf = await heicConvert({ buffer: buf, format: "JPEG", quality: 0.8 });
      return Buffer.from(jpegBuf);
    }
  }
  // WebP and other formats — use sharp to convert to PNG
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
    return sharp(buf).png().toBuffer();
  }
  // Unknown format — try sharp as a last resort
  try {
    return await sharp(buf).png().toBuffer();
  } catch {
    return buf; // give PDFKit the raw buffer; it will throw if unsupported
  }
}

// Small section header that respects page breaks
function startSection(doc, title, currentY) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  const titleH = 20;
  if (currentY + titleH > bottom) {
    doc.addPage();
    currentY = doc.page.margins.top;
  }
  doc.font("Helvetica-Bold").fontSize(12).text(title, 50, currentY);
  return doc.y + 10; // consistent spacing
}

const LR_ALIASES = {
  persons:    ["persons", "leadPersons", "people", "lrPersons"],
  vehicles:   ["vehicles", "leadVehicles", "cars", "lrVehicles"],
  enclosures: ["enclosures", "leadEnclosures", "attachments"],
  evidence:   ["evidence", "leadEvidence", "items"],
  pictures:   ["pictures", "leadPictures", "images", "photos"],
  audio:      ["audio", "leadAudio", "audios", "recordings"],
  videos:     ["videos", "leadVideos", "clips", "mediaVideos"],
  scratchpad: ["scratchpad", "leadScratchpad", "notes"],
  timeline:   ["timeline", "timelineEntries", "events", "leadTimeline"],
};

function pickFirstArray(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function normalizeLeadReturn(lr) {
  return {
    ...lr,
    persons:    pickFirstArray(lr, LR_ALIASES.persons),
    vehicles:   pickFirstArray(lr, LR_ALIASES.vehicles),
    enclosures: pickFirstArray(lr, LR_ALIASES.enclosures),
    evidence:   pickFirstArray(lr, LR_ALIASES.evidence),
    pictures:   pickFirstArray(lr, LR_ALIASES.pictures),
    audio:      pickFirstArray(lr, LR_ALIASES.audio),
    videos:     pickFirstArray(lr, LR_ALIASES.videos),
    scratchpad: pickFirstArray(lr, LR_ALIASES.scratchpad),
    timeline:   pickFirstArray(lr, LR_ALIASES.timeline),
  };
}

// --- Watermark helpers ---
function drawWatermark(doc, opts = {}) {
  const {
    text = "CONFIDENTIAL",
    opacity = 0.08,
    angle = -45,
    font = "Helvetica-Bold",
    fontSize = 120,
    color = "#000000",
    dx = 0, // fine-tune horizontal offset if needed
    dy = 0  // fine-tune vertical offset if needed
  } = opts;

  const cx = doc.page.width / 2 + dx;
  const cy = doc.page.height / 2 + dy;

  doc.save();
  doc.fillColor(color).opacity(opacity).font(font).fontSize(fontSize);

  // rotate around the center, then draw centered text
  doc.rotate(angle, { origin: [cx, cy] });
  const w = doc.widthOfString(text);
  const h = doc.currentLineHeight();
  doc.text(text, cx - w / 2, cy - h / 2, { lineBreak: false });

  // restore drawing state
  doc.rotate(-angle, { origin: [cx, cy] });
  doc.opacity(1).restore();
}

// optional: image watermark (PNG/JPG path or Buffer)
function drawImageWatermark(doc, img, opts = {}) {
  const {
    opacity = 0.08,
    angle = -45,
    maxWidth = 400,
    maxHeight = 400,
    dx = 0,
    dy = 0,
  } = opts;

  const cx = doc.page.width / 2 + dx;
  const cy = doc.page.height / 2 + dy;

  doc.save();
  doc.opacity(opacity);
  doc.rotate(angle, { origin: [cx, cy] });
  // draw with center anchoring
  const x = cx - maxWidth / 2;
  const y = cy - maxHeight / 2;
  doc.image(img, x, y, { fit: [maxWidth, maxHeight] });
  doc.rotate(-angle, { origin: [cx, cy] });
  doc.opacity(1).restore();
}



// Time-only formatter for timeline
function formatTimeOnly(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const formatTime = formatTimeOnly; // ensure the name exists


// Generic “draw table with auto header repeat” (you already have one; reuse it if present)
function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
  const headerHeight = 20;
  const minRowHeight = 20;
  const pageBottom = () => doc.page.height - doc.page.margins.bottom;
  const pageTop    = () => doc.page.margins.top;

  let y = startY;

  const drawHeader = () => {
    let x = startX;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black");
    headers.forEach((h, i) => {
      const w = colWidths[i];
      doc.strokeColor("#999999").rect(x, y, w, headerHeight).stroke();
      const dy = Math.max(0, (headerHeight - doc.currentLineHeight()) / 2 - 1);
      doc.text(h, x + padding, y + dy, { width: w - 2 * padding, align: "left" });
      x += w;
    });
    y += headerHeight;
    doc.font("Helvetica").fontSize(10).fillColor("black");
  };

  if (y + headerHeight + minRowHeight > pageBottom()) {
    doc.addPage();
    y = pageTop();
  }
  drawHeader();

  rows.forEach((row) => {
    let rowH = minRowHeight;
    headers.forEach((h, i) => {
      const text = row[h] || "";
      const hgt = doc.heightOfString(text, { width: colWidths[i] - 2 * padding, align: "left" });
      rowH = Math.max(rowH, hgt + 2 * padding);
    });

    if (y + rowH > pageBottom()) {
      doc.addPage();
      y = pageTop();
      drawHeader();
    }

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

// Reuse your drawTextBox (you already have a robust version). If not, keep your newest one.

// Embed any image files in a list of items that carry { filename, s3Key }
async function embedImagesFromS3List(doc, items, currentY, labelGetter = (x) => x.filename) {
  if (!Array.isArray(items) || items.length === 0) return currentY;

  for (const item of items) {
    const fnameLower = (item?.filename || "").toLowerCase();
    const isImage = /\.(jpe?g|png|heic|heif|webp)$/i.test(fnameLower);
    if (!isImage) continue;

    if (!item?.s3Key) {
      doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
         .text(`(No S3 key for: ${item?.filename || "Unknown"})`, 50, currentY);
      doc.fillColor("black");
      currentY += 18;
      continue;
    }

    try {
      const rawBuf = await getObjectBuffer(item.s3Key);
      const buf = await toPdfSafeBuffer(rawBuf);
      const maxH = 300;
      const bottom = doc.page.height - doc.page.margins.bottom;
      if (currentY + maxH > bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }

      doc.image(buf, 50, currentY, { fit: [300, 300] });
      currentY += 310;
      doc.font("Helvetica").fontSize(9).fillColor("#555")
         .text(labelGetter(item), 50, currentY, { width: 300, align: "left" });
      doc.fillColor("black");
      currentY += 20;
    } catch (e) {
      doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
         .text(`(S3 fetch failed: ${item?.filename || "Unknown"})`, 50, currentY);
      doc.fillColor("black");
      currentY += 18;
    }
  }

  return currentY + 10;
}

// Embed attachments (links, images, or non-image file notes) for enclosures/evidence/pictures/audio/video
async function embedAttachments(doc, items, currentY, fileLabel = "File") {
  if (!Array.isArray(items) || items.length === 0) return currentY;

  for (const item of items) {
    // Handle external links
    if (item.isLink && item.link) {
      currentY = ensureSpace(doc, currentY, 30);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
         .text(`${fileLabel} Link: `, 50, currentY, { continued: true });
      doc.font("Helvetica").fontSize(10).fillColor("#003399")
         .text(item.link, { width: 400 });
      doc.fillColor("#000");
      currentY = doc.y + 8;
      continue;
    }

    if (!item.s3Key) continue;

    const fname = (item.originalName || item.filename || "").toLowerCase();
    const isImage = /\.(jpe?g|png|heic|heif|webp)$/i.test(fname);

    if (isImage) {
      try {
        const rawBuf = await getObjectBuffer(item.s3Key);
        const buf = await toPdfSafeBuffer(rawBuf);
        const maxH = 300;
        currentY = ensureSpace(doc, currentY, maxH + 30);
        doc.image(buf, 50, currentY, { fit: [300, 300] });
        currentY += 310;
        doc.font("Helvetica").fontSize(9).fillColor("#555")
           .text(item.originalName || item.filename || "Image", 50, currentY, { width: 300 });
        doc.fillColor("#000");
        currentY += 20;
      } catch (e) {
        currentY = ensureSpace(doc, currentY, 20);
        doc.font("Helvetica-Oblique").fontSize(10).fillColor("red")
           .text(`(Could not load image: ${item.originalName || item.filename || "Unknown"})`, 50, currentY);
        doc.fillColor("#000");
        currentY += 18;
      }
    } else {
      // Non-image file — list filename
      currentY = ensureSpace(doc, currentY, 25);
      doc.font("Helvetica").fontSize(10).fillColor("#555")
         .text(`Attached ${fileLabel}: ${item.originalName || item.filename || "Document"}`, 50, currentY);
      doc.fillColor("#000");
      currentY += 18;
    }
  }

  return currentY;
}


/* ---------------------------------------
   Helper: measureRowHeight, drawHeaderRow,
   drawSingleRow for row-splitting
-----------------------------------------*/
function measureRowHeight(doc, row, headers, colWidths, padding = 5) {
  let maxHeight = 20; // or your chosen minRowHeight
  headers.forEach((header, i) => {
    const cellText = row[header] || "";
    const cellHeight = doc.heightOfString(cellText, {
      width: colWidths[i] - 2 * padding,
      align: "left",
    });
    const fullHeight = cellHeight + 2 * padding;
    if (fullHeight > maxHeight) {
      maxHeight = fullHeight;
    }
  });
  return maxHeight;
}

// Detect closed/deleted state + best-effort reason across possible schemas
function getLeadClosureInfo(lead) {
  let state = "";
  let reason = "";

  const statusStr = (lead.status || "").toString();

  const looksClosed = /closed|completed|cancelled|canceled|void/i.test(statusStr);
  const isDeleted = !!(lead.isDeleted || lead.deleted);

  if (isDeleted) {
    state  = "Deleted";
    reason = lead.deletedReason || lead.deleteReason || lead.reason || "";
  } else if (looksClosed || lead.closedDate || lead.completedDate) {
    state  = statusStr || "Closed";
    reason = lead.closedReason || lead.closingReason || lead.closeReason || lead.reason || "";
  }

  // normalize whitespace
  if (typeof reason === "string") reason = reason.trim();
  return { state: state.trim(), reason };
}

// Draw a single label/value row (same visual pattern as "Assigned Officers")
function drawLabelValueRow(doc, x, y, label, value, totalWidth) {
  const paddingX   = 5;
  const paddingY   = 5;
  const labelWidth = 130;                  // keep consistent with your layout
  const valueWidth = totalWidth - labelWidth;
  const labelHMin  = 20;

  // measure wrapped value height
  doc.font("Helvetica").fontSize(10);
  const textH = doc.heightOfString(value || "N/A", {
    width: valueWidth - 2 * paddingX,
    align: "left",
  });
  const rowH = Math.max(labelHMin, textH + 2 * paddingY);

  // page break if needed
  if (y + rowH > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }

  // label cell
  doc.rect(x, y, labelWidth, rowH).fillAndStroke("#f5f5f5", "#ccc");
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000")
     .text(label, x + paddingX, y + paddingY, { width: labelWidth - 2 * paddingX });

  // value cell
  doc.strokeColor("#999999");
  doc.rect(x + labelWidth, y, valueWidth, rowH).stroke();
  doc.font("Helvetica").fontSize(10).fillColor("#000")
     .text(value || "N/A", x + labelWidth + paddingX, y + paddingY, {
       width: valueWidth - 2 * paddingX,
       align: "left",
     });

  return y + rowH;
}


function drawHeaderRow(doc, startX, startY, headers, colWidths, padding = 5) {
  doc.font("Helvetica-Bold").fontSize(10);
  let currentX = startX;
  const headerHeight = 20;
  headers.forEach((header, i) => {
    doc.strokeColor("#999999");
    doc.rect(currentX, startY, colWidths[i], headerHeight).stroke();
    doc.text(header, currentX + padding, startY + padding, {
      width: colWidths[i] - 2 * padding,
      align: "left",
    });
    currentX += colWidths[i];
  });
  return startY + headerHeight;
}

function formatOfficer(off) {
  if (!off) return "";
  // common shapes: string, {name}, {fullName}, {displayName}, {firstName,lastName}, {user:{...}}
  if (typeof off === "string") return off;
  if (off.fullName) return off.fullName;
  if (off.displayName) return off.displayName;
  if (off.name) return off.name;
  if (off.firstName || off.lastName) {
    return [off.firstName, off.lastName].filter(Boolean).join(" ").trim();
  }
  if (off.user) return formatOfficer(off.user);
  // fallback to something stable
  if (off.email) return off.email;
  if (off.username) return off.username;
  return "";
}

function formatOfficerList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "N/A";
  const names = arr
    .map(formatOfficer)
    .filter(Boolean);

  if (names.length === 0) return "N/A";
  // de-dupe while preserving order
  const seen = new Set();
  const deduped = names.filter(n => (seen.has(n) ? false : (seen.add(n), true)));
  return deduped.join(", ");
}


function drawSingleRow(doc, startX, startY, row, headers, colWidths, rowHeight, padding = 5) {
  doc.font("Helvetica").fontSize(10);
  let currentX = startX;
  headers.forEach((header, i) => {
    const cellText = row[header] || "";
    doc.strokeColor("#999999");
    doc.rect(currentX, startY, colWidths[i], rowHeight).stroke();
    doc.text(cellText, currentX + padding, startY + padding, {
      width: colWidths[i] - 2 * padding,
      align: "left",
    });
    currentX += colWidths[i];
  });
  return startY + rowHeight;
}

/* ---------------------------------------
   Helper: ensureSpace
-----------------------------------------*/
function ensureSpace(doc, currentY, estimatedHeight = 100) {
  if (currentY + estimatedHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return currentY;
}


/**
 * Measure the full box height, add a page if it won't fit,
 * then draw the text box.
 */
function safeDrawTextBox(doc, x, y, width, title, content) {
  const paddingX   = 5;
  const paddingY   = 10;
  // height consumed by the title line
  const titleH     = title ? 15 : 0;
  // wrap and measure the body text
  const textWidth  = width - 2 * paddingX;
  const bodyH      = doc.heightOfString(content, {
    width:  textWidth,
    align:  "justify"
  });
  // total box height
  const fullH      = titleH + bodyH + 2 * paddingY;

  // if it won't fit, start a new page
  if (y + fullH > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }

  // now draw exactly as before
  return drawTextBox(doc, x, y, width, title, content);
}

/* ---------------------------------------
   Other small helpers: formatDate, 
   drawTable, drawTextBox, etc.
-----------------------------------------*/
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

// Basic table that does NOT split rows across pages
function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
  const minRowHeight = 20;
  doc.font("Helvetica-Bold").fontSize(10);

  let currentY = startY;
  const headerHeight = 20;
  let currentX = startX;

  // Draw header row
  headers.forEach((header, i) => {
    doc.strokeColor("#999999");
    doc.rect(currentX, currentY, colWidths[i], headerHeight).stroke();
    doc.text(header, currentX + padding, currentY + padding, {
      width: colWidths[i] - 2 * padding,
      align: "left",
    });
    currentX += colWidths[i];
  });
  currentY += headerHeight;

  // Body rows
  doc.font("Helvetica").fontSize(10);
  rows.forEach((row) => {
    let maxHeight = minRowHeight;
    currentX = startX;
    // measure
    headers.forEach((header, i) => {
      const cellText = row[header] || "";
      const cellHeight = doc.heightOfString(cellText, {
        width: colWidths[i] - 2 * padding,
        align: "left",
      });
      const rowNeeded = cellHeight + 2 * padding;
      if (rowNeeded > maxHeight) maxHeight = rowNeeded;
    });
    // draw
    headers.forEach((header, i) => {
      const cellText = row[header] || "";
      doc.strokeColor("#999999");
      doc.rect(currentX, currentY, colWidths[i], maxHeight).stroke();
      doc.text(cellText, currentX + padding, currentY + padding, {
        width: colWidths[i] - 2 * padding,
        align: "left",
      });
      currentX += colWidths[i];
    });
    currentY += maxHeight;
  });

  return currentY;
}

// "Row Splitting" version
function drawTableWithRowSplitting(doc, startX, startY, headers, rows, colWidths) {
  let currentY = startY;
  // Draw header row first
  currentY = drawHeaderRow(doc, startX, currentY, headers, colWidths);

  // For each body row:
  for (const row of rows) {
    // Measure row height
    const rowHeight = measureRowHeight(doc, row, headers, colWidths);
    // If it doesn't fit, add a new page
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
      // re-draw header
      currentY = drawHeaderRow(doc, startX, currentY, headers, colWidths);
    }
    // Draw the row
    currentY = drawSingleRow(doc, startX, currentY, row, headers, colWidths, rowHeight);
  }

  return currentY;
}

// Suppose personTables is an array of "headers" arrays. We have to handle nextTable properly:
function hasNextTable(i, tables) {
  return (i + 1 < tables.length);
}

function measureTableHeight(table) {
  // This is just a placeholder. 
  // In reality, you might measure it by building a row and calling doc.heightOfString 
  // or replicate the logic in measureRowHeight. For now, maybe we just guess 50 again.
  return 50;
}

// Simple text box
// function drawTextBox(doc, x, y, width, title, content) {
//   const paddingX = 5;
//   const paddingY = 10;
//   const titleHeight = title ? 15 : 0;
//   doc.font("Helvetica").fontSize(12);

//   // Calculate text height
//   const contentHeight = doc.heightOfString(content, {
//     width: width - 2 * paddingX,
//     align: "justify",
//   });
//   const boxHeight = titleHeight + contentHeight + 2 * paddingY;

//   // Draw box border
//   doc.save();
//   doc.lineWidth(1);
//   doc.strokeColor("#999999");
//   doc.roundedRect(x, y, width, boxHeight, 2).stroke();
//   doc.restore();

//   // Title
//   if (title) {
//     doc.font("Helvetica-Bold").fontSize(10).text(title, x + paddingX, y + paddingY);
//   }

//   // Content
//   doc.font("Helvetica").fontSize(10).text(content, x + paddingX, y + paddingY + titleHeight, {
//     width: width - 2 * paddingX,
//     align: "justify",
//   });

//   return y + boxHeight + 20;
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
    // we still need a minimum space check so text doesn’t clip at bottom
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
/* ---------------------------------------
   Your "structured" lead detail drawing
-----------------------------------------*/
function drawStructuredLeadDetails(doc, x, y, lead, characterOfCase) {
  const colWidths = [130, 130, 130, 122];
  const rowHeight = 20;
  const padding = 5;

  // Header Row
  const headers = ["Lead Number:", "Lead Origin:", "Assigned Date:", "Submitted Date:"];
  const values = [
    lead.leadNo || "N/A",
    lead.parentLeadNo ? lead.parentLeadNo.join(", ") : "N/A",
    lead.assignedDate ? formatDate(lead.assignedDate) : "N/A",
    lead.submittedDate ? formatDate(lead.submittedDate) : "N/A",
  ];

  let currX = x;

  // Grey background cells
  for (let i = 0; i < headers.length; i++) {
    doc.rect(currX, y, colWidths[i], rowHeight).fillAndStroke("#f5f5f5", "#ccc");
    doc.fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(headers[i], currX + padding, y + 5);
    currX += colWidths[i];
  }

  y += rowHeight;
  currX = x;

  // Values row
  for (let i = 0; i < values.length; i++) {
    doc.rect(currX, y, colWidths[i], rowHeight).stroke();
    doc.font("Helvetica").fontSize(12).text(values[i], currX + padding, y + 5);
    currX += colWidths[i];
  }

  y += rowHeight;

  const tableWidth  = colWidths.reduce((a, b) => a + b, 0);
  const labelWidth  = 130;
  const valueWidth  = tableWidth - labelWidth;
  const labelHeight = 20;
  const paddingX    = 5;
  const paddingY    = 5;

  // Character of Case row
  const charText = characterOfCase || "N/A";
  doc.font("Helvetica").fontSize(10);
  const charTextHeight = doc.heightOfString(charText, { width: valueWidth - 2 * paddingX });
  const charRowH = Math.max(labelHeight, charTextHeight + 2 * paddingY);

  if (y + charRowH > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }

  doc.rect(x, y, labelWidth, charRowH).fillAndStroke("#f5f5f5", "#ccc");
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000")
    .text("Character of Case:", x + paddingX, y + paddingY, {
      width: labelWidth - 2 * paddingX,
      align: "left",
    });

  doc.strokeColor("#999999");
  doc.rect(x + labelWidth, y, valueWidth, charRowH).stroke();
  doc.font("Helvetica").fontSize(10).fillColor("#000")
    .text(charText, x + labelWidth + paddingX, y + paddingY, {
      width: valueWidth - 2 * paddingX,
      align: "left",
    });

  y += charRowH;

  // Assigned Officers row
  const officersText = formatOfficerList(lead.assignedTo);

// Measure the wrapped text height for the value cell
doc.font("Helvetica").fontSize(10);
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

return y + rowH + 20;

}

/* ---------------------------------------
   The main generation function
-----------------------------------------*/
async function generateCaseReport(req, res) {
  const {
    user,
    reportTimestamp,
    caseSummary,
    selectedReports,
    summaryMode,
    leadsData: leadsDataFromBody,
    // New: server-side data fetching params
    caseNo: caseNoParam,
    caseName: caseNameParam,
    reportScope,
    subsetRange,
    leadNos,
  } = req.body;

  const includeAll = selectedReports && selectedReports.FullReport;

  // Server-side fetch: if no leadsData in body, fetch from DB
  let leadsData;
  if (Array.isArray(leadsDataFromBody) && leadsDataFromBody.length > 0) {
    leadsData = leadsDataFromBody;
  } else if (caseNoParam) {
    try {
      leadsData = await fetchCaseLeadsData(caseNoParam, caseNameParam, {
        reportScope,
        subsetRange,
        leadNos,
      });
    } catch (fetchErr) {
      console.error("Error fetching case data for report:", fetchErr);
      return res.status(500).json({ error: "Failed to fetch case data" });
    }
  } else {
    return res.status(400).json({ error: "caseNo or leadsData is required" });
  }

  if (!leadsData || leadsData.length === 0) {
    return res.status(404).json({ error: "No leads found for this case" });
  }

  const caseNo   = caseNoParam || leadsData?.[0]?.caseNo   || "";
  const caseName = caseNameParam || leadsData?.[0]?.caseName || "";

  let characterOfCase = "";
  if (caseNo) {
    const caseDoc = await Case.findOne({ caseNo }).select("characterOfCase").lean();
    characterOfCase = caseDoc?.characterOfCase || "";
  }


  try {
    // Create doc
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });

     const showExecSummary =
    summaryMode !== 'none' &&
    typeof caseSummary === 'string' &&
    caseSummary.trim().length > 0;

    const reportTitle = showExecSummary ? "Final Case Report" : "Preliminary Case Report";


    const WM = { text: "DRAFT", opacity: 0.08, angle: -35, fontSize: 100 };
    const shouldWatermark = !showExecSummary;

    if (shouldWatermark) {
      // watermark the first page
      drawWatermark(doc, WM);
      // and every subsequently added page
      doc.on("pageAdded", () => drawWatermark(doc, WM));
    }


    // Collect into buffer so we can merge PDF attachments afterwards
    const pdfChunks = [];
    doc.on("data", (chunk) => pdfChunks.push(chunk));
    const docEndPromise = new Promise((resolve, reject) => {
      doc.on("end",   resolve);
      doc.on("error", reject);
    });

    // Track PDF-file attachments discovered during rendering
    const pdfAttachments = [];

    // -- Header Section --
    const headerHeight = 80;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#003366");

    const logoHeight = 70;
    const verticalCenterY = (headerHeight - logoHeight) / 2;
    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 10, verticalCenterY, { width: 70, height: 70 });
    }

     doc.fillColor("white").font("Helvetica").fontSize(10);
  const rightBlockX = doc.page.width - 260;        // right inset for the info block
  const rightBlockW = 250;
  doc.text(`Generated by: ${user}`, rightBlockX, verticalCenterY + 10, {
    width: rightBlockW, align: "right"
  });
  doc.text(`Timestamp: ${reportTimestamp}`, rightBlockX, verticalCenterY + 26, {
    width: rightBlockW, align: "right"
  });

    let currentY = headerHeight - 50;
    doc.fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(reportTitle, 0, currentY, { align: "center" });
    currentY = doc.y + 5;

    doc.fillColor("white").font("Helvetica").fontSize(10);
    doc.text(`Case: ${caseNo}: ${caseName}`, { align: "center" });
    currentY = doc.y + 30;

    // Reset color
    doc.fillColor("black");


    // ---------- Case Summary ----------
    if (showExecSummary) {
      doc.font("Helvetica-Bold").fontSize(11).text("Executive Case Summary:", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", caseSummary);
    }

    // ---------- Iterate Over Leads ----------
    if (leadsData && leadsData.length > 0) {
      for (const lead of leadsData) {
        // Page check
        currentY = ensureSpace(doc, currentY, 60);

        // LEAD DETAILS
        doc.font("Helvetica-Bold").fontSize(12).text(`Lead No. ${lead.leadNo} Details:`, 50, currentY);
        currentY += 20;

        // structured details
        // currentY = ensureSpace(doc, currentY, 60);
        currentY = drawStructuredLeadDetails(doc, 50, currentY, lead, characterOfCase);

        const { state: leadState, reason: leadReason } = getLeadClosureInfo(lead);
if (leadState) {
  const tableWidth = 512; // same width you use for boxes/tables in this section
  const value = leadReason ? `${leadState} — ${leadReason}` : leadState;
  currentY = ensureSpace(doc, currentY, 40);
  currentY = drawLabelValueRow(doc, 50, currentY, "Lead Status:", value, tableWidth) + 20;
}

        // optional blocks
        if (includeAll && lead.description) {
          currentY = ensureSpace(doc, currentY, 60);
          doc.font("Helvetica-Bold").fontSize(11).text("Lead Log Summary:", 50, currentY);
          currentY += 20;
          // currentY = ensureSpace(doc, currentY, 60);
          currentY = drawTextBox(doc, 50, currentY, 512, "", lead.description);
        }

        if (includeAll && lead.summary) {
          currentY = ensureSpace(doc, currentY, 60);
          doc.font("Helvetica-Bold").fontSize(11).text("Lead Instruction:", 50, currentY);
          currentY += 20;
          // currentY = ensureSpace(doc, currentY, 60);
          currentY = drawTextBox(doc, 50, currentY, 512, "", lead.summary);
        }

        // LEAD RETURNS
        if (includeAll) {
          if (lead.leadReturns && lead.leadReturns.length > 0) {
            for (const lrRaw of lead.leadReturns) {
               const lr = normalizeLeadReturn(lrRaw);
              // small space check
              currentY = ensureSpace(doc, currentY, 100);

              // 1) Return ID
              doc.font("Helvetica-Bold").fontSize(11).text(`Lead Return ID: ${lr.leadReturnId}`, 50, currentY);
              currentY += 20;
              currentY = ensureSpace(doc, currentY, 100);

              currentY = drawTextBox(doc, 50, currentY, 512, "", lr.leadReturnResult || "") + 20;


              // 2) Person Details
              if (lr.persons && lr.persons.length > 0) {

                currentY = ensureSpace(doc, currentY, 60);
                doc.font("Helvetica-Bold").fontSize(12).text("Person Details:", 50, currentY);
                currentY += 20;
                for (const person of lr.persons) {
                  // Person photo
                  if (person.photoS3Key) {
                    try {
                      const rawBuf = await getObjectBuffer(person.photoS3Key);
                      const imgBuf = await toPdfSafeBuffer(rawBuf);
                      const photoSize = 60;
                      currentY = ensureSpace(doc, currentY, photoSize + 10);
                      doc.image(imgBuf, 50, currentY, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
                      currentY += photoSize + 8;
                    } catch (e) {
                      console.warn("Failed to embed person photo in case report:", e?.message);
                    }
                  }
                  const personTables = [
                    {
                      headers: ["Date Entered", "Name", "Phone #", "Address"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Date Entered": formatDate(person.enteredDate),
                        "Name": person.firstName
                          ? `${person.firstName}, ${person.lastName}`
                          : "N/A",
                        "Phone #": person.cellNumber || "N/A",
                        "Address": person.address
                          ? `${person.address.street1 || ""}, ${person.address.city || ""}, ` +
                            `${person.address.state || ""}, ${person.address.zipCode || ""}`
                          : "N/A",
                      },
                    },
                    {
                      headers: ["Last Name", "First Name", "Middle Initial", "Cell Number"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Last Name": person.lastName || "N/A",
                        "First Name": person.firstName || "N/A",
                        "Middle Initial": person.middleInitial || "",
                        "Cell Number": person.cellNumber || "N/A",
                      },
                    },
                    {
                      headers: ["Business Name", "Street 1", "Street 2", "Building"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Business Name": person.businessName || "N/A",
                        "Street 1": person.address?.street1 || "N/A",
                        "Street 2": person.address?.street2 || "N/A",
                        "Building": person.address?.building || "N/A",
                      },
                    },
                    {
                      headers: ["Apartment", "City", "State", "Zip Code"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Apartment": person.address?.apartment || "N/A",
                        "City": person.address?.city || "N/A",
                        "State": person.address?.state || "N/A",
                        "Zip Code": person.address?.zipCode || "N/A",
                      },
                    },
                    {
                      headers: ["SSN", "Age", "Email", "Occupation"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "SSN": person.ssn || "N/A",
                        "Age": person.age != null ? person.age.toString() : "N/A",
                        "Email": person.email || "N/A",
                        "Occupation": person.occupation || "N/A",
                      },
                    },
                    {
                      headers: ["Person Type", "Condition", "Caution Type", "Sex"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Person Type": person.personType || "N/A",
                        "Condition": person.condition || "N/A",
                        "Caution Type": person.cautionType || "N/A",
                        "Sex": person.sex || "N/A",
                      },
                    },
                    {
                      headers: ["Race", "Ethnicity", "Skin Tone", "Eye Color"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Race": person.race || "N/A",
                        "Ethnicity": person.ethnicity || "N/A",
                        "Skin Tone": person.skinTone || "N/A",
                        "Eye Color": person.eyeColor || "N/A",
                      },
                    },
                    {
                      headers: ["Glasses", "Hair Color", "Height", "Weight"],
                      widths: [128, 128, 128, 128],
                      row: {
                        "Glasses": person.glasses || "N/A",
                        "Hair Color": person.hairColor || "N/A",
                        "Height": person.height
                          ? `${person.height.feet || 0}'${person.height.inches || 0}"`
                          : "N/A",
                        "Weight": person.weight != null ? person.weight.toString() : "N/A",
                      },
                    },
                    {
                      headers: ["Alias", "Suffix", "Scar / Tattoo / Mark"],
                      widths: [170, 170, 172],
                      row: {
                        "Alias": person.alias || "N/A",
                        "Suffix": person.suffix || "N/A",
                        "Scar / Tattoo / Mark": [person.scar, person.tattoo, person.mark]
                          .filter(Boolean).join("; ") || "N/A",
                      },
                    },
                  ];
                  // const personTables = [
                  //   ["Date Entered", "Name", "Phone #", "Address"],
                  //   ["Last Name", "First Name", "Middle Initial", "Cell Number"],
                  //   ["Business Name", "Street 1", "Street 2", "Building"],
                  //   ["Apartment", "City", "State", "Zip Code"],
                  //   ["SSN", "Age", "Email", "Occupation"],
                  //   ["Person Type", "Condition", "Caution Type", "Sex"],
                  //   ["Race", "Ethnicity", "Skin Tone", "Eye Color"],
                  //   ["Glasses", "Hair Color", "Height", "Weight"]
                  // ];
                  // const personWidths = {
                  //           "Date Entered": 90,
                  //           "Name": 100,
                  //           "Phone #": 100,
                  //           "Address": 222,
                          
                  //           "Last Name": 90,
                  //           "First Name": 100,
                  //           "Middle Initial": 100,
                  //           "Cell Number": 222,
                          
                  //           "Business Name": 90,
                  //           "Street 1": 100,
                  //           "Street 2": 100,
                  //           "Building": 222,
                          
                  //           "Apartment": 90,
                  //           "City": 100,
                  //           "State": 100,
                  //           "Zip Code": 222,
                          
                  //           "SSN": 90,
                  //           "Age": 100,
                  //           "Email": 100,
                  //           "Occupation": 222,
                          
                  //           "Person Type": 90,
                  //           "Condition": 100,
                  //           "Caution Type": 100,
                  //           "Sex": 222,
                          
                  //           "Race": 90,
                  //           "Ethnicity": 100,
                  //           "Skin Tone": 100,
                  //           "Eye Color": 222,
                          
                  //           "Glasses": 90,
                  //           "Hair Color": 100,
                  //           "Height": 100,
                  //           "Weight": 222,
                  //         };
                          
            
                  // const personData = [
                  //   ["03/14/24", "Dan, Hill", "1234567890", "120 3rd St, New York, NY"],
                  //   ["Hill", "Dan", "S.", "1234567890"],
                  //   ["", "", "", ""],
                  //   ["", "", "", ""],
                  //   ["", "20", "", ""],
                  //   ["", "", "", ""],
                  //   ["", "", "", ""],
                  //   ["", "", "", ""]
                  // ];

                  currentY = ensureSpace(doc, currentY, 60);

                  personTables.forEach((tbl) => {
                    // Estimate the table height
                    const rowHeight = measureRowHeight(doc, tbl.row, tbl.headers, tbl.widths);
                    // Add space for header row + some buffer
                    const estimatedHeight = rowHeight + 20;
                    currentY = ensureSpace(doc, currentY, estimatedHeight);

                    // Actually draw table with row splitting
                    currentY =
                      drawTableWithRowSplitting(doc, 50, currentY, tbl.headers, [tbl.row], tbl.widths) +
                      20;
                  });

                  
                  // currentY = ensureSpace(doc, currentY, 60);

                  // personTables.forEach((headers, i) => {
                  
                  //   currentY = ensureSpace(doc, currentY, 60);
                  //   const row = {};
                  //   const colWidths = headers.map(header => personWidths[header] || 100);
                  //   headers.forEach((h, j) => {
                  //     row[h] = personData[i][j];
                  //   });
                  //   currentY = drawTable(doc, 50, currentY, headers, [row], colWidths) + 20;
                  
                  //   // 3) "After" printing: look ahead to the *next* table
                  //   if (hasNextTable(i, personTables)) {
                  //     currentY = ensureSpace(doc, currentY, 60);
                  //     const nextTableHeaders = personTables[i + 1]; // e.g. the next item in personTables
                  //     const neededForNextTable = measureTableHeight(nextTableHeaders);
                  //     // If we won't have enough space left for the *next* subtable, start a new page now
                  //     // if (currentY + neededForNextTable > doc.page.height - doc.page.margins.bottom) {
                  //     //   doc.addPage();
                  //     //   currentY = doc.page.margins.top;
                  //     // }


                  //   }
                  // });
                }
              }

              // 3) Vehicle Details
              if (lr.vehicles && lr.vehicles.length > 0) {
                currentY = ensureSpace(doc, currentY, 50);
                doc.font("Helvetica-Bold").fontSize(12).text("Vehicle Details:", 50, currentY);
                currentY += 20;

                for (const vehicle of lr.vehicles) {
                  const vehicleTables = [
                    {
                      headers: ["Date Entered", "Year", "Make", "Model", "Plate", "State"],
                      widths: [86, 85, 85, 85, 85, 86],
                      row: {
                        "Date Entered": formatDate(vehicle.enteredDate),
                        "Year":  vehicle.year  || "N/A",
                        "Make":  vehicle.make  || "N/A",
                        "Model": vehicle.model || "N/A",
                        "Plate": vehicle.plate || "N/A",
                        "State": vehicle.state || "N/A",
                      },
                    },
                    {
                      headers: ["VIN", "Category", "Type", "Primary Color", "Secondary Color"],
                      widths: [103, 102, 102, 102, 103],
                      row: {
                        "VIN":             vehicle.vin             || "N/A",
                        "Category":        vehicle.category        || "N/A",
                        "Type":            vehicle.type            || "N/A",
                        "Primary Color":   vehicle.primaryColor    || "N/A",
                        "Secondary Color": vehicle.secondaryColor  || "N/A",
                      },
                    },
                  ];

                  if (vehicle.information || vehicle.additionalData) {
                    vehicleTables.push({
                      headers: ["Additional Information"],
                      widths: [512],
                      row: {
                        "Additional Information": vehicle.information || vehicle.additionalData || "N/A",
                      },
                    });
                  }

                  vehicleTables.forEach((tbl) => {
                    const rowH = measureRowHeight(doc, tbl.row, tbl.headers, tbl.widths);
                    currentY = ensureSpace(doc, currentY, rowH + 20);
                    currentY = drawTableWithRowSplitting(doc, 50, currentY, tbl.headers, [tbl.row], tbl.widths) + 8;
                  });
                  currentY += 12;
                }
              }
              // 3b) Enclosure Details
if (lr.enclosures && lr.enclosures.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Enclosure Details:", 50, currentY);
  currentY += 20;

  const encHeaders = ["Date Entered", "Type", "Description", "File / Link"];
  const encRows = lr.enclosures.map((e) => ({
    "Date Entered": formatDate(e.enteredDate),
    "Type": e.type || "N/A",
    "Description": e.enclosureDescription || "N/A",
    "File / Link": e.isLink ? (e.link || "Link") : (e.originalName || e.filename || "N/A"),
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, encHeaders, encRows, [80, 80, 222, 130]) + 10;

  // Embed images / list documents / show links
  currentY = await embedAttachments(doc, lr.enclosures, currentY, "Enclosure");

  // Queue PDF files for end-of-report merging
  for (const enc of lr.enclosures) {
    if (!enc.isLink && enc.s3Key && /\.pdf$/i.test(enc.originalName || enc.filename || "")) {
      pdfAttachments.push({ s3Key: enc.s3Key, filename: enc.originalName || enc.filename || "enclosure.pdf" });
    }
  }
  currentY += 10;
}

// 3c) Evidence Details
if (lr.evidence && lr.evidence.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Evidence Details:", 50, currentY);
  currentY += 20;

  const evHeaders = ["Date Entered", "Type", "Disposed Date", "Description", "File / Link"];
  const evRows = lr.evidence.map((ev) => ({
    "Date Entered":    formatDate(ev.enteredDate),
    "Type":            ev.type || "N/A",
    // "Collection Date": formatDate(ev.collectionDate),
    "Disposed Date":   formatDate(ev.disposedDate),
    "Description":     ev.evidenceDescription || "N/A",
    "File / Link":     ev.isLink ? (ev.link || "Link") : (ev.originalName || ev.filename || "N/A"),
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, evHeaders, evRows, [107, 65, 113, 127, 100]) + 10;

  // Embed images / list documents / show links
  currentY = await embedAttachments(doc, lr.evidence, currentY, "Evidence");

  // Queue PDF files for end-of-report merging
  for (const ev of lr.evidence) {
    if (!ev.isLink && ev.s3Key && /\.pdf$/i.test(ev.originalName || ev.filename || "")) {
      pdfAttachments.push({ s3Key: ev.s3Key, filename: ev.originalName || ev.filename || "evidence.pdf" });
    }
  }
  currentY += 10;
}

// 3d) Picture Details
if (lr.pictures && lr.pictures.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Picture Details:", 50, currentY);
  currentY += 20;

  const picHeaders = ["Date Entered", "Date Picture Taken", "Description", "File / Link"];
  const picRows = lr.pictures.map((p) => ({
    "Date Entered":       formatDate(p.enteredDate),
    "Date Picture Taken": formatDate(p.datePictureTaken),
    "Description":        p.pictureDescription || "N/A",
    "File / Link":        p.isLink ? (p.link || "Link") : (p.originalName || p.filename || "N/A"),
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, picHeaders, picRows, [80, 110, 192, 130]) + 10;

  // Embed actual images from S3
  currentY = await embedAttachments(doc, lr.pictures, currentY, "Picture");
  currentY += 10;
}

// 3e) Audio Details
if (lr.audio && lr.audio.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Audio Details:", 50, currentY);
  currentY += 20;

  const audioHeaders = ["Date Entered", "Date Recorded", "Description", "File / Link"];
  const audioRows = lr.audio.map((a) => ({
    "Date Entered":        formatDate(a.enteredDate),
    "Date Audio Recorded": formatDate(a.dateAudioRecorded),
    "Description":         a.audioDescription || "N/A",
    "File / Link":         a.isLink ? (a.link || "Link") : (a.originalName || a.filename || "N/A"),
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, audioHeaders, audioRows, [80, 110, 192, 130]) + 20;
}

// 3f) Video Details
if (lr.videos && lr.videos.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Video Details:", 50, currentY);
  currentY += 20;

  const vidHeaders = ["Date Entered", "Date Video Recorded", "Description", "File / Link"];
  const vidRows = lr.videos.map((v) => ({
    "Date Entered":        formatDate(v.enteredDate),
    "Date Video Recorded": formatDate(v.dateVideoRecorded),
    "Description":         v.videoDescription || "N/A",
    "File / Link":         v.isLink ? (v.link || "Link") : (v.originalName || v.filename || "N/A"),
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, vidHeaders, vidRows, [80, 110, 192, 130]) + 20;
}

// 3g) Lead Notes (Scratchpad)
const scratch = lr.scratchpad || lr.notes; // support either field name
if (scratch && scratch.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Lead Notes:", 50, currentY);
  currentY += 20;

  const headers = ["Date Entered", "Return Id", "Description"];
  const rows = scratch.map((n) => ({
    "Date Entered": formatDate(n.enteredDate),
    "Return Id":    n.leadReturnId || n.returnId || "N/A",
    "Description":  n.text || n.description || "N/A",
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, headers, rows, [90, 120, 302]) + 20;
}

// 3h) Timeline Details
const timeline = lr.timeline || lr.timelineEntries || lr.events;
if (timeline && timeline.length > 0) {
  currentY = ensureSpace(doc, currentY, 50);
  doc.font("Helvetica-Bold").fontSize(12).text("Timeline Details:", 50, currentY);
  currentY += 20;

  const headers = ["Event Date", "Time Range", "Location", "Flags", "Description"];
  const rows = timeline.map((t) => ({
    "Event Date":  formatDate(t.eventDate),
    "Time Range":
      `${formatTime(t.eventStartTime) || ""}` +
      (t.eventEndTime ? ` – ${formatTime(t.eventEndTime)}` : ""),
    "Location":    t.eventLocation || "N/A",
    "Flags":       Array.isArray(t.timelineFlag) ? t.timelineFlag.join(", ") : (t.flags || "N/A"),
    "Description": t.eventDescription || "N/A",
  }));
  currentY = ensureSpace(doc, currentY, 60);
  currentY = drawTable(doc, 50, currentY, headers, rows, [80, 100, 100, 80, 152]) + 20;
}

            }
          } else {
            // No lead returns
            // currentY = ensureSpace(doc, currentY, 50);
            // const headers = ["Lead Returns"];
            // const rows = [{ "Lead Returns": "No Lead Returns Available" }];
            // const widths = [512];
            // currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;

            currentY = ensureSpace(doc, currentY, 60);
            doc.font("Helvetica-Bold").fontSize(11).text("Lead Return:", 50, currentY);
            currentY += 20;
            // currentY = ensureSpace(doc, currentY, 60);
            currentY = drawTextBox(doc, 50, currentY, 512, "", "No Lead Returns Available");
          }
        }
      }
    } else {
      // No leads
      doc.text("No leads data available.", 50, currentY);
    }

    // Finalise the PDFKit document
    doc.end();
    await docEndPromise;

    // Merge any queued PDF attachments (enclosures / evidence)
    let finalBuffer = Buffer.concat(pdfChunks);
    for (const att of pdfAttachments) {
      try {
        const attBuf = await getObjectBuffer(att.s3Key);
        finalBuffer = await mergeWithAnotherPDF(finalBuffer, attBuf);
      } catch (e) {
        console.warn(`Failed to merge PDF attachment "${att.filename}":`, e?.message);
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    res.end(finalBuffer);

  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
}

module.exports = { generateCaseReport };
