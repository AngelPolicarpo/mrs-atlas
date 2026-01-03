from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpresaPrestadoraViewSet,
    ServicoViewSet,
    OrdemServicoViewSet,
    OrdemServicoItemViewSet,
    TipoDespesaViewSet,
    DespesaOrdemServicoViewSet,
    OrdemServicoTitularViewSet,
    OrdemServicoDependenteViewSet,
    DocumentoOSViewSet
)

router = DefaultRouter()
router.register(r'ordens-servico', OrdemServicoViewSet, basename='ordem-servico')
router.register(r'empresas-prestadoras', EmpresaPrestadoraViewSet, basename='empresa-prestadora')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'tipos-despesa', TipoDespesaViewSet, basename='tipo-despesa')
router.register(r'os-itens', OrdemServicoItemViewSet, basename='os-item')
router.register(r'despesas-os', DespesaOrdemServicoViewSet, basename='despesa-os')
router.register(r'os-titulares', OrdemServicoTitularViewSet, basename='os-titular')
router.register(r'os-dependentes', OrdemServicoDependenteViewSet, basename='os-dependente')
router.register(r'documentos-os', DocumentoOSViewSet, basename='documento-os')

urlpatterns = [
    path('', include(router.urls)),
]
