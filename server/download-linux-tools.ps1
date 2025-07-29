# 下载 Linux 版本的 silk_v3_decoder
$urls = @(
    @{
        url = "https://github.com/kn007/silk-v3-decoder/releases/download/v1.0.0/silk_v3_decoder_linux"
        output = "silk_v3_decoder_linux"
    }
)

foreach ($item in $urls) {
    try {
        Write-Host "正在下载: $($item.output)"
        Invoke-WebRequest -Uri $item.url -OutFile $item.output -TimeoutSec 30
        
        if (Test-Path $item.output) {
            $fileSize = (Get-Item $item.output).Length
            Write-Host "下载成功: $($item.output) (大小: $fileSize 字节)"
        }
    } catch {
        Write-Warning "下载失败: $($item.output) - $_"
    }
}

Write-Host "下载完成！"