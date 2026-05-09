from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count, Exists, OuterRef
from django.shortcuts import get_object_or_404
from .models import Post, Like, Comment, Bookmark
from .serializers import (
    PostSerializer, PostCreateSerializer, CommentSerializer,
    LikeSerializer, BookmarkSerializer
)
from notifications.services import NotificationService

class PostViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des publications"""
    
    queryset = Post.objects.select_related('author').prefetch_related('likes', 'comments')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # 🔥 CORRECTION : Utiliser des noms d'annotations différents des champs existants
        if self.request.user.is_authenticated:
            # Filtrer les posts : comptes publics + comptes privés suivis + mes posts
            queryset = queryset.filter(
                Q(author__is_private=False) |      # Comptes publics
                Q(author__followers=user) |         # Comptes privés que je suis
                Q(author=user)                      # Mes propres posts
            ).distinct()
            
            queryset = queryset.annotate(
                annotated_likes_count=Count('likes', distinct=True),
                annotated_comments_count=Count('comments', distinct=True),
                has_liked=Exists(
                    Like.objects.filter(
                        post=OuterRef('pk'),
                        user=self.request.user
                    )
                ),
                has_bookmarked=Exists(
                    Bookmark.objects.filter(
                        post=OuterRef('pk'),
                        user=self.request.user
                    )
                )
            )
        else:
            queryset = queryset.annotate(
                annotated_likes_count=Count('likes', distinct=True),
                annotated_comments_count=Count('comments', distinct=True)
            )
        
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(author__username=author)
        
        feed = self.request.query_params.get('feed')
        if feed == 'true' and self.request.user.is_authenticated:
            following_ids = self.request.user.following.values_list('id', flat=True)
            queryset = queryset.filter(
                Q(author__id__in=following_ids) | Q(author=self.request.user)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """✅ CORRECTION: Créer le post ET notifier les followers"""
        post = serializer.save(author=self.request.user)
        
        print(f"📝 Post created by {self.request.user.username}: {post.id}")
        
        # 🔔 CRUCIAL: Notifier les followers du nouveau post
        try:
            NotificationService.notify_new_post(post)
            print(f"✅ New post notifications sent for post {post.id}")
        except Exception as e:
            print(f"❌ Error notifying new post: {e}")
            import traceback
            traceback.print_exc()
    
    def perform_update(self, serializer):
        from django.utils import timezone
        serializer.save(is_edited=True, edited_at=timezone.now())
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Vérifier que l'utilisateur est l'auteur
        if instance.author != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à supprimer ce post.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Vérifier que l'utilisateur est l'auteur
        if instance.author != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à modifier ce post.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """✅ CORRECTION: Liker ET notifier"""
        try:
            post = self.get_object()
            user = request.user
            
            print(f"👍 Like attempt: {user.username} -> Post {post.id}")
            
            # Vérifier si déjà liké
            existing_like = Like.objects.filter(post=post, user=user).first()
            
            if existing_like:
                return Response(
                    {'error': 'Vous avez déjà liké ce post.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer le like
            like = Like.objects.create(post=post, user=user)
            print(f"✅ Like created: {like.id}")
            
            # Mettre à jour le compteur
            post.update_likes_count()
            
            # 🔔 CRUCIAL: Notifier l'auteur (sauf si c'est lui-même)
            if post.author != user:
                try:
                    NotificationService.notify_like(like)
                    print(f"✅ Like notification sent to {post.author.username}")
                except Exception as e:
                    print(f"❌ Error notifying like: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Retourner les données mises à jour
            serializer = self.get_serializer(post, context={'request': request})
            return Response(serializer.data)
            
        except Post.DoesNotExist:
            return Response(
                {'error': 'Post non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error in like: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Erreur lors du like.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def unlike(self, request, pk=None):
        """Retirer un like"""
        try:
            post = self.get_object()
            user = request.user
            
            like = Like.objects.filter(post=post, user=user).first()
            
            if not like:
                return Response(
                    {'error': 'Vous n\'avez pas liké ce post.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            like.delete()
            post.update_likes_count()
            
            serializer = self.get_serializer(post, context={'request': request})
            return Response(serializer.data)
            
        except Post.DoesNotExist:
            return Response(
                {'error': 'Post non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error unliking: {e}")
            return Response(
                {'error': 'Erreur lors du retrait du like.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def likes(self, request, pk=None):
        """Liste des likes"""
        post = self.get_object()
        likes = post.likes.select_related('user').all()
        serializer = LikeSerializer(likes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def bookmark(self, request, pk=None):
        """Sauvegarder un post"""
        post = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user,
            post=post
        )
        
        if created:
            return Response({'message': 'Post sauvegardé.'})
        return Response({'message': 'Déjà sauvegardé.'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def unbookmark(self, request, pk=None):
        """Retirer un bookmark"""
        post = self.get_object()
        try:
            bookmark = Bookmark.objects.get(user=request.user, post=post)
            bookmark.delete()
            return Response({'message': 'Bookmark retiré.'})
        except Bookmark.DoesNotExist:
            return Response({'error': 'Pas dans vos favoris.'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def bookmarks(self, request):
        """Posts sauvegardés"""
        bookmarks = Bookmark.objects.filter(user=request.user).select_related('post__author')
        serializer = BookmarkSerializer(bookmarks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Liste des commentaires"""
        post = self.get_object()
        comments = post.comments.filter(parent=None).select_related('author')
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un post"""
        instance = self.get_object()
        
        if instance.author != request.user:
            return Response(
                {'error': 'Non autorisé.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet pour les commentaires"""
    
    queryset = Comment.objects.select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        """✅ CORRECTION: Créer le commentaire ET notifier"""
        comment = serializer.save(author=self.request.user)
        
        print(f"💬 Comment created by {self.request.user.username} on post {comment.post.id}")
        
        # Mettre à jour le compteur
        comment.post.update_comments_count()
        
        # 🔔 CRUCIAL: Notifier l'auteur du post
        if comment.post.author != self.request.user:
            try:
                NotificationService.notify_comment(comment)
                print(f"✅ Comment notification sent to {comment.post.author.username}")
            except Exception as e:
                print(f"❌ Error notifying comment: {e}")
                import traceback
                traceback.print_exc()
    
    def perform_update(self, serializer):
        from django.utils import timezone
        serializer.save(is_edited=True, edited_at=timezone.now())
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un commentaire"""
        instance = self.get_object()
        
        if instance.author != request.user:
            return Response(
                {'error': 'Non autorisé.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        post = instance.post
        self.perform_destroy(instance)
        post.update_comments_count()
        
        return Response(status=status.HTTP_204_NO_CONTENT)