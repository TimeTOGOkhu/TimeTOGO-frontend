// hooks/useColorScheme.ts
import { Platform } from 'react-native';

export function useColorScheme() {
  // 웹에서는 항상 light 모드 반환
  if (Platform.OS === 'web') {
    return 'light' as const;
  }
  
  // 네이티브에서만 실제 useColorScheme 사용
  try {
    const { useColorScheme: useNativeColorScheme } = require('react-native');
    return useNativeColorScheme() ?? 'light';
  } catch {
    return 'light' as const;
  }
}
