// 国际化工具函数
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  zh: '中文'
};

export const DEFAULT_LANGUAGE = 'en';

// 从URL路径获取语言
export const getLanguageFromPath = (pathname) => {
  console.log('getLanguageFromPath - 输入路径:', pathname);
  
  // 处理路径，移除开头和结尾的斜杠
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const pathSegments = cleanPath ? cleanPath.split('/') : [];
  
  console.log('getLanguageFromPath - 清理后的路径:', cleanPath);
  console.log('getLanguageFromPath - 路径段:', pathSegments);
  
  const firstSegment = pathSegments[0];
  console.log('getLanguageFromPath - 第一段:', firstSegment);
  
  // 检查第一段是否是支持的语言
  if (firstSegment && SUPPORTED_LANGUAGES[firstSegment]) {
    console.log('getLanguageFromPath - 找到支持的语言:', firstSegment);
    return firstSegment;
  }
  
  console.log('getLanguageFromPath - 使用默认语言:', DEFAULT_LANGUAGE);
  return DEFAULT_LANGUAGE;
};

// 从浏览器语言获取支持的语言
export const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0];
  
  return SUPPORTED_LANGUAGES[langCode] ? langCode : DEFAULT_LANGUAGE;
};

// 获取当前应该使用的语言
export const getCurrentLanguage = () => {
  const currentPath = window.location.pathname;
  console.log('getCurrentLanguage - 当前路径:', currentPath);
  
  // 1. 优先从URL路径获取
  const pathLang = getLanguageFromPath(currentPath);
  console.log('getCurrentLanguage - URL路径语言:', pathLang);
  
  // 如果URL中有明确的语言路径且不是默认语言，直接使用
  if (pathLang !== DEFAULT_LANGUAGE && SUPPORTED_LANGUAGES[pathLang]) {
    console.log('getCurrentLanguage - 使用URL路径语言:', pathLang);
    return pathLang;
  }
  
  // 如果路径是根路径或英文路径，检查是否有语言偏好
  if (pathLang === DEFAULT_LANGUAGE) {
    // 2. 从localStorage获取用户偏好
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && SUPPORTED_LANGUAGES[savedLang] && savedLang !== DEFAULT_LANGUAGE) {
      console.log('getCurrentLanguage - 有保存的语言偏好但URL是默认语言，使用URL语言:', pathLang);
      return pathLang; // 如果URL明确是英文路径，就使用英文
    }
    
    console.log('getCurrentLanguage - 使用URL路径语言（默认）:', pathLang);
    return pathLang;
  }
  
  // 3. 从浏览器语言获取
  const browserLang = getBrowserLanguage();
  console.log('getCurrentLanguage - 使用浏览器语言:', browserLang);
  return browserLang;
};

// 保存语言偏好
export const saveLanguagePreference = (language) => {
  localStorage.setItem('preferred-language', language);
};

// 生成语言路径
export const getLanguagePath = (language, path = '') => {
  if (language === DEFAULT_LANGUAGE) {
    return `/${path}`;
  }
  return `/${language}/${path}`;
};

// 切换语言时的URL处理
export const switchLanguageUrl = (currentLang, targetLang) => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  
  console.log('switchLanguageUrl - 当前语言:', currentLang, '目标语言:', targetLang);
  console.log('switchLanguageUrl - 当前路径:', currentPath);
  
  let newPath;
  
  if (currentLang === DEFAULT_LANGUAGE) {
    // 从英文切换到其他语言
    if (targetLang === DEFAULT_LANGUAGE) {
      newPath = currentPath; // 都是英文，不变
    } else {
      // 从英文切换到中文：/ -> /zh/
      newPath = currentPath === '/' ? `/${targetLang}/` : `/${targetLang}${currentPath}`;
    }
  } else {
    // 从其他语言切换
    const pathWithoutLang = currentPath.replace(new RegExp(`^/${currentLang}/?`), '/');
    console.log('switchLanguageUrl - 移除语言后的路径:', pathWithoutLang);
    
    if (targetLang === DEFAULT_LANGUAGE) {
      // 切换到英文
      newPath = pathWithoutLang;
    } else {
      // 切换到其他语言
      newPath = pathWithoutLang === '/' ? `/${targetLang}/` : `/${targetLang}${pathWithoutLang}`;
    }
  }
  
  console.log('switchLanguageUrl - 新路径:', newPath);
  return newPath + currentSearch;
};