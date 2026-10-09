const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePlatformFeedback, SOURCES } = require('../core/feedback/feedbackUtils');

test('platform feedback derives sender identity from authenticated roles, not submitted fields', () => {
  const result = validatePlatformFeedback({ message: 'Routing is clear.', senderType: 'admin', sender: 'forged' }, { _id: 'u1', role: 'staff' });
  assert.equal(result.valid, true);
  assert.equal(result.feedback.senderType, 'authority');
  assert.equal(result.feedback.sender, 'u1');
  assert.equal(result.feedback.contactEmail, '');
});

test('unauthenticated platform feedback is attributed to a visitor and accepts optional reply email', () => {
  const result = validatePlatformFeedback({ topic: 'suggestion', message: 'Please add a simpler filter.', contactEmail: 'Guest@Example.com' });
  assert.equal(result.valid, true);
  assert.equal(result.feedback.senderType, 'visitor');
  assert.equal(result.feedback.contactEmail, 'guest@example.com');
});

test('feedback rejects too-short/too-long messages and invalid guest email', () => {
  assert.equal(validatePlatformFeedback({ message: 'short' }).valid, false);
  assert.equal(validatePlatformFeedback({ message: 'x'.repeat(2001) }).valid, false);
  assert.equal(validatePlatformFeedback({ message: 'A useful note.', contactEmail: 'not-an-email' }).valid, false);
});

test('unrecognized topic is safely stored as general', () => {
  const result = validatePlatformFeedback({ topic: 'secret_internal', message: 'A helpful note.' });
  assert.equal(result.valid, true);
  assert.equal(result.feedback.topic, 'general');
});

test('landing, student and Authority platform feedback origins are allow-listed and preserved', () => {
  assert.deepEqual([...SOURCES], ['landing-page', 'student-portal', 'authority-portal', 'other']);
  for (const source of ['landing-page', 'student-portal', 'authority-portal']) {
    const result = validatePlatformFeedback({ source, message: 'A useful CampusFix improvement.' });
    assert.equal(result.valid, true);
    assert.equal(result.feedback.source, source);
  }
});
