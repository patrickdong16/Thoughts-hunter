/**
 * 每日运营报告生成服务 (Daily Report Generator)
 * 
 * 生成包含四大模块的运营报告：
 * 1. 内容报告 - 当日发布的雷达内容
 * 2. 用户报告 - 注册/阅读/收藏/立场选择
 * 3. 运维报告 - 系统稳定性/风险报警
 * 4. 活动提醒 - 未来一周重大活动
 */

const pool = require('../config/database');
const reportConfig = require('../config/report-config.json');
const { getRulesForDate } = require('../config/day-rules');

/**
 * 生成完整的每日运营报告
 * @param {string} date - 报告日期 YYYY-MM-DD
 * @returns {Object} 报告数据
 */
async function generateDailyReport(date) {
    const dayRules = getRulesForDate(date);

    return {
        date,
        generatedAt: new Date().toISOString(),
        isThemeDay: dayRules.isThemeDay,
        themeDayEvent: dayRules.event,
        content: await getContentReport(date),
        users: await getUserReport(date),
        operations: await getOpsReport(date),
        upcomingEvents: getUpcomingEvents(date)
    };
}

/**
 * 1. 内容报告 - 当日发布的雷达内容
 */
async function getContentReport(date) {
    try {
        const result = await pool.query(`
            SELECT 
                ri.id, ri.freq, ri.stance, ri.title, ri.author_name,
                b.domain
            FROM radar_items ri
            JOIN bands b ON ri.freq = b.id
            WHERE ri.date = $1
            ORDER BY ri.freq
        `, [date]);

        // 按领域统计
        const byDomain = {};
        result.rows.forEach(item => {
            byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
        });

        return {
            total: result.rows.length,
            items: result.rows.map(item => ({
                id: item.id,
                freq: item.freq,
                stance: item.stance,
                title: item.title,
                author: item.author_name,
                domain: item.domain
            })),
            byDomain
        };
    } catch (error) {
        console.error('Error generating content report:', error);
        return { total: 0, items: [], byDomain: {}, error: error.message };
    }
}

/**
 * 2. 用户报告 - 用户行为统计
 */
