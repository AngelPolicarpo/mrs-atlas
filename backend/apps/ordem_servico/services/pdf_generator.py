"""
Serviço de geração de PDF para Ordens de Serviço.
Gera PDFs no formato de Orçamento de Serviços com rastreabilidade completa.

Layout: A4, margens 20mm, fonte Helvetica
Inclui: QR Code para validação, hash SHA-256, código de documento
Suporta múltiplas páginas com cabeçalho/rodapé repetidos
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
    Paragraph, Spacer, Image, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas
from django.conf import settings


# Constantes de layout
MARGIN = 20 * mm
PAGE_WIDTH, PAGE_HEIGHT = A4
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN)
HEADER_HEIGHT = 25 * mm
FOOTER_HEIGHT = 20 * mm

# Cores
COLOR_BLACK = colors.black
COLOR_DARK_GRAY = colors.Color(51/255, 51/255, 51/255)
COLOR_MEDIUM_GRAY = colors.Color(102/255, 102/255, 102/255)
COLOR_LIGHT_GRAY = colors.Color(153/255, 153/255, 153/255)
COLOR_BG_GRAY = colors.Color(245/255, 245/255, 245/255)
COLOR_LINE_GRAY = colors.Color(200/255, 200/255, 200/255)


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


def generate_qr_code_image(data: str, size: int = 150) -> BytesIO:
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
    buffer.seek(0)  # Importante: volta para o início do buffer
    return buffer


class NumberedCanvas(canvas.Canvas):
    """Canvas customizado que adiciona números de página e marca d'água."""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.header_info = {}
        self.footer_info = {}
    
    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()
    
    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_header_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)
    
    def _draw_header_footer(self, num_pages):
        """Desenha cabeçalho, rodapé em cada página."""
        page_num = self._pageNumber
        
        # Cabeçalho de continuação (exceto primeira página)
        if page_num > 1:
            self._draw_continuation_header()
        
        # Rodapé em todas as páginas
        self._draw_footer(page_num, num_pages)
    
    def _draw_continuation_header(self):
        """Desenha cabeçalho de continuação nas páginas seguintes."""
        self.saveState()
        self.setFont('Helvetica-Bold', 10)
        self.setFillColor(COLOR_DARK_GRAY)
        
        os_numero = self.header_info.get('os_numero', '')
        codigo = self.footer_info.get('codigo', '')
        
        y = PAGE_HEIGHT - MARGIN
        self.drawString(MARGIN, y, f"OS nº {format_os_number(os_numero)} - {codigo}")
        
        # Linha separadora
        self.setStrokeColor(COLOR_LINE_GRAY)
        self.setLineWidth(0.5)
        self.line(MARGIN, y - 3*mm, PAGE_WIDTH - MARGIN, y - 3*mm)
        
        self.restoreState()
    
    def _draw_footer(self, page_num, num_pages):
        """Desenha o rodapé fixo no final da página com QR Code."""
        self.saveState()
        
        y = MARGIN - 5*mm
        
        # QR Code acima da linha separadora, no canto direito
        qr_size = 15*mm
        qr_x = PAGE_WIDTH - MARGIN - qr_size
        qr_y = y + 14*mm  # Acima da linha
        
        # Gera e desenha o QR Code
        url = self.footer_info.get('url', '')
        if url:
            try:
                from reportlab.lib.utils import ImageReader
                qr_buffer = generate_qr_code_image(url)
                img_reader = ImageReader(qr_buffer)
                self.drawImage(img_reader, qr_x, qr_y, width=qr_size, height=qr_size, 
                             preserveAspectRatio=True, mask='auto')
            except Exception as e:
                # Se falhar, apenas não desenha o QR Code
                print(f"Erro ao desenhar QR Code: {e}")
                pass
        
        # Linha separadora
        self.setStrokeColor(COLOR_LINE_GRAY)
        self.setLineWidth(0.5)
        self.line(MARGIN, y + 12*mm, PAGE_WIDTH - MARGIN, y + 12*mm)
        
        # Texto central
        self.setFont('Helvetica', 7)
        self.setFillColor(COLOR_LIGHT_GRAY)
        self.drawCentredString(PAGE_WIDTH / 2, y + 8*mm, 
                               "Documento gerado automaticamente pelo Sistema Atlas")
        
        # Código do documento
        codigo = self.footer_info.get('codigo', '')
        
        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(COLOR_DARK_GRAY)
        self.drawString(MARGIN, y + 4*mm, f"Documento: {codigo}")
        
        self.setFont('Helvetica', 6)
        self.setFillColor(COLOR_MEDIUM_GRAY)
        self.drawString(MARGIN, y, f"Validação: {url}")
        
        # Número da página
        self.setFont('Helvetica', 7)
        self.setFillColor(COLOR_DARK_GRAY)
        self.drawRightString(PAGE_WIDTH - MARGIN, y + 4*mm, f"Página {page_num} de {num_pages}")
        
        self.restoreState()


