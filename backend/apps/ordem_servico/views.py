from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Sum
from decimal import Decimal

from .models import (
    EmpresaPrestadora, Servico, OrdemServico, OrdemServicoItem,
    TipoDespesa, DespesaOrdemServico, OrdemServicoTitular, OrdemServicoDependente
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
    OrdemServicoCreateUpdateSerializer
)
from apps.accounts.permissions import CargoBasedPermission, PermissionMessageMixin


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
    centro_custos = django_filters.UUIDFilter(field_name='centro_custos__id')
    responsavel = django_filters.UUIDFilter(field_name='responsavel__id')
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
            'centro_custos', 'responsavel'
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
    """
    
    queryset = EmpresaPrestadora.objects.select_related(
        'criado_por', 'atualizado_por'
    ).all()
    serializer_class = EmpresaPrestadoraSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
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
    """
    
    queryset = Servico.objects.select_related(
        'criado_por', 'atualizado_por'
    ).all()
    serializer_class = ServicoSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
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
    permission_classes = [IsAuthenticated, CargoBasedPermission]
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
    """
    
    queryset = OrdemServicoItem.objects.select_related(
        'ordem_servico', 'contrato_servico', 'contrato_servico__servico'
    )
    serializer_class = OrdemServicoItemSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['contrato_servico__servico__item', 'contrato_servico__servico__descricao']
    ordering_fields = ['data_criacao', 'valor_aplicado']
    ordering = ['data_criacao']
    filterset_fields = ['ordem_servico']


class TipoDespesaViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento do catálogo de Tipos de Despesa.
    """
    
    queryset = TipoDespesa.objects.select_related(
        'criado_por', 'atualizado_por'
    ).all()
    serializer_class = TipoDespesaSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
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
    """
    
    queryset = DespesaOrdemServico.objects.select_related(
        'ordem_servico', 'tipo_despesa', 'criado_por', 'atualizado_por'
    )
    serializer_class = DespesaOrdemServicoSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
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
    """
    
    queryset = OrdemServicoTitular.objects.select_related(
        'ordem_servico', 'titular', 'criado_por', 'atualizado_por'
    )
    serializer_class = OrdemServicoTitularSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
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
    """
    
    queryset = OrdemServicoDependente.objects.select_related(
        'ordem_servico', 'dependente', 'dependente__titular', 'criado_por', 'atualizado_por'
    )
    serializer_class = OrdemServicoDependenteSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['dependente__nome', 'observacao']
    ordering_fields = ['data_criacao']
    ordering = ['data_criacao']
    filterset_fields = ['ordem_servico', 'dependente']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
