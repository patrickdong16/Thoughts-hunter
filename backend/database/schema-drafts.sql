-- 草稿管理表 Schema
-- Drafts Management Schema
-- 用于存储AI生成的待审核内容

CREATE TABLE IF NOT EXISTS drafts (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES content_sources(id) ON DELETE SET NULL,  -- 来源ID（可选）
    source_url VARCHAR(500) NOT NULL,                   -- 原始视频/文章链接
    source_title TEXT,                                  -- 原始标题
    source_type VARCHAR(20) DEFAULT 'youtube',         -- youtube / podcast / article
    transcript TEXT,                                    -- 完整转录文本（可选存储）
    generated_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- AI生成的雷达条目数组
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),                           -- 审核人员
    notes TEXT,                                         -- 编辑备注
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_source_id ON drafts(source_id);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_source_url ON drafts(source_url);

-- 自动更新时间戳触发器
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE drafts IS '草稿表：存储AI生成的待审核雷达内容';
COMMENT ON COLUMN drafts.generated_items IS 'JSONB数组，每项包含freq/stance/title/author_name/content等字段';
COMMENT ON COLUMN drafts.status IS 'pending=待审核, approved=已发布, rejected=已拒绝';

-- 内容采集日志表（可选，用于追踪已检查的视频）
CREATE TABLE IF NOT EXISTS collection_log (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES content_sources(id) ON DELETE CASCADE,
    video_id VARCHAR(100),                              -- YouTube视频ID
    video_url VARCHAR(500),                             -- 完整URL
    video_title TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed BOOLEAN DEFAULT FALSE,                     -- 是否已分析
    draft_id INTEGER REFERENCES drafts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, video_id)                        -- 防止重复检查
);

CREATE INDEX IF NOT EXISTS idx_collection_log_source_id ON collection_log(source_id);
CREATE INDEX IF NOT EXISTS idx_collection_log_checked_at ON collection_log(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_log_analyzed ON collection_log(analyzed);

COMMENT ON TABLE collection_log IS '内容采集日志：记录已检查的视频，避免重复分析';
