import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  nickname: string;
  email?: string;
  gender?: string;
  birth_date?: string;
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

export type UserSettings = {
  id: string;
  user_id: string;
  recent_stations: Array<{ name: string; timestamp: number }>;
  last_station: string | null;
  last_duration: number;
  last_group_size: number;
  created_at: string;
  updated_at: string;
};

export type PlanHistory = {
  id: string;
  user_id: string;
  station: string;
  duration: number;
  group_size: number;
  spots: any;
  rating: number | null;
  completed_at: string | null;
  created_at: string;
};
