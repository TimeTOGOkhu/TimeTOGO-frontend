import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-modal';

// Google Maps 타입 선언
declare global {
  interface Window {
    google: typeof google;
    currentMarker: google.maps.Marker | null;
  }
}

// Google Maps 네임스페이스 확장
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      addListener(eventName: string, handler: Function): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setPosition(position: LatLng | LatLngLiteral): void;
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
    }

    class places {
      static Autocomplete: new (input: HTMLInputElement, options?: AutocompleteOptions) => Autocomplete;
      static PlacesService: new (map?: Map) => PlacesService;
      static PlacesServiceStatus: {
        OK: string;
        ZERO_RESULTS: string;
        OVER_QUERY_LIMIT: string;
        REQUEST_DENIED: string;
        INVALID_REQUEST: string;
        UNKNOWN_ERROR: string;
      };
    }

    interface PlacesService {
      nearbySearch(request: any, callback: Function): void;
      textSearch(request: any, callback: Function): void;
      getDetails(request: any, callback: Function): void;
    }

    interface Autocomplete {
      addListener(eventName: string, handler: Function): void;
      getPlace(): PlaceResult;
      setFields(fields: string[]): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: MapTypeId;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface GeocoderRequest {
      location?: LatLng | LatLngLiteral;
    }

    interface GeocoderResult {
      formatted_address: string;
    }

    interface PlaceResult {
      formatted_address?: string;
      name?: string;
      geometry?: {
        location: LatLng;
      };
    }

    interface AutocompleteOptions {
      types?: string[];
    }

    enum MapTypeId {
      ROADMAP = 'roadmap'
    }

    enum GeocoderStatus {
      OK = 'OK'
    }

    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): void;
      function addListenerOnce(instance: any, eventName: string, handler: Function): void;
      function clearInstanceListeners(instance: any): void;
    }
  }
}

// 🎨 앱과 동일한 색상 팔레트
const AppColors = {
  primary: '#007bff',
  primaryDark: '#0056b3',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  background: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#d1d5db',
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

// 📝 Typography 설정
const AppTypography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
} as const;

// 🎯 컴포넌트 타입 정의
// Location 타입 정의 (explore.web.tsx와 호환)
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
  type: '출발지' | '도착지';
  initialCoordinates?: { latitude: number; longitude: number };
}

// 전역 맵 카운터
let mapCounter = 0;

