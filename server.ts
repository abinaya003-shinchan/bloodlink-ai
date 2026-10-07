import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dbService } from './server/db';
import { isCompatible } from './src/services/compatibility';
import { matchDonors, checkDonorEligibility } from './src/services/matching';
import { parseEmergencyBloodRequest } from './server/services/ai';
import { BloodGroup, RequestUrgency, Donor } from './src/types';
import {
  validateDonorDob,
  isValidEmail,
  isValidPhone,
  isValidBloodGroup,
  calculateAgeFromDob,
} from './src/utils/validation';
import { runFullRegressionSuite } from './server/services/testRunner';
import { smsService } from './server/services/sms';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API ROUTER
const api = express.Router();

/**
 * Authorization Helper: requires user to have ADMIN role
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];
  let isAdmin = role === 'ADMIN';

  if (!isAdmin && userId) {
    const user = dbService.getUserById(userId as string);
    if (user && user.role === 'ADMIN') {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Unauthorized: Administrator privileges are required to perform this action.',
    });
  }
  next();
}

/**
 * Sanitizes donor personal data for unauthorized callers.
 * Phone and email are only exposed to authenticated ADMIN or the donor themselves.
 */
function sanitizeDonorRecord(donor: Donor, req: Request): Partial<Donor> {
  const reqRole = req.headers['x-user-role'];
  const reqUserId = req.headers['x-user-id'];
  const isAdmin = reqRole === 'ADMIN';
  const isOwner = reqUserId && (reqUserId === donor.userId || reqUserId === donor.id);

  if (isAdmin || isOwner) {
    return donor;
  }

  // Mask sensitive phone and email for public directory / unauthorized callers
  const maskedPhone = donor.phone
    ? `${donor.phone.slice(0, 3)}•••••${donor.phone.slice(-3)}`
    : undefined;
  const maskedEmail = donor.email ? `${donor.email[0]}••••@••••` : undefined;

  return {
    ...donor,
    phone: maskedPhone as any,
    email: maskedEmail as any,
  };
}

// Health Check
api.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'BloodLink AI', time: new Date().toISOString() });
});

// TEST / VALIDATION SUITE ENDPOINT
api.get('/test/regression-suite', (req: Request, res: Response) => {
  try {
    const suiteResult = runFullRegressionSuite();
    res.json(suiteResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to run regression test suite', details: err.message });
  }
});

// AUTH
api.get('/auth/demo-users', (req: Request, res: Response) => {
  const users = dbService.getSnapshot().users;
  const donors = dbService.getAllDonors();
  const hospitals = dbService.getAllHospitals();

  const demoAccounts = users.map((u) => {
    let details: any = null;
    if (u.role === 'DONOR') {
      details = donors.find((d) => d.userId === u.id || d.email === u.email);
    } else if (u.role === 'HOSPITAL') {
      details = hospitals.find((h) => h.userId === u.id || h.email === u.email);
    }
    return {
      ...u,
      profileDetails: details,
    };
  });

  res.json(demoAccounts);
});

api.post('/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = dbService.getUserByEmail(email);
  if (!user && role) {
    // Auto-create user for frictionless demo/testing
    user = dbService.createUser({
      email,
      role,
      name: email.split('@')[0],
      phone: '+91 90000 00000',
    });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found. Please register.' });
  }

  let donor = null;
  let hospital = null;

  if (user.role === 'DONOR') {
    donor =
      dbService.getDonorByUserId(user.id) ||
      dbService.getAllDonors().find((d) => d.email.toLowerCase() === user.email.toLowerCase());
  } else if (user.role === 'HOSPITAL') {
    hospital =
      dbService.getHospitalByUserId(user.id) ||
      dbService.getAllHospitals().find((h) => h.email.toLowerCase() === user.email.toLowerCase());
  }

  res.json({ user, donor, hospital });
});

// DONORS
api.get('/donors', (req: Request, res: Response) => {
  const { bloodGroup, status, verificationStatus } = req.query;
  let donors = dbService.getAllDonors();

  if (bloodGroup) {
    donors = donors.filter((d) => d.bloodGroup === bloodGroup);
  }
  if (status) {
    donors = donors.filter((d) => d.status === status);
  }
  if (verificationStatus) {
    donors = donors.filter((d) => d.verificationStatus === verificationStatus);
  }

  // Protect sensitive donor contact information
  const sanitized = donors.map((d) => sanitizeDonorRecord(d, req));
  res.json(sanitized);
});

