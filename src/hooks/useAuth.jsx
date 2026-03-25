// ═══ AUTH CONTEXT — Manages login state across app ═══
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(api.companyId);

  // Check existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (api.token) {
        try {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.data);
            const coRes = await api.getCompanies();
            if (coRes.success) setCompanies(coRes.data);
          } else {
            api.clearAuth();
          }
        } catch {
          api.clearAuth();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      setUser(res.data.user);
      setActiveCompanyId(api.companyId);
      const coRes = await api.getCompanies();
      if (coRes.success) setCompanies(coRes.data);
    }
    return res;
  };

  const logout = () => {
    api.clearAuth();
    setUser(null);
    setCompanies([]);
    setActiveCompanyId(null);
  };

  const switchCompany = (companyId) => {
    api.setCompanyId(companyId);
    setActiveCompanyId(companyId);
  };

  return (
    <AuthContext.Provider value={{ user, loading, companies, activeCompanyId, login, logout, switchCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
