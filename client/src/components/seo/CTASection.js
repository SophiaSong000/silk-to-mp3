import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';

const CTAContainer = styled.section`
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  margin: 60px -20px 0;
  
  @media (max-width: 768px) {
    padding: 60px 0;
    margin: 40px -15px 0;
  }
`;

const CTAContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CTASubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 30px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
`;

const PrimaryButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 18px 36px;
  font-size: 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  &:hover {
    background: #ff5252;
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 15px 30px;
    font-size: 1.1rem;
    width: 100%;
    margin-bottom: 15px;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: white;
  border: 2px solid white;
  padding: 16px 32px;
  font-size: 1.1rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: white;
    color: #667eea;
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 13px 26px;
    font-size: 1rem;
    width: 100%;
  }
`;

const FeatureHighlights = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  margin-top: 50px;
  
  @media (max-width: 768px) {
    gap: 20px;
    margin-top: 40px;
  }
`;

const HighlightItem = styled.div`
  text-align: center;
  
  .icon {
    font-size: 2.5rem;
    margin-bottom: 15px;
    display: block;
  }
  
  .title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .desc {
    font-size: 0.95rem;
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    .icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    
    .title {
      font-size: 1rem;
    }
    
    .desc {
      font-size: 0.9rem;
    }
  }
`;

const TrustIndicators = styled.div`
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid rgba(255,255,255,0.3);
  
  .stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  
  .stat-item {
    text-align: center;
    
    .number {
      font-size: 2rem;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    
    .label {
      font-size: 0.9rem;
      opacity: 0.8;
    }
  }
  
  .trust-text {
    font-size: 0.95rem;
    opacity: 0.8;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    margin-top: 40px;
    
    .stats {
      gap: 30px;
    }
    
    .stat-item .number {
      font-size: 1.5rem;
    }
  }
`;

export const CTASection = ({ onNavigateToTool }) => {
  const { t } = useTranslation();

  const handleStartNow = () => {
    if (onNavigateToTool) {
      onNavigateToTool();
    }
  };

  const handleLearnMore = () => {
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CTAContainer>
      <CTAContent>
        <CTATitle>{t('seo.cta.title')}</CTATitle>
        <CTASubtitle>{t('seo.cta.subtitle')}</CTASubtitle>
        
        <CTAButtons>
          <PrimaryButton onClick={handleStartNow}>
            {t('seo.cta.startNow')}
          </PrimaryButton>
          <SecondaryButton onClick={handleLearnMore}>
            {t('seo.cta.learnMore')}
          </SecondaryButton>
        </CTAButtons>

        <FeatureHighlights>
          <HighlightItem>
            <span className="icon">⚡</span>
            <div className="title">{t('seo.cta.highlight1.title')}</div>
            <div className="desc">{t('seo.cta.highlight1.desc')}</div>
          </HighlightItem>
          <HighlightItem>
            <span className="icon">🔒</span>
            <div className="title">{t('seo.cta.highlight2.title')}</div>
            <div className="desc">{t('seo.cta.highlight2.desc')}</div>
          </HighlightItem>
          <HighlightItem>
            <span className="icon">🆓</span>
            <div className="title">{t('seo.cta.highlight3.title')}</div>
            <div className="desc">{t('seo.cta.highlight3.desc')}</div>
          </HighlightItem>
          <HighlightItem>
            <span className="icon">🌍</span>
            <div className="title">{t('seo.cta.highlight4.title')}</div>
            <div className="desc">{t('seo.cta.highlight4.desc')}</div>
          </HighlightItem>
        </FeatureHighlights>

        <TrustIndicators>
          <div className="stats">
            <div className="stat-item">
              <span className="number">10+</span>
              <span className="label">{t('seo.cta.stats.dailyFree')}</span>
            </div>
            <div className="stat-item">
              <span className="number">24h</span>
              <span className="label">{t('seo.cta.stats.autoDelete')}</span>
            </div>
            <div className="stat-item">
              <span className="number">100%</span>
              <span className="label">{t('seo.cta.stats.privacy')}</span>
            </div>
          </div>
          <div className="trust-text">{t('seo.cta.trustText')}</div>
        </TrustIndicators>
      </CTAContent>
    </CTAContainer>
  );
};