from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class FollowRequestSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes de suivi"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_picture', 'is_verified']
    
    def to_representation(self, instance):
        """Personnaliser la représentation des données"""
        data = super().to_representation(instance)
        # Ajouter des informations supplémentaires si nécessaire
        return data

class PrivacySettingsSerializer(serializers.ModelSerializer):
    """Serializer pour les paramètres de confidentialité"""
    
    class Meta:
        model = User
        fields = ['is_private']
    
    def update(self, instance, validated_data):
        """Mettre à jour les paramètres de confidentialité"""
        is_private = validated_data.get('is_private', instance.is_private)
        
        print(f"\n{'='*50}")
        print(f"🔒 PRIVACY SETTINGS UPDATE")
        print(f"{'='*50}")
        print(f"User: {instance.username}")
        print(f"Old is_private: {instance.is_private}")
        print(f"New is_private: {is_private}")
        print(f"{'='*50}\n")
        
        instance.is_private = is_private
        instance.save()
        
        # Vérifier après sauvegarde
        instance.refresh_from_db()
        print(f"✅ Saved! Current is_private: {instance.is_private}")
        
        return instance