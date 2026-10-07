import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BloodGroup, Donor, DonorMatchResult, VerificationStatus, DonorStatus } from '../types';
import { isCompatible, getCompatibilityDetails } from '../services/compatibility';
import { formatDistance } from '../services/distance';
import { DistrictSelect } from './DistrictSelect';
import {
  Search,
  MapPin,
  ShieldCheck,
  Clock,
  HeartPulse,
  Filter,
  Droplets,
  AlertTriangle,
  Sparkles,
  Phone,
  Check,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

interface FindDonorViewProps {
  initialSearchQuery?: string;
  initialBloodGroup?: BloodGroup;
  onRequestBloodClick?: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const FindDonorView: React.FC<FindDonorViewProps> = ({
  initialSearchQuery = '',
  initialBloodGroup,
  onRequestBloodClick,
}) => {
  const { language, t } = useLanguage();
  const { hospital, role } = useAuth();

  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialSearchQuery);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>(initialBloodGroup || 'ALL');
  const [recipientGroup, setRecipientGroup] = useState<BloodGroup | 'ANY'>('ANY');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  useEffect(() => {
    const fetchDonors = async () => {
      setLoading(true);
      try {
        const list = await api.getDonors();
        setDonors(list);
      } catch (err) {
        console.error('Failed to fetch donors in FindDonorView:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonors();
  }, []);

  // Filtered Donors List
  const filteredDonors = donors.filter((d) => {
    // Exclude suspended donors
    if (d.status === 'Suspended' || d.verificationStatus === 'SUSPENDED') return false;

    // Search query check
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchName = d.fullName.toLowerCase().includes(q);
      const matchId = d.id.toLowerCase().includes(q);
      const matchCity = d.city.toLowerCase().includes(q);
      const matchDistrict = d.district.toLowerCase().includes(q);
      const matchGroup = d.bloodGroup.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchCity && !matchDistrict && !matchGroup) return false;
    }

    // Direct group filter
    if (selectedGroup !== 'ALL' && d.bloodGroup !== selectedGroup) return false;

    // Recipient compatibility filter
    if (recipientGroup !== 'ANY') {
      const compatible = isCompatible(d.bloodGroup, recipientGroup);
      if (!compatible) return false;
    }

    // District filter
    if (selectedDistrict !== 'All Districts' && d.district !== selectedDistrict) return false;

    // Verified only filter
    if (filterVerifiedOnly && d.verificationStatus !== 'VERIFIED') return false;

    // Available only filter
    if (filterAvailableOnly && d.status !== 'Available') return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>{language === 'ta' ? 'கொடையாளர்கள் வரைபடம் & பட்டியல்' : 'LOCATION & DONOR NETWORK'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {language === 'ta' ? 'அருகிலுள்ள இரத்தக் கொடையாளர்கள்' : 'Find Nearby Blood Donors'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {language === 'ta'
                ? 'சரிபார்க்கப்பட்ட இரத்த வகை மற்றும் இருப்பிடம் அடிப்படையில் பொருத்தமான கொடையாளர்களைக் கண்டறியவும்.'
                : 'Locate compatible, verified, and available donors with approximate distance and explainable suitability.'}
            </p>
          </div>

          {onRequestBloodClick && (
            <button
              onClick={onRequestBloodClick}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 glow-ruby-btn shrink-0 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{language === 'ta' ? 'அவசர கோரிக்கை வெளியிடு' : 'CREATE BLOOD REQUEST'}</span>
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search donor ID, city, or area..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Blood Group Filter */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
            >
              <option value="ALL">Donor Blood Group: ALL</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Donor Group: {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Compatibility Filter */}
          <div>
            <select
              value={recipientGroup}
              onChange={(e) => setRecipientGroup(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-semibold text-rose-300"
            >
              <option value="ANY">Recipient Patient: ANY</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Compatible for Patient: {bg}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <DistrictSelect
              allowAllOption
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              placeholder="Filter by Tamil Nadu district..."
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={filterVerifiedOnly}
                onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-semibold">{t('filterVerifiedOnly')}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={filterAvailableOnly}
                onChange={(e) => setFilterAvailableOnly(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-semibold">{t('filterAvailableOnly')}</span>
            </label>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Showing <strong className="text-white">{filteredDonors.length}</strong> matching donors
          </div>
        </div>
      </div>

      {/* Donor Result Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          <span>Scanning verified donor directory...</span>
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="p-8 rounded-2xl glass-panel text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">No matching donors found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search filters, choosing another compatible blood group, or expanding to &quot;All Districts&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((donor) => {
            const isVerified = donor.verificationStatus === 'VERIFIED';
            const isAvailable = donor.status === 'Available';
            const isRecentlyDonated = donor.status === 'Recently Donated';

            // Distance calculation if hospital context exists
            const distInfo = hospital
              ? formatDistance(donor.location, hospital.location)
              : { distanceKm: null, display: `📍 ${donor.city}, ${donor.district}` };

            return (
              <div
                key={donor.id}
                className="glass-card-interactive p-5 rounded-2xl border border-slate-800 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Row: Blood Group & Status Indicator */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex flex-col items-center justify-center font-black text-white shadow-md shrink-0">
                        <span className="text-lg leading-tight">{donor.bloodGroup}</span>
                        <span className="text-[8px] uppercase tracking-wider opacity-90">RBC</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                            {donor.fullName}
                          </h3>
                          {donor.isDemo && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/90 text-slate-950">
                              DEMO
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          ID: {donor.id} • {donor.age}y ({donor.gender})
                        </span>
                      </div>
                    </div>

                    {/* Glowing Availability Indicator */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isAvailable
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : isRecentlyDonated
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        {donor.status}
                      </span>
                    </div>
                  </div>

                  {/* Verification Badge */}
                  <div className="flex items-center justify-between text-xs py-2 border-y border-slate-800/80 my-2">
                    <div className="flex items-center gap-1 text-slate-300">
                      {isVerified ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          VERIFIED DONOR
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          PENDING VERIFICATION
                        </span>
                      )}
                    </div>
                    {donor.emergencyAvailable && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded">
                        24/7 ON-CALL
                      </span>
                    )}
                  </div>

                  {/* Location & Details (Rule: Never expose exact home address) */}
                  <div className="text-xs text-slate-400 space-y-1 mt-2">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{distInfo.display}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Last Updated: {new Date(donor.updatedAt || donor.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Note */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">ABO/Rh Safe Match</span>
                  {role === 'HOSPITAL' ? (
                    <span className="text-red-400 font-semibold">Available for Request Dispatch</span>
                  ) : (
                    <span className="text-slate-500">Contact through Hospital</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
