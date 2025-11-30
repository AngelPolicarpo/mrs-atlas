from django.contrib import admin
from .models import Empresa


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'email', 'telefone', 'status', 'data_registro', 'data_criacao')
    list_filter = ('status', 'data_registro')
    search_fields = ('nome', 'cnpj', 'email')
    ordering = ('nome',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    
    fieldsets = (
        ('Dados da Empresa', {
            'fields': ('nome', 'cnpj', 'email', 'telefone', 'endereco')
        }),
        ('Status', {
            'fields': ('status', 'data_registro')
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'atualizado_por', 'data_criacao', 'ultima_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)
