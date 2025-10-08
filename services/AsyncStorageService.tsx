import { DreamData } from "@/interfaces/DreamData";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AsyncStorageService = {

    getData: async (key: string): Promise<DreamData[]> => {
        // Récupérer les données actuelles depuis AsyncStorage a partir de la clé passé en paramètre
        const existingData = await AsyncStorage.getItem(key);

        // Parser en tableau de DreamData
        return existingData
            ? JSON.parse(existingData)
            : [];
    },

    setData: async (key: string, dataToInsert: DreamData[]): Promise<void> => {

      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem(
        key,
        JSON.stringify(dataToInsert)
      );
      
    }
}