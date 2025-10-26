// components/DreamForm.tsx
import { Text as ThemedText } from '@/components/Themed';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Checkbox, Chip, SegmentedButtons, TextInput } from 'react-native-paper';

// Responsive largeur de contenu
// Calculé à l'exécution pour s'adapter aux changements d'orientation

/**
 * Formate une date en chaîne 'jj/mm/aaaa'.
 * @param d Date à formater
 * @returns La date formatée sous forme de chaîne, par exemple '26/10/2025'.
 */
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
/**
 * Formate une date en heure/minute (format 24h).
 * @param d Date à formater
 * @returns L'heure formatée sous forme de chaîne, par exemple '14:30'.
 */
const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

/**
 * Formulaire principal de saisie d'un rêve.
 * Ne prend pas de paramètres.
 * Affiche le formulaire, gère la saisie et la sauvegarde dans le stockage local.
 * @returns Un composant React (JSX.Element) représentant le formulaire complet de saisie de rêve, prêt à être affiché dans l'application.
 */
export default function DreamForm() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(700, width * 0.9);
  const [dreamText, setDreamText] = useState<string>('');
  const [dreamDescription, setDreamDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [character, setCharacter] = useState<string>('');
  const [signification, setSignification] = useState<string>('');
  const [favorite, setFavorite] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(5);
  const [quality, setQuality] = useState<number>(5);
  const [dreamType, setDreamType] =
    useState<'lucid' | 'nightmare' | 'pleasant'>('pleasant');

  // Date/Heure (pickers)
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const dateDisplay = formatDate(dateObj);
  const timeDisplay = formatTime(dateObj);

  // Tags (3 maximum)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');

  /**
   * Nettoie un tag utilisateur (supprime #, espaces, met en minuscule).
   * @param raw Tag brut saisi
   * @returns Le tag nettoyé, prêt à être stocké ou affiché (ex: 'mon-tag').
   */
  const sanitizeTag = (raw: string) =>
    raw
      .trim()
      .replace(/^#+/, '')           // retire les # initiaux
      .replace(/\s+/g, '-')         // espaces -> tirets
      .toLowerCase();

  /**
   * Ajoute le tag courant à la liste si valide (max 3, pas de doublon).
   * Ne prend pas de paramètres, modifie l'état local.
   * @returns Rien (void). Met à jour l'état local des tags si le tag est valide.
   */
  const addTag = () => {
    if (tags.length >= 3) return;
    const t = sanitizeTag(tagInput);
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  /**
   * Retire un tag de la liste.
   * @param t Tag à retirer
   * @returns Rien (void). Met à jour l'état local des tags en supprimant le tag donné.
   */
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  /**
   * Met à jour la date sélectionnée dans le picker.
   * @param _ Événement (non utilisé)
   * @param selected Date sélectionnée
   * @returns Rien (void). Met à jour l'état local de la date si une date est choisie.
   */
  const onChangeDate = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (!selected) return;
    const merged = new Date(dateObj);
    merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDateObj(merged);
  };

  /**
   * Met à jour l'heure sélectionnée dans le picker.
   * @param _ Événement (non utilisé)
   * @param selected Heure sélectionnée
   * @returns Rien (void). Met à jour l'état local de l'heure si une heure est choisie.
   */
  const onChangeTime = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (!selected) return;
    const merged = new Date(dateObj);
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDateObj(merged);
  };

  /**
   * Sauvegarde le rêve dans le stockage local et réinitialise le formulaire.
   * Ne prend pas de paramètres.
   * @returns Une promesse qui se résout quand la sauvegarde et la réinitialisation du formulaire sont terminées (Promise<void>).
   */
  const handleDreamSubmission = async (): Promise<void> => {
    try {
      const formDataArray: DreamData[] =
        await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      formDataArray.push({
        dreamText,
        dreamDescription,
        location,
        character,
        intensity,
        qualityDream: quality,
        signification,
        favorite,
        dreamType,
        isLucidDream: dreamType === 'lucid',
        dateISO: dateObj.toISOString(),
        dateDisplay,
        timeDisplay,
        tags, // <-- persiste les 3 hashtags
      } as unknown as DreamData);

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);
      await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }

    Keyboard.dismiss(); // Ferme le clavier après validation

    setDreamText('');
    setDreamDescription('');
    setLocation('');
    setCharacter('');
    setIntensity(5);
    setQuality(5);
    setSignification('');
    setFavorite(false);
    setDreamType('pleasant');
    setTags([]);
    setTagInput('');
    setDateObj(new Date());
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraScrollHeight={24}
      extraHeight={Platform.OS === 'android' ? 80 : 0}
      keyboardOpeningTime={0}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      enableAutomaticScroll
      showsVerticalScrollIndicator={false}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          {/* Date / Heure */}
          <View style={[styles.row, { width: contentWidth, alignSelf: 'center' }]}>
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

          {/* Rêve */}
          <TextInput
            label="Titre du rêve"
            value={dreamText}
            onChangeText={setDreamText}
            mode="flat"
            multiline
            numberOfLines={6}
            style={[styles.input, { width: contentWidth, alignSelf: 'center' }]}
          />

          {/* Lieu */}
          <TextInput
            label="Lieu"
            value={location}
            onChangeText={setLocation}
            mode="flat"
            style={[styles.input, { width: contentWidth, alignSelf: 'center' }]}
          />

          {/* Personne */}
          <TextInput
            label="Personne"
            value={character}
            onChangeText={setCharacter}
            mode="flat"
            style={[styles.input, { width: contentWidth, alignSelf: 'center' }]}
          />

          {/* Type de rêve */}
          <View style={{ width: contentWidth, alignSelf: 'center', marginBottom: 16 }}>
            <ThemedText style={styles.fieldLabel}>Type de rêve</ThemedText>
            <SegmentedButtons
              value={dreamType}
              onValueChange={(v) => setDreamType(v as 'lucid' | 'nightmare' | 'pleasant')}
              style={{ marginTop: 8 }}
              buttons={[
                { value: 'lucid', label: 'Rêve lucide', labelStyle: { fontSize: width < 350 ? 10 : width < 400 ? 12 : 14 } },
                { value: 'nightmare', label: 'Cauchemar', labelStyle: { fontSize: width < 350 ? 10 : width < 400 ? 12 : 14 } },
                { value: 'pleasant', label: 'Rêve agréable', labelStyle: { fontSize: width < 350 ? 10 : width < 400 ? 12 : 14 } },
              ]}
            />
          </View>

          {/* Sliders */}
          <View style={[styles.row, { width: contentWidth, alignSelf: 'center' }]}>
            <View style={[styles.sliderHalf, { marginRight: 8 }]}>
              <ThemedText style={styles.sliderLabel}>Intensity: {intensity}</ThemedText>
              <Slider
                value={intensity}
                minimumValue={0}
                maximumValue={10}
                step={1}
                onValueChange={setIntensity}
                style={styles.slider}
              />
            </View>
            <View style={styles.sliderHalf}>
              <ThemedText style={styles.sliderLabel}>Quality: {quality}</ThemedText>
              <Slider
                value={quality}
                minimumValue={0}
                maximumValue={10}
                step={1}
                onValueChange={setQuality}
                style={styles.slider}
              />
            </View>
          </View>

          {/* Signification */}
          <TextInput
            label="Signification"
            value={signification}
            onChangeText={setSignification}
            mode="flat"
            multiline
            numberOfLines={4}
            style={[styles.input, { width: contentWidth, alignSelf: 'center' }]}
          />


          {/* Description */}
          <TextInput
            label="Description du rêve"
            value={dreamDescription}
            onChangeText={setDreamDescription}
            mode="flat"
            multiline
            numberOfLines={4}
            style={[styles.input, { width: contentWidth, alignSelf: 'center' }]}
          />



          {/* Hashtags (3 max) */}
          <View style={{ width: contentWidth, alignSelf: 'center', marginBottom: 8 }}>
            <ThemedText style={styles.fieldLabel}>Hashtags (3 max)</ThemedText>
            <View style={styles.tagsRow}>
              {tags.map((t) => (
                <Chip
                  key={t}
                  style={styles.tagChip}
                  onClose={() => removeTag(t)}
                >
                  #{t}
                </Chip>
              ))}
            </View>
            <TextInput
              label="Ajouter un hashtag"
              value={tagInput}
              onChangeText={setTagInput}
              mode="flat"
              placeholder="#exemple"
              right={
                <TextInput.Icon
                  icon="plus"
                  onPress={addTag}
                  disabled={tags.length >= 3 || !sanitizeTag(tagInput)}
                />
              }
              onSubmitEditing={addTag}
              disabled={tags.length >= 3}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Favori */}
          <View style={{ width: contentWidth, alignSelf: 'center' }}>
            <Checkbox.Item
              label="Ajouter aux favoris"
              status={favorite ? 'checked' : 'unchecked'}
              onPress={() => setFavorite(!favorite)}
            />
          </View>

          <Button mode="contained" onPress={handleDreamSubmission} style={styles.button}>
            Enregistrer
          </Button>

          <View style={{ height: 16 }} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}

