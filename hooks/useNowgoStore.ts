import { create } from 'zustand';

export interface DbSpot {
  source_id: string;
  name: string | null;
  detail: string | null;
  source: string | null;
  category: string | null;
  cuisine: string | null;
  lat: string | null;
  lon: string | null;
  address: string | null;
  website: string | null;
  isActive: boolean | null;
  starttime: string | null;
  closetime: string | null;
  is_open_24h: boolean | null;
  indoor_type: string | null;
  weather_ok: string | null;
  famousLevel: number | null;
  stay_type: string | null;
  estimated_stay_min: number | null;
  tags: string | null;
  price_level: string | null;
  popularity_hint: string | null;
  created_at: string;
  updated_at: string | null;
  last_verified_at: string | null;
  isInbound: boolean | null;
}

export interface PlanSpot {
  id: string;
  name: string;
  category: string;
  description: string;
  time: string;
  duration: number;
  lat: number;
  lng: number;
}

export interface SearchParams {
  availableTime: number;
  currentHour: number;
  weather: '晴れ' | '曇り' | '雨' | '雪' | '風強め';
  style?: 'ゆっくり' | 'ほどほど' | 'アクティブ';
  locationType?: '屋内' | '屋外';
  mode: string;
}

export interface Plan {
  spots: PlanSpot[];
  startTime: string;
  totalDuration: number;
  pinnedSpots: string[];
  searchParams: SearchParams;
}

export type StartLocationSource = 'gps' | 'manual';

export interface StartLocation {
  /** UIに表示する出発地（住所 or 駅名） */
  label: string;
  /** 裏で保持する緯度経度（距離計算用） */
  lat: number | null;
  lng: number | null;
  source: StartLocationSource;
  /** GPS精度（m）。取得できない場合はnull */
  accuracy: number | null;
}

interface NowgoStore {
  currentScreen: 'auth' | 'dashboard' | 'quickplan' | 'themes' | 'profile' | 'plan' | 'executing' | 'complete';
  /** 出発地（住所表示＋緯度経度保持） */
  startLocation: StartLocation;
  duration: number;
  groupSize: number;
  /** 徒歩何分圏内で遊ぶか（100m=徒歩2分換算の前提でUI提示） */
  walkRangeMinutes: number;
  currentPlan: Plan | null;

  setScreen: (screen: NowgoStore['currentScreen']) => void;
  setStartLocation: (location: StartLocation) => void;
  setDuration: (duration: number) => void;
  setGroupSize: (size: number) => void;
  setWalkRangeMinutes: (minutes: number) => void;
  setPlan: (plan: Plan) => void;
  togglePinSpot: (spotId: string) => void;
  reset: () => void;
}

export const useNowgoStore = create<NowgoStore>((set) => ({
  currentScreen: 'auth',
  startLocation: {
    label: '',
    lat: null,
    lng: null,
    source: 'gps',
    accuracy: null,
  },
  duration: 120,
  groupSize: 2,
  walkRangeMinutes: 30,
  currentPlan: null,

  setScreen: (screen) => set({ currentScreen: screen }),
  setStartLocation: (location) => set({ startLocation: location }),
  setDuration: (duration) => set({ duration }),
  setGroupSize: (size) => set({ groupSize: size }),
  setWalkRangeMinutes: (minutes) => set({ walkRangeMinutes: minutes }),
  setPlan: (plan) => set({ currentPlan: plan }),
  togglePinSpot: (spotId) =>
    set((state) => {
      if (!state.currentPlan) return state;
      const pinnedSpots = state.currentPlan.pinnedSpots.includes(spotId)
        ? state.currentPlan.pinnedSpots.filter((id) => id !== spotId)
        : [...state.currentPlan.pinnedSpots, spotId];
      return {
        currentPlan: {
          ...state.currentPlan,
          pinnedSpots,
        },
      };
    }),
  reset: () =>
    set({
      currentScreen: 'dashboard',
      startLocation: {
        label: '',
        lat: null,
        lng: null,
        source: 'gps',
        accuracy: null,
      },
      duration: 120,
      groupSize: 2,
      walkRangeMinutes: 30,
      currentPlan: null,
    }),
}));
