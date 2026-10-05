import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dbService } from './server/db';
import { isCompatible } from './src/services/compatibility';
import { matchDonors } from './src/services/matching';
import { parseEmergencyBloodRequest } from './server/services/ai';
import { BloodGroup, RequestUrgency } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API ROUTER
const api = express.Router();

// Health Check
api.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'BloodLink AI', time: new Date().toISOString() });
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
    donor = dbService.getDonorByUserId(user.id) || dbService.getAllDonors().find((d) => d.email.toLowerCase() === user.email.toLowerCase());
  } else if (user.role === 'HOSPITAL') {
    hospital = dbService.getHospitalByUserId(user.id) || dbService.getAllHospitals().find((h) => h.email.toLowerCase() === user.email.toLowerCase());
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

  res.json(donors);
});

api.get('/donors/:id', (req: Request, res: Response) => {
  const donor = dbService.getDonorById(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  res.json(donor);
});

api.post('/donors/register', (req: Request, res: Response) => {
  const body = req.body;

  // Validation
  if (!body.fullName || !body.phone || !body.email || !body.dob || !body.bloodGroup || !body.district || !body.city) {
    return res.status(400).json({ error: 'Please provide all mandatory fields.' });
  }

  if (body.consent !== true) {
    return res.status(400).json({ error: 'Consent confirmation is required for donor registration.' });
  }

  // Duplicate Check
  const dupCheck = dbService.detectDuplicates(body.phone, body.email);
  if (dupCheck.isDuplicate) {
    return res.status(409).json({
      error: dupCheck.reason || 'A donor with this phone or email already exists in the system.',
      isDuplicate: true,
    });
  }

  // Calculate age
  const birthYear = new Date(body.dob).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = body.age || (currentYear - birthYear);

  if (age < 18 || age > 65) {
    return res.status(400).json({ error: 'Donor age must be between 18 and 65 years.' });
  }

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
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    dob: body.dob,
    age,
    gender: body.gender || 'Other',
    bloodGroup: body.bloodGroup as BloodGroup,
    district: body.district,
    city: body.city,
    location: body.location || {
      lat: 13.0827,
      lng: 80.2707,
      address: `${body.city}, ${body.district}`,
      district: body.district,
      city: body.city,
    },
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
    const birthYear = new Date(body.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    age = currentYear - birthYear;
    if (age < 18 || age > 65) {
      return res.status(400).json({ error: 'Donor age must be between 18 and 65 years.' });
    }
  }

  const updates: any = {
    fullName: body.fullName || existing.fullName,
    phone: body.phone || existing.phone,
    email: body.email || existing.email,
    dob: body.dob || existing.dob,
    age,
    gender: body.gender || existing.gender,
    district: body.district || existing.district,
    city: body.city || existing.city,
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
  const { bloodRequestId, responseOption, notes } = req.body;
  const donor = dbService.getDonorById(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  const request = dbService.getBloodRequestById(bloodRequestId);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });

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

  // Record donor response
  const donorResponse = dbService.createDonorResponse({
    bloodRequestId,
    donorId: donor.id,
    donorName: donor.fullName,
    donorBloodGroup: donor.bloodGroup,
    donorPhone: responseOption === 'I CAN DONATE' ? donor.phone : undefined,
    response: responseOption,
    notes,
  });

  res.json({ success: true, donorResponse });
});

api.get('/donors/:id/responses', (req: Request, res: Response) => {
  const responses = dbService.getResponsesByDonor(req.params.id);
  res.json(responses);
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

  const hospital = dbService.createHospital({
    userId: user.id,
    hospitalName: body.hospitalName,
    authorizedContact: body.authorizedContact,
    phone: body.phone,
    email: body.email,
    address: body.address,
    district: body.district || 'Chennai',
    city: body.city || 'Chennai',
    location: body.location || {
      lat: 13.0827,
      lng: 80.2707,
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

  const hospital = dbService.getHospitalById(body.hospitalId);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital record not found.' });
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

  // Automatically execute matching
  const allDonors = dbService.getAllDonors();
  const matches = matchDonors(newRequest, allDonors);

  // If Emergency, automatically dispatch notifications to top matching verified available donors
  if (newRequest.urgency === 'EMERGENCY' || body.autoNotify) {
    let notifiedCount = 0;
    const topCandidates = matches.filter((m) => m.matchScore >= 60).slice(0, 10);

    for (const match of topCandidates) {
      dbService.createNotification({
        recipientDonorId: match.donorId,
        bloodRequestId: newRequest.id,
        title: `EMERGENCY BLOOD ALERT: ${newRequest.requiredBloodGroup} (${newRequest.unitsRequired} Units)`,
        message: `${hospital.hospitalName} has initiated an emergency request for ${newRequest.requiredBloodGroup}. You are a compatible matching donor (${match.distanceDisplay}).`,
        urgency: newRequest.urgency,
        requiredBloodGroup: newRequest.requiredBloodGroup,
        hospitalName: hospital.hospitalName,
        approxDistanceKm: match.distanceKm || undefined,
        unitsRequired: newRequest.unitsRequired,
        status: 'NOTIFIED',
        deliveryChannel: 'IN_APP',
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

  const verifiedOnly = req.query.verifiedOnly === 'true';
  const availableOnly = req.query.availableOnly === 'true';
  const maxDistanceKm = req.query.maxDistance ? Number(req.query.maxDistance) : undefined;

  const donors = dbService.getAllDonors();
  const matches = matchDonors(request, donors, {
    verifiedOnly,
    availableOnly,
    maxDistanceKm,
  });

  res.json({
    request,
    matches,
    totalCompatible: matches.length,
    verifiedCount: matches.filter((m) => m.verificationStatus === 'VERIFIED').length,
    availableCount: matches.filter((m) => m.availability === 'Available').length,
  });
});

api.post('/requests/:id/notify-donors', (req: Request, res: Response) => {
  const request = dbService.getBloodRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const { donorIds } = req.body;
  const donors = dbService.getAllDonors();
  const matches = matchDonors(request, donors);

  const targets = donorIds
    ? matches.filter((m) => donorIds.includes(m.donorId))
    : matches.filter((m) => m.matchScore >= 50).slice(0, 15);

  let notified = 0;
  for (const match of targets) {
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
      deliveryChannel: 'IN_APP',
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

api.get('/requests/:id/responses', (req: Request, res: Response) => {
  const responses = dbService.getResponsesForRequest(req.params.id);
  res.json(responses);
});

// AI REQUEST PARSING
api.post('/ai/parse-request', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text prompt is required' });

  const parsed = await parseEmergencyBloodRequest(text);
  res.json(parsed);
});

// ADMIN MANAGEMENT & VERIFICATION
api.post('/admin/verify-donor', (req: Request, res: Response) => {
  const { donorId, action, reason, adminUserId } = req.body;
  const donor = dbService.getDonorById(donorId);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  // Rule: Do not allow incomplete donor profiles to become Verified
  if (action === 'VERIFIED' && donor.profileCompleteness < 90) {
    return res.status(400).json({
      error: `Cannot verify incomplete profile (${donor.profileCompleteness}% complete). All mandatory fields must be completed.`,
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

api.post('/admin/verify-hospital', (req: Request, res: Response) => {
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

api.get('/admin/suspicious-records', (req: Request, res: Response) => {
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

api.get('/admin/audit-logs', (req: Request, res: Response) => {
  res.json(dbService.getSnapshot().auditLogs);
});

api.get('/admin/notifications', (req: Request, res: Response) => {
  res.json(dbService.getSnapshot().notifications);
});

api.get('/admin/stats', (req: Request, res: Response) => {
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
