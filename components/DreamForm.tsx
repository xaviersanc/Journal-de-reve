// components/DreamForm.tsx

import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';





const { width } = Dimensions.get('window');

export default function DreamForm() {
  const [dreamText, setDreamText] = useState<string>('');
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);

  const [date, setDate] = useState<string>('');
  const [hour, setHour] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [character, setCharacter] = useState<string>('');
  const [signification, setSignification] = useState<string>('');
  const [favorite, setFavorite] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(5);   // 0–10
  const [quality, setQuality]   = useState<number>(5);     // 0–10


  const handleDreamSubmission = async (): Promise<void> => {
    try {
      const formDataArray: DreamData[] =
        await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      // Ajoute d'autres champs si présents dans l'interface DreamData
      formDataArray.push({
        dreamText,
        isLucidDream,
        date,
        hour,
        location,
        character,
        intensity,
        qualityDream: quality,
        signification,
        favorite,
      } as unknown as DreamData);

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      console.log(
        'AsyncStorage: ',
        await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey)
      );
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
    setIsLucidDream(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={[styles.rowContainer, { width: width * 0.8, alignSelf: 'center' }]}>
            <TextInput
              label="Date"
              value={date}
              onChangeText={setDate}
              mode="flat"
              style={[styles.inputHalf, { marginRight: 8 }]}
            />
            <TextInput
              label="Heure"
              value={hour}
              onChangeText={setHour}
              mode="flat"
              style={styles.inputHalf}
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

          {/* Sliders : Intensité / Qualité */}
          <View style={[styles.rowContainer, { width: width * 0.8, alignSelf: 'center' }]}>
            <View style={[styles.sliderHalf, { marginRight: 8 }]}>
              <Text style={styles.sliderLabel}>Intensity: {intensity}</Text>
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
              <Text style={styles.sliderLabel}>Quality: {quality}</Text>
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


          <TextInput
            label="Signification"
            value={signification}
            onChangeText={setSignification}
            mode="flat"
            multiline
            numberOfLines={4}
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          <TextInput
            label="Rêve"
            value={dreamText}
            onChangeText={setDreamText}
            mode="flat"
            multiline
            numberOfLines={6}
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          <View style={[styles.rowContainer, { width: width * 0.8, alignSelf: 'center' }]}>
            <View style={[styles.inputHalf, { marginRight: 8 }]}>
              <Checkbox.Item
                label="Rêve Lucide"
                status={isLucidDream ? 'checked' : 'unchecked'}
                onPress={() => setIsLucidDream(!isLucidDream)}
              />
            </View>

            <View style={styles.inputHalf}>
              <Checkbox.Item
                label="Ajouter aux favoris"
                status={favorite ? 'checked' : 'unchecked'}
                onPress={() => setFavorite(!favorite)}
              />
            </View>
          </View>


          <Button mode="contained" onPress={handleDreamSubmission} style={styles.button}>
            Soumettre
          </Button>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },

  slider: { width: '100%', height: 40 },
  sliderLabel: { marginBottom: 4, fontSize: 12 },
  sliderHalf: { flex: 1 },


});
