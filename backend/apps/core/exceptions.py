"""
Tratamento de Exceções Padronizado do Atlas.

Este módulo fornece:
1. Exception handler customizado para DRF
2. Respostas de erro padronizadas
3. Mensagens em português
4. Códigos de erro consistentes

Uso no settings.py:
    REST_FRAMEWORK = {
        'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    }
"""

from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
    NotFound,
    MethodNotAllowed,
    Throttled,
)
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404


# =============================================================================
# MENSAGENS DE ERRO PADRONIZADAS
# =============================================================================

ERROR_MESSAGES = {
    # Autenticação (401)
    'not_authenticated': 'Você precisa estar autenticado para acessar este recurso.',
    'authentication_failed': 'Credenciais inválidas ou expiradas.',
    'token_expired': 'Sua sessão expirou. Por favor, faça login novamente.',
    'token_invalid': 'Token de autenticação inválido.',
    
    # Autorização (403)
    'permission_denied': 'Você não tem permissão para realizar esta ação.',
    'permission_denied_view': 'Você não tem permissão para visualizar este recurso.',
    'permission_denied_add': 'Você não tem permissão para criar novos registros.',
    'permission_denied_change': 'Você não tem permissão para editar este registro.',
    'permission_denied_delete': 'Você não tem permissão para excluir este registro.',
    'permission_denied_export': 'Você não tem permissão para exportar dados.',
    'account_inactive': 'Sua conta está desativada. Entre em contato com o administrador.',
    
    # Não encontrado (404)
    'not_found': 'O recurso solicitado não foi encontrado.',
    
    # Validação (400)
    'validation_error': 'Os dados enviados são inválidos.',
    'bad_request': 'Requisição inválida.',
    
    # Método não permitido (405)
    'method_not_allowed': 'Método HTTP não permitido para este recurso.',
    
    # Rate limiting (429)
    'throttled': 'Muitas requisições. Por favor, aguarde antes de tentar novamente.',
    
    # Erro interno (500)
    'server_error': 'Erro interno do servidor. Tente novamente mais tarde.',
}


# =============================================================================
# CÓDIGOS DE ERRO
# =============================================================================

ERROR_CODES = {
    'not_authenticated': 'AUTH_REQUIRED',
    'authentication_failed': 'AUTH_FAILED',
    'token_expired': 'TOKEN_EXPIRED',
    'token_invalid': 'TOKEN_INVALID',
    'permission_denied': 'FORBIDDEN',
    'permission_denied_view': 'FORBIDDEN_VIEW',
    'permission_denied_add': 'FORBIDDEN_ADD',
    'permission_denied_change': 'FORBIDDEN_CHANGE',
    'permission_denied_delete': 'FORBIDDEN_DELETE',
    'permission_denied_export': 'FORBIDDEN_EXPORT',
    'account_inactive': 'ACCOUNT_INACTIVE',
    'not_found': 'NOT_FOUND',
    'validation_error': 'VALIDATION_ERROR',
    'bad_request': 'BAD_REQUEST',
    'method_not_allowed': 'METHOD_NOT_ALLOWED',
    'throttled': 'RATE_LIMITED',
    'server_error': 'SERVER_ERROR',
}


# =============================================================================
# FORMATO DE RESPOSTA PADRONIZADO
# =============================================================================

def format_error_response(message, code=None, details=None, field_errors=None):
    """
    Formata uma resposta de erro padronizada.
    
    Formato:
    {
        "error": {
            "message": "Mensagem legível",
            "code": "CODIGO_ERRO",
            "details": {...},  // Opcional
            "fields": {...}    // Opcional, para erros de validação
        }
    }
    """
    error = {
        'message': message,
    }
    
    if code:
        error['code'] = code
    
    if details:
        error['details'] = details
    
    if field_errors:
        error['fields'] = field_errors
    
    return {'error': error}


def format_validation_errors(errors):
    """
    Formata erros de validação do DRF em formato legível.
    
    Entrada: {"campo": ["erro1", "erro2"]}
    Saída: {"campo": "erro1"}
    """
    if isinstance(errors, dict):
        formatted = {}
        for field, messages in errors.items():
            if isinstance(messages, list) and messages:
                formatted[field] = messages[0]
            elif isinstance(messages, str):
                formatted[field] = messages
            else:
                formatted[field] = str(messages)
        return formatted
    return errors


# =============================================================================
# EXCEPTION HANDLER CUSTOMIZADO
# =============================================================================

