const PDFDocument = require("pdfkit");
const { PDFDocument: PDFLibDocument } = require("pdf-lib");
const path = require("path");
const fs = require("fs");

// Helper: merges your PDFKit doc with an external PDF
async function mergeWithAnotherPDF(pdfKitBuffer, otherPdfPath) {
  const mainDoc = await PDFLibDocument.load(pdfKitBuffer);
  const otherBuffer = fs.readFileSync(otherPdfPath);
  const otherDoc = await PDFLibDocument.load(otherBuffer);

  // Copy every page from otherDoc, append to mainDoc
  const copiedPages = await mainDoc.copyPages(otherDoc, otherDoc.getPageIndices());
  copiedPages.forEach((page) => mainDoc.addPage(page));

  // Return the final merged PDF as a buffer
  const mergedPdfBytes = await mainDoc.save();
  return Buffer.from(mergedPdfBytes);
}

function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
  const minRowHeight = 20;
  doc.font("Helvetica-Bold").fontSize(10);
  let currentY = startY;

  let headerHeight = 20;
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.strokeColor("#999999");
    doc.rect(currentX, currentY, colWidths[i], headerHeight).stroke();
    doc.text(header, currentX + padding, currentY + padding, {
      width: colWidths[i] - 2 * padding,
      align: "left"
    });
    currentX += colWidths[i];
  });

  currentY += headerHeight;
  doc.font("Helvetica").fontSize(10);

  rows.forEach((row) => {
    let maxHeight = 0;
    currentX = startX;

    headers.forEach((header, i) => {
      const cellText = row[header] || "";
      const cellHeight = doc.heightOfString(cellText, {
        width: colWidths[i] - 2 * padding,
        align: "left"
      });
      maxHeight = Math.max(maxHeight, cellHeight + 2 * padding);
    });

    maxHeight = Math.max(maxHeight, minRowHeight);

    headers.forEach((header, i) => {
      const cellText = row[header] || "";
      doc.rect(currentX, currentY, colWidths[i], maxHeight).stroke();
      doc.text(cellText, currentX + padding, currentY + padding, {
        width: colWidths[i] - 2 * padding,
        align: "left"
      });
      currentX += colWidths[i];
    });

    currentY += maxHeight;
  });

  return currentY;
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

