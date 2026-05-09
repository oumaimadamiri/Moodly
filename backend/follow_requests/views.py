from notifications.services import NotificationService
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import FollowRequestSerializer, PrivacySettingsSerializer

User = get_user_model()

class FollowRequestViewSet(viewsets.ViewSet):
    """ViewSet pour la gestion des demandes de suivi"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(is_active=True)
    
    def list(self, request):
        """Redirection vers pending_requests"""
        return self.pending_requests(request)
    
    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """Obtenir les demandes de suivi en attente"""
        try:
            pending_requests = request.user.get_pending_follow_requests()
            serializer = FollowRequestSerializer(
                pending_requests, 
                many=True, 
                context={'request': request}
            )
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accepter une demande de suivi"""
        try:
            requester = User.objects.get(pk=pk, is_active=True)
            
            if request.user.accept_follow_request(requester):
                # Créer notification d'acceptation
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        recipient=requester,
                        actor=request.user,
                        notification_type='follow_accept',
                        text=f'{request.user.username} a accepté votre demande de suivi'
                    )
                except Exception as e:
                    print(f"❌ Error creating accept notification: {e}")
                
                return Response({
                    'message': 'Demande de suivi acceptée',
                    'success': True
                })
                
            return Response(
                {'error': 'Demande de suivi non trouvée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error accepting request: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # @action(detail=True, methods=['post'])
    # def reject(self, request, pk=None):
    #     """Refuser une demande de suivi"""
    #     try:
    #         requester = User.objects.get(pk=pk, is_active=True)
    #         if not request.user.reject_follow_request(requester):
    #             return Response(
    #                 {'error': 'Demande de suivi non trouvée'},
    #                 status=status.HTTP_400_BAD_REQUEST
    #             )
    #         from notifications.models import Notification
    #         try:
    #             notif = Notification.objects.create(
    #                 recipient=requester,
    #                 actor=request.user,
    #                 notification_type='follow_reject',
    #                 text=f'{request.user.username} a refusé votre demande de suivi'
    #             )
    #             print(f"✅ Reject notification created: {notif.id}")
    #         except Exception as e:
    #             print(f"❌ Error creating reject notification: {e}")
    #         return Response({'message': 'Demande de suivi refusée'})
            
    #     except User.DoesNotExist:
    #         return Response(
    #             {'error': 'Utilisateur non trouvé'},
    #             status=status.HTTP_404_NOT_FOUND
    #         )
    #     except Exception as e:
    #         return Response(
    #             {'error': str(e)},
    #             status=status.HTTP_500_INTERNAL_SERVER_ERROR
    #         )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            requester = User.objects.get(pk=pk, is_active=True)

            # Créer la notification en premier
            from notifications.models import Notification
            try:
                notif = NotificationService.create_and_send_notification(
                    recipient=requester,
                    actor=request.user,
                    notification_type='follow_reject',
                    text=f'{request.user.username} a refusé votre demande de suivi'
                )
                print(f"Reject notification created: {notif.id}")
            except Exception as e:
                print(f"Error creating reject notification: {e}")

            # Ensuite, retirer la demande
            if not request.user.reject_follow_request(requester):
                return Response(
                    {'error': 'Demande de suivi non trouvÃ©e'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            request.user.pending_follow_requests.remove(requester)

            return Response({'message': 'Demande de suivi refusÃ©e'})

        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvÃ©'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"âŒ Error in reject action: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrivacySettingsViewSet(viewsets.ViewSet):
    """ViewSet pour la gestion des paramètres de confidentialité"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """GET /api/privacy-settings/settings/ - Récupérer les paramètres"""
        try:
            serializer = PrivacySettingsSerializer(
                request.user, 
                context={'request': request}
            )
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """PUT /api/privacy-settings/settings/ - Mettre à jour les paramètres"""
        try:
            serializer = PrivacySettingsSerializer(
                request.user, 
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response({
                'message': 'Paramètres de confidentialité mis à jour',
                'is_private': serializer.validated_data['is_private']
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )