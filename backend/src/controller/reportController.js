// const PDFDocument = require("pdfkit");
// const path = require("path");
// const fs = require("fs");
// const { PassThrough } = require("stream");

// // const sectionGap = 20; // Gap between sections
// const minRowHeight = 30; // Minimum height for table rows
// const rowPadding = 8;    // Extra padding for each row

// // --- Table Drawing Helper Functions ---
// function drawTableHeader(doc, startX, headers, columnWidths) {
//   let x = startX;
//   let y = doc.y;
//   doc.font("Helvetica-Bold").fontSize(10);

//   // Calculate adaptive header height based on text
//   let headerHeight = 0;
//   headers.forEach((header, i) => {
//     const h = doc.heightOfString(header, { width: columnWidths[i] - 4, align: "left" });
//     if (h > headerHeight) headerHeight = h;
//   });
//   headerHeight = Math.max(headerHeight, minRowHeight) + rowPadding;

//   headers.forEach((header, i) => {
//     doc.rect(x, y, columnWidths[i], headerHeight).stroke();
//     doc.text(header, x + 2, y + 2, {
//       width: columnWidths[i] - 4,
//       align: "left"
//     });
//     x += columnWidths[i];
//   });
//   doc.y = y + headerHeight;
//   return headerHeight;
// }

// function drawTableRow(doc, startX, headers, row, columnWidths, rowHeight) {
//   let x = startX;
//   let y = doc.y;
//   doc.font("Helvetica").fontSize(10);
//   headers.forEach((header, i) => {
//     const text = row[header] !== undefined ? row[header].toString() : "";
//     doc.rect(x, y, columnWidths[i], rowHeight).stroke();
//     doc.text(text, x + 2, y + 2, {
//       width: columnWidths[i] - 4,
//       align: "left"
//     });
//     x += columnWidths[i];
//   });
//   doc.y = y + rowHeight;
//   return rowHeight;
// }

// function drawDynamicTable(doc, startX, headers, rows, columnWidths) {
//   // Add a new page if necessary
//   if (doc.y + minRowHeight > doc.page.height - doc.options.margin) {
//     doc.addPage();
//   }
//   // Draw the header row adaptively.
//   drawTableHeader(doc, startX, headers, columnWidths);
//   rows.forEach(row => {
//     let maxHeight = minRowHeight;
//     headers.forEach((header, i) => {
//       const text = row[header] !== undefined ? row[header].toString() : "";
//       const h = doc.heightOfString(text, { width: columnWidths[i] - 4, align: "left" });
//       if (h > maxHeight) maxHeight = h;
//     });
//     maxHeight += rowPadding;
//     if (doc.y + maxHeight > doc.page.height - doc.options.margin) {
//       doc.addPage();
//       drawTableHeader(doc, startX, headers, columnWidths);
//     }
//     drawTableRow(doc, startX, headers, row, columnWidths, maxHeight);
//   });
//   return doc.y;
// }

// // This helper renders the given data as a table
// function renderSectionTable(doc, title, data, startX, pageWidth) {
//   // Section title with underline.
//   doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
//   doc.moveDown(0.5);

//   // If data is a single object, wrap it in an array.
//   if (typeof data === "object" && data !== null && !Array.isArray(data)) {
//     data = [data];
//   }
//   if (Array.isArray(data)) {
//     if (data.length === 0) {
//       doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
//       doc.moveDown(1);
//       return;
//     }
//     // Compute the union of keys for all records.
//     let headers = [];
//     data.forEach(record => {
//       Object.keys(record).forEach(key => {
//         if (!headers.includes(key)) {
//           headers.push(key);
//         }
//       });
//     });
//     const availableWidth = pageWidth - startX * 2;
//     const colWidth = availableWidth / headers.length;
//     const columnWidths = Array(headers.length).fill(colWidth);
//     drawDynamicTable(doc, startX, headers, data, columnWidths);
//   } else {
//     doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
//   }
//   doc.moveDown(1);
// }

// // New function to render section data as bullet points instead of table
// function renderSectionBulletPoints(doc, title, data, startX) {
//   // Section title with underline
//   doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
//   doc.moveDown(0.5);

//   if (!Array.isArray(data) || data.length === 0) {
//     doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
//     doc.moveDown(1);
//     return;
//   }

//   // Process each record as a set of bullet points
//   data.forEach((record, index) => {
//     // Add a new page if we're close to the bottom
//     if (doc.y > doc.page.height - doc.options.margin - 100) {
//       doc.addPage();
//     }

//     // Record header (e.g., Person #1, Person #2)
//     doc.font("Helvetica-Bold").fontSize(10)
//        .text(`${title.replace("Lead ", "")} #${index + 1}:`, startX, doc.y);
//     doc.moveDown(0.2);
    
