import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowRight, ShieldCheck, Activity, Sparkles, Droplets, Heart } from 'lucide-react';

interface SignatureHeroProps {
  onFindDonorClick: () => void;
  onBecomeDonorClick: () => void;
  onEmergencyClick: () => void;
}

export const SignatureHero: React.FC<SignatureHeroProps> = ({
  onFindDonorClick,
  onBecomeDonorClick,
  onEmergencyClick,
}) => {
  const { t, language } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 text-white">
      {/* Dynamic atmospheric radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-600/12 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-rose-600/8 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Very subtle background medical ECG grid trace */}
      <div className="absolute inset-0 bg-medical-grid opacity-40 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Emergency Triage Pill */}
        <div className="flex justify-center mb-6">
          <button
            onClick={onEmergencyClick}
            className="group inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold backdrop-blur-md hover:bg-red-900/90 hover:border-red-400 transition-all shadow-[0_0_20px_rgba(225,29,72,0.35)] cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="tracking-wider uppercase font-mono text-[11px]">
              {language === 'ta' ? 'அவசர இரத்த உதவி நெட்வொர்க் (24/7)' : '24/7 AI-POWERED EMERGENCY BLOOD NETWORK'}
            </span>
            <span className="text-red-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Main Hero Header Text */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            <span className="block text-slate-100">
              {language === 'ta' ? 'ஒவ்வொரு நொடியும் முக்கியம்.' : 'Every Second Matters.'}
            </span>
            <span className="block bg-gradient-to-r from-red-500 via-rose-400 to-red-600 bg-clip-text text-transparent glow-text-red mt-1">
              {language === 'ta' ? 'ஒவ்வொரு கொடையாளரும் விலைமதிப்பற்றவர்.' : 'Every Donor Counts.'}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'ta'
              ? 'பிளட்லிங்க் AI அவசர இரத்தத் தேவைகளை அருகிலுள்ள, சரிபார்க்கப்பட்ட, மருத்துவப் பொருத்தமுடைய கொடையாளர்களுடன் உடனடியாக இணைக்கிறது.'
              : 'BloodLink AI connects urgent blood needs with compatible, nearby, and verified donors through deterministic ABO/Rh intelligence.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SIGNATURE CENTERPIECE: STYLIZED MEDICAL HEART + CIRCULATION ORBITS + ECG */}
        {/* ========================================================================= */}
        <div className="relative flex flex-col items-center justify-center my-4 py-2">
          {/* Main 3D Orbiting Container */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
            
            {/* Ambient Pulsing Aura behind heart */}
            <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-red-600/30 via-rose-500/20 to-transparent blur-3xl animate-heart-pulse pointer-events-none" />

            {/* ------------------------------------------------------------- */}
            {/* ORBITAL RING 1: Outer Systemic Circulation (Clockwise, 12s)   */}
            {/* ------------------------------------------------------------- */}
            <div className="absolute inset-0 rounded-full border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-orbit pointer-events-none">
              {/* Traveling Blood Droplet 1 (Arterial Ruby) */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-br from-rose-300 via-red-500 to-red-700 rounded-full shadow-[0_0_15px_#ef4444] animate-blood-drip" />
                <div className="absolute w-8 h-1 bg-gradient-to-l from-red-500 to-transparent -left-7 rounded-full opacity-60" />
              </div>
              {/* Traveling Blood Droplet 2 (Opposite Node) */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-gradient-to-br from-red-400 to-rose-700 rounded-full shadow-[0_0_12px_#f43f5e]" />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* ORBITAL RING 2: Middle Pulmonary Loop (Counter-Clockwise, 16s) */}
            {/* ------------------------------------------------------------- */}
            <div className="absolute inset-8 sm:inset-10 rounded-full border border-rose-500/25 border-dashed animate-orbit-reverse pointer-events-none">
              {/* Traveling Droplet 3 (Lateral Left) */}
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div className="w-3 h-3 bg-gradient-to-tr from-rose-400 to-red-500 rounded-full shadow-[0_0_10px_#ef4444]" />
              </div>
              {/* Traveling Droplet 4 (Lateral Right) */}
              <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div className="w-3 h-3 bg-gradient-to-bl from-red-400 to-rose-600 rounded-full shadow-[0_0_10px_#f43f5e]" />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* ORBITAL RING 3: Inner Microcapillary Ring (Tilted Oval, 8s)   */}
            {/* ------------------------------------------------------------- */}
            <div className="absolute inset-16 sm:inset-18 rounded-full border border-red-400/20 animate-orbit-slow pointer-events-none">
              {/* Traveling Fine Droplet 5 */}
              <div className="absolute top-1 right-8 w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-rose-300 rounded-full shadow-[0_0_8px_#fda4af]" />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CENTERPIECE: STYLIZED DETAILED MEDICAL HEART SVG               */}
            {/* ------------------------------------------------------------- */}
            <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-slate-950 via-red-950/60 to-black border border-red-500/40 shadow-[0_0_50px_rgba(225,29,72,0.5)] backdrop-blur-2xl flex flex-col items-center justify-center animate-heart-pulse cursor-pointer group">
              
              {/* Detailed Stylized Medical Heart SVG */}
              <svg
                viewBox="0 0 200 200"
                className="w-28 h-28 sm:w-32 sm:h-32 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] transition-transform group-hover:scale-105 duration-300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Ventricular Muscle Gradient */}
                  <linearGradient id="heartGradient" x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor="#ff4d6d" />
                    <stop offset="45%" stopColor="#c9184a" />
                    <stop offset="85%" stopColor="#800f2f" />
                    <stop offset="100%" stopColor="#590d22" />
                  </linearGradient>

                  {/* Aortic Arch & Vascular Gradient */}
                  <linearGradient id="aortaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff758f" />
                    <stop offset="50%" stopColor="#e63946" />
                    <stop offset="100%" stopColor="#9d0208" />
                  </linearGradient>

                  {/* Pulmonary Trunk Blue-Violet Vascular Hint */}
                  <linearGradient id="pulmonaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a2d2ff" />
                    <stop offset="60%" stopColor="#3a86ff" />
                    <stop offset="100%" stopColor="#03045e" />
                  </linearGradient>

                  {/* Internal Glow Radial */}
                  <radialGradient id="plasmaCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <stop offset="40%" stopColor="#ff4d6d" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#c9184a" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Superior Vena Cava & Aortic Arch Vessels (Stylized Top) */}
                <path
                  d="M82 48 C82 32, 98 25, 112 25 C126 25, 134 35, 130 52"
                  stroke="url(#aortaGradient)"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                {/* Branching Arterial Trunks */}
                <line x1="96" y1="28" x2="96" y2="18" stroke="#ff758f" strokeWidth="6" strokeLinecap="round" />
                <line x1="108" y1="26" x2="112" y2="17" stroke="#ff758f" strokeWidth="6" strokeLinecap="round" />
                <line x1="120" y1="28" x2="128" y2="19" stroke="#ff758f" strokeWidth="6" strokeLinecap="round" />

                {/* Pulmonary Artery (Left Branch) */}
                <path
                  d="M68 55 C68 42, 78 38, 88 42"
                  stroke="url(#pulmonaryGradient)"
                  strokeWidth="9"
                  strokeLinecap="round"
                />

                {/* Primary Anatomical Heart Ventricles & Chambers */}
                <path
                  d="M100 170 C55 135, 30 108, 30 74 C30 50, 48 38, 70 38 C86 38, 96 46, 100 54 C104 46, 114 38, 130 38 C152 38, 170 50, 170 74 C170 108, 145 135, 100 170 Z"
                  fill="url(#heartGradient)"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="2.5"
                />

                {/* Anterior Interventricular Sulcus (Subtle contour line) */}
                <path
                  d="M98 62 Q92 110 100 162"
                  stroke="rgba(40, 2, 10, 0.6)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Right Ventricular Vascular Striations */}
                <path
                  d="M58 80 Q75 92 88 102"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M52 98 Q72 110 85 125"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* Left Ventricular Muscle Highlight */}
                <path
                  d="M145 78 C155 92, 148 116, 120 142"
                  stroke="rgba(255, 180, 200, 0.35)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Internal Luminous Plasma Core (breathing glow) */}
                <circle cx="100" cy="95" r="28" fill="url(#plasmaCore)" />

                {/* Center ECG Sparkle Icon */}
                <path
                  d="M86 98 L94 98 L98 84 L104 112 L108 92 L112 102 L116 98"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Vital Brand HUD Tag */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-black tracking-widest uppercase text-red-200 glow-text-red">
                  HEART • BLOOD • LIFE
                </span>
              </div>
            </div>

            {/* Orbiting Live Network Metric Badge (Top Left) */}
            <div className="absolute -top-3 sm:top-2 -left-4 sm:-left-8 glass-panel px-3 py-1.5 rounded-xl border border-red-500/30 text-[11px] font-semibold text-slate-200 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-emerald-300">LIVE</span>
              <span className="text-slate-400">|</span>
              <span>{language === 'ta' ? 'உடனடி பொருத்தம்' : 'Instant Matching'}</span>
            </div>

            {/* Orbiting Trust Metric Badge (Bottom Right) */}
            <div className="absolute -bottom-3 sm:bottom-2 -right-4 sm:-right-8 glass-panel px-3 py-1.5 rounded-xl border border-red-500/30 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>{language === 'ta' ? 'சரிபார்க்கப்பட்ட கொடையாளர்கள்' : '100% Verified'}</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTINUOUS ANIMATED ECG / HEARTBEAT WAVEFORM (SYNCHRONIZED WITH BEAT)     */}
          {/* ========================================================================= */}
          <div className="w-full max-w-3xl px-4 mt-8">
            <div className="relative rounded-2xl glass-panel-subtle p-3 sm:p-4 border border-red-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
              
              {/* ECG Stream Header Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1 px-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span className="text-slate-300 font-semibold">SYNCHRONIZED CARDIAC TELEMETRY</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">72 BPM</span>
                  <span className="text-slate-500 hidden sm:inline">QRS: 84ms</span>
                  <span className="text-red-400 font-bold uppercase tracking-wider">NORMAL SINUS</span>
                </div>
              </div>

              {/* The SVG ECG Waveform Line */}
              <div className="relative h-14 sm:h-18 w-full flex items-center">
                <svg
                  viewBox="0 0 800 100"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="ecgWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                      <stop offset="20%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="55%" stopColor="#f43f5e" stopOpacity="0.9" />
                      <stop offset="80%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
                    </linearGradient>

                    <filter id="ecgGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
                  <line x1="0" y1="20" x2="800" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="800" y2="80" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Background Steady Trace */}
                  <path
                    d="M0 50 L80 50 Q90 50 95 44 Q100 38 105 50 L120 50 L128 58 L138 8 L148 88 L156 50 L168 50 Q180 50 188 38 Q196 28 206 50 L300 50 Q310 50 315 44 Q320 38 325 50 L340 50 L348 58 L358 8 L368 88 L376 50 L388 50 Q400 50 408 38 Q416 28 426 50 L520 50 Q530 50 535 44 Q540 38 545 50 L560 50 L568 58 L578 8 L588 88 L596 50 L608 50 Q620 50 628 38 Q636 28 646 50 L800 50"
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.25)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Animated Foreground Streaming ECG Wave */}
                  <path
                    d="M0 50 L80 50 Q90 50 95 44 Q100 38 105 50 L120 50 L128 58 L138 8 L148 88 L156 50 L168 50 Q180 50 188 38 Q196 28 206 50 L300 50 Q310 50 315 44 Q320 38 325 50 L340 50 L348 58 L358 8 L368 88 L376 50 L388 50 Q400 50 408 38 Q416 28 426 50 L520 50 Q530 50 535 44 Q540 38 545 50 L560 50 L568 58 L578 8 L588 88 L596 50 L608 50 Q620 50 628 38 Q636 28 646 50 L800 50"
                    fill="none"
                    stroke="url(#ecgWaveGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#ecgGlowFilter)"
                    strokeDasharray="160 80"
                    className="animate-ecg-stream"
                  />
                </svg>

                {/* Laser Sweep Light Cursor */}
                <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-rose-400/40 to-transparent pointer-events-none animate-ecg-sweep blur-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Functional Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={onFindDonorClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm tracking-wide glow-ruby-btn flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <span>{language === 'ta' ? 'கொடையாளரைக் கண்டறி' : 'Find Nearby Donors'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onBecomeDonorClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md shadow-md"
          >
            <Droplets className="w-4 h-4 text-rose-400" />
            <span>{language === 'ta' ? 'இரத்தக் கொடையாளராகுக' : 'Register as Donor'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
