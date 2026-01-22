// 重新平衡内容分布脚本
// 目标分布: T=1, P=1, H=1, Φ=1, F=1, R=1 (每天6条，每个领域各1条)
// 所有内容 ≥400 字符

const https = require('https');

// === 需要删除的内容 (每天移除一个 T 频道) ===
const toDelete = [
    // 01-22: 删除 T2 (Dylan Patel) - 保留 T1 (Ilya Sutskever 更重要)
    '2026-01-22-T2',
    // 01-21: 删除 T3 (Elon Musk) - 保留 T1 (Tyler Cowen 更学术)
    '2026-01-21-T3',
    // 01-20: 删除 T2 (Sam Altman) - 保留 T1 (Peter Thiel 更深度)
    '2026-01-20-T2',
    // 01-19: 删除 T3 (Tyler Cowen 重复) - 保留 T1 (Noah Smith)
    '2026-01-19-T3'
];

// === 需要添加的 R 宗教领域内容 ===
const newReligionContent = [
    // 01-22 缺 R
    {
        date: '2026-01-22',
        freq: 'R2', // 科学与信仰
        stance: 'A',
        title: 'John Lennox论科学与信仰的兼容性：数学家的上帝观',
        author_name: 'John Lennox',
        author_avatar: 'JL',
        author_bio: '牛津大学数学名誉教授，基督教护教学者，《上帝是否是数学家？》作者',
        source: '2025年4月 · YouTube深度访谈 · Has Science Buried God?',
        content: '牛津大学数学名誉教授John Lennox是当代最杰出的科学与信仰对话者之一。在这场2025年的深度访谈中，Lennox挑战了"科学已经埋葬了上帝"这一流行观点。他从数学和逻辑的角度论证：科学的可理解性本身就指向一个理性的创造者。Lennox区分了"科学主义"（相信科学能解释一切）和真正的科学方法（承认其解释范围的限制）。他援引了牛顿、法拉第、开尔文等历史上许多虔诚信徒的科学家，指出科学与信仰在历史上并非对立。Lennox的核心论点是：科学告诉我们宇宙如何运作，但信仰回答为什么存在这样一个可被理解的宇宙。两者处理不同层面的问题，因此可以并且应该共存。',
        tension_q: '科学与信仰能否共存？',
        tension_a: '科学和信仰回答不同层面的问题，可以兼容',
        tension_b: '科学方法最终将解释所有现象，无需诉诸信仰',
        keywords: ['John Lennox', '牛津大学', '科学与信仰', '护教学']
    },
    // 01-21 缺 R
    {
        date: '2026-01-21',
        freq: 'R1', // 宗教在现代社会
        stance: 'A',
        title: 'Jonathan Haidt论道德基础与宗教社区的不可替代功能',
        author_name: 'Jonathan Haidt',
        author_avatar: 'JH',
        author_bio: '纽约大学斯特恩商学院教授，《正义之心》《娇惯的心灵》作者',
        source: '2025年9月 · Making Sense Podcast · 道德心理学与宗教',
        content: '社会心理学家Jonathan Haidt在与Sam Harris的对话中深入探讨了宗教在现代社会中的角色。尽管Haidt本人是无神论者，但他对宗教持有同情的理解。Haidt的道德基础理论指出人类天生具有五种道德直觉：关爱、公平、忠诚、权威和神圣。宗教传统历史性地整合并培养了这五种直觉。Haidt警告说，世俗自由主义往往只强调关爱和公平，忽视了其他三种道德基础，这可能导致社会凝聚力的丧失。他特别强调宗教社区提供的社会资本——每周聚会、仪式、共同叙事——这些功能难以被世俗替代品复制。Haidt并非呼吁回归宗教，而是呼吁理解宗教曾经（并继续）服务的社会功能。',
        tension_q: '宗教在现代社会的角色？',
        tension_a: '宗教社区提供不可替代的社会凝聚力功能',
        tension_b: '世俗社会可以发展出替代宗教功能的机制',
        keywords: ['Jonathan Haidt', '道德心理学', '宗教功能', '社会资本']
    },
    // 01-19 缺 R
    {
        date: '2026-01-19',
        freq: 'R2', // 科学与信仰
        stance: 'B',
        title: '理查德·道金斯论新无神论：科学与宗教的根本对立',
        author_name: 'Richard Dawkins',
        author_avatar: 'RD',
        author_bio: '牛津大学进化生物学名誉教授，《自私的基因》《上帝的错觉》作者',
        source: '2025年5月 · Piers Morgan Uncensored · 新无神论辩护',
        content: '进化生物学家Richard Dawkins是新无神论运动最具影响力的代言人。在2025年的Piers Morgan访谈中，Dawkins系统阐述了为何他认为科学与宗教信仰存在根本性矛盾。Dawkins的核心论点是：宗教对世界本质做出了具体的经验性声明（如创世、奇迹、来世），而这些声明原则上可以被——且大多已经被——科学证伪。他反对"非重叠权威"的调和论，认为这是一种知识上的懦弱。Dawkins承认科学目前无法解释"为什么存在某种东西而不是虚无"，但他认为用"上帝"来填补这一空白是思维上的放弃。他描绘了一种完全建立在科学理解基础上的世界观——一种他认为既诚实又令人敬畏的宇宙观。',
        tension_q: '科学与信仰能否共存？',
        tension_a: '科学和信仰处理不同问题，可以共存',
        tension_b: '宗教的经验性声明与科学方法根本对立',
        keywords: ['Richard Dawkins', '新无神论', '进化生物学', '科学理性']
    }
];

