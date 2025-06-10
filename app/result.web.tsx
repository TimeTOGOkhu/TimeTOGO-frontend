// app/result.web.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCalculationStore } from "@store/calculationStore";
import {
  TextSmall,
  TextMedium,
  TextXLarge,
  TextXXXLarge,
  TextNormal,
} from "@components/TextSize";
import { DynamicIcon } from "@components/DynamicIcon";
import PressableOpacity from "@/components/PressableOpacity";
import { decodePolygon } from "@/services/routeService";

// Google Maps API key - 실제 키로 교체해야 합니다
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

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

// 지연 함수
function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export default function ResultScreen() {
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [googleMaps, setGoogleMaps] = useState<any>(null);

  // Zustand 스토어에서 계산 결과 가져오기
  const { origin, destination, route, weather, isLoading, error } =
    useCalculationStore();

  // Google Maps API 로딩
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadGoogleMaps = async () => {
        try {
          // Google Maps Script 로딩
          if (!window.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
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
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
        }
      );
    }
  }, []);

  // Google Maps 초기화
  useEffect(() => {
    if (mapLoaded && googleMaps && mapRef.current) {
      initializeMap();
    }
  }, [mapLoaded, googleMaps, origin, destination, route]);

  const initializeMap = () => {
    if (!googleMaps || !mapRef.current) return;

    const center = origin 
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
          const path = convertToGoogleMapsPositions(step.polyline);
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

    // 항상 출발지 기준으로 줌 레벨 16 유지
    if (origin) {
      map.setCenter({ lat: origin.coordinates.latitude, lng: origin.coordinates.longitude });
      map.setZoom(16);
    } else if (destination) {
      map.setCenter({ lat: destination.coordinates.latitude, lng: destination.coordinates.longitude });
      map.setZoom(16);
    }
  };

  // 내 위치로 이동
  const goToMyLocation = () => {
    if (currentLocation && googleMaps && mapRef.current) {
      const map = new googleMaps.maps.Map(mapRef.current, {
        zoom: 16,
        center: { lat: currentLocation.latitude, lng: currentLocation.longitude }
      });
    }
  };

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
            {getTopMessage() && (
              <>
                <TextXXXLarge style={{ color: "#3457D5", fontFamily: "Pretendard_ExtraBold", marginBottom: 4, textAlign: "center" }}>
                  {getTopMessage() ? getTopMessage()!.time : ""}
                </TextXXXLarge>
                <TextXLarge style={{ color: "#3457D5", fontFamily: "Pretendard_Bold", textAlign: "center" }}>
                  {getTopMessage()!.message}
                </TextXLarge>
              </>
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
  },
  mapSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
});