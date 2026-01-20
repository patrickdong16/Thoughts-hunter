#!/usr/bin/env node

const { exec } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 思想雷达后端 - 环境检查\n');

// 检查PostgreSQL是否安装
function checkPostgresInstalled() {
    return new Promise((resolve) => {
        exec('which psql', (error, stdout) => {
            if (error || !stdout.trim()) {
                console.log('❌ PostgreSQL未安装或不在PATH中');
                console.log('   请参考 QUICKSTART.md 安装PostgreSQL\n');
                resolve(false);
            } else {
                console.log('✅ PostgreSQL已安装:', stdout.trim());
                resolve(true);
            }
        });
    });
}

// 检查PostgreSQL服务是否运行
function checkPostgresRunning() {
    return new Promise((resolve) => {
        exec('ps aux | grep postgres | grep -v grep', (error, stdout) => {
            if (error || !stdout.trim()) {
                console.log('❌ PostgreSQL服务未运行');
                console.log('   运行: brew services start postgresql@15\n');
                resolve(false);
            } else {
                console.log('✅ PostgreSQL服务正在运行\n');
                resolve(true);
            }
        });
    });
}

// 检查数据库连接
async function checkDatabaseConnection() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'thoughts_radar',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    });

    try {
        await pool.query('SELECT NOW()');
        console.log('✅ 数据库连接成功');

        // 检查表是否存在
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        if (tablesResult.rows.length === 0) {
            console.log('⚠️  数据库为空，需要初始化');
            console.log('   运行: npm run init-db\n');
        } else {
            console.log(`✅ 数据库已初始化 (${tablesResult.rows.length}个表)`);

            // 统计数据
            const bandsCount = await pool.query('SELECT COUNT(*) FROM bands');
            const itemsCount = await pool.query('SELECT COUNT(*) FROM radar_items');

            console.log('   📊 数据统计:');
            console.log(`      - 频段: ${bandsCount.rows[0].count}`);
            console.log(`      - 雷达条目: ${itemsCount.rows[0].count}\n`);
        }

        await pool.end();
        return true;
    } catch (error) {
        if (error.code === '3D000') {
            console.log('❌ 数据库不存在');
            console.log('   创建数据库: createdb thoughts_radar');
            console.log('   或运行: psql -U postgres -c "CREATE DATABASE thoughts_radar;"\n');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('❌ 无法连接到数据库服务器');
            console.log('   请确保PostgreSQL服务正在运行\n');
        } else {
            console.log('❌ 数据库连接失败:', error.message);
            console.log('   检查 .env 文件中的数据库配置\n');
        }
        return false;
    }
}

// 主函数
async function main() {
    console.log('📋 环境配置:');
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   DB_PORT: ${process.env.DB_PORT || 5432}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'thoughts_radar'}`);
    console.log(`   DB_USER: ${process.env.DB_USER || 'postgres'}`);
    console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***设置***' : '***未设置***'}\n`);

    const postgresInstalled = await checkPostgresInstalled();
    if (!postgresInstalled) {
        console.log('\n📚 安装PostgreSQL:');
        console.log('   Homebrew: brew install postgresql@15');
        console.log('   Docker: docker run -e POSTGRES_PASSWORD=mypassword -p 5432:5432 -d postgres:15\n');
        process.exit(1);
    }

    const postgresRunning = await checkPostgresRunning();
    if (!postgresRunning) {
        process.exit(1);
    }

    const dbConnected = await checkDatabaseConnection();

    if (dbConnected) {
        console.log('✨ 所有检查通过！可以启动服务器:');
        console.log('   npm run dev\n');
    }
}

main().catch(console.error);
