# 多语言版本项目结构设计

## 项目结构
```
silk-converter-multilingual/
├── client/                          # 前端应用
│   ├── public/
│   │   ├── index.html              # 英文版主页
│   │   ├── locales/                # 语言文件
│   │   │   ├── en.json            # 英文翻译
│   │   │   └── zh.json            # 中文翻译
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── LanguageSwitcher.js # 语言切换组件
│   │   │   └── App.js             # 主应用组件
│   │   ├── hooks/
│   │   │   └── useTranslation.js  # 翻译钩子
│   │   ├── utils/
│   │   │   └── i18n.js            # 国际化配置
│   │   └── index.js
│   └── package.json
├── server/                          # 后端服务器
│   ├── server-fixed.js
│   └── package.json
├── Dockerfile
└── README.md
```

## URL 结构设计
- `/` - 英文版主页 (默认)
- `/zh/` - 中文版页面
- 语言切换通过路由参数实现

## 实现方案
1. 使用 React Router 处理路由
2. 创建语言切换组件
3. 使用 Context API 管理语言状态
4. 支持 URL 路径和浏览器语言检测