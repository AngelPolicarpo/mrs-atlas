# 🔐 Sistema de Permissões (RBAC)

Este documento detalha o sistema de autenticação e autorização do Atlas, baseado em RBAC (Role-Based Access Control).

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Cargos](#estrutura-de-cargos)
3. [Modelo de Permissões Django](#modelo-de-permissões-django)
4. [Implementação Backend](#implementação-backend)
5. [Implementação Frontend](#implementação-frontend)
6. [Fluxo de Verificação](#fluxo-de-verificação)
7. [Configuração de Cargos](#configuração-de-cargos)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Atlas utiliza o sistema de permissões nativo do Django, com Groups (grupos) representando **Cargos**. Cada cargo possui um conjunto de permissões que determinam o que o usuário pode fazer no sistema.

### Conceitos Principais

| Conceito | Django | Atlas | Descrição |
|----------|--------|-------|-----------|
| **Role** | Group | Cargo | Função do usuário (Consultor, Gestor, Diretor) |
| **Permission** | Permission | Permissão | Ação permitida (view, add, change, delete) |
| **User** | User | Usuário | Pessoa que acessa o sistema |
| **Resource** | Model | Modelo | Recurso protegido (Titular, Empresa, etc) |

### Matriz de Permissões

| Cargo | view | add | change | delete | Descrição |
|-------|:----:|:---:|:------:|:------:|-----------|
| **Consultor** | ✅ | ❌ | ❌ | ❌ | Apenas visualização |
| **Gestor** | ✅ | ✅ | ✅ | ❌ | Criação e edição |
| **Diretor** | ✅ | ✅ | ✅ | ✅ | Acesso total |

### Modelos Protegidos

O sistema aplica controle de acesso aos seguintes modelos:

- `titulares.Titular` - Cadastro de titulares/estrangeiros
- `titulares.Dependente` - Dependentes de titulares
- `empresa.Empresa` - Cadastro de empresas
- `accounts.User` (como `usuario`) - Gestão de usuários
- `accounts.UsuarioVinculo` - Vínculos de usuários

---

## 👥 Estrutura de Cargos

### Consultor
**Perfil:** Analista, estagiário, suporte.

```
Permissões:
├── titulares.view_titular
├── titulares.view_dependente
├── empresa.view_empresa
├── accounts.view_usuario
└── accounts.view_usuariovinculo
```

**Pode:**
- Visualizar listagens e detalhes
- Usar a pesquisa avançada
- Exportar relatórios (somente leitura)

**Não pode:**
- Criar novos registros
- Editar registros existentes
- Excluir registros

### Gestor
**Perfil:** Coordenador, gerente de departamento.

```
Permissões:
├── titulares.view_titular
├── titulares.add_titular
├── titulares.change_titular
├── titulares.view_dependente
├── titulares.add_dependente
├── titulares.change_dependente
├── empresa.view_empresa
├── empresa.add_empresa
├── empresa.change_empresa
├── accounts.view_usuario
├── accounts.add_usuario
├── accounts.change_usuario
├── accounts.view_usuariovinculo
├── accounts.add_usuariovinculo
└── accounts.change_usuariovinculo
```

**Pode:**
- Tudo que o Consultor pode
- Criar novos registros
- Editar registros existentes

**Não pode:**
- Excluir registros (proteção contra perdas acidentais)

### Diretor
**Perfil:** Diretor, administrador do sistema.

```
Permissões:
├── titulares.view_titular
├── titulares.add_titular
├── titulares.change_titular
├── titulares.delete_titular
├── titulares.view_dependente
├── titulares.add_dependente
├── titulares.change_dependente
├── titulares.delete_dependente
├── empresa.view_empresa
├── empresa.add_empresa
├── empresa.change_empresa
├── empresa.delete_empresa
├── accounts.view_usuario
├── accounts.add_usuario
├── accounts.change_usuario
├── accounts.delete_usuario
├── accounts.view_usuariovinculo
├── accounts.add_usuariovinculo
├── accounts.change_usuariovinculo
└── accounts.delete_usuariovinculo
```

**Pode:**
- Acesso total a todas as operações
- Excluir registros
- Gerenciar usuários e permissões

---

## 🐍 Modelo de Permissões Django

### Estrutura de Permissões

O Django cria automaticamente 4 permissões para cada modelo:

```
{app_label}.{action}_{model_name}

Exemplos:
- titulares.view_titular     → Visualizar titular
- titulares.add_titular      → Criar titular
- titulares.change_titular   → Editar titular
- titulares.delete_titular   → Excluir titular
```

### Relacionamento User → Group → Permission

```
┌──────────────────┐
│      User        │
│  (email, nome)   │
└────────┬─────────┘
         │ groups (ManyToMany)
         ▼
┌──────────────────┐
│      Group       │
│  (name: Cargo)   │
│ - Consultor      │
│ - Gestor         │
│ - Diretor        │
└────────┬─────────┘
         │ permissions (ManyToMany)
         ▼
┌──────────────────┐
│   Permission     │
│ (codename)       │
│ - view_titular   │
│ - add_empresa    │
│ - delete_user    │
└──────────────────┘
```

### Tabelas do Banco de Dados

```sql
-- Grupos (Cargos)
auth_group:
| id | name      |
|----|-----------|
| 1  | Consultor |
| 2  | Gestor    |
| 3  | Diretor   |

-- Permissões (criadas pelo Django)
auth_permission:
| id | codename        | content_type_id |
|----|-----------------|-----------------|
| 1  | view_titular    | 7               |
| 2  | add_titular     | 7               |
| 3  | change_titular  | 7               |
| 4  | delete_titular  | 7               |

-- Relação Grupo ↔ Permissões
auth_group_permissions:
| group_id | permission_id |
|----------|---------------|
| 1        | 1             |  -- Consultor → view_titular
| 2        | 1             |  -- Gestor → view_titular
| 2        | 2             |  -- Gestor → add_titular
| 2        | 3             |  -- Gestor → change_titular
| 3        | 1             |  -- Diretor → view_titular
| 3        | 2             |  -- Diretor → add_titular
| 3        | 3             |  -- Diretor → change_titular
| 3        | 4             |  -- Diretor → delete_titular

-- Relação Usuário ↔ Grupos
accounts_user_groups:
| user_id | group_id |
|---------|----------|
| 1       | 3        |  -- Admin → Diretor
| 2       | 1        |  -- João → Consultor
| 3       | 2        |  -- Maria → Gestor
```

---

## 🔧 Implementação Backend

### CargoBasedPermission

Classe principal que verifica permissões em cada requisição.

```python
# backend/apps/accounts/permissions.py

from rest_framework.permissions import BasePermission

class CargoBasedPermission(BasePermission):
    """
    Verifica se o usuário tem permissão baseada em seu cargo (Group).
    
    Mapeia métodos HTTP para ações Django:
    - GET, HEAD, OPTIONS → view_{model}
    - POST → add_{model}
    - PUT, PATCH → change_{model}
    - DELETE → delete_{model}
    """
    
    message = 'Você não tem permissão para realizar esta ação.'
    
    # Mapeamento HTTP → ação Django
    METHOD_ACTION_MAP = {
        'GET': 'view',
        'HEAD': 'view',
        'OPTIONS': 'view',
        'POST': 'add',
        'PUT': 'change',
        'PATCH': 'change',
        'DELETE': 'delete',
    }
    
    # Mensagens em português por ação
    ACTION_MESSAGES = {
        'view': 'visualizar',
        'add': 'criar',
        'change': 'editar',
        'delete': 'excluir',
    }
    
    def get_permission_required(self, request, view):
        """
        Determina a permissão necessária baseada no método HTTP e modelo.
        
        Returns:
            str: Permissão no formato 'app_label.action_model'
        """
        # Obtém o modelo do ViewSet
        model = view.queryset.model
        app_label = model._meta.app_label
        model_name = model._meta.model_name
        
        # Determina a ação baseada no método HTTP
        action = self.METHOD_ACTION_MAP.get(request.method, 'view')
        
        return f'{app_label}.{action}_{model_name}'
    
    def has_permission(self, request, view):
        """
        Verifica se o usuário tem a permissão necessária.
        """
        # Usuário deve estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários têm acesso total
        if request.user.is_superuser:
            return True
        
        # Obtém permissão necessária
        permission_required = self.get_permission_required(request, view)
        
        # Verifica se usuário tem a permissão
        has_perm = request.user.has_perm(permission_required)
        
        # Define mensagem de erro personalizada
        if not has_perm:
            action = permission_required.split('.')[-1].split('_')[0]
            action_text = self.ACTION_MESSAGES.get(action, 'realizar esta ação')
            model_name = view.queryset.model._meta.verbose_name
            self.message = f'Você não tem permissão para {action_text} {model_name}.'
        
        return has_perm
    
    def has_object_permission(self, request, view, obj):
        """
        Verifica permissão em nível de objeto (para ações em registros específicos).
        """
        return self.has_permission(request, view)
```

### Backend de Autenticação

Garante que permissões sejam retornadas no formato correto.

```python
# backend/apps/accounts/backends.py

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import Permission

class CustomModelBackend(ModelBackend):
    """
    Backend que retorna permissões como strings 'app.codename'.
    
    O backend padrão do Django retorna apenas 'codename'.
    Este backend adiciona o app_label para compatibilidade com has_perm().
    """
    
    def _get_group_permissions(self, user_obj):
        """
        Retorna permissões dos grupos do usuário.
        """
        return Permission.objects.filter(
            group__user=user_obj
        ).values_list(
            'content_type__app_label',
            'codename'
        )
    
    def _get_user_permissions(self, user_obj):
        """
        Retorna permissões diretas do usuário (se houver).
        """
        return Permission.objects.filter(
            user=user_obj
        ).values_list(
            'content_type__app_label',
            'codename'
        )
    
    def get_all_permissions(self, user_obj, obj=None):
        """
        Retorna todas as permissões do usuário (grupos + diretas).
        """
        if not user_obj.is_active:
            return set()
        
        perms = set()
        
        # Permissões dos grupos
        for app_label, codename in self._get_group_permissions(user_obj):
            perms.add(f'{app_label}.{codename}')
        
        # Permissões diretas
        for app_label, codename in self._get_user_permissions(user_obj):
            perms.add(f'{app_label}.{codename}')
        
        return perms
    
    def has_perm(self, user_obj, perm, obj=None):
        """
        Verifica se usuário tem uma permissão específica.
        """
        if not user_obj.is_active:
            return False
        
        return perm in self.get_all_permissions(user_obj, obj)
```

### Configuração do Backend

```python
# config/settings.py

AUTHENTICATION_BACKENDS = [
    'apps.accounts.backends.CustomModelBackend',
]
```

### Endpoint de Verificação de Permissão

```python
# backend/apps/accounts/views.py

class CheckPermissionView(APIView):
    """
    Verifica se o usuário logado tem uma permissão específica.
    
    GET /api/auth/check-permission/?permission=titulares.delete_titular
    
    Response:
        {"has_permission": true/false, "permission": "titulares.delete_titular"}
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        permission = request.query_params.get('permission', '')
        
        if not permission:
            return Response(
                {'error': 'Parâmetro "permission" é obrigatório'},
                status=400
            )
        
        has_perm = request.user.has_perm(permission)
        
        return Response({
            'has_permission': has_perm,
            'permission': permission
        })
```

### ViewSets com Permissões

```python
# backend/apps/titulares/views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import CargoBasedPermission
from .models import Titular
from .serializers import TitularSerializer

class TitularViewSet(viewsets.ModelViewSet):
    queryset = Titular.objects.filter(ativo=True)
    serializer_class = TitularSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    
    # ... filtros, ordenação, etc
```

---

## ⚛️ Implementação Frontend

### PermissionContext

Context que gerencia permissões no frontend.

```jsx
// frontend/src/context/PermissionContext.jsx

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [cargo, setCargo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega permissões quando usuário loga
  useEffect(() => {
    if (isAuthenticated && user) {
      // Permissões vêm no objeto user retornado pelo login
      setPermissions(user.permissions || []);
      setCargo(user.cargo || null);
      setLoading(false);
    } else {
      setPermissions([]);
      setCargo(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Verifica se tem uma permissão específica (local)
   */
  const hasPermission = useCallback((permission) => {
    // Busca exata ou por sufixo (ex: 'view_titular' em 'titulares.view_titular')
    return permissions.some(p => 
      p === permission || p.endsWith(`.${permission}`)
    );
  }, [permissions]);

  /**
   * Verifica permissão via API (quando precisa de certeza absoluta)
   */
  const checkPermissionAsync = useCallback(async (permission) => {
    try {
      const response = await api.get('/api/auth/check-permission/', {
        params: { permission }
      });
      return response.data.has_permission;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }, []);

  /**
   * Helpers por ação
   */
  const canView = useCallback((model) => {
    return hasPermission(`view_${model}`);
  }, [hasPermission]);

  const canAdd = useCallback((model) => {
    return hasPermission(`add_${model}`);
  }, [hasPermission]);

  const canChange = useCallback((model) => {
    return hasPermission(`change_${model}`);
  }, [hasPermission]);

  const canDelete = useCallback((model) => {
    return hasPermission(`delete_${model}`);
  }, [hasPermission]);

  const value = {
    permissions,
    cargo,
    loading,
    hasPermission,
    checkPermissionAsync,
    canView,
    canAdd,
    canChange,
    canDelete,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de PermissionProvider');
  }
  return context;
};
```

### Hook useModelPermissions

Hook para verificar todas as permissões de um modelo.

```jsx
// frontend/src/hooks/useModelPermissions.js

import { useMemo } from 'react';
import { usePermissions } from '../context/PermissionContext';

/**
 * Hook que retorna as permissões de um modelo específico.
 * 
 * Uso:
 * const { canView, canAdd, canChange, canDelete } = useModelPermissions('titular');
 * 
 * if (canDelete) {
 *   // mostrar botão de excluir
 * }
 */
export function useModelPermissions(modelName) {
  const { canView, canAdd, canChange, canDelete } = usePermissions();

  const permissions = useMemo(() => ({
    canView: canView(modelName),
    canAdd: canAdd(modelName),
    canChange: canChange(modelName),
    canDelete: canDelete(modelName),
  }), [modelName, canView, canAdd, canChange, canDelete]);

  return permissions;
}
```

### Componentes de Permissão

```jsx
// frontend/src/components/PermissionGuard/PermissionGuard.jsx

import { usePermissions } from '../../context/PermissionContext';

/**
 * Guard genérico por permissão completa.
 * 
 * Uso:
 * <PermissionGuard permission="titulares.delete_titular">
 *   <button>Excluir</button>
 * </PermissionGuard>
 */
export function PermissionGuard({ permission, children, fallback = null }) {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(permission)) {
    return children;
  }
  
  return fallback;
}

/**
 * Guard por modelo e ação.
 * 
 * Uso:
 * <ModelPermissionGuard model="titular" action="delete">
 *   <button>Excluir</button>
 * </ModelPermissionGuard>
 */
export function ModelPermissionGuard({ model, action, children, fallback = null }) {
  const { canView, canAdd, canChange, canDelete } = usePermissions();
  
  const actionCheckers = {
    view: canView,
    add: canAdd,
    change: canChange,
    delete: canDelete,
  };
  
  const checker = actionCheckers[action];
  
  if (checker && checker(model)) {
    return children;
  }
  
  return fallback;
}

/**
 * Guard que exige QUALQUER uma das permissões.
 */
export function AnyPermissionGuard({ permissions = [], children, fallback = null }) {
  const { hasPermission } = usePermissions();
  
  const hasAny = permissions.some(p => hasPermission(p));
  
  if (hasAny) {
    return children;
  }
  
  return fallback;
}

/**
 * Guard que exige TODAS as permissões.
 */
export function AllPermissionsGuard({ permissions = [], children, fallback = null }) {
  const { hasPermission } = usePermissions();
  
  const hasAll = permissions.every(p => hasPermission(p));
  
  if (hasAll) {
    return children;
  }
  
  return fallback;
}
```

### Uso em Páginas

```jsx
// Exemplo: TitularList.jsx

import { ModelPermissionGuard } from '../../components/PermissionGuard';
import { useModelPermissions } from '../../hooks/useModelPermissions';

export default function TitularList() {
  const { canAdd, canChange, canDelete } = useModelPermissions('titular');
  
  const handleDelete = async (id) => {
    // Verificação programática
    if (!canDelete) {
      alert('Você não tem permissão para excluir titulares.');
      return;
    }
    
    // ... lógica de exclusão
  };

  return (
    <div>
      <header>
        <h1>Titulares</h1>
        
        {/* Botão só aparece se tiver permissão */}
        <ModelPermissionGuard model="titular" action="add">
          <Link to="/titulares/novo">+ Novo Titular</Link>
        </ModelPermissionGuard>
      </header>

      <table>
        {/* ... listagem ... */}
        <td>
          <Link to={`/titulares/${id}`}>
            {canChange ? 'Editar' : 'Visualizar'}
          </Link>
          
          {/* Botão excluir só para quem pode */}
          <ModelPermissionGuard model="titular" action="delete">
            <button onClick={() => handleDelete(id)}>Excluir</button>
          </ModelPermissionGuard>
        </td>
      </table>
    </div>
  );
}
```

---

## 🔄 Fluxo de Verificação

### Fluxo Completo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                                    │
└────────────────────────────────────────────────────────────────────────────┘

1. Login
   │
   ▼
┌─────────────────────────────────────┐
│ POST /api/auth/login/               │
│ Response: {access, refresh, user}   │
│ user.permissions = ['view_titular', │
│   'add_titular', 'change_titular']  │
└─────────────────────────────────────┘
   │
   ▼
2. PermissionContext carrega permissões
   │
   ▼
3. Usuário acessa página de Titulares
   │
   ▼
┌─────────────────────────────────────┐
│ <ModelPermissionGuard               │
│   model="titular"                   │
│   action="delete">                  │
│   <button>Excluir</button>          │
│ </ModelPermissionGuard>             │
│                                     │
│ → Verifica se 'delete_titular'      │
│   está em permissions               │
│ → Gestor: NÃO TEM → botão oculto    │
│ → Diretor: TEM → botão visível      │
└─────────────────────────────────────┘
   │
   ▼
4. Usuário clica em Excluir (se visível)
   │
   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Django)                                   │
└────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ DELETE /api/v1/titulares/123/       │
│ Header: Authorization: Bearer <JWT> │
└─────────────────────────────────────┘
   │
   ▼
5. JWTAuthentication valida token
   │
   ▼
6. CargoBasedPermission.has_permission()
   │
   ├── Método: DELETE → ação: delete
   ├── Modelo: Titular → titulares.delete_titular
   ├── user.has_perm('titulares.delete_titular')
   │
   ├── Consultor/Gestor: FALSE
   │   └── 403 Forbidden
   │       {"detail": "Você não tem permissão para excluir titular."}
   │
   └── Diretor: TRUE
       └── 204 No Content (excluído com sucesso)
```

---

## ⚙️ Configuração de Cargos

### Management Command: setup_cargo_permissions

```python
# backend/apps/accounts/management/commands/setup_cargo_permissions.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    help = 'Configura as permissões de cada cargo (Group)'

    def handle(self, *args, **options):
        # Modelos que recebem permissões
        protected_models = [
            'titular',
            'dependente', 
            'vinculotitular',
            'vinculodependente',
            'empresa',
            'usuario',
            'usuariovinculo',
        ]
        
        # Definição de permissões por cargo
        cargo_permissions = {
            'Consultor': ['view'],
            'Gestor': ['view', 'add', 'change'],
            'Diretor': ['view', 'add', 'change', 'delete'],
        }
        
        for cargo_name, actions in cargo_permissions.items():
            try:
                cargo = Group.objects.get(name=cargo_name)
            except Group.DoesNotExist:
                cargo = Group.objects.create(name=cargo_name)
                self.stdout.write(f'Cargo criado: {cargo_name}')
            
            # Limpa permissões atuais
            cargo.permissions.clear()
            
            # Adiciona permissões
            for model in protected_models:
                for action in actions:
                    codename = f'{action}_{model}'
                    try:
                        permission = Permission.objects.get(codename=codename)
                        cargo.permissions.add(permission)
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ {cargo_name}: {codename}')
                        )
                    except Permission.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠ Permissão não encontrada: {codename}')
                        )
        
        self.stdout.write(self.style.SUCCESS('\nPermissões configuradas com sucesso!'))
```

### Executar Configuração

```bash
# Via Docker
docker compose exec backend python manage.py setup_cargo_permissions

# Local
python manage.py setup_cargo_permissions
```

### Verificar Permissões via Django Admin

1. Acesse http://localhost:8000/admin/
2. Vá em **Autenticação e Autorização** → **Grupos**
3. Clique em um cargo (ex: Consultor)
4. Verifique as permissões atribuídas

### Verificar Permissões via Shell

```python
# docker compose exec backend python manage.py shell

from django.contrib.auth.models import Group

# Ver permissões de um cargo
cargo = Group.objects.get(name='Consultor')
for perm in cargo.permissions.all():
    print(f'{perm.content_type.app_label}.{perm.codename}')

# Ver permissões de um usuário
from apps.accounts.models import User
user = User.objects.get(email='joao@example.com')
print(user.get_all_permissions())
```

---

## 🔧 Troubleshooting

### Problema: Permissões não estão sendo verificadas

**Sintoma:** Qualquer usuário consegue fazer qualquer ação.

**Solução:**
1. Verifique se o ViewSet tem `permission_classes`:
   ```python
   permission_classes = [IsAuthenticated, CargoBasedPermission]
   ```
2. Verifique se o backend está configurado:
   ```python
   # settings.py
   AUTHENTICATION_BACKENDS = ['apps.accounts.backends.CustomModelBackend']
   ```

### Problema: Usuário não tem permissões mesmo sendo do cargo correto

**Sintoma:** Diretor não consegue excluir, mesmo com permissão.

**Solução:**
1. Verifique se o usuário está no grupo correto:
   ```python
   user.groups.all()
   ```
2. Verifique se o grupo tem as permissões:
   ```python
   cargo = Group.objects.get(name='Diretor')
   cargo.permissions.filter(codename__contains='delete')
   ```
3. Re-execute o comando de setup:
   ```bash
   python manage.py setup_cargo_permissions
   ```

### Problema: Frontend mostra botões que não deveria

**Sintoma:** Botão de excluir aparece para Consultor.

**Solução:**
1. Verifique se as permissões estão vindo no login:
   ```javascript
   console.log(user.permissions);
   ```
2. Verifique se o PermissionContext está carregando:
   ```javascript
   const { permissions, cargo } = usePermissions();
   console.log('Cargo:', cargo, 'Perms:', permissions);
   ```
3. Verifique se o guard está correto:
   ```jsx
   <ModelPermissionGuard model="titular" action="delete">
   ```

### Problema: Erro 403 mesmo com permissão

**Sintoma:** API retorna 403 Forbidden.

**Solução:**
1. Verifique o token JWT:
   ```bash
   # Decodificar JWT (jwt.io)
   ```
2. Verifique se o usuário está ativo:
   ```python
   user.is_active  # Deve ser True
   ```
3. Teste a permissão diretamente:
   ```python
   user.has_perm('titulares.delete_titular')
   ```

---

## 🔗 Próxima Leitura

- [Backend](backend.md) - Estrutura Django completa
- [Frontend](frontend.md) - Estrutura React completa
- [Melhorias](melhorias.md) - Backlog de melhorias
