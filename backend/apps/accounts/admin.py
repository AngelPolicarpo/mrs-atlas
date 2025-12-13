"""
Admin para o sistema de controle de acesso RBAC + ABAC híbrido.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Cargo, Departamento, Sistema, User, UsuarioVinculo


# ============================================================
# SISTEMA
# ============================================================

@admin.register(Sistema)
class SistemaAdmin(admin.ModelAdmin):
    """Admin para gerenciar Sistemas/Aplicações."""
    
    list_display = ['nome', 'codigo', 'icone', 'ativo', 'ordem']
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


# ============================================================
# DEPARTAMENTO
# ============================================================

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    """Admin para gerenciar Departamentos/Áreas."""
    
    list_display = ['nome', 'codigo', 'icone', 'ativo', 'ordem']
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


# ============================================================
# CARGO
# ============================================================

@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    """Admin para gerenciar Cargos/Níveis de Acesso."""
    
    list_display = ['nome', 'codigo', 'nivel', 'get_permissoes_display', 'ativo']
    list_filter = ['ativo', 'nivel']
    search_fields = ['nome', 'codigo']
    ordering = ['nivel', 'nome']
    
    fieldsets = (
        (None, {'fields': ('nome', 'codigo', 'descricao')}),
        ('Hierarquia', {'fields': ('nivel',)}),
        ('Status', {'fields': ('ativo',)}),
        ('Datas', {'fields': ('data_criacao', 'ultima_atualizacao')}),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao']
    
    def get_permissoes_display(self, obj):
        """Exibe as permissões do cargo."""
        return ', '.join(obj.get_permissoes())
    get_permissoes_display.short_description = 'Permissões'


# ============================================================
# USUÁRIO VÍNCULO
# ============================================================

class UsuarioVinculoInline(admin.TabularInline):
    """Inline para gerenciar vínculos no User."""
    model = UsuarioVinculo
    extra = 1
    autocomplete_fields = ['sistema', 'departamento', 'cargo']
    fields = ['sistema', 'departamento', 'cargo', 'ativo']


@admin.register(UsuarioVinculo)
class UsuarioVinculoAdmin(admin.ModelAdmin):
    """Admin para gerenciar Vínculos de Acesso."""
    
    list_display = ['usuario', 'sistema', 'departamento', 'cargo', 'ativo', 'data_criacao']
    list_filter = ['sistema', 'departamento', 'cargo', 'ativo']
    search_fields = ['usuario__nome', 'usuario__email', 'sistema__nome', 'departamento__nome']
    autocomplete_fields = ['usuario', 'sistema', 'departamento', 'cargo']
    ordering = ['-data_criacao']
    
    fieldsets = (
        ('Vínculo', {'fields': ('usuario', 'sistema', 'departamento', 'cargo')}),
        ('Status', {'fields': ('ativo',)}),
        ('Datas', {'fields': ('data_criacao', 'ultima_atualizacao')}),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao']


# ============================================================
# USER
# ============================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin para o modelo User customizado."""
    
    list_display = ['email', 'nome', 'get_sistemas_display', 'is_active', 'is_staff', 'data_criacao']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'vinculos__sistema', 'vinculos__departamento', 'data_criacao']
    search_fields = ['email', 'nome']
    ordering = ['-data_criacao']
    
    inlines = [UsuarioVinculoInline]
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('nome',)}),
        ('Permissões', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Datas', {'fields': ('last_login', 'data_criacao', 'ultima_atualizacao')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['data_criacao', 'ultima_atualizacao', 'last_login']
    
    def get_sistemas_display(self, obj):
        """Exibe os sistemas do usuário com departamentos."""
        if obj.is_superuser:
            return '🔑 Superuser (Acesso Total)'
        
        vinculos = obj.vinculos.filter(ativo=True).select_related('sistema', 'departamento', 'cargo')
        if not vinculos.exists():
            return '-'
        
        # Agrupa por sistema
        sistemas = {}
        for v in vinculos:
            key = v.sistema.nome
            if key not in sistemas:
                sistemas[key] = []
            sistemas[key].append(f'{v.departamento.nome}({v.cargo.nome[0]})')
        
        return ' | '.join([f'{s}: {", ".join(d)}' for s, d in sistemas.items()])
    
    get_sistemas_display.short_description = 'Acessos'
