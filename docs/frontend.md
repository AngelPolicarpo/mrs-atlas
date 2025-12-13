# ⚛️ Frontend - React + Vite

Este documento detalha a estrutura, componentes e fluxos do frontend React.

---

## 📋 Índice

1. [Estrutura de Pastas](#estrutura-de-pastas)
2. [Configuração do Vite](#configuração-do-vite)
3. [Roteamento](#roteamento)
4. [Context API](#context-api)
5. [Hooks Personalizados](#hooks-personalizados)
6. [Serviços de API](#serviços-de-api)
7. [Páginas](#páginas)
8. [Componentes](#componentes)
9. [Guards de Permissão](#guards-de-permissão)
10. [Estilização](#estilização)

---

## 📁 Estrutura de Pastas

```
frontend/src/
├── components/              # Componentes reutilizáveis
│   ├── Header/             
│   │   ├── Header.jsx
│   │   └── Header.module.css
│   ├── Sidebar/            
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.module.css
│   ├── PermissionGuard/    
│   │   └── PermissionGuard.jsx
│   └── common/             
│       ├── Button/
│       ├── Input/
│       ├── Modal/
│       └── Table/
│
├── context/                 # Estado global (Context API)
│   ├── AuthContext.jsx      # Autenticação
│   ├── PermissionContext.jsx # Permissões RBAC
│   └── SystemContext.jsx    # Sistema/Departamento ativo
│
├── hooks/                   # Custom hooks
│   ├── useAuth.js
│   ├── useModelPermissions.js
│   └── useLocalStorage.js
│
├── pages/                   # Páginas/Rotas
│   ├── Dashboard/
│   ├── Login/
│   ├── TitularList/
│   ├── TitularForm/
│   ├── DependenteList/
│   ├── DependenteForm/
│   ├── EmpresaList/
│   ├── EmpresaForm/
│   ├── UserList/
│   ├── UserForm/
│   ├── Pesquisa/
│   ├── Configuracoes/
│   ├── SystemSelector/
│   └── NoAccess/
│
├── services/                # Camada de comunicação API
│   ├── api.js               # Axios instance + interceptors
│   ├── auth.js              # Endpoints autenticação
│   ├── titulares.js         # CRUD titulares
│   ├── dependentes.js       # CRUD dependentes
│   ├── empresas.js          # CRUD empresas
│   └── usuarios.js          # CRUD usuários
│
├── utils/                   # Utilitários
│   ├── formatters.js        # Formatação (CPF, CNPJ, datas)
│   ├── validators.js        # Validações
│   └── constants.js         # Constantes
│
├── App.jsx                  # Componente raiz + rotas
├── main.jsx                 # Entry point
└── index.css                # Estilos globais
```

---

## ⚙️ Configuração do Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@context': '/src/context',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
    }
  }
})
```

### Variáveis de Ambiente

```env
# .env.local ou .env
VITE_API_URL=http://localhost:8000
```

---

## 🛤️ Roteamento

### Estrutura de Rotas (`App.jsx`)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { SystemProvider } from './context/SystemContext';

// Wrappers
import ProtectedRoute from './components/ProtectedRoute';
import PermissionWrapper from './components/PermissionWrapper';
import SystemCheck from './components/SystemCheck';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TitularList from './pages/TitularList';
import TitularForm from './pages/TitularForm';
// ... outras páginas

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <SystemProvider>
            <Routes>
              {/* Rota pública */}
              <Route path="/login" element={<Login />} />
              
              {/* Rotas protegidas */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <PermissionWrapper>
                      <SystemCheck>
                        <AppRoutes />
                      </SystemCheck>
                    </PermissionWrapper>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </SystemProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Titulares */}
      <Route path="/titulares" element={<TitularList />} />
      <Route path="/titulares/novo" element={<TitularForm />} />
      <Route path="/titulares/:id" element={<TitularForm />} />
      
      {/* Dependentes */}
      <Route path="/dependentes" element={<DependenteList />} />
      <Route path="/dependentes/novo" element={<DependenteForm />} />
      <Route path="/dependentes/:id" element={<DependenteForm />} />
      
      {/* Empresas */}
      <Route path="/empresas" element={<EmpresaList />} />
      <Route path="/empresas/novo" element={<EmpresaForm />} />
      <Route path="/empresas/:id" element={<EmpresaForm />} />
      
      {/* Pesquisa */}
      <Route path="/pesquisa" element={<Pesquisa />} />
      
      {/* Sistema */}
      <Route path="/selecionar-sistema" element={<SystemSelector />} />
      <Route path="/sem-acesso" element={<NoAccess />} />
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
```

### Fluxo de Proteção

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────┐
│    Route     │────►│  ProtectedRoute  │────►│ Permission  │────►│ System  │
│              │     │  (verifica JWT)  │     │   Wrapper   │     │  Check  │
└──────────────┘     └──────────────────┘     └─────────────┘     └─────────┘
                              │                      │                  │
                              ▼                      ▼                  ▼
                        Se não logado           Carrega             Verifica se
                        → /login                permissões          tem sistema
                                               do usuário           selecionado
```

---

## 🎯 Context API

### AuthContext

Gerencia autenticação, tokens e dados do usuário.

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se há token salvo ao carregar
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.get('/api/auth/user/');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login/', { email, password });
    const { access, refresh, user: userData } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    setUser(userData);
    setIsAuthenticated(true);
    
    return userData;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await api.post('/api/auth/logout/', { refresh });
      }
    } catch (error) {
      // Ignora erros no logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### PermissionContext

Gerencia permissões RBAC do usuário.

```jsx
// context/PermissionContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [cargo, setCargo] = useState(null);

  // Carrega permissões quando o usuário loga
  useEffect(() => {
    if (isAuthenticated && user) {
      setPermissions(user.permissions || []);
      setCargo(user.cargo || null);
    } else {
      setPermissions([]);
      setCargo(null);
    }
  }, [isAuthenticated, user]);

  // Verifica se tem uma permissão específica
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  // Verifica permissão de modelo (ex: 'titulares.delete_titular')
  const checkModelPermission = useCallback(async (permission) => {
    try {
      const response = await api.get('/api/auth/check-permission/', {
        params: { permission }
      });
      return response.data.has_permission;
    } catch (error) {
      return false;
    }
  }, []);

  // Helpers para verificar por ação
  const canView = useCallback((model) => {
    return hasPermission(`view_${model}`) || 
           permissions.some(p => p.endsWith(`view_${model}`));
  }, [hasPermission, permissions]);

  const canAdd = useCallback((model) => {
    return hasPermission(`add_${model}`) || 
           permissions.some(p => p.endsWith(`add_${model}`));
  }, [hasPermission, permissions]);

  const canChange = useCallback((model) => {
    return hasPermission(`change_${model}`) || 
           permissions.some(p => p.endsWith(`change_${model}`));
  }, [hasPermission, permissions]);

  const canDelete = useCallback((model) => {
    return hasPermission(`delete_${model}`) || 
           permissions.some(p => p.endsWith(`delete_${model}`));
  }, [hasPermission, permissions]);

  const value = {
    permissions,
    cargo,
    hasPermission,
    checkModelPermission,
    canView,
    canAdd,
    canChange,
    canDelete,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionContext);
```

### SystemContext

Gerencia sistema e departamento selecionado.

```jsx
// context/SystemContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SystemContext = createContext();

export function SystemProvider({ children }) {
  const [sistemas, setSistemas] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedSistema, setSelectedSistema] = useState(null);
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);

  // Carregar sistemas disponíveis
  const loadSistemas = async () => {
    const response = await api.get('/api/v1/sistemas/');
    setSistemas(response.data);
  };

  // Carregar departamentos do sistema selecionado
  const loadDepartamentos = async (sistemaId) => {
    const response = await api.get('/api/v1/departamentos/', {
      params: { sistema: sistemaId }
    });
    setDepartamentos(response.data);
  };

  // Selecionar sistema/departamento
  const setContext = async (sistemaId, departamentoId) => {
    await api.post('/api/v1/usuarios/set-context/', {
      sistema_id: sistemaId,
      departamento_id: departamentoId
    });
    
    setSelectedSistema(sistemas.find(s => s.id === sistemaId));
    setSelectedDepartamento(departamentos.find(d => d.id === departamentoId));
    
    // Salvar em localStorage para persistir
    localStorage.setItem('selected_sistema', sistemaId);
    localStorage.setItem('selected_departamento', departamentoId);
  };

  const value = {
    sistemas,
    departamentos,
    selectedSistema,
    selectedDepartamento,
    loadSistemas,
    loadDepartamentos,
    setContext,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

export const useSystem = () => useContext(SystemContext);
```

---

## 🪝 Hooks Personalizados

### useModelPermissions

Hook para verificar permissões de um modelo específico.

```jsx
// hooks/useModelPermissions.js
import { useMemo } from 'react';
import { usePermissions } from '../context/PermissionContext';

export function useModelPermissions(modelName) {
  const { permissions, canView, canAdd, canChange, canDelete } = usePermissions();

  const modelPermissions = useMemo(() => ({
    canView: canView(modelName),
    canAdd: canAdd(modelName),
    canChange: canChange(modelName),
    canDelete: canDelete(modelName),
  }), [modelName, canView, canAdd, canChange, canDelete]);

  return modelPermissions;
}

// Uso:
// const { canView, canAdd, canChange, canDelete } = useModelPermissions('titular');
```

### useLocalStorage

Hook para persistir estado no localStorage.

```jsx
// hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

---

## 🌐 Serviços de API

### Axios Instance

```jsx
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: adiciona token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e não é retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Service de Titulares

```jsx
// services/titulares.js
import api from './api';

const titularesService = {
  list: (params = {}) => api.get('/api/v1/titulares/', { params }),
  
  get: (id) => api.get(`/api/v1/titulares/${id}/`),
  
  create: (data) => api.post('/api/v1/titulares/', data),
  
  update: (id, data) => api.patch(`/api/v1/titulares/${id}/`, data),
  
  delete: (id) => api.delete(`/api/v1/titulares/${id}/`),
  
  search: (query) => api.get('/api/v1/titulares/', { 
    params: { search: query } 
  }),
};

export default titularesService;
```

---

## 📄 Páginas

### TitularList

Exemplo de página com controle de permissões.

```jsx
// pages/TitularList/TitularList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModelPermissions } from '../../hooks/useModelPermissions';
import { ModelPermissionGuard } from '../../components/PermissionGuard';
import titularesService from '../../services/titulares';
import styles from './TitularList.module.css';

export default function TitularList() {
  const [titulares, setTitulares] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { canAdd, canChange, canDelete } = useModelPermissions('titular');

  useEffect(() => {
    loadTitulares();
  }, []);

  const loadTitulares = async () => {
    try {
      const response = await titularesService.list();
      setTitulares(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar titulares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      alert('Você não tem permissão para excluir titulares.');
      return;
    }
    
    if (confirm('Deseja realmente excluir este titular?')) {
      try {
        await titularesService.delete(id);
        loadTitulares();
      } catch (error) {
        alert(error.response?.data?.detail || 'Erro ao excluir');
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Titulares</h1>
        
        {/* Botão Novo só aparece se tiver permissão */}
        <ModelPermissionGuard model="titular" action="add">
          <Link to="/titulares/novo" className={styles.btnNew}>
            + Novo Titular
          </Link>
        </ModelPermissionGuard>
      </header>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>RNM</th>
              <th>Nacionalidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {titulares.map(titular => (
              <tr key={titular.id}>
                <td>{titular.nome}</td>
                <td>{titular.cpf}</td>
                <td>{titular.rnm}</td>
                <td>{titular.nacionalidade}</td>
                <td className={styles.actions}>
                  <Link to={`/titulares/${titular.id}`}>
                    {canChange ? 'Editar' : 'Ver'}
                  </Link>
                  
                  {/* Botão Excluir só aparece se tiver permissão */}
                  <ModelPermissionGuard model="titular" action="delete">
                    <button onClick={() => handleDelete(titular.id)}>
                      Excluir
                    </button>
                  </ModelPermissionGuard>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 🧱 Componentes

### PermissionGuard

Renderiza conteúdo condicionalmente baseado em permissões.

```jsx
// components/PermissionGuard/PermissionGuard.jsx
import { usePermissions } from '../../context/PermissionContext';

/**
 * Guard genérico por permissão completa
 * Uso: <PermissionGuard permission="titulares.delete_titular">...</PermissionGuard>
 */
export function PermissionGuard({ permission, children, fallback = null }) {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(permission)) {
    return children;
  }
  
  return fallback;
}

/**
 * Guard por modelo e ação
 * Uso: <ModelPermissionGuard model="titular" action="delete">...</ModelPermissionGuard>
 */
export function ModelPermissionGuard({ model, action, children, fallback = null }) {
  const { canView, canAdd, canChange, canDelete } = usePermissions();
  
  const actionMap = {
    view: canView,
    add: canAdd,
    change: canChange,
    delete: canDelete,
  };
  
  const checkFn = actionMap[action];
  
  if (checkFn && checkFn(model)) {
    return children;
  }
  
  return fallback;
}
```

### Header

```jsx
// components/Header/Header.jsx
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { selectedSistema, selectedDepartamento } = useSystem();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>Atlas</h1>
      </div>
      
      <div className={styles.context}>
        {selectedSistema && (
          <span>{selectedSistema.nome}</span>
        )}
        {selectedDepartamento && (
          <span> / {selectedDepartamento.nome}</span>
        )}
      </div>
      
      <div className={styles.user}>
        <span>{user?.nome}</span>
        <span className={styles.cargo}>{user?.cargo?.name}</span>
        <button onClick={logout}>Sair</button>
      </div>
    </header>
  );
}
```

### Sidebar

```jsx
// components/Sidebar/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { ModelPermissionGuard } from '../PermissionGuard';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <ul>
        <li>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </li>
        
        <ModelPermissionGuard model="titular" action="view">
          <li>
            <NavLink to="/titulares">Titulares</NavLink>
          </li>
        </ModelPermissionGuard>
        
        <ModelPermissionGuard model="dependente" action="view">
          <li>
            <NavLink to="/dependentes">Dependentes</NavLink>
          </li>
        </ModelPermissionGuard>
        
        <ModelPermissionGuard model="empresa" action="view">
          <li>
            <NavLink to="/empresas">Empresas</NavLink>
          </li>
        </ModelPermissionGuard>
        
        <li>
          <NavLink to="/pesquisa">Pesquisa</NavLink>
        </li>
      </ul>
    </nav>
  );
}
```

---

## 🛡️ Guards de Permissão

### ProtectedRoute

Protege rotas que requerem autenticação.

```jsx
// components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

### SystemCheck

Verifica se usuário selecionou sistema/departamento.

```jsx
// components/SystemCheck.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

export default function SystemCheck({ children }) {
  const { selectedSistema, selectedDepartamento } = useSystem();
  const location = useLocation();

  // Permite acesso à página de seleção
  if (location.pathname === '/selecionar-sistema') {
    return children;
  }

  // Se não tem sistema selecionado, redireciona
  if (!selectedSistema || !selectedDepartamento) {
    return <Navigate to="/selecionar-sistema" replace />;
  }

  return children;
}
```

---

## 🎨 Estilização

### CSS Modules

O projeto usa CSS Modules para escopo local de estilos.

```css
/* pages/TitularList/TitularList.module.css */
.container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btnNew {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.actions {
  display: flex;
  gap: 10px;
}
```

### Variáveis Globais

```css
/* index.css */
:root {
  --primary-color: #1976d2;
  --secondary-color: #424242;
  --success-color: #4caf50;
  --error-color: #f44336;
  --warning-color: #ff9800;
  --background-color: #f5f5f5;
  --text-color: #333;
  --border-radius: 4px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
}
```

---

## 🔗 Próxima Leitura

- [Permissões](permissoes.md) - Sistema RBAC detalhado
- [Backend](backend.md) - APIs e endpoints
- [Arquitetura](arquitetura.md) - Visão geral do sistema
