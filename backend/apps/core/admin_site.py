"""
Atlas Admin Site Customization
Configura o título, cabeçalho e estilos do Django Admin
"""

from django.contrib import admin
from django.contrib.admin import AdminSite


class AtlasAdminSite(AdminSite):
    """Custom admin site para o Atlas."""
    
    site_header = 'Atlas Admin'
    site_title = 'Atlas'
    index_title = 'Painel de Administração'
    
    def each_context(self, request):
        """Adiciona contexto extra para cada página do admin."""
        context = super().each_context(request)
        context['extra_css'] = ['admin/css/custom.css']
        return context


# Customize o admin site padrão
admin.site.site_header = 'Atlas Admin'
admin.site.site_title = 'Atlas'
admin.site.index_title = 'Painel de Administração'


class CustomAdminMixin:
    """
    Mixin para adicionar CSS customizado em todos os ModelAdmin.
    Use: class MyModelAdmin(CustomAdminMixin, admin.ModelAdmin):
    """
    
    class Media:
        css = {
            'all': ('admin/css/custom.css',)
        }
