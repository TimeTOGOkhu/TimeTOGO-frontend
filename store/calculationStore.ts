import { create } from 'zustand';

export interface Location {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface Weather {
  condition: string; // sunny, cloudy, rainy, etc.
  temperature: number;
  humidity: number;
  windSpeed: number;
  icon?: string; // OpenWeather 아이콘 코드 (03d, 01n 등)
  precipitationChance?: number; // 강수 확률 (0-100)
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

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  arrivalTime: string;
  departureTime: string;
  steps?: RouteStep[]; // 경로 세부 단계
}

interface CalculationState {
  isLoading: boolean;
  origin: Location | null;
  destination: Location | null;
  weather: Weather | null;
  route: RouteInfo | null;
  error: string | null;
  // Actions
  setOrigin: (origin: Location) => void;
  setDestination: (destination: Location) => void;
  setWeather: (weather: Weather) => void;
  setRoute: (route: RouteInfo) => void;
  startCalculation: () => void;
  setLoadingFinished: () => void;
  setCalculationError: (error: string) => void;
  resetCalculation: () => void;
}

export const useCalculationStore = create<CalculationState>((set) => ({
  isLoading: false,
  origin: null,
  destination: null,
  weather: null,
  route: null,
  error: null,
  
  // Actions
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setWeather: (weather) => set({ weather }),
  setRoute: (route) => set({ route }),
  startCalculation: () => set({ isLoading: true, error: null }),
  setLoadingFinished: () => set({ isLoading: false }),
  setCalculationError: (error) => set({ error, isLoading: false }),
  resetCalculation: () => set({ 
    isLoading: false,
    route: null,
    weather: null,
    error: null 
  }),
}));