api.get('/donors/:id', (req: Request, res: Response) => {
  const donor = dbService.getDonorById(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  res.json(sanitizeDonorRecord(donor, req));
});

api.post('/donors/register', (req: Request, res: Response) => {
  const body = req.body;

  // 1. Mandatory Field Validation
  if (
    !body.fullName ||
    !body.phone ||
    !body.email ||
    !body.dob ||
    !body.bloodGroup ||
    !body.district ||
    !body.city
  ) {
    return res.status(400).json({ error: 'Please provide all mandatory donor registration fields.' });
  }

  // 2. Full name length check
  if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must contain at least 2 characters.' });
  }

  // 3. Email Format Validation
  if (!isValidEmail(body.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // 4. Phone Number Validation
  if (!isValidPhone(body.phone)) {
    return res.status(400).json({ error: 'Please enter a valid 10 to 15-digit phone number.' });
  }

  // 5. Blood Group Validation
  if (!isValidBloodGroup(body.bloodGroup)) {
    return res.status(400).json({ error: 'Invalid blood group specified. Must be one of A+, A-, B+, B-, AB+, AB-, O+, O-.' });
  }

  // 6. Consent Confirmation
  if (body.consent !== true) {
    return res.status(400).json({ error: 'Consent confirmation is required for donor registration.' });
  }

  // 7. Duplicate Check
  const dupCheck = dbService.detectDuplicates(body.phone, body.email);
  if (dupCheck.isDuplicate) {
    return res.status(409).json({
      error: dupCheck.reason || 'A donor with this phone or email already exists in the system.',
      isDuplicate: true,
    });
  }

  // 8. Accurate Age Calculation & Validation from full DOB
  const dobValidation = validateDonorDob(body.dob);
  if (!dobValidation.valid) {
    return res.status(400).json({ error: dobValidation.error || 'Invalid date of birth.' });
  }
  const age = dobValidation.age;

  // 9. Location Coordinates: NEVER fabricate Chennai or default GPS coordinates!
  // If coordinates are provided as valid numbers, preserve them; otherwise use honest district/city fallback
  const validLat = typeof body.location?.lat === 'number' && !isNaN(body.location.lat) && body.location.lat !== 0 ? body.location.lat : undefined;
  const validLng = typeof body.location?.lng === 'number' && !isNaN(body.location.lng) && body.location.lng !== 0 ? body.location.lng : undefined;

  const donorLocation = {
    lat: validLat,
    lng: validLng,
    address: body.address || `${body.city}, ${body.district}`,
    district: body.district,
    city: body.city,
  };

  // Create user record
  let user = dbService.getUserByEmail(body.email);
  if (!user) {
    user = dbService.createUser({
      email: body.email,
      role: 'DONOR',
      name: body.fullName,
      phone: body.phone,
    });
  }

  // Standard initial state: PENDING verification
  const newDonor = dbService.createDonor({
    userId: user.id,
    fullName: body.fullName.trim(),
    phone: body.phone.trim(),
    email: body.email.trim().toLowerCase(),
    dob: body.dob,
    age,
    gender: body.gender || 'Other',
    bloodGroup: body.bloodGroup as BloodGroup,
    district: body.district.trim(),
    city: body.city.trim(),
    location: donorLocation,
    emergencyAvailable: Boolean(body.emergencyAvailable),
    preferredLanguage: body.preferredLanguage || 'en',
    lastDonationDate: body.lastDonationDate || null,
    consent: true,
    status: 'Pending Verification',
    verificationStatus: 'PENDING',
    isDemo: false,
    phoneVerified: false,
    emailVerified: false,
  });

  res.status(201).json({ donor: newDonor, user });
});

api.put('/donors/:id', (req: Request, res: Response) => {
  const donorId = req.params.id;
  const existing = dbService.getDonorById(donorId);
  if (!existing) return res.status(404).json({ error: 'Donor not found' });

  const body = req.body;

  // Duplicate phone/email validation if changed
  if (body.phone || body.email) {
    const checkPhone = body.phone || existing.phone;
    const checkEmail = body.email || existing.email;
    const dupCheck = dbService.detectDuplicates(checkPhone, checkEmail, donorId);
    if (dupCheck.isDuplicate) {
      return res.status(409).json({ error: dupCheck.reason || 'Phone or email is already registered by another donor.' });
    }
  }

  let age = existing.age;
  if (body.dob) {
    const dobValidation = validateDonorDob(body.dob);
    if (!dobValidation.valid) {
      return res.status(400).json({ error: dobValidation.error });
    }
    age = dobValidation.age;
  }

  const updates: any = {
    fullName: body.fullName ? body.fullName.trim() : existing.fullName,
    phone: body.phone ? body.phone.trim() : existing.phone,
    email: body.email ? body.email.trim().toLowerCase() : existing.email,
    dob: body.dob || existing.dob,
    age,
    gender: body.gender || existing.gender,
    district: body.district ? body.district.trim() : existing.district,
    city: body.city ? body.city.trim() : existing.city,
    location: body.location || existing.location,
    emergencyAvailable: body.emergencyAvailable !== undefined ? Boolean(body.emergencyAvailable) : existing.emergencyAvailable,
    preferredLanguage: body.preferredLanguage || existing.preferredLanguage,
    lastDonationDate: body.lastDonationDate !== undefined ? body.lastDonationDate : existing.lastDonationDate,
  };

  const updated = dbService.updateDonor(donorId, updates, existing.fullName);
  res.json({ success: true, donor: updated });
});

api.patch('/donors/:id/availability', (req: Request, res: Response) => {
  const { status, emergencyAvailable, lastDonationDate } = req.body;
  const updates: any = {};

  if (status) updates.status = status;
  if (emergencyAvailable !== undefined) updates.emergencyAvailable = emergencyAvailable;
  if (lastDonationDate !== undefined) updates.lastDonationDate = lastDonationDate;

  const updated = dbService.updateDonor(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Donor not found' });
  res.json(updated);
});

api.patch('/donors/:id/verify-phone-otp', (req: Request, res: Response) => {
  const updated = dbService.updateDonor(req.params.id, {
    phoneVerified: true,
    emailVerified: true,
  });
  if (!updated) return res.status(404).json({ error: 'Donor not found' });
  res.json({ success: true, donor: updated, message: 'Phone and Email verified successfully.' });
});

api.get('/donors/:id/notifications', (req: Request, res: Response) => {
  const notifications = dbService.getNotificationsForDonor(req.params.id);
  res.json(notifications);
});

api.patch('/notifications/:id/view', (req: Request, res: Response) => {
  const notif = dbService.markNotificationViewed(req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true, notification: notif });
});

api.post('/donors/:id/respond', (req: Request, res: Response) => {
  const { bloodRequestId, responseOption, notes, channel } = req.body;
  const donor = dbService.getDonorById(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  const request = dbService.getBloodRequestById(bloodRequestId);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });

  // Prevent duplicate responses
  const existingResponse = dbService.getDonorResponseForRequest(donor.id, bloodRequestId);
  if (existingResponse) {
    return res.json({
      success: true,
      alreadyResponded: true,
      donorResponse: existingResponse,
      message: `You have already recorded your response as "${existingResponse.response}".`,
    });
  }

  // Update notification status
  const notifs = dbService.getNotificationsForDonor(donor.id);
  const targetNotif = notifs.find((n) => n.bloodRequestId === bloodRequestId);
  if (targetNotif) {
    dbService.updateNotification(targetNotif.id, {
      status: 'RESPONDED',
      responseOption,
      respondedAt: new Date().toISOString(),
    });
  }

  // Record donor response:
  // PROTECTED PRIVACY: Only record donorPhone if donor says 'I CAN DONATE'
  const donorResponse = dbService.createDonorResponse({
    bloodRequestId,
    donorId: donor.id,
    donorName: donor.fullName,
    donorBloodGroup: donor.bloodGroup,
    donorPhone: responseOption === 'I CAN DONATE' ? donor.phone : undefined,
    response: responseOption,
    notes,
    responseChannel: channel || 'IN_APP',
  });

  // Audit Logging
  const auditAction =
    responseOption === 'I CAN DONATE'
      ? 'DONOR_RESPONDED_YES'
      : responseOption === 'NOT AVAILABLE'
      ? 'DONOR_RESPONDED_NO'
      : 'DONOR_RESPONDED_MAYBE';

  dbService.addAuditLog(
    'DONOR',
    donor.id,
    donor.fullName,
    auditAction,
    `Donor recorded response "${responseOption}" for Request ${bloodRequestId} via ${channel || 'IN_APP'}`
  );

  res.json({ success: true, donorResponse });
});

api.get('/donors/:id/responses', (req: Request, res: Response) => {
  const responses = dbService.getResponsesByDonor(req.params.id);
  res.json(responses);
});

// EMERGENCY SMS RESPONSE LINK WORKFLOW ENDPOINTS
api.get('/emergency/request-summary/:requestId/:donorId', (req: Request, res: Response) => {
  const { requestId, donorId } = req.params;
  const request = dbService.getBloodRequestById(requestId);
  const donor = dbService.getDonorById(donorId);

  if (!request || !donor) {
    return res.status(404).json({
      error: 'Emergency blood request or donor record not found. The link may be expired or invalid.',
    });
  }

  const existingResponse = dbService.getDonorResponseForRequest(donor.id, request.id);

  res.json({
    requestId: request.id,
    donorId: donor.id,
    donorName: donor.fullName,
    donorBloodGroup: donor.bloodGroup,
    hospitalName: request.hospitalName,
    hospitalPhone: request.hospitalPhone,
    hospitalDistrict: request.hospitalLocation?.district,
    hospitalCity: request.hospitalLocation?.city,
    requiredBloodGroup: request.requiredBloodGroup,
    unitsRequired: request.unitsRequired,
    urgency: request.urgency,
    requiredDateTime: request.requiredDateTime,
    additionalNotes: request.additionalNotes,
    hasResponded: Boolean(existingResponse),
    existingResponse: existingResponse?.response,
    respondedAt: existingResponse?.respondedAt,
  });
});

api.post('/emergency/respond', (req: Request, res: Response) => {
  const { bloodRequestId, donorId, responseOption, notes } = req.body;
  const donor = dbService.getDonorById(donorId);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  const request = dbService.getBloodRequestById(bloodRequestId);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });

  // Prevent duplicate responses
  const existingResponse = dbService.getDonorResponseForRequest(donor.id, bloodRequestId);
  if (existingResponse) {
    return res.json({
      success: true,
      alreadyResponded: true,
      donorResponse: existingResponse,
      message: `You have already submitted your response as "${existingResponse.response}".`,
    });
  }

  // Update in-app notification status if exists
  const notifs = dbService.getNotificationsForDonor(donor.id);
  const targetNotif = notifs.find((n) => n.bloodRequestId === bloodRequestId);
  if (targetNotif) {
    dbService.updateNotification(targetNotif.id, {
      status: 'RESPONDED',
      responseOption,
      respondedAt: new Date().toISOString(),
    });
  }

  // Record donor response:
  // PROTECTED PRIVACY: Only record donorPhone if donor says 'I CAN DONATE'
  const donorResponse = dbService.createDonorResponse({
    bloodRequestId,
    donorId: donor.id,
    donorName: donor.fullName,
    donorBloodGroup: donor.bloodGroup,
    donorPhone: responseOption === 'I CAN DONATE' ? donor.phone : undefined,
    response: responseOption,
    notes,
    responseChannel: 'SMS_LINK',
  });

  const auditAction =
    responseOption === 'I CAN DONATE'
      ? 'DONOR_RESPONDED_YES'
      : responseOption === 'NOT AVAILABLE'
      ? 'DONOR_RESPONDED_NO'
      : 'DONOR_RESPONDED_MAYBE';

  dbService.addAuditLog(
    'DONOR',
    donor.id,
    donor.fullName,
    auditAction,
    `Donor responded "${responseOption}" via Emergency SMS response link for Request ${bloodRequestId}`
  );

  res.json({ success: true, donorResponse });
});

