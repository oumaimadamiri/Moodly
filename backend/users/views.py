from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, logout, authenticate
from django.db.models import Q
from .serializers import (
    UserSerializer, UserMinimalSerializer, UserRegistrationSerializer,
    UserUpdateSerializer, ChangePasswordSerializer, UserDeleteSerializer,
    EmailVerificationSerializer
)
from notifications.models import Notification
from notifications.services import NotificationService

User = get_user_model()

class AuthViewSet(viewsets.ViewSet):
    """ViewSet pour l'authentification"""
    
    permission_classes = [permissions.AllowAny]
    
    # Dans AuthViewSet, modifiez la méthode register

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Inscription d'un nouvel utilisateur"""
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            return Response({
                'message': 'Un email de vérification a été envoyé à votre adresse email. Veuillez vérifier votre compte pour vous connecter.'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Registration error: {e}")
            return Response({
                'error': 'Erreur lors de l\'inscription',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        """Vérification de l'email avec token et mot de passe temporaire"""
        try:
            serializer = EmailVerificationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = serializer.validated_data['user']
            user.is_active = True  # Activer le compte
            user.save()
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': 'Compte vérifié avec succès !'
            })
            
        except Exception as e:
            print(f"Email verification error: {e}")
            return Response({
                'error': 'Erreur lors de la vérification',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Connexion d'un utilisateur"""
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            print(f"Login attempt for user: {username}")
            
            if not username or not password:
                return Response(
                    {'error': 'Nom d\'utilisateur et mot de passe requis.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = authenticate(username=username, password=password)
            
            if not user:
                print(f"Authentication failed for user: {username}")
                return Response(
                    {'error': 'Identifiants invalides.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Vérifier si l'utilisateur est actif
            if not user.is_active:
                return Response(
                    {'error': 'Ce compte n\'est pas activé. Veuillez vérifier votre email.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Vérifier si le compte est vérifié
            if not user.is_verified:
                return Response(
                    {'error': 'Veuillez vérifier votre email avant de vous connecter.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Mettre à jour le statut en ligne
            user.is_online = True
            user.save(update_fields=['is_online'])
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
            
        except Exception as e:
            print(f"Login error: {e}")
            return Response({
                'error': 'Erreur interne du serveur',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des utilisateurs"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    @action(detail=False, methods=['get'])
    def linked_accounts(self, request):
        """Récupère tous les comptes liés à l'email de l'utilisateur connecté"""
        try:
            linked_accounts = request.user.get_linked_accounts()
            serializer = UserMinimalSerializer(linked_accounts, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['get'], url_path='profiles/(?P<username>[^/.]+)')
    def retrieve_by_username(self, request, username=None):
        """Récupérer un utilisateur par son username"""
        try:
            user = User.objects.get(username=username, is_active=True)
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
    @action(detail=False, methods=['post'])
    @action(detail=False, methods=['get'])
    def get_profile_by_username(self, request, username=None):
        """Récupérer un profil utilisateur par username"""
        try:
            user = User.objects.get(username=username, is_active=True)
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Suggestions d'utilisateurs à suivre"""
        # Exclure l'utilisateur actuel et ceux qu'il suit déjà
        following_ids = request.user.following.values_list('id', flat=True)
        
        suggestions = User.objects.filter(
            is_active=True
        ).exclude(
            id=request.user.id
        ).exclude(
            id__in=following_ids
        ).order_by('?')[:10]  # 10 suggestions aléatoires
        
        serializer = UserMinimalSerializer(suggestions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def linked_accounts(self, request):
        """Récupère tous les comptes liés à l'email de l'utilisateur connecté"""
        try:
            linked_accounts = request.user.get_linked_accounts()
            serializer = UserMinimalSerializer(linked_accounts, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def switch_account(self, request):
        """Bascule vers un autre compte lié"""
        try:
            target_username = request.data.get('username')
            
            print(f"🔁 Switching to account: {target_username}")
            print(f"🔁 Current user: {request.user.username}")
            print(f"🔁 Current user email: {request.user.email}")
            
            # Vérifier que le compte cible existe et est actif
            target_user = User.objects.get(
                username=target_username,
                is_active=True
            )
            
            print(f"🔁 Target user found: {target_user.username}")
            print(f"🔁 Target user email: {target_user.email}")
            
            # Vérifier que les utilisateurs partagent le même email (comptes liés)
            if request.user.email != target_user.email:
                return Response(
                    {'error': 'Vous ne pouvez pas basculer vers ce compte.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Générer de nouveaux tokens pour le compte cible
            refresh = RefreshToken.for_user(target_user)
            
            # Mettre à jour le statut en ligne
            target_user.is_online = True
            target_user.save(update_fields=['is_online'])
            
            print(f"✅ Switch successful - New tokens generated for: {target_user.username}")
            
            return Response({
                'user': UserSerializer(target_user, context={'request': request}).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': f'Compte changé vers {target_user.username}'
            })
            
        except User.DoesNotExist:
            print(f"❌ User not found: {target_username}")
            return Response(
                {'error': 'Compte non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Switch error: {str(e)}")
            return Response(
                {'error': f'Erreur lors du changement de compte: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    @action(detail=False, methods=['post'])
    def create_linked_account(self, request):
        """Crée un nouveau compte lié"""
        try:
            username = request.data.get('username')
            account_name = request.data.get('account_name')
            
            new_account, temp_password = request.user.create_linked_account(
                username, 
                account_name
            )
            
            if new_account:
                return Response({
                    'message': 'Compte créé avec succès',
                    'account': UserMinimalSerializer(new_account).data,
                    'temporary_password': temp_password
                })
            else:
                return Response(
                    {'error': 'Impossible de créer le compte'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def create_linked_account(self, request):
        """Crée un nouveau compte lié"""
        try:
            username = request.data.get('username')
            account_name = request.data.get('account_name')
            
            new_account, temp_password = request.user.create_linked_account(
                username, 
                account_name
            )
            
            if new_account:
                return Response({
                    'message': 'Compte créé avec succès',
                    'account': UserMinimalSerializer(new_account).data,
                    'temporary_password': temp_password
                })
            else:
                return Response(
                    {'error': 'Impossible de créer le compte'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    def get_queryset(self):
        """Retourne seulement les utilisateurs actifs"""
        return User.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'list':
            return UserMinimalSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        """Ajoute la requête au contexte du serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Récupérer ou mettre à jour le profil de l'utilisateur connecté"""
        if request.method == 'GET':
            serializer = UserSerializer(request.user, context={'request': request})
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserUpdateSerializer(
                request.user, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            # Retourner les données complètes après mise à jour
            user_serializer = UserSerializer(request.user, context={'request': request})
            return Response(user_serializer.data)
    
    # AJOUTER CETTE MÉTHODE MANQUANTE
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Alias pour la méthode me pour la mise à jour"""
        return self.me(request)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Changer le mot de passe"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Ancien mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changer le mot de passe
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Mot de passe changé avec succès.'})
    

    
    @action(detail=False, methods=['post'])
    def delete_account(self, request):
        """Supprimer le compte utilisateur"""
        serializer = UserDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Vérifier le mot de passe
        if not user.check_password(serializer.validated_data['password']):
            return Response(
                {'error': 'Mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Suppression douce du compte
        user.soft_delete()
        
        # Déconnecter l'utilisateur
        logout(request)
        
        return Response({'message': 'Compte supprimé avec succès.'})
    
    # users/views.py - CORRIGER la méthode follow

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """Suivre un utilisateur"""
        try:
            user_to_follow = self.get_object()
            
            if user_to_follow == request.user:
                return Response(
                    {'error': 'Vous ne pouvez pas vous suivre vous-même.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier si l'utilisateur suit déjà
            if request.user.is_following(user_to_follow):
                return Response(
                    {'error': 'Vous suivez déjà cet utilisateur.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Utiliser la méthode pour gérer les comptes privés
            success, result = request.user.send_follow_request(user_to_follow)
            if success:
                if result == "followed":
                    # Compte public
                    try:
                        NotificationService.notify_follow(request.user, user_to_follow)  # CORRECTION
                    except Exception as e:
                        print(f"❌ Error creating follow notification: {e}")
                    
                    return Response({
                        'message': f'Vous suivez maintenant {user_to_follow.username}.',
                        'is_following': True,
                        'request_pending': False
                    })
                
                elif result == "request_sent":
                    # Compte privé
                    try:
                        NotificationService.notify_follow_request(request.user, user_to_follow)  # CORRECTION
                    except Exception as e:
                        print(f"❌ Error creating follow request notification: {e}")
                    
                    return Response({
                        'message': f'Demande de suivi envoyée à {user_to_follow.username}.',
                        'is_following': False,
                        'request_pending': True
                    })

            return Response(
                {'error': 'Une erreur est survenue.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

    # Dans accept_follow_request - CORRIGER
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_follow_request(self, request, pk=None):
        try:
            requester = User.objects.get(pk=pk)

            # Vérifier que requester a réellement envoyé une demande
            if not request.user.pending_follow_requests.filter(pk=requester.pk).exists():
                return Response(
                    {'error': 'Aucune demande trouvée.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Accepter la demande
            request.user.followers.add(requester)
            request.user.pending_follow_requests.remove(requester)
            
            # Notifier l'acceptation
            try:
                NotificationService.notify_follow_accept(request.user, requester)  # CORRECTION
            except Exception as e:
                print(f"❌ Error creating follow accept notification: {e}")
                
            return Response({'message': 'Demande acceptée.'})

        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
    @action(detail=True, methods=['delete'])
    def unfollow(self, request, pk=None):
        """Ne plus suivre un utilisateur"""
        try:
            user_to_unfollow = self.get_object()
            request.user.unfollow(user_to_unfollow)
            
            return Response({'message': f'Vous ne suivez plus {user_to_unfollow.username}.'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Rechercher des utilisateurs"""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response(
                {'error': 'Paramètre de recherche requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).filter(is_active=True)
        
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = UserMinimalSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = UserMinimalSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def followers(self, request):
        """Liste des followers de l'utilisateur connecté"""
        followers = request.user.followers.all()
        
        page = self.paginate_queryset(followers)
        if page is not None:
            serializer = UserMinimalSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = UserMinimalSerializer(followers, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def following(self, request):
        """Liste des utilisateurs suivis par l'utilisateur connecté"""
        following = request.user.following.all()
        
        page = self.paginate_queryset(following)
        if page is not None:
            serializer = UserMinimalSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = UserMinimalSerializer(following, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='(?P<username>[^/.]+)/follow')
    def follow_by_username(self, request, username=None):
        """Suivre un utilisateur par son username"""
        try:
            user_to_follow = User.objects.get(username=username, is_active=True)
            
            if user_to_follow == request.user:
                return Response(
                    {'error': 'Vous ne pouvez pas vous suivre vous-même.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier si l'utilisateur suit déjà
            if request.user.is_following(user_to_follow):
                return Response(
                    {'error': 'Vous suivez déjà cet utilisateur.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            success, result = request.user.send_follow_request(user_to_follow)

            if success:
                if result == "followed":
                    # Compte public - Créer notification
                    try:
                        from notifications.models import Notification
                        Notification.objects.create(
                            recipient=user_to_follow,
                            actor=request.user,
                            notification_type='follow',
                            text=f'{request.user.username} vous suit maintenant'
                        )
                    except Exception as e:
                        print(f"❌ Error creating notification: {e}")
                    
                    return Response({
                        'message': f'Vous suivez maintenant {user_to_follow.username}.',
                        'is_following': True,
                        'request_pending': False
                    })
                    
                elif result == "request_sent":
                    # Compte privé - Créer notification de demande
                    try:
                        from notifications.models import Notification
                        Notification.objects.create(
                            recipient=user_to_follow,
                            actor=request.user,
                            notification_type='follow_request',
                            text=f'{request.user.username} a demandé à vous suivre'
                        )
                    except Exception as e:
                        print(f"❌ Error creating notification: {e}")
                    
                    return Response({
                        'message': f'Demande de suivi envoyée à {user_to_follow.username}.',
                        'is_following': False,
                        'request_pending': True
                    })
            
            return Response(
                {'error': 'Une erreur est survenue.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error following user: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Erreur lors du follow.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['delete'], url_path='(?P<username>[^/.]+)/unfollow')
    def unfollow_by_username(self, request, username=None):
        """Ne plus suivre un utilisateur par son username"""
        try:
            user_to_unfollow = User.objects.get(username=username, is_active=True)
            
            # Vérifier si l'utilisateur suit bien cette personne
            if not request.user.is_following(user_to_unfollow):
                return Response(
                    {'error': 'Vous ne suivez pas cet utilisateur.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            request.user.unfollow(user_to_unfollow)
            
            return Response({
                'message': f'Vous ne suivez plus {user_to_unfollow.username}.',
                'is_following': False
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error unfollowing user: {e}")
            return Response(
                {'error': 'Erreur lors du unfollow.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='(?P<username>[^/.]+)/followers')
    def followers_by_username(self, request, username=None):
        """Liste des followers d'un utilisateur par username"""
        try:
            user = User.objects.get(username=username, is_active=True)
            followers = user.followers.all()
            
            serializer = UserMinimalSerializer(followers, many=True, context={'request': request})
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='(?P<username>[^/.]+)/following')
    def following_by_username(self, request, username=None):
        """Liste des utilisateurs suivis par username"""
        try:
            user = User.objects.get(username=username, is_active=True)
            following = user.following.all()
            
            serializer = UserMinimalSerializer(following, many=True, context={'request': request})
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
    def get_profile_by_username(self, request, username=None):
        """Récupérer un profil utilisateur avec gestion de la confidentialité"""
        try:
            user = User.objects.get(username=username, is_active=True)
            serializer = UserSerializer(user, context={'request': request})
            
            # Vérifier si l'utilisateur connecté peut voir les posts
            can_view_posts = user.can_view_posts(request.user)
            
            response_data = serializer.data
            response_data['can_view_posts'] = can_view_posts
            response_data['is_private'] = user.is_private
            
            return Response(response_data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_follow_request(self, request, pk=None):
        try:
            requester = User.objects.get(pk=pk)

            # Vérifier que requester a réellement envoyé une demande
            if not request.user.pending_follow_requests.filter(pk=requester.pk).exists():
                return Response(
                    {'error': 'Aucune demande trouvée.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Accepter la demande
            request.user.followers.add(requester)
            request.user.pending_follow_requests.remove(requester)
            
            Notification.objects.create(
            recipient=requester,
            actor=request.user,
            notification_type='follow_accept',
            text=f'{request.user.username} a accepté votre demande de suivi.'
        )
            return Response({'message': 'Demande acceptée.'})

        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_follow_request(self, request, pk=None):
        try:
            requester = User.objects.get(pk=pk)

            if not request.user.pending_follow_requests.filter(pk=requester.pk).exists():
                return Response(
                {'error': 'Aucune demande trouvée.'},
                status=status.HTTP_400_BAD_REQUEST
                )
                
            request.user.pending_follow_requests.remove(requester)
            Notification.objects.create(
                recipient=requester,
                actor=request.user,
                notification_type='follow_reject',
                text=f'{request.user.username} a refusé votre demande de suivi.'
                )
            return Response({'message': 'Demande refusée.'})

        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['delete'], url_path='(?P<username>[^/.]+)/cancel-follow-request')
    def cancel_follow_request(self, request, username=None):
        """Annuler une demande de suivi en attente"""
        try:
            target_user = User.objects.get(username=username, is_active=True)
            
            # Vérifier que l'utilisateur a bien envoyé une demande
            if not target_user.pending_follow_requests.filter(pk=request.user.pk).exists():
                return Response(
                    {
                        'error': 'Aucune demande de suivi trouvée.',
                        'request_pending': False
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Retirer la demande
            target_user.pending_follow_requests.remove(request.user)
            
            # Supprimer la notification de demande de suivi si elle existe
            try:
                from notifications.models import Notification
                Notification.objects.filter(
                    recipient=target_user,
                    actor=request.user,
                    notification_type='follow_request',
                    read=False  # Supprimer seulement si non lue
                ).delete()
                print(f"✅ Follow request notification deleted")
            except Exception as e:
                print(f"❌ Error deleting notification: {e}")
            
            return Response({
                'message': f'Demande de suivi annulée pour {target_user.username}.',
                'is_following': False,
                'request_pending': False
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error canceling follow request: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {
                    'error': 'Erreur lors de l\'annulation de la demande.',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )