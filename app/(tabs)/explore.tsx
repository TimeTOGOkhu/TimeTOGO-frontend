import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ArrivalTimeModal from '@components/ArrivalTimeModal';
import LocationInput from '@components/LocationInput';
import LocationSelectModal from '@components/LocationSelectModal';
import PressableOpacity from "@/components/PressableOpacity";
import { useCalculationStore, Location as StoreLocation } from '@store/calculationStore';
import { calculateRoute } from '@services/routeService';
import Svg, { Circle } from 'react-native-svg';

import { useTranslation } from '@hooks/useTranslation';

export default function ExploreScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  const [arrival, setArrival] = useState<Date | null>(null);

  // 번역 함수
  const { t } = useTranslation();

  // 출발지 위치 정보
  const [startLocation, setStartLocation] = useState<StoreLocation| null>(null);

  // 출발지 선택 모달
  const [startModalVisible, setStartModalVisible] = useState(false);

  // 도착지 위치 정보
  const [endLocation, setEndLocation] = useState<StoreLocation| null>(null);

  // 도착지 선택 모달
  const [endModalVisible, setEndModalVisible] = useState(false);

  // 도착시간 모달
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  // 로고 클릭 시 미입력 모달 오픈
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

  // 안내 메시지
  let guideMsg = '';
  if (!startLocation) guideMsg = t('selectDeparture');
  else if (!endLocation) guideMsg = t('selectDestination');
  else if (!arrival) guideMsg = t('selectArrivalTime');
  else guideMsg = t('clickLogo');

  // 동그라미/도넛 투명도
  const getCircleAlpha = (idx: number) => {
    if (idx === 0 && startLocation) return 1;
    if (idx === 1 && endLocation) return 1;
    if (idx === 2 && arrival) return 1;
    return 0.3;
  };

  // 위치 권한 요청
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('locationPermissionNeeded'),
          t('locationPermissionMessage'),
          [{ text: t('confirm') }],
        );
        return;
      }
      setLocationPermission(true);
      
      // 현재 위치 정보 가져오기
      try {
        const location = await Location.getCurrentPositionAsync({});
        // 현재 위치를 출발지로 설정
        const { latitude, longitude } = location.coords;
        setStartLocation({
          name: t('currentLocation'),
          coordinates: { latitude, longitude }
        });

      } catch (error) {
        console.error('위치 정보를 가져오는데 실패했습니다:', error);
      }
    })();
  }, []);

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
    location.name === '지도에서 선택된 위치' || location.name === '현재 위치' ? `${location.coordinates.latitude},${location.coordinates.longitude}` : location.name;

  const handleCalculate = async () => {
    const store = useCalculationStore.getState();
    
    try {
      // 출발지와 도착지 정보 가져오기
      const origin = store.origin;
      const destination = store.destination;
      
      if (!origin || !destination) {
        Alert.alert(t('error'), t('missingLocation'));
        return;
      }
      
      // 도착 시간을 유닉스 타임스탬프로 변환
      const arrivalUnixTime = Math.floor(arrival!.getTime() / 1000).toString();

      // 계산 시작 및 결과 페이지로 이동
      store.startCalculation();
      router.navigate('../result');
      
      // 람다 함수로 경로 계산 (결과 페이지 표시 후 백그라운드에서 진행)
      calculateRoute({
        origin: getLocationString(origin),
        destination: getLocationString(destination),
        arrival_time: arrivalUnixTime
      }).catch(error => {
        console.error('경로 계산 오류:', error);
        // 오류는 store.setCalculationError에서 이미 처리됨
      });
    } catch (error) {
      console.error('경로 계산 초기화 오류:', error);
      Alert.alert(t('error'), t('routeCalculationInitError'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {locationPermission ? (
        <View style={styles.container} >
          {/* 헤더 */}
          <View style={[styles.header, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 35, color: '#3457D5', fontFamily:'Pretendard_Bold', textAlign: 'center' }}>
              {guideMsg}
            </Text>
          </View>
   
          {/* 메인 UI */}
          <View style={styles.main}>
            {/* 출발지 모달 */}
            <LocationSelectModal
              visible={startModalVisible}
              onClose={() => setStartModalVisible(false)}
              onSelectLocation={(loc) => {
                setStartLocation(loc);
                setStartModalVisible(false);
              }}
              type="출발지"
            />

            {/* 도착지 모달 */}
            <LocationSelectModal
              visible={endModalVisible}
              onClose={() => setEndModalVisible(false)}
              onSelectLocation={(loc) => {
                setEndLocation(loc);
                setEndModalVisible(false);
              }}
              type="도착지"
            />

            {/* 도착시간 모달 */}
            <ArrivalTimeModal
              visible={showArrivalModal}
              initial={arrival || new Date()}
              onCancel={() => setShowArrivalModal(false)}
              onConfirm={dt => {
                setShowArrivalModal(false);
                setArrival(dt);
              }}
            />

            <View style={{ marginVertical: 20 }}>
              {/* 출발지 선택 필드 */}
              <LocationInput
                label=""
                value={startLocation?.name}
                placeholder={t('selectDeparturePlaceholder')}
                onPress={() => setStartModalVisible(true)}
              />

              {/* 도착지 선택 필드 */}
              <LocationInput
                label=""
                value={endLocation?.name}
                placeholder={t('selectDestinationPlaceholder')}
                onPress={() => setEndModalVisible(true)}
              />

              {/* 도착시간 선택 필드 */}
              <LocationInput
                label=""
                value={arrival ? formatKoreanDate(arrival) : ''}
                placeholder={t('selectArrivalTimePlaceholder')}
                onPress={() => setShowArrivalModal(true)}
              />
            </View>

            {/* 로고 (SVG 기반 도넛+원) */}
            <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <PressableOpacity onPress={handleLogoClick}>
                <Svg width={240} height={240}>
                  {/* 바깥 도넛 */}
                  <Circle
                    cx={120}
                    cy={120}
                    r={105}
                    stroke="rgba(55, 97, 223, 0.9)"
                    strokeWidth={24}
                    fill="none"
                    opacity={getCircleAlpha(0)}
                  />
                  {/* 중간 도넛 */}
                  <Circle
                    cx={120}
                    cy={120}
                    r={62}
                    stroke="rgba(55, 97, 223, 0.9)"
                    strokeWidth={24}
                    fill="none"
                    opacity={getCircleAlpha(1)}
                  />
                  {/* 중앙 원 */}
                  <Circle
                    cx={120}
                    cy={120}
                    r={28}
                    fill="rgba(55, 97, 223, 0.9)"
                    opacity={getCircleAlpha(2)}
                  />
                </Svg>
              </PressableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            위치 권한이 필요합니다. 앱을 다시 시작하여 권한을 허용해주세요.
          </Text>
        </View>
      )}
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
  title: {
    fontSize: 50,
    fontFamily: 'Pretendard-Bold',
    color: '#3457D5',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  currentTime: {
    fontSize: 16,
    color: '#333',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});