import DreamForm from '@/components/DreamForm';
import { Text, View } from '@/components/Themed';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

export default function TabIndexScreen() {
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
        weekday: undefined, // pour tous les jours
      },
    });
    setReminderEnabled(true);
  };

  const disableReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setReminderEnabled(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.reminderBox}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Notifications et rappels</Text>
        <Text style={{ marginBottom: 8 }}>
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
          <Text style={{ color: 'red', marginTop: 8 }}>Permission de notifications refusée. Active-la dans les réglages.</Text>
        )}
      </View>
      <View style={styles.separator} />
      <Text style={styles.title}>Enregistrer un rêve</Text>
      <View style={styles.separator} />
      <DreamForm />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  separator: {
    marginVertical: 10,
    height: 0,
    width: '80%',
  },
  reminderBox: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    elevation: 2,
  },
});