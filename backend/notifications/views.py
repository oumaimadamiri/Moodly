from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des notifications"""
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne uniquement les notifications de l'utilisateur actuel"""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('actor', 'post', 'comment')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Liste des notifications non lues"""
        notifications = self.get_queryset().filter(read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Nombre de notifications non lues"""
        count = self.get_queryset().filter(read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """Marquer une notification comme lue"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marquer toutes les notifications comme lues"""
        notifications = self.get_queryset().filter(read=False)
        
        from django.utils import timezone
        now = timezone.now()
        
        notifications.update(read=True, read_at=now)
        
        return Response({
            'message': f'{notifications.count()} notifications marquées comme lues.'
        })
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Supprimer toutes les notifications"""
        count = self.get_queryset().count()
        self.get_queryset().delete()
        
        return Response({
            'message': f'{count} notifications supprimées.'
        })