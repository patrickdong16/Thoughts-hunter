-- 内容源初始数据
-- Content Sources Seed Data
-- 包含精选的YouTube频道、关键人物和出版机构

-- ===========================================
-- YouTube 频道 (Channels)
-- ===========================================

-- 技术与AI (T频段) - Technology & AI
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('channel', 'Lex Fridman Podcast', 'https://www.youtube.com/@lexfridman', 'T', 'AI研究者主持的深度技术访谈，访问顶级科学家和思想家', 10, 'active'),
('channel', 'Dwarkesh Podcast', 'https://www.youtube.com/@DwarkeshPatel', 'T', 'AI前沿对话，聚焦AGI发展路径和影响', 15, 'active'),
('channel', 'a16z', 'https://www.youtube.com/@a16z', 'T', 'Andreessen Horowitz科技投资视角，技术趋势分析', 20, 'active'),
('channel', 'ARK Invest', 'https://www.youtube.com/@ARKInvest', 'T', '颠覆式创新技术研究和投资分析', 25, 'active'),
('channel', 'Machine Learning Street Talk', 'https://www.youtube.com/@MachineLearningStreetTalk', 'T', 'AI学术讨论，深入技术细节', 30, 'active'),
('channel', 'Two Minute Papers', 'https://www.youtube.com/@TwoMinutePapers', 'T', '前沿AI/计算机论文解读', 35, 'active'),
('channel', 'AI Explained', 'https://www.youtube.com/@aiexplained-official', 'T', 'AI发展动态追踪和深度分析', 40, 'active'),
('channel', 'NVIDIA GTC', 'https://www.youtube.com/@NVIDIAGTC', 'T', 'NVIDIA技术大会，GPU和AI最新进展', 45, 'active'),
('channel', 'Stanford HAI', 'https://www.youtube.com/@StanfordHAI', 'T', '斯坦福人类中心AI研究，关注AI伦理和社会影响', 50, 'active');

-- 政治与国际关系 (P频段) - Politics & International Relations
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('channel', 'Foreign Affairs', 'https://www.youtube.com/@ForeignAffairs', 'P', '国际关系权威期刊，全球政策深度分析', 10, 'active'),
('channel', 'Council on Foreign Relations', 'https://www.youtube.com/@cfr', 'P', 'CFR智库，美国外交政策和国际事务', 15, 'active'),
('channel', 'Brookings Institution', 'https://www.youtube.com/@BrookingsInstitution', 'P', '布鲁金斯学会，公共政策研究', 20, 'active'),
('channel', 'CSIS', 'https://www.youtube.com/@CSISMedia', 'P', '战略与国际研究中心，地缘政治分析', 25, 'active'),
('channel', 'Hoover Institution', 'https://www.youtube.com/@HooverInstitution', 'P', '胡佛研究所，保守派政策视角', 30, 'active'),
('channel', 'Chatham House', 'https://www.youtube.com/@ChathamHouse', 'P', '英国查塔姆研究所，国际事务分析', 35, 'active'),
('channel', 'Carnegie Endowment', 'https://www.youtube.com/@CarnegieEndowment', 'P', '卡内基国际和平基金会', 40, 'active'),
('channel', 'The Aspen Institute', 'https://www.youtube.com/@TheAspenInstitute', 'P', '阿斯彭研究所，领袖对话和全球议题', 45, 'active'),
('channel', 'Munich Security Conference', 'https://www.youtube.com/@MunichSecurityConference', 'P', '慕尼黑安全会议，国际安全论坛', 50, 'active');

-- 哲学与思想 (Φ/H频段) - Philosophy & Thought
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('channel', 'Institute for New Economic Thinking', 'https://www.youtube.com/@INETeconomics', 'Φ', '新经济思想研究所，经济理论创新', 10, 'active'),
('channel', 'Long Now Foundation', 'https://www.youtube.com/@longnow', 'Φ', '长期基金会，长期主义思考和未来研究', 15, 'active'),
('channel', 'Santa Fe Institute', 'https://www.youtube.com/@SantaFeInstitute', 'Φ', '圣塔菲研究所，复杂系统科学', 20, 'active'),
('channel', 'Interintellect', 'https://www.youtube.com/@interintellect_ii', 'Φ', '知识分子沙龙，跨学科对话', 25, 'active'),
('channel', 'How To Academy', 'https://www.youtube.com/@HowToAcademy', 'Φ', '思想家演讲和深度访谈', 30, 'active'),
('channel', 'Intelligence Squared', 'https://www.youtube.com/@intelligencesquared', 'Φ', '高质量辩论和讨论节目', 35, 'active'),
('channel', 'The RSA', 'https://www.youtube.com/@theRSAorg', 'Φ', '皇家艺术学会，社会变革思想', 40, 'active'),
('channel', 'Oxford Union', 'https://www.youtube.com/@OxfordUnion', 'H', '牛津学生会，学术辩论', 45, 'active');

