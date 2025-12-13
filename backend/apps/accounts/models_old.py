import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from simple_history.models import HistoricalRecords


class Departamento(models.Model):
    """
    Representa um sistema/departamento do Atlas.
    Cada departamento define um contexto de permissões.
    
    Exemplos: 'prazos' (Sistema de Prazos), 'ordem_servico' (Ordens de Serviço)
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
        db_column='id_departamento'
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
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        db_table = 'departamento'
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome
    
    def get_usuarios(self):
        """Retorna todos os usuários vinculados a este departamento."""
        return User.objects.filter(
            vinculos_departamento__departamento=self,
            vinculos_departamento__ativo=True
        )


class UsuarioDepartamento(models.Model):
    """
    Tabela pivot que relaciona Usuário ↔ Departamento.
    Define o cargo (nível de acesso) do usuário em cada departamento.
    """
    
    class Cargo(models.TextChoices):
        """Cargos disponíveis e seus níveis de acesso."""
        CONSULTOR = 'consultor', 'Consultor'      # Apenas leitura
        GESTOR = 'gestor', 'Gestor'               # CRUD completo no departamento
        DIRETOR = 'diretor', 'Diretor'            # Acesso total + configurações
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_usuario_departamento'
    )
    usuario = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='vinculos_departamento',
        verbose_name='Usuário',
        db_column='id_usuario'
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name='vinculos_usuario',
        verbose_name='Departamento',
        db_column='id_departamento'
    )
    cargo = models.CharField(
        'Cargo',
        max_length=20,
        choices=Cargo.choices,
        default=Cargo.CONSULTOR
    )
    ativo = models.BooleanField('Ativo', default=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Histórico para auditoria
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = 'Vínculo Usuário-Departamento'
        verbose_name_plural = 'Vínculos Usuário-Departamento'
        db_table = 'usuario_departamento'
        unique_together = ['usuario', 'departamento']
        ordering = ['departamento__ordem', 'departamento__nome']
    
    def __str__(self):
        return f'{self.usuario.nome} - {self.departamento.nome} ({self.get_cargo_display()})'
    
    def get_permissoes(self):
        """
        Retorna as permissões efetivas baseadas no cargo.
        Permissões são derivadas da combinação departamento + cargo.
        """
        permissoes_base = {
            self.Cargo.CONSULTOR: ['view'],
            self.Cargo.GESTOR: ['view', 'add', 'change', 'delete', 'export'],
            self.Cargo.DIRETOR: ['view', 'add', 'change', 'delete', 'export', 'admin'],
        }
        return permissoes_base.get(self.cargo, [])


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
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser precisa ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser precisa ter is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuário customizado usando email como identificador único.
    Corresponde à tabela 'usuario' do schema.
    """
    
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
    
    is_staff = models.BooleanField(
        'Equipe',
        default=False,
        help_text='Indica se o usuário pode acessar o admin.',
    )
    is_active = models.BooleanField(
        'Ativo',
        default=True,
        db_column='ativo',
        help_text='Indica se o usuário está ativo. Desmarque ao invés de deletar.',
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
        """Retorna nome completo."""
        return self.nome or self.email
    
    def get_short_name(self):
        """Retorna primeiro nome."""
        if self.nome:
            return self.nome.split()[0]
        return self.email.split('@')[0]
    
    # ===== Métodos de Departamento e Permissões =====
    
    def get_departamentos(self):
        """Retorna queryset de departamentos ativos do usuário."""
        return Departamento.objects.filter(
            vinculos_usuario__usuario=self,
            vinculos_usuario__ativo=True,
            ativo=True
        ).distinct()
    
    def get_vinculos_ativos(self):
        """Retorna vínculos ativos com departamentos."""
        return self.vinculos_departamento.filter(ativo=True).select_related('departamento')
    
    def get_departamento_vinculo(self, departamento_codigo):
        """Retorna o vínculo do usuário com um departamento específico."""
        try:
            return self.vinculos_departamento.get(
                departamento__codigo=departamento_codigo,
                ativo=True
            )
        except UsuarioDepartamento.DoesNotExist:
            return None
    
    def get_cargo_em_departamento(self, departamento_codigo):
        """Retorna o cargo do usuário em um departamento."""
        vinculo = self.get_departamento_vinculo(departamento_codigo)
        return vinculo.cargo if vinculo else None
    
    def tem_acesso_departamento(self, departamento_codigo):
        """Verifica se o usuário tem acesso a um departamento."""
        if self.is_superuser:
            return True
        return self.vinculos_departamento.filter(
            departamento__codigo=departamento_codigo,
            ativo=True
        ).exists()
    
    def tem_permissao(self, departamento_codigo, acao):
        """
        Verifica se o usuário tem permissão para uma ação em um departamento.
        
        Args:
            departamento_codigo: Código do departamento (ex: 'prazos')
            acao: Ação a verificar (ex: 'view', 'add', 'change', 'delete', 'export', 'admin')
        
        Returns:
            bool: True se tem permissão
        """
        if self.is_superuser:
            return True
        
        vinculo = self.get_departamento_vinculo(departamento_codigo)
        if not vinculo:
            return False
        
        return acao in vinculo.get_permissoes()
    
    def get_todas_permissoes(self):
        """
        Retorna todas as permissões do usuário em formato estruturado.
        
        Returns:
            dict: {
                'departamento_codigo': {
                    'cargo': 'gestor',
                    'permissoes': ['view', 'add', 'change', 'delete', 'export']
                }
            }
        """
        if self.is_superuser:
            # Superuser tem todas as permissões em todos os departamentos
            return {
                dept.codigo: {
                    'cargo': 'diretor',
                    'permissoes': ['view', 'add', 'change', 'delete', 'export', 'admin']
                }
                for dept in Departamento.objects.filter(ativo=True)
            }
        
        permissoes = {}
        for vinculo in self.get_vinculos_ativos():
            permissoes[vinculo.departamento.codigo] = {
                'cargo': vinculo.cargo,
                'permissoes': vinculo.get_permissoes()
            }
        return permissoes
    
    def get_sistemas_disponiveis(self):
        """
        Retorna lista de sistemas/departamentos disponíveis para o usuário.
        Usado na tela de seleção de sistema.
        
        Returns:
            list: Lista de dicts com informações dos sistemas
        """
        if self.is_superuser:
            departamentos = Departamento.objects.filter(ativo=True)
        else:
            departamentos = self.get_departamentos()
        
        return [
            {
                'id': str(dept.id),
                'codigo': dept.codigo,
                'nome': dept.nome,
                'descricao': dept.descricao,
                'icone': dept.icone,
                'cor': dept.cor,
                'cargo': self.get_cargo_em_departamento(dept.codigo) or 'diretor',
            }
            for dept in departamentos
        ]
