import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, STORAGE_KEY, syncGeofences } from '../services/geofenceService';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => raw && setReminders(JSON.parse(raw)));
  }, []);

  const persist = useCallback(async (next: Reminder[]) => {
    setReminders(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    await syncGeofences(next);
  }, []);

  const add = (r: Omit<Reminder, 'id' | 'active'>) =>
    persist([...reminders, { ...r, id: Date.now().toString(), active: true }]);
  const remove = (id: string) => persist(reminders.filter(r => r.id !== id));
  const toggle = (id: string) =>
    persist(reminders.map(r => (r.id === id ? { ...r, active: !r.active } : r)));

  return { reminders, add, remove, toggle };
}