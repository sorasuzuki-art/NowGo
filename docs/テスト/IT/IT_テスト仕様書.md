# NowGo Web Application 結合テスト (IT) 仕様書

| 項目 | 内容 |
|------|------|
| ドキュメントID | NOW-IT-SPEC-001 |
| プロジェクト名 | NowGo Web Application |
| バージョン | 1.0 |
| 作成日 | 2026-03-09 |
| 最終更新日 | 2026-03-09 |
| 作成者 | NowGo開発チーム |
| 承認者 | (未定) |
| テストレベル | 結合テスト (Integration Test) |
| 対象範囲 | 機能間連携テスト |

---

## 1. テスト概要

### 1.1 目的

本ドキュメントは、NowGo Web Application における結合テスト(IT: Integration Test)の仕様を定義する。各機能モジュールが正しく連携し、機能間のデータの受け渡しおよび状態遷移が設計通りに動作することを検証する。

### 1.2 テスト対象システム構成

| レイヤー | 技術要素 | 主要ファイル |
|----------|----------|-------------|
| フロントエンド | Next.js (App Router), React 18, TypeScript | `app/page.tsx` |
| 状態管理 | Zustand | `hooks/useNowgoStore.ts` |
| 認証 | Supabase Auth (Email/Password, Guest) | `lib/auth-context.tsx` |
| データベース | Supabase (PostgreSQL) | `lib/supabase.ts` |
| 検索エンジン | スコアリングアルゴリズム | `lib/spotSearch.ts` |
| 位置情報 | Geolocation API, Nominatim (逆ジオコーディング) | `lib/geocoding.ts` |
| データ保存 | Supabase DB + localStorage フォールバック | `lib/storage.ts` |

### 1.3 テスト対象画面一覧

| 画面名 | コンポーネント | 画面キー |
|--------|---------------|---------|
| 認証画面 | `AuthScreen` | `auth` |
| ダッシュボード | `DashboardScreen` | `dashboard` |
| クイックプラン | `QuickPlanScreen` | `quickplan` |
| テーマ | `ThemesScreen` | `themes` |
| プロフィール | `ProfileScreen` | `profile` |
| プラン表示 | `PlanScreen` | `plan` |
| プラン実行 | `ExecutionScreen` | `executing` |

### 1.4 テストID命名規則

```
IT-{機能略称}-{連番3桁}
```

| 機能略称 | 対象領域 |
|----------|---------|
| AUTH | 認証 -> 画面遷移連携 |
| PLAN | プラン生成 -> 表示連携 |
| EXEC | プラン実行 -> データ保存連携 |
| PROF | プロフィール -> 認証連携 |
| DB | DB -> スコアリング連携 |
| STA | 駅検索連携 |

### 1.5 優先度定義

| 優先度 | 定義 | テスト実施タイミング |
|--------|------|-------------------|
| P1 (Critical) | サービス提供に必須の機能。障害発生時にサービス停止を引き起こす | 毎回のリリース前に必ず実施 |
| P2 (High) | 主要機能に影響する連携。ユーザー体験に大きく影響 | リリース前および主要変更時に実施 |
| P3 (Medium) | 補助的機能の連携。代替手段が存在する | 定期テストサイクルで実施 |
| P4 (Low) | エッジケースまたは稀な操作パターン | 大規模リリース時に実施 |

### 1.6 テスト環境要件

| 項目 | 要件 |
|------|------|
| ブラウザ | Chrome 最新版, Safari 最新版 (iOS/macOS), Firefox 最新版 |
| デバイス | デスクトップ (1920x1080), モバイル (375x812 iPhone SE相当) |
| ネットワーク | HTTPS環境 (GPS機能テスト時), 安定したインターネット接続 |
| Supabaseプロジェクト | ステージング環境 (本番データと分離) |
| テストデータ | `spot`テーブルに最低100件のアクティブスポットデータ |
| テストアカウント | テスト用メールアドレス + パスワード (事前登録済み) |

---

## 2. IT-AUTH: 認証 -> 画面遷移連携テスト

### IT-AUTH-001: ログイン成功時のdashboard遷移

| 項目 | 内容 |
|------|------|
| テストID | IT-AUTH-001 |
| テスト名 | ログイン成功時のdashboard遷移 |
| テスト観点 | `signIn`関数の成功レスポンスを受けて、Zustand storeの`currentScreen`が`auth`から`dashboard`に遷移し、`DashboardScreen`コンポーネントがレンダリングされること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. テスト用ユーザーアカウントが`user_profiles`テーブルに存在する (email: `test@example.com`, password: `testPassword123`)
2. ユーザーは未ログイン状態である
3. `currentScreen`の初期値は`auth`である
4. ブラウザのCookieおよびlocalStorageはクリアされている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | アプリケーションにアクセス | `https://{staging-url}/` |
| 2 | AuthScreenが表示されることを確認 | - |
| 3 | Loginタブを選択 | 「Login」ボタンをクリック |
| 4 | メールアドレスを入力 | `test@example.com` |
| 5 | パスワードを入力 | `testPassword123` |
| 6 | ログインボタンをクリック | 「Login」送信ボタン |
| 7 | 遷移完了を待機 | 最大5秒 |

**期待結果:**
1. ステップ6実行後、ボタンが「処理中...」表示 (Loader2アイコン + disabled状態) になること
2. Supabase Auth APIから成功レスポンスが返却されること
3. `useAuth`フックの`user`オブジェクトが`null`から有効な`User`オブジェクトに更新されること
4. `useAuth`フックの`loading`が`false`になること
5. `app/page.tsx`の`useEffect`内で`user`が真値と判定され、`setScreen('dashboard')`が実行されること
6. `DashboardScreen`コンポーネントがレンダリングされ、ヘッダーに「Now Go」ロゴが表示されること
7. プロフィールボタンにユーザーのニックネームが表示されること
8. エラーメッセージが表示されないこと

---

### IT-AUTH-002: サインアップ成功時のdashboard遷移

| 項目 | 内容 |
|------|------|
| テストID | IT-AUTH-002 |
| テスト名 | サインアップ成功時のdashboard遷移 |
| テスト観点 | `signUp`関数の成功後、DBトリガー(`handle_new_user`)により`user_profiles`レコードが自動作成され、認証状態が確立されてdashboardに遷移すること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. テスト用メールアドレスが未登録である (例: `newuser_{timestamp}@example.com`)
2. ユーザーは未ログイン状態である
3. `currentScreen`の初期値は`auth`である

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | アプリケーションにアクセス | `https://{staging-url}/` |
| 2 | AuthScreenが表示されることを確認 | - |
| 3 | Sign Upタブを選択 | 「Sign Up」ボタンをクリック |
| 4 | ニックネームを入力 | `テストユーザー` |
| 5 | 生年月日を入力 | `2000-01-15` |
| 6 | 性別を選択 | 「その他」ボタンをクリック |
| 7 | メールアドレスを入力 | `newuser_{timestamp}@example.com` |
| 8 | パスワードを入力 | `securePassword123` |
| 9 | Sign Upボタンをクリック | 「Sign Up」送信ボタン |
| 10 | 遷移完了を待機 | 最大10秒 |

