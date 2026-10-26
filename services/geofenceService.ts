import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GEOFENCE_TASK = 'LOCATION_REMINDER_GEOFENCE';
export const STORAGE_KEY = 'reminders';
const LOG_KEY = 'geofence_log';

export type Reminder = {
  id: string;
  title: string;
  note?: string;
  latitude: number;
  longitude: number;
  radius: number; // u metrima
  active: boolean;
};

// dodaje log poruku u AsyncStorage, čuva samo zadnjih 50 logova, koristi se za debugiranje geofence eventova
export async function appendLog(msg: string) {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const logs: string[] = raw ? JSON.parse(raw) : [];
    logs.unshift(`${new Date().toLocaleString('hr-HR')} - ${msg}`);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch {}
}

// dohvaća logove iz AsyncStorage, vraća ih kao niz stringova, ako nema logova vraća prazan niz
export async function getLogs(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(LOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

// briše sve logove iz AsyncStorage, koristi se za resetiranje logova
export const clearLogs = () => AsyncStorage.removeItem(LOG_KEY);

// Geofence task koji se izvršava kada korisnik uđe ili izađe iz geofence regije, koristi se GEOFENCE_TASK konstanta kao identifikator taska
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    await appendLog(`ERROR: ${error.message}`);
    return;
  }
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };
  const isEnter = eventType === Location.GeofencingEventType.Enter;
  await appendLog(`event ${isEnter ? 'ENTER' : 'EXIT'} region=${region.identifier}`);
  if (!isEnter) return;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const reminders: Reminder[] = raw ? JSON.parse(raw) : [];
  const reminder = reminders.find(r => r.id === region.identifier && r.active);
  if (!reminder) {
    await appendLog('nema aktivnog podsjetnika za ovu regiju');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: reminder.title, body: reminder.note ?? 'You are at your reminder location.' },
    trigger: { channelId: 'default' },
  });
  await appendLog(`obavijest poslana: ${reminder.title}`);
});

// inicijalizira geofence task, mora se pozvati na samom početku aplikacije da bi task bio registriran prije nego što se geofence eventovi počnu događati
export async function requestPermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync(); // mora biti always, inače geofence eventovi neće raditi u pozadini
  const notif = await Notifications.requestPermissionsAsync();
  return bg.status === 'granted' && notif.status === 'granted';
}

// sinkronizira geofenceove sa aktivnim podsjetnicima, registrira geofence task za sve aktivne podsjetnike, ako nema aktivnih podsjetnika zaustavlja geofence task
export async function syncGeofences(reminders: Reminder[]) {
  const active = reminders.filter(r => r.active);
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);

  if (active.length === 0) {
    if (running) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }
  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    active.map(r => ({
      identifier: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      notifyOnEnter: true,
      notifyOnExit: false,
    })) // pokriva sve aktivne podsjetnike, kreira geofence za svaki od njih, i registrira ih za geofencing task
  );
  await appendLog(`registrirano geofenceova: ${active.length}`);
}