// app/modal.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

// Gestion Victory
let Victory: any = null;
try {
  Victory = Platform.OS === 'web' ? require('victory') : require('victory-native');
} catch {}

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
const HAS_VICTORY = Victory?.VictoryChart && Victory?.VictoryBar;


export default function ModalScreen() {
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
    })();
  }, []);

  const rows = useMemo(() => {
    console.log('Victory loaded:', !!Victory?.VictoryChart);
    return dreams
      .map((d) => {
        const date =
          parseISO((d as any).dateISO) ||
          ((d as any).dateDisplay
            ? (() => {
                const [dd, mm, yyyy] = (d as any).dateDisplay.split('/');
                const y = Number(yyyy),
                  m = Number(mm),
                  day = Number(dd);
                if (!y || !m || !day) return undefined;
                return new Date(y, m - 1, day);
              })()
            : undefined);
        return {
          date,
          week: date ? startOfWeek(date) : undefined,
          month: date ? startOfMonth(date) : undefined,
          type: (d as any).dreamType ?? (d.isLucidDream ? 'lucid' : undefined),
          intensity: (d as any).intensity as number | undefined,
          quality: (d as any).qualityDream as number | undefined,
          text: d.dreamText || '',
        };
      })
      .filter((r) => r.date);
  }, [dreams]);

  const total = dreams.length;
  const withDate = rows.length;

  const perWeek = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.week) return;
      const k = r.week.toISOString();
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .map(([k, count]) => ({ x: new Date(k), y: count }))
      .sort((a, b) => +a.x - +b.x);
  }, [rows]);

  const typePie = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const t = r.type ?? 'autres';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([x, y]) => ({ x, y }));
  }, [rows]);

  const frequentWords = useMemo(() => {
    const stop = new Set([
      'le', 'la', 'les', 'de', 'des', 'et', 'un', 'une', 'du', 'en',
      'à', 'au', 'aux', 'que', 'qui', 'dans', 'pour', 'avec', 'sur'
    ]);
    const bag: Record<string, number> = {};
    rows.forEach((r) => {
      r.text
        .toLowerCase()
        .replace(/[^\p{L}\s-]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w && w.length > 3 && !stop.has(w))
        .forEach((w) => (bag[w] = (bag[w] || 0) + 1));
    });
    return Object.entries(bag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ x: label, y: value }));
  }, [rows]);

  const HAS_VICTORY = Victory?.VictoryChart && Victory?.VictoryBar;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h1, { color: textColor }]}>Statistiques</Text>

        <Card style={styles.card}>
          <Card.Title title="Aperçu rapide" titleStyle={{ color: textColor }} />
          <Card.Content>
            <Text style={{ color: textColor }}>Total de rêves enregistrés : {total}</Text>
            <Text style={{ color: textColor }}>Dont datés (utilisables) : {withDate}</Text>
            {!HAS_VICTORY && (
              <Text style={[styles.placeholder, { color: textColor }]}>
                Graphiques indisponibles : installe `react-native-svg` et `victory-native`.
              </Text>
            )}
          </Card.Content>
        </Card>

        {HAS_VICTORY && (
          <>
            <Card style={styles.card}>
              <Card.Title title="Nombre de rêves / semaine" titleStyle={{ color: textColor }} />
              <Card.Content>
                {perWeek.length ? (
                  <Victory.VictoryChart domainPadding={{ x: 12, y: 12 }}>
                    <Victory.VictoryAxis
                      tickFormat={(t: Date) => fmtDay(new Date(t))}
                      style={{ tickLabels: { fill: textColor, fontSize: 10 } }}
                    />
                    <Victory.VictoryAxis
                      dependentAxis
                      style={{ tickLabels: { fill: textColor, fontSize: 10 } }}
                    />
                    <Victory.VictoryBar data={perWeek} />
                  </Victory.VictoryChart>
                ) : (
                  <Text style={[styles.placeholder, { color: textColor }]}>Aucune donnée hebdomadaire</Text>
                )}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Répartition des types" titleStyle={{ color: textColor }} />
              <Card.Content>
                {typePie.some((d) => d.y > 0) ? (
                  <Victory.VictoryPie
                    data={typePie}
                    innerRadius={50}
                    style={{
                      labels: { fill: textColor, fontSize: 10 }
                    }}
                  />
                ) : (
                  <Text style={[styles.placeholder, { color: textColor }]}>Aucun type disponible</Text>
                )}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Mots récurrents" titleStyle={{ color: textColor }} />
              <Card.Content>
                {frequentWords.length ? (
                  <Victory.VictoryChart domainPadding={{ x: 20, y: 12 }}>
                    <Victory.VictoryAxis
                      tickFormat={(t: string) => String(t)}
                      style={{ tickLabels: { angle: -30, fontSize: 10, fill: textColor } }}
                    />
                    <Victory.VictoryAxis
                      dependentAxis
                      style={{ tickLabels: { fontSize: 10, fill: textColor } }}
                    />
                    <Victory.VictoryBar data={frequentWords} />
                  </Victory.VictoryChart>
                ) : (
                  <Text style={[styles.placeholder, { color: textColor }]}>Pas assez de texte pour analyser</Text>
                )}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { marginBottom: 12, borderRadius: 12 },
  placeholder: { opacity: 0.7, fontSize: 12, marginTop: 6 },
});