async function getUserReport(date) {
    try {
        // 新注册用户
        const newUsersResult = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE DATE(created_at) = $1
        `, [date]);

        // 当日活跃用户（有任何操作）
        const activeUsersResult = await pool.query(`
            SELECT COUNT(DISTINCT user_id) as count FROM user_actions 
            WHERE DATE(updated_at) = $1
        `, [date]);

        // 收藏统计
        const likesResult = await pool.query(`
            SELECT COUNT(*) as count FROM user_actions 
            WHERE liked = true AND DATE(updated_at) = $1
        `, [date]);

        // 立场选择分布
        const stanceResult = await pool.query(`
            SELECT stance, COUNT(*) as count FROM user_actions 
            WHERE stance IS NOT NULL AND DATE(updated_at) = $1
            GROUP BY stance
        `, [date]);

        const stanceA = stanceResult.rows.find(r => r.stance === 'A')?.count || 0;
        const stanceB = stanceResult.rows.find(r => r.stance === 'B')?.count || 0;
        const stanceTotal = parseInt(stanceA) + parseInt(stanceB);

        return {
            newUsers: parseInt(newUsersResult.rows[0]?.count || 0),
            activeUsers: parseInt(activeUsersResult.rows[0]?.count || 0),
            likes: parseInt(likesResult.rows[0]?.count || 0),
            stanceSelections: {
                total: stanceTotal,
                A: parseInt(stanceA),
                B: parseInt(stanceB),
                ratioA: stanceTotal > 0 ? Math.round((stanceA / stanceTotal) * 100) : 50,
                ratioB: stanceTotal > 0 ? Math.round((stanceB / stanceTotal) * 100) : 50
            }
        };
    } catch (error) {
        console.error('Error generating user report:', error);
        return {
            newUsers: 0,
            activeUsers: 0,
            likes: 0,
            stanceSelections: { total: 0, A: 0, B: 0, ratioA: 50, ratioB: 50 },
            error: error.message
        };
    }
}

/**
 * 3. 运维报告 - 系统状态
 */
async function getOpsReport(date) {
    try {
        // 推送统计
        const pushResult = await pool.query(`
            SELECT 
                SUM(success_count) as success,
                SUM(failure_count) as failure
            FROM push_log 
            WHERE DATE(sent_at) = $1
        `, [date]);

        const pushSuccess = parseInt(pushResult.rows[0]?.success || 0);
        const pushFailure = parseInt(pushResult.rows[0]?.failure || 0);
        const pushTotal = pushSuccess + pushFailure;

        return {
            apiStatus: 'healthy', // 简化版，可扩展为真正的健康检查
            pushStats: {
                total: pushTotal,
                success: pushSuccess,
                failure: pushFailure,
                successRate: pushTotal > 0 ? Math.round((pushSuccess / pushTotal) * 100) : 100
            },
            alerts: [] // 风险报警列表
        };
    } catch (error) {
        console.error('Error generating ops report:', error);
        return {
            apiStatus: 'unknown',
            pushStats: { total: 0, success: 0, failure: 0, successRate: 100 },
            alerts: [{ level: 'error', message: error.message }]
        };
    }
}

/**
 * 4. 未来活动提醒 - 未来7天的重大活动
 */
function getUpcomingEvents(date) {
    const today = new Date(date);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    const events = [];

    for (const event of reportConfig.upcomingEvents) {
        const eventDate = new Date(event.date);
        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

        // 只显示未来30天内的活动
        if (daysUntil > 0 && daysUntil <= 30) {
            events.push({
                date: event.date,
                endDate: event.endDate,
                event: event.event,
                eventEn: event.eventEn,
                daysUntil,
                suggestThemeDay: event.suggestThemeDay,
                isWithinWeek: daysUntil <= 7
            });
        }
    }

    // 按日期排序
    events.sort((a, b) => a.daysUntil - b.daysUntil);

    return events;
}

/**
 * 渲染报告为 HTML 格式
 */
function renderReportHTML(report) {
    const formatDate = (d) => {
        const date = new Date(d);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    // 内容列表
    const contentList = report.content.items.map((item, i) =>
        `<tr>
            <td>${i + 1}</td>
            <td><span style="background:#1a1a2e;padding:2px 6px;border-radius:4px;">${item.freq}-${item.stance}</span></td>
            <td>${item.title}</td>
            <td>${item.author}</td>
        </tr>`
    ).join('');

    // 活动列表
    const eventsList = report.upcomingEvents.map(e =>
        `<tr style="${e.isWithinWeek ? 'background:#fff3cd;' : ''}">
            <td>${e.date}</td>
            <td>${e.event}</td>
            <td>${e.daysUntil}天后</td>
            <td>${e.suggestThemeDay ? '⚠️ 建议指定为主题日' : ''}</td>
        </tr>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #1a1a2e; border-bottom: 3px solid #00ff88; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 24px; }
        .section { margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; }
        .stat { display: inline-block; margin: 8px 16px 8px 0; }
        .stat-value { font-size: 24px; font-weight: bold; color: #00cc6a; }
        .stat-label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
        th { background: #f0f0f0; }
        .theme-day { background: #e8f5e9; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; }
        .alert { background: #fff3cd; padding: 8px 12px; border-radius: 6px; margin: 8px 0; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 思想雷达每日运营报告</h1>
        <p><strong>报告日期：</strong>${formatDate(report.date)}</p>
        ${report.isThemeDay ? `<div class="theme-day">🔴 <strong>主题日</strong>：${report.themeDayEvent}</div>` : ''}
        
        <h2>📝 今日内容</h2>
        <div class="section">
            <div class="stat"><span class="stat-value">${report.content.total}</span><br><span class="stat-label">发布内容</span></div>
            ${report.content.total > 0 ? `
            <table>
                <tr><th>#</th><th>频段</th><th>标题</th><th>作者</th></tr>
                ${contentList}
            </table>` : '<p>今日暂无发布内容</p>'}
        </div>
        
        <h2>👥 用户数据</h2>
        <div class="section">
            <div class="stat"><span class="stat-value">${report.users.newUsers}</span><br><span class="stat-label">新注册</span></div>
            <div class="stat"><span class="stat-value">${report.users.activeUsers}</span><br><span class="stat-label">活跃用户</span></div>
            <div class="stat"><span class="stat-value">${report.users.likes}</span><br><span class="stat-label">收藏次数</span></div>
            <div class="stat"><span class="stat-value">${report.users.stanceSelections.ratioA}% / ${report.users.stanceSelections.ratioB}%</span><br><span class="stat-label">A极 / B极</span></div>
        </div>
        
        <h2>⚙️ 系统状态</h2>
        <div class="section">
            <div class="stat"><span class="stat-value" style="color:${report.operations.apiStatus === 'healthy' ? '#00cc6a' : '#ff6b6b'}">●</span><br><span class="stat-label">API ${report.operations.apiStatus === 'healthy' ? '正常' : '异常'}</span></div>
            <div class="stat"><span class="stat-value">${report.operations.pushStats.successRate}%</span><br><span class="stat-label">推送成功率</span></div>
            ${report.operations.alerts.length > 0 ? report.operations.alerts.map(a => `<div class="alert">⚠️ ${a.message}</div>`).join('') : ''}
        </div>
        
        <h2>📅 未来活动提醒</h2>
        <div class="section">
            ${report.upcomingEvents.length > 0 ? `
            <table>
                <tr><th>日期</th><th>活动</th><th>距今</th><th>建议</th></tr>
                ${eventsList}
            </table>` : '<p>未来30天内暂无预设活动</p>'}
        </div>
        
        <div class="footer">
            本报告由思想雷达系统自动生成<br>
            生成时间：${report.generatedAt}
        </div>
    </div>
</body>
</html>`;
}

/**
 * 渲染报告为纯文本格式（备用）
 */
function renderReportText(report) {
    const lines = [
        '═══════════════════════════════════════════════════',
        `     思想雷达每日运营报告 - ${report.date}`,
        '═══════════════════════════════════════════════════',
        '',
        `📝 今日内容 (${report.content.total}条)`,
        '────────────────────────────────────────────────',
    ];

    report.content.items.forEach((item, i) => {
        lines.push(`${i + 1}. [${item.freq}-${item.stance}] ${item.title} - ${item.author}`);
    });

    lines.push('');
    lines.push('👥 用户数据');
    lines.push('────────────────────────────────────────────────');
    lines.push(`• 新注册用户: ${report.users.newUsers}`);
    lines.push(`• 活跃用户: ${report.users.activeUsers}`);
    lines.push(`• 收藏次数: ${report.users.likes}`);
    lines.push(`• 立场选择: A极 ${report.users.stanceSelections.ratioA}% / B极 ${report.users.stanceSelections.ratioB}%`);

    lines.push('');
    lines.push('⚙️ 系统状态');
    lines.push('────────────────────────────────────────────────');
    lines.push(`• API 状态: ${report.operations.apiStatus === 'healthy' ? '正常 ✓' : '异常 ✗'}`);
    lines.push(`• 推送成功率: ${report.operations.pushStats.successRate}%`);

    lines.push('');
    lines.push('📅 未来活动提醒');
    lines.push('────────────────────────────────────────────────');
    report.upcomingEvents.forEach(e => {
        lines.push(`${e.isWithinWeek ? '⚠️' : '○'} ${e.date} ${e.event} (${e.daysUntil}天后)`);
        if (e.suggestThemeDay) lines.push('    建议: 考虑指定为主题日');
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════');

    return lines.join('\n');
}

module.exports = {
    generateDailyReport,
    getContentReport,
    getUserReport,
    getOpsReport,
    getUpcomingEvents,
    renderReportHTML,
    renderReportText
};
