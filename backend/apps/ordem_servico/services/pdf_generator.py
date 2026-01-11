"""
Serviço de geração de PDF para Ordens de Serviço.
Gera PDFs no formato de Orçamento de Serviços com rastreabilidade completa.

Layout: A4 com margens ABNT (3cm topo/esquerda, 2cm rodapé/direita)
Inclui: QR Code para validação, hash SHA-256, código de documento
Suporta múltiplas páginas com cabeçalho/rodapé desenhados via onPage callback
"""

import io
import hashlib
import os
from decimal import Decimal
from datetime import datetime
from io import BytesIO

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Table, TableStyle,
    Paragraph, Spacer, Image, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.utils import ImageReader
from django.conf import settings


# =============================================================================
# CONSTANTES DE LAYOUT - MARGENS ABNT
# =============================================================================
PAGE_WIDTH, PAGE_HEIGHT = A4  # 210mm x 297mm

# Margens ABNT
MARGIN_TOP = 30 * mm      # 3 cm
MARGIN_BOTTOM = 20 * mm   # 2 cm
MARGIN_LEFT = 30 * mm     # 3 cm
MARGIN_RIGHT = 20 * mm    # 2 cm

# Áreas fixas para header e footer (dentro das margens)
HEADER_HEIGHT = 18 * mm   # Altura do cabeçalho
FOOTER_HEIGHT = 25 * mm   # Altura do rodapé (inclui QR code)

# Área útil para conteúdo
CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
CONTENT_TOP = PAGE_HEIGHT - MARGIN_TOP - HEADER_HEIGHT  # Onde o conteúdo começa
CONTENT_BOTTOM = MARGIN_BOTTOM + FOOTER_HEIGHT          # Onde o conteúdo termina
CONTENT_HEIGHT = CONTENT_TOP - CONTENT_BOTTOM           # Altura disponível

# =============================================================================
# CORES
# =============================================================================
COLOR_BLACK = colors.black
COLOR_DARK_GRAY = colors.Color(51/255, 51/255, 51/255)
COLOR_MEDIUM_GRAY = colors.Color(102/255, 102/255, 102/255)
COLOR_LIGHT_GRAY = colors.Color(153/255, 153/255, 153/255)
COLOR_BG_GRAY = colors.Color(245/255, 245/255, 245/255)
COLOR_LINE_GRAY = colors.Color(200/255, 200/255, 200/255)


# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================
def format_date(date_obj):
    """Formata data para exibição pt-BR (DD/MM/YYYY)."""
    if not date_obj:
        return '-'
    if isinstance(date_obj, str):
        try:
            date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
        except:
            return date_obj
    return date_obj.strftime('%d/%m/%Y')


def format_datetime(dt):
    """Formata data e hora para pt-BR (DD/MM/YYYY HH:mm)."""
    if not dt:
        return '-'
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except:
            return dt
    return dt.strftime('%d/%m/%Y %H:%M')


def format_currency(value):
    """Formata valor monetário em BRL."""
    if value is None:
        return 'R$ 0,00'
    try:
        value = Decimal(str(value))
        return f"R$ {value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    except:
        return 'R$ 0,00'


def get_status_display(status):
    """Converte status interno para exibição."""
    status_map = {
        'ABERTA': 'EM ANDAMENTO',
        'FINALIZADO': 'FINALIZADO',
        'FINALIZADA': 'FINALIZADA',
        'CANCELADO': 'CANCELADO',
        'CANCELADA': 'CANCELADA'
    }
    return status_map.get(status, status)


def format_os_number(numero):
    """Formata número da OS com zeros à esquerda."""
    if not numero:
        return '000000'
    return str(numero).zfill(6)


