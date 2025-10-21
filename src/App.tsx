import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import ContactsPage from './components/ContactsPage';
import MessagesPage from './components/MessagesPage';
import SettingsPage from './components/SettingsPage';
import MessageLogPage from './components/MessageLogPage';
import ConsentPage from './components/ConsentPage';
import { createDemoData, hasDemoData } from './utils/demoData';

type Page = 'landing' | 'dashboard' | 'contacts' | 'messages' | 'settings' | 'message-log' | 'consent';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [prefillDraft, setPrefillDraft] = useState(false);
  const [demoDataLoading, setDemoDataLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkAndCreateDemoData();
      setCurrentPage('dashboard');
    } else if (!loading) {
      setCurrentPage('landing');
    }
  }, [user, loading]);

  const checkAndCreateDemoData = async () => {
    if (!user) return;

    setDemoDataLoading(true);
    try {
      const hasData = await hasDemoData(user.id);
      if (!hasData) {
        await createDemoData(user.id);
      }
    } catch (error) {
      console.error('Error with demo data:', error);
    } finally {
      setDemoDataLoading(false);
    }
  };

  const handleNavigate = (page: 'contacts' | 'messages' | 'settings' | 'message-log', contactId?: string) => {
    if (page === 'messages' && contactId) {
      setSelectedContactId(contactId);
      setPrefillDraft(false);
      setCurrentPage('messages');
    } else {
      setCurrentPage(page);
    }
  };

  const handleAICatchup = (contactId: string) => {
    setSelectedContactId(contactId);
    setPrefillDraft(true);
    setCurrentPage('messages');
  };

  if (loading || demoDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage onGetStarted={() => setShowAuthModal(true)} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <Dashboard
        onNavigate={(page, contactId) => {
          if (contactId) {
            handleAICatchup(contactId);
          } else {
            handleNavigate(page);
          }
        }}
      />
    );
  }

  if (currentPage === 'contacts') {
    return <ContactsPage onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'messages' && selectedContactId) {
    return (
      <MessagesPage
        contactId={selectedContactId}
        onBack={() => setCurrentPage('dashboard')}
        prefillDraft={prefillDraft}
      />
    );
  }

  if (currentPage === 'settings') {
    return <SettingsPage onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'message-log') {
    return <MessageLogPage onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'consent' && selectedContactId) {
    return <ConsentPage contactId={selectedContactId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Page not found</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
