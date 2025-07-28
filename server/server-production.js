const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 5000;

// 生产环境配置
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || (isProduction ? 'https://your-frontend-domain.vercel.app' : 'http://localhost:3003');

// 设置命令执行超时时间（毫秒）
const COMMAND_TIMEOUT = 60000; // 60秒

// 中间件 - 生产环境CORS配置
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3003', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 保留原始文件名，但添加时间戳前缀以避免冲突
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
    files: 50 // 最多50个文件
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = ['.silk', '.amr'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || file.mimetype.includes('audio')) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 工具路径检测函数
function getSilkDecoderPath() {
  // 生产环境优先检查当前目录
  const paths = [
    path.join(__dirname, 'silk_v3_decoder'),
    path.join(__dirname, 'silk_v3_decoder.exe'),
    'silk_v3_decoder'
  ];
  
  for (const silkPath of paths) {
    if (fs.existsSync(silkPath)) {
      console.log('使用silk_v3_decoder:', silkPath);
      return silkPath;
    }
  }
  
  // 检查环境变量中的silk_v3_decoder
  try {
    const whichOutput = execSync('which silk_v3_decoder 2>/dev/null || where silk_v3_decoder 2>nul', { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    if (whichOutput && whichOutput.trim()) {
      const foundPath = whichOutput.trim().split('\n')[0];
      if (foundPath && !foundPath.includes('�') && fs.existsSync(foundPath)) {
        console.log('使用系统PATH中的silk_v3_decoder:', foundPath);
        return foundPath;
      }
    }
  } catch (e) {
    console.log('silk_v3_decoder不在PATH中，使用默认路径');
  }
  
  return 'silk_v3_decoder';
}

function getFfmpegPath() {
  // 生产环境优先检查系统ffmpeg
  try {
    const whichOutput = execSync('which ffmpeg 2>/dev/null || where ffmpeg 2>nul', { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    if (whichOutput && whichOutput.trim()) {
      const foundPath = whichOutput.trim().split('\n')[0];
      if (foundPath && !foundPath.includes('�')) {
        console.log('使用系统ffmpeg:', foundPath);
        return foundPath;
      }
    }
  } catch (e) {
    console.log('使用默认ffmpeg路径');
  }
  
  return 'ffmpeg';
}

// 文件清理任务 - 定期清理临时文件
function cleanupOldFiles() {
  const directories = ['uploads', 'public'];
  const maxAge = 24 * 60 * 60 * 1000; // 24小时
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) return;
    
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        const age = Date.now() - stats.mtime.getTime();
        
        if (age > maxAge) {
          fs.removeSync(filePath);
          console.log(`清理过期文件: ${file}`);
        }
      });
    } catch (error) {
      console.error(`清理目录 ${dir} 时出错:`, error);
    }
  });
}

