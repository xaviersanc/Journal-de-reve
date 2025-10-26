import DreamList from '@/components/DreamList';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

export default function TabTwoScreen() {
  const theme = useTheme();
  const DARK = theme.dark;

  // Couleurs thème
  const bgColor   = DARK ? '#1A1A1E' : '#f5f5f5'; // fond global de l’écran
  const cardColor = DARK ? '#1A1A1E' : '#f5f5f5'; // fond des blocs/Cartes
  const textColor = DARK ? '#FFFFFF' : '#000000';
  const subText   = DARK ? 'rgba(255,255,255,0.75)' : '#555';

  const [tab, setTab] = useState<'periode' | 'tous'>('tous');

  // Période sélectionnée
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const [filter, setFilter] = useState<{ start?: string; end?: string }>({});
  const [dreams, setDreams] = useState<DreamData[]>([]);
  const [filteredDreams, setFilteredDreams] = useState<DreamData[]>([]);
  const [filterLaunched, setFilterLaunched] = useState(false);

  // Charger tous les rêves au montage
  const loadDreams = useCallback(async () => {
    const arr = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);
    setDreams(Array.isArray(arr) ? [...arr].reverse() : []);
  }, []);
  useEffect(() => { loadDreams(); }, [loadDreams]);

  // Filtrer selon la période
  useEffect(() => {
    if (!filter.start && !filter.end) {
      setFilteredDreams(dreams);
      return;
    }
    setFilteredDreams(
      dreams.filter((dream) => {
        if (!dream.dateISO) return false;
        const d = new Date(dream.dateISO);
        if (filter.start && d < new Date(filter.start)) return false;
        if (filter.end && d > new Date(filter.end)) return false;
        return true;
      })
    );
  }, [dreams, filter]);

  // Helpers affichage date
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const startDisplay = start ? formatDate(new Date(start)) : '';
  const endDisplay = end ? formatDate(new Date(end)) : '';

  // Sélection date
  const onChangeStart = (_: DateTimePickerEvent, selected?: Date) => {
    setShowStart(false);
    if (selected) setStart(selected.toISOString().slice(0, 10));
  };
  const onChangeEnd = (_: DateTimePickerEvent, selected?: Date) => {
    setShowEnd(false);
    if (selected) setEnd(selected.toISOString().slice(0, 10));
  };

  // Appliquer le filtre
  const handleFilter = () => {
    setFilter({ start, end });
    setFilterLaunched(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <SegmentedButtons
        value={tab}
        onValueChange={(value) => {
          setTab(value as any);
          if (value === 'periode') setFilterLaunched(false);
        }}
        buttons={[
          { value: 'periode', label: 'Par jour/période' },
          { value: 'tous', label: 'Tous les rêves' },
        ]}
        style={{ margin: 12 }}
      />

      {tab === 'periode' && (
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: textColor }]}>Rêves par période</Text>

          {/* Bloc filtre période */}
          <Card style={[styles.card, { backgroundColor: cardColor }]}>
            <Card.Content>
              <View style={styles.row}>
                <TextInput
                  label="Début (AAAA-MM-JJ)"
                  value={startDisplay}
                  mode="outlined"
                  style={{ flex: 1, marginRight: 8 }}
                  editable={false}
                  onPressIn={() => setShowStart(true)}
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowStart(true)} />}
                />
                <TextInput
                  label="Fin (AAAA-MM-JJ)"
                  value={endDisplay}
                  mode="outlined"
                  style={{ flex: 1 }}
                  editable={false}
                  onPressIn={() => setShowEnd(true)}
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowEnd(true)} />}
                />
              </View>

              {showStart && (
                <DateTimePicker
                  value={start ? new Date(start) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onChangeStart}
                  locale="fr-FR"
                  {...(DARK && Platform.OS === 'ios' ? { themeVariant: 'dark' as const } : {})}
                />
              )}
              {showEnd && (
                <DateTimePicker
                  value={end ? new Date(end) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onChangeEnd}
                  locale="fr-FR"
                  {...(DARK && Platform.OS === 'ios' ? { themeVariant: 'dark' as const } : {})}
                />
              )}

              <Button mode="contained" style={{ marginTop: 12, marginBottom: 12 }} onPress={handleFilter}>
                Voir les rêves
              </Button>

              {/* Aide visuelle */}
              <Text style={{ color: subText, textAlign: 'center' }}>
                Sélectionne une plage de dates puis lance l’affichage.
              </Text>
            </Card.Content>
          </Card>

          {/* Liste filtrée */}
          {filterLaunched && <DreamList data={filteredDreams} />}
        </ScrollView>
      )}

      {tab === 'tous' && (
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: textColor }]}>Tous les rêves</Text>

          {/* Bloc contenant la liste pour garder le fond de lecture en dark */}
          <Card style={[styles.card, { backgroundColor: cardColor, paddingVertical: 8 }]}>
            <Card.Content>
              <DreamList />
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 16,
    elevation: 0, // évite l’ombre agressive en dark
  },
});
