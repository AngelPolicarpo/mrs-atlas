# 🚀 Guia de Setup e Configuração

Este documento descreve como configurar o ambiente de desenvolvimento do Atlas do zero.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação com Docker](#instalação-com-docker)
3. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
4. [Setup de Dados Iniciais](#setup-de-dados-iniciais)
5. [Desenvolvimento Local (Sem Docker)](#desenvolvimento-local-sem-docker)
6. [Comandos Úteis](#comandos-úteis)
7. [Solução de Problemas](#solução-de-problemas)

---

## 📦 Pré-requisitos

### Para desenvolvimento com Docker (Recomendado)
- **Docker** 24+ 
- **Docker Compose** v2+
- **Git**

### Para desenvolvimento local (Sem Docker)
- **Python** 3.12+
- **Node.js** 20+ (LTS)
- **PostgreSQL** 16
- **Redis** 7
- **Git**

---

## 🐳 Instalação com Docker

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/atlas.git
cd atlas
```

### 2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite conforme necessário (opcional para desenvolvimento)
nano .env
```

### 3. Inicie os Containers

```bash
# Build e start de todos os serviços
docker compose up -d --build

# Acompanhe os logs (aguarde migrations completarem)
docker compose logs -f backend
```

O startup do backend automaticamente executa:
- `python manage.py migrate`
- `python manage.py collectstatic --noinput`

### 4. Configure Dados Iniciais

```bash
# Criar sistemas, departamentos e cargos padrão
docker compose exec backend python manage.py setup_access

# Configurar permissões dos cargos (Consultor, Gestor, Diretor)
docker compose exec backend python manage.py setup_cargo_permissions

# Criar superusuário admin
docker compose exec backend python manage.py createsuperuser
```

### 5. Verificar Instalação

Acesse os serviços:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/

---

## ⚙️ Configuração de Variáveis de Ambiente

### Arquivo `.env`

```env
# ===== Django =====
DEBUG=True
SECRET_KEY=sua-chave-secreta-aqui-mude-em-producao
ALLOWED_HOSTS=localhost,127.0.0.1

# ===== Database =====
POSTGRES_DB=atlas_db
POSTGRES_USER=atlas_user
POSTGRES_PASSWORD=atlas_secret
DATABASE_URL=postgres://atlas_user:atlas_secret@db:5432/atlas_db

# ===== Redis =====
REDIS_URL=redis://redis:6379/0

# ===== Frontend =====
VITE_API_URL=http://localhost:8000

# ===== CORS =====
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Variáveis Importantes

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `SECRET_KEY` | ✅ | Chave criptográfica do Django |
| `DEBUG` | ✅ | Modo debug (False em produção) |
| `DATABASE_URL` | ✅ | String de conexão PostgreSQL |
| `ALLOWED_HOSTS` | ✅ | Hosts permitidos |
| `VITE_API_URL` | ✅ | URL da API para o frontend |
| `CORS_ALLOWED_ORIGINS` | ✅ | Origens permitidas para CORS |

---

## 🗃️ Setup de Dados Iniciais

### Management Commands Disponíveis

#### `setup_access`
Cria sistemas, departamentos e cargos padrão:

```bash
docker compose exec backend python manage.py setup_access
```

**Sistemas criados:**
- `prazos` - Sistema de Prazos Migratórios
- `ordem_servico` - Sistema de Ordens de Serviço

**Departamentos criados:**
- `consular` - Departamento Consular
- `juridico` - Departamento Jurídico
- `ti` - Tecnologia da Informação
- `rh` - Recursos Humanos

**Cargos (Groups) criados:**
- `Consultor` - Visualização apenas
- `Gestor` - Criação e edição
- `Diretor` - Acesso total

#### `setup_cargo_permissions`
Configura as permissões de cada cargo:

```bash
docker compose exec backend python manage.py setup_cargo_permissions
```

**Permissões por cargo:**

| Cargo | view | add | change | delete |
|-------|------|-----|--------|--------|
| Consultor | ✅ | ❌ | ❌ | ❌ |
| Gestor | ✅ | ✅ | ✅ | ❌ |
| Diretor | ✅ | ✅ | ✅ | ✅ |

---

## 💻 Desenvolvimento Local (Sem Docker)

### Backend (Django)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar banco local
export DATABASE_URL=postgres://usuario:senha@localhost:5432/atlas_db

# Migrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Setup inicial
python manage.py setup_access
python manage.py setup_cargo_permissions

# Rodar servidor
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Configurar API URL
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Rodar em desenvolvimento
npm run dev
```

### PostgreSQL Local

```bash
# Criar banco de dados
createdb atlas_db

# Ou via psql
psql -U postgres
CREATE DATABASE atlas_db;
CREATE USER atlas_user WITH PASSWORD 'atlas_secret';
GRANT ALL PRIVILEGES ON DATABASE atlas_db TO atlas_user;
```

### Redis Local

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Mac (Homebrew)
brew install redis
brew services start redis
```

---

## 🛠️ Comandos Úteis

### Docker

```bash
# Iniciar serviços
docker compose up -d

# Parar serviços
docker compose down

# Ver logs
docker compose logs -f [serviço]

# Rebuild após mudanças no Dockerfile
docker compose up -d --build

# Limpar volumes (CUIDADO: apaga dados!)
docker compose down -v

# Shell no container
docker compose exec backend bash
docker compose exec frontend sh
```

### Django

```bash
# Dentro do container backend
docker compose exec backend python manage.py <comando>

# Comandos comuns
python manage.py makemigrations           # Criar migrations
python manage.py migrate                  # Aplicar migrations
python manage.py createsuperuser          # Criar admin
python manage.py shell                    # Shell Python/Django
python manage.py dbshell                  # Shell do PostgreSQL
python manage.py collectstatic           # Coletar arquivos estáticos
python manage.py showmigrations          # Ver status das migrations
```

### Frontend

```bash
# Dentro do container frontend
docker compose exec frontend npm run <comando>

# Comandos comuns
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Verificar código
```

---

## 🔧 Solução de Problemas

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs backend

# Verificar se portas estão em uso
sudo lsof -i :8000
sudo lsof -i :3000
sudo lsof -i :5432
```

### Erro de conexão com banco

```bash
# Verificar se postgres está rodando
docker compose ps

# Testar conexão
docker compose exec backend python manage.py dbshell

# Recriar volume do banco (CUIDADO: apaga dados!)
docker compose down -v
docker compose up -d
```

### Migrations não aplicadas

```bash
# Verificar status
docker compose exec backend python manage.py showmigrations

# Forçar migration de app específico
docker compose exec backend python manage.py migrate accounts

# Resetar migrations (CUIDADO!)
docker compose exec backend python manage.py migrate accounts zero
```

### Frontend não conecta à API

1. Verificar se backend está rodando: http://localhost:8000/api/
2. Verificar CORS no Django settings
3. Verificar `VITE_API_URL` no frontend
4. Limpar cache do browser

### Permissões não funcionando

```bash
# Recriar permissões
docker compose exec backend python manage.py setup_cargo_permissions

# Verificar permissões de um usuário via Django Admin
# http://localhost:8000/admin/auth/user/{id}/change/
```

---

## 📊 Portas Utilizadas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend | 3000 | React/Vite dev server |
| Backend | 8000 | Django API |
| PostgreSQL | 5432 | Banco de dados |
| Redis | 6379 | Cache/Queue |

---

## 🔗 Próximos Passos

Após o setup, consulte:
- [Arquitetura](arquitetura.md) - Entenda a estrutura do sistema
- [Backend](backend.md) - Detalhes dos apps Django
- [Frontend](frontend.md) - Estrutura do React
- [Permissões](permissoes.md) - Sistema de autorização
