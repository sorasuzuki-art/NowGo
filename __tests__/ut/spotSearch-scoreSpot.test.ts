/**
 * scoreSpot() 単体テスト
 *
 * 各スコアリング要素を独立にテストするため、
 * 他の要素をニュートラル（乗数 1.0）になるよう設定する。
 *
 * ニュートラル条件:
 *   weather='曇り'         → 天気補正なし
 *   style='ほどほど'        → stay_type='stay' で変化なし
 *   mode='定番', fame=1    → 0.8 + 1*0.15 = 0.95
 *   category='cafe', hour=14 → カテゴリ時間帯補正なし (hour < 22)
 *   price_level='medium'   → ×1.0
 *   tags=null              → タグボーナスなし
 *   stayMin=30, availableTime=120 → perSpotTime=40, 30<=60 → 滞在補正なし
 *   indoor_type='indoor'   → 天気ニュートラル時に影響なし
 *   stay_type='stay'       → ほどほどで影響なし
 *
 * ニュートラルベーススコア = 1.0 * 0.95 * 1.0 = 0.95
 */

import { describe, it, expect, vi } from 'vitest';
import { __test__, SpotSearchParams } from '@/lib/spotSearch';
import type { DbSpot } from '@/hooks/useNowgoStore';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }),
  },
}));

const { scoreSpot } = __test__;

// ──────────────────────────────────────────
// フィクスチャ
// ──────────────────────────────────────────

const BASE_SPOT: DbSpot = {
  source_id: 'test-spot-001',
  name: 'テストスポット',
  detail: 'テスト用の説明文',
  source: 'test',
  category: 'cafe',
  cuisine: null,
  lat: '35.6812',
  lon: '139.7671',
  address: '東京都渋谷区神宮前1-2-3 テストビル',
  website: 'https://example.com',
  isActive: true,
  starttime: '10:00',
  closetime: '20:00',
  is_open_24h: false,
  indoor_type: 'indoor',
  weather_ok: null,
  famousLevel: 3,
  stay_type: 'stay',
  estimated_stay_min: 30,
  tags: null,
  price_level: 'medium',
  popularity_hint: null,
  scope: 'small',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: null,
  last_verified_at: null,
  isInbound: null,
};

const BASE_PARAMS: SpotSearchParams = {
  availableTime: 120,
  currentHour: 14,
  currentMinute: 0,
  weather: '晴れ',
  style: 'ほどほど',
  locationType: undefined,
  mode: '定番',
  origin: { lat: 35.6812, lng: 139.7671 },
  walkRangeMinutes: 20,
  userId: undefined,
  excludeSpotIds: [],
  pinnedSpots: [],
};

/**
 * 他の補正をニュートラルにしたスポット/パラムを作成するヘルパー。
 * ニュートラルベーススコア = 0.95（定番 + fame=1）
 */
function neutralSpot(overrides: Partial<DbSpot> = {}): DbSpot {
  return {
    ...BASE_SPOT,
    famousLevel: 1,
    indoor_type: 'indoor',
    stay_type: 'stay',
    category: 'cafe',
    price_level: 'medium',
    tags: null,
    scope: 'small',
    ...overrides,
  };
}

function neutralParams(overrides: Partial<SpotSearchParams> = {}): SpotSearchParams {
  return {
    ...BASE_PARAMS,
    weather: '曇り',
    style: 'ほどほど',
    mode: '定番',
    currentHour: 14,
    ...overrides,
  };
}

/** ニュートラル条件でのベーススコア: 定番 + fame=1 → 0.8 + 0.15 = 0.95 */
const NEUTRAL_BASE = 0.95;

// ══════════════════════════════════════════
// 1. 除外条件
// ══════════════════════════════════════════

