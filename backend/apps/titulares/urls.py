from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TitularViewSet, VinculoTitularViewSet, DependenteViewSet

router = DefaultRouter()
router.register(r'titulares', TitularViewSet, basename='titular')
router.register(r'vinculos', VinculoTitularViewSet, basename='vinculo')
router.register(r'dependentes', DependenteViewSet, basename='dependente')

urlpatterns = [
    path('', include(router.urls)),
]
