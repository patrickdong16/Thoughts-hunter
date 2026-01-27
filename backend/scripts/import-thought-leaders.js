#!/usr/bin/env node
/**
 * 批量导入思想领袖到数据库
 * 数据来源：CONTENT_SOURCES.md
 */

const API_BASE = 'https://thoughts-radar-backend-production.up.railway.app';

const leaders = [
    // 技术 (T) - 补充名单
    { name: 'Elon Musk', name_cn: '埃隆·马斯克', role: 'Tesla/SpaceX/xAI CEO', domain: 'T', priority: 1, twitter_handle: 'elonmusk', notes: '技术乐观主义' },
    { name: 'Ilya Sutskever', name_cn: 'Ilya Sutskever', role: 'SSI 创始人', domain: 'T', priority: 1, twitter_handle: 'ilyasut', notes: 'AI 安全' },
    { name: 'Geoffrey Hinton', name_cn: 'Geoffrey Hinton', role: 'AI 先驱', domain: 'T', priority: 2, twitter_handle: 'geoffreyhinton', notes: 'AI 风险预警者' },
    { name: 'Yann LeCun', name_cn: 'Yann LeCun', role: 'Meta AI', domain: 'T', priority: 2, twitter_handle: 'ylecun', notes: 'AI 乐观派' },
    { name: 'Stuart Russell', name_cn: 'Stuart Russell', role: 'UC Berkeley', domain: 'T', priority: 3, notes: 'AI 安全' },
    { name: 'Fei-Fei Li', name_cn: '李飞飞', role: 'Stanford HAI', domain: 'T', priority: 3, twitter_handle: 'drfeifei', notes: 'AI 伦理' },
    { name: 'Peter Thiel', name_cn: '彼得·蒂尔', role: '投资人/哲学家', domain: 'T', priority: 2, twitter_handle: 'peterthiel', notes: '技术悲观主义' },
    { name: 'Balaji Srinivasan', name_cn: 'Balaji Srinivasan', role: 'a16z', domain: 'T', priority: 3, twitter_handle: 'balajis', rss_url: 'https://balajis.com/rss/', blog_url: 'https://balajis.com', notes: '网络国家' },
    { name: 'Vitalik Buterin', name_cn: 'Vitalik Buterin', role: '以太坊创始人', domain: 'T', priority: 3, twitter_handle: 'VitalikButerin', blog_url: 'https://vitalik.eth.limo', notes: '加密货币' },

    // 政治 (P)
    { name: 'Francis Fukuyama', name_cn: '弗朗西斯·福山', role: '政治学者', domain: 'P', priority: 2, notes: '历史终结论' },
    { name: 'John Mearsheimer', name_cn: 'John Mearsheimer', role: '现实主义者', domain: 'P', priority: 2, notes: '大国竞争' },
    { name: 'Anne Applebaum', name_cn: 'Anne Applebaum', role: '历史学家/记者', domain: 'P', priority: 3, twitter_handle: 'anneapplebaum', notes: '威权主义研究' },
    { name: 'Fareed Zakaria', name_cn: 'Fareed Zakaria', role: 'CNN/学者', domain: 'P', priority: 3, twitter_handle: 'FareedZakaria', notes: '全球化' },
    { name: 'Ian Bremmer', name_cn: 'Ian Bremmer', role: 'Eurasia Group', domain: 'P', priority: 2, twitter_handle: 'ianbremmer', notes: '地缘政治' },
    { name: 'Graham Allison', name_cn: 'Graham Allison', role: '哈佛', domain: 'P', priority: 2, notes: '修昔底德陷阱' },
    { name: 'Kishore Mahbubani', name_cn: '马凯硕', role: '新加坡', domain: 'P', priority: 3, notes: '亚洲视角' },
    { name: 'Yascha Mounk', name_cn: 'Yascha Mounk', role: '民主研究', domain: 'P', priority: 3, twitter_handle: 'Yascha_Mounk', rss_url: 'https://www.persuasion.community/feed', notes: '自由民主' },
    { name: 'Larry Diamond', name_cn: 'Larry Diamond', role: '斯坦福', domain: 'P', priority: 3, notes: '民主倒退研究' },

    // 哲学 (Φ)
    { name: 'Slavoj Žižek', name_cn: '齐泽克', role: '哲学家', domain: 'Φ', priority: 3, notes: '意识形态批判' },
    { name: 'Michael Sandel', name_cn: 'Michael Sandel', role: '哈佛', domain: 'Φ', priority: 2, notes: '公共哲学' },
    { name: 'Martha Nussbaum', name_cn: 'Martha Nussbaum', role: '芝加哥大学', domain: 'Φ', priority: 3, notes: '能力方法' },
    { name: 'Peter Singer', name_cn: 'Peter Singer', role: '普林斯顿', domain: 'Φ', priority: 3, twitter_handle: 'PeterSinger', notes: '伦理学' },
    { name: 'Nassim Taleb', name_cn: 'Nassim Taleb', role: '风险/哲学', domain: 'Φ', priority: 2, twitter_handle: 'nntaleb', notes: '黑天鹅理论' },
    { name: 'Jonathan Haidt', name_cn: 'Jonathan Haidt', role: 'NYU', domain: 'Φ', priority: 2, twitter_handle: 'JonHaidt', blog_url: 'https://jonathanhaidt.com', notes: '道德心理学' },

    // 历史 (H)
    { name: 'Niall Ferguson', name_cn: 'Niall Ferguson', role: '历史学家/评论家', domain: 'H', priority: 2, twitter_handle: 'naboris', notes: '帝国衰落' },
    { name: 'Peter Turchin', name_cn: 'Peter Turchin', role: '历史动力学', domain: 'H', priority: 3, blog_url: 'https://peterturchin.com', notes: '社会周期' },
    { name: 'Timothy Snyder', name_cn: 'Timothy Snyder', role: '耶鲁', domain: 'H', priority: 2, twitter_handle: 'TimothyDSnyder', notes: '暴政研究' },
    { name: 'Adam Tooze', name_cn: 'Adam Tooze', role: '哥伦比亚', domain: 'H', priority: 2, twitter_handle: 'adam_tooze', rss_url: 'https://adamtooze.substack.com/feed', blog_url: 'https://adamtooze.substack.com', notes: '经济史' },
    { name: 'Jared Diamond', name_cn: 'Jared Diamond', role: 'UCLA', domain: 'H', priority: 3, notes: '文明兴衰' },

    // 金融 (F)
    { name: 'Ray Dalio', name_cn: 'Ray Dalio', role: '桥水基金', domain: 'F', priority: 1, twitter_handle: 'RayDalio', blog_url: 'https://www.linkedin.com/today/author/raydalio', notes: '周期/大国博弈' },
    { name: 'Howard Marks', name_cn: 'Howard Marks', role: '橡树资本', domain: 'F', priority: 2, notes: '市场周期' },
    { name: 'Mohamed El-Erian', name_cn: 'Mohamed El-Erian', role: '经济学家', domain: 'F', priority: 2, twitter_handle: 'elerianm', notes: '央行政策' },
    { name: 'Cathie Wood', name_cn: 'Cathie Wood', role: 'ARK Invest', domain: 'F', priority: 3, twitter_handle: 'CathieDWood', notes: '颠覆创新' },
    { name: 'Larry Fink', name_cn: 'Larry Fink', role: '贝莱德 CEO', domain: 'F', priority: 2, notes: 'ESG' },
    { name: 'Nouriel Roubini', name_cn: 'Nouriel Roubini', role: 'NYU', domain: 'F', priority: 3, twitter_handle: 'Nouriel', notes: '危机预测' },

    // 宗教 (R)
    { name: 'Charles Taylor', name_cn: 'Charles Taylor', role: '哲学家', domain: 'R', priority: 2, notes: '世俗时代' },
    { name: 'John Gray', name_cn: 'John Gray', role: '政治哲学家', domain: 'R', priority: 2, notes: '反乌托邦' },
    { name: 'David Bentley Hart', name_cn: 'David Bentley Hart', role: '神学家', domain: 'R', priority: 3, notes: '神学批评' }
];

async function addLeader(leader) {
    try {
        const response = await fetch(`${API_BASE}/api/automation/leaders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leader)
        });
        const data = await response.json();
        if (data.success) {
            console.log(`✅ ${leader.domain} | ${leader.name}`);
        } else {
            console.log(`⚠️ ${leader.domain} | ${leader.name}: ${data.error || 'unknown error'}`);
        }
        return data;
    } catch (error) {
        console.error(`❌ ${leader.name}: ${error.message}`);
    }
}

async function main() {
    console.log(`\n🎯 开始导入 ${leaders.length} 位思想领袖...\n`);

    for (const leader of leaders) {
        await addLeader(leader);
        await new Promise(r => setTimeout(r, 100)); // 避免请求过快
    }

    console.log('\n📊 导入完成！正在获取统计...\n');

    const statsRes = await fetch(`${API_BASE}/api/automation/leaders`);
    const stats = await statsRes.json();
    console.log(`总计: ${stats.count} 位思想领袖`);
    console.log('领域分布:', stats.stats.leadersByDomain);
}

main().catch(console.error);
