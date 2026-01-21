/**
 * 思想雷达自动化内容生成配置
 * Auto-Content Generation Rules
 * 
 * 强制执行规则：所有自动化流程必须遵循本配置
 */

module.exports = {
    // YouTube 视频筛选规则
    videoFilters: {
        // 最低时长（分钟）
        minDuration: 40,

        // 最大时长（分钟，可选）
        maxDuration: null,

        // 视频发布时间窗口（天）
        maxAgeInDays: 7
    },

    // 每日内容配额
    dailyQuota: {
        // 来自视频总结的最低条数
        minFromVideos: 1,

        // 来自视频总结的最高条数
        maxFromVideos: 2,

        // 每日总内容最低条数
        minTotal: 6,

        // 每日总内容最高条数
        maxTotal: 8
    },

    // =====================================================
    // 目标 YouTube 频道（按领域分类）
    // =====================================================
    targetChannels: [
        // === 技术与AI (T频段) ===
        { name: 'Lex Fridman Podcast', channelId: 'lexfridman', priority: 10, defaultDomain: 'tech', description: '深度技术访谈' },
        { name: 'Dwarkesh Podcast', channelId: 'dwarkeshpatel', priority: 9, defaultDomain: 'tech', description: 'AI前沿对话' },
        { name: 'a16z', channelId: 'a16z', priority: 8, defaultDomain: 'tech', description: '技术投资视角' },
        { name: 'ARK Invest', channelId: 'arkinvest', priority: 7, defaultDomain: 'tech', description: '技术趋势分析' },
        { name: 'Machine Learning Street Talk', channelId: 'mlst', priority: 8, defaultDomain: 'tech', description: 'AI学术讨论' },
        { name: 'Two Minute Papers', channelId: 'twominutepapers', priority: 6, defaultDomain: 'tech', description: '前沿论文解读' },
        { name: 'AI Explained', channelId: 'aiexplained', priority: 7, defaultDomain: 'tech', description: 'AI发展追踪' },
        { name: 'NVIDIA GTC', channelId: 'nvidia', priority: 7, defaultDomain: 'tech', description: '技术发布会' },
        { name: 'Stanford HAI', channelId: 'stanfordhai', priority: 9, defaultDomain: 'tech', description: '人类中心AI研究' },

        // === 政治与国际关系 (P频段) ===
        { name: 'Foreign Affairs', channelId: 'foreignaffairs', priority: 10, defaultDomain: 'politics', description: '国际关系权威' },
        { name: 'Council on Foreign Relations', channelId: 'cfr', priority: 9, defaultDomain: 'politics', description: '政策分析' },
        { name: 'Brookings Institution', channelId: 'brookings', priority: 8, defaultDomain: 'politics', description: '智库观点' },
        { name: 'CSIS', channelId: 'csis', priority: 9, defaultDomain: 'politics', description: '地缘政治' },
        { name: 'Hoover Institution', channelId: 'hoover', priority: 8, defaultDomain: 'politics', description: '保守派视角' },
        { name: 'Chatham House', channelId: 'chathamhouse', priority: 8, defaultDomain: 'politics', description: '英国视角国际事务' },
        { name: 'Carnegie Endowment', channelId: 'carnegie', priority: 8, defaultDomain: 'politics', description: '国际和平' },
        { name: 'The Aspen Institute', channelId: 'aspen', priority: 7, defaultDomain: 'politics', description: '领袖对话' },
        { name: 'Munich Security Conference', channelId: 'msc', priority: 8, defaultDomain: 'politics', description: '安全论坛' },
        { name: 'Palladium Magazine', channelId: 'palladium', priority: 7, defaultDomain: 'politics', description: '治理创新' },

        // === 哲学与思想 (Φ/H频段) ===
        { name: 'Institute for New Economic Thinking', channelId: 'inet', priority: 8, defaultDomain: 'philosophy', description: '经济思想' },
        { name: 'Long Now Foundation', channelId: 'longnow', priority: 8, defaultDomain: 'philosophy', description: '长期主义思考' },
        { name: 'Santa Fe Institute', channelId: 'santafe', priority: 8, defaultDomain: 'philosophy', description: '复杂系统' },
        { name: 'Interintellect', channelId: 'interintellect', priority: 7, defaultDomain: 'philosophy', description: '知识分子对话' },
        { name: 'How To Academy', channelId: 'howtoacademy', priority: 7, defaultDomain: 'philosophy', description: '思想家演讲' },
        { name: 'Intelligence Squared', channelId: 'iq2', priority: 8, defaultDomain: 'philosophy', description: '辩论与讨论' },
        { name: 'The RSA', channelId: 'rsa', priority: 7, defaultDomain: 'philosophy', description: '社会变革思想' },
        { name: 'Oxford Union', channelId: 'oxfordunion', priority: 8, defaultDomain: 'philosophy', description: '学术辩论' },
        { name: 'Making Sense with Sam Harris', channelId: 'samharrisorg', priority: 9, defaultDomain: 'philosophy', description: '哲学家思想对话' },
        { name: 'TED', channelId: 'ted', priority: 8, defaultDomain: 'philosophy', description: 'TED演讲精选' },
        { name: 'Joe Rogan Experience', channelId: 'joerogan', priority: 7, defaultDomain: 'philosophy', description: '长篇深度访谈' },

        // === 金融与经济 (F频段) ===
        { name: 'Bloomberg', channelId: 'bloomberg', priority: 9, defaultDomain: 'finance', description: '财经访谈' },
        { name: 'Real Vision', channelId: 'realvision', priority: 8, defaultDomain: 'finance', description: '深度金融分析' },
        { name: 'Bridgewater', channelId: 'bridgewater', priority: 9, defaultDomain: 'finance', description: 'Ray Dalio观点' },
        { name: 'The All-In Podcast', channelId: 'allin', priority: 8, defaultDomain: 'finance', description: '科技投资视角' },
        { name: 'Goldman Sachs', channelId: 'goldmansachs', priority: 7, defaultDomain: 'finance', description: '机构观点' },
        { name: 'BIS', channelId: 'bis', priority: 7, defaultDomain: 'finance', description: '央行视角' },
        { name: 'Milken Institute', channelId: 'milken', priority: 7, defaultDomain: 'finance', description: '经济论坛' },
        { name: 'Y Combinator', channelId: 'ycombinator', priority: 6, defaultDomain: 'finance', description: '创业与技术洞见' },

        // === 宗教与意义 (R频段) ===
        { name: 'The Veritas Forum', channelId: 'veritas', priority: 8, defaultDomain: 'religion', description: '信仰与理性' },
        { name: 'Templeton Foundation', channelId: 'templeton', priority: 7, defaultDomain: 'religion', description: '科学与宗教' },
        { name: 'Closer To Truth', channelId: 'closertotruth', priority: 8, defaultDomain: 'religion', description: '终极问题探讨' }
    ],

    // =====================================================
    // 目标访谈人/思想家（按领域分类）
    // =====================================================
    targetSpeakers: [
        // === 技术 (T) ===
        { name: 'Elon Musk', domain: 'tech', priority: 10, note: 'Tesla/SpaceX/xAI CEO，技术乐观主义代表' },
        { name: 'Demis Hassabis', domain: 'tech', priority: 10, note: 'Google DeepMind CEO，AGI路径思考' },
        { name: 'Sam Altman', domain: 'tech', priority: 10, note: 'OpenAI CEO，AI商业化方向' },
        { name: 'Ilya Sutskever', domain: 'tech', priority: 10, note: 'SSI创始人，AI安全与超级智能' },
        { name: 'Dario Amodei', domain: 'tech', priority: 9, note: 'Anthropic CEO，AI安全立场' },
        { name: 'Geoffrey Hinton', domain: 'tech', priority: 9, note: 'AI教父，AI风险警告者' },
        { name: 'Yann LeCun', domain: 'tech', priority: 9, note: 'Meta首席AI科学家，AI乐观派' },
        { name: 'Stuart Russell', domain: 'tech', priority: 8, note: 'UC Berkeley教授，AI安全学术代表' },
        { name: 'Fei-Fei Li', domain: 'tech', priority: 8, note: '斯坦福HAI主任，人类中心AI' },
        { name: 'Andrej Karpathy', domain: 'tech', priority: 9, note: '前OpenAI/特斯拉AI总监' },
        { name: 'Marc Andreessen', domain: 'tech', priority: 8, note: 'a16z创始人，技术加速主义' },
        { name: 'Peter Thiel', domain: 'tech', priority: 8, note: '投资人/哲学家，技术与政治交叉' },
        { name: 'Balaji Srinivasan', domain: 'tech', priority: 7, note: '前a16z合伙人，网络国家理论' },
        { name: 'Vitalik Buterin', domain: 'tech', priority: 7, note: '以太坊创始人，去中心化治理' },
        { name: 'Max Tegmark', domain: 'tech', priority: 8, note: 'MIT物理学家，AI安全研究者' },

        // === 政治与国际 (P) ===
        { name: 'Francis Fukuyama', domain: 'politics', priority: 9, note: '斯坦福教授，自由主义秩序' },
        { name: 'John Mearsheimer', domain: 'politics', priority: 9, note: '芝加哥大学教授，现实主义国际关系' },
        { name: 'Anne Applebaum', domain: 'politics', priority: 8, note: '记者/历史学家，威权主义研究' },
        { name: 'Fareed Zakaria', domain: 'politics', priority: 8, note: 'CNN主持人/作家，全球秩序分析' },
        { name: 'Ian Bremmer', domain: 'politics', priority: 8, note: 'Eurasia Group创始人，地缘政治风险' },
        { name: 'Graham Allison', domain: 'politics', priority: 8, note: '哈佛教授，修昔底德陷阱' },
        { name: 'Kishore Mahbubani', domain: 'politics', priority: 8, note: '新加坡学者，亚洲视角' },
        { name: 'Timothy Garton Ash', domain: 'politics', priority: 7, note: '牛津教授，欧洲自由主义' },
        { name: 'Yascha Mounk', domain: 'politics', priority: 8, note: '约翰霍普金斯教授，民主危机' },
        { name: 'Larry Diamond', domain: 'politics', priority: 7, note: '斯坦福教授，民主化研究' },
        { name: 'Daron Acemoglu', domain: 'politics', priority: 9, note: 'MIT经济学家，诺奖得主' },

        // === 哲学与思想 (Φ) ===
        { name: 'David Chalmers', domain: 'philosophy', priority: 9, note: '意识"困难问题"提出者' },
        { name: 'Nick Bostrom', domain: 'philosophy', priority: 8, note: '《超级智能》作者，牛津教授' },
        { name: '韩炳哲', domain: 'philosophy', priority: 9, note: '柏林艺术大学教授，数字时代批判' },
        { name: 'Slavoj Žižek', domain: 'philosophy', priority: 8, note: '哲学家，意识形态批判' },
        { name: 'Michael Sandel', domain: 'philosophy', priority: 9, note: '哈佛教授，公正与市场边界' },
        { name: 'Martha Nussbaum', domain: 'philosophy', priority: 8, note: '芝加哥大学教授，能力进路伦理学' },
        { name: 'Judith Butler', domain: 'philosophy', priority: 7, note: 'UC Berkeley教授，身份政治理论' },
        { name: 'Peter Singer', domain: 'philosophy', priority: 8, note: '普林斯顿教授，有效利他主义' },
        { name: 'Tyler Cowen', domain: 'philosophy', priority: 8, note: '乔治梅森教授，经济学与文化' },
        { name: 'Nassim Taleb', domain: 'philosophy', priority: 8, note: '作家/学者，风险与反脆弱' },
        { name: 'Daniel Kahneman', domain: 'philosophy', priority: 9, note: '诺贝尔奖得主，行为经济学' },
        { name: 'Jonathan Haidt', domain: 'philosophy', priority: 8, note: 'NYU教授，道德心理学' },
        { name: 'Jordan Peterson', domain: 'philosophy', priority: 7, note: '心理学家，文化评论员' },
        { name: '刘擎', domain: 'philosophy', priority: 9, note: '华东师大政治学教授' },
        { name: '刘瑜', domain: 'philosophy', priority: 9, note: '清华大学政治学教授' },
        { name: '周濂', domain: 'philosophy', priority: 9, note: '人民大学哲学教授' },
        { name: 'Brian Greene', domain: 'philosophy', priority: 8, note: '弦理论物理学家' },
        { name: 'Sean Carroll', domain: 'philosophy', priority: 8, note: '理论物理学家，科普作家' },

        // === 历史 (H) ===
        { name: 'Yuval Noah Harari', domain: 'history', priority: 9, note: '《人类简史》作者' },
        { name: 'Niall Ferguson', domain: 'history', priority: 8, note: '斯坦福/胡佛研究所，帝国与金融史' },
        { name: 'Peter Turchin', domain: 'history', priority: 8, note: '历史动力学创始人，社会崩溃预测' },
        { name: '秦晖', domain: 'history', priority: 9, note: '清华大学教授(荣休)，中国近现代史/转型问题' },
        { name: 'Timothy Snyder', domain: 'history', priority: 8, note: '耶鲁教授，极权主义历史' },
        { name: 'Margaret MacMillan', domain: 'history', priority: 7, note: '牛津教授，战争与和平' },
        { name: 'Adam Tooze', domain: 'history', priority: 8, note: '哥伦比亚教授，经济史/危机分析' },
        { name: 'Jared Diamond', domain: 'history', priority: 8, note: 'UCLA教授，文明兴衰' },

        // === 金融与经济 (F) ===
        { name: 'Ray Dalio', domain: 'finance', priority: 9, note: '桥水创始人，经济周期/原则' },
        { name: 'Howard Marks', domain: 'finance', priority: 8, note: '橡树资本创始人，市场周期' },
        { name: 'Rana Foroohar', domain: 'finance', priority: 7, note: 'FT副主编，金融化批判' },
        { name: 'Mohamed El-Erian', domain: 'finance', priority: 8, note: '安联首席顾问，宏观经济' },
        { name: 'Cathie Wood', domain: 'finance', priority: 7, note: 'ARK Invest创始人，颠覆式创新' },
        { name: 'Larry Fink', domain: 'finance', priority: 8, note: '贝莱德CEO，ESG与资本主义' },
        { name: 'Nouriel Roubini', domain: 'finance', priority: 8, note: 'NYU教授，危机预警' },
        { name: 'Mariana Mazzucato', domain: 'finance', priority: 8, note: 'UCL教授，国家与创新' },

        // === 宗教与意义 (R) ===
        { name: 'Meghan O\'Gieblyn', domain: 'religion', priority: 7, note: '作家，技术与宗教' },
        { name: 'Charles Taylor', domain: 'religion', priority: 8, note: '哲学家，世俗时代' },
        { name: 'John Gray', domain: 'religion', priority: 8, note: '哲学家，进步主义批判' },
        { name: 'David Bentley Hart', domain: 'religion', priority: 7, note: '神学家，宗教与理性' }
    ],

    // =====================================================
    // 议题关键词筛选（视频标题/描述必须包含至少一个）
    // =====================================================
    topicKeywords: {
        tech: ['AI', 'artificial intelligence', 'machine learning', 'AGI', 'robot', 'automation', 'technology', 'computing', 'quantum', 'neural network', 'GPT', 'LLM', 'deep learning', 'superintelligence', 'alignment'],
        politics: ['democracy', 'geopolitics', 'China', 'America', 'war', 'economy', 'government', 'policy', 'election', 'climate', 'Ukraine', 'Russia', 'NATO', 'authoritarianism', 'liberalism'],
        philosophy: ['consciousness', 'ethics', 'morality', 'free will', 'meaning', 'existence', 'truth', 'knowledge', 'mind', 'philosophy', 'justice', 'identity', 'rationality'],
        finance: ['economy', 'market', 'investment', 'crypto', 'bitcoin', 'money', 'banking', 'debt', 'inflation', 'recession', 'capitalism', 'inequality'],
        history: ['civilization', 'empire', 'history', 'war', 'revolution', 'culture', 'society', 'collapse', 'modernity'],
        religion: ['religion', 'faith', 'spiritual', 'god', 'belief', 'atheism', 'Buddhism', 'Christianity', 'Islam', 'secular', 'transcendence']
    },

    // 频段自动匹配规则
    frequencyMapping: {
        tech: ['T1', 'T2', 'T3'],
        politics: ['P1', 'P2', 'P3'],
        history: ['H1', 'H2', 'H3'],
        philosophy: ['Φ1', 'Φ2', 'Φ3'],
        religion: ['R1', 'R2'],
        finance: ['F1', 'F2']
    },

    // AI 分析配置
    aiAnalysis: {
        provider: 'claude',
        estimatedTokensPerAnalysis: 3000,
        dailyTokenBudget: 10000,
        autoPublish: true,
        requireReview: false
    },

    // 内容质量要求
    contentRequirements: {
        minContentLength: 500,
        recommendedContentLength: 800,
        keywordsCount: { min: 3, max: 5 }
    }
};
