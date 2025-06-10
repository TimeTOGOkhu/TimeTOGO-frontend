import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Platform } from 'react-native';
import PressableOpacity from './PressableOpacity';

interface Place {
  place_id: string;
  description: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface Props {
  apiKey: string;
  onSelect: (place: { name: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
}

export default function CustomGooglePlacesAutocomplete({ apiKey, onSelect, placeholder = "검색..." }: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 타입을 명시적으로 지정
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !apiKey) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Google Places Autocomplete API 호출
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          searchQuery
        )}&key=${apiKey}&language=ko&components=country:kr`
      );
      
      const data = await response.json();
      
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Places search error:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    
    // 기존 타이머 취소
    if (timeoutRef.current) {
      if (Platform.OS === 'web') {
        // 웹 환경에서는 window.clearTimeout 사용
        window.clearTimeout(timeoutRef.current as number);
      } else {
        // 네이티브 환경에서는 clearTimeout 사용
        clearTimeout(timeoutRef.current as NodeJS.Timeout);
      }
    }

    // 500ms 후에 검색 실행
    if (Platform.OS === 'web') {
      timeoutRef.current = window.setTimeout(() => searchPlaces(text), 500);
    } else {
      timeoutRef.current = setTimeout(() => searchPlaces(text), 500);
    }
  }, [searchPlaces]);

  const handleSelectPlace = async (place: Place) => {
    try {
      // Place Details API로 상세 정보 가져오기
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${apiKey}&fields=name,geometry`
      );
      
      const data = await response.json();
      
      if (data.result && data.result.geometry) {
        onSelect({
          name: data.result.name || place.description,
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        });
      } else {
        // geometry 정보가 없으면 이름만 사용
        onSelect({
          name: place.description,
          latitude: 37.5665, // 기본값 (서울)
          longitude: 126.9780,
        });
      }
    } catch (error) {
      console.error('Place details error:', error);
      // 오류 시 기본값 사용
      onSelect({
        name: place.description,
        latitude: 37.5665,
        longitude: 126.9780,
      });
    }
    
    setQuery('');
    setPredictions([]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleQueryChange}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {predictions.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <PressableOpacity
                style={styles.item}
                onPress={() => handleSelectPlace(item)}
              >
                <Text style={styles.itemText}>{item.description}</Text>
              </PressableOpacity>
            )}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'Pretendard_Regular',
  },
  listContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  list: {
    maxHeight: 200,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Pretendard_Regular',
  },
  loadingContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Pretendard_Regular',
  },
});
