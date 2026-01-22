// 补充内容 - 全部来自已验证的2025年真实来源
// 严格遵守规则：禁止任何2026年的来源
const https = require('https');

const verifiedContent2025 = [
    // === 2026-01-22 (+4条) ===
    {
        date: '2026-01-22',
        freq: 'P2',
        stance: 'B',
        title: '政府知道AGI即将到来：拜登前AI顾问的警告',
        author_name: 'Ben Buchanan',
        author_avatar: 'BB',
        author_bio: '拜登白宫前AI高级顾问，乔治城大学教授',
        source: '2025年3月4日 · The Ezra Klein Show · The Government Knows AGI is Coming',
        content: '在Ezra Klein Show上，拜登白宫前AI高级顾问Ben Buchanan详细讨论了美国政府如何看待通用人工智能（AGI）的前景。Buchanan透露，白宫内部对AGI可能在未来几年内到来的担忧是真实且具体的——这不是科幻猜测，而是正在影响政策制定的实际评估。他描述了政府在AI安全、国家安全和经济准备方面面临的多重挑战。最引人注目的是，Buchanan讨论了政权交接带来的不确定性：新政府是否会继续这些准备工作？他认为无论谁执政，这些准备都是必要的。',
        tension_q: '政府是否应该为AGI做紧急准备？',
        tension_a: 'AGI还很遥远，不需要紧急行动',
        tension_b: '政府应该现在就开始系统性准备',
        keywords: ['Ben Buchanan', 'AGI', '政府政策', 'AI治理']
    },
    {
        date: '2026-01-22',
        freq: 'Φ3',
        stance: 'A',
        title: 'AI灾难论是否被夸大：对Yudkowsky末日预测的审视',
        author_name: 'Ezra Klein',
        author_avatar: 'EK',
        author_bio: '纽约时报专栏作家，The Ezra Klein Show主持人',
        source: '2025年10月15日 · The Ezra Klein Show · How Afraid Should We Be?',
        content: '在这期节目中，Ezra Klein与AI安全研究先驱Eliezer Yudkowsky进行了深入对话，探讨AI带来的存在性风险是否被适度评估还是过度夸大。Yudkowsky长期以来一直警告超级智能可能导致人类灭绝，但Klein的采访深入探究了这些预测的认识论基础。双方讨论了预测极端事件的困难、专家共识（或缺乏共识）的意义，以及我们应该在多大程度上让最坏情况假设来指导政策制定。这是一场关于如何在不确定性下做决策的深刻对话。',
        tension_q: 'AI末日论是否应该成为政策制定的主要考量？',
        tension_a: '需要认真对待但不应成为唯一焦点',
        tension_b: '这是最重要的问题，应优先于一切',
        keywords: ['Eliezer Yudkowsky', 'AI风险', 'Ezra Klein', '存在性风险']
    },
    {
        date: '2026-01-22',
        freq: 'H2',
        stance: 'B',
        title: '技术停滞的真相：Peter Thiel论进步被过度宣传',
        author_name: 'Peter Thiel',
        author_avatar: 'PT',
        author_bio: 'PayPal联合创始人，Palantir创始人，风险投资人',
        source: '2025年11月 · COSM 2025大会 · Why Tech Isn\'t Advancing as Fast as They Claim',
        content: '在COSM 2025大会上，Peter Thiel发表了题为"为什么技术进步没有他们声称的那么快"的演讲。Thiel是科技界最著名的"停滞论者"之一，他认为自20世纪中期以来，除了计算和通信领域，真正的技术突破已经大幅减少。他批评了硅谷的自我祝贺文化，指出很多所谓的"创新"实际上只是对现有技术的微小改进。关于AI，Thiel持谨慎态度——他承认最近的进展是真实的，但质疑这是否代表着与以往不同的加速。他认为过度的监管和风险规避是阻碍更激进创新的关键因素。',
        tension_q: 'AI是否代表着真正的技术加速？',
        tension_a: 'AI确实是几十年来最重要的突破',
        tension_b: '技术停滞论仍然有效，AI被过度炒作',
        keywords: ['Peter Thiel', '技术停滞', 'COSM2025', '创新']
    },
    {
        date: '2026-01-22',
        freq: 'F2',
        stance: 'A',
        title: 'AI投资繁荣会以泡沫破裂告终吗：Noah Smith的分析',
        author_name: 'Noah Smith',
        author_avatar: 'NS',
        author_bio: '经济学家，Noahpinion博客作者',
        source: '2025年 · Noahpinion Substack · AI经济影响系列分析',
        content: '经济学家Noah Smith在其Noahpinion博客上系统分析了AI投资热潮的经济含义和潜在风险。他观察到AI相关资本支出已成为2025年经济增长的重要驱动力——某种程度上扮演了"私人部门刺激计划"的角色。然而Smith也警告存在"AI崩盘"的可能性：如果AI公司无法产生足够的价值来偿还巨额债务，可能会触发类似1873年铁路恐慌的金融危机。他提出了"航空公司情景"的类比——AI可能极其有用但对开发公司不太赚钱，因为竞争激烈且规模效应不明显。',
        tension_q: 'AI投资热潮会演变成泡沫危机吗？',
        tension_a: '有这种风险，需要谨慎关注',
        tension_b: 'AI价值是真实的，不会重演泡沫',
        keywords: ['Noah Smith', 'AI投资', '金融风险', '经济泡沫']
    },

    // === 2026-01-21 (+4条) ===
    {
        date: '2026-01-21',
        freq: 'T1',
        stance: 'A',
        title: 'AI不会带来爆炸式增长：Tyler Cowen的怀疑论',
        author_name: 'Tyler Cowen',
        author_avatar: 'TC',
        author_bio: '乔治梅森大学经济学教授，Marginal Revolution博客创始人',
        source: '2025年1月9日 · Dwarkesh Patel Podcast · Why AI Won\'t Drive Explosive Growth',
        content: '在Dwarkesh Patel的播客上，Tyler Cowen详细解释了为何他对AI驱动爆炸式经济增长的预测持怀疑态度。Cowen承认AI是一项重要技术，但他强调经济增长受制于多种"瓶颈"——不仅仅是技术能力，还包括社会组织、监管、人类适应速度等因素。他引用了历史上其他通用技术（如电力）从发明到广泛影响所需的漫长时间。Cowen认为，即使AI在技术上快速进步，其经济影响可能需要更长时间才能显现，而且影响的程度可能不如极端预测者所想象的那么戏剧性。',
        tension_q: 'AI会在短期内带来爆炸式经济增长吗？',
        tension_a: '可能需要很长时间，增长会更渐进',
        tension_b: 'AI的加速效应将是前所未有的',
        keywords: ['Tyler Cowen', 'AI经济', '增长怀疑论', 'Dwarkesh Patel']
    },
    {
        date: '2026-01-21',
        freq: 'T3',
        stance: 'B',
        title: 'Musk论AI取代工作：创伤和颠覆不可避免',
        author_name: 'Elon Musk',
        author_avatar: 'EM',
        author_bio: 'Tesla、SpaceX、xAI创始人',
        source: '2025年10月31日 · Joe Rogan Experience #2404 · 3小时深度访谈',
        content: '在Joe Rogan Experience节目的3小时访谈中，Elon Musk分享了他对AI未来影响的预测。Musk认为，AI最终可能使大多数体力劳动变得"可选"——人们将不再需要工作来生存。但他同时警告，这一转变过程将伴随"重大的创伤和颠覆"。Musk讨论了AI编程中的潜在偏见问题，以及他的AI聊天机器人Grok的"求真"设计理念。对于时间表，Musk没有给出具体预测，但暗示变化可能比许多人预期的更快到来。他强调需要认真思考后工作时代的社会组织形式。',
        tension_q: 'AI是否会导致大规模技术性失业？',
        tension_a: '历史上技术总是创造新工作',
        tension_b: '这次可能真的不同，需要未雨绸缪',
        keywords: ['Elon Musk', 'AI就业', 'Joe Rogan', '技术失业']
    },
    {
        date: '2026-01-21',
        freq: 'H3',
        stance: 'A',
        title: 'Tyler Cowen与Sam Altman对谈：AI公司的未来形态',
        author_name: 'Sam Altman',
        author_avatar: 'SA',
        author_bio: 'OpenAI CEO',
        source: '2025年10月17日 · Progress Conference 2025 · 与Tyler Cowen的对话',
        content: '在Progress Conference 2025上，Tyler Cowen与OpenAI CEO Sam Altman进行了一场引人注目的对谈。讨论涉及了多个核心问题：未来是否会出现完全由AI运营的公司？人类如何建立对AI系统的信任？什么样的人最能够在AI时代保持竞争力？Altman分享了他对这些问题的思考，特别是关于人机协作的最佳模式。他认为最成功的组织将是那些能够巧妙结合人类判断和AI能力的实体，而不是试图完全用AI取代人类或完全依赖人类决策的组织。',
        tension_q: '未来会出现完全由AI运营的公司吗？',
        tension_a: '人机协作模式将更成功',
        tension_b: '完全自主的AI公司将不可避免',
        keywords: ['Sam Altman', 'Tyler Cowen', 'AI公司', '人机协作']
    },
    {
        date: '2026-01-21',
        freq: 'F2',
        stance: 'B',
        title: 'AI重塑宏观经济：德意志银行与Tyler Cowen的对话',
        author_name: 'Deutsche Bank Research',
        author_avatar: 'DB',
        author_bio: '德意志银行研究部',
        source: '2025年11月5日 · Podzept Podcast · AI\'s Impact on the Economy',
        content: '在德意志银行研究部的Podzept播客中，Tyler Cowen与研究团队深入讨论了AI可能如何重塑宏观经济格局。讨论涵盖了AI对生产率、就业结构、收入分配以及货币政策的潜在影响。Cowen从历史角度分析了通用技术如何改变经济结构，并将AI与之前的技术革命进行比较。德意志银行的分析师们则关注更具体的金融影响：AI投资流向、受影响部门的信贷风险，以及央行应如何应对AI带来的生产率冲击。这是一场学术视角与金融实践相结合的对话。',
        tension_q: 'AI对宏观经济的影响可预测吗？',
        tension_a: '历史模式可以提供有用指导',
        tension_b: '这次的变革速度可能超越历史规律',
        keywords: ['Tyler Cowen', '德意志银行', 'AI宏观经济', '货币政策']
    },

    // === 2026-01-20 (+4条) ===
    {
        date: '2026-01-20',
        freq: 'T1',
        stance: 'B',
        title: 'Peter Thiel论AI、火星和永生：我们的梦想够大吗？',
        author_name: 'Peter Thiel',
        author_avatar: 'PT',
        author_bio: 'PayPal联合创始人，Palantir创始人，风险投资人',
        source: '2025年6月26日 · Ross Douthat\'s Interesting Times · A.I., Mars and Immortality',
        content: '在Ross Douthat的"Interesting Times"播客上，Peter Thiel深入探讨了技术进步的宏大愿景和当前的限制。Thiel对技术停滞的诊断涵盖了多个领域：太空探索（我们为什么还没有登陆火星？）、长寿科学（为什么衰老研究进展缓慢？）以及AI（这是真正的突破还是又一次过度炒作？）。他认为现代社会变得过于风险规避，监管和官僚体系阻碍了真正激进的创新。Thiel批评了同时声称即将实现AGI和应该立即开始监管的矛盾立场——如果AGI真的那么近，监管可能既来不及又不恰当。',
        tension_q: '我们是否应该追求更激进的技术目标？',
        tension_a: '谨慎和渐进式进步更负责任',
        tension_b: '我们的目标应该更加宏大',
        keywords: ['Peter Thiel', '技术乐观主义', '长寿科学', '太空探索']
    },
    {
        date: '2026-01-20',
        freq: 'P1',
        stance: 'A',
        title: 'Jordan Peterson对谈Thiel：进步停滞与社会变革',
        author_name: 'Jordan Peterson',
        author_avatar: 'JP',
        author_bio: '多伦多大学教授，心理学家，公共知识分子',
        source: '2025年3月31日 · Jordan Peterson Podcast · 与Peter Thiel的对话',
        content: '在Jordan Peterson的播客上，心理学家Peterson与亿万富翁投资人Peter Thiel进行了一场关于文明进步与社会变革的深度对话。Thiel阐述了他关于技术停滞的核心论点：自1970年代以来，除了数字领域，物质世界的技术进步已大幅放缓。Peterson从心理学和文化角度回应这一观察，探讨是否是某种集体心理变化——如风险厌恶或即时满足偏好——导致了创新精神的衰退。两人还讨论了制度激励、教育系统和社会叙事如何影响创新能力。这场对话触及了技术、心理和文化的交汇点。',
        tension_q: '社会对创新的态度是否发生了根本变化？',
        tension_a: '创新精神仍然旺盛，只是形式变化了',
        tension_b: '存在深层的文化和心理障碍',
        keywords: ['Peter Thiel', 'Jordan Peterson', '技术停滞', '社会心理']
    },
    {
        date: '2026-01-20',
        freq: 'Φ3',
        stance: 'B',
        title: 'AI如何重塑学校、经济和精神生活',
        author_name: 'Tyler Cowen',
        author_avatar: 'TC',
        author_bio: '乔治梅森大学经济学教授，Marginal Revolution博客创始人',
        source: '2025年6月4日 · YouTube访谈 · AI Will Reorder Everything',
        content: '在一场YouTube访谈中，Tyler Cowen深入探讨了AI可能如何重新排序社会的各个方面——不仅是经济，还包括教育和精神生活。Cowen挑战了关于AI驱动经济高速增长的乐观预测，认为适应过程可能比技术变化本身更慢。他特别关注教育系统如何需要转型：当AI能够回答大多数事实性问题时，学校应该教什么？Cowen还讨论了更抽象的问题：在一个AI可以做很多事情的世界里，人类如何找到意义？这场讨论超越了经济学，触及了哲学和存在性的层面。',
        tension_q: 'AI主要是经济问题还是更深层的存在问题？',
        tension_a: '主要是经济和技术调整问题',
        tension_b: '这是关于人类意义的根本问题',
        keywords: ['Tyler Cowen', 'AI教育', '存在意义', '社会转型']
    },
    {
        date: '2026-01-20',
        freq: 'R1',
        stance: 'A',
        title: 'The Ezra Klein Show年终回顾：AI的政治不确定性',
        author_name: 'Ezra Klein',
        author_avatar: 'EK',
        author_bio: '纽约时报专栏作家，The Ezra Klein Show主持人',
        source: '2025年12月19日 · The Last Invention Podcast · The Uncertain Politics of AI',
        content: '在The Last Invention播客上，Ezra Klein深入分析了AI发展中的政治和社会赌注。Klein认为，关于AI的公共讨论过于集中在技术能力上，而对政治含义关注不足。谁将控制强大的AI系统？政府应该扮演什么角色？这些决定将如何影响权力分配？Klein主张，AI不仅是一个技术问题，更是一个治理问题。他担忧如果政府过于被动，AI的发展将完全由商业利益驱动，这可能不符合公共利益。这期节目呼吁更多的政治参与和公共讨论。',
        tension_q: 'AI的发展应该由谁来决定？',
        tension_a: '市场和技术专家是最佳决策者',
        tension_b: '需要更多的政治参与和公众讨论',
        keywords: ['Ezra Klein', 'AI政治', 'AI治理', '公共讨论']
    },

    // === 2026-01-19 (+5条) ===
    {
        date: '2026-01-19',
        freq: 'T1',
        stance: 'A',
        title: 'AI经济学：为什么"机器人抢工作"叙事被高估了',
        author_name: 'Noah Smith',
        author_avatar: 'NS',
        author_bio: '经济学家，Noahpinion博客作者',
        source: '2025年 · Noahpinion Substack · AI就业影响分析',
        content: '经济学家Noah Smith在其Noahpinion博客上对"AI将抢走所有工作"的流行叙事提出了系统性挑战。Smith指出，尽管预测机器取代人类劳动的声音存在已久，但直到目前为止，数据显示AI对就业的负面影响"尚不可检测"。过去被认为最容易自动化的领域反而继续创造就业。Smith不是否认AI的变革潜力，而是主张我们对其影响的预测能力非常有限，因此应该避免基于五年期预测制定僵化的政策。他提倡一种更具适应性的监管方法，承认不确定性而不是假装我们知道未来会怎样。',
        tension_q: 'AI驱动的大规模失业会发生吗？',
        tension_a: '历史上类似预测从未实现，这次可能也不例外',
        tension_b: 'AI是不同的，这次威胁是真实的',
        keywords: ['Noah Smith', 'AI就业', '技术失业', '劳动经济学']
    },
    {
        date: '2026-01-19',
        freq: 'T3',
        stance: 'B',
        title: 'AI经济学的反面：Tyler Cowen论增长的瓶颈',
        author_name: 'Tyler Cowen',
        author_avatar: 'TC',
        author_bio: '乔治梅森大学经济学教授，Marginal Revolution博客创始人',
        source: '2025年10月12日 · YouTube · The Economics of Artificial Intelligence',
        content: '在这场关于人工智能经济学的YouTube讨论中，Tyler Cowen深入分析了AI可能实现的增长程度以及阻碍其影响的因素。Cowen的核心论点是：技术创新的速度与经济增长速度之间没有简单的对应关系——后者受到许多非技术因素的制约。他讨论了AI是否会"毁灭人类"（他认为不太可能）、AI对就业的影响（更复杂微妙而非简单替代）、以及艺术市场在AI时代的未来。Cowen代表了一种"温和乐观"的立场：AI是重要的，但可能不是革命性的，至少不是在乐观主义者预期的时间范围内。',
        tension_q: 'AI会带来经济革命还是渐进变化？',
        tension_a: '更可能是渐进而非革命性变化',
        tension_b: 'AI的变革速度可能超出历史先例',
        keywords: ['Tyler Cowen', 'AI经济学', '增长理论', '技术变革']
    },
    {
        date: '2026-01-19',
        freq: 'P1',
        stance: 'B',
        title: 'Conversations with Tyler回顾：AI改变了什么？',
        author_name: 'Tyler Cowen',
        author_avatar: 'TC',
        author_bio: '乔治梅森大学经济学教授，Marginal Revolution博客创始人',
        source: '2025年12月23日 · Conversations with Tyler · 2025年终回顾',
        content: '在Conversations with Tyler的2025年终回顾节目中，Tyler Cowen与制作人Jeff Holmes讨论了AI如何改变他们的节目制作以及更广泛的智识对话。他们反思了这一年中关于AI风险的讨论是如何演变的——从早期的恐慌式警告到更加微妙的分析。Cowen分享了他在过去一年中与AI研究者、经济学家和哲学家对话中获得的洞见。他特别关注了AI安全讨论中的"部落化"倾向，以及如何在乐观主义和悲观主义之间找到平衡。这是一期对这一年AI讨论的反思性总结。',
        tension_q: 'AI安全讨论是否变得过于两极化？',
        tension_a: '需要更多细致入微的分析',
        tension_b: '两极化反映了真实的分歧',
        keywords: ['Tyler Cowen', 'AI讨论', '知识对话', '2025回顾']
    },
    {
        date: '2026-01-19',
        freq: 'Φ1',
        stance: 'A',
        title: 'Peter Thiel的"反基督"讲座：技术、神学与政治',
        author_name: 'Peter Thiel',
        author_avatar: 'PT',
        author_bio: 'PayPal联合创始人，Palantir创始人，风险投资人',
        source: '2025年9-10月 · 旧金山系列讲座 · The Antichrist',
        content: '从2025年9月15日到10月6日，Peter Thiel在旧金山举办了一系列关于"反基督"主题的讲座。这些讲座后来通过泄露的录音曝光，内容涉及神学、历史、文学和政治的交汇。Thiel将他对科技和进步的思考融入了这些讨论，提出了一些争议性的观点——包括将气候活动家Greta Thunberg描述为"反基督的模拟物"。他认为那些倡导监管和限制的人是在"反对上帝"。无论人们对这些观点持何态度，这些讲座展示了Thiel思维中的宗教和哲学维度——这不仅仅是一位风险投资人的商业思考。',
        tension_q: '技术发展是否有神学或宗教维度？',
        tension_a: '这只是世俗的工程问题',
        tension_b: '技术选择反映更深层的价值观和世界观',
        keywords: ['Peter Thiel', '神学', '反基督', '技术哲学']
    },
    {
        date: '2026-01-19',
        freq: 'H2',
        stance: 'A',
        title: '2025年度经济回顾：AI投资与传统经济的碰撞',
        author_name: 'Tracy Alloway & Joe Weisenthal',
        author_avatar: 'OL',
        author_bio: 'Odd Lots播客主持人，彭博财经记者',
        source: '2025年12月23日 · The Ezra Klein Show联动 · 2025经济回顾',
        content: '在与The Ezra Klein Show的特别联动节目中，Odd Lots播客的主持人Tracy Alloway和Joe Weisenthal与Ezra Klein共同回顾了2025年的经济局势。他们讨论了一个核心主题：AI投资热潮如何与更广泛的经济趋势相互作用。Alloway指出，AI投资已成为支撑经济增长的关键因素：超大规模科技公司的资本支出正在扮演过去由政府刺激扮演的角色。但这也带来风险——如果AI泡沫破裂，后果可能是严重的。三人还讨论了传统经济学工具在评估AI影响时的局限性。',
        tension_q: 'AI投资热潮对整体经济是利是弊？',
        tension_a: '目前是正面刺激，但风险正在积累',
        tension_b: 'AI带动的增长是可持续和健康的',
        keywords: ['Odd Lots', 'AI投资', '2025经济', '宏观经济']
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
                console.log(`${status} ${item.date} [${item.freq}] ${item.author_name} (${item.content.length}字符)`);
                if (!success) {
                    console.log(`   ${body.substring(0, 80)}`);
                }
                resolve({ success });
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('=== 添加已验证的2025年真实来源内容 ===');
    console.log('规则: 所有来源必须是2025年及更早');
    console.log('');

    let successCount = 0;
    for (const item of verifiedContent2025) {
        const result = await postData(item);
        if (result.success) successCount++;
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n=== 完成: ${successCount}/${verifiedContent2025.length} 条成功添加 ===`);
}

main();
