import React from 'react';

export const ConsentModal = ({ onShowPrivacy, onShowTerms, onShowDisclaimer, children }) => {
  // 移除弹窗逻辑，直接渲染子组件并传递法律页面函数
  return React.cloneElement(children, {
    onShowPrivacy,
    onShowTerms,
    onShowDisclaimer
  });
};