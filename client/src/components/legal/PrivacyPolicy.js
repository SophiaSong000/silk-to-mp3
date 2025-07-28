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
  border-bottom: 2px solid #0088ff;
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
  color: #0088ff;
  margin-bottom: 15px;
`;

const SectionText = styled.p`
  color: #333;
  margin-bottom: 15px;
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

export const PrivacyPolicy = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <Container>
      <BackButton onClick={onBack}>← 返回 / Back</BackButton>
      
      <Title>{t('privacy.title')}</Title>
      <LastUpdated>{t('privacy.lastUpdated')}</LastUpdated>

      <Section>
        <SectionTitle>{t('privacy.dataCollection')}</SectionTitle>
        <SectionText>{t('privacy.dataCollectionText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('privacy.dataUsage')}</SectionTitle>
        <SectionText>{t('privacy.dataUsageText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('privacy.dataRetention')}</SectionTitle>
        <SectionText>{t('privacy.dataRetentionText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('privacy.dataSecurity')}</SectionTitle>
        <SectionText>{t('privacy.dataSecurityText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('privacy.userRights')}</SectionTitle>
        <SectionText>{t('privacy.userRightsText')}</SectionText>
      </Section>

      <Section>
        <SectionTitle>{t('privacy.contact')}</SectionTitle>
        <SectionText>{t('privacy.contactText')}</SectionText>
      </Section>
    </Container>
  );
};