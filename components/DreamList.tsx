// components/DreamList.tsx
// Liste + éditeur de rêves (version compacte, commentée par blocs)

import { Text as ThemedText } from '@/components/Themed';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
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
/**
 * Formate une date ISO en objets date et heure lisibles.
 * @param iso Chaîne ISO de la date (ex: '2025-10-26T14:30:00.000Z')
 * @returns Un objet { date: '26/10/2025', time: '14:30' } ou { date: '', time: '' } si iso absent.
 */
const fmtDate = (iso?: string) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d),
    time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
  };
};
/**
 * Formate une date en chaîne 'jj/mm/aaaa'.
 * @param d Date à formater
 * @returns La date formatée sous forme de chaîne, par exemple '26/10/2025'.
 */
const formatDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
/**
 * Formate une date en heure/minute (format 24h).
 * @param d Date à formater
 * @returns L'heure formatée sous forme de chaîne, par exemple '14:30'.
 */
const formatTime = (d: Date) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
/**
 * Retourne le label lisible du type de rêve.
 * @param t Type de rêve ('lucid', 'nightmare', 'pleasant')
 * @param isLucid Booléen pour forcer le type lucide
 * @returns Chaîne lisible pour l'utilisateur (ex: 'Rêve lucide').
 */
const typeLabel = (t?: DreamData['dreamType'], isLucid?: boolean) =>
  t === 'lucid' || isLucid ? 'Rêve lucide' : t === 'nightmare' ? 'Cauchemar' : t === 'pleasant' ? 'Rêve agréable' : '—';
/**
 * Déduit un titre à partir du titre ou du texte du rêve.
 * @param title Titre explicite (optionnel)
 * @param text Texte du rêve (optionnel)
 * @returns Titre à afficher (max 80 caractères, ou 'Sans titre').
 */
const deriveTitle = (title?: string, text?: string) => {
  if (title?.trim()) return title.trim();
  const raw = (text || '').trim().split('\n')[0];
  return raw ? (raw.length > 80 ? raw.slice(0, 80) + '…' : raw) : 'Sans titre';
};
/**
 * Nettoie un tag utilisateur (supprime #, espaces, met en minuscule).
 * @param raw Tag brut saisi
 * @returns Le tag nettoyé, prêt à être stocké ou affiché (ex: 'mon-tag').
 */
const sanitizeTag = (raw: string) => raw.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();

/* ──────────────────────── Composant principal ──────────────────────── */
/**
 * Composant principal d'affichage et d'édition de la liste des rêves.
 * Ne prend pas de paramètres.
 * @returns Un composant React (JSX.Element) affichant la liste et l'éditeur de rêves.
 */
import { useSearch } from './SearchContext';

import React from 'react';
type DreamListProps = {
  data?: DreamData[];
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
};

