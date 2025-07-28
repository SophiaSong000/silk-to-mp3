import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES, switchLanguageUrl } from '../utils/i18n';

const LanguageSwitcherContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
  }
`;

const LanguageButton = styled.button`
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

const LanguageDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownContent = styled.div`
  display: ${props => props.$show ? 'block' : 'none'};
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 5px;
  background-color: white;
  min-width: 120px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
  z-index: 1001;
`;

const DropdownItem = styled.a`
  color: #333;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  font-size: 14px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.active {
    background-color: #0088ff;
    color: white;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 12px;
  }
`;

const CurrentLanguageIndicator = styled.span`
  margin-right: 5px;
  font-weight: 500;
`;

const DropdownArrow = styled.span`
  margin-left: 5px;
  font-size: 12px;
  transition: transform 0.3s ease;
  transform: ${props => props.$open ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

export const LanguageSwitcher = () => {
  const { currentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLanguageChange = (newLanguage) => {
    if (newLanguage !== currentLanguage) {
      const newUrl = switchLanguageUrl(currentLanguage, newLanguage);
      console.log('语言切换:', currentLanguage, '->', newLanguage, '新URL:', newUrl);
      
      // 保存语言偏好到localStorage
      localStorage.setItem('preferred-language', newLanguage);
      
      // 直接使用location.href进行页面跳转，确保完全刷新
      window.location.href = newUrl;
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.language-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <LanguageSwitcherContainer>
      <LanguageDropdown className="language-dropdown">
        <LanguageButton onClick={toggleDropdown}>
          <CurrentLanguageIndicator>
            {SUPPORTED_LANGUAGES[currentLanguage]}
          </CurrentLanguageIndicator>
          <DropdownArrow $open={isOpen}>▼</DropdownArrow>
        </LanguageButton>
        
        <DropdownContent $show={isOpen}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([langCode, langName]) => (
            <DropdownItem
              key={langCode}
              className={langCode === currentLanguage ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleLanguageChange(langCode);
              }}
              href="#"
            >
              {langName}
            </DropdownItem>
          ))}
        </DropdownContent>
      </LanguageDropdown>
    </LanguageSwitcherContainer>
  );
};