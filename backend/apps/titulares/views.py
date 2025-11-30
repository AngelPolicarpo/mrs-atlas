from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
import openpyxl
from io import BytesIO
from .models import Titular, VinculoTitular, Dependente
from .serializers import (
    TitularSerializer, TitularListSerializer, TitularCreateUpdateSerializer,
    VinculoTitularSerializer, DependenteSerializer
)
from apps.core.models import Nacionalidade, AmparoLegal


class TitularViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de titulares."""
    
    queryset = Titular.objects.select_related(
        'nacionalidade', 'criado_por', 'atualizado_por'
    ).prefetch_related('vinculos', 'dependentes')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['nacionalidade', 'sexo']
    search_fields = ['nome', 'rnm', 'cpf', 'passaporte', 'email']
    ordering_fields = ['nome', 'rnm', 'data_criacao', 'data_nascimento']
    ordering = ['nome']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TitularListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TitularCreateUpdateSerializer
        return TitularSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
    
    @action(detail=True, methods=['get'])
    def vinculos(self, request, pk=None):
        """Retorna todos os vínculos de um titular."""
        titular = self.get_object()
        vinculos = titular.vinculos.all()
        serializer = VinculoTitularSerializer(vinculos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def dependentes(self, request, pk=None):
        """Retorna todos os dependentes de um titular."""
        titular = self.get_object()
        dependentes = titular.dependentes.all()
        serializer = DependenteSerializer(dependentes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def importar(self, request):
        """Importa titulares de uma planilha Excel."""
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Arquivo não enviado'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            wb = openpyxl.load_workbook(BytesIO(file.read()))
            ws = wb.active
            
            # Pegar cabeçalhos da primeira linha
            headers = [cell.value.strip().lower() if cell.value else '' for cell in ws[1]]
            
            # Mapear colunas
            col_map = {}
            header_map = {
                'nome': 'nome',
                'nacionalidade': 'nacionalidade',
                'nascimento': 'data_nascimento',
                'mãe': 'mae',
                'mae': 'mae',
                'pai': 'pai',
                'rnm': 'rnm',
                'amparo': 'amparo',
                'prazo': 'data_fim_vinculo',
                'status': 'status',
            }
            
            for idx, header in enumerate(headers):
                if header in header_map:
                    col_map[header_map[header]] = idx
            
            # Cache de nacionalidades e amparos
            nacionalidades = {n.nome.lower(): n for n in Nacionalidade.objects.all()}
            amparos = {a.nome.lower(): a for a in AmparoLegal.objects.all()}
            
            titulares_criados = 0
            titulares_atualizados = 0
            erros = []
            
            with transaction.atomic():
                for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                    try:
                        # Extrair dados da linha
                        nome = row[col_map.get('nome', 0)] if col_map.get('nome') is not None else None
                        if not nome:
                            continue
                        
                        rnm = row[col_map.get('rnm')] if col_map.get('rnm') is not None else None
                        
                        # Buscar nacionalidade
                        nacionalidade = None
                        if col_map.get('nacionalidade') is not None:
                            nac_nome = row[col_map['nacionalidade']]
                            if nac_nome:
                                nacionalidade = nacionalidades.get(str(nac_nome).lower())
                        
                        # Buscar ou criar titular
                        titular = None
                        if rnm:
                            titular = Titular.objects.filter(rnm=rnm).first()
                        
                        if titular:
                            # Atualizar titular existente
                            titular.nome = nome
                            if nacionalidade:
                                titular.nacionalidade = nacionalidade
                            if col_map.get('data_nascimento') is not None:
                                data_nasc = row[col_map['data_nascimento']]
                                if data_nasc:
                                    titular.data_nascimento = data_nasc
                            if col_map.get('pai') is not None:
                                pai = row[col_map['pai']]
                                if pai:
                                    titular.pai = pai
                            if col_map.get('mae') is not None:
                                mae = row[col_map['mae']]
                                if mae:
                                    titular.mae = mae
                            titular.atualizado_por = request.user
                            titular.save()
                            titulares_atualizados += 1
                        else:
                            # Criar novo titular
                            titular_data = {
                                'nome': nome,
                                'rnm': rnm,
                                'nacionalidade': nacionalidade,
                                'criado_por': request.user,
                                'atualizado_por': request.user,
                            }
                            if col_map.get('data_nascimento') is not None:
                                data_nasc = row[col_map['data_nascimento']]
                                if data_nasc:
                                    titular_data['data_nascimento'] = data_nasc
                            if col_map.get('pai') is not None:
                                pai = row[col_map['pai']]
                                if pai:
                                    titular_data['pai'] = pai
                            if col_map.get('mae') is not None:
                                mae = row[col_map['mae']]
                                if mae:
                                    titular_data['mae'] = mae
                            
                            titular = Titular.objects.create(**titular_data)
                            titulares_criados += 1
                        
                        # Criar/Atualizar vínculo se houver amparo e prazo
                        if col_map.get('amparo') is not None and col_map.get('data_fim_vinculo') is not None:
                            amparo_nome = row[col_map['amparo']]
                            data_fim = row[col_map['data_fim_vinculo']]
                            status_val = row[col_map.get('status')] if col_map.get('status') is not None else 'Ativo'
                            
                            if amparo_nome and data_fim:
                                amparo = amparos.get(str(amparo_nome).lower())
                                vinculo_status = str(status_val).lower() in ['ativo', 'true', '1', 'sim'] if status_val else True
                                
                                # Verificar se já existe vínculo com mesmo amparo
                                vinculo_existente = VinculoTitular.objects.filter(
                                    titular=titular,
                                    amparo=amparo
                                ).first() if amparo else None
                                
                                if vinculo_existente:
                                    vinculo_existente.data_fim_vinculo = data_fim
                                    vinculo_existente.status = vinculo_status
                                    vinculo_existente.atualizado_por = request.user
                                    vinculo_existente.save()
                                elif amparo:
                                    VinculoTitular.objects.create(
                                        titular=titular,
                                        amparo=amparo,
                                        tipo_vinculo='AUTONOMO',
                                        data_fim_vinculo=data_fim,
                                        status=vinculo_status,
                                        criado_por=request.user,
                                        atualizado_por=request.user,
                                    )
                    
                    except Exception as e:
                        erros.append(f'Linha {row_num}: {str(e)}')
            
            return Response({
                'message': 'Importação concluída',
                'titulares_criados': titulares_criados,
                'titulares_atualizados': titulares_atualizados,
                'erros': erros[:10] if erros else []  # Limitar erros retornados
            })
            
        except Exception as e:
            return Response({'error': f'Erro ao processar arquivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class VinculoTitularViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de vínculos de titulares."""
    
    queryset = VinculoTitular.objects.select_related(
        'titular', 'empresa', 'amparo', 'consulado', 
        'tipo_atualizacao', 'criado_por', 'atualizado_por'
    )
    serializer_class = VinculoTitularSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['titular', 'tipo_vinculo', 'status', 'empresa']
    search_fields = ['titular__nome', 'titular__rnm', 'empresa__nome', 'observacoes']
    ordering_fields = ['data_criacao', 'data_entrada_pais', 'data_fim_vinculo']
    ordering = ['-data_criacao']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


class DependenteViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de dependentes."""
    
    queryset = Dependente.objects.select_related(
        'titular', 'nacionalidade', 'criado_por', 'atualizado_por'
    )
    serializer_class = DependenteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['titular', 'tipo_dependente', 'nacionalidade', 'sexo']
    search_fields = ['nome', 'rnm', 'passaporte', 'titular__nome']
    ordering_fields = ['nome', 'data_criacao', 'data_nascimento']
    ordering = ['nome']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, atualizado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)
