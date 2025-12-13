"""
Management command para configurar permissões padrão nos Cargos (Groups).

Uso:
    python manage.py setup_cargo_permissions
"""

from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Configura permissões do Django Admin padrão para cada Cargo (Group)'
    
    # Mapeamento de permissões por cargo
    # Formato: cargo_nome -> lista de padrões de permissão
    CARGO_PERMISSIONS = {
        'Consultor': [
            # Apenas visualização
            'view_',
        ],
        'Gestor': [
            # CRUD completo nos modelos principais
            'view_',
            'add_',
            'change_',
            'delete_',
        ],
        'Diretor': [
            # Todas as permissões
            'view_',
            'add_',
            'change_',
            'delete_',
        ],
    }
    
    # Apps que cada cargo pode acessar
    CARGO_APPS = {
        'Consultor': ['titulares', 'empresa', 'core'],
        'Gestor': ['titulares', 'empresa', 'core'],
        'Diretor': ['titulares', 'empresa', 'core', 'accounts'],
    }
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Limpar permissões existentes antes de configurar',
        )
    
    def handle(self, *args, **options):
        clear = options.get('clear', False)
        
        for cargo in Group.objects.all():
            self.stdout.write(f'\nConfigurando cargo: {cargo.name}')
            
            if clear:
                cargo.permissions.clear()
                self.stdout.write('  - Permissões anteriores removidas')
            
            # Obter padrões de permissão para este cargo
            perm_patterns = self.CARGO_PERMISSIONS.get(cargo.name, [])
            allowed_apps = self.CARGO_APPS.get(cargo.name, [])
            
            if not perm_patterns:
                self.stdout.write(self.style.WARNING(f'  - Nenhum padrão definido para {cargo.name}'))
                continue
            
            # Buscar permissões que correspondem aos padrões
            added_count = 0
            for pattern in perm_patterns:
                perms = Permission.objects.filter(
                    codename__startswith=pattern,
                    content_type__app_label__in=allowed_apps
                )
                
                for perm in perms:
                    if perm not in cargo.permissions.all():
                        cargo.permissions.add(perm)
                        added_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'  ✓ {added_count} permissões adicionadas'))
            
            # Listar total de permissões
            total = cargo.permissions.count()
            self.stdout.write(f'  Total de permissões: {total}')
        
        self.stdout.write(self.style.SUCCESS('\n✓ Configuração de permissões concluída!'))
