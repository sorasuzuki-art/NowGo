import { supabase } from './supabase';
import type { DbSpot, PlanSpot } from '@/hooks/useNowgoStore';

// ══════════════════════════════════════════
// カテゴリ正規化
// ══════════════════════════════════════════

const CATEGORY_GROUP: Record<string, string> = {
  cafe: 'カフェ', カフェ: 'カフェ', bar: 'カフェ', バー: 'カフェ', シーシャ: 'カフェ',
  clothes: 'ショッピング', zakka: 'ショッピング', 古着: 'ショッピング', 雑貨: 'ショッピング',
  ショップ: 'ショッピング', ショッピング: 'ショッピング', 書店: 'ショッピング',
  文具: 'ショッピング', レコード: 'ショッピング', 古書: 'ショッピング',
  museum: 'カルチャー', 美術館: 'カルチャー', 博物館: 'カルチャー',
  gallery: 'カルチャー', ギャラリー: 'カルチャー', アート: 'カルチャー',
  文学館: 'カルチャー', プラネタリウム: 'カルチャー',
  garden: '自然', 庭園: '自然', park: '自然', 公園: '自然',
  植物園: '自然', 自然: '自然', 自然スポット: '自然', 遊歩道: '自然',
  amusement: 'エンタメ', アミューズメント: 'エンタメ', 遊園地: 'エンタメ',
  テーマパーク: 'エンタメ', 体験: 'エンタメ', 体験施設: 'エンタメ',
  エンタメ: 'エンタメ', 映画館: 'エンタメ', 劇場: 'エンタメ',
  ライブハウス: 'エンタメ', ライブ会場: 'エンタメ', クラブ: 'エンタメ',
  レジャー施設: 'エンタメ',
  zoo: 'いきもの', 動物園: 'いきもの', aquarium: 'いきもの', 水族館: 'いきもの',
  temple: '寺社', 寺社: '寺社', 神社: '寺社',
  商店街: 'まち歩き', 商業施設: 'まち歩き', ファッションビル: 'まち歩き',
  百貨店: 'まち歩き', 複合施設: 'まち歩き', 通り: 'まち歩き',
  エリア: 'まち歩き', 散歩: 'まち歩き', 飲み屋街: 'まち歩き',
  飲食街: 'まち歩き', 市場: 'まち歩き', 歓楽街: 'まち歩き',
  地下街: 'まち歩き', エスニックタウン: 'まち歩き', ショッピングビル: 'まち歩き',
  フードコート: 'まち歩き', グルメ: 'まち歩き',
  spa: 'リラックス', スパ: 'リラックス', 銭湯: 'リラックス',
  サウナ: 'リラックス', 温泉: 'リラックス', スーパー銭湯: 'リラックス',
  restaurant: 'グルメ', ランドマーク: 'ランドマーク', 展望施設: 'ランドマーク',
  展望台: 'ランドマーク', モニュメント: 'ランドマーク', イベント施設: 'ランドマーク',
  sports: 'スポーツ', スポーツ: 'スポーツ', スポーツ施設: 'スポーツ',
  路面電車: 'まち歩き',
};

function getCategoryGroup(cat: string | null): string {
  return CATEGORY_GROUP[cat ?? ''] ?? cat ?? 'その他';
}

export function getCategoryLabel(cat: string | null): string {
  return getCategoryGroup(cat);
}

// ══════════════════════════════════════════
// 検索パラメータ
// ══════════════════════════════════════════

export interface SpotSearchParams {
  availableTime: number;       // 遊べる合計時間（分）
  currentHour: number;         // 開始時刻の「時」 0-23
  currentMinute?: number;      // 開始時刻の「分」 0-59
  weather: '晴れ' | '曇り' | '雨' | '雪' | '風強め';
  style?: 'ゆっくり' | 'ほどほど' | 'アクティブ';
  locationType?: '屋内' | '屋外';
  mode: string;
  origin?: { lat: number; lng: number };
  walkRangeMinutes?: number;   // 「どのくらい歩ける？」（分）
  userId?: string;
  excludeSpotIds?: string[];
}

// ══════════════════════════════════════════
// ユーティリティ
// ══════════════════════════════════════════

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

