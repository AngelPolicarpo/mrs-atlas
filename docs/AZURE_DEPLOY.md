# 🚀 Deploy do Atlas na Microsoft Azure

## 📊 Análise Arquitetural e Decisão de Serviços

### Visão Geral do Projeto

| Componente | Tecnologia | Containerizado |
|------------|------------|----------------|
| **Backend** | Django 5.x + DRF | ✅ Dockerfile |
| **Frontend** | React 18 + Vite | ✅ Dockerfile |
| **Database** | PostgreSQL 16 | ✅ Docker |
| **Cache** | Redis 7 | ✅ Docker |

### Comparativo de Serviços Azure

| Critério | Azure Container Apps | Azure App Service | Azure Kubernetes (AKS) |
|----------|---------------------|-------------------|------------------------|
| **Complexidade** | ⭐⭐ Baixa | ⭐ Muito Baixa | ⭐⭐⭐⭐⭐ Alta |
| **Custo (10 users)** | 💰 ~$30-50/mês | 💰 ~$50-80/mês | 💰💰 ~$150+/mês |
| **Containers nativos** | ✅ Sim | ⚠️ Parcial | ✅ Sim |
| **Multi-container** | ✅ Nativo | ❌ Precisa workaround | ✅ Nativo |
| **Scale to zero** | ✅ Sim | ❌ Não | ❌ Não |
| **Curva aprendizado** | Média | Baixa | Alta |
| **Manutenção** | Baixa | Baixa | Alta |

### 🏆 Decisão: **Azure Container Apps**

**Justificativas:**

1. **Você já tem Docker** - Container Apps usa suas imagens diretamente, sem reescrever nada
2. **Multi-container nativo** - Backend, Frontend, Redis funcionam como no docker-compose
3. **Scale to zero** - Para 10 usuários, a app pode "dormir" e economizar
4. **Custo ótimo** - Paga apenas pelo uso real (~$30-50/mês estimado)
5. **Managed PostgreSQL** - Azure Database for PostgreSQL é mais seguro que rodar em container
6. **Simplicidade** - Não precisa gerenciar Kubernetes, mas tem os benefícios de containers

> ⚠️ **Por que NÃO Azure App Service?**
> App Service é excelente para apps simples, mas sua arquitetura multi-container (backend + frontend + redis) fica complicada. Você precisaria de múltiplos App Services ou gambiarras.

> ⚠️ **Por que NÃO AKS?**
> Kubernetes é overengineering para 10 usuários. A complexidade e custo não se justificam.

---

## 🗺️ Arquitetura Final na Azure

```
┌─────────────────────────────────────────────────────────────────┐
│                        AZURE CLOUD                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Resource Group: rg-atlas-prod               │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │        Container Apps Environment               │    │    │
│  │  │  ┌──────────────┐    ┌──────────────┐          │    │    │
│  │  │  │   Frontend   │    │   Backend    │          │    │    │
│  │  │  │  (React/Vite)│───▶│ (Django/DRF) │          │    │    │
│  │  │  │   Port 3000  │    │  Port 8000   │          │    │    │
│  │  │  └──────────────┘    └──────┬───────┘          │    │    │
│  │  │                             │                   │    │    │
│  │  │  ┌──────────────┐          │                   │    │    │
│  │  │  │    Redis     │◀─────────┤                   │    │    │
│  │  │  │  (Cache)     │          │                   │    │    │
│  │  │  └──────────────┘          │                   │    │    │
│  │  └────────────────────────────┼───────────────────┘    │    │
│  │                               │                         │    │
│  │  ┌────────────────────────────▼───────────────────┐    │    │
│  │  │     Azure Database for PostgreSQL              │    │    │
│  │  │     (Flexible Server - Burstable B1ms)         │    │    │
│  │  └────────────────────────────────────────────────┘    │    │
│  │                                                         │    │
│  │  ┌─────────────────┐    ┌─────────────────┐           │    │
│  │  │ Container       │    │  Azure Storage  │           │    │
│  │  │ Registry (ACR)  │    │  (Media Files)  │           │    │
│  │  └─────────────────┘    └─────────────────┘           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Pré-requisitos

### 1. Conta Azure
- Crie uma conta em [portal.azure.com](https://portal.azure.com)
- Para teste, use o [Azure Free Tier](https://azure.microsoft.com/free/) ($200 de crédito)

### 2. Ferramentas Locais

```bash
# Instalar Azure CLI
# Linux (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# macOS
brew install azure-cli

# Windows (PowerShell como Admin)
winget install Microsoft.AzureCLI

# Verificar instalação
az --version
```

### 3. Login na Azure

```bash
# Fazer login (abre navegador)
az login

# Verificar conta ativa
az account show

# Listar subscriptions (se tiver mais de uma)
az account list --output table

