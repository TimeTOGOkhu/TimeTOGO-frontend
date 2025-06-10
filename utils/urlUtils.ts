// utils/urlUtils.ts
export interface RouteParams {
  origin: string;
  destination: string;
  arrivalTime: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
}

// 경로 정보를 URL 파라미터로 인코딩
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

  return `${window.location.origin}/share?${params.toString()}`; // /share 경로 사용
};

// URL 파라미터에서 경로 정보 디코딩
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

// URL을 깔끔하게 정리 (파라미터 제거)
export const cleanUrl = () => {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname);
  }
};