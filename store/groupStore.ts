// store/groupStore.ts (전체 코드)
import { create } from 'zustand';
import { LocationData } from '@/services/pathService';

interface GroupState {
  pathId: string | null;
  isCreator: boolean;
  isLocationSharingActive: boolean;
  memberLocations: LocationData[];
  lastLocationUpdate: number;
  
  // Actions
  setPathId: (pathId: string, isCreator: boolean) => void;
  setLocationSharingActive: (active: boolean) => void;
  updateMemberLocations: (locations: LocationData[]) => void;
  clearGroup: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  pathId: null,
  isCreator: false,
  isLocationSharingActive: false,
  memberLocations: [],
  lastLocationUpdate: 0,
  
  setPathId: (pathId, isCreator) => set({ pathId, isCreator }),
  setLocationSharingActive: (active) => set({ isLocationSharingActive: active }),
  updateMemberLocations: (locations) => set({ 
    memberLocations: locations,
    lastLocationUpdate: Date.now()
  }),
  clearGroup: () => set({ 
    pathId: null, 
    isCreator: false, 
    isLocationSharingActive: false, 
    memberLocations: [],
    lastLocationUpdate: 0
  }),
}));
