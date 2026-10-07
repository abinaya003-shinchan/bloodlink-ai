import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Building2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { DistrictSelect } from './DistrictSelect';
import { isValidEmail, isValidPhone } from '../utils/validation';

interface HospitalRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hospital: any) => void;
}

export const HospitalRegistrationModal: React.FC<HospitalRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();

  const [hospitalName, setHospitalName] = useState('');
  const [authorizedContact, setAuthorizedContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !hospitalName.trim() ||
      !authorizedContact.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !address.trim() ||
      !district.trim() ||
      !city.trim()
    ) {
      setError(
        language === 'ta'
          ? 'அனைத்து கட்டாய மருத்துவமனை விவரங்களையும் நிரப்பவும்.'
          : 'Please provide all mandatory hospital credentials.'
      );
      return;
    }

    if (!isValidEmail(email)) {
      setError(
        language === 'ta'
          ? 'செல்லுபடியாகும் அதிகாரப்பூர்வ மின்னஞ்சலை உள்ளிடவும்.'
          : 'Please provide a valid official email address.'
      );
      return;
    }

    if (!isValidPhone(phone)) {
      setError(
        language === 'ta'
          ? 'செல்லுபடியாகும் தொடர்பு தொலைபேசி எண்ணை உள்ளிடவும்.'
          : 'Please provide a valid official phone number.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.registerHospital({
        hospitalName: hospitalName.trim(),
        authorizedContact: authorizedContact.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        district: district.trim(),
        city: city.trim(),
        location: {
          address: `${address.trim()}, ${city.trim()}, ${district.trim()}`,
          district: district.trim(),
          city: city.trim(),
        },
      });

      onSuccess(response.hospital);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Hospital registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-950 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-xl w-full my-8 overflow-hidden border border-blue-500/30">
        <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {t('register')} – {t('hospital')}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ta'
                  ? 'இரத்த வங்கி அல்லது மருத்துவ மையத்தை பதிவு செய்யவும்'
                  : 'Register medical center or blood bank on BloodLink AI'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('hospitalName')} *
            </label>
            <input
              type="text"
              required
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="e.g. Government Medical College Hospital"
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('authorizedContact')} *
            </label>
            <input
              type="text"
              required
              value={authorizedContact}
              onChange={(e) => setAuthorizedContact(e.target.value)}
              placeholder="e.g. Dr. S. Ramanathan (Blood Bank In-Charge)"
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('phoneNumber')} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 44 2530 5000"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('emailAddress')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bloodbank@gmchospital.org"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reusable District Selector with 38 Tamil Nadu districts */}
            <div>
              <DistrictSelect
                value={district}
                onChange={setDistrict}
                label={t('district')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('cityArea')} *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Egmore, Courtallam"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('hospitalAddress')} *
            </label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. EVR Periyar Salai, Park Town, Chennai - 600003"
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {language === 'ta' ? 'சரிபார்ப்பு தேவையாகும்' : 'Verification Required'}
              </span>
              <span>
                {language === 'ta'
                  ? 'பதிவு செய்தவுடன் நிர்வாகியின் ஒப்புதல் பெற்ற பிறகே இரத்தக் கோரிக்கைகளை வெளியிட முடியும்.'
                  : 'Hospital accounts must be verified by an administrator before creating real blood requests.'}
              </span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{t('registerHospitalButton')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
