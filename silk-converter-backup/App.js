import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  background-color: ${props => props.active ? '#0088ff' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 1px solid ${props => props.active ? '#0088ff' : '#ddd'};
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 200px;
  
  &:hover {
    background-color: ${props => props.active ? '#0077ee' : '#e0e0e0'};
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
  margin-bottom: 20px;
  transition: border-color 0.3s ease;
  
  &:hover {
    border-color: #0088ff;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
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

// 主组件
function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [multipleResults, setMultipleResults] = useState([]);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('single'); // 'single' 或 'multiple'

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

  // 文件拖放区域配置
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'audio/silk': ['.silk', '.amr'],
      'audio/amr': ['.amr'],
      'application/octet-stream': ['.silk', '.amr']
    },
    onDrop: acceptedFiles => {
      // 为每个文件添加一个唯一ID
      const filesWithIds = acceptedFiles.map(file => ({
        ...file,
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      setFiles(prevFiles => [...prevFiles, ...filesWithIds]);
      setDownloadUrl('');
      setMultipleResults([]);
      setError('');
      toast.success(`已添加 ${acceptedFiles.length} 个文件`);
    }
  });

  // 处理文件上传
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('请先选择文件');
      toast.error('请先选择文件');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);
    setDownloadUrl('');
    setMultipleResults([]);
    
    try {
      const formData = new FormData();
      
      if (mode === 'single') {
        // 单个文件模式 - 分别转换每个文件
        files.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        
        if (response.data.success && response.data.results) {
          setMultipleResults(response.data.results);
          toast.success('文件转换成功！');
        }
      } else {
        // 多文件合并模式 - 合并所有文件
        files.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await axios.post('http://localhost:5000/api/upload-multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        
        if (response.data.success && response.data.fileUrl) {
          setDownloadUrl(`http://localhost:5000${response.data.fileUrl}`);
          toast.success('文件合并成功！');
        }
      }
    } catch (err) {
      console.error('上传错误:', err);
      setError('文件上传或处理失败，请重试');
      toast.error('文件处理失败，请重试');
    } finally {
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
    toast.info('文件顺序已更新');
  };

  // 移除文件
  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
    toast.info('文件已移除');
  };

  // 清空文件列表
  const clearFiles = () => {
    setFiles([]);
    setDownloadUrl('');
    setMultipleResults([]);
    toast.info('文件列表已清空');
  };

  // 批量下载所有文件
  const handleBatchDownload = async () => {
    if (multipleResults.length === 0) return;
    
    try {
      setLoading(true);
      toast.info('正在准备下载...');
      
      const zip = new JSZip();
      const promises = [];
      
      // 添加所有文件到zip
      multipleResults.forEach((result, index) => {
        if (result.fileUrl) {
          const promise = fetch(`http://localhost:5000${result.fileUrl}`)
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
      
      toast.success('批量下载完成！');
    } catch (err) {
      console.error('批量下载错误:', err);
      toast.error('批量下载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Header>
        <Title>微信语音转换器</Title>
        <Subtitle>将微信语音文件(silk格式)转换为MP3，并可选择合并多个文件</Subtitle>
      </Header>
      
      <ModeSelector>
        <ModeButton 
          active={mode === 'single'} 
          onClick={() => {
            setMode('single');
            setDownloadUrl('');
            setMultipleResults([]);
          }}
        >
          单文件转换
        </ModeButton>
        <ModeButton 
          active={mode === 'multiple'} 
          onClick={() => {
            setMode('multiple');
            setDownloadUrl('');
            setMultipleResults([]);
          }}
        >
          多文件合并
        </ModeButton>
      </ModeSelector>
      
      {mode === 'single' && (
        <InfoBox>
          <strong>单文件转换模式：</strong> 每个文件将被单独转换为MP3格式，不会合并。适合需要分别处理每个语音文件的情况。
        </InfoBox>
      )}
      
      {mode === 'multiple' && (
        <InfoBox>
          <strong>多文件合并模式：</strong> 所有文件将被转换并合并为一个MP3文件。
          {!isMobile && (
            <>
              <br />
              您可以通过拖拽调整文件顺序，确保合并后的顺序正确。
            </>
          )}
        </InfoBox>
      )}
      
      <DropzoneContainer {...getRootProps()}>
        <input {...getInputProps()} />
        <p>拖放文件到此处，或点击选择文件</p>
        <p>支持的格式: .silk, .amr</p>
      </DropzoneContainer>
      
      {files.length > 0 && (
        <div>
          <h3>已选择的文件 ({files.length}):</h3>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="droppable">
              {(provided) => (
                <FileList
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {files.map((file, index) => (
                    <Draggable key={file.id} draggableId={file.id} index={index}>
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
                            移除
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
              {loading ? '处理中...' : mode === 'single' ? '转换为MP3' : '合并并转换为MP3'}
            </Button>
            <Button onClick={clearFiles} disabled={loading}>
              清空列表
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
          <h3>转换完成!</h3>
          <p>您的合并文件已准备好下载</p>
          <DownloadLink href={downloadUrl} download>
            下载合并MP3文件
          </DownloadLink>
        </ResultContainer>
      )}
      
      {multipleResults.length > 0 && (
        <ResultContainer>
          <h3>转换完成!</h3>
          <p>您的文件已准备好下载</p>
          
          <ButtonGroup>
            <BatchDownloadButton onClick={handleBatchDownload} disabled={loading}>
              批量下载所有文件 (ZIP)
            </BatchDownloadButton>
          </ButtonGroup>
          
          <ResultList>
            {multipleResults.map((result, index) => (
              <ResultItem key={index}>
                <ResultFileName>{result.originalName}</ResultFileName>
                {result.fileUrl ? (
                  <DownloadLink href={`http://localhost:5000${result.fileUrl}`} download>
                    下载MP3文件
                  </DownloadLink>
                ) : (
                  <ResultError>转换失败: {result.error}</ResultError>
                )}
              </ResultItem>
            ))}
          </ResultList>
        </ResultContainer>
      )}
      
      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#666' }}>
        <p>© 2025 微信语音转换器 - 基于开源项目 silk-v3-decoder</p>
      </footer>
    </Container>
  );
}

export default App;