const productModel = require('../models/productModel');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await productModel.getAll();
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('获取商品失败:', error);
        res.status(500).json({ success: false, message: '获取商品失败', error: error.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const products = await productModel.getByCategory(req.params.categoryId);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('获取分类商品失败:', error);
        res.status(500).json({ success: false, message: '获取分类商品失败', error: error.message });
    }
};

exports.searchProducts = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const products = await productModel.search(keyword);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('搜索商品失败:', error);
        res.status(500).json({ success: false, message: '搜索商品失败', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await productModel.getById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: '商品不存在' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({ success: false, message: '获取商品详情失败', error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productId = await productModel.create(req.body);
        res.json({ success: true, message: '商品发布成功', productId });
    } catch (error) {
        console.error('发布商品失败:', error);
        res.status(500).json({ success: false, message: '发布商品失败', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        await productModel.update(req.params.id, req.body);
        res.json({ success: true, message: '商品更新成功' });
    } catch (error) {
        console.error('更新商品失败:', error);
        res.status(500).json({ success: false, message: '更新商品失败', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await productModel.markSold(req.params.id);
        res.json({ success: true, message: '商品删除成功' });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({ success: false, message: '删除商品失败', error: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await productModel.getCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ success: false, message: '获取分类失败', error: error.message });
    }
};
