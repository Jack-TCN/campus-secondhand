const db = require('../config/database');

async function formatProductRows(rows) {
    return rows.map(product => {
        const productData = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            category_name: product.category_name,
            user_id: product.user_id,
            username: product.username,
            location: product.location,
            status: product.status,
            created_at: product.created_at,
            images: []
        };

        if (product.first_image) {
            if (!product.first_image.startsWith('data:image')) {
                productData.images = [`data:image/jpeg;base64,${product.first_image}`];
            } else {
                productData.images = [product.first_image];
            }
        }

        return productData;
    });
}

async function getAll() {
    const [rows] = await db.execute(`
        SELECT p.*, c.name as category_name, u.username,
               (SELECT image_data FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.display_order ASC LIMIT 1) as first_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'available'
        ORDER BY p.created_at DESC
    `);
    return formatProductRows(rows);
}

async function getByCategory(categoryId) {
    const [rows] = await db.execute(`
        SELECT p.*, c.name as category_name, u.username,
               (SELECT image_data FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.display_order ASC LIMIT 1) as first_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.category_id = ? AND p.status = 'available'
        ORDER BY p.created_at DESC
    `, [categoryId]);
    return formatProductRows(rows);
}

async function search(keyword) {
    const [rows] = await db.execute(`
        SELECT p.*, c.name as category_name, u.username,
               (SELECT image_data FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.display_order ASC LIMIT 1) as first_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE (p.name LIKE ? OR p.description LIKE ?) AND p.status = 'available'
        ORDER BY p.created_at DESC
    `, [`%${keyword}%`, `%${keyword}%`]);
    return formatProductRows(rows);
}

async function getById(id) {
    const [rows] = await db.execute(`
        SELECT p.*, c.name as category_name, u.username, u.phone_number, u.email
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
        return null;
    }

    const [images] = await db.execute(`
        SELECT image_data
        FROM product_images
        WHERE product_id = ?
        ORDER BY display_order ASC
    `, [id]);

    const processedImages = images.map(img => {
        if (img.image_data && !img.image_data.startsWith('data:image')) {
            return `data:image/jpeg;base64,${img.image_data}`;
        }
        return img.image_data;
    }).filter(img => img);

    return {
        ...rows[0],
        images: processedImages
    };
}

async function create(data) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { name, description, price, category_id, user_id, location, images } = data;
        const [result] = await connection.execute(
            'INSERT INTO products (name, description, price, category_id, user_id, location) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, category_id, user_id, location]
        );
        const productId = result.insertId;

        if (images && images.length > 0) {
            const imageValues = images.map((image, index) => {
                let imageData = image;
                if (image.startsWith('data:image')) {
                    const base64Index = image.indexOf('base64,');
                    if (base64Index !== -1) {
                        imageData = image.substring(base64Index + 7);
                    }
                }
                return [productId, imageData, index];
            });
            await connection.query(
                'INSERT INTO product_images (product_id, image_data, display_order) VALUES ?',
                [imageValues]
            );
        }
        await connection.commit();
        return productId;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function update(id, data) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { name, description, price, category_id, location, images } = data;
        await connection.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, location = ? WHERE id = ?',
            [name, description, price, category_id, location, id]
        );
        if (images !== undefined) {
            await connection.execute(
                'DELETE FROM product_images WHERE product_id = ?',
                [id]
            );
            if (images && images.length > 0) {
                const imageValues = images.map((image, index) => {
                    let imageData = image;
                    if (image.startsWith('data:image')) {
                        const base64Index = image.indexOf('base64,');
                        if (base64Index !== -1) {
                            imageData = image.substring(base64Index + 7);
                        }
                    }
                    return [id, imageData, index];
                });
                await connection.query(
                    'INSERT INTO product_images (product_id, image_data, display_order) VALUES ?',
                    [imageValues]
                );
            }
        }
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function markSold(id) {
    await db.execute('UPDATE products SET status = "sold" WHERE id = ?', [id]);
}

async function getCategories() {
    const [rows] = await db.execute('SELECT * FROM categories');
    return rows;
}

module.exports = {
    getAll,
    getByCategory,
    search,
    getById,
    create,
    update,
    markSold,
    getCategories
};

