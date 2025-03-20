const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { PassThrough } = require("stream");

// const sectionGap = 20; // Gap between sections
const minRowHeight = 30; // Minimum height for table rows
const rowPadding = 8;    // Extra padding for each row

// --- Table Drawing Helper Functions ---
function drawTableHeader(doc, startX, headers, columnWidths) {
  let x = startX;
  let y = doc.y;
  doc.font("Helvetica-Bold").fontSize(10);

  // Calculate adaptive header height based on text
  let headerHeight = 0;
  headers.forEach((header, i) => {
    const h = doc.heightOfString(header, { width: columnWidths[i] - 4, align: "left" });
    if (h > headerHeight) headerHeight = h;
  });
  headerHeight = Math.max(headerHeight, minRowHeight) + rowPadding;

  headers.forEach((header, i) => {
    doc.rect(x, y, columnWidths[i], headerHeight).stroke();
    doc.text(header, x + 2, y + 2, {
      width: columnWidths[i] - 4,
      align: "left"
    });
    x += columnWidths[i];
  });
  doc.y = y + headerHeight;
  return headerHeight;
}

function drawTableRow(doc, startX, headers, row, columnWidths, rowHeight) {
  let x = startX;
  let y = doc.y;
  doc.font("Helvetica").fontSize(10);
  headers.forEach((header, i) => {
    const text = row[header] !== undefined ? row[header].toString() : "";
    doc.rect(x, y, columnWidths[i], rowHeight).stroke();
    doc.text(text, x + 2, y + 2, {
      width: columnWidths[i] - 4,
      align: "left"
    });
    x += columnWidths[i];
  });
  doc.y = y + rowHeight;
  return rowHeight;
}

function drawDynamicTable(doc, startX, headers, rows, columnWidths) {
  // Add a new page if necessary
  if (doc.y + minRowHeight > doc.page.height - doc.options.margin) {
    doc.addPage();
  }
  // Draw the header row adaptively.
  drawTableHeader(doc, startX, headers, columnWidths);
  rows.forEach(row => {
    let maxHeight = minRowHeight;
    headers.forEach((header, i) => {
      const text = row[header] !== undefined ? row[header].toString() : "";
      const h = doc.heightOfString(text, { width: columnWidths[i] - 4, align: "left" });
      if (h > maxHeight) maxHeight = h;
    });
    maxHeight += rowPadding;
    if (doc.y + maxHeight > doc.page.height - doc.options.margin) {
      doc.addPage();
      drawTableHeader(doc, startX, headers, columnWidths);
    }
    drawTableRow(doc, startX, headers, row, columnWidths, maxHeight);
  });
  return doc.y;
}

// This helper renders the given data as a table
function renderSectionTable(doc, title, data, startX, pageWidth) {
  // Section title with underline.
  doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
  doc.moveDown(0.5);

  // If data is a single object, wrap it in an array.
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    data = [data];
  }
  if (Array.isArray(data)) {
    if (data.length === 0) {
      doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
      doc.moveDown(1);
      return;
    }
    // Compute the union of keys for all records.
    let headers = [];
    data.forEach(record => {
      Object.keys(record).forEach(key => {
        if (!headers.includes(key)) {
          headers.push(key);
        }
      });
    });
    const availableWidth = pageWidth - startX * 2;
    const colWidth = availableWidth / headers.length;
    const columnWidths = Array(headers.length).fill(colWidth);
    drawDynamicTable(doc, startX, headers, data, columnWidths);
  } else {
    doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
  }
  doc.moveDown(1);
}

