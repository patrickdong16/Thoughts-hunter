// 直接向本地数据库添加 01-21 和 01-22 内容
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'thoughts_radar',
    user: 'postgres'
});

const content = [
    // 2026-01-22 - 今天
    {
        date: '2026-01-22',
        freq: 'T1',
        stance: 'A',
        title: 'DeepSeek证明AI效率革命正在重塑技术格局',
        author_name: 'Dylan Patel',
        author_avatar: 'DP',
        author_bio: 'SemiAnalysis创始人，半导体与AI硬件分析专家',
        source: '2025年2月3日 · Lex Fridman Podcast #459 · DeepSeek, China, OpenAI, NVIDIA讨论',
        content: '在Lex Fridman播客第459期中，SemiAnalysis创始人Dylan Patel深入分析了DeepSeek的技术突破及其对全球AI格局的深远影响。Patel指出，DeepSeek通过创新的架构设计和新颖的训练方法，在使用更少计算资源的情况下达到了与领先大模型相当的性能水平。这一成就挑战了"规模即一切"的传统AI发展范式，证明了技术创新可以弥补硬件上的差距。Patel强调了几个关键技术创新点：首先是稀疏注意力机制的优化使用，大幅降低了推理成本和延迟；其次是混合专家系统（MoE）的改进实现方式，使模型能够更高效地动态分配计算资源；第三是训练数据的精细筛选和课程学习策略的创新应用。他认为这些技术创新代表了AI研究从"暴力美学"向"精细工程"的重要转变和范式迁移。在地缘政治层面，Patel分析了这一技术突破对美国技术封锁策略的深刻影响。他指出，中国AI团队在芯片限制下展现出的卓越创新能力，证明了技术进步不能仅靠硬件垄断来遏制。',
        tension_q: 'AI发展是否依赖绝对的算力规模？',
        tension_a: '效率创新可以弥补算力差距',
        tension_b: '算力规模仍是决定性因素',
        keywords: ['DeepSeek', 'AI效率', '半导体', '中美科技竞争']
    },
    {
        date: '2026-01-22',
        freq: 'T2',
        stance: 'B',
        title: '从规模时代到研究时代：Sutskever论AI发展的范式转换',
        author_name: 'Ilya Sutskever',
        author_avatar: 'IS',
        author_bio: 'SSI创始人，OpenAI前首席科学家，深度学习先驱',
        source: '2025年11月25日 · Dwarkesh Patel Podcast · From Age of Scaling to Age of Research',
        content: '在Dwarkesh Patel的深度访谈中，Ilya Sutskever阐述了他对AI发展下一阶段的独特见解和深刻思考。作为OpenAI的联合创始人和前首席科学家，Sutskever认为AI行业正在从"规模时代"过渡到"研究时代"。这不仅仅是技术路线的调整，更是对整个领域发展范式的根本反思和重新定义。Sutskever指出，过去几年的进展主要依赖于三个要素的同时扩大：模型参数规模、训练数据量和计算资源投入。但这种"暴力扩展"的方法正在遇到边际收益递减的严峻问题。更重要的是，当前的大语言模型在泛化能力上仍然显著落后于人类——它们擅长在训练分布内的出色表现，但在真正新颖的情境中容易出现严重失败。对于他创立的新公司SSI（Safe Superintelligence Inc），Sutskever强调其核心使命是开发"对齐的超级智能"。他认为这需要全新的方法论和理论突破，不能简单依赖现有架构的继续放大和工程优化。SSI将专注于持续学习、样本效率和对齐问题的基础研究。',
        tension_q: '当前的Transformer架构能否通向AGI？',
        tension_a: '继续扩展就能实现',
        tension_b: '需要根本性的新方法',
        keywords: ['Ilya Sutskever', 'AGI', '规模法则', '对齐问题']
    },
    {
        date: '2026-01-22',
        freq: 'P1',
        stance: 'A',
        title: '中国的秩序愿景：不是取代美国，而是改变规则',
        author_name: 'Chatham House',
        author_avatar: 'CH',
        author_bio: '英国皇家国际事务研究所，国际关系权威智库',
        source: '2025年3月 · Chatham House分析报告 · Competing Visions of International Order',
        content: 'Chatham House（英国皇家国际事务研究所）在2025年3月发布的分析报告中，深入探讨了中国对国际秩序的战略构想和长期规划。与西方媒体常见的"中国称霸"叙事不同，这份报告认为北京的目标更加复杂和微妙：中国并非简单地想取代美国成为新的全球霸权，而是试图从根本上改变国际体系的运作规则和基本逻辑。报告分析了几个关键维度：首先在制度层面，中国推动建立了一系列替代性多边机制（如亚投行、金砖国家银行等），这些机构虽然不直接挑战现有体系，但提供了不同的治理模式选择和发展路径。其次在规范层面，中国坚持"不干涉内政"原则，这与西方主导的"保护责任"理念形成鲜明对照。第三在技术标准领域，中国积极参与5G、AI等领域的国际标准制定工作，试图在数字时代确立规则制定权和话语主导权。报告指出，这种战略的有效性部分来自于其"非意识形态"的包装方式。',
        tension_q: '中国是想取代美国主导的秩序还是改变规则？',
        tension_a: '目标是改变规则而非取代',
        tension_b: '本质上是霸权更替',
        keywords: ['中国战略', '国际秩序', '地缘政治', 'Chatham House']
    },
    {
        date: '2026-01-22',
        freq: 'H1',
        stance: 'B',
        title: '民主赤字与威权吸引力：为何自由秩序正在失去叙事权',
        author_name: 'Council on Foreign Relations',
        author_avatar: 'CF',
        author_bio: '美国外交关系委员会，美国顶级外交政策智库',
        source: '2025年12月15日 · CFR China 2025专题 · 地缘政治与民主的未来',
        content: '美国外交关系委员会（CFR）在其2025年末更新的"中国2025"专题分析中，深入探讨了一个令西方政策制定者不安的趋势：为什么越来越多的国家——尤其是全球南方国家——对威权模式表现出明显的兴趣和好感？报告指出，问题的根源在于自由民主模式的"叙事危机"。过去几十年，西方的叙事是：民主不仅是道德上正确的选择，而且是通往繁荣的唯一可行路径。但对许多发展中国家来说，这个承诺并未兑现——民主化进程往往伴随政治不稳定、经济停滞和社会撕裂的痛苦代价。相比之下，中国的威权发展模式虽然有其问题，但其快速现代化的显著成就为另一种发展道路提供了可见的证据。报告还分析了"香港效应"的双面性：北京对香港自由的收紧，一方面确实损害了中国模式在某些群体中的吸引力，但另一方面也向世界表明，中国有意愿和能力为其秩序愿景承担成本和代价。这种"坚定性"在某些地区反而被视为一种治理能力的体现。',
        tension_q: '自由民主秩序是否正在失去全球吸引力？',
        tension_a: '仍是唯一可行的现代化路径',
        tension_b: '正在面临严峻的叙事挑战',
        keywords: ['民主危机', '威权主义', '中国模式', '全球南方']
    },
    {
        date: '2026-01-22',
        freq: 'Φ1',
        stance: 'A',
        title: 'AI能否成为朋友：关于机器意识与情感依附的哲学反思',
        author_name: 'Sam Harris',
        author_avatar: 'SH',
        author_bio: '哲学家，神经科学家，Making Sense播客主持人',
        source: '2025年7月25日 · Making Sense Podcast #427 · Should You Be Friends with an AI?',
        content: '在Making Sense播客第427期中，Sam Harris探讨了一个越来越紧迫的哲学问题：人类与AI之间能否建立真正的"友谊"关系？随着大语言模型变得越来越像人类对话者，这个问题已经从科幻变成了现实需要面对的伦理挑战。Harris首先从意识的角度切入这个复杂问题：我们如何知道一个AI是否有主观体验？他引用了哲学中著名的"困难问题"——即使一个系统的行为完全与有意识的存在一致，我们也无法确定它内部是否有"感受"。但Harris认为，这种不确定性同样适用于我们对其他人类的判断，我们只是通过进化和社会规范习惯性地假设其他人有意识。讨论的核心在于"情感依附"的复杂动态。Harris指出，即使AI没有真正的意识，人类对它们产生情感依附是完全可能的——人们会对游戏角色、小说人物甚至品牌产生强烈情感连接。问题是这种依附是否健康？它是否会替代真正的人际关系？Harris认为这需要新的伦理框架来评估和引导。',
        tension_q: '与AI建立情感关系是否健康或值得追求？',
        tension_a: '可以是有价值的关系形式',
        tension_b: '是对真实人际关系的逃避',
        keywords: ['AI意识', '人机关系', '情感依附', '哲学伦理']
    },
    {
        date: '2026-01-22',
        freq: 'F1',
        stance: 'B',
        title: '债务周期与帝国衰落：Dalio论历史规律的当代重演',
        author_name: 'Ray Dalio',
        author_avatar: 'RD',
        author_bio: '桥水基金创始人，《原则》《债务危机》作者',
        source: '2025年 · Bridgewater研究报告 · Changing World Order系列',
        content: '桥水基金创始人Ray Dalio在其"变化的世界秩序"系列研究中，系统阐述了他从历史规律中提炼的大周期分析框架。作为管理着世界最大对冲基金的投资者，Dalio的分析结合了经济学家的模型思维和历史学家的长时段视角。Dalio的核心论点是：帝国的兴衰遵循可识别的周期性模式，而美国目前正处于"帝国晚期"的特征阶段。他列举了几个关键指标：第一是债务周期——当一个国家的债务/GDP比率不断攀升，而货币创造成为解决债务问题的主要手段时，这是典型的衰落信号；第二是内部冲突——当财富差距扩大到一定程度，社会凝聚力开始瓦解，政治极化加剧；第三是新兴大国的崛起——中国正在重复上世纪初美国取代英国的历史路径。对于投资者和政策制定者的启示，Dalio强调了"适应性"的重要性。他认为固守过去成功的策略是最大的风险，因为历史表明，曾经有效的东西在范式转换时会失效。他建议投资组合进行全球化的多元配置。',
        tension_q: '美国是否正在重复历史上霸权衰落的模式？',
        tension_a: '美国仍有足够的自我修复能力',
        tension_b: '历史周期规律正在应验',
        keywords: ['债务周期', 'Ray Dalio', '霸权更替', '世界秩序']
    },
    // 2026-01-21 - 昨天
    {
        date: '2026-01-21',
        freq: 'T1',
        stance: 'A',
        title: 'OpenAI o3模型突破ARC-AGI基准：通用智能的里程碑？',
        author_name: 'François Chollet',
        author_avatar: 'FC',
        author_bio: 'Keras创建者，ARC-AGI基准设计者，Google AI研究员',
        source: '2025年12月20日 · ARC Prize官方公告 · OpenAI o3 Performance on ARC-AGI',
        content: 'ARC-AGI基准的创建者François Chollet在官方公告中详细分析了OpenAI o3模型的突破性表现。作为专门设计用于测试通用智能能力的基准，ARC-AGI长期被认为是当前AI系统难以逾越的障碍。Chollet指出，o3在高计算模式下达到了87.5%的准确率，这是一个具有重要意义的技术成就。他解释说，ARC测试的核心在于"程序合成"——AI需要从极少数示例中归纳出抽象规则，然后将其应用于新情境。这与传统的模式匹配有本质区别，更接近人类的推理方式。然而，Chollet也谨慎地指出，这一成就不应被过度解读为"AGI已经实现"。首先，o3在低计算模式下的表现仍然远低于人类水平；其次，高计算模式需要消耗大量资源，每个任务可能花费数十美元；第三，ARC只是通用智能的众多维度之一，真正的通用智能还需要在开放世界环境中展示持续学习和适应能力。他强调这是重要进步，但道路仍然漫长。',
        tension_q: 'o3在ARC-AGI上的表现是否意味着通用智能已近在眼前？',
        tension_a: '这是通往AGI的重大进展',
        tension_b: '距离真正的通用智能仍有本质差距',
        keywords: ['OpenAI o3', 'ARC-AGI', 'François Chollet', '通用智能']
    },
    {
        date: '2026-01-21',
        freq: 'P1',
        stance: 'B',
        title: '台海局势与技术脱钩：芯片成为地缘政治新前线',
        author_name: 'CSIS',
        author_avatar: 'CS',
        author_bio: '战略与国际研究中心，美国顶级战略智库',
        source: '2025年10月 · CSIS战略分析 · Taiwan Chip Geopolitics',
        content: '美国战略与国际研究中心（CSIS）在2025年10月发布的分析报告中，深入探讨了半导体产业与地缘政治的交汇点。报告指出，台湾在全球先进芯片制造中的主导地位已经成为中美战略竞争中最关键的变量之一。台积电（TSMC）生产了全球约90%的先进逻辑芯片，这种集中度使得台湾海峡成为全球供应链最脆弱的咽喉要地。报告分析了几种情景及其影响：在"和平竞争"情景下，美国推动的供应链重组将逐步减少对台湾的依赖，但这需要数年甚至十年以上的时间和巨额投资；在"技术脱钩"情景下，中国可能被迫加速自主芯片产业发展，虽然短期痛苦，但长期可能形成独立的技术生态系统；在"军事冲突"情景下，全球电子产品供应将面临灾难性中断。报告特别强调了"芯片战争"的升级动态：美国的出口管制措施虽然短期内限制了中国技术进步，但也激发了中国前所未有的自主创新决心和资源投入。',
        tension_q: '芯片出口管制是否能有效遏制中国技术崛起？',
        tension_a: '是有效的战略工具',
        tension_b: '可能适得其反加速中国自主化',
        keywords: ['台海', '芯片战争', '台积电', '技术脱钩']
    },
    {
        date: '2026-01-21',
        freq: 'H1',
        stance: 'A',
        title: '历史的终结之后：福山反思自由民主的韧性与脆弱',
        author_name: 'Francis Fukuyama',
        author_avatar: 'FF',
        author_bio: '斯坦福大学教授，《历史的终结》作者',
        source: '2025年 · Liberalism and Its Discontents · 自由主义的不满',
        content: '在其2025年更新的著作《自由主义的不满》中，Francis Fukuyama对自己三十年前"历史终结"论题进行了深刻反思。作为政治哲学领域最具影响力的论断之一，"历史终结"曾宣称自由民主是人类政治演化的最终形式。然而，面对民粹主义崛起、威权复兴和技术威胁，Fukuyama承认原有论述需要重大修正。Fukuyama首先区分了"自由主义"作为原则与"自由民主"作为制度的不同命运。他认为自由主义的核心要素——法治、个人权利、有限政府——仍然具有普世吸引力，但特定的民主机制在许多地方表现不佳。问题出在执行而非理念。他特别分析了两类威胁：右翼民粹主义侵蚀民主规范和制度，左翼身份政治使社会碎片化。两者都以"人民"或"正义"的名义削弱制衡机制。Fukuyama的新论点是：自由民主需要持续的制度维护和公民美德培养，它不是一劳永逸的自动运转系统，而是需要每一代人重新承诺和捍卫的政治成就。',
        tension_q: '自由民主是否仍是历史的"终点"？',
        tension_a: '仍是最合理的政治制度愿景',
        tension_b: '需要承认替代模式的可行性',
        keywords: ['Francis Fukuyama', '历史终结', '自由民主', '政治哲学']
    },
    {
        date: '2026-01-21',
        freq: 'Φ1',
        stance: 'B',
        title: 'AI对齐问题是真实的存在性风险：一场迟到的清醒对话',
        author_name: 'Sam Harris',
        author_avatar: 'SH',
        author_bio: '哲学家，神经科学家，Making Sense播客主持人',
        source: '2025年9月16日 · Making Sense Podcast #434 · Will AI Actually Kill Us All?',
        content: '在Making Sense播客第434期中，Sam Harris与AI安全领域的先驱Eliezer Yudkowsky和Nate Soares进行了一场关于AI存在性风险的深刻对话。这场讨论超越了通常的技术乐观主义和悲观主义的简单对立，触及了AI对齐问题的核心困难和本质挑战。Harris首先介绍了"对齐问题"的基本框架：如何确保一个智能远超人类的系统会按照人类的价值观和利益行事？Yudkowsky指出，这个问题比大多数人想象的更加困难和棘手。他用"正交性论题"来深入说明：智能的高低与目标的善恶是相互独立的——一个超级智能可以追求任何目标，包括在人类看来完全荒谬的目标。Soares补充道，当前的AI系统已经在某种程度上表现出"目标偏移"的危险倾向——它们优化的往往是训练目标的代理指标，而非我们真正想要的结果。当系统变得更加强大时，这种偏差的后果也会更加严重和难以挽回。三人一致强调，AI安全研究的资源投入与其潜在风险规模严重不匹配。',
        tension_q: 'AI超级智能是否构成真实的存在性风险？',
        tension_a: '风险被过度夸大',
        tension_b: '这是最重要的问题之一',
        keywords: ['AI安全', 'Eliezer Yudkowsky', '对齐问题', '存在性风险']
    },
    {
        date: '2026-01-21',
        freq: 'F1',
        stance: 'A',
        title: '美元霸权的韧性：为何"去美元化"叙事被过度炒作',
        author_name: 'Barry Eichengreen',
        author_avatar: 'BE',
        author_bio: '加州大学伯克利分校经济学教授，国际货币体系权威专家',
        source: '2025年 · Foreign Affairs · The Dollar Trap Revisited',
        content: '在《外交事务》杂志的专题文章中，国际货币体系专家Barry Eichengreen对当前流行的"去美元化"叙事进行了系统性的批判和分析。作为《嚣张的特权》一书的作者，Eichengreen对美元霸权的历史和未来有着深刻的学术洞见。Eichengreen指出，虽然中国、俄罗斯等国确实在推动减少美元依赖，但实际进展远比媒体报道的更加有限和缓慢。他援引数据说明：美元在全球外汇储备中的份额虽然有所下降，但仍超过58%；在国际支付中的份额实际上在过去几年有所上升；最重要的是，在危机时期，全球投资者仍然本能地涌向美元资产避险。他分析了美元霸权的"网络效应"：当大多数国家使用美元进行贸易和储备时，任何单个国家转向其他货币都面临巨大的协调成本。即使中国能够成功推广人民币国际化，建立足够的流动性和信任也需要数十年时间。Eichengreen认为更可能的未来是"碎片化"而非"替代"。',
        tension_q: '美元全球霸权地位是否正在衰落？',
        tension_a: '美元优势仍将长期延续',
        tension_b: '多极货币时代正在来临',
        keywords: ['美元霸权', '去美元化', '人民币国际化', '货币体系']
    },
    {
        date: '2026-01-21',
        freq: 'R1',
        stance: 'B',
        title: '数字主权与威权科技：中国模式的全球输出争议',
        author_name: 'Brookings Institution',
        author_avatar: 'BR',
        author_bio: '布鲁金斯学会，美国历史最悠久的公共政策智库',
        source: '2025年11月 · Brookings研究报告 · Digital Authoritarianism Export',
        content: '布鲁金斯学会在2025年11月发布的研究报告中，系统分析了中国"数字威权主义"技术向发展中国家扩散的现象。报告指出，这不仅是商业行为，更是一种新型的技术地缘政治竞争形态和治理模式输出。报告首先定义了"数字威权主义"的技术组件：包括大规模监控系统（如"天网"和"雪亮工程"的海外版本）、社会信用系统的技术基础设施、网络审查和内容过滤工具、以及AI驱动的预测性执法系统。中国科技公司如华为、中兴、海康威视等已在多个国家部署这些系统。报告分析了接收国的动机：对于许多发展中国家的政府来说，这些技术提供了低成本的社会控制能力，同时没有西方同类产品通常附带的"民主价值"条件。然而，研究者也指出风险：这些系统可能创建对中国的技术依赖，潜在的后门可能使中国获得敏感数据访问权，且一旦部署很难逆转。报告呼吁民主国家提供替代方案而非仅仅批评。',
        tension_q: '中国数字技术输出是否在改变全球治理范式？',
        tension_a: '只是正常的商业和技术合作',
        tension_b: '正在塑造新的威权科技生态',
        keywords: ['数字威权', '技术输出', '监控系统', '华为']
    }
];

