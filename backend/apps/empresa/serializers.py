from rest_framework import serializers
from .models import Empresa


class EmpresaSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = Empresa
        fields = [
            'id', 'nome', 'cnpj', 'email', 'telefone', 'endereco',
            'status', 'data_registro', 'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class EmpresaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens."""
    
    class Meta:
        model = Empresa
        fields = ['id', 'nome', 'cnpj', 'status']
