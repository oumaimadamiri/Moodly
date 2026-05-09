from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import threading

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les informations utilisateur"""
    
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    is_following = serializers.SerializerMethodField()
    request_pending = serializers.SerializerMethodField()  # 🔥 NOUVEAU

    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'bio', 'profile_picture', 'cover_picture',
            'location', 'website', 'birth_date', 'is_verified',
            'is_online', 'last_seen', 'followers_count',
            'following_count', 'posts_count', 'is_following','request_pending', 
            'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']
    
    def get_is_following(self, obj):
        """Vérifie si l'utilisateur actuel suit cet utilisateur"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_following(obj)
        return False

    def get_request_pending(self, obj):
        """Vérifie si une demande de suivi est en attente"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Vérifier si request.user a envoyé une demande à obj
            return obj.pending_follow_requests.filter(pk=request.user.pk).exists()
        return False

class UserMinimalSerializer(serializers.ModelSerializer):
    """Serializer minimal pour les références utilisateur"""
    is_following = serializers.SerializerMethodField()  # 🔥 AJOUT
    request_pending = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'profile_picture', 
            'is_verified', 'is_online', 'is_private',  # 🔥 AJOUT is_private
            'is_following', 'request_pending'
        ]
    def get_is_following(self, obj):
        """Vérifie si l'utilisateur actuel suit cet utilisateur"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_following(obj)
        return False
    
    def get_request_pending(self, obj):
        """Vérifie si une demande de suivi est en attente"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Vérifier si request.user a envoyé une demande à obj
            return obj.pending_follow_requests.filter(pk=request.user.pk).exists()
        return False

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription avec multi-comptes par email"""
    
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                'password': "Les mots de passe ne correspondent pas."
            })
        
        # Validation du mot de passe
        password = attrs['password']
        if len(password) < 6:
            raise serializers.ValidationError({
                'password': "Le mot de passe doit contenir au moins 6 caractères."
            })
        
        # Vérifier si le username existe déjà
        username = attrs.get('username')
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'username': 'Ce nom d\'utilisateur est déjà pris.'
            })
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        email = validated_data.get('email')
        
        # Vérifier s'il existe déjà des comptes avec cet email
        existing_accounts = User.objects.filter(email=email, is_active=True)
        
        # Déterminer si c'est un compte principal
        # Premier compte avec cet email = compte principal (primary_account=None)
        # Comptes suivants = comptes secondaires (liés au premier compte)
        
        if existing_accounts.exists():
            # Trouver le compte principal existant
            primary_account = existing_accounts.filter(primary_account__isnull=True).first()
            if not primary_account:
                # Si pas de compte principal, le premier compte existant devient le principal
                primary_account = existing_accounts.first()
                primary_account.primary_account = None
                primary_account.save()
            
            # Créer un compte secondaire lié au compte principal
            user = User.objects.create_user(
                **validated_data,
                password=password,
                primary_account=primary_account,  # Lier au compte principal
                is_active=False  # Inactif jusqu'à vérification
            )
        else:
            # Premier compte avec cet email = compte principal
            user = User.objects.create_user(
                **validated_data,
                password=password,
                primary_account=None,  # Compte principal
                is_active=False  # Inactif jusqu'à vérification
            )
        
        # Générer token et mot de passe temporaire
        token = user.generate_verification_token()
        temp_password = user.generate_temporary_password()
        
        # Envoyer l'email de vérification
        self.send_verification_email(user, token, temp_password)
        
        return user
    
    def send_verification_email(self, user, token, temp_password):
        """Envoie l'email de vérification réel"""
        try:
            subject = 'Vérification de votre compte Moodly'
            
            # Message HTML pour l'email
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .token-box {{ background: #fff; border: 2px dashed #667eea; padding: 15px; margin: 15px 0; text-align: center; font-family: monospace; font-size: 16px; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Bienvenue sur Moodly !</h1>
                    </div>
                    <div class="content">
                        <h2>Bonjour {user.first_name or user.username},</h2>
                        <p>Merci de vous être inscrit sur Moodly. Pour activer votre compte, veuillez utiliser les informations suivantes :</p>
                        
                        <div class="token-box">
                            <strong>Token de vérification :</strong><br>
                            {token}
                        </div>
                        
                        <div class="token-box">
                            <strong>Mot de passe temporaire :</strong><br>
                            {temp_password}
                        </div>
                        
                        <p><strong>Instructions :</strong></p>
                        <ol>
                            <li>Rendez-vous sur : <a href="http://localhost:3000/verify-email">http://localhost:3000/verify-email</a></li>
                            <li>Entrez le token et le mot de passe temporaire ci-dessus</li>
                            <li>Cliquez sur "Vérifier mon compte"</li>
                        </ol>
                        
                        <p><em>Ces informations sont valables 24 heures.</em></p>
                    </div>
                    <div class="footer">
                        <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
                        <p>© 2024 Moodly. Tous droits réservés.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Message texte simple (fallback)
            text_message = f"""
            Vérification de votre compte Moodly
            
            Bonjour {user.first_name or user.username},
            
            Merci de vous être inscrit sur Moodly. Voici vos informations de vérification :
            
            Token de vérification : {token}
            Mot de passe temporaire : {temp_password}
            
            Pour vérifier votre compte :
            1. Allez sur : http://localhost:3000/verify-email
            2. Entrez le token et mot de passe temporaire ci-dessus
            3. Cliquez sur "Vérifier mon compte"
            
            Ces informations sont valables 24 heures.
            
            Si vous n'avez pas créé de compte, ignorez cet email.
            """
            
            # Envoyer l'email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            email.attach_alternative(html_message, "text/html")
            email.send()
            
            print(f"✅ Email de vérification envoyé à {user.email}")
            
        except Exception as e:
            print(f"❌ Erreur envoi email: {e}")
            # Fallback : afficher dans la console
            print("\n" + "="*50)
            print("📧 EMAIL DE VÉRIFICATION (FALLBACK CONSOLE)")
            print("="*50)
            print(f"À: {user.email}")
            print(f"Token: {token}")
            print(f"Mot de passe temporaire: {temp_password}")
            print("="*50)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour le changement de mot de passe"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                'new_password': "Les mots de passe ne correspondent pas."
            })
        return attrs


class UserDeleteSerializer(serializers.Serializer):
    """Serializer pour la suppression de compte"""
    password = serializers.CharField(write_only=True, required=True)
    confirmation = serializers.CharField(write_only=True, required=True)
    
    def validate_confirmation(self, value):
        if value.lower() != "supprimer mon compte":
            raise serializers.ValidationError("Veuillez taper 'supprimer mon compte' pour confirmer")
        return value


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer pour la vérification d'email"""
    
    token = serializers.CharField(required=True)
    temporary_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        token = attrs.get('token')
        temp_password = attrs.get('temporary_password')
        
        try:
            user = User.objects.get(verification_token=token, is_verified=False)
            if not user.verify_account(token, temp_password):
                raise serializers.ValidationError("Token ou mot de passe temporaire invalide")
            
            attrs['user'] = user
            return attrs
            
        except User.DoesNotExist:
            raise serializers.ValidationError("Token de vérification invalide")
        

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil utilisateur"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'bio', 'profile_picture', 
            'cover_picture', 'location', 'website', 'birth_date'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_bio(self, value):
        """Validation de la bio"""
        if value and len(value) > 500:
            raise serializers.ValidationError("La bio ne peut pas dépasser 500 caractères.")
        return value
    
    def validate_website(self, value):
        """Validation du site web"""
        if value and not value.startswith(('http://', 'https://')):
            value = 'https://' + value
        return value