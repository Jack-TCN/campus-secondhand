// backend/config/database.js
const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',  // 你的MySQL用户名
    password: '584249',  // 你的MySQL密码
    database: 'campus_secondhand_platform',
    charset: 'utf8mb4',  // 支持中文和表情符号
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true  // 允许执行多条SQL语句
});

// 将连接池转换为Promise模式
const promisePool = pool.promise();

// 创建商品图片表（如果不存在）
const createImagesTable = async () => {
    try {
        // 修复：增加图片表的字段大小，使用LONGTEXT确保能存储大图片
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_data LONGTEXT NOT NULL,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                INDEX idx_product_id (product_id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        
        // 修复：检查并修改现有表的image_data字段类型，确保是LONGTEXT
        await promisePool.execute(`
            ALTER TABLE product_images 
            MODIFY COLUMN image_data LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
        `).catch(err => {
            // 如果修改失败（可能已经是LONGTEXT），忽略错误
            console.log('图片字段已经是LONGTEXT类型');
        });
        
        console.log('商品图片表已准备就绪');
    } catch (error) {
        console.error('创建图片表失败:', error);
    }
};

// 初始化时创建图片表
createImagesTable();

module.exports = promisePool;
