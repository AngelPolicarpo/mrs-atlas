# 🏛️ Atlas - Sistema de Gestão de Clientes com LGPD

Sistema completo de gestão de clientes desenvolvido com foco em conformidade com a LGPD (Lei Geral de Proteção de Dados).

## 🚀 Stack Tecnológica

- **Backend:** Python 3.12 + Django 5.x + Django REST Framework
- **Frontend:** Node 24 + React 18 + Vite 6
- **Banco de Dados:** PostgreSQL 16
- **Cache/Queue:** Redis 7 (preparado para Celery)
- **Autenticação:** django-allauth + JWT (SimpleJWT)
- **Containerização:** Docker + Docker Compose

## 📋 Pré-requisitos

- Docker 24+ e Docker Compose v2
- Git

## 🏁 Início Rápido

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd Atlas
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

> ⚠️ **Importante:** Para produção, altere `SECRET_KEY` e `POSTGRES_PASSWORD`!

### 3. Inicie todos os serviços

```bash
docker compose up --build
```

Aguarde todos os containers iniciarem. Na primeira execução, as migrações serão aplicadas automaticamente.

### 4. Crie um superusuário

Em outro terminal:

```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Acesse o sistema

| Serviço | URL |
|---------|-----|
| **Frontend (React)** | http://localhost:3000 |
| **Backend API** | http://localhost:8000/api/ |
| **Django Admin** | http://localhost:8000/admin/ |
| **API Docs** | http://localhost:8000/api/v1/ |

## 📁 Estrutura do Projeto

```
Atlas/
├── backend/                    # Django Backend
│   ├── apps/
│   │   ├── accounts/          # Usuários e autenticação
│   │   └── clients/           # Gestão de clientes
│   ├── config/                # Configurações Django
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── context/           # Context API (Auth)
│   │   ├── pages/             # Páginas da aplicação
│   │   └── services/          # Serviços de API
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔐 Endpoints de API

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login/` | Login (retorna JWT) |
| POST | `/api/auth/logout/` | Logout |
| POST | `/api/auth/registration/` | Registro de novo usuário |
| POST | `/api/token/` | Obter par de tokens JWT |
| POST | `/api/token/refresh/` | Renovar access token |
| POST | `/api/token/verify/` | Verificar token |

### Usuário
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/users/me/` | Dados do usuário logado |
| PATCH | `/api/v1/users/me/` | Atualizar perfil |
| GET | `/api/v1/users/me/export/` | LGPD: Exportar dados |
| DELETE | `/api/v1/users/me/delete/` | LGPD: Anonimizar conta |

### Clientes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/clients/` | Listar clientes |
| POST | `/api/v1/clients/` | Criar cliente |
| GET | `/api/v1/clients/{id}/` | Detalhes do cliente |
| PATCH | `/api/v1/clients/{id}/` | Atualizar cliente |
| DELETE | `/api/v1/clients/{id}/` | Excluir cliente |
| POST | `/api/v1/clients/{id}/anonymize/` | LGPD: Anonimizar |
| GET | `/api/v1/clients/{id}/export/` | LGPD: Exportar dados |

## 🛡️ Conformidade LGPD

O sistema implementa os principais direitos previstos na LGPD:

- ✅ **Direito de Acesso (Art. 18, II):** Exportação de todos os dados pessoais
- ✅ **Direito de Eliminação (Art. 18, VI):** Anonimização de dados
- ✅ **Registro de Consentimento:** Data e hora do consentimento armazenados
- ✅ **Histórico de Alterações:** Auditoria completa via django-simple-history
- ✅ **Controle de Marketing:** Consentimento separado para comunicações

## 🛠️ Comandos Úteis

### Docker

```bash
# Iniciar todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f backend

# Parar todos os serviços
docker compose down

# Rebuild completo
docker compose down && docker compose up --build

# Limpar volumes (ATENÇÃO: apaga dados!)
docker compose down -v
```

### Django

```bash
# Criar migrações
docker compose exec backend python manage.py makemigrations

# Aplicar migrações
docker compose exec backend python manage.py migrate

# Criar superusuário
docker compose exec backend python manage.py createsuperuser

# Shell do Django
docker compose exec backend python manage.py shell

# Coletar arquivos estáticos
docker compose exec backend python manage.py collectstatic
```

### Frontend

```bash
# Instalar dependências
docker compose exec frontend npm install

# Build de produção
docker compose exec frontend npm run build
```

## 🌐 Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `DEBUG` | Modo debug do Django | `True` |
| `SECRET_KEY` | Chave secreta Django | ⚠️ Alterar em produção |
| `ALLOWED_HOSTS` | Hosts permitidos | `localhost,127.0.0.1` |
| `POSTGRES_DB` | Nome do banco | `atlas_db` |
| `POSTGRES_USER` | Usuário do banco | `atlas_user` |
| `POSTGRES_PASSWORD` | Senha do banco | ⚠️ Alterar em produção |
| `VITE_API_URL` | URL da API para o frontend | `http://localhost:8000` |

## 📦 Portas

| Serviço | Porta |
|---------|-------|
| Frontend (Vite) | 3000 |
| Backend (Django) | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## 🚀 Deploy em Produção

Para produção, recomenda-se:

1. Usar `gunicorn` ao invés do servidor de desenvolvimento Django
2. Configurar HTTPS com Nginx/Traefik
3. Alterar `DEBUG=False`
4. Gerar uma nova `SECRET_KEY`
5. Configurar senhas fortes para o banco
6. Usar volumes externos para dados persistentes
7. Configurar backup automático do PostgreSQL

## 📄 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com ❤️ para conformidade com LGPD
