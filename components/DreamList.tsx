// components/DreamList.tsx
// Liste + éditeur de rêves (version compacte, commentée par blocs)

import { Text as ThemedText } from '@/components/Themed';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

/* ──────────────────────── Helpers format ──────────────────────── */
const fmtDate = (iso?: string) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d),
    time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
  };
};
const formatDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
const formatTime = (d: Date) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
const typeLabel = (t?: DreamData['dreamType'], isLucid?: boolean) =>
  t === 'lucid' || isLucid ? 'Rêve lucide' : t === 'nightmare' ? 'Cauchemar' : t === 'pleasant' ? 'Rêve agréable' : '—';
const deriveTitle = (title?: string, text?: string) => {
  if (title?.trim()) return title.trim();
  const raw = (text || '').trim().split('\n')[0];
  return raw ? (raw.length > 80 ? raw.slice(0, 80) + '…' : raw) : 'Sans titre';
};
const sanitizeTag = (raw: string) => raw.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();

/* ──────────────────────── Composant principal ──────────────────────── */
export default function DreamList() {
  /* ── Données liste ── */
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
  // Recharge les données à chaque fois que l’onglet écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /* ── État éditeur (groupé pour compacité) ── */
  type DreamType = 'lucid' | 'nightmare' | 'pleasant' | undefined;
  const [visible, setVisible] = useState(false);
  const [uiIndex, setUiIndex] = useState<number | null>(null);
  const [ed, setEd] = useState({
    title: '',
    character: '',
    location: '',
    text: '',
    type: undefined as DreamType,
    favorite: false,
    intensity: 5,
    quality: 5,
    tags: [] as string[],
  });
  const setF = <K extends keyof typeof ed>(k: K) => (v: (typeof ed)[K]) => setEd(s => ({ ...s, [k]: v }));

  /* ── Date / heure de l’éditeur ── */
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const dateDisplay = formatDate(dateObj);
  const timeDisplay = formatTime(dateObj);

  /* ── Ouvrir/fermer l’éditeur ── */
  const openEditor = (item: DreamData, indexInUI: number) => {
    setUiIndex(indexInUI);
    setEd({
      title: item.title || '',
      character: (item as any).character || '',
      location: (item as any).location || '',
      text: item.dreamText || '',
      type: item.dreamType || (item.isLucidDream ? 'lucid' : undefined),
      favorite: Boolean((item as any).favorite),
      intensity: typeof (item as any).intensity === 'number' ? (item as any).intensity : 5,
      quality: typeof (item as any).qualityDream === 'number' ? (item as any).qualityDream : 5,
      tags: item.tags || [],
    });
    setDateObj(item.dateISO ? new Date(item.dateISO) : new Date());
    setVisible(true);
  };
  const closeEditor = () => { setVisible(false); setUiIndex(null); };

  /* ── Tags (ajout/suppression) ── */
  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    if (ed.tags.length >= 3) return;
    const t = sanitizeTag(tagInput);
    if (!t || ed.tags.includes(t)) return;
    setEd(s => ({ ...s, tags: [...s.tags, t] })); setTagInput('');
  };
  const removeTag = (t: string) => setEd(s => ({ ...s, tags: s.tags.filter(x => x !== t) }));

  /* ── Date/Time pickers ── */
  const onChangeDate = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDate(false); if (!selected) return;
    const merged = new Date(dateObj); merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDateObj(merged);
  };
  const onChangeTime = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTime(false); if (!selected) return;
    const merged = new Date(dateObj); merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDateObj(merged);
  };

  /* ── Récupérer l’index stockage (liste inversée) ── */
  const getStorageIndex = async (indexInUI: number) => {
    const arr = await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey);
    const len = Array.isArray(arr) ? arr.length : 0;
    return len - 1 - indexInUI;
  };

  /* ── Enregistrer / Supprimer ── */
  const saveEdits = async () => {
    if (uiIndex === null) return;
    const storageIdx = await getStorageIndex(uiIndex);
    const arr = (await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
    if (storageIdx < 0 || storageIdx >= arr.length) return;

    const prev = arr[storageIdx];
    const next: DreamData = {
      ...prev,
      title: ed.title || undefined,
      character: ed.character || undefined,
      dreamText: ed.text,
      dreamType: ed.type,
      isLucidDream: ed.type ? ed.type === 'lucid' : prev.isLucidDream,
      tags: ed.tags.length ? ed.tags : undefined,
      ...(ed.location ? { location: ed.location } : {}),
      favorite: ed.favorite,
      intensity: ed.intensity,
      qualityDream: ed.quality,
      dateISO: dateObj.toISOString(),
      dateDisplay: formatDate(dateObj),
      timeDisplay: formatTime(dateObj),
    } as any;

    arr[storageIdx] = next;
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, arr);
    await load(); closeEditor();
  };

  const deleteDream = async () => {
    if (uiIndex === null) return;
    const storageIdx = await getStorageIndex(uiIndex);
    const arr = (await AsyncStorageService.getData<DreamData[]>(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
    if (storageIdx < 0 || storageIdx >= arr.length) return;
    arr.splice(storageIdx, 1);
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, arr);
    await load(); closeEditor();
  };

  /* ── Rendu d’un item (carte) ── */
  const renderItem = ({ item, index }: { item: DreamData; index: number }) => {
    const { date, time } = item.dateDisplay && item.timeDisplay ? { date: item.dateDisplay, time: item.timeDisplay } : fmtDate(item.dateISO);
    const tLabel = typeLabel(item.dreamType, item.isLucidDream);
    const title = deriveTitle(item.title, item.dreamText);

    return (
      <Card style={styles.card} mode="contained" onPress={() => openEditor(item, index)}>
        <Card.Content style={{ paddingBottom: 8 }}>
          <View style={styles.row}>
            <ThemedText style={styles.dateText}>{date || '—'} {time ? `• ${time}` : ''}</ThemedText>
            <Chip mode="flat" compact>{tLabel}</Chip>
          </View>

          <ThemedText style={styles.title}>{title}</ThemedText>
          <Divider style={styles.divider} />

          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionLabel}>Personnes</ThemedText>
            <View style={styles.wrapRow}>
              {(item as any).character?.trim()
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
              {(item.tags || []).length
                ? item.tags!.map((t) => <Chip key={t} compact style={styles.chip}>#{t}</Chip>)
                : <ThemedText style={styles.placeholder}>Aucun</ThemedText>}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  /* ── Mémo du RefreshControl pour lisibilité ── */
  const refresher = useMemo(
    () => <RefreshControl refreshing={loading} onRefresh={load} />,
    [loading, load]
  );

  /* ── UI globale + modale d’édition ── */
  return (
    <>
      {/* Liste des rêves */}
      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={refresher}
        ListEmptyComponent={<View style={styles.empty}><ThemedText>Aucun rêve enregistré</ThemedText></View>}
      />

      {/* Modale éditeur */}
      <Portal>
        <Modal visible={visible} onDismiss={closeEditor} contentContainerStyle={styles.modalContainer}>
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
                onPressIn={() => setShowDate(true)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDate(true)} />}
                style={[styles.half, { marginRight: 8 }]}
              />
              <TextInput
                label="Heure"
                value={timeDisplay}
                mode="flat"
                editable={false}
                onPressIn={() => setShowTime(true)}
                right={<TextInput.Icon icon="clock-outline" onPress={() => setShowTime(true)} />}
                style={styles.half}
              />
            </View>
            {showDate && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onChangeDate}
                locale="fr-FR"
              />
            )}
            {showTime && (
              <DateTimePicker
                value={dateObj}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
                locale="fr-FR"
                is24Hour
              />
            )}

            {/* Champs principaux */}
            <TextInput label="Titre" value={ed.title} onChangeText={setF('title')} mode="flat" style={styles.mb12} />
            <TextInput label="Personnes" value={ed.character} onChangeText={setF('character')} mode="flat" style={styles.mb12} />
            <TextInput label="Lieu" value={ed.location} onChangeText={setF('location')} mode="flat" style={styles.mb12} />

            {/* Type de rêve */}
            <SegmentedButtons
              value={ed.type}
              onValueChange={(v) => setF('type')(v as DreamType)}
              buttons={[
                { value: 'lucid', label: 'Rêve lucide' },
                { value: 'nightmare', label: 'Cauchemar' },
                { value: 'pleasant', label: 'Rêve agréable' },
              ]}
              style={styles.mb12}
            />

            {/* Sliders Intensité / Qualité */}
            <View style={styles.row}>
              <View style={[styles.sliderHalf, { marginRight: 8 }]}>
                <ThemedText style={styles.sliderLabel}>Intensity: {ed.intensity}</ThemedText>
                <Slider value={ed.intensity} minimumValue={0} maximumValue={10} step={1} onValueChange={setF('intensity')} />
              </View>
              <View style={styles.sliderHalf}>
                <ThemedText style={styles.sliderLabel}>Quality: {ed.quality}</ThemedText>
                <Slider value={ed.quality} minimumValue={0} maximumValue={10} step={1} onValueChange={setF('quality')} />
              </View>
            </View>

            {/* Favori */}
            <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
              <Checkbox.Item
                label="Ajouter aux favoris"
                status={ed.favorite ? 'checked' : 'unchecked'}
                onPress={() => setF('favorite')(!ed.favorite)}
              />
            </View>

            {/* Description */}
            <TextInput
              label="Description du rêve"
              value={ed.text}
              onChangeText={setF('text')}
              mode="flat"
              multiline
              numberOfLines={6}
              style={styles.mb12}
            />

            {/* Tags */}
            <ThemedText style={styles.sectionLabel}>Tags (3 max)</ThemedText>
            <View style={[styles.wrapRow, styles.mb8]}>
              {ed.tags.map((t) => (
                <Chip key={t} onClose={() => removeTag(t)} compact style={styles.chip}>#{t}</Chip>
              ))}
            </View>
            <TextInput
              label="Ajouter un tag"
              value={tagInput}
              onChangeText={setTagInput}
              mode="flat"
              right={<TextInput.Icon icon="plus" onPress={addTag} disabled={ed.tags.length >= 3 || !sanitizeTag(tagInput)} />}
              onSubmitEditing={addTag}
              disabled={ed.tags.length >= 3}
              style={styles.mb16}
            />

            {/* Actions */}
            <View style={styles.rowBetween}>
              <Button mode="contained" onPress={saveEdits}>Enregistrer</Button>
              <Button mode="contained" onPress={deleteDream} style={styles.deleteBtn} textColor="#fff">Supprimer le rêve</Button>
            </View>
          </KeyboardAwareScrollView>
        </Modal>
      </Portal>
    </>
  );
}

