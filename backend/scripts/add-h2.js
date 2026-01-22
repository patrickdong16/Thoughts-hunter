// 添加 01-21 缺失的 H2 内容
const https = require('https');

const item = {
    date: '2026-01-21',
    freq: 'H2',
    stance: 'B',
    title: '民主赤字与威权吸引力：自由秩序的叙事危机',
    author_name: 'Council on Foreign Relations',
    author_avatar: 'CF',
    author_bio: '美国外交关系委员会，创立于1921年，美国顶级外交政策智库',
    source: '2025年12月 · CFR China 2025专题 · 地缘政治与民主的未来',
    content: '美国外交关系委员会在其2025年末更新发布的中国专题综合分析报告中，深入探讨了一个令西方政策制定者深感不安的趋势：为什么越来越多的发展中国家对威权模式表现出明显的兴趣？报告指出问题的根源在于自由民主模式面临的深层叙事危机。过去几十年西方的核心叙事是：民主不仅是道德上正确的选择，而且是通往繁荣的唯一可行路径。但对许多发展中国家来说，这个承诺并未兑现——民主化进程往往伴随政治不稳定和经济停滞。相比之下，中国的发展模式虽有明显问题，但其显著的发展成就——快速城市化、大规模基础设施建设、大幅贫困削减——为另一种发展路径提供了可见的真实证据。报告警告如果西方不能重建其发展叙事，模式吸引力的竞争将继续激化。',
    tension_q: '文明冲突论是否成立？',
    tension_a: '文明可以通过对话和交流融合',
    tension_b: '意识形态和发展模式的竞争日益激烈',
    keywords: ['CFR', '民主危机', '中国模式', '威权主义']
};

console.log('Content length:', item.content.length);

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
        console.log(res.statusCode === 201 ? '✅ 成功' : '❌ ' + body);
    });
});
req.write(data);
req.end();
