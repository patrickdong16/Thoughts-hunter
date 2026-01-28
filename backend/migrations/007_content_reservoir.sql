-- 内容储备库表
-- Content Reservoir for storing quality content beyond daily quota

CREATE TABLE IF NOT EXISTS content_reservoir (
    id SERIAL PRIMARY KEY,
    
    -- 内容数据 (完整分析结果)
    content JSONB NOT NULL,
    
    -- 推荐频段
    freq VARCHAR(10),
    
    -- 优先级 (1=最高, 10=最低)
    priority INTEGER DEFAULT 5,
    
    -- 来源信息
    source_url TEXT,
    source_name VARCHAR(255),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- 发布状态
    published_date DATE,  -- null = 待发布
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'expired', 'rejected'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_reservoir_status ON content_reservoir(status);
CREATE INDEX IF NOT EXISTS idx_reservoir_priority ON content_reservoir(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_reservoir_freq ON content_reservoir(freq);
CREATE INDEX IF NOT EXISTS idx_reservoir_expires ON content_reservoir(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservoir_source_url ON content_reservoir(source_url);

-- 注释
COMMENT ON TABLE content_reservoir IS '内容储备库 - 存储超配额的优质内容';
COMMENT ON COLUMN content_reservoir.content IS '完整的 AI 分析结果 JSON';
COMMENT ON COLUMN content_reservoir.priority IS '发布优先级: 1=核心频段/高TTI, 5=普通, 10=低优先';
COMMENT ON COLUMN content_reservoir.status IS 'pending=待发布, published=已发布, expired=过期, rejected=拒绝';
