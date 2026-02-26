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
  userId?: string;             // 訪問済みチェック用
  excludeSpotIds?: string[];   // 除外するスポットID（再作成用）
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

// ── 営業時間チェック ──
function isOpen(spot: DbSpot, currentHour: number, currentMinute: number): boolean {
  // 24時間営業
  if (spot.is_open_24h) return true;

  // 営業時間が未設定
  if (!spot.starttime || !spot.closetime) return true;

  try {
    const [startH, startM] = spot.starttime.split(':').map(Number);
    const [closeH, closeM] = spot.closetime.split(':').map(Number);

    const currentMins = currentHour * 60 + currentMinute;
    const startMins = startH * 60 + startM;
    let closeMins = closeH * 60 + closeM;

    // 日をまたぐケース（例: 23:00 - 03:00）
    if (closeMins < startMins) {
      return currentMins >= startMins || currentMins < closeMins;
    }

    return currentMins >= startMins && currentMins < closeMins;
  } catch {
    return true; // パースエラー時は含める
  }
}

// ── タグマッチングスコア ──
function getTagMatchScore(spotTags: string | null, params: SpotSearchParams): number {
  if (!spotTags) return 1.0;

  const tags = spotTags.toLowerCase().split(',').map(t => t.trim());
  let score = 1.0;

  // スタイルマッチ
  if (params.style === 'ゆっくり' && tags.some(t => ['のんびり', 'リラックス', '静か', 'ゆったり'].includes(t))) {
    score *= 1.3;
  }
  if (params.style === 'アクティブ' && tags.some(t => ['アクティブ', '体験', '参加型', 'インタラクティブ'].includes(t))) {
    score *= 1.3;
  }

  // モードマッチ
  if (params.mode === '定番' && tags.some(t => ['人気', '有名', '定番', 'インスタ映え'].includes(t))) {
    score *= 1.2;
  }
  if (params.mode === '新規開拓' && tags.some(t => ['穴場', '隠れ家', 'ローカル', 'ニッチ'].includes(t))) {
    score *= 1.3;
  }
  if (params.mode === '冒険' && tags.some(t => ['ユニーク', '珍しい', 'アート', '体験型'].includes(t))) {
    score *= 1.3;
  }

  return score;
}

// ── 価格レベルスコア ──
function getPriceLevelScore(priceLevel: string | null, availableTime: number): number {
  if (!priceLevel) return 1.0;

  // 短時間なら安めが良い、長時間ならコスパ重視
  const priceLevels: Record<string, number> = {
    'free': 1.3,
    'low': 1.2,
    'medium': 1.0,
    'high': 0.8,
    'very_high': 0.6,
  };

  const baseScore = priceLevels[priceLevel] ?? 1.0;

  // 2時間以上ある場合、有料でもOK
  if (availableTime >= 120 && priceLevel === 'medium') {
    return 1.1;
  }

  return baseScore;
}

