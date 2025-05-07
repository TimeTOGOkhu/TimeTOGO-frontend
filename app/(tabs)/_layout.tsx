import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', }} edges={['bottom']}>
      <Tabs initialRouteName='explore'
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'explore') {
              iconName = 'map';
            } else if (route.name === 'favorite') {
              iconName = 'star';
            } else if (route.name === 'settings') {
              iconName = 'settings';
            }
            return <Feather name={iconName as any} size={28} color={color} />;
          },
          tabBarActiveTintColor: '#3457D5',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', marginTop: 3 },
          tabBarStyle: { height: 64, width: '100%', paddingTop: 3 },
        })}
      >
        <Tabs.Screen
          name="explore"
          options={{
            title: '경로 탐색',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="favorite"
          options={{
            title: '즐겨찾기',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            tabBarItemStyle: { display: "none" },
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
