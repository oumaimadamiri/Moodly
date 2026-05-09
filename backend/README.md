# Backend Moodly

API REST et WebSocket du réseau social Moodly, construit avec Django 4.2 et Django Channels.

---

## Stack

| Bibliothèque | Version | Rôle |
|---|---|---|
| Django | 4.2.7 | Framework principal |
| Django REST Framework | 3.14.0 | API REST |
| djangorestframework-simplejwt | 5.3.0 | Authentification JWT |
| Django Channels | 4.0.0 | WebSockets (ASGI) |
| Daphne | — | Serveur ASGI |
| channels-redis | 4.1.0 | Channel layer Redis (production) |
| django-cors-headers | 4.3.0 | CORS |
| Pillow | 10.1.0 | Traitement d'images |
| python-decouple | 3.8 | Variables d'environnement |
| psycopg2-binary | 2.9.9 | Connecteur PostgreSQL (si besoin) |
| django-extensions / ipython | — | Outils de développement |

---

## Apps et responsabilités

| App | Rôle |
|---|---|
| `social_app/` | Configuration principale : `settings.py`, `urls.py`, `asgi.py` |
| `users/` | Modèle `User` custom (AbstractUser) avec bio, avatar, followers M2M, comptes liés, vérification email, statut en ligne |
| `posts/` | Modèles `Post` (avec tag émotion), `Like`, `Comment` (imbriqués), `Bookmark` |
| `stories/` | Stories éphémères 24 h — `Story`, `StoryView`, `StoryReply`, `StoryNotification` |
| `chat/` | Messagerie — `Conversation`, `Message` (texte/image/audio, soft-delete, lu/non-lu) + consumer WebSocket |
| `notifications/` | Notifications polymorphes (like, commentaire, follow, message) + consumer WebSocket + middleware JWT |
| `follow_requests/` | Demandes de suivi pour comptes privés (`FollowRequest`) + `PrivacySettings` |

---

## Installation

```bash
# 1. Créer et activer l'environnement virtuel
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Créer le fichier .env (copier .env.example et renseigner les valeurs)
cp .env.example .env

# 4. Appliquer les migrations
python manage.py migrate

# 5. Créer un super-utilisateur (optionnel)
python manage.py createsuperuser

# 6. Lancer le serveur
python manage.py runserver
```

L'API est accessible sur **http://localhost:8000**.

---

## Variables d'environnement

Créez un fichier `backend/.env` (voir `.env.example`) :

```env
SECRET_KEY=votre-clé-secrète-django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-app-password-gmail
```

> Ne commitez jamais ce fichier. Il est (ou doit être) dans `.gitignore`.

---

## WebSockets

L'application ASGI est définie dans `social_app/asgi.py` :

```
ASGI_APPLICATION = 'social_app.asgi.application'
```

En développement, `InMemoryChannelLayer` est utilisé (pas besoin de Redis).
Pour la production, basculez vers `RedisChannelLayer` dans `settings.py` :

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [('127.0.0.1', 6379)]},
    }
}
```

Endpoints WebSocket disponibles :
- `ws://localhost:8000/ws/notifications/` — notifications temps réel
- `ws://localhost:8000/ws/chat/<conversation_id>/` — messagerie

---

## Endpoints principaux

### Authentification

| Méthode | URL | Description |
|---|---|---|
| POST | `/api/auth/register/` | Inscription |
| POST | `/api/auth/verify-email/` | Vérification email |
| POST | `/api/auth/login/` | Connexion (retourne access + refresh tokens) |
| POST | `/api/auth/logout/` | Déconnexion |
| POST | `/api/auth/token/refresh/` | Rafraîchir le token |

### Utilisateurs

| Méthode | URL | Description |
|---|---|---|
| GET/PATCH | `/api/users/me/` | Profil de l'utilisateur connecté |
| GET | `/api/users/profile/<username>/` | Profil par nom d'utilisateur |
| GET | `/api/users/search/` | Recherche d'utilisateurs |
| GET | `/api/users/suggestions/` | Suggestions de comptes |
| POST | `/api/users/<username>/follow/` | Suivre un utilisateur |
| DELETE | `/api/users/<username>/unfollow/` | Ne plus suivre |
| GET | `/api/users/<username>/followers/` | Liste des abonnés |
| GET | `/api/users/<username>/following/` | Liste des abonnements |
| GET | `/api/users/linked_accounts/` | Comptes liés |
| POST | `/api/users/switch_account/` | Basculer vers un compte lié |
| POST | `/api/users/create_linked_account/` | Créer un compte lié |
| POST | `/api/users/me/change_password/` | Changer le mot de passe |
| POST | `/api/users/me/deactivate/` | Désactiver le compte |
| POST | `/api/users/me/delete/` | Supprimer le compte |

### Posts

| Méthode | URL | Description |
|---|---|---|
| GET/POST | `/api/posts/` | Liste / créer un post |
| GET/PUT/DELETE | `/api/posts/<id>/` | Détail / modifier / supprimer |
| POST | `/api/posts/<id>/like/` | Liker un post |
| DELETE | `/api/posts/<id>/unlike/` | Retirer le like |
| GET | `/api/posts/<id>/comments/` | Commentaires d'un post |
| GET/POST | `/api/comments/` | Commenter |

### Stories

| Méthode | URL | Description |
|---|---|---|
| GET/POST | `/api/stories/` | Liste / créer une story |
| GET | `/api/stories/feed/` | Feed de stories des abonnements |
| POST | `/api/stories/<id>/view/` | Marquer comme vue |
| POST | `/api/stories/<id>/reply/` | Répondre à une story |

### Messagerie (chat)

| Méthode | URL | Description |
|---|---|---|
| GET/POST | `/api/conversations/` | Conversations |
| GET | `/api/conversations/<id>/messages/` | Messages d'une conversation |
| POST | `/api/conversations/<id>/send_message/` | Envoyer un message |
| POST | `/api/conversations/<id>/mark-read/` | Marquer comme lu |
| GET | `/api/conversations/unread-count/` | Nombre de messages non lus |
| PATCH | `/api/messages/<id>/mark_as_read/` | Marquer un message comme lu |
| DELETE | `/api/messages/<id>/delete_for_everyone/` | Supprimer pour tous |

### Notifications

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/notifications/` | Liste des notifications |

### Follow Requests

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/follow-requests/pending_requests/` | Demandes en attente |
| POST | `/api/follow-requests/<id>/accept/` | Accepter |
| POST | `/api/follow-requests/<id>/reject/` | Rejeter |
| GET/PUT | `/api/privacy-settings/settings/` | Paramètres de confidentialité |

---

## Authentification

Toutes les routes protégées nécessitent le header :

```
Authorization: Bearer <access_token>
```

- Token d'accès : valide **1 heure**
- Token de rafraîchissement : valide **7 jours** (rotation activée)

---

## Tests

```bash
python manage.py test
```

---

## Administration

Interface admin Django : **http://localhost:8000/admin/**
