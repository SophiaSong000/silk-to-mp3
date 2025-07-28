import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';

const HeroContainer = styled.section`
  padding: 60px 0;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 40px 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ProblemDescription = styled.div`
  max-width: 800px;
  margin: 0 auto 40px;
  font-size: 1.1rem;
  color: #666;
  line-height: 1.8;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SolutionHighlight = styled.div`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  margin: 40px 0;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 15px;
  }
  
  p {
    font-size: 1.1rem;
    opacity: 0.95;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    
    h3 {
      font-size: 1.3rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
`;

const KeywordList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 40px;
`;

const KeywordItem = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #007bff;
  
  h4 {
    color: #007bff;
    margin-bottom: 10px;
    font-size: 1.1rem;
  }
  
  p {
    color: #666;
    font-size: 0.95rem;
  }
`;

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <HeroContainer>
      <SectionTitle>{t('seo.hero.title')}</SectionTitle>
      
      <ProblemDescription>
        <p>{t('seo.hero.problem1')}</p>
        <p>{t('seo.hero.problem2')}</p>
        <p>{t('seo.hero.problem3')}</p>
      </ProblemDescription>

      <SolutionHighlight>
        <h3>{t('seo.hero.solutionTitle')}</h3>
        <p>{t('seo.hero.solutionDesc')}</p>
      </SolutionHighlight>

      <KeywordList>
        <KeywordItem>
          <h4>{t('seo.hero.keyword1Title')}</h4>
          <p>{t('seo.hero.keyword1Desc')}</p>
        </KeywordItem>
        <KeywordItem>
          <h4>{t('seo.hero.keyword2Title')}</h4>
          <p>{t('seo.hero.keyword2Desc')}</p>
        </KeywordItem>
        <KeywordItem>
          <h4>{t('seo.hero.keyword3Title')}</h4>
          <p>{t('seo.hero.keyword3Desc')}</p>
        </KeywordItem>
        <KeywordItem>
          <h4>{t('seo.hero.keyword4Title')}</h4>
          <p>{t('seo.hero.keyword4Desc')}</p>
        </KeywordItem>
      </KeywordList>
    </HeroContainer>
  );
};