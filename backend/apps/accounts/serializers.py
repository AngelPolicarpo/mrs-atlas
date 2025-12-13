"""
Serializers para o sistema de controle de acesso RBAC Simplificado.

Estrutura:
- Sistema: Aplicação/Módulo do Atlas
- Departamento: Área organizacional
- Cargo: auth_group nativo do Django
- User: tipo_usuario (INTERNO/CLIENTE) + empresa
"""

from django.contrib.auth.models import Group
from rest_framework import serializers

from .models import Departamento, Sistema, User, UsuarioVinculo


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
    """
    Serializer para Cargo (auth_group nativo do Django).
    """
    
    permissoes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissoes_count']
    
    def get_permissoes_count(self, obj):
        return obj.permissions.count()


class UsuarioVinculoSerializer(serializers.ModelSerializer):
    """Serializer para vínculo de acesso (Sistema + Departamento)."""
    
    sistema = SistemaSerializer(read_only=True)
    departamento = DepartamentoSerializer(read_only=True)
    
    class Meta:
        model = UsuarioVinculo
        fields = ['id', 'sistema', 'departamento', 'ativo']


# ============================================================
# USER SERIALIZERS
# ============================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer básico para o modelo User."""
    
    cargo = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'nome',
            'email',
            'tipo_usuario',
            'cargo',
            'is_active',
            'is_staff',
            'data_criacao',
            'ultima_atualizacao',
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']
    
    def get_cargo(self, obj):
        cargo = obj.get_cargo()
        return cargo.name if cargo else None


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer completo para /api/me/ com informações de acesso.
    
    Retorna:
    - Dados do usuário
    - Tipo de usuário (INTERNO/CLIENTE)
    - Empresa (se cliente)
    - Cargo (group)
    - Lista de vínculos (Sistema + Departamento)
    - Sistemas disponíveis com departamentos
    - Permissões completas (sistema → departamento → permissões)
    """
    
    cargo = serializers.SerializerMethodField()
    empresa = serializers.SerializerMethodField()
    vinculos = serializers.SerializerMethodField()
    sistemas_disponiveis = serializers.SerializerMethodField()
    permissoes = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'nome',
            'email',
            'tipo_usuario',
            'cargo',
            'empresa',
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
    
    def get_cargo(self, obj):
        """Retorna informações do cargo (group)."""
        cargo = obj.get_cargo()
        if not cargo:
            return None
        return {
            'id': cargo.id,
            'nome': cargo.name,
            'permissoes_count': cargo.permissions.count(),
        }
    
    def get_empresa(self, obj):
        """Retorna informações da empresa (apenas para clientes)."""
        if obj.tipo_usuario != User.TipoUsuario.CLIENTE or not obj.empresa:
            return None
        return {
            'id': str(obj.empresa.id_empresa),
            'nome': obj.empresa.nome,
        }
    
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
    
    def to_representation(self, instance):
        """Adiciona permissões Django para controle de UI."""
        data = super().to_representation(instance)
        
        # Adiciona lista de permissões Django para o frontend
        data['permissoes_django'] = self._get_permissoes_django(instance)
        data['permissoes_lista'] = instance.get_permissoes_list()
        
        return data
    
    def _get_permissoes_django(self, user):
        """
        Retorna permissões Django detalhadas para o frontend.
        
        Formato:
        {
            'titulares': {
                'titular': {'view': True, 'add': False, 'change': False, 'delete': False},
                'dependente': {'view': True, 'add': False, 'change': False, 'delete': False},
            },
            ...
        }
        """
        if user.is_superuser:
            return {'is_superuser': True}
        
        perms = {}
        user_perms = user.get_all_permissions()
        
        for perm in user_perms:
            try:
                app_label, codename = perm.split('.')
                action, model = codename.split('_', 1)
                
                if app_label not in perms:
                    perms[app_label] = {}
                if model not in perms[app_label]:
                    perms[app_label][model] = {'view': False, 'add': False, 'change': False, 'delete': False}
                
                if action in ['view', 'add', 'change', 'delete']:
                    perms[app_label][model][action] = True
            except ValueError:
                continue
        
        return perms


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de usuário pelo admin."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'nome',
            'email',
            'password',
            'tipo_usuario',
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
            'tipo_usuario',
            'is_active',
            'is_staff',
        ]


class PasswordResetSerializer(serializers.Serializer):
    """Serializer para reset de senha pelo admin."""
    
    new_password = serializers.CharField(min_length=8, write_only=True)
