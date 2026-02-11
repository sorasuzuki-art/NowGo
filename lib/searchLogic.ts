import { testSpots, TestSpot } from './testData';

export interface SearchParams {
  availableTime: number; // 分
  currentHour: number; // 0-23
  /** 出発地（距離計算などの拡張用） */
  origin?: { lat: number; lng: number };
  /** 徒歩何分圏内で遊ぶか（拡張用） */
  walkRangeMinutes?: number;
  companion: 'ひとり' | '友達' | 'デート' | '家族' | '未定';
  mode: 'おまかせ' | '定番' | '新規開拓' | '冒険' | 'バランス';
  weather: '晴れ' | '曇り' | '雨' | '風強め';
  style?: 'ゆっくり' | 'ほどほど' | 'アクティブ'; // 新しい条件
  locationType?: '屋内' | '屋外'; // 新しい条件（任意）
}

export interface ScoredSpot extends TestSpot {
  score: number;
  reason: string[];
}

// ステップ1: 空き時間ベースの成立判定
function filterByTime(spots: TestSpot[], availableTime: number): TestSpot[] {
  return spots.filter(spot => {
    // 30-45分: カフェ、軽い散歩、本屋、1スポット完結型
    if (availableTime <= 45) {
      return spot.category === 'food' ||
             (spot.category === 'nature' && spot.estimatedTime <= 60) ||
             (spot.category === 'shopping' && spot.estimatedTime <= 45) ||
             spot.estimatedTime <= 45;
    }

    // 60-90分: カフェ＋α、展示/ギャラリー、軽い体験、サク飲み
    if (availableTime <= 90) {
      return spot.category === 'food' ||
             spot.category === 'culture' ||
             spot.estimatedTime <= 90;
    }

    // 120-180分: 体験＋食事、複数スポット、イベント系
    if (availableTime <= 180) {
      return spot.estimatedTime <= 120; // 複数スポットを考慮して単体は120分まで
    }

    // 3時間以上: 全て対象
    return true;
  });
}

// ステップ2: 現在時刻・時間帯フィルタ
function scoreByTimeOfDay(spot: TestSpot, currentHour: number): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 1.0;

  // 朝 (5-11): 静か/軽め/整える
  if (currentHour >= 5 && currentHour < 11) {
    if (spot.category === 'nature') {
      score += 0.3;
      reasons.push('朝の散歩に最適');
    }
    if (spot.features.includes('静か')) {
      score += 0.2;
      reasons.push('朝の静かな時間にぴったり');
    }
    if (spot.category === 'food' && spot.tags.includes('朝食')) {
      score += 0.3;
      reasons.push('朝食に最適');
    }
    if (spot.category === 'culture' && spot.features.includes('屋外')) {
      score += 0.2;
      reasons.push('朝の文化散策');
    }
  }

  // 昼 (11-16): 活動/明るい/開放的
  else if (currentHour >= 11 && currentHour < 16) {
    if (spot.category === 'shopping') {
      score += 0.2;
      reasons.push('お昼のショッピングタイム');
    }
    if (spot.category === 'culture') {
      score += 0.2;
      reasons.push('日中の観光に最適');
    }
    if (spot.features.includes('屋外')) {
      score += 0.1;
      reasons.push('明るい時間の屋外活動');
    }
  }

  // 夕方 (16-18): 散歩/余韻/軽食
  else if (currentHour >= 16 && currentHour < 18) {
    if (spot.category === 'nature') {
      score += 0.3;
      reasons.push('夕方の散歩に最適');
    }
    if (spot.category === 'food' && spot.estimatedTime <= 60) {
      score += 0.2;
      reasons.push('夕方の軽食タイム');
    }
  }

  // 夜 (18-24, 0-5): 雰囲気/会話/非日常
  else {
    if (spot.category === 'culture' && spot.features.includes('屋内')) {
      score += 0.2;
      reasons.push('夜の文化体験');
    }
    if (spot.tags.includes('夜景')) {
      score += 0.4;
      reasons.push('夜景を楽しめる');
    }
    if (spot.category === 'food') {
      score += 0.1;
      reasons.push('夜の食事に適している');
    }
  }

  return { score, reasons };
}

