from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Sum
from django.http import HttpResponse
from decimal import Decimal
import hashlib
import json

from .models import (
    EmpresaPrestadora, Servico, OrdemServico, OrdemServicoItem,
    TipoDespesa, DespesaOrdemServico, OrdemServicoTitular, OrdemServicoDependente,
    DocumentoOS
)
from .serializers import (
    EmpresaPrestadoraSerializer,
    ServicoSerializer,
    OrdemServicoItemSerializer,
    TipoDespesaSerializer, TipoDespesaListSerializer,
    DespesaOrdemServicoSerializer,
    OrdemServicoTitularSerializer,
    OrdemServicoDependenteSerializer,
    OrdemServicoListSerializer,
    OrdemServicoSerializer,
    OrdemServicoCreateUpdateSerializer,
    DocumentoOSSerializer,
    DocumentoOSDetailSerializer,
    DocumentoOSCreateSerializer,
    DocumentoOSValidacaoSerializer
)
from apps.accounts.permissions import (
    CargoBasedPermission, PermissionMessageMixin, RequiresSistemaOS
)


# =============================================================================
# FILTROS
# =============================================================================

class OrdemServicoFilter(django_filters.FilterSet):
    """Filtro customizado para Ordem de Serviço."""
    
    numero = django_filters.NumberFilter()
    status = django_filters.ChoiceFilter(choices=OrdemServico.STATUS_CHOICES)
    contrato = django_filters.UUIDFilter(field_name='contrato__id')
    empresa_solicitante = django_filters.UUIDFilter(field_name='empresa_solicitante__id')
    empresa_pagadora = django_filters.UUIDFilter(field_name='empresa_pagadora__id')
    titular_solicitante = django_filters.UUIDFilter(field_name='titular_solicitante__id')
    titular_pagador = django_filters.UUIDFilter(field_name='titular_pagador__id')
    centro_custos = django_filters.UUIDFilter(field_name='centro_custos__id')
    responsavel = django_filters.UUIDFilter(field_name='responsavel__id')
    solicitante = django_filters.UUIDFilter(field_name='solicitante__id')
    colaborador = django_filters.UUIDFilter(field_name='colaborador__id')
    titular = django_filters.UUIDFilter(method='filter_by_titular')
    dependente = django_filters.UUIDFilter(method='filter_by_dependente')
    
    # Filtros de data de abertura
    data_abertura_after = django_filters.DateFilter(field_name='data_abertura', lookup_expr='gte')
    data_abertura_before = django_filters.DateFilter(field_name='data_abertura', lookup_expr='lte')
    
    # Filtros de data de fechamento
    data_fechamento_after = django_filters.DateFilter(field_name='data_fechamento', lookup_expr='gte')
    data_fechamento_before = django_filters.DateFilter(field_name='data_fechamento', lookup_expr='lte')
    
    # Filtros de valor total
    valor_total_min = django_filters.NumberFilter(field_name='valor_total', lookup_expr='gte')
    valor_total_max = django_filters.NumberFilter(field_name='valor_total', lookup_expr='lte')
    
    class Meta:
        model = OrdemServico
        fields = [
            'numero', 'status', 'contrato', 'empresa_solicitante', 'empresa_pagadora',
            'titular_solicitante', 'titular_pagador',
            'centro_custos', 'responsavel', 'solicitante', 'colaborador'
        ]
    
    def filter_by_titular(self, queryset, name, value):
        """Filtra OS que têm o titular especificado."""
        if value:
            return queryset.filter(titulares_vinculados__titular__id=value).distinct()
        return queryset
    
    def filter_by_dependente(self, queryset, name, value):
        """Filtra OS que têm o dependente especificado."""
        if value:
            return queryset.filter(dependentes_vinculados__dependente__id=value).distinct()
        return queryset


class ServicoFilter(django_filters.FilterSet):
    """Filtro customizado para Serviço."""
    
    ativo = django_filters.BooleanFilter()
    valor_base_gte = django_filters.NumberFilter(field_name='valor_base', lookup_expr='gte')
    valor_base_lte = django_filters.NumberFilter(field_name='valor_base', lookup_expr='lte')
    
    class Meta:
        model = Servico
        fields = ['ativo']


