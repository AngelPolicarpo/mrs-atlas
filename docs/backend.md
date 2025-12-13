# 🐍 Backend - Django REST Framework

Este documento detalha a estrutura, modelos e APIs do backend Django.

---

## 📋 Índice

1. [Estrutura de Apps](#estrutura-de-apps)
2. [App: Accounts](#app-accounts)
3. [App: Titulares](#app-titulares)
4. [App: Empresa](#app-empresa)
5. [App: Core](#app-core)
6. [Autenticação e JWT](#autenticação-e-jwt)
7. [Sistema de Permissões](#sistema-de-permissões)
8. [Serializers e ViewSets](#serializers-e-viewsets)
9. [URLs e Rotas](#urls-e-rotas)
10. [Management Commands](#management-commands)

---

## 📁 Estrutura de Apps

```
backend/
├── apps/
│   ├── accounts/          # Identidade, acesso e vínculos
│   ├── titulares/         # Domínio principal (Titulares, Dependentes)
│   ├── empresa/           # Gestão de empresas
│   └── core/              # Entidades auxiliares
├── config/
│   ├── settings.py        # Configurações Django
│   ├── urls.py            # Rotas principais
│   └── wsgi.py
├── static/                # Arquivos estáticos (CSS Admin)
├── manage.py
├── requirements.txt
└── Dockerfile
```

---

## 👤 App: Accounts

### Responsabilidades
- Autenticação e gerenciamento de usuários
- Sistemas e Departamentos
- Vínculos de usuários com sistemas/departamentos
- Controle de acesso baseado em cargos

### Modelos

#### `Sistema`
Representa um módulo/aplicação do Atlas (ex: Prazos, Ordem de Serviço).

```python
class Sistema(models.Model):
    nome = models.CharField(max_length=100)          # "Sistema de Prazos"
    slug = models.SlugField(unique=True)             # "prazos"
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['nome']
```

#### `Departamento`
Representa uma área organizacional (ex: Consular, Jurídico).

```python
class Departamento(models.Model):
    nome = models.CharField(max_length=100)          # "Departamento Consular"
    slug = models.SlugField(unique=True)             # "consular"
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['nome']
```

#### `User` (Custom User Model)
Modelo de usuário personalizado usando email como identificador.

```python
class User(AbstractBaseUser, PermissionsMixin):
    class TipoUsuario(models.TextChoices):
        INTERNO = 'INTERNO', 'Usuário Interno'    # Funcionários
        CLIENTE = 'CLIENTE', 'Cliente Externo'    # Clientes da empresa
    
    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=255)
    tipo_usuario = models.CharField(
        max_length=10,
        choices=TipoUsuario.choices,
        default=TipoUsuario.INTERNO
    )
    empresa = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    # Campo `groups` herdado do PermissionsMixin → usado como "Cargo"
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']
    
    objects = UserManager()
```

**Métodos importantes:**

```python
def get_cargo(self):
    """Retorna o primeiro grupo (cargo) do usuário."""
    return self.groups.first()

def get_permissoes_list(self):
    """Retorna lista de permissões no formato 'app.action_model'."""
    cargo = self.get_cargo()
    if cargo:
        return list(cargo.permissions.values_list('codename', flat=True))
    return []

def get_todas_permissoes(self):
    """Retorna todas as permissões do usuário (cargo + individuais)."""
    return set(self.get_all_permissions())

def get_sistemas_disponiveis(self):
    """Retorna sistemas aos quais o usuário tem acesso via vínculos."""
    return Sistema.objects.filter(
        usuariovinculo__usuario=self,
        usuariovinculo__ativo=True,
        ativo=True
    ).distinct()

def get_departamentos_disponiveis(self, sistema=None):
    """Retorna departamentos disponíveis, opcionalmente filtrados por sistema."""
    qs = Departamento.objects.filter(
        usuariovinculo__usuario=self,
        usuariovinculo__ativo=True,
        ativo=True
    )
    if sistema:
        qs = qs.filter(usuariovinculo__sistema=sistema)
    return qs.distinct()
```

#### `UsuarioVinculo`
Tabela pivô que relaciona usuário com sistema e departamento.

```python
class UsuarioVinculo(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    sistema = models.ForeignKey(Sistema, on_delete=models.CASCADE)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['usuario', 'sistema', 'departamento']
        verbose_name = 'Vínculo de Usuário'
        verbose_name_plural = 'Vínculos de Usuários'
```

### Views de Autenticação

```python
# backend/apps/accounts/views.py

class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: {"email": "...", "password": "..."}
    Response: {"access": "...", "refresh": "...", "user": {...}}
    """
    permission_classes = [AllowAny]

class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: {"refresh": "..."}
    Blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

class RefreshTokenView(APIView):
    """
    POST /api/auth/refresh/
    Body: {"refresh": "..."}
    Response: {"access": "..."}
    """
    permission_classes = [AllowAny]

class UserView(APIView):
    """
    GET /api/auth/user/
    Response: User data + permissions + sistemas disponíveis
    """
    permission_classes = [IsAuthenticated]

class CheckPermissionView(APIView):
    """
    GET /api/auth/check-permission/?permission=titulares.delete_titular
    Response: {"has_permission": true/false}
    """
    permission_classes = [IsAuthenticated]
```

---

## 📋 App: Titulares

### Responsabilidades
- Gestão de titulares (estrangeiros)
- Dependentes de titulares
- Vínculos com empresas, consulados e amparos legais

### Modelos

#### `Titular`
Representa um estrangeiro/titular cadastrado no sistema.

```python
class Titular(models.Model):
    # Identificação
    nome = models.CharField(max_length=255)
    nome_social = models.CharField(max_length=255, blank=True)
    cpf = models.CharField(max_length=14, unique=True, null=True, blank=True)
    rnm = models.CharField(max_length=20, unique=True, null=True, blank=True)  # Registro Nacional Migratório
    passaporte = models.CharField(max_length=50, blank=True)
    
    # Dados pessoais
    nacionalidade = models.CharField(max_length=100)
    data_nascimento = models.DateField(null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=[('M', 'Masculino'), ('F', 'Feminino')])
    estado_civil = models.CharField(max_length=20, blank=True)
    
    # Contato
    email = models.EmailField(blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    
    # Endereço
    endereco = models.CharField(max_length=255, blank=True)
    numero = models.CharField(max_length=20, blank=True)
    complemento = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    uf = models.CharField(max_length=2, blank=True)
    cep = models.CharField(max_length=10, blank=True)
    
    # Mídia
    foto = models.ImageField(upload_to='titulares/fotos/', blank=True, null=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ativo = models.BooleanField(default=True)
    
    # Histórico via django-simple-history
    history = HistoricalRecords()
    
    class Meta:
        ordering = ['nome']
        verbose_name = 'Titular'
        verbose_name_plural = 'Titulares'
```

#### `VinculoTitular`
Relacionamento de titular com empresa, consulado ou amparo legal.

```python
class VinculoTitular(models.Model):
    titular = models.ForeignKey(
        Titular, 
        on_delete=models.CASCADE,
        related_name='vinculos'
    )
    empresa = models.ForeignKey(
        'empresa.Empresa',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    consulado = models.ForeignKey(
        'core.Consulado',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    amparo = models.ForeignKey(
        'core.Amparo',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    
    data_inicio = models.DateField()
    data_fim = models.DateField(null=True, blank=True)
    ativo = models.BooleanField(default=True)
    observacoes = models.TextField(blank=True)
    
    history = HistoricalRecords()
```

#### `Dependente`
Dependente de um titular (cônjuge, filhos, etc).

```python
class Dependente(models.Model):
    titular = models.ForeignKey(
        Titular,
        on_delete=models.CASCADE,
        related_name='dependentes'
    )
    
    # Identificação (similar ao Titular)
    nome = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, unique=True, null=True, blank=True)
    rnm = models.CharField(max_length=20, unique=True, null=True, blank=True)
    passaporte = models.CharField(max_length=50, blank=True)
    
    # Relação
    parentesco = models.CharField(max_length=50)  # cônjuge, filho, etc
    
    # Dados pessoais
    nacionalidade = models.CharField(max_length=100)
    data_nascimento = models.DateField(null=True, blank=True)
    sexo = models.CharField(max_length=1)
    
    ativo = models.BooleanField(default=True)
    history = HistoricalRecords()
```

### ViewSets

```python
# backend/apps/titulares/views.py

class TitularViewSet(viewsets.ModelViewSet):
    queryset = Titular.objects.filter(ativo=True)
    serializer_class = TitularSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filterset_fields = ['nacionalidade', 'ativo']
    search_fields = ['nome', 'cpf', 'rnm', 'passaporte', 'email']
    ordering_fields = ['nome', 'created_at']

class DependenteViewSet(viewsets.ModelViewSet):
    queryset = Dependente.objects.filter(ativo=True)
    serializer_class = DependenteSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filterset_fields = ['titular', 'parentesco']
    search_fields = ['nome', 'cpf', 'rnm']

class VinculoTitularViewSet(viewsets.ModelViewSet):
    queryset = VinculoTitular.objects.filter(ativo=True)
    serializer_class = VinculoTitularSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
```

---

## 🏢 App: Empresa

### Responsabilidades
- Cadastro e gestão de empresas
- Vinculação com titulares e usuários

### Modelo

```python
class Empresa(models.Model):
    class Status(models.TextChoices):
        ATIVA = 'ATIVA', 'Ativa'
        INATIVA = 'INATIVA', 'Inativa'
        SUSPENSA = 'SUSPENSA', 'Suspensa'
    
    # Identificação
    razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255, blank=True)
    cnpj = models.CharField(max_length=18, unique=True)
    inscricao_estadual = models.CharField(max_length=20, blank=True)
    inscricao_municipal = models.CharField(max_length=20, blank=True)
    
    # Contato
    email = models.EmailField(blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Endereço
    endereco = models.CharField(max_length=255, blank=True)
    numero = models.CharField(max_length=20, blank=True)
    complemento = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    uf = models.CharField(max_length=2, blank=True)
    cep = models.CharField(max_length=10, blank=True)
    
    # Status
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ATIVA
    )
    ativo = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()
```

### ViewSet

```python
class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = Empresa.objects.filter(ativo=True)
    serializer_class = EmpresaSerializer
    permission_classes = [IsAuthenticated, CargoBasedPermission]
    filterset_fields = ['status', 'uf', 'ativo']
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj']
```

---

## 🔧 App: Core

### Responsabilidades
- Tabelas auxiliares compartilhadas
- Tipos e categorias

### Modelos

```python
class Amparo(models.Model):
    """Tipo de amparo legal para estrangeiros."""
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

class TipoAtualizacao(models.Model):
    """Tipos de atualização cadastral."""
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

class Consulado(models.Model):
    """Consulados para vínculo."""
    nome = models.CharField(max_length=255)
    pais = models.CharField(max_length=100)
    cidade = models.CharField(max_length=100)
    ativo = models.BooleanField(default=True)
```

---

## 🔐 Autenticação e JWT

### Configuração SimpleJWT

```python
# config/settings.py

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### Fluxo de Autenticação

1. **Login:** `POST /api/auth/login/` → retorna `{access, refresh, user}`
2. **Requisições:** Header `Authorization: Bearer <access_token>`
3. **Refresh:** `POST /api/auth/refresh/` com `{refresh}` → retorna novo `{access}`
4. **Logout:** `POST /api/auth/logout/` com `{refresh}` → blacklist do token

---

## 🛡️ Sistema de Permissões

### `CargoBasedPermission`

```python
# backend/apps/accounts/permissions.py

class CargoBasedPermission(BasePermission):
    """
    Verifica permissões baseadas no cargo (Group) do usuário.
    Mapeia métodos HTTP para ações Django:
    - GET/HEAD/OPTIONS → view
    - POST → add
    - PUT/PATCH → change
    - DELETE → delete
    """
    
    message = 'Você não tem permissão para realizar esta ação.'
    
    def get_permission_required(self, request, view):
        """Determina a permissão necessária baseada no método HTTP."""
        model = view.queryset.model
        app_label = model._meta.app_label
        model_name = model._meta.model_name
        
        method_map = {
            'GET': 'view',
            'HEAD': 'view',
            'OPTIONS': 'view',
            'POST': 'add',
            'PUT': 'change',
            'PATCH': 'change',
            'DELETE': 'delete',
        }
        
        action = method_map.get(request.method, 'view')
        return f'{app_label}.{action}_{model_name}'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        permission_required = self.get_permission_required(request, view)
        has_perm = request.user.has_perm(permission_required)
        
        if not has_perm:
            action_messages = {
                'add': 'criar',
                'change': 'editar',
                'delete': 'excluir',
                'view': 'visualizar'
            }
            action = permission_required.split('.')[-1].split('_')[0]
            self.message = f'Você não tem permissão para {action_messages.get(action, "realizar esta ação")}.'
        
        return has_perm
```

### Backend de Autenticação

```python
# backend/apps/accounts/backends.py

class CustomModelBackend(ModelBackend):
    """Backend que retorna permissões como strings."""
    
    def _get_group_permissions(self, user_obj):
        """Retorna permissões dos grupos como 'app.codename'."""
        return Permission.objects.filter(
            group__user=user_obj
        ).values_list(
            'content_type__app_label', 
            'codename'
        )
    
    def get_all_permissions(self, user_obj, obj=None):
        if not user_obj.is_active:
            return set()
        
        perms = set()
        for app_label, codename in self._get_group_permissions(user_obj):
            perms.add(f'{app_label}.{codename}')
        
        return perms
```

---

## 📝 Serializers e ViewSets

### Exemplo: TitularSerializer

```python
class TitularSerializer(serializers.ModelSerializer):
    vinculos = VinculoTitularSerializer(many=True, read_only=True)
    dependentes = DependenteListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Titular
        fields = [
            'id', 'nome', 'nome_social', 'cpf', 'rnm', 'passaporte',
            'nacionalidade', 'data_nascimento', 'sexo', 'estado_civil',
            'email', 'telefone', 'endereco', 'numero', 'complemento',
            'bairro', 'cidade', 'uf', 'cep', 'foto',
            'vinculos', 'dependentes',
            'created_at', 'updated_at', 'ativo'
        ]
        read_only_fields = ['created_at', 'updated_at']
```

---

## 🔗 URLs e Rotas

```python
# config/urls.py

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.accounts.api_urls')),
    path('api/v1/', include('apps.titulares.urls')),
    path('api/v1/', include('apps.empresa.urls')),
    path('api/v1/', include('apps.core.urls')),
]

# apps/accounts/urls.py (auth)
urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('user/', UserView.as_view(), name='user'),
    path('check-permission/', CheckPermissionView.as_view(), name='check_permission'),
]

# apps/titulares/urls.py
router = DefaultRouter()
router.register('titulares', TitularViewSet)
router.register('dependentes', DependenteViewSet)
router.register('vinculos-titular', VinculoTitularViewSet)
urlpatterns = router.urls
```

---

## 🛠️ Management Commands

### `setup_access`
Cria sistemas, departamentos e cargos padrão.

```bash
python manage.py setup_access
```

**Implementação:**
```python
# apps/accounts/management/commands/setup_access.py

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Criar Sistemas
        sistemas = [
            {'nome': 'Sistema de Prazos', 'slug': 'prazos'},
            {'nome': 'Ordem de Serviço', 'slug': 'ordem_servico'},
        ]
        for s in sistemas:
            Sistema.objects.get_or_create(slug=s['slug'], defaults=s)
        
        # Criar Departamentos
        departamentos = [
            {'nome': 'Consular', 'slug': 'consular'},
            {'nome': 'Jurídico', 'slug': 'juridico'},
            {'nome': 'TI', 'slug': 'ti'},
            {'nome': 'RH', 'slug': 'rh'},
        ]
        for d in departamentos:
            Departamento.objects.get_or_create(slug=d['slug'], defaults=d)
        
        # Criar Cargos (Groups)
        for nome in ['Consultor', 'Gestor', 'Diretor']:
            Group.objects.get_or_create(name=nome)
```

### `setup_cargo_permissions`
Configura permissões de cada cargo.

```bash
python manage.py setup_cargo_permissions
```

**Implementação:**
```python
class Command(BaseCommand):
    def handle(self, *args, **options):
        # Modelos que recebem permissões
        models = ['titular', 'dependente', 'empresa', 'usuario', 'usuariovinculo']
        
        # Permissões por cargo
        cargo_perms = {
            'Consultor': ['view'],
            'Gestor': ['view', 'add', 'change'],
            'Diretor': ['view', 'add', 'change', 'delete'],
        }
        
        for cargo_name, actions in cargo_perms.items():
            cargo = Group.objects.get(name=cargo_name)
            cargo.permissions.clear()
            
            for model in models:
                for action in actions:
                    codename = f'{action}_{model}'
                    try:
                        perm = Permission.objects.get(codename=codename)
                        cargo.permissions.add(perm)
                    except Permission.DoesNotExist:
                        pass
```

---

## 🔗 Próxima Leitura

- [Frontend](frontend.md) - Estrutura React e componentes
- [Permissões](permissoes.md) - Sistema RBAC detalhado
- [Arquitetura](arquitetura.md) - Visão geral do sistema
