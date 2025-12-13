# 🌐 Atlas - Sistema de Gestão Integrada

<p align="center">
  <strong>Plataforma multimodular para gestão de prazos migratórios, ordens de serviço e processos organizacionais</strong>
</p>

---

## 📋 Visão Geral

O **Atlas** é um sistema web modular desenvolvido para empresas que lidam com gestão de estrangeiros, prazos migratórios, vínculos empresariais e processos administrativos. A plataforma foi projetada para suportar múltiplos módulos (sistemas) e departamentos, com controle de acesso granular baseado em cargos (RBAC).

### 🎯 Objetivo de Negócio

- **Centralizar** a gestão de titulares (estrangeiros) e seus dependentes
- **Controlar** prazos de documentos, vistos e regularizações
- **Gerenciar** vínculos com empresas, consulados e amparos legais
- **Automatizar** alertas de vencimento e atualizações cadastrais
- **Fornecer** visibilidade multi-departamental com segregação de acesso

---

## 🚀 Status do Projeto

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Sistema de Prazos** | ✅ Concluído | Gestão de titulares, dependentes, vínculos e prazos |
| **Ordem de Serviço** | 🔄 Planejado | Gestão de OS, tarefas e fluxos de trabalho |
| **Contratos** | 📋 Planejado | Gestão de contratos e documentos |

### ✅ Funcionalidades Implementadas

- [x] Cadastro completo de Titulares e Dependentes
- [x] Gestão de Vínculos (Empresa, Consulado, Amparo Legal)
- [x] Sistema de Permissões RBAC (Consultor, Gestor, Diretor)
- [x] Autenticação JWT com refresh token
- [x] Seleção de Sistema e Departamento por usuário
- [x] Pesquisa unificada com filtros avançados
- [x] Django Admin customizado com tema dark
- [x] Histórico de alterações (auditoria via django-simple-history)
- [x] Conformidade LGPD (exportação e anonimização de dados)

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Python | 3.12 | Linguagem principal |
| Django | 5.2.x | Framework web |
| Django REST Framework | 3.15 | APIs RESTful |
| PostgreSQL | 16 | Banco de dados |
| Redis | 7 | Cache (preparado para Celery) |
| SimpleJWT | 5.x | Autenticação JWT |
| django-simple-history | 3.x | Auditoria |

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18 | Framework UI |
| Vite | 6 | Build tool |
| React Router DOM | 6 | Roteamento SPA |
| Axios | 1.x | Cliente HTTP |
| CSS Modules | - | Estilização |

### Infraestrutura
- **Docker** + **Docker Compose** para containerização
- Volumes persistentes para dados do PostgreSQL

---

## ⚡ Quick Start

### Pré-requisitos
- Docker 24+ e Docker Compose v2
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/atlas.git
cd atlas
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

> ⚠️ **Importante:** Para produção, altere `SECRET_KEY` e `POSTGRES_PASSWORD`!

### 3. Inicie todos os serviços

```bash
docker compose up -d --build
```

Aguarde todos os containers iniciarem. Migrations e collectstatic rodam automaticamente.

### 4. Configure dados iniciais

```bash
# Criar sistemas, departamentos e cargos
docker compose exec backend python manage.py setup_access

# Configurar permissões dos cargos
docker compose exec backend python manage.py setup_cargo_permissions

# Criar superusuário
docker compose exec backend python manage.py createsuperuser
```

### 5. Acesse o sistema

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Aplicação React |
| **Backend API** | http://localhost:8000/api/ | REST API |
| **Django Admin** | http://localhost:8000/admin/ | Painel administrativo |

---

## 📁 Estrutura do Projeto

