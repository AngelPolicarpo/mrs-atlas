from django.contrib import admin
from .models import Titular, VinculoTitular, Dependente


class VinculoTitularInline(admin.TabularInline):
    model = VinculoTitular
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    fields = ('tipo_vinculo', 'empresa', 'amparo', 'consulado', 'tipo_atualizacao', 
              'status', 'data_entrada_pais', 'data_fim_vinculo')


class DependenteInline(admin.TabularInline):
    model = Dependente
    extra = 0
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    fields = ('nome', 'tipo_dependente', 'passaporte', 'rnm', 'nacionalidade', 
              'sexo', 'data_nascimento')


@admin.register(Titular)
class TitularAdmin(admin.ModelAdmin):
    list_display = ('nome', 'rnm', 'cpf', 'nacionalidade', 'email', 'data_criacao')
    list_filter = ('nacionalidade', 'sexo')
    search_fields = ('nome', 'rnm', 'cpf', 'passaporte', 'email')
    ordering = ('nome',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    inlines = [VinculoTitularInline, DependenteInline]
    
    fieldsets = (
        ('Identificação', {
            'fields': ('nome', 'rnm', 'cpf', 'cnh', 'passaporte', 'data_validade_passaporte', 'nacionalidade')
        }),
        ('Documentos', {
            'fields': ('ctps', 'status_visto', 'data_validade_cnh')
        }),
        ('Dados Pessoais', {
            'fields': ('sexo', 'data_nascimento', 'filiacao_um', 'filiacao_dois')
        }),
        ('Contato', {
            'fields': ('email', 'telefone')
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


@admin.register(VinculoTitular)
class VinculoTitularAdmin(admin.ModelAdmin):
    list_display = ('titular', 'tipo_vinculo', 'empresa', 'status', 'data_entrada_pais', 'data_fim_vinculo')
    list_filter = ('tipo_vinculo', 'status', 'empresa')
    search_fields = ('titular__nome', 'titular__rnm', 'empresa__nome')
    ordering = ('-data_criacao',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    raw_id_fields = ('titular', 'empresa')
    
    fieldsets = (
        ('Vínculo', {
            'fields': ('titular', 'tipo_vinculo', 'empresa', 'amparo', 'consulado', 'tipo_atualizacao')
        }),
        ('Datas', {
            'fields': ('status', 'data_entrada_pais', 'data_fim_vinculo')
        }),
        ('Observações', {
            'fields': ('observacoes',)
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


@admin.register(Dependente)
class DependenteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'titular', 'tipo_dependente', 'rnm', 'nacionalidade')
    list_filter = ('tipo_dependente', 'nacionalidade', 'sexo')
    search_fields = ('nome', 'rnm', 'passaporte', 'titular__nome')
    ordering = ('nome',)
    readonly_fields = ('data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por')
    raw_id_fields = ('titular',)
    
    fieldsets = (
        ('Vínculo', {
            'fields': ('titular', 'tipo_dependente')
        }),
        ('Identificação', {
            'fields': ('nome', 'rnm', 'passaporte', 'data_validade_passaporte', 'nacionalidade')
        }),
        ('Documentos', {
            'fields': ('cnh', 'ctps', 'status_visto')
        }),
        ('Dados Pessoais', {
            'fields': ('sexo', 'data_nascimento', 'filiacao_um', 'filiacao_dois')
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
