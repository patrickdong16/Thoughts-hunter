-- 统一发布管道 v5.1 - 候选池表
-- 存储多源采集的原始线索/leads

CREATE TABLE leads_pool (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(20) NOT NULL,      -- 'google' | 'rss' | 'youtube'
    source_url TEXT NOT NULL,
    source_name VARCHAR(200),
    title TEXT,
    snippet TEXT,                           -- 原始摘要/描述
    leader_name VARCHAR(100),               -- 关联领袖 (Google/YouTube)
    raw_data JSONB,                         -- 原始数据
    status VARCHAR(20) DEFAULT 'pending',   -- pending | processing | enriched | failed
    created_at TIMESTAMP DEFAULT NOW(),
    enriched_at TIMESTAMP,
    enriched_content JSONB                  -- 补全后的内容
);

-- 索引
CREATE INDEX idx_leads_status ON leads_pool(status);
CREATE INDEX idx_leads_source ON leads_pool(source_type);
CREATE INDEX idx_leads_created ON leads_pool(created_at);

-- 去重约束 (同一 URL 24小时内不重复)
CREATE UNIQUE INDEX idx_leads_url_daily 
ON leads_pool(source_url, (created_at::date));

COMMENT ON TABLE leads_pool IS 'v5.1 候选池: 存储初筛线索';
