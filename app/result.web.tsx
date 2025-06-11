// app/result.web.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import haversine from 'haversine';
import { useCalculationStore } from "@store/calculationStore";
import { useGroupStore } from "@store/groupStore";
import { locationService, requestWebLocation } from "@/services/locationService";
import {
  TextSmall,
  TextMedium,
  TextXLarge,
  TextXXXLarge,
} from "@components/TextSize";
import { DynamicIcon } from "@components/DynamicIcon";
import PressableOpacity from "@/components/PressableOpacity";
import { decodePolygon, fetchWalkingRoute, extractTMapCoordinates } from "@/services/routeService";

// 두 지점 간의 거리를 계산하는 함수 (미터 단위)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const a = { latitude: lat1, longitude: lon1 };
  const b = { latitude: lat2, longitude: lon2 };
  return haversine(a, b, { unit: 'meter' });
};

// 교통수단 유형에 따른 경로 색상 설정
const getPolylineColor = (vehicleType?: string): string => {
  if (!vehicleType) return "#1D72E8";

  switch(vehicleType.toUpperCase()) {
    case 'BUS': return "#4CAF50";
    case 'SUBWAY': return "#FF9800";
    case 'TRAM': return "#9C27B0";
    case 'HEAVY_RAIL': return "#F44336";
    case 'LIGHT_RAIL': return "#00BCD4";
    case 'WALKING': return "#2563EB";
    default: return "#1D72E8";
  }
};

// 폴리라인 데이터를 Google Maps 형식으로 변환하는 함수
const convertToGoogleMapsPositions = (polylineString: string): {lat: number, lng: number}[] => {
  try {
    const decoded = decodePolygon(polylineString);
    return decoded.map(point => ({lat: point.latitude, lng: point.longitude}));
  } catch (error) {
    console.error('폴리라인 디코딩 오류:', error);
    return [];
  }
};

const { width, height } = Dimensions.get('window');

