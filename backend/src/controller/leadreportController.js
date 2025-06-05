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

// helper to format just the time portion
function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", {
    hour:   "2-digit",
    minute: "2-digit"
  });
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

    const officersText = Array.isArray(lead.assignedTo) && lead.assignedTo.length > 0
    ? lead.assignedTo.map(o => o.username).join(", ")
    : "N/A";
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

// function drawTextBox(doc, x, y, width, title, content) {
//   const padding = 5;
//   const titleHeight = title ? 15 : 0;
//   doc.strokeColor("#999999");
//   doc.font("Helvetica").fontSize(10);
//   const contentHeight = doc.heightOfString(content, {
//     width: width - 2 * padding,
//     align: "justify"
//   });

//   const boxHeight = titleHeight + contentHeight + 2 * padding;
//   doc.strokeColor("#999999");

//   doc.save().lineWidth(1).strokeColor("#999999").rect(x, y, width, boxHeight).stroke().restore();

//   if (title) {
//     doc.font("Helvetica-Bold").fontSize(10).text(title, x + padding, y + padding);
//   }

//   doc.strokeColor("#999999");
//   doc.font("Helvetica").fontSize(10).text(content, x + padding, y + padding + titleHeight, {
//     width: width - 2 * padding,
//     align: "justify"
//   });

//   return y + boxHeight + 20;
// }

