-- YouTube 互动数据字段
-- 回滚方法: ALTER TABLE radar_items DROP COLUMN IF EXISTS yt_view_count, yt_like_count, yt_comment_count, yt_updated_at;

ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS yt_view_count BIGINT;
ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS yt_like_count INTEGER;
ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS yt_comment_count INTEGER;
ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS yt_updated_at TIMESTAMP;

-- 创建索引便于查询热度排名
CREATE INDEX IF NOT EXISTS idx_radar_items_yt_view_count ON radar_items(yt_view_count DESC NULLS LAST);

-- 验证
SELECT 'Migration completed: YouTube engagement fields added' as status;
