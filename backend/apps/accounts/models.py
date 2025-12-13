"""
Models de Controle de Acesso - RBAC + ABAC Híbrido

Estrutura de 3 dimensões:
- Sistema: Aplicação (Prazos, Ordem de Serviço)
- Departamento: Área organizacional (Consular, Jurídico, TI, RH)
- Cargo: Nível de acesso (Consultor, Gestor, Diretor)

Permissões = f(Sistema, Departamento, Cargo)
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
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
# CARGO - Nível de Acesso
# ============================================================

class Cargo(models.Model):
    """
    Define o nível de acesso/permissões.
    Pode ser customizado por sistema se necessário.
    
    Níveis padrão:
    - Consultor: Apenas leitura (view)
    - Gestor: CRUD completo (view, add, change, delete, export)
    - Diretor: Acesso total + admin (view, add, change, delete, export, admin)
    """
    
    class Codigo(models.TextChoices):
        """Códigos dos cargos disponíveis."""
        CONSULTOR = 'consultor', 'Consultor'
        GESTOR = 'gestor', 'Gestor'
        DIRETOR = 'diretor', 'Diretor'
    
    # Permissões padrão por cargo
    PERMISSOES_PADRAO = {
        'consultor': ['view'],
        'gestor': ['view', 'add', 'change', 'delete', 'export'],
        'diretor': ['view', 'add', 'change', 'delete', 'export', 'admin'],
    }
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_cargo'
    )
    nome = models.CharField('Nome', max_length=100)
    codigo = models.CharField(
        'Código',
        max_length=50,
        unique=True,
        choices=Codigo.choices,
        help_text='Identificador único do cargo'
    )
    descricao = models.TextField('Descrição', blank=True, default='')
    nivel = models.PositiveIntegerField(
        'Nível',
        default=1,
        help_text='Nível hierárquico (1=menor, 3=maior)'
    )
    ativo = models.BooleanField('Ativo', default=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    class Meta:
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
        db_table = 'cargo'
        ordering = ['nivel', 'nome']
    
    def __str__(self):
        return self.nome
    
    def get_permissoes(self):
        """Retorna lista de permissões do cargo."""
        return self.PERMISSOES_PADRAO.get(self.codigo, ['view'])


# ============================================================
# USUÁRIO VÍNCULO - Tabela Pivot (Sistema x Departamento x Cargo)
# ============================================================

class UsuarioVinculo(models.Model):
    """
    Tabela pivot que relaciona Usuário ↔ Sistema ↔ Departamento ↔ Cargo.
    
    Cada vínculo define:
    - Em qual SISTEMA o usuário tem acesso
    - Em qual DEPARTAMENTO (escopo de dados)
    - Com qual CARGO (nível de permissão)
    
    Um usuário pode ter múltiplos vínculos:
    - Mesmo sistema, diferentes departamentos
    - Diferentes sistemas, mesmo departamento
    - Combinações variadas
    
    Exemplo:
    | Sistema          | Departamento | Cargo     |
    |------------------|--------------|-----------|
    | Ordem de Serviço | Consular     | Gestor    |
    | Prazos           | Jurídico     | Consultor |
    | Ordem de Serviço | TI           | Diretor   |
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_usuario_vinculo'
    )
    usuario = models.ForeignKey(
        'User',
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
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.PROTECT,
        related_name='vinculos',
        verbose_name='Cargo',
        db_column='id_cargo'
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
        return f'{self.usuario.nome} | {self.sistema.nome} | {self.departamento.nome} ({self.cargo.nome})'
    
    def get_permissoes(self):
        """Retorna lista de permissões deste vínculo."""
        return self.cargo.get_permissoes()


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
    
    Relacionamentos de acesso via UsuarioVinculo:
    - user.vinculos → Todos os vínculos
    - user.get_sistemas() → Sistemas disponíveis
    - user.get_departamentos(sistema) → Departamentos em um sistema
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
    
    # ===== Métodos de Acesso (RBAC + ABAC) =====
    
    def get_vinculos_ativos(self):
        """Retorna todos os vínculos ativos do usuário."""
        return self.vinculos.filter(
            ativo=True,
            sistema__ativo=True,
            departamento__ativo=True,
            cargo__ativo=True
        ).select_related('sistema', 'departamento', 'cargo')
    
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
    
    def get_cargo(self, sistema_codigo, departamento_codigo):
        """Retorna o cargo do usuário em um contexto específico."""
        vinculo = self.get_vinculo(sistema_codigo, departamento_codigo)
        return vinculo.cargo if vinculo else None
    
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
    
    def tem_permissao(self, sistema_codigo, departamento_codigo, acao):
        """
        Verifica se o usuário tem permissão para uma ação em um contexto.
        
        Args:
            sistema_codigo: Código do sistema (ex: 'prazos')
            departamento_codigo: Código do departamento (ex: 'consular')
            acao: Ação a verificar ('view', 'add', 'change', 'delete', 'export', 'admin')
        
        Returns:
            bool: True se tem permissão
        """
        if self.is_superuser:
            return True
        
        vinculo = self.get_vinculo(sistema_codigo, departamento_codigo)
        if not vinculo:
            return False
        
        return acao in vinculo.get_permissoes()
    
    def get_maior_cargo_no_sistema(self, sistema_codigo):
        """
        Retorna o cargo de maior nível que o usuário tem em um sistema.
        Útil para determinar o nível geral de acesso no sistema.
        """
        if self.is_superuser:
            return Cargo.objects.filter(codigo='diretor').first()
        
        vinculo = self.vinculos.filter(
            sistema__codigo=sistema_codigo,
            ativo=True
        ).select_related('cargo').order_by('-cargo__nivel').first()
        
        return vinculo.cargo if vinculo else None
    
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
                'cargo': vinculo.cargo.codigo,
                'cargo_nome': vinculo.cargo.nome,
                'permissoes': vinculo.get_permissoes()
            }
        
        return resultado
    
    def get_sistemas_disponiveis(self):
        """
        Retorna lista de sistemas disponíveis para o usuário.
        Inclui informações resumidas de departamentos e maior cargo.
        
        Returns:
            list: Lista de dicts com informações dos sistemas
        """
        sistemas = []
        
        for sistema in self.get_sistemas():
            # Departamentos neste sistema
            departamentos_no_sistema = self.get_departamentos(sistema.codigo)
            
            # Maior cargo neste sistema
            maior_cargo = self.get_maior_cargo_no_sistema(sistema.codigo)
            
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
                'maior_cargo': maior_cargo.codigo if maior_cargo else None,
                'maior_cargo_nome': maior_cargo.nome if maior_cargo else None,
            })
        
        return sistemas


# ============================================================
# MODELO LEGADO - Para compatibilidade durante migração
# ============================================================

# Manter UsuarioDepartamento temporariamente para a migration funcionar
# Será removido após migração de dados
class UsuarioDepartamento(models.Model):
    """DEPRECATED - Usar UsuarioVinculo. Mantido para migração."""
    
    class Cargo(models.TextChoices):
        CONSULTOR = 'consultor', 'Consultor'
        GESTOR = 'gestor', 'Gestor'
        DIRETOR = 'diretor', 'Diretor'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='vinculos_departamento_legacy',
        db_column='id_usuario'
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name='vinculos_usuario_legacy',
        db_column='id_departamento'
    )
    cargo = models.CharField(max_length=20, choices=Cargo.choices, default=Cargo.CONSULTOR)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = 'Vínculo Legado (DEPRECATED)'
        verbose_name_plural = 'Vínculos Legados (DEPRECATED)'
        db_table = 'usuario_departamento'
        unique_together = ['usuario', 'departamento']
