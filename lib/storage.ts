const RECENT_STATIONS_KEY = 'nowgo_recent_stations';
const MAX_RECENT_STATIONS = 5;

export interface RecentStation {
  name: string;
  timestamp: number;
}

export const getRecentStations = (): RecentStation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_STATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addRecentStation = (stationName: string) => {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentStations();
    const filtered = recent.filter((s) => s.name !== stationName);
    const updated = [{ name: stationName, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_STATIONS);
    localStorage.setItem(RECENT_STATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent station:', error);
  }
};

const LAST_CONDITIONS_KEY = 'nowgo_last_conditions';

export interface LastConditions {
  station: string;
  duration: number;
  groupSize: number;
}

export const getLastConditions = (): LastConditions | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LAST_CONDITIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveLastConditions = (conditions: LastConditions) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_CONDITIONS_KEY, JSON.stringify(conditions));
  } catch (error) {
    console.error('Failed to save last conditions:', error);
  }
};
