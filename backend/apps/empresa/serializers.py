from rest_framework import serializers
from .models import Empresa
import re
import unicodedata


def normalize_nome(value):
    """Normaliza nome: uppercase, sem acentos, apenas letras e espaços."""
    if not value:
        return ''
    # Converte para uppercase
    value = value.upper()
    # Remove acentos
    value = unicodedata.normalize('NFD', value)
    value = ''.join(c for c in value if unicodedata.category(c) != 'Mn')
    # Remove tudo exceto letras e espaços
    value = re.sub(r'[^A-Z\s]', '', value)
    # Múltiplos espaços -> um espaço
    value = re.sub(r'\s+', ' ', value)
    return value.strip()


def validate_cnpj_digits(cnpj):
    """Valida os dígitos verificadores do CNPJ."""
    # Remove caracteres não numéricos
    cnpj = re.sub(r'\D', '', cnpj)
    
    if len(cnpj) != 14:
        return False
    
    # Verifica se todos os dígitos são iguais
    if len(set(cnpj)) == 1:
        return False
    
    # Validação do primeiro dígito verificador
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(cnpj[i]) * weights1[i] for i in range(12))
    digit1 = total % 11
    digit1 = 0 if digit1 < 2 else 11 - digit1
    
    if digit1 != int(cnpj[12]):
        return False
    
    # Validação do segundo dígito verificador
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(cnpj[i]) * weights2[i] for i in range(13))
    digit2 = total % 11
    digit2 = 0 if digit2 < 2 else 11 - digit2
    
    if digit2 != int(cnpj[13]):
        return False
    
    return True


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
    
    def validate_nome(self, value):
        """Valida e normaliza o nome da empresa."""
        if not value:
            raise serializers.ValidationError('Nome é obrigatório.')
        
        normalized = normalize_nome(value)
        
        if len(normalized) < 3:
            raise serializers.ValidationError('Nome deve ter pelo menos 3 caracteres.')
        
        return normalized
    
    def validate_cnpj(self, value):
        """Valida o CNPJ (formato e dígitos verificadores)."""
        if not value:
            return value
        
        # Remove formatação
        cnpj_clean = re.sub(r'\D', '', value)
        
        if len(cnpj_clean) != 14:
            raise serializers.ValidationError('CNPJ deve ter 14 dígitos.')
        
        if not validate_cnpj_digits(cnpj_clean):
            raise serializers.ValidationError('CNPJ inválido.')
        
        # Verificar unicidade (excluindo o registro atual em caso de update)
        instance = self.instance
        queryset = Empresa.objects.filter(cnpj=cnpj_clean)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Este CNPJ já está cadastrado.')
        
        return cnpj_clean


class EmpresaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens."""
    
    class Meta:
        model = Empresa
        fields = ['id', 'nome', 'cnpj', 'status']
