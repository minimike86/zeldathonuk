from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def index(_request):
    return JsonResponse(
        {
            'service': 'zeldathonuk-api',
            'frontend': 'http://localhost:5173',
            'endpoints': {
                'admin': '/admin/',
                'api': '/api/',
                'health': '/healthz/',
            },
        }
    )


def healthz(_request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('', index),
    path('healthz/', healthz),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
