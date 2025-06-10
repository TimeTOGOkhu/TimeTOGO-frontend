// services/locationService.ts 수정
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { updateLocation } from '@/services/pathService';

export interface LocationServiceConfig {
  pathId: string;
  enabled: boolean;
  interval: number;
}

class LocationService {
  private config: LocationServiceConfig | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null; // 수정: 타입 명시

  async startLocationSharing(config: LocationServiceConfig): Promise<boolean> {
    this.config = config;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('위치 권한이 거부되었습니다.');
        return false;
      }

      if (Platform.OS !== 'web') {
        await Location.requestBackgroundPermissionsAsync();
      }

      this.startPeriodicLocationUpdate();

      console.log(`위치 공유 시작: ${config.interval / 1000}초 간격`);
      return true;
    } catch (error) {
      console.error('위치 공유 시작 오류:', error);
      return false;
    }
  }

  stopLocationSharing(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.config = null;
    this.lastSentLocation = null;
    console.log('위치 공유 중지');
  }

  private lastSentLocation: { lat: number; lon: number } | null = null;

  private startPeriodicLocationUpdate(): void {
    if (!this.config) return;

    const sendLocation = async () => {
      if (!this.config?.enabled || !this.config?.pathId) return;

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newLocation = {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        };

        if (this.shouldSendLocation(newLocation)) {
          await updateLocation(this.config.pathId, {
            ...newLocation,
            timestamp: Date.now(),
          });

          this.lastSentLocation = newLocation;
          console.log('위치 업데이트 전송:', newLocation);
        }
      } catch (error) {
        console.error('위치 업데이트 오류:', error);
      }
    };

    sendLocation();
    this.intervalId = setInterval(sendLocation, this.config.interval);
  }

  private shouldSendLocation(newLocation: { lat: number; lon: number }): boolean {
    if (!this.lastSentLocation) return true;

    const distance = this.calculateDistance(
      this.lastSentLocation.lat,
      this.lastSentLocation.lon,
      newLocation.lat,
      newLocation.lon
    );

    return distance > 10;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  isActive(): boolean {
    return this.config?.enabled === true && this.intervalId !== null;
  }

  updateConfig(newConfig: Partial<LocationServiceConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
      
      if (!newConfig.enabled) {
        this.stopLocationSharing();
      }
    }
  }
}

export const locationService = new LocationService();