// HOSPITALS
api.get('/hospitals', (req: Request, res: Response) => {
  res.json(dbService.getAllHospitals());
});

api.get('/hospitals/:id', (req: Request, res: Response) => {
  const hospital = dbService.getHospitalById(req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  res.json(hospital);
});

api.post('/hospitals/register', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.hospitalName || !body.authorizedContact || !body.phone || !body.email || !body.address) {
    return res.status(400).json({ error: 'All hospital registration fields are mandatory.' });
  }

  if (!isValidEmail(body.email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!isValidPhone(body.phone)) {
    return res.status(400).json({ error: 'Please provide a valid phone number.' });
  }

  // Duplicate hospital prevention
  const dupCheck = dbService.detectDuplicateHospital(body.phone, body.email);
  if (dupCheck.isDuplicate) {
    return res.status(409).json({ error: dupCheck.reason || 'A hospital with this phone or email already exists in the system.' });
  }

  let user = dbService.getUserByEmail(body.email);
  if (!user) {
    user = dbService.createUser({
      email: body.email,
      role: 'HOSPITAL',
      name: body.hospitalName,
      phone: body.phone,
    });
  }

  const validLat = typeof body.location?.lat === 'number' && !isNaN(body.location.lat) && body.location.lat !== 0 ? body.location.lat : undefined;
  const validLng = typeof body.location?.lng === 'number' && !isNaN(body.location.lng) && body.location.lng !== 0 ? body.location.lng : undefined;

  const hospital = dbService.createHospital({
    userId: user.id,
    hospitalName: body.hospitalName.trim(),
    authorizedContact: body.authorizedContact.trim(),
    phone: body.phone.trim(),
    email: body.email.trim().toLowerCase(),
    address: body.address.trim(),
    district: body.district ? body.district.trim() : 'Chennai',
    city: body.city ? body.city.trim() : 'Chennai',
    location: {
      lat: validLat,
      lng: validLng,
      address: body.address,
      district: body.district || 'Chennai',
      city: body.city || 'Chennai',
    },
    verificationStatus: 'PENDING',
    isDemo: false,
  });

  res.status(201).json({ hospital, user });
});

