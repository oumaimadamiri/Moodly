from rest_framework import serializers
from .models import Notification
from rest_framework.reverse import reverse

class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    post_preview = serializers.SerializerMethodField()
    comment_preview = serializers.SerializerMethodField()
    target_url = serializers.SerializerMethodField()
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'text', 'read', 'read_at', 
            'created_at', 'actor', 'post_preview', 'comment_preview', 'target_url'
        ]
    

    def get_actor(self, obj):
        return {
            'username': obj.actor.username,
            'full_name': obj.actor.get_full_name() if hasattr(obj.actor, 'get_full_name') else obj.actor.username
        }

    def get_post_preview(self, obj):
        if obj.post:
            return obj.post.content[:100]
        return None

    def get_comment_preview(self, obj):
        if obj.comment:
            return obj.comment.content[:100]
        return None

    def get_target_url(self, obj):
        """Détermine vers où rediriger selon le type de notification"""
        if obj.notification_type in ['like', 'comment', 'new_post', 'repost', 'mention'] and obj.post:
            # Aller vers la page du post
            return f"/posts/{obj.post.id}"
        elif obj.notification_type == 'reply' and obj.comment:
            # Aller vers le post du commentaire
            return f"/posts/{obj.comment.post.id}#comment-{obj.comment.id}"
        elif obj.notification_type == 'message' and obj.conversation:
            return f"/messages/{obj.conversation.id}"
        elif obj.notification_type == 'follow':
            return f"/profile/{obj.actor.username}"
        else:
            return "/notifications"