//     // List all fields as bullet points
//     doc.font("Helvetica").fontSize(10);
//     Object.entries(record).forEach(([key, value]) => {
//       // Skip rendering the leadReturnId and empty values
//       if (key !== 'leadReturnId' && value !== undefined && value !== null && value !== '') {
//         // Format arrays nicely
//         let displayValue = Array.isArray(value) ? value.join(", ") : value;
        
//         // Check if we need a page break
//         if (doc.y > doc.page.height - doc.options.margin - 20) {
//           doc.addPage();
//         }
        
//         // Add the bullet point
//         doc.text(`• ${key}: ${displayValue}`, startX + 20, doc.y);
//         doc.moveDown(0.2);
//       }
//     });
    
//     // Add separator between records (if not the last one)
//     if (index < data.length - 1) {
//       doc.moveDown(0.5);
//       doc.text("――――――――――――――――――――――――――――", startX, doc.y);
//       doc.moveDown(0.5);
//     }
//   });
  
//   doc.moveDown(1);
// }

// function renderKeyValueTable(doc, title, data, startX, pageWidth) {
//   // Section title with underline
//   doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
//   doc.moveDown(0.5);

//   // If data is empty or invalid, show "No data available"
//   if (!data || Object.keys(data).length === 0) {
//     doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
//     doc.moveDown(1);
//     return;
//   }

//   // Convert object into array of { Key, Value }
//   const rows = Object.entries(data).map(([key, value]) => {
//     let displayValue = Array.isArray(value) ? value.join(", ") : value;
//     if (displayValue == null || displayValue === "") displayValue = "N/A";
//     return { Key: key, Value: displayValue };
//   });

//   // Our table has exactly 2 columns: "Key" and "Value"
//   const headers = ["Key", "Value"];
//   const availableWidth = pageWidth - startX * 2;
//   const colWidth = availableWidth / 2;
//   const columnWidths = [colWidth, colWidth];

//   // Reuse your existing dynamic table function
//   drawDynamicTable(doc, startX, headers, rows, columnWidths);

//   doc.moveDown(1);
// }

// function renderReturnsTable(doc, title, returnsData, startX, pageWidth) {
//   // Section title
//   doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
//   doc.moveDown(0.5);

//   // If no returns, show a simple message
//   if (!Array.isArray(returnsData) || returnsData.length === 0) {
//     doc.font("Helvetica").fontSize(10).text("No lead returns available.", startX, doc.y);
//     doc.moveDown(1);
//     return;
//   }

//   // We define the columns we want in a certain order
//   const headers = ["Return ID", "Date Entered", "Entered By", "Results", "Access"];

//   // Transform your returns array to match these columns
//   const rows = returnsData.map(item => ({
//     "Return ID": item.leadReturnId || "",
//     "Date Entered": item.dateEntered || "",
//     "Entered By": item.enteredBy || "",
//     "Results": item.leadReturn || "",      // or item.results
//     "Access": item.access || "Case Manager" // or however you store it
//   }));

//   // We can reuse your existing dynamic table code
//   const availableWidth = pageWidth - startX * 2;
//   const colWidth = availableWidth / headers.length;
//   const columnWidths = Array(headers.length).fill(colWidth);

//   drawDynamicTable(doc, startX, headers, rows, columnWidths);

//   doc.moveDown(1);
// }




// // This helper renders key-value pairs for a section
// // function renderKeyValueSection(doc, title, data, startX) {
// //   doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
// //   doc.moveDown(0.5);
  
// //   if (!data || Object.keys(data).length === 0) {
// //     doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
// //     doc.moveDown(1);
// //     return;
// //   }
  
// //   doc.font("Helvetica").fontSize(10);
// //   Object.entries(data).forEach(([key, value]) => {
// //     if (value !== undefined && value !== null && value !== '') {
// //       doc.text(`${key}: ${value}`, startX, doc.y);
// //       doc.moveDown(0.3);
// //     }
// //   });
// //   doc.moveDown(1);
// // }

// // --- Main Report Generation Function ---
// const generateReport = async (req, res) => {
//   console.log(`Report generation requested by ${req.body.user || 'unknown user'} at: ${new Date().toLocaleString()}`);
//   const {
//     leadInstruction,
//     leadReturn,
//     leadPersons,
//     leadVehicles,
//     leadEnclosures,
//     leadEvidence,
//     leadPictures,
//     leadAudio,
//     leadVideos,
//     leadScratchpad,
//     leadTimeline,
//   } = req.body;

//   try {
//     const doc = new PDFDocument({ margin: 50 });
    
//     // Create a PassThrough stream to tee the PDF to both file and response.
//     const passThrough = new PassThrough();
//     const timestamp = new Date().toISOString().replace(/[\W]/g, "");
//     const username = req.body.user || "system";
//     const outputPath = path.resolve(`reports/report_${username}_${timestamp}.pdf`);
    
//     // Ensure reports directory exists
//     const reportsDir = path.resolve("reports");
//     if (!fs.existsSync(reportsDir)) {
//       fs.mkdirSync(reportsDir, { recursive: true });
//     }
    