// BLOOD REQUESTS
api.get('/requests', (req: Request, res: Response) => {
  res.json(dbService.getAllBloodRequests());
});

api.get('/requests/:id', (req: Request, res: Response) => {
  const request = dbService.getBloodRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });
  res.json(request);
});

api.post('/requests', async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.hospitalId || !body.requiredBloodGroup || !body.unitsRequired || !body.urgency) {
    return res.status(400).json({ error: 'Missing mandatory blood request parameters' });
  }

  // Validate blood group format
  if (!isValidBloodGroup(body.requiredBloodGroup)) {
    return res.status(400).json({ error: 'Invalid blood group specified.' });
  }

  // Validate units
  if (Number(body.unitsRequired) < 1) {
    return res.status(400).json({ error: 'Units required must be at least 1 unit.' });
  }

  const hospital = dbService.getHospitalById(body.hospitalId);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital record not found.' });
  }

  // -------------------------------------------------------------------
  // REQUIREMENT 5: HOSPITAL VERIFICATION ENFORCEMENT
  // A hospital must be VERIFIED before it can create a real blood request.
  // Enforce this on the backend/API. If Pending Verification:
  // - block request creation
  // - return clear error
  // - do not create a request
  // - do not notify donors
  // -------------------------------------------------------------------
  if (hospital.verificationStatus !== 'VERIFIED') {
    return res.status(403).json({
      error: 'Hospital verification is required before creating a blood request. Please wait for administrator verification approval.',
    });
  }

  let aiAnalysis = body.aiAnalysis;
  if (!aiAnalysis && body.additionalNotes) {
    const parsed = await parseEmergencyBloodRequest(body.additionalNotes);
    aiAnalysis = {
      clinicalPriority: parsed.clinicalPriorityAnalysis,
      donorSearchSummary: `AI parsed blood request for ${body.unitsRequired} units of ${body.requiredBloodGroup}. Urgency: ${body.urgency}.`,
      compatibilityGuidance: `Deterministic ABO/Rh matching engine active.`,
    };
  }

  const newRequest = dbService.createBloodRequest({
    hospitalId: hospital.id,
    hospitalName: hospital.hospitalName,
    hospitalPhone: hospital.phone,
    hospitalLocation: hospital.location,
    patientRef: body.patientRef || `Patient-${Math.floor(1000 + Math.random() * 9000)}`,
    requiredBloodGroup: body.requiredBloodGroup as BloodGroup,
    unitsRequired: Number(body.unitsRequired),
    urgency: body.urgency as RequestUrgency,
    requiredDateTime: body.requiredDateTime || 'Immediate',
    contactNumber: body.contactNumber || hospital.phone,
    additionalNotes: body.additionalNotes || '',
    status: 'Open',
    aiAnalysis,
    notifiedDonorsCount: 0,
    responsesCount: 0,
  });

  // Automatically execute matching (only eligible donors are returned)
  const allDonors = dbService.getAllDonors();
  const matches = matchDonors(newRequest, allDonors);

  // -------------------------------------------------------------------
  // REQUIREMENT 2 & 4: EMERGENCY NOTIFICATIONS & SMS BROADCASTS
  // Emergency notifications must only be sent to donors who pass the
  // same eligibility rules used by the matching engine.
  // Real SMS notifications are dispatched to registered mobile numbers.
  // Duplicate notifications for the same request and donor are strictly prevented.
  // -------------------------------------------------------------------
  if (newRequest.urgency === 'EMERGENCY' || body.autoNotify) {
    let notifiedCount = 0;
    const topCandidates = matches.slice(0, 10);

    for (const match of topCandidates) {
      // PREVENT DUPLICATE NOTIFICATION FOR SAME DONOR + SAME REQUEST
      if (dbService.isDonorAlreadyAlertedOrResponded(match.donorId, newRequest.id)) {
        continue;
      }

      const donorRecord = dbService.getDonorById(match.donorId);
      if (!donorRecord) continue;

      let smsResult: any = { status: 'SKIPPED' };
      if (newRequest.urgency === 'EMERGENCY') {
        // Send REAL SMS notification to registered mobile number
        smsResult = await smsService.sendEmergencySms({
          recipientPhone: donorRecord.phone,
          donorId: donorRecord.id,
          donorName: donorRecord.fullName,
          bloodRequestId: newRequest.id,
          requiredBloodGroup: newRequest.requiredBloodGroup,
          unitsRequired: newRequest.unitsRequired,
          hospitalName: hospital.hospitalName,
          district: hospital.district,
          urgency: newRequest.urgency,
          preferredLanguage: donorRecord.preferredLanguage,
        });

        dbService.addAuditLog(
          'SYSTEM',
          donorRecord.id,
          donorRecord.fullName,
          'EMERGENCY_SMS_ATTEMPTED',
          `Emergency SMS status: ${smsResult.status} for Request ${newRequest.id} to ${donorRecord.phone}. Link: ${smsResult.responseUrl}`
        );
      }

      dbService.createNotification({
        recipientDonorId: match.donorId,
        bloodRequestId: newRequest.id,
        title: `EMERGENCY BLOOD ALERT: ${newRequest.requiredBloodGroup} (${newRequest.unitsRequired} Units)`,
        message: `${hospital.hospitalName} has initiated an emergency request for ${newRequest.requiredBloodGroup}. You are an eligible compatible donor (${match.distanceDisplay}).`,
        urgency: newRequest.urgency,
        requiredBloodGroup: newRequest.requiredBloodGroup,
        hospitalName: hospital.hospitalName,
        approxDistanceKm: match.distanceKm || undefined,
        unitsRequired: newRequest.unitsRequired,
        status: 'NOTIFIED',
        deliveryChannel: newRequest.urgency === 'EMERGENCY' ? 'IN_APP_AND_SMS' : 'IN_APP',
        smsStatus: smsResult.status,
        smsRecipientPhone: donorRecord.phone,
        smsError: smsResult.error,
        smsSentAt: smsResult.sentAt,
        smsMessageBody: smsResult.messageBody,
        responseUrl: smsResult.responseUrl,
      });
      notifiedCount++;
    }

    if (notifiedCount > 0) {
      dbService.updateBloodRequest(newRequest.id, {
        status: 'Donors Notified',
        notifiedDonorsCount: notifiedCount,
      });
    }
  }

  res.status(201).json({ request: newRequest, matchCount: matches.length });
});

