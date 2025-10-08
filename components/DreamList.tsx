// components/DreamList.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Button } from 'react-native-paper';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';


export default function DreamList() {
    const [dreams, setDreams] = useState<DreamData[]>([]);

    const fetchData = async () => {
        try {
            const formDataArray: DreamData[] = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);
            setDreams(formDataArray);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        }
    };

    // Chargement initial
    useEffect(() => {
        fetchData();
    }, []);

    // Rechargement quand on revient sur l’écran
    useFocusEffect(
        useCallback(() => {
            fetchData();
            return () => {
                console.log('This route is now unfocused.');
            };
        }, [])
    );

    const handleResetDreams = async (): Promise<void> => {
        try {
            await AsyncStorage.setItem('dreamFormDataArray', JSON.stringify([]));

            const emptyDreamsData: DreamData[] = [];

            await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, emptyDreamsData);

            setDreams(emptyDreamsData);

        } catch (error) {
            console.error('Erreur lors de la réinitialisation des données:', error);
        }
    };

    return (
        <View>
            <Text style={styles.title}>Liste des Rêves :</Text>
            {dreams.length > 0 ? (
                dreams.map((dream, index) => (
                    <Text key={index} style={styles.dreamText}>
                        {dream.dreamText} - {dream.isLucidDream ? 'Lucide' : 'Non Lucide'}{' '}
                    </Text>
                ))
            ) : (
                <Text style={styles.dreamText}>Aucun rêve enregistré</Text>
            )}

            <Button
                mode="contained"
                onPress={handleResetDreams}
                style={styles.button}
            >
                Reset Dreams
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    dreamText: {
        fontSize: 16,
        marginBottom: 4,
    },
    button: {
        marginTop: 8,
    },
});
