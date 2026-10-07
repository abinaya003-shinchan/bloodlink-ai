import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Donor, DonorResponse, DonorResponseType, DonorStatus, Notification } from '../types';
import { MEDICAL_DISCLAIMER_EN, MEDICAL_DISCLAIMER_TA } from '../services/compatibility';
import { DistrictSelect } from './DistrictSelect';
import { validateDonorDob, calculateAgeFromDob } from '../utils/validation';
import {
  HeartPulse,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  Bell,
  Check,
  Send,
  Edit3,
  X,
  LogOut,
  Info,
  ExternalLink,
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const { donor, refreshProfile, logout } = useAuth();
  const { t, language } = useLanguage();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [responses, setResponses] = useState<DonorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<string>('');

  // Edit Profile Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editDistrict, setEditDistrict] = useState('Chennai');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPreferredLang, setEditPreferredLang] = useState<'en' | 'ta'>('ta');
  const [editEmergency, setEditEmergency] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchDonorData = async () => {
    if (!donor) return;
    setLoading(true);
    try {
      const [notifs, resps] = await Promise.all([
        api.getDonorNotifications(donor.id),
        api.getDonorResponses(donor.id),
      ]);
      setNotifications(notifs);
      setResponses(resps);

      // Rule I: Track notification status: NOTIFIED -> VIEWED
      for (const n of notifs) {
        if (n.status === 'NOTIFIED' || (n.status as string) === 'DELIVERED') {
          api.markNotificationViewed(n.id).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to fetch donor notifications/responses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, [donor?.id]);

  const openEditModal = () => {
    if (!donor) return;
    setEditFullName(donor.fullName);
    setEditPhone(donor.phone);
    setEditEmail(donor.email);
    setEditDob(donor.dob);
    setEditGender(donor.gender);
    setEditDistrict(donor.district);
    setEditCity(donor.city);
    setEditAddress(donor.location.address || '');
    setEditPreferredLang(donor.preferredLanguage);
    setEditEmergency(donor.emergencyAvailable);
    setEditError(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donor) return;
    setEditError(null);

    // Validate Date of Birth
    const dobCheck = validateDonorDob(editDob);
    if (!dobCheck.valid) {
      setEditError(dobCheck.error || 'Invalid date of birth');
      return;
    }

    setEditLoading(true);

    try {
      await api.updateDonorProfile(donor.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        dob: editDob,
        gender: editGender,
        district: editDistrict,
        city: editCity.trim(),
        location: {
          ...donor.location,
          address: editAddress.trim(),
          district: editDistrict,
          city: editCity.trim(),
        },
        preferredLanguage: editPreferredLang,
        emergencyAvailable: editEmergency,
      });

      await refreshProfile();
      setIsEditingProfile(false);
      setActionMessage(t('profileUpdated'));
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (!donor) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
        <HeartPulse className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Donor Profile Not Found</h2>
        <p className="text-sm text-slate-600 mt-2">
          No registered donor profile linked to this account yet. Please register as a donor.
        </p>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: DonorStatus) => {
    try {
      await api.updateDonorAvailability(donor.id, { status: newStatus });
      await refreshProfile();
      setActionMessage(`Availability updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleEmergencyToggle = async () => {
    try {
      await api.updateDonorAvailability(donor.id, {
        emergencyAvailable: !donor.emergencyAvailable,
      });
      await refreshProfile();
      setActionMessage('Emergency on-call status updated');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update emergency preference');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await api.verifyPhoneOtp(donor.id);
      await refreshProfile();
      setActionMessage('Phone and Email verified! Ready for admin verification approval.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleLogDonationToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await api.updateDonorAvailability(donor.id, {
        lastDonationDate: today,
        status: 'Recently Donated',
      });
      await refreshProfile();
      setActionMessage('Logged donation for today. Status updated to Recently Donated (90-day rest interval).');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to log donation');
    }
  };

  const handleRespond = async (bloodRequestId: string, option: DonorResponseType) => {
    try {
      await api.respondToRequest(donor.id, bloodRequestId, option, responseNotes);
      setRespondingTo(null);
      setResponseNotes('');
      setActionMessage(t('responseRecorded'));
      setTimeout(() => setActionMessage(null), 4000);
      await fetchDonorData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    }
  };

  const isVerified = donor.verificationStatus === 'VERIFIED';
  const isPending = donor.verificationStatus === 'PENDING';
  const isSuspended = donor.verificationStatus === 'SUSPENDED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Alert Message */}
      {actionMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="glass-panel rounded-3xl border border-red-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-red-950/40 to-slate-950 text-white flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/80">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex flex-col items-center justify-center font-black text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] shrink-0 animate-heart-pulse">
              <span className="text-2xl sm:text-3xl leading-none">{donor.bloodGroup}</span>
              <span className="text-[10px] tracking-widest uppercase opacity-90 mt-1">RBC</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">{donor.fullName}</h1>
                {donor.isDemo ? (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                    {t('demoData')}
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                    {t('realVerified')}
                  </span>
                )}
                {isVerified ? (
                  <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {t('verified')}
                  </span>
                ) : isPending ? (
                  <span className="bg-amber-950/80 text-amber-300 border border-amber-500/50 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {t('pendingVerification')}
                  </span>
                ) : isSuspended ? (
                  <span className="bg-red-950/80 text-red-300 border border-red-500/50 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {t('suspended')}
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded">
                    {donor.verificationStatus}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Donor ID:</span>
                  <code className="font-mono text-red-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-bold">{donor.id}</code>
                </span>
                <span>•</span>
                <span>{donor.age} yrs ({donor.gender})</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  {donor.city}, {donor.district}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap gap-3 font-mono">
                <span>Last Updated: {new Date(donor.updatedAt || donor.createdAt).toLocaleDateString()}</span>
                {donor.verifiedAt && (
                  <span>• Verified: {new Date(donor.verifiedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* LARGE STATUS INDICATOR & CONTROLS (Item 13) */}
          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Status:</span>
              <span
                className={`text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg ${
                  donor.status === 'Available'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : donor.status === 'Recently Donated'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    donor.status === 'Available' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {donor.status === 'Available' ? 'AVAILABLE NOW 🟢' : donor.status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={openEditModal}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                {t('editProfile')}
              </button>

              {donor.status === 'Available' ? (
                <button
                  onClick={() => handleStatusChange('Temporarily Unavailable')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  {t('markUnavailable')}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('Available')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl glow-emerald-btn transition-colors cursor-pointer"
                >
                  {t('markAvailable')}
                </button>
              )}

              <button
                onClick={handleLogDonationToday}
                className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl glow-ruby-btn transition-colors cursor-pointer"
                title="Log that you donated blood today (starts 90-day rest interval)"
              >
                {t('markDonated')}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Completeness & Emergency Badges */}
        <div className="p-5 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">{t('profileCompleteness')}:</span>
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                <div
                  className={`h-2 rounded-full ${
                    donor.profileCompleteness >= 90
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${donor.profileCompleteness}%` }}
                />
              </div>
              <span className="font-mono font-bold text-white text-xs">{donor.profileCompleteness}%</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">24/7 Emergency On-Call:</span>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                onClick={handleEmergencyToggle}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  donor.emergencyAvailable
                    ? 'bg-red-950 text-red-200 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}
              >
                {donor.emergencyAvailable ? 'ON-CALL ACTIVE 🚨' : 'Standard Routine Only'}
              </button>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Verification Pipeline:</span>
            <div className="mt-1.5 flex items-center gap-2">
              {donor.phoneVerified ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold text-xs">
                  <Check className="w-4 h-4 text-emerald-400" /> Phone & Email Confirmed
                </span>
              ) : (
                <button
                  onClick={handleVerifyOtp}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  {t('simulateOtpVerify')}
                </button>
              )}
            </div>
          </div>
        </div>

        {isPending && (
          <div className="px-6 py-2.5 bg-amber-950/40 border-t border-amber-800/40 text-xs text-amber-200 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              {t('verificationNotice')}
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              Admin Review Queue Active
            </span>
          </div>
        )}
      </div>

      {/* Incoming Requests / Notifications (Core Feature) */}
      <div className="glass-panel rounded-3xl border border-red-500/30 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shadow-md">
              <Bell className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{t('incomingRequests')}</h2>
              <p className="text-xs text-slate-400">Emergency & routine alerts tailored to your blood group and location</p>
            </div>
            <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full ml-1 shadow-sm">
              {notifications.length}
            </span>
          </div>

          <button
            onClick={fetchDonorData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
            <p className="text-sm font-bold text-white">No pending blood requests at this moment.</p>
            <p className="text-xs text-slate-500">You will receive an immediate in-app notification when a compatible blood request matches your profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const isResponded = notif.status === 'RESPONDED';

              return (
                <div
                  key={notif.id}
                  className={`border rounded-2xl p-5 transition-all ${
                    notif.urgency === 'EMERGENCY'
                      ? 'glass-panel-emergency border-red-500/50 shadow-[0_0_25px_rgba(225,29,72,0.2)]'
                      : 'glass-card-interactive border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            notif.urgency === 'EMERGENCY'
                              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_10px_#ef4444]'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {notif.urgency}
                        </span>
                        <h3 className="text-base font-bold text-white">{notif.title}</h3>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{notif.message}</p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-200 block">{notif.hospitalName}</span>
                      {notif.approxDistanceKm && (
                        <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                          📍 ~{notif.approxDistanceKm} km away
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Response Status */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 font-mono">
                      <span>
                        Channel:{' '}
                        <strong className="text-slate-200">
                          {notif.deliveryChannel === 'IN_APP_AND_SMS' ? '📱 SMS + IN-APP' : 'IN-APP'}
                        </strong>
                      </span>
                      {notif.smsRecipientPhone && (
                        <>
                          <span>•</span>
                          <span>SMS: <strong className="text-rose-400">{notif.smsRecipientPhone}</strong></span>
                        </>
                      )}
                      {notif.smsStatus && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">Gateway: {notif.smsStatus}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Status: <strong className="text-red-400 uppercase">{notif.status}</strong></span>
                      <span>•</span>
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('open-emergency-response', {
                              detail: {
                                requestId: notif.bloodRequestId,
                                donorId: notif.recipientDonorId,
                              },
                            })
                          );
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-rose-300 border border-red-800/50 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Simulate opening response portal from SMS alert"
                      >
                        <ExternalLink className="w-3 h-3 text-red-400" />
                        SMS Response Portal
                      </button>

                      {isResponded ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <Check className="w-4 h-4 text-emerald-400" />
                            Responded: {notif.responseOption}
                          </span>
                        </div>
                      ) : (
                      <div className="flex items-center gap-2">
                        {respondingTo === notif.bloodRequestId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Optional note (e.g. Can reach within 20 mins)"
                              value={responseNotes}
                              onChange={(e) => setResponseNotes(e.target.value)}
                              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                            />
                            <button
                              onClick={() => handleRespond(notif.bloodRequestId, 'I CAN DONATE')}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl glow-emerald-btn transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRespondingTo(null)}
                              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setRespondingTo(notif.bloodRequestId)}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl glow-emerald-btn transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {t('iCanDonate')}
                            </button>
                            <button
                              onClick={() => handleRespond(notif.bloodRequestId, 'NOT AVAILABLE')}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                            >
                              {t('notAvailable')}
                            </button>
                            <button
                              onClick={() => handleRespond(notif.bloodRequestId, 'MAYBE LATER')}
                              className="px-3 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                            >
                              {t('maybeLater')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Responses / Donation History */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-white">{t('responseHistory')}</h2>
        {responses.length === 0 ? (
          <p className="text-xs text-slate-400">No response records logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {responses.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">
                    Request ID: <code className="text-red-300 font-mono">{r.bloodRequestId}</code>
                  </span>
                  <span className="ml-2 font-mono text-slate-500">
                    ({new Date(r.respondedAt).toLocaleDateString()})
                  </span>
                  {r.notes && <p className="text-slate-400 text-[11px] italic mt-0.5">&ldquo;{r.notes}&rdquo;</p>}
                </div>
                <span
                  className={`font-black px-2.5 py-1 rounded-full text-[11px] ${
                    r.response === 'I CAN DONATE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {r.response}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      <div className="p-5 rounded-2xl glass-panel-subtle border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
        <p className="font-medium text-slate-300 mb-1">
          {language === 'ta' ? MEDICAL_DISCLAIMER_TA : MEDICAL_DISCLAIMER_EN}
        </p>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{t('editProfile')}</h2>
                <p className="text-xs text-slate-400">
                  Update contact info, location, and emergency availability
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('bloodGroup')} (Fixed)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={donor.bloodGroup}
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('phoneNumber')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('emailAddress')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('dateOfBirth')} (18-65 yrs)
                  </label>
                  <input
                    type="date"
                    required
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('gender')}
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>

                <div>
                  <DistrictSelect
                    value={editDistrict}
                    onChange={setEditDistrict}
                    label={t('district')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('cityArea')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('locationAddress')}
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. 15 South Mada Street"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-red-900">
                    {t('emergencyAvailability')}
                  </span>
                  <span className="text-[11px] text-red-700">
                    Available for 24/7 priority emergency calls
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {editLoading ? t('loading') : t('saveProfile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
