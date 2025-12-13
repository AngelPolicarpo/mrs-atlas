"""
Traduções das permissões do Django para português brasileiro.

Este módulo fornece traduções para os nomes das permissões que são
geradas automaticamente pelo Django (Can add X, Can change X, etc.)
"""

# Traduções dos prefixos de permissões
PERMISSION_PREFIXES = {
    'Can add': 'Pode adicionar',
    'Can change': 'Pode alterar',
    'Can delete': 'Pode excluir',
    'Can view': 'Pode visualizar',
}

# Traduções dos nomes de modelos (app.model -> nome traduzido)
MODEL_TRANSLATIONS = {
    # ===== Accounts =====
    'accounts.user': 'usuário',
    'accounts.sistema': 'sistema',
    'accounts.departamento': 'departamento',
    'accounts.cargo': 'cargo',
    'accounts.usuariovinculo': 'vínculo de acesso',
    'accounts.usuariodepartamento': 'vínculo legado',
    'accounts.historicaluser': 'histórico de usuário',
    'accounts.historicalusuariovinculo': 'histórico de vínculo',
    'accounts.historicalusuariodepartamento': 'histórico de vínculo legado',
    
    # ===== Core =====
    'core.amparolegal': 'amparo legal',
    'core.tipoatualizacao': 'tipo de atualização',
    
    # ===== Titulares =====
    'titulares.titular': 'titular',
    'titulares.dependente': 'dependente',
    'titulares.processo': 'processo',
    'titulares.arquivo': 'arquivo',
    'titulares.historicaltitular': 'histórico de titular',
    'titulares.historicaldependente': 'histórico de dependente',
    'titulares.historicalprocesso': 'histórico de processo',
    
    # ===== Empresa =====
    'empresa.empresa': 'empresa',
    'empresa.contatoempresa': 'contato de empresa',
    'empresa.historicalempresa': 'histórico de empresa',
    'empresa.historicalcontatoempresa': 'histórico de contato',
    
    # ===== Clients =====
    'clients.client': 'cliente',
    
    # ===== Auth (Django) =====
    'auth.permission': 'permissão',
    'auth.group': 'grupo',
    
    # ===== Admin (Django) =====
    'admin.logentry': 'entrada de log',
    
    # ===== Content Types (Django) =====
    'contenttypes.contenttype': 'tipo de conteúdo',
    
    # ===== Sessions (Django) =====
    'sessions.session': 'sessão',
    
    # ===== Sites (Django) =====
    'sites.site': 'site',
    
    # ===== Auth Token =====
    'authtoken.token': 'token',
    'authtoken.tokenproxy': 'token proxy',
    
    # ===== Token Blacklist =====
    'token_blacklist.blacklistedtoken': 'token na lista negra',
    'token_blacklist.outstandingtoken': 'token pendente',
    
    # ===== Account (Allauth) =====
    'account.emailaddress': 'endereço de email',
    'account.emailconfirmation': 'confirmação de email',
    
    # ===== Social Account (Allauth) =====
    'socialaccount.socialaccount': 'conta social',
    'socialaccount.socialapp': 'aplicação social',
    'socialaccount.socialtoken': 'token social',
}


def translate_permission_name(name: str, app_label: str = None, model: str = None) -> str:
    """
    Traduz o nome de uma permissão para português.
    
    Args:
        name: Nome original da permissão (ex: "Can add user")
        app_label: Label do app (ex: "accounts")
        model: Nome do modelo (ex: "user")
    
    Returns:
        Nome traduzido da permissão
    """
    translated_name = name
    
    # Traduzir o prefixo (Can add -> Pode adicionar)
    for en_prefix, pt_prefix in PERMISSION_PREFIXES.items():
        if name.startswith(en_prefix):
            # Extrair o nome do modelo do nome da permissão
            model_part = name[len(en_prefix):].strip()
            
            # Tentar encontrar tradução do modelo
            if app_label and model:
                key = f'{app_label}.{model}'.lower()
                if key in MODEL_TRANSLATIONS:
                    model_part = MODEL_TRANSLATIONS[key]
            
            translated_name = f'{pt_prefix} {model_part}'
            break
    
    return translated_name


def get_translated_permissions():
    """
    Retorna um dicionário com todas as permissões traduzidas.
    
    Returns:
        dict: {codename: nome_traduzido}
    """
    from django.contrib.auth.models import Permission
    
    translations = {}
    
    for perm in Permission.objects.select_related('content_type').all():
        app_label = perm.content_type.app_label
        model = perm.content_type.model
        
        translated = translate_permission_name(perm.name, app_label, model)
        translations[perm.codename] = translated
    
    return translations


def update_permission_names():
    """
    Atualiza os nomes das permissões no banco de dados para português.
    
    Esta função deve ser chamada após migrations para traduzir
    as permissões geradas automaticamente.
    """
    from django.contrib.auth.models import Permission
    
    updated_count = 0
    
    for perm in Permission.objects.select_related('content_type').all():
        app_label = perm.content_type.app_label
        model = perm.content_type.model
        
        translated = translate_permission_name(perm.name, app_label, model)
        
        if translated != perm.name:
            perm.name = translated
            perm.save(update_fields=['name'])
            updated_count += 1
    
    return updated_count


# Management command para traduzir permissões
if __name__ == '__main__':
    import django
    django.setup()
    
    count = update_permission_names()
    print(f'Traduzidas {count} permissões.')
