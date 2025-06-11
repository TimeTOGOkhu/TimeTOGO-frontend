import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useCalculationStore } from '@/store/calculationStore';
import { useGroupStore } from '@/store/groupStore';
import { getPathData } from '@/services/pathService';
import { deserializeCalculationState } from '@/utils/urlUtils';
import { TextMedium } from '@/components/TextSize';
import ResultWebScreen from '../result.web';

export default function PathScreen() {
  const router = useRouter();
  const { pathid } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calculationStore = useCalculationStore();
  const groupStore = useGroupStore();

  useEffect(() => {
    const loadPathData = async () => {
      if (!pathid || typeof pathid !== 'string') {
        setError('유효하지 않은 경로 ID입니다.');
        setIsLoading(false);
        return;
      }

      try {
        // 백엔드에서 경로 데이터 가져오기
        const pathData = await getPathData(pathid);
        
        // 경로 데이터 역직렬화
        const calculationState = deserializeCalculationState(pathData.path);
        
        // CalculationStore에 데이터 설정
        calculationStore.setOrigin(calculationState.origin);
        calculationStore.setDestination(calculationState.destination);
        calculationStore.setRoute(calculationState.route);
        calculationStore.setWeather(calculationState.weather);
        
        // GroupStore에 pathId 설정 (참가자로)
        groupStore.setPathId(pathid, false);
        
        setIsLoading(false);
      } catch (error) {
        console.error('경로 데이터 로드 오류:', error);
        setError('경로 데이터를 불러올 수 없습니다.');
        setIsLoading(false);
      }
    };

    loadPathData();
  }, [pathid]);

  useEffect(() => {
    // 데이터 로딩이 완료되고 웹 환경이면 result.web.tsx로 리다이렉트
    if (!isLoading && !error && Platform.OS === 'web') {
      // 웹에서는 별도 리다이렉트 없이 ResultWebScreen 컴포넌트를 직접 렌더링
    }
    // 네이티브 환경에서는 result 페이지로 이동
    else if (!isLoading && !error && Platform.OS !== 'web') {
      router.replace('/result');
    }
  }, [isLoading, error, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3457D5" />
        <TextMedium style={{ marginTop: 16, color: '#666' }}>
          경로 정보를 불러오는 중...
        </TextMedium>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <TextMedium style={{ color: '#FF3B30', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </TextMedium>
        <TextMedium 
          style={{ color: '#3457D5', textAlign: 'center' }}
          onPress={() => router.replace('/(tabs)/explore')}
        >
          홈으로 돌아가기
        </TextMedium>
      </View>
    );
  }

  // 웹 환경에서는 result.web.tsx 컴포넌트 렌더링
  if (Platform.OS === 'web') {
    return <ResultWebScreen />;
  }

  // 네이티브 환경에서는 result 페이지로 자동 리다이렉트됨
  return null;
}