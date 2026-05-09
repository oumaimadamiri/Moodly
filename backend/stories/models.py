# stories/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Story(models.Model):
    STORY_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    content = models.TextField(blank=True, null=True)
    media_file = models.FileField(upload_to='stories/', blank=True, null=True)
    story_type = models.CharField(max_length=10, choices=STORY_TYPES, default='text')
    background_color = models.CharField(max_length=7, default='#6366f1')
    text_color = models.CharField(max_length=7, default='#ffffff')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    viewers = models.ManyToManyField(User, through='StoryView', related_name='viewed_stories')
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def view_count(self):
        return self.viewers.count()
    
    def __str__(self):
        return f"Story by {self.author.username}"

class StoryView(models.Model):
    REACTION_TYPES = [
        ('like', 'Like'),
        ('love', 'Love'),
        ('laugh', 'Laugh'),
        ('wow', 'Wow'),
        ('sad', 'Sad'),
        ('angry', 'Angry'),
    ]
    
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='story_views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_views')
    viewed_at = models.DateTimeField(auto_now_add=True)
    reaction = models.CharField(max_length=10, choices=REACTION_TYPES, blank=True, null=True)
    
    class Meta:
        unique_together = ['story', 'user']
        ordering = ['-viewed_at']
    
    def __str__(self):
        return f"{self.user.username} viewed {self.story}"

class StoryReply(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='story_replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_replies')
    message = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reply by {self.user.username} to {self.story}"

class StoryNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('story_reaction', 'Story Reaction'),
        ('story_reply', 'Story Reply'),
    ]
    
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='notifications')
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_story_notifications')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_story_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    reaction_type = models.CharField(max_length=10, choices=StoryView.REACTION_TYPES, blank=True, null=True)
    reply_message = models.TextField(blank=True, null=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.notification_type})"