api.get('/requests/:id/matches', (req: Request, res: Response) => {
  const request = dbService.getBloodRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const maxDistanceKm = req.query.maxDistance ? Number(req.query.maxDistance) : undefined;
  const districtFilter = req.query.districtFilter ? String(req.query.districtFilter) : undefined;

  const donors = dbService.getAllDonors();
  // matchDonors strictly filters to ONLY eligible donors
  const matches = matchDonors(request, donors, {
    maxDistanceKm,
    districtFilter,
    emergencyOnly: req.query.emergencyOnly === 'true',
  });

  res.json({
    request,
    matches,
    totalCompatible: matches.length,
    verifiedCount: matches.filter((m) => m.verificationStatus === 'VERIFIED').length,
    availableCount: matches.filter((m) => m.availability === 'Available').length,
  });
});

api.post('/requests/:id/notify-donors', async (req: Request, res: Response) => {
  const request = dbService.getBloodRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const { donorIds, sendSms } = req.body;
  const donors = dbService.getAllDonors();
  const matches = matchDonors(request, donors); // strictly eligible donors only

  const targets = donorIds
    ? matches.filter((m) => donorIds.includes(m.donorId))
    : matches.slice(0, 15);

  let notified = 0;
  for (const match of targets) {
    // PREVENT DUPLICATE NOTIFICATION FOR SAME DONOR AND SAME REQUEST
    if (dbService.isDonorAlreadyAlertedOrResponded(match.donorId, request.id)) {
      continue;
    }

    const donorRecord = dbService.getDonorById(match.donorId);
    if (!donorRecord) continue;

    let smsResult: any = { status: 'SKIPPED' };
    const shouldSendSms = request.urgency === 'EMERGENCY' || sendSms;

    if (shouldSendSms) {
      smsResult = await smsService.sendEmergencySms({
        recipientPhone: donorRecord.phone,
        donorId: donorRecord.id,
        donorName: donorRecord.fullName,
        bloodRequestId: request.id,
        requiredBloodGroup: request.requiredBloodGroup,
        unitsRequired: request.unitsRequired,
        hospitalName: request.hospitalName,
        district: request.hospitalLocation?.district,
        urgency: request.urgency,
        preferredLanguage: donorRecord.preferredLanguage,
      });

      dbService.addAuditLog(
        'SYSTEM',
        donorRecord.id,
        donorRecord.fullName,
        'EMERGENCY_SMS_ATTEMPTED',
        `SMS dispatch ${smsResult.status} for Request ${request.id} to ${donorRecord.phone}. Link: ${smsResult.responseUrl}`
      );
    }

    dbService.createNotification({
      recipientDonorId: match.donorId,
      bloodRequestId: request.id,
      title: `Blood Request Alert: ${request.requiredBloodGroup} (${request.urgency})`,
      message: `${request.hospitalName} is coordinating blood donation for ${request.requiredBloodGroup}. Distance: ${match.distanceDisplay}.`,
      urgency: request.urgency,
      requiredBloodGroup: request.requiredBloodGroup,
      hospitalName: request.hospitalName,
      approxDistanceKm: match.distanceKm || undefined,
      unitsRequired: request.unitsRequired,
      status: 'NOTIFIED',
      deliveryChannel: shouldSendSms ? 'IN_APP_AND_SMS' : 'IN_APP',
      smsStatus: smsResult.status,
      smsRecipientPhone: donorRecord.phone,
      smsError: smsResult.error,
      smsSentAt: smsResult.sentAt,
      smsMessageBody: smsResult.messageBody,
      responseUrl: smsResult.responseUrl,
    });
    notified++;
  }

  const updatedReq = dbService.updateBloodRequest(request.id, {
    status: 'Donors Notified',
    notifiedDonorsCount: (request.notifiedDonorsCount || 0) + notified,
  });

  res.json({ success: true, notifiedCount: notified, request: updatedReq });
});

