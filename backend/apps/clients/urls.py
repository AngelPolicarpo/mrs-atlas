from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'clients'

router = DefaultRouter()
router.register(r'clients', views.ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'clients/<int:client_pk>/documents/',
        views.ClientDocumentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='client-documents-list'
    ),
    path(
        'clients/<int:client_pk>/documents/<int:pk>/',
        views.ClientDocumentViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name='client-documents-detail'
    ),
]