function drawTextBox(doc, x, y, width, title, content) {
  const padding   = 5;
  const fontSize  = 10;
  const bodyFont  = "Helvetica";
  const titleFont = "Helvetica-Bold";
  const topMargin = doc.page.margins.top;
  const bottomY   = doc.page.height - doc.page.margins.bottom;

  // prepare your wrapped lines
  doc.font(bodyFont).fontSize(fontSize);
  const words = content.split(/\s+/);
  const lines = [];
  let line = "";
  for (let w of words) {
    const test = line ? line + " " + w : w;
    if (doc.widthOfString(test) > width - 2 * padding) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  // iterate chunks that fit each page
  let idx = 0, currY = y, first = true;
  while (idx < lines.length) {
    // 1) decide how many lines fit
    let fit = 0;
    // walk forward until we exceed the bottom margin
    while (idx + fit < lines.length) {
      // measure title on first chunk
      const titleH   = first && title
                       ? doc.heightOfString(title, { width: width - 2*padding })
                       : 0;
      // measure these lines as a single block
      const block    = lines.slice(idx, idx + fit + 1).join("\n");
      const textH    = doc.heightOfString(block, { width: width - 2*padding });
      const boxH     = titleH + textH + 2 * padding;
      if (currY + boxH > bottomY) break;
      fit++;
    }
    // if none fit, force at least one to avoid infinite loop
    if (fit === 0) fit = 1;

    // 2) compute exact heights
    const chunkLines = lines.slice(idx, idx + fit);
    const titleH     = first && title
                       ? doc.heightOfString(title, { width: width - 2*padding })
                       : 0;
    const textBlock  = chunkLines.join("\n");
    const textH      = doc.heightOfString(textBlock, { width: width - 2*padding });
    const boxH       = titleH + textH + 2 * padding;

    // 3) draw the box
    doc.save()
       .lineWidth(1)
       .strokeColor("#999999")
       .rect(x, currY, width, boxH)
       .stroke()
       .restore();

    // 4) draw the title + text
    let textY = currY + padding;
    if (first && title) {
      doc.font(titleFont)
         .fontSize(fontSize)
         .text(title, x + padding, textY, { width: width - 2*padding });
      textY += titleH;
    }
    doc.font(bodyFont)
       .fontSize(fontSize)
       .text(textBlock, x + padding, textY, {
         width: width - 2 * padding,
         align: "justify"
       });

    // advance
    idx   += fit;
    first  = false;
    currY += boxH;

    // if there’s more, new page
    if (idx < lines.length) {
      doc.addPage();
      currY = topMargin;
    }
  }

  return currY + padding;
}




function generateReport(req, res) {
  const {
    leadInstruction, leadReturn, leadPersons, leadVehicles,
    leadEnclosures, leadEvidence, leadPictures, leadAudio,
    leadVideos, leadScratchpad, leadTimeline, selectedReports
  } = req.body;

  const includeAll = selectedReports && selectedReports.FullReport;
  //  const pdfUploads   = req.files.pdfFiles   || [];
  // const imageUploads = req.files.imageFiles || [];

  

  try {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=report.pdf");
    doc.pipe(res);

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

    const headerHeight = 80;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#003366");

    const logoHeight = 70;
    const verticalCenterY = (headerHeight - logoHeight) / 2;
    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 10, verticalCenterY, { width: 70, height: 70, align: "left" });

    let currentY = headerHeight - 50;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(14).text(`Case: ${leadInstruction?.caseNo || 'N/A'} | ${leadInstruction?.caseName || 'N/A'}`, 0, currentY, { align: "center" });
    currentY = doc.y + 5;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text(`Lead: ${leadInstruction?.leadNo || 'N/A'} | ${leadInstruction?.description || 'N/A'}`, 0, currentY, { align: "center" });
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
    currentY = drawStructuredLeadDetails(doc, 50, currentY, leadInstruction);

    if (includeAll || leadInstruction) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Log Summary", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", leadInstruction?.description || 'N/A');

      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Instruction", 50, currentY);
      currentY += 20;
      currentY = drawTextBox(doc, 50, currentY, 512, "", leadInstruction?.summary || 'N/A');

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
        doc.font("Helvetica").fontSize(11)
           .text("No person data available.", 50, currentY);
        currentY += 20;
      } else {
        // Section header
        doc.font("Helvetica-Bold").fontSize(12)
           .text("Person Details", 50, currentY);
        currentY += 20;
    
        // How we’ll group fields into small tables
        const personTables = [
          ["Date Entered", "Name", "Phone #", "Address"],
          ["Last Name", "First Name", "Middle Initial", "Suffix"],
          ["Cell Number", "Business Name", "SSN", "Age"],
          ["Email", "Occupation", "Person Type", "Condition"],
          ["Caution Type", "Sex", "Race", "Ethnicity"],
          ["Skin Tone", "Eye Color", "Glasses", "Hair Color"],
          ["Height", "Weight", "Scar", "Tattoo"],
          ["Mark", "Additional Data"]
        ];
        // You can tweak these widths to taste
        const personWidths = {
          "Date Entered": 90, "Name": 100,      "Phone #": 100,    "Address": 222,
          "Last Name": 90,     "First Name": 100,  "Middle Initial": 100,"Suffix": 222,
          "Cell Number": 90,  "Business Name": 100,"SSN": 100,       "Age": 222,
          "Email": 90,        "Occupation": 100,  "Person Type": 100, "Condition": 222,
          "Caution Type": 90, "Sex": 100,          "Race": 100,       "Ethnicity": 222,
          "Skin Tone": 90,     "Eye Color": 100,    "Glasses": 100,    "Hair Color": 222,
          "Height": 90,        "Weight": 100,       "Scar": 100,       "Tattoo": 222,
          "Mark": 80,          "Additional Data": 432
        };
    
        // Helper to pull the right field off your model
        function getPersonValue(person, header) {
          switch (header) {
            case "Date Entered":   return formatDate(person.enteredDate);
            case "Name":           return `${person.lastName||""}, ${person.firstName||""}`.trim();
            case "Phone #":        return person.cellNumber || "";
            case "Address":          return [
              person.address.building,
              person.address.apartment && `Apt ${person.address.apartment}`,
              person.address.street1,
              person.address.street2,
              person.address.city,
              person.address.state,
              person.address.zipCode
            ]
            .filter(Boolean)    // remove undefined or ""
            .join(", ");
            case "Last Name":      return person.lastName || "";
            case "First Name":     return person.firstName || "";
            case "Middle Initial": return person.middleInitial || "";
            case "Suffix":         return person.suffix || "";
            case "Cell Number":    return person.cellNumber || "";
            case "Business Name":  return person.businessName || "";
            case "SSN":            return person.ssn || "";
            case "Age":            return person.age?.toString() || "";
            case "Email":          return person.email || "";
            case "Occupation":     return person.occupation || "";
            case "Person Type":    return person.personType || "";
            case "Condition":      return person.condition || "";
            case "Caution Type":   return person.cautionType || "";
            case "Sex":            return person.sex || "";
            case "Race":           return person.race || "";
            case "Ethnicity":      return person.ethnicity || "";
            case "Skin Tone":      return person.skinTone || "";
            case "Eye Color":      return person.eyeColor || "";
            case "Glasses":        return person.glasses || "";
            case "Hair Color":     return person.hairColor || "";
            case "Height":         return person.height || "";
            case "Weight":         return person.weight || "";
            case "Scar":           return person.scar || "";
            case "Tattoo":         return person.tattoo || "";
            case "Mark":           return person.mark || "";
            case "Additional Data": return (person.additionalData || [])
            .map(d => [d.description, d.details].filter(Boolean).join(": "))
            .join("; ");
            default:               return "";
          }
        }
    
        // Loop through each person object
        leadPersons.forEach((person, pIdx) => {
          // Label each person if you like
          doc.font("Helvetica-Bold").fontSize(11)
             .text(`Person ${pIdx + 1}`, 50, currentY);
          currentY += 15;
    
          // Now draw each mini-table
          personTables.forEach((headers) => {
            // page-break check
            if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              currentY = doc.page.margins.top;
            }
    
            // build one row of data
            const row = {};
            headers.forEach(h => {
              row[h] = getPersonValue(person, h);
            });
    
            // compute column widths
            const colWidths = headers.map(h => personWidths[h] || 100);
    
            // draw it
            currentY = drawTable(doc, 50, currentY, headers, [row], colWidths)
                     + 20;
          });
        });
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
  if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    currentY = doc.page.margins.top;
  }

  // Section header
  doc.font("Helvetica-Bold").fontSize(12)
     .text("Vehicle Details", 50, currentY);
  currentY += 20;

  if (!Array.isArray(leadVehicles) || leadVehicles.length === 0) {
    doc.font("Helvetica").fontSize(11)
       .text("No vehicle data available.", 50, currentY);
    currentY += 20;

  } else {
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
      // Label each vehicle
      doc.font("Helvetica-Bold").fontSize(11)
         .text(`Vehicle ${idx + 1}`, 50, currentY);
      currentY += 15;

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
        currentY = drawTable(doc, 50, currentY, headers, [row], colWidths) + 20;
      });
    });
  }
}


     if (includeAll || leadEnclosures) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Enclosure Details", 50, currentY);
      currentY += 20;

      if (!Array.isArray(leadEnclosures) || leadEnclosures.length === 0) {
        doc
          .font("Helvetica")
          .fontSize(11)
          .text("No enclosure data available.", 50, currentY);
        currentY += 20;
      } else {
        // Draw the “table of summary rows” for each enclosure first:
        const headers = ["Date Entered", "Type", "Description"];
        const widths = [90, 100, 322];
        const rows = leadEnclosures.map((e) => ({
          "Date Entered": formatDate(e.enteredDate),
          "Type": e.type || "",
          "Description": e.enclosureDescription || "",
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;

        // Now loop through each enclosure and embed its single filePath
        for (let i = 0; i < leadEnclosures.length; i++) {
          const enc = leadEnclosures[i];
          const fname = (enc.filename || "").toLowerCase();

          // Only embed if the top‐level “filename” ends with .jpg/.jpeg/.png
          if (
            fname.endsWith(".jpg") ||
            fname.endsWith(".jpeg") ||
            fname.endsWith(".png")
          ) {
            // Use the top‐level “filePath” directly
            const imagePath = path.normalize(enc.filePath);

            if (fs.existsSync(imagePath)) {
              // Page‐break check before drawing a 300px‐high image
              const imageMaxHeight = 300;
              if (
                currentY + imageMaxHeight >
                doc.page.height - doc.page.margins.bottom
              ) {
                doc.addPage();
                currentY = doc.page.margins.top;
              }

              // Draw the image (fit into 300×300 box, maintain aspect ratio)
              doc.image(imagePath, 50, currentY, { fit: [300, 300] });
              currentY += 310; // 300 for the image + ~10px padding

              // Caption under the image
              doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#555555")
                .text(enc.filename, 50, currentY, { width: 300, align: "left" });
              currentY += 20;

              // Reset fill color for subsequent text
              doc.fillColor("black");
            } else {
              // File wasn’t found on disk—draw a red warning
              doc
                .font("Helvetica-Oblique")
                .fontSize(10)
                .fillColor("red")
                .text(`(Missing file on server: ${enc.filename})`, 50, currentY);
              doc.fillColor("black");
              currentY += 20;
            }
          }
        }

        // Space after all enclosure images
        currentY += 20;
      }
    }
    
    // ── Evidence Details ─────────────────────────────────────────
    if (includeAll || leadEvidence) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Evidence Details", 50, currentY);
      currentY += 20;
    
      if (!Array.isArray(leadEvidence) || leadEvidence.length === 0) {
        doc.font("Helvetica").fontSize(11)
           .text("No evidence data available.", 50, currentY);
        currentY += 20;
      } else {
        const headers = ["Date Entered","Type","Collection Date","Disposed Date","Description"];
        const widths  = [80,80,90,90,172];
        const rows    = leadEvidence.map(ev => ({
          "Date Entered":     formatDate(ev.enteredDate),
          "Type":             ev.type || "",
          "Collection Date":  formatDate(ev.collectionDate),
          "Disposed Date":    formatDate(ev.disposedDate),
          "Description":      ev.evidenceDescription || ""
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;
      
         // Now loop through each enclosure and embed its single filePath
        for (let i = 0; i < leadEvidence.length; i++) {
          const enc = leadEvidence[i];
          const fname = (enc.filename || "").toLowerCase();

          // Only embed if the top‐level “filename” ends with .jpg/.jpeg/.png
          if (
            fname.endsWith(".jpg") ||
            fname.endsWith(".jpeg") ||
            fname.endsWith(".png")
          ) {
            // Use the top‐level “filePath” directly
            const imagePath = path.normalize(enc.filePath);

            if (fs.existsSync(imagePath)) {
              // Page‐break check before drawing a 300px‐high image
              const imageMaxHeight = 300;
              if (
                currentY + imageMaxHeight >
                doc.page.height - doc.page.margins.bottom
              ) {
                doc.addPage();
                currentY = doc.page.margins.top;
              }

              // Draw the image (fit into 300×300 box, maintain aspect ratio)
              doc.image(imagePath, 50, currentY, { fit: [300, 300] });
              currentY += 310; // 300 for the image + ~10px padding

              // Caption under the image
              doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#555555")
                .text(enc.filename, 50, currentY, { width: 300, align: "left" });
              currentY += 20;

              // Reset fill color for subsequent text
              doc.fillColor("black");
            } else {
              // File wasn’t found on disk—draw a red warning
              doc
                .font("Helvetica-Oblique")
                .fontSize(10)
                .fillColor("red")
                .text(`(Missing file on server: ${enc.filename})`, 50, currentY);
              doc.fillColor("black");
              currentY += 20;
            }
          }
        }

        // Space after all enclosure images
        currentY += 20;
      }
    }
    // ── Picture Details ─────────────────────────────────────────
    if (includeAll || leadPictures) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Picture Details", 50, currentY);
      currentY += 20;
    
      if (!Array.isArray(leadPictures) || leadPictures.length === 0) {
        doc.font("Helvetica").fontSize(11)
           .text("No picture data available.", 50, currentY);
        currentY += 20;
      } else {
        const headers = ["Date Entered","Date Picture Taken","Description"];
        const widths  = [90,120, 302];
        const rows    = leadPictures.map(p => ({
          "Date Entered":        formatDate(p.enteredDate),
          "Date Picture Taken":  formatDate(p.datePictureTaken),
          "Description":         p.pictureDescription || ""
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;

          // Now loop through each enclosure and embed its single filePath
        for (let i = 0; i < leadPictures.length; i++) {
          const enc = leadPictures[i];
          const fname = (enc.filename || "").toLowerCase();

          // Only embed if the top‐level “filename” ends with .jpg/.jpeg/.png
          if (
            fname.endsWith(".jpg") ||
            fname.endsWith(".jpeg") ||
            fname.endsWith(".png")
          ) {
            // Use the top‐level “filePath” directly
            const imagePath = path.normalize(enc.filePath);

            if (fs.existsSync(imagePath)) {
              // Page‐break check before drawing a 300px‐high image
              const imageMaxHeight = 300;
              if (
                currentY + imageMaxHeight >
                doc.page.height - doc.page.margins.bottom
              ) {
                doc.addPage();
                currentY = doc.page.margins.top;
              }

              // Draw the image (fit into 300×300 box, maintain aspect ratio)
              doc.image(imagePath, 50, currentY, { fit: [300, 300] });
              currentY += 310; // 300 for the image + ~10px padding

              // Caption under the image
              doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#555555")
                .text(enc.filename, 50, currentY, { width: 300, align: "left" });
              currentY += 20;

              // Reset fill color for subsequent text
              doc.fillColor("black");
            } else {
              // File wasn’t found on disk—draw a red warning
              doc
                .font("Helvetica-Oblique")
                .fontSize(10)
                .fillColor("red")
                .text(`(Missing file on server: ${enc.filename})`, 50, currentY);
              doc.fillColor("black");
              currentY += 20;
            }
          }
        }

        // Space after all enclosure images
        currentY += 20;
      }
    }
    
    
    // ── Audio Details ────────────────────────────────────────────
    if (includeAll || leadAudio) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Audio Details", 50, currentY);
      currentY += 20;
    
      if (!Array.isArray(leadAudio) || leadAudio.length === 0) {
        doc.font("Helvetica").fontSize(11)
           .text("No audio data available.", 50, currentY);
        currentY += 20;
      } else {
        const headers = ["Date Entered","Date Audio Recorded","Description"];
        const widths  = [90,120, 302];
        const rows    = leadAudio.map(a => ({
          "Date Entered":         formatDate(a.enteredDate),
          "Date Audio Recorded":  formatDate(a.dateAudioRecorded),
          "Description":          a.audioDescription || ""
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;
      }
    }
    
    // ── Video Details ────────────────────────────────────────────
    if (includeAll || leadVideos) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Video Details", 50, currentY);
      currentY += 20;
    
      if (!Array.isArray(leadVideos) || leadVideos.length === 0) {
        doc.font("Helvetica").fontSize(11)
           .text("No video data available.", 50, currentY);
        currentY += 20;
      } else {
        const headers = ["Date Entered","Date Video Recorded","Description"];
        const widths  = [90,120, 302];
        const rows    = leadVideos.map(v => ({
          "Date Entered":         formatDate(v.enteredDate),
          "Date Video Recorded":  formatDate(v.dateVideoRecorded),
          "Description":          v.videoDescription || ""
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;
      }
    }
    
    // ── Lead Notes (Scratchpad) ─────────────────────────────────
    if (includeAll || leadScratchpad) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Notes", 50, currentY);
      currentY += 20;
    
      if (!Array.isArray(leadScratchpad) || leadScratchpad.length === 0) {
        doc.font("Helvetica").fontSize(11)
           .text("No notes available.", 50, currentY);
        currentY += 20;
      } else {
        const headers = ["Date Entered","Return Id","Description"];
        const widths  = [90,120, 302];
        const rows    = leadScratchpad.map(n => ({
          "Date Entered": formatDate(n.enteredDate),
          "Return Id": n.leadReturnId  || "",
          "Description":  n.text || ""
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;
      }
    }
    
    // ── Timeline Details ─────────────────────────────────────────
    if (includeAll || leadTimeline) {
      if (currentY + 50 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); currentY = doc.page.margins.top;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("Timeline Details", 50, currentY);
      currentY += 20;
    
      if (!Array.isArray(leadTimeline) || leadTimeline.length === 0) {
        doc.font("Helvetica").fontSize(11)
           .text("No timeline data available.", 50, currentY);
        currentY += 20;
      } else {
        const headers = ["Event Date","Time Range","Location","Flags","Description"];
        const widths  = [80,100,100, 80, 142];
        const rows    = leadTimeline.map(t => ({
          "Event Date":   formatDate(t.eventDate),
         "Time Range":  `${formatTime(t.eventStartTime)} – ${formatTime(t.eventEndTime)}`,

          "Location":     t.eventLocation || "",
          "Flags":        Array.isArray(t.timelineFlag) ? t.timelineFlag.join(", ") : "",
          "Description":  t.eventDescription || ""
        }));
        currentY = drawTable(doc, 50, currentY, headers, rows, widths) + 20;
      }
    }

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

module.exports = { generateReport };

