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

// 노약자와 외국인에게 더 보기 편한 지도 스타일 정의
const mapStyle = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#000000" },
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#ffffff" },
      { "weight": 3 }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffffff" },
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels",
    "stylers": [
      { "visibility": "simplified" }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      { "color": "#d81b60" }  // 지하철/기차역 강조
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#a0c8f0" }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      { "color": "#e0f3db" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      { "color": "#f9b233" }  // 고속도로는 밝은 노란색으로
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffd700" }
    ]
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

  // 날짜 포맷팅 함수
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 상세 타임라인 렌더링 함수
  const renderDetailedTimeline = () => {
    if (!route || !route.steps) return null;
    
    return (
      <>
        {/* 출발 */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineContent}>
            <View style={{flexDirection: "row", alignItems: "center"}}>
              <View style={styles.timelineDot}>
                <View style={styles.blueDotSmall} />
              </View>
              <TextMedium style={[styles.timelineTime, {marginRight: 4}]}>
                {formatTime(route.departureTime)}
              </TextMedium>
              <View style={styles.routeChip}>
                <TextSmall style={[styles.chipText]}>출발</TextSmall>
              </View>
            </View>
            <TextMedium style={[styles.timelineLocation]}>
              {origin?.name || "현재 위치"}
            </TextMedium>
          </View>
        </View>
        
        {/* 모든 경로 단계 표시 */}
        {route.steps.map((step, index) => {
          // 마지막 단계는 도착 정보만 표시
          if (index === (route.steps?.length ?? 0) - 1) return null;
          
          return (
            <React.Fragment key={`step-${index}`}>
              {/* 도보인 경우 */}
              {step.mode === 'WALKING' && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineContent}>
                    <View style={{flexDirection: "row", alignItems: "center", marginLeft: 24}}>
                      <TransportIcon type="WALKING" size={16} color="#2563EB" style={{marginRight: 10}} />
                      <View style={styles.walkingChip}>
                        <TextSmall style={[styles.walkingChipText]}>도보</TextSmall>
                      </View>
                      <TextSmall style={[styles.transportText]}>
                        {step.distance_text} • {step.duration_text}
                      </TextSmall>
                    </View>
                    {step.instruction && (
                      <TextSmall style={[styles.timelineLocation, {color: '#64748B'}]}>
                        {step.instruction}
                      </TextSmall>
                    )}
                  </View>
                </View>
              )}
              
              {/* 대중교통인 경우 */}
              {step.mode === 'TRANSIT' && (
                <>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineContent}>
                      <View style={{flexDirection: "row", alignItems: "center", marginLeft: 24}}>
                        <TransportIcon 
                          type={step.vehicle_type || 'DEFAULT'} 
                          size={16} 
                          color={getPolylineColor(step.vehicle_type)} 
                          style={{marginRight: 10}} 
                        />
                        <View style={styles.transportChip}>
                          <TextSmall style={[styles.transportChipText]}>
                            {step.line_name || ''}
                          </TextSmall>
                        </View>
                        <TextSmall style={[styles.transportText]}>
                          {step.departure_time} 탑승
                        </TextSmall>
                      </View>
                      <TextMedium style={[styles.timelineLocation]}>
                        {step.departure_stop} 정류장
                      </TextMedium>
                    </View>
                  </View>
                  
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineContent}>
                      <View style={{flexDirection: "row", alignItems: "center", marginLeft: 24}}>
                        <DynamicIcon name="clock" size={16} color="#1D72E8" style={{marginRight: 10}} />
                        <TextSmall style={styles.transportText}>
                          {step.duration_text} 소요 • {step.num_stops}개 정류장
                        </TextSmall>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineContent}>
                      <View style={{flexDirection: "row", alignItems: "center"}}>
                        <View style={[styles.timelineDot, {backgroundColor: "#ffffff"}]}>
                          {index < ((route.steps?.length ?? 0) - 2) ? (
                            <DynamicIcon name="repeat" size={16} color="#A16207" />
                          ) : (
                            <DynamicIcon name="log-out" size={16} color="#1D72E8" />
                          )}
                        </View>
                        <TextMedium style={[styles.timelineTime, {marginRight: 4}]}>
                          {step.arrival_time}
                        </TextMedium>
                        <View style={styles.transferChip}>
                          <TextSmall style={[styles.transferChipText]}>
                            {index < ((route.steps?.length ?? 0) - 2) ? "환승" : "하차"}
                          </TextSmall>
                        </View>
                      </View>
                      <TextMedium style={[styles.timelineLocation]}>
                        {step.arrival_stop}
                      </TextMedium>
                    </View>
                  </View>
                </>
              )}
            </React.Fragment>
          );
        })}
        
        {/* 도착 */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineContent}>
            <View style={{flexDirection: "row", alignItems: "center"}}>
              <View style={styles.timelineDot}>
                <View style={styles.redDotSmall} />
              </View>
              <TextMedium style={[styles.timelineTime, {marginRight: 4}]}>
                {formatTime(route.arrivalTime)}
              </TextMedium>
              <View style={styles.arrivalChip}>
                <TextSmall style={[styles.arrivalChipText]}>도착</TextSmall>
              </View>
            </View>
            <TextMedium style={[styles.timelineLocation]}>
              {destination?.name || "목적지"}
            </TextMedium>
          </View>
        </View>
      </>
    );
  };

  // 날씨 정보
  const weatherInfo = getWeatherInfo();

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
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.header}>
            <TextXXXLarge style={[styles.title]}>TimeTOGO</TextXXXLarge>
          </View>
          <View style={styles.subHeader}>
            <PressableOpacity onPress={handleBackPress} style={styles.backBtn}>
              <DynamicIcon name="arrow-left" size={16} color="black" />
              <TextMedium style={[styles.backBtnText]}>홈으로 가기</TextMedium>
            </PressableOpacity>
          </View>

          <View style={styles.main}>
            <View style={styles.departureInfo}>
              <TextXLarge style={styles.infoLabel}>계산된 출발 시간</TextXLarge>
              <TextXXXLarge style={styles.timeText}>
                {route ? formatTime(route.departureTime) : "계산 중..."}
              </TextXXXLarge>
            </View>

            <View style={styles.weatherInfo}>
              <View style={styles.weatherContent}>
                <DynamicIcon
                  name={weatherInfo.icon as any}
                  size={16}
                  color={weatherInfo.iconColor}
                />
                <TextMedium style={[styles.weatherText]}>
                  {weatherInfo.message}
                </TextMedium>
              </View>
              <View style={styles.weatherDetails}>
                {weather && (
                  <>
                    <TextNormal style={[styles.weatherDetailText]}>
                      <DynamicIcon name="thermometer" size={14} color="#92400D" />{" "}
                      {weather.temperature}°C
                    </TextNormal>
                    <TextNormal style={[styles.weatherDetailText]}>
                      <DynamicIcon name="wind" size={14} color="#92400D" />{" "}
                      {weather.windSpeed} m/s
                    </TextNormal>
                    <TextNormal style={[styles.weatherDetailText]}>
                      <DynamicIcon name="droplet" size={14} color="#92400D" />{" "}
                      {weather.humidity}%
                    </TextNormal>
                  </>
                )}
              </View>
            </View>

            <View style={styles.actionButtons}>
              <PressableOpacity style={styles.actionButton}>
                <DynamicIcon name="compass" size={20} color="black" />
                <TextNormal style={[styles.actionText]} numberOfLines={1}>위치 추적</TextNormal>
              </PressableOpacity>
              <PressableOpacity style={styles.actionButton}>
                <DynamicIcon name="bell" size={20} color="black" />
                <TextNormal style={[styles.actionText]} numberOfLines={1}>알람 설정</TextNormal>
              </PressableOpacity>
              <PressableOpacity style={styles.actionButton}>
                <DynamicIcon name="upload" size={20} color="black" />
                <TextNormal style={[styles.actionText]} numberOfLines={1}>위치 공유</TextNormal>
              </PressableOpacity>
            </View>

            <View style={styles.mapSection}>
              <TextXLarge style={styles.sectionTitle}>경로 지도</TextXLarge>
              <View style={styles.map}>
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
                  customMapStyle={mapStyle} // 사용자 정의 지도 스타일 적용
                >
                  {/* 출발지 마커 */}
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
                  
                  {/* 도착지 마커 */}
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
                  
                  {/* 경로 폴리라인 */}
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

              <View style={styles.routeInfo}>
                <View style={styles.locationItem}>
                  <View style={styles.blueDot} />
                  <View>
                    <TextMedium style={[styles.locationTitle]}>
                      출발지
                    </TextMedium>
                    <TextMedium style={[styles.locationName]}>
                      {origin?.name || "현재 위치"}
                    </TextMedium>
                    <TextSmall style={[styles.locationDesc]}>
                      {route?.steps && route.steps.length > 0 ? route.steps[0].instruction : ""}
                    </TextSmall>
                  </View>
                </View>
                
                {route?.steps && route.steps.filter(step => step.mode === 'TRANSIT').map((transitStep, index) => (
                  <View key={`transit-${index}`} style={styles.locationItem}>
                    <View style={styles.yellowDot} />
                    <View>
                      <TextMedium style={[styles.locationTitle]}>
                        {getTransportTypeText(transitStep.vehicle_type)} {transitStep.line_name}
                      </TextMedium>
                      <TextMedium style={[styles.locationName]}>
                        {transitStep.departure_stop} → {transitStep.arrival_stop}
                      </TextMedium>
                      <TextSmall style={[styles.locationDesc]}>
                        {transitStep.departure_time} 출발 • {transitStep.duration_text} 소요 • {transitStep.arrival_time} 도착
                      </TextSmall>
                    </View>
                  </View>
                ))}

                <View style={[styles.locationItem, { marginBottom: 0 }]}>
                  <View style={styles.redDot} />
                  <View>
                    <TextMedium style={[styles.locationTitle]}>
                      도착지
                    </TextMedium>
                    <TextMedium style={[styles.locationName]}>
                      {destination?.name || "목적지"}
                    </TextMedium>
                    <TextSmall style={[styles.locationDesc]}>
                      {route?.steps && route.steps.length > 0 ? 
                        route.steps[route.steps.length - 1].instruction : 
                        ""}
                    </TextSmall>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <TextXLarge style={styles.sectionTitle}>상세 이동 정보</TextXLarge>
              {renderDetailedTimeline()}
            </View>
          </View>
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
    paddingVertical: 20,
    justifyContent: "center",
    borderBottomColor: "#C6C8C9",
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
    height: "100%",
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