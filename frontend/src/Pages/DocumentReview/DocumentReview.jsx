// import { useMemo, useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import { Document, Page, pdfjs } from "react-pdf";
// import CommentBar from "../../components/CommentBar/CommentBar";

// import "./DocumentReview.css";


// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();


// export function DocumentReview({
//   pdfUrl = "/test1.pdf", // put your PDF in /public/testPDF2.pdf
// }) {

// const location = useLocation();
// const passedUrl = location.state?.pdfUrl || null;      // object URL from LRFinish
// const passedName = location.state?.filename || null;    // suggested filename
// const effectiveUrl = passedUrl || pdfUrl;
//   const [numPages, setNumPages] = useState(null);
//   const [scale, setScale] = useState(1.05);
//   const [comments, setComments] = useState([]);
//   const [draft, setDraft] = useState("");

// useEffect(() => {
//    return () => {
//     if (passedUrl?.startsWith("blob:")) {
//       URL.revokeObjectURL(passedUrl);
//     }    };
//  }, [passedUrl]);

//   // Add below your useState hooks
// const handleDownload = async () => {
//   try {
//     // If the file is served from your app (e.g., /public/test1.pdf), a simple <a download> works.
//   const a = document.createElement("a");
//    a.href = effectiveUrl;
//        const inferred = passedName
//       || effectiveUrl.split("/").filter(Boolean).pop()
//      || "document.pdf";
//     a.download = inferred.endsWith(".pdf") ? inferred : "document.pdf";
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//   } catch (err) {
//     console.error("Download failed:", err);
//   }
// };


//   const styles = useMemo(
//     () => ({
//       zoomLabel: { minWidth: 56, textAlign: "center" },
//     }),
//     []
//   );

//   const addComment = () => {
//     const text = draft.trim();
//     if (!text) return;
//     setComments((prev) => [
//       ...prev,
//       { id: prev.length ? prev[prev.length - 1].id + 1 : 1, text, ts: new Date().toISOString() },
//     ]);
//     setDraft("");
//   };

//   return (
//     <div className="dr-shell">
//       {/* Left: PDF */}
//       <section className="dr-left">
//         <header className="dr-toolbar">
//   <div className="dr-title">Document Review</div>
//   <div className="dr-zoom">
//     {/* Download button */}
//     <button className="dr-download" onClick={handleDownload}>
//       Download PDF
//     </button>

//     <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}>−</button>
//     <div aria-live="polite" style={styles.zoomLabel}>{(scale * 100).toFixed(0)}%</div>
//     <button onClick={() => setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))}>+</button>
//   </div>
// </header>


//         <div className="dr-pdfArea">
//          <Document file={effectiveUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>

//             {Array.from({ length: numPages || 0 }, (_, i) => (
//               <Page
//                 key={i}
//                 pageNumber={i + 1}
//                 scale={scale}
//                 renderTextLayer
//                 renderAnnotationLayer
//                 className="dr-page"
//               />
//             ))}
//           </Document>
//         </div>
//       </section>

//       {/* Right: Comments (replace with your CommentBar if you prefer) */}
//        <div classname = "comment-box" >
//      <aside className="dr-right" aria-label="Comments">
 
//     <CommentBar tag="DocumentReview" threadKey="test1" />
// </aside>
//   </div>

//     </div>
//   );
// }

// export default DocumentReview;


import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import CommentBar from "../../components/CommentBar/CommentBar";
import "./DocumentReview.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs?ver=5.3.93',
  import.meta.url
).toString();

export function DocumentReview({ pdfUrl = "/test1.pdf" }) {
  const { state } = useLocation();

  // Prefer a Blob from LRFinish; otherwise allow a plain URL string; else default to /public path
  const pdfBlob = state?.pdfBlob instanceof Blob ? state.pdfBlob : null;
  const urlFromState = typeof state?.pdfUrl === "string" ? state.pdfUrl : null;
  const filename = typeof state?.filename === "string" ? state.filename : null;

  const effectiveFile = pdfBlob || urlFromState || pdfUrl;

  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.8);
  const [errorMsg, setErrorMsg] = useState("");

  const styles = useMemo(() => ({ zoomLabel: { minWidth: 56, textAlign: "center" } }), []);

  const handleDownload = () => {
    try {
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (filename && filename.endsWith(".pdf")) ? filename : (filename || "document.pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const a = document.createElement("a");
        a.href = urlFromState || pdfUrl;
        const inferred = filename || (a.href.split("/").pop() || "document.pdf");
        a.download = inferred.endsWith(".pdf") ? inferred : "document.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  return (
    <div className="dr-shell">
      <section className="dr-left">
        <header className="dr-toolbar">
          <div className="dr-title">Document Review</div>
          <div className="dr-zoom">
            <button className="dr-download" onClick={handleDownload}>Download PDF</button>
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}>−</button>
            <div aria-live="polite" style={styles.zoomLabel}>{(scale * 100).toFixed(0)}%</div>
            <button onClick={() => setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))}>+</button>
          </div>
        </header>

        <div className="dr-pdfArea">
          {!!errorMsg && (
            <div style={{ color: "#b91c1c", marginBottom: 12 }}>
              Failed to load PDF: {errorMsg}{" "}
              {!pdfBlob && (urlFromState || pdfUrl) && (
                <>• Try opening <a href={urlFromState || pdfUrl} target="_blank" rel="noreferrer">this link</a>.</>
              )}
            </div>
          )}

          <Document
            file={effectiveFile}      // ✅ Blob, or URL string, or /public fallback
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(err) => {
              console.error("PDF load error:", err);
              setErrorMsg(err?.message || String(err));
            }}
          >
            {Array.from({ length: numPages || 0 }, (_, i) => (
            <Page
    key={i}
     pageNumber={i + 1}
    scale={scale}
   className="dr-page"
   renderTextLayer={false}
    renderAnnotationLayer={false}
  />
            ))}
          </Document>
        </div>
      </section>

        <aside className="dr-right" aria-label="Comments">
    <div className="dr-commentsBody">
      <CommentBar tag="DocumentReview" threadKey="test1" />
    </div>
  </aside>
    </div>
  );
}

export default DocumentReview;
