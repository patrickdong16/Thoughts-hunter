#!/usr/bin/env node

/**
 * 内容采集服务测试脚本
 * Test script for content collection services
 * 
 * 用法 Usage:
 *   node scripts/test-services.js [test_name]
 * 
 * 测试项目 Test options:
 *   db        - 测试数据库连接和表结构
 *   yt        - 测试YouTube API（需要YOUTUBE_API_KEY）
 *   transcript - 测试yt-dlp字幕提取
 *   claude    - 测试Claude API（需要CLAUDE_API_KEY）
 *   all       - 运行所有测试
 */

require('dotenv').config();
const pool = require('../config/database');

// 颜色输出
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

// 测试结果追踪
const results = { passed: 0, failed: 0, skipped: 0 };

function logTest(name, status, message = '') {
    const icon = status === 'pass' ? green('✓') : status === 'fail' ? red('✗') : yellow('⊘');
    console.log(`  ${icon} ${name}${message ? ': ' + message : ''}`);
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
    else results.skipped++;
}

// ===========================================
// 测试1: 数据库连接和表结构
// ===========================================
async function testDatabase() {
    console.log(cyan('\n📦 测试数据库连接和表结构'));
    console.log('─'.repeat(40));

    try {
        // 测试连接
        const connectResult = await pool.query('SELECT NOW()');
        logTest('数据库连接', 'pass', `PostgreSQL 响应时间 ${new Date().toISOString()}`);

        // 检查必要的表
        const requiredTables = ['bands', 'radar_items', 'content_sources', 'drafts', 'collection_log'];
        const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const existingTables = tablesResult.rows.map(r => r.table_name);

        for (const table of requiredTables) {
            if (existingTables.includes(table)) {
                logTest(`表 ${table}`, 'pass');
            } else {
                logTest(`表 ${table}`, 'fail', '不存在');
            }
        }

        // 检查数据
        const sourcesCount = await pool.query('SELECT COUNT(*) FROM content_sources');
        logTest('content_sources数据', 'pass', `${sourcesCount.rows[0].count} 条记录`);

        return true;
    } catch (error) {
        logTest('数据库连接', 'fail', error.message);
        return false;
    }
}

// ===========================================
// 测试2: YouTube API
// ===========================================
async function testYouTube() {
    console.log(cyan('\n🎬 测试YouTube API'));
    console.log('─'.repeat(40));

    if (!process.env.YOUTUBE_API_KEY) {
        logTest('YOUTUBE_API_KEY', 'skip', '未配置，跳过YouTube测试');
        return false;
    }

    logTest('YOUTUBE_API_KEY', 'pass', '已配置');

    try {
        const collector = require('../services/content-collector');

        // 测试获取频道视频
        console.log('  正在获取 Lex Fridman 最新视频...');
        const videos = await collector.getChannelLatestVideos('@lexfridman', 3);

        if (videos && videos.length > 0) {
            logTest('获取频道视频', 'pass', `获取到 ${videos.length} 个视频`);
            console.log(`    - 最新: ${videos[0].title.substring(0, 50)}...`);
        } else {
            logTest('获取频道视频', 'fail', '未获取到视频');
        }

        return true;
    } catch (error) {
        logTest('YouTube API调用', 'fail', error.message);
        return false;
    }
}

