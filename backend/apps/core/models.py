import uuid
from django.db import models


class BaseModel(models.Model):
    """Modelo base abstrato com campos comuns."""
    
    ativo = models.BooleanField('Ativo', default=True)
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    class Meta:
        abstract = True


class Nacionalidade(BaseModel):
    """Tabela de nacionalidades."""
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_nacionalidade'
    )
    nome = models.CharField('Nome', max_length=100, unique=True)
    codigo_iso = models.CharField('Código ISO', max_length=3, unique=True, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Nacionalidade'
        verbose_name_plural = 'Nacionalidades'
        db_table = 'nacionalidade'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class AmparoLegal(BaseModel):
    """Tabela de amparos legais."""
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_amparo'
    )
    nome = models.CharField('Nome', max_length=100, unique=True)
    descricao = models.TextField('Descrição', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Amparo Legal'
        verbose_name_plural = 'Amparos Legais'
        db_table = 'amparo_legal'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Consulado(BaseModel):
    """Tabela de consulados."""
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_consulado'
    )
    pais = models.CharField('País', max_length=100, unique=True)
    
    class Meta:
        verbose_name = 'Consulado'
        verbose_name_plural = 'Consulados'
        db_table = 'consulado'
        ordering = ['pais']
    
    def __str__(self):
        return self.pais


class TipoAtualizacao(BaseModel):
    """Tabela de tipos de atualização."""
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_tipo_atualizacao'
    )
    nome = models.CharField('Nome', max_length=50, unique=True)
    descricao = models.TextField('Descrição', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Tipo de Atualização'
        verbose_name_plural = 'Tipos de Atualização'
        db_table = 'tipo_atualizacao'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome
