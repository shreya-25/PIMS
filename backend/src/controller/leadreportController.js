const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

function drawTable(doc, startX, startY, headers, rows, colWidths, padding = 5) {
  const minRowHeight = 20;
  doc.font("Helvetica-Bold").fontSize(10);
  let currentY = startY;

  let headerHeight = 20;
  let currentX = startX;
  headers.forEach((header, i) => {
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

function drawTextBox(doc, x, y, width, title, content) {
  const padding = 5;
  const titleHeight = title ? 15 : 0;

  doc.font("Helvetica").fontSize(10);
  const contentHeight = doc.heightOfString(content, {
    width: width - 2 * padding,
    align: "justify"
  });

  const boxHeight = titleHeight + contentHeight + 2 * padding;

  doc.save().lineWidth(1).strokeColor("#000").rect(x, y, width, boxHeight).stroke().restore();

  if (title) {
    doc.font("Helvetica-Bold").fontSize(10).text(title, x + padding, y + padding);
  }

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
    leadVideos, leadScratchpad, leadTimeline, selectedReports
  } = req.body;

  const includeAll = selectedReports && selectedReports.FullReport;

  try {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    doc.pipe(res);

    const headerHeight = 80;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#003366");

    const logoHeight = 70;
    const verticalCenterY = (headerHeight - logoHeight) / 2;
    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 10, verticalCenterY, { width: 70, height: 70, align: "left" });

    let currentY = headerHeight - 50;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(14).text("Case: 62345 | Bank Robbery Case", 0, currentY, { align: "center" });
    currentY = doc.y + 5;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text("Lead: 1 | Interview Mr. John", 0, currentY, { align: "center" });
    currentY = doc.y + 20;
    doc.fillColor("black");

    currentY = headerHeight + 20;

    if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }
    doc.font("Helvetica-Bold").fontSize(12).text("Lead Details:", 50, currentY);
    currentY += 20;
    currentY = drawTable(doc, 50, currentY, ["Lead No.", "Origin", "Assigned Date", "Due Date", "Completed Date"], [{ "Lead No.": "1", "Origin": "12345", "Assigned Date": "03/14/24", "Due Date": "03/20/24", "Completed Date": "03/22/24" }], [90, 90, 120, 120, 92]) + 20;
    currentY = drawTable(doc, 50, currentY, ["Sub No.", "Associated Sub Nos.", "Assigned Officers", "Assigned By"], [{ "Sub No.": "SUB-0001", "Associated Sub Nos.": "SUB-000001, SUB-000002", "Assigned Officers": "Officer 90, Officer 24", "Assigned By": "Officer 916" }], [90, 170, 170, 82]) + 20;

    if (includeAll || leadInstruction) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Log Summary", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", "Investigate Mr.John");

      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Instruction", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.");

    }

    if (includeAll || leadReturn) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Return ID: 1", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.");

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

