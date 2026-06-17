'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { PRESET_BLOCKS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DevisPreview } from './preview';
import { FiX, FiPlus, FiSave } from 'react-icons/fi';

interface DevisEditorProps {
  devisId: string;
  onClose: () => void;
}

export function DevisEditor({ devisId, onClose }: DevisEditorProps) {
  const devis = useAppStore((state) => state.devis.find((d) => d.id === devisId));
  const updateDevis = useAppStore((state) => state.updateDevis);
  const clients = useAppStore((state) => state.clients);
  const settings = useAppStore((state) => state.settings);
  const getClientById = useAppStore((state) => state.getClientById);

  const [formData, setFormData] = useState(devis || {
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    emailDate: new Date().toISOString().split('T')[0],
    subject: '',
    introduction: '',
    workItems: [],
    premises: '',
    amount: '',
    taxLabel: settings.taxLabel,
    taxes: '0',
    ttc: settings.currency,
    signatureName: settings.defaultSignature,
    companyName: settings.companyName,
    number: '',
    status: 'draft' as const,
    // NEW: tax mode — 'ttc' applies TVA, 'ht' is HT-only (no TVA line, total = HT)
    taxMode: 'ttc' as 'ttc' | 'ht',
    // NEW: passages (visits) pricing
    passageCount: 1,
    passageSamePrice: true,
    passageUnitPrice: '',          // used when passageSamePrice is true
    passagePrices: [] as string[], // used when passageSamePrice is false, one entry per passage
  });

  const [saving, setSaving] = useState(false);

  const taxMode = (formData as any).taxMode ?? 'ttc';
  const passageCount = (formData as any).passageCount ?? 1;
  const passageSamePrice = (formData as any).passageSamePrice ?? true;
  const passageUnitPrice = (formData as any).passageUnitPrice ?? '';
  const passagePrices: string[] = (formData as any).passagePrices ?? [];

  // Keep passagePrices array length in sync with passageCount whenever it changes,
  // preserving any prices already entered.
  useEffect(() => {
    if (!passageSamePrice) {
      setFormData((prev: any) => {
        const current: string[] = prev.passagePrices ?? [];
        const next = Array.from({ length: passageCount }, (_, i) => current[i] ?? '');
        return { ...prev, passagePrices: next };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageCount, passageSamePrice]);

  // Central place that recomputes amount/taxes/ttc whenever any pricing input changes:
  // tax mode, passage count, same/different price toggle, or any price value.
  const recalcTotals = (overrides: Partial<typeof formData> = {}) => {
    const merged: any = { ...formData, ...overrides };
    const mode = merged.taxMode ?? 'ttc';
    const count = merged.passageCount ?? 1;
    const same = merged.passageSamePrice ?? true;
    const unit = parseFloat(merged.passageUnitPrice) || 0;
    const prices: string[] = merged.passagePrices ?? [];

    let baseAmount = 0;
    if (same) {
      baseAmount = unit * count;
    } else {
      baseAmount = prices.reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
    }

    let taxes = 0;
    let ttc = baseAmount;
    if (mode === 'ttc') {
      taxes = baseAmount * 0.19;
      ttc = baseAmount + taxes;
    }

    return {
      ...merged,
      amount: baseAmount.toFixed(2),
      taxes: taxes.toFixed(2),
      ttc: ttc.toFixed(2),
      taxPercentage: mode === 'ttc' ? 19 : 0,
    };
  };

  const handleTaxModeChange = (mode: 'ttc' | 'ht') => {
    setFormData(recalcTotals({ taxMode: mode }));
  };

  const handlePassageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    setFormData(recalcTotals({ passageCount: count }));
  };

  const handleSamePriceToggle = (checked: boolean) => {
    setFormData(recalcTotals({ passageSamePrice: checked }));
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(recalcTotals({ passageUnitPrice: e.target.value }));
  };

  const handlePassagePriceChange = (index: number, value: string) => {
    const next = [...passagePrices];
    next[index] = value;
    setFormData(recalcTotals({ passagePrices: next }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDevis(devisId, formData);
    } finally {
      setSaving(false);
    }
  };

  const addWorkItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      title: '',
      description: '',
    };
    setFormData({
      ...formData,
      workItems: [...formData.workItems, newItem],
    });
  };

  const updateWorkItem = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      workItems: formData.workItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeWorkItem = (id: string) => {
    setFormData({
      ...formData,
      workItems: formData.workItems.filter((item) => item.id !== id),
    });
  };

  const addPresetBlock = (blockId: string) => {
    const preset = PRESET_BLOCKS.find((b) => b.id === blockId);
    if (preset) {
      const newItem = {
        id: `item_${Date.now()}`,
        title: preset.title,
        description: preset.content,
      };
      setFormData({
        ...formData,
        workItems: [...formData.workItems, newItem],
      });
    }
  };

  const client = getClientById(formData.clientId);

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      <div className="flex h-screen">
        {/* Editor Panel - 35% width */}
        <div className="w-[35%] overflow-y-auto border-r border-border bg-background">
          <div className="p-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">{devis?.number || 'Nouveau devis'}</h1>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  <FiSave className="mr-2 w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  <FiX className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-6">
              {/* Client */}
              <div>
                <Label htmlFor="clientId">Client</Label>
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="mt-1 w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date du devis</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emailDate">Date de l&apos;email</Label>
                  <Input
                    id="emailDate"
                    type="date"
                    value={formData.emailDate}
                    onChange={(e) => setFormData({ ...formData, emailDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Introduction */}
              <div>
                <Label htmlFor="introduction">Introduction</Label>
                <textarea
                  id="introduction"
                  value={formData.introduction}
                  onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                  className="mt-1 w-full p-2 border border-input rounded-md text-foreground bg-background"
                  rows={4}
                />
              </div>

              {/* Work Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Éléments de travail</Label>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addPresetBlock(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="text-sm p-1 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Ajouter un bloc...</option>
                      {PRESET_BLOCKS.map((block) => (
                        <option key={block.id} value={block.id}>
                          {block.title}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addWorkItem}
                    >
                      <FiPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {formData.workItems.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={item.title}
                          onChange={(e) => updateWorkItem(item.id, 'title', e.target.value)}
                          placeholder="Titre"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive ml-2"
                          onClick={() => removeWorkItem(item.id)}
                        >
                          <FiX className="w-4 h-4" />
                        </Button>
                      </div>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateWorkItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full p-2 border border-input rounded-md text-foreground bg-background text-sm"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Premises */}
              <div>
                <Label htmlFor="premises">Locaux à traiter</Label>
                <Input
                  id="premises"
                  value={formData.premises}
                  onChange={(e) => setFormData({ ...formData, premises: e.target.value })}
                  placeholder="Ex: Immeuble commercial, Résidence..."
                  className="mt-1"
                />
              </div>

              {/* Tax Mode + Passages Section */}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-semibold text-foreground">Tarification</h3>

                {/* TVA / HT toggle */}
                <div>
                  <Label>Mode de taxation</Label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTaxModeChange('ttc')}
                      className={`flex-1 p-2 rounded-md border text-sm font-medium transition-colors ${
                        taxMode === 'ttc'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-input'
                      }`}
                    >
                      Avec TVA (19%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTaxModeChange('ht')}
                      className={`flex-1 p-2 rounded-md border text-sm font-medium transition-colors ${
                        taxMode === 'ht'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-input'
                      }`}
                    >
                      H.T (sans TVA)
                    </button>
                  </div>
                </div>

                {/* Number of passages */}
                <div>
                  <Label htmlFor="passageCount">Nombre de passages</Label>
                  <Input
                    id="passageCount"
                    type="number"
                    min={1}
                    step="1"
                    value={passageCount}
                    onChange={handlePassageCountChange}
                    className="mt-1"
                  />
                </div>

                {/* Same price checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    id="passageSamePrice"
                    type="checkbox"
                    checked={passageSamePrice}
                    onChange={(e) => handleSamePriceToggle(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <Label htmlFor="passageSamePrice" className="cursor-pointer">
                    Tous les passages ont le même prix
                  </Label>
                </div>

                {/* Same price: single unit price input */}
                {passageSamePrice ? (
                  <div>
                    <Label htmlFor="passageUnitPrice">Prix par passage</Label>
                    <Input
                      id="passageUnitPrice"
                      type="number"
                      step="0.01"
                      value={passageUnitPrice}
                      onChange={handleUnitPriceChange}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  /* Different price per passage: one input per passage */
                  <div className="space-y-2">
                    <Label>Prix de chaque passage</Label>
                    {Array.from({ length: passageCount }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm text-foreground/60 w-20 flex-shrink-0">
                          Passage {idx + 1}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={passagePrices[idx] ?? ''}
                          onChange={(e) => handlePassagePriceChange(idx, e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount Section */}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-semibold text-foreground">Montant</h3>
                <div className={`grid gap-4 ${taxMode === 'ttc' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                  <div>
                    <Label htmlFor="amount">Montant H.T</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                  {taxMode === 'ttc' && (
                    <>
                      <div>
                        <Label htmlFor="taxes">TVA (19%)</Label>
                        <Input
                          id="taxes"
                          type="number"
                          step="0.01"
                          value={formData.taxes}
                          disabled
                          className="mt-1 bg-muted"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ttc">Montant TTC</Label>
                        <Input
                          id="ttc"
                          type="number"
                          step="0.01"
                          value={formData.ttc}
                          disabled
                          className="mt-1 bg-muted"
                        />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-foreground/50">
                  Le montant est calculé automatiquement à partir du nombre de passages et de leur(s) prix.
                </p>
              </div>

              {/* Signature */}
              <div>
                <Label htmlFor="signatureName">Signature</Label>
                <Input
                  id="signatureName"
                  value={formData.signatureName}
                  onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyé</option>
                  <option value="approved">Approuvé</option>
                  <option value="printed">Imprimé</option>
                </select>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Panel - 65% width */}
        <div className="w-[65%] overflow-y-auto bg-muted/50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-0 text-black" style={{ width: '210mm', minHeight: '297mm' }}>
            <DevisPreview devis={{ ...devis, ...formData } as any} showActions={true} />
          </div>
        </div>
      </div>
    </div>
  );
}