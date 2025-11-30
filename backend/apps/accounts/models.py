import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from simple_history.models import HistoricalRecords


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
