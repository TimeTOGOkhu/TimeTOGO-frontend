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
import { useCalculationStore } from '@store/calculationStore';
import { useFontSize } from '@hooks/useFontSize';
import { calculateRoute, searchLocation } from '@services/routeService';

export default function ExploreScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  const [now, setNow] = useState(new Date());
  const [arrival, setArrival] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

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
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>TimeTOGO</Text>
          </View>

          {/* 메인 UI */}
          <View style={styles.main}>
            <View style={styles.row}>
              <Pressable style={styles.setButton} onPress={() => setShowModal(true)}>
                <TextSize style={styles.setButtonText}>
                  {arrival ? formatKoreanDate(arrival) : '도착 시간 설정'}
                </TextSize>
              </Pressable>
              <TextSize style={styles.currentTime}>{formatKoreanDate(now)}</TextSize>
            </View>

            {/* ArrivalTimeModal 연결 */}
            <ArrivalTimeModal
              visible={showModal}
              initial={arrival || new Date()}
              onCancel={() => setShowModal(false)}
              onConfirm={dt => {
                setShowModal(false);
                setArrival(dt);
              }}
            />

            <Pressable style={styles.calcButton} onPress={handleCalculate}>
              <Text style={styles.calcButtonText}>계산하기</Text>
            </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  setButton: {
    borderWidth: 1,
    borderColor: '#4169E1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  setButtonText: {
    color: '#4169E1',
    fontSize: 16,
  },
  currentTime: {
    fontSize: 16,
    color: '#333',
  },
  calcButton: {
    backgroundColor: '#4169E1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  calcButtonText: {
    color: '#fff',
    fontSize: 18,
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