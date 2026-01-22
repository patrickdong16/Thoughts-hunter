/**
 * 补充达沃斯2026主题日内容
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const ADDITIONAL_CONTENT = [
    {
        date: '2026-01-23',
        freq: 'P3',
        stance: 'A',
        title: '碳边境调节机制：气候政策的新地缘政治',
        author_name: 'Mark Carney',
        author_avatar: 'MC',
        author_bio: '加拿大总理，前英格兰银行行长，联合国气候行动特使',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 气候金融领袖对话',
        content: `Carney在达沃斯发表了关于气候政策与国际贸易交叉点的深度演讲。作为曾经的两国央行行长和联合国气候特使，他对气候金融有着独特的见解。他指出，碳边境调节机制(CBAM)正在成为21世纪最重要的贸易政策工具之一。

他详细分析了欧盟CBAM的实施经验及其对全球贸易格局的影响。"我们正在见证气候政策从国内议题演变为地缘政治武器的过程。"Carney指出，当主要经济体对进口商品征收碳关税时，这实质上是在重新定义国际贸易规则，迫使其他国家要么提高自己的碳定价，要么接受出口竞争力下降。

Carney强调加拿大作为资源大国和清洁能源领导者的独特地位。他公布了加拿大的"绿色产业战略"，计划在未来十年投资3000亿加元发展清洁氢能、电池制造和关键矿物加工。他认为，能源转型不仅是环境必需，更是保持经济竞争力的战略选择。`,
        tension_q: '碳边境调节是气候行动还是贸易保护？',
        tension_a: '必要的政策协调工具',
        tension_b: '新形式的贸易壁垒',
        keywords: ['碳边境调节', '气候金融', '加拿大', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'T3',
        stance: 'B',
        title: 'AI工厂时代：算力即国力的新逻辑',
        author_name: 'Jensen Huang',
        author_avatar: 'JH',
        author_bio: 'NVIDIA创始人兼首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 科技领袖主题演讲',
        content: `黄仁勋在达沃斯发表了一场极具前瞻性的主题演讲，提出了"AI工厂"的概念框架。他认为，正如20世纪电力成为工业基础设施一样，21世纪AI算力正在成为新的经济基础设施，各国必须将其视为战略资产。

他首次公开展示了NVIDIA的下一代Blackwell Ultra架构的基准测试数据，显示其AI推理性能比上一代提升4倍，能效提升2.5倍。黄仁勋宣布，NVIDIA将与多个国家政府合作，包括日本、印度、印尼和沙特阿拉伯，帮助它们建设主权AI基础设施。

关于AI芯片供应链的地缘政治风险，黄仁勋坦承这是我们时代最大的技术政策挑战。他透露NVIDIA正在与英特尔和三星深化制造合作，以降低对单一供应商的依赖，但同时强调完全脱钩是不可能的，也是不可取的。`,
        tension_q: 'AI算力应该由谁控制？',
        tension_a: '全球市场分配',
        tension_b: '主权国家战略储备',
        keywords: ['NVIDIA', 'AI基础设施', '算力', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'T4',
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
    {
        date: '2026-01-23',
        freq: 'T5',
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
    {
        date: '2026-01-23',
        freq: 'F3',
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
    {
        date: '2026-01-23',
        freq: 'T6',
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
    {
        date: '2026-01-23',
        freq: 'P4',
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
    },
    {
        date: '2026-01-23',
        freq: 'Φ2',
        stance: 'A',
        title: 'AI对齐的前沿：从理论到工程实践',
        author_name: 'Dario Amodei',
        author_avatar: 'DA',
        author_bio: 'Anthropic首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · AI安全专题研讨会',
        content: `Amodei在达沃斯AI安全专题研讨会上分享了Anthropic在AI对齐领域的最新研究进展。作为AI安全研究的先驱机构，Anthropic的工作对整个行业有着重要的参考价值。

他首先解释了AI对齐问题的核心挑战：我们需要确保AI系统真正理解并遵循人类的意图，而不仅仅是表面上符合规则。Amodei分享了Anthropic开发的宪法AI方法的最新版本。

关于superintelligence的时间线，Amodei比他的同行更为谨慎。他认为真正的通用人工智能可能还需要5-15年，但我们不能等到那时才开始准备安全措施。`,
        tension_q: '我们能否确保超级AI与人类价值观对齐？',
        tension_a: '技术解决方案可行',
        tension_b: '根本性难题无解',
        keywords: ['AI对齐', 'Anthropic', 'AI安全', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'F4',
        stance: 'B',
        title: '去美元化与金融多极化：银行业的新现实',
        author_name: 'Jamie Dimon',
        author_avatar: 'JD',
        author_bio: '摩根大通董事长兼首席执行官',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 全球银行业领袖对话',
        content: `Dimon在达沃斯发表了一场坦率而警示性的演讲，讨论全球金融体系正在经历的结构性变化。作为华尔街最具影响力的银行家之一，他的观点往往被视为金融业主流思维的风向标。

他首先承认去美元化趋势是真实的，尽管进展缓慢。过去十年，美元在全球储备货币中的份额从约65%下降到约58%。这个变化看起来不大，但方向是明确的。

然而，Dimon也警告不要夸大去美元化的速度和影响。美元的地位建立在美国深厚的资本市场、法治传统和政治稳定性之上，这些不是一朝一夕能够复制的。`,
        tension_q: '美元霸权是否正在走向终结？',
        tension_a: '缓慢衰落但长期维持优势',
        tension_b: '加速去美元化不可逆转',
        keywords: ['去美元化', '摩根大通', '金融多极化', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'T7',
        stance: 'B',
        title: 'Grok与xAI：打造最大程度真实的AI',
        author_name: 'Elon Musk',
        author_avatar: 'EM',
        author_bio: 'xAI、特斯拉、SpaceX创始人',
        source: '2026年1月23日 · 达沃斯世界经济论坛 · 远程视频对话',
        content: `Musk通过视频连线参与了达沃斯论坛，讨论了他的AI公司xAI和其旗舰产品Grok的发展愿景。一如既往，他的发言既具有挑衅性又引人深思。

Musk首先抨击了主流AI公司的政治正确偏见。他声称Grok的设计目标是成为最大程度真实的AI，愿意讨论任何话题，即使结论可能让人不舒服。

关于AI安全，Musk继续表达他一贯的警告立场。他仍然认为AI可能是人类面临的最大生存风险之一。但解决方案不是封闭开发，而是开放透明。他宣布xAI将在今年晚些时候完全开源Grok的基础模型。`,
        tension_q: 'AI应该有政治立场吗？',
        tension_a: '保持政治中立',
        tension_b: '反映社会价值观',
        keywords: ['xAI', 'Grok', 'Musk', '达沃斯']
    }
];

async function addContent() {
    console.log('🚀 补充达沃斯2026主题日内容...\n');

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
                        author_avatar = EXCLUDED.author_avatar,
                        author_bio = EXCLUDED.author_bio,
                        source = EXCLUDED.source,
                        content = EXCLUDED.content,
                        tension_q = EXCLUDED.tension_q,
                        tension_a = EXCLUDED.tension_a,
                        tension_b = EXCLUDED.tension_b,
                        keywords = EXCLUDED.keywords
                `, [
                    item.date, item.freq, item.stance, item.title,
                    item.author_name, item.author_avatar, item.author_bio,
                    item.source, item.content, item.tension_q, item.tension_a,
                    item.tension_b, item.keywords
                ]);
                console.log(`✅ [${item.freq}] ${item.author_name}: ${item.title.substring(0, 25)}...`);
                added++;
            } catch (err) {
                console.error(`❌ [${item.freq}] 失败: ${err.message}`);
            }
        }

        console.log(`\n🎉 完成！成功添加 ${added}/${ADDITIONAL_CONTENT.length} 条内容`);

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
