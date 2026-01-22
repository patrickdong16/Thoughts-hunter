/**
 * 数据库初始化脚本 - 确保所有必要的表存在
 * 服务启动时自动运行，创建自动化流程所需的全部表
 */

const pool = require('./config/database');

async function initDatabase() {
  console.log('Initializing database...');

  try {
    // ===============================================
    // 1. 基础函数
    // ===============================================
    await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);
    console.log('✓ update_updated_at function ready');

    // ===============================================
    // 2. 用户表
    // ===============================================
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nickname VARCHAR(50),
                avatar VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP
            )
        `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    console.log('✓ users table ready');

    // ===============================================
    // 3. 内容源表 - 自动采集核心
    // ===============================================
    await pool.query(`
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
            )
        `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_content_sources_domain ON content_sources(domain)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_content_sources_status ON content_sources(status)`);
    console.log('✓ content_sources table ready');

    // ===============================================
    // 4. 草稿表 - AI生成内容暂存
    // ===============================================
    await pool.query(`
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
            )
        `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC)`);
    console.log('✓ drafts table ready');

    // ===============================================
    // 5. 采集日志表 - 追踪已检查的视频
    // ===============================================
    await pool.query(`
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
            )
        `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_collection_log_source_id ON collection_log(source_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_collection_log_analyzed ON collection_log(analyzed)`);
    console.log('✓ collection_log table ready');

    // ===============================================
    // 6. 内容源评分表
    // ===============================================
    await pool.query(`
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
            )
        `);
    console.log('✓ source_metrics table ready');

    // ===============================================
    // 7. 人物热度表
    // ===============================================
    await pool.query(`
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
            )
        `);
    console.log('✓ person_metrics table ready');

    // ===============================================
    // 8. 内容源推荐表
    // ===============================================
    await pool.query(`
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
            )
        `);
    console.log('✓ source_recommendations table ready');

    // ===============================================
    // 9. 推送日志表
    // ===============================================
    await pool.query(`
            CREATE TABLE IF NOT EXISTS push_log (
                id SERIAL PRIMARY KEY,
                push_type VARCHAR(50) DEFAULT 'daily',
                title TEXT,
                body TEXT,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log('✓ push_log table ready');

    // ===============================================
    // 10. 初始化内容源（带YouTube URL）
    // ===============================================
    const initialSources = [
      // YouTube 频道
      { type: 'channel', name: 'World Economic Forum', url: 'https://www.youtube.com/@worldeconomicforum', domain: 'P', default_domain: 'politics', priority_rank: 10, description: '达沃斯论坛官方频道' },
      { type: 'channel', name: 'Bloomberg', url: 'https://www.youtube.com/@BloombergTelevision', domain: 'F', default_domain: 'finance', priority_rank: 9, description: '财经访谈' },
      { type: 'channel', name: 'CNBC', url: 'https://www.youtube.com/@CNBCtelevision', domain: 'F', default_domain: 'finance', priority_rank: 8, description: '商业新闻' },
      { type: 'channel', name: 'Lex Fridman Podcast', url: 'https://www.youtube.com/@lexfridman', domain: 'T', default_domain: 'tech', priority_rank: 10, description: '深度技术访谈' },
      { type: 'channel', name: 'Dwarkesh Podcast', url: 'https://www.youtube.com/@DwarkeshPatel', domain: 'T', default_domain: 'tech', priority_rank: 9, description: 'AI前沿对话' },
      { type: 'channel', name: 'a16z', url: 'https://www.youtube.com/@a16z', domain: 'T', default_domain: 'tech', priority_rank: 8, description: '技术投资视角' },
      { type: 'channel', name: 'Foreign Affairs', url: 'https://www.youtube.com/@ForeignAffairsMagazine', domain: 'P', default_domain: 'politics', priority_rank: 10, description: '国际关系权威' },
      { type: 'channel', name: 'Council on Foreign Relations', url: 'https://www.youtube.com/@cfr', domain: 'P', default_domain: 'politics', priority_rank: 9, description: '政策分析' },
      { type: 'channel', name: 'Bridgewater', url: 'https://www.youtube.com/@Bridgewater', domain: 'F', default_domain: 'finance', priority_rank: 9, description: 'Ray Dalio观点' },
      // 关键人物
      { type: 'person', name: 'Sam Altman', url: null, domain: 'T', default_domain: 'tech', priority_rank: 10, description: 'OpenAI CEO' },
      { type: 'person', name: 'Ray Dalio', url: null, domain: 'F', default_domain: 'finance', priority_rank: 9, description: '桥水创始人' },
      { type: 'person', name: 'Yuval Noah Harari', url: null, domain: 'H', default_domain: 'history', priority_rank: 9, description: '人类简史作者' },
      { type: 'person', name: 'Klaus Schwab', url: null, domain: 'P', default_domain: 'politics', priority_rank: 10, description: '达沃斯论坛创始人' },
      { type: 'person', name: 'Christine Lagarde', url: null, domain: 'F', default_domain: 'finance', priority_rank: 9, description: '欧洲央行行长' },
      { type: 'person', name: 'Jensen Huang', url: null, domain: 'T', default_domain: 'tech', priority_rank: 9, description: 'NVIDIA CEO' },
      { type: 'person', name: 'Satya Nadella', url: null, domain: 'T', default_domain: 'tech', priority_rank: 9, description: '微软CEO' }
    ];

    for (const source of initialSources) {
      await pool.query(`
                INSERT INTO content_sources (type, name, url, domain, default_domain, priority_rank, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (type, name) DO UPDATE SET
                    url = COALESCE(EXCLUDED.url, content_sources.url),
                    description = EXCLUDED.description
            `, [source.type, source.name, source.url, source.domain, source.default_domain, source.priority_rank, source.description]);
    }
    console.log('✓ initial content_sources ready (with YouTube URLs)');

    console.log('\n✅ Database initialization complete!');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = initDatabase;