```
Atlas/
├── backend/                    # Django Backend
│   ├── apps/
│   │   ├── accounts/          # Usuários, Sistemas, Departamentos, Vínculos
│   │   ├── core/              # Tabelas auxiliares (Amparo, TipoAtualizacao)
│   │   ├── empresa/           # Gestão de Empresas
│   │   └── titulares/         # Titulares, Dependentes, VinculoTitular
│   ├── config/                # Configurações Django
│   ├── static/admin/css/      # CSS customizado do Admin
│   └── manage.py
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── context/           # Contexts (Auth, Permission, System)
│   │   ├── hooks/             # Custom hooks (useModelPermissions)
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── services/          # Serviços de API (axios)
│   │   └── utils/             # Utilitários
│   └── vite.config.js
├── docs/                       # 📚 Documentação completa
├── docker-compose.yml
└── .env.example
```

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [Setup](docs/setup.md) | Guia completo de instalação e configuração |
| [Arquitetura](docs/arquitetura.md) | Visão geral da arquitetura do sistema |
| [Backend](docs/backend.md) | Estrutura do Django, apps e modelos |
| [Frontend](docs/frontend.md) | Estrutura do React, componentes e fluxos |
| [Permissões](docs/permissoes.md) | Sistema RBAC de autenticação e autorização |
| [Melhorias](docs/melhorias.md) | Backlog de refatorações e melhorias |
| [Pesquisa Avançada](docs/PESQUISA_AVANCADA.md) | Documentação do módulo de pesquisa |

---

## 🔐 Sistema de Cargos e Permissões

O Atlas utiliza RBAC (Role-Based Access Control) nativo do Django:

| Cargo | Permissões | Descrição |
|-------|------------|-----------|
| **Consultor** | `view_*` | Apenas visualização |
| **Gestor** | `view_*`, `add_*`, `change_*` | Criação e edição |
| **Diretor** | `view_*`, `add_*`, `change_*`, `delete_*` | Acesso total |

### Modelos Protegidos
- `titular`, `dependente` (app titulares)
- `empresa` (app empresa)
- `usuario`, `usuariovinculo` (app accounts)

> 📖 Veja [docs/permissoes.md](docs/permissoes.md) para detalhes completos.

---

## 🔐 Endpoints de API

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login/` | Login (retorna JWT) |
| POST | `/api/auth/logout/` | Logout (blacklist refresh) |
| POST | `/api/auth/refresh/` | Renovar access token |
| GET | `/api/auth/user/` | Dados do usuário logado |
| GET | `/api/auth/check-permission/` | Verificar permissão específica |

### Usuários e Vínculos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/usuarios/` | Listar usuários |
| GET | `/api/v1/usuarios/me/` | Dados do usuário atual |
| GET | `/api/v1/sistemas/` | Listar sistemas disponíveis |
| GET | `/api/v1/departamentos/` | Listar departamentos |
| POST | `/api/v1/usuarios/set-context/` | Definir sistema/departamento ativo |

### Titulares e Dependentes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | `/api/v1/titulares/` | Listar/Criar titulares |
| GET/PATCH/DELETE | `/api/v1/titulares/{id}/` | Detalhe/Atualizar/Excluir titular |
| GET/POST | `/api/v1/dependentes/` | Listar/Criar dependentes |
| GET/PATCH/DELETE | `/api/v1/dependentes/{id}/` | Detalhe/Atualizar/Excluir dependente |

### Empresas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | `/api/v1/empresas/` | Listar/Criar empresas |
| GET/PATCH/DELETE | `/api/v1/empresas/{id}/` | Detalhe/Atualizar/Excluir empresa |

## 🛡️ Conformidade LGPD

O sistema implementa os principais direitos previstos na LGPD:

- ✅ **Direito de Acesso (Art. 18, II):** Exportação de todos os dados pessoais
- ✅ **Direito de Eliminação (Art. 18, VI):** Anonimização de dados
- ✅ **Registro de Consentimento:** Data e hora do consentimento armazenados
- ✅ **Histórico de Alterações:** Auditoria completa via django-simple-history
- ✅ **Controle de Marketing:** Consentimento separado para comunicações

---

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

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

<p align="center">
  Desenvolvido com ❤️ pela equipe Atlas
</p>
