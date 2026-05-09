import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Vérifier que l'utilisateur fait partie de la conversation
        if await self.is_participant():
            # Rejoindre le groupe
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json['message']
        sender_id = text_data_json['sender_id']

        # Sauvegarder le message en base de données
        message = await self.save_message(message_content, sender_id)

        # Envoyer le message à tous les participants du groupe
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_content,
                'sender_id': sender_id,
                'message_id': message.id,
                'created_at': message.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        # Envoyer le message au WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'message_id': event['message_id'],
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def is_participant(self):
        """Vérifier si l'utilisateur est un participant de la conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.scope["user"] in conversation.participants.all()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, sender_id):
        """Sauvegarder le message en base de données"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            sender = User.objects.get(id=sender_id)
            
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                content=content
            )
            return message
        except (Conversation.DoesNotExist, User.DoesNotExist) as e:
            # Gérer l'erreur appropriée
            raise e