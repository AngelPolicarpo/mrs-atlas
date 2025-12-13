"""
Management command para traduzir as permissões do Django para português.

Uso:
    python manage.py translate_permissions
"""

from django.core.management.base import BaseCommand

from apps.accounts.translations import update_permission_names


class Command(BaseCommand):
    help = 'Traduz os nomes das permissões do Django para português brasileiro'
    
    def handle(self, *args, **options):
        self.stdout.write('Traduzindo permissões para português...')
        
        count = update_permission_names()
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ {count} permissões traduzidas com sucesso!')
        )
