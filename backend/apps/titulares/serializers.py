from rest_framework import serializers
from apps.core.serializers import AmparoLegalSerializer, TipoAtualizacaoSerializer
from apps.empresa.serializers import EmpresaListSerializer
from .models import Titular, VinculoTitular, Dependente, VinculoDependente


class VinculoDependenteSerializer(serializers.ModelSerializer):
    """Serializer para Vínculo do Dependente."""
    dependente_nome = serializers.CharField(source='dependente.nome', read_only=True)
    amparo_nome = serializers.CharField(source='amparo.nome', read_only=True)
    tipo_atualizacao_nome = serializers.CharField(source='tipo_atualizacao.nome', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = VinculoDependente
        fields = [
            'id', 'dependente', 'dependente_nome',
            'status', 'tipo_status', 'data_entrada', 'data_fim_vinculo', 'atualizacao', 'observacoes',
            'amparo', 'amparo_nome', 'consulado',
            'tipo_atualizacao', 'tipo_atualizacao_nome',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class DependenteSerializer(serializers.ModelSerializer):
    titular_nome = serializers.CharField(source='titular.nome', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    tipo_dependente_display = serializers.CharField(source='get_tipo_dependente_display', read_only=True)
    sexo_display = serializers.CharField(source='get_sexo_display', read_only=True)
    vinculos = VinculoDependenteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Dependente
        fields = [
            'id', 'titular', 'titular_nome', 'nome', 'passaporte', 'data_validade_passaporte',
            'rnm', 'cnh', 'status_visto', 'ctps',
            'nacionalidade',
            'tipo_dependente', 'tipo_dependente_display',
            'sexo', 'sexo_display', 'data_nascimento', 'filiacao_um', 'filiacao_dois',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome',
            'vinculos'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']
    
    def validate_nome(self, value):
        """Normaliza e valida nome."""
        from apps.core.validators import normalize_nome
        if not value:
            raise serializers.ValidationError('Nome é obrigatório.')
        normalized = normalize_nome(value)
        if len(normalized) < 3:
            raise serializers.ValidationError('Nome deve ter pelo menos 3 caracteres.')
        return normalized
    
    def validate_rnm(self, value):
        """Valida e limpa RNM."""
        if not value:
            return value
        from apps.core.validators import validate_rnm, clean_document
        validate_rnm(value)
        return clean_document(value, 'rnm')
    
    def validate_passaporte(self, value):
        """Valida e limpa passaporte."""
        if not value:
            return value
        from apps.core.validators import validate_passaporte, clean_document
        validate_passaporte(value)
        return clean_document(value, 'passaporte')
    
    def validate_ctps(self, value):
        """Valida e limpa CTPS."""
        if not value:
            return value
        from apps.core.validators import validate_ctps, clean_document
        validate_ctps(value)
        return clean_document(value, 'ctps')
    
    def validate_cnh(self, value):
        """Valida e limpa CNH."""
        if not value:
            return value
        from apps.core.validators import validate_cnh, clean_document
        validate_cnh(value)
        return clean_document(value, 'cnh')
    
    def validate_data_nascimento(self, value):
        """Valida data de nascimento."""
        if not value:
            return value
        from apps.core.validators import validate_data_nascimento
        validate_data_nascimento(value)
        return value


class VinculoTitularSerializer(serializers.ModelSerializer):
    titular_nome = serializers.CharField(source='titular.nome', read_only=True)
    empresa_nome = serializers.CharField(source='empresa.nome', read_only=True)
    amparo_nome = serializers.CharField(source='amparo.nome', read_only=True)
    tipo_atualizacao_nome = serializers.CharField(source='tipo_atualizacao.nome', read_only=True)
    tipo_vinculo_display = serializers.CharField(source='get_tipo_vinculo_display', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = VinculoTitular
        fields = [
            'id', 'titular', 'titular_nome', 'tipo_vinculo', 'tipo_vinculo_display',
            'empresa', 'empresa_nome', 'amparo', 'amparo_nome',
            'consulado', 'tipo_atualizacao', 'tipo_atualizacao_nome',
            'status', 'tipo_status', 'data_entrada_pais', 'data_fim_vinculo', 'atualizacao', 'observacoes',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class TitularSerializer(serializers.ModelSerializer):
    sexo_display = serializers.CharField(source='get_sexo_display', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    vinculos = VinculoTitularSerializer(many=True, read_only=True)
    dependentes = DependenteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Titular
        fields = [
            'id', 'nome', 'cpf', 'cnh', 'passaporte', 'data_validade_passaporte', 'rnm', 'status_visto', 'ctps',
            'nacionalidade',
            'sexo', 'sexo_display', 'email', 'telefone',
            'filiacao_um', 'filiacao_dois', 'data_nascimento', 'data_validade_cnh',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome',
            'vinculos', 'dependentes'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class VinculoSimplificadoSerializer(serializers.ModelSerializer):
    """Serializer simplificado de vínculo para listagem de titulares."""
    tipo_vinculo_display = serializers.CharField(source='get_tipo_vinculo_display', read_only=True)
    empresa_nome = serializers.CharField(source='empresa.nome', read_only=True)
    amparo_nome = serializers.CharField(source='amparo.nome', read_only=True)
    
    class Meta:
        model = VinculoTitular
        fields = ['id', 'tipo_vinculo', 'tipo_vinculo_display', 'empresa_nome', 
                  'amparo_nome', 'data_entrada_pais', 'data_fim_vinculo', 'status', 'tipo_status']


class TitularListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens."""
    vinculos_count = serializers.SerializerMethodField()
    dependentes_count = serializers.SerializerMethodField()
    vinculos = VinculoSimplificadoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Titular
        fields = ['id', 'nome', 'rnm', 'cpf', 'passaporte', 'nacionalidade', 'email', 'telefone',
                  'filiacao_um', 'filiacao_dois', 'data_nascimento', 'vinculos_count', 'dependentes_count', 
                  'vinculos', 'data_criacao', 'ultima_atualizacao']
    
    def get_vinculos_count(self, obj):
        return obj.vinculos.filter(status=True).count()
    
    def get_dependentes_count(self, obj):
        return obj.dependentes.count()


class TitularCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de titular."""
    
    class Meta:
        model = Titular
        fields = [
            'id', 'nome', 'cpf', 'cnh', 'passaporte', 'data_validade_passaporte', 'rnm', 'status_visto', 'ctps',
            'nacionalidade', 'sexo', 'email', 'telefone', 'filiacao_um', 'filiacao_dois', 
            'data_nascimento', 'data_validade_cnh'
        ]
        read_only_fields = ['id']
    
    def validate_nome(self, value):
        """Normaliza e valida nome."""
        from apps.core.validators import normalize_nome
        if not value:
            raise serializers.ValidationError('Nome é obrigatório.')
        normalized = normalize_nome(value)
        if len(normalized) < 3:
            raise serializers.ValidationError('Nome deve ter pelo menos 3 caracteres.')
        if ' ' not in normalized:
            raise serializers.ValidationError('Digite o nome completo (nome e sobrenome).')
        return normalized
    
    def validate_cpf(self, value):
        """Valida e limpa CPF."""
        if not value:
            return value
        from apps.core.validators import validate_cpf, clean_document
        validate_cpf(value)
        return clean_document(value, 'cpf')
    
    def validate_rnm(self, value):
        """Valida e limpa RNM."""
        if not value:
            return value
        from apps.core.validators import validate_rnm, clean_document
        validate_rnm(value)
        return clean_document(value, 'rnm')
    
    def validate_passaporte(self, value):
        """Valida e limpa passaporte."""
        if not value:
            return value
        from apps.core.validators import validate_passaporte, clean_document
        validate_passaporte(value)
        return clean_document(value, 'passaporte')
    
    def validate_ctps(self, value):
        """Valida e limpa CTPS."""
        if not value:
            return value
        from apps.core.validators import validate_ctps, clean_document
        validate_ctps(value)
        return clean_document(value, 'ctps')
    
    def validate_cnh(self, value):
        """Valida e limpa CNH."""
        if not value:
            return value
        from apps.core.validators import validate_cnh, clean_document
        validate_cnh(value)
        return clean_document(value, 'cnh')
    
    def validate_data_nascimento(self, value):
        """Valida data de nascimento."""
        if not value:
            return value
        from apps.core.validators import validate_data_nascimento
        validate_data_nascimento(value)
        return value
