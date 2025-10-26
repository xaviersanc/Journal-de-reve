import { useNavigation } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput } from 'react-native-paper';

/**
 * Page d'accueil de l'application Journal de rêve
 * - Recherche simple (mot-clé dans la description)
 * - Recherche avancée (type, personnage, période, mot-clé/tag)
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState(false);
  // Champs avancés
  const [type, setType] = useState<'lucid' | 'nightmare' | 'pleasant' | ''>('');
  const [character, setCharacter] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [tag, setTag] = useState('');

  // Soumission de la recherche (à adapter selon navigation ou filtrage)
  const handleSearch = () => {
    // navigation.navigate('DreamList', { ... })
    // Pour l'instant, juste log
    console.log({ search, type, character, periodStart, periodEnd, tag });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Journal de rêve</Text>
      <Text style={styles.subtitle}>Retrouve, explore et analyse tes rêves facilement.</Text>

      {/* Recherche simple */}
      {!advanced && (
        <Card style={styles.card}>
          <Card.Title title="Recherche rapide" />
          <Card.Content>
            <TextInput
              label="Mot-clé dans la description"
              value={search}
              onChangeText={setSearch}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <Button mode="contained" onPress={handleSearch}>Rechercher</Button>
            <Button onPress={() => setAdvanced(true)} style={{ marginTop: 8 }}>
              Recherche avancée
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Recherche avancée */}
      {advanced && (
        <Card style={styles.card}>
          <Card.Title title="Recherche avancée" />
          <Card.Content>
            <TextInput
              label="Mot-clé dans la description"
              value={search}
              onChangeText={setSearch}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <SegmentedButtons
              value={type}
              onValueChange={v => setType(v as any)}
              style={{ marginBottom: 8 }}
              buttons={[
                { value: '', label: 'Tous' },
                { value: 'lucid', label: 'Lucide' },
                { value: 'nightmare', label: 'Cauchemar' },
                { value: 'pleasant', label: 'Agréable' },
              ]}
            />
            <TextInput
              label="Personnage principal"
              value={character}
              onChangeText={setCharacter}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                label="Début (AAAA-MM-JJ)"
                value={periodStart}
                onChangeText={setPeriodStart}
                mode="outlined"
                style={{ flex: 1 }}
              />
              <TextInput
                label="Fin (AAAA-MM-JJ)"
                value={periodEnd}
                onChangeText={setPeriodEnd}
                mode="outlined"
                style={{ flex: 1 }}
              />
            </View>
            <TextInput
              label="Mot-clé ou hashtag (#)"
              value={tag}
              onChangeText={setTag}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <Button mode="contained" onPress={handleSearch}>Rechercher</Button>
            <Button onPress={() => setAdvanced(false)} style={{ marginTop: 8 }}>
              Recherche simple
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginBottom: 24,
    borderRadius: 16,
    elevation: 2,
  },
});
