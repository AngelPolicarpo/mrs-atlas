from rest_framework import serializers
from decimal import Decimal
from .models import Contrato, ContratoServico
from apps.ordem_servico.serializers import ServicoListSerializer


class ContratoServicoSerializer(serializers.ModelSerializer):
    """Serializer para Serviços vinculados a um Contrato."""
    servico_item = serializers.CharField(source='servico.item', read_only=True)
    servico_descricao = serializers.CharField(source='servico.descricao', read_only=True)
    servico_valor_base = serializers.DecimalField(
        source='servico.valor_base',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    quantidade_executada = serializers.IntegerField(read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    
    class Meta:
        model = ContratoServico
        fields = [
            'id', 'contrato', 'servico', 'servico_item', 'servico_descricao',
            'servico_valor_base', 'valor', 
            'quantidade_executada', 'ativo',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = ['id', 'data_criacao', 'ultima_atualizacao', 'criado_por', 'atualizado_por']
    
    
    def validate(self, data):
        """Valida se o serviço já existe no contrato e preenchimento de valor."""
        contrato = data.get('contrato')
        servico = data.get('servico')
        
        # Se valor não for informado, usa o valor base do serviço
        if 'valor' not in data or data['valor'] is None:
            if servico:
                data['valor'] = servico.valor_base
        
        # Valida se o serviço já existe no contrato
        if contrato and servico:
            # Se estamos editando (self.instance existe), exclude o registro atual
            queryset = ContratoServico.objects.filter(contrato=contrato, servico=servico)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'servico': f'Este serviço já foi adicionado a este contrato.'
                })
        
        return data


class ContratoServicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de serviços do contrato."""
    servico_item = serializers.CharField(source='servico.item', read_only=True)
    servico_descricao = serializers.CharField(source='servico.descricao', read_only=True)
    quantidade_executada = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ContratoServico
        fields = [
            'id', 'servico', 'servico_item', 'servico_descricao',
            'valor',
            'quantidade_executada', 'ativo'
        ]
    


class ContratoSerializer(serializers.ModelSerializer):
    """Serializer completo para Contrato."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    empresa_contratante_nome = serializers.CharField(source='empresa_contratante.nome', read_only=True)
    empresa_contratada_nome = serializers.CharField(source='empresa_contratada.nome_fantasia', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    atualizado_por_nome = serializers.CharField(source='atualizado_por.nome', read_only=True)
    esta_ativo = serializers.BooleanField(read_only=True)
    valor_total_servicos = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    
    # Relacionamentos
    servicos_contratados = ContratoServicoListSerializer(many=True, read_only=True)
    qtd_ordens_servico = serializers.SerializerMethodField()
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'tipo', 'numero', 'status', 'status_display',
            'empresa_contratante', 'empresa_contratante_nome',
            'empresa_contratada', 'empresa_contratada_nome',
            'prazo_faturamento',
            'data_inicio', 'data_fim', 'observacao',
            'esta_ativo', 'valor_total_servicos',
            'servicos_contratados', 'qtd_ordens_servico',
            'data_criacao', 'ultima_atualizacao',
            'criado_por', 'criado_por_nome', 'atualizado_por', 'atualizado_por_nome'
        ]
        read_only_fields = [
            'id', 'data_criacao', 'ultima_atualizacao',
            'criado_por', 'atualizado_por'
        ]
    
    def get_qtd_ordens_servico(self, obj):
        return obj.ordens_servico.count()


class ContratoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Contratos."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    empresa_contratante_nome = serializers.CharField(source='empresa_contratante.nome', read_only=True)
    empresa_contratada_nome = serializers.CharField(source='empresa_contratada.nome_fantasia', read_only=True)
    esta_ativo = serializers.BooleanField(read_only=True)
    valor_total_servicos = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    qtd_servicos = serializers.SerializerMethodField()
    qtd_ordens_servico = serializers.SerializerMethodField()
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'tipo', 'numero', 'status', 'status_display',
            'empresa_contratante', 'empresa_contratante_nome',
            'empresa_contratada', 'empresa_contratada_nome',
            'prazo_faturamento',
            'data_inicio', 'data_fim', 'esta_ativo',
            'valor_total_servicos', 'qtd_servicos', 'qtd_ordens_servico',
            'data_criacao'
        ]
    
    def get_qtd_servicos(self, obj):
        return obj.servicos_contratados.filter(ativo=True).count()
    
    def get_qtd_ordens_servico(self, obj):
        return obj.ordens_servico.count()


class ContratoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de Contrato."""
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'tipo', 'numero', 'status', 'empresa_contratante', 'empresa_contratada',
            'prazo_faturamento', 'data_inicio', 'data_fim', 'observacao'
        ]
        read_only_fields = ['id']
    
    def validate_numero(self, value):
        """Valida unicidade do número do contrato."""
        if not value:
            return value
        
        # Verifica unicidade (excluindo o registro atual em caso de update)
        queryset = Contrato.objects.filter(numero=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Já existe um contrato com este número.')
        
        return value
    
    def validate_status(self, value):
        """Valida transições de status."""
        instance = self.instance
        if instance and instance.status == 'CANCELADO' and value != 'CANCELADO':
            raise serializers.ValidationError('Não é possível alterar o status de um contrato cancelado.')
        return value
    
    def validate(self, data):
        """Validação geral do contrato."""
        # Tipo e número
        tipo = data.get('tipo', self.instance.tipo if self.instance else 'CONTRATO')
        numero = data.get('numero', self.instance.numero if self.instance else None)
        
        # Se for CONTRATO, número é obrigatório
        if tipo == 'CONTRATO' and not numero:
            raise serializers.ValidationError({
                'numero': 'Número é obrigatório para contratos.'
            })
        
        # Validação de datas
        data_inicio = data.get('data_inicio', self.instance.data_inicio if self.instance else None)
        data_fim = data.get('data_fim', self.instance.data_fim if self.instance else None)
        
        if data_inicio and data_fim and data_fim < data_inicio:
            raise serializers.ValidationError({
                'data_fim': 'A data de término não pode ser anterior à data de início.'
            })
        
        return data