api.patch('/requests/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = dbService.updateBloodRequest(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Request not found' });
  res.json(updated);
});

// -------------------------------------------------------------------
// REQUIREMENT 6: DONOR CONTACT PRIVACY
// Hospital must NOT receive donor phone/email merely because a match exists.
// When donor chooses "I CAN DONATE" -> expose donor phone to authorized hospital.
// "NOT AVAILABLE" and "MAYBE LATER" must NOT reveal protected contact information.
// -------------------------------------------------------------------
api.get('/requests/:id/responses', (req: Request, res: Response) => {
  const request = dbService.getBloodRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const responses = dbService.getResponsesForRequest(req.params.id);

  const reqRole = req.headers['x-user-role'];
  const reqUserId = req.headers['x-user-id'];
  const isAdmin = reqRole === 'ADMIN';

  // Check if hospital is the authorized owner of this request
  let isAuthorizedHospital = false;
  if (reqUserId) {
    const userHosp =
      dbService.getHospitalByUserId(reqUserId as string) ||
      dbService.getHospitalById(reqUserId as string);
    if (userHosp && userHosp.id === request.hospitalId) {
      isAuthorizedHospital = true;
    }
  }

  const sanitizedResponses = responses.map((r) => {
    const isContactAuthorized = (isAuthorizedHospital || isAdmin) && r.response === 'I CAN DONATE';
    return {
      ...r,
      donorPhone: isContactAuthorized ? r.donorPhone : undefined,
    };
  });

  res.json(sanitizedResponses);
});

