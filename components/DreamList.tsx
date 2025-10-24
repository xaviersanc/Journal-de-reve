// components/DreamList.tsx
import { Text as ThemedText } from '@/components/Themed';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
    Button,
    Card,
    Checkbox,
    Chip,
    Divider,
    Modal,
    Portal,
    SegmentedButtons,
    TextInput,
} from 'react-native-paper';

const fmtDate = (iso?: string) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { date, time };
};
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

const typeLabel = (t?: DreamData['dreamType'], isLucid?: boolean) => {
  if (t === 'lucid' || isLucid) return 'Rêve lucide';
  if (t === 'nightmare') return 'Cauchemar';
  if (t === 'pleasant') return 'Rêve agréable';
  return '—';
};

const deriveTitle = (title?: string, text?: string) => {
  if (title && title.trim()) return title.trim();
  const raw = (text || '').trim().split('\n')[0];
  return raw.length > 0 ? (raw.length > 80 ? raw.slice(0, 80) + '…' : raw) : 'Sans titre';
};

const sanitizeTag = (raw: string) => raw.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();

export default function DreamList() {
  // Liste
  const [data, setData] = useState<DreamData[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const arr = await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey);
      setData(Array.isArray(arr) ? [...arr].reverse() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Éditeur (tous les champs)
  const [editorVisible, setEditorVisible] = useState(false);
  const [uiIndex, setUiIndex] = useState<number | null>(null);

  const [edTitle, setEdTitle] = useState('');
  const [edCharacter, setEdCharacter] = useState('');
  const [edLocation, setEdLocation] = useState('');
  const [edText, setEdText] = useState('');
  const [edType, setEdType] = useState<'lucid' | 'nightmare' | 'pleasant' | undefined>(undefined);
  const [edIsFav, setEdIsFav] = useState<boolean>(false);
  const [edIntensity, setEdIntensity] = useState<number>(5);
  const [edQuality, setEdQuality] = useState<number>(5);
  const [edTags, setEdTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const dateDisplay = formatDate(dateObj);
  const timeDisplay = formatTime(dateObj);

  const openEditor = (item: DreamData, indexInUI: number) => {
    setUiIndex(indexInUI);
    setEdTitle(item.title || '');
    setEdCharacter(item.character || '');
    setEdLocation((item as any).location || ''); // compat si non typé dans l’interface
    setEdText(item.dreamText || '');
    setEdType(item.dreamType || (item.isLucidDream ? 'lucid' : undefined));
    setEdIsFav(Boolean((item as any).favorite));
    setEdIntensity(typeof (item as any).intensity === 'number' ? (item as any).intensity : 5);
    setEdQuality(typeof (item as any).qualityDream === 'number' ? (item as any).qualityDream : 5);
    setEdTags(item.tags || []);
    setTagInput('');

    // date/time
    if (item.dateISO) setDateObj(new Date(item.dateISO));
    else setDateObj(new Date());
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setUiIndex(null);
    setTagInput('');
  };

  const addTag = () => {
    if (edTags.length >= 3) return;
    const t = sanitizeTag(tagInput);
    if (!t) return;
    if (edTags.includes(t)) return;
    setEdTags((prev) => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setEdTags((prev) => prev.filter((x) => x !== t));

  const onChangeDate = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (!selected) return;
    const merged = new Date(dateObj);
    merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDateObj(merged);
  };
  const onChangeTime = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (!selected) return;
    const merged = new Date(dateObj);
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDateObj(merged);
  };

  // Map index affiché -> index stockage (car data est reversed)
  const getStorageIndex = async (indexInUI: number) => {
    const arr = await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey);
    const len = Array.isArray(arr) ? arr.length : 0;
    return len - 1 - indexInUI;
  };

  const saveEdits = async () => {
    if (uiIndex === null) return;
    const storageIdx = await getStorageIndex(uiIndex);
    const arr = (await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
    if (storageIdx < 0 || storageIdx >= arr.length) return;

    const prev = arr[storageIdx];
    const next: DreamData = {
      ...prev,
      title: edTitle || undefined,
      character: edCharacter || undefined,
      dreamText: edText,
      dreamType: edType,
      isLucidDream: edType ? edType === 'lucid' : prev.isLucidDream,
      tags: edTags.length ? edTags : undefined,
      // champs supplémentaires
      ...(edLocation ? { location: edLocation } : {}),
      favorite: edIsFav,
      intensity: edIntensity,
      qualityDream: edQuality,
      dateISO: dateObj.toISOString(),
      dateDisplay: formatDate(dateObj),
      timeDisplay: formatTime(dateObj),
    } as any;

    arr[storageIdx] = next;
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, arr);
    await load();
    closeEditor();
  };

  const deleteDream = async () => {
    if (uiIndex === null) return;
    const storageIdx = await getStorageIndex(uiIndex);
    const arr = (await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
    if (storageIdx < 0 || storageIdx >= arr.length) return;
    arr.splice(storageIdx, 1);
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, arr);
    await load();
    closeEditor();
  };

  const renderItem = ({ item, index }: { item: DreamData; index: number }) => {
    const { date, time } =
      item.dateDisplay && item.timeDisplay ? { date: item.dateDisplay, time: item.timeDisplay } : fmtDate(item.dateISO);
    const tLabel = typeLabel(item.dreamType, item.isLucidDream);
    const title = deriveTitle(item.title, item.dreamText);

    return (
      <Card style={styles.card} mode="contained" onPress={() => openEditor(item, index)}>
        <Card.Content style={{ paddingBottom: 8 }}>
          <View style={styles.row}>
            <ThemedText style={styles.dateText}>
              {date || '—'} {time ? `• ${time}` : ''}
            </ThemedText>
            <Chip mode="flat" compact>{tLabel}</Chip>
          </View>

          <ThemedText style={styles.title}>{title}</ThemedText>

          <Divider style={styles.divider} />

          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionLabel}>Personnes</ThemedText>
            <View style={styles.wrapRow}>
              {(item as any).character && (item as any).character.trim().length > 0
                ? <Chip compact style={styles.chip}>{(item as any).character.trim()}</Chip>
                : <ThemedText style={styles.placeholder}>Aucune</ThemedText>}
            </View>
          </View>

          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionLabel}>Description</ThemedText>
            <ThemedText style={styles.descText} numberOfLines={4} ellipsizeMode="tail">
              {item.dreamText || '—'}
            </ThemedText>
          </View>

          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionLabel}>Tags</ThemedText>
            <View style={styles.wrapRow}>
              {(item.tags || []).length > 0
                ? item.tags!.map((t) => <Chip key={t} compact style={styles.chip}>#{t}</Chip>)
                : <ThemedText style={styles.placeholder}>Aucun</ThemedText>}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText>Aucun rêve enregistré</ThemedText>
          </View>
        }
      />

      {/* Modal éditeur complet */}
      <Portal>
        <Modal visible={editorVisible} onDismiss={closeEditor} contentContainerStyle={styles.modalContainer}>
          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={24}
            extraHeight={Platform.OS === 'android' ? 80 : 0}
            keyboardOpeningTime={0}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            enableAutomaticScroll
          >
            <ThemedText style={styles.modalTitle}>Éditer le rêve</ThemedText>

            {/* Date / Heure */}
            <View style={styles.row}>
              <TextInput
                label="Date"
                value={dateDisplay}
                mode="flat"
                editable={false}
                onPressIn={() => setShowDatePicker(true)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                style={[styles.half, { marginRight: 8 }]}
              />
              <TextInput
                label="Heure"
                value={timeDisplay}
                mode="flat"
                editable={false}
                onPressIn={() => setShowTimePicker(true)}
                right={<TextInput.Icon icon="clock-outline" onPress={() => setShowTimePicker(true)} />}
                style={styles.half}
              />
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onChangeDate}
                locale="fr-FR"
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={dateObj}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
                locale="fr-FR"
                is24Hour
              />
            )}

            {/* Titre */}
            <TextInput label="Titre" value={edTitle} onChangeText={setEdTitle} mode="flat" style={styles.mb12} />

            {/* Personnes / Lieu */}
            <TextInput label="Personnes" value={edCharacter} onChangeText={setEdCharacter} mode="flat" style={styles.mb12} />
            <TextInput label="Lieu" value={edLocation} onChangeText={setEdLocation} mode="flat" style={styles.mb12} />

            {/* Type de rêve */}
            <SegmentedButtons
              value={edType}
              onValueChange={(v) => setEdType(v as 'lucid' | 'nightmare' | 'pleasant' | undefined)}
              buttons={[
                { value: 'lucid', label: 'Rêve lucide' },
                { value: 'nightmare', label: 'Cauchemar' },
                { value: 'pleasant', label: 'Rêve agréable' },
              ]}
              style={styles.mb12}
            />

            {/* Intensité / Qualité */}
            <View style={styles.row}>
              <View style={[styles.sliderHalf, { marginRight: 8 }]}>
                <ThemedText style={styles.sliderLabel}>Intensity: {edIntensity}</ThemedText>
                <Slider value={edIntensity} minimumValue={0} maximumValue={10} step={1} onValueChange={setEdIntensity} />
              </View>
              <View style={styles.sliderHalf}>
                <ThemedText style={styles.sliderLabel}>Quality: {edQuality}</ThemedText>
                <Slider value={edQuality} minimumValue={0} maximumValue={10} step={1} onValueChange={setEdQuality} />
              </View>
            </View>

            {/* Favori */}
            <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
              <Checkbox.Item
                label="Ajouter aux favoris"
                status={edIsFav ? 'checked' : 'unchecked'}
                onPress={() => setEdIsFav((v) => !v)}
              />
            </View>

            {/* Description */}
            <TextInput
              label="Description du rêve"
              value={edText}
              onChangeText={setEdText}
              mode="flat"
              multiline
              numberOfLines={6}
              style={styles.mb12}
            />

            {/* Tags */}
            <ThemedText style={styles.sectionLabel}>Tags (3 max)</ThemedText>
            <View style={[styles.wrapRow, styles.mb8]}>
              {edTags.map((t) => (
                <Chip key={t} onClose={() => removeTag(t)} compact style={styles.chip}>
                  #{t}
                </Chip>
              ))}
            </View>
            <TextInput
              label="Ajouter un tag"
              value={tagInput}
              onChangeText={setTagInput}
              mode="flat"
              right={
                <TextInput.Icon icon="plus" onPress={addTag} disabled={edTags.length >= 3 || !sanitizeTag(tagInput)} />
              }
              onSubmitEditing={addTag}
              disabled={edTags.length >= 3}
              style={styles.mb16}
            />

            {/* Actions */}
            <View style={styles.rowBetween}>
              <Button mode="contained" onPress={saveEdits}>
                Enregistrer
              </Button>
              <Button mode="contained" onPress={deleteDream} style={styles.deleteBtn} textColor="#fff">
                Supprimer le rêve
              </Button>
            </View>
          </KeyboardAwareScrollView>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 12, opacity: 0.8 },
  title: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  divider: { marginVertical: 10, opacity: 0.5 },
  sectionRow: { marginTop: 6 },
  sectionLabel: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginRight: 6, marginBottom: 6 },
  placeholder: { fontSize: 12, opacity: 0.6 },
  descText: { fontSize: 13, lineHeight: 18, opacity: 0.9 },
  empty: { padding: 24, alignItems: 'center' },

  // Modal / Éditeur
  modalContainer: {
    margin: 12,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,1)',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { backgroundColor: '#d32f2f' },
  half: { flex: 1 },
  sliderHalf: { flex: 1 },
  sliderLabel: { marginBottom: 4, fontSize: 12 },
});