// New function to render section data as bullet points instead of table
function renderSectionBulletPoints(doc, title, data, startX) {
  // Section title with underline
  doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
  doc.moveDown(0.5);

  if (!Array.isArray(data) || data.length === 0) {
    doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
    doc.moveDown(1);
    return;
  }

  // Process each record as a set of bullet points
  data.forEach((record, index) => {
    // Add a new page if we're close to the bottom
    if (doc.y > doc.page.height - doc.options.margin - 100) {
      doc.addPage();
    }

    // Record header (e.g., Person #1, Person #2)
    doc.font("Helvetica-Bold").fontSize(10)
       .text(`${title.replace("Lead ", "")} #${index + 1}:`, startX, doc.y);
    doc.moveDown(0.2);
    
    // List all fields as bullet points
    doc.font("Helvetica").fontSize(10);
    Object.entries(record).forEach(([key, value]) => {
      // Skip rendering the leadReturnId and empty values
      if (key !== 'leadReturnId' && value !== undefined && value !== null && value !== '') {
        // Format arrays nicely
        let displayValue = Array.isArray(value) ? value.join(", ") : value;
        
        // Check if we need a page break
        if (doc.y > doc.page.height - doc.options.margin - 20) {
          doc.addPage();
        }
        
        // Add the bullet point
        doc.text(`• ${key}: ${displayValue}`, startX + 20, doc.y);
        doc.moveDown(0.2);
      }
    });
    
    // Add separator between records (if not the last one)
    if (index < data.length - 1) {
      doc.moveDown(0.5);
      doc.text("――――――――――――――――――――――――――――", startX, doc.y);
      doc.moveDown(0.5);
    }
  });
  
  doc.moveDown(1);
}

// This helper renders key-value pairs for a section
// function renderKeyValueSection(doc, title, data, startX) {
//   doc.font("Helvetica-Bold").fontSize(12).text(title, startX, doc.y, { underline: true });
//   doc.moveDown(0.5);
  
//   if (!data || Object.keys(data).length === 0) {
//     doc.font("Helvetica").fontSize(10).text("No data available", startX, doc.y);
//     doc.moveDown(1);
//     return;
//   }
  
//   doc.font("Helvetica").fontSize(10);
//   Object.entries(data).forEach(([key, value]) => {
//     if (value !== undefined && value !== null && value !== '') {
//       doc.text(`${key}: ${value}`, startX, doc.y);
//       doc.moveDown(0.3);
//     }
//   });
//   doc.moveDown(1);
// }