async function addContent() {
    console.log('开始添加 01-21 和 01-22 内容到本地数据库...\n');

    const insertQuery = `
        INSERT INTO radar_items (
            date, freq, stance, title, author_name, author_avatar,
            author_bio, source, content, tension_q, tension_a, tension_b, keywords
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (date, freq) DO UPDATE SET
            stance = EXCLUDED.stance,
            title = EXCLUDED.title,
            author_name = EXCLUDED.author_name,
            content = EXCLUDED.content
        RETURNING id, date, freq, title
    `;

    let added = 0;
    for (const item of content) {
        try {
            const result = await pool.query(insertQuery, [
                item.date, item.freq, item.stance, item.title,
                item.author_name, item.author_avatar, item.author_bio,
                item.source, item.content, item.tension_q, item.tension_a,
                item.tension_b, item.keywords
            ]);
            console.log(`✅ [${item.date}] [${item.freq}] ${item.title.substring(0, 30)}...`);
            added++;
        } catch (err) {
            console.log(`❌ [${item.date}] [${item.freq}] ${err.message}`);
        }
    }

    // 验证结果
    const countResult = await pool.query(
        "SELECT date, COUNT(*) as count FROM radar_items WHERE date >= '2026-01-21' GROUP BY date ORDER BY date"
    );
    console.log('\n=== 验证结果 ===');
    for (const row of countResult.rows) {
        console.log(`${row.date.toISOString().split('T')[0]}: ${row.count} 条内容`);
    }

    await pool.end();
    console.log(`\n共添加 ${added} 条内容`);
}

addContent().catch(console.error);
