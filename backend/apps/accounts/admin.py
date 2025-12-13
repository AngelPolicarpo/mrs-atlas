"""
Admin para o sistema de controle de acesso RBAC Simplificado.

Estrutura:
- Sistema: Aplicação/Módulo do Atlas
- Departamento: Área organizacional
- Cargo: auth_group nativo do Django (renomeado no Admin)
- User: Usuário com tipo_usuario (INTERNO/CLIENTE)

Permissões = auth_group.permissions (Django nativo)
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group, Permission

from .models import Departamento, Sistema, User, UsuarioVinculo


# ============================================================
# CARGO (auth_group renomeado)
# ============================================================

# Desregistra o Group padrão
admin.site.unregister(Group)


@admin.register(Group)
class CargoAdmin(BaseGroupAdmin):
    """
    Admin para Cargos (usando auth_group nativo do Django).
    
    Renomeamos 'Group' para 'Cargo' no Admin para manter consistência
    com a nomenclatura do sistema Atlas.
    """
    
    list_display = ['name', 'get_permissoes_count', 'get_usuarios_count']
    search_fields = ['name']
    ordering = ['name']
    filter_horizontal = ['permissions']
    
    def get_permissoes_count(self, obj):
        """Número de permissões associadas ao cargo."""
        return obj.permissions.count()
    get_permissoes_count.short_description = 'Permissões'
    
    def get_usuarios_count(self, obj):
        """Número de usuários com este cargo."""
        return obj.user_set.count()
    get_usuarios_count.short_description = 'Usuários'
    
    class Media:
        css = {
            'all': ('admin/css/atlas_admin.css',)
        }


# Renomeia o verbose_name do model Group para 'Cargo'
Group._meta.verbose_name = 'Cargo'
Group._meta.verbose_name_plural = 'Cargos'


# ============================================================
# SISTEMA
# ============================================================

@admin.register(Sistema)
class SistemaAdmin(admin.ModelAdmin):
    """Admin para gerenciar Sistemas/Aplicações."""
    
    list_display = ['nome', 'codigo', 'icone', 'get_vinculos_count', 'ativo', 'ordem']
    list_filter = ['ativo']
    search_fields = ['nome', 'codigo']
    ordering = ['ordem', 'nome']
    
    fieldsets = (
        (None, {'fields': ('nome', 'codigo', 'descricao')}),
        ('Aparência', {'fields': ('icone', 'cor', 'ordem')}),
        ('Status', {'fields': ('ativo',)}),
        ('Datas', {'fields': ('data_criacao', 'ultima_atualizacao')}),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao']
    
    def get_vinculos_count(self, obj):
        """Número de vínculos ativos neste sistema."""
        return obj.vinculos.filter(ativo=True).count()
    get_vinculos_count.short_description = 'Vínculos'


# ============================================================
# DEPARTAMENTO
# ============================================================

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    """Admin para gerenciar Departamentos/Áreas."""
    
    list_display = ['nome', 'codigo', 'icone', 'get_vinculos_count', 'ativo', 'ordem']
    list_filter = ['ativo']
    search_fields = ['nome', 'codigo']
    ordering = ['ordem', 'nome']
    
    fieldsets = (
        (None, {'fields': ('nome', 'codigo', 'descricao')}),
        ('Aparência', {'fields': ('icone', 'ordem')}),
        ('Status', {'fields': ('ativo',)}),
        ('Datas', {'fields': ('data_criacao', 'ultima_atualizacao')}),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao']
    
    def get_vinculos_count(self, obj):
        """Número de vínculos ativos neste departamento."""
        return obj.vinculos.filter(ativo=True).count()
    get_vinculos_count.short_description = 'Vínculos'


# ============================================================
# USUÁRIO VÍNCULO
# ============================================================

class UsuarioVinculoInline(admin.TabularInline):
    """Inline para gerenciar vínculos no User."""
    model = UsuarioVinculo
    extra = 1
    autocomplete_fields = ['sistema', 'departamento']
    fields = ['sistema', 'departamento', 'ativo']


@admin.register(UsuarioVinculo)
class UsuarioVinculoAdmin(admin.ModelAdmin):
    """Admin para gerenciar Vínculos de Acesso (Sistema + Departamento)."""
    
    list_display = ['usuario', 'get_cargo', 'sistema', 'departamento', 'ativo', 'data_criacao']
    list_filter = ['sistema', 'departamento', 'ativo', 'usuario__groups']
    search_fields = ['usuario__nome', 'usuario__email', 'sistema__nome', 'departamento__nome']
    autocomplete_fields = ['usuario', 'sistema', 'departamento']
    ordering = ['-data_criacao']
    
    fieldsets = (
        ('Vínculo', {'fields': ('usuario', 'sistema', 'departamento')}),
        ('Status', {'fields': ('ativo',)}),
        ('Datas', {'fields': ('data_criacao', 'ultima_atualizacao')}),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao']
    
    def get_cargo(self, obj):
        """Exibe o cargo (group) do usuário."""
        cargo = obj.usuario.get_cargo()
        return cargo.name if cargo else '-'
    get_cargo.short_description = 'Cargo'
    get_cargo.admin_order_field = 'usuario__groups__name'


# ============================================================
# USER
# ============================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin para o modelo User customizado."""
    
    list_display = ['email', 'nome', 'tipo_usuario', 'get_cargo_display', 'get_empresa_display', 'get_sistemas_display', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'tipo_usuario', 'groups', 'vinculos__sistema', 'vinculos__departamento']
    search_fields = ['email', 'nome', 'empresa__nome']
    ordering = ['-data_criacao']
    
    inlines = [UsuarioVinculoInline]
    filter_horizontal = ['groups', 'user_permissions']
    autocomplete_fields = ['empresa']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('nome',)}),
        ('Tipo e Empresa', {
            'fields': ('tipo_usuario', 'empresa'),
            'description': 'Defina o tipo de usuário. Se for CLIENTE, selecione a empresa.',
        }),
        ('Cargo e Permissões', {
            'fields': ('groups', 'user_permissions'),
            'description': 'O CARGO define as permissões do usuário. Adicione a grupos (cargos) para conceder permissões.',
        }),
        ('Status', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
        ('Datas', {'fields': ('last_login', 'data_criacao', 'ultima_atualizacao')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome', 'password1', 'password2', 'tipo_usuario'),
        }),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao', 'last_login']
    
    def get_cargo_display(self, obj):
        """Exibe o cargo principal do usuário."""
        if obj.is_superuser:
            return '🔑 Superuser'
        cargo = obj.get_cargo()
        return cargo.name if cargo else '-'
    get_cargo_display.short_description = 'Cargo'
    
    def get_empresa_display(self, obj):
        """Exibe a empresa do cliente."""
        if obj.tipo_usuario == User.TipoUsuario.INTERNO:
            return '-'
        return obj.empresa.nome if obj.empresa else '⚠️ Sem empresa'
    get_empresa_display.short_description = 'Empresa'
    
    def get_sistemas_display(self, obj):
        """Exibe os sistemas do usuário com departamentos."""
        if obj.is_superuser:
            return '🔑 Acesso Total'
        
        vinculos = obj.vinculos.filter(ativo=True).select_related('sistema', 'departamento')
        if not vinculos.exists():
            return '-'
        
        # Agrupa por sistema
        sistemas = {}
        for v in vinculos:
            key = v.sistema.nome
            if key not in sistemas:
                sistemas[key] = []
            sistemas[key].append(v.departamento.nome)
        
        return ' | '.join([f'{s}: {", ".join(d)}' for s, d in sistemas.items()])
    get_sistemas_display.short_description = 'Acessos'
    
    def get_queryset(self, request):
        """Otimiza queries com prefetch."""
        return super().get_queryset(request).prefetch_related(
            'groups', 'vinculos__sistema', 'vinculos__departamento'
        ).select_related('empresa')

