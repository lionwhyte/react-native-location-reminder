import {
  FlatList,
  View,
  Text,
  Switch,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Reminder } from '../services/geofenceService';

type Props = {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (reminder: Reminder) => void;
};

const formatRadius = (r: number) => (r >= 1000 ? `${r / 1000} km` : `${r} m`);

// Komponenta za prikaz liste podsjetnika, omogućuje pregled, aktiviranje/deaktiviranje i brisanje podsjetnika, te odabir podsjetnika za prikaz na mapi
export default function ReminderList({ reminders, onToggle, onDelete, onSelect }: Props) {
  const insets = useSafeAreaInsets();

  const confirmDelete = (r: Reminder) => {
    Alert.alert('Delete reminder', `Delete "${r.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(r.id) },
    ]);
  };

  // prvi element u listi je zadnji dodani podsjetnik, zato se lista reverzira da bi se prikazali najnoviji podsjetnici na vrhu
  const data = [...reminders].reverse();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.heading}>Reminders</Text>

      <FlatList
        data={data}
        keyExtractor={r => r.id}
        contentContainerStyle={data.length === 0 ? styles.emptyWrap : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptyText}>
              Long-press anywhere on the map to add your first one.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.active && styles.cardInactive]}
            onPress={() => onSelect(item)}
          >
            <View style={styles.cardText}>
              <Text style={[styles.title, !item.active && styles.dim]} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.note && (
                <Text style={[styles.note, !item.active && styles.dim]} numberOfLines={2}>
                  {item.note}
                </Text>
              )}
              <Text style={styles.meta}>Radius {formatRadius(item.radius)}</Text>
            </View>

            <View style={styles.controls}>
              <Switch value={item.active} onValueChange={() => onToggle(item.id)} />
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={10}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  heading: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyText: { color: '#666', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  cardInactive: { backgroundColor: '#ececec' },
  cardText: { flex: 1, paddingRight: 12 },
  title: { fontSize: 17, fontWeight: '600', color: '#111' },
  note: { fontSize: 14, color: '#555', marginTop: 2 },
  meta: { fontSize: 12, color: '#888', marginTop: 6 },
  dim: { color: '#999' },
  controls: { alignItems: 'center', gap: 8 },
  deleteBtn: { paddingVertical: 4 },
  deleteText: { color: '#d93025', fontWeight: '600', fontSize: 13 },
});