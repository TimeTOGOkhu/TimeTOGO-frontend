// @store/favoriteStore.ts
import { create } from 'zustand';

export interface FavoriteItem {
  origin: string;
  destination: string;
  travelTime: number;  // 경과 시간(초)
}

interface FavoriteState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (index: number) => void;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],

  addFavorite: (item) => {
    const { favorites } = get();
    // 1) 중복(origin+destination) 제거
    const filtered = favorites.filter(
      (f) => !(f.origin === item.origin && f.destination === item.destination)
    );
    // 2) 새로 추가
    let newList = [item, ...filtered];
    // 3) 최대 10개로 제한
    if (newList.length > 10) newList = newList.slice(0, 10);
    set({ favorites: newList });
  },

  removeFavorite: (index) => {
    const { favorites } = get();
    set({ favorites: favorites.filter((_, i) => i !== index) });
  },

  clearFavorites: () => set({ favorites: [] }),
}));
