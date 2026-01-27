const initDatabase = require('./init-database');

async function startServer() {
    try {
        console.log('📋 Running database initialization and migrations...');
        await initDatabase();
        console.log('✅ Database ready, starting server...');
    } catch (e) {
        console.log('⚠️  Database init failed:', e.message);
        console.log('   (Will try to start server anyway)');
    }

    // 启动服务器
    require('./server.js');
}

startServer().catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
});
