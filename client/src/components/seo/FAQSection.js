import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/useTranslation';

const FAQContainer = styled.section`
  padding: 60px 0;
  background: #f8f9fa;
  margin: 60px -20px;
  
  @media (max-width: 768px) {
    padding: 40px 0;
    margin: 40px -15px;
  }
`;

const FAQContent = styled.div`
  max-width: 800px;
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

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FAQItem = styled.div`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const FAQQuestion = styled.button`
  width: 100%;
  padding: 25px;
  background: none;
  border: none;
  text-align: left;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    font-size: 1rem;
  }
`;

const FAQIcon = styled.span`
  font-size: 1.2rem;
  transition: transform 0.3s ease;
  transform: ${props => props.$isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
`;

const FAQAnswer = styled.div`
  padding: ${props => props.$isOpen ? '0 25px 25px' : '0 25px'};
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  
  p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 15px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul {
    color: #666;
    padding-left: 20px;
    
    li {
      margin-bottom: 8px;
    }
  }
  
  .highlight {
    background: #e3f2fd;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
    margin: 15px 0;
    
    strong {
      color: #1976d2;
    }
  }
  
  @media (max-width: 768px) {
    padding: ${props => props.$isOpen ? '0 20px 20px' : '0 20px'};
  }
`;

export const FAQSection = () => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = React.useState(new Set([0])); // 默认打开第一个

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      question: t('seo.faq.q1.question'),
      answer: t('seo.faq.q1.answer')
    },
    {
      question: t('seo.faq.q2.question'),
      answer: t('seo.faq.q2.answer')
    },
    {
      question: t('seo.faq.q3.question'),
      answer: t('seo.faq.q3.answer')
    },
    {
      question: t('seo.faq.q4.question'),
      answer: t('seo.faq.q4.answer')
    },
    {
      question: t('seo.faq.q5.question'),
      answer: t('seo.faq.q5.answer')
    },
    {
      question: t('seo.faq.q6.question'),
      answer: t('seo.faq.q6.answer')
    },
    {
      question: t('seo.faq.q7.question'),
      answer: t('seo.faq.q7.answer')
    },
    {
      question: t('seo.faq.q8.question'),
      answer: t('seo.faq.q8.answer')
    }
  ];

  return (
    <FAQContainer>
      <FAQContent>
        <SectionTitle>{t('seo.faq.title')}</SectionTitle>
        
        <FAQList>
          {faqData.map((item, index) => (
            <FAQItem key={index}>
              <FAQQuestion onClick={() => toggleItem(index)}>
                {item.question}
                <FAQIcon $isOpen={openItems.has(index)}>+</FAQIcon>
              </FAQQuestion>
              <FAQAnswer $isOpen={openItems.has(index)}>
                <div dangerouslySetInnerHTML={{ __html: item.answer }} />
              </FAQAnswer>
            </FAQItem>
          ))}
        </FAQList>
      </FAQContent>
    </FAQContainer>
  );
};