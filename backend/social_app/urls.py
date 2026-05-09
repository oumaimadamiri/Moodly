from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from follow_requests.views import FollowRequestViewSet, PrivacySettingsViewSet
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import UserViewSet, AuthViewSet
from posts.views import PostViewSet, CommentViewSet
from notifications.views import NotificationViewSet
from chat.views import ConversationViewSet, MessageViewSet
from stories.views import StoryViewSet
from stories.urls import router as stories_router

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'follow-requests', FollowRequestViewSet, basename='follow-requests')
router.register(r'privacy-settings', PrivacySettingsViewSet, basename='privacy-settings')
router.register(r'stories', StoryViewSet, basename='story')  
router.registry.extend(stories_router.registry)
urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/register/', AuthViewSet.as_view({'post': 'register'}), name='register'),
    path('api/auth/verify-email/', AuthViewSet.as_view({'post': 'verify_email'}), name='verify-email'),
    path('api/auth/login/', AuthViewSet.as_view({'post': 'login'}), name='login'),
    path('api/auth/logout/', AuthViewSet.as_view({'post': 'logout'}), name='logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/users/me/', UserViewSet.as_view({
        'get': 'me',
        'patch': 'update_profile', 
        'put': 'update_profile'
    }), name='current-user'),
    
    
    path('api/', include(router.urls)),
    
    # Posts endpoints
    path('api/posts/<int:pk>/like/', PostViewSet.as_view({'post': 'like'}), name='post-like'),
    path('api/posts/<int:pk>/unlike/', PostViewSet.as_view({'delete': 'unlike'}), name='post-unlike'),
    path('api/posts/<int:pk>/comments/', PostViewSet.as_view({'get': 'comments'}), name='post-comments'),

    # Users endpoints
    path('api/users/<str:username>/follow/', UserViewSet.as_view({'post': 'follow'}), name='user-follow'),
    path('api/users/<str:username>/unfollow/', UserViewSet.as_view({'delete': 'unfollow'}), name='user-unfollow'),
    path('api/users/<str:username>/followers/', UserViewSet.as_view({'get': 'followers'}), name='user-followers'),
    path('api/users/<str:username>/following/', UserViewSet.as_view({'get': 'following'}), name='user-following'),
    
    # Account management
    path('api/users/me/deactivate/', UserViewSet.as_view({'post': 'deactivate_account'}), name='deactivate-account'),
    path('api/users/me/delete/', UserViewSet.as_view({'post': 'delete_account'}), name='delete-account'),
    path('api/users/me/change_password/', UserViewSet.as_view({'post': 'change_password'}), name='change-password'),
    
    # Profile endpoints
    path('api/users/profile/<str:username>/', UserViewSet.as_view({'get': 'get_profile_by_username'}), name='user-profile-by-username'),
    path('api/users/suggestions/', UserViewSet.as_view({'get': 'suggestions'}), name='user-suggestions'),
    path('api/users/linked_accounts/', UserViewSet.as_view({'get': 'linked_accounts'}), name='linked-accounts'),
    path('api/users/switch_account/', UserViewSet.as_view({'post': 'switch_account'}), name='switch-account'),
    path('api/users/create_linked_account/', UserViewSet.as_view({'post': 'create_linked_account'}), name='create-linked-account'),
    
    # Search and suggestions
    path('api/users/search/', UserViewSet.as_view({'get': 'search'}), name='user-search'),
    
     # NOUVEAU: URLs pour les demandes de suivi et confidentialité
    path('api/follow-requests/pending_requests/', FollowRequestViewSet.as_view({'get': 'pending_requests'}), name='pending-follow-requests'),
    path('api/follow-requests/<int:pk>/accept/', FollowRequestViewSet.as_view({'post': 'accept'}), name='accept-follow-request'),
    path('api/follow-requests/<int:pk>/reject/', FollowRequestViewSet.as_view({'post': 'reject'}), name='reject-follow-request'),
    path('api/privacy-settings/settings/', PrivacySettingsViewSet.as_view({'get': 'list', 'put': 'create'}), name='privacy-settings'),

    # ==================== CHAT ENDPOINTS ====================
    # Conversations endpoints
    path('api/conversations/<int:pk>/messages/', ConversationViewSet.as_view({'get': 'messages'}), name='conversation-messages'),
    path('api/conversations/<int:pk>/send_message/', ConversationViewSet.as_view({'post': 'send_message'}), name='conversation-send-message'),
    path('api/conversations/<int:pk>/mark-read/', ConversationViewSet.as_view({'post': 'mark_read'}), name='conversation-mark-read'),
    path('api/conversations/unread-count/', 
         ConversationViewSet.as_view({'get': 'unread_count'}), 
         name='conversation-unread-count'),
    
    path('api/conversations/unread-by-conversation/', 
         ConversationViewSet.as_view({'get': 'unread_by_conversation'}), 
         name='conversation-unread-by-conversation'),
    
    # Messages endpoints
    path('api/messages/<int:pk>/mark_as_read/', MessageViewSet.as_view({'patch': 'mark_as_read'}), name='message-mark-read'),
    path('api/messages/<int:pk>/delete_for_everyone/', MessageViewSet.as_view({'delete': 'delete_for_everyone'}), name='message-delete-for-everyone'),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)