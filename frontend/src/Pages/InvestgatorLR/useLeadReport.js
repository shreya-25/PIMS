/**
 * useLeadReport.js
 *
 * Custom hook that encapsulates the full-report generation logic shared across
 * all Lead Return sub-pages (Evidence, Pictures, Audio, etc.).
 *
 * Responsibilities:
 *  - Fetches all LR sections in parallel.
 *  - Hydrates file attachments (enclosures, evidence, pictures, audio, video).
 *  - Posts the assembled payload to /api/report/generate.
 *  - Navigates to DocumentReview with the returned PDF blob.
 *  - Manages the `isGenerating` guard flag to prevent duplicate submissions.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { attachFiles } from "./lrUtils";

/**
 * @param {Object} params
 * @param {Object} params.selectedLead     - Current lead from CaseContext.
 * @param {Object} params.selectedCase     - Current case from CaseContext.
 * @param {Object} params.location         - React Router location (for fallback lead/case from state).
 * @param {Function} params.setAlertMessage - Setter to display error messages.
 * @param {Function} params.setAlertOpen    - Setter to open the alert modal.
 *
 * @returns {{ isGenerating: boolean, handleViewLeadReturn: Function }}
 */
export const useLeadReport = ({
  selectedLead,
  selectedCase,
  location,
  setAlertMessage,
  setAlertOpen,
}) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Triggers full lead-return report generation.
   * Restricted to Case Manager / Detective Supervisor roles.
   */
  const handleViewLeadReturn = async () => {
    // Resolve lead/case from context, falling back to location state
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
      setAlertMessage("Please select a case and lead first.");
      setAlertOpen(true);
      return;
    }

    if (isGenerating) return;

    try {
      setIsGenerating(true);

      const token    = localStorage.getItem("token");
      const authHdr  = { headers: { Authorization: `Bearer ${token}` } };
      const leadName = lead.leadName || lead.description;
      const { leadNo } = lead;
      const { caseNo, caseName } = kase;
      const base = `${leadNo}/${encodeURIComponent(leadName)}/${caseNo}/${encodeURIComponent(caseName)}`;

      // Fetch all LR sections in parallel; each call is allowed to fail gracefully
      const [
        instrRes, returnsRes, personsRes, vehiclesRes,
        enclosuresRes, evidenceRes, picturesRes,
        audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${base}`,            authHdr).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${base}`,     authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${base}`,   authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${base}`, authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${base}`,         authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${base}`,          authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${base}`,           authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${base}`,             authHdr).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${base}`,             authHdr).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${base}`,          authHdr).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${base}`,            authHdr).catch(() => ({ data: [] })),
      ]);

      // Hydrate file attachments for media-bearing sections in parallel
      const [enclosuresWithFiles, evidenceWithFiles, picturesWithFiles, audioWithFiles, videosWithFiles] =
        await Promise.all([
          attachFiles(enclosuresRes.data, "_id",       "/api/lrenclosures/files"),
          attachFiles(evidenceRes.data,   "_id",       "/api/lrevidences/files"),
          attachFiles(picturesRes.data,   "pictureId", "/api/lrpictures/files"),
          attachFiles(audioRes.data,      "audioId",   "/api/lraudio/files"),
          attachFiles(videosRes.data,     "videoId",   "/api/lrvideo/files"),
        ]);

      const leadInstructions = instrRes.data?.[0] || {};
      const leadReturns      = returnsRes.data    || [];

      // All sections enabled — this generates the Full Report
      const selectedReports = {
        FullReport: true, leadInstruction: true, leadReturn: true,
        leadPersons: true, leadVehicles: true, leadEnclosures: true,
        leadEvidence: true, leadPictures: true, leadAudio: true,
        leadVideos: true, leadScratchpad: true, leadTimeline: true,
      };

      const reportBody = {
        user:            localStorage.getItem("loggedInUser") || "",
        reportTimestamp: new Date().toISOString(),
        selectedReports,
        // Section payloads
        leadInstruction:  leadInstructions,
        leadInstructions,           // backend expects both keys
        leadReturn:       leadReturns,
        leadReturns,
        leadPersons:    personsRes.data    || [],
        leadVehicles:   vehiclesRes.data   || [],
        leadEnclosures: enclosuresWithFiles,
        leadEvidence:   evidenceWithFiles,
        leadPictures:   picturesWithFiles,
        leadAudio:      audioWithFiles,
        leadVideos:     videosWithFiles,
        leadScratchpad: scratchpadRes.data || [],
        leadTimeline:   timelineRes.data   || [],
      };

      // Generate the PDF and navigate to the document review page
      const resp = await api.post("/api/report/generate", reportBody, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/DocumentReview", {
        state: {
          pdfBlob: new Blob([resp.data], { type: "application/pdf" }),
          filename: `Lead_${leadNo || "report"}.pdf`,
        },
      });
    } catch (err) {
      let message = "Error generating PDF:\n";
      if (err?.response?.data instanceof Blob) {
        message += await err.response.data.text();
      } else {
        message += err.message || "Unknown error";
      }
      console.error("Report generation error:", err);
      setAlertMessage(message);
      setAlertOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, handleViewLeadReturn };
};
