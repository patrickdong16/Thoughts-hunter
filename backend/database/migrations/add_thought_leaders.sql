-- 思想领袖自动追踪系统：数据库迁移
-- Migration: add_thought_leaders.sql
-- 运行方式: 在 init-database.js 中添加或直接在生产数据库执行

-- ===============================================
-- 1. 思想领袖表
-- ===============================================
CREATE TABLE IF NOT EXISTS thought_leaders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_cn VARCHAR(200),               -- 中文名
    role VARCHAR(300),                  -- 职位/身份描述
    domain CHAR(1) NOT NULL CHECK (domain IN ('T', 'P', 'Φ', 'H', 'F', 'R')),
    priority INTEGER DEFAULT 50,        -- 1=最高优先级，100=最低
    rss_url VARCHAR(500),               -- RSS 订阅地址
    blog_url VARCHAR(500),              -- 个人博客/网站主页
    twitter_handle VARCHAR(100),        -- Twitter @handle
    youtube_channel VARCHAR(200),       -- YouTube 频道
    notes TEXT,                         -- 备注
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'retired')),
    last_checked_at TIMESTAMP,          -- 上次检查时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_thought_leaders_domain ON thought_leaders(domain);
CREATE INDEX IF NOT EXISTS idx_thought_leaders_priority ON thought_leaders(priority);
CREATE INDEX IF NOT EXISTS idx_thought_leaders_status ON thought_leaders(status);

-- ===============================================
-- 2. 思想领袖内容日志表
-- ===============================================
CREATE TABLE IF NOT EXISTS leader_content_log (
    id SERIAL PRIMARY KEY,
    leader_id INTEGER REFERENCES thought_leaders(id) ON DELETE CASCADE,
    content_url VARCHAR(500) NOT NULL,
    url_normalized VARCHAR(500),        -- 标准化后的 URL（用于去重）
    title VARCHAR(500),
    published_at TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingested BOOLEAN DEFAULT FALSE,     -- 是否已发布到 radar_items
    radar_item_id INTEGER REFERENCES radar_items(id) ON DELETE SET NULL,
    skip_reason TEXT,                   -- 如果跳过，记录原因
    UNIQUE(url_normalized)
);

CREATE INDEX IF NOT EXISTS idx_leader_content_log_leader ON leader_content_log(leader_id);
CREATE INDEX IF NOT EXISTS idx_leader_content_log_ingested ON leader_content_log(ingested);
CREATE INDEX IF NOT EXISTS idx_leader_content_log_discovered ON leader_content_log(discovered_at);

-- ===============================================
-- 3. 初始思想领袖数据
-- ===============================================
INSERT INTO thought_leaders (name, name_cn, role, domain, priority, rss_url, blog_url, twitter_handle, notes)
VALUES 
    -- T 领域：技术/AI
    ('Dario Amodei', 'Dario Amodei', 'Anthropic CEO & Co-founder', 'T', 1, 
     NULL, 'https://www.darioamodei.com', 'DarioAmodei', 
     '最重要的 AI 安全思想领袖之一，《技术的青春期》作者'),
    
    ('Sam Altman', 'Sam Altman', 'OpenAI CEO', 'T', 1, 
     'https://blog.samaltman.com/rss', 'https://blog.samaltman.com', 'sama', 
     'OpenAI 掌门人，AGI 时代核心人物'),
    
    ('Demis Hassabis', 'Demis Hassabis', 'DeepMind CEO & Co-founder', 'T', 2, 
     NULL, 'https://deepmind.google/blog', 'demaboris', 
     'AlphaFold 之父，诺贝尔化学奖得主'),
    
    ('Ben Thompson', 'Ben Thompson', 'Stratechery 创始人', 'T', 3, 
     'https://stratechery.com/feed', 'https://stratechery.com', 'benthompson', 
     '科技战略分析标杆'),
    
    ('Marc Andreessen', 'Marc Andreessen', 'a16z Co-founder', 'T', 3, 
     'https://pmarca.substack.com/feed', 'https://pmarca.substack.com', 'pmarca', 
     '技术乐观主义代言人'),
    
    -- P 领域：政治/社会
    ('Yuval Noah Harari', '尤瓦尔·赫拉利', '历史学家、《人类简史》作者', 'P', 2, 
     NULL, 'https://www.ynharari.com', 'haraboris', 
     '对人类历史和未来的宏大叙事'),
    
    -- F 领域：金融/经济
    ('Tyler Cowen', 'Tyler Cowen', '乔治梅森大学经济学教授、Marginal Revolution 博主', 'F', 4, 
     'https://marginalrevolution.com/feed', 'https://marginalrevolution.com', 'tylercowen', 
     '经济学博客影响力第一'),
    
    -- Φ 领域：哲学/认知
    ('Daniel Dennett', 'Daniel Dennett', '哲学家、认知科学家', 'Φ', 5, 
     NULL, NULL, NULL, 
     '意识哲学巨匠（已故，但著作仍重要）')
ON CONFLICT (name) DO UPDATE SET
    role = EXCLUDED.role,
    priority = EXCLUDED.priority,
    rss_url = EXCLUDED.rss_url,
    blog_url = EXCLUDED.blog_url,
    twitter_handle = EXCLUDED.twitter_handle,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- 验证
SELECT id, name, name_cn, domain, priority, 
       CASE WHEN rss_url IS NOT NULL THEN '✓' ELSE '-' END as has_rss,
       status
FROM thought_leaders 
ORDER BY priority, domain;
