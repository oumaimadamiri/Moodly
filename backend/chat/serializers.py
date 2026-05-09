from rest_framework import serializers
from .models import Conversation, Message
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_picture', 'is_online']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    audio = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'image', 'audio', 'read', 'read_at', 
                 'is_edited', 'edited_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sender', 'read', 'read_at', 'is_edited', 
                          'edited_at', 'created_at', 'updated_at']
    
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.BASE_URL}{obj.image.url}" if hasattr(settings, 'BASE_URL') else obj.image.url
        return None
    
    def get_audio(self, obj):
        if obj.audio:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio.url)
            return f"{settings.BASE_URL}{obj.audio.url}" if hasattr(settings, 'BASE_URL') else obj.audio.url
        return None

class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content', 'image', 'audio']
    
    def create(self, validated_data):
        conversation = self.context['conversation']
        request = self.context['request']
        
        # Gérer automatiquement le contenu pour les médias
        content = validated_data.get('content', '')
        if not content:
            if validated_data.get('image'):
                content = '🖼️ Image'
            elif validated_data.get('audio'):
                content = '🎤 Message vocal'
        
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            **{k: v for k, v in validated_data.items() if k != 'content'}
        )
        return message

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.IntegerField(read_only=True)
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'other_participant', 'last_message', 
                 'unread_count', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        # Utiliser les annotations si disponibles
        if hasattr(obj, 'last_message_content') and obj.last_message_content:
            return {
                'content': obj.last_message_content,
                'created_at': obj.last_message_time
            }
        
        # Fallback: récupérer le dernier message
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                return UserSerializer(other_user, context=self.context).data
        return None