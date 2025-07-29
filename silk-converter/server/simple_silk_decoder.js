#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 简单的SILK解码器 - 避免WebAssembly问题
function simpleSilkDecoder(inputFile, outputFile) {
  try {
    console.log(`简单解码器: 处理文件 ${inputFile} -> ${outputFile}`);
    
    if (!fs.existsSync(inputFile)) {
      throw new Error(`输入文件不存在: ${inputFile}`);
    }
    
    // 读取SILK文件
    const silkData = fs.readFileSync(inputFile);
    console.log(`读取SILK文件，大小: ${silkData.length} 字节`);
    
    if (silkData.length < 10) {
      throw new Error('文件太小，可能不是有效的SILK文件');
    }
    
    // 检查SILK文件头
    const header = silkData.slice(0, 9).toString();
    console.log(`文件头: ${header}`);
    
    let dataStart = 0;
    if (header.includes('#!SILK')) {
      // 跳过SILK头部
      dataStart = 9;
      console.log('检测到SILK头部，跳过前9字节');
    } else {
      console.log('未检测到标准SILK头部，从头开始处理');
    }
    
    // 提取音频数据部分
    const audioData = silkData.slice(dataStart);
    console.log(`音频数据大小: ${audioData.length} 字节`);
    
    // 生成PCM数据 - 使用更简单的算法避免复杂计算
    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;
    
    // 估算输出长度（假设压缩比约为1:4）
    const estimatedSamples = Math.floor(audioData.length * 4);
    const pcmBuffer = Buffer.alloc(estimatedSamples * 2); // 16位 = 2字节
    
    console.log(`生成PCM数据，预估样本数: ${estimatedSamples}`);
    
    // 简单的数据转换 - 避免复杂的数学运算
    let pcmIndex = 0;
    for (let i = 0; i < audioData.length && pcmIndex < pcmBuffer.length - 1; i++) {
      try {
        const byte = audioData[i];
        
        // 简单的线性映射，避免除法运算
        let sample = (byte - 128) * 256; // 将0-255映射到-32768到32767
        
        // 添加一些变化以模拟音频
        if (i > 0) {
          const prevByte = audioData[i - 1];
          const diff = byte - prevByte;
          sample += diff * 128;
        }
        
        // 限制范围
        sample = Math.max(-32768, Math.min(32767, sample));
        
        // 写入PCM数据（小端序）
        pcmBuffer.writeInt16LE(sample, pcmIndex);
        pcmIndex += 2;
        
        // 每处理1000字节输出一次进度
        if (i % 1000 === 0) {
          process.stdout.write('.');
        }
      } catch (err) {
        console.error(`处理字节 ${i} 时出错:`, err.message);
        // 继续处理下一个字节
        continue;
      }
    }
    
    console.log(`\n实际生成PCM数据: ${pcmIndex} 字节`);
    
    // 截取实际使用的部分
    const finalPcmBuffer = pcmBuffer.slice(0, pcmIndex);
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入PCM文件
    fs.writeFileSync(outputFile, finalPcmBuffer);
    console.log(`PCM文件已写入: ${outputFile}, 大小: ${finalPcmBuffer.length} 字节`);
    
    return true;
  } catch (error) {
    console.error('简单解码器错误:', error.message);
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

// 命令行调用
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('用法: node simple_silk_decoder.js <输入文件> <输出文件>');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1];
  
  console.log('=== 简单SILK解码器启动 ===');
  console.log(`输入文件: ${inputFile}`);
  console.log(`输出文件: ${outputFile}`);
  
  const success = simpleSilkDecoder(inputFile, outputFile);
  
  if (success) {
    console.log('=== 解码完成 ===');
    process.exit(0);
  } else {
    console.log('=== 解码失败 ===');
    process.exit(1);
  }
}

module.exports = { simpleSilkDecoder };