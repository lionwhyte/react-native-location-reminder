import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const RADIUS_OPTIONS = [100, 200, 500, 1000]; // meters

type Props = {
  visible: boolean;
  onCancel: () => void;
  onSave: (title: string, note: string, radius: number) => void;
};

export default function ReminderModal({ visible, onCancel, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [radius, setRadius] = useState(200);

  // Reset the form every time the modal opens
  useEffect(() => {
    if (visible) {
      setTitle('');
      setNote('');
      setRadius(200);
    }
  }, [visible]);

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(title.trim(), note.trim(), radius);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdropTouch} onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.heading}>New reminder</Text>

          <Text style={styles.label}>What do you need to do?</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Buy milk"
            placeholderTextColor="#999"
            autoFocus
            returnKeyType="next"
          />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Extra details"
            placeholderTextColor="#999"
            multiline
          />

          <Text style={styles.label}>Trigger radius</Text>
          <View style={styles.chips}>
            {RADIUS_OPTIONS.map(r => {
              const selected = r === radius;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRadius(r)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.save, !canSave && styles.saveDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
  },
  noteInput: { minHeight: 64, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancel: { backgroundColor: '#f0f0f0' },
  cancelText: { fontWeight: '600', color: '#333' },
  save: { backgroundColor: '#007AFF' },
  saveDisabled: { opacity: 0.4 },
  saveText: { fontWeight: '600', color: '#fff' },
});