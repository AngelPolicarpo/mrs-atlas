import uuid
from django.conf import settings
from django.db import models


class Titular(models.Model):
    """Modelo de Titular (estrangeiro com RNM)."""
    
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
    ]
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_titular'
    )
    nome = models.CharField('Nome', max_length=200)
    cpf = models.CharField('CPF', max_length=14, unique=True, blank=True, null=True)
    cnh = models.CharField('CNH', max_length=14, unique=True, blank=True, null=True)
    passaporte = models.CharField('Passaporte', max_length=50, blank=True, null=True)
    rnm = models.CharField('RNM', max_length=100, unique=True)
    
    nacionalidade = models.ForeignKey(
        'core.Nacionalidade',
        on_delete=models.PROTECT,
        related_name='titulares',
        verbose_name='Nacionalidade',
        db_column='id_nacionalidade'
    )
    
    sexo = models.CharField('Sexo', max_length=1, choices=SEXO_CHOICES, blank=True, null=True)
    email = models.EmailField('Email', max_length=150, blank=True, null=True)
    telefone = models.CharField('Telefone', max_length=20, blank=True, null=True)
    pai = models.CharField('Nome do Pai', max_length=200, blank=True, null=True)
    mae = models.CharField('Nome da Mãe', max_length=200, blank=True, null=True)
    data_nascimento = models.DateField('Data de Nascimento', blank=True, null=True)
    data_validade_cnh = models.DateField('Validade da CNH', blank=True, null=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='titulares_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='titulares_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Titular'
        verbose_name_plural = 'Titulares'
        db_table = 'titular'
        ordering = ['nome']
        indexes = [
            models.Index(fields=['nome', 'data_nascimento']),
            models.Index(fields=['nacionalidade']),
        ]
    
    def __str__(self):
        return f"{self.nome} ({self.rnm})"


class VinculoTitular(models.Model):
    """Modelo de Vínculo do Titular (com empresa, consulado, etc.)."""
    
    TIPO_VINCULO_CHOICES = [
        ('EMPRESA', 'Empresa'),
        ('PARTICULAR', 'Particular'),
        ('CONSULADO', 'Consulado'),
        ('AUTONOMO', 'Autônomo'),
        ('ESTUDANTE', 'Estudante'),
        ('OUTRO', 'Outro'),
    ]
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_vinculo'
    )
    
    titular = models.ForeignKey(
        Titular,
        on_delete=models.CASCADE,
        related_name='vinculos',
        verbose_name='Titular',
        db_column='id_titular'
    )
    
    tipo_vinculo = models.CharField(
        'Tipo de Vínculo',
        max_length=20,
        choices=TIPO_VINCULO_CHOICES
    )
    
    empresa = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_titulares',
        verbose_name='Empresa',
        db_column='id_empresa'
    )
    
    amparo = models.ForeignKey(
        'core.AmparoLegal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos',
        verbose_name='Amparo Legal',
        db_column='id_amparo'
    )
    
    consulado = models.ForeignKey(
        'core.Consulado',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos',
        verbose_name='Consulado',
        db_column='id_consulado'
    )
    
    tipo_atualizacao = models.ForeignKey(
        'core.TipoAtualizacao',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos',
        verbose_name='Tipo de Atualização',
        db_column='id_tipo_atualizacao'
    )
    
    status = models.BooleanField('Status', default=True)
    data_entrada_pais = models.DateField('Data de Entrada no País', blank=True, null=True)
    data_fim_vinculo = models.DateField('Data Fim do Vínculo', blank=True, null=True)
    observacoes = models.TextField('Observações', blank=True, null=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Vínculo do Titular'
        verbose_name_plural = 'Vínculos dos Titulares'
        db_table = 'vinculo_titular'
        ordering = ['-data_criacao']
        indexes = [
            models.Index(fields=['titular']),
            models.Index(fields=['tipo_vinculo']),
            models.Index(fields=['status']),
            models.Index(fields=['empresa']),
            models.Index(fields=['data_fim_vinculo']),
        ]
    
    def __str__(self):
        return f"{self.titular.nome} - {self.get_tipo_vinculo_display()}"


class Dependente(models.Model):
    """Modelo de Dependente do Titular."""
    
    TIPO_DEPENDENTE_CHOICES = [
        ('CONJUGE', 'Cônjuge'),
        ('FILHO', 'Filho(a)'),
        ('ENTEADO', 'Enteado(a)'),
        ('PAI_MAE', 'Pai/Mãe'),
        ('OUTRO', 'Outro'),
    ]
    
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
    ]
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_dependente'
    )
    
    titular = models.ForeignKey(
        Titular,
        on_delete=models.CASCADE,
        related_name='dependentes',
        verbose_name='Titular',
        db_column='id_titular'
    )
    
    nome = models.CharField('Nome', max_length=200)
    passaporte = models.CharField('Passaporte', max_length=50, blank=True, null=True)
    rnm = models.CharField('RNM', max_length=100, unique=True, blank=True, null=True)
    
    nacionalidade = models.ForeignKey(
        'core.Nacionalidade',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dependentes',
        verbose_name='Nacionalidade',
        db_column='id_nacionalidade'
    )
    
    tipo_dependente = models.CharField(
        'Tipo de Dependente',
        max_length=50,
        choices=TIPO_DEPENDENTE_CHOICES,
        blank=True,
        null=True
    )
    sexo = models.CharField('Sexo', max_length=1, choices=SEXO_CHOICES, blank=True, null=True)
    data_nascimento = models.DateField('Data de Nascimento', blank=True, null=True)
    pai = models.CharField('Nome do Pai', max_length=200, blank=True, null=True)
    mae = models.CharField('Nome da Mãe', max_length=200, blank=True, null=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dependentes_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dependentes_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Dependente'
        verbose_name_plural = 'Dependentes'
        db_table = 'dependente'
        ordering = ['nome']
        indexes = [
            models.Index(fields=['titular']),
            models.Index(fields=['passaporte']),
            models.Index(fields=['nacionalidade']),
        ]
    
    def __str__(self):
        return f"{self.nome} (Dependente de {self.titular.nome})"


class VinculoDependente(models.Model):
    """Modelo de Vínculo do Dependente (prazo de vencimento, amparo legal, etc.)."""
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_vinculo'
    )
    
    dependente = models.ForeignKey(
        Dependente,
        on_delete=models.CASCADE,
        related_name='vinculos',
        verbose_name='Dependente',
        db_column='id_dependente'
    )
    
    status = models.BooleanField('Status', default=True)
    data_entrada = models.DateField('Data de Entrada', blank=True, null=True)
    data_fim_vinculo = models.DateField('Data Fim do Vínculo', blank=True, null=True)
    observacoes = models.TextField('Observações', blank=True, null=True)
    
    # Dados migratórios
    amparo = models.ForeignKey(
        'core.AmparoLegal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_dependentes',
        verbose_name='Amparo Legal',
        db_column='id_amparo'
    )
    
    consulado = models.ForeignKey(
        'core.Consulado',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_dependentes',
        verbose_name='Consulado',
        db_column='id_consulado'
    )
    
    tipo_atualizacao = models.ForeignKey(
        'core.TipoAtualizacao',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_dependentes',
        verbose_name='Tipo de Atualização',
        db_column='id_tipo_atualizacao'
    )
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_dependentes_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_dependentes_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Vínculo do Dependente'
        verbose_name_plural = 'Vínculos dos Dependentes'
        db_table = 'vinculo_dependente'
        ordering = ['-data_criacao']
        indexes = [
            models.Index(fields=['dependente']),
            models.Index(fields=['status']),
            models.Index(fields=['data_fim_vinculo']),
            models.Index(fields=['amparo']),
            models.Index(fields=['consulado']),
            models.Index(fields=['tipo_atualizacao']),
        ]
    
    def __str__(self):
        return f"Vínculo de {self.dependente.nome} - {'Ativo' if self.status else 'Inativo'}"
