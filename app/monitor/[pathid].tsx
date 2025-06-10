import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useGroupStore } from '@/store/groupStore';
import { TextMedium } from '@/components/TextSize';

export default function MonitorScreen() {
  const router = useRouter();
  const { pathId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const { setPathId } = useGroupStore();

  useEffect(() => {
    const handleMonitorSetup = async () => {
      if (!pathId || typeof pathId !== 'string') {
        Alert.alert('오류', '잘못된 모니터링 링크입니다.', [
          { text: '확인', onPress: () => router.replace('/(tabs)/explore') }
        ]);
        return;
      }

      try {
        // 그룹 정보 설정 (생성자로)
        setPathId(pathId, true);
        
        // result 페이지로 이동
        router.replace('/result');
        
      } catch (error) {
        console.error('모니터링 설정 오류:', error);
        Alert.alert('오류', '모니터링을 설정할 수 없습니다.', [
          { text: '확인', onPress: () => router.replace('/(tabs)/explore') }
        ]);
      } finally {
        setLoading(false);
      }
    };

    handleMonitorSetup();
  }, [pathId, router, setPathId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3457D5" />
        <TextMedium style={{ marginTop: 16, color: '#666' }}>
          모니터링을 준비하는 중...
        </TextMedium>
      </View>
    );
  }

  return null;
}