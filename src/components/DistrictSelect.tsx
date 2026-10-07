import React, { useState, useRef, useEffect } from 'react';
import { TAMIL_NADU_DISTRICTS, TamilNaduDistrict } from '../data/districts';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface DistrictSelectProps {
  value: string;
  onChange: (district: string) => void;
  label?: string;
  required?: boolean;
  allowAllOption?: boolean;
  allOptionLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DistrictSelect: React.FC<DistrictSelectProps> = ({
  value,
  onChange,
  label,
  required = false,
  allowAllOption = false,
  allOptionLabel = 'All Districts (தமிழ்நாடு முழுவதும்)',
  placeholder = 'Type to search or select district...',
  disabled = false,
  className = '',
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDistricts = TAMIL_NADU_DISTRICTS.filter((d) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      d.nameEn.toLowerCase().includes(term) ||
      d.nameTa.includes(term) ||
      d.headquarters.toLowerCase().includes(term) ||
      d.region.toLowerCase().includes(term)
    );
  });

  const selectedDistrict = TAMIL_NADU_DISTRICTS.find(
    (d) => d.nameEn.toLowerCase() === value?.toLowerCase()
  );

  const displayValue = value === 'All Districts' || value === 'ALL'
    ? (language === 'ta' ? 'அனைத்து மாவட்டங்கள்' : 'All Districts')
    : selectedDistrict
    ? language === 'ta'
      ? `${selectedDistrict.nameTa} (${selectedDistrict.nameEn})`
      : `${selectedDistrict.nameEn} (${selectedDistrict.nameTa})`
    : value || '';

  const handleSelect = (districtName: string) => {
    onChange(districtName);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            {label} {required && <span className="text-red-400">*</span>}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            {language === 'ta' ? '38 மாவட்டங்கள்' : '38 TN Districts'}
          </span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-900 border rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? 'border-red-500 ring-2 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
            : 'border-slate-700 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={displayValue ? 'text-white font-medium' : 'text-slate-400'}>
            {displayValue || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          {value && value !== 'All Districts' && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(allowAllOption ? 'All Districts' : '');
              }}
              className="hover:text-red-400 p-0.5"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-400' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'மாவட்டம் தட்டச்சு செய்து தேடவும்...'
                    : 'Search district (e.g. Tenkasi, Madurai)...'
                }
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* District Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 text-xs">
            {allowAllOption && (
              <button
                type="button"
                onClick={() => handleSelect('All Districts')}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-red-950/40 transition-colors ${
                  value === 'All Districts' || value === 'ALL'
                    ? 'bg-red-950/60 text-red-200 font-bold'
                    : 'text-slate-300'
                }`}
              >
                <span>{allOptionLabel}</span>
                {(value === 'All Districts' || value === 'ALL') && (
                  <Check className="w-3.5 h-3.5 text-red-400" />
                )}
              </button>
            )}

            {filteredDistricts.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                {language === 'ta'
                  ? 'பொருத்தமான மாவட்டம் எதுவும் காணப்படவில்லை.'
                  : `No districts found matching "${searchTerm}".`}
              </div>
            ) : (
              filteredDistricts.map((d: TamilNaduDistrict) => {
                const isSelected = value?.toLowerCase() === d.nameEn.toLowerCase();
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelect(d.nameEn)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-red-950/60 text-white font-bold border-l-2 border-red-500'
                        : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-white">{d.nameEn}</span>
                      <span className="text-slate-400 ml-2 text-[11px]">({d.nameTa})</span>
                      <span className="text-[10px] text-slate-500 block">
                        HQ: {d.headquarters} • {d.region} TN
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
