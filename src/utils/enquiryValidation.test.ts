import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEnquiryInput,
  normalizePhone,
  formatEnquiryReference,
} from './enquiryValidation';

test('normalizePhone strips formatting characters while retaining digits and leading plus', () => {
  assert.equal(normalizePhone('+91 98200-12345'), '+919820012345');
  assert.equal(normalizePhone('(022) 2640-1122'), '02226401122');
});

test('validateEnquiryInput accepts valid private viewing enquiry and sanitizes fields', () => {
  const result = validateEnquiryInput({
    fullName: '  Aarav Mehta  ',
    email: 'Aarav.Mehta@Example.COM ',
    phone: '+91 98201 55432',
    pincode: '400050',
    message: 'Interested in full-floor residence availability.',
    enquiryType: 'private-viewing',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.equal(result.sanitized.fullName, 'Aarav Mehta');
  assert.equal(result.sanitized.email, 'aarav.mehta@example.com');
  assert.equal(result.sanitized.phone, '+919820155432');
  assert.equal(result.sanitized.enquiryType, 'private-viewing');
});

test('validateEnquiryInput rejects missing or malformed required fields', () => {
  const result = validateEnquiryInput({
    fullName: 'A',
    email: 'invalid-email',
    phone: '123',
    pincode: '!!',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.fullName);
  assert.ok(result.errors.email);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.pincode);
});

test('formatEnquiryReference produces deterministic structured reference codes', () => {
  const ts = Date.UTC(2026, 10, 21, 12, 0, 0);
  assert.equal(formatEnquiryReference(42, ts), 'GA-261121-0042');
});
