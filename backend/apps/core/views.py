from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Nacionalidade, AmparoLegal, Consulado, TipoAtualizacao
from .serializers import (
    NacionalidadeSerializer,
    AmparoLegalSerializer,
    ConsuladoSerializer,
    TipoAtualizacaoSerializer
)


class NacionalidadeViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de nacionalidades."""
    queryset = Nacionalidade.objects.all()
    serializer_class = NacionalidadeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'codigo_iso']
    ordering_fields = ['nome', 'data_criacao']


class AmparoLegalViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de amparos legais."""
    queryset = AmparoLegal.objects.all()
    serializer_class = AmparoLegalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']


class ConsuladoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de consulados."""
    queryset = Consulado.objects.all()
    serializer_class = ConsuladoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['pais']
    ordering_fields = ['pais', 'data_criacao']


class TipoAtualizacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de tipos de atualização."""
    queryset = TipoAtualizacao.objects.all()
    serializer_class = TipoAtualizacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
