/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  
  // 🔧 수정: 타입 가드를 사용하여 theme이 유효한 키인지 확인
  const colorFromProps = theme in props ? props[theme as keyof typeof props] : undefined;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // 🔧 수정: theme이 'light' 또는 'dark'인지 확인하고 안전하게 접근
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    return Colors[validTheme][colorName];
  }
}
