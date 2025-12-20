from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from .models import Contrato, ContratoServico
from .serializers import (
    ContratoSerializer,
    ContratoListSerializer,
    ContratoCreateUpdateSerializer,
    ContratoServicoSerializer,
    ContratoServicoListSerializer
)
from apps.accounts.permissions import CargoBasedPermission, PermissionMessageMixin


# =============================================================================
# FILTROS
# =============================================================================

class ContratoFilter(django_filters.FilterSet):
    """Filtro customizado para Contrato."""
    
    numero = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.ChoiceFilter(choices=Contrato.STATUS_CHOICES)
    empresa_contratante = django_filters.UUIDFilter(field_name='empresa_contratante__id')
    data_inicio_gte = django_filters.DateFilter(field_name='data_inicio', lookup_expr='gte')
    data_inicio_lte = django_filters.DateFilter(field_name='data_inicio', lookup_expr='lte')
    data_fim_gte = django_filters.DateFilter(field_name='data_fim', lookup_expr='gte')
    data_fim_lte = django_filters.DateFilter(field_name='data_fim', lookup_expr='lte')
    ativo = django_filters.BooleanFilter(method='filter_ativo')
    
    class Meta:
        model = Contrato
        fields = ['numero', 'status', 'empresa_contratante']
    
    def filter_ativo(self, queryset, name, value):
        """Filtra contratos ativos (status ATIVO e dentro da vigência)."""
        from django.utils import timezone
        from django.db.models import Q
        
        hoje = timezone.now().date()
        if value:
            return queryset.filter(
                status='ATIVO'
            ).filter(
                Q(data_fim__isnull=True) | Q(data_fim__gte=hoje),
                data_inicio__lte=hoje
            )
        return queryset


class ContratoServicoFilter(django_filters.FilterSet):
    """Filtro para Serviços do Contrato."""
    
    contrato = django_filters.UUIDFilter(field_name='contrato__id')
    servico = django_filters.UUIDFilter(field_name='servico__id')
    ativo = django_filters.BooleanFilter()
    
    class Meta:
        model = ContratoServico
        fields = ['contrato', 'servico', 'ativo']


# =============================================================================
# VIEWSETS
# =============================================================================

class ContratoViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Contratos.
    
    Endpoints:
    - GET /contratos/ - Lista contratos
    - POST /contratos/ - Cria contrato (status padrão: ATIVO)
    - GET /contratos/{id}/ - Detalhe do contrato
    - PUT/PATCH /contratos/{id}/ - Atualiza contrato
    - DELETE /contratos/{id}/ - Remove contrato
    - GET /contratos/{id}/servicos/ - Lista serviços do contrato
    - GET /contratos/{id}/ordens-servico/ - Lista OS do contrato
    - GET /contratos/ativos/ - Lista contratos ativos
    - POST /contratos/{id}/finalizar/ - Finaliza contrato
    - POST /contratos/{id}/cancelar/ - Cancela contrato
    """
    
    queryset = Contrato.objects.select_related(
        'empresa_contratante',
        'criado_por', 'atualizado_por'
    ).prefetch_related(
        'servicos_contratados', 'servicos_contratados__servico',
        'ordens_servico'
    )
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ContratoFilter
    search_fields = ['numero', 'observacao', 'empresa_contratante__nome']
    ordering_fields = ['numero', 'status', 'data_inicio', 'data_fim', 'data_criacao']
    ordering = ['-data_criacao']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ContratoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ContratoCreateUpdateSerializer
        return ContratoSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
    
    @action(detail=True, methods=['get'])
    def servicos(self, request, pk=None):
        """Lista TODOS os serviços vinculados ao contrato (ativos e inativos)."""
        contrato = self.get_object()
        # Retorna todos os serviços para visualização no contrato
        servicos = contrato.servicos_contratados.select_related('servico')
        serializer = ContratoServicoListSerializer(servicos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='servicos-disponiveis')
    def servicos_disponiveis(self, request, pk=None):
        """Lista serviços do contrato disponíveis para execução."""
        contrato = self.get_object()
        servicos = contrato.servicos_contratados.select_related('servico').filter(ativo=True)
        
        serializer = ContratoServicoListSerializer(servicos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='ordens-servico')
    def ordens_servico(self, request, pk=None):
        """Lista ordens de serviço do contrato."""
        from apps.ordem_servico.serializers import OrdemServicoListSerializer
        contrato = self.get_object()
        ordens = contrato.ordens_servico.select_related(
            'empresa_solicitante', 'empresa_pagadora'
        )
        serializer = OrdemServicoListSerializer(ordens, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas contratos ativos e dentro da vigência."""
        from django.utils import timezone
        from django.db.models import Q
        
        hoje = timezone.now().date()
        queryset = self.queryset.filter(
            status='ATIVO'
        ).filter(
            Q(data_fim__isnull=True) | Q(data_fim__gte=hoje),
            data_inicio__lte=hoje
        )
        serializer = ContratoListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        """Ativa o contrato."""
        contrato = self.get_object()
        
        if contrato.status == 'CANCELADO':
            return Response(
                {'error': 'Não é possível ativar um contrato cancelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if contrato.status == 'ATIVO':
            return Response(
                {'error': 'Este contrato já está ativo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrato.status = 'ATIVO'
        contrato.atualizado_por = request.user
        contrato.save()
        
        serializer = ContratoSerializer(contrato)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza o contrato (término normal)."""
        contrato = self.get_object()
        
        if contrato.status == 'CANCELADO':
            return Response(
                {'error': 'Não é possível finalizar um contrato cancelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if contrato.status == 'FINALIZADO':
            return Response(
                {'error': 'Este contrato já está finalizado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrato.status = 'FINALIZADO'
        contrato.atualizado_por = request.user
        contrato.save()
        
        serializer = ContratoSerializer(contrato)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela o contrato (rescisão)."""
        contrato = self.get_object()
        
        if contrato.status == 'CANCELADO':
            return Response(
                {'error': 'Este contrato já está cancelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se há OS em andamento
        os_em_andamento = contrato.ordens_servico.filter(
            status__in=['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO']
        ).count()
        
        if os_em_andamento > 0:
            return Response(
                {'error': f'Não é possível cancelar o contrato. Existem {os_em_andamento} OS em andamento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrato.status = 'CANCELADO'
        contrato.atualizado_por = request.user
        contrato.save()
        
        serializer = ContratoSerializer(contrato)
        return Response(serializer.data)


class ContratoServicoViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Serviços vinculados a Contratos.
    
    Endpoints:
    - GET /contrato-servicos/ - Lista serviços de contratos
    - POST /contrato-servicos/ - Vincula serviço a contrato
    - GET /contrato-servicos/{id}/ - Detalhe do serviço vinculado
    - PUT/PATCH /contrato-servicos/{id}/ - Atualiza serviço vinculado
    - DELETE /contrato-servicos/{id}/ - Remove serviço do contrato
    """
    
    queryset = ContratoServico.objects.select_related(
        'contrato', 'servico', 'criado_por', 'atualizado_por'
    )
    serializer_class = ContratoServicoSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ContratoServicoFilter
    search_fields = ['servico__item', 'servico__descricao']
    ordering_fields = ['servico__item', 'valor', 'quantidade', 'data_criacao']
    ordering = ['servico__item']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
