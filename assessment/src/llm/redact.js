// Simple redaction helpers
export function redact(text){
  if(!text) return text;
  let t = String(text);
  // emails
  t = t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
  // IPs
  t = t.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[redacted-ip]");
  // phones
  t = t.replace(/\+?\d[\d\s().-]{6,}\d/g, "[redacted-phone]");
  return t;
}
