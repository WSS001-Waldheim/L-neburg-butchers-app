/**
 * POP partner application types.
 * Separate from customer registration. Approve → PopLocation.isActive.
 * See docs/pop-partner-applications.md
 */

export type PopPartnerApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

/** Admin queue focuses on these. */
export const PENDING_APPLICATION_STATUSES: readonly PopPartnerApplicationStatus[] =
  ['pending_review'] as const;

/** Terminal statuses — no further applicant edits in v1. */
export const TERMINAL_APPLICATION_STATUSES: readonly PopPartnerApplicationStatus[] =
  ['approved', 'rejected', 'withdrawn'] as const;

export type PopPartnerApplicationAddress = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
  geo?: { lat: number; lng: number };
};

export type PopPartnerApplicationContact = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

/**
 * Full application row. Required at submit: businessName + address + contact.
 */
export type PopPartnerApplication = PopPartnerApplicationAddress &
  PopPartnerApplicationContact & {
    id: string;
    status: PopPartnerApplicationStatus;
    businessName: string;
    notes?: string;
    proposedHoursNote?: string;
    applicantUserId?: string;
    /** Set when approved (new location or linked inactive stub). */
    linkedPopId?: string;
    reviewedByUserId?: string;
    reviewedAt?: string;
    /** Required on reject. */
    reviewNote?: string;
    createdAt: string;
    updatedAt: string;
  };

/** Payload for POST /partner/applications (no status — server sets pending_review). */
export type PopPartnerApplicationSubmitInput = {
  businessName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
  geo?: { lat: number; lng: number };
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes?: string;
  proposedHoursNote?: string;
};

export type ApprovePartnerApplicationInput = {
  /** Link to existing inactive stub, or omit to create from application. */
  linkedPopId?: string;
  phase?: 'P1' | 'P2' | 'P3';
  reviewNote?: string;
};

export type RejectPartnerApplicationInput = {
  /** Required. */
  reviewNote: string;
};
