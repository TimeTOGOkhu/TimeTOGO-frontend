// app/(tabs)/history.tsx
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
} from 'react-native';
import {
  TextSmall,
  TextMedium,
} from '@components/TextSize';
import { DynamicIcon } from '@components/DynamicIcon';
import { useHistoryStore } from '@/store/historyStore';
import { useCalculationStore, Location as StoreLocation } from '@store/calculationStore';
import { useFontSize } from '@hooks/useFontSize';
import { useTranslation } from '@hooks/useTranslation';
import * as Location from 'expo-location';
import PressableOpacity from "@/components/PressableOpacity";

// 역지오코딩 함수
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    
    if (result && result.length > 0) {
      const address = result[0];
      // 한국 주소 형식으로 표시
      let displayName = '';
      
      if (address.district) displayName += address.district + ' ';
      if (address.subregion) displayName += address.subregion + ' ';
      if (address.street) displayName += address.street;
      
      // 주소가 없는 경우 기본값
      if (!displayName.trim()) {
        displayName = `${address.region || ''} ${address.city || ''}`.trim();
      }
      
      return displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  } catch (error) {
    console.log('역지오코딩 실패:', error);
  }
  
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

export default function HistoryScreen() {
  const historys = useHistoryStore((s) => s.historys);
  const removeHistory = useHistoryStore((s) => s.removeHistory);
  const setOrigin = useCalculationStore((s) => s.setOrigin);
  const setDestination = useCalculationStore((s) => s.setDestination);
  const resetCalculation = useCalculationStore((s) => s.resetCalculation);
  const { getSize } = useFontSize();
  const { t } = useTranslation();

  // 역지오코딩된 주소를 저장하는 state
  const [geocodedAddresses, setGeocodedAddresses] = useState<{[key: string]: string}>({});

  // 히스토리가 변경될 때마다 역지오코딩 수행
  useEffect(() => {
    const geocodeAddresses = async () => {
      const newAddresses: {[key: string]: string} = {};
      
      for (const item of historys) {
        // 출발지 역지오코딩 (특정 이름인 경우만)
        if (item.origin.name === '지도에서 선택된 위치' || item.origin.name === '현재 위치') {
          const originKey = `${item.origin.coordinates.latitude},${item.origin.coordinates.longitude}`;
          if (!newAddresses[originKey]) { // geocodedAddresses 대신 newAddresses 체크
            const originAddress = await reverseGeocode(item.origin.coordinates.latitude, item.origin.coordinates.longitude);
            newAddresses[originKey] = originAddress;
          }
        }
        
        // 도착지 역지오코딩 (특정 이름인 경우만)
        if (item.destination.name === '지도에서 선택된 위치' || item.destination.name === '현재 위치') {
          const destKey = `${item.destination.coordinates.latitude},${item.destination.coordinates.longitude}`;
          if (!newAddresses[destKey]) { // geocodedAddresses 대신 newAddresses 체크
            const destAddress = await reverseGeocode(item.destination.coordinates.latitude, item.destination.coordinates.longitude);
            newAddresses[destKey] = destAddress;
          }
        }
      }
      
      if (Object.keys(newAddresses).length > 0) {
        setGeocodedAddresses(prev => ({ ...prev, ...newAddresses }));
      }
    };

    if (historys.length > 0) {
      geocodeAddresses();
    }
  }, [historys]);

  // 주소 표시 함수
  const getDisplayName = (location: StoreLocation) => {
    // 특정 이름인 경우만 역지오코딩된 주소 사용
    if (location.name === '지도에서 선택된 위치' || location.name === '현재 위치') {
      const coordKey = `${location.coordinates.latitude},${location.coordinates.longitude}`;
      return geocodedAddresses[coordKey] || location.name;
    }
    // 다른 경우는 원래 이름 그대로 사용
    return location.name;
  };

  const applyHistory = async (item: typeof historys[0]) => {
    try {
      // 기존 계산 결과 및 도착 시간 초기화
      resetCalculation();

      // 출발지 설정
      const originName = getDisplayName(item.origin);
      setOrigin({
        name: originName,
        coordinates: item.origin.coordinates
      });

      // 도착지 설정
      const destName = getDisplayName(item.destination);
      setDestination({
        name: destName,
        coordinates: item.destination.coordinates
      });

      // 경로 탐색 화면으로 이동
      router.push('/explore');
    } catch (error) {
      console.error('히스토리 적용 중 오류:', error);
    }
  };

  // FlatList renderItem 함수
  const renderHistoryItem = ({ item, index }: { item: typeof historys[0], index: number }) => (
    <PressableOpacity onPress={() => applyHistory(item)} style={styles.card}>
      {/* 카드 헤더: 제목 + 아이콘 */}
      <View style={styles.cardHeader}>
        <TextMedium style={{ fontSize: getSize('large') }}>
          {t('historyRouteTitle') + ` ${index + 1}`}
        </TextMedium>
        <View style={styles.headerIcons}>
          {/* 내보내기 버튼 임시 주석 처리 */}
          {/* <PressableOpacity onPress={() => applyHistory(item)}>
            <DynamicIcon
              name="share"
              size={getSize('normal')}
              style={styles.icon}
            />
          </PressableOpacity> */}
          <PressableOpacity onPress={() => removeHistory(index)}>
            <DynamicIcon
              name="x"
              size={getSize('normal')}
              style={styles.icon}
            />
          </PressableOpacity>
        </View>
      </View>

      {/* 경로 정보 */}
      <TextMedium style={[styles.routeText, { fontSize: getSize('medium') }]}>
        {getDisplayName(item.origin)} → {getDisplayName(item.destination)}
      </TextMedium>
      <TextSmall style={[styles.infoText, { fontSize: getSize('small') }]}>
        {t('historyTravelTime')}: {Math.round(item.travelTime / 60)} {t('minutes')}
      </TextSmall>
      <TextSmall style={[styles.applyText, { fontSize: getSize('small') }]}>
        {t('historyApplyText')}
      </TextSmall>
    </PressableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history')}</Text>
      </View>
      <FlatList // ScrollView 대신 FlatList 사용
        data={historys}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item.origin}-${item.destination}-${index}`} // 고유 key 보강
        contentContainerStyle={styles.list}
        ListEmptyComponent={ // 히스토리가 없을 때 표시할 컴포넌트
          <View style={styles.emptyContainer}>
            <TextMedium style={styles.emptyText}>{t('noHistory')}</TextMedium>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 72,
    justifyContent: 'center',
    borderBottomColor: '#C6C8C9',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Pretendard-Bold',
    color: '#3457D5',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    flexGrow: 1, // FlatList 내용이 적을 때도 중앙 정렬 등을 위해 추가
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcons: { flexDirection: 'row' },
  icon: { marginLeft: 12 },
  routeText: { marginBottom: 4, color: '#333' },
  infoText: { color: '#666', marginBottom: 4 },
  applyText: { color: '#999' },
  emptyContainer: { // 히스토리가 없을 때 스타일
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});