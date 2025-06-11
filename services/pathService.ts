// services/pathService.ts (전체 코드)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.40:5001';

export interface CreatePathRequest {
  creator_id: string;
  path: string;
}

export interface CreatePathResponse {
  path_id: string;
  share_url: string;
  monitor_url: string;
}

export interface LocationUpdate {
  user_id: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export interface LocationData {
  path_id: string;
  user_id: string;
  timestamp: number;
  lat: number;
  lon: number;
}

export interface PathData {
  path_id: string;
  creator_id: string;
  path: string;
  created_at: string;
}

// 경로 생성 (공유 링크 생성)
export const createPath = async (data: CreatePathRequest): Promise<CreatePathResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/paths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('경로 생성 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('경로 생성 오류:', error);
    throw error;
  }
};

// 위치 업데이트 (링크를 받은 사람이 사용)
export const updateLocation = async (pathId: string, location: LocationUpdate): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/paths/${pathId}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    });
    
    if (!response.ok) {
      throw new Error('위치 업데이트 실패');
    }
  } catch (error) {
    console.error('위치 업데이트 오류:', error);
    throw error;
  }
};

// 그룹 멤버 위치 조회 (링크를 만든 사람이 사용)
export const getPathLocations = async (pathId: string): Promise<LocationData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/paths/${pathId}/locations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('위치 조회 실패');
    }
    
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('위치 조회 오류:', error);
    throw error;
  }
};

// 경로 정보 조회 (path_id로 경로 데이터 가져오기)
export const getPathData = async (pathId: string): Promise<PathData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/paths/${pathId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('경로 데이터 조회 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('경로 데이터 조회 오류:', error);
    throw error;
  }
};
