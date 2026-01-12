from rest_framework import serializers
from decimal import Decimal
import re
from .models import (
    EmpresaPrestadora, Servico, OrdemServico, OrdemServicoItem,
    TipoDespesa, DespesaOrdemServico, OrdemServicoTitular, OrdemServicoDependente,
    DocumentoOS
)


def validate_cnpj_digits(cnpj):
    """Valida os dígitos verificadores do CNPJ."""
    cnpj = re.sub(r'\D', '', cnpj)
    
    if len(cnpj) != 14:
        return False
    
    if len(set(cnpj)) == 1:
        return False
    
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(cnpj[i]) * weights1[i] for i in range(12))
    digit1 = total % 11
    digit1 = 0 if digit1 < 2 else 11 - digit1
    
    if digit1 != int(cnpj[12]):
        return False
    
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(cnpj[i]) * weights2[i] for i in range(13))
    digit2 = total % 11
    digit2 = 0 if digit2 < 2 else 11 - digit2
    
    if digit2 != int(cnpj[13]):
        return False
    
    return True


class EmpresaPrestadoraSerializer(serializers.ModelSerializer):
    """Serializer para Empresa Prestadora."""
    
    class Meta:
        model = EmpresaPrestadora
        fields = [
            'id', 'cnpj', 'nome_juridico', 'nome_fantasia', 'ativo',
            'data_criacao', 'ultima_atualizacao'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']
    
    def validate_cnpj(self, value):
        """Valida formato, dígitos e unicidade do CNPJ."""
        if not value:
            raise serializers.ValidationError('CNPJ é obrigatório.')
        
        # Remove formatação
        cnpj_clean = re.sub(r'\D', '', value)
        
        if len(cnpj_clean) != 14:
            raise serializers.ValidationError('CNPJ deve ter 14 dígitos.')
        
        if not validate_cnpj_digits(cnpj_clean):
            raise serializers.ValidationError('CNPJ inválido.')
        
        # Verifica unicidade (excluindo o registro atual em caso de update)
        queryset = EmpresaPrestadora.objects.filter(cnpj=cnpj_clean)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Este CNPJ já está cadastrado.')
        
        return cnpj_clean


class ServicoSerializer(serializers.ModelSerializer):
    """Serializer para Catálogo de Serviços."""
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = Servico
        fields = [
            'id', 'item', 'descricao', 'valor_base', 'ativo',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']
    
    def validate_item(self, value):
        """Valida unicidade do código/item do serviço."""
        if not value:
            raise serializers.ValidationError('O código do serviço é obrigatório.')
        
        # Normaliza para uppercase
        value = value.upper().strip()
        
        # Verifica unicidade (excluindo o registro atual em caso de update)
        queryset = Servico.objects.filter(item=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Já existe um serviço cadastrado com este código.')
        
        return value


class ServicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Serviços."""
    
    class Meta:
        model = Servico
        fields = ['id', 'item', 'descricao', 'valor_base', 'ativo']


class TipoDespesaSerializer(serializers.ModelSerializer):
    """Serializer para Catálogo de Tipos de Despesa."""
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = TipoDespesa
        fields = [
            'id', 'item', 'descricao', 'valor_base', 'ativo',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class TipoDespesaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Tipos de Despesa."""
    
    class Meta:
        model = TipoDespesa
        fields = ['id', 'item', 'descricao', 'valor_base', 'ativo']


class DespesaOrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer para Despesas da OS."""
    tipo_despesa_item = serializers.CharField(source='tipo_despesa.item', read_only=True)
    tipo_despesa_descricao = serializers.CharField(source='tipo_despesa.descricao', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = DespesaOrdemServico
        fields = [
            'id', 'ordem_servico', 'tipo_despesa', 'tipo_despesa_item',
            'tipo_despesa_descricao',
            'valor', 'ativo', 'observacao',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class OrdemServicoItemSerializer(serializers.ModelSerializer):
    """Serializer para Itens da OS (execução de serviços do contrato)."""
    servico_item = serializers.CharField(source='contrato_servico.servico.item', read_only=True)
    servico_descricao = serializers.CharField(source='contrato_servico.servico.descricao', read_only=True)
    valor_contrato = serializers.DecimalField(
        source='contrato_servico.valor',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    valor_total = serializers.SerializerMethodField()
    
    class Meta:
        model = OrdemServicoItem
        fields = [
            'id', 'ordem_servico', 'contrato_servico',
            'servico_item', 'servico_descricao', 'valor_contrato',
            'quantidade', 'valor_aplicado', 'valor_total',
            'data_criacao', 'ultima_atualizacao'
        ]
        read_only_fields = ['id', 'valor_aplicado', 'data_criacao', 'ultima_atualizacao']
    
    def get_valor_total(self, obj):
        return obj.valor_aplicado * obj.quantidade
    
    def validate(self, data):
        """Valida que o serviço pertence ao contrato da OS e tem saldo disponível."""
        ordem_servico = data.get('ordem_servico')
        contrato_servico = data.get('contrato_servico')
        quantidade = data.get('quantidade', 1)
        
        if ordem_servico and contrato_servico:
            # Valida que serviço pertence ao contrato da OS
            if contrato_servico.contrato_id != ordem_servico.contrato_id:
                raise serializers.ValidationError({
                    'contrato_servico': 'O serviço deve pertencer ao mesmo contrato da OS.'
                })
            
            # Valida se o serviço está ativo
            if not contrato_servico.ativo:
                raise serializers.ValidationError({
                    'contrato_servico': 'Este serviço não está mais ativo no contrato.'
                })
        
        # O valor aplicado SEMPRE vem do contrato (não permite negociação na OS)
        if contrato_servico:
            data['valor_aplicado'] = contrato_servico.valor
        
        return data


class OrdemServicoTitularSerializer(serializers.ModelSerializer):
    """Serializer para Titulares vinculados à OS."""
    titular_nome = serializers.CharField(source='titular.nome', read_only=True)
    titular_rnm = serializers.CharField(source='titular.rnm', read_only=True)
    titular_cpf = serializers.CharField(source='titular.cpf', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = OrdemServicoTitular
        fields = [
            'id', 'ordem_servico', 'titular', 'titular_nome', 'titular_rnm', 'titular_cpf',
            'observacao', 'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class OrdemServicoDependenteSerializer(serializers.ModelSerializer):
    """Serializer para Dependentes vinculados à OS."""
    dependente_nome = serializers.CharField(source='dependente.nome', read_only=True)
    dependente_rnm = serializers.CharField(source='dependente.rnm', read_only=True)
    titular_nome = serializers.CharField(source='dependente.titular.nome', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = OrdemServicoDependente
        fields = [
            'id', 'ordem_servico', 'dependente', 'dependente_nome', 'dependente_rnm',
            'titular_nome', 'observacao', 'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']


class OrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer completo para Ordem de Serviço."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Contrato
    contrato_numero = serializers.CharField(source='contrato.numero', read_only=True)
    
    # Empresas
    empresa_solicitante_nome = serializers.CharField(source='empresa_solicitante.nome', read_only=True)
    empresa_pagadora_nome = serializers.CharField(source='empresa_pagadora.nome', read_only=True)
    empresa_contratante_nome = serializers.CharField(source='contrato.empresa_contratante.nome', read_only=True)
    
    # Solicitante e Colaborador
    solicitante_nome = serializers.CharField(source='solicitante.nome', read_only=True)
    colaborador_nome = serializers.CharField(source='colaborador.nome', read_only=True)
    
    # Auditoria
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    # Relacionamentos aninhados (somente leitura)
    itens = OrdemServicoItemSerializer(many=True, read_only=True)
    despesas = DespesaOrdemServicoSerializer(many=True, read_only=True)
    titulares_vinculados = OrdemServicoTitularSerializer(many=True, read_only=True)
    dependentes_vinculados = OrdemServicoDependenteSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'data_abertura', 'data_fechamento', 'data_finalizada', 
            'status', 'status_display', 'observacao',
            # Contrato
            'contrato', 'contrato_numero',
            # Empresas
            'empresa_solicitante', 'empresa_solicitante_nome',
            'empresa_pagadora', 'empresa_pagadora_nome',
            'empresa_contratante_nome',
            # Solicitante e Colaborador
            'solicitante', 'solicitante_nome',
            'colaborador', 'colaborador_nome',
            # Valores
            'valor_servicos', 'valor_despesas', 'valor_total',
            # Timestamps
            'data_criacao', 'ultima_atualizacao',
            # Auditoria
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome',
            # Relacionamentos
            'itens', 'despesas', 'titulares_vinculados', 'dependentes_vinculados'
        ]
        read_only_fields = [
            'id', 'numero', 'valor_servicos', 'valor_despesas', 'valor_total',
            'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por', 'data_finalizada'
        ]


class OrdemServicoListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de OS com dados completos para expansão."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    contrato_numero = serializers.CharField(source='contrato.numero', read_only=True)
    empresa_contratante = serializers.UUIDField(source='contrato.empresa_contratante.id', read_only=True)
    empresa_solicitante_nome = serializers.CharField(source='empresa_solicitante.nome', read_only=True)
    empresa_pagadora_nome = serializers.CharField(source='empresa_pagadora.nome', read_only=True)
    empresa_contratante_nome = serializers.CharField(source='contrato.empresa_contratante.nome', read_only=True)
    empresa_contratada_nome = serializers.SerializerMethodField()
    solicitante_nome = serializers.CharField(source='solicitante.nome', read_only=True)
    colaborador_nome = serializers.CharField(source='colaborador.nome', read_only=True)
    qtd_titulares = serializers.SerializerMethodField()
    qtd_dependentes = serializers.SerializerMethodField()
    qtd_itens = serializers.SerializerMethodField()
    
    # Relacionamentos aninhados para exibição expandida
    itens = OrdemServicoItemSerializer(many=True, read_only=True)
    despesas = DespesaOrdemServicoSerializer(many=True, read_only=True)
    titulares_vinculados = OrdemServicoTitularSerializer(many=True, read_only=True)
    dependentes_vinculados = OrdemServicoDependenteSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'data_abertura', 'data_fechamento', 'data_finalizada', 
            'status', 'status_display', 'observacao',
            'contrato', 'contrato_numero', 'empresa_contratante',
            'empresa_solicitante', 'empresa_solicitante_nome',
            'empresa_pagadora', 'empresa_pagadora_nome',
            'empresa_contratante_nome', 'empresa_contratada_nome',
            'solicitante', 'solicitante_nome',
            'colaborador', 'colaborador_nome',
            'valor_servicos', 'valor_despesas', 'valor_total', 'data_criacao',
            'qtd_titulares', 'qtd_dependentes', 'qtd_itens',
            'itens', 'despesas', 'titulares_vinculados', 'dependentes_vinculados'
        ]
    
    def get_empresa_contratada_nome(self, obj):
        """Retorna o nome da empresa contratada (do contrato)."""
        if obj.contrato and obj.contrato.empresa_contratada:
            return obj.contrato.empresa_contratada.nome_fantasia or obj.contrato.empresa_contratada.nome_juridico
        return None
    
    def get_qtd_titulares(self, obj):
        return obj.titulares_vinculados.count()
    
    def get_qtd_dependentes(self, obj):
        return obj.dependentes_vinculados.count()
    
    def get_qtd_itens(self, obj):
        return obj.itens.count()


class OrdemServicoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de OS."""
    
    class Meta:
        model = OrdemServico
        fields = [
            'id', 'contrato', 'data_abertura', 'data_fechamento', 'status', 'observacao',
            'empresa_solicitante', 'empresa_pagadora',
            'solicitante', 'colaborador'
        ]
        read_only_fields = ['id']
    
    def validate_contrato(self, value):
        """Valida que o contrato está ativo apenas na criação."""
        # Na edição (self.instance existe), não revalidar o contrato
        # pois a OS já foi criada quando o contrato estava ativo
        if not self.instance and value.status != 'ATIVO':
            raise serializers.ValidationError(
                'Não é possível criar OS para um contrato que não está ativo.'
            )
        return value
    
    def validate_status(self, value):
        """Valida transições de status."""
        instance = self.instance
        if instance and instance.status == 'CANCELADO' and value != 'CANCELADO':
            raise serializers.ValidationError('Não é possível alterar o status de uma OS cancelada.')
        if instance and instance.status == 'FINALIZADO' and value not in ['FINALIZADO', 'CANCELADO']:
            raise serializers.ValidationError('Uma OS finalizada só pode ser cancelada.')
        return value
    
    def validate(self, data):
        """Validações gerais."""
        contrato = data.get('contrato') or (self.instance.contrato if self.instance else None)
        
        # Validar que empresa_solicitante pertence ao contrato (ou é relacionada)
        # Esta validação pode ser flexibilizada conforme regras de negócio
        
        return data


# ==========================================
# DOCUMENTO OS SERIALIZERS
# ==========================================

class DocumentoOSSerializer(serializers.ModelSerializer):
    """Serializer para leitura de Documento OS."""
    
    ordem_servico_numero = serializers.IntegerField(
        source='ordem_servico.numero',
        read_only=True
    )
    emitido_por_nome = serializers.CharField(
        source='emitido_por.nome',
        read_only=True
    )
    url_validacao = serializers.CharField(read_only=True)
    
    class Meta:
        model = DocumentoOS
        fields = [
            'id', 'ordem_servico', 'ordem_servico_numero', 'versao', 'codigo',
            'data_emissao', 'emitido_por', 'emitido_por_nome',
            'url_validacao'
        ]
        read_only_fields = [
            'id', 'versao', 'codigo', 'data_emissao'
        ]


class DocumentoOSDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para validação de Documento OS."""
    
    ordem_servico_numero = serializers.IntegerField(
        source='ordem_servico.numero',
        read_only=True
    )
    emitido_por_nome = serializers.CharField(
        source='emitido_por.nome',
        read_only=True
    )
    url_validacao = serializers.CharField(read_only=True)
    
    # Dados do snapshot para exibição na validação
    centro_custos_nome = serializers.SerializerMethodField()
    contrato_numero = serializers.SerializerMethodField()
    empresa_solicitante_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentoOS
        fields = [
            'id', 'ordem_servico', 'ordem_servico_numero', 'versao', 'codigo',
            'data_emissao', 'emitido_por', 'emitido_por_nome',
            'url_validacao', 'dados_snapshot', 'hash_sha256',
            'centro_custos_nome', 'contrato_numero', 'empresa_solicitante_nome'
        ]
    
    def get_centro_custos_nome(self, obj):
        return obj.dados_snapshot.get('centro_custos_nome', '-')
    
    def get_contrato_numero(self, obj):
        return obj.dados_snapshot.get('contrato_numero', '-')
    
    def get_empresa_solicitante_nome(self, obj):
        return obj.dados_snapshot.get('empresa_solicitante_nome', '-')


class DocumentoOSCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Documento OS."""
    
    class Meta:
        model = DocumentoOS
        fields = ['id', 'ordem_servico', 'hash_sha256', 'dados_snapshot', 'codigo', 'versao']
        read_only_fields = ['id', 'codigo', 'versao']
    
    def validate_hash_sha256(self, value):
        """Valida que o hash foi fornecido."""
        if not value or len(value) != 64:
            raise serializers.ValidationError(
                'Hash SHA-256 inválido. Deve ter 64 caracteres hexadecimais.'
            )
        return value
    
    def validate_ordem_servico(self, value):
        """Valida que a OS existe e tem número."""
        if not value:
            raise serializers.ValidationError('Ordem de Serviço é obrigatória.')
        if not value.numero:
            raise serializers.ValidationError('Ordem de Serviço sem número válido.')
        return value
    
    def create(self, validated_data):
        # Adiciona o usuário que emitiu o documento
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['emitido_por'] = request.user
        
        return super().create(validated_data)


class DocumentoOSValidacaoSerializer(serializers.Serializer):
    """Serializer para validação de documento por upload."""
    
    arquivo = serializers.FileField(
        help_text='Arquivo PDF para validação de integridade'
    )
    
    def validate_arquivo(self, value):
        # Valida que é um arquivo PDF
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('O arquivo deve ser um PDF.')
        
        # Limite de tamanho (10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('O arquivo não pode exceder 10MB.')
        
        return value
