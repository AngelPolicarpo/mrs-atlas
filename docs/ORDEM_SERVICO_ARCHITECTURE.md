# Sistema de Ordem de Serviço - Documentação Técnica

> **Última atualização:** 17/01/2025  
> **Status:** Implementado e funcional

## Visão Geral

O sistema de Ordem de Serviço (OS) do Atlas segue uma arquitetura baseada em contratos comerciais. Uma OS **não vende serviços**, ela **executa serviços já vendidos em um contrato**.

### Fluxo Principal

```
Contrato → ContratoServico → OrdemServico → OrdemServicoItem
    ↓           ↓                 ↓              ↓
 Define      Serviços          Execução      Quantidade
 relação     vendidos          do trabalho   executada
 comercial   (com qtd e $)
```

## Atualizações Recentes (17/01/2025)

### 1. Simplificação de Status

#### Status de Contrato (3 opções)
- `ATIVO` - Contrato em vigor
- `CANCELADO` - Contrato cancelado
- `FINALIZADO` - Contrato encerrado normalmente

#### Status de Ordem de Serviço (3 opções)
- `ABERTO` - OS aberta/em andamento (default)
- `CANCELADO` - OS cancelada
- `FINALIZADO` - OS concluída

### 2. Remoção de empresa_prestadora

O campo `empresa_prestadora` foi **removido** do modelo `Contrato`. Agora o contrato é vinculado apenas à `empresa_contratante`.

### 3. Reestruturação de Despesas

As despesas foram reestruturadas em duas tabelas:

#### TipoDespesa (Catálogo)
Similar ao modelo `Servico`, funciona como catálogo de tipos de despesa:
- `item` - Nome do tipo de despesa
- `descricao` - Descrição
- `valor_base` - Valor padrão
- `ativo` - Se está ativo no catálogo

#### DespesaOrdemServico (Vínculo)
Vincula um tipo de despesa à OS:
- `ordem_servico` - FK para OS
- `tipo_despesa` - FK para TipoDespesa
- `valor` - Valor aplicado (pode diferir do valor_base)
- `observacao` - Observação opcional
- `ativo` - Se está ativa

## Arquitetura de Dados

### Hierarquia de Entidades

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONTRATO                                │
│  - numero (único)                                               │
│  - empresa_contratante (FK → Empresa)                          │
│  - status: ATIVO | CANCELADO | FINALIZADO                      │
│  - data_inicio, data_fim                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTRATO_SERVICO                            │
│  - contrato (FK → Contrato)                                    │
│  - servico (FK → Servico do catálogo)                          │
│  - valor (valor negociado, pode diferir do valor_base)         │
│  - quantidade (quantidade contratada)                           │
│  - ativo (bool)                                                 │
│                                                                 │
│  PROPRIEDADES CALCULADAS:                                       │
│  - quantidade_executada: soma de OrdemServicoItem.quantidade   │
│  - saldo_disponivel: quantidade - quantidade_executada          │
│  - tem_saldo: saldo_disponivel > 0                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (via OrdemServicoItem)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORDEM_SERVICO                              │
│  - numero (auto-incremento anual: 001/2024)                    │
│  - contrato (FK → Contrato) ⚠️ OBRIGATÓRIO                     │
│  - data                                                         │
│  - status: ABERTO | CANCELADO | FINALIZADO                     │
│  - empresa_solicitante (FK → Empresa)                          │
│  - empresa_pagadora (FK → Empresa)                             │
│  - responsavel (FK → User)                                     │
│                                                                 │
│  VALORES CALCULADOS:                                            │
│  - valor_servicos: soma dos itens                               │
│  - valor_despesas: soma das despesas                            │
│  - valor_total: valor_servicos + valor_despesas                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│     ORDEM_SERVICO_ITEM          │   │    DESPESA_ORDEM_SERVICO        │
│  - ordem_servico (FK)           │   │  - ordem_servico (FK)           │
│  - contrato_servico (FK)        │   │  - tipo_despesa (FK)            │
│  - quantidade                   │   │  - valor                        │
│  - valor_aplicado (read-only)   │   │  - observacao                   │
└─────────────────────────────────┘   │  - ativo                        │
                                      └─────────────────────────────────┘
```

### Catálogos (Dados Mestres)

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│         SERVICO                 │   │       TIPO_DESPESA              │
│  - item (nome)                  │   │  - item (nome)                  │
│  - descricao                    │   │  - descricao                    │
│  - valor_base                   │   │  - valor_base                   │
│  - ativo                        │   │  - ativo                        │
└─────────────────────────────────┘   └─────────────────────────────────┘
         │                                     │
         │ vinculado via                       │ vinculado via
         ▼                                     ▼
   ContratoServico                     DespesaOrdemServico
```

## Regras de Negócio Críticas

### 1. Controle de Saldo

```python
# ContratoServico.quantidade_executada
# Soma APENAS de OS que NÃO estão canceladas
total = self.itens_os.filter(
    ordem_servico__status__in=['ABERTO', 'FINALIZADO']
).aggregate(total=Sum('quantidade'))['total']
```

### 2. Validação de Quantidade na OS

O `OrdemServicoItemSerializer` valida que:
- `quantidade` não pode exceder `saldo_disponivel`
- Na edição, considera a quantidade atual do item como "liberada"

### 3. Valor Fixo do Contrato

- O `valor_aplicado` no `OrdemServicoItem` é **sempre** copiado do `ContratoServico.valor`
- Não é permitido negociar valores na OS
- O campo é `read_only` no serializer

## Estrutura de Arquivos

### Backend

