import {
  AuditLog,
  BloodGroup,
  BloodRequest,
  Donor,
  DonorMatchResult,
  DonorResponse,
  DonorResponseType,
  DonorStatus,
  Hospital,
  Notification,
  User,
  VerificationRecord,
  VerificationStatus,
} from '../types';

export const api = {
  // AUTH
  async getDemoUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/demo-users');
    if (!res.ok) throw new Error('Failed to load demo accounts');
    return res.json();
  },

  async login(email: string, role?: string): Promise<{ user: User; donor?: Donor; hospital?: Hospital }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  // DONORS
  async registerDonor(data: any): Promise<{ donor: Donor; user: User }> {
    const res = await fetch('/api/donors/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Donor registration failed');
    }
    return res.json();
  },

  async getDonors(filter?: { bloodGroup?: string; status?: string; verificationStatus?: string }): Promise<Donor[]> {
    const params = new URLSearchParams();
    if (filter?.bloodGroup) params.set('bloodGroup', filter.bloodGroup);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.verificationStatus) params.set('verificationStatus', filter.verificationStatus);

    const res = await fetch(`/api/donors?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch donors');
    return res.json();
  },

  async getDonorById(id: string): Promise<Donor> {
    const res = await fetch(`/api/donors/${id}`);
    if (!res.ok) throw new Error('Donor not found');
    return res.json();
  },

  async updateDonorProfile(id: string, updates: Partial<Donor>): Promise<{ success: boolean; donor: Donor }> {
    const res = await fetch(`/api/donors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update donor profile');
    }
    return res.json();
  },

  async updateDonorAvailability(
    id: string,
    updates: { status?: DonorStatus; emergencyAvailable?: boolean; lastDonationDate?: string | null }
  ): Promise<Donor> {
    const res = await fetch(`/api/donors/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update availability');
    return res.json();
  },

  async markNotificationViewed(notificationId: string): Promise<void> {
    await fetch(`/api/notifications/${notificationId}/view`, { method: 'PATCH' });
  },

  async verifyPhoneOtp(id: string): Promise<{ success: boolean; donor: Donor }> {
    const res = await fetch(`/api/donors/${id}/verify-phone-otp`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    return res.json();
  },

  async getDonorNotifications(donorId: string): Promise<Notification[]> {
    const res = await fetch(`/api/donors/${donorId}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async respondToRequest(
    donorId: string,
    bloodRequestId: string,
    responseOption: DonorResponseType,
    notes?: string
  ): Promise<{ success: boolean; donorResponse: DonorResponse }> {
    const res = await fetch(`/api/donors/${donorId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloodRequestId, responseOption, notes }),
    });
    if (!res.ok) throw new Error('Failed to record response');
    return res.json();
  },

  async getDonorResponses(donorId: string): Promise<DonorResponse[]> {
    const res = await fetch(`/api/donors/${donorId}/responses`);
    if (!res.ok) throw new Error('Failed to fetch donor responses');
    return res.json();
  },

  // HOSPITALS
  async registerHospital(data: any): Promise<{ hospital: Hospital; user: User }> {
    const res = await fetch('/api/hospitals/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Hospital registration failed');
    }
    return res.json();
  },

  async getHospitals(): Promise<Hospital[]> {
    const res = await fetch('/api/hospitals');
    if (!res.ok) throw new Error('Failed to fetch hospitals');
    return res.json();
  },

  async getHospitalById(id: string): Promise<Hospital> {
    const res = await fetch(`/api/hospitals/${id}`);
    if (!res.ok) throw new Error('Hospital not found');
    return res.json();
  },

  // BLOOD REQUESTS & MATCHING
  async getBloodRequests(): Promise<BloodRequest[]> {
    const res = await fetch('/api/requests');
    if (!res.ok) throw new Error('Failed to fetch blood requests');
    return res.json();
  },

  async getBloodRequestById(id: string): Promise<BloodRequest> {
    const res = await fetch(`/api/requests/${id}`);
    if (!res.ok) throw new Error('Request not found');
    return res.json();
  },

  async createBloodRequest(data: any): Promise<{ request: BloodRequest; matchCount: number }> {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create blood request');
    }
    return res.json();
  },

  async getRequestMatches(
    requestId: string,
    filters?: { verifiedOnly?: boolean; availableOnly?: boolean; maxDistance?: number }
  ): Promise<{
    request: BloodRequest;
    matches: DonorMatchResult[];
    totalCompatible: number;
    verifiedCount: number;
    availableCount: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.verifiedOnly) params.set('verifiedOnly', 'true');
    if (filters?.availableOnly) params.set('availableOnly', 'true');
    if (filters?.maxDistance) params.set('maxDistance', String(filters.maxDistance));

    const res = await fetch(`/api/requests/${requestId}/matches?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async notifyMatchedDonors(requestId: string, donorIds?: string[]): Promise<{ success: boolean; notifiedCount: number; request: BloodRequest }> {
    const res = await fetch(`/api/requests/${requestId}/notify-donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donorIds }),
    });
    if (!res.ok) throw new Error('Failed to notify donors');
    return res.json();
  },

  async updateRequestStatus(requestId: string, status: string): Promise<BloodRequest> {
    const res = await fetch(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update request status');
    return res.json();
  },

  async getRequestResponses(requestId: string): Promise<DonorResponse[]> {
    const res = await fetch(`/api/requests/${requestId}/responses`);
    if (!res.ok) throw new Error('Failed to fetch responses');
    return res.json();
  },

  // AI PARSER
  async parseEmergencyRequestWithAI(text: string): Promise<any> {
    const res = await fetch('/api/ai/parse-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('AI parsing failed');
    return res.json();
  },

  // ADMIN
  async verifyDonor(
    donorId: string,
    action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    reason: string,
    adminUserId: string
  ): Promise<{ success: boolean; donor: Donor }> {
    const res = await fetch('/api/admin/verify-donor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donorId, action, reason, adminUserId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify donor');
    }
    return res.json();
  },

  async verifyHospital(
    hospitalId: string,
    action: 'VERIFIED' | 'SUSPENDED',
    reason: string,
    adminUserId: string
  ): Promise<{ success: boolean; hospital: Hospital }> {
    const res = await fetch('/api/admin/verify-hospital', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, action, reason, adminUserId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify hospital');
    }
    return res.json();
  },

  async getSuspiciousRecords(): Promise<{
    flaggedDonors: Donor[];
    duplicateGroups: any[];
    verificationRecords: VerificationRecord[];
  }> {
    const res = await fetch('/api/admin/suspicious-records');
    if (!res.ok) throw new Error('Failed to fetch suspicious records');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getAdminNotifications(): Promise<Notification[]> {
    const res = await fetch('/api/admin/notifications');
    if (!res.ok) throw new Error('Failed to fetch admin notifications');
    return res.json();
  },

  async getAdminStats(): Promise<any> {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};
