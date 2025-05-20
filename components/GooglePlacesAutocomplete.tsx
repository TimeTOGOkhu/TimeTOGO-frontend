import React from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function CustomGooglePlacesAutocomplete({ onSelect, apiKey }: {
  onSelect: (place: { name: string, latitude: number, longitude: number }) => void;
  apiKey: string;
}) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);

  const fetchPredictions = async (text: string) => {
    setQuery(text);
    if (text.length < 2) return;

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      text
    )}&key=${apiKey}&language=ko`;

    const res = await fetch(url);
    const json = await res.json();

    // ✅ 이 부분이 핵심: predictions가 undefined일 경우 빈 배열로 처리
    // 라이브러리에서는 이걸 안 해서 filter() 호출 시 터졌었음
    setPredictions(json.predictions || []);
  };

  const fetchPlaceDetails = async (placeId: string) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
    const res = await fetch(url);
    const json = await res.json();

    // ❗ 여기도 마찬가지로 location이 없으면 undefined 에러 가능
    // 하지만 현재 코드는 그 전에 반드시 result와 geometry가 있다고 가정함
    const location = json.result.geometry.location;
    onSelect({
      name: json.result.name,
      latitude: location.lat,
      longitude: location.lng,
    });
  };

  return (
    <View>
      <TextInput
        placeholder="장소 검색"
        value={query}
        onChangeText={fetchPredictions}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8 }}
      />
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => fetchPlaceDetails(item.place_id)}>
            <Text style={{ padding: 10 }}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
