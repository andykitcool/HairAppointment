# 开发环境启动脚本
param(
    [Parameter()]
    [switch]$Build,
    
    [Parameter()]
    [switch]$Logs,
    
    [Parameter()]
    [switch]$Stop,
    
    [Parameter()]
    [switch]$Restart
)

$ErrorActionPreference = "Continue"

function Show-Status {
    Write-Host "`n=== 服务状态 ===" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml ps
    
    Write-Host "`n=== 访问地址 ===" -ForegroundColor Green
    Write-Host "后端 API:   http://localhost:3100" -ForegroundColor Yellow
    Write-Host "管理后台: http://localhost:9080" -ForegroundColor Yellow
    Write-Host "MongoDB:  localhost:27018" -ForegroundColor Gray
    Write-Host "Redis:    localhost:6380" -ForegroundColor Gray
}

function Show-Logs {
    param([string]$Service = "")
    if ($Service) {
        docker compose -f docker-compose.dev.yml logs -f $Service
    } else {
        docker compose -f docker-compose.dev.yml logs -f
    }
}

if ($Stop) {
    Write-Host "停止开发环境..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml down
    exit
}

if ($Restart) {
    Write-Host "重启开发环境..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml restart
    Show-Status
    exit
}

if ($Logs) {
    Show-Logs
    exit
}

# 启动服务
Write-Host "启动开发环境..." -ForegroundColor Green

if ($Build) {
    docker compose -f docker-compose.dev.yml build --no-cache
}

docker compose -f docker-compose.dev.yml up -d

Show-Status

Write-Host "`n提示:" -ForegroundColor Cyan
Write-Host "- 查看日志: .\dev-start.ps1 -Logs"
Write-Host "- 停止服务: .\dev-start.ps1 -Stop"
Write-Host "- 重启服务: .\dev-start.ps1 -Restart"
Write-Host "- 查看API日志: docker logs -f hair-api-dev"
Write-Host "- 查看Admin日志: docker logs -f hair-admin-dev"
