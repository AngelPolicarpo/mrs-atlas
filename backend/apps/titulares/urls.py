from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TitularViewSet, VinculoTitularViewSet, DependenteViewSet, VinculoDependenteViewSet, PesquisaUnificadaViewSet

router = DefaultRouter()
router.register(r'titulares', TitularViewSet, basename='titular')
router.register(r'vinculos', VinculoTitularViewSet, basename='vinculo')
router.register(r'dependentes', DependenteViewSet, basename='dependente')
router.register(r'vinculos-dependentes', VinculoDependenteViewSet, basename='vinculo-dependente')
router.register(r'pesquisa', PesquisaUnificadaViewSet, basename='pesquisa')

urlpatterns = [
    path('', include(router.urls)),
]
