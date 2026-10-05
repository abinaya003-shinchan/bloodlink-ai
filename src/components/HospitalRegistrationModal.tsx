import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Building2, AlertCircle, X } from 'lucide-react';

interface HospitalRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hospital: any) => void;
}

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
];

export const HospitalRegistrationModal: React.FC<HospitalRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();

  const [hospitalName, setHospitalName] = useState('');
  const [authorizedContact, setAuthorizedContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [city, setCity] = useState('Chennai');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hospitalName.trim() || !authorizedContact.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      setError('Please provide all mandatory hospital credentials.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.registerHospital({
        hospitalName: hospitalName.trim(),
        authorizedContact: authorizedContact.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        district,
        city: city.trim(),
        location: {
          lat: 13.0827,
          lng: 80.2707,
          address: `${address.trim()}, ${city}, ${district}`,
          district,
          city,
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
          <div>
            <h2 className="text-lg font-black text-white">{t('register')} – {t('hospital')}</h2>
            <p className="text-xs text-slate-400">
              Register medical center or blood bank on BloodLink AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2">
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
                placeholder="+91 44 2855 0000"
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('district')} *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
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
                placeholder="e.g. Egmore, Chennai"
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

          <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300">
            {t('hospitalVerificationNotice')}
          </div>

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
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              {loading ? t('loading') : t('registerHospitalButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
