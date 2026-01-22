/**
 * 补充达沃斯2026主题日内容 - 使用正确的频段
 * 可用频段: F1, F2, H1, H2, H3, P1, P2, P3, R1, R2, T1, T2, T3, Φ1, Φ2, Φ3
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const ADDITIONAL_CONTENT = [
    // 黄仁勋 - AI与能源 (使用R1)
    {
        date: '2026-01-23',
        freq: 'R1',
        stance: 'A',
        title: 'AI的能源悖论：数据中心如何重塑全球能源格局',
        author_name: 'Jensen Huang',
        author_avatar: 'JH',
        author_bio: 'NVIDIA创始人兼首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 能源与技术圆桌论坛',
        content: `在达沃斯的能源与技术圆桌论坛上，黄仁勋深入讨论了AI发展与能源消耗之间的复杂关系。他首先承认了批评者的担忧：大型AI数据中心的电力消耗确实以惊人的速度增长。

然而，黄仁勋提出了一个反直觉的观点：AI是解决能源问题的关键，而不仅仅是问题的一部分。他展示了NVIDIA与能源公司合作的案例研究，显示AI如何帮助优化电网调度、预测可再生能源产出波动、以及提高核电站的安全性和效率。

黄仁勋还宣布了一个惊人的计划：NVIDIA将投资10亿美元开发专门针对核聚变研究的AI系统，与多家聚变初创公司合作，希望利用AI加速实现商业核聚变。如果AI能帮助我们比预期提前10年实现核聚变，那它消耗的所有能源都是值得的。`,
        tension_q: 'AI发展与能源可持续性是否矛盾？',
        tension_a: 'AI将成为能源解决方案',
        tension_b: 'AI加剧能源危机',
        keywords: ['AI能源', '数据中心', '核聚变', '达沃斯']
    },
    // 黄仁勋 - AI与就业 (使用H2)
    {
        date: '2026-01-23',
        freq: 'H2',
        stance: 'B',
        title: '人机共生：AI时代的劳动力重塑',
        author_name: 'Jensen Huang',
        author_avatar: 'JH',
        author_bio: 'NVIDIA创始人兼首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 未来劳动力专题对话',
        content: `在达沃斯未来劳动力专题对话中，黄仁勋直面了AI对就业市场冲击这一敏感话题。他承认未来5-10年，AI将彻底改变几乎所有知识工作的性质，这种变化的速度和规模是前所未有的。

然而，黄仁勋拒绝接受"AI抢走工作"的简单叙事。他提出"增强而非替代"的愿景：AI将作为超级助手提升每个工作者的能力，就像电子表格改变了会计师的工作而不是消灭他们。

关于教育和再培训，黄仁勋宣布NVIDIA将投资5亿美元建立"AI技能普及计划"，与全球50所大学合作，免费培训100万名AI应用开发者。他强调这不是慈善而是必需：AI技术只有当足够多的人知道如何使用它时才能发挥价值。`,
        tension_q: 'AI是劳动者的朋友还是敌人？',
        tension_a: '增强人类能力',
        tension_b: '大规模失业威胁',
        keywords: ['AI就业', '劳动力转型', '技能培训', '达沃斯']
    },
    // Larry Fink (使用R2)
    {
        date: '2026-01-23',
        freq: 'R2',
        stance: 'A',
        title: 'ESG的重新定义：从意识形态到实用主义',
        author_name: 'Larry Fink',
        author_avatar: 'LF',
        author_bio: '贝莱德集团董事长兼首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 可持续金融领袖对话',
        content: `Fink在达沃斯发表了一场可能重新定义ESG投资叙事的演讲。作为全球最大资产管理公司的掌门人，贝莱德管理着超过11万亿美元资产，他的每一句话都会在金融市场产生巨大影响。

Fink承认ESG这个术语已经被政治化到无法有效沟通的地步。他宣布贝莱德将不再在公开文件中使用ESG这个缩写，转而采用"转型风险"和"长期价值创造"等更中性的术语。

然而，这并不意味着贝莱德放弃了可持续投资。Fink详细阐述了公司新开发的"转型就绪度"评估框架，该框架评估企业在能源转型中的适应能力，而不是简单地根据当前碳排放进行道德判断。`,
        tension_q: 'ESG投资是否已经失去方向？',
        tension_a: '需要务实重塑',
        tension_b: '原有方向正确',
        keywords: ['ESG', '贝莱德', '可持续投资', '达沃斯']
    },
    // Sundar Pichai (使用Φ3)
    {
        date: '2026-01-23',
        freq: 'Φ3',
        stance: 'A',
        title: 'Gemini 2.0：AI原生计算的新范式',
        author_name: 'Sundar Pichai',
        author_avatar: 'SP',
        author_bio: 'Alphabet和Google首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 技术愿景专题对话',
        content: `Pichai在达沃斯首次公开讨论了Google即将发布的Gemini 2.0的技术愿景。他将这一代AI描述为真正的AI原生计算革命的开端，类比了从命令行到图形界面、再到触摸屏的交互范式演变。

Pichai详细解释了Gemini 2.0的多模态推理能力如何改变人机交互。想象一下，你不需要在不同的应用之间切换，AI理解你的意图，自动协调不同的工具和服务来完成任务。

关于AI安全，Pichai分享了Google的"分层防护"策略，包括模型层面的安全训练、应用层面的使用限制、以及系统层面的监控。他承诺Google将在发布前将Gemini 2.0的安全评估报告向独立研究者开放。`,
        tension_q: 'AI应该多大程度地自主决策？',
        tension_a: '有限自主辅助人类',
        tension_b: '完全自主代理',
        keywords: ['Google', 'Gemini', 'AI交互', '达沃斯']
    },
    // Ursula von der Leyen (使用H3)
    {
        date: '2026-01-23',
        freq: 'H3',
        stance: 'B',
        title: '欧洲数字主权：在监管与创新之间寻找平衡',
        author_name: 'Ursula von der Leyen',
        author_avatar: 'UL',
        author_bio: '欧盟委员会主席',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 数字治理领袖对话',
        content: `Von der Leyen在达沃斯发表了关于欧洲数字战略的全面阐述。面对欧洲在AI竞赛中落后于美国和中国的批评，她既承认了问题也为欧洲的路径选择进行了有力辩护。

她首先回应了对欧盟AI法案"过度监管"的批评：是的，我们选择先建立规则再全面发展，这与硅谷的哲学不同。但我们相信，负责任的创新最终会赢得公众信任，这是可持续发展的前提。

关于欧洲数字主权，她宣布了一项200亿欧元的"欧洲AI主权基金"，将投资于三个优先领域：开源大模型开发、战略级AI算力基础设施、以及AI人才培养。`,
        tension_q: '监管会阻碍还是促进创新？',
        tension_a: '规则促进可持续创新',
        tension_b: '监管抑制发展活力',
        keywords: ['欧盟', 'AI法案', '数字主权', '达沃斯']
    }
];

async function addContent() {
    console.log('🚀 补充达沃斯内容（使用正确频段）...\n');

    try {
        await pool.query('SELECT 1');
        console.log('✅ 数据库连接成功\n');

        let added = 0;
        for (const item of ADDITIONAL_CONTENT) {
            try {
                await pool.query(`
                    INSERT INTO radar_items (
                        date, freq, stance, title, author_name, author_avatar,
                        author_bio, source, content, tension_q, tension_a, tension_b, keywords
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (date, freq) DO UPDATE SET
                        stance = EXCLUDED.stance,
                        title = EXCLUDED.title,
                        author_name = EXCLUDED.author_name,
                        content = EXCLUDED.content
                `, [
                    item.date, item.freq, item.stance, item.title,
                    item.author_name, item.author_avatar, item.author_bio,
                    item.source, item.content, item.tension_q, item.tension_a,
                    item.tension_b, item.keywords
                ]);
                console.log(`✅ [${item.freq}] ${item.author_name}: ${item.title.substring(0, 30)}...`);
                added++;
            } catch (err) {
                console.error(`❌ [${item.freq}] 失败: ${err.message}`);
            }
        }

        console.log(`\n🎉 完成！添加 ${added}/${ADDITIONAL_CONTENT.length} 条`);

        const result = await pool.query(
            "SELECT COUNT(*) as count FROM radar_items WHERE date = '2026-01-23'"
        );
        console.log(`📊 2026-01-23 总内容数: ${result.rows[0].count}`);

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await pool.end();
    }
}

addContent();
