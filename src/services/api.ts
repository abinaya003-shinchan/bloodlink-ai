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
  EmergencyRequestSummary,
} from '../types';

let currentAuthHeaders: Record<string, string> = {};

export function setApiAuth(user: { id?: string; role?: string; email?: string } | null) {
  if (user) {
    currentAuthHeaders = {
      'x-user-id': user.id || '',
      'x-user-role': user.role || '',
      'x-user-email': user.email || '',
    };
  } else {
    currentAuthHeaders = {};
  }
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  Object.entries(currentAuthHeaders).forEach(([k, v]) => {
    if (v) headers.set(k, v);
  });
  return fetch(url, { ...options, headers });
}

export const api = {
  // AUTH
  async getDemoUsers(): Promise<User[]> {
    const res = await authFetch('/api/auth/demo-users');
    if (!res.ok) throw new Error('Failed to load demo accounts');
    return res.json();
  },

  async login(email: string, role?: string): Promise<{ user: User; donor?: Donor; hospital?: Hospital }> {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setApiAuth(data.user);
    return data;
  },

  // DONORS
  async registerDonor(data: any): Promise<{ donor: Donor; user: User }> {
    const res = await authFetch('/api/donors/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Donor registration failed');
    }
    return res.json();
  },

  async getDonors(filter?: { bloodGroup?: string; status?: string; verificationStatus?: string }): Promise<Donor[]> {
    const params = new URLSearchParams();
    if (filter?.bloodGroup) params.set('bloodGroup', filter.bloodGroup);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.verificationStatus) params.set('verificationStatus', filter.verificationStatus);

    const res = await authFetch(`/api/donors?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch donors');
    return res.json();
  },

  async getDonorById(id: string): Promise<Donor> {
    const res = await authFetch(`/api/donors/${id}`);
    if (!res.ok) throw new Error('Donor not found');
    return res.json();
  },

  async updateDonorProfile(id: string, updates: Partial<Donor>): Promise<{ success: boolean; donor: Donor }> {
    const res = await authFetch(`/api/donors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update donor profile');
    }
    return res.json();
  },

  async updateDonorAvailability(
    id: string,
    updates: { status?: DonorStatus; emergencyAvailable?: boolean; lastDonationDate?: string | null }
  ): Promise<Donor> {
    const res = await authFetch(`/api/donors/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update availability');
    }
    return res.json();
  },

  async markNotificationViewed(notificationId: string): Promise<void> {
    await authFetch(`/api/notifications/${notificationId}/view`, { method: 'PATCH' });
  },

  async verifyPhoneOtp(id: string): Promise<{ success: boolean; donor: Donor }> {
    const res = await authFetch(`/api/donors/${id}/verify-phone-otp`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    return res.json();
  },

  async getDonorNotifications(donorId: string): Promise<Notification[]> {
    const res = await authFetch(`/api/donors/${donorId}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async respondToRequest(
    donorId: string,
    bloodRequestId: string,
    responseOption: DonorResponseType,
    notes?: string
  ): Promise<{ success: boolean; donorResponse: DonorResponse }> {
    const res = await authFetch(`/api/donors/${donorId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloodRequestId, responseOption, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record response');
    }
    return res.json();
  },

  async getDonorResponses(donorId: string): Promise<DonorResponse[]> {
    const res = await authFetch(`/api/donors/${donorId}/responses`);
    if (!res.ok) throw new Error('Failed to fetch donor responses');
    return res.json();
  },

  // HOSPITALS
  async registerHospital(data: any): Promise<{ hospital: Hospital; user: User }> {
    const res = await authFetch('/api/hospitals/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Hospital registration failed');
    }
    return res.json();
  },

  async getHospitals(): Promise<Hospital[]> {
    const res = await authFetch('/api/hospitals');
    if (!res.ok) throw new Error('Failed to fetch hospitals');
    return res.json();
  },

  async getHospitalById(id: string): Promise<Hospital> {
    const res = await authFetch(`/api/hospitals/${id}`);
    if (!res.ok) throw new Error('Hospital not found');
    return res.json();
  },

  // BLOOD REQUESTS & MATCHING
  async getBloodRequests(): Promise<BloodRequest[]> {
    const res = await authFetch('/api/requests');
    if (!res.ok) throw new Error('Failed to fetch blood requests');
    return res.json();
  },

  async getBloodRequestById(id: string): Promise<BloodRequest> {
    const res = await authFetch(`/api/requests/${id}`);
    if (!res.ok) throw new Error('Request not found');
    return res.json();
  },

  async createBloodRequest(data: any): Promise<{ request: BloodRequest; matchCount: number }> {
    const res = await authFetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create blood request');
    }
    return res.json();
  },

  async getRequestMatches(
    requestId: string,
    filters?: {
      maxDistance?: number;
      districtFilter?: string;
      emergencyOnly?: boolean;
      verifiedOnly?: boolean;
      availableOnly?: boolean;
    }
  ): Promise<{
    request: BloodRequest;
    matches: DonorMatchResult[];
    totalCompatible: number;
    verifiedCount: number;
    availableCount: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.maxDistance) params.set('maxDistance', String(filters.maxDistance));
    if (filters?.districtFilter) params.set('districtFilter', filters.districtFilter);
    if (filters?.emergencyOnly) params.set('emergencyOnly', 'true');
    if (filters?.verifiedOnly) params.set('verifiedOnly', 'true');
    if (filters?.availableOnly) params.set('availableOnly', 'true');

    const res = await authFetch(`/api/requests/${requestId}/matches?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async notifyMatchedDonors(requestId: string, donorIds?: string[]): Promise<{ success: boolean; notifiedCount: number; request: BloodRequest }> {
    const res = await authFetch(`/api/requests/${requestId}/notify-donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donorIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to notify donors');
    }
    return res.json();
  },

  async updateRequestStatus(requestId: string, status: string): Promise<BloodRequest> {
    const res = await authFetch(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update request status');
    return res.json();
  },

  async getRequestResponses(requestId: string): Promise<DonorResponse[]> {
    const res = await authFetch(`/api/requests/${requestId}/responses`);
    if (!res.ok) throw new Error('Failed to fetch responses');
    return res.json();
  },

  // AI PARSER
  async parseEmergencyRequestWithAI(text: string): Promise<any> {
    const res = await authFetch('/api/ai/parse-request', {
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
    const res = await authFetch('/api/admin/verify-donor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donorId, action, reason, adminUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
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
    const res = await authFetch('/api/admin/verify-hospital', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, action, reason, adminUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to verify hospital');
    }
    return res.json();
  },

  async getSuspiciousRecords(): Promise<{
    flaggedDonors: Donor[];
    duplicateGroups: any[];
    verificationRecords: VerificationRecord[];
  }> {
    const res = await authFetch('/api/admin/suspicious-records');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch suspicious records');
    }
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await authFetch('/api/admin/audit-logs');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch audit logs');
    }
    return res.json();
  },

  async getAdminNotifications(): Promise<Notification[]> {
    const res = await authFetch('/api/admin/notifications');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch admin notifications');
    }
    return res.json();
  },

  async getAdminStats(): Promise<any> {
    const res = await authFetch('/api/admin/stats');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch stats');
    }
    return res.json();
  },

  // EMERGENCY RESPONSE WORKFLOW (SECURE SMS LINK)
  async getEmergencyRequestSummary(requestId: string, donorId: string): Promise<EmergencyRequestSummary> {
    const res = await fetch(`/api/emergency/request-summary/${requestId}/${donorId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Emergency blood request not found or link has expired');
    }
    return res.json();
  },

  async submitEmergencyResponse(payload: {
    bloodRequestId: string;
    donorId: string;
    responseOption: DonorResponseType;
    notes?: string;
  }): Promise<{ success: boolean; alreadyResponded?: boolean; donorResponse?: DonorResponse; message?: string }> {
    const res = await fetch('/api/emergency/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit response');
    }
    return res.json();
  },

  // AUTOMATED REGRESSION TEST SUITE
  async runRegressionTestSuite(): Promise<any> {
    const res = await authFetch('/api/test/regression-suite');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute regression test suite');
    }
    return res.json();
  },
};