//     const writeStream = fs.createWriteStream(outputPath);
    
//     // Pipe the PDF document to our PassThrough stream.
//     doc.pipe(passThrough);
//     passThrough.pipe(writeStream);
//     passThrough.pipe(res);

//     // --- Header with Timestamp and Logo ---
//     const reportDate = req.body.reportTimestamp || new Date().toLocaleString();
//     doc.font("Helvetica").fontSize(10).text(`Report generated: ${reportDate}`, doc.options.margin, doc.options.margin);
//     doc.font("Helvetica").fontSize(10).text(`Generated by: ${username}`, doc.options.margin, doc.y + 15);
    
//     const logoPath = path.resolve("src/assets/newpolicelogo.png");
//     if (fs.existsSync(logoPath)) {
//       const logoWidth = 100;
//       const logoX = doc.page.width - doc.options.margin - logoWidth;
//       const logoY = doc.options.margin;
//       doc.image(logoPath, logoX, logoY, { width: logoWidth });
//     }

//     // --- Centered Title ---
//     doc.moveDown(3);
//     doc.font("Helvetica-Bold").fontSize(20).text("Case Report", { align: "center", underline: true });
//     doc.moveDown(1);

//     const startX = doc.options.margin;
//     const pageWidth = doc.page.width;

//     // --- Lead Details Section ---
//     // --- Lead Details Section ---
// if (leadInstruction) {
//   renderKeyValueTable(doc, "Lead Details", leadInstruction, startX, pageWidth);
// }


//     // --- Loop Through Each Lead Return ---
//     if (leadReturn && Array.isArray(leadReturn) && leadReturn.length > 0) {
//       leadReturn.forEach((returnRecord, returnIndex) => {
//         // Add a page break between returns if not the first one
//         if (returnIndex > 0) {
//           doc.addPage();
//         }
        
//         // Render return header with return-specific details.
//         doc.font("Helvetica-Bold").fontSize(14)
//            .text(`Return #${returnIndex + 1}`, startX, doc.y, { underline: true });
//         doc.moveDown(0.5);
        
//         // Display all fields from the return record
//         doc.font("Helvetica-Bold").fontSize(12).text("Return Details", startX, doc.y, { underline: true });
//         doc.moveDown(0.5);
//         doc.font("Helvetica").fontSize(10);
        
//         Object.entries(returnRecord).forEach(([key, value]) => {
//           if (value !== undefined && value !== null && value !== '') {
//             doc.text(`${key}: ${value}`, { align: "left" });
//           }
//         });
//         doc.moveDown(1);

//         // Filter related records by the associated leadReturnId.
//         const relatedPersons = (leadPersons || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedVehicles = (leadVehicles || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedEnclosures = (leadEnclosures || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedEvidence = (leadEvidence || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedPictures = (leadPictures || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedAudio = (leadAudio || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedVideos = (leadVideos || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedScratchpad = (leadScratchpad || []).filter(item => item.leadReturnId === returnRecord.id);
//         const relatedTimeline = (leadTimeline || []).filter(item => item.leadReturnId === returnRecord.id);

//         // Render each section - Person and Vehicle as bullet points, others as tables
//         if (relatedPersons.length) {
//           // Using bullet points for persons
//           const enhancedPersons = relatedPersons.map(person => {
//             return {
//               ...person,
//               // Include any fields that might be missing but are present in the UI
//               dateEntered: person.dateEntered || '',
//               lastName: person.lastName || '',
//               firstName: person.firstName || '',
//               mi: person.mi || '',
//               suffix: person.suffix || '',
//               cellNumber: person.cellNumber || '',
//               businessName: person.businessName || '',
//               street1: person.street1 || '',
//               street2: person.street2 || '',
//               building: person.building || '',
//               apartment: person.apartment || '',
//               city: person.city || '',
//               state: person.state || '',
//               zipCode: person.zipCode || '',
//               ssn: person.ssn || '',
//               age: person.age || '',
//               email: person.email || '',
//               occupation: person.occupation || '',
//               personType: person.personType || '',
//               condition: person.condition || '',
//               cautionType: person.cautionType || '',
//               sex: person.sex || '',
//               race: person.race || '',
//               ethnicity: person.ethnicity || '',
//               skinTone: person.skinTone || '',
//               eyeColor: person.eyeColor || '',
//               glasses: person.glasses || '',
//               hairColor: person.hairColor || '',
//               height: person.height || '',
//               weight: person.weight || '',
//               miscInfo: person.miscInfo || ''
//             };
//           });
//           renderSectionBulletPoints(doc, "Lead Persons", enhancedPersons, startX);
//         }
        