def generate_qr_code_image(data: str) -> BytesIO:
    """Gera QR Code como imagem em memória."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer


def get_logo_path():
    """Retorna o caminho do logo."""
    return os.path.join(settings.BASE_DIR, 'static', 'img', 'logo.png')


# =============================================================================
# CALLBACKS DE PÁGINA (HEADER/FOOTER)
# =============================================================================
class PageInfo:
    """Container para informações que serão usadas no header/footer."""
    def __init__(self):
        self.os_numero = ''
        self.codigo_documento = ''
        self.url_validacao = ''
        self.logo_path = ''
        self.is_first_page = True


def draw_header(canvas, doc, page_info):
    """
    Desenha o cabeçalho na área reservada (logo + título).
    Chamado em TODAS as páginas.
    
    Área do header: de (PAGE_HEIGHT - MARGIN_TOP) até (PAGE_HEIGHT - MARGIN_TOP - HEADER_HEIGHT)
    """
    canvas.saveState()
    
    # Coordenadas do header
    header_top = PAGE_HEIGHT - MARGIN_TOP
    header_bottom = header_top - HEADER_HEIGHT
    
    # Logo à esquerda
    logo_path = page_info.logo_path
    if logo_path and os.path.exists(logo_path):
        logo_size = 12 * mm
        logo_x = MARGIN_LEFT
        logo_y = header_top - logo_size  # Alinha ao topo do header
        try:
            canvas.drawImage(logo_path, logo_x, logo_y, 
                           width=logo_size, height=logo_size, 
                           preserveAspectRatio=True, mask='auto')
        except:
            pass
    
    # Título à direita
    title_x = PAGE_WIDTH - MARGIN_RIGHT
    title_y = header_top - 5 * mm
    
    canvas.setFont('Helvetica-Bold', 11)
    canvas.setFillColor(COLOR_BLACK)
    canvas.drawRightString(title_x, title_y, "ORDEM DE SERVIÇOS")
    
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(COLOR_DARK_GRAY)
    canvas.drawRightString(title_x, title_y - 4 * mm, f"nº {format_os_number(page_info.os_numero)}")
    
    # Linha separadora no final do header (com espaço extra)
    line_y = header_bottom + 3 * mm  # Adiciona 3mm de espaço
    canvas.setStrokeColor(COLOR_LINE_GRAY)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_LEFT, line_y, PAGE_WIDTH - MARGIN_RIGHT, line_y)
    
    canvas.restoreState()


def draw_footer(canvas, doc, page_info):
    """
    Desenha o rodapé na área reservada (QR code, documento, paginação).
    Chamado em TODAS as páginas.
    
    Área do footer: de (MARGIN_BOTTOM + FOOTER_HEIGHT) até (MARGIN_BOTTOM)
    """
    canvas.saveState()
    
    # Coordenadas do footer
    footer_top = MARGIN_BOTTOM + FOOTER_HEIGHT
    footer_bottom = MARGIN_BOTTOM
    
    # Linha separadora no topo do footer
    canvas.setStrokeColor(COLOR_LINE_GRAY)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_LEFT, footer_top, PAGE_WIDTH - MARGIN_RIGHT, footer_top)
    
    # QR Code no canto direito
    qr_size = 18 * mm
    qr_x = PAGE_WIDTH - MARGIN_RIGHT - qr_size
    qr_y = footer_bottom + (FOOTER_HEIGHT - qr_size) / 2
    
    if page_info.url_validacao:
        try:
            qr_buffer = generate_qr_code_image(page_info.url_validacao)
            img_reader = ImageReader(qr_buffer)
            canvas.drawImage(img_reader, qr_x, qr_y, 
                           width=qr_size, height=qr_size,
                           preserveAspectRatio=True, mask='auto')
        except:
            pass
    
    # Texto central
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(COLOR_LIGHT_GRAY)
    canvas.drawCentredString(PAGE_WIDTH / 2, footer_top - 5 * mm,
                            "Documento gerado automaticamente pelo Sistema Atlas")
    
    # Código do documento (esquerda)
    canvas.setFont('Helvetica-Bold', 7)
    canvas.setFillColor(COLOR_DARK_GRAY)
    canvas.drawString(MARGIN_LEFT, footer_top - 10 * mm, 
                     f"Documento: {page_info.codigo_documento}")
    
    canvas.setFont('Helvetica', 6)
    canvas.setFillColor(COLOR_MEDIUM_GRAY)
    canvas.drawString(MARGIN_LEFT, footer_top - 14 * mm,
                     f"Validação: {page_info.url_validacao}")
    
    # Número da página (direita, acima do QR)
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(COLOR_DARK_GRAY)
    page_num = doc.page
    canvas.drawCentredString(
    PAGE_WIDTH / 2,
    footer_bottom + 6 * mm,
    f"Página {page_num}"
)
    
    canvas.restoreState()


def on_page(canvas, doc, page_info):
    """Callback chamado em cada página para desenhar header e footer."""
    draw_header(canvas, doc, page_info)
    draw_footer(canvas, doc, page_info)


# =============================================================================
# GERADOR DE PDF
# =============================================================================
class OSPDFGenerator:
    """
    Gerador de PDF para Ordens de Serviço.
    
    Usa layout com margens ABNT e áreas bem definidas:
    - Header: área fixa no topo para logo e título
    - Content: área central para o conteúdo (flowables)
    - Footer: área fixa no rodapé para QR code e informações
    """
    
    def __init__(self, ordem_servico, codigo_documento: str, url_validacao: str):
        self.os = ordem_servico
        self.codigo_documento = codigo_documento
        self.url_validacao = url_validacao
        self.styles = getSampleStyleSheet()
        self._setup_styles()
        
        # Informações para header/footer
        self.page_info = PageInfo()
        self.page_info.os_numero = ordem_servico.numero
        self.page_info.codigo_documento = codigo_documento
        self.page_info.url_validacao = url_validacao
        self.page_info.logo_path = get_logo_path()
    
    def _setup_styles(self):
        """Configura estilos customizados para o documento."""
        self.styles.add(ParagraphStyle(
            'OSSectionTitle',
            parent=self.styles['Heading2'],
            fontSize=10,
            textColor=COLOR_DARK_GRAY,
            spaceBefore=1 * mm,
            spaceAfter=1 * mm,
        ))
        self.styles.add(ParagraphStyle(
            'OSBodyText',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=COLOR_DARK_GRAY,
        ))
        self.styles.add(ParagraphStyle(
            'OSTableCell',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=COLOR_DARK_GRAY,
            leading=10,
        ))
        self.styles.add(ParagraphStyle(
            'OSTableHeader',
            parent=self.styles['Normal'],
            fontSize=8,
            fontName='Helvetica-Bold',
            textColor=COLOR_BLACK,
        ))
    
    def _create_title_section(self):
        """Cria a seção de título/info inicial (abaixo do header)."""
        elements = []
        
        # Dados
        data_emissao = format_datetime(datetime.now())
        data_abertura = format_date(self.os.data_abertura)
        status_display = get_status_display(self.os.status)
        
        colaborador = '-'
        if self.os.colaborador:
            colaborador = getattr(self.os.colaborador, 'nome', None) or '-'
        
        # Informações em duas colunas
        info_data = [
            [
                Paragraph(f"<b>Colaborador:</b> {colaborador}", self.styles['OSBodyText']),
                Paragraph(f"<b>Status:</b> {status_display}", self.styles['OSBodyText']),
            ],
            [
                Paragraph(f"<b>Data de Emissão:</b> {data_emissao}", self.styles['OSBodyText']),
                Paragraph(f"<b>Data de Abertura:</b> {data_abertura}", self.styles['OSBodyText']),
            ],
        ]
        
        info_table = Table(info_data, colWidths=[CONTENT_WIDTH/2, CONTENT_WIDTH/2])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 3 * mm))
        return elements
    
    def _create_info_section(self):
        """Cria a seção de informações gerais."""
        section = []
        
        section.append(Paragraph("<b>INFORMAÇÕES GERAIS</b>", self.styles['OSSectionTitle']))
        
        # Dados
        contrato_numero = self.os.contrato.numero if self.os.contrato else '-'
        
        contratante = '-'
        if self.os.contrato and self.os.contrato.empresa_contratante:
            contratante = getattr(self.os.contrato.empresa_contratante, 'nome', None) or '-'
        
        empresa_solicitante = '-'
        if self.os.empresa_solicitante:
            empresa_solicitante = getattr(self.os.empresa_solicitante, 'nome', None) or '-'
        
        pagadora = '-'
        if self.os.empresa_pagadora:
            pagadora = getattr(self.os.empresa_pagadora, 'nome', None) or '-'
        
        solicitante_user = '-'
        if self.os.solicitante:
            solicitante_user = getattr(self.os.solicitante, 'nome', None) or '-'
        
        # Tabela 2 colunas
        info_data = [
            [
                Paragraph(f"<b>Contrato:</b> {contrato_numero}", self.styles['OSBodyText']),
                Paragraph(f"<b>Solicitante:</b> {solicitante_user}", self.styles['OSBodyText']),
            ],
            [
                Paragraph(f"<b>Contratante:</b> {contratante}", self.styles['OSBodyText']),
                Paragraph(f"<b>Empresa Solicitante:</b> {empresa_solicitante}", self.styles['OSBodyText']),
            ],
            [
                Paragraph(f"<b>Faturamento:</b> {pagadora}", self.styles['OSBodyText']),
                Paragraph("", self.styles['OSBodyText']),
            ],
        ]
        
        info_table = Table(info_data, colWidths=[CONTENT_WIDTH/2, CONTENT_WIDTH/2])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1 * mm),
        ]))
        section.append(info_table)
        section.append(Spacer(1, 3 * mm))
        
        return [KeepTogether(section)]
    
    def _create_beneficiarios_section(self):
        """Cria a seção de beneficiários."""
        titulares = list(self.os.titulares_vinculados.select_related('titular').all())
        dependentes = list(self.os.dependentes_vinculados.select_related('dependente', 'dependente__titular').all())
        
        if not titulares and not dependentes:
            return []
        
        elements = []
        elements.append(Paragraph("<b>BENEFICIÁRIOS</b>", self.styles['OSSectionTitle']))
        
        header_style = self.styles['OSTableHeader']
        cell_style = self.styles['OSTableCell']
        
        data = [[
            Paragraph('Nome Completo', header_style),
            Paragraph('Tipo', header_style),
            Paragraph('Documento', header_style),
            Paragraph('Responsável', header_style)
        ]]
        
        for t in titulares:
            data.append([
                Paragraph(t.titular.nome if t.titular else '-', cell_style),
                Paragraph('Titular', cell_style),
                Paragraph(getattr(t.titular, 'rnm', '-') or '-', cell_style),
                Paragraph('—', cell_style)
            ])
        
        for d in dependentes:
            titular_nome = d.dependente.titular.nome if d.dependente and d.dependente.titular else '—'
            data.append([
                Paragraph(d.dependente.nome if d.dependente else '-', cell_style),
                Paragraph('Dependente', cell_style),
                Paragraph(getattr(d.dependente, 'rnm', '-') or '-', cell_style),
                Paragraph(titular_nome, cell_style)
            ])
        
        if len(data) > 1:
            table = Table(data, colWidths=[60*mm, 25*mm, 35*mm, 40*mm], repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_GRAY),
                ('GRID', (0, 0), (-1, -1), 0.3, COLOR_LINE_GRAY),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('LEFTPADDING', (0, 0), (-1, -1), 2),
                ('RIGHTPADDING', (0, 0), (-1, -1), 2),
            ]))
            elements.append(table)
        
        elements.append(Spacer(1, 3 * mm))
        return elements
    
    def _create_servicos_section(self):
        """Cria a seção de serviços."""
        elements = []
        elements.append(Paragraph("<b>SERVIÇOS</b>", self.styles['OSSectionTitle']))
        
        itens = list(self.os.itens.select_related('contrato_servico', 'contrato_servico__servico').all())
        
        if not itens:
            elements.append(Paragraph("<i>Nenhum serviço cadastrado.</i>", self.styles['OSBodyText']))
            elements.append(Spacer(1, 4 * mm))
            return elements
        
        header_style = self.styles['OSTableHeader']
        cell_style = self.styles['OSTableCell']
        
        data = [[
            Paragraph('#', header_style),
            Paragraph('Descrição', header_style),
            Paragraph('Qtd', header_style),
            Paragraph('Valor Unit.', header_style),
            Paragraph('Subtotal', header_style)
        ]]
        
        for idx, item in enumerate(itens, 1):
            descricao = ''
            if item.contrato_servico and item.contrato_servico.servico:
                descricao = item.contrato_servico.servico.descricao or item.contrato_servico.servico.item
            
            quantidade = item.quantidade or 1
            valor_unit = item.valor_aplicado or Decimal('0')
            subtotal = valor_unit * quantidade
            
            data.append([
                Paragraph(str(idx), cell_style),
                Paragraph(descricao[:100] if len(descricao) > 100 else descricao, cell_style),
                Paragraph(str(quantidade), cell_style),
                Paragraph(format_currency(valor_unit), cell_style),
                Paragraph(format_currency(subtotal), cell_style),
            ])
        
        table = Table(data, colWidths=[8*mm, 77*mm, 12*mm, 32*mm, 32*mm], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_GRAY),
            ('GRID', (0, 0), (-1, -1), 0.3, COLOR_LINE_GRAY),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 3 * mm))
        
        return elements
    
    def _create_despesas_section(self):
        """Cria a seção de despesas."""
        elements = []
        elements.append(Paragraph("<b>DESPESAS</b>", self.styles['OSSectionTitle']))
        
        despesas = list(self.os.despesas.filter(ativo=True).select_related('tipo_despesa').all())
        
        if not despesas:
            elements.append(Paragraph("<i>Nenhuma despesa cadastrada.</i>", self.styles['OSBodyText']))
            elements.append(Spacer(1, 4 * mm))
            return elements
        
        header_style = self.styles['OSTableHeader']
        cell_style = self.styles['OSTableCell']
        
        data = [[
            Paragraph('#', header_style),
            Paragraph('Descrição', header_style),
            Paragraph('Valor', header_style)
        ]]
        
        for idx, despesa in enumerate(despesas, 1):
            descricao = ''
            if despesa.tipo_despesa:
                descricao = despesa.tipo_despesa.descricao or despesa.tipo_despesa.item
            
            data.append([
                Paragraph(str(idx), cell_style),
                Paragraph(descricao[:120] if len(descricao) > 120 else descricao, cell_style),
                Paragraph(format_currency(despesa.valor), cell_style),
            ])
        
        table = Table(data, colWidths=[8*mm, 117*mm, 36*mm], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_GRAY),
            ('GRID', (0, 0), (-1, -1), 0.3, COLOR_LINE_GRAY),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 3 * mm))
        
        return elements
    
    def _create_resumo_section(self):
        """Cria a seção de resumo financeiro."""
        section = []
        
        section.append(Paragraph("<b>RESUMO FINANCEIRO</b>", self.styles['OSSectionTitle']))
        
        valor_servicos = self.os.valor_servicos or Decimal('0')
        valor_despesas = self.os.valor_despesas or Decimal('0')
        valor_total = self.os.valor_total or Decimal('0')
        
        cell_style = self.styles['OSBodyText']
        data = [
            [
                Paragraph('Total de Serviços:', cell_style),
                Paragraph(format_currency(valor_servicos), cell_style)
            ],
            [
                Paragraph('Total de Despesas:', cell_style),
                Paragraph(format_currency(valor_despesas), cell_style)
            ],
            [
                Paragraph('<b>VALOR TOTAL:</b>', cell_style),
                Paragraph(f'<b>{format_currency(valor_total)}</b>', cell_style)
            ],
        ]
        
        table = Table(data, colWidths=[CONTENT_WIDTH - 45*mm, 45*mm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, 1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, 1), 1),
            ('TOPPADDING', (0, 2), (-1, 2), 3),
            ('BOTTOMPADDING', (0, 2), (-1, 2), 3),
        ]))
        section.append(table)
        section.append(Spacer(1, 3 * mm))
        
        return [KeepTogether(section)]
    
    def _create_observacoes_section(self):
        """Cria a seção de observações."""
        if not self.os.observacao:
            return []
        
        section = []
        section.append(Paragraph("<b>OBSERVAÇÕES</b>", self.styles['OSSectionTitle']))
        section.append(Paragraph(self.os.observacao, self.styles['OSBodyText']))
        section.append(Spacer(1, 3 * mm))
        
        return [KeepTogether(section)]
    
    def generate(self) -> tuple[bytes, str]:
        """
        Gera o PDF e retorna os bytes e o hash SHA-256.
        
        Returns:
            tuple: (pdf_bytes, hash_sha256)
        """
        buffer = io.BytesIO()
        
        # Documento base
        doc = BaseDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=MARGIN_LEFT,
            rightMargin=MARGIN_RIGHT,
            topMargin=MARGIN_TOP,
            bottomMargin=MARGIN_BOTTOM,
        )
        
        # Frame para o conteúdo - área entre header e footer
        content_frame = Frame(
            x1=MARGIN_LEFT,
            y1=CONTENT_BOTTOM,
            width=CONTENT_WIDTH,
            height=CONTENT_HEIGHT,
            id='content',
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        
        # Callback para desenhar header/footer em cada página
        page_info = self.page_info
        def page_callback(canvas, doc):
            on_page(canvas, doc, page_info)
        
        # Template de página com callback
        template = PageTemplate(
            id='main',
            frames=[content_frame],
            onPage=page_callback,
        )
        doc.addPageTemplates([template])
        
        # Monta o conteúdo
        elements = []
        elements.extend(self._create_title_section())
        elements.extend(self._create_info_section())
        elements.extend(self._create_beneficiarios_section())
        elements.extend(self._create_servicos_section())
        elements.extend(self._create_despesas_section())
        elements.extend(self._create_resumo_section())
        elements.extend(self._create_observacoes_section())
        
        # Gera o PDF
        doc.build(elements)
        
        # Obtém os bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        # Calcula o hash SHA-256
        hash_sha256 = hashlib.sha256(pdf_bytes).hexdigest()
        
        return pdf_bytes, hash_sha256


def generate_os_pdf(ordem_servico, codigo_documento: str, url_validacao: str) -> tuple[bytes, str]:
    """
    Função auxiliar para gerar PDF de uma Ordem de Serviço.
    
    Args:
        ordem_servico: Instância do modelo OrdemServico
        codigo_documento: Código do documento (ex: DOC-OS-000001-V001)
        url_validacao: URL para validação do documento
    
    Returns:
        tuple: (pdf_bytes, hash_sha256)
    """
    generator = OSPDFGenerator(ordem_servico, codigo_documento, url_validacao)
    return generator.generate()
