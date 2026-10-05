import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BloodRequest, BloodGroup } from '../types';
import {
  Flame,
  AlertOctagon,
  HeartPulse,
  Bell,
  Clock,
  Building2,
  MapPin,
  CheckCircle,
  PlusCircle,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface EmergencyViewProps {
  onCreateEmergencyClick: () => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ onCreateEmergencyClick }) => {
  const { language } = useLanguage();
  const { hospital } = useAuth();

  const [emergencyRequests, setEmergencyRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEmergencyRequests = async () => {
    setLoading(true);
    try {
      const all = await api.getBloodRequests();
      const emergencies = all.filter((r) => r.urgency === 'EMERGENCY' || r.urgency === 'URGENT');
      setEmergencyRequests(emergencies);
    } catch (err) {
      console.error('Failed to load emergency requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  const handleNotifyDonors = async (reqId: string) => {
    setNotifyingId(reqId);
    try {
      const res = await api.notifyMatchedDonors(reqId);
      setToastMessage(`Dispatched in-app emergency alert to ${res.notifiedCount} matching donors!`);
      setTimeout(() => setToastMessage(null), 4000);
      await fetchEmergencyRequests();
    } catch (err: any) {
      alert(err.message || 'Notification error');
    } finally {
      setNotifyingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Emergency Command Hero Banner */}
      <div className="glass-panel-emergency p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-red-500/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/80 border border-red-400 text-red-100 text-xs font-black uppercase tracking-wider animate-pulse">
              <Flame className="w-4 h-4 text-red-400" />
              <span>{language === 'ta' ? 'அவசர சிகிச்சை நெட்வொர்க்' : 'EMERGENCY TRAUMA RESPONSE'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {language === 'ta' ? 'அதி அவசர இரத்தக் கோரிக்கைகள்' : 'Active Emergency Blood Requests'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {language === 'ta'
                ? 'தீவிர சிகிச்சை மற்றும் விபத்து பிரிவுகளுக்கான உடனடி இரத்த தான அறிவிப்பு மற்றும் பொருத்துதல் மையம்.'
                : 'Urgent requests broadcast with zero latency to on-call 24/7 verified donors in the hospital perimeter.'}
            </p>
          </div>

          <button
            onClick={onCreateEmergencyClick}
            className="px-7 py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2.5 glow-ruby-btn shrink-0 cursor-pointer"
          >
            <AlertOctagon className="w-5 h-5" />
            <span>{language === 'ta' ? 'அவசரக் கோரிக்கை வெளியிடு' : 'CREATE EMERGENCY REQUEST'}</span>
          </button>
        </div>
      </div>

      {/* Active Emergencies List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            {emergencyRequests.length} Active Urgent Demands
          </span>
          <span className="font-mono text-[11px]">Channel: IN-APP Notification Broadcast</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span>Monitoring emergency blood network...</span>
          </div>
        ) : emergencyRequests.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No active emergency alerts</h3>
            <p className="text-xs text-slate-400">All regional blood bank buffers are currently stable.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyRequests.map((req) => {
              const isCritical = req.urgency === 'EMERGENCY';

              return (
                <div
                  key={req.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isCritical
                      ? 'glass-panel-emergency border-red-500/60 shadow-[0_0_30px_rgba(225,29,72,0.2)]'
                      : 'glass-card-interactive border-slate-800'
                  }`}
                >
                  {/* Top Bar: Group & Urgency */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex flex-col items-center justify-center font-black text-white shadow-lg shrink-0">
                        <span className="text-xl leading-none">{req.requiredBloodGroup}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-90">RBC</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                            {req.urgency}
                          </span>
                          <span className="text-xs font-mono text-slate-400">#{req.id}</span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{req.patientRef}</h3>
                        <span className="text-xs font-semibold text-red-300 block">
                          Units Needed: {req.unitsRequired} Pints / Bags
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200 block">{req.hospitalName}</span>
                      <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400" />
                        {req.hospitalLocation.city || req.hospitalLocation.district}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Clinical Urgency */}
                  {req.additionalNotes && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 mb-4">
                      <span className="font-semibold text-red-400">Clinical Ward Notes:</span>{' '}
                      {req.additionalNotes}
                    </div>
                  )}

                  {/* Tracker / Actions Bottom */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Notified: <strong className="text-white">{req.notifiedDonorsCount || 0}</strong> •{' '}
                      Responses: <strong className="text-emerald-400">{req.responsesCount || 0}</strong>
                    </div>

                    <button
                      onClick={() => handleNotifyDonors(req.id)}
                      disabled={notifyingId === req.id}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 glow-ruby-btn transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{notifyingId === req.id ? 'Broadcasting...' : 'ALERT MATCHED DONORS'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
