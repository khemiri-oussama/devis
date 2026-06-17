'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiSearch, FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';

export function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const clients = useAppStore((state) => state.clients);
  const addClient = useAppStore((state) => state.addClient);
  const updateClient = useAppStore((state) => state.updateClient);
  const deleteClient = useAppStore((state) => state.deleteClient);
  const searchClients = useAppStore((state) => state.searchClients);

  const displayClients = searchQuery ? searchClients(searchQuery) : clients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[v0] Form submitted with data:', formData);
    
    if (!formData.companyName.trim()) {
      alert('Le nom de l\'entreprise est requis');
      return;
    }

    try {
      if (editingId) {
        console.log('[v0] Updating client:', editingId);
        await updateClient(editingId, formData);
        setEditingId(null);
      } else {
        console.log('[v0] Creating new client');
        await addClient(formData);
      }
      console.log('[v0] Client operation successful');
      setFormData({
        companyName: '',
        contactPerson: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('[v0] Error submitting form:', error);
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Une erreur est survenue'));
    }
  };

  const handleEdit = (client: any) => {
    setFormData(client);
    setEditingId(client.id);
    setShowForm(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-foreground/60 mt-2">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  companyName: '',
                  contactPerson: '',
                  title: '',
                  email: '',
                  phone: '',
                  address: '',
                  notes: '',
                });
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <FiPlus className="mr-2 w-4 h-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} un client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Personne de contact</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingId ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <Input
          placeholder="Rechercher des clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {displayClients.length > 0 ? (
          <div className="divide-y divide-border">
            {displayClients.map((client) => (
              <div key={client.id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{client.companyName}</h3>
                    {client.contactPerson && (
                      <p className="text-sm text-foreground/60">{client.contactPerson}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(client)}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
                          try {
                            console.log('[v0] Deleting client:', client.id);
                            await deleteClient(client.id);
                            console.log('[v0] Client deleted successfully');
                          } catch (error) {
                            console.error('[v0] Error deleting client:', error);
                            alert('Erreur lors de la suppression');
                          }
                        }
                      }}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {client.email && (
                    <div>
                      <p className="text-foreground/60 text-xs mb-1">Email</p>
                      <p className="text-foreground">{client.email}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <p className="text-foreground/60 text-xs mb-1">Téléphone</p>
                      <p className="text-foreground">{client.phone}</p>
                    </div>
                  )}
                  {client.address && (
                    <div className="md:col-span-2">
                      <p className="text-foreground/60 text-xs mb-1">Adresse</p>
                      <p className="text-foreground">{client.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-foreground/60">Aucun client trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
