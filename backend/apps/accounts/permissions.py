"""
Permission classes customizadas para o sistema de departamentos.

Estas classes são usadas para validar permissões baseadas em:
- Departamento do usuário
- Cargo do usuário no departamento
- Ação específica sendo realizada

O header X-Active-Department é usado para identificar o contexto do departamento ativo.
"""

from rest_framework import permissions


class BaseDepartmentPermission(permissions.BasePermission):
    """
    Classe base para permissões baseadas em departamento.
    Extrai o departamento ativo do header da requisição.
    """
    
    def get_active_department(self, request):
        """
        Obtém o código do departamento ativo do header da requisição.
        Header: X-Active-Department
        """
        return request.headers.get('X-Active-Department', request.query_params.get('department'))
    
    def get_user_vinculo(self, request):
        """Retorna o vínculo do usuário com o departamento ativo."""
        department_code = self.get_active_department(request)
        if not department_code:
            return None
        
        user = request.user
        if not user.is_authenticated:
            return None
            
        return user.get_departamento_vinculo(department_code)


class IsDepartmentMember(BaseDepartmentPermission):
    """
    Permissão que verifica se o usuário pertence ao departamento ativo.
    Não verifica ações específicas, apenas se tem vínculo ativo.
    
    Uso:
        permission_classes = [IsAuthenticated, IsDepartmentMember]
    """
    
    message = 'Você não tem acesso a este departamento.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superuser tem acesso a tudo
        if request.user.is_superuser:
            return True
        
        department_code = self.get_active_department(request)
        if not department_code:
            # Se não especificou departamento, permite (outras permissões vão validar)
            return True
        
        return request.user.tem_acesso_departamento(department_code)


class HasDepartmentPermission(BaseDepartmentPermission):
    """
    Permissão que verifica se o usuário tem uma ação específica no departamento.
    A ação é determinada pelo método HTTP:
    
    - GET, HEAD, OPTIONS → 'view'
    - POST → 'add'
    - PUT, PATCH → 'change'
    - DELETE → 'delete'
    
    Uso:
        permission_classes = [IsAuthenticated, HasDepartmentPermission]
    """
    
    message = 'Você não tem permissão para esta ação neste departamento.'
    
    # Mapeamento de método HTTP para ação
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
        
        # Superuser tem acesso a tudo
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
        
        department_code = self.get_active_department(request)
        if not department_code:
            return False
        
        cargo = request.user.get_cargo_em_departamento(department_code)
        return cargo in self.ALLOWED_CARGOS


class IsDirector(BaseDepartmentPermission):
    """
    Permissão que exige cargo de DIRETOR no departamento.
    Para ações críticas como configurações e exclusões em massa.
    
    Uso:
        permission_classes = [IsAuthenticated, IsDirector]
    """
    
    message = 'Esta ação requer cargo de Diretor.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        department_code = self.get_active_department(request)
        if not department_code:
            return False
        
        cargo = request.user.get_cargo_em_departamento(department_code)
        return cargo == 'diretor'


class ReadOnly(permissions.BasePermission):
    """
    Permissão que permite apenas métodos de leitura (GET, HEAD, OPTIONS).
    Útil para endpoints públicos ou consultas.
    """
    
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


# ===== Permission Mixins para ViewSets =====

class DepartmentPermissionMixin:
    """
    Mixin para ViewSets que aplica permissões baseadas em departamento.
    
    Adiciona automaticamente o header X-Active-Department às permissões.
    
    Uso:
        class TitularViewSet(DepartmentPermissionMixin, viewsets.ModelViewSet):
            department_code = 'prazos'  # Departamento fixo ou None para usar header
    """
    
    department_code = None  # Sobrescrever na classe filha se necessário
    
    def get_department_code(self):
        """Retorna o código do departamento para este ViewSet."""
        if self.department_code:
            return self.department_code
        return self.request.headers.get('X-Active-Department')
    
    def check_department_permission(self, action):
        """
        Verifica permissão para uma ação específica.
        
        Args:
            action: 'view', 'add', 'change', 'delete', 'export', 'admin'
        
        Raises:
            PermissionDenied: Se não tiver permissão
        """
        from rest_framework.exceptions import PermissionDenied
        
        user = self.request.user
        if user.is_superuser:
            return True
        
        dept_code = self.get_department_code()
        if not dept_code:
            raise PermissionDenied('Departamento não especificado.')
        
        if not user.tem_permissao(dept_code, action):
            raise PermissionDenied(f'Você não tem permissão para {action} neste departamento.')
        
        return True
