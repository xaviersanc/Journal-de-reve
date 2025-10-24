// components/DreamForm.tsx
import { Text as ThemedText } from '@/components/Themed';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Checkbox, SegmentedButtons, TextInput } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function DreamForm() {
  const [dreamText, setDreamText] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [hour, setHour] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [character, setCharacter] = useState<string>('');
  const [signification, setSignification] = useState<string>('');
  const [favorite, setFavorite] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(5);
  const [quality, setQuality] = useState<number>(5);
  const [dreamType, setDreamType] =
    useState<'lucid' | 'nightmare' | 'pleasant'>('pleasant');

  const handleDreamSubmission = async (): Promise<void> => {
    try {
      const formDataArray: DreamData[] =
        await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      formDataArray.push({
        dreamText,
        date,
        hour,
        location,
        character,
        intensity,
        qualityDream: quality,
        signification,
        favorite,
        dreamType,
        isLucidDream: dreamType === 'lucid',
      } as unknown as DreamData);

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);
      await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }

    setDreamText('');
    setDate('');
    setHour('');
    setLocation('');
    setCharacter('');
    setIntensity(5);
    setQuality(5);
    setSignification('');
    setFavorite(false);
    setDreamType('pleasant');
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraScrollHeight={24}                // pousse légèrement le champ focalisé
      extraHeight={Platform.OS === 'android' ? 80 : 0}
      keyboardOpeningTime={0}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      enableAutomaticScroll
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          {/* Date / Heure */}
          <View style={[styles.row, { width: width * 0.8, alignSelf: 'center' }]}>
            <TextInput
              label="Date"
              value={date}
              onChangeText={setDate}
              mode="flat"
              style={[styles.half, { marginRight: 8 }]}
            />
            <TextInput
              label="Heure"
              value={hour}
              onChangeText={setHour}
              mode="flat"
              style={styles.half}
            />
          </View>

          <TextInput
            label="Lieu"
            value={location}
            onChangeText={setLocation}
            mode="flat"
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          <TextInput
            label="Personne"
            value={character}
            onChangeText={setCharacter}
            mode="flat"
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          {/* Type de rêve */}
          <View style={{ width: width * 0.8, alignSelf: 'center', marginBottom: 16 }}>
            <ThemedText style={styles.fieldLabel}>Type de rêve</ThemedText>
            <SegmentedButtons
              value={dreamType}
              onValueChange={(v) => setDreamType(v as 'lucid' | 'nightmare' | 'pleasant')}
              style={{ marginTop: 8 }}
              buttons={[
                { value: 'lucid', label: 'Rêve lucide' },
                { value: 'nightmare', label: 'Cauchemar' },
                { value: 'pleasant', label: 'Rêve agréable' },
              ]}
            />
          </View>

          {/* Sliders */}
          <View style={[styles.row, { width: width * 0.8, alignSelf: 'center' }]}>
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
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          {/* Rêve */}
          <TextInput
            label="Rêve"
            value={dreamText}
            onChangeText={setDreamText}
            mode="flat"
            multiline
            numberOfLines={6}
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          {/* Favori */}
          <View style={{ width: width * 0.8, alignSelf: 'center' }}>
            <Checkbox.Item
              label="Ajouter aux favoris"
              status={favorite ? 'checked' : 'unchecked'}
              onPress={() => setFavorite(!favorite)}
            />
          </View>

          <Button mode="contained" onPress={handleDreamSubmission} style={styles.button}>
            Soumettre
          </Button>

          <View style={{ height: 16 }} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  half: { flex: 1 },
  slider: { width: '100%', height: 40 },
  sliderLabel: { marginBottom: 4, fontSize: 12 },
  sliderHalf: { flex: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 4 },
});
