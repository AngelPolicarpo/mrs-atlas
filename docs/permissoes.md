# 🔐 Sistema de Permissões e Controle de Acesso

Este documento detalha o sistema completo de autenticação, autorização e controle de acesso do Atlas.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Backend: Classes de Permissão](#backend-classes-de-permissão)
4. [Frontend: Contextos e Guards](#frontend-contextos-e-guards)
5. [Fluxo de Verificação Completo](#fluxo-de-verificação-completo)
6. [Isolamento por Sistema](#isolamento-por-sistema)
7. [Isolamento por Recurso](#isolamento-por-recurso)
8. [Estrutura de Cargos e Permissões](#estrutura-de-cargos-e-permissões)
9. [API: Headers e Configuração](#api-headers-e-configuração)
10. [Troubleshooting](#troubleshooting)
11. [Melhorias Futuras](#melhorias-futuras)

---

## 🎯 Visão Geral

O Atlas implementa um sistema de controle de acesso em **três camadas**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 1: SISTEMA                            │
│  Usuário só acessa rotas do sistema que tem acesso              │
│  (prazos, ordem_servico)                                        │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA 2: CARGO (RBAC)                       │
│  Permissões Django via Groups (Consultor, Gestor, Diretor)      │
│  Determina ações: view, add, change, delete, admin              │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA 3: RECURSO                            │
│  Permissões específicas por model/recurso                       │
│  Ex: pode ver Empresa mas não Contrato                          │
└─────────────────────────────────────────────────────────────────┘
```

### Conceitos Principais

| Conceito | Django | Atlas | Descrição |
|----------|--------|-------|-----------|
| **Sistema** | - | Sistema | Módulo do sistema (Prazos, OS) |
| **Role** | Group | Cargo | Função do usuário |
| **Permission** | Permission | Permissão | Ação permitida |
| **Resource** | Model | Recurso | Entidade protegida |

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos

```
backend/
├── apps/accounts/
│   ├── permissions.py      # Classes de permissão DRF
│   ├── models.py           # User, Sistema, UsuarioVinculo
│   └── views.py            # Auth endpoints

frontend/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx        # Autenticação (login, logout, user)
│   │   └── PermissionContext.jsx  # Permissões (hasPermission, sistema ativo)
│   ├── components/
│   │   ├── PermissionGuard.jsx         # Guard de permissão por ação
│   │   ├── SistemaRouteGuard.jsx       # Guard de rota por sistema
│   │   ├── GlobalPermissionNotification.jsx  # Notificações de 403
│   │   └── ProtectedPage.jsx           # Wrapper para páginas protegidas
│   ├── config/
│   │   └── sistemasRoutes.js    # Mapeamento de rotas por sistema
│   └── services/
│       └── api.js               # Interceptors e silent403
```

### Fluxo de Requisição

```
Frontend                          Backend
   │                                 │
   │ 1. Usuário acessa rota          │
   ├──────────────────────────────►  │
   │                                 │
   │    SistemaRouteGuard            │
   │    (verifica sistema)           │
   │                                 │
   │ 2. API Request com headers      │
   │    Authorization: Bearer xxx    │
   │    X-Active-Sistema: prazos     │
   ├──────────────────────────────►  │
   │                                 │
   │                            IsAuthenticated
   │                            SistemaPermission
   │                            CargoBasedPermission
   │                                 │
   │ 3. Response ou 403              │
   ◄──────────────────────────────┤  │
   │                                 │
   │    Se 403: dispatchPermissionDenied()
   │    (a menos que silent403=true)
   │                                 │
```

---

## 🔧 Backend: Classes de Permissão

### Localização: `backend/apps/accounts/permissions.py`

### 1. SistemaPermission

Verifica se o usuário tem acesso ao **sistema** da rota.

```python
class SistemaPermission(permissions.BasePermission):
    """
    Verifica se o usuário tem acesso ao SISTEMA da rota.
    Garante isolamento entre sistemas (prazos, ordem_servico).
    """
    
    def has_permission(self, request, view):
        # Identificar qual sistema a rota pertence
        required_sistema = get_sistema_for_route(request.path, view)
        
        # Se a rota é compartilhada (None), permite
        if required_sistema is None:
            return True
        
        # Verificar se usuário tem acesso ao sistema
        user_sistemas = request.user.get_sistemas()
        return required_sistema in [s.codigo for s in user_sistemas]
```

**Mapeamento de Rotas:**

```python
# Rotas compartilhadas (acessíveis por todos os sistemas)
SHARED_ROUTES = {
    'titulares', 'empresa', 'core', 'accounts', 'contratos'
}

# Rotas exclusivas por sistema
SISTEMA_ROUTES = {
    'prazos': {'pesquisa'},
    'ordem_servico': {
        'ordem_servico', 'ordens-servico', 'empresas-prestadoras',
        'servicos', 'tipos-despesa', 'os-itens', 'despesas-os'
    }
}
```

### 2. CargoBasedPermission

Verifica permissões Django baseadas no cargo (Group).

```python
class CargoBasedPermission(permissions.BasePermission):
    """
    Permissão baseada no Cargo do usuário (via Django Groups).
    
    Mapeamento:
    - GET, HEAD, OPTIONS → app.view_model
    - POST → app.add_model  
    - PUT, PATCH → app.change_model
    - DELETE → app.delete_model
    """
    
    METHOD_PERMISSION_MAP = {
        'GET': 'view',
        'HEAD': 'view',
        'OPTIONS': 'view',
        'POST': 'add',
        'PUT': 'change',
        'PATCH': 'change',
        'DELETE': 'delete',
    }
```

### 3. Permissões Especializadas

```python
# Somente leitura
class ReadOnlyPermission(permissions.BasePermission):
    """Permite apenas GET, HEAD, OPTIONS."""

# Requer Gestor ou superior
class IsGestorOuSuperior(permissions.BasePermission):
    """Exige cargo com add, change, delete."""

# Requer Diretor
class IsDiretor(permissions.BasePermission):
    """Exige cargo com 'admin'."""

# Permite exportação
class CanExport(permissions.BasePermission):
    """Quem pode visualizar pode exportar."""

# Requer sistema específico
class RequiresSistemaPrazos(permissions.BasePermission):
    """Exige acesso ao sistema de Prazos."""

class RequiresSistemaOS(permissions.BasePermission):
    """Exige acesso ao sistema de Ordens de Serviço."""
```

### 4. Uso em ViewSets

```python
# ViewSet com permissões completas
class TitularViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated,        # Deve estar logado
        SistemaPermission,      # Deve ter acesso ao sistema
        CargoBasedPermission    # Deve ter permissão do cargo
    ]

# ViewSet exclusivo de sistema
class OrdemServicoViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated,
        RequiresSistemaOS,      # EXCLUSIVO do sistema OS
        CargoBasedPermission
    ]

# ViewSet somente leitura
class AmparoLegalViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [
        IsAuthenticated,
        ReadOnlyPermission
    ]
```

---

## 🖥️ Frontend: Contextos e Guards

### 1. AuthContext

Gerencia autenticação (login, logout, token refresh).

```jsx
// src/context/AuthContext.jsx
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Login com credenciais
  const login = async (email, password) => { ... }
  
  // Logout
  const logout = () => { ... }
  
  // Dados do usuário disponíveis:
  // - user.permissoes (por sistema/departamento)
  // - user.sistemas_disponiveis
  // - user.permissoes_django (por model)
  // - user.permissoes_lista (simplificada)
  // - user.is_superuser
}
```

### 2. PermissionContext

Gerencia permissões e sistema ativo.

```jsx
// src/context/PermissionContext.jsx
export function PermissionProvider({ children, user }) {
  const [activeSistema, setActiveSistema] = useState(...)
  
  // Departamento auto-selecionado pelo cargo mais alto
  const activeDepartamento = useMemo(() => { ... })
  
  /**
   * Verifica permissão para uma ação
   * @param {string} action - 'view', 'add', 'change', 'delete', 'admin'
   */
  const hasPermission = (action, sistemaCode = null) => { ... }
  
  /**
   * Verifica permissão Django completa
   * @param {string} perm - 'titulares.add_titular'
   */
  const hasDjangoPermission = (perm) => { ... }
}
```

**Uso:**

```jsx
function MeuComponente() {
  const { hasPermission, activeSistema } = usePermissions()
  
  if (!hasPermission('add')) {
    return <p>Sem permissão para criar</p>
  }
  
  return <BotaoNovo />
}
```

### 3. SistemaRouteGuard

Bloqueia rotas de sistemas que o usuário não tem acesso.

```jsx
// src/components/SistemaRouteGuard.jsx
function SistemaRouteGuard({ children }) {
  const location = useLocation()
  const { activeSistema, sistemasDisponiveis } = usePermissions()
  
  // Verifica se a rota requer um sistema específico
  const requiredSistema = getRequiredSistema(location.pathname)
  
  // Se rota compartilhada, permite
  if (!requiredSistema) {
    return children
  }
  
  // Verifica acesso
  if (!canAccessRoute(location.pathname, activeSistema, sistemasDisponiveis)) {
    return <SistemaAccessDenied ... />
  }
  
  return children
}
```

**Configuração de rotas em `sistemasRoutes.js`:**

```javascript
// Rotas exclusivas mapeadas para sistemas
export const EXCLUSIVE_ROUTE_MAP = {
  '/pesquisa': 'prazos',
  '/dependentes': 'prazos',
  '/ordens-servico': 'ordem_servico',
  '/pesquisa-os': 'ordem_servico',
}

// Rotas compartilhadas (não requerem sistema específico)
export const SHARED_ROUTES = [
  '/',
  '/titulares',
  '/empresas',
  '/configuracoes',
  '/users',
]
```

### 4. PermissionGuard

Protege elementos baseado em permissões do cargo.

```jsx
// src/components/PermissionGuard.jsx
function PermissionGuard({ 
  permission,        // 'add', 'change', 'delete', 'admin'
  djangoPermission,  // 'titulares.add_titular'
  children,
  fallback = null 
}) {
  const { hasPermission, hasDjangoPermission } = usePermissions()
  
  let allowed = true
  
  if (permission) {
    allowed = hasPermission(permission)
  }
  
  if (djangoPermission) {
    allowed = hasDjangoPermission(djangoPermission)
  }
  
  return allowed ? children : fallback
}
```

**Uso:**

```jsx
// Esconder botão para quem não pode criar
<PermissionGuard permission="add">
  <button>Novo Registro</button>
</PermissionGuard>

// Com fallback
<PermissionGuard permission="delete" fallback={<span>Sem permissão</span>}>
  <button>Excluir</button>
</PermissionGuard>

// Verificação Django específica
<PermissionGuard djangoPermission="contratos.add_contrato">
  <BotaoNovoContrato />
</PermissionGuard>
```

### 5. GlobalPermissionNotification

Mostra banner quando ocorre erro 403.

```jsx
// src/components/GlobalPermissionNotification.jsx
function GlobalPermissionNotification() {
  const [notification, setNotification] = useState(null)
  
  useEffect(() => {
    function handlePermissionDenied(event) {
      const { message } = event.detail
      setNotification(message)
      // Auto-hide após 5 segundos
      setTimeout(() => setNotification(null), 5000)
    }
    
    window.addEventListener('atlas:permission-denied', handlePermissionDenied)
    return () => window.removeEventListener(...)
  }, [])
  
  // Renderiza banner vermelho no topo da tela
}
```

---

## 🔄 Fluxo de Verificação Completo

### 1. Usuário acessa `/pesquisa`

```
Frontend:
  ├── SistemaRouteGuard verifica: /pesquisa é exclusiva de 'prazos'
  │   ├── Usuário tem sistema 'prazos'? → Sim → Continua
  │   └── Sistema ativo é 'prazos'? → Sim → Renderiza página
  │
  └── Página faz GET /api/v1/pesquisa/
      │
Backend:
  ├── IsAuthenticated: Token válido? ✅
  ├── SistemaPermission: Rota pertence a 'prazos', usuário tem acesso? ✅
  └── CargoBasedPermission: Usuário tem 'pesquisa.view_*'? ✅
      │
      └── Retorna dados 200 OK
```

### 2. Consultor tenta criar Titular

```
Frontend:
  ├── hasPermission('add') → false (Consultor só tem 'view')
  └── Botão "Novo Titular" não aparece (PermissionGuard)
  
Se tentar via URL direta:
  │
Backend (POST /api/v1/titulares/):
  ├── IsAuthenticated: ✅
  ├── SistemaPermission: ✅
  └── CargoBasedPermission: 
      └── Usuário tem 'titulares.add_titular'? ❌
          └── Retorna 403 + mensagem em português
```

### 3. EmpresaForm carrega recursos com permissões isoladas

```
Frontend (EmpresaForm):
  │
  ├── GET /api/v1/empresas/{id}/          → OBRIGATÓRIO
  │   └── Falha? → Mostra erro, para
  │
  ├── GET /api/v1/empresas-prestadoras/   → OPCIONAL (silent403: true)
  │   └── 403? → setPermissoes({prestadoras: false}), SEM notificação
  │
  └── GET /api/v1/contratos/?empresa=id   → OPCIONAL (silent403: true)
      └── 403? → setPermissoes({contratos: false}), SEM notificação
      
Renderização:
  ├── Dados da empresa: sempre mostra
  └── Seção de contratos:
      ├── permissoes.contratos === true → Lista contratos
      └── permissoes.contratos === false → "🔒 Sem permissão"
```

---

## 🔒 Isolamento por Sistema

### Conceito

Usuários podem ter acesso a múltiplos sistemas (Prazos, OS), mas só podem acessar rotas do sistema em que estão ativos.

### Implementação Backend

```python
# permissions.py
def get_sistema_for_route(request_path, view):
    """Determina qual sistema uma rota pertence."""
    for part in request_path.split('/'):
        for sistema, rotas in SISTEMA_ROUTES.items():
            if part in rotas:
                return sistema
    return None  # Compartilhada
```

### Implementação Frontend

```javascript
// sistemasRoutes.js
export function getRequiredSistema(path) {
  const basePath = '/' + path.split('/').filter(Boolean)[0]
  return EXCLUSIVE_ROUTE_MAP[basePath] || null
}

export function canAccessRoute(path, activeSistema, sistemasDisponiveis) {
  const required = getRequiredSistema(path)
  if (!required) return true  // Compartilhada
  
  const hasAccess = sistemasDisponiveis.some(s => s.codigo === required)
  const isActive = activeSistema === required
  
  return hasAccess && isActive
}
```

---

## 📦 Isolamento por Recurso

### Conceito

Quando uma página carrega múltiplos recursos (ex: Empresa + Contratos), cada recurso deve ser tratado independentemente. Falha em um não deve bloquear os outros.

### Implementação

**1. API com `silent403`:**

```javascript
// services/api.js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (status === 403) {
      // Permite suprimir notificação global
      if (!originalRequest.silent403) {
        dispatchPermissionDenied(message)
      }
    }
    return Promise.reject(error)
  }
)
```

**2. Services com versões silenciosas:**

```javascript
// services/contratos.js
export const getContratos = (params) => 
  api.get('/api/v1/contratos/', { params })

export const getContratosSilent = (params) => 
  api.get('/api/v1/contratos/', { params, silent403: true })
```

**3. Componentes com carregamento isolado:**

```jsx
// pages/EmpresaForm.jsx
const [permissoes, setPermissoes] = useState({
  contratos: true,
  prestadoras: true,
})

async function loadEmpresa() {
  // 1. Empresa (obrigatório)
  try {
    const empresa = await getEmpresa(id)
    setEmpresaData(empresa)
  } catch {
    setError('Erro ao carregar empresa')
    return  // Para aqui se falhar
  }
  
  // 2. Contratos (opcional - silent)
  try {
    const contratos = await getContratosSilent({empresa: id})
    setContratos(contratos)
  } catch (err) {
    if (err.response?.status === 403) {
      setPermissoes(prev => ({...prev, contratos: false}))
    }
  }
}

// Na renderização
{!permissoes.contratos ? (
  <div className="alert alert-info">
    🔒 Você não tem permissão para visualizar contratos.
  </div>
) : (
  <ListaContratos contratos={contratos} />
)}
```

---

## 👥 Estrutura de Cargos e Permissões

### Matriz de Permissões

| Cargo | view | add | change | delete | admin | export |
|-------|:----:|:---:|:------:|:------:|:-----:|:------:|
| **Consultor** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Gestor** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Diretor** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Hierarquia de Cargos

```javascript
const CARGO_HIERARCHY = {
  consultor: 1,
  gestor: 2,
  diretor: 3,
}
```

O sistema usa o **cargo mais alto** quando o usuário tem múltiplos departamentos em um sistema.

### Permissões Django por Cargo

```python
# Consultor
consultor_permissions = [
    'titulares.view_titular',
    'titulares.view_dependente',
    'empresa.view_empresa',
    # ... apenas view_*
]

# Gestor
gestor_permissions = [
    'titulares.view_titular',
    'titulares.add_titular',
    'titulares.change_titular',
    # ... view_*, add_*, change_*
]

# Diretor
diretor_permissions = [
    'titulares.view_titular',
    'titulares.add_titular',
    'titulares.change_titular',
    'titulares.delete_titular',
    # ... todas as permissões
]
```

---

## 📡 API: Headers e Configuração

### Headers Enviados

```javascript
// services/api.js
api.interceptors.request.use((config) => {
  // Token JWT
  config.headers.Authorization = `Bearer ${token}`
  
  // Sistema ativo (para validação backend)
  config.headers['X-Active-Sistema'] = localStorage.getItem('active_sistema')
  
  // Departamento ativo
  config.headers['X-Active-Department'] = localStorage.getItem('active_department')
  
  return config
})
```

### Configuração DRF

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

---

## 🔍 Troubleshooting

### Erro: "Você não tem acesso ao sistema X"

**Causa:** Usuário tentando acessar rota de sistema sem permissão.

**Solução:**
1. Verificar `user.sistemas_disponiveis` no console
2. Verificar se `X-Active-Sistema` está sendo enviado
3. Verificar mapeamento em `SISTEMA_ROUTES`

### Erro: "Você não tem permissão para X"

**Causa:** Cargo do usuário não tem a permissão necessária.

**Solução:**
1. Verificar cargo do usuário: `user.permissoes_lista`
2. Verificar grupo Django no admin
3. Verificar `permission_classes` do ViewSet

### Notificação 403 aparecendo indevidamente

**Causa:** Requisição não está usando `silent403`.

**Solução:**
```javascript
// Usar versão silenciosa
const data = await getRecursoSilent(params)

// Ou adicionar flag manualmente
api.get('/endpoint/', { params, silent403: true })
```

### Debug: Ver permissões do usuário

```javascript
// No console do navegador
const user = JSON.parse(localStorage.getItem('user'))
console.log('Sistemas:', user.sistemas_disponiveis)
console.log('Permissões:', user.permissoes)
console.log('Django:', user.permissoes_django)
```

---

## 🚀 Melhorias Futuras

### 1. Permissões por Objeto (Row-Level Security)

**Situação atual:** Permissões são por model (pode ver TODOS os titulares ou NENHUM).

**Melhoria:** Permitir que usuário veja apenas registros de suas empresas.

```python
# Exemplo de implementação futura
class TitularPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Verificar se titular pertence a empresa do usuário
        user_empresas = request.user.get_empresas()
        return obj.vinculo_set.filter(empresa__in=user_empresas).exists()
```

### 2. Cache de Permissões

**Situação atual:** Permissões verificadas a cada requisição.

**Melhoria:** Cache Redis com invalidação inteligente.

```python
# Exemplo
@cached(timeout=300, key='user_perms_{user_id}')
def get_user_permissions(user_id):
    return User.objects.get(id=user_id).get_all_permissions()
```

### 3. Auditoria de Acessos Negados

**Situação atual:** Erros 403 só aparecem em logs genéricos.

**Melhoria:** Tabela de auditoria para análise de segurança.

```python
class AccessDeniedLog(models.Model):
    user = models.ForeignKey(User)
    path = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    permission_required = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
```

### 4. Permissões Temporárias

**Situação atual:** Permissões são permanentes até alteração manual.

**Melhoria:** Permissões com data de expiração (férias, projetos).

```python
class PermissaoTemporaria(models.Model):
    user = models.ForeignKey(User)
    permission = models.ForeignKey(Permission)
    data_inicio = models.DateTimeField()
    data_fim = models.DateTimeField()
    motivo = models.TextField()
    aprovado_por = models.ForeignKey(User, related_name='aprovacoes')
```

### 5. Delegação de Permissões

**Situação atual:** Apenas admin pode alterar permissões.

**Melhoria:** Gestores podem delegar permissões limitadas.

```python
# Gestor pode dar permissão temporária de "view" para consultor
class DelegacaoPermissao(models.Model):
    delegante = models.ForeignKey(User)  # Quem delegou
    delegado = models.ForeignKey(User)   # Quem recebeu
    permissao = models.CharField()       # Qual permissão
    escopo = models.JSONField()          # Filtros (ex: só empresa X)
    validade = models.DateTimeField()
```

### 6. UI de Gestão de Permissões

**Situação atual:** Permissões gerenciadas via Django Admin.

**Melhoria:** Interface no Atlas para gestores/diretores.

```
/configuracoes/permissoes
├── Matriz visual de permissões por cargo
├── Comparador de permissões entre usuários
├── Simulador "O que este usuário pode fazer?"
└── Histórico de alterações
```

### 7. Permissões por Contexto de Dados

**Situação atual:** Não há filtro por contexto (ex: data, status).

**Melhoria:** Consultor só vê registros dos últimos 30 dias.

```python
class ContextualPermission(permissions.BasePermission):
    def filter_queryset(self, request, queryset, view):
        if request.user.cargo == 'consultor':
            return queryset.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            )
        return queryset
```

---

## 📚 Referências

- [Django Permissions](https://docs.djangoproject.com/en/5.0/topics/auth/default/#permissions)
- [DRF Permissions](https://www.django-rest-framework.org/api-guide/permissions/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)

---

*Última atualização: Janeiro/2026*
