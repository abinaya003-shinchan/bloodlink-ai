import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { BloodGroup, Donor } from '../types';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { DistrictSelect } from './DistrictSelect';
import {
  validateDonorDob,
  calculateAgeFromDob,
  isValidEmail,
  isValidPhone,
} from '../utils/validation';

interface DonorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (donor: Donor) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

  // Live accurate age calculation
  const calculatedAge = dob ? calculateAgeFromDob(dob) : 0;
  const dobCheck = dob ? validateDonorDob(dob) : { valid: false, age: 0 };

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

    // Accurate DOB and age validation
    const dobResult = validateDonorDob(dob);
    if (!dobResult.valid) {
      setError(language === 'ta' ? dobResult.errorTa || dobResult.error! : dobResult.error!);
      return;
    }

    if (!isValidEmail(email)) {
      setError(
        language === 'ta'
          ? 'செல்லுபடியாகும் மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    if (!isValidPhone(phone)) {
      setError(
        language === 'ta'
          ? 'செல்லுபடியாகும் 10-15 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்.'
          : 'Please enter a valid 10 to 15-digit phone number.'
      );
      return;
    }

    if (!district) {
      setError(
        language === 'ta'
          ? 'தமிழ்நாடு மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.'
          : 'Please select a Tamil Nadu district.'
      );
      return;
    }

    if (!city.trim()) {
      setError(
        language === 'ta' ? 'நகரம் / பகுதியை உள்ளிடவும்.' : 'Please enter your city or area.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.registerDonor({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        dob,
        age: dobResult.age,
        gender,
        bloodGroup,
        district: district.trim(),
        city: city.trim(),
        address: address.trim(),
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
        {/* Modal Header */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 font-black">
              +
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {t('register')} – {t('donor')}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ta'
                  ? 'இரத்த தானம் செய்ய பதிவு செய்து உயிர்களைக் காப்பாற்றுங்கள்'
                  : 'Join BloodLink AI verified donor network to save lives'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Personal Details */}
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
                placeholder="e.g. Karthik Raja"
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
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg} {bg === 'O-' ? '(Universal RBC Donor)' : ''}
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

            {/* DOB & Live Age Calculation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {t('dateOfBirth')} (18-65 yrs) *
                </label>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    dobCheck.valid
                      ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/30'
                      : 'text-amber-400 bg-amber-950/80 border border-amber-500/30'
                  }`}
                >
                  {calculatedAge > 0 ? `Age: ${calculatedAge} yrs` : 'Invalid'}
                </span>
              </div>
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

            {/* Reusable Searchable Tamil Nadu District Selector */}
            <div>
              <DistrictSelect
                value={district}
                onChange={setDistrict}
                label={t('district')}
                required
              />
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
                placeholder="e.g. Adyar, Anna Nagar, Courtallam"
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

          {/* Preferred Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('preferredLanguage')}
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as 'en' | 'ta')}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Last Donation Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('lastDonationDate')}
              </label>
              <input
                type="date"
                disabled={neverDonated}
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-40"
              />
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neverDonated}
                  onChange={(e) => {
                    setNeverDonated(e.target.checked);
                    if (e.target.checked) setLastDonationDate('');
                  }}
                  className="rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-400">
                  {language === 'ta' ? 'இது எனது முதல் இரத்த தானம்' : 'First-time donor (Never donated before)'}
                </span>
              </label>
            </div>
          </div>

          {/* Emergency Availability Toggle */}
          <div className="p-3.5 bg-red-950/30 border border-red-500/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                {t('emergencyAvailability')}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {language === 'ta'
                  ? 'இரவு நேர அவசர சிகிச்சைகளுக்கான அழைப்புகளுக்கு தயார் நிலை'
                  : 'Be on-call for trauma cases and urgent ICU requirements'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={emergencyAvailable}
              onChange={(e) => setEmergencyAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Medical & Legal Consent Checkbox */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700 mt-0.5 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                {t('consentText')}
              </span>
            </label>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pl-6">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === 'ta'
                  ? 'உங்கள் தொடர்பு விவரங்கள் தானம் செய்ய ஒப்புக்கொண்ட பின் மட்டுமே மருத்துவமனைக்கு பகிரப்படும்.'
                  : 'Contact privacy: Phone/email are revealed to hospitals only when you accept a request.'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 glow-ruby-btn cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('registerDonorButton')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