**期待結果:**
1. ステップ9実行後、ボタンが「処理中...」表示になること
2. Supabase Auth APIの`signUp`が成功すること
3. `user_profiles`テーブルに新規レコードが作成されること (DBトリガーによる自動作成)
4. 作成されたプロフィールに以下が含まれること:
   - `nickname`: `テストユーザー`
   - `gender`: `その他`
   - `birth_date`: `2000-01-15`
5. `DashboardScreen`がレンダリングされること
6. ヘッダーのプロフィールボタンに「テストユーザー」が表示されること

---

### IT-AUTH-003: ゲストログイン時のdashboard遷移

| 項目 | 内容 |
|------|------|
| テストID | IT-AUTH-003 |
| テスト名 | ゲストログイン時のdashboard遷移 |
| テスト観点 | `signInAsGuest`関数により`isGuest`フラグが`true`に設定され、Supabase認証なしでdashboardに遷移すること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. ユーザーは未ログイン状態である
2. `isGuest`の初期値は`false`である

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | アプリケーションにアクセス | `https://{staging-url}/` |
| 2 | AuthScreenが表示されることを確認 | - |
| 3 | 「ゲストとして続行」ボタンをクリック | - |
| 4 | 遷移完了を待機 | 最大3秒 |

**期待結果:**
1. `useAuth`フックの`isGuest`が`true`に更新されること
2. `useAuth`フックの`user`は`null`のままであること
3. `app/page.tsx`の`useEffect`内で`isGuest`が真値と判定されること
4. `DashboardScreen`がレンダリングされること
5. ヘッダーのプロフィールボタンに「ゲスト」と表示されること
6. Supabase Auth APIへのリクエストが発生しないこと

---

### IT-AUTH-004: ゲスト状態から認証画面経由でダッシュボードへ戻る

| 項目 | 内容 |
|------|------|
| テストID | IT-AUTH-004 |
| テスト名 | ゲスト状態から認証画面経由でダッシュボードへ戻る |
| テスト観点 | ゲストモード中にAuthScreenを表示した場合、「ゲストに戻る」ボタンが表示され、クリックでdashboardに戻ること |
| 優先度 | P2 (High) |

**前提条件:**
1. ユーザーはゲストモードでログイン済み (`isGuest === true`)
2. `currentScreen`は`dashboard`である

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | プロフィール画面に遷移 | ヘッダーのプロフィールボタンをクリック |
| 2 | 「会員登録・ログイン」ボタンをクリック | - |
| 3 | AuthScreenが表示されることを確認 | - |
| 4 | 「ゲストに戻る」ボタン (ArrowLeft + テキスト) の存在を確認 | - |
| 5 | 「ゲストに戻る」ボタンをクリック | - |

**期待結果:**
1. ステップ3でAuthScreen上部に「ゲストに戻る」ボタンが表示されること (`isGuest`条件による条件付きレンダリング)
2. ステップ5で`setScreen('dashboard')`が実行されること
3. `DashboardScreen`がレンダリングされること
4. `isGuest`は`true`のまま維持されること
5. ゲストモードの制限が引き続き適用されること

---

### IT-AUTH-005: ログアウト時のauth遷移

| 項目 | 内容 |
|------|------|
| テストID | IT-AUTH-005 |
| テスト名 | ログアウト時のauth遷移 |
| テスト観点 | `signOut`関数がSupabase Auth APIのサインアウトを実行し、`user`/`profile`/`isGuest`がクリアされ、auth画面に遷移すること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. ユーザーはメールアドレスでログイン済みである
2. `currentScreen`は`dashboard`である

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | プロフィール画面に遷移 | ヘッダーのプロフィールボタンをクリック |
| 2 | 画面下部の「ログアウト」ボタンをクリック | - |
| 3 | 確認ダイアログが表示されることを確認 | - |
| 4 | 「ログアウト」ボタンをクリック (確認ダイアログ内) | - |
| 5 | 遷移完了を待機 | 最大5秒 |

**期待結果:**
1. ステップ3で確認ダイアログ「ログアウトしますか？」が表示されること
2. `supabase.auth.signOut()`が呼び出されること
3. `user`が`null`に設定されること
4. `profile`が`null`に設定されること
5. `isGuest`が`false`に設定されること
6. `ProfileScreen`内の`handleSignOut`で`setScreen('auth')`が実行されること
7. `AuthScreen`がレンダリングされること
8. Supabaseのセッショントークンがクリアされること

---

### IT-AUTH-006: セッション切れ時のauth遷移

| 項目 | 内容 |
|------|------|
| テストID | IT-AUTH-006 |
| テスト名 | セッション切れ時のauth遷移 |
| テスト観点 | Supabase Authのセッショントークンが失効した場合、`onAuthStateChange`イベントが発火し、自動的にauth画面に遷移すること |
| 優先度 | P2 (High) |

**前提条件:**
1. ユーザーはメールアドレスでログイン済みである
2. `currentScreen`は`dashboard`である

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | DashboardScreenが表示されていることを確認 | - |
| 2 | ブラウザのDevToolsを開く | Application > Storage |
| 3 | Supabaseのセッショントークンを手動削除 | localStorage内の`sb-{ref}-auth-token`を削除 |
| 4 | Supabase APIへのリクエストを発生させる操作を実行 | 任意の操作 (例: 駅検索) |
| 5 | 画面遷移を待機 | 最大10秒 |

**期待結果:**
1. `onAuthStateChange`コールバックが`_event`=`SIGNED_OUT`で発火すること
2. `user`が`null`に設定されること
3. `profile`が`null`に設定されること
4. `app/page.tsx`の`useEffect`内で`!user && !isGuest`が真と判定されること
5. `AuthScreen`がレンダリングされること
6. ユーザーデータが適切にクリーンアップされること

---

## 3. IT-PLAN: プラン生成 -> 表示連携テスト

