from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin para o modelo User customizado."""
    
    list_display = ['email', 'nome', 'is_active', 'is_staff', 'data_criacao']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'data_criacao']
    search_fields = ['email', 'nome']
    ordering = ['-data_criacao']
    
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
