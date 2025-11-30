from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer para o modelo User."""
    
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
