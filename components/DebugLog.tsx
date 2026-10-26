import { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLogs, clearLogs } from '../services/geofenceService';

export default function DebugLog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const load = useCallback(async () => setLogs(await getLogs()), []);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.heading}>Geofence log</Text>
        <ScrollView style={styles.scroll}>
          {logs.length === 0 && <Text style={styles.line}>Nema zapisa.</Text>}
          {logs.map((l, i) => <Text key={i} style={styles.line}>{l}</Text>)}
        </ScrollView>
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={load}><Text>Osvježi</Text></Pressable>
          <Pressable style={styles.btn} onPress={async () => { await clearLogs(); load(); }}><Text>Obriši</Text></Pressable>
          <Pressable style={styles.btn} onPress={onClose}><Text>Zatvori</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  scroll: { flex: 1 },
  line: { fontSize: 13, marginBottom: 6, color: '#222' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#eee' },
});