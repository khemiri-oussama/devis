'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { FiFileText, FiUsers, FiClipboard, FiCalendar } from 'react-icons/fi';

export function Dashboard() {
  const devis = useAppStore((state) => state.devis);
  const clients = useAppStore((state) => state.clients);
  const setCurrentPage = useAppStore((state) => state.setCurrentPage);
  const setSelectedDevisId = useAppStore((state) => state.setSelectedDevisId);
  const getClientById = useAppStore((state) => state.getClientById);

  const drafts = devis.filter((d) => d.status === 'draft').length;
  const recentDevis = devis.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-foreground/60 mt-2">Bienvenue dans votre gestionnaire de devis</p>
        </div>
        <Button
          onClick={() => {
            setSelectedDevisId(undefined);
            setCurrentPage('devis');
          }}
          className="bg-primary hover:bg-primary/90"
        >
          + Nouveau devis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          icon={FiFileText}
          title="Total Devis"
          value={devis.length}
          color="blue"
        />
        <SummaryCard
          icon={FiUsers}
          title="Clients"
          value={clients.length}
          color="green"
        />
        <SummaryCard
          icon={FiClipboard}
          title="Brouillons"
          value={drafts}
          color="amber"
        />
        <SummaryCard
          icon={FiCalendar}
          title="Ce mois-ci"
          value={devis.filter((d) => {
            const date = new Date(d.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}
          color="purple"
        />
      </div>

      {/* Recent Devis */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Devis récents</h2>
          <Button
            variant="outline"
            onClick={() => setCurrentPage('devis')}
          >
            Voir tous
          </Button>
        </div>

        {recentDevis.length > 0 ? (
          <div className="space-y-3">
            {recentDevis.map((d) => {
              const client = getClientById(d.clientId);
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDevisId(d.id);
                    setCurrentPage('devis');
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{d.number}</p>
                    <p className="text-sm text-foreground/60">{client?.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {d.amount} {d.ttc}
                    </p>
                    <p className="text-xs text-foreground/60">{d.date}</p>
                  </div>
                  <div className="ml-4 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    {d.status}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-foreground/60">Aucun devis pour le moment</p>
            <Button
              onClick={() => setCurrentPage('devis')}
              className="mt-4"
            >
              Créer le premier devis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-foreground/60 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
