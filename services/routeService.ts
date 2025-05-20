// API 호출을 위한 서비스 구현
import { useCalculationStore } from '@store/calculationStore';

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
const API_BASE_URL = 'http://172.21.64.13:5001/mock';

export const calculateRoute = async (params: CalculateRouteParams) => {
  const store = useCalculationStore.getState();
  // startCalculation은 이제 explore.tsx에서 호출됨 (미리 로딩 상태로 만들기 위해)

  params.origin = "서울역";

  try {
    console.log('API 호출 파라미터:', params);
    
    // Lambda 함수 호출
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

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
      // 1. 람다 응답이 이미 객체인 경우
      if (lambdaResponse.steps) {
        data = lambdaResponse as RouteResponse;
      }
      // 2. 람다 응답이 body 프로퍼티를 가진 경우
      else if (lambdaResponse.body) {
        // 2-1. body가 문자열인 경우, 파싱 시도
        if (typeof lambdaResponse.body === 'string') {
          data = JSON.parse(lambdaResponse.body);
        } 
        // 2-2. body가 이미 객체인 경우
        else {
          data = lambdaResponse.body as RouteResponse;
        }
      } else {
        throw new Error('알 수 없는 응답 형식');
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

    // 스텝 정보 포함하여 반환
    return {
      route: store.route,
      weather: store.weather,
      steps: data.steps
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