-- 金融与经济 (F频段) - Finance & Economics
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('channel', 'Bloomberg Television', 'https://www.youtube.com/@markets', 'F', '彭博财经，市场分析和商业访谈', 10, 'active'),
('channel', 'Real Vision', 'https://www.youtube.com/@RealVision', 'F', '深度金融分析，宏观经济研究', 15, 'active'),
('channel', 'The All-In Podcast', 'https://www.youtube.com/@allin', 'F', '科技投资人视角的经济和商业讨论', 20, 'active'),
('channel', 'Goldman Sachs', 'https://www.youtube.com/@goldmansachs', 'F', '高盛机构观点，全球市场分析', 25, 'active'),
('channel', 'BIS', 'https://www.youtube.com/@BISBankforInternationalSettlements', 'F', '国际清算银行，央行视角的货币政策', 30, 'active'),
('channel', 'Milken Institute', 'https://www.youtube.com/@MilkenInstitute', 'F', '米尔肯研究所，经济和金融论坛', 35, 'active'),
('channel', 'Bridgewater Associates', 'https://www.youtube.com/@principlesbyraydalio', 'F', 'Ray Dalio和桥水基金的经济原则', 40, 'active');

-- 宗教与意义 (R频段) - Religion & Meaning
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('channel', 'The Veritas Forum', 'https://www.youtube.com/@veritasforum', 'R', '信仰与理性对话，大学校园讨论', 10, 'active'),
('channel', 'Templeton Foundation', 'https://www.youtube.com/@JohnTempletonFoundation', 'R', '坦普尔顿基金会，科学与宗教对话', 15, 'active'),
('channel', 'Closer To Truth', 'https://www.youtube.com/@CloserToTruthTV', 'R', '终极问题探讨，意识、宇宙、意义', 20, 'active');

-- ===========================================
-- 关键人物 (People)
-- ===========================================

-- 技术领袖 (T频段)
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('person', 'Elon Musk', 'https://twitter.com/elonmusk', 'T', 'Tesla/SpaceX/xAI CEO，技术乐观主义代表', 5, 'active'),
('person', 'Sam Altman', 'https://twitter.com/sama', 'T', 'OpenAI CEO，AI商业化和AGI路径', 10, 'active'),
('person', 'Demis Hassabis', 'https://en.wikipedia.org/wiki/Demis_Hassabis', 'T', 'Google DeepMind CEO，AGI研究领袖', 15, 'active'),
('person', 'Ilya Sutskever', 'https://en.wikipedia.org/wiki/Ilya_Sutskever', 'T', 'SSI创始人，前OpenAI首席科学家，AI安全', 20, 'active'),
('person', 'Dario Amodei', 'https://twitter.com/DarioAmodei', 'T', 'Anthropic CEO，AI安全和对齐', 25, 'active'),
('person', 'Geoffrey Hinton', 'https://en.wikipedia.org/wiki/Geoffrey_Hinton', 'T', 'AI教父，深度学习先驱，AI风险警告者', 30, 'active'),
('person', 'Yann LeCun', 'https://twitter.com/ylecun', 'T', 'Meta首席AI科学家，AI乐观派', 35, 'active'),
('person', 'Stuart Russell', 'https://people.eecs.berkeley.edu/~russell/', 'T', 'UC Berkeley教授，AI安全学术代表', 40, 'active'),
('person', 'Fei-Fei Li', 'https://profiles.stanford.edu/fei-fei-li', 'T', '斯坦福HAI主任，人类中心AI', 45, 'active'),
('person', 'Marc Andreessen', 'https://twitter.com/pmarca', 'T', 'a16z创始人，技术加速主义', 50, 'active'),
('person', 'Peter Thiel', 'https://en.wikipedia.org/wiki/Peter_Thiel', 'T', '投资人哲学家，技术与政治交叉', 55, 'active'),
('person', 'Balaji Srinivasan', 'https://twitter.com/balajis', 'T', '前a16z合伙人，网络国家理论', 60, 'active'),
('person', 'Vitalik Buterin', 'https://twitter.com/VitalikButerin', 'T', '以太坊创始人，去中心化治理', 65, 'active');

