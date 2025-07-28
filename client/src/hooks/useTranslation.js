import { useState, useEffect, useCallback } from 'react';
import { getCurrentLanguage, saveLanguagePreference } from '../utils/i18n';

// 翻译缓存
const translationCache = {};

// 加载翻译文件
const loadTranslation = async (language) => {
  if (translationCache[language]) {
    return translationCache[language];
  }
  
  try {
    const response = await fetch(`/locales/${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translation for ${language}`);
    }
    
    const translation = await response.json();
    translationCache[language] = translation;
    return translation;
  } catch (error) {
    console.error('Error loading translation:', error);
    // 如果加载失败，返回英文作为后备
    if (language !== 'en') {
      return loadTranslation('en');
    }
    return {};
  }
};

// 获取嵌套对象的值
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 监听URL变化，更新当前语言
  useEffect(() => {
    const handleLocationChange = () => {
      const newLanguage = getCurrentLanguage();
      console.log('URL变化检测到新语言:', newLanguage, '当前语言:', currentLanguage);
      if (newLanguage !== currentLanguage) {
        console.log('语言从', currentLanguage, '切换到', newLanguage);
        setCurrentLanguage(newLanguage);
      }
    };

    // 初始检查
    handleLocationChange();

    // 监听popstate事件（浏览器前进后退）
    window.addEventListener('popstate', handleLocationChange);
    
    // 监听pushstate和replacestate（程序化导航）
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(handleLocationChange, 0); // 异步执行，确保URL已更新
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      setTimeout(handleLocationChange, 0); // 异步执行，确保URL已更新
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [currentLanguage]);

  // 加载翻译
  useEffect(() => {
    const loadCurrentTranslation = async () => {
      setIsLoading(true);
      try {
        console.log('加载语言翻译:', currentLanguage);
        const translation = await loadTranslation(currentLanguage);
        console.log('翻译加载完成:', currentLanguage, Object.keys(translation).length, '个键');
        setTranslations(translation);
      } catch (error) {
        console.error('Failed to load translation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentTranslation();
  }, [currentLanguage]);

  // 翻译函数
  const t = useCallback((key, defaultValue = key) => {
    if (!key) return defaultValue;
    
    const value = getNestedValue(translations, key);
    return value !== null ? value : defaultValue;
  }, [translations]);

  // 切换语言
  const changeLanguage = useCallback((newLanguage) => {
    if (newLanguage !== currentLanguage) {
      setCurrentLanguage(newLanguage);
      saveLanguagePreference(newLanguage);
    }
  }, [currentLanguage]);

  // 获取当前语言
  const getCurrentLang = useCallback(() => currentLanguage, [currentLanguage]);

  return {
    t,
    currentLanguage,
    changeLanguage,
    getCurrentLang,
    isLoading
  };
};