### IT-PLAN-001: DashboardからPlanScreen表示までのフルフロー

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-001 |
| テスト名 | DashboardからPlanScreen表示までのフルフロー |
| テスト観点 | `DashboardScreen`の「Go」ボタン押下から`searchSpotsFromDB`実行、Zustand storeへのプラン保存、`PlanScreen`のレンダリングまでの一連のフローが正常に動作すること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. ユーザーはログイン済み (メールアドレスまたはゲスト)
2. `currentScreen`は`dashboard`である
3. `spot`テーブルに東京周辺のアクティブスポットが50件以上存在する
4. 出発地が設定されている (GPS取得済みまたは駅名選択済み)

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 出発地が設定されていることを確認 | 場所欄に住所または駅名が表示されている |
| 2 | 遊ぶ時間を選択 | 「120分」をクリック |
| 3 | 「Go」ボタンをクリック | - |
| 4 | ローディング表示を確認 | 「プラン作成中...」が表示される |
| 5 | プラン表示を待機 | 最大15秒 |

**期待結果:**
1. ステップ3で`handleGo`関数が呼び出されること
2. `isSearching`が`true`に設定され、ボタンが「プラン作成中...」+ disabled状態になること
3. `searchSpotsFromDB`が以下のパラメータで呼び出されること:
   - `availableTime`: 120
   - `currentHour`: 現在時刻の「時」
   - `currentMinute`: 現在時刻の「分」(15分単位に丸め)
   - `weather`: 選択された天気
   - `origin`: 出発地の緯度経度
   - `walkRangeMinutes`: store内の値 (デフォルト20)
4. Supabaseの`spot`テーブルに対してバウンディングボックスクエリが発行されること
5. 返却されたスポットが2件以上であること
6. `setPlan`が呼び出され、以下が設定されること:
   - `spots`: 返却されたスポット配列
   - `startTime`: 先頭スポットの時刻
   - `totalDuration`: 全スポットのduration合計
   - `pinnedSpots`: 空配列
   - `searchParams`: 検索条件のスナップショット
7. `setScreen('plan')`が実行されること
8. `PlanScreen`がレンダリングされ、スポットカードが表示されること
9. 各スポットカードに以下が表示されること:
   - 連番 (01, 02, ...)
   - 時刻
   - スポット名
   - カテゴリ (色付きドット)
   - 所要時間
   - 説明文 (存在する場合)

---

### IT-PLAN-002: GPS取得からorigin設定・バウンディングボックス検索

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-002 |
| テスト名 | GPS取得からorigin設定・バウンディングボックス検索 |
| テスト観点 | GPS位置情報取得成功後、`startLocation`にlat/lngが設定され、`searchSpotsFromDB`のバウンディングボックスクエリに正しく反映されること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. HTTPS環境であること (localhost含む)
2. ブラウザの位置情報権限が許可されていること
3. `startLocation`が初期状態 (label: '', lat: null, lng: null) であること

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | DashboardScreenにアクセス | - |
| 2 | GPS位置取得が自動実行されることを確認 | `getCurrentLocation`が呼び出される |
| 3 | 位置情報の取得完了を待機 | 最大8秒 (timeout設定値) |
| 4 | 場所欄に住所が表示されることを確認 | - |
| 5 | 「120分」を選択し「Go」ボタンをクリック | - |
| 6 | DevToolsのNetworkタブでSupabaseクエリを確認 | - |

**期待結果:**
1. `navigator.geolocation.getCurrentPosition`が`enableHighAccuracy: true`で呼び出されること
2. 成功コールバックで`latitude`, `longitude`, `accuracy`が取得されること
3. `reverseGeocode`が取得座標で呼び出され、住所文字列が取得されること
4. `setStartLocation`が以下の値で呼び出されること:
   - `label`: 住所文字列 (カンマ3つ以下に短縮)
   - `lat`: 取得された緯度
   - `lng`: 取得された経度
   - `source`: `'gps'`
   - `accuracy`: 取得された精度値
5. `searchSpotsFromDB`のバウンディングボックス計算が正しいこと:
   - `latDelta = walkKm / 111` (walkKmはwalkRangeMinutes * 80 / 1000)
   - `lonDelta = walkKm / (111 * cos(lat * PI / 180))`
6. Supabaseクエリに`.gte('lat', ...)`, `.lte('lat', ...)`, `.gte('lon', ...)`, `.lte('lon', ...)`が含まれること

---

### IT-PLAN-003: 駅名選択からorigin設定・検索

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-003 |
| テスト名 | 駅名選択からorigin設定・検索 |
| テスト観点 | 駅名インライン検索で候補を選択した際、`startLocation`に駅の緯度経度が設定され、検索のoriginとして使用されること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. `stations`テーブルに首都圏の駅データが登録されている
2. `startLocation`がクリア状態であること

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 場所入力欄に駅名を入力 | `渋谷` |
| 2 | デバウンス待機 (200ms) | - |
| 3 | ドロップダウン候補が表示されることを確認 | - |
| 4 | 候補から「渋谷駅」を選択 | - |
| 5 | 場所欄に「渋谷駅」が表示されることを確認 | - |
| 6 | 「Go」ボタンをクリック | - |

**期待結果:**
1. ステップ2のデバウンス (200ms) 後、Supabaseの`stations`テーブルに対してクエリが発行されること:
   - `.or('name.ilike.%渋谷%,name_kana.ilike.%渋谷%')`
   - `.limit(8)`
2. ドロップダウンに候補が最大8件表示されること
3. 各候補に駅名と路線名が表示されること
4. ステップ4で`selectStation`が呼び出され、以下が実行されること:
   - `setStartLocation({ label: '渋谷駅', lat: 駅の緯度, lng: 駅の経度, source: 'manual', accuracy: null })`
   - `addRecentStation('渋谷駅')`
5. `stationQuery`がクリアされ、ドロップダウンが非表示になること
6. ステップ6で`searchSpotsFromDB`のoriginに渋谷駅の緯度経度が渡されること

---

### IT-PLAN-004: 条件変更後の再検索・結果反映

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-004 |
| テスト名 | 条件変更後の再検索・結果反映 |
| テスト観点 | DashboardScreenで検索条件 (時間/モード/スタイル/天気) を変更した後、「Go」ボタンで再検索し、変更した条件が結果に反映されること |
| 優先度 | P2 (High) |

**前提条件:**
1. ユーザーはログイン済みでDashboardScreen表示中
2. 出発地は設定済み

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 遊ぶ時間を「60分」に変更 | 「60分」ボタンをクリック |
| 2 | 「もっと絞り込む」を展開 | - |
| 3 | モードを「冒険」に変更 | 「冒険」ボタンをクリック |
| 4 | スタイルを「アクティブ」に変更 | 「アクティブ」ボタンをクリック |
| 5 | 天気を「雨」に変更 | 「雨」ボタンをクリック |
| 6 | 「Go」ボタンをクリック | - |
| 7 | PlanScreenの表示を確認 | - |