# Selecionar subscription (se necessário)
az account set --subscription "NOME_DA_SUBSCRIPTION"
```

---

# 🚀 Passo a Passo de Deploy (Detalhado)

## 1️⃣ Preparação do Ambiente Azure

### 1.1 Definir variáveis de ambiente (terminal)

```bash
# Copie e cole no terminal - ajuste conforme necessário
export RESOURCE_GROUP="rg-atlas-prod"
export LOCATION="brazilsouth"
export ACR_NAME="atlascontainerreg$(openssl rand -hex 4)"  # Nome único
export ENVIRONMENT_NAME="atlas-env"
export POSTGRES_SERVER="atlas-postgres-$(openssl rand -hex 4)"
export POSTGRES_DB="atlas_db"
export POSTGRES_USER="atlas_admin"
export POSTGRES_PASSWORD="$(openssl rand -base64 24)"  # Senha forte automática

# Guardar a senha em lugar seguro!
echo "🔐 POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "Anote esta senha! Você precisará dela."
```

### 1.2 Criar Resource Group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Verificar criação
az group show --name $RESOURCE_GROUP --output table
```

### 1.3 Criar Azure Container Registry (ACR)

O ACR é onde suas imagens Docker serão armazenadas.

```bash
# Criar registry (SKU Basic é suficiente para dev/pequeno)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Obter credenciais
export ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
export ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
export ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "📦 ACR Server: $ACR_LOGIN_SERVER"
echo "👤 ACR Username: $ACR_USERNAME"
```

---

## 2️⃣ Provisionamento do Banco de Dados

### 2.1 Criar Azure Database for PostgreSQL

```bash
# Criar servidor PostgreSQL (Flexible Server - mais barato)
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user $POSTGRES_USER \
  --admin-password "$POSTGRES_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0-255.255.255.255

# ⏳ Este comando leva 3-5 minutos
```

> 💡 **Nota sobre `public-access`**: Estamos permitindo acesso público temporariamente para facilitar o setup. Depois vamos restringir.

### 2.2 Criar o banco de dados

```bash
# Criar database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name $POSTGRES_DB

# Obter connection string
export POSTGRES_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"
echo "🐘 PostgreSQL Host: $POSTGRES_HOST"
```

### 2.3 Testar conexão (opcional)

```bash
# Se tiver psql instalado
psql "host=$POSTGRES_HOST dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD sslmode=require"
```

---

## 3️⃣ Build e Push das Imagens Docker

### 3.1 Preparar Dockerfiles para Produção

Primeiro, vamos criar Dockerfiles otimizados para produção.

#### Backend (Dockerfile.prod)

Crie o arquivo `backend/Dockerfile.prod`:

```bash
cat > backend/Dockerfile.prod << 'EOF'
# ===================================
# Backend Django - Produção
# ===================================
FROM python:3.12-slim as builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# ===================================
# Imagem final
# ===================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

# Runtime deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar wheels e instalar
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copiar código
COPY . .

# Criar diretórios
RUN mkdir -p /app/staticfiles /app/media

# Usuário não-root
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Gunicorn para produção
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "config.wsgi:application"]
EOF
```

#### Frontend (Dockerfile.prod)

Crie o arquivo `frontend/Dockerfile.prod`:

```bash
cat > frontend/Dockerfile.prod << 'EOF'
# ===================================
# Frontend React - Build
# ===================================
FROM node:24-alpine as builder

WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm ci --only=production=false

# Build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ===================================
# Nginx para servir arquivos estáticos
# ===================================
FROM nginx:alpine

# Configuração nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config para SPA
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
EOF
```

### 3.2 Login no ACR e Build das Imagens

```bash
# Ir para pasta do projeto
cd /home/god/Projetos/Atlas

# Login no Azure Container Registry
az acr login --name $ACR_NAME

# Build e push do Backend
docker build -t $ACR_LOGIN_SERVER/atlas-backend:latest -f backend/Dockerfile.prod ./backend
docker push $ACR_LOGIN_SERVER/atlas-backend:latest

# Build e push do Frontend (com URL da API)
# A URL será configurada depois, mas precisamos buildar
docker build \
  -t $ACR_LOGIN_SERVER/atlas-frontend:latest \
  -f frontend/Dockerfile.prod \
  --build-arg VITE_API_URL="" \
  ./frontend
docker push $ACR_LOGIN_SERVER/atlas-frontend:latest

echo "✅ Imagens enviadas para: $ACR_LOGIN_SERVER"
```

---

## 4️⃣ Deploy no Azure Container Apps

### 4.1 Criar o Container Apps Environment

