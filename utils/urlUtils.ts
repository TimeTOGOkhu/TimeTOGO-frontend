// utils/urlUtils.ts 수정
import { createPath } from '@/services/pathService';

export interface RouteParams {
  origin: string;
  destination: string;
  arrivalTime: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  pathId?: string; // 추가
}

// 경로 정보를 공유 가능한 URL로 변환 (백엔드 API 사용)
export const createShareableRoute = async (
  origin: { name: string; coordinates: { latitude: number; longitude: number } },
  destination: { name: string; coordinates: { latitude: number; longitude: number } },
  arrivalTime: Date
): Promise<{ shareUrl: string; monitorUrl: string; pathId: string }> => {
  try {
    const pathData = {
      origin: origin.name,
      destination: destination.name,
      arrivalTime: arrivalTime.toISOString(),
      originLat: origin.coordinates.latitude,
      originLng: origin.coordinates.longitude,
      destLat: destination.coordinates.latitude,
      destLng: destination.coordinates.longitude,
    };
    
    const response = await createPath(pathData);
    
    return {
      shareUrl: response.share_url,
      monitorUrl: response.monitor_url,
      pathId: response.path_id,
    };
  } catch (error) {
    console.error('공유 링크 생성 오류:', error);
    throw error;
  }
};

// path/{path_id} URL에서 path_id 추출
export const extractPathId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const path = window.location.pathname;
  const pathMatch = path.match(/\/path\/([^\/]+)/);
  
  return pathMatch ? pathMatch[1] : null;
};

// monitor/{path_id} URL에서 path_id 추출
export const extractMonitorPathId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const path = window.location.pathname;
  const pathMatch = path.match(/\/monitor\/([^\/]+)/);
  
  return pathMatch ? pathMatch[1] : null;
};

// 기존 함수들도 유지 (레거시 지원용)
export const encodeRouteToUrl = (
  origin: { name: string; coordinates: { latitude: number; longitude: number } },
  destination: { name: string; coordinates: { latitude: number; longitude: number } },
  arrivalTime: Date
): string => {
  const params = new URLSearchParams({
    origin: origin.name,
    destination: destination.name,
    arrivalTime: arrivalTime.toISOString(),
    originLat: origin.coordinates.latitude.toString(),
    originLng: origin.coordinates.longitude.toString(),
    destLat: destination.coordinates.latitude.toString(),
    destLng: destination.coordinates.longitude.toString(),
  });

  return `${window.location.origin}/share?${params.toString()}`;
};

export const decodeRouteFromUrl = (): RouteParams | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  
  const origin = urlParams.get('origin');
  const destination = urlParams.get('destination');
  const arrivalTime = urlParams.get('arrivalTime');
  
  if (!origin || !destination || !arrivalTime) {
    return null;
  }

  return {
    origin,
    destination,
    arrivalTime,
    originLat: urlParams.get('originLat') ? parseFloat(urlParams.get('originLat')!) : undefined,
    originLng: urlParams.get('originLng') ? parseFloat(urlParams.get('originLng')!) : undefined,
    destLat: urlParams.get('destLat') ? parseFloat(urlParams.get('destLat')!) : undefined,
    destLng: urlParams.get('destLng') ? parseFloat(urlParams.get('destLng')!) : undefined,
  };
};

export const cleanUrl = () => {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname);
  }
};
