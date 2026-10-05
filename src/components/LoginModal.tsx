import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { UserRole } from '../types';
import { Building2, HeartPulse, ShieldCheck, X, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToDonorRegister: () => void;
  onSwitchToHospitalRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToDonorRegister,
  onSwitchToHospitalRegister,
}) => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('HOSPITAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, demoRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-950 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-md w-full overflow-hidden border border-red-500/30">
        <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">{t('login')} – BloodLink AI</h2>
            <p className="text-xs text-slate-400">{t('selectRole')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Selector */}
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('demoLogin')} (Instant Test)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('hospital@bloodlink.org', 'HOSPITAL')}
                className="p-2.5 rounded-xl border border-slate-800 hover:border-blue-500 hover:bg-blue-950/40 bg-slate-900/60 flex flex-col items-center text-center transition-all group cursor-pointer"
              >
                <Building2 className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-white">{t('hospital')}</span>
                <span className="text-[10px] text-slate-400">[DEMO]</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('donor@bloodlink.org', 'DONOR')}
                className="p-2.5 rounded-xl border border-slate-800 hover:border-red-500 hover:bg-red-950/40 bg-slate-900/60 flex flex-col items-center text-center transition-all group cursor-pointer"
              >
                <HeartPulse className="w-5 h-5 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-white">{t('donor')}</span>
                <span className="text-[10px] text-slate-400">[DEMO]</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin@bloodlink.org', 'ADMIN')}
                className="p-2.5 rounded-xl border border-slate-800 hover:border-purple-500 hover:bg-purple-950/40 bg-slate-900/60 flex flex-col items-center text-center transition-all group cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-white">{t('admin')}</span>
                <span className="text-[10px] text-slate-400">[DEMO]</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-xs uppercase font-mono">Or Sign In with Email</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('role')}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="HOSPITAL">{t('hospital')}</option>
                <option value="DONOR">{t('donor')}</option>
                <option value="ADMIN">{t('admin')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('emailAddress')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.org"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl glow-ruby-btn transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToDonorRegister();
              }}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              + {t('register')} {t('donor')}
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToHospitalRegister();
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              + {t('register')} {t('hospital')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
