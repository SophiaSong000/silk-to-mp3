import React, { useState } from 'react';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { Disclaimer } from './Disclaimer';
import { ConsentModal } from './ConsentModal';

export const LegalPageManager = ({ children }) => {
  const [currentPage, setCurrentPage] = useState(null);

  const showPrivacyPolicy = () => {
    console.log('显示隐私政策页面');
    setCurrentPage('privacy');
  };
  const showTermsOfService = () => {
    console.log('显示使用条款页面');
    setCurrentPage('terms');
  };
  const showDisclaimer = () => {
    console.log('显示免责声明页面');
    setCurrentPage('disclaimer');
  };
  const showMainApp = () => {
    console.log('返回主应用');
    setCurrentPage(null);
  };

  // 如果显示法律页面，渲染对应页面
  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={showMainApp} />;
  }
  
  if (currentPage === 'terms') {
    return <TermsOfService onBack={showMainApp} />;
  }
  
  if (currentPage === 'disclaimer') {
    return <Disclaimer onBack={showMainApp} />;
  }

  // 默认渲染主应用，包装在ConsentModal中，并传递法律页面显示函数
  return (
    <ConsentModal 
      onShowPrivacy={showPrivacyPolicy}
      onShowTerms={showTermsOfService}
      onShowDisclaimer={showDisclaimer}
    >
      {React.cloneElement(children, {
        onShowPrivacy: showPrivacyPolicy,
        onShowTerms: showTermsOfService,
        onShowDisclaimer: showDisclaimer
      })}
    </ConsentModal>
  );
};