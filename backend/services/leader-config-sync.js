/**
 * 思想领袖配置同步服务
 * 从 CONTENT_SOURCES.json 同步到数据库
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

// 配置文件路径 - 使用 process.cwd() 确保在 Docker 中正确解析
// 在 Docker 中，process.cwd() = /app，配置文件在 /app/CONTENT_SOURCES.json
const CONFIG_PATH = path.join(process.cwd(), 'CONTENT_SOURCES.json');

/**
 * 读取配置文件
 */
function loadConfig() {
    try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ 无法读取配置文件:', error.message);
        throw new Error(`配置文件读取失败: ${error.message}`);
    }
}

/**
 * 获取数据库中现有领袖
 */
async function getExistingLeaders() {
    const result = await pool.query('SELECT name, is_active FROM thought_leaders');
    return new Map(result.rows.map(r => [r.name, r.is_active]));
}

/**
 * 对比配置与数据库的差异
 */
async function diffConfig() {
    const config = loadConfig();
    const existingLeaders = await getExistingLeaders();
    const configNames = new Set(config.leaders.map(l => l.name));

    const diff = {
        toAdd: [],      // 配置中有，数据库中没有
        toUpdate: [],   // 配置中有，数据库中有（可能需要更新）
        toDeactivate: [], // 数据库中有，配置中没有
        unchanged: []
    };

    // 检查配置中的领袖
    for (const leader of config.leaders) {
        if (!existingLeaders.has(leader.name)) {
            diff.toAdd.push(leader);
        } else {
            diff.toUpdate.push(leader);
        }
    }

    // 检查需要停用的领袖
    for (const [name, isActive] of existingLeaders) {
        if (!configNames.has(name) && isActive) {
            diff.toDeactivate.push(name);
        }
    }

    return diff;
}

/**
 * 同步配置到数据库
 */
async function syncFromConfig(dryRun = false) {
    console.log('\n========== 思想领袖配置同步 ==========');
    console.log(`配置文件: ${CONFIG_PATH}`);
    console.log(`模式: ${dryRun ? '预览 (dry-run)' : '执行'}`);

    const diff = await diffConfig();

    console.log(`\n📊 差异分析:`);
    console.log(`  新增: ${diff.toAdd.length}`);
    console.log(`  更新: ${diff.toUpdate.length}`);
    console.log(`  停用: ${diff.toDeactivate.length}`);

    if (dryRun) {
        return {
            dryRun: true,
            diff: {
                toAdd: diff.toAdd.map(l => l.name),
                toUpdate: diff.toUpdate.map(l => l.name),
                toDeactivate: diff.toDeactivate
            }
        };
    }

    const results = {
        added: 0,
        updated: 0,
        deactivated: 0,
        errors: []
    };

    // 新增领袖
    for (const leader of diff.toAdd) {
        try {
            await pool.query(`
                INSERT INTO thought_leaders 
                (name, name_cn, role, domain, priority, rss_url, blog_url, twitter_handle, notes, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            `, [
                leader.name,
                leader.name_cn || null,
                leader.role || null,
                leader.domain,
                leader.priority || 3,
                leader.rss_url || null,
                leader.blog_url || null,
                leader.twitter || null,
                leader.focus || null
            ]);
            results.added++;
            console.log(`  ✅ 新增: ${leader.name}`);
        } catch (error) {
            if (error.code === '23505') { // unique violation
                console.log(`  ⚠️ 已存在: ${leader.name}`);
            } else {
                results.errors.push({ name: leader.name, error: error.message });
                console.error(`  ❌ 新增失败: ${leader.name} - ${error.message}`);
            }
        }
    }

    // 更新领袖
    for (const leader of diff.toUpdate) {
        try {
            await pool.query(`
                UPDATE thought_leaders SET
                    name_cn = COALESCE($2, name_cn),
                    role = COALESCE($3, role),
                    domain = $4,
                    priority = $5,
                    rss_url = COALESCE($6, rss_url),
                    blog_url = COALESCE($7, blog_url),
                    twitter_handle = COALESCE($8, twitter_handle),
                    notes = COALESCE($9, notes),
                    is_active = true,
                    updated_at = NOW()
                WHERE name = $1
            `, [
                leader.name,
                leader.name_cn || null,
                leader.role || null,
                leader.domain,
                leader.priority || 3,
                leader.rss_url || null,
                leader.blog_url || null,
                leader.twitter || null,
                leader.focus || null
            ]);
            results.updated++;
        } catch (error) {
            results.errors.push({ name: leader.name, error: error.message });
        }
    }

    // 停用不在配置中的领袖
    for (const name of diff.toDeactivate) {
        try {
            await pool.query(`
                UPDATE thought_leaders SET is_active = false, updated_at = NOW()
                WHERE name = $1
            `, [name]);
            results.deactivated++;
            console.log(`  🔴 停用: ${name}`);
        } catch (error) {
            results.errors.push({ name, error: error.message });
        }
    }

    console.log(`\n✅ 同步完成: 新增 ${results.added}, 更新 ${results.updated}, 停用 ${results.deactivated}`);
    if (results.errors.length > 0) {
        console.log(`⚠️ 错误: ${results.errors.length}`);
    }

    return results;
}

/**
 * 获取配置统计
 */
function getConfigStats() {
    const config = loadConfig();
    const leadersByDomain = {};

    for (const leader of config.leaders) {
        leadersByDomain[leader.domain] = (leadersByDomain[leader.domain] || 0) + 1;
    }

    return {
        version: config.version,
        lastUpdated: config.lastUpdated,
        totalLeaders: config.leaders.length,
        leadersByDomain,
        youtubeChannels: config.youtubeChannels?.length || 0,
        publications: config.publications?.length || 0
    };
}

module.exports = {
    loadConfig,
    diffConfig,
    syncFromConfig,
    getConfigStats
};
