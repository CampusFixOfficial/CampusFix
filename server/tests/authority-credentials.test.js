const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyAuthorityCredentials } = require('../core/auth/authorityCredentials');

const authority = {
  employeeId: 'EMP-204',
  department: { name: 'Housekeeping & Hygiene' },
};

test('accepts an Authority ID and assigned department regardless of letter case or surrounding spaces', () => {
  assert.equal(verifyAuthorityCredentials(authority, ' emp-204 ', ' housekeeping & hygiene '), true);
});

test('rejects selecting a department that is not assigned to the Authority account', () => {
  assert.equal(verifyAuthorityCredentials(authority, 'EMP-204', 'Technical & Maintenance'), false);
});

test('rejects a missing or mismatched employee ID', () => {
  assert.equal(verifyAuthorityCredentials(authority, '', 'Housekeeping & Hygiene'), false);
  assert.equal(verifyAuthorityCredentials(authority, 'EMP-205', 'Housekeeping & Hygiene'), false);
});
