# Moodly

Réseau social orienté émotions — partagez vos humeurs, suivez vos proches, chattez en temps réel.

Moodly est une application full-stack composée d'un backend Django (API REST + WebSockets) et d'un frontend React/Vite. Les utilisateurs peuvent publier des posts taggés par émotion, partager des stories éphémères (24 h), envoyer des messages (texte, image, audio), recevoir des notifications en temps réel et gérer des comptes privés avec des demandes de suivi.

---

## Stack technique

| Couche | Technologie |
|---|---|
| **Backend** | Django 4.2.7, Django REST Framework 3.14, djangorestframework-simplejwt 5.3 |
| **WebSockets** | Django Channels 4.0, Daphne (ASGI), InMemoryChannelLayer (dev) |
| **Base de données** | SQLite (dev) — prête pour PostgreSQL (psycopg2-binary inclus) |
| **Médias** | Pillow 10.1 |
| **CORS** | django-cors-headers 4.3 |
| **Frontend** | React 19.1, Vite (rolldown-vite), react-router-dom 7.9 |
| **Style** | TailwindCSS 3.4 + plugins (forms, typography, aspect-ratio) |
| **HTTP** | Axios 1.13 |
| **Animations** | Framer Motion 12.23 |
| **Icônes** | Lucide React 0.54 |

---

## Architecture du monorepo

```
Moodly/
├── backend/                   # Projet Django (ASGI)
│   ├── social_app/            # Configuration principale (settings, urls, asgi)
│   ├── users/                 # Modèle User custom, auth, follow, comptes liés
│   ├── posts/                 # Posts, likes, commentaires, bookmarks
│   ├── stories/               # Stories éphémères 24 h
│   ├── chat/                  # Messagerie (texte/image/audio) + WebSocket
│   ├── notifications/         # Notifications polymorphes + WebSocket
│   ├── follow_requests/       # Demandes de suivi & paramètres de confidentialité
│   ├── media/                 # Uploads utilisateurs (ignoré par git)
│   ├── requirements.txt
│   └── manage.py
└── frontend/                  # Application React
    ├── src/
    │   ├── pages/             # Home, Login, Register, Profile, Explore, Messages…
    │   ├── components/        # Layout, Sidebar, PostCard, CreatePost, AccountManager…
    │   ├── contexts/          # AuthContext (JWT)
    │   ├── hooks/             # useNotifications (WebSocket)
    │   ├── services/          # api.js, storiesAPI.js
    │   └── assets/
    ├── package.json
    └── vite.config.js         # Proxy /api → localhost:8000
```

---

## Prérequis

- Python **3.10+**
- Node.js **18+** et npm
- Redis (optionnel — uniquement si vous basculez vers `RedisChannelLayer` en production)

---

## Installation rapide

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optionnel
python manage.py runserver
```

Le backend écoute sur **http://localhost:8000**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend écoute sur **http://localhost:3000**.

---

## Variables d'environnement

Après nettoyage des secrets (voir section ci-dessous), créez `backend/.env` à partir de `backend/.env.example` :

| Variable | Description |
|---|---|
| `SECRET_KEY` | Clé secrète Django |
| `DEBUG` | `True` en développement, `False` en production |
| `EMAIL_HOST_USER` | Adresse email expéditeur |
| `EMAIL_HOST_PASSWORD` | Mot de passe d'application Gmail |
| `ALLOWED_HOSTS` | Hôtes autorisés (ex. `localhost,127.0.0.1`) |

Créez `frontend/.env` à partir de `frontend/.env.example` :

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API (ex. `http://localhost:8000/api`) |
| `VITE_WS_URL` | URL WebSocket (ex. `ws://localhost:8000/ws`) |

---

## Fonctionnalités

- Authentification JWT avec vérification d'email
- Posts taggés par émotion (like, commentaire imbriqué, bookmark)
- Stories éphémères 24 h (type Instagram) avec vues et réponses
- Messagerie temps réel — texte, image, audio (WebSocket)
- Notifications temps réel polymorphes (like, commentaire, follow, message)
- Comptes privés avec système de demandes de suivi
- Gestion multi-comptes (basculer entre comptes liés)
- Recherche d'utilisateurs et suggestions

---

## Documentation détaillée

- [Backend — endpoints, WebSockets, structure des apps](backend/README.md)
- [Frontend — routing, composants, configuration](frontend/README.md)

---

## Améliorations prévues

- Déploiement cloud avec base de données PostgreSQL et Redis pour les WebSockets
- Migration des URLs API hardcodées vers des variables d'environnement (`VITE_API_URL`)
- Passage de `InMemoryChannelLayer` à `RedisChannelLayer` en production
- Découpage des grands composants (`Messages`, `Profile`, `PostCard`) en sous-composants
- Remplacement des styles inline dans `App.jsx` par des classes Tailwind
- `CORS_ALLOW_ALL_ORIGINS = False` en production

---

## Licence

À définir.