/** 徒歩N分 → km に変換（80m/分 = 4.8km/h で計算） */
function walkMinToKm(minutes: number): number {
  return (minutes * 80) / 1000;
}

function isOpen(spot: DbSpot, hour: number, minute: number): boolean {
  if (spot.is_open_24h) return true;
  if (!spot.starttime || !spot.closetime) return true;
  try {
    const [sH, sM] = spot.starttime.split(':').map(Number);
    const [cH, cM] = spot.closetime.split(':').map(Number);
    const cur = hour * 60 + minute;
    const open = sH * 60 + sM;
    const close = cH * 60 + cM;
    if (close < open) return cur >= open || cur < close;
    return cur >= open && cur < close;
  } catch { return true; }
}

// ══════════════════════════════════════════
// スコアリング（個別スポットの品質評価）
// ══════════════════════════════════════════

interface ScoredSpot {
  spot: DbSpot;
  score: number;
  lat: number;
  lon: number;
  group: string;
}

function scoreSpot(spot: DbSpot, params: SpotSearchParams): ScoredSpot | null {
  if (!spot.name || !spot.lat || !spot.lon) return null;
  const lat = parseFloat(spot.lat);
  const lon = parseFloat(spot.lon);
  if (isNaN(lat) || isNaN(lon)) return null;

  let score = 1.0;
  const group = getCategoryGroup(spot.category);
  const stayMin = spot.estimated_stay_min ?? 30;
  const fame = spot.famousLevel ?? 1;

  // 天気
  if (params.weather === '雨' || params.weather === '雪') {
    if (spot.indoor_type === 'outdoor') score *= 0.1;
    else if (spot.indoor_type === 'indoor') score *= 1.4;
    else if (spot.weather_ok?.includes('雨OK')) score *= 1.3;
  } else if (params.weather === '晴れ') {
    if (spot.indoor_type === 'outdoor' || spot.indoor_type === 'both') score *= 1.2;
  }

  // 1スポットあたりの時間に対して滞在時間が妥当か
  const estimatedSpots = Math.max(1, Math.floor(params.availableTime / 40));
  const perSpotTime = params.availableTime / estimatedSpots;
  if (stayMin > perSpotTime * 1.5) score *= 0.3;
  else if (stayMin > perSpotTime) score *= 0.7;

  // スタイル
  if (params.style === 'ゆっくり') {
    if (spot.stay_type === 'stay') score *= 1.3;
  } else if (params.style === 'アクティブ') {
    if (spot.stay_type === 'roam') score *= 1.3;
    if (spot.indoor_type === 'outdoor') score *= 1.1;
  }

  // モード
  if (params.mode === '定番') {
    score *= 0.8 + fame * 0.15;
  } else if (params.mode === '新規開拓') {
    if (fame <= 2) score *= 1.4;
    else if (fame >= 4) score *= 0.6;
  } else if (params.mode === '冒険') {
    if (['いきもの', 'エンタメ', 'カルチャー', 'リラックス'].includes(group)) score *= 1.3;
  }

  // タグ
  if (spot.tags) {
    const tags = spot.tags.toLowerCase().split(',').map(t => t.trim());
    if (params.style === 'ゆっくり' && tags.some(t => ['のんびり', 'リラックス', '静か'].includes(t))) score *= 1.15;
    if (params.mode === '新規開拓' && tags.some(t => ['穴場', '隠れ家', 'ローカル'].includes(t))) score *= 1.15;
  }

  // 価格
  if (spot.price_level) {
    const p: Record<string, number> = { free: 1.2, low: 1.1, medium: 1.0, high: 0.9, very_high: 0.7 };
    score *= p[spot.price_level] ?? 1.0;
  }

  return { spot, score, lat, lon, group };
}

// ══════════════════════════════════════════
// 近くて多様なスポット選択（逐次貪欲法）
//
// 1つ目を出発地近くから選び、次は「前のスポットの近く」で
// 「違うカテゴリ」のベストを選ぶ。
// → 一方向に進む自然なルートになる。
// ══════════════════════════════════════════

