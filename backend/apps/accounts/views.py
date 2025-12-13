from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import (
    PasswordResetSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class IsAdminUser(permissions.BasePermission):
    """Permissão apenas para administradores."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de usuários pelo administrador.
    
    Endpoints:
    - GET /api/v1/users/ - Lista usuários
    - POST /api/v1/users/ - Cria usuário
    - GET /api/v1/users/{id}/ - Detalhe do usuário
    - PATCH /api/v1/users/{id}/ - Atualiza usuário
    - DELETE /api/v1/users/{id}/ - Desativa usuário
    - POST /api/v1/users/{id}/reset-password/ - Reseta senha
    """
    
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-data_criacao')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(nome__icontains=search)
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def destroy(self, request, *args, **kwargs):
        """Desativa o usuário ao invés de deletar."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(
            {'message': 'Usuário desativado com sucesso.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """Reseta a senha do usuário."""
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response(
            {'message': 'Senha alterada com sucesso.'},
            status=status.HTTP_200_OK
        )


class CurrentUserView(APIView):
    """
    Retorna dados do usuário autenticado com informações de permissões.
    
    GET /api/v1/me/
    Retorna:
        - Dados do usuário
        - Lista de departamentos vinculados
        - Sistemas disponíveis (para tela de seleção)
        - Permissões completas por departamento
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Retorna o perfil completo após atualização
        from .serializers import UserProfileSerializer
        return Response(UserProfileSerializer(request.user).data)


class LGPDDataExportView(APIView):
    """
    LGPD: Exporta todos os dados do usuário.
    Direito de acesso aos dados (Art. 18, II da LGPD).
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from apps.titulares.models import Titular, VinculoTitular, Dependente
        from apps.titulares.serializers import TitularListSerializer
        from apps.empresa.models import Empresa
        from apps.empresa.serializers import EmpresaListSerializer
        
        user_data = UserSerializer(request.user).data
        
        # Busca titulares criados pelo usuário
        titulares = Titular.objects.filter(criado_por=request.user)
        titulares_data = TitularListSerializer(titulares, many=True).data
        
        # Busca empresas criadas pelo usuário
        empresas = Empresa.objects.filter(criado_por=request.user)
        empresas_data = EmpresaListSerializer(empresas, many=True).data
        
        return Response({
            'user': user_data,
            'titulares_criados': titulares_data,
            'empresas_criadas': empresas_data,
            'export_date': request.user.ultima_atualizacao,
        })


class LGPDDeleteAccountView(APIView):
    """
    LGPD: Anonimiza dados do usuário.
    Direito à eliminação (Art. 18, VI da LGPD).
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request):
        user = request.user
        
        # Anonimiza ao invés de deletar (mantém histórico para auditoria)
        user.email = f'deleted_{user.id}@anonimo.local'
        user.nome = 'Usuário Removido'
        user.is_active = False
        user.save()
        
        return Response(
            {'message': 'Conta desativada e dados anonimizados com sucesso.'},
            status=status.HTTP_200_OK
        )