// AI REQUEST PARSING
api.post('/ai/parse-request', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text prompt is required' });

  const parsed = await parseEmergencyBloodRequest(text);
  res.json(parsed);
});

// -------------------------------------------------------------------
// REQUIREMENT 7: API AUTHORIZATION (ADMIN-ONLY OPERATIONS)
// Protected with requireAdmin middleware.
// -------------------------------------------------------------------
api.post('/admin/verify-donor', requireAdmin, (req: Request, res: Response) => {
  const { donorId, action, reason, adminUserId } = req.body;
  const donor = dbService.getDonorById(donorId);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  // Rule: Do not allow incomplete donor profiles to become Verified
  if (action === 'VERIFIED' && donor.profileCompleteness < 70) {
    return res.status(400).json({
      error: `Cannot verify incomplete profile (${donor.profileCompleteness}% complete). Minimum 70% required.`,
    });
  }

  let newStatus = donor.status;
  let newVerification: any = donor.verificationStatus;

  if (action === 'VERIFIED') {
    newVerification = 'VERIFIED';
    newStatus = donor.status === 'Pending Verification' ? 'Available' : donor.status;
  } else if (action === 'REJECTED') {
    newVerification = 'REJECTED';
    newStatus = 'Temporarily Unavailable';
  } else if (action === 'SUSPENDED') {
    newVerification = 'SUSPENDED';
    newStatus = 'Suspended';
  }

  const updated = dbService.updateDonor(donorId, {
    status: newStatus,
    verificationStatus: newVerification,
    verifiedAt: action === 'VERIFIED' ? new Date().toISOString() : undefined,
    verifiedBy: adminUserId || 'ADMIN',
    verificationNotes: reason,
  });

  dbService.addVerificationRecord({
    targetType: 'DONOR',
    targetId: donor.id,
    targetName: donor.fullName,
    action,
    adminUserId: adminUserId || 'ADMIN',
    reason: reason || 'Administrative review completed',
  });

  res.json({ success: true, donor: updated });
});

