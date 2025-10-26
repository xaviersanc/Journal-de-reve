import DreamList from '@/components/DreamList';
import { useSearch } from '@/components/SearchContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput } from 'react-native-paper';

/**
 * Page d'accueil de l'application Journal de rêve (onglet Accueil)
 * - Recherche simple (mot-clé dans la description)
 * - Recherche avancée (type, personnage, période, mot-clé/tag)
 */
export default function TabThreeScreen() {
  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [type, setType] = useState<'lucid' | 'nightmare' | 'pleasant' | ''>('');
  const [character, setCharacter] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tag, setTag] = useState('');
  const [searchLaunched, setSearchLaunched] = useState(false);
  const { setCriteria } = useSearch();
  const { width } = useWindowDimensions();

  // Helpers pour affichage date
  const formatDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const periodStartDisplay = periodStart ? formatDate(new Date(periodStart)) : '';
  const periodEndDisplay = periodEnd ? formatDate(new Date(periodEnd)) : '';

  // Gestion sélection date
  const onChangeStart = (_: DateTimePickerEvent, selected?: Date) => {
    setShowStartPicker(false);
    if (selected) setPeriodStart(selected.toISOString().slice(0, 10));
  };
  const onChangeEnd = (_: DateTimePickerEvent, selected?: Date) => {
    setShowEndPicker(false);
    if (selected) setPeriodEnd(selected.toISOString().slice(0, 10));
  };

  // Soumission de la recherche : met à jour le contexte (affiche résultats dessous)
  const handleSearch = () => {
    Keyboard.dismiss();
    setCriteria({ search, type, character, periodStart, periodEnd, tag });
    setSearchLaunched(true);
  };

  // Header de recherche à injecter dans la FlatList
  const renderHeader = () => (
    <View style={styles.headerContainer}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <SegmentedButtons
                value={type}
                onValueChange={v => setType(v as any)}
                style={{ flex: 1 }}
                buttons={[
                  { value: '', label: 'Tous' },
                  { value: 'lucid', label: 'Lucide' },
                  { value: 'nightmare', label: 'Cauchemar' },
                  { value: 'pleasant', label: 'Agréable' },
                ]}
              />
            </View>
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
                value={periodStartDisplay}
                mode="outlined"
                style={{ flex: 1 }}
                editable={false}
                onPressIn={() => setShowStartPicker(true)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowStartPicker(true)} />}
              />
              <TextInput
                label="Fin (AAAA-MM-JJ)"
                value={periodEndDisplay}
                mode="outlined"
                style={{ flex: 1 }}
                editable={false}
                onPressIn={() => setShowEndPicker(true)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowEndPicker(true)} />}
              />
            </View>
            {showStartPicker && (
              <DateTimePicker
                value={periodStart ? new Date(periodStart) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onChangeStart}
                locale="fr-FR"
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={periodEnd ? new Date(periodEnd) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onChangeEnd}
                locale="fr-FR"
              />
            )}
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
    </View>
  );

  return (
    <>
      {searchLaunched ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {renderHeader()}
          <DreamList />
        </ScrollView>
      ) : (
        renderHeader()
      )}
    </>
  );
}


// Styles à placer après le composant pour éviter l'erreur d'utilisation avant déclaration
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
});
