import { supabase } from './supabase';
import { DbSpot } from '@/hooks/useNowgoStore';

export async function getAllSpots(): Promise<DbSpot[]> {
  const { data, error } = await supabase
    .from('spot')
    .select('*')
    .eq('isActive', true);

  if (error) {
    console.error('Error fetching spots:', error);
    return [];
  }

  return data || [];
}

export async function getSpotById(sourceId: string): Promise<DbSpot | null> {
  const { data, error } = await supabase
    .from('spot')
    .select('*')
    .eq('source_id', sourceId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching spot:', error);
    return null;
  }

  return data;
}

export async function getSpotsByCategory(category: string): Promise<DbSpot[]> {
  const { data, error } = await supabase
    .from('spot')
    .select('*')
    .eq('category', category)
    .eq('isActive', true);

  if (error) {
    console.error('Error fetching spots by category:', error);
    return [];
  }

  return data || [];
}

export async function getNearbySpots(
  lat: number,
  lon: number,
  radiusKm: number = 5
): Promise<DbSpot[]> {
  const allSpots = await getAllSpots();

  return allSpots.filter(spot => {
    if (!spot.lat || !spot.lon) return false;

    const spotLat = parseFloat(spot.lat);
    const spotLon = parseFloat(spot.lon);

    const distance = calculateDistance(lat, lon, spotLat, spotLon);
    return distance <= radiusKm;
  });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