**期待結果:**
1. `searchSpotsFromDB`が以下のパラメータで呼び出されること:
   - `availableTime`: 60
   - `weather`: '雨'
   - `style`: 'アクティブ'
   - `mode`: '冒険'
2. スコアリング結果に以下が反映されること:
   - 天気='雨': `indoor_type === 'outdoor'`のスポットは`score *= 0.1`
   - 天気='雨': `indoor_type === 'indoor'`のスポットは`score *= 1.4`
   - モード='冒険': `famousLevel >= 5`のスポットは除外 (`return null`)
   - モード='冒険': `scope === 'big'`のスポットは除外
   - スタイル='アクティブ': `stay_type === 'roam'`のスポットは`score *= 1.3`
3. `availableTime`=60のため、スポット数が2件 (Math.max(2, Math.round(60/35))) になること
4. 表示されるスポットが屋内寄りであること (天気='雨'の影響)

---

### IT-PLAN-005: キャッシュヒット時の挙動

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-005 |
| テスト名 | キャッシュヒット時の挙動 |
| テスト観点 | 同一エリア・同一条件での再検索時にスポットキャッシュ (TTL: 10分) がヒットし、Supabaseへのクエリが発行されないこと |
| 優先度 | P3 (Medium) |

**前提条件:**
1. 直前に同一条件でプラン生成が成功している
2. 前回の検索から10分以内であること

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 初回: DashboardScreenで条件を設定し「Go」をクリック | 任意の条件 |
| 2 | PlanScreenからDashboardに戻る | 戻るボタン → 確認ダイアログで「戻る」 |
| 3 | 同一条件のまま再度「Go」をクリック | - |
| 4 | DevToolsのNetworkタブでSupabaseクエリを確認 | - |

**期待結果:**
1. キャッシュキーが`{lat丸め3桁},{lng丸め3桁},{walkRangeMinutes},{locationType}`で生成されること
2. 2回目の検索では`getCachedSpots`がキャッシュデータを返却すること
3. Supabaseの`spot`テーブルへのSELECTクエリが2回目は発行されないこと
4. 2回目の検索結果のスポットが異なること (ランダム要素による。ただしスポット候補プールは同一)
5. レスポンスタイムが1回目より短いこと

---

### IT-PLAN-006: excludeSpotIds指定時の再作成除外確認

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-006 |
| テスト名 | excludeSpotIds指定時の再作成除外確認 |
| テスト観点 | PlanScreenで「再作成」ボタンを押した際、過去に表示されたスポットIDが`excludeSpotIds`に渡され、同じスポットが再出現しないこと |
| 優先度 | P2 (High) |

**前提条件:**
1. PlanScreenにプランが表示されている
2. 表示中のスポットIDが`shownSpotIds`に記録されている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | PlanScreen表示中のスポットIDをメモする | 例: [spot_A, spot_B, spot_C] |
| 2 | 「再作成」ボタンをクリック | - |
| 3 | ローディング完了を待機 | - |
| 4 | 新しいプランのスポットIDを確認 | - |
| 5 | 再度「再作成」ボタンをクリック | - |
| 6 | 3回目のプランのスポットIDを確認 | - |

**期待結果:**
1. `handleNextPlan`内で`shownSpotIds`が`excludeSpotIds`として渡されること
2. 2回目のプランにstep1のスポット (spot_A, spot_B, spot_C) が含まれないこと
3. 3回目のプランに1回目・2回目のスポットが含まれないこと
4. `shownSpotIds`にすべての表示済みスポットIDが蓄積されること
5. 候補が枯渇した場合、直前プランのスポットIDのみを除外して再検索が実行されること
6. 再検索でも0件の場合、「条件に合うスポットが見つかりませんでした」アラートが表示されること

---

### IT-PLAN-007: ピン留め機能と再作成時のピン留めスポット維持

| 項目 | 内容 |
|------|------|
| テストID | IT-PLAN-007 |
| テスト名 | ピン留め機能と再作成時のピン留めスポット維持 |
| テスト観点 | スポットをピン留め後に「再作成」を実行した際、ピン留めされたスポットが新しいプランに維持され、残りのスポットのみが入れ替わること |
| 優先度 | P2 (High) |

**前提条件:**
1. PlanScreenに3件以上のスポットが表示されている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 1つ目のスポットのブックマークアイコンをクリック | - |
| 2 | アイコンがピン留め状態 (青色) に変わることを確認 | - |
| 3 | ヘッダーにピン留め数「1」が表示されることを確認 | - |
| 4 | 「再作成」ボタンをクリック | - |
| 5 | 新しいプランの表示を確認 | - |

**期待結果:**
1. `togglePinSpot`でZustand storeの`currentPlan.pinnedSpots`にスポットIDが追加されること
2. `toggleFavoriteSpot`で`favorite_spots`テーブルにレコードが追加されること
3. 再作成時に`pinnedSpots`のスポットが`pinnedSpotObjs`として取得されること
4. `searchSpotsFromDB`の`pinnedSpots`パラメータにピン留めスポットが渡されること
5. 新しいプランにピン留めしたスポットが含まれること
6. ピン留めされていないスポットは入れ替わっていること
7. ルート最適化 (`optimizeRoute`) がピン留めスポットを含めて実行されること
8. ピン留め状態が新しいプランでも維持されること

---

## 4. IT-EXEC: プラン実行 -> データ保存連携テスト

### IT-EXEC-001: 「このプランで行く」からExecutionScreen遷移

| 項目 | 内容 |
|------|------|
| テストID | IT-EXEC-001 |
| テスト名 | 「このプランで行く」からExecutionScreen遷移 |
| テスト観点 | PlanScreenの「このプランで行く」ボタンクリックで`setScreen('executing')`が実行され、ExecutionScreenに遷移し、現在のプランデータが正しく表示されること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. PlanScreenにプランが表示されている
2. プランには3件のスポットが含まれている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | PlanScreenで「このプランで行く」ボタンをクリック | - |
| 2 | ExecutionScreenの表示を確認 | - |

**期待結果:**
1. `setScreen('executing')`が実行されること
2. `window.scrollTo({ top: 0 })`が呼び出されること
3. `ExecutionScreen`がレンダリングされること
4. ヘッダーに「Now」バッジ (青色パルスアニメーション) と「1 / 3」が表示されること
5. 進行度バーが「33%」付近を示すこと
6. 最初のスポットの詳細情報が表示されること:
   - スポット名 (h1)
   - カテゴリ (色付きドット)
   - 所要時間
   - 説明文
   - 「スポットへ行く」ボタン (Google Maps リンク)
7. 「次のスポットへ」ボタンと「終了する」ボタンが表示されること
8. `currentSpotIndex`の初期値が0であること

