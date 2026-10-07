import fs from 'fs';
import path from 'path';
import {
  AuditLog,
  BloodGroup,
  BloodRequest,
  Donor,
  DonorResponse,
  Hospital,
  Notification,
  User,
  VerificationRecord,
  DonorStatus,
  VerificationStatus,
} from '../src/types';

/**
 * =========================================================================
 * ARCHITECTURE & PERSISTENCE NOTE (Render / Cloud Deployment Compatibility)
 * =========================================================================
 * Storage Engine: Atomic file-based JSON persistence in `data/db.json` with temporary
 * swap writes (temp file + atomic rename) to avoid concurrent write corruption.
 *
 * Cloud Hosting Note (e.g., Render, Railway, Fly.io, Heroku):
 * Standard cloud web services use ephemeral dyno containers where files written
 * to disk are discarded upon server restarts or code redeployments.
 * For production environments on Render:
 * 1. Attach a Persistent Disk (mount path: /data) to retain `db.json` across deploys.
 * 2. Or configure a managed PostgreSQL / Firestore database service when migrating
 *    to enterprise scale.
 *
 * For local and current containerized environments, atomic JSON persistence ensures
 * instant startup, zero external credentials dependency, and seamless demo data integrity.
 * =========================================================================
 */

interface DatabaseSchema {
  users: User[];
  donors: Donor[];
  hospitals: Hospital[];
  bloodRequests: BloodRequest[];
  notifications: Notification[];
  donorResponses: DonorResponse[];
  verificationRecords: VerificationRecord[];
  auditLogs: AuditLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

// Calculate profile completeness percentage (0 to 100)
export function calculateProfileCompleteness(data: Partial<Donor>): number {
  let score = 0;
  if (data.fullName && data.fullName.trim().length >= 3) score += 10;
  if (data.phone && /^[+0-9\s-]{7,15}$/.test(data.phone.trim())) score += 10;
  if (data.email && data.email.includes('@')) score += 10;
  if (data.dob && (data.age ?? 0) >= 18 && (data.age ?? 0) <= 65) score += 10;
  if (data.gender) score += 10;
  if (data.bloodGroup) score += 10;
  if (data.district && data.district.trim().length > 1) score += 10;
  if (data.city && data.city.trim().length > 1) score += 10;
  if (data.location && (data.location.address || (data.location.lat && data.location.lng))) score += 10;
  if (data.emergencyAvailable !== undefined) score += 5;
  if (data.consent === true) score += 5;

  return Math.min(100, score);
}

// Initial DEMO seed data, clearly tagged as DEMO
function createInitialSeedData(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'USR-ADMIN-001',
      email: 'admin@bloodlink.org',
      role: 'ADMIN',
      name: 'System Admin [DEMO]',
      phone: '+91 94444 00001',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'USR-HSP-001',
      email: 'hospital@bloodlink.org',
      role: 'HOSPITAL',
      name: 'Dr. Aruna (City Hospital) [DEMO]',
      phone: '+91 94444 00002',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'USR-DNR-001',
      email: 'donor@bloodlink.org',
      role: 'DONOR',
      name: 'Karthik Raja [DEMO]',
      phone: '+91 98888 11111',
      createdAt: new Date().toISOString(),
    },
  ];

  const hospitals: Hospital[] = [
    {
      id: 'DEMO-HSP-101',
      userId: 'USR-HSP-001',
      hospitalName: 'City General Hospital & Trauma Center [DEMO]',
      authorizedContact: 'Dr. Aruna Sundaram (Chief Medical Officer)',
      phone: '+91 94444 00002',
      email: 'hospital@bloodlink.org',
      address: 'No. 45, Anna Salai, Chennai, Tamil Nadu - 600002',
      district: 'Chennai',
      city: 'Chennai',
      location: {
        lat: 13.0827,
        lng: 80.2707,
        address: 'No. 45, Anna Salai, Chennai',
        district: 'Chennai',
        city: 'Chennai',
      },
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      isDemo: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'DEMO-HSP-102',
      userId: 'USR-HSP-002',
      hospitalName: 'Apollo Emergency Blood Bank [DEMO]',
      authorizedContact: 'Dr. Ramesh Kumar (Blood Bank Director)',
      phone: '+91 94444 00003',
      email: 'apollo_demo@bloodlink.org',
      address: '21 Greams Lane, Thousand Lights, Chennai',
      district: 'Chennai',
      city: 'Chennai',
      location: {
        lat: 13.0617,
        lng: 80.2505,
        address: '21 Greams Lane, Thousand Lights',
        district: 'Chennai',
        city: 'Chennai',
      },
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      isDemo: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  const donors: Donor[] = [
    {
      id: 'DEMO-DNR-001',
      userId: 'USR-DNR-001',
      fullName: 'Karthik Raja [DEMO]',
      phone: '+91 98888 11111',
      email: 'donor@bloodlink.org',
      dob: '1995-04-12',
      age: 31,
      gender: 'Male',
      bloodGroup: 'O-', // Universal RBC donor!
      district: 'Chennai',
      city: 'Egmore',
      location: {
        lat: 13.0784,
        lng: 80.2608,
        address: 'Gandhi Irwin Rd, Egmore, Chennai (~1.2 km)',
        district: 'Chennai',
        city: 'Egmore',
      },
      emergencyAvailable: true,
      preferredLanguage: 'ta',
      lastDonationDate: '2026-05-10', // > 90 days ago
      consent: true,
      status: 'Available',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      verifiedBy: 'USR-ADMIN-001',
      verificationNotes: 'Govt photo ID verified. Medical history cleared.',
      isDemo: true,
      profileCompleteness: 100,
      phoneVerified: true,
      emailVerified: true,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'DEMO-DNR-002',
      userId: 'USR-DNR-002',
      fullName: 'Dr. Priya V. [DEMO]',
      phone: '+91 98888 22222',
      email: 'priya_demo@bloodlink.org',
      dob: '1992-09-18',
      age: 33,
      gender: 'Female',
      bloodGroup: 'A+',
      district: 'Chennai',
      city: 'Nungambakkam',
      location: {
        lat: 13.0594,
        lng: 80.2425,
        address: 'College Road, Nungambakkam (~3.5 km)',
        district: 'Chennai',
        city: 'Nungambakkam',
      },
      emergencyAvailable: true,
      preferredLanguage: 'en',
      lastDonationDate: '2026-06-01',
      consent: true,
      status: 'Available',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      verifiedBy: 'USR-ADMIN-001',
      isDemo: true,
      profileCompleteness: 100,
      phoneVerified: true,
      emailVerified: true,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'DEMO-DNR-003',
      userId: 'USR-DNR-003',
      fullName: 'Senthil Nathan [DEMO]',
      phone: '+91 98888 33333',
      email: 'senthil_demo@bloodlink.org',
      dob: '1998-11-04',
      age: 27,
      gender: 'Male',
      bloodGroup: 'O+',
      district: 'Chennai',
      city: 'T. Nagar',
      location: {
        lat: 13.0418,
        lng: 80.2341,
        address: 'Panagal Park, T. Nagar (~5.2 km)',
        district: 'Chennai',
        city: 'T. Nagar',
      },
      emergencyAvailable: true,
      preferredLanguage: 'ta',
      lastDonationDate: '2026-03-15',
      consent: true,
      status: 'Available',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      verifiedBy: 'USR-ADMIN-001',
      isDemo: true,
      profileCompleteness: 100,
      phoneVerified: true,
      emailVerified: true,
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'DEMO-DNR-004',
      userId: 'USR-DNR-004',
      fullName: 'Aravind Swamy [DEMO]',
      phone: '+91 98888 44444',
      email: 'aravind_demo@bloodlink.org',
      dob: '2001-02-14',
      age: 25,
      gender: 'Male',
      bloodGroup: 'B+',
      district: 'Chennai',
      city: 'Mylapore',
      location: {
        lat: 13.0368,
        lng: 80.2676,
        address: 'Luz Church Rd, Mylapore (~4.8 km)',
        district: 'Chennai',
        city: 'Mylapore',
      },
      emergencyAvailable: false,
      preferredLanguage: 'ta',
      lastDonationDate: '2026-09-20', // Only 15 days ago! Medically resting
      consent: true,
      status: 'Recently Donated',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      verifiedBy: 'USR-ADMIN-001',
      isDemo: true,
      profileCompleteness: 100,
      phoneVerified: true,
      emailVerified: true,
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'DEMO-DNR-005',
      userId: 'USR-DNR-005',
      fullName: 'Divya Bharathi [DEMO]',
      phone: '+91 98888 55555',
      email: 'divya_demo@bloodlink.org',
      dob: '2000-07-22',
      age: 26,
      gender: 'Female',
      bloodGroup: 'A-',
      district: 'Chennai',
      city: 'Guindy',
      location: {
        lat: 13.0067,
        lng: 80.2025,
        address: 'Guindy Industrial Estate (~9.5 km)',
        district: 'Chennai',
        city: 'Guindy',
      },
      emergencyAvailable: true,
      preferredLanguage: 'en',
      lastDonationDate: null,
      consent: true,
      status: 'Pending Verification',
      verificationStatus: 'PENDING',
      isDemo: true,
      profileCompleteness: 90,
      phoneVerified: false,
      emailVerified: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const bloodRequests: BloodRequest[] = [
    {
      id: 'DEMO-REQ-101',
      hospitalId: 'DEMO-HSP-101',
      hospitalName: 'City General Hospital & Trauma Center [DEMO]',
      hospitalPhone: '+91 94444 00002',
      hospitalLocation: {
        lat: 13.0827,
        lng: 80.2707,
        address: 'No. 45, Anna Salai, Chennai',
        district: 'Chennai',
        city: 'Chennai',
      },
      patientRef: 'Patient #EM-8492 (Trauma Surgery)',
      requiredBloodGroup: 'A+',
      unitsRequired: 2,
      urgency: 'EMERGENCY',
      requiredDateTime: 'Immediately / Within 2 hours',
      contactNumber: '+91 94444 00002',
      additionalNotes: 'Critical blunt trauma victim. ICU Ward 3. Blood matching in progress.',
      status: 'Donors Notified',
      notifiedDonorsCount: 2,
      responsesCount: 1,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'DEMO-NTF-101',
      recipientDonorId: 'DEMO-DNR-001',
      bloodRequestId: 'DEMO-REQ-101',
      title: 'EMERGENCY: Urgent Blood Request for A+ (O- Compatible)',
      message: 'City General Hospital urgently needs 2 units. You are a compatible emergency donor (1.2 km away).',
      urgency: 'EMERGENCY',
      requiredBloodGroup: 'A+',
      hospitalName: 'City General Hospital & Trauma Center [DEMO]',
      approxDistanceKm: 1.2,
      unitsRequired: 2,
      status: 'RESPONDED',
      responseOption: 'I CAN DONATE',
      respondedAt: new Date(Date.now() - 1800000).toISOString(),
      deliveryChannel: 'IN_APP',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'DEMO-NTF-102',
      recipientDonorId: 'DEMO-DNR-002',
      bloodRequestId: 'DEMO-REQ-101',
      title: 'EMERGENCY: Urgent Blood Request for A+',
      message: 'City General Hospital urgently needs 2 units. You are an exact match donor (3.5 km away).',
      urgency: 'EMERGENCY',
      requiredBloodGroup: 'A+',
      hospitalName: 'City General Hospital & Trauma Center [DEMO]',
      approxDistanceKm: 3.5,
      unitsRequired: 2,
      status: 'DELIVERED',
      deliveryChannel: 'IN_APP',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const donorResponses: DonorResponse[] = [
    {
      id: 'DEMO-RSP-101',
      bloodRequestId: 'DEMO-REQ-101',
      donorId: 'DEMO-DNR-001',
      donorName: 'Karthik Raja [DEMO]',
      donorBloodGroup: 'O-',
      donorPhone: '+91 98888 11111',
      response: 'I CAN DONATE',
      distanceKm: 1.2,
      notes: 'I am nearby in Egmore. Can reach within 20 minutes.',
      respondedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const verificationRecords: VerificationRecord[] = [
    {
      id: 'DEMO-VRF-001',
      targetType: 'DONOR',
      targetId: 'DEMO-DNR-001',
      targetName: 'Karthik Raja [DEMO]',
      action: 'VERIFIED',
      adminUserId: 'USR-ADMIN-001',
      reason: 'Valid Aadhaar / Driving License verified. Medical screening normal.',
      timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'DEMO-VRF-002',
      targetType: 'HOSPITAL',
      targetId: 'DEMO-HSP-101',
      targetName: 'City General Hospital [DEMO]',
      action: 'VERIFIED',
      adminUserId: 'USR-ADMIN-001',
      reason: 'State Health Dept license & Clinical Establishment registry verified.',
      timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'AUDIT-001',
      actorRole: 'SYSTEM',
      actorId: 'SYS',
      actorName: 'BloodLink AI Engine',
      action: 'SYSTEM_INITIALIZATION',
      details: 'Initial database bootstrap with verified schemas and demo reference records.',
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    users,
    donors,
    hospitals,
    bloodRequests,
    notifications,
    donorResponses,
    verificationRecords,
    auditLogs,
  };
}

class DatabaseService {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read db.json, initializing fresh database:', err);
    }

    const fresh = createInitialSeedData();
    this.save(fresh);
    return fresh;
  }

  private save(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error persisting database to disk:', err);
    }
  }

  public getSnapshot(): DatabaseSchema {
    return this.db;
  }

  public persist(): void {
    this.save(this.db);
  }

  // AUDIT LOGGING
  public addAuditLog(
    actorRole: 'DONOR' | 'HOSPITAL' | 'ADMIN' | 'SYSTEM',
    actorId: string,
    actorName: string,
    action: string,
    details: string
  ): AuditLog {
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorRole,
      actorId,
      actorName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(log);
    // Keep last 500 audit logs
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs.pop();
    }
    this.persist();
    return log;
  }

  // DUPLICATE & SUSPICIOUS DETECTION
  public detectDuplicates(
    phone: string,
    email: string,
    excludeDonorId?: string
  ): { isDuplicate: boolean; isSuspicious: boolean; reason?: string } {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    for (const d of this.db.donors) {
      if (excludeDonorId && d.id === excludeDonorId) continue;

      const otherPhone = d.phone.replace(/[^0-9]/g, '');
      const otherEmail = d.email.trim().toLowerCase();

      if (cleanPhone && otherPhone && cleanPhone === otherPhone) {
        return {
          isDuplicate: true,
          isSuspicious: true,
          reason: `Phone number ${phone} is already registered under Donor ID ${d.id} (${d.fullName}).`,
        };
      }

      if (cleanEmail && otherEmail && cleanEmail === otherEmail) {
        return {
          isDuplicate: true,
          isSuspicious: true,
          reason: `Email address ${email} is already registered under Donor ID ${d.id} (${d.fullName}).`,
        };
      }
    }

    return { isDuplicate: false, isSuspicious: false };
  }

  // HOSPITAL DUPLICATE DETECTION
  public detectDuplicateHospital(
    phone: string,
    email: string,
    excludeHospitalId?: string
  ): { isDuplicate: boolean; reason?: string } {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    for (const h of this.db.hospitals) {
      if (excludeHospitalId && h.id === excludeHospitalId) continue;

      const otherPhone = h.phone.replace(/[^0-9]/g, '');
      const otherEmail = h.email.trim().toLowerCase();

      if (cleanPhone && otherPhone && cleanPhone === otherPhone) {
        return {
          isDuplicate: true,
          reason: `Hospital contact phone ${phone} is already registered under Hospital ID ${h.id} (${h.hospitalName}).`,
        };
      }

      if (cleanEmail && otherEmail && cleanEmail === otherEmail) {
        return {
          isDuplicate: true,
          reason: `Hospital email ${email} is already registered under Hospital ID ${h.id} (${h.hospitalName}).`,
        };
      }
    }

    return { isDuplicate: false };
  }

  // DONORS
  public getAllDonors(): Donor[] {
    return this.db.donors;
  }

  public getDonorById(id: string): Donor | undefined {
    return this.db.donors.find((d) => d.id === id);
  }

  public getDonorByUserId(userId: string): Donor | undefined {
    return this.db.donors.find((d) => d.userId === userId);
  }

  public createDonor(donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt' | 'profileCompleteness'>): Donor {
    const completeness = calculateProfileCompleteness(donorData);
    const newId = `DNR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newDonor: Donor = {
      ...donorData,
      id: newId,
      profileCompleteness: completeness,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Flag if duplicate found
    const dupCheck = this.detectDuplicates(donorData.phone, donorData.email);
    if (dupCheck.isSuspicious) {
      newDonor.isSuspicious = true;
      newDonor.suspiciousReason = dupCheck.reason;
    }

    this.db.donors.unshift(newDonor);
    this.addAuditLog('DONOR', newDonor.id, newDonor.fullName, 'DONOR_REGISTERED', `New donor registered. Completeness: ${completeness}%. Status: ${newDonor.status}`);
    this.persist();
    return newDonor;
  }

  public updateDonor(id: string, updates: Partial<Donor>, actorName: string = 'User'): Donor | null {
    const idx = this.db.donors.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    const existing = this.db.donors[idx];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    updated.profileCompleteness = calculateProfileCompleteness(updated);

    // Prevent incomplete profiles from becoming Verified
    if (updated.verificationStatus === 'VERIFIED' && updated.profileCompleteness < 90) {
      updated.verificationStatus = 'PENDING';
      updated.status = 'Pending Verification';
    }

    this.db.donors[idx] = updated;
    this.addAuditLog('DONOR', id, updated.fullName, 'DONOR_UPDATED', `Updated profile fields: ${Object.keys(updates).join(', ')}`);
    this.persist();
    return updated;
  }

  // HOSPITALS
  public getAllHospitals(): Hospital[] {
    return this.db.hospitals;
  }

  public getHospitalById(id: string): Hospital | undefined {
    return this.db.hospitals.find((h) => h.id === id);
  }

  public getHospitalByUserId(userId: string): Hospital | undefined {
    return this.db.hospitals.find((h) => h.userId === userId);
  }

  public createHospital(hospData: Omit<Hospital, 'id' | 'createdAt'>): Hospital {
    const newId = `HSP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newHospital: Hospital = {
      ...hospData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    this.db.hospitals.unshift(newHospital);
    this.addAuditLog('HOSPITAL', newHospital.id, newHospital.hospitalName, 'HOSPITAL_REGISTERED', `Hospital registered. Verification: ${newHospital.verificationStatus}`);
    this.persist();
    return newHospital;
  }

  public updateHospital(id: string, updates: Partial<Hospital>): Hospital | null {
    const idx = this.db.hospitals.findIndex((h) => h.id === id);
    if (idx === -1) return null;

    this.db.hospitals[idx] = { ...this.db.hospitals[idx], ...updates };
    this.persist();
    return this.db.hospitals[idx];
  }

  // USERS
  public getUserById(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.users.push(newUser);
    this.persist();
    return newUser;
  }

  // BLOOD REQUESTS
  public getAllBloodRequests(): BloodRequest[] {
    return this.db.bloodRequests;
  }

  public getBloodRequestById(id: string): BloodRequest | undefined {
    return this.db.bloodRequests.find((r) => r.id === id);
  }

  public createBloodRequest(reqData: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt'>): BloodRequest {
    const newId = `REQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRequest: BloodRequest = {
      ...reqData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.bloodRequests.unshift(newRequest);
    this.addAuditLog('HOSPITAL', reqData.hospitalId, reqData.hospitalName, 'BLOOD_REQUEST_CREATED', `Blood Request ${newId} created: ${reqData.unitsRequired} units of ${reqData.requiredBloodGroup} (${reqData.urgency})`);
    this.persist();
    return newRequest;
  }

  public updateBloodRequest(id: string, updates: Partial<BloodRequest>): BloodRequest | null {
    const idx = this.db.bloodRequests.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const existing = this.db.bloodRequests[idx];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.db.bloodRequests[idx] = updated;
    this.persist();
    return updated;
  }

  // NOTIFICATIONS
  public getNotificationsForDonor(donorId: string): Notification[] {
    return this.db.notifications.filter((n) => n.recipientDonorId === donorId);
  }

  public isDonorAlreadyAlertedOrResponded(donorId: string, bloodRequestId: string): boolean {
    const hasResponded = this.db.donorResponses.some(
      (r) => r.donorId === donorId && r.bloodRequestId === bloodRequestId
    );
    if (hasResponded) return true;

    const hasNotif = this.db.notifications.some(
      (n) => n.recipientDonorId === donorId && n.bloodRequestId === bloodRequestId
    );
    return hasNotif;
  }

  public getDonorResponseForRequest(donorId: string, bloodRequestId: string): DonorResponse | undefined {
    return this.db.donorResponses.find(
      (r) => r.donorId === donorId && r.bloodRequestId === bloodRequestId
    );
  }

  public createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const notif: Notification = {
      ...data,
      id: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public markNotificationViewed(notificationId: string): Notification | null {
    const idx = this.db.notifications.findIndex((n) => n.id === notificationId);
    if (idx === -1) return null;
    const current = this.db.notifications[idx];
    if (current.status === 'NOTIFIED' || (current.status as string) === 'DELIVERED') {
      this.db.notifications[idx] = { ...current, status: 'VIEWED' };
      this.persist();
    }
    return this.db.notifications[idx];
  }

  public updateNotification(id: string, updates: Partial<Notification>): Notification | null {
    const idx = this.db.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    this.db.notifications[idx] = { ...this.db.notifications[idx], ...updates };
    this.persist();
    return this.db.notifications[idx];
  }

  // DONOR RESPONSES
  public getResponsesForRequest(requestId: string): DonorResponse[] {
    return this.db.donorResponses.filter((r) => r.bloodRequestId === requestId);
  }

  public getResponsesByDonor(donorId: string): DonorResponse[] {
    return this.db.donorResponses.filter((r) => r.donorId === donorId);
  }

  public createDonorResponse(data: Omit<DonorResponse, 'id' | 'respondedAt'>): DonorResponse {
    const resp: DonorResponse = {
      ...data,
      id: `RSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      respondedAt: new Date().toISOString(),
    };

    this.db.donorResponses.unshift(resp);

    // Update the request status and response count
    const request = this.getBloodRequestById(data.bloodRequestId);
    if (request) {
      const allResponses = this.getResponsesForRequest(data.bloodRequestId);
      this.updateBloodRequest(data.bloodRequestId, {
        status: 'Donor Responded',
        responsesCount: allResponses.length,
      });
    }

    this.addAuditLog('DONOR', data.donorId, data.donorName, 'DONOR_RESPONDED', `Donor responded "${data.response}" for request ${data.bloodRequestId}`);
    this.persist();
    return resp;
  }

  // VERIFICATION RECORDS
  public getVerificationRecords(): VerificationRecord[] {
    return this.db.verificationRecords;
  }

  public addVerificationRecord(data: Omit<VerificationRecord, 'id' | 'timestamp'>): VerificationRecord {
    const record: VerificationRecord = {
      ...data,
      id: `VRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.db.verificationRecords.unshift(record);

    this.addAuditLog('ADMIN', data.adminUserId, 'System Admin', `VERIFICATION_${data.action}`, `${data.targetType} ${data.targetId} (${data.targetName}): ${data.reason}`);
    this.persist();
    return record;
  }
}

export const dbService = new DatabaseService();
