import React, { useState, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet } from 'react-native';
import PressableOpacity from './PressableOpacity';
import { useFontSize } from '@hooks/useFontSize';
import { TextNormal } from "@components/TextSize";

// Debounce를 위한 타입 정의
let debounceTimeout: number | null = null;

export default function CustomGooglePlacesAutocomplete({ onSelect, apiKey }: {
  onSelect: (place: { name: string, latitude: number, longitude: number }) => void;
  apiKey: string;
}) {
  const { getSize } = useFontSize();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);

  /**
   * 장소 자동완성 목록을 가져오는 함수 (디바운싱 및 에러 핸들링 강화)
   */
  const fetchPredictions = useCallback(async (text: string) => {
    // 텍스트가 2글자 미만이면 목록을 비우고 API 요청을 하지 않음
    if (text.length < 2) {
      setPredictions([]);
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      text
    )}&key=${apiKey}&language=ko`;

    // --- 🕵️‍♂️ 디버깅을 위한 핵심 로그 ---
    console.log("===================================");
    console.log("1. API 요청 시작, 시간:", new Date().toLocaleTimeString());
    console.log("2. 입력 텍스트:", text);
    // console.log("3. 최종 요청 URL:", url); // API 키 노출 방지를 위해 필요시 주석 해제

    try {
      const res = await fetch(url);
      const json = await res.json();

      // 4. 서버로부터 받은 실제 응답 데이터 (가장 중요!)
      console.log("4. 서버 응답 전문:", JSON.stringify(json, null, 2));

      if (json.predictions && Array.isArray(json.predictions)) {
        console.log("5. 성공: 자동완성 목록을 받았습니다.");
        setPredictions(json.predictions);
      } else {
        // predictions가 없는 경우, 에러 메시지 등을 확인
        console.error("5. 실패: 응답에 'predictions' 목록이 없습니다. 에러 메시지:", json.error_message || json.status);
        setPredictions([]);
      }
    } catch (error) {
      // 네트워크 요청 자체가 실패한 경우 (인터넷 문제 등)
      console.error("❗ 네트워크 요청 자체에 실패했습니다:", error);
      setPredictions([]); // 에러 발생 시 목록 비우기
    }
    console.log("===================================");

  }, [apiKey]);


  /**
   * 사용자가 입력을 멈췄을 때만 API를 호출하도록 처리 (Debounce)
   * 키보드를 누를 때마다 API를 호출하는 것을 방지하여 성능을 최적화하고 비용을 절약합니다.
   */
  const handleInputChange = (text: string) => {
    setQuery(text);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      fetchPredictions(text);
    }, 500); // 500ms (0.5초) 동안 추가 입력이 없으면 검색 실행
  };


  /**
   * 선택한 장소의 상세 정보(위도, 경도)를 가져오는 함수
   */
  const fetchPlaceDetails = async (placeId: string) => {
    // 목록 선택 시 검색어와 목록을 비워 UI를 깔끔하게 처리
    setQuery('');
    setPredictions([]);

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=ko&fields=name,geometry`;
    
    try {
      const res = await fetch(url);
      const json = await res.json();
      
      // ✅ 옵셔널 체이닝(?.)을 사용해 앱이 중단되는 것을 방지하는 안정성 코드
      const location = json.result?.geometry?.location;

      if (location) {
        // 부모 컴포넌트로 선택된 장소 정보 전달
        onSelect({
          name: json.result.name,
          latitude: location.lat,
          longitude: location.lng,
        });
      } else {
        console.warn("선택한 장소의 상세 정보(위치)를 가져오지 못했습니다.", json);
      }
    } catch (error) {
      console.error("❗ 장소 상세 정보 요청 실패:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="장소 검색"
        value={query}
        onChangeText={handleInputChange}
        style={[styles.textInput, { fontSize: getSize("normal") }]}
      />
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <PressableOpacity onPress={() => fetchPlaceDetails(item.place_id)}>
            <TextNormal style={styles.predictionItem}>{item.description}</TextNormal>
          </PressableOpacity>
        )}
        // 목록이 많아질 경우를 대비한 성능 최적화
        initialNumToRender={5}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
  },
  predictionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  }
});