from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FollowRequestViewSet, PrivacySettingsViewSet

router = DefaultRouter()
router.register(r'follow-requests', FollowRequestViewSet, basename='follow-requests')
router.register(r'privacy-settings', PrivacySettingsViewSet, basename='privacy-settings')

urlpatterns = [
    path('', include(router.urls)),
]