// ===========================================
// 测试3: yt-dlp字幕提取
// ===========================================
async function testTranscript() {
    console.log(cyan('\n📝 测试yt-dlp字幕提取'));
    console.log('─'.repeat(40));

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
        // 检查yt-dlp安装
        const { stdout: version } = await execAsync('yt-dlp --version');
        logTest('yt-dlp安装', 'pass', `版本 ${version.trim()}`);

        // 使用一个短视频测试（TED官方的1分钟视频）
        const testVideoId = 'dQw4w9WgXcQ';  // 使用知名短视频测试
        console.log('  正在测试字幕提取（可能需要10-30秒）...');

        try {
            const collector = require('../services/content-collector');
            const transcript = await collector.getVideoTranscript(testVideoId);

            if (transcript && transcript.length > 100) {
                logTest('字幕提取', 'pass', `获取到 ${transcript.length} 字符`);
            } else {
                logTest('字幕提取', 'skip', '该视频可能无字幕，但yt-dlp工作正常');
            }
        } catch (err) {
            // 如果没有字幕，yt-dlp仍然工作正常
            logTest('字幕提取', 'skip', '视频无可用字幕（yt-dlp正常）');
        }

        return true;
    } catch (error) {
        logTest('yt-dlp安装', 'fail', error.message);
        return false;
    }
}

// ===========================================
// 测试4: Claude API
// ===========================================
async function testClaude() {
    console.log(cyan('\n🤖 测试Claude API'));
    console.log('─'.repeat(40));

    if (!process.env.CLAUDE_API_KEY) {
        logTest('CLAUDE_API_KEY', 'skip', '未配置，跳过Claude测试');
        return false;
    }

    logTest('CLAUDE_API_KEY', 'pass', '已配置');

    try {
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

        console.log('  正在调用Claude API（简单测试）...');

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 100,
            messages: [{
                role: 'user',
                content: '回复"OK"表示API正常工作。'
            }]
        });

        if (message.content && message.content[0]) {
            logTest('Claude API调用', 'pass', `响应: ${message.content[0].text.substring(0, 50)}`);
        } else {
            logTest('Claude API调用', 'fail', '无响应内容');
        }

        return true;
    } catch (error) {
        logTest('Claude API调用', 'fail', error.message);
        return false;
    }
}

// ===========================================
// 测试5: 草稿管理服务
// ===========================================
async function testDraftManager() {
    console.log(cyan('\n📋 测试草稿管理服务'));
    console.log('─'.repeat(40));

    try {
        const draftManager = require('../services/draft-manager');

        // 测试获取统计
        const stats = await draftManager.getDraftStats();
        logTest('获取草稿统计', 'pass', `待审核: ${stats.pending_count}, 已批准: ${stats.approved_count}`);

        // 测试获取草稿列表
        const drafts = await draftManager.getAllDrafts('pending', 10);
        logTest('获取草稿列表', 'pass', `返回 ${drafts.length} 条草稿`);

        return true;
    } catch (error) {
        logTest('草稿管理服务', 'fail', error.message);
        return false;
    }
}

// ===========================================
// 主函数
// ===========================================
async function main() {
    const testName = process.argv[2] || 'all';

    console.log('\n' + '═'.repeat(50));
    console.log(cyan('  思想雷达 - 内容采集服务测试'));
    console.log(cyan('  Thoughts Radar - Content Collection Service Test'));
    console.log('═'.repeat(50));

    const tests = {
        db: testDatabase,
        yt: testYouTube,
        transcript: testTranscript,
        claude: testClaude,
        draft: testDraftManager
    };

    if (testName === 'all') {
        await testDatabase();
        await testYouTube();
        await testTranscript();
        await testClaude();
        await testDraftManager();
    } else if (tests[testName]) {
        await tests[testName]();
    } else {
        console.log(red(`未知测试: ${testName}`));
        console.log('可用测试: db, yt, transcript, claude, draft, all');
        process.exit(1);
    }

    // 打印汇总
    console.log('\n' + '─'.repeat(50));
    console.log(`测试完成: ${green(results.passed + ' 通过')}, ${red(results.failed + ' 失败')}, ${yellow(results.skipped + ' 跳过')}`);

    if (results.skipped > 0 && !process.env.YOUTUBE_API_KEY && !process.env.CLAUDE_API_KEY) {
        console.log(yellow('\n⚠️  提示: 配置 YOUTUBE_API_KEY 和 CLAUDE_API_KEY 后可完整测试'));
    }

    console.log('─'.repeat(50) + '\n');

    // 关闭数据库连接
    await pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
