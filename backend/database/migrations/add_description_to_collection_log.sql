-- 修复：为 collection_log 添加 description 字段
-- 用于视频筛选时的关键词匹配

ALTER TABLE collection_log 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN collection_log.description IS '视频描述，用于内容筛选时的关键词匹配';

-- 验证
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'collection_log' 
AND column_name = 'description';
