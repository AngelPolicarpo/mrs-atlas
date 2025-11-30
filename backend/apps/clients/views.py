from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Client, ClientDocument
from .serializers import (
    ClientDocumentSerializer,
    ClientListSerializer,
    ClientSerializer,
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de Clientes.
    
    Endpoints:
    - GET /api/v1/clients/ - Lista clientes
    - POST /api/v1/clients/ - Cria cliente
    - GET /api/v1/clients/{id}/ - Detalhe do cliente
    - PUT /api/v1/clients/{id}/ - Atualiza cliente
    - PATCH /api/v1/clients/{id}/ - Atualiza parcialmente
    - DELETE /api/v1/clients/{id}/ - Remove cliente
    - POST /api/v1/clients/{id}/anonymize/ - LGPD: Anonimiza dados
    - GET /api/v1/clients/{id}/export/ - LGPD: Exporta dados
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Client.objects.all()
        
        # Filtro por busca
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(company__icontains=search) |
                Q(cpf__icontains=search)
            )
        
        # Filtro por status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer
    
    @action(detail=True, methods=['post'])
    def anonymize(self, request, pk=None):
        """
        LGPD: Anonimiza dados do cliente.
        Direito à eliminação (Art. 18, VI da LGPD).
        """
        client = self.get_object()
        client.anonymize()
        return Response(
            {'message': f'Dados do cliente {pk} anonimizados com sucesso.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """
        LGPD: Exporta todos os dados do cliente.
        Direito de acesso (Art. 18, II da LGPD).
        """
        client = self.get_object()
        serializer = ClientSerializer(client)
        
        # Inclui histórico de alterações
        history = []
        for record in client.history.all()[:50]:  # Últimas 50 alterações
            history.append({
                'date': record.history_date,
                'type': record.history_type,
                'user': str(record.history_user) if record.history_user else None,
            })
        
        return Response({
            'client': serializer.data,
            'history': history,
            'export_date': client.updated_at,
        })


class ClientDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos de cliente."""
    
    serializer_class = ClientDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ClientDocument.objects.filter(
            client_id=self.kwargs.get('client_pk')
        )
    
    def perform_create(self, serializer):
        serializer.save(
            client_id=self.kwargs.get('client_pk'),
            uploaded_by=self.request.user
        )
