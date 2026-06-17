'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FiFileText, FiUsers, FiLayers, FiSettings, FiHome } from 'react-icons/fi';

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: FiHome },
  { id: 'devis', label: 'Devis', icon: FiFileText },
  { id: 'clients', label: 'Clients', icon: FiUsers },
  { id: 'templates', label: 'Modèles', icon: FiLayers },
  { id: 'settings', label: 'Paramètres', icon: FiSettings },
];

export function Sidebar() {
  const currentPage = useAppStore((state) => state.currentPage);
  const setCurrentPage = useAppStore((state) => state.setCurrentPage);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-sidebar-foreground">Univers Hygiene</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestionnaire Devis</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-3 py-2 bg-sidebar-accent/10 rounded-lg">
          <p className="text-xs text-sidebar-foreground/60">
            Version 1.0 • Offline-first
          </p>
        </div>
      </div>
    </aside>
  );
}
