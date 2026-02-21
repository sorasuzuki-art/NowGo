import { supabase } from './supabase';
import type { DbSpot, PlanSpot } from '@/hooks/useNowgoStore';

// ── カテゴリの日本語表示名 ──
const CATEGORY_LABEL: Record<string, string> = {
  cafe: 'カフェ',
  clothes: 'ショップ',
  zakka: '雑貨',
  museum: '美術館',
  garden: '庭園',
  aquarium: '水族館',
  zoo: '動物園',
};

export function getCategoryLabel(cat: string | null): string {
  return CATEGORY_LABEL[cat ?? ''] ?? cat ?? 'その他';
}

// ── 検索パラメータ ──
export interface SpotSearchParams {
  availableTime: number;       // 遊べる時間（分）
  currentHour: number;         // 現在時刻 0-23
  weather: '晴れ' | '曇り' | '雨' | '雪' | '風強め';
  style?: 'ゆっくり' | 'ほどほど' | 'アクティブ';
  locationType?: '屋内' | '屋外';
  mode: string;                // 定番 / 新規開拓 / 冒険
  origin?: { lat: number; lng: number };
  walkRangeMinutes?: number;
}

// ── Haversine 距離（km） ──
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── メイン検索 ──
export async function searchSpotsFromDB(
  params: SpotSearchParams,
  count = 5,
): Promise<PlanSpot[]> {
  // 1. Supabase クエリ構築
  let query = supabase
    .from('spot')
    .select('*')
    .eq('isActive', true);

  // 屋内/屋外フィルタ
  if (params.locationType === '屋内') {
    query = query.in('indoor_type', ['indoor', 'both']);
  } else if (params.locationType === '屋外') {
    query = query.in('indoor_type', ['outdoor', 'both']);
  }

  // 位置ベースの粗いバウンディングボックス（徒歩圏内）
  if (params.origin) {
    const walkKm = ((params.walkRangeMinutes ?? 30) / 15) * 1; // 15分≒1km
    const latDelta = walkKm / 111;
    const lonDelta = walkKm / (111 * Math.cos((params.origin.lat * Math.PI) / 180));
    query = query
      .gte('lat', String(params.origin.lat - latDelta))
      .lte('lat', String(params.origin.lat + latDelta))
      .gte('lon', String(params.origin.lng - lonDelta))
      .lte('lon', String(params.origin.lng + lonDelta));
  }

  query = query.limit(500);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase error: ${error.message}`);
  if (!data || data.length === 0) {
    // 位置フィルタで0件なら範囲を広げてリトライ
    const { data: fallback } = await supabase
      .from('spot')
      .select('*')
      .eq('isActive', true)
      .limit(200);
    if (!fallback || fallback.length === 0) return [];
    return rankAndFormat(fallback as DbSpot[], params, count);
  }

  return rankAndFormat(data as DbSpot[], params, count);
}

// ── スコアリング & フォーマット ──
function rankAndFormat(
  spots: DbSpot[],
  params: SpotSearchParams,
  count: number,
): PlanSpot[] {
  const scored = spots
    .filter((s) => s.name && s.lat && s.lon)
    .map((spot) => {
      let score = 1.0;
      const lat = parseFloat(spot.lat!);
      const lon = parseFloat(spot.lon!);

      // ── 距離スコア（近いほど高い） ──
      if (params.origin) {
        const d = distanceKm(params.origin.lat, params.origin.lng, lat, lon);
        score *= Math.max(0.1, 1 - d * 0.3); // 3km超で大きく減衰
      }

      // ── 天気スコア ──
      if (params.weather === '雨' || params.weather === '雪') {
        if (spot.weather_ok?.includes('雨OK')) {
          score *= 1.4;
        } else if (spot.indoor_type === 'outdoor') {
          score *= 0.3;
        }
      } else if (params.weather === '晴れ') {
        if (spot.indoor_type === 'outdoor' || spot.indoor_type === 'both') {
          score *= 1.2;
        }
      }

      // ── 時間帯スコア ──
      const h = params.currentHour;
      if (h >= 5 && h < 11) {
        // 朝：カフェ、庭園が良い
        if (spot.category === 'cafe') score *= 1.3;
        if (spot.category === 'garden') score *= 1.3;
      } else if (h >= 11 && h < 16) {
        // 昼：美術館、雑貨
        if (spot.category === 'museum') score *= 1.2;
        if (spot.category === 'zakka') score *= 1.1;
      } else if (h >= 16 && h < 19) {
        // 夕方：ショッピング、カフェ
        if (spot.category === 'clothes' || spot.category === 'zakka') score *= 1.2;
        if (spot.category === 'cafe') score *= 1.1;
      } else {
        // 夜：カフェ、室内系
        if (spot.indoor_type === 'indoor') score *= 1.2;
      }

      // ── 滞在時間 vs 利用可能時間 ──
      const stayMin = spot.estimated_stay_min ?? 30;
      if (stayMin <= params.availableTime * 0.6) {
        score *= 1.1; // 余裕を持って楽しめる
      } else if (stayMin > params.availableTime) {
        score *= 0.5; // 時間が足りない
      }

      // ── スタイル ──
      if (params.style === 'ゆっくり') {
        if (spot.stay_type === 'stay') score *= 1.3;
        if (stayMin >= 60) score *= 1.1;
      } else if (params.style === 'アクティブ') {
        if (spot.stay_type === 'roam') score *= 1.3;
        if (spot.indoor_type === 'outdoor') score *= 1.2;
      }

      // ── モード ──
      if (params.mode === '定番') {
        score *= 1 + (spot.famousLevel ?? 1) * 0.2;
      } else if (params.mode === '新規開拓') {
        if ((spot.famousLevel ?? 1) <= 2) score *= 1.3;
      } else if (params.mode === '冒険') {
        if (spot.category === 'aquarium' || spot.category === 'zoo' || spot.category === 'museum') {
          score *= 1.3;
        }
      }

      // ── 知名度ベースボーナス ──
      score *= 1 + (spot.famousLevel ?? 1) * 0.05;

      return { spot, score, lat, lon };
    });

  // スコア降順ソート
  scored.sort((a, b) => b.score - a.score);

  // カテゴリが被りすぎないようにバランス調整
  const selected: typeof scored = [];
  const categoryCounts: Record<string, number> = {};

  for (const item of scored) {
    if (selected.length >= count) break;
    const cat = item.spot.category ?? 'other';
    const catCount = categoryCounts[cat] ?? 0;
    // 同カテゴリは最大2つまで
    if (catCount >= 2) continue;
    selected.push(item);
    categoryCounts[cat] = catCount + 1;
  }

  // 開始時刻の計算
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

  return selected.map((item, index) => {
    const spotTime = new Date(now.getTime() + index * 45 * 60 * 1000); // 45分間隔
    const stayMin = item.spot.estimated_stay_min ?? 30;

    return {
      id: item.spot.source_id,
      name: item.spot.name!,
      category: getCategoryLabel(item.spot.category),
      description: item.spot.detail ?? '',
      time: spotTime.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      duration: stayMin,
      lat: item.lat,
      lng: item.lon,
    };
  });
}
