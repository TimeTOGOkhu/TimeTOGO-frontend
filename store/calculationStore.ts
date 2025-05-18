import { create } from 'zustand';

interface Location {
  name: string;
  address: string;
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
}

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  arrivalTime: string;
  departureTime: string;
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
  setCalculationError: (error) => set({ error, isLoading: false }),
  resetCalculation: () => set({ 
    isLoading: false,
    route: null,
    weather: null,
    error: null 
  }),
}));
