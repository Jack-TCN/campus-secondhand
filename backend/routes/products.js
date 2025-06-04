const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取所有商品（包括第一张图片）
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                p.*, 
                c.name as category_name, 
                u.username,
                (SELECT image_data FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as first_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.status = 'available'
            ORDER BY p.created_at DESC
        `);
        
        // 处理图片数据
        const productsWithImages = rows.map(product => ({
            ...product,
            images: product.first_image ? [product.first_image] : []
        }));
        
        res.json({
            success: true,
            data: productsWithImages
        });
    } catch (error) {
        console.error('获取商品失败:', error);
        res.status(500).json({
            success: false,
            message: '获取商品失败'
        });
    }
});

// 根据分类获取商品
router.get('/category/:categoryId', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                p.*, 
                c.name as category_name, 
                u.username,
                (SELECT image_data FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as first_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.category_id = ? AND p.status = 'available'
            ORDER BY p.created_at DESC
        `, [req.params.categoryId]);
        
        // 处理图片数据
        const productsWithImages = rows.map(product => ({
            ...product,
            images: product.first_image ? [product.first_image] : []
        }));
        
        res.json({
            success: true,
            data: productsWithImages
        });
    } catch (error) {
        console.error('获取分类商品失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类商品失败'
        });
    }
});

// 搜索商品
router.get('/search', async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const [rows] = await db.execute(`
            SELECT 
                p.*, 
                c.name as category_name, 
                u.username,
                (SELECT image_data FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as first_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE (p.name LIKE ? OR p.description LIKE ?) AND p.status = 'available'
            ORDER BY p.created_at DESC
        `, [`%${keyword}%`, `%${keyword}%`]);
        
        // 处理图片数据
        const productsWithImages = rows.map(product => ({
            ...product,
            images: product.first_image ? [product.first_image] : []
        }));
        
        res.json({
            success: true,
            data: productsWithImages
        });
    } catch (error) {
        console.error('搜索商品失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索商品失败'
        });
    }
});

// 获取单个商品详情（包括所有图片）
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, c.name as category_name, u.username, u.phone_number, u.email 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        // 获取商品的所有图片
        const [images] = await db.execute(`
            SELECT image_data 
            FROM product_images 
            WHERE product_id = ? 
            ORDER BY display_order ASC
        `, [req.params.id]);
        
        const product = {
            ...rows[0],
            images: images.map(img => img.image_data)
        };
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取商品详情失败'
        });
    }
});

// 发布新商品（包括图片）
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { name, description, price, category_id, user_id, location, images } = req.body;
        
        // 插入商品信息
        const [result] = await connection.execute(
            'INSERT INTO products (name, description, price, category_id, user_id, location) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, category_id, user_id, location]
        );
        
        const productId = result.insertId;
        
        // 如果有图片，插入图片数据
        if (images && images.length > 0) {
            const imageValues = images.map((image, index) => [productId, image, index]);
            await connection.query(
                'INSERT INTO product_images (product_id, image_data, display_order) VALUES ?',
                [imageValues]
            );
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: '商品发布成功',
            productId: productId
        });
    } catch (error) {
        await connection.rollback();
        console.error('发布商品失败:', error);
        res.status(500).json({
            success: false,
            message: '发布商品失败'
        });
    } finally {
        connection.release();
    }
});

// 更新商品信息（包括图片）
router.put('/:id', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { name, description, price, category_id, location, images } = req.body;
        
        // 更新商品基本信息
        await connection.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, location = ? WHERE id = ?',
            [name, description, price, category_id, location, req.params.id]
        );
        
        // 如果提供了新图片，先删除旧图片
        if (images !== undefined) {
            await connection.execute(
                'DELETE FROM product_images WHERE product_id = ?',
                [req.params.id]
            );
            
            // 插入新图片
            if (images && images.length > 0) {
                const imageValues = images.map((image, index) => [req.params.id, image, index]);
                await connection.query(
                    'INSERT INTO product_images (product_id, image_data, display_order) VALUES ?',
                    [imageValues]
                );
            }
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: '商品更新成功'
        });
    } catch (error) {
        await connection.rollback();
        console.error('更新商品失败:', error);
        res.status(500).json({
            success: false,
            message: '更新商品失败'
        });
    } finally {
        connection.release();
    }
});

// 删除商品（软删除，将状态改为已售出）
router.delete('/:id', async (req, res) => {
    try {
        await db.execute(
            'UPDATE products SET status = "sold" WHERE id = ?',
            [req.params.id]
        );
        
        res.json({
            success: true,
            message: '商品删除成功'
        });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({
            success: false,
            message: '删除商品失败'
        });
    }
});

// 获取所有分类
router.get('/categories/all', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories');
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类失败'
        });
    }
});

module.exports = router;
