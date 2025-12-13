"""
Models de Controle de Acesso - RBAC Simplificado

Estrutura:
- Sistema: Aplicação (Prazos, Ordem de Serviço)
- Departamento: Área organizacional (Consular, Jurídico, TI, RH)
- Cargo: Usa auth_group nativo do Django (renomeado no Admin)
- TipoUsuario: INTERNO ou CLIENTE

Permissões = auth_group.permissions (Django nativo)
Vínculos = usuario_vinculo (Sistema + Departamento)
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, Group, PermissionsMixin
from django.db import models
from simple_history.models import HistoricalRecords


# ============================================================
# SISTEMA - Aplicação/Módulo do Atlas
# ============================================================

class Sistema(models.Model):
    """
    Representa uma aplicação/módulo do Atlas.
    Cada sistema é uma área funcional independente.
    
    Exemplos: 'prazos', 'ordem_servico', 'contratos'
    """
    
    class Codigo(models.TextChoices):
        """Códigos dos sistemas disponíveis."""
        PRAZOS = 'prazos', 'Sistema de Prazos'
        ORDEM_SERVICO = 'ordem_servico', 'Ordens de Serviço'
        # Adicionar novos sistemas aqui
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_sistema'
    )
    nome = models.CharField('Nome', max_length=100)
    codigo = models.CharField(
        'Código',
        max_length=50,
        unique=True,
        choices=Codigo.choices,
        help_text='Identificador único do sistema'
    )
    descricao = models.TextField('Descrição', blank=True, default='')
    icone = models.CharField('Ícone', max_length=50, default='📁', help_text='Emoji ou classe de ícone')
    cor = models.CharField('Cor', max_length=20, default='#3b82f6', help_text='Cor tema do sistema')
    ativo = models.BooleanField('Ativo', default=True)
    ordem = models.PositiveIntegerField('Ordem', default=0, help_text='Ordem de exibição')
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    class Meta:
        verbose_name = 'Sistema'
        verbose_name_plural = 'Sistemas'
        db_table = 'sistema'
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome


# ============================================================
# DEPARTAMENTO - Área Organizacional
# ============================================================

class Departamento(models.Model):
    """
    Representa uma área organizacional da empresa.
    Define o escopo de dados que o usuário pode acessar.
    
    Exemplos: 'consular', 'juridico', 'ti', 'rh', 'financeiro'
    """
    
    class Codigo(models.TextChoices):
        """Códigos dos departamentos disponíveis."""
        CONSULAR = 'consular', 'Consular'
        JURIDICO = 'juridico', 'Jurídico'
        TI = 'ti', 'Tecnologia da Informação'
        RH = 'rh', 'Recursos Humanos'
        FINANCEIRO = 'financeiro', 'Financeiro'
        DIRETORIA = 'diretoria', 'Diretoria'
        # Adicionar novos departamentos aqui
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_departamento'
    )
    nome = models.CharField('Nome', max_length=100)
    codigo = models.CharField(
        'Código',
        max_length=50,
        unique=True,
        choices=Codigo.choices,
        help_text='Identificador único do departamento'
    )
    descricao = models.TextField('Descrição', blank=True, default='')
    icone = models.CharField('Ícone', max_length=50, default='🏢', help_text='Emoji ou classe de ícone')
    ativo = models.BooleanField('Ativo', default=True)
    ordem = models.PositiveIntegerField('Ordem', default=0, help_text='Ordem de exibição')
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    class Meta:
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        db_table = 'departamento'
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome


# ============================================================
# USER MANAGER
# ============================================================

class UserManager(BaseUserManager):
    """Manager customizado para User sem username."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Cria e salva um usuário com email e senha."""
        if not email:
            raise ValueError('O email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Cria e salva um superusuário."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('tipo_usuario', User.TipoUsuario.INTERNO)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser precisa ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser precisa ter is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


# ============================================================
# USER - Modelo de Usuário
# ============================================================

class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuário customizado usando email como identificador único.
    
    Estrutura de acesso:
    - groups (auth_group): Define o CARGO e suas permissões
    - tipo_usuario: INTERNO ou CLIENTE
    - empresa: FK para Empresa (apenas se tipo_usuario == CLIENTE)
    - vinculos: Relacionamento com Sistema + Departamento
    """
    
    class TipoUsuario(models.TextChoices):
        """Tipos de usuário."""
        INTERNO = 'interno', 'Usuário Interno'
        CLIENTE = 'cliente', 'Cliente Externo'
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_usuario'
    )
    nome = models.CharField('Nome', max_length=200)
    email = models.EmailField(
        'Email',
        max_length=150,
        unique=True,
        error_messages={
            'unique': 'Um usuário com este email já existe.',
        },
    )
    
    # Tipo de usuário e empresa (para clientes)
    tipo_usuario = models.CharField(
        'Tipo de Usuário',
        max_length=20,
        choices=TipoUsuario.choices,
        default=TipoUsuario.INTERNO,
        help_text='Define se é usuário interno ou cliente externo'
    )
    empresa = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        verbose_name='Empresa',
        db_column='id_empresa',
        help_text='Empresa do cliente (apenas para tipo_usuario=CLIENTE)'
    )
    
    is_staff = models.BooleanField(
        'Equipe',
        default=False,
        help_text='Indica se o usuário pode acessar o admin.',
    )
    is_active = models.BooleanField(
        'Ativo',
        default=True,
        db_column='ativo',
        help_text='Indica se o usuário está ativo.',
    )
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Histórico para auditoria
    history = HistoricalRecords()
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        db_table = 'usuario'
        ordering = ['-data_criacao']
    
    def __str__(self):
        return self.nome or self.email
    
    def get_full_name(self):
        return self.nome or self.email
    
    def get_short_name(self):
        if self.nome:
            return self.nome.split()[0]
        return self.email.split('@')[0]
    
    @property
    def is_cliente(self):
        """Verifica se é usuário cliente."""
        return self.tipo_usuario == self.TipoUsuario.CLIENTE
    
    @property
    def is_interno(self):
        """Verifica se é usuário interno."""
        return self.tipo_usuario == self.TipoUsuario.INTERNO
    
    def get_cargo(self):
        """
        Retorna o cargo (group) principal do usuário.
        Considera o grupo com mais permissões como principal.
        """
        groups = self.groups.all()
        if not groups.exists():
            return None
        # Retorna o grupo com mais permissões
        return max(groups, key=lambda g: g.permissions.count())
    
    def get_cargo_nome(self):
        """Retorna o nome do cargo principal."""
        cargo = self.get_cargo()
        return cargo.name if cargo else None
    
    # ===== Métodos de Acesso (Sistema + Departamento) =====
    
    def get_vinculos_ativos(self):
        """Retorna todos os vínculos ativos do usuário."""
        return self.vinculos.filter(
            ativo=True,
            sistema__ativo=True,
            departamento__ativo=True
        ).select_related('sistema', 'departamento')
    
    def get_sistemas(self):
        """Retorna sistemas únicos que o usuário tem acesso."""
        if self.is_superuser:
            return Sistema.objects.filter(ativo=True)
        
        return Sistema.objects.filter(
            vinculos__usuario=self,
            vinculos__ativo=True,
            ativo=True
        ).distinct()
    
    def get_departamentos(self, sistema_codigo=None):
        """
        Retorna departamentos que o usuário tem acesso.
        Se sistema_codigo informado, filtra por sistema.
        """
        if self.is_superuser:
            return Departamento.objects.filter(ativo=True)
        
        queryset = Departamento.objects.filter(
            vinculos__usuario=self,
            vinculos__ativo=True,
            ativo=True
        )
        
        if sistema_codigo:
            queryset = queryset.filter(vinculos__sistema__codigo=sistema_codigo)
        
        return queryset.distinct()
    
    def get_vinculo(self, sistema_codigo, departamento_codigo):
        """Retorna o vínculo específico (sistema + departamento)."""
        try:
            return self.vinculos.get(
                sistema__codigo=sistema_codigo,
                departamento__codigo=departamento_codigo,
                ativo=True
            )
        except UsuarioVinculo.DoesNotExist:
            return None
    
    def tem_acesso_sistema(self, sistema_codigo):
        """Verifica se o usuário tem acesso a um sistema."""
        if self.is_superuser:
            return True
        return self.vinculos.filter(
            sistema__codigo=sistema_codigo,
            ativo=True
        ).exists()
    
    def tem_acesso(self, sistema_codigo, departamento_codigo=None):
        """
        Verifica se o usuário tem acesso a um contexto.
        Se departamento não informado, verifica apenas sistema.
        """
        if self.is_superuser:
            return True
        
        filtros = {
            'sistema__codigo': sistema_codigo,
            'ativo': True
        }
        if departamento_codigo:
            filtros['departamento__codigo'] = departamento_codigo
        
        return self.vinculos.filter(**filtros).exists()
    
    def get_permissoes_list(self):
        """
        Retorna lista de códigos de permissão do usuário.
        Combina permissões do grupo (cargo) com permissões diretas.
        """
        if self.is_superuser:
            return ['view', 'add', 'change', 'delete', 'export', 'admin']
        
        # Permissões do cargo (group)
        cargo = self.get_cargo()
        if not cargo:
            return ['view']  # Mínimo: visualização
        
        # Mapear permissões Django para códigos simples
        perms = set()
        for perm in cargo.permissions.all():
            codename = perm.codename
            if codename.startswith('view_'):
                perms.add('view')
            elif codename.startswith('add_'):
                perms.add('add')
            elif codename.startswith('change_'):
                perms.add('change')
            elif codename.startswith('delete_'):
                perms.add('delete')
        
        # Verificar se tem permissões admin (todas as 4 básicas)
        if {'view', 'add', 'change', 'delete'}.issubset(perms):
            perms.add('admin')
            perms.add('export')
        
        return list(perms) or ['view']
    
    def get_todas_permissoes(self):
        """
        Retorna todas as permissões do usuário em formato estruturado.
        
        Returns:
            dict: {
                'sistema_codigo': {
                    'departamento_codigo': {
                        'cargo': 'gestor',
                        'cargo_nome': 'Gestor',
                        'permissoes': ['view', 'add', 'change', 'delete', 'export']
                    }
                }
            }
        """
        cargo = self.get_cargo()
        cargo_nome = cargo.name if cargo else 'Sem Cargo'
        permissoes = self.get_permissoes_list()
        
        if self.is_superuser:
            # Superuser tem todas as permissões em todos os contextos
            resultado = {}
            for sistema in Sistema.objects.filter(ativo=True):
                resultado[sistema.codigo] = {}
                for dept in Departamento.objects.filter(ativo=True):
                    resultado[sistema.codigo][dept.codigo] = {
                        'cargo': 'diretor',
                        'cargo_nome': 'Diretor',
                        'permissoes': ['view', 'add', 'change', 'delete', 'export', 'admin']
                    }
            return resultado
        
        resultado = {}
        for vinculo in self.get_vinculos_ativos():
            sistema_codigo = vinculo.sistema.codigo
            dept_codigo = vinculo.departamento.codigo
            
            if sistema_codigo not in resultado:
                resultado[sistema_codigo] = {}
            
            resultado[sistema_codigo][dept_codigo] = {
                'cargo': cargo.name.lower() if cargo else 'sem_cargo',
                'cargo_nome': cargo_nome,
                'permissoes': permissoes
            }
        
        return resultado
    
    def get_sistemas_disponiveis(self):
        """
        Retorna lista de sistemas disponíveis para o usuário.
        Inclui informações resumidas de departamentos e cargo.
        
        Returns:
            list: Lista de dicts com informações dos sistemas
        """
        cargo = self.get_cargo()
        cargo_nome = cargo.name if cargo else None
        
        sistemas = []
        
        for sistema in self.get_sistemas():
            # Departamentos neste sistema
            departamentos_no_sistema = self.get_departamentos(sistema.codigo)
            
            sistemas.append({
                'id': str(sistema.id),
                'codigo': sistema.codigo,
                'nome': sistema.nome,
                'descricao': sistema.descricao,
                'icone': sistema.icone,
                'cor': sistema.cor,
                'departamentos': [
                    {
                        'id': str(d.id),
                        'codigo': d.codigo,
                        'nome': d.nome,
                        'icone': d.icone,
                    }
                    for d in departamentos_no_sistema
                ],
                'cargo': cargo.name.lower() if cargo else None,
                'cargo_nome': cargo_nome,
            })
        
        return sistemas


# ============================================================
# USUÁRIO VÍNCULO - Tabela Pivot (Sistema x Departamento)
# ============================================================

class UsuarioVinculo(models.Model):
    """
    Tabela pivot que relaciona Usuário ↔ Sistema ↔ Departamento.
    
    O CARGO vem do grupo (auth_group) do usuário, não deste vínculo.
    
    Cada vínculo define:
    - Em qual SISTEMA o usuário tem acesso
    - Em qual DEPARTAMENTO (escopo de dados)
    
    Um usuário pode ter múltiplos vínculos:
    - Mesmo sistema, diferentes departamentos
    - Diferentes sistemas, mesmo departamento
    - Combinações variadas
    
    Exemplo:
    | Sistema          | Departamento |
    |------------------|--------------|
    | Ordem de Serviço | Consular     |
    | Prazos           | Jurídico     |
    | Ordem de Serviço | TI           |
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_usuario_vinculo'
    )
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='vinculos',
        verbose_name='Usuário',
        db_column='id_usuario'
    )
    sistema = models.ForeignKey(
        Sistema,
        on_delete=models.CASCADE,
        related_name='vinculos',
        verbose_name='Sistema',
        db_column='id_sistema'
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name='vinculos',
        verbose_name='Departamento',
        db_column='id_departamento'
    )
    ativo = models.BooleanField('Ativo', default=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Histórico para auditoria
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = 'Vínculo de Acesso'
        verbose_name_plural = 'Vínculos de Acesso'
        db_table = 'usuario_vinculo'
        # Um usuário só pode ter um vínculo por combinação sistema+departamento
        unique_together = ['usuario', 'sistema', 'departamento']
        ordering = ['sistema__ordem', 'departamento__ordem']
    
    def __str__(self):
        cargo = self.usuario.get_cargo()
        cargo_nome = cargo.name if cargo else 'Sem Cargo'
        return f'{self.usuario.nome} | {self.sistema.nome} | {self.departamento.nome} ({cargo_nome})'
