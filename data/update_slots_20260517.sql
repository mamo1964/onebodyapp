-- =============================================
-- time_slots 更新スクリプト（2026-05-17）
-- 第3クール：5/26〜6/3 の10枠
-- Supabase SQL Editor で実行してください
-- =============================================

-- 1. 既存スロットを全削除
DELETE FROM time_slots;

-- 2. submissions テーブルも合わせてリセットする場合はこちら（任意）
-- DELETE FROM submissions;

-- 3. 新しいスロットを挿入（10枠）
INSERT INTO time_slots (label, booked, sort_order) VALUES
  ('5月26日(火) 10:00', false, 1),
  ('5月26日(火) 14:00', false, 2),
  ('5月27日(水) 14:00', false, 3),
  ('5月27日(水) 18:00', false, 4),
  ('5月30日(土) 18:00', false, 5),
  ('5月31日(日) 10:00', false, 6),
  ('5月31日(日) 14:00', false, 7),
  ('6月1日(月) 18:00',  false, 8),
  ('6月2日(火) 14:00',  false, 9),
  ('6月3日(水) 10:00',  false, 10);

-- 4. 確認（実行後に結果を見る）
SELECT id, label, booked, sort_order FROM time_slots ORDER BY sort_order;
