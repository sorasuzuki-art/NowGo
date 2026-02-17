/*
  # Drop created spots table and use existing spot table
  
  1. Changes
    - Drop spots table (created by me)
    - Drop user_favorites table (references spots)
    - Drop plan_history table (may reference spots)
    - Keep user_profiles table
    - Keep user_preferences table
  
  2. Notes
    - Using existing spot table with source_id as primary key
    - No relations to spot table per user request
*/

-- Drop dependent tables first
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS plan_history CASCADE;

-- Drop the spots table we created
DROP TABLE IF EXISTS spots CASCADE;