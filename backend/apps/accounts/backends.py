"""
Backend de autenticação customizado para o Atlas.

Com a simplificação do modelo de permissões, agora usamos apenas
o auth_group nativo do Django para gerenciar permissões (Cargo).

Este backend é mantido para compatibilidade futura caso seja necessário
adicionar lógica customizada de permissões.
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class AtlasPermissionBackend(ModelBackend):
    """
    Backend de autenticação simplificado do Atlas.
    
    Agora usa apenas o sistema de permissões nativo do Django:
    - User.groups (auth_group) = Cargo
    - Group.permissions = Permissões do cargo
    
    Fluxo de verificação de permissões:
    1. Verifica se é superuser (acesso total)
    2. Verifica permissões diretas do usuário (user_permissions)
    3. Verifica permissões dos grupos/cargos do usuário (group.permissions)
    """
    
    def _get_user_permissions(self, user_obj):
        """
        Retorna permissões diretas do usuário como set de strings.
        """
        return set(
            f"{perm.content_type.app_label}.{perm.codename}"
            for perm in user_obj.user_permissions.select_related('content_type').all()
        )
    
    def _get_group_permissions(self, user_obj):
        """
        Retorna permissões dos grupos (cargos) do usuário como set de strings.
        """
        from django.contrib.auth.models import Permission
        
        return set(
            f"{perm.content_type.app_label}.{perm.codename}"
            for perm in Permission.objects.filter(
                group__user=user_obj
            ).select_related('content_type')
        )
    
    def get_all_permissions(self, user_obj, obj=None):
        """
        Retorna todas as permissões do usuário como set de strings.
        Formato: 'app_label.codename' (ex: 'titulares.view_titular')
        """
        if not user_obj.is_active or user_obj.is_anonymous:
            return set()
        
        # Cache completo de permissões
        if not hasattr(user_obj, '_perm_cache'):
            # Permissões diretas do usuário
            user_perms = self._get_user_permissions(user_obj)
            # Permissões dos grupos (cargos)
            group_perms = self._get_group_permissions(user_obj)
            
            user_obj._perm_cache = user_perms | group_perms
        
        return user_obj._perm_cache
    
    def has_perm(self, user_obj, perm, obj=None):
        """
        Verifica se o usuário tem uma permissão específica.
        
        Args:
            user_obj: Usuário
            perm: String no formato 'app_label.codename' (ex: 'titulares.delete_titular')
            obj: Objeto específico (não usado atualmente)
        """
        if not user_obj.is_active:
            return False
        
        # Superuser tem todas as permissões
        if user_obj.is_superuser:
            return True
        
        return perm in self.get_all_permissions(user_obj, obj)
    
    def has_module_perms(self, user_obj, app_label):
        """
        Verifica se o usuário tem alguma permissão no módulo/app.
        """
        if not user_obj.is_active:
            return False
        
        if user_obj.is_superuser:
            return True
        
        for perm in self.get_all_permissions(user_obj):
            if perm.startswith(f"{app_label}."):
                return True
        
        return False


def clear_permission_cache(user):
    """
    Limpa o cache de permissões do usuário.
    Útil quando permissões são alteradas.
    """
    attrs_to_clear = [
        '_perm_cache',
        '_user_perm_cache',
        '_group_perm_cache',
    ]
    
    for attr in attrs_to_clear:
        if hasattr(user, attr):
            delattr(user, attr)
