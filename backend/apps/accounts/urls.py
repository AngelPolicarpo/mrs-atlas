from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from . import views

app_name = 'accounts'

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    # Rotas específicas devem vir ANTES do router
    path('users/search/', views.UserSearchView.as_view(), name='user-search'),
    path('users/me/', views.CurrentUserView.as_view(), name='current-user'),
    path('users/me/export/', views.LGPDDataExportView.as_view(), name='lgpd-export'),
    path('users/me/delete/', views.LGPDDeleteAccountView.as_view(), name='lgpd-delete'),
    path('check-permission/', views.CheckPermissionView.as_view(), name='check-permission'),
    # Router por último
    path('', include(router.urls)),
]

# URLs de autenticação
auth_urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('password/change/', views.ChangePasswordView.as_view(), name='password-change'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('user/', views.CurrentUserView.as_view(), name='auth-user'),
]
