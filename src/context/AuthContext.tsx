import React, { createContext, useContext, useState, useEffect } from 'react';
import { Donor, Hospital, User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  donor: Donor | null;
  hospital: Hospital | null;
  role: UserRole | null;
  loading: boolean;
  demoUsers: any[];
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchDemoUser: (targetRole: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDonor: (d: Donor | null) => void;
  setHospital: (h: Hospital | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  const fetchDemoUsers = async () => {
    try {
      const users = await api.getDemoUsers();
      setDemoUsers(users);
    } catch (err) {
      console.warn('Could not load demo users:', err);
    }
  };

  const login = async (email: string, role?: UserRole) => {
    setLoading(true);
    try {
      const data = await api.login(email, role);
      setUser(data.user);
      setDonor(data.donor || null);
      setHospital(data.hospital || null);
      localStorage.setItem('bloodlink_user_email', data.user.email);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setDonor(null);
    setHospital(null);
    localStorage.removeItem('bloodlink_user_email');
  };

  const switchDemoUser = async (targetRole: UserRole) => {
    const target = demoUsers.find((u) => u.role === targetRole);
    if (target) {
      await login(target.email, targetRole);
    } else {
      const fallbackEmail =
        targetRole === 'ADMIN'
          ? 'admin@bloodlink.org'
          : targetRole === 'HOSPITAL'
          ? 'hospital@bloodlink.org'
          : 'donor@bloodlink.org';
      await login(fallbackEmail, targetRole);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      if (user.role === 'DONOR') {
        const donors = await api.getDonors();
        const found = donors.find((d) => d.userId === user.id || d.email.toLowerCase() === user.email.toLowerCase());
        if (found) setDonor(found);
      } else if (user.role === 'HOSPITAL') {
        const hospitals = await api.getHospitals();
        const found = hospitals.find((h) => h.userId === user.id || h.email.toLowerCase() === user.email.toLowerCase());
        if (found) setHospital(found);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDemoUsers();
      const savedEmail = localStorage.getItem('bloodlink_user_email');
      if (savedEmail) {
        try {
          await login(savedEmail);
        } catch {
          // If saved email fails, fall back to default demo Hospital
          await login('hospital@bloodlink.org', 'HOSPITAL');
        }
      } else {
        // Default initial landing: Demo Hospital to immediately showcase smart matching & request flow
        await login('hospital@bloodlink.org', 'HOSPITAL');
      }
      setLoading(false);
    };

    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        donor,
        hospital,
        role: user ? user.role : null,
        loading,
        demoUsers,
        login,
        logout,
        switchDemoUser,
        refreshProfile,
        setDonor,
        setHospital,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