function selectDiverseSpots(
  candidates: ScoredSpot[],
  count: number,
  origin?: { lat: number; lng: number },
  maxInterSpotKm?: number,
): ScoredSpot[] {
  if (candidates.length === 0) return [];

  const selected: ScoredSpot[] = [];
  const usedGroups = new Set<string>();
  const usedIds = new Set<string>();

  // 1つ目: 出発地に近い上位から品質加重ランダム
  const withDist = candidates.map(c => ({
    ...c,
    distFromOrigin: origin ? distanceKm(origin.lat, origin.lng, c.lat, c.lon) : 0,
  }));
  withDist.sort((a, b) => a.distFromOrigin - b.distFromOrigin);
  const nearPool = withDist.slice(0, Math.max(15, Math.floor(withDist.length * 0.2)));
  const first = weightedRandomPick(nearPool);
  if (!first) return [];

  selected.push(first);
  usedGroups.add(first.group);
  usedIds.add(first.spot.source_id);

  // 2つ目以降: 「最後に選んだスポットからの近さ」で評価
  // → 重心ではなく「直前のスポット」から近い方向に進む = 一方向ルート
  while (selected.length < count) {
    const last = selected[selected.length - 1];
    let bestPick: ScoredSpot | null = null;
    let bestCombo = -1;

    for (const c of candidates) {
      if (usedIds.has(c.spot.source_id)) continue;

      // 直前スポットからの距離
      const d = distanceKm(last.lat, last.lon, c.lat, c.lon);

      // スポット間距離が歩ける範囲を超える場合はペナルティ
      let proximityScore: number;
      if (maxInterSpotKm && d > maxInterSpotKm) {
        proximityScore = 0.05; // 歩ける範囲外はほぼ除外
      } else {
        proximityScore = Math.max(0.1, Math.exp(-d * 1.5));
      }

      // カテゴリ多様性
      const diversityBonus = usedGroups.has(c.group) ? 0.15 : 1.0;

      const combo = c.score * proximityScore * diversityBonus;
      if (combo > bestCombo) {
        bestCombo = combo;
        bestPick = c;
      }
    }

    if (!bestPick) break;
    selected.push(bestPick);
    usedGroups.add(bestPick.group);
    usedIds.add(bestPick.spot.source_id);
  }

  return selected;
}

