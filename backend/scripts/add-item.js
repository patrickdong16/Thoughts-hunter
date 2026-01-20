#!/usr/bin/env node

const pool = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function addRadarItem() {
    console.log('\n🎯 添加新的思想雷达条目\n');

    try {
        // 显示可用频段
        const bandsResult = await pool.query('SELECT id, question FROM bands ORDER BY id');
        console.log('📊 可用频段:');
        bandsResult.rows.forEach(band => {
            console.log(`   ${band.id}: ${band.question}`);
        });
        console.log('');

        // 收集数据
        const date = await question('发布日期 (YYYY-MM-DD, 回车=今天): ') || new Date().toISOString().split('T')[0];
        const freq = await question('频段ID (如 T1, P1, Φ1): ');
        const stance = await question('立场 (A/B): ');
        const title = await question('标题: ');
        const authorName = await question('作者姓名: ');
        const authorAvatar = await question('作者头像缩写 (2-3个字母): ');
        const authorBio = await question('作者简介: ');
        const source = await question('来源: ');

        console.log('\n请输入正文内容（至少500字，输入完成后按Ctrl+D）:');
        let content = '';
        rl.on('line', (line) => {
            content += line + '\n';
        });

        await new Promise(resolve => {
            rl.once('close', resolve);
        });

        const rlNew = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const tensionQ = await new Promise(resolve => rlNew.question('张力问题: ', resolve));
        const tensionA = await new Promise(resolve => rlNew.question('A极描述: ', resolve));
        const tensionB = await new Promise(resolve => rlNew.question('B极描述: ', resolve));
        const keywordsStr = await new Promise(resolve => rlNew.question('关键词（逗号分隔）: ', resolve));

        rlNew.close();

        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);

        // 验证
        if (!['A', 'B'].includes(stance.toUpperCase())) {
            console.log('❌ 立场必须是A或B');
            process.exit(1);
        }

        if (content.length < 500) {
            console.log(`❌ 正文至少需要500字（当前${content.length}字）`);
            process.exit(1);
        }

        // 插入数据
        const query = `
      INSERT INTO radar_items (
        date, freq, stance, title, author_name, author_avatar, 
        author_bio, source, content, tension_q, tension_a, tension_b, keywords
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

        const result = await pool.query(query, [
            date, freq, stance.toUpperCase(), title, authorName, authorAvatar,
            authorBio, source, content, tensionQ, tensionA, tensionB, keywords
        ]);

        console.log(`\n✅ 成功添加雷达条目！ID: ${result.rows[0].id}`);
        console.log(`   日期: ${date}`);
        console.log(`   频段: ${freq}`);
        console.log(`   标题: ${title}\n`);

    } catch (error) {
        if (error.code === '23505') {
            console.error('\n❌ 该日期的该频段已有内容，无法重复添加');
        } else if (error.code === '23503') {
            console.error('\n❌ 频段ID不存在，请检查输入');
        } else {
            console.error('\n❌ 错误:', error.message);
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addRadarItem();
