import { supabase } from './supabase';
import type { DbSpot, PlanSpot } from '@/hooks/useNowgoStore';

// ══════════════════════════════════════════
// カテゴリ正規化
// ══════════════════════════════════════════

// DB category → 表示用グループ名
const CATEGORY_GROUP: Record<string, string> = {
  cafe:          'カフェ',
  bar:           'バー',
  clothes:       'ファッション',
  zakka:         '雑貨',
  shopping:      'ショッピング',
  museum:        'ミュージアム',
  gallery:       'ギャラリー',
  garden:        '自然',
  park:          '自然',
  amusement:     'エンタメ',
  entertainment: 'エンタメ',
  zoo:           'いきもの',
  aquarium:      'いきもの',
  temple:        '寺社',
  town:          'まち歩き',
  spa:           'リラックス',
  restaurant:    'グルメ',
  landmark:      'ランドマーク',
  sports:        'スポーツ',
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
  walkRangeMinutes?: number;   // 「どのくらい歩ける？」合計歩行時間（分）
  userId?: string;
  excludeSpotIds?: string[];
  /** ピン留めされたスポット（再作成時に引き継ぐ） */
  pinnedSpots?: PlanSpot[];
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
// ビル・施設名パース
// 住所パターン: 「東京都○○区△△1-2-3 ○○ビル3F」
// 番地の後のスペース以降がビル名（フロア部分を除去）
// ══════════════════════════════════════════

const FLOOR_RE = /\s*[B]?\d+[F階].*$/i;
const BUILDING_RE = /\d[-−]\d+\s+(.+)$/;
const AREA_SUFFIX_RE = /丁目付近$/;

function parseBuildingName(address: string | null): string | undefined {
  if (!address) return undefined;
  // 「丁目付近」はエリア名であって施設名ではない
  if (AREA_SUFFIX_RE.test(address)) return undefined;

  const match = address.match(BUILDING_RE);
  if (!match) return undefined;

  // フロア情報を除去してビル名だけ残す
  let building = match[1].replace(FLOOR_RE, '').trim();
  if (!building || building.length < 2) return undefined;
  return building;
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
  building?: string;
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
  // （滞在時間は後でキャップされるので軽いペナルティのみ）
  const estimatedSpots = Math.max(2, Math.round(params.availableTime / 35));
  const perSpotTime = params.availableTime / estimatedSpots;
  if (stayMin > perSpotTime * 2) score *= 0.5;
  else if (stayMin > perSpotTime * 1.5) score *= 0.8;

  // スタイル（stay_type: 'stay' | 'roam' | 'short'）
  if (params.style === 'ゆっくり') {
    if (spot.stay_type === 'stay') score *= 1.3;
    else if (spot.stay_type === 'short') score *= 0.8;
  } else if (params.style === 'アクティブ') {
    if (spot.stay_type === 'roam') score *= 1.3;
    else if (spot.stay_type === 'short') score *= 1.2;
    if (spot.indoor_type === 'outdoor') score *= 1.1;
  } else if (params.style === 'ほどほど') {
    if (spot.stay_type === 'short') score *= 1.1;
  }

  // モード & scope（big=商業ビル・エリア, medium=中規模施設, small=個別スポット）
  const scope = spot.scope;
  if (params.mode === '定番') {
    score *= 0.8 + fame * 0.15;
  } else if (params.mode === '新規開拓') {
    // 超有名スポットは除外（新たな出会いが目的）
    if (fame >= 5) return null;
    if (fame <= 2) score *= 1.4;
    else if (fame === 4) score *= 0.4;
    // ビル・エリア・通り・ランドマーク系は完全除外
    if (scope === 'big') return null;
    if (spot.category === 'landmark' || spot.category === 'town') return null;
    if (scope === 'medium') score *= 0.5;
  } else if (params.mode === '冒険') {
    if (fame >= 5) return null;
    if (['いきもの', 'エンタメ', 'リラックス', 'ミュージアム'].includes(group)) score *= 1.3;
    // ビル・エリア・通り・ランドマーク系は完全除外
    if (scope === 'big') return null;
    if (spot.category === 'landmark' || spot.category === 'town') return null;
    if (scope === 'medium') score *= 0.5;
  }

  // タグ
  if (spot.tags) {
    const tags = spot.tags.toLowerCase().split(',').map(t => t.trim());
    if (params.style === 'ゆっくり' && tags.some(t => ['のんびり', 'リラックス', '静か'].includes(t))) score *= 1.15;
    if (params.mode === '新規開拓' && tags.some(t => ['穴場', '隠れ家', 'ローカル'].includes(t))) score *= 1.15;
  }

  // 価格
  if (spot.price_level) {
    const p: Record<string, number> = { free: 1.2, low: 1.1, medium: 1.0, high: 0.9 };
    score *= p[spot.price_level] ?? 1.0;
  }

  // カテゴリ別の時間帯適性
  // バーは夕方以降が適切、カフェ・レストランは時間帯による軽い補正
  const hour = params.currentHour;
  if (spot.category === 'bar') {
    if (hour < 17) score *= 0.05;       // 17時前のバーはほぼ除外
    else if (hour >= 20) score *= 1.4;   // 20時以降はブースト
    else score *= 1.0;                   // 17-19時は通常
  } else if (spot.category === 'cafe') {
    if (hour >= 22) score *= 0.5;        // 深夜のカフェは下げる
  } else if (spot.category === 'restaurant') {
    // ランチ(11-14)・ディナー(17-21)は軽いブースト
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) score *= 1.1;
  }

  const building = parseBuildingName(spot.address);
  return { spot, score, lat, lon, group, building };
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
): ScoredSpot[] {
  if (candidates.length === 0) return [];

  const selected: ScoredSpot[] = [];
  const usedGroups = new Set<string>();
  const usedIds = new Set<string>();

  // 1つ目: 全候補から均等ランダム（バウンディングボックスで既にエリア絞り済み）
  const first = candidates[Math.floor(Math.random() * candidates.length)];
  if (!first) return [];

  selected.push(first);
  usedGroups.add(first.group);
  usedIds.add(first.spot.source_id);

  // 2つ目以降: 直前スポットから近い候補を重み付きランダムで選択
  // → proximityScore で近い方が有利だが、ハード制限はなし（ルート最適化で並び替え）
  while (selected.length < count) {
    const last = selected[selected.length - 1];
    const pool: ScoredSpot[] = [];
    const weights: number[] = [];

    for (const c of candidates) {
      if (usedIds.has(c.spot.source_id)) continue;

      const d = distanceKm(last.lat, last.lon, c.lat, c.lon);
      // 緩やかな距離減衰（1km≈0.5, 1.5km≈0.35 — 歩ける範囲なら十分候補に入る）
      const proximityScore = Math.max(0.1, Math.exp(-d * 0.7));
      // カテゴリ被りは強くペナルティ → 多様なプランになる
      const diversityBonus = usedGroups.has(c.group) ? 0.05 : 1.0;
      // スコアは sqrt で平坦化（ランダム性を上げつつ最低品質は保つ）
      const combo = Math.sqrt(c.score) * proximityScore * diversityBonus;

      pool.push(c);
      weights.push(combo);
    }

    if (pool.length === 0) break;
    const pick = weightedRandomPickFromPool(pool, weights);
    if (!pick) break;
    selected.push(pick);
    usedGroups.add(pick.group);
    usedIds.add(pick.spot.source_id);
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

function weightedRandomPickFromPool(pool: ScoredSpot[], weights: number[]): ScoredSpot | null {
  if (pool.length === 0) return null;
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// ══════════════════════════════════════════
// ルート最適化（全順列探索 + 同一ビルグルーピング）
// 同じビル内のスポットは必ず連続配置し、距離0として扱う
// ══════════════════════════════════════════

function optimizeRoute(
  spots: ScoredSpot[],
  origin?: { lat: number; lng: number },
): ScoredSpot[] {
  if (spots.length <= 1) return spots;

  // 同一ビルのスポットをグループ化
  // building が一致するスポットは1つの「グループ」として扱う
  const buildingGroups = new Map<string, number[]>();
  const soloIndices: number[] = [];

  spots.forEach((s, i) => {
    if (s.building) {
      const existing = buildingGroups.get(s.building);
      if (existing) {
        existing.push(i);
      } else {
        buildingGroups.set(s.building, [i]);
      }
    } else {
      soloIndices.push(i);
    }
  });

  // グループ化: 同一ビルは1つの代表ノードにまとめる
  interface RouteNode {
    spotIndices: number[];   // このノードに含まれるスポットのindices
    lat: number;
    lon: number;
  }

  const nodes: RouteNode[] = [];
  buildingGroups.forEach((indices) => {
    if (indices.length >= 2) {
      // 同一ビル: 1ノードにまとめる
      nodes.push({
        spotIndices: indices,
        lat: spots[indices[0]].lat,
        lon: spots[indices[0]].lon,
      });
    } else {
      // 1スポットだけならソロ扱い
      soloIndices.push(indices[0]);
    }
  });
  for (const i of soloIndices) {
    nodes.push({ spotIndices: [i], lat: spots[i].lat, lon: spots[i].lon });
  }

  if (nodes.length <= 1) {
    // 全スポットが同一ビルか1ノードしかない
    return nodes.flatMap(n => n.spotIndices.map(i => spots[i]));
  }

  // ノード間で全順列探索
  const nodeIndices = nodes.map((_, i) => i);
  const perms = permutations(nodeIndices);

  let bestOrder = nodeIndices;
  let bestDist = Infinity;

  const startLat = origin?.lat ?? nodes[0].lat;
  const startLon = origin?.lng ?? nodes[0].lon;

  for (const perm of perms) {
    let totalDist = distanceKm(startLat, startLon, nodes[perm[0]].lat, nodes[perm[0]].lon);
    for (let i = 1; i < perm.length; i++) {
      totalDist += distanceKm(
        nodes[perm[i - 1]].lat, nodes[perm[i - 1]].lon,
        nodes[perm[i]].lat, nodes[perm[i]].lon,
      );
    }
    // 方向転換ペナルティ: 連続するセグメント間の角度変化が大きい場合にコスト加算
    // → 行ったり来たりするルートを回避
    if (perm.length >= 3) {
      for (let i = 1; i < perm.length - 1; i++) {
        const prevLat = i === 1 ? startLat : nodes[perm[i - 2]].lat;
        const prevLon = i === 1 ? startLon : nodes[perm[i - 2]].lon;
        const curLat = nodes[perm[i - 1]].lat;
        const curLon = nodes[perm[i - 1]].lon;
        const nextLat = nodes[perm[i]].lat;
        const nextLon = nodes[perm[i]].lon;

        const angle1 = Math.atan2(curLat - prevLat, curLon - prevLon);
        const angle2 = Math.atan2(nextLat - curLat, nextLon - curLon);
        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        // 90度以上の方向転換にペナルティ（戻りに近いほど重い）
        if (angleDiff > Math.PI * 0.5) {
          totalDist *= 1 + (angleDiff / Math.PI) * 0.3;
        }
      }
    }
    if (totalDist < bestDist) {
      bestDist = totalDist;
      bestOrder = perm;
    }
  }

  // 最適順にフラット化（同一ビルスポットは連続で出る）
  const ordered = bestOrder.flatMap(ni => nodes[ni].spotIndices.map(i => spots[i]));

  // 同カテゴリ連続を解消（隣接するスポットが同カテゴリなら後方の非同カテゴリとスワップ）
  for (let i = 0; i < ordered.length - 1; i++) {
    if (ordered[i].group === ordered[i + 1].group) {
      // i+2以降で異なるカテゴリを探してスワップ
      for (let j = i + 2; j < ordered.length; j++) {
        if (ordered[j].group !== ordered[i].group) {
          [ordered[i + 1], ordered[j]] = [ordered[j], ordered[i + 1]];
          break;
        }
      }
    }
  }

  return ordered;
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
// スポットキャッシュ（同一エリアの再検索を高速化）
// キー: バウンディングボックス + locationType（丸め座標）
// TTL: 10分
// ══════════════════════════════════════════

interface SpotCacheEntry {
  data: DbSpot[];
  timestamp: number;
}

const spotCache = new Map<string, SpotCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10分

function buildCacheKey(params: SpotSearchParams): string {
  // 座標を小数3桁で丸めてキー化（約100m範囲の同一視）
  const latKey = params.origin ? (Math.round(params.origin.lat * 1000) / 1000).toFixed(3) : 'none';
  const lngKey = params.origin ? (Math.round(params.origin.lng * 1000) / 1000).toFixed(3) : 'none';
  const walk = params.walkRangeMinutes ?? 20;
  const loc = params.locationType ?? 'both';
  return `${latKey},${lngKey},${walk},${loc}`;
}

function getCachedSpots(key: string): DbSpot[] | null {
  const entry = spotCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    spotCache.delete(key);
    return null;
  }
  return entry.data;
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

  // キャッシュ確認
  const cacheKey = buildCacheKey(params);
  const cached = getCachedSpots(cacheKey);

  let spots: DbSpot[];
  if (cached) {
    spots = cached;
  } else {
    let query = supabase.from('spot').select('*').eq('isActive', true);

    if (params.locationType === '屋内') {
      query = query.in('indoor_type', ['indoor', 'both']);
    } else if (params.locationType === '屋外') {
      query = query.in('indoor_type', ['outdoor', 'both']);
    }

    // バウンディングボックス: 合計歩行時間の範囲内でスポットを探す
    // 一方向に歩くケースを想定し、walkRangeMinutes 分の距離を半径とする
    if (params.origin) {
      const walkKm = walkMinToKm(params.walkRangeMinutes ?? 20);
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
      spots = fallback as DbSpot[];
    } else {
      spots = data as DbSpot[];
    }

    // キャッシュ保存
    spotCache.set(cacheKey, { data: spots, timestamp: Date.now() });
  }

  return buildPlan(spots, params, visitedIds);
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
  const pinned = params.pinnedSpots ?? [];
  const pinnedIds = new Set(pinned.map(s => s.id));

  const excludeSet = new Set([
    ...(params.excludeSpotIds ?? []),
    ...visitedIds,
  ]);

  // ピン留めスポットを ScoredSpot に変換（ルート最適化で一緒に扱うため）
  const pinnedScored: ScoredSpot[] = pinned.map(p => ({
    spot: {
      source_id: p.id,
      name: p.name,
      detail: p.description,
      category: p.category,
      lat: String(p.lat),
      lon: String(p.lng),
      address: p.address ?? null,
      website: p.website ?? null,
      estimated_stay_min: p.duration,
      // 残りは null
      source: null, cuisine: null, isActive: true,
      starttime: null, closetime: null, is_open_24h: null,
      indoor_type: null, weather_ok: null, famousLevel: null,
      stay_type: null, tags: null, price_level: null,
      popularity_hint: null, scope: null, created_at: '', updated_at: null,
      last_verified_at: null, isInbound: null,
    } as DbSpot,
    score: 10, // ピン留めは最高スコア
    lat: p.lat,
    lon: p.lng,
    group: p.category,
    building: p.building,
  }));

  // スコアリング（新規候補のみ）
  const candidates: ScoredSpot[] = [];
  for (const spot of rawSpots) {
    if (excludeSet.has(spot.source_id)) continue;
    if (pinnedIds.has(spot.source_id)) continue; // ピン留め済みは除外
    if (!isOpen(spot, params.currentHour, minute)) continue;
    const scored = scoreSpot(spot, params);
    if (scored) candidates.push(scored);
  }

  // availableTime からスポット数の目安を決定
  const targetSpots = Math.max(2, Math.min(6, Math.round(availableTime / 35)));

  // ピン留め分を差し引いた残り枠を新規スポットで埋める
  const newSpotsNeeded = Math.max(1, targetSpots - pinned.length);
  const poolCount = Math.min(newSpotsNeeded + 2, 8);
  const newSelected = candidates.length > 0
    ? selectDiverseSpots(candidates, poolCount, params.origin)
    : [];

  // ピン留め + 新規を合わせてルート最適化
  const allSpots = [...pinnedScored, ...newSelected];
  if (allSpots.length === 0) return [];

  const routed = optimizeRoute(allSpots, params.origin);

  // タイムテーブルを生成しながら、availableTime に収まる分だけ採用
  const startMinute = Math.ceil(minute / 15) * 15;
  const baseDate = new Date();
  baseDate.setHours(params.currentHour, startMinute, 0, 0);
  const startTime = baseDate.getTime();
  let currentTime = startTime;
  // 10%のオーバーは許容（ぴったりで切るとスカスカになる）
  const deadline = startTime + availableTime * 1.1 * 60 * 1000;

  const result: PlanSpot[] = [];

  for (let i = 0; i < routed.length; i++) {
    const item = routed[i];
    const isPinned = pinnedIds.has(item.spot.source_id);
    // 滞在時間: DBの estimated_stay_min をそのまま使用
    const stayMin = item.spot.estimated_stay_min ?? 30;

    // 移動時間（出発地 or 前のスポットからの徒歩）
    // 同一ビル内なら移動時間0
    const sameBuilding = i > 0
      && item.building
      && routed[i - 1].building
      && item.building === routed[i - 1].building;

    let walkMin = 0;
    if (sameBuilding) {
      // 同じビル内 → 移動時間なし
    } else if (i === 0 && params.origin) {
      const walkDist = distanceKm(params.origin.lat, params.origin.lng, item.lat, item.lon);
      walkMin = Math.max(3, Math.ceil((walkDist * 1000) / 80));
    } else if (i > 0) {
      const prev = routed[i - 1];
      const walkDist = distanceKm(prev.lat, prev.lon, item.lat, item.lon);
      walkMin = Math.max(3, Math.ceil((walkDist * 1000) / 80));
    }

    // ピン留めスポットは必ず含める。新規は時間オーバーなら打ち切り
    if (!isPinned) {
      const endTimeCheck = currentTime + walkMin * 60 * 1000 + stayMin * 60 * 1000;
      if (result.length >= 2 && endTimeCheck > deadline) break;
    }
    currentTime += walkMin * 60 * 1000;

    // このスポットの滞在が終わる時刻
    const endTime = currentTime + stayMin * 60 * 1000;

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
      website: item.spot.website || undefined,
      address: item.spot.address || undefined,
      building: item.building,
    });
  }

  return result;
}

// ══════════════════════════════════════════
// テスト用エクスポート（本番ビルドでは使用しない）
// ══════════════════════════════════════════
export const __test__ = {
  getCategoryGroup,
  distanceKm,
  walkMinToKm,
  isOpen,
  parseBuildingName,
  scoreSpot,
  selectDiverseSpots,
  optimizeRoute,
  buildCacheKey,
  getCachedSpots,
  buildPlan,
  spotCache,
  CACHE_TTL_MS,
  permutations,
};
