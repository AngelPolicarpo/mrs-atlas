from rest_framework import serializers
from apps.core.serializers import NacionalidadeSerializer, AmparoLegalSerializer, ConsuladoSerializer, TipoAtualizacaoSerializer
from apps.empresa.serializers import EmpresaListSerializer
from .models import Titular, VinculoTitular, Dependente


class DependenteSerializer(serializers.ModelSerializer):
    titular_nome = serializers.CharField(source='titular.nome', read_only=True)
    nacionalidade_nome = serializers.CharField(source='nacionalidade.nome', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    tipo_dependente_display = serializers.CharField(source='get_tipo_dependente_display', read_only=True)
    sexo_display = serializers.CharField(source='get_sexo_display', read_only=True)
    
    class Meta:
        model = Dependente
        fields = [
            'id', 'titular', 'titular_nome', 'nome', 'passaporte', 'rnm',
            'nacionalidade', 'nacionalidade_nome',
            'tipo_dependente', 'tipo_dependente_display',
            'sexo', 'sexo_display', 'data_nascimento', 'pai', 'mae',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class VinculoTitularSerializer(serializers.ModelSerializer):
    titular_nome = serializers.CharField(source='titular.nome', read_only=True)
    empresa_nome = serializers.CharField(source='empresa.nome', read_only=True)
    amparo_nome = serializers.CharField(source='amparo.nome', read_only=True)
    consulado_pais = serializers.CharField(source='consulado.pais', read_only=True)
    tipo_atualizacao_nome = serializers.CharField(source='tipo_atualizacao.nome', read_only=True)
    tipo_vinculo_display = serializers.CharField(source='get_tipo_vinculo_display', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = VinculoTitular
        fields = [
            'id', 'titular', 'titular_nome', 'tipo_vinculo', 'tipo_vinculo_display',
            'empresa', 'empresa_nome', 'amparo', 'amparo_nome',
            'consulado', 'consulado_pais', 'tipo_atualizacao', 'tipo_atualizacao_nome',
            'status', 'data_entrada_pais', 'data_fim_vinculo', 'observacoes',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class TitularSerializer(serializers.ModelSerializer):
    nacionalidade_nome = serializers.CharField(source='nacionalidade.nome', read_only=True)
    sexo_display = serializers.CharField(source='get_sexo_display', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    vinculos = VinculoTitularSerializer(many=True, read_only=True)
    dependentes = DependenteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Titular
        fields = [
            'id', 'nome', 'cpf', 'cnh', 'passaporte', 'rnm',
            'nacionalidade', 'nacionalidade_nome',
            'sexo', 'sexo_display', 'email', 'telefone',
            'pai', 'mae', 'data_nascimento', 'data_validade_cnh',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome',
            'vinculos', 'dependentes'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class TitularListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens."""
    nacionalidade_nome = serializers.CharField(source='nacionalidade.nome', read_only=True)
    vinculos_count = serializers.SerializerMethodField()
    dependentes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Titular
        fields = ['id', 'nome', 'rnm', 'cpf', 'nacionalidade_nome', 'email', 
                  'pai', 'mae', 'data_nascimento', 'vinculos_count', 'dependentes_count']
    
    def get_vinculos_count(self, obj):
        return obj.vinculos.filter(status=True).count()
    
    def get_dependentes_count(self, obj):
        return obj.dependentes.count()


class TitularCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de titular."""
    
    class Meta:
        model = Titular
        fields = [
            'nome', 'cpf', 'cnh', 'passaporte', 'rnm', 'nacionalidade',
            'sexo', 'email', 'telefone', 'pai', 'mae', 
            'data_nascimento', 'data_validade_cnh'
        ]
