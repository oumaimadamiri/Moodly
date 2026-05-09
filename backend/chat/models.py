# chat/models.py
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import os

def message_image_upload_to(instance, filename):
    """Génère le chemin d'upload pour les images des messages"""
    # Organiser par conversation pour éviter les conflits
    if instance.conversation and instance.conversation.id:
        return f'messages/images/conversation_{instance.conversation.id}/{filename}'
    return f'messages/images/{filename}'

def message_audio_upload_to(instance, filename):
    """Génère le chemin d'upload pour les audio des messages"""
    if instance.conversation and instance.conversation.id:
        return f'messages/audio/conversation_{instance.conversation.id}/{filename}'
    return f'messages/audio/{filename}'

class Conversation(models.Model):
    """Modèle pour les conversations privées"""
    
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
        verbose_name = _('conversation')
        verbose_name_plural = _('conversations')
    
    def __str__(self):
        participants = ', '.join([u.username for u in self.participants.all()])
        return f"Conversation: {participants}"
    
    def get_other_participant(self, user):
        """Retourne l'autre participant de la conversation"""
        return self.participants.exclude(pk=user.pk).first()
    
    def get_last_message(self):
        """Retourne le dernier message de la conversation"""
        return self.messages.filter(deleted_for_everyone=False).order_by('-created_at').first()
    
    def unread_count(self, user):
        """Compte les messages non lus pour un utilisateur"""
        return self.messages.filter(
            read=False, 
            deleted_for_everyone=False
        ).exclude(sender=user).count()


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    
    content = models.TextField(max_length=5000, blank=True, null=True)
    
    # 🔥 CORRECTION : Utiliser les fonctions d'upload personnalisées
    image = models.ImageField(
        upload_to=message_image_upload_to, 
        blank=True, 
        null=True,
        max_length=500
    )
    audio = models.FileField(
        upload_to=message_audio_upload_to, 
        blank=True, 
        null=True,
        max_length=500
    )
    
    # État du message
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    # Métadonnées
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 🔥 CORRECTION : Champs pour gérer les suppressions
    deleted_for_sender = models.BooleanField(default=False)
    deleted_for_everyone = models.BooleanField(default=False)
    deleted_for_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='deleted_messages',
        blank=True
    )
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
        verbose_name = _('message')
        verbose_name_plural = _('messages')
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message {self.id} from {self.sender.username}"
    
    def save(self, *args, **kwargs):
        # Si c'est un message avec image/audio, mettre à jour le contenu automatiquement
        if self.image and not self.content:
            self.content = '🖼️ Image'
        elif self.audio and not self.content:
            self.content = '🎤 Message vocal'
        super().save(*args, **kwargs)
    
    def soft_delete_for_user(self, user):
        """Suppression douce pour un utilisateur spécifique"""
        if not self.deleted_for_everyone:
            self.deleted_for_users.add(user)
            # Si c'est l'expéditeur qui supprime, marquer aussi deleted_for_sender
            if user == self.sender:
                self.deleted_for_sender = True
            self.save()
            return True
        return False
    
    def soft_delete_for_everyone(self, user):
        """Suppression douce pour tout le monde (seulement par l'expéditeur)"""
        if user == self.sender and not self.deleted_for_everyone:
            self.deleted_for_everyone = True
            self.save()
            return True
        return False
    
    def hard_delete(self, user):
        """Suppression complète (seulement par l'expéditeur)"""
        if user == self.sender:
            self.delete()
            return True
        return False
    
    def is_visible_to(self, user):
        """Vérifie si le message est visible pour un utilisateur"""
        if self.deleted_for_everyone:
            return False
        if self.deleted_for_users.filter(pk=user.pk).exists():
            return False
        if user == self.sender and self.deleted_for_sender:
            return False
        return True
    
    def can_delete_for_everyone(self, user):
        """Vérifie si l'utilisateur peut supprimer le message pour tout le monde"""
        return user == self.sender and not self.deleted_for_everyone
    
    def can_delete_for_me(self, user):
        """Vérifie si l'utilisateur peut supprimer le message pour lui-même"""
        return not self.deleted_for_everyone and not self.deleted_for_users.filter(pk=user.pk).exists()
    
    def mark_as_read(self, user):
        """Marquer le message comme lu"""
        if user != self.sender and not self.read:
            self.read = True
            self.read_at = models.DateTimeField(auto_now=True)
            self.save(update_fields=['read', 'read_at'])
            return True
        return False
    
    def edit(self, new_content, user):
        """Éditer le message"""
        if user == self.sender and not self.deleted_for_everyone:
            self.content = new_content
            self.is_edited = True
            self.edited_at = models.DateTimeField(auto_now=True)
            self.save(update_fields=['content', 'is_edited', 'edited_at', 'updated_at'])
            return True
        return False