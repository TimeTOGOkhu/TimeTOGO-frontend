import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-modal';

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
  surface: '#f8f9fa',
  border: '#e5e7eb',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  online: '#10b981',
  offline: '#ef4444',
  pending: '#f59e0b',
} as const;

const AppTypography = {
  fontFamily: {
    regular: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    medium: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    bold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

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

declare global {
  interface Window {
    google: any;
    L: any;
    mapInstance?: any;
  }
}

// 고유 맵 ID 생성
let mapCounter = 0;

const LocationSelectModal: React.FC<LocationSelectModalProps> = ({ 
  visible, 
  onClose, 
  onSelectLocation, 
  type, 
  initialCoordinates 
}) => {
  const { width, height } = Dimensions.get('window');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
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
      mapIdRef.current = `leaflet-map-${++mapCounter}`;
      console.log('새 맵 ID 생성:', mapIdRef.current);
      setMapReady(false);
      setError(null);
      setIsLoading(true);
      
      // 이전 타임아웃 클리어
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      // 전체 로딩 타임아웃 설정 (10초)
      timeoutRef.current = window.setTimeout(() => {
        setError('지도 로딩 시간이 초과되었습니다. 다시 시도해주세요.');
        setIsLoading(false);
      }, 10000);
      
      loadMapResources();
    } else {
      // 모달이 닫힐 때 타임아웃 클리어
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [visible]);

  // 맵 리소스 로딩 최적화
  const loadMapResources = async () => {
    try {
      console.log('맵 리소스 로딩 시작...');
      
      // 1. 동시에 리소스 로딩 시작
      const [leafletCSSLoaded, leafletJSLoaded] = await Promise.allSettled([
        loadLeafletCSS(),
        loadLeafletJS()
      ]);
      
      // 로딩 실패 체크
      if (leafletCSSLoaded.status === 'rejected' && leafletJSLoaded.status === 'rejected') {
        throw new Error('Leaflet 리소스 로딩 실패');
      }
      
      // 2. 지도 초기화 (더 짧은 지연)
      setTimeout(() => {
        if (visible) { // 모달이 여전히 열려있을 때만 초기화
          initializeMap();
        }
      }, 200); // 500ms에서 200ms로 단축
      
    } catch (error) {
      console.error('맵 리소스 로딩 실패:', error);
      setError('지도를 로딩할 수 없습니다. 새로고침하고 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  // Leaflet CSS 로딩 최적화
  const loadLeafletCSS = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector('link[href*="leaflet.css"]')) {
        resolve();
        return;
      }

      console.log('Leaflet CSS 로딩...');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      
      // 타임아웃 설정
      const timeout = window.setTimeout(() => {
        reject(new Error('CSS 로딩 시간 초과'));
      }, 5000);
      
      link.onload = () => {
        window.clearTimeout(timeout);
        console.log('Leaflet CSS 로딩 완료');
        
        // 커스텀 스타일 추가 (최적화)
        if (!document.querySelector('#leaflet-custom-styles')) {
          const style = document.createElement('style');
          style.id = 'leaflet-custom-styles';
          style.textContent = `
            .leaflet-container {
              height: 100% !important;
              width: 100% !important;
              border-radius: 12px;
              background: #e0e0e0;
              z-index: 1;
            }
            .leaflet-control-zoom {
              border: none !important;
              border-radius: 8px !important;
            }
            .leaflet-control-zoom a {
              background-color: white !important;
              color: #333 !important;
              border: 1px solid #ccc !important;
            }
            .leaflet-tile-pane {
              filter: none !important;
            }
          `;
          document.head.appendChild(style);
        }
        resolve();
      };
      
      link.onerror = () => {
        window.clearTimeout(timeout);
        console.error('Leaflet CSS 로딩 실패');
        resolve(); // 실패해도 계속 진행
      };
      
      document.head.appendChild(link);
    });
  };

  // Leaflet JS 로딩 최적화
  const loadLeafletJS = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.L) {
        console.log('Leaflet JS 이미 로딩됨');
        resolve();
        return;
      }

      console.log('Leaflet JS 로딩...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      
      // 타임아웃 설정
      const timeout = window.setTimeout(() => {
        reject(new Error('JS 로딩 시간 초과'));
      }, 8000);
      
      script.onload = () => {
        window.clearTimeout(timeout);
        console.log('Leaflet JS 로딩 완료');
        
        // 아이콘 설정 최적화
        try {
          if (window.L && window.L.Icon && window.L.Icon.Default) {
            delete window.L.Icon.Default.prototype._getIconUrl;
            window.L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });
          }
        } catch (iconError) {
          console.warn('아이콘 설정 실패:', iconError);
        }
        
        resolve();
      };
      
      script.onerror = () => {
        window.clearTimeout(timeout);
        console.error('Leaflet JS 로딩 실패');
        reject(new Error('Leaflet 로딩 실패'));
      };
      
      document.head.appendChild(script);
    });
  };

  // 지도 초기화 최적화
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.L || !visible) {
      console.error('지도 초기화 조건 불충족:', {
        container: !!mapContainerRef.current,
        L: !!window.L,
        visible
      });
      return;
    }

    try {
      console.log('지도 초기화 시작...');
      
      // 기존 맵 인스턴스 완전 제거
      if (mapRef.current) {
        console.log('기존 맵 제거...');
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn('지도 제거 중 오류:', e);
        }
        mapRef.current = null;
      }

      // 컨테이너 완전 정리
      const container = mapContainerRef.current;
      container.innerHTML = '';
      
      // DOM에서 완전히 제거 후 재생성
      container.style.height = '280px';
      container.style.width = '100%';
      container.style.background = '#e0e0e0';
      container.style.borderRadius = '12px';
      container.style.position = 'relative';
      
      // Leaflet ID 제거
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      console.log('지도 생성 중...');
      const initialCenter = selectedCoord 
        ? [selectedCoord.latitude, selectedCoord.longitude] 
        : [37.5665, 126.9780];

      // 지도 생성 (옵션 최적화)
      const map = window.L.map(container, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        attributionControl: false, // attribution 제거로 성능 향상
        preferCanvas: true, // Canvas 렌더링으로 성능 향상
      });

      console.log('타일 레이어 추가 중...');
      // 타일 레이어 추가 (더 빠른 서버 사용)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        tileSize: 256,
        crossOrigin: true,
        // 캐싱 및 성능 최적화
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }).addTo(map);

      // 지도 이벤트
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        console.log('지도 클릭:', lat, lng);
        
        setSelectedCoord({ latitude: lat, longitude: lng });
        setPlaceName(`선택된 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
        
        // 기존 마커 제거 (더 효율적)
        map.eachLayer((layer: any) => {
          if (layer instanceof window.L.Marker) {
            map.removeLayer(layer);
          }
        });
        
        // 새 마커 추가
        window.L.marker([lat, lng]).addTo(map);
      });

      // 지도 로딩 완료 이벤트
      map.whenReady(() => {
        console.log('지도 준비 완료');
        
        // 타임아웃 클리어
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setMapReady(true);
        setIsLoading(false);
        
        // 크기 조정을 한 번만 실행
        setTimeout(() => {
          if (map && visible) {
            map.invalidateSize();
            console.log('지도 크기 재조정 완료');
          }
        }, 100);
      });

      // 초기 마커
      if (selectedCoord) {
        window.L.marker([selectedCoord.latitude, selectedCoord.longitude]).addTo(map);
      }

      mapRef.current = map;
      console.log('지도 초기화 완료');

    } catch (error) {
      console.error('지도 초기화 실패:', error);
      setError('지도 초기화에 실패했습니다.');
      setIsLoading(false);
    }
  };

  // Google Places API 로딩 최적화
  useEffect(() => {
    if (!visible) return;

    const loadGooglePlaces = () => {
      // 이미 로딩된 경우
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleLoaded(true);
        setTimeout(initializeAutocomplete, 100);
        return;
      }

      // 이미 로딩 중인 스크립트가 있는지 확인
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // 기존 스크립트 로딩 완료 대기
        const checkGoogleReady = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setGoogleLoaded(true);
            setTimeout(initializeAutocomplete, 100);
          } else {
            setTimeout(checkGoogleReady, 100);
          }
        };
        checkGoogleReady();
        return;
      }

      console.log('Google Places API 로딩...');
      const script = document.createElement('script');
      const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Places API 키가 설정되지 않음');
        return;
      }
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ko&region=KR`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Places API 로딩 완료');
        setGoogleLoaded(true);
        setTimeout(initializeAutocomplete, 100);
      };
      
      script.onerror = () => {
        console.error('Google Places API 로딩 실패');
      };

      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, [visible]);

  // Google Places Autocomplete 초기화
  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !searchInputRef.current) {
      console.log('Autocomplete 초기화 조건 불충족');
      return;
    }

    try {
      console.log('Autocomplete 초기화...');
      
      // 기존 autocomplete 정리
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'kr' },
          fields: ['place_id', 'geometry', 'name', 'formatted_address'],
          types: ['establishment', 'geocode'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.log('위치 정보 없음');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        console.log('Places 선택:', lat, lng, place.name);
        
        setSelectedCoord({ latitude: lat, longitude: lng });
        setPlaceName(place.name || place.formatted_address || '선택된 위치');

        // 지도 업데이트
        if (mapRef.current && window.L && visible) {
          mapRef.current.eachLayer((layer: any) => {
            if (layer instanceof window.L.Marker) {
              mapRef.current.removeLayer(layer);
            }
          });
          
          window.L.marker([lat, lng]).addTo(mapRef.current);
          mapRef.current.setView([lat, lng], 15);
        }
      });

      autocompleteRef.current = autocomplete;
      console.log('Autocomplete 초기화 완료');
    } catch (error) {
      console.error('Autocomplete 초기화 실패:', error);
    }
  };

  // 새로고침 함수
  const handleRefresh = () => {
    setError(null);
    setIsLoading(true);
    setMapReady(false);
    setGoogleLoaded(false);
    
    // 기존 리소스 정리
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.warn('지도 제거 중 오류:', e);
      }
      mapRef.current = null;
    }
    
    // 다시 로딩
    setTimeout(() => {
      loadMapResources();
    }, 500);
  };

  // 확인 버튼
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

  // 모달 닫기 최적화
  const handleClose = (): void => {
    console.log('모달 닫기...');
    
    // 타임아웃 클리어
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // 지도 정리
    if (mapRef.current) {
      try {
        mapRef.current.remove();
        console.log('지도 제거됨');
      } catch (error) {
        console.error('지도 제거 오류:', error);
      }
      mapRef.current = null;
    }
    
    // Autocomplete 정리
    if (autocompleteRef.current) {
      try {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      } catch (error) {
        console.warn('Autocomplete 정리 오류:', error);
      }
      autocompleteRef.current = null;
    }
    
    // 컨테이너 정리
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    }
    
    // 상태 초기화
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

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('언마운트 시 지도 제거 오류:', error);
        }
      }
      if (autocompleteRef.current) {
        try {
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          console.warn('언마운트 시 Autocomplete 정리 오류:', error);
        }
      }
    };
  }, []);

  const isSmallScreen = width < 600;
  const modalWidth = isSmallScreen ? '95%' : '90%';
  const maxModalWidth = isSmallScreen ? '400px' : '600px';

  if (!visible) {
    return null;
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
          width: modalWidth,
          maxWidth: maxModalWidth,
          maxHeight: '90%',
          overflow: 'auto',
          padding: 0,
          borderRadius: 16,
          border: 'none',
          boxShadow: `0 10px 25px ${AppColors.shadowDark}`,
        },
        overlay: {
          backgroundColor: AppColors.overlay,
          zIndex: 1000,
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{type} 선택</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* 검색 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 장소 검색</Text>
            <View style={styles.searchContainer}>
              <input
                ref={searchInputRef}
                style={styles.searchInput as any}
                placeholder="장소명을 입력하세요 (예: 강남역, 서울역)"
                disabled={!googleLoaded}
              />
              {!googleLoaded && (
                <View style={styles.searchStatus}>
                  <Text style={styles.statusText}>Google Places 로딩 중...</Text>
                </View>
              )}
            </View>
          </View>

          {/* 지도 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ 지도에서 선택</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                  <Text style={styles.refreshButtonText}>🔄 다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : isLoading || !mapReady ? (
              <View style={styles.mapLoadingContainer}>
                <Text style={styles.loadingText}>지도 로딩 중...</Text>
                <Text style={styles.loadingSubText}>잠시만 기다려주세요</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                  <Text style={styles.refreshButtonText}>🔄 새로고침</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mapContainer}>
                <div 
                  ref={mapContainerRef}
                  id={mapIdRef.current}
                  style={{ 
                    height: '280px', 
                    width: '100%',
                    borderRadius: '12px',
                    background: '#e0e0e0',
                    position: 'relative'
                  }}
                />
                <Text style={styles.mapHint}>💡 지도를 클릭하여 위치를 선택하세요</Text>
              </View>
            )}
          </View>

          {/* 선택된 위치 */}
          {selectedCoord && placeName && (
            <View style={styles.selectedLocationContainer}>
              <Text style={styles.selectedLocationTitle}>✅ 선택된 위치</Text>
              <Text style={styles.selectedLocationName}>{placeName}</Text>
              <Text style={styles.selectedLocationCoord}>
                위도: {selectedCoord.latitude.toFixed(6)}, 경도: {selectedCoord.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
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
  title: {
    fontSize: AppTypography.fontSize.xl,
    fontWeight: AppTypography.fontWeight.bold,
    color: AppColors.white,
    fontFamily: AppTypography.fontFamily.bold,
  } as any,
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  closeButtonText: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.bold,
  } as any,
  content: {
    padding: 20,
    maxHeight: 'calc(90vh - 140px)',
    overflow: 'auto',
  } as any,
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  } as any,
  sectionTitle: {
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
    marginBottom: 12,
    color: AppColors.text,
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  searchContainer: {
    position: 'relative',
  } as any,
  searchInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: AppTypography.fontSize.base,
    fontFamily: AppTypography.fontFamily.regular,
    backgroundColor: AppColors.white,
    color: AppColors.text,
    outline: 'none',
  } as any,
  searchStatus: {
    marginTop: 8,
    padding: 8,
    backgroundColor: AppColors.gray50,
    borderRadius: 8,
  } as any,
  statusText: {
    fontSize: AppTypography.fontSize.sm,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontFamily: AppTypography.fontFamily.regular,
  } as any,
  errorContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 20,
  } as any,
  errorText: {
    fontSize: AppTypography.fontSize.base,
    color: '#dc2626',
    fontWeight: AppTypography.fontWeight.semibold,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  mapLoadingContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 20,
  } as any,
  loadingText: {
    fontSize: AppTypography.fontSize.base,
    color: AppColors.textSecondary,
    fontFamily: AppTypography.fontFamily.regular,
    marginBottom: 4,
    textAlign: 'center',
  } as any,
  loadingSubText: {
    fontSize: AppTypography.fontSize.sm,
    color: AppColors.textMuted,
    fontFamily: AppTypography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: 12,
  } as any,
  refreshButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  } as any,
  refreshButtonText: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.sm,
    fontWeight: AppTypography.fontWeight.medium,
    textAlign: 'center',
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
  } as any,
  mapHint: {
    textAlign: 'center',
    fontSize: AppTypography.fontSize.sm,
    color: AppColors.textSecondary,
    marginTop: 8,
    fontFamily: AppTypography.fontFamily.regular,
    fontStyle: 'italic',
  } as any,
  selectedLocationContainer: {
    backgroundColor: AppColors.success,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: AppColors.success,
  } as any,
  selectedLocationTitle: {
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
    color: AppColors.white,
    marginBottom: 4,
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  selectedLocationName: {
    fontSize: AppTypography.fontSize.base,
    color: AppColors.white,
    marginBottom: 4,
    fontFamily: AppTypography.fontFamily.regular,
  } as any,
  selectedLocationCoord: {
    fontSize: AppTypography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: AppTypography.fontFamily.regular,
  } as any,
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  } as any,
  cancelButton: {
    flex: 1,
    backgroundColor: AppColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  cancelButtonText: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  confirmButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  confirmButtonText: {
    color: AppColors.white,
    fontSize: AppTypography.fontSize.lg,
    fontWeight: AppTypography.fontWeight.semibold,
    fontFamily: AppTypography.fontFamily.medium,
  } as any,
  disabledButton: {
    backgroundColor: AppColors.gray300,
  } as any,
});

export default LocationSelectModal;
