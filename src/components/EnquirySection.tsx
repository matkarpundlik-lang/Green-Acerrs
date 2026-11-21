import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PROJECT_META } from '../data/projectData';
import {
  validateEnquiryInput,
  type EnquiryInput,
  type EnquiryType,
} from '../utils/enquiryValidation';

interface SubmittedReceipt {
  reference: string;
  fullName: string;
  enquiryType: EnquiryType;
  submittedAt: string;
}

export function EnquirySection() {
  const [enquiryType, setEnquiryType] = useState<EnquiryType>('private-viewing');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [message, setMessage] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof EnquiryInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmittedReceipt | null>(null);

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validation = validateEnquiryInput({
      fullName,
      email,
      phone,
      pincode,
      message,
      enquiryType,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.sanitized),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.errors) {
          setFieldErrors(payload.errors);
        }
        setServerError(
          payload.message ?? 'Unable to record your enquiry at this time. Please retry.'
        );
        return;
      }

      setReceipt({
        reference: payload.reference,
        fullName: payload.fullName,
        enquiryType: payload.enquiryType,
        submittedAt: payload.submittedAt,
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setPincode('');
      setMessage('');
    } catch {
      setServerError('Network error while submitting your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="enquiry"
      className="scroll-mt-20 bg-[#29353d] px-4 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-[1380px] bg-[#0e2226] border border-[#cbb389]/25 p-6 sm:p-10 lg:p-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Editorial Call to Action & Verified Address Block */}
          <div className="flex flex-col justify-between gap-8 lg:col-span-5">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
                10 · Private Registration
              </p>
              <h2 className="mt-4 font-serif text-[clamp(2.4rem,4.5vw,4rem)] font-normal leading-[1.04] text-[#f4efe6]">
                Arrange a confidential viewing.
              </h2>
              <p className="mt-5 text-sm sm:text-base font-light leading-[1.8] text-[#c8c4bc]">
                Because only five full-floor sky estates compose {PROJECT_META.officialBrand},
                consultations, RERA floor dossiers, and site previews on Nargis Dutt Road are
                scheduled strictly by prior appointment.
              </p>
            </div>

            <div className="space-y-4 border-t border-[#f4efe6]/12 pt-6">
              <div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-[#cbb389]">
                  Site & Appointment Protocol
                </div>
                <p className="mt-1.5 text-sm font-light leading-relaxed text-[#f4efe6]/90">
                  {PROJECT_META.addressLine1}, {PROJECT_META.addressLine2}
                </p>
              </div>
              <div className="space-y-2 border-t border-[#f4efe6]/12 pt-5 text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
                <div>
                  <span className="text-[#cbb389]">Developer · </span>
                  <span className="text-[#f4efe6]">{PROJECT_META.developer}</span>
                </div>
                <div>
                  <span className="text-[#cbb389]">MahaRERA · </span>
                  <span className="font-mono text-[#f4efe6]">{PROJECT_META.mahareraNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form / Confirmation Panel */}
          <div className="bg-[#132b30] border border-[#f4efe6]/12 p-6 sm:p-10 lg:col-span-7">
            {receipt ? (
              <div className="flex h-full flex-col justify-between gap-8 py-4">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase text-[#cbb389]">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                    <span>Registration Recorded</span>
                  </div>
                  <h3 className="font-serif text-3xl text-[#f4efe6]">
                    Thank you, {receipt.fullName}.
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-[#c8c4bc]">
                    Your{' '}
                    {receipt.enquiryType === 'brochure-dossier'
                      ? 'official project dossier request'
                      : 'private viewing enquiry'}{' '}
                    for {PROJECT_META.officialBrand} has been logged with our advisory desk.
                  </p>
                </div>

                <dl className="grid grid-cols-1 gap-4 border-y border-[#f4efe6]/15 py-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
                      Reference Number
                    </dt>
                    <dd className="mt-1 font-mono text-base text-[#cbb389]">
                      {receipt.reference}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
                      Recorded Timestamp
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-[#f4efe6]">
                      {new Date(receipt.submittedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="inline-flex h-11 items-center justify-center border border-[#cbb389]/60 px-6 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6] transition-colors hover:bg-[#cbb389] hover:text-[#0e2226]"
                  >
                    Submit Another Enquiry
                  </button>
                  <a
                    href={PROJECT_META.officialWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs tracking-[0.16em] uppercase text-[#cbb389] underline underline-offset-4 hover:text-[#f4efe6]"
                  >
                    Visit Official Site
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} noValidate className="space-y-6">
                {/* Enquiry Purpose Segmented Switch */}
                <div>
                  <span className="block text-xs font-medium tracking-[0.16em] uppercase text-[#c8c4bc]">
                    Enquiry Purpose
                  </span>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setEnquiryType('private-viewing')}
                      className={`h-11 border px-4 text-xs font-medium tracking-[0.14em] uppercase transition-colors ${
                        enquiryType === 'private-viewing'
                          ? 'border-[#cbb389] bg-[#cbb389] text-[#0e2226]'
                          : 'border-[#f4efe6]/20 bg-[#0e2226]/50 text-[#f4efe6] hover:border-[#cbb389]/60'
                      }`}
                    >
                      Private Viewing Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiryType('brochure-dossier')}
                      className={`h-11 border px-4 text-xs font-medium tracking-[0.14em] uppercase transition-colors ${
                        enquiryType === 'brochure-dossier'
                          ? 'border-[#cbb389] bg-[#cbb389] text-[#0e2226]'
                          : 'border-[#f4efe6]/20 bg-[#0e2226]/50 text-[#f4efe6] hover:border-[#cbb389]/60'
                      }`}
                    >
                      Request Official Dossier
                    </button>
                  </div>
                </div>

                {serverError && (
                  <div
                    role="alert"
                    className="border border-red-400/50 bg-red-950/40 px-4 py-3 text-xs text-red-200"
                  >
                    {serverError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="enquiry-name"
                      className="block text-xs tracking-[0.14em] uppercase text-[#c8c4bc]"
                    >
                      Full Name *
                    </label>
                    <input
                      id="enquiry-name"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikramaditya Rao"
                      className="mt-2 h-11 w-full border border-[#f4efe6]/20 bg-[#0e2226]/70 px-3.5 text-sm text-[#f4efe6] placeholder:text-[#93a1aa]/60 focus:border-[#cbb389] focus:outline-none"
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1.5 text-xs text-amber-300">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="enquiry-email"
                      className="block text-xs tracking-[0.14em] uppercase text-[#c8c4bc]"
                    >
                      Email Address *
                    </label>
                    <input
                      id="enquiry-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="mt-2 h-11 w-full border border-[#f4efe6]/20 bg-[#0e2226]/70 px-3.5 text-sm text-[#f4efe6] placeholder:text-[#93a1aa]/60 focus:border-[#cbb389] focus:outline-none"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1.5 text-xs text-amber-300">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="enquiry-phone"
                      className="block text-xs tracking-[0.14em] uppercase text-[#c8c4bc]"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="enquiry-phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98XXX XXXXX"
                      className="mt-2 h-11 w-full border border-[#f4efe6]/20 bg-[#0e2226]/70 px-3.5 text-sm text-[#f4efe6] placeholder:text-[#93a1aa]/60 focus:border-[#cbb389] focus:outline-none"
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1.5 text-xs text-amber-300">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="enquiry-pincode"
                      className="block text-xs tracking-[0.14em] uppercase text-[#c8c4bc]"
                    >
                      Postal / Pincode
                    </label>
                    <input
                      id="enquiry-pincode"
                      name="pincode"
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="400050"
                      className="mt-2 h-11 w-full border border-[#f4efe6]/20 bg-[#0e2226]/70 px-3.5 text-sm text-[#f4efe6] placeholder:text-[#93a1aa]/60 focus:border-[#cbb389] focus:outline-none"
                    />
                    {fieldErrors.pincode && (
                      <p className="mt-1.5 text-xs text-amber-300">{fieldErrors.pincode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="enquiry-message"
                    className="block text-xs tracking-[0.14em] uppercase text-[#c8c4bc]"
                  >
                    Requirements or Preferred Viewing Window
                  </label>
                  <textarea
                    id="enquiry-message"
                    name="message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your preferred schedule or specific questions..."
                    className="mt-2 w-full border border-[#f4efe6]/20 bg-[#0e2226]/70 p-3.5 text-sm text-[#f4efe6] placeholder:text-[#93a1aa]/60 focus:border-[#cbb389] focus:outline-none"
                  />
                  {fieldErrors.message && (
                    <p className="mt-1.5 text-xs text-amber-300">{fieldErrors.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-light text-[#93a1aa]">
                    Your details are stored securely for Paradigm Realty advisory follow-up.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 shrink-0 items-center justify-center bg-[#cbb389] px-8 text-xs font-semibold tracking-[0.18em] uppercase text-[#0e2226] transition-colors hover:bg-[#dcc7a0] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
