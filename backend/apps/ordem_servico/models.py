import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class EmpresaPrestadora(models.Model):
    """
    Empresa prestadora de serviços (CNPJ interno).
    Representa as empresas do grupo que podem prestar serviços.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_empresa_prestadora'
    )
    cnpj = models.CharField('CNPJ', max_length=18, unique=True)
    nome_juridico = models.CharField('Razão Social', max_length=255)
    nome_fantasia = models.CharField('Nome Fantasia', max_length=255, blank=True, null=True)
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
        related_name='empresas_prestadoras_criadas',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empresas_prestadoras_atualizadas',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Empresa Prestadora'
        verbose_name_plural = 'Empresas Prestadoras'
        db_table = 'empresa_prestadora'
        ordering = ['nome_fantasia', 'nome_juridico']
    
    def __str__(self):
        return self.nome_fantasia or self.nome_juridico


class Servico(models.Model):
    """
    Catálogo de serviços disponíveis.
    Define os tipos de serviços que podem ser contratados e seus valores base.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_servico'
    )
    item = models.CharField('Item/Código', max_length=50, unique=True)
    descricao = models.TextField('Descrição')
    valor_base = models.DecimalField(
        'Valor Base',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
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
        related_name='servicos_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='servicos_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'
        db_table = 'servico'
        ordering = ['item']
    
    def __str__(self):
        return f"{self.item} - {self.descricao[:50]}"


class OrdemServico(models.Model):
    """
    Ordem de Serviço - representa a execução de serviços de um contrato.
    Vinculada obrigatoriamente a um Contrato ativo.
    """
    
    STATUS_ABERTA = 'ABERTA'
    STATUS_FINALIZADA = 'FINALIZADA'
    STATUS_FATURADA = 'FATURADA'
    STATUS_RECEBIDA = 'RECEBIDA'
    STATUS_CANCELADA = 'CANCELADA'
    
    STATUS_CHOICES = [
        (STATUS_ABERTA, 'Aberta'),
        (STATUS_FINALIZADA, 'Finalizada'),
        (STATUS_FATURADA, 'Faturada'),
        (STATUS_RECEBIDA, 'Recebida'),
        (STATUS_CANCELADA, 'Cancelada'),
    ]
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_ordem_servico'
    )
    
    # Vínculo com Contrato (obrigatório)
    contrato = models.ForeignKey(
        'contratos.Contrato',
        on_delete=models.PROTECT,
        related_name='ordens_servico',
        verbose_name='Contrato',
        db_column='id_contrato'
    )
    
    numero = models.PositiveIntegerField('Número', unique=True, editable=False)
    data_abertura = models.DateField('Data de Abertura')
    data_fechamento = models.DateField('Data de Fechamento', blank=True, null=True)
    data_finalizada = models.DateTimeField('Data de Finalização', blank=True, null=True)
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ABERTA
    )
    observacao = models.TextField('Observação', blank=True, null=True)
    
    # Empresas (herdadas do contrato mas podem ser diferentes)
    # Solicitante pode ser Empresa OU Titular (particular)
    empresa_solicitante = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.PROTECT,
        related_name='ordens_solicitadas',
        verbose_name='Empresa Solicitante',
        db_column='id_empresa_solicitante',
        help_text='Empresa que solicita o serviço (pode ser diferente da contratante)',
        null=True,
        blank=True
    )
    titular_solicitante = models.ForeignKey(
        'titulares.Titular',
        on_delete=models.PROTECT,
        related_name='ordens_solicitadas_particular',
        verbose_name='Titular Solicitante',
        db_column='id_titular_solicitante',
        help_text='Titular que solicita o serviço como particular',
        null=True,
        blank=True
    )
    
    # Pagador pode ser Empresa OU Titular (particular)
    empresa_pagadora = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.PROTECT,
        related_name='ordens_pagas',
        verbose_name='Empresa Pagadora',
        db_column='id_empresa_pagadora',
        help_text='Empresa responsável pelo pagamento',
        null=True,
        blank=True
    )
    titular_pagador = models.ForeignKey(
        'titulares.Titular',
        on_delete=models.PROTECT,
        related_name='ordens_pagas_particular',
        verbose_name='Titular Pagador',
        db_column='id_titular_pagador',
        help_text='Titular responsável pelo pagamento (particular)',
        null=True,
        blank=True
    )
    
    # Solicitante e Colaborador
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordens_solicitante',
        verbose_name='Solicitante',
        db_column='id_responsavel'
    )
    colaborador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordens_colaborador',
        verbose_name='Colaborador',
        db_column='id_colaborador'
    )
    
    # Valores (calculados a partir dos itens e despesas)
    valor_servicos = models.DecimalField(
        'Valor dos Serviços',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    valor_despesas = models.DecimalField(
        'Valor das Despesas',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    valor_total = models.DecimalField(
        'Valor Total',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
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
        related_name='ordens_criadas',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordens_atualizadas',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Ordem de Serviço'
        verbose_name_plural = 'Ordens de Serviço'
        db_table = 'ordem_servico'
        ordering = ['-numero']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['status']),
            models.Index(fields=['data_abertura']),
            models.Index(fields=['data_fechamento']),
            models.Index(fields=['contrato']),
        ]
    
    def __str__(self):
        return f"OS #{self.numero} - Contrato {self.contrato.numero}"
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        # Auto-incremento do número da OS
        if not self.numero:
            last_os = OrdemServico.objects.order_by('-numero').first()
            self.numero = (last_os.numero + 1) if last_os else 1
        
        # Preencher data_finalizada quando status mudar para FINALIZADA
        if self.status == self.STATUS_FINALIZADA and not self.data_finalizada:
            self.data_finalizada = timezone.now()
        
        super().save(*args, **kwargs)
    
    def calcular_totais(self):
        """Recalcula os totais baseado nos itens e despesas."""
        from django.db.models import Sum, F
        
        # Soma dos itens da OS (valor_aplicado * quantidade)
        servicos_total = self.itens.aggregate(
            total=Sum(F('valor_aplicado') * F('quantidade'))
        )['total'] or Decimal('0.00')
        
        # Soma das despesas ativas
        despesas_total = self.despesas.filter(ativo=True).aggregate(
            total=Sum('valor')
        )['total'] or Decimal('0.00')
        
        self.valor_servicos = servicos_total
        self.valor_despesas = despesas_total
        self.valor_total = servicos_total + despesas_total
        self.save(update_fields=['valor_servicos', 'valor_despesas', 'valor_total'])
    
    @property
    def solicitante_nome_display(self):
        """Retorna o nome do solicitante (empresa ou titular)."""
        if self.empresa_solicitante:
            return self.empresa_solicitante.nome
        elif self.titular_solicitante:
            return self.titular_solicitante.nome
        return None
    
    @property
    def pagador_nome_display(self):
        """Retorna o nome do pagador (empresa ou titular)."""
        if self.empresa_pagadora:
            return self.empresa_pagadora.nome
        elif self.titular_pagador:
            return self.titular_pagador.nome
        return None
    
    @property
    def solicitante_tipo(self):
        """Retorna o tipo do solicitante ('empresa', 'titular' ou None)."""
        if self.empresa_solicitante:
            return 'empresa'
        elif self.titular_solicitante:
            return 'titular'
        return None
    
    @property
    def pagador_tipo(self):
        """Retorna o tipo do pagador ('empresa', 'titular' ou None)."""
        if self.empresa_pagadora:
            return 'empresa'
        elif self.titular_pagador:
            return 'titular'
        return None


class OrdemServicoItem(models.Model):
    """
    Itens de serviço de uma OS - herda do ContratoServico.
    Vincula serviços contratados à execução na OS.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_ordem_servico_item'
    )
    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name='itens',
        verbose_name='Ordem de Serviço',
        db_column='id_ordem_servico'
    )
    contrato_servico = models.ForeignKey(
        'contratos.ContratoServico',
        on_delete=models.PROTECT,
        related_name='itens_os',
        verbose_name='Serviço do Contrato',
        db_column='id_contrato_servico'
    )
    
    # Quantidade e valor aplicado nesta OS
    quantidade = models.PositiveIntegerField(
        'Quantidade',
        default=1,
        validators=[MinValueValidator(1)]
    )
    valor_aplicado = models.DecimalField(
        'Valor Aplicado',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Valor aplicado nesta OS (herda do contrato por padrão)'
    )
    
    # Timestamps
    data_criacao = models.DateTimeField('Data Criação', auto_now_add=True)
    ultima_atualizacao = models.DateTimeField('Última Atualização', auto_now=True)
    
    class Meta:
        verbose_name = 'Item da OS'
        verbose_name_plural = 'Itens da OS'
        db_table = 'ordem_servico_item'
        ordering = ['data_criacao']
    
    def __str__(self):
        return f"OS #{self.ordem_servico.numero} - {self.contrato_servico.servico.item}"
    
    @property
    def valor_total(self):
        """Calcula valor_aplicado * quantidade."""
        return self.valor_aplicado * self.quantidade
    
    @property
    def servico(self):
        """Atalho para acessar o serviço."""
        return self.contrato_servico.servico
    
    def save(self, *args, **kwargs):
        # Se valor_aplicado não foi definido, usa o valor do contrato
        if self.valor_aplicado is None:
            self.valor_aplicado = self.contrato_servico.valor
        super().save(*args, **kwargs)
        # Recalcula totais da OS
        self.ordem_servico.calcular_totais()
    
    def delete(self, *args, **kwargs):
        os = self.ordem_servico
        super().delete(*args, **kwargs)
        os.calcular_totais()
    
    def clean(self):
        """Valida que o serviço pertence ao contrato da OS."""
        from django.core.exceptions import ValidationError
        if self.ordem_servico_id and self.contrato_servico_id:
            if self.contrato_servico.contrato_id != self.ordem_servico.contrato_id:
                raise ValidationError(
                    'O serviço deve pertencer ao mesmo contrato da OS.'
                )


class TipoDespesa(models.Model):
    """
    Catálogo de tipos de despesas.
    Define os tipos de despesas disponíveis e seus valores base.
    Similar ao modelo Servico.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_tipo_despesa'
    )
    item = models.CharField('Item/Código', max_length=50)
    descricao = models.TextField('Descrição')
    valor_base = models.DecimalField(
        'Valor Base',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        blank=True,
        null=True,
        help_text='Valor base de referência (opcional)'
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
        related_name='tipos_despesa_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tipos_despesa_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Tipo de Despesa'
        verbose_name_plural = 'Tipos de Despesa'
        db_table = 'tipo_despesa'
        ordering = ['item']
    
    def __str__(self):
        return f"{self.item} - {self.descricao}"


class DespesaOrdemServico(models.Model):
    """
    Despesas associadas a uma OS.
    Vincula tipos de despesa (TipoDespesa) a uma Ordem de Serviço.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_despesa_ordem_servico'
    )
    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name='despesas',
        verbose_name='Ordem de Serviço',
        db_column='id_ordem_servico'
    )
    tipo_despesa = models.ForeignKey(
        TipoDespesa,
        on_delete=models.PROTECT,
        related_name='despesas_os',
        verbose_name='Tipo de Despesa',
        db_column='id_tipo_despesa'
    )
    valor = models.DecimalField(
        'Valor',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Valor aplicado (herda do tipo de despesa por padrão)'
    )
    ativo = models.BooleanField('Ativo', default=True)
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
        related_name='despesas_os_criadas',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='despesas_os_atualizadas',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Despesa da OS'
        verbose_name_plural = 'Despesas da OS'
        db_table = 'despesa_ordem_servico'
        ordering = ['tipo_despesa__item', 'data_criacao']
    
    def __str__(self):
        return f"{self.tipo_despesa.item} - R$ {self.valor}"
    
    def save(self, *args, **kwargs):
        # Se valor não foi definido, usa o valor base do tipo de despesa
        if self.valor is None:
            self.valor = self.tipo_despesa.valor_base
        super().save(*args, **kwargs)
        self.ordem_servico.calcular_totais()
    
    def delete(self, *args, **kwargs):
        os = self.ordem_servico
        super().delete(*args, **kwargs)
        os.calcular_totais()


class OrdemServicoTitular(models.Model):
    """
    Relacionamento entre OS e Titulares.
    Permite associar múltiplos titulares a uma OS.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_ordem_servico_titular'
    )
    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name='titulares_vinculados',
        verbose_name='Ordem de Serviço',
        db_column='id_ordem_servico'
    )
    titular = models.ForeignKey(
        'titulares.Titular',
        on_delete=models.CASCADE,
        related_name='ordens_servico',
        verbose_name='Titular',
        db_column='id_titular'
    )
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
        related_name='os_titulares_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='os_titulares_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Titular da OS'
        verbose_name_plural = 'Titulares da OS'
        db_table = 'ordem_servico_titular'
        unique_together = ['ordem_servico', 'titular']
        ordering = ['data_criacao']
    
    def __str__(self):
        return f"OS #{self.ordem_servico.numero} - {self.titular.nome}"