// --- Main Report Generation Function ---
const generateReport = async (req, res) => {
  console.log(`Report generation requested by ${req.body.user || 'unknown user'} at: ${new Date().toLocaleString()}`);
  const {
    leadInstruction,
    leadReturns,
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
    const doc = new PDFDocument({ margin: 50 });
    
    // Create a PassThrough stream to tee the PDF to both file and response.
    const passThrough = new PassThrough();
    const timestamp = new Date().toISOString().replace(/[\W]/g, "");
    const username = req.body.user || "system";
    const outputPath = path.resolve(`reports/report_${username}_${timestamp}.pdf`);
    
    // Ensure reports directory exists
    const reportsDir = path.resolve("reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const writeStream = fs.createWriteStream(outputPath);
    
    // Pipe the PDF document to our PassThrough stream.
    doc.pipe(passThrough);
    passThrough.pipe(writeStream);
    passThrough.pipe(res);

    // --- Header with Timestamp and Logo ---
    const reportDate = req.body.reportTimestamp || new Date().toLocaleString();
    doc.font("Helvetica").fontSize(10).text(`Report generated: ${reportDate}`, doc.options.margin, doc.options.margin);
    doc.font("Helvetica").fontSize(10).text(`Generated by: ${username}`, doc.options.margin, doc.y + 15);
    
    const logoPath = path.resolve("src/assets/newpolicelogo.png");
    if (fs.existsSync(logoPath)) {
      const logoWidth = 100;
      const logoX = doc.page.width - doc.options.margin - logoWidth;
      const logoY = doc.options.margin;
      doc.image(logoPath, logoX, logoY, { width: logoWidth });
    }

    // --- Centered Title ---
    doc.moveDown(3);
    doc.font("Helvetica-Bold").fontSize(20).text("Case Report", { align: "center", underline: true });
    doc.moveDown(1);

    const startX = doc.options.margin;
    const pageWidth = doc.page.width;

    // --- Lead Details Section ---
    if (leadInstruction) {
      doc.font("Helvetica-Bold").fontSize(12).text("Lead Details", startX, doc.y, { underline: true });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10);
      
      // Display all available lead instruction fields
      Object.entries(leadInstruction).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          let displayValue = value;
          
          // Special handling for arrays
          if (Array.isArray(value)) {
            displayValue = value.join(", ");
          }
          
          doc.text(`${key}: ${displayValue}`, { align: "left" });
        }
      });
      
      doc.moveDown(1);
    } else {
      doc.font("Helvetica").fontSize(10).text("No lead instruction data available.", startX, doc.y);
      doc.moveDown(1);
    }

    // --- Loop Through Each Lead Return ---
    if (leadReturns && Array.isArray(leadReturns) && leadReturns.length > 0) {
      leadReturns.forEach((returnRecord, returnIndex) => {
        // Add a page break between returns if not the first one
        if (returnIndex > 0) {
          doc.addPage();
        }
        
        // Render return header with return-specific details.
        doc.font("Helvetica-Bold").fontSize(14)
           .text(`Return #${returnIndex + 1}`, startX, doc.y, { underline: true });
        doc.moveDown(0.5);
        
        // Display all fields from the return record
        doc.font("Helvetica-Bold").fontSize(12).text("Return Details", startX, doc.y, { underline: true });
        doc.moveDown(0.5);
        doc.font("Helvetica").fontSize(10);
        
        Object.entries(returnRecord).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            doc.text(`${key}: ${value}`, { align: "left" });
          }
        });
        doc.moveDown(1);

        // Filter related records by the associated leadReturnId.
        const relatedPersons = (leadPersons || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedVehicles = (leadVehicles || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedEnclosures = (leadEnclosures || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedEvidence = (leadEvidence || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedPictures = (leadPictures || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedAudio = (leadAudio || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedVideos = (leadVideos || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedScratchpad = (leadScratchpad || []).filter(item => item.leadReturnId === returnRecord.id);
        const relatedTimeline = (leadTimeline || []).filter(item => item.leadReturnId === returnRecord.id);

        // Render each section - Person and Vehicle as bullet points, others as tables
        if (relatedPersons.length) {
          // Using bullet points for persons
          const enhancedPersons = relatedPersons.map(person => {
            return {
              ...person,
              // Include any fields that might be missing but are present in the UI
              dateEntered: person.dateEntered || '',
              lastName: person.lastName || '',
              firstName: person.firstName || '',
              mi: person.mi || '',
              suffix: person.suffix || '',
              cellNumber: person.cellNumber || '',
              businessName: person.businessName || '',
              street1: person.street1 || '',
              street2: person.street2 || '',
              building: person.building || '',
              apartment: person.apartment || '',
              city: person.city || '',
              state: person.state || '',
              zipCode: person.zipCode || '',
              ssn: person.ssn || '',
              age: person.age || '',
              email: person.email || '',
              occupation: person.occupation || '',
              personType: person.personType || '',
              condition: person.condition || '',
              cautionType: person.cautionType || '',
              sex: person.sex || '',
              race: person.race || '',
              ethnicity: person.ethnicity || '',
              skinTone: person.skinTone || '',
              eyeColor: person.eyeColor || '',
              glasses: person.glasses || '',
              hairColor: person.hairColor || '',
              height: person.height || '',
              weight: person.weight || '',
              miscInfo: person.miscInfo || ''
            };
          });
          renderSectionBulletPoints(doc, "Lead Persons", enhancedPersons, startX);
        }
        
        if (relatedVehicles.length) {
          // Using bullet points for vehicles
          const enhancedVehicles = relatedVehicles.map(vehicle => {
            return {
              ...vehicle,
              dateEntered: vehicle.dateEntered || '',
              year: vehicle.year || '',
              make: vehicle.make || '',
              model: vehicle.model || '',
              color: vehicle.color || '',
              vin: vehicle.vin || '',
              plate: vehicle.plate || '',
              state: vehicle.state || '',
              description: vehicle.description || '',
              vehicleType: vehicle.vehicleType || '',
              condition: vehicle.condition || '',
              location: vehicle.location || '',
              registeredOwner: vehicle.registeredOwner || '',
              ownerAddress: vehicle.ownerAddress || '',
              insurance: vehicle.insurance || '',
              policyNumber: vehicle.policyNumber || '',
              notes: vehicle.notes || ''
            };
          });
          renderSectionBulletPoints(doc, "Lead Vehicles", enhancedVehicles, startX);
        }
        
        // The remaining sections use tables
        if (relatedEnclosures.length) {
          renderSectionTable(doc, "Lead Enclosures", relatedEnclosures, startX, pageWidth);
        }
        
        if (relatedEvidence.length) {
          renderSectionTable(doc, "Lead Evidence", relatedEvidence, startX, pageWidth);
        }
        
        if (relatedPictures.length) {
          renderSectionTable(doc, "Lead Pictures", relatedPictures, startX, pageWidth);
        }
        
        if (relatedAudio.length) {
          renderSectionTable(doc, "Lead Audio", relatedAudio, startX, pageWidth);
        }
        
        if (relatedVideos.length) {
          renderSectionTable(doc, "Lead Videos", relatedVideos, startX, pageWidth);
        }
        
        if (relatedScratchpad.length) {
          renderSectionTable(doc, "Lead Scratchpad", relatedScratchpad, startX, pageWidth);
        }
        
        if (relatedTimeline.length) {
          renderSectionTable(doc, "Lead Timeline", relatedTimeline, startX, pageWidth);
        }
      });
    } else {
      doc.font("Helvetica").fontSize(10).text("No lead returns available.", startX, doc.y);
    }

    // --- Report Footer ---
    doc.font("Helvetica").fontSize(8);
    doc.text(
      `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} by ${username}`,
      startX,
      doc.page.height - doc.options.margin - 20
    );
    doc.text(`File: ${outputPath}`, startX, doc.page.height - doc.options.margin - 10);

    doc.end();
    
    console.log(`Report successfully generated: ${outputPath}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate report.", details: error.message });
  }
};

// --- Test Function to Generate a Dummy Report ---
const generateTestReport = async (req, res) => {
  console.log(`Test PDF generation requested at: ${new Date().toLocaleString()}`);
  const dummyData = {
    user: "rushilpatel21",  // Current user's login
    reportTimestamp: "2025-03-03 12:41:29",  // Current timestamp
    leadInstruction: {
      leadNumber: "16",
      leadOrigin: "7",
      incidentNumber: "C000006",
      subNumber: "C0000045",
      associatedSubNumbers: ["SUB-000001", "SUB-000002", "SUB-000003"],
      assignedDate: "09/29/24",
      leadSummary: "Interview Mr. John",
      assignedBy: "Officer 5",
      leadDescription: "Interview Mr. John to find out where he was on Saturday 09/25",
      assignedOfficer: ["Officer 1", "Officer 2"],
    },
    leadReturns: [
      { id: 1, dateEntered: "12/01/2024", enteredBy: "Officer 916", results: "Returned item A", status: "Completed", notes: "Follow-up required" },
      { id: 2, dateEntered: "12/02/2024", enteredBy: "Officer 917", results: "Returned item B", status: "In Progress", notes: "No additional comments" },
      { id: 3, dateEntered: "12/03/2024", enteredBy: "Officer 918", results: "Returned item C", status: "Pending", notes: "Awaiting confirmation" },
    ],
    leadPersons: [
      { 
        leadReturnId: 1, 
        dateEntered: "01/01/2024", 
        lastName: "Doe", 
        firstName: "John", 
        mi: "A", 
        suffix: "Jr", 
        cellNumber: "123-456-7890", 
        businessName: "ABC Corp", 
        street1: "123 Main St", 
        street2: "Apt 4B", 
        building: "Tower B", 
        apartment: "4B", 
        city: "New York", 
        state: "NY", 
        zipCode: "10001",
        ssn: "123-45-6789",
        age: "42",
        email: "john.doe@example.com",
        occupation: "Software Engineer",
        personType: "Witness",
        condition: "Unharmed",
        cautionType: "None",
        sex: "Male",
        race: "Caucasian",
        ethnicity: "Non-Hispanic",
        skinTone: "Fair",
        eyeColor: "Blue",
        glasses: "Yes",
        hairColor: "Brown",
        height: "6'1\"",
        weight: "185 lbs",
        miscInfo: "Has a small scar on left cheek"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "01/05/2024", 
        lastName: "Smith", 
        firstName: "Jane", 
        mi: "B", 
        suffix: "", 
        cellNumber: "987-654-3210", 
        businessName: "XYZ Inc", 
        street1: "456 Elm St", 
        street2: "", 
        building: "", 
        apartment: "7C", 
        city: "Los Angeles", 
        state: "CA", 
        zipCode: "90001",
        ssn: "987-65-4321",
        age: "35",
        email: "jane.smith@example.com",
        occupation: "Attorney",
        personType: "Suspect",
        condition: "Unharmed",
        cautionType: "Flight Risk",
        sex: "Female",
        race: "Caucasian",
        ethnicity: "Hispanic",
        skinTone: "Medium",
        eyeColor: "Brown",
        glasses: "No",
        hairColor: "Black",
        height: "5'6\"",
        weight: "135 lbs",
        miscInfo: "Fluent in Spanish"
      },
    ],
    leadVehicles: [
      { 
        leadReturnId: 1, 
        dateEntered: "01/01/2024", 
        year: "2023", 
        make: "Honda", 
        model: "Accord", 
        color: "Blue", 
        vin: "1HGCV1F34NA123456", 
        plate: "XYZ-1234", 
        state: "NY",
        description: "4-door sedan with tinted windows",
        vehicleType: "Passenger Car",
        condition: "Excellent",
        location: "Owner's residence",
        registeredOwner: "John Doe",
        ownerAddress: "123 Main St, New York, NY",
        insurance: "State Farm",
        policyNumber: "SF123456789",
        notes: "Vehicle was recently seen at the crime scene"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "01/05/2024", 
        year: "2022", 
        make: "Toyota", 
        model: "Camry", 
        color: "Black", 
        vin: "4T1BF1FK5NU654321", 
        plate: "ABC-5678", 
        state: "CA",
        description: "4-door sedan with roof rack",
        vehicleType: "Passenger Car",
        condition: "Good",
        location: "Parking garage at 100 Broadway",
        registeredOwner: "Jane Smith",
        ownerAddress: "456 Elm St, Los Angeles, CA",
        insurance: "Geico",
        policyNumber: "GC987654321",
        notes: "Vehicle has a dent on the rear bumper"
      },
    ],
    leadEnclosures: [
      { 
        leadReturnId: 1, 
        dateEntered: "12/01/2024", 
        type: "Report", 
        enclosure: "Incident Report",
        description: "Initial incident report filed by Officer Johnson",
        source: "Police Department",
        location: "Central Records",
        notes: "Contains initial witness statements"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "12/03/2024", 
        type: "Evidence", 
        enclosure: "Photo Evidence",
        description: "Photos taken at the crime scene",
        source: "Forensic Team",
        location: "Evidence Locker B",
        notes: "Includes photos of tire marks and footprints"
      },
    ],
    leadEvidence: [
      { 
        leadReturnId: 1, 
        dateEntered: "12/01/2024", 
        type: "Physical", 
        collectionDate: "12/01/2024", 
        disposedDate: "12/03/2024", 
        disposition: "Stored",
        description: "Knife found at the scene",
        collectedBy: "Officer Johnson",
        location: "Evidence Locker A, Shelf 3",
        chainOfCustody: "Officer Johnson → Evidence Tech Smith",
        notes: "Fingerprints visible on handle"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "12/02/2024",
        type: "Digital", 
        collectionDate: "12/02/2024", 
        disposedDate: "12/04/2024", 
        disposition: "Archived",
        description: "Security camera footage",
        collectedBy: "Tech Specialist Davis",
        location: "Digital Evidence Server",
        chainOfCustody: "Tech Davis → Digital Forensics",
        notes: "Shows suspect entering the building at 10:15 PM"
      },
    ],
    leadPictures: [
      { 
        leadReturnId: 1, 
        dateEntered: "2024-12-01", 
        datePictureTaken: "2024-11-25", 
        description: "Crime scene picture", 
        image: "/Materials/pict1.jpeg",
        photographer: "Officer Wilson",
        location: "123 Main Street, front entrance",
        caption: "Main entrance where forced entry occurred",
        notes: "Visible damage to door frame"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "2024-12-02", 
        datePictureTaken: "2024-11-26", 
        description: "Vehicle involved", 
        image: "/Materials/pict2.jpg",
        photographer: "Officer Garcia",
        location: "Parking lot at 100 Oak Street",
        caption: "Suspect vehicle identified by witness",
        notes: "License plate clearly visible"
      },
    ],
    leadAudio: [
      { 
        leadReturnId: 1, 
        dateEntered: "12/01/2024", 
        dateAudioRecorded: "12/01/2024", 
        description: "Witness interview", 
        audioSrc: "/assets/sample-audio.mp3",
        recordedBy: "Detective Williams",
        duration: "23:45",
        participants: "Detective Williams, John Smith (witness)",
        location: "Precinct Interview Room 2",
        notes: "Witness describes seeing a blue sedan leaving the scene"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "12/02/2024", 
        dateAudioRecorded: "12/02/2024", 
        description: "Crime scene recording", 
        audioSrc: "/assets/sample-audio2.mp3",
        recordedBy: "Officer Garcia",
        duration: "05:17",
        participants: "Officer Garcia, Forensic Team",
        location: "Crime Scene",
        notes: "Ambient sounds and team discussion during evidence collection"
      },
    ],
    leadVideos: [
      { 
        leadReturnId: 1, 
        dateEntered: "12/01/2024", 
        dateVideoRecorded: "12/01/2024", 
        description: "Surveillance video", 
        videoSrc: `${process.env.PUBLIC_URL}/Materials/video1.mp4`,
        recordedBy: "Officer Thompson",
        duration: "14:22",
        participants: "N/A (surveillance footage)",
        location: "Bank ATM camera",
        notes: "Shows suspect approaching ATM at 22:14"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "12/02/2024", 
        dateVideoRecorded: "12/02/2024", 
        description: "Interview recording", 
        videoSrc: `${process.env.PUBLIC_URL}/Materials/video2.mp4`,
        recordedBy: "Detective Rogers",
        duration: "45:17",
        participants: "Detective Rogers, Jane Smith (witness)",
        location: "Interview Room 3",
        notes: "Witness provides detailed account of events leading up to incident"
      },
    ],
    leadScratchpad: [
      { 
        leadReturnId: 1, 
        dateEntered: "12/01/2024", 
        enteredBy: "John Smith", 
        text: "Initial case observations: Appears to be related to previous burglaries in the area based on MO.",
        category: "Investigation Notes",
        priority: "Medium",
        tags: "burglary, pattern, MO"
      },
      { 
        leadReturnId: 2, 
        dateEntered: "12/02/2024", 
        enteredBy: "Jane Doe", 
        text: "Follow-up notes: Need to check alibi with the employer and verify security footage timestamps.",
        category: "Follow-up Tasks",
        priority: "High",
        tags: "alibi, verification, follow-up"
      },
    ],
    leadTimeline: [
      { 
        leadReturnId: 1, 
        date: "01/01/2024", 
        timeRange: "10:30 AM - 12:00 PM", 
        location: "123 Main St, NY", 
        description: "Suspect left scene", 
        flags: ["High Priority"],
        participants: "John Doe, Jane Smith",
        evidence: "CCTV footage #E12345",
        notes: "Multiple witnesses confirmed timing"
      },
      { 
        leadReturnId: 2, 
        date: "01/05/2024", 
        timeRange: "2:00 PM - 3:30 PM", 
        location: "456 Elm St, CA", 
        description: "Suspect headed to airport", 
        flags: ["Follow-up Required"],
        participants: "Mike Johnson",
        evidence: "Taxi receipt #R67890",
        notes: "Confirmed by taxi company records"
      },
    ],
  };
  
  // Set the user and timestamp fields to the current values
  dummyData.user = req.body.user || "rushilpatel21";  // Use the provided user or default
  dummyData.reportTimestamp = "2025-03-03 12:46:03"; // Current timestamp from the request
  
  req.body = dummyData;
  return generateReport(req, res);
};

// --- Export the functions ---
module.exports = { 
  generateReport, 
  generateTestReport 
};
