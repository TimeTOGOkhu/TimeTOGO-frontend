import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-modal';

// 타입 정의 - explore.web.tsx와 완전히 일치
interface Location {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface LocationSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
  type: "출발지" | "도착지";
  initialCoordinates?: { latitude: number; longitude: number };
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface MapClickEvent {
  latlng: {
    lat: number;
    lng: number;
  };
}

// 지도 관련 동적 import 타입 정의
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let useMapEvents: any;
let L: any;

const LocationSelectModal: React.FC<LocationSelectModalProps> = ({ 
  visible, 
  onClose, 
  onSelectLocation, 
  type, 
  initialCoordinates 
}) => {
  const { height } = Dimensions.get('window');
  
  // 상태들
  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(
    initialCoordinates || null
  );
  const [placeName, setPlaceName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');

  // 지도 관련 상태들
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(false);

  // 지도 라이브러리 동적 로딩
  useEffect(() => {
    const loadMapComponents = async () => {
      if (mapLoaded) return;
      
      setIsLoadingMap(true);
      try {
        // Leaflet 라이브러리 동적 import
        const leafletModule = await import('leaflet');
        L = leafletModule.default;
        
        // react-leaflet 컴포넌트들 동적 import
        const reactLeafletModule = await import('react-leaflet');
        MapContainer = reactLeafletModule.MapContainer;
        TileLayer = reactLeafletModule.TileLayer;
        Marker = reactLeafletModule.Marker;
        useMapEvents = reactLeafletModule.useMapEvents;

        // Leaflet 기본 아이콘 설정
        if (L && L.Icon && L.Icon.Default) {
          // @ts-ignore - Leaflet 내부 프로퍼티 접근
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });
        }

        setMapLoaded(true);
      } catch (error) {
        console.error('지도 라이브러리 로딩 실패:', error);
      } finally {
        setIsLoadingMap(false);
      }
    };

    if (visible) {
      loadMapComponents();
    }
  }, [visible, mapLoaded]);

  // 지도 클릭 이벤트 핸들러
  const MapClickHandler: React.FC = () => {
    if (!useMapEvents) return null;
    
    useMapEvents({
      click: (e: MapClickEvent) => {
        const { lat, lng } = e.latlng;
        setSelectedCoord({
          latitude: lat,
          longitude: lng
        });
        setPlaceName(`선택된 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
        setManualLat(lat.toString());
        setManualLng(lng.toString());
      }
    });
    return null;
  };

  // Google Places 검색 함수
  const searchPlaces = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Google Places API 호출 (API 키 필요)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('검색 요청 실패');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results.slice(0, 5));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('장소 검색 실패:', error);
      setSearchResults([]);
      // API 키가 없거나 오류 발생시 사용자에게 알림
      alert('장소 검색에 실패했습니다. Google Places API 설정을 확인해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  // 검색 함수들
  const handleSearchSubmit = (): void => {
    searchPlaces(searchQuery);
  };

  const handlePlaceSelect = (place: GooglePlace): void => {
    const location = place.geometry.location;
    setSelectedCoord({
      latitude: location.lat,
      longitude: location.lng
    });
    setPlaceName(place.name);
    setSearchResults([]);
    setSearchQuery('');
  };

  // 직접 좌표 입력 처리
  const handleManualCoordSubmit = (): void => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setSelectedCoord({
        latitude: lat,
        longitude: lng
      });
      setPlaceName(`직접 입력 (${lat}, ${lng})`);
    } else {
      alert('올바른 좌표를 입력해주세요.\n위도: -90 ~ 90\n경도: -180 ~ 180');
    }
  };

  // explore.web.tsx가 기대하는 형태로 데이터 전달
  const handleConfirm = (): void => {
    if (selectedCoord && placeName) {
      const locationData: Location = {
        name: placeName,
        coordinates: {
          latitude: selectedCoord.latitude,
          longitude: selectedCoord.longitude
        }
      };
      
      onSelectLocation(locationData);
      handleClose();
    }
  };

  const handleClose = (): void => {
    setSelectedCoord(initialCoordinates || null);
    setPlaceName('');
    setSearchQuery('');
    setSearchResults([]);
    setManualLat('');
    setManualLng('');
    onClose();
  };

  return (
    <Modal
      isOpen={visible}
      onRequestClose={handleClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80%',
          overflow: 'auto',
          padding: '20px',
          borderRadius: '10px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }
      }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{type} 선택</Text>

        {/* Google Places 검색 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 장소 검색</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="장소명을 입력하세요"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>

          {isSearching && (
            <Text style={styles.loadingText}>검색 중...</Text>
          )}

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              {searchResults.map((place, index) => (
                <TouchableOpacity
                  key={place.place_id || index}
                  style={styles.resultItem}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <Text style={styles.resultName}>{place.name}</Text>
                  <Text style={styles.resultAddress}>{place.formatted_address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 지도 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ 지도에서 선택</Text>
          
          {isLoadingMap && (
            <View style={styles.mapLoadingContainer}>
              <Text style={styles.loadingText}>지도 로딩 중...</Text>
            </View>
          )}

          {mapLoaded && MapContainer && (
            <View style={styles.mapContainer}>
              <MapContainer
                center={selectedCoord ? [selectedCoord.latitude, selectedCoord.longitude] : [37.5665, 126.9780]}
                zoom={13}
                style={{ height: 300, width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler />
                {selectedCoord && (
                  <Marker position={[selectedCoord.latitude, selectedCoord.longitude]} />
                )}
              </MapContainer>
              <Text style={styles.mapHint}>💡 지도를 클릭하여 위치를 선택하세요</Text>
            </View>
          )}
        </View>

        {/* 직접 좌표 입력 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 직접 좌표 입력</Text>
          <View style={styles.coordContainer}>
            <TextInput
              style={styles.coordInput}
              placeholder="위도 (예: 37.5665)"
              value={manualLat}
              onChangeText={setManualLat}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.coordInput}
              placeholder="경도 (예: 126.9780)"
              value={manualLng}
              onChangeText={setManualLng}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.coordButton} onPress={handleManualCoordSubmit}>
              <Text style={styles.coordButtonText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 선택된 위치 정보 표시 */}
        {selectedCoord && placeName && (
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationTitle}>✅ 선택된 위치</Text>
            <Text style={styles.selectedLocationName}>{placeName}</Text>
            <Text style={styles.selectedLocationCoord}>
              위도: {selectedCoord.latitude.toFixed(6)}, 경도: {selectedCoord.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, (!selectedCoord || !placeName) && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!selectedCoord || !placeName}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  searchButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mapLoadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  mapContainer: {
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  coordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  coordButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
  },
  coordButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedLocationContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  selectedLocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 5,
  },
  selectedLocationName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 3,
  },
  selectedLocationCoord: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default LocationSelectModal;
