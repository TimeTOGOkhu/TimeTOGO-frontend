// app/_layout.tsx
import {
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // 플랫폼별 폰트 로딩
  const [loaded] = useFonts(
    Platform.OS === 'web' 
      ? {} // 웹에서는 빈 객체
      : {
          // 네이티브에서만 폰트 로딩
          Pretendard_Thin: require('../assets/fonts/Pretendard-Thin.otf'),
          Pretendard_ExtraLight: require('../assets/fonts/Pretendard-ExtraLight.otf'),
          Pretendard_Light: require('../assets/fonts/Pretendard-Light.otf'),
          Pretendard_Regular: require('../assets/fonts/Pretendard-Regular.otf'),
          Pretendard_Medium: require('../assets/fonts/Pretendard-Medium.otf'),
          Pretendard_SemiBold: require('../assets/fonts/Pretendard-SemiBold.otf'),
          Pretendard_Bold: require('../assets/fonts/Pretendard-Bold.otf'),
          Pretendard_ExtraBold: require('../assets/fonts/Pretendard-ExtraBold.otf'),
          Pretendard_Black: require('../assets/fonts/Pretendard-Black.otf'),
          SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        }
  );

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 웹 환경에서만 전역 스타일 추가
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // 기존 스타일 제거
      const existingStyle = document.getElementById('global-web-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // 새 전역 스타일 추가
      const style = document.createElement('style');
      style.id = 'global-web-styles';
      style.textContent = `
        /* 웹용 Pretendard 폰트 로딩 */
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css');
        
        /* Leaflet 지도 스타일 */
        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
          max-width: none !important;
          max-height: none !important;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .leaflet-control-container {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .leaflet-popup-content {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
          margin: 8px 12px !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
        }

        .leaflet-control-zoom a {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
          color: #374151 !important;
          border: none !important;
          background-color: white !important;
        }

        .leaflet-control-zoom a:hover {
          background-color: #F3F4F6 !important;
        }

        .leaflet-control-attribution {
          font-size: 10px !important;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
          background-color: rgba(255, 255, 255, 0.8) !important;
        }

        /* 기본 웹 스타일 */
        body {
          margin: 0;
          padding: 0;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        * {
          box-sizing: border-box;
        }

        /* 웹에서 폰트 패밀리 자동 대체 */
        [style*="fontFamily"], [style*="font-family"] {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }

        /* Pretendard 폰트 가중치 매핑 */
        [style*="Pretendard_Thin"] { font-weight: 100 !important; }
        [style*="Pretendard_ExtraLight"] { font-weight: 200 !important; }
        [style*="Pretendard_Light"] { font-weight: 300 !important; }
        [style*="Pretendard_Regular"] { font-weight: 400 !important; }
        [style*="Pretendard_Medium"] { font-weight: 500 !important; }
        [style*="Pretendard_SemiBold"] { font-weight: 600 !important; }
        [style*="Pretendard_Bold"] { font-weight: 700 !important; }
        [style*="Pretendard_ExtraBold"] { font-weight: 800 !important; }
        [style*="Pretendard_Black"] { font-weight: 900 !important; }
        [style*="SpaceMono"] { 
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace !important; 
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleElement = document.getElementById('global-web-styles');
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [loaded]);

  // 웹에서는 폰트 로딩 없이 바로 렌더링
  if (!loaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="result" options={{ headerShown: false }} />
        <Stack.Screen name="path/[pathid]" options={{ headerShown: false }} /> 
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
