"""
Validadores customizados para campos de documentos brasileiros e estrangeiros.
"""
import re
from django.core.exceptions import ValidationError


# Padrões inválidos que devem ser rejeitados
INVALID_PATTERNS = [
    r'^n[aã]o\s*(tem|consta|possui|informado|declarado)?$',
    r'^nenhum$',
    r'^vazio$',
    r'^null$',
    r'^undefined$',
    r'^-+$',
    r'^\.+$',
    r'^\*+$',
    r'^x+$',
    r'^0+$',
]


def is_invalid_pattern(value):
    """Verifica se o valor é um padrão inválido."""
    if not value:
        return False
    value_lower = value.strip().lower()
    return any(re.match(pattern, value_lower, re.IGNORECASE) for pattern in INVALID_PATTERNS)


def remove_formatting(value):
    """Remove formatação de documento (pontos, hífens, espaços)."""
    if not value:
        return ''
    return re.sub(r'[\s.\-/]', '', str(value))


def validate_cpf(value):
    """Valida CPF brasileiro."""
    if not value:
        return
    
    cpf = remove_formatting(value)
    cpf = re.sub(r'\D', '', cpf)
    
    if len(cpf) != 11:
        raise ValidationError('CPF deve ter 11 dígitos.')
    
    # Verifica se todos os dígitos são iguais
    if re.match(r'^(\d)\1+$', cpf):
        raise ValidationError('CPF inválido.')
    
    # Validação dos dígitos verificadores
    # Primeiro dígito
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma * 10) % 11
    if digito1 == 10:
        digito1 = 0
    if digito1 != int(cpf[9]):
        raise ValidationError('CPF inválido.')
    
    # Segundo dígito
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma * 10) % 11
    if digito2 == 10:
        digito2 = 0
    if digito2 != int(cpf[10]):
        raise ValidationError('CPF inválido.')


def validate_rnm(value):
    """Valida RNM (Registro Nacional Migratório)."""
    if not value:
        return
    
    if is_invalid_pattern(value):
        raise ValidationError('Valor inválido. Digite o RNM corretamente ou deixe em branco.')
    
    clean = remove_formatting(value).upper()
    
    # Formato correto: letra + 6-7 caracteres alfanuméricos
    if not re.match(r'^[A-Z][A-Z0-9]{6,7}$', clean):
        raise ValidationError('RNM deve ter formato: letra + 6-7 caracteres alfanuméricos (ex: V1234567 ou V123456A).')


def validate_passaporte(value):
    """Valida número de passaporte."""
    if not value:
        return
    
    if is_invalid_pattern(value):
        raise ValidationError('Valor inválido. Digite o passaporte corretamente ou deixe em branco.')
    
    clean = remove_formatting(value).upper()
    clean = re.sub(r'[^A-Z0-9]', '', clean)
    
    # Passaporte: 6-15 caracteres alfanuméricos
    if not re.match(r'^[A-Z0-9]{6,15}$', clean):
        raise ValidationError('Passaporte deve ter 6-15 caracteres alfanuméricos.')


def validate_ctps(value):
    """Valida CTPS (Carteira de Trabalho e Previdência Social)."""
    if not value:
        return
    
    if is_invalid_pattern(value):
        raise ValidationError('Valor inválido. Digite a CTPS corretamente ou deixe em branco.')
    
    clean = re.sub(r'\D', '', remove_formatting(value))
    
    # CTPS: 7-14 dígitos
    if len(clean) < 7 or len(clean) > 14:
        raise ValidationError('CTPS deve ter entre 7 e 14 dígitos.')


def validate_cnh(value):
    """Valida CNH (Carteira Nacional de Habilitação)."""
    if not value:
        return
    
    if is_invalid_pattern(value):
        raise ValidationError('Valor inválido. Digite a CNH corretamente ou deixe em branco.')
    
    clean = re.sub(r'\D', '', remove_formatting(value))
    
    # CNH: 11 dígitos
    if len(clean) != 11:
        raise ValidationError('CNH deve ter 11 dígitos.')
    
    # Verifica se todos os dígitos são iguais
    if re.match(r'^(\d)\1+$', clean):
        raise ValidationError('CNH inválida.')


def normalize_nome(value):
    """Normaliza nome: uppercase, remove caracteres especiais."""
    if not value:
        return value
    
    import unicodedata
    # Normaliza e remove acentos
    normalized = unicodedata.normalize('NFD', value)
    normalized = ''.join(c for c in normalized if not unicodedata.combining(c))
    # Uppercase, apenas letras e espaços
    normalized = re.sub(r'[^A-Za-z\s]', '', normalized).upper()
    # Remove espaços múltiplos
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized


def clean_document(value, doc_type='generic'):
    """Limpa formatação de documento para armazenamento."""
    if not value:
        return value
    
    clean = remove_formatting(value)
    
    if doc_type in ('cpf', 'ctps', 'cnh'):
        # Apenas dígitos
        return re.sub(r'\D', '', clean)
    elif doc_type in ('rnm', 'passaporte'):
        # Alfanumérico uppercase
        return re.sub(r'[^A-Z0-9]', '', clean.upper())
    
    return clean
