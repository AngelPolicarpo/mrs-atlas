from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AmparoLegal, TipoAtualizacao
from .serializers import (
    AmparoLegalSerializer,
    TipoAtualizacaoSerializer
)


class AmparoLegalViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de amparos legais."""
    queryset = AmparoLegal.objects.all()
    serializer_class = AmparoLegalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']


class TipoAtualizacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de tipos de atualização."""
    queryset = TipoAtualizacao.objects.all()
    serializer_class = TipoAtualizacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
