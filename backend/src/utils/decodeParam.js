/**
 * decodeParam.js
 *
 * Safely decodes a URL path parameter that may have been partially decoded
 * by Express (e.g. %20 → space) while leaving %2F (slash) still encoded.
 * Calling decodeURIComponent a second time is a no-op for already-decoded
 * strings, but correctly handles any residual encoded sequences.
 *
 * Falls back to returning the raw string if the value is malformed.
 */
const decodeParam = (param) => {
  if (param == null) return param;
  try {
    return decodeURIComponent(String(param));
  } catch {
    // malformed percent-encoding — return as-is rather than throwing
    return String(param);
  }
};

/**
 * Normalises a free-text string before persisting it as a lead description
 * or summary. Ensures the stored value is stable and URL-safe:
 *   - strips leading/trailing whitespace
 *   - collapses internal runs of whitespace to a single space
 *
 * This prevents mismatches between the stored value and the URL-decoded
 * value used in subsequent queries (e.g. a trailing space stored in the DB
 * would never match the trimmed value read from a URL param).
 */
const normaliseLeadText = (text) => {
  if (text == null) return '';
  return String(text).trim().replace(/\s+/g, ' ');
};

module.exports = { decodeParam, normaliseLeadText };
