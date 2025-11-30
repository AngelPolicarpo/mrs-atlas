from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin

from .models import Client, ClientDocument


class ClientDocumentInline(admin.TabularInline):
    model = ClientDocument
    extra = 0
    readonly_fields = ['uploaded_by', 'created_at']


@admin.register(Client)
class ClientAdmin(SimpleHistoryAdmin):
    """Admin para Cliente com histórico LGPD."""
    
    list_display = [
        'name',
        'email',
        'phone',
        'company',
        'is_active',
        'lgpd_consent',
        'created_at',
    ]
    list_filter = ['is_active', 'lgpd_consent', 'marketing_consent', 'state', 'created_at']
    search_fields = ['name', 'email', 'phone', 'cpf', 'company', 'cnpj']
    readonly_fields = ['created_by', 'created_at', 'updated_at', 'lgpd_consent_date']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('name', 'email', 'phone', 'cpf')
        }),
        ('Endereço', {
            'fields': ('address', 'city', 'state', 'zip_code'),
            'classes': ('collapse',),
        }),
        ('Empresa', {
            'fields': ('company', 'cnpj'),
            'classes': ('collapse',),
        }),
        ('LGPD / Consentimentos', {
            'fields': ('lgpd_consent', 'lgpd_consent_date', 'marketing_consent'),
        }),
        ('Observações', {
            'fields': ('notes',),
            'classes': ('collapse',),
        }),
        ('Metadados', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at'),
        }),
    )
    
    inlines = [ClientDocumentInline]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ClientDocument)
class ClientDocumentAdmin(SimpleHistoryAdmin):
    """Admin para Documentos de Cliente."""
    
    list_display = ['title', 'client', 'document_type', 'uploaded_by', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['title', 'client__name', 'description']
    readonly_fields = ['uploaded_by', 'created_at']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
