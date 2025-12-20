from django.contrib import admin
from .models import Contrato, ContratoServico


class ContratoServicoInline(admin.TabularInline):
    """Inline para serviços do contrato."""
    model = ContratoServico
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    autocomplete_fields = ['servico']
    fields = (
        'servico', 'valor', 'ativo',
        'data_criacao', 'ultima_atualizacao'
    )


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):
    """Admin para Contrato."""
    
    list_display = (
        'numero', 'empresa_contratante',
        'status', 'data_inicio', 'data_fim', 'valor_total_servicos_display'
    )
    list_filter = ('status', 'data_inicio')
    search_fields = ('numero', 'empresa_contratante__nome', 'observacao')
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    autocomplete_fields = ['empresa_contratante']
    date_hierarchy = 'data_inicio'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero', 'status')
        }),
        ('Partes', {
            'fields': ('empresa_contratante',)
        }),
        ('Vigência', {
            'fields': ('data_inicio', 'data_fim')
        }),
        ('Observações', {
            'fields': ('observacao',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'atualizado_por', 'data_criacao', 'ultima_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ContratoServicoInline]
    
    def valor_total_servicos_display(self, obj):
        return f"R$ {obj.valor_total_servicos:,.2f}"
    valor_total_servicos_display.short_description = 'Valor Total'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(ContratoServico)
class ContratoServicoAdmin(admin.ModelAdmin):
    """Admin para Serviço do Contrato."""
    
    list_display = ('contrato', 'servico', 'valor', 'ativo', 'valor_total_display')
    list_filter = ('ativo', 'contrato__status')
    search_fields = ('contrato__numero', 'servico__item', 'servico__descricao')
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    autocomplete_fields = ['contrato', 'servico']
    
    def valor_total_display(self, obj):
        return f"R$ {obj.valor_total:,.2f}"
    valor_total_display.short_description = 'Valor Total'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)
