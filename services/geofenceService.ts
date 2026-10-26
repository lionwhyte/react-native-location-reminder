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
  radius: number; // meters
  active: boolean;
};

export async function appendLog(msg: string) {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const logs: string[] = raw ? JSON.parse(raw) : [];
    logs.unshift(`${new Date().toLocaleString('hr-HR')} - ${msg}`);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch {}
}

export async function getLogs(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(LOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

export const clearLogs = () => AsyncStorage.removeItem(LOG_KEY);

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
    trigger: null,
  });
  await appendLog(`obavijest poslana: ${reminder.title}`);
});

export async function requestPermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync(); // must be "Always" / "Allow all the time"
  const notif = await Notifications.requestPermissionsAsync();
  return bg.status === 'granted' && notif.status === 'granted';
}

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
    }))
  );
  await appendLog(`registrirano geofenceova: ${active.length}`);
}