import React, { createContext, useContext, useState } from 'react';
import { Text, TextProps } from 'react-native';

// 🔹 Context 타입 정의
type TextSizeContextType = {
  isLargeText: boolean;
  toggleTextSize: () => void;
};

// 🔹 Context 생성
const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

// 🔹 Provider
export const TextSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLargeText, setIsLargeText] = useState(false);
  const toggleTextSize = () => setIsLargeText(prev => !prev);

  return (
    <TextSizeContext.Provider value={{ isLargeText, toggleTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
};

// 🔹 Hook
export const useTextSize = () => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
};

// ✅ 텍스트 출력 컴포넌트까지 포함시킴
export const TextSize = ({ style, ...props }: TextProps) => {
  const { isLargeText } = useTextSize();

  return (
    <Text
      style={[
        { fontSize: isLargeText ? 24 : 16 }, // ✅ 전역 상태로 크기 결정
        style,
      ]}
      {...props}
    />
  );
};