/* ──────────────────────── Styles ──────────────────────── */
const styles = StyleSheet.create({
  container: {
    padding: 16,              // marge interne globale du formulaire
    flexGrow: 1,              // permet au ScrollView de s’étendre en hauteur
    justifyContent: 'flex-start', // aligne les blocs depuis le haut
  },
  input: { 
    marginBottom: 16,         // espacement vertical standard entre champs
  },
  button: { 
    marginTop: 8,             // léger espace au-dessus du bouton d’enregistrement
  },
  row: {
    flexDirection: 'row',     // place les enfants sur une ligne (Date/Heure, sliders)
    justifyContent: 'space-between', // espace distribué entre les deux colonnes
    marginBottom: 16,         // séparation avec le bloc suivant
  },
  half: { 
    flex: 1,                  // moitié de la largeur disponible (colonne)
  },
  slider: { 
    width: '100%',            // le slider prend toute la largeur de sa colonne
    height: 40,               // hauteur suffisante pour une prise en main confortable
  },
  sliderLabel: { 
    marginBottom: 4,          // espace entre le libellé et le slider
    fontSize: 12,             // libellé discret
  },
  sliderHalf: { 
    flex: 1,                  // colonne de slider (utilisé par paire)
  },
  fieldLabel: { 
    fontSize: 12,             // petit libellé au-dessus des contrôles (ex: “Type de rêve”)
    marginBottom: 4,          // espace au-dessus du composant associé
  },
  tagsRow: {
    flexDirection: 'row',     // affichage des chips sur une ligne
    flexWrap: 'wrap',         // retour à la ligne automatique si débordement
    gap: 8,                   // espacement uniforme entre chips
    marginTop: 4,             // espace entre le libellé et la rangée de tags
  },
  tagChip: {
    marginRight: 8,           // espacement horizontal entre chips (fallback si gap non supporté)
    marginBottom: 8,          // espacement vertical entre lignes de chips
  },
});

