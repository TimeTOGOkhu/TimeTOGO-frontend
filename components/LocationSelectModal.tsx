import React, { useState } from 'react';
import { Modal, View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import CustomGooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete'; // ✅ 만든 커스텀 컴포넌트로 교체

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    name: string;
    latitude: number;
    longitude: number;
  }) => void;
  type: '출발지' | '도착지';
}

export default function LocationSelectModal({ visible, onClose, onSelectLocation, type }: Props) {
  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeName, setPlaceName] = useState('');

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>{type} 선택</Text>

        {/* ✅ 자동완성 입력창 - 커스텀 컴포넌트 사용 */}
        <CustomGooglePlacesAutocomplete
          apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
          onSelect={({ name, latitude, longitude }) => {
            setSelectedCoord({ latitude, longitude });
            setPlaceName(name);
          }}
        />

        <MapView
          style={styles.map}
          region={selectedCoord ? {
            ...selectedCoord,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          } : {
            latitude: 37.5665,
            longitude: 126.9780,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            const coord = e.nativeEvent.coordinate;
            setSelectedCoord(coord);
            setPlaceName('지도에서 선택된 위치');
          }}
        >
          {selectedCoord && <Marker coordinate={selectedCoord} />}
        </MapView>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>닫기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#3b82f6' }]}
            onPress={() => {
              if (selectedCoord) {
                onSelectLocation({
                  name: placeName || '선택된 위치',
                  latitude: selectedCoord.latitude,
                  longitude: selectedCoord.longitude,
                });
              } else {
                alert('지도를 눌러 위치를 선택해주세요.');
                return;
              }
              onClose();
            }}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  map: {
    flex: 1,
    marginTop: 16,
    width: '100%',
    height: height * 0.4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
  },
});
