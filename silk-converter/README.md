# 微信语音转换器

一个简单的Web应用，用于将微信语音文件（silk格式）转换为MP3格式，并可以合并多个文件。

## 功能特点

- 支持单个silk文件转换为MP3
- 支持多个silk文件转换并合并为一个MP3
- 简洁直观的用户界面
- 快速处理和下载

## 技术栈

- 前端：React, Axios, React-Dropzone, Styled-Components
- 后端：Node.js, Express, Multer
- 转换工具：silk-v3-decoder, FFmpeg

## 安装与使用

### 前提条件

- Node.js (v14+)
- FFmpeg
- silk-v3-decoder

### 安装silk-v3-decoder

1. 克隆silk-v3-decoder仓库
```
git clone https://github.com/kn007/silk-v3-decoder.git
```

2. 按照仓库中的说明进行编译安装

### 安装FFmpeg

- Windows: 下载安装包并添加到系统PATH
- macOS: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg`

### 安装项目依赖

1. 安装服务器依赖
```
cd silk-converter/server
npm install
```

2. 安装客户端依赖
```
cd silk-converter/client
npm install
```

### 运行应用

1. 启动服务器
```
cd silk-converter/server
npm start
```

2. 启动客户端
```
cd silk-converter/client
npm start
```

3. 在浏览器中访问 `http://localhost:3000`

## 使用方法

1. 选择模式（单文件转换或多文件合并）
2. 拖放文件或点击选择文件
3. 点击"转换为MP3"或"合并并转换为MP3"按钮
4. 等待处理完成
5. 点击下载链接获取转换后的MP3文件

## 许可证

本项目基于MIT许可证开源。

## 致谢

- [silk-v3-decoder](https://github.com/kn007/silk-v3-decoder) - 提供silk格式解码功能
- [FFmpeg](https://ffmpeg.org/) - 提供音频处理和合并功能
