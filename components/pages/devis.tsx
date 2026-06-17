'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DevisEditor } from '@/components/devis/editor';
import { DevisPreview } from '@/components/devis/preview';
import { FiSearch, FiTrash2, FiCopy, FiPlus, FiEye } from 'react-icons/fi';

export function DevisPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevisId, setSelectedDevisId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const devis = useAppStore((state) => state.devis);
  const deleteDevis = useAppStore((state) => state.deleteDevis);
  const duplicateDevis = useAppStore((state) => state.duplicateDevis);
  const addDevis = useAppStore((state) => state.addDevis);
  const searchDevis = useAppStore((state) => state.searchDevis);
  const getClientById = useAppStore((state) => state.getClientById);
  const clients = useAppStore((state) => state.clients);

  const displayDevis = searchQuery ? searchDevis(searchQuery) : devis;
  const sortedDevis = displayDevis.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  const selectedDevis = selectedDevisId ? devis.find((d) => d.id === selectedDevisId) : null;

  const handleCreateNew = async () => {
    if (clients.length === 0) {
      alert('Veuillez créer un client d\'abord');
      return;
    }
    try {
      console.log('[v0] Creating new devis...');
      const newDevis = await addDevis({
        clientId: clients[0].id,
        date: new Date().toISOString().split('T')[0],
        emailDate: new Date().toISOString().split('T')[0],
        subject: '',
        introduction: '',
        workItems: [],
        premises: '',
        amount: '0',
        taxLabel: 'TVA',
        taxPercentage: 19,
        taxes: '0',
        ttc: '0',
        signatureName: 'Direction Fayçal Jelloul',
        companyName: '',
        status: 'draft',
      });
      console.log('[v0] New devis created:', newDevis);
      setSelectedDevisId(newDevis.id);
      setShowEditor(true);
    } catch (error) {
      console.error('[v0] Error creating devis:', error);
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Une erreur est survenue'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      console.log('[v0] Duplicating devis:', id);
      const duplicated = await duplicateDevis(id);
      console.log('[v0] Devis duplicated:', duplicated);
      if (duplicated) {
        setSelectedDevisId(duplicated.id);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('[v0] Error duplicating devis:', error);
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Une erreur est survenue'));
    }
  };

  if (selectedDevis && showEditor) {
    return (
      <DevisEditor
        devisId={selectedDevis.id}
        onClose={() => {
          setShowEditor(false);
          setSelectedDevisId(null);
        }}
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devis</h1>
          <p className="text-foreground/60 mt-2">{devis.length} devis</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <FiPlus className="mr-2 w-4 h-4" />
          Nouveau devis
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <Input
          placeholder="Rechercher par numéro, client ou date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Devis List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {sortedDevis.length > 0 ? (
          <div className="divide-y divide-border">
            {sortedDevis.map((d) => {
              const client = getClientById(d.clientId);
              return (
                <div key={d.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedDevisId(d.id);
                        setShowEditor(true);
                      }}
                    >
                      <h3 className="font-semibold text-foreground">{d.number}</h3>
                      <p className="text-sm text-foreground/60 mt-1">{client?.companyName}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-foreground/60">Date: {d.date}</span>
                        <span className="text-foreground">Montant: {d.amount} {d.ttc}</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          d.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          d.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          d.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <FiEye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto print:hidden">
                          <DialogHeader>
                            <DialogTitle>{d.number}</DialogTitle>
                          </DialogHeader>
                          <DevisPreview devis={d} showActions={true} />
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(d.id)}
                      >
                        <FiCopy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
                            deleteDevis(d.id);
                          }
                        }}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-foreground/60 mb-4">Aucun devis trouvé</p>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              Créer le premier devis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