//         if (relatedVehicles.length) {
//           // Using bullet points for vehicles
//           const enhancedVehicles = relatedVehicles.map(vehicle => {
//             return {
//               ...vehicle,
//               dateEntered: vehicle.dateEntered || '',
//               year: vehicle.year || '',
//               make: vehicle.make || '',
//               model: vehicle.model || '',
//               color: vehicle.color || '',
//               vin: vehicle.vin || '',
//               plate: vehicle.plate || '',
//               state: vehicle.state || '',
//               description: vehicle.description || '',
//               vehicleType: vehicle.vehicleType || '',
//               condition: vehicle.condition || '',
//               location: vehicle.location || '',
//               registeredOwner: vehicle.registeredOwner || '',
//               ownerAddress: vehicle.ownerAddress || '',
//               insurance: vehicle.insurance || '',
//               policyNumber: vehicle.policyNumber || '',
//               notes: vehicle.notes || ''
//             };
//           });
//           renderSectionBulletPoints(doc, "Lead Vehicles", enhancedVehicles, startX);
//         }
        
//         // The remaining sections use tables
//         if (relatedEnclosures.length) {
//           renderSectionTable(doc, "Lead Enclosures", relatedEnclosures, startX, pageWidth);
//         }
        
//         if (relatedEvidence.length) {
//           renderSectionTable(doc, "Lead Evidence", relatedEvidence, startX, pageWidth);
//         }
        
//         if (relatedPictures.length) {
//           renderSectionTable(doc, "Lead Pictures", relatedPictures, startX, pageWidth);
//         }
        
//         if (relatedAudio.length) {
//           renderSectionTable(doc, "Lead Audio", relatedAudio, startX, pageWidth);
//         }
        
//         if (relatedVideos.length) {
//           renderSectionTable(doc, "Lead Videos", relatedVideos, startX, pageWidth);
//         }
        
//         if (relatedScratchpad.length) {
//           renderSectionTable(doc, "Lead Scratchpad", relatedScratchpad, startX, pageWidth);
//         }
        
//         if (relatedTimeline.length) {
//           renderSectionTable(doc, "Lead Timeline", relatedTimeline, startX, pageWidth);
//         }
//       });
//     } 

//     // --- Report Footer ---
//     doc.font("Helvetica").fontSize(8);
//     doc.text(
//       `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} by ${username}`,
//       startX,
//       doc.page.height - doc.options.margin - 20
//     );
//     doc.text(`File: ${outputPath}`, startX, doc.page.height - doc.options.margin - 10);

//     doc.end();
    
//     console.log(`Report successfully generated: ${outputPath}`);
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({ error: "Failed to generate report.", details: error.message });
//   }
// };