// ステップ3: 天気ロジック
function scoreByWeather(spot: TestSpot, weather: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 1.0;

  if (weather === '雨') {
    if (spot.features.includes('屋内') || spot.weather.includes('rainy')) {
      score += 0.4;
      reasons.push('雨でも楽しめる');
    } else if (spot.features.includes('屋外')) {
      score -= 0.5;
      reasons.push('雨天では不向き');
    }
  } else if (weather === '晴れ') {
    if (spot.features.includes('屋外') || spot.category === 'nature') {
      score += 0.3;
      reasons.push('晴れた日にぴったり');
    }
    if (spot.weather.includes('sunny')) {
      score += 0.2;
      reasons.push('晴天におすすめ');
    }
  } else if (weather === '曇り') {
    if (spot.weather.includes('cloudy')) {
      score += 0.1;
      reasons.push('曇りの日でも楽しめる');
    }
  }

  return { score, reasons };
}

// ステップ4: 「誰と」ロジック
function scoreByCompanion(spot: TestSpot, companion: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 1.0;

  switch (companion) {
    case 'ひとり':
      if (spot.category === 'nature' || spot.features.includes('静か')) {
        score += 0.3;
        reasons.push('一人時間を満喫できる');
      }
      if (spot.category === 'culture') {
        score += 0.2;
        reasons.push('一人でじっくり楽しめる');
      }
      break;

    case '友達':
      if (spot.category === 'shopping' || spot.category === 'food') {
        score += 0.2;
        reasons.push('友達と楽しめる');
      }
      if (spot.estimatedTime >= 60) {
        score += 0.1;
        reasons.push('友達とゆっくり過ごせる');
      }
      break;

    case 'デート':
      if (spot.tags.includes('夜景') || spot.features.includes('雰囲気')) {
        score += 0.4;
        reasons.push('デートにロマンチック');
      }
      if (spot.category === 'culture' || spot.category === 'nature') {
        score += 0.2;
        reasons.push('デートで会話が弾む');
      }
      if (spot.priceRange === '無料' || spot.priceRange === '￥') {
        score += 0.1;
        reasons.push('気軽に楽しめる');
      }
      break;

    case '家族':
      if (spot.features.includes('バリアフリー') || spot.category === 'nature') {
        score += 0.3;
        reasons.push('家族みんなで楽しめる');
      }
      if (spot.priceRange === '無料' || spot.priceRange === '￥') {
        score += 0.2;
        reasons.push('家族でお得に楽しめる');
      }
      break;
  }

  return { score, reasons };
}

// ステップ5: モード別重み調整
function adjustByMode(baseScore: number, spot: TestSpot, mode: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = baseScore;

  switch (mode) {
    case '定番':
      if (spot.rating >= 4.5) {
        score += 0.3;
        reasons.push('評価の高い定番スポット');
      }
      if (spot.tags.includes('観光') || spot.tags.includes('ランドマーク')) {
        score += 0.2;
        reasons.push('定番の観光地');
      }
      break;

    case '新規開拓':
      if (spot.rating >= 4.0 && spot.rating < 4.5) {
        score += 0.2;
        reasons.push('隠れた良いスポット');
      }
      if (spot.tags.includes('穴場') || spot.category === 'nature') {
        score += 0.3;
        reasons.push('新しい発見がありそう');
      }
      break;

    case '冒険':
      if (spot.tags.includes('アート') || spot.tags.includes('建築')) {
        score += 0.3;
        reasons.push('ユニークな体験ができる');
      }
      if (spot.estimatedTime >= 90) {
        score += 0.1;
        reasons.push('じっくり探索できる');
      }
      break;

    case 'バランス':
      if (spot.rating >= 4.2) {
        score += 0.1;
        reasons.push('バランスの取れた良いスポット');
      }
      break;

    case 'おまかせ':
      // 現在の状況に最もフィットするものを優先（既存のスコアをそのまま使用）
      break;
  }

  return { score, reasons };
}

