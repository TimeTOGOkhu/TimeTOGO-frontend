import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setCustomText } from "react-native-global-props";
import 'react-native-reanimated';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Pretendard_Black: require('../assets/fonts/Pretendard-Black.otf'),
    Pretendard_Bold: require('../assets/fonts/Pretendard-Bold.otf'),
    Pretendard_ExtraBold: require('../assets/fonts/Pretendard-ExtraBold.otf'),
    Pretendard_ExtraLight: require('../assets/fonts/Pretendard-ExtraLight.otf'),
    Pretendard_Light: require('../assets/fonts/Pretendard-Light.otf'),
    Pretendard_Medium: require('../assets/fonts/Pretendard-Medium.otf'),
    Pretendard_Regular: require('../assets/fonts/Pretendard-Regular.otf'),
    Pretendard_SemiBold: require('../assets/fonts/Pretendard-SemiBold.otf'),
    Pretendard_Thin: require('../assets/fonts/Pretendard-Thin.otf'),
  });
  
  const customTextProps = {
    style: {
      fontFamily: "Pretendard_Regular",
    },
  };
  setCustomText(customTextProps);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="result" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
  );
}
