from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'accounts'

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('users/me/', views.CurrentUserView.as_view(), name='current-user'),
    path('users/me/export/', views.LGPDDataExportView.as_view(), name='lgpd-export'),
    path('users/me/delete/', views.LGPDDeleteAccountView.as_view(), name='lgpd-delete'),
]
