import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { TextSize, useTextSize } from '../../components/TextSize';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArrivalTimeModal from '../../components/ArrivalTimeModal';
import LocationInput from '../../components/LocationInput'; // ✅ 추가
import LocationSelectModal from '../../components/LocationSelectModal'; // ✅ 추가

export default function ExploreScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  const [now, setNow] = useState(new Date());
  const [arrival, setArrival] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // 출발지 위치 정보를 저장하는 상태
  const [startLocation, setStartLocation] = useState<{
    name: string; // name: 장소명
    latitude: number; // latitude: 위도
    longitude: number; // longitude: 경도
  } | null>(null);
  
  // 출발지 선택 모달의 표시 여부를 제어하는 상태
  const [startModalVisible, setStartModalVisible] = useState(false);
  
  // 도착지 위치 정보를 저장하는 상태
  const [endLocation, setEndLocation] = useState<{
    name: string;  // name: 장소명
    latitude: number; // latitude: 위도
    longitude: number; // longitude: 경도
  } | null>(null);
  
  // 도착지 선택 모달의 표시 여부를 제어하는 상태
  const [endModalVisible, setEndModalVisible] = useState(false);

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

  const handleCalculate = () => {    if (!arrival) {
      Alert.alert('알림', '먼저 도착 시간을 설정해주세요.'); 
      return;
    }
    if (!startLocation) {
      Alert.alert('알림', '출발지를 선택해주세요.');
      return;
    }
    if (!endLocation) {
      Alert.alert('알림', '도착지를 선택해주세요.');
      return;
    }
    // TODO: 출발 시간 계산 로직
    console.log('도착시간:', arrival);
    console.log('출발지:', startLocation);
    console.log('도착지:', endLocation);
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
          <View style={styles.main}>            {/* 출발지 선택 필드 */}
            <LocationInput
              label="출발지"
              value={startLocation?.name}
              placeholder="출발지를 선택하세요"
              onPress={() => setStartModalVisible(true)}
            />

            {/* 도착지 선택 필드 */}
            <LocationInput
              label="도착지"
              value={endLocation?.name}
              placeholder="도착지를 선택하세요"
              onPress={() => setEndModalVisible(true)}
            />

            {/* 출발지 모달 */}
            <LocationSelectModal
              visible={startModalVisible}
              onClose={() => setStartModalVisible(false)}
              onSelectLocation={(loc) => setStartLocation(loc)}
              type="출발지"
            />

            {/* 도착지 모달 */}
            <LocationSelectModal
              visible={endModalVisible}
              onClose={() => setEndModalVisible(false)}
              onSelectLocation={(loc) => setEndLocation(loc)}
              type="도착지"
            />

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