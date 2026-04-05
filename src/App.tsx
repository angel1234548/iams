import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ASASRegistration from './pages/ASASRegistration';
import Login from './pages/Login';
import OrganizationSignup from './pages/OrganizationSignup';
import StudentDashboard from './pages/StudentDashboard';
import OrganizationDashboard from './pages/OrganizationDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import EmailSimulator from './pages/EmailSimulator';
import { Mail } from 'lucide-react';

type View = 'asas' | 'login' | 'org-signup' | 'email-simulator';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('asas');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'student') {
      return <StudentDashboard />;
    } else if (user.role === 'organization') {
      return <OrganizationDashboard />;
    } else if (user.role === 'coordinator') {
      return <CoordinatorDashboard />;
    }
  }

  if (view === 'email-simulator') {
    return <EmailSimulator onBack={() => setView('login')} />;
  }

  if (view === 'asas') {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setView('login')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            Go to Login
          </button>
          <button
            onClick={() => setView('email-simulator')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Mail className="w-4 h-4" />
            Email Simulator
          </button>
        </div>
        <ASASRegistration onRegistrationComplete={() => setView('login')} />
      </div>
    );
  }

  if (view === 'org-signup') {
    return (
      <OrganizationSignup
        onBack={() => setView('login')}
        onSignupComplete={() => setView('login')}
      />
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setView('asas')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          ASAS Registration
        </button>
        <button
          onClick={() => setView('email-simulator')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Mail className="w-4 h-4" />
          Email Simulator
        </button>
      </div>
      <Login onNeedOrganizationSignup={() => setView('org-signup')} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
