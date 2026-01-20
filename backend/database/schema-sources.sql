-- 内容源管理扩展 Schema
-- Content Sources Management Extension
-- 用于追踪和管理YouTube频道、关键人物、出版机构等高质量内容来源

-- 1. 内容源主表
CREATE TABLE IF NOT EXISTS content_sources (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('channel', 'person', 'publication')),
    name VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    domain VARCHAR(5) NOT NULL CHECK (domain IN ('T', 'P', 'Φ', 'H', 'F', 'R')),
    description TEXT,
    priority_rank INTEGER DEFAULT 100,  -- 优先级排名，数字越小优先级越高
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, name)  -- 防止重复添加同一来源
);

-- 2. 内容源评分表（月度统计）
CREATE TABLE IF NOT EXISTS source_metrics (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- 统计月份（每月1日）
    new_content_count INTEGER DEFAULT 0,      -- 新内容数量
    adopted_count INTEGER DEFAULT 0,          -- 被采纳内容数量
    adoption_rate DECIMAL(5,2) DEFAULT 0.00,  -- 采纳率 (%)
    avg_quality_score DECIMAL(3,2) DEFAULT 0.00,  -- 平均质量评分 (1-5)
    engagement_score DECIMAL(5,2) DEFAULT 0.00,   -- 用户互动分数
    calculated_rank INTEGER DEFAULT 100,      -- 计算后的排名
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, month)  -- 每个来源每月只有一条记录
);

-- 3. 人物热度表（月度统计）
CREATE TABLE IF NOT EXISTS person_metrics (
    id SERIAL PRIMARY KEY,
    person_name VARCHAR(100) NOT NULL,
    month DATE NOT NULL,
    mention_count INTEGER DEFAULT 0,          -- 被提及次数
    new_appearance_count INTEGER DEFAULT 0,   -- 新访谈/演讲/文章数
    content_adopted INTEGER DEFAULT 0,        -- 内容被采纳数
    trending_score DECIMAL(5,2) DEFAULT 0.00, -- 热度分数
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_name, month)
);

-- 4. 内容源推荐表（自动发现）
CREATE TABLE IF NOT EXISTS source_recommendations (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('channel', 'person', 'publication')),
    name VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    reason TEXT,                              -- 推荐理由
    discovered_from VARCHAR(200),             -- 从哪里发现的
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_content_sources_domain ON content_sources(domain);
CREATE INDEX IF NOT EXISTS idx_content_sources_type ON content_sources(type);
CREATE INDEX IF NOT EXISTS idx_content_sources_status ON content_sources(status);
CREATE INDEX IF NOT EXISTS idx_content_sources_rank ON content_sources(priority_rank);

CREATE INDEX IF NOT EXISTS idx_source_metrics_source_id ON source_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_source_metrics_month ON source_metrics(month DESC);
CREATE INDEX IF NOT EXISTS idx_source_metrics_rank ON source_metrics(calculated_rank);

CREATE INDEX IF NOT EXISTS idx_person_metrics_name ON person_metrics(person_name);
CREATE INDEX IF NOT EXISTS idx_person_metrics_month ON person_metrics(month DESC);
CREATE INDEX IF NOT EXISTS idx_person_metrics_trending ON person_metrics(trending_score DESC);

CREATE INDEX IF NOT EXISTS idx_source_recommendations_status ON source_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_source_recommendations_type ON source_recommendations(source_type);

-- 为新表添加自动更新时间戳触发器
CREATE TRIGGER update_content_sources_updated_at BEFORE UPDATE ON content_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_metrics_updated_at BEFORE UPDATE ON source_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_person_metrics_updated_at BEFORE UPDATE ON person_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_recommendations_updated_at BEFORE UPDATE ON source_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE content_sources IS '内容源主表：追踪YouTube频道、关键人物、出版机构';
COMMENT ON TABLE source_metrics IS '内容源评分表：月度性能统计和排名';
COMMENT ON TABLE person_metrics IS '人物热度表：追踪关键人物的影响力和活跃度';
COMMENT ON TABLE source_recommendations IS '内容源推荐表：自动发现的新来源，待编辑审核';