class OSPDFGenerator:
    """
    Gerador de PDF para Ordens de Serviço.
    
    Suporta múltiplas páginas com:
    - Cabeçalho repetido em páginas de continuação
    - Rodapé fixo com paginação correta e QR Code
    - Tabelas com quebra de página adequada
    - Logo como marca d'água
    """
    
    def __init__(self, ordem_servico, codigo_documento: str, url_validacao: str):
        self.os = ordem_servico
        self.codigo_documento = codigo_documento
        self.url_validacao = url_validacao
        self.styles = getSampleStyleSheet()
        self._setup_styles()
    
    def _setup_styles(self):
        """Configura estilos customizados."""
        self.styles.add(ParagraphStyle(
            'OSTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            textColor=COLOR_BLACK,
            alignment=TA_RIGHT,
            spaceAfter=2 * mm,
        ))
        self.styles.add(ParagraphStyle(
            'OSSubtitle',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=COLOR_DARK_GRAY,
            alignment=TA_RIGHT,
        ))
        self.styles.add(ParagraphStyle(
            'OSSectionTitle',
            parent=self.styles['Heading2'],
            fontSize=10,
            textColor=COLOR_DARK_GRAY,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
            borderPadding=0,
        ))
        self.styles.add(ParagraphStyle(
            'OSBodyText',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=COLOR_DARK_GRAY,
        ))
        self.styles.add(ParagraphStyle(
            'OSFooterText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=COLOR_LIGHT_GRAY,
            alignment=TA_CENTER,
        ))
        self.styles.add(ParagraphStyle(
            'OSSmallText',
            parent=self.styles['Normal'],
            fontSize=7,
            textColor=COLOR_MEDIUM_GRAY,
        ))
        self.styles.add(ParagraphStyle(
            'OSTableCell',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=COLOR_DARK_GRAY,
            leading=10,
        ))
        self.styles.add(ParagraphStyle(
            'OSTotalValue',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=COLOR_BLACK,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
        ))
    
    def _get_logo_path(self):
        """Retorna o caminho do logo."""
        return os.path.join(settings.BASE_DIR, 'static', 'img', 'logo.png')
    
    def _create_header(self):
        """Cria o cabeçalho do documento (apenas primeira página)."""
        elements = []
        
        # Dados do cabeçalho
        data_emissao = format_datetime(datetime.now())
        data_abertura = format_date(self.os.data_abertura)
        status_display = get_status_display(self.os.status)
        
        # Centro de custos: exibir CNPJ (EmpresaPrestadora tem cnpj)
        centro_custos_cnpj = 'Não informado'
        if self.os.centro_custos:
            centro_custos_cnpj = getattr(self.os.centro_custos, 'cnpj', None) or 'Não informado'
        
        # Logo e título na mesma linha: logo à esquerda, título à direita
        logo_path = self._get_logo_path()
        
        if logo_path and os.path.exists(logo_path):
            logo_img = Image(logo_path, width=15*mm, height=15*mm)
            title_para = Paragraph(
                f"<b>ORDEM DE SERVIÇOS</b><br/>"
                f"<font size='11'>nº {format_os_number(self.os.numero)}</font>",
                self.styles['OSTitle']
            )
            
            header_data = [[logo_img, title_para]]
            header_table = Table(header_data, colWidths=[20*mm, CONTENT_WIDTH - 20*mm])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(header_table)
        else:
            # Fallback caso não tenha logo
            title_data = [[
                Paragraph(
                    f"<b>ORDEM DE SERVIÇOS</b><br/>"
                    f"<font size='11'>nº {format_os_number(self.os.numero)}</font>",
                    self.styles['OSTitle']
                )
            ]]
            title_table = Table(title_data, colWidths=[CONTENT_WIDTH])
            title_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ]))
            elements.append(title_table)
        
        elements.append(Spacer(1, 3*mm))
        
        # Informações-chave em duas colunas
        info_data = [
            [
                Paragraph(f"<b>Centro de Custos:</b> {centro_custos_cnpj}", self.styles['OSBodyText']),
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
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 2*mm))
        
        # Linha separadora
        elements.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_LINE_GRAY))
        elements.append(Spacer(1, 4*mm))
        
        return elements
    
    def _create_info_section(self):
        """Cria a seção de informações gerais."""
        section_elements = []
        
        section_elements.append(Paragraph("<b>INFORMAÇÕES GERAIS</b>", self.styles['OSSectionTitle']))
        section_elements.append(Spacer(1, 2*mm))
        
        # Contrato
        contrato_numero = self.os.contrato.numero if self.os.contrato else '-'
        
        # Contratante: empresa.Empresa tem campo 'nome'
        contratante = '-'
        if self.os.contrato and self.os.contrato.empresa_contratante:
            contratante = getattr(self.os.contrato.empresa_contratante, 'nome', None) or '-'
        
        # Solicitante: empresa.Empresa tem campo 'nome'
        solicitante = '-'
        if self.os.empresa_solicitante:
            solicitante = getattr(self.os.empresa_solicitante, 'nome', None) or '-'
        
        # Pagadora (Faturamento): empresa.Empresa tem campo 'nome'
        pagadora = '-'
        if self.os.empresa_pagadora:
            pagadora = getattr(self.os.empresa_pagadora, 'nome', None) or '-'
        
        # Responsável
        responsavel = '-'
        if self.os.responsavel:
            responsavel = getattr(self.os.responsavel, 'nome', None) or '-'
        
        # Tabela de informações em 2 colunas para otimizar espaço
        info_data = [
            [
                Paragraph(f"<b>Contrato:</b> {contrato_numero}", self.styles['OSBodyText']),
                Paragraph(f"<b>Responsável:</b> {responsavel}", self.styles['OSBodyText']),
            ],
            [
                Paragraph(f"<b>Contratante:</b> {contratante}", self.styles['OSBodyText']),
                Paragraph(f"<b>Solicitante:</b> {solicitante}", self.styles['OSBodyText']),
            ],
            [
                Paragraph(f"<b>Faturamento:</b> {pagadora}", self.styles['OSBodyText']),
                '',
            ],
        ]
        
        info_table = Table(info_data, colWidths=[CONTENT_WIDTH/2, CONTENT_WIDTH/2])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1*mm),
        ]))
        section_elements.append(info_table)
        section_elements.append(Spacer(1, 3*mm))
        
        # Usar KeepTogether para manter a seção inteira na mesma página
        return [KeepTogether(section_elements)]
    
    def _create_beneficiarios_section(self):
        """Cria a seção de beneficiários."""
        elements = []
        
        titulares = list(self.os.titulares_vinculados.select_related('titular').all())
        dependentes = list(self.os.dependentes_vinculados.select_related('dependente', 'dependente__titular').all())
        
        if not titulares and not dependentes:
            return elements
        
        elements.append(Paragraph("<b>BENEFICIÁRIOS</b>", self.styles['OSSectionTitle']))
        elements.append(Spacer(1, 2*mm))
        
        # Cabeçalho da tabela
        header_style = ParagraphStyle('TableHeader', fontSize=8, fontName='Helvetica-Bold', textColor=COLOR_BLACK)
        data = [[
            Paragraph('Nome Completo', header_style),
            Paragraph('Tipo', header_style),
            Paragraph('Documento', header_style),
            Paragraph('Responsável', header_style)
        ]]
        
        cell_style = self.styles['OSTableCell']
        
        for t in titulares:
            nome = Paragraph(t.titular.nome if t.titular else '-', cell_style)
            data.append([
                nome,
                Paragraph('Titular', cell_style),
                Paragraph(getattr(t.titular, 'rnm', '-') or '-', cell_style),
                Paragraph('—', cell_style)
            ])
        
        for d in dependentes:
            nome = Paragraph(d.dependente.nome if d.dependente else '-', cell_style)
            titular_nome = d.dependente.titular.nome if d.dependente and d.dependente.titular else '—'
            data.append([
                nome,
                Paragraph('Dependente', cell_style),
                Paragraph(getattr(d.dependente, 'rnm', '-') or '-', cell_style),
                Paragraph(titular_nome, cell_style)
            ])
        
        if len(data) > 1:
            # repeatRows=1 para repetir cabeçalho em páginas seguintes
            table = Table(data, colWidths=[65*mm, 25*mm, 35*mm, 50*mm], repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_GRAY),
                ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLACK),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.3, COLOR_LINE_GRAY),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 3),
                ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(table)
        
        elements.append(Spacer(1, 4*mm))
        return elements
    
    def _create_servicos_section(self):
        """Cria a seção de serviços."""
        elements = []
        
        elements.append(Paragraph("<b>SERVIÇOS</b>", self.styles['OSSectionTitle']))
        elements.append(Spacer(1, 2*mm))
        
        itens = list(self.os.itens.select_related('contrato_servico', 'contrato_servico__servico').all())
        
        if not itens:
            elements.append(Paragraph("<i>Nenhum serviço cadastrado.</i>", self.styles['OSBodyText']))
            elements.append(Spacer(1, 4*mm))
            return elements
        
        # Cabeçalho da tabela
        header_style = ParagraphStyle('TableHeader', fontSize=8, fontName='Helvetica-Bold', textColor=COLOR_BLACK)
        data = [[
            Paragraph('#', header_style),
            Paragraph('Descrição', header_style),
            Paragraph('Qtd', header_style),
            Paragraph('Valor Unit.', header_style),
            Paragraph('Subtotal', header_style)
        ]]
        
        cell_style = self.styles['OSTableCell']
        
        for idx, item in enumerate(itens, 1):
            descricao = ''
            if item.contrato_servico and item.contrato_servico.servico:
                descricao = item.contrato_servico.servico.descricao or item.contrato_servico.servico.item
            
            quantidade = item.quantidade or 1
            valor_unit = item.valor_aplicado or Decimal('0')
            subtotal = valor_unit * quantidade
            
            # Truncar descrição longa com Paragraph para wrap automático
            desc_para = Paragraph(descricao[:100] if len(descricao) > 100 else descricao, cell_style)
            
            data.append([
                Paragraph(str(idx), cell_style),
                desc_para,
                Paragraph(str(quantidade), cell_style),
                Paragraph(format_currency(valor_unit), cell_style),
                Paragraph(format_currency(subtotal), cell_style),
            ])
        
        # repeatRows=1 para repetir cabeçalho em páginas seguintes
        table = Table(data, colWidths=[10*mm, 85*mm, 15*mm, 32*mm, 32*mm], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_GRAY),
            ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLACK),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.3, COLOR_LINE_GRAY),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 4*mm))
        
        return elements
    
    def _create_despesas_section(self):
        """Cria a seção de despesas."""
        elements = []
        
        elements.append(Paragraph("<b>DESPESAS</b>", self.styles['OSSectionTitle']))
        elements.append(Spacer(1, 2*mm))
        
        despesas = list(self.os.despesas.filter(ativo=True).select_related('tipo_despesa').all())
        
        if not despesas:
            elements.append(Paragraph("<i>Nenhuma despesa cadastrada.</i>", self.styles['OSBodyText']))
            elements.append(Spacer(1, 4*mm))
            return elements
        
        # Cabeçalho da tabela
        header_style = ParagraphStyle('TableHeader', fontSize=8, fontName='Helvetica-Bold', textColor=COLOR_BLACK)
        data = [[
            Paragraph('#', header_style),
            Paragraph('Descrição', header_style),
            Paragraph('Valor', header_style)
        ]]
        
        cell_style = self.styles['OSTableCell']
        
        for idx, despesa in enumerate(despesas, 1):
            descricao = ''
            if despesa.tipo_despesa:
                descricao = despesa.tipo_despesa.descricao or despesa.tipo_despesa.item
            
            desc_para = Paragraph(descricao[:120] if len(descricao) > 120 else descricao, cell_style)
            
            data.append([
                Paragraph(str(idx), cell_style),
                desc_para,
                Paragraph(format_currency(despesa.valor), cell_style),
            ])
        
        # repeatRows=1 para repetir cabeçalho em páginas seguintes
        table = Table(data, colWidths=[10*mm, 125*mm, 40*mm], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_GRAY),
            ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLACK),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.3, COLOR_LINE_GRAY),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 4*mm))
        
        return elements
    
    def _create_resumo_section(self):
        """Cria a seção de resumo financeiro."""
        section_elements = []
        
        section_elements.append(Paragraph("<b>RESUMO FINANCEIRO</b>", self.styles['OSSectionTitle']))
        section_elements.append(Spacer(1, 2*mm))
        
        valor_servicos = self.os.valor_servicos or Decimal('0')
        valor_despesas = self.os.valor_despesas or Decimal('0')
        valor_total = self.os.valor_total or Decimal('0')
        
        # Tabela de valores alinhados à direita
        data = [
            ['Total de Serviços:', format_currency(valor_servicos)],
            ['Total de Despesas:', format_currency(valor_despesas)],
        ]
        
        table = Table(data, colWidths=[CONTENT_WIDTH - 50*mm, 50*mm])
        table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_DARK_GRAY),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
        ]))
        section_elements.append(table)
        
        # Linha dupla
        section_elements.append(Spacer(1, 2*mm))
        section_elements.append(Spacer(1, 3*mm))
        
        # Valor total em destaque com fundo - centralizado
        total_data = [
            [
                Paragraph(f"<b>VALOR TOTAL DO ORÇAMENTO: {format_currency(valor_total)}</b>", self.styles['OSTotalValue'])
            ]
        ]
        
        total_table = Table(total_data, colWidths=[CONTENT_WIDTH])
        total_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_GRAY),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, COLOR_DARK_GRAY),
        ]))
        
        section_elements.append(total_table)
        section_elements.append(Spacer(1, 6*mm))
        
        # Usar KeepTogether para manter TODA a seção de resumo financeiro junta
        return [KeepTogether(section_elements)]
    
    def _create_observacoes_section(self):
        """Cria a seção de observações."""
        if not self.os.observacao:
            return []
        
        section_elements = []
        section_elements.append(Paragraph("<b>OBSERVAÇÕES</b>", self.styles['OSSectionTitle']))
        section_elements.append(Spacer(1, 2*mm))
        section_elements.append(Paragraph(self.os.observacao, self.styles['OSBodyText']))
        section_elements.append(Spacer(1, 4*mm))
        
        # Usar KeepTogether para manter a seção de observações junta
        return [KeepTogether(section_elements)]
    
    def generate(self) -> tuple[bytes, str]:
        """
        Gera o PDF e retorna os bytes e o hash SHA-256.
        
        Returns:
            tuple: (pdf_bytes, hash_sha256)
        """
        buffer = io.BytesIO()
        
        # Cria documento com canvas customizado para paginação
        doc = BaseDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
            topMargin=MARGIN,
            bottomMargin=MARGIN + FOOTER_HEIGHT,
        )
        
        # Frame principal para o conteúdo
        frame = Frame(
            doc.leftMargin,
            doc.bottomMargin,
            doc.width,
            doc.height - FOOTER_HEIGHT,
            id='main'
        )
        
        # Template de página
        template = PageTemplate(id='main', frames=[frame])
        doc.addPageTemplates([template])
        
        # Monta o documento
        elements = []
        elements.extend(self._create_header())
        elements.extend(self._create_info_section())
        elements.extend(self._create_beneficiarios_section())
        elements.extend(self._create_servicos_section())
        elements.extend(self._create_despesas_section())
        elements.extend(self._create_resumo_section())
        elements.extend(self._create_observacoes_section())
        
        # Configura o canvas customizado com informações do documento
        def canvas_maker(filename, **kwargs):
            c = NumberedCanvas(filename, **kwargs)
            c.header_info = {
                'logo_path': self._get_logo_path(),
                'os_numero': self.os.numero,
            }
            c.footer_info = {
                'codigo': self.codigo_documento,
                'url': self.url_validacao,
            }
            return c
        
        # Gera o PDF
        doc.build(elements, canvasmaker=canvas_maker)
        
        # Obtém os bytes do PDF
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