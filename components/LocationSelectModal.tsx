import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import MapView, { Marker } from 'react-native-maps';
import CustomGooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete'; // ✅ 만든 커스텀 컴포넌트로 교체
import { Location as StoreLocation } from '@store/calculationStore';
import {
  TextLarge,
} from "@components/TextSize";
import PressableOpacity from './PressableOpacity';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: StoreLocation) => void;
  type: '출발지' | '도착지';
}

export default function LocationSelectModal({ visible, onClose, onSelectLocation, type }: Props) {
  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeName, setPlaceName] = useState('');

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.3}
      style={styles.modal}>
      <View style={styles.container}>
        <TextLarge style={styles.title}>{type} 선택</TextLarge>

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
          <PressableOpacity style={styles.button} onPress={onClose}>
            <TextLarge style={styles.buttonText}>닫기</TextLarge>
          </PressableOpacity>
          <PressableOpacity
            style={[styles.button, { backgroundColor: '#3b82f6' }]}
            onPress={() => {
              if (selectedCoord) {
                onSelectLocation({
                  name: placeName || '선택된 위치',
                  coordinates: {
                    latitude: selectedCoord.latitude,
                    longitude: selectedCoord.longitude,
                    }
                });
              } else {
                alert('지도를 눌러 위치를 선택해주세요.');
                return;
              }
              onClose();
            }}
          >
            <TextLarge style={[styles.buttonText, { color: 'white' }]}>확인</TextLarge>
          </PressableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    marginVertical: 100,
  },
  container: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontFamily: 'Pretendard_Bold',
    marginBottom: 16,
  },
 
  searchInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  searchList: {
    backgroundColor: 'white',
  },
//--------------------------------------------

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
  },
});
