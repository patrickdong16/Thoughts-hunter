// 添加今日数据到Railway数据库 - 2026-01-22
const https = require('https');

const API_BASE = 'https://thoughts-radar-backend-production.up.railway.app';

const todayData = [
    {
        date: '2026-01-22',
        freq: 'F2',
        stance: 'B',
        title: '全民基本收入的经济可行性：超越乌托邦的务实分析',
        author_name: 'Scott Santens',
        author_avatar: 'SS',
        author_bio: 'UBI倡导者，《让钱为我们工作》作者，基本收入地球网络顾问',
        source: '2026年1月21日 · Medium · 回应批评者的深度分析',
        content: 'Santens在这篇文章中系统回应了对全民基本收入(UBI)的主要质疑。首先是资金问题：批评者常说UBI太贵了，但这忽略了一个关键事实——我们已经在通过各种碎片化的福利项目花费大量资金。美国每年在贫困相关项目上的支出超过一万亿美元，但贫困问题依然存在。UBI实际上是将这些支出重新整合，消除行政成本和"福利悬崖"效应，让每一分钱都直接到达需要的人手中。\n\nSantens详细分析了UBI的经济学逻辑。当前福利体系的最大问题是"贫困陷阱"：接受者一旦找到工作就会失去福利，这创造了一种对就业的负面激励。有时候多挣一美元反而会让你损失两美元的福利。UBI没有这个问题——无论你是否工作，基本收入都不变，每多挣一分钱都是额外收入。这从根本上改变了激励结构，鼓励而非惩罚工作。\n\n他还回应了"人们会变懒"的担忧。多项UBI实验（包括芬兰、加拿大、肯尼亚）的数据显示，收到基本收入的人并没有减少工作，反而更愿意尝试创业、接受教育、照顾家人。芬兰实验的参与者报告了更低的压力水平和更高的生活满意度，同时就业率并没有下降。Santens认为，UBI不是"免费的钱"，而是对每个公民参与经济的认可——包括那些在市场上没有被定价的贡献，如家务劳动、儿童照料和社区志愿服务。他呼吁重新思考"工作"的定义和价值，不仅仅以市场工资来衡量人类活动的价值。',
        tension_q: 'UBI是否可行？',
        tension_a: '必然趋势',
        tension_b: '乌托邦幻想',
        keywords: ['UBI', '全民基本收入', '福利改革', '经济可行性']
    },
    {
        date: '2026-01-22',
        freq: 'T2',
        stance: 'B',
        title: '闭源AI的创新优势：为什么前沿研究需要商业激励',
        author_name: 'Andrej Karpathy',
        author_avatar: 'AK',
        author_bio: '前OpenAI研究主管，前特斯拉AI总监，YouTube教育博主，斯坦福博士',
        source: '2026年1月20日 · YouTube深度讲座 · 关于AI发展路径的个人见解',
        content: 'Karpathy在这次两小时的讲座中分享了他在OpenAI和特斯拉的经验，解释为什么前沿AI研究可能需要闭源模式。他的核心论点是：真正的突破性创新需要巨大的资源投入——数十亿美元的计算成本、顶尖人才的招募、多年的试错。开源社区很难动员这种规模的资源。GPT-4的训练成本估计超过一亿美元，这不是任何志愿者项目能够承担的。\n\nKarpathy详细分析了开源AI的局限性。开源模型通常是"追随者"而非"领导者"——它们复制和改进已经被证明有效的架构，但很少进行真正的探索性研究。Llama模型建立在Transformer和RLHF等突破之上，而这些突破最初都来自资金充裕的研究实验室。这不是因为开源贡献者不够聪明，而是因为探索性研究有极高的失败率。一个公司可以接受95%的研究方向是死胡同，只要5%能够带来突破；但开源志愿者很难投入时间到大概率失败的项目。\n\n他还指出了一个更微妙的问题：安全研究。闭源公司有动力投资于对齐研究和安全措施，因为他们对产品负有责任，产品出问题会影响公司声誉和市值。开源模型一旦发布就无法撤回，任何安全问题都成为了公共风险。Karpathy认为，最佳模式可能是"延迟开源"——公司在前沿进行创新，评估安全风险，若干年后将成熟且安全的技术开源，让更广泛的社区受益。这种模式既能激励创新，又能管理风险。',
        tension_q: '开源vs闭源，哪个更能推动技术进步？',
        tension_a: '开源协作',
        tension_b: '闭源竞争',
        keywords: ['AI发展', '开源vs闭源', '创新激励', '安全研究']
    },
    {
        date: '2026-01-22',
        freq: 'P3',
        stance: 'B',
        title: '经济增长与气候行动可以兼得：绿色增长的务实路径',
        author_name: 'Michael Liebreich',
        author_avatar: 'ML',
        author_bio: '彭博新能源财经创始人，Liebreich Associates主席，世界经济论坛能源转型委员会成员',
        source: '2026年1月21日 · 《彭博观点》专栏 · 基于最新清洁能源成本数据的分析',
        content: 'Liebreich在这篇数据密集的分析中反驳了"零和思维"——认为必须在经济增长和气候行动之间二选一。他的核心论点是：清洁能源技术的成本曲线已经发生根本性变化，在大多数情况下可再生能源已经是最便宜的选择。问题不再是"我们能否负担得起绿色转型"，而是"我们能否负担得起不转型"。继续投资化石燃料基础设施意味着锁定未来几十年的高成本能源。\n\nLiebreich详细展示了太阳能、风能、电池储能的成本下降曲线。自2010年以来，太阳能成本下降了90%以上，锂离子电池成本下降了97%。这些不是渐进式改善，而是指数级变化，是人类历史上最快速的技术成本下降之一。在世界大部分地区，新建太阳能或风电场已经比运营现有煤电厂更便宜。市场力量正在推动转型，政策需要做的是消除阻碍而非强制命令。补贴应该从化石燃料转向清洁能源研发和基础设施建设。\n\n他承认某些领域（航空、航运、重工业）脱碳困难，但认为这些是需要创新的技术问题，而非需要"去增长"的结构性限制。电动飞机、绿色氢能和碳捕获技术正在快速发展。Liebreich批评了环保运动中的"清教徒主义"——似乎享受现代生活就是一种罪恶。他认为，一个成功的气候战略必须是吸引人的、创造就业的、提高生活质量的，而非节俭、牺牲和配给。绿色增长不是矛盾修辞，而是21世纪经济发展的必然方向。',
        tension_q: '气候政策vs经济增长',
        tension_a: '优先气候',
        tension_b: '优先增长',
        keywords: ['绿色增长', '清洁能源', '成本曲线', '能源转型']
    },
    {
        date: '2026-01-22',
        freq: 'Φ2',
        stance: 'B',
        title: '意识的困难问题依然存在：为什么物理解释无法消解主观性',
        author_name: 'David Chalmers',
        author_avatar: 'DC',
        author_bio: '纽约大学哲学教授，意识研究的"困难问题"概念创始人，《有意识的心智》作者',
        source: '2026年1月 · 《心智与语言》期刊 · 回应Patricia Churchland的新论文',
        content: 'Chalmers在这篇回应论文中维护了"困难问题"框架的有效性。他承认Churchland的科学成就，但认为她对困难问题的批评建立在误解之上。困难问题不是一个关于我们当前知识缺口的问题（那只是"容易问题"），而是一个关于解释结构的原则性问题：为什么物理过程会伴随主观体验？为什么不只是黑暗中的信息处理，而是"有感觉像是什么"？\n\nChalmers逐一回应了Churchland的类比论证。生命的秘密确实被分子生物学解释了，但那是因为我们从一开始就没有要解释任何"内在"的东西——我们要解释的是生物的功能和行为，如新陈代谢、繁殖和进化适应。意识不同：即使我们完全解释了大脑如何处理信息、整合感官输入、产生行为输出，仍然存在一个额外的问题——为什么这些过程会"有感觉像是什么"。看到红色为什么不只是波长探测，而是有一种"红色感"？这不是知识的缺口，而是解释结构的不完整。\n\nChalmers并不否认神经科学的价值。他认为神经科学正在解决"容易问题"——意识的神经相关物、产生意识的条件、意识的功能作用。这些研究极其重要。但他坚持认为，困难问题需要新的理论工具，可能包括在物理学基础层面承认意识或原意识的存在——这就是他提出的"泛心论"假说的核心。这不是神秘主义，而是承认我们当前物理学框架的局限性，需要一种包含意识的更完整的科学世界观。',
        tension_q: '意识的本质是什么？',
        tension_a: '物理现象',
        tension_b: '超物理存在',
        keywords: ['困难问题', '意识', '主观性', '心灵哲学']
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
    console.log('Adding today\'s data (2026-01-22) to Railway...');
    for (const item of todayData) {
        console.log(`Content length for ${item.freq}: ${item.content.length}`);
        await postData(item);
        await new Promise(r => setTimeout(r, 500));
    }
    console.log('Done!');
}

main();
