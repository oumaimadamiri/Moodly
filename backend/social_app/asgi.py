import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# 1️⃣ Définir le module de settings AVANT tout import Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_app.settings')

# 2️⃣ Initialiser Django
django_application = get_asgi_application()

# 3️⃣ Importer maintenant tout ce qui touche Django (modèles, middleware, routes)
from channels.auth import AuthMiddlewareStack
import chat.routing
from notifications.routing import websocket_urlpatterns
from notifications.middleware import JWTAuthMiddlewareStack

# 4️⃣ Fusionner les routes WebSocket
websocket_routes = chat.routing.websocket_urlpatterns + websocket_urlpatterns

# 5️⃣ Créer l'application ASGI complète
application = ProtocolTypeRouter({
    "http": django_application,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_routes)
    ),
})

