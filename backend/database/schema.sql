-- 创建数据库
-- CREATE DATABASE thoughts_radar;

-- 连接到数据库后执行以下语句

-- 频段表
CREATE TABLE IF NOT EXISTS bands (
    id VARCHAR(5) PRIMARY KEY,
    domain VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    side_a TEXT NOT NULL,
    side_b TEXT NOT NULL,
    tti INTEGER NOT NULL CHECK (tti >= 0 AND tti <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 雷达条目表
-- 注意：不再使用 UNIQUE(date, freq)，主题日允许同日期同频段多条内容
-- 规则由应用层 (config/day-rules.js) 控制
CREATE TABLE IF NOT EXISTS radar_items (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    freq VARCHAR(5) NOT NULL REFERENCES bands(id),
    stance CHAR(1) NOT NULL CHECK (stance IN ('A', 'B')),
    title TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_avatar VARCHAR(10) NOT NULL,
    author_bio TEXT,
    source TEXT,
    content TEXT NOT NULL,
    tension_q TEXT NOT NULL,
    tension_a TEXT NOT NULL,
    tension_b TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    -- 去重字段
    source_url TEXT,
    video_id VARCHAR(50),
    -- 主题日标识
    theme_day_event VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户行为表
CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    item_id INTEGER NOT NULL REFERENCES radar_items(id) ON DELETE CASCADE,
    liked BOOLEAN DEFAULT FALSE,
    stance CHAR(1) CHECK (stance IN ('A', 'B') OR stance IS NULL),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

-- 创建索引
CREATE INDEX idx_radar_items_date ON radar_items(date DESC);
CREATE INDEX idx_radar_items_freq ON radar_items(freq);
CREATE INDEX idx_radar_items_date_freq ON radar_items(date, freq);
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_item_id ON user_actions(item_id);

-- 去重唯一索引
CREATE UNIQUE INDEX idx_unique_source_url ON radar_items(source_url) WHERE source_url IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_video_id ON radar_items(video_id) WHERE video_id IS NOT NULL;

-- 主题日索引
CREATE INDEX idx_radar_items_theme_day ON radar_items(theme_day_event) WHERE theme_day_event IS NOT NULL;

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bands_updated_at BEFORE UPDATE ON bands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_radar_items_updated_at BEFORE UPDATE ON radar_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_actions_updated_at BEFORE UPDATE ON user_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
