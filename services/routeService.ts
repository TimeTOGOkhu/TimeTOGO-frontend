// API 호출을 위한 서비스 구현
import { useCalculationStore } from '@store/calculationStore';
import { useHistoryStore } from '@store/historyStore';
import { LatLng } from 'react-native-maps';
import { Location as StoreLocation } from '@store/calculationStore';

// 람다 함수 응답 타입 정의
interface WeatherCondition {
  type: string; // Clouds, Clear, Rain 등
  icon: string; // 아이콘 코드 (03d 등)
  precipitation_chance: number; // 강수 확률 (0-100)
  temperature_celsius: number; // 온도 (섭씨)
  forecast_time: number; // 예보 시간 (유닉스 타임스탬프)
}

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
  weather_condition: WeatherCondition;
  // WALKING 모드에만 존재하는 필드
  instruction?: string;
  duration_text?: string;
  distance_text?: string;
  // TRANSIT 모드에만 존재하는 필드
  vehicle_type?: string;
  line_name?: string;
  departure_stop?: string;
  departure_time?: string;
  arrival_stop?: string;
  arrival_time?: string;
  num_stops?: number;
  polyline?: string;
}

interface RouteResponse {
  summary: string;
  duration_text: string;
  duration_sec: number;
  steps: RouteStep[];
}

interface CalculateRouteParams {
  origin: string; // "서울역"과 같은 출발지명
  destination: string; // "동탄예당마을"과 같은 도착지명
  arrival_time: string; // 유닉스 타임스탬프 문자열
}

// Lambda 함수 API 엔드포인트
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.40:5001';

const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};

export const calculateRoute = async (params: CalculateRouteParams, origin: StoreLocation, destination: StoreLocation) => {
  const store = useCalculationStore.getState();

  try {
    console.log('API 호출 파라미터:', params);
    
    // Lambda 함수 호출
    const response = await fetchWithTimeout(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    }, 5000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 에러:', response.status, errorText);
      throw new Error(`경로 계산에 실패했습니다 (${response.status}): ${errorText}`);
    }

    const lambdaResponse = await response.json();
    
    // 람다 응답 디버깅을 위해 로그 출력
    console.log('Lambda 응답:', JSON.stringify(lambdaResponse));
    
    // 람다 응답 형식에 따라 처리
    let data: RouteResponse;
    
    try {
      if (typeof lambdaResponse === 'string') {
        // 문자열로 온 경우 (예: "\"{ \\\"steps\\\": [...] }\"" 같은)
        data = JSON.parse(lambdaResponse) as RouteResponse;
      } else {
        // 이미 객체 형태로 온 경우
        data = lambdaResponse as RouteResponse;
      }
      if (!data || !data.steps || data.steps.length === 0) {
        throw new Error('유효한 경로 데이터가 없습니다');
      }
    } catch (parseError) {
      console.error('응답 파싱 오류:', parseError, lambdaResponse);
      throw new Error('응답 데이터 파싱에 실패했습니다');
    }

    // 첫 번째 스텝의 출발 시간 계산 (도착 시간에서 총 소요 시간을 빼서 계산)
    const arrivalUnixTime = parseInt(params.arrival_time);
    const departureUnixTime = arrivalUnixTime - data.duration_sec;
    
    // 마지막 스텝의 날씨 정보 가져오기 (도착지점의 날씨)
    const lastStep = data.steps[data.steps.length - 1];
    const weatherCondition = lastStep.weather_condition;
    
    // 경로 정보 업데이트
    store.setRoute({
      distance: 0, // 총 거리는 계산 필요
      duration: data.duration_sec, // 초 단위
      arrivalTime: new Date(arrivalUnixTime * 1000).toISOString(),
      departureTime: new Date(departureUnixTime * 1000).toISOString(),
      steps: data.steps // 모든 스텝 정보 저장
    });

    // 날씨 정보 업데이트
    store.setWeather({
      condition: mapWeatherCondition(weatherCondition.type),
      temperature: weatherCondition.temperature_celsius,
      humidity: 0, // API에서 제공하지 않음
      windSpeed: 0, // API에서 제공하지 않음
      icon: weatherCondition.icon,
      precipitationChance: weatherCondition.precipitation_chance
    });
    
    // 응답을 성공적으로 파싱했으므로 로딩 상태 종료
    store.setLoadingFinished();

    // 1) 직접 만든 route/​weather 객체
    const routeInfo = {
      distance: 0,
      duration: data.duration_sec,
      arrivalTime: new Date(arrivalUnixTime * 1000).toISOString(),
      departureTime: new Date(departureUnixTime * 1000).toISOString(),
      steps: data.steps,
    };
    const weatherInfo = {
      condition: mapWeatherCondition(weatherCondition.type),
      temperature: weatherCondition.temperature_celsius,
      humidity: 0,
      windSpeed: 0,
      icon: weatherCondition.icon,
      precipitationChance: weatherCondition.precipitation_chance,
    };

    // 2) 스토어에도 저장
    store.setRoute(routeInfo);
    store.setWeather(weatherInfo);
    store.setLoadingFinished();

    useHistoryStore.getState().addHistory({
      origin: origin,
      destination: destination,
      travelTime: routeInfo.duration,
    });

    // 3) 직접 만든 객체를 반환하면 null 체크를 걱정할 필요가 없습니다
    return {
      route: routeInfo,
      weather: weatherInfo,
      steps: data.steps,
    };
    
  } catch (error) {
    if (error instanceof Error) {
      store.setCalculationError(error.message);
    } else {
      store.setCalculationError('경로 계산 중 오류가 발생했습니다');
    }
    throw error;
  }
};

