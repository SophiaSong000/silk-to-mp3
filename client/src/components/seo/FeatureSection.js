import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';

const FeatureContainer = styled.section`
  padding: 60px 0;
  background: #f8f9fa;
  margin: 60px -20px;
  
  @media (max-width: 768px) {
    padding: 40px 0;
    margin: 40px -15px;
  }
`;

const FeatureContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  text-align: center;
  margin-bottom: 50px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 30px;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 15px;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
`;

const PricingHighlight = styled.div`
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  
  h3 {
    font-size: 1.8rem;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 1.1rem;
    opacity: 0.95;
    margin-bottom: 10px;
  }
  
  .highlight {
    font-size: 1.3rem;
    font-weight: bold;
    background: rgba(255,255,255,0.2);
    padding: 10px 20px;
    border-radius: 25px;
    display: inline-block;
    margin-top: 15px;
  }
  
  @media (max-width: 768px) {
    padding: 30px 20px;
    
    h3 {
      font-size: 1.5rem;
    }
    
    p {
      font-size: 1rem;
    }
    
    .highlight {
      font-size: 1.1rem;
    }
  }
`;

export const FeatureSection = () => {
  const { t } = useTranslation();

  return (
    <FeatureContainer>
      <FeatureContent>
        <SectionTitle>{t('seo.features.title')}</SectionTitle>
        
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🆓</FeatureIcon>
            <FeatureTitle>{t('seo.features.free.title')}</FeatureTitle>
            <FeatureDescription>{t('seo.features.free.desc')}</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>{t('seo.features.fast.title')}</FeatureTitle>
            <FeatureDescription>{t('seo.features.fast.desc')}</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>{t('seo.features.secure.title')}</FeatureTitle>
            <FeatureDescription>{t('seo.features.secure.desc')}</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>📱</FeatureIcon>
            <FeatureTitle>{t('seo.features.mobile.title')}</FeatureTitle>
            <FeatureDescription>{t('seo.features.mobile.desc')}</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>🎵</FeatureIcon>
            <FeatureTitle>{t('seo.features.quality.title')}</FeatureTitle>
            <FeatureDescription>{t('seo.features.quality.desc')}</FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>📦</FeatureIcon>
            <FeatureTitle>{t('seo.features.batch.title')}</FeatureTitle>
            <FeatureDescription>{t('seo.features.batch.desc')}</FeatureDescription>
          </FeatureCard>
        </FeatureGrid>

        <PricingHighlight>
          <h3>{t('seo.pricing.title')}</h3>
          <p>{t('seo.pricing.freeDaily')}</p>
          <p>{t('seo.pricing.premiumPlan')}</p>
          <div className="highlight">{t('seo.pricing.highlight')}</div>
        </PricingHighlight>
      </FeatureContent>
    </FeatureContainer>
  );
};