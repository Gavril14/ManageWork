// ═══ CONSTRUCTION CMS — Main App ═══
// This wraps the CMS with authentication.
// The CMS component is the full 13,000-line single-file app.
//
// MIGRATION STRATEGY:
// Phase 1 (NOW): CMS.jsx works as a single file — all features functional
// Phase 2: Extract components from CMS.jsx into /components/ folder
// Phase 3: Replace in-memory state with API calls via api.js
// Phase 4: Add Socket.io for real-time updates

import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import CMS from './CMS';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#0B1120', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
          <div style={{ color: '#E5A822', fontSize: 16, fontWeight: 600 }}>Loading CMS...</div>
        </div>
      </div>
    );
  }

  // If no backend connected yet, show CMS directly (dev mode)
  // In production, remove this and require login
  if (!import.meta.env.VITE_API_URL) {
    return <CMS />;
  }

  return user ? <CMS /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
