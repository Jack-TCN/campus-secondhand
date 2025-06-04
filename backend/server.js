const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors());
// 增加请求体大小限制，支持图片上传
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务（为前端文件提供服务）
app.use(express.static(path.join(__dirname, '../frontend')));

// 导入路由
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');

// 使用路由
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║     🚀 赛博航专校园交易平台已启动！     ║
    ║                                       ║
    ║     访问地址: http://localhost:${PORT} ║
    ║     按 Ctrl+C 停止服务器               ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
    `);
});
