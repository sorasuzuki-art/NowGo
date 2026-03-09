# 単体テスト（UT）仕様書

| 項目 | 内容 |
|------|------|
| 対象システム | NowGo Web Application |
| 対象モジュール | `lib/spotSearch.ts` |
| ドキュメントバージョン | 1.0 |
| 作成日 | 2026-03-09 |
| テスト設計手法 | MC/DC（Modified Condition/Decision Coverage） |
| テストレベル | 単体テスト（UT） |

---

## 1. テスト設計方針

### 1.1 MC/DC（Modified Condition/Decision Coverage）について

本テスト仕様書は MC/DC に基づいて設計している。MC/DC は以下の要件を満たすカバレッジ基準である。

1. プログラム中の全ての判定（Decision）が `true` と `false` の両方を少なくとも1回取ること
2. プログラム中の全ての条件（Condition）が `true` と `false` の両方を少なくとも1回取ること
3. 各条件が独立して判定結果に影響を与えることを示すテストケースが存在すること

### 1.2 テストID体系

```
UT-{関数略称}-{連番3桁}
```

| 関数略称 | 対象関数 |
|----------|----------|
| ISO | isOpen |
| SCR | scoreSpot |
| SDS | selectDiverseSpots |
| OPR | optimizeRoute |
| BCK | buildCacheKey |
| GCS | getCachedSpots |
| PBN | parseBuildingName |
| DST | distanceKm |
| WTK | walkMinToKm |
| CGG | getCategoryGroup |
| BPL | buildPlan |

### 1.3 優先度定義

| 優先度 | 定義 | 実施タイミング |
|--------|------|----------------|
| P1 | 必須。主要機能の正常系・主要な異常系。バグ発生時のビジネスインパクトが大きい | 毎回のCI/CD実行時 |
| P2 | 重要。境界値・組み合わせ条件。リグレッション防止に必要 | デイリービルド時 |
| P3 | 推奨。補足的な網羅性確認。MC/DC充足のための追加ケース | リリース前テスト時 |

### 1.4 テスト区分定義

| 区分 | 定義 |
|------|------|
| 正常 | 設計上期待される入力・状態でのテスト |
| 異常 | 不正入力・エラー状態でのテスト |
| 境界 | 境界値分析に基づくテスト |

---

## 2. 対象関数一覧と判定条件分析

### 2.1 判定条件（Decision）・個別条件（Condition）一覧

各関数の分岐を抽出し、MC/DC の設計根拠とする。

#### isOpen

| Decision ID | 判定式 | 条件数 |
|-------------|--------|--------|
| ISO-D1 | `spot.is_open_24h` | 1 |
| ISO-D2 | `!spot.starttime \|\| !spot.closetime` | 2 |
| ISO-D3 | `close < open` （日付跨ぎ判定） | 1 |
| ISO-D4 | `cur >= open \|\| cur < close` （日付跨ぎ時） | 2 |
| ISO-D5 | `cur >= open && cur < close` （通常時） | 2 |
| ISO-D6 | try-catch（parse失敗） | 1 |

#### scoreSpot

| Decision ID | 判定式 | 条件数 |
|-------------|--------|--------|
| SCR-D1 | `!spot.name \|\| !spot.lat \|\| !spot.lon` | 3 |
| SCR-D2 | `isNaN(lat) \|\| isNaN(lon)` | 2 |
| SCR-D3 | 天気判定: `weather === '雨' \|\| weather === '雪'` × `indoor_type` × `weather_ok` | 6 |
| SCR-D4 | 滞在時間妥当性: `stayMin > perSpotTime * 2` / `stayMin > perSpotTime * 1.5` | 2 |
| SCR-D5 | スタイル判定: `style` × `stay_type` × `indoor_type` | 9 |
| SCR-D6 | モード判定: `mode` × `fame` × `scope` × `category` | 12 |
| SCR-D7 | タグ判定: `tags` × `style` × `mode` | 4 |
| SCR-D8 | 価格判定: `price_level` | 1 |
| SCR-D9 | カテゴリ時間帯: `category` × `hour` | 6 |

---

## 3. テストケース詳細

---

### 3.1 isOpen（営業時間判定）

**関数シグネチャ:** `isOpen(spot: DbSpot, hour: number, minute: number): boolean`

**MC/DC条件マトリクス:**

