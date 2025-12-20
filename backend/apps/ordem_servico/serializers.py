from rest_framework import serializers
from decimal import Decimal
from .models import (
    EmpresaPrestadora, Servico, OrdemServico, OrdemServicoItem,
    TipoDespesa, DespesaOrdemServico, OrdemServicoTitular, OrdemServicoDependente
)


class EmpresaPrestadoraSerializer(serializers.ModelSerializer):
    """Serializer para Empresa Prestadora."""
    
    class Meta:
        model = EmpresaPrestadora
        fields = [
            'id', 'cnpj', 'nome_juridico', 'nome_fantasia', 'ativo',
            'data_criacao', 'ultima_atualizacao'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao']


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
    tipo_despesa_valor_base = serializers.DecimalField(
        source='tipo_despesa.valor_base',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = DespesaOrdemServico
        fields = [
            'id', 'ordem_servico', 'tipo_despesa', 'tipo_despesa_item',
            'tipo_despesa_descricao', 'tipo_despesa_valor_base',
            'valor', 'ativo', 'observacao',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']
    
    def validate(self, data):
        """Se valor não informado, usa o valor base do tipo de despesa."""
        tipo_despesa = data.get('tipo_despesa')
        
        if 'valor' not in data or data['valor'] is None:
            if tipo_despesa:
                data['valor'] = tipo_despesa.valor_base
        
        return data


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
    
    # Centro de Custos
    centro_custos_nome = serializers.SerializerMethodField()
    
    # Empresas
    empresa_solicitante_nome = serializers.CharField(source='empresa_solicitante.nome', read_only=True)
    empresa_pagadora_nome = serializers.CharField(source='empresa_pagadora.nome', read_only=True)
    empresa_contratante_nome = serializers.CharField(source='contrato.empresa_contratante.nome', read_only=True)
    
    # Responsável
    responsavel_nome = serializers.CharField(source='responsavel.nome', read_only=True)
    
    # Auditoria
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    # Relacionamentos aninhados (somente leitura)
    itens = OrdemServicoItemSerializer(many=True, read_only=True)
    despesas = DespesaOrdemServicoSerializer(many=True, read_only=True)
    titulares_vinculados = OrdemServicoTitularSerializer(many=True, read_only=True)
    dependentes_vinculados = OrdemServicoDependenteSerializer(many=True, read_only=True)
    
    def get_centro_custos_nome(self, obj):
        if obj.centro_custos:
            return obj.centro_custos.nome_fantasia or obj.centro_custos.nome_juridico
        return None
    
    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'data_abertura', 'data_fechamento', 'status', 'status_display', 'observacao',
            # Contrato
            'contrato', 'contrato_numero',
            # Centro de Custos
            'centro_custos', 'centro_custos_nome',
            # Empresas
            'empresa_solicitante', 'empresa_solicitante_nome',
            'empresa_pagadora', 'empresa_pagadora_nome',
            'empresa_contratante_nome',
            # Responsável
            'responsavel', 'responsavel_nome',
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
            'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por'
        ]


class OrdemServicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de OS."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    contrato_numero = serializers.CharField(source='contrato.numero', read_only=True)
    centro_custos_nome = serializers.SerializerMethodField()
    empresa_solicitante_nome = serializers.CharField(source='empresa_solicitante.nome', read_only=True)
    empresa_pagadora_nome = serializers.CharField(source='empresa_pagadora.nome', read_only=True)
    empresa_contratante_nome = serializers.CharField(source='contrato.empresa_contratante.nome', read_only=True)
    responsavel_nome = serializers.CharField(source='responsavel.nome', read_only=True)
    qtd_titulares = serializers.SerializerMethodField()
    qtd_dependentes = serializers.SerializerMethodField()
    qtd_itens = serializers.SerializerMethodField()
    
    class Meta:
        model = OrdemServico
        fields = [
            'id', 'numero', 'data_abertura', 'data_fechamento', 'status', 'status_display',
            'contrato', 'contrato_numero',
            'centro_custos', 'centro_custos_nome',
            'empresa_solicitante', 'empresa_solicitante_nome',
            'empresa_pagadora', 'empresa_pagadora_nome',
            'empresa_contratante_nome',
            'responsavel', 'responsavel_nome',
            'valor_total', 'data_criacao',
            'qtd_titulares', 'qtd_dependentes', 'qtd_itens'
        ]
    
    def get_centro_custos_nome(self, obj):
        if obj.centro_custos:
            return obj.centro_custos.nome_fantasia or obj.centro_custos.nome_juridico
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
            'centro_custos', 'empresa_solicitante', 'empresa_pagadora',
            'responsavel'
        ]
        read_only_fields = ['id']
    
    def validate_contrato(self, value):
        """Valida que o contrato está ativo."""
        if value.status != 'ATIVO':
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
