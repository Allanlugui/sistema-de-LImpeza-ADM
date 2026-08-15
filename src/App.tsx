import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CustomersView } from './components/CustomersView';
import { CollaboratorsView } from './components/CollaboratorsView';
import { RequestsView } from './components/RequestsView';
import { AllocationLiveTrackingView } from './components/AllocationLiveTrackingView';
import { FeedbacksView } from './components/FeedbacksView';
import { SettingsView } from './components/SettingsView';
import { FirstAccessAuthModal } from './components/FirstAccessAuthModal';
import { ToastContainer } from './components/ToastContainer';

function MainAppContent() {
  const { adminUser, isFirstAccess, activeTab } = useApp();
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isNewCollabModalOpen, setIsNewCollabModalOpen] = useState(false);

  // If not authenticated or first access setup needed
  if (!adminUser || isFirstAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <FirstAccessAuthModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4] text-[#243029] flex flex-col font-sans selection:bg-[#5A7D6C] selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Tab Navigation */}
      <Navigation />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <OverviewDashboard
            onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
            onOpenNewCollaboratorModal={() => setIsNewCollabModalOpen(true)}
          />
        )}

        {activeTab === 'solicitacoes' && (
          <RequestsView
            isNewModalOpen={isNewRequestModalOpen}
            setIsNewModalOpen={setIsNewRequestModalOpen}
          />
        )}

        {activeTab === 'clientes' && (
          <CustomersView />
        )}

        {activeTab === 'colaboradores' && (
          <CollaboratorsView />
        )}

        {activeTab === 'alocacao' && (
          <AllocationLiveTrackingView />
        )}

        {activeTab === 'feedbacks' && (
          <FeedbacksView />
        )}

        {activeTab === 'configuracoes' && (
          <SettingsView />
        )}
      </main>

      {/* Global Toasts */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