const LocationSelectModal = ({ 
  visible, 
  onClose, 
  onSelectLocation, 
  type, 
  initialCoordinates 
}: LocationSelectModalProps): React.JSX.Element => {
  const { width, height } = Dimensions.get('window');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapIdRef = useRef<string>('');
  const mapRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(
    initialCoordinates || null
  );
  const [placeName, setPlaceName] = useState<string>('');
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [googleLoaded, setGoogleLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 새로운 맵 ID 생성
  useEffect(() => {
    if (visible) {
      mapIdRef.current = `map-${++mapCounter}-${Date.now()}`;
      console.log('새로운 맵 ID 생성:', mapIdRef.current);
    }
  }, [visible]);

  // Google Maps API 로드 함수
  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 이미 로드되어 있는지 확인
      if (window.google && window.google.maps) {
        console.log('Google Maps API가 이미 로드되어 있습니다.');
        resolve();
        return;
      }

      // 이미 로딩 중인 스크립트가 있는지 확인
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps API 로딩 중...');
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Google Maps API 로드 실패')));
        return;
      }

      // 새 스크립트 태그 생성
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC8-dlIY7iVss5i5ZWUmh0n4JinrRcTrvw&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Maps API 로드 완료');
        resolve();
      };

      script.onerror = () => {
        console.error('Google Maps API 로드 실패');
        reject(new Error('Google Maps API 로드 실패'));
      };

      document.head.appendChild(script);
    });
  };

  // Google Maps 초기화 함수
  const initializeMap = () => {
    console.log('initializeMap 호출됨');

    // 1차 체크: 기본 조건
    if (!window.google || !window.google.maps || !visible) {
      console.error('지도 초기화 조건 불충족 (1차):', {
        google: !!window.google,
        maps: !!(window.google && window.google.maps),
        visible
      });
      return;
    }

    // 2차 체크: DOM 컨테이너 강력 검증
    const containerElement = mapContainerRef.current;
    if (!containerElement) {
      console.error('지도 초기화 조건 불충족 (2차): 컨테이너가 null');
      return;
    }

    // 3차 체크: DOM이 실제로 연결되어 있는지 확인
    if (!containerElement.isConnected || !document.contains(containerElement)) {
      console.error('지도 초기화 조건 불충족 (3차): 컨테이너가 DOM에 연결되지 않음');
      return;
    }

    // 4차 체크: 컨테이너 크기 확인
    const rect = containerElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.error('지도 초기화 조건 불충족 (4차): 컨테이너 크기가 0');
      return;
    }

    console.log('✅ 모든 조건 통과! 지도 초기화 시작');
    console.log('컨테이너 정보:', {
      id: containerElement.id,
      width: rect.width,
      height: rect.height,
      isConnected: containerElement.isConnected
    });

    try {
      console.log('지도 초기화 시작...');

      // 기존 맵 제거
      if (mapRef.current) {
        console.log('기존 맵 제거...');
        try {
          mapRef.current = null;
        } catch (cleanupError) {
          console.warn('기존 맵 정리 중 오류:', cleanupError);
        }
      }

      // 컨테이너 내용 완전 초기화
      containerElement.innerHTML = '';
      containerElement.style.width = '100%';
      containerElement.style.height = '100%';

      // 지도 옵션 설정
      const mapOptions = {
        zoom: 15,
        center: selectedCoord 
          ? { lat: selectedCoord.latitude, lng: selectedCoord.longitude }
          : { lat: 37.5665, lng: 126.9780 }, // 서울 시청 기본 위치
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      };

      console.log('지도 생성 중...', mapOptions);

      // 지도 생성
      const map = new window.google.maps.Map(containerElement, mapOptions);
      mapRef.current = map;

      console.log('✅ 지도 생성 완료!');

      // 지도 로드 완료 이벤트
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log('✅ 지도 렌더링 완료!');
        setMapReady(true);
        setError(null);
      });

      // 지도 클릭 이벤트 추가
      map.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        console.log('지도 클릭:', { lat, lng });

        setSelectedCoord({ latitude: lat, longitude: lng });

        // 기존 마커 제거
        if (window.currentMarker) {
          window.currentMarker.setMap(null);
        }

        // 새 마커 추가
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: '선택된 위치'
        });

        window.currentMarker = marker;

        // 역지오코딩으로 주소 가져오기
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setPlaceName(address);
            console.log('주소 찾기 완료:', address);
          } else {
            setPlaceName('알 수 없는 위치');
            console.log('주소 찾기 실패:', status);
          }
        });
      });

      // 초기 마커 설정
      if (selectedCoord) {
        const marker = new window.google.maps.Marker({
          position: { lat: selectedCoord.latitude, lng: selectedCoord.longitude },
          map: map,
          title: '초기 위치'
        });
        window.currentMarker = marker;
      }

      // Places Autocomplete 설정
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
        autocomplete.setFields(['place_id', 'geometry', 'name', 'formatted_address']);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setSelectedCoord({ latitude: lat, longitude: lng });
            setPlaceName(place.formatted_address || place.name || '');

            // 지도 중심 이동
            map.setCenter({ lat, lng });
            map.setZoom(15);

            // 기존 마커 제거
            if (window.currentMarker) {
              window.currentMarker.setMap(null);
            }

            // 새 마커 추가
            const marker = new window.google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: place.name || '선택된 위치'
            });

            window.currentMarker = marker;
          }
        });

        autocompleteRef.current = autocomplete;
      }

    } catch (error) {
      console.error('지도 초기화 실패:', error);
      setError('지도를 불러오는데 실패했습니다.');
      setMapReady(false);
    }
  };

  // Google Maps API 로드 및 초기화
  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsLoading(true);
    setError(null);

    loadGoogleMapsAPI()
      .then(() => {
        console.log('Google Maps API 로드 성공');
        setGoogleLoaded(true);

        // 짧은 지연 후 지도 초기화
        setTimeout(() => {
          initializeMap();
        }, 100);
      })
      .catch((error) => {
        console.error('Google Maps API 로드 실패:', error);
        setError('지도 서비스를 불러오는데 실패했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      // 정리
      if (mapContainerRef.current) {
        const parent = mapContainerRef.current.parentNode;
        if (parent) {
          parent.removeChild(mapContainerRef.current);
        }
        mapContainerRef.current = null;
      }
    };
  }, [visible]);

  // 초기 좌표가 변경될 때 지도 업데이트
  useEffect(() => {
    if (initialCoordinates && mapRef.current && window.google) {
      const { latitude, longitude } = initialCoordinates;

      // 지도 중심 이동
      mapRef.current.setCenter({ lat: latitude, lng: longitude });

      // 기존 마커 제거
      if (window.currentMarker) {
        window.currentMarker.setMap(null);
      }

      // 새 마커 추가
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapRef.current,
        title: '초기 위치'
      });

      window.currentMarker = marker;
      setSelectedCoord({ latitude, longitude });
    }
  }, [initialCoordinates, mapReady]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (mapRef.current) {
        mapRef.current = null;
      }

      if (autocompleteRef.current) {
        window.google && window.google.maps && window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      if (window.currentMarker) {
        window.currentMarker.setMap(null);
        window.currentMarker = null;
      }
    };
  }, []);

  // 핸들러 함수들
  const handleClose = () => {
    setSelectedCoord(initialCoordinates || null);
    setPlaceName('');
    setMapReady(false);
    setGoogleLoaded(false);
    setIsLoading(false);
    setError(null);

    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }

    onClose();
  };

  const handleConfirm = () => {
    if (selectedCoord && placeName) {
      onSelectLocation({ name: placeName
      , coordinates: { latitude: selectedCoord.latitude, longitude: selectedCoord.longitude } });
      handleClose();
    }
  };

  const handleSearchSubmit = () => {
    if (searchInputRef.current && searchInputRef.current.value.trim()) {
      // Places Service를 사용한 검색
      if (window.google && window.google.maps && mapRef.current) {
        const service = new window.google.maps.places.PlacesService(mapRef.current);
        const request = {
          query: searchInputRef.current.value.trim(),
          fields: ['name', 'geometry', 'formatted_address'],
        };

        service.textSearch(request, (results: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];

            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();

              setSelectedCoord({ latitude: lat, longitude: lng });
              setPlaceName(place.formatted_address || place.name || '');

              // 지도 중심 이동
              mapRef.current.setCenter({ lat, lng });
              mapRef.current.setZoom(15);

              // 기존 마커 제거
              if (window.currentMarker) {
                window.currentMarker.setMap(null);
              }

              // 새 마커 추가
              const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapRef.current,
                title: place.name || '검색 결과'
              });

              window.currentMarker = marker;
            }
          } else {
            console.log('검색 결과를 찾을 수 없습니다:', status);
          }
        });
      }
    }
  };

  // 로딩 중이거나 보이지 않을 때
  if (!visible) {
    return <></>;
  }

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
          padding: 0,
          border: 'none',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: Math.min(width * 0.95, 500),
          maxHeight: Math.min(height * 0.9, 700),
          width: Math.min(width * 0.95, 500),
          height: Math.min(height * 0.9, 700),
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        },
      }}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {type === '출발지' ? '출발지 선택' : '도착지 선택'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 검색 입력 */}
        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef as any}
            style={styles.searchInput}
            placeholder="장소를 검색하세요..."
            placeholderTextColor={AppColors.textSecondary}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* 지도 컨테이너 */}
        <View style={styles.mapWrapper}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <div
            ref={mapContainerRef}
            id={mapIdRef.current}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '300px',
              borderRadius: 8,
              overflow: 'hidden',
              display: isLoading || error ? 'none' : 'block',
            }}
          />
        </View>

        {/* 선택된 위치 정보 */}
        {selectedCoord && (
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationTitle}>선택된 위치</Text>
            <Text style={styles.selectedLocationText} numberOfLines={2}>
              {placeName || `위도: ${selectedCoord.latitude.toFixed(6)}, 경도: ${selectedCoord.longitude.toFixed(6)}`}
            </Text>
          </View>
        )}

        {/* 하단 버튼 */}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90vh',
  } as any,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  } as any,
  headerTitle: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
    fontFamily: AppTypography.fontFamily.semibold,
  } as any,
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  } as any,
  closeButtonText: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.bold,
    lineHeight: 20,
  } as any,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  } as any,
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    fontSize: AppTypography.fontSize.base,
    color: AppColors.text,
    fontFamily: AppTypography.fontFamily.regular,
  } as any,
  searchButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
  } as any,
  searchButtonText: {
    fontSize: AppTypography.fontSize.base,
  } as any,
  mapWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: 300,
    maxHeight: 400,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.gray100,
  } as any,
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.gray50,
    zIndex: 10,
  } as any,
  loadingText: {
    fontSize: AppTypography.fontSize.base,
    color: AppColors.textSecondary,
    fontFamily: AppTypography.fontFamily.regular,
  } as any,
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.gray50,
    zIndex: 10,
  } as any,
  errorText: {
    fontSize: AppTypography.fontSize.base,
    color: AppColors.danger,
    fontFamily: AppTypography.fontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: 20,
  } as any,
  selectedLocationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.gray50,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  } as any,
  selectedLocationTitle: {
    fontSize: AppTypography.fontSize.sm,
    color: AppColors.textSecondary,
    fontWeight: AppTypography.fontWeight.medium,
    fontFamily: AppTypography.fontFamily.medium,
    marginBottom: 4,
  } as any,
  selectedLocationText: {
    fontSize: AppTypography.fontSize.base,
    color: AppColors.text,
    fontFamily: AppTypography.fontFamily.regular,
    lineHeight: 20,
  } as any,
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  } as any,
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.gray200,
    borderRadius: 8,
    alignItems: 'center',
  } as any,
  cancelButtonText: {
    color: AppColors.text,
    fontSize: AppTypography.fontSize.base,
    fontWeight: AppTypography.fontWeight.medium,
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    alignItems: 'center',
  } as any,
  confirmButtonText: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.base,
    fontWeight: AppTypography.fontWeight.semibold,
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  disabledButton: {
    backgroundColor: AppColors.gray300,
  } as any,
});

export default LocationSelectModal;