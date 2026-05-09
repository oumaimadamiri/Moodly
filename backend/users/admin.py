from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuration de l'admin pour le modèle User personnalisé"""
    
    list_display = [
        'username', 'email', 'full_name', 'is_verified',
        'is_online', 'followers_count', 'following_count',
        'posts_count', 'date_joined'
    ]
    list_filter = [
        'is_verified', 'is_online', 'is_staff',
        'is_active', 'date_joined'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Informations personnelles'), {
            'fields': (
                'first_name', 'last_name', 'email', 'bio',
                'profile_picture', 'cover_picture', 'location',
                'website', 'birth_date'
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'is_verified', 'groups', 'user_permissions'
            ),
        }),
        (_('Statut'), {
            'fields': ('is_online', 'last_seen')
        }),
        (_('Dates importantes'), {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2'
            ),
        }),
    )
    
    readonly_fields = ['last_login', 'date_joined', 'last_seen']