// app/modal.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PieChart } from 'react-native-chart-kit';

/**
 * Composant de statistiques et calendrier des rêves
 * Affiche :
 *  - Un sélecteur de date de début
 *  - Un graphique à barres du nombre de chaque type de rêve (lucide, cauchemar, agréable)
 *  - Un calendrier mensuel avec navigation, montrant les jours où un rêve a été renseigné
 *
 * Compatible Expo Go
 */

// ────────────── Composant calendrier mensuel avec navigation ──────────────
/**
 * Affiche un calendrier mensuel avec navigation par mois et un "ok" vert sous les jours où un rêve a été renseigné.
 * @param byDayMap map des jours renseignés (clé AAAA-MM-JJ locale)
 * @param initialMonth mois affiché au départ
 */
// Calendrier mensuel avec navigation par mois et "ok" vert sur les jours renseignés
type CalendarMonthProps = {
  byDayMap: Record<string, boolean>;
  initialMonth: Date;
};
function CalendarMonth({ byDayMap, initialMonth }: CalendarMonthProps) {
  const [month, setMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const today = new Date();
  // Calcul du premier jour à afficher (début de la semaine du 1er du mois)
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startDay = new Date(firstDayOfMonth);
  startDay.setDate(1 - ((firstDayOfMonth.getDay() + 6) % 7)); // Lundi = 0
  const endDay = new Date(lastDayOfMonth);
  endDay.setDate(lastDayOfMonth.getDate() + (6 - ((lastDayOfMonth.getDay() + 6) % 7)));

  // Génère toutes les semaines du mois (chaque case = un jour, chaque semaine = 7 cases)
  const weeks = [];
  // Helper pour clé locale AAAA-MM-JJ
  function getLocalDateKey(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d2 = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d2}`;
  }

  let d = new Date(startDay);
  while (d <= endDay) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      // Cloner la date AVANT toute modification
      const cellDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = getLocalDateKey(cellDate);
      week.push({
        date: cellDate,
        inMonth: cellDate.getMonth() === month.getMonth(),
        ok: !!byDayMap[key],
        isToday:
          cellDate.getDate() === today.getDate() &&
          cellDate.getMonth() === today.getMonth() &&
          cellDate.getFullYear() === today.getFullYear(),
      });
      d.setDate(d.getDate() + 1);
    }
    weeks.push(week);
  }

  // Libellé du mois affiché (ex: "octobre 2025")
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(month);

  // Rendu du calendrier
  return (
    <View style={{ marginVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 18, marginRight: 16 }} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{'<'}</Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</Text>
        <Text style={{ fontSize: 18, marginLeft: 16 }} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{'>'}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <Text key={i} style={{ width: 28, textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}>{d}</Text>
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
                backgroundColor: day.isToday ? '#e0f7fa' : undefined,
                opacity: day.inMonth ? 1 : 0.4,
                paddingVertical: 2,
              }}
            >
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, lineHeight: 16 }}>{day.date.getDate()}</Text>
                {day.ok && (
                  <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 16, lineHeight: 16, marginTop: 0 }}>✔️</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Helpers
const startOfWeek = (d: Date) => {
  const n = new Date(d);
  const day = (n.getDay() + 6) % 7;
  n.setDate(n.getDate() - day);
  n.setHours(0, 0, 0, 0);
  return n;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const fmtDay = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
const fmtMonth = (d: Date) => new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(d);
const parseISO = (iso?: string) => (iso ? new Date(iso) : undefined);



// ...helpers et CalendarOk...

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { marginBottom: 12, borderRadius: 12 },
  placeholder: { opacity: 0.7, fontSize: 12, marginTop: 6 },
});
export default function ModalScreen() {
  // Sélection de la date de début
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const theme = useTheme();
  const textColor = theme.dark ? '#FFFFFF' : '#000000';
  const [dreams, setDreams] = useState<DreamData[]>([]);

  useEffect(() => {
    (async () => {
      const arr =
        (await AsyncStorageService.getData(
          AsyncStorageConfig.keys.dreamsArrayKey
        )) || [];
      setDreams(arr);
      if (arr.length && !startDate) {
        // Par défaut, date du premier rêve
        const first = arr.reduce((min, d) => {
          const date = parseISO((d as any).dateISO) || new Date();
          return date < min ? date : min;
        }, new Date());
        setStartDate(first);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Filtrage des rêves à partir de la date choisie
  const dreamsFiltered = useMemo(() => {
    if (!startDate) return dreams;
    return dreams.filter((d) => {
      const date = parseISO((d as any).dateISO);
      return date && date >= startDate;
    });
  }, [dreams, startDate]);

  // Comptage par type
  // ────────────── Préparation des données pour le graphique ──────────────
  // Toujours afficher les 3 types de rêves, même à 0
  /**
   * Liste des types de rêves (clé et label français)
   */
  const typeLabels = ['lucid', 'nightmare', 'pleasant'] as const;
  const typeLabelsFr: Record<typeof typeLabels[number], string> = {
    lucid: 'Lucide',
    nightmare: 'Cauchemar',
    pleasant: 'Agréable',
  };
  /**
   * Calcule le nombre de rêves de chaque type sur la période filtrée
   */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { lucid: 0, nightmare: 0, pleasant: 0 };
    dreamsFiltered.forEach((d) => {
      // On prend d.dreamType (voir DreamForm)
      const t = (d as any).dreamType || 'pleasant';
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [dreamsFiltered]);

  // Pour le calendrier : map des jours avec rêve
  /**
   * Génère une clé locale AAAA-MM-JJ pour une date (évite les bugs de fuseau horaire)
   */
  function getLocalDateKey(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d2 = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d2}`;
  }

  /**
   * Map des jours où un rêve a été renseigné (clé locale AAAA-MM-JJ)
   */
  const byDayMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    dreamsFiltered.forEach((d) => {
      const date = parseISO((d as any).dateISO);
      if (date) {
        const key = getLocalDateKey(date);
        map[key] = true;
      }
    });
    return map;
  }, [dreamsFiltered]);

  // ────────────── Calcul des bornes min/max pour le calendrier ──────────────
  const minDate = useMemo(() => {
    if (!dreamsFiltered.length) return new Date();
    return dreamsFiltered.reduce((min, d) => {
      const date = parseISO((d as any).dateISO) || new Date();
      return date < min ? date : min;
    }, new Date());
  }, [dreamsFiltered]);
  const maxDate = useMemo(() => {
    if (!dreamsFiltered.length) return new Date();
    return dreamsFiltered.reduce((max, d) => {
      const date = parseISO((d as any).dateISO) || new Date();
      return date > max ? date : max;
    }, new Date(0));
  }, [dreamsFiltered]);


  // ────────────── Rendu principal ──────────────

  /**
   * Rendu principal du composant ModalScreen
   */
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h1, { color: textColor }]}>Statistiques</Text>

        {/* Sélecteur de date */}
        <Card style={styles.card}>
          <Card.Title title="Date de début" titleStyle={{ color: textColor }} />
          <Card.Content>
            <Text style={{ color: textColor, marginBottom: 8 }}>
              {startDate ? startDate.toLocaleDateString('fr-FR') : 'Non définie'}
            </Text>
            <Text style={{ color: '#2196f3' }} onPress={() => setShowPicker(true)}>
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
              />
            )}
          </Card.Content>
        </Card>

        {/* Graphique camembert de la répartition des types de rêve */}
        <Card style={styles.card}>
          <Card.Title title="Répartition des types de rêve" titleStyle={{ color: textColor }} />
          <Card.Content>
            {Object.values(typeCounts).some((v) => v > 0) ? (
              <PieChart
                data={typeLabels.map((t, i) => ({
                  name: typeLabelsFr[t],
                  population: typeCounts[t],
                  color: ["#4fc3f7", "#ffb74d", "#81c784"][i],
                  legendFontColor: textColor,
                  legendFontSize: 14,
                }))}
                width={Dimensions.get('window').width - 48}
                height={180}
                chartConfig={{
                  color: () => textColor,
                  labelColor: () => textColor,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                absolute
              />
            ) : (
              <Text style={[styles.placeholder, { color: textColor }]}>Aucun rêve pour cette période</Text>
            )}
          </Card.Content>
        </Card>

        {/* Calendrier mensuel complet avec navigation */}
        <Card style={styles.card}>
          <Card.Title title="Calendrier des rêves" titleStyle={{ color: textColor }} />
          <Card.Content>
            <CalendarMonth byDayMap={byDayMap} initialMonth={maxDate} />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
