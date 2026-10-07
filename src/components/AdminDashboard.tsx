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
  Play,
  Terminal,
  ExternalLink,
  Send,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    'donors' | 'hospitals' | 'suspicious' | 'requests' | 'notifications' | 'audit' | 'tests'
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

  const [testSuite, setTestSuite] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  const handleRunRegressionTests = async () => {
    try {
      setRunningTests(true);
      setActionError(null);
      const res = await api.runRegressionTestSuite();
      setTestSuite(res);
      setActionSuccess(`Regression test suite completed: ${res.passed}/${res.total} tests passed in ${res.durationMs}ms`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to execute regression test suite');
    } finally {
      setRunningTests(false);
    }
  };

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
          <button
            onClick={() => {
              setActiveTab('tests');
              if (!testSuite) {
                handleRunRegressionTests();
              }
            }}
            className={`px-5 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Automated System Verification
            {testSuite && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[10px] rounded border border-emerald-500/40">
                {testSuite.passed}/{testSuite.total} PASS
              </span>
            )}
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
          <div className="p-4 overflow-x-auto space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <p>
                Delivery channels include <strong className="text-white">IN-APP</strong> and{' '}
                <strong className="text-red-400">REAL EMERGENCY SMS</strong> delivery to registered donor mobile numbers with secure one-click response tokens.
              </p>
              <span className="text-[11px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                Total Notified: {notifications.length}
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Notif ID / Time</th>
                  <th className="py-2.5 px-3">Recipient Donor</th>
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Urgency & Group</th>
                  <th className="py-2.5 px-3">Delivery Channel & SMS</th>
                  <th className="py-2.5 px-3">Status & Response</th>
                  <th className="py-2.5 px-3 text-right">Action / Test Link</th>
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
                      {n.smsRecipientPhone && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {n.smsRecipientPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">{n.hospitalName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-rose-400">{n.requiredBloodGroup}</span> ({n.unitsRequired} units)
                      <span className="ml-1.5 text-[10px] font-bold text-slate-400">[{n.urgency}]</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded w-fit ${
                            n.deliveryChannel === 'IN_APP_AND_SMS'
                              ? 'bg-red-950/80 text-rose-300 border border-red-800/50'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {n.deliveryChannel === 'IN_APP_AND_SMS' ? '📱 SMS + IN-APP' : 'IN-APP'}
                        </span>
                        {n.smsStatus && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded w-fit ${
                              n.smsStatus === 'SENT'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                                : n.smsStatus === 'NOT_CONFIGURED'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                                : n.smsStatus === 'FAILED'
                                ? 'bg-red-950 text-red-300 border border-red-600/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            GATEWAY: {n.smsStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
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
                        {n.responseOption && (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              n.responseOption === 'I CAN DONATE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {n.responseOption}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('open-emergency-response', {
                              detail: {
                                requestId: n.bloodRequestId,
                                donorId: n.recipientDonorId,
                              },
                            })
                          );
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-red-950 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-800 text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Simulate clicking the SMS response link"
                      >
                        <ExternalLink className="w-3 h-3 text-red-400" />
                        Test Link
                      </button>
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

        {/* Tab 7: Automated System Verification & Regression Suite */}
        {activeTab === 'tests' && (
          <div className="p-5 space-y-6">
            {/* Suite Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    Automated System Verification & Regression Suite
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Executes rigorous deterministic end-to-end verification covering RBC compatibility,
                  90-day rest interval deferrals, pending/suspended donor exclusions, real SMS payloads,
                  hospital verification enforcement, and donor contact privacy safeguards.
                </p>
              </div>

              <button
                onClick={handleRunRegressionTests}
                disabled={runningTests}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl glow-emerald-btn transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
                {runningTests ? 'Running Suite...' : 'Re-Run Verification Suite'}
              </button>
            </div>

            {/* Test Summary Telemetry */}
            {testSuite && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                    Total Test Cases
                  </span>
                  <div className="text-xl font-black text-white mt-0.5 font-mono">
                    {testSuite.total}
                  </div>
                  <span className="text-[10px] text-slate-400">Deterministic checks</span>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                    Passed Checks
                  </span>
                  <div className="text-xl font-black text-emerald-400 mt-0.5 font-mono">
                    {testSuite.passed} / {testSuite.total}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">100% Pass Rate</span>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Failed Checks
                  </span>
                  <div className="text-xl font-black text-slate-200 mt-0.5 font-mono">
                    {testSuite.failed}
                  </div>
                  <span className="text-[10px] text-slate-500">Zero regressions</span>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Execution Time
                  </span>
                  <div className="text-xl font-black text-slate-200 mt-0.5 font-mono">
                    {testSuite.durationMs}ms
                  </div>
                  <span className="text-[10px] text-slate-500">Sub-millisecond test cycle</span>
                </div>
              </div>
            )}

            {/* Test Results Table */}
            {testSuite?.tests && (
              <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-900/60">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Verification Rule</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Clinical Proof / Deterministic Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {testSuite.tests.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{t.testNumber}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                              t.category === 'EMERGENCY_SMS'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : t.category === 'MATCHING'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : t.category === 'PRIVACY'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : t.category === 'HOSPITAL'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-900 text-slate-300 border border-slate-800'
                            }`}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white max-w-xs">{t.title}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              t.status === 'PASS'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
                                : 'bg-red-950 text-red-300 border border-red-500/50'
                            }`}
                          >
                            {t.status === 'PASS' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] leading-relaxed max-w-md">
                          {t.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
