"""
Sistema de Permissões do Atlas.

Este módulo implementa permissões baseadas em:
1. Sistema ao qual o usuário tem acesso (prazos, ordem_servico, etc)
2. Cargo do usuário (via auth_group - Django nativo)
3. Permissões Django nativas (view_, add_, change_, delete_)

Níveis de permissão (do cargo):
- Consultor: Apenas visualização (view_*)
- Gestor: CRUD completo (view_*, add_*, change_*, delete_*)
- Diretor: CRUD + admin

As permissões são verificadas em três camadas:
1. Sistema: Usuário deve ter acesso ao sistema da rota
2. Cargo: Permissões baseadas no grupo do usuário
3. Backend: Classes de Permission do DRF

Uso:
    permission_classes = [IsAuthenticated, SistemaPermission, CargoBasedPermission]
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


# =============================================================================
# MENSAGENS PADRONIZADAS
# =============================================================================

PERMISSION_MESSAGES = {
    'view': 'Você não tem permissão para visualizar este recurso.',
    'add': 'Você não tem permissão para criar novos registros.',
    'change': 'Você não tem permissão para editar este registro.',
    'delete': 'Você não tem permissão para excluir este registro.',
    'export': 'Você não tem permissão para exportar dados.',
    'admin': 'Esta ação requer permissão de administrador.',
    'default': 'Você não tem permissão para realizar esta ação.',
    'inactive': 'Sua conta está desativada. Entre em contato com o administrador.',
    'gestor_required': 'Esta ação requer permissão de Gestor ou superior.',
    'diretor_required': 'Esta ação requer permissão de Diretor.',
    'sistema_required': 'Você não tem permissão para acessar este sistema.',
}


# =============================================================================
# MAPEAMENTO DE ROTAS PARA SISTEMAS
# =============================================================================

# Define qual sistema cada app/rota pertence
# Rotas que pertencem a AMBOS os sistemas (compartilhadas)
SHARED_ROUTES = {
    'titulares',      # Titulares são usados em prazos e OS
    'empresa',        # Empresas são usadas em prazos e OS
    'core',           # Configurações gerais
    'accounts',       # Usuários e autenticação
    'contratos',      # Contratos são compartilhados
}

# Rotas exclusivas de cada sistema
SISTEMA_ROUTES = {
    'prazos': {
        'pesquisa',           # Pesquisa unificada só existe em prazos
    },
    'ordem_servico': {
        'ordem_servico',      # App de ordens de serviço
        'ordens-servico',     # ViewSet de ordens
        'empresas-prestadoras',
        'servicos',
        'tipos-despesa',
        'os-itens',
        'despesas-os',
        'os-titulares',
        'os-dependentes',
        'documentos-os',
    },
}


def get_sistema_for_route(request_path, view=None):
    """
    Determina qual sistema uma rota pertence.
    
    Args:
        request_path: Caminho da requisição (ex: /api/v1/pesquisa/)
        view: View sendo acessada
    
    Returns:
        str|None: Código do sistema ('prazos', 'ordem_servico') ou None se compartilhada
    """
    # Extrair app_name do path
    parts = request_path.strip('/').split('/')
    
    # Tentar identificar o app pelo path
    # /api/v1/pesquisa/ -> pesquisa
    # /api/v1/ordens-servico/ -> ordens-servico
    for part in parts:
        if part in ('api', 'v1', ''):
            continue
            
        # Verificar se é rota exclusiva de algum sistema
        for sistema, rotas in SISTEMA_ROUTES.items():
            if part in rotas:
                return sistema
        
        # Verificar se é rota compartilhada
        if part in SHARED_ROUTES:
            return None  # None = compartilhada, não requer sistema específico
    
    # Tentar identificar pelo basename da view
    if view and hasattr(view, 'basename'):
        basename = view.basename
        for sistema, rotas in SISTEMA_ROUTES.items():
            if basename in rotas:
                return sistema
    
    # Default: rota compartilhada
    return None


# =============================================================================
# PERMISSÃO DE SISTEMA
# =============================================================================

class SistemaPermission(permissions.BasePermission):
    """
    Verifica se o usuário tem acesso ao SISTEMA da rota.
    
    Esta permissão deve ser aplicada ANTES das permissões de cargo.
    Garante isolamento entre sistemas (prazos, ordem_servico, etc).
    
    O sistema é identificado através do header X-Active-Sistema ou
    detectado automaticamente pela rota acessada.
    
    Uso:
        permission_classes = [IsAuthenticated, SistemaPermission, CargoBasedPermission]
    """
    
    message = PERMISSION_MESSAGES['sistema_required']
    
    def has_permission(self, request, view):
        # Deve estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Deve estar ativo
        if not request.user.is_active:
            self.message = PERMISSION_MESSAGES['inactive']
            return False
        
        # Superuser tem acesso total
        if request.user.is_superuser:
            return True
        
        # Identificar qual sistema a rota pertence
        required_sistema = get_sistema_for_route(request.path, view)
        
        # Se a rota é compartilhada (None), permite
        if required_sistema is None:
            return True
        
        # Verificar se usuário tem acesso ao sistema
        # O sistema ativo é enviado pelo frontend no header
        active_sistema = request.headers.get('X-Active-Sistema')
        
        # Obter sistemas que o usuário tem acesso
        user_sistemas = set()
        if hasattr(request.user, 'get_sistemas'):
            for sistema in request.user.get_sistemas():
                user_sistemas.add(sistema.codigo)
        
        # Verificar acesso
        if required_sistema not in user_sistemas:
            self.message = f'Você não tem acesso ao sistema "{required_sistema}". Sistemas disponíveis: {", ".join(user_sistemas) or "nenhum"}.'
            return False
        
        # Se o usuário está tentando acessar um sistema diferente do ativo
        if active_sistema and active_sistema != required_sistema:
            self.message = f'Esta rota pertence ao sistema "{required_sistema}", mas você está no sistema "{active_sistema}".'
            return False
        
        return True


# =============================================================================
# PERMISSÃO PRINCIPAL BASEADA EM CARGO
# =============================================================================

class CargoBasedPermission(permissions.BasePermission):
    """
    Permissão baseada no Cargo do usuário (via Django Groups).
    
    Verifica permissões Django nativas:
    - GET, HEAD, OPTIONS → app.view_model
    - POST → app.add_model  
    - PUT, PATCH → app.change_model
    - DELETE → app.delete_model
    
    Mensagens de erro em português para melhor UX.
    
    Uso:
        permission_classes = [IsAuthenticated, CargoBasedPermission]
    """
    
    message = PERMISSION_MESSAGES['default']
    
    # Mapeamento de método HTTP para tipo de permissão
    METHOD_PERMISSION_MAP = {
        'GET': 'view',
        'HEAD': 'view',
        'OPTIONS': 'view',
        'POST': 'add',
        'PUT': 'change',
        'PATCH': 'change',
        'DELETE': 'delete',
    }
    
    def get_required_permission(self, request, view, obj=None):
        """
        Retorna o nome da permissão Django necessária.
        Ex: 'titulares.delete_titular'
        """
        perm_type = self.METHOD_PERMISSION_MAP.get(request.method, 'view')
        
        # Obter o modelo da view
        model = None
        if hasattr(view, 'queryset') and view.queryset is not None:
            model = view.queryset.model
        elif hasattr(view, 'model'):
            model = view.model
        elif obj is not None:
            model = obj.__class__
        
        if model:
            app_label = model._meta.app_label
            model_name = model._meta.model_name
            return f'{app_label}.{perm_type}_{model_name}', perm_type
        
        return None, perm_type
    
    def has_permission(self, request, view):
        """Verifica permissão para a requisição."""
        # Deve estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Deve estar ativo
        if not request.user.is_active:
            self.message = PERMISSION_MESSAGES['inactive']
            return False
        
        # Superuser tem acesso total
        if request.user.is_superuser:
            return True
        
        # Obter permissão necessária
        required_perm, perm_type = self.get_required_permission(request, view)
        
        if required_perm is None:
            # Se não conseguir determinar o modelo, permite
            # (outras camadas vão validar)
            return True
        
        # Verificar se usuário tem a permissão via cargo
        has_perm = request.user.has_perm(required_perm)
        
        if not has_perm:
            self.message = PERMISSION_MESSAGES.get(perm_type, PERMISSION_MESSAGES['default'])
        
        return has_perm
    
    def has_object_permission(self, request, view, obj):
        """Verifica permissão para objeto específico."""
        # Superuser tem acesso total
        if request.user.is_superuser:
            return True
        
        required_perm, perm_type = self.get_required_permission(request, view, obj)
        
        if required_perm is None:
            return True
        
        has_perm = request.user.has_perm(required_perm)
        
        if not has_perm:
            self.message = PERMISSION_MESSAGES.get(perm_type, PERMISSION_MESSAGES['default'])
        
        return has_perm


# =============================================================================
# PERMISSÕES ESPECIALIZADAS
# =============================================================================

class ReadOnlyPermission(permissions.BasePermission):
    """
    Permissão que permite apenas métodos de leitura (GET, HEAD, OPTIONS).
    Útil para endpoints públicos ou para forçar apenas consultas.
    
    Uso:
        permission_classes = [IsAuthenticated, ReadOnlyPermission]
    """
    
    message = 'Este recurso é somente leitura.'
    
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class IsGestorOuSuperior(permissions.BasePermission):
    """
    Permissão que exige cargo de Gestor ou superior.
    Verifica se o usuário tem permissões CRUD completas.
    
    Uso para operações administrativas:
        permission_classes = [IsAuthenticated, IsGestorOuSuperior]
    """
    
    message = PERMISSION_MESSAGES['gestor_required']
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            self.message = PERMISSION_MESSAGES['inactive']
            return False
        
        if request.user.is_superuser:
            return True
        
        # Gestor tem add, change, delete
        perms = request.user.get_permissoes_list()
        return all(p in perms for p in ['add', 'change', 'delete'])


class IsDiretor(permissions.BasePermission):
    """
    Permissão que exige cargo de Diretor.
    Para ações críticas como configurações e exclusões em massa.
    
    Uso:
        permission_classes = [IsAuthenticated, IsDiretor]
    """
    
    message = PERMISSION_MESSAGES['diretor_required']
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            self.message = PERMISSION_MESSAGES['inactive']
            return False
        
        if request.user.is_superuser:
            return True
        
        # Diretor tem 'admin' nas permissões
        perms = request.user.get_permissoes_list()
        return 'admin' in perms


class CanExport(permissions.BasePermission):
    """
    Permissão para exportação de dados.
    Quem pode visualizar pode exportar (tem view).
    
    Uso em views de exportação:
        permission_classes = [IsAuthenticated, CanExport]
    """
    
    message = PERMISSION_MESSAGES['export']
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            self.message = PERMISSION_MESSAGES['inactive']
            return False
        
        if request.user.is_superuser:
            return True
        
        # Quem pode visualizar pode exportar
        perms = request.user.get_permissoes_list()
        return 'view' in perms


class IsAdminUser(permissions.BasePermission):
    """
    Permissão que exige que o usuário seja staff ou superuser.
    Para áreas administrativas do sistema.
    
    Uso:
        permission_classes = [IsAuthenticated, IsAdminUser]
    """
    
    message = PERMISSION_MESSAGES['admin']
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            self.message = PERMISSION_MESSAGES['inactive']
            return False
        
        return request.user.is_staff or request.user.is_superuser


# =============================================================================
# MIXIN PARA VIEWSETS
# =============================================================================

class PermissionMessageMixin:
    """
    Mixin para ViewSets que adiciona mensagens de erro detalhadas em português.
    
    Uso:
        class TitularViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
            ...
    """
    
    def permission_denied(self, request, message=None, code=None):
        """Override para adicionar mensagem personalizada."""
        if message is None:
            method_perm_map = {
                'GET': 'view',
                'POST': 'add',
                'PUT': 'change',
                'PATCH': 'change',
                'DELETE': 'delete',
            }
            perm_type = method_perm_map.get(request.method, 'view')
            message = PERMISSION_MESSAGES.get(perm_type, PERMISSION_MESSAGES['default'])
        
        raise PermissionDenied(detail=message, code=code)


# =============================================================================
# ALIASES PARA COMPATIBILIDADE
# =============================================================================

# Mantidos para não quebrar imports existentes
IsGestorOrDirector = IsGestorOuSuperior
IsDirector = IsDiretor
ReadOnly = ReadOnlyPermission


# =============================================================================
# PERMISSÕES ESPECÍFICAS POR SISTEMA
# =============================================================================

class RequiresSistemaPrazos(permissions.BasePermission):
    """
    Requer acesso ao sistema de Prazos.
    Usar em views exclusivas do sistema de prazos (ex: PesquisaUnificada).
    
    Uso:
        permission_classes = [IsAuthenticated, RequiresSistemaPrazos, CargoBasedPermission]
    """
    
    message = 'Você não tem acesso ao sistema de Prazos.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Verificar se tem acesso ao sistema de prazos
        user_sistemas = set()
        if hasattr(request.user, 'get_sistemas'):
            for sistema in request.user.get_sistemas():
                user_sistemas.add(sistema.codigo)
        
        return 'prazos' in user_sistemas


class RequiresSistemaOS(permissions.BasePermission):
    """
    Requer acesso ao sistema de Ordens de Serviço.
    Usar em views exclusivas do sistema de OS.
    
    Uso:
        permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    """
    
    message = 'Você não tem acesso ao sistema de Ordens de Serviço.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Verificar se tem acesso ao sistema de OS
        user_sistemas = set()
        if hasattr(request.user, 'get_sistemas'):
            for sistema in request.user.get_sistemas():
                user_sistemas.add(sistema.codigo)
        
        return 'ordem_servico' in user_sistemas
