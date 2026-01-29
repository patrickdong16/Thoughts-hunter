/**
 * 内容质量验证服务
 * Content Validator Service
 * 
 * 在发布前验证内容是否符合 AHR 规则和日期规则
 */

const { getRulesForDate } = require('../config/day-rules');

// 验证规则定义
const VALIDATION_RULES = {
    // 真实性验证 (严重性: 阻断)
    authenticity: {
        severity: 'BLOCK',
        checks: [
            {
                name: 'no_metadata_inference',
                description: '禁止元数据推断内容',
                patterns: [
                    /基于.*推断/i,
                    /基于元数据/i,
                    /根据.*元数据/i,
                    /从.*元数据/i
                ],
                fields: ['author_name', 'author_bio', 'content']
            }
        ]
    },

    // 内容结构验证 (严重性: 阻断)
    structure: {
        severity: 'BLOCK',
        checks: [
            {
                name: 'content_length',
                description: '内容长度检查',
                validate: (item, context) => {
                    const minLength = context.isGeneration ? 700 : 300;
                    const length = item.content?.length || 0;
                    return {
                        passed: length >= minLength,
                        message: `内容长度 ${length} 字符 ${length >= minLength ? '✓' : `< ${minLength} 要求`}`
                    };
                }
            },
            {
                name: 'required_fields',
                description: '必填字段检查',
                validate: (item) => {
                    const required = ['freq', 'stance', 'title', 'author_name', 'content'];
                    const missing = required.filter(f => !item[f]);
                    return {
                        passed: missing.length === 0,
                        message: missing.length === 0 ? '所有必填字段完整' : `缺少字段: ${missing.join(', ')}`
                    };
                }
            },
            {
                name: 'valid_freq',
                description: '有效频段检查',
                validate: (item) => {
                    const validFreqs = ['T1', 'T2', 'T3', 'P1', 'P2', 'Φ1', 'Φ3', 'H1', 'H2', 'R2', 'F2'];
                    const passed = validFreqs.includes(item.freq);
                    return {
                        passed,
                        message: passed ? `频段 ${item.freq} 有效` : `无效频段: ${item.freq}`
                    };
                }
            },
            {
                name: 'valid_stance',
                description: '有效立场检查',
                validate: (item) => {
                    // 支持新旧两种格式: yes/no 和 A/B
                    const passed = ['A', 'B', 'yes', 'no'].includes(item.stance);
                    return {
                        passed,
                        message: passed ? `立场 ${item.stance} 有效` : `无效立场: ${item.stance}`
                    };
                }
            }
        ]
    },

    // 作者验证 (严重性: 阻断)
    author: {
        severity: 'BLOCK',
        checks: [
            {
                name: 'author_name_format',
                description: '作者姓名格式检查',
                validate: (item) => {
                    const name = item.author_name || '';
                    // 检查是否是真实姓名（至少2个字符，不含特殊标记）
                    const isValid = name.length >= 2 &&
                        !/^基于/.test(name) &&
                        !/推断$/.test(name) &&
                        !/[<>{}]/.test(name);
                    return {
                        passed: isValid,
                        message: isValid ? '作者姓名格式正确' : `作者姓名无效: "${name}"`
                    };
                }
            }
        ]
    },

    // 来源验证 (严重性: 警告)
    source: {
        severity: 'WARN',
        checks: [
            {
                name: 'source_present',
                description: '来源信息存在',
                validate: (item) => {
                    const passed = item.source && item.source.length > 10;
                    return {
                        passed,
                        message: passed ? '来源信息存在' : '来源信息缺失或过短'
                    };
                }
            }
        ]
    }
};

/**
 * 验证单个内容项
 * @param {Object} item - 内容项
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果
 */
const validateItem = (item, options = {}) => {
    const { isGeneration = false, date = null } = options;
    const context = { isGeneration, date };

    const results = {
        passed: true,
        blocked: false,
        warnings: [],
        errors: [],
        details: []
    };

    // 遍历所有规则类别
    for (const [category, rule] of Object.entries(VALIDATION_RULES)) {
        for (const check of rule.checks) {
            let checkResult;

            if (check.patterns) {
                // 模式匹配检查
                checkResult = validatePatterns(item, check);
            } else if (check.validate) {
                // 函数验证检查
                checkResult = check.validate(item, context);
            }

            const detail = {
                category,
                check: check.name,
                description: check.description,
                passed: checkResult.passed,
                message: checkResult.message,
                severity: rule.severity
            };

            results.details.push(detail);

            if (!checkResult.passed) {
                if (rule.severity === 'BLOCK') {
                    results.blocked = true;
                    results.passed = false;
                    results.errors.push(detail);
                } else {
                    results.warnings.push(detail);
                }
            }
        }
    }

    return results;
};

/**
 * 验证模式匹配
 */
