# Gestionnaire de Devis Pro

Une application web moderne, offline-first pour créer et gérer les devis professionnels pour une entreprise de dératisation.

## Fonctionnalités

### 📋 Gestion des Devis
- Créer, éditer et supprimer des devis
- Numérotation automatique
- Statuts: Brouillon, Envoyé, Approuvé, Imprimé
- Duplication facile de devis existants
- Aperçu en direct pendant l'édition
- Blocs de texte préétablis (Dératisation, Désinsectisation, Décafarisation, Capture des chats)

### 👥 Gestion des Clients
- Ajouter, modifier et supprimer des clients
- Informations complètes: nom, personne de contact, email, téléphone, adresse
- Recherche rapide des clients
- Historique des devis par client

### 📄 Export et Impression
- Aperçu HTML en direct dans l'interface
- Impression au format A4
- Export en PDF haute qualité
- Mise en page professionnelle

### 📁 Modèles
- Créer et gérer des modèles réutilisables
- Texte d'introduction standardisé
- Signature et informations entreprise par défaut

### ⚙️ Paramètres
- Configurer les informations de l'entreprise
- Devise et étiquette fiscale personnalisables
- Signature par défaut
- Import/export de données (sauvegarde JSON)
- Réinitialisation de la base de données

### 🔐 Offline-First
- Fonctionne complètement offline
- Données stockées localement avec Dexie (IndexedDB)
- Service Worker pour cache intelligent
- Synchronisation transparente quand la connexion revient

### 📱 Responsive
- Interface optimisée pour desktop et tablette
- Thème clair/sombre
- Mode compact disponible

## Architecture

### Stack Technique
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + shadcn/ui + Tailwind CSS v4
- **Base de données**: Dexie (IndexedDB)
- **État**: Zustand
- **Export PDF**: jsPDF + html2canvas
- **Icônes**: react-icons

### Structure des Fichiers
```
components/
├── pages/
│   ├── dashboard.tsx      # Tableau de bord
│   ├── devis.tsx          # Gestion des devis
│   ├── clients.tsx        # Gestion des clients
│   ├── templates.tsx      # Modèles
│   └── settings.tsx       # Paramètres
├── devis/
│   ├── editor.tsx         # Éditeur split-view
│   └── preview.tsx        # Aperçu et export
├── ui/                    # Composants shadcn/ui
├── sidebar.tsx            # Barre de navigation
├── app-provider.tsx       # Initialisation de l'app
└── sw-register.tsx        # Service Worker

lib/
├── types.ts               # TypeScript types
├── db.ts                  # Dexie setup
└── store.ts               # Zustand store

app/
├── layout.tsx             # Layout racine
├── page.tsx               # Page principale
├── globals.css            # Styles globaux
└── public/                # Assets statiques
```

## Installation

### Avec la CLI shadcn
```bash
npx shadcn-cli@latest create --preset --prompt
```

### Manuel avec npm/pnpm
```bash
# Cloner ou télécharger le projet
git clone <repo> devis-app
cd devis-app

# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev

# Ouvrir http://localhost:3000
```

## Utilisation

### 1. Configuration initiale
- Allez dans Paramètres
- Configurez les informations de votre entreprise
- Définissez la devise et l'étiquette fiscale

### 2. Ajouter des clients
- Cliquez sur "Clients"
- "Nouveau client"
- Remplissez les informations
- Cliquez sur "Ajouter"

### 3. Créer un devis
- Cliquez sur "Nouveau devis"
- Sélectionnez un client
- Remplissez la date et l'objet
- Ajoutez des éléments de travail (manuels ou blocs préétablis)
- Entrez le montant
- Cliquez sur "Sauvegarder"

### 4. Exporter/Imprimer
- Dans l'aperçu, cliquez sur "Imprimer" ou "Télécharger PDF"
- La mise en page est automatiquement optimisée pour A4

### 5. Sauvegarde
- Les données sont sauvegardées automatiquement
- Allez dans Paramètres pour exporter une sauvegarde JSON
- Importez la sauvegarde plus tard si nécessaire

## Données Persistantes

Toutes les données sont stockées localement dans IndexedDB via Dexie:
- Clients
- Devis
- Modèles
- Paramètres

Les données ne sont JAMAIS envoyées à un serveur.

## Offline-First

L'application fonctionne entièrement offline:
1. **Première visite**: Les assets (JS, CSS) sont mis en cache
2. **Données**: Stockées localement (IndexedDB)
3. **Service Worker**: Gère le cache intelligent
4. **PWA**: Peut être installée comme application

## Documents Exemple

Le fichier PDF fourni contient deux devis d'exemple pour la structure de document de référence.

## Développement

### Structure des pages
```typescript
// Chaque page suit le même pattern:
'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export function MyPage() {
  const data = useAppStore((state) => state.data);
  
  return (
    <div className="p-8 space-y-6">
      {/* Contenu */}
    </div>
  );
}
```

### Ajouter une nouvelle entité
1. Définir le type dans `lib/types.ts`
2. Ajouter la table Dexie dans `lib/db.ts`
3. Ajouter les actions dans `lib/store.ts`
4. Créer la page dans `components/pages/`

## Build pour production

```bash
pnpm build
pnpm start
```

## Support et Licence

Cette application est créée avec v0.app et est libre d'utilisation et de modification.

---

**Version**: 1.0  
**Dernière mise à jour**: 2026
