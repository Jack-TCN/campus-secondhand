# campus-secondhand

html的连接数据库 赛博朋克风

```
campus-secondhand/
├── frontend/
│   └── index.html (你的前端文件放这里)
├── backend/
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── products.js
│   │   └── users.js
│   ├── controllers/
│   │   ├── productController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── productModel.js
│   │   └── userModel.js
│   └── package.json
```

后端现已按 MVC 模式组织：路由仅负责 URL 映射，控制器处理请求逻辑，模型与数据库交互。
