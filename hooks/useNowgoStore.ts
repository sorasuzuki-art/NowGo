import { create } from 'zustand';

export interface Spot {
  id: string;
  name: string;
  category: string;
  description: string;
  time: string;
  duration: number;
  lat: number;
  lng: number;
}

export interface Plan {
  spots: Spot[];
  startTime: string;
  totalDuration: number;
  pinnedSpots: string[];
}

interface NowgoStore {
  currentScreen: 'auth' | 'dashboard' | 'quickplan' | 'mood' | 'themes' | 'nearby' | 'profile' | 'plan' | 'executing' | 'complete';
  selectedStation: string;
  duration: number;
  groupSize: number;
  currentPlan: Plan | null;

  setScreen: (screen: NowgoStore['currentScreen']) => void;
  setStation: (station: string) => void;
  setDuration: (duration: number) => void;
  setGroupSize: (size: number) => void;
  setPlan: (plan: Plan) => void;
  togglePinSpot: (spotId: string) => void;
  reset: () => void;
}

export const useNowgoStore = create<NowgoStore>((set) => ({
  currentScreen: 'auth',
  selectedStation: '',
  duration: 120,
  groupSize: 2,
  currentPlan: null,

  setScreen: (screen) => set({ currentScreen: screen }),
  setStation: (station) => set({ selectedStation: station }),
  setDuration: (duration) => set({ duration }),
  setGroupSize: (size) => set({ groupSize: size }),
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
      selectedStation: '',
      duration: 120,
      groupSize: 2,
      currentPlan: null,
    }),
}));
