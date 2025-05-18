// API 호출을 위한 서비스 구현
import { useCalculationStore } from '@store/calculationStore';

interface CalculateRouteParams {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  arrivalTime?: string; // ISO 형식의 도착 시간
}

// TODO: 실제 서비스 연동 시 아래 API 엔드포인트와 키를 실제 값으로 변경해야 합니다
const API_BASE_URL = 'https://api.timetogo.example.com'; 
const API_KEY = 'YOUR_API_KEY';

export const calculateRoute = async (params: CalculateRouteParams) => {
  const store = useCalculationStore.getState();
  store.startCalculation();

  try {
    // 실제 API 호출
    const response = await fetch(`${API_BASE_URL}/calculate-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Route calculation failed');
    }

    const data = await response.json();
    
    // 경로 정보 업데이트
    store.setRoute({
      distance: data.route.distance,
      duration: data.route.duration,
      arrivalTime: data.route.arrivalTime,
      departureTime: data.route.departureTime
    });

    // 날씨 정보 업데이트
    if (data.weather) {
      store.setWeather({
        condition: data.weather.condition,
        temperature: data.weather.temperature,
        humidity: data.weather.humidity,
        windSpeed: data.weather.windSpeed
      });
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      store.setCalculationError(error.message);
    } else {
      store.setCalculationError('An unknown error occurred');
    }
    throw error;
  }
};

// 위치 검색을 위한 함수
export const searchLocation = async (query: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search-location?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Location search failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
};
