"""
Management command para configurar dados iniciais do sistema de acesso.

Cria:
- Sistemas (prazos, ordem_servico)
- Departamentos (consular, juridico, ti, rh, financeiro, diretoria)
- Cargos (auth_group): consultor, gestor, diretor

Uso:
    python manage.py setup_access
    python manage.py setup_access --force  # Recria mesmo se existir
"""

from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Departamento, Sistema


class Command(BaseCommand):
    help = 'Configura os dados iniciais do sistema de acesso (Sistemas, Departamentos, Cargos)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a recriação mesmo se já existirem',
        )

    def handle(self, *args, **options):
        """Executa o setup."""
        force = options['force']
        
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Configurando Sistema de Acesso ===\n'))
        
        with transaction.atomic():
            self._setup_sistemas(force)
            self._setup_departamentos(force)
            self._setup_cargos(force)
        
        self.stdout.write(self.style.SUCCESS('\n✅ Setup concluído com sucesso!\n'))
    
    def _setup_sistemas(self, force):
        """Cria os sistemas."""
        self.stdout.write(self.style.HTTP_INFO('📦 Sistemas:'))
        
        sistemas = [
            {
                'codigo': Sistema.Codigo.PRAZOS,
                'nome': 'Sistema de Prazos',
                'descricao': 'Gestão de prazos, titulares, dependentes e vínculos',
                'icone': '📅',
                'cor': '#3b82f6',
                'ordem': 1,
            },
            {
                'codigo': Sistema.Codigo.ORDEM_SERVICO,
                'nome': 'Ordens de Serviço',
                'descricao': 'Gestão de ordens de serviço e atendimentos',
                'icone': '📋',
                'cor': '#10b981',
                'ordem': 2,
            },
        ]
        
        for data in sistemas:
            codigo = data.pop('codigo')
            if force:
                obj, created = Sistema.objects.update_or_create(codigo=codigo, defaults=data)
            else:
                obj, created = Sistema.objects.get_or_create(codigo=codigo, defaults=data)
            
            status = '✓ Criado' if created else ('↻ Atualizado' if force else '- Existente')
            self.stdout.write(f'   {status}: {obj.nome}')
    
    def _setup_departamentos(self, force):
        """Cria os departamentos."""
        self.stdout.write(self.style.HTTP_INFO('\n🏢 Departamentos:'))
        
        departamentos = [
            {
                'codigo': Departamento.Codigo.CONSULAR,
                'nome': 'Consular',
                'descricao': 'Serviços consulares e atendimento ao público',
                'icone': '🏛️',
                'ordem': 1,
            },
            {
                'codigo': Departamento.Codigo.JURIDICO,
                'nome': 'Jurídico',
                'descricao': 'Assessoria jurídica e contratos',
                'icone': '⚖️',
                'ordem': 2,
            },
            {
                'codigo': Departamento.Codigo.TI,
                'nome': 'Tecnologia da Informação',
                'descricao': 'Suporte técnico e infraestrutura',
                'icone': '💻',
                'ordem': 3,
            },
            {
                'codigo': Departamento.Codigo.RH,
                'nome': 'Recursos Humanos',
                'descricao': 'Gestão de pessoas e benefícios',
                'icone': '👥',
                'ordem': 4,
            },
            {
                'codigo': Departamento.Codigo.FINANCEIRO,
                'nome': 'Financeiro',
                'descricao': 'Contas a pagar, receber e tesouraria',
                'icone': '💰',
                'ordem': 5,
            },
            {
                'codigo': Departamento.Codigo.DIRETORIA,
                'nome': 'Diretoria',
                'descricao': 'Diretoria executiva',
                'icone': '👔',
                'ordem': 6,
            },
        ]
        
        for data in departamentos:
            codigo = data.pop('codigo')
            if force:
                obj, created = Departamento.objects.update_or_create(codigo=codigo, defaults=data)
            else:
                obj, created = Departamento.objects.get_or_create(codigo=codigo, defaults=data)
            
            status = '✓ Criado' if created else ('↻ Atualizado' if force else '- Existente')
            self.stdout.write(f'   {status}: {obj.nome}')
    
    def _setup_cargos(self, force):
        """Cria os cargos (auth_group)."""
        self.stdout.write(self.style.HTTP_INFO('\n👤 Cargos (Groups):'))
        
        cargos = [
            {'name': 'Consultor'},
            {'name': 'Gestor'},
            {'name': 'Diretor'},
        ]
        
        for data in cargos:
            if force:
                obj, created = Group.objects.update_or_create(name=data['name'])
            else:
                obj, created = Group.objects.get_or_create(name=data['name'])
            
            status = '✓ Criado' if created else ('↻ Atualizado' if force else '- Existente')
            self.stdout.write(f'   {status}: {obj.name} (id={obj.id}, perms={obj.permissions.count()})')
