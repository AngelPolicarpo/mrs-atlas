# 🚀 Melhorias e Backlog

Este documento contém o backlog de melhorias, refatorações e próximas funcionalidades do Atlas.

---

## 📋 Índice

1. [Débitos Técnicos](#débitos-técnicos)
2. [Melhorias de Performance](#melhorias-de-performance)
3. [Novas Funcionalidades](#novas-funcionalidades)
4. [Refatorações Sugeridas](#refatorações-sugeridas)
5. [Segurança](#segurança)
6. [DevOps e Infraestrutura](#devops-e-infraestrutura)
7. [Documentação](#documentação)
8. [Priorização](#priorização)

---

## 🔧 Débitos Técnicos

### Backend

| ID | Item | Prioridade | Esforço | Descrição |
|----|------|------------|---------|-----------|
| DT-01 | Remover código legado allauth | Alta | Baixo | Remover referências residuais do django-allauth que foi substituído |
| DT-02 | Padronizar serializers | Média | Médio | Criar mixins para campos comuns (created_at, updated_at, ativo) |
| DT-03 | Adicionar testes unitários | Alta | Alto | Cobertura mínima de 80% nos models e views |
| DT-04 | Adicionar testes de integração | Média | Alto | Testar fluxos completos de CRUD |
| DT-05 | Documentar APIs com drf-spectacular | Média | Médio | Gerar OpenAPI/Swagger automático |
| DT-06 | Configurar logging estruturado | Alta | Médio | JSON logging para facilitar análise |
| DT-07 | Validações customizadas | Média | Médio | CPF, CNPJ, RNM com validação no serializer |

### Frontend

| ID | Item | Prioridade | Esforço | Descrição |
|----|------|------------|---------|-----------|
| DT-08 | Tratamento global de erros | Alta | Médio | Error boundary + toast notifications |
| DT-09 | Loading states consistentes | Média | Baixo | Skeleton loaders em todas as páginas |
| DT-10 | Formulários com React Hook Form | Média | Alto | Migrar forms para RHF + Zod validation |
| DT-11 | Testes com Vitest | Alta | Alto | Testes unitários para hooks e utils |
| DT-12 | Testes E2E com Playwright | Média | Alto | Fluxos críticos: login, CRUD |
| DT-13 | Componentização do Sidebar | Baixa | Baixo | Extrair itens de menu para configuração |

---

## ⚡ Melhorias de Performance

### Backend

| ID | Item | Impacto | Esforço | Descrição |
|----|------|---------|---------|-----------|
| PF-01 | Cache de permissões | Alto | Médio | Cachear permissões do usuário no Redis |
| PF-02 | Select related/Prefetch | Alto | Médio | Otimizar queries N+1 nos ViewSets |
| PF-03 | Paginação server-side | Alto | Baixo | Garantir paginação em todas as listagens |
| PF-04 | Índices de banco | Médio | Baixo | Adicionar índices em campos de busca frequente |
| PF-05 | Compressão de resposta | Baixo | Baixo | Habilitar GZip no Django/Nginx |

```python
# Exemplo PF-02: Otimização de queries
class TitularViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Titular.objects.filter(ativo=True).select_related(
            'empresa'
        ).prefetch_related(
            'vinculos',
            'dependentes'
        )
```

### Frontend

| ID | Item | Impacto | Esforço | Descrição |
|----|------|---------|---------|-----------|
| PF-06 | Code splitting | Alto | Médio | Lazy loading de páginas |
| PF-07 | Memoização | Médio | Médio | useMemo/useCallback em componentes pesados |
| PF-08 | Virtual scrolling | Alto | Alto | Para listagens grandes (>1000 itens) |
| PF-09 | Image optimization | Baixo | Baixo | Lazy loading de fotos de titulares |

```jsx
// Exemplo PF-06: Code splitting
const TitularList = lazy(() => import('./pages/TitularList'));
const TitularForm = lazy(() => import('./pages/TitularForm'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/titulares" element={<TitularList />} />
  </Routes>
</Suspense>
```

---

## ✨ Novas Funcionalidades

### Curto Prazo (1-2 sprints)

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| NF-01 | Exportação Excel/PDF | Exportar listagens para Excel e PDF |
| NF-02 | Filtros avançados | Filtros por data, status, nacionalidade |
| NF-03 | Dashboard com métricas | Contadores, gráficos de vencimentos |
| NF-04 | Notificações in-app | Centro de notificações no header |
| NF-05 | Histórico de alterações UI | Visualizar histórico (simple-history) |

### Médio Prazo (3-4 sprints)

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| NF-06 | Módulo Ordem de Serviço | CRUD completo de OS |
| NF-07 | Workflow de aprovação | Fluxo de aprovação para alterações |
| NF-08 | Alertas de vencimento | Email/push para prazos próximos |
| NF-09 | Upload de documentos | Anexar documentos aos titulares |
| NF-10 | Relatórios customizados | Builder de relatórios |

### Longo Prazo (5+ sprints)

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| NF-11 | App mobile (PWA) | Versão mobile do sistema |
| NF-12 | Integração com APIs externas | Receita Federal, Polícia Federal |
| NF-13 | Multi-idioma | Suporte a inglês e espanhol |
| NF-14 | Assinatura digital | Integração com certificado digital |
| NF-15 | BI integrado | Dashboard com Metabase/Superset |

---

## 🔄 Refatorações Sugeridas

### Arquitetura

| ID | Item | Impacto | Descrição |
|----|------|---------|-----------|
| RF-01 | Domain-Driven Design | Alto | Reorganizar apps por domínio de negócio |
| RF-02 | CQRS para relatórios | Médio | Separar leitura de escrita para relatórios |
| RF-03 | Event sourcing (parcial) | Alto | Para auditoria avançada |

### Backend

| ID | Item | Descrição |
|----|------|-----------|
| RF-04 | Usar dataclasses | DTOs com dataclasses para transferência |
| RF-05 | Repository pattern | Abstrair acesso a dados |
| RF-06 | Service layer | Mover lógica de negócio para services |
| RF-07 | Custom exceptions | Exceções de domínio bem definidas |

```python
# Exemplo RF-06: Service layer
# services/titular_service.py

class TitularService:
    def __init__(self, repository: TitularRepository):
        self.repository = repository
    
    def criar_titular_com_vinculo(self, dados_titular, dados_vinculo):
        """Cria titular e vínculo em transação."""
        with transaction.atomic():
            titular = self.repository.criar(dados_titular)
            self.repository.criar_vinculo(titular, dados_vinculo)
            return titular
    
    def verificar_prazos_vencendo(self, dias=30):
        """Retorna titulares com prazos vencendo."""
        return self.repository.buscar_por_prazo_vencimento(dias)
```

### Frontend

| ID | Item | Descrição |
|----|------|-----------|
| RF-08 | Zustand/Jotai | Substituir Context por state management |
| RF-09 | TanStack Query | Substituir fetching manual por React Query |
| RF-10 | Componentes headless | Extrair lógica de UI |
| RF-11 | Design system | Criar biblioteca de componentes |

```jsx
// Exemplo RF-09: TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useTitulares() {
  return useQuery({
    queryKey: ['titulares'],
    queryFn: () => titularesService.list(),
  });
}

function useDeleteTitular() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => titularesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['titulares']);
    },
  });
}
```

---

## 🔒 Segurança

| ID | Item | Prioridade | Descrição |
|----|------|------------|-----------|
| SG-01 | Rate limiting | Alta | Limitar requisições por IP/usuário |
| SG-02 | Audit logging | Alta | Log de todas as ações sensíveis |
| SG-03 | 2FA | Média | Autenticação em dois fatores |
| SG-04 | Refresh token rotation | Alta | Rotação automática de refresh tokens |
| SG-05 | CSRF protection | Alta | Verificar proteção CSRF |
| SG-06 | Input sanitization | Alta | Sanitizar inputs no backend |
| SG-07 | Secrets management | Alta | Usar Vault/AWS Secrets Manager |
| SG-08 | Dependency scanning | Média | Snyk/Dependabot para vulnerabilidades |
| SG-09 | Penetration testing | Média | Teste de penetração periódico |
| SG-10 | Data encryption | Alta | Criptografar dados sensíveis em repouso |

```python
# Exemplo SG-01: Rate limiting com django-ratelimit
from django_ratelimit.decorators import ratelimit

class LoginView(APIView):
    @ratelimit(key='ip', rate='5/m', method='POST', block=True)
    def post(self, request):
        # ... login logic
```

---

## 🐳 DevOps e Infraestrutura

| ID | Item | Prioridade | Descrição |
|----|------|------------|-----------|
| DO-01 | CI/CD Pipeline | Alta | GitHub Actions para testes e deploy |
| DO-02 | Docker multi-stage | Média | Otimizar imagens Docker |
| DO-03 | Health checks | Alta | Endpoints de health para containers |
| DO-04 | Monitoring (Prometheus) | Alta | Métricas de aplicação |
| DO-05 | Logging (ELK/Loki) | Alta | Centralização de logs |
| DO-06 | Backup automático | Alta | Backup diário do PostgreSQL |
| DO-07 | Ambiente staging | Média | Ambiente de homologação |
| DO-08 | Terraform/Ansible | Média | IaC para infraestrutura |
| DO-09 | Kubernetes | Baixa | Migração para K8s (futuro) |
| DO-10 | CDN para static | Baixa | CloudFront/Cloudflare para assets |

```yaml
# Exemplo DO-01: GitHub Actions
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: |
          docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy script
```

---

## 📝 Documentação

| ID | Item | Prioridade | Descrição |
|----|------|------------|-----------|
| DC-01 | API Reference (Swagger) | Alta | Documentação interativa de APIs |
| DC-02 | Guia de contribuição | Média | CONTRIBUTING.md |
| DC-03 | ADRs | Média | Architecture Decision Records |
| DC-04 | Diagrama de banco | Alta | ERD atualizado |
| DC-05 | Runbooks | Alta | Procedimentos operacionais |
| DC-06 | Changelog | Média | CHANGELOG.md automático |
| DC-07 | Storybook | Baixa | Documentação de componentes |

---

## 🎯 Priorização

### Matriz de Priorização

```
                    IMPACTO
                    Alto │ Médio │ Baixo
              ┌─────────┼───────┼───────┐
        Alto  │ P1 🔴   │ P2 🟠 │ P3 🟡 │
ESFORÇO       ├─────────┼───────┼───────┤
        Médio │ P2 🟠   │ P3 🟡 │ P4 🟢 │
              ├─────────┼───────┼───────┤
        Baixo │ P1 🔴   │ P2 🟠 │ P4 🟢 │
              └─────────┴───────┴───────┘
```

### Sprint Atual - Sugestões

#### 🔴 P1 - Crítico (fazer agora)
- DT-03: Testes unitários (backend)
- DT-06: Logging estruturado
- SG-01: Rate limiting
- DO-01: CI/CD Pipeline
- PF-01: Cache de permissões

#### 🟠 P2 - Alta (próxima sprint)
- DT-08: Tratamento global de erros (frontend)
- NF-01: Exportação Excel/PDF
- NF-03: Dashboard com métricas
- PF-02: Otimização de queries

#### 🟡 P3 - Média (backlog priorizado)
- DT-05: Documentação OpenAPI
- NF-05: Histórico de alterações UI
- RF-09: TanStack Query
- DO-04: Monitoring

#### 🟢 P4 - Baixa (backlog)
- DT-13: Componentização do Sidebar
- PF-09: Image optimization
- DC-07: Storybook

---

## 📊 Métricas de Acompanhamento

### Qualidade de Código
- [ ] Cobertura de testes > 80%
- [ ] 0 vulnerabilidades críticas
- [ ] Lint sem erros
- [ ] TypeScript strict mode (frontend)

### Performance
- [ ] TTFB < 200ms
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Disponibilidade
- [ ] Uptime > 99.9%
- [ ] Tempo médio de resposta < 500ms
- [ ] Taxa de erro < 0.1%

---

## 🗓️ Roadmap Visual

```
2024 Q4                    2025 Q1                    2025 Q2
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│                         │                         │                         │
│  ▓▓▓▓▓▓▓▓ CI/CD        │                         │                         │
│  ▓▓▓▓▓▓▓▓ Testes       │                         │                         │
│  ▓▓▓▓▓▓▓▓ Rate Limit   │                         │                         │
│           ▓▓▓▓▓▓▓▓ Dashboard                     │                         │
│           ▓▓▓▓▓▓▓▓ Exportação                    │                         │
│                    ▓▓▓▓▓▓▓▓ Ordem Serviço        │                         │
│                    ▓▓▓▓▓▓▓▓ Alertas              │                         │
│                              ▓▓▓▓▓▓▓▓ Documentos │                         │
│                              ▓▓▓▓▓▓▓▓ Relatórios │                         │
│                                       ▓▓▓▓▓▓▓▓ PWA                        │
│                                       ▓▓▓▓▓▓▓▓ Integrações               │
│                         │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
  ████ Infraestrutura       ████ Features            ████ Mobile/Integração
```

---

## 📞 Contato

Para discussão de prioridades ou dúvidas sobre itens do backlog:

- **Tech Lead:** [nome@empresa.com]
- **Product Owner:** [po@empresa.com]
- **Canal Slack:** #atlas-dev

---

*Última atualização: Janeiro 2025*
