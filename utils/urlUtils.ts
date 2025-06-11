// utils/urlUtils.ts 수정
import { createPath } from '@/services/pathService';
import { getDeviceUUID } from './deviceId';

// CalculationState를 문자열로 변환
export const serializeCalculationState = (calculationState: any): string => {
  try {
    return JSON.stringify(calculationState);
  } catch (error) {
    console.error('CalculationState 직렬화 오류:', error);
    throw error;
  }
};

// 문자열을 CalculationState로 변환
export const deserializeCalculationState = (pathString: string): any => {
  try {
    return JSON.parse(pathString);
  } catch (error) {
    console.error('CalculationState 역직렬화 오류:', error);
    throw error;
  }
};

// 경로 정보를 공유 가능한 URL로 변환 (백엔드 API 사용)
export const createShareableRoute = async (calculationState: any): Promise<{ shareUrl: string; monitorUrl: string; pathId: string }> => {
  try {
    const pathData = {
      creator_id: await getDeviceUUID() || 'unknown',
      path: serializeCalculationState(calculationState),
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

export const cleanUrl = () => {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname);
  }
};
