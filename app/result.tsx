import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
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
import { TransportIcon } from "@components/TransportIcon";
import PressableOpacity from "@/components/PressableOpacity";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { decodePolygon } from "@/services/routeService";

// 네이버맵 스타일러 추천 스타일(밝고 심플, 주요 도로/철도/공원/수역 강조, 불필요한 요소 최소화)
const mapStyle = [
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f3f4f6" }]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffe082" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffe082" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#ff7043" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#b3e5fc" }]
  },
  {
    "featureType": "park",
    "elementType": "geometry",
    "stylers": [{ "color": "#dcedc8" }]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  }
]
;

// 교통수단 유형을 한글로 변환하는 함수
const getTransportTypeText = (vehicleType?: string): string => {
  if (!vehicleType) return "대중교통";
  
  switch(vehicleType.toUpperCase()) {
    case 'BUS': return "버스";
    case 'SUBWAY': return "지하철";
    case 'TRAM': return "트램";
    case 'HEAVY_RAIL': return "기차";
    case 'LIGHT_RAIL': return "경전철";
    case 'WALKING': return "도보";
    default: return "대중교통";
  }
};

// 교통수단 유형에 따른 경로 색상 설정
const getPolylineColor = (vehicleType?: string): string => {
  if (!vehicleType) return "#1D72E8";  // 기본 색상
  
  switch(vehicleType.toUpperCase()) {
    case 'BUS': return "#4CAF50";      // 버스는 녹색
    case 'SUBWAY': return "#FF9800";   // 지하철은 주황색
    case 'TRAM': return "#9C27B0";     // 트램은 보라색
    case 'HEAVY_RAIL': return "#F44336"; // 기차는 빨간색
    case 'LIGHT_RAIL': return "#00BCD4"; // 경전철은 시안색
    default: return "#1D72E8";          // 기본 색상 (파란색)
  }
};


