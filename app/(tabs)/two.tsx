import { StyleSheet } from 'react-native';

import DreamList from '@/components/DreamList';
import { Text, View } from '@/components/Themed';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
          <View style={styles.separator} />
          <Text style={styles.title}>Liste de rêves</Text>
          <View style={styles.separator} />
          <DreamList/>
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
