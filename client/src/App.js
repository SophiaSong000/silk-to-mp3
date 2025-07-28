import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { useTranslation } from './hooks/useTranslation';
import { LanguageSwitcher } from './components/LanguageSwitcher';

// 样式组件
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  margin-top: 60px; /* 为语言切换器留出空间 */
`;

const Title = styled.h1`
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Subtitle = styled.p`
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const ModeButton = styled.button`
  background-color: ${props => props.$active ? '#0088ff' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 1px solid ${props => props.$active ? '#0088ff' : '#ddd'};
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 200px;
  
  &:hover {
    background-color: ${props => props.$active ? '#0077ee' : '#e0e0e0'};
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    font-size: 14px;
  }
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #ccc;
  border-radius: 5px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 10px;
  transition: border-color 0.3s ease;
  
  &:hover {
    border-color: #0088ff;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const ConsentNotice = styled.p`
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const ConsentLink = styled.span`
  color: #0088ff;
  text-decoration: underline;
  cursor: pointer;
  
  &:hover {
    color: #0077ee;
  }
`;

const Button = styled.button`
  background-color: #0088ff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  margin-right: 10px;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 8px 16px;
    display: block;
    width: 100%;
    margin-bottom: 10px;
  }
`;

const FileList = styled.div`
  margin-bottom: 20px;
`;

const FileItem = styled.div`
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FileDetails = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  
  @media (max-width: 768px) {
    margin-bottom: 10px;
    width: 100%;
  }
`;

const DragHandle = styled.div`
  margin-right: 10px;
  color: #999;
  cursor: grab;
`;

const FileName = styled.span`
  word-break: break-all;
`;

const FileSize = styled.span`
  color: #999;
  margin-left: 10px;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 5px;
    display: block;
  }
`;

const RemoveButton = styled.button`
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: #cc0000;
  }
`;

const ResultContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 5px;
  background-color: #f9f9f9;
`;

const DownloadLink = styled.a`
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 10px;
  margin-right: 10px;
  
  &:hover {
    background-color: #45a049;
  }
  
  @media (max-width: 768px) {
    display: block;
    text-align: center;
    margin-bottom: 10px;
  }
`;

const BatchDownloadButton = styled.button`
  display: inline-block;
  background-color: #ff9800;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 10px;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: #e68a00;
  }
  
  @media (max-width: 768px) {
    display: block;
    width: 100%;
    margin-bottom: 10px;
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  background-color: #f0f0f0;
  border-radius: 5px;
  margin-top: 10px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 10px;
  background-color: #4CAF50;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 2s linear infinite;
  margin: 20px auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid red;
  border-radius: 5px;
  background-color: #ffeeee;
`;

const InfoBox = styled.div`
  background-color: #e8f4ff;
  border: 1px solid #b3e0ff;
  border-radius: 5px;
  padding: 10px 15px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #0066cc;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const ResultList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ResultItem = styled.li`
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  background-color: #f9f9f9;
`;

const ResultFileName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

const ResultError = styled.div`
  color: red;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Footer = styled.footer`
  margin-top: 50px;
  text-align: center;
  color: #666;
  font-size: 14px;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const LegalLinks = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 15px;
    flex-direction: column;
    align-items: center;
  }
`;

const LegalLink = styled.button`
  background: none;
  border: none;
  color: #0088ff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  
  &:hover {
    color: #0077ee;
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

// 主组件
function App({ onShowPrivacy, onShowTerms, onShowDisclaimer }) {
  const { t, isLoading: translationLoading } = useTranslation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [multipleResults, setMultipleResults] = useState([]);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('single'); // 'single' 或 'multiple'

  // API基础URL配置 - 移到组件顶部
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://silk-converter-api.onrender.com';

  // 检测移动设备
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 避免未使用变量警告
  console.log('Mobile device:', isMobile);

  // 文件拖放区域配置
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'audio/silk': ['.silk'],
      'application/octet-stream': ['.silk']
    },
    onDrop: acceptedFiles => {
      console.log('=== onDrop 接收到文件 ===');
      console.log('文件数量:', acceptedFiles.length);
      
      // 为每个文件添加一个唯一ID，但保持原始File对象的完整性
      const filesWithIds = acceptedFiles.map(file => {
        console.log('处理文件:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        // 创建一个新的File对象，确保所有属性都正确
        const newFile = new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified
        });
        
        // 添加唯一ID作为自定义属性
        newFile.id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        console.log('创建的新文件对象:', {
          name: newFile.name,
          size: newFile.size,
          type: newFile.type,
          id: newFile.id
        });
        
        return newFile;
      });

      setFiles(prevFiles => [...prevFiles, ...filesWithIds]);
      setDownloadUrl('');
      setMultipleResults([]);
      setError('');
      toast.success(`${t('messages.filesAdded', 'files added')}: ${acceptedFiles.length}`);
    }
  });

  // 处理文件上传
  const handleUpload = async () => {
    console.log('=== 开始处理文件上传 ===');
    console.log('文件数量:', files.length);
    console.log('当前模式:', mode);

    if (files.length === 0) {
      console.log('错误: 没有选择文件');
      setError(t('messages.noFilesSelected'));
      toast.error(t('messages.noFilesSelected'));
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);
    setDownloadUrl('');
    setMultipleResults([]);

    try {
      const formData = new FormData();

      console.log('准备上传的文件:');
      files.forEach((file, index) => {
        console.log(`文件 ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          constructor: file.constructor.name,
          isFile: file instanceof File,
          isBlob: file instanceof Blob
        });
      });

      if (mode === 'single') {
        // 单个文件模式 - 分别转换每个文件
        files.forEach((file) => {
          console.log(`添加文件到FormData: ${file.name}, 大小: ${file.size}, 类型: ${file.type}`);
          
          // 确保文件对象是有效的File对象
          if (!(file instanceof File)) {
            console.error('警告: 文件对象不是File实例:', file);
          }
          
          formData.append('files', file);
        });

        // 检查FormData内容
        console.log('FormData内容:');
        for (let pair of formData.entries()) {
          console.log(pair[0], ':', pair[1]);
        }

        console.log('发送请求到 /api/upload');

        const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        console.log('收到服务器响应:', response.data);

        if (response.data.success && response.data.results) {
          console.log('转换成功，结果:', response.data.results);
          
          // 详细检查每个结果
          response.data.results.forEach((result, index) => {
            console.log(`结果 ${index + 1}:`, {
              originalName: result.originalName,
              fileUrl: result.fileUrl,
              error: result.error,
              hasFileUrl: !!result.fileUrl,
              hasError: !!result.error
            });
          });
          
          setMultipleResults(response.data.results);
          toast.success(t('messages.conversionSuccess'));
        } else {
          console.log('响应格式不正确或转换失败');
          console.log('response.data.success:', response.data.success);
          console.log('response.data.results:', response.data.results);
          console.log('完整响应数据:', response.data);

          // 即使服务器返回success: true，但如果results为空或有错误，也要显示错误
          if (response.data.success && response.data.results && response.data.results.length > 0) {
            // 检查是否所有文件都转换失败
            const hasSuccessfulConversion = response.data.results.some(result => result.fileUrl);
            if (hasSuccessfulConversion) {
              setMultipleResults(response.data.results);
              toast.success(t('messages.conversionSuccess'));
            } else {
              setError(t('errors.conversionFailed'));
              toast.error(t('errors.conversionFailed'));
            }
          } else {
            setError(t('errors.serverError'));
            toast.error(t('errors.serverError'));
          }
        }
      } else {
        // 多文件合并模式 - 合并所有文件
        files.forEach(file => {
          formData.append('files', file);
        });

        const response = await axios.post(`${API_BASE_URL}/api/upload-multiple`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        if (response.data.success && response.data.fileUrl) {
          setDownloadUrl(`${API_BASE_URL}${response.data.fileUrl}`);
          toast.success(t('messages.conversionSuccess'));
        }
      }
    } catch (err) {
      console.error('=== 前端捕获到错误 ===');
      console.error('错误对象:', err);
      console.error('错误响应:', err.response);
      console.error('错误数据:', err.response?.data);
      console.error('错误状态:', err.response?.status);
      console.error('错误消息:', err.message);

      // 显示具体的服务器错误信息
      if (err.response?.data) {
        console.error('服务器错误详情:', JSON.stringify(err.response.data, null, 2));
        const errorMsg = err.response.data.error || JSON.stringify(err.response.data);
        setError(`${t('errors.serverError')}: ${errorMsg}`);
        toast.error(`${t('errors.serverError')}: ${errorMsg}`);
      } else {
        setError(t('errors.uploadFailed'));
        toast.error(t('errors.uploadFailed'));
      }
    } finally {
      console.log('=== 上传处理完成 ===');
      setLoading(false);
    }
  };

  // 处理文件排序
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(files);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFiles(items);
    toast.info(t('messages.fileRemoved'));
  };

  // 移除文件
  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
    toast.info(t('messages.fileRemoved'));
  };

  // 清空文件列表
  const clearFiles = () => {
    setFiles([]);
    setDownloadUrl('');
    setMultipleResults([]);
    toast.info(t('messages.listCleared'));
  };

  // 批量下载所有文件
  const handleBatchDownload = async () => {
    if (multipleResults.length === 0) return;

    try {
      setLoading(true);
      toast.info(t('messages.downloadPreparing'));

      const zip = new JSZip();
      const promises = [];

      // 添加所有文件到zip
      multipleResults.forEach((result) => {
        if (result.fileUrl) {
          const promise = fetch(`${API_BASE_URL}${result.fileUrl}`)
            .then(response => response.blob())
            .then(blob => {
              // 使用原始文件名，但扩展名改为mp3
              const originalName = result.originalName;
              const fileName = originalName.substring(0, originalName.lastIndexOf('.')) + '.mp3';
              zip.file(fileName, blob);
            });

          promises.push(promise);
        }
      });

      // 等待所有文件下载完成
      await Promise.all(promises);

      // 生成zip文件并下载
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `微信语音转换_${new Date().toISOString().slice(0, 10)}.zip`);

      toast.success(t('messages.batchDownloadComplete'));
    } catch (err) {
      console.error('批量下载错误:', err);
      toast.error(t('messages.batchDownloadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 如果翻译还在加载中，显示加载状态
  if (translationLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <LanguageSwitcher />
      <ToastContainer position="top-right" autoClose={3000} />

      <Header>
        <Title>{t('title')}</Title>
        <Subtitle>{t('subtitle')}</Subtitle>
      </Header>

      <ModeSelector>
        <ModeButton
          $active={mode === 'single'}
          onClick={() => {
            setMode('single');
            setDownloadUrl('');
            setMultipleResults([]);
          }}
        >
          {t('modes.single')}
        </ModeButton>
        <ModeButton
          $active={mode === 'multiple'}
          onClick={() => {
            setMode('multiple');
            setDownloadUrl('');
            setMultipleResults([]);
          }}
        >
          {t('modes.multiple')}
        </ModeButton>
      </ModeSelector>

      {mode === 'single' && (
        <InfoBox>
          <strong>{t('modes.single')}：</strong> {t('modeDescriptions.single')}
        </InfoBox>
      )}

      {mode === 'multiple' && (
        <InfoBox>
          <strong>{t('modes.multiple')}：</strong> {t('modeDescriptions.multiple')}
        </InfoBox>
      )}

      <DropzoneContainer {...getRootProps()}>
        <input {...getInputProps()} />
        <p>{t('dropzone.text')}</p>
        <p>{t('dropzone.supportedFormats')}</p>
      </DropzoneContainer>

      <ConsentNotice>
        {t('legal.uploadConsent')}{' '}
        <ConsentLink onClick={onShowTerms}>
          {t('legal.termsOfService')}
        </ConsentLink>
        {' '}{t('legal.uploadConsentAnd')}{' '}
        <ConsentLink onClick={onShowPrivacy}>
          {t('legal.privacyPolicy')}
        </ConsentLink>
      </ConsentNotice>

      {files.length > 0 && (
        <div>
          <h3>{t('fileList.title')} ({files.length} {t('fileList.count')}):</h3>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="droppable" isDropDisabled={false}>
              {(provided) => (
                <FileList
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {files.map((file, index) => (
                    <Draggable key={file.id} draggableId={file.id} index={index} isDragDisabled={false}>
                      {(provided) => (
                        <FileItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <FileDetails>
                            <DragHandle {...provided.dragHandleProps}>
                              ⋮⋮
                            </DragHandle>
                            <FileName>{file.name}</FileName>
                            <FileSize>({(file.size / 1024).toFixed(2)} KB)</FileSize>
                          </FileDetails>
                          <RemoveButton onClick={() => removeFile(file.id)}>
                            {t('buttons.remove')}
                          </RemoveButton>
                        </FileItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </FileList>
              )}
            </Droppable>
          </DragDropContext>

          <ButtonGroup>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? t('status.processing') : mode === 'single' ? t('buttons.convertSingle') : t('buttons.convertMultiple')}
            </Button>
            <Button onClick={clearFiles} disabled={loading}>
              {t('buttons.clearList')}
            </Button>
          </ButtonGroup>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <ProgressContainer>
              <ProgressBar progress={uploadProgress} />
            </ProgressContainer>
          )}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {downloadUrl && (
        <ResultContainer>
          <h3>{t('status.mergeComplete')}</h3>
          <p>{t('status.multipleDescription')}</p>
          <DownloadLink href={downloadUrl} download>
            {t('buttons.download')}
          </DownloadLink>
        </ResultContainer>
      )}

      {multipleResults.length > 0 && (
        <ResultContainer>
          <h3>{t('status.conversionComplete')}</h3>
          <p>{t('status.singleDescription')}</p>

          <ButtonGroup>
            <BatchDownloadButton onClick={handleBatchDownload} disabled={loading}>
              {t('buttons.batchDownload')}
            </BatchDownloadButton>
          </ButtonGroup>

          <ResultList>
            {multipleResults.map((result, index) => (
              <ResultItem key={index}>
                <ResultFileName>{result.originalName}</ResultFileName>
                {result.fileUrl ? (
                  <DownloadLink href={`${API_BASE_URL}${result.fileUrl}`} download>
                    {t('buttons.download')}
                  </DownloadLink>
                ) : (
                  <ResultError>{t('messages.conversionError')}: {result.error}</ResultError>
                )}
              </ResultItem>
            ))}
          </ResultList>
        </ResultContainer>
      )}

      <Footer>
        <p>{t('footer.copyright')}</p>
        <LegalLinks>
          <LegalLink onClick={onShowPrivacy}>
            {t('legal.privacyPolicy')}
          </LegalLink>
          <LegalLink onClick={onShowTerms}>
            {t('legal.termsOfService')}
          </LegalLink>
          <LegalLink onClick={onShowDisclaimer}>
            {t('legal.disclaimer')}
          </LegalLink>
        </LegalLinks>
      </Footer>
    </Container>
  );
}

export default App;