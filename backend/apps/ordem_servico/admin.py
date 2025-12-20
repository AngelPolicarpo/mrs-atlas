from django.contrib import admin
from .models import (
    EmpresaPrestadora, Servico, OrdemServico, OrdemServicoItem,
    TipoDespesa, DespesaOrdemServico, OrdemServicoTitular, OrdemServicoDependente
)


# =============================================================================
# INLINES
# =============================================================================

class OrdemServicoItemInline(admin.TabularInline):
    """Inline para itens da OS (serviços do contrato)."""
    model = OrdemServicoItem
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'valor_total_display')
    fields = ('contrato_servico', 'quantidade', 'valor_aplicado', 'valor_total_display')
    autocomplete_fields = ['contrato_servico']
    
    def valor_total_display(self, obj):
        """Exibe o valor total do item."""
        if obj.pk:
            return f'R$ {obj.valor_total:,.2f}'
        return '-'
    valor_total_display.short_description = 'Valor Total'


class DespesaInline(admin.TabularInline):
    """Inline para despesas da OS."""
    model = DespesaOrdemServico
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    fields = ('tipo_despesa', 'valor', 'ativo', 'observacao')
    autocomplete_fields = ['tipo_despesa']


class OrdemServicoTitularInline(admin.TabularInline):
    """Inline para titulares da OS."""
    model = OrdemServicoTitular
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    fields = ('titular', 'observacao')
    autocomplete_fields = ['titular']


class OrdemServicoDependenteInline(admin.TabularInline):
    """Inline para dependentes da OS."""
    model = OrdemServicoDependente
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    fields = ('dependente', 'observacao')
    autocomplete_fields = ['dependente']


# =============================================================================
# MODEL ADMINS
# =============================================================================

@admin.register(EmpresaPrestadora)
class EmpresaPrestadoraAdmin(admin.ModelAdmin):
    """Admin para Empresa Prestadora (CNPJ interno)."""
    
    list_display = ('nome_juridico', 'nome_fantasia', 'cnpj', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome_juridico', 'nome_fantasia', 'cnpj')
    ordering = ('nome_juridico',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    
    fieldsets = (
        ('Identificação', {
            'fields': ('cnpj', 'nome_juridico', 'nome_fantasia', 'ativo')
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


@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    """Admin para catálogo de Serviços."""
    
    list_display = ('item', 'descricao', 'valor_base_formatado', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('item', 'descricao')
    ordering = ('item',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    
    fieldsets = (
        ('Serviço', {
            'fields': ('item', 'descricao', 'valor_base', 'ativo')
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'atualizado_por', 'data_criacao', 'ultima_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    def valor_base_formatado(self, obj):
        """Formata o valor base em reais."""
        if obj.valor_base:
            return f'R$ {obj.valor_base:,.2f}'
        return '-'
    valor_base_formatado.short_description = 'Valor Base'
    valor_base_formatado.admin_order_field = 'valor_base'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    """Admin para Ordem de Serviço."""
    
    list_display = (
        'numero', 'contrato', 'status', 'empresa_solicitante', 'empresa_pagadora',
        'valor_total_formatado', 'data_abertura', 'data_criacao'
    )
    list_filter = ('status', 'contrato')
    search_fields = ('numero', 'observacao', 'contrato__numero')
    ordering = ('-numero',)
    readonly_fields = (
        'numero', 'valor_servicos', 'valor_despesas', 'valor_total',
        'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por'
    )
    autocomplete_fields = ['contrato', 'empresa_solicitante', 'empresa_pagadora', 'responsavel', 'centro_custos']
    inlines = [OrdemServicoItemInline, DespesaInline, OrdemServicoTitularInline, OrdemServicoDependenteInline]
    date_hierarchy = 'data_abertura'
    
    fieldsets = (
        ('Ordem de Serviço', {
            'fields': ('numero', 'contrato', 'data_abertura', 'data_fechamento', 'status')
        }),
        ('Centro de Custos', {
            'fields': ('centro_custos',),
            'description': 'Empresa prestadora responsável pelo serviço'
        }),
        ('Empresas', {
            'fields': ('empresa_solicitante', 'empresa_pagadora'),
            'description': 'Solicitante: quem solicitou a OS. Pagadora: quem paga.'
        }),
        ('Responsável', {
            'fields': ('responsavel',)
        }),
        ('Valores (calculados automaticamente)', {
            'fields': ('valor_servicos', 'valor_despesas', 'valor_total'),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacao',)
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'atualizado_por', 'data_criacao', 'ultima_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    def valor_total_formatado(self, obj):
        """Formata o valor total em reais."""
        if obj.valor_total:
            return f'R$ {obj.valor_total:,.2f}'
        return 'R$ 0,00'
    valor_total_formatado.short_description = 'Valor Total'
    valor_total_formatado.admin_order_field = 'valor_total'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(OrdemServicoItem)
class OrdemServicoItemAdmin(admin.ModelAdmin):
    """Admin para Itens da OS."""
    
    list_display = ('ordem_servico', 'contrato_servico', 'quantidade', 'valor_aplicado', 'valor_total_display')
    list_filter = ('ordem_servico__status',)
    search_fields = ('ordem_servico__numero', 'contrato_servico__servico__item')
    autocomplete_fields = ['ordem_servico', 'contrato_servico']
    
    def valor_total_display(self, obj):
        return f'R$ {obj.valor_total:,.2f}'
    valor_total_display.short_description = 'Valor Total'


@admin.register(TipoDespesa)
class TipoDespesaAdmin(admin.ModelAdmin):
    """Admin para catálogo de Tipos de Despesa."""
    
    list_display = ('item', 'descricao', 'valor_base_formatado', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('item', 'descricao')
    ordering = ('item',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    
    fieldsets = (
        ('Tipo de Despesa', {
            'fields': ('item', 'descricao', 'valor_base', 'ativo')
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'atualizado_por', 'data_criacao', 'ultima_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    def valor_base_formatado(self, obj):
        """Formata o valor base em reais."""
        if obj.valor_base:
            return f'R$ {obj.valor_base:,.2f}'
        return '-'
    valor_base_formatado.short_description = 'Valor Base'
    valor_base_formatado.admin_order_field = 'valor_base'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(DespesaOrdemServico)
class DespesaOrdemServicoAdmin(admin.ModelAdmin):
    """Admin para Despesas da OS."""
    
    list_display = ('ordem_servico', 'tipo_despesa', 'valor_formatado', 'ativo', 'data_criacao')
    list_filter = ('tipo_despesa', 'ativo')
    search_fields = ('ordem_servico__numero', 'tipo_despesa__item', 'observacao')
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    autocomplete_fields = ['ordem_servico', 'tipo_despesa']
    
    def valor_formatado(self, obj):
        if obj.valor:
            return f'R$ {obj.valor:,.2f}'
        return '-'
    valor_formatado.short_description = 'Valor'
    valor_formatado.admin_order_field = 'valor'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(OrdemServicoTitular)
class OrdemServicoTitularAdmin(admin.ModelAdmin):
    """Admin para Titulares da OS."""
    
    list_display = ('ordem_servico', 'titular', 'data_criacao')
    search_fields = ('ordem_servico__numero', 'titular__nome')
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    autocomplete_fields = ['ordem_servico', 'titular']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(OrdemServicoDependente)
class OrdemServicoDependenteAdmin(admin.ModelAdmin):
    """Admin para Dependentes da OS."""
    
    list_display = ('ordem_servico', 'dependente', 'data_criacao')
    search_fields = ('ordem_servico__numero', 'dependente__nome')
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    autocomplete_fields = ['ordem_servico', 'dependente']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)
