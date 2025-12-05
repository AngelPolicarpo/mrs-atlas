# Documentação: Página de Pesquisa Avançada

Este documento explica em detalhes o funcionamento da página de Pesquisa Avançada (`Pesquisa.jsx`) e seus componentes relacionados.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estados do Componente](#estados-do-componente)
- [Explicação: Carregar Dados para Combos](#explicação-carregar-dados-para-combos)
- [Fluxo de Busca](#fluxo-de-busca)
- [Sistema de Filtros](#sistema-de-filtros)
- [Cálculo de Período](#cálculo-de-período)
- [Sistema de Cores (Vencimento)](#sistema-de-cores-vencimento)
- [Estrutura de Resultados](#estrutura-de-resultados)
- [Exportação de Dados](#exportação-de-dados)
- [Backend: PesquisaUnificadaViewSet](#backend-pesquisaunificadaviewset)
- [Sugestões de Otimização](#sugestões-de-otimização)

---

## Visão Geral

A página de Pesquisa Avançada permite buscar titulares e dependentes com diversos filtros:

- **Busca por texto**: nome, RNM, CPF, passaporte
- **Filtros de relacionamento**: nacionalidade, empresa
- **Filtros de vínculo**: tipo (empresa/particular), status (ativo/inativo)
- **Filtros de data**: por entrada, atualização ou vencimento
- **Paginação real**: resultados divididos em páginas
- **Exportação de dados**: CSV, XLSX (Excel) e PDF

---

## Estados do Componente

### Filtros de Busca

```javascript
const [filters, setFilters] = useState({
  searchTerm: '',        // Texto digitado na busca
  searchField: 'todos',  // Campo específico: 'nome', 'rnm', 'cpf', 'passaporte' ou 'todos'
  
  // Filtros de nacionalidade (com autocomplete)
  nacionalidade: '',     // UUID da nacionalidade selecionada
  nacionalidadeText: '', // Texto digitado pelo usuário (para mostrar no input)
  
  // Filtros de empresa (com autocomplete)
  empresa: '',           // UUID da empresa selecionada
  empresaText: '',       // Texto digitado pelo usuário
  
  // Filtros de vínculo
  tipoVinculo: '',       // 'EMPRESA' ou 'PARTICULAR'
  status: '',            // 'ativo' ou 'inativo'
  
  // Filtros de data
  tipoEvento: '',        // 'entrada', 'atualizacao' ou 'vencimento'
  periodo: '',           // '15', '30', '60', '90', '120', '180', '365'
  periodoPosterior: true,  // Se true, busca nos PRÓXIMOS X dias
  periodoAnterior: false,  // Se true, busca nos ÚLTIMOS X dias
  dataDe: '',            // Data inicial (formato YYYY-MM-DD)
  dataAte: '',           // Data final (formato YYYY-MM-DD)
})
```

### Controle de Paginação

```javascript
const [pagination, setPagination] = useState({
  page: 1,           // Página atual
  pageSize: 20,      // Itens por página (10, 20, 50 ou 100)
  totalPages: 1,     // Total de páginas
  totalCount: 0,     // Total de resultados
  hasNext: false,    // Tem próxima página?
  hasPrevious: false // Tem página anterior?
})
```

### Outros Estados

```javascript
const [results, setResults] = useState([])         // Resultados da busca
const [loading, setLoading] = useState(false)      // Indicador de carregamento
const [expandedItems, setExpandedItems] = useState({}) // Linhas expandidas (ver detalhes)
const [nacionalidades, setNacionalidades] = useState([]) // Lista para o combo
const [empresas, setEmpresas] = useState([])       // Lista para o combo
```

---

## Explicação: Carregar Dados para Combos

### O que são "Combos"?

"Combos" é uma abreviação de "Combo Box", que são os campos de seleção (dropdowns/select). Na página de pesquisa, temos dois combos principais:

1. **Nacionalidade** - dropdown com todas as nacionalidades disponíveis
2. **Empresa** - dropdown com todas as empresas cadastradas

### Como funciona?

```javascript
useEffect(() => {
  async function loadCombos() {
    try {
      // Busca nacionalidades E empresas em paralelo (mais rápido)
      const [nacRes, empRes] = await Promise.all([
        getNacionalidades(),
        getEmpresas({ page_size: 1000 }), // Pega até 1000 empresas
      ])
      
      // Salva nos estados
      setNacionalidades(nacRes.data.results || nacRes.data || [])
      setEmpresas(empRes.data.results || empRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar combos:', error)
    }
  }
  loadCombos()
}, []) // [] = executa apenas uma vez, ao carregar a página
```

### Por que isso é necessário?

Sem carregar esses dados, os campos de filtro ficariam vazios:

```html
<!-- SEM dados carregados -->
<select name="nacionalidade">
  <option value="">Selecione...</option>
  <!-- Nada aqui! -->
</select>

<!-- COM dados carregados -->
<select name="nacionalidade">
  <option value="">Selecione...</option>
  <option value="uuid-1">Brasileiro</option>
  <option value="uuid-2">Americano</option>
  <option value="uuid-3">Português</option>
  <!-- ... -->
</select>
```

### Autocomplete com Datalist

Na implementação atual, usamos `<datalist>` para autocomplete:

```javascript
<input
  type="text"
  value={filters.nacionalidadeText}
  onChange={(e) => {
    const text = e.target.value
    // Procura se o texto digitado corresponde a uma nacionalidade
    const nac = nacionalidades.find(n => 
      n.nome.toLowerCase() === text.toLowerCase()
    )
    setFilters(prev => ({ 
      ...prev, 
      nacionalidadeText: text,           // Mostra o texto
      nacionalidade: nac ? nac.id : ''   // Salva o ID se encontrou
    }))
  }}
  list="nacionalidades-list"
/>
<datalist id="nacionalidades-list">
  {nacionalidades.map(nac => (
    <option key={nac.id} value={nac.nome} />
  ))}
</datalist>
```

---

## Fluxo de Busca

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuário preenche filtros                                │
│     - Digita termo de busca                                 │
│     - Seleciona nacionalidade                               │
│     - Escolhe período de vencimento                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Usuário clica em "Buscar" ou pressiona Enter            │
│     → handleSearch(1) é chamado                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. handleSearch monta os parâmetros                        │
│                                                             │
│  const params = {                                           │
│    page: 1,                                                 │
│    page_size: 20,                                           │
│    search: 'João',                                          │
│    nacionalidade: 'uuid-123',                               │
│    tipo_evento: 'vencimento',                               │
│    data_de: '2025-12-01',                                   │
│    data_ate: '2025-12-16',                                  │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Chamada à API                                           │
│     GET /api/v1/pesquisa/?page=1&search=João&...            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Backend processa e retorna                              │
│                                                             │
│  {                                                          │
│    "results": [...],                                        │
│    "count": 45,                                             │
│    "page": 1,                                               │
│    "total_pages": 3,                                        │
│    "has_next": true,                                        │
│    "has_previous": false                                    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Frontend atualiza estados                               │
│     setResults(data.results)                                │
│     setPagination({...})                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  7. React re-renderiza a tabela com os novos dados          │
└─────────────────────────────────────────────────────────────┘
```

---

## Sistema de Filtros

### Filtros de Texto

| Filtro | Backend | Descrição |
|--------|---------|-----------|
| `searchTerm` | `search` | Busca em nome, RNM, CPF, passaporte |
| `searchField` | - | Apenas visual (backend busca em todos) |

### Filtros de Relacionamento

| Filtro | Backend | Descrição |
|--------|---------|-----------|
| `nacionalidade` | `nacionalidade` | UUID da nacionalidade |
| `empresa` | `empresa` | UUID da empresa |

### Filtros de Vínculo

| Filtro | Backend | Descrição |
|--------|---------|-----------|
| `tipoVinculo` | `tipo_vinculo` | 'EMPRESA' ou 'PARTICULAR' |
| `status` | `vinculo_status` | 'true' ou 'false' |

### Filtros de Data

| Filtro | Backend | Descrição |
|--------|---------|-----------|
| `tipoEvento` | `tipo_evento` | 'entrada', 'atualizacao', 'vencimento' |
| `dataDe` | `data_de` | Data inicial (YYYY-MM-DD) |
| `dataAte` | `data_ate` | Data final (YYYY-MM-DD) |

---

## Cálculo de Período

Quando o usuário seleciona um período (ex: "30 dias"), o sistema calcula automaticamente as datas:

```javascript
const calcularDatasDoPerido = useCallback(() => {
  // Se não tem tipo de evento ou período, não calcula
  if (!filters.tipoEvento || !filters.periodo) {
    return { dataDe: null, dataAte: null }
  }
  
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0) // Zera horário
  
  const diasOffset = parseInt(filters.periodo) || 0
  
  const dataLimite = new Date(hoje)
  
  if (filters.periodoPosterior) {
    // PRÓXIMOS X dias
    dataLimite.setDate(dataLimite.getDate() + diasOffset)
    return { dataDe: hoje, dataAte: dataLimite }
  } else {
    // ÚLTIMOS X dias
    dataLimite.setDate(dataLimite.getDate() - diasOffset)
    return { dataDe: dataLimite, dataAte: hoje }
  }
}, [filters.tipoEvento, filters.periodo, filters.periodoPosterior])
```

### Exemplos

**Vencimento nos próximos 30 dias:**
- Hoje: 01/12/2025
- `periodoPosterior: true`
- Resultado: `dataDe = 01/12/2025`, `dataAte = 31/12/2025`

**Entrada nos últimos 15 dias:**
- Hoje: 01/12/2025
- `periodoAnterior: true`
- Resultado: `dataDe = 16/11/2025`, `dataAte = 01/12/2025`

---

## Sistema de Cores (Vencimento)

### Cores das Linhas

```javascript
function getRowClass(dataFim, type) {
  let baseClass = type === 'dependente' ? 'row-dependente' : ''
  
  const dias = calcularDiasRestantes(dataFim)
  if (dias === null) return baseClass
  if (dias < 0) return `${baseClass} row-expired`   // Vermelho
  if (dias <= 60) return `${baseClass} row-warning` // Amarelo
  return baseClass                                   // Normal
}
```

### Badges de Dias

```javascript
const dias = calcularDiasRestantes(item.dataFimVinculo)
if (dias !== null) {
  let badgeClass = 'badge-success'  // Verde (> 90 dias)
  if (dias < 0) badgeClass = 'badge-danger'      // Vermelho (vencido)
  else if (dias <= 30) badgeClass = 'badge-warning' // Amarelo (1-30 dias)
  else if (dias <= 90) badgeClass = 'badge-info'    // Azul (31-90 dias)
  
  return (
    <span className={`badge ${badgeClass}`}>
      {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
    </span>
  )
}
```

### Legenda Visual

| Cor | Significado | Dias |
|-----|-------------|------|
| 🔴 Vermelho | Vencido | < 0 |
| 🟡 Amarelo | Crítico | 1-30 |
| 🔵 Azul | Atenção | 31-90 |
| 🟢 Verde | OK | > 90 |

---

## Estrutura de Resultados

### Titular (com vínculo)

```javascript
{
  type: 'titular',
  id: 'uuid-do-titular',
  visibleId: 'titular-{id}-{vinculoId}',  // ID único para a linha
  nome: 'João Silva',
  rnm: 'RNM12345',
  cpf: '123.456.789-00',
  passaporte: 'AB123456',
  nacionalidade: 'Brasileiro',
  
  // Dados do vínculo
  tipoVinculo: 'Empresa',
  empresa: 'Tech Solutions Ltda',
  amparo: 'Acordo de Residência',
  dataFimVinculo: '2025-06-15',
  status: true,
  vinculoId: 'uuid-do-vinculo',
  
  // Contato
  email: 'joao@email.com',
  telefone: '11999999999',
  
  // Filiação
  pai: 'José Silva',
  mae: 'Maria Silva',
  dataNascimento: '1985-03-15',
  
  isLastVinculo: true  // É o último vínculo deste titular?
}
```

### Dependente

```javascript
{
  type: 'dependente',
  id: 'uuid-do-dependente',
  visibleId: 'dependente-{id}',
  
  // Relação com titular
  titularId: 'uuid-do-titular',
  titularNome: 'João Silva',
  
  // Dados pessoais
  nome: 'Maria Silva',
  rnm: 'RNM67890',
  passaporte: 'CD789012',
  nacionalidade: 'Brasileiro',
  tipoDependente: 'Cônjuge',
  
  // Vínculo do dependente
  dataFimVinculo: '2025-06-15',
  amparo: 'Reunião Familiar',
  
  // Filiação
  pai: 'Pedro Santos',
  mae: 'Ana Santos',
  dataNascimento: '1988-07-20'
}
```

---

## Exportação de Dados

### Visão Geral

A página de pesquisa oferece funcionalidade de exportação dos resultados em três formatos:

- **CSV** - Formato texto separado por ponto e vírgula (compatível com Excel em português)
- **XLSX** - Formato nativo do Excel com formatação automática de colunas
- **PDF** - Relatório em formato PDF com tabela formatada

### Opções de Exportação

Cada formato oferece duas opções:

1. **Página atual** - Exporta apenas os registros visíveis na página atual
2. **Todos** - Busca e exporta todos os registros que atendem aos filtros (máximo 1000)

### Bibliotecas Utilizadas

```json
{
  "xlsx": "^0.18.5",       // Geração de arquivos Excel
  "file-saver": "^2.0.5",  // Download de arquivos
  "jspdf": "^3.0.4",       // Geração de PDF
  "jspdf-autotable": "^5.0.2"  // Plugin para tabelas em PDF
}
```

### Campos Exportados

| Campo | Descrição |
|-------|-----------|
| Nome | Nome completo da pessoa |
| Tipo | "Titular" ou "Dependente" |
| Vínculo/Relação | Tipo de vínculo (empresa/particular) ou relação com titular |
| Amparo | Amparo legal vigente |
| RNM | Registro Nacional Migratório |
| CPF | CPF do titular/dependente |
| Passaporte | Número do passaporte |
| Nacionalidade | País de origem |
| Data Nascimento | Data de nascimento formatada |
| Data Fim Vínculo | Data de vencimento do vínculo |
| Status | Ativo, Inativo ou Sem Vínculo |
| Email | E-mail de contato |
| Telefone | Telefone de contato |

### Implementação

#### Preparação dos Dados

```javascript
function prepareExportData(data) {
  return data.map(item => ({
    'Nome': item.nome || '-',
    'Tipo': item.type === 'titular' ? 'Titular' : 'Dependente',
    // ... demais campos
  }))
}
```

#### Exportação para CSV

- Usa BOM (`\uFEFF`) para garantir codificação UTF-8 no Excel
- Separador: ponto e vírgula (`;`) para compatibilidade com Excel em português
- Escapa valores com aspas quando necessário

#### Exportação para XLSX

- Ajusta automaticamente a largura das colunas
- Usa `XLSX.writeFile()` para download direto

#### Exportação para PDF

- Orientação paisagem (A4)
- Título e informações de geração
- Tabela com cabeçalhos coloridos
- Linhas alternadas para melhor legibilidade
- Paginação no rodapé

### Estado de Exportação

```javascript
const [exporting, setExporting] = useState(false)
```

Durante a exportação:
- Botões ficam desabilitados
- Ícone muda para "⏳" (ampulheta)
- Impede múltiplas exportações simultâneas

### Busca de Todos os Resultados

Para exportar "Todos", uma nova requisição é feita ao backend com `page_size: 1000`:

```javascript
async function fetchAllResults() {
  const params = {
    page: 1,
    page_size: 1000,
    // ... filtros atuais
  }
  const response = await pesquisaUnificada(params)
  return response.data.results || []
}
```

---

## Backend: PesquisaUnificadaViewSet

### Localização

`backend/apps/titulares/views.py` - classe `PesquisaUnificadaViewSet`

### Como Funciona

1. **Recebe parâmetros** da query string
2. **Filtra titulares** baseado nos parâmetros
3. **Pagina** os resultados
4. **Para cada titular**, adiciona seus vínculos e dependentes
5. **Filtra vínculos** baseado nos parâmetros (tipo, empresa, status, data)
6. **Monta resposta** com estrutura unificada

### Lógica de Filtro de Vínculo

```python
# Se há filtros de vínculo ativos e nenhum vínculo passou, não mostrar o titular
has_vinculo_filters = tipo_vinculo or empresa or vinculo_status is not None or (tipo_evento and (data_de or data_ate))

if not vinculos and has_vinculo_filters:
    continue  # Pula este titular
```

---

## Sugestões de Otimização

### 1. ⚡ Cache de Combos

**Problema:** Toda vez que a página carrega, busca nacionalidades e empresas.

**Solução:** Criar Context global para cache.

```javascript
// src/contexts/CombosContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const CombosContext = createContext()

export function CombosProvider({ children }) {
  const [nacionalidades, setNacionalidades] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carrega apenas uma vez para toda a aplicação
    Promise.all([getNacionalidades(), getEmpresas({ page_size: 1000 })])
      .then(([nac, emp]) => {
        setNacionalidades(nac.data.results || [])
        setEmpresas(emp.data.results || [])
        setLoading(false)
      })
  }, [])

  return (
    <CombosContext.Provider value={{ nacionalidades, empresas, loading }}>
      {children}
    </CombosContext.Provider>
  )
}

export const useCombos = () => useContext(CombosContext)
```

Uso:
```javascript
// Em Pesquisa.jsx
const { nacionalidades, empresas } = useCombos()
// Não precisa mais do loadCombos!
```

### 2. 🔍 Debounce na Busca

**Problema:** Se usuário digita rápido, dispara muitas requisições.

**Solução:**

```javascript
import { useDebouncedCallback } from 'use-debounce'

// Dentro do componente
const debouncedSearch = useDebouncedCallback((term) => {
  handleSearch(1)
}, 500) // Espera 500ms após parar de digitar

// No input
<input
  onChange={(e) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }))
    debouncedSearch(e.target.value)
  }}
/>
```

### 3. 📍 Filtros na URL

**Problema:** Ao recarregar a página, filtros são perdidos.

**Solução:**

```javascript
import { useSearchParams } from 'react-router-dom'

const [searchParams, setSearchParams] = useSearchParams()

// Carregar filtros da URL ao iniciar
useEffect(() => {
  setFilters({
    searchTerm: searchParams.get('q') || '',
    nacionalidade: searchParams.get('nac') || '',
    empresa: searchParams.get('emp') || '',
    tipoVinculo: searchParams.get('tipo') || '',
    // ...
  })
}, [])

// Atualizar URL ao buscar
function handleSearch(page) {
  setSearchParams({
    q: filters.searchTerm,
    nac: filters.nacionalidade,
    // ...
  })
  // ... fazer busca
}
```

### 4. 📊 Exportar Resultados

**Sugestão:** Adicionar botão para exportar CSV/Excel.

```javascript
function exportToCSV() {
  const headers = ['Nome', 'Tipo', 'RNM', 'Vencimento', 'Status']
  const rows = results.map(r => [
    r.nome,
    r.type === 'titular' ? 'Titular' : 'Dependente',
    r.rnm || '',
    r.dataFimVinculo || '',
    r.status ? 'Ativo' : 'Inativo'
  ])
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pesquisa_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
```

### 5. 🗄️ Índices no Banco

Adicionar índices para campos frequentemente filtrados:

```python
# Em models.py
class VinculoTitular(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['data_fim_vinculo']),
            models.Index(fields=['status']),
            models.Index(fields=['tipo_vinculo']),
            models.Index(fields=['empresa', 'status']),
        ]
```

---

## Conclusão

A página de Pesquisa Avançada é o coração do sistema Atlas, permitindo encontrar rapidamente titulares e dependentes com diversos critérios. As principais áreas de atenção são:

1. **Performance**: Cache de combos e debounce na busca
2. **UX**: Filtros persistentes na URL
3. **Manutenção**: Código bem organizado com responsabilidades claras
4. **Banco de dados**: Índices apropriados para consultas frequentes
