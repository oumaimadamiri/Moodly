# stories/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import Story, StoryView, StoryReply, StoryNotification
from .serializers import (
    StorySerializer, CreateStorySerializer, StoryReactionSerializer,
    StoryReplySerializer, StoryViewSerializer, StoryNotificationSerializer
)

class StoryNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StoryNotificationSerializer
    
    def get_queryset(self):
        return StoryNotification.objects.filter(
            to_user=self.request.user
        ).select_related('from_user', 'story').order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        StoryNotification.objects.filter(
            to_user=request.user, 
            is_read=False
        ).update(is_read=True)
        return Response({'status': 'all marked as read'})

class StoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Récupérer les stories non expirées des utilisateurs suivis
        following_ids = self.request.user.following.values_list('id', flat=True)
        following_ids = list(following_ids) + [self.request.user.id]
        
        return Story.objects.filter(
            author_id__in=following_ids,
            expires_at__gt=timezone.now()
        ).select_related('author').prefetch_related('story_views__user').order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateStorySerializer
        return StorySerializer
    
    def perform_create(self, serializer):
        story = serializer.save(author=self.request.user)
        
        # L'auteur voit automatiquement sa propre story
        StoryView.objects.get_or_create(story=story, user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_stories(self, request):
        """Récupérer les stories de l'utilisateur connecté"""
        stories = Story.objects.filter(
            author=request.user,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        
        serializer = self.get_serializer(stories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def feed(self, request):
        """Récupérer les stories groupées par utilisateur"""
        stories = self.get_queryset()
        
        # Grouper par utilisateur
        user_stories = {}
        for story in stories:
            user_id = story.author.id
            if user_id not in user_stories:
                user_stories[user_id] = {
                    'user': {
                        'id': story.author.id,
                        'username': story.author.username,
                        'full_name': story.author.full_name or story.author.username,
                        'profile_picture': story.author.profile_picture.url if story.author.profile_picture else None
                    },
                    'stories': []
                }
            
            # Vérifier si l'utilisateur a déjà vu cette story
            has_viewed = StoryView.objects.filter(
                story=story, 
                user=request.user
            ).exists()
            
            story_data = {
                'id': story.id,
                'content': story.content,
                'media_file': story.media_file.url if story.media_file else None,
                'story_type': story.story_type,
                'background_color': story.background_color,
                'text_color': story.text_color,
                'created_at': story.created_at,
                'expires_at': story.expires_at,
                'view_count': story.view_count,
                'is_expired': story.is_expired,
                'has_viewed': has_viewed,
                'user_reaction': None
            }
            
            user_stories[user_id]['stories'].append(story_data)
        
        # Convertir en liste
        result = list(user_stories.values())
        
        return Response(result)
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """Marquer une story comme vue"""
        story = self.get_object()
        
        # Vérifier si l'utilisateur a déjà vu cette story
        story_view, created = StoryView.objects.get_or_create(
            story=story,
            user=request.user,
            defaults={'viewed_at': timezone.now()}
        )
        
        if not created:
            story_view.viewed_at = timezone.now()
            story_view.save()
        
        return Response({'status': 'story viewed'})
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Réagir à une story"""
        story = self.get_object()
        serializer = StoryReactionSerializer(data=request.data)
        
        if serializer.is_valid():
            reaction_data = serializer.validated_data
            
            # Mettre à jour ou créer la vue avec réaction
            story_view, created = StoryView.objects.get_or_create(
                story=story,
                user=request.user
            )
            
            # Gérer la réaction
            if 'reaction' in reaction_data and reaction_data['reaction']:
                story_view.reaction = reaction_data['reaction']
                story_view.save()
                
                # Créer une notification pour la réaction
                if story.author != request.user:
                    StoryNotification.objects.create(
                        story=story,
                        from_user=request.user,
                        to_user=story.author,
                        notification_type='story_reaction',
                        reaction_type=reaction_data['reaction']
                    )
            
            # Gérer la réponse
            if 'reply' in reaction_data and reaction_data['reply']:
                story_reply = StoryReply.objects.create(
                    story=story,
                    user=request.user,
                    message=reaction_data['reply']
                )
                
                # Créer une notification pour la réponse
                if story.author != request.user:
                    StoryNotification.objects.create(
                        story=story,
                        from_user=request.user,
                        to_user=story.author,
                        notification_type='story_reply',
                        reply_message=reaction_data['reply']
                    )
            
            return Response({'status': 'reaction added'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def views(self, request, pk=None):
        """Récupérer les vues d'une story"""
        story = self.get_object()
        
        # Vérifier que l'utilisateur est l'auteur de la story
        if story.author != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à voir les vues de cette story'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer toutes les vues de cette story
        views = StoryView.objects.filter(story=story).select_related('user').order_by('-viewed_at')
        
        # Utiliser le serializer pour formater les données
        serializer = StoryViewSerializer(views, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """Récupérer les réponses d'une story"""
        story = self.get_object()
        replies = StoryReply.objects.filter(story=story).select_related('user').order_by('-created_at')
        
        # Utiliser le serializer pour formater les données
        serializer = StoryReplySerializer(replies, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Créer une story avec gestion des fichiers"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Vérifier le type de story
            story_type = serializer.validated_data.get('story_type', 'text')
            
            if story_type == 'text' and not serializer.validated_data.get('content'):
                return Response(
                    {'error': 'Le contenu est requis pour les stories texte'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if story_type in ['image', 'video'] and not serializer.validated_data.get('media_file'):
                return Response(
                    {'error': f'Un fichier est requis pour les stories {story_type}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_create(serializer)
            story = serializer.instance
            
            return Response(
                StorySerializer(story, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer une story"""
        story = self.get_object()
        
        # Vérifier que l'utilisateur est l'auteur
        if story.author != request.user:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres stories'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        story.delete()
        return Response({'status': 'story deleted'}, status=status.HTTP_204_NO_CONTENT)