import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';
import { HeroSection } from './HeroSection';
import { FeatureSection } from './FeatureSection';
import { TutorialSection } from './TutorialSection';
import { FAQSection } from './FAQSection';
import { CTASection } from './CTASection';

const SEOContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const SEOHeader = styled.header`
  text-align: center;
  padding: 60px 0 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 60px;
  
  @media (max-width: 768px) {
    padding: 40px 0 30px;
    margin-bottom: 40px;
  }
`;

const MainTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const QuickStartButton = styled.button`
  background-color: #ff6b6b;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.1rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  &:hover {
    background-color: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 12px 24px;
    font-size: 1rem;
  }
`;

export const SEOPage = ({ onNavigateToTool }) => {
  const { t } = useTranslation();

  const handleQuickStart = () => {
    if (onNavigateToTool) {
      onNavigateToTool();
    }
  };

  return (
    <div>
      <SEOHeader>
        <SEOContainer>
          <MainTitle>{t('seo.mainTitle')}</MainTitle>
          <Subtitle>{t('seo.subtitle')}</Subtitle>
          <QuickStartButton onClick={handleQuickStart}>
            {t('seo.quickStart')}
          </QuickStartButton>
        </SEOContainer>
      </SEOHeader>

      <SEOContainer>
        <HeroSection />
        <FeatureSection />
        <TutorialSection onNavigateToTool={onNavigateToTool} />
        <FAQSection />
        <CTASection onNavigateToTool={onNavigateToTool} />
      </SEOContainer>
    </div>
  );
};