const validatePatterns = (item, check) => {
    const violations = [];

    for (const field of check.fields) {
        const value = item[field];
        if (!value) continue;

        for (const pattern of check.patterns) {
            if (pattern.test(value)) {
                violations.push({ field, pattern: pattern.toString() });
            }
        }
    }

    return {
        passed: violations.length === 0,
        message: violations.length === 0
            ? '未发现违规模式'
            : `发现 ${violations.length} 处违规: ${violations.map(v => v.field).join(', ')}`
    };
};

/**
 * 批量验证内容
 * @param {Array} items - 内容项数组
 * @param {Object} options - 验证选项
 * @returns {Object} 批量验证结果
 */
const validateBatch = (items, options = {}) => {
    const results = {
        total: items.length,
        passed: 0,
        blocked: 0,
        warned: 0,
        items: []
    };

    for (const item of items) {
        const itemResult = validateItem(item, options);
        itemResult.itemId = item.id;
        itemResult.freq = item.freq;
        itemResult.title = item.title?.substring(0, 30);

        results.items.push(itemResult);

        if (itemResult.passed && itemResult.warnings.length === 0) {
            results.passed++;
        } else if (itemResult.blocked) {
            results.blocked++;
        } else {
            results.warned++;
        }
    }

    return results;
};

/**
 * 验证是否符合日期规则 (v2.0)
 * @param {Object} item - 内容项
 * @param {string} date - 日期
 * @returns {Object} 验证结果
 */
const validateDayRules = (item, date) => {
    const dayRules = getRulesForDate(date);
    const results = {
        passed: true,
        isThemeDay: dayRules.isThemeDay,
        event: dayRules.event,
        errors: [],
        warnings: []
    };

    // 内容长度检查
    const minLength = dayRules.rules?.minContentLength || 300;
    if (item.content && item.content.length < minLength) {
        results.passed = false;
        results.errors.push(`内容长度 ${item.content.length} < ${minLength}`);
    }

    // 主题日特殊检查
    if (dayRules.isThemeDay) {
        // 主题日允许更宽松的规则
        // 但仍需确保真实性
    }

    return results;
};

/**
 * v2.0 配额验证 - 验证当日内容是否符合配额规则
 * @param {Array} items - 当日所有内容项
 * @param {string} date - 日期
 * @returns {Object} 配额验证结果
 */
const validateQuota = (items, date) => {
    const dayRules = getRulesForDate(date);
    const rules = dayRules.rules || {};

    const results = {
        passed: true,
        isThemeDay: dayRules.isThemeDay,
        event: dayRules.event,
        errors: [],
        warnings: [],
        stats: {}
    };

    // 统计视频和非视频内容
    const videoItems = items.filter(item =>
        item.source_url && (
            item.source_url.includes('youtube.com') ||
            item.source_url.includes('youtu.be')
        )
    );
    const nonVideoItems = items.filter(item =>
        !item.source_url || !(
            item.source_url.includes('youtube.com') ||
            item.source_url.includes('youtu.be')
        )
    );

    // 统计频段覆盖
    const usedFreqs = new Set(items.map(r => r.freq));
    const coreFreqs = ['T1', 'P1', 'H1', 'Φ1', 'F1', 'R1'];
    const missingCoreFreqs = coreFreqs.filter(f => !usedFreqs.has(f));

    // 配额参数
    const minNonVideo = rules.minNonVideoItems ?? 5;
    const maxNonVideo = rules.maxNonVideoItems ?? 7;
    const minVideo = rules.minVideoItems ?? 1;
    const contentTypeFlex = rules.contentTypeFlex ?? false;
    const frequencyFlex = rules.frequencyFlex ?? false;

    results.stats = {
        nonVideo: { count: nonVideoItems.length, min: minNonVideo, max: maxNonVideo },
        video: { count: videoItems.length, min: minVideo },
        frequency: { used: [...usedFreqs], missing: missingCoreFreqs }
    };

    // 非视频配额检查 (非主题日强制)
    if (!contentTypeFlex) {
        if (nonVideoItems.length < minNonVideo) {
            results.passed = false;
            results.errors.push(`非视频内容不足: ${nonVideoItems.length}/${minNonVideo}`);
        }
        if (nonVideoItems.length > maxNonVideo) {
            results.warnings.push(`非视频内容超额: ${nonVideoItems.length}/${maxNonVideo}`);
        }
    }

    // 视频配额检查 (非主题日强制)
    if (!contentTypeFlex && videoItems.length < minVideo) {
        results.passed = false;
        results.errors.push(`视频内容不足: ${videoItems.length}/${minVideo}`);
    }

    // 频段覆盖检查 (非主题日强制)
    if (!frequencyFlex && missingCoreFreqs.length > 0) {
        results.passed = false;
        results.errors.push(`核心频段未覆盖: ${missingCoreFreqs.join(', ')}`);
    }

    // 主题日灵活性提示
    if (dayRules.isThemeDay) {
        results.warnings.push(`主题日模式: 配额规则已放宽`);
    }

    return results;
};

module.exports = {
    validateItem,
    validateBatch,
    validateDayRules,
    validateQuota,
    VALIDATION_RULES
};
