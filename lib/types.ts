export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
}

export interface ServiceBlock {
  id: string;
  title: string;
  content: string;
  preset: boolean;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
}

export interface Devis {
  id: string;
  number: string;
  clientId: string;
  date: string;
  emailDate: string;
  subject: string;
  introduction: string;
  workItems: WorkItem[];
  premises: string;
  amount: string;
  taxLabel: string;
  taxPercentage: number; // Always 19% for TVA
  taxes: string;
  ttc: string;
  signatureName: string;
  companyName: string;
  status: 'draft' | 'sent' | 'approved' | 'printed';
  createdAt: number;
  updatedAt: number;
  templateId?: string;
}

export interface Template {
  id: string;
  title: string;
  introduction: string;
  serviceBlocks: ServiceBlock[];
  signatureName: string;
  companyName: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  companyName: string;
  companyAddress: string;
  phone: string;
  email: string;
  defaultSignature: string;
  currency: string;
  taxLabel: string;
  taxPercentage: number; // Default TVA percentage (19%)
  darkMode: boolean;
  compactMode: boolean;
  logoUrl?: string;
  stampUrl?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  companyName: 'Entreprise de Dératisation',
  companyAddress: '123 Rue de la Paix, Tunis',
  phone: '+216 71 234 567',
  email: 'contact@deratisation.tn',
  defaultSignature: 'Fayçal Jelloul',
  currency: 'DT',
  taxLabel: 'TVA',
  taxPercentage: 19,
  darkMode: false,
  compactMode: false,
};

export const PRESET_BLOCKS: ServiceBlock[] = [
  {
    id: 'derat',
    title: 'Dératisation',
    preset: true,
    content: `→ La Dératisation: Lutte radicale contre les rongeurs (rats, souris), et la prévention de la réinfestation sur toute l'étendue de l'établissement:
* Pré-Appatage qui consiste au dépistage des traces des rongeurs, de l'identification de leurs espèces et la formulation de produit de lutte adéquat
* L'appatage qui consiste à l'organisation de l'attaque par la pose d'appâts empoisonnés dans des postes raticides implantés dans les passages, cachettes et endroits fréquentés par les rongeurs
* Entretien de l'appatage qui consiste à l'entretien de la compagne d'attaque par continuité de l'action jusqu'à disparition total des traces de rats ou de souris, en vue d'éviter d'éventuelle réinfestations des bâtiments curés`,
  },
  {
    id: 'desinsect',
    title: 'Désinsectisation',
    preset: true,
    content: `→ La Désinsectisation: Lutte contre les insectes (moustiques, puces punaises, fourmis..), nuisibles ou gênant aux stades larvaires et adultes si par la diffusion d'insecticides ou de larvicides adaptés.`,
  },
  {
    id: 'decaf',
    title: 'Décafarisation',
    preset: true,
    content: `→ La Décafarisation: Lutte nécessaire contre les blattes en traitant la totalité des lieux.`,
  },
  {
    id: 'chat',
    title: 'Capture des chats',
    preset: true,
    content: `→ Capture des chats`,
  },
];