// // --- Test Function to Generate a Dummy Report ---
// const generateTestReport = async (req, res) => {
//   console.log(`Test PDF generation requested at: ${new Date().toLocaleString()}`);
//   const dummyData = {
//     user: "rushilpatel21",  // Current user's login
//     reportTimestamp: "2025-03-03 12:41:29",  // Current timestamp
//     leadInstruction: {
//       leadNumber: "16",
//       leadOrigin: "7",
//       incidentNumber: "C000006",
//       subNumber: "C0000045",
//       associatedSubNumbers: ["SUB-000001", "SUB-000002", "SUB-000003"],
//       assignedDate: "09/29/24",
//       leadSummary: "Interview Mr. John",
//       assignedBy: "Officer 5",
//       leadDescription: "Interview Mr. John to find out where he was on Saturday 09/25",
//       assignedOfficer: ["Officer 1", "Officer 2"],
//     },
//     leadReturns: [
//       { id: 1, dateEntered: "12/01/2024", enteredBy: "Officer 916", results: "Returned item A", status: "Completed", notes: "Follow-up required" },
//       { id: 2, dateEntered: "12/02/2024", enteredBy: "Officer 917", results: "Returned item B", status: "In Progress", notes: "No additional comments" },
//       { id: 3, dateEntered: "12/03/2024", enteredBy: "Officer 918", results: "Returned item C", status: "Pending", notes: "Awaiting confirmation" },
//     ],
//     leadPersons: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "01/01/2024", 
//         lastName: "Doe", 
//         firstName: "John", 
//         mi: "A", 
//         suffix: "Jr", 
//         cellNumber: "123-456-7890", 
//         businessName: "ABC Corp", 
//         street1: "123 Main St", 
//         street2: "Apt 4B", 
//         building: "Tower B", 
//         apartment: "4B", 
//         city: "New York", 
//         state: "NY", 
//         zipCode: "10001",
//         ssn: "123-45-6789",
//         age: "42",
//         email: "john.doe@example.com",
//         occupation: "Software Engineer",
//         personType: "Witness",
//         condition: "Unharmed",
//         cautionType: "None",
//         sex: "Male",
//         race: "Caucasian",
//         ethnicity: "Non-Hispanic",
//         skinTone: "Fair",
//         eyeColor: "Blue",
//         glasses: "Yes",
//         hairColor: "Brown",
//         height: "6'1\"",
//         weight: "185 lbs",
//         miscInfo: "Has a small scar on left cheek"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "01/05/2024", 
//         lastName: "Smith", 
//         firstName: "Jane", 
//         mi: "B", 
//         suffix: "", 
//         cellNumber: "987-654-3210", 
//         businessName: "XYZ Inc", 
//         street1: "456 Elm St", 
//         street2: "", 
//         building: "", 
//         apartment: "7C", 
//         city: "Los Angeles", 
//         state: "CA", 
//         zipCode: "90001",
//         ssn: "987-65-4321",
//         age: "35",
//         email: "jane.smith@example.com",
//         occupation: "Attorney",
//         personType: "Suspect",
//         condition: "Unharmed",
//         cautionType: "Flight Risk",
//         sex: "Female",
//         race: "Caucasian",
//         ethnicity: "Hispanic",
//         skinTone: "Medium",
//         eyeColor: "Brown",
//         glasses: "No",
//         hairColor: "Black",
//         height: "5'6\"",
//         weight: "135 lbs",
//         miscInfo: "Fluent in Spanish"
//       },
//     ],
//     leadVehicles: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "01/01/2024", 
//         year: "2023", 
//         make: "Honda", 
//         model: "Accord", 
//         color: "Blue", 
//         vin: "1HGCV1F34NA123456", 
//         plate: "XYZ-1234", 
//         state: "NY",
//         description: "4-door sedan with tinted windows",
//         vehicleType: "Passenger Car",
//         condition: "Excellent",
//         location: "Owner's residence",
//         registeredOwner: "John Doe",
//         ownerAddress: "123 Main St, New York, NY",
//         insurance: "State Farm",
//         policyNumber: "SF123456789",
//         notes: "Vehicle was recently seen at the crime scene"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "01/05/2024", 
//         year: "2022", 
//         make: "Toyota", 
//         model: "Camry", 
//         color: "Black", 
//         vin: "4T1BF1FK5NU654321", 
//         plate: "ABC-5678", 
//         state: "CA",
//         description: "4-door sedan with roof rack",
//         vehicleType: "Passenger Car",
//         condition: "Good",
//         location: "Parking garage at 100 Broadway",
//         registeredOwner: "Jane Smith",
//         ownerAddress: "456 Elm St, Los Angeles, CA",
//         insurance: "Geico",
//         policyNumber: "GC987654321",
//         notes: "Vehicle has a dent on the rear bumper"
//       },
//     ],
//     leadEnclosures: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "12/01/2024", 
//         type: "Report", 
//         enclosure: "Incident Report",
//         description: "Initial incident report filed by Officer Johnson",
//         source: "Police Department",
//         location: "Central Records",
//         notes: "Contains initial witness statements"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "12/03/2024", 
//         type: "Evidence", 
//         enclosure: "Photo Evidence",
//         description: "Photos taken at the crime scene",
//         source: "Forensic Team",
//         location: "Evidence Locker B",
//         notes: "Includes photos of tire marks and footprints"
//       },
//     ],
//     leadEvidence: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "12/01/2024", 
//         type: "Physical", 
//         collectionDate: "12/01/2024", 
//         disposedDate: "12/03/2024", 
//         disposition: "Stored",
//         description: "Knife found at the scene",
//         collectedBy: "Officer Johnson",
//         location: "Evidence Locker A, Shelf 3",
//         chainOfCustody: "Officer Johnson → Evidence Tech Smith",
//         notes: "Fingerprints visible on handle"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "12/02/2024",
//         type: "Digital", 
//         collectionDate: "12/02/2024", 
//         disposedDate: "12/04/2024", 
//         disposition: "Archived",
//         description: "Security camera footage",
//         collectedBy: "Tech Specialist Davis",
//         location: "Digital Evidence Server",
//         chainOfCustody: "Tech Davis → Digital Forensics",
//         notes: "Shows suspect entering the building at 10:15 PM"
//       },
//     ],
//     leadPictures: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "2024-12-01", 
//         datePictureTaken: "2024-11-25", 
//         description: "Crime scene picture", 
//         image: "/Materials/pict1.jpeg",
//         photographer: "Officer Wilson",
//         location: "123 Main Street, front entrance",
//         caption: "Main entrance where forced entry occurred",
//         notes: "Visible damage to door frame"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "2024-12-02", 
//         datePictureTaken: "2024-11-26", 
//         description: "Vehicle involved", 
//         image: "/Materials/pict2.jpg",
//         photographer: "Officer Garcia",
//         location: "Parking lot at 100 Oak Street",
//         caption: "Suspect vehicle identified by witness",
//         notes: "License plate clearly visible"
//       },
//     ],
//     leadAudio: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "12/01/2024", 
//         dateAudioRecorded: "12/01/2024", 
//         description: "Witness interview", 
//         audioSrc: "/assets/sample-audio.mp3",
//         recordedBy: "Detective Williams",
//         duration: "23:45",
//         participants: "Detective Williams, John Smith (witness)",
//         location: "Precinct Interview Room 2",
//         notes: "Witness describes seeing a blue sedan leaving the scene"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "12/02/2024", 
//         dateAudioRecorded: "12/02/2024", 
//         description: "Crime scene recording", 
//         audioSrc: "/assets/sample-audio2.mp3",
//         recordedBy: "Officer Garcia",
//         duration: "05:17",
//         participants: "Officer Garcia, Forensic Team",
//         location: "Crime Scene",
//         notes: "Ambient sounds and team discussion during evidence collection"
//       },
//     ],
//     leadVideos: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "12/01/2024", 
//         dateVideoRecorded: "12/01/2024", 
//         description: "Surveillance video", 
//         videoSrc: `${process.env.PUBLIC_URL}/Materials/video1.mp4`,
//         recordedBy: "Officer Thompson",
//         duration: "14:22",
//         participants: "N/A (surveillance footage)",
//         location: "Bank ATM camera",
//         notes: "Shows suspect approaching ATM at 22:14"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "12/02/2024", 
//         dateVideoRecorded: "12/02/2024", 
//         description: "Interview recording", 
//         videoSrc: `${process.env.PUBLIC_URL}/Materials/video2.mp4`,
//         recordedBy: "Detective Rogers",
//         duration: "45:17",
//         participants: "Detective Rogers, Jane Smith (witness)",
//         location: "Interview Room 3",
//         notes: "Witness provides detailed account of events leading up to incident"
//       },
//     ],
//     leadScratchpad: [
//       { 
//         leadReturnId: 1, 
//         dateEntered: "12/01/2024", 
//         enteredBy: "John Smith", 
//         text: "Initial case observations: Appears to be related to previous burglaries in the area based on MO.",
//         category: "Investigation Notes",
//         priority: "Medium",
//         tags: "burglary, pattern, MO"
//       },
//       { 
//         leadReturnId: 2, 
//         dateEntered: "12/02/2024", 
//         enteredBy: "Jane Doe", 
//         text: "Follow-up notes: Need to check alibi with the employer and verify security footage timestamps.",
//         category: "Follow-up Tasks",
//         priority: "High",
//         tags: "alibi, verification, follow-up"
//       },
//     ],
//     leadTimeline: [
//       { 
//         leadReturnId: 1, 
//         date: "01/01/2024", 
//         timeRange: "10:30 AM - 12:00 PM", 
//         location: "123 Main St, NY", 
//         description: "Suspect left scene", 
//         flags: ["High Priority"],
//         participants: "John Doe, Jane Smith",
//         evidence: "CCTV footage #E12345",
//         notes: "Multiple witnesses confirmed timing"
//       },
//       { 
//         leadReturnId: 2, 
//         date: "01/05/2024", 
//         timeRange: "2:00 PM - 3:30 PM", 
//         location: "456 Elm St, CA", 
//         description: "Suspect headed to airport", 
//         flags: ["Follow-up Required"],
//         participants: "Mike Johnson",
//         evidence: "Taxi receipt #R67890",
//         notes: "Confirmed by taxi company records"
//       },
//     ],
//   };
  