---

### IT-EXEC-002: 「次のスポットへ」によるcurrentSpotIndex更新

| 項目 | 内容 |
|------|------|
| テストID | IT-EXEC-002 |
| テスト名 | 「次のスポットへ」によるcurrentSpotIndex更新 |
| テスト観点 | 「次のスポットへ」ボタンにより`currentSpotIndex`がインクリメントされ、表示が次のスポットに更新されること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. ExecutionScreenが表示されている
2. `currentSpotIndex`は0である
3. プランには3件のスポットが含まれている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 1つ目のスポットが表示されていることを確認 | 番号「01」 |
| 2 | 「次のスポットへ」ボタンをクリック | - |
| 3 | 2つ目のスポットの表示を確認 | - |
| 4 | 「次のスポットへ」ボタンをクリック | - |
| 5 | 3つ目 (最後) のスポットの表示を確認 | - |

**期待結果:**
1. ステップ2で`currentSpotIndex`が0から1に更新されること
2. ヘッダーが「2 / 3」に更新されること
3. 進行度バーが「67%」付近を示すこと
4. 2つ目のスポットの情報が表示されること
5. 「前のスポットへ」ボタン (ChevronLeft) が表示されること
6. ステップ4で`currentSpotIndex`が1から2に更新されること
7. ヘッダーが「3 / 3」に更新されること
8. 進行度バーが「100%」を示すこと
9. 最後のスポットで「プランを完了する」ボタンが表示されること
10. `window.scrollTo({ top: 0, behavior: 'smooth' })`が各遷移時に呼び出されること

---

### IT-EXEC-003: 「前のスポットへ」によるcurrentSpotIndex更新

| 項目 | 内容 |
|------|------|
| テストID | IT-EXEC-003 |
| テスト名 | 「前のスポットへ」によるcurrentSpotIndex更新 |
| テスト観点 | 「前のスポットへ」ボタンにより`currentSpotIndex`がデクリメントされ、前のスポットの表示に戻ること |
| 優先度 | P2 (High) |

**前提条件:**
1. ExecutionScreenが表示されている
2. `currentSpotIndex`は1以上である (2つ目以降のスポット表示中)

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 2つ目のスポットが表示されていることを確認 | 番号「02」、ヘッダー「2 / 3」 |
| 2 | 「前のスポットへ」(ChevronLeft) ボタンをクリック | - |
| 3 | 1つ目のスポートの表示を確認 | - |

**期待結果:**
1. `currentSpotIndex`が1から0に更新されること
2. ヘッダーが「1 / 3」に更新されること
3. 進行度バーが「33%」付近に戻ること
4. 1つ目のスポット情報が表示されること
5. `currentSpotIndex === 0`のため、「前のスポットへ」ボタンは非表示になり、代わりに「終了する」ボタンが表示されること

---

### IT-EXEC-004: プラン完了時のデータ保存フロー

| 項目 | 内容 |
|------|------|
| テストID | IT-EXEC-004 |
| テスト名 | プラン完了時のデータ保存フロー |
| テスト観点 | 最後のスポットで「プランを完了する」ボタンを押した際、全スポットが`visited_spots`に記録され、プラン履歴が`plan_history`に保存され、dashboardに遷移すること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. ログインユーザーでExecutionScreenが表示されている
2. 最後のスポットが表示されている (`currentSpotIndex === spots.length - 1`)
3. プランには3件のスポットが含まれている (ID: spot_A, spot_B, spot_C)

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 「プランを完了する」ボタンをクリック | - |
| 2 | 確認ダイアログが表示されることを確認 | 「プランを完了しますか？」 |
| 3 | 「完了する」ボタンをクリック | - |
| 4 | dashboard遷移を確認 | - |
| 5 | Supabaseのデータを直接確認 | - |

**期待結果:**
1. 確認ダイアログに「全スポットを訪問済みとして記録します。」が表示されること
2. `exitMode`が`'complete'`に設定されること
3. `markSpotsVisited`が全3件のスポットID `['spot_A', 'spot_B', 'spot_C']` で呼び出されること
4. `visited_spots`テーブルに以下のレコードがupsertされること:
   - `{ user_id: userId, spot_source_id: 'spot_A' }`
   - `{ user_id: userId, spot_source_id: 'spot_B' }`
   - `{ user_id: userId, spot_source_id: 'spot_C' }`
5. `savePlanHistory`が以下のパラメータで呼び出されること:
   - `spots`: プランの全スポット配列
   - `startTime`: プランの開始時刻
   - `totalDuration`: プランの合計所要時間
   - `startLocationLabel`: 出発地のラベル
6. `plan_history`テーブルに新規レコードが挿入されること
7. `setScreen('dashboard')`が実行されること
8. `DashboardScreen`がレンダリングされること

---

### IT-EXEC-005: 途中終了時のデータ保存フロー

| 項目 | 内容 |
|------|------|
| テストID | IT-EXEC-005 |
| テスト名 | 途中終了時のデータ保存フロー |
| テスト観点 | プラン途中で「終了する」を選択した際、現在のスポットまでが`visited_spots`に記録され (プラン履歴は保存されず)、dashboardに遷移すること |
| 優先度 | P2 (High) |

**前提条件:**
1. ログインユーザーでExecutionScreenが表示されている
2. `currentSpotIndex`は1 (2つ目のスポット表示中)
3. プランには3件のスポットが含まれている (ID: spot_A, spot_B, spot_C)

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | ヘッダーの戻るボタン (ArrowLeft) をクリック | - |
| 2 | 確認ダイアログが表示されることを確認 | 「プランを途中で終了しますか？」 |
| 3 | 「終了する」ボタンをクリック | - |
| 4 | dashboard遷移を確認 | - |

**期待結果:**
1. `exitMode`が`'abort'`に設定されること
2. 確認ダイアログに「2スポット目までを訪問済みとして記録します。」が表示されること
3. `markSpotsVisited`が`currentSpotIndex + 1`件 = 2件のスポットID `['spot_A', 'spot_B']` で呼び出されること
4. `visited_spots`テーブルに以下のレコードがupsertされること:
   - `{ user_id: userId, spot_source_id: 'spot_A' }`
   - `{ user_id: userId, spot_source_id: 'spot_B' }`
5. 3つ目のスポット (spot_C) は`visited_spots`に記録されないこと
6. `savePlanHistory`は呼び出されないこと (途中終了のため)
7. `setScreen('dashboard')`が実行されること

---

### IT-EXEC-006: ゲスト時のDB保存スキップ