| 条件 | 略称 |
|------|------|
| C1: `spot.is_open_24h` が true | 24H |
| C2: `spot.starttime` が null/undefined | ST_NULL |
| C3: `spot.closetime` が null/undefined | CT_NULL |
| C4: `close < open` （日付跨ぎ） | WRAP |
| C5: `cur >= open` | CUR_GE_OPEN |
| C6: `cur < close` | CUR_LT_CLOSE |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-ISO-001 | 24時間営業の店舗はtrueを返す | - | spot: `{ is_open_24h: true, starttime: "10:00", closetime: "20:00" }`, hour: 3, minute: 0 | `true` | C1=T → Decision=T（C1の独立影響確認） | 正常 | P1 |
| UT-ISO-002 | 24時間営業でない場合は営業時間で判定する | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 12, minute: 0 | `true` | C1=F → 後続判定に進む | 正常 | P1 |
| UT-ISO-003 | is_open_24hがnullの場合はfalse扱い | - | spot: `{ is_open_24h: null, starttime: "10:00", closetime: "20:00" }`, hour: 12, minute: 0 | `true` | C1=falsy → 後続判定に進む | 正常 | P2 |
| UT-ISO-004 | starttimeが未設定の場合trueを返す | - | spot: `{ is_open_24h: false, starttime: null, closetime: "20:00" }`, hour: 3, minute: 0 | `true` | C2=T → Decision=T（C2の独立影響確認） | 正常 | P1 |
| UT-ISO-005 | closetimeが未設定の場合trueを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: null }`, hour: 3, minute: 0 | `true` | C3=T → Decision=T（C3の独立影響確認） | 正常 | P1 |
| UT-ISO-006 | starttime/closetimeの両方が未設定の場合trueを返す | - | spot: `{ is_open_24h: false, starttime: null, closetime: null }`, hour: 3, minute: 0 | `true` | C2=T,C3=T → Decision=T | 正常 | P2 |
| UT-ISO-007 | 通常営業_開店前はfalseを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 9, minute: 59 | `false` | C4=F, C5=F, C6=T → Decision=F | 境界 | P1 |
| UT-ISO-008 | 通常営業_開店時刻ちょうどはtrueを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 10, minute: 0 | `true` | C4=F, C5=T, C6=T → Decision=T（C5の境界） | 境界 | P1 |
| UT-ISO-009 | 通常営業_営業中はtrueを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 15, minute: 30 | `true` | C4=F, C5=T, C6=T → Decision=T | 正常 | P1 |
| UT-ISO-010 | 通常営業_閉店1分前はtrueを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 19, minute: 59 | `true` | C4=F, C5=T, C6=T → Decision=T（C6の境界） | 境界 | P1 |
| UT-ISO-011 | 通常営業_閉店時刻ちょうどはfalseを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 20, minute: 0 | `false` | C4=F, C5=T, C6=F → Decision=F（C6の独立影響確認） | 境界 | P1 |
| UT-ISO-012 | 通常営業_閉店後はfalseを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 21, minute: 0 | `false` | C4=F, C5=T, C6=F → Decision=F | 正常 | P1 |
| UT-ISO-013 | 日付跨ぎ_開店前（昼間）はfalseを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 12, minute: 0 | `false` | C4=T, C5=F, C6=F → Decision=F | 正常 | P1 |
| UT-ISO-014 | 日付跨ぎ_開店1分前はfalseを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 17, minute: 59 | `false` | C4=T, C5=F, C6=F → Decision=F（C5の境界） | 境界 | P1 |
| UT-ISO-015 | 日付跨ぎ_開店時刻ちょうどはtrueを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 18, minute: 0 | `true` | C4=T, C5=T → Decision=T（C5の独立影響確認） | 境界 | P1 |
| UT-ISO-016 | 日付跨ぎ_深夜営業中はtrueを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 0, minute: 30 | `true` | C4=T, C5=F, C6=T → Decision=T（C6の独立影響確認） | 正常 | P1 |
| UT-ISO-017 | 日付跨ぎ_閉店1分前はtrueを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 1, minute: 59 | `true` | C4=T, C5=F, C6=T → Decision=T（C6の境界） | 境界 | P1 |
| UT-ISO-018 | 日付跨ぎ_閉店時刻ちょうどはfalseを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 2, minute: 0 | `false` | C4=T, C5=F, C6=F → Decision=F | 境界 | P1 |
| UT-ISO-019 | 日付跨ぎ_閉店後はfalseを返す | - | spot: `{ is_open_24h: false, starttime: "18:00", closetime: "02:00" }`, hour: 3, minute: 0 | `false` | C4=T, C5=F, C6=F → Decision=F | 正常 | P2 |
| UT-ISO-020 | 不正なstarttime形式はtrue（catch句）を返す | - | spot: `{ is_open_24h: false, starttime: "invalid", closetime: "20:00" }`, hour: 12, minute: 0 | `true` | ISO-D6: catch句到達 | 異常 | P1 |
| UT-ISO-021 | 不正なclosetime形式はtrue（catch句）を返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "abc" }`, hour: 12, minute: 0 | `true` | ISO-D6: catch句到達 | 異常 | P1 |
| UT-ISO-022 | hour=0, minute=0の深夜0時判定 | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 0, minute: 0 | `false` | cur=0, open=600, close=1200 → F | 境界 | P2 |
| UT-ISO-023 | hour=23, minute=59の深夜直前判定 | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "20:00" }`, hour: 23, minute: 59 | `false` | cur=1439, open=600, close=1200 → F | 境界 | P2 |
| UT-ISO-024 | 開店時刻=閉店時刻（0分営業）の場合falseを返す | - | spot: `{ is_open_24h: false, starttime: "10:00", closetime: "10:00" }`, hour: 10, minute: 0 | `false` | close==open → WRAP=F, cur>=open=T, cur<close=F → F | 境界 | P2 |
| UT-ISO-025 | starttimeが空文字列の場合trueを返す | - | spot: `{ is_open_24h: false, starttime: "", closetime: "20:00" }`, hour: 12, minute: 0 | `true` | `!""` = true → C2=T | 異常 | P2 |

---

### 3.2 scoreSpot（スコアリング）

**関数シグネチャ:** `scoreSpot(spot: DbSpot, params: SpotSearchParams): ScoredSpot | null`

#### 3.2.1 除外条件（null返却）テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-001 | name欠損時はnullを返す | - | spot: `{ name: null, lat: "35.6", lon: "139.7" }` | `null` | SCR-D1: C1=T → null（nameの独立影響） | 異常 | P1 |
| UT-SCR-002 | lat欠損時はnullを返す | - | spot: `{ name: "テスト", lat: null, lon: "139.7" }` | `null` | SCR-D1: C2=T → null（latの独立影響） | 異常 | P1 |
| UT-SCR-003 | lon欠損時はnullを返す | - | spot: `{ name: "テスト", lat: "35.6", lon: null }` | `null` | SCR-D1: C3=T → null（lonの独立影響） | 異常 | P1 |
| UT-SCR-004 | name空文字列時はnullを返す | - | spot: `{ name: "", lat: "35.6", lon: "139.7" }` | `null` | SCR-D1: `!""` = T → null | 異常 | P2 |
| UT-SCR-005 | latがNaN文字列時はnullを返す | - | spot: `{ name: "テスト", lat: "abc", lon: "139.7" }` | `null` | SCR-D2: C1=T → null（lat NaN独立影響） | 異常 | P1 |
| UT-SCR-006 | lonがNaN文字列時はnullを返す | - | spot: `{ name: "テスト", lat: "35.6", lon: "xyz" }` | `null` | SCR-D2: C2=T → null（lon NaN独立影響） | 異常 | P1 |
| UT-SCR-007 | name/lat/lon全て有効時はScoredSpotを返す | - | spot: `{ name: "テスト", lat: "35.6", lon: "139.7", category: "cafe" }` | ScoredSpot（非null） | SCR-D1: C1=F,C2=F,C3=F; SCR-D2: C1=F,C2=F | 正常 | P1 |

#### 3.2.2 天気スコア乗数テスト

**MC/DC Decision:** `(weather === '雨' || weather === '雪') × indoor_type × weather_ok`

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-010 | 雨×outdoor→0.1倍 | 基本スポット | weather: `'雨'`, indoor_type: `'outdoor'` | score含 `*= 0.1` | 天気=雨,indoor=outdoor | 正常 | P1 |
| UT-SCR-011 | 雨×indoor→1.4倍 | 基本スポット | weather: `'雨'`, indoor_type: `'indoor'` | score含 `*= 1.4` | 天気=雨,indoor=indoor | 正常 | P1 |
| UT-SCR-012 | 雨×both＋雨OK→1.3倍 | 基本スポット | weather: `'雨'`, indoor_type: `'both'`, weather_ok: `'雨OK'` | score含 `*= 1.3` | 天気=雨,indoor=both,weather_ok含雨OK | 正常 | P1 |
| UT-SCR-013 | 雨×both＋雨OKなし→1.0倍（変化なし） | 基本スポット | weather: `'雨'`, indoor_type: `'both'`, weather_ok: `null` | score含 `*= 1.0` | 天気=雨,indoor=both,weather_ok不含 | 正常 | P2 |
| UT-SCR-014 | 雪×outdoor→0.1倍 | 基本スポット | weather: `'雪'`, indoor_type: `'outdoor'` | score含 `*= 0.1` | 天気=雪,indoor=outdoor（雪の独立影響確認） | 正常 | P1 |
| UT-SCR-015 | 雪×indoor→1.4倍 | 基本スポット | weather: `'雪'`, indoor_type: `'indoor'` | score含 `*= 1.4` | 天気=雪,indoor=indoor | 正常 | P2 |
| UT-SCR-016 | 晴れ×outdoor→1.2倍 | 基本スポット | weather: `'晴れ'`, indoor_type: `'outdoor'` | score含 `*= 1.2` | 天気=晴れ,indoor=outdoor | 正常 | P1 |
| UT-SCR-017 | 晴れ×both→1.2倍 | 基本スポット | weather: `'晴れ'`, indoor_type: `'both'` | score含 `*= 1.2` | 天気=晴れ,indoor=both | 正常 | P2 |
| UT-SCR-018 | 晴れ×indoor→1.0倍（変化なし） | 基本スポット | weather: `'晴れ'`, indoor_type: `'indoor'` | score含 `*= 1.0` | 天気=晴れ,indoor=indoor → else分岐なし | 正常 | P2 |
| UT-SCR-019 | 曇り→天気による乗数なし | 基本スポット | weather: `'曇り'`, indoor_type: `'outdoor'` | score含 天気乗数1.0 | 天気=曇り → どの分岐にも入らない | 正常 | P1 |
| UT-SCR-020 | 風強め→天気による乗数なし | 基本スポット | weather: `'風強め'`, indoor_type: `'outdoor'` | score含 天気乗数1.0 | 天気=風強め → どの分岐にも入らない | 正常 | P2 |
| UT-SCR-021 | 雨×indoor_type=null→天気による乗数なし（else if chain落ち） | 基本スポット | weather: `'雨'`, indoor_type: `null` | score含 天気乗数1.0 | 天気=雨,indoor=null → 全else if不成立 | 境界 | P2 |

#### 3.2.3 スタイル×stay_typeスコア乗数テスト

**MC/DC Decision:** `style × stay_type × indoor_type`

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-030 | ゆっくり×stay→1.3倍 | 基本スポット | style: `'ゆっくり'`, stay_type: `'stay'` | score含 `*= 1.3` | style=ゆっくり,stay=stay | 正常 | P1 |
| UT-SCR-031 | ゆっくり×short→0.8倍 | 基本スポット | style: `'ゆっくり'`, stay_type: `'short'` | score含 `*= 0.8` | style=ゆっくり,stay=short | 正常 | P1 |
| UT-SCR-032 | ゆっくり×roam→1.0倍（変化なし） | 基本スポット | style: `'ゆっくり'`, stay_type: `'roam'` | score含 スタイル乗数1.0 | style=ゆっくり,stay=roam → else分岐なし | 正常 | P2 |
| UT-SCR-033 | アクティブ×roam→1.3倍 | 基本スポット | style: `'アクティブ'`, stay_type: `'roam'` | score含 `*= 1.3` | style=アクティブ,stay=roam | 正常 | P1 |
| UT-SCR-034 | アクティブ×short→1.2倍 | 基本スポット | style: `'アクティブ'`, stay_type: `'short'` | score含 `*= 1.2` | style=アクティブ,stay=short | 正常 | P1 |
| UT-SCR-035 | アクティブ×outdoor→追加1.1倍 | 基本スポット | style: `'アクティブ'`, stay_type: `'stay'`, indoor_type: `'outdoor'` | score含 `*= 1.1` | style=アクティブ,indoor=outdoor（独立乗算） | 正常 | P1 |
| UT-SCR-036 | アクティブ×roam×outdoor→1.3*1.1倍 | 基本スポット | style: `'アクティブ'`, stay_type: `'roam'`, indoor_type: `'outdoor'` | score含 `*= 1.3 *= 1.1`（合計1.43倍） | 複合：roam+outdoor両方適用 | 正常 | P2 |
| UT-SCR-037 | ほどほど×short→1.1倍 | 基本スポット | style: `'ほどほど'`, stay_type: `'short'` | score含 `*= 1.1` | style=ほどほど,stay=short | 正常 | P1 |
| UT-SCR-038 | ほどほど×stay→1.0倍（変化なし） | 基本スポット | style: `'ほどほど'`, stay_type: `'stay'` | score含 スタイル乗数1.0 | style=ほどほど,stay=stay → else分岐なし | 正常 | P2 |
| UT-SCR-039 | スタイル未指定→スタイル乗数なし | 基本スポット | style: `undefined` | score含 スタイル乗数1.0 | style=undefined → どの分岐にも入らない | 正常 | P2 |

#### 3.2.4 モード×famousLevel×scope×categoryテスト

**MC/DC Decision:** `mode × fame × scope × category`

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-050 | 定番×fame=1→score*=0.95 | 基本スポット | mode: `'定番'`, famousLevel: 1 | score含 `*= (0.8 + 1*0.15)` = 0.95 | mode=定番, fame=1 | 正常 | P1 |
| UT-SCR-051 | 定番×fame=3→score*=1.25 | 基本スポット | mode: `'定番'`, famousLevel: 3 | score含 `*= (0.8 + 3*0.15)` = 1.25 | mode=定番, fame=3 | 正常 | P2 |
| UT-SCR-052 | 定番×fame=5→score*=1.55 | 基本スポット | mode: `'定番'`, famousLevel: 5 | score含 `*= (0.8 + 5*0.15)` = 1.55 | mode=定番, fame=5 | 正常 | P2 |
| UT-SCR-053 | 定番×fame=null→fame=1として計算 | 基本スポット | mode: `'定番'`, famousLevel: null | score含 `*= (0.8 + 1*0.15)` = 0.95 | fame ?? 1 のnullフォールバック | 境界 | P2 |
| UT-SCR-060 | 新規開拓×fame=5→null返却（除外） | 基本スポット | mode: `'新規開拓'`, famousLevel: 5 | `null` | mode=新規開拓,fame>=5 → return null | 正常 | P1 |
| UT-SCR-061 | 新規開拓×fame=4→score*=0.4 | 基本スポット | mode: `'新規開拓'`, famousLevel: 4 | score含 `*= 0.4` | mode=新規開拓,fame=4 | 正常 | P1 |
| UT-SCR-062 | 新規開拓×fame=2→score*=1.4 | 基本スポット | mode: `'新規開拓'`, famousLevel: 2 | score含 `*= 1.4` | mode=新規開拓,fame<=2 | 正常 | P1 |
| UT-SCR-063 | 新規開拓×fame=1→score*=1.4 | 基本スポット | mode: `'新規開拓'`, famousLevel: 1 | score含 `*= 1.4` | mode=新規開拓,fame<=2（境界） | 境界 | P2 |
| UT-SCR-064 | 新規開拓×fame=3→乗数なし | 基本スポット | mode: `'新規開拓'`, famousLevel: 3 | score含 モード乗数1.0 | mode=新規開拓,fame=3 → どのelse ifにも入らない | 正常 | P2 |
| UT-SCR-065 | 新規開拓×scope=big→null返却（除外） | 基本スポット | mode: `'新規開拓'`, famousLevel: 2, scope: `'big'` | `null` | scope=big → return null（scopeの独立影響） | 正常 | P1 |
| UT-SCR-066 | 新規開拓×category=landmark→null返却（除外） | 基本スポット | mode: `'新規開拓'`, famousLevel: 2, category: `'landmark'` | `null` | category=landmark → return null（categoryの独立影響） | 正常 | P1 |
| UT-SCR-067 | 新規開拓×category=town→null返却（除外） | 基本スポット | mode: `'新規開拓'`, famousLevel: 2, category: `'town'` | `null` | category=town → return null | 正常 | P1 |
| UT-SCR-068 | 新規開拓×scope=medium→score*=0.5 | 基本スポット | mode: `'新規開拓'`, famousLevel: 2, scope: `'medium'` | score含 `*= 1.4 *= 0.5` | scope=medium → 0.5倍 | 正常 | P2 |
| UT-SCR-069 | 新規開拓×scope=small→乗数なし | 基本スポット | mode: `'新規開拓'`, famousLevel: 2, scope: `'small'` | score含 `*= 1.4`（scopeペナルティなし） | scope=small → else分岐なし | 正常 | P2 |
| UT-SCR-070 | 冒険×fame=5→null返却（除外） | 基本スポット | mode: `'冒険'`, famousLevel: 5 | `null` | mode=冒険,fame>=5 → return null | 正常 | P1 |
| UT-SCR-071 | 冒険×いきものカテゴリ→score*=1.3 | 基本スポット | mode: `'冒険'`, famousLevel: 2, category: `'zoo'` | score含 `*= 1.3` | group=いきもの → 1.3倍 | 正常 | P1 |
| UT-SCR-072 | 冒険×エンタメカテゴリ→score*=1.3 | 基本スポット | mode: `'冒険'`, famousLevel: 2, category: `'amusement'` | score含 `*= 1.3` | group=エンタメ → 1.3倍 | 正常 | P2 |
| UT-SCR-073 | 冒険×リラックスカテゴリ→score*=1.3 | 基本スポット | mode: `'冒険'`, famousLevel: 2, category: `'spa'` | score含 `*= 1.3` | group=リラックス → 1.3倍 | 正常 | P2 |
| UT-SCR-074 | 冒険×ミュージアムカテゴリ→score*=1.3 | 基本スポット | mode: `'冒険'`, famousLevel: 2, category: `'museum'` | score含 `*= 1.3` | group=ミュージアム → 1.3倍 | 正常 | P2 |
| UT-SCR-075 | 冒険×scope=big→null返却（除外） | 基本スポット | mode: `'冒険'`, famousLevel: 2, scope: `'big'` | `null` | mode=冒険,scope=big → return null | 正常 | P1 |
| UT-SCR-076 | 冒険×category=landmark→null返却（除外） | 基本スポット | mode: `'冒険'`, famousLevel: 2, category: `'landmark'` | `null` | mode=冒険,category=landmark → return null | 正常 | P1 |
| UT-SCR-077 | 冒険×category=town→null返却（除外） | 基本スポット | mode: `'冒険'`, famousLevel: 2, category: `'town'` | `null` | mode=冒険,category=town → return null | 正常 | P2 |
| UT-SCR-078 | 冒険×scope=medium→score*=0.5 | 基本スポット | mode: `'冒険'`, famousLevel: 2, scope: `'medium'` | score含 `*= 0.5` | mode=冒険,scope=medium → 0.5倍 | 正常 | P2 |
| UT-SCR-079 | 不明モード→モード乗数なし | 基本スポット | mode: `'その他'`, famousLevel: 3 | score含 モード乗数1.0 | mode=不明 → どの分岐にも入らない | 正常 | P2 |

#### 3.2.5 カテゴリ別時間帯適性テスト

**MC/DC Decision:** `category × hour` の各分岐

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-080 | bar×hour=0→score*=0.05 | bar基本スポット | category: `'bar'`, currentHour: 0 | score含 `*= 0.05` | cat=bar, hour<17 | 正常 | P1 |
| UT-SCR-081 | bar×hour=16→score*=0.05 | bar基本スポット | category: `'bar'`, currentHour: 16 | score含 `*= 0.05` | cat=bar, hour<17（境界-1） | 境界 | P1 |
| UT-SCR-082 | bar×hour=17→score*=1.0 | bar基本スポット | category: `'bar'`, currentHour: 17 | score含 `*= 1.0` | cat=bar, hour=17（境界、17-19帯） | 境界 | P1 |
| UT-SCR-083 | bar×hour=19→score*=1.0 | bar基本スポット | category: `'bar'`, currentHour: 19 | score含 `*= 1.0` | cat=bar, hour=19（境界） | 境界 | P2 |
| UT-SCR-084 | bar×hour=20→score*=1.4 | bar基本スポット | category: `'bar'`, currentHour: 20 | score含 `*= 1.4` | cat=bar, hour>=20（境界） | 境界 | P1 |
| UT-SCR-085 | bar×hour=23→score*=1.4 | bar基本スポット | category: `'bar'`, currentHour: 23 | score含 `*= 1.4` | cat=bar, hour=23（最大値） | 境界 | P2 |
| UT-SCR-086 | cafe×hour=21→乗数なし | cafe基本スポット | category: `'cafe'`, currentHour: 21 | score含 カフェ時間帯乗数1.0 | cat=cafe, hour=21 → else分岐なし | 境界 | P2 |
| UT-SCR-087 | cafe×hour=22→score*=0.5 | cafe基本スポット | category: `'cafe'`, currentHour: 22 | score含 `*= 0.5` | cat=cafe, hour>=22（境界） | 境界 | P1 |
| UT-SCR-088 | cafe×hour=23→score*=0.5 | cafe基本スポット | category: `'cafe'`, currentHour: 23 | score含 `*= 0.5` | cat=cafe, hour=23 | 正常 | P2 |
| UT-SCR-089 | restaurant×hour=10→乗数なし | restaurant基本スポット | category: `'restaurant'`, currentHour: 10 | score含 レストラン時間帯乗数1.0 | cat=restaurant, hour=10（ランチ帯前） | 境界 | P2 |
| UT-SCR-090 | restaurant×hour=11→score*=1.1 | restaurant基本スポット | category: `'restaurant'`, currentHour: 11 | score含 `*= 1.1` | cat=restaurant, hour=11（ランチ帯開始境界） | 境界 | P1 |
| UT-SCR-091 | restaurant×hour=14→score*=1.1 | restaurant基本スポット | category: `'restaurant'`, currentHour: 14 | score含 `*= 1.1` | cat=restaurant, hour=14（ランチ帯終了境界） | 境界 | P2 |
| UT-SCR-092 | restaurant×hour=15→乗数なし | restaurant基本スポット | category: `'restaurant'`, currentHour: 15 | score含 レストラン時間帯乗数1.0 | cat=restaurant, hour=15（ランチ・ディナー間） | 境界 | P2 |
| UT-SCR-093 | restaurant×hour=17→score*=1.1 | restaurant基本スポット | category: `'restaurant'`, currentHour: 17 | score含 `*= 1.1` | cat=restaurant, hour=17（ディナー帯開始境界） | 境界 | P1 |
| UT-SCR-094 | restaurant×hour=21→score*=1.1 | restaurant基本スポット | category: `'restaurant'`, currentHour: 21 | score含 `*= 1.1` | cat=restaurant, hour=21（ディナー帯終了境界） | 境界 | P2 |
| UT-SCR-095 | restaurant×hour=22→乗数なし | restaurant基本スポット | category: `'restaurant'`, currentHour: 22 | score含 レストラン時間帯乗数1.0 | cat=restaurant, hour=22（ディナー帯後） | 境界 | P2 |

#### 3.2.6 タグボーナステスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-100 | ゆっくり×タグ「のんびり」→score*=1.15 | 基本スポット | style: `'ゆっくり'`, tags: `'のんびり,おしゃれ'` | score含 `*= 1.15` | style=ゆっくり, tags含「のんびり」 | 正常 | P1 |
| UT-SCR-101 | ゆっくり×タグ「リラックス」→score*=1.15 | 基本スポット | style: `'ゆっくり'`, tags: `'リラックス'` | score含 `*= 1.15` | style=ゆっくり, tags含「リラックス」 | 正常 | P2 |
| UT-SCR-102 | ゆっくり×タグ「静か」→score*=1.15 | 基本スポット | style: `'ゆっくり'`, tags: `'静か'` | score含 `*= 1.15` | style=ゆっくり, tags含「静か」 | 正常 | P2 |
| UT-SCR-103 | ゆっくり×該当タグなし→ボーナスなし | 基本スポット | style: `'ゆっくり'`, tags: `'おしゃれ,人気'` | score含 タグボーナスなし | style=ゆっくり, tags不含 → ボーナスなし | 正常 | P2 |
| UT-SCR-104 | 新規開拓×タグ「穴場」→score*=1.15 | 基本スポット | mode: `'新規開拓'`, tags: `'穴場,おしゃれ'` | score含 `*= 1.15` | mode=新規開拓, tags含「穴場」 | 正常 | P1 |
| UT-SCR-105 | 新規開拓×タグ「隠れ家」→score*=1.15 | 基本スポット | mode: `'新規開拓'`, tags: `'隠れ家'` | score含 `*= 1.15` | mode=新規開拓, tags含「隠れ家」 | 正常 | P2 |
| UT-SCR-106 | 新規開拓×タグ「ローカル」→score*=1.15 | 基本スポット | mode: `'新規開拓'`, tags: `'ローカル'` | score含 `*= 1.15` | mode=新規開拓, tags含「ローカル」 | 正常 | P2 |
| UT-SCR-107 | 新規開拓×該当タグなし→ボーナスなし | 基本スポット | mode: `'新規開拓'`, tags: `'人気,おしゃれ'` | score含 タグボーナスなし | mode=新規開拓, tags不含 → ボーナスなし | 正常 | P2 |
| UT-SCR-108 | tagsがnull→タグボーナスなし | 基本スポット | tags: `null` | score含 タグボーナスなし | tags=null → if(spot.tags)=false | 境界 | P2 |
| UT-SCR-109 | ゆっくり×新規開拓×両方のタグ→両方適用 | 基本スポット | style: `'ゆっくり'`, mode: `'新規開拓'`, tags: `'のんびり,穴場'` | score含 `*= 1.15 *= 1.15`（合計1.3225倍） | 複合条件:style+modeのタグ両方適用 | 正常 | P2 |
| UT-SCR-110 | タグ大文字小文字混在→正しくマッチする | 基本スポット | style: `'ゆっくり'`, tags: `'ノンビリ,おしゃれ'` | score含 タグボーナスなし（toLowerCase後「のんびり」と不一致） | toLowerCase処理確認 | 境界 | P3 |

#### 3.2.7 価格帯テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-120 | price_level=free→score*=1.2 | 基本スポット | price_level: `'free'` | score含 `*= 1.2` | price=free | 正常 | P1 |
| UT-SCR-121 | price_level=low→score*=1.1 | 基本スポット | price_level: `'low'` | score含 `*= 1.1` | price=low | 正常 | P1 |
| UT-SCR-122 | price_level=medium→score*=1.0 | 基本スポット | price_level: `'medium'` | score含 `*= 1.0` | price=medium | 正常 | P2 |
| UT-SCR-123 | price_level=high→score*=0.9 | 基本スポット | price_level: `'high'` | score含 `*= 0.9` | price=high | 正常 | P1 |
| UT-SCR-124 | price_level=null→乗数なし | 基本スポット | price_level: `null` | score含 価格乗数なし | price=null → if(spot.price_level)=false | 境界 | P2 |
| UT-SCR-125 | price_level=不明文字列→score*=1.0 | 基本スポット | price_level: `'unknown'` | score含 `*= 1.0` | price=unknown → p[unknown] ?? 1.0 | 異常 | P2 |

#### 3.2.8 滞在時間妥当性テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-130 | 滞在時間が1スポット配分の2倍超→score*=0.5 | availableTime=120, estimated_stay_min=80 | perSpotTime≈34.3, stayMin=80 > 68.6 | score含 `*= 0.5` | stayMin > perSpotTime*2 | 正常 | P1 |
| UT-SCR-131 | 滞在時間が1スポット配分の1.5倍超2倍以下→score*=0.8 | availableTime=120, estimated_stay_min=60 | perSpotTime≈34.3, 51.4<60<=68.6 | score含 `*= 0.8` | stayMin > perSpotTime*1.5 | 正常 | P1 |
| UT-SCR-132 | 滞在時間が1スポット配分の1.5倍以下→ペナルティなし | availableTime=120, estimated_stay_min=30 | perSpotTime≈34.3, 30<=51.4 | score含 滞在ペナルティなし | stayMin <= perSpotTime*1.5 | 正常 | P2 |
| UT-SCR-133 | estimated_stay_min=null→デフォルト30分として計算 | availableTime=120 | estimated_stay_min: `null` | stayMin=30として計算 | ?? 30 のフォールバック | 境界 | P2 |

#### 3.2.9 複合スコア計算テスト（エンドツーエンド）

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SCR-140 | 最高スコアパターン: 雨×indoor×ゆっくり×stay×定番×fame5×free×cafe×昼 | 全条件最適 | weather:`'雨'`,indoor:`'indoor'`,style:`'ゆっくり'`,stay_type:`'stay'`,mode:`'定番'`,fame:5,price:`'free'`,cat:`'cafe'`,hour:14 | score = 1.0*1.4*1.3*1.55*1.2 = 約3.37 | 全乗数の乗算確認 | 正常 | P1 |
| UT-SCR-141 | 最低スコアパターン（非null）: 雨×outdoor×アクティブ×stay×定番×fame1×high×bar×hour=0 | 全条件最悪 | weather:`'雨'`,indoor:`'outdoor'`,style:`'アクティブ'`,stay_type:`'stay'`,mode:`'定番'`,fame:1,price:`'high'`,cat:`'bar'`,hour:0 | score = 1.0*0.1*1.1*0.95*0.9*0.05 = 約0.00047 | 全乗数の最小組合せ | 正常 | P2 |

---

### 3.3 selectDiverseSpots（多様性選択）

**関数シグネチャ:** `selectDiverseSpots(candidates: ScoredSpot[], count: number, origin?: {lat, lng}): ScoredSpot[]`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `candidates.length === 0` | EMPTY |
| C2: `usedIds.has(c.spot.source_id)` | USED |
| C3: `usedGroups.has(c.group)` | SAME_GROUP |
| C4: `pool.length === 0` | POOL_EMPTY |
| C5: `selected.length < count` | UNDER_COUNT |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-SDS-001 | 空の候補リスト→空配列を返す | - | candidates: `[]`, count: 3 | `[]` | C1=T → 早期return | 異常 | P1 |
| UT-SDS-002 | count=1→1件のみ選択 | カテゴリ混在の5候補 | candidates: 5件, count: 1 | 配列length=1 | C5: 1回のループ後終了 | 正常 | P1 |
| UT-SDS-003 | count=候補数と同数→全件選択 | 異なるカテゴリ3候補 | candidates: 3件（全カテゴリ異なる）, count: 3 | 配列length=3、全候補含む | C5: countまでループ | 正常 | P1 |
| UT-SDS-004 | count>候補数→候補数分のみ返却 | - | candidates: 2件, count: 5 | 配列length=2 | C4: pool空で早期break | 境界 | P1 |
| UT-SDS-005 | 全候補が同一カテゴリ→diversityBonus=0.05が全適用 | 全候補category=cafe | candidates: 5件（全てグループ「カフェ」）, count: 3 | 配列length=3、全てカフェ | C3=T: diversityBonus=0.05 | 正常 | P1 |
| UT-SDS-006 | 全候補が異なるカテゴリ→diversityBonus=1.0が適用 | 5種カテゴリの5候補 | candidates: 5件（全カテゴリ異なる）, count: 3 | 配列length=3、全カテゴリ異なる | C3=F: diversityBonus=1.0 | 正常 | P1 |
| UT-SDS-007 | 距離が全て同一の候補→score依存の選択 | 全候補同一座標 | candidates: 5件（全て同一lat/lon）, count: 3 | 配列length=3、距離差なし | proximityScore全同一 | 境界 | P2 |
| UT-SDS-008 | count=0→最初の1件は選ばれるが即終了 | - | candidates: 3件, count: 0 | 配列length=0（whileに入らない）、ただし実装上firstは選択される可能性あり | C5: selected.length(1) < count(0)=F | 境界 | P2 |
| UT-SDS-009 | 同一source_idの重複候補→usedIdsで除外 | source_id重複あり | candidates: 3件（うち2件同一ID）, count: 3 | 配列length=2（重複IDは1回のみ選択） | C2=T: usedIds.has → skip | 正常 | P2 |
| UT-SDS-010 | 候補1件のみ→その1件を返す | - | candidates: 1件, count: 3 | 配列length=1 | C4: 2つ目選択時pool空→break | 境界 | P1 |
| UT-SDS-011 | origin指定あり→結果に影響なし（selectDiverseSpots内では未使用） | origin指定 | candidates: 3件, count: 2, origin: `{lat:35.6,lng:139.7}` | 配列length=2 | origin引数は本関数内未参照 | 正常 | P3 |
| UT-SDS-012 | 大量候補（100件）→正常に選択完了 | 100件の候補 | candidates: 100件, count: 6 | 配列length=6 | パフォーマンス・正常終了確認 | 正常 | P2 |

---

### 3.4 optimizeRoute（ルート最適化）

**関数シグネチャ:** `optimizeRoute(spots: ScoredSpot[], origin?: {lat, lng}): ScoredSpot[]`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `spots.length <= 1` | FEW_SPOTS |
| C2: `s.building` が truthy | HAS_BUILDING |
| C3: `existing` が truthy（既に同ビル名あり） | SAME_BUILDING |
| C4: `indices.length >= 2` | MULTI_SAME_BLDG |
| C5: `nodes.length <= 1` | SINGLE_NODE |
| C6: `angleDiff > Math.PI * 0.5` | SHARP_TURN |
| C7: `ordered[i].group === ordered[i+1].group` | SAME_CAT_ADJ |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-OPR-001 | spots=0件→空配列を返す | - | spots: `[]` | `[]` | C1: length(0)<=1 → T、早期return | 境界 | P1 |
| UT-OPR-002 | spots=1件→そのまま返す | - | spots: 1件 | 入力と同一の1件配列 | C1: length(1)<=1 → T、早期return | 境界 | P1 |
| UT-OPR-003 | spots=2件→最短距離順に並べ替え | origin指定あり | spots: 2件（originから遠/近）, origin指定 | originに近い方が先 | 2件の順列探索（2!=2通り） | 正常 | P1 |
| UT-OPR-004 | spots=3件→全順列探索で最短ルート | origin指定あり | spots: 3件（三角形配置）, origin指定 | 最短経路順 | 3件の順列探索（3!=6通り） | 正常 | P1 |
| UT-OPR-005 | 同一ビル2スポット混在→連続配置 | ビルA×2+ビルなし×1 | spots: 3件（うち2件同一building="渋谷ビル"）| 同一ビルの2件が連続 | C2=T,C3=T,C4=T → ビルグループ化 | 正常 | P1 |
| UT-OPR-006 | 同一ビル2件が全スポット→1ノード扱い | ビルA×2のみ | spots: 2件（同一building） | 2件がそのまま返却（ノード1つ→C5=T） | C5: nodes.length<=1 → T | 境界 | P1 |
| UT-OPR-007 | 全スポットbuildingなし→全てソロノード | ビルなし×3 | spots: 3件（全てbuilding=undefined） | 通常の最短ルート順 | C2=F → 全てsoloIndices | 正常 | P2 |
| UT-OPR-008 | 方向転換90度超→ペナルティ適用 | 3地点が折り返し配置 | spots: 3件（直線上にA-B-C、Bで180度折り返し）, origin | 折り返しを避けるルート（A→B→Cまたは逆） | C6: angleDiff > π/2 → ペナルティ | 正常 | P1 |
| UT-OPR-009 | 方向転換なし（直線ルート）→ペナルティなし | 3地点が直線配置 | spots: 3件（東西に一直線）, origin=西端 | 西→東の一方向ルート | C6: angleDiff ≈ 0 → ペナルティなし | 正常 | P2 |
| UT-OPR-010 | 同カテゴリ連続→スワップ発生 | カテゴリ: A,A,B | spots: 3件（ルート最適化後に同カテゴリ連続） | A,B,Aの順にスワップ | C7=T → スワップ実行 | 正常 | P1 |
| UT-OPR-011 | 同カテゴリ連続だがスワップ先なし→変更なし | カテゴリ: A,A,A | spots: 3件（全て同カテゴリ） | 並び順変更なし（スワップ先が見つからない） | C7=T、スワップ候補なし | 正常 | P2 |
| UT-OPR-012 | origin未指定→nodes[0]を起点とする | originなし | spots: 3件, origin: `undefined` | 最初のノードを起点として最短ルート計算 | origin ?? nodes[0] フォールバック | 正常 | P2 |
| UT-OPR-013 | 同一ビル3スポット→1ノードにまとめ | ビルA×3+ビルなし×1 | spots: 4件（うち3件同一building） | 同一ビル3件が連続配置 | C4: indices.length(3)>=2 → T | 正常 | P2 |
| UT-OPR-014 | 異なるビル各2スポット→各ビル内で連続 | ビルA×2+ビルB×2 | spots: 4件（2ビル×2件） | ビルAの2件が連続、ビルBの2件が連続 | 複数ビルグループの独立処理 | 正常 | P2 |
| UT-OPR-015 | 同一ビル1件のみ→ソロノード扱い | ビルA×1+ビルなし×2 | spots: 3件（ビルAは1件のみ） | ビルAの1件はソロ扱い（C4=F） | C4: indices.length(1)>=2 → F | 境界 | P2 |

---

### 3.5 buildCacheKey（キャッシュキー生成）

**関数シグネチャ:** `buildCacheKey(params: SpotSearchParams): string`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `params.origin` が truthy | HAS_ORIGIN |
| C2: `params.walkRangeMinutes` が定義済み | HAS_WALK |
| C3: `params.locationType` が定義済み | HAS_LOC |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BCK-001 | origin指定あり→座標がキーに含まれる | - | origin: `{lat:35.6812,lng:139.7671}`, walkRangeMinutes: 15, locationType: `'屋内'` | `"35.681,139.767,15,屋内"` | C1=T, C2=T, C3=T | 正常 | P1 |
| UT-BCK-002 | origin未指定→'none'がキーに含まれる | - | origin: `undefined`, walkRangeMinutes: 20, locationType: `'屋外'` | `"none,none,20,屋外"` | C1=F → 'none' | 正常 | P1 |
| UT-BCK-003 | walkRangeMinutes未指定→デフォルト20 | - | origin: `{lat:35.0,lng:139.0}`, walkRangeMinutes: `undefined`, locationType: `'屋内'` | `"35.000,139.000,20,屋内"` | C2=F → ?? 20 | 境界 | P1 |
| UT-BCK-004 | locationType未指定→デフォルト'both' | - | origin: `{lat:35.0,lng:139.0}`, walkRangeMinutes: 10, locationType: `undefined` | `"35.000,139.000,10,both"` | C3=F → ?? 'both' | 境界 | P1 |
| UT-BCK-005 | 全パラメータ未指定→デフォルト値のキー | - | origin: `undefined`, walkRangeMinutes: `undefined`, locationType: `undefined` | `"none,none,20,both"` | C1=F,C2=F,C3=F | 境界 | P2 |
| UT-BCK-006 | 座標が小数3桁で丸められる（四捨五入） | - | origin: `{lat:35.68149,lng:139.76709}` | lat=`"35.681"`, lng=`"139.767"` | Math.round丸め検証 | 正常 | P1 |
| UT-BCK-007 | 座標が小数3桁で丸められる（切り上げ境界） | - | origin: `{lat:35.68150,lng:139.76750}` | lat=`"35.682"`, lng=`"139.768"` | 丸め境界値 | 境界 | P2 |
| UT-BCK-008 | 負の座標→正しく処理される | - | origin: `{lat:-33.8688,lng:151.2093}` | `"-33.869,151.209,20,both"` | 負値の丸め処理 | 境界 | P2 |
| UT-BCK-009 | 座標0,0→正しく処理される | - | origin: `{lat:0,lng:0}` | `"0.000,0.000,20,both"` | ゼロ座標（falsy注意だがオブジェクト存在） | 境界 | P2 |
| UT-BCK-010 | 同一エリアの異なるパラメータ→異なるキー | - | params1: walk=15, params2: walk=20（他同一） | 異なるキー文字列 | walkの差異がキーに反映 | 正常 | P2 |

---

### 3.6 getCachedSpots（キャッシュ取得）

**関数シグネチャ:** `getCachedSpots(key: string): DbSpot[] | null`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `entry` が存在する | ENTRY_EXISTS |
| C2: `Date.now() - entry.timestamp > CACHE_TTL_MS` | EXPIRED |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-GCS-001 | キャッシュ未登録→nullを返す | spotCacheが空 | key: `"35.681,139.767,20,both"` | `null` | C1=F → return null | 正常 | P1 |
| UT-GCS-002 | 有効なキャッシュ存在→データを返す | 5分前にキャッシュ登録済 | key: 登録済キー | DbSpot配列 | C1=T, C2=F → return data | 正常 | P1 |
| UT-GCS-003 | TTL超過のキャッシュ→nullを返しキャッシュ削除 | 11分前にキャッシュ登録済 | key: 登録済キー | `null`（かつspotCacheから削除される） | C1=T, C2=T → delete & return null | 正常 | P1 |
| UT-GCS-004 | TTLちょうど（10分）→nullを返さない | 10分ちょうど前に登録（Date.now()-timestamp === CACHE_TTL_MS） | key: 登録済キー | DbSpot配列（`>` なので等しい場合は有効） | C2: === はF（> で判定） | 境界 | P1 |
| UT-GCS-005 | TTL直後（10分1ミリ秒）→nullを返す | 10分1ミリ秒前に登録 | key: 登録済キー | `null` | C2: 600001 > 600000 → T | 境界 | P1 |
| UT-GCS-006 | 異なるキーでアクセス→nullを返す | "key-A"で登録済 | key: `"key-B"` | `null` | C1=F（別キー） | 正常 | P2 |
| UT-GCS-007 | 空配列がキャッシュされている→空配列を返す | 空配列を登録済 | key: 登録済キー | `[]`（空配列、nullではない） | data=[] だが有効キャッシュ | 境界 | P2 |

---

### 3.7 parseBuildingName（ビル名パース）

**関数シグネチャ:** `parseBuildingName(address: string | null): string | undefined`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `!address` (null/undefined/空文字) | NO_ADDR |
| C2: `AREA_SUFFIX_RE.test(address)` (丁目付近) | AREA_SUFFIX |
| C3: `address.match(BUILDING_RE)` (番地+スペース+ビル名パターン) | HAS_BUILDING |
| C4: `!building \|\| building.length < 2` (ビル名が短すぎ) | TOO_SHORT |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-PBN-001 | address=null→undefinedを返す | - | address: `null` | `undefined` | C1=T → 早期return | 異常 | P1 |
| UT-PBN-002 | address=undefined→undefinedを返す | - | address: `undefined` | `undefined` | C1=T → 早期return | 異常 | P1 |
| UT-PBN-003 | address=空文字列→undefinedを返す | - | address: `""` | `undefined` | C1=T（!""=true） | 異常 | P2 |
| UT-PBN-004 | 丁目付近パターン→undefinedを返す | - | address: `"東京都渋谷区神宮前1丁目付近"` | `undefined` | C2=T → 早期return | 正常 | P1 |
| UT-PBN-005 | 番地+ビル名パターン→ビル名を抽出する | - | address: `"東京都渋谷区神宮前1-2-3 渋谷ヒカリエ"` | `"渋谷ヒカリエ"` | C1=F,C2=F,C3=T,C4=F | 正常 | P1 |
| UT-PBN-006 | 番地+ビル名+フロア→フロア除去してビル名を返す | - | address: `"東京都渋谷区道玄坂1-2-3 渋谷ビル3F"` | `"渋谷ビル"` | FLOOR_RE除去 | 正常 | P1 |
| UT-PBN-007 | 番地+ビル名+階表記→階除去してビル名を返す | - | address: `"東京都港区六本木1-2-3 六本木ヒルズ10階"` | `"六本木ヒルズ"` | FLOOR_RE「階」パターン | 正常 | P2 |
| UT-PBN-008 | 番地+ビル名+B1F→地下階除去してビル名を返す | - | address: `"東京都新宿区新宿3-4-5 ルミネエスト B1F"` | `"ルミネエスト"` | FLOOR_RE「B1F」パターン | 正常 | P2 |
| UT-PBN-009 | 番地のみ（ビル名なし）→undefinedを返す | - | address: `"東京都渋谷区神宮前1-2-3"` | `undefined` | C3=F → match失敗 | 正常 | P1 |
| UT-PBN-010 | ビル名が1文字→undefinedを返す | - | address: `"東京都渋谷区1-2-3 A"` | `undefined` | C4=T: length(1)<2 | 境界 | P2 |
| UT-PBN-011 | ビル名が2文字→ビル名を返す | - | address: `"東京都渋谷区1-2-3 AB"` | `"AB"` | C4=F: length(2)>=2（境界） | 境界 | P2 |
| UT-PBN-012 | フロア除去後に空文字→undefinedを返す | - | address: `"東京都渋谷区1-2-3 3F"` | `undefined` | FLOOR_RE除去後building="" → C4=T | 境界 | P2 |
| UT-PBN-013 | 全角ハイフン番地→正しくパースされる | - | address: `"東京都渋谷区神宮前1−2-3 渋谷ビル"` | `"渋谷ビル"`（正規表現`[-−]`で全角対応） | BUILDING_RE全角ハイフン | 正常 | P2 |
| UT-PBN-014 | スペースなしの住所→undefinedを返す | - | address: `"東京都渋谷区神宮前1-2-3渋谷ビル"` | `undefined` | C3=F: スペースなし → match失敗 | 境界 | P2 |
| UT-PBN-015 | 番地にハイフンが1つのみ→正しくマッチ | - | address: `"東京都渋谷区1-2 渋谷ビル"` | `"渋谷ビル"` | BUILDING_RE `\d[-−]\d+` のパターンマッチ | 正常 | P3 |

---

### 3.8 distanceKm（距離計算）

**関数シグネチャ:** `distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number`

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-DST-001 | 同一地点→距離0kmを返す | - | lat1:35.6812, lon1:139.7671, lat2:35.6812, lon2:139.7671 | `0` | dLat=0, dLon=0 → 0 | 境界 | P1 |
| UT-DST-002 | 東京駅-渋谷駅→約3.3km | - | lat1:35.6812, lon1:139.7671, lat2:35.6580, lon2:139.7016 | 約6.0km（±0.5km） | 実際の距離との整合性 | 正常 | P1 |
| UT-DST-003 | 極座標（北極点-南極点）→約20015km | - | lat1:90, lon1:0, lat2:-90, lon2:0 | 約20015km（地球半周） | 最大緯度差 | 境界 | P2 |
| UT-DST-004 | 経度180度差→約20015km（赤道上） | - | lat1:0, lon1:0, lat2:0, lon2:180 | 約20015km | 最大経度差（赤道上） | 境界 | P2 |
| UT-DST-005 | 負の座標（南半球）→正の距離を返す | - | lat1:-33.8688, lon1:151.2093, lat2:-33.8600, lon2:151.2100 | 正の値（約0.98km） | 負座標の計算 | 正常 | P2 |
| UT-DST-006 | 近距離（100m以内）→正確に計算 | - | lat1:35.6812, lon1:139.7671, lat2:35.6820, lon2:139.7675 | 約0.09km（約90m） | 微小距離の精度 | 正常 | P1 |
| UT-DST-007 | 緯度のみ異なる→距離が正しい | - | lat1:35.0, lon1:139.0, lat2:36.0, lon2:139.0 | 約111km（緯度1度≈111km） | 経度差0のケース | 正常 | P2 |
| UT-DST-008 | 経度のみ異なる→距離が正しい | - | lat1:35.0, lon1:139.0, lat2:35.0, lon2:140.0 | 約91km（緯度35度での経度1度） | 緯度差0のケース | 正常 | P2 |
| UT-DST-009 | 引数が全て0→距離0を返す | - | lat1:0, lon1:0, lat2:0, lon2:0 | `0` | 全ゼロ入力 | 境界 | P2 |
| UT-DST-010 | 対称性:dist(A,B) === dist(B,A) | - | A→B と B→A | 同一値 | Haversine公式の対称性 | 正常 | P2 |

---

### 3.9 walkMinToKm（歩行距離変換）

**関数シグネチャ:** `walkMinToKm(minutes: number): number`

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-WTK-001 | 0分→0kmを返す | - | minutes: 0 | `0` | 境界値（ゼロ入力） | 境界 | P1 |
| UT-WTK-002 | 1分→0.08kmを返す | - | minutes: 1 | `0.08` | 最小正値 | 正常 | P1 |
| UT-WTK-003 | 10分→0.8kmを返す | - | minutes: 10 | `0.8` | 標準的な入力 | 正常 | P1 |
| UT-WTK-004 | 20分→1.6kmを返す（デフォルト値） | - | minutes: 20 | `1.6` | デフォルトwalkRange | 正常 | P1 |
| UT-WTK-005 | 60分→4.8kmを返す（1時間） | - | minutes: 60 | `4.8` | 60分 = 4.8km/h * 1h | 正常 | P2 |
| UT-WTK-006 | 負の値→負のkmを返す | - | minutes: -5 | `-0.4` | 不正入力（バリデーションなし） | 異常 | P2 |
| UT-WTK-007 | 小数入力→正しく計算 | - | minutes: 12.5 | `1.0` | 小数分の処理 | 境界 | P2 |

---

### 3.10 getCategoryGroup（カテゴリ正規化）

**関数シグネチャ:** `getCategoryGroup(cat: string | null): string`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `cat` が null | CAT_NULL |
| C2: `CATEGORY_GROUP[cat]` が存在する | CAT_MAPPED |

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-CGG-001 | cafe→カフェ | - | cat: `'cafe'` | `'カフェ'` | C2=T: マッピング存在 | 正常 | P1 |
| UT-CGG-002 | bar→バー | - | cat: `'bar'` | `'バー'` | C2=T | 正常 | P1 |
| UT-CGG-003 | clothes→ファッション | - | cat: `'clothes'` | `'ファッション'` | C2=T | 正常 | P2 |
| UT-CGG-004 | zakka→雑貨 | - | cat: `'zakka'` | `'雑貨'` | C2=T | 正常 | P2 |
| UT-CGG-005 | shopping→ショッピング | - | cat: `'shopping'` | `'ショッピング'` | C2=T | 正常 | P2 |
| UT-CGG-006 | museum→ミュージアム | - | cat: `'museum'` | `'ミュージアム'` | C2=T | 正常 | P2 |
| UT-CGG-007 | gallery→ギャラリー | - | cat: `'gallery'` | `'ギャラリー'` | C2=T | 正常 | P2 |
| UT-CGG-008 | garden→自然 | - | cat: `'garden'` | `'自然'` | C2=T | 正常 | P2 |
| UT-CGG-009 | park→自然 | - | cat: `'park'` | `'自然'` | C2=T（gardenと同グループ） | 正常 | P2 |
| UT-CGG-010 | amusement→エンタメ | - | cat: `'amusement'` | `'エンタメ'` | C2=T | 正常 | P2 |
| UT-CGG-011 | entertainment→エンタメ | - | cat: `'entertainment'` | `'エンタメ'` | C2=T（amusementと同グループ） | 正常 | P2 |
| UT-CGG-012 | zoo→いきもの | - | cat: `'zoo'` | `'いきもの'` | C2=T | 正常 | P2 |
| UT-CGG-013 | aquarium→いきもの | - | cat: `'aquarium'` | `'いきもの'` | C2=T（zooと同グループ） | 正常 | P2 |
| UT-CGG-014 | temple→寺社 | - | cat: `'temple'` | `'寺社'` | C2=T | 正常 | P2 |
| UT-CGG-015 | town→まち歩き | - | cat: `'town'` | `'まち歩き'` | C2=T | 正常 | P2 |
| UT-CGG-016 | spa→リラックス | - | cat: `'spa'` | `'リラックス'` | C2=T | 正常 | P2 |
| UT-CGG-017 | restaurant→グルメ | - | cat: `'restaurant'` | `'グルメ'` | C2=T | 正常 | P2 |
| UT-CGG-018 | landmark→ランドマーク | - | cat: `'landmark'` | `'ランドマーク'` | C2=T | 正常 | P2 |
| UT-CGG-019 | sports→スポーツ | - | cat: `'sports'` | `'スポーツ'` | C2=T | 正常 | P2 |
| UT-CGG-020 | null→「その他」を返す | - | cat: `null` | `'その他'` | C1=T → cat ?? '' → CATEGORY_GROUP[''] ?? cat ?? 'その他' | 境界 | P1 |
| UT-CGG-021 | 未定義カテゴリ→そのまま返す | - | cat: `'unknown_cat'` | `'unknown_cat'` | C2=F → CATEGORY_GROUP[cat] ?? cat | 正常 | P1 |
| UT-CGG-022 | 空文字列→「その他」を返す | - | cat: `''` | `'その他'` | CATEGORY_GROUP[''] = undefined → '' ?? 'その他' → '' は falsy ではないので '' が返る。ただし `'' ?? 'その他'` → `''`（??はnull/undefinedのみ）。実装確認必要 | 境界 | P2 |

---

### 3.11 buildPlan（プラン組み立て）

**関数シグネチャ:** `buildPlan(rawSpots: DbSpot[], params: SpotSearchParams, visitedIds: string[]): PlanSpot[]`

**MC/DC条件分析:**

| 条件 | 略称 |
|------|------|
| C1: `excludeSet.has(spot.source_id)` | EXCLUDED |
| C2: `pinnedIds.has(spot.source_id)` | IS_PINNED_SPOT |
| C3: `!isOpen(spot, ...)` | NOT_OPEN |
| C4: `scored` が null | SCORE_NULL |
| C5: `candidates.length > 0` | HAS_CANDIDATES |
| C6: `allSpots.length === 0` | NO_SPOTS |
| C7: `isPinned` (ループ内) | LOOP_PINNED |
| C8: `result.length >= 2 && endTimeCheck > deadline` | TIME_OVER |
| C9: `sameBuilding` | SAME_BLDG |

#### 3.11.1 基本動作テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-001 | rawSpots空→空配列を返す | - | rawSpots: `[]`, params: 基本, visitedIds: `[]` | `[]` | C5=F,C6=T → return [] | 境界 | P1 |
| UT-BPL-002 | 全スポットがexcludeSetに含まれる→空配列 | - | rawSpots: 3件, excludeSpotIds: 全IDを含む | `[]` | C1=T: 全件除外 → candidates空 → C6=T | 正常 | P1 |
| UT-BPL-003 | 全スポットがvisitedIdsに含まれる→空配列 | - | rawSpots: 3件, visitedIds: 全IDを含む | `[]` | C1=T: visitedIds除外 | 正常 | P1 |
| UT-BPL-004 | 全スポットが営業時間外→空配列 | currentHour=3, 全スポット10:00-20:00 | rawSpots: 3件（全て閉店中） | `[]` | C3=T: 全件営業外 | 正常 | P1 |
| UT-BPL-005 | 正常なスポット群→PlanSpot配列を返す | currentHour=14 | rawSpots: 10件（有効）, availableTime: 120 | PlanSpot配列（2件以上） | 正常系フルパス | 正常 | P1 |
| UT-BPL-006 | scoreSpotがnullを返すスポットは除外 | name=nullのスポットを含む | rawSpots: 5件（うち2件name=null） | 有効な3件のみ候補 | C4=T: scored===null → skip | 正常 | P2 |

#### 3.11.2 availableTime境界値テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-010 | availableTime=30分→targetSpots=2 | 有効なスポット10件 | availableTime: 30 | `Math.max(2, Math.min(6, Math.round(30/35)))` = 2 → 結果2件程度 | targetSpots計算: round(0.86)=1 → max(2,1)=2 | 境界 | P1 |
| UT-BPL-011 | availableTime=60分→targetSpots=2 | 有効なスポット10件 | availableTime: 60 | `Math.max(2, Math.min(6, Math.round(60/35)))` = 2 → 結果2件程度 | targetSpots: round(1.71)=2 → max(2,2)=2 | 境界 | P1 |
| UT-BPL-012 | availableTime=120分→targetSpots=3 | 有効なスポット10件 | availableTime: 120 | `Math.max(2, Math.min(6, Math.round(120/35)))` = 3 → 結果3件程度 | targetSpots: round(3.43)=3 | 正常 | P1 |
| UT-BPL-013 | availableTime=240分→targetSpots=6 | 有効なスポット10件 | availableTime: 240 | `Math.max(2, Math.min(6, Math.round(240/35)))` = 6 → 結果6件程度 | targetSpots: round(6.86)=7 → min(6,7)=6 | 境界 | P1 |
| UT-BPL-014 | availableTime=360分→targetSpots=6（上限） | 有効なスポット10件 | availableTime: 360 | `Math.max(2, Math.min(6, Math.round(360/35)))` = 6 → 結果6件程度 | targetSpots: round(10.3)=10 → min(6,10)=6 | 境界 | P1 |

#### 3.11.3 ピン留めテスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-020 | ピン留め0件→全て新規スポットで構成 | - | pinnedSpots: `[]`, rawSpots: 10件, availableTime: 120 | 結果に全て新規スポット | pinned.length=0, newSpotsNeeded=targetSpots | 正常 | P1 |
| UT-BPL-021 | ピン留め1件→残り枠を新規で埋める | - | pinnedSpots: 1件, rawSpots: 10件, availableTime: 120 | 結果にピン留め1件+新規スポット | pinnedIds除外, newSpotsNeeded=targetSpots-1 | 正常 | P1 |
| UT-BPL-022 | ピン留めがtargetSpots数と同数→新規1件は最低確保 | - | pinnedSpots: 3件, rawSpots: 10件, availableTime: 120 | 結果にピン留め3件+新規最低1件 | newSpotsNeeded=max(1, 3-3)=1 | 正常 | P1 |
| UT-BPL-023 | ピン留めがtargetSpotsを超過→新規1件は最低確保 | - | pinnedSpots: 5件, rawSpots: 10件, availableTime: 60 | 結果にピン留め5件+新規最低1件 | targetSpots=2, newSpotsNeeded=max(1,2-5)=1 | 境界 | P1 |
| UT-BPL-024 | ピン留めスポットが rawSpots にも存在→重複しない | - | pinnedSpots: 1件（ID="A"）, rawSpots: 含ID="A" | 結果にID="A"は1回のみ | C2=T: pinnedIds.has → skip | 正常 | P2 |
| UT-BPL-025 | ピン留めスポットは時間超過でも必ず含まれる | deadline近い状況 | pinnedSpots: 1件, availableTime: 30（タイト） | 結果にピン留めスポットが含まれる | C7=T: isPinned → deadlineチェック skip | 正常 | P1 |

#### 3.11.4 deadline超過テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-030 | deadline内に全スポット収まる→全件含む | availableTime十分 | availableTime: 360, rawSpots: 3件（各30分） | 全3件がresultに含まれる | C8: endTimeCheck <= deadline → break発生せず | 正常 | P1 |
| UT-BPL-031 | deadline超過で打ち切り→超過分は含まない | availableTimeタイト | availableTime: 60, rawSpots: 10件（各30分） | 2件でbreak（result.length>=2 && 超過） | C8=T: deadline超過 → break | 正常 | P1 |
| UT-BPL-032 | result.length<2の間はdeadline超過でも含む | availableTimeタイト | availableTime: 30, rawSpots: 10件（各30分） | 最低2件は含む（result.length<2ではbreakしない） | C8: result.length>=2 が F → breakしない | 境界 | P1 |
| UT-BPL-033 | 10%のオーバー許容の確認 | deadline = startTime + availableTime*1.1*60*1000 | availableTime: 100, スポット合計110分 | 110分 <= 100*1.1=110分 → 含まれる | deadline計算: *1.1の確認 | 境界 | P2 |

#### 3.11.5 同一ビル内移動時間テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-040 | 同一ビル内の連続スポット→移動時間0 | 連続2スポットが同一building | rawSpots含: building="渋谷ヒカリエ"×2 | 2つ目のスポットのwalkMin=0 | C9=T: sameBuilding → walkMin=0 | 正常 | P1 |
| UT-BPL-041 | 異なるビルのスポット→移動時間>0 | 連続2スポットが異なるbuilding | rawSpots含: building="ビルA","ビルB" | 2つ目のスポットのwalkMin>=3 | C9=F: sameBuilding=false | 正常 | P1 |
| UT-BPL-042 | buildingがundefinedの連続スポット→移動時間>0 | 両方building未設定 | rawSpots含: building=undefined×2 | 2つ目のスポットのwalkMin>=3 | C9=F: undefined === undefined → false（item.building=falsy） | 正常 | P2 |
| UT-BPL-043 | 最初のスポット×origin指定あり→移動時間計算 | origin指定 | origin: `{lat:35.68,lng:139.77}`, 最初のスポットlat:35.69 | walkMin = Math.max(3, ceil(dist*1000/80)) | i===0 && params.origin → 距離ベース計算 | 正常 | P1 |
| UT-BPL-044 | 最初のスポット×origin未指定→移動時間0 | originなし | origin: `undefined` | walkMin=0（i===0でelse ifに入らない） | i===0 && !params.origin → walkMin=0 | 境界 | P2 |

#### 3.11.6 タイムテーブル生成テスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-050 | currentMinute=0→開始時刻は0分 | - | currentHour: 14, currentMinute: 0 | startMinute=0, 最初のtime="14:00"前後 | ceil(0/15)*15=0 | 正常 | P1 |
| UT-BPL-051 | currentMinute=1→開始時刻は15分に切り上げ | - | currentHour: 14, currentMinute: 1 | startMinute=15, 最初のtime="14:15"前後 | ceil(1/15)*15=15 | 境界 | P1 |
| UT-BPL-052 | currentMinute=15→開始時刻は15分 | - | currentHour: 14, currentMinute: 15 | startMinute=15 | ceil(15/15)*15=15 | 境界 | P2 |
| UT-BPL-053 | currentMinute=59→開始時刻は60分（次の時間） | - | currentHour: 14, currentMinute: 59 | startMinute=60, 最初のtime="15:00"前後 | ceil(59/15)*15=60 | 境界 | P2 |
| UT-BPL-054 | currentMinute未指定→デフォルト0 | - | currentMinute: `undefined` | minute=0として計算 | ?? 0 のフォールバック | 境界 | P2 |

#### 3.11.7 PlanSpot出力フォーマットテスト

| テストID | テスト名 | 前提条件 | 入力値 | 期待結果 | MC/DC条件 | テスト区分 | 優先度 |
|----------|----------|----------|--------|----------|-----------|------------|--------|
| UT-BPL-060 | PlanSpotの全フィールドが正しく設定される | 有効なスポット1件 | rawSpots: 1件（全フィールド入力済） | id, name, category, description, time, duration, lat, lng, website, address, building が正しく設定 | 出力フォーマット検証 | 正常 | P1 |
| UT-BPL-061 | detail=nullの場合description=空文字列 | - | spot.detail: `null` | description: `''` | `spot.detail ?? ''` | 境界 | P2 |
| UT-BPL-062 | website=nullの場合undefinedが設定される | - | spot.website: `null` | website: `undefined` | `spot.website \|\| undefined` | 境界 | P2 |
| UT-BPL-063 | website=空文字列の場合undefinedが設定される | - | spot.website: `''` | website: `undefined` | `'' \|\| undefined` → undefined | 境界 | P2 |
| UT-BPL-064 | address=nullの場合undefinedが設定される | - | spot.address: `null` | address: `undefined` | `spot.address \|\| undefined` | 境界 | P2 |
| UT-BPL-065 | categoryはgetCategoryGroupで正規化される | - | spot.category: `'cafe'` | category: `'カフェ'` | getCategoryGroup適用確認 | 正常 | P1 |
| UT-BPL-066 | durationはestimated_stay_minを使用 | - | spot.estimated_stay_min: 45 | duration: 45 | そのまま設定 | 正常 | P2 |
| UT-BPL-067 | estimated_stay_min=nullの場合30分 | - | spot.estimated_stay_min: `null` | duration: 30 | `?? 30` フォールバック | 境界 | P2 |

---

## 4. MC/DC充足マトリクス

各関数の判定について、MC/DC が充足されていることを確認する。

### 4.1 isOpen MC/DC充足確認

#### Decision ISO-D2: `!spot.starttime || !spot.closetime`

| テストケース | C2 (starttime null) | C3 (closetime null) | Decision結果 |
|------------|-----|-----|---------|
| UT-ISO-004 | T | F | T（C2の独立影響: T→T, F→後続へ） |
| UT-ISO-005 | F | T | T（C3の独立影響: T→T, F→後続へ） |
| UT-ISO-009 | F | F | F（後続の判定へ進む） |

- C2の独立影響: UT-ISO-004(T→T) vs UT-ISO-009(F→F) -- C3=F固定で確認
- C3の独立影響: UT-ISO-005(T→T) vs UT-ISO-009(F→F) -- C2=F固定で確認

#### Decision ISO-D4: `cur >= open || cur < close` （日付跨ぎ時）

| テストケース | C5 (cur >= open) | C6 (cur < close) | Decision結果 |
|------------|-----|-----|---------|
| UT-ISO-015 | T | F | T（C5の独立影響） |
| UT-ISO-016 | F | T | T（C6の独立影響） |
| UT-ISO-018 | F | F | F |

- C5の独立影響: UT-ISO-015(T→T) vs UT-ISO-018(F→F) -- C6=F固定で確認
- C6の独立影響: UT-ISO-016(T→T) vs UT-ISO-018(F→F) -- C5=F固定で確認

#### Decision ISO-D5: `cur >= open && cur < close` （通常時）

| テストケース | C5 (cur >= open) | C6 (cur < close) | Decision結果 |
|------------|-----|-----|---------|
| UT-ISO-009 | T | T | T |
| UT-ISO-007 | F | T | F（C5の独立影響） |
| UT-ISO-011 | T | F | F（C6の独立影響） |

- C5の独立影響: UT-ISO-009(T→T) vs UT-ISO-007(F→F) -- C6=T固定で確認
- C6の独立影響: UT-ISO-009(T→T) vs UT-ISO-011(F→F) -- C5=T固定で確認

### 4.2 scoreSpot MC/DC充足確認

#### Decision SCR-D1: `!spot.name || !spot.lat || !spot.lon`

| テストケース | C1 (!name) | C2 (!lat) | C3 (!lon) | Decision結果 |
|------------|-----|-----|-----|---------|
| UT-SCR-001 | T | F | F | T（C1の独立影響） |
| UT-SCR-002 | F | T | F | T（C2の独立影響） |
| UT-SCR-003 | F | F | T | T（C3の独立影響） |
| UT-SCR-007 | F | F | F | F |

- C1の独立影響: UT-SCR-001(T→T) vs UT-SCR-007(F→F) -- C2=F,C3=F固定
- C2の独立影響: UT-SCR-002(T→T) vs UT-SCR-007(F→F) -- C1=F,C3=F固定
- C3の独立影響: UT-SCR-003(T→T) vs UT-SCR-007(F→F) -- C1=F,C2=F固定

#### Decision SCR-D2: `isNaN(lat) || isNaN(lon)`

| テストケース | C1 (isNaN lat) | C2 (isNaN lon) | Decision結果 |
|------------|-----|-----|---------|
| UT-SCR-005 | T | F | T（C1の独立影響） |
| UT-SCR-006 | F | T | T（C2の独立影響） |
| UT-SCR-007 | F | F | F |

- C1の独立影響: UT-SCR-005(T→T) vs UT-SCR-007(F→F)
- C2の独立影響: UT-SCR-006(T→T) vs UT-SCR-007(F→F)

### 4.3 buildPlan MC/DC充足確認

#### Decision BPL-D8: `result.length >= 2 && endTimeCheck > deadline`

| テストケース | C1 (result.length>=2) | C2 (endTimeCheck>deadline) | Decision結果 |
|------------|-----|-----|---------|
| UT-BPL-031 | T | T | T（break発生） |
| UT-BPL-032 | F | T | F（C1の独立影響） |
| UT-BPL-030 | T | F | F（C2の独立影響） |

- C1の独立影響: UT-BPL-031(T→T) vs UT-BPL-032(F→F) -- C2=T固定
- C2の独立影響: UT-BPL-031(T→T) vs UT-BPL-030(F→F) -- C1=T固定

---

## 5. テストデータ定義

### 5.1 基本スポット（共通テストフィクスチャ）

```typescript
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
```

### 5.2 基本検索パラメータ（共通テストフィクスチャ）

```typescript
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
```

### 5.3 バー用スポット

```typescript
const BAR_SPOT: DbSpot = {
  ...BASE_SPOT,
  source_id: 'test-bar-001',
  name: 'テストバー',
  category: 'bar',
  starttime: '18:00',
  closetime: '02:00',
};
```

### 5.4 レストラン用スポット

```typescript
const RESTAURANT_SPOT: DbSpot = {
  ...BASE_SPOT,
  source_id: 'test-restaurant-001',
  name: 'テストレストラン',
  category: 'restaurant',
  starttime: '11:00',
  closetime: '22:00',
};
```

### 5.5 ピン留めスポット

```typescript
const PINNED_PLAN_SPOT: PlanSpot = {
  id: 'pinned-001',
  name: 'ピン留めスポット',
  category: 'カフェ',
  description: 'ピン留めされたスポット',
  time: '14:00',
  duration: 30,
  lat: 35.6815,
  lng: 139.7670,
  website: undefined,
  address: '東京都渋谷区1-1-1 ピンビル',
  building: 'ピンビル',
};
```

---

## 6. テスト実施環境

| 項目 | 仕様 |
|------|------|
| テストフレームワーク | Jest / Vitest |
| 実行環境 | Node.js 20.x |
| モック戦略 | `Math.random()` はシードまたはモックで固定、`Date.now()` はfakeTimersで制御 |
| カバレッジ目標 | ステートメント: 100%, ブランチ: 100%, MC/DC: 100% |
| テスト実行CI | GitHub Actions（プッシュごとに自動実行） |

### 6.1 モック戦略詳細

| モック対象 | 方針 | 理由 |
|-----------|------|------|
| `Math.random()` | `jest.spyOn(Math, 'random').mockReturnValue(固定値)` | selectDiverseSpots, weightedRandomPickFromPool の決定性確保 |
| `Date.now()` | `jest.useFakeTimers()` で固定 | getCachedSpots のTTL判定テスト |
| `spotCache` | テストごとにクリア | テスト間の状態汚染防止 |
| `supabase` | モジュールモックで差し替え | DB依存を排除（buildPlanは直接テスト可能） |

---

## 7. テストケース総数

| 関数 | P1 | P2 | P3 | 合計 |
|------|----|----|----|----|
| isOpen | 14 | 7 | 0 | 21（※UT-ISO-025は追加ケース） |
| scoreSpot (除外) | 5 | 2 | 0 | 7 |
| scoreSpot (天気) | 6 | 6 | 0 | 12 |
| scoreSpot (スタイル) | 5 | 5 | 0 | 10 |
| scoreSpot (モード) | 8 | 12 | 0 | 20 |
| scoreSpot (時間帯) | 5 | 11 | 0 | 16 |
| scoreSpot (タグ) | 2 | 7 | 2 | 11 |
| scoreSpot (価格) | 3 | 3 | 0 | 6 |
| scoreSpot (滞在) | 2 | 2 | 0 | 4 |
| scoreSpot (複合) | 1 | 1 | 0 | 2 |
| selectDiverseSpots | 6 | 4 | 2 | 12 |
| optimizeRoute | 7 | 8 | 0 | 15 |
| buildCacheKey | 5 | 5 | 0 | 10 |
| getCachedSpots | 5 | 2 | 0 | 7 |
| parseBuildingName | 5 | 8 | 2 | 15 |
| distanceKm | 3 | 7 | 0 | 10 |
| walkMinToKm | 4 | 3 | 0 | 7 |
| getCategoryGroup | 3 | 18 | 0 | 21（※UT-CGG-022含む） |
| buildPlan (基本) | 5 | 1 | 0 | 6 |
| buildPlan (時間) | 5 | 0 | 0 | 5 |
| buildPlan (ピン) | 5 | 1 | 0 | 6 |
| buildPlan (deadline) | 3 | 1 | 0 | 4 |
| buildPlan (ビル) | 3 | 2 | 0 | 5 |
| buildPlan (タイムテーブル) | 2 | 3 | 0 | 5 |
| buildPlan (出力) | 2 | 6 | 0 | 8 |
| **合計** | **117** | **125** | **4** | **246** |

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2026-03-09 | 初版作成。MC/DC設計に基づく全11関数のテストケース定義 | - |
