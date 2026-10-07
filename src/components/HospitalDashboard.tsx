import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { BloodGroup, BloodRequest, DonorMatchResult, DonorResponse, RequestUrgency } from '../types';
import { MEDICAL_DISCLAIMER_EN, MEDICAL_DISCLAIMER_TA } from '../services/compatibility';
import {
  Building2,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Phone,
  RefreshCw,
  Filter,
  Check,
  MapPin,
  Send,
  Users,
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const HospitalDashboard: React.FC = () => {
  const { hospital } = useAuth();
  const { t, language } = useLanguage();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matches, setMatches] = useState<DonorMatchResult[]>([]);
  const [responses, setResponses] = useState<DonorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  // New request form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patientRef, setPatientRef] = useState('');
  const [requiredBloodGroup, setRequiredBloodGroup] = useState<BloodGroup>('A+');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [urgency, setUrgency] = useState<RequestUrgency>('URGENT');
  const [requiredDateTime, setRequiredDateTime] = useState('Within 3 hours');
  const [contactNumber, setContactNumber] = useState(hospital?.phone || '+91 94444 00002');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [aiRawText, setAiRawText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const allRequests = await api.getBloodRequests();
      const hospitalRequests = hospital
        ? allRequests.filter((r) => r.hospitalId === hospital.id || r.hospitalName === hospital.hospitalName)
        : allRequests;

      setRequests(hospitalRequests);
      if (hospitalRequests.length > 0 && !selectedRequestId) {
        setSelectedRequestId(hospitalRequests[0].id);
      }
    } catch (err) {
      console.error('Failed to load blood requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesForRequest = async (requestId: string) => {
    setMatchesLoading(true);
    try {
      const [matchData, respData] = await Promise.all([
        api.getRequestMatches(requestId, {
          verifiedOnly: filterVerifiedOnly,
          availableOnly: filterAvailableOnly,
        }),
        api.getRequestResponses(requestId),
      ]);
      setMatches(matchData.matches);
      setResponses(respData);
    } catch (err) {
      console.error('Failed to fetch request matches or responses:', err);
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [hospital?.id]);

  useEffect(() => {
    if (selectedRequestId) {
      fetchMatchesForRequest(selectedRequestId);
    }
  }, [selectedRequestId, filterVerifiedOnly, filterAvailableOnly]);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  // AI Parse handler
  const handleAIParse = async () => {
    if (!aiRawText.trim()) return;
    setAiParsing(true);
    try {
      const parsed = await api.parseEmergencyRequestWithAI(aiRawText.trim());
      if (parsed.requiredBloodGroup) setRequiredBloodGroup(parsed.requiredBloodGroup as BloodGroup);
      if (parsed.unitsRequired) setUnitsRequired(parsed.unitsRequired);
      if (parsed.urgency) setUrgency(parsed.urgency as RequestUrgency);
      if (parsed.patientRef) setPatientRef(parsed.patientRef);
      if (parsed.clinicalNotes) setAdditionalNotes(parsed.clinicalNotes);
      setAiAnalysis({
        clinicalPriority: parsed.clinicalPriorityAnalysis,
        donorSearchSummary: `AI parsed blood request for ${parsed.unitsRequired || 1} units of ${parsed.requiredBloodGroup}. Urgency: ${parsed.urgency}.`,
        compatibilityGuidance: 'ABO/Rh compatibility engine active.',
      });
      setActionSuccess('AI extracted clinical parameters successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'AI parsing error');
    } finally {
      setAiParsing(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;

    setLoading(true);
    try {
      const result = await api.createBloodRequest({
        hospitalId: hospital.id,
        patientRef: patientRef.trim() || `Patient-${Math.floor(1000 + Math.random() * 9000)}`,
        requiredBloodGroup,
        unitsRequired,
        urgency,
        requiredDateTime,
        contactNumber,
        additionalNotes,
        aiAnalysis,
        autoNotify: urgency === 'EMERGENCY',
      });

      setShowCreateModal(false);
      setAiRawText('');
      setAiAnalysis(null);
      setPatientRef('');
      setAdditionalNotes('');
      await fetchRequests();
      setSelectedRequestId(result.request.id);
      setActionSuccess(`Blood request published! Found ${result.matchCount} compatible candidates.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyDonors = async () => {
    if (!selectedRequestId) return;
    try {
      const result = await api.notifyMatchedDonors(selectedRequestId);
      setActionSuccess(`Emergency alert sent to ${result.notifiedCount} matching donors via in-app notification!`);
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchRequests();
      await fetchMatchesForRequest(selectedRequestId);
    } catch (err: any) {
      alert(err.message || 'Notification error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedRequestId) return;
    try {
      await api.updateRequestStatus(selectedRequestId, newStatus);
      await fetchRequests();
      setActionSuccess(`Request status updated to ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Action Success Toast */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Hospital Profile Banner */}
      <div className="glass-panel rounded-2xl border border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-white">
                {hospital?.hospitalName || 'Hospital Dashboard'}
              </h1>
              {hospital?.isDemo && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                  {t('demoData')}
                </span>
              )}
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {hospital?.verificationStatus === 'VERIFIED' ? t('verified') : t('pendingVerification')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hospital ID: <span className="font-mono text-slate-300">{hospital?.id}</span> • {hospital?.city}, {hospital?.district}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl glow-ruby-btn flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {t('newRequest')}
        </button>
      </div>

      {/* Main Grid: Left Request List, Right Matching Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Blood Requests List (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-500" />
              {t('bloodRequests')} ({requests.length})
            </h2>
            <button
              onClick={fetchRequests}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No active blood requests. Click &ldquo;Create Blood Request&rdquo; to start matching.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {requests.map((req) => {
                const isSelected = req.id === selectedRequestId;
                const isEmergency = req.urgency === 'EMERGENCY';

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50'
                        : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-white">{req.requiredBloodGroup}</span>
                        <span className="text-xs text-slate-400">({req.unitsRequired} units)</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isEmergency
                            ? 'bg-red-600 text-white animate-pulse'
                            : req.urgency === 'URGENT'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium truncate">
                      {req.patientRef}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="font-mono text-slate-400">{req.id}</span>
                      <span className="font-semibold text-slate-300">{req.status}</span>
                    </div>

                    {req.responsesCount && req.responsesCount > 0 ? (
                      <div className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {req.responsesCount} donor(s) responded!
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Request Details & Smart Matching (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRequest ? (
            <>
              {/* Selected Request Summary Bar */}
              <div className="glass-panel rounded-2xl border border-red-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Request #{selectedRequest.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          selectedRequest.urgency === 'EMERGENCY'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {selectedRequest.urgency}
                      </span>
                      <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded font-medium">
                        Status: {selectedRequest.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white mt-1">
                      {selectedRequest.requiredBloodGroup} Blood Needed ({selectedRequest.unitsRequired} Units)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Patient: <span className="font-semibold text-slate-200">{selectedRequest.patientRef}</span> • Needed By: {selectedRequest.requiredDateTime}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNotifyDonors}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl glow-ruby-btn flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Send in-app notification to all matched donors"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {t('notifyMatchedDonors')}
                    </button>

                    {selectedRequest.status !== 'Fulfilled' && selectedRequest.status !== 'Cancelled' && (
                      <>
                        <button
                          onClick={() => handleStatusChange('Fulfilled')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          {t('fulfillRequest')}
                        </button>
                        <button
                          onClick={() => handleStatusChange('Cancelled')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                          {t('cancelRequest')}
                        </button>
                      </>
                    )}

                    {(selectedRequest.status === 'Fulfilled' || selectedRequest.status === 'Cancelled') && (
                      <button
                        onClick={() => handleStatusChange('Open')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        Reopen Request
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Clinical Notes & AI Triage */}
                {selectedRequest.additionalNotes && (
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-slate-300">Clinical Notes:</span>
                    <p className="text-slate-400">{selectedRequest.additionalNotes}</p>
                    {selectedRequest.aiAnalysis?.clinicalPriority && (
                      <div className="mt-1 pt-1 border-t border-slate-800 text-purple-300 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        AI Assessment: {selectedRequest.aiAnalysis.clinicalPriority}
                      </div>
                    )}
                  </div>
                )}

                {/* Donor Responses Real-Time Tracker */}
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      {t('responsesReceived')} ({responses.length})
                    </span>
                    <span className="text-[11px] font-normal text-emerald-400">
                      Real-time response audit
                    </span>
                  </div>

                  {responses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No responses yet. Once matched donors respond in their app, their contact status will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {responses.map((resp) => (
                        <div
                          key={resp.id}
                          className="p-2.5 bg-slate-950/80 border border-emerald-500/30 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{resp.donorName}</span>
                            <span className="ml-2 font-bold text-red-400">({resp.donorBloodGroup})</span>
                            <span className="ml-2 font-mono text-[11px] text-slate-400">
                              {new Date(resp.respondedAt).toLocaleTimeString()}
                            </span>
                            {resp.responseChannel === 'SMS_LINK' && (
                              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800/50 text-rose-300">
                                📱 SMS Link
                              </span>
                            )}
                            {resp.notes && (
                              <p className="text-slate-400 text-[11px] mt-0.5">Note: &ldquo;{resp.notes}&rdquo;</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                resp.response === 'I CAN DONATE'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                  : resp.response === 'NOT AVAILABLE'
                                  ? 'bg-slate-900 text-slate-400 border border-slate-800'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                              }`}
                            >
                              {resp.response}
                            </span>

                            {resp.donorPhone ? (
                              <a
                                href={`tel:${resp.donorPhone}`}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500 transition-colors shadow-xs"
                              >
                                <Phone className="w-3 h-3" />
                                Call {resp.donorPhone}
                              </a>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                🔒 Contact Protected
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Smart Matching Engine Results Section */}
              <div className="glass-panel rounded-2xl border border-red-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      {t('matchingEngineTitle')} ({matches.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ranked by compatibility, verification status, proximity, and availability
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={filterVerifiedOnly}
                        onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                      />
                      {t('filterVerifiedOnly')}
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={filterAvailableOnly}
                        onChange={(e) => setFilterAvailableOnly(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                      />
                      {t('filterAvailableOnly')}
                    </label>
                  </div>
                </div>

                {matchesLoading ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Running smart matching algorithm...
                  </div>
                ) : matches.length === 0 ? (
                  <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200">
                    {t('noCompatibleDonors')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((donorMatch) => {
                      const isVerified = donorMatch.verificationStatus === 'VERIFIED';
                      const isTopMatch = donorMatch.matchScore >= 80;

                      return (
                        <div
                          key={donorMatch.donorId}
                          className={`p-4 rounded-xl border transition-all ${
                            isTopMatch
                              ? 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'border-slate-800 bg-slate-900/60'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-bold flex flex-col items-center justify-center shrink-0 shadow-xs">
                                <span className="text-sm leading-tight">{donorMatch.bloodGroup}</span>
                                <span className="text-[9px] uppercase">RBC</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-white">
                                    {donorMatch.displayName}
                                  </span>
                                  {donorMatch.isDemo && (
                                    <span className="bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      {t('demoData')}
                                    </span>
                                  )}
                                  {isVerified ? (
                                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      {t('verified')}
                                    </span>
                                  ) : (
                                    <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                      {t('pendingVerification')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>ID: <code className="font-mono text-slate-300">{donorMatch.donorId}</code></span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <MapPin className="w-3 h-3 text-red-400" />
                                    {donorMatch.distanceDisplay}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Score & Compatibility Pill */}
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-xs text-slate-400 font-medium">{t('explainableScore')}:</span>
                                <span
                                  className={`text-sm font-extrabold px-2 py-0.5 rounded font-mono ${
                                    donorMatch.matchScore >= 80
                                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                      : donorMatch.matchScore >= 60
                                      ? 'bg-amber-500 text-slate-950 font-black'
                                      : 'bg-slate-700 text-white'
                                  }`}
                                >
                                  {donorMatch.matchScore} / 100
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                                Status: {donorMatch.availability}
                              </span>
                            </div>
                          </div>

                          {/* Explainable Matching Criteria (Rule 6: Why this donor was selected) */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 mr-1">
                              {t('whySelected')}:
                            </span>
                            {donorMatch.reasons.map((reason, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  reason === 'BEST MATCH'
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : reason.includes('Universal')
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                                    : reason.includes('Exact')
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-slate-400 text-xs">
              Select or create a blood request to view AI smart matching.
            </div>
          )}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="p-4 glass-panel-subtle rounded-xl border border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-200 mb-1">Medical Blood-Bank Protocol Disclaimer:</p>
        <p>{language === 'ta' ? MEDICAL_DISCLAIMER_TA : MEDICAL_DISCLAIMER_EN}</p>
      </div>

      {/* CREATE BLOOD REQUEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-950 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-2xl w-full my-8 overflow-hidden border border-red-500/30">
            <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{t('createRequestTitle')}</h2>
                <p className="text-xs text-slate-400">
                  Broadcast normal or emergency blood demand to compatible verified donors
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Optional AI Assistant Input Box */}
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    {t('aiAssistPrompt')}
                  </label>
                  <button
                    type="button"
                    onClick={handleAIParse}
                    disabled={aiParsing || !aiRawText.trim()}
                    className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {aiParsing ? t('loading') : t('aiAssistButton')}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={aiRawText}
                  onChange={(e) => setAiRawText(e.target.value)}
                  placeholder="e.g. Critical ICU trauma patient needing 2 units of B+ immediately due to arterial bleeding."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-purple-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('patientReference')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientRef}
                    onChange={(e) => setPatientRef(e.target.value)}
                    placeholder="e.g. Patient #ICU-402 (Surgery)"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('bloodGroup')} *
                  </label>
                  <select
                    value={requiredBloodGroup}
                    onChange={(e) => setRequiredBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('unitsRequired')} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('urgencyLevel')} *
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as RequestUrgency)}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="NORMAL">NORMAL (Planned / Routine)</option>
                    <option value="URGENT">URGENT (Within 3-6 hours)</option>
                    <option value="EMERGENCY">EMERGENCY (Immediate Life Support)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('requiredDateTime')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={requiredDateTime}
                    onChange={(e) => setRequiredDateTime(e.target.value)}
                    placeholder="e.g. Immediate / By 5:00 PM today"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('contactPersonPhone')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 94444 00002"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('additionalClinicalNotes')}
                </label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Trauma ward bed 4, surgical prep in progress."
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl glow-ruby-btn transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? t('loading') : t('submitRequestButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
