"""
Serializers para o sistema de controle de acesso RBAC + ABAC híbrido.
"""

from rest_framework import serializers

from .models import Cargo, Departamento, Sistema, User, UsuarioVinculo


# ============================================================
# SERIALIZERS BASE
# ============================================================

class SistemaSerializer(serializers.ModelSerializer):
    """Serializer para Sistema."""
    
    class Meta:
        model = Sistema
        fields = ['id', 'codigo', 'nome', 'descricao', 'icone', 'cor', 'ordem']


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para Departamento."""
    
    class Meta:
        model = Departamento
        fields = ['id', 'codigo', 'nome', 'descricao', 'icone', 'ordem']


class CargoSerializer(serializers.ModelSerializer):
    """Serializer para Cargo."""
    
    permissoes = serializers.SerializerMethodField()
    
    class Meta:
        model = Cargo
        fields = ['id', 'codigo', 'nome', 'descricao', 'nivel', 'permissoes']
    
    def get_permissoes(self, obj):
        return obj.get_permissoes()


class UsuarioVinculoSerializer(serializers.ModelSerializer):
    """Serializer para vínculo de acesso (Sistema + Departamento + Cargo)."""
    
    sistema = SistemaSerializer(read_only=True)
    departamento = DepartamentoSerializer(read_only=True)
    cargo = CargoSerializer(read_only=True)
    permissoes = serializers.SerializerMethodField()
    
    class Meta:
        model = UsuarioVinculo
        fields = ['id', 'sistema', 'departamento', 'cargo', 'permissoes', 'ativo']
    
    def get_permissoes(self, obj):
        return obj.get_permissoes()


# ============================================================
# USER SERIALIZERS
# ============================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer básico para o modelo User."""
    
    class Meta:
        model = User
        fields = [
            'id',
            'nome',
            'email',
            'is_active',
            'is_staff',
            'data_criacao',
            'ultima_atualizacao',
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer completo para /api/me/ com informações de acesso RBAC + ABAC.
    
    Retorna:
    - Dados do usuário
    - Lista de vínculos (Sistema + Departamento + Cargo)
    - Sistemas disponíveis com departamentos
    - Permissões completas (sistema → departamento → permissões)
    """
    
    vinculos = serializers.SerializerMethodField()
    sistemas_disponiveis = serializers.SerializerMethodField()
    permissoes = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'nome',
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'vinculos',
            'sistemas_disponiveis',
            'permissoes',
            'data_criacao',
            'ultima_atualizacao',
        ]
        read_only_fields = fields
    
    def get_vinculos(self, obj):
        """Retorna todos os vínculos ativos do usuário."""
        vinculos = obj.get_vinculos_ativos()
        return UsuarioVinculoSerializer(vinculos, many=True).data
    
    def get_sistemas_disponiveis(self, obj):
        """
        Retorna lista de sistemas disponíveis para seleção.
        Cada sistema inclui os departamentos que o usuário tem acesso.
        """
        return obj.get_sistemas_disponiveis()
    
    def get_permissoes(self, obj):
        """
        Retorna todas as permissões em formato estruturado.
        
        Formato:
        {
            'prazos': {
                'consular': {
                    'cargo': 'gestor',
                    'cargo_nome': 'Gestor',
                    'permissoes': ['view', 'add', 'change', 'delete', 'export']
                },
                'juridico': {...}
            },
            'ordem_servico': {...}
        }
        """
        return obj.get_todas_permissoes()


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de usuário pelo admin."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'nome',
            'email',
            'password',
            'is_active',
            'is_staff',
        ]
    
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de usuário."""
    
    class Meta:
        model = User
        fields = [
            'nome',
            'is_active',
            'is_staff',
        ]


class PasswordResetSerializer(serializers.Serializer):
    """Serializer para reset de senha pelo admin."""
    
    new_password = serializers.CharField(min_length=8, write_only=True)
