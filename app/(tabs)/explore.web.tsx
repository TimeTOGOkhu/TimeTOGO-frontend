// app/(tabs)/explore.web.tsx
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// 플랫폼별 파일 직접 import (타입 명시)
import ArrivalTimeModalComponent from '@components/ArrivalTimeModal.web';
import LocationInput from '@components/LocationInput';
import LocationSelectModalComponent from '@components/LocationSelectModal.web';
import PressableOpacity from "@/components/PressableOpacity";
import { useCalculationStore, Location as StoreLocation } from '@store/calculationStore';
import { calculateRoute } from '@services/routeService';
import { useTranslation } from '@hooks/useTranslation';

// 타입 안전을 위한 컴포넌트 별칭
const ArrivalTimeModal = ArrivalTimeModalComponent as React.ComponentType<{
  visible: boolean;
  initial?: Date;
  onConfirm: (dt: Date) => void;
  onCancel: () => void;
}>;

const LocationSelectModal = LocationSelectModalComponent as React.ComponentType<{
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: StoreLocation) => void;
  type: '출발지' | '도착지';
  initialCoordinates?: { latitude: number; longitude: number };
}>;

export default function ExploreScreen() {
  const [now, setNow] = useState(new Date());
  const [arrival, setArrival] = useState<Date | null>(null);

  const { t } = useTranslation();

  const storeOrigin = useCalculationStore((s) => s.origin);
  const storeDestination = useCalculationStore((s) => s.destination);
  const storeRoute = useCalculationStore((s) => s.route);

  const [startLocation, setStartLocation] = useState<StoreLocation | null>(null);
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [endLocation, setEndLocation] = useState<StoreLocation | null>(null);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  // 웹용 위치 권한 처리
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setStartLocation({
            name: '현재 위치',
            coordinates: { latitude, longitude }
          });
        },
        (error) => {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
          // 기본값으로 서울역 설정
          setStartLocation({
            name: '서울역',
            coordinates: { latitude: 37.5547, longitude: 126.9707 }
          });
        }
      );
    } else {
      // navigator.geolocation이 없는 경우 기본값 설정
      setStartLocation({
        name: '서울역',
        coordinates: { latitude: 37.5547, longitude: 126.9707 }
      });
    }
  }, []);

  useEffect(() => {
    if (storeRoute) return;
    if (storeOrigin) {
      setStartLocation(storeOrigin);
      setArrival(null);
    }
    if (storeDestination) {
      setEndLocation(storeDestination);
      setArrival(null);
    }
  }, [storeOrigin, storeDestination]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // useEffect(() => {
  //   // 스토어에서 origin, destination이 설정되고 현재 상태에 반영되지 않았을 때 자동 실행
  //   if (storeOrigin && storeDestination && 
  //       (!startLocation || startLocation.name !== storeOrigin.name || 
  //        !endLocation || endLocation.name !== storeDestination.name)) {
    
  //     console.log('스토어에서 경로 정보 감지:', storeOrigin.name, '->', storeDestination.name);
    
  //     // 상태 업데이트
  //     setStartLocation(storeOrigin);
  //     setEndLocation(storeDestination);
    
  //     // 현재 시간보다 1시간 후를 기본 도착시간으로 설정
  //     const defaultArrival = new Date();
  //     defaultArrival.setHours(defaultArrival.getHours() + 1);
  //     setArrival(defaultArrival);
    
  //     // 잠시 후 자동 계산 실행
  //     setTimeout(() => {
  //       console.log('자동 경로 계산 시작');
  //       handleCalculate();
  //     }, 2000);
  //   }
  // }, [storeOrigin, storeDestination, startLocation, endLocation]);

  const handleLogoClick = () => {
    if (!startLocation) setStartModalVisible(true);
    else if (!endLocation) setEndModalVisible(true);
    else if (!arrival) setShowArrivalModal(true);
    else {
      const store = useCalculationStore.getState();
      store.setOrigin(startLocation);
      store.setDestination(endLocation);
      handleCalculate();
    }
  };

  let guideMsg = '';
  if (!startLocation) guideMsg = t('selectDeparture');
  else if (!endLocation) guideMsg = t('selectDestination');
  else if (!arrival) guideMsg = t('selectArrivalTime');
  else guideMsg = t('clickLogo');

  const getCircleAlpha = (idx: number) => {
    if (idx === 0 && startLocation) return 1;
    if (idx === 1 && endLocation) return 1;
    if (idx === 2 && arrival) return 1;
    return 0.3;
  };

  const formatKoreanDate = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const min = String(date.getMinutes()).padStart(2, '0');
    const period = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${y}년 ${m}월 ${d}일 ${period} ${h12}시 ${min}분`;
  };

  const getLocationString = (location: StoreLocation) => 
    location.name === '지도에서 선택된 위치' || location.name === '현재 위치' ? 
    `${location.coordinates.latitude},${location.coordinates.longitude}` : location.name;

  const handleCalculate = async () => {
    const store = useCalculationStore.getState();
    
    try {
      const origin = store.origin;
      const destination = store.destination;
      
      if (!origin || !destination) {
        Alert.alert(t('error'), t('missingLocation'));
        return;
      }
      
      const arrivalUnixTime = Math.floor(arrival!.getTime() / 1000).toString();

      store.startCalculation();
      router.navigate('../result');
      
      calculateRoute({
        origin: getLocationString(origin),
        destination: getLocationString(destination),
        arrival_time: arrivalUnixTime
      }, origin, destination).catch(error => {
        console.error('경로 계산 오류:', error);
      });
    } catch (error) {
      console.error('경로 계산 초기화 오류:', error);
      Alert.alert(t('error'), t('routeCalculationInitError'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={[styles.header, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ 
            fontSize: 35, 
            color: '#3457D5', 
            fontFamily: 'Pretendard_Bold', 
            textAlign: 'center' 
          }}>
            {guideMsg}
          </Text>
        </View>

        <View style={styles.main}>
          <LocationSelectModal
            visible={startModalVisible}
            onClose={() => setStartModalVisible(false)}
            onSelectLocation={(loc: StoreLocation) => {
              setStartLocation(loc);
              setStartModalVisible(false);
            }}
            type="출발지"
            initialCoordinates={startLocation?.coordinates}
          />

          <LocationSelectModal
            visible={endModalVisible}
            onClose={() => setEndModalVisible(false)}
            onSelectLocation={(loc: StoreLocation) => {
              setEndLocation(loc);
              setEndModalVisible(false);
            }}
            type="도착지"
            initialCoordinates={endLocation?.coordinates}
          />

          <ArrivalTimeModal
            visible={showArrivalModal}
            initial={arrival || new Date()}
            onCancel={() => setShowArrivalModal(false)}
            onConfirm={(dt: Date) => {
              setShowArrivalModal(false);
              setArrival(dt);
            }}
          />

          <View style={{ marginVertical: 20 }}>
            <LocationInput
              label=""
              value={startLocation?.name}
              placeholder={t('selectDeparturePlaceholder')}
              onPress={() => setStartModalVisible(true)}
            />

            <LocationInput
              label=""
              value={endLocation?.name}
              placeholder={t('selectDestinationPlaceholder')}
              onPress={() => setEndModalVisible(true)}
            />

            <LocationInput
              label=""
              value={arrival ? formatKoreanDate(arrival) : ''}
              placeholder={t('selectArrivalTimePlaceholder')}
              onPress={() => setShowArrivalModal(true)}
            />
          </View>

          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <PressableOpacity onPress={handleLogoClick}>
              {/* 웹에서는 간단한 원형 버튼으로 대체 */}
              <View style={[styles.logoButton, { opacity: getCircleAlpha(2) }]}>
                <Text style={styles.logoText}>GO</Text>
              </View>
            </PressableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  header: {
    height: 100,
    justifyContent: 'center',
    borderBottomColor: '#C6C8C9',
    borderBottomWidth: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  logoButton: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: '#3457D5',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0px 4px 8px rgba(52, 87, 213, 0.3)',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Pretendard_Bold',
  },
});