//   // Set the user and timestamp fields to the current values
//   dummyData.user = req.body.user || "rushilpatel21";  // Use the provided user or default
//   dummyData.reportTimestamp = "2025-03-03 12:46:03"; // Current timestamp from the request
  
//   req.body = dummyData;
//   return generateReport(req, res);
// };

// // --- Export the functions ---
// module.exports = { 
//   generateReport, 
//   generateTestReport 
// };

const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { PassThrough } = require("stream");

// Adjust these constants to tweak layout
const PAGE_MARGIN = 50;
const HEADER_HEIGHT = 50;
const BOX_PADDING = 10;

// Helper to draw a thin gray line
function drawLine(doc, x1, y1, x2, y2, color = "#aaa") {
  doc
    .strokeColor(color)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke();
}

// Helper: draws the top header with “User Login”, logo, and case/lead info
function drawCustomHeader(doc, username, caseText, leadText, logoPath) {
  // “User Login” in top-left
  const startX = doc.x;
  const startY = doc.y;

  doc.font("Helvetica").fontSize(10).text(username, startX, startY);
  const userLoginBottom = doc.y; // track where "User Login" text ended

  // Optionally draw a horizontal line under "User Login"
  drawLine(doc, startX, userLoginBottom + 2, doc.page.width - PAGE_MARGIN, userLoginBottom + 2);

  // Place the logo below “User Login”
  const logoX = startX;
  let logoY = userLoginBottom + 10;
  const logoWidth = 60;
  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, logoX, logoY, { width: logoWidth });
  }

  // Centered case/lead text
  // Move doc.y down so it doesn’t overlap the logo
  doc.y = userLoginBottom + 5; // or logoY if you want them at the same level
  // We can shift the text down further if the logo is taller
  const nextLineY = logoY + 70; // 60px for logo + 10px spacing
  if (doc.y < nextLineY) {
    doc.y = nextLineY;
  }

  // “Case: 62345 | Bank Robbery Case”
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(caseText, { align: "center" });

  // “Lead: 1 | Interview Mr. John”
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(leadText, { align: "center" });

  // Horizontal line under the case/lead text
  const lineY = doc.y + 5;
  drawLine(doc, PAGE_MARGIN, lineY, doc.page.width - PAGE_MARGIN, lineY);

  // Move down a bit before the next section
  doc.moveDown(1);
}

