import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import { getLanguageFromPath } from './utils/i18n';
import { LegalPageManager } from './components/legal/LegalPageManager';
import { SEOPage } from './components/seo/SEOPage';

// 应用包装器，添加法律功能但不影响主体功能
const AppWithLegal = () => {
  return (
    <LegalPageManager>
      <App />
    </LegalPageManager>
  );
};

// SEO页面包装器
const SEOPageWithLegal = () => {
  const handleNavigateToTool = () => {
    // 根据当前语言导航到工具页面
    const currentPath = window.location.pathname;
    const currentLang = getLanguageFromPath(currentPath);
    const toolUrl = currentLang === 'zh' ? '/zh/' : '/';
    window.location.href = toolUrl;
  };

  return (
    <LegalPageManager>
      <SEOPage onNavigateToTool={handleNavigateToTool} />
    </LegalPageManager>
  );
};

// 路由组件，处理语言路径
const AppRouter = () => {
  // 语言路径检测（预留功能）
  const currentPath = window.location.pathname;
  const currentLang = getLanguageFromPath(currentPath);
  console.log('Current language path:', currentLang);
  
  return (
    <Router>
      <Routes>
        {/* 英文版 - 默认路径 */}
        <Route path="/" element={<AppWithLegal />} />
        
        {/* 英文版SEO页面 */}
        <Route path="/silk-to-mp3-converter" element={<SEOPageWithLegal />} />
        
        {/* 中文版 - /zh/ 路径 */}
        <Route path="/zh/*" element={<AppWithLegal />} />
        
        {/* 中文版SEO页面 */}
        <Route path="/zh/微信语音转mp3" element={<SEOPageWithLegal />} />
        
        {/* 重定向处理 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);