export default function DreamList({ data: dataProp, ListHeaderComponent }: DreamListProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 1200 ? 3 : width >= 768 ? 2 : 1;
  const { criteria } = useSearch();
  /* ── Données liste ── */
  const [data, setData] = useState<DreamData[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Charge les rêves depuis le stockage et met à jour l'état local.
   * @returns Promise<void> - Met à jour l'état data et loading.
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
  const arr = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);
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

  // Filtrage selon les critères de recherche
  const filteredData = useMemo(() => {
    if (dataProp) return dataProp;
    if (!criteria) return data;
    return data.filter((dream) => {
      // Recherche simple : mot-clé dans la description
      if (criteria.search && !(dream.dreamText || '').toLowerCase().includes(criteria.search.toLowerCase())) {
        return false;
      }
      // Type
      if (criteria.type && dream.dreamType !== criteria.type) {
        return false;
      }
      // Personnage : cherche une correspondance dans toute la string (pas de séparation)
      if (criteria.character && !((dream as any).character || '').toLowerCase().includes(criteria.character.toLowerCase())) {
        return false;
      }
      // Période
      if (criteria.periodStart) {
        const d = dream.dateISO ? new Date(dream.dateISO) : undefined;
        if (!d || d < new Date(criteria.periodStart)) return false;
      }
      if (criteria.periodEnd) {
        const d = dream.dateISO ? new Date(dream.dateISO) : undefined;
        if (!d || d > new Date(criteria.periodEnd)) return false;
      }
      // Tag
      if (criteria.tag) {
        const tagNorm = criteria.tag.replace(/^#+/, '').toLowerCase();
        if (!dream.tags || !dream.tags.some(t => t.toLowerCase().includes(tagNorm))) {
          return false;
        }
      }
      return true;
    });
  }, [data, criteria, dataProp]);

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
  /**
   * Génère un setter pour un champ de l'état d'édition.
   * @param k Clé du champ à modifier
   * @returns Fonction qui met à jour la clé k dans l'état ed.
   */
  const setF = <K extends keyof typeof ed>(k: K) => (v: (typeof ed)[K]) => setEd(s => ({ ...s, [k]: v }));

  /* ── Date / heure de l’éditeur ── */
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const dateDisplay = formatDate(dateObj);
  const timeDisplay = formatTime(dateObj);

  /* ── Ouvrir/fermer l’éditeur ── */
  /**
   * Ouvre l'éditeur pour un rêve donné.
   * @param item Rêve à éditer
   * @param indexInUI Index du rêve dans la liste UI
   * @returns Rien (void). Met à jour l'état d'édition et affiche la modale.
   */
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
  /**
   * Ferme l'éditeur de rêve.
   * @returns Rien (void). Cache la modale et réinitialise l'index UI.
   */
  const closeEditor = () => { setVisible(false); setUiIndex(null); };

  /* ── Tags (ajout/suppression) ── */
  const [tagInput, setTagInput] = useState('');
  /**
   * Ajoute un tag à la liste des tags de l'éditeur si valide (max 3, pas de doublon).
   * @returns Rien (void). Met à jour l'état ed.tags.
   */
  const addTag = () => {
    if (ed.tags.length >= 3) return;
    const t = sanitizeTag(tagInput);
    if (!t || ed.tags.includes(t)) return;
    setEd(s => ({ ...s, tags: [...s.tags, t] })); setTagInput('');
  };
  /**
   * Retire un tag de la liste des tags de l'éditeur.
   * @param t Tag à retirer
   * @returns Rien (void). Met à jour l'état ed.tags.
   */
  const removeTag = (t: string) => setEd(s => ({ ...s, tags: s.tags.filter(x => x !== t) }));

  /* ── Date/Time pickers ── */
  /**
   * Met à jour la date sélectionnée dans le picker de l'éditeur.
   * @param _ Événement (non utilisé)
   * @param selected Date sélectionnée
   * @returns Rien (void). Met à jour l'état local de la date si une date est choisie.
   */
  const onChangeDate = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDate(false); if (!selected) return;
    const merged = new Date(dateObj); merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDateObj(merged);
  };
  /**
   * Met à jour l'heure sélectionnée dans le picker de l'éditeur.
   * @param _ Événement (non utilisé)
   * @param selected Heure sélectionnée
   * @returns Rien (void). Met à jour l'état local de l'heure si une heure est choisie.
   */
  const onChangeTime = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTime(false); if (!selected) return;
    const merged = new Date(dateObj); merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDateObj(merged);
  };

  /* ── Récupérer l’index stockage (liste inversée) ── */
  /**
   * Calcule l'index réel dans le stockage à partir de l'index UI (liste inversée).
   * @param indexInUI Index dans la liste affichée
   * @returns Index dans le tableau de stockage (number)
   */
  const getStorageIndex = async (indexInUI: number) => {
  const arr = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);
    const len = Array.isArray(arr) ? arr.length : 0;
    return len - 1 - indexInUI;
  };

  /* ── Enregistrer / Supprimer ── */
  /**
   * Enregistre les modifications du rêve édité dans le stockage.
   * @returns Promise<void> - Met à jour le stockage, recharge la liste et ferme l'éditeur.
   */
  const saveEdits = async () => {
    if (uiIndex === null) return;
    const storageIdx = await getStorageIndex(uiIndex);
  const arr = (await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
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

  /**
   * Supprime le rêve édité du stockage.
   * @returns Promise<void> - Met à jour le stockage, recharge la liste et ferme l'éditeur.
   */
  const deleteDream = async () => {
    if (uiIndex === null) return;
    const storageIdx = await getStorageIndex(uiIndex);
  const arr = (await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
    if (storageIdx < 0 || storageIdx >= arr.length) return;
    arr.splice(storageIdx, 1);
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, arr);
    await load(); closeEditor();
  };

  /* ── Rendu d’un item (carte) ── */
  /**
   * Rendu d'un item (carte de rêve) dans la liste.
   * @param param0 Objet contenant le rêve et son index
   * @returns Élément JSX représentant la carte du rêve.
   */
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
  /**
   * Mémorise le composant RefreshControl pour la liste.
   * @returns Élément JSX RefreshControl lié à l'état loading et à la fonction load.
   */
  const refresher = useMemo(
    () => <RefreshControl refreshing={loading} onRefresh={load} />,
    [loading, load]
  );

  /* ── UI globale + modale d’édition ── */
  return (
    <>
      {/* Liste des rêves */}
      <FlatList
        data={filteredData}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={refresher}
        ListEmptyComponent={<View style={styles.empty}><ThemedText>Aucun rêve trouvé</ThemedText></View>}
        ListHeaderComponent={ListHeaderComponent}
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
            showsVerticalScrollIndicator={false}
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
              value={ed.type ?? ''}
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
  flex: 1,               // s'étire pour remplir la colonne
  marginHorizontal: 6,   // gouttière entre colonnes
  },  
  gridRow: {
    justifyContent: 'space-between', // espace horizontal pour la grille
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
    alignSelf: 'center',
    width: '95%',
    maxWidth: 700,
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
