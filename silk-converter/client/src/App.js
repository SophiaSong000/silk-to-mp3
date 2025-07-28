import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

// 样式组件
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
`;

const Subtitle = styled.p`
  color: #666;
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
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
`;

const FileItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

// 主组件
function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('single'); // 'single' 或 'multiple'

  // 文件拖放区域配置
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'audio/silk': ['.silk', '.amr'],
      'audio/amr': ['.amr'],
      'application/octet-stream': ['.silk', '.amr']
    },
    onDrop: acceptedFiles => {
      setFiles(acceptedFiles);
      setDownloadUrl('');
      setError('');
    }
  });

  // 处理文件上传
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('请先选择文件');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      
      if (mode === 'single' && files.length === 1) {
        // 单个文件上传
        formData.append('file', files[0]);
        
        const response = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          setDownloadUrl(`http://localhost:5000${response.data.fileUrl}`);
        }
      } else {
        // 多个文件上传并合并
        files.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await axios.post('http://localhost:5000/api/upload-multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          setDownloadUrl(`http://localhost:5000${response.data.fileUrl}`);
        }
      }
    } catch (err) {
      console.error('上传错误:', err);
      setError('文件上传或处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 切换模式
  const toggleMode = () => {
    setMode(mode === 'single' ? 'multiple' : 'single');
    setDownloadUrl('');
  };

  return (
    <Container>
      <Header>
        <Title>微信语音转换器</Title>
        <Subtitle>将微信语音文件(silk格式)转换为MP3，并可选择合并多个文件</Subtitle>
      </Header>
      
      <div>
        <Button onClick={toggleMode}>
          当前模式: {mode === 'single' ? '单文件转换' : '多文件合并'}
        </Button>
      </div>
      
      <DropzoneContainer {...getRootProps()}>
        <input {...getInputProps()} />
        <p>拖放文件到此处，或点击选择文件</p>
        <p>支持的格式: .silk, .amr</p>
      </DropzoneContainer>
      
      {files.length > 0 && (
        <div>
          <h3>已选择的文件 ({files.length}):</h3>
          <FileList>
            {files.map((file, index) => (
              <FileItem key={index}>
                {file.name} - {(file.size / 1024).toFixed(2)} KB
              </FileItem>
            ))}
          </FileList>
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? '处理中...' : mode === 'single' ? '转换为MP3' : '合并并转换为MP3'}
          </Button>
        </div>
      )}
      
      {loading && <LoadingSpinner />}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {downloadUrl && (
        <ResultContainer>
          <h3>转换完成!</h3>
          <p>您的文件已准备好下载</p>
          <DownloadLink href={downloadUrl} download>
            下载MP3文件
          </DownloadLink>
        </ResultContainer>
      )}
      
      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#666' }}>
        <p>© 2025 微信语音转换器 - 基于开源项目 silk-v3-decoder</p>
      </footer>
    </Container>
  );
}

export default App;
