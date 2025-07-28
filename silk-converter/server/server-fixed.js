const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 5000;

// 设置命令执行超时时间（毫秒）
const COMMAND_TIMEOUT = 60000; // 60秒

// 中间件 - 使用更宽松的CORS配置
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    // 保留原始文件名，但添加时间戳前缀以避免冲突
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// 工具路径检测函数
function getSilkDecoderPath() {
  // 检查是否有本地silk_v3_decoder.exe
  const localSilkDecoder = path.join(__dirname, 'silk_v3_decoder.exe');
  if (fs.existsSync(localSilkDecoder)) {
    console.log('使用本地silk_v3_decoder:', localSilkDecoder);
    return localSilkDecoder;
  }
  
  // 检查环境变量中的silk_v3_decoder
  try {
    const whichOutput = execSync('where silk_v3_decoder 2>nul', { encoding: 'utf8', timeout: 5000 });
    if (whichOutput && whichOutput.trim()) {
      const foundPath = whichOutput.trim().split('\n')[0];
      // 验证路径是否有效且不包含乱码
      if (foundPath && !foundPath.includes('�') && fs.existsSync(foundPath)) {
        console.log('使用系统PATH中的silk_v3_decoder:', foundPath);
        return foundPath;
      } else {
        console.log('系统PATH中的silk_v3_decoder路径无效，使用默认路径');
      }
    }
  } catch (e) {
    console.log('silk_v3_decoder不在PATH中，使用默认路径');
  }
  
  return 'silk_v3_decoder';
}

function getFfmpegPath() {
  // 检查是否有本地ffmpeg.exe
  const localFfmpeg = path.join(__dirname, 'ffmpeg.exe');
  if (fs.existsSync(localFfmpeg)) {
    console.log('使用本地ffmpeg:', localFfmpeg);
    return localFfmpeg;
  }
  
  // 检查环境变量中的ffmpeg
  try {
    const whichOutput = execSync('where ffmpeg 2>nul', { encoding: 'utf8', timeout: 5000 });
    if (whichOutput && whichOutput.trim()) {
      const foundPath = whichOutput.trim().split('\n')[0];
      // 验证路径是否有效且不包含乱码
      if (foundPath && !foundPath.includes('�') && fs.existsSync(foundPath)) {
        console.log('使用系统PATH中的ffmpeg:', foundPath);
        return foundPath;
      } else {
        console.log('系统PATH中的ffmpeg路径无效，使用默认路径');
      }
    }
  } catch (e) {
    console.log('ffmpeg不在PATH中，使用默认路径');
  }
  
  return 'ffmpeg';
}

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
        
        // 排序优先级：
        // 1. 文件名前缀数字（如"01_file.silk"）
        // 2. 文件名中的时间戳（如"msg_123456789.silk"）
        // 3. 文件创建时间
        // 4. 上传顺序
        
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
              // 保持默认的上传顺序
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
        // 如果处理某个文件出错，使用默认值
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
      // 如果是数字，按数字大小排序
      if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
        return a.sortOrder - b.sortOrder;
      }
      // 如果是字符串，按字符串比较
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
      // 使用排序值作为文件名前缀，确保合并后的顺序正确
      const outputFile = path.join(__dirname, 'uploads', `${String(fileInfo.sortOrder).padStart(10, '0')}-${path.basename(fileInfo.originalName, path.extname(fileInfo.originalName))}.mp3`);
      
      console.log('转换文件:', inputFile, '到:', outputFile);
      
      // 尝试所有可能的转换方法
      let success = false;
      
      // 方法1
      try {
        await convertSilkToPcmToMp3(inputFile, outputFile);
        success = true;
      } catch (err) {
        console.error('方法1失败:', err.message);
      }
      
      // 方法2
      if (!success) {
        try {
          await convertSilkToWavToMp3(inputFile, outputFile);
          success = true;
        } catch (err) {
          console.error('方法2失败:', err.message);
        }
      }
      
      // 方法3
      if (!success) {
        try {
          await convertWithFfmpegDirect(inputFile, outputFile);
          success = true;
        } catch (err) {
          console.error('方法3失败:', err.message);
        }
      }
      
      // 检查输出文件是否存在且大小大于0
      if (success && fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
        mp3Files.push(outputFile);
      } else {
        console.error(`文件 ${fileInfo.originalName} 转换失败`);
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
      
      // 复制文件到public目录
      fs.copyFileSync(singleFile, publicFile);
      
      const fileUrl = `/api/download/${path.basename(publicFile)}`;
      return res.json({ success: true, fileUrl });
    }
    
    // 合并所有MP3文件
    const mergedFile = path.join(__dirname, 'public', `merged-${Date.now()}.mp3`);
    
    // 尝试所有可能的合并方法
    let mergeSuccess = false;
    
    // 方法1
    try {
      await mergeMp3FilesWithConcat(mp3Files, mergedFile);
      mergeSuccess = true;
    } catch (err) {
      console.error('合并方法1失败:', err.message);
    }
    
    // 方法2
    if (!mergeSuccess) {
      try {
        await mergeMp3FilesWithFfmpeg(mp3Files, mergedFile);
        mergeSuccess = true;
      } catch (err) {
        console.error('合并方法2失败:', err.message);
      }
    }
    
    if (!mergeSuccess) {
      throw new Error('所有合并方法都失败');
    }
    
    console.log('文件合并完成:', mergedFile);
    
    // 检查输出文件是否存在且大小大于0
    if (fs.existsSync(mergedFile) && fs.statSync(mergedFile).size > 0) {
      // 返回合并后的文件URL
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
    timestamp: new Date().toISOString()
  });
});

// 下载文件
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', filename);
  
  console.log('请求下载文件:', filename);
  
  if (fs.existsSync(filePath)) {
    console.log('文件存在，开始下载');
    res.download(filePath);
  } else {
    console.error('文件不存在:', filePath);
    res.status(404).json({ error: '文件不存在' });
  }
});

// 方法1: 使用silk_v3_decoder转换为PCM，然后用ffmpeg转换为MP3
function convertSilkToPcmToMp3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      console.log('使用PCM中间格式转换方法');
      
      // 检查输入文件是否存在
      if (!fs.existsSync(inputFile)) {
        console.error(`输入文件不存在: ${inputFile}`);
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      // 检查输入文件大小
      const stats = fs.statSync(inputFile);
      console.log(`输入文件大小: ${stats.size} 字节`);
      if (stats.size === 0) {
        console.error(`输入文件为空: ${inputFile}`);
        return reject(new Error(`输入文件为空: ${inputFile}`));
      }
      
      // 创建临时PCM文件
      const pcmFile = outputFile.replace('.mp3', '.pcm');
      
      // 确保输出目录存在
      const outputDir = path.dirname(pcmFile);
      fs.ensureDirSync(outputDir);
      console.log(`确保输出目录存在: ${outputDir}`);
      
      const silkDecoderPath = getSilkDecoderPath();
      console.log(`silk_v3_decoder路径: ${silkDecoderPath}`);
      
      // 第一步：将silk转换为pcm
      const silkCommand = `"${silkDecoderPath}" "${inputFile}" "${pcmFile}"`;
      console.log('执行silk转pcm命令:', silkCommand);
      
      const silkProcess = exec(silkCommand, (silkError, silkStdout, silkStderr) => {
        if (silkError) {
          clearTimeout(timeoutId);
          console.error(`Silk解码错误: ${silkError}`);
          console.error(`标准错误: ${silkStderr}`);
          return reject(silkError);
        }
        
        console.log(`Silk解码输出: ${silkStdout}`);
        
        // 第二步：使用ffmpeg将pcm转换为mp3
        const ffmpegPath = getFfmpegPath();
        const ffmpegCommand = `"${ffmpegPath}" -f s16le -ar 24000 -ac 1 -i "${pcmFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
        console.log('执行ffmpeg命令:', ffmpegCommand);
        
        const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
          // 删除临时pcm文件
          try {
            fs.removeSync(pcmFile);
            console.log('临时PCM文件已删除');
          } catch (e) {
            console.error('删除临时PCM文件失败:', e);
          }
          
          clearTimeout(timeoutId);
          
          if (ffmpegError) {
            console.error(`FFmpeg转换错误: ${ffmpegError}`);
            console.error(`标准错误: ${ffmpegStderr}`);
            return reject(ffmpegError);
          }
          
          console.log(`FFmpeg输出: ${ffmpegStdout}`);
          
          // 检查输出文件
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            resolve();
          } else {
            reject(new Error('转换后的文件不存在或为空'));
          }
        });
        
        ffmpegProcess.on('error', (err) => {
          clearTimeout(timeoutId);
          console.error('FFmpeg进程错误:', err);
          reject(err);
        });
      });
      
      silkProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error('Silk进程错误:', err);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('转换过程中发生异常:', e);
      reject(e);
    }
  });
}

// 方法2: 使用silk_v3_decoder转换为WAV，然后用ffmpeg转换为MP3
function convertSilkToWavToMp3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      console.log('使用WAV中间格式转换方法');
      
      // 检查输入文件是否存在
      if (!fs.existsSync(inputFile)) {
        console.error(`输入文件不存在: ${inputFile}`);
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      // 检查输入文件大小
      const stats = fs.statSync(inputFile);
      console.log(`输入文件大小: ${stats.size} 字节`);
      if (stats.size === 0) {
        console.error(`输入文件为空: ${inputFile}`);
        return reject(new Error(`输入文件为空: ${inputFile}`));
      }
      
      // 创建临时WAV文件
      const wavFile = outputFile.replace('.mp3', '.wav');
      
      // 确保输出目录存在
      const outputDir = path.dirname(wavFile);
      fs.ensureDirSync(outputDir);
      console.log(`确保输出目录存在: ${outputDir}`);
      
      const silkDecoderPath = getSilkDecoderPath();
      console.log(`silk_v3_decoder路径: ${silkDecoderPath}`);
      
      // 第一步：将silk转换为wav
      const silkCommand = `"${silkDecoderPath}" "${inputFile}" "${wavFile}" -d`;
      console.log('执行silk转wav命令:', silkCommand);
      
      const silkProcess = exec(silkCommand, (silkError, silkStdout, silkStderr) => {
        if (silkError) {
          clearTimeout(timeoutId);
          console.error(`Silk解码错误: ${silkError}`);
          console.error(`标准错误: ${silkStderr}`);
          return reject(silkError);
        }
        
        console.log(`Silk解码输出: ${silkStdout}`);
        
        // 第二步：使用ffmpeg将wav转换为mp3
        const ffmpegPath = getFfmpegPath();
        const ffmpegCommand = `"${ffmpegPath}" -i "${wavFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
        console.log('执行ffmpeg命令:', ffmpegCommand);
        
        const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
          // 删除临时wav文件
          try {
            fs.removeSync(wavFile);
            console.log('临时WAV文件已删除');
          } catch (e) {
            console.error('删除临时WAV文件失败:', e);
          }
          
          clearTimeout(timeoutId);
          
          if (ffmpegError) {
            console.error(`FFmpeg转换错误: ${ffmpegError}`);
            console.error(`标准错误: ${ffmpegStderr}`);
            return reject(ffmpegError);
          }
          
          console.log(`FFmpeg输出: ${ffmpegStdout}`);
          
          // 检查输出文件
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            resolve();
          } else {
            reject(new Error('转换后的文件不存在或为空'));
          }
        });
        
        ffmpegProcess.on('error', (err) => {
          clearTimeout(timeoutId);
          console.error('FFmpeg进程错误:', err);
          reject(err);
        });
      });
      
      silkProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error('Silk进程错误:', err);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('转换过程中发生异常:', e);
      reject(e);
    }
  });
}

// 方法3: 直接使用ffmpeg转换
function convertWithFfmpegDirect(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      console.log('使用ffmpeg直接转换方法');
      
      // 检查输入文件是否存在
      if (!fs.existsSync(inputFile)) {
        console.error(`输入文件不存在: ${inputFile}`);
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      // 检查输入文件大小
      const stats = fs.statSync(inputFile);
      console.log(`输入文件大小: ${stats.size} 字节`);
      if (stats.size === 0) {
        console.error(`输入文件为空: ${inputFile}`);
        return reject(new Error(`输入文件为空: ${inputFile}`));
      }
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputFile);
      fs.ensureDirSync(outputDir);
      console.log(`确保输出目录存在: ${outputDir}`);
      
      const ffmpegPath = getFfmpegPath();
      console.log(`ffmpeg路径: ${ffmpegPath}`);
      
      // 尝试直接使用ffmpeg转换
      const ffmpegCommand = `"${ffmpegPath}" -i "${inputFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
      console.log('执行ffmpeg命令:', ffmpegCommand);
      
      const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
        clearTimeout(timeoutId);
        
        if (ffmpegError) {
          console.error(`FFmpeg转换错误: ${ffmpegError}`);
          console.error(`标准错误: ${ffmpegStderr}`);
          return reject(ffmpegError);
        }
        
        console.log(`FFmpeg输出: ${ffmpegStdout}`);
        
        // 检查输出文件
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          resolve();
        } else {
          reject(new Error('转换后的文件不存在或为空'));
        }
      });
      
      ffmpegProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error('FFmpeg进程错误:', err);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('转换过程中发生异常:', e);
      reject(e);
    }
  });
}

// 方法1：使用FFmpeg的concat demuxer合并MP3文件
function mergeMp3FilesWithConcat(inputFiles, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      console.log('使用concat demuxer合并文件');
      
      // 确保临时目录存在
      const tempDir = path.join(__dirname, 'temp');
      fs.ensureDirSync(tempDir);
      console.log('临时目录已创建:', tempDir);
      
      // 创建一个文本文件，列出所有要合并的文件
      const listFile = path.join(tempDir, `filelist-${Date.now()}.txt`);
      const fileList = inputFiles.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n');
      fs.writeFileSync(listFile, fileList);
      console.log('文件列表已创建:', listFile);
      console.log('文件列表内容:', fileList);
      
      const ffmpegPath = getFfmpegPath();
      // 使用FFmpeg的concat demuxer
      const command = `"${ffmpegPath}" -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`;
      console.log('执行ffmpeg命令:', command);
      
      const childProcess = exec(command, (error, stdout, stderr) => {
        clearTimeout(timeoutId);
        
        // 删除临时文件列表
        try {
          fs.removeSync(listFile);
          console.log('临时文件列表已删除');
        } catch (e) {
          console.error('删除临时文件列表失败:', e);
        }
        
        if (error) {
          console.error(`合并MP3文件错误: ${error}`);
          console.error(`FFmpeg输出: ${stderr}`);
          return reject(error);
        }
        
        console.log(`FFmpeg输出: ${stdout}`);
        
        // 检查输出文件
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          console.log('MP3文件合并完成');
          resolve();
        } else {
          reject(new Error('合并后的文件不存在或为空'));
        }
      });
      
      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error('FFmpeg进程错误:', err);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('合并过程中发生异常:', e);
      reject(e);
    }
  });
}

// 方法2：使用fluent-ffmpeg合并MP3文件
function mergeMp3FilesWithFfmpeg(inputFiles, outputFile) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      console.log('使用fluent-ffmpeg合并文件');
      
      // 确保临时目录存在
      const tempDir = path.join(__dirname, 'temp');
      fs.ensureDirSync(tempDir);
      console.log('临时目录已创建:', tempDir);
      
      let command = ffmpeg();
      
      // 添加所有输入文件
      inputFiles.forEach(file => {
        console.log('添加输入文件:', file);
        command = command.addInput(file);
      });
      
      // 合并文件
      command
        .on('start', cmdline => {
          console.log('FFmpeg命令:', cmdline);
        })
        .on('error', (err) => {
          clearTimeout(timeoutId);
          console.error('合并MP3文件错误:', err);
          reject(err);
        })
        .on('end', () => {
          clearTimeout(timeoutId);
          
          // 检查输出文件
          if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
            console.log('MP3文件合并完成');
            resolve();
          } else {
            reject(new Error('合并后的文件不存在或为空'));
          }
        })
        .mergeToFile(outputFile, tempDir);
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('合并过程中发生异常:', e);
      reject(e);
    }
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  
  // 检查必要的工具是否可用
  try {
    console.log('检查silk_v3_decoder是否可用...');
    const silkPath = getSilkDecoderPath();
    console.log('silk_v3_decoder路径:', silkPath);
  } catch (e) {
    console.error('警告: silk_v3_decoder可能不可用:', e.message);
  }
  
  try {
    console.log('检查ffmpeg是否可用...');
    const ffmpegPath = getFfmpegPath();
    console.log('ffmpeg路径:', ffmpegPath);
  } catch (e) {
    console.error('警告: ffmpeg可能不可用:', e.message);
  }
  
  // 确保必要的目录存在
  ['public', 'uploads', 'temp'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    fs.ensureDirSync(dirPath);
    console.log(`目录已创建/确认: ${dirPath}`);
  });
});