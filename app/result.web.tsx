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

// 동적으로 로딩할 Leaflet 컴포넌트들
let MapContainer: any = null;
let TileLayer: any = null;
let Marker: any = null;
let Polyline: any = null;
let Popup: any = null;
let L: any = null;

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

// 폴리라인 데이터를 Leaflet 형식으로 변환하는 함수
const convertToLeafletPositions = (polylineString: string): [number, number][] => {
  try {
    const decoded = decodePolygon(polylineString);
    return decoded.map(point => [point.latitude, point.longitude] as [number, number]);
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
  
  // Zustand 스토어에서 계산 결과 가져오기
  const { origin, destination, route, weather, isLoading, error } =
    useCalculationStore();

  // 웹 환경에서 Leaflet 동적 로딩
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadLeaflet = async () => {
        try {
          // Leaflet CSS 동적 로딩
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
          }

          // Leaflet 라이브러리 동적 import
          const leafletModule = await import('leaflet');
          L = leafletModule.default;

          // React-Leaflet 컴포넌트들 동적 import
          const reactLeafletModule = await import('react-leaflet');
          MapContainer = reactLeafletModule.MapContainer;
          TileLayer = reactLeafletModule.TileLayer;
          Marker = reactLeafletModule.Marker;
          Polyline = reactLeafletModule.Polyline;
          Popup = reactLeafletModule.Popup;

          // Leaflet 아이콘 설정 (앱과 동일한 아이콘)
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          setMapLoaded(true);
        } catch (error) {
          console.error('Leaflet 로딩 오류:', error);
          setMapLoaded(false);
        }
      };

      loadLeaflet();
    }
  }, []);

  // 웹용 현재 위치 가져오기 (앱과 동일한 기능)
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

  // 지도 로딩 후 카메라 애니메이션 (앱과 유사한 효과)
  const mapViewLoaded = async () => {
    await delay(1000);
    if (mapRef.current) {
      try {
        const center = origin 
          ? [origin.coordinates.latitude, origin.coordinates.longitude]
          : [37.5665, 126.9780];
        mapRef.current.setView(center, 15);
      } catch (error) {
        console.log('지도 애니메이션 오류:', error);
      }
    }
  };

  // 내 위치로 이동 (앱과 동일한 기능)
  const goToMyLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 18);
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

  // 날짜 포맷팅 함수 (앱과 동일)
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const period = hours < 12 ? "오전" : "오후";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${h12}:${minutes}`;
  };

  // 상단 안내 메시지 생성 (앱과 동일)
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

  // 환승 정보 렌더링 (앱과 동일)
  const renderTransferInfo = () => {
    if (!route?.steps) return null;
    const transitSteps = route.steps.filter(step => step.mode === 'TRANSIT');
    if (transitSteps.length === 0) return null;

    return (
      <View style={{ marginVertical: 16 }}>
        {transitSteps.map((step, idx) => (
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

  // 타임라인 바 렌더링 (앱과 동일)
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

  // 지도 렌더링 함수 (앱과 유사한 스타일)
  const renderMap = () => {
    if (!mapLoaded || !MapContainer || !TileLayer || !Marker || !Polyline || !Popup) {
      return (
        <View style={[styles.mapSection, { height: 580, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DEEBFF' }]}>
          <ActivityIndicator size="large" color="#3457D5" />
          <TextMedium style={{ marginTop: 10, color: '#3457D5' }}>
            지도를 로딩 중...
          </TextMedium>
        </View>
      );
    }

    return (
      <View style={styles.mapSection}>
        <MapContainer
          center={[
            origin?.coordinates.latitude || 37.5665,
            origin?.coordinates.longitude || 126.9780
          ]}
          zoom={13}
          style={{ height: '580px', width: '100%' }}
          ref={mapRef}
          whenCreated={mapViewLoaded}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* 출발지 마커 (파란색) */}
          {origin && (
            <Marker
              position={[origin.coordinates.latitude, origin.coordinates.longitude]}
            >
              <Popup>
                <div>
                  <strong>출발지</strong><br />
                  {origin.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 도착지 마커 (빨간색) */}
          {destination && (
            <Marker
              position={[destination.coordinates.latitude, destination.coordinates.longitude]}
            >
              <Popup>
                <div>
                  <strong>도착지</strong><br />
                  {destination.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 경로 폴리라인 */}
          {route?.steps && route.steps.map((step, index) => (
            <React.Fragment key={`polyline-${index}`}>
              {step.polyline && (
                <Polyline
                  positions={convertToLeafletPositions(step.polyline)}
                  color={step.mode === 'WALKING' ? '#2563EB' : getPolylineColor(step.vehicle_type)}
                  weight={5}
                  opacity={0.8}
                />
              )}
            </React.Fragment>
          ))}
        </MapContainer>

        {/* 내 위치 버튼 (앱과 동일) */}
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

  // 로딩 중이면 로딩 인디케이터 표시 (앱과 동일)
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

  // 에러가 있으면 에러 메시지 표시 (앱과 동일)
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

  // 로딩이 끝났는데 경로 정보가 없으면 에러 표시 (앱과 동일)
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
          {/* 상단 메시지 (앱과 동일) */}
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
            marginBottom: 0
          }} />

          {/* 지도 */}
          {renderMap()}

          {/* 상세 이동 정보 (앱과 동일) */}
          <View style={{ marginHorizontal: 24 }}>
            {/* 타임라인 바 */}
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
  },
  mapSection: {
    marginBottom: 12,
    position: 'relative',
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