export default function ResultScreen() {

  // Zustand 스토어에서 계산 결과 가져오기
  const { origin, destination, route, weather, isLoading, error } =
    useCalculationStore();

  // 날씨 상태에 따른 아이콘 및 메시지 결정
  const getWeatherInfo = () => {
    if (!weather)
      return { icon: "sun", message: "날씨 정보 없음", iconColor: "#FFC107" };
    
    // 날씨 아이콘이 제공되는 경우 OpenWeatherMap에서 가져온 아이콘 사용
    const openWeatherIconMap: Record<string, string> = {
      "01d": "sun",
      "01n": "moon",
      "02d": "cloud-sun",
      "02n": "cloud-moon",
      "03d": "cloud",
      "03n": "cloud",
      "04d": "cloud",
      "04n": "cloud",
      "09d": "cloud-drizzle",
      "09n": "cloud-drizzle",
      "10d": "cloud-rain",
      "10n": "cloud-rain",
      "11d": "cloud-lightning",
      "11n": "cloud-lightning",
      "13d": "cloud-snow",
      "13n": "cloud-snow",
      "50d": "wind",
      "50n": "wind"
    };

    // 강수확률 메시지 생성
    let precipMessage = "";
    if (weather.precipitationChance !== undefined && weather.precipitationChance > 0) {
      precipMessage = `강수확률 ${weather.precipitationChance}%`;
    }

    // 날씨에 따른 메시지와 아이콘 결정
    switch (weather.condition) {
      case "sunny":
        return {
          icon: weather.icon && openWeatherIconMap[weather.icon] ? openWeatherIconMap[weather.icon] : "sun",
          message: `맑은 날씨입니다! ${precipMessage}`,
          iconColor: "#FFC107",
        };
      case "cloudy":
        return {
          icon: weather.icon && openWeatherIconMap[weather.icon] ? openWeatherIconMap[weather.icon] : "cloud",
          message: `구름이 많습니다. ${precipMessage}`,
          iconColor: "#607D8B",
        };
      case "rainy":
        return {
          icon: weather.icon && openWeatherIconMap[weather.icon] ? openWeatherIconMap[weather.icon] : "umbrella",
          message: `비가 오니 우산을 챙기세요! ${precipMessage}`,
          iconColor: "#333",
        };
      case "snowy":
        return {
          icon: weather.icon && openWeatherIconMap[weather.icon] ? openWeatherIconMap[weather.icon] : "cloud-snow",
          message: `눈이 오니 따뜻하게 입으세요! ${precipMessage}`,
          iconColor: "#90A4AE",
        };
      default:
        return {
          icon: weather.icon && openWeatherIconMap[weather.icon] ? openWeatherIconMap[weather.icon] : "sun",
          message: `날씨 정보를 확인하세요. ${precipMessage}`,
          iconColor: "#FFC107",
        };
    }
  };

  // 경로 정보가 없거나 에러가 발생하면 처리
  useEffect(() => {
    // 로딩이 끝났는데 route가 없거나 error가 있는 경우
    if (!isLoading && (!route || error)) {
      const errorMessage = error || "경로 계산 정보가 없습니다.";
      Alert.alert("오류", errorMessage, [
        { text: "홈으로", onPress: () => router.back() },
      ]);
    }
  }, [route, isLoading, error]);

  const handleBackPress = () => {
    router.back(); // 이전 화면으로 돌아가기
  };

  // 날짜 포맷팅 함수 (오전/오후 포함, 공백 추가)
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

  // 네이버지도 스타일 환승정보: 노선색, 노선명, 출발정류장, 도착정류장, 출발/도착시간, 소요시간, 정차수 등
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
            {/* 노선 색상 바 */}
            <View
              style={{
                width: 6,
                height: 48,
                borderRadius: 3,
                backgroundColor: getPolylineColor(step.vehicle_type),
                marginRight: 12,
              }}
            />
            {/* 환승 정보 텍스트 */}
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

  // 상세 이동정보
  const renderDetailedTimeline = () => {
    if (!route || !route.steps) return null;
    return (
      <View style={{ marginVertical: 16 }}>
        {route.steps.map((step, idx) => (
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
            {/* 단계별 색상 바 */}
            <View
              style={{
                width: 6,
                height: 48,
                borderRadius: 3,
                backgroundColor: getPolylineColor(step.vehicle_type),
                marginRight: 12,
              }}
            />
            {/* 상세 정보 텍스트 */}
            <View style={{ flex: 1 }}>
              <TextMedium style={{ fontFamily: "Pretendard_Bold", fontSize: 16, color: "#222" }}>
                {step.mode === "WALKING"
                  ? step.instruction || "도보 이동"
                  : step.line_name}
              </TextMedium>
              <TextSmall style={{ color: "#666", marginTop: 2 }}>
                {step.departure_stop && step.arrival_stop
                  ? `${step.departure_stop} → ${step.arrival_stop}`
                  : ""}
              </TextSmall>
              <TextSmall style={{ color: "#888", marginTop: 2 }}>
                {step.mode === "WALKING"
                  ? step.duration_text
                  : [
                      step.departure_time ? `${step.departure_time} 출발` : "",
                      step.arrival_time ? `${step.arrival_time} 도착` : "",
                      step.num_stops ? `${step.num_stops}개 정차` : "",
                      step.duration_text,
                    ]
                      .filter(Boolean)
                      .join(" • ")
                }
              </TextSmall>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 네이버 스타일 한줄 타임라인 (구간별 소요시간에 따라 길이 조정, 위에 총 소요시간)
  const renderTimelineBar = () => {
    if (!route || !route.steps) return null;

    // 총 소요시간 계산 (분 단위)
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

    // route.duration(초 단위) → 분 단위
    const durationMinutes = route.duration ? Math.round(route.duration / 60) : 0;

    // 각 구간의 flex 비율 계산
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

    // 색상 및 아이콘
    const getBarColor = (step: any) => {
      if (step.mode === "WALKING") return "#CBD5E1";
      return getPolylineColor(step.vehicle_type);
    };
    // const getIcon = (step: any) => {
    //   if (step.mode === "WALKING") return <DynamicIcon name="walk" size={14} color="#2563EB" />;
    //   if (step.mode === "TRANSIT") return <DynamicIcon name="bus" size={14} color={getPolylineColor(step.vehicle_type)} />;
    //   return null;
    // }; 아이콘 쓰고싶으면 DynamicIcon 추가해서 사용

    return (
      <View style={{ marginVertical: 5, position: "relative" }}>
        {/* 총 소요시간 + route.duration(분) */}
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
        {/* 타임라인 바 */}
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
                >
                  {/* ...no icon or text... */}
                </View>
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
        {/* 도착시간: 타임라인 바 우측 하단, 회색 글씨, 상자 없이, 더 아래로 */}
        {route.arrivalTime && (
          <TextSmall
            style={{
              position: "absolute",
              right: 0,
              bottom: -18, // 기존보다 더 아래로 내림
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
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <TextMedium style={styles.backButtonText}>
              홈으로 돌아가기
            </TextMedium>
          </Pressable>
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
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <TextMedium style={styles.backButtonText}>
              홈으로 돌아가기
            </TextMedium>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={true}>
          {/* 상단 메시지 */}
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
          <View style={[styles.mapSection, { marginTop: 0 }]}>
            <MapView
              showsUserLocation={true}
              showsMyLocationButton={true}
              provider={PROVIDER_GOOGLE}
              style={styles.mapPlaceholder}
              region={{
                latitude: origin?.coordinates.latitude || 37.5665,
                longitude: origin?.coordinates.longitude || 126.9780,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              customMapStyle={mapStyle}
            >
              {origin && (
                <Marker
                  coordinate={{
                    latitude: origin.coordinates.latitude,
                    longitude: origin.coordinates.longitude,
                  }}
                  title="출발지"
                  description={origin.name}
                  pinColor="#1B72E8"
                />
              )}
              {destination && (
                <Marker
                  coordinate={{
                    latitude: destination.coordinates.latitude,
                    longitude: destination.coordinates.longitude,
                  }}
                  title="도착지"
                  description={destination.name}
                  pinColor="#EA4335"
                />
              )}
              {route?.steps && route.steps.map((step, index) => (
                <React.Fragment key={`polyline-${index}`}>
                  {step.start_location && step.end_location && (
                    <Polyline
                      coordinates={[
                        ...decodePolygon(step.polyline || ""),
                      ]}
                      strokeColor={step.mode === 'WALKING' ? '#2563EB' : getPolylineColor(step.vehicle_type)}
                      strokeWidth={5}
                      fillColor={step.mode === 'WALKING' ? '#2563EB' : getPolylineColor(step.vehicle_type)}
                    />
                  )}
                </React.Fragment>
              ))}
            </MapView>
          </View>

          {/* 상세 이동 정보 */}
          <View style={{ marginHorizontal: 24 }}>
            {/* 네이버 한줄 타임라인 */}
            {renderTimelineBar()}
            {/* 환승 정보(네이버 길찾기 스타일) */}
            {renderTransferInfo()}
          </View>

          {/* 도착 시간 안내 */}
          {/* 
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginVertical: 16,
              gap: 12,
            }}
          >
            <View
              style={{
                backgroundColor: "#F1F5FF",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 28,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#B4CDF1",
                minWidth: 220,
                shadowColor: "#3457D5",
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <TextSmall style={{ color: "#3457D5", fontFamily: "Pretendard_Bold", marginBottom: 2 }}>
                도착 시간
              </TextSmall>
              <TextXLarge style={{ color: "#3457D5", fontFamily: "Pretendard_ExtraBold" }}>
                {route ? formatTime(route.arrivalTime) : ""}
              </TextXLarge>
            </View>
          </View>
          */}
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
  title: {
    color: "#3457D5",
    textAlign: "center",
    fontFamily: "Pretendard_Bold",
  },
  subHeader: {
    height: 50,
    paddingHorizontal: 16,
    alignItems: "flex-start"
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderColor:"#E2E8F0",
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  backBtnText: {
    marginLeft: 8,
  },
  main: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 24,
    borderColor: "#3457D5",
    borderWidth: 1,
    borderRadius: 10,
  },
  departureInfo: {
    marginVertical: 24,
  },
  infoLabel: {
    color: "#666",
    marginBottom: 8,
    fontFamily: "Pretendard_Bold",
  },
  timeText: {
    fontFamily: "Pretendard_ExtraBold",
  },
  weatherInfo: {
    backgroundColor: "#FFF9E3",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weatherContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  weatherText: {
    marginLeft: 8,
    fontWeight: "semibold",
    color: "#92400D",
    fontFamily: "Pretendard_SemiBold",
  },
  weatherDetails: {
    flexDirection: "row",
    paddingLeft: 24,
  },
  weatherDetailText: {
    color: "#92400D",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  actionText: {
    marginLeft: 4,
    fontFamily: "Pretendard_SemiBold",
  },
  mapSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Pretendard_Bold",
    color: "#94A3B8",
    marginBottom: 10,
  },
  map: {
    height: 500,
    backgroundColor: "#E8EBEF",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  mapPlaceholder: {
    width: "100%",
    height: 600,
    backgroundColor: "#DEEBFF",
  },
  routeInfo: {
    backgroundColor: "#F8F8F8",
    borderColor: "#B4CDF1",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  blueDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1B72E8",
    marginRight: 12,
  },
  redDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EA4335",
    marginRight: 12,
  },
  yellowDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFC107",
    marginRight: 12,
  },
  locationTitle: {
    color: "#65696D",
    marginBottom: 3,
  },
  locationName: {
    fontFamily: "Pretendard_SemiBold",
    marginBottom: 3,
  },
  locationDesc: {
    color: "#65696D",
  },
  detailSection: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  blueDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1B72E8",
  },
  redDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EA4335",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    color: "#727579",
  },
  timelineLocation: {
    fontFamily: "Pretendard_SemiBold",
    marginLeft: 34,
    marginTop: 2,
  },
  routeChip: {
    backgroundColor: "#E7F0FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderColor: "#B4CFF9",
    borderWidth: 1,
  },
  chipText: {
    color: "#1B72E8",
    fontFamily: "Pretendard_Bold",
  },
  transportChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderColor: "#D3D7DD",
    borderWidth: 1,
  },
  transportChipText: {
    color: "#000000",
    fontFamily: "Pretendard_Bold",
  },
  transportText: {
    color: "#5F6367",
    marginLeft: 8,
  },
  transferChip: {
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderColor: "#FEE253",
    borderWidth: 1,
  },
  transferChipText: {
    color: "#A16207",
    fontFamily: "Pretendard_Bold",
  },
  walkingChip: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderColor: "#93C5FD",
    borderWidth: 1,
  },
  walkingChipText: {
    color: "#2563EB",
    fontFamily: "Pretendard_Bold",
  },
  arrivalChip: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderColor: "#FCA5A5",
    borderWidth: 1,
  },
  arrivalChipText: {
    color: "#B91C1B",
    fontFamily: "Pretendard_Bold",
  },
  totalTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  totalTime: {
    marginLeft: 8,
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
