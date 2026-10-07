import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmergencyRequestSummary, DonorResponseType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  HeartPulse,
  Building2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock4,
  ArrowRight,
  Flame,
  Droplet,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface EmergencyResponseViewProps {
  requestId: string;
  donorId: string;
  onGoHome?: () => void;
}

export const EmergencyResponseView: React.FC<EmergencyResponseViewProps> = ({
  requestId,
  donorId,
  onGoHome,
}) => {
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState<EmergencyRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<DonorResponseType | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<DonorResponseType | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getEmergencyRequestSummary(requestId, donorId);
        if (isMounted) {
          setSummary(data);
          if (data.hasResponded && data.existingResponse) {
            setSubmittedResponse(data.existingResponse as DonorResponseType);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to load emergency request details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (requestId && donorId) {
      loadSummary();
    }
    return () => {
      isMounted = false;
    };
  }, [requestId, donorId]);

  const handleSubmit = async (option: DonorResponseType) => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.submitEmergencyResponse({
        bloodRequestId: requestId,
        donorId: donorId,
        responseOption: option,
        notes: notes.trim() || undefined,
      });

      setSubmissionSuccess(true);
      setSubmittedResponse(option);
      if (summary) {
        setSummary({
          ...summary,
          hasResponded: true,
          existingResponse: option,
          respondedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse mb-4">
          <HeartPulse className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          {language === 'ta' ? 'அவசர இரத்த எச்சரிக்கை விவரங்களை ஏற்றுகிறது...' : 'Loading Emergency Blood Alert...'}
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Verifying secure response token & hospital dispatch coordinates...
        </p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl glass-panel border border-red-500/40 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">
            {language === 'ta' ? 'இணைப்பு கிடைக்கவில்லை அல்லது காலாவதியானது' : 'Alert Link Invalid or Expired'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            {error}
          </p>
        </div>
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onGoHome}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl glow-ruby-btn transition-all inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'ta' ? 'முதன்மை பக்கத்திற்குச் செல்க' : 'Return to BloodLink AI Platform'}
          </button>
        </div>
      </div>
    );
  }

  const isAlreadySubmitted = summary?.hasResponded || submissionSuccess;
  const activeResponse = submittedResponse || summary?.existingResponse;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={onGoHome}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          {language === 'ta' ? 'முதன்மை பக்கம்' : 'BloodLink AI Platform'}
        </button>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-red-950/70 border border-red-600/40 text-red-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          {language === 'ta' ? 'நேரலை அவசர அழைப்பு' : 'LIVE EMERGENCY CALL'}
        </span>
      </div>

      {/* Main Medical Emergency Card */}
      <div className="glass-panel rounded-3xl border border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.25)] overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-950 via-red-900/60 to-slate-950 px-6 py-5 border-b border-red-800/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)]">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-300">
                CRITICAL TRAUMA DISPATCH
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {language === 'ta' ? 'அவசர இரத்த தான கோரிக்கை' : 'Emergency Blood Donation Alert'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-red-950 border border-red-500/50 text-red-400 font-mono text-xs font-bold">
              {summary?.requiredBloodGroup} • {summary?.unitsRequired} {language === 'ta' ? 'யூனிட்கள்' : 'Units'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Hospital & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase">
                <Building2 className="w-4 h-4 text-red-400" />
                {language === 'ta' ? 'கோரிய மருத்துவமனை' : 'Requesting Hospital'}
              </div>
              <h3 className="text-base font-bold text-white">{summary?.hospitalName}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {summary?.hospitalDistrict || summary?.hospitalCity || 'Tamil Nadu'}
                </span>
              </div>
              {summary?.hospitalPhone && (
                <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hotline: <strong className="text-slate-200">{summary.hospitalPhone}</strong></span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase">
                <Droplet className="w-4 h-4 text-rose-400" />
                {language === 'ta' ? 'பொருத்தமான கொடையாளர்' : 'Matched Eligible Donor'}
              </div>
              <h3 className="text-base font-bold text-white">{summary?.donorName}</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  {language === 'ta' ? 'இரத்த வகை' : 'Your Blood Group'}:
                </span>
                <span className="font-mono font-bold text-rose-400 text-sm bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                  {summary?.donorBloodGroup}
                </span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {language === 'ta' ? 'தகுதியானது' : 'Verified Compatible'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 font-mono">
                Urgency: <span className="text-red-400 font-bold uppercase">{summary?.urgency}</span>
              </div>
            </div>
          </div>

          {/* Clinical Notes if any */}
          {summary?.additionalNotes && (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 text-xs space-y-1">
              <span className="text-[11px] font-mono text-red-300 uppercase tracking-wider font-bold">
                Clinical Context & Instructions:
              </span>
              <p className="text-slate-300 leading-relaxed">{summary.additionalNotes}</p>
            </div>
          )}

          {/* Response Form or Already Responded State */}
          {isAlreadySubmitted ? (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/40 text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
                  {language === 'ta' ? 'பதில் பதிவு செய்யப்பட்டது' : 'RESPONSE CONFIRMED ON RECORD'}
                </span>
                <h3 className="text-xl font-black text-white">
                  {language === 'ta' ? 'உங்கள் பதிலுக்கு நன்றி!' : 'Thank you for your rapid response!'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {language === 'ta'
                    ? `நீங்கள் அளித்த பதில்: "${activeResponse}". மருத்துவமனை அவசர பிரிவுக்கு தகவல் உடனடியாக புதுப்பிக்கப்பட்டுள்ளது.`
                    : `Your response has been saved as "${activeResponse}". The hospital trauma team has been notified.`}
                </p>
              </div>

              {activeResponse === 'I CAN DONATE' && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 max-w-lg mx-auto space-y-1 text-left">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <ShieldCheck className="w-4 h-4" />
                    {language === 'ta' ? 'தொடர்பு விவரங்கள் பகிரப்பட்டது' : 'Donor Contact Shared With Hospital'}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {language === 'ta'
                      ? 'நீங்கள் "வரத் தயார்" என ஒப்புதல் அளித்ததால், மருத்துவமனை குழுவினர் உங்களுடைய பதிவுசெய்த கைபேசி எண்ணை உடனே தொடர்புகொள்வர்.'
                      : 'Because you confirmed YES, hospital staff have received authorized access to your registered mobile number for rapid dispatch.'}
                  </p>
                </div>
              )}

              {activeResponse === 'NOT AVAILABLE' && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 max-w-lg mx-auto">
                  {language === 'ta'
                    ? 'நீங்கள் கிடைக்கவில்லை என குறித்ததால், இந்த கோரிக்கைக்கான கூடுதல் எச்சரிக்கைகள் உங்களுக்கு அனுப்பப்படாது.'
                    : 'You have been marked unavailable for this emergency request. No duplicate notifications will be sent to your number.'}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onGoHome}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  {language === 'ta' ? 'தளத்திற்குத் திரும்புக' : 'Return to Home'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white">
                  {language === 'ta' ? 'இந்த அவசரத்திற்கு நீங்கள் இரத்த தானம் செய்ய தயாரா?' : 'Can you donate blood for this emergency?'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ta'
                    ? 'தயவுசெய்து உங்கள் தற்போதைய நிலையை உடனடியாக உறுதிசெய்க.'
                    : 'Please select your response below to immediately notify the hospital.'}
                </p>
              </div>

              {/* Response Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* YES — I CAN DONATE */}
                <button
                  onClick={() => handleSubmit('I CAN DONATE')}
                  disabled={submitting}
                  className="p-4 rounded-2xl bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold flex flex-col items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'ta' ? 'ஆம் — நான் தயார்' : 'YES — I AM AVAILABLE'}
                  </span>
                  <span className="text-[10px] text-emerald-100 font-normal opacity-90">
                    {language === 'ta' ? '(தானம் செய்ய முடியும்)' : '(I Can Donate)'}
                  </span>
                </button>

                {/* NO — NOT AVAILABLE */}
                <button
                  onClick={() => handleSubmit('NOT AVAILABLE')}
                  disabled={submitting}
                  className="p-4 rounded-2xl bg-slate-900 hover:bg-red-950/60 text-slate-200 hover:text-red-300 border border-slate-800 hover:border-red-800/60 font-bold flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-red-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'ta' ? 'இல்லை — முடியாது' : 'NO — NOT AVAILABLE'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {language === 'ta' ? '(இப்போது இயலாது)' : '(No Duplicates Sent)'}
                  </span>
                </button>

                {/* MAYBE LATER */}
                <button
                  onClick={() => handleSubmit('MAYBE LATER')}
                  disabled={submitting}
                  className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-800/40 font-bold flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800/60 group-hover:bg-amber-950/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock4 className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'ta' ? 'சிறிது நேரம் கழித்து' : 'MAYBE LATER'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {language === 'ta' ? '(முடிவை பின்னர் தெரிவிக்க)' : '(Confirming Schedule)'}
                  </span>
                </button>
              </div>

              {/* Optional Note Field */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-slate-400 font-medium block">
                  {language === 'ta'
                    ? 'கூடுதல் குறிப்பு (விருப்பத்தேர்வு):'
                    : 'Optional Message / Arrival Time Estimate for Hospital:'}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === 'ta'
                      ? 'எ.கா. 20 நிமிடங்களில் மருத்துவமனை வர முடியும்'
                      : 'e.g. Can reach emergency ICU in 20 minutes with donor card'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {language === 'ta'
                    ? 'தனியுரிமை பாதுகாப்பு: நீங்கள் "ஆம் — நான் தயார்" என தேர்வு செய்தால் மட்டுமே உங்கள் கைபேசி எண் மருத்துவமனைக்கு பகிரப்படும். "இல்லை" என தேர்வு செய்தால் உங்கள் விவரங்கள் பாதுகாப்பாக இருக்கும்.'
                    : 'Privacy Safeguard: Your registered mobile number is ONLY revealed to verified hospital staff if you select YES. If you select NO, your contact remains strictly hidden and duplicate SMS alerts are halted.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
