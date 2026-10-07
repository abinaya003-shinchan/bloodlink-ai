export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UserRole = 'DONOR' | 'HOSPITAL' | 'ADMIN';

export type DonorStatus =
  | 'Pending Verification'
  | 'Verified'
  | 'Available'
  | 'Temporarily Unavailable'
  | 'Recently Donated'
  | 'Suspended';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type RequestUrgency = 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type RequestStatus =
  | 'Open'
  | 'Matching'
  | 'Donors Notified'
  | 'Donor Responded'
  | 'Fulfilled'
  | 'Cancelled'
  | 'Expired';

export type DonorResponseType = 'I CAN DONATE' | 'NOT AVAILABLE' | 'MAYBE LATER';

export interface LocationCoordinates {
  lat?: number;
  lng?: number;
  address?: string;
  district?: string;
  city?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Donor {
  id: string; // DNR-2026-XXXX or DEMO-DNR-XXXX
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: BloodGroup;
  district: string;
  city: string;
  location: LocationCoordinates;
  emergencyAvailable: boolean;
  preferredLanguage: 'en' | 'ta';
  lastDonationDate: string | null;
  consent: boolean;
  status: DonorStatus;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  isDemo: boolean;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  profileCompleteness: number; // percentage 0 - 100
  phoneVerified?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string; // HSP-2026-XXXX or DEMO-HSP-XXXX
  userId: string;
  hospitalName: string;
  authorizedContact: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  location: LocationCoordinates;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface BloodRequest {
  id: string; // REQ-2026-XXXX
  hospitalId: string;
  hospitalName: string;
  hospitalPhone: string;
  hospitalLocation: LocationCoordinates;
  patientRef: string;
  requiredBloodGroup: BloodGroup;
  unitsRequired: number;
  urgency: RequestUrgency;
  requiredDateTime: string;
  contactNumber: string;
  additionalNotes?: string;
  status: RequestStatus;
  aiAnalysis?: {
    clinicalPriority?: string;
    donorSearchSummary?: string;
    compatibilityGuidance?: string;
    recommendedUrgencyScore?: number;
  };
  notifiedDonorsCount?: number;
  responsesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientDonorId: string;
  bloodRequestId: string;
  title: string;
  message: string;
  urgency: RequestUrgency;
  requiredBloodGroup: BloodGroup;
  hospitalName: string;
  approxDistanceKm?: number;
  unitsRequired: number;
  status: 'NOTIFIED' | 'VIEWED' | 'RESPONDED' | 'DELIVERED' | 'READ';
  responseOption?: DonorResponseType;
  respondedAt?: string;
  deliveryChannel: 'IN_APP' | 'SMS' | 'IN_APP_AND_SMS';
  smsStatus?: 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'PENDING' | 'SKIPPED';
  smsRecipientPhone?: string;
  smsError?: string;
  smsSentAt?: string;
  smsMessageBody?: string;
  responseUrl?: string;
  createdAt: string;
}

export interface DonorResponse {
  id: string;
  bloodRequestId: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  donorPhone?: string; // Only revealed to authorized hospital after donor opts in
  response: DonorResponseType;
  distanceKm?: number;
  notes?: string;
  respondedAt: string;
  responseChannel?: 'IN_APP' | 'SMS_LINK';
}

export interface VerificationRecord {
  id: string;
  targetType: 'DONOR' | 'HOSPITAL';
  targetId: string;
  targetName: string;
  action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'FLAGGED_SUSPICIOUS';
  adminUserId: string;
  reason: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  actorRole: 'DONOR' | 'HOSPITAL' | 'ADMIN' | 'SYSTEM';
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DonorMatchResult {
  donorId: string;
  displayName: string;
  bloodGroup: BloodGroup;
  verificationStatus: VerificationStatus;
  availability: DonorStatus;
  distanceKm: number | null;
  distanceDisplay: string;
  matchScore: number; // 0 to 100
  isCompatible: boolean;
  compatibilityDetail: string;
  reasons: string[];
  isDemo: boolean;
  emergencyAvailable: boolean;
  profileCompleteness: number;
  lastDonationDate: string | null;
  daysSinceLastDonation: number | null;
  isMedicallyEligibleTiming: boolean;
}

export interface EmergencyRequestSummary {
  requestId: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  hospitalName: string;
  hospitalPhone: string;
  hospitalDistrict?: string;
  hospitalCity?: string;
  requiredBloodGroup: BloodGroup;
  unitsRequired: number;
  urgency: string;
  requiredDateTime: string;
  additionalNotes?: string;
  hasResponded: boolean;
  existingResponse?: string;
  respondedAt?: string;
}
