import DreamList from '@/components/DreamList';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
export default function TabTwoScreen() {
  const [tab, setTab] = useState<'periode' | 'tous'>('tous');
  // Période sélectionnée
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [filter, setFilter] = useState<{start?: string, end?: string}>({});
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

  // Helpers pour affichage date
  const formatDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
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
    <View style={{ flex: 1 }}>
      <SegmentedButtons
        value={tab}
        onValueChange={value => {
          setTab(value);
          if (value === 'periode') setFilterLaunched(false);
        }}
        buttons={[
          { value: 'periode', label: 'Par jour/période' },
          { value: 'tous', label: 'Tous les rêves' },
        ]}
        style={{ margin: 12 }}
      />
      {tab === 'periode' && (
        <View style={styles.container}>
          <Text style={styles.title}>Rêves par période</Text>
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
            />
          )}
          {showEnd && (
            <DateTimePicker
              value={end ? new Date(end) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeEnd}
              locale="fr-FR"
            />
          )}
          <Button mode="contained" style={{ marginTop: 12, marginBottom: 12 }} onPress={handleFilter}>Voir les rêves</Button>
          {/* DreamList filtrée par période */}
          {filterLaunched && <DreamList data={filteredDreams} />}
        </View>
      )}
      {tab === 'tous' && (
        <View style={styles.container}>
          <Text style={styles.title}>Tous les rêves</Text>
          <DreamList />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
});
