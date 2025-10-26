// app/(tabs)/three.tsx

import { Text, View } from '@/components/Themed';
import { StyleSheet } from 'react-native';

export default function TabThreeScreen() {
  return (
    <View style={styles.container}>
          <View style={styles.separator} />
          <Text style={styles.title}>Accueil</Text>
          <View style={styles.separator} />
          </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
  marginVertical: 10,
  height: 0,
  width: '80%',
},
});
