/**
 * safeEncode
 *
 * Encodes a string for use as a URL *path* segment.
 * Plain encodeURIComponent encodes '/' as '%2F', but many HTTP servers
 * (including Node/Express) treat '%2F' in a path as a literal slash and
 * split the route there.  Double-encoding it to '%252F' prevents that:
 *   '/' → encodeURIComponent → '%2F' → replace → '%252F'
 * Express then decodes '%25' → '%', leaving '%2F' in req.params.
 * The controller calls decodeURIComponent once more to recover the '/'.
 */
export const safeEncode = (str) =>
  encodeURIComponent(str ?? '').replace(/%2F/gi, '%252F');
