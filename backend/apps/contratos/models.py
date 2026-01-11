import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Contrato(models.Model):
    """
    Contrato comercial entre empresa contratante e empresa prestadora.
    Define os serviços disponíveis para geração de Ordens de Serviço.
    """
    
    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('CANCELADO', 'Cancelado'),
        ('FINALIZADO', 'Finalizado'),
    ]
    
    TIPO_CHOICES = [
        ('CONTRATO', 'Contrato'),
        ('PROPOSTA', 'Proposta'),
    ]
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_contrato'
    )
    
    tipo = models.CharField(
        'Tipo',
        max_length=20,
        choices=TIPO_CHOICES,
        default='CONTRATO'
    )
    
    numero = models.CharField(
        'Número do Contrato',
        max_length=50,
        blank=True,
        null=True,
        unique=True
    )
    
    # Empresas
    empresa_contratante = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.PROTECT,
        related_name='contratos_como_contratante',
        verbose_name='Empresa Contratante',
        db_column='id_empresa_contratante'
    )
    empresa_contratada = models.ForeignKey(
        'ordem_servico.EmpresaPrestadora',
        on_delete=models.PROTECT,
        related_name='contratos_como_contratada',
        verbose_name='Empresa Contratada',
        db_column='id_empresa_contratada',
        blank=True,
        null=True
    )
    
    # Prazo de faturamento
    prazo_faturamento = models.PositiveIntegerField(
        'Prazo de Faturamento (dias)',
        blank=True,
        null=True,
        help_text='Prazo em dias para faturamento após conclusão do serviço'
    )
    
    # Status e datas
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='ATIVO'
    )
    data_inicio = models.DateField('Data de Início')
    data_fim = models.DateField('Data de Término', blank=True, null=True)
    
    # Observação
    observacao = models.TextField('Observação', blank=True, null=True)
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contratos_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contratos_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Contrato'
        verbose_name_plural = 'Contratos'
        db_table = 'contrato'
        ordering = ['-data_criacao']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['status']),
            models.Index(fields=['data_inicio']),
            models.Index(fields=['data_fim']),
        ]
    
    def __str__(self):
        return f"Contrato {self.numero} - {self.empresa_contratante}"
    
    @property
    def valor_total_servicos(self):
        """Retorna o valor total de todos os serviços ativos do contrato."""
        from django.db.models import Sum
        total = self.servicos_contratados.filter(ativo=True).aggregate(
            total=Sum('valor')
        )['total']
        return total or Decimal('0.00')
    

class ContratoServico(models.Model):
    """
    Serviços vinculados a um contrato com seus valores negociados.
    Quantidade pode ser opcional (None = ilimitado).
    """
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_contrato_servico'
    )
    contrato = models.ForeignKey(
        Contrato,
        on_delete=models.CASCADE,
        related_name='servicos_contratados',
        verbose_name='Contrato',
        db_column='id_contrato'
    )
    servico = models.ForeignKey(
        'ordem_servico.Servico',
        on_delete=models.PROTECT,
        related_name='contratos_servicos',
        verbose_name='Serviço',
        db_column='id_servico'
    )

    # Valor negociado no contrato (pode ser diferente do valor_base)
    valor = models.DecimalField(
        'Valor Contratado',
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Valor negociado para este serviço neste contrato'
    )
    ativo = models.BooleanField('Ativo', default=True)

    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)

    # Auditoria
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contrato_servicos_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contrato_servicos_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )

    class Meta:
        verbose_name = 'Serviço do Contrato'
        verbose_name_plural = 'Serviços do Contrato'
        db_table = 'contrato_servico'
        unique_together = ['contrato', 'servico']
        ordering = ['servico__item']

    def __str__(self):
        return f"{self.contrato.numero} - {self.servico.item}"

    @property
    def valor_total(self):
        """Retorna o valor do serviço (alias para compatibilidade com admin)."""
        return self.valor or Decimal('0.00')

    @property
    def quantidade_executada(self):
        """Retorna a quantidade total já executada em OS (não canceladas)."""
        from django.db.models import Sum
        total = self.itens_os.filter(
            ordem_servico__status__in=['RASCUNHO', 'ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDA']
        ).aggregate(total=Sum('quantidade'))['total']
        return total or 0

    def save(self, *args, **kwargs):
        # Se valor não foi definido, usa o valor base do serviço
        if self.valor is None and self.servico is not None:
            self.valor = self.servico.valor_base
        super().save(*args, **kwargs)