function weightedRandomPick(pool: ScoredSpot[]): ScoredSpot | null {
  if (pool.length === 0) return null;
  const total = pool.reduce((s, c) => s + c.score, 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= c.score;
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

// ══════════════════════════════════════════
// ルート最適化（全順列探索）
// 4スポットなら 4!=24通りしかないので全探索で最短ルートを出す
// ══════════════════════════════════════════

function optimizeRoute(
  spots: ScoredSpot[],
  origin?: { lat: number; lng: number },
): ScoredSpot[] {
  if (spots.length <= 2) {
    // 2個以下ならorigin近い順で十分
    if (origin) {
      return [...spots].sort(
        (a, b) => distanceKm(origin.lat, origin.lng, a.lat, a.lon)
                - distanceKm(origin.lat, origin.lng, b.lat, b.lon)
      );
    }
    return spots;
  }

  // 全順列を生成して最短ルートを見つける
  const indices = spots.map((_, i) => i);
  const perms = permutations(indices);

  let bestOrder = indices;
  let bestDist = Infinity;

  const startLat = origin?.lat ?? spots[0].lat;
  const startLon = origin?.lng ?? spots[0].lon;

  for (const perm of perms) {
    let totalDist = distanceKm(startLat, startLon, spots[perm[0]].lat, spots[perm[0]].lon);
    for (let i = 1; i < perm.length; i++) {
      totalDist += distanceKm(
        spots[perm[i - 1]].lat, spots[perm[i - 1]].lon,
        spots[perm[i]].lat, spots[perm[i]].lon,
      );
    }
    if (totalDist < bestDist) {
      bestDist = totalDist;
      bestOrder = perm;
    }
  }

  return bestOrder.map(i => spots[i]);
}

function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

// ══════════════════════════════════════════
// メイン検索
// ══════════════════════════════════════════

export async function searchSpotsFromDB(
  params: SpotSearchParams,
): Promise<PlanSpot[]> {
  let visitedIds: string[] = [];
  if (params.userId) {
    try {
      const { data } = await supabase
        .from('visited_spots')
        .select('spot_source_id')
        .eq('user_id', params.userId);
      if (data) visitedIds = data.map(v => v.spot_source_id);
    } catch { /* skip */ }
  }

  let query = supabase.from('spot').select('*').eq('isActive', true);

  if (params.locationType === '屋内') {
    query = query.in('indoor_type', ['indoor', 'both']);
  } else if (params.locationType === '屋外') {
    query = query.in('indoor_type', ['outdoor', 'both']);
  }

  // バウンディングボックス: walkRangeMinutesベースの範囲
  if (params.origin) {
    const walkKm = walkMinToKm(params.walkRangeMinutes ?? 30) * 1.3;
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
    const { data: fallback } = await supabase
      .from('spot').select('*').eq('isActive', true).limit(300);
    if (!fallback || fallback.length === 0) return [];
    return buildPlan(fallback as DbSpot[], params, visitedIds);
  }

  return buildPlan(data as DbSpot[], params, visitedIds);
}

// ══════════════════════════════════════════
// プラン組み立て
//
// availableTime から逆算してスポット数を決め、
// 合計時間（滞在＋移動）が収まるプランを生成する。
// ══════════════════════════════════════════

function buildPlan(
  rawSpots: DbSpot[],
  params: SpotSearchParams,
  visitedIds: string[],
): PlanSpot[] {
  const minute = params.currentMinute ?? 0;
  const availableTime = params.availableTime;

  const excludeSet = new Set([
    ...(params.excludeSpotIds ?? []),
    ...visitedIds,
  ]);

  // スコアリング
  const candidates: ScoredSpot[] = [];
  for (const spot of rawSpots) {
    if (excludeSet.has(spot.source_id)) continue;
    if (!isOpen(spot, params.currentHour, minute)) continue;
    const scored = scoreSpot(spot, params);
    if (scored) candidates.push(scored);
  }
  if (candidates.length === 0) return [];

  // スポット間の最大歩行距離
  const maxInterSpotKm = params.walkRangeMinutes
    ? walkMinToKm(params.walkRangeMinutes) * 0.5
    : undefined;

  // availableTime からスポット数を決定
  // 1スポット平均40分滞在 + 10分移動 = 50分/スポットとして概算
  const maxSpots = Math.max(1, Math.min(6, Math.floor(availableTime / 40)));

  // 多めに候補を選択して、時間に収まる分だけ採用する
  const poolCount = Math.min(maxSpots + 2, 6);
  const selected = selectDiverseSpots(candidates, poolCount, params.origin, maxInterSpotKm);

  // ルート最適化
  const routed = optimizeRoute(selected, params.origin);

  // タイムテーブルを生成しながら、availableTime に収まる分だけ採用
  const startMinute = Math.ceil(minute / 15) * 15;
  const baseDate = new Date();
  baseDate.setHours(params.currentHour, startMinute, 0, 0);
  const startTime = baseDate.getTime();
  let currentTime = startTime;
  const deadline = startTime + availableTime * 60 * 1000;

  const result: PlanSpot[] = [];

  for (let i = 0; i < routed.length; i++) {
    const item = routed[i];
    const stayMin = item.spot.estimated_stay_min ?? 30;

    // 移動時間（出発地 or 前のスポットからの徒歩）
    if (i === 0 && params.origin) {
      const walkDist = distanceKm(params.origin.lat, params.origin.lng, item.lat, item.lon);
      const walkMin = Math.max(3, Math.ceil((walkDist * 1000) / 80));
      currentTime += walkMin * 60 * 1000;
    } else if (i > 0) {
      const prev = routed[i - 1];
      const walkDist = distanceKm(prev.lat, prev.lon, item.lat, item.lon);
      const walkMin = Math.max(3, Math.ceil((walkDist * 1000) / 80));
      currentTime += walkMin * 60 * 1000;
    }

    // このスポットの滞在が終わる時刻
    const endTime = currentTime + stayMin * 60 * 1000;

    // 時間オーバーなら打ち切り（ただし最低1スポットは入れる）
    if (result.length >= 1 && endTime > deadline) break;

    const spotTime = new Date(currentTime);
    currentTime = endTime;

    result.push({
      id: item.spot.source_id,
      name: item.spot.name!,
      category: getCategoryGroup(item.spot.category),
      description: item.spot.detail ?? '',
      time: spotTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      duration: stayMin,
      lat: item.lat,
      lng: item.lon,
    });
  }

  return result;
}