// 每小时执行一次清理
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// 路由
// 上传单个文件
app.post('/api/upload', (req, res, next) => {
  console.log('=== 收到 POST /api/upload 请求 ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  next();
}, upload.array('files', 50), (req, res, next) => {
  console.log('=== Multer 处理完成 ===');
  console.log('req.files:', req.files ? req.files.length : 0, '个文件');
  next();
}, async (req, res) => {
  try {
    console.log('=== API /api/upload 被调用 ===');
    
    if (!req.files || req.files.length === 0) {
      console.log('错误: 没有上传文件');
      return res.status(400).json({ error: '没有上传文件' });
    }

    console.log('接收到文件:', req.files.length, '个文件');
    
    // 打印每个文件的详细信息
    req.files.forEach((file, index) => {
      console.log(`文件 ${index + 1}:`, {
        originalname: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      });
    });
    
    // 处理每个文件，但不合并
    const results = [];
    
    for (const file of req.files) {
      console.log('处理文件:', file.originalname, '大小:', file.size, '字节');
      const inputFile = file.path;
      const outputFile = path.join(__dirname, 'public', `${Date.now()}-${path.basename(file.originalname)}.mp3`);
      
      console.log('开始转换文件:', inputFile, '到:', outputFile);
      
      // 尝试所有可能的转换方法
      let success = false;
      let error = null;
      
      // 方法1: 使用silk_v3_decoder直接转换为PCM，然后用ffmpeg转换为MP3
      try {
        console.log('尝试方法1: silk_v3_decoder + ffmpeg');
        await convertSilkToPcmToMp3(inputFile, outputFile);
        success = true;
        console.log('方法1转换成功');
      } catch (err) {
        console.error('方法1失败:', err.message);
        error = err;
      }
      
      // 方法2: 使用silk_v3_decoder转换为WAV，然后用ffmpeg转换为MP3
      if (!success) {
        try {
          console.log('尝试方法2: silk_v3_decoder -d + ffmpeg');
          await convertSilkToWavToMp3(inputFile, outputFile);
          success = true;
          console.log('方法2转换成功');
        } catch (err) {
          console.error('方法2失败:', err.message);
          error = err;
        }
      }
      
      // 方法3: 直接使用ffmpeg转换
      if (!success) {
        try {
          console.log('尝试方法3: 直接使用ffmpeg');
          await convertWithFfmpegDirect(inputFile, outputFile);
          success = true;
          console.log('方法3转换成功');
        } catch (err) {
          console.error('方法3失败:', err.message);
          error = err;
        }
      }
      
      if (success) {
        // 检查输出文件是否存在且大小大于0
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          console.log(`文件 ${file.originalname} 转换成功，输出文件: ${outputFile}`);
          console.log(`输出文件大小: ${fs.statSync(outputFile).size} 字节`);
          
          // 添加到结果列表
          const result = {
            originalName: file.originalname,
            fileUrl: `/api/download/${path.basename(outputFile)}`
          };
          console.log(`添加成功结果:`, result);
          results.push(result);
        } else {
          console.log(`文件 ${file.originalname} 转换失败: 输出文件不存在或为空`);
          const result = {
            originalName: file.originalname,
            error: '转换后的文件不存在或为空'
          };
          console.log(`添加失败结果:`, result);
          results.push(result);
        }
      } else {
        console.log(`文件 ${file.originalname} 转换失败: ${error ? error.message : '所有转换方法都失败'}`);
        const result = {
          originalName: file.originalname,
          error: error ? error.message : '所有转换方法都失败'
        };
        console.log(`添加失败结果:`, result);
        results.push(result);
      }
      
      // 清理输入文件
      try {
        fs.removeSync(inputFile);
      } catch (e) {
        console.error('清理输入文件失败:', e);
      }
    }
    
    // 返回所有文件的处理结果
    console.log('=== 准备返回结果 ===');
    console.log('处理结果:', JSON.stringify(results, null, 2));
    
    const response = { success: true, results };
    console.log('发送响应:', JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    console.error('=== 捕获到错误 ===');
    console.error('文件处理错误:', error);
    console.error('错误堆栈:', error.stack);
    
    const errorResponse = { error: '文件处理失败: ' + error.message };
    console.log('发送错误响应:', JSON.stringify(errorResponse, null, 2));
    
    res.status(500).json(errorResponse);
  }
});

// 上传多个文件并合并
app.post('/api/upload-multiple', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    console.log('接收到多个文件:', req.files.length, '个文件');
    
    // 创建一个数组来存储文件信息，包括原始文件名、路径和排序信息
    const fileInfos = [];
    
    // 获取所有上传文件的信息
    for (const file of req.files) {
      try {
        const originalName = file.originalname;
        
        let sortOrder = req.files.indexOf(file); // 默认使用上传顺序
        let sortSource = '上传顺序';
        
        // 1. 尝试从文件名前缀提取数字
        const prefixMatch = originalName.match(/^(\d+)[_\-\s.]/);
        if (prefixMatch && prefixMatch[1]) {
          sortOrder = parseInt(prefixMatch[1]);
          sortSource = '文件名前缀';
        } 
        // 2. 尝试从微信文件名中提取时间戳
        else {
          const timeMatch = originalName.match(/msg_(\d+)/);
          if (timeMatch && timeMatch[1]) {
            sortOrder = parseInt(timeMatch[1]);
            sortSource = '微信时间戳';
          } 
          // 3. 尝试获取文件的创建时间
          else {
            try {
              const stats = fs.statSync(file.path);
              sortOrder = stats.birthtimeMs || stats.mtimeMs;
              sortSource = '文件创建时间';
            } catch (statErr) {
              console.error('获取文件创建时间失败:', statErr);
            }
          }
        }
        
        fileInfos.push({
          originalName,
          path: file.path,
          sortOrder,
          sortSource
        });
      } catch (err) {
        console.error('处理文件信息时出错:', err);
        fileInfos.push({
          originalName: file.originalname,
          path: file.path,
          sortOrder: req.files.indexOf(file),
          sortSource: '默认顺序'
        });
      }
    }
    
    // 按排序值排序
    fileInfos.sort((a, b) => {
      if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
        return a.sortOrder - b.sortOrder;
      }
      return String(a.sortOrder).localeCompare(String(b.sortOrder));
    });
    
    console.log('文件已排序:');
    fileInfos.forEach((info, index) => {
      console.log(`${index + 1}. ${info.originalName} (排序依据: ${info.sortSource}, 排序值: ${info.sortOrder})`);
    });
    
    const mp3Files = [];
    
    // 转换所有SILK文件到MP3，保持排序顺序
    for (const fileInfo of fileInfos) {
      console.log('处理文件:', fileInfo.originalName);
      const inputFile = fileInfo.path;
      const outputFile = path.join(__dirname, 'uploads', `${String(fileInfo.sortOrder).padStart(10, '0')}-${path.basename(fileInfo.originalName, path.extname(fileInfo.originalName))}.mp3`);
      
      console.log('转换文件:', inputFile, '到:', outputFile);
      
      let success = false;
      
      try {
        await convertSilkToPcmToMp3(inputFile, outputFile);
        success = true;
      } catch (err) {
        console.error('方法1失败:', err.message);
        try {
          await convertSilkToWavToMp3(inputFile, outputFile);
          success = true;
        } catch (err2) {
          console.error('方法2失败:', err2.message);
          try {
            await convertWithFfmpegDirect(inputFile, outputFile);
            success = true;
          } catch (err3) {
            console.error('方法3失败:', err3.message);
          }
        }
      }
      
      if (success && fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
        mp3Files.push(outputFile);
      } else {
        console.error(`文件 ${fileInfo.originalName} 转换失败`);
      }
      
      // 清理输入文件
      try {
        fs.removeSync(inputFile);
      } catch (e) {
        console.error('清理输入文件失败:', e);
      }
    }
    
    console.log('成功转换的文件数量:', mp3Files.length);
    
    if (mp3Files.length === 0) {
      throw new Error('没有成功转换的文件可供合并');
    }
    
    // 如果只有一个文件，直接返回该文件
    if (mp3Files.length === 1) {
      console.log('只有一个文件，无需合并');
      const singleFile = mp3Files[0];
      const publicFile = path.join(__dirname, 'public', `merged-${Date.now()}.mp3`);
      
      fs.copyFileSync(singleFile, publicFile);
      
      const fileUrl = `/api/download/${path.basename(publicFile)}`;
      return res.json({ success: true, fileUrl });
    }
    
    // 合并所有MP3文件
    const mergedFile = path.join(__dirname, 'public', `merged-${Date.now()}.mp3`);
    
    let mergeSuccess = false;
    
    try {
      await mergeMp3FilesWithConcat(mp3Files, mergedFile);
      mergeSuccess = true;
    } catch (err) {
      console.error('合并方法1失败:', err.message);
      try {
        await mergeMp3FilesWithFfmpeg(mp3Files, mergedFile);
        mergeSuccess = true;
      } catch (err2) {
        console.error('合并方法2失败:', err2.message);
      }
    }
    
    // 清理临时MP3文件
    mp3Files.forEach(file => {
      try {
        fs.removeSync(file);
      } catch (e) {
        console.error('清理临时MP3文件失败:', e);
      }
    });
    
    if (!mergeSuccess) {
      throw new Error('所有合并方法都失败');
    }
    
    console.log('文件合并完成:', mergedFile);
    
    if (fs.existsSync(mergedFile) && fs.statSync(mergedFile).size > 0) {
      const fileUrl = `/api/download/${path.basename(mergedFile)}`;
      res.json({ success: true, fileUrl });
    } else {
      throw new Error('合并后的文件不存在或为空');
    }
  } catch (error) {
    console.error('文件处理错误:', error);
    res.status(500).json({ error: '文件处理失败: ' + error.message });
  }
});

