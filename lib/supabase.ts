import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  nickname: string;
  age_group?: string;
  home_station?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Spot = {
  id: string;
  name: string;
  category: string;
  description?: string;
  station: string;
  walking_minutes: number;
  budget_min: number;
  budget_max: number;
  image_url?: string;
  tags: string[];
  created_at: string;
};

export type UserPreferences = {
  id: string;
  user_id: string;
  preferred_categories: string[];
  disliked_tags: string[];
  budget_preference: number;
  created_at: string;
  updated_at: string;
};
