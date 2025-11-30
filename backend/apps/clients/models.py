from django.conf import settings
from django.db import models
from simple_history.models import HistoricalRecords


class Client(models.Model):
    """
    Modelo de Cliente com campos preparados para LGPD.
    Todos os dados pessoais são rastreados via histórico.
    """
    
    # Dados de identificação
    name = models.CharField('Nome Completo', max_length=255)
    email = models.EmailField('Email', unique=True)
    phone = models.CharField('Telefone', max_length=20, blank=True)
    cpf = models.CharField('CPF', max_length=14, unique=True, blank=True, null=True)
    
    # Endereço
    address = models.TextField('Endereço', blank=True)
    city = models.CharField('Cidade', max_length=100, blank=True)
    state = models.CharField('Estado', max_length=2, blank=True)
    zip_code = models.CharField('CEP', max_length=10, blank=True)
    
    # Dados empresariais (opcional)
    company = models.CharField('Empresa', max_length=255, blank=True)
    cnpj = models.CharField('CNPJ', max_length=18, blank=True)
    
    # LGPD: Consentimentos
    lgpd_consent = models.BooleanField(
        'Consentimento LGPD',
        default=False,
        help_text='Cliente consentiu com a coleta e processamento de dados.',
    )
    lgpd_consent_date = models.DateTimeField(
        'Data do Consentimento',
        null=True,
        blank=True,
    )
    marketing_consent = models.BooleanField(
        'Consentimento Marketing',
        default=False,
        help_text='Cliente consentiu em receber comunicações de marketing.',
    )
    
    # Notas e observações
    notes = models.TextField('Observações', blank=True)
    
    # Metadados
    is_active = models.BooleanField('Ativo', default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='clients_created',
        verbose_name='Criado por',
    )
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    # Histórico para LGPD (auditoria completa)
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def anonymize(self):
        """
        LGPD: Anonimiza dados do cliente.
        Mantém registro para fins de auditoria mas remove dados pessoais.
        """
        self.name = f'Cliente Anonimizado #{self.id}'
        self.email = f'anonimo_{self.id}@removed.local'
        self.phone = ''
        self.cpf = None
        self.address = ''
        self.city = ''
        self.state = ''
        self.zip_code = ''
        self.company = ''
        self.cnpj = ''
        self.notes = 'Dados anonimizados por solicitação LGPD.'
        self.is_active = False
        self.save()


class ClientDocument(models.Model):
    """Documentos anexados ao cliente."""
    
    DOCUMENT_TYPES = [
        ('contract', 'Contrato'),
        ('proposal', 'Proposta'),
        ('invoice', 'Nota Fiscal'),
        ('other', 'Outro'),
    ]
    
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Cliente',
    )
    title = models.CharField('Título', max_length=255)
    document_type = models.CharField(
        'Tipo',
        max_length=20,
        choices=DOCUMENT_TYPES,
        default='other',
    )
    file = models.FileField('Arquivo', upload_to='clients/documents/%Y/%m/')
    description = models.TextField('Descrição', blank=True)
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Enviado por',
    )
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    
    # Histórico
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} - {self.client.name}'