// 测试API
app.get('/api/test', (req, res) => {
  console.log('测试API被调用');
  res.json({ 
    success: true, 
    message: '服务器正常工作',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tools: {
      silk_decoder: getSilkDecoderPath(),
      ffmpeg: getFfmpegPath()
    }
  });
});

// 下载文件
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', filename);
  
  console.log('请求下载文件:', filename);
  
  if (fs.existsSync(filePath)) {
    console.log('文件存在，开始下载');
    res.download(filePath, (err) => {
      if (err) {
        console.error('下载文件时出错:', err);
      } else {
        // 下载完成后可以选择删除文件（可选）
        // setTimeout(() => {
        //   try {
        //     fs.removeSync(filePath);
        //     console.log('下载完成，文件已清理:', filename);
        //   } catch (e) {
        //     console.error('清理下载文件失败:', e);
        //   }
        // }, 60000); // 1分钟后删除
      }
    });
  } else {
    console.error('文件不存在:', filePath);
    res.status(404).json({ error: '文件不存在' });
  }
});

// 转换函数（简化版，包含核心逻辑）
function convertSilkToPcmToMp3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      if (!fs.existsSync(inputFile)) {
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      const stats = fs.statSync(inputFile);
      if (stats.size === 0) {
        return reject(new Error(`输入文件为空: ${inputFile}`));
      }
      
      const pcmFile = outputFile.replace('.mp3', '.pcm');
      const outputDir = path.dirname(pcmFile);
      fs.ensureDirSync(outputDir);
      
      const silkDecoderPath = getSilkDecoderPath();
      const silkCommand = `"${silkDecoderPath}" "${inputFile}" "${pcmFile}"`;
      
      const silkProcess = exec(silkCommand, (silkError, silkStdout, silkStderr) => {
        if (silkError) {
          clearTimeout(timeoutId);
          return reject(silkError);
        }
        
        const ffmpegPath = getFfmpegPath();
        const ffmpegCommand = `"${ffmpegPath}" -f s16le -ar 24000 -ac 1 -i "${pcmFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
        
        const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
          try {
            fs.removeSync(pcmFile);
          } catch (e) {
            console.error('删除临时PCM文件失败:', e);
          }
          
          clearTimeout(timeoutId);
          
          if (ffmpegError) {
            return reject(ffmpegError);
          }
          
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            resolve();
          } else {
            reject(new Error('转换后的文件不存在或为空'));
          }
        });
        
        ffmpegProcess.on('error', (err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      });
      
      silkProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

function convertSilkToWavToMp3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      if (!fs.existsSync(inputFile)) {
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      const wavFile = outputFile.replace('.mp3', '.wav');
      const outputDir = path.dirname(wavFile);
      fs.ensureDirSync(outputDir);
      
      const silkDecoderPath = getSilkDecoderPath();
      const silkCommand = `"${silkDecoderPath}" "${inputFile}" "${wavFile}" -d`;
      
      const silkProcess = exec(silkCommand, (silkError, silkStdout, silkStderr) => {
        if (silkError) {
          clearTimeout(timeoutId);
          return reject(silkError);
        }
        
        const ffmpegPath = getFfmpegPath();
        const ffmpegCommand = `"${ffmpegPath}" -i "${wavFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
        
        const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
          try {
            fs.removeSync(wavFile);
          } catch (e) {
            console.error('删除临时WAV文件失败:', e);
          }
          
          clearTimeout(timeoutId);
          
          if (ffmpegError) {
            return reject(ffmpegError);
          }
          
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            resolve();
          } else {
            reject(new Error('转换后的文件不存在或为空'));
          }
        });
        
        ffmpegProcess.on('error', (err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      });
      
      silkProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

