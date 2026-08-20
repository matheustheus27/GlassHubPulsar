#!/usr/bin/env bash
# GlassHub - Fast Container Rebuild & Orchestration Script

set -e

echo -e "\033[0;36m=========================================\033[0m"
echo -e "\033[0;36m 🚀 GlassHub Container Orchestrator\033[0m"
echo -e "\033[0;36m=========================================\033[0m"

echo -e "\033[0;33m[1/3] Parando e removendo containers existentes...\033[0m"
docker compose down
echo -e "\033[0;33m[2/3] Reconstruindo imagem do backend sem cache...\033[0m"
docker compose build --no-cache backend
echo -e "\033[0;32m[3/3] Subindo ecossistema em segundo plano...\033[0m"
docker compose up -d
echo -e "\033[0;32m[4/4] Ecossistema GlassHub atualizado e ativo!\033[0m"

echo -e "\n\033[0;32m✅ Serviços em execução:\033[0m"
docker compose ps
