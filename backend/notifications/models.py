from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Notification(models.Model):

    NOTIFICATION_TYPES = (
    ('like', 'Like'),
    ('comment', 'Comment'),
    ('follow', 'Follow'),
    ('follow_request', 'Follow Request'),
    ('follow_accept', 'Follow Accept'),
    ('follow_reject', 'Follow Reject'),
    ('mention', 'Mention'),
    ('reply', 'Reply'),
    ('repost', 'Repost'),
    ('message', 'Message'),
    ('new_post', 'New Post'),
)

    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES
    )
    
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='notifications'
    )
    comment = models.ForeignKey(
        'posts.Comment',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='notifications'
    )
    conversation = models.ForeignKey(
    'chat.Conversation',
    on_delete=models.CASCADE,
    blank=True,
    null=True,
    related_name='notifications'
)

    
    text = models.CharField(max_length=255, blank=True)
    
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'notifications'
        verbose_name_plural = _('notifications')
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.actor.username} {self.notification_type} -> {self.recipient.username}"

    def mark_as_read(self):
        from django.utils import timezone
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at'])