// ── メイン検索 ──
export async function searchSpotsFromDB(
  params: SpotSearchParams,
  count = 5,
): Promise<PlanSpot[]> {
  // 1. 訪問済みスポットIDを取得
  let visitedIds: string[] = [];
  if (params.userId) {
    try {
      const { data } = await supabase
        .from('visited_spots')
        .select('spot_source_id')
        .eq('user_id', params.userId);
      if (data) {
        visitedIds = data.map(v => v.spot_source_id);
      }
    } catch {
      // エラー時はスキップ
    }
  }

  // 2. Supabase クエリ構築
  let query = supabase
    .from('spot')
    .select('*')
    .eq('isActive', true);

  // 訪問済み除外
  if (visitedIds.length > 0) {
    query = query.not('source_id', 'in', `(${visitedIds.join(',')})`);
  }

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
  const now = new Date();
  const currentMinute = now.getMinutes();

  const excludeSet = new Set(params.excludeSpotIds ?? []);

  const scored = spots
    .filter((s) => s.name && s.lat && s.lon)
    .filter((s) => !excludeSet.has(s.source_id)) // 除外スポット
    .filter((s) => isOpen(s, params.currentHour, currentMinute)) // 営業時間フィルタ
    .map((spot) => {
      let score = 1.0;
      const lat = parseFloat(spot.lat!);
      const lon = parseFloat(spot.lon!);

      // ── 距離スコア（近いほど高い） ──
      if (params.origin) {
        const d = distanceKm(params.origin.lat, params.origin.lng, lat, lon);
        // 1km以内: 1.0, 2km: 0.7, 3km: 0.4, 5km以上: 0.1
        score *= Math.max(0.1, Math.exp(-d * 0.5));
      }

      // ── 天気スコア ──
      if (params.weather === '雨' || params.weather === '雪') {
        if (spot.weather_ok?.includes('雨OK')) {
          score *= 1.5;
        } else if (spot.indoor_type === 'outdoor') {
          score *= 0.2;
        } else if (spot.indoor_type === 'indoor') {
          score *= 1.3;
        }
      } else if (params.weather === '晴れ') {
        if (spot.indoor_type === 'outdoor' || spot.indoor_type === 'both') {
          score *= 1.3;
        }
      }

      // ── 時間帯スコア ──
      const h = params.currentHour;
      if (h >= 5 && h < 11) {
        // 朝：カフェ、庭園が良い
        if (spot.category === 'cafe') score *= 1.4;
        if (spot.category === 'garden') score *= 1.3;
      } else if (h >= 11 && h < 16) {
        // 昼：美術館、雑貨、動物園、水族館
        if (spot.category === 'museum') score *= 1.3;
        if (spot.category === 'zoo' || spot.category === 'aquarium') score *= 1.2;
        if (spot.category === 'zakka') score *= 1.1;
      } else if (h >= 16 && h < 19) {
        // 夕方：ショッピング、カフェ
        if (spot.category === 'clothes' || spot.category === 'zakka') score *= 1.3;
        if (spot.category === 'cafe') score *= 1.2;
      } else {
        // 夜：カフェ、室内系のみ
        if (spot.indoor_type === 'indoor' || spot.category === 'cafe') score *= 1.3;
        else score *= 0.6; // 夜の屋外は減点
      }

      // ── 滞在時間 vs 利用可能時間 ──
      const stayMin = spot.estimated_stay_min ?? 30;
      const timeRatio = stayMin / params.availableTime;
      if (timeRatio < 0.4) {
        score *= 1.2; // 余裕を持って楽しめる
      } else if (timeRatio > 0.8) {
        score *= 0.4; // 時間が足りない
      }

      // ── スタイル ──
      if (params.style === 'ゆっくり') {
        if (spot.stay_type === 'stay') score *= 1.4;
        if (stayMin >= 60) score *= 1.2;
      } else if (params.style === 'アクティブ') {
        if (spot.stay_type === 'roam') score *= 1.4;
        if (spot.indoor_type === 'outdoor') score *= 1.2;
        if (stayMin <= 40) score *= 1.1;
      } else if (params.style === 'ほどほど') {
        if (stayMin >= 30 && stayMin <= 60) score *= 1.1;
      }

      // ── モード ──
      const fame = spot.famousLevel ?? 1;
      if (params.mode === '定番') {
        score *= 1 + fame * 0.25; // 有名なほど高スコア
      } else if (params.mode === '新規開拓') {
        if (fame <= 2) score *= 1.4; // 知名度低いと高スコア
        else score *= 0.8;
      } else if (params.mode === '冒険') {
        if (spot.category === 'aquarium' || spot.category === 'zoo' || spot.category === 'museum') {
          score *= 1.4;
        }
      }

      // ── タグマッチング ──
      score *= getTagMatchScore(spot.tags, params);

      // ── 価格レベル ──
      score *= getPriceLevelScore(spot.price_level, params.availableTime);

      // ── ベース知名度ボーナス（控えめ） ──
      score *= 1 + fame * 0.03;

      return { spot, score, lat, lon };
    });

  // スコア降順ソート
  scored.sort((a, b) => b.score - a.score);

  // 上位候補からスコア加重ランダム抽出（毎回違う結果になる）
  const poolSize = Math.min(scored.length, Math.max(count * 5, 20));
  const pool = scored.slice(0, poolSize);

  const selected: typeof scored = [];
  const categoryCounts: Record<string, number> = {};
  const used = new Set<number>();

  // スコアを加重として使うランダム選択（カテゴリバランス付き）
  const pickWeightedRandom = (candidates: typeof pool, maxPerCat: number): boolean => {
    // カテゴリ制限を満たす候補のみ
    const eligible = candidates
      .map((item, i) => ({ item, i }))
      .filter(({ item, i }) => {
        if (used.has(i)) return false;
        const cat = item.spot.category ?? 'other';
        return (categoryCounts[cat] ?? 0) < maxPerCat;
      });

    if (eligible.length === 0) return false;

    // スコアを加重にしてランダム抽出
    const totalWeight = eligible.reduce((sum, { item }) => sum + item.score, 0);
    let r = Math.random() * totalWeight;
    for (const { item, i } of eligible) {
      r -= item.score;
      if (r <= 0) {
        selected.push(item);
        used.add(i);
        const cat = item.spot.category ?? 'other';
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
        return true;
      }
    }
    // フォールバック：最後の候補を選択
    const last = eligible[eligible.length - 1];
    selected.push(last.item);
    used.add(last.i);
    const cat = last.item.spot.category ?? 'other';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    return true;
  };

  // 1st pass: 同カテゴリ2個まで
  while (selected.length < count) {
    if (!pickWeightedRandom(pool, 2)) break;
  }
  // 2nd pass: まだ足りなければ3個まで許容
  while (selected.length < count) {
    if (!pickWeightedRandom(pool, 3)) break;
  }

  // 開始時刻の計算
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
