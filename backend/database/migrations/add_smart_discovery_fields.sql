-- 智能发现体系数据库迁移
-- Smart Discovery System Migration
-- 运行: psql -d thoughts_radar -f backend/database/migrations/add_smart_discovery_fields.sql

-- 1. 为 collection_log 添加智能发现相关字段
ALTER TABLE collection_log 
ADD COLUMN IF NOT EXISTS discovery_method VARCHAR(50) DEFAULT 'channel_monitor';

ALTER TABLE collection_log 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;

-- 2. 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_collection_log_quality_score 
ON collection_log(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_collection_log_discovery_method 
ON collection_log(discovery_method);

-- 3. 添加发现来源类型注释
COMMENT ON COLUMN collection_log.discovery_method IS '发现方式: channel_monitor(频道监控), hot_discovery(热榜发现), search_expansion(搜索扩展)';
COMMENT ON COLUMN collection_log.quality_score IS '质量评分 0-100，≥60 才进入 Claude 分析';

-- 4. 创建发现统计视图
CREATE OR REPLACE VIEW discovery_stats AS
SELECT 
    DATE(checked_at) as discovery_date,
    discovery_method,
    COUNT(*) as total_discovered,
    COUNT(CASE WHEN analyzed = true THEN 1 END) as analyzed_count,
    AVG(quality_score) as avg_quality_score,
    COUNT(CASE WHEN quality_score >= 60 THEN 1 END) as qualified_count
FROM collection_log
GROUP BY DATE(checked_at), discovery_method
ORDER BY discovery_date DESC, discovery_method;

-- 验证
SELECT 'Migration completed: smart discovery fields added' as status;
