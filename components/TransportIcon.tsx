import React from 'react';
import { StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFontSize } from '@hooks/useFontSize';

type IconLibrary = 'feather' | 'ionicons';

interface TransportIconProps {
  type: string; // BUS, SUBWAY, HEAVY_RAIL, TRAM, WALKING 등
  size?: number;
  color?: string;
  style?: any;
}

export const TransportIcon: React.FC<TransportIconProps> = ({
  type,
  size = 20,
  color = '#1D72E8',
  style,
}) => {
  const { getIconSize } = useFontSize();
  const dynamicSize = getIconSize(size);
  
  // 아이콘 매핑 정의
  const iconMap: Record<string, { library: IconLibrary; name: string }> = {
    'BUS': { library: 'ionicons', name: 'bus-outline' },
    'SUBWAY': { library: 'ionicons', name: 'subway-outline' },
    'HEAVY_RAIL': { library: 'ionicons', name: 'train-outline' },
    'TRAM': { library: 'ionicons', name: 'train-outline' },
    'LIGHT_RAIL': { library: 'ionicons', name: 'train-outline' },
    'WALKING': { library: 'ionicons', name: 'walk-outline' },
    'DEFAULT': { library: 'feather', name: 'map-pin' },
  };
  
  // 타입에 맞는 아이콘 정보 가져오기
  const iconInfo = iconMap[type?.toUpperCase()] || iconMap.DEFAULT;
  
  return (
    <View style={style}>
      {iconInfo.library === 'ionicons' ? (
        <Ionicons name={iconInfo.name as any} size={dynamicSize} color={color} />
      ) : (
        <Feather name={iconInfo.name as any} size={dynamicSize} color={color} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
