// 补充内容 - 达到每日6条配额
const https = require('https');

const additionalContent = [
    // 2026-01-22 需要+4条 (已有T1,T2)
    {
        date: '2026-01-22',
        freq: 'P2',
        stance: 'A',
        title: 'AI对就业的影响被严重高估：诺奖得主的冷静分析',
        author_name: 'Daron Acemoglu',
        author_avatar: 'DA',
        author_bio: 'MIT经济学教授，2024年诺贝尔经济学奖得主',
        source: '2025年10月7日 · AI and the Future of Work论坛 · 现场录制',
        content: '2024年诺贝尔经济学奖得主Daron Acemoglu在"AI与工作未来"论坛上发表了对AI就业影响的谨慎评估，这与科技界常见的末日论调形成鲜明对比。Acemoglu估计，未来十年内AI将直接影响约5%的工作岗位——远低于许多预测。他指出当前AI擅长处理可预测办公环境中的认知任务（如基础软件开发、IT安全、会计），但对需要高度人际互动或判断力的岗位（如CEO或建筑工人）影响有限。在他与Simon Johnson合著的《权力与进步》中，Acemoglu主张应发展"以劳动者为中心的AI"——放大人类能力而非简单替代。他强调，技术变革的受益者取决于制度设计，而非技术本身的必然逻辑。',
        tension_q: 'AI是否将导致大规模失业？',
        tension_a: '影响被过度夸大，5%是更现实的估计',
        tension_b: '技术失业将是不可避免的趋势',
        keywords: ['Daron Acemoglu', 'AI就业', '诺贝尔经济学奖', '技术失业']
    },
    {
        date: '2026-01-22',
        freq: 'Φ3',
        stance: 'B',
        title: '深度乌托邦的困境：当所有问题都被解决后人类该做什么',
        author_name: 'Nick Bostrom',
        author_avatar: 'NB',
        author_bio: '牛津大学教授，《超级智能》《深度乌托邦》作者',
        source: '2025年6月5日 · YouTube访谈 · From Superintelligence to Deep Utopia',
        content: '在关于其新书《深度乌托邦》的访谈中，Nick Bostrom探讨了一个哲学家对未来思考中常被忽视的问题：如果超级智能真正解决了疾病、贫困、甚至死亡——人类将如何找到生活的意义？Bostrom将此称为"解决后问题"（post-solution problem）。他指出，在一个技术能满足所有物质需求的世界中，传统的人生意义来源——奋斗、克服困难、为未来牺牲——都将消失。这不仅是一个存在主义的挑战，也是一个政治问题：谁来决定"理想生活"的定义？Bostrom认为，任何关于AI未来的严肃讨论都必须包含这一维度。单纯专注于"如何到达那里"而忽视"到达后做什么"是思维上的严重疏漏。',
        tension_q: '超级智能解决一切问题后，人类如何找到意义？',
        tension_a: '新的意义形式将自然涌现',
        tension_b: '这是一个需要提前认真思考的根本问题',
        keywords: ['Nick Bostrom', '深度乌托邦', '存在意义', '后稀缺社会']
    },
    {
        date: '2026-01-22',
        freq: 'H2',
        stance: 'A',
        title: '社会崩溃的预警指标：历史动力学的量化分析',
        author_name: 'Peter Turchin',
        author_avatar: 'PT',
        author_bio: '康涅狄格大学教授，历史动力学创始人',
        source: '2024年 · 《衰落的年代》研究系列 · 基于cliodynamics方法论',
        content: 'Peter Turchin是"历史动力学"（cliodynamics）学派的创始人，他试图用数学模型来预测社会周期。在其研究系列中，Turchin提出了几个社会不稳定的先行指标：精英过剩（过多的人竞争有限的高地位职位）、实际工资停滞、政府财政危机、以及"反精英"政治的兴起。他特别指出，当精英内部的竞争变得过于激烈时，一些精英会转向民粹主义策略来获取权力，这会进一步加剧社会分裂。Turchin的模型预测美国在2020年代会进入"动荡期"，这一预测似乎正在应验。他认为这些模式不是命定的，但需要认识到才能干预——正如医生需要先诊断才能治疗一样。',
        tension_q: '历史周期是否可以被预测和干预？',
        tension_a: '识别模式是改变它们的第一步',
        tension_b: '复杂系统的预测本质上是不可能的',
        keywords: ['Peter Turchin', '历史动力学', '社会崩溃', '精英过剩']
    },
    {
        date: '2026-01-22',
        freq: 'R1',
        stance: 'B',
        title: '虚假人格应被禁止：Harari论AI与民主的根本冲突',
        author_name: 'Yuval Noah Harari',
        author_avatar: 'YH',
        author_bio: '希伯来大学教授，《人类简史》《Nexus》作者',
        source: '2025年3月 · 东京小组讨论 · 信息时代的风险与机遇',
        content: '在东京的一场小组讨论中，Yuval Noah Harari提出了一个激进但重要的政策建议：应当全面禁止"虚假人格"——即任何假装是人类的AI系统。Harari的核心论点是：民主政治依赖于公民之间的真诚对话，而当我们无法区分真人和机器时，这种对话的基础就被彻底侵蚀了。他指出，AI生成的虚假人格可以大规模制造"合成共识"，让决策者误以为某个政策有广泛的公众支持。更危险的是，人们可能会开始普遍不信任一切网络互动，这对民主讨论同样是致命的。Harari强调，这不是一个可以延后处理的问题——AI技术的发展速度意味着我们可能只有很窄的窗口期来建立必要的规则和社会规范。',
        tension_q: 'AI应该被允许假装成人类吗？',
        tension_a: '这是表达自由的一部分',
        tension_b: '必须明确禁止以保护民主',
        keywords: ['Yuval Harari', 'AI虚假人格', '民主危机', '信息战']
    },

    // 2026-01-21 需要+4条 (已有Φ1,P1)
    {
        date: '2026-01-21',
        freq: 'T1',
        stance: 'B',
        title: '不发展超级智能本身就是存在性灾难',
        author_name: 'Nick Bostrom',
        author_avatar: 'NB',
        author_bio: '牛津大学教授，《超级智能》《深度乌托邦》作者',
        source: '2025年3月25日 · Adam Ford访谈 · Science, Technology & the Future',
        content: '在Adam Ford的访谈中，Nick Bostrom提出了一个令人惊讶的观点：未能发展超级智能本身也可能是一种"存在性灾难"。这看似与他在《超级智能》中关于AI风险的警告相矛盾，但Bostrom解释说，这两者实际上是同一枚硬币的两面。如果人类永远停留在当前的技术水平，我们将无法应对其他存在性风险——如小行星撞击、超级火山爆发、甚至太阳最终的膨胀。此外，当前人类的苦难——疾病、衰老、死亡——在技术上是可以解决的，选择不去发展这些技术在道德上是有问题的。Bostrom强调，这并不意味着我们应该不计后果地冲向超级智能，而是说"暂停"不是一个可行的长期策略。',
        tension_q: '人类是否应该追求超级智能的发展？',
        tension_a: 'AI风险太高，应该放缓发展',
        tension_b: '不发展本身也是一种风险',
        keywords: ['Nick Bostrom', '超级智能', '存在性风险', '技术暂停']
    },
    {
        date: '2026-01-21',
        freq: 'F2',
        stance: 'A',
        title: '金融化正在侵蚀社会基础：对房屋资产化的批判',
        author_name: 'Rana Foroohar',
        author_avatar: 'RF',
        author_bio: '金融时报副主编，《Makers and Takers》作者',
        source: '2025年 · Financial Times专栏 · 关于金融化的系列分析',
        content: '金融时报副主编Rana Foroohar在其系列分析中，深入探讨了"金融化"如何改变了经济的基本结构。她的核心论点是：当金融部门从服务实体经济转变为从实体经济中提取价值时，社会的根基就开始动摇。Foroohar以住房市场为例：当房屋从"住所"变成"资产类别"，价格就不再由居住需求决定，而是由投资回报决定。这导致了一代年轻人被排斥在住房市场之外，同时also使房价对利率变化极其敏感，增加了系统性风险。她指出，这种模式正在扩展到教育、医疗、甚至基础设施领域。解决方案不是简单地"更多监管"，而是需要重新思考我们允许将什么东西转化为金融资产。',
        tension_q: '金融化是经济发展的必然阶段还是病态？',
        tension_a: '过度金融化正在损害社会基础',
        tension_b: '金融创新提高了资源配置效率',
        keywords: ['金融化', 'Rana Foroohar', '房地产', '系统性风险']
    },
    {
        date: '2026-01-21',
        freq: 'T3',
        stance: 'A',
        title: '开源AI的民主化力量：为什么封闭模型威胁创新',
        author_name: 'Yann LeCun',
        author_avatar: 'YL',
        author_bio: 'Meta首席AI科学家，图灵奖得主',
        source: '2025年 · 多次公开演讲和社交媒体讨论 · 关于开源AI的倡导',
        content: 'Meta首席AI科学家、图灵奖得主Yann LeCun一直是开源AI最坚定的倡导者之一。他认为，将AI能力集中在少数公司手中不仅不利于创新，还会加剧权力不平等。LeCun指出，历史上最重要的技术进步——从互联网协议到Linux操作系统——都是通过开放协作实现的。封闭模型意味着只有少数公司能够决定AI的发展方向，而这些决定可能不符合更广泛的社会利益。他也回应了对开源AI安全性的担忧：与其担心"坏人获得AI能力"，不如担心"只有少数人控制AI能力"。开源允许更多的眼睛检查代码，发现漏洞，这实际上可能比封闭开发更安全。',
        tension_q: 'AI模型应该开源还是封闭？',
        tension_a: '开源促进创新和民主化',
        tension_b: '封闭能更好地控制风险',
        keywords: ['Yann LeCun', '开源AI', 'Meta', 'AI民主化']
    },
    {
        date: '2026-01-21',
        freq: 'H3',
        stance: 'B',
        title: '帝国衰落的文化诊断：为什么精英共识的崩溃比制度更致命',
        author_name: 'Jonathan Haidt',
        author_avatar: 'JH',
        author_bio: 'NYU斯特恩商学院教授，《正义之心》作者',
        source: '2025年 · 多次访谈和演讲 · 关于社会分裂与道德心理学',
        content: 'NYU教授Jonathan Haidt从道德心理学角度分析了当前西方社会的分裂。他的核心观点是：制度的衰落是症状，而非病因——真正的病因是精英阶层的道德共识已经瓦解。Haidt指出，历史上稳定的社会都依赖于某种"神圣故事"——关于我们是谁、我们应该做什么的共识性叙事。在美国，这种故事曾经包括：美国例外论、自由市场资本主义、进步的信念等。但这些叙事在过去二十年中逐一被解构，而没有新的叙事来填补空白。结果是一个"意义危机"——人们不知道为什么要合作，不知道什么是共同的善。他认为社交媒体加速了这一过程，但根本原因在意识形态领域发展已久。',
        tension_q: '当前的社会分裂是暂时现象还是深层危机？',
        tension_a: '这是正常的政治周期波动',
        tension_b: '反映了更深层的意义和认同危机',
        keywords: ['Jonathan Haidt', '社会分裂', '道德心理学', '意义危机']
    },

    // 2026-01-20 需要+4条 (已有Φ2,H1)
    {
        date: '2026-01-20',
        freq: 'T1',
        stance: 'A',
        title: 'AI将在一年内达到超级智能：Bostrom的最新预测',
        author_name: 'Nick Bostrom',
        author_avatar: 'NB',
        author_bio: '牛津大学教授，《超级智能》《深度乌托邦》作者',
        source: '2025年 · Science, Technology & the Future访谈 · 关于超级智能时间表',
        content: '在Science, Technology & the Future的访谈中，Nick Bostrom表达了一个令人震惊的观点：超级智能可能在一到两年内就会出现——只需一个关键突破。这与许多专家预测的几十年时间表形成鲜明对比。Bostrom解释说，AI进展往往不是线性的，而是呈现阶梯式跳跃。就像阿尔法围棋在几个月内从无名到超越人类顶尖水平，未来的突破可能同样突然。他强调，这一观点不是预测——因为我们确实不知道——而是一个我们必须认真对待的可能性。如果超级智能可能很快出现，那么现在就必须讨论治理框架，而不是等到它已经存在。延迟行动的成本可能是灾难性的。',
        tension_q: '超级智能会在什么时间尺度上出现？',
        tension_a: '可能在一两年内，由单一突破触发',
        tension_b: '仍需几十年的渐进发展',
        keywords: ['Nick Bostrom', '超级智能', '时间表', 'AGI']
    },
    {
        date: '2026-01-20',
        freq: 'P1',
        stance: 'B',
        title: '大国竞争的回归：现实主义视角下的中美关系',
        author_name: 'John Mearsheimer',
        author_avatar: 'JM',
        author_bio: '芝加哥大学教授，进攻性现实主义代表',
        source: '2025年 · 多次公开讲座和访谈 · 关于中美关系的分析',
        content: '芝加哥大学教授John Mearsheimer是国际关系"进攻性现实主义"学派的代表人物。他的核心论点是：在无政府状态的国际体系中，大国竞争是不可避免的。Mearsheimer认为，中国的崛起必然会挑战美国的霸权地位，这不是因为中国领导人"邪恶"或美国领导人"愚蠢"，而是因为这是国际体系的结构性逻辑。他批评了自由主义者关于"经济相互依存带来和平"的观点，指出历史上相互依存从未阻止过大国之间的战争——一战前的欧洲就是典型例子。Mearsheimer预测，中美竞争将在未来几十年主导国际政治，任何幻想"合作共赢"的政策都注定失败。',
        tension_q: '中美能否通过合作避免冲突？',
        tension_a: '经济相互依存创造和平激励',
        tension_b: '结构性竞争使冲突难以避免',
        keywords: ['John Mearsheimer', '现实主义', '中美关系', '大国竞争']
    },
    {
        date: '2026-01-20',
        freq: 'F1',
        stance: 'A',
        title: '市场周期的智慧：Howard Marks论投资中的人性偏见',
        author_name: 'Howard Marks',
        author_avatar: 'HM',
        author_bio: '橡树资本联合创始人，《周期》作者',
        source: '2025年 · Oaktree备忘录及访谈 · 关于市场周期的洞见',
        content: '橡树资本联合创始人Howard Marks是价值投资和周期思维的代表人物。在其定期发布的备忘录和访谈中，Marks强调了一个核心洞见：市场周期不是随机的，而是由人性的可预测偏见驱动的。贪婪和恐惧交替主导市场情绪，创造出繁荣与萧条的循环。Marks特别批评了"这次不一样"的思维模式——每次泡沫前，人们总能找到理由相信历史规律不再适用。他的投资哲学可以概括为：在别人贪婪时恐惧，在别人恐惧时贪婪，但要有足够的耐心等待极端时刻。他也承认，识别周期比把握时机容易得多——知道我们在周期的哪个阶段，比知道什么时候转折来临更可行。',
        tension_q: '金融市场周期是可预测的吗？',
        tension_a: '周期模式是可识别的，尽管时机难以把握',
        tension_b: '市场本质上是随机的，历史不会重复',
        keywords: ['Howard Marks', '市场周期', '价值投资', '行为金融']
    },
    {
        date: '2026-01-20',
        freq: 'T3',
        stance: 'B',
        title: '网络国家的愿景：当技术重塑政治组织形式',
        author_name: 'Balaji Srinivasan',
        author_avatar: 'BS',
        author_bio: '前a16z合伙人，《网络国家》作者',
        source: '2024-2025年 · 书籍及多次访谈 · 关于网络国家的构想',
        content: '前a16z合伙人Balaji Srinivasan在其著作《网络国家》及多次访谈中，提出了一个激进的政治构想：未来的国家可能不再由地理边界定义，而是由共享价值观的在线社区形成。Balaji认为，互联网已经创造了跨越地理的社群——比如比特币社区就有自己的货币、文化和治理规则。下一步是这些社区获得物理存在：先在网络上聚集，然后众筹购买土地，最终获得某种形式的主权承认。他承认这听起来像科幻，但指出历史上国家的形成方式多种多样——没有理由认为现有模式是唯一可能。Balaji将此视为一种"和平退出"机制：如果你不满意现有国家，你可以加入或创建一个更符合你价值观的网络国家。',
        tension_q: '技术是否将根本改变国家的组织形式？',
        tension_a: '民族国家模式将继续主导',
        tension_b: '网络社区可能演变为新型政治实体',
        keywords: ['Balaji Srinivasan', '网络国家', '去中心化', '政治创新']
    }
];

async function postData(item) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(item);
        const options = {
            hostname: 'thoughts-radar-backend-production.up.railway.app',
            path: '/api/radar',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const success = res.statusCode === 200 || res.statusCode === 201;
                const status = success ? '✅' : '❌';
                console.log(`${status} ${item.date} [${item.freq}] ${item.title.substring(0, 30)}... (${item.content.length}字符)`);
                if (!success) {
                    console.log(`   ${body.substring(0, 80)}`);
                }
                resolve({ success, body });
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('=== 补充内容达到每日6条配额 ===');
    console.log('规则: 每日6-8条, 其中视频来源1-2条');
    console.log('');

    for (const item of additionalContent) {
        await postData(item);
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n=== 完成 ===');
}

main();
