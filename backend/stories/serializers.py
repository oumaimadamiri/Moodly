# stories/serializers.py
from rest_framework import serializers
from .models import Story, StoryView, StoryReply, StoryNotification
from users.serializers import UserSerializer

class StoryViewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = StoryView
        fields = ['id', 'user', 'viewed_at', 'reaction']

class StoryReplySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = StoryReply
        fields = ['id', 'user', 'message', 'created_at']

class StorySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    view_count = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    has_viewed = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    
    class Meta:
        model = Story
        fields = [
            'id', 'author', 'content', 'media_file', 'story_type',
            'background_color', 'text_color', 'created_at', 'expires_at',
            'view_count', 'is_expired', 'has_viewed', 'user_reaction'
        ]
    
    def get_has_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return StoryView.objects.filter(story=obj, user=request.user).exists()
        return False
    
    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                view = StoryView.objects.get(story=obj, user=request.user)
                return view.reaction
            except StoryView.DoesNotExist:
                return None
        return None

class CreateStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['content', 'media_file', 'story_type', 'background_color', 'text_color']

class StoryReactionSerializer(serializers.Serializer):
    reaction = serializers.ChoiceField(choices=StoryView.REACTION_TYPES, required=False)
    reply = serializers.CharField(required=False, allow_blank=True)

class StoryNotificationSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    story_id = serializers.IntegerField(source='story.id', read_only=True)
    
    class Meta:
        model = StoryNotification
        fields = [
            'id', 'story_id', 'from_user', 'notification_type', 
            'reaction_type', 'reply_message', 'created_at', 'is_read'
        ]