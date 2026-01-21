-- 思想雷达历史数据 - 2026年1月21日
-- 将原1月21日数据日期更新为1月20日，确保历史连续性

-- 先更新现有的1月20日数据到1月19日
UPDATE radar_items SET date = '2026-01-19' WHERE date = '2026-01-20';

-- 再更新1月21日数据到1月20日
UPDATE radar_items SET date = '2026-01-20' WHERE date = '2026-01-21';
