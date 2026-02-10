export interface OSMPlace {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  distance?: number;
  tags?: Record<string, string>;
}

export interface StationCoords {
  lat: number;
  lon: number;
}

export const STATION_COORDINATES: Record<string, StationCoords> = {
  '渋谷駅': { lat: 35.6580, lon: 139.7016 },
  '新宿駅': { lat: 35.6896, lon: 139.7006 },
  '東京駅': { lat: 35.6812, lon: 139.7671 },
  '品川駅': { lat: 35.6284, lon: 139.7387 },
  '池袋駅': { lat: 35.7295, lon: 139.7109 },
  '浅草駅': { lat: 35.7106, lon: 139.7967 },
  '表参道駅': { lat: 35.6654, lon: 139.7125 },
  '原宿駅': { lat: 35.6702, lon: 139.7026 },
  '六本木駅': { lat: 35.6627, lon: 139.7290 },
  '丸の内駅': { lat: 35.6812, lon: 139.7645 },
  '恵比寿駅': { lat: 35.6467, lon: 139.7100 },
  '中目黒駅': { lat: 35.6417, lon: 139.6986 },
  '代官山駅': { lat: 35.6497, lon: 139.7032 },
  '自由が丘駅': { lat: 35.6077, lon: 139.6683 },
  '二子玉川駅': { lat: 35.6127, lon: 139.6269 },
};

const OSM_CATEGORY_MAP: Record<string, string> = {
  cafe: 'カフェ',
  restaurant: 'レストラン',
  fast_food: 'ファストフード',
  bar: 'バー',
  pub: '居酒屋',
  park: '公園',
  museum: '美術館',
  gallery: 'ギャラリー',
  attraction: '観光スポット',
  viewpoint: '展望台',
  shop: 'ショップ',
  mall: 'ショッピングモール',
  cinema: '映画館',
  theatre: '劇場',
  library: '図書館',
  place_of_worship: '寺社',
};

