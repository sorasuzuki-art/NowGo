import { supabase } from './supabase';

const RECENT_STATIONS_KEY = 'nowgo_recent_stations';
const LAST_CONDITIONS_KEY = 'nowgo_last_conditions';
const MAX_RECENT_STATIONS = 5;

export interface RecentStation {
  name: string;
  timestamp: number;
}

export interface LastConditions {
  station: string;
  duration: number;
  groupSize: number;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export const getRecentStations = async (): Promise<RecentStation[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('recent_stations')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch recent stations from Supabase:', error);
        return getRecentStationsFromLocalStorage();
      }

      return data?.recent_stations || [];
    }

    return getRecentStationsFromLocalStorage();
  } catch (error) {
    console.error('Error getting recent stations:', error);
    return getRecentStationsFromLocalStorage();
  }
};

function getRecentStationsFromLocalStorage(): RecentStation[] {
  try {
    const stored = localStorage.getItem(RECENT_STATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export const addRecentStation = async (stationName: string) => {
  if (typeof window === 'undefined') return;

  try {
    const userId = await getCurrentUserId();

    if (userId) {
      const recent = await getRecentStations();
      const filtered = recent.filter((s) => s.name !== stationName);
      const updated = [{ name: stationName, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_STATIONS);

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          recent_stations: updated,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to save recent station to Supabase:', error);
        addRecentStationToLocalStorage(stationName);
      }
    } else {
      addRecentStationToLocalStorage(stationName);
    }
  } catch (error) {
    console.error('Error adding recent station:', error);
    addRecentStationToLocalStorage(stationName);
  }
};

function addRecentStationToLocalStorage(stationName: string) {
  try {
    const recent = getRecentStationsFromLocalStorage();
    const filtered = recent.filter((s) => s.name !== stationName);
    const updated = [{ name: stationName, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_STATIONS);
    localStorage.setItem(RECENT_STATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent station to localStorage:', error);
  }
}

export const getLastConditions = async (): Promise<LastConditions | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('last_station, last_duration, last_group_size')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch last conditions from Supabase:', error);
        return getLastConditionsFromLocalStorage();
      }

      if (data && data.last_station) {
        return {
          station: data.last_station,
          duration: data.last_duration,
          groupSize: data.last_group_size,
        };
      }

      return null;
    }

    return getLastConditionsFromLocalStorage();
  } catch (error) {
    console.error('Error getting last conditions:', error);
    return getLastConditionsFromLocalStorage();
  }
};

function getLastConditionsFromLocalStorage(): LastConditions | null {
  try {
    const stored = localStorage.getItem(LAST_CONDITIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const saveLastConditions = async (conditions: LastConditions) => {
  if (typeof window === 'undefined') return;

  try {
    const userId = await getCurrentUserId();

    if (userId) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          last_station: conditions.station,
          last_duration: conditions.duration,
          last_group_size: conditions.groupSize,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to save last conditions to Supabase:', error);
        saveLastConditionsToLocalStorage(conditions);
      }
    } else {
      saveLastConditionsToLocalStorage(conditions);
    }
  } catch (error) {
    console.error('Error saving last conditions:', error);
    saveLastConditionsToLocalStorage(conditions);
  }
};

function saveLastConditionsToLocalStorage(conditions: LastConditions) {
  try {
    localStorage.setItem(LAST_CONDITIONS_KEY, JSON.stringify(conditions));
  } catch (error) {
    console.error('Failed to save last conditions to localStorage:', error);
  }
}

// ── Favorite Spots ──

export const toggleFavoriteSpot = async (spotSourceId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    const { data: existing } = await supabase
      .from('favorite_spots')
      .select('id')
      .eq('user_id', userId)
      .eq('spot_source_id', spotSourceId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('favorite_spots')
        .delete()
        .eq('user_id', userId)
        .eq('spot_source_id', spotSourceId);
    } else {
      await supabase
        .from('favorite_spots')
        .insert({ user_id: userId, spot_source_id: spotSourceId });
    }
  } catch (error) {
    console.error('Failed to toggle favorite spot:', error);
  }
};

export const getFavoriteSpotCount = async (): Promise<number> => {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('favorite_spots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return 0;
  return count ?? 0;
};

// ── Visited Spots ──

export const markSpotsVisited = async (spotSourceIds: string[]): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId || spotSourceIds.length === 0) return;

  try {
    const rows = spotSourceIds.map((id) => ({
      user_id: userId,
      spot_source_id: id,
    }));

    await supabase
      .from('visited_spots')
      .upsert(rows, { onConflict: 'user_id,spot_source_id', ignoreDuplicates: true });
  } catch (error) {
    console.error('Failed to mark spots as visited:', error);
  }
};

export const getVisitedSpotCount = async (): Promise<number> => {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('visited_spots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return 0;
  return count ?? 0;
};

// ── Plan History ──

export const savePlanHistory = async (plan: {
  spots: any[];
  startTime: string;
  totalDuration: number;
  startLocationLabel?: string;
}): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    await supabase
      .from('plan_history')
      .insert({
        user_id: userId,
        spots: plan.spots,
        start_time: plan.startTime,
        total_duration: plan.totalDuration,
        start_location_label: plan.startLocationLabel || null,
      });
  } catch (error) {
    console.error('Failed to save plan history:', error);
  }
};

export const getPlanHistoryCount = async (): Promise<number> => {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('plan_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return 0;
  return count ?? 0;
};
