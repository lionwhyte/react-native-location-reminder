import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, STORAGE_KEY, syncGeofences } from '../services/geofenceService';

// Custom hook za podržavanje podsjetnika, omogućuje dohvaćanje, dodavanje, brisanje i aktiviranje/deaktiviranje podsjetnika, te sinkronizaciju geofenceova sa aktivnim podsjetnicima
export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(async raw => {
      if (!raw) return;
      const list: Reminder[] = JSON.parse(raw);
      setReminders(list);
      try {
        await syncGeofences(list);
      } catch {
        // dozvole možda još nisu odobrene pri prvom pokretanju
      }
    });
  }, []);

  // funkcija za spremanje podsjetnika u AsyncStorage i sinkronizaciju geofenceova, koristi useCallback kako bi se izbjeglo ponovno kreiranje funkcije pri svakom renderu
  const persist = useCallback(async (next: Reminder[]) => {
    setReminders(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    await syncGeofences(next);
  }, []);

  // funkcije za dodavanje, brisanje i aktiviranje/deaktiviranje podsjetnika, koriste persist funkciju za spremanje promjena
  const add = (r: Omit<Reminder, 'id' | 'active'>) =>
    persist([...reminders, { ...r, id: Date.now().toString(), active: true }]);
  const remove = (id: string) => persist(reminders.filter(r => r.id !== id));
  const toggle = (id: string) =>
    persist(reminders.map(r => (r.id === id ? { ...r, active: !r.active } : r)));

  return { reminders, add, remove, toggle };
}