from rest_framework import serializers
from .models import Post, Like, Comment, Bookmark
from users.serializers import UserMinimalSerializer


class CommentSerializer(serializers.ModelSerializer):
    """Serializer pour les commentaires"""
    
    author = UserMinimalSerializer(read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'author', 'post', 'content', 'parent',
            'is_edited', 'edited_at', 'replies_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'is_edited', 'edited_at', 'created_at']
    
    def get_replies_count(self, obj):
        return obj.replies.count()
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    """Serializer pour les publications"""
    
    emotion_display = serializers.CharField(source='get_emotion_display', read_only=True)
    author = UserMinimalSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    can_view_posts = serializers.SerializerMethodField() 
    comments = CommentSerializer(many=True, read_only=True)
    
    # 🔥 CORRECTION : Utiliser les annotations au lieu des champs de base
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'emotion', 'emotion_display', 'image', 
            'likes_count', 'comments_count', 'shares_count', 'is_liked',
            'is_bookmarked', 'can_view_posts','is_edited', 'edited_at',
            'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'shares_count', 'is_edited', 'edited_at', 'created_at'
        ]
    
    def get_likes_count(self, obj):
        """Retourne le nombre de likes (priorité aux annotations)"""
        # Utiliser l'annotation si disponible, sinon le champ de base
        if hasattr(obj, 'annotated_likes_count'):
            return obj.annotated_likes_count
        return obj.likes_count
    
    def get_comments_count(self, obj):
        """Retourne le nombre de commentaires (priorité aux annotations)"""
        if hasattr(obj, 'annotated_comments_count'):
            return obj.annotated_comments_count
        return obj.comments_count
    
    def get_is_liked(self, obj):
        """Vérifie si l'utilisateur actuel a liké le post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Utiliser l'annotation si disponible
            if hasattr(obj, 'has_liked'):
                return obj.has_liked
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        """Vérifie si l'utilisateur actuel a sauvegardé le post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Utiliser l'annotation si disponible
            if hasattr(obj, 'has_bookmarked'):
                return obj.has_bookmarked
            return obj.bookmarked_by.filter(user=request.user).exists()
        return False
    
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        from django.utils import timezone
        instance.is_edited = True
        instance.edited_at = timezone.now()
        return super().update(instance, validated_data)

    def get_can_view_posts(self, obj):
        """🔥 NOUVEAU: Vérifie si l'utilisateur peut voir les posts de cet auteur"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            # Non authentifié : peut voir seulement les comptes publics
            return not obj.author.is_private
        
        # Authentifié : utiliser la méthode du modèle User
        return obj.author.can_view_posts(request.user)

class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la création de post"""
    
    class Meta:
        model = Post
        fields = ['content', 'emotion', 'image']
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class LikeSerializer(serializers.ModelSerializer):
    """Serializer pour les likes"""
    
    user = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class BookmarkSerializer(serializers.ModelSerializer):
    """Serializer pour les bookmarks"""
    
    post = PostSerializer(read_only=True)
    
    class Meta:
        model = Bookmark
        fields = ['id', 'post', 'created_at']
        read_only_fields = ['id', 'created_at']