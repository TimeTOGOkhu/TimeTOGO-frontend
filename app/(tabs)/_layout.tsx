import { useFontSize } from '@hooks/useFontSize';
import { useTranslation } from '@hooks/useTranslation';
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { getSize } = useFontSize();
  const { t } = useTranslation();

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
          tabBarLabelStyle: { 
            fontSize: getSize('small'), 
            fontWeight: 'bold', 
            marginTop: 3 
          },
          tabBarStyle: {
            height: getSize('small') + 52,
            width: '100%',
            paddingTop: 3 },
        })}
      >
        <Tabs.Screen
          name="explore"
          options={{
            title: t('explore'),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="favorite"
          options={{
            title: t('favorite'),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabSettings'),
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
