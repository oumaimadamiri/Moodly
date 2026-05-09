# chat/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Count, OuterRef, Subquery
from django.utils import timezone
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, MessageCreateSerializer

# ✅ AJOUTER CETTE LIGNE
from notifications.services import NotificationService

class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des conversations"""
    
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne les conversations de l'utilisateur actuel avec annotations"""
        last_message_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-created_at').values('content', 'created_at')[:1]
        
        unread_count_subquery = Message.objects.filter(
            conversation=OuterRef('pk'),
            read=False
        ).exclude(
            sender=self.request.user
        ).values('conversation').annotate(
            count=Count('id')
        ).values('count')
        
        return Conversation.objects.filter(
            participants=self.request.user
        ).annotate(
            last_message_content=Subquery(last_message_subquery.values('content')),
            last_message_time=Subquery(last_message_subquery.values('created_at')),
            unread_count=Subquery(unread_count_subquery)
        ).order_by('-last_message_time')
    
    def get_serializer_context(self):
        """Ajouter le contexte pour les URLs absolues"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request):
        """Créer une nouvelle conversation ou retourner une existante"""
        participant_id = request.data.get('participant_id')
        
        if not participant_id:
            return Response(
                {'error': 'participant_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            participant = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if participant == request.user:
            return Response(
                {'error': 'Vous ne pouvez pas créer une conversation avec vous-même.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si une conversation existe déjà
        existing_conv = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=participant
        ).distinct().first()
        
        if existing_conv:
            existing_conv = self.get_queryset().filter(id=existing_conv.id).first()
            serializer = self.get_serializer(existing_conv)
            return Response(serializer.data)
        
        # Créer une nouvelle conversation
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, participant)
        
        conversation = self.get_queryset().filter(id=conversation.id).first()
        
        if conversation:
            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'Erreur lors de la création de la conversation.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Récupérer les messages d'une conversation"""
        conversation = self.get_object()
        messages = conversation.messages.all().order_by('created_at')
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """✅ CORRECTION COMPLÈTE: Envoyer un message ET notifier"""
        conversation = self.get_object()
        
        # Vérifier que l'utilisateur fait partie de la conversation
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Vous n\'êtes pas participant de cette conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Utiliser le serializer de création pour les messages
        serializer = MessageCreateSerializer(
            data=request.data,
            context={'conversation': conversation, 'request': request}
        )
        
        if serializer.is_valid():
            message = serializer.save()
            
            print(f"💌 Message created by {request.user.username} in conversation {conversation.id}")
            
            # 🔔 CRUCIAL: Notifier les autres participants
            try:
                NotificationService.notify_new_message(message)
                print(f"✅ Message notification sent for conversation {conversation.id}")
            except Exception as e:
                print(f"❌ Error notifying message: {e}")
                import traceback
                traceback.print_exc()
            
            # Retourner avec le contexte pour les URLs
            response_serializer = MessageSerializer(message, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marquer tous les messages d'une conversation comme lus"""
        conversation = self.get_object()
        
        updated_count = conversation.messages.filter(
            read=False
        ).exclude(
            sender=request.user
        ).update(read=True, read_at=timezone.now())
        
        return Response({
            'status': 'marked as read',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['get'], url_path='unread_count')
    def unread_count(self, request):
        """
        Obtenir le nombre total de messages non lus de l'utilisateur
        GET /api/chat/conversations/unread-count/
        """
        try:
            user = request.user
            conversations = Conversation.objects.filter(participants=user)
            unread_count = sum(conv.unread_count or 0 for conv in conversations)
            return Response({
                'count': unread_count
            })
            
        except Exception as e:
            print(f"❌ Error counting unread messages: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e), 'count': 0},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['get'], url_path='unread-by-conversation')
    def unread_by_conversation(self, request):
        """
        Obtenir le nombre de messages non lus par conversation
        GET /api/chat/conversations/unread-by-conversation/
        """
        try:
            user = request.user
            
            # Récupérer toutes les conversations avec leur nombre de non lus
            conversations = Conversation.objects.filter(
                participants=user
            ).annotate(
                unread_messages_count=Count(
                    'messages',
                    filter=Q(messages__read=False) & ~Q(messages__sender=user)
                )
            ).values('id', 'unread_messages_count')
            
            return Response({
                'conversations': list(conversations),
                'total_unread': sum(c['unread_messages_count'] for c in conversations)
            })
            
        except Exception as e:
            print(f"❌ Error getting unread by conversation: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des messages"""
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne uniquement les messages des conversations de l'utilisateur"""
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).select_related('sender', 'conversation').order_by('-created_at')
    
    def get_serializer_context(self):
        """Ajouter le contexte pour les URLs absolues"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """✅ CORRECTION COMPLÈTE: Créer un message ET notifier"""
        conversation = serializer.validated_data.get('conversation')
        
        # Vérifier que l'utilisateur fait partie de la conversation
        if not conversation.participants.filter(id=self.request.user.id).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas participant de cette conversation")
        
        # Créer le message
        message = serializer.save(sender=self.request.user)
        
        print(f"💌 Message created by {self.request.user.username} in conversation {conversation.id}")
        
        # 🔔 CRUCIAL: Notifier les participants
        try:
            NotificationService.notify_new_message(message)
            print(f"✅ Message notifications sent for conversation {conversation.id}")
        except Exception as e:
            print(f"❌ Error notifying message: {e}")
            import traceback
            traceback.print_exc()
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un message"""
        try:
            message = self.get_object()
            
            if message.sender != request.user:
                return Response(
                    {'error': 'Vous ne pouvez supprimer que vos propres messages.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            message.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """Marquer un message comme lu"""
        try:
            message = self.get_object()
            
            if message.sender != request.user and not message.read:
                message.read = True
                message.read_at = timezone.now()
                message.save(update_fields=['read', 'read_at'])
            
            serializer = self.get_serializer(message)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def delete_for_everyone(self, request, pk=None):
        """Supprimer un message pour tout le monde (optionnel)"""
        try:
            message = self.get_object()
            
            if message.sender != request.user:
                return Response(
                    {'error': 'Vous ne pouvez supprimer que vos propres messages.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            message.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )