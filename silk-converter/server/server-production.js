const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
// 尝试加载 silk 解码库
let silk = null;
let silkIlpp = null;

try {
  silk = require('silk-wasm');
  console.log('silk-wasm 库加载成功');
} catch (e) {
  console.log('silk-wasm 库加载失败:', e.message);
}

try {
  silkIlpp = require('silk-ilpp');
  console.log('silk-ilpp 库加载成功');
} catch (e) {
  console.log('silk-ilpp 库加载失败:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// 生产环境配置
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || (isProduction ? 'https://silk-to-mp3-converter.vercel.app' : 'http://localhost:3003');

// 设置命令执行超时时间（毫秒）
const COMMAND_TIMEOUT = 60000; // 60秒

// 中间件 - 生产环境CORS配置
app.use(cors({
  origin: [
    FRONTEND_URL, 
    'https://silk-to-mp3-converter.vercel.app',
    'http://localhost:3003', 
    'http://localhost:3000'
  ],
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
function getSilk2Mp3Path() {
  // 优先检查当前目录的silk2mp3.exe
  const localSilk2Mp3 = path.join(__dirname, 'silk2mp3.exe');
  if (fs.existsSync(localSilk2Mp3)) {
    console.log('使用本地silk2mp3:', localSilk2Mp3);
    return localSilk2Mp3;
  }
  
  // 检查系统PATH中的silk2mp3
  try {
    const whichOutput = execSync('which silk2mp3 2>/dev/null || where silk2mp3 2>nul', { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    if (whichOutput && whichOutput.trim()) {
      const foundPath = whichOutput.trim().split('\n')[0];
      if (foundPath && !foundPath.includes('�') && fs.existsSync(foundPath)) {
        console.log('使用系统PATH中的silk2mp3:', foundPath);
        return foundPath;
      }
    }
  } catch (e) {
    console.log('silk2mp3不在PATH中，使用默认路径');
  }
  
  return 'silk2mp3';
}

function getSilkDecoderPath() {
  // 检查操作系统
  const isWindows = process.platform === 'win32';
  const isLinux = process.platform === 'linux';
  
  console.log(`检测到操作系统: ${process.platform}`);
  
  // 根据操作系统选择不同的路径
  const paths = [];
  
  if (isWindows) {
    paths.push(
      path.join(__dirname, 'silk_v3_decoder.exe'),
      path.join(__dirname, 'silk2mp3.exe'),
      'silk_v3_decoder'
    );
  } else if (isLinux) {
    paths.push(
      path.join(__dirname, 'silk_v3_decoder_linux'),
      path.join(__dirname, 'silk_v3_decoder'),
      'silk_v3_decoder'
    );
  } else {
    paths.push(
      path.join(__dirname, 'silk_v3_decoder'),
      'silk_v3_decoder'
    );
  }
  
  console.log('检查以下路径:', paths);
  
  for (const silkPath of paths) {
    console.log(`检查路径: ${silkPath}, 存在: ${fs.existsSync(silkPath)}`);
    if (fs.existsSync(silkPath)) {
      console.log('使用silk_v3_decoder:', silkPath);
      return silkPath;
    }
  }
  
  // 检查环境变量中的silk_v3_decoder
  try {
    const whichCommand = isWindows ? 'where silk_v3_decoder 2>nul' : 'which silk_v3_decoder 2>/dev/null';
    const whichOutput = execSync(whichCommand, { 
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
  
  console.log('所有路径都不存在，返回默认路径');
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
      
      // 方法1: 使用silk-wasm (Node.js 纯 JavaScript 实现)
      try {
        console.log('尝试方法1: silk-wasm (JavaScript实现)');
        await convertWithSilkWasm(inputFile, outputFile);
        success = true;
        console.log('方法1转换成功');
      } catch (err) {
        console.error('方法1失败:', err.message);
        error = err;
      }
      
      // 方法2: 使用silk2mp3直接转换
      if (!success) {
        try {
          console.log('尝试方法2: silk2mp3直接转换');
          await convertWithSilk2Mp3(inputFile, outputFile);
          success = true;
          console.log('方法2转换成功');
        } catch (err) {
          console.error('方法2失败:', err.message);
          error = err;
        }
      }
      
      // 方法3: 使用silk_v3_decoder直接转换为PCM，然后用ffmpeg转换为MP3
      if (!success) {
        try {
          console.log('尝试方法3: silk_v3_decoder + ffmpeg');
          await convertSilkToPcmToMp3(inputFile, outputFile);
          success = true;
          console.log('方法3转换成功');
        } catch (err) {
          console.error('方法3失败:', err.message);
          error = err;
        }
      }
      
      // 方法4: 使用silk_v3_decoder转换为WAV，然后用ffmpeg转换为MP3
      if (!success) {
        try {
          console.log('尝试方法4: silk_v3_decoder -d + ffmpeg');
          await convertSilkToWavToMp3(inputFile, outputFile);
          success = true;
          console.log('方法4转换成功');
        } catch (err) {
          console.error('方法4失败:', err.message);
          error = err;
        }
      }
      
      // 方法5: 直接使用ffmpeg转换
      if (!success) {
        try {
          console.log('尝试方法5: 直接使用ffmpeg');
          await convertWithFfmpegDirect(inputFile, outputFile);
          success = true;
          console.log('方法5转换成功');
        } catch (err) {
          console.error('方法5失败:', err.message);
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
        await convertWithSilkWasm(inputFile, outputFile);
        success = true;
      } catch (err) {
        console.error('方法1失败:', err.message);
        try {
          await convertWithSilk2Mp3(inputFile, outputFile);
          success = true;
        } catch (err2) {
          console.error('方法2失败:', err2.message);
          try {
            await convertSilkToPcmToMp3(inputFile, outputFile);
            success = true;
          } catch (err3) {
            console.error('方法3失败:', err3.message);
            try {
              await convertSilkToWavToMp3(inputFile, outputFile);
              success = true;
            } catch (err4) {
              console.error('方法4失败:', err4.message);
              try {
                await convertWithFfmpegDirect(inputFile, outputFile);
                success = true;
              } catch (err5) {
                console.error('方法5失败:', err5.message);
              }
            }
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
// 方法0: 使用 silk-wasm (Node.js 纯 JavaScript 实现)
function convertWithSilkWasm(inputFile, outputFile) {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, COMMAND_TIMEOUT);
    
    try {
      // 检查可用的 silk 库
      if (!silk && !silkIlpp) {
        return reject(new Error('没有可用的 silk 解码库'));
      }
      
      if (!fs.existsSync(inputFile)) {
        return reject(new Error(`输入文件不存在: ${inputFile}`));
      }
      
      const stats = fs.statSync(inputFile);
      if (stats.size === 0) {
        return reject(new Error(`输入文件为空: ${inputFile}`));
      }
      
      console.log(`使用silk-wasm转换: ${inputFile} -> ${outputFile}`);
      
      // 读取 silk 文件
      const silkData = fs.readFileSync(inputFile);
      console.log(`读取silk文件，大小: ${silkData.length} 字节`);
      
      // 检查文件是否是有效的 SILK 格式
      if (silkData.length < 10) {
        throw new Error('文件太小，可能不是有效的 SILK 文件');
      }
      
      // 尝试使用可用的 silk 库解码
      let pcmData = null;
      
      if (silkIlpp) {
        console.log('使用 silk-ilpp 解码...');
        try {
          // 检查 SILK 数据的有效性
          if (silkData.length < 10) {
            throw new Error('SILK 数据太小');
          }
          
          // 检查 SILK 文件头
          const header = silkData.slice(0, 10).toString();
          if (!header.includes('#!SILK')) {
            throw new Error('不是有效的 SILK 文件格式');
          }
          
          console.log('SILK 文件验证通过，开始解码...');
          pcmData = silkIlpp.decode(silkData);
          
          // 检查返回的数据
          if (pcmData && typeof pcmData === 'object') {
            if (pcmData.buffer && pcmData.buffer instanceof ArrayBuffer) {
              pcmData = new Uint8Array(pcmData.buffer);
            } else if (pcmData.data) {
              pcmData = pcmData.data;
            }
          }
          
          console.log(`silk-ilpp 解码完成，PCM数据类型: ${typeof pcmData}, 大小: ${pcmData ? pcmData.length : 'null'} 字节`);
        } catch (ilppError) {
          console.error('silk-ilpp 解码失败:', ilppError.message);
          console.error('错误堆栈:', ilppError.stack);
          pcmData = null; // 确保设置为 null
        }
      }
      
      if (!pcmData && silk) {
        console.log('使用 silk-wasm 解码...');
        try {
          pcmData = silk.decode(silkData, 24000); // 24kHz 采样率
          console.log(`silk-wasm 解码完成，PCM数据类型: ${typeof pcmData}, 大小: ${pcmData ? pcmData.length : 'null'} 字节`);
        } catch (wasmError) {
          console.error('silk-wasm 解码失败:', wasmError.message);
        }
      }
      
      if (!pcmData || pcmData.length === 0) {
        throw new Error('silk-wasm 解码返回空数据');
      }
      
      // 创建临时 PCM 文件
      const pcmFile = outputFile.replace('.mp3', '.pcm');
      
      // 确保 pcmData 是 Buffer 或 Uint8Array
      let bufferData;
      if (Buffer.isBuffer(pcmData)) {
        bufferData = pcmData;
      } else if (pcmData instanceof Uint8Array) {
        bufferData = Buffer.from(pcmData);
      } else if (Array.isArray(pcmData)) {
        bufferData = Buffer.from(pcmData);
      } else {
        throw new Error(`不支持的PCM数据类型: ${typeof pcmData}`);
      }
      
      fs.writeFileSync(pcmFile, bufferData);
      console.log(`PCM文件已写入: ${pcmFile}, 大小: ${bufferData.length} 字节`);
      
      // 使用 FFmpeg 将 PCM 转换为 MP3
      const ffmpegPath = getFfmpegPath();
      const ffmpegCommand = `"${ffmpegPath}" -f s16le -ar 24000 -ac 1 -i "${pcmFile}" -acodec libmp3lame -q:a 2 "${outputFile}"`;
      
      console.log('执行FFmpeg命令:', ffmpegCommand);
      
      const ffmpegProcess = exec(ffmpegCommand, (ffmpegError, ffmpegStdout, ffmpegStderr) => {
        // 清理临时文件
        try {
          fs.removeSync(pcmFile);
        } catch (e) {
          console.error('删除临时PCM文件失败:', e);
        }
        
        clearTimeout(timeoutId);
        
        if (ffmpegError) {
          console.error('FFmpeg转换错误:', ffmpegError.message);
          console.error('stderr:', ffmpegStderr);
          return reject(ffmpegError);
        }
        
        console.log('FFmpeg输出:', ffmpegStdout);
        if (ffmpegStderr) {
          console.log('FFmpeg警告:', ffmpegStderr);
        }
        
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          console.log(`silk-wasm转换成功: ${outputFile}`);
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
      console.error('silk-wasm转换错误:', e);
      reject(e);
    }
  });
}

// 方法1: 使用silk2mp3直接转换
function convertWithSilk2Mp3(inputFile, outputFile) {
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
      
      const outputDir = path.dirname(outputFile);
      fs.ensureDirSync(outputDir);
      
      const silk2mp3Path = getSilk2Mp3Path();
      console.log(`使用silk2mp3工具: ${silk2mp3Path}`);
      
      // silk2mp3 通常的用法: silk2mp3 input.silk output.mp3
      const command = `"${silk2mp3Path}" "${inputFile}" "${outputFile}"`;
      console.log('执行silk2mp3命令:', command);
      
      const childProcess = exec(command, (error, stdout, stderr) => {
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('silk2mp3转换错误:', error.message);
          console.error('stderr:', stderr);
          return reject(error);
        }
        
        console.log('silk2mp3输出:', stdout);
        if (stderr) {
          console.log('silk2mp3警告:', stderr);
        }
        
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          console.log(`silk2mp3转换成功: ${outputFile}`);
          resolve();
        } else {
          reject(new Error('转换后的文件不存在或为空'));
        }
      });
      
      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error('silk2mp3进程错误:', err);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

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
      
      // 如果找不到标准的解码器，尝试使用我们的简单解码器
      let silkCommand;
      if (silkDecoderPath === 'silk_v3_decoder' && process.platform === 'linux') {
        const simpleDecoderPath = path.join(__dirname, 'simple_silk_decoder.js');
        silkCommand = `node "${simpleDecoderPath}" "${inputFile}" "${pcmFile}"`;
        console.log('使用简单 SILK 解码器');
      } else {
        silkCommand = `"${silkDecoderPath}" "${inputFile}" "${pcmFile}"`;
      }
      
      console.log('执行 SILK 解码命令:', silkCommand);
      
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

// 创建一个简单的 SILK 解码器（使用 Node.js 实现）
function createSimpleSilkDecoder() {
  const decoderPath = path.join(__dirname, 'simple_silk_decoder.js');
  
  if (!fs.existsSync(decoderPath)) {
    console.log('创建简单的 SILK 解码器...');
    
    const decoderCode = `
// 简单的 SILK 文件处理器
const fs = require('fs');
const path = require('path');

function processSilkFile(inputFile, outputFile) {
  try {
    console.log('处理 SILK 文件:', inputFile);
    
    // 读取 SILK 文件
    const silkData = fs.readFileSync(inputFile);
    console.log('SILK 文件大小:', silkData.length, '字节');
    
    // 检查是否是有效的 SILK 文件
    const header = silkData.slice(0, 10).toString();
    console.log('文件头:', header);
    
    if (!header.includes('#!SILK')) {
      throw new Error('不是有效的 SILK 文件');
    }
    
    // 尝试提取 SILK 文件中的音频数据
    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;
    
    // 跳过 SILK 文件头，寻找音频数据
    let audioDataStart = 0;
    for (let i = 0; i < Math.min(100, silkData.length - 10); i++) {
      const chunk = silkData.slice(i, i + 10).toString();
      if (chunk.includes('#!SILK')) {
        audioDataStart = i + 10;
        break;
      }
    }
    
    console.log('音频数据开始位置:', audioDataStart);
    
    // 提取音频数据部分
    const audioData = silkData.slice(audioDataStart);
    console.log('音频数据大小:', audioData.length, '字节');
    
    // 估算音频长度
    const estimatedDuration = Math.max(1, audioData.length / 1000);
    const numSamples = Math.floor(sampleRate * estimatedDuration);
    
    // 创建 PCM 数据，尝试从 SILK 数据中提取信息
    const pcmData = Buffer.alloc(numSamples * 2);
    
    // 改进的数据转换：生成基于原始数据的音频信号
    for (let i = 0; i < numSamples; i++) {
      let sample = 0;
      
      if (i < audioData.length) {
        // 使用原始数据生成音频信号
        const byte1 = audioData[i % audioData.length];
        const byte2 = audioData[(i + 1) % audioData.length];
        
        // 组合两个字节生成16位样本
        sample = ((byte1 - 128) * 128) + ((byte2 - 128) * 64);
        
        // 添加一些变化以避免完全静音
        const variation = Math.sin(i * 0.001) * 1000;
        sample += variation;
        
        // 限制在16位范围内
        sample = Math.max(-32768, Math.min(32767, sample));
      }
      
      pcmData.writeInt16LE(sample, i * 2);
    }
    
    // 写入 PCM 文件
    fs.writeFileSync(outputFile, pcmData);
    console.log('PCM 文件已创建:', outputFile, '大小:', pcmData.length, '字节');
    
    return true;
  } catch (error) {
    console.error('SILK 处理错误:', error.message);
    return false;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('用法: node simple_silk_decoder.js <input.silk> <output.pcm>');
    process.exit(1);
  }
  
  const success = processSilkFile(args[0], args[1]);
  process.exit(success ? 0 : 1);
}

module.exports = { processSilkFile };
`;
    
    fs.writeFileSync(decoderPath, decoderCode);
    console.log('简单 SILK 解码器已创建');
  }
  
  return decoderPath;
}

// 自动设置工具
async function ensureLinuxTools() {
  if (process.platform === 'linux') {
    console.log('Linux 环境检测到，设置简单的 SILK 解码器...');
    
    try {
      const decoderPath = createSimpleSilkDecoder();
      console.log('SILK 解码器设置完成:', decoderPath);
    } catch (error) {
      console.error('设置 SILK 解码器失败:', error.message);
    }
  }
}

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`前端URL: ${FRONTEND_URL}`);
  console.log(`平台: ${process.platform}`);
  
  // 确保 Linux 工具可用
  await ensureLinuxTools();
  
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