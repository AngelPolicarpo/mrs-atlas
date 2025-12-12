from rest_framework import serializers
from .models import AmparoLegal, TipoAtualizacao


class AmparoLegalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmparoLegal
        fields = ['id', 'nome', 'descricao', 'ativo', 'data_criacao', 'ultima_atualizacao']
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']


class TipoAtualizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAtualizacao
        fields = ['id', 'nome', 'descricao', 'ativo', 'data_criacao', 'ultima_atualizacao']
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']
