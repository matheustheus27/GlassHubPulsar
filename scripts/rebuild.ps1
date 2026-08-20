<#
.SYNOPSIS
  GlassHub - Rebuild e Inicialização Rápida dos Containers
.DESCRIPTION
  Reconstrói os containers alterados (backend/frontend) mantendo a persistência de banco de dados (Postgres) e filas (Redis).
#>

param (
    [switch]$Clean,
    [switch]$Logs
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " 🚀 GlassHub Container Orchestrator" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "[1/3] Parando e removendo containers existentes..." -ForegroundColor Yellow
docker compose down
Write-Host "[2/3] Reconstruindo imagem do backend sem cache..." -ForegroundColor Yellow
docker compose build --no-cache backend
Write-Host "[3/3] Subindo ecossistema em segundo plano..." -ForegroundColor Green
docker compose up -d

Write-Host "`n✅ Serviços em execução:" -ForegroundColor Green
docker compose ps

if ($Logs) {
    Write-Host "`n📊 Monitorando logs do backend (Pressione Ctrl+C para sair):" -ForegroundColor Cyan
    docker compose logs -f backend
}
