-- =====================================================
-- 思想雷达 Railway 数据库修复脚本
-- 请在 Railway PostgreSQL 控制台执行
-- =====================================================

-- 1. 更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 内容源主表
CREATE TABLE IF NOT EXISTS content_sources (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('channel', 'person', 'publication')),
    name VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    domain VARCHAR(5) NOT NULL CHECK (domain IN ('T', 'P', 'Φ', 'H', 'F', 'R')),
    default_domain VARCHAR(50),
    description TEXT,
    priority_rank INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, name)
);

-- 3. 草稿表
CREATE TABLE IF NOT EXISTS drafts (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES content_sources(id) ON DELETE SET NULL,
    source_url VARCHAR(500) NOT NULL,
    source_title TEXT,
    source_type VARCHAR(20) DEFAULT 'youtube',
    transcript TEXT,
    generated_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 采集日志表
CREATE TABLE IF NOT EXISTS collection_log (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES content_sources(id) ON DELETE CASCADE,
    video_id VARCHAR(100),
    video_url VARCHAR(500),
    video_title TEXT,
    title TEXT,
    description TEXT,
    duration VARCHAR(50),
    channel_title VARCHAR(200),
    published_at TIMESTAMP,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed BOOLEAN DEFAULT FALSE,
    draft_id INTEGER REFERENCES drafts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, video_id)
);

-- 5. 内容源评分表
CREATE TABLE IF NOT EXISTS source_metrics (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    new_content_count INTEGER DEFAULT 0,
    adopted_count INTEGER DEFAULT 0,
    adoption_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_quality_score DECIMAL(3,2) DEFAULT 0.00,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    calculated_rank INTEGER DEFAULT 100,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, month)
);

-- 6. 人物热度表
CREATE TABLE IF NOT EXISTS person_metrics (
    id SERIAL PRIMARY KEY,
    person_name VARCHAR(100) NOT NULL,
    month DATE NOT NULL,
    mention_count INTEGER DEFAULT 0,
    new_appearance_count INTEGER DEFAULT 0,
    content_adopted INTEGER DEFAULT 0,
    trending_score DECIMAL(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_name, month)
);

-- 7. 内容源推荐表
CREATE TABLE IF NOT EXISTS source_recommendations (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('channel', 'person', 'publication')),
    name VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    reason TEXT,
    discovered_from VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 推送日志表
CREATE TABLE IF NOT EXISTS push_log (
    id SERIAL PRIMARY KEY,
    push_type VARCHAR(50) DEFAULT 'daily',
    title TEXT,
    body TEXT,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_content_sources_domain ON content_sources(domain);
CREATE INDEX IF NOT EXISTS idx_content_sources_status ON content_sources(status);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_log_source_id ON collection_log(source_id);
CREATE INDEX IF NOT EXISTS idx_collection_log_analyzed ON collection_log(analyzed);

-- =====================================================
-- 初始内容源数据（达沃斯主题日相关）
-- =====================================================

INSERT INTO content_sources (type, name, domain, default_domain, priority_rank, description) VALUES
('channel', 'World Economic Forum', 'P', 'politics', 10, '达沃斯论坛官方频道'),
('channel', 'Bloomberg', 'F', 'finance', 9, '财经访谈'),
('channel', 'CNBC', 'F', 'finance', 8, '商业新闻'),
('channel', 'Lex Fridman Podcast', 'T', 'tech', 10, '深度技术访谈'),
('channel', 'Dwarkesh Podcast', 'T', 'tech', 9, 'AI前沿对话'),
('channel', 'a16z', 'T', 'tech', 8, '技术投资视角'),
('channel', 'Foreign Affairs', 'P', 'politics', 10, '国际关系权威'),
('channel', 'Council on Foreign Relations', 'P', 'politics', 9, '政策分析'),
('channel', 'Bridgewater', 'F', 'finance', 9, 'Ray Dalio观点'),
('person', 'Sam Altman', 'T', 'tech', 10, 'OpenAI CEO'),
('person', 'Ray Dalio', 'F', 'finance', 9, '桥水创始人'),
('person', 'Yuval Noah Harari', 'H', 'history', 9, '《人类简史》作者'),
('person', 'Klaus Schwab', 'P', 'politics', 10, '达沃斯论坛创始人'),
('person', 'Christine Lagarde', 'F', 'finance', 9, '欧洲央行行长'),
('person', 'Jensen Huang', 'T', 'tech', 9, 'NVIDIA CEO'),
('person', 'Satya Nadella', 'T', 'tech', 9, '微软CEO')
ON CONFLICT (type, name) DO NOTHING;

-- 验证创建是否成功
SELECT 'content_sources' as table_name, COUNT(*) as count FROM content_sources
UNION ALL
SELECT 'drafts', COUNT(*) FROM drafts
UNION ALL
SELECT 'collection_log', COUNT(*) FROM collection_log;