```
backend/apps/
├── contratos/
│   ├── models.py           # Contrato, ContratoServico
│   ├── serializers.py      # Serializers
│   ├── views.py            # ViewSets + endpoints customizados
│   └── urls.py
│
└── ordem_servico/
    ├── models.py           # OrdemServico, OrdemServicoItem, 
    │                       # TipoDespesa, DespesaOrdemServico
    ├── serializers.py      # Serializers
    ├── views.py            # ViewSets
    └── urls.py
```

### Frontend

```
frontend/src/
├── services/
│   ├── contratos.js        # API calls para contratos
│   └── ordemServico.js     # API calls para OS, tipos despesa
│
├── hooks/
│   ├── useContratoForm.js  # Hook do formulário de contrato
│   └── useOrdemServicoForm.js  # Hook do formulário de OS
│
└── pages/
    ├── ContratoList.jsx
    ├── ContratoForm.jsx
    ├── OrdemServicoList.jsx
    ├── OrdemServicoForm.jsx
    └── EmpresaForm.jsx     # Gerencia contratos da empresa
```

## Endpoints da API

### Contratos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/contratos/` | Lista contratos |
| POST | `/api/v1/contratos/` | Cria contrato |
| GET | `/api/v1/contratos/{id}/` | Detalhe do contrato |
| PATCH | `/api/v1/contratos/{id}/` | Atualiza contrato |
| GET | `/api/v1/contratos/{id}/servicos/` | Lista serviços do contrato |
| GET | `/api/v1/contratos/{id}/servicos-disponiveis/` | Lista serviços COM SALDO |
| GET | `/api/v1/contratos/{id}/ordens-servico/` | Lista OS do contrato |
| GET | `/api/v1/contratos/ativos/` | Lista contratos ativos |
| POST | `/api/v1/contratos/{id}/ativar/` | Ativa contrato |
| POST | `/api/v1/contratos/{id}/finalizar/` | Finaliza contrato |
| POST | `/api/v1/contratos/{id}/cancelar/` | Cancela contrato |

### Ordens de Serviço

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/ordens-servico/` | Lista OS |
| POST | `/api/v1/ordens-servico/` | Cria OS |
| GET | `/api/v1/ordens-servico/{id}/` | Detalhe da OS |
| PATCH | `/api/v1/ordens-servico/{id}/` | Atualiza OS |
| GET | `/api/v1/ordens-servico/{id}/itens/` | Lista itens da OS |
| GET | `/api/v1/ordens-servico/{id}/despesas/` | Lista despesas da OS |
| POST | `/api/v1/ordens-servico/{id}/finalizar/` | Finaliza OS |
| POST | `/api/v1/ordens-servico/{id}/cancelar/` | Cancela OS |
| POST | `/api/v1/ordens-servico/{id}/recalcular/` | Recalcula totais |

### Tipos de Despesa

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/tipos-despesa/` | Lista tipos de despesa |
| POST | `/api/v1/tipos-despesa/` | Cria tipo de despesa |
| GET | `/api/v1/tipos-despesa/{id}/` | Detalhe |
| PATCH | `/api/v1/tipos-despesa/{id}/` | Atualiza |
| DELETE | `/api/v1/tipos-despesa/{id}/` | Remove |
| GET | `/api/v1/tipos-despesa/ativos/` | Lista ativos |

### Despesas da OS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/despesas-os/` | Lista despesas |
| POST | `/api/v1/despesas-os/` | Cria despesa |
| GET | `/api/v1/despesas-os/{id}/` | Detalhe |
| PATCH | `/api/v1/despesas-os/{id}/` | Atualiza |
| DELETE | `/api/v1/despesas-os/{id}/` | Remove |

## Interface do Usuário

### EmpresaForm - Contratos

Cada contrato no accordion possui botões de ação:
- **Cancelar** (vermelho) - Cancela o contrato (apenas para status ATIVO)
- **Finalizar** (verde) - Finaliza o contrato (apenas para status ATIVO)

### OrdemServicoForm - Despesas

A seleção de despesas agora usa autocomplete com tipos de despesa cadastrados:
- Ao selecionar um tipo, o valor_base é preenchido automaticamente
- O valor pode ser ajustado manualmente

## Troubleshooting Comum

### Erro: "Quantidade excede saldo disponível"

**Causa:** Tentativa de executar mais do que foi contratado.

**Solução:**
1. Verificar saldo em `/contratos/{id}/servicos/`
2. Aumentar quantidade no ContratoServico se necessário
3. Ou reduzir quantidade na OS

### Erro: "Contrato não está ativo"

**Causa:** Tentativa de criar OS para contrato cancelado/finalizado.

**Solução:**
1. Verificar status do contrato
2. Usar apenas contratos com status ATIVO

### Erro: "OS finalizada não pode ser alterada"

**Causa:** Tentativa de editar OS já finalizada.

**Solução:**
1. OS finalizadas são somente leitura
2. Se necessário, cancelar e criar nova OS

## Referência Rápida de Comandos

```bash
# Verificar tipos de despesa
docker compose exec backend python manage.py shell -c "
from apps.ordem_servico.models import TipoDespesa
for td in TipoDespesa.objects.filter(ativo=True):
    print(f'{td.item}: R$ {td.valor_base}')
"

# Verificar despesas de uma OS
docker compose exec backend python manage.py shell -c "
from apps.ordem_servico.models import DespesaOrdemServico
for d in DespesaOrdemServico.objects.all()[:5]:
    print(f'{d.tipo_despesa.item}: R$ {d.valor}')
"

# Verificar migrations
docker compose exec backend python manage.py makemigrations --dry-run
```
