import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { HeartHandshake, Droplet, Building2, UserCheck, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export const BloodDonationImportance: React.FC = () => {
  const { language } = useLanguage();

  const stages = [
    {
      step: '01',
      title: language === 'ta' ? 'கொடையாளர் (DONOR)' : 'THE DONOR',
      subtitle: language === 'ta' ? 'அர்ப்பணிப்பு' : 'Selfless Giving',
      description:
        language === 'ta'
          ? 'ஆரோக்கியமான தனிநபர் ஒரு சிறிய நேரம் ஒதுக்கி இரத்த தானம் செய்ய முன்வருகிறார்.'
          : 'A healthy individual steps forward to donate. One safe donation of ~350-450ml can support up to 3 separate clinical components (RBCs, plasma, platelets).',
      icon: HeartHandshake,
      color: 'from-red-500 to-rose-600',
    },
    {
      step: '02',
      title: language === 'ta' ? 'இரத்தம் (BLOOD)' : 'THE BLOOD',
      subtitle: language === 'ta' ? 'உயிர் திரவம்' : 'Liquid of Life',
      description:
        language === 'ta'
          ? 'செயற்கையாக உருவாக்க முடியாத அரிய உயிரியல் பொக்கிஷம். ஒவ்வொரு துளியும் விலைமதிப்பற்றது.'
          : 'Packed red blood cells have a shelf life of only 35–42 days. Human blood cannot be synthesized or manufactured in a laboratory—it can only come from another human.',
      icon: Droplet,
      color: 'from-rose-500 to-red-700',
    },
    {
      step: '03',
      title: language === 'ta' ? 'மருத்துவமனை (HOSPITAL)' : 'THE HOSPITAL',
      subtitle: language === 'ta' ? 'மருத்துவ உறுதி' : 'Clinical Screening',
      description:
        language === 'ta'
          ? 'ஆய்வகப் பரிசோதனை, கிராஸ்மேட்சிங் மற்றும் பாதுகாப்பான சேமிப்பு மூலம் தயார் செய்யப்படுகிறது.'
          : 'Certified hospital blood banks perform rigorous serological screening, crossmatching, and rapid typing to ensure recipient safety before transfusion.',
      icon: Building2,
      color: 'from-blue-500 to-cyan-700',
    },
    {
      step: '04',
      title: language === 'ta' ? 'நோயாளி (PATIENT)' : 'THE PATIENT',
      subtitle: language === 'ta' ? 'அவசர சிகிச்சை' : 'Emergency Trauma Care',
      description:
        language === 'ta'
          ? 'விபத்து, அறுவை சிகிச்சை, பிரசவம் அல்லது இரத்த சோகையால் பாதிக்கப்பட்டவருக்கு சரியான நேரத்தில் வழங்கப்படுகிறது.'
          : 'Urgent surgery, acute trauma, postpartum hemorrhage, or chemotherapy patients receive life-sustaining oxygenated red blood cells in their critical hour.',
      icon: UserCheck,
      color: 'from-amber-500 to-red-600',
    },
    {
      step: '05',
      title: language === 'ta' ? 'நம்பிக்கை (HOPE)' : 'THE HOPE',
      subtitle: language === 'ta' ? 'காக்கப்பட்ட உயிர்' : 'A Reunited Family',
      description:
        language === 'ta'
          ? 'ஒரு மனிதனின் வாழ்க்கை காப்பாற்றப்பட்டு, ஒரு குடும்பத்தின் எதிர்காலம் பாதுகாக்கப்படுகிறது.'
          : 'A beating heart continues. A parent returns home. A life is preserved through the quiet kindness of an everyday citizen and instant technology.',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-700',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
        <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-950/60 border border-red-800/60 px-3 py-1 rounded-full">
          {language === 'ta' ? 'வாழ்க்கைப் பயணம்' : 'THE LIFELINE JOURNEY'}
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          {language === 'ta' ? 'ஏன் இரத்த தானம் இன்றியமையாதது?' : 'Why Blood Donation Matters'}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {language === 'ta'
            ? 'கொடையாளரிடமிருந்து நோயாளியை அடையும் இந்த புனிதப் பாதையில் ஒவ்வொரு நொடியும் விலைமதிப்பற்றது.'
            : 'From donor arm to patient bedside, every second and every unit creates a bridge between despair and survival.'}
        </p>
      </div>

      {/* Visual Journey Chain */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.step}
              className="glass-card-interactive p-5 rounded-2xl border border-slate-800 flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-slate-500">{stage.step}</span>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-sm font-black text-white tracking-wide">{stage.title}</h3>
                <span className="text-[11px] font-semibold text-red-400 block mb-2">{stage.subtitle}</span>

                <p className="text-xs text-slate-400 leading-relaxed font-normal">{stage.description}</p>
              </div>

              {idx < stages.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-4 h-4 text-red-500/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Medical Truth Callout */}
      <div className="mt-8 p-4 rounded-xl glass-panel-subtle border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Fact:</strong> 1 in 7 patients entering an acute emergency department requires blood products. Regular donors ensure blood banks never run dry during mass-casualty events.
          </span>
        </div>
        <span className="text-slate-500 shrink-0 font-mono text-[11px]">
          90-Day Safe Rest Interval Observed
        </span>
      </div>

      {/* Clinical Infrastructure Visual Twin Showcase */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel overflow-hidden rounded-2xl border border-red-500/20 group hover:border-red-500/40 transition-all">
          <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-900">
            <img
              src="/src/assets/images/medical_lab_crossmatch_1791213177677.jpg"
              alt="High-Precision Clinical Hematology Laboratory Crossmatch"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded">
                CLINICAL SEROLOGY
              </span>
              <h4 className="text-sm font-bold text-white mt-1">
                Automated ABO/Rh Crossmatching & Serological Testing
              </h4>
            </div>
          </div>
          <div className="p-4 text-xs text-slate-400 leading-relaxed">
            Every collected unit undergoes rigid automated immunohematology assays to rule out transmissible infections and confirm ABO/Rh(D) antigen phenotype compatibility before release.
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-2xl border border-red-500/20 group hover:border-red-500/40 transition-all">
          <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-900">
            <img
              src="/src/assets/images/blood_coldchain_storage_1791213193657.jpg"
              alt="Hospital Blood Bank Cold-Chain Vault"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                COLD-CHAIN PRESERVATION
              </span>
              <h4 className="text-sm font-bold text-white mt-1">
                Controlled +2°C to +6°C RBC Storage Vaults
              </h4>
            </div>
          </div>
          <div className="p-4 text-xs text-slate-400 leading-relaxed">
            Continuous IoT telemetry maintains optimal cellular viability and osmotic stability throughout the 35–42 day viable lifespan of packed red blood cells.
          </div>
        </div>
      </div>
    </section>
  );
};