-- 政治与国际关系 (P频段)
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('person', 'Francis Fukuyama', 'https://en.wikipedia.org/wiki/Francis_Fukuyama', 'P', '斯坦福教授，《历史的终结》作者，自由主义秩序', 10, 'active'),
('person', 'John Mearsheimer', 'https://en.wikipedia.org/wiki/John_Mearsheimer', 'P', '芝加哥大学教授，现实主义国际关系理论', 15, 'active'),
('person', 'Anne Applebaum', 'https://en.wikipedia.org/wiki/Anne_Applebaum', 'P', '记者历史学家，威权主义研究', 20, 'active'),
('person', 'Fareed Zakaria', 'https://en.wikipedia.org/wiki/Fareed_Zakaria', 'P', 'CNN主持人作家，全球秩序分析', 25, 'active'),
('person', 'Ian Bremmer', 'https://twitter.com/ianbremmer', 'P', 'Eurasia Group创始人，地缘政治风险', 30, 'active'),
('person', 'Graham Allison', 'https://www.hks.harvard.edu/faculty/graham-allison', 'P', '哈佛教授，修昔底德陷阱理论', 35, 'active'),
('person', 'Kishore Mahbubani', 'https://en.wikipedia.org/wiki/Kishore_Mahbubani', 'P', '新加坡学者外交官，亚洲中心视角', 40, 'active'),
('person', 'Timothy Garton Ash', 'https://en.wikipedia.org/wiki/Timothy_Garton_Ash', 'P', '牛津教授，欧洲自由主义研究', 45, 'active'),
('person', 'Yascha Mounk', 'https://www.persuasion.community/', 'P', '约翰霍普金斯教授，民主危机研究', 50, 'active'),
('person', 'Larry Diamond', 'https://en.wikipedia.org/wiki/Larry_Diamond', 'P', '斯坦福教授，民主化和民主衰退', 55, 'active');

-- 哲学与思想 (Φ频段)
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('person', '韩炳哲', 'https://en.wikipedia.org/wiki/Byung-Chul_Han', 'Φ', '柏林艺术大学教授，数字时代批判哲学家', 5, 'active'),
('person', 'Slavoj Žižek', 'https://en.wikipedia.org/wiki/Slavoj_%C5%BDi%C5%BEek', 'Φ', '斯洛文尼亚哲学家，意识形态批判', 10, 'active'),
('person', 'Michael Sandel', 'https://en.wikipedia.org/wiki/Michael_Sandel', 'Φ', '哈佛教授，《公正》作者，市场边界讨论', 15, 'active'),
('person', 'Martha Nussbaum', 'https://en.wikipedia.org/wiki/Martha_Nussbaum', 'Φ', '芝加哥大学教授，能力进路伦理学', 20, 'active'),
('person', 'Judith Butler', 'https://en.wikipedia.org/wiki/Judith_Butler', 'Φ', 'UC Berkeley教授，性别理论和身份政治', 25, 'active'),
('person', 'Peter Singer', 'https://en.wikipedia.org/wiki/Peter_Singer', 'Φ', '普林斯顿教授，有效利他主义创始人', 30, 'active'),
('person', 'Tyler Cowen', 'https://marginalrevolution.com/', 'Φ', '乔治梅森教授，经济学与文化交叉', 35, 'active'),
('person', 'Nassim Taleb', 'https://twitter.com/nntaleb', 'Φ', '《黑天鹅》《反脆弱》作者，风险理论', 40, 'active'),
('person', 'Daniel Kahneman', 'https://en.wikipedia.org/wiki/Daniel_Kahneman', 'Φ', '诺贝尔奖得主，行为经济学创始人', 45, 'active'),
('person', 'Jonathan Haidt', 'https://jonathanhaidt.com/', 'Φ', 'NYU教授，道德心理学，社交媒体批判', 50, 'active');

