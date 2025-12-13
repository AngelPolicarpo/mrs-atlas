"""
Sistema de Permissões do Atlas.

Este módulo implementa permissões baseadas em:
1. Cargo do usuário (via auth_group - Django nativo)
2. Permissões Django nativas (view_, add_, change_, delete_)

Níveis de permissão (do cargo):
- Consultor: Apenas visualização (view_*)
- Gestor: CRUD completo (view_*, add_*, change_*, delete_*)
- Diretor: CRUD + admin

As permissões são verificadas em duas camadas:
1. Backend: Classes de Permission do DRF
2. Frontend: Verificação via API /api/v1/auth/me/

Uso:
    permission_classes = [IsAuthenticated, CargoBasedPermission]
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


# ============================================================
# PERMISSÃO PRINCIPAL BASEADA EM CARGO
# ============================================================

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
    
    message = 'Você não tem permissão para realizar esta ação.'
    
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
    
    # Mensagens de erro personalizadas por ação
    ERROR_MESSAGES = {
        'view': 'Você não tem permissão para visualizar este recurso.',
        'add': 'Você não tem permissão para criar novos registros.',
        'change': 'Você não tem permissão para editar este registro.',
        'delete': 'Você não tem permissão para excluir este registro.',
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
            return f'{app_label}.{perm_type}_{model_name}'
        
        return None
    
    def has_permission(self, request, view):
        """Verifica permissão para a requisição."""
        # Deve estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Deve estar ativo
        if not request.user.is_active:
            self.message = 'Sua conta está desativada.'
            return False
        
        # Superuser tem acesso total
        if request.user.is_superuser:
            return True
        
        # Obter permissão necessária
        required_perm = self.get_required_permission(request, view)
        
        if required_perm is None:
            # Se não conseguir determinar o modelo, permite
            # (outras camadas vão validar)
            return True
        
        # Verificar se usuário tem a permissão via cargo
        has_perm = request.user.has_perm(required_perm)
        
        if not has_perm:
            perm_type = self.METHOD_PERMISSION_MAP.get(request.method, 'view')
            self.message = self.ERROR_MESSAGES.get(perm_type, self.message)
        
        return has_perm
    
    def has_object_permission(self, request, view, obj):
        """Verifica permissão para objeto específico."""
        # Superuser tem acesso total
        if request.user.is_superuser:
            return True
        
        required_perm = self.get_required_permission(request, view, obj)
        
        if required_perm is None:
            return True
        
        has_perm = request.user.has_perm(required_perm)
        
        if not has_perm:
            perm_type = self.METHOD_PERMISSION_MAP.get(request.method, 'view')
            self.message = self.ERROR_MESSAGES.get(perm_type, self.message)
        
        return has_perm


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
    
    message = 'Esta ação requer permissão de Gestor ou superior.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
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
    
    message = 'Esta ação requer permissão de Diretor.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Diretor tem 'admin' nas permissões
        perms = request.user.get_permissoes_list()
        return 'admin' in perms


# ============================================================
# CLASSES LEGADAS (COMPATIBILIDADE)
# ============================================================

class BaseDepartmentPermission(permissions.BasePermission):
    """
    [LEGADO] Classe base para permissões baseadas em departamento.
    Mantida para compatibilidade. Use CargoBasedPermission.
    """
    
    def get_active_department(self, request):
        return request.headers.get('X-Active-Department', request.query_params.get('department'))
    
    def get_user_vinculo(self, request):
        return None


class IsDepartmentMember(CargoBasedPermission):
    """[LEGADO] Use CargoBasedPermission."""
    pass


class HasDepartmentPermission(CargoBasedPermission):
    """[LEGADO] Use CargoBasedPermission."""
    
    HTTP_METHOD_TO_ACTION = {
        'GET': 'view',
        'HEAD': 'view',
        'OPTIONS': 'view',
        'POST': 'add',
        'PUT': 'change',
        'PATCH': 'change',
        'DELETE': 'delete',
    }
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        department_code = self.get_active_department(request)
        if not department_code:
            # Sem departamento especificado, nega acesso para evitar vazamento
            return False
        
        action = self.HTTP_METHOD_TO_ACTION.get(request.method, 'view')
        return request.user.tem_permissao(department_code, action)


class CanExport(BaseDepartmentPermission):
    """
    Permissão específica para exportação de dados.
    Apenas GESTOR e DIRETOR podem exportar.
    
    Uso em views de exportação:
        permission_classes = [IsAuthenticated, CanExport]
    """
    
    message = 'Você não tem permissão para exportar dados deste departamento.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        department_code = self.get_active_department(request)
        if not department_code:
            return False
        
        return request.user.tem_permissao(department_code, 'export')


class IsGestorOrDirector(BaseDepartmentPermission):
    """
    Permissão que exige cargo de GESTOR ou DIRETOR no departamento.
    
    Uso para operações administrativas do departamento:
        permission_classes = [IsAuthenticated, IsGestorOrDirector]
    """
    
    message = 'Esta ação requer cargo de Gestor ou Diretor.'
    
    ALLOWED_CARGOS = ['gestor', 'diretor']
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return super().has_permission(request, view)


class CanExport(CargoBasedPermission):
    """
    Permissão para exportação de dados.
    Consultor ou superior pode exportar (tem view).
    
    Uso em views de exportação:
        permission_classes = [IsAuthenticated, CanExport]
    """
    
    message = 'Você não tem permissão para exportar dados.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Quem pode visualizar pode exportar
        perms = request.user.get_permissoes_list()
        return 'view' in perms


class IsGestorOrDirector(IsGestorOuSuperior):
    """[Alias] Use IsGestorOuSuperior."""
    pass


class IsDirector(IsDiretor):
    """[Alias] Use IsDiretor."""
    pass


class ReadOnly(ReadOnlyPermission):
    """[Alias] Use ReadOnlyPermission."""
    pass


# ============================================================
# MIXIN PARA VIEWSETS COM MENSAGENS DETALHADAS
# ============================================================

class PermissionMessageMixin:
    """
    Mixin para ViewSets que adiciona mensagens de erro detalhadas em português.
    
    Uso:
        class TitularViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
            ...
    """
    
    permission_denied_messages = {
        'view': 'Você não tem permissão para visualizar este recurso.',
        'add': 'Você não tem permissão para criar novos registros.',
        'change': 'Você não tem permissão para editar este registro.',
        'delete': 'Você não tem permissão para excluir este registro.',
    }
    
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
            message = self.permission_denied_messages.get(
                perm_type,
                'Você não tem permissão para realizar esta ação.'
            )
        
        raise PermissionDenied(detail=message, code=code)
