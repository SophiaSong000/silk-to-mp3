# 多语言版本部署指南

## 项目特性

### 🌍 多语言支持
- **英文版**: 主页 `/`
- **中文版**: 子路径 `/zh/`
- 自动语言检测和切换
- URL路径保持语言状态

### 🚀 技术特性
- React 18 + React Router
- 响应式设计
- 国际化 (i18n)
- 语言切换组件
- SEO优化

## 部署步骤

### 1. 后端部署 (Railway)

```bash
# 1. 推送代码到GitHub
git add .
git commit -m "Add multilingual support"
git push origin main

# 2. 在Railway部署后端
# 使用之前创建的Dockerfile
# 设置环境变量：
# NODE_ENV=production
# PORT=5000
```

### 2. 前端部署 (Vercel)

```bash
# 1. 在Vercel创建新项目
# 2. 选择GitHub仓库
# 3. 设置构建配置：
#    - Framework Preset: Create React App
#    - Root Directory: client
#    - Build Command: npm run build
#    - Output Directory: build

# 4. 设置环境变量：
REACT_APP_API_URL=https://your-railway-app.railway.app
```

### 3. 域名和路由配置

#### Vercel路由配置 (vercel.json)
```json
{
  "routes": [
    {
      "src": "/zh/(.*)",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### 自定义域名 (可选)
- 在Vercel绑定自定义域名
- 配置DNS记录
- 自动HTTPS证书

## URL结构

### 访问路径
- `https://your-domain.com/` - 英文版主页
- `https://your-domain.com/zh/` - 中文版主页

### 语言切换逻辑
1. **URL检测**: 优先从URL路径获取语言
2. **本地存储**: 检查用户语言偏好
3. **浏览器语言**: 自动检测浏览器语言
4. **默认语言**: 英文作为后备

## SEO优化

### Meta标签
```html
<meta name="description" content="Convert WeChat voice files - 微信语音转换器" />
<meta name="keywords" content="WeChat, voice, converter, 微信, 语音" />
```

### Open Graph
```html
<meta property="og:title" content="WeChat Voice Converter - 微信语音转换器" />
<meta property="og:description" content="Convert WeChat voice files to MP3" />
```

### 语言标记
- HTML lang属性动态设置
- hreflang标签（如需要）

## 功能测试

### 测试清单
- [ ] 英文版页面正常加载
- [ ] 中文版页面正常加载 (/zh/)
- [ ] 语言切换功能正常
- [ ] 文件上传转换功能
- [ ] 响应式设计在移动端正常
- [ ] 浏览器语言自动检测
- [ ] URL路径保持语言状态

### 测试用例
1. **直接访问**: `https://your-domain.com/`
2. **中文路径**: `https://your-domain.com/zh/`
3. **语言切换**: 点击语言切换按钮
4. **浏览器语言**: 清除localStorage，刷新页面
5. **移动端**: 在手机浏览器测试

## 维护和更新

### 添加新语言
1. 在 `client/public/locales/` 添加新的语言文件
2. 更新 `SUPPORTED_LANGUAGES` 配置
3. 添加对应的路由规则
4. 测试新语言功能

### 翻译更新
1. 编辑对应的JSON文件
2. 重新部署前端应用
3. 清除浏览器缓存测试

### 性能优化
- 翻译文件缓存
- 图片优化
- 代码分割
- CDN加速

## 故障排除

### 常见问题
1. **语言切换不生效**: 检查localStorage和URL路径
2. **翻译文件加载失败**: 检查文件路径和网络
3. **路由不工作**: 检查vercel.json配置
4. **移动端显示问题**: 检查响应式CSS

### 调试方法
- 浏览器开发者工具
- Network面板检查资源加载
- Console查看错误信息
- Application面板检查localStorage

## 成本估算

### 免费方案
- **Vercel**: 前端托管免费
- **Railway**: 后端免费额度
- **总成本**: $0/月

### 付费升级
- **自定义域名**: $10-15/年
- **Railway Pro**: $5/月
- **Vercel Pro**: $20/月（可选）

## 下一步优化

### 功能增强
- 添加更多语言支持
- 语音识别功能
- 批量处理优化
- 用户账户系统

### 技术优化
- PWA支持
- 离线功能
- 服务端渲染 (SSR)
- 性能监控

需要帮助实施任何步骤吗？