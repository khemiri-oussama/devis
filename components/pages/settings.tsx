'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiDownload, FiUpload, FiAlertTriangle } from 'react-icons/fi';
import { getUserSettings, updateSettings } from '@/app/actions/settings';

export function SettingsPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    phone: '',
    email: '',
    defaultSignature: '',
    currency: 'DT',
    taxLabel: 'H.T',
    darkMode: false,
    compactMode: false,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Also keep the store in sync so the rest of the app (e.g. preview) sees the latest values
  const setStoreSettings = useAppStore(
    (state) =>
      (state as any).updateSettings ??
      (state as any).setSettings ??
      (state as any).saveSettings ??
      null
  );

  // Load settings from the DB on mount — this is the missing piece.
  // Without this, the component only ever reads from the in-memory Zustand
  // store which is empty after a page refresh.
  useEffect(() => {
    async function load() {
      try {
        const data = await getUserSettings();
        const normalized = {
          companyName:      data.companyName      ?? '',
          companyAddress:   data.companyAddress   ?? '',
          phone:            data.phone            ?? '',
          email:            data.email            ?? '',
          defaultSignature: data.defaultSignature ?? '',
          currency:         data.currency         ?? 'DT',
          taxLabel:         data.taxLabel         ?? 'H.T',
          darkMode:         data.darkMode         ?? false,
          compactMode:      (data as any).compactMode ?? false,
        };
        setFormData(normalized);
        // Hydrate the store so other components are also up to date
        if (setStoreSettings) setStoreSettings(normalized);
      } catch (err) {
        console.error('Failed to load settings:', err);
        showMessage('Erreur lors du chargement des paramètres', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save to DB via server action
      await updateSettings(formData);
      // Keep Zustand store in sync
      if (setStoreSettings) setStoreSettings(formData);
      showMessage('Paramètres sauvegardés avec succès');
    } catch (err) {
      showMessage('Erreur lors de la sauvegarde', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    try {
      const store = useAppStore.getState();
      const data = JSON.stringify(
        {
          settings: store.settings,
          clients: (store as any).clients,
          devis: (store as any).devis,
        },
        null,
        2
      );
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Données exportées avec succès');
    } catch {
      showMessage("Erreur lors de l'export", 'error');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.settings) {
        await updateSettings(data.settings);
        setFormData((prev) => ({ ...prev, ...data.settings }));
        if (setStoreSettings) setStoreSettings(data.settings);
      }
      const store = useAppStore.getState();
      if (data.clients && (store as any).setClients) (store as any).setClients(data.clients);
      if (data.devis && (store as any).setDevis) (store as any).setDevis(data.devis);
      showMessage('Données importées avec succès');
    } catch {
      showMessage('Fichier invalide ou corrompu', 'error');
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (!window.confirm('Êtes-vous sûr ? Cette action est irréversible.')) return;
    try {
      const store = useAppStore.getState();
      if ((store as any).resetStore) {
        (store as any).resetStore();
        showMessage('Base de données réinitialisée');
      } else {
        showMessage('Action de réinitialisation introuvable dans le store', 'error');
      }
    } catch {
      showMessage('Erreur lors de la réinitialisation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-foreground/50 text-sm animate-pulse">Chargement des paramètres…</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-foreground/60 mt-2">
          Gérez les paramètres de votre entreprise et de l&apos;application
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === 'error'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          {message}
        </div>
      )}

      {/* Company Settings */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          Informations de l&apos;entreprise
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="companyAddress">Adresse</Label>
            <Input
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
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
            <Label htmlFor="defaultSignature">Signature par défaut</Label>
            <Input
              id="defaultSignature"
              value={formData.defaultSignature}
              onChange={(e) => setFormData({ ...formData, defaultSignature: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="taxLabel">Étiquette fiscale</Label>
              <Input
                id="taxLabel"
                value={formData.taxLabel}
                onChange={(e) => setFormData({ ...formData, taxLabel: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 w-full"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </form>
      </div>

      {/* Data Management */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Gestion des données</h2>
        <div className="space-y-3">
          <Button
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Exporter les données
          </Button>
          <Button
            type="button"
            onClick={handleImportClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
          >
            <FiUpload className="w-4 h-4" />
            Importer les données
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-lg border border-destructive/30 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Zone de danger</h2>
            <p className="text-foreground/60 text-sm mt-1">
              Réinitialiser la base de données supprimera toutes les données
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleReset}
          className="w-full bg-destructive hover:bg-destructive/90"
        >
          Réinitialiser la base de données
        </Button>
      </div>
    </div>
  );
}