from rest_framework import serializers
from .models import Nacionalidade, AmparoLegal, Consulado, TipoAtualizacao


class NacionalidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nacionalidade
        fields = ['id', 'nome', 'codigo_iso', 'ativo', 'data_criacao', 'ultima_atualizacao']
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']


class AmparoLegalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmparoLegal
        fields = ['id', 'nome', 'descricao', 'ativo', 'data_criacao', 'ultima_atualizacao']
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']


class ConsuladoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulado
        fields = ['id', 'pais', 'ativo', 'data_criacao', 'ultima_atualizacao']
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']


class TipoAtualizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAtualizacao
        fields = ['id', 'nome', 'descricao', 'ativo', 'data_criacao', 'ultima_atualizacao']
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']
