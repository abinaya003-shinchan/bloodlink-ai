/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { Navbar, MainNavView } from './components/Navbar';
import { SignatureHero } from './components/SignatureHero';
import { HeroSearchBar } from './components/HeroSearchBar';
import { LiveBloodNetwork } from './components/LiveBloodNetwork';
import { BloodDonationImportance } from './components/BloodDonationImportance';
import { FindDonorView } from './components/FindDonorView';
import { AIMatchingView } from './components/AIMatchingView';
import { EmergencyView } from './components/EmergencyView';
import { DonorDashboard } from './components/DonorDashboard';
import { HospitalDashboard } from './components/HospitalDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { EmergencyResponseView } from './components/EmergencyResponseView';
import { DonorRegistrationModal } from './components/DonorRegistrationModal';
import { HospitalRegistrationModal } from './components/HospitalRegistrationModal';
import { LoginModal } from './components/LoginModal';
import { BloodGroup } from './types';
import {
  HeartPulse,
  Building2,
  ShieldCheck,
  ArrowRight,
  Activity,
  Users,
  AlertCircle,
  Phone,
  Flame,
  Droplets,
  ExternalLink,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, donor, hospital, role, switchDemoUser, login, logout } = useAuth();
  const { t, language } = useLanguage();

  const [activeView, setActiveView] = useState<MainNavView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBloodGroup, setSearchBloodGroup] = useState<BloodGroup | undefined>(undefined);

  const [smsResponseParams, setSmsResponseParams] = useState<{ requestId: string; donorId: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/respond\/([^/]+)\/([^/]+)/);
      if (match) {
        return { requestId: match[1], donorId: match[2] };
      }
    }
    return null;
  });

  React.useEffect(() => {
    const handleCustomEvent = (e: any) => {
      if (e.detail?.requestId && e.detail?.donorId) {
        setSmsResponseParams({ requestId: e.detail.requestId, donorId: e.detail.donorId });
      }
    };
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/respond\/([^/]+)\/([^/]+)/);
      if (match) {
        setSmsResponseParams({ requestId: match[1], donorId: match[2] });
      } else {
        setSmsResponseParams(null);
      }
    };
    window.addEventListener('open-emergency-response', handleCustomEvent);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('open-emergency-response', handleCustomEvent);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const [isDonorRegisterOpen, setIsDonorRegisterOpen] = useState(false);
  const [isHospitalRegisterOpen, setIsHospitalRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleDonorRegisterSuccess = async (newDonor: any) => {
    await login(newDonor.email, 'DONOR');
    setActiveView('dashboard');
  };

  const handleHospitalRegisterSuccess = async (newHospital: any) => {
    await login(newHospital.email, 'HOSPITAL');
    setActiveView('dashboard');
  };

  const handleHeroSearch = (query: string, bloodGroup?: BloodGroup) => {
    setSearchQuery(query);
    setSearchBloodGroup(bloodGroup);
    setActiveView('find-donor');
  };

  const handleEmergencyNavigate = () => {
    setActiveView('emergency');
  };

  return (
    <div className="min-h-screen bg-medical-dark bg-medical-grid text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onSelectView={(v) => {
          if (smsResponseParams && typeof window !== 'undefined') {
            window.history.pushState(null, '', '/');
          }
          setSmsResponseParams(null);
          setActiveView(v);
        }}
        onOpenDonorRegister={() => setIsDonorRegisterOpen(true)}
        onOpenHospitalRegister={() => setIsHospitalRegisterOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <main className="flex-1 pb-16">
        {/* Dynamic Route View rendering */}
        {smsResponseParams ? (
          <EmergencyResponseView
            requestId={smsResponseParams.requestId}
            donorId={smsResponseParams.donorId}
            onGoHome={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState(null, '', '/');
              }
              setSmsResponseParams(null);
              setActiveView('home');
            }}
          />
        ) : activeView === 'find-donor' ? (
          <FindDonorView
            initialSearchQuery={searchQuery}
            initialBloodGroup={searchBloodGroup}
            onRequestBloodClick={() => {
              if (role === 'HOSPITAL') {
                setActiveView('dashboard');
              } else {
                setIsHospitalRegisterOpen(true);
              }
            }}
          />
        ) : activeView === 'ai-match' ? (
          <AIMatchingView
            onRequestBloodClick={() => {
              if (role === 'HOSPITAL') {
                setActiveView('dashboard');
              } else {
                setIsHospitalRegisterOpen(true);
              }
            }}
          />
        ) : activeView === 'emergency' ? (
          <EmergencyView
            onCreateEmergencyClick={() => {
              if (role === 'HOSPITAL') {
                setActiveView('dashboard');
              } else {
                setIsHospitalRegisterOpen(true);
              }
            }}
          />
        ) : activeView === 'dashboard' ? (
          /* Role Dashboard */
          role === 'DONOR' ? (
            <DonorDashboard />
          ) : role === 'HOSPITAL' ? (
            <HospitalDashboard />
          ) : role === 'ADMIN' ? (
            <AdminDashboard />
          ) : (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                <HeartPulse className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white">Select a Role to View Dashboard</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in to your verified account or click any one-click demo user at the top to test Hospital, Donor, or Admin controls.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl glow-ruby-btn transition-all"
                >
                  Log In to Existing Account
                </button>
                <button
                  onClick={() => switchDemoUser('HOSPITAL').then(() => setActiveView('dashboard'))}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Enter Hospital Demo Mode
                </button>
              </div>
            </div>
          )
        ) : (
          /* Home View: Signature Hero, Live Network, Gateway, Lifeline, and Protocols */
          <div className="space-y-12">
            {/* Centerpiece Hero */}
            <SignatureHero
              onFindDonorClick={() => setActiveView('find-donor')}
              onBecomeDonorClick={() => setIsDonorRegisterOpen(true)}
              onEmergencyClick={handleEmergencyNavigate}
            />

            {/* Smart Search Bar */}
            <HeroSearchBar onSearch={handleHeroSearch} />

            {/* Live Blood Network Telemetry */}
            <LiveBloodNetwork />

            {/* Role Gateway Cards */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                <span className="text-[11px] font-mono tracking-widest uppercase text-red-400 bg-red-950/60 border border-red-800/60 px-3 py-1 rounded-full">
                  {language === 'ta' ? 'அணுகல் வழிகள்' : 'ROLE ACCESS PORTALS'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {language === 'ta' ? 'உங்கள் பங்களிப்பைத் தேர்வுசெய்க' : 'Choose Your Platform Experience'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'ta'
                    ? 'மருத்துவமனைகள், கொடையாளர்கள் மற்றும் கணினி நிர்வாகிகளுக்கான பிரத்யேக டாஷ்போர்டுகள்.'
                    : 'Experience end-to-end verified workflows for healthcare facilities, life-saving donors, and compliance audits.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hospital Portal Card */}
                <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col justify-between group shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold mb-4 shadow-[0_0_15px_rgba(59,130,246,0.25)] group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-white">{t('hospital')}</h3>
                      <span className="text-[10px] font-mono uppercase bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                        TRAUMA & ICU
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Create blood requests, utilize deterministic ABO/Rh compatibility matching, view nearby verified donors within 50km, and broadcast urgent emergency notifications.
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      onClick={async () => {
                        await switchDemoUser('HOSPITAL');
                        setActiveView('dashboard');
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Enter Hospital Demo <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsHospitalRegisterOpen(true)}
                      className="w-full py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 transition-colors text-center cursor-pointer"
                    >
                      Register New Hospital
                    </button>
                  </div>
                </div>

                {/* Donor Portal Card */}
                <div className="glass-panel p-6 rounded-3xl border border-red-500/30 hover:border-red-500/50 transition-all flex flex-col justify-between group shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-rose-400 flex items-center justify-center font-bold mb-4 shadow-[0_0_15px_rgba(244,63,94,0.3)] group-hover:scale-105 transition-transform">
                      <HeartPulse className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-white">{t('donor')}</h3>
                      <span className="text-[10px] font-mono uppercase bg-red-950 text-rose-300 border border-red-800 px-2 py-0.5 rounded">
                        LIFE SAVER
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Register with verified blood group, manage live availability, toggle 24/7 emergency response, and respond to incoming hospital requests (I Can Donate, Not Available, Maybe Later).
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      onClick={async () => {
                        await switchDemoUser('DONOR');
                        setActiveView('dashboard');
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl glow-ruby-btn transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Enter Donor Demo <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsDonorRegisterOpen(true)}
                      className="w-full py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 transition-colors text-center cursor-pointer"
                    >
                      Register as Blood Donor
                    </button>
                  </div>
                </div>

                {/* Admin Portal Card */}
                <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold mb-4 shadow-[0_0_15px_rgba(168,85,247,0.25)] group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-white">{t('admin')}</h3>
                      <span className="text-[10px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                        AUDIT & TRUST
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Audit verification queues, enforce profile completeness standards, detect duplicate or suspicious records, and inspect tamper-evident audit logs.
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      onClick={async () => {
                        await switchDemoUser('ADMIN');
                        setActiveView('dashboard');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Enter Admin Demo <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="w-full py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 transition-colors text-center cursor-pointer"
                    >
                      Administrator Login
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* The Lifeline Journey & Educational Section */}
            <BloodDonationImportance />
          </div>
        )}
      </main>

      {/* Global Medical Trust & Emergency Response Footer */}
      <footer className="border-t border-slate-900 bg-black/80 backdrop-blur-xl py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-base font-black text-white tracking-tight">BloodLink AI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous medical donor identifier & deterministic ABO/Rh smart matching network connecting hospitals and verified life savers.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Regional Hospital Meshes Operational</span>
              </div>
            </div>

            {/* Medical Standards */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Clinical Protocols</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li>• Standard Red Blood Cell (RBC) ABO/Rh Matrix</li>
                <li>• 90-Day Safe Donation Rest Interval</li>
                <li>• Mandatory Hospital Laboratory Serological Crossmatch</li>
                <li>• Zero Fabricated Verification Guarantee</li>
              </ul>
            </div>

            {/* Quick Views */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Rapid Navigation</h4>
              <div className="flex flex-col space-y-1.5 text-[11px]">
                <button
                  onClick={() => setActiveView('home')}
                  className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Homepage & Lifeline
                </button>
                <button
                  onClick={() => setActiveView('find-donor')}
                  className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Find Nearby Donors
                </button>
                <button
                  onClick={() => setActiveView('ai-match')}
                  className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  AI Match Simulator
                </button>
                <button
                  onClick={() => setActiveView('emergency')}
                  className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Emergency Trauma Broadcast
                </button>
              </div>
            </div>

            {/* Emergency Hotline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 animate-pulse text-red-500" />
                24/7 Emergency Blood Hotline
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In acute trauma or life-threatening hemorrhage situations, hospital staff can coordinate direct emergency dispatch.
              </p>
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-sm font-mono font-bold text-white tracking-wider">104 / 108</div>
                  <div className="text-[10px] text-slate-400">Tamil Nadu State Health Emergency</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 BloodLink AI. All rights reserved. Built for rapid, trusted, and verified blood coordination.
            </div>
            <div className="flex items-center gap-4">
              <span>English & தமிழ் Supported</span>
              <span>•</span>
              <span className="text-amber-500/80 font-mono">DEMO SEEDS ACTIVE FOR AUDIT</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DonorRegistrationModal
        isOpen={isDonorRegisterOpen}
        onClose={() => setIsDonorRegisterOpen(false)}
        onSuccess={handleDonorRegisterSuccess}
      />

      <HospitalRegistrationModal
        isOpen={isHospitalRegisterOpen}
        onClose={() => setIsHospitalRegisterOpen(false)}
        onSuccess={handleHospitalRegisterSuccess}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToDonorRegister={() => setIsDonorRegisterOpen(true)}
        onSwitchToHospitalRegister={() => setIsHospitalRegisterOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