class OrdemServicoDependente(models.Model):
    """
    Relacionamento entre OS e Dependentes.
    Permite associar múltiplos dependentes a uma OS.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_ordem_servico_dependente'
    )
    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name='dependentes_vinculados',
        verbose_name='Ordem de Serviço',
        db_column='id_ordem_servico'
    )
    dependente = models.ForeignKey(
        'titulares.Dependente',
        on_delete=models.CASCADE,
        related_name='ordens_servico',
        verbose_name='Dependente',
        db_column='id_dependente'
    )
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
        related_name='os_dependentes_criados',
        verbose_name='Criado por',
        db_column='criado_por'
    )
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='os_dependentes_atualizados',
        verbose_name='Atualizado por',
        db_column='atualizado_por'
    )
    
    class Meta:
        verbose_name = 'Dependente da OS'
        verbose_name_plural = 'Dependentes da OS'
        db_table = 'ordem_servico_dependente'
        unique_together = ['ordem_servico', 'dependente']
        ordering = ['data_criacao']
    
    def __str__(self):
        return f"OS #{self.ordem_servico.numero} - {self.dependente.nome}"


class DocumentoOS(models.Model):
    """
    Documento de Ordem de Serviço (PDF de Orçamento).
    Cada exportação gera uma nova versão do documento.
    Armazena metadados para rastreabilidade e validação.
    """
    
    id = models.UUIDField(
        'ID',
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='id_documento_os'
    )
    
    # Vínculo com Ordem de Serviço
    ordem_servico = models.ForeignKey(
        'ordem_servico.OrdemServico',
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name='Ordem de Serviço',
        db_column='id_ordem_servico'
    )
    
    # Versão do documento (incremental por OS)
    versao = models.PositiveIntegerField('Versão', default=1)
    
    # Código do documento formatado (DOC-OS-000001-V001)
    codigo = models.CharField(
        'Código do Documento',
        max_length=30,
        unique=True,
        blank=True,  # Gerado automaticamente no save()
    )
    
    # Hash SHA-256 do conteúdo do PDF
    hash_sha256 = models.CharField(
        'Hash SHA-256',
        max_length=64,
        help_text='Hash criptográfico do conteúdo do PDF para validação'
    )
    
    # Metadados do documento
    data_emissao = models.DateTimeField(
        'Data de Emissão',
        auto_now_add=True,
        help_text='Data e hora da geração do documento (UTC-3)'
    )
    
    # Snapshot dos dados no momento da emissão (JSON)
    dados_snapshot = models.JSONField(
        'Snapshot dos Dados',
        help_text='Cópia dos dados da OS no momento da emissão',
        default=dict
    )
    
    # Usuário que emitiu o documento
    emitido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_os_emitidos',
        verbose_name='Emitido por',
        db_column='emitido_por'
    )
    
    class Meta:
        verbose_name = 'Documento de OS'
        verbose_name_plural = 'Documentos de OS'
        db_table = 'documento_os'
        ordering = ['-data_emissao']
        unique_together = ['ordem_servico', 'versao']
    
    def save(self, *args, **kwargs):
        # Gera versão e código se for novo documento
        # Nota: usamos _state.adding pois pk já é definido pelo UUIDField default
        if self._state.adding:
            # Busca a última versão para esta OS
            ultima_versao = DocumentoOS.objects.filter(
                ordem_servico=self.ordem_servico
            ).aggregate(models.Max('versao'))['versao__max'] or 0
            self.versao = ultima_versao + 1
            
            # Busca o número da OS (refresh se necessário)
            if self.ordem_servico_id:
                os_obj = OrdemServico.objects.get(pk=self.ordem_servico_id)
                numero_os = str(os_obj.numero).zfill(6)
            else:
                numero_os = str(self.ordem_servico.numero).zfill(6)
            
            versao_str = str(self.versao).zfill(3)
            self.codigo = f"DOC-OS-{numero_os}-V{versao_str}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.codigo
    
    @property
    def url_validacao(self):
        """Retorna a URL de validação do documento."""
        from django.conf import settings
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return f"{base_url}/validar-documento/{self.id}"
