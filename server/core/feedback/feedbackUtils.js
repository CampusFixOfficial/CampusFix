const TOPICS = new Set(['general', 'suggestion', 'system_issue', 'routing', 'coordination', 'usability']);
const SOURCES = new Set(['landing-page', 'student-portal', 'authority-portal', 'other']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePlatformFeedback(body = {}, user = null) {
  const message = String(body.message || '').trim();
  if (message.length < 8) return { valid: false, message: 'Add a little more detail before sending.' };
  if (message.length > 2000) return { valid: false, message: 'Keep feedback under 2,000 characters.' };
  const topic = TOPICS.has(body.topic) ? body.topic : 'general';
  const source = SOURCES.has(body.source) ? body.source : 'other';
  const role = user?.role;
  const senderType = role === 'student' ? 'student' : role === 'staff' ? 'authority' : role === 'admin' ? 'admin' : 'visitor';
  const contactEmail = senderType === 'visitor' ? String(body.contactEmail || '').trim().toLowerCase() : '';
  if (contactEmail && (!EMAIL_PATTERN.test(contactEmail) || contactEmail.length > 254)) {
    return { valid: false, message: 'Enter a valid email address or leave it blank.' };
  }
  return {
    valid: true,
    feedback: {
      topic,
      message,
      senderType,
      source,
      sender: user?._id || null,
      contactEmail,
    },
  };
}

module.exports = { validatePlatformFeedback, TOPICS, SOURCES };
