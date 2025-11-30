from django.contrib import admin
from .models import Nacionalidade, AmparoLegal, Consulado, TipoAtualizacao


@admin.register(Nacionalidade)
class NacionalidadeAdmin(admin.ModelAdmin):
    list_display = ('nome', 'codigo_iso', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome', 'codigo_iso')
    ordering = ('nome',)


@admin.register(AmparoLegal)
class AmparoLegalAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome', 'descricao')
    ordering = ('nome',)


@admin.register(Consulado)
class ConsuladoAdmin(admin.ModelAdmin):
    list_display = ('pais', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('pais',)
    ordering = ('pais',)


@admin.register(TipoAtualizacao)
class TipoAtualizacaoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome', 'descricao')
    ordering = ('nome',)
