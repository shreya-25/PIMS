// ReportWrapper.jsx
import React, { useRef } from 'react';
import Report from './Report';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportWrapper = () => {
  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: 'Employee_Monthly_Report',
  });

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Employee_Monthly_Report.pdf');
  };

  return (
    <div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <Report
          ref={reportRef}
          name="Alice Johnson"
          department="Engineering"
          score="92"
          date="March 2025"
        />
      </div>

      <button onClick={handlePrint}>🖨️ Print Report</button>
      <button onClick={handleDownloadPDF}>📥 Download PDF</button>
    </div>
  );
};

export default ReportWrapper;