function drawStructuredLeadDetails(doc, x, y, lead) {
  const colWidths = [130, 130, 130, 122];
  const rowHeight = 20;
  const padding = 5;

  // Header Row
  const headers = ["Lead Origin:", "Assigned By","Assigned Date:", "Completed Date:"];
  const values = [
    lead.parentLeadNo ? lead.parentLeadNo.join(", ") : "N/A",
    lead.assignedBy ? lead.assignedBy : "N/A",
    lead.assignedDate ? formatDate(lead.assignedDate) : "N/A",
    lead.completedDate ? formatDate(lead.completedDate) : "N/A",
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

  // Second Row - Assigned Officers
  y += rowHeight;
  doc
    .rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
    .fillAndStroke("#f5f5f5", "#ccc");
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#000")
    .text("Assigned Officers:", x + padding, y + 5);

  const officersText = lead.assignedTo?.join(", ") || "N/A";
  doc.font("Helvetica").fontSize(12).text(officersText, x + 150 + padding, y + 5);

   // Second Row - Assigned Officers
   y += rowHeight;
   doc
     .rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
     .fillAndStroke("#f5f5f5", "#ccc");
   doc
     .font("Helvetica-Bold")
     .fontSize(11)
     .fillColor("#000")
     .text("Subnumbers:", x + padding, y + 5);
 
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

  return y + rowHeight + 20;
}

function drawTextBox(doc, x, y, width, title, content) {
  const padding = 5;
  const titleHeight = title ? 15 : 0;
  doc.strokeColor("#999999");
  doc.font("Helvetica").fontSize(10);
  const contentHeight = doc.heightOfString(content, {
    width: width - 2 * padding,
    align: "justify"
  });

  const boxHeight = titleHeight + contentHeight + 2 * padding;
  doc.strokeColor("#999999");

  doc.save().lineWidth(1).strokeColor("#999999").rect(x, y, width, boxHeight).stroke().restore();

  if (title) {
    doc.font("Helvetica-Bold").fontSize(10).text(title, x + padding, y + padding);
  }

  doc.strokeColor("#999999");
  doc.font("Helvetica").fontSize(10).text(content, x + padding, y + padding + titleHeight, {
    width: width - 2 * padding,
    align: "justify"
  });

  return y + boxHeight + 20;
}

function generateReport(req, res) {
  const {
    leadInstruction, leadReturn, leadPersons, leadVehicles,
    leadEnclosures, leadEvidence, leadPictures, leadAudio,
    leadVideos, leadScratchpad, leadTimeline, selectedReports, leadInstructions
  } = req.body;

  const includeAll = selectedReports && selectedReports.FullReport;

  try {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    // doc.pipe(res);

    const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", async () => {
  // All PDF data from PDFKit is now in `chunks`
  const pdfKitBuffer = Buffer.concat(chunks);

  // We'll do the merging with pdf-lib here
  try {
    const mergedBuffer = await mergeWithAnotherPDF(pdfKitBuffer, "report_Officer 916_20250321T144351339Z.pdf");
    // Then send that final merged PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=merged.pdf");
    res.send(mergedBuffer);
  } catch (err) {
    console.error("Merge error:", err);
    res.status(500).json({ error: "Failed to merge PDF" });
  }
});

    const headerHeight = 80;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#003366");

    const logoHeight = 70;
    const verticalCenterY = (headerHeight - logoHeight) / 2;
    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 10, verticalCenterY, { width: 70, height: 70, align: "left" });

    let currentY = headerHeight - 50;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(14).text(`Case: ${leadInstructions?.caseNo || 'N/A'} | ${leadInstructions?.caseName || 'N/A'}`, 0, currentY, { align: "center" });
    currentY = doc.y + 5;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text(`Lead: ${leadInstructions?.leadNo || 'N/A'} | ${leadInstructions?.description || 'N/A'}`, 0, currentY, { align: "center" });
    currentY = doc.y + 20;
    doc.fillColor("black");

    currentY = headerHeight + 20;

    if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }
    doc.font("Helvetica-Bold").fontSize(12).text("Lead Details:", 50, currentY);
    currentY += 20;
    // currentY = drawTable(doc, 50, currentY, ["Lead No.", "Origin", "Assigned Date", "Due Date", "Completed Date"], [{ "Lead No.": leadInstructions?.leadNo || 'N/A', "Origin": leadInstructions?.parentLeadNo || 'N/A', "Assigned Date": formatDate(leadInstructions?.assignedDate) || 'N/A', "Due Date": formatDate(leadInstructions?.dueDate) || 'N/A', "Completed Date": "Still to add in db" }], [90, 90, 120, 120, 92]) + 20;
    // currentY = drawTable(doc, 50, currentY, ["Sub No.", "Associated Sub Nos.", "Assigned Officers", "Assigned By"], [{ "Sub No.": leadInstructions?.subNumber || 'N/A', "Associated Sub Nos.": leadInstructions?.associatedSubNumbers || 'N/A', "Assigned Officers": leadInstructions?.assignedTo|| 'N/A', "Assigned By": leadInstructions?.assignedBy || 'N/A' }], [90, 170, 170, 82]) + 20;
    currentY = drawStructuredLeadDetails(doc, 50, currentY, leadInstructions);

    if (includeAll || leadInstruction) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Log Summary", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", leadInstructions?.description || 'N/A');

      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Instruction", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", leadInstructions?.summary || 'N/A');

    }

    if (includeAll || leadReturn) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      // doc.font("Helvetica-Bold").fontSize(12).text("Lead Return ID: 1", 50, currentY);
      // currentY += 20;
      // currentY = drawTextBox(doc, 50, currentY, 512, "", "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.");
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Return Details", 50, currentY);
  currentY += 20;

  if (leadReturn?.length > 0) {
    leadReturn.forEach((entry, idx) => {
      doc.font("Helvetica-Bold").fontSize(11).text(`Lead Return ID: ${entry.leadReturnId}`, 50, currentY);
      currentY += 20;

      const dateEntered = formatDate(entry.enteredDate);
      const enteredBy = entry.enteredBy || "N/A";
      const leadText = entry.leadReturnResult || "N/A";

      currentY = drawTable(
        doc,
        50,
        currentY,
        ["Date Entered", "Entered By"],
        [{ "Date Entered": dateEntered, "Entered By": enteredBy }],
        [180, 332]
      ) + 10;

      currentY = drawTextBox(doc, 50, currentY, 512, "Return Summary", leadText);

      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
    });
  } else {
    doc.font("Helvetica").fontSize(11).text("No lead return data available.", 50, currentY);
    currentY += 20;
  }
    }

    if (includeAll || leadPersons) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Person Details", 50, currentY);
      currentY += 20;

      const personTables = [
        ["Date Entered", "Name", "Phone #", "Address"],
        ["Last Name", "First Name", "Middle Initial", "Cell Number"],
        ["Business Name", "Street 1", "Street 2", "Building"],
        ["Apartment", "City", "State", "Zip Code"],
        ["SSN", "Age", "Email", "Occupation"],
        ["Person Type", "Condition", "Caution Type", "Sex"],
        ["Race", "Ethnicity", "Skin Tone", "Eye Color"],
        ["Glasses", "Hair Color", "Height", "Weight"]
      ];
      const personWidths = {
                "Date Entered": 90,
                "Name": 100,
                "Phone #": 100,
                "Address": 222,
              
                "Last Name": 90,
                "First Name": 100,
                "Middle Initial": 100,
                "Cell Number": 222,
              
                "Business Name": 90,
                "Street 1": 100,
                "Street 2": 100,
                "Building": 222,
              
                "Apartment": 90,
                "City": 100,
                "State": 100,
                "Zip Code": 222,
              
                "SSN": 90,
                "Age": 100,
                "Email": 100,
                "Occupation": 222,
              
                "Person Type": 90,
                "Condition": 100,
                "Caution Type": 100,
                "Sex": 222,
              
                "Race": 90,
                "Ethnicity": 100,
                "Skin Tone": 100,
                "Eye Color": 222,
              
                "Glasses": 90,
                "Hair Color": 100,
                "Height": 100,
                "Weight": 222,
              };
              

      const personData = [
        ["03/14/24", "Dan, Hill", "1234567890", "120 3rd St, New York, NY"],
        ["Hill", "Dan", "S.", "1234567890"],
        ["", "", "", ""],
        ["", "", "", ""],
        ["", "20", "", ""],
        ["", "", "", ""],
        ["", "", "", ""],
        ["", "", "", ""]
      ];

      personTables.forEach((headers, i) => {
        if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        const row = {};
        const colWidths = headers.map(header => personWidths[header] || 100);
        headers.forEach((h, j) => row[h] = personData[i][j]);
        currentY = drawTable(doc, 50, currentY, headers, [row], colWidths) + 20;
      });
    }

    if (includeAll || leadVehicles) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Vehicle Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Year", "Make", "Model", "Plate", "Category", "VIN"], [{ "Date Entered": "03/14/24","Year": "2019", "Make": "Toyota", "Model": "Corolla", "Plate": "XYZ1234", "Category": "Bike", "VIN": "" }], [90, 70, 70, 70, 70, 70, 72]) + 20;
      currentY = drawTable(doc, 50, currentY, ["Type", "State", "Primary Color", "Secondary Color","Additional Information"], [{ "Type": "", "State": "NY", "Primary Color": "Blue", "Secondary Color": "Yellow", "Additional Information": "" }], [90, 90, 80, 120, 132]) + 20;

      // currentY = drawHardcodedContent(doc, currentY);
    }

    if (includeAll || leadEnclosures) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Enclosure Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Type", "Enclosure Description"], [{ "Date Entered": "", "Type": "", "Enclosure Description": "" }], [90, 70, 352]) + 20;
    }

    if (includeAll || leadEvidence) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Evidence Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Type", "Collection Date", "Disposed Date","Disposition","Description"], [{ "Date Entered": "", "Type": "", "Collection Date": "", "Disposed Date": "", "Disposition": "", "Description": "" }], [80, 90, 90, 80,80, 92]) + 20;
    }
    if (includeAll || leadPictures) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Picture Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Date Picture Taken","Description"], [{ "Date Entered": "", "Date Picture Taken": "", "Description": "" }], [90, 100, 322]) + 20;
    }

    if (includeAll || leadAudio) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Audio Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Date Audio Recorded","Description"], [{ "Date Entered": "", "Date Audio Recorded": "", "Description": "" }], [90, 120, 302]) + 20;
    }

    if (includeAll || leadVideos) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Video Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Date Video Recorded","Description"], [{ "Date Entered": "", "Date Video Recorded": "", "Description": "" }], [90, 120, 302]) + 20;
    }
    if (includeAll || leadScratchpad) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Notes", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Date Entered", "Entered By","Description"], [{ "Date Entered": "", "Entered By": "", "Description": "" }], [90, 120, 302]) + 20;
    }
    if (includeAll || leadTimeline) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Timeline Details", 50, currentY);
      currentY += 20;
      currentY = drawTable(doc, 50, currentY, ["Event Date", "Event Time Range", "Event Location", "Flags","Event Description"], [{ "Event Date": "", "Event Time Range": "", "Event Location": "", "Flags": "", "Event Description": "" }], [80, 100, 100, 90, 142]) + 20;
    }

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

module.exports = { generateReport };

