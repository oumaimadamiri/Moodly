# notifications/services.py - FICHIER COMPLET
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
import json

class NotificationService:
    """Service pour gérer l'envoi de notifications"""
    
    @staticmethod
    def send_notification(user_id, notification_data):
        """Envoyer une notification via WebSocket"""
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'notifications_{user_id}',
                {
                    'type': 'new_notification',
                    'notification': notification_data
                }
            )
            print(f"✅ Notification sent to user {user_id}")
        except Exception as e:
            print(f"❌ Error sending notification: {e}")
    
    @staticmethod
    def create_and_send_notification(recipient, actor, notification_type, **kwargs):
        """Créer une notification et l'envoyer en temps réel"""
        try:
            print(f"🔄 Creating notification: {actor.username} -> {recipient.username} ({notification_type})")
            
            # Créer la notification en base de données
            notification = Notification.objects.create(
                recipient=recipient,
                actor=actor,
                notification_type=notification_type,
                post=kwargs.get('post'),
                comment=kwargs.get('comment'),
                conversation=kwargs.get('conversation'),
                text=kwargs.get('text', '')
            )
            
            print(f"✅ Notification created: {notification}")
            
            # Préparer les données pour le WebSocket
            from .serializers import NotificationSerializer
            notification_data = NotificationSerializer(notification).data
            
            # Envoyer via WebSocket
            NotificationService.send_notification(recipient.id, notification_data)
            
            return notification
            
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            return None
    
    @staticmethod
    def notify_new_post(post):
        """Notifier les followers d'un nouveau post"""
        print(f"📤 Notifying followers about new post from {post.author.username}")
        
        followers = post.author.followers.all()
        print(f"📢 Notifying {followers.count()} followers")
        
        for follower in followers:
            if follower != post.author:
                NotificationService.create_and_send_notification(
                    recipient=follower,
                    actor=post.author,
                    notification_type='new_post',
                    post=post,
                    text=f'{post.author.username} a publié un nouveau post'
                )
    
    @staticmethod
    def notify_like(like):
        """Notifier le propriétaire du post d'un like"""
        if like.post.author != like.user:
            print(f"📤 Notifying {like.post.author.username} about like from {like.user.username}")
            NotificationService.create_and_send_notification(
                recipient=like.post.author,
                actor=like.user,
                notification_type='like',
                post=like.post,
                text=f'{like.user.username} a aimé votre publication'
            )
    
    @staticmethod
    def notify_comment(comment):
        """Notifier le propriétaire du post d'un commentaire"""
        if comment.post.author != comment.author:
            print(f"📤 Notifying {comment.post.author.username} about comment from {comment.author.username}")
            NotificationService.create_and_send_notification(
                recipient=comment.post.author,
                actor=comment.author,
                notification_type='comment',
                post=comment.post,
                comment=comment,
                text=f'{comment.author.username} a commenté votre publication'
            )
    
    
    @staticmethod
    def notify_follow(follower, followed):
        """Notifier lorsqu'un utilisateur est suivi"""
        print(f"📤 Notifying {followed.username} about follow from {follower.username}")
        NotificationService.create_and_send_notification(
            recipient=followed,
            actor=follower,
            notification_type='follow',
            text=f'{follower.username} a commencé à vous suivre'
        )
    
    @staticmethod
    def notify_follow_request(requester, target_user):
        """Notifier une demande de suivi"""
        print(f"🔄 Notifying {target_user.username} about follow request from {requester.username}")
        NotificationService.create_and_send_notification(
            recipient=target_user,
            actor=requester,
            notification_type='follow_request',
            text=f'{requester.username} a demandé à vous suivre'
        )
    
    @staticmethod
    def notify_follow_accept(accepter, followed_user):
        """Notifier l'acceptation d'une demande de suivi"""
        print(f"🔄 Notifying {followed_user.username} about follow accept from {accepter.username}")
        NotificationService.create_and_send_notification(
            recipient=followed_user,
            actor=accepter,
            notification_type='follow_accept',
            text=f'{accepter.username} a accepté votre demande de suivi'
        )
    
    @staticmethod
    def notify_follow_reject(rejecter, requester):
        """Notifier le rejet d'une demande de suivi"""
        print(f"🔄 Notifying {requester.username} about follow reject from {rejecter.username}")
        NotificationService.create_and_send_notification(
            recipient=requester,
            actor=rejecter,
            notification_type='follow_reject',
            text=f'{rejecter.username} a refusé votre demande de suivi'
        )
    
    @staticmethod
    def notify_new_message(message):
        """Notifier de l'arrivée d'un nouveau message"""
        print(f"📤 Notifying participants about new message from {message.sender.username}")
        
        participants = message.conversation.participants.exclude(id=message.sender.id)
        
        for participant in participants:
            NotificationService.create_and_send_notification(
                recipient=participant,
                actor=message.sender,
                notification_type='message',
                conversation=message.conversation,
                text=f'{message.sender.username} vous a envoyé un message'
            )