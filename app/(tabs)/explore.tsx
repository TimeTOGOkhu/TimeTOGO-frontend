import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { TextSize } from '@components/TextSize';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ArrivalTimeModal from '@components/ArrivalTimeModal';
import LocationInput from '@components/LocationInput';
import LocationSelectModal from '@components/LocationSelectModal';
import { useCalculationStore } from '@store/calculationStore';
import { useFontSize } from '@hooks/useFontSize';
import { calculateRoute, searchLocation } from '@services/routeService';
import Svg, { Circle } from 'react-native-svg';

export default function ExploreScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  const [now, setNow] = useState(new Date());
  const [arrival, setArrival] = useState<Date | null>(null);

  // 출발지 위치 정보
  const [startLocation, setStartLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // 출발지 선택 모달
  const [startModalVisible, setStartModalVisible] = useState(false);

  // 도착지 위치 정보
  const [endLocation, setEndLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // 도착지 선택 모달
  const [endModalVisible, setEndModalVisible] = useState(false);

  // 도착시간 모달
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  // 로고 클릭 시 미입력 모달 오픈
  const handleLogoClick = () => {
    if (!startLocation) setStartModalVisible(true);
    else if (!endLocation) setEndModalVisible(true);
    else if (!arrival) setShowArrivalModal(true);
    // 모두 입력 시 길찾기 화면 이동은 미구현
  };

  // 안내 메시지
  let guideMsg = '';
  if (!startLocation) guideMsg = '출발지를 선택하세요';
  else if (!endLocation) guideMsg = '도착지를 선택하세요';
  else if (!arrival) guideMsg = '도착시간을 선택하세요';
  else guideMsg = '로고를 클릭하세요';

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
          '위치 권한 필요',
          '이 앱은 위치 정보가 필요합니다. 설정에서 위치 권한을 허용해주세요.',
          [{ text: '확인' }],
        );
        return;
      }
      setLocationPermission(true);
      
      // 현재 위치 정보 가져오기
      try {
        const location = await Location.getCurrentPositionAsync({});
        // 현재 위치를 출발지로 설정
        const { latitude, longitude } = location.coords;
        
        // 주소 조회 (역지오코딩)
        const [addressInfo] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        // 출발지 설정
        useCalculationStore.getState().setOrigin({
          name: '현재 위치',
          address: `${addressInfo.city || ''} ${addressInfo.street || ''} ${addressInfo.streetNumber || ''}`.trim(),
          coordinates: { latitude, longitude }
        });
        
        // TODO: 여기서 실제 위치 검색 API를 호출할 수 있습니다.
        // 예: searchLocation 함수를 활용하여 현재 위치 기반 정보 검색
        // const locationData = await searchLocation(`${addressInfo.city} ${addressInfo.street}`);
        // console.log('위치 검색 결과:', locationData);
      } catch (error) {
        console.error('위치 정보를 가져오는데 실패했습니다:', error);
      }
    })();
  }, []);

  // 현재 시간 1초마다 업데이트
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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

  const handleCalculate = async () => {
    if (!arrival) {
      Alert.alert('알림', '먼저 도착 시간을 설정해주세요.'); 
      return;
    }
    
    // 도착 시간을 Zustand 스토어에 저장하고 계산 시작
    const store = useCalculationStore.getState();
    
    // 임시 도착지 설정 (나중에 사용자 입력으로 대체)
    if (!store.destination) {
      store.setDestination({
        name: '동탄예당마을',
        address: '경기도 화성시 석우동',
        coordinates: {
          latitude: 37.210025,
          longitude: 127.076387
        }
      });
    }
    
    try {
      // 출발지와 도착지 정보 가져오기
      const origin = store.origin;
      const destination = store.destination;
      
      if (!origin || !destination) {
        Alert.alert('오류', '출발지 또는 도착지 정보가 없습니다.');
        return;
      }
      
      // 도착 시간을 유닉스 타임스탬프로 변환
      const arrivalUnixTime = Math.floor(arrival.getTime() / 1000).toString();
      
      // 계산 시작 및 결과 페이지로 이동
      store.startCalculation();
      router.navigate('../result');
      
      // 람다 함수로 경로 계산 (결과 페이지 표시 후 백그라운드에서 진행)
      calculateRoute({
        origin: origin.name,
        destination: destination.name,
        arrival_time: arrivalUnixTime
      }).catch(error => {
        console.error('경로 계산 오류:', error);
        // 오류는 store.setCalculationError에서 이미 처리됨
      });
    } catch (error) {
      console.error('경로 계산 초기화 오류:', error);
      Alert.alert('오류', '경로 계산을 시작할 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {locationPermission ? (
        <View style={styles.container} >
          {/* 헤더 */}
          <View style={[styles.header, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 35, color: '#3457D5', fontWeight: 'bold', textAlign: 'center' }}>
              {guideMsg}
            </Text>
          </View>
   
          {/* 메인 UI */}
          <View style={styles.main}>
            {/* 출발지 선택 필드 */}
            <LocationInput
              label=""
              value={startLocation?.name}
              placeholder="출발지를 선택하세요"
              onPress={() => setStartModalVisible(true)}
            />

            {/* 도착지 선택 필드 */}
            <LocationInput
              label=""
              value={endLocation?.name}
              placeholder="도착지를 선택하세요"
              onPress={() => setEndModalVisible(true)}
            />

            {/* 도착시간 선택 필드 */}
            <LocationInput
              label=""
              value={arrival ? formatKoreanDate(arrival) : ''}
              placeholder="도착시간을 선택하세요"
              onPress={() => setShowArrivalModal(true)}
            />

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

            {/* 로고 (SVG 기반 도넛+원) */}
            <View style={{ alignItems: 'center', marginTop: 120, marginBottom: 100 }}>
              <Pressable onPress={handleLogoClick}>
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
              </Pressable>
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
    fontWeight: 'bold',
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