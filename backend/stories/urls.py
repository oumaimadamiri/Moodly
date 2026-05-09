# stories/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoryViewSet, StoryNotificationViewSet

router = DefaultRouter()
router.register(r'stories', StoryViewSet, basename='story')
router.register(r'story-notifications', StoryNotificationViewSet, basename='story-notification')

urlpatterns = [
    path('api/', include(router.urls)),
]