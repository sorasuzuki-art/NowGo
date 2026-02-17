/*
  # User Profiles and Spots Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `nickname` (text)
      - `age_group` (text) - 年代
      - `home_station` (text) - よく行く駅
      - `avatar_url` (text) - プロフィール画像URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `spots`
      - `id` (uuid, primary key)
      - `name` (text) - スポット名
      - `category` (text) - カテゴリ（カフェ、レストランなど）
      - `description` (text) - 説明
      - `station` (text) - 最寄り駅
      - `walking_minutes` (integer) - 駅からの徒歩分数
      - `budget_min` (integer) - 予算下限
      - `budget_max` (integer) - 予算上限
      - `image_url` (text) - 画像URL
      - `tags` (text[]) - タグ（まったり、アクティブなど）
      - `created_at` (timestamptz)
    
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `spot_id` (uuid, references spots)
      - `created_at` (timestamptz)
    
    - `plan_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `station` (text) - 出発駅
      - `duration` (integer) - 所要時間（分）
      - `group_size` (integer) - 人数
      - `spots` (jsonb) - プランの詳細
      - `rating` (integer) - 評価（1-3: 😞😐😊）
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `preferred_categories` (text[]) - 好きなカテゴリ
      - `disliked_tags` (text[]) - 苦手なタグ（人混み、行列など）
      - `budget_preference` (integer) - 希望予算
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can read and update their own profile
    - Users can manage their own favorites
    - Users can manage their own plan history
    - Spots are publicly readable
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  age_group text,
  home_station text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create spots table
CREATE TABLE IF NOT EXISTS spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  station text NOT NULL,
  walking_minutes integer DEFAULT 5,
  budget_min integer DEFAULT 0,
  budget_max integer DEFAULT 5000,
  image_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  spot_id uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

-- Create plan_history table
CREATE TABLE IF NOT EXISTS plan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  station text NOT NULL,
  duration integer NOT NULL,
  group_size integer NOT NULL,
  spots jsonb NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 3),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  preferred_categories text[] DEFAULT '{}',
  disliked_tags text[] DEFAULT '{}',
  budget_preference integer DEFAULT 5000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Spots Policies (publicly readable)
CREATE POLICY "Anyone can view spots"
  ON spots FOR SELECT
  TO authenticated
  USING (true);

-- User Favorites Policies
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Plan History Policies
CREATE POLICY "Users can view own plan history"
  ON plan_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan history"
  ON plan_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan history"
  ON plan_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample spots
INSERT INTO spots (name, category, description, station, walking_minutes, budget_min, budget_max, tags)
VALUES
  ('カフェ モーニング', 'カフェ', '落ち着いた雰囲気のカフェ', '渋谷', 5, 500, 1500, ARRAY['まったり', '一人でも', 'おしゃれ']),
  ('居酒屋 楽', '居酒屋', 'カジュアルな居酒屋', '渋谷', 3, 2000, 4000, ARRAY['飲みたい', 'にぎやか', 'グループ向け']),
  ('アートギャラリー', 'ギャラリー', '現代アートを楽しめる', '渋谷', 10, 0, 1000, ARRAY['クリエイティブ', '静か', 'デート向け']),
  ('ショッピングモール', 'ショッピング', '大型商業施設', '渋谷', 2, 1000, 10000, ARRAY['買い物したい', 'にぎやか', 'グループ向け']),
  ('公園カフェ', 'カフェ', '公園内のカフェ', '渋谷', 15, 500, 1200, ARRAY['まったり', 'デート向け', '自然'])
ON CONFLICT DO NOTHING;