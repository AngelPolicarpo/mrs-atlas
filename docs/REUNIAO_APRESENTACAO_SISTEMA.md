# 📋 Reunião de Apresentação do Sistema Atlas

**Data:** Janeiro/2026  
**Objetivo:** Contextualizar as funcionalidades e melhorias implementadas no sistema Atlas para stakeholders não-técnicos.

---

## 🎯 Agenda da Reunião

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Principais Funcionalidades](#2-principais-funcionalidades)
3. [Melhorias Recentes](#3-melhorias-recentes)
4. [Segurança e Controle de Acesso](#4-segurança-e-controle-de-acesso)
5. [Exportação de Dados](#5-exportação-de-dados)
6. [Custos e Infraestrutura](#6-custos-e-infraestrutura)
7. [Próximos Passos](#7-próximos-passos)

---

## 1. Visão Geral do Sistema

### O que é o Atlas?
O Atlas é um sistema de gestão desenvolvido para a MRS, focado em:

- **Gestão de Titulares e Dependentes**: Controle completo de pessoas vinculadas à empresa
- **Controle de Prazos**: Monitoramento de vencimentos de documentos e vínculos
- **Ordens de Serviço**: Gerenciamento de serviços prestados
- **Contratos**: Administração de contratos com empresas e prestadores

### Quem usa o sistema?
| Perfil | Acesso |
|--------|--------|
| **Consultor** | Visualização de dados |
| **Gestor** | Visualização + Edição |
| **Diretor** | Acesso total + Configurações |

---

## 2. Principais Funcionalidades

### 📁 Módulo de Titulares
- Cadastro completo de titulares (nome, documentos, nacionalidade)
- Vinculação com empresas ou como particular
- Controle de dependentes (cônjuge, filhos, etc.)
- Histórico de vínculos

### 📋 Módulo de Ordens de Serviço
- Abertura e acompanhamento de OS
- Vinculação com contratos
- Controle de status (Aberta, Finalizada, Cancelada)
- Cálculo automático de valores

### 📄 Módulo de Contratos
- Cadastro de contratos com empresas
- Definição de serviços e valores
- Vinculação com prestadoras

### 🔍 Pesquisa Avançada de Prazos
- Busca unificada de titulares e dependentes 
- Filtros por nacionalidade, empresa, status
- Controle de prazos (vencimentos em 30, 60, 90 dias)
- Exportação de resultados

### 🔍 Pesquisa Avançada de Ordem de Serviços
- Busca unificada de ordem de serviços e contratos 
- Filtros por empresa, data, solicitante, status, valor etc
- Exportação de resultados e PDF da OS

### 📋 Validação de Documentos
- Verifica a existência do registro no banco de dados e a integridade do documento

---

## 3. Melhorias Recentes

### ✅ Sistema de Permissões Aprimorado
**Antes:** Usuários viam telas de erro ao acessar áreas sem permissão.

**Agora:** 
- Menus aparecem apenas para quem tem acesso
- Mensagens claras quando não há permissão
- Separação por módulos (Prazos vs Ordens de Serviço)

### ✅ Exportação de Dados Robusta
**Antes:** Exportação limitada a ~1.000 registros.

**Agora:**
- Exportação de até 50.000 registros
- Suporte a CSV, Excel (XLSX) e PDF
- Barra de progresso durante exportação
- Aviso para grandes volumes de dados

### ✅ Campos de Busca Inteligentes
**Antes:** Campos de busca básicos com pouca usabilidade.

**Agora:**
- Sugestões automáticas ao digitar
- Visual moderno com dropdown estilizado
- Navegação por teclado (setas + Enter)
- Funciona em todos os filtros de pesquisa

### ✅ Dashboard com Informações Atualizadas
- Exibição de data de criação e última atualização
- Indicadores visuais de status
- Resumo de vínculos ativos/inativos

---

## 4. Segurança e Controle de Acesso

### Níveis de Acesso
```
┌─────────────────────────────────────────────────────────┐
│                      DIRETOR                            │
│    Acesso total a todos os módulos e configurações      │
├─────────────────────────────────────────────────────────┤
│                       GESTOR                            │
│         Visualização + Criação + Edição                 │
├─────────────────────────────────────────────────────────┤
│                     CONSULTOR                           │
│              Apenas visualização                        │
└─────────────────────────────────────────────────────────┘
```

### Isolamento por Sistema
- **Sistema de Prazos**: Titulares, Dependentes, Pesquisa Avançada
- **Sistema de OS**: Ordens de Serviço, Contratos, Prestadoras

> Um usuário pode ter acesso a apenas um sistema ou a ambos, conforme necessidade.

### Proteções Implementadas
- ✅ Autenticação obrigatória (login/senha)
- ✅ Tokens de sessão com expiração
- ✅ Logs de acesso
- ✅ Bloqueio de ações não autorizadas

---

## 5. Exportação de Dados

### Formatos Disponíveis
| Formato | Uso Recomendado |
|---------|-----------------|
| **CSV** | Importação em outros sistemas |
| **Excel (XLSX)** | Análises e relatórios |
| **PDF** | Impressão e compartilhamento |

### Limites e Capacidades
- **Exportação por página**: Imediata (registros visíveis)
- **Exportação completa**: Até 50.000 registros
- **Aviso automático**: Acima de 10.000 registros
- **Tempo estimado**: ~1 minuto para 30.000 registros

### Campos Exportados (Pesquisa de Titulares)
- Nome, Tipo (Titular/Dependente)
- Documentos (RNM, CPF, Passaporte)
- Nacionalidade, Empresa
- Status do vínculo, Data de vencimento

---

## 6. Custos e Infraestrutura

### Arquitetura Atual
```
┌──────────────────────────────────────────────────────┐
│                    USUÁRIOS                          │
│              (Navegador Web)                         │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│                  SERVIDOR WEB                        │
│            (Interface do Sistema)                    │
│                   React.js                           │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              SERVIDOR DE APLICAÇÃO                   │
│            (Lógica de Negócio)                       │
│               Django/Python                          │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│               BANCO DE DADOS                         │
│          (Armazenamento de Dados)                    │
│                PostgreSQL                            │
└──────────────────────────────────────────────────────┘
```

### Considerações de Custo em Nuvem

#### Opção 1: Servidor Dedicado (VPS)
| Item | Custo Estimado/Mês |
|------|-------------------|
| Servidor (4GB RAM, 2 CPU) | R$ 150 - R$ 300 |
| Banco de Dados | Incluso ou R$ 50 - R$ 100 |
| Backup automático | R$ 20 - R$ 50 |
| **Total** | **R$ 200 - R$ 450** |

#### Opção 2: Nuvem Escalável (AWS/Azure/GCP)
| Item | Custo Estimado/Mês |
|------|-------------------|
| Servidor de aplicação | R$ 200 - R$ 500 |
| Banco de Dados gerenciado | R$ 150 - R$ 400 |
| Armazenamento | R$ 30 - R$ 100 |
| Backup e redundância | R$ 50 - R$ 150 |
| **Total** | **R$ 430 - R$ 1.150** |

#### Fatores que Influenciam o Custo
- 📊 **Volume de dados**: Mais registros = mais armazenamento
- 👥 **Usuários simultâneos**: Mais acessos = mais processamento
- 🔄 **Frequência de backup**: Backups mais frequentes = mais custo
- 🌍 **Disponibilidade**: Alta disponibilidade (99.9%) custa mais

### Recomendação
Para o volume atual do Atlas (~30.000+ registros, poucos usuários simultâneos):
> **Servidor VPS** é suficiente e mais econômico (R$ 200-300/mês)

---

## 7. Próximos Passos

### Curto Prazo (1-3 meses)
- [ ] Treinamento de usuários nas novas funcionalidades
- [ ] Ajustes finos baseados em feedback
- [ ] Documentação de procedimentos operacionais

### Médio Prazo (3-6 meses)
- [ ] Relatórios automatizados por e-mail
- [ ] Dashboard com gráficos e indicadores
- [ ] Integração com outros sistemas (se necessário)

### Longo Prazo (6-12 meses)
- [ ] Aplicativo mobile para consultas
- [ ] Notificações automáticas de vencimentos
- [ ] Módulo de auditoria avançado

---

## 📌 Pontos para Discussão

1. **Prioridades**: Quais funcionalidades são mais urgentes?
2. **Usuários**: Quantos usuários terão acesso? Quais perfis?
3. **Hospedagem**: Preferência por servidor próprio ou nuvem?
4. **Backups**: Qual frequência de backup é adequada?
5. **Suporte**: Como será o suporte e manutenção?

---

## 📞 Contato para Dúvidas

Para questões técnicas ou operacionais sobre o sistema, entrar em contato com a equipe de desenvolvimento.

---

*Documento preparado para reunião de apresentação do Sistema Atlas - MRS*
