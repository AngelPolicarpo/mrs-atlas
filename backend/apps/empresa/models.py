import uuid
from django.conf import settings
from django.db import models


class Empresa(models.Model):
    """Modelo de Empresa."""
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_empresa'
    )
    nome = models.CharField('Nome', max_length=200)
    cnpj = models.CharField('CNPJ', max_length=20, unique=True)
    email = models.EmailField('Email', max_length=150, blank=True, null=True)
    telefone = models.CharField('Telefone', max_length=20, blank=True, null=True)
    endereco = models.TextField('Endereço', blank=True, null=True)
    status = models.BooleanField('Status', default=True)
    data_registro = models.DateField('Data de Registro', blank=True, null=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empresas_criadas',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empresas_atualizadas',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        db_table = 'empresa'
        ordering = ['nome']
        indexes = [
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.nome} ({self.cnpj})"
