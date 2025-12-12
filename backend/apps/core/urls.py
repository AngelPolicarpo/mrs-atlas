from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AmparoLegalViewSet,
    TipoAtualizacaoViewSet
)

router = DefaultRouter()
router.register(r'amparos-legais', AmparoLegalViewSet, basename='amparo-legal')
router.register(r'tipos-atualizacao', TipoAtualizacaoViewSet, basename='tipo-atualizacao')

urlpatterns = [
    path('', include(router.urls)),
]
