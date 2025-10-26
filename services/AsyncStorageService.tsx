import { DreamData } from "@/interfaces/DreamData";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Service utilitaire pour la gestion du stockage asynchrone des rêves.
 */
export const AsyncStorageService = {

    /**
     * Récupère les données actuelles depuis AsyncStorage à partir de la clé passée en paramètre.
     * @param key Clé de stockage (string)
     * @returns Une promesse qui se résout en un tableau de DreamData (tous les rêves stockés sous cette clé).
     */
    getData: async (key: string): Promise<DreamData[]> => {
        const existingData = await AsyncStorage.getItem(key);
        return existingData
            ? JSON.parse(existingData)
            : [];
    },

    /**
     * Sauvegarde un tableau de rêves dans AsyncStorage sous la clé donnée.
     * @param key Clé de stockage (string)
     * @param dataToInsert Tableau de rêves à sauvegarder
     * @returns Une promesse qui se résout quand la sauvegarde est terminée (Promise<void>).
     */
    setData: async (key: string, dataToInsert: DreamData[]): Promise<void> => {
      await AsyncStorage.setItem(
        key,
        JSON.stringify(dataToInsert)
      );
    }
}