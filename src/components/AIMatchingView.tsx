import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BloodGroup, BloodRequest, DonorMatchResult } from '../types';
import { isCompatible, getCompatibilityDetails, getCompatibleDonorBloodGroups } from '../services/compatibility';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Droplet,
  Activity,
  Cpu,
  RefreshCw,
  Search,
  Bell,
  HeartPulse,
} from 'lucide-react';

interface AIMatchingViewProps {
  onRequestBloodClick: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const AIMatchingView: React.FC<AIMatchingViewProps> = ({ onRequestBloodClick }) => {
  const { language, t } = useLanguage();
  const { hospital } = useAuth();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [matches, setMatches] = useState<DonorMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [interactiveRecipient, setInteractiveRecipient] = useState<BloodGroup>('A+');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const list = await api.getBloodRequests();
        setRequests(list);
        if (list.length > 0) {
          setSelectedRequest(list[0]);
        }
      } catch (err) {
        console.error('Failed to load blood requests in AIMatchingView:', err);
      }
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      const loadMatches = async () => {
        setLoading(true);
        try {
          const res = await api.getRequestMatches(selectedRequest.id);
          setMatches(res.matches);
        } catch (err) {
          console.error('Failed to fetch AI matches:', err);
        } finally {
          setLoading(false);
        }
      };
      loadMatches();
    }
  }, [selectedRequest?.id]);

  const compatibleGroupsForRecipient = getCompatibleDonorBloodGroups(interactiveRecipient);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span>{language === 'ta' ? 'செயற்கை நுண்ணறிவு பொருத்துதல்' : 'AI SMART DONOR MATCHING ENGINE'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {language === 'ta' ? 'துல்லியமான இரத்தப் பொருத்தம்' : 'AI Smart Donor Match'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
              {language === 'ta'
                ? 'மருத்துவமனை கோரிக்கைகளை இரத்த இணக்கத்தன்மை, சரிபார்ப்பு, தொலைவு மற்றும் தயார்நிலையைக் கொண்டு வரிசைப்படுத்துகிறது.'
                : 'Deterministic ABO/Rh medical rules combined with real-time geographic proximity and donor reliability scoring.'}
            </p>
          </div>

          <button
            onClick={onRequestBloodClick}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 glow-ruby-btn shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'ta' ? 'புதிய கோரிக்கை & பொருத்தம்' : 'NEW REQUEST & MATCH'}</span>
          </button>
        </div>

        {/* Futuristic Match Pipeline Diagram */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-3">
            Algorithmic Pipeline:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block">STEP 1</span>
              <strong className="text-white">Hospital Request</strong>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-red-400 text-[10px] block">STEP 2</span>
              <strong className="text-red-300">ABO/Rh Matrix</strong>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-blue-400 text-[10px] block">STEP 3</span>
              <strong className="text-blue-300">Verification Filter</strong>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-purple-400 text-[10px] block">STEP 4</span>
              <strong className="text-purple-300">Distance Rank</strong>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-emerald-400 text-[10px] block">STEP 5</span>
              <strong className="text-emerald-300">Availability Check</strong>
            </div>
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)]">
              <span className="text-amber-300 text-[10px] block">OUTPUT</span>
              <strong className="text-white glow-text-red">BEST MATCH</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Request Selector on Left, Ranked AI Matches on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Select Blood Request */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Select Active Request</span>
              <span className="text-[10px] font-mono text-slate-400">{requests.length} Requests</span>
            </h2>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {requests.map((r) => {
                const isSelected = selectedRequest?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRequest(r)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/70 border-red-500 shadow-[0_0_15px_rgba(225,29,72,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm text-white">{r.requiredBloodGroup}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          r.urgency === 'EMERGENCY'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {r.urgency}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium truncate">{r.patientRef}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                      <span>{r.hospitalName}</span>
                      <span>{r.unitsRequired} units</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive RBC Compatibility Matrix Explorer */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Droplet className="w-4 h-4 text-red-500" />
              <span>ABO/Rh Compatibility Explorer</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Select a recipient blood group to inspect medical RBC donor suitability:
            </p>

            <div className="grid grid-cols-4 gap-1.5">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setInteractiveRecipient(bg)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    interactiveRecipient === bg
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1 mt-2">
              <span className="text-[11px] text-slate-400">Can safely receive red cells from:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {compatibleGroupsForRecipient.map((cg) => (
                  <span
                    key={cg}
                    className="px-2 py-0.5 rounded bg-red-950 border border-red-700/60 text-red-300 font-extrabold text-xs"
                  >
                    {cg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Ranked AI Matches */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>Ranked AI Donor Candidates</span>
                  <span className="bg-red-950 text-red-300 border border-red-800 text-xs px-2 py-0.5 rounded-full font-mono">
                    {matches.length} Matches
                  </span>
                </h2>
                {selectedRequest && (
                  <p className="text-xs text-slate-400 mt-1">
                    Matching target: <strong className="text-white">{selectedRequest.requiredBloodGroup}</strong> ({selectedRequest.unitsRequired} Units) for {selectedRequest.patientRef}
                  </p>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400">
                Sorted by AI suitability score (0-100)
              </div>
            </div>

            {loading ? (
              <div className="text-center py-14 text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                <span>Evaluating donor compatibility and proximity...</span>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No compatible donors available in current registry.
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m, idx) => {
                  const isTopMatch = idx === 0 && m.matchScore >= 80;

                  return (
                    <div
                      key={m.donorId}
                      className={`p-5 rounded-2xl border transition-all ${
                        isTopMatch
                          ? 'glass-panel-emergency border-red-500/50 shadow-[0_0_30px_rgba(225,29,72,0.2)]'
                          : 'glass-card-interactive border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex flex-col items-center justify-center font-black text-white shadow-lg shrink-0">
                            <span className="text-xl leading-none">{m.bloodGroup}</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-90">RBC</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isTopMatch && (
                                <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-[0_0_10px_#ef4444] animate-pulse">
                                  BEST MATCH
                                </span>
                              )}
                              <h3 className="text-base font-bold text-white">{m.displayName}</h3>
                              {m.isDemo && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                                  DEMO DATA
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-slate-400 block mt-0.5">
                              Donor ID: <code className="text-slate-300 font-bold">{m.donorId}</code>
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-red-400" />
                              <span>{m.distanceDisplay}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Gauge */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white glow-text-red">
                              {m.matchScore}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">/100</span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 mt-1">
                            {m.availability}
                          </span>
                        </div>
                      </div>

                      {/* Verification Criteria Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Compatible ✓</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified ✓</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Available ✓</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Nearby ({m.distanceDisplay})</span>
                        </div>
                      </div>

                      {/* Why this donor explanation */}
                      <div className="mt-3 pt-2 text-xs text-slate-400 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-slate-300 mr-1">Why this donor:</span>
                        {m.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