def custom_exception_handler(exc, context):
    """
    Handler de exceções customizado para padronizar respostas de erro.
    
    Garante:
    - Mensagens em português
    - Formato consistente
    - Códigos de erro úteis
    - Não expõe detalhes internos
    """
    # Chama o handler padrão primeiro
    response = exception_handler(exc, context)
    
    # Se o DRF não tratou, verifica outros casos
    if response is None:
        if isinstance(exc, Http404) or isinstance(exc, ObjectDoesNotExist):
            response = Response(
                format_error_response(
                    ERROR_MESSAGES['not_found'],
                    ERROR_CODES['not_found']
                ),
                status=status.HTTP_404_NOT_FOUND
            )
        else:
            # Erro não tratado - log e resposta genérica
            import logging
            logger = logging.getLogger(__name__)
            logger.exception('Erro não tratado: %s', exc)
            
            response = Response(
                format_error_response(
                    ERROR_MESSAGES['server_error'],
                    ERROR_CODES['server_error']
                ),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        return response
    
    # Personaliza respostas baseado no tipo de exceção
    if isinstance(exc, NotAuthenticated):
        response.data = format_error_response(
            ERROR_MESSAGES['not_authenticated'],
            ERROR_CODES['not_authenticated']
        )
    
    elif isinstance(exc, AuthenticationFailed):
        # Verificar se é token expirado
        detail = str(getattr(exc, 'detail', ''))
        if 'expired' in detail.lower():
            response.data = format_error_response(
                ERROR_MESSAGES['token_expired'],
                ERROR_CODES['token_expired']
            )
        elif 'invalid' in detail.lower():
            response.data = format_error_response(
                ERROR_MESSAGES['token_invalid'],
                ERROR_CODES['token_invalid']
            )
        else:
            response.data = format_error_response(
                ERROR_MESSAGES['authentication_failed'],
                ERROR_CODES['authentication_failed']
            )
    
    elif isinstance(exc, PermissionDenied):
        # Tentar identificar o tipo de permissão negada
        detail = str(getattr(exc, 'detail', ''))
        code_suffix = ''
        message_key = 'permission_denied'
        
        if 'visualizar' in detail.lower() or 'view' in detail.lower():
            code_suffix = '_view'
            message_key = 'permission_denied_view'
        elif 'criar' in detail.lower() or 'add' in detail.lower():
            code_suffix = '_add'
            message_key = 'permission_denied_add'
        elif 'editar' in detail.lower() or 'change' in detail.lower():
            code_suffix = '_change'
            message_key = 'permission_denied_change'
        elif 'excluir' in detail.lower() or 'delete' in detail.lower():
            code_suffix = '_delete'
            message_key = 'permission_denied_delete'
        elif 'exportar' in detail.lower() or 'export' in detail.lower():
            code_suffix = '_export'
            message_key = 'permission_denied_export'
        elif 'desativad' in detail.lower() or 'inactive' in detail.lower():
            message_key = 'account_inactive'
            code_suffix = ''
        
        # Usar a mensagem customizada se houver, senão a padrão
        message = ERROR_MESSAGES.get(message_key, detail) if detail else ERROR_MESSAGES[message_key]
        
        # Se a mensagem do backend já está em português, usar ela
        if any(word in detail.lower() for word in ['você', 'permissão', 'recurso', 'registro']):
            message = detail
        
        response.data = format_error_response(
            message,
            ERROR_CODES.get(message_key, 'FORBIDDEN')
        )
    
    elif isinstance(exc, ValidationError):
        field_errors = format_validation_errors(exc.detail)
        response.data = format_error_response(
            ERROR_MESSAGES['validation_error'],
            ERROR_CODES['validation_error'],
            field_errors=field_errors
        )
    
    elif isinstance(exc, NotFound):
        response.data = format_error_response(
            ERROR_MESSAGES['not_found'],
            ERROR_CODES['not_found']
        )
    
    elif isinstance(exc, MethodNotAllowed):
        response.data = format_error_response(
            ERROR_MESSAGES['method_not_allowed'],
            ERROR_CODES['method_not_allowed']
        )
    
    elif isinstance(exc, Throttled):
        wait_time = getattr(exc, 'wait', None)
        message = ERROR_MESSAGES['throttled']
        if wait_time:
            message = f'{message} Aguarde {int(wait_time)} segundos.'
        response.data = format_error_response(
            message,
            ERROR_CODES['throttled'],
            details={'wait_seconds': wait_time} if wait_time else None
        )
    
    return response


# =============================================================================
# EXCEÇÕES CUSTOMIZADAS
# =============================================================================

class AtlasPermissionDenied(PermissionDenied):
    """
    Exceção de permissão negada com suporte a ação específica.
    
    Uso:
        raise AtlasPermissionDenied(action='delete')
    """
    
    def __init__(self, action=None, detail=None):
        if detail is None and action:
            message_key = f'permission_denied_{action}'
            detail = ERROR_MESSAGES.get(message_key, ERROR_MESSAGES['permission_denied'])
        elif detail is None:
            detail = ERROR_MESSAGES['permission_denied']
        
        super().__init__(detail=detail)
        self.action = action


class AccountInactive(PermissionDenied):
    """Exceção para conta desativada."""
    default_detail = ERROR_MESSAGES['account_inactive']
    default_code = ERROR_CODES['account_inactive']