| 項目 | 内容 |
|------|------|
| テストID | IT-EXEC-006 |
| テスト名 | ゲスト時のDB保存スキップ |
| テスト観点 | ゲストモードでプラン完了/途中終了した際、`getCurrentUserId`が`null`を返すため`markSpotsVisited`と`savePlanHistory`の内部処理がスキップされ、エラーが発生しないこと |
| 優先度 | P2 (High) |

**前提条件:**
1. ゲストモードでプラン実行中
2. ExecutionScreenが表示されている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 最後のスポットまで進む | 「次のスポットへ」ボタンを繰り返しクリック |
| 2 | 「プランを完了する」ボタンをクリック | - |
| 3 | 確認ダイアログで「完了する」をクリック | - |
| 4 | dashboard遷移を確認 | - |

**期待結果:**
1. `markSpotsVisited`内部で`getCurrentUserId()`が`null`を返すこと
2. `userId`が`null`のため、`if (!userId || spotSourceIds.length === 0) return;`で早期リターンすること
3. `savePlanHistory`内部でも同様に`if (!userId) return;`で早期リターンすること
4. Supabaseへの書き込みリクエストが発生しないこと
5. JavaScriptエラーが発生しないこと
6. `setScreen('dashboard')`が正常に実行されること
7. コンソールにエラーログが出力されないこと

---

## 5. IT-PROF: プロフィール -> 認証連携テスト

### IT-PROF-001: ログイン時のカウント表示

| 項目 | 内容 |
|------|------|
| テストID | IT-PROF-001 |
| テスト名 | ログイン時のカウント表示 |
| テスト観点 | ログインユーザーがプロフィール画面を表示した際、`getFavoriteSpotCount`/`getVisitedSpotCount`/`getPlanHistoryCount`が呼び出され、各カウント値が正しく表示されること |
| 優先度 | P2 (High) |

**前提条件:**
1. テストユーザーがログイン済みである
2. テストユーザーに以下のデータが存在する:
   - `favorite_spots`: 3件
   - `visited_spots`: 10件
   - `plan_history`: 2件

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | ヘッダーのプロフィールボタンをクリック | - |
| 2 | ProfileScreenの表示を確認 | - |
| 3 | 各カウント値を確認 | - |

**期待結果:**
1. `ProfileScreen`の`useEffect`内で以下が呼び出されること:
   - `getFavoriteSpotCount().then(setFavCount)`
   - `getVisitedSpotCount().then(setVisitedCount)`
   - `getPlanHistoryCount().then(setHistoryCount)`
2. 各メニュー項目の右側にカウント値が表示されること:
   - 「お気に入りスポット」: 3
   - 「行ったスポット」: 10
   - 「プラン履歴」: 2
3. プロフィールカードにニックネームとメールアドレスが表示されること
4. アバターにニックネームの先頭文字が表示されること

---

### IT-PROF-002: ゲスト時の簡略カード表示とログイン誘導

| 項目 | 内容 |
|------|------|
| テストID | IT-PROF-002 |
| テスト名 | ゲスト時の簡略カード表示とログイン誘導 |
| テスト観点 | ゲストモードでプロフィール画面を表示した際、通常のプロフィール表示ではなくゲスト専用カードが表示され、「会員登録・ログイン」ボタンでauth画面に遷移できること |
| 優先度 | P2 (High) |

**前提条件:**
1. ゲストモードでログイン済み (`isGuest === true`)

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | ヘッダーのプロフィールボタンをクリック | - |
| 2 | ゲスト専用カードが表示されることを確認 | - |
| 3 | 「会員登録・ログイン」ボタンをクリック | - |
| 4 | AuthScreenの表示を確認 | - |

**期待結果:**
1. `isGuest`条件分岐によりゲスト専用レイアウトがレンダリングされること
2. ゲストカードに以下が表示されること:
   - Userアイコン (灰色)
   - 「ゲストモード」タイトル
   - 「プロフィール機能を利用するには会員登録が必要です」メッセージ
3. カウント取得関数が呼び出されないこと (`if (isGuest) return;`による早期リターン)
4. 「会員登録・ログイン」ボタンクリックで`setScreen('auth')`が実行されること
5. 「ホームに戻る」ボタンクリックで`setScreen('dashboard')`が実行されること

---

### IT-PROF-003: ニックネーム編集からDB更新・表示反映

| 項目 | 内容 |
|------|------|
| テストID | IT-PROF-003 |
| テスト名 | ニックネーム編集からDB更新・表示反映 |
| テスト観点 | プロフィール画面でニックネームを編集した際、`updateProfile`経由でSupabaseの`user_profiles`テーブルが更新され、画面上のニックネーム表示がリアルタイムに反映されること |
| 優先度 | P2 (High) |

**前提条件:**
1. ログインユーザーでProfileScreenが表示されている
2. 現在のニックネームは「テストユーザー」

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | ニックネーム横の「編集」テキストをクリック | - |
| 2 | 編集用inputが表示されることを確認 | - |
| 3 | ニックネームを変更 | `新しいニックネーム` |
| 4 | 「保存」ボタンをクリック | - |
| 5 | 表示更新を確認 | - |

**期待結果:**
1. クリックで`isEditingNickname`が`true`に設定され、inputが表示されること
2. inputにautofocusが適用されること
3. 「保存」ボタンクリックで`handleSaveNickname`が呼び出されること
4. `updateProfile({ nickname: '新しいニックネーム' })`が実行されること
5. Supabaseの`user_profiles`テーブルで以下が更新されること:
   - `nickname`: `新しいニックネーム`
   - `updated_at`: 現在のISO形式タイムスタンプ
6. `loadProfile`が再実行され、`profile`ステートが更新されること
7. プロフィールカードのニックネーム表示が「新しいニックネーム」に更新されること
8. アバターの先頭文字が「新」に更新されること
9. `isEditingNickname`が`false`に戻り、inputが非表示になること

---

## 6. IT-DB: DB -> スコアリング連携テスト

### IT-DB-001: Supabase応答形式からscoreSpot正常動作

| 項目 | 内容 |
|------|------|
| テストID | IT-DB-001 |
| テスト名 | Supabase応答形式からscoreSpot正常動作 |
| テスト観点 | Supabaseから返却される`DbSpot`型のデータが`scoreSpot`関数で正しく処理され、各スコアリングルールが期待通りに適用されること |
| 優先度 | P1 (Critical) |

**前提条件:**
1. `spot`テーブルに以下の属性を持つテストスポットが存在する:
   - スポットA: `indoor_type='indoor'`, `category='cafe'`, `famousLevel=3`, `stay_type='stay'`, `estimated_stay_min=45`
   - スポットB: `indoor_type='outdoor'`, `category='park'`, `famousLevel=5`, `stay_type='roam'`, `estimated_stay_min=60`
