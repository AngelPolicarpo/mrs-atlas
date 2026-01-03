from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import AmparoLegal, TipoAtualizacao
from .serializers import (
    AmparoLegalSerializer,
    TipoAtualizacaoSerializer
)
from apps.accounts.permissions import CargoBasedPermission, PermissionMessageMixin


class AmparoLegalViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de amparos legais.
    
    Permissões baseadas no Cargo do usuário.
    """
    queryset = AmparoLegal.objects.all()
    serializer_class = AmparoLegalSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']


class TipoAtualizacaoViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de tipos de atualização.
    
    Permissões baseadas no Cargo do usuário.
    """
    queryset = TipoAtualizacao.objects.all()
    serializer_class = TipoAtualizacaoSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']
