from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Controle de Acesso'
    
    def ready(self):
        """
        Executa quando o app é carregado.
        Conecta signals para tradução automática de permissões.
        """
        from django.db.models.signals import post_migrate
        
        def translate_permissions_after_migrate(sender, **kwargs):
            """Traduz permissões após migrations."""
            # Evitar importação circular
            from apps.accounts.translations import update_permission_names
            
            # Só traduz se o sender for este app ou auth
            if sender.name in ['apps.accounts', 'django.contrib.auth']:
                try:
                    update_permission_names()
                except Exception:
                    # Ignora erros durante a migração inicial
                    pass
        
        # Conectar signal
        post_migrate.connect(translate_permissions_after_migrate, sender=self)

