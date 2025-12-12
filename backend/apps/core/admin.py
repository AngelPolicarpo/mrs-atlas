from django.contrib import admin
from .models import AmparoLegal, TipoAtualizacao


@admin.register(AmparoLegal)
class AmparoLegalAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome', 'descricao')
    ordering = ('nome',)


@admin.register(TipoAtualizacao)
class TipoAtualizacaoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'ativo', 'data_criacao')
    list_filter = ('ativo',)
    search_fields = ('nome', 'descricao')
    ordering = ('nome',)
