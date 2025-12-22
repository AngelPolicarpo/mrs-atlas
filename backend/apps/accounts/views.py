from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    PasswordResetSerializer,
    UserCreateSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


# ============================================================
# AUTHENTICATION VIEWS
# ============================================================

class LoginView(APIView):
    """
    Login do usuário via email/senha.
    
    POST /api/auth/login/
    
    Body:
        - email: string
        - password: string
    
    Returns:
        - access: JWT access token
        - refresh: JWT refresh token
        - user: dados do usuário com permissões
    """
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response(
                {'detail': 'Email e senha são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Autenticar usuário
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response(
                {'detail': 'Credenciais inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'detail': 'Usuário inativo. Entre em contato com o administrador.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Serializar dados do usuário
        user_data = UserProfileSerializer(user).data
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
        })


class LogoutView(APIView):
    """
    Logout do usuário (blacklist do refresh token).
    
    POST /api/auth/logout/
    
    Body:
        - refresh: JWT refresh token
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Logout realizado com sucesso.'})
        except Exception:
            return Response(
                {'detail': 'Token inválido ou já expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(APIView):
    """
    Registro de novo usuário (se habilitado).
    
    POST /api/auth/register/
    
    Body:
        - nome: string
        - email: string
        - password: string
    """
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class ChangePasswordView(APIView):
    """
    Alteração de senha do usuário autenticado.
    
    POST /api/auth/password/change/
    
    Body:
        - old_password: string
        - new_password: string
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')
        
        if not old_password or not new_password:
            return Response(
                {'detail': 'Senha atual e nova senha são obrigatórias.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.user.check_password(old_password):
            return Response(
                {'detail': 'Senha atual incorreta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'detail': 'A nova senha deve ter pelo menos 8 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.set_password(new_password)
        request.user.save()
        
        return Response({'detail': 'Senha alterada com sucesso.'})


# ============================================================
# PERMISSION CLASSES
# ============================================================


class IsAdminUser(permissions.BasePermission):
    """Permissão apenas para administradores."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


# ============================================================
# USER MANAGEMENT VIEWS
# ============================================================


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
        - Permissões Django para controle de UI
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


class CheckPermissionView(APIView):
    """
    Verifica se o usuário tem uma permissão específica.
    
    POST /api/v1/check-permission/
    
    Body:
        - permission: string (ex: 'titulares.delete_titular')
    
    Returns:
        - has_permission: boolean
        - message: string (mensagem explicativa se não tiver)
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    PERMISSION_MESSAGES = {
        'view': 'Você não tem permissão para visualizar este recurso.',
        'add': 'Você não tem permissão para criar novos registros.',
        'change': 'Você não tem permissão para editar este registro.',
        'delete': 'Você não tem permissão para excluir este registro.',
    }
    
    def post(self, request):
        permission = request.data.get('permission', '')
        
        if not permission:
            return Response(
                {'detail': 'O parâmetro "permission" é obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        has_perm = request.user.has_perm(permission)
        
        # Determinar mensagem de erro
        message = None
        if not has_perm:
            try:
                _, codename = permission.split('.')
                action = codename.split('_')[0]
                message = self.PERMISSION_MESSAGES.get(
                    action, 
                    'Você não tem permissão para realizar esta ação.'
                )
            except ValueError:
                message = 'Você não tem permissão para realizar esta ação.'
        
        return Response({
            'has_permission': has_perm,
            'message': message,
        })


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


class UserSearchView(APIView):
    """
    Busca simples de usuários ativos para autocomplete.
    Acessível por qualquer usuário autenticado.
    
    GET /api/v1/users/search/?search=termo
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        search = request.query_params.get('search', '').strip()
        
        queryset = User.objects.filter(is_active=True).order_by('nome')
        
        if search:
            queryset = queryset.filter(
                Q(nome__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Limita resultados para autocomplete
        queryset = queryset[:20]
        
        data = [
            {
                'id': str(user.id),
                'nome': user.nome,
                'email': user.email,
            }
            for user in queryset
        ]
        
        return Response(data)