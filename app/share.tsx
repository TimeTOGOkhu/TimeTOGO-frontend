// app/share.tsx
import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useCalculationStore } from '@/store/calculationStore';
import { TextMedium } from '@/components/TextSize';

export default function ShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleSharedRoute = async () => {
      console.log('Share 페이지 파라미터:', params);
      
      const { origin, destination, arrivalTime, originLat, originLng, destLat, destLng } = params;
      
      if (origin && destination && arrivalTime) {
        console.log('유효한 공유 파라미터 감지');
        
        const store = useCalculationStore.getState();
        
        const originLocation = {
          name: origin as string,
          coordinates: {
            latitude: originLat ? parseFloat(originLat as string) : 37.5547,
            longitude: originLng ? parseFloat(originLng as string) : 126.9707,
          },
        };

        const destinationLocation = {
          name: destination as string,
          coordinates: {
            latitude: destLat ? parseFloat(destLat as string) : 37.5665,
            longitude: destLng ? parseFloat(destLng as string) : 126.9780,
          },
        };

        console.log('스토어에 설정할 위치:', originLocation, destinationLocation);

        // 스토어에 설정
        store.setOrigin(originLocation);
        store.setDestination(destinationLocation);
        
        // 잠시 대기 후 explore 페이지로 이동
        setTimeout(() => {
          console.log('explore 페이지로 이동');
          router.replace('/(tabs)/explore');
        }, 500);
      } else {
        console.log('파라미터가 없거나 불완전함, 홈으로 이동');
        router.replace('/(tabs)/explore');
      }
    };

    handleSharedRoute();
  }, [params, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#3457D5" />
      <TextMedium style={{ marginTop: 16, color: '#666' }}>
        경로 정보를 불러오는 중...
      </TextMedium>
    </View>
  );
}
