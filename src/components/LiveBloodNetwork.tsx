import React, { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Users, Activity, ShieldCheck, HeartPulse, Building2, Flame, Clock } from 'lucide-react';

export const LiveBloodNetwork: React.FC = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.warn('Failed to fetch live network stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const availableDonors = stats?.availableDonors ?? 4;
  const emergencyRequests = stats?.emergencyRequests ?? 1;
  const verifiedDonors = stats?.verifiedDonors ?? 4;
  const totalResponses = stats?.totalResponses ?? 1;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{language === 'ta' ? 'நேரலை இரத்த வலையமைப்பு' : 'Live Blood Network'}</span>
            </h2>
            <span className="bg-red-950/80 text-red-300 border border-red-800/80 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              REAL-TIME
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ta'
              ? 'சரிபார்க்கப்பட்ட கொடையாளர்கள் மற்றும் மருத்துவமனைகளின் நேரடித் தரவு'
              : 'Directly aggregated from verified donors and connected trauma centers'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>AUTOSYNC 10s</span>
          <span className="text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded text-[10px]">
            DEMO SEEDS ACTIVE
          </span>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Donors */}
        <div className="glass-card-interactive p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'ta' ? 'தயாராக உள்ள கொடையாளர்கள்' : 'Available Donors'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {loading ? '...' : availableDonors}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              On-Call
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Eligible whole blood & RBC volunteers ready for dispatch
          </p>
        </div>

        {/* Card 2: Active Emergencies */}
        <div className="glass-card-interactive p-5 rounded-2xl border border-red-500/30 relative overflow-hidden group shadow-[0_0_20px_rgba(225,29,72,0.1)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/15 rounded-full blur-2xl group-hover:bg-red-600/25 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              {language === 'ta' ? 'அவசர நிலைகள்' : 'Active Emergencies'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-red-400 tracking-tight glow-text-red">
              {loading ? '...' : emergencyRequests}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/60">
              Critical
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Broadcast to compatible verified donors within 15 km
          </p>
        </div>

        {/* Card 3: Verified Donors */}
        <div className="glass-card-interactive p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'ta' ? 'சரிபார்க்கப்பட்டவர்கள்' : 'Verified Donors'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {loading ? '...' : verifiedDonors}
            </span>
            <span className="text-xs font-semibold text-blue-400">
              Admin Audited
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Contact verified & profile completeness &gt; 90%
          </p>
        </div>

        {/* Card 4: Successful Responses */}
        <div className="glass-card-interactive p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'ta' ? 'கொடையாளர் சம்மதங்கள்' : 'Donor Responses'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {loading ? '...' : totalResponses}
            </span>
            <span className="text-xs font-semibold text-rose-400">
              Confirmed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Donors who responded &quot;I CAN DONATE&quot; to urgent calls
          </p>
        </div>
      </div>
    </section>
  );
};
