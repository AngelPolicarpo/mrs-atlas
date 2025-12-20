from rest_framework.routers import DefaultRouter
from .views import ContratoViewSet, ContratoServicoViewSet

router = DefaultRouter()
router.register(r'contratos', ContratoViewSet, basename='contrato')
router.register(r'contrato-servicos', ContratoServicoViewSet, basename='contrato-servico')

urlpatterns = router.urls
