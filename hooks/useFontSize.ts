import { useSettingsStore } from '@store/settingsStore';

// 기본 폰트 크기 기준값 (medium 사이즈일 때)
const BASE_FONT_SIZES = {
  tiny: 10,
  small: 12,
  normal: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
  xxlarge: 24,
  xxxlarge: 32,
};

// 폰트 크기 배율 (사용자 설정에 따라)
const FONT_SIZE_SCALE = {
  small: 0.9,  // 더 작게
  medium: 1.0, // 기본
  large: 1.5,  // 더 크게
};

// 특정 text 스타일에 폰트 크기를 적용하는 함수
export const getFontSizeStyle = (baseSize: keyof typeof BASE_FONT_SIZES) => {
  const { fontSize } = useSettingsStore.getState();
  const scale = FONT_SIZE_SCALE[fontSize] || 1.0;
  
  return {
    fontSize: Math.round(BASE_FONT_SIZES[baseSize] * scale),
  };
};

// 모든 텍스트 스타일에 폰트 크기 적용하는 함수
export const applyFontSize = (styles: Record<string, any>) => {
  const { fontSize } = useSettingsStore.getState();
  const scale = FONT_SIZE_SCALE[fontSize] || 1.0;
  
  const newStyles: Record<string, any> = {};
  
  // 모든 스타일을 순회하면서 fontSize가 있는 스타일에 배율 적용
  for (const key in styles) {
    if (Object.hasOwn(styles, key)) {
      const style = styles[key];
      
      if (style && typeof style === 'object' && 'fontSize' in style) {
        const originalFontSize = style.fontSize;
        newStyles[key] = {
          ...style,
          fontSize: Math.round(originalFontSize * scale),
        };
      } else {
        newStyles[key] = style;
      }
    }
  }
  
  return newStyles;
};

// 특정 크기 폰트의 크기를 가져오는 함수 (동적 스타일에 사용)
export const getFontSize = (baseSize: keyof typeof BASE_FONT_SIZES) => {
  const { fontSize } = useSettingsStore.getState();
  const scale = FONT_SIZE_SCALE[fontSize] || 1.0;
  return Math.round(BASE_FONT_SIZES[baseSize] * scale);
};

// 아이콘 크기를 계산하는 함수 - 폰트 크기 설정에 따라 비례하게 조정
export const getIconSize = (baseSize: number) => {
  const { fontSize } = useSettingsStore.getState();
  const scale = FONT_SIZE_SCALE[fontSize] || 1.0;
  return Math.round(baseSize * scale);
};

// 폰트 크기 설정에 따른 Hook
export const useFontSize = () => {
  const fontSize = useSettingsStore(state => state.fontSize);
  
  const getSize = (baseSize: keyof typeof BASE_FONT_SIZES) => {
    const scale = FONT_SIZE_SCALE[fontSize] || 1.0;
    return Math.round(BASE_FONT_SIZES[baseSize] * scale);
  };
  
  // 아이콘 크기 동적 계산 함수
  const getIconSize = (baseSize: number) => {
    const scale = FONT_SIZE_SCALE[fontSize] || 1.0;
    return Math.round(baseSize * scale);
  };
  
  return {
    fontSize,
    getSize,
    getIconSize, // 아이콘 크기 계산 함수 노출
    baseSize: BASE_FONT_SIZES,
    tiny: getSize('tiny'),
    small: getSize('small'),
    normal: getSize('normal'),
    medium: getSize('medium'),
    large: getSize('large'),
    xlarge: getSize('xlarge'),
    xxlarge: getSize('xxlarge'),
    xxxlarge: getSize('xxxlarge'),
  };
};
