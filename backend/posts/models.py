from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Post(models.Model):
    """Modèle pour les publications"""
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    content = models.TextField(max_length=5000)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    
    # Statistiques
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    
    # Choix d'émotions
    EMOTION_CHOICES = [
        ('happy', '😊 Heureux'),
        ('sad', '😢 Triste'),
        ('inspired', '💡 Inspiré'),
        ('motivated', '🚀 Motivé'),
        ('excited', '🎉 Excité'),
        ('thoughtful', '🤔 Réfléchi'),
    ]
    
    emotion = models.CharField(
        max_length=20, 
        choices=EMOTION_CHOICES, 
        default='happy'
    )
    
    # Métadonnées
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
        verbose_name = _('post')
        verbose_name_plural = _('posts')
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"
    
    def update_likes_count(self):
        """Met à jour le nombre de likes"""
        self.likes_count = self.likes.count()
        self.save(update_fields=['likes_count'])
    
    def update_comments_count(self):
        """Met à jour le nombre de commentaires"""
        self.comments_count = self.comments.count()
        self.save(update_fields=['comments_count'])
    
    def get_emotion_display(self):
        """Retourne l'émotion formatée"""
        return dict(self.EMOTION_CHOICES).get(self.emotion, self.emotion)


class Like(models.Model):
    """Modèle pour les likes de publications"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'likes'
        unique_together = ('user', 'post')
        ordering = ['-created_at']
        verbose_name = _('like')
        verbose_name_plural = _('likes')
        indexes = [
            models.Index(fields=['post', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} likes {self.post.id}"


class Comment(models.Model):
    """Modèle pour les commentaires"""
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField(max_length=1000)
    
    # Commentaires imbriqués
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        blank=True,
        null=True
    )
    
    # Métadonnées
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'comments'
        ordering = ['created_at']
        verbose_name = _('comment')
        verbose_name_plural = _('comments')
        indexes = [
            models.Index(fields=['post', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.author.username} on {self.post.id}: {self.content[:50]}"


class Bookmark(models.Model):
    """Modèle pour les posts sauvegardés"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='bookmarked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bookmarks'
        unique_together = ('user', 'post')
        ordering = ['-created_at']
        verbose_name = _('bookmark')
        verbose_name_plural = _('bookmarks')
    
    def __str__(self):
        return f"{self.user.username} bookmarked {self.post.id}"