-- =====================================================
-- Theme Day Migration Script
-- 主题日架构数据库迁移
-- =====================================================
-- 
-- 此脚本将数据库从普通日专用架构升级为支持主题日的灵活架构
-- 运行方式: psql -d thoughts_radar -f migration-theme-day.sql
--
-- ⚠️ 重要：此迁移是向前兼容的，不会丢失现有数据
-- =====================================================

-- 1. 移除旧的 UNIQUE(date, freq) 约束
-- 此约束限制了每日每频段只能有1条内容，不适用于主题日
ALTER TABLE radar_items DROP CONSTRAINT IF EXISTS radar_items_date_freq_key;

-- 2. 添加复合索引优化查询性能（替代唯一约束）
CREATE INDEX IF NOT EXISTS idx_radar_items_date_freq ON radar_items(date, freq);

-- 3. 添加来源去重字段（如果不存在）
ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS video_id VARCHAR(50);

-- 4. 创建来源唯一索引（防止重复发布）
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_source_url 
    ON radar_items(source_url) 
    WHERE source_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_video_id 
    ON radar_items(video_id) 
    WHERE video_id IS NOT NULL;

-- 5. 添加主题日标签字段（可选）
ALTER TABLE radar_items ADD COLUMN IF NOT EXISTS theme_day_event VARCHAR(100);

-- 6. 创建主题日索引
CREATE INDEX IF NOT EXISTS idx_radar_items_theme_day 
    ON radar_items(theme_day_event) 
    WHERE theme_day_event IS NOT NULL;

-- =====================================================
-- 验证迁移
-- =====================================================
DO $$
BEGIN
    -- 检查约束是否已移除
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'radar_items_date_freq_key'
    ) THEN
        RAISE WARNING 'UNIQUE(date, freq) constraint still exists!';
    ELSE
        RAISE NOTICE '✓ UNIQUE(date, freq) constraint removed successfully';
    END IF;
    
    -- 检查新字段是否存在
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radar_items' AND column_name = 'source_url'
    ) THEN
        RAISE NOTICE '✓ source_url column exists';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radar_items' AND column_name = 'video_id'
    ) THEN
        RAISE NOTICE '✓ video_id column exists';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'radar_items' AND column_name = 'theme_day_event'
    ) THEN
        RAISE NOTICE '✓ theme_day_event column exists';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Theme Day migration completed!';
    RAISE NOTICE '========================================';
END $$;
