import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, MapPin, Droplet, ArrowRight, Sparkles } from 'lucide-react';
import { BloodGroup } from '../types';

interface HeroSearchBarProps {
  onSearch: (query: string, bloodGroup?: BloodGroup) => void;
}

const POPULAR_GROUPS: BloodGroup[] = ['O-', 'O+', 'A+', 'B+', 'AB+'];

export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ onSearch }) => {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim(), selectedGroup);
  };

  const handleGroupChipClick = (bg: BloodGroup) => {
    const next = selectedGroup === bg ? undefined : bg;
    setSelectedGroup(next);
    onSearch(query.trim(), next);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 -mt-4 mb-14 relative z-20">
      <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-red-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 focus-within:border-red-400 focus-within:shadow-[0_0_30px_rgba(225,29,72,0.3)]">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          {/* Main Input Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400/80 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'இரத்த வகை (O-, A+), மாவட்டம், மருத்துவமனை அல்லது கொடையாளர் ID தேடவும்...'
                  : 'Search blood group (e.g. O-, A+), district, hospital, or donor ID...'
              }
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 text-slate-100 text-sm rounded-xl border border-slate-700/60 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-500 font-medium"
            />
          </div>

          {/* Search Trigger Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 glow-ruby-btn transition-all shrink-0 cursor-pointer"
          >
            <span>{language === 'ta' ? 'தேடுக' : 'SEARCH'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Blood Group Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 px-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Droplet className="w-3.5 h-3.5 text-red-500" />
            {language === 'ta' ? 'விரைவுத் தேர்வு:' : 'Quick RBC Groups:'}
          </span>
          {POPULAR_GROUPS.map((bg) => {
            const isSelected = selectedGroup === bg;
            return (
              <button
                key={bg}
                type="button"
                onClick={() => handleGroupChipClick(bg)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-[0_0_12px_#ef4444] border border-red-400'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/70'
                }`}
              >
                {bg} {bg === 'O-' && <span className="text-[10px] text-amber-300 ml-0.5">(Univ)</span>}
              </button>
            );
          })}
          <span className="text-[10px] text-slate-500 ml-auto hidden sm:inline">
            ⚡ Deterministic Matching Algorithm
          </span>
        </div>
      </div>
    </div>
  );
};
