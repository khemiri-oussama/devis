'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { PRESET_BLOCKS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DevisPreview, MONTHS, buildDefaultMonthlyPassages, MonthlyPassage, ContractType } from './preview';
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

  const DEFAULT_SUBJECT = "A l'attention de Monsieur Le Directeur Géneral";
  const DEFAULT_INTRODUCTION =
    'introduction techniques et interventions visant à éliminer ou à contrôler les populations de rats et de souris dans les habitations, les locaux professionnels et les espaces publics. Ces rongeurs peuvent causer d’importants dégâts matériels, contaminer les denrées alimentaires et transmettre certaines maladies. Une dératisation efficace permet de protéger la santé des occupants, de préserver les biens et d’assurer un environnement sain et sécurisé.';

  // Build the initial form state by merging `devis` (if it already exists
  // in the store — e.g. the app pre-creates a blank row before opening
  // this editor) with our defaults on a FIELD-BY-FIELD basis, rather than
  // `devis || {...defaults}`. With the old all-or-nothing version, any
  // pre-created devis row (even one with empty/blank subject and
  // introduction) was truthy, so the whole defaults object was skipped
  // and the blank strings from the DB won. This way a blank/missing
  // subject or introduction still falls back to the default text, while
  // any real saved content on an existing devis is left untouched.
  const initialFormData = {
    clientId: devis?.clientId ?? '',
    date: devis?.date ?? new Date().toISOString().split('T')[0],
    emailDate: devis?.emailDate ?? new Date().toISOString().split('T')[0],
    subject: devis?.subject?.trim() ? devis.subject : DEFAULT_SUBJECT,
    introduction: devis?.introduction?.trim() ? devis.introduction : DEFAULT_INTRODUCTION,
    workItems: devis?.workItems ?? [],
    premises: devis?.premises ?? '',
    amount: devis?.amount ?? '',
    taxLabel: (devis as any)?.taxLabel ?? settings.taxLabel,
    taxes: devis?.taxes ?? '0',
    ttc: devis?.ttc ?? settings.currency,
    signatureName: devis?.signatureName ?? settings.defaultSignature,
    companyName: (devis as any)?.companyName ?? settings.companyName,
    number: devis?.number ?? '',
    status: devis?.status ?? ('draft' as const),
    // Tax mode — defaults to 'ht' (no TVA line, total = HT). The toggle
    // below still lets the user switch to 'ttc' (adds 19% TVA) if needed.
    taxMode: ((devis as any)?.taxMode ?? 'ht') as 'ttc' | 'ht',
    // Contract type — 'monthly' shows the 12-month passages table,
    // 'oneoff' shows a single "number of passages" field instead.
    contractType: ((devis as any)?.contractType ?? 'monthly') as ContractType,
    // Monthly passages: fixed 12-row table (Jan→Dec), single shared price
    // per passage across all months. Only used when contractType='monthly'.
    monthlyPassages: ((devis as any)?.monthlyPassages ?? buildDefaultMonthlyPassages()) as MonthlyPassage[],
    // Flat passage count for a one-off job. Only used when
    // contractType='oneoff'. Defaults to 1 (a single visit).
    oneoffPassageCount: (devis as any)?.oneoffPassageCount ?? 1,
    passageUnitPrice: (devis as any)?.passageUnitPrice ?? '', // shared price applied to every passage, every month
  };

  const [formData, setFormData] = useState(initialFormData);

  // Handles the case where `devis` isn't in the store yet on first render
  // (e.g. it's still being fetched) and only arrives a moment later. The
  // useState initializer above only ever runs once, so if `devis` shows
  // up AFTER mount, formData would otherwise keep showing the hardcoded
  // defaults even after the real (blank) row loads — fine for a brand
  // new devis, but wrong if the row turns out to already have saved
  // content. This effect applies the same field-by-field merge once,
  // the first time `devis` becomes available, without overwriting
  // anything the user may have already started typing in fields that
  // aren't blank/default.
  const hasSyncedFromStore = useRef(false);
  useEffect(() => {
    if (!devis || hasSyncedFromStore.current) return;
    hasSyncedFromStore.current = true;

    setFormData((prev: any) => ({
      ...prev,
      clientId: devis.clientId || prev.clientId,
      date: devis.date || prev.date,
      emailDate: devis.emailDate || prev.emailDate,
      subject: devis.subject?.trim() ? devis.subject : prev.subject,
      introduction: devis.introduction?.trim() ? devis.introduction : prev.introduction,
      workItems: devis.workItems?.length ? devis.workItems : prev.workItems,
      premises: devis.premises || prev.premises,
      amount: devis.amount || prev.amount,
      taxes: devis.taxes || prev.taxes,
      ttc: devis.ttc || prev.ttc,
      signatureName: devis.signatureName || prev.signatureName,
      number: devis.number || prev.number,
      status: devis.status || prev.status,
      taxMode: (devis as any).taxMode || prev.taxMode,
      contractType: (devis as any).contractType || prev.contractType,
      monthlyPassages: (devis as any).monthlyPassages ?? prev.monthlyPassages,
      oneoffPassageCount: (devis as any).oneoffPassageCount ?? prev.oneoffPassageCount,
      passageUnitPrice: (devis as any).passageUnitPrice || prev.passageUnitPrice,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devis]);

  const [saving, setSaving] = useState(false);

  const taxMode = (formData as any).taxMode ?? 'ht';
  const contractType: ContractType = (formData as any).contractType ?? 'monthly';
  const isOneOff = contractType === 'oneoff';
  const monthlyPassages: MonthlyPassage[] =
    (formData as any).monthlyPassages ?? buildDefaultMonthlyPassages();
  const oneoffPassageCount: number = (formData as any).oneoffPassageCount ?? 1;
  const passageUnitPrice: string = (formData as any).passageUnitPrice ?? '';

  // Central place that recomputes amount/taxes/ttc whenever any pricing
  // input changes: tax mode, contract type, a month's passage count, the
  // one-off passage count, or the unit price.
  const recalcTotals = (overrides: Partial<typeof formData> = {}) => {
    const merged: any = { ...formData, ...overrides };
    const mode = merged.taxMode ?? 'ht';
    const type: ContractType = merged.contractType ?? 'monthly';
    const months: MonthlyPassage[] = merged.monthlyPassages ?? buildDefaultMonthlyPassages();
    const oneoffCount = Number(merged.oneoffPassageCount) || 0;
    const unit = parseFloat(merged.passageUnitPrice) || 0;

    const totalPassages =
      type === 'oneoff'
        ? oneoffCount
        : months.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
    const baseAmount = unit * totalPassages;

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

  const handleContractTypeChange = (type: ContractType) => {
    setFormData(recalcTotals({ contractType: type }));
  };

  const handleMonthCountChange = (index: number, value: string) => {
    const count = Math.max(0, parseInt(value) || 0);
    const next = monthlyPassages.map((m, i) => (i === index ? { ...m, count } : m));
    setFormData(recalcTotals({ monthlyPassages: next }));
  };

  const handleOneoffCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(0, parseInt(e.target.value) || 0);
    setFormData(recalcTotals({ oneoffPassageCount: count }));
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(recalcTotals({ passageUnitPrice: e.target.value }));
  };

  const totalPassages = isOneOff
    ? Number(oneoffPassageCount) || 0
    : monthlyPassages.reduce((sum, m) => sum + (Number(m.count) || 0), 0);

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

              {/* Tax Mode + Monthly Passages Section */}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-semibold text-foreground">Tarification</h3>

                {/* TVA / HT toggle — defaults to HT, switchable to TVA */}
                <div>
                  <Label>Mode de taxation</Label>
                  <div className="mt-1 flex gap-2">
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
                  </div>
                </div>

                {/* Monthly contract / one-off job toggle */}
                <div>
                  <Label>Type de contrat</Label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleContractTypeChange('monthly')}
                      className={`flex-1 p-2 rounded-md border text-sm font-medium transition-colors ${
                        contractType === 'monthly'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-input'
                      }`}
                    >
                      Contrat mensuel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContractTypeChange('oneoff')}
                      className={`flex-1 p-2 rounded-md border text-sm font-medium transition-colors ${
                        contractType === 'oneoff'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-input'
                      }`}
                    >
                      Intervention unique
                    </button>
                  </div>
                </div>

                {/* Shared price per passage, applies across all months
                    (or to the single one-off count) */}
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

                {isOneOff ? (
                  /* One-off job: a single passage count, no month breakdown */
                  <div>
                    <Label htmlFor="oneoffPassageCount">Nombre de passages</Label>
                    <Input
                      id="oneoffPassageCount"
                      type="number"
                      min={0}
                      step="1"
                      value={oneoffPassageCount}
                      onChange={handleOneoffCountChange}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  /* Recurring contract: fixed 12-month passages table */
                  <div>
                    <Label>Nombre de passages par mois</Label>
                    <div className="mt-1 border border-border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {MONTHS.map((month, idx) => (
                            <tr
                              key={month}
                              className={idx < MONTHS.length - 1 ? 'border-b border-border' : ''}
                            >
                              <td className="px-3 py-2 text-foreground/80 w-1/2">{month}</td>
                              <td className="px-3 py-1.5 w-1/2">
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  value={monthlyPassages[idx]?.count ?? 0}
                                  onChange={(e) => handleMonthCountChange(idx, e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-foreground/50 mt-2">
                      Total: {totalPassages} passage{totalPassages > 1 ? 's' : ''} sur l&apos;année
                    </p>
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
                  Le montant est calculé automatiquement à partir du{' '}
                  {isOneOff ? 'nombre de passages' : 'nombre total de passages (toute l\'année)'} et du prix par passage.
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