// Draw a gray box (like a panel) for “Lead Details” or other sections
function drawBoxedSection(doc, x, y, width, height, title) {
  // Draw a light gray rectangle
  doc
    .save()
    .lineWidth(1)
    .strokeColor("#cccccc")
    .rect(x, y, width, height)
    .stroke();

  // Optional title text inside the box’s top-left
  if (title) {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#000000")
      .text(title, x + BOX_PADDING, y + BOX_PADDING);
  }

  doc.restore();
}

// Simple table drawer (column-based). This version is more manual to replicate your screenshot
function drawSimpleTable(doc, startX, startY, headers, rows, columnWidths) {
  doc.font("Helvetica-Bold").fontSize(10);

  // Table header
  let currentX = startX;
  let currentY = startY;
  const rowHeight = 20;

  headers.forEach((header, i) => {
    doc.rect(currentX, currentY, columnWidths[i], rowHeight).stroke();
    doc.text(header, currentX + 5, currentY + 5, {
      width: columnWidths[i] - 10,
      align: "left",
    });
    currentX += columnWidths[i];
  });

  // Table rows
  doc.font("Helvetica").fontSize(10);
  rows.forEach((row) => {
    currentY += rowHeight;
    currentX = startX;
    headers.forEach((header, i) => {
      const cellText = row[header] || "";
      doc.rect(currentX, currentY, columnWidths[i], rowHeight).stroke();
      doc.text(cellText, currentX + 5, currentY + 5, {
        width: columnWidths[i] - 10,
        align: "left",
      });
      currentX += columnWidths[i];
    });
  });

  // Return the Y position after drawing the table
  return currentY + rowHeight;
}

