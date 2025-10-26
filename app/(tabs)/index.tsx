// app/(tabs)/index.tsx  — version thème Light/Dark
import DreamForm from '@/components/DreamForm';
import { Text, View } from '@/components/Themed';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

export default function TabIndexScreen() {
  const theme = useTheme();
  const DARK = theme.dark;

  // Couleurs selon le thème
  const bgColor    = DARK ? '#1A1A1E' : '#FFFFFF';   // fond global
  const blockColor = DARK ? '#1A1A1E' : '#f0f4ff';   // blocs de lecture
  const textColor  = DARK ? '#FFFFFF' : '#000000';   // texte lisible

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined'|'granted'|'denied'>('undetermined');

  useEffect(() => {
    Notifications.getPermissionsAsync().then(status => {
      setPermissionStatus(status.granted ? 'granted' : (status.denied ? 'denied' : 'undetermined'));
    });
  }, []);

  const enableReminder = async () => {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: askStatus } = await Notifications.requestPermissionsAsync();
      status = askStatus;
    }
    setPermissionStatus(status);
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Note ton rêve !',
        body: 'Pense à enregistrer ton rêve du jour dans le journal.',
      },
      trigger: {
        channelId: 'default',
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
    setReminderEnabled(true);
  };

  const disableReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setReminderEnabled(false);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Bloc Notifications (fond : blockColor en dark) */}
      <View style={[styles.reminderBox, { backgroundColor: blockColor }]}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, color: textColor }}>Notifications et rappels</Text>
        <Text style={{ marginBottom: 8, color: textColor }}>
          Active un rappel quotidien pour ne pas oublier de noter tes rêves chaque matin !
        </Text>

        {reminderEnabled ? (
          <Button mode="contained" onPress={disableReminder}>
            Désactiver le rappel
          </Button>
        ) : (
          <Button mode="contained" onPress={enableReminder} disabled={permissionStatus==='denied'}>
            Activer le rappel quotidien
          </Button>
        )}

        {permissionStatus==='denied' && (
          <Text style={{ color: DARK ? '#ff9e9e' : 'red', marginTop: 8 }}>
            Permission de notifications refusée. Active-la dans les réglages.
          </Text>
        )}
      </View>

      <View style={styles.separator} />

      <Text style={[styles.title, { color: textColor }]}>Enregistrer un rêve</Text>

      <View style={styles.separator} />

      {/* Bloc formulaire (fond : blockColor en dark) */}
      <View style={[styles.formBlock, { backgroundColor: blockColor }]}>
        <DreamForm />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'center',
  },
  separator: {
    marginVertical: 10,
    height: 0,
    width: '80%',
  },
  reminderBox: {
    width: '90%',
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  formBlock: {
    width: '90%',
    borderRadius: 12,
    paddingVertical: 8, // le DreamForm a déjà ses propres paddings
    overflow: 'hidden',
    // Pas d’ombre en dark (écrase légèrement l’élévation pour Android)
    elevation: 0,
  },
});