function convertWithFfmpegDirect(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      if (!fs.existsSync(inputFile)) {
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      const outputDir = path.dirname(outputFile);
      fs.ensureDirSync(outputDir);
      
      const ffmpegPath = getFfmpegPath();
      const ffmpegCommand = `"${ffmpegPath}" -i "${inputFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
      
      const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
        clearTimeout(timeoutId);
        
        if (ffmpegError) {
          return reject(ffmpegError);
        }
        
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          resolve();
        } else {
          reject(new Error('转换后的文件不存在或为空'));
        }
      });
      
      ffmpegProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

function mergeMp3FilesWithConcat(inputFiles, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      const tempDir = path.join(__dirname, 'temp');
      fs.ensureDirSync(tempDir);
      
      const listFile = path.join(tempDir, `filelist-${Date.now()}.txt`);
      const fileList = inputFiles.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n');
      fs.writeFileSync(listFile, fileList);
      
      const ffmpegPath = getFfmpegPath();
      const command = `"${ffmpegPath}" -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`;
      
      const childProcess = exec(command, (error, stdout, stderr) => {
        clearTimeout(timeoutId);
        
        try {
          fs.removeSync(listFile);
        } catch (e) {
          console.error('删除临时文件列表失败:', e);
        }
        
        if (error) {
          return reject(error);
        }
        
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          resolve();
        } else {
          reject(new Error('合并后的文件不存在或为空'));
        }
      });
      
      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

function mergeMp3FilesWithFfmpeg(inputFiles, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      const tempDir = path.join(__dirname, 'temp');
      fs.ensureDirSync(tempDir);
      
      let command = ffmpeg();
      
      inputFiles.forEach(file => {
        command = command.addInput(file);
      });
      
      command
        .on('error', (err) => {
          clearTimeout(timeoutId);
          reject(err);
        })
        .on('end', () => {
          clearTimeout(timeoutId);
          
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            resolve();
          } else {
            reject(new Error('合并后的文件不存在或为空'));
          }
        })
        .mergeToFile(outputFile, tempDir);
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`前端URL: ${FRONTEND_URL}`);
  
  // 检查工具可用性
  try {
    const silkPath = getSilkDecoderPath();
    const ffmpegPath = getFfmpegPath();
    console.log('silk_v3_decoder路径:', silkPath);
    console.log('ffmpeg路径:', ffmpegPath);
  } catch (e) {
    console.error('工具检查失败:', e.message);
  }
  
  // 确保必要的目录存在
  ['public', 'uploads', 'temp'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    fs.ensureDirSync(dirPath);
    console.log(`目录已创建/确认: ${dirPath}`);
  });
  
  // 执行一次清理
  cleanupOldFiles();
});