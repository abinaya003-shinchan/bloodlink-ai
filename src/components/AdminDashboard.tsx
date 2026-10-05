import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { AuditLog, BloodRequest, Donor, Hospital, Notification } from '../types';
import {
  ShieldCheck,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  RefreshCw,
  Search,
  Check,
  Ban,
  AlertOctagon,
  Bell,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    'donors' | 'hospitals' | 'suspicious' | 'requests' | 'notifications' | 'audit'
  >('donors');

  const [stats, setStats] = useState<any>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suspiciousData, setSuspiciousData] = useState<{
    flaggedDonors: Donor[];
    duplicateGroups: any[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAllAdminData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [s, d, h, r, a, susp, notifs] = await Promise.all([
        api.getAdminStats(),
        api.getDonors(),
        api.getHospitals(),
        api.getBloodRequests(),
        api.getAuditLogs(),
        api.getSuspiciousRecords(),
        api.getAdminNotifications(),
      ]);
      setStats(s);
      setDonors(d);
      setHospitals(h);
      setRequests(r);
      setAuditLogs(a);
      setSuspiciousData(susp);
      setNotifications(notifs);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleVerifyDonor = async (
    donorId: string,
    action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  ) => {
    setActionError(null);
    try {
      await api.verifyDonor(
        donorId,
        action,
        `Admin action: ${action}`,
        user?.id || 'USR-ADMIN'
      );
      setActionSuccess(`Donor record updated: ${action}`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Donor verification failed');
    }
  };

  const handleVerifyHospital = async (
    hospitalId: string,
    action: 'VERIFIED' | 'SUSPENDED'
  ) => {
    setActionError(null);
    try {
      await api.verifyHospital(
        hospitalId,
        action,
        `Admin action: ${action}`,
        user?.id || 'USR-ADMIN'
      );
      setActionSuccess(`Hospital record updated: ${action}`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Hospital verification failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <span className="font-medium">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}>✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-center justify-between">
          <span className="font-medium">{actionError}</span>
          <button onClick={() => setActionError(null)}>✕</button>
        </div>
      )}

      {/* Admin Header */}
      <div className="glass-panel text-white rounded-2xl p-6 border border-purple-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-black text-white">{t('adminTitle')}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System identity verification, trust assurance, duplicate prevention, and operational logs
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Donors</span>
            <div className="text-xl font-black text-white mt-1 font-mono">{stats.totalDonors}</div>
            <span className="text-[10px] text-emerald-400 font-medium">
              {stats.verifiedDonors} Verified
            </span>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Review</span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">{stats.pendingDonors}</div>
            <span className="text-[10px] text-slate-500">Awaiting approval</span>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Available Now</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{stats.availableDonors}</div>
            <span className="text-[10px] text-slate-500">Ready to donate</span>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Hospitals</span>
            <div className="text-xl font-black text-blue-400 mt-1 font-mono">{stats.totalHospitals}</div>
            <span className="text-[10px] text-slate-500">{stats.verifiedHospitals} Verified</span>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Emergency Alerts</span>
            <div className="text-xl font-black text-red-500 mt-1 font-mono">{stats.emergencyRequests}</div>
            <span className="text-[10px] text-slate-500">Critical Priority</span>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Suspicious / Dups</span>
            <div className="text-xl font-black text-purple-400 mt-1 font-mono">{stats.suspiciousCount}</div>
            <span className="text-[10px] text-slate-500">Flagged records</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex border-b border-slate-800 bg-slate-950/80 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'donors'
                ? 'border-red-500 text-rose-400 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Donor Verification ({donors.length})
          </button>
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'hospitals'
                ? 'border-red-500 text-rose-400 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Hospital Verification ({hospitals.length})
          </button>
          <button
            onClick={() => setActiveTab('suspicious')}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'suspicious'
                ? 'border-red-500 text-rose-400 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Duplicate & Suspicious Records ({suspiciousData?.flaggedDonors.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'border-red-500 text-rose-400 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            System Blood Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-red-500 text-rose-400 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Notification Logs ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-red-500 text-rose-400 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Donor Verification Queue */}
        {activeTab === 'donors' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Donor ID / Name</th>
                  <th className="py-2.5 px-3">Group</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Completeness</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {donors.map((d) => {
                  const isIncomplete = d.profileCompleteness < 90;
                  const isVerified = d.verificationStatus === 'VERIFIED';

                  return (
                    <tr key={d.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{d.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {d.id} {d.isDemo && <span className="text-amber-400 font-semibold">[DEMO]</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-rose-300 bg-red-950/80 border border-red-800/40 px-2 py-0.5 rounded">
                          {d.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{d.phone}</div>
                        <div className="text-[11px] text-slate-500">{d.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{d.city}</div>
                        <div className="text-[11px] text-slate-500">{d.district}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                d.profileCompleteness >= 90 ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${d.profileCompleteness}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-300">{d.profileCompleteness}%</span>
                        </div>
                        {isIncomplete && (
                          <span className="text-[10px] text-amber-400 block mt-0.5">
                            Cannot verify if &lt; 90%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold text-[10px] px-2 py-0.5 rounded ${
                            isVerified
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : d.verificationStatus === 'PENDING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : d.verificationStatus === 'REJECTED'
                              ? 'bg-red-950 text-rose-300 border border-red-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {d.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isVerified && (
                            <>
                              <button
                                onClick={() => handleVerifyDonor(d.id, 'VERIFIED')}
                                disabled={isIncomplete}
                                className={`px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isIncomplete ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                                title={isIncomplete ? 'Complete profile required before verification' : 'Verify Donor'}
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleVerifyDonor(d.id, 'REJECTED')}
                                className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/40 text-amber-300 rounded text-[11px] transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {d.verificationStatus !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleVerifyDonor(d.id, 'SUSPENDED')}
                              className="px-2 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Hospital Verification Queue */}
        {activeTab === 'hospitals' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Hospital ID / Name</th>
                  <th className="py-2.5 px-3">Authorized Contact</th>
                  <th className="py-2.5 px-3">Contact Details</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{h.hospitalName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {h.id} {h.isDemo && <span className="text-amber-400 font-semibold">[DEMO]</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-medium">
                      {h.authorizedContact}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{h.phone}</div>
                      <div className="text-[11px] text-slate-500">{h.email}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{h.district}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded ${
                          h.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {h.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {h.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleVerifyHospital(h.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {h.verificationStatus !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleVerifyHospital(h.id, 'SUSPENDED')}
                            className="px-2 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 rounded text-[11px] cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Duplicate & Suspicious Records */}
        {activeTab === 'suspicious' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                {t('suspiciousFlagsTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                Rule 2: Automated duplicate detection across phone, email, and suspicious record flags.
              </p>
            </div>

            {suspiciousData?.duplicateGroups && suspiciousData.duplicateGroups.length > 0 ? (
              <div className="space-y-3">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                  {t('duplicatePhoneOrEmailWarning')}
                </span>
                {suspiciousData.duplicateGroups.map((g, idx) => (
                  <div key={idx} className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs space-y-2">
                    <div className="font-semibold text-rose-300">
                      Matched by {g.type}: <code className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-white">{g.key}</code> ({g.count} accounts)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {g.donors.map((d: any) => (
                        <div key={d.id} className="p-2.5 bg-slate-950 rounded-lg border border-red-500/30 text-[11px]">
                          <span className="font-bold text-white">{d.name}</span> ({d.id}) - Status: {d.status}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('noSuspiciousRecords')}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: System Blood Requests */}
        {activeTab === 'requests' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Req ID</th>
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Group & Units</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Responses</th>
                  <th className="py-2.5 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-300">{r.id}</td>
                    <td className="py-3 px-3 font-semibold text-white">{r.hospitalName}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-rose-400">{r.requiredBloodGroup}</span> ({r.unitsRequired} units)
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.urgency === 'EMERGENCY'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {r.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300">{r.status}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{r.responsesCount || 0}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Notification Logs */}
        {activeTab === 'notifications' && (
          <div className="p-4 overflow-x-auto">
            <p className="text-xs text-slate-400 mb-3">
              Delivery channel is currently <strong className="text-white">IN-APP</strong>. Logs record dispatch, viewing by donor, and responses.
            </p>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Notif ID / Time</th>
                  <th className="py-2.5 px-3">Recipient Donor</th>
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Urgency & Group</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-300 font-semibold">{n.id}</span>
                      <div className="text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <code className="font-mono text-slate-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">
                        {n.recipientDonorId}
                      </code>
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">{n.hospitalName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-rose-400">{n.requiredBloodGroup}</span> ({n.unitsRequired} units)
                      <span className="ml-1.5 text-[10px] font-bold text-slate-400">[{n.urgency}]</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          n.status === 'RESPONDED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : n.status === 'VIEWED'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-300">
                      {n.responseOption ? (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded ${
                            n.responseOption === 'I CAN DONATE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {n.responseOption}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Awaiting response</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Audit History */}
        {activeTab === 'audit' && (
          <div className="p-4 overflow-x-auto">
            <p className="text-xs text-slate-400 mb-3">{t('auditLogDescription')}</p>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-white">{log.actorName}</span>{' '}
                      <span className="text-[10px] text-slate-500">({log.actorRole})</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-400">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
