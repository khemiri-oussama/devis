'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { getAllClients } from '@/app/actions/clients';
import { getAllDevis } from '@/app/actions/devis';
import { getUserSettings } from '@/app/actions/settings';

/**
 * AppProvider was previously a no-op:
 *
 *   export function AppProvider({ children }) { return children; }
 *
 * That meant the Zustand store (devis: [], clients: [], settings: {})
 * NEVER got hydrated from the database. The only way data ever appeared
 * in the UI was through optimistic local pushes inside create actions
 * (e.g. createClient pushing the new client directly into store state)
 * — which is why "it works when I create something, but nothing loads
 * otherwise."
 *
 * This component now fetches everything once on mount and populates the
 * store, then flips `isLoading` to false so AppContent renders normally.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const hasLoaded = useRef(false);

  // Try the most likely setter names for each slice. Adjust these to your
  // actual store.ts action names if any of them differ — search store.ts
  // for "set" + "Clients" / "Devis" / "Settings" to confirm.
  const setClients = useAppStore(
    (state) =>
      (state as any).setClients ??
      (state as any).loadClients ??
      (state as any).setClientsList ??
      null
  );
  const setDevis = useAppStore(
    (state) =>
      (state as any).setDevis ??
      (state as any).loadDevis ??
      (state as any).setDevisList ??
      null
  );
  const setSettings = useAppStore(
    (state) =>
      (state as any).setSettings ??
      (state as any).updateSettings ??
      (state as any).loadSettings ??
      null
  );
  const setIsLoading = useAppStore(
    (state) => (state as any).setIsLoading ?? null
  );

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    async function hydrate() {
      try {
        const [clientsData, devisData, settingsData] = await Promise.all([
          getAllClients().catch((err) => {
            console.error('Failed to load clients:', err);
            return [];
          }),
          getAllDevis().catch((err) => {
            console.error('Failed to load devis:', err);
            return [];
          }),
          getUserSettings().catch((err) => {
            console.error('Failed to load settings:', err);
            return null;
          }),
        ]);

        if (setClients) {
          setClients(clientsData);
        } else {
          console.error(
            '[AppProvider] No setClients/loadClients action found on the store — clients will not be populated. Check lib/store.ts for the correct action name.'
          );
        }

        if (setDevis) {
          setDevis(devisData);
        } else {
          console.error(
            '[AppProvider] No setDevis/loadDevis action found on the store — devis will not be populated. Check lib/store.ts for the correct action name.'
          );
        }

        if (settingsData && setSettings) {
          setSettings(settingsData);
        } else if (!setSettings) {
          console.error(
            '[AppProvider] No setSettings/updateSettings action found on the store — settings will not be populated. Check lib/store.ts for the correct action name.'
          );
        }
      } finally {
        // Always clear loading, even if something failed above, so the
        // app doesn't get stuck on the spinner forever.
        if (setIsLoading) {
          setIsLoading(false);
        } else {
          console.error(
            '[AppProvider] No setIsLoading action found on the store — isLoading flag will stay at whatever its initial value was. If the app is stuck on the loading spinner, check lib/store.ts for the correct action name and that isLoading defaults to true initially.'
          );
        }
      }
    }

    hydrate();
  }, [setClients, setDevis, setSettings, setIsLoading]);

  return children;
}