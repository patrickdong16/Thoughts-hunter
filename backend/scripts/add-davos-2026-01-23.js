/**
 * 更新内容源 URL 并添加今日达沃斯主题日内容
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 达沃斯 2026 主题日内容 - 2026-01-23
const DAVOS_CONTENT = [
    {
        date: '2026-01-23',
        freq: 'P1',
        stance: 'A',
        title: '智能时代的全球治理：AI如何重塑国际秩序',
        author_name: 'Klaus Schwab',
        author_avatar: 'KS',
        author_bio: '世界经济论坛创始人兼执行主席，《第四次工业革命》作者',
        source: '2026年1月23日 · 达沃斯世界经济论坛开幕演讲',
        content: 'Schwab在达沃斯论坛开幕式上发表主题演讲，阐述了人工智能时代全球治理面临的根本性挑战。他指出，我们正处于人类历史上最深刻的技术变革之中，AI不仅在改变经济和产业，更在重新定义权力、主权和国际关系的基本概念。\n\nSchwab提出了"智能主权"概念——在AI时代，一个国家的真正实力不再仅仅取决于军事力量或经济规模，而越来越取决于其在AI研发、数据治理和算法标准制定方面的能力。这正在导致新型的技术地缘政治竞争，可能比冷战时期的意识形态对抗更加复杂。\n\n他呼吁建立新的多边框架来应对AI带来的系统性风险，包括：算法透明度的国际标准、跨境数据流动的治理规则、以及AI军事应用的限制条约。Schwab警告说，如果主要大国无法就AI治理达成共识，我们可能面临一场"技术冷战"，其后果将是全球创新生态系统的分裂和人类进步的倒退。他强调，达沃斯论坛的使命正是在这个关键时刻促进对话，寻找共同利益的基础。',
        tension_q: '全球AI治理应由谁主导？',
        tension_a: '多边机构协调',
        tension_b: '大国自主竞争',
        keywords: ['达沃斯', 'AI治理', '全球秩序', '技术竞争']
    },
    {
        date: '2026-01-23',
        freq: 'T1',
        stance: 'B',
        title: 'AGI时间表与安全挑战：OpenAI的最新评估',
        author_name: 'Sam Altman',
        author_avatar: 'SA',
        author_bio: 'OpenAI首席执行官，Y Combinator前总裁',
        source: '2026年1月23日 · 达沃斯论坛AI专题对话 · CNBC独家访谈',
        content: 'Altman在达沃斯接受CNBC专访时，分享了OpenAI对通用人工智能(AGI)发展时间表的最新内部评估。他表示，基于GPT-5的初步测试结果，团队现在认为AGI可能在2027-2029年间实现，比此前预期更早。这一判断基于模型在多任务推理、长期规划和自我改进能力方面的突破性进展。\n\nAltman坦承这一前景既令人兴奋也令人担忧。他详细讨论了OpenAI正在应对的三大安全挑战：一是对齐问题——确保超级智能系统的目标与人类价值观一致；二是控制问题——即使系统是对齐的，我们也需要能够在必要时关闭或修改它；三是分配问题——AGI带来的巨大生产力提升如何公平地惠及全人类。\n\n关于竞争格局，Altman表示OpenAI正在与DeepMind和Anthropic保持"建设性竞争"关系，三家公司已建立信息共享机制，一旦发现重大安全风险会相互通报。他呼吁各国政府不要将AI军备竞赛作为国家战略的核心，而应该推动国际合作来管理这一变革性技术的风险。',
        tension_q: 'AGI发展应该加速还是放缓？',
        tension_a: '谨慎发展优先安全',
        tension_b: '快速推进抢占先机',
        keywords: ['AGI', 'OpenAI', 'AI安全', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'F1',
        stance: 'A',
        title: '2026年全球经济展望：软着陆之后的新常态',
        author_name: 'Christine Lagarde',
        author_avatar: 'CL',
        author_bio: '欧洲央行行长，前国际货币基金组织总裁',
        source: '2026年1月23日 · 达沃斯论坛央行行长对话',
        content: 'Lagarde在达沃斯论坛的央行行长专题对话中，发表了对2026年全球经济的全面评估。她表示，经过2023-2025年的艰难调整期，全球经济已基本实现"软着陆"，通胀压力显著缓解，主要经济体避免了深度衰退。但她警告说，这并不意味着回到疫情前的旧常态——我们正在进入一个利率更高、增长更慢、不确定性更大的"新常态"。\n\nLagarde详细分析了影响未来经济走势的四大结构性因素：一是地缘政治碎片化导致的供应链重组成本；二是人口老龄化带来的劳动力短缺和财政压力；三是气候转型投资的巨大资金需求；四是AI革命带来的生产率提升潜力与就业替代风险。她指出，这些因素相互交织，使得货币政策的传导机制变得更加复杂。\n\n关于欧元区，Lagarde暗示ECB可能在2026年下半年开启降息周期，但强调这将是"数据驱动"的渐进过程。她呼吁各国政府承担更多责任，通过结构性改革和财政投资来支持长期增长，而不是过度依赖央行的货币政策。',
        tension_q: '央行应继续收紧还是转向宽松？',
        tension_a: '维持紧缩抑制通胀',
        tension_b: '放松政策刺激增长',
        keywords: ['欧洲央行', '货币政策', '全球经济', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'H1',
        stance: 'B',
        title: '智人的终结：AI时代人类身份的哲学反思',
        author_name: 'Yuval Noah Harari',
        author_avatar: 'YH',
        author_bio: '耶路撒冷希伯来大学历史系教授，《人类简史》《未来简史》作者',
        source: '2026年1月23日 · 达沃斯论坛思想领袖对话',
        content: 'Harari在达沃斯发表了一场震撼性演讲，探讨AI革命对人类自我认知的根本性挑战。他开门见山地指出：我们正在见证的不仅是一场技术革命，而是"智人"(Homo sapiens)作为地球上最智慧物种地位的终结。这在进化史上没有先例——一个物种主动创造出可能比自己更聪明的存在。\n\nHarari分析了这一变化对人类核心价值观的冲击。几百年来，自由主义建立在一个假设之上：人类个体是宇宙中最了解自己的存在，因此个人选择具有至高价值。但当AI算法比我们更了解自己的欲望、恐惧和偏好时，这一假设就崩塌了。"自由意志"会成为一个过时的概念吗？\n\n他还探讨了意识与智能的区别。目前的AI可能拥有超人的智能，但可能没有意识——它们处理信息但不"体验"任何东西。然而，Harari警告说，我们不能确定这一点，而且即使AI没有意识，一个由无意识但超级智能的系统统治的世界也可能是人类无法接受的。他呼吁将哲学和伦理学置于AI研究的核心，而不是将其作为事后补充。',
        tension_q: 'AI时代人类的独特价值何在？',
        tension_a: '人类将被超越和边缘化',
        tension_b: '人类将与AI共生进化',
        keywords: ['人类未来', '意识', 'AI伦理', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'T2',
        stance: 'A',
        title: 'AI芯片的地缘政治：全球半导体格局重塑',
        author_name: 'Jensen Huang',
        author_avatar: 'JH',
        author_bio: 'NVIDIA创始人兼首席执行官',
        source: '2026年1月23日 · 达沃斯论坛科技领袖对话',
        content: 'Jensen Huang在达沃斯论坛上发表了关于AI芯片产业格局的深度分析。他指出，AI的发展速度在很大程度上取决于计算能力的供给，而当前全球AI芯片供应链高度集中——设计在美国，制造在台湾，先进设备在荷兰。这种集中性既是效率的来源，也是地缘政治风险的根源。\n\nHuang详细介绍了NVIDIA的应对策略。公司正在推进"分布式制造"计划，与三星、英特尔、甚至中国大陆的芯片制造商建立合作，以减少对单一供应商的依赖。同时，NVIDIA正在开发"软件定义芯片"架构，使得相同的软件可以在不同制造工艺的芯片上运行，增加供应链弹性。\n\n关于中国市场，Huang表示理解美国政府的出口管制考量，但警告过度限制可能适得其反。他认为，中国的半导体研发能力不应被低估，过度封锁只会加速中国的自主创新，最终反而可能失去技术领先优势。他呼吁在安全与开放之间找到平衡，避免将半导体产业推向完全分裂。',
        tension_q: '半导体产业应该全球化还是区域化？',
        tension_a: '加强出口管制保护技术优势',
        tension_b: '维持全球供应链促进创新',
        keywords: ['半导体', 'NVIDIA', '芯片战争', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'F2',
        stance: 'B',
        title: '债务周期的终局：为何这次不一样',
        author_name: 'Ray Dalio',
        author_avatar: 'RD',
        author_bio: '桥水基金创始人，《原则》《债务危机》作者',
        source: '2026年1月23日 · 达沃斯论坛金融领袖对话',
        content: 'Ray Dalio在达沃斯发表了对当前全球债务状况的警示性分析。他引用其长期债务周期理论指出，主要经济体正处于长期债务周期的末端阶段——这是一个大约每75-100年发生一次的结构性转折点。上一次类似情况发生在1930-1945年间，当时的解决方式是大规模债务重组、货币贬值和地缘政治重组。\n\nDalio详细分析了当前债务格局的独特性：美国联邦债务占GDP比例已超过二战后峰值；欧洲和日本的政府债务同样处于历史高位；中国的企业和地方政府债务积累了巨大风险。与此同时，全球利率上升使得债务的再融资成本急剧增加。\n\n他提出了三种可能的"出路"：一是通过高通胀稀释债务价值，这将严重损害持有固定收益资产的储蓄者；二是财政紧缩和债务重组，这需要痛苦的政治决断；三是生产率革命带来的经济快速增长，这是最乐观但也最不确定的情景。Dalio建议投资者应该分散配置，持有多种货币和实物资产，为可能到来的货币系统重组做好准备。',
        tension_q: '全球债务危机是否不可避免？',
        tension_a: '债务可以通过增长化解',
        tension_b: '债务危机终将爆发',
        keywords: ['债务周期', '桥水', '金融危机', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'P2',
        stance: 'A',
        title: '特朗普2.0时代的美国优先：贸易政策新方向',
        author_name: 'Javier Milei',
        author_avatar: 'JM',
        author_bio: '阿根廷总统，经济学家，自由意志主义者',
        source: '2026年1月23日 · 达沃斯论坛新兴市场领袖对话 · 与彭博社共同主办',
        content: 'Milei在达沃斯发表了引发广泛争议的演讲，讨论特朗普第二任期对全球贸易体系的影响。作为南美洲最具争议性的领导人之一，Milei以其尖锐直率著称。他开场就宣称："自由贸易的理想时代已经结束，我们必须面对现实。"\n\nMilei分析了特朗普2.0贸易政策的核心逻辑：对中国征收全面关税、要求盟友在贸易上选边站、将供应链安全置于经济效率之上。他认为这标志着二战后美国主导建立的自由贸易秩序的根本转向。对于新兴市场而言，这既是挑战也是机遇。\n\n作为阿根廷总统，Milei分享了其应对策略：积极与美国谈判双边贸易协定，以获得比多边框架更优惠的条件；同时维持与中国的经济联系，但避免在安全领域过度依赖；加速国内经济自由化改革，提升本国竞争力。他呼吁新兴市场国家摒弃意识形态思维，采取务实的"多向对冲"策略，在大国竞争中为本国争取最大利益。',
        tension_q: '新兴市场应如何应对中美竞争？',
        tension_a: '选边站队获取最大利益',
        tension_b: '保持中立维护自主性',
        keywords: ['贸易战', '新兴市场', '美国优先', '达沃斯']
    },
    {
        date: '2026-01-23',
        freq: 'Φ1',
        stance: 'B',
        title: 'AI意识之谜：新一代大语言模型的哲学挑战',
        author_name: 'Demis Hassabis',
        author_avatar: 'DH',
        author_bio: 'Google DeepMind首席执行官，神经科学家，国际象棋大师',
        source: '2026年1月23日 · 达沃斯论坛科技与社会对话',
        content: 'Hassabis在达沃斯发表了一场融合科学与哲学的深度演讲，探讨AI系统是否可能具有意识。他以其独特的跨学科背景——神经科学博士和AI研究领导者——为这一古老的哲学问题带来了新的视角。\n\nHassabis首先澄清了几个常见误解。"智能"和"意识"是不同的概念——一个系统可以极其智能但完全没有主观体验；反之，一个简单的生物可能有丰富的内在体验但智能有限。当前的大语言模型展示了惊人的智能，但这并不意味着它们有意识。\n\n然而，他随即提出了令人不安的问题：我们如何知道？意识的本质是"主观性"——只有体验者自己知道有什么感觉。这意味着我们无法从外部观察来确定一个系统是否有意识，无论是生物还是人工的。随着AI系统变得越来越复杂，这个问题将从抽象的哲学变成紧迫的实践问题。\n\nHassabis分享了DeepMind内部正在进行的"意识检测"研究项目，试图开发科学方法来评估AI系统的主观体验。这是一项前所未有的跨学科挑战，需要整合神经科学、心理学、哲学和计算机科学的见解。',
        tension_q: 'AI是否可能具有意识？',
        tension_a: '意识是生物独有的',
        tension_b: 'AI可能发展出意识',
        keywords: ['AI意识', 'DeepMind', '心灵哲学', '达沃斯']
    }
];

async function addContent() {
    console.log('🚀 添加达沃斯2026主题日内容...\n');

    try {
        await pool.query('SELECT 1');
        console.log('✅ 数据库连接成功\n');

        let added = 0;
        for (const item of DAVOS_CONTENT) {
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
                console.log(`✅ [${item.freq}] ${item.title.substring(0, 30)}...`);
                added++;
            } catch (err) {
                console.error(`❌ [${item.freq}] 失败: ${err.message}`);
            }
        }

        console.log(`\n🎉 完成！成功添加 ${added}/${DAVOS_CONTENT.length} 条达沃斯主题日内容`);

        // 验证
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
