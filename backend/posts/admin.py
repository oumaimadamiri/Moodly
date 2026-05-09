from django.contrib import admin
from .models import Post, Like, Comment, Bookmark


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Configuration de l'admin pour les posts"""
    
    list_display = [
        'id', 'author', 'content_preview', 'likes_count',
        'comments_count', 'is_edited', 'created_at'
    ]
    list_filter = ['is_edited', 'created_at']
    search_fields = ['content', 'author__username']
    readonly_fields = [
        'likes_count', 'comments_count', 'shares_count',
        'is_edited', 'edited_at', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Aperçu'


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    """Configuration de l'admin pour les likes"""
    
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__content']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Configuration de l'admin pour les commentaires"""
    
    list_display = [
        'id', 'author', 'post', 'content_preview',
        'parent', 'is_edited', 'created_at'
    ]
    list_filter = ['is_edited', 'created_at']
    search_fields = ['content', 'author__username']
    readonly_fields = ['is_edited', 'edited_at', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Aperçu'


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    """Configuration de l'admin pour les bookmarks"""
    
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__content']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']