2. 検索条件: `weather='雨'`, `mode='新規開拓'`, `style='ゆっくり'`, `availableTime=120`

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | DashboardScreenで上記条件を設定 | - |
| 2 | 「Go」ボタンをクリック | - |
| 3 | 結果のスポット一覧を確認 | - |

**期待結果:**
1. スポットAのスコアリング:
   - 基本スコア: 1.0
   - 天気='雨' + indoor_type='indoor': `score *= 1.4` -> 1.4
   - style='ゆっくり' + stay_type='stay': `score *= 1.3` -> 1.82
   - mode='新規開拓' + famousLevel=3: `score *= 1.0` (変動なし)
   - 最終スコア: 約1.82以上
2. スポットBのスコアリング:
   - mode='新規開拓' + famousLevel=5: `return null` (除外)
   - 検索結果にスポットBが含まれないこと
3. `lat`/`lon`のstring -> number変換 (`parseFloat`) が正しく行われること
4. `isNaN`チェックにより不正な座標のスポットが除外されること
5. `name`が`null`のスポットが除外されること

---

### IT-DB-002: DB接続エラー時のエラーハンドリング

| 項目 | 内容 |
|------|------|
| テストID | IT-DB-002 |
| テスト名 | DB接続エラー時のエラーハンドリング |
| テスト観点 | Supabaseへのクエリがエラーを返した場合、`searchSpotsFromDB`が適切にエラーをスローし、DashboardScreenがエラーメッセージを表示すること |
| 優先度 | P2 (High) |

**前提条件:**
1. Supabaseの接続情報が無効、またはネットワークが遮断されている状態

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | DevToolsでネットワークをオフラインに設定 | Network > Offline |
| 2 | DashboardScreenで「Go」ボタンをクリック | - |
| 3 | エラー表示を確認 | - |
| 4 | ネットワークをオンラインに復帰 | Network > Online |

**期待結果:**
1. `searchSpotsFromDB`内のSupabaseクエリが失敗すること
2. `if (error) throw new Error('Supabase error: ${error.message}');`が実行されること
3. `DashboardScreen`の`handleGo`内のcatchブロックで捕捉されること
4. `console.error('Plan generation failed:', err)`がコンソールに出力されること
5. `alert('プラン作成中にエラーが発生しました')`が表示されること
6. `isSearching`が`false`に戻り、「Go」ボタンが再度クリック可能になること
7. アプリケーションがクラッシュしないこと

---

### IT-DB-003: 0件応答時のフォールバック検索

| 項目 | 内容 |
|------|------|
| テストID | IT-DB-003 |
| テスト名 | 0件応答時のフォールバック検索 |
| テスト観点 | バウンディングボックス内にスポットが0件の場合、フォールバック検索 (全スポットから300件取得) が実行されること |
| 優先度 | P2 (High) |

**前提条件:**
1. 出発地が東京から離れた場所に設定されている (例: 北海道)
2. バウンディングボックス内にアクティブスポットが0件の状態

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 出発地を遠方に設定 | 手動で北海道の座標を設定 |
| 2 | 「Go」ボタンをクリック | - |
| 3 | 結果を確認 | - |

**期待結果:**
1. 最初のバウンディングボックスクエリが0件を返すこと
2. フォールバッククエリが実行されること:
   - `supabase.from('spot').select('*').eq('isActive', true).limit(300)`
3. フォールバックで取得されたスポットが`buildPlan`に渡されること
4. フォールバックも0件の場合、空配列が返却されること
5. 空配列の場合、`DashboardScreen`で「条件に合うスポットが見つかりませんでした」アラートが表示されること

---

## 7. IT-STA: 駅検索連携テスト

### IT-STA-001: 入力からデバウンス・Supabase検索・候補表示

| 項目 | 内容 |
|------|------|
| テストID | IT-STA-001 |
| テスト名 | 入力からデバウンス・Supabase検索・候補表示 |
| テスト観点 | 駅名入力時のデバウンス処理 (200ms)、Supabaseの`stations`テーブルへのクエリ発行、検索候補のドロップダウン表示が正しく連携すること |
| 優先度 | P2 (High) |

**前提条件:**
1. `stations`テーブルに首都圏の駅データが登録されている
2. 出発地がクリア状態であること

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 場所入力欄に「し」を入力 | - |
| 2 | 100ms待機 | - |
| 3 | 「ぶ」を追加入力 (「しぶ」) | - |
| 4 | 100ms待機 | - |
| 5 | 「や」を追加入力 (「しぶや」) | - |
| 6 | 200ms以上待機 | - |
| 7 | ドロップダウンの候補を確認 | - |

**期待結果:**
1. ステップ1~4の間、デバウンスにより`clearTimeout`が呼び出され、APIリクエストは発行されないこと
2. ステップ6で200msデバウンス後にSupabaseクエリが発行されること:
   - `.from('stations').select('id, name, line_name, lat, lng')`
   - `.or('name.ilike.%しぶや%,name_kana.ilike.%しぶや%')`
   - `.limit(8)`
3. ドロップダウンに候補が表示されること (最大8件)
4. 各候補に駅名が表示されること
5. `line_name`がnullでない場合、路線名も表示されること
6. `stationResults`ステートに座標 (lat/lng) が`parseFloat`で変換済みで格納されていること

---

### IT-STA-002: 候補選択からstartLocation設定・origin反映

| 項目 | 内容 |
|------|------|
| テストID | IT-STA-002 |
| テスト名 | 候補選択からstartLocation設定・origin反映 |
| テスト観点 | 駅候補をクリックした際、`setStartLocation`によりZustand storeに駅情報が設定され、`addRecentStation`で最近使った駅に追加され、検索時のoriginに反映されること |
| 優先度 | P2 (High) |

**前提条件:**
1. 駅候補ドロップダウンが表示されている
2. 候補に「新宿駅」が含まれている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | 候補から「新宿駅」をクリック | - |
| 2 | 場所欄の表示を確認 | - |
| 3 | 「Go」ボタンをクリック | - |

**期待結果:**
1. `selectStation`が呼び出されること
2. `setStartLocation`が以下の値で呼び出されること:
   - `label`: `'新宿駅'`
   - `lat`: 新宿駅の緯度 (数値)
   - `lng`: 新宿駅の経度 (数値)
   - `source`: `'manual'`
   - `accuracy`: `null`
3. `stationQuery`が空文字列にリセットされること
4. `showStationDropdown`が`false`に設定されること
5. `addRecentStation('新宿駅')`が呼び出されること
6. ステップ3で`searchSpotsFromDB`のoriginに新宿駅の座標が渡されること

---

