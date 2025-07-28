import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';

const TutorialContainer = styled.section`
  padding: 60px 0;
  
  @media (max-width: 768px) {
    padding: 40px 0;
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

const TutorialTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const TabButton = styled.button`
  background: ${props => props.$active ? '#007bff' : '#f8f9fa'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 2px solid ${props => props.$active ? '#007bff' : '#dee2e6'};
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? '#0056b3' : '#e9ecef'};
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TutorialContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const StepItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 15px;
  border-left: 5px solid #007bff;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    padding: 20px;
  }
`;

const StepNumber = styled.div`
  background: #007bff;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
  
  h4 {
    color: #333;
    margin-bottom: 10px;
    font-size: 1.2rem;
  }
  
  p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 10px;
  }
  
  .tip {
    background: #e3f2fd;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1976d2;
    margin-top: 10px;
  }
`;

const TryNowButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: block;
  margin: 40px auto 0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
`;

export const TutorialSection = ({ onNavigateToTool }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('single');

  const handleTryNow = () => {
    if (onNavigateToTool) {
      onNavigateToTool();
    }
  };

  return (
    <TutorialContainer>
      <SectionTitle>{t('seo.tutorial.title')}</SectionTitle>
      
      <TutorialTabs>
        <TabButton 
          $active={activeTab === 'single'} 
          onClick={() => setActiveTab('single')}
        >
          {t('seo.tutorial.singleTab')}
        </TabButton>
        <TabButton 
          $active={activeTab === 'batch'} 
          onClick={() => setActiveTab('batch')}
        >
          {t('seo.tutorial.batchTab')}
        </TabButton>
      </TutorialTabs>

      <TutorialContent>
        {activeTab === 'single' && (
          <StepList>
            <StepItem>
              <StepNumber>1</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.single.step1.title')}</h4>
                <p>{t('seo.tutorial.single.step1.desc')}</p>
                <div className="tip">{t('seo.tutorial.single.step1.tip')}</div>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>2</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.single.step2.title')}</h4>
                <p>{t('seo.tutorial.single.step2.desc')}</p>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>3</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.single.step3.title')}</h4>
                <p>{t('seo.tutorial.single.step3.desc')}</p>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>4</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.single.step4.title')}</h4>
                <p>{t('seo.tutorial.single.step4.desc')}</p>
                <div className="tip">{t('seo.tutorial.single.step4.tip')}</div>
              </StepContent>
            </StepItem>
          </StepList>
        )}

        {activeTab === 'batch' && (
          <StepList>
            <StepItem>
              <StepNumber>1</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.batch.step1.title')}</h4>
                <p>{t('seo.tutorial.batch.step1.desc')}</p>
                <div className="tip">{t('seo.tutorial.batch.step1.tip')}</div>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>2</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.batch.step2.title')}</h4>
                <p>{t('seo.tutorial.batch.step2.desc')}</p>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>3</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.batch.step3.title')}</h4>
                <p>{t('seo.tutorial.batch.step3.desc')}</p>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>4</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.batch.step4.title')}</h4>
                <p>{t('seo.tutorial.batch.step4.desc')}</p>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>5</StepNumber>
              <StepContent>
                <h4>{t('seo.tutorial.batch.step5.title')}</h4>
                <p>{t('seo.tutorial.batch.step5.desc')}</p>
                <div className="tip">{t('seo.tutorial.batch.step5.tip')}</div>
              </StepContent>
            </StepItem>
          </StepList>
        )}

        <TryNowButton onClick={handleTryNow}>
          {t('seo.tutorial.tryNow')}
        </TryNowButton>
      </TutorialContent>
    </TutorialContainer>
  );
};