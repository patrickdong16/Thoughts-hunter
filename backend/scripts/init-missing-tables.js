/**
 * 初始化Railway数据库中缺失的表
 * 用于修复自动内容生成流程
 * 
 * 运行方式: DATABASE_URL=xxx node backend/scripts/init-missing-tables.js
 */

const https = require('https');

const API_BASE = 'https://thoughts-radar-backend-production.up.railway.app';

// 需要在Railway数据库中执行的SQL
const MISSING_TABLES_SQL = `
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
`;

// 初始内容源数据
const INITIAL_SOURCES = [
    { type: 'channel', name: 'Lex Fridman Podcast', domain: 'T', default_domain: 'tech', priority_rank: 10 },
    { type: 'channel', name: 'Dwarkesh Podcast', domain: 'T', default_domain: 'tech', priority_rank: 9 },
    { type: 'channel', name: 'Bloomberg', domain: 'F', default_domain: 'finance', priority_rank: 9 },
    { type: 'channel', name: 'Foreign Affairs', domain: 'P', default_domain: 'politics', priority_rank: 10 },
    { type: 'channel', name: 'World Economic Forum', domain: 'P', default_domain: 'politics', priority_rank: 10 },
    { type: 'person', name: 'Sam Altman', domain: 'T', default_domain: 'tech', priority_rank: 10 },
    { type: 'person', name: 'Ray Dalio', domain: 'F', default_domain: 'finance', priority_rank: 9 },
    { type: 'person', name: 'Yuval Noah Harari', domain: 'H', default_domain: 'history', priority_rank: 9 }
];

async function executeSQL() {
    console.log('🚀 正在检查并创建缺失的表...\n');
    console.log('请在 Railway PostgreSQL 控制台执行以下 SQL：\n');
    console.log('='.repeat(60));
    console.log(MISSING_TABLES_SQL);
    console.log('='.repeat(60));
    console.log('\n然后执行以下 SQL 添加初始内容源：\n');

    const insertSQL = INITIAL_SOURCES.map(s =>
        `INSERT INTO content_sources (type, name, domain, default_domain, priority_rank) 
         VALUES ('${s.type}', '${s.name}', '${s.domain}', '${s.default_domain}', ${s.priority_rank})
         ON CONFLICT (type, name) DO NOTHING;`
    ).join('\n');

    console.log(insertSQL);
    console.log('\n✅ 复制上述 SQL 到 Railway 控制台执行');
}

executeSQL();