### IT-STA-003: StationSelectModal全駅ロードとフィルタ動作

| 項目 | 内容 |
|------|------|
| テストID | IT-STA-003 |
| テスト名 | StationSelectModal全駅ロードとフィルタ動作 |
| テスト観点 | StationSelectModalが開かれた際に首都圏全駅データがSupabaseから取得され、テキスト入力によるクライアントサイドフィルタが正しく動作すること |
| 優先度 | P3 (Medium) |

**前提条件:**
1. `stations`テーブルに東京都・神奈川県・埼玉県・千葉県の駅データが登録されている
2. QuickPlanScreenが表示されている

**操作手順:**

| ステップ | 操作 | 入力値/操作対象 |
|---------|------|---------------|
| 1 | QuickPlanScreenの「Select a station」ボタンをクリック | - |
| 2 | StationSelectModalの表示を確認 | - |
| 3 | 全駅ロードの完了を待機 | - |
| 4 | 検索欄に「新宿」と入力 | - |
| 5 | フィルタ結果を確認 | - |
| 6 | 入力をクリアして「池袋」と入力 | - |
| 7 | フィルタ結果を確認 | - |

**期待結果:**
1. モーダルオープン時に`loadStations`が呼び出されること
2. Supabaseクエリが発行されること:
   - `.from('stations').select('id, name, name_kana, line_name, lat, lng')`
   - `.in('prefecture', ['東京都', '神奈川県', '埼玉県', '千葉県'])`
   - `.order('name')`
3. 全駅データが`allStations`ステートに格納されること
4. ステップ4で`filteredStations`が「新宿」を含む駅にフィルタされること
5. フィルタは`name`, `name_kana`, `line_name`の部分一致で行われること
6. フィルタ結果が100件を超える場合、最初の100件が表示され「他 N 件」が表示されること
7. 最近使った駅セクションが検索クエリ未入力時のみ表示されること
8. 駅選択で`setStartLocation`が呼び出されること

---

## 8. トレーサビリティマトリクス

| テストID | 対象モジュール | 主要ファイル | Zustand Store操作 | Supabase操作 |
|---------|--------------|-------------|------------------|-------------|
| IT-AUTH-001 | signIn -> setScreen | auth-context.tsx, page.tsx | setScreen('dashboard') | auth.signInWithPassword |
| IT-AUTH-002 | signUp -> profile作成 | auth-context.tsx | setScreen('dashboard') | auth.signUp, user_profiles INSERT (トリガー) |
| IT-AUTH-003 | signInAsGuest -> setScreen | auth-context.tsx, page.tsx | setScreen('dashboard') | なし |
| IT-AUTH-004 | guest -> auth -> guest | AuthScreen.tsx | setScreen('dashboard') | なし |
| IT-AUTH-005 | signOut -> setScreen | ProfileScreen.tsx | setScreen('auth') | auth.signOut |
| IT-AUTH-006 | onAuthStateChange | auth-context.tsx, page.tsx | setScreen('auth') | auth.getSession |
| IT-PLAN-001 | handleGo -> searchSpotsFromDB | DashboardScreen.tsx, spotSearch.ts | setPlan, setScreen('plan') | spot SELECT |
| IT-PLAN-002 | GPS -> origin -> bbox | DashboardScreen.tsx, geocoding.ts | setStartLocation | spot SELECT (bbox) |
| IT-PLAN-003 | station -> origin | DashboardScreen.tsx | setStartLocation | stations SELECT, spot SELECT |
| IT-PLAN-004 | 条件変更 -> scoreSpot | DashboardScreen.tsx, spotSearch.ts | setPlan | spot SELECT |
| IT-PLAN-005 | キャッシュ -> skipクエリ | spotSearch.ts | setPlan | spot SELECT (初回のみ) |
| IT-PLAN-006 | excludeSpotIds -> 再作成 | PlanScreen.tsx, spotSearch.ts | setPlan | spot SELECT |
| IT-PLAN-007 | pinnedSpots -> 再作成 | PlanScreen.tsx, spotSearch.ts | togglePinSpot, setPlan | spot SELECT, favorite_spots UPSERT |
| IT-EXEC-001 | plan -> executing | PlanScreen.tsx, ExecutionScreen.tsx | setScreen('executing') | なし |
| IT-EXEC-002 | nextSpot | ExecutionScreen.tsx | currentSpotIndex++ | なし |
| IT-EXEC-003 | prevSpot | ExecutionScreen.tsx | currentSpotIndex-- | なし |
| IT-EXEC-004 | complete -> save | ExecutionScreen.tsx, storage.ts | setScreen('dashboard') | visited_spots UPSERT, plan_history INSERT |
| IT-EXEC-005 | abort -> partial save | ExecutionScreen.tsx, storage.ts | setScreen('dashboard') | visited_spots UPSERT (一部) |
| IT-EXEC-006 | guest -> skip save | ExecutionScreen.tsx, storage.ts | setScreen('dashboard') | なし (userId null) |
| IT-PROF-001 | profile -> counts | ProfileScreen.tsx, storage.ts | なし | favorite_spots/visited_spots/plan_history SELECT (count) |
| IT-PROF-002 | guest -> auth redirect | ProfileScreen.tsx | setScreen('auth') | なし |
| IT-PROF-003 | nickname edit -> update | ProfileScreen.tsx, auth-context.tsx | なし | user_profiles UPDATE |
| IT-DB-001 | DbSpot -> scoreSpot | spotSearch.ts | なし | spot SELECT |
| IT-DB-002 | DB error -> alert | spotSearch.ts, DashboardScreen.tsx | なし | spot SELECT (失敗) |
| IT-DB-003 | 0件 -> fallback | spotSearch.ts | なし | spot SELECT (2回) |
| IT-STA-001 | debounce -> query | DashboardScreen.tsx | なし | stations SELECT |
| IT-STA-002 | select -> setStartLocation | DashboardScreen.tsx, storage.ts | setStartLocation | stations SELECT |
| IT-STA-003 | modal -> all stations | StationSelectModal.tsx | setStartLocation | stations SELECT |

---

## 9. テスト実施記録テンプレート

| 項目 | 記入欄 |
|------|-------|
| テストID | |
| 実施日 | |
| 実施者 | |
| テスト環境 | ブラウザ: / デバイス: / URL: |
| 実施結果 | Pass / Fail / Block / Skip |
| 障害ID (Fail時) | |
| 備考 | |
| エビデンス | スクリーンショット/動画のファイルパス |

---

## 10. 改訂履歴

| バージョン | 日付 | 変更者 | 変更内容 |
|-----------|------|--------|---------|
| 1.0 | 2026-03-09 | NowGo開発チーム | 初版作成 |
