const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// Helper to draw a simple table with headers
function drawTable(doc, startX, startY, headers, rows, colWidths, rowHeight = 20) {
  doc.font("Helvetica-Bold").fontSize(10);

  // Draw table header
  let currentX = startX;
  let currentY = startY;
  headers.forEach((header, i) => {
    doc.rect(currentX, currentY, colWidths[i], rowHeight).stroke();
    doc.text(header, currentX + 5, currentY + 5, {
      width: colWidths[i] - 10,
      align: "left",
    });
    currentX += colWidths[i];
  });

  // Draw table rows
  doc.font("Helvetica").fontSize(10);
  rows.forEach((row) => {
    currentY += rowHeight;
    currentX = startX;
    headers.forEach((header, i) => {
      const cellText = row[header] || "";
      doc.rect(currentX, currentY, colWidths[i], rowHeight).stroke();
      doc.text(cellText, currentX + 5, currentY + 5, {
        width: colWidths[i] - 10,
        align: "left",
      });
      currentX += colWidths[i];
    });
  });

  return currentY + rowHeight; // Return Y position after drawing table
}

// Helper to draw a light gray box for multi-line text, e.g. “Lead Instruction”
function drawTextBox(doc, x, y, width, height, title, content) {
  // Outline
  doc
    .save()
    .lineWidth(1)
    .strokeColor("#ccc")
    .rect(x, y, width, height)
    .stroke()
    .restore();

  // Title in bold
  if (title) {
    doc.font("Helvetica-Bold").fontSize(10).text(title, x + 5, y + 5);
  }

  // Main content
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(content, x + 5, y + 20, {
      width: width - 10,
      align: "justify",
    });
}

function generateReport(req, res) {
  try {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });

    // Stream the PDF to the browser inline
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    doc.pipe(res);

    // Insert Police Logo below “User Login”
    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");
    const initialY = doc.y;
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.x, initialY + 15, { width: 60 });
    }
    doc.moveDown(3);

    // 2) Centered Case and Lead info
    doc.font("Helvetica-Bold").fontSize(14)
      .text("Case: 62345 | Bank Robbery Case", { align: "center" });
    doc.font("Helvetica-Bold").fontSize(12)
      .text("Lead: 1 | Interview Mr. John", { align: "center" });

    // Horizontal line
    doc.moveDown(0.5);
    const lineY = doc.y;
    doc
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.width - doc.page.margins.right, lineY)
      .stroke();
    doc.moveDown(1);

    // 3) LEAD DETAILS SECTION
    doc.font("Helvetica-Bold").fontSize(12).text("Lead Details:");
    doc.moveDown(0.5);

    // Table for “Lead No.”, “Origin”, “Assigned Date”, “Due Date”, “Completed Date”
    const leadHeaders = ["Lead No.", "Origin", "Assigned Date", "Due Date", "Completed Date"];
    const leadColWidths = [60, 60, 90, 90, 100];
    const leadRows = [
      {
        "Lead No.": "1",
        "Origin": "12345",
        "Assigned Date": "03/14/24",
        "Due Date": "03/20/24",
        "Completed Date": "03/22/24",
      },
    ];
    let tableStartY = doc.y;
    let tableEndY = drawTable(doc, 50, tableStartY, leadHeaders, leadRows, leadColWidths, 20);
    doc.y = tableEndY + 10;

    // Assigned Officers line
    doc.font("Helvetica-Bold").fontSize(10).text("Assigned Officers: ", { continued: true });
    doc.font("Helvetica").text("Officer 90, Officer 24");

    // 4) Big text box for “Lead Instruction”
    doc.moveDown(0.5);
    const textBoxX = 50;
    const textBoxY = doc.y;
    const textBoxWidth = 400;
    const textBoxHeight = 60;
    drawTextBox(
      doc,
      textBoxX,
      textBoxY,
      textBoxWidth,
      textBoxHeight,
      "Lead Instruction",
      "As part of the Bank Robbery Investigation (Case No. 65734), Officer 915 responded with Officers 1, 2, and 3. The task of interviewing Matthew Jacobs was assigned to Officer 24. During the interview, Jacobs provided valuable information that may assist in furthering this investigation..."
    );
    doc.y = textBoxY + textBoxHeight + 10;

    // 5) LEAD RETURN ID
    doc.font("Helvetica-Bold").fontSize(12).text("Lead Return ID: 1");
    doc.moveDown(0.5);

    // 5a) PERSON DETAILS TABLE
    doc.font("Helvetica-Bold").fontSize(10).text("Person Details");
    doc.moveDown(0.3);
    const personHeaders = ["Date Entered", "Name", "Phone #", "Address", "Additional"];
    const personColWidths = [80, 80, 80, 160, 70];
    const personRows = [
      {
        "Date Entered": "03/14/24",
        "Name": "Dan, Hill",
        "Phone #": "1234567890",
        "Address": "120 3rd St, New York, NY",
        "Additional": "View",
      },
    ];
    let tableY = doc.y;
    tableY = drawTable(doc, 50, tableY, personHeaders, personRows, personColWidths);
    doc.y = tableY + 20;

    // 5b) VEHICLE DETAILS TABLE
    doc.font("Helvetica-Bold").fontSize(10).text("Vehicle Details");
    doc.moveDown(0.3);
    const vehicleHeaders = ["Date Entered", "Make", "Model", "Color", "Plate", "State", "Additional"];
    const vehicleColWidths = [80, 60, 60, 60, 60, 50, 70];
    const vehicleRows = [
      {
        "Date Entered": "03/14/24",
        "Make": "Toyota",
        "Model": "Corolla",
        "Color": "Blue",
        "Plate": "XYZ1234",
        "State": "NY",
        "Additional": "View",
      },
    ];
    tableY = drawTable(doc, 50, doc.y, vehicleHeaders, vehicleRows, vehicleColWidths);
    doc.y = tableY + 20;

    // 6) Finalize the doc
    doc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

module.exports = { generateReport };
