/**
 * lrUtils.js
 *
 * Shared pure utility functions used across all Lead Return (LR) sub-pages
 * (Evidence, Pictures, Audio, Video, Enclosures, etc.).
 *
 * Centralising these here eliminates copy-paste duplication and ensures a
 * single source of truth for formatting and API-path construction logic.
 */

import api from "../../api";
import { safeEncode } from "../../utils/encode";

// ─── ID Normalization ─────────────────────────────────────────────────────────

/**
 * Normalizes a lead-return ID to a trimmed, uppercase string.
 * Used for consistent comparison when filtering narrative ID dropdowns.
 *
 * @param {*} id
 * @returns {string}
 */
export const normalizeId = (id) => String(id ?? "").trim().toUpperCase();

// ─── Date Formatting ─────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to MM/DD/YY for table display.
 * Returns an empty string for null, undefined, or invalid dates.
 *
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day   = String(date.getUTCDate()).padStart(2, "0");
  const year  = String(date.getUTCFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

// ─── Sorting Helpers ──────────────────────────────────────────────────────────

/**
 * Converts an alphabetic lead-return ID (e.g. "A", "B", "AA", "AB") to a
 * numeric value so IDs can be sorted in alphabetical order.
 *
 * @param {string} str
 * @returns {number}
 */
export const alphabetToNumber = (str = "") => {
  const normalized = String(str ?? "").trim().toUpperCase();
  let n = 0;
  for (let i = 0; i < normalized.length; i++) {
    n = n * 26 + (normalized.charCodeAt(i) - 64);
  }
  return n;
};

// ─── URL Helpers ──────────────────────────────────────────────────────────────

/**
 * Builds the common path segment used by most LR API endpoints:
 *   /{leadNo}/{encLeadName}/{caseNo}/{encCaseName}
 *
 * @param {string|number} leadNo
 * @param {string}        leadName
 * @param {string|number} caseNo
 * @param {string}        caseName
 * @returns {string}
 */
export const buildLeadCasePath = (leadNo, leadName, caseNo, caseName) =>
  `${leadNo}/${safeEncode(leadName)}/${caseNo}/${safeEncode(caseName)}`;

/**
 * Builds the path segment used by LR API endpoints when looking up by caseId:
 *   /{leadNo}/{encLeadName}/{caseId}
 *
 * @param {string|number} leadNo
 * @param {string}        leadName
 * @param {string}        caseId  - MongoDB ObjectId of the case
 * @returns {string}
 */
export const buildLeadCaseIdPath = (leadNo, leadName, caseId) =>
  `${leadNo}/${safeEncode(leadName)}/${caseId}`;

// ─── File Attachment Helper ────────────────────────────────────────────────────

/**
 * Fetches and attaches a `files` array to each item in a list.
 * Used during report generation to hydrate records that may have associated
 * file uploads (enclosures, evidence, pictures, audio, video).
 *
 * @param {Array}  items         - Data items to hydrate.
 * @param {string} idFieldName   - Field name on each item holding the record ID.
 * @param {string} filesEndpoint - Base API path; record ID is appended as a segment.
 * @returns {Promise<Array>}     - Items with a `files: FileRecord[]` property.
 */
export const attachFiles = async (items, idFieldName, filesEndpoint) => {
  const token = localStorage.getItem("token");

  return Promise.all(
    (items || []).map(async (item) => {
      const recordId = item[idFieldName];
      if (!recordId) return { ...item, files: [] };

      try {
        const { data: files } = await api.get(`${filesEndpoint}/${recordId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { ...item, files };
      } catch (err) {
        console.error(`Failed to fetch files for ${filesEndpoint}/${recordId}:`, err);
        return { ...item, files: [] };
      }
    })
  );
};

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the given string is a valid HTTP or HTTPS URL.
 *
 * @param {string|null|undefined} s
 * @returns {boolean}
 */
export const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test((s || "").trim());
