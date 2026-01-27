const initDatabase = require('./init-database');

console.log('🔄 start-with-init.js: Starting...');
console.log('📅', new Date().toISOString());

async function startServer() {
    try {
        console.log('📋 Running database initialization and migrations...');
        await initDatabase();
        console.log('✅ Database ready, starting server...');

        // 导入 server.js 并启动（跳过数据库初始化因为我们已经做了）
        const { startServer: start } = require('./server.js');
        await start(true);  // skipInit = true
    } catch (e) {
        console.error('❌ Startup failed:', e);
        console.log('   Stack:', e.stack);
        process.exit(1);
    }
}

startServer();