api.post('/admin/verify-hospital', requireAdmin, (req: Request, res: Response) => {
  const { hospitalId, action, reason, adminUserId } = req.body;
  const hospital = dbService.getHospitalById(hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  const newVerification = action === 'VERIFIED' ? 'VERIFIED' : action === 'SUSPENDED' ? 'SUSPENDED' : 'PENDING';
  const updated = dbService.updateHospital(hospitalId, {
    verificationStatus: newVerification,
    verifiedAt: action === 'VERIFIED' ? new Date().toISOString() : undefined,
  });

  dbService.addVerificationRecord({
    targetType: 'HOSPITAL',
    targetId: hospital.id,
    targetName: hospital.hospitalName,
    action,
    adminUserId: adminUserId || 'ADMIN',
    reason: reason || 'Hospital licensing verification',
  });

  res.json({ success: true, hospital: updated });
});

api.get('/admin/suspicious-records', requireAdmin, (req: Request, res: Response) => {
  const donors = dbService.getAllDonors();
  const suspicious = donors.filter((d) => d.isSuspicious);

  // Group by duplicate phone or email
  const phoneMap = new Map<string, typeof donors>();
  const emailMap = new Map<string, typeof donors>();

  for (const d of donors) {
    const p = d.phone.replace(/[^0-9]/g, '');
    const e = d.email.trim().toLowerCase();

    if (p) {
      const arr = phoneMap.get(p) || [];
      arr.push(d);
      phoneMap.set(p, arr);
    }
    if (e) {
      const arr = emailMap.get(e) || [];
      arr.push(d);
      emailMap.set(e, arr);
    }
  }

  const duplicateGroups: any[] = [];
  phoneMap.forEach((list, phone) => {
    if (list.length > 1) {
      duplicateGroups.push({
        type: 'PHONE',
        key: phone,
        count: list.length,
        donors: list.map((d) => ({ id: d.id, name: d.fullName, email: d.email, status: d.status })),
      });
    }
  });

  emailMap.forEach((list, email) => {
    if (list.length > 1) {
      duplicateGroups.push({
        type: 'EMAIL',
        key: email,
        count: list.length,
        donors: list.map((d) => ({ id: d.id, name: d.fullName, phone: d.phone, status: d.status })),
      });
    }
  });

  res.json({
    flaggedDonors: suspicious,
    duplicateGroups,
    verificationRecords: dbService.getVerificationRecords(),
  });
});

api.get('/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  res.json(dbService.getSnapshot().auditLogs);
});

api.get('/admin/notifications', requireAdmin, (req: Request, res: Response) => {
  res.json(dbService.getSnapshot().notifications);
});

api.get('/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const snap = dbService.getSnapshot();
  res.json({
    totalDonors: snap.donors.length,
    verifiedDonors: snap.donors.filter((d) => d.verificationStatus === 'VERIFIED').length,
    pendingDonors: snap.donors.filter((d) => d.verificationStatus === 'PENDING').length,
    availableDonors: snap.donors.filter((d) => d.status === 'Available').length,
    totalHospitals: snap.hospitals.length,
    verifiedHospitals: snap.hospitals.filter((h) => h.verificationStatus === 'VERIFIED').length,
    totalRequests: snap.bloodRequests.length,
    emergencyRequests: snap.bloodRequests.filter((r) => r.urgency === 'EMERGENCY').length,
    fulfilledRequests: snap.bloodRequests.filter((r) => r.status === 'Fulfilled').length,
    totalNotifications: snap.notifications.length,
    totalResponses: snap.donorResponses.length,
    suspiciousCount: snap.donors.filter((d) => d.isSuspicious).length,
  });
});

app.use('/api', api);

// Dev / Prod mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BloodLink AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
