from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class SafePageNumberPagination(PageNumberPagination):
    """
    Paginação customizada que retorna uma lista vazia quando a página
    solicitada está fora do intervalo, em vez de retornar 404.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def paginate_queryset(self, queryset, request, view=None):
        """
        Override para tratar páginas fora do intervalo.
        """
        try:
            return super().paginate_queryset(queryset, request, view)
        except Exception:
            # Se a página não existe, retorna a última página válida
            from django.core.paginator import Paginator
            page_size = self.get_page_size(request)
            if page_size is None:
                return None
            
            paginator = Paginator(queryset, page_size)
            
            # Se não há resultados, retorna lista vazia
            if paginator.count == 0:
                self.page = None
                self.request = request
                return []
            
            # Retorna a última página válida
            page_number = paginator.num_pages
            self.page = paginator.page(page_number)
            self.request = request
            return list(self.page)

    def get_paginated_response(self, data):
        """
        Retorna resposta com metadados de paginação.
        """
        if self.page is None:
            return Response({
                'count': 0,
                'next': None,
                'previous': None,
                'results': data
            })
        
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })
