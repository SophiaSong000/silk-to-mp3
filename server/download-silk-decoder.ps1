# 下载 silk_v3_decoder 工具
$url = "https://github.com/kn007/silk-v3-decoder/releases/download/v1.0.0/silk_v3_decoder_win.exe"
$output = "silk_v3_decoder.exe"

try {
    Write-Host "正在下载 silk_v3_decoder..."
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "下载完成: $output"
    
    # 检查文件是否存在
    if (Test-Path $output) {
        $fileSize = (Get-Item $output).Length
        Write-Host "文件大小: $fileSize 字节"
    }
} catch {
    Write-Error "下载失败: $_"
}