// app/(modals)/StatsModal.tsx
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, useTheme } from 'react-native-paper';
import * as VictoryNative from 'victory-native';
const Victory: any = VictoryNative;

// ====== Fonctions utilitaires ======
const startOfWeek = (d: Date) => {
  const n = new Date(d);
  const day = (n.getDay() + 6) % 7; // lundi=0
  n.setDate(n.getDate() - day);
  n.setHours(0, 0, 0, 0);
  return n;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const fmtDay = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
const fmtMonth = (d: Date) => new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(d);
const parseISO = (iso?: string) => (iso ? new Date(iso) : undefined);
const moonPhase = (date: Date) => {
  const synodic = 29.530588853;
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime() / 86400000;
  const days = date.getTime() / 86400000 - knownNewMoon;
  const phase = ((days % synodic) + synodic) % synodic;
  return phase / synodic; // 0 nouvelle lune, ~0.5 pleine lune
};
const topN = (arr: string[], n: number) =>
  Object.entries(
    arr.map((s) => s?.trim()).filter(Boolean).reduce<Record<string, number>>((acc, v) => {
      acc[v!] = (acc[v!] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));

// ====== Composant Heatmap calendrier (30 jours) ======
// Affiche un calendrier sur 30 jours avec un "ok" vert (✔️) sur chaque jour où un rêve a été validé.
function CalendarHeatmap({ byDayMap }: { byDayMap: Map<string, number> }) {
  const today = new Date();
  const days: { key: string; date: Date; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, date: d, count: byDayMap.get(key) || 0 });
  }
  const cols = 6;
  const rows = 5;
  const grid: Array<Array<{ key: string; date: Date; count: number }>> = [];
  for (let r = 0; r < rows; r++) grid[r] = [];
  days.forEach((item, idx) => {
    const r = Math.floor(idx / cols);
    grid[r].push(item);
  });

  return (
    <View style={{ alignSelf: 'stretch' }}>
      {grid.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', marginBottom: 6 }}>
          {row.map((c) => (
            <View
              key={c.key}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                marginRight: 6,
                backgroundColor: '#e0e0e0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {c.count > 0 ? (
                <ThemedText style={{ color: 'green', fontSize: 18 }}>✔️</ThemedText>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ====== Composant principal : StatsModal ======
export default function StatsModal() {
  const theme = useTheme();
  const [dreams, setDreams] = useState<DreamData[]>([]);

  useEffect(() => {
    (async () => {
      const arr = (await AsyncStorageService.getData(
        AsyncStorageConfig.keys.dreamsArrayKey
      )) || [];
      setDreams(arr);
    })();
  }, []);

  // Normalisation robuste des données de rêve (garde les entrées valides)
  const rows = useMemo(() => {
    return dreams
      .map((d) => {
        const date =
          parseISO(d.dateISO) ??
          (d.dateDisplay
            ? (() => {
                const [dd, mm, yyyy] = d.dateDisplay.split('/');
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
          character: (d as any).character as string | undefined,
          location: (d as any).location as string | undefined,
          tags: (d as any).tags as string[] | undefined,
          text: d.dreamText || '',
          phase: date ? moonPhase(date) : undefined,
        };
      })
      .filter((r) => r.date); // sans date → pas de courbe/agrégat temporel possible
  }, [dreams]);

  // Compteurs simples pour l’aperçu rapide
  const total = dreams.length;
  const withDate = rows.length;

  // Agrégations temporelles et catégorielles
  // Nombre de rêves par semaine
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

  // Nombre de rêves par mois
  const perMonth = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.month) return;
      const k = r.month.toISOString();
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .map(([k, count]) => ({ x: new Date(k), y: count }))
      .sort((a, b) => +a.x - +b.x);
  }, [rows]);

  // Répartition des types de rêves
  const typePie = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const t = r.type ?? 'autres';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([x, y]) => ({ x, y }));
  }, [rows]);

  // Extraction des mots fréquents dans les textes de rêve (hors stopwords)
  const frequentWords = useMemo(() => {
    const stop = new Set(['le','la','les','de','des','et','un','une','du','en','à','au','aux','que','qui','dans','pour','avec','sur']);
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

  // Mapping des jours (YYYY-MM-DD) vers le nombre de rêves ce jour-là
  const byDayMap = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.date!.toISOString().slice(0, 10);
      m.set(key, (m.get(key) || 0) + 1);
    });
    return m;
  }, [rows]);

  // Série temporelle Intensité/Qualité pour les courbes
  const seriesLine = useMemo(() => {
    return rows
      .filter((r) => typeof r.intensity === 'number' && typeof r.quality === 'number')
      .sort((a, b) => +a.date! - +b.date!)
      .map((r) => ({ date: r.date!, intensity: r.intensity!, quality: r.quality! }));
  }, [rows]);

  // Top 5 personnages, lieux et tags les plus récurrents
  const topCharacters = useMemo(() => topN(rows.map((r) => r.character || '').filter(Boolean), 5), [rows]);
  const topLocations = useMemo(() => topN(rows.map((r) => r.location || '').filter(Boolean), 5), [rows]);
  const topTags = useMemo(() => topN(rows.flatMap((r) => r.tags || []), 5), [rows]);

  // Corrélation : intensité moyenne (proxy clarté) par type de rêve
  const corrClarityVsType = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    rows.forEach((r) => {
      const t = r.type ?? 'autres';
      const val = typeof r.intensity === 'number' ? r.intensity : undefined; // proxy de clarté
      if (typeof val === 'number') (buckets[t] ||= []).push(val);
    });
    return Object.entries(buckets).map(([t, arr]) => ({
      x: t,
      y: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
    }));
  }, [rows]);

  // Corrélation : qualité moyenne par type de rêve
  const corrToneVsQuality = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    rows.forEach((r) => {
      const t = r.type ?? 'autres';
      const q = typeof r.quality === 'number' ? r.quality : undefined;
      if (typeof q === 'number') (buckets[t] ||= []).push(q);
    });
    return Object.entries(buckets).map(([t, arr]) => ({
      x: t,
      y: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
    }));
  }, [rows]);

  // Corrélation : fréquence des rêves selon les phases lunaires
  const corrFreqVsMoon = useMemo(() => {
    const buckets = [0, 0, 0, 0]; // Q1..Q4
    rows.forEach((r) => {
      if (typeof r.phase !== 'number') return;
      const q = Math.min(3, Math.floor(r.phase * 4));
      buckets[q] += 1;
    });
    return buckets.map((v, i) => ({ x: `Q${i + 1}`, y: v }));
  }, [rows]);

  const colors = {
    onSurface: theme.colors.onSurface,
  };

  const noData = withDate === 0;

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
  <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.h1}>Statistiques</ThemedText>

        {/* Résumé minimal — toujours visible */}
        <Card style={styles.card}>
          <Card.Title title="Aperçu rapide" />
          <Card.Content>
            <ThemedText>Total de rêves enregistrés : {total}</ThemedText>
            <ThemedText>Dont datés (utilisables) : {withDate}</ThemedText>
            {noData && (
              <ThemedText style={{ marginTop: 6, opacity: 0.7 }}>
                Ajoute des rêves avec une date pour afficher les graphiques.
              </ThemedText>
            )}
          </Card.Content>
        </Card>

        {/* Nombre de rêves / semaine */}
        <Card style={styles.card}>
          <Card.Title title="Nombre de rêves / semaine" />
          <Card.Content>
            {perWeek.length ? (
              <Victory.VictoryChart domainPadding={{ x: 12, y: 12 }}>
                <Victory.VictoryAxis
                  tickFormat={(t: any) => fmtDay(new Date(t))}
                  style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }}
                />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryBar data={perWeek} labels={({ datum }: { datum: any }) => datum.y} labelComponent={<Victory.VictoryTooltip />} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Aucune donnée hebdomadaire</ThemedText>
            )}
          </Card.Content>
        </Card>

        {/* Nombre de rêves / mois */}
        <Card style={styles.card}>
          <Card.Title title="Nombre de rêves / mois" />
          <Card.Content>
            {perMonth.length ? (
              <Victory.VictoryChart domainPadding={{ x: 18, y: 12 }}>
                <Victory.VictoryAxis
                  tickFormat={(t: any) => fmtMonth(new Date(t))}
                  style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }}
                />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryBar data={perMonth} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Aucune donnée mensuelle</ThemedText>
            )}
          </Card.Content>
        </Card>

        {/* Répartition des types (barres) */}
        <Card style={styles.card}>
          <Card.Title title="Nombre de chaque type de rêve" />
          <Card.Content>
            {typePie.some((d) => d.y > 0) ? (
              <Victory.VictoryChart domainPadding={{ x: 30, y: 12 }}>
                <Victory.VictoryAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryBar data={typePie} labels={({ datum }: { datum: any }) => datum.y} labelComponent={<Victory.VictoryTooltip />} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Aucun type disponible</ThemedText>
            )}
          </Card.Content>
        </Card>

        {/* “Émotions” → mots-clés du texte */}
        <Card style={styles.card}>
          <Card.Title title="Éléments récurrents (texte)" />
          <Card.Content>
            {frequentWords.length ? (
              <Victory.VictoryChart domainPadding={{ x: 20, y: 12 }}>
                <Victory.VictoryAxis
                  tickFormat={(t: any) => String(t)}
                  style={{ tickLabels: { angle: -30, fontSize: 10, fill: colors.onSurface } }}
                />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10, fill: colors.onSurface } }} />
                <Victory.VictoryBar data={frequentWords} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Pas assez de texte pour analyser</ThemedText>
            )}
          </Card.Content>
        </Card>

        {/* Heatmap calendrier */}
        <Card style={styles.card}>
          <Card.Title title="Heatmap calendrier (30 jours)" />
          <Card.Content>
            {withDate ? <CalendarHeatmap byDayMap={byDayMap} /> : <ThemedText style={styles.placeholder}>Aucune donnée datée</ThemedText>}
          </Card.Content>
        </Card>

        {/* Intensité / Qualité */}
        <Card style={styles.card}>
          <Card.Title title="Intensité / Qualité dans le temps" />
          <Card.Content>
            {seriesLine.length ? (
              <Victory.VictoryChart domainPadding={{ x: 16, y: 12 }}>
                <Victory.VictoryAxis tickFormat={(t: any) => fmtDay(new Date(t))} style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryGroup>
                  <Victory.VictoryLine data={seriesLine.map((p) => ({ x: p.date, y: p.intensity }))} />
                  <Victory.VictoryScatter data={seriesLine.map((p) => ({ x: p.date, y: p.intensity }))} />
                  <Victory.VictoryLine data={seriesLine.map((p) => ({ x: p.date, y: p.quality }))} />
                  <Victory.VictoryScatter data={seriesLine.map((p) => ({ x: p.date, y: p.quality }))} />
                </Victory.VictoryGroup>
                <Victory.VictoryLegend x={50} orientation="horizontal" gutter={20} data={[{ name: 'Intensité' }, { name: 'Qualité' }]} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Aucune donnée d’intensité/qualité</ThemedText>
            )}
          </Card.Content>
        </Card>

        {/* Top */}
        <Card style={styles.card}>
          <Card.Title title="Top personnages / lieux / tags" />
          <Card.Content>
            <ThemedText style={styles.topLine}>
              Personnages: {topCharacters.map((t) => `${t.name} (${t.count})`).join(', ') || '—'}
            </ThemedText>
            <Divider style={{ marginVertical: 6, opacity: 0.4 }} />
            <ThemedText style={styles.topLine}>
              Lieux: {topLocations.map((t) => `${t.name} (${t.count})`).join(', ') || '—'}
            </ThemedText>
            <Divider style={{ marginVertical: 6, opacity: 0.4 }} />
            <ThemedText style={styles.topLine}>
              Tags: {topTags.map((t) => `#${t.name} (${t.count})`).join(', ') || '—'}
            </ThemedText>
          </Card.Content>
        </Card>

        {/* Corrélations */}
        <Card style={styles.card}>
          <Card.Title title="Corrélations simples" />
          <Card.Content>
            <ThemedText style={styles.subH}>Clarté ↔ Type (proxy : intensité moyenne)</ThemedText>
            {corrClarityVsType.length ? (
              <Victory.VictoryChart domainPadding={{ x: 20, y: 12 }}>
                <Victory.VictoryAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryBar data={corrClarityVsType} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Insuffisant</ThemedText>
            )}

            <ThemedText style={styles.subH}>Tonalité ↔ Qualité (moy. par type)</ThemedText>
            {corrToneVsQuality.length ? (
              <Victory.VictoryChart domainPadding={{ x: 20, y: 12 }}>
                <Victory.VictoryAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryBar data={corrToneVsQuality} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Insuffisant</ThemedText>
            )}

            <ThemedText style={styles.subH}>(Bonus) Fréquence ↔ Phases lunaires</ThemedText>
            {corrFreqVsMoon.some((d) => d.y > 0) ? (
              <Victory.VictoryChart domainPadding={{ x: 20, y: 12 }}>
                <Victory.VictoryAxis
                  tickFormat={(t: any) => ({ Q1: 'Nouv.', Q2: 'Croiss.', Q3: 'Pleine', Q4: 'Décroiss.' } as any)[t] || t}
                  style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }}
                />
                <Victory.VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10 } }} />
                <Victory.VictoryBar data={corrFreqVsMoon} />
              </Victory.VictoryChart>
            ) : (
              <ThemedText style={styles.placeholder}>Aucun signal</ThemedText>
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { marginBottom: 12, borderRadius: 12 },
  placeholder: { opacity: 0.7, fontSize: 12 },
  subH: { marginTop: 8, marginBottom: 4, fontWeight: '600' },
  topLine: { fontSize: 13 },
});
