const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, phone_number } = req.body;
        
        // 检查用户名是否已存在
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '用户名或邮箱已存在'
            });
        }
        
        // 插入新用户（实际项目中应该加密密码）
        const [result] = await db.execute(
            'INSERT INTO users (username, password, email, phone_number) VALUES (?, ?, ?, ?)',
            [username, password, email, phone_number]
        );
        
        res.json({
            success: true,
            message: '注册成功',
            userId: result.insertId
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({
            success: false,
            message: '注册失败'
        });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [users] = await db.execute(
            'SELECT id, username, email FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        
        res.json({
            success: true,
            message: '登录成功',
            user: users[0]
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败'
        });
    }
});

module.exports = router;
