from django.contrib.auth.models import AbstractUser
from django.db import models
from rest_framework.response import Response
from rest_framework import status
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import secrets
import string

class User(AbstractUser):
    """Modèle utilisateur personnalisé pour Moodly"""
    primary_account = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='linked_accounts'
    )
    account_name = models.CharField(max_length=50, blank=True, null=True)
    
    # SUPPRIMER unique=True pour permettre les emails en double
    email = models.EmailField(_('email address'))  # Retirer unique=True
    
    bio = models.TextField(max_length=500, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to='profiles/', 
        blank=True, 
        null=True
    )
    cover_picture = models.ImageField(
        upload_to='covers/', 
        blank=True, 
        null=True
    )
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    is_private = models.BooleanField(default=False)

    # Champs de relations sociales
    followers = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='following',
        blank=True
    )
    
    # NOUVEAU: Relations pour les demandes de suivi en attente
    pending_follow_requests = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='pending_follows_sent',
        blank=True
    )

    # Champs pour la vérification par email
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    temporary_password = models.CharField(max_length=100, blank=True, null=True)
    token_created_at = models.DateTimeField(null=True, blank=True)
    
    # Statut en ligne
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    
    # Nouveau champ pour la suppression de compte
    deactivated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']  # Garder email comme champ requis
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = _('user')
        verbose_name_plural = _('users')
        constraints = [
            models.UniqueConstraint(fields=['username'], name='unique_username')
        ]
    def __str__(self):
        return self.username
    @property
    def is_primary_account(self):
        """Détermine si c'est un compte principal"""
        return self.primary_account is None
    
    def get_linked_accounts(self):
        """Retourne tous les comptes liés à cet email"""
        if self.is_primary_account:
            # Si c'est un compte principal, retourne tous ses comptes liés
            return self.linked_accounts.filter(is_active=True)
        else:
            # Si c'est un compte secondaire, retourne le principal + autres secondaires
            primary = self.primary_account
            accounts = User.objects.filter(
                models.Q(primary_account=primary) | models.Q(pk=primary.pk),
                is_active=True
            ).exclude(pk=self.pk)
            return accounts
    
    def get_all_accounts(self):
        """Retourne tous les comptes (principal + secondaires) pour cet email"""
        if self.is_primary_account:
            # Compte principal + tous ses liés
            accounts = User.objects.filter(
                models.Q(primary_account=self) | models.Q(pk=self.pk),
                is_active=True
            )
        else:
            # Compte secondaire -> retourne son principal + tous les liés
            primary = self.primary_account
            accounts = User.objects.filter(
                models.Q(primary_account=primary) | models.Q(pk=primary.pk),
                is_active=True
            )
        return accounts.order_by('-primary_account', 'username')
    
    def create_linked_account(self, username, account_name=None):
        """Crée un nouveau compte lié"""
        # Trouver le compte principal
        primary = self
        if not self.is_primary_account:
            primary = self.primary_account
        
        # Vérifier si le username existe déjà
        if User.objects.filter(username=username).exists():
            return None, None
        
        # Créer le nouveau compte lié au principal
        new_account = User.objects.create(
            username=username,
            email=primary.email,  # Même email que le compte principal
            first_name=self.first_name,
            last_name=self.last_name,
            primary_account=primary,  # Lier au compte principal
            account_name=account_name,
            is_active=True,
            is_verified=True  # Hérite de la vérification du principal
        )
        
        # Définir un mot de passe temporaire
        temp_password = self.generate_temporary_password()
        new_account.set_password(temp_password)
        new_account.save()
        
        return new_account, temp_password

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def followers_count(self):
        return self.followers.count()
    
    @property
    def following_count(self):
        return self.following.count()
    
    @property
    def posts_count(self):
        return self.posts.count()
    
    def generate_verification_token(self):
        """Génère un token de vérification"""
        alphabet = string.ascii_letters + string.digits
        token = ''.join(secrets.choice(alphabet) for _ in range(32))
        self.verification_token = token
        self.token_created_at = timezone.now()
        self.save()
        return token
    
    def generate_temporary_password(self):
        """Génère un mot de passe temporaire"""
        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(8))
        self.temporary_password = temp_password
        self.save()
        return temp_password
    
    def verify_account(self, token, temp_password):
        """Vérifie le compte avec le token et mot de passe temporaire"""
        if (self.verification_token == token and 
            self.temporary_password == temp_password and
            self.token_created_at and
            (timezone.now() - self.token_created_at).days < 1):  # Token valide 24h
            
            self.is_verified = True
            self.verification_token = None
            self.temporary_password = None
            self.token_created_at = None
            self.save()
            return True
        return False
    
    def follow(self, user_to_follow):
        """Ajoute user_to_follow dans mes followings"""
        if user_to_follow == self:
            return False

        self.following.add(user_to_follow)
        return True

    
    def unfollow(self, user):
        """Ne plus suivre un utilisateur"""
        self.following.remove(user)
    
    def is_following(self, user):
        """Vérifie si l'utilisateur suit un autre utilisateur"""
        return self.following.filter(pk=user.pk).exists()
    
    def send_follow_request(self, target_user):
        """Envoyer une demande de suivi"""
        if self.is_following(target_user):
            return False, "already_following"
        
        # Vérifier si demande déjà envoyée
        if target_user.pending_follow_requests.filter(pk=self.pk).exists():
            return False, "request_already_sent"
        
        if not target_user.is_private:
            # Compte public -> follow direct
            print(f"   ✅ Public account - Following directly")
            self.follow(target_user)
            return True, "followed"
        else:
            # Compte privé -> demande en attente
            print(f"   📮 Private account - Sending request")
            target_user.pending_follow_requests.add(self)
            return True, "request_sent"
        
    def accept_follow_request(self, requester):
        """Accepter une demande de suivi"""
        if self.pending_follow_requests.filter(pk=requester.pk).exists():
            self.pending_follow_requests.remove(requester)
            self.followers.add(requester)
            return True
        return False
    
    def reject_follow_request(self, requester):
        """Refuser une demande de suivi"""
        if self.pending_follow_requests.filter(pk=requester.pk).exists():
            self.pending_follow_requests.remove(requester)
            return True
        return False

    def get_pending_follow_requests(self):
        """Obtenir les demandes de suivi en attente"""
        return self.pending_follow_requests.all()
    
    def cancel_follow_request(self, target_user):
        """Annuler une demande de suivi envoyée"""
        if target_user.pending_follow_requests.filter(pk=self.pk).exists():
            target_user.pending_follow_requests.remove(self)
            return True
        return False

    def has_pending_request_to(self, target_user):
        """Vérifier si l'utilisateur a une demande en attente vers target_user"""
        return target_user.pending_follow_requests.filter(pk=self.pk).exists()
    
    def can_view_posts(self, viewer):
        """Vérifier si un utilisateur peut voir les posts"""
        if not self.is_private:
            return True
        return self.followers.filter(pk=viewer.pk).exists() or self.pk == viewer.pk

    def soft_delete(self):
        """Suppression douce du compte"""
        self.is_active = False
        self.deactivated_at = timezone.now()
        self.save()
    
    def hard_delete(self):
        """Suppression définitive du compte"""
        try:
            # Supprimer toutes les données associées
            if hasattr(self, 'posts'):
                self.posts.all().delete()
            if hasattr(self, 'likes'):
                self.likes.all().delete()
            if hasattr(self, 'comments'):
                self.comments.all().delete()
            
            # Supprimer les notifications
            try:
                from notifications.models import Notification
                Notification.objects.filter(actor=self).delete()
                Notification.objects.filter(recipient=self).delete()
            except Exception:
                pass
            
            # Supprimer les conversations et messages
            try:
                from chat.models import Conversation, Message
                Conversation.objects.filter(participants=self).delete()
                Message.objects.filter(sender=self).delete()
            except Exception:
                pass
            
        except Exception as e:
            print(f"Error during hard delete: {e}")
        
        # Supprimer l'utilisateur
        super().delete()
    