export default function ResultScreen() {
  const mapRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const currentLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  const [googleMaps, setGoogleMaps] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // 도보 경로 관련 상태 변수들 (native.tsx와 동일)
  const [isNavigationStarted, setIsNavigationStarted] = useState<boolean>(false);
  const isNavigationStartedRef = useRef(false);
  const [currentWalkingInstruction, setCurrentWalkingInstruction] = useState<string | null>(null);
  const [walkingRoutes, setWalkingRoutes] = useState<Record<number, any>>({});
  const [navigationMode, setNavigationMode] = useState<'walking' | 'transit' | 'done'>('walking');
  const [showTransferPopup, setShowTransferPopup] = useState(false);
  const [transferStepIndex, setTransferStepIndex] = useState<number | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(false);
  const watchId = useRef<number | null>(null);
  
  // Zustand 스토어에서 계산 결과 가져오기
  const { origin, destination, route, weather, isLoading, error } = useCalculationStore();
  const { pathId, isCreator } = useGroupStore();

  // 웹에서 위치 추적 시작
  useEffect(() => {
    if (pathId && !isCreator) {
      const startLocationSharing = async () => {
        try {
          const success = await locationService.startLocationSharing({
            pathId,
            enabled: true,
            interval: 60000, // 1분마다
          });
          
          if (success) {
            console.log('웹에서 위치 공유 시작됨');
          } else {
            console.warn('웹에서 위치 공유 시작 실패');
          }
        } catch (error) {
          console.error('웹 위치 공유 오류:', error);
        }
      };
      
      startLocationSharing();
      
      // 컴포넌트 언마운트 시 위치 공유 중지
      return () => {
        locationService.stopLocationSharing();
      };
    }
  }, [pathId, isCreator]);

  // currentLocation과 ref 동기화 함수
  const setCurrentLocationBoth = (location: { latitude: number; longitude: number }) => {
    setCurrentLocation(location);
    currentLocationRef.current = location;
  };

  // TMap 도보 경로 가져오기 함수
  const fetchTMapWalkingRoutes = useCallback(async () => {
    if (route?.steps && !isLoading) {
      const walkingSteps = route.steps.filter(step => step.mode === 'WALKING');
      console.log(`도보 경로 ${walkingSteps.length}개 발견`);
      
      if (walkingSteps.length > 0) {
        const newWalkingRoutes: Record<number, any> = {};
        
        // 각 도보 경로에 대해 TMap API 호출
        for (let i = 0; i < route.steps.length; i++) {
          const step = route.steps[i];
          if (step.mode === 'WALKING') {
            console.log(`도보 경로 ${i} 처리 중: ${step.start_location.lat},${step.start_location.lng} → ${step.end_location.lat},${step.end_location.lng}`);
            
            const origin = {
              latitude: step.start_location.lat,
              longitude: step.start_location.lng
            };
            const destination = {
              latitude: step.end_location.lat,
              longitude: step.end_location.lng
            };
            
            try {
              const tMapRoute = await fetchWalkingRoute(origin, destination);
              if (tMapRoute) {
                console.log(`TMap 도보 경로 ${i} 성공:`, tMapRoute.features.length, '피처');
                newWalkingRoutes[i] = tMapRoute;
              } else {
                console.log(`TMap 도보 경로 ${i} 실패: 데이터 없음`);
              }
            } catch (error) {
              console.error(`TMap 도보 경로 ${i} 오류:`, error);
            }
          }
        }
        
        if (Object.keys(newWalkingRoutes).length > 0) {
          console.log(`총 ${Object.keys(newWalkingRoutes).length}개 TMap 도보 경로 로드됨`);
          setWalkingRoutes(newWalkingRoutes);
        }
      }
    }
  }, [route?.steps, isLoading]);

  // TMap 기반 도보 상세 안내 텍스트 생성
  const getTMapWalkingInstruction = (stepIndex: number) => {
    if (!walkingRoutes[stepIndex] || !currentLocationRef.current) {
      return null;
    }
    const features = walkingRoutes[stepIndex].features;
    // 주요 turn point만 추출 (turnType이 있는 Point)
    const turnPoints = features
      .filter((feature: any) => feature.geometry.type === 'Point' && feature.properties.turnType)
      .map((feature: any) => ({
        ...feature,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        turnType: feature.properties.turnType,
        description: feature.properties.description || '',
      }))
      .filter((tp: any) => tp.turnType !== 200 && tp.turnType !== 201); // 출발/도착 제외

    if (turnPoints.length === 0) return null;
    const curLat = currentLocationRef.current.latitude;
    const curLng = currentLocationRef.current.longitude;

    let foundIdx = -1;
    for (let i = 0; i < turnPoints.length - 1; i++) {
      const x1 = turnPoints[i].lng, y1 = turnPoints[i].lat;
      const x2 = turnPoints[i+1].lng, y2 = turnPoints[i+1].lat;
      const x0 = curLng, y0 = curLat;
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx*dx + dy*dy;
      if (len2 === 0) continue;
      const t = ((x0 - x1) * dx + (y0 - y1) * dy) / len2;
      if (t >= 0 && t <= 1) {
        foundIdx = i+1;
        break;
      }
    }
    let nextTurn;
    if (foundIdx !== -1) {
      nextTurn = turnPoints[foundIdx];
    } else {
      // 선분 위에 없으면 가장 가까운 turn point 안내
      let minDist = Infinity, minIdx = 0;
      for (let i = 0; i < turnPoints.length; i++) {
        const d = calculateDistance(curLat, curLng, turnPoints[i].lat, turnPoints[i].lng);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      nextTurn = turnPoints[minIdx];
    }
    const distance = calculateDistance(curLat, curLng, nextTurn.lat, nextTurn.lng);
    let direction = '방향';
    switch (nextTurn.turnType) {
      case 11: direction = '직진'; break;
      case 12: direction = '좌회전'; break;
      case 13: direction = '우회전'; break;
      case 14: direction = '유턴'; break;
      case 16: direction = '8시 방향'; break;
      case 17: direction = '10시 방향'; break;
      case 18: direction = '2시 방향'; break; 
      case 19: direction = '4시 방향'; break;
      case 125: direction = '육교'; break;
      case 126: direction = '지하보도'; break;
      case 211: direction = '횡단보도'; break;
      case 212: direction = '좌측 횡단보도'; break;
      case 213: direction = '우측 횡단보도'; break;
      case 214: direction = '8시 방향 횡단보도'; break;
      case 215: direction = '10시 방향 횡단보도'; break;
      case 216: direction = '2시 방향 횡단보도'; break;
      case 217: direction = '4시 방향 횡단보도'; break;
      default: direction = '직진';
    }
    const distText = `${Math.round(distance)}m 앞`;
    return `${distText} ${direction}`;
  };

  // 도보 안내 문구 업데이트 함수
  const updateWalkingInstruction = (currentPos: { latitude: number; longitude: number }) => {
    if (!route?.steps || !walkingRoutes) return;
    for (let i = 0; i < route.steps.length; i++) {
      const step = route.steps[i];
      if (step.mode === 'WALKING' && walkingRoutes[i]) {
        const instruction = getTMapWalkingInstruction(i);
        if (instruction) {
          setCurrentWalkingInstruction(instruction);
          return;
        }
      }
    }
  };

  // TMap 도보 경로 로드
  useEffect(() => {
    fetchTMapWalkingRoutes();
  }, [fetchTMapWalkingRoutes]);

  // Google Maps API 로딩
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadGoogleMaps = async () => {
        try {
          // Google Maps Script 로딩
          if (!window.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}&libraries=geometry`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
              setGoogleMaps(window.google);
              setMapLoaded(true);
            };

            script.onerror = () => {
              console.error('Google Maps API 로딩 실패');
              setMapLoaded(false);
            };

            document.head.appendChild(script);
          } else {
            setGoogleMaps(window.google);
            setMapLoaded(true);
          }
        } catch (error) {
          console.error('Google Maps 로딩 오류:', error);
          setMapLoaded(false);
        }
      };

      loadGoogleMaps();
    }
  }, []);

  // 웹용 현재 위치 가져오기
  useEffect(() => {
    const success = (position: GeolocationPosition) => {
      const crd = position.coords;
      console.log("Your current position is:");
      console.log(`Latitude : ${crd.latitude}`);
      console.log(`Longitude: ${crd.longitude}`);
      console.log(`More or less ${crd.accuracy} meters.`);
      
      setCurrentLocation({
        latitude: crd.latitude,
        longitude: crd.longitude
      });
    };

    const error = (err: GeolocationPositionError) => {
      console.warn(`ERROR(${err.code}): ${err.message}`);
      console.error('위치 정보를 가져오는데 실패했습니다:', err);
    };

    requestWebLocation(success, error);
  }, []);

  const initializeMap = useCallback(() => {
    if (!googleMaps || !mapRef.current) return;

    const center = currentLocation 
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : origin 
      ? { lat: origin.coordinates.latitude, lng: origin.coordinates.longitude }
      : { lat: 37.5665, lng: 126.9780 };

    const map = new googleMaps.maps.Map(mapRef.current, {
      zoom: 16,
      center: center,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // 현재 위치 마커 (최우선)
    if (currentLocation) {
      new googleMaps.maps.Marker({
        position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
        map: map,
        title: '현재 위치',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
      });
    }

    // 출발지 마커
    if (origin) {
      new googleMaps.maps.Marker({
        position: { lat: origin.coordinates.latitude, lng: origin.coordinates.longitude },
        map: map,
        title: '출발지: ' + origin.name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });
    }

    // 도착지 마커
    if (destination) {
      new googleMaps.maps.Marker({
        position: { lat: destination.coordinates.latitude, lng: destination.coordinates.longitude },
        map: map,
        title: '도착지: ' + destination.name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });
    }

    // 경로 폴리라인 그리기
    if (route?.steps) {
      route.steps.forEach((step, index) => {
        if (step.polyline) {
          // TMap 도보 경로가 있으면 우선 사용하고, 없으면 기본 폴리라인 사용
          let path: {lat: number, lng: number}[] = [];
          
          if (step.mode === 'WALKING' && walkingRoutes[index]) {
            // TMap 도보 경로 사용
            const tmapCoords = extractTMapCoordinates(walkingRoutes[index]);
            path = tmapCoords.map(coord => ({lat: coord.latitude, lng: coord.longitude}));
            console.log(`스텝 ${index}: TMap 도보 경로 사용 (${path.length}개 좌표)`);
          } else {
            // 기본 Google 폴리라인 사용
            path = convertToGoogleMapsPositions(step.polyline);
            console.log(`스텝 ${index}: 기본 폴리라인 사용 (${path.length}개 좌표)`);
          }
          
          if (path.length > 0) {
            new googleMaps.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: step.mode === 'WALKING' ? '#2563EB' : getPolylineColor(step.vehicle_type),
              strokeOpacity: 0.8,
              strokeWeight: 5,
              map: map
            });
          }
        }
      });
    }

    // 항상 현재 위치 우선, 그 다음 출발지 기준으로 줌 레벨 16 유지
    if (currentLocation) {
      map.setCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      map.setZoom(16);
    } else if (origin) {
      map.setCenter({ lat: origin.coordinates.latitude, lng: origin.coordinates.longitude });
      map.setZoom(16);
    } else if (destination) {
      map.setCenter({ lat: destination.coordinates.latitude, lng: destination.coordinates.longitude });
      map.setZoom(16);
    }
  }, [googleMaps, origin, destination, route, currentLocation, walkingRoutes]);

  // Google Maps 초기화
  useEffect(() => {
    if (mapLoaded && googleMaps && mapRef.current) {
      initializeMap();
    }
  }, [mapLoaded, googleMaps, initializeMap]);

  // 내 위치로 이동
  const goToMyLocation = () => {
    const success = (position: GeolocationPosition) => {
      const crd = position.coords;
      console.log("Updated current position:");
      console.log(`Latitude : ${crd.latitude}`);
      console.log(`Longitude: ${crd.longitude}`);
      
      const newLocation = {
        latitude: crd.latitude,
        longitude: crd.longitude
      };
      
      setCurrentLocationBoth(newLocation);
      
      // 출발지에서 10m 이상 벗어났는지 확인
      if (origin && !isNavigationStartedRef.current) {
        const distanceFromOrigin = calculateDistance(
          crd.latitude,
          crd.longitude,
          origin.coordinates.latitude,
          origin.coordinates.longitude
        );
        if (distanceFromOrigin >= 10) {
          setIsNavigationStarted(true);
          isNavigationStartedRef.current = true;
        }
      }

      // 환승 근처 도달 감지 (TRANSIT step 출발 정류장)
      if (route?.steps) {
        for (let i = 0; i < route.steps.length; i++) {
          const step = route.steps[i];
          if (step.mode === 'TRANSIT' && step.start_location && step.start_location.lat && step.start_location.lng) {
            const dist = calculateDistance(
              newLocation.latitude,
              newLocation.longitude,
              step.start_location.lat,
              step.start_location.lng
            );
            if (dist < 50 && navigationMode === 'walking') {
              setShowTransferPopup(true);
              setTransferStepIndex(i);
              break;
            }
          }
        }
      }

      // 네비게이션이 시작되었고 도보 경로가 있을 때 안내 문구 업데이트
      if (isNavigationStartedRef.current && navigationMode === 'walking') {
        updateWalkingInstruction(newLocation);
      }
      
      if (googleMaps && mapRef.current) {
        const map = new googleMaps.maps.Map(mapRef.current, {
          zoom: 16,
          center: { lat: newLocation.latitude, lng: newLocation.longitude }
        });
        
        // 현재 위치 마커 추가
        new googleMaps.maps.Marker({
          position: { lat: newLocation.latitude, lng: newLocation.longitude },
          map: map,
          title: '현재 위치',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
          }
        });
      }

      // 위치 추적 시작
      if (!isFollowingUser) {
        setIsFollowingUser(true);
        startWatching();
      }
    };

    const error = (err: GeolocationPositionError) => {
      console.warn(`위치 오류(${err.code}): ${err.message}`);
      alert('위치 정보를 가져올 수 없습니다. 브라우저에서 위치 접근을 허용했는지 확인해주세요.');
    };

    requestWebLocation(success, error);
  };

  // 위치 추적 시작
  const startWatching = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const crd = position.coords;
        const newLocation = {
          latitude: crd.latitude,
          longitude: crd.longitude
        };
        
        setCurrentLocationBoth(newLocation);

        // 출발지에서 10m 이상 벗어났는지 확인
        if (origin && !isNavigationStartedRef.current) {
          const distanceFromOrigin = calculateDistance(
            crd.latitude,
            crd.longitude,
            origin.coordinates.latitude,
            origin.coordinates.longitude
          );
          if (distanceFromOrigin >= 10) {
            setIsNavigationStarted(true);
            isNavigationStartedRef.current = true;
          }
        }

        // 환승 근처 도달 감지
        if (route?.steps) {
          for (let i = 0; i < route.steps.length; i++) {
            const step = route.steps[i];
            if (step.mode === 'TRANSIT' && step.start_location && step.start_location.lat && step.start_location.lng) {
              const dist = calculateDistance(
                newLocation.latitude,
                newLocation.longitude,
                step.start_location.lat,
                step.start_location.lng
              );
              if (dist < 50 && navigationMode === 'walking') {
                setShowTransferPopup(true);
                setTransferStepIndex(i);
                break;
              }
            }
          }
        }

        // 네비게이션이 시작되었고 도보 경로가 있을 때 안내 문구 업데이트
        if (isNavigationStartedRef.current && navigationMode === 'walking') {
          updateWalkingInstruction(newLocation);
        }
      },
      (err) => {
        console.warn(`위치 추적 오류(${err.code}): ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );
  };

  // 컴포넌트 언마운트 시 위치 추적 중지
  useEffect(() => {
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // 경로 정보가 없거나 에러가 발생하면 처리
  useEffect(() => {
    if (!isLoading && (!route || error)) {
      const errorMessage = error || "경로 계산 정보가 없습니다.";
      Alert.alert("오류", errorMessage, [
        { text: "홈으로", onPress: () => router.back() },
      ]);
    }
  }, [route, isLoading, error]);

  const handleBackPress = () => {
    router.back();
  };

  // 날짜 포맷팅 함수
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const period = hours < 12 ? "오전" : "오후";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${h12}:${minutes}`;
  };

  // 상단 안내 메시지 생성
  const getTopMessage = () => {
    if (!route) return null;
    const time = formatTime(route.departureTime);
    if (weather?.condition === "rainy" || weather?.condition === "cloudy") {
      return { 
        message: "우산을 챙겨서 출발하세요!",
        time
      };
    }
    return {
      message: "출발하세요!",
      time
    };
  };

  // 환승 정보 렌더링
  const renderTransferInfo = () => {
    if (!route?.steps) return null;
    const transitSteps = route.steps.filter(step => step.mode === 'TRANSIT');
    if (transitSteps.length === 0) return null;

    return (
      <View style={{ marginVertical: 16 }}>
        {transitSteps.map((step, idx) => (
          (() => { console.log('transit step:', step); return null; })(),
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              padding: 12,
              borderRadius: 10,
              backgroundColor: '#F8F9FA',
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View
              style={{
                width: 6,
                height: 48,
                borderRadius: 3,
                backgroundColor: getPolylineColor(step.vehicle_type),
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <TextMedium style={{ fontFamily: "Pretendard_Bold", fontSize: 16, color: "#222" }}>
                {step.line_name}
                {step.short_name ? ` (${step.short_name})` : ""}
              </TextMedium>
              <TextSmall style={{ color: "#666", marginTop: 2 }}>
                {step.departure_stop} ({step.departure_time}) → {step.arrival_stop} ({step.arrival_time})
              </TextSmall>
              <TextSmall style={{ color: "#888", marginTop: 2 }}>
                {step.num_stops ? `${step.num_stops}개 정차 • ` : ""}
                {step.duration_text}
              </TextSmall>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 타임라인 바 렌더링
  const renderTimelineBar = () => {
    if (!route || !route.steps) return null;

    let totalMinutes = 0;
    route.steps.forEach(step => {
      if (typeof step.duration_text === "string") {
        const minMatch = step.duration_text.match(/(\d+)분/);
        const hourMatch = step.duration_text.match(/(\d+)시간/);
        const min = minMatch ? parseInt(minMatch[1], 10) : 0;
        const hour = hourMatch ? parseInt(hourMatch[1], 10) : 0;
        totalMinutes += hour * 60 + min;
      }
    });

    const durationMinutes = route.duration ? Math.round(route.duration / 60) : 0;

    const getStepMinutes = (step: any) => {
      if (typeof step.duration_text === "string") {
        const minMatch = step.duration_text.match(/(\d+)분/);
        const hourMatch = step.duration_text.match(/(\d+)시간/);
        const min = minMatch ? parseInt(minMatch[1], 10) : 0;
        const hour = hourMatch ? parseInt(hourMatch[1], 10) : 0;
        return hour * 60 + min;
      }
      return 10;
    };

    const getBarColor = (step: any) => {
      if (step.mode === "WALKING") return "#CBD5E1";
      return getPolylineColor(step.vehicle_type);
    };

    return (
      <View style={{ marginVertical: 5, position: "relative" }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 8 }}>
          <TextXLarge style={{ fontFamily: "Pretendard_Bold", color: "#222" }}>
            {Math.floor(totalMinutes / 60) > 0 ? `${Math.floor(totalMinutes / 60)}시간 ` : ""}
            {totalMinutes % 60 > 0 ? `${totalMinutes % 60}분` : ""}
          </TextXLarge>
          {durationMinutes > 0 && (
            <TextXLarge style={{ fontFamily: "Pretendard_Bold", color: "#3457D5" }}>
              {" / "}
              {Math.floor(durationMinutes / 60) > 0 ? `${Math.floor(durationMinutes / 60)}시간 ` : ""}
              {durationMinutes % 60 > 0 ? `${durationMinutes % 60}분` : ""}
            </TextXLarge>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", minHeight: 38 }}>
          {route.steps.map((step, idx) => {
            const minutes = getStepMinutes(step);
            const color = getBarColor(step);
            return (
              <View
                key={idx}
                style={{
                  flex: minutes,
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 28,
                  marginHorizontal: idx === 0 ? 0 : 2,
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: color,
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                />
                <TextSmall style={{
                  color: "#64748B",
                  fontSize: 12,
                  marginTop: 2,
                  fontFamily: "Pretendard_SemiBold"
                }}>
                  {step.duration_text}
                </TextSmall>
              </View>
            );
          })}
        </View>
        {route.arrivalTime && (
          <TextSmall
            style={{
              position: "absolute",
              right: 0,
              bottom: -18,
              color: "#A0A0A0",
              fontSize: 12,
              fontFamily: "Pretendard_SemiBold",
              marginRight: 2,
            }}
          >
            도착 {formatTime(route.arrivalTime)}
          </TextSmall>
        )}
      </View>
    );
  };

  // Google Maps 렌더링 함수
  const renderMap = () => {
    if (!mapLoaded) {
      return (
        <View style={[styles.mapSection, { height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DEEBFF' }]}>
          <ActivityIndicator size="large" color="#3457D5" />
          <TextMedium style={{ marginTop: 10, color: '#3457D5' }}>
            지도를 로딩 중...
          </TextMedium>
        </View>
      );
    }

    return (
      <View style={styles.mapSection}>
        <div
          ref={mapRef}
          style={{
            height: '300px',
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        />

        {/* 내 위치 버튼 */}
        <PressableOpacity
          style={styles.myLocationBtn}
          onPress={goToMyLocation}
        >
          <View style={styles.myLocationIcon}>
            <Text style={styles.myLocationText}>📍</Text>
          </View>
        </PressableOpacity>
      </View>
    );
  };

  // 로딩 중이면 로딩 인디케이터 표시
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3457D5" />
          <TextMedium style={styles.loadingText}>
            경로를 계산하는 중...
          </TextMedium>
          <TextSmall style={styles.loadingText}>
            잠시만 기다려 주세요
          </TextSmall>
        </View>
      </SafeAreaView>
    );
  }

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorContainer}>
          <DynamicIcon name="alert-circle" size={48} color="#FF3B30" />
          <TextMedium style={styles.errorText}>{error}</TextMedium>
          <PressableOpacity onPress={handleBackPress} style={styles.backButton}>
            <TextMedium style={styles.backButtonText}>
              홈으로 돌아가기
            </TextMedium>
          </PressableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 로딩이 끝났는데 경로 정보가 없으면 에러 표시
  if (!route) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorContainer}>
          <DynamicIcon name="x-circle" size={48} color="#FF9500" />
          <TextMedium style={styles.errorText}>경로 정보를 찾을 수 없습니다</TextMedium>
          <PressableOpacity onPress={handleBackPress} style={styles.backButton}>
            <TextMedium style={styles.backButtonText}>
              홈으로 돌아가기
            </TextMedium>
          </PressableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={true}>
          {/* 상단 메시지 카드 */}
          <View style={styles.header}>
            {/* 좌측 상단 뒤로가기 버튼 */}
            <PressableOpacity
              style={styles.backIconOnly}
              onPress={handleBackPress}
              hitSlop={10}
            >
              {/* 웹 환경에서는 DynamicIcon이 제대로 렌더링되지 않을 수 있으므로 대체 텍스트/이모지 사용 */}
              <span style={{ fontSize: 22, color: "#888" }}>←</span>
            </PressableOpacity>
            {/* 우측 상단 공유 버튼 */}
            {/* <PressableOpacity
              style={styles.shareIconOnly}
              onPress={() => {
                window.alert("공유 기능\n연결 예정입니다.");
              }}
              hitSlop={10}
            >
              <span style={{ fontSize: 20, color: "#888" }}>🔗</span>
            </PressableOpacity> */}
            {isNavigationStarted && currentWalkingInstruction && navigationMode === 'walking' ? (
              // 도보 안내 문구일 때
              <TextXXXLarge style={{ 
                color: "#3457D5", 
                fontFamily: "Pretendard_Bold", 
                textAlign: "center",
              }}>
                {currentWalkingInstruction}
              </TextXXXLarge>
            ) : (
              // 기본 메시지일 때
              getTopMessage() && (
                <>
                  <TextXXXLarge style={{ color: "#3457D5", fontFamily: "Pretendard_ExtraBold", marginBottom: 4, textAlign: "center" }}>
                    {getTopMessage() ? getTopMessage()!.time : ""}
                  </TextXXXLarge>
                  <TextXLarge style={{ color: "#3457D5", fontFamily: "Pretendard_Bold", textAlign: "center" }}>
                    {getTopMessage()!.message}
                  </TextXLarge>
                </>
              )
            )}
          </View>

          {/* 구분선 */}
          <View style={{
            height: 1,
            backgroundColor: "#C6C8C9",
            width: "100%",
            marginBottom: 16
          }} />

          {/* Google Maps 지도 - 상단 카드 아래, 타임라인 바 위에 위치 */}
          {renderMap()}

          {/* 상세 이동 정보 */}
          <View style={{ marginHorizontal: 24 }}>
            {/* 타임라인 바 - 20분/20분 텍스트 */}
            {renderTimelineBar()}
            {/* 환승 정보 */}
            {renderTransferInfo()}
          </View>

          <SafeAreaView style={styles.safe} edges={["bottom"]}></SafeAreaView>
        </ScrollView>

        {/* 환승 팝업 */}
        {showTransferPopup && transferStepIndex !== null && route?.steps && (
          <View style={styles.transferPopupOverlay}>
            <View style={styles.transferPopup}>
              <TextXLarge style={styles.transferPopupTitle}>
                🚇 {route.steps[transferStepIndex].departure_stop}
              </TextXLarge>
              <TextMedium style={styles.transferPopupText}>
                {route.steps[transferStepIndex].line_name} 탑승 지점에 도착했습니다
              </TextMedium>
              <PressableOpacity
                style={styles.transferCompleteButton}
                onPress={() => {
                  setNavigationMode('transit');
                  setShowTransferPopup(false);
                  setCurrentWalkingInstruction(null);
                }}
              >
                <TextMedium style={styles.transferCompleteButtonText}>
                  탑승 완료
                </TextMedium>
              </PressableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  scrollContainer: {
    flex: 1,
  },
  header: {
    height: 100,
    justifyContent: 'center',
    borderBottomColor: '#C6C8C9',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    position: 'relative',
  },
  mapSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    position: 'relative',
  },
  // 환승 팝업 스타일
  transferPopupOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    zIndex: 1000,
  },
  transferPopup: {
    backgroundColor: '#FF4444',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  transferPopupTitle: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard_Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  transferPopupText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard_Medium',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  transferCompleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
  },
  transferCompleteButtonText: {
    color: '#FF4444',
    fontFamily: 'Pretendard_Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  myLocationIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationText: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 12,
    textAlign: "center",
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3457D5",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
  },
  backIconOnly: {
    position: 'absolute',
    left: 8,
    top: 8,
    zIndex: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  shareIconOnly: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
});