describe('除外条件', () => {
  // UT-SCR-001
  it('name=null → null を返す', () => {
    const spot = { ...BASE_SPOT, name: null };
    expect(scoreSpot(spot, BASE_PARAMS)).toBeNull();
  });

  // UT-SCR-002
  it('lat=null → null を返す', () => {
    const spot = { ...BASE_SPOT, lat: null };
    expect(scoreSpot(spot, BASE_PARAMS)).toBeNull();
  });

  // UT-SCR-003
  it('lon=null → null を返す', () => {
    const spot = { ...BASE_SPOT, lon: null };
    expect(scoreSpot(spot, BASE_PARAMS)).toBeNull();
  });

  // UT-SCR-004
  it("name='' (空文字 → falsy) → null を返す", () => {
    const spot = { ...BASE_SPOT, name: '' };
    expect(scoreSpot(spot, BASE_PARAMS)).toBeNull();
  });

  // UT-SCR-005
  it("lat='abc' (NaN) → null を返す", () => {
    const spot = { ...BASE_SPOT, lat: 'abc' };
    expect(scoreSpot(spot, BASE_PARAMS)).toBeNull();
  });

  // UT-SCR-006
  it("lon='abc' (NaN) → null を返す", () => {
    const spot = { ...BASE_SPOT, lon: 'abc' };
    expect(scoreSpot(spot, BASE_PARAMS)).toBeNull();
  });

  // UT-SCR-007
  it('全てのフィールドが有効 → not null, score > 0', () => {
    const result = scoreSpot(BASE_SPOT, BASE_PARAMS);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════
// 2. 天気補正
// ══════════════════════════════════════════

describe('天気補正', () => {
  // UT-SCR-W-001: 雨 + outdoor → ×0.1
  it('雨 + outdoor → score *= 0.1', () => {
    const spot = neutralSpot({ indoor_type: 'outdoor' });
    const params = neutralParams({ weather: '雨' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.1, 5);
  });

  // UT-SCR-W-002: 雨 + indoor → ×1.4
  it('雨 + indoor → score *= 1.4', () => {
    const spot = neutralSpot({ indoor_type: 'indoor' });
    const params = neutralParams({ weather: '雨' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.4, 5);
  });

  // UT-SCR-W-003: 雨 + both + weather_ok includes '雨OK' → ×1.3
  it("雨 + both + weather_ok='雨OK' → score *= 1.3", () => {
    const spot = neutralSpot({ indoor_type: 'both', weather_ok: '雨OK' });
    const params = neutralParams({ weather: '雨' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.3, 5);
  });

  // UT-SCR-W-004: 雨 + both + no weather_ok → ×1.0
  it('雨 + both + weather_ok=null → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ indoor_type: 'both', weather_ok: null });
    const params = neutralParams({ weather: '雨' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-W-005: 雪 + outdoor → ×0.1 (雨と同じ)
  it('雪 + outdoor → score *= 0.1 (雨と同じ扱い)', () => {
    const spot = neutralSpot({ indoor_type: 'outdoor' });
    const params = neutralParams({ weather: '雪' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.1, 5);
  });

  // UT-SCR-W-006: 晴れ + outdoor → ×1.2
  it('晴れ + outdoor → score *= 1.2', () => {
    const spot = neutralSpot({ indoor_type: 'outdoor' });
    const params = neutralParams({ weather: '晴れ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.2, 5);
  });

  // UT-SCR-W-007: 晴れ + both → ×1.2
  it('晴れ + both → score *= 1.2', () => {
    const spot = neutralSpot({ indoor_type: 'both' });
    const params = neutralParams({ weather: '晴れ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.2, 5);
  });

  // UT-SCR-W-008: 晴れ + indoor → ×1.0
  it('晴れ + indoor → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ indoor_type: 'indoor' });
    const params = neutralParams({ weather: '晴れ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-W-009: 曇り → 変化なし
  it('曇り → score に天気補正なし', () => {
    const spot = neutralSpot({ indoor_type: 'outdoor' });
    const params = neutralParams({ weather: '曇り' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE, 5);
  });

  // UT-SCR-W-010: 曇り + indoor → 変化なし
  it('曇り + indoor → score に天気補正なし', () => {
    const spot = neutralSpot({ indoor_type: 'indoor' });
    const params = neutralParams({ weather: '曇り' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE, 5);
  });

  // UT-SCR-W-011: 風強め → 変化なし
  it('風強め → score に天気補正なし', () => {
    const spot = neutralSpot({ indoor_type: 'outdoor' });
    const params = neutralParams({ weather: '風強め' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE, 5);
  });

  // UT-SCR-W-012: 風強め + indoor → 変化なし
  it('風強め + indoor → score に天気補正なし', () => {
    const spot = neutralSpot({ indoor_type: 'indoor' });
    const params = neutralParams({ weather: '風強め' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE, 5);
  });
});

// ══════════════════════════════════════════
// 3. スタイル補正
// ══════════════════════════════════════════

describe('スタイル補正', () => {
  // UT-SCR-S-001: ゆっくり + stay → ×1.3
  it('ゆっくり + stay → score *= 1.3', () => {
    const spot = neutralSpot({ stay_type: 'stay' });
    const params = neutralParams({ style: 'ゆっくり' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.3, 5);
  });

  // UT-SCR-S-002: ゆっくり + short → ×0.8
  it('ゆっくり + short → score *= 0.8', () => {
    const spot = neutralSpot({ stay_type: 'short' });
    const params = neutralParams({ style: 'ゆっくり' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.8, 5);
  });

  // UT-SCR-S-003: ゆっくり + roam → ×1.0 (変化なし)
  it('ゆっくり + roam → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ stay_type: 'roam' });
    const params = neutralParams({ style: 'ゆっくり' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-S-004: アクティブ + roam → ×1.3
  it('アクティブ + roam → score *= 1.3', () => {
    const spot = neutralSpot({ stay_type: 'roam' });
    const params = neutralParams({ style: 'アクティブ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.3, 5);
  });

  // UT-SCR-S-005: アクティブ + short → ×1.2
  it('アクティブ + short → score *= 1.2', () => {
    const spot = neutralSpot({ stay_type: 'short' });
    const params = neutralParams({ style: 'アクティブ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.2, 5);
  });

  // UT-SCR-S-006: アクティブ + outdoor (indoor_type) → 追加 ×1.1
  it('アクティブ + stay + outdoor → 追加 score *= 1.1', () => {
    // stay_type='stay' でスタイル乗数は 1.0、outdoor で +1.1
    const spot = neutralSpot({ stay_type: 'stay', indoor_type: 'outdoor' });
    const params = neutralParams({ style: 'アクティブ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-S-007: アクティブ + roam + outdoor → ×1.3 * 1.1 = 1.43
  it('アクティブ + roam + outdoor → score *= 1.3 * 1.1', () => {
    const spot = neutralSpot({ stay_type: 'roam', indoor_type: 'outdoor' });
    const params = neutralParams({ style: 'アクティブ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.3 * 1.1, 5);
  });

  // UT-SCR-S-008: アクティブ + short + outdoor → ×1.2 * 1.1 = 1.32
  it('アクティブ + short + outdoor → score *= 1.2 * 1.1', () => {
    const spot = neutralSpot({ stay_type: 'short', indoor_type: 'outdoor' });
    const params = neutralParams({ style: 'アクティブ' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.2 * 1.1, 5);
  });

  // UT-SCR-S-009: ほどほど + short → ×1.1
  it('ほどほど + short → score *= 1.1', () => {
    const spot = neutralSpot({ stay_type: 'short' });
    const params = neutralParams({ style: 'ほどほど' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-S-010: ほどほど + stay → ×1.0 (変化なし)
  it('ほどほど + stay → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ stay_type: 'stay' });
    const params = neutralParams({ style: 'ほどほど' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });
});

// ══════════════════════════════════════════
// 4. モード補正
// ══════════════════════════════════════════

describe('モード補正', () => {
  /**
   * 定番モード: score *= 0.8 + fame * 0.15
   * ニュートラルスポットで mode/fame 以外は中立:
   *   weather=曇り, style=ほどほど, stay_type=stay, category=cafe, hour=14,
   *   price=medium, tags=null → 全て ×1.0
   * なのでスコア = 0.8 + fame * 0.15
   */

  // UT-SCR-M-001: 定番 + fame=1 → ×0.95
  it('定番 + famousLevel=1 → score = 0.95', () => {
    const spot = neutralSpot({ famousLevel: 1 });
    const params = neutralParams({ mode: '定番' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(0.8 + 1 * 0.15, 5);
  });

  // UT-SCR-M-002: 定番 + fame=3 → ×1.25
  it('定番 + famousLevel=3 → score = 1.25', () => {
    const spot = neutralSpot({ famousLevel: 3 });
    const params = neutralParams({ mode: '定番' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(0.8 + 3 * 0.15, 5);
  });

  // UT-SCR-M-003: 定番 + fame=5 → ×1.55
  it('定番 + famousLevel=5 → score = 1.55', () => {
    const spot = neutralSpot({ famousLevel: 5 });
    const params = neutralParams({ mode: '定番' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(0.8 + 5 * 0.15, 5);
  });

  /**
   * 新規開拓モード
   * ニュートラルベース（天気/スタイル/カテゴリ時間/価格/タグ/滞在 全て×1.0）
   * → スコア = 1.0 * modeMultiplier
   */

  // UT-SCR-M-004: 新規開拓 + fame>=5 → null (除外)
  it('新規開拓 + famousLevel=5 → null (除外)', () => {
    const spot = neutralSpot({ famousLevel: 5 });
    const params = neutralParams({ mode: '新規開拓' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-005: 新規開拓 + fame<=2 → ×1.4
  it('新規開拓 + famousLevel=2 → score *= 1.4', () => {
    const spot = neutralSpot({ famousLevel: 2 });
    const params = neutralParams({ mode: '新規開拓' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.4, 5);
  });

  // UT-SCR-M-006: 新規開拓 + fame=1 → ×1.4
  it('新規開拓 + famousLevel=1 → score *= 1.4', () => {
    const spot = neutralSpot({ famousLevel: 1 });
    const params = neutralParams({ mode: '新規開拓' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.4, 5);
  });

  // UT-SCR-M-007: 新規開拓 + fame=4 → ×0.4
  it('新規開拓 + famousLevel=4 → score *= 0.4', () => {
    const spot = neutralSpot({ famousLevel: 4 });
    const params = neutralParams({ mode: '新規開拓' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 0.4, 5);
  });

  // UT-SCR-M-008: 新規開拓 + scope='big' → null
  it("新規開拓 + scope='big' → null (除外)", () => {
    const spot = neutralSpot({ famousLevel: 1, scope: 'big' });
    const params = neutralParams({ mode: '新規開拓' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-009: 新規開拓 + category='landmark' → null
  it("新規開拓 + category='landmark' → null (除外)", () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'landmark' });
    const params = neutralParams({ mode: '新規開拓' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-010: 新規開拓 + category='town' → null
  it("新規開拓 + category='town' → null (除外)", () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'town' });
    const params = neutralParams({ mode: '新規開拓' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-011: 新規開拓 + scope='medium' → ×0.5
  it("新規開拓 + scope='medium' + fame=1 → score *= 1.4 * 0.5", () => {
    const spot = neutralSpot({ famousLevel: 1, scope: 'medium' });
    const params = neutralParams({ mode: '新規開拓' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.4 * 0.5, 5);
  });

  /**
   * 冒険モード
   */

  // UT-SCR-M-012: 冒険 + fame>=5 → null
  it('冒険 + famousLevel=5 → null (除外)', () => {
    const spot = neutralSpot({ famousLevel: 5 });
    const params = neutralParams({ mode: '冒険' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-013: 冒険 + scope='big' → null
  it("冒険 + scope='big' → null (除外)", () => {
    const spot = neutralSpot({ famousLevel: 1, scope: 'big' });
    const params = neutralParams({ mode: '冒険' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-014: 冒険 + category='landmark' → null
  it("冒険 + category='landmark' → null (除外)", () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'landmark' });
    const params = neutralParams({ mode: '冒険' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-015: 冒険 + category='town' → null
  it("冒険 + category='town' → null (除外)", () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'town' });
    const params = neutralParams({ mode: '冒険' });
    expect(scoreSpot(spot, params)).toBeNull();
  });

  // UT-SCR-M-016: 冒険 + group=いきもの (category=zoo) → ×1.3
  it('冒険 + category=zoo (group=いきもの) → score *= 1.3', () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'zoo' });
    const params = neutralParams({ mode: '冒険' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.3, 5);
  });

  // UT-SCR-M-017: 冒険 + group=エンタメ (category=amusement) → ×1.3
  it('冒険 + category=amusement (group=エンタメ) → score *= 1.3', () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'amusement' });
    const params = neutralParams({ mode: '冒険' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.3, 5);
  });

  // UT-SCR-M-018: 冒険 + group=リラックス (category=spa) → ×1.3
  it('冒険 + category=spa (group=リラックス) → score *= 1.3', () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'spa' });
    const params = neutralParams({ mode: '冒険' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.3, 5);
  });

  // UT-SCR-M-019: 冒険 + group=ミュージアム (category=museum) → ×1.3
  it('冒険 + category=museum (group=ミュージアム) → score *= 1.3', () => {
    const spot = neutralSpot({ famousLevel: 1, category: 'museum' });
    const params = neutralParams({ mode: '冒険' });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(1.0 * 1.3, 5);
  });

  // UT-SCR-M-020: 冒険 + scope='medium' → ×0.5
  it("冒険 + scope='medium' + fame=1 → score *= 0.5", () => {
    const spot = neutralSpot({ famousLevel: 1, scope: 'medium' });
    const params = neutralParams({ mode: '冒険' });
    const result = scoreSpot(spot, params)!;
    // category=cafe → group='カフェ' → 冒険ボーナスグループに含まれない → ×1.0
    // scope='medium' → ×0.5
    expect(result.score).toBeCloseTo(1.0 * 0.5, 5);
  });
});

// ══════════════════════════════════════════
// 5. カテゴリ別時間帯補正
// ══════════════════════════════════════════

describe('カテゴリ別時間帯補正', () => {
  /**
   * 時間帯テストではカテゴリと currentHour のみ変動させる。
   * 他はニュートラル（曇り, ほどほど, stay, fame=1 → base=0.95, price=medium）
   */

  // UT-SCR-T-001: bar + hour<17 → ×0.05
  it('bar + currentHour=14 → score *= 0.05', () => {
    const spot = neutralSpot({ category: 'bar' });
    const params = neutralParams({ currentHour: 14 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.05, 5);
  });

  // UT-SCR-T-002: bar + hour=10 → ×0.05
  it('bar + currentHour=10 → score *= 0.05', () => {
    const spot = neutralSpot({ category: 'bar' });
    const params = neutralParams({ currentHour: 10 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.05, 5);
  });

  // UT-SCR-T-003: bar + hour=17 → ×1.0
  it('bar + currentHour=17 → score *= 1.0', () => {
    const spot = neutralSpot({ category: 'bar' });
    const params = neutralParams({ currentHour: 17 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-T-004: bar + hour=19 → ×1.0
  it('bar + currentHour=19 → score *= 1.0', () => {
    const spot = neutralSpot({ category: 'bar' });
    const params = neutralParams({ currentHour: 19 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-T-005: bar + hour>=20 → ×1.4
  it('bar + currentHour=20 → score *= 1.4', () => {
    const spot = neutralSpot({ category: 'bar' });
    const params = neutralParams({ currentHour: 20 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.4, 5);
  });

  // UT-SCR-T-006: bar + hour=23 → ×1.4
  it('bar + currentHour=23 → score *= 1.4', () => {
    const spot = neutralSpot({ category: 'bar' });
    const params = neutralParams({ currentHour: 23 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.4, 5);
  });

  // UT-SCR-T-007: cafe + hour<22 → ×1.0
  it('cafe + currentHour=14 → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ category: 'cafe' });
    const params = neutralParams({ currentHour: 14 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-T-008: cafe + hour=21 → ×1.0
  it('cafe + currentHour=21 → score *= 1.0', () => {
    const spot = neutralSpot({ category: 'cafe' });
    const params = neutralParams({ currentHour: 21 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-T-009: cafe + hour>=22 → ×0.5
  it('cafe + currentHour=22 → score *= 0.5', () => {
    const spot = neutralSpot({ category: 'cafe' });
    const params = neutralParams({ currentHour: 22 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.5, 5);
  });

  // UT-SCR-T-010: cafe + hour=23 → ×0.5
  it('cafe + currentHour=23 → score *= 0.5', () => {
    const spot = neutralSpot({ category: 'cafe' });
    const params = neutralParams({ currentHour: 23 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.5, 5);
  });

  // UT-SCR-T-011: restaurant + hour 11 → ×1.1
  it('restaurant + currentHour=11 → score *= 1.1', () => {
    const spot = neutralSpot({ category: 'restaurant' });
    const params = neutralParams({ currentHour: 11 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-T-012: restaurant + hour=14 → ×1.1
  it('restaurant + currentHour=14 → score *= 1.1', () => {
    const spot = neutralSpot({ category: 'restaurant' });
    const params = neutralParams({ currentHour: 14 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-T-013: restaurant + hour=17 → ×1.1
  it('restaurant + currentHour=17 → score *= 1.1', () => {
    const spot = neutralSpot({ category: 'restaurant' });
    const params = neutralParams({ currentHour: 17 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-T-014: restaurant + hour=21 → ×1.1
  it('restaurant + currentHour=21 → score *= 1.1', () => {
    const spot = neutralSpot({ category: 'restaurant' });
    const params = neutralParams({ currentHour: 21 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-T-015: restaurant + hour=0 → ×1.0
  it('restaurant + currentHour=0 → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ category: 'restaurant' });
    const params = neutralParams({ currentHour: 0 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-T-016: restaurant + hour=10 → ×1.0
  it('restaurant + currentHour=10 → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ category: 'restaurant' });
    const params = neutralParams({ currentHour: 10 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });
});

// ══════════════════════════════════════════
// 6. タグボーナス
// ══════════════════════════════════════════

describe('タグボーナス', () => {
  /**
   * タグテストでは style/mode とタグのみ変動。
   * ニュートラルベース計算:
   *   - style=ゆっくり + stay → ×1.3 (スタイルボーナス込み)
   *   - mode=定番 + fame=1 → ×0.95
   *   → base = 0.95 * 1.3 = 1.235 (タグなし時)
   *
   * 新規開拓テスト:
   *   - mode=新規開拓 + fame=1 → ×1.4
   *   - style=ほどほど + stay → ×1.0
   *   → base = 1.4 (タグなし時)
   */

  // UT-SCR-TAG-001: ゆっくり + tags='のんびり,カフェ' → スタイルタグ ×1.15
  it("ゆっくり + tags='のんびり,カフェ' → score *= 1.15 (タグボーナス)", () => {
    const baseWithoutTag = neutralSpot({ stay_type: 'stay' });
    const baseWithTag = neutralSpot({ stay_type: 'stay', tags: 'のんびり,カフェ' });
    const params = neutralParams({ style: 'ゆっくり' });

    const resultWithout = scoreSpot(baseWithoutTag, params)!;
    const resultWith = scoreSpot(baseWithTag, params)!;

    // タグボーナスの比率を確認
    expect(resultWith.score / resultWithout.score).toBeCloseTo(1.15, 4);
  });

  // UT-SCR-TAG-002: ゆっくり + tags='リラックス' → ×1.15
  it("ゆっくり + tags='リラックス' → タグボーナス ×1.15", () => {
    const spotNoTag = neutralSpot({ stay_type: 'stay' });
    const spotWithTag = neutralSpot({ stay_type: 'stay', tags: 'リラックス' });
    const params = neutralParams({ style: 'ゆっくり' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score / withoutTag.score).toBeCloseTo(1.15, 4);
  });

  // UT-SCR-TAG-003: ゆっくり + tags='静か' → ×1.15
  it("ゆっくり + tags='静か' → タグボーナス ×1.15", () => {
    const spotNoTag = neutralSpot({ stay_type: 'stay' });
    const spotWithTag = neutralSpot({ stay_type: 'stay', tags: '静か' });
    const params = neutralParams({ style: 'ゆっくり' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score / withoutTag.score).toBeCloseTo(1.15, 4);
  });

  // UT-SCR-TAG-004: 新規開拓 + tags='穴場,自然' → モードタグ ×1.15
  it("新規開拓 + tags='穴場,自然' → タグボーナス ×1.15", () => {
    const spotNoTag = neutralSpot({ famousLevel: 1 });
    const spotWithTag = neutralSpot({ famousLevel: 1, tags: '穴場,自然' });
    const params = neutralParams({ mode: '新規開拓' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score / withoutTag.score).toBeCloseTo(1.15, 4);
  });

  // UT-SCR-TAG-005: 新規開拓 + tags='隠れ家' → ×1.15
  it("新規開拓 + tags='隠れ家' → タグボーナス ×1.15", () => {
    const spotNoTag = neutralSpot({ famousLevel: 1 });
    const spotWithTag = neutralSpot({ famousLevel: 1, tags: '隠れ家' });
    const params = neutralParams({ mode: '新規開拓' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score / withoutTag.score).toBeCloseTo(1.15, 4);
  });

  // UT-SCR-TAG-006: 新規開拓 + tags='ローカル' → ×1.15
  it("新規開拓 + tags='ローカル' → タグボーナス ×1.15", () => {
    const spotNoTag = neutralSpot({ famousLevel: 1 });
    const spotWithTag = neutralSpot({ famousLevel: 1, tags: 'ローカル' });
    const params = neutralParams({ mode: '新規開拓' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score / withoutTag.score).toBeCloseTo(1.15, 4);
  });

  // UT-SCR-TAG-007: 両方の条件が成立 → ×1.15 * 1.15 = 1.3225
  it('ゆっくり + 新規開拓 + tags に両方マッチ → ×1.15 * 1.15 = 1.3225', () => {
    // ゆっくり + 新規開拓 + tags='のんびり,穴場'
    // style=ゆっくり → stay_type=stay で ×1.3 のスタイル補正
    // mode=新規開拓 + fame=1 → ×1.4
    const spotNoTag = neutralSpot({ stay_type: 'stay', famousLevel: 1 });
    const spotBothTags = neutralSpot({
      stay_type: 'stay',
      famousLevel: 1,
      tags: 'のんびり,穴場',
    });
    const params = neutralParams({ style: 'ゆっくり', mode: '新規開拓' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withBothTags = scoreSpot(spotBothTags, params)!;

    expect(withBothTags.score / withoutTag.score).toBeCloseTo(1.15 * 1.15, 4);
  });

  // UT-SCR-TAG-008: tags=null → 変化なし
  it('tags=null → タグボーナスなし', () => {
    const spot = neutralSpot({ tags: null });
    const params = neutralParams({ style: 'ゆっくり' });
    // tags=null → タグブロック全体スキップ
    // ゆっくり + stay → ×1.3、定番 + fame=1 → ×0.95
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.3, 5);
  });

  // UT-SCR-TAG-009: tags='関係ないタグ' → 変化なし (マッチしない)
  it("tags='観光,ファミリー' → マッチしないのでボーナスなし", () => {
    const spotNoTag = neutralSpot({ stay_type: 'stay' });
    const spotWithTag = neutralSpot({ stay_type: 'stay', tags: '観光,ファミリー' });
    const params = neutralParams({ style: 'ゆっくり' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score).toBeCloseTo(withoutTag.score, 5);
  });

  // UT-SCR-TAG-010: 新規開拓でない + 穴場タグ → モードタグボーナスなし
  it("定番 + tags='穴場' → 新規開拓ボーナスなし", () => {
    const spotNoTag = neutralSpot({ famousLevel: 1 });
    const spotWithTag = neutralSpot({ famousLevel: 1, tags: '穴場' });
    const params = neutralParams({ mode: '定番' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score).toBeCloseTo(withoutTag.score, 5);
  });

  // UT-SCR-TAG-011: ゆっくりでない + のんびりタグ → スタイルタグボーナスなし
  it("アクティブ + tags='のんびり' → ゆっくりボーナスなし", () => {
    const spotNoTag = neutralSpot({ stay_type: 'stay' });
    const spotWithTag = neutralSpot({ stay_type: 'stay', tags: 'のんびり' });
    const params = neutralParams({ style: 'アクティブ' });

    const withoutTag = scoreSpot(spotNoTag, params)!;
    const withTag = scoreSpot(spotWithTag, params)!;

    expect(withTag.score).toBeCloseTo(withoutTag.score, 5);
  });
});

// ══════════════════════════════════════════
// 7. 価格帯補正
// ══════════════════════════════════════════

describe('価格帯補正', () => {
  // UT-SCR-P-001: free → ×1.2
  it('price_level=free → score *= 1.2', () => {
    const spot = neutralSpot({ price_level: 'free' });
    const params = neutralParams();
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.2, 5);
  });

  // UT-SCR-P-002: low → ×1.1
  it('price_level=low → score *= 1.1', () => {
    const spot = neutralSpot({ price_level: 'low' });
    const params = neutralParams();
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.1, 5);
  });

  // UT-SCR-P-003: medium → ×1.0
  it('price_level=medium → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ price_level: 'medium' });
    const params = neutralParams();
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-P-004: high → ×0.9
  it('price_level=high → score *= 0.9', () => {
    const spot = neutralSpot({ price_level: 'high' });
    const params = neutralParams();
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.9, 5);
  });

  // UT-SCR-P-005: null → ×1.0 (price_level ブロックスキップ)
  it('price_level=null → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ price_level: null });
    const params = neutralParams();
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-P-006: 不明な値 → ×1.0 (fallback)
  it("price_level='unknown' → score *= 1.0 (fallback)", () => {
    const spot = neutralSpot({ price_level: 'unknown' });
    const params = neutralParams();
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });
});

// ══════════════════════════════════════════
// 8. 滞在時間妥当性
// ══════════════════════════════════════════

describe('滞在時間妥当性', () => {
  /**
   * availableTime=120 → estimatedSpots = max(2, round(120/35)) = 3
   * perSpotTime = 120 / 3 = 40
   *
   * stayMin > perSpotTime * 2 (>80) → ×0.5
   * stayMin > perSpotTime * 1.5 (>60) → ×0.8
   * stayMin <= perSpotTime * 1.5 (<=60) → ×1.0
   */

  // UT-SCR-D-001: stayMin=90 > 80 → ×0.5
  it('estimated_stay_min=90 (> perSpotTime*2=80) → score *= 0.5', () => {
    const spot = neutralSpot({ estimated_stay_min: 90 });
    const params = neutralParams({ availableTime: 120 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.5, 5);
  });

  // UT-SCR-D-002: stayMin=70 > 60, <= 80 → ×0.8
  it('estimated_stay_min=70 (> perSpotTime*1.5=60, <= 80) → score *= 0.8', () => {
    const spot = neutralSpot({ estimated_stay_min: 70 });
    const params = neutralParams({ availableTime: 120 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 0.8, 5);
  });

  // UT-SCR-D-003: stayMin=30 <= 60 → ×1.0
  it('estimated_stay_min=30 (<= perSpotTime*1.5=60) → score *= 1.0 (変化なし)', () => {
    const spot = neutralSpot({ estimated_stay_min: 30 });
    const params = neutralParams({ availableTime: 120 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });

  // UT-SCR-D-004: stayMin=60 (ちょうど perSpotTime*1.5) → ×1.0
  it('estimated_stay_min=60 (= perSpotTime*1.5=60) → score *= 1.0 (境界値)', () => {
    const spot = neutralSpot({ estimated_stay_min: 60 });
    const params = neutralParams({ availableTime: 120 });
    const result = scoreSpot(spot, params)!;
    expect(result.score).toBeCloseTo(NEUTRAL_BASE * 1.0, 5);
  });
});
