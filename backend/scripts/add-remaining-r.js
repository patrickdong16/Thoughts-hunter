// 添加剩余 R 宗教领域内容 - 扩展到 420+ 字符
const https = require('https');

const items = [
    {
        date: '2026-01-22',
        freq: 'R2',
        stance: 'A',
        title: 'John Lennox论科学与信仰的兼容性：数学家的上帝观',
        author_name: 'John Lennox',
        author_avatar: 'JL',
        author_bio: '牛津大学数学名誉教授，基督教护教学者，《上帝是否是数学家？》作者',
        source: '2025年4月 · YouTube深度访谈 · Has Science Buried God?',
        content: '牛津大学数学名誉教授John Lennox是当代最杰出的科学与信仰对话者之一。在这场2025年的深度访谈中，Lennox系统性地挑战了"科学已经埋葬了上帝"这一在新无神论运动中流行的观点。他从数学和逻辑的角度论证：科学的可理解性本身就指向一个理性的创造者。为什么宇宙遵循数学规律？为什么人类的心智能够发现这些规律？Lennox认为这些问题指向科学之外的层面。他仔细区分了"科学主义"（相信科学能解释一切的意识形态立场）和真正的科学方法（承认其解释范围的限制）。Lennox援引了牛顿、法拉第、麦克斯韦等历史上许多虔诚信徒的科学家，指出科学与信仰在历史上不仅非对立，而且科学革命本身受益于基督教对理性创造者的信仰。Lennox的核心论点是：科学告诉我们宇宙如何运作的机制，但信仰回答的是为什么存在这样一个可被理解的宇宙的意义问题。两者处理不同层面的问题，因此不仅可以共存，而且相互补充。这种"分层解释"的观点为信仰与科学的和解提供了优雅的知识论框架。',
        tension_q: '科学与信仰能否共存？',
        tension_a: '科学和信仰回答不同层面的问题，可以兼容',
        tension_b: '科学方法最终将解释所有现象，无需诉诸信仰',
        keywords: ['John Lennox', '牛津大学', '科学与信仰', '护教学']
    },
    {
        date: '2026-01-21',
        freq: 'R1',
        stance: 'A',
        title: 'Jonathan Haidt论道德基础与宗教社区的不可替代功能',
        author_name: 'Jonathan Haidt',
        author_avatar: 'JH',
        author_bio: '纽约大学斯特恩商学院教授，《正义之心》《娇惯的心灵》作者',
        source: '2025年9月 · Making Sense Podcast · 道德心理学与宗教',
        content: '社会心理学家Jonathan Haidt在与Sam Harris的对话中深入探讨了一个关键问题：宗教在现代社会中扮演什么角色？尽管Haidt本人是无神论者，但他对宗教持有深刻的同情性理解，这使他的分析特别有说服力。Haidt的道德基础理论指出人类天生具有六种道德直觉维度：关爱、公平、忠诚、权威、神圣和自由。宗教传统历史性地整合并培养了所有这些直觉维度。Haidt警告说，当代世俗自由主义往往只强调关爱和公平，同时积极解构忠诚和权威，这种失衡可能导致社会凝聚力的严重削弱。他特别强调宗教社区提供的独特社会资本：每周固定聚会产生的人际联结、共同仪式创造的集体认同，以及共享的宇宙叙事赋予生命的意义框架。这些功能极难被世俗替代品完全复制。Haidt并非呼吁回归宗教，而是呼吁理解宗教曾经服务且继续服务的深层社会和心理功能，并思考世俗社会如何可能建立类似的凝聚结构和意义系统。他的视角对于理解现代性危机极具启发意义。',
        tension_q: '宗教在现代社会的角色？',
        tension_a: '宗教社区提供不可替代的社会凝聚力功能',
        tension_b: '世俗社会可以发展出替代宗教功能的机制',
        keywords: ['Jonathan Haidt', '道德心理学', '宗教功能', '社会资本']
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
                if (!ok) console.log(`   ${body.substring(0, 120)}`);
                resolve(ok);
            });
        });
        req.on('error', () => resolve(false));
        req.write(data);
        req.end();
    });
}

(async () => {
    console.log('=== 添加剩余 R 内容 ===');
    for (const item of items) {
        console.log(`预检: ${item.author_name} = ${item.content.length} 字符`);
    }
    console.log('');
    for (const item of items) {
        await post(item);
        await new Promise(r => setTimeout(r, 500));
    }
})();
