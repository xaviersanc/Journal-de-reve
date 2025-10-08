// components/DreamForm.tsx

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';


const { width } = Dimensions.get('window');

export default function DreamForm() {
  const [dreamText, setDreamText] = useState<string>('');
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('')
  const [tags, setTags] = useState<string[]>([]);



  const handleDreamSubmission = async (): Promise<void> => {
    try {

      const formDataArray: DreamData[] = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      // Ajouter le nouveau rêve
      formDataArray.push({ dreamText, isLucidDream });

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      console.log(
        'AsyncStorage: ',
        await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey)
      );

    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }

    setDreamText('');
    setIsLucidDream(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <TextInput
            label="Rêve"
            value={dreamText}
            onChangeText={setDreamText}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Rêve Lucide"
              status={isLucidDream ? 'checked' : 'unchecked'}
              onPress={() => setIsLucidDream(!isLucidDream)}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleDreamSubmission}
            style={styles.button}
          >
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
});