function getCategoryFromTags(tags: Record<string, string>): string {
  if (tags.amenity) {
    if (tags.amenity === 'cafe') return 'カフェ';
    if (tags.amenity === 'restaurant') return 'レストラン';
    if (tags.amenity === 'fast_food') return 'ファストフード';
    if (tags.amenity === 'bar') return 'バー';
    if (tags.amenity === 'pub') return '居酒屋';
    if (tags.amenity === 'cinema') return '映画館';
    if (tags.amenity === 'theatre') return '劇場';
    if (tags.amenity === 'library') return '図書館';
    if (tags.amenity === 'place_of_worship') return '寺社';
  }

  if (tags.leisure) {
    if (tags.leisure === 'park') return '公園';
    if (tags.leisure === 'garden') return '公園';
    if (tags.leisure === 'playground') return '公園';
    if (tags.leisure === 'sports_centre') return 'スポーツ施設';
  }

  if (tags.tourism) {
    if (tags.tourism === 'museum') return '美術館';
    if (tags.tourism === 'gallery') return 'ギャラリー';
    if (tags.tourism === 'attraction') return '観光スポット';
    if (tags.tourism === 'viewpoint') return '展望台';
    if (tags.tourism === 'artwork') return 'アート';
  }

  if (tags.shop) {
    if (tags.shop === 'mall' || tags.shop === 'department_store') return 'ショッピングモール';
    if (tags.shop === 'books') return '書店';
    if (tags.shop === 'clothes') return 'アパレル';
    if (tags.shop === 'electronics') return '家電';
    return 'ショップ';
  }

  return 'その他';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getNearbyPlaces(
  stationName: string,
  radiusKm: number = 1.5,
  categories?: string[]
): Promise<OSMPlace[]> {
  const coords = STATION_COORDINATES[stationName];
  if (!coords) {
    throw new Error(`Station coordinates not found for: ${stationName}`);
  }

  const { lat, lon } = coords;
  const radiusMeters = radiusKm * 1000;

  const categoryFilter = categories && categories.length > 0
    ? categories.map(cat => {
        const osmKey = Object.entries(OSM_CATEGORY_MAP).find(([_, value]) => value === cat)?.[0];
        return osmKey;
      }).filter(Boolean).join('|')
    : '';

  const overpassQuery = `
    [out:json][timeout:30];
    (
      node["amenity"~"cafe|restaurant|fast_food|bar|pub|cinema|theatre|library|place_of_worship"](around:${radiusMeters},${lat},${lon});
      node["leisure"~"park|garden|playground|sports_centre"](around:${radiusMeters},${lat},${lon});
      node["tourism"~"museum|gallery|attraction|viewpoint|artwork"](around:${radiusMeters},${lat},${lon});
      node["shop"~"mall|department_store|books|clothes|electronics"](around:${radiusMeters},${lat},${lon});
      way["amenity"~"cafe|restaurant|fast_food|bar|pub|cinema|theatre|library|place_of_worship"](around:${radiusMeters},${lat},${lon});
      way["leisure"~"park|garden|playground|sports_centre"](around:${radiusMeters},${lat},${lon});
      way["tourism"~"museum|gallery|attraction|viewpoint|artwork"](around:${radiusMeters},${lat},${lon});
      way["shop"~"mall|department_store|books|clothes|electronics"](around:${radiusMeters},${lat},${lon});
      relation["leisure"="park"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    const places: OSMPlace[] = data.elements
      .filter((element: any) => element.tags && element.tags.name)
      .map((element: any) => {
        const elementLat = element.lat || element.center?.lat;
        const elementLon = element.lon || element.center?.lon;

        if (!elementLat || !elementLon) return null;

        const distance = calculateDistance(lat, lon, elementLat, elementLon);
        const category = getCategoryFromTags(element.tags);

        if (categories && categories.length > 0 && !categories.includes(category)) {
          return null;
        }

        return {
          id: element.id.toString(),
          name: element.tags.name,
          category,
          lat: elementLat,
          lon: elementLon,
          distance,
          tags: element.tags,
        };
      })
      .filter((place: OSMPlace | null): place is OSMPlace => place !== null)
      .sort((a: OSMPlace, b: OSMPlace) => (a.distance || 0) - (b.distance || 0));

    return places.slice(0, 50);
  } catch (error) {
    console.error('Error fetching nearby places from OSM:', error);
    throw error;
  }
}

export function getWalkingTime(distanceKm: number): number {
  const walkingSpeedKmh = 4.8;
  return Math.round((distanceKm / walkingSpeedKmh) * 60);
}

export function getPlaceImageUrl(category: string): string {
  const imageMap: Record<string, string> = {
    'カフェ': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
    'レストラン': 'https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?auto=compress&cs=tinysrgb&w=400',
    'ファストフード': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
    'バー': 'https://images.pexels.com/photos/941864/pexels-photo-941864.jpeg?auto=compress&cs=tinysrgb&w=400',
    '居酒屋': 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400',
    '公園': 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=400',
    '美術館': 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=400',
    'ギャラリー': 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=400',
    '観光スポット': 'https://images.pexels.com/photos/1680247/pexels-photo-1680247.jpeg?auto=compress&cs=tinysrgb&w=1920',
    '展望台': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=400',
    'アート': 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400',
    'ショップ': 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=400',
    'ショッピングモール': 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=400',
    '書店': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
    'アパレル': 'https://images.pexels.com/photos/984619/pexels-photo-984619.jpeg?auto=compress&cs=tinysrgb&w=400',
    '家電': 'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=400',
    '映画館': 'https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=400',
    '劇場': 'https://images.pexels.com/photos/713149/pexels-photo-713149.jpeg?auto=compress&cs=tinysrgb&w=400',
    '図書館': 'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=400',
    '寺社': 'https://images.pexels.com/photos/161401/fushimi-inari-taisha-shrine-kyoto-japan-temple-161401.jpeg?auto=compress&cs=tinysrgb&w=400',
    'スポーツ施設': 'https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  return imageMap[category] || 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=400';
}