class DespesaOrdemServicoFilter(django_filters.FilterSet):
    """Filtro customizado para Despesa de Ordem de Serviço."""
    
    ordem_servico = django_filters.UUIDFilter(field_name='ordem_servico__id')
    tipo_despesa = django_filters.UUIDFilter(field_name='tipo_despesa__id')
    ativo = django_filters.BooleanFilter()
    valor_gte = django_filters.NumberFilter(field_name='valor', lookup_expr='gte')
    valor_lte = django_filters.NumberFilter(field_name='valor', lookup_expr='lte')
    
    class Meta:
        model = DespesaOrdemServico
        fields = ['ordem_servico', 'tipo_despesa', 'ativo']


class TipoDespesaFilter(django_filters.FilterSet):
    """Filtro customizado para Tipo de Despesa."""
    
    ativo = django_filters.BooleanFilter()
    valor_base_gte = django_filters.NumberFilter(field_name='valor_base', lookup_expr='gte')
    valor_base_lte = django_filters.NumberFilter(field_name='valor_base', lookup_expr='lte')
    
    class Meta:
        model = TipoDespesa
        fields = ['ativo']


# =============================================================================
# VIEWSETS
# =============================================================================

class EmpresaPrestadoraViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Empresas Prestadoras (CNPJs internos).
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = EmpresaPrestadora.objects.select_related(
        'criado_por', 'atualizado_por'
    ).all()
    serializer_class = EmpresaPrestadoraSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['cnpj', 'nome_juridico', 'nome_fantasia']
    ordering_fields = ['nome_juridico', 'nome_fantasia', 'cnpj', 'data_criacao']
    ordering = ['nome_juridico']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


class ServicoViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento do catálogo de Serviços.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = Servico.objects.select_related(
        'criado_por', 'atualizado_por'
    ).all()
    serializer_class = ServicoSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ServicoFilter
    search_fields = ['item', 'descricao']
    ordering_fields = ['item', 'valor_base', 'ativo', 'data_criacao']
    ordering = ['item']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas serviços ativos."""
        queryset = self.queryset.filter(ativo=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class OrdemServicoViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Ordens de Serviço.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    
    Actions customizadas:
    - /titulares/ - Lista titulares da OS
    - /dependentes/ - Lista dependentes da OS
    - /itens/ - Lista itens (serviços) da OS
    - /despesas/ - Lista despesas da OS
    - /servicos-disponiveis/ - Lista serviços do contrato disponíveis
    - /recalcular/ - Recalcula valores da OS
    - /finalizar/ - Marca a OS como finalizada
    - /cancelar/ - Cancela a OS
    """
    
    queryset = OrdemServico.objects.select_related(
        'contrato', 'contrato__empresa_contratante',
        'empresa_solicitante', 'empresa_pagadora',
        'criado_por', 'atualizado_por'
    ).prefetch_related(
        'itens', 'itens__contrato_servico', 'itens__contrato_servico__servico',
        'despesas', 'despesas__tipo_despesa', 'titulares_vinculados', 'titulares_vinculados__titular',
        'dependentes_vinculados', 'dependentes_vinculados__dependente'
    )
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrdemServicoFilter
    search_fields = ['numero', 'observacao', 'contrato__numero']
    ordering_fields = ['numero', 'status', 'data', 'valor_total', 'data_criacao']
    ordering = ['-numero']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrdemServicoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OrdemServicoCreateUpdateSerializer
        return OrdemServicoSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
    
    @action(detail=True, methods=['get'])
    def titulares(self, request, pk=None):
        """Retorna todos os titulares de uma OS."""
        ordem_servico = self.get_object()
        titulares_vinculados = ordem_servico.titulares_vinculados.select_related('titular')
        serializer = OrdemServicoTitularSerializer(titulares_vinculados, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def dependentes(self, request, pk=None):
        """Retorna todos os dependentes de uma OS."""
        ordem_servico = self.get_object()
        dependentes_vinculados = ordem_servico.dependentes_vinculados.select_related('dependente')
        serializer = OrdemServicoDependenteSerializer(dependentes_vinculados, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def itens(self, request, pk=None):
        """Retorna todos os itens (serviços) de uma OS."""
        ordem_servico = self.get_object()
        itens = ordem_servico.itens.select_related('contrato_servico', 'contrato_servico__servico')
        serializer = OrdemServicoItemSerializer(itens, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def despesas(self, request, pk=None):
        """Retorna todas as despesas de uma OS."""
        ordem_servico = self.get_object()
        despesas = ordem_servico.despesas.select_related('tipo_despesa').all()
        serializer = DespesaOrdemServicoSerializer(despesas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='servicos-disponiveis')
    def servicos_disponiveis(self, request, pk=None):
        """Retorna serviços do contrato disponíveis para adicionar na OS."""
        from apps.contratos.serializers import ContratoServicoListSerializer
        
        ordem_servico = self.get_object()
        servicos_contrato = ordem_servico.contrato.servicos_contratados.filter(
            ativo=True
        ).select_related('servico')
        
        serializer = ContratoServicoListSerializer(servicos_contrato, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def recalcular(self, request, pk=None):
        """Recalcula os valores da OS (itens + despesas)."""
        ordem_servico = self.get_object()
        ordem_servico.calcular_totais()
        serializer = OrdemServicoSerializer(ordem_servico)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Marca a OS como finalizada."""
        ordem_servico = self.get_object()
        
        if ordem_servico.status == 'CANCELADO':
            return Response(
                {'error': 'Não é possível finalizar uma OS cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if ordem_servico.status == 'FINALIZADO':
            return Response(
                {'error': 'Esta OS já está finalizada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ordem_servico.status = 'FINALIZADO'
        ordem_servico.atualizado_por = request.user
        ordem_servico.save()
        
        serializer = OrdemServicoSerializer(ordem_servico)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela a OS."""
        ordem_servico = self.get_object()
        
        if ordem_servico.status == 'FINALIZADO':
            return Response(
                {'error': 'Não é possível cancelar uma OS já finalizada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if ordem_servico.status == 'CANCELADO':
            return Response(
                {'error': 'Esta OS já está cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ordem_servico.status = 'CANCELADO'
        ordem_servico.atualizado_por = request.user
        ordem_servico.save()
        
        serializer = OrdemServicoSerializer(ordem_servico)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='gerar-pdf')
    def gerar_pdf(self, request, pk=None):
        """
        Gera o PDF da Ordem de Serviço e registra o documento.
        
        O PDF é gerado no backend, o hash SHA-256 é calculado sobre o PDF,
        e um registro de DocumentoOS é criado para rastreabilidade.
        
        Retorna:
            - Arquivo PDF como resposta HTTP
            - Headers com informações do documento:
                - X-Documento-ID: UUID do documento
                - X-Documento-Codigo: Código único do documento
                - X-Documento-Versao: Versão do documento
                - X-Documento-Hash: Hash SHA-256 do PDF
        """
        from .services.pdf_generator import OSPDFGenerator
        from django.conf import settings
        
        ordem_servico = self.get_object()
        
        # Determina a versão do documento
        ultima_versao = DocumentoOS.objects.filter(
            ordem_servico=ordem_servico
        ).order_by('-versao').first()
        
        nova_versao = (ultima_versao.versao + 1) if ultima_versao else 1
        
        # Cria o documento primeiro (para obter o código)
        # O código será gerado automaticamente pelo model
        documento = DocumentoOS(
            ordem_servico=ordem_servico,
            versao=nova_versao,
            emitido_por=request.user,
            dados_snapshot={},  # Será atualizado depois
            hash_sha256='',  # Será atualizado depois
        )
        documento.save()
        
        # URL de validação
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        url_validacao = f"{frontend_url}/validar-documento/{documento.id}"
        
        # Gera o PDF
        try:
            generator = OSPDFGenerator(
                ordem_servico=ordem_servico,
                codigo_documento=documento.codigo,
                url_validacao=url_validacao
            )
            pdf_bytes, hash_sha256 = generator.generate()
        except Exception as e:
            # Se falhar, remove o documento criado
            documento.delete()
            return Response(
                {'error': f'Erro ao gerar PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Cria o snapshot dos dados
        dados_snapshot = self._criar_snapshot_os(ordem_servico)
        
        # Atualiza o documento com o hash e snapshot
        documento.hash_sha256 = hash_sha256
        documento.dados_snapshot = dados_snapshot
        documento.save()
        
        # Prepara a resposta HTTP com o PDF
        filename = f"OS-{str(ordem_servico.numero).zfill(6)}-{documento.codigo}.pdf"
        
        response = HttpResponse(
            pdf_bytes,
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Documento-ID'] = str(documento.id)
        response['X-Documento-Codigo'] = documento.codigo
        response['X-Documento-Versao'] = str(documento.versao)
        response['X-Documento-Hash'] = documento.hash_sha256
        # Expose custom headers to frontend (CORS)
        response['Access-Control-Expose-Headers'] = 'X-Documento-ID, X-Documento-Codigo, X-Documento-Versao, X-Documento-Hash, Content-Disposition'
        
        return response
    
    def _criar_snapshot_os(self, ordem_servico):
        """Cria um snapshot dos dados da OS para armazenamento."""
        # Dados básicos da OS
        snapshot = {
            'os_numero': ordem_servico.numero,
            'os_status': ordem_servico.status,
            'os_data_abertura': str(ordem_servico.data_abertura) if ordem_servico.data_abertura else None,
            'os_data_fechamento': str(ordem_servico.data_fechamento) if ordem_servico.data_fechamento else None,
            'os_observacao': ordem_servico.observacao,
            'os_valor_total': str(ordem_servico.valor_total) if ordem_servico.valor_total else '0.00',
        }
        
        # Contrato
        if ordem_servico.contrato:
            snapshot['contrato'] = {
                'numero': ordem_servico.contrato.numero,
                'empresa_contratante': ordem_servico.contrato.empresa_contratante.nome if ordem_servico.contrato.empresa_contratante else None,
            }
        
        # Empresas (modelo Empresa tem campo 'nome')
        if ordem_servico.empresa_solicitante:
            snapshot['empresa_solicitante'] = {
                'nome': ordem_servico.empresa_solicitante.nome,
                'cnpj': ordem_servico.empresa_solicitante.cnpj,
            }
        
        if ordem_servico.empresa_pagadora:
            snapshot['empresa_pagadora'] = {
                'nome': ordem_servico.empresa_pagadora.nome,
                'cnpj': ordem_servico.empresa_pagadora.cnpj,
            }
        
        # Solicitante (User)
        if ordem_servico.solicitante:
            snapshot['solicitante'] = {
                'nome': ordem_servico.solicitante.nome,
                'email': ordem_servico.solicitante.email,
            }
        
        # Colaborador (User)
        if ordem_servico.colaborador:
            snapshot['colaborador'] = {
                'nome': ordem_servico.colaborador.nome,
                'email': ordem_servico.colaborador.email,
            }
        
        # Titulares
        titulares = []
        for titular_vinculado in ordem_servico.titulares_vinculados.select_related('titular').all():
            titular = titular_vinculado.titular
            titulares.append({
                'nome': titular.nome,
                'cpf': titular.cpf,
                'observacao': titular_vinculado.observacao,
            })
        snapshot['titulares'] = titulares
        
        # Dependentes
        dependentes = []
        for dependente_vinculado in ordem_servico.dependentes_vinculados.select_related('dependente', 'dependente__titular').all():
            dependente = dependente_vinculado.dependente
            dependentes.append({
                'nome': dependente.nome,
                'tipo_dependente': dependente.tipo_dependente,
                'titular_nome': dependente.titular.nome if dependente.titular else None,
                'observacao': dependente_vinculado.observacao,
            })
        snapshot['dependentes'] = dependentes
        
        # Itens (Serviços)
        itens = []
        for item in ordem_servico.itens.select_related('contrato_servico', 'contrato_servico__servico').all():
            itens.append({
                'servico_item': item.contrato_servico.servico.item if item.contrato_servico and item.contrato_servico.servico else None,
                'servico_descricao': item.contrato_servico.servico.descricao if item.contrato_servico and item.contrato_servico.servico else None,
                'quantidade': item.quantidade,
                'valor_unitario': str(item.valor_aplicado) if item.valor_aplicado else '0.00',
                'valor_total': str(item.valor_total) if item.valor_total else '0.00',
            })
        snapshot['itens'] = itens
        
        # Despesas
        despesas = []
        for despesa in ordem_servico.despesas.select_related('tipo_despesa').filter(ativo=True):
            despesas.append({
                'tipo_item': despesa.tipo_despesa.item if despesa.tipo_despesa else None,
                'tipo_descricao': despesa.tipo_despesa.descricao if despesa.tipo_despesa else None,
                'valor': str(despesa.valor) if despesa.valor else '0.00',
                'observacao': despesa.observacao,
            })
        snapshot['despesas'] = despesas
        
        return snapshot
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Retorna estatísticas gerais das OS."""
        from django.db.models import Count, Avg
        
        stats = {
            'total': OrdemServico.objects.count(),
            'por_status': {},
            'valor_total_geral': OrdemServico.objects.aggregate(
                total=Sum('valor_total')
            )['total'] or Decimal('0'),
            'valor_medio': OrdemServico.objects.aggregate(
                media=Avg('valor_total')
            )['media'] or Decimal('0'),
        }
        
        # Contagem por status
        for status_code, status_label in OrdemServico.STATUS_CHOICES:
            stats['por_status'][status_code] = {
                'label': status_label,
                'count': OrdemServico.objects.filter(status=status_code).count()
            }
        
        return Response(stats)


class OrdemServicoItemViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Itens da OS.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = OrdemServicoItem.objects.select_related(
        'ordem_servico', 'contrato_servico', 'contrato_servico__servico'
    )
    serializer_class = OrdemServicoItemSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['contrato_servico__servico__item', 'contrato_servico__servico__descricao']
    ordering_fields = ['data_criacao', 'valor_aplicado']
    ordering = ['data_criacao']
    filterset_fields = ['ordem_servico']


class TipoDespesaViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento do catálogo de Tipos de Despesa.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = TipoDespesa.objects.select_related(
        'criado_por', 'atualizado_por'
    ).all()
    serializer_class = TipoDespesaSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TipoDespesaFilter
    search_fields = ['item', 'descricao']
    ordering_fields = ['item', 'valor_base', 'ativo', 'data_criacao']
    ordering = ['item']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TipoDespesaListSerializer
        return TipoDespesaSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas tipos de despesa ativos."""
        queryset = self.queryset.filter(ativo=True)
        serializer = TipoDespesaListSerializer(queryset, many=True)
        return Response(serializer.data)


class DespesaOrdemServicoViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Despesas de Ordem de Serviço.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = DespesaOrdemServico.objects.select_related(
        'ordem_servico', 'tipo_despesa', 'criado_por', 'atualizado_por'
    )
    serializer_class = DespesaOrdemServicoSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DespesaOrdemServicoFilter
    search_fields = ['observacao', 'tipo_despesa__item']
    ordering_fields = ['tipo_despesa__item', 'valor', 'data_criacao']
    ordering = ['data_criacao']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


class OrdemServicoTitularViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Titulares vinculados à OS.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = OrdemServicoTitular.objects.select_related(
        'ordem_servico', 'titular', 'criado_por', 'atualizado_por'
    )
    serializer_class = OrdemServicoTitularSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titular__nome', 'observacao']
    ordering_fields = ['data_criacao']
    ordering = ['data_criacao']
    filterset_fields = ['ordem_servico', 'titular']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


class OrdemServicoDependenteViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Dependentes vinculados à OS.
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    """
    
    queryset = OrdemServicoDependente.objects.select_related(
        'ordem_servico', 'dependente', 'dependente__titular', 'criado_por', 'atualizado_por'
    )
    serializer_class = OrdemServicoDependenteSerializer
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['dependente__nome', 'observacao']
    ordering_fields = ['data_criacao']
    ordering = ['data_criacao']
    filterset_fields = ['ordem_servico', 'dependente']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


# =============================================================================
# DOCUMENTO OS
# =============================================================================

class DocumentoOSFilter(django_filters.FilterSet):
    """Filtro customizado para Documento de OS."""
    
    ordem_servico = django_filters.UUIDFilter(field_name='ordem_servico__id')
    versao = django_filters.NumberFilter()
    data_emissao_after = django_filters.DateTimeFilter(field_name='data_emissao', lookup_expr='gte')
    data_emissao_before = django_filters.DateTimeFilter(field_name='data_emissao', lookup_expr='lte')
    emitido_por = django_filters.UUIDFilter(field_name='emitido_por__id')
    
    class Meta:
        model = DocumentoOS
        fields = ['ordem_servico', 'versao', 'emitido_por']


class DocumentoOSViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Documentos de OS (PDFs de Orçamento).
    
    EXCLUSIVO DO SISTEMA DE ORDENS DE SERVIÇO.
    
    Endpoints:
    - POST /documentos-os/ - Registra novo documento
    - GET /documentos-os/ - Lista documentos
    - GET /documentos-os/{id}/ - Detalhes do documento
    - GET /documentos-os/{id}/validar/ - Valida documento (público)
    - POST /documentos-os/{id}/validar-integridade/ - Valida integridade por upload
    """
    
    queryset = DocumentoOS.objects.select_related(
        'ordem_servico', 'emitido_por'
    )
    permission_classes = [IsAuthenticated, RequiresSistemaOS, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DocumentoOSFilter
    search_fields = ['codigo', 'ordem_servico__numero']
    ordering_fields = ['data_emissao', 'versao', 'valor_total']
    ordering = ['-data_emissao']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentoOSCreateSerializer
        elif self.action in ['retrieve', 'validar']:
            return DocumentoOSDetailSerializer
        return DocumentoOSSerializer
    
    def get_permissions(self):
        # Validação é pública (sem autenticação necessária)
        if self.action in ['validar', 'validar_por_codigo']:
            return [AllowAny()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(emitido_por=self.request.user)
    
    @action(detail=True, methods=['get'], url_path='validar')
    def validar(self, request, pk=None):
        """
        Endpoint público para validação de documento.
        Retorna metadados do documento para verificação.
        """
        try:
            documento = DocumentoOS.objects.select_related(
                'ordem_servico', 'emitido_por'
            ).get(pk=pk)
        except DocumentoOS.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Documento não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DocumentoOSDetailSerializer(documento)
        return Response({
            'valid': True,
            'documento': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='validar-codigo/(?P<codigo>[^/.]+)')
    def validar_por_codigo(self, request, codigo=None):
        """
        Endpoint público para validação de documento pelo código.
        Ex: GET /documentos-os/validar-codigo/DOC-OS-000001-V001/
        """
        try:
            documento = DocumentoOS.objects.select_related(
                'ordem_servico', 'emitido_por'
            ).get(codigo=codigo)
        except DocumentoOS.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Documento não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DocumentoOSDetailSerializer(documento)
        return Response({
            'valid': True,
            'documento': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='validar-integridade')
    def validar_integridade(self, request, pk=None):
        """
        Valida a integridade do documento através de upload do PDF.
        Compara o hash SHA-256 do arquivo enviado com o hash armazenado.
        
        O hash armazenado é calculado sobre o PDF gerado no backend,
        portanto o upload do mesmo arquivo PDF deve produzir hash idêntico.
        """
        try:
            documento = DocumentoOS.objects.get(pk=pk)
        except DocumentoOS.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Documento não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DocumentoOSValidacaoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        arquivo = serializer.validated_data['arquivo']
        
        # Verifica se é um PDF válido (começa com %PDF)
        arquivo.seek(0)
        header = arquivo.read(5)
        arquivo.seek(0)
        
        is_pdf = header == b'%PDF-'
        
        if not is_pdf:
            return Response({
                'valid': True,
                'integridade_valida': False,
                'codigo_documento': documento.codigo,
                'mensagem': 'O arquivo enviado não é um PDF válido.'
            })
        
        # Calcula o hash do arquivo enviado
        arquivo.seek(0)
        conteudo = arquivo.read()
        hash_arquivo = hashlib.sha256(conteudo).hexdigest()
        
        # Compara com o hash armazenado
        integridade_valida = hash_arquivo == documento.hash_sha256
        
        if integridade_valida:
            return Response({
                'valid': True,
                'integridade_valida': True,
                'codigo_documento': documento.codigo,
                'mensagem': 'Documento íntegro.'
            })
        else:
            return Response({
                'valid': True,
                'integridade_valida': False,
                'codigo_documento': documento.codigo,
                'hash_esperado': documento.hash_sha256,
                'hash_arquivo': hash_arquivo,
                'mensagem': 'Integridade comprometida.'
            })
    
    @action(detail=False, methods=['get'], url_path='por-os/(?P<os_id>[^/.]+)')
    def por_ordem_servico(self, request, os_id=None):
        """
        Lista todos os documentos de uma Ordem de Serviço específica.
        """
        documentos = DocumentoOS.objects.filter(
            ordem_servico_id=os_id
        ).select_related('ordem_servico', 'emitido_por').order_by('-versao')
        
        serializer = DocumentoOSSerializer(documentos, many=True)
        return Response(serializer.data)
