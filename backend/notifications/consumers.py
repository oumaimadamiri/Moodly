import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer pour les notifications en temps réel"""
    
    async def connect(self):
        """Connexion au WebSocket"""
        print(f"🔍 WebSocket connection attempt")
        print(f"🔍 User: {self.scope.get('user')}")
        print(f"🔍 Is anonymous: {self.scope['user'].is_anonymous}")
        
        if self.scope["user"].is_anonymous:
            print("❌ User is anonymous - closing connection")
            await self.close()
            return
            
        self.user_id = self.scope['user'].id
        self.notification_group_name = f'notifications_{self.user_id}'
        
        print(f"✅ User authenticated: {self.scope['user'].username} (ID: {self.user_id})")
        
        # Rejoindre le groupe de notifications
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"✅ WebSocket connection accepted for user {self.user_id}")
        
        # Envoyer le nombre de notifications non lues
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))
        print(f"📨 Sent unread count: {unread_count}")
        
    async def disconnect(self, close_code):
        """Déconnexion du WebSocket"""
        print(f"🔌 WebSocket disconnected with code: {close_code}")
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Recevoir un message du WebSocket"""
        print(f"📨 Received message: {text_data}")
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'mark_read':
            notification_id = data.get('notification_id')
            if notification_id:
                await self.mark_notification_read(notification_id)
                
                # Envoyer le nouveau compte
                unread_count = await self.get_unread_count()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': unread_count
                }))
    
    async def new_notification(self, event):
        """Envoyer une nouvelle notification au WebSocket"""
        print(f"🔔 Sending new notification: {event['notification']}")
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
        
        # Mettre à jour le compteur
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))
    
    @database_sync_to_async
    def get_unread_count(self):
        """Récupérer le nombre de notifications non lues"""
        from .models import Notification
        return Notification.objects.filter(
            recipient_id=self.user_id,
            read=False
        ).count()
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Marquer une notification comme lue"""
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient_id=self.user_id
            )
            notification.mark_as_read()
            print(f"✅ Notification {notification_id} marked as read")
        except Notification.DoesNotExist:
            print(f"❌ Notification {notification_id} not found")
            pass