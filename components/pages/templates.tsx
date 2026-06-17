'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';

export function TemplatesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    introduction: '',
    serviceBlocks: [] as any[],
    signatureName: '',
    companyName: '',
  });

  const templates = useAppStore((state) => state.templates);
  const addTemplate = useAppStore((state) => state.addTemplate);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateTemplate(editingId, formData);
      setEditingId(null);
    } else {
      await addTemplate(formData as any);
    }
    setFormData({
      title: '',
      introduction: '',
      serviceBlocks: [],
      signatureName: '',
      companyName: '',
    });
    setShowForm(false);
  };

  const handleEdit = (template: any) => {
    setFormData(template);
    setEditingId(template.id);
    setShowForm(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modèles</h1>
          <p className="text-foreground/60 mt-2">{templates.length} modèle{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  title: '',
                  introduction: '',
                  serviceBlocks: [],
                  signatureName: '',
                  companyName: '',
                });
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <FiPlus className="mr-2 w-4 h-4" />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier' : 'Créer'} un modèle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
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
              <div>
                <Label htmlFor="signatureName">Signature</Label>
                <Input
                  id="signatureName"
                  value={formData.signatureName}
                  onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {templates.length > 0 ? (
          <div className="divide-y divide-border">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{template.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1">{template.companyName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
                          deleteTemplate(template.id);
                        }
                      }}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-foreground/70 line-clamp-2">{template.introduction}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-foreground/60">Aucun modèle pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