// 날씨 타입 매핑 함수
function mapWeatherCondition(weatherType: string): string {
  // OpenWeather API 날씨 타입을 앱 내에서 사용하는 타입으로 변환
  switch (weatherType.toLowerCase()) {
    case 'clear':
      return 'sunny';
    case 'clouds':
      return 'cloudy';
    case 'rain':
    case 'drizzle':
      return 'rainy';
    case 'snow':
      return 'snowy';
    default:
      return 'unknown';
  }
}

// 위치 검색을 위한 함수
export const searchLocation = async (query: string) => {
  try {
    // Google Places API나 다른 위치 검색 API를 사용할 수 있음
    // 현재는 Lambda 함수에서는 제공하지 않음
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=YOUR_GOOGLE_API_KEY`);

    if (!response.ok) {
      throw new Error('위치 검색에 실패했습니다');
    }

    return await response.json();
  } catch (error) {
    console.error('위치 검색 오류:', error);
    throw error;
  }
};

/**
 * Google 폴리라인 문자열을 디코딩하여 [latitude, longitude] 객체 배열로 반환합니다.
 * @param encoded 문자열 (예: "}_p~F~ps|U_ulLnnqC_mqNvxq`@")
 * @param precision 좌표 소수점 자리수 (기본값: 5)
 */
export const decodePolygon = (
  encoded: string,
  precision: number = 5
): LatLng[] => {
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    // 위도 디코딩
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // 경도 디코딩
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    // 최종 좌표 추가
    coordinates.push({
      latitude: lat / factor,
      longitude: lng / factor,
    });
  }

  return coordinates;
};

/**
 * TMap API를 사용하여 도보 경로 데이터를 가져옵니다.
 * Google Maps API의 `WALKING` 모드 경로를 대체하는 데 사용됩니다.
 * 
 * 한국에서 Google Maps API의 도보 경로는 상세하지 않아서, 
 * TMap API를 사용하여 더 정확한 도보 경로를 제공합니다.
 * 
 * 사용 방법:
 * 1. Google Maps API로 전체 경로를 계산합니다.
 * 2. 도보(WALKING) 구간을 찾아서 이 함수를 호출합니다.
 * 3. 반환된 TMap 경로 데이터로 지도에 새로운 폴리라인을 그립니다.
 */
export const fetchWalkingRoute = async (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/route/walk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin, destination
      })
    }, 5000);

    if (!response.ok) {
      console.error('TMap 도보 경로 API 오류:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('TMap 도보 경로 요청 실패:', error);
    return null;
  }
};

/**
 * TMap API 응답에서 좌표 배열을 추출합니다.
 * @param tmapRouteData TMap API 응답 데이터
 * @returns LatLng[] 형식의 좌표 배열
 * 
 * TMap API는 GeoJSON 형태로 데이터를 반환하며, 이 중 LineString 타입의 features에서
 * 좌표를 추출하여 react-native-maps의 Polyline 컴포넌트에서 사용할 수 있는 형태로 변환합니다.
 */
export const extractTMapCoordinates = (tmapRouteData: any): LatLng[] => {
  if (!tmapRouteData || !tmapRouteData.features) {
    return [];
  }

  return tmapRouteData.features
    .filter((feature: any) => feature.geometry.type === 'LineString')
    .flatMap((feature: any) => 
      (feature.geometry.coordinates as [number, number][]).map(
        ([lng, lat]) => ({ latitude: lat, longitude: lng })
      )
    );
};