/* ──────────────────────── Styles ──────────────────────── */
const styles = StyleSheet.create({
  /* --- Liste des rêves --- */
  list: { 
    padding: 16,              // marge interne autour de la liste
    paddingBottom: 32,        // espace supplémentaire en bas pour le scroll
  },
  card: {
  marginBottom: 12,
  borderRadius: 12,
  width: '90%',          // ← Réduit la largeur (ex : 90% de l’écran)
  alignSelf: 'center',   // ← Centre la carte horizontalement
  },  

  row: { 
    flexDirection: 'row',     // aligne les éléments horizontalement
    justifyContent: 'space-between', // espace maximal entre les éléments
    alignItems: 'center',     // alignement vertical centré
    marginBottom: 18,         // espace entre les lignes
  },
  dateText: { 
    fontSize: 12,             // petite taille pour la date
    opacity: 0.8,             // légère transparence pour un aspect discret
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600',        // semi-gras pour hiérarchiser le titre
    marginTop: 6,             // espace au-dessus du titre
  },
  divider: { 
    marginVertical: 10,       // espace autour du séparateur
    opacity: 0.5,             // ligne atténuée
  },
  sectionRow: { 
    marginTop: 6,             // espace entre les blocs internes (personnes, tags…)
  },
  sectionLabel: { 
    fontSize: 12, 
    opacity: 0.7,             // aspect secondaire du label
    marginBottom: 4,          // espace sous le titre de section
  },
  wrapRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',         // permet aux éléments (chips) de passer à la ligne
    gap: 8,                   // espace uniforme entre les chips
  },
  chip: { 
    marginRight: 6, 
    marginBottom: 6,          // petit espacement autour de chaque chip
  },
  placeholder: { 
    fontSize: 12, 
    opacity: 0.6,             // texte grisé pour l’absence de données
  },
  descText: { 
    fontSize: 13, 
    lineHeight: 18,           // espacement entre les lignes du texte
    opacity: 0.9,             // lisibilité sans contraste excessif
  },
  empty: { 
    padding: 24, 
    alignItems: 'center',     // centre le texte “Aucun rêve enregistré”
  },

  /* --- Modale / Éditeur --- */
  modalContainer: { 
    margin: 12, 
    borderRadius: 12, 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,1)', // fond blanc pour la lisibilité
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12,         // espace sous le titre de la modale
  },
  mb8: { marginBottom: 8 },   // utilitaires de marge verticale
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  rowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', // boutons opposés (ex: Enregistrer / Supprimer)
    alignItems: 'center',
  },
  deleteBtn: { 
    backgroundColor: '#d32f2f', // rouge pour indiquer la suppression
  },
  half: { 
    flex: 1,                  // permet de diviser l’espace en deux colonnes égales
  },
  sliderHalf: { 
    flex: 1,                  // même chose pour les sliders
  },
  sliderLabel: { 
    marginBottom: 4, 
    fontSize: 12,             // petite légende pour les barres de valeur
  },
});
