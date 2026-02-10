import testSpotsData from '@/data/testSpots.json';

export interface TestSpot {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  description: string;
  tags: string[];
  openHours: {
    weekday: string;
    weekend: string;
  };
  images: string[];
  estimatedTime: number;
  priceRange: string;
  features: string[];
  weather: string[];
}

export const testSpots: TestSpot[] = testSpotsData.spots;

export const getSpotsByCategory = (category: string): TestSpot[] => {
  if (category === 'All') return testSpots;
  return testSpots.filter(spot => spot.category === category);
};

export const getRandomSpots = (count: number = 10): TestSpot[] => {
  const shuffled = [...testSpots].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getSpotById = (id: string): TestSpot | undefined => {
  return testSpots.find(spot => spot.id === id);
};

export const getNearbySpots = (latitude: number, longitude: number, radiusKm: number = 5): TestSpot[] => {
  return testSpots.filter(spot => {
    const distance = calculateDistance(
      latitude, longitude,
      spot.coordinates.latitude, spot.coordinates.longitude
    );
    return distance <= radiusKm;
  });
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}