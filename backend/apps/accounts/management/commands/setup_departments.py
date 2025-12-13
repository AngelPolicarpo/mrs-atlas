"""
Management command para configurar departamentos iniciais do sistema.

Uso:
    python manage.py setup_departments
    python manage.py setup_departments --force  # Recria mesmo se existir
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Departamento


class Command(BaseCommand):
    help = 'Configura os departamentos/sistemas iniciais do Atlas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a recriação dos departamentos mesmo se já existirem',
        )

    def handle(self, *args, **options):
        """Executa o setup dos departamentos."""
        
        # Definição dos departamentos/sistemas
        departamentos = [
            {
                'codigo': Departamento.Codigo.PRAZOS,
                'nome': 'Sistema de Prazos',
                'descricao': 'Gestão de prazos, titulares, dependentes e empresas',
                'icone': '📅',
                'cor': '#3b82f6',  # Azul
                'ordem': 1,
            },
            {
                'codigo': Departamento.Codigo.ORDEM_SERVICO,
                'nome': 'Ordens de Serviço',
                'descricao': 'Gestão de ordens de serviço e atendimentos',
                'icone': '📋',
                'cor': '#10b981',  # Verde
                'ordem': 2,
            },
        ]

        force = options['force']
        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for dept_data in departamentos:
                codigo = dept_data.pop('codigo')
                
                if force:
                    # Atualiza ou cria
                    dept, created = Departamento.objects.update_or_create(
                        codigo=codigo,
                        defaults=dept_data
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Criado: {dept.nome}')
                        )
                    else:
                        updated_count += 1
                        self.stdout.write(
                            self.style.WARNING(f'↻ Atualizado: {dept.nome}')
                        )
                else:
                    # Apenas cria se não existir
                    dept, created = Departamento.objects.get_or_create(
                        codigo=codigo,
                        defaults=dept_data
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Criado: {dept.nome}')
                        )
                    else:
                        self.stdout.write(
                            self.style.NOTICE(f'- Já existe: {dept.nome}')
                        )

        # Resumo
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(f'Departamentos criados: {created_count}')
        self.stdout.write(f'Departamentos atualizados: {updated_count}')
        self.stdout.write(f'Total de departamentos: {Departamento.objects.count()}')
        self.stdout.write(self.style.SUCCESS('=' * 50))
