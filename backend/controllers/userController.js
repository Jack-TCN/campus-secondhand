const userModel = require('../models/userModel');

exports.register = async (req, res) => {
    try {
        const { username, password, email, phone_number } = req.body;
        const existing = await userModel.findByUsernameOrEmail(username, email);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
        }
        const userId = await userModel.createUser({ username, password, email, phone_number });
        res.json({ success: true, message: '注册成功', userId });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ success: false, message: '注册失败' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await userModel.findByCredentials(username, password);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
        res.json({ success: true, message: '登录成功', user: users[0] });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ success: false, message: '登录失败' });
    }
};
