import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { useFontSize } from '@hooks/useFontSize';

// 이 컴포넌트는 폰트 크기 설정에 따라 자동으로 크기가 조절되는 아이콘을 제공합니다.
interface DynamicIconProps {
  name: React.ComponentProps<typeof Feather>['name'];
  size?: number; // 기본 크기 (조정 전)
  color?: string;
  style?: any;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  size = 20, // 기본 크기
  color,
  style,
}) => {
  const { getIconSize } = useFontSize();
  
  // 폰트 크기 설정에 따라 아이콘 크기 계산
  const dynamicSize = getIconSize(size);
  
  return (
    <Feather
      name={name}
      size={dynamicSize}
      color={color}
      style={style}
    />
  );
};
