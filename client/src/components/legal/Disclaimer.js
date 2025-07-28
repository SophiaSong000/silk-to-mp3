import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Title = styled.h1`
  color: #333;
  border-bottom: 2px solid #ff6b35;
  padding-bottom: 10px;
  margin-bottom: 30px;
`;

const LastUpdated = styled.p`
  color: #666;
  font-style: italic;
  margin-bottom: 30px;
`;

const Section = styled.section`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  color: #ff6b35;
  margin-bottom: 15px;
`;

const SectionText = styled.p`
  color: #333;
  margin-bottom: 15px;
`;

const WarningBox = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  padding: 15px;
  margin: 20px 0;
  color: #856404;
`;

const BackButton = styled.button`
  background-color: #0088ff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  
  &:hover {
    background-color: #0077ee;
  }
`;

export const Disclaimer = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <Container>
      <BackButton onClick={onBack}>← 返回 / Back</BackButton>
      
      <Title>{t('disclaimer.title')}</Title>
      <LastUpdated>{t('disclaimer.lastUpdated')}</LastUpdated>

      <WarningBox>
        <strong>{t('disclaimer.legalUse')}</strong>
        <br />
        {t('disclaimer.legalUseText')}
      </WarningBox>

      <Section>
        <SectionTitle>{t('disclaimer.noWarranty')}</SectionTitle>
        <SectionText>{t('disclaimer.noWarrantyText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('disclaimer.userResponsibility')}</SectionTitle>
        <SectionText>{t('disclaimer.userResponsibilityText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('disclaimer.prohibited')}</SectionTitle>
        <SectionText>{t('disclaimer.prohibitedText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('disclaimer.limitation')}</SectionTitle>
        <SectionText>{t('disclaimer.limitationText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('disclaimer.indemnification')}</SectionTitle>
        <SectionText>{t('disclaimer.indemnificationText')}</SectionText>
      </Section>
    </Container>
  );
};