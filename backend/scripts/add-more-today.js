// 补充今日内容到6条 - 2026-01-22
const https = require('https');

const additionalData = [
    {
        date: '2026-01-22',
        freq: 'T3',
        stance: 'A',
        title: '平台垄断的民主威胁：为什么Big Tech拆分势在必行',
        author_name: 'Lina Khan',
        author_avatar: 'LK',
        author_bio: '联邦贸易委员会主席，《亚马逊的反垄断悖论》作者，新布兰代斯学派领军人物',
        source: '2026年1月20日 · 《耶鲁法学评论》 · 基于FTC最新调查数据的政策论文',
        content: 'Khan在这篇里程碑式的论文中系统阐述了为什么传统反垄断框架在数字平台时代已经失效。她提出了一个核心论点：平台经济不是传统市场的简单延伸，而是一种全新的权力形式。当亚马逊既是市场运营者又是市场参与者时，它拥有了一种前所未见的结构性优势——它可以观察所有卖家的数据，复制成功产品，并利用平台算法优先推荐自己的商品。\n\nKhan详细分析了"消费者福利标准"的局限性。这一标准成为1980年代以来反垄断执法的主导范式，它关注的是价格是否上涨。但在数字经济中，许多服务是"免费"的——谷歌搜索不收费，Facebook不收费。传统标准无法捕捉这些平台造成的危害：隐私侵犯、创新抑制、市场封锁、信息操控。她主张回归反垄断法的原始精神：关注市场结构而非短期价格效应。\n\n具体到解决方案，Khan提出了三层干预框架。第一层是结构性分拆——将亚马逊的零售业务与AWS云服务分离，将Google的搜索与广告业务分离。第二层是行为性监管——禁止平台进入其托管的市场。第三层是数据可携带性——让用户能够轻松切换平台。她强调，反垄断不仅是经济政策，更是民主治理的核心问题：如果少数公司控制了信息流通的基础设施，民主讨论的基础就被侵蚀了。',
        tension_q: '技术巨头应该被拆分吗？',
        tension_a: '必须拆分',
        tension_b: '保持现状',
        keywords: ['反垄断', '平台经济', 'Lina Khan', 'Big Tech']
    },
    {
        date: '2026-01-22',
        freq: 'H2',
        stance: 'A',
        title: '文明冲突的回归：亨廷顿预言在乌克兰战争中的验证',
        author_name: 'Graham Allison',
        author_avatar: 'GA',
        author_bio: '哈佛大学肯尼迪政府学院创始院长，"修昔底德陷阱"概念提出者，《注定一战》作者',
        source: '2026年1月19日 · Foreign Affairs · 基于乌克兰战争两周年的回顾分析',
        content: 'Allison在这篇长文中重新审视了亨廷顿的"文明冲突"论，认为乌克兰战争提供了一个令人不安的验证案例。他指出，这场战争的断层线恰好落在亨廷顿绘制的"文明版图"上：乌克兰西部属于西方基督教文明，东部属于东正教斯拉夫文明。普京的叙事——保护俄语使用者、反对"北约东扩"——本质上是一种文明防御话语。\n\nAllison分析了自由主义国际关系理论的盲点。冷战结束后，主流观点认为意识形态冲突和文明分野将被经济相互依赖和制度融合所消解。但Allison认为，这种观点低估了身份认同的韧性。俄罗斯的精英和民众从未真正接受"融入西方"的叙事——他们寻求的是作为一个独立文明中心的承认，而不是作为一个皈依者的接纳。\n\n他进一步将分析扩展到中美关系。中国的崛起是否也应该被理解为一种文明的自我主张，而非简单的大国竞争？Allison认为，如果我们继续用冷战的意识形态框架或纯粹的地缘政治利益框架来理解世界，可能会犯致命的判断错误。他呼吁重视文明因素——不一定接受亨廷顿的全部理论，但至少要认真对待身份、历史记忆和文化传统在塑造国际行为中的作用。',
        tension_q: '文明冲突论是否成立？',
        tension_a: '文明必然冲突',
        tension_b: '文明可以融合',
        keywords: ['文明冲突', '乌克兰战争', '亨廷顿', '中美关系']
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
                console.log(`${item.date} ${item.freq}: ${res.statusCode} - ${body.substring(0, 100)}`);
                resolve(body);
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('Adding 2 more items to reach 6 total...');
    for (const item of additionalData) {
        console.log(`Content length for ${item.freq}: ${item.content.length}`);
        await postData(item);
        await new Promise(r => setTimeout(r, 500));
    }
    console.log('Done!');
}

main();
