'use client';

import { create } from 'zustand';
import { Client, Devis, Template, Settings, DEFAULT_SETTINGS } from './types';
import { createClient, updateClientAction, deleteClientAction, getAllClients } from '@/app/actions/clients';
import { createDevis, updateDevisAction, deleteDevisAction, getAllDevis } from '@/app/actions/devis';

interface AppState {
  // Data
  clients: Client[];
  devis: Devis[];
  templates: Template[];
  settings: Settings;

  // UI State
  currentPage: 'dashboard' | 'devis' | 'clients' | 'templates' | 'settings';
  selectedDevisId?: string;
  selectedClientId?: string;
  isLoading: boolean;

  // Actions
  setCurrentPage: (page: AppState['currentPage']) => void;
  setSelectedDevisId: (id?: string) => void;
  setSelectedClientId: (id?: string) => void;
  setClients: (clients: Client[]) => void;
  setDevis: (devis: Devis[]) => void;
  setTemplates: (templates: Template[]) => void;
  setSettings: (settings: Settings) => void;
  setIsLoading: (loading: boolean) => void;

  // Client actions
  getClientById: (id: string) => Client | undefined;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  searchClients: (query: string) => Client[];
  loadClients: () => Promise<void>;

  // Devis actions
  getDevisById: (id: string) => Devis | undefined;
  addDevis: (devis: Omit<Devis, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDevis: (id: string, devis: Partial<Devis>) => Promise<void>;
  deleteDevis: (id: string) => Promise<void>;
  loadDevis: () => Promise<void>;

  // Template actions
  getTemplateById: (id: string) => Template | undefined;
}

const initialState = {
  clients: [],
  devis: [],
  templates: [],
  settings: DEFAULT_SETTINGS,
  currentPage: 'dashboard' as const,
  isLoading: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedDevisId: (id) => set({ selectedDevisId: id }),
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  setClients: (clients) => set({ clients }),
  setDevis: (devis) => set({ devis }),
  setTemplates: (templates) => set({ templates }),
  setSettings: (settings) => set({ settings }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  getClientById: (id) => {
    const { clients } = get();
    return clients.find((c) => c.id === id);
  },

  getDevisById: (id) => {
    const { devis } = get();
    return devis.find((d) => d.id === id);
  },

  getTemplateById: (id) => {
    const { templates } = get();
    return templates.find((t) => t.id === id);
  },

  // Client actions implementation
  addClient: async (clientData) => {
    try {
      console.log('[v0] Store addClient called with:', clientData);
      await createClient(clientData as any);
      console.log('[v0] Client created, loading clients...');
      await get().loadClients();
      console.log('[v0] Clients loaded successfully');
    } catch (error) {
      console.error('[v0] Error adding client:', error);
      throw error;
    }
  },

  updateClient: async (id, clientData) => {
    try {
      await updateClientAction(id, clientData as any);
      await get().loadClients();
    } catch (error) {
      console.error('[v0] Error updating client:', error);
      throw error;
    }
  },

  deleteClient: async (id) => {
    try {
      await deleteClientAction(id);
      await get().loadClients();
    } catch (error) {
      console.error('[v0] Error deleting client:', error);
      throw error;
    }
  },

  searchClients: (query) => {
    const { clients } = get();
    const lowerQuery = query.toLowerCase();
    return clients.filter((c) =>
      c.companyName.toLowerCase().includes(lowerQuery) ||
      c.contactPerson?.toLowerCase().includes(lowerQuery) ||
      c.email?.toLowerCase().includes(lowerQuery) ||
      c.phone?.includes(query)
    );
  },

  loadClients: async () => {
    try {
      console.log('[v0] loadClients called');
      const clients = await getAllClients();
      console.log('[v0] Loaded clients from server:', clients);
      set({ clients });
    } catch (error) {
      console.error('[v0] Error loading clients:', error);
    }
  },

  // Devis actions implementation
  addDevis: async (devisData) => {
    try {
      console.log('[v0] Store addDevis called with:', devisData);
      const id = await createDevis(devisData as any);
      console.log('[v0] Devis created with id:', id);
      await get().loadDevis();
      console.log('[v0] Devis loaded, returning id');
      return { id } as any;
    } catch (error) {
      console.error('[v0] Error adding devis:', error);
      throw error;
    }
  },

  updateDevis: async (id, devisData) => {
    try {
      await updateDevisAction(id, devisData as any);
      await get().loadDevis();
    } catch (error) {
      console.error('[v0] Error updating devis:', error);
      throw error;
    }
  },

  deleteDevis: async (id) => {
    try {
      await deleteDevisAction(id);
      await get().loadDevis();
    } catch (error) {
      console.error('[v0] Error deleting devis:', error);
      throw error;
    }
  },

  loadDevis: async () => {
    try {
      console.log('[v0] loadDevis called');
      const devis = await getAllDevis();
      console.log('[v0] Loaded devis from server:', devis);
      set({ devis });
    } catch (error) {
      console.error('[v0] Error loading devis:', error);
    }
  },

  duplicateDevis: async (id: string) => {
    try {
      const { devis: allDevis } = get();
      const original = allDevis.find((d) => d.id === id);
      if (!original) {
        throw new Error('Devis not found');
      }
      
      const newDevisData = {
        ...original,
        number: `${original.number} (copie)`,
      };
      
      const newId = await createDevis(newDevisData as any);
      await get().loadDevis();
      return { id: newId } as any;
    } catch (error) {
      console.error('[v0] Error duplicating devis:', error);
      throw error;
    }
  },

  searchDevis: (query: string) => {
    const { devis } = get();
    const lowerQuery = query.toLowerCase();
    return devis.filter((d) =>
      d.number.toLowerCase().includes(lowerQuery) ||
      d.subject?.toLowerCase().includes(lowerQuery) ||
      d.date?.includes(query)
    );
  },
}));
