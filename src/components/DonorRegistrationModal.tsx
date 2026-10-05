import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { BloodGroup } from '../types';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface DonorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (donor: any) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const TN_DISTRICTS = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Erode',
  'Vellore',
  'Thanjavur',
  'Dindigul',
  'Kanchipuram',
  'Chengalpattu',
  'Tiruvallur',
];

export const DonorRegistrationModal: React.FC<DonorRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('1998-05-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [district, setDistrict] = useState('Chennai');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ta'>('ta');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [neverDonated, setNeverDonated] = useState(false);
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError(
        language === 'ta'
          ? 'விண்ணப்பத்தைச் சமர்ப்பிக்க ஒப்புதலை உறுதிசெய்யவும்.'
          : 'Please confirm consent before submitting.'
      );
      return;
    }

    // Age validation (18-65)
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = currentYear - birthYear;
    if (calculatedAge < 18 || calculatedAge > 65) {
      setError('Donor must be between 18 and 65 years of age.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.registerDonor({
        fullName,
        phone,
        email,
        dob,
        gender,
        bloodGroup,
        district,
        city,
        address,
        emergencyAvailable,
        preferredLanguage,
        lastDonationDate: neverDonated ? undefined : lastDonationDate || undefined,
        consent,
      });

      if (response.donor) {
        onSuccess(response.donor);
        onClose();
      } else {
        setError('Failed to create donor profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during donor registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-950 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-2xl w-full my-8 overflow-hidden border border-red-500/30">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">{t('register')} – {t('donor')}</h2>
            <p className="text-xs text-slate-400">
              Create verified donor profile with BloodLink AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('fullName')} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kannan"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('bloodGroup')} *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('phoneNumber')} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('emailAddress')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="donor@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('dateOfBirth')} (18-65 yrs) *
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('gender')} *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Other">{t('other')}</option>
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('district')} *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {TN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* City / Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('cityArea')} *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Adyar, Anna Nagar"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('locationAddress')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12, Gandhi Road, 2nd Cross"
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Donation History (Last Donation Date) */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {t('lastDonationDate')}
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neverDonated}
                  onChange={(e) => {
                    setNeverDonated(e.target.checked);
                    if (e.target.checked) setLastDonationDate('');
                  }}
                  className="rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                />
                First-time donor (Never donated before)
              </label>
            </div>
            {!neverDonated && (
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              * Note: A 90-day recovery interval is required between whole blood donations.
            </p>
          </div>

          {/* Emergency & Language Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-rose-300">
                  {t('emergencyAvailability')}
                </span>
                <span className="text-[11px] text-slate-400">
                  Will accept priority emergency blood notifications
                </span>
              </div>
              <input
                type="checkbox"
                checked={emergencyAvailable}
                onChange={(e) => setEmergencyAvailable(e.target.checked)}
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('preferredLanguage')}
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Consent */}
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2">
            <input
              type="checkbox"
              id="donorConsent"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="donorConsent" className="text-xs text-amber-200 leading-relaxed cursor-pointer">
              {t('consentText')}
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl glow-ruby-btn transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? t('loading') : t('registerDonorButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
