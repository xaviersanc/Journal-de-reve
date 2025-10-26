// app/modal.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Card, useTheme } from 'react-native-paper';

/** Calendrier mensuel avec navigation et indicateur ok */
type CalendarMonthProps = { byDayMap: Record<string, boolean>; initialMonth: Date };
function CalendarMonth({ byDayMap, initialMonth }: CalendarMonthProps) {
  const [month, setMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const theme = useTheme();
  const DARK = theme.dark;
  const textColor = DARK ? '#FFFFFF' : '#000000';
  const today = new Date();

  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDayOfMonth  = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startDay = new Date(firstDayOfMonth); startDay.setDate(1 - ((firstDayOfMonth.getDay() + 6) % 7));
  const endDay   = new Date(lastDayOfMonth);  endDay.setDate(lastDayOfMonth.getDate() + (6 - ((lastDayOfMonth.getDay() + 6) % 7)));

  function getLocalDateKey(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d2 = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d2}`;
  }

  const weeks: Array<Array<{date: Date; inMonth: boolean; ok: boolean; isToday: boolean}>> = [];
  let d = new Date(startDay);
  while (d <= endDay) {
    const week: any[] = [];
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = getLocalDateKey(cellDate);
      week.push({
        date: cellDate,
        inMonth: cellDate.getMonth() === month.getMonth(),
        ok: !!byDayMap[key],
        isToday: cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear(),
      });
      d.setDate(d.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(month);
  const todayBg = DARK ? '#2A2A30' : '#e0f7fa';

  return (
    <View style={{ marginVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Text
          style={{ fontSize: 18, marginRight: 16, color: textColor }}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          {'<'}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center', color: textColor }}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </Text>
        <Text
          style={{ fontSize: 18, marginLeft: 16, color: textColor }}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          {'>'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <Text key={i} style={{ width: 28, textAlign: 'center', fontWeight: 'bold', fontSize: 12, color: textColor }}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          {week.map((day, di) => (
            <View
              key={di}
              style={{
                width: 28,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                backgroundColor: day.isToday ? todayBg : undefined,
                opacity: day.inMonth ? 1 : 0.4,
                paddingVertical: 2,
              }}
            >
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, lineHeight: 16, color: textColor }}>{day.date.getDate()}</Text>
                {day.ok && (
                  <Text style={{ color: '#25D366', fontWeight: 'bold', fontSize: 16, lineHeight: 16, marginTop: 0 }}>✔️</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* Helpers */
const parseISO = (iso?: string) => (iso ? new Date(iso) : undefined);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { marginBottom: 12, borderRadius: 12 },
  placeholder: { opacity: 0.7, fontSize: 12, marginTop: 6 },
});

export default function ModalScreen() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const theme = useTheme();
  const DARK = theme.dark;

  // Fond global du modal
  const bgColor = DARK ? '#1A1A1E' : theme.colors.background;
  // Fond des blocs (Cards)
  const cardColor = DARK ? '#303030' : '#FFFFFF';
  // Couleur du texte
  const textColor = DARK ? '#FFFFFF' : '#000000';

  const [dreams, setDreams] = useState<DreamData[]>([]);

  useEffect(() => {
    (async () => {
      const arr = (await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
      setDreams(arr);
      if (arr.length && !startDate) {
        const first = arr.reduce((min, d) => {
          const date = parseISO((d as any).dateISO) || new Date();
          return date < min ? date : min;
        }, new Date());
        setStartDate(first);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dreamsFiltered = useMemo(() => {
    if (!startDate) return dreams;
    return dreams.filter((d) => {
      const date = parseISO((d as any).dateISO);
      return date && date >= startDate;
    });
  }, [dreams, startDate]);

  const typeLabels = ['lucid', 'nightmare', 'pleasant'] as const;
  const typeLabelsFr: Record<(typeof typeLabels)[number], string> = { lucid: 'Lucide', nightmare: 'Cauchemar', pleasant: 'Agréable' };
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { lucid: 0, nightmare: 0, pleasant: 0 };
    dreamsFiltered.forEach((d) => {
      const t = (d as any).dreamType || 'pleasant';
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [dreamsFiltered]);

  function getLocalDateKey(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d2 = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d2}`;
  }
  const byDayMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    dreamsFiltered.forEach((d) => {
      const date = parseISO((d as any).dateISO);
      if (date) map[getLocalDateKey(date)] = true;
    });
    return map;
  }, [dreamsFiltered]);

  const maxDate = useMemo(() => {
    if (!dreamsFiltered.length) return new Date();
    return dreamsFiltered.reduce((max, d) => {
      const date = parseISO((d as any).dateISO) || new Date();
      return date > max ? date : max;
    }, new Date(0));
  }, [dreamsFiltered]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={DARK ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h1, { color: textColor }]}>Statistiques</Text>

        {/* Sélecteur de date */}
        <Card style={[styles.card, { backgroundColor: cardColor }]}>
          <Card.Title title="Date de début" titleStyle={{ color: textColor }} />
          <Card.Content>
            <Text style={{ color: textColor, marginBottom: 8 }}>
              {startDate ? startDate.toLocaleDateString('fr-FR') : 'Non définie'}
            </Text>
            <Text style={{ color: '#4DA3FF' }} onPress={() => setShowPicker(true)}>
              Changer la date
            </Text>
            {showPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowPicker(false);
                  if (date) setStartDate(date);
                }}
                maximumDate={new Date()}
                {...(DARK && Platform.OS === 'ios' ? { themeVariant: 'dark' as const } : {})}
              />
            )}
          </Card.Content>
        </Card>

        {/* Répartition des types (camembert) */}
        <Card style={[styles.card, { backgroundColor: cardColor }]}>
          <Card.Title title="Répartition des types de rêve" titleStyle={{ color: textColor }} />
          <Card.Content>
            {Object.values(typeCounts).some((v) => v > 0) ? (
              <PieChart
                data={typeLabels.map((t, i) => ({
                  name: typeLabelsFr[t],
                  population: typeCounts[t],
                  color: ['#59BA4A', '#FF4D4D', '#C181C7'][i],
                  legendFontColor: textColor,
                  legendFontSize: 14,
                }))}
                width={Dimensions.get('window').width - 48}
                height={180}
                chartConfig={{
                  backgroundGradientFrom: cardColor,
                  backgroundGradientTo: cardColor,
                  color: () => textColor,
                  labelColor: () => textColor,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
            ) : (
              <Text style={[styles.placeholder, { color: textColor }]}>Aucun rêve pour cette période</Text>
            )}
          </Card.Content>
        </Card>

        {/* Calendrier mensuel */}
        <Card style={[styles.card, { backgroundColor: cardColor }]}>
          <Card.Title title="Calendrier des rêves" titleStyle={{ color: textColor }} />
          <Card.Content>
            <CalendarMonth byDayMap={byDayMap} initialMonth={maxDate} />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