// スタイル別ロジック（新しい条件）
function scoreByStyle(spot: TestSpot, style?: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 1.0;

  if (!style) return { score, reasons };

  switch (style) {
    case 'ゆっくり':
      // 移動量少、屋内中心、滞在時間長め
      if (spot.category === 'nature' && spot.features.includes('静か')) {
        score += 0.3;
        reasons.push('ゆっくり過ごせる静かな場所');
      }
      if (spot.category === 'culture' && spot.features.includes('屋内')) {
        score += 0.3;
        reasons.push('室内でゆっくり鑑賞できる');
      }
      if (spot.category === 'food' && spot.estimatedTime >= 90) {
        score += 0.2;
        reasons.push('ゆっくり食事を楽しめる');
      }
      if (spot.estimatedTime >= 120) {
        score += 0.1;
        reasons.push('時間をかけて楽しめる');
      }
      break;

    case 'ほどほど':
      // バランス型
      if (spot.estimatedTime >= 45 && spot.estimatedTime <= 120) {
        score += 0.2;
        reasons.push('適度な時間で楽しめる');
      }
      if (spot.rating >= 4.0) {
        score += 0.1;
        reasons.push('人気のバランスの良いスポット');
      }
      break;

    case 'アクティブ':
      // 移動量多、屋外中心、滞在時間短め
      if (spot.features.includes('屋外') || spot.category === 'nature') {
        score += 0.3;
        reasons.push('アクティブに屋外で活動できる');
      }
      if (spot.estimatedTime <= 90) {
        score += 0.2;
        reasons.push('サクッと楽しめる');
      }
      if (spot.tags.includes('散歩') || spot.tags.includes('運動')) {
        score += 0.2;
        reasons.push('アクティブな体験ができる');
      }
      break;
  }

  return { score, reasons };
}

// 屋内/屋外フィルタ（新しい条件）
function filterByLocationType(spots: TestSpot[], locationType?: string): TestSpot[] {
  if (!locationType) return spots;

  switch (locationType) {
    case '屋内':
      return spots.filter(spot =>
        spot.features.includes('屋内') ||
        spot.category === 'culture' ||
        (spot.category === 'food' && !spot.features.includes('屋外')) ||
        (spot.category === 'shopping')
      );

    case '屋外':
      return spots.filter(spot =>
        spot.features.includes('屋外') ||
        spot.category === 'nature' ||
        spot.tags.includes('散歩') ||
        spot.tags.includes('公園')
      );

    default:
      return spots;
  }
}

// メイン検索関数
export function searchSpots(params: SearchParams): ScoredSpot[] {
  // ステップ1: 時間フィルタ
  let filteredSpots = filterByTime(testSpots, params.availableTime);

  // 新しい条件: 屋内/屋外フィルタ
  if (params.locationType) {
    filteredSpots = filterByLocationType(filteredSpots, params.locationType);
  }

  // 各スポットをスコアリング
  const scoredSpots: ScoredSpot[] = filteredSpots.map(spot => {
    let totalScore = 1.0;
    const allReasons: string[] = [];

    // ステップ2: 時間帯スコア
    const timeScore = scoreByTimeOfDay(spot, params.currentHour);
    totalScore *= timeScore.score;
    allReasons.push(...timeScore.reasons);

    // ステップ3: 天気スコア
    const weatherScore = scoreByWeather(spot, params.weather);
    totalScore *= weatherScore.score;
    allReasons.push(...weatherScore.reasons);

    // ステップ4: 同伴者スコア
    const companionScore = scoreByCompanion(spot, params.companion);
    totalScore *= companionScore.score;
    allReasons.push(...companionScore.reasons);

    // ステップ5: モード調整
    const modeScore = adjustByMode(totalScore, spot, params.mode);
    totalScore = modeScore.score;
    allReasons.push(...modeScore.reasons);

    // 新しい条件: スタイル調整
    if (params.style) {
      const styleScore = scoreByStyle(spot, params.style);
      totalScore *= styleScore.score;
      allReasons.push(...styleScore.reasons);
    }

    // 基本スコアとして評価も考慮
    totalScore *= (spot.rating / 5.0);

    return {
      ...spot,
      score: totalScore,
      reason: allReasons.filter((reason, index, self) => self.indexOf(reason) === index) // 重複除去
    };
  });

  // スコア順でソートして返す
  return scoredSpots
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // 上位20件
}

// 検索結果の説明文生成
export function generateSearchExplanation(params: SearchParams, resultCount: number): string {
  const timeText = params.availableTime < 60
    ? `${params.availableTime}分`
    : `${Math.floor(params.availableTime / 60)}時間${params.availableTime % 60 > 0 ? `${params.availableTime % 60}分` : ''}`;

  const timeOfDay = params.currentHour < 11 ? '朝' :
                   params.currentHour < 16 ? '昼' :
                   params.currentHour < 18 ? '夕方' : '夜';

  return `${timeOfDay}の${timeText}、${params.companion}で${params.weather}の日に${params.mode}モードで検索。${resultCount}件のおすすめスポットが見つかりました。`;
}