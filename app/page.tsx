'use client';

import { useAppStore } from '@/lib/store';
import { AppProvider } from '@/components/app-provider';
import { Sidebar } from '@/components/sidebar';
import { Dashboard } from '@/components/pages/dashboard';
import { DevisPage } from '@/components/pages/devis';
import { ClientsPage } from '@/components/pages/clients';
import { TemplatesPage } from '@/components/pages/templates';
import { SettingsPage } from '@/components/pages/settings';

function AppContent() {
  const currentPage = useAppStore((state) => state.currentPage);
  const isLoading = useAppStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/60">Chargement de l&apos;application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'devis' && <DevisPage />}
          {currentPage === 'clients' && <ClientsPage />}
          {currentPage === 'templates' && <TemplatesPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