-- 历史 (H频段)
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('person', 'Niall Ferguson', 'https://en.wikipedia.org/wiki/Niall_Ferguson', 'H', '斯坦福/胡佛研究所，帝国与金融史', 10, 'active'),
('person', 'Peter Turchin', 'https://en.wikipedia.org/wiki/Peter_Turchin', 'H', '历史动力学创始人，社会崩溃预测', 15, 'active'),
('person', '秦晖', 'https://zh.wikipedia.org/wiki/%E7%A7%A6%E6%99%96', 'H', '清华大学教授(荣休)，中国近现代史和转型问题', 20, 'active'),
('person', 'Timothy Snyder', 'https://en.wikipedia.org/wiki/Timothy_D._Snyder', 'H', '耶鲁教授，极权主义历史研究', 25, 'active'),
('person', 'Margaret MacMillan', 'https://en.wikipedia.org/wiki/Margaret_MacMillan', 'H', '牛津教授，战争与和平历史', 30, 'active'),
('person', 'Adam Tooze', 'https://en.wikipedia.org/wiki/Adam_Tooze', 'H', '哥伦比亚教授，经济史和危机分析', 35, 'active'),
('person', 'Jared Diamond', 'https://en.wikipedia.org/wiki/Jared_Diamond', 'H', 'UCLA教授，《枪炮病菌与钢铁》作者，文明兴衰', 40, 'active');

-- 金融与经济 (F频段)
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('person', 'Ray Dalio', 'https://www.principles.com/', 'F', '桥水基金创始人，经济周期和原则', 5, 'active'),
('person', 'Howard Marks', 'https://www.oaktreecapital.com/insights/howard-marks-memos', 'F', '橡树资本创始人，市场周期智慧', 10, 'active'),
('person', 'Rana Foroohar', 'https://www.ft.com/rana-foroohar', 'F', 'FT副主编，金融化批判', 15, 'active'),
('person', 'Mohamed El-Erian', 'https://en.wikipedia.org/wiki/Mohamed_A._El-Erian', 'F', '安联首席经济顾问，宏观经济分析', 20, 'active'),
('person', 'Cathie Wood', 'https://twitter.com/CathieDWood', 'F', 'ARK Invest创始人，颠覆式创新投资', 25, 'active'),
('person', 'Larry Fink', 'https://en.wikipedia.org/wiki/Larry_Fink', 'F', '贝莱德CEO，ESG和利益相关者资本主义', 30, 'active'),
('person', 'Nouriel Roubini', 'https://twitter.com/Nouriel', 'F', 'NYU教授，危机预警专家', 35, 'active'),
('person', 'Mariana Mazzucato', 'https://marianamazzucato.com/', 'F', 'UCL教授，《企业家型国家》作者', 40, 'active');

-- 宗教与意义 (R频段)
INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('person', 'Meghan O''Gieblyn', 'https://en.wikipedia.org/wiki/Meghan_O%27Gieblyn', 'R', '作家，技术与宗教交叉思考', 10, 'active'),
('person', 'Charles Taylor', 'https://en.wikipedia.org/wiki/Charles_Taylor_(philosopher)', 'R', '哲学家，《世俗时代》作者', 15, 'active'),
('person', 'John Gray', 'https://en.wikipedia.org/wiki/John_Gray_(philosopher)', 'R', '哲学家，进步主义批判者', 20, 'active'),
('person', 'David Bentley Hart', 'https://en.wikipedia.org/wiki/David_Bentley_Hart', 'R', '神学家哲学家，宗教与理性对话', 25, 'active');

-- ===========================================
-- 机构与出版物 (Publications)
-- ===========================================

INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status) VALUES
('publication', 'Foreign Affairs', 'https://www.foreignaffairs.com/', 'P', '国际关系权威期刊', 5, 'active'),
('publication', 'The Economist', 'https://www.economist.com/', 'P', '全球视角新闻周刊', 10, 'active'),
('publication', 'Financial Times', 'https://www.ft.com/', 'F', '全球财经深度报道', 15, 'active'),
('publication', 'The Atlantic', 'https://www.theatlantic.com/', 'Φ', '长篇思想和文化杂志', 20, 'active'),
('publication', 'The New Yorker', 'https://www.newyorker.com/', 'Φ', '深度报道和文化评论', 25, 'active'),
('publication', 'MIT Technology Review', 'https://www.technologyreview.com/', 'T', '技术前沿和影响分析', 30, 'active'),
('publication', 'RAND Corporation', 'https://www.rand.org/', 'P', '政策研究智库', 35, 'active'),
('publication', 'Nikkei Asia', 'https://asia.nikkei.com/', 'P', '亚洲视角商业和政治', 40, 'active');
