from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Empresa
from .serializers import EmpresaSerializer, EmpresaListSerializer
from apps.accounts.permissions import CargoBasedPermission, PermissionMessageMixin


class EmpresaViewSet(PermissionMessageMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de empresas.
    
    Permissões baseadas no Cargo do usuário.
    """
    
    queryset = Empresa.objects.all()
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['nome', 'cnpj', 'email']
    ordering_fields = ['nome', 'cnpj', 'data_criacao', 'data_registro']
    ordering = ['nome']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmpresaListSerializer
        return EmpresaSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
