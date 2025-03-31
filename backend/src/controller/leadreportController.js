const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

function drawTable(doc, startX, startY, headers, rows, colWidths, rowHeight = 20) {
  doc.font("Helvetica-Bold").fontSize(10);
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

  return currentY + rowHeight;
}

// function drawTextBox(doc, x, y, width, height, title, content) {
//   doc.save().lineWidth(1).strokeColor("#ccc").rect(x, y, width, height).stroke().restore();
//   if (title) doc.font("Helvetica-Bold").fontSize(10).text(title, x + 5, y + 5);
//   doc.font("Helvetica").fontSize(9).text(content, x + 5, y + 20, { width: width - 10, align: "justify" });
// }

function drawTextBox(doc, x, y, width, height, title, content) {
  doc
    .save()
    .lineWidth(1)
    .strokeColor("#000") // Use black border
    .rect(x, y, width, height)
    .stroke()
    .restore();
  if (title)
    doc.font("Helvetica-Bold").fontSize(10).text(title, x + 5, y + 5);
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(content, x + 5, y + 20, { width: width - 10, align: "justify" });
}

function generateReport(req, res) {
  const {
    leadInstruction,
    leadReturn,
    leadPersons,
    leadVehicles,
    leadEnclosures,
    leadEvidence,
    leadPictures,
    leadAudio,
    leadVideos,
    leadScratchpad,
    leadTimeline,
  } = req.body;

  try {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    doc.pipe(res);

    

    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, doc.page.width / 2 - 30, 20, { width: 60 });

    doc.moveDown(4);
    doc.font("Helvetica-Bold").fontSize(14).text("Case: 62345 | Bank Robbery Case", { align: "center" });
    doc.font("Helvetica-Bold").fontSize(12).text("Lead: 1 | Interview Mr. John", { align: "center" });

    doc.moveDown().moveTo(50, doc.y).lineTo(562, doc.y).stroke();

    if (leadInstruction) {

    doc.moveDown().font("Helvetica-Bold").fontSize(12).text("Lead Details:");

    const fullWidth = [90, 90, 120, 120, 92];
    drawTable(doc, 50, doc.y + 10,
      ["Lead No.", "Origin", "Assigned Date", "Due Date", "Completed Date"],
      [{ "Lead No.": "1", "Origin": "12345", "Assigned Date": "03/14/24", "Due Date": "03/20/24", "Completed Date": "03/22/24" }],
      fullWidth);

      drawTable(doc, 50, doc.y + 10,
        ["Sub No.", "Associated Sub Nos.", "Assigned  Officers", "Assigned By"],
        [{ "Sub No.": "SUB-0001", "Associated Sub Nos.": "SUB-000001, SUB-000002", "Assigned Officers": "Officer 90, Officer 24", "Assigned By": "Officer 916" }],
        [90, 170, 170, 82]);

    doc.moveDown(1);

    // drawTextBox(doc, 50, doc.y + 10, 512, 80, "Lead Instruction",
    //   "Investigate Mr.John");

      // doc.moveDown().font("Helvetica-Bold").fontSize(12).text("Lead Instruction");
      doc.moveDown().font("Helvetica-Bold").fontSize(12).text("Lead Instruction", 50, doc.y, { align: "left" });

      drawTextBox(doc, 50, doc.y + 10, 512, 80, "", "Investigate Mr.John");


    }

    if (leadReturn) {
    doc.moveDown(6).font("Helvetica-Bold").fontSize(12).text("Lead Return ID: 1");

    drawTextBox(doc, 50, doc.y + 10, 512, 80, "",
      "As part of the Bank Robbery Investigation (Case No. 65734), Officer 915 responded with Officers 1, 2, and 3. The task of interviewing Matthew Jacobs was assigned to Officer 24. During the interview, Jacobs provided valuable information that may assist in furthering this investigation. Additional follow-ups required with Officer 90 and Officer 24 for complete validation.");
    }

    if (leadPersons) {
    doc.moveDown(6).font("Helvetica-Bold").fontSize(10).text("Person Details");
    drawTable(doc, 50, doc.y + 5,
      ["Date Entered", "Name", "Phone #", "Address"],
      [{ "Date Entered": "03/14/24", "Name": "Dan, Hill", "Phone #": "1234567890", "Address": "120 3rd St, New York, NY" }],
      [90, 100, 100, 222]);
      doc.moveDown(1);

      drawTable(doc, 50, doc.y + 5,
        ["Last Name", "First Name", "Middle Initial", "Cell Number"],
        [{ "Last Name": "Hill", "First Name": "Dan", "Middle Initial": "S.", "Cell Number": "1234567890" }],
        [90, 100, 100, 222]);
        doc.moveDown(1);

        drawTable(doc, 50, doc.y + 5,
          ["Business Name", "Street 1", "Street 2", "Building"],
          [{ "Business Name": "", "Street 1": "", "Street 2": "", "Building": "" }],
          [90, 100, 100, 222]);
          doc.moveDown(1);

        }

          // drawTable(doc, 50, doc.y + 5,
          //   ["Apartment", "City", "State", "Zip Code"],
          //   [{ "Apartmente": "", "City": "", "State": "", "Zip Code": "" }],
          //   [90, 100, 100, 222]);
          //   doc.moveDown(1);
            
            
            // doc.moveDown(20);
            // drawTable(doc, 50, doc.y + 5,
            //   ["SSN", "Age", "Email", "Occupation"],
            //   [{ "SSN": "", "Age": "20", "Email": "", "Occupation": "" }],
            //   [90, 100, 100, 222]);

              // drawTable(doc, 50, doc.y + 5,
              //   ["Person Type", "Condition", "Caution Type", "Sex"],
              //   [{ "Person Type": "", "Condition": "", "Caution Type": "", "Sex": "" }],
              //   [90, 100, 100, 222]);
              //   doc.moveDown(1);
              //   drawTable(doc, 50, doc.y + 5,
              //     ["Race", "Ethnicity", "Skin Tone", "Eye Color"],
              //     [{ "Race": "", "Ethnicity": "", "Skin Tone": "", "Eye Color": "" }],
              //     [90, 100, 100, 222]);
              //     doc.moveDown(1);
              //     drawTable(doc, 50, doc.y + 5,
              //       ["Glasses", "Hair Color", "Height", "Weight"],
              //       [{ "Glasses": "", "Hair Color": "", "Height": "", "Weight": "" }],
              //       [90, 100, 100, 222]);
      
  

              
              if (leadVehicles) {
                doc.moveDown(6)
                .font("Helvetica-Bold")
                .fontSize(10)
                .text("Vehicle Details", 50, doc.y, { align: "left" });
    drawTable(doc, 50, doc.y + 5,
      ["Date Entered", "Make", "Model", "Color", "Plate", "State", "VIN"],
      [{ "Date Entered": "03/14/24", "Make": "Toyota", "Model": "Corolla", "Color": "Blue", "Plate": "XYZ1234", "State": "NY", "VIN": "" }],
      [90, 70, 70, 70, 70, 70, 72]);
    }

    if (leadEnclosures) {
      doc.moveDown(6)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Enclosure Details", 50, doc.y, { align: "left" });
drawTable(doc, 50, doc.y + 5,
["Date Entered", "Type", "Enclosure Description"],
[{ "Date Entered": "", "Type": "", "Enclosure Description": ""}],
[90, 70, 352]);
    }

    doc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

module.exports = { generateReport };
