// @store/historyStore.ts
import { create } from 'zustand';

export interface HistoryItem {
  origin: string;
  destination: string;
  travelTime: number;  // 경과 시간(초)
}

interface HistoryState {
  historys: HistoryItem[];
  addHistory: (item: HistoryItem) => void;
  removeHistory: (index: number) => void;
  clearHistorys: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  historys: [],

  addHistory: (item) => {
    const { historys } = get();
    // 1) 중복(origin+destination) 제거
    const filtered = historys.filter(
      (f) => !(f.origin === item.origin && f.destination === item.destination)
    );
    // 2) 새로 추가
    let newList = [item, ...filtered];
    // 3) 최대 10개로 제한
    if (newList.length > 10) newList = newList.slice(0, 10);
    set({ historys: newList });
  },

  removeHistory: (index) => {
    const { historys } = get();
    set({ historys: historys.filter((_, i) => i !== index) });
  },

  clearHistorys: () => set({ historys: [] }),
}));
