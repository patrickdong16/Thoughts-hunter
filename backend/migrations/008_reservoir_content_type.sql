-- 统一发布管道 v5.0 数据库更新
-- 添加 content_type 字段支持多类型储备

ALTER TABLE content_reservoir 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'rss';

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_reservoir_content_type 
ON content_reservoir(content_type);

-- 注释
COMMENT ON COLUMN content_reservoir.content_type IS 'rss | video | google';