```bash
# Instalar/atualizar extensão do Container Apps
az extension add --name containerapp --upgrade

# Criar environment (rede virtual gerenciada)
az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Verificar criação
az containerapp env show \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### 4.2 Criar Container App do Redis

```bash
az containerapp create \
  --name atlas-redis \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image redis:7-alpine \
  --target-port 6379 \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.25 \
  --memory 0.5Gi

# Obter FQDN interno do Redis
export REDIS_HOST="atlas-redis.internal.${ENVIRONMENT_NAME}.brazilsouth.azurecontainerapps.io"
echo "📮 Redis Host: $REDIS_HOST"
```

### 4.3 Gerar SECRET_KEY segura

```bash
export DJANGO_SECRET_KEY=$(openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c 50)
echo "🔑 Django Secret Key gerada"
```

### 4.4 Criar Container App do Backend

```bash
az containerapp create \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_LOGIN_SERVER/atlas-backend:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    DEBUG=False \
    SECRET_KEY="$DJANGO_SECRET_KEY" \
    ALLOWED_HOSTS="*" \
    CORS_ALLOWED_ORIGINS="*" \
    DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?sslmode=require" \
    REDIS_URL="redis://${REDIS_HOST}:6379/0"

# Obter URL do backend
export BACKEND_URL=$(az containerapp show \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "🌐 Backend URL: https://$BACKEND_URL"
```

### 4.5 Executar Migrations

```bash
# Executar migrations via comando único
az containerapp exec \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --command "python manage.py migrate"

# Criar superuser (interativo)
az containerapp exec \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --command "python manage.py createsuperuser"

# Collectstatic
az containerapp exec \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --command "python manage.py collectstatic --noinput"
```

### 4.6 Rebuild e Deploy do Frontend com URL correta

```bash
# Rebuildar frontend com URL do backend
docker build \
  -t $ACR_LOGIN_SERVER/atlas-frontend:latest \
  -f frontend/Dockerfile.prod \
  --build-arg VITE_API_URL="https://$BACKEND_URL" \
  ./frontend

docker push $ACR_LOGIN_SERVER/atlas-frontend:latest

# Criar Container App do Frontend
az containerapp create \
  --name atlas-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_LOGIN_SERVER/atlas-frontend:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.25 \
  --memory 0.5Gi

# Obter URL do frontend
export FRONTEND_URL=$(az containerapp show \
  --name atlas-frontend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "🎨 Frontend URL: https://$FRONTEND_URL"
```

### 4.7 Atualizar CORS do Backend

```bash
# Atualizar variáveis de ambiente com URLs corretas
az containerapp update \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    ALLOWED_HOSTS="$BACKEND_URL,localhost" \
    CORS_ALLOWED_ORIGINS="https://$FRONTEND_URL,http://localhost:3000"
```

---

## 5️⃣ Configurações de Segurança

### 5.1 Restringir Acesso ao PostgreSQL

```bash
# Obter IPs do Container Apps Environment
# (Primeiro, precisamos identificar os IPs de saída)

# Remover acesso público amplo
az postgres flexible-server firewall-rule delete \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAll \
  --yes

# Permitir serviços Azure (Container Apps)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 5.2 Usar Azure Key Vault para Secrets (Opcional, Recomendado)

```bash
# Criar Key Vault
export KEYVAULT_NAME="kv-atlas-$(openssl rand -hex 4)"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Armazenar secrets
az keyvault secret set --vault-name $KEYVAULT_NAME --name "django-secret-key" --value "$DJANGO_SECRET_KEY"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "postgres-password" --value "$POSTGRES_PASSWORD"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "database-url" --value "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?sslmode=require"

echo "🔐 Secrets armazenados no Key Vault: $KEYVAULT_NAME"
```

### 5.3 Habilitar HTTPS (Automático)

O Azure Container Apps já fornece HTTPS automático com certificados gerenciados. Verifique:

```bash
az containerapp show \
  --name atlas-frontend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress
```

---

## 6️⃣ Monitoramento e Logs

### 6.1 Ver Logs em Tempo Real

```bash
# Logs do backend
az containerapp logs show \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --follow

# Logs do frontend
az containerapp logs show \
  --name atlas-frontend \
  --resource-group $RESOURCE_GROUP \
  --follow
```

### 6.2 Criar Application Insights (Opcional)

```bash
# Criar Application Insights
az monitor app-insights component create \
  --app atlas-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Obter Instrumentation Key
export APP_INSIGHTS_KEY=$(az monitor app-insights component show \
  --app atlas-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

echo "📊 Application Insights Key: $APP_INSIGHTS_KEY"
```

### 6.3 Configurar Alertas de Custo

```bash
# Criar budget de $50/mês
az consumption budget create \
  --budget-name "atlas-budget" \
  --amount 50 \
  --category Cost \
  --time-grain Monthly \
  --resource-group $RESOURCE_GROUP \
  --notifications "{\"Actual_GreaterThan_80_Percent\":{\"enabled\":true,\"operator\":\"GreaterThan\",\"threshold\":80,\"contactEmails\":[\"seu-email@exemplo.com\"]}}"
```

---

## 7️⃣ Comandos Úteis para Manutenção

### Atualizar Aplicação (CI/CD Manual)

```bash
# Rebuildar e fazer push
docker build -t $ACR_LOGIN_SERVER/atlas-backend:latest -f backend/Dockerfile.prod ./backend
docker push $ACR_LOGIN_SERVER/atlas-backend:latest

# Atualizar container app (puxar nova imagem)
az containerapp update \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_LOGIN_SERVER/atlas-backend:latest
```

### Escalar Manualmente

```bash
# Escalar backend para 2 réplicas
az containerapp update \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 1 \
  --max-replicas 5
```

### Ver Status dos Containers

```bash
az containerapp list \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### Reiniciar Container

```bash
# Forçar novo deployment (reinicia)
az containerapp revision restart \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --revision $(az containerapp revision list --name atlas-backend --resource-group $RESOURCE_GROUP --query "[0].name" -o tsv)
```

---

## 8️⃣ Estimativa de Custos

### Cenário: 10 Usuários Simultâneos

| Serviço | SKU | Custo Estimado/Mês |
|---------|-----|-------------------|
| Container Apps (Backend) | 0.5 vCPU, 1GB | ~$15 |
| Container Apps (Frontend) | 0.25 vCPU, 0.5GB | ~$8 |
| Container Apps (Redis) | 0.25 vCPU, 0.5GB | ~$8 |
| PostgreSQL Flexible | B1ms (1 vCPU, 2GB) | ~$15 |
| Container Registry | Basic | ~$5 |
| Storage (logs) | Mínimo | ~$2 |
| **TOTAL** | | **~$53/mês** |

> 💡 Com **Scale to Zero**, quando ninguém estiver usando, os Container Apps param e você paga quase nada pelo compute.

---

## 9️⃣ Troubleshooting

### Erro: "Connection refused" ao acessar PostgreSQL

```bash
# Verificar firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER

# Verificar se servidor está rodando
az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --query state
```

### Erro: "Image pull failed"

```bash
# Verificar se imagem existe no ACR
az acr repository list --name $ACR_NAME

# Verificar credenciais
az acr credential show --name $ACR_NAME
```

### Erro: "Application Error" no Frontend

```bash
# Verificar se VITE_API_URL está correto
# O frontend precisa ser rebuildado quando a URL do backend muda

# Verificar logs
az containerapp logs show --name atlas-frontend --resource-group $RESOURCE_GROUP --follow
```

### Backend não responde

```bash
# Verificar réplicas ativas
az containerapp revision list \
  --name atlas-backend \
  --resource-group $RESOURCE_GROUP \
  --output table

# Verificar se está em 0 réplicas (scale to zero)
# Se sim, uma requisição irá "acordar" a app (pode demorar ~10s)
```

---

## 🔟 Próximos Passos (Melhorias Futuras)

1. **Custom Domain**: Adicionar domínio próprio (ex: atlas.suaempresa.com)
2. **CI/CD**: Configurar GitHub Actions para deploy automático
3. **Backup Automático**: Configurar backups do PostgreSQL
4. **WAF**: Adicionar Web Application Firewall para segurança extra
5. **CDN**: Azure CDN para assets estáticos do frontend

---

## 📝 Resumo das URLs e Credenciais

Ao final do deploy, você terá:

```
🌐 Frontend: https://{atlas-frontend}.brazilsouth.azurecontainerapps.io
🔧 Backend API: https://{atlas-backend}.brazilsouth.azurecontainerapps.io
🐘 PostgreSQL: {atlas-postgres-xxx}.postgres.database.azure.com
📦 Container Registry: {atlascontainerregxxx}.azurecr.io
```

> ⚠️ **IMPORTANTE**: Salve todas as senhas geradas em um local seguro (Key Vault, gerenciador de senhas, etc.)

---

## ❓ Dúvidas Frequentes

**P: Posso usar o Free Tier da Azure?**
R: Sim! O Free Tier oferece $200 de crédito por 30 dias, suficiente para testar tudo.

**P: E se eu precisar de mais performance?**
R: Basta aumentar `--cpu` e `--memory` nos Container Apps, ou mudar o SKU do PostgreSQL.

**P: Como faço backup do banco?**
R: O Azure Database for PostgreSQL tem backup automático. Para backup manual: `pg_dump`.

**P: Posso usar meu próprio domínio?**
R: Sim! Use `az containerapp hostname add` após configurar o DNS.

---

*Documentação criada em Dezembro/2025 para o projeto Atlas.*