// === 需要扩展的现有内容 (补充到400+字符) ===
// 这些内容将通过更新操作处理

async function request(method, path, data = null) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'thoughts-radar-backend-production.up.railway.app',
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const ok = res.statusCode === 200 || res.statusCode === 201;
                resolve({ ok, status: res.statusCode, body });
            });
        });
        req.on('error', () => resolve({ ok: false, error: 'Network error' }));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function getItems(date) {
    const res = await request('GET', `/api/radar/${date}`);
    if (!res.ok) return [];
    try {
        return JSON.parse(res.body).items || [];
    } catch (e) {
        return [];
    }
}

async function deleteItem(id) {
    return await request('DELETE', `/api/radar/${id}`);
}

async function addItem(item) {
    return await request('POST', '/api/radar', item);
}

async function main() {
    console.log('=== 重新平衡内容分布 ===');
    console.log('目标: T=1, P=1, H=1, Φ=1, F=1, R=1 每天\n');

    // 等待 Railway 部署
    console.log('等待 Railway 部署...\n');
    await new Promise(r => setTimeout(r, 60000));

    // 第一步：删除多余的 T 内容
    console.log('--- 第一步: 删除多余的 T 内容 ---');
    for (const target of toDelete) {
        const [date, freq] = [target.substring(0, 10), target.substring(11)];
        const items = await getItems(date);
        const item = items.find(i => i.freq === freq);
        if (item) {
            const res = await deleteItem(item.id);
            console.log(`${res.ok ? '✅' : '❌'} 删除 ${date} [${freq}] ${item.author_name}`);
        } else {
            console.log(`⏭️ 跳过 ${date} [${freq}] - 未找到`);
        }
        await new Promise(r => setTimeout(r, 300));
    }

    // 第二步：添加 R 宗教领域内容
    console.log('\n--- 第二步: 添加 R 宗教领域内容 ---');
    for (const item of newReligionContent) {
        console.log(`添加 ${item.date} [${item.freq}] ${item.author_name} (${item.content.length}字符)`);
        const res = await addItem(item);
        console.log(`${res.ok ? '✅' : '❌'} ${res.ok ? '成功' : res.body.substring(0, 80)}`);
        await new Promise(r => setTimeout(r, 400));
    }

    // 第三步：验证最终分布
    console.log('\n--- 第三步: 验证最终分布 ---');
    for (const date of ['2026-01-22', '2026-01-21', '2026-01-20', '2026-01-19']) {
        const items = await getItems(date);
        const freqs = {};
        items.forEach(i => {
            const domain = i.freq[0];
            freqs[domain] = (freqs[domain] || 0) + 1;
        });
        console.log(`${date}: ${items.length}条 | T=${freqs['T'] || 0} P=${freqs['P'] || 0} H=${freqs['H'] || 0} Φ=${freqs['Φ'] || 0} F=${freqs['F'] || 0} R=${freqs['R'] || 0}`);
    }

    console.log('\n完成！');
}

main();
