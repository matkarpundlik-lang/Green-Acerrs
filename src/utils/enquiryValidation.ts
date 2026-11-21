export type EnquiryType = 'private-viewing' | 'brochure-dossier';

export interface EnquiryInput {
  fullName: string;
  email: string;
  phone: string;
  pincode?: string;
  message?: string;
  enquiryType: EnquiryType;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof EnquiryInput, string>>;
  sanitized: EnquiryInput;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/[^\d+]/g, '').trim();
}

export function validateEnquiryInput(input: Partial<EnquiryInput>): ValidationResult {
  const fullName = (input.fullName ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();
  const phone = normalizePhone(input.phone ?? '');
  const pincode = (input.pincode ?? '').trim();
  const message = (input.message ?? '').trim();
  const enquiryType: EnquiryType =
    input.enquiryType === 'brochure-dossier' ? 'brochure-dossier' : 'private-viewing';

  const errors: Partial<Record<keyof EnquiryInput, string>> = {};

  if (fullName.length < 2) {
    errors.fullName = 'Please enter your full name (minimum 2 characters).';
  } else if (fullName.length > 120) {
    errors.fullName = 'Full name must be under 120 characters.';
  }

  if (!email) {
    errors.email = 'Please enter a valid email address.';
  } else if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    errors.email = 'Please provide a properly formatted email address.';
  }

  const digitCount = phone.replace(/\D/g, '').length;
  if (digitCount < 8 || digitCount > 15) {
    errors.phone = 'Please provide a valid contact number (8 to 15 digits).';
  }

  if (pincode && !/^[A-Za-z0-9\-\s]{4,12}$/.test(pincode)) {
    errors.pincode = 'Please enter a valid postal / pincode.';
  }

  if (message.length > 1000) {
    errors.message = 'Message must be 1,000 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      fullName,
      email,
      phone,
      pincode,
      message,
      enquiryType,
    },
  };
}

export function formatEnquiryReference(idSeed: number, timestampMs: number): string {
  const suffix = String(Math.abs(idSeed) % 10000).padStart(4, '0');
  const datePart = new Date(timestampMs).toISOString().slice(2, 10).replace(/-/g, '');
  return `GA-${datePart}-${suffix}`;
}
