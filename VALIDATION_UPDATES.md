# Atualização de Validações - Atlas

## Resumo das Mudanças

### 1. **validation.js** - Novos Validadores e Formatadores

#### Formatadores Adicionados:
- **`formatEmail(value)`**: Converte email para lowercase e remove espaços
- **`formatTelefone(value)`**: Remove caracteres inválidos, mantém dígitos e símbolos especiais (+, -, (), espaço)
- **`formatFiliacao(value)`**: Mesma lógica do `formatNomeInput` - uppercase, remove acentos, apenas letras e espaços

#### Validadores Adicionados:
- **`validateFiliacao(value)`**: Mesmas regras do `validateNome`
  - Campo opcional (não obrigatório)
  - Mínimo 3 caracteres se preenchido
  - Deve conter nome e sobrenome (espaço obrigatório)
  
- **`validateEmail(value)`**: 
  - Campo opcional
  - Verifica padrão inválido (ex: "NÃO CONSTA")
  - Valida formato email: `usuario@dominio.com`
  
- **`validateTelefone(value)`**: 
  - Campo opcional
  - Aceita 10-15 dígitos
  - Suporta formato nacional (11 dígitos) e internacional (até 15 dígitos)
  - Formatos: `(11) 9 9999-9999`, `+55 11 99999-9999`, etc.

#### Objetos Exportados Atualizados:
```javascript
export const validators = {
  nome, filiacao_um, filiacao_dois, email, telefone,
  cpf, rnm, passaporte, ctps, cnh
}

export const formatters = {
  nome, filiacao_um, filiacao_dois, email, telefone,
  cpf, rnm, passaporte, ctps, cnh
}

export const cleaners = {
  nome, filiacao_um, filiacao_dois, email, telefone,
  cpf, rnm, passaporte, ctps, cnh
}
```

#### Funções Auxiliares Atualizadas:
- **`validateDocuments(data)`**: Agora valida filiacao_um, filiacao_dois, email e telefone
- **`cleanDataForSubmit(data)`**: Limpa os 4 novos campos antes de enviar ao backend

---

### 2. **useTitularForm.js** - Campo de País Adicionado

#### Alterações:
- Adicionado `pais_telefone: 'BR'` ao `emptyFormData`
- Adicionado `pais_telefone: 'País (Telefone)'` ao `fieldLabels`

---

### 3. **useDependenteForm.js** - Campo de País Adicionado

#### Alterações:
- Adicionado `pais_telefone: 'BR'` ao estado `formData`
- Adicionado `pais_telefone: 'País (Telefone)'` ao `fieldLabels`

---

### 4. **TitularForm.jsx** - Formulário Atualizado

#### Campos de Filiação (seção "Dados Pessoais"):
- Agora com formatador: `formatters.filiacao_um/dois`
- Agora com validador: `validators.filiacao_um/dois`
- Exibição de erros de validação

#### Seção "Contato" Redesenhada:
```jsx
Email
  - Formatador: converte para lowercase em tempo real
  - Validador: valida formato email ao sair do campo
  - Erro: exibe mensagem se formato inválido

Telefone
  - Formatador: limpa caracteres inválidos em tempo real
  - Validador: verifica se tem 10-15 dígitos ao sair do campo
  - Placeholder: "(00) 00000-0000 ou +55 11 99999-9999"
  - Erro: exibe mensagem se fora do intervalo

País (Telefone) - NOVO
  - Seletor com opções: BR, PT, US, FR, ES, IT, DE, GB, CA, AU, JP, CN
  - Padrão: Brasil (+55)
  - Permite ao usuário indicar país do telefone
```

#### Campos de Filiação Agora com Validação:
- Exibem mensagens de erro quando inválidas
- Formatação em tempo real (uppercase, acentos removidos)
- Placeholders informativos

---

### 5. **DependenteForm.jsx** - Filiação Atualizada

#### Importação:
- Adicionado import: `import { formatters, validators } from '../utils/validation'`

#### Campos de Filiação (seção "Dados Pessoais"):
- Agora com formatador: `formatters.filiacao_um/dois`
- Agora com validador: `validators.filiacao_um/dois`
- Exibição de erros de validação (classe `error-text`)
- Mesmo padrão do TitularForm

---

## Comportamento da Validação

### Email
- **Entrada**: `"  USUARIO@DOMINIO.COM  "`
- **Formatação em tempo real**: `"usuario@dominio.com"`
- **Validação ao blur**: ✅ Válido (formato correto)

### Telefone
- **Entrada**: `"(11) 98765-4321"` ou `"+55 11 98765-4321"`
- **Formatação em tempo real**: Remove caracteres inválidos
- **Validação ao blur**: ✅ Válido (11 dígitos = celular brasileiro)
- **Entrada**: `"1234"` (apenas 4 dígitos)
- **Validação ao blur**: ❌ Inválido (menos de 10 dígitos)

### Filiação
- **Entrada**: `"joao silva"`
- **Formatação em tempo real**: `"JOAO SILVA"`
- **Validação ao blur**: ✅ Válido (3+ caracteres, espaço presente)
- **Entrada**: `"João"`
- **Validação ao blur**: ❌ Inválido (sem sobrenome, sem espaço)

---

## Padrões Implementados

### Clean Code:
✅ Funções pequenas e testáveis
✅ Nomes descritivos (validateEmail, formatTelefone)
✅ Reutilização de lógica (validateFiliacao reutiliza normalizeNome)
✅ Separação de concerns (validação, formatação, limpeza)

### SOLID:
✅ **S**: Cada função valida um aspecto
✅ **O**: Aberto para extensão (novos validadores sem modificar código existente)
✅ **L**: Validadores seguem interface padrão `{ valid, error }`
✅ **I**: Importações específicas (não wildcard)

### User Experience:
✅ Feedback em tempo real (formatação)
✅ Validação ao sair do campo (blur)
✅ Mensagens de erro claras em português
✅ Placeholder informativos

---

## Próximas Pastas Sugeridas

1. Adicionar validação no backend (Express/FastAPI)
2. Teste unitário para novos validadores
3. Teste integração com submissão de formulário
4. Adicionar mais países ao seletor (dinâmico da API)
5. Suporte a máscaras telefônicas por país

