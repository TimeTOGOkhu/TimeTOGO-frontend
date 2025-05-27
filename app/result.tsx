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
import PressableOpacity from "@/components/PressableOpacity";
import Feather from '@expo/vector-icons/Feather';

// 경로 단계 타입 정의
interface RouteStep {
  mode: 'WALKING' | 'TRANSIT';
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  weather_condition?: any;
  instruction?: string;
  duration_text?: string;
  distance_text?: string;
  vehicle_type?: string;
  line_name?: string;
  departure_stop?: string;
  departure_time?: string;
  arrival_stop?: string;
  arrival_time?: string;
  num_stops?: number;
}

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
                {/* 이 부분은 실제 지도 컴포넌트로 대체해야 합니다 */}
                <View style={styles.mapPlaceholder}>
                  {/* 이미지나 지도 컴포넌트 */}
                </View>
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
                      {/* {origin?.address || ""} */} {/* reverseGeocodeAsync 필요 */}
                    </TextSmall>
                  </View>
                </View>

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
                      {/* {destination?.address || ""} */} {/* reverseGeocodeAsync 필요 */}
                    </TextSmall>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <TextXLarge style={styles.sectionTitle}>상세 이동 정보</TextXLarge>
              <View style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <View style={{flexDirection: "row", alignItems: "center"}}>
                    <View style={styles.timelineDot}>
                      <View style={styles.blueDotSmall} />
                    </View>
                    <TextMedium style={[styles.timelineTime, {marginRight: 4}]}>
                      {route ? formatTime(route.departureTime) : "--:--"}
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

              <View style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <View style={{flexDirection: "row", alignItems: "center"}}>
                    <DynamicIcon name="truck" size={16} color="#1D72E8" style={{marginHorizontal:14}} />
                    <View style={styles.transportChip}>
                      <TextSmall style={[styles.transportChipText]}>
                        {route?.steps ? route.steps.find((s: RouteStep) => s.mode === "TRANSIT")?.line_name : "버스/열차"} 
                      </TextSmall>
                    </View>
                    <TextSmall style={[styles.transportText]}>탑승</TextSmall>
                  </View>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <View style={{flexDirection: "row", alignItems: "center"}}>
                    <View style={[styles.timelineDot, {backgroundColor: "#ffffff"}]}>
                      <DynamicIcon name="arrow-right" size={16} color="#1D72E8" />
                    </View>
                    <TextMedium style={[styles.timelineTime, {marginRight: 4}]}>
                      {route
                        ? formatTime(
                            new Date(
                              new Date(route.departureTime).getTime() +
                                (route.duration / 2) * 1000
                            ).toISOString()
                          )
                        : "--:--"}
                    </TextMedium>
                    <View style={styles.transferChip}>
                      <TextSmall style={[styles.transferChipText]}>
                        환승 지점
                      </TextSmall>
                    </View>
                  </View>
                  <TextMedium style={[styles.timelineLocation]}>
                    {route?.steps ? route.steps.find((s: RouteStep) => s.mode === "TRANSIT")?.arrival_stop : "환승 센터"}
                  </TextMedium>
                </View>
              </View>

              <View style={styles.timelineItem}>
                
                <View style={styles.timelineContent}>
                  <View style={{flexDirection: "row", alignItems: "center"}}>
                    <View style={styles.timelineDot}>
                      <View style={styles.redDotSmall} />
                    </View>
                    <TextMedium style={[styles.timelineTime, {marginRight: 4}]}>
                      {route ? formatTime(route.arrivalTime) : "--:--"}
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

              <View style={styles.totalTimeContainer}>
                <DynamicIcon name="map" size={12} color="#1D72E8" />
                <TextMedium style={[styles.totalTime]}>
                  총 이동 시간:{" "}
                  {route
                    ? `약 ${Math.round(route.duration / 60)}분`
                    : "계산 중..."}
                </TextMedium>
              </View>
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
    height: 200,
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