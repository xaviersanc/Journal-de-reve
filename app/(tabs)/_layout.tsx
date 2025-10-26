import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={25} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>

        

      <Tabs.Screen
        name="three"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>   
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="bar-chart"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Enregistrer un rêve',
          tabBarIcon: ({ color }) => <TabBarIcon name="cloud" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>   
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="bar-chart"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />



      
      <Tabs.Screen
        name="two"
        options={{
          title: 'Liste des rêves',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>   
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="bar-chart"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />


    </Tabs>
  );
}