const generateReport = async (req, res) => {
  try {
    // Extract fields from request
    const {
      leadInstruction,
      leadReturn,
      leadPersons,
      leadVehicles,
      // If you have caseNo, caseName, leadNo, leadName in the request, extract them here:
      caseNo,
      caseName,
      leadNo,
      leadName,
    } = req.body;

    // Create the PDF doc
    const doc = new PDFDocument({ margin: PAGE_MARGIN });
    const passThrough = new PassThrough();
    const timestamp = new Date().toISOString().replace(/[\W]/g, "");
    const username = req.body.user || "system";
    const outputPath = path.resolve(`reports/report_${username}_${timestamp}.pdf`);

    // Ensure “reports” folder exists
    const reportsDir = path.resolve("reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(passThrough);
    passThrough.pipe(writeStream);
    passThrough.pipe(res);

    // 1) Draw the custom header
    const logoPath = path.resolve("src/assets/newpolicelogo.png");
    const caseText = `Case: ${caseNo || "62345"} | ${caseName || "Bank Robbery Case"}`;
    const leadText = `Lead: ${leadNo || "1"} | ${leadName || "Interview Mr. John"}`;
    drawCustomHeader(doc, "User Login", caseText, leadText, logoPath);

    // 2) Draw the “Lead Details” box
    // We’ll create a fixed-height box that shows:
    //   - Assigned Officers, Assigned Date, Completed Date, etc.
    //   - Then inside that box we also show the lead instruction text in a sub-box
    let boxX = PAGE_MARGIN;
    let boxY = doc.y;
    let boxWidth = doc.page.width - PAGE_MARGIN * 2;
    let boxHeight = 100; // adjust to fit your data

    // Outline the box
    drawBoxedSection(doc, boxX, boxY, boxWidth, boxHeight, "Lead Details:");

    // Now place text inside the box
    doc.font("Helvetica").fontSize(10).fillColor("#000000");
    let textX = boxX + BOX_PADDING;
    let textY = boxY + BOX_PADDING + 15; // leave room for the “Lead Details:” title

    // Example fields from leadInstruction
    const assignedOfficers = leadInstruction?.assignedOfficer?.join(", ") || "Officer 90 / Officer 24";
    const assignedDate = leadInstruction?.assignedDate || "02/02/2025";
    const completedDate = leadInstruction?.completedDate || "02/02/2025";

    doc.text(`Assigned Officers: ${assignedOfficers}`, textX, textY);
    textY += 15;
    doc.text(`Assigned Date: ${assignedDate}`, textX, textY);
    textY += 15;
    doc.text(`Completed Date: ${completedDate}`, textX, textY);
    textY += 15;

    // Move doc.y below the box
    doc.y = boxY + boxHeight + 10;

    // 3) Big text area for “Lead Instruction”
    // We can draw another gray rectangle to mimic the large text box
    let instrBoxX = boxX;
    let instrBoxY = doc.y;
    let instrBoxWidth = boxWidth;
    let instrBoxHeight = 100; // adjust to fit the text

    // Outline for instruction text
    drawBoxedSection(doc, instrBoxX, instrBoxY, instrBoxWidth, instrBoxHeight, null);

    doc.font("Helvetica").fontSize(10).fillColor("#000000");
    let instrTextX = instrBoxX + BOX_PADDING;
    let instrTextY = instrBoxY + BOX_PADDING;

    const instructionText = leadInstruction?.leadDescription || 
      "As part of the Bank Robbery Investigation (Case No 65734), Officer 915 responded with Officers 1, 2, and 3...";
    doc.text(instructionText, instrTextX, instrTextY, {
      width: instrBoxWidth - BOX_PADDING * 2,
      align: "justify",
    });

    // Move doc.y below that box
    doc.y = instrBoxY + instrBoxHeight + 10;

    // 4) “Lead Return ID: 1” label (if you have multiple returns, loop them)
    if (leadReturn && leadReturn.length > 0) {
      // For simplicity, just show the first leadReturn in the style of your screenshot
      const firstReturn = leadReturn[0];
      doc.font("Helvetica-Bold").fontSize(12).text(`Lead Return ID: ${firstReturn.id || 1}`, {
        align: "left",
        underline: true,
      });
      doc.moveDown(0.5);

      // 4a) Person Details table
      doc.font("Helvetica-Bold").fontSize(10).text("Person Details");
      doc.moveDown(0.3);

      // Build columns: [Date Entered, Name, Phone #, City/State, Additional Details]
      const personHeaders = ["Date Entered", "Name", "Phone #", "City/State", "Additional Details"];
      const colWidths = [80, 100, 80, 120, 120]; // total ~ 500px (adjust as needed)

      // Filter persons for leadReturnId = firstReturn.id
      const relevantPersons = (leadPersons || []).filter(
        (p) => p.leadReturnId === firstReturn.id
      );

      // Build row data
      const personRows = relevantPersons.map((p) => {
        const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
        const cityState = `${p.city || ""}, ${p.state || ""}`.trim();
        return {
          "Date Entered": p.dateEntered || "",
          "Name": fullName,
          "Phone #": p.cellNumber || "",
          "City/State": cityState,
          "Additional Details": "View", // or “N/A” if you want a placeholder
        };
      });

      // If no persons, we’ll show an empty row or “No data.”
      if (personRows.length === 0) {
        personRows.push({
          "Date Entered": "",
          "Name": "No data",
          "Phone #": "",
          "City/State": "",
          "Additional Details": "",
        });
      }

      let tableStartY = doc.y;
      tableStartY = drawSimpleTable(doc, PAGE_MARGIN, tableStartY, personHeaders, personRows, colWidths);
      doc.y = tableStartY + 20;

      // 4b) Vehicle Details table
      doc.font("Helvetica-Bold").fontSize(10).text("Vehicle Details");
      doc.moveDown(0.3);

      // Columns: [Date Entered, Make, Model, Color, Plate, State, Additional View]
      const vehicleHeaders = ["Date Entered", "Make", "Model", "Color", "Plate", "State", "View"];
      const vehicleColWidths = [80, 70, 70, 60, 60, 50, 50]; // adjust total width

      // Filter vehicles for leadReturnId = firstReturn.id
      const relevantVehicles = (leadVehicles || []).filter(
        (v) => v.leadReturnId === firstReturn.id
      );

      const vehicleRows = relevantVehicles.map((v) => {
        return {
          "Date Entered": v.dateEntered || "",
          "Make": v.make || "",
          "Model": v.model || "",
          "Color": v.color || "",
          "Plate": v.plate || "",
          "State": v.state || "",
          "View": "View", // placeholder or “Additional Info”
        };
      });

      if (vehicleRows.length === 0) {
        vehicleRows.push({
          "Date Entered": "",
          "Make": "No data",
          "Model": "",
          "Color": "",
          "Plate": "",
          "State": "",
          "View": "",
        });
      }

      let vehicleStartY = doc.y;
      vehicleStartY = drawSimpleTable(doc, PAGE_MARGIN, vehicleStartY, vehicleHeaders, vehicleRows, vehicleColWidths);
      doc.y = vehicleStartY + 20;
    }

    // 5) Footer with file info
    doc.font("Helvetica").fontSize(8);
    doc.text(
      `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} by ${username}`,
      PAGE_MARGIN,
      doc.page.height - PAGE_MARGIN - 20
    );
    doc.text(`File: ${outputPath}`, PAGE_MARGIN, doc.page.height - PAGE_MARGIN - 10);

    doc.end();
    console.log(`Report successfully generated: ${outputPath}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate report.",
      details: error.message,
    });
  }
};

module.exports = { generateReport };
