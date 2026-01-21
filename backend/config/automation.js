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

    // 目标 YouTube 频道（优先级从高到低）
    targetChannels: [
        {
            name: 'Lex Fridman Podcast',
            channelId: 'lexfridman',
            priority: 10,
            defaultDomain: 'tech',
            description: 'AI研究者主持的深度技术访谈'
        },
        {
            name: 'Making Sense with Sam Harris',
            channelId: 'samharrisorg',
            priority: 9,
            defaultDomain: 'philosophy',
            description: '哲学家Sam Harris的思想对话'
        },
        {
            name: 'Joe Rogan Experience',
            channelId: 'joerogan',
            priority: 7,
            defaultDomain: 'politics',
            description: '长篇深度访谈，涵盖多领域'
        },
        {
            name: 'TED',
            channelId: 'ted',
            priority: 8,
            defaultDomain: 'tech',
            description: 'TED演讲精选'
        },
        {
            name: 'Y Combinator',
            channelId: 'ycombinator',
            priority: 6,
            defaultDomain: 'tech',
            description: '创业与技术洞见'
        }
    ],

    // 目标访谈人/思想家（优先分析含有这些人的视频）
    targetSpeakers: [
        // 技术领域
        { name: 'Andrej Karpathy', domain: 'tech', priority: 10 },
        { name: 'Demis Hassabis', domain: 'tech', priority: 10 },
        { name: 'Ilya Sutskever', domain: 'tech', priority: 10 },
        { name: 'Yann LeCun', domain: 'tech', priority: 9 },
        { name: 'Geoffrey Hinton', domain: 'tech', priority: 9 },
        { name: 'Elon Musk', domain: 'tech', priority: 8 },

        // 经济/政治领域
        { name: 'Ray Dalio', domain: 'finance', priority: 9 },
        { name: 'Daron Acemoglu', domain: 'politics', priority: 9 },
        { name: 'Niall Ferguson', domain: 'history', priority: 8 },
        { name: 'Graham Allison', domain: 'politics', priority: 8 },

        // 哲学/思想领域
        { name: 'David Chalmers', domain: 'philosophy', priority: 9 },
        { name: 'Nick Bostrom', domain: 'philosophy', priority: 8 },
        { name: 'Yuval Noah Harari', domain: 'history', priority: 9 },
        { name: 'Jordan Peterson', domain: 'philosophy', priority: 7 },

        // 科学领域
        { name: 'Brian Greene', domain: 'philosophy', priority: 8 },
        { name: 'Sean Carroll', domain: 'philosophy', priority: 8 },
        { name: 'Max Tegmark', domain: 'tech', priority: 8 }
    ],

    // 议题关键词筛选（视频标题/描述必须包含至少一个）
    topicKeywords: {
        tech: ['AI', 'artificial intelligence', 'machine learning', 'AGI', 'robot', 'automation', 'technology', 'computing', 'quantum', 'neural network'],
        politics: ['democracy', 'geopolitics', 'China', 'America', 'war', 'economy', 'government', 'policy', 'election', 'climate'],
        philosophy: ['consciousness', 'ethics', 'morality', 'free will', 'meaning', 'existence', 'truth', 'knowledge', 'mind'],
        finance: ['economy', 'market', 'investment', 'crypto', 'bitcoin', 'money', 'banking', 'debt', 'inflation'],
        history: ['civilization', 'empire', 'history', 'war', 'revolution', 'culture', 'society'],
        religion: ['religion', 'faith', 'spiritual', 'god', 'belief', 'atheism', 'Buddhism', 'Christianity', 'Islam']
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
        // 使用 Claude API
        provider: 'claude',

        // 每次分析消耗的预估 token
        estimatedTokensPerAnalysis: 3000,

        // 每日 token 预算上限
        dailyTokenBudget: 10000,

        // 是否自动发布（true = 直接发布，false = 进入草稿审核）
        autoPublish: true,

        // 发布前的人工审核（true = 需要审核，false = 自动发布）
        requireReview: false
    },

    // 内容质量要求（强制执行）
    contentRequirements: {
        // 正文最低字符数
        minContentLength: 500,

        // 正文推荐字符数
        recommendedContentLength: 800,

        // 关键词数量
        keywordsCount: { min: 3, max: 5 }
    }
};
