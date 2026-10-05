import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { UserRole } from '../types';
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  Building2,
  User,
  Globe,
  LogOut,
  Bell,
  MapPin,
  Cpu,
  Flame,
  Menu,
  X,
  Droplet,
} from 'lucide-react';

export type MainNavView = 'home' | 'find-donor' | 'ai-match' | 'emergency' | 'dashboard';

interface NavbarProps {
  activeView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  onOpenDonorRegister: () => void;
  onOpenHospitalRegister: () => void;
  onOpenLogin: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onSelectView,
  onOpenDonorRegister,
  onOpenHospitalRegister,
  onOpenLogin,
  unreadCount = 0,
}) => {
  const { user, donor, hospital, role, logout, switchDemoUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [switching, setSwitching] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleDemoSwitch = async (targetRole: UserRole) => {
    setSwitching(true);
    try {
      await switchDemoUser(targetRole);
      onSelectView('dashboard');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="bg-slate-950/90 backdrop-blur-xl border-b border-red-500/20 sticky top-0 z-50">
      {/* Top Banner: Quick Demo Switcher & Mode Indicator */}
      <div className="bg-black/60 px-4 py-1.5 border-b border-slate-900 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-300">BloodLink Live Triage</span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] font-mono text-emerald-400">Active Hospital Mesh</span>
        </div>

        {/* Quick Demo Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px]">{t('demoLogin')}:</span>
          <button
            onClick={() => handleDemoSwitch('HOSPITAL')}
            disabled={switching}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              role === 'HOSPITAL'
                ? 'bg-red-600 text-white shadow-[0_0_10px_#ef4444]'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-3 h-3 text-blue-400" />
            {t('hospital')} [DEMO]
          </button>
          <button
            onClick={() => handleDemoSwitch('DONOR')}
            disabled={switching}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              role === 'DONOR'
                ? 'bg-red-600 text-white shadow-[0_0_10px_#ef4444]'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <HeartPulse className="w-3 h-3 text-rose-400" />
            {t('donor')} [DEMO]
          </button>
          <button
            onClick={() => handleDemoSwitch('ADMIN')}
            disabled={switching}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              role === 'ADMIN'
                ? 'bg-red-600 text-white shadow-[0_0_10px_#ef4444]'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            {t('admin')} [DEMO]
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectView('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white glow-text-red">
                {t('appTitle')}
              </span>
              <span className="bg-red-950 text-red-300 border border-red-500/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider">
                AI SMART
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {language === 'ta' ? 'அதிவேக இரத்த தானப் பொருத்தம்' : 'Smart Blood Matching Network'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <button
            onClick={() => onSelectView('home')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'home'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'ta' ? 'முகப்பு' : 'Home'}</span>
          </button>

          <button
            onClick={() => onSelectView('find-donor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'find-donor'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>{language === 'ta' ? 'கொடையாளரைக் கண்டறி' : 'Find Donor'}</span>
          </button>

          <button
            onClick={() => onSelectView('ai-match')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'ai-match'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'ta' ? 'AI பொருத்தம்' : 'AI Match'}</span>
          </button>

          <button
            onClick={() => onSelectView('emergency')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'emergency'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{language === 'ta' ? 'அவசர நிலை' : 'Emergency'}</span>
          </button>

          {user && (
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {role === 'ADMIN'
                  ? 'Admin Control'
                  : role === 'HOSPITAL'
                  ? 'Hospital Command'
                  : 'Donor Dashboard'}
              </span>
            </button>
          )}
        </nav>

        {/* Right Section: Language Toggle, User Pill, Auth CTAs */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-colors shadow-xs cursor-pointer"
            title="Toggle between English and தமிழ்"
          >
            <Globe className="w-3.5 h-3.5 text-red-400" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectView('dashboard')}
                className="hidden md:flex flex-col text-right cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-200 group-hover:text-red-300 transition-colors">
                  {user.name}
                  {donor && donor.isDemo && ' [DEMO]'}
                  {hospital && hospital.isDemo && ' [DEMO]'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      role === 'ADMIN'
                        ? 'bg-purple-400'
                        : role === 'HOSPITAL'
                        ? 'bg-blue-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  {role === 'ADMIN' ? t('admin') : role === 'HOSPITAL' ? t('hospital') : t('donor')}
                </span>
              </button>

              {role === 'DONOR' && unreadCount > 0 && (
                <button
                  onClick={() => onSelectView('dashboard')}
                  className="relative p-1.5 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md">
                    {unreadCount}
                  </span>
                </button>
              )}

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
              >
                {t('login')}
              </button>
              <button
                onClick={onOpenDonorRegister}
                className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl glow-ruby-btn transition-colors cursor-pointer"
              >
                {t('register')} {t('donor')}
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onSelectView('home');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeView === 'home' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>{language === 'ta' ? 'முகப்பு' : 'Home'}</span>
            </button>

            <button
              onClick={() => {
                onSelectView('find-donor');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeView === 'find-donor' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{language === 'ta' ? 'கொடையாளரைக் கண்டறி' : 'Find Donor'}</span>
            </button>

            <button
              onClick={() => {
                onSelectView('ai-match');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeView === 'ai-match' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{language === 'ta' ? 'AI பொருத்தம்' : 'AI Match'}</span>
            </button>

            <button
              onClick={() => {
                onSelectView('emergency');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeView === 'emergency' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Flame className="w-4 h-4 text-red-400" />
              <span>{language === 'ta' ? 'அவசர நிலை' : 'Emergency'}</span>
            </button>
          </div>

          {user && (
            <button
              onClick={() => {
                onSelectView('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>Open {role === 'ADMIN' ? 'Admin Dashboard' : role === 'HOSPITAL' ? 'Hospital Dashboard' : 'Donor Dashboard'}</span>
            </button>
          )}

          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold border border-slate-700"
              >
                {t('login')}
              </button>
              <button
                onClick={() => {
                  onOpenDonorRegister();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold glow-ruby-btn"
              >
                {t('register')} {t('donor')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
