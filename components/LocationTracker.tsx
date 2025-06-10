// components/LocationTracker.tsx 수정
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useGroupStore } from '@/store/groupStore';
import { locationService } from '@/services/locationService';
import { TextSmall, TextMedium } from '@/components/TextSize';
import { DynamicIcon } from '@/components/DynamicIcon';
import PressableOpacity from '@/components/PressableOpacity';

interface LocationTrackerProps {
  autoStart?: boolean;
}

export default function LocationTracker({ autoStart = false }: LocationTrackerProps) {
  const { pathId, isCreator, isLocationSharingActive, setLocationSharingActive } = useGroupStore();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isCreator && pathId && autoStart && !isActive) {
      startLocationSharing();
    }

    return () => {
      if (isActive) {
        stopLocationSharing();
      }
    };
  }, [pathId, isCreator, autoStart]);

  const startLocationSharing = async () => {
    if (!pathId) {
      Alert.alert('오류', '그룹 정보가 없습니다.');
      return;
    }

    const success = await locationService.startLocationSharing({
      pathId,
      enabled: true,
      interval: 60000,
    });

    if (success) {
      setIsActive(true);
      setLocationSharingActive(true);
      Alert.alert('위치 공유 시작', '1분마다 위치가 공유됩니다.');
    } else {
      Alert.alert('오류', '위치 공유를 시작할 수 없습니다. 위치 권한을 확인해주세요.');
    }
  };

  const stopLocationSharing = () => {
    locationService.stopLocationSharing();
    setIsActive(false);
    setLocationSharingActive(false);
  };

  const toggleLocationSharing = () => {
    if (isActive) {
      Alert.alert(
        '위치 공유 중지',
        '위치 공유를 중지하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '중지', style: 'destructive', onPress: stopLocationSharing },
        ]
      );
    } else {
      startLocationSharing();
    }
  };

  if (isCreator) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoSection}>
          <DynamicIcon 
            name={isActive ? "navigation" : "eye-off"} // 수정: navigation-off → eye-off
            size={16} 
            color={isActive ? "#10B981" : "#6B7280"} 
          />
          <TextSmall style={[
            styles.statusText, 
            { color: isActive ? "#10B981" : "#6B7280" }
          ]}>
            {isActive ? "위치 공유 중 (1분 간격)" : "위치 공유 비활성"}
          </TextSmall>
        </View>
        
        <PressableOpacity onPress={toggleLocationSharing} style={[
          styles.button,
          { backgroundColor: isActive ? "#EF4444" : "#3457D5" }
        ]}>
          <TextMedium style={styles.buttonText}>
            {isActive ? "중지" : "시작"}
          </TextMedium>
        </PressableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 8,
    fontFamily: 'Pretendard_Medium',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Pretendard_Bold',
    fontSize: 14,
  },
});
