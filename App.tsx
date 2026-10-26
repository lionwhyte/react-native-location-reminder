import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReminders } from './hooks/useReminders';
import { Reminder, requestPermissions } from './services/geofenceService';
import ReminderModal from './components/ReminderModal';
import ReminderList from './components/ReminderList';
import DebugLog from './components/DebugLog';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
});

type Tab = 'map' | 'list';

function Main() {
  const { reminders, add, remove, toggle } = useReminders();
  const [tab, setTab] = useState<Tab>('map');
  const [pending, setPending] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => { requestPermissions(); }, []);

  const showOnMap = (r: Reminder) => {
    setTab('map');
    mapRef.current?.animateToRegion(
      { latitude: r.latitude, longitude: r.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      500
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          onLongPress={e => setPending(e.nativeEvent.coordinate)}
        >
          {reminders.map(r => (
            <View key={r.id}>
              <Marker coordinate={r} title={r.title} opacity={r.active ? 1 : 0.5} />
              <Circle
                center={r}
                radius={r.radius}
                fillColor={r.active ? 'rgba(0,122,255,0.15)' : 'rgba(128,128,128,0.12)'}
                strokeColor={r.active ? 'rgba(0,122,255,0.6)' : 'rgba(128,128,128,0.5)'}
              />
            </View>
          ))}
        </MapView>

        {tab === 'list' && (
          <View style={StyleSheet.absoluteFill}>
            <ReminderList
              reminders={reminders}
              onToggle={toggle}
              onDelete={remove}
              onSelect={showOnMap}
            />
          </View>
        )}
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {(['map', 'list'] as Tab[]).map(t => (
          <Pressable key={t} style={styles.tab} onPress={() => setTab(t)} onLongPress={t === 'list' ? () => setShowDebug(true) : undefined}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'map' ? 'Map' : `List (${reminders.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ReminderModal
        visible={!!pending}
        onCancel={() => setPending(null)}
        onSave={(title, note, radius) => {
          add({ title, note, radius, ...pending! });
          setPending(null);
        }}
      />
      <DebugLog visible={showDebug} onClose={() => setShowDebug(false)} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  map: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
});