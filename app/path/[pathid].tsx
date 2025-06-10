// app/path/[pathId].tsx
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Platform, View, ActivityIndicator, Alert } from 'react-native';
import { useCalculationStore } from '@/store/calculationStore';
import { useGroupStore } from '@/store/groupStore';
import { TextMedium, TextLarge } from '@/components/TextSize';
// getPathInfo import 제거 (백엔드에서 아직 구현되지 않았을 수 있음)

export default function PathScreen() {
  const router = useRouter();
  const { pathId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const { setPathId } = useGroupStore();

  useEffect(() => {
    const handlePathJoin = async () => {
      if (!pathId || typeof pathId !== 'string') {
        Alert.alert('오류', '잘못된 경로 링크입니다.', [
          { text: '확인', onPress: () => router.replace('/(tabs)/explore') }
        ]);
        return;
      }

      try {
        // 백엔드에서 경로 정보 가져오기 (현재는 주석 처리)
        // const pathInfo = await getPathInfo(pathId);
        
        // URL에서 파라미터 추출
        const urlParams = new URLSearchParams(
          typeof window !== 'undefined' ? window.location.search : ''
        );
        
        const origin = urlParams.get('origin');
        const destination = urlParams.get('destination');
        
        if (origin && destination) {
          const store = useCalculationStore.getState();
          
          const originLocation = {
            name: origin,
            coordinates: {
              latitude: urlParams.get('originLat') ? parseFloat(urlParams.get('originLat')!) : 37.5547,
              longitude: urlParams.get('originLng') ? parseFloat(urlParams.get('originLng')!) : 126.9707,
            },
          };

          const destinationLocation = {
            name: destination,
            coordinates: {
              latitude: urlParams.get('destLat') ? parseFloat(urlParams.get('destLat')!) : 37.5665,
              longitude: urlParams.get('destLng') ? parseFloat(urlParams.get('destLng')!) : 126.9780,
            },
          };

          store.setOrigin(originLocation);
          store.setDestination(destinationLocation);
        }
        
        // 그룹 정보 설정 (참여자로)
        setPathId(pathId, false);
        
        // explore 페이지로 이동
        router.replace('/(tabs)/explore');
        
      } catch (error) {
        console.error('경로 참여 오류:', error);
        Alert.alert('오류', '경로 정보를 불러올 수 없습니다.', [
          { text: '확인', onPress: () => router.replace('/(tabs)/explore') }
        ]);
      } finally {
        setLoading(false);
      }
    };

    handlePathJoin();
  }, [pathId, router, setPathId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3457D5" />
        <TextMedium style={{ marginTop: 16, color: '#666' }}>
          경로 정보를 불러오는 중...
        </TextMedium>
      </View>
    );
  }

  return null;
}
