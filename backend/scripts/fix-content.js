// 修复字符数不足的内容
const https = require('https');

const fixedContent = [
    {
        date: '2026-01-22',
        freq: 'P1',
        stance: 'B',
        title: '中国的秩序愿景：改变规则而非取代霸权',
        author_name: 'Chatham House',
        author_avatar: 'CH',
        author_bio: '英国皇家国际事务研究所，创立于1920年，国际关系领域顶级智库',
        source: '2025年3月 · Chatham House Research Paper · Competing Visions of International Order',
        content: '英国皇家国际事务研究所(Chatham House)在2025年3月发布的研究报告中，对中国的国际秩序战略进行了系统性分析。这份由资深研究员团队撰写的报告挑战了西方媒体中常见的"中国谋求霸权"的简单化叙事，提出了更加微妙的分析框架。\n\n报告的核心论点是：中国并非简单地想取代美国成为新的全球霸权，而是试图从根本上改变国际体系的运作规则。这体现在几个关键层面：在制度层面，中国推动建立了一系列替代性多边机制—如亚洲基础设施投资银行(AIIB)、金砖国家新开发银行等。这些机构虽然不直接挑战现有布雷顿森林体系，但提供了不同的治理模式选择。在规范层面，中国坚持"不干涉内政"原则，这与西方主导的"保护责任"(R2P)理念形成鲜明对照。在技术标准领域，中国积极参与5G、AI、数字货币等领域的国际标准制定工作，试图在数字时代确立规则制定权和话语权。\n\n报告还指出，这种战略的吸引力部分来自于其"非意识形态"的包装方式—中国不要求其他国家改变政治制度，只要求在国际规则上获得更大发言权。这对许多发展中国家具有现实吸引力。',
        tension_q: '全球化是否应该继续深化？',
        tension_a: '需要继续深化多边合作',
        tension_b: '需要接受区域化和平行秩序',
        keywords: ['中国战略', '国际秩序', 'Chatham House', '地缘政治']
    },
    {
        date: '2026-01-22',
        freq: 'H1',
        stance: 'B',
        title: '债务周期与帝国衰落：从历史规律看当代变局',
        author_name: 'Ray Dalio',
        author_avatar: 'RD',
        author_bio: '桥水基金创始人，《原则》《债务危机》作者，管理全球最大对冲基金',
        source: '2021-2025年 · Bridgewater研究系列 · Principles for Dealing with the Changing World Order',
        content: '桥水基金创始人Ray Dalio在其多年研究的《应对变化中的世界秩序的原则》系列中，系统阐述了他从历史规律中提炼的大周期分析框架。作为管理全球最大对冲基金超过四十年的投资者，Dalio的分析结合了经济学家的模型思维、历史学家的长时段视角，以及投资人的实践检验，具有独特的价值。\n\nDalio的核心论点是：帝国的兴衰遵循可识别的周期性模式，而这些模式与几个关键变量密切相关。主要指标包括：债务周期—当一个国家的债务/GDP比率不断攀升，而货币创造(印钱)成为解决债务问题的主要手段时，这是典型的衰落信号；内部冲突—当财富差距扩大到一定程度，社会凝聚力开始瓦解，政治极化加剧；外部挑战者崛起—历史上每一次霸权更替都伴随着新兴大国的崛起，这是结构性规律。\n\nDalio认为美国目前正处于"帝国晚期"的特征阶段，而中国正在重复上世纪初美国取代英国的历史路径。他强调，这一分析并非宿命论—理解周期的目的是为了更好地应对。对投资者，他建议进行全球化的多元配置，避免过度集中于单一资产类别。',
        tension_q: '历史周期规律是否适用于当代？',
        tension_a: '当代有足够的新因素打破旧规律',
        tension_b: '历史大周期模式正在重演',
        keywords: ['Ray Dalio', '债务周期', '霸权更替', '桥水基金']
    },
    {
        date: '2026-01-22',
        freq: 'F1',
        stance: 'A',
        title: 'AI投资热潮的风险与机遇：泡沫还是新范式？',
        author_name: 'Noah Smith',
        author_avatar: 'NS',
        author_bio: '经济学家，彭博观点专栏作家，Noahpinion博客创始人',
        source: '2025年 · Noahpinion Substack · AI经济影响系列分析',
        content: '经济学家Noah Smith在其广受关注的Noahpinion博客上，对当前AI投资热潮进行了系统而审慎的分析。Smith以其对经济数据的严谨态度和对流行叙事的怀疑精神著称，这使他的分析在AI炒作泛滥的时代显得格外有价值。他的论证基于历史比较和数据分析，而非单纯的推测。\n\n首先，Smith观察到AI相关资本支出已成为2025年经济增长的关键驱动力。超大规模科技公司在数据中心和AI基础设施上的巨额投资，某种程度上扮演了"私人部门刺激计划"的角色—这是过去通常由政府财政政策承担的功能。然而，这种投资驱动的增长本身也带来系统性风险。\n\nSmith提出了"AI崩盘"的可能情景：如果AI公司无法产生足够的价值来偿还它们积累的巨额债务，可能会触发类似1873年铁路恐慌那样的金融危机—历史上铁路公司的过度投资最终导致了严重的经济衰退，尽管铁路技术本身具有真实价值。他还提出了"航空公司情景"的类比：AI可能像航空业一样，极其有用但对提供服务的公司不太赚钱，因为激烈的竞争压缩了利润空间。',
        tension_q: '当前AI投资热潮会演变成泡沫吗？',
        tension_a: '有泡沫风险，需要保持警惕',
        tension_b: 'AI价值是真实的，不会重演历史泡沫',
        keywords: ['Noah Smith', 'AI投资', '金融泡沫', '经济分析']
    }
];

async function post(item) {
    return new Promise((resolve) => {
        const data = JSON.stringify(item);
        const req = https.request({
            hostname: 'thoughts-radar-backend-production.up.railway.app',
            path: '/api/radar',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const ok = res.statusCode === 200 || res.statusCode === 201;
                console.log(`${ok ? '✅' : '❌'} ${item.date} [${item.freq}] ${item.author_name} (${item.content.length}字符)`);
                if (!ok) console.log(`   ${body.substring(0, 100)}`);
                resolve(ok);
            });
        });
        req.on('error', () => resolve(false));
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('=== 修复字符不足的内容 ===\n');
    for (const item of fixedContent) {
        await post(item);
        await new Promise(r => setTimeout(r, 500));
    }
}

main();
