// components/LocationSelectModal.web.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-modal';
import CustomGooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import { Location as StoreLocation } from '@store/calculationStore';
import {
  TextLarge,
} from "@components/TextSize";
import PressableOpacity from './PressableOpacity';

const { height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: StoreLocation) => void;
  type: '출발지' | '도착지';
  initialCoordinates?: { latitude: number; longitude: number };
}

// 웹용 모달 스타일 설정
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

export default function LocationSelectModal({ 
  visible, 
  onClose, 
  onSelectLocation, 
  type, 
  initialCoordinates 
}: Props) {
  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(
    initialCoordinates || null
  );
  const [placeName, setPlaceName] = useState('');

  useEffect(() => {
    if (visible && initialCoordinates) {
      setSelectedCoord(initialCoordinates);
      setPlaceName('지도에서 선택된 위치');
    } else if (visible && !initialCoordinates) {
      setSelectedCoord(null);
      setPlaceName('');
    }
  }, [visible, initialCoordinates]);

  const handleConfirm = () => {
    if (selectedCoord) {
      onSelectLocation({
        name: placeName || '선택된 위치',
        coordinates: {
          latitude: selectedCoord.latitude,
          longitude: selectedCoord.longitude,
        }
      });
    } else {
      alert('위치를 선택해주세요.');
      return;
    }
    onClose();
  };

  // 웹용 인라인 스타일
  const coordinateInputStyle = {
    flex: 1,
    padding: '10px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    outline: 'none',
  };

  return (
    <Modal
      isOpen={visible}
      onRequestClose={onClose}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '12px',
          padding: '20px',
          border: 'none',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        },
      }}
    >
      <View style={styles.container}>
        <TextLarge style={styles.title}>{type} 선택</TextLarge>

        {/* 장소 검색 */}
        <View style={styles.searchContainer}>
          <CustomGooglePlacesAutocomplete
            apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            onSelect={({ name, latitude, longitude }) => {
              setSelectedCoord({ latitude, longitude });
              setPlaceName(name);
            }}
            placeholder={`${type}를 검색하세요...`}
          />
        </View>

        {/* 선택된 위치 표시 */}
        {selectedCoord && (
          <View style={styles.selectedLocationContainer}>
            <TextLarge style={styles.selectedLocationTitle}>선택된 위치:</TextLarge>
            <TextLarge style={styles.selectedLocationText}>
              {placeName || '선택된 위치'}
            </TextLarge>
            <TextLarge style={styles.coordinatesText}>
              위도: {selectedCoord.latitude.toFixed(6)}, 
              경도: {selectedCoord.longitude.toFixed(6)}
            </TextLarge>
          </View>
        )}

        {/* 웹에서는 지도 대신 간단한 위치 입력 폼 */}
        <View style={styles.manualInputContainer}>
          <TextLarge style={styles.manualInputTitle}>또는 직접 입력:</TextLarge>
          <View style={styles.inputRow}>
            <input
              type="number"
              placeholder="위도"
              step="any"
              style={coordinateInputStyle}
              value={selectedCoord?.latitude || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  setSelectedCoord(prev => ({
                    latitude: lat,
                    longitude: prev?.longitude || 126.9780
                  }));
                  setPlaceName('직접 입력한 위치');
                }
              }}
            />
            <input
              type="number"
              placeholder="경도"
              step="any"
              style={coordinateInputStyle}
              value={selectedCoord?.longitude || ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  setSelectedCoord(prev => ({
                    latitude: prev?.latitude || 37.5665,
                    longitude: lng
                  }));
                  setPlaceName('직접 입력한 위치');
                }
              }}
            />
          </View>
        </View>

        {/* 버튼들 */}
        <View style={styles.buttonRow}>
          <PressableOpacity style={styles.button} onPress={onClose}>
            <TextLarge style={styles.buttonText}>닫기</TextLarge>
          </PressableOpacity>
          <PressableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <TextLarge style={[styles.buttonText, styles.confirmButtonText]}>
              확인
            </TextLarge>
          </PressableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
  },
  title: {
    fontFamily: 'Pretendard_Bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1F2937',
  },
  searchContainer: {
    marginBottom: 20,
  },
  selectedLocationContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedLocationTitle: {
    fontFamily: 'Pretendard_Bold',
    color: '#374151',
    marginBottom: 8,
  },
  selectedLocationText: {
    fontFamily: 'Pretendard_Medium',
    color: '#3457D5',
    marginBottom: 4,
  },
  coordinatesText: {
    fontFamily: 'Pretendard_Regular',
    color: '#6B7280',
    fontSize: 12,
  },
  manualInputContainer: {
    marginBottom: 20,
  },
  manualInputTitle: {
    fontFamily: 'Pretendard_Bold',
    color: '#374151',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#3457D5',
    borderColor: '#3457D5',
  },
  buttonText: {
    fontFamily: 'Pretendard_Medium',
    color: '#374151',
  },
  confirmButtonText: {
    color: '#fff',
  },
});
